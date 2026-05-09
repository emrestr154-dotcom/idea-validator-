// ============================================
// SERPER API
// ============================================
// Searches Google via Serper.dev for real products and companies.
// Returns: title, URL, snippet.
//
// Bundle 3.75 (Layer E mitigation): when IDEALOOP_USE_FIXTURES=1 is set
// on the running Next.js server, returns cached results from
// runners/fixtures/data/ instead of hitting Google. Production
// (Vercel): env var unset, this module behaves identically to
// pre-Bundle-3.75. Real users always get fresh search results; the
// cache only activates for local verification runs.

import { readFixture, writeFixture, isFixtureMode } from "./fixture-store.js";

export async function searchSerper(query) {
  try {
    if (isFixtureMode()) {
      const cached = readFixture("serper", query);
      if (cached) return cached;
    }

    if (!process.env.SERPER_API_KEY) {
      console.error("No Serper API key configured");
      return [];
    }

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 5,
      }),
    });

    if (!response.ok) {
      console.error("Serper API error:", response.status);
      return [];
    }

    const data = await response.json();

    const results = (data.organic || []).slice(0, 5).map((result) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet || "",
      source: "google",
    }));

    if (isFixtureMode()) {
      writeFixture("serper", query, results);
    }

    return results;
  } catch (error) {
    console.error("Serper search failed:", error);
    return [];
  }
}