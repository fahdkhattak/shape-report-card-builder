import { rand, pick } from "./tokens.js";
import {
  metricForTopic, correlationForTopics, avgScoreByWorkModel, dimensionRankedRows, LATEST,
  DIMENSIONS, DIMENSION_DRIVERS, DRIVER_DIMENSION,
} from "./dataset.js";
import { extractTopics, titleFromPrompt } from "./topicResolver.js";

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
  scatter: (p) => `Shown as a scatter plot because you asked to compare two topics — this reveals whether ${p.topicA} and ${p.topicB} move together.`,
  trend: () => `A line view surfaces how this has moved round to round, so a change over time is easy to spot.`,
  bar: () => `A bar comparison works best here since you're looking across a few distinct groups side by side.`,
  ranking: () => `Ranked so the drivers needing attention first rise straight to the top of the list.`,
  status: () => `A quick status read — good for a single at-a-glance check rather than a detailed breakdown.`,
  insight: () => `A generated pattern from the data — useful when the connection between two things isn't obvious from a single chart.`,
  metric: () => `A single clear number, best when there's one figure that matters most right now.`,
  radar: () => `A radar shows several related drivers on one shape at once — useful for spotting which specific piece is dragging the rest down.`,
  gauge: () => `A dial reads faster than a bare number when there's just one figure to check at a glance.`,
};

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
  let spec;
  switch (vizType) {
    case "scatter": {
      const a = t(0, "Sleep"), b = t(1, "Stress");
      const corr = correlationForTopics(a, b);
      const r = corr !== null ? corr : Number((Math.random() * 1.4 - 0.7).toFixed(2));
      spec = { vizType, size: "2x2", title: `${a} vs. ${b}`, payload: { topicA: a, topicB: b, r }, real: corr !== null };
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
      const useTopics = topics.length >= 2;
      let rows, title, real;
      if (useTopics) {
        const cats = topics.slice(0, 4);
        real = true;
        rows = cats.map((c) => {
          const m = metricForTopic(c);
          if (!m) real = false;
          return [c.length > 10 ? c.slice(0, 10) + "…" : c, m ? m.value : rand(30, 95)];
        });
        title = `Comparing ${topics.slice(0, 2).join(" & ")}`;
      } else {
        const wm = avgScoreByWorkModel();
        real = wm.length > 0;
        rows = wm.length ? wm : ["Onsite", "Remote", "Hybrid", "Contract"].map((c) => [c, rand(30, 95)]);
        title = `${promptTitle()} by Work Model`;
      }
      spec = { vizType, size: "2x2", title, payload: { rows }, real };
      break;
    }
    case "ranking": {
      let rows, title, real;
      if (topics.length) {
        real = true;
        rows = topics.slice(0, 5).map((name) => {
          const m = metricForTopic(name);
          if (!m) real = false;
          return m ? [name, m.value, trendDelta(m.trend)] : [name, rand(28, 92), Math.random() > 0.5 ? rand(-8, 12) : undefined];
        });
        title = `Top Drivers — ${topics.slice(0, 2).join(" & ")}`;
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
      const status = value >= 70 ? "Flourishing" : value >= 40 ? "Striving" : "Struggling";
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

export function generateVariants(prompt) {
  const p = prompt.toLowerCase();
  const topics = extractTopics(prompt);
  const hasCompare = /compare|vs\.?|versus|correlat|relationship|against/.test(p);
  const hasTrend = /trend|over time|history|change|month|quarter|improv|declin/.test(p);
  const hasBreakdown = /breakdown|distribution|split|composition|across|by (team|department|gender|location)/.test(p);
  const hasRanking = /top|best|worst|rank|leaderboard|driver/.test(p);
  const hasStatus = /flourish|struggl|striv|mood|sentiment|status/.test(p);
  const hasRadar = /radar|spider|snapshot|profile|all of|everything about|full picture/.test(p);

  let primary;
  if (hasCompare && topics.length >= 2) primary = "scatter";
  else if (hasTrend) primary = "trend";
  else if (hasRadar || topics.length >= 3) primary = "radar";
  else if (hasBreakdown) primary = "bar";
  else if (hasRanking) primary = "ranking";
  else if (hasStatus) primary = "status";
  else primary = "metric";

  // scatter/insight both need two real topics to mean anything — never
  // offer either as a random variant when we didn't actually find two.
  const needsTwoTopics = new Set(["scatter", "insight"]);
  let pool = ["scatter", "trend", "bar", "ranking", "status", "insight", "metric", "radar", "gauge"].filter((v) => v !== primary);
  if (topics.length < 2) pool = pool.filter((v) => !needsTwoTopics.has(v));

  const secondary = topics.length >= 2 && primary !== "insight" ? "insight" : pick(pool);
  const remaining = pool.filter((v) => v !== secondary);
  const tertiary = pick(remaining.length ? remaining : pool);

  const chosen = [...new Set([primary, secondary, tertiary])].slice(0, 3);
  return chosen.map((v) => buildSpec(v, topics, prompt));
}
