import { dataset, ROUNDS } from "./dataset.js";

/* ================================================================== */
/* MENTAL WELL-BEING SEVERITY: how many people sit in each of five      */
/* severity bands for Feeling Low, Feeling Anxious and Feeling Stressed */
/* (Figma 13622:36188 / 36298 / 36472).                                  */
/*                                                                      */
/* The survey scores the Depression, Anxiety and Stress Drivers from 0   */
/* to 100 where higher is better. SHAPE has not defined severity cut-offs */
/* for them, so the bands here are a PROTOTYPE ASSUMPTION: the status     */
/* scale's own lines (80 and 60) with the Struggling range split into     */
/* three equal steps of 20. They are not a clinical scale.                */
/* ================================================================== */
export const SEVERITY = ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"];
export const SEVERITY_FROM = [80, 60, 40, 20, 0]; // a score at or above this line is in the band
export const MEASURES = [["Feeling Low", "Depression"], ["Feeling Anxious", "Anxiety"], ["Feeling Stressed", "Stress"]];

export const severityIndex = (score) => SEVERITY_FROM.findIndex((from) => score >= from);

/* Rows for the organisation in the latest round: share and count per band, and the change in share (points)
   since the round before. */
export function orgSeverity() {
  const at = (back) => {
    const round = ROUNDS[ROUNDS.length - 1 - back]?.round;
    return dataset.users.map((u) => u.rounds.find((r) => r.round === round)).filter(Boolean);
  };
  const now = at(0), prev = at(1);
  const share = (rs, driver) => {
    const counts = SEVERITY.map(() => 0);
    rs.forEach((r) => { counts[severityIndex(r.driverScores[driver])]++; });
    return counts;
  };
  return MEASURES.map(([label, driver]) => {
    const c = share(now, driver), p = prev.length ? share(prev, driver) : null;
    return {
      label,
      cells: c.map((n, i) => {
        const pct = Math.round((n / now.length) * 100);
        const prevPct = p ? Math.round((p[i] / prev.length) * 100) : null;
        return { pct, count: n, delta: prevPct == null ? 0 : pct - prevPct };
      }),
    };
  });
}

/* Every round, oldest first: per measure, the share of people in each band ([Normal … Extremely Severe], percent), and
   the band the organisation's mean score falls in (for the one-bar-per-round form). Same prototype cut-offs as above. */
export function severityByRound() {
  return MEASURES.map(([label, driver]) => {
    const perRound = ROUNDS.map(({ round }) => {
      const rs = dataset.users.map((u) => u.rounds.find((r) => r.round === round)).filter(Boolean);
      const counts = SEVERITY.map(() => 0);
      let sum = 0;
      rs.forEach((r) => { const v = r.driverScores[driver]; counts[severityIndex(v)]++; sum += v; });
      const pct = counts.map((c) => Math.round((c / (rs.length || 1)) * 100));
      return { pct, level: severityIndex(sum / (rs.length || 1)) };
    });
    return { label, rounds: perRound.map((p) => p.pct), levels: perRound.map((p) => p.level) };
  });
}
