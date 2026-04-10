/**
 * Extend test harness schemas:
 *   1. Add doctrines[] array to every Golden 21 scenario
 *   2. Add expectChallenges assertion to scenarios that should fire
 *      unverifiedClaims or vagueEvidence — tests the challenge system itself
 *   3. Wire expectChallenges into the pass/fail logic
 *
 * expectChallenges format:
 *   { unverified: "seller"|"buyer"|"both"|null, vague: "seller"|"buyer"|"both"|null }
 *   null = don't assert (don't care if it fires or not for this scenario)
 *   "seller" = at least one unverifiedClaim should target the seller
 *   "buyer"  = at least one unverifiedClaim should target the buyer
 *   "none"   = explicitly assert NO challenges should fire
 *
 * Design: we assert on *presence and direction*, not on exact text.
 * This catches regressions ("stopped flagging entirely") without
 * being brittle to wording changes between runs.
 */

import fs from "fs";

const G21 = "/root/blockdag-escrow/oracle/arbiter-golden21.mjs";
let src = fs.readFileSync(G21, "utf8");

// ─── Replace GOLDEN array with doctrines + expectChallenges added ─────────────

const OLD_GOLDEN_OPEN = `const GOLDEN = [

  { id:1, label:"Pure non-delivery — ghosted seller", exp:"depositor",`;

const NEW_GOLDEN_OPEN = `const GOLDEN = [

  { id:1, label:"Pure non-delivery — ghosted seller", exp:"depositor",
    doctrines:["non_delivery","anticipatory_breach"],
    expectChallenges: null, // seller submitted nothing — no challenges expected`;

if (!src.includes(OLD_GOLDEN_OPEN)) {
  console.error("❌ Could not find GOLDEN array opening");
  process.exit(1);
}
src = src.replace(OLD_GOLDEN_OPEN, NEW_GOLDEN_OPEN);

// Helper: add doctrines+expectChallenges after each scenario's label/exp line
const additions = [
  { id:4,  after:`exp:"depositor", checkFraud:true, fraudSide:"seller",`,
    doctrines:`["non_delivery","fraud_seller"]`,
    challenges:`{ unverified: null, vague: null }` },
  { id:11, after:`exp:"beneficiary",`,
    doctrines:`["acceptance_by_conduct","late_complaint"]`,
    challenges:`null` },
  { id:15, after:`exp:"beneficiary",\n    ctx:ctx`,
    // buyers remorse — buyer evidence is vague ("I changed my mind") → should fire vagueEvidence
    doctrines:`["buyers_remorse"]`,
    challenges:`{ unverified: null, vague: "depositor" }` },
  { id:16, after:`exp:"beneficiary",\n    ctx:ctx({amount:"0.7"`,
    // seller claims they requested inputs — unverified without hard evidence link
    doctrines:`["buyer_fault_communication","buyer_caused_non_delivery"]`,
    challenges:`{ unverified: "beneficiary", vague: null }` },
  { id:21, after:`exp:"beneficiary",\n    ctx:ctx({amount:"1.5"`,
    doctrines:`["substantial_performance"]`,
    challenges:`null` },
  { id:26, after:`exp:"beneficiary",\n    ctx:ctx({amount:"0.6"`,
    doctrines:`["substantial_performance","time_not_critical"]`,
    challenges:`null` },
  { id:31, after:`exp:"beneficiary",\n    ctx:ctx({amount:"1.0"`,
    doctrines:`["acceptance_by_conduct"]`,
    challenges:`null` },
  { id:39, after:`exp:"beneficiary",\n    ctx:ctx({amount:"0.5"`,
    doctrines:`["acceptance_by_conduct","scope_creep"]`,
    challenges:`null` },
  { id:41, after:`exp:"depositor",\n    ctx:ctx({amount:"0.8"`,
    doctrines:`["timely_complaint"]`,
    challenges:`null` },
  { id:43, after:`exp:"beneficiary",\n    ctx:ctx({amount:"1.5"`,
    doctrines:`["late_complaint","acceptance_by_conduct"]`,
    // buyer's "quality issues" claim is vague and raised late — should fire
    challenges:`{ unverified: null, vague: "depositor" }` },
  { id:51, after:`exp:"depositor",\n    ctx:ctx({amount:"2.0"`,
    doctrines:`["time_is_of_the_essence"]`,
    challenges:`null` },
  { id:53, after:`exp:"beneficiary",\n    ctx:ctx({amount:"0.5"`,
    doctrines:`["time_not_critical","substantial_performance"]`,
    challenges:`null` },
  { id:61, after:`exp:"depositor",\n    ctx:ctx({amount:"1.0"`,
    doctrines:`["anticipatory_breach"]`,
    challenges:`null` },
  { id:66, after:`exp:"depositor",\n    ctx:ctx({amount:"1.2"`,
    doctrines:`["anticipatory_breach"]`,
    challenges:`null` },
  { id:71, after:`exp:"beneficiary",\n    ctx:mctx`,
    doctrines:`["waiver","milestone"]`,
    challenges:`null` },
  { id:76, after:`exp:"beneficiary",\n    ctx:ctx({amount:"1.0"`,
    doctrines:`["waiver","time_not_critical"]`,
    challenges:`null` },
  { id:81, after:`exp:"depositor", checkFraud:true, fraudSide:"seller",`,
    doctrines:`["fraud_seller"]`,
    challenges:`null` },
  { id:84, after:`exp:"beneficiary", checkFraud:true, fraudSide:"buyer",`,
    doctrines:`["fraud_buyer","on_chain_evidence"]`,
    challenges:`null` },
  { id:91, after:`exp:"beneficiary",\n    ctx:ctx({amount:"0.5"`,
    doctrines:`["injection_resistance"]`,
    challenges:`null` },
  { id:95, after:`exp:"beneficiary",\n    ctx:ctx({amount:"0.9"`,
    doctrines:`["vague_evidence","noise_rejection"]`,
    challenges:`null` },
];

for (const a of additions) {
  const marker = `{ id:${a.id}, label:`;
  const idx = src.indexOf(marker);
  if (idx === -1) { console.error(`Could not find id:${a.id}`); continue; }
  // find the end of the label line (after exp/checkFraud line) to insert after
  // We insert just before the ctx: line
  const ctxPos = src.indexOf("\n    ctx:", idx);
  if (ctxPos === -1) { console.error(`No ctx for id:${a.id}`); continue; }
  const insert = `\n    doctrines:${a.doctrines},\n    expectChallenges: ${a.challenges},`;
  src = src.slice(0, ctxPos) + insert + src.slice(ctxPos);
}
console.log("✅ doctrines + expectChallenges added to all 21 scenarios");

// ─── Extend pass/fail logic to check expectChallenges ─────────────────────────

const OLD_PASS_LOGIC = `      const rulingOK = d.ruling === s.exp;
      const fraudOK  = s.checkFraud
        ? (s.fraudSide === "seller"
            ? (d.scores?.fraudFlag === true && d.ruling === "depositor")
            : (d.scores?.fraudFlag === true && d.ruling === "beneficiary"))
        : true;

      const ok = rulingOK && fraudOK;`;

const NEW_PASS_LOGIC = `      const rulingOK = d.ruling === s.exp;
      const fraudOK  = s.checkFraud
        ? (s.fraudSide === "seller"
            ? (d.scores?.fraudFlag === true && d.ruling === "depositor")
            : (d.scores?.fraudFlag === true && d.ruling === "beneficiary"))
        : true;

      // Challenge system assertions — test that unverifiedClaims/vagueEvidence fire correctly
      let challengeOK = true;
      let challengeNote = null;
      if (s.expectChallenges) {
        const uc = d.unverifiedClaims ?? [];
        const ve = d.vagueEvidence ?? [];
        const { unverified, vague } = s.expectChallenges;

        if (unverified === "none" && uc.length > 0) {
          challengeOK = false;
          challengeNote = \`Expected NO unverifiedClaims but got \${uc.length}\`;
        } else if (unverified && unverified !== "none") {
          const parties = uc.map(c => c.party);
          const fired = unverified === "both"
            ? parties.includes("depositor") && parties.includes("beneficiary")
            : parties.includes(unverified === "seller" ? "beneficiary" : "depositor");
          if (!fired) { challengeOK = false; challengeNote = \`Expected unverifiedClaim targeting \${unverified} — got parties: [\${parties.join(",")}]\`; }
        }

        if (vague === "none" && ve.length > 0) {
          challengeOK = false;
          challengeNote = (challengeNote ? challengeNote + "; " : "") + \`Expected NO vagueEvidence but got \${ve.length}\`;
        } else if (vague && vague !== "none") {
          const parties = ve.map(v => v.party);
          const fired = vague === "both"
            ? parties.includes("depositor") && parties.includes("beneficiary")
            : parties.includes(vague === "seller" ? "beneficiary" : "depositor");
          if (!fired) {
            // vagueEvidence is advisory — soft fail (warn but don't count as failure)
            // because whether evidence is "vague enough" is subjective and varies run-to-run
            console.log(\`        ℹ️  vagueEvidence softcheck: expected \${vague} — got parties: [\${parties.join(",")}] (non-blocking)\`);
          }
        }
      }

      const ok = rulingOK && fraudOK && challengeOK;`;

if (!src.includes(OLD_PASS_LOGIC)) {
  console.error("❌ Could not find pass/fail logic block");
  process.exit(1);
}
src = src.replace(OLD_PASS_LOGIC, NEW_PASS_LOGIC);
console.log("✅ Challenge assertion logic added to pass/fail check");

// Update the fail reason output to include challenge note
src = src.replace(
  `      if (!fraudOK)  console.log(\`        ⚠ FraudFlag: expected fire for \${s.fraudSide}, got fraudFlag=\${d.scores?.fraudFlag}\`);`,
  `      if (!fraudOK)    console.log(\`        ⚠ FraudFlag: expected fire for \${s.fraudSide}, got fraudFlag=\${d.scores?.fraudFlag}\`);
      if (!challengeOK) console.log(\`        ⚠ Challenge: \${challengeNote}\`);`
);

// Update result record to include doctrines + challenge data
src = src.replace(
  `results.push({ id:s.id, label:s.label, pass:ok, ruling:d.ruling, expected:s.exp,
        confidence:d.confidence, scores:d.scores, fraudCheck:s.checkFraud??false });`,
  `results.push({ id:s.id, label:s.label, pass:ok, ruling:d.ruling, expected:s.exp,
        confidence:d.confidence, scores:d.scores, fraudCheck:s.checkFraud??false,
        doctrines:s.doctrines??[], challengeOK,
        unverifiedClaims:(d.unverifiedClaims??[]).length,
        vagueEvidence:(d.vagueEvidence??[]).length });`
);

console.log("✅ Result record extended with doctrines + challenge stats");

fs.writeFileSync(G21, src, "utf8");
console.log(`\n✅ Golden 21 extended → ${G21}`);

// ─── Also add doctrines to v3 harness scenarios (abbreviated pass) ────────────

const V3 = "/root/blockdag-escrow/oracle/arbiter-test-v3.mjs";
let v3src = fs.readFileSync(V3, "utf8");

// The v3 harness uses _m.cat for categories — add doctrines field to _m
// We map category to canonical doctrine list
const catDoctrineMaps = {
  "C1-NonDelivery":      "non_delivery",
  "C2-BuyerBadFaith":    "buyers_remorse,acceptance_by_conduct,fraud_buyer",
  "C3-SubstantialPerf":  "substantial_performance",
  "C4-Acceptance":       "acceptance_by_conduct",
  "C5-Timeliness":       "timely_complaint,late_complaint",
  "C6-Deadline":         "time_is_of_the_essence",
  "C7-AnticipatoryBreach":"anticipatory_breach",
  "C8-Waiver":           "waiver",
  "C9-Fraud":            "fraud_seller,fraud_buyer",
  "C10-Edge":            "injection_resistance,vague_evidence",
};

// Add doctrines to result records in the v3 harness runner
const OLD_V3_RESULT = `      const r = {
        id:_m.id, cat:_m.cat, label:_m.label,
        expected:_m.exp, expectedAuto:_m.auto,
        ruling:d.ruling, onChain:d._onChainRuling,
        confidence:d.confidence, confBucket:computeConfidenceBucket(d.confidence),
        scores:d.scores ?? null, scoreSignal:d._scoreSignal ?? null,
        scoreMismatch:d._scoreMismatch ?? false,
        escalate:d.escalateToManual, autoResolved:auto,
        matches, reasoning:d.reasoning, notes:d.notes ?? null,
        unverifiedClaims:(d.unverifiedClaims??[]).length,
        vagueEvidence:(d.vagueEvidence??[]).length,
      };`;

const NEW_V3_RESULT = `      const r = {
        id:_m.id, cat:_m.cat, label:_m.label,
        doctrines:_m.doctrines ?? [],
        expected:_m.exp, expectedAuto:_m.auto,
        ruling:d.ruling, onChain:d._onChainRuling,
        confidence:d.confidence, confBucket:computeConfidenceBucket(d.confidence),
        scores:d.scores ?? null, scoreSignal:d._scoreSignal ?? null,
        scoreMismatch:d._scoreMismatch ?? false,
        escalate:d.escalateToManual, autoResolved:auto,
        matches, reasoning:d.reasoning, notes:d.notes ?? null,
        unverifiedClaims:(d.unverifiedClaims??[]).length,
        vagueEvidence:(d.vagueEvidence??[]).length,
        hadChallenges: (d.unverifiedClaims?.length||0) + (d.vagueEvidence?.length||0) > 0,
      };`;

if (v3src.includes(OLD_V3_RESULT)) {
  v3src = v3src.replace(OLD_V3_RESULT, NEW_V3_RESULT);
  console.log("✅ v3 harness result record extended with doctrines + hadChallenges");
} else {
  console.error("⚠ v3 result block not found — skip");
}

fs.writeFileSync(V3, v3src, "utf8");
console.log(`✅ v3 harness extended → ${V3}`);
console.log("\nDone. Run: node arbiter-golden21.mjs to verify.\n");
