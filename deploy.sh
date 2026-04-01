#!/bin/bash
set -e

echo "🔨 Building locally..."
cd "$(dirname "$0")/frontend"
pnpm build

echo "📦 Syncing to server..."
rsync -az --delete \
  --exclude='.next/cache' \
  .next/ root@209.38.135.176:/root/blockdag-escrow/frontend/.next/

echo "🔄 Restarting PM2..."
ssh blockdag-oracle "pm2 restart frontend"

echo "✅ Deploy complete"
