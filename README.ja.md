# Workers Honeypot

Cloudflare Workers と D1 で動作する多テーマ honeypot です。防御的なセキュリティ研究、攻撃テレメトリ、認証情報パターン分析、リアルタイム脅威可視化を目的とします。

[English](README.md) · [中文](README.zh-CN.md) · [Español](README.es.md) · [한국어](README.ko.md) · [Português](README.pt-BR.md)

![Threat globe](assets/honeypot-banner.png)

> 研究用途のみ。おとりデータはすべて合成データです。実際の認証情報を収集しないでください。

## 主な機能

- OpenClaw、MCP、Langflow、n8n のおとり画面
- Cloudflare Worker と D1 によるログ保存
- WebGL の脅威地球儀とアニメーション攻撃アーク
- 送信元 IP、GeoIP 都市/国、ASN、対象ホスト、メソッド、パス、重大度
- パスワードの長さ・パターン・識別子種別の集計
- 200 以上の攻撃検出パターン

## クイックスタート

## スクリーンショットと構成

![Console](docs/screenshots/console-globe.png)
![Attack feed](docs/screenshots/attack-feed.png)
![Credential intelligence](docs/screenshots/credential-intelligence.png)
![Honeypot themes](docs/screenshots/honeypot-themes.png)

リクエストは 4 つのスキンに振り分けられ、共通アナライザーが D1 に保存し、保護された Admin API が地球儀・Feed・認証情報集計を表示します。

```bash
git clone https://github.com/stephenlzc/workers-honeypot.git
cd workers-honeypot
npm ci
npm run setup:cloudflare
```

セットアップでは D1 の作成、スキーマ適用、`ADMIN_PASSWORD` Secret の設定、デプロイを行います。パスワードはファイルに保存されません。

## 安全性

おとりのキー、トークン、ファイル、ユーザーは架空です。パスワードの平文は保存せず、識別子ハッシュ、長さ、パターンラベルのみ保持します。

デフォルトの管理者パスワードはありません。`npx wrangler secret put ADMIN_PASSWORD` を実行してください。Deploy Button は Worker のみを自動化し、D1 と Secret は利用者の承認が必要です。
