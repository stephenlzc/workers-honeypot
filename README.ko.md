# Workers Honeypot

Workers Honeypot은 Cloudflare Workers와 D1에서 실행되는 다중 스킨 허니팟입니다. 방어적 보안 연구, 공격 텔레메트리, 자격 증명 패턴 분석 및 실시간 위협 시각화를 위한 프로젝트입니다.

[English](README.md) · [中文](README.zh-CN.md) · [Español](README.es.md) · [日本語](README.ja.md) · [Português](README.pt-BR.md)

![Threat globe](assets/honeypot-banner.png)

> 연구 전용 프로젝트입니다. 모든 미끼 데이터는 합성 데이터이며 실제 자격 증명을 수집하지 마세요.

## 주요 기능

- OpenClaw, MCP, Langflow, n8n 미끼 인터페이스
- Cloudflare Worker 및 D1 로그 저장
- WebGL 위협 지구본과 애니메이션 공격 경로
- 출발지 IP, GeoIP 도시/국가, ASN, 대상 호스트, 메서드, 경로, 심각도
- 비밀번호 길이/패턴과 식별자 유형 집계
- 200개 이상의 공격 탐지 패턴

## 스크린샷과 아키텍처

### 운영 콘솔

라이브 콘솔은 WebGL 위협 지구본, 출발지-목적지 공격 아크, 추세 카드와 이벤트 피드를 한 화면에 결합합니다.

<p align="center"><img src="docs/screenshots/console-globe.png" alt="실제 WebGL 위협 지구본과 콘솔 렌더링" width="100%" /></p>

### 실시간 공격 피드

각 이벤트 카드에는 관측된 출발지 주소, 대상 허니팟, 메서드와 경로, 심각도, Threat Score와 Bot Score가 표시됩니다. 데이터는 로컬 합성 텔레메트리입니다.

<p align="center"><img src="docs/screenshots/attack-feed.png" alt="실제 실시간 공격 피드 렌더링" width="78%" /></p>

### 자격 증명 및 공격 인텔리전스

비밀번호 패턴과 길이, 식별자 유형, 공격 방법을 집계합니다. 평문 비밀번호는 저장하거나 표시하지 않습니다.

<p align="center"><img src="docs/screenshots/credential-intelligence.png" alt="실제 자격 증명 인텔리전스 패널" width="78%" /></p>

### 허니팟 테마

네 가지 디코이 스킨은 하나의 텔레메트리 엔진을 공유하면서 OpenClaw, MCP, Langflow와 n8n 화면을 제공합니다.

<p align="center"><img src="docs/screenshots/honeypot-themes.png" alt="멀티 스킨 허니팟 테마" width="92%" /></p>

요청은 네 스킨으로 라우팅되고 공통 분석기가 D1에 저장하며 보호된 Admin API가 지구본, Feed와 자격 증명 집계를 제공합니다.

### Cloudflare Deploy Button

가장 빠르게 시험하려면 Cloudflare Workers를 사용할 수 있습니다. 먼저 Fork한 뒤 공식 버튼으로 배포를 시작하세요.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/stephenlzc/workers-honeypot)

버튼은 Worker 배포 흐름만 시작하며, D1과 `ADMIN_PASSWORD` Secret은 Fork에서 직접 승인하고 설정해야 합니다.

```bash
git clone https://github.com/stephenlzc/workers-honeypot.git
cd workers-honeypot
npm ci
npm run setup:cloudflare
```

설정 스크립트는 D1을 생성 또는 재사용하고 스키마를 적용한 뒤 `ADMIN_PASSWORD` Secret을 입력받아 배포합니다. 비밀번호는 파일에 저장되지 않습니다.

## 보안

미끼 키, 토큰, 파일 및 사용자는 모두 가짜입니다. 비밀번호 평문은 저장하지 않고 식별자 해시, 길이, 패턴 레이블만 보관합니다.

기본 관리자 비밀번호는 없습니다. `npx wrangler secret put ADMIN_PASSWORD`로 설정하세요. Deploy Button은 Worker만 자동화하며 D1과 Secret은 사용자의 승인이 필요합니다.

## 감사의 글

이 프로젝트는 다음 오픈 소스 프로젝트, 플랫폼, 시각적 참고 자료와 공개 연구를 바탕으로 합니다.

- [OpenClaw Honey-Pot](https://github.com/inwpu/openclaw-Honey-Pot): 상위 Worker, OpenClaw 디코이 화면, 셸 시뮬레이션, 스키마와 초기 Admin 흐름.
- [hono-honeypot](https://github.com/ph33nx/hono-honeypot): 분석기에 적용하고 확장한 공격 탐지 패턴의 출처.
- [kumogakure](https://github.com/turntuptechnologies-ai/kumogakure), [HoneyPot](https://github.com/Jack-Rolls/HoneyPot), [workers-tarpit](https://github.com/crumrine/workers-tarpit): 허니팟 아키텍처와 설계 참고 자료.
- [Kaspersky Cybermap](https://cybermap.kaspersky.com/) 및 [FortiGuard Threat Map](https://fortiguard.fortinet.com/threat-map): 위협 지구본과 공격 흐름 표현의 시각적 참고 자료.
- [globe.gl](https://github.com/vasturiano/globe.gl), [world-atlas](https://github.com/topojson/world-atlas), [topojson-client](https://github.com/topojson/topojson-client), [Chart.js](https://github.com/chartjs/Chart.js): 콘솔에서 사용하는 오픈 소스 시각화 라이브러리.
- [Cloudflare Workers](https://developers.cloudflare.com/workers/), [D1](https://developers.cloudflare.com/d1/), [Wrangler](https://developers.cloudflare.com/workers/wrangler/): 실행 환경, 저장소와 배포 도구.
- OpenClaw, MCP/MCPwn, Langflow, n8n, Open WebUI의 공개 문서와 Rapid7, SentinelOne, arXiv, Practical DevSecOps, Sysdig, Cato, Sangfor, secrss의 공개 보안 연구: 위협 모델링 참고 자료.

각 출처는 코드 계보, 도구, 디자인 영감 또는 연구 배경으로 구분해 기재했습니다. 본 프로젝트는 해당 프로젝트나 조직과 제휴하거나 보증받지 않았습니다.
