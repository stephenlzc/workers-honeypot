// ============================================================
// DATABASE OPERATIONS
// ============================================================

import { nowISO, truncate } from './utils.js';

const PAGE_SIZE = 20;

export async function logRequest(env, {ip,country,asn,city,region,latitude,longitude,method,path,query,body,ua,referer,headers,attackTypes,severity,cfRay,threatScore,botScore,honeypot}) {
  try {
    await env.DB.prepare(
      `INSERT INTO attacks (ip,country,asn,city,region,latitude,longitude,method,path,query_string,body,user_agent,referer,attack_types,severity,raw_headers,cf_ray,threat_score,bot_score,timestamp,honeypot)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(ip,country,asn,city||'',region||'',latitude||'',longitude||'',method,path,
      truncate(query,500),truncate(body,2000),truncate(ua,500),truncate(referer,500),
      JSON.stringify(attackTypes||[]),severity||'CLEAN',truncate(headers,4000),
      cfRay||'',threatScore||0,botScore??-1,nowISO(),honeypot||'openclaw').run();
  } catch(_){}
}

function credentialPattern(password) {
  const p = String(password || '');
  if (!p) return 'empty';
  const hasLower = /[a-z]/.test(p), hasUpper = /[A-Z]/.test(p), hasDigit = /\d/.test(p), hasSymbol = /[^A-Za-z0-9]/.test(p);
  if (/^(password|admin|root|qwerty|letmein|welcome|changeme)$/i.test(p)) return 'common-word';
  if (/^(.)\1+$/.test(p)) return 'repeated-character';
  if (/^(123456|12345678|123456789|qwerty123|admin123)$/i.test(p)) return 'common-sequence';
  if (hasLower && hasUpper && hasDigit && hasSymbol) return 'mixed-complex';
  if (hasLower && hasDigit && !hasUpper && !hasSymbol) return 'word-plus-digits';
  if (/^\d+$/.test(p)) return 'digits-only';
  return hasSymbol ? 'word-plus-symbols' : 'word-only';
}

export async function recordCredentialAttempt(env, { honeypot, identifier, password, ip, country }) {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS credential_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, honeypot TEXT NOT NULL, identifier_hash TEXT DEFAULT '', identifier_kind TEXT DEFAULT 'unknown', password_length INTEGER DEFAULT 0, password_pattern TEXT DEFAULT 'unknown', ip TEXT DEFAULT 'unknown', country TEXT DEFAULT 'Unknown', timestamp TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const value = String(identifier || '').trim().toLowerCase();
    const digest = value ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)) : new ArrayBuffer(0);
    const identifierHash = value ? Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('') : '';
    const kind = value.includes('@') ? 'email' : (value ? 'username' : 'unknown');
    const secret = String(password || '');
    await env.DB.prepare(`INSERT INTO credential_attempts (honeypot,identifier_hash,identifier_kind,password_length,password_pattern,ip,country,timestamp) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(honeypot || 'unknown', identifierHash, kind, secret.length, credentialPattern(secret), ip || 'unknown', country || 'Unknown', nowISO()).run();
  } catch (_) {}
}

export async function isIPBanned(env,ip) {
  try { const r=await env.DB.prepare(`SELECT banned_until FROM ip_bans WHERE ip=? AND banned_until>? LIMIT 1`).bind(ip,nowISO()).first(); return!!r; } catch(_){return false;}
}

export async function banIP(env,ip,reason) {
  const until=new Date(Date.now()+24*60*60*1000).toISOString();
  try { await env.DB.prepare(`INSERT INTO ip_bans(ip,reason,banned_until)VALUES(?,?,?)ON CONFLICT(ip)DO UPDATE SET reason=excluded.reason,banned_until=excluded.banned_until,banned_at=CURRENT_TIMESTAMP`).bind(ip,reason,until).run(); }catch(_){}
}

export async function unbanIPDB(env,ip) { try{await env.DB.prepare(`DELETE FROM ip_bans WHERE ip=?`).bind(ip).run();}catch(_){} }

export async function getRecentFailedAdminAttempts(env,ip) {
  try { const since=new Date(Date.now()-24*60*60*1000).toISOString(); const r=await env.DB.prepare(`SELECT COUNT(*) as cnt FROM admin_attempts WHERE ip=? AND success=0 AND timestamp>?`).bind(ip,since).first(); return r?.cnt||0; }catch(_){return 0;}
}

export async function recordAdminAttempt(env,ip,success) { try{await env.DB.prepare(`INSERT INTO admin_attempts(ip,success)VALUES(?,?)`).bind(ip,success?1:0).run();}catch(_){} }

export async function createAdminSession(env,ip) {
  const token=await (await import('./utils.js')).generateToken();
  const exp=new Date(Date.now()+3600*1000).toISOString();
  try{await env.DB.prepare(`INSERT INTO admin_sessions(token,ip,expires_at)VALUES(?,?,?)`).bind(token,ip,exp).run();}catch(_){}
  return token;
}

export async function validateAdminSession(env,token) {
  if(!token)return false;
  try{const r=await env.DB.prepare(`SELECT id FROM admin_sessions WHERE token=? AND expires_at>? LIMIT 1`).bind(token,nowISO()).first();return!!r;}catch(_){return false;}
}

export async function getAttacks(env,page=1,filters={}) {
  const offset=(page-1)*PAGE_SIZE; let where='1=1'; const binds=[];
  if(filters.ip){where+=' AND ip LIKE ?';binds.push(`%${filters.ip}%`);}
  if(filters.severity&&filters.severity!=='ALL'){where+=' AND severity=?';binds.push(filters.severity);}
  if(filters.type&&filters.type!=='ALL'){where+=' AND attack_types LIKE ?';binds.push(`%${filters.type}%`);}
  if(filters.dateFrom){where+=' AND timestamp>=?';binds.push(filters.dateFrom);}
  if(filters.dateTo){where+=' AND timestamp<=?';binds.push(filters.dateTo+'T23:59:59Z');}
  try {
    const cnt=await env.DB.prepare(`SELECT COUNT(*) as cnt FROM attacks WHERE ${where}`).bind(...binds).first();
    const rows=await env.DB.prepare(`SELECT id,ip,country,asn,city,region,method,path,query_string,body,user_agent,attack_types,severity,threat_score,bot_score,cf_ray,timestamp,honeypot FROM attacks WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds,PAGE_SIZE,offset).all();
    return{rows:rows.results||[],total:cnt?.cnt||0,pages:Math.ceil((cnt?.cnt||0)/PAGE_SIZE)};
  }catch(_){return{rows:[],total:0,pages:0};}
}

export async function getAttackStats(env) {
  try {
    const [total,bySev,topIPs,recent24h]=await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as cnt FROM attacks`).first(),
      env.DB.prepare(`SELECT severity,COUNT(*) as cnt FROM attacks GROUP BY severity ORDER BY cnt DESC`).all(),
      env.DB.prepare(`SELECT ip,country,COUNT(*) as cnt FROM attacks GROUP BY ip ORDER BY cnt DESC LIMIT 10`).all(),
      env.DB.prepare(`SELECT COUNT(*) as cnt FROM attacks WHERE timestamp>?`).bind(new Date(Date.now()-86400000).toISOString()).first(),
    ]);
    return{total:total?.cnt||0,bySeverity:bySev.results||[],topIPs:topIPs.results||[],recent24h:recent24h?.cnt||0};
  }catch(_){return{total:0,bySeverity:[],topIPs:[],recent24h:0};}
}

export async function getIPBans(env) {
  try{const r=await env.DB.prepare(`SELECT ip,reason,banned_at,banned_until FROM ip_bans WHERE banned_until>? ORDER BY banned_at DESC`).bind(nowISO()).all();return r.results||[];}catch(_){return[];}
}
