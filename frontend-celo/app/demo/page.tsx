"use client";
import { useState } from "react";
import Link from "next/link";
import { TrustFooter } from "@/components/TrustFooter";

const TOTAL_STEPS = 4;

// ─── Step mockups ────────────────────────────────────────────────────────────

function StepHome() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <div>
          <span className="text-sm text-green-800 font-medium">0x71C7...3a2F · Celo</span>
          <p className="text-xs text-green-600 mt-0.5">Balance: 12.50 cUSD</p>
        </div>
      </div>
      <button className="bg-green-600 text-white rounded-2xl px-6 py-5 text-center font-semibold text-lg w-full">
        💸 Send a Safe Payment
      </button>
      <button className="bg-white border-2 border-gray-200 text-gray-800 rounded-2xl px-6 py-5 text-center font-semibold text-lg w-full">
        📋 My Payments
      </button>
    </div>
  );
}

function StepCreate() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Who are you paying?</p>
        <div className="border-2 border-green-500 rounded-xl px-4 py-3 bg-white">
          <p className="text-sm text-gray-800">+254 712 345 678</p>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
          ✓ Found — 0xabc...def
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Amount (cUSD)</p>
        <div className="border-2 border-green-500 rounded-xl px-4 py-3 bg-white flex justify-between items-center">
          <p className="text-lg font-semibold text-gray-900">5.00</p>
          <span className="text-gray-400 text-sm">cUSD</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">What is this for?</p>
        <div className="border-2 border-green-500 rounded-xl px-4 py-3 bg-white">
          <p className="text-sm text-gray-800">Logo design — 3 concepts by Friday</p>
        </div>
      </div>
      <button className="bg-green-600 text-white rounded-2xl px-6 py-5 font-semibold text-lg w-full">
        Lock 5.00 cUSD safely
      </button>
    </div>
  );
}

function StepLocked() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-6xl">✅</div>
      <h2 className="text-2xl font-bold text-gray-900">Payment locked</h2>
      <p className="text-gray-500 text-center">
        5.00 cUSD is held safely in the smart contract.
      </p>
      <div className="w-full bg-white border-2 border-green-500 text-green-700 rounded-2xl px-6 py-4 font-semibold text-lg text-center">
        🔗 Share payment link
      </div>
      <p className="text-xs text-gray-400 font-mono break-all text-center">
        celo.escrowhubs.io/escrow/0x4357...2a836
      </p>
    </div>
  );
}

function StepPayments() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Logo design · 5.00 cUSD</p>
            <p className="text-xs text-gray-400">Sent · 0x4357...2a836</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-blue-100 text-blue-700">
          Funded
        </span>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Website copy · 20.00 cUSD</p>
            <p className="text-xs text-gray-400">Sent · 0x1a2b...cd3e</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-green-100 text-green-700">
          Released
        </span>
      </div>
    </div>
  );
}

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Home", title: "EscrowHubs", subtitle: "Pay when the job is done", content: StepHome },
  { label: "Create", title: "Send a safe payment", subtitle: "Funds held until job is done", content: StepCreate },
  { label: "Locked", title: "Payment locked ✅", subtitle: "Share the link with your worker", content: StepLocked },
  { label: "My Payments", title: "My Payments", subtitle: "Track all your escrows", content: StepPayments },
];

// ─── Demo page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];
  const StepContent = currentStep.content;

  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <Link href="/" className="text-xs text-gray-400 underline">
            ← Back to home
          </Link>
          <span className="text-xs text-gray-400">{step + 1}/{TOTAL_STEPS}</span>
        </div>
        <p className="text-xs text-gray-400 text-center">No wallet needed · Tap through the flow</p>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setStep(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === step ? "bg-green-600" : "bg-gray-200"
            }`}
            aria-label={`Go to step ${i + 1}: ${s.label}`}
          />
        ))}
      </div>

      {/* Step header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{currentStep.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{currentStep.subtitle}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 mb-6">
        <StepContent />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-auto pt-4">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl px-6 py-4 font-semibold"
          >
            ← Back
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 bg-green-600 text-white rounded-2xl px-6 py-4 font-semibold"
          >
            Next →
          </button>
        ) : (
          <a
            href="https://minipay.opera.com/open?url=https://celo.escrowhubs.io"
            className="flex-1 bg-green-600 text-white rounded-2xl px-6 py-4 font-semibold text-center"
          >
            Open in MiniPay
          </a>
        )}
      </div>

      <TrustFooter />
    </main>
  );
}
