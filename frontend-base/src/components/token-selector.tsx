"use client";

import { cn } from "@/lib/utils";
import type { TokenType } from "@/lib/hooks/useTokenSelector";

interface TokenSelectorProps {
  value: TokenType;
  onChange: (token: TokenType) => void;
  nativeLabel: string;
  stableLabel: string;
  className?: string;
}

export function TokenSelector({ value, onChange, nativeLabel, stableLabel, className }: TokenSelectorProps) {
  return (
    <div className={cn("flex rounded-xl overflow-hidden border border-white/10 w-48", className)}>
      {([["NATIVE", nativeLabel], ["STABLE", stableLabel]] as [TokenType, string][]).map(([token, label]) => (
        <button
          key={token}
          type="button"
          onClick={() => onChange(token)}
          className={cn(
            "flex-1 py-2 text-sm font-semibold transition-all",
            value === token
              ? "bg-cyan-400 text-black"
              : "bg-white/5 text-slate-400 hover:text-white"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
