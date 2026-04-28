/**
 * English (en) translations for EscrowHubs frontend-celo.
 * Mirrors all keys from sw.ts with English strings.
 */
export const en = {
  // ── App-wide ──────────────────────────────────────────────────────────────
  appName: "EscrowHubs",
  poweredByCelo: "Powered by Celo · Funds secured by smart contract",
  back: "← Back",

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    tagline: "Safe payments, anywhere.",
    walletConnecting: "Connecting your wallet...",
    walletOpenInMiniPay: "Open this app inside MiniPay to connect your wallet",
    balanceLabel: "Balance:",
    ctaSendPayment: "💸 Send a Safe Payment",
    ctaMyPayments: "📋 My Payments",
    howItWorksTitle: "How it works",
    steps: {
      lockFunds: { title: "Lock funds", desc: "Your cUSD is held in a smart contract — not by us" },
      jobDone: { title: "Job gets done", desc: "The other party completes the work" },
      releasePayment: { title: "Release payment", desc: "You confirm and funds are released instantly" },
      dispute: { title: "Dispute?", desc: "AI reviews the evidence and decides fairly" },
    },
    footer: "Powered by Celo · Funds secured by smart contract",
    explainer: {
      tagline: "Safe payments, anywhere.",
      openInMiniPay: "Open in MiniPay",
      trustLine: "Smart contract on Celo · Audited · EscrowHubs LLC",
      tryDemo: "Try Demo →",
    },
  },

  // ── Create escrow page ────────────────────────────────────────────────────
  create: {
    pageTitle: "Send a safe payment",
    pageSubtitle: "Funds are held until the job is done",
    recipientLabel: "Who are you paying?",
    recipientPlaceholder: "+254 712 345 678 or 0x...",
    resolvingWallet: "Looking up wallet...",
    resolvedFound: "Found —",
    resolvedNotFound:
      "No MiniPay wallet found for that number. Ask them to share their wallet address instead.",
    amountLabel: "Amount (cUSD)",
    descriptionLabel: "What is this for?",
    descriptionPlaceholder: "e.g. Logo design, 3 concepts delivered by Friday",
    descriptionHint: "This is stored on-chain and used if there's a dispute",
    progressApproving: "Approving cUSD spend...",
    progressCreating: "Creating escrow on Celo...",
    submitProcessing: "Processing...",
    submitButton: "Lock {amount} cUSD safely", // replace {amount} at runtime
    feeNotice: "A 0.5% fee is charged when funds are released · Powered by Celo",

    // Error messages
    errorNoWallet: "Open this in MiniPay to connect your wallet.",
    errorNoAddress: "Enter a valid phone number or wallet address.",
    errorNoAmount: "Enter an amount.",
    errorNoDescription: "Describe what this payment is for.",
    errorGeneric: "Something went wrong. Please try again.",

    // Done screen
    doneEmoji: "✅",
    doneTitle: "Payment locked",
    doneSubtitle: "Your cUSD is held safely. Release it when the job is done.",
    shareButton: "🔗 Share payment link",
    shareCopied: "✓ Copied!",
    viewPayments: "View my payments",
  },

  // ── My Payments (escrows list) page ───────────────────────────────────────
  escrows: {
    pageTitle: "My Payments",
    notConnected: "Open this app in MiniPay to see your payments",
    noPayments: "No payments yet",
    ctaSendFirst: "Send a safe payment",
    sent: "Sent",
    received: "Received",
    stateLabels: {
      awaitingDeposit: "Awaiting deposit",
      funded: "Funded",
      released: "Released",
      disputed: "Disputed",
      refunded: "Refunded",
    },
  },

  // ── Escrow detail page ────────────────────────────────────────────────────
  escrowDetail: {
    stateDescriptions: {
      awaitingDeposit: "Funds haven't been deposited yet.",
      funded: "cUSD is held safely in the smart contract.",
      released: "The payment was sent to the recipient.",
      disputed: "The AI arbiter is reviewing this payment.",
      refunded: "The funds were returned to the sender.",
    },
    stateLabels: {
      awaitingDeposit: "Awaiting deposit",
      funded: "Funds locked",
      released: "Payment released",
      disputed: "Under dispute",
      refunded: "Refunded",
    },
    partiesTitle: "Parties",
    senderLabel: "Sender",
    recipientLabel: "Recipient",
    you: "(you)",
    actionRelease: "✅ Job done — Release payment",
    actionDispute: "⚖️ Problem? Raise a dispute",
    disputeNote: "Raising a dispute sends this to our AI arbiter for a fair review",
    beneficiaryInfo: "Funds are locked. Complete the job and ask the sender to release payment",
    viewOnCeloscan: "View on Celoscan",
    amountLabel: "Amount",
    errorGeneric: "Transaction failed. Please try again.",
    backToPayments: "← My Payments",
  },
} as const;

export type EnglishKeys = typeof en;
