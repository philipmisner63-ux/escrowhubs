import { Nav } from "@/components/nav";
import { PageWrapper } from "@/components/page-wrapper";
import { SimpleFlow } from "@/components/how-it-works/SimpleFlow";
import { MilestoneFlow } from "@/components/how-it-works/MilestoneFlow";
import { AIArbiterFlow } from "@/components/how-it-works/AIArbiterFlow";

export const metadata = {
  title: "How It Works | BlockDAG Escrow",
  description: "Learn how simple, milestone, and AI-arbiter escrow flows work on BlockDAG.",
};

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <PageWrapper>
          <div className="space-y-12">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-white">How It Works</h1>
              <p className="mt-2 text-slate-400">
                Three ways to use escrow on BlockDAG — simple release, milestone-based payments, or AI-powered dispute resolution.
              </p>
            </div>

            <SimpleFlow />
            <MilestoneFlow />
            <AIArbiterFlow />
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}
