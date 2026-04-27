"use client";
import { useAccount } from "wagmi";
import { useMiniPay } from "@/hooks/useMiniPay";
import Link from "next/link";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isMiniPay, detected } = useMiniPay();

  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">EscrowHubs</h1>
        <p className="text-gray-500 text-sm mt-1">Pay when the job is done</p>
      </div>

      {/* Wallet status */}
      {detected && (
        <div className="mb-6">
          {isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-800 font-medium">
                {address?.slice(0, 6)}...{address?.slice(-4)} · Celo
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-800">
                {isMiniPay
                  ? "Connecting your wallet..."
                  : "Open this app inside MiniPay to connect your wallet"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main actions */}
      <div className="flex flex-col gap-4 mb-8">
        <Link
          href="/create"
          className="bg-green-600 text-white rounded-2xl px-6 py-5 text-center font-semibold text-lg active:bg-green-700 transition-colors shadow-sm"
        >
          💸 Send a Safe Payment
        </Link>
        <Link
          href="/escrows"
          className="bg-white border-2 border-gray-200 text-gray-800 rounded-2xl px-6 py-5 text-center font-semibold text-lg active:bg-gray-50 transition-colors"
        >
          📋 My Payments
        </Link>
      </div>

      {/* How it works — minimal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">How it works</h2>
        <div className="flex flex-col gap-3">
          {[
            { emoji: "🔒", title: "Lock funds", desc: "Your cUSD is held in a smart contract — not by us" },
            { emoji: "✅", title: "Job gets done", desc: "The other party completes the work" },
            { emoji: "💚", title: "Release payment", desc: "You confirm and funds are released instantly" },
            { emoji: "⚖️", title: "Dispute?", desc: "AI reviews the evidence and decides fairly" },
          ].map((step) => (
            <div key={step.title} className="flex gap-3 items-start">
              <span className="text-xl">{step.emoji}</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                <p className="text-gray-500 text-xs">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-auto pt-4">
        Powered by Celo · Funds secured by smart contract
      </p>
    </main>
  );
}
