# AI Tech Tracker

유튜브 영상에서 AI 기술 정보를 추출하고 트래킹하는 Next.js 앱

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript 5.x
- **DB**: Turso (libSQL) + Drizzle ORM
- **AI**: Anthropic Claude API
- **스타일링**: Tailwind CSS 4
- **기타**: youtube-transcript (자막 추출)

## 사전 준비

- Node.js 20+
- [Turso](https://turso.tech/) 계정 및 데이터베이스
- [Anthropic API Key](https://console.anthropic.com/)
- Docker Desktop (Docker 개발 환경 사용 시)
- Claude Max 구독 (Claude Code 사용 시)

## 개발 환경 (Docker + Claude Code)

이 프로젝트는 Docker 컨테이너 안에서 Claude Code를 `--dangerously-skip-permissions` 모드로 실행하여 자율 개발하는 방식을 사용합니다.

### 왜 Docker인가?

`--dangerously-skip-permissions`는 모든 도구를 승인 없이 실행하므로, Docker 컨테이너(격리된 일회용 환경)에서 실행하여 호스트 시스템을 보호합니다.

### 최초 설정

```bash
# 1. 프로젝트 폴더로 이동
cd D:/Coding/jocodinglabs

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 등 입력

# 3. Docker 이미지 빌드 (최초 1회)
docker compose -f docker-compose.claude.yml build
```

### Docker 컨테이너 진입 → Claude Code 실행

```bash
# 컨테이너 시작 + bash 진입 (--service-ports: localhost:3000 포트 매핑)
docker compose -f docker-compose.claude.yml run --service-ports claude bash

# 컨테이너 안에서:
claude login                          # 최초 1회 로그인
claude --dangerously-skip-permissions  # Claude Code 자율 모드 실행
```

### 컨테이너 재접속

```bash
# 실행 중인 컨테이너 확인
docker ps

# 실행 중이면 → exec로 접속
docker exec -it <컨테이너ID> bash

# 중지 상태면 → 먼저 시작 후 접속
docker start <컨테이너ID>
docker exec -it <컨테이너ID> bash
```

### 새 컨테이너로 시작

```bash
# 종료 시 자동 삭제 (일회성)
docker compose -f docker-compose.claude.yml run --service-ports --rm claude bash

# 종료 후에도 보존 (재접속 가능)
docker compose -f docker-compose.claude.yml run --service-ports claude bash
```

### Docker 트러블슈팅

```bash
# npm install 권한 에러 (EACCES) → 다른 Windows 터미널에서 실행
docker exec -u root <컨테이너ID> chown -R claude:claude /workspace/node_modules

# Claude Code 버전 업데이트
docker compose -f docker-compose.claude.yml build --no-cache

# 볼륨 초기화 (권한 문제 근본 해결)
docker compose -f docker-compose.claude.yml down
docker volume rm jocodinglabs_claude_modules
docker compose -f docker-compose.claude.yml build
docker compose -f docker-compose.claude.yml run claude bash

# git push → 호스트(Windows) 터미널에서 실행 권장
```

> Docker Desktop 설정에서 리소스 조정: Settings → Resources → CPUs 4+, Memory 8GB+

## 로컬 실행 방법 (Docker 없이)

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 `.env`로 복사 후 값 입력:

```bash
cp .env.example .env
```

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
TURSO_DATABASE_URL=libsql://your-db-turso.io
TURSO_AUTH_TOKEN=your-turso-token
ADMIN_PASSWORD=your-admin-password
```

### 3. DB 스키마 적용

```bash
npm run db:push
```

### 4. (선택) 시드 데이터 삽입

```bash
npm run db:seed
```

### 5. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

## 주요 페이지

| 경로 | 설명 |
|---|---|
| `/` | 기술 목록 (검색, 카테고리 필터) |
| `/admin` | 관리자 로그인 |
| `/admin/dashboard` | 기술 항목 관리 (CRUD) |
| `/admin/extract` | 유튜브 영상에서 AI 기술 추출 |

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/tech-items` | 기술 목록 조회 |
| GET | `/api/categories` | 카테고리 목록 조회 |
| POST | `/api/admin/auth` | 관리자 인증 |
| GET/POST | `/api/admin/tech-items` | 기술 항목 CRUD |
| DELETE/PATCH | `/api/admin/tech-items/[id]` | 개별 항목 수정/삭제 |
| POST | `/api/admin/categories` | 카테고리 추가 |
| POST | `/api/admin/extract` | 유튜브 추출 시작 |
| GET | `/api/admin/extract/[jobId]` | 추출 상태 확인 |
| POST | `/api/admin/extract/[jobId]/confirm` | 추출 결과 확인 |

## 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 |
| `npm run lint` | ESLint 검사 |
| `npm run db:push` | DB 스키마 적용 |
| `npm run db:seed` | 시드 데이터 삽입 |

## 프로덕션 빌드

```bash
npm run build
npm start
```
