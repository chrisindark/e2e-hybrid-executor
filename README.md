# Hybrid Test Execution

A NestJS API and Next.js web dashboard for converting plain-English test intent
into Playwright steps, running those steps, recovering from a forced selector
failure with Gemini, and reviewing the proposed step before promotion.

## Architecture

See [Architecture.md](Architecture.md). The repository is a pnpm workspace with
two applications:

- `apps/api` — NestJS REST API, Playwright execution engine, Gemini recovery,
  TypeORM/SQLite persistence, and promotion workflow.
- `apps/web` — Next.js dashboard for intent capture, saved tests, execution
  traces, and promotion review.

The API uses URI versioning and exposes its application routes under `/v1`.
There is no queue, worker, or SSE stream; the web app polls and fetches run
results over REST.

SQLite data is stored in `apps/api/database.sqlite` when the API is started from
that application directory. TypeORM synchronizes the entities on startup.

### AI Provider Selection
- **Intent Parsing**: Uses Groq (`llama-3.3-70b-versatile` or `llama3-70b-8192`) for fast, near-instantaneous structured extraction of test steps from natural language.
- **Agentic Recovery**: Uses Gemini (`gemini-2.5-flash` or similar) for its strong multi-modal capabilities and deep reasoning context window during complex DOM analysis and self-healing.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A Groq API key and Gemini API key
- Network access for dependency installation, Playwright, and the target site

## Setup

```bash
# from repo root
pnpm install

# Playwright needs its browser binary
npx playwright install chromium --with-deps

# configure the API
cp apps/api/.env.example apps/api/.env
# set APP_PORT=3001, APP_ADDRESS=0.0.0.0, provider keys/URLs, and CORS values

# configure the web app (defaults are fine for local dev)
cp apps/web/.env.local.example apps/web/.env.local
```

## Run

Two terminals:

```bash
pnpm run dev:api   # http://localhost:3001
pnpm run dev:web   # http://localhost:3000
```

Open http://localhost:3000.

## Demo flow

1. Enter an intent and target URL, then generate and save the structured test.
2. Review the saved steps and optionally choose a step for forced UI drift.
3. Run the test and inspect the deterministic and agentic trace events.
4. Review the resulting promotion candidate and approve or reject the proposed
   step. Approval updates the stored step for future runs.

## API routes

- `POST /v1/intent` — generate steps from intent.
- `GET|POST|PUT /v1/generation` and `/v1/generation/:testId` — manage saved
  tests.
- `GET /v1/execution`, `GET /v1/execution/:runId`, and
  `POST /v1/execution/:testId/run` — list, inspect, and start runs.
- `GET /v1/runs` and `/v1/runs/:runId` — inspect persisted runs.
- `GET /v1/promotion-candidates` and
  `POST /v1/promotion-candidates/:promotionId/decide` — review recoveries.
