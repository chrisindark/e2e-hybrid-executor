# Hybrid Test Execution Web

Next.js dashboard for the hybrid test execution application. It connects to
the NestJS API to capture test intent, display saved tests, start Playwright
runs, show deterministic and agentic trace events, and review promotion
candidates.

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer when installing from the web app directory
- The API running locally or at a reachable URL

## Quick start

From the web app directory (`apps/web`):

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Open `http://localhost:3000`. The API defaults to
`http://localhost:3001`; change `NEXT_PUBLIC_API_URL` in `.env.local` when the
API is hosted elsewhere.

## Commands

| Command          | Purpose                              |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the Next.js development server |
| `pnpm run build` | Build the production application     |
| `pnpm run start` | Start the production application     |

## Workflow

1. Enter a target URL and plain-English test intent.
2. Generate and save the structured test through the API.
3. Select a saved test and optionally force drift at a step before running it.
4. Inspect the execution trace and review any generated promotion candidate.
5. Approve or reject the proposed recovered step.
