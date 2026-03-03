# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server (0.0.0.0:3000)
npm run build        # Production build (use to verify changes)
npm run lint         # ESLint
npm run db:push      # Push Drizzle schema to Turso
npm run db:seed      # Seed default categories
```

No test suite is configured. Use `npm run build` as the primary verification step.

## Architecture

This is a **Next.js 16 App Router** application that automatically tracks AI technologies mentioned in 조코딩(JoCoding) YouTube channel's AI뉴스 videos.

### Pipeline (the core system)

```
YouTube channel scrape → transcript extraction → Claude AI analysis → DB → API → frontend
```

1. **`src/lib/channel-scraper.ts`** — Scrapes 조코딩 channel search page for AI뉴스 videos using ytInitialData JSON parsing + InnerTube continuation pagination. Also scrapes individual video pages for upload dates.
2. **`src/lib/transcript.ts`** — Extracts subtitles via `youtube-transcript-plus` library.
3. **`src/lib/analyzer.ts`** — Sends transcript to Claude (claude-sonnet-4-20250514) with a prompt that extracts tech names, Korean descriptions, official URLs, and category suggestions. Categories are dynamic — reuses existing ones or creates new.

### Database (Turso/SQLite + Drizzle ORM)

Schema in `src/db/schema.ts`. Key tables:
- **`source_videos`** — YouTube videos with `analyzed` flag (0/1) to track processing state. URL is unique to prevent duplicates.
- **`tech_items`** — Extracted technologies with name, description, optional URL, category FK, and `introduced_at` date.
- **`tech_item_videos`** — N:M junction linking tech items to source videos.
- **`categories`** — Dynamically created during AI analysis, not pre-seeded.
- **`extraction_jobs`** — Async job tracking for manual extraction flow.

DB client (`src/db/client.ts`) uses a lazy singleton proxy pattern — import `db` directly.

### Route Structure

**Public** (no auth):
- `GET /api/tech-items` — supports `?groupBy=video&category=X&search=Y`
- `GET /api/categories`

**Admin** (`Authorization: Bearer <ADMIN_PASSWORD>`):
- `/api/admin/channel/sync` — scrape new videos
- `/api/admin/channel/analyze` — batch-analyze unanalyzed videos
- `/api/admin/extract` — manual URL extraction with job polling
- `/api/admin/tech-items` — CRUD

**Cron** (`vercel.json` — Mondays 9:00 UTC):
- `GET /api/cron/sync-analyze` — combined sync + analyze, auth via `CRON_SECRET`

### Frontend

- **Home page** (`src/app/page.tsx`) — StatsBar + TechList (video-grouped view)
- **`src/components/tech-list.tsx`** — Main orchestrator: fetches grouped data, manages category/search/practice filters
- **`src/components/video-group-section.tsx`** — Renders one video's tech items in a 2-col grid
- **`src/components/tech-card.tsx`** — Individual card with category-colored border (14 colors mapped in `CATEGORY_COLORS`)
- Practice tracking uses browser `localStorage` only (key: `ai-tech-tracker-practice`)

Admin pages: `/admin` (login), `/admin/dashboard` (CRUD), `/admin/extract` (channel sync + manual extraction)

## Environment Variables

```
TURSO_DATABASE_URL    # libsql://... (required)
TURSO_AUTH_TOKEN      # Turso auth token (required)
ANTHROPIC_API_KEY     # Claude API key (required for analysis)
ADMIN_PASSWORD        # Bearer token for admin endpoints
CRON_SECRET           # Vercel Cron auth header
```

## Key Patterns

- **Path alias**: `@/*` maps to `./src/*`
- **Admin auth**: Simple Bearer token checked via `src/lib/admin-auth.ts` (`verifyAdmin()` returns error response or null)
- **Korean UI**: All user-facing strings are in Korean
- **Tailwind CSS v4**: Uses `@tailwindcss/postcss` plugin, not a tailwind.config file
- **Dynamic categories**: Never hardcoded — created by AI during transcript analysis, matched against existing category names

## Deployment

- **Platform**: Vercel (connected to GitHub `main` branch)
- **Live URL**: https://jocodinglabs.vercel.app/
- **Cron**: Weekly sync+analyze via `vercel.json`
- Git push to `main` triggers auto-deploy

## Specs

Feature specifications live in `specs/001-ai-tech-tracker/` (spec.md, plan.md, data-model.md, api.md, tasks.md) managed by the Speckit workflow.
