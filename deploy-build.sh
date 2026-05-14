#!/bin/bash
# EscrowHubs Atomic Deploy Pipeline — Local Build Script
# Usage: ./deploy-build.sh --chain base|celo [--skip-build]

set -euo pipefail

CHAIN=""
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --chain) CHAIN="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$CHAIN" ]] && { echo "Usage: $0 --chain base|celo [--skip-build]"; exit 1; }

SOURCE_DIR="/home/philip/projects/blockdag-escrow/frontend${CHAIN:+-$CHAIN}"
[[ "$CHAIN" == "blockdag" ]] && SOURCE_DIR="/home/philip/projects/blockdag-escrow/frontend"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source dir not found: $SOURCE_DIR"
  exit 1
fi

VERSION="$(cd "$SOURCE_DIR" && git rev-parse --short HEAD 2>/dev/null || echo 'nogit')-$(date +%s)"
ARTIFACT="deploy-${CHAIN}-${VERSION}.tgz"
STAGING_REMOTE="/root/blockdag-escrow/staging/"

cd "$SOURCE_DIR"

if [[ "$SKIP_BUILD" == false ]]; then
  echo "[BUILD] Building $CHAIN..."
  npm run build
fi

# Determine build mode
if [[ -d ".next/standalone" ]]; then
  echo "[BUILD] Standalone build detected"
  # Ensure public/ is inside standalone/
  if [[ ! -d ".next/standalone/public" && -d "public" ]]; then
    echo "[BUILD] Copying public/ into standalone/"
    cp -r public .next/standalone/
  fi
  # Copy .next/static/ into standalone — required for CSS/JS chunks to be served
  # Without this, the app renders HTML-only (text mode) — no styles or interactivity
  if [[ -d ".next/static" ]]; then
    echo "[BUILD] Copying .next/static/ into standalone/.next/"
    cp -r .next/static .next/standalone/.next/
  else
    echo "[BUILD] WARNING: .next/static/ not found — build may be incomplete"
  fi
  BUILD_DIR=".next/standalone"
  EXTRA_FILES="ecosystem.config.js ecosystem-${CHAIN}.config.js"
else
  echo "[BUILD] Non-standalone build (next start mode)"
  # Exclude .next/cache/ to keep artifact small
  BUILD_DIR=""
  EXTRA_FILES="package.json next.config.js next.config.ts next.config.mjs"
fi

echo "[BUILD] Creating artifact: $ARTIFACT"

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

if [[ -n "$BUILD_DIR" ]]; then
  # Standalone: copy standalone dir + configs (include hidden files)
  cp -r "$BUILD_DIR"/. "$TMPDIR/"
else
  # Non-standalone: tar .next/ (excluding cache) + public/ + configs
  mkdir -p "$TMPDIR/.next"
  rsync -a --exclude='cache' .next/ "$TMPDIR/.next/"
  if [[ -d "public" ]]; then
    cp -r public "$TMPDIR/"
  fi
fi

# Copy extra config files
for f in $EXTRA_FILES; do
  [[ -f "$f" ]] && cp "$f" "$TMPDIR/"
done

# Write version marker
echo "$VERSION" > "$TMPDIR/BUILD_ID"

# Create tarball
cd "$TMPDIR" && tar czf "/tmp/${ARTIFACT}" .

echo "[BUILD] Artifact ready: /tmp/${ARTIFACT} ($(du -h /tmp/${ARTIFACT} | cut -f1))"
echo "[BUILD] SCP to server..."
scp "/tmp/${ARTIFACT}" "blockdag-oracle:${STAGING_REMOTE}"

echo "[BUILD] Done. Artifact on server at ${STAGING_REMOTE}${ARTIFACT}"
echo "[BUILD] Run on server: ./deploy-swap.sh --chain ${CHAIN} --artifact ${STAGING_REMOTE}${ARTIFACT}"
