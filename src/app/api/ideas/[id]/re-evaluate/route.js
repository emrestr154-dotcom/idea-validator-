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
    const { analysis, revision_notes, alternative_name } = body;

    if (!analysis) {
      return NextResponse.json({ error: "Missing analysis data." }, { status: 400 });
    }

    const evaluation = analysis.evaluation || {};
    const competition = analysis.competition || {};
    const scoring = {
      market_demand: evaluation.market_demand || {},
      monetization: evaluation.monetization || {},
      originality: evaluation.originality || {},
      technical_complexity: evaluation.technical_complexity || {},
      marketplace_note: evaluation.marketplace_note || null,
    };

    const metaJson = {
      ...(analysis._meta || {}),
      revision_notes: revision_notes || null,
    };

    const { data: newEval, error: insertError } = await supabaseAdmin
      .from("evaluations")
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        evaluation_mode: "free_single",
        prompt_version: analysis._meta?.prompt_version || "v3.5",
        search_strategy_version: analysis._meta?.search_strategy_version || "v2",
        score_formula_version: analysis._meta?.score_formula_version || "v2",
        keywords_used: analysis._meta?.keywords_used || null,
        evidence_json: analysis._meta?.evidence || null,
        meta_json: metaJson,
        competitors_json: competition.competitors || [],
        competition_summary: competition.differentiation || "",
        data_source: competition.data_source || "llm_generated",
        classification: analysis.classification || "commercial",
        scope_warning: analysis.scope_warning || false,
        scoring_json: scoring,
        roadmap_json: analysis.phases || [],
        tools_json: analysis.tools || [],
        estimates_json: analysis.estimates || {},
        market_demand_score: evaluation.market_demand?.score || 0,
        monetization_score: evaluation.monetization?.score || 0,
        originality_score: evaluation.originality?.score || 0,
        technical_complexity_score: evaluation.technical_complexity?.score || 0,
        weighted_overall_score: evaluation.overall_score || 0,
        summary_text: evaluation.summary || "",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert re-evaluation failed:", insertError);
      return NextResponse.json(
        { error: "Failed to save alternative: " + insertError.message },
        { status: 500 }
      );
    }

    if (alternative_name) {
      await supabaseAdmin
        .from("ideas")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", ideaId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      evaluation_id: newEval.id,
    });
  } catch (err) {
    console.error("Re-evaluate save error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
