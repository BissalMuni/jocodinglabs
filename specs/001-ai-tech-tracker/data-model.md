# Data Model: AI Tech Tracker

**Date**: 2026-02-28
**Feature**: 001-ai-tech-tracker
**Storage**: Turso (SQLite) via Drizzle ORM

## Entities

### tech_items

| Field          | Type      | Constraints                    | Description            |
|----------------|-----------|--------------------------------|------------------------|
| id             | INTEGER   | PRIMARY KEY, AUTOINCREMENT     | 고유 식별자            |
| name           | TEXT      | NOT NULL                       | 기술 이름              |
| description    | TEXT      | NOT NULL                       | 기술 설명              |
| url            | TEXT      |                                | 기술 공식 홈페이지 URL (nullable) |
| category_id    | INTEGER   | FOREIGN KEY → categories.id    | 카테고리 참조          |
| introduced_at  | TEXT      | NOT NULL (ISO 8601 date)       | 영상에서 소개된 날짜   |
| created_at     | TEXT      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 등록 일시        |
| updated_at     | TEXT      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정 일시        |

### source_videos

| Field          | Type      | Constraints                    | Description            |
|----------------|-----------|--------------------------------|------------------------|
| id             | INTEGER   | PRIMARY KEY, AUTOINCREMENT     | 고유 식별자            |
| url            | TEXT      | NOT NULL, UNIQUE               | YouTube 영상 URL       |
| title          | TEXT      | NOT NULL                       | 영상 제목              |
| published_at   | TEXT      | NOT NULL (ISO 8601 date)       | 영상 게시 날짜         |
| analyzed       | INTEGER   | NOT NULL, DEFAULT 0            | 분석 완료 여부 (0/1)   |
| created_at     | TEXT      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 등록 일시        |

### tech_item_videos (다대다 관계)

| Field          | Type      | Constraints                           | Description         |
|----------------|-----------|---------------------------------------|---------------------|
| tech_item_id   | INTEGER   | FOREIGN KEY → tech_items.id, NOT NULL | 기술 항목 참조      |
| source_video_id| INTEGER   | FOREIGN KEY → source_videos.id, NOT NULL | 출처 영상 참조   |
| PRIMARY KEY    |           | (tech_item_id, source_video_id)       | 복합 기본키         |

### categories

| Field          | Type      | Constraints                    | Description            |
|----------------|-----------|--------------------------------|------------------------|
| id             | INTEGER   | PRIMARY KEY, AUTOINCREMENT     | 고유 식별자            |
| name           | TEXT      | NOT NULL, UNIQUE               | 카테고리 이름          |
| sort_order     | INTEGER   | NOT NULL, DEFAULT 0            | 표시 순서              |

**초기 데이터**: AI 분석 시 동적 생성 (고정 seed 없음). 기존 카테고리와 매칭하고, 없으면 신규 생성.

### extraction_jobs

| Field          | Type      | Constraints                    | Description            |
|----------------|-----------|--------------------------------|------------------------|
| id             | INTEGER   | PRIMARY KEY, AUTOINCREMENT     | 고유 식별자            |
| status         | TEXT      | NOT NULL, DEFAULT 'pending'    | pending/running/completed/failed |
| video_urls     | TEXT      | NOT NULL                       | JSON 배열 (입력 URL 목록) |
| result         | TEXT      |                                | JSON (추출된 기술 목록)  |
| error_message  | TEXT      |                                | 실패 시 오류 메시지     |
| created_at     | TEXT      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성 일시        |
| completed_at   | TEXT      |                                | 완료 일시              |

## Relationships

```text
categories 1──N tech_items
tech_items N──M source_videos (via tech_item_videos)
extraction_jobs → (produces) → tech_items + source_videos
```

## State Transitions

### extraction_jobs.status

```text
pending → running → completed
                  → failed
```

### Practice Status (브라우저 localStorage)

```text
not_started → in_progress → completed
            ← in_progress ←
```

실습 상태/메모는 서버 DB에 저장하지 않음.
브라우저 localStorage에 `{ [tech_item_id]: { status, memo } }` 형태로 저장.

## Validation Rules

- tech_items.name: 1~200자
- tech_items.description: 1~2000자
- source_videos.url: 유효한 YouTube URL 형식 (youtube.com 또는 youtu.be)
- categories.name: 1~50자, 중복 불가
- extraction_jobs.video_urls: 최소 1개 URL 포함
