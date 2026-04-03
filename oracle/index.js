/**
 * AI Arbiter Oracle Service
 *
 * Watches for Disputed events on SimpleEscrow contracts and MilestoneDisputed
 * events on MilestoneEscrow contracts whose arbiter is the AIArbiter contract.
 *
 * For each dispute:
 *  1. Build a structured DisputeContext from on-chain data
 *  2. Ask Claude for a structured JSON Decision (ruling + confidence + reasoning)
 *  3. Auto-resolve on-chain if confidence >= 70, else flag for manual review
 *  4. Append every decision to oracle/decisions.json for audit trail
 *  5. Optionally notify a Discord webhook for low-confidence disputes
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const RPC_URL            = process.env.BLOCKDAG_RPC_URL    ?? "https://rpc.bdagscan.com";
const PRIVATE_KEY        = process.env.ORACLE_PRIVATE_KEY;
const AI_ARBITER_ADDR    = process.env.AI_ARBITER_ADDRESS;
const ANTHROPIC_KEY      = process.env.ANTHROPIC_API_KEY;
const DISCORD_WEBHOOK    = process.env.DISCORD_WEBHOOK_URL ?? null;
const POLL_INTERVAL_MS   = parseInt(process.env.POLL_INTERVAL_MS ?? "30000");
const AUTO_RESOLVE_MIN_CONFIDENCE = 70; // below this → manual review
const DECISIONS_FILE     = path.join(__dirname, "decisions.json");

if (!PRIVATE_KEY || !AI_ARBITER_ADDR || !ANTHROPIC_KEY) {
  console.error("❌ Missing required env vars: ORACLE_PRIVATE_KEY, AI_ARBITER_ADDRESS, ANTHROPIC_API_KEY");
  process.exit(1);
}

// ─── Chain ───────────────────────────────────────────────────────────────────

const blockdag = {
  id: 1404,
  name: "BlockDAG",
  nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
};

// ─── Clients ─────────────────────────────────────────────────────────────────

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: blockdag,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: blockdag,
  transport: http(RPC_URL),
});

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ─── ABIs ────────────────────────────────────────────────────────────────────
// Inlined for oracle self-containment. Canonical source: contracts/contracts/*.sol
// If ABIs change, update both here and in frontend/src/lib/contracts.ts

const AI_ARBITER_ABI = [
  { type: "function", name: "resolveRelease",          inputs: [{ name: "escrowAddress", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRefund",           inputs: [{ name: "escrowAddress", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveMilestoneRelease", inputs: [{ name: "escrowAddress", type: "address" }, { name: "milestoneIndex", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveMilestoneRefund",  inputs: [{ name: "escrowAddress", type: "address" }, { name: "milestoneIndex", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getEvidenceCount",        inputs: [{ name: "escrowAddress", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getAllEvidence",          inputs: [{ name: "escrowAddress", type: "address" }], outputs: [{ type: "tuple[]", components: [{ name: "submitter", type: "address" }, { name: "uri", type: "string" }, { name: "submittedAt", type: "uint256" }] }], stateMutability: "view" },
  { type: "event",    name: "EvidenceSubmitted",       inputs: [{ name: "escrow", type: "address", indexed: true }, { name: "submitter", type: "address", indexed: true }, { name: "evidenceURI", type: "string", indexed: false }] },
];

const SIMPLE_ESCROW_ABI = [
  { type: "function", name: "depositor",   inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "beneficiary", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "amount",      inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "state",       inputs: [], outputs: [{ type: "uint8"  }], stateMutability: "view" },
  { type: "event",    name: "Disputed",    inputs: [{ name: "by", type: "address", indexed: true }] },
];

const MILESTONE_ESCROW_ABI = [
  { type: "function", name: "depositor",      inputs: [],                                   outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "beneficiary",    inputs: [],                                   outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "arbiter",        inputs: [],                                   outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalDeposited", inputs: [],                                   outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "funded",         inputs: [],                                   outputs: [{ type: "bool"    }], stateMutability: "view" },
  { type: "function", name: "milestoneCount", inputs: [],                                   outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "milestones",     inputs: [{ name: "index", type: "uint256" }], outputs: [{ type: "string" }, { type: "uint256" }, { type: "uint8" }], stateMutability: "view" },
  { type: "event",    name: "MilestoneDisputed", inputs: [{ name: "index", type: "uint256", indexed: true }] },
];

// ─── State ───────────────────────────────────────────────────────────────────

// Track disputes already processed to avoid double-resolution
const processed = new Set();

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

// ─── Utility: get deploy block timestamp for a contract ──────────────────────

async function getContractDeployTimestamp(address) {
  try {
    // Binary-search isn't feasible here; use the earliest known block heuristic:
    // get the first non-zero code block by fetching current block and stepping back
    const code = await publicClient.getCode({ address });
    if (!code || code === "0x") return null;
    // Fall back to current block timestamp as "unknown deploy time"
    const block = await publicClient.getBlock({ blockTag: "latest" });
    return Number(block.timestamp);
  } catch {
    return null;
  }
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
        title: `${label}`,
        color,
        fields: [
          { name: "Contract",       value: `\`${disputeContext.contractAddress}\``,          inline: false },
          { name: "Type",           value: disputeContext.escrowType,                         inline: true  },
          { name: "Chain ID",       value: String(disputeContext.chainId),                   inline: true  },
          { name: "Amount",         value: `${disputeContext.amount} BDAG`,                  inline: true  },
          { name: "Depositor",      value: `\`${disputeContext.depositor.address}\``,        inline: false },
          { name: "Beneficiary",    value: `\`${disputeContext.beneficiary.address}\``,      inline: false },
          { name: "Dispute Raised", value: disputeContext.disputeRaisedAt,                   inline: true  },
          { name: "Elapsed",        value: disputeContext.timeElapsedSinceDeposit,            inline: true  },
          ...(disputeContext.milestoneIndex !== null
            ? [{ name: "Milestone", value: `#${disputeContext.milestoneIndex} of ${disputeContext.totalMilestones}`, inline: true }]
            : []),
          { name: "AI Confidence",  value: `${decision.confidence}/100`,                    inline: true  },
          { name: "AI Ruling",      value: decision.ruling,                                  inline: true  },
          { name: "AI Reasoning",   value: decision.reasoning ?? "N/A",                      inline: false },
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

// ─── Utility: fetch evidence ─────────────────────────────────────────────────

async function fetchEvidence(escrowAddress) {
  try {
    return await publicClient.readContract({
      address: AI_ARBITER_ADDR,
      abi: AI_ARBITER_ABI,
      functionName: "getAllEvidence",
      args: [escrowAddress],
    });
  } catch {
    return [];
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
${disputeContext.milestoneAmount ? `- Milestone amount: ${disputeContext.milestoneAmount} BDAG` : ""}
`
    : "";

  const prompt = `You are an impartial AI arbiter for a blockchain escrow smart contract. Analyze this dispute and return a structured JSON decision.

DISPUTE CONTEXT:
- Escrow type: ${disputeContext.escrowType}
- Contract: ${disputeContext.contractAddress}
- Chain ID: ${disputeContext.chainId}
- Depositor (buyer): ${disputeContext.depositor.address}
- Beneficiary (seller): ${disputeContext.beneficiary.address}
- Amount locked: ${disputeContext.amount} BDAG
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
    // Normalise ruling to uppercase RELEASE/REFUND for on-chain use
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

function logDecisionSummary(prefix, decision, disputeContext) {
  const conf = decision.confidence;
  const urgency = conf < 40 ? "HIGH_RISK" : conf < AUTO_RESOLVE_MIN_CONFIDENCE ? "MANUAL" : "AUTO";
  const badge = urgency === "HIGH_RISK"
    ? "🚨 [HIGH RISK - MANUAL REVIEW URGENT]"
    : urgency === "MANUAL"
    ? "⚠️  [MANUAL REVIEW NEEDED]"
    : "✅ [AUTO-RESOLVE]";

  console.log(`${badge} ${prefix} | Ruling: ${decision._onChainRuling} | Confidence: ${conf}/100`);
  console.log(`   Reasoning: ${decision.reasoning}`);
  if (decision.factors?.length) {
    decision.factors.forEach(f =>
      console.log(`   Factor [${f.weight}]: ${f.factor} → favors ${f.favoredParty}`)
    );
  }
  return urgency;
}

// ─── On-chain execution ───────────────────────────────────────────────────────

async function executeSimpleResolution(escrowAddress, ruling) {
  const functionName = ruling === "RELEASE" ? "resolveRelease" : "resolveRefund";
  const hash = await walletClient.writeContract({
    address: AI_ARBITER_ADDR,
    abi: AI_ARBITER_ABI,
    functionName,
    args: [escrowAddress],
  });
  console.log(`✅ [SIMPLE] Resolution tx: ${hash}`);
  return hash;
}

async function executeMilestoneResolution(escrowAddress, milestoneIndex, ruling) {
  const functionName = ruling === "RELEASE" ? "resolveMilestoneRelease" : "resolveMilestoneRefund";
  const hash = await walletClient.writeContract({
    address: AI_ARBITER_ADDR,
    abi: AI_ARBITER_ABI,
    functionName,
    args: [escrowAddress, BigInt(milestoneIndex)],
  });
  console.log(`✅ [MILESTONE] Resolution tx: ${hash}`);
  return hash;
}

// ─── Milestone data fetcher ───────────────────────────────────────────────────

async function fetchMilestoneDetails(escrowAddress, milestoneIndex) {
  const count = await publicClient.readContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "milestoneCount",
  });

  const indices = Array.from({ length: Number(count) }, (_, i) => BigInt(i));
  const allRaw  = await Promise.all(
    indices.map(i =>
      publicClient.readContract({
        address: escrowAddress,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "milestones",
        args: [i],
      })
    )
  );

  // MilestoneState: 0=PENDING, 1=RELEASED, 2=DISPUTED, 3=REFUNDED
  const STATE_LABELS = ["PENDING", "RELEASED", "DISPUTED", "REFUNDED"];
  const parsed = allRaw.map((m, i) => ({
    index: i,
    description: m[0],
    amount: m[1],
    state: Number(m[2]),
    stateLabel: STATE_LABELS[Number(m[2])] ?? "UNKNOWN",
  }));

  const disputed  = parsed[Number(milestoneIndex)];
  const released  = parsed.filter(m => m.state === 1).length;

  return { milestones: parsed, disputed, released, total: parsed.length };
}

// ─── Main dispute handler ─────────────────────────────────────────────────────

async function handleDispute(escrowAddress, disputeRaisedBy) {
  if (processed.has(escrowAddress)) return;

  const detectedAt = new Date().toISOString();
  console.log(`\n🔔 [SIMPLE] Dispute detected: ${escrowAddress} at ${detectedAt}`);

  try {
    console.log(`⏳ [SIMPLE] Waiting 60s for evidence submissions...`);
    await new Promise(r => setTimeout(r, 60_000));

    const [[depositor, beneficiary, amount, state], evidence, deployTs] = await Promise.all([
      Promise.all([
        publicClient.readContract({ address: escrowAddress, abi: SIMPLE_ESCROW_ABI, functionName: "depositor" }),
        publicClient.readContract({ address: escrowAddress, abi: SIMPLE_ESCROW_ABI, functionName: "beneficiary" }),
        publicClient.readContract({ address: escrowAddress, abi: SIMPLE_ESCROW_ABI, functionName: "amount" }),
        publicClient.readContract({ address: escrowAddress, abi: SIMPLE_ESCROW_ABI, functionName: "state" }),
      ]),
      fetchEvidence(escrowAddress),
      getContractDeployTimestamp(escrowAddress),
    ]);

    // SimpleEscrow state 3 = DISPUTED
    if (Number(state) !== 3) {
      console.log(`ℹ️  [SIMPLE] Escrow ${escrowAddress} no longer disputed, skipping.`);
      processed.add(escrowAddress);
      return;
    }

    const nowMs    = Date.now();
    const deployMs = deployTs ? deployTs * 1000 : nowMs;
    const raisedBy = disputeRaisedBy?.toLowerCase() === depositor?.toLowerCase()
      ? "depositor"
      : "beneficiary";

    /** @type {DisputeContext} */
    const disputeContext = {
      escrowType:              "simple",
      contractAddress:         escrowAddress,
      chainId:                 blockdag.id,
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
      disputeReason:           "Dispute raised on SimpleEscrow — no on-chain reason string",
      disputeRaisedBy:         raisedBy,
    };

    console.log(`📋 [SIMPLE] Evidence: ${evidence.length} item(s) | Depositor: ${depositor} | Amount: ${formatEther(amount)} BDAG`);
    console.log(`🤖 [SIMPLE] Consulting AI...`);

    const decision = await callAI(disputeContext, evidence);
    const urgency  = logDecisionSummary("[SIMPLE]", decision, disputeContext);

    let txHash = "pending_manual_review";

    if (shouldAutoResolve(decision)) {
      txHash = await executeSimpleResolution(escrowAddress, decision._onChainRuling);
    } else {
      await notifyDiscord(disputeContext, decision, urgency);
    }

    appendDecision({
      timestamp:       detectedAt,
      contractAddress: escrowAddress,
      chainId:         blockdag.id,
      escrowType:      "simple",
      disputeContext,
      decision,
      txHash,
    });

    processed.add(escrowAddress);

  } catch (err) {
    console.error(`❌ [SIMPLE] Error handling dispute for ${escrowAddress}:`, err.message);
  }
}

async function handleMilestoneDispute(escrowAddress, milestoneIndex) {
  const disputeKey = `${escrowAddress}:${milestoneIndex}`;
  if (processed.has(disputeKey)) return;

  const detectedAt = new Date().toISOString();
  console.log(`\n🔔 [MILESTONE] Dispute detected: ${escrowAddress} milestone #${milestoneIndex} at ${detectedAt}`);

  try {
    console.log(`⏳ [MILESTONE] Waiting 60s for evidence submissions...`);
    await new Promise(r => setTimeout(r, 60_000));

    const [[depositor, beneficiary, totalDeposited, funded], milestoneDetails, evidence, deployTs] = await Promise.all([
      Promise.all([
        publicClient.readContract({ address: escrowAddress, abi: MILESTONE_ESCROW_ABI, functionName: "depositor" }),
        publicClient.readContract({ address: escrowAddress, abi: MILESTONE_ESCROW_ABI, functionName: "beneficiary" }),
        publicClient.readContract({ address: escrowAddress, abi: MILESTONE_ESCROW_ABI, functionName: "totalDeposited" }),
        publicClient.readContract({ address: escrowAddress, abi: MILESTONE_ESCROW_ABI, functionName: "funded" }),
      ]),
      fetchMilestoneDetails(escrowAddress, milestoneIndex),
      fetchEvidence(escrowAddress),
      getContractDeployTimestamp(escrowAddress),
    ]);

    const { disputed, released, total } = milestoneDetails;

    // MilestoneState 2 = DISPUTED
    if (disputed.state !== 2) {
      console.log(`ℹ️  [MILESTONE] Milestone #${milestoneIndex} on ${escrowAddress} no longer disputed, skipping.`);
      processed.add(disputeKey);
      return;
    }

    const nowMs    = Date.now();
    const deployMs = deployTs ? deployTs * 1000 : nowMs;

    /** @type {DisputeContext} */
    const disputeContext = {
      escrowType:              "milestone",
      contractAddress:         escrowAddress,
      chainId:                 blockdag.id,
      createdAt:               deployTs ? new Date(deployMs).toISOString() : null,
      disputeRaisedAt:         detectedAt,
      depositor:               { address: depositor },
      beneficiary:             { address: beneficiary },
      amount:                  formatEther(totalDeposited),
      milestoneIndex:          milestoneIndex,
      totalMilestones:         total,
      completedMilestones:     released,
      milestoneDescription:    disputed.description,
      milestoneAmount:         formatEther(disputed.amount),
      depositTxHash:           null,
      timeElapsedSinceDeposit: humanElapsed(nowMs - deployMs),
      disputeReason:           `MilestoneDisputed event on milestone #${milestoneIndex}: "${disputed.description}"`,
      disputeRaisedBy:         "depositor", // only depositor can call disputeMilestone()
    };

    console.log(`📋 [MILESTONE] Evidence: ${evidence.length} item(s)`);
    console.log(`   Milestone: #${milestoneIndex} "${disputed.description}" — ${formatEther(disputed.amount)} BDAG`);
    console.log(`   Progress:  ${released}/${total} milestones released | Depositor: ${depositor}`);
    console.log(`🤖 [MILESTONE] Consulting AI...`);

    const decision = await callAI(disputeContext, evidence);
    const urgency  = logDecisionSummary("[MILESTONE]", decision, disputeContext);

    let txHash = "pending_manual_review";

    if (shouldAutoResolve(decision)) {
      txHash = await executeMilestoneResolution(escrowAddress, milestoneIndex, decision._onChainRuling);
    } else {
      await notifyDiscord(disputeContext, decision, urgency);
    }

    appendDecision({
      timestamp:       detectedAt,
      contractAddress: escrowAddress,
      chainId:         blockdag.id,
      escrowType:      "milestone",
      milestoneIndex,
      disputeContext,
      decision,
      txHash,
    });

    processed.add(disputeKey);

  } catch (err) {
    console.error(`❌ [MILESTONE] Error handling dispute ${escrowAddress} #${milestoneIndex}:`, err.message);
  }
}

// ─── Event polling ────────────────────────────────────────────────────────────

let lastBlock = 0n;

async function pollForDisputes() {
  try {
    const currentBlock = await publicClient.getBlockNumber();

    if (lastBlock === 0n) {
      // On first run, start from 100 blocks back
      lastBlock = currentBlock - 100n;
    }

    if (currentBlock <= lastBlock) return;

    const fromBlock = lastBlock + 1n;
    const toBlock   = currentBlock;

    // ── [SIMPLE] SimpleEscrow Disputed events ────────────────────────────────
    const simpleLogs = await publicClient.getLogs({
      fromBlock,
      toBlock,
      event: parseAbiItem("event Disputed(address indexed by)"),
    });

    for (const log of simpleLogs) {
      const escrowAddress  = log.address;
      const disputeRaisedBy = log.args.by;
      try {
        const arbiter = await publicClient.readContract({
          address: escrowAddress,
          abi: [{ type: "function", name: "arbiter", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" }],
          functionName: "arbiter",
        });
        if (arbiter.toLowerCase() === AI_ARBITER_ADDR.toLowerCase()) {
          console.log(`[SIMPLE] Dispute event from ${escrowAddress} raised by ${disputeRaisedBy}`);
          handleDispute(escrowAddress, disputeRaisedBy);
        }
      } catch {
        // Not a compatible escrow contract, skip
      }
    }

    // ── [MILESTONE] MilestoneEscrow MilestoneDisputed events ─────────────────
    const milestoneLogs = await publicClient.getLogs({
      fromBlock,
      toBlock,
      event: parseAbiItem("event MilestoneDisputed(uint256 indexed index)"),
    });

    for (const log of milestoneLogs) {
      const escrowAddress  = log.address;
      const milestoneIndex = Number(log.args.index);
      try {
        const arbiter = await publicClient.readContract({
          address: escrowAddress,
          abi: [{ type: "function", name: "arbiter", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" }],
          functionName: "arbiter",
        });
        if (arbiter.toLowerCase() === AI_ARBITER_ADDR.toLowerCase()) {
          console.log(`[MILESTONE] Dispute event from ${escrowAddress}, milestone #${milestoneIndex}`);
          handleMilestoneDispute(escrowAddress, milestoneIndex);
        }
      } catch {
        // Not a compatible escrow contract, skip
      }
    }

    lastBlock = currentBlock;

  } catch (err) {
    console.error("❌ Poll error:", err.message);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

// Ensure decisions.json exists
if (!fs.existsSync(DECISIONS_FILE)) {
  fs.writeFileSync(DECISIONS_FILE, "[]", "utf8");
  console.log(`📂 Created decisions.json at ${DECISIONS_FILE}`);
}

console.log("🤖 AI Arbiter Oracle starting...");
console.log(`📡 RPC:           ${RPC_URL}`);
console.log(`🏛️  AIArbiter:    ${AI_ARBITER_ADDR}`);
console.log(`👛 Oracle wallet: ${account.address}`);
console.log(`⏱️  Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
console.log(`🔭 Watching:      [SIMPLE] Disputed + [MILESTONE] MilestoneDisputed`);
console.log(`🎯 Auto-resolve:  confidence >= ${AUTO_RESOLVE_MIN_CONFIDENCE}`);
console.log(`📝 Decisions log: ${DECISIONS_FILE}`);
console.log(`📣 Discord:       ${DISCORD_WEBHOOK ? "configured" : "not configured"}`);
console.log("");

pollForDisputes();
setInterval(pollForDisputes, POLL_INTERVAL_MS);
