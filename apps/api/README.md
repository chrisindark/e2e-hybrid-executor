# Hybrid Test Execution API

NestJS backend for the hybrid test execution prototype. It converts test intent
into structured steps, runs deterministic Playwright actions, falls back to an
agentic executor when a step fails, records trace events, and supports review
and promotion of recovered selectors.

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- An OpenAI API key
- Chromium, installed through Playwright

## Quick start

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env
pnpm run start:dev
```

The API listens on `http://localhost:3001` by default. Set `OPENAI_API_KEY` in
`.env` before using intent generation or agentic recovery.

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

## Security

Do not commit environment files or credentials. The `.env.example` file is the
only environment file intended for version control. Rotate any key that has
previously appeared in a local file before publishing this repository.
