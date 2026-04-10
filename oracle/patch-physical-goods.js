/**
 * EscrowHubs — Physical Goods Support
 *
 * Patches:
 *   1. oracle/index.js — Rule 18 (Return-Path Offered doctrine) + physical goods
 *      evidence rules + return window logic before executing refunds
 *   2. notify.js — return_required and return_confirmed notification events
 *   3. oracle/oracle-state.json structure — returnWindows persistence
 *
 * Physical goods flow:
 *   Dispute opened → AI rules REFUND → oracle checks if goodsType = "physical"
 *   → sends Telegram to buyer: "submit return tracking number within 72h"
 *   → polls carrier API or waits for buyer to submit tracking as evidence
 *   → if return confirmed → execute resolveRefund()
 *   → if buyer refuses / 72h passes / buyer silent → flip to resolveRelease()
 *   → if seller offered return and buyer refused → score communication = 2 (buyer fault)
 */

import fs from "fs";

const IDX  = "/root/blockdag-escrow/oracle/index.js";
const NOTIFY = "/root/blockdag-escrow/oracle/notify.js";

let src = fs.readFileSync(IDX, "utf8");
let notifySrc = fs.readFileSync(NOTIFY, "utf8");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 1: Add Rule 18 after Rule 17 in the prompt
// ─────────────────────────────────────────────────────────────────────────────

const OLD_RULE17_END = `17. BUYER-CAUSED NON-DELIVERY: If the seller explicitly requested inputs that the buyer genuinely failed or refused to provide, any resulting non-delivery is the buyer's fault. Score communication = 2 (buyer at fault), performance = 1 (seller ready and willing), weight toward release. CRITICAL PRECISION: This rule only applies when inputs were truly not provided. If the buyer has verifiable proof they DID provide the required inputs (Drive share, delivery receipts, access logs proving seller received them) and the seller falsely claims non-receipt — that is seller fraud. Set fraudFlag = true and rule for the depositor instead.`;

const NEW_RULE17_AND_18 = `17. BUYER-CAUSED NON-DELIVERY: If the seller explicitly requested inputs that the buyer genuinely failed or refused to provide, any resulting non-delivery is the buyer's fault. Score communication = 2 (buyer at fault), performance = 1 (seller ready and willing), weight toward release. CRITICAL PRECISION: This rule only applies when inputs were truly not provided. If the buyer has verifiable proof they DID provide the required inputs (Drive share, delivery receipts, access logs proving seller received them) and the seller falsely claims non-receipt — that is seller fraud. Set fraudFlag = true and rule for the depositor instead.
18. RETURN-PATH OFFERED (physical goods): If the seller shipped a physical item and offered a reasonable return or replacement path — and the buyer refused to return the item, never shipped it back, or cannot provide tracking — rule for the seller (release). A buyer cannot keep a physical product AND receive a refund. If the seller offered return acceptance and the buyer refused: score communication = 2 (buyer at fault), weight heavily toward release. If the buyer has submitted a valid tracking number showing the item is on its way back: note this in the ruling and flag awaitingReturn = true — the oracle will wait for delivery confirmation before executing any refund.

PHYSICAL GOODS EVIDENCE RULES (apply when the dispute involves a tangible shipped item):
- Delivery proof for physical goods: carrier tracking numbers, shipping labels, delivery confirmation, signed receipt, photo of packaged item, courier scan history
- A valid tracking number showing "Delivered" to the buyer's address = performance: 2
- A tracking number showing "In Transit" or "Label Created" is partial evidence = performance: 1
- No tracking and no delivery confirmation = performance: 0
- Buyer claims item is defective: they must describe the specific defect AND either have photos of the defect or have offered to return the item
- Seller offered return/replacement and buyer refused: communication: 2 (buyer fault), lean release
- Buyer returned item with tracking confirmation: this is legitimate grounds for refund
- Do NOT issue a refund for physical goods if the buyer cannot prove they are willing to return the item`;

if (!src.includes(OLD_RULE17_END)) {
  console.error("❌ PATCH 1: Could not find Rule 17");
  process.exit(1);
}
src = src.replace(OLD_RULE17_END, NEW_RULE17_AND_18);
console.log("✅ Patch 1: Rule 18 (Return-Path Offered) + physical goods evidence rules added");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 2: Add awaitingReturn field to AI JSON output schema
// ─────────────────────────────────────────────────────────────────────────────

const OLD_OUTPUT_SCHEMA = `  "escalateToManual": <true if confidence < 70 or evidence genuinely ambiguous, else false>,
  "unverifiedClaims": [`;

const NEW_OUTPUT_SCHEMA = `  "escalateToManual": <true if confidence < 70 or evidence genuinely ambiguous, else false>,
  "awaitingReturn": <true ONLY if buyer has submitted valid return tracking and physical goods are in transit back to seller — oracle will wait before executing refund; false in all other cases>,
  "unverifiedClaims": [`;

if (!src.includes(OLD_OUTPUT_SCHEMA)) {
  console.log("⏭ PATCH 2: Already applied — skipping");
  // continue
} else {
src = src.replace(OLD_OUTPUT_SCHEMA, NEW_OUTPUT_SCHEMA);
console.log("✅ Patch 2: awaitingReturn field added to AI output schema");
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 3: Add RETURN_WINDOW_MS constant
// ─────────────────────────────────────────────────────────────────────────────

const OLD_CONSTANTS = `const CHALLENGE_WINDOW_MS          = 4 * 60 * 60 * 1000; // 4 hours for challenged party to respond
const CHALLENGE_POLL_INTERVAL_MS   = 2 * 60 * 1000;      // check for new evidence every 2 min`;

const NEW_CONSTANTS = `const CHALLENGE_WINDOW_MS          = 4 * 60 * 60 * 1000; // 4 hours for challenged party to respond
const CHALLENGE_POLL_INTERVAL_MS   = 2 * 60 * 1000;      // check for new evidence every 2 min
const RETURN_WINDOW_MS             = 72 * 60 * 60 * 1000; // 72h for buyer to submit return tracking
const RETURN_POLL_INTERVAL_MS      = 10 * 60 * 1000;     // check for return tracking every 10 min`;

if (!src.includes(OLD_CONSTANTS)) {
  console.error("❌ PATCH 3: Could not find constants");
  process.exit(1);
}
src = src.replace(OLD_CONSTANTS, NEW_CONSTANTS);
console.log("✅ Patch 3: RETURN_WINDOW_MS + RETURN_POLL_INTERVAL_MS constants added");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 4: Add physical goods detection + return window helpers
//          Insert before "function startChainListener"
// ─────────────────────────────────────────────────────────────────────────────

const OLD_CHAIN_LISTENER_START = `function startChainListener(chainConfig) {`;

const NEW_HELPERS = `// ─── Physical goods detection ────────────────────────────────────────────────

/**
 * Detect whether an escrow involves physical goods from intake or evidence text.
 * Looks for explicit goodsType field in structured intake, or physical goods
 * signals in freeform evidence (tracking keywords, carrier names, shipping refs).
 */
function detectPhysicalGoods(evidence) {
  const physicalSignals = [
    /tracking.?num/i, /fedex|ups|usps|dhl|royal.?mail|australia.?post|canada.?post/i,
    /shipped|shipping|package|parcel|courier|carrier/i,
    /physical.?goods?|physical.?product/i, /INTAKE_JSON:/,
  ];

  for (const ev of evidence) {
    // Structured intake — check goodsType field
    if (ev.uri?.startsWith("INTAKE_JSON:")) {
      try {
        const intake = JSON.parse(ev.uri.slice("INTAKE_JSON:".length));
        if (intake.goodsType === "physical") return true;
      } catch { /* continue */ }
    }
    // Freeform — look for shipping signals
    const text = ev.uri ?? "";
    if (physicalSignals.some(rx => rx.test(text))) return true;
  }
  return false;
}

/**
 * Wait for a buyer to submit a return tracking number after a refund ruling.
 * Polls for new evidence every RETURN_POLL_INTERVAL_MS for up to RETURN_WINDOW_MS.
 *
 * Returns:
 *   "confirmed"  — buyer submitted tracking showing delivery back to seller
 *   "in_transit" — buyer submitted tracking, item on the way
 *   "refused"    — buyer submitted no tracking / explicitly refused
 *   "timeout"    — window expired, no tracking received
 */
async function waitForReturnTracking(escrowAddress, depositorAddress, prevEvidenceCount, fetchEvidenceFn, notifyFn) {
  const deadline = Date.now() + RETURN_WINDOW_MS;
  const APP_URL  = "https://app.escrowhubs.io";
  console.log(\`📦 [RETURN] Waiting up to 72h for buyer return tracking on \${escrowAddress.slice(0,10)}…\`);

  // Notify buyer immediately
  await notifyFn(escrowAddress, "return_required", {
    escrowUrl: \`\${APP_URL}/escrow/\${escrowAddress}\`,
    windowHours: 72,
  }, [depositorAddress]).catch(() => {});

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, RETURN_POLL_INTERVAL_MS));
    try {
      const fresh = await fetchEvidenceFn(escrowAddress);
      if (fresh.length > prevEvidenceCount) {
        const newItems = fresh.slice(prevEvidenceCount);
        for (const ev of newItems) {
          const text = ev.uri ?? "";
          // Check for tracking keywords in new evidence
          if (/tracking|shipped.?back|returned?|on.?way/i.test(text)) {
            // Delivered confirmation
            if (/delivered|confirmed|received/i.test(text)) {
              console.log(\`✅ [RETURN] Return delivery confirmed for \${escrowAddress.slice(0,10)}\`);
              return "confirmed";
            }
            console.log(\`📦 [RETURN] Return in transit for \${escrowAddress.slice(0,10)}\`);
            // Continue waiting for delivery confirmation
            prevEvidenceCount = fresh.length;
          }
          // Explicit refusal
          if (/won.?t return|not returning|keeping|refuse/i.test(text)) {
            console.log(\`🚫 [RETURN] Buyer refused to return item — \${escrowAddress.slice(0,10)}\`);
            return "refused";
          }
        }
        prevEvidenceCount = fresh.length;
      }
      const remaining = Math.round((deadline - Date.now()) / 3600000);
      console.log(\`   [RETURN] No return tracking yet — \${remaining}h remaining\`);
    } catch { /* ignore transient errors */ }
  }

  console.log(\`⌛ [RETURN] 72h window expired — no return tracking received for \${escrowAddress.slice(0,10)}\`);
  return "timeout";
}

function startChainListener(chainConfig) {`;

if (!src.includes(OLD_CHAIN_LISTENER_START)) {
  console.error("❌ PATCH 4: Could not find startChainListener");
  process.exit(1);
}
src = src.replace(OLD_CHAIN_LISTENER_START, NEW_HELPERS);
console.log("✅ Patch 4: detectPhysicalGoods() + waitForReturnTracking() added");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 5: Wire physical goods return window into handleDispute()
// ─────────────────────────────────────────────────────────────────────────────

const OLD_SIMPLE_RESOLVE = `      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeSimpleResolution(escrowAddress, decision._onChainRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "simple", disputeContext, decision, scores: decision.scores ?? null, evidenceCount: currentEvidence.length, hadIntake: !!intakeContext, txHash });
      processed.add(escrowAddress);`;

const NEW_SIMPLE_RESOLVE = `      // ── Physical goods return window ─────────────────────────────────────────
      const isPhysical = detectPhysicalGoods(currentEvidence);
      let effectiveRuling = decision._onChainRuling;

      if (isPhysical && decision._onChainRuling === "REFUND" && shouldAutoResolve(decision) && !decision.awaitingReturn) {
        console.log(\`📦 \${tag} [SIMPLE] Physical goods detected — opening 72h return window before executing refund\`);
        const returnStatus = await waitForReturnTracking(
          escrowAddress, disputeContext.depositor.address,
          currentEvidence.length, fetchEvidence, notifyParties
        );
        if (returnStatus === "refused" || returnStatus === "timeout") {
          console.log(\`↩️  \${tag} [SIMPLE] Buyer did not return item — flipping ruling to RELEASE\`);
          effectiveRuling = "RELEASE";
          decision._physicalReturnOutcome = returnStatus;
          decision._originalRuling = "REFUND";
          decision._onChainRuling = "RELEASE";
        } else if (returnStatus === "confirmed") {
          console.log(\`✅ \${tag} [SIMPLE] Return confirmed — executing REFUND\`);
          decision._physicalReturnOutcome = "confirmed";
        }
      }

      if (isPhysical && decision.awaitingReturn) {
        console.log(\`📦 \${tag} [SIMPLE] AI flagged awaitingReturn — buyer tracking in transit, waiting for delivery\`);
        const returnStatus = await waitForReturnTracking(
          escrowAddress, disputeContext.depositor.address,
          currentEvidence.length, fetchEvidence, notifyParties
        );
        effectiveRuling = returnStatus === "confirmed" ? "REFUND" : "RELEASE";
        decision._physicalReturnOutcome = returnStatus;
        decision._onChainRuling = effectiveRuling;
      }

      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeSimpleResolution(escrowAddress, effectiveRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "simple", disputeContext, decision, scores: decision.scores ?? null, evidenceCount: currentEvidence.length, hadIntake: !!intakeContext, isPhysicalGoods: isPhysical, txHash });
      processed.add(escrowAddress);`;

if (!src.includes(OLD_SIMPLE_RESOLVE)) {
  console.error("❌ PATCH 5: Could not find simple resolve block");
  process.exit(1);
}
src = src.replace(OLD_SIMPLE_RESOLVE, NEW_SIMPLE_RESOLVE);
console.log("✅ Patch 5: Physical goods return window wired into handleDispute()");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 6: Same for handleMilestoneDispute()
// ─────────────────────────────────────────────────────────────────────────────

const OLD_MS_RESOLVE = `      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeMilestoneResolution(escrowAddress, milestoneIndex, decision._onChainRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "milestone", milestoneIndex, disputeContext, decision, scores: decision.scores ?? null, evidenceCount: currentEvidence.length, hadIntake: !!intakeContext, txHash });
      processed.add(disputeKey);`;

const NEW_MS_RESOLVE = `      // ── Physical goods return window (milestone) ──────────────────────────────
      const isPhysical = detectPhysicalGoods(currentEvidence);
      let effectiveRuling = decision._onChainRuling;

      if (isPhysical && decision._onChainRuling === "REFUND" && shouldAutoResolve(decision) && !decision.awaitingReturn) {
        console.log(\`📦 \${tag} [MILESTONE] Physical goods — opening 72h return window\`);
        const returnStatus = await waitForReturnTracking(
          escrowAddress, disputeContext.depositor.address,
          currentEvidence.length, fetchEvidence, notifyParties
        );
        if (returnStatus === "refused" || returnStatus === "timeout") {
          effectiveRuling = "RELEASE";
          decision._physicalReturnOutcome = returnStatus;
          decision._onChainRuling = "RELEASE";
        } else if (returnStatus === "confirmed") {
          decision._physicalReturnOutcome = "confirmed";
        }
      }

      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeMilestoneResolution(escrowAddress, milestoneIndex, effectiveRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "milestone", milestoneIndex, disputeContext, decision, scores: decision.scores ?? null, evidenceCount: currentEvidence.length, hadIntake: !!intakeContext, isPhysicalGoods: isPhysical, txHash });
      processed.add(disputeKey);`;

if (!src.includes(OLD_MS_RESOLVE)) {
  console.error("❌ PATCH 6: Could not find milestone resolve block");
  process.exit(1);
}
src = src.replace(OLD_MS_RESOLVE, NEW_MS_RESOLVE);
console.log("✅ Patch 6: Physical goods return window wired into handleMilestoneDispute()");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 7: Add return_required + return_confirmed to notify.js
// ─────────────────────────────────────────────────────────────────────────────

const OLD_NOTIFY_EVENTS = `  evidence_requested:  { emoji: "📋", title: "We need a bit more from you",`;

const NEW_NOTIFY_EVENTS = `  return_required:     { emoji: "📦", title: "Return Required — Action Needed",
    desc: d => \`The AI arbiter has ruled that a refund may be issued, but you must first return the item to the seller.\\n\\nPlease ship the item back and submit your tracking number in the evidence panel within 72 hours.\\n\\nIf you do not return the item, the ruling will be changed to release payment to the seller.\\n\\n<a href="\${d.escrowUrl}">Submit Return Tracking →</a>\`
  },
  return_confirmed:    { emoji: "✅", title: "Return Confirmed — Refund Approved",
    desc: d => \`Your return delivery has been confirmed. The refund will now be processed to your wallet.\\n\\n<a href="\${d.escrowUrl}">View Escrow →</a>\`
  },
  evidence_requested:  { emoji: "📋", title: "We need a bit more from you",`;

if (!notifySrc.includes(OLD_NOTIFY_EVENTS)) {
  console.error("❌ PATCH 7: Could not find evidence_requested in notify.js");
  process.exit(1);
}
notifySrc = notifySrc.replace(OLD_NOTIFY_EVENTS, NEW_NOTIFY_EVENTS);

// Add return_required and return_confirmed to ALL_EVENTS
notifySrc = notifySrc.replace(
  `const ALL_EVENTS = ["escrow_created","escrow_funded","funds_released","dispute_opened","dispute_resolved","milestone_completed","evidence_requested"];`,
  `const ALL_EVENTS = ["escrow_created","escrow_funded","funds_released","dispute_opened","dispute_resolved","milestone_completed","evidence_requested","return_required","return_confirmed"];`
);

fs.writeFileSync(NOTIFY, notifySrc, "utf8");
console.log("✅ Patch 7: return_required + return_confirmed events added to notify.js");

// ─────────────────────────────────────────────────────────────────────────────
// Write oracle
// ─────────────────────────────────────────────────────────────────────────────
fs.writeFileSync(IDX, src, "utf8");
console.log(`\n✅ All oracle patches applied → ${IDX}`);
