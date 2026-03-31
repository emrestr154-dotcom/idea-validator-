// ============================================
// IDEALOOP CORE — COMPREHENSIVE TEST RUNNER
// ============================================
// Runs 17 test ideas through FREE and PRO pipelines
// Captures EVERYTHING: scores, explanations, competitors, flags, evidence packets, timing
// Outputs comprehensive Excel workbook with 9 analysis sheets
//
// V4S9: Added evidence packet capture for PRO pipeline (Stage 2a output)
// New sheet: "Evidence Packets" — shows per-metric evidence extraction for debugging
//
// Usage: node run-tests.js
// Requires: npm install xlsx (run once)
// Server must be running at localhost:3000

const XLSX = require("xlsx");
const BASE_URL = "http://localhost:3000";

const TEST_SUITE = [
  { id: 1, name: "IdeaLoop Core", group: "A", expectedRange: "5.0-5.6", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "Software development" },
    idea: "An AI-powered startup idea evaluation tool that uses real competitor data from GitHub and Google Search to score ideas across market demand, monetization potential, originality, and technical complexity. Features structured rubric scoring, saved idea history, re-evaluation with alternatives, progress tracking, and a chained three-stage paid pipeline that separates competition analysis from scoring from roadmap generation." },
  { id: 2, name: "Health/Chronic Illness Companion", group: "A", expectedRange: "3.5-4.5", regressionAlert: "Overall > 5.0 or MD > 5.0",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Economics student" },
    idea: "An AI-powered health companion for people with chronic conditions like diabetes, heart disease, or autoimmune disorders. It detects non-adherence drift from daily behavior patterns, simulates the effect of behavior changes on health outcomes, predicts relapse risk windows, and prepares smart questions for doctor appointments based on recent symptoms and medication changes." },
  { id: 3, name: "Textile Sourcing Marketplace", group: "A", expectedRange: "4.5-5.2", regressionAlert: "Overall > 5.5 or MD > 6.0",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Textile sales background" },
    idea: "An AI-powered textile sourcing marketplace connecting small fashion brands with verified fabric suppliers worldwide. AI standardizes supplier listings from inconsistent specs, matches brand requirements to supplier capabilities, coordinates sample requests, handles supplier verification and trust scoring, and learns sourcing patterns to improve recommendations over time." },
  { id: 4, name: "AI Startup Advisor (Shallow Wrapper)", group: "A", expectedRange: "4.0-5.0", regressionAlert: "Overall > 5.5 or MO > 5.5",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "AI product interest" },
    idea: "An AI startup advisor for solo founders that helps with idea validation, competitor summaries, monetization options, MVP roadmap generation, pricing strategy, and go-to-market planning. A founder operating system that handles everything from initial concept to launch strategy using AI analysis." },
  { id: 5, name: "Legaltech Contract Risk Copilot", group: "A", expectedRange: "4.5-5.2", regressionAlert: "Overall > 5.8 or MD > 6.0",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Textile sales background" },
    idea: "An AI contract-risk copilot for SMEs that flags risky clauses in business contracts, suggests redline alternatives, summarizes contract risks in plain language for non-lawyers, and generates negotiation talking points. Focused specifically on small business owners who can't afford regular legal review for every contract." },
  { id: 6, name: "Developer Debugging Memory", group: "A", expectedRange: "4.5-5.5", regressionAlert: "Overall > 6.0 or OR > 6.5",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "History student background" },
    idea: "An AI debugging memory layer for engineering teams. It ingests stack traces, Slack threads, Git commits, and postmortem documents to identify recurring bug patterns, preserve institutional debugging knowledge, and suggest fixes based on what worked before for similar issues. Turns tribal debugging knowledge into searchable, reusable intelligence." },
  { id: 7, name: "Database Migration Tool", group: "B", expectedRange: "5.8-6.5", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "Software engineering" },
    idea: "An AI-powered database migration assistant that analyzes existing database schemas, generates migration scripts between different database systems (PostgreSQL to MySQL, MongoDB to PostgreSQL, etc.), handles edge cases in data type conversion, validates data integrity post-migration, and provides rollback plans. Targets development teams doing infrastructure modernization." },
  { id: 8, name: "Construction Change-Order Analyzer", group: "B", expectedRange: "5.2-6.0", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Some AI experience", education: "Construction industry" },
    idea: "An AI tool that analyzes construction change orders - scope modifications, cost adjustments, schedule impacts - and compares them against the original contract terms, historical change-order patterns on similar projects, and industry benchmarks. Flags potentially problematic changes, estimates true cost impact, and generates structured documentation for dispute resolution." },
  { id: 9, name: "Supplier Intelligence Tool", group: "B", expectedRange: "5.0-5.8", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "Supply chain background" },
    idea: "An AI tool for procurement teams that aggregates supplier data from public filings, news, trade databases, and internal purchase history to generate supplier risk profiles, alternative supplier recommendations, and negotiation leverage reports. Monitors supplier health signals and alerts when a key supplier shows financial distress or quality pattern changes." },
  { id: 10, name: "RFP Response Tool", group: "B", expectedRange: "5.0-5.8", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "Sales/consulting background" },
    idea: "An AI assistant that helps services companies respond to RFPs (Request for Proposals) faster. It analyzes RFP requirements, matches them against the company's capability database and past winning proposals, generates first-draft responses section by section, flags requirements the company can't meet, and suggests win-theme positioning based on competitive analysis of likely bidders." },
  { id: 11, name: "Niche Vertical SaaS (Mortgage Compliance)", group: "C", expectedRange: "5.5-6.8", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "Industry background relevant to chosen vertical" },
    idea: "An AI-powered compliance monitoring tool specifically for independent mortgage brokers. Tracks changing federal and state lending regulations in real time, automatically flags when a broker's active loan files may be affected by new rules, generates required disclosure updates, and maintains audit-ready compliance documentation. Targets the 30,000+ independent mortgage brokerages in the US who currently rely on manual compliance tracking or expensive enterprise solutions designed for large banks." },
  { id: 12, name: "Strong Dev Tool (Vuln Prioritizer)", group: "C", expectedRange: "5.5-6.5", regressionAlert: "",
    profile: { coding: "Advanced", ai: "Regular AI user", education: "Software engineering" },
    idea: "An AI-powered dependency vulnerability prioritizer for software teams. Goes beyond existing CVSS scoring by analyzing actual usage patterns in the codebase - which vulnerable functions are actually called, which attack vectors are reachable through the application's specific architecture, and which vulnerabilities are in test-only dependencies vs production paths. Integrates with CI/CD pipelines to provide contextual risk scores that replace the current noise of thousands of undifferentiated CVE alerts." },
  { id: 13, name: "Consumer Wardrobe App", group: "D", expectedRange: "4.0-5.0", regressionAlert: "Overall > 5.5",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "General interest" },
    idea: "An AI-powered personal wardrobe assistant that catalogs your existing clothes from photos, suggests daily outfits based on weather, calendar events, and your style preferences, tracks what you wear to avoid repetition, and identifies gaps in your wardrobe with specific shopping recommendations. Targets working professionals who want to look put-together without spending time deciding what to wear." },
  { id: 14, name: "B2B Enterprise Knowledge Mgmt", group: "D", expectedRange: "4.5-5.5", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Some AI experience", education: "Enterprise sales background" },
    idea: "An AI-powered internal knowledge management system for large consulting firms. Ingests project deliverables, proposals, client communications, and internal research across the organization, then makes institutional knowledge searchable and reusable. Consultants can find relevant past work, reuse frameworks, and access expert knowledge from colleagues they've never met. Includes access controls respecting client confidentiality boundaries." },
  { id: 15, name: "Simple Mobile Utility (Receipt Scanner)", group: "D", expectedRange: "4.5-5.5", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "General interest" },
    idea: "An AI-powered receipt scanner and expense categorizer for freelancers. Take a photo of any receipt, AI extracts merchant, amount, date, and category. Automatically categorizes expenses for tax purposes, learns your specific business expense patterns over time, and generates quarterly expense summaries formatted for common accounting software import. No subscription - one-time purchase of $9.99." },
  { id: 16, name: "Edtech Deep Learning Companion", group: "E", expectedRange: "4.5-5.5", regressionAlert: "Overall > 5.8",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Philosophy/history interest" },
    idea: "An AI deep learning companion for adults studying philosophy, history, and literature. Features Socratic questioning that adapts to comprehension level, mastery tracking across topics and texts, cross-text analysis that connects themes across different works, and an intellectual development map showing how understanding evolves over time." },
  { id: 17, name: "Enterprise Analytics Dashboard", group: "E", expectedRange: "4.5-5.5", regressionAlert: "Overall > 6.0 or MO > 6.0",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Sales-marketing background" },
    idea: "An AI-powered internal business intelligence layer that connects CRM, project management, customer support, HR, and finance tools into one dashboard. Generates executive summaries from cross-functional data, detects anomalies and trends, explains KPI movements in natural language, and identifies cross-functional patterns that siloed tools miss." }
];

const CONTAM_PHRASES = ["room for", "opportunity for", "clear demand", "strong demand", "window is closing", "promising market", "open market", "crowded market", "limited differentiation", "strong differentiation", "meaningful wedge", "sufficient", "insufficient", "viable path", "not viable", "accessible", "blocked", "favorable", "unfavorable"];
const POS = ["clear", "proven", "demonstrated", "strong", "growing", "established", "active demand", "willingness to pay", "genuine", "real wedge"];
const NEG = ["severely limited", "no viable", "no capturable", "structurally weak", "no clear", "eliminates", "impossible", "fragile", "weak pricing", "strong free substitutes", "high friction"];

function checkContam(text) { if (!text) return []; const l = text.toLowerCase(); return CONTAM_PHRASES.filter(p => l.includes(p)); }
function checkCon(score, exp) { if (!score || !exp) return "N/A"; const l = exp.toLowerCase(); const p = POS.some(s => l.includes(s)); const n = NEG.some(s => l.includes(s)); if (score >= 6.5 && n && !p) return "⚠️ HIGH+NEG"; if (score <= 4.0 && p && !n) return "⚠️ LOW+POS"; return "OK"; }
function checkDC(names, md, mo, or_) { if (!names?.length) return { f: false, d: "" }; const found = {}; for (const name of names) { const l = name.toLowerCase(); let c = 0; const m = []; if (md?.toLowerCase().includes(l)) { c++; m.push("MD"); } if (mo?.toLowerCase().includes(l)) { c++; m.push("MO"); } if (or_?.toLowerCase().includes(l)) { c++; m.push("OR"); } if (c >= 3) found[name] = m.join("+"); } return { f: Object.keys(found).length > 0, d: Object.entries(found).map(([k, v]) => k + "(" + v + ")").join(", ") }; }

async function runEval(idea, profile, pipeline) {
  const ep = pipeline === "PRO" ? "/api/analyze-pro" : "/api/analyze";
  const res = await fetch(BASE_URL + ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, profile }) });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const text = await res.text();
  let result = null, error = null;
  for (const line of text.split("\n")) { if (line.startsWith("data: ")) { try { const d = JSON.parse(line.slice(6)); if (d.step === "complete" && d.data) result = d.data; else if (d.step === "error") error = d.message; } catch (e) {} } }
  if (error) throw new Error(error);
  if (!result) throw new Error("No result");
  return result;
}

function extract(result) {
  const ev = result.evaluation; if (!ev) return null;
  const md = ev.market_demand?.score, mo = ev.monetization?.score, or_ = ev.originality?.score, tc = ev.technical_complexity?.score;
  const mdExp = ev.market_demand?.explanation || "", moExp = ev.monetization?.explanation || "", orExp = ev.originality?.explanation || "", tcExp = ev.technical_complexity?.explanation || "";
  const comps = result.competition?.competitors || []; const compNames = comps.map(c => c.name).filter(Boolean);
  const types = {}; comps.forEach(c => { const t = c.competitor_type || "?"; types[t] = (types[t] || 0) + 1; });
  const evS = {}; comps.forEach(c => { const e = c.evidence_strength || "?"; evS[e] = (evS[e] || 0) + 1; });
  const flags = result._pro?.domain_risk_flags || {};
  const diff = result.competition?.differentiation || "", landscape = result.competition?.landscape_analysis || result.competition?.summary || "", barriers = result.competition?.entry_barriers || "";
  const allC = [...checkContam(diff), ...checkContam(landscape), ...checkContam(barriers)];
  const dc = checkDC(compNames, mdExp, moExp, orExp);
  // V4S9: Extract evidence packets from PRO pipeline (3 packets — TC is separate)
  const packets = result._pro?.evidence_packets || {};
  const mdFacts = (packets.market_demand?.admissible_facts || []).join(" | ");
  const moFacts = (packets.monetization?.admissible_facts || []).join(" | ");
  const orFacts = (packets.originality?.admissible_facts || []).join(" | ");
  const tcFacts = ""; // TC is scored separately — no TC packet
  const mdPos = packets.market_demand?.strongest_positive || "";
  const mdNeg = packets.market_demand?.strongest_negative || "";
  const moPos = packets.monetization?.strongest_positive || "";
  const moNeg = packets.monetization?.strongest_negative || "";
  const orPos = packets.originality?.strongest_positive || "";
  const orNeg = packets.originality?.strongest_negative || "";
  const tcPos = ""; // TC is scored separately
  const tcNeg = ""; // TC is scored separately
  // V4S10: Check for cross-packet contamination (OR only — TC is isolated by architecture)
  const packetContam = [];
  if (orFacts.toLowerCase().match(/could build|can build|would build|build internal|build custom|build their own|using llm apis|using ai tools|using existing tools|using vector databases|commonly build|are building custom/)) packetContam.push("OR has build-language");
  return { md, mo, or: or_, tc, overall: ev.overall_score, confidence: ev.confidence_level?.level, confidenceReason: ev.confidence_level?.reason || "",
    mdExp, moExp, orExp, tcExp, tcBaseExp: ev.technical_complexity?.base_score_explanation || "", tcAdjExp: ev.technical_complexity?.adjustment_explanation || "",
    summary: ev.summary || "", failureRisks: (ev.failure_risks || []).join(" | "),
    compCount: comps.length, typeStr: Object.entries(types).map(([k,v]) => k+":"+v).join(", "), evStr: Object.entries(evS).map(([k,v]) => k+":"+v).join(", "), compNames: compNames.join(", "),
    isHighTrust: flags.is_high_trust || false, isMarketplace: flags.is_marketplace || false, isConsumerHabit: flags.is_consumer_habit || false, isPlatformFraming: flags.is_platform_framing || false,
    llmSubRisk: flags.llm_substitution_risk || "", llmSubReasoning: flags.llm_substitution_reasoning || "", reqRelDisplacement: flags.requires_relationship_displacement || false,
    diff, landscape, barriers, contamFound: allC.length > 0, contamPhrases: [...new Set(allC)].join(", "),
    mdCon: checkCon(md, mdExp), moCon: checkCon(mo, moExp), orCon: checkCon(or_, orExp),
    dcFlagged: dc.f, dcDetails: dc.d, incrementalNote: ev.technical_complexity?.incremental_note || "",
    geoNote: ev.market_demand?.geographic_note || "", trajNote: ev.market_demand?.trajectory_note || "", marketplaceNote: ev.marketplace_note || "",
    mdFacts, moFacts, orFacts, tcFacts, mdPos, mdNeg, moPos, moNeg, orPos, orNeg, tcPos, tcNeg,
    packetContam: packetContam.length > 0, packetContamDetails: packetContam.join(", ") };
}

async function main() {
  const results = []; const total = TEST_SUITE.length * 2; let done = 0;
  console.log("============================================\nIDEALOOP CORE — V4S10 COMPREHENSIVE TEST SUITE\n" + TEST_SUITE.length + " ideas x 2 pipelines = " + total + " tests\nEstimated: 75-110 minutes (Stage TC parallel with Stage 2a)\n============================================\n");

  for (const test of TEST_SUITE) {
    for (const pipeline of ["FREE", "PRO"]) {
      done++; console.log("\n[" + done + "/" + total + "] Test " + test.id + " — " + test.name + " (" + pipeline + ")");
      const t0 = Date.now();
      try {
        const result = await runEval(test.idea, test.profile, pipeline);
        const data = extract(result);
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        if (data) {
          console.log("  ✅ " + elapsed + "s — MD:" + data.md + " MO:" + data.mo + " OR:" + data.or + " TC:" + data.tc + " Overall:" + data.overall + " [" + data.confidence + "]");
          if (data.contamFound) console.log("  🔍 CONTAMINATION: " + data.contamPhrases);
          if (data.dcFlagged) console.log("  🔍 DOUBLE-COUNT: " + data.dcDetails);
          if (data.packetContam) console.log("  🔍 PACKET LEAK: " + data.packetContamDetails);
          if (test.regressionAlert) { let reg = false; const a = test.regressionAlert; if (a.includes("Overall >") && data.overall > parseFloat(a.match(/Overall > ([\d.]+)/)?.[1])) reg = true; if (a.includes("MD >") && data.md > parseFloat(a.match(/MD > ([\d.]+)/)?.[1])) reg = true; if (a.includes("MO >") && data.mo > parseFloat(a.match(/MO > ([\d.]+)/)?.[1])) reg = true; if (a.includes("OR >") && data.or > parseFloat(a.match(/OR > ([\d.]+)/)?.[1])) reg = true; if (reg) console.log("  ⚠️  REGRESSION: " + a); }
          results.push({ testId: test.id, name: test.name, group: test.group, pipeline, expected: test.expectedRange, regAlert: test.regressionAlert || "", elapsed: parseFloat(elapsed), status: "✅ OK", err: "", ...data });
        } else { results.push({ testId: test.id, name: test.name, group: test.group, pipeline, expected: test.expectedRange, regAlert: test.regressionAlert || "", elapsed: parseFloat(elapsed), status: "❌ NO SCORES", err: "No eval" }); }
      } catch (e) { const elapsed = ((Date.now() - t0) / 1000).toFixed(1); console.log("  ❌ FAILED (" + elapsed + "s) — " + e.message); results.push({ testId: test.id, name: test.name, group: test.group, pipeline, expected: test.expectedRange, regAlert: test.regressionAlert || "", elapsed: parseFloat(elapsed), status: "❌ FAILED", err: e.message }); }
    }
  }

  console.log("\nGenerating Excel...");
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({ Test: r.testId + (r.pipeline === "FREE" ? "a" : "b"), Idea: r.name, Group: r.group, Pipeline: r.pipeline, MD: r.md ?? "", MO: r.mo ?? "", OR: r.or ?? "", TC: r.tc ?? "", Overall: r.overall ?? "", Confidence: r.confidence ?? "", Competitors: r.compCount ?? "", "Comp Types": r.typeStr ?? "", "High Trust": r.isHighTrust ? "YES" : "", "LLM Sub": r.llmSubRisk ?? "", Contamination: r.contamFound ? "⚠️" : "✅", "Double Count": r.dcFlagged ? "⚠️" : "✅", "Packet Leak": r.packetContam ? "⚠️" : "✅", "MD Con": r.mdCon ?? "", "MO Con": r.moCon ?? "", "OR Con": r.orCon ?? "", Expected: r.expected, "Time(s)": r.elapsed, Status: r.status }))), "All Results");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(TEST_SUITE.map(t => { const f = results.find(r => r.testId === t.id && r.pipeline === "FREE"); const p = results.find(r => r.testId === t.id && r.pipeline === "PRO"); const d = (a, b) => (a != null && b != null) ? (b - a).toFixed(1) : ""; const d2 = (a, b) => (a != null && b != null) ? (b - a).toFixed(2) : ""; return { Idea: t.name, "F MD": f?.md ?? "", "P MD": p?.md ?? "", "Δ MD": d(f?.md, p?.md), "F MO": f?.mo ?? "", "P MO": p?.mo ?? "", "Δ MO": d(f?.mo, p?.mo), "F OR": f?.or ?? "", "P OR": p?.or ?? "", "Δ OR": d(f?.or, p?.or), "F TC": f?.tc ?? "", "P TC": p?.tc ?? "", "Δ TC": d(f?.tc, p?.tc), "F OA": f?.overall ?? "", "P OA": p?.overall ?? "", "Δ OA": d2(f?.overall, p?.overall) }; })), "Free vs Pro");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({ Test: r.testId + (r.pipeline === "FREE" ? "a" : "b"), Idea: r.name, Pipeline: r.pipeline, "MD Score": r.md ?? "", "MD Exp": r.mdExp ?? "", "MO Score": r.mo ?? "", "MO Exp": r.moExp ?? "", "OR Score": r.or ?? "", "OR Exp": r.orExp ?? "", "TC Score": r.tc ?? "", "TC Base": r.tcBaseExp ?? "", "TC Adj": r.tcAdjExp ?? "", "TC Exp": r.tcExp ?? "", Summary: r.summary ?? "", "Failure Risks": r.failureRisks ?? "", "Conf Reason": r.confidenceReason ?? "" }))), "Explanations");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({ Test: r.testId + (r.pipeline === "FREE" ? "a" : "b"), Idea: r.name, Pipeline: r.pipeline, Count: r.compCount ?? "", Types: r.typeStr ?? "", Evidence: r.evStr ?? "", Names: r.compNames ?? "", "DC Flag": r.dcFlagged ? "YES" : "No", "DC Detail": r.dcDetails ?? "" }))), "Competition");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({ Test: r.testId + (r.pipeline === "FREE" ? "a" : "b"), Idea: r.name, Pipeline: r.pipeline, "High Trust": r.isHighTrust ? "YES" : "", Marketplace: r.isMarketplace ? "YES" : "", "Consumer Habit": r.isConsumerHabit ? "YES" : "", "Platform Framing": r.isPlatformFraming ? "YES" : "", "LLM Sub Risk": r.llmSubRisk ?? "", "LLM Reasoning": r.llmSubReasoning ?? "", "Rel Displacement": r.reqRelDisplacement ? "YES" : "" }))), "Domain Flags");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.filter(r => r.pipeline === "PRO").map(r => ({ Test: r.testId + "b", Idea: r.name, Differentiation: r.diff ?? "", "Landscape Analysis": r.landscape ?? "", "Entry Barriers": r.barriers ?? "", Contamination: r.contamFound ? "⚠️ YES" : "Clean", Phrases: r.contamPhrases ?? "" }))), "Narrative Audit");

  // V4S9: New sheet — Evidence Packets (PRO only)
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.filter(r => r.pipeline === "PRO").map(r => ({ Test: r.testId + "b", Idea: r.name, "MD Facts": r.mdFacts ?? "", "MD +": r.mdPos ?? "", "MD -": r.mdNeg ?? "", "MO Facts": r.moFacts ?? "", "MO +": r.moPos ?? "", "MO -": r.moNeg ?? "", "OR Facts": r.orFacts ?? "", "OR +": r.orPos ?? "", "OR -": r.orNeg ?? "", "TC Facts": r.tcFacts ?? "", "TC +": r.tcPos ?? "", "TC -": r.tcNeg ?? "", "Packet Leak": r.packetContam ? "⚠️" : "Clean", "Leak Details": r.packetContamDetails ?? "" }))), "Evidence Packets");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({ Idea: r.name, Pipeline: r.pipeline, TC: r.tc ?? "", "TC Base": r.tcBaseExp ?? "", "TC Adj": r.tcAdjExp ?? "", "TC Exp": r.tcExp ?? "", Incremental: r.incrementalNote ?? "", Profile: (TEST_SUITE.find(t => t.id === r.testId)?.profile.coding || "") + " / " + (TEST_SUITE.find(t => t.id === r.testId)?.profile.ai || "") }))), "TC Distribution");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({ Test: r.testId + (r.pipeline === "FREE" ? "a" : "b"), Idea: r.name, Pipeline: r.pipeline, "Time(s)": r.elapsed }))), "Timing");

  const fn = "IdeaLoopCore_V4S10_Results_" + new Date().toISOString().slice(0, 10) + ".xlsx";
  XLSX.writeFile(wb, fn);

  console.log("\n✅ Saved: " + fn);
  console.log("   " + results.filter(r => r.status === "✅ OK").length + "/" + total + " passed, " + results.filter(r => r.status !== "✅ OK").length + " failed");

  console.log("\n============================================\nSCORE SUMMARY\n============================================");
  console.log("Idea                          | FREE            | PRO             | Δ OA");
  console.log("                              | MD  MO  OR  TC  | MD  MO  OR  TC  |");
  console.log("------------------------------|-----------------|-----------------|------");
  for (const t of TEST_SUITE) { const f = results.find(r => r.testId === t.id && r.pipeline === "FREE"); const p = results.find(r => r.testId === t.id && r.pipeline === "PRO"); const pad = v => v != null ? String(v).padEnd(4) : "—   "; const name = t.name.substring(0, 30).padEnd(30); const fS = f?.md != null ? pad(f.md)+pad(f.mo)+pad(f.or)+pad(f.tc) : "FAIL            "; const pS = p?.md != null ? pad(p.md)+pad(p.mo)+pad(p.or)+pad(p.tc) : "FAIL            "; const delta = (f?.overall != null && p?.overall != null) ? (p.overall - f.overall).toFixed(2) : "—"; console.log(name + "| " + fS + "| " + pS + "| " + delta); }

  const contam = results.filter(r => r.contamFound && r.pipeline === "PRO");
  console.log("\n🔍 Contamination: " + contam.length + "/" + results.filter(r => r.pipeline === "PRO" && r.status === "✅ OK").length + " PRO runs have judgment phrases");
  contam.forEach(r => console.log("   " + r.name + ": " + r.contamPhrases));

  const tcs = results.filter(r => r.tc != null).map(r => r.tc);
  const tc75 = tcs.filter(s => s === 7.5).length;
  console.log("\n🔍 TC clustering: " + tc75 + "/" + tcs.length + " are 7.5 (" + (tc75/tcs.length*100).toFixed(1) + "%)");
  console.log("   Unique TC: " + [...new Set(tcs)].sort((a,b) => a-b).join(", "));

  const dcs = results.filter(r => r.dcFlagged);
  console.log("\n🔍 Double counting: " + dcs.length + "/" + results.filter(r => r.status === "✅ OK").length + " flagged");

  const pLeaks = results.filter(r => r.packetContam && r.pipeline === "PRO");
  console.log("\n🔍 Packet leaks: " + pLeaks.length + "/" + results.filter(r => r.pipeline === "PRO" && r.status === "✅ OK").length + " PRO runs have cross-packet contamination");
  pLeaks.forEach(r => console.log("   " + r.name + ": " + r.packetContamDetails));
}

main().catch(err => { console.error("\nFATAL:", err.message); process.exit(1); });