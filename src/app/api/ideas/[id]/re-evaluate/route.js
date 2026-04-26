import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticate(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ============================================
// POST /api/ideas/[id]/re-evaluate
// Save a new evaluation on an existing idea (alternative/branch).
// Does NOT create a new idea — adds evaluation row to same idea.
// Does NOT count against the 5-idea save limit.
// Stores revision_notes and changed_fields in meta_json.
// ============================================
export async function POST(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { id: ideaId } = await params;
    if (!ideaId) {
      return NextResponse.json({ error: "Missing idea ID." }, { status: 400 });
    }

    // Verify idea exists and belongs to user
    const { data: idea, error: ideaError } = await supabaseAdmin
      .from("ideas")
      .select("id, user_id")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }

    const body = await request.json();
    const { analysis, revision_notes, alternative_name, changed_fields } = body;

    if (!analysis) {
      return NextResponse.json({ error: "Missing analysis data." }, { status: 400 });
    }

    // Build scoring_json with failure_risks and evidence_strength included
    const scoringJson = {
      market_demand: analysis.evaluation?.market_demand || null,
      monetization: analysis.evaluation?.monetization || null,
      originality: analysis.evaluation?.originality || null,
      technical_complexity: analysis.evaluation?.technical_complexity || null,
      marketplace_note: analysis.evaluation?.marketplace_note || null,
      failure_risks: analysis.evaluation?.failure_risks || [],
      evidence_strength: analysis.evaluation?.evidence_strength || null,
    };

    // Build meta_json with revision_notes and changed_fields
    const metaJson = {
      ...(analysis._meta || {}),
      revision_notes: revision_notes || null,
      changed_fields: changed_fields || null,
      alternative_name: alternative_name || null,
    };

    // Insert new evaluation row
    const { data: evalData, error: evalError } = await supabaseAdmin
      .from("evaluations")
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        evaluation_mode: analysis._meta?.evaluation_mode || "free_single",
        prompt_version: analysis._meta?.prompt_version || null,
        search_strategy_version: analysis._meta?.search_strategy_version || null,
        score_formula_version: analysis._meta?.score_formula_version || null,
        keywords_used: analysis._meta?.keywords_used || null,
        evidence_json: analysis._meta?.evidence || null,
        meta_json: metaJson,
        competitors_json: analysis.competition?.competitors || [],
        competition_summary: analysis.competition?.differentiation || "",
        data_source: analysis.competition?.data_source || "llm_generated",
        classification: analysis.classification || "commercial",
        scope_warning: analysis.scope_warning || false,
        scoring_json: scoringJson,
        roadmap_json: analysis.phases || [],
        tools_json: analysis.tools || [],
        estimates_json: analysis.estimates || {},
        market_demand_score: analysis.evaluation?.market_demand?.score || 0,
        monetization_score: analysis.evaluation?.monetization?.score || 0,
        originality_score: analysis.evaluation?.originality?.score || 0,
        technical_complexity_score: analysis.evaluation?.technical_complexity?.score || 0,
        weighted_overall_score: analysis.evaluation?.overall_score || 0,
        summary_text: analysis.evaluation?.summary || "",
      })
      .select("id")
      .single();

    if (evalError) {
      console.error("Re-evaluate insert error:", evalError);
      return NextResponse.json(
        { error: "Failed to save evaluation: " + evalError.message },
        { status: 500 }
      );
    }

    // Update idea's updated_at timestamp
    await supabaseAdmin
      .from("ideas")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ideaId)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      evaluation_id: evalData.id,
    });
  } catch (err) {
    console.error("Re-evaluate error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}