// ============================================================
// FAKE SHELL INTERPRETER
// ============================================================

import { FAKE_FS, HONEYPOT_VERSION, FAKE_NODE_VERSION } from './openclaw.js';

const LS_ROOT = `total 52\ndrwx------  7 root root 4096 Mar 13 10:00 .\ndrwxr-xr-x 19 root root 4096 Mar 12 09:55 ..\n-rw-------  1 root root  512 Mar 13 08:30 .bash_history\n-rw-r--r--  1 root root 3526 Mar 12 09:55 .bashrc\ndrwx------  2 root root 4096 Mar 12 09:55 .ssh\ndrwxr-xr-x  3 root root 4096 Mar 13 10:00 .openclaw\n-rw-r--r--  1 root root 2048 Mar 13 10:00 config.json\n-rw-------  1 root root 8192 Mar 13 10:00 customers.db\n-rwxr-xr-x  1 root root  892 Mar 12 10:00 deploy.sh\ndrwxr-xr-x  2 root root 4096 Mar 13 10:00 logs\n-rw-r--r--  1 root root  256 Mar 12 09:55 .profile`;

const LS_SSH = `total 24\ndrwx------  2 root root 4096 Mar 12 09:55 .\ndrwx------  7 root root 4096 Mar 13 10:00 ..\n-rw-------  1 root root 2610 Mar 12 09:55 id_rsa\n-rw-r--r--  1 root root  574 Mar 12 09:55 id_rsa.pub\n-rw-r--r--  1 root root  574 Mar 12 09:55 authorized_keys`;

const LS_OPENCLAW = `total 16\ndrwxr-xr-x  3 root root 4096 Mar 13 10:00 .\ndrwx------  7 root root 4096 Mar 13 10:00 ..\n-rw-r--r--  1 root root 2847 Mar 13 10:00 openclaw.json\ndrwxr-xr-x  3 root root 4096 Mar 13 10:00 agents`;

const FAKE_PS = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.0  21500  1200 ?        Ss   00:30   0:00 /sbin/init\nroot       312  0.0  0.1  15432  4321 ?        Ss   00:30   0:00 /usr/sbin/sshd -D\nroot       891  0.0  0.0  65536  2048 ?        Ss   00:30   0:00 nginx: master process\nwww-data   892  0.0  0.0  66100  1792 ?        S    00:30   0:00 nginx: worker process\nroot      1024  2.3  4.2 876432 87234 ?        Sl   00:30  12:34 node /usr/local/bin/openclaw gateway\nroot      1025  0.1  0.8 312400 16384 ?        Sl   00:30   0:23 node /usr/local/bin/openclaw daemon\nroot      1847  0.0  0.1  24824  4096 pts/0    Ss   14:20   0:00 -bash\nroot      2031  0.0  0.0  11984  1024 pts/0    R+   14:23   0:00 ps aux`;

const FAKE_NETSTAT = `Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address    Foreign Address  State       PID/Program\ntcp        0      0 0.0.0.0:18789    0.0.0.0:*        LISTEN      1024/node\ntcp        0      0 0.0.0.0:22       0.0.0.0:*        LISTEN       312/sshd\ntcp        0      0 0.0.0.0:80       0.0.0.0:*        LISTEN       891/nginx\ntcp        0      0 0.0.0.0:443      0.0.0.0:*        LISTEN       891/nginx\ntcp6       0      0 :::18789         :::*             LISTEN      1024/node\ntcp6       0      0 :::22            :::*             LISTEN       312/sshd`;

const FAKE_ENV_OUTPUT = `SHELL=/bin/bash\nPWD=/root\nHOME=/root\nUSER=root\nLOGNAME=root\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nNODE_ENV=production\nPORT=18789\nANTHROPIC_API_KEY=sk-ant-example-not-a-real-key\nOPENAI_API_KEY=sk-proj-example-not-a-real-key\nOPENCLAW_GATEWAY_TOKEN=ocgw-demo-token-not-real\nOPENCLAW_VERSION=2026.3.12\nDB_HOST=db.internal.example\nDB_PASSWORD=demo-db-password\nREDIS_HOST=redis.internal.example\nREDIS_PASSWORD=demo-redis-password`;

const FAKE_IFCONFIG = `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.0.2.55  netmask 255.255.0.0  broadcast 192.0.2.255\n        inet6 fe80::216:3eff:fe00:1234  prefixlen 64  scopeid 0x20<link>\n        ether 00:16:3e:00:12:34  txqueuelen 1000  (Ethernet)\n        RX packets 48291  bytes 12348291 (12.3 MB)\n        TX packets 32184  bytes 8921034 (8.9 MB)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>\n        loop  txqueuelen 1000  (Local Loopback)`;

const FAKE_DF = `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   12G   26G  32% /\ntmpfs           3.9G     0  3.9G   0% /dev/shm\n/dev/sda2       100G   45G   50G  47% /data`;

const FAKE_FREE = `               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       2.3Gi       3.1Gi       124Mi       2.4Gi       5.1Gi\nSwap:          2.0Gi          0B       2.0Gi`;

const FAKE_AWS_META = `ami-id\nami-launch-index\nami-manifest-path\nhostname\ninstance-action\ninstance-id\ninstance-life-cycle\ninstance-type\nlocal-hostname\nlocal-ipv4\nmac\nnetwork/\nplacement/\npublic-hostname\npublic-ipv4\npublic-keys/\nreservation-id\nsecurity-groups`;

const HELP_TEXT = `OpenClaw Gateway Shell v${HONEYPOT_VERSION}\n\nAvailable commands:\n  whoami, id, pwd, hostname, date, uname    - System info\n  ls, cat, find, grep                       - Filesystem\n  ps, netstat, ifconfig, df, free, uptime   - Process/network\n  env, printenv                             - Environment\n  history, echo, clear, exit               - Shell builtins\n  openclaw, node, npm, python3, git         - Application\n  ssh, curl, wget, mysql                    - Network tools\n  chmod, chown, sudo                        - Permissions`;

function resolveFilePath(rawPath) {
  const p = rawPath.replace(/^~/, '/root').replace(/\/+$/, '');
  return p || '/root';
}

export function executeShellCommand(cmd) {
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
    case 'hostname': return ok('demo-host');
    case 'clear': return ok('__CLEAR__');
    case 'exit': case 'logout': return ok('logout\nConnection to demo-host closed.');
    case 'help': return ok(HELP_TEXT);
    case 'date': return ok(new Date().toUTCString().replace('GMT', 'UTC'));
    case 'uptime': return ok(` 14:23:01 up 13:52,  1 user,  load average: 0.42, 0.38, 0.31`);
    case 'uname':
      if (args.includes('-a') || args.includes('-r') || args.includes('-s')) {
        return ok('Linux demo-host 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux');
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
        return ok(`ANTHROPIC_API_KEY=sk-ant-example-not-a-real-key\nOPENCLAW_GATEWAY_TOKEN=ocgw-demo-token-not-real\nDB_PASSWORD=demo-db-password`);
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
      if (args.startsWith('inspect')) return ok(JSON.stringify([{Id:'a3f2e1b9c4d8',Name:'/openclaw_gateway',Config:{Env:['ANTHROPIC_API_KEY=sk-ant-example-not-a-real-key','NODE_ENV=production','OPENCLAW_GATEWAY_TOKEN=ocgw-demo-token-not-real']},NetworkSettings:{IPAddress:'192.0.2.2'}}], null, 2));
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
      if (args.startsWith('channels')) return ok(`whatsapp  connected  +1-555-0100\ntelegram  connected  @oc_assistant_bot\ndiscord   connected  My Homelab\nslack     error      OAuth token expired\nsignal    error      QR code scan required`);
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
      if (args === 'log' || args.startsWith('log ')) return ok(`commit a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2\nAuthor: root <root@example.com>\nDate:   Thu Mar 13 00:30:00 2026 +0000\n\n    chore: update gateway config`);
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
      return err(`ERROR 2003 (HY000): Can't connect to MySQL server on 'db.internal.example' (111 "Connection refused")`);
    case 'redis-cli':
      return err(`Could not connect to Redis at redis.internal.example:6379: Connection refused`);
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
