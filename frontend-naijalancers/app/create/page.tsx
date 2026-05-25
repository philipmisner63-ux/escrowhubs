"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/session-provider";
import { GoogleSignInButton } from "@/components/google-signin";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { WalletQR } from "@/components/wallet-qr";
import { useActiveWallet } from "@/hooks/useActiveWallet";
import Link from "next/link";

// Exchange rate: 1 USDT = 1600 NGN (Awwal's platform rate)
const NGN_PER_USDT = 1600;

// Contract fees (from factory config)
const PROTOCOL_FEE_BPS = 200; // 2%
const PARTNER_FEE_BPS = 40;   // 0.4% (20% of 2%)

function ngnToUsdt(ngn: number): number {
  return ngn / NGN_PER_USDT;
}

function formatNgn(n: number): string {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatUsdt(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Step = "form" | "fund" | "funding_gas" | "approve" | "create" | "confirming" | "done";

const USDT_CELO = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const erc20Abi = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

async function checkBalance(address: string): Promise<{ usdt: string; celo: string }> {
  const { createPublicClient, http, formatEther } = await import("viem");
  const { celo } = await import("viem/chains");
  const client = createPublicClient({ chain: celo, transport: http("https://rpc.ankr.com/celo") });
  
  const [celoBal, usdtBal] = await Promise.all([
    client.getBalance({ address: address as `0x${string}` }),
    client.readContract({ address: USDT_CELO, abi: erc20Abi, functionName: "balanceOf", args: [address as `0x${string}`] }),
  ]);
  
  return {
    celo: parseFloat(formatEther(celoBal)).toFixed(4),
    usdt: (Number(usdtBal) / 1e6).toFixed(2),
  };
}

async function waitForReceipt(txHash: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/wallet/receipt?hash=${txHash}`);
    if (res.ok) {
      const receipt = await res.json();
      if (receipt && receipt.status === "success") return;
      if (receipt && receipt.status === "failed") throw new Error("Transaction failed");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction confirmation timeout");
}

async function sendExternalTx({
  address,
  contract,
  abi,
  method,
  args,
  value,
  isMiniPay,
}: {
  address: string;
  contract: `0x${string}`;
  abi: any;
  method: string;
  args: any[];
  value?: string;
  isMiniPay: boolean;
}): Promise<string> {
  const { createWalletClient, custom, encodeFunctionData } = await import("viem");
  const { celo } = await import("viem/chains");
  const { getFeeCurrency } = await import("@/lib/contracts");

  const walletClient = createWalletClient({
    chain: celo,
    transport: custom(window.ethereum),
  });

  const data = encodeFunctionData({
    abi,
    functionName: method,
    args,
  });

  const txParams: any = {
    account: address as `0x${string}`,
    to: contract,
    data,
  };

  if (value && value !== "0") {
    txParams.value = BigInt(value);
  }

  if (isMiniPay) {
    txParams.feeCurrency = getFeeCurrency();
  }

  const hash = await walletClient.sendTransaction(txParams);
  return hash;
}

export default function CreatePage() {
  const { session } = useSession();
  const { showToast } = useToast();
  const { address: activeAddress, isExternal, isMiniPay } = useActiveWallet();

  const [clientContact, setClientContact] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [amountNgn, setAmountNgn] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [createTxHash, setCreateTxHash] = useState<string | undefined>();
  const [escrowAddress, setEscrowAddress] = useState<string | null>(null);
  const [supabaseEscrowId, setSupabaseEscrowId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const amountNgnNum = parseFloat(amountNgn) || 0;
  const amountUsdt = ngnToUsdt(amountNgnNum);
  const protocolFee = amountUsdt * (PROTOCOL_FEE_BPS / 10000);
  const partnerFee = amountUsdt * (PARTNER_FEE_BPS / 10000);
  const sellerReceives = amountUsdt - protocolFee;

  // Poll for transaction receipt
  useEffect(() => {
    if (!createTxHash || escrowAddress) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/wallet/receipt?hash=${createTxHash}`);
        if (!res.ok) return;
        const receipt = await res.json();
        if (receipt && receipt.status === "success") {
          clearInterval(interval);

          // Extract escrow address from factory SimpleEscrowCreated event
          const { CONTRACTS } = await import("@/lib/contracts");
          const factoryLower = CONTRACTS.factory.toLowerCase();
          const simpleEscrowTopic = "0x3c14757009bd552ee12509c68577aef24fd027570e83ecacf93182b08a681d74";
          const log = receipt.logs.find(
            (l: any) => l.address.toLowerCase() === factoryLower && l.topics?.[0] === simpleEscrowTopic
          );
          const topic1 = log?.topics?.[1];
          if (!topic1) return;

          const realAddress = "0x" + topic1.slice(-40);
          setEscrowAddress(realAddress);
          showToast("Payment request created!", "success");

          if (supabaseEscrowId) {
            fetch("/api/update-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                escrow_id: supabaseEscrowId,
                contract_address: realAddress,
                on_chain_escrow_id: realAddress,
                status: "PENDING_PAYMENT",
              }),
            }).catch((err) => console.error("[Create] Failed to update:", err));
          }
        }
      } catch (e) {
        // polling error, retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [createTxHash, escrowAddress, supabaseEscrowId, showToast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!session) {
      setError("Please sign in first");
      return;
    }
    if (!clientContact.trim()) {
      setError("Enter buyer's phone or WhatsApp");
      return;
    }
    if (!buyerEmail.trim() || !buyerEmail.includes("@")) {
      setError("Enter a valid buyer email");
      return;
    }
    if (!amountNgnNum || amountNgnNum <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!description.trim()) {
      setError("Describe what you're delivering");
      return;
    }

    // Check wallet balance first
    setStep("fund");
    try {
      const bal = await checkBalance(activeAddress!);
      
      // No USDT — show fund step
      if (parseFloat(bal.usdt) <= 0) {
        setStep("fund");
        return;
      }
      
      // Has USDT but low CELO for gas — auto-fund
      if (parseFloat(bal.celo) < 0.01) {
        setStep("funding_gas");
        const fundRes = await fetch("/api/fund-gas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: activeAddress }),
        });
        const fundJson = await fundRes.json();
        if (!fundJson.success) {
          throw new Error(fundJson.error || "Failed to fund gas");
        }
        if (fundJson.funded) {
          showToast(`Funded 0.05 CELO for gas`, "success");
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Balance check failed");
      setStep("form");
      return;
    }

    try {
      const { parseUnits } = await import("viem");
      const { CONTRACTS, ESCROW_TOKEN, TOKEN_DECIMALS, ERC20_APPROVE_ABI, FACTORY_ABI } = await import("@/lib/contracts");

      const amountWei = parseUnits(amountUsdt.toFixed(6), TOKEN_DECIMALS).toString();
      setStep("approve");

      let approveTxHash: string;

      if (isExternal) {
        // Client-side signing via MetaMask/Valora/MiniPay
        approveTxHash = await sendExternalTx({
          address: activeAddress!,
          contract: ESCROW_TOKEN,
          abi: ERC20_APPROVE_ABI,
          method: "approve",
          args: [CONTRACTS.factory, amountWei],
          isMiniPay,
        });
      } else {
        // Server-side signing for managed wallets
        const approveRes = await fetch("/api/wallet/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: activeAddress,
            contract: ESCROW_TOKEN,
            abi: ERC20_APPROVE_ABI,
            method: "approve",
            args: [CONTRACTS.factory, amountWei],
          }),
        });

        if (!approveRes.ok) {
          const err = await approveRes.json();
          throw new Error(err.error || "Approval failed");
        }
        const approveResult = await approveRes.json();
        approveTxHash = approveResult.txHash;
      }

      showToast("Payment approved", "success");

      // Wait for approval to be mined before proceeding
      setStep("approve");
      await waitForReceipt(approveTxHash);

      setStep("create");

      // Step 2: Create escrow
      let txHash: string;

      if (isExternal) {
        txHash = await sendExternalTx({
          address: activeAddress!,
          contract: CONTRACTS.factory,
          abi: FACTORY_ABI,
          method: "createSimpleEscrow",
          args: [
            activeAddress!, // beneficiary = seller
            CONTRACTS.arbiter,
            0, // trustTier
            false, // useAIArbiter
            ESCROW_TOKEN,
            "0x7ed3d953ad3ef99f101f4808d4c123052c583282", // Awwal referrer
          ],
          value: "0",
          isMiniPay,
        });
      } else {
        const createRes = await fetch("/api/wallet/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: activeAddress,
            contract: CONTRACTS.factory,
            abi: FACTORY_ABI,
            method: "createSimpleEscrow",
            args: [
              activeAddress, // beneficiary = seller
              CONTRACTS.arbiter,
              0, // trustTier
              false, // useAIArbiter
              ESCROW_TOKEN,
              "0x7ed3d953ad3ef99f101f4808d4c123052c583282", // Awwal referrer
            ],
            value: "0",
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.error || "Payment request failed");
        }

        const createResult = await createRes.json();
        txHash = createResult.txHash;
      }

      setCreateTxHash(txHash);
      setStep("confirming");

      // Store metadata in backend
      try {
        const res = await fetch("/api/create-escrow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seller_wallet: activeAddress,
            seller_email: session.email,
            buyer_email: buyerEmail,
            buyer_contact: clientContact,
            amount_fiat: amountNgnNum,
            amount_cusd: amountUsdt,
            currency: "USDT",
            description,
            chain_id: 42220,
            contract_address: null,
            on_chain_escrow_id: null,
            tx_hash: txHash,
          }),
        });
        const json = await res.json();
        if (json.success && json.escrow?.escrow_id) {
          setSupabaseEscrowId(json.escrow.escrow_id);
        }
      } catch {
        // Backend storage is best-effort
      }
    } catch (err: any) {
      console.error("[Create]", err);
      setError(err?.message ?? "Transaction failed");
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

  if (!session) {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Create Escrow Link</h1>
            <p className="text-white/60 mb-8">
              Create a secure escrow link to share with your buyer.
            </p>
            <GlassCard className="py-8">
              <p className="text-white/70 mb-4">Sign in to get started</p>
              <GoogleSignInButton />
            </GlassCard>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (step === "fund") {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-lg mx-auto w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💳</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Top Up Your Wallet</h1>
            <p className="text-white/60">
              You need USDT in your wallet to create a payment request.
            </p>
          </div>

          <WalletQR
            address={activeAddress!}
            balanceUsdt="0.00"
            balanceCelo="0"
          />

          <div className="mt-4 text-center">
            <button
              onClick={() => setStep("form")}
              className="text-white/40 text-sm hover:text-white/70"
            >
              ← Back to form
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (step === "funding_gas") {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="w-8 h-8 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Getting gas...</h1>
          <p className="text-white/70 text-center">
            Sending CELO to your wallet so you can create the escrow. This takes a few seconds.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  if (step === "confirming" && !escrowAddress) {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="w-8 h-8 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Creating escrow link...</h1>
          <p className="text-white/70 text-center">
            Securing your funds on the network. This may take a few seconds.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  if (step === "confirming" && escrowAddress) {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">Escrow Link Ready!</h1>
          <p className="text-white/70 text-center mb-3">
            Share this link with your buyer — funds are held safely until you deliver.
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
            View My Payments
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
          <h1 className="text-3xl font-bold text-white mb-2">Create Escrow Link</h1>
          <p className="text-white/60 mb-8">
            Create a secure escrow link to share with your buyer.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Buyer's Phone or WhatsApp
              </label>
              <input
                type="text"
                placeholder="+234 80 1234 5678"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F]"
                disabled={step !== "form"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Buyer's Email
              </label>
              <input
                type="email"
                placeholder="buyer@example.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F]"
                disabled={step !== "form"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Amount (NGN)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  min="100"
                  step="100"
                  value={amountNgn}
                  onChange={(e) => setAmountNgn(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-[#35D07F] pr-32"
                  disabled={step !== "form"}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium text-sm">
                  NGN
                </span>
              </div>
              {amountNgnNum > 0 && (
                <p className="text-xs text-white/40 mt-1">
                  ≈ {formatUsdt(amountUsdt)} USDT
                </p>
              )}
            </div>

            {amountNgnNum > 0 && (
              <GlassCard className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Total Request</span>
                  <span className="text-white font-medium">{formatNgn(amountNgnNum)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Platform Fee (2%)</span>
                  <span className="text-amber-400">{formatUsdt(protocolFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Partner Fee (0.4%)</span>
                  <span className="text-amber-400">{formatUsdt(partnerFee)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                  <span className="text-white/70 font-medium">You Receive</span>
                  <span className="text-[#35D07F] font-bold">{formatUsdt(sellerReceives)}</span>
                </div>
                <p className="text-[10px] text-white/30">
                  Fees are deducted from the total. You receive the rest when delivery is confirmed.
                </p>
              </GlassCard>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                What are you selling or delivering?
              </label>
              <textarea
                placeholder="e.g. iPhone 14 Pro 256GB, black. Or: logo design, 3 revisions."
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
                  {step === "approve" ? "Step 1/2: Approving payment..." : "Step 2/2: Securing funds..."}
                </span>
              </div>
            )}

            <GlowButton
              variant="primary"
              type="submit"
              disabled={step !== "form" || !amountNgn || !description || !clientContact || !buyerEmail}
              loading={step !== "form"}
              className="w-full"
            >
              {step === "form" ? "Create Escrow Link" : "Processing..."}
            </GlowButton>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}
