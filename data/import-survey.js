/* ================================================================== */
/* IMPORT THE SHAPE SURVEY — sources/SHAPE Survey File.xlsx → JSON.      */
/*                                                                      */
/*   npm run survey   (from /data)                                      */
/*                                                                      */
/* Writes src/data/surveys/shape-survey.json: the survey as a record    */
/* the product can read (Developer › Data shows it). Two layers, kept   */
/* apart on purpose:                                                    */
/*  1. TRANSCRIPTION — every row of the "Survey (NEW)" sheet, verbatim:  */
/*     number, text, short label, driver, design type, options, hover   */
/*     label. Only two repairs, both flagged on the question: Excel     */
/*     stored 1.10 / 1.20 as the numbers 1.1 / 1.2, so numbers are      */
/*     restored by position; and trailing spaces are trimmed.           */
/*  2. INTERPRETATION — which scoring scale each question uses (from    */
/*     the "Score per response" sheet) and whether it counts towards    */
/*     the score (from "ScoredNonscored"). Where the file is silent or  */
/*     contradicts itself, the value is marked `source: "proposed"` and */
/*     an issue says why. Nothing proposed is presented as the file's.  */
/*     `source: "confirmed"` = answered by the product owner (Oct 2026)  */
/*     where the file was silent or wrong; the answer is on the issue.  */
/* ================================================================== */
const X = require("xlsx");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "sources", "SHAPE Survey File.xlsx");
const OUT = path.join(__dirname, "..", "src", "data", "surveys", "shape-survey.json");
const wb = X.readFile(SRC, { cellNF: true, cellText: true });
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/* ---- sections ------------------------------------------------------ */
/* The file's heading → our section. "Demographics" is called Your Profile in the product; the HPQ block (Q16) sits inside
   it in the file and is kept as its own group. `code` is the prefix the scoring sheet uses for that section. */
const SECTIONS = {
  DEMOGRAPHICS: { id: "profile", name: "Your Profile", fileName: "Demographics", kind: "profile", code: "PRO" },
  "PHYSICAL HEALTH": { id: "physical-health", name: "Physical Health", kind: "explorer", code: "PHYS" },
  "PSYCHOLOGICAL HEALTH": { id: "psychological-health", name: "Psychological Health", kind: "explorer", code: "PSY" },
  "LIFE OUTSIDE WORK": { id: "life-outside-work", name: "Life Outside Work", kind: "explorer", code: "FOW", aka: "Factors Outside Work (scoring sheets)" },
  "JOB SATISFACTION": { id: "job-satisfaction", name: "Job Satisfaction", kind: "explorer", code: "JS" },
  "EMPLOYEE COMMITMENT": { id: "employee-commitment", name: "Employee Commitment", kind: "explorer", code: "EC" },
  "EMPLOYEE ENGAGEMENT": { id: "employee-engagement", name: "Employee Engagement", kind: "explorer", code: "EE" },
  "COWORKER DYNAMIC": { id: "coworker-dynamic", name: "Coworker Dynamic", kind: "explorer", code: "CD" },
  "MANAGER STYLE": { id: "manager-style", name: "Manager Style", kind: "explorer", code: "MS" },
  "CORPORATE CULTURE": { id: "corporate-culture", name: "Corporate Culture", kind: "explorer", code: "CC" },
  "BUSINESS ESSENTIALS": { id: "business-essentials", name: "Business Essentials", kind: "explorer", code: "S", aka: "Business Fundamentals (scoring sheets)" },
  "PHYSICAL WORK ENVIRONMENT": { id: "physical-work-environment", name: "Physical Work Environment", kind: "explorer", code: "PhysWE" },
  "SOFT WORK ENVIRONMENT": { id: "soft-work-environment", name: "Soft Work Environment", kind: "explorer", code: "SoftWE" },
};

/* ---- 1. transcription --------------------------------------------- */
const ws = wb.Sheets["Survey (NEW)"];
const range = X.utils.decode_range(ws["!ref"]);
const cell = (r, c) => { const v = ws[X.utils.encode_cell({ r, c })]; return v ? clean(v.w ?? v.v) : ""; };
const COL = { num: 0, text: 1, short: 2, driver: 3, design: 4, opt0: 5, optN: 20, hover: 21 };

const rows = [];
for (let r = 2; r <= range.e.r; r++) {
  const num = cell(r, COL.num), text = cell(r, COL.text);
  const options = []; for (let c = COL.opt0; c <= COL.optN; c++) { const o = cell(r, c); if (o) options.push(o); }
  const row = { line: r + 1, num, text, short: cell(r, COL.short), driver: cell(r, COL.driver), design: cell(r, COL.design), options, hover: cell(r, COL.hover) };
  if (Object.values(row).every((v) => !v || (Array.isArray(v) && !v.length) || typeof v === "number")) continue;
  rows.push(row);
}

const sections = [];
let sec = null, stem = null, lastMinor = {}, lastQuestion = null;
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  // A section heading: upper-case text in the number column, nothing else.
  if (!row.text && SECTIONS[row.num]) {
    sec = { ...SECTIONS[row.num], fileHeading: row.num, groups: [] };
    sections.push(sec); stem = null; lastMinor = {}; continue;
  }
  // A stem with no number ("Regarding your job/role under *manager x*").
  if (!row.text && row.num && !SECTIONS[row.num]) { stem = { number: null, text: row.num, line: row.line, questions: [] }; sec.groups.push(stem); continue; }
  // A row with no number continues the question above (a "please specify" follow-up, or the Office / Home parts).
  if (!row.num) {
    if (!row.design && !row.options.length && lastQuestion) { (lastQuestion.parts = lastQuestion.parts || []).push(row.text); continue; }
    if (lastQuestion) { (lastQuestion.followUps = lastQuestion.followUps || []).push({ text: row.text, design: row.design, line: row.line }); continue; }
  }
  // Restore the number Excel shortened: 1.10 was stored as 1.1, 1.20 as 1.2.
  let number = row.num, renumbered = null;
  const m = /^(\d+)\.(\d+)$/.exec(number);
  if (m) {
    const parent = m[1]; let minor = Number(m[2]);
    if (lastMinor[parent] != null && minor <= lastMinor[parent]) { renumbered = number; minor = lastMinor[parent] + 1; number = `${parent}.${minor}`; }
    lastMinor[parent] = minor;
  }
  const next = rows[i + 1];
  const isStem = !row.design && !row.options.length && !/\./.test(number) && next && new RegExp(`^${number}\\.`).test(next.num);
  if (isStem) { stem = { number, text: row.text, line: row.line, questions: [] }; sec.groups.push(stem); continue; }
  const q = {
    id: `${sec.code}${number}`, number, text: row.text, line: row.line,
    shortLabel: row.short || null, driver: row.driver || null, design: row.design || "Free text (no type given)", options: row.options, hoverLabel: row.hover || null,
  };
  if (renumbered) q.renumbered = renumbered;
  // A top-level question (no dot) closes the current stem.
  if (!/\./.test(number)) stem = null;
  if (stem && number.startsWith(`${stem.number}.`) || (stem && stem.number === null)) stem.questions.push(q);
  else { const g = { number: null, text: null, questions: [q] }; sec.groups.push(g); }
  lastQuestion = q;
}

/* ---- 2. interpretation: scales ------------------------------------- */
/* The "Score per response" sheet, as scales. `appliesTo` is the sheet's own label, verbatim. */
const SCALES = {
  agree5: { name: "Agreement (5)", appliesTo: "CC1.1-1.22, EE1.1-1.10, JS2.1-2.6, PWE1.1-1.6, MS2.2-2.3, EC1.1-1.6, PhysWE 1.1-1.8, SoftWE 1.1-1.6,2.1-2.6", options: [["Strongly agree", 100], ["Agree", 75], ["Neutral", 50], ["Disagree", 25], ["Strongly disagree", 0]] },
  zeroTen: { name: "0 to 10", appliesTo: "CC2.1-2.3", options: [...Array(11)].map((_, i) => [String(i), i * 10]) },
  safety5: { name: "Safety (5)", appliesTo: "EC2", options: [["Yes, very safe", 100], ["Pretty safe", 75], ["Unsure", 50], ["Not that safe", 25], ["Not safe at all", 0]] },
  oneFive: { name: "1 to 5 (smileys)", appliesTo: "JS1.1-1.3", options: [["1", 20], ["2", 40], ["3", 60], ["4", 80], ["5", 100]], note: "Shown to people as five smileys: 5 is the biggest smile, so 5 is good (confirmed, I13)." },
  strainFile: { name: "Strain (scoring sheet: 4 levels)", appliesTo: "FOW1.1-1.4", options: [["A lot", 0], ["A moderate amount", 33], ["A little", 66], ["Not at all", 100]], note: "Out of date: the survey's own five strain levels are used instead (confirmed, I3)." },
  balance5: { name: "Balance (5)", appliesTo: "FOW2", options: [["Ideal", 100], ["Satisfactory", 75], ["Challenging", 50], ["Extremely challenging", 25], ["Unmanageable", 0]] },
  supportFile: { name: "Support network (scoring sheet: 4 levels)", appliesTo: "FOW3", options: [["Non-existent", 0], ["Minimal", 33], ["Sufficient", 66], ["Extensive", 100]], note: "Out of date: the question is scored on the agreement scale (confirmed, I4)." },
  fruitVeg: { name: "Fruit and vegetables", appliesTo: "PHYS1", options: [["None", 0], ["1", 17], ["2", 34], ["3", 51], ["4", 68], ["5 to 6", 85], ["7+", 100]] },
  exercise: { name: "Exercise hours", appliesTo: "PHYS2", options: [["None", 0], ["Less than 0.5", 17], ["0.5 to 1", 34], ["1 to 2", 51], ["2 to 3", 68], ["3 to 4", 85], ["Greater than 4", 100]] },
  smoking: { name: "Cigarettes a day", appliesTo: "PHYS3", options: [["None", 100], ["Less than 5", 67], ["5 to 20", 33], ["Greater than 20", 0]] },
  alcohol: { name: "Standard drinks a week", appliesTo: "PHYS4", options: [["0", 100], ["1 to 7", 100], ["8 to 14", 80], ["15 to 21", 60], ["22 to 28", 40], ["29 to 35", 20], ["36+", 0]] },
  frequency4: { name: "Frequency (4)", appliesTo: "PHYS5, PSY1.1-1.9", options: [["Never", 100], ["Sometimes", 66.67], ["Often", 33.33], ["Almost Always", 0]] },
  bmi: { name: "BMI band", appliesTo: "PHYS6", options: [[">35", 0], ["33-35", 17], ["30-32", 34], ["27-29", 51], ["25-26", 68], ["24", 85], ["<24", 100]] },
  resilience5: { name: "Resilience (5)", appliesTo: "PSY3.1-3.3", options: [["Absolutely yes", 100], ["Very much so", 75], ["Somewhat", 50], ["More or less", 25], ["Not really", 0]] },
  stress4: { name: "Stressfulness (4)", appliesTo: "PSY4 and 5", options: [["Not stressful at all", 100], ["A little stressful", 66], ["Moderately stressful", 33], ["Extremely stressful", 0]] },
  effective4: { name: "Effectiveness (4)", appliesTo: "MS2.4", note: "The sheet's MS2.4 is the survey's MS2.6 (confirmed, I7).", options: [["Very effective", 100], ["Somewhat effective", 67], ["Not very effective", 33], ["Poor", 0]] },
  level5: { name: "Very low to very high", appliesTo: "SR1.1,1.3,1.5 (MS)", options: [["Very low", 0], ["Low", 25], ["Average", 50], ["High", 75], ["Very high", 100]], note: "No question in the survey uses these options. Probably the Situational Leadership result, which isn't asked directly (open, I6)." },
  rating5: { name: "Rating (5)", appliesTo: "S1.1-1.10", options: [["Excellent", 100], ["Good", 75], ["Average", 50], ["Poor", 25], ["Very poor", 0]] },
  // Proposed, not in the file: marked as such wherever they're used.
  strain5: { name: "Strain (5)", confirmed: true, options: [["Severe strain", 0], ["High strain", 25], ["Moderate strain", 50], ["Low strain", 75], ["No strain", 100]], note: "Not in the file; confirmed by the product owner (I3). N/A is left out of the average." },
  coworkers5: { name: "How many coworkers (5)", confirmed: true, options: [["All", 100], ["Most", 75], ["About half", 50], ["Some", 25], ["None", 0]], note: "Not in the file; confirmed by the product owner (I5)." },
  hpq: { name: "HPQ 0 to 10", options: [...Array(11)].map((_, i) => [String(i), i * 10]), note: "Health and Work Performance Questionnaire. Not part of the SHAPE score; read on its own (absolute performance = Q16.3 × 10)." },
};

/* Which scale each question uses. Keys are question ids (section code + number); `source` says where it comes from. */
const F = "file", P = "proposed", C = "confirmed";
const SCALE_OF = {};
const assign = (ids, scale, source = F, note) => ids.forEach((id) => { SCALE_OF[id] = { scale, source, note }; });
const span = (code, parent, from, to) => [...Array(to - from + 1)].map((_, i) => `${code}${parent}.${from + i}`);
assign(["PHYS1"], "fruitVeg"); assign(["PHYS2"], "exercise");
assign(["PHYS3"], "smoking", F, "“Ex Smoker” isn't in the scoring sheet; it scores 100 for now (proposed, still to be clarified: I8).");
assign(["PHYS4"], "alcohol"); assign(["PHYS5"], "frequency4"); assign(["PHYS6"], "bmi", F, "Scored from the BMI worked out of height and weight, not from an answer option.");
assign(span("PSY", 1, 1, 9), "frequency4");
assign(["PSY2.2"], "agree5", P, "Not in the scoring sheet's agreement list; the agreement scale is the obvious fit.");
assign(["PSY2.1"], "agree5", C, "Not reversed, by decision (I12): it isn't scored, so it's shown as answered.");
assign(span("PSY", 3, 1, 3), "resilience5");
assign([...span("PSY", 4, 1, 6), ...span("PSY", 5, 1, 5)], "stress4");
assign(span("FOW", 1, 1, 4), "strain5", C, "The survey's own five strain levels (the scoring sheet's FOW1 labels are out of date).");
assign(["FOW2"], "balance5");
assign(["FOW3"], "agree5", C, "Agreement, as the survey asks (the scoring sheet's FOW3 labels are out of date).");
assign(["JS1.1", "JS1.2", "JS1.3"], "oneFive");
assign(span("JS", 2, 1, 5), "agree5");
assign(span("EC", 1, 1, 6), "agree5"); assign(["EC2"], "safety5");
assign(span("EE", 1, 1, 9), "agree5");
assign(span("CD", 1, 1, 12), "coworkers5", C);
assign(["MS2.2", "MS2.3", "MS2.4", "MS2.5"], "agree5", F, null);
SCALE_OF["MS2.4"].source = C; SCALE_OF["MS2.4"].note = "Role clarity, an agreement statement added after the scoring sheet was written (I7).";
SCALE_OF["MS2.5"].source = C; SCALE_OF["MS2.5"].note = "Agreement statement added after the scoring sheet was written (I7).";
assign(["MS2.6"], "effective4", C, "The scoring sheet calls this MS2.4; its numbering predates two added questions (I7).");
assign(span("CC", 1, 1, 22), "agree5"); assign(span("CC", 2, 1, 3), "zeroTen");
assign(span("S", 1, 1, 10), "rating5");
assign(span("PhysWE", 1, 1, 8), "agree5");
assign(span("SoftWE", 1, 1, 6), "agree5"); assign(span("SoftWE", 2, 1, 6), "agree5");
assign(["SoftWE4.1", "SoftWE4.2"], "agree5", P, "Agreement statements for managers, not in the sheet's list (non-scored).");
assign(["PRO16.1", "PRO16.2", "PRO16.3"], "hpq", F, null);

/* ---- 2. interpretation: scored / non-scored ------------------------- */
/* From "ScoredNonscored" (the sheet stored "1-6" and "1-2" as dates; the cell format still shows the text). */
const sn = wb.Sheets["ScoredNonscored"];
const snRows = []; for (let r = 5; r <= 30; r++) { const a = sn[`A${r + 1}`], b = sn[`B${r + 1}`], c = sn[`C${r + 1}`], d = sn[`D${r + 1}`]; if (a || c) snRows.push({ scoredExplorer: a && clean(a.w), scoredQs: b && clean(b.w), nonExplorer: c && clean(c.w), nonQ: d && clean(d.w) }); }
const SCORED_FILE = snRows.filter((r) => r.scoredExplorer).map((r) => [r.scoredExplorer, r.scoredQs]);
const NONSCORED_FILE = snRows.filter((r) => r.nonExplorer).map((r) => [r.nonExplorer, r.nonQ]);

/* The rule per question: "scored" (counts towards its Explorer and the overall score), "separate" (has a score but is shown
   on its own, never added), "unscored" (no score: free text, yes/no, profile). Read off the sheet, then the conflicts. */
const STATUS = {};
const set = (ids, status, source = F, note) => ids.forEach((id) => { STATUS[id] = { status, source, note }; });
set(["PHYS1", "PHYS2", "PHYS3", "PHYS4", "PHYS5", "PHYS6"], "scored");
set(["PHYS7", "PHYS8", "PHYS9"], "unscored");
set(span("PSY", 1, 1, 9), "scored");
set(["PSY2.1", "PSY2.2", ...span("PSY", 3, 1, 3), ...span("PSY", 4, 1, 6), ...span("PSY", 5, 1, 5)], "separate");
set(["PSY6"], "unscored");
set([...span("FOW", 1, 1, 4), "FOW2", "FOW3"], "scored"); set(["FOW1.5"], "unscored");
set(["JS1.1", ...span("JS", 2, 1, 5)], "scored"); set(["JS1.2", "JS1.3"], "separate"); set(["JS3"], "unscored", C, "Free text: never scored (I10).");
set([...span("EC", 1, 1, 6), "EC2"], "scored"); set(["EC3"], "unscored", C, "Free text: never scored (I10).");
set(span("EE", 1, 1, 9), "scored"); set(["EE2"], "unscored", C, "Free text: never scored (I10).");
set(span("CD", 1, 1, 12), "scored"); set(["CD2"], "unscored", C, "Free text: never scored (I10).");
set([...span("MS", 1, 1, 4), ...span("MS", 2, 1, 4)], "scored");
set(["MS2.5"], "separate", F, "Listed as non-scored; it has an agreement scale, so it can still be shown on its own.");
set(["MS2.6"], "scored", C, "Scored: it's the scoring sheet's MS2.4 (I7).");
set(["MS2.7"], "unscored", C, "Free text: never scored (I10).");
set([...span("CC", 1, 1, 22), ...span("CC", 2, 1, 3)], "scored"); set(["CC3"], "unscored");
set(span("S", 1, 1, 10), "scored"); set(["S2"], "unscored", C, "Free text: never scored (I10).");
set(span("PhysWE", 1, 1, 8), "scored"); set(["PhysWE1.9"], "unscored");
set(span("SoftWE", 1, 1, 6), "scored");
set(["SoftWE1.7"], "unscored", C, "In both lists in the file; free text is never scored (I10).");
set([...span("SoftWE", 2, 1, 6)], "separate", F, "Non-scored (Q2), but the scoring sheet gives it the agreement scale: shown on its own.");
set(["SoftWE2.7", "SoftWE3", "SoftWE4.1", "SoftWE4.2"], "unscored");
set(["SoftWE4.1", "SoftWE4.2"], "separate", P, "Non-scored (Q4); agreement statements, so they can be shown on their own.");

/* Who is asked. */
const AUDIENCE = {
  ...Object.fromEntries(span("SoftWE", 2, 1, 7).map((id) => [id, "People who work from home"])),
  SoftWE3: "People who work both from home and from the office", "SoftWE4.1": "Managers", "SoftWE4.2": "Managers",
  "PRO7": "Only where approved for the country (ethnicity)",
};
const SENSITIVE = new Set(["PRO1.1", "PRO1.2", "PRO2", "PRO3", "PRO4", "PRO7", "PRO10", "PRO15"]);
const PROFILE_FIELD = { "PRO1.1": "firstName", "PRO1.2": "lastName", PRO2: "title", PRO3: "dateOfBirth → age", PRO4: "gender", PRO5: "education", PRO6: "country", PRO7: "ethnicity", PRO8: "department", PRO9: "site", PRO10: "jobTitle", PRO11: "employmentStatus", PRO12: "officeHours, homeHours → work model (Office · Home · Hybrid) and the weighting of work-environment answers", PRO13: "jobLevel", PRO14: "tenure", PRO15: "salaryBand (bands depend on country)", "PRO16.1": "hpqOthers", "PRO16.2": "hpqUsual", "PRO16.3": "hpqRecent" };

/* Country: a full list for now (confirmed, I15). ISO 3166-1 alpha-2 codes, named in English by Intl. The file says "all
   countries with a few exceptions"; the exceptions are still to come. */
const ISO = "AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW".split(" ");
const regionName = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRIES = ISO.map((c) => regionName.of(c)).sort((a, b) => a.localeCompare(b));

/* Drivers the file doesn't name, or names confusingly (confirmed: I17, I18; Situational Leadership's inputs pending I6). */
const DRIVER_FIX = {
  "EE1.1": ["Working relationships", C, "Renamed from “Coworker Dynamic”, so it isn't confused with the Explorer (I17)."],
  "EE1.2": ["Working relationships", C, "Renamed from “Coworker Dynamic” (I17)."],
  "EE1.8": ["Working relationships", C, "Renamed from “Coworker Dynamic” (I17)."],
  "MS1.2": ["Situational Leadership", P, "An input to Situational Leadership with Q1.1, 1.3, 1.4 and 2.1; its formula is still to come (I6)."],
  "MS1.3": ["Situational Leadership", P, "An input to Situational Leadership (I6)."],
  "MS1.4": ["Situational Leadership", P, "An input to Situational Leadership (I6)."],
  "MS2.1": ["Situational Leadership", P, "Your competence: the other input to Situational Leadership (I6)."],
};
/* Text that needed a fix: the original is kept beside it. */
const TEXT_FIX = [["*manager x*", "{manager's name}"]];
const HOVER_FIX = { "SoftWE1.6": [["consistant", "consistent"]] };
/* Questions asked twice for Hybrid people (office and home), and how the two answers combine (for now, I14). */
const COMBINE = "Asked twice for Hybrid people, once for the office and once for home. The two answers are averaged, weighted by their contracted office and home hours (Your Profile Q12). For now (I14).";
const COMBINED = new Set([...span("PhysWE", 1, 1, 8), ...span("SoftWE", 1, 1, 6)]);

/* ---- attach ------------------------------------------------------- */
const all = [];
const fixText = (t) => TEXT_FIX.reduce((x, [a, b]) => x.split(a).join(b), t);
for (const s of sections) {
  for (const g of s.groups) {
    if (g.text && fixText(g.text) !== g.text) { g.textInFile = g.text; g.text = fixText(g.text); }
    for (const q of g.questions) {
      q.section = s.id; all.push(q);
      if (fixText(q.text) !== q.text) { q.textInFile = q.text; q.text = fixText(q.text); }
      if (HOVER_FIX[q.id]) { q.hoverInFile = q.hoverLabel; q.hoverLabel = HOVER_FIX[q.id].reduce((x, [a, b]) => x.replace(a, b), q.hoverLabel); }
      const sc = SCALE_OF[q.id];
      if (sc) {
        const scale = SCALES[sc.scale];
        q.scale = sc.scale; q.scaleSource = sc.source; if (sc.note) q.scaleNote = sc.note;
        // Score each of the question's own options; an option the scale doesn't name gets no score (and an issue).
        const lookup = Object.fromEntries(scale.options.map(([l, v]) => [l.toLowerCase(), v]));
        if (q.options.length) q.scores = q.options.map((o) => (o.toLowerCase() in lookup ? lookup[o.toLowerCase()] : /^n\/?a$/i.test(o) ? "excluded" : null));
      }
      if (s.kind === "profile") { q.status = "profile"; q.field = PROFILE_FIELD[q.id] || null; if (/^PRO16/.test(q.id)) { q.status = "separate"; q.group = "hpq"; } }
      else { const st = STATUS[q.id]; if (st) { q.status = st.status; q.statusSource = st.source; if (st.note) q.statusNote = st.note; } else { q.status = "unknown"; } }
      // A scored question with no Driver becomes its own Driver, named by its short label (I18).
      if (DRIVER_FIX[q.id]) { const [name, src, note] = DRIVER_FIX[q.id]; if (q.driver) q.driverInFile = q.driver; q.driver = name; q.driverSource = src; q.driverNote = note; }
      else if (!q.driver && q.status === "scored" && q.shortLabel) { q.driver = q.shortLabel; q.driverSource = C; q.driverNote = "No Driver in the file: its short label is its Driver (I18)."; }
      if (COMBINED.has(q.id)) q.combine = COMBINE;
      if (AUDIENCE[q.id]) q.audience = AUDIENCE[q.id];
      if (SENSITIVE.has(q.id)) q.sensitive = true;
    }
  }
}
const Q = (id) => all.find((q) => q.id === id);
// Ex Smoker: 100 for now, still flagged (I8).
Q("PHYS3").scores[Q("PHYS3").options.indexOf("Ex Smoker")] = 100; Q("PHYS3").proposedOptions = ["Ex Smoker"];
// Country and salary (I15).
Object.assign(Q("PRO6"), { optionsInFile: Q("PRO6").options, options: COUNTRIES, optionsSource: C, optionsNote: `A full country list for now (${COUNTRIES.length}, ISO 3166). The file says “all countries with a few exceptions”; the exceptions are still to come.` });
Object.assign(Q("PRO15"), { dependsOn: "PRO6", optionsNote: "The salary bands depend on the country picked (local currency). The bands are still to come." });
Object.assign(Q("PRO12"), { derives: { workModel: [["Office", "every contracted hour is at the office"], ["Home", "every contracted hour is at home"], ["Hybrid", "both"]] } });

/* ---- what's worked out from the answers ---------------------------- */
const DASS = { Depression: "Feeling Low", Stress: "Feeling Stressed", Anxiety: "Feeling Anxious" };
const DERIVED = [
  { id: "driver", name: "Driver score", source: C, rule: "The mean of its scored questions' scores (0 to 100). An N/A answer is left out.", from: "scored questions with that Driver" },
  { id: "explorer", name: "Explorer score", source: C, rule: "The mean of its scored questions' scores (I2). An N/A answer is left out. Shown separately and unscored questions never count.", from: "scored questions in the Explorer" },
  { id: "overall", name: "SHAPE score (overall)", source: P, rule: "The mean of the 12 Explorer scores, so each Explorer counts equally. The mean is confirmed (I2); averaging Explorers rather than every question is the choice made for now.", from: "the 12 Explorer scores" },
  { id: "qlb", name: "Question level breakdown (QLB)", source: C, rule: "Not a score: a chart of an Explorer broken down question by question (I2).", from: "each scored question's mean" },
  { id: "status", name: "Status", source: F, rule: "Struggling 0 to 59, Striving 60 to 79, Flourishing 80 to 100 (the product's scale, lib/bands.js).", from: "any score" },
  { id: "workModel", name: "Work model", source: C, rule: "Office if every contracted hour is at the office, Home if every hour is at home, Hybrid if both (I16). Not asked directly.", from: "Your Profile Q12 (office and home hours)" },
  { id: "age", name: "Age", source: F, rule: "Years since the date of birth, on the day the round closes.", from: "Your Profile Q3" },
  { id: "enps", name: "eNPS", source: C, rule: "Promoters answer 9 or 10, Passives 7 or 8, Detractors 0 to 6. eNPS = % Promoters − % Detractors (−100 to 100). Only from Corporate Culture 2.3 (I20); it also counts in Corporate Culture as a 0 to 100 score.", from: "CC2.3" },
  { id: "mentalWellbeing", name: "Mental well-being", source: C, rule: `Three measures from the nine DASS questions (the short form is intentional, I21): ${Object.entries(DASS).map(([d, l]) => `${l} = ${d} (${all.filter((q) => q.driver === d && /^PSY1\./.test(q.id)).map((q) => q.id).join(", ")})`).join("; ")}. Each falls into one of five levels: Normal, Mild, Moderate, Severe, Extremely Severe.`, from: "PSY1.1 to 1.9" },
  { id: "severityCutoffs", name: "Mental well-being levels", source: P, rule: "On each measure's 0 to 100 score (100 = Never): Normal 80+, Mild 60 to 79, Moderate 40 to 59, Severe 20 to 39, Extremely Severe under 20. The product's current assumption; the real cut-offs for the 9-item form are still to come (I22).", from: "the three measures" },
  { id: "hpq", name: "HPQ performance", source: P, rule: "Standard HPQ scoring: absolute performance = Q16.3 × 10 (0 to 100); relative performance = Q16.3 ÷ Q16.1. Never part of the SHAPE score; Time & Money reads it.", from: "Your Profile Q16.1 to 16.3" },
  { id: "hybrid", name: "Work environment for Hybrid people", source: C, rule: COMBINE, from: "PhysWE1.1-1.8, SoftWE1.1-1.6 and Your Profile Q12" },
];

/* ---- issues ------------------------------------------------------- */
/* Everything the file leaves open or contradicts, with the product owner's answer (Oct 2026). `state`: resolved | for-now
   (decided, but a better answer is coming) | open. `qs` are question ids. */
const ISSUES = [
  { kind: "naming", state: "resolved", title: "Two Explorer names differ between sheets", qs: [], detail: "The survey says Life Outside Work and Business Essentials; ScoredNonscored says Factors Outside Work and Business Fundamentals.", answer: "Life Outside Work and Business Essentials are the right names." },
  { kind: "gap", state: "resolved", title: "How scores are calculated isn't in the file", qs: [], detail: "The file says which questions are scored and what each answer is worth, but not how they're combined. ScoredNonscored also mentions a “QLB calculation”.", answer: "The mean, for now. QLB is the question level breakdown: a chart of an Explorer question by question, not a calculation. Averaging Explorers (not every question) for the overall score is the choice made for now." },
  { kind: "conflict", state: "resolved", title: "Life Outside Work Q1: the strain scale doesn't match", qs: span("FOW", 1, 1, 4), detail: "The survey offers Severe / High / Moderate / Low / No strain and N/A. The scoring sheet scores A lot / A moderate amount / A little / Not at all.", answer: "Use the five strain levels: Severe 0, High 25, Moderate 50, Low 75, No strain 100. N/A is left out." },
  { kind: "conflict", state: "resolved", title: "Life Outside Work Q3 (support network): the scale doesn't match", qs: ["FOW3"], detail: "The survey asks for agreement; the scoring sheet scores Non-existent / Minimal / Sufficient / Extensive.", answer: "Agreement (Strongly agree to Strongly disagree) is correct." },
  { kind: "gap", state: "resolved", title: "Coworker Dynamic has no scoring scale", qs: span("CD", 1, 1, 12), detail: "All 12 questions are scored, but the scoring sheet has no values for All / Most / About half / Some / None.", answer: "All 100, Most 75, About half 50, Some 25, None 0." },
  { kind: "gap", state: "open", title: "Situational Leadership has no formula", qs: [...span("MS", 1, 1, 4), "MS2.1"], detail: "Manager Style Q1 (how often the manager uses each of four styles) and Q2.1 (your competence) are scored, and Q1.1's Driver is Situational Leadership. The file has no formula; its “SR1.1, 1.3, 1.5 (MS)” scale matches no question.", answer: "There may be discrepancies; how it's scored is to come.", proposal: "Until then the five questions are grouped as Situational Leadership with no score. A likely formula: match the style the person's competence calls for (Low → Directive, Moderate → Coaching, High → Supporting, Very high → Delegating) and score how often the manager uses it." },
  { kind: "conflict", state: "resolved", title: "Manager Style numbering is out of date in the scoring sheets", qs: ["MS2.4", "MS2.5", "MS2.6"], detail: "The scoring sheet's MS2.4 (Very effective … Poor) is now Q2.6. Role clarity (2.4) and Manager cares (2.5) were added later.", answer: "The scoring sheet is out of date here: its 2.4 is the survey's 2.6. Scored: 1, 2.1-2.4 and 2.6; 2.5 shown separately." },
  { kind: "gap", state: "open", title: "Smoking: “Ex Smoker” has no score", qs: ["PHYS3"], detail: "The survey offers Ex Smoker; the scoring sheet doesn't score it.", answer: "Keep it 100 for now; to be clarified." },
  { kind: "wording", state: "open", title: "BMI scores underweight as the best band", qs: ["PHYS6"], detail: "Under 24 scores 100, so a BMI of 16 scores the same as 22.", answer: "A real finding: the team is discussing it. Kept as the file has it for now." },
  { kind: "conflict", state: "resolved", title: "Soft Work Environment 1.7 is in both lists", qs: ["SoftWE1.7"], detail: "Scored range says 1.1-1.7; the non-scored list has 1.7. It's a free-text question.", answer: "Free text is never scored." },
  { kind: "conflict", state: "resolved", title: "The agreement scale's list names questions that don't exist", qs: [], detail: "It lists EE1.1-1.10, JS2.1-2.6 and “PWE1.1-1.6”.", answer: "Out of date. EE1.1-1.9 and JS2.1-2.5 are correct. PWE was an old Explorer (Personal Work Ethic) that has been removed." },
  { kind: "wording", state: "resolved", title: "A reverse-worded statement", qs: ["PSY2.1"], detail: "“I suffer from physical and/or mental health issues as a result of stress”: agreeing is the bad answer.", answer: "Don't reverse it: it isn't scored." },
  { kind: "wording", state: "resolved", title: "Job Satisfaction 1.2 (demands) has no clear direction", qs: ["JS1.2"], detail: "“How would you rate the demands of your job?” 1 to 5: is a high number good or bad?", answer: "Job Satisfaction Q1 is shown as smileys: 5 is the biggest smile, so 5 is good." },
  { kind: "gap", state: "for-now", title: "Work environment questions asked twice for Hybrid people", qs: [...span("PhysWE", 1, 1, 8), ...span("SoftWE", 1, 1, 6)], detail: "“Asked from WFO + WFH perspective separately given the user's status.” How the two answers combine wasn't stated.", answer: "Weight the office and home answers by the contracted office and home hours (Your Profile Q12). A better answer may follow." },
  { kind: "gap", state: "open", title: "Lists not in the file", qs: ["PRO6", "PRO7", "PRO9", "PRO15"], detail: "Country (“all countries with a few exceptions”), ethnicity (depends on country), site codes (set per client) and annual salary (“separate algorithm”) have no options in the file.", answer: "A full country list for now; the annual salary bands depend on the country picked. The exceptions, the ethnicity lists and the salary bands are still to come." },
  { kind: "gap", state: "resolved", title: "Work model isn't asked directly", qs: ["PRO12"], detail: "The survey asks contracted hours at the office and at home, not a work model.", answer: "All office hours = Office, all home hours = Home, both = Hybrid. The product's “Onsite” and “Remote” labels become Office and Home." },
  { kind: "naming", state: "resolved", title: "Driver names that collide", qs: ["EE1.1", "EE1.2", "EE1.8"], detail: "“Coworker Dynamic” is both an Explorer and a Driver inside Employee Engagement. (Flexible / Flexibility and Policies / Policies and Practices are also pairs, but they're different things and stay as they are.)", answer: "Rename the Employee Engagement Driver. It's now “Working relationships”." },
  { kind: "gap", state: "resolved", title: "Scored questions without a Driver", qs: [], detail: "Some scored questions count towards their Explorer but name no Driver.", answer: "Each is its own Driver, named by its short label. (Manager Style 1.2-1.4 and 2.1 have no short label: they're grouped under Situational Leadership, I6.)", noDriver: true },
  { kind: "wording", state: "resolved", title: "Small fixes in the text", qs: ["SoftWE1.6", "MS1.1"], detail: "“consistant” (hover label, Soft Work Environment 1.6). “*manager x*” is a placeholder for the manager's name.", answer: "Fixed: “consistent”, and the placeholder is now a {manager's name} slot. The file's text is kept beside each." },
  { kind: "gap", state: "resolved", title: "eNPS: three wordings on the eNPS sheet", qs: ["CC2.3"], detail: "The eNPS sheet offers a list version and 1-10 or 0-10 versions.", answer: "eNPS comes from Corporate Culture 2.3 only, the standard 0 to 10 question." },
  { kind: "gap", state: "resolved", title: "Psychological Health uses 9 DASS questions", qs: span("PSY", 1, 1, 9), detail: "Three each for stress, depression and anxiety (the full DASS-21 has seven each).", answer: "Intentional. They feed the Mental Well-Being widgets: Depression → Feeling Low, Stress → Feeling Stressed, Anxiety → Feeling Anxious, each in five levels (Normal, Mild, Moderate, Severe, Extremely Severe)." },
  { kind: "gap", state: "open", title: "Mental well-being level cut-offs", qs: span("PSY", 1, 1, 9), detail: "The five levels are confirmed, but not where one ends and the next begins for this 9-question form.", answer: null, proposal: "On each measure's 0 to 100 score: Normal 80+, Mild 60 to 79, Moderate 40 to 59, Severe 20 to 39, Extremely Severe under 20 (the product's current assumption)." },
];

/* Every question that an issue names gets a pointer back to it (the scored-without-a-Driver list is filled from the data). */
ISSUES.find((i) => i.noDriver).qs = all.filter((q) => q.driverSource === C && /short label/.test(q.driverNote || "")).map((q) => q.id);
ISSUES.forEach((iss, i) => { iss.id = `I${i + 1}`; iss.qs.forEach((id) => { const q = all.find((x) => x.id === id); if (q) (q.issues = q.issues || []).push(iss.id); }); });
/* Any question with an option the scale doesn't score, or a status we couldn't place, is reported too. */
const unscoredOptions = all.filter((q) => q.scores && q.scores.some((v) => v === null)).map((q) => q.id);
const unknownStatus = all.filter((q) => q.status === "unknown").map((q) => q.id);

/* ---- drivers -------------------------------------------------------- */
const drivers = {};
for (const q of all) if (q.driver && q.status === "scored") { const d = (drivers[q.driver] = drivers[q.driver] || { name: q.driver, explorers: new Set(), questions: [], source: F }); d.explorers.add(q.section); d.questions.push(q.id); if (q.driverSource) d.source = q.driverSource; if (q.driverInFile) d.nameInFile = q.driverInFile; }
const driverList = Object.values(drivers).map((d) => ({ ...d, explorers: [...d.explorers] }));

/* ---- the eNPS sheet, verbatim -------------------------------------- */
const enps = X.utils.sheet_to_json(wb.Sheets.eNPS, { header: 1, defval: "" }).map((r) => r.map(clean)).filter((r) => r.some(Boolean));

const survey = {
  id: "shape-survey", name: "SHAPE Survey", service: "SHAPE Performance Index",
  source: { file: "data/sources/SHAPE Survey File.xlsx", sheets: wb.SheetNames, importedAt: new Date().toISOString().slice(0, 10) },
  scale: { min: 0, max: 100 },
  levels: [{ depth: 0, noun: "Overall" }, { depth: 1, noun: "Explorer", nounPlural: "Explorers" }, { depth: 2, noun: "Driver", nounPlural: "Drivers" }],
  sections, scales: Object.fromEntries(Object.entries(SCALES).map(([k, v]) => [k, { id: k, ...v, options: v.options.map(([label, score]) => ({ label, score })) }])),
  scoredList: SCORED_FILE, nonScoredList: NONSCORED_FILE, drivers: driverList, derived: DERIVED, enps, issues: ISSUES,
  decisions: { by: "Product owner", on: "2026-10-20" },
  checks: { unscoredOptions, unknownStatus },
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(survey, null, 1));

/* ---- summary ------------------------------------------------------- */
const count = (f) => all.filter(f).length;
console.log(`Sections: ${sections.length} · questions: ${all.length}`);
for (const s of sections) { const qs = s.groups.flatMap((g) => g.questions); console.log(`  ${s.name.padEnd(28)} ${String(qs.length).padStart(3)} questions · scored ${qs.filter((q) => q.status === "scored").length} · separate ${qs.filter((q) => q.status === "separate").length} · unscored ${qs.filter((q) => q.status === "unscored").length}`); }
console.log(`Scored ${count((q) => q.status === "scored")} · separate ${count((q) => q.status === "separate")} · unscored ${count((q) => q.status === "unscored")} · profile ${count((q) => q.status === "profile")}`);
console.log(`Drivers (from scored questions): ${driverList.length}`);
console.log(`Issues: ${["resolved", "for-now", "open"].map((st) => `${st} ${ISSUES.filter((i) => i.state === st).length}`).join(" · ")}`);
console.log(`Renumbered: ${all.filter((q) => q.renumbered).map((q) => `${q.id} (was ${q.renumbered})`).join(", ")}`);
console.log(`Options with no score: ${unscoredOptions.join(", ") || "none"}`);
console.log(`Status unknown: ${unknownStatus.join(", ") || "none"}`);
console.log(`Scored with no scale: ${all.filter((q) => q.status === "scored" && !q.scale).map((q) => q.id).join(", ") || "none"}`);
console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
