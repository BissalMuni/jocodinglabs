# API Contracts: AI Tech Tracker

**Date**: 2026-02-28
**Type**: Next.js API Routes (REST)
**Base Path**: `/api`

## Public Endpoints (인증 불필요)

### GET /api/tech-items

기술 목록 조회 (필터링/검색 지원)

**Query Parameters**:
- `category` (optional): 카테고리 ID로 필터링
- `search` (optional): 기술명/설명 텍스트 검색
- `sort` (optional): `newest` (default) | `oldest`
- `groupBy` (optional): `video` — 출처 영상별로 그룹핑하여 반환

**Response 200**:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Sora",
      "description": "OpenAI의 텍스트-영상 생성 모델",
      "category": { "id": 2, "name": "영상 생성" },
      "introducedAt": "2026-02-15",
      "sourceVideos": [
        { "id": 1, "url": "https://youtube.com/watch?v=xxx", "title": "AI 뉴스 #50" }
      ],
      "url": "https://openai.com/sora",
      "createdAt": "2026-02-20T09:00:00Z"
    }
  ],
  "total": 42
}
```

**Response 200 (groupBy=video)**:
```json
{
  "groups": [
    {
      "video": { "id": 1, "title": "AI뉴스 #50", "url": "https://youtube.com/watch?v=xxx", "publishedAt": "2026-02-15" },
      "items": [ { "id": 1, "name": "Sora", "description": "...", "url": "https://openai.com/sora", "category": { "id": 2, "name": "영상 생성" }, "introducedAt": "2026-02-15", "sourceVideos": [...], "createdAt": "..." } ]
    }
  ]
}
```

### GET /api/categories

카테고리 목록 조회

**Response 200**:
```json
{
  "categories": [
    { "id": 1, "name": "이미지 생성", "sortOrder": 1 },
    { "id": 7, "name": "기타", "sortOrder": 7 }
  ]
}
```

## Admin Endpoints (비밀번호 인증 필요)

모든 Admin 요청은 `Authorization: Bearer <ADMIN_PASSWORD>` 헤더 포함.

### POST /api/admin/auth

관리자 로그인 (비밀번호 검증)

**Request Body**:
```json
{ "password": "admin-password-here" }
```

**Response 200**: `{ "token": "admin-password-here", "success": true }`
**Response 401**: `{ "error": "Invalid password" }`

### POST /api/admin/tech-items

기술 항목 수동 추가

**Request Body**:
```json
{
  "name": "기술 이름",
  "description": "기술 설명",
  "categoryId": 1,
  "introducedAt": "2026-02-28",
  "sourceVideoUrls": ["https://youtube.com/watch?v=xxx"]
}
```

**Response 201**: 생성된 tech item 객체
**Response 400**: 유효성 검증 실패

### PUT /api/admin/tech-items/[id]

기술 항목 수정

**Request Body**: POST와 동일 (부분 업데이트 허용)
**Response 200**: 수정된 tech item 객체
**Response 404**: 항목 없음

### DELETE /api/admin/tech-items/[id]

기술 항목 삭제

**Response 204**: 삭제 성공
**Response 404**: 항목 없음

### POST /api/admin/extract

영상 자막 추출 및 LLM 분석 요청

**Request Body**:
```json
{
  "videoUrls": [
    "https://youtube.com/watch?v=abc",
    "https://youtube.com/watch?v=def"
  ]
}
```

**Response 202**: 추출 작업 시작
```json
{
  "jobId": 5,
  "status": "pending",
  "videoCount": 2
}
```

### GET /api/admin/extract/[jobId]

추출 작업 상태 조회

**Response 200**:
```json
{
  "id": 5,
  "status": "completed",
  "results": [
    {
      "videoUrl": "https://youtube.com/watch?v=abc",
      "videoTitle": "AI 뉴스 #50",
      "extractedItems": [
        {
          "name": "Sora",
          "description": "OpenAI의 텍스트-영상 생성 모델",
          "suggestedCategory": "영상 생성"
        }
      ]
    }
  ]
}
```

### POST /api/admin/extract/[jobId]/confirm

추출 결과 확정 (검토/수정 후 메인 목록에 추가)

**Request Body**:
```json
{
  "items": [
    {
      "name": "Sora",
      "description": "수정된 설명",
      "categoryId": 2,
      "introducedAt": "2026-02-15",
      "sourceVideoUrl": "https://youtube.com/watch?v=abc"
    }
  ]
}
```

**Response 201**: 추가된 항목 목록

### POST /api/admin/categories

카테고리 추가

**Request Body**:
```json
{ "name": "새 카테고리", "sortOrder": 8 }
```

**Response 201**: 생성된 카테고리 객체

### POST /api/admin/channel/sync

조코딩 채널에서 AI뉴스 영상 자동 수집

**Response 200**:
```json
{
  "newVideos": [{ "title": "AI뉴스 #51", "url": "https://youtube.com/watch?v=xxx" }],
  "newCount": 5,
  "existingCount": 17,
  "totalFound": 22,
  "message": "5개의 새로운 AI뉴스 영상을 추가했습니다"
}
```

### POST /api/admin/channel/analyze

미분석 영상 일괄 분석

**Response 200**:
```json
{
  "results": [
    { "videoUrl": "https://youtube.com/watch?v=xxx", "videoTitle": "AI뉴스 #51", "techCount": 10 }
  ],
  "summary": { "totalVideos": 5, "successCount": 4, "failCount": 1, "totalTechItems": 45 },
  "message": "4/5개 영상 분석 완료, 45개 기술 항목 추출"
}
```

### GET /api/cron/sync-analyze

Vercel Cron 엔드포인트 (매주 월요일 자동 실행)

**인증**: `Authorization: Bearer <CRON_SECRET>`

**Response 200**:
```json
{
  "syncResult": { "newCount": 2, "existingCount": 20, "totalFound": 22 },
  "analyzeResult": { "totalVideos": 2, "successCount": 2, "failCount": 0, "totalTechItems": 20 },
  "message": "Sync: 2 new videos. Analyze: 2/2 videos, 20 tech items."
}
```

## Error Format

모든 에러 응답은 동일한 형식:

```json
{
  "error": "에러 메시지",
  "code": "ERROR_CODE"
}
```

| Code                  | HTTP Status | Description           |
|-----------------------|-------------|-----------------------|
| UNAUTHORIZED          | 401         | 관리자 인증 실패      |
| NOT_FOUND             | 404         | 리소스 없음           |
| VALIDATION_ERROR      | 400         | 입력값 유효성 실패    |
| TRANSCRIPT_NOT_FOUND  | 422         | 자막 추출 실패        |
| LLM_ERROR             | 502         | LLM API 호출 실패     |
| INTERNAL_ERROR        | 500         | 서버 내부 오류        |
