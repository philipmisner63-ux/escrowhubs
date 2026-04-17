"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SupportModal } from "@/components/SupportModal";

interface SupportButtonProps {
  lastTxHash?: string;
}

export function SupportButton({ lastTxHash }: SupportButtonProps) {
  const t = useTranslations("support");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("button")}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-2.5 text-xs font-medium text-slate-300 shadow-lg hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-200"
      >
        <span className="text-base leading-none">🛟</span>
        {t("button")}
      </button>

      <SupportModal
        open={open}
        onClose={() => setOpen(false)}
        lastTxHash={lastTxHash}
      />
    </>
  );
}
