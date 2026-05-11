#!/bin/bash
set -e

echo "🔨 Building Celo frontend locally..."
cd "$(dirname "$0")/frontend-celo"
pnpm build

echo "📦 Syncing to server..."
rsync -az --delete \
  --exclude='.next/cache' \
  --exclude='node_modules' \
  --exclude='.git' \
  .next/ root@209.38.135.176:/root/blockdag-escrow/frontend-celo/.next/

rsync -az \
  package.json \
  root@209.38.135.176:/root/blockdag-escrow/frontend-celo/

rsync -az --delete \
  public/ \
  root@209.38.135.176:/root/blockdag-escrow/frontend-celo/public/

echo "🔄 Restarting PM2..."
ssh blockdag-oracle "pm2 restart frontend-celo || pm2 start /root/blockdag-escrow/ecosystem.config.celo.js --only frontend-celo"

echo "✅ Celo deploy complete — https://celo.escrowhubs.io"