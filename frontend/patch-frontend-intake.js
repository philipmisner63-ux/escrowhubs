/**
 * Patches the escrow detail page to add the DisputeIntakePanel.
 *
 * Option B: after a dispute is raised, both parties see a guided
 * 6-question questionnaire as the FIRST step in the evidence panel.
 * Their answers are serialised as INTAKE_JSON:... and submitted
 * on-chain as their evidence. The oracle detects this prefix and
 * builds a normalised parallel context before AI evaluation.
 *
 * The freeform evidence textarea stays — it becomes a second step
 * ("Additional evidence") once the intake is complete.
 */

import fs from "fs";

const PAGE = "/root/blockdag-escrow/frontend/src/app/[locale]/escrow/[id]/page.tsx";
let src = fs.readFileSync(PAGE, "utf8");

// ─── PATCH 1: Replace EvidencePanel with full intake + freeform orchestration ─

const OLD_EVIDENCE_PANEL = `function EvidencePanel({ escrowAddress }: { escrowAddress: Address }) {
  const [evidenceText, setEvidenceText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast, removeToast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const arbiterAddress = getArbiterAddress(chainId);

  const isAIArbiter = !!arbiterAddress;

  async function submitEvidence() {
    if (!evidenceText.trim()) return;
    setSubmitting(true);
    const pid = addToast({ type: "pending", message: "Submitting evidence…" });
    try {
      const hash = await writeContractAsync({
        address: arbiterAddress,
        abi: AI_ARBITER_ABI,
        functionName: "submitEvidence",
        args: [escrowAddress, evidenceText.trim()],
      });
      removeToast(pid);
      addToast({ type: "success", message: "Evidence submitted on-chain", txHash: hash });
      setEvidenceText("");
    } catch (e: unknown) {
      removeToast(pid);
      addToast({ type: "error", message: e instanceof Error ? e.message.slice(0, 120) : "Failed to submit" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAIArbiter) return null;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🤖</span>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-violet-300">AI Arbiter — Submit Evidence</h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        The AI oracle is monitoring this dispute. Submit your evidence below — it will be stored on-chain
        and reviewed by the AI arbiter. Be clear and factual. Include links, transaction hashes, or
        screenshots (as IPFS URIs) if available.
      </p>
      <textarea
        className="w-full rounded-xl bg-white/5 border border-violet-400/20 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 transition-colors resize-none"
        rows={4}
        placeholder="Describe your case… e.g. 'Work was not delivered by the agreed deadline. See transaction 0x... and messages at ipfs://...'"
        value={evidenceText}
        onChange={e => setEvidenceText(e.target.value)}
      />
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-slate-500">Evidence is permanently stored on-chain</p>
        <GlowButton
          variant="secondary"
          loading={submitting}
          onClick={submitEvidence}
          disabled={!evidenceText.trim()}
          className="px-6 border-violet-400/30 text-violet-300 hover:border-violet-400/60"
        >
          Submit Evidence
        </GlowButton>
      </div>
    </GlassCard>
  );
}`;

const NEW_EVIDENCE_PANEL = `// ─── Intake form state ────────────────────────────────────────────────────────

type IntakeForm = {
  agreementSummary: string;
  deadlineImportant: boolean;
  deadlineReason: string;
  actionsTimeline: string;
  counterpartyTimeline: string;
  deliveryClaim: "none" | "partial" | "complete" | "";
  buyerUseClaim?: "yes" | "no" | "unsure" | "";  // seller only
  evidence: string;
  firstComplaintTime: string;
  complaintEvidence: string;
  requestedOutcome: "refund" | "release" | "other" | "";
  requestedOutcomeReason: string;
};

const EMPTY_INTAKE: IntakeForm = {
  agreementSummary: "", deadlineImportant: false, deadlineReason: "",
  actionsTimeline: "", counterpartyTimeline: "", deliveryClaim: "",
  buyerUseClaim: "", evidence: "", firstComplaintTime: "",
  complaintEvidence: "", requestedOutcome: "", requestedOutcomeReason: "",
};

function EvidencePanel({ escrowAddress, isBuyer }: { escrowAddress: Address; isBuyer: boolean }) {
  const [step, setStep] = useState<"intake" | "freeform" | "done">("intake");
  const [form, setForm] = useState<IntakeForm>(EMPTY_INTAKE);
  const [freeformText, setFreeformText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast, removeToast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const arbiterAddress = getArbiterAddress(chainId);
  if (!arbiterAddress) return null;

  const role = isBuyer ? "buyer" : "seller";
  const set = (k: keyof IntakeForm, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  // Validate required intake fields
  const intakeValid =
    form.agreementSummary.trim().length > 20 &&
    form.actionsTimeline.trim().length > 10 &&
    form.counterpartyTimeline.trim().length > 10 &&
    form.deliveryClaim !== "" &&
    form.requestedOutcome !== "" &&
    form.requestedOutcomeReason.trim().length > 10;

  async function submitIntake() {
    if (!intakeValid) return;
    setSubmitting(true);
    const pid = addToast({ type: "pending", message: "Submitting your statement…" });
    try {
      const payload = {
        role,
        agreementSummary: form.agreementSummary.trim(),
        deadlineImportant: form.deadlineImportant,
        deadlineReason: form.deadlineReason.trim(),
        actionsTimeline: form.actionsTimeline.trim(),
        counterpartyTimeline: form.counterpartyTimeline.trim(),
        deliveryClaim: form.deliveryClaim,
        ...(role === "seller" ? { buyerUseClaim: form.buyerUseClaim } : {}),
        evidence: form.evidence.trim().split(/\\n+/).filter(Boolean),
        firstComplaintTime: form.firstComplaintTime.trim(),
        complaintEvidence: form.complaintEvidence.trim().split(/\\n+/).filter(Boolean),
        requestedOutcome: form.requestedOutcome,
        requestedOutcomeReason: form.requestedOutcomeReason.trim(),
      };
      const uri = "INTAKE_JSON:" + JSON.stringify(payload);
      const hash = await writeContractAsync({
        address: arbiterAddress,
        abi: AI_ARBITER_ABI,
        functionName: "submitEvidence",
        args: [escrowAddress, uri],
      });
      removeToast(pid);
      addToast({ type: "success", message: "Statement submitted on-chain ✓", txHash: hash });
      setStep("freeform");
    } catch (e: unknown) {
      removeToast(pid);
      addToast({ type: "error", message: e instanceof Error ? e.message.slice(0, 120) : "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFreeform() {
    if (!freeformText.trim()) { setStep("done"); return; }
    setSubmitting(true);
    const pid = addToast({ type: "pending", message: "Submitting additional evidence…" });
    try {
      const hash = await writeContractAsync({
        address: arbiterAddress,
        abi: AI_ARBITER_ABI,
        functionName: "submitEvidence",
        args: [escrowAddress, freeformText.trim()],
      });
      removeToast(pid);
      addToast({ type: "success", message: "Evidence submitted on-chain ✓", txHash: hash });
      setStep("done");
    } catch (e: unknown) {
      removeToast(pid);
      addToast({ type: "error", message: e instanceof Error ? e.message.slice(0, 120) : "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full rounded-xl bg-white/5 border border-violet-400/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 transition-colors";
  const labelCls = "block text-xs font-medium text-violet-300 mb-1.5";
  const hintCls  = "text-xs text-slate-500 mt-1";
  const selectCls = inputCls + " cursor-pointer bg-[#1a1a2e]";

  // ── Done state ──────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 text-emerald-400">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-sm">Your submission is complete</p>
            <p className="text-xs text-slate-400 mt-0.5">The AI arbiter has your statement and will evaluate the dispute shortly. You may still submit additional evidence above if new information becomes available.</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  // ── Freeform step ───────────────────────────────────────────────────────────
  if (step === "freeform") {
    return (
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📎</span>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-violet-300">Additional Evidence (optional)</h3>
        </div>
        <p className="text-xs text-slate-400">
          Your main statement has been submitted. If you have supporting links, file hashes, IPFS URIs, or screenshots, add them here. One item per line.
        </p>
        <textarea
          className={inputCls + " resize-none"}
          rows={4}
          placeholder={"e.g.\\nhttps://github.com/project/repo/commit/abc123\\nipfs://QmDeliveryProof...\\nhttps://screenshot-url.com/img.png"}
          value={freeformText}
          onChange={e => setFreeformText(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">Optional — skip if you have nothing to add</p>
          <div className="flex gap-2">
            <GlowButton variant="secondary" onClick={() => setStep("done")}
              className="px-4 border-slate-400/20 text-slate-400 text-xs">
              Skip
            </GlowButton>
            <GlowButton variant="secondary" loading={submitting} onClick={submitFreeform}
              disabled={!freeformText.trim()}
              className="px-6 border-violet-400/30 text-violet-300">
              Submit Evidence
            </GlowButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  // ── Intake questionnaire ────────────────────────────────────────────────────
  return (
    <GlassCard className="p-5 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-violet-300">AI Arbiter — Your Statement</h3>
          <p className="text-xs text-slate-400 mt-0.5">Answer these questions so the AI arbiter can evaluate your case fairly. Take your time — there are no wrong answers, just be honest.</p>
        </div>
      </div>

      {/* Q1 — Agreement */}
      <div>
        <label className={labelCls}>1. What did you and the {isBuyer ? "seller" : "buyer"} agree to? *</label>
        <p className={hintCls + " mb-2"}>In your own words — what was supposed to be delivered, for how much, and by when?</p>
        <textarea className={inputCls + " resize-none"} rows={3}
          placeholder="e.g. We agreed on a full website redesign — 8 pages, mobile-friendly, delivered by March 15th for 0.5 ETH."
          value={form.agreementSummary} onChange={e => set("agreementSummary", e.target.value)} />
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={form.deadlineImportant}
              onChange={e => set("deadlineImportant", e.target.checked)}
              className="rounded accent-violet-500" />
            Was the deadline especially important? (e.g. you had a launch or event depending on it)
          </label>
        </div>
        {form.deadlineImportant && (
          <input className={inputCls + " mt-2 text-sm"} type="text"
            placeholder="Why was the deadline critical? e.g. We had a conference on March 20th."
            value={form.deadlineReason} onChange={e => set("deadlineReason", e.target.value)} />
        )}
      </div>

      {/* Q2 — Your actions */}
      <div>
        <label className={labelCls}>2. What did you do in this deal? *</label>
        <p className={hintCls + " mb-2"}>
          {isBuyer
            ? "When did you pay? Did you give the seller everything they needed (files, access, feedback)?"
            : "What did you deliver, and when? Describe what you actually did step by step."}
        </p>
        <textarea className={inputCls + " resize-none"} rows={3}
          placeholder={isBuyer
            ? "e.g. I funded the escrow on March 1st. I sent the brand guide on March 3rd and answered all their questions."
            : "e.g. I started work on March 2nd. Delivered a draft on March 10th, final version on March 14th via Google Drive link."}
          value={form.actionsTimeline} onChange={e => set("actionsTimeline", e.target.value)} />
      </div>

      {/* Q3 — Other party's actions */}
      <div>
        <label className={labelCls}>3. What did the {isBuyer ? "seller" : "buyer"} do — or fail to do? *</label>
        <p className={hintCls + " mb-2"}>Be specific about what happened. When did things go wrong?</p>
        <textarea className={inputCls + " resize-none"} rows={3}
          placeholder={isBuyer
            ? "e.g. They delivered something on March 16th but it was only 3 pages, not 8. They stopped responding on March 18th."
            : "e.g. The buyer never sent the brand guide I asked for on March 4th and March 8th. They approved the draft on March 11th then changed requirements on March 15th."}
          value={form.counterpartyTimeline} onChange={e => set("counterpartyTimeline", e.target.value)} />
      </div>

      {/* Q3b — Delivery claim */}
      <div>
        <label className={labelCls}>
          {isBuyer ? "Did the seller deliver anything?" : "How much of the agreed work did you deliver?"} *
        </label>
        <select className={selectCls} value={form.deliveryClaim}
          onChange={e => set("deliveryClaim", e.target.value as IntakeForm["deliveryClaim"])}>
          <option value="">— Select —</option>
          <option value="none">Nothing was delivered</option>
          <option value="partial">Some of it was delivered, but not everything</option>
          <option value="complete">Everything agreed was delivered</option>
        </select>

        {/* Seller only: did buyer use the work? */}
        {!isBuyer && (
          <div className="mt-3">
            <label className={labelCls}>Did the buyer use or benefit from what you delivered?</label>
            <select className={selectCls} value={form.buyerUseClaim ?? ""}
              onChange={e => set("buyerUseClaim", e.target.value)}>
              <option value="">— Select —</option>
              <option value="yes">Yes — they used it, deployed it, or benefited from it</option>
              <option value="no">No — as far as I know they haven&apos;t used it</option>
              <option value="unsure">I&apos;m not sure</option>
            </select>
          </div>
        )}
      </div>

      {/* Q4 — Evidence */}
      <div>
        <label className={labelCls}>4. What evidence can you share?</label>
        <p className={hintCls + " mb-2"}>Links, file hashes, screenshots hosted somewhere, GitHub repos, live URLs — one per line. Don&apos;t worry if you don&apos;t have much.</p>
        <textarea className={inputCls + " resize-none"} rows={3}
          placeholder={"e.g.\\nhttps://github.com/myproject/repo\\nhttps://imgur.com/screenshot.png\\nipfs://QmDeliveryProof..."}
          value={form.evidence} onChange={e => set("evidence", e.target.value)} />
      </div>

      {/* Q5 — Complaint timing */}
      <div>
        <label className={labelCls}>5. When did {isBuyer ? "you first raise a problem with the seller" : "the buyer first complain, if at all"}?</label>
        <p className={hintCls + " mb-2"}>
          {isBuyer
            ? "If you had concerns, when did you first tell the seller? (approximate date is fine)"
            : "If the buyer complained, when was that? If they never complained, say so."}
        </p>
        <input className={inputCls} type="text"
          placeholder={isBuyer ? "e.g. March 16th — I messaged them saying the pages were missing." : "e.g. They never complained until after I requested payment on March 20th."}
          value={form.firstComplaintTime} onChange={e => set("firstComplaintTime", e.target.value)} />
        <input className={inputCls + " mt-2"} type="text"
          placeholder="Any proof of that conversation? (link or description)"
          value={form.complaintEvidence} onChange={e => set("complaintEvidence", e.target.value)} />
      </div>

      {/* Q6 — Requested outcome */}
      <div>
        <label className={labelCls}>6. What outcome do you believe is fair? *</label>
        <select className={selectCls} value={form.requestedOutcome}
          onChange={e => set("requestedOutcome", e.target.value as IntakeForm["requestedOutcome"])}>
          <option value="">— Select —</option>
          <option value="refund">Full refund to the buyer</option>
          <option value="release">Full payment released to the seller</option>
          <option value="other">Something else (explain below)</option>
        </select>
        <textarea className={inputCls + " resize-none mt-2"} rows={2}
          placeholder="Explain why you think this is fair…"
          value={form.requestedOutcomeReason} onChange={e => set("requestedOutcomeReason", e.target.value)} />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <p className="text-xs text-slate-500">* Required fields. Your answers are stored permanently on-chain.</p>
        <GlowButton variant="secondary" loading={submitting} onClick={submitIntake}
          disabled={!intakeValid}
          className="px-8 border-violet-400/30 text-violet-300 hover:border-violet-400/60">
          Submit Statement →
        </GlowButton>
      </div>
    </GlassCard>
  );
}`;

if (!src.includes(OLD_EVIDENCE_PANEL)) {
  console.error("❌ PATCH 1: Could not find EvidencePanel function");
  process.exit(1);
}
src = src.replace(OLD_EVIDENCE_PANEL, NEW_EVIDENCE_PANEL);
console.log("✅ Patch 1: DisputeIntakePanel + freeform flow replaced EvidencePanel");

// ─── PATCH 2: Pass isBuyer prop to EvidencePanel call site ────────────────────

// Find the call site — need to also pass wallet and depositor so we can compute isBuyer
const OLD_CALLSITE = `        <EvidencePanel escrowAddress={address} />`;

// The escrow detail page already has `wallet` and the depositor address available
// We need to check the context to find what variables are in scope at that point
const NEW_CALLSITE = `        <EvidencePanel escrowAddress={address} isBuyer={!!wallet && simpleEscrow?.depositor?.toLowerCase() === wallet.toLowerCase()} />`;

if (!src.includes(OLD_CALLSITE)) {
  console.error("❌ PATCH 2a: Could not find EvidencePanel call site with exact text");
  // Try to find it with a search
  const idx = src.indexOf("EvidencePanel escrowAddress={address}");
  console.error(`  Found at index: ${idx}`);
  console.error(`  Context: ${src.slice(Math.max(0,idx-50), idx+80)}`);
  process.exit(1);
}
src = src.replace(OLD_CALLSITE, NEW_CALLSITE);
console.log("✅ Patch 2: isBuyer prop passed to EvidencePanel");

// ─── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(PAGE, src, "utf8");
console.log(`\n✅ Frontend patched → ${PAGE}`);
console.log("   Run: cd frontend && pnpm build to verify TypeScript\n");
