export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: May 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-gray-300">
        <p>EscrowHubs ("we", "our", "us") is a decentralized, non-custodial escrow protocol. We are committed to collecting as little information as possible while still providing a secure and functional service. By using EscrowHubs, you agree to the practices described in this Privacy Policy.</p>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. What Data We Collect</h2>
          <h3 className="font-medium text-white/80 mb-1">1.1 Wallet Information</h3>
          <p>When you connect a wallet, we collect your public wallet address and your public on-chain transaction history (as visible on the blockchain). We do not collect or store private keys.</p>
          <h3 className="font-medium text-white/80 mt-3 mb-1">1.2 On-Chain Escrow Data</h3>
          <p>All escrow activity is recorded on supported blockchains (e.g., Celo, Base). This includes escrow contract addresses, deposit amounts, release conditions, dispute events, and arbitration outcomes. This information is publicly visible on the blockchain and cannot be altered or deleted.</p>
          <h3 className="font-medium text-white/80 mt-3 mb-1">1.3 Optional Arbitration Evidence</h3>
          <p>If you submit evidence during a dispute, we may temporarily process text descriptions, uploaded files, and links. Evidence is used only for arbitration and is deleted after the dispute is resolved unless required for fraud prevention.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. What Data We Do NOT Collect</h2>
          <p>EscrowHubs does not collect names, email addresses, phone numbers, government IDs, passwords, private keys, biometric data, location data, or device identifiers. We do not require account registration.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. How We Use Your Data</h2>
          <p>We use limited data to operate the escrow protocol (creating and managing contracts, verifying transaction status, enabling dispute resolution), for security and fraud prevention, and to improve the service through aggregated, anonymized usage patterns. We do not sell or share personal data with advertisers.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Blockchain Data & Public Visibility</h2>
          <p>EscrowHubs operates on public blockchains. Transactions are public and permanent, anyone can view escrow activity using block explorers, and blockchain data cannot be modified or deleted. Your use of the Service constitutes acceptance of blockchain transparency.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">5. Third-Party Services</h2>
          <p>EscrowHubs integrates with Celoscan/Basescan for transaction verification, ODIS (optional) for phone-number-based verification (we do not receive or store your phone number), and wallet providers such as MetaMask, Celo Wallet, and MiniPay. These services have their own privacy policies and we do not control their data practices.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">6. Cookies & Analytics</h2>
          <p>EscrowHubs does not use tracking cookies, advertising cookies, fingerprinting, or cross-site tracking. We may use basic, privacy-preserving analytics to understand aggregate usage without collecting personal data.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">7. Data Retention</h2>
          <p>On-chain data is retained permanently (it is public and immutable). Arbitration evidence is retained only until the dispute is resolved. Support emails are retained as long as necessary to address your inquiry.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">8. Security</h2>
          <p>We implement industry-standard security practices including non-custodial architecture, no private key storage, encrypted evidence storage (temporary), and smart contract audits where applicable. You are responsible for securing your wallet and private keys.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">9. Children's Privacy</h2>
          <p>EscrowHubs is not intended for individuals under 18. We do not knowingly collect data from minors.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">10. Your Rights</h2>
          <p>You may disconnect your wallet at any time, delete arbitration evidence before submission, and request deletion of off-chain evidence after a dispute. On-chain data cannot be deleted or altered.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Continued use of the Service constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">12. Contact Us</h2>
          <p>For privacy questions or requests: <a href="mailto:support@escrowhubs.io" className="text-blue-400 hover:underline">support@escrowhubs.io</a></p>
        </section>
      </div>
    </main>
  );
}
