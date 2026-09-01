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

## Capturas y arquitectura

### Consola de operaciones

La consola en vivo combina el globo de amenazas WebGL, los arcos animados de origen a destino, las tarjetas de tendencias y el flujo de eventos.

<p align="center"><img src="docs/screenshots/console-globe.png" alt="Render real del globo WebGL y la consola" width="100%" /></p>

### Feed de ataques en vivo

Cada evento muestra la dirección de origen observada, el honeypot objetivo, método y ruta, severidad, puntuación de amenaza y Bot Score. Los datos son telemetría sintética local.

<p align="center"><img src="docs/screenshots/attack-feed.png" alt="Render real del feed de ataques" width="78%" /></p>

### Inteligencia de credenciales y ataques

El panel agrega patrones y longitudes de contraseñas, tipos de identificador y métodos de ataque. Nunca se conservan ni muestran contraseñas en texto claro.

<p align="center"><img src="docs/screenshots/credential-intelligence.png" alt="Render real del panel de inteligencia de credenciales" width="78%" /></p>

### Temas de honeypot

Las cuatro skins comparten un motor de telemetría y presentan superficies OpenClaw, MCP, Langflow y n8n.

<p align="center"><img src="docs/screenshots/honeypot-themes.png" alt="Temas de honeypot multi-skin" width="92%" /></p>

Las solicitudes se enrutan a cuatro skins, un analizador común las guarda en D1 y la consola Admin muestra el globo, el feed y los agregados de credenciales.

### Cloudflare Deploy Button

Cloudflare Workers es la forma más rápida de probar el proyecto. Haz Fork primero y usa el botón oficial para iniciar el despliegue:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/stephenlzc/workers-honeypot)

El botón inicia el flujo del Worker, pero D1 y el Secret `ADMIN_PASSWORD` todavía requieren autorización y configuración en tu Fork.

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
