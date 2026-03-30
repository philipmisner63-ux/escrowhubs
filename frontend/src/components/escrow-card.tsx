"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type Escrow, shortAddress, statusColor } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/ui/glass-card";

interface EscrowCardProps {
  escrow: Escrow;
}

export function EscrowCard({ escrow }: EscrowCardProps) {
  const releasedMilestones = escrow.milestones?.filter(m => m.status === "released").length ?? 0;
  const totalMilestones = escrow.milestones?.length ?? 0;
  const progress = totalMilestones > 0 ? (releasedMilestones / totalMilestones) * 100 : 0;

  return (
    <Link href={`/escrow/${escrow.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <GlassCard className="p-5 cursor-pointer">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white truncate hover:text-cyan-400 transition-colors">
                  {escrow.title}
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 shrink-0">
                  {escrow.type === "milestone" ? "Milestone" : "Simple"}
                </span>
              </div>
              <p className="mt-1 text-xs font-mono text-slate-500">{escrow.id}</p>
            </div>
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 capitalize", statusColor(escrow.status))}>
              {escrow.status}
            </span>
          </div>

          {/* Parties */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wide">Depositor</span>
              <p className="mt-0.5 font-mono text-slate-300">{shortAddress(escrow.depositor)}</p>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wide">Beneficiary</span>
              <p className="mt-0.5 font-mono text-slate-300">{shortAddress(escrow.beneficiary)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Amount</span>
              <p className="text-sm font-semibold text-cyan-400" style={{ fontFamily: "var(--font-mono)" }}>{escrow.amount}</p>
            </div>
            {escrow.type === "milestone" && totalMilestones > 0 && (
              <div className="flex-1 mx-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{releasedMilestones}/{totalMilestones}</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-white/5" />
              </div>
            )}
            <div className="text-right">
              <span className="text-xs text-slate-500">Trust</span>
              <p className={cn(
                "text-sm font-semibold",
                escrow.trustScore >= 80 ? "text-green-400" :
                escrow.trustScore >= 60 ? "text-yellow-400" : "text-red-400"
              )}>
                {escrow.trustScore}
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </Link>
  );
}
