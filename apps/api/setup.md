# Local setup

## Prerequisites

- Node.js 20 or newer
- pnpm 10 or newer
- A Groq API key and OpenAI-compatible API URL
- A Gemini API key

## Install

```bash
pnpm install
pnpm exec playwright install chromium
```

## Configure environment

```bash
cp .env.example .env
```

Set `GROQ_API_KEY`, `GROQ_API_URL`, and `GEMINI_API_KEY` in `.env`. The intent
service uses the Groq OpenAI-compatible endpoint; agentic recovery uses Gemini.
For a local web client, set `CORS_ORIGIN_WHITELIST` to
`http://localhost:3000` and include `GET,POST,PUT,OPTIONS` in
`CORS_ALLOW_METHODS`. `APP_PORT` defaults to `3001` in the documented local
setup, and set `APP_ADDRESS` to `0.0.0.0`.

Never commit `.env`, `.env.local`, or any file containing real credentials.

## Run checks

```bash
pnpm run check
```

## Run the API

```bash
pnpm run start:dev
```

With those values, the API listens on `http://localhost:3001`.

## Storage

The API creates `database.sqlite` in its working directory and uses TypeORM
with SQLite entities for tests, steps, runs, trace events, and promotion
candidates. `synchronize: true` is enabled for this prototype.
