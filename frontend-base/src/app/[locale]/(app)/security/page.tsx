"use client";

import { useTranslations } from "next-intl";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Link } from "@/i18n/navigation";

function ShieldIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function AIIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  );
}
function ServerIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path strokeLinecap="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-cyan-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
    </li>
  );
}

interface SectionCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon, iconColor, title, children }: SectionCardProps) {
  return (
    <div className="card-glow-cyan rounded-2xl border border-cyan-400/15 bg-white/3 p-6 sm:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border ${iconColor}`}>{icon}</div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SecurityPage() {
  const t = useTranslations("security");

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3 py-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 mb-2">
            <ShieldIcon />
          </div>
          <h1 className="text-4xl font-bold text-white">{t("title")}</h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">{t("subtitle")}</p>
        </div>

        {/* Section 1 — Smart Contract Security */}
        <SectionCard
          icon={<ShieldIcon />}
          iconColor="border-cyan-400/20 bg-cyan-400/5 text-cyan-400"
          title={t("smartContractTitle")}
        >
          <ul className="space-y-3">
            <CheckItem text={t("sc1")} />
            <CheckItem text={t("sc2")} />
            <CheckItem text={t("sc3")} />
            <CheckItem text={t("sc4")} />
          </ul>
        </SectionCard>

        {/* Section 2 — Fund Protection */}
        <SectionCard
          icon={<LockIcon />}
          iconColor="border-blue-400/20 bg-blue-400/5 text-blue-400"
          title={t("protectionTitle")}
        >
          <ul className="space-y-3">
            <CheckItem text={t("p1")} />
            <CheckItem text={t("p2")} />
            <CheckItem text={t("p3")} />
          </ul>
        </SectionCard>

        {/* Section 3 — AI Arbiter */}
        <SectionCard
          icon={<AIIcon />}
          iconColor="border-violet-400/20 bg-violet-400/5 text-violet-400"
          title={t("aiTitle")}
        >
          <ul className="space-y-3">
            <CheckItem text={t("ai1")} />
            <CheckItem text={t("ai2")} />
            <CheckItem text={t("ai3")} />
          </ul>
        </SectionCard>

        {/* Section 4 — Platform Security */}
        <SectionCard
          icon={<ServerIcon />}
          iconColor="border-emerald-400/20 bg-emerald-400/5 text-emerald-400"
          title={t("platformTitle")}
        >
          <ul className="space-y-3">
            <CheckItem text={t("pl1")} />
            <CheckItem text={t("pl2")} />
            <CheckItem text={t("pl3")} />
          </ul>
          <a
            href="https://github.com/philipmisner63-ux/blockdag-escrow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {t("viewGithub")}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </SectionCard>

        {/* Section 5 — Audit Status */}
        <SectionCard
          icon={<ClipboardIcon />}
          iconColor="border-yellow-400/20 bg-yellow-400/5 text-yellow-400"
          title={t("auditTitle")}
        >
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-yellow-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <span className="text-sm text-slate-300 leading-relaxed">{t("au1")}</span>
            </li>
            <CheckItem text={t("au2")} />
            <li className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-cyan-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <span className="text-sm text-slate-300 leading-relaxed">
                {t("au3").split("security@escrowhubs.io")[0]}
                <a href="mailto:security@escrowhubs.io" className="text-cyan-400 hover:underline">
                  security@escrowhubs.io
                </a>
              </span>
            </li>
          </ul>
        </SectionCard>

        {/* CTA */}
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-8 text-center space-y-4">
          <p className="text-xl font-bold text-white">{t("ctaTitle")}</p>
          <Link
            href="/create"
            className="btn-glow inline-flex px-8 py-3 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 font-semibold hover:bg-cyan-400/20 transition-all"
          >
            {t("ctaButton")}
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
