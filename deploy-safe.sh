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

  # Helper: install deps, build, and restart a frontend
  build_and_restart() {
    local dir=$1
    local name=$2
    echo ""
    echo "=== Building $name ==="
    cd "/root/blockdag-escrow/$dir"

    # npm (not pnpm) to avoid pnpm 11 build-script approval gate and
    # deterministic-version issues with wagmi/appkit.
    if [ -f package-lock.json ]; then
      npm ci --legacy-peer-deps
    else
      npm install --legacy-peer-deps
    fi

    NODE_OPTIONS='--max-old-space-size=768' npm run build
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
  pm2 restart ecosystem.config.js --update-env
  pm2 restart ecosystem-base.config.js --update-env
  pm2 restart ecosystem-polygon.config.js --update-env
  pm2 restart ecosystem-celo.config.js --update-env
  pm2 restart ecosystem-bsc.config.js --update-env
  pm2 restart ecosystem-naijalancers.config.js --update-env

  echo ""
  echo "💾 Saving PM2 dump..."
  pm2 save

  echo ""
  echo "📊 PM2 status:"
  pm2 list
REMOTESCRIPT

echo ""
echo "✅ Deploy complete."
