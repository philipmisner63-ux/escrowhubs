#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "🔨 Building and deploying all 4 frontends safely..."

# ── BlockDAG (main) ──
echo ""
echo "=== BlockDAG ==="
cd "$SCRIPT_DIR/frontend"
pnpm build
rsync -az --delete \
  --exclude='.next/cache' \
  .next/ blockdag-oracle:/root/blockdag-escrow/frontend/.next/
ssh blockdag-oracle "pm2 restart frontend"

# ── Base ──
echo ""
echo "=== Base ==="
cd "$SCRIPT_DIR/frontend-base"
pnpm build
rsync -az --delete \
  --exclude='.next/cache' \
  .next/ blockdag-oracle:/root/blockdag-escrow/frontend-base/.next/
rsync -az package.json blockdag-oracle:/root/blockdag-escrow/frontend-base/
rsync -az --delete public/ blockdag-oracle:/root/blockdag-escrow/frontend-base/public/
ssh blockdag-oracle "pm2 restart frontend-base"

# ── Polygon ──
echo ""
echo "=== Polygon ==="
cd "$SCRIPT_DIR/frontend-polygon"
pnpm build
rsync -az --delete \
  --exclude='.next/cache' \
  .next/ blockdag-oracle:/root/blockdag-escrow/frontend-polygon/.next/
rsync -az package.json blockdag-oracle:/root/blockdag-escrow/frontend-polygon/
rsync -az --delete public/ blockdag-oracle:/root/blockdag-escrow/frontend-polygon/public/
ssh blockdag-oracle "pm2 restart frontend-polygon"

# ── Celo ──
echo ""
echo "=== Celo ==="
cd "$SCRIPT_DIR/frontend-celo"
pnpm build
rsync -az --delete \
  --exclude='.next/cache' \
  --exclude='node_modules' \
  --exclude='.git' \
  .next/ blockdag-oracle:/root/blockdag-escrow/frontend-celo/.next/
rsync -az package.json blockdag-oracle:/root/blockdag-escrow/frontend-celo/
rsync -az --delete public/ blockdag-oracle:/root/blockdag-escrow/frontend-celo/public/
ssh blockdag-oracle "pm2 restart frontend-celo"

echo ""
echo "✅ All 4 frontends deployed safely."
