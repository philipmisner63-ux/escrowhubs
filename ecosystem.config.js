/**
 * PM2 Ecosystem Config — EscrowHubs
 *
 * Processes:
 *   oracle         — BlockDAG chain oracle (port N/A)
 *   oracle-base    — Base L2 chain oracle  (port N/A, disabled until Base deployment)
 *   frontend       — BlockDAG frontend     (port 3000)
 *   frontend-base  — Base frontend         (port 3001, disabled until Base deployment)
 *
 * Usage:
 *   pm2 start ecosystem.config.js           # start all enabled
 *   pm2 start ecosystem.config.js --only oracle,frontend
 *   pm2 restart oracle                      # restart single process
 */

"use strict";

module.exports = {
  apps: [
    // ─── BlockDAG Oracle ──────────────────────────────────────────────────────
    {
      name:   "oracle",
      script: "index.js",
      cwd:    "/root/blockdag-escrow/oracle",
      interpreter: "node",
      interpreter_args: "--experimental-vm-modules",
      env: {
        ENV_FILE:    ".env",
        CHAINS_FILE: "chains.json",
        NODE_ENV:    "production",
      },
      watch:         false,
      autorestart:   true,
      max_restarts:  10,
      restart_delay: 5000,
    },

    // ─── Base Oracle (disabled until contracts deployed to Base) ─────────────
    {
      name:   "oracle-base",
      script: "index.js",
      cwd:    "/root/blockdag-escrow/oracle",
      interpreter: "node",
      interpreter_args: "--experimental-vm-modules",
      env: {
        ENV_FILE:    ".env.base",
        CHAINS_FILE: "chains.base.json",
        NODE_ENV:    "production",
      },
      watch:         false,
      autorestart:   true,
      max_restarts:  10,
      restart_delay: 5000,
    },

    // ─── BlockDAG Frontend ───────────────────────────────────────────────────
    {
      name:   "frontend",
      script: "node_modules/.bin/next",
      args:   "start -p 3000",
      cwd:    "/root/blockdag-escrow/frontend",
      env: {
        NODE_ENV:              "production",
        NODE_OPTIONS:          "--max-old-space-size=768",
      },
      watch:         false,
      autorestart:   true,
      max_restarts:  10,
      restart_delay: 3000,
    },

    // ─── Base Frontend (disabled until Base deployment) ──────────────────────
    {
      name:   "frontend-base",
      script: "node_modules/.bin/next",
      args:   "start -p 3001",
      cwd:    "/root/blockdag-escrow/frontend-base",
      env: {
        NODE_ENV:              "production",
        NODE_OPTIONS:          "--max-old-space-size=768",
      },
      watch:         false,
      autorestart:   true,
      max_restarts:  10,
      restart_delay: 3000,
    },
  ],
};
