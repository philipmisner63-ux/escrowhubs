// ─── Mock data for sandbox — no real blockchain calls ─────────────────────────
import { DEFAULT_CHAIN_ID, getRpcUrl } from "@/lib/chains";

export const MOCK_SIMPLE_ESCROW = {
  address: "0xDeAdBeEf1234567890AbCdEf1234567890aBcDeF",
  type: "simple" as const,
  state: 1, // AWAITING_DELIVERY
  stateLabel: "Awaiting Delivery",
  amount: "5.0000",
  symbol: "ETH",
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
  symbol: "ETH",
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
    q: "What is a blockchain escrow?",
    a: "A blockchain escrow is a smart contract that holds funds on behalf of two parties until predefined conditions are met. Unlike traditional escrow, it is trustless — no third party can steal or misappropriate the funds.",
  },
  {
    q: "Who are the three parties in an escrow?",
    a: "The Depositor locks funds into the contract. The Beneficiary receives funds when conditions are met. The Arbiter resolves disputes if the two parties disagree — this can be a human wallet or the AI Arbiter contract.",
  },
  {
    q: "What is a Milestone Escrow?",
    a: "A Milestone Escrow splits the total payment into phases. Each milestone has a description and amount. The depositor releases each milestone independently as work is completed, rather than releasing everything at once.",
  },
  {
    q: "What happens if there is a dispute?",
    a: "Either party can raise a dispute. The arbiter then reviews the case and calls either resolveRelease (funds go to beneficiary) or resolveRefund (funds return to depositor). If the AI Arbiter is used, this happens automatically after evidence is submitted on-chain.",
  },
  {
    q: "What is the AI Arbiter?",
    a: "The AI Arbiter is a smart contract backed by an oracle service. When a dispute is raised, both parties can submit evidence on-chain. The AI reviews the evidence and executes the resolution automatically — no human arbiter required.",
  },
  {
    q: "What fees are charged?",
    a: "A 0.5% protocol fee is charged on the escrow amount at creation. If the AI Arbiter is selected, an additional flat fee of small ETH fee is charged. These fees accumulate in the factory contract and are withdrawable by the owner.",
  },
  {
    q: "Can I use any wallet?",
    a: `Yes — any WalletConnect-compatible wallet works. Trust Wallet and MetaMask have been tested. Make sure your wallet is connected to Base (Chain ID ${DEFAULT_CHAIN_ID}, RPC: ${getRpcUrl(DEFAULT_CHAIN_ID)}).`,
  },
  {
    q: "Is the code audited?",
    a: "The contracts are open source and available on GitHub. A formal third-party audit is planned. Always review the contract code before committing significant funds.",
  },
  {
    q: "What happens if confirmation takes a long time?",
    a: "Base confirms in ~2 seconds to confirm transactions. The app will wait up to 120 seconds for a receipt and actively polls for state changes after confirmation. If it times out, your escrow will still appear on the dashboard once the chain catches up.",
  },
  {
    q: "Can I use this on mobile?",
    a: "Yes. Trust Wallet mobile is supported via WalletConnect. Make sure to disconnect any other active sessions before signing transactions on mobile to avoid session conflicts.",
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
    title: "Switch to Base Network",
    description: `Make sure your wallet is on Base (Chain ID ${DEFAULT_CHAIN_ID}). The app will prompt you to switch automatically.`,
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
