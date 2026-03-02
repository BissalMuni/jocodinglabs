# Tasks: AI Tech Tracker

**Input**: Design documents from `/specs/001-ai-tech-tracker/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and configuration

- [X] T001 Initialize Next.js 15 project with TypeScript, Tailwind CSS, App Router, src/ directory via `npx create-next-app@latest`
- [X] T002 Install core dependencies: `drizzle-orm @libsql/client @anthropic-ai/sdk youtube-transcript`
- [X] T003 Install dev dependencies: `drizzle-kit vitest`
- [X] T004 [P] Create `.env.local` with TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ANTHROPIC_API_KEY, ADMIN_PASSWORD placeholders
- [X] T005 [P] Create shared type definitions in `src/types/index.ts` (TechItem, SourceVideo, Category, ExtractionJob, PracticeData, ApiError)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Define Drizzle schema for all tables (tech_items, source_videos, tech_item_videos, categories, extraction_jobs) in `src/db/schema.ts`
- [X] T007 Create Turso database client in `src/db/client.ts`
- [X] T008 [P] Configure `drizzle.config.ts` for Turso connection
- [X] T009 [P] Create category seed script with 7 initial categories in `src/db/seed.ts`
- [X] T010 Run `npx drizzle-kit push` to apply schema and execute seed script (depends on T006-T009)
- [X] T011 [P] Implement admin authentication middleware in `src/lib/admin-auth.ts` (verify Authorization Bearer header against ADMIN_PASSWORD env var)
- [X] T012 [P] Create root layout with Tailwind CSS, fonts, and metadata in `src/app/layout.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - AI 기술 목록 조회 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 웹사이트에서 AI 기술 목록을 조회하고, 카테고리 필터와 텍스트 검색으로 원하는 기술을 빠르게 찾을 수 있다

**Independent Test**: 웹사이트에 접속하여 기술 목록이 최신순으로 표시되고, 카테고리 필터와 검색이 정상 동작하는지 확인

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement GET /api/tech-items route with category filter, search, sort query params in `src/app/api/tech-items/route.ts`
- [X] T014 [P] [US1] Implement GET /api/categories route in `src/app/api/categories/route.ts`
- [X] T015 [US1] Create tech card component (이름, 설명, 카테고리, 소개 날짜, 출처 영상 링크) in `src/components/tech-card.tsx`
- [X] T016 [US1] Create category filter component in `src/components/category-filter.tsx`
- [X] T017 [US1] Create search bar component with text search in `src/components/search-bar.tsx`
- [X] T018 [US1] Create tech list component combining cards with filtering/search state in `src/components/tech-list.tsx`
- [X] T019 [US1] Implement main page with tech list, category filter, and search bar in `src/app/page.tsx`

**Checkpoint**: 메인 페이지에서 기술 목록 조회, 카테고리 필터링, 텍스트 검색이 동작해야 함

---

## Phase 4: User Story 4 - 기술 목록 관리 (Priority: P4 → 구현 순서 P2)

**Goal**: 관리자가 기술 항목을 수동으로 추가, 수정, 삭제할 수 있다. US2(자동 추출) 전에 수동 입력이 필요하므로 구현 순서를 앞당김

**Independent Test**: 관리 화면에서 새 기술 항목을 추가하고, 수정/삭제한 뒤 메인 목록에 반영되는지 확인

### Implementation for User Story 4

- [X] T020 [P] [US4] Implement POST /api/admin/auth route (비밀번호 검증) in `src/app/api/admin/auth/route.ts`
- [X] T021 [P] [US4] Implement POST /api/admin/tech-items route (수동 추가) in `src/app/api/admin/tech-items/route.ts`
- [X] T022 [P] [US4] Implement PUT and DELETE /api/admin/tech-items/[id] routes (수정/삭제) in `src/app/api/admin/tech-items/[id]/route.ts`
- [X] T023 [P] [US4] Implement POST /api/admin/categories route (카테고리 추가) in `src/app/api/admin/categories/route.ts`
- [X] T024 [US4] Create admin login page in `src/app/admin/page.tsx`
- [X] T025 [US4] Create tech item form component (추가/수정 겸용) in `src/components/admin/tech-form.tsx`
- [X] T026 [US4] Create admin dashboard page with tech item CRUD in `src/app/admin/dashboard/page.tsx`

**Checkpoint**: 관리자 로그인 후 기술 항목 CRUD가 동작하고 메인 페이지에 반영되어야 함

---

## Phase 5: User Story 2 - 자막 기반 기술 자동 추출 (Priority: P2)

**Goal**: 관리자가 YouTube 영상 URL을 입력하면 자막 추출 + LLM 분석으로 AI 기술 목록이 자동 생성된다 (단건 + 일괄)

**Independent Test**: AI 뉴스 영상 URL 하나를 입력하고, 자막 추출 및 LLM 분석을 거쳐 기술 목록이 자동 생성되는지 확인

### Implementation for User Story 2

- [X] T027 [P] [US2] Implement YouTube transcript extraction module in `src/lib/transcript.ts` (youtube-transcript 패키지 활용). 자막이 없는 영상에 대해 명확한 오류 메시지 반환 MUST (FR-011)
- [X] T028 [P] [US2] Implement LLM analyzer interface and Claude implementation in `src/lib/analyzer.ts` (이름, 설명, 카테고리 자동 추출)
- [X] T029 [US2] Implement POST /api/admin/extract route (자막 추출 + LLM 분석, 단건/일괄 지원) in `src/app/api/admin/extract/route.ts`. 일괄 분석 시 일부 영상 실패 시 건너뛰고 나머지 계속 처리, 실패 건 별도 표시 (Edge Case)
- [X] T030 [US2] Implement GET /api/admin/extract/[jobId] route (추출 작업 상태 조회) in `src/app/api/admin/extract/[jobId]/route.ts`
- [X] T031 [US2] Implement POST /api/admin/extract/[jobId]/confirm route (검토 후 확정) in `src/app/api/admin/extract/[jobId]/confirm/route.ts`
- [X] T032 [US2] Create URL input form component (단건 + 여러 URL 일괄 입력) in `src/components/admin/extract-form.tsx`
- [X] T033 [US2] Create extraction results review/confirm component in `src/components/admin/extract-results.tsx`
- [X] T034 [US2] Create extraction page combining form and results in `src/app/admin/extract/page.tsx`

**Checkpoint**: YouTube URL 입력 → 자막 추출 → LLM 분석 → 결과 검토/수정 → 확정 플로우가 동작해야 함

---

## Phase 6: User Story 3 - 실습 상태 추적 (Priority: P3)

**Goal**: 사용자가 각 기술 항목에 실습 상태(미시작/진행중/완료)와 메모를 기록하고, 실습 상태별 필터링이 가능하다 (브라우저 localStorage)

**Independent Test**: 기술 항목의 실습 상태를 "진행중"으로 변경하고 메모 작성 후, 페이지 새로고침하여 유지되는지 확인

### Implementation for User Story 3

- [X] T035 [P] [US3] Create localStorage utility for practice data (get/set/delete) in `src/lib/local-storage.ts`
- [X] T036 [US3] Create practice tracker component (상태 변경 드롭다운 + 메모 입력) in `src/components/practice-tracker.tsx`
- [X] T037 [US3] Integrate practice tracker into tech card component in `src/components/tech-card.tsx`
- [X] T038 [US3] Add practice status filter to search bar / filter area in `src/components/search-bar.tsx`
- [X] T039 [US3] Update tech list component to support practice status filtering in `src/components/tech-list.tsx`

**Checkpoint**: 실습 상태 변경/메모 저장이 localStorage에 유지되고, 실습 상태별 필터링이 동작해야 함

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 반응형 디자인, 에러 처리, 성능 최적화 등 전체 품질 향상

- [X] T040 [P] Implement responsive design (모바일 대응) across all pages and components
- [X] T041 [P] Add loading states and skeleton UI for tech list in `src/components/tech-list.tsx`
- [X] T042 [P] Add error states and user-friendly error messages for all API calls
- [X] T043 Add localStorage data loss warning notice in `src/components/practice-tracker.tsx`
- [X] T044 Performance optimization: debounce search input, optimize API queries
- [ ] T045 Run quickstart.md validation (full flow test from setup to deployment) *(requires Turso credentials and deployment)*

---

## Phase 8: 채널 자동 파이프라인 + 이중 카테고리 뷰 + 배포 + 자동화

**Purpose**: 조코딩 채널 자동 수집, 영상별 그룹 뷰, Vercel Cron 자동화, 배포

- [X] T046 [US5] Update channel-scraper.ts: add publishedAt parsing to ChannelVideo interface
- [X] T047 [US5] Update sync/route.ts: save publishedAt from scraper data
- [X] T048 [US5] Add groupBy=video support to GET /api/tech-items in `src/app/api/tech-items/route.ts`
- [X] T049 [US1] Create video-group-section.tsx component in `src/components/video-group-section.tsx`
- [X] T050 [US1] Update tech-list.tsx: default to grouped view with VideoGroupSection rendering
- [X] T051 [US5] Create Vercel Cron endpoint in `src/app/api/cron/sync-analyze/route.ts`
- [X] T052 [US5] Create vercel.json with weekly cron schedule
- [ ] T053 Git commit all changes and push to 001-ai-tech-tracker branch
- [X] T054 Update speckit docs (spec.md, plan.md, data-model.md, api.md, tasks.md)
- [ ] T055 Run `npm run build` to verify all changes compile successfully

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2)
- **US4 (Phase 4)**: Depends on Foundational (Phase 2). Moved before US2 because manual input is needed before auto-extraction can be useful
- **US2 (Phase 5)**: Depends on Foundational (Phase 2) + US4 (admin auth/dashboard reuse)
- **US3 (Phase 6)**: Depends on US1 (tech card component exists for integration)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories
- **US4 (P4→구현P2)**: Can start after Foundational - Provides admin auth used by US2
- **US2 (P2)**: Can start after Foundational - Reuses admin auth (T020) and dashboard from US4
- **US3 (P3)**: Can start after US1 - Integrates into tech-card.tsx from US1

### Within Each User Story

- API routes before frontend components
- Shared components before page-level composition
- Core implementation before integration

### Parallel Opportunities

**Phase 2 (Foundational)**:

- T008 (drizzle config) and T009 (seed script) can run in parallel after T006-T007
- T011 (admin-auth) and T012 (layout) can run in parallel after T010

**Phase 3 (US1)**:

- T013 (GET tech-items) and T014 (GET categories) can run in parallel
- T015-T017 (card, filter, search) can run in parallel after API routes

**Phase 4 (US4)**:

- T020-T023 (all admin API routes) can run in parallel

**Phase 5 (US2)**:

- T027 (transcript) and T028 (analyzer) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch API routes in parallel:
Task: "Implement GET /api/tech-items in src/app/api/tech-items/route.ts"
Task: "Implement GET /api/categories in src/app/api/categories/route.ts"

# Then launch UI components in parallel:
Task: "Create tech card component in src/components/tech-card.tsx"
Task: "Create category filter component in src/components/category-filter.tsx"
Task: "Create search bar component in src/components/search-bar.tsx"
```

## Parallel Example: User Story 4

```bash
# Launch all admin API routes in parallel:
Task: "Implement POST /api/admin/auth in src/app/api/admin/auth/route.ts"
Task: "Implement POST /api/admin/tech-items in src/app/api/admin/tech-items/route.ts"
Task: "Implement PUT/DELETE /api/admin/tech-items/[id] in src/app/api/admin/tech-items/[id]/route.ts"
Task: "Implement POST /api/admin/categories in src/app/api/admin/categories/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 4: User Story 4 (관리자 CRUD - 데이터 입력 수단)
4. Complete Phase 3: User Story 1 (기술 목록 조회)
5. **STOP and VALIDATE**: 관리자가 수동 입력한 기술을 메인 페이지에서 조회 가능한지 확인
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US4 (관리자 CRUD) → 수동 데이터 입력 가능 → Deploy
3. Add US1 (목록 조회) → 사용자 조회 가능 → Deploy (MVP!)
4. Add US2 (자동 추출) → 자막 분석 자동화 → Deploy
5. Add US3 (실습 추적) → 사용자 실습 관리 → Deploy
6. Polish → 반응형/에러처리/성능 → Final Deploy

### Single Developer Strategy (권장)

1. Phase 1 → Phase 2 → Phase 4 → Phase 3 순차 실행 (MVP)
2. Phase 5 → Phase 6 순차 실행 (추가 기능)
3. Phase 7 최종 마무리

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US4를 US2보다 먼저 구현: 자동 추출 전 수동 입력이 필요하고, admin auth를 US2에서 재사용
- 실습 상태(US3)는 서버 DB 없이 localStorage만 사용하므로 가장 독립적
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
