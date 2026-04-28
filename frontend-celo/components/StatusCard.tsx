"use client";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { color: string; bg: string; pill: string; icon: string; label: string }> = {
  ACTIVE: { color: "border-l-[#35D07F]", bg: "bg-[#35D07F]/10", pill: "bg-[#35D07F]/20 text-[#35D07F]", icon: "🔒", label: "Active" },
  FUNDED: { color: "border-l-[#F7C948]", bg: "bg-[#F7C948]/10", pill: "bg-[#F7C948]/20 text-[#F7C948]", icon: "💰", label: "Funded" },
  COMPLETE: { color: "border-l-[#4A9EFF]", bg: "bg-[#4A9EFF]/10", pill: "bg-[#4A9EFF]/20 text-[#4A9EFF]", icon: "✅", label: "Complete" },
  RELEASED: { color: "border-l-[#4A9EFF]", bg: "bg-[#4A9EFF]/10", pill: "bg-[#4A9EFF]/20 text-[#4A9EFF]", icon: "✅", label: "Released" },
  DISPUTED: { color: "border-l-[#FF5B5B]", bg: "bg-[#FF5B5B]/10", pill: "bg-[#FF5B5B]/20 text-[#FF5B5B]", icon: "⚖️", label: "Disputed" },
};

interface StatusCardProps {
  status: string;
  amount: string;
  description: string;
  recipient: string;
  href?: string;
  className?: string;
}

export function StatusCard({ status, amount, description, recipient, href, className = "" }: StatusCardProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE;
  const inner = (
    <div className={`glass-card tap-compress border-l-4 ${cfg.color} flex items-center justify-between p-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center text-lg flex-shrink-0`}>
          {cfg.icon}
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium text-sm truncate">{description}</p>
          <p className="text-white/50 text-xs truncate">{recipient}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
        <p className="text-white font-bold text-sm">{amount}</p>
        <span className={`status-pill ${cfg.pill}`}>{cfg.label}</span>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
