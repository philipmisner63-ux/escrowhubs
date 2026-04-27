/**
 * /api/admin/escalations
 *
 * GET  — returns all pending escalated disputes from escalations.json
 * POST — submits an ARBITER_REVIEW as on-chain evidence via the oracle signer
 *        body: { escrowAddress, chainId, review: string }
 *
 * Protected: only callable from the /admin page (owner-gated in UI)
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ESCALATIONS_FILE = process.env.ESCALATIONS_FILE
  ?? "/root/blockdag-escrow/oracle/escalations.json";

function loadEscalations(): Record<string, unknown> {
  try {
    if (fs.existsSync(ESCALATIONS_FILE)) {
      const raw = fs.readFileSync(ESCALATIONS_FILE, "utf8").trim();
      return raw ? JSON.parse(raw) : {};
    }
  } catch { /* ignore */ }
  return {};
}

export async function GET() {
  const data = loadEscalations();
  const pending = Object.values(data).filter((v: any) => !v.resolved);
  return NextResponse.json({ escalations: pending, total: pending.length });
}

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { escrowAddress, chainId, review, arbiterRuling } = body;

    if (!escrowAddress || !review?.trim()) {
      return NextResponse.json({ error: "escrowAddress and review are required" }, { status: 400 });
    }

    // Determine RPC + arbiter address from chainId
    const chainConfigs: Record<number, { rpc: string; arbiter: string }> = {
      8453:  { rpc: process.env.BASE_RPC_URL    ?? "https://mainnet.base.org",              arbiter: process.env.BASE_ARBITER_ADDRESS    ?? "0x79e78c1ed9a8e239a8334294bf4f0d356f858416" },
      137:   { rpc: process.env.POLYGON_RPC_URL ?? "https://polygon-rpc.com",               arbiter: process.env.POLYGON_ARBITER_ADDRESS ?? "0x79e78c1ed9a8e239a8334294bf4f0d356f858416" },
      1404:  { rpc: process.env.BLOCKDAG_RPC_URL ?? "https://rpc.blockdag.engineering",             arbiter: process.env.BLOCKDAG_ARBITER_ADDRESS ?? "0xf8c771891dc8158d46c4608cf0008ceb7a9c898b" },
    };

    const cfg = chainConfigs[Number(chainId)];
    if (!cfg) return NextResponse.json({ error: `Unsupported chainId: ${chainId}` }, { status: 400 });

    const oracleKey = process.env.ORACLE_PRIVATE_KEY;
    if (!oracleKey) return NextResponse.json({ error: "Oracle key not configured" }, { status: 500 });

    // Build the ARBITER_REVIEW evidence string
    const evidenceText = `ARBITER_REVIEW: ${review.trim()}${arbiterRuling ? ` | Recommended ruling: ${arbiterRuling}` : ""}`;

    // Submit on-chain via viem
    const { createWalletClient, createPublicClient, http, parseAbiItem } = await import("viem");
    const { privateKeyToAccount } = await import("viem/accounts");

    const account = privateKeyToAccount(oracleKey as `0x${string}`);
    const viemChain = {
      id: Number(chainId),
      name: `chain-${chainId}`,
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [cfg.rpc] } },
    };

    const walletClient = createWalletClient({ account, chain: viemChain, transport: http(cfg.rpc) });

    const SUBMIT_EVIDENCE_ABI = parseAbiItem(
      "function submitEvidence(address escrow, string calldata uri) external"
    );

    const hash = await walletClient.writeContract({
      address: cfg.arbiter as `0x${string}`,
      abi: [SUBMIT_EVIDENCE_ABI],
      functionName: "submitEvidence",
      args: [escrowAddress as `0x${string}`, evidenceText],
    });

    return NextResponse.json({
      success: true,
      txHash: hash,
      evidenceText,
      message: "Arbiter review submitted on-chain. Oracle will detect it within the next poll cycle and re-evaluate.",
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
