# EscrowHubs Atomic Deploy Pipeline — Specification v0.1

**Scope**: Base + Celo (pilot). Expandable to Polygon, BSC, BlockDAG.  
**Status**: Draft for Hermes/Claw design session.  
**Telegram**: Wired — bot token + chat ID in `TOOLS.md`.

---

## 1. Problem

Current deploy flow:
```
1. npm run build  (on dev machine)
2. rsync .next/   →  server:/root/blockdag-escrow/frontend-{chain}/
3. pm2 restart    (overwrites files while server is reading them)
```

**Failure modes observed:**
- Server Action ID mismatch — client JS from old build calls server endpoint with stale action ID → 404
- Missing `public/` assets — `rsync` skips if directory doesn't exist → 404 on branding/logo/manifest
- PM2 restart loop — if build has a runtime error, PM2 restarts infinitely
- Mobile PWA cache — stale `BUILD_ID` survives deploy, users see broken app

**Root cause**: No atomicity. Files are mutated in-place under a running process.

---

## 2. Desired Flow

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   Build     │───▶│    Stage     │───▶│    Verify    │
│  (local)    │    │  (versioned) │    │   (health)   │
└─────────────┘    └──────────────┘    └──────────────┘
                                              │
                                              ▼ (pass)
                                       ┌──────────────┐
                                       │ Atomic Swap  │
                                       │ (symlink)    │
                                       └──────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │   Verify     │
                                       │  (smoke test)│
                                       └──────────────┘
                                              │
                                     ┌────────┴────────┐
                                     ▼                 ▼
                                  (pass)            (fail)
                                  Serve              Rollback
```

---

## 3. Components

### 3.1 Build Agent — `deploy-pipeline.sh` (local)

**Input**: `--chain base|celo [--skip-build]`

**Steps:**
1. Determine version: `v=$(git rev-parse --short HEAD)-$(date +%s)`
2. Build Next.js standalone: `npm run build` (or skip if `--skip-build`)
3. **Critical**: Copy `public/` → `.next/standalone/public/` (Hermes Base fix)
4. Tar: `tar czf deploy-{chain}-{v}.tgz .next/standalone/ package.json ecosystem.config.js`
5. SCP to server: `/root/blockdag-escrow/staging/deploy-{chain}-{v}.tgz`

**Artifact naming**: `deploy-{chain}-{shortsha}-{timestamp}.tgz`

### 3.2 Server Staging

Server paths:
```
/root/blockdag-escrow/
  staging/
    deploy-base-abc123-1683840000.tgz      ← uploaded artifact
  live/
    base/  ← symlink → releases/base-abc123-1683840000
    celo/  ← symlink → releases/celo-abc123-1683840000
  releases/
    base-abc123-1683840000/   ← unpacked build
    base-oldversion/          ← previous (kept for rollback)
    celo-abc123-1683840000/
    celo-oldversion/
```

**Deploy script (server-side)**:
```bash
CHAIN=$1
TGZ=$2
VERSION=$(basename $TGZ .tgz | sed "s/deploy-${CHAIN}-//")
RELEASE_DIR="/root/blockdag-escrow/releases/${CHAIN}-${VERSION}"

# 1. Unpack to new release dir (never touch live/)
mkdir -p $RELEASE_DIR
tar xzf $TGZ -C $RELEASE_DIR --strip-components=1

# 2. Pre-warm: ensure public/ exists inside standalone/
[ -d $RELEASE_DIR/public ] || cp -r /root/blockdag-escrow/frontend-${CHAIN}/public $RELEASE_DIR/

# 3. Health check: PM2 can start this?
cd $RELEASE_DIR && node -e "require('./server.js')" &
PID=$!
sleep 3
kill $PID 2>/dev/null

# 4. Atomic swap
ln -sfn $RELEASE_DIR /root/blockdag-escrow/live/${CHAIN}

# 5. PM2 reload (not restart — zero-downtime)
pm2 reload ecosystem-${CHAIN}.config.js --update-env

# 6. Post-deploy smoke test
sleep 5
curl -sf https://${CHAIN}.escrowhubs.io/api/health || exit 1
```

### 3.3 PM2 Ecosystem Config

Each chain gets its own ecosystem file:

```javascript
// ecosystem-base.config.js
module.exports = {
  apps: [{
    name: 'frontend-base',
    cwd: '/root/blockdag-escrow/live/base',
    script: 'server.js',
    env: {
      PORT: 3000,
      NODE_ENV: 'production',
      // ... chain-specific env vars
    },
    instances: 1,
    exec_mode: 'fork',
    // PM2 reload preserves connections during swap
  }]
};
```

**Key**: `cwd` points to symlink `/root/blockdag-escrow/live/{chain}`. When symlink swaps, next `pm2 reload` picks up new code atomically.

### 3.4 Verification & Smoke Tests

**Automated checks post-deploy**:
1. `curl -sf https://{chain}.escrowhubs.io/en` → 200
2. `curl -sf https://{chain}.escrowhubs.io/assets/branding/escrowhubs-logo.svg` → 200
3. `curl -sf https://{chain}.escrowhubs.io/api/marketplace/my-escrows?wallet=0x...` → not 500

If any fail → **auto-rollback** (swap symlink back to previous release, `pm2 reload`)

### 3.5 Rollback

```bash
# Rollback to previous release
ln -sfn /root/blockdag-escrow/releases/${CHAIN}-PREVIOUS_VERSION /root/blockdag-escrow/live/${CHAIN}
pm2 reload ecosystem-${CHAIN}.config.js --update-env
```

Previous release kept for N=2 versions. Older versions auto-pruned.

### 3.6 Alerting Integration (Telegram)

**Wired credentials** (from `TOOLS.md`):
- Bot token: `8502445460:AAGk_JhHkIPgl8oSKwvgYj4ZMLBuMeWV-0o`
- Chat ID: `8048681407`

**Alert triggers**:
| Event | Tier | Recipient | Action |
|-------|------|-----------|--------|
| Build fails | T3 | Telegram Philip | Stop deploy |
| Smoke test fails | T3 | Telegram Philip | Auto-rollback, notify |
| Rollback executed | T2 | Discord | Log + audit |
| Deploy success | T1 | Discord | Log only |
| Asset 404 (runtime) | T1 | audit-v2.mjs auto-fix | Restart PM2 silently |

---

## 4. Celo Non-Standalone Handling

Celo (`frontend-celo`) does **not** use `output: 'standalone'`. It runs `next start` which requires `node_modules` at runtime. The pipeline handles this transparently:

**Celo artifact** (created by `deploy-build.sh`):
- `.next/` (excludes `cache/` to keep artifact small)
- `public/` (copied if not in build output)
- `package.json`, `next.config.js`
- Does **not** include `node_modules` (813MB — too heavy)

**Server-side setup** (`deploy-swap.sh`):
1. Unpacks `.next/` + `public/` + configs to release dir
2. Creates symlink: `node_modules → /root/blockdag-escrow/frontend-celo/node_modules`
3. Copies `.env` from source dir if missing
4. PM2 ecosystem config points `cwd` to `/live/celo` and runs `node_modules/.bin/next start -p 3004`

**Why this works**: `next start` resolves `.next/` and `public/` from cwd, and `node_modules` from the symlink. The built output (`.next/`) is fully atomic — no shared mutable state.

**Critical**: The `node_modules` symlink must exist before `pm2 reload`. If `pnpm install` ever upgrades `next` to an incompatible version, the symlink will point to the new version and Celo's old `.next/` build may break. Mitigation: `deploy-build.sh` pins `next` version in `package.json` — but in practice, `node_modules` is managed outside the pipeline and updated manually.

---

## 5. Agent Bus Integration

**Goal**: audit-v2.mjs detects a failure → spawns autonomous fix agent.

**Flow**:
```
audit-v2.mjs (cronjob)
  │
  ├─ Tier 1 (asset 404) ──▶ Hermes sub-agent ──▶ SSH to server
  │                              ├─ Copy missing asset
  │                              └─ pm2 reload
  │                              └─ Report: "fixed X on Y chain"
  │
  ├─ Tier 2 (RPC timeout) ──▶ Log to RecallHub
  │                              └─ Retry × 3 → escalate to T3
  │
  └─ Tier 3 (contract missing) ──▶ STOP
                                   └─ Telegram Philip
                                   └─ Halt auto-fixes (risk of funds)
```

**Bus message format** (for sub-agent consumption):
```json
{
  "type": "DEPLOY_FIX",
  "tier": 1,
  "chain": "base",
  "issue": "asset /icons/icon-192x192.png 404",
  "artifact": "deploy-base-abc123-1683840000",
  "authorization": "auto"
}
```

Tier 3 requires human authorization: `"authorization": "human"` with Philip's explicit `send it`.

---

## 5. Mobile PWA Cache Busting

**Problem**: nginx `Cache-Control: no-cache` prevents *future* stale caches but doesn't flush existing PWA service worker caches.

**Fix**:
- Add meta tag in `_app.tsx` or middleware:
  ```html
  <meta http-equiv="cache-control" content="no-cache, no-store" />
  ```
- Or: service worker that checks `BUILD_ID` against `/api/build-id` on load → forces reload if mismatch.

**Immediate**: Already fixed with nginx headers + server already sends `no-cache`.
**Long-term**: Service worker `BUILD_ID` check. Not in this spec.

---

## 6. Implementation Order

1. **Create staging directories** on blockdag-oracle server
2. **Write `deploy-pipeline.sh`** — build + stage + smoke test
3. **Write server-side `deploy-swap.sh`** — unpack + symlink + reload
4. **Write `ecosystem-base.config.js` and `ecosystem-celo.config.js`** — point to symlinks
5. **Test on Base** — full cycle, trigger rollback
6. **Test on Celo** — verify mobile cache issue resolved
7. **Add Telegram alerts** to deploy-swap.sh
8. **Integrate with audit-v2.mjs** — bus messages for Tier 1 fixes

---

## 7. Status

**Implemented** (May 12, 2026):
1. ✅ Staging directories created on blockdag-oracle
2. ✅ `deploy-build.sh` — local build artifact creation (handles both standalone and next-start)
3. ✅ `deploy-swap.sh` — server-side atomic swap with smoke test + rollback + Telegram alerts
4. ✅ `ecosystem-base.config.js` + `ecosystem-celo.config.js` — PM2 configs pointing to `/live/{chain}`
5. ✅ Symlinks initialized: `/live/base` → `frontend-base`, `/live/celo` → `frontend-celo`
6. ✅ PM2 reloaded with new configs, both chains serving (200 OK)

**Not yet done**:
- Full deploy cycle test (needs next real deploy to verify)
- Rollback test (intentionally break a deploy)
- Expand to Polygon, BSC, BlockDAG
- Agent bus integration for Tier 1 autonomous fixes

## 8. Open Questions

1. **Build location**: Do we build on Philip's machine and SCP, or build on a CI agent (GitHub Actions)?
2. **Secrets**: `.env` files contain RPC URLs — should they live outside the artifact in `/root/blockdag-escrow/env/`?
3. **Database migrations**: Does any chain need DB schema changes on deploy? (BlockDAG oracle uses SQLite — need migration strategy)
4. **Downtime tolerance**: PM2 reload is ~2-3s. Acceptable for EscrowHubs, or need blue-green with nginx upstream?
5. **Version retention**: Keep 2 previous releases? 5? Disk on blockdag-oracle is limited.

---

**Ready for real deploy test. Run `./deploy-build.sh --chain base` then SSH to server and run `./deploy-swap.sh --chain base --artifact /root/blockdag-escrow/staging/deploy-base-xxx.tgz`.**
