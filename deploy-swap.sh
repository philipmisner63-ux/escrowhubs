#!/bin/bash
# EscrowHubs Atomic Deploy — Server-Side Swap Script
# Usage: ./deploy-swap.sh --chain base|celo --artifact /root/blockdag-escrow/staging/deploy-xxx.tgz

set -euo pipefail

CHAIN=""
ARTIFACT=""
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-8048681407}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-https://discord.com/api/webhooks/1495787254835187733/glomVGz1AqxBxrGkZL2sRPCKL3H6Zzn6KVbIEHDCaejxBb9P4j40lSQcZdeCAcZNSgwc}"

telegram_alert() {
  local msg="$1"
  if [[ -n "$TELEGRAM_BOT_TOKEN" && -n "$TELEGRAM_CHAT_ID" ]]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=${msg}" \
      -d "parse_mode=Markdown" > /dev/null 2>&1 || true
  fi
}

discord_alert() {
  local title="$1"
  local desc="$2"
  local color="$3"
  if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
    local body="{\"embeds\":[{\"title\":\"${title}\",\"description\":\"${desc}\",\"color\":${color},\"footer\":{\"text\":\"$(date -Iseconds)\"}}]}"
    curl -s -X POST "$DISCORD_WEBHOOK_URL" -H "Content-Type: application/json" -d "$body" > /dev/null 2>&1 || true
  fi
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --chain) CHAIN="$2"; shift 2 ;;
    --artifact) ARTIFACT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$CHAIN" || -z "$ARTIFACT" ]] && { echo "Usage: $0 --chain base|celo --artifact /path/to/deploy-xxx.tgz"; exit 1; }

if [[ ! -f "$ARTIFACT" ]]; then
  echo "Artifact not found: $ARTIFACT"
  exit 1
fi

ABS_ARTIFACT="$(realpath "$ARTIFACT")"
VERSION="$(basename "$ABS_ARTIFACT" .tgz | sed "s/deploy-${CHAIN}-//")"
RELEASE_DIR="/root/blockdag-escrow/releases/${CHAIN}-${VERSION}"
LIVE_LINK="/root/blockdag-escrow/live/${CHAIN}"
SOURCE_DIR="/root/blockdag-escrow/frontend${CHAIN:+-$CHAIN}"
[[ "$CHAIN" == "blockdag" ]] && SOURCE_DIR="/root/blockdag-escrow/frontend"
OLD_RELEASE=""
PM2_NAME="frontend-${CHAIN}"
[[ "$CHAIN" == "blockdag" ]] && PM2_NAME="frontend"
ECOSYSTEM="/root/blockdag-escrow/ecosystem-${CHAIN}.config.js"

echo "[DEPLOY] Chain: $CHAIN"
echo "[DEPLOY] Artifact: $ABS_ARTIFACT"
echo "[DEPLOY] Version: $VERSION"
echo "[DEPLOY] Release dir: $RELEASE_DIR"
echo "[DEPLOY] Source dir: $SOURCE_DIR"

# 1. Unpack to release dir (never touches live/)
echo "[DEPLOY] Unpacking artifact..."
mkdir -p "$RELEASE_DIR"
tar xzf "$ABS_ARTIFACT" -C "$RELEASE_DIR" --overwrite

# 2. Validate .next/static/ present (standalone only — catches missing CSS/JS before going live)
# Root cause: Next.js standalone builds require manual copy of .next/static/ — deploy-build.sh patch applied 2026-05-13
if [[ -d "$RELEASE_DIR/.next" ]]; then
  CSS_COUNT=$(find "$RELEASE_DIR/.next/static/css" -name "*.css" 2>/dev/null | wc -l || echo 0)
  if [[ "$CSS_COUNT" -eq 0 ]]; then
    echo "[DEPLOY] ERROR: no CSS files found in .next/static/css/ — artifact is missing static assets"
    echo "[DEPLOY] This deploy would render text-only. Aborting."
    telegram_alert "🚨 *DEPLOY ABORTED* — ${CHAIN}%0ANo CSS files in artifact. Text-only deploy prevented."
    exit 1
  fi
  echo "[DEPLOY] Static asset check PASSED (${CSS_COUNT} CSS files found)"
fi

# 3. Detect build mode
if [[ -f "$RELEASE_DIR/server.js" ]]; then
  BUILD_MODE="standalone"
  echo "[DEPLOY] Build mode: standalone (server.js found)"
else
  BUILD_MODE="next-start"
  echo "[DEPLOY] Build mode: next start (non-standalone)"
fi

# 4. Ensure public/ exists in release
if [[ ! -d "$RELEASE_DIR/public" ]]; then
  if [[ -d "$SOURCE_DIR/public" ]]; then
    echo "[DEPLOY] Copying public/ from source..."
    cp -r "$SOURCE_DIR/public" "$RELEASE_DIR/"
  else
    echo "[DEPLOY] WARNING: no public/ found in source"
  fi
fi

# 5. Symlink node_modules (non-standalone chains need it)
if [[ "$BUILD_MODE" == "next-start" ]]; then
  if [[ -d "$SOURCE_DIR/node_modules" && ! -e "$RELEASE_DIR/node_modules" ]]; then
    echo "[DEPLOY] Symlinking node_modules..."
    ln -s "$SOURCE_DIR/node_modules" "$RELEASE_DIR/node_modules"
  fi
fi

# 6. Copy .env if missing
if [[ -f "$SOURCE_DIR/.env" && ! -f "$RELEASE_DIR/.env" ]]; then
  echo "[DEPLOY] Copying .env from source..."
  cp "$SOURCE_DIR/.env" "$RELEASE_DIR/.env"
fi

# 7. Pre-flight health check (non-fatal — log only, don't block deploy)
# We run the server on a non-production port to avoid conflicts
HEALTH_PORT=39999
echo "[DEPLOY] Running pre-flight health check on port ${HEALTH_PORT}..."
HEALTH_OK=true
if [[ "$BUILD_MODE" == "standalone" ]]; then
  cd "$RELEASE_DIR" && PORT=$HEALTH_PORT timeout 8 node -e "require('./server.js')" > /dev/null 2>&1 || {
    echo "[DEPLOY] WARNING: server.js health check failed (non-fatal — will verify via smoke test)"
    HEALTH_OK=false
  }
else
  cd "$RELEASE_DIR" && timeout 8 node -e "
    const NextServer = require('next/dist/server/next-server').default;
    const server = new NextServer({ dir: process.cwd(), conf: {} });
    console.log('next-server loaded OK');
    process.exit(0);
  " > /dev/null 2>&1 || {
    echo "[DEPLOY] WARNING: next-server health check failed (non-fatal — will verify via smoke test)"
    HEALTH_OK=false
  }
fi
if [[ "$HEALTH_OK" == true ]]; then
  echo "[DEPLOY] Health check PASSED"
else
  echo "[DEPLOY] Health check skipped/failed — proceeding to smoke test"
fi

# 8. Save old release for rollback
if [[ -L "$LIVE_LINK" ]]; then
  OLD_RELEASE="$(readlink -f "$LIVE_LINK")"
  echo "[DEPLOY] Old release: $OLD_RELEASE"
fi

# 9. Atomic symlink swap
echo "[DEPLOY] Swapping symlink..."
ln -sfn "$RELEASE_DIR" "$LIVE_LINK"

# 10. PM2 restart with ecosystem config (delete+start to pick up new cwd)
echo "[DEPLOY] Restarting PM2: $PM2_NAME"
if [[ -f "$ECOSYSTEM" ]]; then
  pm2 delete "$PM2_NAME" > /dev/null 2>&1 || true
  pm2 start "$ECOSYSTEM"
else
  pm2 delete "$PM2_NAME" > /dev/null 2>&1 || true
  pm2 start "$PM2_NAME"
fi

# 11. Post-deploy smoke test
echo "[DEPLOY] Smoke testing..."
sleep 5

SMOKE_URL="https://${CHAIN}.escrowhubs.io"
[[ "$CHAIN" == "blockdag" ]] && SMOKE_URL="https://app.escrowhubs.io"

SMOKE_OK=true

# Test homepage
if ! curl -sfL -o /dev/null -w "%{http_code}" "$SMOKE_URL" 2>/dev/null | grep -qE '^2'; then
  echo "[DEPLOY] SMOKE FAIL: homepage $SMOKE_URL"
  SMOKE_OK=false
fi

# Test critical asset
if ! curl -sfL -o /dev/null -w "%{http_code}" "$SMOKE_URL/assets/branding/escrowhubs-logo.svg" 2>/dev/null | grep -qE '^2'; then
  echo "[DEPLOY] SMOKE FAIL: asset 404"
  SMOKE_OK=false
fi

# Test API (non-500)
API_STATUS=$(curl -sfL -o /dev/null -w "%{http_code}" "$SMOKE_URL/api/support" 2>/dev/null || echo "000")
if [[ "$API_STATUS" == "500" ]]; then
  echo "[DEPLOY] SMOKE FAIL: API returned 500"
  SMOKE_OK=false
fi

if [[ "$SMOKE_OK" == true ]]; then
  echo "[DEPLOY] Smoke PASSED"
  discord_alert "✅ Deploy OK: ${CHAIN}" "Version: ${VERSION}" 0x00cc66
  telegram_alert "✅ *Deploy OK* — ${CHAIN}%0AVersion: \`${VERSION}\`%0AMode: ${BUILD_MODE}"

  # Clean old releases (keep last 2)
  echo "[DEPLOY] Pruning old releases..."
  ls -td /root/blockdag-escrow/releases/${CHAIN}-* 2>/dev/null | tail -n +3 | xargs -r rm -rf

  echo "[DEPLOY] SUCCESS: ${CHAIN} live at ${VERSION}"
else
  echo "[DEPLOY] SMOKE FAILED — ROLLING BACK"
  if [[ -n "${OLD_RELEASE:-}" ]]; then
    ln -sfn "$OLD_RELEASE" "$LIVE_LINK"
    pm2 reload "$PM2_NAME"
    discord_alert "🚨 ROLLBACK: ${CHAIN}" "Smoke failed — rolled back" 0xff4444
    telegram_alert "🚨 *ROLLBACK* — ${CHAIN}%0NSmoke test failed.%0NRolled back to: \`$(basename ${OLD_RELEASE})\`"
    echo "[DEPLOY] ROLLBACK COMPLETE"
    exit 1
  else
    telegram_alert "🚨 *DEPLOY FAILED* — ${CHAIN}%0NSmoke test failed. No previous release. MANUAL FIX NEEDED."
    exit 1
  fi
fi
