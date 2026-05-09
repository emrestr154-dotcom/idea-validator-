// ============================================================
// SERPER + GITHUB DRIFT TEST
// ============================================================
// Empirical test: do Serper/GitHub APIs return drifted content for
// byte-identical queries between calls?

const ITERATIONS = 3;
const DELAY_MS = 0; // back-to-back

const SERPER_QUERIES = [
  'insurance claim disputes denied health claims claim recovery app OR startup',
  'denied health claims claim recovery small business insurance software OR product',
];

const GITHUB_QUERIES = [
  'insurance claim disputes denied health claims claim recovery',
  'claim recovery small business insurance claims management',
];

async function callSerper(query) {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });
  if (!response.ok) {
    throw new Error(`Serper failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return (data.organic || []).slice(0, 5).map((r) => ({ url: r.link, title: r.title }));
}

async function callGitHub(query) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'IdeaLoopCore-DriftTest',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return (data.items || []).slice(0, 5).map((r) => ({ url: r.html_url, title: r.full_name }));
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runIterations(label, query, callFn) {
  const iterations = [];
  for (let i = 0; i < ITERATIONS; i++) {
    if (i > 0 && DELAY_MS > 0) await sleep(DELAY_MS);
    const start = Date.now();
    const items = await callFn(query);
    items._timestamp = new Date().toISOString();
    items._latencyMs = Date.now() - start;
    iterations.push(items);
  }
  return iterations;
}

function summarize(label, query, iterations) {
  console.log('\n' + '='.repeat(72));
  console.log(`${label} | "${query}"`);
  console.log('='.repeat(72));

  iterations.forEach((items, idx) => {
    console.log(`\n  Iteration ${idx + 1} (${items._latencyMs}ms, ${items._timestamp}):`);
    items.forEach((it, j) => console.log(`    ${j + 1}. ${it.url}`));
  });

  const allUrls = new Set();
  iterations.forEach((items) => items.forEach((it) => allUrls.add(it.url)));

  const stableUrls = [];
  const driftyUrls = [];
  allUrls.forEach((url) => {
    const appearances = iterations.filter((items) =>
      items.some((it) => it.url === url)
    ).length;
    if (appearances === iterations.length) {
      stableUrls.push(url);
    } else {
      driftyUrls.push({ url, appearances });
    }
  });

  console.log(`\n  ANALYSIS:`);
  console.log(`    Total unique URLs across ${ITERATIONS} iterations: ${allUrls.size}`);
  console.log(`    Stable (in all iterations): ${stableUrls.length}`);
  stableUrls.forEach((url) => console.log(`      ✓ ${url}`));
  console.log(`    Drifty (in some iterations): ${driftyUrls.length}`);
  driftyUrls.forEach(({ url, appearances }) =>
    console.log(`      ✗ [${appearances}/${ITERATIONS}] ${url}`)
  );
  const driftPct = ((driftyUrls.length / allUrls.size) * 100).toFixed(1);
  console.log(`    Drift rate: ${driftPct}% of distinct URLs are unstable`);

  const orderingStable = iterations.every((items, idx) => {
    if (idx === 0) return true;
    const baseUrls = iterations[0].map((it) => it.url).filter((u) => stableUrls.includes(u));
    const thisUrls = items.map((it) => it.url).filter((u) => stableUrls.includes(u));
    return baseUrls.length === thisUrls.length && baseUrls.every((u, i) => u === thisUrls[i]);
  });
  console.log(`    Ordering of stable URLs: ${orderingStable ? 'IDENTICAL' : 'DIFFERS'} across iterations`);

  return { stableCount: stableUrls.length, driftyCount: driftyUrls.length, totalCount: allUrls.size };
}

async function main() {
  if (!process.env.SERPER_API_KEY) {
    console.error('FATAL: SERPER_API_KEY not set');
    process.exit(1);
  }

  console.log(`Drift test starting at ${new Date().toISOString()}`);
  console.log(`Config: ${ITERATIONS} iterations per query, ${DELAY_MS}ms between calls`);

  const summary = [];

  console.log('\n\n========== SERPER QUERIES ==========');
  for (const q of SERPER_QUERIES) {
    const iters = await runIterations('SERPER', q, callSerper);
    const s = summarize('SERPER', q, iters);
    summary.push({ source: 'SERPER', query: q, ...s });
  }

  console.log('\n\n========== GITHUB QUERIES ==========');
  for (const q of GITHUB_QUERIES) {
    const iters = await runIterations('GITHUB', q, callGitHub);
    const s = summarize('GITHUB', q, iters);
    summary.push({ source: 'GITHUB', query: q, ...s });
  }

  console.log('\n\n========== OVERALL SUMMARY ==========');
  summary.forEach((s) => {
    console.log(`  ${s.source} | drift ${s.driftyCount}/${s.totalCount} URLs | "${s.query.slice(0, 50)}..."`);
  });

  const totalDrift = summary.reduce((acc, s) => acc + s.driftyCount, 0);
  const totalUrls = summary.reduce((acc, s) => acc + s.totalCount, 0);
  console.log(`\n  AGGREGATE: ${totalDrift}/${totalUrls} URLs unstable across all queries`);

  if (totalDrift === 0) {
    console.log(`\n  VERDICT: NO drift at 0s gap — Layer E NOT confirmed at instantaneous level.`);
    console.log(`           Drift in B10a is time-dependent. Try DELAY_MS=30000 next.`);
  } else {
    console.log(`\n  VERDICT: DRIFT DETECTED at 0s gap — Layer E confirmed.`);
    console.log(`           APIs are non-deterministic on identical queries even back-to-back.`);
    console.log(`           Cure surface: search-result fixturing for verification + regression runs.`);
  }

  console.log(`\nFinished at ${new Date().toISOString()}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});