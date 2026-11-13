#!/usr/bin/env bash
set -euo pipefail

mkdir -p .serve-logs

CLOUDFLARED_BIN="cloudflared"
if ! command -v cloudflared >/dev/null 2>&1; then
  if [ -f "/c/Program Files (x86)/cloudflared/cloudflared.exe" ]; then
    CLOUDFLARED_BIN="/c/Program Files (x86)/cloudflared/cloudflared.exe"
  elif [ -f "C:/Program Files (x86)/cloudflared/cloudflared.exe" ]; then
    CLOUDFLARED_BIN="C:/Program Files (x86)/cloudflared/cloudflared.exe"
  elif [ -f "/c/Program Files/cloudflared/cloudflared.exe" ]; then
    CLOUDFLARED_BIN="/c/Program Files/cloudflared/cloudflared.exe"
  elif [ -f "C:/Program Files/cloudflared/cloudflared.exe" ]; then
    CLOUDFLARED_BIN="C:/Program Files/cloudflared/cloudflared.exe"
  fi
fi

if command -v docker >/dev/null 2>&1; then
  docker compose up -d --wait 2>/dev/null || true
fi

pnpm --filter @pathpulse/api start:dev > .serve-logs/api.log 2>&1 &
API_PID=$!

pnpm --filter @pathpulse/web dev > .serve-logs/web.log 2>&1 &
WEB_PID=$!

"$CLOUDFLARED_BIN" tunnel --url http://localhost:3000 > .serve-logs/tunnel.log 2>&1 &
TUNNEL_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" "$TUNNEL_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

TUNNEL_URL=""
for i in $(seq 1 60); do
  if grep -o "https://[a-zA-Z0-9-]*\.trycloudflare\.com" .serve-logs/tunnel.log > /dev/null 2>&1; then
    TUNNEL_URL=$(grep -o "https://[a-zA-Z0-9-]*\.trycloudflare\.com" .serve-logs/tunnel.log | head -n 1)
    break
  fi
  sleep 1
done

if [ -n "$TUNNEL_URL" ]; then
  echo "Shareable tunnel URL: $TUNNEL_URL"
else
  echo "Failed to retrieve trycloudflare tunnel URL within 60s"
  exit 1
fi

wait "$TUNNEL_PID"
