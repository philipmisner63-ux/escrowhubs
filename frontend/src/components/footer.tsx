"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("footer");

  const productLinks = [
    { label: t("createEscrow"), href: "/create" },
    { label: t("dashboard"),    href: "/dashboard" },
    { label: t("howItWorks"),   href: "/how-it-works" },
    { label: t("pricing"),      href: "/#pricing" },
  ];

  const resourceLinks = [
    { label: t("faq"),           href: "/learn/faq",   external: false },
    { label: t("github"),        href: "https://github.com/philipmisner63-ux/blockdag-escrow", external: true },
    { label: t("documentation"), href: "#",            external: false },
  ];

  const communityLinks = [
    { label: t("twitter"),  href: "https://x.com/",           external: true },
    { label: t("telegram"), href: "https://t.me/",            external: true },
    { label: t("discord"),  href: "https://discord.gg/",      external: true },
  ];

  return (
    <footer className="border-t border-white/8 bg-[#020208]">
      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1 — Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(0,245,255,0.4)]" />
              <span className="text-base font-bold tracking-tight">
                <span className="text-white">Escrow</span>
                <span style={{ color: "#00f5ff" }}>Hubs</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {t("tagline")}
            </p>
            <p className="text-xs text-slate-600">
              {t("copyright")}
            </p>
          </div>

          {/* Col 2 — Product */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t("product")}
            </h3>
            <ul className="space-y-2.5">
              {productLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Resources */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t("resources")}
            </h3>
            <ul className="space-y-2.5">
              {resourceLinks.map(({ label, href, external }) => (
                <li key={label}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
              {/* Support — triggers existing support button */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.querySelector<HTMLButtonElement>("[aria-label]");
                    // Find support button by its fixed position
                    const allBtns = document.querySelectorAll<HTMLButtonElement>("button[aria-label]");
                    for (const b of allBtns) {
                      if (b.className.includes("fixed")) { b.click(); break; }
                    }
                  }}
                  className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {t("support")}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 — Community */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t("community")}
            </h3>
            <ul className="space-y-2.5">
              {communityLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    {label}
                    <svg className="w-3 h-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            {/* Chain icon */}
            <svg className="w-3.5 h-3.5 text-cyan-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {t("builtOn")}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">{t("terms")}</a>
            <span className="text-white/10">·</span>
            <a href="#" className="hover:text-slate-400 transition-colors">{t("privacy")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
