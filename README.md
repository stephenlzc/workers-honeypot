# OpenClaw Honeypot

一个运行在 Cloudflare Workers 上的 OpenClaw 蜜罐，伪装成 OpenClaw v2026.3.12 实例，记录并分析针对该软件的攻击行为。

> 部署示例：[claw.hxorz.com](https://claw.hxorz.com)
> 项目详细说明：[我用 Cloudflare Workers 搭了一个 OpenClaw 蜜罐](https://github.com/inwpu/openclaw-Honey-Pot)

---

## 功能特性

### 真实指纹模拟
- 完整的 OpenClaw v2026.3.12 控制台界面（7个标签页）
- HTTP 响应头 `X-OpenClaw-Version` / `X-Powered-By` 按真实版本填写
- 可被 FOFA、Shodan 等搜索引擎正常收录

### 控制台标签页
| 标签 | 内容 |
|---|---|
| Overview | 通道状态、API 端点列表、安全公告 |
| Chat | 伪造的 AI 对话记录，含工具调用日志 |
| Sessions | 会话详情，包含 token 用量和费用 |
| Config | 配置文件预览，API Key 脱敏显示 |
| Logs | 网关启动日志 |
| Terminal | 可交互的假 Shell |
| Skills | 14个已安装技能列表 |

### 假文件系统
包含精心构造的诱饵文件：
- `/root/.bash_history` — 含 MySQL 明文密码的命令历史
- `/root/.ssh/id_rsa` — 完整格式的假 SSH 私钥
- `/root/.openclaw/openclaw.json` — 含 API Key 和 gateway token 的配置
- `/root/config.json` — 数据库连接配置
- `/root/customers.db` — 247条伪造客户数据
- `/etc/passwd` — 标准 Linux 格式

### 假 Shell（Terminal 标签）
支持 30+ 命令，含 80-200ms 随机延迟：
- 系统信息：`whoami`、`id`、`uname`、`hostname`
- 文件操作：`ls`、`cat`、`find`、`grep`
- 进程/网络：`ps`、`netstat`、`ifconfig`、`docker ps`
- 环境变量：`env`（包含假 API Key 和密码）
- Docker/K8s：`docker inspect`、`kubectl get pods`
- OpenClaw：`openclaw status`、`openclaw config`

### CVE 陷阱（7个）
| CVE | 攻击方式 | 蜜罐行为 |
|---|---|---|
| CVE-2026-25253 | `?gatewayUrl=攻击者地址` | 返回含假 token 的 WebSocket JS 代码 |
| GHSA-rchv-x836-w7xp | 访问仪表盘 | 假 token 写入 localStorage |
| CVE-2026-28464 | `?sessionId=../../etc/passwd` | 路径穿越，返回对应假文件 |
| CVE-2026-32060 | `POST /api/v1/agent/apply_patch` | 任意路径写入，返回成功响应 |
| CVE-2026-28470 | `POST /api/v1/exec/execute` | 假命令执行 |
| CVE-2026-26319 | `POST /webhooks/telnyx` | 无需认证的 Webhook 接入点 |
| GHSA-6mgf-v5j7-45cr | `GET /api/v1/gateway/fetch?url=` | 模拟 SSRF |

### 其他陷阱端点
- `GET /.env` — 含 API Key、DB 密码的环境变量文件
- `GET /.ssh/id_rsa` — SSH 私钥
- `GET /api/v1/agent/memory/export` — AI 记忆导出，含假凭证和银行信息
- `POST /api/v1/shell/execute` — 远程命令执行（全部假响应）
- `GET /v1/chat/completions`（OpenAI 兼容端点）

### robots.txt 诱导
`Disallow` 指令引导扫描器，注释中列出敏感端点路径，引导人工渗透测试者主动探测。

### 管理后台（/admin）
- 记录所有请求：IP、威胁评分、地理位置（来自 `request.cf`）
- 自动分类攻击类型：SQL 注入、命令注入、各 CVE 利用、`STOLEN_TOKEN_USE`
- 保存完整请求头，可查看攻击工具指纹
- 5次错误密码后封禁 IP 24小时

---

## 技术栈

- **运行时**：Cloudflare Workers（ESM）
- **数据库**：Cloudflare D1（SQLite）
- **代码**：单文件 `src/index.js`，无外部依赖

---

## 部署步骤

### 前置条件
- [Cloudflare 账号](https://dash.cloudflare.com)
- Node.js + npm
- `wrangler` CLI（项目已包含，直接用 `npx wrangler` 或 `npm run` 脚本）

### 1. 克隆并安装
```bash
git clone https://github.com/inwpu/openclaw-Honey-Pot.git
cd openclaw-Honey-Pot
npm install
```

### 2. 创建 D1 数据库
```bash
npx wrangler d1 create openclaw-honeypot
```
将返回的 `database_id` 填入 `wrangler.toml`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "openclaw-honeypot"
database_id = "YOUR_D1_DATABASE_ID"   # ← 替换这里
```

### 3. 初始化数据库表结构
```bash
npm run db:init:remote
```

### 4. 配置域名（可选）
如果要绑定自定义域名，修改 `wrangler.toml`：
```toml
[[routes]]
pattern = "your-honeypot-domain.com/*"
zone_name = "your-domain.com"
```
不绑自定义域名则直接使用 `*.workers.dev` 默认地址，删除 `[[routes]]` 块即可。

### 5. 设置管理密码
```bash
npx wrangler secret put ADMIN_PASSWORD
# 按提示输入密码
```

### 6. 部署
```bash
npm run deploy
```

### 7. Cloudflare Dashboard 手动配置（重要）

Cloudflare 默认安全规则会在流量到达 Worker 之前拦截攻击请求，导致蜜罐记录不到任何内容。需要针对蜜罐域名关闭以下规则：

**免费计划用户（只需处理两项）：**

1. **Security Level** → `Essentially Off`
   路径：Security > Overview > Security Level

2. **Bot Fight Mode** → 添加 Skip 规则
   路径：Security > WAF > Custom Rules > 新建规则
   条件：`Hostname equals your-honeypot-domain.com`
   操作：Skip > Bot Fight Mode
   （这样只影响蜜罐域名，不影响同 zone 下的其他子域名）

**付费计划用户额外处理：**
- WAF Managed Rules：全部禁用，或添加 Skip 规则
- Rocket Loader：Off（Speed > Optimization）

**建议添加 Cache Rule：**
匹配蜜罐域名，Cache Status = Bypass，确保每个请求都到达 Worker 被记录。

---

## 本地开发

```bash
# 创建本地密码文件
echo 'ADMIN_PASSWORD=openclaw-local-dev-2024' > .dev.vars

# 初始化本地数据库
npm run db:init:local

# 启动开发服务器（http://localhost:8787）
npm run dev
```

---

## 查看攻击记录

```bash
# 实时日志流
npx wrangler tail

# 管理后台（需要密码）
https://your-domain.com/admin
```

---

## 项目结构

```
.
├── src/
│   └── index.js      # 全部逻辑（~1400行），单文件 Worker
├── schema.sql         # D1 数据库建表语句
├── wrangler.toml      # Cloudflare Workers 配置
└── package.json
```

---

## 免责声明

本项目仅用于网络安全研究和攻击行为分析，所有"凭证"均为虚假诱饵数据，不代表任何真实系统。请勿将本项目用于任何非法用途。
