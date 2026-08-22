# Local setup

## Prerequisites

- Node.js 20 or newer
- pnpm 10 or newer
- An OpenAI API key

## Install

```bash
pnpm install
pnpm exec playwright install chromium
```

## Configure environment

```bash
cp .env.example .env
```

Set `OPENAI_API_KEY` in `.env`. Never commit `.env`, `.env.local`, or any
file containing real credentials. The existing local environment file contains
credentials that must be revoked and replaced before this project is published.

## Run checks

```bash
pnpm run check
```

## Run the API

```bash
pnpm run start:dev
```

The API listens on `http://localhost:3001` by default.
