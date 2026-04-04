"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MOCK_SIMPLE_ESCROW } from "../mock-data";

type Role = "depositor" | "beneficiary" | "arbiter" | "observer";

const ROLE_CONFIG: Record<Role, {
  label: string;
  color: string;
  badge: string;
  actions: { title: string; desc: string; variant: string; available: boolean; state?: number }[];
  description: string;
}> = {
  depositor: {
    label: "Depositor",
    color: "text-cyan-400",
    badge: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    description: "You created and funded this escrow. You can release funds when satisfied, or raise a dispute.",
    actions: [
      { title: "Release Funds",   desc: "Send funds to beneficiary",          variant: "primary", available: true,  state: 1 },
      { title: "Raise Dispute",   desc: "Escalate to arbiter",                 variant: "danger",  available: true,  state: 1 },
      { title: "Resolve Release", desc: "Only available if you are arbiter",   variant: "primary", available: false, state: 3 },
      { title: "Resolve Refund",  desc: "Only available if you are arbiter",   variant: "secondary", available: false, state: 3 },
    ],
  },
  beneficiary: {
    label: "Beneficiary",
    color: "text-purple-400",
    badge: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    description: "You are the recipient. Await the depositor to release funds. You can submit evidence if disputed.",
    actions: [
      { title: "Release Funds",   desc: "Not your role — depositor only",      variant: "primary",   available: false, state: 1 },
      { title: "Raise Dispute",   desc: "Not your role — depositor only",      variant: "danger",    available: false, state: 1 },
      { title: "Submit Evidence", desc: "Available if escrow is disputed",      variant: "secondary", available: true,  state: 3 },
    ],
  },
  arbiter: {
    label: "Arbiter",
    color: "text-yellow-400",
    badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    description: "You resolve disputes. You cannot release funds unless the escrow is in DISPUTED state.",
    actions: [
      { title: "Release Funds",     desc: "Not your role as arbiter",            variant: "primary",   available: false, state: 1 },
      { title: "Raise Dispute",     desc: "Not your role as arbiter",            variant: "danger",    available: false, state: 1 },
      { title: "Resolve — Release", desc: "Send funds to beneficiary (disputed)", variant: "primary",   available: true,  state: 3 },
      { title: "Resolve — Refund",  desc: "Return funds to depositor (disputed)", variant: "secondary", available: true,  state: 3 },
    ],
  },
  observer: {
    label: "Observer",
    color: "text-slate-400",
    badge: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    description: "You are viewing this escrow but are not a participant. No actions are available.",
    actions: [],
  },
};

const VARIANT_STYLES: Record<string, string> = {
  primary:   "bg-cyan-400/10 border-cyan-400/20 text-cyan-400",
  danger:    "bg-red-400/10 border-red-400/20 text-red-400",
  secondary: "bg-white/5 border-white/10 text-slate-300",
};

export default function RoleViewPage() {
  const [role, setRole] = useState<Role>("depositor");
  const [mockState, setMockState] = useState<1 | 3>(1); // 1=AWAITING_DELIVERY, 3=DISPUTED
  const config = ROLE_CONFIG[role];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Role View Toggle</h1>
        <p className="mt-1 text-slate-400 text-sm">See how the escrow UI changes depending on your role.</p>
      </div>

      {/* Role selector */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">Your Role</p>
        <div className="flex gap-2 flex-wrap">
          {(["depositor", "beneficiary", "arbiter", "observer"] as Role[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize",
                role === r
                  ? ROLE_CONFIG[r].badge + " border"
                  : "border-white/10 text-slate-400 hover:text-white"
              )}
            >
              {ROLE_CONFIG[r].label}
            </button>
          ))}
        </div>
      </div>

      {/* State selector */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">Escrow State</p>
        <div className="flex gap-2">
          <button
            onClick={() => setMockState(1)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm border transition-all",
              mockState === 1 ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300" : "border-white/10 text-slate-400 hover:text-white"
            )}
          >
            Awaiting Delivery
          </button>
          <button
            onClick={() => setMockState(3)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm border transition-all",
              mockState === 3 ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-white/10 text-slate-400 hover:text-white"
            )}
          >
            Disputed
          </button>
        </div>
      </div>

      {/* Escrow view */}
      <div className="rounded-xl border border-white/10 bg-white/3 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-white">Simple Escrow</h2>
          <span className={cn(
            "text-xs px-2 py-1 rounded-full border",
            mockState === 1 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"
          )}>
            {mockState === 1 ? "Awaiting Delivery" : "Disputed"}
          </span>
          <span className={cn("text-xs px-2 py-1 rounded-full border capitalize", config.badge)}>
            You: {config.label}
          </span>
        </div>

        {/* Role description */}
        <div className={cn("rounded-xl border p-3 text-sm", config.badge)}>
          <span className={config.color}>ℹ️ </span>
          <span className="text-slate-300">{config.description}</span>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Depositor",   MOCK_SIMPLE_ESCROW.depositor,   role === "depositor"],
            ["Beneficiary", MOCK_SIMPLE_ESCROW.beneficiary, role === "beneficiary"],
            ["Arbiter",     MOCK_SIMPLE_ESCROW.arbiter,     role === "arbiter"],
          ].map(([label, addr, isYou]) => (
            <div key={label as string} className={cn(
              "rounded-xl border p-3",
              isYou ? "border-cyan-400/30 bg-cyan-400/5" : "border-white/8 bg-white/3"
            )}>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label as string}</p>
              <p className="font-mono text-xs text-slate-300">{(addr as string).slice(0, 8)}…</p>
              {isYou && <p className="text-xs text-cyan-400 mt-1">← You</p>}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Available Actions</p>
          {config.actions.length === 0 ? (
            <p className="text-sm text-slate-500 py-3 text-center">No actions available for observers.</p>
          ) : (
            <div className="space-y-2">
              {config.actions.map((action, i) => {
                const isVisible = action.state === mockState;
                const isActive = action.available && isVisible;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 transition-all",
                      !isVisible ? "opacity-20" : isActive ? "bg-white/3 border-white/8" : "bg-white/2 border-white/5 opacity-40"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{action.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
                    </div>
                    {isVisible && (
                      <button
                        disabled={!isActive}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border transition-all",
                          isActive ? VARIANT_STYLES[action.variant] : "border-white/5 text-slate-600 cursor-not-allowed"
                        )}
                      >
                        {action.title.split(" ")[0]}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
