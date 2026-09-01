// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function getClientIP(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    (request.headers.get('X-Forwarded-For') || '').split(',')[0].trim() ||
    request.headers.get('X-Real-IP') || '0.0.0.0'
  );
}

export function getCountry(request) { return request.cf?.country || 'Unknown'; }

export function getASN(request) { return request.cf?.asn ? `AS${request.cf.asn}` : 'Unknown'; }

export function getCFMeta(request) {
  const cf = request.cf || {};
  return {
    city: cf.city || '',
    region: cf.region || cf.regionCode || '',
    latitude: cf.latitude ? String(cf.latitude) : '',
    longitude: cf.longitude ? String(cf.longitude) : '',
    cfRay: request.headers.get('CF-Ray') || '',
    threatScore: typeof cf.threatScore === 'number' ? cf.threatScore : 0,
    botScore: cf.botManagement?.score ?? -1,
  };
}

export function getAllHeaders(request) {
  const skip = new Set(['cookie','authorization']);
  const obj = {};
  for (const [k, v] of request.headers.entries()) {
    if (!skip.has(k.toLowerCase())) obj[k] = truncate(v, 200);
  }
  return JSON.stringify(obj);
}

export function nowISO() { return new Date().toISOString(); }

export function toCST(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const cst = new Date(d.getTime() + 8 * 3600 * 1000);
  return cst.toISOString().slice(0, 19).replace('T', ' ');
}

export function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function truncate(s, max=2000) { const t=String(s||''); return t.length>max?t.slice(0,max)+'...[truncated]':t; }

export async function generateToken() {
  const a=new Uint8Array(32); crypto.getRandomValues(a);
  return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export function severityColor(s) { return {CLEAN:'#6b7280',LOW:'#3b82f6',MEDIUM:'#f59e0b',HIGH:'#ef4444',CRITICAL:'#dc2626'}[s]||'#6b7280'; }

export function severityBg(s) { return {CLEAN:'#f3f4f6',LOW:'#eff6ff',MEDIUM:'#fffbeb',HIGH:'#fef2f2',CRITICAL:'#fff1f2'}[s]||'#f3f4f6'; }

export function formatUptime(ms) {
  const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);
  if(d>0)return`${d}d ${h}h ${m}m`; if(h>0)return`${h}h ${m}m`; return`${m}m`;
}
