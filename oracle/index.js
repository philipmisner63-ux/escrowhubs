/**
 * AI Arbiter Oracle Service
 *
 * Watches for Disputed events on SimpleEscrow contracts whose arbiter is
 * the AIArbiter contract. When a dispute is detected, fetches all submitted
 * evidence, sends it to Claude for analysis, and executes the resolution
 * on-chain by calling AIArbiter.resolveRelease or AIArbiter.resolveRefund.
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─── Config ──────────────────────────────────────────────────────────────────

const RPC_URL          = process.env.BLOCKDAG_RPC_URL    ?? "https://rpc.bdagscan.com";
const PRIVATE_KEY      = process.env.ORACLE_PRIVATE_KEY;
const AI_ARBITER_ADDR  = process.env.AI_ARBITER_ADDRESS;
const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? "30000");

if (!PRIVATE_KEY || !AI_ARBITER_ADDR || !ANTHROPIC_KEY) {
  console.error("❌ Missing required env vars: ORACLE_PRIVATE_KEY, AI_ARBITER_ADDRESS, ANTHROPIC_API_KEY");
  process.exit(1);
}

// ─── Chain ───────────────────────────────────────────────────────────────────
// Configured for BlockDAG Mainnet (Chain ID 1404).
// To support additional chains, duplicate this config and update env vars accordingly.

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
  { type: "function", name: "depositor",     inputs: [],                              outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "beneficiary",   inputs: [],                              outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "arbiter",       inputs: [],                              outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalDeposited",inputs: [],                              outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "funded",        inputs: [],                              outputs: [{ type: "bool"    }], stateMutability: "view" },
  { type: "function", name: "milestoneCount",inputs: [],                              outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "milestones",    inputs: [{ name: "index", type: "uint256" }], outputs: [{ type: "string" }, { type: "uint256" }, { type: "uint8" }], stateMutability: "view" },
  { type: "event",    name: "MilestoneDisputed", inputs: [{ name: "index", type: "uint256", indexed: true }] },
];

// ─── State ───────────────────────────────────────────────────────────────────

// Track disputes already processed to avoid double-resolution
const processed = new Set();

// ─── Core logic ──────────────────────────────────────────────────────────────

async function fetchEvidence(escrowAddress) {
  try {
    const evidence = await publicClient.readContract({
      address: AI_ARBITER_ADDR,
      abi: AI_ARBITER_ABI,
      functionName: "getAllEvidence",
      args: [escrowAddress],
    });
    return evidence;
  } catch {
    return [];
  }
}

async function fetchEscrowDetails(escrowAddress) {
  const [depositor, beneficiary, amount, state] = await Promise.all([
    publicClient.readContract({ address: escrowAddress, abi: SIMPLE_ESCROW_ABI, functionName: "depositor" }),
    publicClient.readContract({ address: escrowAddress, abi: SIMPLE_ESCROW_ABI, functionName: "beneficiary" }),
    publicClient.readContract({ address: escrowAddress, abi: SIMPLE_ESCROW_ABI, functionName: "amount" }),
    publicClient.readContract({ address: escrowAddress, abi: SIMPLE_ESCROW_ABI, functionName: "state" }),
  ]);
  return { depositor, beneficiary, amount, state };
}

async function resolveWithAI(escrowAddress, escrowDetails, evidence) {
  const evidenceText = evidence.length > 0
    ? evidence.map((e, i) =>
        `Evidence #${i + 1}\nSubmitter: ${e.submitter}\nSubmitted at: ${new Date(Number(e.submittedAt) * 1000).toISOString()}\nContent: ${e.uri}`
      ).join("\n\n")
    : "No evidence submitted by either party.";

  const prompt = `You are an impartial AI arbiter resolving a smart contract escrow dispute on the BlockDAG blockchain.

ESCROW DETAILS:
- Contract address: ${escrowAddress}
- Depositor (buyer): ${escrowDetails.depositor}
- Beneficiary (seller): ${escrowDetails.beneficiary}
- Amount locked: ${formatEther(escrowDetails.amount)} BDAG

EVIDENCE SUBMITTED:
${evidenceText}

INSTRUCTIONS:
Analyze the evidence carefully and make a fair ruling. You must respond with ONLY one of these two words:
- RELEASE (if the beneficiary/seller should receive the funds)
- REFUND (if the depositor/buyer should get their money back)

Consider: Was the work/service delivered? Is there evidence of fraud or non-delivery? Who has the stronger case?

If there is no evidence or the evidence is insufficient to make a determination, default to REFUND to protect the depositor.

Your ruling (RELEASE or REFUND):`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 10,
    messages: [{ role: "user", content: prompt }],
  });

  const ruling = message.content[0].text.trim().toUpperCase();
  return ruling.includes("RELEASE") ? "RELEASE" : "REFUND";
}

async function executeResolution(escrowAddress, ruling) {
  const functionName = ruling === "RELEASE" ? "resolveRelease" : "resolveRefund";

  console.log(`⚖️  [SIMPLE] Executing ${ruling} for ${escrowAddress}...`);

  const hash = await walletClient.writeContract({
    address: AI_ARBITER_ADDR,
    abi: AI_ARBITER_ABI,
    functionName,
    args: [escrowAddress],
  });

  console.log(`✅ [SIMPLE] Resolution tx submitted: ${hash}`);
  return hash;
}

async function handleDispute(escrowAddress) {
  if (processed.has(escrowAddress)) return;

  console.log(`\n🔔 [SIMPLE] Dispute detected: ${escrowAddress} at ${new Date().toISOString()}`);

  try {
    // Wait a bit for evidence to be submitted
    console.log(`⏳ [SIMPLE] Waiting 60s for evidence submissions...`);
    await new Promise(r => setTimeout(r, 60_000));

    const [escrowDetails, evidence] = await Promise.all([
      fetchEscrowDetails(escrowAddress),
      fetchEvidence(escrowAddress),
    ]);

    // Verify still in disputed state (3)
    if (Number(escrowDetails.state) !== 3) {
      console.log(`ℹ️  [SIMPLE] Escrow ${escrowAddress} no longer disputed, skipping.`);
      processed.add(escrowAddress);
      return;
    }

    console.log(`📋 [SIMPLE] Evidence count: ${evidence.length}`);
    console.log(`🤖 [SIMPLE] Consulting AI for ruling...`);

    const ruling = await resolveWithAI(escrowAddress, escrowDetails, evidence);
    console.log(`⚖️  [SIMPLE] AI ruling: ${ruling} for ${escrowAddress}`);

    await executeResolution(escrowAddress, ruling);
    processed.add(escrowAddress);

  } catch (err) {
    console.error(`❌ [SIMPLE] Error handling dispute for ${escrowAddress}:`, err.message);
  }
}

// ─── Milestone dispute handler ───────────────────────────────────────────────

async function fetchMilestoneDetails(escrowAddress, milestoneIndex) {
  const count = await publicClient.readContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "milestoneCount",
  });

  const indices = Array.from({ length: Number(count) }, (_, i) => BigInt(i));
  const allMilestones = await Promise.all(
    indices.map(i =>
      publicClient.readContract({
        address: escrowAddress,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "milestones",
        args: [i],
      })
    )
  );

  // Each result is [description, amount, state]
  // MilestoneState: 0=PENDING, 1=RELEASED, 2=DISPUTED, 3=REFUNDED
  const parsed = allMilestones.map((m, i) => ({
    index: i,
    description: m[0],
    amount: m[1],
    state: Number(m[2]),
    stateLabel: ["PENDING", "RELEASED", "DISPUTED", "REFUNDED"][Number(m[2])] ?? "UNKNOWN",
  }));

  const disputed = parsed[Number(milestoneIndex)];
  const approved = parsed.filter(m => m.state === 1).length;
  const remaining = parsed.filter(m => m.state === 0 || m.state === 2).length;

  return { milestones: parsed, disputed, approved, remaining, total: parsed.length };
}

async function resolveWithAIMilestone(escrowAddress, escrowDetails, milestoneDetails, evidence) {
  const { disputed, approved, remaining, total, milestones } = milestoneDetails;

  const milestoneList = milestones
    .map(m => `  Milestone #${m.index}: "${m.description}" — ${formatEther(m.amount)} BDAG [${m.stateLabel}]`)
    .join("\n");

  const evidenceText = evidence.length > 0
    ? evidence.map((e, i) =>
        `Evidence #${i + 1}\nSubmitter: ${e.submitter}\nSubmitted at: ${new Date(Number(e.submittedAt) * 1000).toISOString()}\nContent: ${e.uri}`
      ).join("\n\n")
    : "No evidence submitted by either party.";

  const prompt = `You are an impartial AI arbiter resolving a milestone escrow dispute on the BlockDAG blockchain.

ESCROW DETAILS:
- Contract address: ${escrowAddress}
- Depositor (buyer): ${escrowDetails.depositor}
- Beneficiary (seller): ${escrowDetails.beneficiary}
- Total contract value: ${formatEther(escrowDetails.totalDeposited)} BDAG

MILESTONE BREAKDOWN (${total} total):
${milestoneList}

DISPUTED MILESTONE:
- Index: #${disputed.index}
- Description: "${disputed.description}"
- Amount at stake: ${formatEther(disputed.amount)} BDAG
- Progress context: ${approved} of ${total} milestones already released (${remaining} remaining including this one)

EVIDENCE SUBMITTED:
${evidenceText}

INSTRUCTIONS:
Analyze the evidence and milestone context carefully. You must respond with ONLY one of these two words:
- RELEASE (if this milestone was completed and the beneficiary/seller deserves payment)
- REFUND (if this milestone was not completed and the depositor/buyer deserves their money back)

Consider: Was this specific milestone's deliverable completed? Does the prior milestone approval history suggest a pattern of delivery? Is there evidence of partial completion?

If there is no evidence or it is insufficient, default to REFUND to protect the depositor.

Your ruling (RELEASE or REFUND):`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 10,
    messages: [{ role: "user", content: prompt }],
  });

  const ruling = message.content[0].text.trim().toUpperCase();
  return ruling.includes("RELEASE") ? "RELEASE" : "REFUND";
}

async function executeMilestoneResolution(escrowAddress, milestoneIndex, ruling) {
  const functionName = ruling === "RELEASE" ? "resolveMilestoneRelease" : "resolveMilestoneRefund";

  console.log(`⚖️  [MILESTONE] Executing ${ruling} for ${escrowAddress} milestone #${milestoneIndex}...`);

  const hash = await walletClient.writeContract({
    address: AI_ARBITER_ADDR,
    abi: AI_ARBITER_ABI,
    functionName,
    args: [escrowAddress, BigInt(milestoneIndex)],
  });

  console.log(`✅ [MILESTONE] Resolution tx submitted: ${hash}`);
  return hash;
}

async function handleMilestoneDispute(escrowAddress, milestoneIndex) {
  const disputeKey = `${escrowAddress}:${milestoneIndex}`;
  if (processed.has(disputeKey)) return;

  const ts = new Date().toISOString();
  console.log(`\n🔔 [MILESTONE] Dispute detected at ${ts}`);
  console.log(`   Contract:  ${escrowAddress}`);
  console.log(`   Milestone: #${milestoneIndex}`);

  try {
    // Wait for evidence submissions
    console.log(`⏳ [MILESTONE] Waiting 60s for evidence submissions...`);
    await new Promise(r => setTimeout(r, 60_000));

    const [escrowDetails, milestoneDetails, evidence] = await Promise.all([
      (async () => {
        const [depositor, beneficiary, totalDeposited, funded] = await Promise.all([
          publicClient.readContract({ address: escrowAddress, abi: MILESTONE_ESCROW_ABI, functionName: "depositor" }),
          publicClient.readContract({ address: escrowAddress, abi: MILESTONE_ESCROW_ABI, functionName: "beneficiary" }),
          publicClient.readContract({ address: escrowAddress, abi: MILESTONE_ESCROW_ABI, functionName: "totalDeposited" }),
          publicClient.readContract({ address: escrowAddress, abi: MILESTONE_ESCROW_ABI, functionName: "funded" }),
        ]);
        return { depositor, beneficiary, totalDeposited, funded };
      })(),
      fetchMilestoneDetails(escrowAddress, milestoneIndex),
      fetchEvidence(escrowAddress),
    ]);

    console.log(`   Depositor:   ${escrowDetails.depositor}`);
    console.log(`   Beneficiary: ${escrowDetails.beneficiary}`);
    console.log(`   Milestone:   "${milestoneDetails.disputed.description}" — ${formatEther(milestoneDetails.disputed.amount)} BDAG`);
    console.log(`   Progress:    ${milestoneDetails.approved}/${milestoneDetails.total} milestones previously released`);

    // Verify milestone still in disputed state (2)
    if (milestoneDetails.disputed.state !== 2) {
      console.log(`ℹ️  [MILESTONE] Milestone #${milestoneIndex} on ${escrowAddress} no longer disputed, skipping.`);
      processed.add(disputeKey);
      return;
    }

    console.log(`📋 [MILESTONE] Evidence count: ${evidence.length}`);
    console.log(`🤖 [MILESTONE] Consulting AI for ruling...`);

    const ruling = await resolveWithAIMilestone(escrowAddress, escrowDetails, milestoneDetails, evidence);

    console.log(`⚖️  [MILESTONE] AI ruling: ${ruling} for milestone #${milestoneIndex} on ${escrowAddress}`);

    await executeMilestoneResolution(escrowAddress, milestoneIndex, ruling);
    processed.add(disputeKey);

  } catch (err) {
    console.error(`❌ [MILESTONE] Error handling dispute ${escrowAddress} #${milestoneIndex}:`, err.message);
    // Do not rethrow — oracle process must stay stable
  }
}

// ─── Event polling ───────────────────────────────────────────────────────────

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

    // ── [SIMPLE] Poll for SimpleEscrow Disputed events ──────────────────────
    const simpleLogs = await publicClient.getLogs({
      fromBlock,
      toBlock,
      event: parseAbiItem("event Disputed(address indexed by)"),
    });

    for (const log of simpleLogs) {
      const escrowAddress = log.address;
      try {
        const arbiter = await publicClient.readContract({
          address: escrowAddress,
          abi: [{ type: "function", name: "arbiter", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" }],
          functionName: "arbiter",
        });
        if (arbiter.toLowerCase() === AI_ARBITER_ADDR.toLowerCase()) {
          console.log(`[SIMPLE] Dispute event from ${escrowAddress}`);
          handleDispute(escrowAddress);
        }
      } catch {
        // Not a compatible escrow contract, skip
      }
    }

    // ── [MILESTONE] Poll for MilestoneEscrow MilestoneDisputed events ────────
    const milestoneLogs = await publicClient.getLogs({
      fromBlock,
      toBlock,
      event: parseAbiItem("event MilestoneDisputed(uint256 indexed index)"),
    });

    for (const log of milestoneLogs) {
      const escrowAddress = log.address;
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

// ─── Start ───────────────────────────────────────────────────────────────────

console.log("🤖 AI Arbiter Oracle starting...");
console.log(`📡 RPC: ${RPC_URL}`);
console.log(`🏛️  AIArbiter: ${AI_ARBITER_ADDR}`);
console.log(`👛 Oracle wallet: ${account.address}`);
console.log(`⏱️  Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
console.log(`🔭 Watching: [SIMPLE] Disputed + [MILESTONE] MilestoneDisputed events`);
console.log("");

// Initial poll then set interval
pollForDisputes();
setInterval(pollForDisputes, POLL_INTERVAL_MS);
