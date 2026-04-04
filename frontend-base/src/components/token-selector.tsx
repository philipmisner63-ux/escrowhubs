"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TokenType } from "@/lib/hooks/useTokenSelector";

interface TokenSelectorProps {
  value: TokenType;
  onChange: (token: TokenType) => void;
  className?: string;
}

export function TokenSelector({ value, onChange, className }: TokenSelectorProps) {
  const t = useTranslations("token");
  return (
    <div className={cn("flex rounded-xl overflow-hidden border border-white/10 w-48", className)}>
      {(["USDC", "ETH"] as TokenType[]).map((token) => (
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
          {token === "USDC" ? t("usdc") : t("eth")}
        </button>
      ))}
    </div>
  );
}
