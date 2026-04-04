#!/usr/bin/env bash
# Run signal server + Metro in two terminals, or use this from tmux/background jobs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CI=false

echo "Starting Glyph server on :3001..."
(cd "$ROOT/server" && npm run dev) &
SRV_PID=$!

cleanup() {
  kill "$SRV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 1
echo "Starting Metro (localhost:8081)..."
cd "$ROOT/mobile" && npm start
