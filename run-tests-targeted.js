// ============================================
// IDEALOOP CORE — TARGETED FIX VERIFICATION
// ============================================
// 4 ideas × 2 pipelines = 8 runs
// Tests: sparse input fix, fake specificity fix, tone fix, regression check
//
// Usage: node run-tests-targeted.js
// Server must be running at localhost:3000

const BASE_URL = "http://localhost:3000";

const TESTS = [
  { id: 20, name: "Near-Empty Prompt (SPARSE INPUT FIX)",
    fix: "SPARSE INPUT — confidence must be LOW, explanations must name missing info, scores should drop from 3.9/4.6",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Student" },
    idea: "ai app for pets" },
  { id: 32, name: "Fake Specificity (USER CLAIM FIX)",
    fix: "USER CLAIMS — made-up numbers (23%, 200k TAM, $149/mo) must NOT drive scores up. Overall should drop from 5.6/5.1 toward 3.5-4.5",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "MBA student" },
    idea: "AI-powered micro-SaaS for dental practices that predicts patient no-show probability using historical appointment data, weather patterns, day-of-week analysis, and patient communication sentiment. Reduces no-show rate from industry average of 23% to under 8%. $149/month per practice. TAM: 200,000 dental practices in the US alone. Integration with Dentrix and Open Dental practice management systems. 6-month payback period for the average practice." },
  { id: 4, name: "Restaurant Menu Optimizer (TONE FIX)",
    fix: "TONE — scores should stay ~5.0-6.0. Summary must NOT start with 'This addresses a real pain point but...' Check for score-matched tone.",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Restaurant owner" },
    idea: "ok so i own two restaurants and the thing that kills me is figuring out what to put on the menu and what to take off. i spend hours looking at what sold, what didn't, food costs change every week, and i just guess. i want an AI thing that looks at my sales data and food costs and tells me what dishes are actually making money and which ones i should cut or reprice. also maybe it could suggest new dishes based on what's trending in my area. i know other restaurant owners have this same problem. everyone's just guessing. it's not like we have data scientists on staff lol. maybe it could also help with inventory, like knowing how much to order based on what we'll probably sell next week. sorry if this is messy i'm just typing what's in my head" },
  { id: 15, name: "Customs Doc Validator (REGRESSION CHECK)",
    fix: "REGRESSION — must NOT drop significantly from 5.5/4.8. This is 27 words, ABOVE the 20-word threshold. Sparse input rule should NOT apply.",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Logistics coordinator" },
    idea: "ai for customs broker to check document before submit. many time rejected because wrong code or missing paper, cost company lot money each time. need tool check everything automatic before send to government" },
];

async function runEval(idea, profile, pipeline) {
  const ep = pipeline === "PRO" ? "/api/analyze-pro" : "/api/analyze";
  const res = await fetch(BASE_URL + ep, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, profile }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const text = await res.text();
  let result = null, error = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      try {
        const d = JSON.parse(line.slice(6));
        if (d.step === "complete" && d.data) result = d.data;
        else if (d.step === "error") error = d.message;
      } catch (e) {}
    }
  }
  if (error) throw new Error(error);
  if (!result) throw new Error("No result");
  return result;
}

async function main() {
  const total = TESTS.length * 2;
  let done = 0;

  console.log("============================================");
  console.log("IDEALOOP CORE — TARGETED FIX VERIFICATION");
  console.log("4 ideas × 2 pipelines = 8 runs");
  console.log("Estimated: 15-20 minutes");
  console.log("============================================\n");

  for (const test of TESTS) {
    for (const pipeline of ["FREE", "PRO"]) {
      done++;
      console.log(`\n${"=".repeat(80)}`);
      console.log(`[${done}/${total}] T${test.id} — ${test.name} (${pipeline})`);
      console.log(`FIX BEING TESTED: ${test.fix}`);
      console.log("=".repeat(80));

      const t0 = Date.now();
      try {
        const result = await runEval(test.idea, test.profile, pipeline);
        const ev = result.evaluation;
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

        if (!ev) {
          console.log(`  ❌ NO SCORES (${elapsed}s)`);
          continue;
        }

        const md = ev.market_demand?.score;
        const mo = ev.monetization?.score;
        const or_ = ev.originality?.score;
        const tc = ev.technical_complexity?.score;
        const overall = ev.overall_score;
        const conf = ev.confidence_level?.level;
        const confReason = ev.confidence_level?.reason || "";

        console.log(`\n  SCORES: MD:${md}  MO:${mo}  OR:${or_}  TC:${tc}  Overall:${overall}`);
        console.log(`  CONFIDENCE: ${conf} — ${confReason}`);

        // Sparse input checks (T20)
        if (test.id === 20) {
          console.log(`\n  --- SPARSE INPUT CHECKS ---`);
          console.log(`  Confidence is LOW? ${conf === "LOW" ? "✅ YES" : "❌ NO — was " + conf}`);
          console.log(`  Overall ≤ 4.0? ${overall <= 4.0 ? "✅ YES (" + overall + ")" : "⚠️ NO (" + overall + ")"}`);

          const mdExp = ev.market_demand?.explanation || "";
          const moExp = ev.monetization?.explanation || "";
          const orExp = ev.originality?.explanation || "";
          const sparseWords = ["not specify", "does not specify", "doesn't specify", "not specified", "limited detail", "sparse", "unclear", "not enough", "lacks", "doesn't identify", "does not identify", "doesn't mention", "does not mention", "minimal detail", "without specif", "not described", "unspecified", "vague", "insufficient detail", "missing"];
          const mdAck = sparseWords.some(w => mdExp.toLowerCase().includes(w));
          const moAck = sparseWords.some(w => moExp.toLowerCase().includes(w));
          const orAck = sparseWords.some(w => orExp.toLowerCase().includes(w));
          console.log(`  MD explanation acknowledges sparse input? ${mdAck ? "✅ YES" : "❌ NO"}`);
          console.log(`  MO explanation acknowledges sparse input? ${moAck ? "✅ YES" : "❌ NO"}`);
          console.log(`  OR explanation acknowledges sparse input? ${orAck ? "✅ YES" : "❌ NO"}`);
        }

        // Fake specificity checks (T32)
        if (test.id === 32) {
          console.log(`\n  --- FAKE SPECIFICITY CHECKS ---`);
          console.log(`  Overall ≤ 4.5? ${overall <= 4.5 ? "✅ YES (" + overall + ")" : "❌ NO (" + overall + ") — user-stated numbers may still be inflating"}`);
          console.log(`  MD ≤ 5.5? ${md <= 5.5 ? "✅ YES (" + md + ")" : "❌ NO (" + md + ")"}`);
          console.log(`  MO ≤ 5.0? ${mo <= 5.0 ? "✅ YES (" + mo + ")" : "❌ NO (" + mo + ")"}`);

          const mdExp = ev.market_demand?.explanation || "";
          const moExp = ev.monetization?.explanation || "";
          const claimWords = ["user claim", "user-claim", "claimed", "user states", "user asserts", "unverified", "not verified", "user-stated"];
          const mdClaim = claimWords.some(w => mdExp.toLowerCase().includes(w));
          const moClaim = claimWords.some(w => moExp.toLowerCase().includes(w));
          console.log(`  MD explanation flags user claims? ${mdClaim ? "✅ YES" : "⚠️ NO — check if 23%/200k TAM treated as fact"}`);
          console.log(`  MO explanation flags user claims? ${moClaim ? "✅ YES" : "⚠️ NO — check if $149/mo treated as evidence"}`);
        }

        // Tone checks (T4)
        if (test.id === 4) {
          console.log(`\n  --- TONE CHECKS ---`);
          console.log(`  Overall in range 5.0-6.0? ${overall >= 5.0 && overall <= 6.0 ? "✅ YES (" + overall + ")" : "⚠️ NO (" + overall + ")"}`);

          const summary = ev.summary || "";
          const startsWithPainBut = summary.toLowerCase().startsWith("this addresses a real pain") || summary.toLowerCase().startsWith("this idea addresses a real pain");
          console.log(`  Summary starts with 'addresses a real pain point but'? ${startsWithPainBut ? "❌ YES — tone fix not working" : "✅ NO — good"}`);

          const howeverCount = (summary.match(/however/gi) || []).length;
          console.log(`  'However' count in summary: ${howeverCount} ${howeverCount >= 3 ? "❌ Too many" : "✅ OK"}`);

          const genericEndings = ["consider focusing", "success would require", "exceptional execution", "specific niche"];
          const hasGeneric = genericEndings.some(g => summary.toLowerCase().includes(g));
          console.log(`  Generic advice in summary? ${hasGeneric ? "❌ YES" : "✅ NO"}`);

          console.log(`\n  FULL SUMMARY:\n  "${summary}"`);
        }

        // Regression checks (T15)
        if (test.id === 15) {
          console.log(`\n  --- REGRESSION CHECKS ---`);
          const prev = pipeline === "FREE" ? 5.5 : 4.8;
          const diff = (overall - prev).toFixed(1);
          const ok = overall >= prev - 0.7;
          console.log(`  Previous score (${pipeline}): ${prev}`);
          console.log(`  Current score: ${overall} (Δ: ${diff})`);
          console.log(`  Within tolerance (±0.7)? ${ok ? "✅ YES" : "❌ NO — sparse input rule may be too aggressive"}`);

          // Check word count is above threshold
          const words = test.idea.trim().split(/\s+/).length;
          console.log(`  Word count: ${words} (threshold: 20) — sparse rule should ${words >= 20 ? "NOT apply ✅" : "APPLY ⚠️"}`);
        }

        // Print explanations for all tests
        console.log(`\n  --- EXPLANATIONS ---`);
        console.log(`  MD (${md}): ${ev.market_demand?.explanation || "N/A"}`);
        console.log(`  MO (${mo}): ${ev.monetization?.explanation || "N/A"}`);
        console.log(`  OR (${or_}): ${ev.originality?.explanation || "N/A"}`);
        console.log(`  TC (${tc}): ${ev.technical_complexity?.explanation || "N/A"}`);
        console.log(`  RISKS: ${(ev.failure_risks || []).join(" | ")}`);
        if (test.id !== 4) {
          console.log(`  SUMMARY: ${ev.summary || "N/A"}`);
        }

      } catch (e) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  ❌ FAILED (${elapsed}s) — ${e.message}`);
      }
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("VERIFICATION COMPLETE");
  console.log("=".repeat(80));
  console.log(`
CHECK THESE RESULTS:

T20 (Sparse Input):
  □ Confidence LOW on both pipelines?
  □ Explanations acknowledge missing info?
  □ Scores dropped from previous 3.9/4.6?

T32 (Fake Specificity):
  □ Overall dropped from previous 5.6/5.1?
  □ User-stated numbers flagged as claims?
  □ Scores not driven by made-up TAM/pricing?

T4 (Tone):
  □ Scores stayed in 5.0-6.0 range?
  □ Summary does NOT start with "addresses a real pain point but"?
  □ Summary tone matches score band?

T15 (Regression):
  □ Scores stayed within ±0.7 of previous 5.5/4.8?
  □ Sparse input rule did NOT activate (27 words > 20 threshold)?

If all pass → fixes are working, scoring is preserved.
If T15 drops → sparse rule threshold may need adjustment.
If T32 didn't drop → user_claim tag not being applied in Stage 2a.
If T20 still MEDIUM confidence → sparse rule not being read by Sonnet.
`);
}

main().catch(err => { console.error("\nFATAL:", err.message); process.exit(1); });
