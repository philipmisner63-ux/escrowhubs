/**
 * AI Arbiter Oracle Service — Multi-Chain
 *
 * Watches for Disputed (SimpleEscrow) and MilestoneDisputed (MilestoneEscrow)
 * events across all chains defined in chains.json.
 *
 * For each dispute:
 *  1. Build a structured DisputeContext from on-chain data
 *  2. Ask Claude for a structured JSON Decision (ruling + confidence + reasoning)
 *  3. Auto-resolve on-chain if confidence >= 70, else flag for manual review
 *  4. Append every decision to oracle/decisions.json for audit trail
 *  5. Optionally notify a Discord webhook for low-confidence disputes
 *
 * To add a new chain: add an entry to chains.json — no code changes needed.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// Support ENV_FILE env var for running multiple oracle instances with different configs
// e.g. ENV_FILE=.env.base pm2 start oracle-base
{
  const _dir = path.dirname(fileURLToPath(import.meta.url));
  const envFile = process.env.ENV_FILE ?? ".env";
  dotenv.config({ path: path.resolve(_dir, envFile), override: true });
}
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { notifyParties, startTelegramBot } from "./notify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── ABIs (imported from JSON — single source of truth) ──────────────────────

const { default: SimpleEscrowABI }    = await import("./abis/SimpleEscrow.json",    { with: { type: "json" } });
const { default: MilestoneEscrowABI } = await import("./abis/MilestoneEscrow.json", { with: { type: "json" } });
const { default: AIArbiterABI }       = await import("./abis/AIArbiter.json",       { with: { type: "json" } });

// ─── Chain config (from chains.json or CHAINS_FILE env var) ──────────────────
// Use CHAINS_FILE=chains.base.json to run a Base-specific oracle instance.

const chainsFile = process.env.CHAINS_FILE ?? "chains.json";
const chainsRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, chainsFile), "utf8")
);

/**
 * Resolve a chain entry from chains.json into a runtime config object.
 * Env vars override the fallback values from the JSON file.
 */
function resolveChainConfig(raw) {
  return {
    chainId:         raw.chainId,
    name:            raw.name,
    nativeCurrency:  raw.nativeCurrency,
    rpcUrl:          process.env[raw.rpcUrlEnvVar]          ?? raw.rpcUrlFallback,
    factoryAddress:  process.env[raw.factoryAddressEnvVar]  ?? raw.factoryAddressFallback,
    arbiterAddress:  process.env[raw.arbiterAddressEnvVar]  ?? raw.arbiterAddressFallback,
  };
}

const CHAINS = chainsRaw.map(resolveChainConfig);

// ─── Global config ────────────────────────────────────────────────────────────

const PRIVATE_KEY              = process.env.ORACLE_PRIVATE_KEY;
const ANTHROPIC_KEY            = process.env.ANTHROPIC_API_KEY;
const DISCORD_WEBHOOK          = process.env.DISCORD_WEBHOOK_URL ?? null;
const POLL_INTERVAL_MS         = parseInt(process.env.POLL_INTERVAL_MS ?? "30000");
const AUTO_RESOLVE_MIN_CONFIDENCE = 70;
const DECISIONS_FILE           = path.join(__dirname, "decisions.json");

if (!PRIVATE_KEY || !ANTHROPIC_KEY) {
  console.error("❌ Missing required env vars: ORACLE_PRIVATE_KEY, ANTHROPIC_API_KEY");
  process.exit(1);
}

const account    = privateKeyToAccount(PRIVATE_KEY);
const anthropic  = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ─── Utility: human-readable elapsed time ────────────────────────────────────

function humanElapsed(ms) {
  if (ms < 0) return "unknown";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  const parts   = [];
  if (days    > 0) parts.push(`${days} day${days    !== 1 ? "s" : ""}`);
  if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? "s" : ""}`);
  if (minutes % 60 > 0 && days === 0) parts.push(`${minutes % 60} min`);
  return parts.length > 0 ? parts.join(" ") : "less than 1 minute";
}

// ─── Utility: append to decisions.json ───────────────────────────────────────

function appendDecision(entry) {
  try {
    let records = [];
    if (fs.existsSync(DECISIONS_FILE)) {
      const raw = fs.readFileSync(DECISIONS_FILE, "utf8").trim();
      if (raw) records = JSON.parse(raw);
    }
    records.push(entry);
    fs.writeFileSync(DECISIONS_FILE, JSON.stringify(records, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Failed to write decisions.json:", err.message);
  }
}

// ─── Utility: Discord notification ───────────────────────────────────────────

async function notifyDiscord(disputeContext, decision, urgency) {
  if (!DISCORD_WEBHOOK) return;
  try {
    const color = urgency === "HIGH_RISK" ? 0xff2222 : 0xffaa00;
    const label = urgency === "HIGH_RISK"
      ? "🚨 HIGH RISK — MANUAL REVIEW URGENT"
      : "⚠️  Manual Review Needed";

    const body = {
      embeds: [{
        title: label,
        color,
        fields: [
          { name: "Chain",          value: `${disputeContext.chainName} (${disputeContext.chainId})`, inline: true  },
          { name: "Type",           value: disputeContext.escrowType,                                  inline: true  },
          { name: "Amount",         value: `${disputeContext.amount} ${disputeContext.nativeSymbol}`,  inline: true  },
          { name: "Contract",       value: `\`${disputeContext.contractAddress}\``,                    inline: false },
          { name: "Depositor",      value: `\`${disputeContext.depositor.address}\``,                  inline: false },
          { name: "Beneficiary",    value: `\`${disputeContext.beneficiary.address}\``,                inline: false },
          { name: "Dispute Raised", value: disputeContext.disputeRaisedAt,                             inline: true  },
          { name: "Elapsed",        value: disputeContext.timeElapsedSinceDeposit,                     inline: true  },
          ...(disputeContext.milestoneIndex !== null
            ? [{ name: "Milestone", value: `#${disputeContext.milestoneIndex} of ${disputeContext.totalMilestones}`, inline: true }]
            : []),
          { name: "AI Confidence",  value: `${decision.confidence}/100`,  inline: true  },
          { name: "AI Ruling",      value: decision.ruling,                inline: true  },
          { name: "AI Reasoning",   value: decision.reasoning ?? "N/A",    inline: false },
        ],
        footer: { text: "EscrowHubs AI Arbiter Oracle" },
        timestamp: new Date().toISOString(),
      }],
    };

    const res = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error(`❌ Discord webhook failed: ${res.status}`);
    else console.log(`📣 Discord notification sent (${urgency})`);
  } catch (err) {
    console.error("❌ Discord notification error:", err.message);
  }
}

// ─── AI: structured decision ─────────────────────────────────────────────────

async function callAI(disputeContext, evidence) {
  const evidenceText = evidence.length > 0
    ? evidence.map((e, i) => [
        `Evidence #${i + 1}`,
        `  Submitter: ${e.submitter}`,
        `  Submitted: ${new Date(Number(e.submittedAt) * 1000).toISOString()}`,
        `  Content:   ${e.uri}`,
      ].join("\n")).join("\n\n")
    : "No evidence submitted by either party.";

  const milestoneSection = disputeContext.escrowType === "milestone"
    ? `
MILESTONE INFO:
- Disputed milestone index: #${disputeContext.milestoneIndex}
- Total milestones: ${disputeContext.totalMilestones}
- Already completed/released: ${disputeContext.completedMilestones}
- Remaining (incl. disputed): ${disputeContext.totalMilestones - disputeContext.completedMilestones}
${disputeContext.milestoneDescription ? `- Milestone description: "${disputeContext.milestoneDescription}"` : ""}
${disputeContext.milestoneAmount ? `- Milestone amount: ${disputeContext.milestoneAmount} ${disputeContext.nativeSymbol}` : ""}
`
    : "";

  const prompt = `You are an impartial AI arbiter for a blockchain escrow smart contract. Analyze this dispute and return a structured JSON decision.

DISPUTE CONTEXT:
- Escrow type: ${disputeContext.escrowType}
- Chain: ${disputeContext.chainName} (ID: ${disputeContext.chainId})
- Contract: ${disputeContext.contractAddress}
- Depositor (buyer): ${disputeContext.depositor.address}
- Beneficiary (seller): ${disputeContext.beneficiary.address}
- Amount locked: ${disputeContext.amount} ${disputeContext.nativeSymbol}
- Dispute raised by: ${disputeContext.disputeRaisedBy}
- Dispute raised at: ${disputeContext.disputeRaisedAt}
- Time since deposit: ${disputeContext.timeElapsedSinceDeposit}
${milestoneSection}
EVIDENCE:
${evidenceText}

INSTRUCTIONS:
Analyze the evidence and context carefully. Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation outside the JSON:

{
  "ruling": "depositor" or "beneficiary",
  "splitPercentage": null,
  "confidence": <integer 0-100>,
  "reasoning": "<2-4 sentences explaining your ruling based on the evidence>",
  "factors": [
    { "factor": "<observation>", "weight": "high" or "medium" or "low", "favoredParty": "depositor" or "beneficiary" }
  ],
  "escalateToManual": <true if confidence < 70 or evidence is insufficient, else false>
}

Rules:
- "ruling" must be "depositor" (refund) or "beneficiary" (release)
- "confidence" reflects how certain you are given the available evidence
- If no evidence: confidence should be 50 or below, default ruling "depositor", escalateToManual true
- "factors" should list 2-5 key observations from the evidence
- Be explicit: if evidence is missing, say so in reasoning`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0].text.trim();

  try {
    const decision = JSON.parse(raw);
    decision._onChainRuling = decision.ruling === "beneficiary" ? "RELEASE" : "REFUND";
    return decision;
  } catch {
    console.error("❌ AI returned non-JSON response:", raw);
    return {
      ruling: "depositor",
      _onChainRuling: "REFUND",
      splitPercentage: null,
      confidence: 0,
      reasoning: "AI response could not be parsed. Defaulting to refund for depositor safety.",
      factors: [{ factor: "Unparseable AI response", weight: "high", favoredParty: "depositor" }],
      escalateToManual: true,
      _rawAiResponse: raw,
    };
  }
}

// ─── Confidence-based routing ─────────────────────────────────────────────────

function shouldAutoResolve(decision) {
  return decision.confidence >= AUTO_RESOLVE_MIN_CONFIDENCE && !decision.escalateToManual;
}

function logDecisionSummary(tag, decision) {
  const conf    = decision.confidence;
  const urgency = conf < 40 ? "HIGH_RISK" : conf < AUTO_RESOLVE_MIN_CONFIDENCE ? "MANUAL" : "AUTO";
  const badge   = urgency === "HIGH_RISK"
    ? "🚨 [HIGH RISK - MANUAL REVIEW URGENT]"
    : urgency === "MANUAL"
    ? "⚠️  [MANUAL REVIEW NEEDED]"
    : "✅ [AUTO-RESOLVE]";

  console.log(`${badge} ${tag} | Ruling: ${decision._onChainRuling} | Confidence: ${conf}/100`);
  console.log(`   Reasoning: ${decision.reasoning}`);
  if (decision.factors?.length) {
    decision.factors.forEach(f =>
      console.log(`   Factor [${f.weight}]: ${f.factor} → favors ${f.favoredParty}`)
    );
  }
  return urgency;
}

// ─── Per-chain listener ───────────────────────────────────────────────────────

function startChainListener(chainConfig) {
  const { chainId, name, rpcUrl, factoryAddress, arbiterAddress, nativeCurrency } = chainConfig;
  const tag = `[${name}/${chainId}]`;

  // Build viem chain descriptor
  const viemChain = {
    id: chainId,
    name,
    nativeCurrency: nativeCurrency ?? { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  };

  const publicClient = createPublicClient({ chain: viemChain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: viemChain, transport: http(rpcUrl) });

  // Scoped processed-key set (chain-specific to avoid cross-chain collisions)
  const processed = new Set();

  // ── Evidence fetch ──────────────────────────────────────────────────────────

  async function fetchEvidence(escrowAddress) {
    try {
      return await publicClient.readContract({
        address: arbiterAddress,
        abi: AIArbiterABI,
        functionName: "getAllEvidence",
        args: [escrowAddress],
      });
    } catch {
      return [];
    }
  }

  // ── Deploy timestamp ────────────────────────────────────────────────────────

  async function getContractDeployTimestamp(address) {
    try {
      const code = await publicClient.getCode({ address });
      if (!code || code === "0x") return null;
      const block = await publicClient.getBlock({ blockTag: "latest" });
      return Number(block.timestamp);
    } catch {
      return null;
    }
  }

  // ── Resolution executors ────────────────────────────────────────────────────

  async function executeSimpleResolution(escrowAddress, ruling) {
    const functionName = ruling === "RELEASE" ? "resolveRelease" : "resolveRefund";
    const hash = await walletClient.writeContract({
      address: arbiterAddress,
      abi: AIArbiterABI,
      functionName,
      args: [escrowAddress],
    });
    console.log(`✅ ${tag} [SIMPLE] Resolution tx: ${hash}`);
    return hash;
  }

  async function executeMilestoneResolution(escrowAddress, milestoneIndex, ruling) {
    const functionName = ruling === "RELEASE" ? "resolveMilestoneRelease" : "resolveMilestoneRefund";
    const hash = await walletClient.writeContract({
      address: arbiterAddress,
      abi: AIArbiterABI,
      functionName,
      args: [escrowAddress, BigInt(milestoneIndex)],
    });
    console.log(`✅ ${tag} [MILESTONE] Resolution tx: ${hash}`);
    return hash;
  }

  // ── Milestone details fetcher ───────────────────────────────────────────────

  async function fetchMilestoneDetails(escrowAddress, milestoneIndex) {
    const count = await publicClient.readContract({
      address: escrowAddress,
      abi: MilestoneEscrowABI,
      functionName: "milestoneCount",
    });
    const indices = Array.from({ length: Number(count) }, (_, i) => BigInt(i));
    const allRaw  = await Promise.all(
      indices.map(i =>
        publicClient.readContract({
          address: escrowAddress,
          abi: MilestoneEscrowABI,
          functionName: "milestones",
          args: [i],
        })
      )
    );
    const STATE_LABELS = ["PENDING", "RELEASED", "DISPUTED", "REFUNDED"];
    const parsed = allRaw.map((m, i) => ({
      index: i,
      description: m[0],
      amount: m[1],
      state: Number(m[2]),
      stateLabel: STATE_LABELS[Number(m[2])] ?? "UNKNOWN",
    }));
    const disputed = parsed[Number(milestoneIndex)];
    const released = parsed.filter(m => m.state === 1).length;
    return { milestones: parsed, disputed, released, total: parsed.length };
  }

  // ── Simple escrow dispute handler ──────────────────────────────────────────

  async function handleDispute(escrowAddress, disputeRaisedByAddr) {
    if (processed.has(escrowAddress)) return;
    const detectedAt = new Date().toISOString();
    console.log(`\n🔔 ${tag} [SIMPLE] Dispute detected: ${escrowAddress} at ${detectedAt}`);

    try {
      console.log(`⏳ ${tag} [SIMPLE] Waiting 60s for evidence submissions...`);
      await new Promise(r => setTimeout(r, 60_000));

      const [[depositor, beneficiary, amount, state], evidence, deployTs] = await Promise.all([
        Promise.all([
          publicClient.readContract({ address: escrowAddress, abi: SimpleEscrowABI, functionName: "depositor" }),
          publicClient.readContract({ address: escrowAddress, abi: SimpleEscrowABI, functionName: "beneficiary" }),
          publicClient.readContract({ address: escrowAddress, abi: SimpleEscrowABI, functionName: "amount" }),
          publicClient.readContract({ address: escrowAddress, abi: SimpleEscrowABI, functionName: "state" }),
        ]),
        fetchEvidence(escrowAddress),
        getContractDeployTimestamp(escrowAddress),
      ]);

      if (Number(state) !== 3) {
        console.log(`ℹ️  ${tag} [SIMPLE] ${escrowAddress} no longer disputed, skipping.`);
        processed.add(escrowAddress);
        return;
      }

      const nowMs    = Date.now();
      const deployMs = deployTs ? deployTs * 1000 : nowMs;
      const raisedBy = disputeRaisedByAddr?.toLowerCase() === depositor?.toLowerCase()
        ? "depositor" : "beneficiary";

      const disputeContext = {
        escrowType:              "simple",
        contractAddress:         escrowAddress,
        chainId,
        chainName:               name,
        nativeSymbol:            nativeCurrency?.symbol ?? "ETH",
        createdAt:               deployTs ? new Date(deployMs).toISOString() : null,
        disputeRaisedAt:         detectedAt,
        depositor:               { address: depositor },
        beneficiary:             { address: beneficiary },
        amount:                  formatEther(amount),
        milestoneIndex:          null,
        totalMilestones:         null,
        completedMilestones:     null,
        milestoneDescription:    null,
        milestoneAmount:         null,
        depositTxHash:           null,
        timeElapsedSinceDeposit: humanElapsed(nowMs - deployMs),
        disputeReason:           "Dispute raised on SimpleEscrow",
        disputeRaisedBy:         raisedBy,
      };

      console.log(`📋 ${tag} [SIMPLE] Evidence: ${evidence.length} | Depositor: ${depositor} | Amount: ${formatEther(amount)} ${nativeCurrency?.symbol}`);
      console.log(`🤖 ${tag} [SIMPLE] Consulting AI...`);

      const decision = await callAI(disputeContext, evidence);
      const urgency  = logDecisionSummary(`${tag} [SIMPLE]`, decision);

      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeSimpleResolution(escrowAddress, decision._onChainRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "simple", disputeContext, decision, txHash });
      processed.add(escrowAddress);

      // ── Notify parties ──
      const eventData = { amount: disputeContext.amount, symbol: nativeCurrency?.symbol ?? "BDAG", chainId };
      notifyParties(escrowAddress, "dispute_opened",   eventData, [depositor, beneficiary]);
      if (txHash !== "pending_manual_review") {
        notifyParties(escrowAddress, "dispute_resolved", { ...eventData, ruling: decision._onChainRuling }, [depositor, beneficiary]);
      }

    } catch (err) {
      console.error(`❌ ${tag} [SIMPLE] Error for ${escrowAddress}:`, err.message);
    }
  }

  // ── Milestone escrow dispute handler ───────────────────────────────────────

  async function handleMilestoneDispute(escrowAddress, milestoneIndex) {
    const disputeKey = `${escrowAddress}:${milestoneIndex}`;
    if (processed.has(disputeKey)) return;
    const detectedAt = new Date().toISOString();
    console.log(`\n🔔 ${tag} [MILESTONE] Dispute: ${escrowAddress} milestone #${milestoneIndex} at ${detectedAt}`);

    try {
      console.log(`⏳ ${tag} [MILESTONE] Waiting 60s for evidence submissions...`);
      await new Promise(r => setTimeout(r, 60_000));

      const [[depositor, beneficiary, totalDeposited], milestoneDetails, evidence, deployTs] = await Promise.all([
        Promise.all([
          publicClient.readContract({ address: escrowAddress, abi: MilestoneEscrowABI, functionName: "depositor" }),
          publicClient.readContract({ address: escrowAddress, abi: MilestoneEscrowABI, functionName: "beneficiary" }),
          publicClient.readContract({ address: escrowAddress, abi: MilestoneEscrowABI, functionName: "totalDeposited" }),
        ]),
        fetchMilestoneDetails(escrowAddress, milestoneIndex),
        fetchEvidence(escrowAddress),
        getContractDeployTimestamp(escrowAddress),
      ]);

      const { disputed, released, total } = milestoneDetails;
      if (disputed.state !== 2) {
        console.log(`ℹ️  ${tag} [MILESTONE] Milestone #${milestoneIndex} on ${escrowAddress} no longer disputed, skipping.`);
        processed.add(disputeKey);
        return;
      }

      const nowMs    = Date.now();
      const deployMs = deployTs ? deployTs * 1000 : nowMs;

      const disputeContext = {
        escrowType:              "milestone",
        contractAddress:         escrowAddress,
        chainId,
        chainName:               name,
        nativeSymbol:            nativeCurrency?.symbol ?? "ETH",
        createdAt:               deployTs ? new Date(deployMs).toISOString() : null,
        disputeRaisedAt:         detectedAt,
        depositor:               { address: depositor },
        beneficiary:             { address: beneficiary },
        amount:                  formatEther(totalDeposited),
        milestoneIndex,
        totalMilestones:         total,
        completedMilestones:     released,
        milestoneDescription:    disputed.description,
        milestoneAmount:         formatEther(disputed.amount),
        depositTxHash:           null,
        timeElapsedSinceDeposit: humanElapsed(nowMs - deployMs),
        disputeReason:           `MilestoneDisputed #${milestoneIndex}: "${disputed.description}"`,
        disputeRaisedBy:         "depositor",
      };

      console.log(`📋 ${tag} [MILESTONE] Evidence: ${evidence.length} | #${milestoneIndex} "${disputed.description}" — ${formatEther(disputed.amount)} ${nativeCurrency?.symbol}`);
      console.log(`   Progress: ${released}/${total} released | Depositor: ${depositor}`);
      console.log(`🤖 ${tag} [MILESTONE] Consulting AI...`);

      const decision = await callAI(disputeContext, evidence);
      const urgency  = logDecisionSummary(`${tag} [MILESTONE]`, decision);

      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeMilestoneResolution(escrowAddress, milestoneIndex, decision._onChainRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "milestone", milestoneIndex, disputeContext, decision, txHash });
      processed.add(disputeKey);

      // ── Notify parties ──
      const eventData = {
        amount: formatEther(disputed.amount), symbol: nativeCurrency?.symbol ?? "BDAG",
        chainId, milestoneIndex, milestoneDescription: disputed.description,
      };
      notifyParties(escrowAddress, "dispute_opened",   eventData, [depositor, beneficiary]);
      if (txHash !== "pending_manual_review") {
        notifyParties(escrowAddress, "dispute_resolved", { ...eventData, ruling: decision._onChainRuling }, [depositor, beneficiary]);
      }

    } catch (err) {
      console.error(`❌ ${tag} [MILESTONE] Error for ${escrowAddress} #${milestoneIndex}:`, err.message);
    }
  }

  // ── Polling loop for this chain ─────────────────────────────────────────────

  let lastBlock = 0n;

  async function poll() {
    try {
      const currentBlock = await publicClient.getBlockNumber();
      if (lastBlock === 0n) lastBlock = currentBlock - 100n;
      if (currentBlock <= lastBlock) return;

      const fromBlock = lastBlock + 1n;
      const toBlock   = currentBlock;

      // SimpleEscrow Disputed events
      const simpleLogs = await publicClient.getLogs({
        fromBlock, toBlock,
        event: parseAbiItem("event Disputed(address indexed by)"),
      });
      for (const log of simpleLogs) {
        try {
          const arbiter = await publicClient.readContract({
            address: log.address,
            abi: [{ type: "function", name: "arbiter", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" }],
            functionName: "arbiter",
          });
          if (arbiter.toLowerCase() === arbiterAddress.toLowerCase()) {
            console.log(`${tag} [SIMPLE] Dispute event from ${log.address} by ${log.args.by}`);
            handleDispute(log.address, log.args.by);
          }
        } catch { /* not a compatible escrow */ }
      }

      // MilestoneEscrow MilestoneDisputed events
      const milestoneLogs = await publicClient.getLogs({
        fromBlock, toBlock,
        event: parseAbiItem("event MilestoneDisputed(uint256 indexed index)"),
      });
      for (const log of milestoneLogs) {
        try {
          const arbiter = await publicClient.readContract({
            address: log.address,
            abi: [{ type: "function", name: "arbiter", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" }],
            functionName: "arbiter",
          });
          if (arbiter.toLowerCase() === arbiterAddress.toLowerCase()) {
            const idx = Number(log.args.index);
            console.log(`${tag} [MILESTONE] Dispute event from ${log.address}, milestone #${idx}`);
            handleMilestoneDispute(log.address, idx);
          }
        } catch { /* not a compatible escrow */ }
      }

      // ── Additional escrow lifecycle events for notifications ────────────────

      // Factory: SimpleEscrowCreated — notify beneficiary
      try {
        const createdLogs = await publicClient.getLogs({
          fromBlock, toBlock,
          address: factoryAddress,
          event: parseAbiItem("event SimpleEscrowCreated(address indexed contractAddress, address indexed depositor, address indexed beneficiary, address arbiter, uint256 amount, uint8 trustTier)"),
        });
        for (const log of createdLogs) {
          const sym = nativeCurrency?.symbol ?? "BDAG";
          notifyParties(log.args.contractAddress, "escrow_created",
            { amount: formatEther(log.args.amount ?? 0n), symbol: sym, chainId },
            [log.args.beneficiary]
          );
        }
      } catch { /* non-fatal */ }

      // SimpleEscrow Deposited — notify both parties
      try {
        const depositedLogs = await publicClient.getLogs({
          fromBlock, toBlock,
          event: parseAbiItem("event Deposited(address indexed depositor, uint256 amount)"),
        });
        for (const log of depositedLogs) {
          const escrow = log.address;
          try {
            const [dep, ben] = await Promise.all([
              publicClient.readContract({ address: escrow, abi: SimpleEscrowABI, functionName: "depositor" }),
              publicClient.readContract({ address: escrow, abi: SimpleEscrowABI, functionName: "beneficiary" }),
            ]);
            notifyParties(escrow, "escrow_funded",
              { amount: formatEther(log.args.amount ?? 0n), symbol: nativeCurrency?.symbol ?? "BDAG", chainId },
              [dep, ben]
            );
          } catch { /* not a compatible escrow */ }
        }
      } catch { /* non-fatal */ }

      // SimpleEscrow Released — notify beneficiary
      try {
        const releasedLogs = await publicClient.getLogs({
          fromBlock, toBlock,
          event: parseAbiItem("event Released(address indexed to, uint256 amount)"),
        });
        for (const log of releasedLogs) {
          notifyParties(log.address, "funds_released",
            { amount: formatEther(log.args.amount ?? 0n), symbol: nativeCurrency?.symbol ?? "BDAG", chainId },
            [log.args.to]
          );
        }
      } catch { /* non-fatal */ }

      // MilestoneEscrow MilestoneReleased — notify both parties
      try {
        const msReleasedLogs = await publicClient.getLogs({
          fromBlock, toBlock,
          event: parseAbiItem("event MilestoneReleased(uint256 indexed index, uint256 amount)"),
        });
        for (const log of msReleasedLogs) {
          const escrow = log.address;
          try {
            const [dep, ben] = await Promise.all([
              publicClient.readContract({ address: escrow, abi: MilestoneEscrowABI, functionName: "depositor" }),
              publicClient.readContract({ address: escrow, abi: MilestoneEscrowABI, functionName: "beneficiary" }),
            ]);
            notifyParties(escrow, "milestone_completed",
              { amount: formatEther(log.args.amount ?? 0n), symbol: nativeCurrency?.symbol ?? "BDAG", chainId, milestoneIndex: Number(log.args.index) },
              [dep, ben]
            );
          } catch { /* not a compatible escrow */ }
        }
      } catch { /* non-fatal */ }

      lastBlock = currentBlock;

    } catch (err) {
      // Log and continue — one chain's RPC failure must not crash other listeners
      console.error(`❌ ${tag} Poll error: ${err.message}`);
    }
  }

  // Start polling for this chain
  poll();
  const interval = setInterval(poll, POLL_INTERVAL_MS);

  console.log(`🔭 ${tag} Listening for disputes on chain ${chainId} | Arbiter: ${arbiterAddress}`);

  return { chainId, name, interval };
}

// ─── Start ────────────────────────────────────────────────────────────────────

// Ensure decisions.json exists
if (!fs.existsSync(DECISIONS_FILE)) {
  fs.writeFileSync(DECISIONS_FILE, "[]", "utf8");
  console.log(`📂 Created decisions.json at ${DECISIONS_FILE}`);
}

console.log("🤖 AI Arbiter Oracle starting...");
console.log(`👛 Oracle wallet:  ${account.address}`);
console.log(`⏱️  Poll interval:  ${POLL_INTERVAL_MS / 1000}s`);
console.log(`🎯 Auto-resolve:   confidence >= ${AUTO_RESOLVE_MIN_CONFIDENCE}`);
console.log(`📝 Decisions log:  ${DECISIONS_FILE}`);
console.log(`📣 Discord:        ${DISCORD_WEBHOOK ? "configured" : "not configured"}`);
console.log(`⛓️  Chains:         ${CHAINS.length} configured`);
console.log("");

for (const chain of CHAINS) {
  try {
    startChainListener(chain);
    console.log(`[${chain.name}] Oracle listening on chain ${chain.chainId}`);
  } catch (err) {
    console.error(`❌ Failed to start listener for chain ${chain.chainId} (${chain.name}): ${err.message}`);
    // Continue starting other chains
  }
}

// Start Telegram bot long-poll loop (runs alongside chain listeners)
startTelegramBot();

// Graceful shutdown
process.on("SIGTERM", () => { console.log("Oracle shutting down…"); process.exit(0); });
process.on("SIGINT",  () => { console.log("Oracle shutting down…"); process.exit(0); });
