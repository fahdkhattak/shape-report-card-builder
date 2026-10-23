import { ROUNDS, PEOPLE } from "./surveyData.js";
import { WELLBEING, WELLBEING_LEVELS } from "./scoring.js";

/* ================================================================== */
/* How people moved between mental well-being levels, round to round.  */
/* For the Sankey ("How People Moved", TrendCharts.jsx FlowOverTime).   */
/* A flow only means something for the same people, so the cohort is    */
/* everyone who answered every round with a level on all three measures */
/* (joiners and people who skipped a round are left out, and the Story  */
/* says how many that is). Real counts from the SHAPE survey dataset.   */
/*                                                                      */
/* Returns { cohort, total, rounds: [{ label, latest }], levels,        */
/*   measures: [{ label, nodes: number[round][level],                   */
/*                links: number[transition][from][to] }] }               */
/* ================================================================== */
const monthLabel = (iso) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

export function wellbeingFlows() {
  const ids = ROUNDS.map((r) => r.id);
  const L = WELLBEING_LEVELS.length;
  const cohort = PEOPLE.filter((p) => ids.every((id) => p.rounds[id] && WELLBEING.every(({ label }) => p.rounds[id].scores.wellbeing[label]?.level)));
  const measures = WELLBEING.map(({ label }) => {
    const idx = (p, id) => WELLBEING_LEVELS.indexOf(p.rounds[id].scores.wellbeing[label].level);
    const nodes = ids.map((id) => { const c = Array(L).fill(0); cohort.forEach((p) => { c[idx(p, id)]++; }); return c; });
    const links = ids.slice(1).map((id, t) => {
      const m = Array.from({ length: L }, () => Array(L).fill(0));
      cohort.forEach((p) => { m[idx(p, ids[t])][idx(p, id)]++; });
      return m;
    });
    return { label, nodes, links };
  });
  return {
    cohort: cohort.length,
    total: PEOPLE.length,
    rounds: ROUNDS.map((r, i) => ({ label: monthLabel(r.closedAt), latest: i === ROUNDS.length - 1 })),
    levels: WELLBEING_LEVELS,
    measures,
  };
}
