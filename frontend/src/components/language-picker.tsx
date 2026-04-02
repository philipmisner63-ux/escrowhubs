"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { locales, localeMetadata, type Locale } from "@/i18n/config";

export function LanguagePicker() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const current = localeMetadata[locale];

  const switchLocale = useCallback((next: Locale) => {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname, { locale: next });
    setOpen(false);
  }, [pathname, router]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setFocused(locales.indexOf(locale));
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocused(f => (f + 1) % locales.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocused(f => (f - 1 + locales.length) % locales.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        switchLocale(locales[focused]);
        break;
      case "Escape":
        setOpen(false);
        break;
      case "Home":
        e.preventDefault();
        setFocused(0);
        break;
      case "End":
        e.preventDefault();
        setFocused(locales.length - 1);
        break;
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[focused] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [focused, open]);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language")}
        onClick={() => { setOpen(o => !o); setFocused(locales.indexOf(locale)); }}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-xs font-medium">{current.nativeName}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={t("language")}
          className="absolute end-0 mt-1 w-52 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl py-1 z-50"
        >
          {locales.map((loc, i) => {
            const meta = localeMetadata[loc];
            const isSelected = loc === locale;
            return (
              <li
                key={loc}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => switchLocale(loc)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm transition-colors ${
                  i === focused ? "bg-cyan-400/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                } ${isSelected ? "text-cyan-400" : ""}`}
              >
                <span className="text-base leading-none">{meta.flag}</span>
                <span className="flex-1">{meta.nativeName}</span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
