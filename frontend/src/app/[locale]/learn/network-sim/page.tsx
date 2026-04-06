"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type SimState = "disconnected" | "wrong_network" | "connected" | "pending_tx" | "confirmed";

const SIM_STATES: { id: SimState; label: string; icon: string; desc: string }[] = [
  { id: "disconnected",  label: "Wallet Disconnected",  icon: "🔌", desc: "No wallet connected to the app" },
  { id: "wrong_network", label: "Wrong Network",         icon: "⚠️",  desc: "Wallet connected but on Ethereum Mainnet" },
  { id: "connected",     label: "Wallet Connected",      icon: "✅", desc: "Wallet connected on BlockDAG (Chain 1404)" },
  { id: "pending_tx",    label: "Transaction Pending",   icon: "⏳", desc: "Transaction submitted, waiting for confirmation" },
  { id: "confirmed",     label: "Transaction Confirmed", icon: "🎉", desc: "Transaction confirmed on BlockDAG" },
];

function NavBarSim({ state }: { state: SimState }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {state === "wrong_network" && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center text-xs text-yellow-300">
          ⚠️ Your wallet is on the wrong network. Switch to <strong>BlockDAG (Chain ID 1404)</strong> to use this app.
        </div>
      )}
      <div className="bg-black/50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600" />
          <span className="font-bold text-sm text-white">EscrowHubs</span>
        </div>
        <div>
          {state === "disconnected" && (
            <div className="px-4 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-medium">
              Connect Wallet
            </div>
          )}
          {state === "wrong_network" && (
            <div className="px-4 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-medium flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-400" />
              Wrong Network
            </div>
          )}
          {(state === "connected" || state === "pending_tx" || state === "confirmed") && (
            <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-medium flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              0xAAA1…1111
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionAreaSim({ state }: { state: SimState }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-5 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Escrow Actions</h3>
      {state === "disconnected" && (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">Connect your wallet to view and manage escrows.</p>
          <div className="mt-4 inline-flex px-6 py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm">
            Connect Wallet
          </div>
        </div>
      )}
      {state === "wrong_network" && (
        <div className="text-center py-8">
          <p className="text-yellow-300 text-sm">Switch to BlockDAG to take actions.</p>
          <div className="mt-4 inline-flex px-6 py-2.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-sm">
            Switch Network
          </div>
        </div>
      )}
      {state === "connected" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-white/3 border border-white/8 p-4">
            <div>
              <p className="text-sm font-medium text-white">Release Funds</p>
              <p className="text-xs text-slate-500">Send 5.0 BDAG to beneficiary</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm cursor-pointer">
              Release
            </div>
          </div>
        </div>
      )}
      {state === "pending_tx" && (
        <div className="text-center py-8 space-y-3">
          <div className="animate-spin inline-block h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full" />
          <p className="text-cyan-300 text-sm">Waiting for confirmation…</p>
          <p className="text-slate-500 text-xs font-mono">0xabc123def456…</p>
          <p className="text-slate-600 text-xs">BlockDAG can take 60–120 seconds</p>
        </div>
      )}
      {state === "confirmed" && (
        <div className="text-center py-8 space-y-3">
          <div className="text-4xl">🎉</div>
          <p className="text-green-300 text-sm font-medium">Release confirmed!</p>
          <p className="text-slate-500 text-xs">Escrow is now Complete. Funds sent to beneficiary.</p>
          <div className="inline-flex px-4 py-1.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-xs">
            Complete
          </div>
        </div>
      )}
    </div>
  );
}

export default function NetworkSimPage() {
  const [simState, setSimState] = useState<SimState>("disconnected");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Network Simulator</h1>
        <p className="mt-1 text-slate-400 text-sm">Simulate different wallet and network states to see how the UI responds.</p>
      </div>

      {/* State buttons */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">Simulate State</p>
        <div className="flex flex-wrap gap-2">
          {SIM_STATES.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setSimState(id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm border transition-all flex items-center gap-2",
                simState === id
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-white/10 text-slate-400 hover:text-white"
              )}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-1">
          {SIM_STATES.find(s => s.id === simState)?.desc}
        </p>
      </div>

      {/* Simulated UI */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-slate-500">UI Preview</p>
        <NavBarSim state={simState} />
        <ActionAreaSim state={simState} />
      </div>

      {/* State table */}
      <div className="rounded-xl border border-white/8 bg-white/3 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">State Reference</h3>
        <div className="space-y-2 text-xs">
          {[
            { state: "Disconnected",  banner: "None",         button: "Connect Wallet",   actions: "Hidden" },
            { state: "Wrong Network", banner: "Yellow warning", button: "Wrong Network",  actions: "Switch prompt" },
            { state: "Connected",     banner: "None",          button: "Address badge",   actions: "Full access" },
            { state: "Pending Tx",    banner: "None",          button: "Address badge",   actions: "Spinner + tx hash" },
            { state: "Confirmed",     banner: "None",          button: "Address badge",   actions: "Success state" },
          ].map(({ state, banner, button, actions }) => (
            <div key={state} className="grid grid-cols-4 gap-3 py-1.5 border-b border-white/5">
              <span className="text-slate-300 font-medium">{state}</span>
              <span className="text-slate-500">{banner}</span>
              <span className="text-slate-500">{button}</span>
              <span className="text-slate-500">{actions}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
