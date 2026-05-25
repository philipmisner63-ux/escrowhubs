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

function isValidEthAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

type Step =
  | "form"
  | "fund"
  | "funding_gas"
  | "approve"
  | "create"
  | "confirming"
  | "done"
  | "depositing";

type Mode = "seller" | "buyer";

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

async function extractEscrowAddressFromReceipt(txHash: string): Promise<string> {
  const { createPublicClient, http } = await import("viem");
  const { celo } = await import("viem/chains");
  const client = createPublicClient({ chain: celo, transport: http("https://rpc.ankr.com/celo") });

  const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
  const { CONTRACTS } = await import("@/lib/contracts");
  const factoryLower = CONTRACTS.factory.toLowerCase();
  const simpleEscrowTopic = "0x3c14757009bd552ee12509c68577aef24fd027570e83ecacf93182b08a681d74";

  const log = receipt.logs.find(
    (l: any) => l.address.toLowerCase() === factoryLower && l.topics?.[0] === simpleEscrowTopic
  );
  if (!log?.topics?.[1]) throw new Error("Could not find escrow address in receipt");
  return "0x" + log.topics[1].slice(-40);
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

async function serverExecute({
  userAddress,
  contract,
  abi,
  method,
  args,
  value,
}: {
  userAddress: string;
  contract: `0x${string}`;
  abi: any;
  method: string;
  args: any[];
  value?: string;
}) {
  const res = await fetch("/api/wallet/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress, contract, abi, method, args, value }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `${method} failed`);
  }
  return res.json();
}

export default function CreatePage() {
  const { session } = useSession();
  const { showToast } = useToast();
  const { address: activeAddress, isExternal, isMiniPay } = useActiveWallet();

  const [mode, setMode] = useState<Mode>("seller");
  const [counterpartyContact, setCounterpartyContact] = useState("");
  const [counterpartyEmail, setCounterpartyEmail] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
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
  const netReceives = amountUsdt - protocolFee - partnerFee;

  // Poll for transaction receipt (handles both create and deposit)
  useEffect(() => {
    if (!createTxHash || escrowAddress) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/wallet/receipt?hash=${createTxHash}`);
        if (!res.ok) return;
        const receipt = await res.json();
        if (receipt && receipt.status === "success") {
          clearInterval(interval);
          try {
            // For seller mode, extract escrow from receipt and show share link
            // For buyer mode, the escrow address is already extracted synchronously
            if (mode === "seller") {
              const realAddress = await extractEscrowAddressFromReceipt(createTxHash);
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
            console.error("[Create] Failed to extract address:", e);
          }
        }
      } catch {
        // polling error, retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [createTxHash, escrowAddress, supabaseEscrowId, showToast, mode]);

  function validateForm(): string | null {
    if (!session) return "Please sign in first";
    if (!counterpartyContact.trim()) {
      return mode === "seller"
        ? "Enter buyer's phone or WhatsApp"
        : "Enter seller's phone or WhatsApp";
    }
    if (!counterpartyEmail.trim() || !counterpartyEmail.includes("@")) {
      return mode === "seller"
        ? "Enter a valid buyer email"
        : "Enter a valid seller email";
    }
    if (mode === "buyer" && !isValidEthAddress(sellerAddress)) {
      return "Enter a valid seller wallet address";
    }
    if (!amountNgnNum || amountNgnNum <= 0) {
      return "Enter a valid amount";
    }
    if (!description.trim()) {
      return "Describe what is being delivered";
    }
    return null;
  }

  // ── Seller: create escrow, share link (buyer funds later) ──
  async function handleSellerFlow() {
    setStep("create");
    const { CONTRACTS, ESCROW_TOKEN, FACTORY_ABI } = await import("@/lib/contracts");

    const createArgs = [
      activeAddress!,        // beneficiary = seller
      CONTRACTS.arbiter,     // arbiter
      0,                     // trustTier
      false,                 // useAIArbiter
      ESCROW_TOKEN,          // token
      "0x7ed3d953ad3ef99f101f4808d4c123052c583282", // Awwal referrer
    ];

    let txHash: string;
    if (isExternal) {
      txHash = await sendExternalTx({
        address: activeAddress!,
        contract: CONTRACTS.factory,
        abi: FACTORY_ABI,
        method: "createSimpleEscrow",
        args: createArgs,
        value: "0",
        isMiniPay,
      });
    } else {
      const result = await serverExecute({
        userAddress: activeAddress!,
        contract: CONTRACTS.factory,
        abi: FACTORY_ABI,
        method: "createSimpleEscrow",
        args: createArgs,
        value: "0",
      });
      txHash = result.txHash;
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
          seller_email: session!.email,
          buyer_email: counterpartyEmail,
          buyer_contact: counterpartyContact,
          amount_fiat: amountNgnNum,
          amount_cusd: amountUsdt,
          currency: "USDT",
          description,
          chain_id: 42220,
          contract_address: null,
          on_chain_escrow_id: null,
          tx_hash: txHash,
          initiator_is_buyer: false,
        }),
      });
      const json = await res.json();
      if (json.success && json.escrow?.escrow_id) {
        setSupabaseEscrowId(json.escrow.escrow_id);
      }
    } catch {
      // Backend storage is best-effort
    }
  }

  // ── Buyer: create escrow + approve + deposit ──
  async function handleBuyerFlow() {
    const { parseUnits } = await import("viem");
    const { CONTRACTS, ESCROW_TOKEN, TOKEN_DECIMALS, ERC20_APPROVE_ABI, FACTORY_ABI } = await import("@/lib/contracts");
    const EscrowABI = (await import("@/lib/abi-SimpleEscrow.json")).default;

    const amountWei = parseUnits(amountUsdt.toFixed(6), TOKEN_DECIMALS).toString();

    // 1) Create escrow (buyer is depositor, seller is beneficiary)
    setStep("create");
    const createArgs = [
      sellerAddress,         // beneficiary = seller
      CONTRACTS.arbiter,     // arbiter
      0,                     // trustTier
      false,                 // useAIArbiter
      ESCROW_TOKEN,          // token
      "0x7ed3d953ad3ef99f101f4808d4c123052c583282", // Awwal referrer
    ];

    let txHash: string;
    if (isExternal) {
      txHash = await sendExternalTx({
        address: activeAddress!,
        contract: CONTRACTS.factory,
        abi: FACTORY_ABI,
        method: "createSimpleEscrow",
        args: createArgs,
        value: "0",
        isMiniPay,
      });
    } else {
      const result = await serverExecute({
        userAddress: activeAddress!,
        contract: CONTRACTS.factory,
        abi: FACTORY_ABI,
        method: "createSimpleEscrow",
        args: createArgs,
        value: "0",
      });
      txHash = result.txHash;
    }

    setCreateTxHash(txHash);
    setStep("confirming");

    // Wait for receipt to get escrow address
    await waitForReceipt(txHash);
    const escrowAddr = await extractEscrowAddressFromReceipt(txHash);
    setEscrowAddress(escrowAddr);

    // 2) Approve escrow contract to spend buyer's tokens
    setStep("approve");
    let approveTxHash: string;
    if (isExternal) {
      approveTxHash = await sendExternalTx({
        address: activeAddress!,
        contract: ESCROW_TOKEN,
        abi: ERC20_APPROVE_ABI,
        method: "approve",
        args: [escrowAddr, amountWei],
        isMiniPay,
      });
    } else {
      const result = await serverExecute({
        userAddress: activeAddress!,
        contract: ESCROW_TOKEN,
        abi: ERC20_APPROVE_ABI,
        method: "approve",
        args: [escrowAddr, amountWei],
      });
      approveTxHash = result.txHash;
    }
    await waitForReceipt(approveTxHash);

    // 3) Deposit into the escrow
    setStep("depositing");
    let depositTxHash: string;
    if (isExternal) {
      depositTxHash = await sendExternalTx({
        address: activeAddress!,
        contract: escrowAddr as `0x${string}`,
        abi: EscrowABI,
        method: "deposit",
        args: [amountWei],
        value: "0",
        isMiniPay,
      });
    } else {
      const result = await serverExecute({
        userAddress: activeAddress!,
        contract: escrowAddr as `0x${string}`,
        abi: EscrowABI,
        method: "deposit",
        args: [amountWei],
        value: "0",
      });
      depositTxHash = result.txHash;
    }

    await waitForReceipt(depositTxHash);
    setStep("done");
    showToast("Payment secured in escrow!", "success");

    // 4) Store in backend (already funded)
    try {
      const res = await fetch("/api/create-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_wallet: sellerAddress,
          seller_email: counterpartyEmail,
          buyer_email: session!.email,
          buyer_contact: counterpartyContact,
          amount_fiat: amountNgnNum,
          amount_cusd: amountUsdt,
          currency: "USDT",
          description,
          chain_id: 42220,
          contract_address: escrowAddr,
          on_chain_escrow_id: escrowAddr,
          tx_hash: txHash,
          initiator_is_buyer: true,
        }),
      });
      const json = await res.json();
      if (json.success && json.escrow?.escrow_id) {
        setSupabaseEscrowId(json.escrow.escrow_id);
      }
    } catch {
      // best-effort
    }

    // Update to FUNDED
    if (supabaseEscrowId) {
      fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrow_id: supabaseEscrowId,
          contract_address: escrowAddr,
          on_chain_escrow_id: escrowAddr,
          status: "FUNDED",
          buyer_wallet: activeAddress,
        }),
      }).catch((err) => console.error("[Create] Failed to update:", err));
    }
  }

  // ── Main submit handler ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Gas funding step
    if (mode === "seller") {
      setStep("fund");
      try {
        const bal = await checkBalance(activeAddress!);
        if (parseFloat(bal.celo) < 0.01) {
          setStep("funding_gas");
          const fundRes = await fetch("/api/fund-gas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: activeAddress }),
          });
          const fundJson = await fundRes.json();
          if (!fundJson.success) throw new Error(fundJson.error || "Failed to fund gas");
          if (fundJson.funded) showToast("Funded 0.05 CELO for gas", "success");
        }
      } catch (err: any) {
        setError(err?.message ?? "Balance check failed");
        setStep("form");
        return;
      }
      await handleSellerFlow();
    } else {
      setStep("fund");
      try {
        const bal = await checkBalance(activeAddress!);
        if (parseFloat(bal.usdt) < amountUsdt) {
          setStep("fund");
          return; // Show top-up screen
        }
        if (parseFloat(bal.celo) < 0.01) {
          setStep("funding_gas");
          const fundRes = await fetch("/api/fund-gas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: activeAddress }),
          });
          const fundJson = await fundRes.json();
          if (!fundJson.success) throw new Error(fundJson.error || "Failed to fund gas");
          if (fundJson.funded) showToast("Funded 0.05 CELO for gas", "success");
        }
      } catch (err: any) {
        setError(err?.message ?? "Balance check failed");
        setStep("form");
        return;
      }
      await handleBuyerFlow();
    }
  }

  async function copyShareLink() {
    if (!escrowAddress) return;
    const link = `${window.location.origin}/escrow/${escrowAddress}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Not signed in ──
  if (!session) {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Safe Payment</h1>
            <p className="text-white/60 mb-8">
              Create a secure payment link or pay a seller directly.
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

  // ── Fund step (need USDT) — buyer mode only ──
  if (step === "fund" && mode === "buyer") {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-lg mx-auto w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💳</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Top Up Your Account</h1>
            <p className="text-white/60">
              You need {formatUsdt(amountUsdt)} USDT to make this payment.
            </p>
          </div>
          <WalletQR address={activeAddress!} balanceUsdt="0.00" balanceCelo="0" />
          <div className="mt-4 text-center">
            <button onClick={() => setStep("form")} className="text-white/40 text-sm hover:text-white/70">
              ← Back to form
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Gas funding spinner (both modes)
  if (step === "funding_gas") {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="w-8 h-8 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Getting gas...</h1>
          <p className="text-white/70 text-center">
            Sending CELO to your account so you can proceed. This takes a few seconds.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Confirming state ──
  if (step === "confirming" && !escrowAddress) {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="w-8 h-8 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === "buyer" ? "Setting up secure payment…" : "Creating payment request…"}
          </h1>
          <p className="text-white/70 text-center">
            {mode === "buyer"
              ? "Creating escrow and preparing your deposit. This takes a few seconds."
              : "Preparing your secure payment link. This takes a few seconds."}
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Done state (buyer mode after deposit succeeds) ──
  if (step === "done" && escrowAddress) {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Secured!</h1>
          <p className="text-white/70 text-center mb-3">
            Funds are held safely. Share this link with the seller so they can track and confirm delivery.
          </p>
          {description && (
            <p className="text-white/80 text-sm text-center italic mb-8">
              &ldquo;{description}&rdquo;
            </p>
          )}
          <GlassCard className="w-full mb-4">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-white/10 border border-white/20 text-white/50 rounded-xl px-3 py-2 text-xs truncate">
                {typeof window !== "undefined" ? window.location.origin : ""}/escrow/{escrowAddress.slice(0, 12)}...
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

  // ── Seller success state (escrow created, not yet funded) ──
  if (step === "confirming" && escrowAddress && mode === "seller") {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Request Ready!</h1>
          <p className="text-white/70 text-center mb-3">
            Share this link with your buyer — funds are held safely until delivery is confirmed.
          </p>
          {description && (
            <p className="text-white/80 text-sm text-center italic mb-8">
              &ldquo;{description}&rdquo;
            </p>
          )}
          <GlassCard className="w-full mb-4">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-white/10 border border-white/20 text-white/50 rounded-xl px-3 py-2 text-xs truncate">
                {typeof window !== "undefined" ? window.location.origin : ""}/escrow/{escrowAddress.slice(0, 12)}...
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

  // ── Intermediate spinners ──
  if (step === "depositing") {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="w-8 h-8 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Securing payment…</h1>
          <p className="text-white/70 text-center">Depositing funds into escrow. Almost done.</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (step === "approve") {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="w-8 h-8 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Approving deposit…</h1>
          <p className="text-white/70 text-center">Authorizing the escrow contract to hold your funds safely.</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (step === "create") {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto">
          <div className="w-8 h-8 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === "buyer" ? "Creating escrow…" : "Creating payment link…"}
          </h1>
          <p className="text-white/70 text-center">
            {mode === "buyer" ? "Setting up a secure escrow between you and the seller." : "Preparing your secure payment link."}
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Main form ──
  return (
    <main className="flex flex-col min-h-screen">
      <MarketplaceNav />
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="max-w-lg w-full">
          <h1 className="text-3xl font-bold text-white mb-2">Safe Payment</h1>
          <p className="text-white/60 mb-6">
            Create a secure payment link or send money directly.
          </p>

          {/* Mode toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => setMode("seller")}
              className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${
                mode === "seller"
                  ? "bg-[#35D07F]/20 text-[#35D07F] border border-[#35D07F]/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              I'm Selling
            </button>
            <button
              type="button"
              onClick={() => setMode("buyer")}
              className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${
                mode === "buyer"
                  ? "bg-[#4A9EFF]/20 text-[#4A9EFF] border border-[#4A9EFF]/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              I'm Buying
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Seller address — buyer mode only */}
            {mode === "buyer" && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Seller's Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F] font-mono text-sm"
                  disabled={step !== "form"}
                />
                <p className="text-[10px] text-white/30 mt-1">
                  Ask the seller for their EscrowHubs account address.
                </p>
              </div>
            )}

            {/* Counterparty contact */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {mode === "seller" ? "Buyer's Phone or WhatsApp" : "Seller's Phone or WhatsApp"}
              </label>
              <input
                type="text"
                placeholder="+234 80 1234 5678"
                value={counterpartyContact}
                onChange={(e) => setCounterpartyContact(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F]"
                disabled={step !== "form"}
              />
            </div>

            {/* Counterparty email */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {mode === "seller" ? "Buyer's Email" : "Seller's Email"}
              </label>
              <input
                type="email"
                placeholder={mode === "seller" ? "buyer@example.com" : "seller@example.com"}
                value={counterpartyEmail}
                onChange={(e) => setCounterpartyEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F]"
                disabled={step !== "form"}
              />
            </div>

            {/* Amount */}
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

            {/* Fee breakdown */}
            {amountNgnNum > 0 && (
              <GlassCard className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">{mode === "seller" ? "Total Request" : "You Pay"}</span>
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
                  <span className="text-white/70 font-medium">
                    {mode === "seller" ? "You Receive" : "Seller Receives"}
                  </span>
                  <span className="text-[#35D07F] font-bold">{formatUsdt(netReceives)}</span>
                </div>
                <p className="text-[10px] text-white/30">
                  Fees are deducted from the total when payment is released.
                </p>
              </GlassCard>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                What is being delivered?
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

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Processing indicator */}
            {step !== "form" && (step === "approve" || step === "depositing" || step === "confirming" || step === "create" || step === "fund" || step === "funding_gas") && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="w-5 h-5 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-white/70">
                  {mode === "buyer"
                    ? step === "approve"
                      ? "Approving deposit…"
                      : step === "depositing"
                      ? "Securing payment…"
                      : "Creating escrow…"
                    : "Creating payment link…"}
                </span>
              </div>
            )}

            <GlowButton
              variant="primary"
              type="submit"
              disabled={step !== "form" || !amountNgn || !description || !counterpartyContact || !counterpartyEmail || (mode === "buyer" && !sellerAddress)}
              loading={step !== "form"}
              className="w-full"
            >
              {mode === "seller" ? "Create Payment Link" : "Secure Payment"}
            </GlowButton>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}
