/**
 * Swahili (sw) translations for EscrowHubs frontend-celo.
 *
 * Groundwork for future i18n integration.
 * Keys mirror all visible UI strings across home, create, escrows, and escrow-detail pages.
 */
export const sw = {
  // ── App-wide ──────────────────────────────────────────────────────────────
  appName: "EscrowHubs",
  poweredByCelo: "Inayoendeshwa na Celo · Fedha zilindwa na mkataba mwerevu",
  back: "← Rudi",

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    tagline: "Lipa ukimaliza kazi",
    walletConnecting: "Inaunganisha mkoba wako...",
    walletOpenInMiniPay: "Fungua programu hii ndani ya MiniPay ili kuunganisha mkoba wako",
    balanceLabel: "Salio:", // e.g. "Salio: 5.00 cUSD"
    ctaSendPayment: "💸 Tuma Malipo Salama",
    ctaMyPayments: "📋 Malipo Yangu",
    howItWorksTitle: "Inavyofanya kazi",
    steps: {
      lockFunds: { title: "Funga fedha", desc: "cUSD yako inashikiliwa kwenye mkataba mwerevu — si na sisi" },
      jobDone: { title: "Kazi inakamilika", desc: "Mtu mwingine anakamilisha kazi" },
      releasePayment: { title: "Toa malipo", desc: "Uthibitishe na fedha zitatumwa mara moja" },
      dispute: { title: "Tatizo?", desc: "AI itathmini ushahidi na kuamua kwa haki" },
    },
    footer: "Inayoendeshwa na Celo · Fedha zilindwa na mkataba mwerevu",
  },

  // ── Create escrow page ────────────────────────────────────────────────────
  create: {
    pageTitle: "Tuma malipo salama",
    pageSubtitle: "Fedha zitashikiliwa hadi kazi itakapokamilika",
    recipientLabel: "Unayemlipa nani?",
    recipientPlaceholder: "+254 712 345 678 au 0x...",
    resolvingWallet: "Inatafuta mkoba...",
    resolvedFound: "Imepatikana —",
    resolvedNotFound:
      "Hakuna mkoba wa MiniPay uliopatikana kwa nambari hiyo. Mwambie akushirikishe anwani yake ya mkoba.",
    amountLabel: "Kiasi (cUSD)",
    descriptionLabel: "Hii ni kwa ajili ya nini?",
    descriptionPlaceholder: "mf. Muundo wa nembo, dhana 3 zitolewe Ijumaa",
    descriptionHint: "Hii inahifadhiwa kwenye mnyororo na hutumiwa ikiwa kuna mgogoro",
    progressApproving: "Inaidhinisha matumizi ya cUSD...",
    progressCreating: "Inaunda escrow kwenye Celo...",
    submitProcessing: "Inashughulikia...",
    submitButton: "Funga {amount} cUSD salama", // replace {amount} at runtime
    feeNotice: "Ada ya 0.5% inachajiwa wakati fedha zinapotolewa · Inayoendeshwa na Celo",

    // Error messages
    errorNoWallet: "Fungua hii katika MiniPay ili kuunganisha mkoba wako.",
    errorNoAddress: "Ingiza nambari ya simu au anwani ya mkoba inayofaa.",
    errorNoAmount: "Ingiza kiasi.",
    errorNoDescription: "Eleza malipo haya ni kwa ajili ya nini.",
    errorGeneric: "Kuna hitilafu. Tafadhali jaribu tena.",

    // Done screen
    doneEmoji: "✅",
    doneTitle: "Malipo yamefungwa",
    doneSubtitle: "cUSD yako inashikiliwa salama. Itoe ukimaliza kazi.",
    shareButton: "🔗 Shiriki kiungo cha malipo",
    shareCopied: "✓ Imenakiliwa!",
    viewPayments: "Angalia malipo yangu",
  },

  // ── My Payments (escrows list) page ───────────────────────────────────────
  escrows: {
    pageTitle: "Malipo Yangu",
    notConnected: "Fungua programu hii katika MiniPay kuona malipo yako",
    noPayments: "Bado hakuna malipo",
    ctaSendFirst: "Tuma malipo salama",
    sent: "Iliyotumwa",
    received: "Iliyopokelewa",
    stateLabels: {
      awaitingDeposit: "Inasubiri amana",
      funded: "Imefadhiliwa",
      released: "Imetolewa",
      disputed: "Ina mgogoro",
      refunded: "Imerudishwa",
    },
  },

  // ── Escrow detail page ────────────────────────────────────────────────────
  escrowDetail: {
    stateDescriptions: {
      awaitingDeposit: "Inasubiri amana ya fedha.",
      funded: "Fedha zimefungwa. Toa ukimaliza kazi.",
      released: "Fedha zimetolewa kwa mpokeaji.",
      disputed: "Mgogoro unapitiwa na msuluhishi.",
      refunded: "Fedha zimerudishwa kwa mtumaji.",
    },
    partiesTitle: "Wahusika",
    senderLabel: "Mtumaji",
    recipientLabel: "Mpokeaji",
    you: "(wewe)",
    actionRelease: "✅ Kazi imekamilika — Toa malipo",
    actionDispute: "⚖️ Tatizo? Anza mgogoro",
    disputeNote: "Kuanza mgogoro kutapeleka kesi hii kwa msuluhishi wetu wa AI kwa mapitio ya haki",
    beneficiaryInfo: "Fedha zimefungwa. Kamilisha kazi na uombe mtumaji atoe malipo",
    viewOnCeloscan: "Angalia kwenye Celoscan",
    amountLabel: "Kiasi", // e.g. "5.00 cUSD"
    errorGeneric: "Hitilafu ya muamala. Tafadhali jaribu tena.",
  },
} as const;

export type SwahiliKeys = typeof sw;
