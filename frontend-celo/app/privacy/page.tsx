export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-4">Last updated: May 2026</p>
      <section className="space-y-4 text-sm leading-relaxed">
        <p>EscrowHubs is a decentralized application. We collect minimal data necessary to provide the service.</p>
        <h2 className="font-semibold text-base mt-6">1. Data We Collect</h2>
        <p>We collect your wallet address when you connect, and transaction data that is publicly visible on the Celo blockchain.</p>
        <h2 className="font-semibold text-base mt-6">2. Data We Do Not Collect</h2>
        <p>We do not collect personal information, email addresses, or private keys. No account registration is required.</p>
        <h2 className="font-semibold text-base mt-6">3. Blockchain Data</h2>
        <p>All escrow transactions are recorded on the public Celo blockchain and are permanently visible.</p>
        <h2 className="font-semibold text-base mt-6">4. Third Parties</h2>
        <p>We use Celoscan for transaction verification and ODIS for phone number resolution. These services have their own privacy policies.</p>
        <h2 className="font-semibold text-base mt-6">5. Contact</h2>
        <p>For privacy questions, contact support@escrowhubs.io</p>
      </section>
    </main>
  )
}
