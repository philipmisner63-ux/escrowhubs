/**
 * EscrowHubs UI Strings — v1 Copy Pack
 *
 * Static strings live here for use outside the i18n/next-intl system
 * (e.g. dynamic values, functions, or components not yet wired to locale JSON).
 *
 * For translatable static strings, prefer src/messages/[locale].json via next-intl.
 * Functions (chainHelper.wrong, milestones.release) must live here — i18n JSON
 * does not support runtime function values.
 */

export const STRINGS = {
  hero: {
    title: "EscrowHubs locks funds safely until both sides agree the deal is done.",
    subtitle:
      "Trustless P2P escrow for products, services, and DAO contracts — enforced by smart contracts and AI arbitration.",
    ctaCreate: "Create an Escrow",
    ctaHow: "How It Works",
  },

  why: {
    noCustody: "No custody — funds locked in contract",
    noAccounts: "No accounts — just connect and go",
    noUnilateral: "No unilateral withdrawals",
    aiArbiter: "AI arbitration — fast, unbiased, on-chain",
    multichain: "Multi-chain: Base, Polygon, BlockDAG",
  },

  onboarding: {
    step1:
      "Set the amount, the beneficiary address, and your terms. A smart contract is deployed for this deal only. No accounts or sign-ups required.",
    step2:
      "Send the link to the other party. They connect their wallet — the contract automatically recognizes their role.",
    step3:
      "Deposit funds. They deliver. You release when satisfied — or open a dispute and let the AI arbiter issue a binding on-chain decision. The arbiter cannot act unless a dispute is opened.",
  },

  counterparty: {
    message:
      "Here's our escrow on EscrowHubs. Funds are locked in a smart contract until we both agree the deal is done. Open the link and connect your wallet to join the escrow: {link}",
  },

  howItWorks: {
    steps: [
      "Create an escrow",
      "Share the link",
      "Deposit funds",
      "Work delivered",
      "Release or dispute",
    ],
    safety: [
      "Funds are held by the contract — not EscrowHubs",
      "Neither party can move funds alone",
      "AI arbiter resolves disputes with on-chain, tamper-proof rulings",
      "Arbiter only activates when a dispute is opened",
    ],
  },

  roles: {
    depositor: "Creates the escrow and locks the funds.",
    beneficiary: "Delivers the product, service, or work.",
    arbiter:
      "Reviews evidence from both parties and issues a binding on-chain ruling. Only activates when a dispute is opened — cannot move funds otherwise.",
    contract: "Holds funds securely until release or arbitration.",
  },

  chainHelper: {
    wrong: (escrowChain: string, currentChain: string): string =>
      `This escrow lives on ${escrowChain}. You're currently on ${currentChain}. Switch networks to continue.`,
    correct: "You're on the correct network for this escrow.",
    choose: "Choose the network where you want this escrow to live.",
  },

  advanced: {
    contractAddress: "Contract address",
    chainId: "Chain ID",
    explorer: "View on Explorer",
    abi: "Download ABI",
    oracleStatus: "Oracle status: Active ✓",
  },

  milestones: {
    release: (current: number, total: number): string =>
      `Release Milestone [${current} of ${total}]`,
    funded: "Milestone funded and locked.",
    waiting: "Waiting for milestone delivery…",
    released: "Milestone released.",
    complete: "All milestones complete. Escrow closed.",
  },

  errors: {
    contractNotFound: "Contract not found on this network.",
    wrongNetwork: "Wrong network — switch to continue.",
    walletNotConnected: "Wallet not connected.",
    transactionFailed: "Transaction failed — try again.",
    insufficientBalance: "Insufficient balance.",
  },

  faq: {
    whatIs:
      "A trustless escrow system that locks funds in a smart contract until both sides agree — works for products, services, freelance work, and DAO contracts.",
    needAccount: "No. Just connect your wallet.",
    whoHolds: "A smart contract — not EscrowHubs, not the other party.",
    aiArbiter:
      "An AI system that reviews evidence from both parties and issues a binding ruling — executed automatically on-chain. No humans, no delays, no bias.",
    arbitrationTime:
      "Both parties have 48 hours to submit evidence. The AI arbiter then rules within minutes.",
    networks: "Base, Polygon, and BlockDAG.",
    wallets: "Yes — any EVM wallet works.",
    canEscrowHubsMoveFunds:
      "No. Only the contract can move funds, based on release or arbitration.",
  },
} as const;
