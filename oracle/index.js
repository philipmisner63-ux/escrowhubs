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

  console.log(`⚖️  Executing ${ruling} for ${escrowAddress}...`);

  const hash = await walletClient.writeContract({
    address: AI_ARBITER_ADDR,
    abi: AI_ARBITER_ABI,
    functionName,
    args: [escrowAddress],
  });

  console.log(`✅ Resolution tx submitted: ${hash}`);
  return hash;
}

async function handleDispute(escrowAddress) {
  if (processed.has(escrowAddress)) return;

  console.log(`\n🔔 Dispute detected: ${escrowAddress}`);

  try {
    // Wait a bit for evidence to be submitted
    console.log(`⏳ Waiting 60s for evidence submissions...`);
    await new Promise(r => setTimeout(r, 60_000));

    const [escrowDetails, evidence] = await Promise.all([
      fetchEscrowDetails(escrowAddress),
      fetchEvidence(escrowAddress),
    ]);

    // Verify still in disputed state (3)
    if (Number(escrowDetails.state) !== 3) {
      console.log(`ℹ️  Escrow ${escrowAddress} no longer disputed, skipping.`);
      processed.add(escrowAddress);
      return;
    }

    console.log(`📋 Evidence count: ${evidence.length}`);
    console.log(`🤖 Consulting AI for ruling...`);

    const ruling = await resolveWithAI(escrowAddress, escrowDetails, evidence);
    console.log(`⚖️  AI ruling: ${ruling}`);

    await executeResolution(escrowAddress, ruling);
    processed.add(escrowAddress);

  } catch (err) {
    console.error(`❌ Error handling dispute for ${escrowAddress}:`, err.message);
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

    const logs = await publicClient.getLogs({
      fromBlock: lastBlock + 1n,
      toBlock: currentBlock,
      event: parseAbiItem("event Disputed(address indexed by)"),
    });

    for (const log of logs) {
      const escrowAddress = log.address;

      // Check if this escrow's arbiter is our AIArbiter contract
      try {
        const arbiter = await publicClient.readContract({
          address: escrowAddress,
          abi: [{ type: "function", name: "arbiter", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" }],
          functionName: "arbiter",
        });

        if (arbiter.toLowerCase() === AI_ARBITER_ADDR.toLowerCase()) {
          handleDispute(escrowAddress);
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
console.log("");

// Initial poll then set interval
pollForDisputes();
setInterval(pollForDisputes, POLL_INTERVAL_MS);
