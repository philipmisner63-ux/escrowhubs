// Client-side PDF receipt generator using jsPDF
// All generation happens in the browser — no server calls needed.

export interface MilestoneItem {
  description: string;
  amount: bigint;
  state: number; // 1 = RELEASED
}

export interface ReceiptData {
  escrowAddress: string;
  escrowType: "simple" | "milestone";
  depositor: string;
  beneficiary: string;
  arbiter: string;
  amount: bigint;       // net escrow amount (wei)
  txHash?: string;
  createdAt?: number;   // unix timestamp (seconds)
  milestones?: MilestoneItem[];
  isAIArbiter?: boolean;
}

function fmt(wei: bigint, decimals = 4): string {
  const eth = Number(wei) / 1e18;
  return eth.toFixed(decimals) + " BDAG";
}

function shortAddr(addr: string): string {
  return addr; // Keep full address in receipts
}

export async function generateReceipt(data: ReceiptData): Promise<void> {
  // Dynamic import keeps jsPDF out of the initial bundle
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; // A4 width mm
  const margin = 18;
  const col = margin;
  let y = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const line = (x1: number, y1: number, x2: number, y2: number, color = "#e2e8f0") => {
    doc.setDrawColor(color);
    doc.line(x1, y1, x2, y2);
  };

  const section = (title: string) => {
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#64748b");
    doc.text(title.toUpperCase(), col, y);
    y += 2;
    line(col, y, W - margin, y, "#e2e8f0");
    y += 5;
    doc.setTextColor("#0f172a");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  };

  const row = (label: string, value: string, mono = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#64748b");
    doc.text(label, col, y);
    doc.setFont(mono ? "courier" : "helvetica", "normal");
    doc.setFontSize(mono ? 7.5 : 8.5);
    doc.setTextColor("#0f172a");
    // Wrap long values
    const maxW = W - margin - col - 45;
    const lines = doc.splitTextToSize(value, maxW);
    doc.text(lines, col + 45, y);
    y += lines.length > 1 ? lines.length * 4.5 : 5;
  };

  // ── Dark header ───────────────────────────────────────────────────────────
  doc.setFillColor("#0a0a1a");
  doc.rect(0, 0, W, 32, "F");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#06b6d4");
  doc.text("EscrowHubs", margin, 13);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#94a3b8");
  doc.text("Trustless escrow powered by BlockDAG", margin, 20);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#ffffff");
  doc.text("TRANSACTION RECEIPT", W - margin, 13, { align: "right" });

  const receiptNum = `ESC-${data.escrowAddress.slice(2, 10).toUpperCase()}`;
  doc.setFontSize(8.5);
  doc.setFont("courier", "normal");
  doc.setTextColor("#94a3b8");
  doc.text(receiptNum, W - margin, 20, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#64748b");
  const genDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Generated: ${genDate}`, W - margin, 27, { align: "right" });

  y = 42;

  // ── Status banner ─────────────────────────────────────────────────────────
  doc.setFillColor("#f0fdf4");
  doc.setDrawColor("#86efac");
  doc.roundedRect(col, y - 4, W - margin * 2, 10, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#166534");
  doc.text("✓  Escrow Completed — Funds Released", W / 2, y + 2, { align: "center" });
  y += 12;

  // ── Transaction details ───────────────────────────────────────────────────
  section("Transaction Details");
  row("Receipt Number", receiptNum);
  row("Escrow Type", data.escrowType === "milestone" ? "Milestone Escrow" : "Simple Escrow" + (data.isAIArbiter ? " (AI Arbiter)" : ""));
  row("Status", "Completed ✓");
  if (data.createdAt) {
    row("Created", new Date(data.createdAt * 1000).toLocaleString("en-US"));
  }
  row("Completed", new Date().toLocaleString("en-US"));

  // ── Parties ───────────────────────────────────────────────────────────────
  section("Parties");
  row("Buyer (Depositor)", data.depositor, true);
  row("Seller (Beneficiary)", data.beneficiary, true);
  row("Arbiter", data.isAIArbiter ? `AI Arbiter (${data.arbiter})` : data.arbiter, true);

  // ── Financial summary ─────────────────────────────────────────────────────
  section("Financial Summary");
  const protocolFee = data.amount * 50n / 10000n;
  const netAmount = data.amount - protocolFee;
  row("Escrow Amount", fmt(data.amount));
  row("Platform Fee (0.5%)", fmt(protocolFee));

  y += 1;
  doc.setFillColor("#f8fafc");
  doc.rect(col, y - 3, W - margin * 2, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor("#0f172a");
  doc.text("Net Amount to Seller", col + 2, y + 2.5);
  doc.setTextColor("#166534");
  doc.text(fmt(netAmount, 6), W - margin - 2, y + 2.5, { align: "right" });
  y += 12;

  // ── Milestones ────────────────────────────────────────────────────────────
  if (data.escrowType === "milestone" && data.milestones && data.milestones.length > 0) {
    section("Milestones");
    // Table header
    doc.setFillColor("#f1f5f9");
    doc.rect(col, y - 3, W - margin * 2, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor("#475569");
    doc.text("#", col + 2, y + 1);
    doc.text("Description", col + 10, y + 1);
    doc.text("Amount", W - margin - 2, y + 1, { align: "right" });
    doc.text("Status", W - margin - 22, y + 1);
    y += 8;

    data.milestones.forEach((ms, i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor("#0f172a");
      const status = ms.state === 1 ? "Released ✓" : ms.state === 3 ? "Refunded" : "Pending";
      const color = ms.state === 1 ? "#166534" : ms.state === 3 ? "#92400e" : "#64748b";
      doc.text(String(i + 1), col + 2, y);
      const descLines = doc.splitTextToSize(ms.description || `Milestone ${i + 1}`, 70);
      doc.text(descLines, col + 10, y);
      doc.text(fmt(ms.amount, 4), W - margin - 2, y, { align: "right" });
      doc.setTextColor(color);
      doc.text(status, W - margin - 22, y);
      doc.setTextColor("#0f172a");
      y += Math.max(descLines.length * 4.5, 6);
      line(col, y - 1, W - margin, y - 1, "#f1f5f9");
    });
    y += 3;
  }

  // ── Blockchain verification ───────────────────────────────────────────────
  section("Blockchain Verification");
  row("Network", "BlockDAG Mainnet (Chain ID: 1404)");
  row("Contract Address", data.escrowAddress, true);
  if (data.txHash) {
    row("Transaction Hash", data.txHash, true);
    row("Explorer URL", `https://bdagscan.com/tx/${data.txHash}`, true);
  }
  row("Factory Contract", "0x8a9001c28c4cc1e0952ae5ca2a8366f1c1ac6724", true);

  y += 3;
  doc.setFillColor("#eff6ff");
  doc.setDrawColor("#bfdbfe");
  doc.roundedRect(col, y, W - margin * 2, 10, 2, 2, "FD");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor("#1e40af");
  doc.text(
    "This transaction is permanently and immutably recorded on the BlockDAG blockchain. It cannot be altered or deleted.",
    W / 2, y + 6.5, { align: "center", maxWidth: W - margin * 2 - 10 }
  );
  y += 16;

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor("#f8fafc");
  doc.rect(0, 274, W, 23, "F");
  line(0, 274, W, 274, "#e2e8f0");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor("#64748b");
  doc.text("This receipt was generated by EscrowHubs — app.escrowhubs.io", W / 2, 280, { align: "center" });
  doc.text("This is not a tax document. Consult your tax advisor for reporting requirements.", W / 2, 285, { align: "center" });
  doc.setTextColor("#94a3b8");
  doc.text(receiptNum, margin, 291);
  doc.text(genDate, W - margin, 291, { align: "right" });

  // ── Save ─────────────────────────────────────────────────────────────────
  const filename = `EscrowHubs-Receipt-${receiptNum}.pdf`;
  doc.save(filename);
}
