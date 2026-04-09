/**
 * Patches oracle/index.js with the Evidence Challenge System:
 *
 * When a party makes an unverified factual claim (e.g. "a second auditor found X"
 * with no attached proof), the AI now flags it in a new `unverifiedClaims` field.
 * The oracle:
 *   1. Sends a targeted Telegram notification to that party:
 *      "You claimed X — please submit supporting evidence within 4 hours via
 *      the evidence panel on your escrow page."
 *   2. Waits up to CHALLENGE_WINDOW_MS for new evidence to appear on-chain
 *   3. Re-evaluates with whatever was submitted (or not)
 *   4. Persists the challenge state to oracle-state.json so restarts are safe
 *
 * This turns the arbiter from a passive judge into an active investigator.
 */

import fs from "fs";

const FILE = "/root/blockdag-escrow/oracle/index.js";
let src = fs.readFileSync(FILE, "utf8");

// ─── PATCH 1: Extend the AI JSON schema + add unverifiedClaims field ─────────

const OLD_PROMPT_SCHEMA = `{
  "ruling": "depositor" or "beneficiary",
  "splitPercentage": null,
  "confidence": <integer 0-100>,
  "reasoning": "<2-4 sentences explaining your ruling based on the evidence>",
  "factors": [
    { "factor": "<observation>", "weight": "high|medium|low", "favoredParty": "depositor|beneficiary" }
  ],
  "escalateToManual": <true if confidence < 70 or evidence genuinely ambiguous, else false>
}

Additional ruling guidance:
- "ruling" must be "depositor" (refund) or "beneficiary" (release)
- "confidence" reflects certainty — push for 70+ when evidence clearly favors one side
- If no evidence: confidence ≤ 50, ruling "depositor", escalateToManual true
- "factors" should list 2-5 key observations
- Only escalate if evidence is GENUINELY ambiguous — not merely because one party made an unverified counter-claim\``;

const NEW_PROMPT_SCHEMA = `{
  "ruling": "depositor" or "beneficiary",
  "splitPercentage": null,
  "confidence": <integer 0-100>,
  "reasoning": "<2-4 sentences explaining your ruling based on the evidence>",
  "factors": [
    { "factor": "<observation>", "weight": "high|medium|low", "favoredParty": "depositor|beneficiary" }
  ],
  "escalateToManual": <true if confidence < 70 or evidence genuinely ambiguous, else false>,
  "unverifiedClaims": [
    {
      "party": "depositor" or "beneficiary",
      "claim": "<the specific factual assertion they made without supporting proof>",
      "challengePrompt": "<one sentence: exactly what evidence they should submit to prove it>"
    }
  ]
}

Additional ruling guidance:
- "ruling" must be "depositor" (refund) or "beneficiary" (release)
- "confidence" reflects certainty — push for 70+ when evidence clearly favors one side
- If no evidence: confidence ≤ 50, ruling "depositor", escalateToManual true
- "factors" should list 2-5 key observations
- Only escalate if evidence is GENUINELY ambiguous — not merely because one party made an unverified counter-claim
- "unverifiedClaims": list every specific factual claim that could change the ruling but lacks supporting documentation. Examples: "a second auditor found X", "client approved verbally", "I communicated the delay". Leave array empty [] if all material claims are documented.
- For each unverified claim, write a "challengePrompt" as a direct instruction to that party: what file, screenshot, log, link, or hash would prove their claim.\``;

if (!src.includes(OLD_PROMPT_SCHEMA)) {
  console.error("❌ PATCH 1: Could not find prompt schema block");
  process.exit(1);
}
src = src.replace(OLD_PROMPT_SCHEMA, NEW_PROMPT_SCHEMA);
console.log("✅ Patch 1: AI schema extended with unverifiedClaims field");

// ─── PATCH 2: Add CHALLENGE_WINDOW_MS constant near other globals ─────────────

const OLD_GLOBAL = `const AUTO_RESOLVE_MIN_CONFIDENCE = 70;`;
const NEW_GLOBAL = `const AUTO_RESOLVE_MIN_CONFIDENCE = 70;
const CHALLENGE_WINDOW_MS          = 4 * 60 * 60 * 1000; // 4 hours for challenged party to respond
const CHALLENGE_POLL_INTERVAL_MS   = 2 * 60 * 1000;      // check for new evidence every 2 min`;

if (!src.includes(OLD_GLOBAL)) {
  console.error("❌ PATCH 2: Could not find AUTO_RESOLVE_MIN_CONFIDENCE");
  process.exit(1);
}
src = src.replace(OLD_GLOBAL, NEW_GLOBAL);
console.log("✅ Patch 2: Challenge window constants added");

// ─── PATCH 3: Add oracle-state helpers for challenge persistence ───────────────

const OLD_STATE_MARKER = `// ─── Per-chain listener ───────────────────────────────────────────────────────`;
const NEW_STATE_SECTION = `// ─── Oracle state: persist challenge queue across restarts ──────────────────────

const STATE_FILE = path.join(__dirname, "oracle-state.json");

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf8").trim();
      if (raw) return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return {};
}

function saveState(state) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8"); }
  catch (err) { console.error("❌ saveState error:", err.message); }
}

/** Persist a pending challenge so it survives oracle restarts */
function recordChallenge(escrowKey, challengeData) {
  const state = loadState();
  if (!state.pendingChallenges) state.pendingChallenges = {};
  state.pendingChallenges[escrowKey] = challengeData;
  saveState(state);
}

/** Remove a resolved challenge */
function clearChallenge(escrowKey) {
  const state = loadState();
  if (state.pendingChallenges?.[escrowKey]) {
    delete state.pendingChallenges[escrowKey];
    saveState(state);
  }
}

// ─── Per-chain listener ───────────────────────────────────────────────────────`;

if (!src.includes(OLD_STATE_MARKER)) {
  console.error("❌ PATCH 3: Could not find per-chain listener marker");
  process.exit(1);
}
src = src.replace(OLD_STATE_MARKER, NEW_STATE_SECTION);
console.log("✅ Patch 3: Oracle state helpers added");

// ─── PATCH 4: Add sendEvidenceChallenge() helper before chain listener ────────

// Insert right before "function startChainListener"
const OLD_CHAIN_LISTENER = `function startChainListener(chainConfig) {`;
const NEW_CHAIN_LISTENER = `// ─── Evidence challenge notification ────────────────────────────────────────────

/**
 * Notify a party that they made an unverified claim and prompt them to submit proof.
 * Sends via Telegram (if linked) and Discord admin webhook.
 */
async function sendEvidenceChallenge(escrowAddress, disputeContext, unverifiedClaims, chainName) {
  if (!unverifiedClaims?.length) return;

  const APP_URL = "https://app.escrowhubs.io";
  const shortAddr = (a) => a ? \`\${a.slice(0, 6)}…\${a.slice(-4)}\` : "?";

  for (const uc of unverifiedClaims) {
    const wallet = uc.party === "depositor"
      ? disputeContext.depositor.address
      : disputeContext.beneficiary.address;

    const role = uc.party === "depositor" ? "Buyer (Depositor)" : "Seller (Beneficiary)";
    const escrowUrl = \`\${APP_URL}/escrow/\${escrowAddress}\`;

    console.log(\`📨 [CHALLENGE] \${role} (\${shortAddr(wallet)}): "\${uc.claim}"\`);
    console.log(\`   → Prompt: \${uc.challengePrompt}\`);

    // Telegram notification to the party
    await notifyParties(
      escrowAddress,
      "evidence_requested",
      {
        role,
        claim: uc.claim,
        challengePrompt: uc.challengePrompt,
        escrowUrl,
        chainName,
        windowHours: 4,
      },
      [wallet]
    ).catch(() => {});

    // Discord admin alert
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [{
              title: \`📨 Evidence Challenge Sent — \${chainName}\`,
              color: 0x3b82f6,
              fields: [
                { name: "Escrow",   value: \`\\\`\${escrowAddress}\\\`\`, inline: false },
                { name: "Party",    value: \`\${role} (\\\`\${shortAddr(wallet)}\\\`)\`, inline: true },
                { name: "Claim",    value: uc.claim, inline: false },
                { name: "Needs",    value: uc.challengePrompt, inline: false },
                { name: "Window",   value: "4 hours to submit evidence", inline: true },
                { name: "Link",     value: escrowUrl, inline: false },
              ],
              footer: { text: "EscrowHubs AI Arbiter — Evidence Challenge" },
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      } catch { /* silent */ }
    }
  }
}

/**
 * Wait for new evidence to appear after a challenge was issued.
 * Polls every CHALLENGE_POLL_INTERVAL_MS for up to CHALLENGE_WINDOW_MS.
 * Returns the updated evidence array (may be same if party didn't respond).
 */
async function waitForChallengeResponse(escrowAddress, prevEvidenceCount, fetchEvidenceFn) {
  const deadline = Date.now() + CHALLENGE_WINDOW_MS;
  console.log(\`⏳ [CHALLENGE] Waiting up to 4h for challenged party evidence on \${escrowAddress.slice(0,10)}…\`);

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, CHALLENGE_POLL_INTERVAL_MS));
    try {
      const fresh = await fetchEvidenceFn(escrowAddress);
      if (fresh.length > prevEvidenceCount) {
        console.log(\`✅ [CHALLENGE] New evidence received (\${fresh.length - prevEvidenceCount} item(s)) — re-evaluating\`);
        return fresh;
      }
      const remaining = Math.round((deadline - Date.now()) / 60000);
      console.log(\`   [CHALLENGE] No new evidence yet — \${remaining}m remaining\`);
    } catch { /* ignore transient errors */ }
  }

  console.log(\`⌛ [CHALLENGE] Window expired — proceeding with existing evidence\`);
  return await fetchEvidenceFn(escrowAddress).catch(() => null);
}

function startChainListener(chainConfig) {`;

if (!src.includes(OLD_CHAIN_LISTENER)) {
  console.error("❌ PATCH 4: Could not find startChainListener");
  process.exit(1);
}
src = src.replace(OLD_CHAIN_LISTENER, NEW_CHAIN_LISTENER);
console.log("✅ Patch 4: sendEvidenceChallenge() + waitForChallengeResponse() added");

// ─── PATCH 5: Wire evidence challenge into handleDispute() ────────────────────

const OLD_SIMPLE_DECISION = `      console.log(\`🤖 \${tag} [SIMPLE] Consulting AI...\`);

      const decision = await callAI(disputeContext, evidence);
      const urgency  = logDecisionSummary(\`\${tag} [SIMPLE]\`, decision);

      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeSimpleResolution(escrowAddress, decision._onChainRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "simple", disputeContext, decision, txHash });
      processed.add(escrowAddress);`;

const NEW_SIMPLE_DECISION = `      console.log(\`🤖 \${tag} [SIMPLE] Consulting AI (round 1)...\`);

      let decision = await callAI(disputeContext, evidence);
      let currentEvidence = evidence;

      // ── Evidence challenge round ─────────────────────────────────────────────
      if (decision.unverifiedClaims?.length) {
        console.log(\`📨 \${tag} [SIMPLE] \${decision.unverifiedClaims.length} unverified claim(s) — issuing challenges\`);
        recordChallenge(escrowAddress, { issuedAt: Date.now(), claims: decision.unverifiedClaims });
        await sendEvidenceChallenge(escrowAddress, disputeContext, decision.unverifiedClaims, name);
        const freshEvidence = await waitForChallengeResponse(escrowAddress, currentEvidence.length, fetchEvidence);
        if (freshEvidence && freshEvidence.length > currentEvidence.length) {
          currentEvidence = freshEvidence;
          console.log(\`🤖 \${tag} [SIMPLE] Re-evaluating with \${currentEvidence.length} evidence item(s)...\`);
          decision = await callAI(disputeContext, currentEvidence);
        }
        clearChallenge(escrowAddress);
      }

      const urgency  = logDecisionSummary(\`\${tag} [SIMPLE]\`, decision);

      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeSimpleResolution(escrowAddress, decision._onChainRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "simple", disputeContext, decision, evidenceCount: currentEvidence.length, txHash });
      processed.add(escrowAddress);`;

if (!src.includes(OLD_SIMPLE_DECISION)) {
  console.error("❌ PATCH 5: Could not find simple dispute decision block");
  process.exit(1);
}
src = src.replace(OLD_SIMPLE_DECISION, NEW_SIMPLE_DECISION);
console.log("✅ Patch 5: Evidence challenge wired into handleDispute()");

// ─── PATCH 6: Wire evidence challenge into handleMilestoneDispute() ───────────

const OLD_MILESTONE_DECISION = `      console.log(\`🤖 \${tag} [MILESTONE] Consulting AI...\`);

      const decision = await callAI(disputeContext, evidence);
      const urgency  = logDecisionSummary(\`\${tag} [MILESTONE]\`, decision);

      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeMilestoneResolution(escrowAddress, milestoneIndex, decision._onChainRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "milestone", milestoneIndex, disputeContext, decision, txHash });
      processed.add(disputeKey);`;

const NEW_MILESTONE_DECISION = `      console.log(\`🤖 \${tag} [MILESTONE] Consulting AI (round 1)...\`);

      let decision = await callAI(disputeContext, evidence);
      let currentEvidence = evidence;

      // ── Evidence challenge round ─────────────────────────────────────────────
      if (decision.unverifiedClaims?.length) {
        console.log(\`📨 \${tag} [MILESTONE] \${decision.unverifiedClaims.length} unverified claim(s) — issuing challenges\`);
        recordChallenge(disputeKey, { issuedAt: Date.now(), claims: decision.unverifiedClaims });
        await sendEvidenceChallenge(escrowAddress, disputeContext, decision.unverifiedClaims, name);
        const freshEvidence = await waitForChallengeResponse(escrowAddress, currentEvidence.length, fetchEvidence);
        if (freshEvidence && freshEvidence.length > currentEvidence.length) {
          currentEvidence = freshEvidence;
          console.log(\`🤖 \${tag} [MILESTONE] Re-evaluating with \${currentEvidence.length} evidence item(s)...\`);
          decision = await callAI(disputeContext, currentEvidence);
        }
        clearChallenge(disputeKey);
      }

      const urgency  = logDecisionSummary(\`\${tag} [MILESTONE]\`, decision);

      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeMilestoneResolution(escrowAddress, milestoneIndex, decision._onChainRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "milestone", milestoneIndex, disputeContext, decision, evidenceCount: currentEvidence.length, txHash });
      processed.add(disputeKey);`;

if (!src.includes(OLD_MILESTONE_DECISION)) {
  console.error("❌ PATCH 6: Could not find milestone dispute decision block");
  process.exit(1);
}
src = src.replace(OLD_MILESTONE_DECISION, NEW_MILESTONE_DECISION);
console.log("✅ Patch 6: Evidence challenge wired into handleMilestoneDispute()");

// ─── PATCH 7: Add evidence_requested event type to notify.js ──────────────────
// (Also needs notifyParties to handle the new event type — add to EVENT_META)

const NOTIFY_FILE = "/root/blockdag-escrow/oracle/notify.js";
let notifySrc = fs.readFileSync(NOTIFY_FILE, "utf8");

const OLD_EVENT_META = `  dispute_resolved:    { emoji: "⚖️",  title: "Dispute Resolved",                     desc: d => \`The dispute has been resolved.\${d.ruling ? \` Ruling: \${d.ruling}.\` : ""}\` },
  milestone_completed: { emoji: "🏁", title: "Milestone Completed",                  desc: d => \`Milestone #\${d.milestoneIndex ?? "?"} has been completed.\` },
};`;

const NEW_EVENT_META = `  dispute_resolved:    { emoji: "⚖️",  title: "Dispute Resolved",                     desc: d => \`The dispute has been resolved.\${d.ruling ? \` Ruling: \${d.ruling}.\` : ""}\` },
  milestone_completed: { emoji: "🏁", title: "Milestone Completed",                  desc: d => \`Milestone #\${d.milestoneIndex ?? "?"} has been completed.\` },
  evidence_requested:  { emoji: "📋", title: "Evidence Required — Action Needed",    desc: d => \`The AI arbiter reviewed your claim and needs supporting proof.\\n\\n<b>Your claim:</b> "\${d.claim}"\\n\\n<b>What to submit:</b> \${d.challengePrompt}\\n\\nPlease open the evidence panel on your escrow page and upload within \${d.windowHours || 4} hours.\` },
};`;

if (!notifySrc.includes(OLD_EVENT_META)) {
  console.error("❌ PATCH 7: Could not find EVENT_META in notify.js");
  process.exit(1);
}
notifySrc = notifySrc.replace(OLD_EVENT_META, NEW_EVENT_META);

// Also add evidence_requested to the ALL_EVENTS list so new links get it enabled
notifySrc = notifySrc.replace(
  `const ALL_EVENTS = ["escrow_created","escrow_funded","funds_released","dispute_opened","dispute_resolved","milestone_completed"];`,
  `const ALL_EVENTS = ["escrow_created","escrow_funded","funds_released","dispute_opened","dispute_resolved","milestone_completed","evidence_requested"];`
);

fs.writeFileSync(NOTIFY_FILE, notifySrc, "utf8");
console.log("✅ Patch 7: evidence_requested event added to notify.js");

// ─── Write patched oracle ─────────────────────────────────────────────────────

fs.writeFileSync(FILE, src, "utf8");
console.log(`\n✅ All patches applied to ${FILE}`);
console.log("   Run: pm2 restart oracle-base oracle-polygon\n");
