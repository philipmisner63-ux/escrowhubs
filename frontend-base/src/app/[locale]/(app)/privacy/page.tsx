"use client";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
      <Nav />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2 text-cyan-400">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: April 12, 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>EscrowHubs collects minimal information to operate the Platform:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>Wallet addresses used to interact with the Platform</li>
              <li>Transaction data recorded on-chain (public by nature)</li>
              <li>Evidence submitted during dispute resolution (stored on IPFS)</li>
              <li>Support requests submitted through the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Do Not Collect</h2>
            <p>EscrowHubs does not collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>Your name or personal identity (unless voluntarily provided in support)</li>
              <li>Payment card information (handled entirely by Stripe)</li>
              <li>Bank account details (handled by Stripe)</li>
              <li>Cookies for tracking or advertising</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Information</h2>
            <p>Information collected is used solely to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>Operate and improve the escrow platform</li>
              <li>Facilitate dispute resolution</li>
              <li>Respond to support requests</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Blockchain Data</h2>
            <p>All on-chain transactions are public by nature of the blockchain networks we operate on (Base, Polygon, Celo). Transaction details including wallet addresses, amounts, and contract interactions are permanently recorded on-chain and are not within our ability to delete or modify.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Third-Party Services</h2>
            <p>EscrowHubs integrates with the following third-party services:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li><strong className="text-slate-300">Stripe</strong> — payment processing and fiat onramp/offramp. Subject to Stripe's Privacy Policy.</li>
              <li><strong className="text-slate-300">Pinata / IPFS</strong> — decentralized storage for dispute evidence files.</li>
              <li><strong className="text-slate-300">Anthropic Claude</strong> — AI arbitration processing. Evidence submitted to disputes may be processed by Claude.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Retention</h2>
            <p>On-chain data is permanent. Off-chain data (support requests, evidence files) is retained for a minimum of 2 years for dispute resolution purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p>You may request deletion of any off-chain data we hold about you by contacting us through the Platform. On-chain data cannot be deleted due to the immutable nature of blockchain technology.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibent text-white mb-3">8. Security</h2>
            <p>We take reasonable measures to protect the Platform and any off-chain data. However, no system is perfectly secure. Smart contract interactions carry inherent risks as described in our Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The date at the top of this page indicates when it was last updated.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Contact</h2>
            <p>For privacy-related questions, contact us through the support button on the Platform or visit <a href="https://app.escrowhubs.io" className="text-cyan-400 hover:underline">app.escrowhubs.io</a>.</p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
