"use client";
import { useState, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { CONTRACTS, CUSD } from "@/lib/config";
import Link from "next/link";
import FactoryABI from "@/abis/EscrowFactory.json";
import { usePhoneResolution } from "@/hooks/usePhoneResolution";

type Step = "form" | "approve" | "create" | "done";

export default function CreatePage() {
  const { address, isConnected } = useAccount();

  const [recipientInput, setRecipientInput] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<`0x${string}` | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");

  const { state: phoneState, resolve: resolvePhone, reset: resetPhone } = usePhoneResolution();

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: createEscrow } = useWriteContract();

  const resolveTimeout = useRef<NodeJS.Timeout | null>(null);

  function handleRecipientChange(val: string) {
    setRecipientInput(val);
    setResolvedAddress(null);
    resetPhone();

    // Debounce resolution by 600ms
    if (resolveTimeout.current) clearTimeout(resolveTimeout.current);
    resolveTimeout.current = setTimeout(async () => {
      if (!val.trim()) return;
      const addr = await resolvePhone(val.trim());
      if (addr) setResolvedAddress(addr);
    }, 600);
  }

  const amountWei = amount ? parseUnits(amount, 18) : 0n;
  const inProgress = step === "approve" || step === "create";

  // The actual address to use — direct wallet address or resolved from phone
  const effectiveAddress: `0x${string}` | null =
    recipientInput.startsWith("0x") && recipientInput.length === 42
      ? recipientInput as `0x${string}`
      : resolvedAddress;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isConnected || !address) {
      setError("Open this in MiniPay to connect your wallet.");
      return;
    }
    if (!effectiveAddress) {
      setError("Enter a valid phone number or wallet address.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter an amount.");
      return;
    }
    if (!description.trim()) {
      setError("Describe what this payment is for.");
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
      await createEscrow({
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

      setStep("done");
    } catch (err: any) {
      setError(err?.shortMessage ?? err?.message ?? "Something went wrong.");
      setStep("form");
    }
  }

  if (step === "done") {
    return (
      <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto items-center justify-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment locked</h1>
        <p className="text-gray-500 text-center mb-8">
          Your cUSD is held safely. Release it when the job is done.
        </p>
        <Link
          href="/escrows"
          className="bg-green-600 text-white rounded-2xl px-6 py-4 font-semibold text-lg w-full text-center block"
        >
          View my payments
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      <Link href="/" className="text-gray-500 text-sm mb-6 flex items-center gap-1">← Back</Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Send a safe payment</h1>
      <p className="text-gray-500 text-sm mb-8">Funds are held until the job is done</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Recipient — phone or wallet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Who are you paying?
          </label>
          <input
            type="text"
            placeholder="+254 712 345 678 or 0x..."
            value={recipientInput}
            onChange={e => handleRecipientChange(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            disabled={inProgress}
            inputMode="tel"
          />

          {/* Resolution feedback */}
          {phoneState.status === "resolving" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Looking up wallet...
            </div>
          )}
          {phoneState.status === "found" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
              ✓ Found — {resolvedAddress?.slice(0, 8)}...{resolvedAddress?.slice(-6)}
            </div>
          )}
          {phoneState.status === "not-found" && (
            <div className="mt-2 text-xs text-amber-700">
              ⚠ No MiniPay wallet found for that number. Ask them to share their wallet address instead.
            </div>
          )}
          {phoneState.status === "error" && (
            <div className="mt-2 text-xs text-red-600">{phoneState.message}</div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (cUSD)
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
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
            What is this for?
          </label>
          <textarea
            placeholder="e.g. Logo design, 3 concepts delivered by Friday"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 resize-none"
            disabled={inProgress}
          />
          <p className="text-xs text-gray-400 mt-1">
            This is stored on-chain and used if there's a dispute
          </p>
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
            {step === "approve" ? "Approving cUSD spend..." : "Creating escrow on Celo..."}
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
            ? "Processing..."
            : `Lock ${amount || "0"} cUSD safely`}
        </button>

        <p className="text-xs text-gray-400 text-center">
          A 0.5% fee is charged when funds are released · Powered by Celo
        </p>
      </form>
    </main>
  );
}
