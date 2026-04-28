/**
 * Hindi (hi) translations for EscrowHubs frontend-celo.
 * Mirrors all keys from en.ts.
 */
export const hi = {
  // ── App-wide ──────────────────────────────────────────────────────────────
  appName: "EscrowHubs",
  poweredByCelo: "Celo द्वारा संचालित · स्मार्ट कॉन्ट्रैक्ट द्वारा सुरक्षित धनराशि",
  back: "← वापस",

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    tagline: "सुरक्षित भुगतान, कहीं भी।",
    walletConnecting: "आपका वॉलेट जोड़ा जा रहा है...",
    walletOpenInMiniPay: "अपना वॉलेट जोड़ने के लिए MiniPay में यह ऐप खोलें",
    balanceLabel: "बैलेंस:",
    ctaSendPayment: "💸 सुरक्षित भुगतान भेजें",
    ctaMyPayments: "📋 मेरे भुगतान",
    howItWorksTitle: "यह कैसे काम करता है",
    steps: {
      lockFunds: { title: "धनराशि लॉक करें", desc: "आपका cUSD एक स्मार्ट कॉन्ट्रैक्ट में रखा जाता है — हमारे पास नहीं" },
      jobDone: { title: "काम पूरा होता है", desc: "दूसरा पक्ष काम पूरा करता है" },
      releasePayment: { title: "भुगतान जारी करें", desc: "आप पुष्टि करें और धनराशि तुरंत जारी हो जाती है" },
      dispute: { title: "विवाद?", desc: "AI सबूतों की समीक्षा करता है और निष्पक्ष निर्णय लेता है" },
    },
    footer: "Celo द्वारा संचालित · स्मार्ट कॉन्ट्रैक्ट द्वारा सुरक्षित धनराशि",
    explainer: {
      tagline: "सुरक्षित भुगतान, कहीं भी।",
      openInMiniPay: "MiniPay में खोलें",
      trustLine: "Celo पर स्मार्ट कॉन्ट्रैक्ट · ऑडिटेड · EscrowHubs LLC",
      tryDemo: "डेमो देखें →",
    },
  },

  // ── Create escrow page ────────────────────────────────────────────────────
  create: {
    pageTitle: "सुरक्षित भुगतान भेजें",
    pageSubtitle: "काम पूरा होने तक धनराशि रोकी जाती है",
    recipientLabel: "आप किसे भुगतान कर रहे हैं?",
    recipientPlaceholder: "+91 98765 43210 या 0x...",
    resolvingWallet: "वॉलेट खोजा जा रहा है...",
    resolvedFound: "मिला —",
    resolvedNotFound:
      "उस नंबर के लिए कोई MiniPay वॉलेट नहीं मिला। उन्हें अपना वॉलेट पता साझा करने को कहें।",
    amountLabel: "राशि (cUSD)",
    descriptionLabel: "यह किसके लिए है?",
    descriptionPlaceholder: "जैसे. लोगो डिज़ाइन, शुक्रवार तक 3 कॉन्सेप्ट",
    descriptionHint: "यह ऑन-चेन संग्रहीत है और विवाद होने पर उपयोग किया जाता है",
    progressApproving: "cUSD खर्च की स्वीकृति...",
    progressCreating: "Celo पर एस्क्रो बना रहे हैं...",
    submitProcessing: "प्रोसेस हो रहा है...",
    submitButton: "{amount} {token} सुरक्षित रूप से लॉक करें",
    feeNotice: "धनराशि जारी होने पर 0.5% शुल्क लिया जाता है · Celo द्वारा संचालित",

    // Error messages
    errorNoWallet: "अपना वॉलेट जोड़ने के लिए MiniPay में खोलें।",
    errorNoAddress: "एक वैध फोन नंबर या वॉलेट पता दर्ज करें।",
    errorNoAmount: "एक राशि दर्ज करें।",
    errorNoDescription: "बताएं यह भुगतान किसके लिए है।",
    errorGeneric: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",

    // Done screen
    doneEmoji: "✅",
    doneTitle: "भुगतान लॉक हो गया",
    doneSubtitle: "आपका cUSD सुरक्षित रखा गया है। काम पूरा होने पर जारी करें।",
    shareButton: "🔗 भुगतान लिंक साझा करें",
    shareCopied: "✓ कॉपी हो गया!",
    viewPayments: "मेरे भुगतान देखें",
  },

  // ── My Payments (escrows list) page ───────────────────────────────────────
  escrows: {
    pageTitle: "मेरे भुगतान",
    notConnected: "अपने भुगतान देखने के लिए MiniPay में यह ऐप खोलें",
    noPayments: "अभी तक कोई भुगतान नहीं",
    ctaSendFirst: "सुरक्षित भुगतान भेजें",
    sent: "भेजा गया",
    received: "प्राप्त हुआ",
    stateLabels: {
      awaitingDeposit: "जमा का इंतजार",
      funded: "फंडेड",
      released: "जारी",
      disputed: "विवादित",
      refunded: "वापसी",
    },
  },

  // ── Escrow detail page ────────────────────────────────────────────────────
  escrowDetail: {
    stateDescriptions: {
      awaitingDeposit: "धनराशि अभी तक जमा नहीं की गई है।",
      funded: "cUSD स्मार्ट कॉन्ट्रैक्ट में सुरक्षित रखा गया है।",
      released: "भुगतान प्राप्तकर्ता को भेज दिया गया।",
      disputed: "AI मध्यस्थ इस भुगतान की समीक्षा कर रहा है।",
      refunded: "धनराशि प्रेषक को वापस कर दी गई।",
    },
    stateLabels: {
      awaitingDeposit: "जमा का इंतजार",
      funded: "फंड लॉक",
      released: "भुगतान जारी",
      disputed: "विवाद में",
      refunded: "वापस",
    },
    partiesTitle: "पक्षकार",
    senderLabel: "प्रेषक",
    recipientLabel: "प्राप्तकर्ता",
    you: "(आप)",
    actionRelease: "✅ काम हो गया — भुगतान जारी करें",
    actionDispute: "⚖️ समस्या? विवाद खोलें",
    disputeNote: "विवाद खोलने से यह निष्पक्ष समीक्षा के लिए हमारे AI मध्यस्थ के पास जाता है",
    beneficiaryInfo: "धनराशि लॉक है। काम पूरा करें और प्रेषक से भुगतान जारी करने को कहें",
    viewOnCeloscan: "Celoscan पर देखें",
    amountLabel: "राशि",
    errorGeneric: "लेन-देन विफल हो गया। कृपया पुनः प्रयास करें।",
    backToPayments: "← मेरे भुगतान",
  },
} as const;
