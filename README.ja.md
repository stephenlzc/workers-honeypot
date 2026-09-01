# Workers Honeypot

Workers Honeypot は Cloudflare Workers と D1 で動作する多テーマ honeypot です。防御的なセキュリティ研究、攻撃テレメトリ、認証情報パターン分析、リアルタイム脅威可視化を目的とします。

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

## スクリーンショットと構成

### オペレーションコンソール

ライブコンソールは WebGL 脅威地球儀、送信元から対象へのアーク、トレンドカード、イベントフィードを一つの画面にまとめます。

<p align="center"><img src="docs/screenshots/console-globe.png" alt="実際にレンダリングした WebGL 脅威地球儀とコンソール" width="100%" /></p>

### ライブ攻撃フィード

各イベントカードには送信元アドレス、対象となったハニーポット、メソッドとパス、重大度、Threat Score、Bot Score が表示されます。データはローカルの合成テレメトリです。

<p align="center"><img src="docs/screenshots/attack-feed.png" alt="実際にレンダリングした攻撃フィード" width="78%" /></p>

### 認証情報・攻撃インテリジェンス

パスワードのパターン・長さ、識別子種別、攻撃メソッドを集計表示します。平文パスワードは保存も表示もしません。

<p align="center"><img src="docs/screenshots/credential-intelligence.png" alt="実際にレンダリングした認証情報インテリジェンス" width="78%" /></p>

### ハニーポットテーマ

4 つのデコイスキンは同じテレメトリエンジンを共有し、OpenClaw、MCP、Langflow、n8n の画面を提供します。

<p align="center"><img src="docs/screenshots/honeypot-themes.png" alt="マルチスキンのハニーポットテーマ" width="92%" /></p>

リクエストは 4 つのスキンに振り分けられ、共通アナライザーが D1 に保存し、保護された Admin API が地球儀・Feed・認証情報集計を表示します。

### Cloudflare Deploy Button

最短で試すには Cloudflare Workers を利用できます。まず Fork して、公式ボタンからデプロイを開始してください。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/stephenlzc/workers-honeypot)

ボタンは Worker のデプロイフローを開始しますが、D1 と `ADMIN_PASSWORD` Secret は Fork 側で承認・設定する必要があります。

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

## 謝辞

本プロジェクトは、以下のオープンソースプロジェクト、プラットフォーム、ビジュアル参考資料、公開研究を基にしています。

- [OpenClaw Honey-Pot](https://github.com/inwpu/openclaw-Honey-Pot)：上流 Worker、OpenClaw のデコイ画面、シェルシミュレーション、スキーマ、初期 Admin フロー。
- [hono-honeypot](https://github.com/ph33nx/hono-honeypot)：アナライザーに適用・拡張した攻撃検出パターン。
- [kumogakure](https://github.com/turntuptechnologies-ai/kumogakure)、[HoneyPot](https://github.com/Jack-Rolls/HoneyPot)、[workers-tarpit](https://github.com/crumrine/workers-tarpit)：ハニーポットのアーキテクチャと設計の参考。
- [Kaspersky Cybermap](https://cybermap.kaspersky.com/) と [FortiGuard Threat Map](https://fortiguard.fortinet.com/threat-map)：脅威地球儀と攻撃フロー表示のビジュアル参考。
- [globe.gl](https://github.com/vasturiano/globe.gl)、[world-atlas](https://github.com/topojson/world-atlas)、[topojson-client](https://github.com/topojson/topojson-client)、[Chart.js](https://github.com/chartjs/Chart.js)：コンソールで使用するオープンソース可視化ライブラリ。
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)、[D1](https://developers.cloudflare.com/d1/)、[Wrangler](https://developers.cloudflare.com/workers/wrangler/)：実行環境、ストレージ、デプロイツール。
- OpenClaw、MCP/MCPwn、Langflow、n8n、Open WebUI の公開ドキュメント、および Rapid7、SentinelOne、arXiv、Practical DevSecOps、Sysdig、Cato、Sangfor、secrss の公開セキュリティ研究：脅威モデルの参考。

各ソースは、コードの系譜、ツール、デザインの着想、または研究背景として記載しています。本プロジェクトは各プロジェクト・組織と提携・推奨関係にありません。
