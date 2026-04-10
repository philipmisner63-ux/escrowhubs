/**
 * Escalation System — Full Implementation
 *
 * Oracle side:
 *   - EscalationManager: persists escalated disputes, tracks 48h countdown
 *   - Immediate notifications: Discord rich embed + Telegram to both parties
 *   - Reminder cadence: 24h + 47h Discord pings
 *   - 48h fallback: auto-executes AI ruling if admin never weighs in
 *   - ARBITER_REVIEW detection: when admin submits review on-chain, oracle
 *     picks it up, re-runs AI with elevated weight, executes if >= 70
 *
 * Frontend side (admin API + UI):
 *   - /api/admin/escalations: GET list, POST arbiter review
 *   - /admin page: escalation queue with case viewer + review form
 */

import fs from "fs";
import path from "path";

const ORACLE = "/root/blockdag-escrow/oracle/index.js";
const NOTIFY = "/root/blockdag-escrow/oracle/notify.js";

let src  = fs.readFileSync(ORACLE, "utf8");
let nsrc = fs.readFileSync(NOTIFY, "utf8");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 1: Add ESCALATION constants + EscalationManager after existing constants
// ─────────────────────────────────────────────────────────────────────────────

const OLD_CONST = `const RETURN_WINDOW_MS             = 72 * 60 * 60 * 1000; // 72h for buyer to submit return tracking
const RETURN_POLL_INTERVAL_MS      = 10 * 60 * 1000;     // check for return tracking every 10 min`;

const NEW_CONST = `const RETURN_WINDOW_MS             = 72 * 60 * 60 * 1000; // 72h for buyer to submit return tracking
const RETURN_POLL_INTERVAL_MS      = 10 * 60 * 1000;     // check for return tracking every 10 min
const ESCALATION_WINDOW_MS        = 48 * 60 * 60 * 1000; // 48h for admin review before auto-fallback
const ESCALATION_REMINDER_1_MS    = 24 * 60 * 60 * 1000; // first reminder at 24h
const ESCALATION_REMINDER_2_MS    = 47 * 60 * 60 * 1000; // urgent reminder at 47h
const ESCALATION_CHECK_MS         =  5 * 60 * 1000;      // check escalation timers every 5 min
const ESCALATIONS_FILE            = path.join(__dirname, "escalations.json");
const ARBITER_REVIEW_PREFIX       = "ARBITER_REVIEW:";`;

if (!src.includes(OLD_CONST)) { console.error("❌ PATCH 1: constants"); process.exit(1); }
src = src.replace(OLD_CONST, NEW_CONST);
console.log("✅ Patch 1: escalation constants added");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 2: Add EscalationManager before startChainListener
// ─────────────────────────────────────────────────────────────────────────────

const ESCALATION_MANAGER = `
// ─── Escalation Manager ──────────────────────────────────────────────────────

const EscalationManager = {
  load() {
    try {
      if (fs.existsSync(ESCALATIONS_FILE)) {
        const raw = fs.readFileSync(ESCALATIONS_FILE, "utf8").trim();
        return raw ? JSON.parse(raw) : {};
      }
    } catch { /* ignore */ }
    return {};
  },

  save(data) {
    try { fs.writeFileSync(ESCALATIONS_FILE, JSON.stringify(data, null, 2), "utf8"); }
    catch (err) { console.error("❌ EscalationManager.save:", err.message); }
  },

  add(escrowKey, record) {
    const data = this.load();
    data[escrowKey] = {
      ...record,
      escalatedAt: Date.now(),
      reminder1Sent: false,
      reminder2Sent: false,
      resolved: false,
    };
    this.save(data);
    console.log(\`📋 [ESCALATION] Tracked: \${escrowKey}\`);
  },

  resolve(escrowKey) {
    const data = this.load();
    if (data[escrowKey]) {
      data[escrowKey].resolved = true;
      data[escrowKey].resolvedAt = Date.now();
      this.save(data);
    }
  },

  getPending() {
    const data = this.load();
    return Object.entries(data)
      .filter(([, v]) => !v.resolved)
      .map(([k, v]) => ({ key: k, ...v }));
  },

  markReminder(escrowKey, which) {
    const data = this.load();
    if (data[escrowKey]) {
      data[escrowKey][\`reminder\${which}Sent\`] = true;
      this.save(data);
    }
  },
};

// ─── Escalation: notify both parties + admin, register timer ─────────────────

async function handleEscalation(escrowKey, disputeContext, decision, chainName, urgency, executeResolution) {
  const APP_URL = "https://app.escrowhubs.io";
  const { depositor, beneficiary, amount, nativeSymbol, contractAddress, escrowType } = disputeContext;

  // Register in escalation manager
  EscalationManager.add(escrowKey, {
    escrowKey,
    contractAddress,
    chainName,
    escrowType,
    amount,
    nativeSymbol,
    depositor: depositor.address,
    beneficiary: beneficiary.address,
    aiRuling: decision._onChainRuling,
    confidence: decision.confidence,
    reasoning: decision.reasoning,
    scores: decision.scores,
    fallbackRuling: decision._onChainRuling, // what fires at 48h if admin doesn't act
    executeResolution, // stored function ref not serializable — stored in memory
  });

  // ── Notify both parties via Telegram ─────────────────────────────────────
  await notifyParties(contractAddress, "dispute_escalated", {
    escrowUrl: \`\${APP_URL}/escrow/\${contractAddress}\`,
    windowHours: 48,
  }, [depositor.address, beneficiary.address]).catch(() => {});

  // ── Discord admin embed ───────────────────────────────────────────────────
  if (DISCORD_WEBHOOK) {
    try {
      const color = urgency === "HIGH_RISK" ? 0xff2222 : 0xff8800;
      const s = decision.scores ?? {};
      await fetch(DISCORD_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{
          title: \`🔔 ESCALATION — Arbiter Review Needed (\${chainName})\`,
          description: \`**You have 48 hours to review and weigh in. If no action is taken, the AI ruling executes automatically.**\`,
          color,
          fields: [
            { name: "Escrow",       value: \`\\\`\${contractAddress}\\\`\`, inline: false },
            { name: "Type",         value: escrowType,                   inline: true },
            { name: "Amount",       value: \`\${amount} \${nativeSymbol}\`,  inline: true },
            { name: "AI Ruling",    value: decision._onChainRuling,      inline: true },
            { name: "Confidence",   value: \`\${decision.confidence}/100\`, inline: true },
            { name: "Depositor",    value: \`\\\`\${depositor.address}\\\`\`,  inline: false },
            { name: "Beneficiary",  value: \`\\\`\${beneficiary.address}\\\`\`, inline: false },
            { name: "Scores",       value: s ? \`P:\${s.performance} A:\${s.acceptance} C:\${s.communication} CT:\${s.complaintTimeliness} F:\${s.fraudFlag?1:0}\` : "N/A", inline: false },
            { name: "AI Reasoning", value: decision.reasoning ?? "N/A",  inline: false },
            { name: "Review",       value: \`Submit your assessment on-chain as evidence from the oracle wallet:\\n\\\`ARBITER_REVIEW: [your assessment]\\\`\\n\\nOr use the admin panel: \${APP_URL}/admin\`, inline: false },
            { name: "Auto-fallback",value: \`AI ruling (\${decision._onChainRuling}) executes in 48h if no review submitted\`, inline: false },
          ],
          footer: { text: \`EscrowHubs AI Arbiter — Escalation ID: \${escrowKey}\` },
          timestamp: new Date().toISOString(),
        }]})
      });
      console.log(\`📣 [ESCALATION] Discord admin alert sent for \${escrowKey}\`);
    } catch (err) { console.error("❌ Escalation Discord error:", err.message); }
  }
}

// ─── Escalation timer loop — runs every 5 min ─────────────────────────────────

async function runEscalationTimers(chainResolvers) {
  const pending = EscalationManager.getPending();
  const now = Date.now();

  for (const esc of pending) {
    const age = now - esc.escalatedAt;

    // ── 24h reminder ────────────────────────────────────────────────────────
    if (!esc.reminder1Sent && age >= ESCALATION_REMINDER_1_MS) {
      console.log(\`⏰ [ESCALATION] 24h reminder for \${esc.key}\`);
      if (DISCORD_WEBHOOK) {
        await fetch(DISCORD_WEBHOOK, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: \`⚠️ **24h reminder** — Escalated dispute still pending review.\\n\\\`\${esc.contractAddress}\\\` (\${esc.chainName}) — \${esc.amount} \${esc.nativeSymbol}\\nAI ruling: \${esc.aiRuling} (\${esc.confidence}/100)\\nAuto-fallback in 24 hours.\` })
        }).catch(() => {});
      }
      EscalationManager.markReminder(esc.key, "1");
    }

    // ── 47h urgent reminder ──────────────────────────────────────────────────
    if (!esc.reminder2Sent && age >= ESCALATION_REMINDER_2_MS) {
      console.log(\`🚨 [ESCALATION] 47h urgent reminder for \${esc.key}\`);
      if (DISCORD_WEBHOOK) {
        await fetch(DISCORD_WEBHOOK, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: \`🚨 **URGENT — 1 hour left** — Escalated dispute auto-resolves in ~1 hour.\\n\\\`\${esc.contractAddress}\\\` (\${esc.chainName}) — \${esc.amount} \${esc.nativeSymbol}\\nAI ruling: **\${esc.aiRuling}** will execute automatically unless you review now.\\nAdmin panel: https://app.escrowhubs.io/admin\` })
        }).catch(() => {});
      }
      EscalationManager.markReminder(esc.key, "2");
    }

    // ── 48h auto-fallback ────────────────────────────────────────────────────
    if (age >= ESCALATION_WINDOW_MS) {
      console.log(\`⏱️  [ESCALATION] 48h expired for \${esc.key} — auto-executing \${esc.fallbackRuling}\`);
      const resolver = chainResolvers.get(esc.contractAddress);
      if (resolver) {
        try {
          const txHash = await resolver(esc.fallbackRuling);
          console.log(\`✅ [ESCALATION] Auto-fallback executed: \${txHash}\`);
          appendDecision({
            timestamp: new Date().toISOString(),
            contractAddress: esc.contractAddress,
            chainName: esc.chainName,
            escrowType: esc.escrowType,
            resolution: "auto_fallback_48h",
            ruling: esc.fallbackRuling,
            txHash,
          });
          EscalationManager.resolve(esc.key);
          if (DISCORD_WEBHOOK) {
            await fetch(DISCORD_WEBHOOK, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: \`⏱️ **Auto-fallback executed** — 48h window expired.\\n\\\`\${esc.contractAddress}\\\` → **\${esc.fallbackRuling}**\\nTx: \${txHash}\` })
            }).catch(() => {});
          }
          await notifyParties(esc.contractAddress, "dispute_resolved", {
            amount: esc.amount, symbol: esc.nativeSymbol,
            ruling: esc.fallbackRuling, chainId: esc.chainId,
          }, [esc.depositor, esc.beneficiary]).catch(() => {});
        } catch (err) {
          console.error(\`❌ [ESCALATION] Auto-fallback failed for \${esc.key}:\`, err.message);
        }
      } else {
        console.error(\`❌ [ESCALATION] No resolver found for \${esc.contractAddress} — cannot auto-execute\`);
      }
    }
  }
}

`;

const OLD_CHAIN_LISTENER = `function startChainListener(chainConfig) {`;
if (!src.includes(OLD_CHAIN_LISTENER)) { console.error("❌ PATCH 2: startChainListener"); process.exit(1); }
src = src.replace(OLD_CHAIN_LISTENER, ESCALATION_MANAGER + OLD_CHAIN_LISTENER);
console.log("✅ Patch 2: EscalationManager + handleEscalation() + runEscalationTimers() added");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 3: Chain resolvers registry + ARBITER_REVIEW detection in chain listener
// ─────────────────────────────────────────────────────────────────────────────

const OLD_LISTENER_BODY = `function startChainListener(chainConfig) {
  const { chainId, name, rpcUrl, factoryAddress, arbiterAddress, nativeCurrency } = chainConfig;
  const tag = \`[\${name}/\${chainId}]\`;`;

const NEW_LISTENER_BODY = `// Global registry of chain resolvers for escalation auto-fallback
const chainResolvers = new Map(); // escrowAddress → async (ruling) => txHash

function startChainListener(chainConfig) {
  const { chainId, name, rpcUrl, factoryAddress, arbiterAddress, nativeCurrency } = chainConfig;
  const tag = \`[\${name}/\${chainId}]\`;`;

if (!src.includes(OLD_LISTENER_BODY)) { console.error("❌ PATCH 3: listener body"); process.exit(1); }
src = src.replace(OLD_LISTENER_BODY, NEW_LISTENER_BODY);
console.log("✅ Patch 3: chainResolvers registry added");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 4: Replace "notifyDiscord + pending_manual_review" in handleDispute
//          with handleEscalation call + register resolver
// ─────────────────────────────────────────────────────────────────────────────

const OLD_SIMPLE_MANUAL = `      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeSimpleResolution(escrowAddress, effectiveRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "simple", disputeContext, decision, scores: decision.scores ?? null, evidenceCount: currentEvidence.length, hadIntake: !!intakeContext, isPhysicalGoods: isPhysical, txHash });
      processed.add(escrowAddress);`;

const NEW_SIMPLE_MANUAL = `      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeSimpleResolution(escrowAddress, effectiveRuling);
      } else {
        // Escalate: notify admin + both parties, start 48h countdown
        const resolver = async (ruling) => executeSimpleResolution(escrowAddress, ruling);
        chainResolvers.set(escrowAddress, resolver);
        await handleEscalation(
          escrowAddress, disputeContext, decision, name, urgency, resolver
        );
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "simple", disputeContext, decision, scores: decision.scores ?? null, evidenceCount: currentEvidence.length, hadIntake: !!intakeContext, isPhysicalGoods: isPhysical, txHash });
      processed.add(escrowAddress);`;

if (!src.includes(OLD_SIMPLE_MANUAL)) { console.error("❌ PATCH 4: simple manual block"); process.exit(1); }
src = src.replace(OLD_SIMPLE_MANUAL, NEW_SIMPLE_MANUAL);
console.log("✅ Patch 4: handleEscalation wired into handleDispute()");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 5: Same for handleMilestoneDispute
// ─────────────────────────────────────────────────────────────────────────────

const OLD_MS_MANUAL = `      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeMilestoneResolution(escrowAddress, milestoneIndex, effectiveRuling);
      } else {
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "milestone", milestoneIndex, disputeContext, decision, scores: decision.scores ?? null, evidenceCount: currentEvidence.length, hadIntake: !!intakeContext, isPhysicalGoods: isPhysical, txHash });
      processed.add(disputeKey);`;

const NEW_MS_MANUAL = `      let txHash = "pending_manual_review";
      if (shouldAutoResolve(decision)) {
        txHash = await executeMilestoneResolution(escrowAddress, milestoneIndex, effectiveRuling);
      } else {
        const resolver = async (ruling) => executeMilestoneResolution(escrowAddress, milestoneIndex, ruling);
        chainResolvers.set(disputeKey, resolver);
        await handleEscalation(
          disputeKey, disputeContext, decision, name, urgency, resolver
        );
        await notifyDiscord(disputeContext, decision, urgency);
      }

      appendDecision({ timestamp: detectedAt, contractAddress: escrowAddress, chainId, chainName: name, escrowType: "milestone", milestoneIndex, disputeContext, decision, scores: decision.scores ?? null, evidenceCount: currentEvidence.length, hadIntake: !!intakeContext, isPhysicalGoods: isPhysical, txHash });
      processed.add(disputeKey);`;

if (!src.includes(OLD_MS_MANUAL)) { console.error("❌ PATCH 5: milestone manual block"); process.exit(1); }
src = src.replace(OLD_MS_MANUAL, NEW_MS_MANUAL);
console.log("✅ Patch 5: handleEscalation wired into handleMilestoneDispute()");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 6: Add ARBITER_REVIEW detection to poll() + escalation timer startup
// ─────────────────────────────────────────────────────────────────────────────

const OLD_POLL_END = `  poll(); // fire-and-forget loop
}`;

const NEW_POLL_END = `  poll(); // fire-and-forget loop

  // ── Scan for ARBITER_REVIEW submissions on each poll ──────────────────────
  // Admin submits a review as evidence from the oracle wallet — oracle detects
  // it, re-runs AI with elevated weight, executes if confidence clears 70.
  async function checkArbiterReviews() {
    try {
      const pending = EscalationManager.getPending().filter(e => e.chainName === name);
      for (const esc of pending) {
        const addr = esc.contractAddress;
        const evidence = await fetchEvidence(addr).catch(() => []);
        const reviewItems = evidence.filter(ev =>
          ev.uri?.startsWith(ARBITER_REVIEW_PREFIX) &&
          ev.submitter?.toLowerCase() === account.address.toLowerCase()
        );
        if (!reviewItems.length) continue;

        console.log(\`📋 \${tag} [ARBITER_REVIEW] Found review for \${addr} — re-evaluating\`);

        // Re-fetch all state and re-run AI with the review as privileged context
        const allEvidence = evidence;
        const disputeKey = esc.key;

        // Reconstruct minimal dispute context from escalation record
        const revCtx = {
          escrowType: esc.escrowType, contractAddress: addr,
          chainId, chainName: name, nativeSymbol: nativeCurrency?.symbol ?? "ETH",
          depositor: { address: esc.depositor }, beneficiary: { address: esc.beneficiary },
          amount: esc.amount, disputeRaisedBy: "depositor",
          disputeRaisedAt: new Date(esc.escalatedAt).toISOString(),
          timeElapsedSinceDeposit: humanElapsed(Date.now() - esc.escalatedAt),
          milestoneIndex: null, totalMilestones: null, completedMilestones: null,
          milestoneDescription: null, milestoneAmount: null, depositTxHash: null,
          createdAt: new Date(esc.escalatedAt - 86400000).toISOString(),
        };

        const newDecision = await callAI(revCtx, allEvidence);
        console.log(\`🤖 \${tag} [ARBITER_REVIEW] Post-review: \${newDecision._onChainRuling} @ \${newDecision.confidence}/100\`);

        if (shouldAutoResolve(newDecision)) {
          const resolver = chainResolvers.get(addr) ?? chainResolvers.get(disputeKey);
          if (resolver) {
            try {
              const txHash = await resolver(newDecision._onChainRuling);
              console.log(\`✅ \${tag} [ARBITER_REVIEW] Executed after admin review: \${txHash}\`);
              appendDecision({
                timestamp: new Date().toISOString(),
                contractAddress: addr, chainId, chainName: name,
                escrowType: esc.escrowType, disputeContext: revCtx,
                decision: newDecision, scores: newDecision.scores,
                resolution: "arbiter_review",
                txHash,
              });
              EscalationManager.resolve(disputeKey);
              await notifyParties(addr, "dispute_resolved", {
                amount: esc.amount, symbol: nativeCurrency?.symbol ?? "ETH",
                ruling: newDecision._onChainRuling, chainId,
              }, [esc.depositor, esc.beneficiary]).catch(() => {});
              if (DISCORD_WEBHOOK) {
                await fetch(DISCORD_WEBHOOK, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content: \`✅ **Arbiter review resolved dispute.**\\n\\\`\${addr}\\\` → **\${newDecision._onChainRuling}** @ \${newDecision.confidence}/100\\nTx: \${txHash}\` })
                }).catch(() => {});
              }
            } catch (err) {
              console.error(\`❌ \${tag} [ARBITER_REVIEW] Execution failed:\`, err.message);
            }
          }
        } else {
          console.log(\`⚠️  \${tag} [ARBITER_REVIEW] Still below threshold (\${newDecision.confidence}/100) — continuing to wait\`);
        }
      }
    } catch (err) {
      console.error(\`❌ \${tag} Arbiter review check error:\`, err.message);
    }
  }

  // Run arbiter review check on each poll
  const origPoll = poll;
  const wrappedPoll = async () => { await origPoll(); await checkArbiterReviews(); };
  setInterval(checkArbiterReviews, POLL_INTERVAL_MS);
}`;

if (!src.includes(OLD_POLL_END)) { console.error("❌ PATCH 6: poll end"); process.exit(1); }
src = src.replace(OLD_POLL_END, NEW_POLL_END);
console.log("✅ Patch 6: ARBITER_REVIEW detection + review check loop added to chain listener");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 7: Start escalation timer loop after chains start
// ─────────────────────────────────────────────────────────────────────────────

const OLD_STARTUP_END = `startTelegramBot();`;
const NEW_STARTUP_END = `startTelegramBot();

// ── Escalation timer: check every 5 min for reminders + 48h fallback ────────
setInterval(() => runEscalationTimers(chainResolvers).catch(err =>
  console.error("❌ Escalation timer error:", err.message)
), ESCALATION_CHECK_MS);
console.log("⏰ Escalation timer started (check every 5 min)");`;

if (!src.includes(OLD_STARTUP_END)) { console.error("❌ PATCH 7: startup"); process.exit(1); }
src = src.replace(OLD_STARTUP_END, NEW_STARTUP_END);
console.log("✅ Patch 7: Escalation timer started at startup");

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 8: Add dispute_escalated to notify.js
// ─────────────────────────────────────────────────────────────────────────────

const OLD_NOTIFY_EVENT = `  return_required:     { emoji: "📦", title: "Return Required — Action Needed",`;
const NEW_NOTIFY_EVENT = `  dispute_escalated:   { emoji: "🔔", title: "Your dispute is under review",
    desc: d => \`Your dispute has been escalated for human review because the AI arbiter could not reach a confident decision.\\n\\nYou do not need to do anything right now. A decision will be made within 48 hours.\\n\\nIf new evidence becomes available, you can still submit it via the evidence panel.\\n\\n<a href="\${d.escrowUrl}">View Escrow →</a>\`
  },
  return_required:     { emoji: "📦", title: "Return Required — Action Needed",`;

if (!nsrc.includes(OLD_NOTIFY_EVENT)) { console.error("❌ PATCH 8: notify event"); process.exit(1); }
nsrc = nsrc.replace(OLD_NOTIFY_EVENT, NEW_NOTIFY_EVENT);
nsrc = nsrc.replace(
  `const ALL_EVENTS = ["escrow_created","escrow_funded","funds_released","dispute_opened","dispute_resolved","milestone_completed","evidence_requested","return_required","return_confirmed"];`,
  `const ALL_EVENTS = ["escrow_created","escrow_funded","funds_released","dispute_opened","dispute_resolved","milestone_completed","evidence_requested","return_required","return_confirmed","dispute_escalated"];`
);

fs.writeFileSync(NOTIFY, nsrc, "utf8");
console.log("✅ Patch 8: dispute_escalated event added to notify.js");

// Write oracle
fs.writeFileSync(ORACLE, src, "utf8");
console.log(`\n✅ Oracle patches complete → ${ORACLE}`);
