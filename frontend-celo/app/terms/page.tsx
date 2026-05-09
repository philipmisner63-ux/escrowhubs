export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-4">Last updated: May 2026</p>
      <section className="space-y-4 text-sm leading-relaxed">
        <p>EscrowHubs provides a decentralized escrow service on the Celo blockchain. By using this app, you agree to these terms.</p>
        <h2 className="font-semibold text-base mt-6">1. Service Description</h2>
        <p>EscrowHubs allows users to create and manage escrow contracts on the Celo blockchain. Funds are held in smart contracts until conditions are met.</p>
        <h2 className="font-semibold text-base mt-6">2. User Responsibilities</h2>
        <p>You are responsible for ensuring your wallet is secure and for verifying all transaction details before signing.</p>
        <h2 className="font-semibold text-base mt-6">3. Fees</h2>
        <p>A 2% platform fee is charged on escrow release. Network (gas) fees apply to all blockchain transactions.</p>
        <h2 className="font-semibold text-base mt-6">4. Disputes</h2>
        <p>Disputes are resolved through our AI arbitration system. Final decisions are executed on-chain.</p>
        <h2 className="font-semibold text-base mt-6">5. Contact</h2>
        <p>For support, visit our Discord or email support@escrowhubs.io</p>
      </section>
    </main>
  )
}
