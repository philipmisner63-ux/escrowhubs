/**
 * Brazilian Portuguese (pt) translations for EscrowHubs frontend-celo.
 * Mirrors all keys from en.ts.
 */
export const pt = {
  // ── App-wide ──────────────────────────────────────────────────────────────
  appName: "EscrowHubs",
  poweredByCelo: "Desenvolvido pela Celo · Fundos garantidos por contrato inteligente",
  back: "← Voltar",

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    tagline: "Pagamentos seguros, em qualquer lugar.",
    walletConnecting: "Conectando sua carteira...",
    walletOpenInMiniPay: "Abra este app dentro do MiniPay para conectar sua carteira",
    balanceLabel: "Saldo:",
    ctaSendPayment: "💸 Enviar Pagamento Seguro",
    ctaMyPayments: "📋 Meus Pagamentos",
    howItWorksTitle: "Como funciona",
    steps: {
      lockFunds: { title: "Bloquear fundos", desc: "Seu cUSD ou USDT é mantido em um contrato inteligente — não por nós" },
      jobDone: { title: "Trabalho concluído", desc: "A outra parte conclui o trabalho" },
      releasePayment: { title: "Liberar pagamento", desc: "Você confirma e os fundos são liberados instantaneamente" },
      dispute: { title: "Disputa?", desc: "A IA revisa as evidências e decide de forma justa" },
    },
    footer: "Desenvolvido pela Celo · Fundos garantidos por contrato inteligente",
    explainer: {
      tagline: "Pagamentos seguros, em qualquer lugar.",
      openInMiniPay: "Abrir no MiniPay",
      trustLine: "Contrato inteligente na Celo · Auditado · EscrowHubs LLC",
      tryDemo: "Ver Demo →",
    },
  },

  // ── Create escrow page ────────────────────────────────────────────────────
  create: {
    pageTitle: "Enviar pagamento seguro",
    pageSubtitle: "Os fundos ficam retidos até o trabalho ser concluído",
    recipientLabel: "Para quem você está pagando?",
    recipientPlaceholder: "+55 11 91234-5678 ou 0x...",
    resolvingWallet: "Buscando carteira...",
    resolvedFound: "Encontrado —",
    resolvedNotFound:
      "Nenhuma carteira MiniPay encontrada para esse número. Peça para compartilhar o endereço da carteira.",
    amountLabel: "Valor (cUSD)",
    descriptionLabel: "Para que é isso?",
    descriptionPlaceholder: "ex. Design de logo, 3 conceitos entregues na sexta",
    descriptionHint: "Isso é armazenado na blockchain e usado em caso de disputa",
    progressApproving: "Aprovando gasto de cUSD...",
    progressCreating: "Criando escrow na Celo...",
    submitProcessing: "Processando...",
    submitButton: "Bloquear {amount} {token} com segurança",
    feeNotice: "Uma taxa de 0,5% é cobrada quando os fundos são liberados · Desenvolvido pela Celo",

    // Error messages
    errorNoWallet: "Abra isso no MiniPay para conectar sua carteira.",
    errorNoAddress: "Insira um número de telefone ou endereço de carteira válido.",
    errorNoAmount: "Insira um valor.",
    errorNoDescription: "Descreva para que é este pagamento.",
    errorGeneric: "Algo deu errado. Por favor, tente novamente.",

    // Done screen
    doneEmoji: "✅",
    doneTitle: "Pagamento bloqueado",
    doneSubtitle: "Seu cUSD está seguro. Libere quando o trabalho estiver concluído.",
    shareButton: "🔗 Compartilhar link de pagamento",
    shareCopied: "✓ Copiado!",
    viewPayments: "Ver meus pagamentos",
  },

  // ── My Payments (escrows list) page ───────────────────────────────────────
  escrows: {
    pageTitle: "Meus Pagamentos",
    notConnected: "Abra este app no MiniPay para ver seus pagamentos",
    noPayments: "Nenhum pagamento ainda",
    ctaSendFirst: "Enviar pagamento seguro",
    sent: "Enviado",
    received: "Recebido",
    stateLabels: {
      awaitingDeposit: "Aguardando depósito",
      funded: "Financiado",
      released: "Liberado",
      disputed: "Em disputa",
      refunded: "Reembolsado",
    },
  },

  // ── Escrow detail page ────────────────────────────────────────────────────
  escrowDetail: {
    stateDescriptions: {
      awaitingDeposit: "Os fundos ainda não foram depositados.",
      funded: "cUSD mantido com segurança no contrato inteligente.",
      released: "O pagamento foi enviado ao destinatário.",
      disputed: "O árbitro de IA está revisando este pagamento.",
      refunded: "Os fundos foram devolvidos ao remetente.",
    },
    stateLabels: {
      awaitingDeposit: "Aguardando depósito",
      funded: "Fundos bloqueados",
      released: "Pagamento liberado",
      disputed: "Em disputa",
      refunded: "Reembolsado",
    },
    partiesTitle: "Partes",
    senderLabel: "Remetente",
    recipientLabel: "Destinatário",
    you: "(você)",
    actionRelease: "✅ Trabalho feito — Liberar pagamento",
    actionDispute: "⚖️ Problema? Abrir disputa",
    disputeNote: "Abrir uma disputa envia isso ao nosso árbitro de IA para uma revisão justa",
    beneficiaryInfo: "Os fundos estão bloqueados. Conclua o trabalho e peça ao remetente para liberar o pagamento",
    viewOnCeloscan: "Ver no Celoscan",
    amountLabel: "Valor",
    errorGeneric: "Transação falhou. Por favor, tente novamente.",
    backToPayments: "← Meus Pagamentos",
  },
} as const;
