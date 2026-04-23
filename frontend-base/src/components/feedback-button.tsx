"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FeedbackModal } from "@/components/feedback-modal";

export function FeedbackButton() {
  const t    = useTranslations("feedback");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("button")}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border border-white/10
          bg-black/80 px-3 py-2.5 sm:px-4 text-xs font-medium text-slate-300 shadow-lg backdrop-blur-sm
          hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-200"
      >
        <span className="text-base leading-none">💡</span>
        <span className="hidden sm:inline">{t("button")}</span>
      </button>

      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
