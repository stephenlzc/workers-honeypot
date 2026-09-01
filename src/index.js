// ============================================================
// LAB-HONEYPOT - Multi-theme Honeypot Platform
// Entry point: Router dispatches to skins by hostname/path
// ============================================================

import { getClientIP, getCountry, getASN, getCFMeta, getAllHeaders, escapeHtml, truncate, nowISO, toCST } from './core/utils.js';
import { analyzeRequest } from './core/analyze.js';
import { logRequest, isIPBanned, banIP, unbanIPDB, getRecentFailedAdminAttempts, recordAdminAttempt, createAdminSession, validateAdminSession, getAttacks, getAttackStats, getIPBans } from './core/db.js';
import { HONEYPOT_VERSION, FAKE_NODE_VERSION, TRAP_PATHS, fakeStatusJSON, fakeHealthJSON, fakeSessionsJSON, fakeChannelsJSON, fakeConfigJSON, fakeKeysJSON, fakeMetricsJSON, fakeSkillsJSON, fakeLogsResponse, fakeMessagesResponse, fakeOpenAICompatResponse, fakeEnvContent, fakeApplyPatchResponse, fakeExecResponse, fakeExecApprovalsResponse, fakeWebhookResponse, fakeAgentMemoryResponse, fakeMemoryExportResponse, FAKE_FS } from './skins/openclaw.js';
import { htmlDashboard } from './skins/openclaw-dashboard.js';
import { executeShellCommand } from './skins/shell.js';
import { handleMCPRoute, getMCPFingerprint } from './skins/mcp.js';
import { handleLangflowRoute } from './skins/langflow.js';
import { handleN8nRoute } from './skins/n8n.js';
import { htmlConsole } from './dashboard/console.html.js';
import { handleDashboardLive, handleDashboardGeo, handleDashboardStats, handleDashboardChain, handleDashboardAttackDetail, handleDashboardCredentials } from './dashboard/api.js';

// ============================================================
// ADMIN HTML TEMPLATES
// ============================================================
function htmlAdminLogin(error=null,attemptsLeft=null){
  const errBlock=error?`<div class="msg-error">${escapeHtml(error)}</div>`:'';
  const warnBlock=attemptsLeft!==null?`<div class="msg-warn">Warning: ${attemptsLeft} attempt(s) remaining before IP ban.</div>`:'';
  return`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f5f5f5;color:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:40px;width:100%;max-width:380px;box-shadow:0 1px 3px rgba(0,0,0,.08)}h1{font-size:20px;font-weight:600;margin-bottom:6px;text-align:center}.sub{font-size:13px;color:#666;text-align:center;margin-bottom:28px}label{display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:#333}input[type=password]{width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;transition:.15s;background:#fff}input[type=password]:focus{border-color:#111;box-shadow:0 0 0 2px rgba(0,0,0,.07)}button{width:100%;padding:11px;background:#111;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;margin-top:16px;transition:.15s}button:hover{background:#333}.msg-error{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px}.msg-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px}.footer{text-align:center;margin-top:20px;font-size:12px;color:#999}</style>
</head><body><div class="card"><h1>Admin Panel</h1><p class="sub">OpenClaw Honeypot Management</p>${errBlock}${warnBlock}
<form method="POST" action="/admin/login"><label for="pw">Access Password</label><input type="password" id="pw" name="password" placeholder="Enter password" required autofocus><button type="submit">Sign In</button></form>
<div class="footer">Access is logged and monitored.</div></div></body></html>`;
}

function htmlAdminDashboard(stats,attacks,bans,page,totalPages,filters){
  const sc=(s)=>`<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${escapeHtml(s)};color:${escapeHtml(s)}">${escapeHtml(s)}</span>`;
  const bySevMap={};for(const r of stats.bySeverity||[])bySevMap[r.severity]=r.cnt;

  const attackRows=attacks.map(a=>{
    const types=(()=>{try{return JSON.parse(a.attack_types||'[]');}catch(_){return[];}})();
    const visibleTypes=types.slice(0,3);
    const hiddenCount=types.length-visibleTypes.length;
    const typeTip=types.join('\n');
    const typeStr=types.length>0
      ?`<span class="tip" data-tip="${escapeHtml(typeTip)}">${visibleTypes.map(t=>`<span style="font-size:10px;padding:1px 6px;background:#f3f4f6;border-radius:4px;color:#374151;margin-right:3px">${escapeHtml(t)}</span>`).join('')}${hiddenCount>0?`<span style="font-size:10px;color:#6b7280">+${hiddenCount}</span>`:''}</span>`
      :'<span style="color:#9ca3af;font-size:12px">-</span>';
    const locStr = [a.city,a.region,a.country].filter(Boolean).join(', ') || (a.country||'-');
    const fullLoc = [a.city,a.region,a.country,a.asn,a.latitude&&a.longitude?`${a.latitude},${a.longitude}`:''].filter(Boolean).join('\n');
    const threatBadge = a.threat_score>50 ? `<span style="font-size:10px;padding:1px 5px;background:#fef2f2;color:#dc2626;border-radius:3px;margin-left:4px">${a.threat_score}</span>` : (a.threat_score>0?`<span style="font-size:10px;color:#9ca3af;margin-left:4px">${a.threat_score}</span>`:'');
    const bodyTip = a.body ? `Path: ${a.path}\nQuery: ${a.query_string||'-'}\nBody:\n${a.body}` : `Path: ${a.path}\nQuery: ${a.query_string||'-'}`;
    const uaTip = [a.user_agent, a.cf_ray?`CF-Ray: ${a.cf_ray}`:''].filter(Boolean).join('\n');
    const honeypotBadge = a.honeypot ? `<span style="font-size:10px;padding:1px 5px;background:#eff6ff;color:#3b82f6;border-radius:3px;margin-left:4px">${escapeHtml(a.honeypot)}</span>` : '';
    return`<tr>
<td>${a.id}</td>
<td style="font-family:monospace;font-size:12px">${escapeHtml(a.ip)}${threatBadge}</td>
<td class="tip" data-tip="${escapeHtml(fullLoc)}" style="font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(locStr)}</td>
<td style="font-weight:600;font-size:11px;color:${a.method==='POST'?'#d97706':'#2563eb'}">${escapeHtml(a.method)}</td>
<td class="tip" data-tip="${escapeHtml(bodyTip)}" style="font-family:monospace;font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(a.path)}</td>
<td>${typeStr}</td>
<td>${sc(a.severity||'CLEAN')}</td>
<td style="color:#6b7280;font-size:12px;white-space:nowrap">${toCST(a.timestamp)}</td>
<td class="tip" data-tip="${escapeHtml(uaTip)}" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#9ca3af;font-size:11px">${escapeHtml((a.user_agent||'').slice(0,50))}</td>
<td>${honeypotBadge}</td>
</tr>`;
  }).join('');

  const banRows=bans.map(b=>`<tr><td style="font-family:monospace;font-size:12px">${escapeHtml(b.ip)}</td><td style="font-size:12px;color:#6b7280">${escapeHtml(b.reason||'-')}</td><td style="font-size:12px;color:#6b7280">${(b.banned_until||'').slice(0,19).replace('T',' ')}</td><td><form method="POST" action="/admin/unban" style="margin:0"><input type="hidden" name="ip" value="${escapeHtml(b.ip)}"><button type="submit" style="padding:3px 10px;font-size:11px;background:#fff;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;color:#374151">Unban</button></form></td></tr>`).join('');

  const pgLinks=[];
  for(let i=1;i<=Math.min(totalPages,10);i++){
    const p=new URLSearchParams({...filters,page:i});const active=i===page;
    pgLinks.push(`<a href="/admin/dashboard?${p}" style="padding:5px 11px;border:1px solid ${active?'#111':'#e0e0e0'};border-radius:6px;font-size:13px;background:${active?'#111':'#fff'};color:${active?'#fff':'#333'};text-decoration:none">${i}</a>`);
  }

  return`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard - Admin</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f5f5f5;color:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px}.topbar{background:#111;color:#fff;padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}.topbar-left{font-weight:600;font-size:15px}.topbar-right{display:flex;align-items:center;gap:16px;font-size:13px}.topbar-right a{color:#ccc;text-decoration:none}.topbar-right a:hover{color:#fff}.main{max-width:1400px;margin:0 auto;padding:24px}.stats-row{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px}.scard{background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:16px 20px}.scard-label{font-size:12px;color:#6b7280;margin-bottom:4px}.scard-value{font-size:26px;font-weight:700;line-height:1.2}.section{background:#fff;border:1px solid #e0e0e0;border-radius:10px;margin-bottom:24px;overflow:hidden}.section-header{padding:14px 20px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between}.section-title{font-size:14px;font-weight:600}.filter-form{display:flex;gap:10px;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;background:#fafafa}.filter-form input,.filter-form select{padding:7px 11px;border:1px solid #d1d5db;border-radius:7px;font-size:13px;outline:none;background:#fff}.filter-form button{padding:7px 16px;background:#111;color:#fff;border:none;border-radius:7px;font-size:13px;cursor:pointer}.filter-form a{padding:7px 14px;border:1px solid #d1d5db;border-radius:7px;font-size:13px;color:#374151;text-decoration:none;background:#fff}table{width:100%;border-collapse:collapse}th{text-align:left;padding:9px 14px;font-size:12px;font-weight:600;color:#6b7280;border-bottom:1px solid #e0e0e0;background:#fafafa;white-space:nowrap}td{padding:9px 14px;border-bottom:1px solid #f3f4f6;vertical-align:middle}tr:hover td{background:#fafafa}tr:last-child td{border-bottom:none}.pagination{display:flex;gap:4px;padding:14px 20px;justify-content:center}.empty{padding:24px;text-align:center;color:#9ca3af;font-size:13px}#ttp{position:fixed;background:#1f2937;color:#f3f4f6;padding:8px 12px;border-radius:7px;font-size:12px;max-width:480px;word-break:break-all;line-height:1.7;z-index:9999;pointer-events:none;display:none;box-shadow:0 4px 16px rgba(0,0,0,.35);white-space:pre-wrap;border:1px solid #374151}
.tip{cursor:default}
</style>
</head><body>
<div class="topbar"><div class="topbar-left">OpenClaw Honeypot &mdash; Admin</div><div class="topbar-right"><a href="/admin/console" style="color:#22d3ee;font-weight:600">Console</a><a href="/admin/dashboard" class="nav-active" aria-current="page">Attacks <span style="font-size:10px;opacity:.7">(table)</span></a><a href="/admin/logout" class="logout-btn">Sign Out</a></div></div>
<div class="main">
  <div class="stats-row">
    <div class="scard"><div class="scard-label">Total Records</div><div class="scard-value">${stats.total||0}</div></div>
    <div class="scard"><div class="scard-label">Last 24h</div><div class="scard-value">${stats.recent24h||0}</div></div>
    <div class="scard"><div class="scard-label" style="color:#dc2626">Critical</div><div class="scard-value" style="color:#dc2626">${bySevMap['CRITICAL']||0}</div></div>
    <div class="scard"><div class="scard-label" style="color:#ef4444">High</div><div class="scard-value" style="color:#ef4444">${bySevMap['HIGH']||0}</div></div>
    <div class="scard"><div class="scard-label" style="color:#f59e0b">Medium</div><div class="scard-value" style="color:#f59e0b">${bySevMap['MEDIUM']||0}</div></div>
  </div>
  <div class="section">
    <div class="section-header"><span class="section-title">Attack Log</span><span style="font-size:12px;color:#6b7280">${stats.total||0} records &mdash; page ${page}/${totalPages||1} · <a href="/admin/console" style="color:#0891b2;font-weight:600;text-decoration:none">Open visual console →</a></span></div>
    <form class="filter-form" method="GET" action="/admin/dashboard">
      <input type="text" name="ip" placeholder="Filter IP" value="${escapeHtml(filters.ip||'')}">
      <select name="severity"><option value="ALL" ${!filters.severity||filters.severity==='ALL'?'selected':''}>All Severity</option>${['CRITICAL','HIGH','MEDIUM','LOW','CLEAN'].map(s=>`<option value="${s}" ${filters.severity===s?'selected':''}>${s}</option>`).join('')}</select>
      <select name="type"><option value="ALL" ${!filters.type||filters.type==='ALL'?'selected':''}>All Types</option>${['SQL_INJECTION','XSS','PATH_TRAVERSAL','COMMAND_INJECTION','SSRF','TEMPLATE_INJECTION','LOG4SHELL','SPRINGSHELL','SCANNER','SUSPICIOUS_UA','CONFIG_ACCESS','API_KEYS_ACCESS','SHELL_EXECUTE','SSH_KEY_ACCESS','BASH_HISTORY_ACCESS','OPENAI_API_ABUSE','CVE_2026_25253_GATEWAY_URL','CVE_2026_28464_PATH_TRAVERSAL','STOLEN_TOKEN_USE','AUTH_BYPASS_ATTEMPT','PATH_TRAVERSAL_ATTEMPT','EXEC_APPROVAL_BYPASS','WEBHOOK_NO_AUTH','MEMORY_ACCESS','MEMORY_EXPORT','SSRF_GATEWAY_REDIRECT'].map(t=>`<option value="${t}" ${filters.type===t?'selected':''}>${t}</option>`).join('')}</select>
      <input type="date" name="dateFrom" value="${escapeHtml(filters.dateFrom||'')}"><input type="date" name="dateTo" value="${escapeHtml(filters.dateTo||'')}">
      <button type="submit">Filter</button><a href="/admin/dashboard">Reset</a><a href="/admin/export?${new URLSearchParams(filters)}">Export CSV</a>
    </form>
    ${attacks.length===0?'<div class="empty">No records found.</div>':`<div style="overflow-x:auto"><table><thead><tr><th>#</th><th>IP (Threat)</th><th>Location</th><th>Method</th><th>Path</th><th>Attack Types</th><th>Severity</th><th>Time (UTC)</th><th>User-Agent</th><th>Honeypot</th></tr></thead><tbody>${attackRows}</tbody></table></div><div class="pagination">${pgLinks.join('')}</div>`}
  </div>
  <div class="section">
    <div class="section-header"><span class="section-title">Top Attacking IPs</span></div>
    ${stats.topIPs&&stats.topIPs.length>0?`<div style="overflow-x:auto"><table><thead><tr><th>IP</th><th>Country</th><th>Requests</th><th>Action</th></tr></thead><tbody>${stats.topIPs.map(r=>`<tr><td style="font-family:monospace;font-size:12px">${escapeHtml(r.ip)}</td><td>${escapeHtml(r.country||'-')}</td><td style="font-weight:600">${r.cnt}</td><td><form method="POST" action="/admin/ban" style="margin:0"><input type="hidden" name="ip" value="${escapeHtml(r.ip)}"><button type="submit" style="padding:3px 10px;font-size:11px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;cursor:pointer;color:#dc2626">Ban IP</button></form></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No data yet.</div>'}
  </div>
  <div class="section">
    <div class="section-header"><span class="section-title">Active IP Bans</span></div>
    ${bans.length===0?'<div class="empty">No active bans.</div>':`<div style="overflow-x:auto"><table><thead><tr><th>IP</th><th>Reason</th><th>Expires (UTC)</th><th>Action</th></tr></thead><tbody>${banRows}</tbody></table></div>`}
  </div>
</div>
<div id="ttp"></div>
<script>
(function(){
  var tip=document.getElementById('ttp');
  var cur=null;
  function show(el,e){tip.textContent=el.dataset.tip;tip.style.display='block';move(e);}
  function move(e){
    var x=e.clientX+14,y=e.clientY+14;
    var tw=tip.offsetWidth,th=tip.offsetHeight;
    if(x+tw>window.innerWidth-8)x=e.clientX-tw-10;
    if(y+th>window.innerHeight-8)y=e.clientY-th-10;
    tip.style.left=x+'px';tip.style.top=y+'px';
  }
  function hide(){tip.style.display='none';}
  document.addEventListener('mouseover',function(e){
    var el=e.target.closest('[data-tip]');
    if(el&&el!==cur){cur=el;show(el,e);}
    else if(!el&&cur){cur=null;hide();}
  });
  document.addEventListener('mousemove',function(e){if(cur)move(e);});
  document.addEventListener('mouseout',function(e){
    if(!e.relatedTarget||!e.relatedTarget.closest('[data-tip]')){cur=null;hide();}
  });
})();
</script>
</body></html>`;
}

// ============================================================
// ADMIN HANDLER
// ============================================================
async function handleAdmin(request, env, url) {
  const path = url.pathname;
  const ip = getClientIP(request);

  if (path === '/admin/logout') {
    return new Response(null, { status: 302, headers: { Location: '/admin', 'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0' } });
  }

  const token = request.headers.get('Cookie')?.match(/admin_session=([a-f0-9]+)/)?.[1];
  const isAuth = await validateAdminSession(env, token);

  if (path === '/admin' || path === '/admin/') {
    if (isAuth) return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });
    const setupMessage = env.ADMIN_PASSWORD ? null : 'Admin password is not configured. Set the ADMIN_PASSWORD secret before signing in.';
    return new Response(htmlAdminLogin(setupMessage), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  if (path === '/admin/login' && request.method === 'POST') {
    if (await isIPBanned(env, ip)) {
      return new Response(htmlAdminLogin('Your IP is banned due to too many failed attempts.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    const body = await request.formData().catch(() => new FormData());
    const pw = body.get('password') || '';
    const adminPw = env.ADMIN_PASSWORD;
    if (!adminPw) {
      return new Response(htmlAdminLogin('Admin password not configured. Set ADMIN_PASSWORD secret.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    if (pw === adminPw) {
      await recordAdminAttempt(env, ip, true);
      const t = await createAdminSession(env, ip);
      // Dashboard APIs live under /api/dashboard, so the session must be sent to
      // both /admin/* pages and /api/* requests.
      return new Response(null, { status: 302, headers: { Location: '/admin/dashboard', 'Set-Cookie': `admin_session=${t}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600` } });
    }
    await recordAdminAttempt(env, ip, false);
    const failed = await getRecentFailedAdminAttempts(env, ip);
    if (failed >= 5) {
      await banIP(env, ip, `Admin panel brute force: ${failed} failed attempts`);
      return new Response(htmlAdminLogin('Too many failed attempts. IP banned for 24 hours.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response(htmlAdminLogin('Incorrect password.', 5 - failed), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  if (!isAuth) return new Response(null, { status: 302, headers: { Location: '/admin' } });

  if (path === '/admin/dashboard') {
    const p = parseInt(url.searchParams.get('page') || '1', 10);
    const filters = { ip: url.searchParams.get('ip')||'', severity: url.searchParams.get('severity')||'ALL', type: url.searchParams.get('type')||'ALL', dateFrom: url.searchParams.get('dateFrom')||'', dateTo: url.searchParams.get('dateTo')||'' };
    const [st, ar, br] = await Promise.all([getAttackStats(env), getAttacks(env, p, filters), getIPBans(env)]);
    return new Response(htmlAdminDashboard(st, ar.rows, br, p, ar.pages, filters), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  if (path === '/admin/ban' && request.method === 'POST') {
    const body = await request.formData().catch(() => new FormData());
    const tip = body.get('ip');
    if (tip) await banIP(env, tip, 'Manually banned by admin');
    return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });
  }

  if (path === '/admin/unban' && request.method === 'POST') {
    const body = await request.formData().catch(() => new FormData());
    const tip = body.get('ip');
    if (tip) await unbanIPDB(env, tip);
    return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });
  }

  if (path === '/admin/export') {
    const filters = { ip: url.searchParams.get('ip')||'', severity: url.searchParams.get('severity')||'ALL', type: url.searchParams.get('type')||'ALL', dateFrom: url.searchParams.get('dateFrom')||'', dateTo: url.searchParams.get('dateTo')||'' };
    let rows = [];
    try {
      const all = await env.DB.prepare(`SELECT id,ip,country,method,path,attack_types,severity,timestamp,user_agent,honeypot FROM attacks ORDER BY created_at DESC LIMIT 1000`).all();
      rows = all.results || [];
    } catch(_){}
    const header = 'id,ip,country,method,path,attack_types,severity,timestamp,user_agent,honeypot\n';
    const csv = rows.map(r => [r.id,r.ip,r.country,r.method,`"${(r.path||'').replace(/"/g,'""')}"`,`"${(r.attack_types||'').replace(/"/g,'""')}"`,r.severity,r.timestamp,`"${(r.user_agent||'').replace(/"/g,'""')}"`,r.honeypot||''].join(',')).join('\n');
    return new Response(header+csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="honeypot-${new Date().toISOString().slice(0,10)}.csv"` } });
  }

  // ─── Console ───
  if (path === '/admin/console') {
    return new Response(htmlConsole(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // ─── Dashboard API (shared admin-session authentication) ───
  if (path.startsWith('/api/dashboard/')) {
    if (!isAuth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    if (path === '/api/dashboard/live') return handleDashboardLive(request, env, url);
    if (path === '/api/dashboard/geo') return handleDashboardGeo(request, env, url);
    if (path === '/api/dashboard/stats') return handleDashboardStats(request, env, url);
    if (path === '/api/dashboard/chain') return handleDashboardChain(request, env, url);
    if (path === '/api/dashboard/credentials') return handleDashboardCredentials(request, env, url);
    if (path.startsWith('/api/dashboard/attack/')) return handleDashboardAttackDetail(request, env, url);

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  // ─── WAF API (Phase 5: honeypot telemetry feedback) ───
  if (path.startsWith('/api/waf/')) {
    if (!isAuth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const { generateBlockList, getWAFStatus, executeBlockList } = await import('./core/waf.js');

    if (path === '/api/waf/block-list') {
      // Generate block list (dry-run by default)
      const threshold = parseInt(url.searchParams.get('threshold') || '10', 10);
      const sevThreshold = parseInt(url.searchParams.get('sev_threshold') || '3', 10);
      const result = await generateBlockList(env, { threshold, sevThreshold });
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (path === '/api/waf/execute' && request.method === 'POST') {
      // Execute blocking (requires explicit confirmation)
      const body = await request.json().catch(() => ({}));
      if (!body.confirm || body.confirm !== true) {
        return new Response(JSON.stringify({ error: 'Must set confirm: true to execute' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const dryRun = env.DRY_RUN !== 'false';
      const threshold = body.threshold || 10;
      const sevThreshold = body.sev_threshold || 3;
      const blockList = await generateBlockList(env, { threshold, sevThreshold });
      const result = await executeBlockList(env, blockList, { dryRun });
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (path === '/api/waf/status') {
      const result = await getWAFStatus(env);
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('Not Found', { status: 404 });
}

// ============================================================
// OPENCLAW SKIN HANDLER
// ============================================================
const OCFW_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'X-OpenClaw-Version': HONEYPOT_VERSION,
  'X-Gateway-ID': 'ocgw-vps-prod-01',
  'X-Powered-By': `OpenClaw/${HONEYPOT_VERSION}`,
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss: blob: data:; connect-src *",
  'X-Frame-Options': 'SAMEORIGIN',
};

async function handleOpenclawSkin(request, env, url, ip, attackInfo) {
  const path = url.pathname;
  const uptimeMs = Date.now() - getFakeStartTime().getTime();
  const trap = TRAP_PATHS[path];

  const hdrs = (extra={}) => ({ ...OCFW_HEADERS, ...extra });
  const json = (data, status=200) => new Response(JSON.stringify(data), { status, headers: hdrs() });

  // CVE-2026-25253: gatewayUrl parameter — simulate token leakage to attacker-controlled endpoint
  const gatewayUrl = url.searchParams.get('gatewayUrl');
  if (gatewayUrl) {
    const fakeToken = 'ocgw-demo-token-not-real';
    const fakeVer = HONEYPOT_VERSION;
    const authPayload = JSON.stringify({ type: 'auth', token: fakeToken, version: fakeVer, gateway_id: 'ocgw-vps-prod-01', ts: Date.now() });
    // Render a page that auto-connects to attacker's WebSocket, sending the token
    return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>OpenClaw Gateway</title></head><body>
<script>
(function(){
  var gwUrl = ${JSON.stringify(gatewayUrl)};
  var payload = ${authPayload};
  try {
    var wsUrl = gwUrl.replace(/^https?:\/\//,'wss://').replace(/^wss?:\/\//,'ws://');
    if(!/^wss?:\/\//i.test(gwUrl)) wsUrl = 'ws://' + gwUrl.replace(/.*:\/\//,'');
    var ws = new WebSocket(wsUrl + (wsUrl.indexOf('?')===-1?'?':'&') + 'token=' + payload.token);
    ws.onopen = function(){ ws.send(JSON.stringify(payload)); };
    ws.onerror = function(){
      fetch(gwUrl, {method:'POST',headers:{'Content-Type':'application/json','X-OpenClaw-Token':payload.token},body:JSON.stringify(payload),mode:'no-cors'}).catch(function(){});
    };
  } catch(e) {
    fetch(gwUrl, {method:'POST',headers:{'Content-Type':'application/json','X-OpenClaw-Token':payload.token},body:JSON.stringify(payload),mode:'no-cors'}).catch(function(){});
  }
  setTimeout(function(){ window.location.href = '/'; }, 1500);
})();
</script>
<p style="font-family:sans-serif;color:#333;padding:40px">Connecting to gateway...</p>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-OpenClaw-Version': HONEYPOT_VERSION } });
  }

  // CVE-2026-28464: sessionId / sessionFile path traversal
  const sessionId = url.searchParams.get('sessionId') || url.searchParams.get('session_id');
  const sessionFile = url.searchParams.get('sessionFile') || url.searchParams.get('session_file');
  const traversalParam = sessionId || sessionFile;
  if (traversalParam && (traversalParam.includes('..') || traversalParam.startsWith('/'))) {
    // Serve fake sensitive file based on common traversal targets
    const tp = traversalParam.replace(/\.\.\//g,'').replace(/^\/+/,'');
    let fakeContent = '';
    if (tp.includes('passwd') || tp === 'etc/passwd') fakeContent = FAKE_FS['/etc/passwd'];
    else if (tp.includes('id_rsa') && !tp.includes('.pub')) fakeContent = FAKE_FS['/root/.ssh/id_rsa'];
    else if (tp.includes('bashrc') || tp.includes('bash_history')) fakeContent = FAKE_FS['/root/.bash_history'];
    else if (tp.includes('.env')) fakeContent = fakeEnvContent();
    else if (tp.includes('openclaw.json') || tp.includes('openclaw')) fakeContent = FAKE_FS['/root/.openclaw/openclaw.json'];
    else if (tp.includes('config')) fakeContent = FAKE_FS['/root/config.json'];
    else fakeContent = `session=${traversalParam}\nstatus=active\nmodel=claude-opus-4-5\ntoken=ocgw-demo-token-not-real\n`;
    return new Response(fakeContent, { headers: { 'Content-Type': 'text/plain', 'X-OpenClaw-Version': HONEYPOT_VERSION } });
  }

  // Main dashboard
  if (path === '/' || path === '/index.html') {
    return new Response(htmlDashboard(uptimeMs), { headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-OpenClaw-Version': HONEYPOT_VERSION,
      'X-Powered-By': `OpenClaw/${HONEYPOT_VERSION}`,
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: ws: wss: blob: data:; connect-src *",
      'X-Frame-Options': 'SAMEORIGIN',
    }});
  }

  // Login redirect
  if (path === '/login') {
    if (request.method === 'POST') {
      const body = await request.text().catch(() => '');
      return json({ error: 'invalid_credentials', message: 'Authentication failed.' }, 401);
    }
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  // CVE-2026-28472: WebSocket auth bypass — accepts any token, logs the attempt
  if (path === '/ws' || path === '/ws/control' || path === '/api/v1/ws') {
    // Return a realistic WebSocket upgrade rejection with auth token hint
    return new Response(JSON.stringify({
      error: 'websocket_required',
      message: 'Upgrade required. Connect via WebSocket with Authorization header or ?token= query param.',
      hint: 'ws://gateway.example.com/ws?token=<gateway_token>',
      docs: 'https://docs.openclaw.ai/gateway/websocket',
      version: HONEYPOT_VERSION,
    }), { status: 426, headers: { ...OCFW_HEADERS, 'Upgrade': 'websocket', 'Connection': 'Upgrade' }});
  }

  // OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': '*' } });
  }

  // robots.txt
  if (path === '/robots.txt') {
    return new Response(`User-agent: *\nDisallow: /api/\nDisallow: /.openclaw/\nDisallow: /.env\nDisallow: /.ssh/\nDisallow: /admin\nDisallow: /webhooks/\n\n# OpenClaw Gateway ${HONEYPOT_VERSION}\n# Sensitive endpoints (do not crawl):\n# /api/v1/keys\n# /api/v1/config\n# /api/v1/shell/execute\n# /api/v1/agent/memory/export\n# /api/v1/exec/execute\n# /api/v1/agent/apply_patch\n# /.openclaw/openclaw.json\n`, { headers: { 'Content-Type': 'text/plain' } });
  }

  // Health endpoint
  if (path === '/health') return json(fakeHealthJSON(uptimeMs));

  // OpenAI-compatible endpoint
  if (path === '/v1/chat/completions') {
    const body = await request.text().catch(() => '{}');
    return json(fakeOpenAICompatResponse(body));
  }

  // Shell execute - POST (with fake execution delay to appear realistic)
  if ((path === '/api/v1/shell/execute' || path === '/api/v1/shell') && request.method === 'POST') {
    const bodyText = await request.text().catch(() => '{}');
    let cmd = '';
    try { cmd = JSON.parse(bodyText).cmd || JSON.parse(bodyText).command || ''; } catch(_){}
    if (!cmd) return json({ error: 'missing_param', message: 'cmd is required' }, 400);
    const result = executeShellCommand(cmd);
    await new Promise(r => setTimeout(r, 80 + Math.floor(Math.random() * 120)));
    return json({ stdout: result.stdout, stderr: result.stderr, exit_code: result.exit_code, session: 'main', timestamp: nowISO() });
  }

  // GHSA-6mgf-v5j7-45cr: Gateway fetch/redirect SSRF trap
  if (path === '/api/v1/gateway/fetch' || path === '/api/v1/gateway/redirect') {
    const targetUrl = url.searchParams.get('url') || url.searchParams.get('target') || url.searchParams.get('redirect') || '';
    const bodyText = request.method === 'POST' ? await request.text().catch(() => '{}') : '{}';
    let bodyTarget = '';
    try { bodyTarget = JSON.parse(bodyText).url || JSON.parse(bodyText).target || ''; } catch(_){}
    const ssrfTarget = targetUrl || bodyTarget;
    // Simulate a real fetch response (with auth header forwarded — the actual vulnerability)
    return json({
      status: 200, ok: true, url: ssrfTarget,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ forwarded: true, auth_header_forwarded: true, token: 'ocgw-demo-token-not-real' }),
      note: 'Authorization header was forwarded to redirect target (CVE GHSA-6mgf-v5j7-45cr)',
    });
  }

  // File traps served as plain text
  if (path === '/.env' || path === '/.env.local' || path === '/.env.production') {
    return new Response(fakeEnvContent(), { headers: { 'Content-Type': 'text/plain', 'X-OpenClaw-Version': HONEYPOT_VERSION } });
  }
  if (path === '/.ssh/id_rsa') {
    return new Response(FAKE_FS['/root/.ssh/id_rsa'], { headers: { 'Content-Type': 'text/plain' } });
  }
  if (path === '/.ssh/id_rsa.pub') {
    return new Response(FAKE_FS['/root/.ssh/id_rsa.pub'], { headers: { 'Content-Type': 'text/plain' } });
  }
  if (path === '/.bash_history') {
    return new Response(FAKE_FS['/root/.bash_history'], { headers: { 'Content-Type': 'text/plain' } });
  }

  // API endpoints
  const respond = trap?.respond;
  if (respond === 'status' || path === '/api/v1/status') return json(fakeStatusJSON(uptimeMs));
  if (respond === 'sessions' || path === '/api/v1/sessions') return json(fakeSessionsJSON());
  if (respond === 'channels' || path === '/api/v1/channels') return json(fakeChannelsJSON());
  if (respond === 'skills' || path === '/api/v1/skills') return json(fakeSkillsJSON());
  if (respond === 'metrics' || path === '/api/v1/metrics') return json(fakeMetricsJSON(uptimeMs));
  if (respond === 'config' || respond === 'openclaw_config' || path === '/.openclaw/openclaw.json' || path === '/config.json') return json(fakeConfigJSON());
  if (respond === 'keys') return json(fakeKeysJSON());
  if (respond === 'logs' || path === '/api/v1/logs') return json(fakeLogsResponse());
  if (respond === 'messages' || path === '/api/agent/sessions/main/messages') return json(fakeMessagesResponse());
  if (respond === 'auth' || path === '/api/v1/auth/login' || path === '/api/v1/auth') {
    return json({ error: 'invalid_credentials', code: 'AUTH_FAILED' }, 401);
  }
  if (respond === 'shell_get') {
    return json({ message: 'POST to /api/v1/shell/execute with {"cmd":"...","session":"main"}', auth: 'Requires elevated session access' });
  }
  if (respond === 'health') return json(fakeHealthJSON(uptimeMs));
  if (respond === 'openai_compat') {
    const b = await request.text().catch(() => '{}');
    return json(fakeOpenAICompatResponse(b));
  }
  if (respond === 'ssh_key') return new Response(FAKE_FS['/root/.ssh/id_rsa'], { headers: { 'Content-Type': 'text/plain' } });
  if (respond === 'ssh_pub') return new Response(FAKE_FS['/root/.ssh/id_rsa.pub'], { headers: { 'Content-Type': 'text/plain' } });
  if (respond === 'bash_history') return new Response(FAKE_FS['/root/.bash_history'], { headers: { 'Content-Type': 'text/plain' } });
  if (respond === 'env') return new Response(fakeEnvContent(), { headers: { 'Content-Type': 'text/plain' } });
  if (respond === 'robots') return new Response(`User-agent: *\nDisallow: /api/\nDisallow: /.env\nDisallow: /.ssh/\n`, { headers: { 'Content-Type': 'text/plain' } });

  // CVE-2026-32060: apply_patch path traversal trap
  if (respond === 'apply_patch' || path === '/api/v1/agent/apply_patch') {
    const bodyText = await request.text().catch(() => '{}');
    let patchData = {};
    try { patchData = JSON.parse(bodyText); } catch(_){}
    return json(fakeApplyPatchResponse(patchData));
  }

  // CVE-2026-28470: exec approvals bypass trap
  if (respond === 'exec_execute' || path === '/api/v1/exec/execute') {
    const bodyText = await request.text().catch(() => '{}');
    let body = {};
    try { body = JSON.parse(bodyText); } catch(_){}
    const cmd = body.command || body.cmd || '';
    return json(fakeExecResponse(cmd));
  }
  if (respond === 'exec_approvals' || path === '/api/v1/exec/approvals') {
    return json(fakeExecApprovalsResponse());
  }

  // CVE-2026-26319: Telnyx / voice webhook no-auth trap
  if (respond === 'webhook_telnyx' || respond === 'webhook_voice' || path === '/webhooks/telnyx' || path === '/webhooks/voice') {
    const bodyText = await request.text().catch(() => '{}');
    let body = {};
    try { body = JSON.parse(bodyText); } catch(_){}
    return json(fakeWebhookResponse(body.event_type || body.data?.event_type));
  }

  // Memory access traps
  if (respond === 'agent_memory' || path === '/api/v1/agent/memory') {
    return json(fakeAgentMemoryResponse());
  }
  if (respond === 'memory_export' || path === '/api/v1/agent/memory/export') {
    return json(fakeMemoryExportResponse());
  }

  // Generic 404 for API paths
  if (path.startsWith('/api/')) {
    return json({ error: 'not_found', message: `Endpoint ${path} not found.`, version: HONEYPOT_VERSION }, 404);
  }

  // Everything else — 404
  return new Response('<!DOCTYPE html><html><head><title>404 Not Found</title><style>body{background:#0a0a0b;color:#e2e2e5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}</style></head><body><div><h1 style="font-size:48px;font-weight:700;color:#252529">404</h1><p style="color:#71717a;margin-top:8px">Page not found</p><p style="margin-top:20px"><a href="/" style="color:#f97316">OpenClaw Gateway</a></p></div></body></html>', {
    status: 404, headers: { 'Content-Type': 'text/html' },
  });
}

// ============================================================
// ROUTER
// ============================================================
function getFakeStartTime() {
  const now = new Date();
  const s = new Date(now); s.setHours(0, 30, 0, 0);
  if (s > now) s.setDate(s.getDate() - 1);
  return s;
}

async function detectSkin(request, env, url) {
  const hostname = url.hostname;
  const path = url.pathname;

  // ─── Hostname-based routing (multi-subdomain deployment) ───
  // Precedence: hostname > path prefix
  //
  // Example deployment:
  //   op.example.com        -> OpenClaw decoy console
  //   mcp.example.com       -> MCP decoy server
  //   langflow.example.com  -> Langflow decoy panel
  //   n8n.example.com       -> n8n decoy panel
  //
  // Configure one Worker Route for each hostname in Cloudflare.
  //   op.example.com/*        -> openclaw Worker
  //   mcp.example.com/*       -> openclaw Worker
  //   langflow.example.com/*  -> openclaw Worker
  //   n8n.example.com/*       -> openclaw Worker

  // Hostname detection (supports multiple domain patterns)
  if (hostname.startsWith('mcp.') || hostname.includes('mcp-')) return 'mcp';
  if (hostname.startsWith('langflow.') || hostname.includes('langflow-')) return 'langflow';
  if (hostname.startsWith('n8n.') || hostname.includes('n8n-')) return 'n8n';

  // Path-based fallback (single domain deployment)
  if (path.startsWith('/mcp')) return 'mcp';
  if (path.startsWith('/langflow')) return 'langflow';
  if (path.startsWith('/n8n')) return 'n8n';

  // Default: OpenClaw
  return 'openclaw';
}

// ============================================================
// MAIN FETCH HANDLER
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const ip = getClientIP(request);

    if (path.startsWith('/admin') || path.startsWith('/api/dashboard/') || path.startsWith('/api/waf/')) return handleAdmin(request, env, url);

    let body = '';
    if (['POST','PUT','PATCH'].includes(request.method)) {
      try { const c = request.clone(); body = truncate(await c.text(), 2000); } catch(_){}
    }

    const attackInfo = analyzeRequest(request, url, body, TRAP_PATHS);
    const country = getCountry(request);
    const asn = getASN(request);
    const cfMeta = getCFMeta(request);
    const ua = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    let query = url.search;
    try { query = decodeURIComponent(query.replace(/\+/g,' ')); } catch(_){}

    const honeypot = await detectSkin(request, env, url);

    ctx.waitUntil(logRequest(env, {
      ip, country, asn,
      city: cfMeta.city, region: cfMeta.region, latitude: cfMeta.latitude, longitude: cfMeta.longitude,
      method: request.method, path, query, body, ua, referer,
      headers: getAllHeaders(request),
      attackTypes: attackInfo.types, severity: attackInfo.severity,
      cfRay: cfMeta.cfRay, threatScore: cfMeta.threatScore, botScore: cfMeta.botScore,
      honeypot,
    }));

    // Dispatch to skin
    if (honeypot === 'mcp') {
      return handleMCPRoute(request, env, url);
    }
    if (honeypot === 'langflow') {
      return handleLangflowRoute(request, env, url);
    }
    if (honeypot === 'n8n') {
      return handleN8nRoute(request, env, url);
    }
    return handleOpenclawSkin(request, env, url, ip, attackInfo);
  },

  // ─── Cron Trigger: WAF feedback loop ───
  async scheduled(event, env, ctx) {
    console.log(`[Cron] Scheduled event triggered at ${new Date().toISOString()}`);

    // Phase 5: WAF closed-loop
    // Dry-run mode: only generate block list, don't actually block
    // Set DRY_RUN=false env var to enable actual blocking
    const dryRun = env.DRY_RUN !== 'false';

    ctx.waitUntil(handleCronScheduled(env, { dryRun }));
  },
};

// ============================================================
// Cron Handler: WAF feedback loop
// ============================================================
import { handleCronTrigger, getWAFStatus, generateBlockList } from './core/waf.js';

async function handleCronScheduled(env, options = {}) {
  try {
    const result = await handleCronTrigger(env, {
      dryRun: options.dryRun,
      threshold: parseInt(env.BLOCK_THRESHOLD || '10', 10),
      sevThreshold: parseInt(env.SEVERITY_THRESHOLD || '3', 10)
    });

    console.log('[Cron] WAF result:', JSON.stringify(result));

    // Store result in D1 for audit trail
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO cron_logs (timestamp, type, result)
          VALUES (?, ?, ?)
        `).bind(
          new Date().toISOString(),
          'waf_sync',
          JSON.stringify(result)
        ).run();
      } catch (e) {
        console.error('[Cron] Failed to log result:', e);
      }
    }

    return result;
  } catch (e) {
    console.error('[Cron] Error:', e);
    return { error: e.message };
  }
}
