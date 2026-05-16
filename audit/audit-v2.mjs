#!/usr/bin/env node
/**
 * EscrowHubs Health Audit v2.0
 * Scope: Base + Celo (pilot), expandable to all chains
 * Checks: pages, assets, APIs, RPCs, PM2 (remote), contract code presence
 * Tiers: 1=auto-fix, 2=log+retry, 3=Telegram alert to Philip
 * Schedule: 30min via cronjob
 */

import https from "https";
import http from "http";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1495787254835187733/glomVGz1AqxBxrGkZL2sRPCKL3H6Zzn6KVbIEHDCaejxBb9P4j40lSQcZdeCAcZNSgwc";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "8048681407";
const SSH_HOST = process.env.SSH_HOST || "blockdag-oracle";

const SITES = [
  { name: "BlockDAG",  url: "https://app.escrowhubs.io",      chainId: 1404  },
  { name: "Base",      url: "https://base.escrowhubs.io",      chainId: 8453  },
  { name: "Polygon",   url: "https://polygon.escrowhubs.io",   chainId: 137   },
  { name: "BSC",       url: "https://bsc.escrowhubs.io",       chainId: 56    },
  { name: "Celo",      url: "https://celo.escrowhubs.io",      chainId: 42220 },
];

const ASSETS = [
  "/assets/branding/escrowhubs-logo.svg",
  "/icons/icon-192x192.png",
  "/manifest.json",
];

const PAGES = ["/en", "/en/dashboard", "/en/create", "/en/how-it-works"];

// Per-site page overrides
const PAGE_OVERRIDES = {
  "Celo": ["/", "/create", "/escrows"],
};

// Load chain config from oracle
let CHAIN_CONFIG = [];
try {
  const chainsPath = join(__dirname, "../oracle/chains.json");
  if (existsSync(chainsPath)) {
    CHAIN_CONFIG = JSON.parse(readFileSync(chainsPath, "utf8"));
  }
} catch (e) {
  console.warn("Could not load chains.json:", e.message);
}

// Merge Base and Celo configs
["chains.base.json", "chains.celo.json"].forEach(f => {
  try {
    const p = join(__dirname, "../oracle", f);
    if (existsSync(p)) {
      const arr = JSON.parse(readFileSync(p, "utf8"));
      CHAIN_CONFIG.push(...arr);
    }
  } catch (e) { /* ignore */ }
});

// Build RPC list from chain config
const RPCS = CHAIN_CONFIG.map(c => ({
  name: c.name,
  // Use correct BlockDAG RPC endpoint
  url: c.name === "BlockDAG" ? "https://rpc.bdagscan.com"
      : (process.env[c.rpcUrlEnvVar] || c.rpcUrlFallback),
  chainId: c.chainId,
  factoryAddress: process.env[c.factoryAddressEnvVar] || c.factoryAddressFallback,
  arbiterAddress: process.env[c.arbiterAddressEnvVar] || c.arbiterAddressFallback,
  validationRegistryAddress: c.validationRegistryAddress,
}));

const PM2_PROCESSES = [
  "frontend", "frontend-base", "frontend-polygon", "frontend-bsc", "frontend-celo",
  "oracle", "oracle-base", "oracle-polygon", "oracle-bsc", "oracle-celo",
];

// ─── State ───
const results = { passed: [], failed: [], tier1: [], tier2: [], tier3: [] };

function pass(label) { results.passed.push(label); }
function fail(label, reason, tier = 2) {
  const f = { label, reason, tier };
  results.failed.push(f);
  if (tier === 1) results.tier1.push(f);
  if (tier === 2) results.tier2.push(f);
  if (tier === 3) results.tier3.push(f);
}

// ─── HTTP helper ───
function fetchUrl(url, { method = "GET", body = null, timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const options = { method };
    if (body) options.headers = { "Content-Type": "application/json" };
    const req = lib.request(url, options, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error("timeout")); });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── SSH helper ───
function sshExec(cmd) {
  try {
    return execSync(`ssh ${SSH_HOST} "${cmd}"`, { encoding: "utf8", timeout: 30000 });
  } catch (e) {
    return "";
  }
}

// ─── Page checks ───
async function checkPages() {
  for (const site of SITES) {
    const pages = PAGE_OVERRIDES[site.name] || PAGES;
    for (const page of pages) {
      const url = site.url + page;
      try {
        const r = await fetchUrl(url);
        if (r.status >= 200 && r.status < 400) pass(site.name + " page " + page);
        else fail(site.name + " page " + page, "HTTP " + r.status, 2);
      } catch (e) {
        fail(site.name + " page " + page, e.message, 2);
      }
    }
  }
}

// ─── Asset checks (with auto-fix attempt for Tier 1) ───
async function checkAssets() {
  for (const site of SITES) {
    for (const asset of ASSETS) {
      const url = site.url + asset;
      try {
        const r = await fetchUrl(url);
        if (r.status === 200) {
          pass(site.name + " asset " + asset);
        } else {
          fail(site.name + " asset " + asset, "HTTP " + r.status, 1);
        }
      } catch (e) {
        fail(site.name + " asset " + asset, e.message, 1);
      }
    }
  }
}

// ─── API checks ───
async function checkAPIs() {
  const apiChecks = [
    { name: "Base marketplace API", url: "https://base.escrowhubs.io/api/marketplace/my-escrows?wallet=0x0000000000000000000000000000000000000001" },
    { name: "Base support API",     url: "https://base.escrowhubs.io/api/support" },
    { name: "Celo marketplace API", url: "https://celo.escrowhubs.io/api/marketplace/my-escrows?wallet=0x0000000000000000000000000000000000000001" },
    { name: "Celo support API",     url: "https://celo.escrowhubs.io/api/support" },
  ];
  for (const c of apiChecks) {
    try {
      const r = await fetchUrl(c.url);
      if (r.status < 500) pass(c.name);
      else fail(c.name, "HTTP " + r.status, 2);
    } catch (e) {
      fail(c.name, e.message, 2);
    }
  }
}

// ─── RPC checks ───
async function checkRPCs() {
  for (const rpc of RPCS) {
    try {
      const r = await fetchUrl(rpc.url, {
        method: "POST",
        body: { jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 },
      });
      const json = JSON.parse(r.body);
      const id = parseInt(json.result, 16);
      if (id === rpc.chainId) {
        pass("RPC " + rpc.name + " chainId=" + id);
      } else {
        fail("RPC " + rpc.name, "Expected chainId " + rpc.chainId + ", got " + id, 2);
      }
    } catch (e) {
      fail("RPC " + rpc.name, e.message, 2);
    }
  }
}

// ─── Contract checks (Tier 3 if contract missing) ───
async function checkContracts() {
  for (const rpc of RPCS) {
    // Check Factory has code
    if (rpc.factoryAddress) {
      try {
        const r = await fetchUrl(rpc.url, {
          method: "POST",
          body: { jsonrpc: "2.0", method: "eth_getCode", params: [rpc.factoryAddress, "latest"], id: 2 },
        });
        const json = JSON.parse(r.body);
        if (json.result && json.result !== "0x") {
          pass(rpc.name + " Factory code present");
        } else {
          fail(rpc.name + " Factory", "No code at " + rpc.factoryAddress, 3);
        }
      } catch (e) {
        fail(rpc.name + " Factory", "RPC error: " + e.message, 2);
      }
    }

    // Check Arbiter has code
    if (rpc.arbiterAddress) {
      try {
        const r = await fetchUrl(rpc.url, {
          method: "POST",
          body: { jsonrpc: "2.0", method: "eth_getCode", params: [rpc.arbiterAddress, "latest"], id: 3 },
        });
        const json = JSON.parse(r.body);
        if (json.result && json.result !== "0x") {
          pass(rpc.name + " Arbiter code present");
        } else {
          fail(rpc.name + " Arbiter", "No code at " + rpc.arbiterAddress, 3);
        }
      } catch (e) {
        fail(rpc.name + " Arbiter", "RPC error: " + e.message, 2);
      }
    }

    // Check ValidationRegistry has code (Celo only for now)
    if (rpc.validationRegistryAddress) {
      try {
        const r = await fetchUrl(rpc.url, {
          method: "POST",
          body: { jsonrpc: "2.0", method: "eth_getCode", params: [rpc.validationRegistryAddress, "latest"], id: 4 },
        });
        const json = JSON.parse(r.body);
        if (json.result && json.result !== "0x") {
          pass(rpc.name + " ValidationRegistry code present");
        } else {
          fail(rpc.name + " ValidationRegistry", "No code at " + rpc.validationRegistryAddress, 3);
        }
      } catch (e) {
        fail(rpc.name + " ValidationRegistry", "RPC error: " + e.message, 2);
      }
    }
  }
}

// ─── PM2 remote checks ───
function checkPM2Remote() {
  try {
    const out = sshExec("pm2 jlist");
    if (!out) {
      fail("PM2 remote check", "SSH to " + SSH_HOST + " failed", 2);
      return;
    }
    const procs = JSON.parse(out);
    for (const name of PM2_PROCESSES) {
      const p = procs.find(x => x.name === name);
      if (!p) { fail("PM2 " + name, "process not found", 2); continue; }
      if (p.pm2_env.status === "online") pass("PM2 " + name);
      else fail("PM2 " + name, "status=" + p.pm2_env.status + " restarts=" + p.pm2_env.restart_time, 2);
    }
  } catch (e) {
    fail("PM2 remote check", e.message, 2);
  }
}

// ─── Tier 1 auto-fix attempts ───
async function runAutoFixes() {
  let fixed = [];
  for (const f of results.tier1) {
    if (f.label.includes(" asset ")) {
      const parts = f.label.split(" asset ");
      const siteName = parts[0];
      const asset = parts[1];

      // Map site name to frontend directory
      const dirMap = {
        "BlockDAG": "frontend",
        "Base": "frontend-base",
        "Polygon": "frontend-polygon",
        "BSC": "frontend-bsc",
        "Celo": "frontend-celo",
      };
      const dir = dirMap[siteName];
      if (!dir) continue;

      // Check if asset exists in source public/
      const assetPath = `/root/blockdag-escrow/${dir}/public${asset}`;
      const check = sshExec(`ls ${assetPath} 2>/dev/null`);
      if (check && check.trim()) {
        // Copy to standalone build
        const standalonePath = `/root/blockdag-escrow/${dir}/.next/standalone/public${asset}`;
        const standaloneDir = standalonePath.substring(0, standalonePath.lastIndexOf("/"));
        sshExec(`mkdir -p ${standaloneDir} && cp ${assetPath} ${standalonePath}`);

        // Restart PM2
        const pm2Name = dir.replace("frontend", "frontend").replace("frontend-", "frontend-");
        sshExec(`pm2 restart ${pm2Name} > /dev/null 2>&1`);

        fixed.push(f.label);
        console.log("  [AUTO-FIX] Copied " + asset + " for " + siteName + ", restarted " + pm2Name);
      } else {
        console.log("  [AUTO-FIX] Asset missing in source: " + assetPath);
      }
    }
  }
  return fixed;
}

// ─── Alerts ───
async function sendDiscord(title, description, color) {
  const body = {
    embeds: [{
      title,
      description,
      color,
      footer: { text: new Date().toISOString() },
    }],
  };
  try {
    await fetchUrl(DISCORD_WEBHOOK, { method: "POST", body });
  } catch (e) {
    console.error("Discord alert failed:", e.message);
  }
}

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("Telegram credentials missing - set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetchUrl(url, {
      method: "POST",
      body: {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      },
    });
  } catch (e) {
    console.error("Telegram alert failed:", e.message);
  }
}

// ─── Main ───
console.log("EscrowHubs Audit v2.0 —", new Date().toISOString());
console.log("Chains:", SITES.map(s => s.name).join(", "));
console.log("");

await checkPages();
await checkAssets();
await checkAPIs();
await checkRPCs();
await checkContracts();
checkPM2Remote();

console.log("\nPassed:", results.passed.length);
console.log("Failed:", results.failed.length);
if (results.tier1.length) console.log("Tier 1 (auto-fix):", results.tier1.length);
if (results.tier2.length) console.log("Tier 2 (retry):", results.tier2.length);
if (results.tier3.length) console.log("Tier 3 (ALERT):", results.tier3.length);

// Run auto-fixes for Tier 1
let autoFixed = [];
if (results.tier1.length > 0) {
  console.log("\nRunning Tier 1 auto-fixes...");
  autoFixed = await runAutoFixes();
}

// Report failures
if (results.failed.length > 0) {
  console.log("\nFailures:");
  results.failed.forEach(f => {
    const tierLabel = f.tier === 3 ? "🔴 T3" : f.tier === 2 ? "🟡 T2" : "🟢 T1";
    console.log(" " + tierLabel + " " + f.label + ": " + f.reason);
  });

  // Discord summary
  const lines = results.failed.map(f => {
    const icon = f.tier === 3 ? "🔴" : f.tier === 2 ? "🟡" : "🟢";
    return `${icon} **${f.label}** — ${f.reason}`;
  }).join("\n");
  await sendDiscord("EscrowHubs Audit — Issues Detected", lines, 0xff8800);

  // Telegram for Tier 3
  if (results.tier3.length > 0) {
    const t3Lines = results.tier3.map(f => `*${f.label}*\n${f.reason}`).join("\n\n");
    await sendTelegram(
      `🚨 *EscrowHubs Tier 3 Alert* 🚨\n\n${t3Lines}\n\nAuto-fixes applied: ${autoFixed.length}`
    );
  }

  process.exit(1);
} else {
  console.log("All checks passed.");
  await sendDiscord(
    "EscrowHubs Audit — All Healthy",
    results.passed.length + " checks passed across " + SITES.length + " chains",
    0x00cc66
  );
}
