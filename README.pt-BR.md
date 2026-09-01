# Workers Honeypot

Um honeypot multi-skin em Cloudflare Workers e D1 para pesquisa defensiva, telemetria de ataques, análise de padrões de credenciais e visualização de ameaças em tempo real.

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

## Início rápido

## Capturas e arquitetura

![Console](docs/screenshots/console-globe.png)
![Attack feed](docs/screenshots/attack-feed.png)
![Credential intelligence](docs/screenshots/credential-intelligence.png)
![Honeypot themes](docs/screenshots/honeypot-themes.png)

As solicitações são roteadas para quatro skins, um analisador comum grava no D1 e a API Admin protegida mostra globo, feed e agregados de credenciais.

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
