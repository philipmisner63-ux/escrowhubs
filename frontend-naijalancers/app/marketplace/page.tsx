"use client";

import Link from "next/link";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useSession } from "@/components/session-provider";
import { GoogleSignInButton } from "@/components/google-signin";
import { WalletPanel } from "@/components/wallet-panel";

const CATEGORIES = [
  {
    icon: "📱",
    title: "Electronics",
    example: "Buying a tokunbo iPhone on Jiji? Send the escrow link, not the money.",
  },
  {
    icon: "🚗",
    title: "Cars & Vehicles",
    example: "Found a car on Facebook Marketplace? Don't pay until you've seen it.",
  },
  {
    icon: "👗",
    title: "Fashion & Clothing",
    example: "Ordered Aso-Oke or sneakers from Instagram? Hold payment in escrow.",
  },
  {
    icon: "🏠",
    title: "Rentals & Property",
    example: "Paying a caution fee or agent? Make sure they're real first.",
  },
  {
    icon: "💼",
    title: "Services",
    example: "Hired a designer or contractor on WhatsApp? Protect your payment.",
  },
  {
    icon: "🌾",
    title: "Goods & Trade",
    example: "Bulk order from Onitsha market? Escrow protects both sides.",
  },
];

export default function MarketplacePage() {
  const { session } = useSession();

  return (
    <main className="flex flex-col min-h-screen">
      <MarketplaceNav />

      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 py-8">
            {/* Left sidebar — wallet panel (logged in only) */}
            {session && (
              <aside className="w-full lg:w-72 flex-shrink-0">
                <div className="lg:sticky lg:top-20">
                  <WalletPanel />
                </div>
              </aside>
            )}

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Hero */}
              <section className="relative pb-10 text-center">
                <div className="max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#35D07F]/30 bg-[#35D07F]/10 px-4 py-1.5 text-xs font-medium text-[#35D07F] mb-5">
                    Safe Payments for Any Deal in Nigeria
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                    Buy or Sell Anything — Safely
                  </h1>
                  <p className="text-lg text-white/60 mb-2 max-w-md mx-auto">
                    Nigeria's #1 fraud problem is paying before you receive. Escrow fixes that.
                  </p>
                  <p className="text-sm text-white/40 mb-8 max-w-sm mx-auto">
                    Create a free escrow link. The buyer pays into the contract. The seller only gets the money after delivery.
                  </p>

                  {!session ? (
                    <div className="flex flex-col items-center gap-4">
                      <GoogleSignInButton />
                      <p className="text-xs text-white/30">
                        Sign in with Google — your wallet is created automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Link href="/create">
                        <GlowButton variant="primary" className="min-w-[200px]">
                          Create Escrow Link
                        </GlowButton>
                      </Link>
                      <Link href="/dashboard">
                        <GlowButton variant="secondary" className="min-w-[200px]">
                          My Deals
                        </GlowButton>
                      </Link>
                    </div>
                  )}
                </div>
              </section>

              {/* Category grid */}
              <section className="pb-12">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-bold text-white text-center mb-6">What are you protecting?</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {CATEGORIES.map((cat) => (
                      <GlassCard key={cat.title} className="p-5 flex flex-col" accentColor="green">
                        <div className="text-3xl mb-3">{cat.icon}</div>
                        <div className="text-sm font-semibold text-white mb-2">{cat.title}</div>
                        <p className="text-xs text-white/50 leading-relaxed flex-1 mb-4">{cat.example}</p>
                        <Link href="/create">
                          <GlowButton variant="primary" className="w-full text-xs">
                            Create Escrow Link
                          </GlowButton>
                        </Link>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              </section>

              {/* How it works */}
              <section className="pb-12">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-bold text-white text-center mb-6">How It Works</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        icon: "🔗",
                        step: "1",
                        title: "Create Escrow Link",
                        desc: "Seller describes the item or service and sets the price. A secure payment link is created.",
                      },
                      {
                        icon: "💰",
                        step: "2",
                        title: "Buyer Pays",
                        desc: "The buyer receives the link and deposits funds. Money is held safely — neither party can touch it.",
                      },
                      {
                        icon: "🤝",
                        step: "3",
                        title: "Delivered, Money Released",
                        desc: "When the item or service is delivered, funds are released instantly to the seller.",
                      },
                    ].map((s) => (
                      <GlassCard key={s.step} className="p-5 text-center" accentColor="green">
                        <div className="text-3xl mb-3">{s.icon}</div>
                        <div className="text-xs font-bold text-[#35D07F] mb-1">Step {s.step}</div>
                        <div className="text-sm font-semibold text-white mb-1">{s.title}</div>
                        <div className="text-xs text-white/50 leading-relaxed">{s.desc}</div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              </section>

              {/* Trust section */}
              <section className="pb-16">
                <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      icon: "🔐",
                      title: "Your Money Is Safe",
                      desc: "Funds are locked securely. No one can withdraw until both sides agree the deal is complete.",
                    },
                    {
                      icon: "🚀",
                      title: "No Upfront Risk",
                      desc: "Buyers only release payment when satisfied. Sellers know the money is already there.",
                    },
                    {
                      icon: "⚡",
                      title: "Instant Settlement",
                      desc: "Once delivery is confirmed, payment is released in seconds.",
                    },
                    {
                      icon: "🌍",
                      title: "Built for Africa",
                      desc: "Made for Nigerians buying and selling online. Naira-friendly with low costs.",
                    },
                  ].map((v) => (
                    <GlassCard key={v.title} className="p-5" accentColor="green">
                      <div className="text-2xl mb-2">{v.icon}</div>
                      <p className="text-sm font-semibold text-white mb-1">{v.title}</p>
                      <p className="text-xs text-white/50 leading-relaxed">{v.desc}</p>
                    </GlassCard>
                  ))}
                </div>
              </section>

              {/* Bottom CTA */}
              <section className="pb-16 text-center">
                <div className="max-w-md mx-auto">
                  <h2 className="text-xl font-bold text-white mb-3">Already on Jiji, Facebook Marketplace, or WhatsApp?</h2>
                  <p className="text-sm text-white/50 mb-6">
                    Use our escrow link for any deal. Just create a link and share it with your buyer or seller.
                  </p>
                  {!session ? (
                    <GoogleSignInButton />
                  ) : (
                    <Link href="/create">
                      <GlowButton variant="primary" className="mx-auto">
                        Create Your First Escrow Link
                      </GlowButton>
                    </Link>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
