"use client";
import { useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { TrustFooter } from "@/components/TrustFooter";
import { StatusCard } from "@/components/StatusCard";

const TOTAL_STEPS = 4;

type StepContentProps = {
  setStep: Dispatch<SetStateAction<number>>;
};

function DemoTile({
  icon,
  title,
  subtitle,
  onClick,
  className = "",
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-card tap-compress slide-in flex flex-col gap-3 p-4 text-left ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#35D07F] to-[#0EA56F] flex items-center justify-center text-2xl shadow-lg shadow-green-900/30">
        {icon}
      </div>
      <div>
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}

// ─── Step mockups ─────────────────────────────────────────────────────────────

function StepHome({ setStep }: StepContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 border-l-4 border-l-[#35D07F] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#35D07F]" />
            <span className="text-sm text-white font-medium">0x71C7...3a2F · Celo</span>
          </div>
          <p className="text-3xl font-bold text-[#35D07F]">12.50</p>
          <p className="text-white/60 text-xs mt-0.5">cUSD</p>
      </div>
      <div className="self-start bg-[#35D07F]/20 border border-[#35D07F]/30 text-[#35D07F] rounded-full px-3 py-1 text-sm">
        Fake wallet
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DemoTile
          icon="💸"
          title="Send a Safe Payment"
          subtitle="Funds held until done →"
          onClick={() => setStep(1)}
          className="slide-in-1"
        />
        <DemoTile
          icon="📋"
          title="My Payments"
          subtitle="Track & release →"
          onClick={() => setStep(3)}
          className="slide-in-2"
        />
      </div>
    </div>
  );
}

function StepCreate(_: StepContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-white/80 mb-2">Who are you paying?</p>
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3">
            <p className="text-sm text-white">+254 712 345 678</p>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-[#35D07F]">
            ✓ Wallet found — 0xabc...def
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/80 mb-2">Amount (cUSD)</p>
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex justify-between items-center">
            <p className="text-lg font-semibold text-white">5.00</p>
            <span className="text-white/40 text-sm">cUSD</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/80 mb-2">What is this for?</p>
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3">
            <p className="text-sm text-white">Logo design — 3 concepts by Friday</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold shadow-lg shadow-green-900/30">
          Lock 5.00 cUSD safely →
        </div>
      </div>
    </div>
  );
}

function StepLocked(_: StepContentProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-6xl">✅</div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">5.00 cUSD locked</h2>
        <p className="text-white/60 text-sm">Logo design — 3 concepts by Friday</p>
      </div>
      <div className="w-full bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-2xl p-4">
        <p className="text-white/60 text-xs mb-2">Share with recipient</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 border border-white/20 text-white/50 rounded-xl px-3 py-2 text-xs truncate">
            celo.escrowhubs.io/escrow/0xf3d...
          </div>
          <button className="tap-compress bg-white/20 border border-white/20 text-white rounded-xl px-3 py-2 text-xs font-semibold">
            Copy
          </button>
        </div>
      </div>
      <div className="tap-compress w-full bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold shadow-lg shadow-green-900/30">
        View My Payments →
      </div>
    </div>
  );
}

function StepPayments(_: StepContentProps) {
  return (
    <div className="flex flex-col gap-3">
      <StatusCard
        status="ACTIVE"
        amount="5.00 cUSD"
        description="Logo design"
        recipient="+254 712 345 678"
        className="slide-in-1"
      />
      <StatusCard
        status="COMPLETE"
        amount="20.00 cUSD"
        description="Website copy"
        recipient="0xdef...789"
        className="slide-in-2"
      />
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
        <Link href="/" className="tap-compress text-white/50 text-sm">
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
            className={`tap-compress transition-colors ${
              i === step ? "w-2.5 h-2.5 rounded-full bg-[#35D07F]" : "w-2.5 h-2.5 rounded-full bg-white/20"
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
      <div className="flex-1 mb-6 slide-up" key={step}>
        <StepContent setStep={setStep} />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="tap-compress flex-1 bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-4 font-semibold"
          >
            ← Back
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="tap-compress flex-1 bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold shadow-lg shadow-green-900/30"
          >
            Next →
          </button>
        ) : (
          <a
            href="https://minipay.opera.com/open?url=https://celo.escrowhubs.io"
            className="tap-compress flex-1 bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold text-center shadow-lg shadow-green-900/30"
          >
            Open in MiniPay →
          </a>
        )}
      </div>

      <TrustFooter />
    </main>
  );
}
