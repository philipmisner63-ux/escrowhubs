#!/bin/bash
set -e

echo "🔨 Building Base frontend locally..."
cd "$(dirname "$0")/frontend-base"
pnpm build

echo "📦 Syncing to server..."
rsync -az --delete \
  --exclude='.next/cache' \
  .next/ root@209.38.135.176:/root/blockdag-escrow/frontend-base/.next/

rsync -az \
  package.json \
  root@209.38.135.176:/root/blockdag-escrow/frontend-base/

rsync -az --delete \
  public/ \
  root@209.38.135.176:/root/blockdag-escrow/frontend-base/public/

echo "🔄 Restarting PM2..."
ssh blockdag-oracle "pm2 restart frontend-base || pm2 start /root/blockdag-escrow/ecosystem.config.js --only frontend-base"

echo "✅ Base deploy complete — https://base.escrowhubs.io"
