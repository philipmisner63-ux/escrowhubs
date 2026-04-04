# Deploying base.escrowhubs.io

Complete step-by-step guide for launching the Base L2 frontend on the existing VPS (209.38.135.176).

---

## Prerequisites

- Contracts deployed to Base mainnet via `npx hardhat run scripts/deploy.ts --network base`
- New contract addresses in hand
- DNS access to escrowhubs.io domain

---

## Step 1 — Deploy Contracts & Update Addresses

After running the deploy script, update the oracle and frontend configs:

```bash
# On the server — update oracle/.env.base with real addresses
ssh blockdag-oracle
nano /root/blockdag-escrow/oracle/.env.base
# Set: AI_ARBITER_ADDRESS=0x...
# Set: NEXT_PUBLIC_FACTORY_ADDRESS=0x...

# Update frontend-base .env.local on the server
nano /root/blockdag-escrow/frontend-base/.env.local
# Set: NEXT_PUBLIC_FACTORY_ADDRESS=0x...
# Set: NEXT_PUBLIC_ORACLE_ADDRESS=0x...
# Set: NEXT_PUBLIC_AI_ARBITER_ADDRESS=0x...
```

---

## Step 2 — DNS Setup

Add an A record pointing to the VPS:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | base.escrowhubs.io | 209.38.135.176 | 3600 |

Wait for propagation (check: `dig base.escrowhubs.io`).

---

## Step 3 — Nginx Configuration (run on server)

```bash
ssh blockdag-oracle

# Copy the nginx config
cp /root/blockdag-escrow/nginx/base.escrowhubs.io.conf \
   /etc/nginx/sites-available/base.escrowhubs.io.conf

# Enable the site
ln -s /etc/nginx/sites-available/base.escrowhubs.io.conf \
      /etc/nginx/sites-enabled/base.escrowhubs.io.conf

# Test config
nginx -t

# Reload nginx
systemctl reload nginx
```

---

## Step 4 — SSL Certificate

```bash
# On the server
certbot --nginx -d base.escrowhubs.io
# Follow prompts — certbot will auto-update the nginx config with HTTPS
```

---

## Step 5 — Build & Deploy Frontend

Run locally from the project root:

```bash
./deploy-base.sh
```

This will:
1. Build `frontend-base/` locally (avoids OOM on the 4GB server)
2. Rsync the `.next/` build, `public/`, and `package.json` to the server
3. Restart the `frontend-base` PM2 process

---

## Step 6 — Start PM2 Processes

If starting for the first time:

```bash
ssh blockdag-oracle

# Start frontend-base (port 3001)
pm2 start /root/blockdag-escrow/ecosystem.config.js --only frontend-base

# Start Base oracle (after .env.base is configured)
pm2 start /root/blockdag-escrow/ecosystem.config.js --only oracle-base

# Save PM2 state so processes restart on reboot
pm2 save
```

---

## Step 7 — Verify

```bash
# Check all processes
ssh blockdag-oracle "pm2 status"

# Check frontend-base is serving
curl -s -o /dev/null -w "%{http_code}" https://base.escrowhubs.io

# Check oracle-base logs
ssh blockdag-oracle "pm2 logs oracle-base --lines 10 --nostream"
```

Expected oracle-base output:
```
🔭 [Base/8453] Listening for disputes on chain 8453 | Arbiter: 0x...
[Base] Oracle listening on chain 8453
🤖 Telegram bot @EscrowHubsbot started (long-poll)
```

---

## Port Summary

| Process | Port | Domain |
|---|---|---|
| frontend | 3000 | app.escrowhubs.io |
| frontend-base | 3001 | base.escrowhubs.io |
| oracle | — | BlockDAG watcher |
| oracle-base | — | Base watcher |

---

## Rollback

If something goes wrong:

```bash
ssh blockdag-oracle "pm2 stop frontend-base oracle-base"
```

The existing `app.escrowhubs.io` is completely unaffected — it runs on port 3000 with its own PM2 process.
