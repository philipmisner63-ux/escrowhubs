"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { usePrivy } from "@/components/privy-provider";
import { parseUnits, zeroAddress, createWalletClient, createPublicClient, custom, http } from "viem";
import { base } from "viem/chains";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import type { MarketplaceEscrow } from "@/lib/supabase";

declare global {
  interface Window {
    StripeOnramp?: (key: string) => StripeOnrampInstance;
  }
}

interface StripeOnrampInstance {
  createSession: (opts: {
    clientSecret: string;
    appearance?: { theme?: string };
  }) => StripeSessionEl;
}

interface StripeSessionEl {
  addEventListener: (
    event: string,
    cb: (e: { payload: { session: { status: string } } }) => void
  ) => StripeSessionEl;
  mount: (el: HTMLElement) => void;
}

// Minimal ABIs for the two calls we need
const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// createSimpleEscrow(beneficiary, arbiter, trustTier, useAIArbiter, token, referrer)
// payable — value carries native token amount; for USDC we call with 0 value
const FACTORY_ABI = [
  {
    name: "createSimpleEscrow",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "arbiter", type: "address" },
      { name: "trustTier", type: "uint8" },
      { name: "useAIArbiter", type: "bool" },
      { name: "token", type: "address" },
      { name: "referrer", type: "address" },
    ],
    outputs: [{ name: "escrowOut", type: "address" }],
  },
] as const;

const PROTOCOL_FEE_BPS = 50;
const AI_ARBITER_FEE_USD = 1.0;

function calcFees(amount: number, useArbiter: boolean) {
  const protocolFee = +(amount * (PROTOCOL_FEE_BPS / 10000)).toFixed(4);
  const arbiterFee = useArbiter ? AI_ARBITER_FEE_USD : 0;
  const total = +(amount + protocolFee + arbiterFee).toFixed(4);
  return { protocolFee, arbiterFee, total };
}

type FundStep = "onramp" | "fund" | "done";

export default function EscrowBuyerPage() {
  const params = useParams();
  const escrow_id = params?.escrow_id as string;
  const { addToast } = useToast();
  const { ready, authenticated, login, user, walletAddress, walletProvider } = usePrivy();
  

  const [escrow, setEscrow] = useState<MarketplaceEscrow | null>(null);
  const [loadingEscrow, setLoadingEscrow] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [fundStep, setFundStep] = useState<FundStep>("onramp");
  const [onrampDone, setOnrampDone] = useState(false);
  const [funding, setFunding] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);

  // Stripe onramp
  const onrampRef = useRef<HTMLDivElement>(null);
  const stripeLoaded = useRef(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [onrampLoading, setOnrampLoading] = useState(false);

  // No wagmi — use viem directly with Web3Auth EIP-1193 provider
  const [txPending, setTxPending] = useState(false);

  const userEmail = user?.email ?? "";
  

  // Fetch escrow data
  useEffect(() => {
    if (!escrow_id) return;
    fetch(`/api/marketplace/escrow/${escrow_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return; }
        setEscrow(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingEscrow(false));
  }, [escrow_id]);

  // Auto-skip Stripe if wallet already has enough USDC
  useEffect(() => {
    if (!walletAddress || !escrow || onrampDone) return;
    const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as string;
    if (!usdcAddress) return;
    const needed = escrow.amount_usdc + (escrow.arbitration_enabled ? 1.0 : 0) + escrow.amount_usdc * 0.005;
    const padded = walletAddress.slice(2).toLowerCase().padStart(64, "0");
    const calldata = "0x70a08231" + padded;
    fetch("https://mainnet.base.org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_call", id: 1, params: [{ to: usdcAddress, data: calldata }, "latest"] }),
    })
      .then(r => r.json())
      .then(res => {
        const balance = parseInt(res.result, 16) / 1e6;
        if (balance >= needed) {
          setOnrampDone(true);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, escrow?.escrow_id]);

  // Save buyer wallet address to DB once authenticated + wallet ready
  useEffect(() => {
    if (!walletAddress || !escrow_id || !authenticated) return;
    if (escrow?.buyer_wallet) return; // already saved
    fetch("/api/marketplace/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ escrow_id, buyer_wallet: walletAddress }),
    }).then(() => {
      setEscrow(prev => prev ? { ...prev, buyer_wallet: walletAddress } : prev);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, escrow_id, authenticated]);

  // Load Stripe scripts (only once)
  useEffect(() => {
    if (stripeLoaded.current) return;
    stripeLoaded.current = true;
    const s1 = document.createElement("script");
    s1.src = "https://js.stripe.com/v3/";
    s1.async = true;
    document.head.appendChild(s1);
    const s2 = document.createElement("script");
    s2.src = "https://crypto-js.stripe.com/crypto-onramp-outer.js";
    s2.async = true;
    document.head.appendChild(s2);
  }, []);

  // Mount Stripe widget when clientSecret is available
  useEffect(() => {
    if (!clientSecret || !onrampRef.current) return;
    const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pubKey) return;
    const el = onrampRef.current;

    const tryMount = () => {
      if (window.StripeOnramp) {
        window
          .StripeOnramp(pubKey)
          .createSession({ clientSecret, appearance: { theme: "dark" } })
          .addEventListener("onramp_session_updated", (e) => {
            if (e.payload.session.status === "fulfillment_complete") {
              setOnrampDone(true);
              addToast({ type: "success", message: "Payment complete! Now fund the escrow." });
            }
          })
          .mount(el);
      } else {
        setTimeout(tryMount, 300);
      }
    };
    tryMount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSecret]);



  async function handleStartOnramp() {
    if (!escrow) return;
    setOnrampLoading(true);
    try {
      const fees = calcFees(escrow.amount_fiat, escrow.arbitration_enabled);
      const res = await fetch("/api/create-onramp-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_currency: "usdc",
          destination_network: "base",
          destination_exchange_amount: fees.total.toFixed(2),
          ...(escrow.buyer_wallet && { wallet_address: escrow.buyer_wallet }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start payment");
      setClientSecret(data.clientSecret);
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to start payment" });
    } finally {
      setOnrampLoading(false);
    }
  }

  async function handleFundEscrow() {
    if (!escrow || !walletAddress || !walletProvider) {
      addToast({ type: "error", message: "Wallet not ready. Please wait a moment." });
      return;
    }

    const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
    const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
    const arbiterAddress = process.env.NEXT_PUBLIC_AI_ARBITER_ADDRESS as `0x${string}`;
    const sellerWallet = escrow.seller_wallet as `0x${string}`;
    const amountWei = parseUnits(escrow.amount_usdc.toFixed(6), 6);

    // Ensure Web3Auth wallet is on Base mainnet (chain 0x2105 = 8453)
    try {
      await walletProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }],
      });
    } catch (switchErr: unknown) {
      try {
        await walletProvider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x2105",
            chainName: "Base Mainnet",
            nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          }],
        });
      } catch (_addErr) {
        addToast({ type: "error", message: "Could not switch to Base network. Please try again." });
        setFunding(false);
        setTxPending(false);
        return;
      }
    }

    const walletClient = createWalletClient({
      account: walletAddress as `0x${string}`,
      chain: base,
      transport: custom(walletProvider),
    });
    const publicClient = createPublicClient({
      chain: base,
      transport: http("https://mainnet.base.org"),
    });

    setFunding(true);
    setTxPending(true);
    try {
      // Step 1: approve USDC
      addToast({ type: "pending", message: "Approving USDC spend..." });
      const approveTxHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [factoryAddress, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

      // Step 2: create escrow on-chain
      addToast({ type: "pending", message: "Creating escrow on-chain..." });
      const factoryTxHash = await walletClient.writeContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: "createSimpleEscrow",
        args: [sellerWallet, arbiterAddress, 0, escrow.arbitration_enabled, usdcAddress, zeroAddress],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: factoryTxHash });

      // Step 3: update status in Supabase
      const contractAddress = receipt.contractAddress ?? receipt.to ?? undefined;
      await fetch("/api/marketplace/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrow_id: escrow.escrow_id,
          status: "FUNDED",
          contract_address: contractAddress,
          on_chain_escrow_id: receipt.transactionHash,
        }),
      });

      // Step 4: notify seller
      fetch("/api/marketplace/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrow_id: escrow.escrow_id }),
      });

      setFundStep("done");
      addToast({ type: "success", message: "Funds locked in escrow! The seller will be notified." });
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Transaction failed" });
      setFunding(false);
    } finally {
      setTxPending(false);
    }
  }

  function handleCopyWallet() {
    const addrToCopy = escrow?.buyer_wallet || walletAddress;
    if (!addrToCopy) return;
    navigator.clipboard.writeText(addrToCopy).then(() => {
      setWalletCopied(true);
      addToast({ type: "success", message: "Wallet address copied!" });
      setTimeout(() => setWalletCopied(false), 3000);
    });
  }

  const isBuyer =
    !!userEmail && !!escrow?.buyer_email &&
    userEmail.toLowerCase() === escrow.buyer_email.toLowerCase();

  const fees = escrow ? calcFees(escrow.amount_fiat, escrow.arbitration_enabled) : null;
  const isAlreadyFunded = escrow?.status === "FUNDED" || escrow?.status === "RELEASED";

  if (loadingEscrow) {
    return (
      <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
        <AnimatedBackground />
        <MarketplaceNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
      <AnimatedBackground />
      <MarketplaceNav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
            Protected Escrow Payment
          </span>
          <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-slate-400 text-sm">
            Funds are locked on-chain until you confirm delivery.
          </p>
        </div>

        {/* Not found */}
        {notFound && (
          <GlassCard className="p-8 text-center space-y-4">
            <div className="text-4xl">❌</div>
            <h2 className="text-lg font-semibold">Escrow Not Found</h2>
            <p className="text-slate-400 text-sm">
              This escrow link is invalid or has expired. Please contact the seller.
            </p>
          </GlassCard>
        )}

        {/* Already funded */}
        {!notFound && escrow && isAlreadyFunded && (
          <GlassCard className="p-8 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-lg font-semibold">Escrow Already Funded</h2>
            <p className="text-slate-400 text-sm">
              This escrow has already been funded. Status: <strong className="text-white">{escrow.status}</strong>
            </p>
          </GlassCard>
        )}

        {/* Loading while Web3Auth initializes — prevents premature login gate flash */}
        {!notFound && escrow && !isAlreadyFunded && !ready && (
          <GlassCard className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm mt-4">Checking your session...</p>
          </GlassCard>
        )}

        {/* Login gate */}
        {!notFound && escrow && !isAlreadyFunded && ready && !authenticated && (
          <GlassCard className="p-8 text-center space-y-5">
            <div className="text-4xl">✉️</div>
            <h2 className="text-lg font-semibold text-white">Sign in to pay</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Sign in with your email to access this payment. Use the same email the seller sent the invitation to.
            </p>
            <GlowButton onClick={login} className="w-full">
              Continue with Email →
            </GlowButton>
          </GlassCard>
        )}

        {/* Wrong buyer */}
        {!notFound && escrow && !isAlreadyFunded && ready && authenticated && !isBuyer && (
          <GlassCard className="p-8 text-center space-y-4">
            <div className="text-4xl">🚫</div>
            <h2 className="text-lg font-semibold">Not Your Escrow</h2>
            <p className="text-slate-400 text-sm">
              You are signed in as <strong className="text-white">{userEmail}</strong>, but this escrow
              is for a different buyer.
            </p>
            <p className="text-xs text-slate-600">
              Sign in with the email address that received the invitation.
            </p>
          </GlassCard>
        )}

        {/* Payment flow */}
        {!notFound && escrow && !isAlreadyFunded && ready && authenticated && isBuyer && (
          <div className="space-y-5">
            {/* Escrow summary */}
            <GlassCard className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Escrow Summary
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Seller</span>
                  <span className="text-white">{escrow.seller_email}</span>
                </div>
                {escrow.description && (
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-slate-400 flex-shrink-0">Description</span>
                    <span className="text-white text-right">{escrow.description}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white font-semibold">${escrow.amount_fiat.toFixed(2)} USDC</span>
                </div>
              </div>

              {/* Fee breakdown */}
              {fees && (
                <div className="px-3 py-2 rounded-lg bg-white/3 border border-white/8 space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Escrow amount</span>
                    <span>${escrow.amount_fiat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Protocol fee (0.5%)</span>
                    <span>${fees.protocolFee.toFixed(2)}</span>
                  </div>
                  {escrow.arbitration_enabled && (
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>AI Arbiter fee</span>
                      <span>~${fees.arbiterFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-white font-semibold border-t border-white/10 pt-1 mt-1">
                    <span>Total you pay</span>
                    <span>${fees.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* AI Arbiter badge */}
              {escrow.arbitration_enabled && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                  <span>🤖</span>
                  <span>AI Dispute Protection active — disputes resolved within 48h</span>
                </div>
              )}
            </GlassCard>

            {/* Done state */}
            {fundStep === "done" && (
              <GlassCard className="p-8 text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <h2 className="text-xl font-bold text-white">Funds Locked in Escrow!</h2>
                <p className="text-slate-400 text-sm">
                  Your payment is secured. The seller has been notified and will ship your item.
                  Once you receive it, release the funds from your dashboard.
                </p>
                <GlowButton
                  onClick={() => (window.location.href = "/en/marketplace/dashboard")}
                  className="w-full"
                >
                  View Dashboard →
                </GlowButton>
              </GlassCard>
            )}

            {/* Onramp + fund flow */}
            {fundStep !== "done" && (
              <GlassCard className="p-6 space-y-5">
                {/* Step 1: Copy wallet */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-semibold text-white">Copy your wallet address</h3>
                  </div>
                  <p className="text-xs text-slate-400 ml-8">
                    Stripe will ask for your wallet address. Copy it below and paste it in the payment form.
                  </p>
                  {(escrow.buyer_wallet || walletAddress) && (
                    <div className="ml-8 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                      <span className="text-xs text-slate-300 font-mono flex-1 truncate">
                        {escrow.buyer_wallet || walletAddress}
                      </span>
                      <button
                        onClick={handleCopyWallet}
                        className={`text-xs px-3 py-1.5 rounded-lg flex-shrink-0 font-medium transition-colors ${
                          walletCopied
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                        }`}
                      >
                        {walletCopied ? "✓ Copied!" : "📋 Copy"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 2: Stripe Onramp */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      Buy USDC with card
                      {onrampDone && (
                        <span className="ml-2 text-green-400 text-xs">✓ Complete</span>
                      )}
                    </h3>
                  </div>

                  {!clientSecret && !onrampDone && (
                    <div className="ml-8 space-y-2">
                      <GlowButton
                        onClick={handleStartOnramp}
                        loading={onrampLoading}
                        disabled={onrampLoading}
                        variant="secondary"
                        className="w-full"
                      >
                        {onrampLoading ? "Loading payment..." : `Pay $${fees?.total.toFixed(2) ?? "..."} with Card →`}
                      </GlowButton>
                      <button
                        onClick={() => setOnrampDone(true)}
                        className="w-full text-xs text-slate-500 hover:text-cyan-400 transition-colors py-1"
                      >
                        I already have USDC → skip to Fund Escrow
                      </button>
                    </div>
                  )}

                  {clientSecret && !onrampDone && (
                    <div
                      ref={onrampRef}
                      id="onramp-element"
                      className="rounded-xl overflow-hidden min-h-[500px] bg-white/5 border border-white/10"
                    />
                  )}
                </div>

                {/* Step 3: Fund Escrow */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center ${
                      onrampDone
                        ? "bg-green-500/20 border-green-500/30 text-green-400"
                        : "bg-white/5 border-white/10 text-slate-500"
                    }`}>
                      3
                    </span>
                    <h3 className={`text-sm font-semibold ${onrampDone ? "text-white" : "text-slate-500"}`}>
                      Fund the escrow
                    </h3>
                  </div>
                  {onrampDone && (
                    <div className="ml-8 space-y-3">
                      <p className="text-xs text-slate-400">
                        Click below to lock your USDC in the smart contract escrow on Base.
                      </p>
                      <GlowButton
                        onClick={handleFundEscrow}
                        loading={funding || txPending}
                        disabled={funding || txPending}
                        className="w-full !bg-green-500 !text-black hover:!bg-green-400 !shadow-[0_0_20px_rgba(74,222,128,0.35)]"
                      >
                        {funding || txPending ? "Processing..." : "🔒 Fund Escrow →"}
                      </GlowButton>
                    </div>
                  )}
                  {!onrampDone && (
                    <p className="ml-8 text-xs text-slate-600">
                      Complete the card payment above first.
                    </p>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
