# Workers Honeypot

Cloudflare Workers와 D1에서 실행되는 다중 스킨 허니팟입니다. 방어적 보안 연구, 공격 텔레메트리, 자격 증명 패턴 분석 및 실시간 위협 시각화를 위한 프로젝트입니다.

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

## 빠른 시작

## 스크린샷과 아키텍처

![Console](docs/screenshots/console-globe.png)
![Attack feed](docs/screenshots/attack-feed.png)
![Credential intelligence](docs/screenshots/credential-intelligence.png)
![Honeypot themes](docs/screenshots/honeypot-themes.png)

요청은 네 스킨으로 라우팅되고 공통 분석기가 D1에 저장하며 보호된 Admin API가 지구본, Feed와 자격 증명 집계를 제공합니다.

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
