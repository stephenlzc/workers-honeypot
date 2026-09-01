# Workers Honeypot

Workers Honeypot 是一个运行在 Cloudflare Workers + D1 上的多主题蜜罐，用于防御性安全研究、攻击遥测、凭据模式分析和实时威胁可视化。

[English](README.md) · [Español](README.es.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Português](README.pt-BR.md)

![Threat globe](assets/honeypot-banner.png)

> 仅限研究用途。所有诱饵数据均为虚构。请勿部署到生产域名，也不要收集真实凭据。

## 功能

- OpenClaw、MCP、Langflow、n8n 四种蜜罐皮肤
- Cloudflare Worker 路由与 D1 日志存储
- WebGL 全球威胁球体和动态攻击弧线
- 攻击源 IP、GeoIP 城市/国家、ASN、目标域名、方法、路径和严重度
- 密码长度、密码模式和用户名类型聚合统计
- 200+ Web、CMS、容器、IoT、Kubernetes 和 OpenClaw 检测模式
- 可选 WAF 反馈闭环，默认支持 dry-run

## 截图

截图使用合成或模糊后的遥测数据，不代表全球威胁情报源。

### 作战控制台

实时控制台将 WebGL 威胁球体、动态攻击弧线、趋势卡片和事件流整合在同一视图中。

<p align="center"><img src="docs/screenshots/console-globe.png" alt="真实 WebGL 威胁球体与控制台渲染" width="100%" /></p>

### 实时攻击流

每个事件卡片展示观测到的源地址、命中的蜜罐目标、请求方法与路径、严重度、威胁评分和 Bot Score。示例数据来自本地合成遥测。

<p align="center"><img src="docs/screenshots/attack-feed.png" alt="真实实时攻击流页面" width="78%" /></p>

### 凭据与攻击情报

该区域展示密码模式、密码长度、标识符类型和攻击方法的聚合计数。系统不会保存或展示明文密码。

<p align="center"><img src="docs/screenshots/credential-intelligence.png" alt="真实凭据情报面板" width="78%" /></p>

### 蜜罐主题

四种诱饵皮肤共享同一套遥测引擎，同时呈现 OpenClaw、MCP、Langflow 和 n8n 四种不同界面。

<p align="center"><img src="docs/screenshots/honeypot-themes.png" alt="多主题蜜罐界面" width="92%" /></p>

## 架构

请求进入 Worker 后按主机名或路径分发到四种皮肤，由统一分析器写入 D1，再通过受保护的 Admin API 呈现球体、Feed 和凭据模式统计。

## 快速部署

```bash
git clone https://github.com/stephenlzc/workers-honeypot.git
cd workers-honeypot
npm ci
npm run setup:cloudflare
```

Setup 会检查 Wrangler 登录状态、创建或复用 D1、执行 schema、提示设置 Admin 密码并部署 Worker。密码不会写入文件。

### Cloudflare Deploy Button

Cloudflare Workers 是最快的试用方式。先 Fork 本项目，再点击官方按钮启动部署：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/stephenlzc/workers-honeypot)

按钮只能启动 Worker 部署流程；D1 数据库和 `ADMIN_PASSWORD` Secret 仍需要你在自己的 Fork 中授权和配置。

也可以手动执行：

```bash
npx wrangler login
npx wrangler d1 create workers-honeypot
npx wrangler d1 execute workers-honeypot --remote --file=schema.sql
npx wrangler secret put ADMIN_PASSWORD
npm run deploy
```

Admin 密码必须由部署者自己通过 Secret 配置；代码中没有默认密码。

Cloudflare Deploy Button 只能自动化 Worker 流程；D1 创建和 Admin Secret 仍需要 Fork 使用者授权。

## 安全模型

- 所有诱饵 API Key、Token、文件、用户和数据库记录均为虚构。
- 登录遥测只保存用户名哈希、密码长度和模式标签，密码明文会立即丢弃。
- Worker 不执行攻击者命令、不执行提交的代码，也不向第三方转发攻击载荷。
- GeoIP 可能显示代理、VPN、云服务商或出口节点，而非攻击者本人。

## 限制

本项目只展示你自己的蜜罐观测数据，不是商业威胁情报平台、攻击归因系统或真实网络路由追踪器。

## 路线图

高流量球体聚合、签名导出包和经过隐私审查的可选告警接收器。
