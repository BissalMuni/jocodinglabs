<!--
  Sync Impact Report
  ==================
  Version change: 1.1.0 → 1.2.0 (MINOR - principle clarifications from /speckit.analyze)
  Modified principles:
    - I. Content-Driven: YouTube Data API v3 changed from stated approach to future enhancement
    - II. Hands-On First: difficulty/tools marked as MVP-deferred
    - VI. Transcript-First Analysis: terminology updated youtube-transcript-api → youtube-transcript(npm)
  Added sections: N/A
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed
    - .specify/templates/spec-template.md ✅ no changes needed
    - .specify/templates/tasks-template.md ✅ no changes needed
  Follow-up TODOs: None
-->

# JoCoding Labs Constitution

## Core Principles

### I. Content-Driven

프로젝트의 핵심은 조코딩 유튜브 채널의 AI 뉴스 영상에서
소개되는 새로운 AI 기술 목록을 수집하고 관리하는 것이다.
모든 기능은 이 콘텐츠 큐레이션을 지원하는 방향으로 구현해야 한다.

- 각 항목은 반드시 출처 영상 링크를 포함해야 한다
- 기술 이름, 설명, 카테고리, 영상 날짜 등 핵심 메타데이터를 MUST 포함
- 수동 입력과 향후 자동화 모두 고려한 데이터 구조 설계
- 대상 영상은 관리자가 URL을 직접 입력하여 선택한다.
  향후 YouTube Data API v3를 통한 자동 영상 목록 조회 및 필터링을 추가할 수 있다

### II. Hands-On First

목록에 등재된 기술은 단순 소개가 아닌 실제로 따라해볼 수 있는
실습 가이드를 제공하는 것이 목적이다.

- 각 기술 항목은 실습 상태(미시작/진행중/완료)를 추적 MUST
- 실습 결과나 메모를 기록할 수 있어야 한다
- 따라하기 난이도, 필요 도구 등 실습 관련 정보 포함 SHOULD (MVP 이후 추가 예정)

### III. Web Deploy & Manage

모든 콘텐츠는 웹 사이트로 배포되어 관리된다.
정적 사이트 또는 경량 웹앱으로 구현하며 복잡한 인프라를 피한다.

- 무료 호스팅(Vercel, Netlify 등)으로 배포 가능해야 한다
- 관리 인터페이스를 통해 목록을 추가/수정/삭제 MUST
- 반응형 디자인으로 모바일에서도 사용 가능 SHOULD

### IV. Simplicity

최소한의 복잡도로 최대 가치를 전달한다.
불필요한 추상화, 과도한 의존성, 사전 최적화를 피한다.

- 외부 의존성은 필요한 최소한으로 유지 MUST
- 단일 저장소에서 프론트엔드와 백엔드(필요시) 관리
- 설정보다 관례(convention over configuration) 우선

### V. Incremental Growth

작은 MVP에서 시작하여 점진적으로 기능을 확장한다.
초기에는 수동 입력으로 시작하고, 이후 자동화를 추가할 수 있다.

- 첫 배포는 기본 목록 표시와 관리 기능만으로 충분
- 자동 스크래핑, AI 요약 등은 후속 기능으로 추가
- 각 기능 추가는 기존 기능을 깨뜨리지 않아야 한다 MUST

### VI. Transcript-First Analysis

영상 콘텐츠 분석의 1차 수단은 youtube-transcript(npm)를 통한
자막 추출 + LLM 분석이다. 이 방식을 주력(primary)으로 개발한다.

- **주력**: youtube-transcript(npm)로 자막 추출 후
  LLM(Claude 등)에게 전달하여 AI 기술 목록을 자동 추출 MUST
- **서브(추후 추가)**: NotebookLM Enterprise API를 활용한
  영상 분석 파이프라인을 별도 모듈로 개발 가능
- 주력과 서브는 동일한 출력 형식(기술 목록 스키마)을 공유 MUST
- 분석 모듈은 교체 가능하도록 인터페이스를 분리 SHOULD

## Technology Stack

- **프론트엔드**: 경량 프레임워크 (Next.js, Astro 등) 선호
- **데이터 저장**: 초기에는 JSON/Markdown 파일 또는 경량 DB (SQLite, Supabase 등)
- **영상 분석 (주력)**: youtube-transcript(npm) + LLM (Claude API)
- **영상 분석 (서브/추후)**: NotebookLM Enterprise API
- **배포**: Vercel 또는 Netlify (무료 티어)
- **언어**: TypeScript 우선 (분석 스크립트는 Python 허용)
- 스택 선택은 `/speckit.plan` 단계에서 확정

## Development Workflow

- 기능 단위로 브랜치를 생성하고 PR을 통해 병합
- 각 기능은 독립적으로 테스트 가능해야 한다
- 배포 전 로컬에서 빌드 검증 MUST
- 커밋 메시지는 conventional commits 형식을 따른다

## Governance

이 Constitution은 프로젝트의 모든 설계 및 구현 결정의 기준이 된다.
변경 시 버전을 갱신하고 영향받는 문서를 함께 수정해야 한다.

- Constitution 변경은 MAJOR(원칙 삭제/재정의), MINOR(원칙 추가/확장),
  PATCH(문구 수정) 버전으로 관리
- 모든 PR은 Constitution 원칙 준수 여부를 확인해야 한다
- 런타임 개발 가이드는 CLAUDE.md 또는 별도 가이드 파일 참조

**Version**: 1.2.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-03-01
