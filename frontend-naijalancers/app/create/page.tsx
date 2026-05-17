"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS, CUSD, ERC20_APPROVE_ABI, FACTORY_ABI, getFeeCurrency } from "@/lib/contracts";
import { ConnectButton } from "@/components/connect-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import Link from "next/link";

type Step = "form" | "approve" | "create" | "done";

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { showToast } = useToast();

  const [buyerContact, setBuyerContact] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [createTxHash, setCreateTxHash] = useState<`0x${string}` | undefined>();
  const [escrowAddress, setEscrowAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { writeContractAsync: approveToken } = useWriteContract();
  const { writeContractAsync: createEscrow } = useWriteContract();

  const { data: receipt } = useWaitForTransactionReceipt({ hash: createTxHash });

  // Extract escrow address from factory event
  useState(() => {
    if (!receipt) return;
    const log = receipt.logs.find(
      (l) => l.address.toLowerCase() === CONTRACTS.factory.toLowerCase()
    );
    const topic1 = log?.topics?.[1];
    if (topic1) {
      setEscrowAddress("0x" + topic1.slice(-40));
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isConnected || !address) {
      setError("Connect your wallet first");
      return;
    }
    if (!buyerContact.trim()) {
      setError("Enter buyer phone or WhatsApp");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!description.trim()) {
      setError("Enter what you're selling");
      return;
    }

    try {
      const amountWei = parseUnits(amount, 18);
      setStep("approve");

      // Step 1: Approve cUSD spend
      const feeCurrency = getFeeCurrency();
      await approveToken({
        address: CUSD,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [CONTRACTS.factory, amountWei],
        ...(typeof window !== "undefined" ? { feeCurrency: feeCurrency as `0x${string}` } : {}) as any,
      } as any);

      setStep("create");

      // Step 2: Create escrow
      // Note: buyer wallet address is unknown until they fund.
      // We pass seller's own address as beneficiary placeholder; buyer will be set on deposit.
      // Actually, the factory creates with beneficiary. In the simple escrow model,
      // the beneficiary is the seller. The depositor is the buyer.
      // So beneficiary = seller's address.
      const hash = await createEscrow({
        address: CONTRACTS.factory,
        abi: FACTORY_ABI,
        functionName: "createSimpleEscrow",
        args: [
          address, // beneficiary = seller
          CONTRACTS.arbiter,
          0, // trustTier
          false, // useAIArbiter
          CUSD,
          "0x0000000000000000000000000000000000000000", // referrer
        ],
        gas: 1_500_000n,
        ...(typeof window !== "undefined" ? { feeCurrency: feeCurrency as `0x${string}` } : {}) as any,
      } as any);

      setCreateTxHash(hash as `0x${string}`);
      setStep("done");
      showToast("Escrow created! Share the link with your buyer.", "success");

      // Store metadata in backend
      try {
        await fetch("/api/create-escrow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seller_wallet: address,
            buyer_contact: buyerContact,
            amount_fiat: parseFloat(amount),
            amount_cusd: parseFloat(amount),
            currency: "cUSD",
            description,
            chain_id: 42220,
            contract_address: "0x0000000000000000000000000000000000000000", // will update after receipt
            on_chain_escrow_id: "0x0000000000000000000000000000000000000000",
          }),
        });
      } catch {
        // Backend storage is best-effort
      }
    } catch (err: any) {
      console.error("[Create]", err);
      setError(err?.shortMessage ?? err?.message ?? "Transaction failed");
      setStep("form");
    }
  }

  async function copyShareLink() {
    if (!escrowAddress) return;
    const link = `${window.location.origin}/escrow/${escrowAddress}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "done" && escrowAddress) {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">Escrow Created!</h1>
          <p className="text-white/70 text-center mb-3">
            Share this link with your buyer so they can fund it with cUSD.
          </p>
          {description && (
            <p className="text-white/80 text-sm text-center italic mb-8">
              &ldquo;{description}&rdquo;
            </p>
          )}
          <GlassCard className="w-full mb-4">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-white/10 border border-white/20 text-white/50 rounded-xl px-3 py-2 text-xs truncate">
                {window.location.origin}/escrow/{escrowAddress.slice(0, 12)}...
              </div>
              <button
                onClick={copyShareLink}
                className="bg-white/20 border border-white/20 text-white rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <GlowButton variant="primary" onClick={copyShareLink} className="w-full">
              {copied ? "Copied!" : "Copy Link to Share"}
            </GlowButton>
          </GlassCard>
          <Link href="/dashboard" className="text-[#4A9EFF] text-sm mt-4">
            View My Escrows →
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <MarketplaceNav />
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="max-w-lg w-full">
          <h1 className="text-3xl font-bold text-white mb-2">Create Escrow</h1>
          <p className="text-white/60 mb-8">
            Lock cUSD safely until the buyer confirms delivery.
          </p>

          {!isConnected && (
            <GlassCard className="mb-6 text-center py-8">
              <p className="text-white/70 mb-4">Connect your MiniPay wallet to create an escrow</p>
              <ConnectButton />
            </GlassCard>
          )}

          {isConnected && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Buyer Phone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="+234 80 1234 5678"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F]"
                  disabled={step !== "form"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Amount (cUSD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-[#35D07F] pr-16"
                    disabled={step !== "form"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium text-sm">
                    cUSD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  What are you selling?
                </label>
                <textarea
                  placeholder="e.g. iPhone 15 Pro Max, 256GB, Space Black"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F] resize-none"
                  disabled={step !== "form"}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {step !== "form" && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-5 h-5 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-white/70">
                    {step === "approve" ? "Step 1/2: Approving cUSD spend..." : "Step 2/2: Creating escrow..."}
                  </span>
                </div>
              )}

              <GlowButton
                variant="primary"
                type="submit"
                disabled={step !== "form" || !amount || !description || !buyerContact}
                loading={step !== "form"}
                className="w-full"
              >
                {step === "form" ? "Create Escrow" : "Processing..."}
              </GlowButton>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
