// ============================================
// IDEALOOP CORE — USER-REALISTIC TEST RUNNER
// ============================================
// 20 user-realistic tests + 9 same-idea consistency tests + 5 adversarial tests = 34 ideas
// Runs each through FREE and PRO pipelines = 68 total runs
// Captures: scores, explanations, flags, evidence packets, timing
// NEW checks: input-reference quality, writing-bias detection, scope/classification, sparse-input handling
//
// Usage: node run-tests-realistic.js
// Requires: npm install xlsx (run once)
// Server must be running at localhost:3000

const XLSX = require("xlsx");
const BASE_URL = "http://localhost:3000";

// ============================================
// GROUP 1 — ONE-LINERS
// ============================================
const GROUP_1_ONELINERS = [
  { id: 1, name: "Real Estate Listing Writer", group: "1-oneliner", inputStyle: "one-liner",
    expectedRange: "4.0-5.2", regressionAlert: "Overall > 5.5",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Real estate agent" },
    idea: "ai tool for real estate agents to write better listing descriptions faster" },
  { id: 2, name: "AI Tutor for Kids", group: "1-oneliner", inputStyle: "one-liner",
    expectedRange: "4.0-5.0", regressionAlert: "OR > 5.5",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Parent (no tech background)" },
    idea: "an app that teaches my kids math using ai, like a personal tutor that adapts to their level" },
  { id: 3, name: "Podcast Clip Generator", group: "1-oneliner", inputStyle: "one-liner",
    expectedRange: "3.5-4.8", regressionAlert: "Overall > 5.0",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Content creator" },
    idea: "tool that takes my podcast episodes and automatically finds the best clips for tiktok and reels" },
];

// ============================================
// GROUP 2 — BRAIN DUMPS
// ============================================
const GROUP_2_BRAINDUMPS = [
  { id: 4, name: "Restaurant Menu Optimizer", group: "2-braindump", inputStyle: "brain-dump",
    expectedRange: "5.0-6.0", regressionAlert: "MD > 7.0 or OR > 6.0",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Restaurant owner" },
    idea: "ok so i own two restaurants and the thing that kills me is figuring out what to put on the menu and what to take off. i spend hours looking at what sold, what didn't, food costs change every week, and i just guess. i want an AI thing that looks at my sales data and food costs and tells me what dishes are actually making money and which ones i should cut or reprice. also maybe it could suggest new dishes based on what's trending in my area. i know other restaurant owners have this same problem. everyone's just guessing. it's not like we have data scientists on staff lol. maybe it could also help with inventory, like knowing how much to order based on what we'll probably sell next week. sorry if this is messy i'm just typing what's in my head" },
  { id: 5, name: "Freelancer Client Matching", group: "2-braindump", inputStyle: "brain-dump",
    expectedRange: "3.8-4.8", regressionAlert: "MD > 6.0 or MO > 5.5",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Freelance graphic designer" },
    idea: "I'm a freelance designer and finding clients is the worst part of my job. I want to build something where freelancers can get matched with clients who need them, but not like fiverr or upwork where you're competing with thousands of people on price. More like AI analyzes your portfolio and your style and matches you with clients who specifically want that style. And on the client side they describe what they need and the AI finds them the right freelancer instead of them scrolling through hundreds of profiles. It could also handle contracts and invoicing I guess. The matching is the key thing though. Quality over quantity. Maybe charge freelancers a monthly fee for premium matching and clients pay nothing or a small project fee." },
];

// ============================================
// GROUP 3 — KITCHEN-SINK VISIONARIES
// ============================================
const GROUP_3_KITCHENSINK = [
  { id: 6, name: "AI Farming Platform", group: "3-kitchensink", inputStyle: "kitchen-sink",
    expectedRange: "3.5-4.8", regressionAlert: "MD > 6.0 or OR > 5.0",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Agricultural science degree" },
    idea: "An AI-powered agricultural intelligence platform that serves as the operating system for modern farming. It combines satellite imagery analysis for crop health monitoring, soil composition analysis from sensor data, weather prediction models for hyperlocal farm-level forecasts, pest and disease early detection using drone imagery, automated irrigation scheduling, yield prediction, market price forecasting so farmers know when to sell, supply chain optimization connecting farms to buyers, carbon credit tracking for sustainable practices, and a farmer community marketplace for sharing equipment and labor. Think of it as the Bloomberg Terminal for agriculture." },
  { id: 7, name: "AI Life Coach Super-App", group: "3-kitchensink", inputStyle: "kitchen-sink",
    expectedRange: "3.5-4.5", regressionAlert: "MD > 5.5 or MO > 5.0",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Psychology undergrad (no degree completed)" },
    idea: "I want to build the ultimate AI life coach that actually works. Not like those generic meditation apps. This would integrate your calendar, fitness tracker, sleep data, mood journaling, financial goals, career milestones, relationship patterns, and social habits into one AI that truly understands you. It would predict burnout before it happens, suggest schedule optimizations, help you have difficult conversations with scripts and coaching, track your personal growth KPIs, recommend books and podcasts matched to your current challenges, and essentially become your personal chief of staff for life. Monthly subscription $29/month." },
];

// ============================================
// GROUP 4 — COPYCAT WITH TWIST
// ============================================
const GROUP_4_COPYCAT = [
  { id: 8, name: "Notion for Lawyers", group: "4-copycat", inputStyle: "copycat",
    expectedRange: "4.8-5.8", regressionAlert: "OR > 6.0",
    profile: { coding: "Intermediate", ai: "Some AI experience", education: "Law school dropout, now developer" },
    idea: "Basically Notion but specifically built for solo practice lawyers. Case management, client intake forms, document templates, billing time tracking, all connected with AI that can draft motions and summarize case files. Lawyers are still using paper files and basic Word docs. It's insane." },
  { id: 9, name: "Shopify for Services", group: "4-copycat", inputStyle: "copycat",
    expectedRange: "3.8-5.0", regressionAlert: "Overall > 5.5 or OR > 5.0",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "Former small business consultant" },
    idea: "Shopify but for service businesses. Plumbers, cleaners, tutors, personal trainers. Book, pay, review, manage — all in one. AI handles scheduling optimization and customer communication." },
];

// ============================================
// GROUP 5 — PROBLEM-FIRST
// ============================================
const GROUP_5_PROBLEMFIRST = [
  { id: 10, name: "Hiring is Broken", group: "5-problemfirst", inputStyle: "problem-first",
    expectedRange: "3.5-4.5", regressionAlert: "OR > 4.5 or MD > 6.0",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "HR manager at mid-size company" },
    idea: "I spend 70% of my time on hiring and it's so broken. We post on LinkedIn and Indeed, get 400 resumes, 95% are irrelevant, I spend days screening them manually, schedule interviews that go nowhere because the resume looked good but the person isn't right, and by the time we make an offer our top candidate took another job. There has to be a better way to do this with AI. Something that actually understands what we need not just keyword matching." },
  { id: 11, name: "Small Business Accounting Pain", group: "5-problemfirst", inputStyle: "problem-first",
    expectedRange: "4.5-5.5", regressionAlert: "OR > 5.0",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Small business owner (bakery)" },
    idea: "every month i dread doing my books. i have receipts everywhere, invoices from suppliers, i forget to log things, and then my accountant yells at me. i want something where i can just take photos of everything and it handles the rest. categorize expenses, match them to invoices, tell me if i'm profitable this month, and send my accountant what they need without me having to organize anything. im not a tech person at all, it needs to be dead simple" },
];

// ============================================
// GROUP 6 — TECHNICAL BUILDERS
// ============================================
const GROUP_6_TECHNICAL = [
  { id: 12, name: "RAG-Powered Internal Wiki", group: "6-technical", inputStyle: "technical",
    expectedRange: "4.0-5.0", regressionAlert: "OR > 5.0 or MD > 6.0",
    profile: { coding: "Advanced", ai: "Regular AI user", education: "Senior software engineer" },
    idea: "I want to build a RAG pipeline that sits on top of a company's Confluence/Notion/Google Docs and provides actually accurate answers to internal questions. Using a hybrid retrieval approach — dense embeddings for semantic search plus BM25 for exact term matching, with a reranking step using a cross-encoder. The key differentiator is a citation system that links every answer back to the specific document section with confidence scores, plus a feedback loop where employees can flag wrong answers to improve retrieval quality over time. Planning to use pgvector for storage, LangChain for orchestration, and deploy on AWS with a Slack bot interface." },
  { id: 13, name: "Custom Model Fine-Tuning Platform", group: "6-technical", inputStyle: "technical",
    expectedRange: "4.0-5.2", regressionAlert: "OR > 5.5",
    profile: { coding: "Advanced", ai: "Regular AI user", education: "ML engineer" },
    idea: "Platform for non-ML teams to fine-tune open source LLMs on their own data. Upload dataset, pick base model, configure training params through UI, monitor training, deploy to API endpoint. Basically Hugging Face AutoTrain but better UX and more guardrails for production deployment." },
];

// ============================================
// GROUP 7 — EDGE CASES
// ============================================
const GROUP_7_EDGECASES = [
  { id: 14, name: "Already Exists Exactly (Summarizer)", group: "7-edge", inputStyle: "edge-case",
    expectedRange: "2.5-3.8", regressionAlert: "Overall > 4.5 or OR > 4.0",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Marketing background" },
    idea: "An AI tool where you paste a long article or report and it gives you a summary in bullet points, key takeaways, and lets you ask questions about the document. Could also handle PDFs and maybe even YouTube video transcripts." },
  { id: 15, name: "Customs Doc Validator (Good Idea Bad Writing)", group: "7-edge", inputStyle: "edge-case",
    expectedRange: "5.0-6.2", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Logistics coordinator" },
    idea: "ai for customs broker to check document before submit. many time rejected because wrong code or missing paper, cost company lot money each time. need tool check everything automatic before send to government" },
  { id: 16, name: "Wedding Planning Service-as-SaaS", group: "7-edge", inputStyle: "edge-case",
    expectedRange: "4.0-5.0", regressionAlert: "",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Event planning background" },
    idea: "An AI-powered wedding planning service where couples tell us their budget, style preferences, and guest count, and we plan their entire wedding — venue recommendations, vendor booking, timeline creation, budget tracking, and day-of coordination checklists. We handle everything so they don't have to stress." },
  { id: 17, name: "Homeless Shelter Network (Social Impact)", group: "7-edge", inputStyle: "edge-case",
    expectedRange: "5.0-6.0", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Social work background" },
    idea: "I want to build a tool for homeless shelters to better manage bed availability, match people to services they qualify for, and track outcomes across the network of shelters in a city. Right now shelters use paper, phone calls, and outdated spreadsheets. People get turned away from one shelter that's full when there are beds available a mile away. This isn't about making money, it's about saving lives." },
  { id: 18, name: "Influencer Analytics Pivot", group: "7-edge", inputStyle: "edge-case",
    expectedRange: "5.2-6.2", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "Previously ran a SaaS product" },
    idea: "Last year I built a social media scheduling tool and it flopped because Buffer and Hootsuite are too dominant. But I noticed something — the influencer agencies I talked to all have the same problem: they manage 20-50 creator accounts and can't track which content performs across all of them in one place. Each platform has its own analytics. They're copying numbers into spreadsheets manually. I want to build a cross-platform analytics aggregator specifically for influencer management agencies. Not individual creators, not brands — specifically the agencies. API connections to Instagram, TikTok, YouTube, Twitter, pull all performance data into one dashboard per client, with AI-powered content performance predictions." },
  { id: 19, name: "Smart Beehive Monitor (Hardware+SW)", group: "7-edge", inputStyle: "edge-case",
    expectedRange: "4.5-5.5", regressionAlert: "",
    profile: { coding: "Intermediate", ai: "Some AI experience", education: "Electrical engineering background" },
    idea: "A smart beehive monitoring system. Sensors inside the hive measure temperature, humidity, weight, and sound patterns. AI analyzes the data to detect queen loss, swarming preparation, disease onset, and honey production readiness. Sends alerts to the beekeeper's phone. Subscription for the AI analysis, hardware sold at cost. Targeting commercial beekeepers with 50+ hives who can't physically inspect every hive every week." },
  { id: 20, name: "Near-Empty Prompt (ai app for pets)", group: "7-edge", inputStyle: "edge-case",
    expectedRange: "2.0-4.0", regressionAlert: "Overall > 5.0",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Student" },
    idea: "ai app for pets" },
];

// ============================================
// GROUP 8 — SAME IDEA × 3 FORMATS (consistency test)
// ============================================
const GROUP_8_CONSISTENCY = [
  // Idea A: Restaurant menu tool — 3 formats
  { id: 21, name: "Menu Tool — Minimal", group: "8-consistency-A", inputStyle: "consistency-minimal",
    expectedRange: "4.5-6.0", regressionAlert: "",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Restaurant owner" },
    idea: "ai tool to help restaurants figure out which menu items to keep and which to cut" },
  { id: 22, name: "Menu Tool — Messy", group: "8-consistency-A", inputStyle: "consistency-messy",
    expectedRange: "4.5-6.0", regressionAlert: "",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Restaurant owner" },
    idea: "so basically I run a restaurant and I never know what to put on the menu. some dishes sell great but the margins suck, others nobody orders but they're cheap to make. I change the menu every season and it's always a guess. food costs go up and down. I just want something that connects to my POS system and tells me what's actually profitable and what I should drop or reprice. every restaurant owner I know has this problem" },
  { id: 23, name: "Menu Tool — Polished", group: "8-consistency-A", inputStyle: "consistency-polished",
    expectedRange: "4.5-6.0", regressionAlert: "",
    profile: { coding: "Beginner", ai: "No AI experience", education: "Restaurant owner" },
    idea: "An AI-powered menu optimization tool for independent restaurants. Integrates with POS systems to analyze dish-level profitability by combining sales volume, food cost fluctuations, and contribution margins. Recommends menu changes — which items to keep, cut, reprice, or promote — based on data rather than intuition. Targets independent restaurant owners who lack the data analytics capabilities of large chains. Could expand into inventory forecasting and trend-based dish suggestions." },

  // Idea B: Recruiting tool — 3 formats
  { id: 24, name: "Recruiting Tool — Minimal", group: "8-consistency-B", inputStyle: "consistency-minimal",
    expectedRange: "3.5-5.0", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "HR manager at mid-size company" },
    idea: "ai that screens job applicants better than keyword matching" },
  { id: 25, name: "Recruiting Tool — Messy", group: "8-consistency-B", inputStyle: "consistency-messy",
    expectedRange: "3.5-5.0", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "HR manager at mid-size company" },
    idea: "hiring is such a mess. we get hundreds of resumes and most are garbage but the ATS just does keyword matching so good people slip through and bad matches get interviews. I want AI that actually reads the resume and understands if this person can do the job, not just if they used the right buzzwords. also scheduling interviews takes forever and half the time people ghost. there's gotta be a smarter way" },
  { id: 26, name: "Recruiting Tool — Polished", group: "8-consistency-B", inputStyle: "consistency-polished",
    expectedRange: "3.5-5.0", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "HR manager at mid-size company" },
    idea: "An AI-powered applicant screening system that goes beyond keyword matching. Uses natural language understanding to evaluate resume-job fit based on actual skills, experience relevance, and career trajectory rather than keyword density. Integrates with existing ATS platforms (Greenhouse, Lever) as a screening layer. Targets mid-size companies (50-500 employees) that receive high application volumes but lack dedicated recruiting operations teams." },

  // Idea C: Customs tool — 3 formats (tests writing quality bias directly)
  { id: 27, name: "Customs Tool — Minimal", group: "8-consistency-C", inputStyle: "consistency-minimal",
    expectedRange: "5.0-6.2", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Logistics coordinator" },
    idea: "ai to check customs documents before submitting to avoid rejections" },
  { id: 28, name: "Customs Tool — Broken English", group: "8-consistency-C", inputStyle: "consistency-messy",
    expectedRange: "5.0-6.2", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Logistics coordinator" },
    idea: "ai for customs broker to check document before submit. many time rejected because wrong code or missing paper, cost company lot money each time. need tool check everything automatic before send to government" },
  { id: 29, name: "Customs Tool — Polished", group: "8-consistency-C", inputStyle: "consistency-polished",
    expectedRange: "5.0-6.2", regressionAlert: "",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Logistics coordinator" },
    idea: "An AI-powered customs document validation tool for freight forwarders and customs brokers. Pre-screens export/import documentation — HS codes, commercial invoices, packing lists, certificates of origin — against destination country requirements before submission. Catches common rejection reasons: incorrect tariff classifications, missing supporting documents, format non-compliance. Each rejected submission costs companies $200-500 in delays and re-filing fees. Targets mid-size customs brokerages processing 100+ shipments monthly." },
];

// ============================================
// GROUP 9 — ADVERSARIAL INPUTS
// ============================================
const GROUP_9_ADVERSARIAL = [
  { id: 30, name: "Overconfident Bad Idea", group: "9-adversarial", inputStyle: "adversarial",
    expectedRange: "3.0-4.5", regressionAlert: "Overall > 5.0",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "Business student" },
    idea: "This is going to be MASSIVE. Nobody is doing this yet. An AI that generates personalized motivational quotes every morning based on your mood and goals. Users post them on Instagram with our watermark — free marketing. Revenue from premium quote packs and branded partnerships. This is basically Calm meets Instagram meets AI. I already have 500 followers who said they'd use it." },
  { id: 31, name: "Emotional Persuasion", group: "9-adversarial", inputStyle: "adversarial",
    expectedRange: "3.5-5.0", regressionAlert: "MD > 6.0",
    profile: { coding: "Beginner", ai: "Some AI experience", education: "Former teacher" },
    idea: "I really believe this could change lives. As a teacher I watched so many kids fall behind because they were too embarrassed to ask for help. I want to build an AI homework helper that kids can talk to without judgment — it explains things at their level, never makes them feel stupid, encourages them, and alerts parents when their child is struggling with a specific topic. Every parent I've talked to says they would pay for this. This is personal to me, I've seen the damage that happens when kids give up on learning." },
  { id: 32, name: "Fake Specificity", group: "9-adversarial", inputStyle: "adversarial",
    expectedRange: "3.5-4.5", regressionAlert: "Overall > 5.0 or MD > 5.5",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "MBA student" },
    idea: "AI-powered micro-SaaS for dental practices that predicts patient no-show probability using historical appointment data, weather patterns, day-of-week analysis, and patient communication sentiment. Reduces no-show rate from industry average of 23% to under 8%. $149/month per practice. TAM: 200,000 dental practices in the US alone. Integration with Dentrix and Open Dental practice management systems. 6-month payback period for the average practice." },
  { id: 33, name: "Uber for X (Structural Mismatch)", group: "9-adversarial", inputStyle: "adversarial",
    expectedRange: "3.5-4.8", regressionAlert: "Overall > 5.5",
    profile: { coding: "Beginner", ai: "Regular AI user", education: "General interest" },
    idea: "Uber for home repairs. Open the app, describe your problem (leaky faucet, broken outlet, stuck door), AI estimates the job and price, instantly matches you with a nearby verified handyman, they show up within 2 hours. Rating system, guaranteed pricing, AI-powered quality verification through before/after photos." },
  { id: 34, name: "Half-Correct Technical Idea", group: "9-adversarial", inputStyle: "adversarial",
    expectedRange: "4.0-5.0", regressionAlert: "OR > 5.5",
    profile: { coding: "Intermediate", ai: "Regular AI user", education: "Data analyst" },
    idea: "An AI tool that monitors your competitor's websites and automatically detects pricing changes, new feature launches, messaging pivots, and hiring patterns. Uses web scraping + LLM analysis to generate weekly competitive intelligence briefings. The AI identifies strategic signals — like if a competitor starts hiring ML engineers, it means they're building AI features and you should accelerate yours. Fully automated, no manual research needed." },
];

// ============================================
// COMBINE ALL TESTS
// ============================================
const TEST_SUITE = [
  ...GROUP_1_ONELINERS,
  ...GROUP_2_BRAINDUMPS,
  ...GROUP_3_KITCHENSINK,
  ...GROUP_4_COPYCAT,
  ...GROUP_5_PROBLEMFIRST,
  ...GROUP_6_TECHNICAL,
  ...GROUP_7_EDGECASES,
  ...GROUP_8_CONSISTENCY,
  ...GROUP_9_ADVERSARIAL,
];

// ============================================
// DETECTION HELPERS
// ============================================

const CONTAM_PHRASES = ["room for", "opportunity for", "clear demand", "strong demand", "window is closing", "promising market", "open market", "crowded market", "limited differentiation", "strong differentiation", "meaningful wedge", "sufficient", "insufficient", "viable path", "not viable", "accessible", "blocked", "favorable", "unfavorable"];
const POS = ["clear", "proven", "demonstrated", "strong", "growing", "established", "active demand", "willingness to pay", "genuine", "real wedge"];
const NEG = ["severely limited", "no viable", "no capturable", "structurally weak", "no clear", "eliminates", "impossible", "fragile", "weak pricing", "strong free substitutes", "high friction"];

function checkContam(text) { if (!text) return []; const l = text.toLowerCase(); return CONTAM_PHRASES.filter(p => l.includes(p)); }
function checkCon(score, exp) { if (!score || !exp) return "N/A"; const l = exp.toLowerCase(); const p = POS.some(s => l.includes(s)); const n = NEG.some(s => l.includes(s)); if (score >= 6.5 && n && !p) return "⚠️ HIGH+NEG"; if (score <= 4.0 && p && !n) return "⚠️ LOW+POS"; return "OK"; }
function checkDC(names, md, mo, or_) { if (!names?.length) return { f: false, d: "" }; const found = {}; for (const name of names) { const l = name.toLowerCase(); let c = 0; const m = []; if (md?.toLowerCase().includes(l)) { c++; m.push("MD"); } if (mo?.toLowerCase().includes(l)) { c++; m.push("MO"); } if (or_?.toLowerCase().includes(l)) { c++; m.push("OR"); } if (c >= 3) found[name] = m.join("+"); } return { f: Object.keys(found).length > 0, d: Object.entries(found).map(([k, v]) => k + "(" + v + ")").join(", ") }; }

// NEW: Check if explanation references what user actually wrote
function checkInputRef(idea, explanation) {
  if (!explanation || !idea) return "N/A";
  // For very short ideas (<20 words), check if explanation acknowledges limited info
  const wordCount = idea.trim().split(/\s+/).length;
  const l = explanation.toLowerCase();
  if (wordCount <= 10) {
    const sparseAck = ["limited detail", "not specified", "doesn't specify", "does not specify", "no detail", "sparse", "unclear from", "not enough", "description lacks", "doesn't identify", "does not identify", "doesn't mention", "does not mention", "brief description", "minimal detail", "without specif", "not described", "unspecified", "vague"];
    return sparseAck.some(s => l.includes(s)) ? "✅ Sparse-ack" : "❌ No sparse-ack";
  }
  return "N/A (long input)";
}

// ============================================
// SSE PARSER + EVALUATION RUNNER
// ============================================

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

function extract(result, test) {
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

  // Evidence packets (PRO only)
  const packets = result._pro?.evidence_packets || {};
  const mdFacts = (packets.market_demand?.admissible_facts || []).join(" | ");
  const moFacts = (packets.monetization?.admissible_facts || []).join(" | ");
  const orFacts = (packets.originality?.admissible_facts || []).join(" | ");
  const mdPos = packets.market_demand?.strongest_positive || "";
  const mdNeg = packets.market_demand?.strongest_negative || "";
  const moPos = packets.monetization?.strongest_positive || "";
  const moNeg = packets.monetization?.strongest_negative || "";
  const orPos = packets.originality?.strongest_positive || "";
  const orNeg = packets.originality?.strongest_negative || "";

  // Cross-packet contamination
  const packetContam = [];
  if (orFacts.toLowerCase().match(/could build|can build|would build|build internal|build custom|build their own|using llm apis|using ai tools|using existing tools|using vector databases|commonly build|are building custom/)) packetContam.push("OR has build-language");

  // NEW: Input reference checks
  const mdInputRef = checkInputRef(test.idea, mdExp);
  const moInputRef = checkInputRef(test.idea, moExp);
  const orInputRef = checkInputRef(test.idea, orExp);

  // NEW: Classification and scope checks
  const classification = result.classification || "";
  const scopeWarning = result.scope_warning || false;

  return {
    md, mo, or: or_, tc, overall: ev.overall_score,
    confidence: ev.confidence_level?.level, confidenceReason: ev.confidence_level?.reason || "",
    mdExp, moExp, orExp, tcExp,
    tcBaseExp: ev.technical_complexity?.base_score_explanation || "",
    tcAdjExp: ev.technical_complexity?.adjustment_explanation || "",
    summary: ev.summary || "", failureRisks: (ev.failure_risks || []).join(" | "),
    compCount: comps.length, typeStr: Object.entries(types).map(([k,v]) => k+":"+v).join(", "),
    evStr: Object.entries(evS).map(([k,v]) => k+":"+v).join(", "),
    compNames: compNames.join(", "),
    isHighTrust: flags.is_high_trust || false, isMarketplace: flags.is_marketplace || false,
    isConsumerHabit: flags.is_consumer_habit || false, isPlatformFraming: flags.is_platform_framing || false,
    llmSubRisk: flags.llm_substitution_risk || "", llmSubReasoning: flags.llm_substitution_reasoning || "",
    reqRelDisplacement: flags.requires_relationship_displacement || false,
    diff, landscape, barriers,
    contamFound: allC.length > 0, contamPhrases: [...new Set(allC)].join(", "),
    mdCon: checkCon(md, mdExp), moCon: checkCon(mo, moExp), orCon: checkCon(or_, orExp),
    dcFlagged: dc.f, dcDetails: dc.d,
    incrementalNote: ev.technical_complexity?.incremental_note || "",
    geoNote: ev.market_demand?.geographic_note || "", trajNote: ev.market_demand?.trajectory_note || "",
    marketplaceNote: ev.marketplace_note || "",
    mdFacts, moFacts, orFacts, mdPos, mdNeg, moPos, moNeg, orPos, orNeg,
    packetContam: packetContam.length > 0, packetContamDetails: packetContam.join(", "),
    // NEW fields
    mdInputRef, moInputRef, orInputRef,
    classification, scopeWarning,
    inputStyle: test.inputStyle,
    wordCount: test.idea.trim().split(/\s+/).length,
  };
}

// ============================================
// MAIN
// ============================================

async function main() {
  const results = [];
  const total = TEST_SUITE.length * 2;
  let done = 0;

  console.log("============================================");
  console.log("IDEALOOP CORE — USER-REALISTIC TEST SUITE");
  console.log(TEST_SUITE.length + " ideas x 2 pipelines = " + total + " tests");
  console.log("Estimated: 100-170 minutes");
  console.log("============================================\n");

  for (const test of TEST_SUITE) {
    for (const pipeline of ["FREE", "PRO"]) {
      done++;
      console.log("\n[" + done + "/" + total + "] Test " + test.id + " — " + test.name + " (" + pipeline + ") [" + test.inputStyle + "]");
      const t0 = Date.now();
      try {
        const result = await runEval(test.idea, test.profile, pipeline);
        const data = extract(result, test);
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        if (data) {
          console.log("  ✅ " + elapsed + "s — MD:" + data.md + " MO:" + data.mo + " OR:" + data.or + " TC:" + data.tc + " Overall:" + data.overall + " [" + data.confidence + "]");
          if (data.contamFound) console.log("  🔍 CONTAMINATION: " + data.contamPhrases);
          if (data.dcFlagged) console.log("  🔍 DOUBLE-COUNT: " + data.dcDetails);
          if (data.packetContam) console.log("  🔍 PACKET LEAK: " + data.packetContamDetails);
          if (data.scopeWarning) console.log("  📋 SCOPE WARNING fired");
          if (data.classification === "social_impact") console.log("  🌍 SOCIAL IMPACT classification");
          if (test.regressionAlert) {
            let reg = false;
            const a = test.regressionAlert;
            if (a.includes("Overall >") && data.overall > parseFloat(a.match(/Overall > ([\d.]+)/)?.[1])) reg = true;
            if (a.includes("MD >") && data.md > parseFloat(a.match(/MD > ([\d.]+)/)?.[1])) reg = true;
            if (a.includes("MO >") && data.mo > parseFloat(a.match(/MO > ([\d.]+)/)?.[1])) reg = true;
            if (a.includes("OR >") && data.or > parseFloat(a.match(/OR > ([\d.]+)/)?.[1])) reg = true;
            if (reg) console.log("  ⚠️  REGRESSION: " + a);
          }
          results.push({ testId: test.id, name: test.name, group: test.group, pipeline, expected: test.expectedRange, regAlert: test.regressionAlert || "", elapsed: parseFloat(elapsed), status: "✅ OK", err: "", ...data });
        } else {
          results.push({ testId: test.id, name: test.name, group: test.group, pipeline, expected: test.expectedRange, regAlert: test.regressionAlert || "", elapsed: parseFloat(elapsed), status: "❌ NO SCORES", err: "No eval" });
        }
      } catch (e) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log("  ❌ FAILED (" + elapsed + "s) — " + e.message);
        results.push({ testId: test.id, name: test.name, group: test.group, pipeline, expected: test.expectedRange, regAlert: test.regressionAlert || "", elapsed: parseFloat(elapsed), status: "❌ FAILED", err: e.message });
      }
    }
  }

  // ============================================
  // GENERATE EXCEL WORKBOOK
  // ============================================
  console.log("\nGenerating Excel...");
  const wb = XLSX.utils.book_new();

  // Sheet 1: All Results
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({
    Test: r.testId, Idea: r.name, Group: r.group, Style: r.inputStyle || "", Words: r.wordCount || "",
    Pipeline: r.pipeline, MD: r.md ?? "", MO: r.mo ?? "", OR: r.or ?? "", TC: r.tc ?? "", Overall: r.overall ?? "",
    Confidence: r.confidence ?? "", Classification: r.classification || "", "Scope Warn": r.scopeWarning ? "YES" : "",
    "High Trust": r.isHighTrust ? "YES" : "", "LLM Sub": r.llmSubRisk ?? "",
    Contamination: r.contamFound ? "⚠️" : "✅", "Double Count": r.dcFlagged ? "⚠️" : "✅",
    "Packet Leak": r.packetContam ? "⚠️" : "✅",
    Expected: r.expected, "Time(s)": r.elapsed, Status: r.status
  }))), "All Results");

  // Sheet 2: Explanations (full text for manual review)
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({
    Test: r.testId, Idea: r.name, Style: r.inputStyle || "", Pipeline: r.pipeline,
    "MD Score": r.md ?? "", "MD Exp": r.mdExp ?? "",
    "MO Score": r.mo ?? "", "MO Exp": r.moExp ?? "",
    "OR Score": r.or ?? "", "OR Exp": r.orExp ?? "",
    "TC Score": r.tc ?? "", "TC Base": r.tcBaseExp ?? "", "TC Adj": r.tcAdjExp ?? "", "TC Exp": r.tcExp ?? "",
    Summary: r.summary ?? "", "Failure Risks": r.failureRisks ?? "",
    "Conf Level": r.confidence ?? "", "Conf Reason": r.confidenceReason ?? ""
  }))), "Explanations");

  // Sheet 3: Consistency Analysis (Group 8 — same idea × 3 formats)
  const consistencyTests = results.filter(r => r.group?.startsWith("8-consistency"));
  const consistencyRows = [];
  for (const baseGroup of ["8-consistency-A", "8-consistency-B", "8-consistency-C"]) {
    for (const pipeline of ["FREE", "PRO"]) {
      const group = consistencyTests.filter(r => r.group === baseGroup && r.pipeline === pipeline);
      if (group.length < 2) continue;
      const minimal = group.find(r => r.inputStyle === "consistency-minimal");
      const messy = group.find(r => r.inputStyle === "consistency-messy");
      const polished = group.find(r => r.inputStyle === "consistency-polished");
      const scores = [minimal, messy, polished].filter(Boolean);
      const mdRange = scores.map(s => s.md).filter(v => v != null);
      const moRange = scores.map(s => s.mo).filter(v => v != null);
      const orRange = scores.map(s => s.or).filter(v => v != null);
      const oaRange = scores.map(s => s.overall).filter(v => v != null);
      const spread = arr => arr.length >= 2 ? (Math.max(...arr) - Math.min(...arr)).toFixed(1) : "N/A";
      consistencyRows.push({
        "Idea Group": baseGroup.replace("8-consistency-", ""), Pipeline: pipeline,
        "Min MD": minimal?.md ?? "", "Messy MD": messy?.md ?? "", "Polish MD": polished?.md ?? "", "MD Spread": spread(mdRange),
        "Min MO": minimal?.mo ?? "", "Messy MO": messy?.mo ?? "", "Polish MO": polished?.mo ?? "", "MO Spread": spread(moRange),
        "Min OR": minimal?.or ?? "", "Messy OR": messy?.or ?? "", "Polish OR": polished?.or ?? "", "OR Spread": spread(orRange),
        "Min OA": minimal?.overall ?? "", "Messy OA": messy?.overall ?? "", "Polish OA": polished?.overall ?? "", "OA Spread": spread(oaRange),
        "BIAS?": oaRange.length >= 2 && (Math.max(...oaRange) - Math.min(...oaRange)) > 1.5 ? "⚠️ POSSIBLE BIAS" : "OK"
      });
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(consistencyRows), "Consistency");

  // Sheet 4: Input Quality Analysis
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({
    Test: r.testId, Idea: r.name, Style: r.inputStyle || "", Words: r.wordCount || "",
    Pipeline: r.pipeline, Overall: r.overall ?? "",
    "MD Input Ref": r.mdInputRef ?? "", "MO Input Ref": r.moInputRef ?? "", "OR Input Ref": r.orInputRef ?? "",
    "Confidence": r.confidence ?? ""
  }))), "Input Quality");

  // Sheet 5: Competition & Domain Flags
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({
    Test: r.testId, Idea: r.name, Pipeline: r.pipeline,
    Count: r.compCount ?? "", Types: r.typeStr ?? "", Evidence: r.evStr ?? "",
    Names: r.compNames ?? "",
    "High Trust": r.isHighTrust ? "YES" : "", Marketplace: r.isMarketplace ? "YES" : "",
    "Consumer Habit": r.isConsumerHabit ? "YES" : "", "Platform Framing": r.isPlatformFraming ? "YES" : "",
    "LLM Sub Risk": r.llmSubRisk ?? "", "LLM Reasoning": r.llmSubReasoning ?? "",
    "Rel Displacement": r.reqRelDisplacement ? "YES" : "",
    Classification: r.classification || "", "Scope Warning": r.scopeWarning ? "YES" : ""
  }))), "Flags & Competition");

  // Sheet 6: Evidence Packets (PRO only)
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.filter(r => r.pipeline === "PRO").map(r => ({
    Test: r.testId, Idea: r.name,
    "MD Facts": r.mdFacts ?? "", "MD +": r.mdPos ?? "", "MD -": r.mdNeg ?? "",
    "MO Facts": r.moFacts ?? "", "MO +": r.moPos ?? "", "MO -": r.moNeg ?? "",
    "OR Facts": r.orFacts ?? "", "OR +": r.orPos ?? "", "OR -": r.orNeg ?? "",
    "Packet Leak": r.packetContam ? "⚠️" : "Clean", "Leak Details": r.packetContamDetails ?? ""
  }))), "Evidence Packets");

  // Sheet 7: Adversarial Analysis (Group 9)
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.filter(r => r.group === "9-adversarial").map(r => ({
    Test: r.testId, Idea: r.name, Pipeline: r.pipeline,
    MD: r.md ?? "", MO: r.mo ?? "", OR: r.or ?? "", TC: r.tc ?? "", Overall: r.overall ?? "",
    "MD Consistency": r.mdCon ?? "", "MO Consistency": r.moCon ?? "", "OR Consistency": r.orCon ?? "",
    Confidence: r.confidence ?? "", "Failure Risks": r.failureRisks ?? "",
    Expected: r.expected, "Regression": r.regAlert || ""
  }))), "Adversarial");

  // Sheet 8: TC Distribution
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({
    Idea: r.name, Pipeline: r.pipeline, TC: r.tc ?? "",
    "TC Base": r.tcBaseExp ?? "", "TC Adj": r.tcAdjExp ?? "", "TC Exp": r.tcExp ?? "",
    Incremental: r.incrementalNote ?? "",
    Profile: (TEST_SUITE.find(t => t.id === r.testId)?.profile.coding || "") + " / " + (TEST_SUITE.find(t => t.id === r.testId)?.profile.ai || "")
  }))), "TC Distribution");

  // Sheet 9: Timing
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.map(r => ({
    Test: r.testId, Idea: r.name, Pipeline: r.pipeline, Style: r.inputStyle || "",
    Words: r.wordCount || "", "Time(s)": r.elapsed
  }))), "Timing");

  const fn = "IdeaLoopCore_UserRealistic_Results_" + new Date().toISOString().slice(0, 10) + ".xlsx";
  XLSX.writeFile(wb, fn);

  // ============================================
  // CONSOLE SUMMARY
  // ============================================
  console.log("\n✅ Saved: " + fn);
  console.log("   " + results.filter(r => r.status === "✅ OK").length + "/" + total + " passed, " + results.filter(r => r.status !== "✅ OK").length + " failed");

  // Score summary table
  console.log("\n============================================\nSCORE SUMMARY\n============================================");
  console.log("Idea                               | Style          | FREE            | PRO             | Δ OA");
  console.log("                                   |                | MD  MO  OR  TC  | MD  MO  OR  TC  |");
  console.log("-----------------------------------|----------------|-----------------|-----------------|------");
  for (const t of TEST_SUITE) {
    const f = results.find(r => r.testId === t.id && r.pipeline === "FREE");
    const p = results.find(r => r.testId === t.id && r.pipeline === "PRO");
    const pad = v => v != null ? String(v).padEnd(4) : "—   ";
    const name = t.name.substring(0, 35).padEnd(35);
    const style = (t.inputStyle || "").substring(0, 14).padEnd(14);
    const fS = f?.md != null ? pad(f.md)+pad(f.mo)+pad(f.or)+pad(f.tc) : "FAIL            ";
    const pS = p?.md != null ? pad(p.md)+pad(p.mo)+pad(p.or)+pad(p.tc) : "FAIL            ";
    const delta = (f?.overall != null && p?.overall != null) ? (p.overall - f.overall).toFixed(2) : "—";
    console.log(name + "| " + style + " | " + fS + "| " + pS + "| " + delta);
  }

  // Consistency analysis
  console.log("\n============================================\nCONSISTENCY ANALYSIS (Same Idea × 3 Formats)\n============================================");
  for (const baseGroup of ["8-consistency-A", "8-consistency-B", "8-consistency-C"]) {
    const label = baseGroup.replace("8-consistency-", "Idea ");
    for (const pipeline of ["FREE", "PRO"]) {
      const group = results.filter(r => r.group === baseGroup && r.pipeline === pipeline && r.overall != null);
      if (group.length < 2) continue;
      const oaScores = group.map(g => g.overall);
      const spread = (Math.max(...oaScores) - Math.min(...oaScores)).toFixed(1);
      const flag = parseFloat(spread) > 1.5 ? " ⚠️ WRITING BIAS?" : " ✅";
      console.log("  " + label + " (" + pipeline + "): " + group.map(g => g.name.split("—")[1]?.trim() + ":" + g.overall).join(", ") + " | spread:" + spread + flag);
    }
  }

  // Adversarial results
  console.log("\n============================================\nADVERSARIAL RESULTS\n============================================");
  results.filter(r => r.group === "9-adversarial").forEach(r => {
    const flag = r.regressionAlert ? ((() => { let reg = false; const a = r.regAlert; if (a.includes("Overall >") && r.overall > parseFloat(a.match(/Overall > ([\d.]+)/)?.[1])) reg = true; if (a.includes("MD >") && r.md > parseFloat(a.match(/MD > ([\d.]+)/)?.[1])) reg = true; if (a.includes("MO >") && r.mo > parseFloat(a.match(/MO > ([\d.]+)/)?.[1])) reg = true; if (a.includes("OR >") && r.or > parseFloat(a.match(/OR > ([\d.]+)/)?.[1])) reg = true; return reg ? " ⚠️ REGRESSION" : " ✅"; })()) : " ✅";
    console.log("  " + r.name + " (" + r.pipeline + "): " + r.overall + flag);
  });

  // Edge case checks
  console.log("\n============================================\nEDGE CASE CHECKS\n============================================");
  const t14 = results.filter(r => r.testId === 14);
  t14.forEach(r => console.log("  Already-Exists (" + r.pipeline + "): OR=" + r.or + " LLM_sub=" + r.llmSubRisk + (r.or > 4.0 ? " ⚠️ OR too high" : " ✅")));
  const t16 = results.filter(r => r.testId === 16);
  t16.forEach(r => console.log("  Service-as-SaaS (" + r.pipeline + "): scope_warning=" + r.scopeWarning + (r.scopeWarning ? " ✅" : " ❌ Should have fired")));
  const t17 = results.filter(r => r.testId === 17);
  t17.forEach(r => console.log("  Social Impact (" + r.pipeline + "): classification=" + r.classification + (r.classification === "social_impact" ? " ✅" : " ❌ Wrong classification")));
  const t20 = results.filter(r => r.testId === 20);
  t20.forEach(r => console.log("  Near-Empty (" + r.pipeline + "): confidence=" + r.confidence + " overall=" + r.overall + (r.confidence === "LOW" ? " ✅" : " ❌ Should be LOW")));

  // Contamination summary
  const contam = results.filter(r => r.contamFound && r.pipeline === "PRO");
  console.log("\n🔍 Contamination: " + contam.length + "/" + results.filter(r => r.pipeline === "PRO" && r.status === "✅ OK").length + " PRO runs have judgment phrases");
  contam.forEach(r => console.log("   " + r.name + ": " + r.contamPhrases));

  // TC clustering
  const tcs = results.filter(r => r.tc != null).map(r => r.tc);
  const tc75 = tcs.filter(s => s === 7.5).length;
  console.log("\n🔍 TC clustering: " + tc75 + "/" + tcs.length + " are 7.5 (" + (tc75/tcs.length*100).toFixed(1) + "%)");
  console.log("   Unique TC: " + [...new Set(tcs)].sort((a,b) => a-b).join(", "));

  // Double counting
  const dcs = results.filter(r => r.dcFlagged);
  console.log("\n🔍 Double counting: " + dcs.length + "/" + results.filter(r => r.status === "✅ OK").length + " flagged");

  // Packet leaks
  const pLeaks = results.filter(r => r.packetContam && r.pipeline === "PRO");
  console.log("\n🔍 Packet leaks: " + pLeaks.length + "/" + results.filter(r => r.pipeline === "PRO" && r.status === "✅ OK").length + " PRO runs have cross-packet contamination");
  pLeaks.forEach(r => console.log("   " + r.name + ": " + r.packetContamDetails));
}

main().catch(err => { console.error("\nFATAL:", err.message); process.exit(1); });
