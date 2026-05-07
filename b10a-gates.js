// ============================================
// B10A GATE EVALUATORS
// ============================================
// Locked thresholds per Methodology Principle 6 — set BEFORE runner runs.
// If a threshold needs adjustment after seeing results, that signals the
// design lock was wrong (re-discuss design), NOT relax the threshold.
//
// Each gate is a pure function: (allRuns, byCase, helpers) => { gate, result, detail }
//   gate    — string, gate name (matches GATES_REGISTRY)
//   result  — "PASS" | "FAIL" | "INCONCLUSIVE" | "OBSERVE"
//   detail  — object with diagnostic info for the report
//
// allRuns  — flat array of all run results { caseId, runIndex, fields, raw, ... }
// byCase   — { caseId: { run1: result, run2: result, run3?: result } }
// helpers  — utility functions (regex matchers, score deltas, etc.)
// ============================================

// ============================================
// LOCKED THRESHOLDS (the source of truth)
// ============================================

const THRESHOLDS = {
  // ─── Deterministic / structural ───
  PARSE_FAILURE_MAX: 0,                      // zero parse failures tolerated
  REQUIRED_SECTIONS_PRO: ["summary", "failureRisks", "scores.md", "scores.mo", "scores.or", "scores.tc", "scores.overall", "estimates.main_bottleneck", "estimates.duration", "estimates.difficulty"],
  REQUIRED_SECTIONS_FREE: ["summary", "failureRisks", "scores.md", "scores.mo", "scores.or", "scores.tc", "scores.overall"],

  // ─── α formula (B8) ───
  ALPHA_MD_WEIGHT: 0.375,
  ALPHA_MO_WEIGHT: 0.3125,
  ALPHA_OR_WEIGHT: 0.3125,
  ALPHA_TOLERANCE: 0.05,                     // arithmetic tolerance for rounding

  // ─── TC matrix gate (B6 + V4S11 architectural) ───
  TC_MAT1_CANONICAL: { beginner: 7.5, intermediate: 7.0, senior: 6.0 },
  TC_MAT1_MIN_SPREAD: 1.0,                   // beginner − senior ≥ 1.0
  TC_MAT1_TOLERANCE: 0.5,                    // ±0.5 of canonical values

  // ─── Specificity Gate (B7 + V8.1) ───
  GATE_PASS_CASES: ["GATE-A1", "GATE-D2"],   // must PASS gate (no specificity_insufficient)
  GATE_FAIL_CASES: ["AUDIT-SP1", "GATE-G2"], // must FAIL gate (specificity_insufficient: true)

  // ─── Main Bottleneck enum reachability (B3) ───
  // 8-value enum locked per NarrativeContract V8-LOCKED §3.6.
  // C-NEW-1 Path A revert (Bundle 0, May 2026): reverted from partial-update
  // 7-value state (Capital/runway present, Data acquisition + Category maturation
  // missing). Bundle 4.1 will atomically advance prompt + gates + frontend +
  // contract together to the F5 target enum. Until then, gates match production.
  MB_ENUM_VALUES: ["Technical build", "Buyer access", "Trust/credibility", "Compliance", "Distribution", "Data acquisition", "Category maturation", "Specification"],
  MB_REACHABILITY_MIN: 6,                    // ≥6 of 8 enum values must fire across bank (Specification is LOW-only conditional; Category maturation may be rare)

  // ─── Variance gates (2x bank run) ───
  VARIANCE_OVERALL_MAX_DELTA: 0.3,           // Overall delta across reruns ≤ 0.3
  VARIANCE_FORBIDDEN_FLIPS: [["LOW", "HIGH"], ["HIGH", "LOW"]], // never bounce these
  BIMODALITY_RATE_GREEN: 0.15,               // <15% HIGH/MEDIUM flip rate = clean
  BIMODALITY_RATE_YELLOW: 0.30,              // 15-30% = partial; >30% = unresolved

  // ─── Stage 1 profile-blindness (B6, Lens Q hard subset) ───
  // Within each MAT trio (run 1 only — soft on run 2 for cross-rerun comparison):
  // Hard fail conditions (per ChatGPT Lens Q tiering):
  //   - competitor selection differs across profiles
  //   - MD/MO/OR reasoning text references profile
  //   - founder credentials/expertise leak into MD/MO/OR text
  STAGE1_PROFILE_LEAK_PATTERNS: [
    // Profile-leak phrasings that should NEVER appear in MD/MO/OR explanations
    /\byour\s+(coding|programming|engineering|technical)\s+(skill|background|experience|capability)/i,
    /\byour\s+(domain|industry)\s+(background|experience|expertise|knowledge)/i,
    /\byour\s+founder\s+(profile|background)/i,
    /\bgiven\s+your\s+(coding|engineering|technical|domain)/i,
    /\bas\s+a\s+(beginner|intermediate|senior|advanced)\s+(coder|developer|engineer)/i,
    /\bwith\s+your\s+\d+\s+years/i,
  ],

  // ─── Profile-fit fabrication (Lens R, B1 P1-S1 stem-match) ───
  // For MAT3-tech-no-access specifically, profile is:
  //   "Staff engineer at healthtech startup (8 years), built procurement tools for enterprise"
  // Fabrication patterns to FAIL on:
  MAT3_TECHNOACCESS_FABRICATION_PATTERNS: [
    /your\s+hospital\s+(relationship|network|connection)/i,
    /your\s+(healthcare|clinical)\s+(background|expertise|experience)/i,
    /your\s+rural\s+hospital/i,
    /your\s+CFO\s+(network|relationship|connection)/i,
    /your\s+(buying-side|procurement)\s+experience/i,
    /your\s+experience\s+(with|in)\s+(rural|hospital|clinical)/i,
  ],

  // ─── Sparse-input no-imagination (Lens E, B7 floor) ───
  // If SP1 doesn't gate, these patterns indicate fabrication
  SPARSE_NO_IMAGINATION_FORBIDDEN_PATTERNS: [
    /dental practice management software market/i,
    /existing dental SaaS/i,
    /Dentrix|Open Dental|Carestream/i,    // specific products invented around the sparse input
  ],

  // ─── Enum compliance (V8.1 rename) ───
  DEPRECATED_ENUM_VALUES: ["workflow", "core_feature"],
  CURRENT_ENUM_VALUES: ["target_user", "use_case", "mechanism"],

  // ─── thin_dimensions gate ───
  THIN_DIMENSIONS_REQUIRED_FOR_LOW: true,    // LOW evidence_strength must emit array

  // ─── OR actionability (Lens, B4) ───
  OR_HOOK_PATTERNS: [
    /\bvalidate\b/i, /\btest\b/i, /\bverify\b/i, /\bprove\b/i,
    /\binterview\b/i, /\btalk to\b/i, /\bsurvey\b/i, /\bbenchmark\b/i,
  ],

  // ─── Templating (Lens H, R1+R2+R3) ───
  TEMPLATE_LEAD_LENGTH: 100,                 // first 100 chars
  TEMPLATE_FORBIDDEN_SHARED_NGRAM: 5,        // no shared 5-word phrases

  // ─── Layered case (Lens M, ARC-D2) ───
  ARC_D2_PREFERRED_MB: "Compliance",         // soft preference for Main Bottleneck
  ARC_D2_REQUIRED_RISK3: "D",                // hard: Risk 3 archetype must be D

  // ─── Failure budget ───
  CONSECUTIVE_FAILURE_HALT: 5,               // 5 consecutive run failures → halt
};

// ============================================
// HELPER UTILITIES
// ============================================

function getNested(obj, path) {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function isPresent(val) {
  if (val == null) return false;
  if (val === "") return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

function regexAnyMatch(text, patterns) {
  if (!text) return false;
  return patterns.some((p) => p.test(text));
}

function shareSharedNgram(strings, n) {
  // Returns true if any pair of strings shares an n-gram of `n` words
  const ngrams = strings.map((s) => {
    const words = s.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
    const set = new Set();
    for (let i = 0; i <= words.length - n; i++) {
      set.add(words.slice(i, i + n).join(" "));
    }
    return set;
  });
  for (let i = 0; i < ngrams.length; i++) {
    for (let j = i + 1; j < ngrams.length; j++) {
      for (const ng of ngrams[i]) {
        if (ngrams[j].has(ng)) return ng;
      }
    }
  }
  return null;
}

// ============================================
// GATE EVALUATORS
// ============================================
// Each evaluator: (allRuns, byCase) => { gate, result, detail }

// ─── G_PIPELINE_COMPLETION ───
function gatePipelineCompletion(allRuns) {
  const failures = allRuns.filter((r) => r.status === "error");
  return {
    gate: "G_PIPELINE_COMPLETION",
    result: failures.length === 0 ? "PASS" : "FAIL",
    detail: { totalRuns: allRuns.length, failures: failures.length, failureIds: failures.map((f) => `${f.caseId}__run${f.runIndex}`) },
  };
}

// ─── G_PARSE_NO_FAILURE ───
function gateParseNoFailure(allRuns) {
  const parseErrors = allRuns.filter((r) => r.status === "error" && /parse|JSON|truncat/i.test(r.errorMessage || ""));
  return {
    gate: "G_PARSE_NO_FAILURE",
    result: parseErrors.length === 0 ? "PASS" : "FAIL",
    detail: { parseErrors: parseErrors.length, ids: parseErrors.map((e) => `${e.caseId}__run${e.runIndex}`) },
  };
}

// ─── G_REQUIRED_SECTIONS_PRESENT ───
function gateRequiredSections(allRuns) {
  const failed = [];
  for (const r of allRuns) {
    if (r.status !== "success") continue;
    if (r.gateFired) continue; // gated runs don't need full sections
    const required = r.pipeline === "PRO" ? THRESHOLDS.REQUIRED_SECTIONS_PRO : THRESHOLDS.REQUIRED_SECTIONS_FREE;
    const missing = required.filter((path) => !isPresent(getNested(r.fields, path)));
    if (missing.length > 0) failed.push({ id: `${r.caseId}__run${r.runIndex}`, missing });
  }
  return {
    gate: "G_REQUIRED_SECTIONS_PRESENT",
    result: failed.length === 0 ? "PASS" : "FAIL",
    detail: { failedRuns: failed.length, examples: failed.slice(0, 5) },
  };
}

// ─── G_GATE_A1_PASS ───
function gateA1Pass(allRuns) {
  const targets = allRuns.filter((r) => r.caseId === "GATE-A1");
  const fails = targets.filter((r) => r.gateFired === true);
  return {
    gate: "G_GATE_A1_PASS",
    result: targets.length > 0 && fails.length === 0 ? "PASS" : (targets.length === 0 ? "INCONCLUSIVE" : "FAIL"),
    detail: { runs: targets.length, gated: fails.length },
  };
}

// ─── G_GATE_B1_FAIL (SP1 must gate) ───
function gateB1Fail(allRuns) {
  const targets = allRuns.filter((r) => r.caseId === "AUDIT-SP1");
  const passed = targets.filter((r) => r.gateFired !== true);
  return {
    gate: "G_GATE_B1_FAIL",
    result: targets.length > 0 && passed.length === 0 ? "PASS" : (targets.length === 0 ? "INCONCLUSIVE" : "FAIL"),
    detail: { runs: targets.length, leakedThroughGate: passed.length, note: "SP1 should gate (Haiku specificity_insufficient: true). If it passes, V8.1 floor regressed." },
  };
}

// ─── G_GATE_D2_PASS (collapse-pattern rescue) ───
function gateD2Pass(allRuns) {
  const targets = allRuns.filter((r) => r.caseId === "GATE-D2");
  const fails = targets.filter((r) => r.gateFired === true);
  return {
    gate: "G_GATE_D2_PASS",
    result: targets.length > 0 && fails.length === 0 ? "PASS" : (targets.length === 0 ? "INCONCLUSIVE" : "FAIL"),
    detail: { runs: targets.length, gated: fails.length, note: "Collapse-pattern rescue should silently rescue. If it gates, v3 rescue layer regressed." },
  };
}

// ─── G_TC_MAT1 ───
function gateTcMat1(allRuns) {
  const beg = allRuns.find((r) => r.caseId === "AUDIT-MAT1-beginner" && r.runIndex === 1 && r.status === "success");
  const int = allRuns.find((r) => r.caseId === "AUDIT-MAT1-intermediate" && r.runIndex === 1 && r.status === "success");
  const sen = allRuns.find((r) => r.caseId === "AUDIT-MAT1-senior" && r.runIndex === 1 && r.status === "success");
  if (!beg || !int || !sen) return { gate: "G_TC_MAT1", result: "INCONCLUSIVE", detail: { reason: "missing MAT1 trio runs" } };
  const tcBeg = beg.fields.scores.tc, tcInt = int.fields.scores.tc, tcSen = sen.fields.scores.tc;
  const spread = tcBeg - tcSen;
  const monotonic = tcBeg >= tcInt && tcInt >= tcSen;
  const canon = THRESHOLDS.TC_MAT1_CANONICAL;
  const tol = THRESHOLDS.TC_MAT1_TOLERANCE;
  const inTolerance = Math.abs(tcBeg - canon.beginner) <= tol && Math.abs(tcInt - canon.intermediate) <= tol && Math.abs(tcSen - canon.senior) <= tol;
  const pass = spread >= THRESHOLDS.TC_MAT1_MIN_SPREAD && monotonic && inTolerance;
  return {
    gate: "G_TC_MAT1",
    result: pass ? "PASS" : "FAIL",
    detail: {
      tc: { beg: tcBeg, int: tcInt, sen: tcSen },
      canonical: canon,
      spread,
      monotonic,
      inTolerance,
      v9_1_trigger: !pass,
      note: pass ? "TC matrix profile-aware scoring holds." : "TC gate failed → V9.1 TC adjustment-math fix session opens.",
    },
  };
}

// ─── G_ALPHA_ARITHMETIC ───
function gateAlphaArithmetic(allRuns) {
  const failed = [];
  for (const r of allRuns.filter((r) => r.pipeline === "PRO" && r.status === "success" && !r.gateFired)) {
    const { md, mo, or: origin, overall } = r.fields.scores;
    if ([md, mo, origin, overall].some((v) => v == null)) continue;
    const expected = md * THRESHOLDS.ALPHA_MD_WEIGHT + mo * THRESHOLDS.ALPHA_MO_WEIGHT + origin * THRESHOLDS.ALPHA_OR_WEIGHT;
    const delta = Math.abs(overall - expected);
    if (delta > THRESHOLDS.ALPHA_TOLERANCE) {
      failed.push({ id: `${r.caseId}__run${r.runIndex}`, md, mo, or: origin, overall, expected: expected.toFixed(3), delta: delta.toFixed(3) });
    }
  }
  return {
    gate: "G_ALPHA_ARITHMETIC",
    result: failed.length === 0 ? "PASS" : "FAIL",
    detail: { totalChecked: allRuns.filter((r) => r.pipeline === "PRO" && r.status === "success" && !r.gateFired).length, failed: failed.length, examples: failed.slice(0, 5) },
  };
}

// ─── G_FREE_THIN_DIMENSIONS ───
function gateFreeThinDimensions(allRuns) {
  const target = allRuns.find((r) => r.caseId === "SPARSE-LOW-std" && r.runIndex === 1 && r.status === "success");
  if (!target) return { gate: "G_FREE_THIN_DIMENSIONS", result: "INCONCLUSIVE", detail: { reason: "SPARSE-LOW-std run 1 missing" } };
  const evLevel = target.fields.evidence_strength?.level;
  const thinDims = target.fields.evidence_strength?.thin_dimensions;
  // Pass: LOW evidence level emits non-empty thin_dimensions using current enum
  if (evLevel !== "LOW") {
    return { gate: "G_FREE_THIN_DIMENSIONS", result: "INCONCLUSIVE", detail: { reason: "expected LOW but got " + evLevel, evLevel } };
  }
  if (!Array.isArray(thinDims) || thinDims.length === 0) {
    return { gate: "G_FREE_THIN_DIMENSIONS", result: "FAIL", detail: { reason: "LOW evidence_strength but thin_dimensions absent or empty", evLevel, thinDims } };
  }
  const usesDeprecated = thinDims.some((v) => THRESHOLDS.DEPRECATED_ENUM_VALUES.includes(v));
  const usesCurrent = thinDims.every((v) => THRESHOLDS.CURRENT_ENUM_VALUES.includes(v));
  if (usesDeprecated) {
    return { gate: "G_FREE_THIN_DIMENSIONS", result: "FAIL", detail: { reason: "uses deprecated enum (workflow/core_feature)", thinDims } };
  }
  if (!usesCurrent) {
    return { gate: "G_FREE_THIN_DIMENSIONS", result: "FAIL", detail: { reason: "uses non-canonical enum value", thinDims } };
  }
  return { gate: "G_FREE_THIN_DIMENSIONS", result: "PASS", detail: { evLevel, thinDims } };
}

// ─── G_OPTION_Z_MEDIUM ───
function gateOptionZMedium(allRuns) {
  const target = allRuns.find((r) => r.caseId === "OPTZ-MED" && r.runIndex === 1 && r.status === "success");
  if (!target) return { gate: "G_OPTION_Z_MEDIUM", result: "INCONCLUSIVE", detail: { reason: "OPTZ-MED run 1 missing" } };
  const evLevel = target.fields.evidence_strength?.level;
  const reason = target.fields.evidence_strength?.reason || "";
  const isMedium = evLevel === "MEDIUM";
  const noProveMarket = !/prove\s+(the\s+)?market|prove\s+demand|validate\s+demand\s+exists/i.test(reason);
  const hasInputActionableHook = /pricing|buyer|user|distribution|positioning|mechanism|target\s+segment|monetization|wedge|integration/i.test(reason);
  const pass = isMedium && noProveMarket && hasInputActionableHook;
  return {
    gate: "G_OPTION_Z_MEDIUM",
    result: pass ? "PASS" : "FAIL",
    detail: { evLevel, reason: reason.substring(0, 300), isMedium, noProveMarket, hasInputActionableHook },
  };
}

// ─── G_MAT3_NO_FABRICATION ───
function gateMat3NoFabrication(allRuns) {
  const targets = allRuns.filter((r) => r.caseId === "AUDIT-MAT3-tech-no-access" && r.status === "success");
  const violations = [];
  for (const r of targets) {
    const surfaces = [
      ["summary", r.fields.summary],
      ["risk1", r.fields.failureRisks?.[0]?.text],
      ["risk2", r.fields.failureRisks?.[1]?.text],
      ["risk3", r.fields.failureRisks?.find((f) => f.slot === "founder_fit")?.text],
      ["main_bottleneck_explanation", r.fields.estimates?.main_bottleneck_explanation],
      ["execution_explanation", r.fields.estimates?.explanation],
      ["tc_adjustment", r.fields.metricExplanations?.tcAdjustment],
    ];
    for (const [name, text] of surfaces) {
      if (regexAnyMatch(text, THRESHOLDS.MAT3_TECHNOACCESS_FABRICATION_PATTERNS)) {
        const matched = THRESHOLDS.MAT3_TECHNOACCESS_FABRICATION_PATTERNS.find((p) => p.test(text));
        violations.push({ runIndex: r.runIndex, surface: name, pattern: matched.toString(), excerpt: (text.match(matched) || [])[0] });
      }
    }
  }
  return {
    gate: "G_MAT3_NO_FABRICATION",
    result: violations.length === 0 ? "PASS" : "FAIL",
    detail: { totalChecked: targets.length, violations: violations.length, examples: violations.slice(0, 8) },
  };
}

// ─── G_SPARSE_NO_IMAGINATION ───
function gateSparseNoImagination(allRuns) {
  // If SP1 gates, this is automatically PASS (no scoring → no fabrication possible)
  // If SP1 doesn't gate (which would itself be a G_GATE_B1_FAIL fail), check for fabrication
  const targets = allRuns.filter((r) => r.caseId === "AUDIT-SP1" && r.status === "success");
  const gated = targets.filter((r) => r.gateFired === true);
  if (gated.length === targets.length && targets.length > 0) {
    return { gate: "G_SPARSE_NO_IMAGINATION", result: "PASS", detail: { reason: "all SP1 runs gated upstream — no fabrication possible", runs: targets.length } };
  }
  // If any leaked through, check for fabrication
  const violations = [];
  for (const r of targets.filter((r) => !r.gateFired)) {
    const text = [r.fields.summary, r.fields.metricExplanations?.md, r.fields.metricExplanations?.mo, r.fields.metricExplanations?.or].filter(Boolean).join(" ");
    if (regexAnyMatch(text, THRESHOLDS.SPARSE_NO_IMAGINATION_FORBIDDEN_PATTERNS)) {
      violations.push({ runIndex: r.runIndex, excerpt: text.substring(0, 200) });
    }
  }
  return {
    gate: "G_SPARSE_NO_IMAGINATION",
    result: violations.length === 0 ? "PASS" : "FAIL",
    detail: { violations: violations.length, examples: violations.slice(0, 3) },
  };
}

// ─── G_MB_REACHABILITY ───
function gateMbReachability(allRuns) {
  const fired = new Set();
  for (const r of allRuns.filter((r) => r.runIndex === 1 && r.status === "success" && !r.gateFired && r.pipeline === "PRO")) {
    const mb = r.fields.estimates?.main_bottleneck;
    if (mb) fired.add(mb);
  }
  const enumValues = THRESHOLDS.MB_ENUM_VALUES;
  const hits = enumValues.filter((v) => fired.has(v));
  const pass = hits.length >= THRESHOLDS.MB_REACHABILITY_MIN;
  return {
    gate: "G_MB_REACHABILITY",
    result: pass ? "PASS" : "FAIL",
    detail: { fired: Array.from(fired), enumValues, hits: hits.length, requiredMin: THRESHOLDS.MB_REACHABILITY_MIN, missing: enumValues.filter((v) => !fired.has(v)) },
  };
}

// ─── G_ARC_D_RISK3 ───
function gateArcDRisk3(allRuns) {
  const target = allRuns.find((r) => r.caseId === "ARC-D1" && r.runIndex === 1 && r.status === "success");
  if (!target) return { gate: "G_ARC_D_RISK3", result: "INCONCLUSIVE", detail: { reason: "ARC-D1 run 1 missing" } };
  const risk3 = target.fields.failureRisks?.find((r) => r.slot === "founder_fit");
  const archetype = risk3?.archetype;
  return {
    gate: "G_ARC_D_RISK3",
    result: archetype === "D" ? "PASS" : "FAIL",
    detail: { archetypeFired: archetype || "null", expected: "D", risk3Text: risk3?.text?.substring(0, 200) },
  };
}

// ─── G_ENUM_COMPLIANCE ───
function gateEnumCompliance(allRuns) {
  const violations = [];
  for (const r of allRuns.filter((r) => r.status === "success")) {
    const thinDims = r.fields.evidence_strength?.thin_dimensions || [];
    const missing = r.fields.haiku_keywords?.missing_elements || [];
    const allEnumValues = [...thinDims, ...missing];
    const deprecated = allEnumValues.filter((v) => THRESHOLDS.DEPRECATED_ENUM_VALUES.includes(v));
    if (deprecated.length > 0) {
      violations.push({ id: `${r.caseId}__run${r.runIndex}`, deprecated, source: thinDims.length ? "thin_dimensions" : "haiku_keywords" });
    }
  }
  return {
    gate: "G_ENUM_COMPLIANCE",
    result: violations.length === 0 ? "PASS" : "FAIL",
    detail: { violations: violations.length, examples: violations.slice(0, 5) },
  };
}

// ─── G_EVIDENCE_NO_NULL ───
function gateEvidenceNoNull(allRuns) {
  const violations = [];
  for (const r of allRuns.filter((r) => r.pipeline === "PRO" && r.status === "success" && !r.gateFired)) {
    const level = r.fields.evidence_strength?.level;
    if (level == null || !["HIGH", "MEDIUM", "LOW"].includes(level)) {
      violations.push({ id: `${r.caseId}__run${r.runIndex}`, level: level || "null" });
    }
  }
  return {
    gate: "G_EVIDENCE_NO_NULL",
    result: violations.length === 0 ? "PASS" : "FAIL",
    detail: { violations: violations.length, examples: violations.slice(0, 5) },
  };
}

// ─── G_VARIANCE_EVIDENCE_NO_FLIP (replaces former G_EVIDENCE_NO_FLIP) ───
function gateVarianceEvidenceNoFlip(allRuns, byCase) {
  const violations = [];
  for (const [caseId, runs] of Object.entries(byCase)) {
    const r1 = runs.run1, r2 = runs.run2;
    if (!r1 || !r2 || r1.status !== "success" || r2.status !== "success") continue;
    if (r1.gateFired || r2.gateFired) continue;
    const l1 = r1.fields.evidence_strength?.level;
    const l2 = r2.fields.evidence_strength?.level;
    if (!l1 || !l2) continue;
    for (const [a, b] of THRESHOLDS.VARIANCE_FORBIDDEN_FLIPS) {
      if ((l1 === a && l2 === b) || (l1 === b && l2 === a)) {
        violations.push({ caseId, run1: l1, run2: l2 });
        break;
      }
    }
  }
  return {
    gate: "G_VARIANCE_EVIDENCE_NO_FLIP",
    result: violations.length === 0 ? "PASS" : "FAIL",
    detail: { violations: violations.length, examples: violations.slice(0, 8), note: "LOW ↔ HIGH flips are catastrophic. HIGH/MEDIUM flips tracked in S_BIMODALITY_RATE." },
  };
}

// ─── G_VARIANCE_RISK3_ARCHETYPE ───
function gateVarianceRisk3Archetype(allRuns, byCase) {
  const violations = [];
  for (const [caseId, runs] of Object.entries(byCase)) {
    const r1 = runs.run1, r2 = runs.run2;
    if (!r1 || !r2 || r1.status !== "success" || r2.status !== "success") continue;
    if (r1.gateFired || r2.gateFired) continue;
    const a1 = r1.fields.failureRisks?.find((f) => f.slot === "founder_fit")?.archetype || null;
    const a2 = r2.fields.failureRisks?.find((f) => f.slot === "founder_fit")?.archetype || null;
    if (a1 !== a2) violations.push({ caseId, run1: a1, run2: a2 });
  }
  return {
    gate: "G_VARIANCE_RISK3_ARCHETYPE",
    result: violations.length === 0 ? "PASS" : "FAIL",
    detail: { violations: violations.length, examples: violations.slice(0, 8), note: "Risk 3 archetype must be stable across reruns at temp=0." },
  };
}

// ─── G_VARIANCE_MAIN_BOTTLENECK ───
function gateVarianceMainBottleneck(allRuns, byCase) {
  const violations = [];
  for (const [caseId, runs] of Object.entries(byCase)) {
    const r1 = runs.run1, r2 = runs.run2;
    if (!r1 || !r2 || r1.status !== "success" || r2.status !== "success") continue;
    if (r1.gateFired || r2.gateFired) continue;
    const m1 = r1.fields.estimates?.main_bottleneck;
    const m2 = r2.fields.estimates?.main_bottleneck;
    if (m1 !== m2) violations.push({ caseId, run1: m1, run2: m2 });
  }
  return {
    gate: "G_VARIANCE_MAIN_BOTTLENECK",
    result: violations.length === 0 ? "PASS" : "FAIL",
    detail: { violations: violations.length, examples: violations.slice(0, 8) },
  };
}

// ─── G_VARIANCE_ALPHA (Overall delta across reruns) ───
function gateVarianceAlpha(allRuns, byCase) {
  const violations = [];
  for (const [caseId, runs] of Object.entries(byCase)) {
    const r1 = runs.run1, r2 = runs.run2;
    if (!r1 || !r2 || r1.status !== "success" || r2.status !== "success") continue;
    if (r1.gateFired || r2.gateFired) continue;
    const o1 = r1.fields.scores?.overall, o2 = r2.fields.scores?.overall;
    if (o1 == null || o2 == null) continue;
    const delta = Math.abs(o1 - o2);
    if (delta > THRESHOLDS.VARIANCE_OVERALL_MAX_DELTA) violations.push({ caseId, run1: o1, run2: o2, delta: delta.toFixed(2) });
  }
  return {
    gate: "G_VARIANCE_ALPHA",
    result: violations.length === 0 ? "PASS" : "FAIL",
    detail: { violations: violations.length, examples: violations.slice(0, 8), threshold: THRESHOLDS.VARIANCE_OVERALL_MAX_DELTA },
  };
}

// ─── G_STAGE1_BLINDNESS ───
function gateStage1Blindness(allRuns) {
  const violations = [];
  // Check MAT trios: same idea × 3 profiles → MD/MO/OR explanations should NOT reference profile
  const trioCases = allRuns.filter((r) => r.caseId.startsWith("AUDIT-MAT") && r.runIndex === 1 && r.status === "success");
  for (const r of trioCases) {
    const surfaces = [
      ["md_explanation", r.fields.metricExplanations?.md],
      ["mo_explanation", r.fields.metricExplanations?.mo],
      ["or_explanation", r.fields.metricExplanations?.or],
    ];
    for (const [name, text] of surfaces) {
      if (regexAnyMatch(text, THRESHOLDS.STAGE1_PROFILE_LEAK_PATTERNS)) {
        const matched = THRESHOLDS.STAGE1_PROFILE_LEAK_PATTERNS.find((p) => p.test(text));
        violations.push({ caseId: r.caseId, surface: name, pattern: matched.toString(), excerpt: (text.match(matched) || [])[0] });
      }
    }
  }
  // Cross-trio competitor set check (within MAT1 × 3, MAT2 × 3, MAT3 × 3)
  const competitorViolations = [];
  for (const trioName of ["MAT1", "MAT2", "MAT3"]) {
    const trio = trioCases.filter((r) => r.caseId.includes(trioName));
    if (trio.length < 2) continue;
    const sets = trio.map((r) => new Set((r.fields.competition?.competitors || []).map((c) => (c.name || "").toLowerCase().trim())));
    // Compare each pair
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const a = sets[i], b = sets[j];
        const symmetricDiff = [...a].filter((x) => !b.has(x)).concat([...b].filter((x) => !a.has(x)));
        if (symmetricDiff.length > 0) {
          competitorViolations.push({ trio: trioName, profileA: trio[i].caseId, profileB: trio[j].caseId, differingCompetitors: symmetricDiff });
        }
      }
    }
  }
  const allViolations = [...violations, ...competitorViolations.map((c) => ({ ...c, type: "competitor_set_diff" }))];
  return {
    gate: "G_STAGE1_BLINDNESS",
    result: allViolations.length === 0 ? "PASS" : "FAIL",
    detail: { profileLeaks: violations.length, competitorSetDiffs: competitorViolations.length, examples: allViolations.slice(0, 8) },
  };
}

// ─── G_STAGE_TC_PARSE ───
function gateStageTcParse(allRuns) {
  const targets = allRuns.filter((r) => r.caseId === "G1-LONG-1500W");
  const failed = targets.filter((r) => r.status === "error" || !isPresent(r.fields?.metricExplanations?.tc));
  return {
    gate: "G_STAGE_TC_PARSE",
    result: targets.length > 0 && failed.length === 0 ? "PASS" : (targets.length === 0 ? "INCONCLUSIVE" : "FAIL"),
    detail: { runs: targets.length, failed: failed.length, examples: failed.slice(0, 3).map((f) => ({ runIndex: f.runIndex, error: f.errorMessage, hasTcExplanation: isPresent(f.fields?.metricExplanations?.tc) })) },
  };
}

// ─── G_TRADEOFFS_DELTA_GREP ───
// Static grep check — runner reports based on file system inspection (passes through)
function gateTradeoffsDeltaGrep(_, __, helpers) {
  // helpers.grepResults provided by runner if static check ran
  if (!helpers || !helpers.grepResults) {
    return { gate: "G_TRADEOFFS_DELTA_GREP", result: "INCONCLUSIVE", detail: { reason: "static grep check not run" } };
  }
  return {
    gate: "G_TRADEOFFS_DELTA_GREP",
    result: helpers.grepResults.passed ? "PASS" : "FAIL",
    detail: helpers.grepResults,
  };
}

// ─── S_LAYERED_MB_COMPLIANCE (soft) ───
function gateLayeredMbCompliance(allRuns) {
  const target = allRuns.find((r) => r.caseId === "ARC-D2" && r.runIndex === 1 && r.status === "success");
  if (!target) return { gate: "S_LAYERED_MB_COMPLIANCE", result: "INCONCLUSIVE", detail: {} };
  const risk3Archetype = target.fields.failureRisks?.find((f) => f.slot === "founder_fit")?.archetype;
  const mb = target.fields.estimates?.main_bottleneck;
  const risk3IsD = risk3Archetype === "D";
  const mbIsCompliance = mb === "Compliance";
  return {
    gate: "S_LAYERED_MB_COMPLIANCE",
    result: risk3IsD && mbIsCompliance ? "PASS" : "OBSERVE",
    detail: { risk3Archetype, mb, layeredCaseFired: risk3IsD && mbIsCompliance, note: "Soft gate. Risk 3 = D firing is the hard test (G_ARC_D_RISK3 covers it for ARC-D1)." },
  };
}

// ─── S_EVIDENCE_HIGH_MED_STABLE (soft, tier-3 boundary triples) ───
function gateEvidenceHighMedStable(allRuns, byCase) {
  const triples = ["AUDIT-H2", "AUDIT-M1", "OPTZ-MED"];
  const results = [];
  for (const id of triples) {
    const runs = byCase[id];
    if (!runs) continue;
    const levels = [runs.run1, runs.run2, runs.run3].filter((r) => r && r.status === "success" && !r.gateFired).map((r) => r.fields.evidence_strength?.level);
    if (levels.length < 2) continue;
    const stable = levels.every((l) => l === levels[0]);
    results.push({ caseId: id, levels, stable });
  }
  const allStable = results.every((r) => r.stable);
  return {
    gate: "S_EVIDENCE_HIGH_MED_STABLE",
    result: results.length === 0 ? "INCONCLUSIVE" : (allStable ? "PASS" : "OBSERVE"),
    detail: { triples: results, note: "HIGH/MEDIUM boundary cases may legitimately sit near threshold; observational only." },
  };
}

// ─── S_TEMPLATE_LEAD_VARIATION ───
function gateTemplateLeadVariation(allRuns) {
  const cluster = allRuns.filter((r) => r.caseId.startsWith("AUDIT-R") && r.runIndex === 1 && r.status === "success");
  if (cluster.length < 2) return { gate: "S_TEMPLATE_LEAD_VARIATION", result: "INCONCLUSIVE", detail: { reason: "cluster runs missing" } };
  const leads = cluster.map((r) => (r.fields.summary || "").substring(0, THRESHOLDS.TEMPLATE_LEAD_LENGTH));
  const sharedNgram = shareSharedNgram(leads, THRESHOLDS.TEMPLATE_FORBIDDEN_SHARED_NGRAM);
  return {
    gate: "S_TEMPLATE_LEAD_VARIATION",
    result: sharedNgram === null ? "PASS" : "OBSERVE",
    detail: { cases: cluster.map((c) => c.caseId), leads: leads.map((l) => l.substring(0, 60) + "..."), sharedNgram },
  };
}

// ─── S_OR_ACTIONABILITY_HOOK ───
function gateOrActionabilityHook(allRuns) {
  const missing = [];
  for (const r of allRuns.filter((r) => r.pipeline === "PRO" && r.runIndex === 1 && r.status === "success" && !r.gateFired)) {
    const text = r.fields.metricExplanations?.or;
    if (!text) continue;
    if (!regexAnyMatch(text, THRESHOLDS.OR_HOOK_PATTERNS)) {
      missing.push({ caseId: r.caseId, excerpt: text.substring(0, 200) });
    }
  }
  const totalChecked = allRuns.filter((r) => r.pipeline === "PRO" && r.runIndex === 1 && r.status === "success" && !r.gateFired).length;
  const hookRate = totalChecked === 0 ? 0 : (totalChecked - missing.length) / totalChecked;
  return {
    gate: "S_OR_ACTIONABILITY_HOOK",
    result: hookRate >= 0.85 ? "PASS" : "OBSERVE",
    detail: { totalChecked, withHook: totalChecked - missing.length, hookRate: hookRate.toFixed(2), examplesMissing: missing.slice(0, 5) },
  };
}

// ─── S_BIMODALITY_RATE ───
function gateBimodalityRate(allRuns, byCase) {
  let pairs = 0, flips = 0;
  for (const [caseId, runs] of Object.entries(byCase)) {
    const r1 = runs.run1, r2 = runs.run2;
    if (!r1 || !r2 || r1.status !== "success" || r2.status !== "success") continue;
    if (r1.gateFired || r2.gateFired) continue;
    const l1 = r1.fields.evidence_strength?.level;
    const l2 = r2.fields.evidence_strength?.level;
    if (!l1 || !l2) continue;
    pairs++;
    // Count HIGH/MEDIUM flips specifically (P8-S2 finding)
    const isHmFlip = (l1 === "HIGH" && l2 === "MEDIUM") || (l1 === "MEDIUM" && l2 === "HIGH");
    if (isHmFlip) flips++;
  }
  const rate = pairs === 0 ? 0 : flips / pairs;
  let result = "OBSERVE";
  let interpretation = "";
  if (rate < THRESHOLDS.BIMODALITY_RATE_GREEN) {
    result = "PASS";
    interpretation = "P8-S2 fix landed cleanly (flip rate <15%).";
  } else if (rate < THRESHOLDS.BIMODALITY_RATE_YELLOW) {
    result = "OBSERVE";
    interpretation = "Partial improvement (15-30%). Compare against V4S27 38/62 baseline (~62% flip rate).";
  } else {
    result = "OBSERVE"; // soft gate — observation, not failure
    interpretation = "P8-S2 unresolved (>30% flip rate). Escalate to B10b.";
  }
  return {
    gate: "S_BIMODALITY_RATE",
    result,
    detail: { pairs, flips, rate: rate.toFixed(3), v4s27_baseline_rate: 0.62, interpretation },
  };
}

// ─── S_DELTA_VS_V4S27 (informational — emit happens in artifact phase) ───
function gateDeltaVsV4s27() {
  return {
    gate: "S_DELTA_VS_V4S27",
    result: "OBSERVE",
    detail: { note: "Comparison artifact emitted as delta_vs_v4s27.md for B10b consumption. Soft gate — informational only." },
  };
}

// ============================================
// GATE REGISTRY (the lock document)
// ============================================

const GATE_REGISTRY = {
  hard: [
    { name: "G_PIPELINE_COMPLETION", evaluator: gatePipelineCompletion, description: "Every Pro/Free run completes without crash" },
    { name: "G_PARSE_NO_FAILURE", evaluator: gateParseNoFailure, description: "No Stage 2c/3/TC parse errors" },
    { name: "G_REQUIRED_SECTIONS_PRESENT", evaluator: gateRequiredSections, description: "Pro runs have Summary / Risks / MB / scores; Free runs have core fields" },
    { name: "G_GATE_A1_PASS", evaluator: gateA1Pass, description: "V8.1 multi-product canonical (restaurant) passes Haiku gate" },
    { name: "G_GATE_B1_FAIL", evaluator: gateB1Fail, description: "Sparse-FAIL floor holds (SP1 = 'tool for dentists' gates)" },
    { name: "G_GATE_D2_PASS", evaluator: gateD2Pass, description: "V8.1 v3 collapse-pattern rescue passes" },
    { name: "G_TC_MAT1", evaluator: gateTcMat1, description: "TC matrix: spread ≥1.0, monotonic, ±0.5 of {7.5, 7.0, 6.0}; failure → V9.1 trigger" },
    { name: "G_ALPHA_ARITHMETIC", evaluator: gateAlphaArithmetic, description: "Overall = MD*0.375 + MO*0.3125 + OR*0.3125 (±0.05)" },
    { name: "G_FREE_THIN_DIMENSIONS", evaluator: gateFreeThinDimensions, description: "Free LOW emits thin_dimensions array with renamed enum (B9 parity)" },
    { name: "G_OPTION_Z_MEDIUM", evaluator: gateOptionZMedium, description: "OPTZ-MED lands MEDIUM with input-actionable richness gap (B9 v2 contract)" },
    { name: "G_MAT3_NO_FABRICATION", evaluator: gateMat3NoFabrication, description: "MAT3-tech-no-access emits no fabricated procurement/healthcare credentials (V4S27 trust violation)" },
    { name: "G_SPARSE_NO_IMAGINATION", evaluator: gateSparseNoImagination, description: "SP1 gates upstream OR if leaked, emits no fabricated dental landscape" },
    { name: "G_MB_REACHABILITY", evaluator: gateMbReachability, description: "≥6 of 8 Main Bottleneck enum values fire across bank" },
    { name: "G_ARC_D_RISK3", evaluator: gateArcDRisk3, description: "ARC-D1 fires Risk 3 archetype = D" },
    { name: "G_ENUM_COMPLIANCE", evaluator: gateEnumCompliance, description: "No 'workflow' or 'core_feature' in any enum field (V8.1 rename)" },
    { name: "G_EVIDENCE_NO_NULL", evaluator: gateEvidenceNoNull, description: "No null/invalid evidence_strength.level on Pro runs" },
    { name: "G_VARIANCE_EVIDENCE_NO_FLIP", evaluator: gateVarianceEvidenceNoFlip, description: "No input bounces LOW ↔ HIGH across reruns" },
    { name: "G_VARIANCE_RISK3_ARCHETYPE", evaluator: gateVarianceRisk3Archetype, description: "Risk 3 archetype identical across reruns" },
    { name: "G_VARIANCE_MAIN_BOTTLENECK", evaluator: gateVarianceMainBottleneck, description: "Main Bottleneck identical across reruns" },
    { name: "G_VARIANCE_ALPHA", evaluator: gateVarianceAlpha, description: "Overall delta across reruns ≤ 0.3" },
    { name: "G_STAGE1_BLINDNESS", evaluator: gateStage1Blindness, description: "Stage 1 profile-invariant in substance: no profile leak in MD/MO/OR; identical competitor sets within MAT trios" },
    { name: "G_STAGE_TC_PARSE", evaluator: gateStageTcParse, description: "Sherpa G1-LONG-1500W input parses cleanly through Stage TC" },
    { name: "G_TRADEOFFS_DELTA_GREP", evaluator: gateTradeoffsDeltaGrep, description: "B9 sanitation invariant: static grep gates pass on codebase" },
  ],
  soft: [
    { name: "S_LAYERED_MB_COMPLIANCE", evaluator: gateLayeredMbCompliance, description: "ARC-D2 fires Risk 3 = D + Main Bottleneck = Compliance (preferred Layered case)" },
    { name: "S_EVIDENCE_HIGH_MED_STABLE", evaluator: gateEvidenceHighMedStable, description: "H2/M1/OPTZ-MED evidence_strength stable across 3 reruns (boundary cases observational)" },
    { name: "S_TEMPLATE_LEAD_VARIATION", evaluator: gateTemplateLeadVariation, description: "R1/R2/R3 summaries no shared 5-word lead phrase" },
    { name: "S_OR_ACTIONABILITY_HOOK", evaluator: gateOrActionabilityHook, description: "≥85% of Pro OR explanations contain hook phrase (validate/test/verify/etc.)" },
    { name: "S_BIMODALITY_RATE", evaluator: gateBimodalityRate, description: "P8-S2 HIGH/MEDIUM flip rate across all paired cases (vs V4S27 62% baseline)" },
    { name: "S_DELTA_VS_V4S27", evaluator: gateDeltaVsV4s27, description: "delta_vs_v4s27.md emitted for B10b consumption" },
  ],
};

function evaluateAllGates(allRuns, byCase, helpers = {}) {
  const results = { hard: [], soft: [] };
  for (const tier of ["hard", "soft"]) {
    for (const g of GATE_REGISTRY[tier]) {
      try {
        results[tier].push(g.evaluator(allRuns, byCase, helpers));
      } catch (e) {
        results[tier].push({ gate: g.name, result: "FAIL", detail: { error: e.message, stack: e.stack } });
      }
    }
  }
  // Roll-up
  const hardResults = results.hard.map((g) => g.result);
  const overallVerdict = hardResults.every((r) => r === "PASS") ? "B10A_PASS" :
                        hardResults.some((r) => r === "FAIL") ? "B10A_FAIL" : "B10A_INCONCLUSIVE";
  return { results, overallVerdict };
}

module.exports = {
  THRESHOLDS,
  GATE_REGISTRY,
  evaluateAllGates,
};