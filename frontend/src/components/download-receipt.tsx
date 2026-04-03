"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ReceiptData } from "@/lib/generateReceipt";

interface DownloadReceiptProps {
  data: ReceiptData;
  size?: "sm" | "md";
}

export function DownloadReceipt({ data, size = "md" }: DownloadReceiptProps) {
  const t = useTranslations("receipt");
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const { generateReceipt } = await import("@/lib/generateReceipt");
      await generateReceipt(data);
    } catch (e) {
      console.error("Receipt generation failed:", e);
    } finally {
      setLoading(false);
    }
  }

  if (size === "sm") {
    return (
      <button
        type="button"
        onClick={download}
        disabled={loading}
        title={t("downloadReceipt")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-medium hover:bg-emerald-400/15 transition-all disabled:opacity-50"
      >
        {loading ? (
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        ) : (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
        {t("receipt")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/25 text-emerald-400 text-sm font-semibold hover:bg-emerald-400/18 transition-all disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {t("generating")}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {t("downloadReceipt")}
        </>
      )}
    </button>
  );
}
