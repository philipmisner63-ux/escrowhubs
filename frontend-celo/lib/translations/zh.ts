/**
 * Simplified Chinese (zh) translations for EscrowHubs frontend-celo.
 * Mirrors all keys from en.ts.
 */
export const zh = {
  // ── App-wide ──────────────────────────────────────────────────────────────
  appName: "EscrowHubs",
  poweredByCelo: "由Celo提供支持 · 资金由智能合约保障",
  back: "← 返回",

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    tagline: "安全支付，随时随地。",
    walletConnecting: "正在连接您的钱包...",
    walletOpenInMiniPay: "请在MiniPay中打开此应用以连接您的钱包",
    balanceLabel: "余额：",
    ctaSendPayment: "💸 发送安全付款",
    ctaMyPayments: "📋 我的付款",
    howItWorksTitle: "如何运作",
    steps: {
      lockFunds: { title: "锁定资金", desc: "您的cUSD或USDT存放在智能合约中 — 不在我们这里" },
      jobDone: { title: "工作完成", desc: "另一方完成工作" },
      releasePayment: { title: "释放付款", desc: "您确认后资金立即释放" },
      dispute: { title: "纠纷？", desc: "AI审查证据并公平裁决" },
    },
    footer: "由Celo提供支持 · 资金由智能合约保障",
    explainer: {
      tagline: "安全支付，随时随地。",
      openInMiniPay: "在MiniPay中打开",
      trustLine: "Celo上的智能合约 · 已审计 · EscrowHubs LLC",
      tryDemo: "查看演示 →",
    },
  },

  // ── Create escrow page ────────────────────────────────────────────────────
  create: {
    pageTitle: "发送安全付款",
    pageSubtitle: "资金将被持有直到工作完成",
    recipientLabel: "您要付款给谁？",
    recipientPlaceholder: "+86 138 0000 0000 或 0x...",
    resolvingWallet: "正在查找钱包...",
    resolvedFound: "已找到 —",
    resolvedNotFound:
      "未找到该号码的MiniPay钱包。请要求对方分享其钱包地址。",
    amountLabel: "金额 (cUSD)",
    descriptionLabel: "这是用于什么？",
    descriptionPlaceholder: "例如：Logo设计，周五前交付3个方案",
    descriptionHint: "这将存储在链上，如有纠纷将被使用",
    progressApproving: "正在批准cUSD支出...",
    progressCreating: "正在Celo上创建托管...",
    submitProcessing: "处理中...",
    submitButton: "安全锁定 {amount} {token}",
    feeNotice: "资金释放时收取0.5%手续费 · 由Celo提供支持",

    // Error messages
    errorNoWallet: "请在MiniPay中打开以连接您的钱包。",
    errorNoAddress: "请输入有效的电话号码或钱包地址。",
    errorNoAmount: "请输入金额。",
    errorNoDescription: "请描述此付款的用途。",
    errorGeneric: "出了点问题。请重试。",

    // Done screen
    doneEmoji: "✅",
    doneTitle: "付款已锁定",
    doneSubtitle: "您的cUSD已安全持有。工作完成后释放。",
    shareButton: "🔗 分享付款链接",
    shareCopied: "✓ 已复制！",
    viewPayments: "查看我的付款",
  },

  // ── My Payments (escrows list) page ───────────────────────────────────────
  escrows: {
    pageTitle: "我的付款",
    notConnected: "请在MiniPay中打开此应用以查看您的付款",
    noPayments: "暂无付款",
    ctaSendFirst: "发送安全付款",
    sent: "已发送",
    received: "已接收",
    stateLabels: {
      awaitingDeposit: "等待存款",
      funded: "已注资",
      released: "已释放",
      disputed: "纠纷中",
      refunded: "已退款",
    },
  },

  // ── Escrow detail page ────────────────────────────────────────────────────
  escrowDetail: {
    stateDescriptions: {
      awaitingDeposit: "资金尚未存入。",
      funded: "cUSD已安全存放在智能合约中。",
      released: "付款已发送给收款方。",
      disputed: "AI仲裁员正在审查此付款。",
      refunded: "资金已退还给发送方。",
    },
    stateLabels: {
      awaitingDeposit: "等待存款",
      funded: "资金已锁定",
      released: "付款已释放",
      disputed: "纠纷中",
      refunded: "已退款",
    },
    partiesTitle: "各方",
    senderLabel: "发送方",
    recipientLabel: "收款方",
    you: "（您）",
    actionRelease: "✅ 工作已完成 — 释放付款",
    actionDispute: "⚖️ 有问题？提出纠纷",
    disputeNote: "提出纠纷将发送至我们的AI仲裁员进行公平审查",
    beneficiaryInfo: "资金已锁定。完成工作并请发送方释放付款",
    viewOnCeloscan: "在Celoscan上查看",
    amountLabel: "金额",
    errorGeneric: "交易失败。请重试。",
    backToPayments: "← 我的付款",
  },
} as const;
