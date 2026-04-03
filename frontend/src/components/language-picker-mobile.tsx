"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { locales, localeMetadata, type Locale } from "@/i18n/config";

function switchLocale(next: Locale) {
  document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
  const segments = window.location.pathname.split("/").filter(Boolean);
  segments[0] = next;
  window.location.href = "/" + segments.join("/");
}

export function LanguagePickerMobile() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const current = localeMetadata[locale];

  function handleSelect(loc: Locale) {
    // Close sheet first, then navigate on next tick so touch event cycle completes
    setOpen(false);
    setTimeout(() => switchLocale(loc), 0);
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={t("language")}
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(5,5,16,0.97)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <h2 className="text-base font-semibold text-white">{t("language")}</h2>
            <button
              type="button"
              aria-label={t("close")}
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Language list — no overflow scroll to avoid touch swallow */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {locales.map((loc) => {
              const meta = localeMetadata[loc];
              const isSelected = loc === locale;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  style={{ touchAction: "manipulation" }}
                  className={`w-full flex items-center gap-4 px-6 py-5 text-start border-b border-white/5 active:bg-white/10 transition-colors ${
                    isSelected ? "text-cyan-400 bg-cyan-400/5" : "text-slate-300"
                  }`}
                >
                  <span className="text-2xl leading-none select-none">{meta.flag}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{meta.nativeName}</p>
                    <p className="text-xs text-slate-500">{meta.name}</p>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
