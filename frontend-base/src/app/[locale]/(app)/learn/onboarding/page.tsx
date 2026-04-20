"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "../mock-data";

type WalletState = "not_connected" | "connecting" | "connected";
type NetworkState = "wrong_network" | "switching" | "correct_network";

const WALLET_STATE_LABELS: Record<WalletState, { label: string; color: string; dot: string }> = {
  not_connected:  { label: "Not Connected",  color: "text-slate-400",  dot: "bg-slate-500"  },
  connecting:     { label: "Connecting…",    color: "text-yellow-400", dot: "bg-yellow-400 animate-pulse" },
  connected:      { label: "Connected",      color: "text-green-400",  dot: "bg-green-400"  },
};

const NETWORK_STATE_LABELS: Record<NetworkState, { label: string; color: string; dot: string }> = {
  wrong_network:   { label: "Wrong Network (ETH Mainnet)", color: "text-red-400",    dot: "bg-red-400"    },
  switching:       { label: "Switching to Base…",           color: "text-yellow-400", dot: "bg-yellow-400 animate-pulse" },
  correct_network: { label: "Base (Chain 8453)",             color: "text-green-400",  dot: "bg-green-400"  },
};

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [walletState, setWalletState] = useState<WalletState>("not_connected");
  const [networkState, setNetworkState] = useState<NetworkState>("wrong_network");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Onboarding Flow</h1>
        <p className="mt-1 text-slate-400 text-sm">Step-by-step walkthrough of how a new user connects and creates their first escrow.</p>
      </div>

      {/* Step tabs */}
      <div className="flex gap-2 flex-wrap">
        {ONBOARDING_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeStep === i
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-white/5 text-slate-400 border border-white/8 hover:text-white"
            )}
          >
            Step {s.step}
          </button>
        ))}
      </div>

      {/* Active step */}
      {(() => {
        const step = ONBOARDING_STEPS[activeStep];
        return (
          <div className="rounded-xl border border-white/10 bg-white/3 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <span className="text-4xl">{step.icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-white">{step.title}</h2>
                <p className="text-slate-400 mt-1 text-sm">{step.description}</p>
              </div>
            </div>

            {/* Step 1: Wallet connect simulation */}
            {activeStep === 0 && (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Wallet State Simulator</p>
                <div className="flex items-center gap-3">
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", WALLET_STATE_LABELS[walletState].dot)} />
                  <span className={cn("text-sm font-medium", WALLET_STATE_LABELS[walletState].color)}>
                    {WALLET_STATE_LABELS[walletState].label}
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {(["not_connected", "connecting", "connected"] as WalletState[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setWalletState(s)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs border transition-all",
                        walletState === s
                          ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                          : "border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      {WALLET_STATE_LABELS[s].label}
                    </button>
                  ))}
                </div>
                <div className={cn(
                  "rounded-xl p-4 border text-sm transition-all",
                  walletState === "not_connected" ? "border-white/8 bg-white/3" :
                  walletState === "connecting"    ? "border-yellow-500/20 bg-yellow-500/5" :
                                                   "border-green-500/20 bg-green-500/5"
                )}>
                  {walletState === "not_connected" && (
                    <div className="text-center py-4">
                      <p className="text-slate-500 text-sm">No wallet connected</p>
                      <div className="mt-3 inline-flex px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs">
                        Connect Wallet
                      </div>
                    </div>
                  )}
                  {walletState === "connecting" && (
                    <div className="text-center py-4">
                      <div className="animate-spin inline-block h-6 w-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full mb-2" />
                      <p className="text-yellow-300 text-sm">Waiting for wallet approval…</p>
                      <p className="text-slate-500 text-xs mt-1">Check your wallet app</p>
                    </div>
                  )}
                  {walletState === "connected" && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-400/20 border border-green-400/30 flex items-center justify-center text-green-400 text-sm">✓</div>
                      <div>
                        <p className="text-green-300 text-sm font-medium">Wallet Connected</p>
                        <p className="text-slate-500 text-xs font-mono">0xAAA1…1111</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Network switching simulation */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Network State Simulator</p>
                <div className="flex items-center gap-3">
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", NETWORK_STATE_LABELS[networkState].dot)} />
                  <span className={cn("text-sm font-medium", NETWORK_STATE_LABELS[networkState].color)}>
                    {NETWORK_STATE_LABELS[networkState].label}
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {(["wrong_network", "switching", "correct_network"] as NetworkState[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setNetworkState(s)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs border transition-all",
                        networkState === s
                          ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                          : "border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      {NETWORK_STATE_LABELS[s].label}
                    </button>
                  ))}
                </div>
                <div className={cn(
                  "rounded-xl p-4 border text-sm transition-all",
                  networkState === "wrong_network"   ? "border-red-500/20 bg-red-500/5" :
                  networkState === "switching"        ? "border-yellow-500/20 bg-yellow-500/5" :
                                                       "border-green-500/20 bg-green-500/5"
                )}>
                  {networkState === "wrong_network" && (
                    <p className="text-red-300">⚠️ Your wallet is on the wrong network. Switch to <strong>Base (Chain ID 8453)</strong> to use this app.</p>
                  )}
                  {networkState === "switching" && (
                    <p className="text-yellow-300">🔄 Switching to Base… approve in your wallet.</p>
                  )}
                  {networkState === "correct_network" && (
                    <p className="text-green-300">✅ Connected to Base Mainnet (Chain ID 8453)</p>
                  )}
                </div>
              </div>
            )}

            {/* Steps 3-4: Static info */}
            {activeStep === 2 && (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/8">
                  <span className="text-slate-500 text-xs w-24 shrink-0">Type</span>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs">⬡ Simple</span>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs">◈ Milestone</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/8">
                  <span className="text-slate-500 text-xs w-24 shrink-0">Beneficiary</span>
                  <span className="font-mono text-xs text-white">0xBBB2…2222</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/8">
                  <span className="text-slate-500 text-xs w-24 shrink-0">Amount</span>
                  <span className="text-cyan-400 font-semibold">5.0000 ETH</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/8">
                  <span className="text-slate-500 text-xs w-24 shrink-0">Fee</span>
                  <span className="text-slate-400 text-xs">0.5% protocol fee = 0.0250 ETH</span>
                </div>
                <div className="mt-2 flex justify-end">
                  <div className="px-6 py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-semibold">
                    Deploy Escrow Contract →
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-3 text-sm">
                {[
                  { status: "Awaiting Delivery", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", action: "Release / Dispute", role: "Depositor" },
                  { status: "Disputed",          color: "text-red-400 bg-red-400/10 border-red-400/20",         action: "Resolve Release / Refund", role: "Arbiter" },
                  { status: "Complete",          color: "text-green-400 bg-green-400/10 border-green-400/20",   action: "No actions", role: "—" },
                ].map(({ status, color, action, role }) => (
                  <div key={status} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8">
                    <span className={cn("text-xs px-2 py-1 rounded-full border", color)}>{status}</span>
                    <span className="text-slate-500 text-xs">{role}</span>
                    <span className="text-slate-300 text-xs">{action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Step navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setActiveStep(s => Math.max(0, s - 1))}
          disabled={activeStep === 0}
          className="px-4 py-2 rounded-lg text-sm border border-white/10 text-slate-400 disabled:opacity-30 hover:text-white transition-all"
        >
          ← Previous
        </button>
        <button
          onClick={() => setActiveStep(s => Math.min(ONBOARDING_STEPS.length - 1, s + 1))}
          disabled={activeStep === ONBOARDING_STEPS.length - 1}
          className="px-4 py-2 rounded-lg text-sm border border-amber-500/30 text-amber-300 disabled:opacity-30 hover:bg-amber-500/10 transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
