"use client";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
      <Nav />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2 text-cyan-400">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: April 12, 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using EscrowHubs ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>EscrowHubs is a decentralized escrow platform that facilitates peer-to-peer transactions for physical goods and digital services. The Platform uses smart contracts deployed on blockchain networks including Base, Polygon, and Celo to hold and release funds based on agreed conditions between buyers and sellers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Eligibility</h2>
            <p>You must be at least 18 years of age and legally capable of entering into binding contracts to use the Platform. By using EscrowHubs, you represent that you meet these requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Escrow Services</h2>
            <p>EscrowHubs facilitates the holding of funds in smart contracts on behalf of parties to a transaction. Funds are released according to the conditions set at the time of escrow creation. EscrowHubs does not take custody of fiat currency; all funds are held in smart contracts on-chain.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Dispute Resolution</h2>
            <p>In the event of a dispute, EscrowHubs provides an AI-assisted arbitration process. Both parties may submit evidence and a ruling will be issued based on the evidence provided. The AI arbiter's ruling is binding and will be executed on-chain. For complex disputes, a human review may be requested.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Fees</h2>
            <p>EscrowHubs charges a platform fee on completed transactions. Fee amounts are disclosed prior to escrow creation. Fees are non-refundable once an escrow transaction has been initiated.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Prohibited Uses</h2>
            <p>You may not use EscrowHubs for any unlawful purpose, including but not limited to: fraud, money laundering, financing of illegal activities, circumvention of sanctions, or any activity that violates applicable law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Physical Goods & Returns</h2>
            <p>For physical goods transactions, sellers are required to provide accurate descriptions of items. Buyers have a return window as specified at the time of escrow creation. Items must be returned in the same condition as received. Disputes regarding physical goods are subject to the EscrowHubs arbitration process.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>EscrowHubs is provided "as is." To the maximum extent permitted by law, EscrowHubs and its operators are not liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including losses resulting from smart contract bugs, blockchain network failures, or third-party service outages.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Smart Contract Risk</h2>
            <p>Smart contracts are software and may contain bugs or vulnerabilities. While EscrowHubs contracts have been developed with care, no guarantee of perfection is made. Users acknowledge and accept the inherent risks of interacting with smart contracts on public blockchain networks.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Geographic Restrictions</h2>
            <p>Certain payment features of EscrowHubs, including fiat-to-crypto onramp services powered by Stripe, are subject to geographic restrictions. Specifically, USDC purchases on Base and Polygon networks are <strong className="text-slate-200">not available to users in the state of New York</strong>. Additionally, onramp services are currently available only in the United States and select EU countries. By using the Platform, you represent that you are not located in a jurisdiction where such services are prohibited.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>EscrowHubs reserves the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Contact</h2>
            <p>For questions about these Terms, contact us through the support button on the Platform or visit <a href="https://app.escrowhubs.io" className="text-cyan-400 hover:underline">app.escrowhubs.io</a>.</p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
