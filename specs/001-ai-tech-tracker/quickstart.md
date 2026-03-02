# Quickstart: AI Tech Tracker

## Prerequisites

- Node.js 20+
- npm 또는 pnpm
- Turso 계정 (무료): https://turso.tech
- Anthropic API 키: https://console.anthropic.com
- Vercel 계정 (배포용, 무료)

## 1. 프로젝트 설정

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit
npm install @anthropic-ai/sdk youtube-transcript
```

## 2. 환경변수 설정

`.env.local` 파일 생성:

```env
TURSO_DATABASE_URL=libsql://your-db-name-your-org.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
ANTHROPIC_API_KEY=sk-ant-your-api-key
ADMIN_PASSWORD=your-admin-password
```

## 3. 데이터베이스 마이그레이션

```bash
npx drizzle-kit push
```

## 4. 로컬 실행

```bash
npm run dev
```

- 메인 페이지: http://localhost:3000
- 관리자 페이지: http://localhost:3000/admin

## 5. Vercel 배포

```bash
vercel
```

Vercel 대시보드에서 환경변수 4개 설정 후 재배포.

## 핵심 사용 흐름

1. `/admin`에서 비밀번호로 로그인
2. YouTube 영상 URL 입력 → 자막 추출 → LLM 분석 → 기술 목록 자동 생성
3. 추출 결과 검토/수정 후 확정
4. 메인 페이지에서 기술 목록 조회, 필터링, 검색
5. 각 기술 항목에서 실습 상태 변경 및 메모 작성 (브라우저 로컬 저장)
