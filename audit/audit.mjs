#!/usr/bin/env node
/**
 * EscrowHubs Daily Health Audit
 * Checks: pages, assets, APIs, RPC, PM2 processes
 * Alerts: Discord webhook on any failure
 */

import https from "https";
import http from "http";
import { execSync } from "child_process";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1495787254835187733/glomVGz1AqxBxrGkZL2sRPCKL3H6Zzn6KVbIEHDCaejxBb9P4j40lSQcZdeCAcZNSgwc";

const SITES = [
  { name: "BlockDAG",  url: "https://app.escrowhubs.io"     },
  { name: "Base",      url: "https://base.escrowhubs.io"    },
  { name: "Polygon",   url: "https://polygon.escrowhubs.io" },
  { name: "BSC",       url: "https://bsc.escrowhubs.io"     },
];

const ASSETS = [
  "/assets/branding/escrowhubs-logo.svg",
  "/icons/icon-192x192.png",
  "/manifest.json",
];

const PAGES = ["/en", "/en/dashboard", "/en/create", "/en/how-it-works"];

const RPCS = [
  { name: "BlockDAG", url: "https://rpc.bdagscan.com",  chainId: 1404 },
  { name: "Base",     url: "https://mainnet.base.org",  chainId: 8453 },
  { name: "Polygon",  url: "https://polygon-mainnet.g.alchemy.com/v2/YUs_6FzIKG617Yt8pMqay",   chainId: 137  },
];

const PM2_PROCESSES = [
  "frontend", "frontend-base", "frontend-polygon", "frontend-bsc",
  "oracle", "oracle-base", "oracle-polygon", "oracle-bsc",
];

const results = { passed: [], failed: [] };

function pass(label) { results.passed.push(label); }
function fail(label, reason) { results.failed.push({ label, reason }); }

// HTTP fetch helper
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

// Page checks
async function checkPages() {
  for (const site of SITES) {
    for (const page of PAGES) {
      const url = site.url + page;
      try {
        const r = await fetchUrl(url);
        if (r.status >= 200 && r.status < 400) pass(site.name + " page " + page);
        else fail(site.name + " page " + page, "HTTP " + r.status);
      } catch (e) {
        fail(site.name + " page " + page, e.message);
      }
    }
  }
}

// Asset checks
async function checkAssets() {
  for (const site of SITES) {
    for (const asset of ASSETS) {
      const url = site.url + asset;
      try {
        const r = await fetchUrl(url);
        if (r.status === 200) pass(site.name + " asset " + asset);
        else fail(site.name + " asset " + asset, "HTTP " + r.status);
      } catch (e) {
        fail(site.name + " asset " + asset, e.message);
      }
    }
  }
}

// API checks
async function checkAPIs() {
  const apiChecks = [
    { name: "Base marketplace API", url: "https://base.escrowhubs.io/api/marketplace/my-escrows?wallet=0x0000000000000000000000000000000000000001" },
    { name: "Base support API",     url: "https://base.escrowhubs.io/api/support" },
  ];
  for (const c of apiChecks) {
    try {
      const r = await fetchUrl(c.url);
      if (r.status < 500) pass(c.name);
      else fail(c.name, "HTTP " + r.status);
    } catch (e) {
      fail(c.name, e.message);
    }
  }
}

// RPC checks
async function checkRPCs() {
  for (const rpc of RPCS) {
    try {
      const r = await fetchUrl(rpc.url, {
        method: "POST",
        body: { jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 },
      });
      const json = JSON.parse(r.body);
      const id = parseInt(json.result, 16);
      if (id === rpc.chainId) pass("RPC " + rpc.name + " chainId=" + id);
      else fail("RPC " + rpc.name, "Expected chainId " + rpc.chainId + ", got " + id);
    } catch (e) {
      fail("RPC " + rpc.name, e.message);
    }
  }
}

// PM2 process checks
function checkPM2() {
  try {
    const out = execSync("pm2 jlist", { encoding: "utf8" });
    const procs = JSON.parse(out);
    for (const name of PM2_PROCESSES) {
      const p = procs.find(x => x.name === name);
      if (!p) { fail("PM2 " + name, "process not found"); continue; }
      if (p.pm2_env.status === "online") pass("PM2 " + name);
      else fail("PM2 " + name, "status=" + p.pm2_env.status + " restarts=" + p.pm2_env.restart_time);
    }
  } catch (e) {
    fail("PM2 check", e.message);
  }
}

// Discord alert
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

// Main
console.log("EscrowHubs audit starting:", new Date().toISOString());
await checkPages();
await checkAssets();
await checkAPIs();
await checkRPCs();
checkPM2();

console.log("\nPassed: " + results.passed.length);
console.log("Failed: " + results.failed.length);

if (results.failed.length > 0) {
  console.log("\nFailures:");
  results.failed.forEach(f => console.log(" - " + f.label + ": " + f.reason));
  const lines = results.failed.map(f => "❌ **" + f.label + "** — " + f.reason).join("\n");
  await sendDiscord("🚨 EscrowHubs Audit — FAILURES DETECTED", lines, 0xff4444);
  process.exit(1);
} else {
  console.log("All checks passed.");
  await sendDiscord(
    "✅ EscrowHubs Audit — All systems healthy",
    results.passed.length + " checks passed across 4 chains",
    0x00cc66
  );
}
