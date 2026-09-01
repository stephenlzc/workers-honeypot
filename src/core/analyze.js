// ============================================================
// ATTACK DETECTION PATTERNS
// Merged from original + hono-honeypot 200+ patterns
// ============================================================

export const SEVERITY_RANK = { CLEAN: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

// ─── Content-based patterns (test against path+query+body+ua+referer) ───
export const ATTACK_PATTERNS = [
  { name: 'SQL_INJECTION', severity: 'HIGH', patterns: [
    /\bUNION\b[\s\S]{0,50}\bSELECT\b/i,
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC)\b[\s\S]{0,30}\b(FROM|INTO|TABLE)\b/i,
    /'\s*(OR|AND)\s*'?\d/i, /'\s*OR\s*'\w+'\s*=\s*'\w+/i,
    /(SLEEP|BENCHMARK|WAITFOR\s+DELAY)\s*\(/i,
    /\bINFORMATION_SCHEMA\b/i, /xp_cmdshell/i,
    /\b(GROUP_CONCAT|LOAD_FILE|INTO\s+OUTFILE)\b/i, /--\s*$|#\s*$/m,
  ]},
  { name: 'XSS', severity: 'MEDIUM', patterns: [
    /<script[\s\/>]/i, /<\/script>/i, /javascript\s*:/i, /\bon\w+\s*=/i,
    /<iframe[\s\/>]/i, /\beval\s*\(/i, /\balert\s*\([^)]*\)/i,
    /document\.(cookie|write|location)/i, /window\.(location|open)\s*[=(]/i,
  ]},
  { name: 'PATH_TRAVERSAL', severity: 'HIGH', patterns: [
    /\.\.[\/\\]/, /\.\.%2[Ff]/i, /\.\.%5[Cc]/i,
    /\/etc\/(passwd|shadow|hosts|crontab)/i, /\/proc\/self\//i,
    /C:\\(Windows|Users)/i, /boot\.ini/i,
    /\/var\/(log|task|run)\//i, /\/opt\//i,
  ]},
  { name: 'COMMAND_INJECTION', severity: 'CRITICAL', patterns: [
    /[;&|`]\s*(ls|cat|id|whoami|curl|wget|bash|sh|python3?|perl|nc|ncat)\b/i,
    /\|\s*(ls|cat|id|whoami|bash|sh)\b/i, /\$\([^)]{1,100}\)/, /`[^`]{1,100}`/,
    /;\s*rm\s+-[rf]/i, /\/bin\/(sh|bash|dash|zsh)/i,
    /\{(curl|wget|bash|sh|nc|ncat|python|perl|ruby|php),/i,
  ]},
  { name: 'SSRF', severity: 'HIGH', patterns: [
    /\b127\.0\.0\.1\b/, /\blocalhost\b/i, /169\.254\.169\.254/,
    /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, /\b192\.168\.\d{1,3}\.\d{1,3}\b/,
    /file:\/\//i, /dict:\/\//i, /gopher:\/\//i, /\bmetadata\.google\.internal\b/i,
  ]},
  { name: 'TEMPLATE_INJECTION', severity: 'HIGH', patterns: [
    /\{\{[\s\S]{1,200}\}\}/, /\$\{[\s\S]{1,200}\}/, /\#\{[\s\S]{1,200}\}/, /<%[\s\S]{1,200}%>/,
  ]},
  { name: 'XXE', severity: 'HIGH', patterns: [
    /<!ENTITY\s/i, /<!DOCTYPE[\s\S]{0,50}\[/i, /SYSTEM\s+["']file:/i,
  ]},
  { name: 'LOG4SHELL', severity: 'CRITICAL', patterns: [
    /\$\{jndi:/i, /\$\{env:/i, /\$\{lower:/i, /\$\{upper:/i, /\$\{\$\{/,
  ]},
  { name: 'SPRINGSHELL', severity: 'CRITICAL', patterns: [
    /\$\{T\(java\.lang/i, /class\.module\.classLoader/i,
  ]},
  // ─── New: OAST callback domains (Interactsh/Burp Collaborator) ───
  { name: 'OAST_CALLBACK', severity: 'HIGH', patterns: [
    /\.oast\.(site|fun|live|me|online|pro)/i,
  ]},
  // ─── New: Null byte injection ───
  { name: 'NULL_BYTE', severity: 'HIGH', patterns: [
    /(%00|\x00)/,
  ]},
  // ─── New: Zero-width Unicode probes (URL normalization bugs) ───
  { name: 'UNICODE_PROBE', severity: 'MEDIUM', patterns: [
    /[\u200B-\u200F\u2028-\u202E\uFEFF]/u,
  ]},
];

// ─── Path-based patterns (test against URL path only) ───
// Merged from hono-honeypot + enhanced
export const PATH_PATTERNS = [
  // ─── PHP vulnerability scanners ───
  { name: 'PHP_SCANNER', severity: 'MEDIUM', patterns: [
    /\.php$/i, /\/config\.php/i, /\/phpinfo/i, /\/eval-stdin\.php/i, /\/xmlrpc\.php/i,
  ]},
  // ─── Shell/backdoor patterns ───
  { name: 'SHELL_BACKDOOR', severity: 'CRITICAL', patterns: [
    /\/ALFA_DATA/i, /\/c99\.php/i, /\/r57\.php/i, /\/shell\.php/i, /\/webshell/i,
    /^\/shell/i,
  ]},
  // ─── WordPress probes ───
  { name: 'WORDPRESS_SCANNER', severity: 'MEDIUM', patterns: [
    /^\/wp$/i, /^\/wp-/i, /^\/wordpress/i,
    /\/wp-includes\//i, /\/wp-content\//i, /\/wp-admin/i, /wlwmanifest\.xml$/i,
  ]},
  // ─── Admin panels ───
  { name: 'ADMIN_PANEL', severity: 'MEDIUM', patterns: [
    /^\/admin(\.php)?$/i, /^\/administrator/i, /^\/phpmyadmin/i,
    /^\/cpanel/i, /^\/whm/i, /^\/cgi-bin/i,
    /^\/adminer/i, /^\/pma\//i, /^\/myadmin\//i, /^\/mysqladmin/i, /^\/dbadmin/i,
  ]},
  // ─── CMS frameworks ───
  { name: 'CMS_SCANNER', severity: 'MEDIUM', patterns: [
    /^\/typo3/i, /^\/joomla/i, /^\/drupal/i, /^\/magento/i,
    /\/admin\/(uploads?|images|editor|fckeditor|controller)/i,
    /\/fckeditor\/editor\/filemanager/i,
    /\/sites\/default\/files/i, /\/images\/stories/i,
    /\/modules\/mod_simplefileupload/i, /\/controller\/extension/i,
  ]},
  // ─── Magento REST API fingerprint ───
  { name: 'MAGENTO_SCANNER', severity: 'MEDIUM', patterns: [
    /^\/rest\/(?:[a-z0-9_-]+\/)?v\d+(?:\/|$)/i,
  ]},
  // ─── WYSIWYG editor exploits ───
  { name: 'EDITOR_EXPLOIT', severity: 'MEDIUM', patterns: [
    /\/ckeditor/i, /\/tinymce/i, /\/elfinder/i,
  ]},
  // ─── Version control ───
  { name: 'GIT_ACCESS', severity: 'HIGH', patterns: [
    /\/\.git/i, /\/\.svn/i, /\/\.hg/i,
  ]},
  // ─── Sensitive files ───
  { name: 'SENSITIVE_FILE', severity: 'HIGH', patterns: [
    /\/\.env/i, /\/\.sql$/i, /\/(vendor|node_modules)\//i,
    /\/\.htaccess$/i, /\/\.htpasswd$/i,
    /\/\.DS_Store$/i, /\/Thumbs\.db$/i,
  ]},
  // ─── SSH/credential files ───
  { name: 'CREDENTIAL_ACCESS', severity: 'CRITICAL', patterns: [
    /\/\.ssh/i, /\/id_rsa/i, /\/id_ed25519/i,
    /\/\.npmrc$/i, /\/\.pypirc$/i, /\/\.aws\//i,
  ]},
  // ─── Backup files ───
  { name: 'BACKUP_ACCESS', severity: 'MEDIUM', patterns: [
    /\.(bak|old|backup|orig|save|swp)$/i,
    /\.(7z|tgz|tar\.gz|tar|bz2|war|jar)$/i,
    /^\/backup/i, /^\/bk$/i, /^\/bak$/i, /^\/bac$/i, /^\/dump/i,
  ]},
  // ─── Config files at root ───
  { name: 'CONFIG_FILE_ACCESS', severity: 'HIGH', patterns: [
    /^\/config\.(js|json|yml|yaml|xml|ini|conf)$/i,
    /^\/settings\.(js|json|yml|yaml|xml)$/i,
    /^\/credentials\.(js|json|yml|yaml)$/i,
    /^\/secrets\.(js|json|yml|yaml|env)$/i,
    /^\/appsettings\.(json|yml|yaml)$/i,
    /^\/application\.(yml|yaml|xml|properties)$/i,
  ]},
  // ─── FTP/SFTP config ───
  { name: 'FTP_CONFIG_ACCESS', severity: 'MEDIUM', patterns: [
    /sftp-config\.json$/i, /ftpsync\.settings$/i,
    /\.ftpconfig$/i, /\.ftppass$/i, /\.remote-sync\.json$/i, /ftp-deploy\.json$/i,
  ]},
  // ─── JS files leaking app structure ───
  { name: 'JS_FILE_PROBE', severity: 'LOW', patterns: [
    /^\/env\.js$/i, /^\/main\.js$/i, /^\/index\.js$/i, /^\/app\.js$/i,
  ]},
  // ─── Server info routes ───
  { name: 'SERVER_INFO', severity: 'LOW', patterns: [
    /^\/server-(status|info)$/i, /^\/info$/i,
  ]},
  // ─── Swagger/OpenAPI probes ───
  { name: 'API_DOCS_PROBE', severity: 'LOW', patterns: [
    /^\/swagger/i, /^\/api\/swagger\.(json|yml|yaml)$/i,
    /^\/api-docs/i, /^\/v\d+\/api-docs/i,
  ]},
  // ─── Environment leak attempts ───
  { name: 'ENV_LEAK', severity: 'HIGH', patterns: [
    /^\/_env/i, /^\/env$/i, /^\/config\//i,
  ]},
  // ─── Brute force discovery ───
  { name: 'DISCOVERY_PROBE', severity: 'LOW', patterns: [
    /^\/old$/i, /^\/new$/i, /^\/test$/i, /^\/demo$/i,
    /^\/www$/i, /^\/main$/i, /^\/site$/i, /^\/shop$/i,
    /^\/bc$/i, /^\/sitio$/i, /^\/sito$/i,
    /^\/oldsite$/i, /^\/old-site$/i, /^\/script$/i, /^\/\d{4}$/i,
  ]},
  // ─── Package/dependency files ───
  { name: 'DEPENDENCY_PROBE', severity: 'MEDIUM', patterns: [
    /\/package\.json$/i, /\/composer\.(json|lock)$/i,
    /\/Gemfile(\.lock)?$/i, /\/requirements\.txt$/i,
  ]},
  // ─── Docker/container probes ───
  { name: 'DOCKER_PROBE', severity: 'MEDIUM', patterns: [
    /docker-compose\.(yml|yaml)$/i, /Dockerfile$/i, /\/docker\//i,
    /^\/\.dockerenv$/i,
  ]},
  // ─── Cloud credential probes ───
  { name: 'CLOUD_CREDENTIAL_PROBE', severity: 'HIGH', patterns: [
    /^\/aws/i, /\/aws[_-]s3/i, /\/aws[_-]ses/i,
  ]},
  // ─── Log file probes ───
  { name: 'LOG_FILE_PROBE', severity: 'LOW', patterns: [
    /\.log$/i, /\/error_log$/i,
  ]},
  // ─── Vite dev server exploits (CVE-2025-30208) ───
  { name: 'VITE_EXPLOIT', severity: 'HIGH', patterns: [
    /^\/@fs\//i, /^\/@vite\//i, /^\/@id\//i,
  ]},
  // ─── Laravel/Django debug probes ───
  { name: 'DEBUG_PROBE', severity: 'MEDIUM', patterns: [
    /^\/_ignition/i, /^\/__debug__/i,
  ]},
  // ─── Java/Tomcat/Spring Boot probes ───
  { name: 'JAVA_FRAMEWORK_PROBE', severity: 'MEDIUM', patterns: [
    /\/WEB-INF/i, /^\/manager\/html/i, /^\/solr/i, /^\/actuator/i,
    /\/elmah\.axd$/i, /^\/servlet\//i, /bsh\.servlet/i,
    /^\/struts\//i, /^\/invoker\//i, /\.action$/i,
  ]},
  // ─── Mail server / webmail probes ───
  { name: 'WEBMAIL_PROBE', severity: 'MEDIUM', patterns: [
    /\/mailcow/i, /^\/roundcube\//i, /^\/webmail\//i,
  ]},
  // ─── Open proxy probes ───
  { name: 'PROXY_PROBE', severity: 'MEDIUM', patterns: [
    /^\/ip$/i, /^\/proxy\.pac$/i,
  ]},
  // ─── IoT / Router exploits (Mirai/Muhstik botnets) ───
  { name: 'IOT_EXPLOIT', severity: 'HIGH', patterns: [
    /^\/HNAP1\//i, /^\/boaform\//i, /^\/GponForm\//i,
    /\.cgi$/i, /\.htm$/i,
  ]},
  // ─── VMware / virtualization probes ───
  { name: 'VMWARE_PROBE', severity: 'HIGH', patterns: [
    /^\/ui\/h5-/i, /^\/websso\//i,
  ]},
  // ─── Microsoft Exchange / SharePoint ───
  { name: 'EXCHANGE_PROBE', severity: 'HIGH', patterns: [
    /^\/owa\//i, /^\/aspnet_client\//i, /^\/autodiscover\//i,
    /^\/ecp\//i, /^\/_layouts\//i, /^\/_vti_bin\//i,
  ]},
  // ─── Self-hosted apps ───
  { name: 'SELFHOSTED_PROBE', severity: 'MEDIUM', patterns: [
    /^\/WebInterface\//i, /^\/owncloud\//i, /^\/nextcloud\//i,
  ]},
  // ─── Collaboration / monitoring ───
  { name: 'COLLAB_PROBE', severity: 'MEDIUM', patterns: [
    /^\/geoserver\//i, /^\/geowebcache\//i,
    /^\/confluence\//i, /^\/jira\//i,
    /^\/grafana\//i, /^\/kibana\//i, /^\/prometheus\//i,
  ]},
  // ─── CI/CD / DevOps probes ───
  { name: 'CICD_PROBE', severity: 'MEDIUM', patterns: [
    /^\/jenkins\//i, /\/j_acegi_security_check/i,
    /^\/portainer\//i, /^\/gitea\//i, /^\/gitlab\//i,
  ]},
  // ─── Kubernetes / container probes ───
  { name: 'K8S_PROBE', severity: 'MEDIUM', patterns: [
    /^\/metrics$/i, /^\/healthz$/i, /^\/readyz$/i, /^\/livez$/i,
    /^\/console\//i, /^\/debug\//i,
  ]},
  // ─── Appliance / NAS probes ───
  { name: 'APPLIANCE_PROBE', severity: 'MEDIUM', patterns: [
    /^\/storfs-asup$/i,
  ]},
  // ─── JS framework fingerprinting ───
  { name: 'FRAMEWORK_FINGERPRINT', severity: 'LOW', patterns: [
    /^\/_next/i, /^\/_rsc/i, /^\/__rsc/i, /^\/_vercel/i,
    /next\.config\.(js|mjs|ts)$/i, /nuxt\.config\.(js|ts)$/i,
    /craco\.config\.js$/i,
  ]},
  // ─── Deployment config probes ───
  { name: 'DEPLOY_CONFIG_PROBE', severity: 'MEDIUM', patterns: [
    /serverless\.(yml|yaml|json)$/i, /vercel\.json$/i, /netlify\.toml$/i,
    /\/helm\//i,
  ]},
  // ─── Generic upload/file directories ───
  { name: 'DIRECTORY_PROBE', severity: 'LOW', patterns: [
    /^\/uploads?$/i, /^\/images$/i, /^\/assets$/i,
    /^\/files$/i, /^\/media$/i, /^\/public$/i,
    /^\/modules$/i, /^\/plugins$/i, /^\/components$/i,
    /^\/system$/i, /^\/template$/i, /^\/includes?$/i,
    /^\/vendor$/i, /^\/local$/i, /^\/php$/i,
  ]},
  // ─── SQL/database file probes ───
  { name: 'DATABASE_FILE_PROBE', severity: 'HIGH', patterns: [
    /^\/db_/i, /^\/sql/i,
  ]},
];

// ─── Suspicious User-Agents ───
export const SUSPICIOUS_UA = [
  // Scanners
  /sqlmap/i,/nikto/i,/nmap/i,/masscan/i,/dirbuster/i,/gobuster/i,/wfuzz/i,
  /hydra/i,/burpsuite/i,/nessus/i,/metasploit/i,/zgrab/i,/nuclei/i,
  /acunetix/i,/netsparker/i,/havij/i,/w3af/i,/arachni/i,
  /openvas/i,/qualys/i,/rapid7/i,/sonar/i,
  // Crawlers/bots
  /python-requests\/[0-9]/i,/go-http-client/i,/curl\/[0-9]/i,/wget\/[0-9]/i,
  /libwww-perl/i,/scanner/i,/exploit/i,
  /spider/i,/crawler/i,/bot/i,
  // Framework-specific scanners
  /wpscan/i,/joomscan/i,/droopescan/i,/cmseek/i,
  /xsstrike/i,/dalfox/i,/subfinder/i,/httpx/i,
];

// ─── Detect attacks in request content ───
export function detectAttacks(text) {
  if (!text) return [];
  const found = [];
  for (const rule of ATTACK_PATTERNS) {
    for (const pat of rule.patterns) { if (pat.test(text)) { found.push({name:rule.name,severity:rule.severity}); break; } }
  }
  return found;
}

// ─── Detect attacks in URL path ───
export function detectPathAttacks(path) {
  if (!path) return [];
  const found = [];
  // Normalize: collapse double slashes
  const normalizedPath = path.replace(/\/+/g, '/');
  // Also try decoded form
  let decodedPath = normalizedPath;
  if (normalizedPath.includes('%')) {
    try { decodedPath = decodeURIComponent(normalizedPath); } catch(_){}
  }

  for (const rule of PATH_PATTERNS) {
    for (const pat of rule.patterns) {
      if (pat.test(normalizedPath) || (decodedPath !== normalizedPath && pat.test(decodedPath))) {
        found.push({name:rule.name,severity:rule.severity});
        break;
      }
    }
  }
  return found;
}

// ─── Main analysis function ───
export function analyzeRequest(request, url, body, trapPaths) {
  const path = url.pathname;
  let query = url.search;
  try { query = decodeURIComponent(query.replace(/\+/g,' ')); } catch(_){}
  const ua = request.headers.get('User-Agent') || '';
  const referer = request.headers.get('Referer') || '';
  const combined = [path, query, body, ua, referer].join(' ');

  // Detect content-based attacks
  let types = detectAttacks(combined);

  // Detect path-based attacks
  const pathAttacks = detectPathAttacks(path);
  types = [...types, ...pathAttacks];

  // Detect suspicious user agents
  if (SUSPICIOUS_UA.some(p=>p.test(ua))) types.push({name:'SUSPICIOUS_UA',severity:'MEDIUM'});

  // CVE-2026-25253: gatewayUrl parameter (RCE / token exfiltration)
  if (url.searchParams.get('gatewayUrl')) {
    types.push({name:'CVE_2026_25253_GATEWAY_URL',severity:'CRITICAL'});
  }
  // CVE-2026-28464: sessionId/sessionFile path traversal
  const sParam = url.searchParams.get('sessionId')||url.searchParams.get('session_id')||url.searchParams.get('sessionFile')||url.searchParams.get('session_file')||'';
  if (sParam && (sParam.includes('..') || sParam.startsWith('/'))) {
    types.push({name:'CVE_2026_28464_PATH_TRAVERSAL',severity:'HIGH'});
  }
  // Auth attempts: flag both stolen-token use and other bypass attempts
  const authHdr = request.headers.get('Authorization') || '';
  if (authHdr) {
    if (authHdr.includes('ocgw-demo-token-not-real')) {
      // Attacker is using the leaked honeypot token — credential theft confirmed
      types.push({name:'STOLEN_TOKEN_USE',severity:'CRITICAL'});
    } else {
      types.push({name:'AUTH_BYPASS_ATTEMPT',severity:'HIGH'});
    }
  }

  const trap = trapPaths[path];
  if (trap && !['RECON','STATUS_ACCESS','HEALTH_CHECK'].includes(trap.type)) {
    if (!types.find(t=>t.name===trap.type)) types.push({name:trap.type,severity:trap.severity});
  }

  // Deduplicate by name
  const seen = new Set();
  const unique = types.filter(t => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });

  let maxSev = 'CLEAN';
  for (const t of unique) { if (SEVERITY_RANK[t.severity]>SEVERITY_RANK[maxSev]) maxSev=t.severity; }
  return { types: unique.map(t=>t.name), severity: maxSev };
}
