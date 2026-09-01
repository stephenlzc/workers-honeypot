// ============================================================
// WAF CLOSED-LOOP: feed honeypot telemetry into defensive controls.
// Phase 5: Cron queries D1 and optionally writes Cloudflare WAF rules.
// ============================================================

import { nowISO } from './utils.js';

// ─── Configuration ───
const DEFAULT_THRESHOLD = 10; // Hits in a 24-hour window.
const HIGH_SEVERITY_THRESHOLD = 3; // CRITICAL/HIGH event threshold.
const BATCH_SIZE = 100; // IPs per batch.
const RULE_NAME_PREFIX = 'Honeypot Block';
const IP_LIST_NAME = 'Honeypot Blocked IPs';

// ─── Severity levels that trigger blocking ───
const BLOCKABLE_SEVERITIES = ['CRITICAL', 'HIGH'];

// ============================================================
// D1: Query high-frequency attack IPs
// ============================================================
export async function getHighFrequencyIPs(env, options = {}) {
  const threshold = options.threshold || DEFAULT_THRESHOLD;
  const sevThreshold = options.sevThreshold || HIGH_SEVERITY_THRESHOLD;
  const windowHours = options.windowHours || 24;

  const since = new Date(Date.now() - windowHours * 3600000).toISOString();

  try {
    // Query 1: IPs with high hit count
    const highHitResult = await env.DB.prepare(`
      SELECT ip, COUNT(*) as cnt, MAX(severity) as max_severity, MAX(country) as country
      FROM attacks
      WHERE timestamp > ?
      GROUP BY ip
      HAVING cnt >= ?
      ORDER BY cnt DESC
      LIMIT ?
    `).bind(since, threshold, BATCH_SIZE).all();

    // Query 2: IPs with high-severity events
    const highSevResult = await env.DB.prepare(`
      SELECT ip, COUNT(*) as cnt, MAX(severity) as max_severity, MAX(country) as country
      FROM attacks
      WHERE timestamp > ? AND severity IN ('CRITICAL', 'HIGH')
      GROUP BY ip
      HAVING cnt >= ?
      ORDER BY cnt DESC
      LIMIT ?
    `).bind(since, sevThreshold, BATCH_SIZE).all();

    // Merge and deduplicate
    const ipMap = new Map();
    for (const row of [...(highHitResult.results || []), ...(highSevResult.results || [])]) {
      const existing = ipMap.get(row.ip);
      if (!existing || row.cnt > existing.cnt) {
        ipMap.set(row.ip, {
          ip: row.ip,
          count: row.cnt,
          max_severity: row.max_severity,
          country: row.country || 'Unknown'
        });
      }
    }

    return Array.from(ipMap.values()).sort((a, b) => b.count - a.count);
  } catch (e) {
    console.error('getHighFrequencyIPs error:', e);
    return [];
  }
}

// ============================================================
// Cloudflare API: IP Access Rules
// ============================================================

// Get Cloudflare headers
function getCFHeaders(env) {
  return {
    'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

// Check if IP is already blocked
async function isIPBlocked(env, ip) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/firewall/access_rules/rules?configuration.value=${ip}&mode=block`,
      { headers: getCFHeaders(env) }
    );
    const data = await response.json();
    return data.success && data.result && data.result.length > 0;
  } catch (e) {
    console.error('isIPBlocked error:', e);
    return false;
  }
}

// Add IP to block list
async function blockIP(env, ip, note = '') {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/firewall/access_rules/rules`,
      {
        method: 'POST',
        headers: getCFHeaders(env),
        body: JSON.stringify({
          mode: 'block',
          configuration: {
            target: 'ip',
            value: ip
          },
          notes: note || `${RULE_NAME_PREFIX} - ${nowISO()}`
        })
      }
    );
    const data = await response.json();
    return { success: data.success, errors: data.errors };
  } catch (e) {
    console.error('blockIP error:', e);
    return { success: false, errors: [e.message] };
  }
}

// ============================================================
// Dry-run mode: Generate block list without executing
// ============================================================
export async function generateBlockList(env, options = {}) {
  const ips = await getHighFrequencyIPs(env, options);

  const blockList = [];
  for (const item of ips) {
    const alreadyBlocked = await isIPBlocked(env, item.ip);
    blockList.push({
      ip: item.ip,
      count: item.count,
      max_severity: item.max_severity,
      country: item.country,
      already_blocked: alreadyBlocked,
      action: alreadyBlocked ? 'skip' : 'block'
    });
  }

  return {
    timestamp: nowISO(),
    total_ips: blockList.length,
    to_block: blockList.filter(b => b.action === 'block').length,
    already_blocked: blockList.filter(b => b.already_blocked).length,
    items: blockList
  };
}

// ============================================================
// Execute blocking
// ============================================================
export async function executeBlockList(env, blockList, options = {}) {
  const dryRun = options.dryRun !== false; // Default to dry-run
  const results = [];

  for (const item of blockList.items) {
    if (item.action === 'skip') {
      results.push({ ip: item.ip, status: 'skipped', reason: 'already blocked' });
      continue;
    }

    if (dryRun) {
      results.push({ ip: item.ip, status: 'dry_run', reason: 'would block' });
      continue;
    }

    const result = await blockIP(env, item.ip, `Honeypot: ${item.count} hits, severity: ${item.max_severity}`);
    results.push({
      ip: item.ip,
      status: result.success ? 'blocked' : 'failed',
      errors: result.errors
    });

    // Rate limit: 1 request per 100ms
    await new Promise(r => setTimeout(r, 100));
  }

  return {
    timestamp: nowISO(),
    dry_run: dryRun,
    total: results.length,
    blocked: results.filter(r => r.status === 'blocked').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    results
  };
}

// ============================================================
// Cron Handler: Main entry point for scheduled task
// ============================================================
export async function handleCronTrigger(env, options = {}) {
  console.log(`[WAF] Cron trigger started at ${nowISO()}`);

  const dryRun = options.dryRun !== false;
  const threshold = options.threshold || DEFAULT_THRESHOLD;
  const sevThreshold = options.sevThreshold || HIGH_SEVERITY_THRESHOLD;

  // Generate block list
  const blockList = await generateBlockList(env, { threshold, sevThreshold });

  console.log(`[WAF] Found ${blockList.total_ips} IPs to process (${blockList.to_block} to block)`);

  // Execute blocking
  const result = await executeBlockList(env, blockList, { dryRun });

  console.log(`[WAF] Completed: ${result.blocked} blocked, ${result.failed} failed, ${result.skipped} skipped`);

  return result;
}

// ============================================================
// WAF Status API: Check current block status
// ============================================================
export async function getWAFStatus(env) {
  try {
    // Get current blocked IPs from Cloudflare
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/firewall/access_rules/rules?mode=block&per_page=100`,
      { headers: getCFHeaders(env) }
    );
    const data = await response.json();

    if (!data.success) {
      return { error: 'Failed to fetch WAF rules', errors: data.errors };
    }

    const honeypotRules = (data.result || []).filter(r =>
      r.notes && r.notes.includes(RULE_NAME_PREFIX)
    );

    return {
      timestamp: nowISO(),
      total_blocked: data.result?.length || 0,
      honeypot_blocked: honeypotRules.length,
      rules: honeypotRules.map(r => ({
        ip: r.configuration.value,
        notes: r.notes,
        created: r.created_on,
        modified: r.modified_on
      }))
    };
  } catch (e) {
    return { error: e.message };
  }
}
