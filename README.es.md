# Workers Honeypot

Un honeypot multi-skin sobre Cloudflare Workers y D1 para investigación defensiva, telemetría de ataques, análisis de patrones de credenciales y visualización de amenazas en tiempo real.

[English](README.md) · [中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Português](README.pt-BR.md)

![Globo de amenazas](assets/honeypot-banner.png)

> Proyecto solo para investigación. Los datos señuelo son sintéticos. No lo uses para recopilar credenciales reales.

## Funciones

- Superficies señuelo para OpenClaw, MCP, Langflow y n8n
- Worker de Cloudflare con almacenamiento D1
- Globo WebGL, fronteras simplificadas y arcos de ataque animados
- Feed con IP, ciudad/país GeoIP, ASN, hostname objetivo, método, ruta y severidad
- Estadísticas agregadas de patrones y longitudes de contraseñas
- Más de 200 patrones de detección
- Integración WAF opcional con modo dry-run

## Despliegue rápido

## Capturas y arquitectura

![Console](docs/screenshots/console-globe.png)
![Attack feed](docs/screenshots/attack-feed.png)
![Credential intelligence](docs/screenshots/credential-intelligence.png)
![Honeypot themes](docs/screenshots/honeypot-themes.png)

Las solicitudes se enrutan a cuatro skins, un analizador común las guarda en D1 y la consola Admin muestra el globo, el feed y los agregados de credenciales.

```bash
git clone https://github.com/stephenlzc/workers-honeypot.git
cd workers-honeypot
npm ci
npm run setup:cloudflare
```

El script crea o reutiliza D1, aplica el esquema, solicita `ADMIN_PASSWORD` como Secret y despliega. La contraseña no se guarda en archivos.

## Seguridad

Las claves, tokens, archivos y usuarios señuelo son ficticios. Las contraseñas recibidas nunca se guardan en texto plano: solo se conservan hashes de identificadores, longitud y etiquetas de patrón.

No hay contraseña predeterminada: configura `npx wrangler secret put ADMIN_PASSWORD`. El Deploy Button automatiza el Worker, pero D1 y el Secret requieren autorización. Los resultados son observaciones de tu propio honeypot, no atribución global.
