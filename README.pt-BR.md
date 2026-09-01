# Workers Honeypot

O Workers Honeypot é um honeypot multi-skin em Cloudflare Workers e D1 para pesquisa defensiva, telemetria de ataques, análise de padrões de credenciais e visualização de ameaças em tempo real.

[English](README.md) · [中文](README.zh-CN.md) · [Español](README.es.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

![Globo de ameaças](assets/honeypot-banner.png)

> Projeto somente para pesquisa. Os dados de isca são sintéticos. Não colete credenciais reais.

## Recursos

- Interfaces de isca OpenClaw, MCP, Langflow e n8n
- Worker da Cloudflare com armazenamento D1
- Globo WebGL, fronteiras simplificadas e arcos de ataque animados
- Feed com IP, cidade/país GeoIP, ASN, hostname de destino, método, rota e severidade
- Estatísticas agregadas de padrões e comprimentos de senha
- Mais de 200 padrões de detecção

## Capturas e arquitetura

### Console de operações

O console ao vivo reúne o globo de ameaças WebGL, os arcos animados de origem para destino, os cartões de tendência e o feed de eventos em uma única visão.

<p align="center"><img src="docs/screenshots/console-globe.png" alt="Renderização real do globo WebGL e do console" width="100%" /></p>

### Feed de ataques ao vivo

Cada evento mostra o endereço de origem observado, o honeypot de destino, método e rota, severidade, Threat Score e Bot Score. Os dados são telemetria sintética local.

<p align="center"><img src="docs/screenshots/attack-feed.png" alt="Renderização real do feed de ataques" width="78%" /></p>

### Inteligência de credenciais e ataques

O painel agrega padrões e comprimentos de senha, tipos de identificador e métodos de ataque. Senhas em texto claro nunca são armazenadas ou exibidas.

<p align="center"><img src="docs/screenshots/credential-intelligence.png" alt="Renderização real do painel de inteligência de credenciais" width="78%" /></p>

### Temas de honeypot

As quatro skins compartilham um único mecanismo de telemetria e apresentam superfícies OpenClaw, MCP, Langflow e n8n.

<p align="center"><img src="docs/screenshots/honeypot-themes.png" alt="Temas de honeypot multi-skin" width="92%" /></p>

As solicitações são roteadas para quatro skins, um analisador comum grava no D1 e a API Admin protegida mostra globo, feed e agregados de credenciais.

### Cloudflare Deploy Button

Cloudflare Workers é a maneira mais rápida de testar o projeto. Faça o Fork primeiro e use o botão oficial para iniciar o deploy:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/stephenlzc/workers-honeypot)

O botão inicia o fluxo do Worker, mas o D1 e o Secret `ADMIN_PASSWORD` ainda exigem autorização e configuração no seu Fork.

```bash
git clone https://github.com/stephenlzc/workers-honeypot.git
cd workers-honeypot
npm ci
npm run setup:cloudflare
```

O script cria ou reutiliza o D1, aplica o schema, solicita `ADMIN_PASSWORD` como Secret e faz o deploy. A senha não é gravada em arquivo.

## Segurança

Chaves, tokens, arquivos e usuários de isca são fictícios. Senhas nunca são armazenadas em texto claro; somente hashes de identificadores, comprimento e rótulos de padrão são mantidos.

Não existe senha administrativa padrão: use `npx wrangler secret put ADMIN_PASSWORD`. O Deploy Button automatiza apenas o Worker; D1 e o Secret exigem autorização do fork.
