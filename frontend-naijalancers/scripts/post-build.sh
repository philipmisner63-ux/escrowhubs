#!/bin/bash
set -e

# Next.js standalone output doesn't auto-copy static assets.
# This script copies .next/static into .next/standalone/.next/static
# so the standalone server can serve CSS, fonts, and other assets.

SRC=".next/static"
DEST=".next/standalone/.next/static"

if [ -d "$SRC" ]; then
  mkdir -p "$DEST"
  cp -r "$SRC"/* "$DEST/"
  echo "[post-build] Copied static assets to standalone output"
else
  echo "[post-build] No static assets found at $SRC"
fi
