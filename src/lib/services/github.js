// ============================================
// GITHUB API
// ============================================
// Searches GitHub repositories for real projects matching the idea.
// Returns: repo name, description, stars, URL, language, last updated.
//
// Bundle 3.75 (Layer E mitigation): when IDEALOOP_USE_FIXTURES=1 is set
// on the running Next.js server, returns cached results from
// runners/fixtures/data/ instead of hitting GitHub. Production
// (Vercel): env var unset, this module behaves identically to
// pre-Bundle-3.75. Real users always get fresh search results; the
// cache only activates for local verification runs.

import { readFixture, writeFixture, isFixtureMode } from "./fixture-store.js";

export async function searchGitHub(query) {
  try {
    if (isFixtureMode()) {
      const cached = readFixture("github", query);
      if (cached) return cached;
    }

    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;

    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "IdeaLoopCore-App",
    };

    // Use token if available for higher rate limits
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error("GitHub API error:", response.status);
      return [];
    }

    const data = await response.json();

    const results = (data.items || []).slice(0, 5).map((repo) => ({
      name: repo.full_name,
      description: repo.description || "No description",
      stars: repo.stargazers_count,
      url: repo.html_url,
      language: repo.language || "Unknown",
      updated: repo.updated_at,
      source: "github",
    }));

    if (isFixtureMode()) {
      writeFixture("github", query, results);
    }

    return results;
  } catch (error) {
    console.error("GitHub search failed:", error);
    return [];
  }
}