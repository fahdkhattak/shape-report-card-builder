/* ================================================================== */
/* SHAPE SURVEY DATASET GENERATOR                                       */
/*                                                                      */
/* Synthetic response data for the real Survey.xlsx question set        */
/* ("Survey (NEW)" + "eNPS" sheets) — 100 users x 3 rounds, built to     */
/* back this prototype's widgets/chat/reports with something coherent   */
/* instead of hardcoded numbers. Run with `node data/generate-dataset.js`   */
/* from the project root; writes data/dataset.json, data/                */
/* SHAPE_Survey_Dataset.xlsx (via export.js) and prints sanity stats.    */
/*                                                                      */
/* This generates DRIVER- and DIMENSION-level scores (0-100), not raw    */
/* per-question Likert responses — the survey's actual item polarity     */
/* (which response option means "good") isn't reliably inferable from    */
/* the option text alone for ~145 items, and no current widget in this   */
/* app consumes raw item-level data anyway; aggregated driver/dimension  */
/* scores are what "Explorers", "Your Score", trend widgets etc. need.   */
/*                                                                      */
/* MODEL: every driver score for a user/round comes from a mix of        */
/* shared per-user "latent" traits (resilience, healthHabits,            */
/* workloadPressure, orgFit, wellbeingBaseline) plus department/location */
/* baselines (a bad manager affects a whole team, not one person) plus   */
/* independent noise. `wellbeingBaseline` is deliberately the dominant    */
/* factor, applied to nearly every driver — without a single strong      */
/* factor like this, double-averaging (driver -> dimension -> overall)   */
/* regresses every user toward the same score and nobody ever crosses    */
/* the Flourishing (>=70) / Struggling (<40) thresholds, which is what    */
/* actually happened on the first pass (see corr/histogram output).      */
/* Sleep is computed before Stress/Depression/Anxiety and fed directly    */
/* into them (not just through a shared latent) so that relationship is  */
/* strong and demonstrable — real survey correlations are noisier, but   */
/* a prototype demo benefits from an obviously discoverable pattern for  */
/* the "insight" widget type to surface.                                 */
/*                                                                      */
/* Across the 3 rounds there's a deliberate org-wide narrative           */
/* (`orgShock`/`itShock`): a restructure dips round 2, round 3 partially  */
/* recovers plus an IT upgrade — gives trend widgets real movement to     */
/* show instead of flat noise.                                           */
/*                                                                      */
/* NOT YET WIRED IN: nothing in /src reads this dataset yet — widgets     */
/* still use their original hardcoded sample values. That's a deliberate */
/* separate step, not done here.                                         */
/* ================================================================== */
const fs = require("fs");
const path = require("path");

const N_USERS = 100;
const ROUND_DATES = ["2025-02-10", "2025-06-16", "2025-11-17"];

const DEPARTMENTS = ["Human Resources", "Accounting and Finance", "Marketing and Advertising", "Production", "IT", "Operations", "Customer Services/Support", "Legal", "Purchasing", "Business Development/Sales", "Distribution", "Research and Development", "Management/Admin"];
const JOB_LEVELS = ["Administrative staff", "Support staff", "Trained professional", "Skilled labourer", "Junior management", "Middle management", "Upper management"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to respond"];
const GENDER_WEIGHTS = [0.47, 0.47, 0.03, 0.03];
const LOCATIONS = ["Sydney HQ", "Melbourne Office", "Remote - APAC", "Auckland Office", "Singapore Office"];
const TENURE_BANDS = ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10-20 years", "20+ years"];
const TENURE_WEIGHTS = [0.12, 0.28, 0.22, 0.2, 0.14, 0.04];
const EMPLOYMENT_STATUS = ["Full-time", "Part-time", "Casual", "Temporary"];
const EMPLOYMENT_WEIGHTS = [0.8, 0.12, 0.05, 0.03];

const FIRST_NAMES = ["Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas", "Mia", "Jack", "Amelia", "Henry", "Charlotte", "James", "Grace", "Oliver", "Chloe", "Leo", "Zoe", "Alexander", "Lily", "Daniel", "Ella", "Matthew", "Hannah", "Samuel", "Layla", "David", "Nora", "Joseph", "Ruby", "Michael", "Aria", "Benjamin", "Scarlett", "William", "Ivy", "Jacob", "Priya", "Arjun", "Wei", "Mei", "Hiroshi", "Yuki", "Kwame", "Amara", "Diego", "Sofia", "Fatima", "Omar", "Aaliyah", "Malik", "Nia", "Raj", "Anika", "Kenji", "Sana", "Tariq", "Layna", "Rohan", "Freya", "Isla", "Finn", "Maya", "Theo", "Elena", "Jonas", "Nadia", "Felix", "Amira", "Carlos", "Lucia", "Marco", "Yara", "Dmitri", "Anya"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Perez", "White", "Harris", "Clark", "Lewis", "Walker", "Young", "King", "Nguyen", "Patel", "Kim", "Chen", "Singh", "Khan", "Ali", "Kumar", "Sharma", "Tanaka", "Sato", "Wong", "Ho", "Osei", "Mensah", "Diallo", "Silva", "Santos", "Rossi", "Muller", "Novak", "Petrov", "Ibrahim", "Hassan"];

function randNorm(mean, sd) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clip = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function pickWeighted(arr, weights) {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < arr.length; i++) { acc += weights[i]; if (r <= acc) return arr[i]; }
  return arr[arr.length - 1];
}

/* Driver -> Dimension map, curated from the survey's actual "Associated Driver"
   tags (docs/... Survey.xlsx, "Survey (NEW)" sheet). Dimension names match the
   survey's section headers exactly. */
const DRIVER_DIMENSION = {
  Nutrition: "Physical Health", Exercise: "Physical Health", Sleep: "Physical Health", Smoking: "Physical Health", Alcohol: "Physical Health",
  Stress: "Psychological Health", Depression: "Psychological Health", Anxiety: "Psychological Health", Resilience: "Psychological Health",
  "Work-life balance": "Life Outside Work", Commuting: "Life Outside Work", "Home duties": "Life Outside Work", "Support network": "Life Outside Work",
  "Engaging role": "Job Satisfaction", Workload: "Job Satisfaction", Resources: "Job Satisfaction",
  "Job security": "Employee Commitment", "R&R": "Employee Commitment", "Career prospects": "Employee Commitment", Safety: "Employee Commitment",
  "Growth and development": "Employee Engagement", "Sense of importance": "Employee Engagement",
  Trustworthy: "Coworker Dynamic", Supportive: "Coworker Dynamic", Respectful: "Coworker Dynamic", Hardworking: "Coworker Dynamic", "Good communication": "Coworker Dynamic",
  "Relationship with manager": "Manager Style", "Role clarity": "Manager Style", "Handling incompetence": "Manager Style",
  Values: "Corporate Culture", Leaders: "Corporate Culture", Empowerment: "Corporate Culture", Collaboration: "Corporate Culture", "Policies and Practices": "Corporate Culture", Morale: "Corporate Culture", Pride: "Corporate Culture",
  Policies: "Business Essentials", People: "Business Essentials",
  Comfort: "Physical Work Environment", Noise: "Physical Work Environment", "General Quality": "Physical Work Environment",
  Flexibility: "Soft Work Environment", "Distractions and disruptions": "Soft Work Environment", IT: "Soft Work Environment",
};
const DRIVERS = Object.keys(DRIVER_DIMENSION);
const DIMENSIONS = [...new Set(Object.values(DRIVER_DIMENSION))];

// Department- and location-level shared baselines (a bad manager affects a whole team, not just one person)
const deptManagerBaseline = {}, deptTeamBaseline = {};
DEPARTMENTS.forEach((d) => { deptManagerBaseline[d] = clip(randNorm(62, 10)); deptTeamBaseline[d] = clip(randNorm(64, 10)); });
const locationFacilities = {};
LOCATIONS.forEach((l) => { locationFacilities[l] = clip(randNorm(65, 12)); });

// Org-wide narrative across rounds: a restructure dips round 2, recovers + IT upgrade by round 3
const orgShock = [0, -7, 4];
const itShock = [0, -4, 11];

function driftLatent(prev, sd) { return clip(prev + randNorm(0, sd)); }

/* Computes every driver for one user/round together (not independently) so
   real dependencies can chain — Sleep feeds Stress/Depression/Anxiety
   directly, not just through a shared latent, which otherwise gets diluted
   by per-driver noise and produces too weak a correlation. `wb` (wellbeing
   baseline) is a strong per-user factor applied to every driver so a
   generally-struggling or generally-thriving user reads that way across
   the whole dimension set, not just on isolated drivers — without it,
   double-averaging (driver -> dimension -> overall) regresses everyone
   toward the same overall score and nobody crosses the Flourishing/
   Struggling thresholds. */
function computeDrivers(u, latent, round) {
  const dm = deptManagerBaseline[u.department], dt = deptTeamBaseline[u.department], fac = locationFacilities[u.location];
  const wb = (latent.wellbeingBaseline - 60) * 1.5;
  const d = {};
  d.Nutrition = latent.healthHabits + wb + randNorm(0, 8);
  d.Exercise = latent.healthHabits + wb + randNorm(0, 9);
  d.Sleep = latent.healthHabits * 0.4 + latent.resilience * 0.3 - latent.workloadPressure * 0.2 + wb + randNorm(0, 7);
  d.Smoking = 78 + wb * 0.3 + randNorm(0, 15);
  d.Alcohol = 74 + wb * 0.3 + randNorm(0, 15);
  d.Stress = 100 - latent.workloadPressure * 0.4 - (100 - latent.resilience) * 0.25 - (100 - d.Sleep) * 0.3 + wb + randNorm(0, 6);
  d.Depression = latent.resilience * 0.35 + (100 - latent.workloadPressure) * 0.15 + (d.Sleep - 50) * 0.25 + wb + randNorm(12, 7);
  d.Anxiety = latent.resilience * 0.35 + (100 - latent.workloadPressure) * 0.2 + (d.Stress - 50) * 0.2 + wb + randNorm(8, 7);
  d.Resilience = latent.resilience + wb * 0.6 + randNorm(0, 7);
  d["Work-life balance"] = 100 - latent.workloadPressure * 0.55 + latent.resilience * 0.15 + wb + randNorm(0, 8);
  d.Commuting = (u.workModel === "Remote" ? 85 : u.workModel === "Hybrid" ? 66 : 54) + wb * 0.3 + randNorm(0, 10);
  d["Home duties"] = 60 + wb * 0.3 + randNorm(0, 13);
  d["Support network"] = latent.resilience * 0.35 + 38 + wb * 0.4 + randNorm(0, 11);
  d["Engaging role"] = latent.orgFit * 0.45 + (100 - latent.workloadPressure) * 0.15 + wb + randNorm(5, 8);
  d.Workload = 100 - latent.workloadPressure + wb * 0.4 + randNorm(0, 6);
  d.Resources = latent.orgFit * 0.35 + dm * 0.35 + wb * 0.5 + randNorm(0, 8);
  d["Job security"] = latent.orgFit * 0.45 + 26 + wb * 0.5 + randNorm(0, 8) + orgShock[round];
  d["R&R"] = latent.orgFit * 0.45 + 21 + wb * 0.5 + randNorm(0, 10) + orgShock[round];
  d["Career prospects"] = latent.orgFit * 0.4 + 23 + wb * 0.5 + randNorm(0, 10);
  d.Safety = 78 + wb * 0.3 + randNorm(0, 10) + orgShock[round] * 0.5;
  d["Growth and development"] = latent.orgFit * 0.35 + dt * 0.15 + wb * 0.5 + randNorm(6, 10);
  d["Sense of importance"] = latent.orgFit * 0.45 + latent.resilience * 0.1 + wb * 0.5 + randNorm(6, 8);
  const teamBase = dt + latent.teamQualityNoise + wb * 0.35;
  d.Trustworthy = teamBase + randNorm(0, 8);
  d.Supportive = teamBase + randNorm(0, 8);
  d.Respectful = teamBase + randNorm(0, 8);
  d.Hardworking = teamBase + randNorm(0, 8);
  d["Good communication"] = teamBase + randNorm(0, 8);
  d["Relationship with manager"] = dm + latent.managerQualityNoise + wb * 0.35 + randNorm(0, 7);
  d["Role clarity"] = dm * 0.65 + latent.orgFit * 0.15 + wb * 0.4 + randNorm(0, 8);
  d["Handling incompetence"] = dm * 0.75 + wb * 0.3 + randNorm(0, 10);
  const cultureBase = latent.orgFit + wb * 0.5 + orgShock[round];
  d.Values = cultureBase + randNorm(0, 7);
  d.Leaders = cultureBase + randNorm(0, 7);
  d.Empowerment = cultureBase + randNorm(0, 7);
  d.Collaboration = cultureBase + randNorm(0, 7);
  d["Policies and Practices"] = cultureBase + randNorm(0, 7);
  d.Morale = latent.orgFit * 0.6 + (100 - latent.workloadPressure) * 0.1 + wb * 0.5 + orgShock[round] + randNorm(0, 6);
  d.Pride = latent.orgFit * 0.65 + wb * 0.5 + orgShock[round] + randNorm(0, 7);
  d.Policies = latent.orgFit * 0.5 + 16 + wb * 0.4 + orgShock[round] * 0.7 + randNorm(0, 8);
  d.People = latent.orgFit * 0.5 + 16 + wb * 0.4 + orgShock[round] * 0.7 + randNorm(0, 8);
  d.Comfort = fac + wb * 0.2 + randNorm(0, 9);
  d.Noise = fac + wb * 0.2 + randNorm(0, 9);
  d["General Quality"] = fac + wb * 0.2 + randNorm(0, 9);
  d.Flexibility = (u.workModel === "Remote" ? 80 : u.workModel === "Hybrid" ? 70 : 54) + wb * 0.3 + randNorm(0, 9);
  d["Distractions and disruptions"] = (u.workModel === "Remote" ? 70 : 55) + wb * 0.3 + randNorm(0, 11);
  d.IT = 55 + itShock[round] + wb * 0.2 + randNorm(0, 9);
  Object.keys(d).forEach((k) => { d[k] = round1(clip(d[k])); });
  return d;
}

// ---- Generate users (fixed demographics + round-0 latent baseline) ----
const usedIds = new Set();
const users = [];
for (let i = 1; i <= N_USERS; i++) {
  const gender = pickWeighted(GENDERS, GENDER_WEIGHTS);
  const department = pick(DEPARTMENTS);
  const homeWorkPct = clip(randNorm(35, 25), 0, 100);
  const workModel = homeWorkPct < 20 ? "Onsite" : homeWorkPct < 70 ? "Hybrid" : "Remote";
  users.push({
    id: `EMP${String(i).padStart(4, "0")}`,
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    gender, department,
    jobLevel: pick(JOB_LEVELS),
    location: pick(LOCATIONS),
    tenure: pickWeighted(TENURE_BANDS, TENURE_WEIGHTS),
    employmentStatus: pickWeighted(EMPLOYMENT_STATUS, EMPLOYMENT_WEIGHTS),
    workModel,
    _latent: {
      resilience: clip(randNorm(62, 16)),
      healthHabits: clip(randNorm(58, 17)),
      workloadPressure: clip(randNorm(55, 18)),
      orgFit: clip(randNorm(60, 17)),
      wellbeingBaseline: clip(randNorm(60, 24)),
      managerQualityNoise: clip(randNorm(0, 12), -30, 30),
      teamQualityNoise: clip(randNorm(0, 12), -30, 30),
    },
  });
}

// ---- Generate rounds ----
for (const u of users) {
  u.rounds = [];
  let latent = { ...u._latent };
  for (let round = 0; round < 3; round++) {
    if (round > 0) {
      latent = {
        resilience: driftLatent(latent.resilience, 5),
        healthHabits: driftLatent(latent.healthHabits, 5),
        workloadPressure: driftLatent(latent.workloadPressure, 6),
        orgFit: driftLatent(latent.orgFit, 5),
        wellbeingBaseline: driftLatent(latent.wellbeingBaseline, 6),
        managerQualityNoise: clip(driftLatent(latent.managerQualityNoise, 4), -30, 30),
        teamQualityNoise: clip(driftLatent(latent.teamQualityNoise, 4), -30, 30),
      };
    }
    const driverScores = computeDrivers(u, latent, round);
    const dimensionScores = {};
    DIMENSIONS.forEach((dim) => {
      const ds = DRIVERS.filter((d) => DRIVER_DIMENSION[d] === dim).map((d) => driverScores[d]);
      dimensionScores[dim] = round1(ds.reduce((a, b) => a + b, 0) / ds.length);
    });
    const overallScore = round1(DIMENSIONS.reduce((a, dim) => a + dimensionScores[dim], 0) / DIMENSIONS.length);
    const status = overallScore >= 70 ? "Flourishing" : overallScore >= 40 ? "Striving" : "Struggling";
    // eNPS-sheet-derived metrics, correlated with orgFit/pride/morale
    const recommendScore = Math.round(clip((latent.orgFit + orgShock[round] * 1.2) / 10 + randNorm(0, 1.3), 0, 10));
    const morale = Math.round(clip((dimensionScores["Corporate Culture"]) / 10 + randNorm(0, 1), 0, 10));
    const peerMorale = Math.round(clip(morale + randNorm(0, 1.2), 0, 10));
    u.rounds.push({
      round: round + 1,
      date: ROUND_DATES[round],
      driverScores, dimensionScores, overallScore, status,
      recommendScore, morale, peerMorale,
    });
  }
  delete u._latent;
}

// ---- Org-level per-round summary ----
function orgSummary(round) {
  const rs = users.map((u) => u.rounds[round]);
  const avgOverall = round1(rs.reduce((a, r) => a + r.overallScore, 0) / rs.length);
  const flourishing = rs.filter((r) => r.status === "Flourishing").length;
  const striving = rs.filter((r) => r.status === "Striving").length;
  const struggling = rs.filter((r) => r.status === "Struggling").length;
  const promoters = rs.filter((r) => r.recommendScore >= 9).length;
  const detractors = rs.filter((r) => r.recommendScore <= 6).length;
  const eNPS = Math.round(((promoters - detractors) / rs.length) * 100);
  const dimensionAvg = {};
  DIMENSIONS.forEach((dim) => { dimensionAvg[dim] = round1(rs.reduce((a, r) => a + r.dimensionScores[dim], 0) / rs.length); });
  const driverAvg = {};
  DRIVERS.forEach((d) => { driverAvg[d] = round1(rs.reduce((a, r) => a + r.driverScores[d], 0) / rs.length); });
  return { round: round + 1, date: ROUND_DATES[round], avgOverall, flourishing, striving, struggling, eNPS, avgMorale: round1(rs.reduce((a, r) => a + r.morale, 0) / rs.length), dimensionAvg, driverAvg };
}
const orgSummaries = [0, 1, 2].map(orgSummary);

// ---- Simple correlation check (sanity) ----
function corr(xs, ys) {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
  return num / Math.sqrt(dx * dy);
}
const sleepVals = users.map((u) => u.rounds[0].driverScores.Sleep);
const stressVals = users.map((u) => u.rounds[0].driverScores.Stress);
const workloadVals = users.map((u) => u.rounds[0].driverScores.Workload);
const wlbVals = users.map((u) => u.rounds[0].driverScores["Work-life balance"]);
console.log("corr(Sleep, Stress) round1:", corr(sleepVals, stressVals).toFixed(2), "(expect positive: both are 'good=high' so low sleep + low stress-score, i.e. high stress symptoms, should move together)");
console.log("corr(Workload, Work-life balance) round1:", corr(workloadVals, wlbVals).toFixed(2), "(expect strongly positive)");
console.log("\nOrg summary per round:");
orgSummaries.forEach((s) => console.log(` R${s.round} (${s.date}): avgScore=${s.avgOverall} eNPS=${s.eNPS} F/S/St=${s.flourishing}/${s.striving}/${s.struggling} avgMorale=${s.avgMorale}`));

const r1Scores = users.map((u) => u.rounds[0].overallScore).sort((a, b) => a - b);
const buckets = Array(10).fill(0);
r1Scores.forEach((s) => buckets[Math.min(9, Math.floor(s / 10))]++);
console.log("\nRound 1 overall-score histogram (bucket:count):", buckets.map((c, i) => `${i * 10}-${i * 10 + 9}:${c}`).join(" "));
console.log("min/max:", r1Scores[0], r1Scores[r1Scores.length - 1]);

const dataset = {
  meta: {
    generatedFrom: "Survey.xlsx (Survey (NEW) + eNPS sheets)",
    userCount: N_USERS,
    rounds: ROUND_DATES.map((d, i) => ({ round: i + 1, date: d })),
    dimensions: DIMENSIONS,
    driverDimensionMap: DRIVER_DIMENSION,
  },
  orgSummaries,
  users,
};

fs.writeFileSync(path.join(__dirname, "dataset.json"), JSON.stringify(dataset, null, 2));
console.log("\nWrote dataset.json —", (fs.statSync(path.join(__dirname, "dataset.json")).size / 1024).toFixed(0), "KB");
