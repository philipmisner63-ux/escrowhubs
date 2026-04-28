/**
 * Arabic (ar) translations for EscrowHubs frontend-celo.
 * RTL language. Mirrors all keys from en.ts.
 */
export const ar = {
  // ── App-wide ──────────────────────────────────────────────────────────────
  appName: "EscrowHubs",
  poweredByCelo: "مدعوم من Celo · الأموال مؤمنة بعقد ذكي",
  back: "← رجوع",

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    tagline: "مدفوعات آمنة، في أي مكان.",
    walletConnecting: "جارٍ توصيل محفظتك...",
    walletOpenInMiniPay: "افتح هذا التطبيق داخل MiniPay لتوصيل محفظتك",
    balanceLabel: "الرصيد:",
    ctaSendPayment: "💸 إرسال دفعة آمنة",
    ctaMyPayments: "📋 مدفوعاتي",
    howItWorksTitle: "كيف يعمل",
    steps: {
      lockFunds: { title: "قفل الأموال", desc: "يتم الاحتفاظ بـ cUSD الخاص بك في عقد ذكي — وليس لدينا" },
      jobDone: { title: "اكتمل العمل", desc: "يكمل الطرف الآخر العمل" },
      releasePayment: { title: "تحرير الدفعة", desc: "تؤكد ويتم إصدار الأموال فوراً" },
      dispute: { title: "نزاع؟", desc: "يراجع الذكاء الاصطناعي الأدلة ويقرر بعدل" },
    },
    footer: "مدعوم من Celo · الأموال مؤمنة بعقد ذكي",
    explainer: {
      tagline: "مدفوعات آمنة، في أي مكان.",
      openInMiniPay: "افتح في MiniPay",
      trustLine: "عقد ذكي على Celo · مدقق · EscrowHubs LLC",
      tryDemo: "جرّب العرض التوضيحي ←",
    },
  },

  // ── Create escrow page ────────────────────────────────────────────────────
  create: {
    pageTitle: "إرسال دفعة آمنة",
    pageSubtitle: "يتم الاحتفاظ بالأموال حتى اكتمال العمل",
    recipientLabel: "من تدفع له؟",
    recipientPlaceholder: "+966 50 123 4567 أو 0x...",
    resolvingWallet: "جارٍ البحث عن المحفظة...",
    resolvedFound: "تم العثور —",
    resolvedNotFound:
      "لم يتم العثور على محفظة MiniPay لهذا الرقم. اطلب منهم مشاركة عنوان محفظتهم.",
    amountLabel: "المبلغ (cUSD)",
    descriptionLabel: "ما الغرض من هذا؟",
    descriptionPlaceholder: "مثال: تصميم شعار، 3 مفاهيم تُسلَّم يوم الجمعة",
    descriptionHint: "يتم تخزين هذا على السلسلة ويستخدم في حالة النزاع",
    progressApproving: "جارٍ الموافقة على إنفاق cUSD...",
    progressCreating: "جارٍ إنشاء الضمان على Celo...",
    submitProcessing: "جارٍ المعالجة...",
    submitButton: "قفل {amount} cUSD بأمان",
    feeNotice: "يتم تحصيل رسوم بنسبة 0.5% عند إصدار الأموال · مدعوم من Celo",

    // Error messages
    errorNoWallet: "افتح هذا في MiniPay لتوصيل محفظتك.",
    errorNoAddress: "أدخل رقم هاتف أو عنوان محفظة صالح.",
    errorNoAmount: "أدخل مبلغاً.",
    errorNoDescription: "صف الغرض من هذه الدفعة.",
    errorGeneric: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",

    // Done screen
    doneEmoji: "✅",
    doneTitle: "تم تأمين الدفعة",
    doneSubtitle: "يتم الاحتفاظ بـ cUSD الخاص بك بأمان. أصدره عند اكتمال العمل.",
    shareButton: "🔗 مشاركة رابط الدفع",
    shareCopied: "✓ تم النسخ!",
    viewPayments: "عرض مدفوعاتي",
  },

  // ── My Payments (escrows list) page ───────────────────────────────────────
  escrows: {
    pageTitle: "مدفوعاتي",
    notConnected: "افتح هذا التطبيق في MiniPay لرؤية مدفوعاتك",
    noPayments: "لا توجد مدفوعات بعد",
    ctaSendFirst: "إرسال دفعة آمنة",
    sent: "مُرسل",
    received: "مُستلم",
    stateLabels: {
      awaitingDeposit: "بانتظار الإيداع",
      funded: "ممول",
      released: "مُصدر",
      disputed: "متنازع عليه",
      refunded: "مُسترد",
    },
  },

  // ── Escrow detail page ────────────────────────────────────────────────────
  escrowDetail: {
    stateDescriptions: {
      awaitingDeposit: "لم يتم إيداع الأموال بعد.",
      funded: "يتم الاحتفاظ بـ cUSD بأمان في العقد الذكي.",
      released: "تم إرسال الدفعة إلى المستفيد.",
      disputed: "يراجع محكّم الذكاء الاصطناعي هذه الدفعة.",
      refunded: "تم إعادة الأموال إلى المُرسل.",
    },
    stateLabels: {
      awaitingDeposit: "بانتظار الإيداع",
      funded: "الأموال مقفولة",
      released: "تم إصدار الدفعة",
      disputed: "متنازع عليه",
      refunded: "مُسترد",
    },
    partiesTitle: "الأطراف",
    senderLabel: "المُرسل",
    recipientLabel: "المستفيد",
    you: "(أنت)",
    actionRelease: "✅ اكتمل العمل — إصدار الدفعة",
    actionDispute: "⚖️ مشكلة؟ فتح نزاع",
    disputeNote: "فتح نزاع يرسل هذا إلى محكّم الذكاء الاصطناعي لمراجعة عادلة",
    beneficiaryInfo: "الأموال مقفولة. أكمل العمل واطلب من المُرسل إصدار الدفعة",
    viewOnCeloscan: "عرض على Celoscan",
    amountLabel: "المبلغ",
    errorGeneric: "فشلت المعاملة. يرجى المحاولة مرة أخرى.",
    backToPayments: "← مدفوعاتي",
  },
} as const;
