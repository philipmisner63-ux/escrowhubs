"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Nav } from "@/components/nav";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/footer";
import { OnboardingTour } from "@/components/onboarding-tour";

export default function LandingPage() {
  const t = useTranslations("landing");

  const features = [
    { icon: "🛡️", title: t("feature1Title"), desc: t("feature1Desc"), accent: "border-cyan-400/20 bg-cyan-400/5 text-cyan-400",   glow: "card-glow-cyan"   },
    { icon: "◈",  title: t("feature2Title"), desc: t("feature2Desc"), accent: "border-purple-400/20 bg-purple-400/5 text-purple-400", glow: "card-glow-purple" },
    { icon: "⚡", title: t("feature3Title"), desc: t("feature3Desc"), accent: "border-blue-400/20 bg-blue-400/5 text-blue-400",     glow: "card-glow-blue"   },
  ];

  const aiSteps = [
    { step: "01", title: t("aiStep1Title"), desc: t("aiStep1Desc") },
    { step: "02", title: t("aiStep2Title"), desc: t("aiStep2Desc") },
    { step: "03", title: t("aiStep3Title"), desc: t("aiStep3Desc") },
    { step: "04", title: t("aiStep4Title"), desc: t("aiStep4Desc") },
  ];

  const stats = [
    { value: "0.5%", label: t("statFee") },
    { value: "1404", label: t("statChain") },
    { value: "0",    label: t("statExploits") },
    { value: "100%", label: t("statOnChain") },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 space-y-16">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hero-glow rounded-2xl border border-white/8 px-6 py-16 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/5 px-4 py-1.5 text-xs text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            {t("badge")}
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight"
          >
            <span className="text-white block">{t("heroTitle1")}</span>
            <span className="block mt-1 text-cyan-400" style={{ textShadow: "0 0 40px rgba(0,245,255,0.5)" }}>
              {t("heroTitle2")}
            </span>
          </motion.h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">{t("heroSubtitle")}</p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <Link
              href="/dashboard"
              className="btn-glow px-8 py-3 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 font-semibold hover:bg-cyan-400/20 transition-all"
            >
              {t("launchApp")}
            </Link>
            <a
              href="https://github.com/philipmisner63-ux/blockdag-escrow"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/8 transition-all"
            >
              {t("viewContracts")}
            </a>
          </div>
        </section>

        {/* ── Welcome Card + Quick Actions ─────────────────────────── */}
        <section className="space-y-3">
          <div className="rounded-xl border border-white/8 bg-white/3 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">{t("welcomeTitle")}</p>
              <p className="text-slate-400 text-sm mt-0.5">{t("welcomeSubtitle")}</p>
            </div>
            <Link
              href="/dashboard"
              className="btn-glow shrink-0 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium hover:bg-cyan-400/15 transition-all"
            >
              {t("gotoDashboard")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/create" className="card-glow-action rounded-xl border border-white/8 bg-white/3 p-5 hover:border-cyan-400/20 transition-all group">
              <div className="text-2xl mb-2">⬡</div>
              <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{t("createNewEscrow")}</h3>
              <p className="text-xs text-slate-500 mt-1">{t("createNewEscrowDesc")}</p>
            </Link>
            <Link href="/dashboard" className="card-glow-action rounded-xl border border-white/8 bg-white/3 p-5 hover:border-cyan-400/20 transition-all group">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{t("viewExisting")}</h3>
              <p className="text-xs text-slate-500 mt-1">{t("viewExistingDesc")}</p>
            </Link>
          </div>
        </section>

        {/* ── Feature Cards ────────────────────────────────────────── */}
        <section data-tour="feature-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className={`${f.glow} rounded-xl border p-6 ${f.accent.split(" ").slice(0, 2).join(" ")}`}
            >
              <div className={`text-2xl mb-3 ${f.accent.split(" ")[2]}`}>{f.icon}</div>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* ── How It Works CTA ─────────────────────────────────────── */}
        <section>
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="text-3xl">📘</span>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{t("howWorksTitle")}</h3>
                <p className="text-sm text-slate-400 mt-1">{t("howWorksDesc")}</p>
              </div>
              <Link
                href="/learn"
                className="btn-glow shrink-0 px-5 py-2.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium hover:bg-cyan-400/15 transition-all"
              >
                {t("openGuide")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── AI Arbiter ───────────────────────────────────────────── */}
        <section className="rounded-2xl border border-violet-400/15 bg-violet-400/3 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/5 px-4 py-1.5 text-xs text-violet-300">
              🤖 {t("aiPowered")}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {t("aiTitle")}{" "}
              <span className="text-purple-400" style={{ textShadow: "0 0 30px rgba(168,85,247,0.4)" }}>{t("aiTitleHighlight")}</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">{t("aiSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {aiSteps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="card-glow-emerald rounded-xl border border-emerald-400/20 bg-violet-400/5 p-4"
              >
                <p className="text-2xl font-bold font-mono text-purple-400 mb-2">{s.step}</p>
                <p className="font-semibold text-white text-sm mb-1">{s.title}</p>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-white text-sm">{t("aiPricingTitle")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("aiPricingDesc")}</p>
            </div>
            <Link
              href="/create"
              data-tour="cta-create"
              className="btn-glow shrink-0 px-5 py-2 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-400/20 transition-all"
            >
              {t("createEscrow")}
            </Link>
          </div>
        </section>

        {/* ── Protocol Stats ───────────────────────────────────────── */}
        <section data-tour="stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {stats.map(s => (
            <div key={s.label} className="card-glow-stats rounded-xl border border-white/8 bg-white/3 p-5">
              <p
                className="text-4xl sm:text-5xl font-bold font-mono text-cyan-400"
                style={{ textShadow: "0 0 20px rgba(0,245,255,0.4), 0 0 10px rgba(59,130,246,0.3)" }}
              >
                {s.value}
              </p>
              <p className="mt-2 text-xs text-slate-500 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </section>

      </main>

      <OnboardingTour />
      <Footer />
    </div>
  );
}
