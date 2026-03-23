import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// POST /api/ideas/[id]/re-evaluate
// Saves a NEW evaluation row on an EXISTING idea.
// The old evaluation is never overwritten — snapshot architecture.
// ============================================
export async function POST(request, { params }) {
  try {
    // ------------------------------------------------
    // 1. Authenticate
    // ------------------------------------------------
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Not authenticated. Please log in." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 }
      );
    }

    // ------------------------------------------------
    // 2. Verify idea exists and belongs to user
    // ------------------------------------------------
    const { id: ideaId } = await params;

    if (!ideaId) {
      return NextResponse.json(
        { error: "Missing idea ID." },
        { status: 400 }
      );
    }

    const { data: idea, error: ideaError } = await supabaseAdmin
      .from("ideas")
      .select("id, user_id, status")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: "Idea not found." },
        { status: 404 }
      );
    }

    if (idea.status === "archived") {
      return NextResponse.json(
        { error: "Cannot re-evaluate an archived idea." },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 3. Parse request body
    // ------------------------------------------------
    const body = await request.json();
    const { analysis, revision_notes } = body;

    if (!analysis) {
      return NextResponse.json(
        { error: "Missing analysis data." },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 4. Insert new evaluation row on existing idea
    // ------------------------------------------------
    const eval_ = analysis.evaluation;

    const { data: evalRow, error: evalError } = await supabaseAdmin
      .from("evaluations")
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        evaluation_mode: "single_call",
        prompt_version: "v2",
        search_strategy_version: "v2_multi_query",
        score_formula_version: "v2_weighted",
        keywords_used: analysis._meta?.keywords_used || [],
        evidence_json: {
          ...(analysis._meta || {}),
          revision_notes: revision_notes || null,
        },
        meta_json: analysis._meta || {},
        competitors_json: analysis.competition?.competitors || [],
        competition_summary: analysis.competition?.differentiation || null,
        data_source: analysis.competition?.data_source || "llm_generated",
        classification: analysis.classification || "commercial",
        scope_warning: analysis.scope_warning || false,
        scoring_json: {
          market_demand: eval_.market_demand,
          monetization: eval_.monetization,
          originality: eval_.originality,
          technical_complexity: eval_.technical_complexity,
          marketplace_note: eval_.marketplace_note || null,
        },
        roadmap_json: analysis.phases || [],
        tools_json: analysis.tools || [],
        estimates_json: analysis.estimates || {},
        market_demand_score: eval_.market_demand?.score || 0,
        originality_score: eval_.originality?.score || 0,
        monetization_score: eval_.monetization?.score || 0,
        technical_complexity_score: eval_.technical_complexity?.score || 0,
        weighted_overall_score: eval_.overall_score || 0,
        summary_text: eval_.summary || "",
      })
      .select("id")
      .single();

    if (evalError) {
      console.error("Re-evaluation insert failed:", evalError);
      return NextResponse.json(
        { error: `Failed to save re-evaluation: ${evalError.message}` },
        { status: 500 }
      );
    }

    // ------------------------------------------------
    // 5. Return success
    // ------------------------------------------------
    return NextResponse.json({
      success: true,
      evaluation_id: evalRow.id,
      idea_id: ideaId,
    });
  } catch (err) {
    console.error("Re-evaluate error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}