// ============================================================
// OPENCLAW HONEYPOT SKIN
// ============================================================

import { escapeHtml, formatUptime, toCST, nowISO } from '../core/utils.js';

export const HONEYPOT_VERSION = '2026.3.12';
export const FAKE_NODE_VERSION = '22.16.0';

// ============================================================
// FAKE FILESYSTEM
// ============================================================
export const FAKE_FS = {
  '/root/.bash_history': `ssh -i ~/.ssh/id_rsa deploy@192.0.2.50\ncd /root\nls -la\ncat config.json\nmysql -h db.internal.example -u admin -pdemo-db-password customers_db\nopenclaw gateway --port 18789 --verbose\ncat ~/.openclaw/openclaw.json\nexport ANTHROPIC_API_KEY=sk-ant-example-not-a-real-key\ncurl -H "Authorization: Bearer ocgw-demo-token-not-real" http://localhost:18789/api/v1/status\ngit clone https://ghp_example_not_real@github.com/internal/company-data.git\nopenclaw channels login --whatsapp\nps aux\nnetstat -tulpn\nhistory`,

  '/root/.bashrc': `# ~/.bashrc\nexport PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin"\nexport ANTHROPIC_API_KEY=sk-ant-example-not-a-real-key\nexport OPENAI_API_KEY=sk-proj-example-not-a-real-key\nexport OPENCLAW_GATEWAY_TOKEN=ocgw-demo-token-not-real\nexport NODE_ENV=production\nalias ll='ls -alF'\nalias la='ls -A'\nalias l='ls -CF'\nalias gs='git status'\nalias oc='openclaw'`,

  '/root/.ssh/id_rsa': `DEMO_PRIVATE_KEY_START_NOT_REAL\nDEMO-KEY-MATERIAL-NOT-REAL\nDEMO_PRIVATE_KEY_END_NOT_REAL`,

  '/root/.ssh/id_rsa.pub': `ssh-ed25519 AAAA-demo-key-not-real root@example.com`,

  '/root/.ssh/authorized_keys': `ssh-ed25519 AAAA-demo-key-not-real root@example.com`,

  '/root/.openclaw/openclaw.json': JSON.stringify({
    model: 'claude-opus-4-5',
    provider: 'anthropic',
    anthropicApiKey: 'sk-ant-example-not-a-real-key',
    openaiApiKey: 'sk-proj-example-not-a-real-key',
    gateway: { port: 18789, bind: '0.0.0.0', hotReload: 'hybrid', auth: { token: 'ocgw-demo-token-not-real' } },
    agent: { thinking: 'medium', verbose: false, elevatedAccess: true, dmScope: 'main' },
    channels: {
      whatsapp: { enabled: true, phone: '+1-555-0100', allowFrom: ['*'] },
      telegram: { enabled: true, botToken: 'demo-telegram-token', allowFrom: ['*'] },
      discord: { enabled: true, token: 'demo-discord-token', guildId: '000000000000000000' },
      slack: { enabled: true, oauthToken: 'demo-slack-token-not-real', workspace: 'demo-workspace' },
      signal: { enabled: true, phone: '+1-555-0101', registrationId: 'demo-signal-id' }
    },
    skills: { autoInstall: true, installed: ['browser','gmail','github','hue','spotify','obsidian','twitter','notion','calendar','weather','news','stocks','home-assistant','custom-api'] }
  }, null, 2),

  '/root/config.json': JSON.stringify({
    database: { host: 'db.internal.example', port: 3306, name: 'customers_db', username: 'admin', password: 'demo-db-password' },
    redis: { host: 'redis.internal.example', port: 6379, password: 'demo-redis-password' },
    api: { key: 'api-demo-not-real', secret: 'sec-demo-not-real' }
  }, null, 2),

  '/root/customers.db': `SQLite format 3\n\nTABLE: customers\nid | name              | email                    | plan    | api_key\n---|-------------------|--------------------------|---------|------------------------\n1  | Alice Johnson     | alice@example.com        | pro     | ck_live_example\n2  | Bob Smith         | bob@example.com    | free    | ck_live_example\n3  | Carol White       | carol@example.com      | enterprise | ck_live_example\n4  | David Lee         | user4@example.com         | pro     | ck_live_example\n5  | Emma Davis        | user5@example.com      | pro     | ck_live_example\n...\n(247 rows total)\n\nTABLE: api_usage\n...\n\nTABLE: billing\n...`,

  '/root/deploy.sh': `#!/bin/bash\n# OpenClaw deployment script\nset -e\necho "Deploying OpenClaw to production..."\nssh -i ~/.ssh/id_rsa deploy@192.0.2.50 "cd /opt/openclaw && git pull && npm ci && pm2 restart openclaw"\necho "Deploy complete."`,

  '/root/logs/gateway.log': `[2026-03-13 00:30:01] [INF] Gateway v2026.3.12 starting on :18789\n[2026-03-13 00:30:01] [INF] Loading config /root/.openclaw/openclaw.json\n[2026-03-13 00:30:02] [INF] Provider: anthropic (claude-opus-4-5)\n[2026-03-13 00:30:03] [INF] Channel whatsapp connected\n[2026-03-13 00:30:04] [INF] Channel telegram connected\n[2026-03-13 00:30:05] [INF] Channel discord connected\n[2026-03-13 00:30:05] [WRN] Channel slack token refresh failed: 401\n[2026-03-13 00:30:05] [ERR] Channel signal QR expired\n[2026-03-13 00:30:06] [INF] Gateway ready`,

  '/etc/passwd': `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nopenclaw:x:1000:1000:OpenClaw User:/home/openclaw:/bin/bash\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin`,

  '/etc/hostname': `demo-host`,
  '/proc/version': `Linux version 5.15.0-91-generic (buildd@lcy02-amd64-007) (gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0, GNU ld (GNU Binutils for Ubuntu) 2.38) #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023`,
};

// ============================================================
// TRAP PATHS
// ============================================================
export const TRAP_PATHS = {
  '/api/v1/keys':            { type: 'API_KEYS_ACCESS',      severity: 'CRITICAL', respond: 'keys' },
  '/api/v1/tokens':          { type: 'API_KEYS_ACCESS',      severity: 'CRITICAL', respond: 'keys' },
  '/api/v1/shell':           { type: 'SHELL_ACCESS',         severity: 'CRITICAL', respond: 'shell_get' },
  '/api/v1/shell/execute':   { type: 'SHELL_EXECUTE',        severity: 'CRITICAL', respond: 'shell' },
  '/.env':                   { type: 'ENV_FILE_ACCESS',      severity: 'CRITICAL', respond: 'env' },
  '/.env.local':             { type: 'ENV_FILE_ACCESS',      severity: 'CRITICAL', respond: 'env' },
  '/.env.production':        { type: 'ENV_FILE_ACCESS',      severity: 'CRITICAL', respond: 'env' },
  '/api/v1/config':          { type: 'CONFIG_ACCESS',        severity: 'HIGH',     respond: 'config' },
  '/.openclaw/openclaw.json':{ type: 'CONFIG_FILE_ACCESS',   severity: 'HIGH',     respond: 'openclaw_config' },
  '/.ssh/id_rsa':            { type: 'SSH_KEY_ACCESS',       severity: 'CRITICAL', respond: 'ssh_key' },
  '/.ssh/id_rsa.pub':        { type: 'SSH_KEY_ACCESS',       severity: 'HIGH',     respond: 'ssh_pub' },
  '/.bash_history':          { type: 'BASH_HISTORY_ACCESS',  severity: 'HIGH',     respond: 'bash_history' },
  '/health':                 { type: 'HEALTH_CHECK',         severity: 'CLEAN',    respond: 'health' },
  '/v1/chat/completions':    { type: 'OPENAI_API_ABUSE',     severity: 'HIGH',     respond: 'openai_compat' },
  '/api/v1/status':          { type: 'STATUS_ACCESS',        severity: 'CLEAN',    respond: 'status' },
  '/api/v1/sessions':        { type: 'SESSIONS_ACCESS',      severity: 'LOW',      respond: 'sessions' },
  '/api/v1/channels':        { type: 'CHANNELS_ACCESS',      severity: 'LOW',      respond: 'channels' },
  '/api/v1/skills':          { type: 'SKILLS_ACCESS',        severity: 'LOW',      respond: 'skills' },
  '/api/v1/metrics':         { type: 'METRICS_ACCESS',       severity: 'LOW',      respond: 'metrics' },
  '/api/v1/logs':            { type: 'LOGS_ACCESS',          severity: 'LOW',      respond: 'logs' },
  '/api/v1/auth/login':      { type: 'AUTH_ATTEMPT',         severity: 'LOW',      respond: 'auth' },
  '/api/v1/auth':            { type: 'AUTH_ATTEMPT',         severity: 'LOW',      respond: 'auth' },
  '/api/agent/sessions/main/messages': { type: 'SESSION_ACCESS', severity: 'MEDIUM', respond: 'messages' },
  '/.git/config':            { type: 'GIT_ACCESS',           severity: 'HIGH',     respond: null },
  '/.git/HEAD':              { type: 'GIT_ACCESS',           severity: 'HIGH',     respond: null },
  '/etc/passwd':             { type: 'SYSTEM_FILE_ACCESS',   severity: 'CRITICAL', respond: null },
  '/etc/shadow':             { type: 'SYSTEM_FILE_ACCESS',   severity: 'CRITICAL', respond: null },
  '/wp-admin':               { type: 'SCANNER',              severity: 'MEDIUM',   respond: null },
  '/wp-login.php':           { type: 'SCANNER',              severity: 'MEDIUM',   respond: null },
  '/phpmyadmin':             { type: 'SCANNER',              severity: 'MEDIUM',   respond: null },
  '/phpMyAdmin':             { type: 'SCANNER',              severity: 'MEDIUM',   respond: null },
  '/xmlrpc.php':             { type: 'SCANNER',              severity: 'MEDIUM',   respond: null },
  '/.htaccess':              { type: 'SCANNER',              severity: 'MEDIUM',   respond: null },
  '/.htpasswd':              { type: 'SCANNER',              severity: 'HIGH',     respond: null },
  '/server-status':          { type: 'RECON',                severity: 'MEDIUM',   respond: null },
  '/actuator/env':           { type: 'RECON',                severity: 'HIGH',     respond: null },
  '/robots.txt':             { type: 'RECON',                severity: 'CLEAN',    respond: 'robots' },
  '/config.json':            { type: 'CONFIG_FILE_ACCESS',   severity: 'HIGH',     respond: 'config' },
  // CVE-2026-32060: Path traversal in apply_patch
  '/api/v1/agent/apply_patch':   { type: 'PATH_TRAVERSAL_ATTEMPT',   severity: 'CRITICAL', respond: 'apply_patch' },
  // CVE-2026-28470: Exec Approvals allowlist bypass
  '/api/v1/exec/execute':        { type: 'EXEC_APPROVAL_BYPASS',      severity: 'CRITICAL', respond: 'exec_execute' },
  '/api/v1/exec/approvals':      { type: 'EXEC_APPROVAL_BYPASS',      severity: 'HIGH',     respond: 'exec_approvals' },
  // CVE-2026-26319: Telnyx Webhook no auth
  '/webhooks/telnyx':            { type: 'WEBHOOK_NO_AUTH',            severity: 'HIGH',     respond: 'webhook_telnyx' },
  '/webhooks/voice':             { type: 'WEBHOOK_NO_AUTH',            severity: 'HIGH',     respond: 'webhook_voice' },
  // Memory access
  '/api/v1/agent/memory':        { type: 'MEMORY_ACCESS',              severity: 'HIGH',     respond: 'agent_memory' },
  '/api/v1/agent/memory/export': { type: 'MEMORY_EXPORT',              severity: 'CRITICAL', respond: 'memory_export' },
  // GHSA-6mgf-v5j7-45cr: SSRF via gateway redirect
  '/api/v1/gateway/redirect':    { type: 'SSRF_GATEWAY_REDIRECT',      severity: 'CRITICAL', respond: null },
  '/api/v1/gateway/fetch':       { type: 'SSRF_GATEWAY_REDIRECT',      severity: 'CRITICAL', respond: null },
  // MCP honeypot paths (Phase 2)
  '/mcp':                        { type: 'MCP_ACCESS',                 severity: 'MEDIUM',   respond: null },
  '/mcp/':                       { type: 'MCP_ACCESS',                 severity: 'MEDIUM',   respond: null },
  // Langflow honeypot paths (Phase 3)
  '/langflow':                   { type: 'LANGFLOW_ACCESS',            severity: 'MEDIUM',   respond: null },
  '/langflow/':                  { type: 'LANGFLOW_ACCESS',            severity: 'MEDIUM',   respond: null },
  '/langflow/api/v1/validate/code': { type: 'LANGFLOW_RCE_EXPLOIT',    severity: 'CRITICAL', respond: null },
  // n8n honeypot paths (Phase 3)
  '/n8n':                        { type: 'N8N_ACCESS',                 severity: 'MEDIUM',   respond: null },
  '/n8n/':                       { type: 'N8N_ACCESS',                 severity: 'MEDIUM',   respond: null },
  '/n8n/rest/login':             { type: 'N8N_AUTH_ATTEMPT',           severity: 'LOW',      respond: null },
  '/n8n/rest/workflows':         { type: 'N8N_API_ACCESS',             severity: 'LOW',      respond: null },
  '/n8n/rest/credentials':       { type: 'N8N_CREDENTIAL_ACCESS',      severity: 'HIGH',     respond: null },
  '/n8n/webhook/':               { type: 'N8N_WEBHOOK_ACCESS',         severity: 'MEDIUM',   respond: null },
  '/n8n/webhook-test/':          { type: 'N8N_WEBHOOK_ACCESS',         severity: 'MEDIUM',   respond: null },
};

// ============================================================
// FAKE API RESPONSE GENERATORS
// ============================================================

export function fakeStatusJSON(uptimeMs) {
  return {
    status:'running',version:HONEYPOT_VERSION,uptime_ms:uptimeMs,uptime_human:formatUptime(uptimeMs),
    node:FAKE_NODE_VERSION,fast_mode:false,providers:['anthropic','openai','ollama'],
    gateway:{ws:'ws://0.0.0.0:18789',port:18789,bind:'0.0.0.0',auth:false,hot_reload:'hybrid'},
    channels:{connected:5,total:5,errors:0},sessions:{active:1,total:1},
    agent:{model:'claude-opus-4-5',thinking:'medium',elevated:true},
    kubernetes:false,timestamp:new Date().toISOString(),
  };
}

export function fakeHealthJSON(uptimeMs) {
  return {
    status:'healthy',gateway:'running',rpc:'ok',version:HONEYPOT_VERSION,
    uptime_ms:uptimeMs,channels:{whatsapp:'ok',telegram:'ok',discord:'ok',slack:'ok',signal:'ok'},
    memory_mb:87,
    timestamp:new Date().toISOString(),
  };
}

export function fakeSessionsJSON() {
  return {sessions:[{id:'main',type:'direct',model:'claude-opus-4-5',thinking:'medium',messages:142,tokens_used:284318,cost_usd:4.26,created:'2026-03-15T00:30:00Z',last_active:new Date(Date.now()-320000).toISOString(),verbose:false,elevated_access:true}]};
}

export function fakeChannelsJSON() {
  return {channels:[
    {name:'whatsapp',status:'connected',phone:'+1 (555) \u2022\u2022\u2022-4521',session:'main'},
    {name:'telegram',status:'connected',username:'@oc_assistant_bot',session:'main'},
    {name:'discord',status:'connected',server:'My Homelab',guild_id:'000000000000000000',session:'main'},
    {name:'slack',status:'connected',workspace:'demo-workspace',session:'main'},
    {name:'signal',status:'connected',phone:'+1 (555) \u2022\u2022\u2022-8832',session:'main'},
  ]};
}

export function fakeConfigJSON() {
  return JSON.parse(FAKE_FS['/root/.openclaw/openclaw.json']);
}

export function fakeKeysJSON() {
  return {
    anthropic_api_key:'sk-ant-example-not-a-real-key',
    openai_api_key:'sk-proj-example-not-a-real-key',
    gateway_token:'ocgw-demo-token-not-real',
    github_token:'ghp_example_not_real',
    webhook_secret:'whsec_example_not_real',
    _warning:'Rotate these credentials immediately if exposed.',
  };
}

export function fakeMetricsJSON(uptimeMs) {
  return {uptime_ms:uptimeMs,requests_total:48291,messages_today:142,tokens_total:1284318,cost_total_usd:19.26,channels_active:3,skills_installed:14};
}

export function fakeSkillsJSON() {
  const skills=[
    {id:'browser',name:'Browser Control',version:'2.3.1',enabled:true,bundled:true},
    {id:'gmail',name:'Gmail',version:'1.5.0',enabled:true,bundled:false},
    {id:'github',name:'GitHub',version:'1.3.2',enabled:true,bundled:false},
    {id:'hue',name:'Philips Hue',version:'1.2.0',enabled:true,bundled:false},
    {id:'spotify',name:'Spotify',version:'1.1.4',enabled:true,bundled:false},
    {id:'obsidian',name:'Obsidian',version:'1.0.8',enabled:true,bundled:false},
    {id:'twitter',name:'Twitter/X',version:'1.0.3',enabled:false,bundled:false},
    {id:'notion',name:'Notion',version:'1.1.0',enabled:true,bundled:false},
    {id:'calendar',name:'Google Calendar',version:'1.2.1',enabled:true,bundled:false},
    {id:'weather',name:'Weather',version:'1.0.5',enabled:true,bundled:false},
    {id:'news',name:'News',version:'1.0.2',enabled:false,bundled:false},
    {id:'stocks',name:'Stocks',version:'1.0.1',enabled:false,bundled:false},
    {id:'home-assistant',name:'Home Assistant',version:'1.1.2',enabled:false,bundled:false},
    {id:'custom-api',name:'Custom API',version:'0.9.4',enabled:true,bundled:false},
  ];
  return{skills};
}

export function fakeLogsResponse() {
  const now=Date.now();
  const entries=[
    {level:'INF',msg:`Gateway v${HONEYPOT_VERSION} starting on :18789`,ts:new Date(now-48600000).toISOString()},
    {level:'INF',msg:'Loading config /root/.openclaw/openclaw.json',ts:new Date(now-48598000).toISOString()},
    {level:'INF',msg:'Provider: anthropic (claude-opus-4-5)',ts:new Date(now-48596000).toISOString()},
    {level:'INF',msg:'Channel whatsapp connecting...',ts:new Date(now-48594000).toISOString()},
    {level:'INF',msg:'Channel whatsapp connected (+1-555-0100)',ts:new Date(now-48592000).toISOString()},
    {level:'INF',msg:'Channel telegram connecting...',ts:new Date(now-48590000).toISOString()},
    {level:'INF',msg:'Channel telegram connected (@oc_assistant_bot)',ts:new Date(now-48588000).toISOString()},
    {level:'INF',msg:'Channel discord connecting...',ts:new Date(now-48586000).toISOString()},
    {level:'INF',msg:'Channel discord connected (My Homelab / 000000000000000000)',ts:new Date(now-48584000).toISOString()},
    {level:'INF',msg:'Channel slack connecting...',ts:new Date(now-48582000).toISOString()},
    {level:'INF',msg:'Channel slack connected (demo-workspace)',ts:new Date(now-48580000).toISOString()},
    {level:'INF',msg:'Channel signal connecting...',ts:new Date(now-48578500).toISOString()},
    {level:'INF',msg:'Channel signal connected (+1-555-0101)',ts:new Date(now-48577000).toISOString()},
    {level:'INF',msg:'Daemon heartbeat enabled (30s interval)',ts:new Date(now-48575000).toISOString()},
    {level:'INF',msg:'Skills loaded: browser, gmail, github (3 bundled, 11 managed)',ts:new Date(now-48573000).toISOString()},
    {level:'INF',msg:`Gateway ready. All 5 channels connected. Control UI: http://localhost:18789`,ts:new Date(now-48571000).toISOString()},
    {level:'INF',msg:'[whatsapp/main] Incoming from +1-555-0100',ts:new Date(now-3600000).toISOString()},
    {level:'INF',msg:'[whatsapp/main] Agent started model=claude-opus-4-5',ts:new Date(now-3598000).toISOString()},
    {level:'INF',msg:'[whatsapp/main] Tool call: gmail.list_messages',ts:new Date(now-3595000).toISOString()},
    {level:'INF',msg:'[whatsapp/main] Agent done, 342 tokens $0.015',ts:new Date(now-3588000).toISOString()},
    {level:'INF',msg:'[telegram/main] Incoming from @user_handle',ts:new Date(now-1800000).toISOString()},
    {level:'INF',msg:'[telegram/main] Agent done, 218 tokens $0.009',ts:new Date(now-1790000).toISOString()},
  ];
  return{logs:entries};
}

export function fakeMessagesResponse() {
  return{session:'main',messages:[
    {role:'user',channel:'whatsapp',from:'+1-555-0100',content:'Check my emails and summarize the unread ones',ts:new Date(Date.now()-3600000).toISOString()},
    {role:'assistant',content:'You have 5 unread emails:\n1. "Q2 Budget Approval" from sarah@example.com\n2. "PR #142 merged" from github\n3. "AWS Invoice" $234.56\n4. "Dependabot alert" - 2 high severity\n5. "Team standup tomorrow 10am"',ts:new Date(Date.now()-3595000).toISOString()},
    {role:'user',channel:'telegram',from:'@user_handle',content:'Turn on the living room lights',ts:new Date(Date.now()-1800000).toISOString()},
    {role:'assistant',content:'Done! Living room lights are now on at 80% brightness.',ts:new Date(Date.now()-1795000).toISOString()},
  ]};
}

export function fakeOpenAICompatResponse(bodyText) {
  let userMsg='Hello';
  try{const b=JSON.parse(bodyText);userMsg=b.messages?.at(-1)?.content||'Hello';}catch(_){}
  const rid=`chatcmpl-${Math.random().toString(36).slice(2,12)}`;
  return{id:rid,object:'chat.completion',created:Math.floor(Date.now()/1000),model:'claude-opus-4-5',
    choices:[{index:0,message:{role:'assistant',content:`I'm your OpenClaw AI assistant. How can I help you today?`},finish_reason:'stop'}],
    usage:{prompt_tokens:Math.ceil(userMsg.length/4)+10,completion_tokens:18,total_tokens:Math.ceil(userMsg.length/4)+28}};
}

export function fakeEnvContent() {
  return `SHELL=/bin/bash\nPWD=/root\nHOME=/root\nUSER=root\nLOGNAME=root\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nNODE_ENV=production\nPORT=18789\nANTHROPIC_API_KEY=sk-ant-example-not-a-real-key\nOPENAI_API_KEY=sk-proj-example-not-a-real-key\nOPENCLAW_GATEWAY_TOKEN=ocgw-demo-token-not-real\nOPENCLAW_VERSION=2026.3.12\nDB_HOST=db.internal.example\nDB_PASSWORD=demo-db-password\nREDIS_HOST=redis.internal.example\nREDIS_PASSWORD=demo-redis-password`;
}

export function fakeApplyPatchResponse(patchData) {
  const filePath = patchData.path || patchData.file || patchData.target || '/root/config.json';
  return { status: 'ok', applied: true, path: filePath, backup: filePath + '.bak.' + Date.now(), changed_lines: Math.floor(Math.random()*20)+1, message: 'Patch applied successfully.' };
}

export function fakeExecResponse(cmd) {
  const command = String(cmd || 'id').trim();
  const stdout = command === 'whoami' ? 'root' : command === 'pwd' ? '/root' : 'Command accepted by the simulation shell.';
  return { status: 'ok', stdout, stderr: '', exit_code: 0, approved: true, session: 'main', executed_at: nowISO() };
}

export function fakeExecApprovalsResponse() {
  return { allowlist: ['id','whoami','ls','cat','ps aux','env','openclaw status'], pending: [], mode: 'allowlist', bypass_check: false };
}

export function fakeWebhookResponse(event) {
  return { status: 'ok', received: true, event_id: Math.random().toString(36).slice(2,12), event_type: event || 'call.initiated', processed: true };
}

export function fakeAgentMemoryResponse() {
  return {
    session: 'main',
    entries: [
      { id: 'm1', type: 'credential', content: 'anthropic_key: sk-ant-example-not-a-real-key', created: '2026-03-10T08:00:00Z', accessed: '2026-03-13T14:20:00Z' },
      { id: 'm2', type: 'fact', content: 'DB password is demo-db-password (MySQL on db.internal.example)', created: '2026-03-11T14:20:00Z', accessed: '2026-03-13T09:10:00Z' },
      { id: 'm3', type: 'fact', content: 'Redis password: demo-redis-password on redis.internal.example:6379', created: '2026-03-11T14:21:00Z', accessed: '2026-03-12T18:00:00Z' },
      { id: 'm4', type: 'context', content: 'User prefers brief responses, works PST timezone, owns FinTech startup', created: '2026-03-12T09:00:00Z', accessed: '2026-03-13T14:20:00Z' },
      { id: 'm5', type: 'credential', content: 'github_token: ghp_example_not_real', created: '2026-03-12T10:00:00Z', accessed: '2026-03-13T11:00:00Z' },
    ],
    total: 5,
  };
}

export function fakeMemoryExportResponse() {
  return {
    session: 'main', exported_at: nowISO(), format: 'json', version: HONEYPOT_VERSION,
    memory: [
      { id: 'm1', type: 'credential', content: 'ANTHROPIC_API_KEY=sk-ant-example-not-a-real-key', created: '2026-03-10T08:00:00Z' },
      { id: 'm2', type: 'credential', content: 'DB_PASSWORD=demo-db-password  DB_HOST=db.internal.example', created: '2026-03-11T14:20:00Z' },
      { id: 'm3', type: 'credential', content: 'REDIS_PASSWORD=demo-redis-password', created: '2026-03-11T14:21:00Z' },
      { id: 'm4', type: 'credential', content: 'OPENCLAW_GATEWAY_TOKEN=ocgw-demo-token-not-real', created: '2026-03-12T10:00:00Z' },
      { id: 'm5', type: 'context', content: 'Synthetic billing profile: routing=000000000 account=DEMO-ACCOUNT-NOT-REAL', created: '2026-03-12T09:00:00Z' },
    ],
  };
}
