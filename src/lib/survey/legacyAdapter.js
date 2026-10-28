import { PEOPLE, ROUNDS, EXPLORERS, SURVEY } from "./surveyData.js";

/* ================================================================== */
/* The SHAPE survey dataset in the shape lib/dataset.js reads (the       */
/* prototype sample's: meta, orgSummaries, users with rounds of Driver,  */
/* Explorer and overall scores). Every number comes from scoring.js on   */
/* the stored answers; nothing is made up.                               */
/* Left out: Drivers not scored for everyone in a round (Situational     */
/* Leadership has no formula yet; Décor, Dress code and Commuting are    */
/* only asked of some people), because the sample-style reads average    */
/* every person. They stay in the SHAPE report and Developer › Data.     */
/* ================================================================== */
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const num = (v) => typeof v === "number" && Number.isFinite(v);

export function shapeAsLegacy() {
  const rounds = ROUNDS.map((r, i) => ({ round: i + 1, date: r.closedAt, id: r.id, invited: r.invited }));
  const exName = Object.fromEntries(EXPLORERS.map((e) => [e.id, e.name]));
  const dimensions = EXPLORERS.map((e) => e.name);
  const scored = PEOPLE.flatMap((p) => Object.values(p.rounds));
  const drivers = SURVEY.drivers.filter((d) => d.explorers?.length && scored.every((r) => num(r.scores.drivers[d.name]))).map((d) => d.name);
  const driverDimensionMap = Object.fromEntries(drivers.map((d) => [d, exName[SURVEY.drivers.find((x) => x.name === d).explorers[0]]]));

  const users = PEOPLE.map((p) => {
    const pr = p.profile;
    return {
      id: p.id, firstName: pr.firstName, lastName: pr.lastName, gender: pr.gender, department: pr.department, jobLevel: pr.jobLevel,
      location: pr.site === "Does not apply" ? "No site (home)" : pr.site, tenure: pr.tenure, employmentStatus: pr.employmentStatus, workModel: pr.workModel,
      rounds: rounds.filter((r) => p.rounds[r.id]).map((r) => {
        const { scores, answers } = p.rounds[r.id];
        return {
          round: r.round, date: r.date, overallScore: scores.overall,
          dimensionScores: Object.fromEntries(EXPLORERS.map((e) => [e.name, scores.explorers[e.id]])),
          driverScores: Object.fromEntries(drivers.map((d) => [d, scores.drivers[d]])),
          recommendScore: answers["CC2.3"], morale: answers["CC2.1"],
        };
      }),
    };
  });

  const orgSummaries = rounds.map((r) => {
    const rs = users.map((u) => u.rounds.find((x) => x.round === r.round)).filter(Boolean);
    const rec = rs.map((x) => x.recommendScore).filter(num);
    return {
      round: r.round, date: r.date, avgOverall: r1(mean(rs.map((x) => x.overallScore))),
      eNPS: rec.length ? Math.round(((rec.filter((v) => v >= 9).length - rec.filter((v) => v <= 6).length) / rec.length) * 100) : null,
      avgMorale: r1(mean(rs.map((x) => x.morale).filter(num))),
      dimensionAvg: Object.fromEntries(dimensions.map((d) => [d, r1(mean(rs.map((x) => x.dimensionScores[d])))])),
      driverAvg: Object.fromEntries(drivers.map((d) => [d, r1(mean(rs.map((x) => x.driverScores[d])))])),
    };
  });

  return { meta: { generatedFrom: "SHAPE survey dataset (lib/survey/surveyData.js)", userCount: users.length, rounds: rounds.map(({ round, date }) => ({ round, date })), dimensions, driverDimensionMap }, orgSummaries, users };
}
