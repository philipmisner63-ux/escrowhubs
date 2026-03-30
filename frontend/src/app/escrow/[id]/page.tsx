"use client";

import { use, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  mockEscrows,
  shortAddress,
  statusColor,
  milestoneStatusColor,
  type Milestone,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EscrowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const escrow = mockEscrows.find(e => e.id === id);
  const [confirming, setConfirming] = useState<string | null>(null);

  if (!escrow) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-slate-400 text-lg">Escrow not found</p>
        <Link href="/" className="mt-4 text-cyan-400 hover:underline text-sm">← Back to Dashboard</Link>
      </div>
    );
  }

  const releasedCount = escrow.milestones?.filter(m => m.status === "released").length ?? 0;
  const totalCount = escrow.milestones?.length ?? 0;
  const progress = totalCount > 0 ? (releasedCount / totalCount) * 100 : 0;

  async function handleAction(action: string) {
    setConfirming(action);
    // TODO: wire up contract calls
    await new Promise(r => setTimeout(r, 1000));
    setConfirming(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-300 font-mono">{escrow.id}</span>
      </div>

      {/* Header card */}
      <div className="glass rounded-xl border border-white/8 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{escrow.title}</h1>
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border capitalize",
                statusColor(escrow.status)
              )}>
                {escrow.status}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                {escrow.type === "milestone" ? "Milestone" : "Simple"}
              </span>
            </div>
            <p className="mt-2 text-xs font-mono text-slate-500">{escrow.id}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Total Amount</p>
            <p className="text-2xl font-bold text-cyan-400">{escrow.amount}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Depositor", address: escrow.depositor },
            { label: "Beneficiary", address: escrow.beneficiary },
            { label: "Arbiter", address: escrow.arbiter },
          ].map(({ label, address }) => (
            <div key={label} className="rounded-lg bg-white/3 border border-white/8 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
              <p className="mt-1 text-xs font-mono text-slate-300">{shortAddress(address)}</p>
            </div>
          ))}
        </div>

        {/* Trust + created */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Created {escrow.createdAt}</span>
          <div className="flex items-center gap-2">
            <span>Trust Score:</span>
            <span className={cn(
              "font-semibold",
              escrow.trustScore >= 80 ? "text-green-400" :
              escrow.trustScore >= 60 ? "text-yellow-400" : "text-red-400"
            )}>
              {escrow.trustScore} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={escrow.type === "milestone" ? "milestones" : "actions"}>
        <TabsList className="bg-white/5 border border-white/10">
          {escrow.type === "milestone" && (
            <TabsTrigger value="milestones" className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400">
              Milestones ({releasedCount}/{totalCount})
            </TabsTrigger>
          )}
          <TabsTrigger value="actions" className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400">
            Actions
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400">
            Details
          </TabsTrigger>
        </TabsList>

        {/* Milestones tab */}
        {escrow.type === "milestone" && escrow.milestones && (
          <TabsContent value="milestones" className="space-y-4 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Overall Progress</span>
              <span>{releasedCount}/{totalCount} milestones released</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/5" />

            <div className="space-y-3">
              {escrow.milestones.map((ms: Milestone) => (
                <div
                  key={ms.id}
                  className="glass rounded-xl border border-white/8 p-4 flex items-center gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-mono text-slate-400">
                    {ms.id + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{ms.description}</p>
                    <p className="text-xs text-cyan-400 font-semibold mt-0.5">{ms.amount}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full border capitalize shrink-0",
                    milestoneStatusColor(ms.status)
                  )}>
                    {ms.status}
                  </span>
                  {ms.status === "pending" && escrow.status === "active" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleAction(`release-${ms.id}`)}
                        disabled={confirming === `release-${ms.id}`}
                        className="h-7 px-3 text-xs bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20"
                      >
                        {confirming === `release-${ms.id}` ? "…" : "Release"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(`dispute-${ms.id}`)}
                        disabled={confirming === `dispute-${ms.id}`}
                        className="h-7 px-3 text-xs border-red-400/20 text-red-400 hover:bg-red-400/10"
                      >
                        {confirming === `dispute-${ms.id}` ? "…" : "Dispute"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Actions tab */}
        <TabsContent value="actions" className="mt-4">
          <div className="glass rounded-xl border border-white/8 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Available Actions</h3>

            {escrow.status === "active" && (
              <div className="space-y-3">
                {escrow.type === "simple" && (
                  <div className="flex items-center justify-between rounded-lg bg-white/3 border border-white/8 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Release Funds</p>
                      <p className="text-xs text-slate-500 mt-0.5">Release {escrow.amount} to beneficiary</p>
                    </div>
                    <Button
                      onClick={() => handleAction("release")}
                      disabled={confirming === "release"}
                      className="bg-cyan-400 text-black hover:bg-cyan-300 font-semibold text-sm"
                    >
                      {confirming === "release" ? "Releasing…" : "Release"}
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg bg-white/3 border border-white/8 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Raise Dispute</p>
                    <p className="text-xs text-slate-500 mt-0.5">Escalate to arbiter for resolution</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleAction("dispute")}
                    disabled={confirming === "dispute"}
                    className="border-red-400/30 text-red-400 hover:bg-red-400/10 text-sm"
                  >
                    {confirming === "dispute" ? "Escalating…" : "Dispute"}
                  </Button>
                </div>
              </div>
            )}

            {escrow.status !== "active" && (
              <p className="text-sm text-slate-500 py-4 text-center">
                No actions available — escrow is {escrow.status}.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Details tab */}
        <TabsContent value="details" className="mt-4">
          <div className="glass rounded-xl border border-white/8 p-5 space-y-3">
            {[
              { label: "Contract Address", value: escrow.id, mono: true },
              { label: "Transaction Hash", value: escrow.txHash, mono: true },
              { label: "Type", value: escrow.type === "milestone" ? "Milestone Escrow" : "Simple Escrow", mono: false },
              { label: "Created", value: escrow.createdAt, mono: false },
              { label: "Network", value: "BlockDAG Testnet", mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
                <span className={cn("text-xs text-slate-300", mono && "font-mono")}>{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
