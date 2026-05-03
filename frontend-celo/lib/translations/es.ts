/**
 * Spanish (es) translations for EscrowHubs frontend-celo.
 * Latin American Spanish. Mirrors all keys from en.ts.
 */
export const es = {
  // ── App-wide ──────────────────────────────────────────────────────────────
  appName: "EscrowHubs",
  poweredByCelo: "Impulsado por Celo · Fondos asegurados por contrato inteligente",
  back: "← Volver",

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    tagline: "Pagos seguros, en cualquier lugar.",
    walletConnecting: "Conectando tu billetera...",
    walletOpenInMiniPay: "Abre esta app en MiniPay para conectar tu billetera",
    balanceLabel: "Saldo:",
    ctaSendPayment: "💸 Enviar un Pago Seguro",
    ctaMyPayments: "📋 Mis Pagos",
    howItWorksTitle: "¿Cómo funciona?",
    steps: {
      lockFunds: { title: "Bloquea fondos", desc: "Tu cUSD o USDT se guarda en un contrato inteligente — no con nosotros" },
      jobDone: { title: "El trabajo se completa", desc: "La otra parte termina el trabajo" },
      releasePayment: { title: "Libera el pago", desc: "Confirmas y los fondos se liberan al instante" },
      dispute: { title: "¿Disputa?", desc: "La IA revisa la evidencia y decide de forma justa" },
    },
    footer: "Impulsado por Celo · Fondos asegurados por contrato inteligente",
    explainer: {
      tagline: "Pagos seguros, en cualquier lugar.",
      openInMiniPay: "Abrir en MiniPay",
      trustLine: "Contrato inteligente en Celo · Auditado · EscrowHubs LLC",
      tryDemo: "Ver Demo →",
    },
  },

  // ── Create escrow page ────────────────────────────────────────────────────
  create: {
    pageTitle: "Enviar un pago seguro",
    pageSubtitle: "Los fondos se retienen hasta que el trabajo esté listo",
    recipientLabel: "¿A quién le pagas?",
    recipientPlaceholder: "+57 300 123 4567 o 0x...",
    resolvingWallet: "Buscando billetera...",
    resolvedFound: "Encontrado —",
    resolvedNotFound:
      "No se encontró billetera MiniPay para ese número. Pídele que comparta su dirección.",
    amountLabel: "Cantidad (cUSD)",
    descriptionLabel: "¿Para qué es esto?",
    descriptionPlaceholder: "ej. Diseño de logo, 3 conceptos entregados el viernes",
    descriptionHint: "Esto se guarda en la cadena y se usa en caso de disputa",
    progressApproving: "Aprobando gasto de cUSD...",
    progressCreating: "Creando escrow en Celo...",
    submitProcessing: "Procesando...",
    submitButton: "Bloquear {amount} {token} de forma segura",
    feeNotice: "Se cobra una comisión del 0.5% cuando se liberan los fondos · Impulsado por Celo",

    // Error messages
    errorNoWallet: "Abre esto en MiniPay para conectar tu billetera.",
    errorNoAddress: "Ingresa un número de teléfono o dirección de billetera válida.",
    errorNoAmount: "Ingresa una cantidad.",
    errorNoDescription: "Describe para qué es este pago.",
    errorGeneric: "Algo salió mal. Inténtalo de nuevo.",

    // Done screen
    doneEmoji: "✅",
    doneTitle: "Pago bloqueado",
    doneSubtitle: "Tu cUSD está guardado de forma segura. Libéralo cuando el trabajo esté listo.",
    shareButton: "🔗 Compartir enlace de pago",
    shareCopied: "✓ Copiado!",
    viewPayments: "Ver mis pagos",
  },

  // ── My Payments (escrows list) page ───────────────────────────────────────
  escrows: {
    pageTitle: "Mis Pagos",
    notConnected: "Abre esta app en MiniPay para ver tus pagos",
    noPayments: "Sin pagos aún",
    ctaSendFirst: "Enviar un pago seguro",
    sent: "Enviado",
    received: "Recibido",
    stateLabels: {
      awaitingDeposit: "Esperando depósito",
      funded: "Fondos bloqueados",
      released: "Liberado",
      disputed: "En disputa",
      refunded: "Reembolsado",
    },
  },

  // ── Escrow detail page ────────────────────────────────────────────────────
  escrowDetail: {
    stateDescriptions: {
      awaitingDeposit: "Los fondos aún no han sido depositados.",
      funded: "cUSD guardado de forma segura en el contrato inteligente.",
      released: "El pago fue enviado al destinatario.",
      disputed: "El árbitro IA está revisando este pago.",
      refunded: "Los fondos fueron devueltos al remitente.",
    },
    stateLabels: {
      awaitingDeposit: "Esperando depósito",
      funded: "Fondos bloqueados",
      released: "Pago liberado",
      disputed: "En disputa",
      refunded: "Reembolsado",
    },
    partiesTitle: "Partes",
    senderLabel: "Remitente",
    recipientLabel: "Destinatario",
    you: "(tú)",
    actionRelease: "✅ Trabajo listo — Liberar pago",
    actionDispute: "⚖️ ¿Problema? Abrir disputa",
    disputeNote: "Abrir una disputa envía esto a nuestro árbitro IA para una revisión justa",
    beneficiaryInfo: "Los fondos están bloqueados. Completa el trabajo y pide al remitente que libere el pago",
    viewOnCeloscan: "Ver en Celoscan",
    amountLabel: "Cantidad",
    errorGeneric: "Transacción fallida. Inténtalo de nuevo.",
    backToPayments: "← Mis Pagos",
  },
} as const;
