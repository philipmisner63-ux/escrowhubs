/**
 * French (fr) translations for EscrowHubs frontend-celo.
 * Mirrors all keys from en.ts.
 */
export const fr = {
  // ── App-wide ──────────────────────────────────────────────────────────────
  appName: "EscrowHubs",
  poweredByCelo: "Propulsé par Celo · Fonds sécurisés par contrat intelligent",
  back: "← Retour",

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    tagline: "Paiements sécurisés, partout.",
    walletConnecting: "Connexion de votre portefeuille...",
    walletOpenInMiniPay: "Ouvrez cette application dans MiniPay pour connecter votre portefeuille",
    balanceLabel: "Solde :",
    ctaSendPayment: "💸 Envoyer un Paiement Sécurisé",
    ctaMyPayments: "📋 Mes Paiements",
    howItWorksTitle: "Comment ça marche",
    steps: {
      lockFunds: { title: "Bloquer les fonds", desc: "Votre cUSD est détenu dans un contrat intelligent — pas par nous" },
      jobDone: { title: "Travail effectué", desc: "L'autre partie termine le travail" },
      releasePayment: { title: "Libérer le paiement", desc: "Vous confirmez et les fonds sont libérés instantanément" },
      dispute: { title: "Litige ?", desc: "L'IA examine les preuves et décide équitablement" },
    },
    footer: "Propulsé par Celo · Fonds sécurisés par contrat intelligent",
    explainer: {
      tagline: "Paiements sécurisés, partout.",
      openInMiniPay: "Ouvrir dans MiniPay",
      trustLine: "Contrat intelligent sur Celo · Audité · EscrowHubs LLC",
      tryDemo: "Voir la Démo →",
    },
  },

  // ── Create escrow page ────────────────────────────────────────────────────
  create: {
    pageTitle: "Envoyer un paiement sécurisé",
    pageSubtitle: "Les fonds sont retenus jusqu'à ce que le travail soit terminé",
    recipientLabel: "À qui payez-vous ?",
    recipientPlaceholder: "+33 6 12 34 56 78 ou 0x...",
    resolvingWallet: "Recherche du portefeuille...",
    resolvedFound: "Trouvé —",
    resolvedNotFound:
      "Aucun portefeuille MiniPay trouvé pour ce numéro. Demandez-leur de partager leur adresse de portefeuille.",
    amountLabel: "Montant (cUSD)",
    descriptionLabel: "Pour quoi est-ce ?",
    descriptionPlaceholder: "ex. Design de logo, 3 concepts livrés vendredi",
    descriptionHint: "Ceci est stocké sur la blockchain et utilisé en cas de litige",
    progressApproving: "Approbation des dépenses cUSD...",
    progressCreating: "Création de l'escrow sur Celo...",
    submitProcessing: "Traitement...",
    submitButton: "Bloquer {amount} cUSD en sécurité",
    feeNotice: "Des frais de 0,5 % sont prélevés lors de la libération des fonds · Propulsé par Celo",

    // Error messages
    errorNoWallet: "Ouvrez ceci dans MiniPay pour connecter votre portefeuille.",
    errorNoAddress: "Entrez un numéro de téléphone ou une adresse de portefeuille valide.",
    errorNoAmount: "Entrez un montant.",
    errorNoDescription: "Décrivez l'objet de ce paiement.",
    errorGeneric: "Quelque chose s'est mal passé. Veuillez réessayer.",

    // Done screen
    doneEmoji: "✅",
    doneTitle: "Paiement bloqué",
    doneSubtitle: "Votre cUSD est détenu en sécurité. Libérez-le lorsque le travail est terminé.",
    shareButton: "🔗 Partager le lien de paiement",
    shareCopied: "✓ Copié !",
    viewPayments: "Voir mes paiements",
  },

  // ── My Payments (escrows list) page ───────────────────────────────────────
  escrows: {
    pageTitle: "Mes Paiements",
    notConnected: "Ouvrez cette application dans MiniPay pour voir vos paiements",
    noPayments: "Aucun paiement pour l'instant",
    ctaSendFirst: "Envoyer un paiement sécurisé",
    sent: "Envoyé",
    received: "Reçu",
    stateLabels: {
      awaitingDeposit: "En attente de dépôt",
      funded: "Financé",
      released: "Libéré",
      disputed: "En litige",
      refunded: "Remboursé",
    },
  },

  // ── Escrow detail page ────────────────────────────────────────────────────
  escrowDetail: {
    stateDescriptions: {
      awaitingDeposit: "Les fonds n'ont pas encore été déposés.",
      funded: "Le cUSD est détenu en sécurité dans le contrat intelligent.",
      released: "Le paiement a été envoyé au destinataire.",
      disputed: "L'arbitre IA examine ce paiement.",
      refunded: "Les fonds ont été retournés à l'expéditeur.",
    },
    stateLabels: {
      awaitingDeposit: "En attente de dépôt",
      funded: "Fonds bloqués",
      released: "Paiement libéré",
      disputed: "En litige",
      refunded: "Remboursé",
    },
    partiesTitle: "Parties",
    senderLabel: "Expéditeur",
    recipientLabel: "Destinataire",
    you: "(vous)",
    actionRelease: "✅ Travail terminé — Libérer le paiement",
    actionDispute: "⚖️ Problème ? Ouvrir un litige",
    disputeNote: "Ouvrir un litige envoie ceci à notre arbitre IA pour un examen équitable",
    beneficiaryInfo: "Les fonds sont bloqués. Terminez le travail et demandez à l'expéditeur de libérer le paiement",
    viewOnCeloscan: "Voir sur Celoscan",
    amountLabel: "Montant",
    errorGeneric: "Transaction échouée. Veuillez réessayer.",
    backToPayments: "← Mes Paiements",
  },
} as const;
