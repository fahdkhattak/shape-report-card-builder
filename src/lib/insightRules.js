/* ================================================================== */
/* INSIGHT WIDGET LIMITS — the size rules from the Graph and Chart      */
/* specification boards (984qJvMt7fCHASYHRwgrab 9158:28146, 9158:22652; */
/* docs/widget-insight-rules.md), as data. The widgets                   */
/* (GraphInsight.jsx, ChartInsight.jsx) and the Widget Builder's sizing  */
/* (subjectForms.js) both read these, so a widget never offers a size    */
/* the rules forbid. Pure: no React.                                     */
/* ================================================================== */

/* Graph: 1x1 = 2 to 3 points, one line; 2x2 = 2 to 7 points, up to 3 lines (the same measure for different groups). */
export const GRAPH_LIMITS = { "1x1": { points: 3, lines: 1 }, "2x2": { points: 7, lines: 3 } };

/* Which size a graph with this many points and lines must be: "1x1", "2x2", or "detail" (the modal). */
export function graphFit(points, lines = 1, wanted = "1x1") {
  if (points > GRAPH_LIMITS["2x2"].points || lines > GRAPH_LIMITS["2x2"].lines) return "detail";
  if (wanted === "2x2" || points > GRAPH_LIMITS["1x1"].points || lines > GRAPH_LIMITS["1x1"].lines) return "2x2";
  return "1x1";
}

/* Chart: most categories each structure can show per size. "2x2e" = a 2x2 with an evidence section;
   "1x1legend" = a 1x1 donut that also carries a legend. */
export const CHART_LIMITS = {
  // 2x2e was 9 on the Chart board; the widget structure board (15463:2092) gives the Evidence Section a fixed 68px and the
  // header may take two lines, which leaves room for 8 bars and the "N more" line.
  // Score comparison by group (product direction): 2 to 4 groups in a 1x1, 5 or more escalate to a 2x2.
  hbars: { "1x1": 4, "2x2": 13, "2x2e": 8 },
  vbars: { "1x1": 4, "2x2": 10 },
  grid: { "1x1": 4, "2x2": 18 },
  donut: { "1x1": 7, "1x1legend": 4, "2x2": 15 },
  treemap: { "1x1": 3, "2x2": 7 },
};

export const chartLimit = (kind, size, opts = {}) => {
  const L = CHART_LIMITS[kind];
  if (size === "2x2" && opts.evidence && L["2x2e"]) return L["2x2e"];
  if (size === "1x1" && opts.legend && L["1x1legend"]) return L["1x1legend"];
  return L[size];
};

/* The size a chart of `kind` with `n` categories needs: the wanted size, grown to 2x2 if it does not fit,
   or "detail" (the modal) past the 2x2 limit. Fewer than 2 categories is not a chart ("none"). */
export function chartFit(kind, n, wanted = "1x1", opts = {}) {
  if (n < 2) return "none";
  if (wanted === "1x1" && n <= chartLimit(kind, "1x1", opts)) return "1x1";
  if (n <= chartLimit(kind, "2x2", opts)) return "2x2";
  return "detail";
}

/* The sizes (of `sizes`) a chart with `n` categories may be drawn at. Past the 2x2 limit the 2x2 is still offered:
   it shows what fits and says how many more (the widget never scrolls; the rest belongs in the detailed view). */
export function chartSizes(kind, n, sizes = ["1x1", "2x2"], opts = {}) {
  const ok = sizes.filter((s) => s !== "1x1" || n <= chartLimit(kind, "1x1", opts));
  return ok.length ? ok : sizes.filter((s) => s !== "1x1");
}

/* COMPOSITION (how a whole splits into its groups: people by gender, work model, department…, or time and money by part).
   Product direction: 4 groups or fewer → a stacked grid + bar or a donut in a 1x1; 5 to 7 → a donut only, in a 1x1;
   more than 7 → not allowed in a 1x1, a 2x2 donut. Returns { size: [forms] } for the sizes allowed. */
export function compositionFit(n) {
  if (n <= 4) return { "1x1": ["grid", "donut"], "2x2": ["donut"] };
  if (n <= 7) return { "1x1": ["donut"], "2x2": ["donut"] };
  return { "2x2": ["donut"] };
}
/* SCORE COMPARISON by group (a score for each group of people): 2 to 4 groups → bars in a 1x1; 5 or more → a 2x2. */
export const comparisonSize = (n) => (n <= CHART_LIMITS.hbars["1x1"] ? "1x1" : "2x2");
