/**
 * Patch: Guided clarification for vague or unclear evidence
 *
 * Adds a second AI response channel alongside unverifiedClaims:
 *   vagueEvidence[] — for parties who submitted something but it's too
 *   unclear, generic, or incomplete to weigh properly.
 *
 * Design principle: assume good faith and limited knowledge.
 *   - Never penalize someone for not knowing what to submit
 *   - Use plain language — no legal jargon, no technical assumptions
 *   - Give every party a real window to clarify regardless of background
 *   - The prompt tells them exactly what would help, in simple terms
 *
 * Both unverifiedClaims and vagueEvidence feed into the same
 * challenge loop — one combined window, one re-evaluation.
 */

import fs from "fs";

const FILE = "/root/blockdag-escrow/oracle/index.js";
let src = fs.readFileSync(FILE, "utf8");

// ─── PATCH 1: Add vagueEvidence to AI JSON schema + guidance ─────────────────

const OLD_SCHEMA_END = `  "unverifiedClaims": [
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

const NEW_SCHEMA_END = `  "unverifiedClaims": [
    {
      "party": "depositor" or "beneficiary",
      "claim": "<the specific factual assertion they made without supporting proof>",
      "challengePrompt": "<one clear sentence: exactly what they should submit to prove it — written in plain, simple language anyone can understand>"
    }
  ],
  "vagueEvidence": [
    {
      "party": "depositor" or "beneficiary",
      "submittedText": "<quote the vague/unclear part of what they submitted>",
      "clarificationPrompt": "<plain-language question that would help them provide useful detail — assume they are not technical and may be stressed>"
    }
  ]
}

Additional ruling guidance:
- "ruling" must be "depositor" (refund) or "beneficiary" (release)
- "confidence" reflects certainty — push for 70+ when evidence clearly favors one side
- If no evidence: confidence ≤ 50, ruling "depositor", escalateToManual true
- "factors" should list 2-5 key observations
- Only escalate if evidence is GENUINELY ambiguous — not merely because one party made an unverified counter-claim

EVIDENCE QUALITY RULES:
- "unverifiedClaims": List every specific factual claim that could change the ruling but has NO supporting proof at all.
  Examples: "a second auditor found X" (no report attached), "client approved verbally" (no message/screenshot), "I communicated the delay" (no timestamp/log).
  For each, write a "challengePrompt" telling them exactly what file, screenshot, link or hash would prove it. Use plain language.

- "vagueEvidence": List evidence that WAS submitted but is too vague, unclear or incomplete to weigh reliably.
  Examples: "the work was bad", "I did everything as agreed", "they never responded", "it doesn't work".
  These statements might be completely true — the person may just not know what details to include.
  For each, write a "clarificationPrompt" as a plain, friendly question that guides them to be more specific.
  Write as if speaking to someone who is not technical and may be anxious about the dispute.
  Examples of good clarificationPrompts:
    "Can you describe what specifically was wrong with the work? For example: what were you expecting, and what did you receive instead? A screenshot or link would help a lot."
    "You mentioned they never responded — do you have any messages, emails, or chat logs you could share? Even a screenshot of the conversation would help."
    "You said it doesn't work — can you tell us what happens when you try to use it? For example, does it show an error message, or is something missing entirely?"
  Leave vagueEvidence as [] if all submitted evidence is specific enough to evaluate.\``;

if (!src.includes(OLD_SCHEMA_END)) {
  console.error("❌ PATCH 1: Could not find schema end block");
  process.exit(1);
}
src = src.replace(OLD_SCHEMA_END, NEW_SCHEMA_END);
console.log("✅ Patch 1: vagueEvidence field added to AI schema with plain-language guidance");

// ─── PATCH 2: Extend sendEvidenceChallenge() to handle vagueEvidence too ─────

const OLD_SEND_CHALLENGE = `async function sendEvidenceChallenge(escrowAddress, disputeContext, unverifiedClaims, chainName) {
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
}`;

const NEW_SEND_CHALLENGE = `async function sendEvidenceChallenge(escrowAddress, disputeContext, unverifiedClaims, vagueEvidence, chainName) {
  const APP_URL = "https://app.escrowhubs.io";
  const shortAddr = (a) => a ? \`\${a.slice(0, 6)}…\${a.slice(-4)}\` : "?";
  const escrowUrl = \`\${APP_URL}/escrow/\${escrowAddress}\`;

  // ── Unverified claims: party made a factual assertion with no proof ──────────
  for (const uc of (unverifiedClaims ?? [])) {
    const wallet = uc.party === "depositor"
      ? disputeContext.depositor.address
      : disputeContext.beneficiary.address;
    const role = uc.party === "depositor" ? "Buyer (Depositor)" : "Seller (Beneficiary)";

    console.log(\`📨 [CHALLENGE] \${role} (\${shortAddr(wallet)}): "\${uc.claim}"\`);
    console.log(\`   → Needs: \${uc.challengePrompt}\`);

    await notifyParties(escrowAddress, "evidence_requested", {
      type: "unverified_claim",
      role,
      claim: uc.claim,
      challengePrompt: uc.challengePrompt,
      escrowUrl,
      chainName,
      windowHours: 4,
    }, [wallet]).catch(() => {});

    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [{
            title: \`📨 Evidence Challenge Sent — \${chainName}\`,
            color: 0x3b82f6,
            fields: [
              { name: "Escrow",  value: \`\\\`\${escrowAddress}\\\`\`, inline: false },
              { name: "Party",   value: \`\${role} (\\\`\${shortAddr(wallet)}\\\`)\`, inline: true },
              { name: "Claim",   value: uc.claim, inline: false },
              { name: "Needs",   value: uc.challengePrompt, inline: false },
              { name: "Window",  value: "4 hours to respond", inline: true },
              { name: "Link",    value: escrowUrl, inline: false },
            ],
            footer: { text: "EscrowHubs AI Arbiter — Unverified Claim Challenge" },
            timestamp: new Date().toISOString(),
          }]}),
        });
      } catch { /* silent */ }
    }
  }

  // ── Vague evidence: party submitted something but it's too unclear to weigh ──
  for (const ve of (vagueEvidence ?? [])) {
    const wallet = ve.party === "depositor"
      ? disputeContext.depositor.address
      : disputeContext.beneficiary.address;
    const role = ve.party === "depositor" ? "Buyer (Depositor)" : "Seller (Beneficiary)";

    console.log(\`💬 [CLARIFY] \${role} (\${shortAddr(wallet)}) submitted vague evidence:\`);
    console.log(\`   Submitted: "\${ve.submittedText}"\`);
    console.log(\`   → Guide: \${ve.clarificationPrompt}\`);

    await notifyParties(escrowAddress, "evidence_requested", {
      type: "vague_evidence",
      role,
      submittedText: ve.submittedText,
      clarificationPrompt: ve.clarificationPrompt,
      escrowUrl,
      chainName,
      windowHours: 4,
    }, [wallet]).catch(() => {});

    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [{
            title: \`💬 Clarification Requested — \${chainName}\`,
            color: 0xf59e0b,
            fields: [
              { name: "Escrow",     value: \`\\\`\${escrowAddress}\\\`\`, inline: false },
              { name: "Party",      value: \`\${role} (\\\`\${shortAddr(wallet)}\\\`)\`, inline: true },
              { name: "They said",  value: \`"\${ve.submittedText}"\`, inline: false },
              { name: "Asked for",  value: ve.clarificationPrompt, inline: false },
              { name: "Window",     value: "4 hours to respond", inline: true },
              { name: "Link",       value: escrowUrl, inline: false },
            ],
            footer: { text: "EscrowHubs AI Arbiter — Vague Evidence Clarification" },
            timestamp: new Date().toISOString(),
          }]}),
        });
      } catch { /* silent */ }
    }
  }
}`;

if (!src.includes(OLD_SEND_CHALLENGE)) {
  console.error("❌ PATCH 2: Could not find sendEvidenceChallenge() function");
  process.exit(1);
}
src = src.replace(OLD_SEND_CHALLENGE, NEW_SEND_CHALLENGE);
console.log("✅ Patch 2: sendEvidenceChallenge() extended to handle vagueEvidence");

// ─── PATCH 3: Update notify.js evidence_requested to handle both types ────────

const NOTIFY_FILE = "/root/blockdag-escrow/oracle/notify.js";
let notifySrc = fs.readFileSync(NOTIFY_FILE, "utf8");

const OLD_EVIDENCE_DESC = `  evidence_requested:  { emoji: "📋", title: "Evidence Required — Action Needed",    desc: d => \`The AI arbiter reviewed your claim and needs supporting proof.\\n\\n<b>Your claim:</b> "\${d.claim}"\\n\\n<b>What to submit:</b> \${d.challengePrompt}\\n\\nPlease open the evidence panel on your escrow page and upload within \${d.windowHours || 4} hours.\` },`;

const NEW_EVIDENCE_DESC = `  evidence_requested:  { emoji: "📋", title: "We need a bit more from you",           desc: d => {
    if (d.type === "vague_evidence") {
      return \`The AI arbiter reviewed what you submitted, but needs a little more detail to make a fair decision.\\n\\n<b>You said:</b> "\${d.submittedText}"\\n\\n<b>Can you help us by answering this?</b>\\n\${d.clarificationPrompt}\\n\\nYou have \${d.windowHours || 4} hours to add more detail using the evidence panel on your escrow page. This helps ensure a fair outcome.\\n\\n<a href="\${d.escrowUrl}">Open Evidence Panel →</a>\`;
    }
    return \`The AI arbiter found a claim in your submission that needs supporting proof before it can be considered.\\n\\n<b>Your claim:</b> "\${d.claim}"\\n\\n<b>What would help:</b> \${d.challengePrompt}\\n\\nYou have \${d.windowHours || 4} hours to submit this via the evidence panel.\\n\\n<a href="\${d.escrowUrl}">Open Evidence Panel →</a>\`;
  }},`;

if (!notifySrc.includes(OLD_EVIDENCE_DESC)) {
  console.error("❌ PATCH 3: Could not find evidence_requested in notify.js");
  process.exit(1);
}
notifySrc = notifySrc.replace(OLD_EVIDENCE_DESC, NEW_EVIDENCE_DESC);
fs.writeFileSync(NOTIFY_FILE, notifySrc, "utf8");
console.log("✅ Patch 3: Telegram message templates updated for both vague and unverified types");

// ─── PATCH 4: Update the challenge loop in handleDispute() to pass vagueEvidence ─

const OLD_SIMPLE_CHALLENGE = `      // ── Evidence challenge round ─────────────────────────────────────────────
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
      }`;

const NEW_SIMPLE_CHALLENGE = `      // ── Evidence challenge round ─────────────────────────────────────────────
      const hasChallenges = decision.unverifiedClaims?.length || decision.vagueEvidence?.length;
      if (hasChallenges) {
        const totalItems = (decision.unverifiedClaims?.length ?? 0) + (decision.vagueEvidence?.length ?? 0);
        console.log(\`📨 \${tag} [SIMPLE] \${totalItems} evidence issue(s) detected (unverified: \${decision.unverifiedClaims?.length ?? 0}, vague: \${decision.vagueEvidence?.length ?? 0}) — issuing guidance\`);
        recordChallenge(escrowAddress, { issuedAt: Date.now(), unverifiedClaims: decision.unverifiedClaims, vagueEvidence: decision.vagueEvidence });
        await sendEvidenceChallenge(escrowAddress, disputeContext, decision.unverifiedClaims, decision.vagueEvidence, name);
        const freshEvidence = await waitForChallengeResponse(escrowAddress, currentEvidence.length, fetchEvidence);
        if (freshEvidence && freshEvidence.length > currentEvidence.length) {
          currentEvidence = freshEvidence;
          console.log(\`🤖 \${tag} [SIMPLE] Re-evaluating with \${currentEvidence.length} evidence item(s)...\`);
          decision = await callAI(disputeContext, currentEvidence);
        }
        clearChallenge(escrowAddress);
      }`;

if (!src.includes(OLD_SIMPLE_CHALLENGE)) {
  console.error("❌ PATCH 4: Could not find simple challenge block");
  process.exit(1);
}
src = src.replace(OLD_SIMPLE_CHALLENGE, NEW_SIMPLE_CHALLENGE);
console.log("✅ Patch 4: handleDispute() challenge loop updated for both types");

// ─── PATCH 5: Same update in handleMilestoneDispute() ────────────────────────

const OLD_MILESTONE_CHALLENGE = `      // ── Evidence challenge round ─────────────────────────────────────────────
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
      }`;

const NEW_MILESTONE_CHALLENGE = `      // ── Evidence challenge round ─────────────────────────────────────────────
      const hasChallenges = decision.unverifiedClaims?.length || decision.vagueEvidence?.length;
      if (hasChallenges) {
        const totalItems = (decision.unverifiedClaims?.length ?? 0) + (decision.vagueEvidence?.length ?? 0);
        console.log(\`📨 \${tag} [MILESTONE] \${totalItems} evidence issue(s) detected (unverified: \${decision.unverifiedClaims?.length ?? 0}, vague: \${decision.vagueEvidence?.length ?? 0}) — issuing guidance\`);
        recordChallenge(disputeKey, { issuedAt: Date.now(), unverifiedClaims: decision.unverifiedClaims, vagueEvidence: decision.vagueEvidence });
        await sendEvidenceChallenge(escrowAddress, disputeContext, decision.unverifiedClaims, decision.vagueEvidence, name);
        const freshEvidence = await waitForChallengeResponse(escrowAddress, currentEvidence.length, fetchEvidence);
        if (freshEvidence && freshEvidence.length > currentEvidence.length) {
          currentEvidence = freshEvidence;
          console.log(\`🤖 \${tag} [MILESTONE] Re-evaluating with \${currentEvidence.length} evidence item(s)...\`);
          decision = await callAI(disputeContext, currentEvidence);
        }
        clearChallenge(disputeKey);
      }`;

if (!src.includes(OLD_MILESTONE_CHALLENGE)) {
  console.error("❌ PATCH 5: Could not find milestone challenge block");
  process.exit(1);
}
src = src.replace(OLD_MILESTONE_CHALLENGE, NEW_MILESTONE_CHALLENGE);
console.log("✅ Patch 5: handleMilestoneDispute() challenge loop updated for both types");

// ─── Write and verify ─────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src, "utf8");
console.log(`\n✅ All patches applied to ${FILE}`);
console.log("   Run: node --input-type=module --check < index.js && pm2 restart oracle-base oracle-polygon\n");
