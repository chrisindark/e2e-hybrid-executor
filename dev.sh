#!/usr/bin/env bash
# dev.sh - Single-command development runner

cleanup() {
  echo "Stopping services..."
  kill $(jobs -p) 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting E2EHybridExecutor Backend..."
pnpm run dev:api &

echo "Starting Next.js UI..."
pnpm run dev:web &

wait
