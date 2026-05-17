#!/bin/bash
set -euo pipefail

# EscrowHubs Deploy Script — builds ON SERVER, not locally.
# Usage: ./deploy-safe.sh          (assumes code already pushed to origin/main)
#        ./deploy-safe.sh --push   (commit & push local changes, then deploy)

REMOTE="blockdag-oracle"
REPO_DIR="/root/blockdag-escrow"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Optional: push local changes ──
if [[ "${1:-}" == "--push" ]]; then
  echo "🚀 Pushing local changes..."
  cd "$SCRIPT_DIR"
  git add -A
  git diff --cached --quiet || git commit -m "deploy: $(date -u +%Y-%m-%d_%H:%M:%S)"
  git push origin main
fi

# ── Remote build & restart ──
echo "🖥️  Building all frontends on server..."

ssh "$REMOTE" bash -s <<'REMOTESCRIPT'
  set -euo pipefail
  cd /root/blockdag-escrow

  echo "⬇️  Pulling latest..."
  git merge --no-edit origin/main || true

  # Helper: build a frontend and restart its PM2 process
  build_and_restart() {
    local dir=$1
    local name=$2
    echo ""
    echo "=== Building $name ==="
    cd "/root/blockdag-escrow/$dir"
    # Use the direct next binary (PM2-safe)
    pnpm build
    echo "✅ $name built"
  }

  build_and_restart "frontend"         "frontend (blockdag)"
  build_and_restart "frontend-base"    "frontend-base"
  build_and_restart "frontend-bsc"     "frontend-bsc"
  build_and_restart "frontend-polygon" "frontend-polygon"
  build_and_restart "frontend-celo"    "frontend-celo"
  build_and_restart "frontend-naijalancers" "frontend-naijalancers"

  echo ""
  echo "🔄 Restarting all PM2 processes..."
  pm2 restart ecosystem.config.js
  pm2 restart ecosystem-polygon.config.js
  pm2 restart ecosystem-celo.config.js
  pm2 restart ecosystem-naijalancers.config.js

  echo ""
  echo "📊 PM2 status:"
  pm2 list
REMOTESCRIPT

echo ""
echo "✅ Deploy complete."
