import { DRIVERS, DIMENSIONS, DRIVER_DIMENSION, DIMENSION_DRIVERS, driverValue, CONCEPTS } from "./dataset.js";

/* ================================================================== */
/* TOPIC RESOLVER — turns free-typed prompt text into real dataset      */
/* entities (dimensions/drivers), rather than a fixed lexicon of ~25    */
/* hand-picked keyword->label pairs. Two consumers:                     */
/*                                                                      */
/*  - The scoping conversation (ChatLanding.jsx): findScope() tries a   */
/*    real dimension first, then falls back to assembling a BESPOKE     */
/*    cluster of the best-matching individual drivers — "collect a      */
/*    good amount of drivers to form a new dimension bespoke to the     */
/*    query" per explicit product direction — rather than only ever     */
/*    offering the ~8 curated starter areas.                            */
/*  - The generative engine (generativeEngine.js): extractTopics()      */
/*    resolves a prompt to real dimension/driver names directly, so     */
/*    "how's my team's IT support" now matches the real "IT" driver     */
/*    instead of needing a bespoke lexicon entry for it.                */
/*                                                                      */
/* This is still a scored keyword-overlap heuristic, not a language     */
/* model — see generativeEngine.js's own note on this. It just now      */
/* scores against the FULL real driver/dimension catalog (57 entities)  */
/* instead of a curated ~25-keyword lexicon, so far more real prompts    */
/* resolve to something genuine instead of falling back to synthetic    */
/* placeholder data.                                                    */
/* ================================================================== */

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "of", "for", "to", "in", "on", "at", "by", "with", "and", "or", "but",
  "my", "our", "their", "his", "her", "its", "we", "i", "you", "they",
  "how", "whats", "what's", "what", "why", "when", "where", "who",
  "show", "me", "us", "tell", "give", "get", "make", "create", "generate",
  "about", "doing", "going", "like", "just", "some", "any", "all",
  "team", "org", "organisation", "organization", "company", "employees", "staff", "people",
  "score", "scores", "widget", "chart", "graph", "report", "data",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/* Curated synonym overlay — words a driver/dimension's own name wouldn't
   surface on its own. Auto-derived name words (below) already cover exact
   phrasing; this is just for common alternate phrasing. */
const DRIVER_SYNONYMS = {
  Sleep: ["insomnia", "rest", "resting"],
  Stress: ["stressed", "pressure", "overwhelmed", "overwhelm"],
  Depression: ["depressed", "sad", "down", "low"],
  Anxiety: ["anxious", "worry", "worried", "nervous"],
  Resilience: ["burnout", "resilient", "cope", "coping", "bounce"],
  "Work-life balance": ["worklife", "balance", "overtime"],
  Commuting: ["commute", "travel", "traveling"],
  "Home duties": ["chores", "housework", "domestic"],
  "Support network": ["support", "friends", "family"],
  "Engaging role": ["engaging", "interesting", "meaningful", "purpose", "purposeful"],
  Workload: ["overworked", "busy", "capacity", "bandwidth", "overtime"],
  Resources: ["tools", "equipment", "resourced", "resourcing"],
  "Job security": ["security", "layoff", "layoffs", "redundancy"],
  "R&R": ["recognition", "reward", "rewards", "appreciation", "appreciated"],
  "Career prospects": ["career", "promotion", "advancement", "progression"],
  Safety: ["safe", "safety"],
  "Growth and development": ["development", "training", "learning", "upskill", "upskilling", "skills"],
  "Sense of importance": ["valued", "important", "importance", "recognised", "recognized"],
  Trustworthy: ["trust", "honesty", "integrity", "trustworthy"],
  Supportive: ["supportive", "helpful", "helpfulness"],
  Respectful: ["respect", "respectful", "respectfulness"],
  Hardworking: ["hardworking", "diligent", "effort"],
  "Good communication": ["communication", "communicate", "communicating"],
  "Relationship with manager": ["manager", "managers", "boss", "supervisor", "leadership"],
  "Role clarity": ["clarity", "expectations", "clear"],
  "Handling incompetence": ["incompetence", "accountability", "underperformance", "underperforming"],
  Values: ["values", "ethics", "ethical"],
  Leaders: ["leadership", "leaders", "executives", "executive"],
  Empowerment: ["empowerment", "autonomy", "ownership", "empowered"],
  Collaboration: ["collaboration", "teamwork", "collaborate", "collaborative"],
  "Policies and Practices": ["policy", "policies", "practices", "bureaucracy", "bureaucratic"],
  Morale: ["morale", "mood", "vibe", "atmosphere"],
  Pride: ["pride", "proud"],
  Policies: ["policy", "process", "processes", "bureaucracy"],
  People: ["people", "staffing", "headcount"],
  Comfort: ["comfort", "comfortable", "ergonomic", "ergonomics"],
  Noise: ["noise", "loud", "quiet"],
  "General Quality": ["quality", "facilities", "facility"],
  Flexibility: ["flexible", "flexibility", "hybrid", "remote"],
  "Distractions and disruptions": ["distraction", "distractions", "interruption", "interruptions", "focus"],
  IT: ["technology", "tech", "software", "systems", "laptop", "laptops"],
  Nutrition: ["diet", "eating", "food", "nutrition"],
  Exercise: ["exercise", "fitness", "gym", "activity", "active"],
  Smoking: ["smoking", "cigarettes", "vaping", "vape"],
  Alcohol: ["alcohol", "drinking"],
};

const DIMENSION_SYNONYMS = {
  "Physical Health": ["physical", "body", "fitness"],
  "Psychological Health": ["mental", "psychological", "wellbeing", "well-being", "wellness"],
  "Life Outside Work": ["worklife", "personal"],
  "Job Satisfaction": ["satisfaction", "satisfied", "fulfillment", "fulfilment"],
  "Employee Commitment": ["commitment", "retention", "turnover", "loyalty", "attrition"],
  "Employee Engagement": ["engagement", "engaged", "motivation", "motivated"],
  "Coworker Dynamic": ["coworkers", "colleagues", "peers", "teammates"],
  "Manager Style": ["manager", "managers", "management", "supervisors"],
  "Corporate Culture": ["culture"],
  "Business Essentials": ["business", "operations"],
  "Physical Work Environment": ["office", "workspace", "facilities"],
  "Soft Work Environment": ["remote", "hybrid", "worklife"],
};

function keywordsFor(name, extra = []) {
  const words = name.toLowerCase().replace(/[&/-]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return [...new Set([...words, ...extra.map((s) => s.toLowerCase())])];
}

const DRIVER_KEYWORDS = {};
DRIVERS.forEach((d) => { DRIVER_KEYWORDS[d] = keywordsFor(d, DRIVER_SYNONYMS[d] || []); });
const DIMENSION_KEYWORDS = {};
DIMENSIONS.forEach((d) => { DIMENSION_KEYWORDS[d] = keywordsFor(d, DIMENSION_SYNONYMS[d] || []); });
const CONCEPT_KEYWORDS = {};
Object.entries(CONCEPTS).forEach(([label, c]) => { CONCEPT_KEYWORDS[label] = keywordsFor(label, c.keywords); });

function scoreOverlap(tokens, keywords) {
  let score = 0;
  for (const t of tokens) {
    for (const k of keywords) {
      if (t === k) score += 3;
      else if (k.length > 3 && (k.includes(t) || t.includes(k))) score += 1;
    }
  }
  return score;
}

function rankedScores(tokens, keywordMap) {
  return Object.keys(keywordMap)
    .map((name) => [name, scoreOverlap(tokens, keywordMap[name])])
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
}

/* Every real name (dimensions + drivers + the small concept overlay) that
   scored above zero against the prompt, ranked. This is the shared scan
   both extractTopics() and findScope() build on. */
function scan(prompt) {
  const tokens = tokenize(prompt);
  return {
    tokens,
    dimensions: rankedScores(tokens, DIMENSION_KEYWORDS),
    drivers: rankedScores(tokens, DRIVER_KEYWORDS),
    concepts: rankedScores(tokens, CONCEPT_KEYWORDS),
  };
}

/* Real dimension/driver/concept names the prompt actually resolves to,
   ranked by relevance, deduped, capped — for the generative engine's
   per-prompt topic extraction. Unlike the old fixed lexicon this covers
   every one of the 12 dimensions and ~45 drivers by name, not just the
   ones someone thought to add a keyword for. */
export function extractTopics(prompt, max = 5) {
  const { dimensions, drivers, concepts } = scan(prompt);
  const merged = [...concepts, ...dimensions, ...drivers].sort((a, b) => b[1] - a[1]);
  const seen = new Set();
  const out = [];
  for (const [name] of merged) {
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
    if (out.length >= max) break;
  }
  return out;
}

export function titleFromPrompt(prompt, topics) {
  if (topics?.length) return topics.slice(0, 2).join(" & ");
  const words = prompt.trim().split(/\s+/).filter((w) => !STOPWORDS.has(w.toLowerCase()) && w.length > 1);
  return words.slice(0, 4).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "Custom Insight";
}

/* Finds a scope for the mascot's opening conversation: a real dimension if
   one clearly matches, else a BESPOKE cluster assembled from whichever
   individual drivers scored best against the prompt — "use your judgement
   to collect a good amount of drivers to form a new dimension bespoke to
   the query" per explicit product direction. Returns null only when
   *nothing* in the real driver/dimension catalog scored above zero, so the
   caller can fall back to the curated starter areas.

   Shape: { kind: "dimension" | "bespoke", label, matched: string[],
            suggested: string[], drivers: string[] } */
export function findScope(prompt) {
  const { dimensions, drivers } = scan(prompt);

  if (dimensions.length && dimensions[0][1] >= 3) {
    const dim = dimensions[0][0];
    const all = [...DIMENSION_DRIVERS[dim]].sort((a, b) => driverValue(a) - driverValue(b));
    return {
      kind: "dimension",
      label: dim,
      matched: all.slice(0, 3),
      suggested: all.slice(3),
      drivers: all,
    };
  }

  if (drivers.length) {
    const top = drivers.slice(0, 6).map(([d]) => d);
    const usedDims = [...new Set(top.map((d) => DRIVER_DIMENSION[d]))];
    const siblingPool = usedDims.flatMap((dim) => DIMENSION_DRIVERS[dim]).filter((d) => !top.includes(d));
    // Prefer naming the cluster after its own best-matching drivers ("Leaders
    // & Pride") over generic prompt words — more informative, and free since
    // titleFromPrompt already has this branch.
    const label = titleFromPrompt(prompt, top);
    return {
      kind: "bespoke",
      label,
      matched: top.slice(0, 4),
      suggested: [...new Set(siblingPool)].slice(0, 4),
      drivers: top,
    };
  }

  return null;
}
