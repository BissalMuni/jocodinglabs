# Implementation Plan: AI Tech Tracker

**Branch**: `001-ai-tech-tracker` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-tech-tracker/spec.md`

## Summary

조코딩 유튜브 AI 뉴스 영상에서 소개되는 AI 기술들을 자막 기반으로 자동 추출하고, 웹사이트에서 목록 조회/검색/필터링 및 실습 추적을 제공하는 풀스택 웹 애플리케이션. Next.js App Router + Turso SQLite + youtube-transcript + Claude API 조합으로 구현.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: Next.js 16 (App Router), Drizzle ORM, @anthropic-ai/sdk, youtube-transcript-plus, Tailwind CSS
**Storage**: Turso (SQLite edge database, 무료 티어 5GB)
**Testing**: Vitest
**Target Platform**: Web (Vercel serverless)
**Project Type**: web-service (full-stack)
**Performance Goals**: 메인 페이지 3초 이내 로드, 검색 1초 이내 응답
**Constraints**: Vercel 무료 티어 (serverless function 10s timeout), Turso 무료 티어
**Scale/Scope**: 단일 관리자, 100-500 기술 항목, 낮은 트래픽

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Content-Driven | ✅ PASS | 출처 영상 링크, 메타데이터 포함. YouTube Data API로 필터링 |
| II. Hands-On First | ✅ PASS | 실습 상태/메모 추적 (localStorage) |
| III. Web Deploy & Manage | ✅ PASS | Vercel 무료 배포, 관리 인터페이스 포함, 반응형 |
| IV. Simplicity | ✅ PASS | 단일 저장소, 최소 의존성, 경량 DB |
| V. Incremental Growth | ✅ PASS | P1→P4 순차 구현, MVP는 P1+P4 |
| VI. Transcript-First | ✅ PASS | youtube-transcript + Claude API 주력. 분석 모듈 인터페이스 분리 |

**GATE RESULT**: ALL PASS - Phase 0 진행 가능

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-tech-tracker/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx               # Root layout (Tailwind, fonts)
│   ├── page.tsx                 # 메인 페이지 (기술 목록 조회)
│   ├── admin/
│   │   ├── page.tsx             # 관리자 로그인
│   │   ├── dashboard/
│   │   │   └── page.tsx         # 관리자 대시보드
│   │   └── extract/
│   │       └── page.tsx         # 자막 추출/분석 페이지
│   └── api/
│       ├── tech-items/
│       │   └── route.ts         # GET /api/tech-items
│       ├── categories/
│       │   └── route.ts         # GET /api/categories
│       └── admin/
│           ├── auth/
│           │   └── route.ts     # POST /api/admin/auth
│           ├── tech-items/
│           │   ├── route.ts     # POST /api/admin/tech-items
│           │   └── [id]/
│           │       └── route.ts # PUT, DELETE /api/admin/tech-items/[id]
│           ├── extract/
│           │   ├── route.ts     # POST /api/admin/extract
│           │   └── [jobId]/
│           │       ├── route.ts # GET /api/admin/extract/[jobId]
│           │       └── confirm/
│           │           └── route.ts # POST confirm
│           └── categories/
│               └── route.ts     # POST /api/admin/categories
│   ├── api/
│   │   ├── admin/
│   │   │   └── channel/
│   │   │       ├── sync/
│   │   │       │   └── route.ts     # POST /api/admin/channel/sync
│   │   │       └── analyze/
│   │   │           └── route.ts     # POST /api/admin/channel/analyze
│   │   └── cron/
│   │       └── sync-analyze/
│   │           └── route.ts         # GET /api/cron/sync-analyze (Vercel Cron)
├── components/
│   ├── tech-list.tsx            # 기술 목록 컴포넌트
│   ├── tech-card.tsx            # 기술 카드 (개별 항목)
│   ├── search-bar.tsx           # 검색/필터 바
│   ├── category-filter.tsx      # 카테고리 필터
│   ├── practice-tracker.tsx     # 실습 상태/메모 (localStorage)
│   ├── video-group-section.tsx  # 영상별 그룹 섹션
│   ├── admin/
│   │   ├── tech-form.tsx        # 기술 항목 폼 (추가/수정)
│   │   ├── extract-form.tsx     # URL 입력 폼
│   │   └── extract-results.tsx  # 추출 결과 검토/확정
│   └── ui/                      # 공통 UI 컴포넌트
├── db/
│   ├── schema.ts                # Drizzle 스키마 정의
│   ├── client.ts                # Turso 클라이언트
│   ├── seed.ts                  # 초기 카테고리 데이터
│   └── migrations/              # Drizzle 마이그레이션
├── lib/
│   ├── transcript.ts            # YouTube 자막 추출 모듈
│   ├── analyzer.ts              # LLM 분석 인터페이스 + Claude 구현
│   ├── admin-auth.ts            # 관리자 인증 미들웨어
│   ├── channel-scraper.ts       # 조코딩 채널 스크래핑
│   └── local-storage.ts         # localStorage 유틸리티 (실습 추적)
└── types/
    └── index.ts                 # 공유 타입 정의
```

**Structure Decision**: 단일 Next.js 프로젝트 (Option 2의 frontend/backend 분리 불필요). `src/` 디렉토리 사용. API Routes로 백엔드 로직 처리. `lib/`에 분석 모듈을 인터페이스로 분리하여 Constitution VI 원칙(교체 가능한 분석 모듈) 충족.
