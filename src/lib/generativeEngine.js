import { rand, pick } from "./tokens.js";
import {
  metricForTopic, correlationForTopics, pairedScores, avgScoreByGender, avgScoreByWorkModel, dimensionRankedRows, LATEST,
  DIMENSIONS, DIMENSION_DRIVERS, DRIVER_DIMENSION,
} from "./dataset.js";
import { extractTopics, titleFromPrompt } from "./topicResolver.js";
import { statusName } from "./bands.js";

export { extractTopics, titleFromPrompt };

/* ================================================================== */
/* GENERATIVE ENGINE — chat-created widgets (not fixed to Library)     */
/* Prompt -> widget-spec logic. See docs/widget-generation-mapping.md  */
/*                                                                      */
/* Topic extraction is now lib/topicResolver.js scoring against the     */
/* FULL real dataset catalog (12 dimensions + ~45 drivers), not a fixed  */
/* ~25-entry keyword lexicon — most real prompts now resolve to a real   */
/* dataset entity by name. metricForTopic()/correlationForTopics()       */
/* (lib/dataset.js) return real numbers for anything that resolves;      */
/* genuinely unmapped topics (Diversity, Compensation — nothing in the   */
/* generated dataset scores these) fall back to the previous synthetic   */
/* rand()-based generation, same safety net as before.                   */
/* ================================================================== */

export const EXPLANATIONS = {
  scatter: (p) => `Each dot is one person, placed by their ${p.topicA} and ${p.topicB} scores — so you can see whether the two rise and fall together.`,
  trend: () => `A line across survey rounds, so a change over time is easy to spot.`,
  bar: () => `Bars side by side, longest first, so the strongest and weakest read at a glance. Colour is the score's status band.`,
  ranking: () => `Ranked and grouped Great / Average / Poor, so what needs attention first sits where you look first.`,
  status: () => `One status for one question — Flourishing, Striving or Struggling — when the band matters more than the exact number.`,
  insight: () => `A pattern found in the data — useful when the link between two things isn't obvious from one chart.`,
  metric: () => `The number, and how it moved since last round — best when there is one figure that matters most.`,
  radar: () => `Several related drivers on one shape — a dent on one spoke is the driver pulling the rest down.`,
  gauge: () => `The score as a ring with the 60 and 80 status thresholds marked, so you can see how close it is to the next band.`,
};

/* ------------------------------------------------------------------ */
/* CHOOSING A FORM                                                     */
/* The chart is picked by the data's job, not by taste or at random —   */
/* the same question always gets the same three options, best first.   */
/* The rules (from the dataviz / ui-ux-pro-max chart guidance):         */
/*  - one current value  -> the number (+ change); a dial only because  */
/*    our scores have real 60/80 thresholds to mark on it               */
/*  - change over time   -> a line, and only with 3+ rounds             */
/*  - a handful of things compared -> bars, longest first; ranked list  */
/*    when the reader's job is "what's worst"                           */
/*  - 5–8 related parts as a profile -> radar. Fewer than 4 is not a    */
/*    shape, more than 8 is unreadable — so never outside that range    */
/*  - two measures -> a scatter of the real people, never a drawn cloud */
/* ------------------------------------------------------------------ */
const BASE_SCORES = {
  single: { metric: 5, trend: 4, gauge: 3, status: 2, ranking: 2, radar: 1 },
  several: { ranking: 5, bar: 4, radar: 3, scatter: 2, insight: 2, trend: 1 },
};
const ASKS = [
  ["scatter", /compare|vs\.?|versus|correlat|relationship|against/],
  ["trend", /trend|over time|history|change|month|quarter|improv|declin/],
  ["radar", /radar|spider|snapshot|profile|all of|everything about|full picture/],
  ["bar", /breakdown|distribution|split|composition|across|by (team|department|gender|location)/],
  ["ranking", /top|best|worst|rank|leaderboard|driver/],
  ["status", /flourish|struggl|striv|mood|sentiment|status/],
  ["gauge", /gauge|dial|\bring\b/],
  ["metric", /number|how many|how much|score/],
];

/* Every form worth offering for this prompt, best first. */
export function rankForms(prompt, topics = extractTopics(prompt)) {
  const p = prompt.toLowerCase();
  // The resolver also returns near-matches ("sleep trend over time" pulls in
  // Workload, Stress…). Only what the prompt actually names counts as "how
  // many things are being asked about"; with no literal name, fall back to all.
  const named = topics.filter((t) => p.includes(t.toLowerCase())).length || topics.length;
  const several = named >= 2;
  const score = { ...BASE_SCORES[several ? "several" : "single"] };
  // Something the reader literally asked for outranks any default.
  ASKS.forEach(([viz, re]) => { if (re.test(p)) score[viz] = (score[viz] || 0) + 6; });
  // Three or more named topics read as a profile.
  if (named >= 3) score.radar = (score.radar || 0) + 4;
  // A single Explorer has its own drivers, so it can be ranked or profiled.
  if (!several && topics[0] && DIMENSIONS.includes(topics[0])) { score.ranking += 1; score.radar += 1; }
  // Two named things compared: bars and a ranked list would show the same two
  // rows, so lead with bars unless a ranking was actually asked for.
  if (named === 2) { score.bar += 2; if (!/top|best|worst|rank|leaderboard|driver/.test(p)) delete score.ranking; }
  // Needs two topics to mean anything.
  if (!several) { delete score.scatter; delete score.insight; }
  // A bar needs something to compare.
  if (!several && !/breakdown|distribution|split|composition|across|by (team|department|gender|location)/.test(p)) delete score.bar;
  const order = Object.keys(score).sort((x, y) => score[y] - score[x]);
  return order;
}

/* Widens a short topic list into a fuller cluster for the radar chart by
   pulling in sibling drivers from the same dimension(s) — e.g. asking about
   just "sleep" still gets a real 5-spoke Physical Health radar, not a
   2-point shape. Falls back to a fixed dimension if nothing resolved at
   all, so radar is never offered with zero real data behind it. */
function radarTopics(topics) {
  let names = [...topics];
  const seedDims = new Set();
  names.forEach((n) => {
    if (DIMENSIONS.includes(n)) seedDims.add(n);
    else if (DRIVER_DIMENSION[n]) seedDims.add(DRIVER_DIMENSION[n]);
  });
  for (const dim of seedDims) {
    for (const d of DIMENSION_DRIVERS[dim] || []) {
      if (names.length >= 6) break;
      if (!names.includes(d)) names.push(d);
    }
  }
  if (!names.length) names = DIMENSION_DRIVERS["Psychological Health"] || DIMENSIONS.slice(0, 5);
  return names.slice(0, 6);
}

export function buildSpec(vizType, topics, prompt) {
  const t = (i, fallback) => topics[i] || fallback;
  const promptTitle = () => titleFromPrompt(prompt, topics);
  const trendDelta = (trend) => trend[trend.length - 1] - trend[trend.length - 2];
  // What the prompt literally names (the resolver also returns near-matches).
  const lp = (prompt || "").toLowerCase();
  const named = topics.filter((x) => lp.includes(x.toLowerCase()));
  const asked = named.length ? named : topics;
  let spec;
  switch (vizType) {
    case "scatter": {
      const a = t(0, "Sleep"), b = t(1, "Stress");
      const corr = correlationForTopics(a, b);
      const r = corr !== null ? corr : Number((Math.random() * 1.4 - 0.7).toFixed(2));
      // The dots are the real people (one per respondent); an unresolved topic has none.
      spec = { vizType, size: "2x2", title: `${a} vs. ${b}`, payload: { topicA: a, topicB: b, r, points: pairedScores(a, b) || undefined }, real: corr !== null };
      break;
    }
    case "trend": {
      const topic = t(0, promptTitle());
      const m = metricForTopic(topic);
      let pts;
      if (m) {
        pts = m.trend;
      } else {
        pts = [rand(40, 70)];
        for (let i = 0; i < 3; i++) pts.push(Math.max(10, Math.min(95, pts[pts.length - 1] + rand(-12, 15))));
      }
      spec = { vizType, size: "1x1", title: `${topic} Trend`, payload: { points: pts }, real: !!m };
      break;
    }
    case "bar": {
      const useTopics = asked.length >= 2;
      let rows, title, real;
      if (useTopics) {
        const cats = asked.slice(0, 4);
        real = true;
        rows = cats.map((c) => {
          const m = metricForTopic(c);
          if (!m) real = false;
          return [c.length > 10 ? c.slice(0, 10) + "…" : c, m ? m.value : rand(30, 95)];
        });
        title = `Comparing ${asked.slice(0, 2).join(" & ")}`;
      } else {
        // The groups the survey can split by are gender and work model — use the one
        // the prompt names. The numbers are each group's overall score, so the title
        // says so rather than borrowing the prompt's topic.
        const byGender = /gender|men|women/.test(prompt.toLowerCase()) && !/work model|remote|hybrid|onsite/.test(prompt.toLowerCase());
        const groups = byGender ? avgScoreByGender().map(([g, v]) => [g === "Prefer not to respond" ? "Prefer.." : g, v]) : avgScoreByWorkModel();
        real = groups.length > 0;
        rows = groups.length ? groups : ["Onsite", "Remote", "Hybrid", "Contract"].map((c) => [c, rand(30, 95)]);
        title = `Overall Score by ${byGender ? "Gender" : "Work Model"}`;
      }
      rows.sort((x, y) => y[1] - x[1]); // longest first
      spec = { vizType, size: "2x2", title, payload: { rows, byStatus: useTopics }, real };
      break;
    }
    case "ranking": {
      let rows, title, real;
      if (asked.length) {
        real = true;
        // A single topic makes a one-row list — widen it with its own sibling
        // drivers so there is something to rank. Two or more named topics are
        // ranked as asked, nothing added.
        rows = (asked.length === 1 ? radarTopics(asked) : asked).slice(0, 5).map((name) => {
          const m = metricForTopic(name);
          if (!m) real = false;
          return m ? [name, m.value, trendDelta(m.trend)] : [name, rand(28, 92), Math.random() > 0.5 ? rand(-8, 12) : undefined];
        });
        title = `Top Drivers — ${asked.slice(0, 2).join(" & ")}`;
      } else {
        rows = dimensionRankedRows().slice(0, 5);
        real = true;
        title = "Top Areas to Focus";
      }
      rows.sort((a, b) => b[1] - a[1]);
      spec = { vizType, size: "2x2", title, payload: { rows }, real };
      break;
    }
    case "status": {
      const topic = topics[0];
      const m = topic ? metricForTopic(topic) : null;
      const value = m ? m.value : LATEST.avgOverall;
      const status = statusName(value);
      spec = { vizType, size: "1x1", title: topics.length ? `${topics[0]} Status` : "Organisation Status", payload: { status }, real: topic ? !!m : true };
      break;
    }
    case "insight": {
      const a = t(0, "Sleep"), b = t(1, "Burnout Risk");
      const r = correlationForTopics(a, b);
      let text, stat;
      if (r !== null) {
        const strength = Math.abs(r) >= 0.6 ? "strongly" : Math.abs(r) >= 0.3 ? "moderately" : "weakly";
        text = r < 0
          ? `Participants reporting higher ${a} tend to report lower ${b} — the two are ${strength} negatively correlated (r=${r}) in this round's data.`
          : `Participants reporting higher ${a} also tend to report higher ${b} — the two are ${strength} correlated (r=${r}) in this round's data.`;
        stat = Math.round(Math.abs(r) * 100);
      } else {
        const mult = (1.5 + Math.random() * 1.5).toFixed(1);
        text = `Participants reporting low ${a} are ${mult}x more likely to report high ${b}.`;
        stat = rand(58, 84);
      }
      spec = { vizType, size: "2x2", title: "Did You Know?", payload: { text, stat }, real: r !== null };
      break;
    }
    case "radar": {
      const names = radarTopics(topics);
      const items = names.map((name) => {
        const m = metricForTopic(name);
        return { label: name, value: m ? m.value : rand(35, 85) };
      });
      // Fewer than four spokes isn't a shape — fall back to a ranked list.
      if (items.length < 4) return buildSpec("ranking", topics, prompt);
      const title = topics.length ? `${promptTitle()} Breakdown` : "Wellbeing Snapshot";
      // radarTopics() only ever returns real catalog names (resolved topics or
      // real sibling/default drivers), so every item resolves — always real.
      spec = { vizType, size: "2x2", title, payload: { items }, real: true };
      break;
    }
    case "gauge": {
      const topic = t(0, promptTitle());
      const m = metricForTopic(topic);
      const value = m ? m.value : rand(45, 92);
      spec = { vizType, size: "1x1", title: topic, payload: { value }, real: !!m };
      break;
    }
    case "metric":
    default: {
      const topic = t(0, promptTitle());
      const m = metricForTopic(topic);
      const value = m ? m.value : rand(45, 92);
      const delta = m ? trendDelta(m.trend) : rand(-8, 12);
      spec = { vizType: "metric", size: "1x1", title: topic, payload: { value, delta }, real: !!m };
    }
  }
  spec.explanation = EXPLANATIONS[spec.vizType](spec.payload);
  if (!spec.real) spec.explanation += " (No close survey data for this yet — shown as an estimate.)";
  return spec;
}

/* The chart type the prompt most naturally asks for — shared with the Widget
   Builder so a built widget starts from the same heuristic the chat uses. */
export function primaryViz(prompt, topics = extractTopics(prompt)) {
  return rankForms(prompt, topics)[0];
}

/* The three best forms for the data, best first — the same every time. */
export function generateVariants(prompt) {
  const topics = extractTopics(prompt);
  return rankForms(prompt, topics).slice(0, 3).map((v) => buildSpec(v, topics, prompt));
}
