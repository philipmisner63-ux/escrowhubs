/**
 * Patch: v3 prompt — two targeted additions
 *
 * Fix 1 — Rule 17: Buyer-caused non-delivery
 *   When a buyer withholds required inputs, blocking delivery, that is
 *   the buyer's fault. Score communication = 2, do not penalise seller
 *   for being unable to work without what was withheld.
 *   Closes our one real ruling miss (scenario 16).
 *
 * Fix 2 — Explicit fraud trigger examples in fraudFlag scoring rubric
 *   Our AI under-flags fraud when sellers send obviously deceptive
 *   "deliveries" (empty files, irrelevant files, malware, plagiarism,
 *   AI hallucinations labelled as research). Copilot correctly identifies
 *   these as fraud. Adding explicit examples closes the gap.
 */

import fs from "fs";

const FILE = "/root/blockdag-escrow/oracle/index.js";
let src = fs.readFileSync(FILE, "utf8");

// ─── FIX 1: Add Rule 17 after Rule 16 ────────────────────────────────────────

const OLD_RULE_16 = `16. WAIVER BY PRIOR ACCEPTANCE: If the buyer previously accepted similar work in earlier milestones without complaint, then objects to similar quality now — that weakens their position.`;

const NEW_RULE_16_AND_17 = `16. WAIVER BY PRIOR ACCEPTANCE: If the buyer previously accepted similar work in earlier milestones without complaint, then objects to similar quality now — that weakens their position.
17. BUYER-CAUSED NON-DELIVERY: If the seller explicitly requested inputs, materials, files, or access from the buyer, and the buyer failed or refused to provide them, any resulting non-delivery is the buyer's fault — not the seller's. In this case: score communication = 2 (buyer clearly at fault), score performance = 1 (partial — seller was ready and willing), and weight toward release. The seller must not be penalised for being unable to work without what was deliberately or negligently withheld.`;

if (!src.includes(OLD_RULE_16)) {
  console.error("❌ Fix 1: Could not find Rule 16");
  process.exit(1);
}
src = src.replace(OLD_RULE_16, NEW_RULE_16_AND_17);
console.log("✅ Fix 1: Rule 17 (buyer-caused non-delivery) added");

// ─── FIX 2: Extend fraudFlag rubric with explicit trigger examples ─────────────

const OLD_FRAUD_RUBRIC = `fraudFlag (true/false)
  true = strong evidence one party acted in bad faith (fake proofs, contradictions, obvious scam)
  false = no clear fraud`;

const NEW_FRAUD_RUBRIC = `fraudFlag (true/false)
  true = strong evidence one party acted in bad faith. Set fraudFlag = true for ANY of these:
    SELLER FRAUD: fake/fabricated screenshots of delivery, sending empty files or placeholders
    labelled as "complete delivery," sending files completely unrelated to the agreement,
    sending AI-generated hallucinations as original research or work, submitting plagiarised
    content as original, providing a malware link as "delivery," impersonating the buyer,
    demanding additional payment mid-contract as a condition for completing agreed work.
    BUYER FRAUD: fabricated or edited chat logs/screenshots, lying about non-receipt when
    on-chain or verifiable proof shows delivery, reselling delivered work then claiming
    non-delivery, extortion ("pay me or I ruin your reputation"), lying about deadline
    criticality to manufacture a time-is-of-the-essence claim.
  false = no clear deliberate deception — mere underperformance or quality disputes are NOT fraud`;

if (!src.includes(OLD_FRAUD_RUBRIC)) {
  console.error("❌ Fix 2: Could not find fraudFlag rubric");
  process.exit(1);
}
src = src.replace(OLD_FRAUD_RUBRIC, NEW_FRAUD_RUBRIC);
console.log("✅ Fix 2: Explicit fraud trigger examples added to fraudFlag rubric");

// ─── FIX 3: Add buyer-caused non-delivery to decision guide ──────────────────

const OLD_DECISION_GUIDE = `Clear buyer win (refund):
  performance = 0 AND acceptance = 0
  OR strong evidence of non-delivery or anticipatory breach`;

const NEW_DECISION_GUIDE = `Clear buyer win (refund):
  performance = 0 AND acceptance = 0
  OR strong evidence of non-delivery or anticipatory breach
  NOT if the non-delivery was caused by the buyer withholding required inputs (see Rule 17)`;

if (!src.includes(OLD_DECISION_GUIDE)) {
  console.error("❌ Fix 3: Could not find decision guide");
  process.exit(1);
}
src = src.replace(OLD_DECISION_GUIDE, NEW_DECISION_GUIDE);
console.log("✅ Fix 3: Decision guide updated to exclude buyer-caused non-delivery from buyer win");

// ─── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src, "utf8");
console.log(`\n✅ All fixes applied → ${FILE}`);
