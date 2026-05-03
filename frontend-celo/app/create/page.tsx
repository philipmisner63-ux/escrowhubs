"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { CONTRACTS, TOKENS, type TokenSymbol } from "@/lib/config";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FactoryABI from "@/abis/EscrowFactory.json";
import { usePhoneResolution } from "@/hooks/usePhoneResolution";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";
import { ConnectWallet } from "@/components/ConnectWallet";

type Step = "form" | "approve" | "create" | "done";

function CreatePageInner() {
  const { address, isConnected } = useAccount();
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // Pre-fill from URL params: ?to=0x...&amount=5&token=cUSD&note=Logo+Design
  const [recipientInput, setRecipientInput] = useState(() => searchParams.get("to") ?? "");
  const [resolvedAddress, setResolvedAddress] = useState<`0x${string}` | null>(() => {
    const to = searchParams.get("to");
    return to?.startsWith("0x") && to.length === 42 ? (to as `0x${string}`) : null;
  });
  const [amount, setAmount] = useState(() => searchParams.get("amount") ?? "");
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>(
    () => (searchParams.get("token") as TokenSymbol) ?? "cUSD"
  );
  const [description, setDescription] = useState(() => searchParams.get("note") ?? "");
  const [step, setStep] = useState<Step>(() => {
    // Only resume if there's an actual pending approve tx hash saved
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem("eh_create_step") as Step;
      const savedHash = localStorage.getItem("eh_approve_hash");
      if (savedStep && savedHash) return savedStep;
      // Clean up stale step with no hash
      localStorage.removeItem("eh_create_step");
    }
    return "form";
  });
  const [error, setError] = useState(() => {
    // Restore last error from localStorage so it survives mobile page reloads
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eh_last_error") ?? "";
      if (saved) {
        localStorage.removeItem("eh_last_error"); // show once
        return saved;
      }
    }
    return "";
  });
  // const [debugLog, setDebugLog] = useState<string[]>([]);  // removed after debugging
  const [createTxHash, setCreateTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [escrowAddress, setEscrowAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resuming, setResuming] = useState(false);

  const { state: phoneState, resolve: resolvePhone, reset: resetPhone } = usePhoneResolution();

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: createEscrow } = useWriteContract();
  const publicClient = usePublicClient();

  const { data: receipt } = useWaitForTransactionReceipt({ hash: createTxHash });

  const resolveTimeout = useRef<NodeJS.Timeout | null>(null);
  // Synchronous re-entry guard — prevents multi-tap creating duplicate escrows
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (!receipt) return;
    const log = receipt.logs.find(
      (l) => l.address.toLowerCase() === CONTRACTS.factory.toLowerCase()
    );
    const topic1 = log?.topics?.[1];
    if (topic1) {
      setEscrowAddress("0x" + topic1.slice(-40));
    }
  }, [receipt]);

  // Auto-resume Step 2 on page load if we have a pending create step
  useEffect(() => {
    if (!isConnected) return;
    const savedStep = localStorage.getItem("eh_create_step");
    const savedHash = localStorage.getItem("eh_approve_hash");
    const savedBeneficiary = localStorage.getItem("eh_beneficiary") as `0x${string}` | null;
    const savedToken = localStorage.getItem("eh_token") as `0x${string}` | null;
    if (savedStep === "create" && savedHash && savedBeneficiary && savedToken && !isSubmitting.current) {
      resumeStep2(savedHash as `0x${string}`, savedBeneficiary, savedToken);
    }
  }, [isConnected]);

  async function resumeStep2(approveHash: `0x${string}`, beneficiary: `0x${string}`, tokenAddress: `0x${string}`) {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setResuming(true);
    setStep("create");
    try {
      // Best-effort wait for approval receipt, then proceed regardless
      if (publicClient) {
        await Promise.race([
          publicClient.waitForTransactionReceipt({ hash: approveHash, confirmations: 1 }),
          new Promise(r => setTimeout(r, 8_000)),
        ]);
      } else {
        await new Promise(r => setTimeout(r, 8_000));
      }

      const hash = await createEscrow({
        address: CONTRACTS.factory,
        abi: FactoryABI as any,
        functionName: "createSimpleEscrow",
        args: [
          beneficiary,
          CONTRACTS.arbiter,
          0,
          false,
          tokenAddress,
          "0x0000000000000000000000000000000000000000",
        ],
        gas: 600000n,
      });

      setCreateTxHash(hash as `0x${string}`);
      localStorage.removeItem("eh_create_step");
      localStorage.removeItem("eh_approve_hash");
      localStorage.removeItem("eh_beneficiary");
      localStorage.removeItem("eh_token");
      setStep("done");
    } catch (err: any) {
      console.error("[EscrowHubs] resumeStep2 error:", err);
      const msg = err?.shortMessage ?? err?.message ?? err?.toString() ?? "Unknown error";
      localStorage.setItem("eh_last_error", `[resume] ${msg}`.slice(0, 500));
      // Temporary: force visible alert so we can read the error on mobile
      if (typeof window !== "undefined") window.alert(`EscrowHubs error:\n${msg.slice(0, 300)}`);
      setError(msg || "Transaction failed. Please try again.");
      setStep("form");
      localStorage.removeItem("eh_create_step");
      localStorage.removeItem("eh_approve_hash");
    } finally {
      isSubmitting.current = false;
      setResuming(false);
    }
  }

  function handleRecipientChange(val: string) {
    setRecipientInput(val);
    setResolvedAddress(null);
    resetPhone();

    if (resolveTimeout.current) clearTimeout(resolveTimeout.current);
    resolveTimeout.current = setTimeout(async () => {
      if (!val.trim()) return;
      const addr = await resolvePhone(val.trim());
      if (addr) setResolvedAddress(addr);
    }, 600);
  }

  const amountWei = amount ? parseUnits(amount, TOKENS[selectedToken].decimals) : 0n;
  const inProgress = step === "approve" || step === "create";

  const effectiveAddress: `0x${string}` | null =
    recipientInput.startsWith("0x") && recipientInput.length === 42
      ? (recipientInput as `0x${string}`)
      : resolvedAddress;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting.current) return; // synchronous guard against multi-tap
    isSubmitting.current = true;
    setError("");

    if (!isConnected || !address) {
      setError(t("create.errorNoWallet"));
      isSubmitting.current = false;
      return;
    }
    if (!effectiveAddress) {
      setError(t("create.errorNoAddress"));
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError(t("create.errorNoAmount"));
      return;
    }
    if (!description.trim()) {
      setError(t("create.errorNoDescription"));
      return;
    }

    try {
      const tokenAddress = TOKENS[selectedToken].address;

      setStep("approve");
      localStorage.setItem("eh_create_step", "approve");
      // Save form args so page-reload resume can reconstruct the Step 2 call
      localStorage.setItem("eh_beneficiary", effectiveAddress);
      localStorage.setItem("eh_token", TOKENS[selectedToken].address);
      const approveTxHash = await approve({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACTS.factory, amountWei],
      });

      // Persist approve hash so mobile can resume after page reload
      if (approveTxHash) {
        localStorage.setItem("eh_approve_hash", approveTxHash as string);
      }

      // Hand off to resumeStep2 which handles the wait + create with proper timeout/retry logic
      isSubmitting.current = false; // resumeStep2 sets it again
      await resumeStep2(
        approveTxHash as `0x${string}`,
        effectiveAddress,
        tokenAddress,
      );
      return; // resumeStep2 handles done/error state
    } catch (err: any) {
      console.error("[EscrowHubs] create error:", err);
      const msg = err?.shortMessage ?? err?.message ?? err?.toString() ?? "Unknown error";
      // Persist error to localStorage so it survives page reloads on mobile
      localStorage.setItem("eh_last_error", `[step:${step}] ${msg}`.slice(0, 500));
      setError(msg || "Transaction failed. Please try again.");
      setStep("form");
      localStorage.removeItem("eh_create_step");
      localStorage.removeItem("eh_approve_hash");
    } finally {
      isSubmitting.current = false;
    }
  }

  async function copyShareLink() {
    if (!escrowAddress) return;
    await navigator.clipboard.writeText(`https://celo.escrowhubs.io/escrow/${escrowAddress}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "done") {
    return (
      <main className="flex flex-col min-h-screen px-5 pt-8 pb-20 max-w-md mx-auto items-center justify-center">
        <div className="text-6xl mb-4">{t("create.doneEmoji")}</div>
        <h1 className="text-2xl font-bold text-white mb-2">{t("create.doneTitle")}</h1>
        <p className="text-white/70 text-center mb-3">{t("create.doneSubtitle")}</p>
        {description && (
          <p className="text-white/80 text-sm text-center italic mb-8">"{description}"</p>
        )}
        {escrowAddress && (
          <div className="w-full mb-4">
            <div className="flex gap-2 mb-2">
              <div className="flex-1 bg-white/10 border border-white/20 text-white/50 rounded-xl px-3 py-2 text-xs truncate">
                celo.escrowhubs.io/escrow/{escrowAddress.slice(0, 12)}...
              </div>
              <button
                onClick={copyShareLink}
                className="bg-white/20 border border-white/20 text-white rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {copied ? t("create.shareCopied") : "Copy"}
              </button>
            </div>
            <button
              onClick={copyShareLink}
              className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-4 font-semibold text-lg flex items-center justify-center gap-2"
            >
              {copied ? t("create.shareCopied") : t("create.shareButton")}
            </button>
          </div>
        )}
        <Link
          href="/escrows"
          className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold text-lg w-full text-center block shadow-lg shadow-green-900/30"
        >
          {t("create.viewPayments")}
        </Link>
        <TrustFooter />
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-5 pt-8 pb-20 max-w-md mx-auto">
      <Link href="/" className="text-white/60 text-sm mb-6 flex items-center gap-1">
        {t("back")}
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">{t("create.pageTitle")}</h1>
      <p className="text-white/60 text-sm mb-8">{t("create.pageSubtitle")}</p>

      {/* Wallet connection — show prominently when not connected */}
      {!isConnected && <ConnectWallet />}

      {/* Resume banner — auto-resume fires on mount; this shows progress + retry option */}
      {isConnected && (step === "approve" || step === "create") && (
        <div className="bg-white/5 border border-[#35D07F]/30 rounded-2xl px-4 py-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {step === "approve" ? "Step 1 of 2 — Approving token..." : "Step 2 of 2 — Creating escrow..."}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {step === "create" ? "Check your wallet for a confirmation prompt." : "Approve the token spend in your wallet."}
              </p>
            </div>
          </div>
          {step === "create" && !resuming && (
            <button
              onClick={() => {
                const h = localStorage.getItem("eh_approve_hash") as `0x${string}`;
                const b = localStorage.getItem("eh_beneficiary") as `0x${string}`;
                const tk = localStorage.getItem("eh_token") as `0x${string}`;
                if (h && b && tk) resumeStep2(h, b, tk);
              }}
              className="mt-3 w-full bg-[#35D07F]/20 border border-[#35D07F]/30 text-[#35D07F] rounded-xl py-2 text-sm font-semibold"
            >
              Retry Step 2
            </button>
          )}
          <button
            onClick={() => {
              localStorage.removeItem("eh_create_step");
              localStorage.removeItem("eh_approve_hash");
              localStorage.removeItem("eh_beneficiary");
              localStorage.removeItem("eh_token");
              isSubmitting.current = false;
              setStep("form");
            }}
            className="mt-2 text-xs text-white/40 hover:text-white/70 underline w-full text-center"
          >
            Cancel and start over
          </button>
        </div>
      )}

      <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Recipient — phone or wallet */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              {t("create.recipientLabel")}
            </label>
            <input
              type="text"
              placeholder={t("create.recipientPlaceholder")}
              value={recipientInput}
              onChange={(e) => handleRecipientChange(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F] transition-colors"
              disabled={inProgress}
              inputMode="tel"
            />

            {/* Resolution feedback */}
            {phoneState.status === "resolving" && (
              <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                <span>{t("create.resolvingWallet")}</span>
              </div>
            )}
            {phoneState.status === "found" && (
              <div className="mt-2 flex items-center gap-1 text-xs text-[#35D07F]">
                ✓ {t("create.resolvedFound")} {resolvedAddress?.slice(0, 8)}...{resolvedAddress?.slice(-6)}
              </div>
            )}
            {phoneState.status === "not-found" && (
              <div className="mt-2 text-xs text-amber-400">
                ⚠ {t("create.resolvedNotFound")}
              </div>
            )}
            {phoneState.status === "error" && (
              <div className="mt-2 text-xs text-[#FF5B5B]">{phoneState.message}</div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              {t("create.amountLabel")}
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-[#35D07F] transition-colors pr-16"
                disabled={inProgress}
                inputMode="decimal"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium text-sm">
                {TOKENS[selectedToken].symbol}
              </span>
            </div>
          </div>

          {/* Token selector */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Token</label>
            <div className="flex gap-2">
              {(Object.keys(TOKENS) as TokenSymbol[]).map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setSelectedToken(token)}
                  disabled={inProgress}
                  className={
                    selectedToken === token
                      ? "bg-[#35D07F]/20 border border-[#35D07F]/40 text-[#35D07F] rounded-full px-4 py-1.5 text-sm font-medium"
                      : "bg-white/5 border border-white/10 text-white/60 rounded-full px-4 py-1.5 text-sm"
                  }
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              {t("create.descriptionLabel")}
            </label>
            <textarea
              placeholder={t("create.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#35D07F] transition-colors resize-none"
              disabled={inProgress}
            />
            <p className="text-xs text-white/40 mt-1">{t("create.descriptionHint")}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 rounded-xl px-4 py-3 text-sm text-[#FF5B5B]">
              {error}
            </div>
          )}



          {/* Progress — explicitly shows 2-step flow so users don't re-tap */}
          {inProgress && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>
                  {step === "approve"
                    ? `Step 1 of 2 — ${t("create.progressApproving")}`
                    : `Step 2 of 2 — ${t("create.progressCreating")}`}
                </span>
              </div>
              <p className="text-xs text-white/40 pl-6">
                {step === "approve"
                  ? "Approve token spend in your wallet, then a second confirmation will follow."
                  : "Confirm the escrow creation in your wallet. Almost done."}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={
              inProgress ||
              !isConnected ||
              !effectiveAddress ||
              phoneState.status === "resolving"
            }
            className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold w-full disabled:opacity-40 shadow-lg shadow-green-900/30 mt-2"
          >
            {inProgress
              ? t("create.submitProcessing")
              : t("create.submitButton", { amount: amount || "0", token: selectedToken })}
          </button>

          <p className="text-xs text-white/40 text-center">{t("create.feeNotice")}</p>
        </form>
      </div>

      <TrustFooter />
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageInner />
    </Suspense>
  );
}
