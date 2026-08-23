# Hybrid Test Execution API

NestJS backend for the hybrid test execution application. It converts test
intent into structured steps with a Groq OpenAI-compatible endpoint, runs
deterministic Playwright actions, falls back to Gemini when a step fails,
persists tests and runs in SQLite, and supports review and promotion of
recovered steps.

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- A Groq API key and OpenAI-compatible API URL
- A Gemini API key
- Chromium, installed through Playwright

## Quick start

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env
pnpm run start:dev
```

Set `APP_PORT=3001` and `APP_ADDRESS=0.0.0.0` for the documented local URL,
then set the provider keys and URLs described in [setup.md](setup.md) before
using intent generation or agentic recovery.

See [setup.md](setup.md) for configuration and verification details.

## Commands

| Command                 | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `pnpm run start:dev`    | Start the API with file watching            |
| `pnpm run build`        | Compile the application                     |
| `pnpm run lint`         | Run ESLint                                  |
| `pnpm run format:check` | Check Prettier formatting                   |
| `pnpm run test`         | Run unit tests                              |
| `pnpm run test:e2e`     | Run end-to-end tests                        |
| `pnpm run check`        | Run formatting, lint, build, and unit tests |

## Project structure

- `src/apps/mainApp/modules/intent` parses natural-language test intent.
- `src/apps/mainApp/modules/execution` runs deterministic Playwright steps.
- `src/apps/mainApp/modules/agentic-execution` handles recovery after drift.
- `src/apps/mainApp/modules/trace-event` records execution decisions.
- `src/apps/mainApp/modules/promotion-candidate` manages human review.
- `database.sqlite` stores TypeORM entities and is created by the API process.

## HTTP API

The API uses URI versioning, so application routes are prefixed with `/v1`.
The web app uses these routes:

- `POST /v1/intent` generates a structured test from `intent` and `targetUrl`.
- `GET|POST|PUT /v1/generation` and `/v1/generation/:testId` manage tests.
- `GET /v1/execution`, `GET /v1/execution/:runId`, and
  `POST /v1/execution/:testId/run` manage execution and traces.
- `GET /v1/runs` and `/v1/runs/:runId` retrieve runs.
- `GET /v1/promotion-candidates` and
  `POST /v1/promotion-candidates/:promotionId/decide` manage promotion review.

## Security

Do not commit environment files or credentials. The `.env.example` file is the
only environment file intended for version control. Rotate any key that has
previously appeared in a local file before publishing this repository.
