"use client";

import { useEffect } from "react";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { useTranslations } from "next-intl";
import { SimpleFlow } from "@/components/how-it-works/SimpleFlow";
import { MilestoneFlow } from "@/components/how-it-works/MilestoneFlow";
import { AIArbiterFlow } from "@/components/how-it-works/AIArbiterFlow";

export default function HowItWorksPage() {
  const t = useTranslations("howItWorks");
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="mx-auto w-full max-w-2xl px-4 pb-8 sm:px-6 pt-20 md:pt-8">
          <div className="space-y-12">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
              <p className="mt-2 text-slate-400">{t("subtitle")}</p>
            </div>

            <SimpleFlow />
            <MilestoneFlow />
            <AIArbiterFlow />
          </div>
      </main>
      <Footer />
    </div>
  );
}
