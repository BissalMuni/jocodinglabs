# Research: AI Tech Tracker

**Date**: 2026-02-28
**Feature**: 001-ai-tech-tracker

## Frontend Framework

**Decision**: Next.js (App Router)
**Rationale**: 풀스택 프레임워크로 프론트엔드와 API Routes를 단일 프로젝트에서 관리. Vercel과 네이티브 통합. 관리자 대시보드의 동적 인터랙션(CRUD, 필터링, 검색)에 적합.
**Alternatives considered**:
- Astro: 정적 콘텐츠 사이트에 최적화되어 있으나, 동적 관리 기능이 많은 이 프로젝트에는 부적합. React islands 패턴이 오히려 복잡도 증가.

## Data Storage

**Decision**: Turso (SQLite edge database)
**Rationale**: 무료 티어 5GB 저장소 (500개 항목에 충분). 풀 SQL 지원으로 필터링/검색 용이. Edge 배포로 Vercel과 낮은 지연 시간. 자동 일시정지 없음. 설정 5분.
**Alternatives considered**:
- Supabase: 무료 티어 500MB + 1주 비활성 시 자동 일시정지 (운영 불가)
- JSON 파일: Vercel serverless에서 디스크 쓰기 불가 (프로덕션 불가)
- Vercel KV: Key-value 전용, 구조화 쿼리 불가
- Neon Postgres: 0.5GB 저장소 제한, 이 규모에 과도

## YouTube Transcript Extraction

**Decision**: youtube-transcript (npm 패키지)
**Rationale**: TypeScript 네이티브 지원. API 키 불필요. Next.js API Routes에서 직접 사용 가능. 가장 간단한 인터페이스. Python 의존성 없음.
**Alternatives considered**:
- @playzone/youtube-transcript: 더 많은 기능(SRT/WebVTT 출력, 프록시 지원)이지만 이 프로젝트에는 과도
- Python youtube-transcript-api: Node.js에서 child_process 호출 필요, 복잡도 증가
- YouTube Data API v3 Captions: 공식 API이나 자막 다운로드에 인증 및 소유권 필요

## LLM Integration

**Decision**: Claude API (@anthropic-ai/sdk)
**Rationale**: Constitution에서 Claude를 주력 LLM으로 명시. 구조화된 출력(JSON)에 강함. 한국어 자막 분석 성능 우수.
**Alternatives considered**:
- OpenAI GPT-4: 유사한 성능이나 Constitution 원칙과 불일치
- 로컬 LLM: 무료이나 Vercel serverless 환경에서 실행 불가

## ORM

**Decision**: Drizzle ORM
**Rationale**: TypeScript-first. Turso(SQLite)와 공식 지원. 경량. SQL에 가까운 문법으로 학습 곡선 낮음.
**Alternatives considered**:
- Prisma: 더 성숙하나 번들 크기가 크고 serverless cold start 느림
- 직접 SQL: ORM 없이 가능하나 타입 안전성 부재

## Deployment

**Decision**: Vercel (무료 티어)
**Rationale**: Next.js 네이티브 지원. 자동 배포. 환경변수 관리. 무료 티어로 충분.

## CSS/UI

**Decision**: Tailwind CSS
**Rationale**: Next.js와 기본 통합. 반응형 디자인 용이. 빠른 개발. 별도 CSS 파일 관리 불필요.
