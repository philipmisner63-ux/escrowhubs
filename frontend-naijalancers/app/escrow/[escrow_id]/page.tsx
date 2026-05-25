"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/components/session-provider";
import { GoogleSignInButton } from "@/components/google-signin";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { CONTRACTS, ESCROW_TOKEN, TOKEN_DECIMALS, ERC20_APPROVE_ABI, explorerTxUrl } from "@/lib/contracts";
import EscrowABI from "@/lib/abi-SimpleEscrow.json";

const STATE_LABELS: Record<number, { label: string; color: string; emoji: string; desc: string }> = {
  0: { label: "Awaiting Payment", color: "text-amber-400", emoji: "⏳", desc: "The seller is waiting for the buyer to fund the escrow." },
  1: { label: "Funded — In Progress", color: "text-[#35D07F]", emoji: "🔒", desc: "Funds are held securely. Deliver the item or service to release payment." },
  2: { label: "Complete", color: "text-blue-400", emoji: "✅", desc: "Payment has been released to the seller." },
  3: { label: "In Dispute", color: "text-red-400", emoji: "⚖️", desc: "A dispute has been raised. Our team will help resolve it." },
  4: { label: "Refunded", color: "text-red-400", emoji: "↩️", desc: "Payment has been refunded to the buyer." },
};

export default function EscrowDetailPage() {
  const params = useParams();
  const escrowId = params.escrow_id as string;
  const { session } = useSession();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [escrowData, setEscrowData] = useState<any>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [ramping, setRamping] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [onChainState, setOnChainState] = useState<number | null>(null);
  const [onChainAmount, setOnChainAmount] = useState<bigint | null>(null);
  const [beneficiary, setBeneficiary] = useState<string | null>(null);
  const [depositor, setDepositor] = useState<string | null>(null);
  const [releasedTxHash, setReleasedTxHash] = useState<string | null>(null);

  // Persist release tx hash across refreshes
  useEffect(() => {
    if (escrowId) {
      const saved = sessionStorage.getItem(`escrow_tx_${escrowId}`);
      if (saved) setReleasedTxHash(saved);
    }
  }, [escrowId]);

  // Fetch on-chain data
  useEffect(() => {
    async function fetchOnChain() {
      if (!escrowId || !escrowId.startsWith("0x")) return;
      try {
        const { ethers } = await import("ethers");
        const provider = new ethers.JsonRpcProvider("https://forno.celo.org");
        const escrow = new ethers.Contract(escrowId, EscrowABI, provider);
        const [st, amt, ben, dep] = await Promise.all([
          escrow.state(),
          escrow.amount(),
          escrow.beneficiary(),
          escrow.depositor().catch(() => null),
        ]);
        setOnChainState(Number(st));
        setOnChainAmount(amt);
        setBeneficiary(ben);
        setDepositor(dep);
      } catch {
        // on-chain fetch is best-effort
      }
    }
    fetchOnChain();
  }, [escrowId]);

  // Fetch off-chain metadata
  useEffect(() => {
    async function fetchEscrow() {
      try {
        const res = await fetch(`/api/escrow/${escrowId}`);
        const json = await res.json();
        if (json.success) {
          setEscrowData(json.escrow);
          if (json.escrow?.tx_hash) setReleasedTxHash(json.escrow.tx_hash);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    if (escrowId) fetchEscrow();
  }, [escrowId]);

  // Buyer pays by depositing USDT into the EXISTING escrow contract
  async function handlePay() {
    if (!session || !escrowData) return;
    setPaying(true);
    setError("");

    try {
      const { parseUnits } = await import("viem");
      const amountUsdt = escrowData.amount_usdc || 0;
      const amountWei = parseUnits(amountUsdt.toFixed(6), TOKEN_DECIMALS).toString();

      // Step 1: Approve token spend for the escrow contract
      const approveRes = await fetch("/api/wallet/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: session.walletAddress,
          contract: ESCROW_TOKEN,
          abi: ERC20_APPROVE_ABI,
          method: "approve",
          args: [escrowId, amountWei],
        }),
      });

      if (!approveRes.ok) {
        const err = await approveRes.json();
        throw new Error(err.error || "Approval failed");
      }

      // Step 2: Deposit into existing escrow
      const depositRes = await fetch("/api/wallet/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: session.walletAddress,
          contract: escrowId,
          abi: EscrowABI,
          method: "deposit",
          args: [amountWei],
          value: "0",
        }),
      });

      if (!depositRes.ok) {
        const err = await depositRes.json();
        throw new Error(err.error || "Deposit failed");
      }

      const { txHash } = await depositRes.json();

      // Update backend
      await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrow_id: escrowData.escrow_id,
          status: "FUNDED",
          buyer_wallet: session.walletAddress,
          tx_hash: txHash,
        }),
      });

      setOnChainState(1);
      showToast("Payment successful! Funds are now in escrow.", "success");
    } catch (err: any) {
      console.error("[Pay]", err);
      setError(err?.message ?? "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  // Buyer pays with Naira via Awwal's ramp
  async function handleRamp() {
    if (!session || !escrowData) return;
    setRamping(true);
    setError("");

    try {
      const amountNgn = escrowData.amount_fiat || 0;
      if (amountNgn < 3000) {
        throw new Error("Minimum Naira payment is ₦3,000");
      }

      const res = await fetch("/api/ramp/session/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiat_amount: amountNgn,
          destination_address: session.walletAddress,
          external_user_id: session.userId,
          currency: "USDT",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create ramp session");
      }

      // Open Awwal's payment page in new tab
      if (data.redirect_url) {
        window.open(data.redirect_url, "_blank");
        showToast("Redirecting to Naira payment... Pay there, then return and click 'Pay with USDT'", "success");
      } else {
        throw new Error("No redirect URL from ramp");
      }
    } catch (err: any) {
      console.error("[Ramp]", err);
      setError(err?.message ?? "Naira payment setup failed");
    } finally {
      setRamping(false);
    }
  }

  // Buyer releases escrowed funds to seller
  async function handleRelease() {
    if (!session || !escrowId) return;
    setReleasing(true);
    setError("");

    try {
      const releaseRes = await fetch("/api/wallet/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: session.walletAddress,
          contract: escrowId,
          abi: EscrowABI,
          method: "release",
          args: [],
        }),
      });

      if (!releaseRes.ok) {
        const err = await releaseRes.json();
        throw new Error(err.error || "Release failed");
      }

      const { txHash } = await releaseRes.json();
      setReleasedTxHash(txHash);
      sessionStorage.setItem(`escrow_tx_${escrowId}`, txHash);

      // Update backend
      if (escrowData?.escrow_id) {
        await fetch("/api/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            escrow_id: escrowData.escrow_id,
            status: "RELEASED",
            tx_hash: txHash,
            released_at: new Date().toISOString(),
          }),
        });
      }

      setOnChainState(2);
      showToast("Payment released to seller!", "success");
    } catch (err: any) {
      console.error("[Release]", err);
      setError(err?.message ?? "Release failed");
    } finally {
      setReleasing(false);
    }
  }

  // Buyer (or either party) raises a dispute
  async function handleDispute() {
    if (!session || !escrowId) return;
    setDisputing(true);
    setError("");

    try {
      const disputeRes = await fetch("/api/wallet/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: session.walletAddress,
          contract: escrowId,
          abi: EscrowABI,
          method: "dispute",
          args: [],
        }),
      });

      if (!disputeRes.ok) {
        const err = await disputeRes.json();
        throw new Error(err.error || "Dispute failed");
      }

      const { txHash } = await disputeRes.json();

      if (escrowData?.escrow_id) {
        await fetch("/api/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            escrow_id: escrowData.escrow_id,
            status: "DISPUTED",
            tx_hash: txHash,
          }),
        });
      }

      setOnChainState(3);
      showToast("Dispute raised. Our team will help resolve it.", "success");
    } catch (err: any) {
      console.error("[Dispute]", err);
      setError(err?.message ?? "Dispute failed");
    } finally {
      setDisputing(false);
    }
  }

  const stateNum = onChainState ?? 0;
  const stateInfo = STATE_LABELS[stateNum] ?? STATE_LABELS[0];
  const amountFormatted = onChainAmount !== null
    ? (Number(onChainAmount) / 10 ** TOKEN_DECIMALS).toFixed(2)
    : escrowData?.amount_usdc !== undefined && escrowData?.amount_usdc !== null
      ? Number(escrowData.amount_usdc).toFixed(2)
      : "...";

  const isSeller = session?.walletAddress && escrowData?.seller_wallet
    ? session.walletAddress.toLowerCase() === escrowData.seller_wallet.toLowerCase()
    : false;

  const isClient = session?.walletAddress && depositor
    ? session.walletAddress.toLowerCase() === depositor.toLowerCase()
    : false;

  return (
    <main className="flex flex-col min-h-screen">
      <MarketplaceNav />
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="max-w-lg w-full">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Details</h1>
          <p className="text-white/60 mb-8">
            Review and pay securely.
          </p>

          {loading && (
            <GlassCard className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50">Loading payment details...</p>
            </GlassCard>
          )}

          {!loading && (
            <div className="flex flex-col gap-4">
              <GlassCard>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/50 text-sm">Status</span>
                  <span className={`text-sm font-semibold ${stateInfo.color}`}>
                    {stateInfo.emoji} {stateInfo.label}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/50 text-sm">Amount</span>
                  <span className="text-2xl font-bold text-white">${amountFormatted} USDT</span>
                </div>
                {escrowData?.seller_wallet && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-sm">Seller</span>
                    <span className="text-sm font-mono text-white">
                      {escrowData.seller_wallet.slice(0, 8)}...{escrowData.seller_wallet.slice(-6)}
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

              {/* Status explanation */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-sm text-white/60">{stateInfo.desc}</p>
              </div>

              {!session && stateNum === 0 && (
                <GlassCard className="text-center py-8">
                  <p className="text-white/70 mb-4">Sign in to pay securely</p>
                  <GoogleSignInButton />
                </GlassCard>
              )}

              {session && isSeller && stateNum === 0 && (
                <>
                  <GlassCard className="text-center py-6 border-amber-500/30">
                    <div className="text-4xl mb-2">📤</div>
                    <p className="text-amber-400 font-medium">Share This With Your Buyer</p>
                    <p className="text-white/60 text-sm mt-1">
                      Send this link to your buyer so they can pay securely.
                    </p>
                  </GlassCard>

                  {/* Test mode: allow seller to also deposit as buyer */}
                  <GlassCard className="border-dashed border-white/20">
                    <p className="text-xs text-white/40 text-center mb-3 uppercase tracking-wider">Testing Only</p>
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-3">
                        {error}
                      </div>
                    )}
                    <GlowButton
                      variant="secondary"
                      onClick={handleRamp}
                      disabled={ramping}
                      loading={ramping}
                      className="w-full mb-2"
                    >
                      {ramping ? "Setting up..." : "🇳🇬 Test: Pay with Naira"}
                    </GlowButton>
                    <GlowButton
                      variant="primary"
                      onClick={handlePay}
                      disabled={paying}
                      loading={paying}
                      className="w-full"
                    >
                      {paying ? "Processing..." : `Test: Pay $${amountFormatted}`}
                    </GlowButton>
                    <p className="text-[10px] text-white/30 text-center mt-2">
                      Uses your wallet as the buyer. For testing the full flow only.
                    </p>
                  </GlassCard>
                </>
              )}

              {session && !isSeller && stateNum === 0 && (
                <>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Pay with Naira */}
                  <GlowButton
                    variant="secondary"
                    onClick={handleRamp}
                    disabled={ramping}
                    loading={ramping}
                    className="w-full"
                  >
                    {ramping ? "Setting up..." : "🇳🇬 Pay with Naira"}
                  </GlowButton>

                  {/* Pay with USDT */}
                  <GlowButton
                    variant="primary"
                    onClick={handlePay}
                    disabled={paying}
                    loading={paying}
                    className="w-full"
                  >
                    {paying ? "Processing..." : `Pay $${amountFormatted}`}
                  </GlowButton>

                  <p className="text-xs text-white/40 text-center">
                    Your funds are held securely until delivery is complete.
                  </p>
                </>
              )}

              {stateNum === 1 && (
                <GlassCard className="text-center py-6 border-[#35D07F]/30">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-[#35D07F] font-medium">Funded — In Progress</p>
                  <p className="text-white/60 text-sm mt-1">
                    {isClient
                      ? "You funded this escrow. Release payment after delivery, or raise a dispute."
                      : "Funds are held securely. The seller will deliver your item or service."}
                  </p>

                  {/* Show actions for depositor when funded */}
                  {isClient && (
                    <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10">
                      <GlowButton
                        variant="primary"
                        onClick={handleRelease}
                        disabled={releasing}
                        loading={releasing}
                        className="w-full"
                      >
                        {releasing ? "Releasing..." : "Release Payment to Seller"}
                      </GlowButton>
                      <button
                        onClick={handleDispute}
                        disabled={disputing}
                        className="text-sm text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        {disputing ? "Raising..." : "Raise a Dispute"}
                      </button>
                    </div>
                  )}
                </GlassCard>
              )}

              {stateNum === 2 && (
                <GlassCard className="text-center py-6 border-blue-500/30">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-blue-400 font-medium">Complete</p>
                  <p className="text-white/60 text-sm mt-1">
                    Payment has been released to the seller.
                  </p>
                  {releasedTxHash && (
                    <a
                      href={explorerTxUrl(releasedTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#35D07F] hover:underline mt-3 inline-block"
                    >
                      View Receipt on CeloScan ↗
                    </a>
                  )}
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
