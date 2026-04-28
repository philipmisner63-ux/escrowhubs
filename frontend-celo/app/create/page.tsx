"use client";
import { useState, useRef, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { CONTRACTS, CUSD } from "@/lib/config";
import Link from "next/link";
import FactoryABI from "@/abis/EscrowFactory.json";
import { usePhoneResolution } from "@/hooks/usePhoneResolution";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";

type Step = "form" | "approve" | "create" | "done";

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { t } = useTranslation();

  const [recipientInput, setRecipientInput] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<`0x${string}` | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
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

  const amountWei = amount ? parseUnits(amount, 18) : 0n;
  const inProgress = step === "approve" || step === "create";

  const effectiveAddress: `0x${string}` | null =
    recipientInput.startsWith("0x") && recipientInput.length === 42
      ? (recipientInput as `0x${string}`)
      : resolvedAddress;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isConnected || !address) {
      setError(t("create.errorNoWallet"));
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
      setStep("approve");
      await approve({
        address: CUSD,
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
          CUSD,
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
      <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto items-center justify-center">
        <div className="text-6xl mb-4">{t("create.doneEmoji")}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("create.doneTitle")}</h1>
        <p className="text-gray-500 text-center mb-8">{t("create.doneSubtitle")}</p>
        {escrowAddress && (
          <button
            onClick={copyShareLink}
            className="w-full bg-white border-2 border-green-500 text-green-700 rounded-2xl px-6 py-4 font-semibold text-lg mb-4 flex items-center justify-center gap-2 active:bg-green-50 transition-colors"
          >
            {copied ? t("create.shareCopied") : t("create.shareButton")}
          </button>
        )}
        <Link
          href="/escrows"
          className="bg-green-600 text-white rounded-2xl px-6 py-4 font-semibold text-lg w-full text-center block"
        >
          {t("create.viewPayments")}
        </Link>
        <TrustFooter />
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      <Link href="/" className="text-gray-500 text-sm mb-6 flex items-center gap-1">
        {t("back")}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("create.pageTitle")}</h1>
      <p className="text-gray-500 text-sm mb-8">{t("create.pageSubtitle")}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Recipient — phone or wallet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("create.recipientLabel")}
          </label>
          <input
            type="text"
            placeholder={t("create.recipientPlaceholder")}
            value={recipientInput}
            onChange={(e) => handleRecipientChange(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            disabled={inProgress}
            inputMode="tel"
          />

          {/* Resolution feedback */}
          {phoneState.status === "resolving" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              {t("create.resolvingWallet")}
            </div>
          )}
          {phoneState.status === "found" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
              ✓ {t("create.resolvedFound")} {resolvedAddress?.slice(0, 8)}...{resolvedAddress?.slice(-6)}
            </div>
          )}
          {phoneState.status === "not-found" && (
            <div className="mt-2 text-xs text-amber-700">
              ⚠ {t("create.resolvedNotFound")}
            </div>
          )}
          {phoneState.status === "error" && (
            <div className="mt-2 text-xs text-red-600">{phoneState.message}</div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-green-500 pr-16"
              disabled={inProgress}
              inputMode="decimal"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
              cUSD
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("create.descriptionLabel")}
          </label>
          <textarea
            placeholder={t("create.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 resize-none"
            disabled={inProgress}
          />
          <p className="text-xs text-gray-400 mt-1">{t("create.descriptionHint")}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Progress */}
        {inProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            {step === "approve" ? t("create.progressApproving") : t("create.progressCreating")}
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
          className="bg-green-600 text-white rounded-2xl px-6 py-5 font-semibold text-lg disabled:opacity-40 active:bg-green-700 transition-colors mt-2"
        >
          {inProgress
            ? t("create.submitProcessing")
            : t("create.submitButton", { amount: amount || "0" })}
        </button>

        <p className="text-xs text-gray-400 text-center">{t("create.feeNotice")}</p>
      </form>

      <TrustFooter />
    </main>
  );
}
