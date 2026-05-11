export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: May 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-gray-300">
        <p>These Terms of Service ("Terms") govern your access to and use of EscrowHubs ("EscrowHubs", "we", "our", or "us"), including the EscrowHubs website, decentralized application, smart contracts, APIs, and any related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use EscrowHubs.</p>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Overview of the Service</h2>
          <p>EscrowHubs provides a non-custodial, smart-contract-based escrow protocol deployed on supported blockchains (including Celo, Base, Polygon, and others). Funds are held in self-executing smart contracts until release conditions are met or an arbitration process resolves a dispute. EscrowHubs does not hold user funds, private keys, or custody of any assets. All transactions occur directly on-chain.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Eligibility</h2>
          <p>You may use the Service only if you are at least 18 years old, you have the legal capacity to enter into binding agreements, and your use complies with applicable laws in your jurisdiction. You are solely responsible for ensuring that blockchain-based escrow services are legal where you reside.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Non-Custodial Nature</h2>
          <p>EscrowHubs is a software protocol, not a financial institution. We do not control user funds. We cannot reverse, modify, or cancel transactions. You are solely responsible for your wallet, private keys, and transaction approvals. If you lose access to your wallet, EscrowHubs cannot recover funds.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. User Responsibilities</h2>
          <p>By using the Service, you agree to verify all transaction details before signing, ensure the accuracy of recipient addresses, amounts, and contract parameters, maintain the security of your wallet and private keys, comply with all applicable laws, and not use the Service for illegal or fraudulent purposes. You acknowledge that blockchain transactions are irreversible.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">5. Fees</h2>
          <p>EscrowHubs charges protocol fees as displayed in the application at the time of escrow creation or release. Fees may include a platform fee (2% of escrow release amount), AI arbitration fee, and network gas fees required by the blockchain. Fees are automatically deducted by the smart contract and are non-refundable.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">6. AI Arbitration & Dispute Resolution</h2>
          <p>If a dispute is opened, both parties may submit evidence. The EscrowHubs AI Arbiter analyzes the evidence and issues a binding decision executed automatically on-chain. AI arbitration decisions are final and irreversible once executed on-chain. EscrowHubs does not manually intervene in disputes. You are responsible for providing accurate and complete evidence.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">7. No Financial, Legal, or Tax Advice</h2>
          <p>EscrowHubs does not provide legal, financial, investment, or tax advice. All decisions you make using the Service are your own.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">8. Risks</h2>
          <p>Using blockchain technology involves risks including smart contract vulnerabilities, network congestion or failure, wallet compromise, irreversible transactions, volatile asset values, and third-party wallet or provider outages. You acknowledge that you use EscrowHubs at your own risk.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">9. Prohibited Uses</h2>
          <p>You agree not to use the Service for money laundering, fraud or scams, terrorist financing, sanctions evasion, illegal goods or services, exploiting smart contract vulnerabilities, or interfering with the protocol. Violations may result in access restrictions or reporting to authorities where required by law.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">10. Intellectual Property</h2>
          <p>EscrowHubs owns all rights to the website, brand, UI/UX, documentation, AI arbitration logic, and off-chain components. Smart contracts deployed on public blockchains may be open-source or licensed separately.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">11. Third-Party Services</h2>
          <p>EscrowHubs may integrate with third-party wallets, RPC providers, or blockchain networks. We are not responsible for downtime, bugs, security issues, data loss, or changes in third-party terms.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">12. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, EscrowHubs is provided "as is" without warranties of any kind. We are not liable for any loss of funds, profits, data, or opportunities, or for smart contract bugs, exploits, or blockchain failures. Our total liability shall not exceed the amount of fees you paid to EscrowHubs in the past 12 months.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">13. Indemnification</h2>
          <p>You agree to indemnify and hold harmless EscrowHubs, its developers, contributors, and affiliates from any claims, damages, or losses arising from your use of the Service, your violation of these Terms, or disputes between you and other users.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">14. Changes to the Service or Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">15. Termination</h2>
          <p>We may suspend or restrict access to the Service if you violate these Terms, your use poses security or legal risks, or as required by law. You may stop using the Service at any time.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">16. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Washington, excluding conflict-of-law principles. Any disputes not handled by on-chain arbitration shall be resolved in Spokane County, Washington.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">17. Contact</h2>
          <p>For support or questions: <a href="mailto:support@escrowhubs.io" className="text-blue-400 hover:underline">support@escrowhubs.io</a></p>
        </section>
      </div>
    </main>
  );
}
