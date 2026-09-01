// ============================================================
// DASHBOARD API ENDPOINTS
// PRD §5: all endpoints reuse the admin session and reject unauthenticated requests.
// ============================================================

import { validateAdminSession, getRecentFailedAdminAttempts } from '../core/db.js';
import { nowISO } from '../core/utils.js';

// ============================================================
// MIDDLEWARE: Auth Check
// ============================================================
async function checkAuth(request, env) {
  const token = request.headers.get('Cookie')?.match(/admin_session=([a-f0-9]+)/)?.[1];
  if (!token) return false;
  return validateAdminSession(env, token);
}

// ============================================================
// LIVE: GET /api/dashboard/live?since=<ISO>&limit=50
// FR-1: Real-time attack feed
// ============================================================
export async function handleDashboardLive(request, env, url) {
  const since = url.searchParams.get('since') || new Date(Date.now() - 86400000).toISOString();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  try {
    const result = await env.DB.prepare(
      `SELECT id, timestamp as ts, ip, country, city, region, asn, honeypot, attack_types, severity, latitude, longitude, method, path, query_string, threat_score, bot_score, cf_ray
       FROM attacks
       WHERE timestamp > ?
       ORDER BY created_at DESC
       LIMIT ?`
    ).bind(since, limit).all();

    const events = (result.results || []).map(r => ({
      id: r.id,
      ts: r.ts,
      ip: r.ip,
      country: r.country || 'Unknown',
      city: r.city || '',
      region: r.region || '',
      asn: r.asn || 'Unknown',
      honeypot: r.honeypot || 'openclaw',
      attack_types: (() => { try { return JSON.parse(r.attack_types || '[]'); } catch(_) { return []; } })(),
      severity: r.severity || 'CLEAN',
      lat: r.latitude ? parseFloat(r.latitude) : null,
      lng: r.longitude ? parseFloat(r.longitude) : null,
      cf_ray: r.cf_ray || '',
      method: r.method || 'GET',
      path: r.path || '/',
      query_string: r.query_string || '',
      threat_score: r.threat_score || 0,
      bot_score: r.bot_score ?? -1
    }));

    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ events: [], error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================================
// GEO: GET /api/dashboard/geo?window=10m|1h|24h&honeypot=&severity=
// FR-2: Global attack map
// ============================================================
export async function handleDashboardGeo(request, env, url) {
  const window = url.searchParams.get('window') || '1h';
  const honeypot = url.searchParams.get('honeypot') || '';
  const severity = url.searchParams.get('severity') || '';

  // Calculate time threshold
  let windowMs;
  switch (window) {
    case '10m': windowMs = 10 * 60 * 1000; break;
    case '1h': windowMs = 60 * 60 * 1000; break;
    case '24h': windowMs = 24 * 60 * 60 * 1000; break;
    default: windowMs = 60 * 60 * 1000;
  }
  const since = new Date(Date.now() - windowMs).toISOString();

  let query = `
    SELECT
      latitude,
      longitude,
      COUNT(*) as count,
      MAX(severity) as max_severity,
      COUNT(DISTINCT ip) as ip_count
    FROM attacks
    WHERE timestamp > ?
      AND latitude != ''
      AND longitude != ''
  `;
  const binds = [since];

  if (honeypot) {
    query += ` AND honeypot = ?`;
    binds.push(honeypot);
  }
  if (severity) {
    query += ` AND severity = ?`;
    binds.push(severity);
  }

  query += `
    GROUP BY latitude, longitude
    ORDER BY count DESC
    LIMIT 1000
  `;

  try {
    const result = await env.DB.prepare(query).bind(...binds).all();

    const points = (result.results || []).map(r => ({
      lat: parseFloat(r.latitude),
      lng: parseFloat(r.longitude),
      count: r.count,
      max_severity: r.max_severity,
      ip_count: r.ip_count
    })).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

    return new Response(JSON.stringify({ points }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ points: [], error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================================
// STATS: GET /api/dashboard/stats?window=24h
// FR-4: Stats cards & charts
// ============================================================
export async function handleDashboardStats(request, env, url) {
  const window = url.searchParams.get('window') || '24h';

  let windowMs;
  switch (window) {
    case '1h': windowMs = 60 * 60 * 1000; break;
    case '24h': windowMs = 24 * 60 * 60 * 1000; break;
    case '7d': windowMs = 7 * 24 * 60 * 60 * 1000; break;
    default: windowMs = 24 * 60 * 60 * 1000;
  }
  const since = new Date(Date.now() - windowMs).toISOString();

  try {
    // Total hits, unique IPs, critical events
    const [totalResult, uniqueResult, criticalResult] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as cnt FROM attacks WHERE timestamp > ?`).bind(since).first(),
      env.DB.prepare(`SELECT COUNT(DISTINCT ip) as cnt FROM attacks WHERE timestamp > ?`).bind(since).first(),
      env.DB.prepare(`SELECT COUNT(*) as cnt FROM attacks WHERE timestamp > ? AND severity = 'CRITICAL'`).bind(since).first()
    ]);

    // Rate per minute (last 5 minutes for real-time)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const rateResult = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM attacks WHERE timestamp > ?`
    ).bind(fiveMinAgo).first();
    const ratePerMin = Math.round((rateResult?.cnt || 0) / 5);

    // Trend: one grouped query instead of 24 sequential D1 round-trips.
    const trend = [];
    if (window === '24h' || window === '1h') {
      const trendSince = new Date(Date.now() - 24 * 3600000).toISOString();
      const grouped = await env.DB.prepare(`SELECT substr(timestamp,1,13) AS bucket, honeypot, COUNT(*) AS cnt FROM attacks WHERE timestamp > ? GROUP BY bucket, honeypot ORDER BY bucket`).bind(trendSince).all();
      const byBucket = {};
      for (const row of (grouped.results || [])) {
        byBucket[row.bucket] ||= {};
        byBucket[row.bucket][row.honeypot || 'openclaw'] = row.cnt;
      }
      for (let i = 23; i >= 0; i--) {
        const d = new Date(Date.now() - i * 3600000);
        const bucket = d.toISOString().slice(0, 13);
        trend.push({ hour: d.getHours(), ...(byBucket[bucket] || {}) });
      }
    }

    // Top attack types
    const topTypesResult = await env.DB.prepare(`
      SELECT attack_types, COUNT(*) as cnt
      FROM attacks
      WHERE timestamp > ?
      GROUP BY attack_types
      ORDER BY cnt DESC
      LIMIT 10
    `).bind(since).all();

    const topTypes = [];
    const typeMap = {};
    for (const row of (topTypesResult.results || [])) {
      try {
        const types = JSON.parse(row.attack_types || '[]');
        for (const t of types) {
          typeMap[t] = (typeMap[t] || 0) + row.cnt;
        }
      } catch(_) {}
    }
    for (const [type, count] of Object.entries(typeMap).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      topTypes.push({ type, count });
    }

    // Top countries
    const topCountriesResult = await env.DB.prepare(`
      SELECT country, COUNT(*) as cnt
      FROM attacks
      WHERE timestamp > ?
      GROUP BY country
      ORDER BY cnt DESC
      LIMIT 10
    `).bind(since).all();

    return new Response(JSON.stringify({
      total: totalResult?.cnt || 0,
      unique_ips: uniqueResult?.cnt || 0,
      critical: criticalResult?.cnt || 0,
      rate_per_min: ratePerMin,
      trend,
      top_types: topTypes,
      top_countries: (topCountriesResult.results || []).map(r => ({ country: r.country, count: r.cnt }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      total: 0, unique_ips: 0, critical: 0, rate_per_min: 0,
      trend: [], top_types: [], top_countries: [], error: e.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================================
// CHAIN: GET /api/dashboard/chain?ip=1.2.3.4
// FR-3: Attack chain view
// ============================================================
export async function handleDashboardChain(request, env, url) {
  const ip = url.searchParams.get('ip');
  if (!ip) {
    return new Response(JSON.stringify({ error: 'ip parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get all events for this IP
    const eventsResult = await env.DB.prepare(`
      SELECT timestamp as ts, honeypot, path, attack_types, severity
      FROM attacks
      WHERE ip = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(ip).all();

    const events = (eventsResult.results || []).map(r => ({
      ts: r.ts,
      honeypot: r.honeypot || 'openclaw',
      path: r.path,
      attack_types: (() => { try { return JSON.parse(r.attack_types || '[]'); } catch(_) { return []; } })(),
      severity: r.severity || 'CLEAN'
    }));

    // Get ASN
    const asnResult = await env.DB.prepare(`
      SELECT asn FROM attacks WHERE ip = ? AND asn != 'Unknown' LIMIT 1
    `).bind(ip).first();
    const asn = asnResult?.asn || 'Unknown';

    // Get related IPs (same ASN)
    let relatedIPs = [];
    if (asn !== 'Unknown') {
      const relatedResult = await env.DB.prepare(`
        SELECT DISTINCT ip, COUNT(*) as cnt
        FROM attacks
        WHERE asn = ? AND ip != ?
        GROUP BY ip
        ORDER BY cnt DESC
        LIMIT 10
      `).bind(asn, ip).all();
      relatedIPs = (relatedResult.results || []).map(r => ({ ip: r.ip, count: r.cnt }));
    }

    return new Response(JSON.stringify({
      ip,
      asn,
      events,
      related_ips: relatedIPs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ip, asn: 'Unknown', events: [], related_ips: [], error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================================
// ATTACK DETAIL: GET /api/dashboard/attack/:id
// FR-6: Event detail drawer
// ============================================================
export async function handleDashboardAttackDetail(request, env, url) {
  const id = url.pathname.split('/').pop();
  if (!id || isNaN(parseInt(id))) {
    return new Response(JSON.stringify({ error: 'valid attack id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const result = await env.DB.prepare(`
      SELECT * FROM attacks WHERE id = ?
    `).bind(parseInt(id)).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Attack not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      id: result.id,
      ip: result.ip,
      country: result.country,
      city: result.city,
      region: result.region,
      asn: result.asn,
      latitude: result.latitude,
      longitude: result.longitude,
      method: result.method,
      path: result.path,
      query_string: result.query_string,
      body: result.body,
      user_agent: result.user_agent,
      referer: result.referer,
      attack_types: (() => { try { return JSON.parse(result.attack_types || '[]'); } catch(_) { return []; } })(),
      severity: result.severity,
      raw_headers: (() => { try { return JSON.parse(result.raw_headers || '{}'); } catch(_) { return {}; } })(),
      cf_ray: result.cf_ray,
      threat_score: result.threat_score,
      bot_score: result.bot_score,
      honeypot: result.honeypot,
      timestamp: result.timestamp,
      created_at: result.created_at
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// CREDENTIALS: GET /api/dashboard/credentials?window=24h
// Returns aggregate intelligence only; identifier hashes and plaintext passwords are never exposed.
export async function handleDashboardCredentials(request, env, url) {
  const window = url.searchParams.get('window') || '24h';
  const windowMs = window === '7d' ? 7 * 86400000 : window === '1h' ? 3600000 : 86400000;
  const since = new Date(Date.now() - windowMs).toISOString();
  try {
    const [total, kinds, patterns, lengths, honeypots] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM credential_attempts WHERE timestamp > ?`).bind(since).first(),
      env.DB.prepare(`SELECT identifier_kind AS kind, COUNT(*) AS count FROM credential_attempts WHERE timestamp > ? GROUP BY identifier_kind ORDER BY count DESC LIMIT 10`).bind(since).all(),
      env.DB.prepare(`SELECT password_pattern AS pattern, COUNT(*) AS count FROM credential_attempts WHERE timestamp > ? GROUP BY password_pattern ORDER BY count DESC LIMIT 10`).bind(since).all(),
      env.DB.prepare(`SELECT password_length AS length, COUNT(*) AS count FROM credential_attempts WHERE timestamp > ? GROUP BY password_length ORDER BY length`).bind(since).all(),
      env.DB.prepare(`SELECT honeypot, COUNT(*) AS count FROM credential_attempts WHERE timestamp > ? GROUP BY honeypot ORDER BY count DESC`).bind(since).all()
    ]);
    return new Response(JSON.stringify({ total: total?.cnt || 0, kinds: kinds.results || [], patterns: patterns.results || [], lengths: lengths.results || [], honeypots: honeypots.results || [], redaction: 'Passwords are never stored; only length and pattern are retained.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ total: 0, kinds: [], patterns: [], lengths: [], honeypots: [], error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
