// ─── Mock data for sandbox — no real blockchain calls ─────────────────────────
import { DEFAULT_CHAIN_ID, getRpcUrl } from "@/lib/chains";

export const MOCK_SIMPLE_ESCROW = {
  address: "0xDeAdBeEf1234567890AbCdEf1234567890aBcDeF",
  type: "simple" as const,
  state: 1, // AWAITING_DELIVERY
  stateLabel: "Awaiting Delivery",
  amount: "5.0000",
  symbol: "BDAG",
  depositor:   "0xAAA1111111111111111111111111111111111111",
  beneficiary: "0xBBB2222222222222222222222222222222222222",
  arbiter:     "0xCCC3333333333333333333333333333333333333",
  createdAt: "2026-03-30T10:00:00Z",
  events: [
    { name: "Deposited", actor: "Depositor", time: "2026-03-30 10:00", txHash: "0xabc123" },
    { name: "Dispute Raised", actor: "Depositor", time: "2026-03-31 14:22", txHash: "0xdef456" },
    { name: "Evidence Submitted", actor: "Beneficiary", time: "2026-03-31 15:05", txHash: "0xfed789" },
  ],
};

export const MOCK_MILESTONE_ESCROW = {
  address: "0xFaCe1234567890ABcdef1234567890abcDEF5678",
  type: "milestone" as const,
  funded: true,
  totalDeposited: "12.5000",
  symbol: "BDAG",
  depositor:   "0xAAA1111111111111111111111111111111111111",
  beneficiary: "0xBBB2222222222222222222222222222222222222",
  arbiter:     "0xCCC3333333333333333333333333333333333333",
  milestones: [
    { description: "Project Kickoff & Setup",     amount: "2.5",  state: 1, stateLabel: "Released"  },
    { description: "Design & Wireframes Complete", amount: "3.0",  state: 1, stateLabel: "Released"  },
    { description: "Backend API Development",      amount: "4.0",  state: 0, stateLabel: "Pending"   },
    { description: "Frontend Integration",         amount: "3.0",  state: 0, stateLabel: "Pending"   },
  ],
  events: [
    { name: "Funded",             actor: "Depositor",  time: "2026-03-28 09:00", txHash: "0x111aaa" },
    { name: "Milestone 1 Released", actor: "Depositor", time: "2026-03-29 11:30", txHash: "0x222bbb" },
    { name: "Milestone 2 Released", actor: "Depositor", time: "2026-03-31 16:45", txHash: "0x333ccc" },
  ],
};

export const FAQ_ITEMS = [
  {
    q: "What is EscrowHubs?",
    a: "A trustless escrow system that locks funds in a smart contract until both sides agree the deal is done. No accounts, no company holding your money — just code.",
  },
  {
    q: "Do I need an account?",
    a: "No. Just connect your wallet. Your wallet address is your identity — no sign-up required.",
  },
  {
    q: "Who holds the money?",
    a: "A smart contract — not EscrowHubs, not the other party. Neither side can move funds unilaterally.",
  },
  {
    q: "What is the AI Arbiter?",
    a: "An AI system that reviews evidence from both parties and issues a binding ruling — executed automatically on-chain. No humans, no delays, no bias. Only activates when a dispute is opened.",
  },
  {
    q: "How long does arbitration take?",
    a: "Both parties have 48 hours to submit evidence. The AI arbiter then rules within minutes. The decision is signed and executed on-chain automatically.",
  },
  {
    q: "What if something goes wrong?",
    a: "Either party can open a dispute. The AI Arbiter reviews the case and issues a binding on-chain ruling — funds go to the beneficiary or back to the depositor based on the evidence.",
  },
  {
    q: "What is a Milestone Escrow?",
    a: "A Milestone Escrow splits the payment into phases. The depositor releases each milestone independently as work is delivered — full dispute protection at every stage.",
  },
  {
    q: "What fees are charged?",
    a: "A 0.5% protocol fee on the escrow amount. If AI Arbiter is selected, an additional flat fee applies. No hidden charges.",
  },
  {
    q: "What networks are supported?",
    a: "Base, Polygon, and BlockDAG. Any EVM wallet works — MetaMask, Trust Wallet, WalletConnect-compatible wallets.",
  },
  {
    q: "Can EscrowHubs move my funds?",
    a: "No. Only the smart contract can move funds, based on release or arbitration. EscrowHubs has no custody over your money.",
  },
  {
    q: "Is the code audited?",
    a: "The contracts are open source and available on GitHub. A formal third-party audit is planned. Always review the contract code before committing significant funds.",
  },
  {
    q: "Can I use this on mobile?",
    a: "Yes. Any WalletConnect-compatible mobile wallet works. Trust Wallet and MetaMask Mobile have been tested on Base and BlockDAG.",
  },
];

export const ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Connect Your Wallet",
    description: "Click 'Connect Wallet' in the top right. Choose WalletConnect and select your wallet (Trust Wallet, MetaMask, etc.).",
    icon: "🔗",
    states: ["not_connected", "connecting", "connected"],
  },
  {
    step: 2,
    title: "Switch to BlockDAG Network",
    description: `Make sure your wallet is on BlockDAG (Chain ID ${DEFAULT_CHAIN_ID}). The app will prompt you to switch automatically.`,
    icon: "🌐",
    states: ["wrong_network", "switching", "correct_network"],
  },
  {
    step: 3,
    title: "Create an Escrow",
    description: "Go to Create, enter the beneficiary address, arbiter, and amount. Choose Simple or Milestone. Deploy the contract.",
    icon: "📝",
    states: ["filling_form", "deploying", "deployed"],
  },
  {
    step: 4,
    title: "Manage the Escrow",
    description: "Monitor status on the Dashboard. Release funds when work is complete, or raise a dispute if needed.",
    icon: "⚡",
    states: ["awaiting", "releasing", "complete"],
  },
];
