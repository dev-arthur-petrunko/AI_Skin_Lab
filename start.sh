#!/usr/bin/env bash
# AI Skin Lab — launch script (Linux/macOS/Git Bash)
# 1) Syncs the source price.xlsx into ./data (mounted into Docker)
# 2) Starts backend + frontend via docker-compose
# 3) Optionally starts a Cloudflare Tunnel
#
# Usage:
#   ./start.sh                 # docker only
#   ./start.sh my-tunnel-name  # docker + cloudflared tunnel run

set -euo pipefail
cd "$(dirname "$0")"

echo "== AI Skin Lab: syncing Excel =="
if [ -f "./price.xlsx" ]; then
  mkdir -p ./data
  cp ./price.xlsx ./data/price.xlsx
  echo "price.xlsx -> data/price.xlsx"
elif [ ! -f "./data/price.xlsx" ]; then
  echo "WARNING: price.xlsx not found — backend will start with an empty catalog."
fi

echo "== docker compose up -d =="
docker compose up -d --build

echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000/api/health"

if [ "${1:-}" != "" ]; then
  echo "== cloudflared tunnel run $1 =="
  cloudflared tunnel run "$1"
else
  echo ""
  echo "To expose to the internet run one of:"
  echo "  cloudflared tunnel run <tunnel-name>"
  echo "  ngrok http 3000"
fi
