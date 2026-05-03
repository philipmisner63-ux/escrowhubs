"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [createTxHash, setCreateTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [escrowAddress, setEscrowAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { state: phoneState, resolve: resolvePhone, reset: resetPhone } = usePhoneResolution();

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: createEscrow } = useWriteContract();

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
      await approve({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACTS.factory, amountWei],
      });

      setStep("create");
      const hash = await createEscrow({
        address: CONTRACTS.factory,
        abi: FactoryABI as any,
        functionName: "createSimpleEscrow",
        args: [
          effectiveAddress,
          tokenAddress,
          amountWei,
          description.trim(),
          "0x0000000000000000000000000000000000000000",
        ],
        gas: 500000n,
      });
      setCreateTxHash(hash);

      setStep("done");
    } catch (err: any) {
      setError(err?.shortMessage ?? err?.message ?? t("create.errorGeneric"));
      setStep("form");
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
