"use client";
import { useState } from "react";
import Link from "next/link";
import { TrustFooter } from "@/components/TrustFooter";

const TOTAL_STEPS = 4;

// ─── Step mockups ─────────────────────────────────────────────────────────────

function StepHome() {
  return (
    <div className="flex flex-col gap-4 slide-up">
      <div className="relative rounded-2xl bg-white/[0.07] border border-white/10 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#35D07F]" />
        <div className="p-4 pl-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#35D07F]" />
            <span className="text-sm text-white font-medium">0x71C7...3a2F · Celo</span>
          </div>
          <p className="text-3xl font-bold text-[#35D07F]">12.50</p>
          <p className="text-white/60 text-xs mt-0.5">cUSD</p>
        </div>
      </div>
      <div className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-5 text-center font-bold text-lg shadow-lg shadow-green-900/30">
        💸 Send a Safe Payment
      </div>
      <div className="bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-5 text-center font-bold text-lg">
        📋 My Payments
      </div>
    </div>
  );
}

function StepCreate() {
  return (
    <div className="flex flex-col gap-4 slide-up">
      <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-white/80 mb-2">Who are you paying?</p>
          <div className="bg-white/10 border border-[#35D07F]/60 rounded-xl px-4 py-3">
            <p className="text-sm text-white">+254 712 345 678</p>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-[#35D07F]">
            ✓ Wallet found — 0xabc...def
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/80 mb-2">Amount (cUSD)</p>
          <div className="bg-white/10 border border-[#35D07F]/60 rounded-xl px-4 py-3 flex justify-between items-center">
            <p className="text-lg font-semibold text-white">5.00</p>
            <span className="text-white/40 text-sm">cUSD</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/80 mb-2">What is this for?</p>
          <div className="bg-white/10 border border-[#35D07F]/60 rounded-xl px-4 py-3">
            <p className="text-sm text-white/80">Logo design — 3 concepts by Friday</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold shadow-lg shadow-green-900/30">
          Lock 5.00 cUSD safely →
        </div>
      </div>
    </div>
  );
}

function StepLocked() {
  return (
    <div className="flex flex-col items-center gap-5 slide-up">
      <div className="text-6xl">✅</div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">5.00 cUSD locked</h2>
        <p className="text-white/60 text-sm">Logo design — 3 concepts by Friday</p>
      </div>
      <div className="w-full bg-white/[0.07] border border-white/10 rounded-2xl p-4">
        <p className="text-white/60 text-xs mb-2">Share with recipient</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 border border-white/20 text-white/50 rounded-xl px-3 py-2 text-xs truncate">
            celo.escrowhubs.io/escrow/0xf3d...
          </div>
          <button className="bg-white/20 border border-white/20 text-white rounded-xl px-3 py-2 text-xs font-semibold">
            Copy
          </button>
        </div>
      </div>
      <div className="w-full bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold shadow-lg shadow-green-900/30">
        View My Payments →
      </div>
    </div>
  );
}

function StepPayments() {
  return (
    <div className="flex flex-col gap-3 slide-up">
      <div className="relative bg-white/[0.07] border border-white/10 rounded-2xl overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#35D07F]" />
        <div className="p-4 pl-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-sm font-bold text-white">5.00 cUSD</p>
              <p className="text-xs text-white/50">Sent · +254 712 345 678</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-lg bg-[#35D07F]/20 text-[#35D07F]">
            🟡 ACTIVE
          </span>
        </div>
      </div>
      <div className="relative bg-white/[0.07] border border-white/10 rounded-2xl overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4A9EFF]" />
        <div className="p-4 pl-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-white">20.00 cUSD</p>
              <p className="text-xs text-white/50">Sent · 0xdef...789</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-lg bg-[#4A9EFF]/20 text-[#4A9EFF]">
            ✅ COMPLETE
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Home", title: "EscrowHubs 🟢", subtitle: "Pay safely. Release when done.", content: StepHome },
  { label: "Create", title: "Send a safe payment", subtitle: "Funds held until job is done", content: StepCreate },
  { label: "Locked", title: "Payment locked ✅", subtitle: "Share the link with your recipient", content: StepLocked },
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
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-white/50 text-sm">
          ← Exit Demo
        </Link>
        <span className="text-white/50 text-sm">Step {step + 1} of {TOTAL_STEPS}</span>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setStep(i)}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-6 bg-[#35D07F]" : "w-2 bg-white/30"
            }`}
            aria-label={`Go to step ${i + 1}: ${s.label}`}
          />
        ))}
      </div>

      {/* Step header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{currentStep.title}</h1>
        <p className="text-white/60 text-sm mt-1">{currentStep.subtitle}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 mb-6" key={step}>
        <StepContent />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-4 font-semibold"
          >
            ← Back
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold shadow-lg shadow-green-900/30"
          >
            Next →
          </button>
        ) : (
          <a
            href="https://minipay.opera.com/open?url=https://celo.escrowhubs.io"
            className="flex-1 bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold text-center shadow-lg shadow-green-900/30"
          >
            Open in MiniPay →
          </a>
        )}
      </div>

      <TrustFooter />
    </main>
  );
}
