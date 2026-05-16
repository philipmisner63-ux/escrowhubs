"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { CONTRACTS, CUSD, ERC20_APPROVE_ABI } from "@/lib/contracts";
import EscrowABI from "@/lib/abi-SimpleEscrow.json";
import { ConnectButton } from "@/components/connect-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";

const STATE_LABELS: Record<number, string> = {
  0: "Awaiting Deposit",
  1: "Funded",
  2: "Released",
  3: "Disputed",
  4: "Refunded",
};

export default function EscrowDetailPage() {
  const params = useParams();
  const escrowId = params.escrow_id as string;
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [escrowData, setEscrowData] = useState<any>(null);
  const [error, setError] = useState("");
  const [funding, setFunding] = useState(false);

  const { writeContractAsync: approveToken } = useWriteContract();
  const { writeContractAsync: deposit } = useWriteContract();

  // Read on-chain state
  const { data: state } = useReadContract({
    address: escrowId as `0x${string}`,
    abi: EscrowABI,
    functionName: "state",
    query: { enabled: !!escrowId && escrowId.startsWith("0x") },
  });

  const { data: amount } = useReadContract({
    address: escrowId as `0x${string}`,
    abi: EscrowABI,
    functionName: "amount",
    query: { enabled: !!escrowId && escrowId.startsWith("0x") },
  });

  const { data: beneficiary } = useReadContract({
    address: escrowId as `0x${string}`,
    abi: EscrowABI,
    functionName: "beneficiary",
    query: { enabled: !!escrowId && escrowId.startsWith("0x") },
  });

  useEffect(() => {
    async function fetchEscrow() {
      try {
        const res = await fetch(`/api/escrow/${escrowId}`);
        const json = await res.json();
        if (json.success) {
          setEscrowData(json.escrow);
        }
      } catch {
        // Fallback: if API fails, we still have on-chain data
      } finally {
        setLoading(false);
      }
    }
    if (escrowId) fetchEscrow();
  }, [escrowId]);

  async function handleFund() {
    if (!isConnected || !address || !amount) return;
    setFunding(true);
    setError("");

    try {
      // Step 1: Approve cUSD
      await approveToken({
        address: CUSD,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [escrowId as `0x${string}`, amount as bigint],
      });

      // Step 2: Deposit
      const hash = await deposit({
        address: escrowId as `0x${string}`,
        abi: EscrowABI,
        functionName: "deposit",
        gas: 500_000n,
      });

      showToast("Escrow funded successfully!", "success");

      // Update backend status
      try {
        await fetch("/api/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            escrow_id: escrowData?.escrow_id || escrowId,
            status: "FUNDED",
            buyer_wallet: address,
            tx_hash: hash,
          }),
        });
      } catch {
        // Best effort
      }
    } catch (err: any) {
      console.error("[Fund]", err);
      setError(err?.shortMessage ?? err?.message ?? "Funding failed");
    } finally {
      setFunding(false);
    }
  }

  const stateNum = typeof state === "number" ? state : Number(state ?? 0);
  const stateLabel = STATE_LABELS[stateNum] ?? "Unknown";
  const amountFormatted = amount ? parseFloat(formatUnits(amount as bigint, 18)).toFixed(2) : "...";

  return (
    <main className="flex flex-col min-h-screen">
      <MarketplaceNav />
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="max-w-lg w-full">
          <h1 className="text-3xl font-bold text-white mb-2">Escrow Details</h1>
          <p className="text-white/60 mb-8">
            Review and fund this escrow with cUSD.
          </p>

          {loading && (
            <GlassCard className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50">Loading escrow...</p>
            </GlassCard>
          )}

          {!loading && (
            <div className="flex flex-col gap-4">
              <GlassCard>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/50 text-sm">Status</span>
                  <span className={`text-sm font-semibold ${
                    stateNum === 0 ? "text-amber-400" :
                    stateNum === 1 ? "text-[#35D07F]" :
                    stateNum === 2 ? "text-blue-400" :
                    "text-red-400"
                  }`}>{stateLabel}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/50 text-sm">Amount</span>
                  <span className="text-2xl font-bold text-white">{amountFormatted} cUSD</span>
                </div>
                {beneficiary && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-sm">Seller</span>
                    <span className="text-sm font-mono text-white">
                      {(beneficiary as string).slice(0, 8)}...{(beneficiary as string).slice(-6)}
                    </span>
                  </div>
                )}
                {escrowData?.description && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-white/50 text-sm block mb-1">Description</span>
                    <p className="text-white/80 text-sm">{escrowData.description}</p>
                  </div>
                )}
              </GlassCard>

              {!isConnected && (
                <GlassCard className="text-center py-8">
                  <p className="text-white/70 mb-4">Connect your MiniPay wallet to fund this escrow</p>
                  <ConnectButton />
                </GlassCard>
              )}

              {isConnected && stateNum === 0 && (
                <>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}
                  <GlowButton
                    variant="primary"
                    onClick={handleFund}
                    disabled={funding}
                    loading={funding}
                    className="w-full"
                  >
                    {funding ? "Funding..." : "Fund Escrow with cUSD"}
                  </GlowButton>
                  <p className="text-xs text-white/40 text-center">
                    You'll approve cUSD spend, then confirm the deposit.
                  </p>
                </>
              )}

              {stateNum === 1 && (
                <GlassCard className="text-center py-6 border-[#35D07F]/30">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-[#35D07F] font-medium">Funded</p>
                  <p className="text-white/60 text-sm mt-1">
                    Funds are locked. Seller will release once delivery is confirmed.
                  </p>
                </GlassCard>
              )}

              {stateNum === 2 && (
                <GlassCard className="text-center py-6 border-blue-500/30">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-blue-400 font-medium">Released</p>
                  <p className="text-white/60 text-sm mt-1">
                    Funds have been released to the seller.
                  </p>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
