# Hybrid Test Execution — Prototype

A working demo of capture → deterministic run → forced UI-drift fallback →
agentic recovery → human-reviewed promotion, built for testing purposes.

## Architecture

See `docs/architecture.png` (or the description below). Backend is NestJS,
one module per layer of the assignment:

- `intent/` — natural-language intent → structured `TestDefinition` (OpenAI)
- `execution/` — Playwright deterministic runner; detects step failure and
  hands off to the agentic executor **on the same page/browser session**
- `agentic-executor/` — reads live DOM state, asks OpenAI to recover the
  step's intent, executes the recovery on that same page
- `trace/` — every step/decision logged as a `TraceEvent` tagged to a step
  UUID; powers the run report
- `promotion/` — agentic recoveries become `PromotionCandidate`s; human
  approves/rejects; approval rewrites the deterministic script

Frontend is Next.js, three panels: intent capture, run + decision trace,
promotion review.

**Known simplification:** trace events, tests, and promotion candidates are
stored in-memory (not a database). This was a deliberate choice to keep
clone-to-demo under 15 minutes — noted here rather than hidden.

## Prerequisites

- Node.js 18+
- An OpenAI API key
- Network access (for `npm install` and Playwright's browser download)

## Setup

```bash
# from repo root
npm install

# Playwright needs its browser binary
npx playwright install chromium --with-deps

# configure the API
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env and set OPENAI_API_KEY

# configure the web app (defaults are fine for local dev)
cp apps/web/.env.local.example apps/web/.env.local
```

## Run

Two terminals:

```bash
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:3000
```

Open http://localhost:3000.

## Demo flow

1. Type a test intent (a default is pre-filled) and generate the structured
   test.
2. Review the generated steps.
3. Pick a step to force UI drift on, and run the test.
4. Watch the decision trace: deterministic steps pass, the forced step
   fails, the agentic executor recovers it on the same browser session,
   and its reasoning is shown.
5. Scroll to the promotion panel, review the proposed selector diff, and
   approve or reject it. On approval, the test's stored script is updated
   — the next run of that step will be deterministic again.

## What's stubbed vs. real

- **Real:** LLM-driven intent parsing, actual Playwright execution against
  saucedemo.com, actual DOM-read + LLM-driven agentic recovery on the same
  page, actual promotion diff/approve/reject with script rewrite.
- **Simplified for prototype scope:** in-memory storage (no DB), single
  target app, single forced-failure mechanism (selector corruption to
  simulate drift, rather than a live UI change), no auth.
