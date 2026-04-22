#!/bin/bash
# EscrowHubs Deploy Gate
# Usage: ./deploy-gate.sh [blockdag|base|polygon|bsc]
set -e

ENV=${1:-blockdag}
LOG="/var/log/escrowhubs-deploy-${ENV}.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

case $ENV in
  blockdag) DIR="/root/blockdag-escrow/frontend";         PM2="frontend" ;;
  base)     DIR="/root/blockdag-escrow/frontend-base";    PM2="frontend-base" ;;
  polygon)  DIR="/root/blockdag-escrow/frontend-polygon"; PM2="frontend-polygon" ;;
  bsc)      DIR="/root/blockdag-escrow/frontend-bsc";     PM2="frontend-bsc" ;;
  *)        echo "Unknown env: $ENV. Use blockdag|base|polygon|bsc"; exit 1 ;;
esac

echo "[$TIMESTAMP] Deploy gate starting for $ENV" | tee -a "$LOG"

# Build
echo "Building $DIR..." | tee -a "$LOG"
cd "$DIR"
NODE_OPTIONS="--max-old-space-size=768" pnpm build 2>&1 | tee -a "$LOG"
if [ $? -ne 0 ]; then
  echo "[$TIMESTAMP] BUILD FAILED for $ENV — PM2 not restarted" | tee -a "$LOG"
  exit 1
fi

# Audit
echo "Running audit checks..." | tee -a "$LOG"
node /root/blockdag-escrow/audit/audit.mjs 2>&1 | tee -a "$LOG"
if [ $? -ne 0 ]; then
  echo "[$TIMESTAMP] AUDIT FAILED for $ENV — PM2 not restarted" | tee -a "$LOG"
  exit 1
fi

# Restart PM2
echo "All checks passed. Restarting $PM2..." | tee -a "$LOG"
pm2 restart "$PM2"
echo "[$TIMESTAMP] Deploy complete for $ENV" | tee -a "$LOG"
