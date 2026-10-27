import { ds } from "./ds.js";

/* ================================================================== */
/* FIXED LIBRARY FAMILIES                                              */
/* Library-sourced widgets belong to a fixed family with pre-built     */
/* forms — no AI involved, swappable via "Change widget".              */
/*                                                                     */
/* A family is one kind of widget (Score, Status, Health Age…); a      */
/* *form* is one concrete card of it — a size, and sometimes a persona  */
/* (Personal / Team / Org). The Library screen lists every form as its  */
/* own card, grouped by `group`, straight from the Figma catalogue      */
/* (984qJvMt7fCHASYHRwgrab, node 12635:69176 "Collated Widgets").       */
/*                                                                     */
/* Form fields: size · name (Library card title) · blurb (one line)     */
/*   · persona (defaults to the family's) · title (card header, when it  */
/*   differs from the family name — "Team Score", "Physical Health       */
/*   Score") · sample (true = illustrative numbers, not survey data).    */
/* A Personal/Team form is always `sample`: the dataset has no per-     */
/* person or per-team identity (CLAUDE.md), so those cards show          */
/* placeholder numbers and the Library tags them as such.                */
/*                                                                     */
/* IMPORTANT: forms are only ever APPENDED to a family — report seeds   */
/* (App.jsx) and saved widgets address a form by index.                  */
/*                                                                     */
/* `owned` — powers SearchOverlay.jsx's "OWNED" badge (per Figma node   */
/* 13750:16126's Active Results state), distinguishing a family you     */
/* already have from one still sitting in the Library/store. True for   */
/* exactly the three families App.jsx's `createReport()` always seeds   */
/* onto a new report (your-score/explorers/org-status) — a real,        */
/* non-fabricated signal (every report you generate really does start   */
/* with these three), not an arbitrary curated flag.                    */
/* ================================================================== */

/* Library sections, in display order. `about` is the long copy shown in a
   widget's information window ("About <group>"). */
export const GROUPS = [
  { id: "Score", blurb: "One number for how a score is doing, for anyone and anything: the organisation, a team, a group, a person, an Explorer or a Driver.", about: ["There's one Score widget. The same card shows the organisation's score, a team's, a group's (a department, an age band, a work model), one person's, or the score of a cluster, an Explorer or a Driver. What else it carries depends on who and what it's about: a group of people gets a headcount, a participation rate and how its people split across the statuses; one person gets their status and how their Explorers split.", "The Index is the same score with its parts around it: one layer deeper on a 2x2, two on a 3x3. Use the Score card as the anchor of a report, and the Index when the parts matter."] },
  { id: "Status", blurb: "Where a score stands right now: Flourishing, Striving or Struggling, for the organisation, a team, a group or one person.", about: ["A status is a band, not a number: 80 and above is Flourishing, 60 to 79 is Striving, and below 60 is Struggling.", "The bar underneath shows what sits in each band. For the organisation, a team or a group it's people, so a Striving organisation with a large Struggling tail reads differently from one that is evenly spread. For one person it's their parts: their Explorers on their overall status, or an Explorer's Drivers on that Explorer's status."] },
  { id: "ENPS", blurb: "How likely people are to recommend working here.", about: ["Employee Net Promoter Score asks one question — how likely are you to recommend this organisation as a place to work — and subtracts the share of detractors (0–6) from the share of promoters (9–10).", "A score can run from −100 to 100. Passives (7–8) don't count either way, but they are the easiest group to move."] },
  { id: "Areas to Focus", blurb: "Identify the groups holding performance back and where action is needed first.", about: ["Score by Group puts a score side by side for each group of people (gender, work model, department, job level…). Hover a bar for its score. Two to four groups fit a 1x1; five or more need a 2x2.", "Areas of Focus are the segments of your audience that scored below a defined threshold in one or more of the SHAPE survey areas. These aren't arbitrary flags — they're calculated from response data and weighted by participation, so the list reflects real signal, not noise.", "Each entry shows the segment name, its lowest-scoring area, and the score itself. The list is ordered by urgency: the segments with the most critical scores appear at the top.", "These widgets are most useful when you need a fast read on where your organisation is under pressure — without filtering through a full heat map manually."] },
  { id: "Explorers & Drivers", blurb: "The areas and the individual Drivers behind a score, ranked.", about: ["Explorers are the twelve areas the survey measures. Drivers are the individual things inside them. Both are ranked into Great, Average and Poor so the strongest and weakest read at a glance.", "The Drivers widget lists the Drivers under the page it sits on: every Driver on a report, an Explorer's own Drivers on that Explorer's page, a cluster's Drivers on the cluster's page."] },
  { id: "Composition", blurb: "Who makes up a population, or what a total is made of.", about: ["A composition shows how a whole splits into its groups: people by gender, work model, department and any other way of grouping them, or the time and money people would get back, by part. Hover a part for how many it holds.", "Four groups or fewer can be a grid of tiles over a bar, or a donut; five to seven are a donut; more than seven need a 2x2."] },
  { id: "Responses", blurb: "What people wrote, in their own words.", about: ["Popular Responses groups the open-text answers into themes and sizes each by how many responses mention it. It opens Response Analysis: the questions, a summary, the verbatims and a map of the themes."] },
  { id: "Score over time", blurb: "Track how a score has changed across survey rounds.", about: ["Score History plots the score for every round so far. The pill shows the change since the previous round.", "A single dip isn't a trend — look for two or more rounds in the same direction before acting."] },
  { id: "Score Comparisons", blurb: "Your score next to your team's and the organisation's.", about: ["Comparisons line up your own score, your team's and the organisation's on the same 0–100 scale so you can see whether you are above or below the people around you.", "A comparison unlocks once enough people in each group have answered."] },
  { id: "Health Age", blurb: "Whether health habits are making people biologically older or younger.", about: ["Health Age estimates how old your health habits make you, compared with your actual age. Sleep, exercise, nutrition and smoking all move it.", "It is an estimate for conversation, not a medical measurement."] },
  { id: "Mental Well-being", blurb: "How many people are feeling low, anxious or stressed.", about: ["Mental Well-being groups the Depression, Anxiety and Stress questions into three feelings. Personal views show a severity for each; team and organisation views show the share of people affected.", "It is a screening signal, not a diagnosis. If someone needs support, point them to the Support widgets."] },
  { id: "Time & Money", blurb: "The time and money people would get back if scores reached Flourishing.", about: ["Time Impact is the hours a year each person would get back if everyone below Flourishing reached it: more focused work (productivity) and fewer days lost (absenteeism). Money Impact is the same idea in dollars for the organisation, and adds retention and injury / claims. Time to Gain is one person's own hours, with no breakdown.", "The gaps behind them are measured from people's answers; the rates that turn a point into hours or dollars come from the SHAPE impact model."] },
  { id: "Support", blurb: "Nudges that point people to help when they need it.", about: ["Support widgets appear when a score suggests someone could use help, and link to the relevant service — for example Mindfulness for low Psychological Health.", "They carry no data of their own."] },
];
export const groupById = (id) => GROUPS.find((g) => g.id === id);

/* A few cards sit on their own surface instead of white (a locked
   comparison, the support nudges). */
const CARD_LOCKED = { bg: ds.status.warning.bg, border: ds.status.warning.bg }; // the design's #FBE7BD edge has no token; the card reads by its fill

export const FAMILIES = [
  /* ---- Score ---- */
  { id: "org-score", name: "Org Score", category: "Score", blurb: "The org's overall score, with who answered and how they split.", owned: true, persona: "org", forms: [
    { size: "2x2", label: "With headcount + status split", name: "Org Score", blurb: "The organisation's score, who answered, and how people split across statuses." },
    { size: "1x1", label: "With headcount", name: "Org Score · Headcount", blurb: "The score with headcount and participation rate beneath it." },
  ] },
  { id: "your-score", name: "Your Score", category: "Score", blurb: "Your overall wellbeing score at a glance.", owned: true, persona: "personal", forms: [
    { size: "1x1", label: "Plain", name: "Your Score", blurb: "Your overall wellbeing score at a glance." },
    { size: "2x2", label: "With breakdown", name: "Your Score · Breakdown", blurb: "Your score, the change since last round, and how the Explorers split." },
    { size: "1x1", label: "With status", name: "Your Score · Status", blurb: "Your score with the status it puts you in." },
    { size: "2x2", label: "With status", name: "Your Score · Status Breakdown", blurb: "Your score, your status, and how the Explorers split." },
  ] },
  { id: "team-score", name: "Team Score", category: "Score", blurb: "Your team's overall score and how many of them answered.", owned: false, persona: "team", forms: [
    { size: "1x1", label: "With headcount", name: "Team Score · Headcount", blurb: "Your team's score with team size and participation.", title: "Team Score", sample: true },
    { size: "2x2", label: "With breakdown", name: "Team Score", blurb: "Your team's score, participation and how its members split by status.", title: "Team Score", sample: true },
  ] },
  { id: "explorer-score", name: "Explorer Score", category: "Score", blurb: "One Explorer's score, here Physical Health.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Plain", name: "Explorer Score", blurb: "One Explorer's score at a glance.", title: "Physical Health Score" },
    { size: "1x1", label: "With status", name: "Explorer Score · Status", blurb: "An Explorer's score with its status.", title: "Physical Health Score" },
    { size: "1x1", label: "Team headcount", name: "Explorer Score · Team", blurb: "An Explorer's score with team size and participation.", title: "Physical Health Score", persona: "team", sample: true },
    { size: "1x1", label: "Org headcount", name: "Explorer Score · Org", blurb: "An Explorer's score with headcount and participation.", title: "Physical Health Score", persona: "org" },
    { size: "2x2", label: "With status", name: "Explorer Score · Detail", blurb: "An Explorer's score, status and how it has moved.", title: "Physical Health Score" },
  ] },
  /* One Index (lib/scoreWidget.js): any score that breaks down into parts, the score in the centre and its parts around
     it. 2x2 = one layer deeper, 3x3 = two. The overall score has two layers (Explorers, then Drivers); an Explorer has
     one (its Drivers), so it is 2x2 only. The old "Explorer Index" family is form 2 here. */
  { id: "index", name: "Index", category: "Score", blurb: "Any score with parts: the score at the centre and its parts around it, one or two layers deep.", owned: false, persona: "org", forms: [
    { size: "2x2", label: "One layer", name: "Index", blurb: "The overall score at the centre with all twelve Explorers around it.", title: "Org Index", subject: { who: "org", what: "overall" } },
    { size: "3x3", label: "Two layers", name: "Index · Two layers", blurb: "The same ring, with each Explorer split into its Drivers in an outer ring.", title: "Org Index", subject: { who: "org", what: "overall" } },
    { size: "2x2", label: "An Explorer", name: "Index · Explorer", blurb: "One Explorer's score with each of its Drivers around it. An Explorer has one layer under it, so it is 2x2 only.", title: "Corporate Culture Index", subject: { who: "org", what: "explorer" } },
  ] },

  /* ---- Status ---- */
  /* One Status widget for any subject (widgets/StatusCard.jsx, lib/scoreWidget.js), like the Score. A population's
     breakdown bar is its people; one person's is their parts (Explorers, or an Explorer's Drivers). */
  { id: "org-status", name: "Status", category: "Status", blurb: "Where a score stands, Flourishing, Striving or Struggling, for the organisation, a team, a group or one person.", owned: true, persona: "org", forms: [
    { size: "1x1", label: "Status only", name: "Org Status", blurb: "The status your organisation is in, and how its people split across the bands.", title: "Org Status", subject: { who: "org", what: "overall" } },
    { size: "2x2", label: "Status + breakdown", name: "Org Status · Breakdown", blurb: "The status, and how many people sit in each band.", title: "Org Status", subject: { who: "org", what: "overall" } },
    { size: "1x1", label: "Your status", name: "Your Status", blurb: "The status your own score puts you in, and how your Explorers split across the bands.", title: "Your Status", persona: "personal", subject: { who: "person", what: "overall" } },
    { size: "1x1", label: "Team status", name: "Team Status", blurb: "The status your team is in, and how its members split across the bands.", title: "Team Status", persona: "team", sample: true, subject: { who: "team", what: "overall" } },
    { size: "2x2", label: "Team status + breakdown", name: "Team Status · Breakdown", blurb: "Your team's status, and how many members sit in each band.", title: "Team Status", persona: "team", sample: true, subject: { who: "team", what: "overall" } },
    { size: "2x2", label: "Your status + breakdown", name: "Your Status · Breakdown", blurb: "Your status, and how many of your Explorers sit in each band.", title: "Your Status", persona: "personal", subject: { who: "person", what: "overall" } },
  ] },

  /* ---- ENPS ---- */
  { id: "enps", name: "ENPS", category: "ENPS", blurb: "Employee net promoter score for this round.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Score + bar", name: "ENPS", blurb: "Employee net promoter score with how people split." },
    { size: "2x2", label: "With group counts", name: "ENPS · Groups", blurb: "ENPS with the number of promoters, passives and detractors." },
    { size: "2x2", label: "With summary", name: "ENPS · Summary", blurb: "ENPS, the change since last round, and a plain-language summary." },
  ] },

  /* ---- Areas to Focus ---- */
  { id: "areas-focus", name: "Areas to Focus", category: "Areas to Focus", blurb: "See the demographic group that needs your attention most.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Top concern", name: "Top Focus", blurb: "See the group that needs your attention most." },
    { size: "1x1", label: "List", name: "Focus List", blurb: "A quick view of the groups needing improvement." },
    { size: "2x2", label: "List by category", name: "Focus List by Categories", blurb: "See which groups or segments need attention, by category." },
    { size: "2x2", label: "By group", name: "Focus by Group", blurb: "See which groups within a category need attention most." },
  ] },
  { id: "heat-map", name: "Heat Map", category: "Areas to Focus", blurb: "Reveal organisation-wide patterns and quickly spot challenges.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Departments × Explorers", name: "Heat Map", blurb: "Reveal organisation-wide patterns and quickly spot challenges.", title: "Org Heat Map" },
  ] },

  /* ---- Explorers & Drivers ---- */
  { id: "explorers", name: "Explorers", category: "Explorers & Drivers", blurb: "Identify the areas holding performance back.", owned: true, persona: "org", forms: [
    { size: "2x2", label: "Ranked list", name: "Explorers", blurb: "Every Explorer ranked into Great, Average and Poor." },
    { size: "1x1", label: "Top and bottom", name: "Explorers · Top & Bottom", blurb: "Your strongest and weakest Explorer." },
  ] },
  /* One Drivers widget (it used to be called Factors as well; family id kept for report seeds). It lists the Drivers under
     the page it sits on (lib/driversWidget.js): every Driver on a report, an Explorer's own on that Explorer's page, a
     cluster's on the cluster's page. */
  { id: "factors", name: "Drivers", category: "Explorers & Drivers", blurb: "Rank the Drivers under the page the widget sits on.", owned: false, persona: "org", forms: [
    { size: "2x2", label: "Ranked list", name: "Drivers", blurb: "Every Driver ranked into Great, Average and Poor.", title: "Drivers", page: { level: "report" } },
    { size: "1x1", label: "Top and bottom", name: "Drivers · Top & Bottom", blurb: "The strongest and weakest Driver.", title: "Drivers", page: { level: "report" } },
    { size: "2x2", label: "On an Explorer's page", name: "Drivers · Explorer", blurb: "Physical Health's own Drivers, as on that Explorer's page.", title: "Physical Health Drivers", page: { level: "explorer", name: "Physical Health" } },
    { size: "2x2", label: "On a cluster's page", name: "Drivers · Cluster", blurb: "Only a cluster's Drivers (Rest and Recovery: Sleep, Stress, Exercise, Nutrition).", title: "Rest and Recovery Drivers", page: { level: "cluster", name: "Rest and Recovery", drivers: ["Sleep", "Stress", "Exercise", "Nutrition"] } },
  ] },

  /* Score by Group: a score for each group of people, side by side (Comparison bars). 2 to 4 groups → 1x1; 5 or more → 2x2
     (lib/insightRules.js comparisonSize). Hover a bar for its score. Family ids kept for report seeds; `axis` is the way
     of grouping people. These used to be called Gender / Work Composition, which they aren't: a composition counts people. */
  { id: "avg-gender", name: "Score by Group", category: "Areas to Focus", blurb: "Compare a score across the groups of any way of grouping people.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Gender", name: "Score by Gender", blurb: "The overall score for each gender group.", title: "Score by Gender", axis: "gender" },
    { size: "1x1", label: "Employment status", name: "Score by Employment Status", blurb: "The overall score for each employment status.", title: "Score by Employment Status", axis: "employmentStatus" },
    { size: "2x2", label: "Job level", name: "Score by Job Level", blurb: "The overall score for each job level. Five or more groups need a 2x2.", title: "Score by Job Level", axis: "jobLevel" },
    { size: "2x2", label: "Department", name: "Score by Department", blurb: "The overall score for each department.", title: "Score by Department", axis: "department" },
  ] },
  { id: "avg-work-model", name: "Score by Work Model", category: "Areas to Focus", blurb: "Compare the score for onsite, hybrid and remote people.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Work model", name: "Score by Work Model", blurb: "The overall score for onsite, remote and hybrid people.", title: "Score by Work Model", axis: "workModel" },
  ] },

  /* ---- Composition ---- */
  /* Who makes up a population, or what a total is made of (ChartInsight.jsx CompositionInsight). The form follows the
     number of groups (lib/insightRules.js compositionFit): ≤4 grid or donut 1x1; 5–7 donut 1x1; >7 donut 2x2. */
  { id: "composition", name: "Composition", category: "Composition", blurb: "How a population splits across a way of grouping people, or a total across its parts.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Gender · Grid", name: "Gender Composition", blurb: "How many people are in each gender group, as tiles over a bar.", title: "Gender Composition", comp: { axis: "gender", form: "grid" } },
    { size: "1x1", label: "Gender · Donut", name: "Gender Composition · Donut", blurb: "The same as a ring with a legend.", title: "Gender Composition", comp: { axis: "gender", form: "donut" } },
    { size: "1x1", label: "Work model · Grid", name: "Work Composition", blurb: "How many people work onsite, remote and hybrid.", title: "Work Composition", comp: { axis: "workModel", form: "grid" } },
    { size: "1x1", label: "Work model · Donut", name: "Work Composition · Donut", blurb: "The same as a ring with a legend.", title: "Work Composition", comp: { axis: "workModel", form: "donut" } },
    { size: "1x1", label: "Location (5 groups)", name: "Location Composition", blurb: "Five to seven groups: a ring and the largest group.", title: "Location Composition", comp: { axis: "location", form: "donut" } },
    { size: "1x1", label: "Job level (7 groups)", name: "Job Level Composition", blurb: "Seven groups: a ring and the largest group.", title: "Job Level Composition", comp: { axis: "jobLevel", form: "donut" } },
    { size: "2x2", label: "Department", name: "Departments Composition", blurb: "More than seven groups need a 2x2: the ring and the largest group.", title: "Departments Composition", comp: { axis: "department", form: "donut", legend: false } },
    { size: "2x2", label: "Department · Legend", name: "Departments Composition · Legend", blurb: "The ring, the largest group and every department.", title: "Departments Composition", comp: { axis: "department", form: "donut", legend: true } },
    { size: "1x1", label: "Time · Grid", name: "Time Composition", blurb: "Where the hours to gain come from, per person a year.", title: "Time Composition", comp: { axis: "impactTime", form: "grid" } },
    { size: "1x1", label: "Time · Donut", name: "Time Composition · Donut", blurb: "The same as a ring with a legend.", title: "Time Composition", comp: { axis: "impactTime", form: "donut" } },
    { size: "1x1", label: "Money · Grid", name: "Money Composition", blurb: "Where the money to gain comes from, a year.", title: "Money Composition", comp: { axis: "impactMoney", form: "grid" } },
    { size: "1x1", label: "Money · Donut", name: "Money Composition · Donut", blurb: "The same as a ring with a legend.", title: "Money Composition", comp: { axis: "impactMoney", form: "donut" } },
  ] },

  /* ---- Responses ---- */
  { id: "popular-responses", name: "Popular Responses", category: "Responses", blurb: "The most common open-text themes this round.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Treemap", name: "Popular Responses", blurb: "The three themes people wrote about most.", sample: true },
    { size: "2x2", label: "Treemap", name: "Popular Responses · Detail", blurb: "The seven themes people wrote about most.", sample: true },
  ] },

  /* ---- Score over time ---- */
  { id: "score-history", name: "Score History", category: "Score over time", blurb: "Track how your score has changed over rounds.", owned: false, persona: "org", forms: [
    { size: "2x2", label: "Sparkline", name: "Score History · Detail", blurb: "The score for every round, with what changed in plain words." },
    { size: "1x1", label: "Compact", name: "Score History", blurb: "The score across rounds, small enough to sit anywhere." },
  ] },

  /* ---- Score Comparisons ---- */
  { id: "score-comparisons", name: "Score Comparisons", category: "Score Comparisons", blurb: "Your score next to your team's and the organisation's.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Summary", name: "Score Comparisons", blurb: "Team and organisation scores side by side.", sample: true },
    { size: "2x2", label: "Full", name: "Score Comparisons · Detail", blurb: "Your score, each of your teams and the organisation, with the gap.", sample: true },
    { size: "1x1", label: "Locked", name: "Score Comparisons · Locked", blurb: "Shown until comparisons become available.", sample: true, card: CARD_LOCKED },
    { size: "2x2", label: "Locked", name: "Score Comparisons · Locked Detail", blurb: "Shown until comparisons become available.", sample: true, card: CARD_LOCKED },
  ] },

  /* ---- Health Age ---- */
  { id: "health-age", name: "Health Age", category: "Health Age", blurb: "Whether health habits are making people older or younger.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Your health age", name: "Your Health Age", blurb: "Your health age and the gap to your actual age.", title: "Your Health Age", sample: true },
    { size: "2x2", label: "Your health age", name: "Your Health Age · Detail", blurb: "Your health age on a younger-to-older scale.", title: "Your Health Age", sample: true },
    { size: "1x1", label: "Team health age", name: "Team Health Age", blurb: "Your team's average health age.", title: "Team Health Age", persona: "team", sample: true },
    { size: "2x2", label: "Team health age", name: "Team Health Age · Detail", blurb: "Your team's health age on a younger-to-older scale.", title: "Team Health Age", persona: "team", sample: true },
    { size: "1x1", label: "Org health age", name: "Org Health Age", blurb: "The organisation's average health age.", title: "Org Health Age", persona: "org", sample: true },
    { size: "2x2", label: "Org health age", name: "Org Health Age · Detail", blurb: "The organisation's health age on a younger-to-older scale.", title: "Org Health Age", persona: "org", sample: true },
  ] },

  /* ---- Mental Well-being ---- */
  { id: "mental-wellbeing", name: "Mental Well-being", category: "Mental Well-being", blurb: "How many people are feeling low, anxious or stressed.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Your severity", name: "Mental Well-being", blurb: "How severe each feeling is for you.", title: "Mental Well-being", sample: true },
    { size: "2x2", label: "Your severity + support", name: "Mental Well-being · Detail", blurb: "How severe each feeling is, with a way to get support.", title: "Mental Well-being", sample: true },
    { size: "1x1", label: "Team distribution", name: "Team Mental Well-being", blurb: "The share of your team feeling low, anxious or stressed.", title: "Team Mental Well-being", persona: "team", sample: true },
    { size: "2x2", label: "Team distribution", name: "Team Mental Well-being · Detail", blurb: "The same, with the change since last round.", title: "Team Mental Well-being", persona: "team", sample: true },
    { size: "1x1", label: "Org distribution", name: "Org Mental Well-being", blurb: "The share of the organisation feeling low, anxious or stressed.", title: "Org Mental Well-being", persona: "org" },
    { size: "2x2", label: "Org distribution", name: "Org Mental Well-being · Detail", blurb: "The same, with the change since last round.", title: "Org Mental Well-being", persona: "org" },
  ] },

  /* ---- Time & Money ---- */
  { id: "time-impact", name: "Time Impact", category: "Time & Money", blurb: "Hours a year each person would get back if scores reached Flourishing.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Hours/annum", name: "Time Impact", blurb: "Hours a year each person would get back if everyone reached Flourishing.", sample: true },
    { size: "1x1", label: "Team hours/annum", name: "Team Time Impact", blurb: "Hours a year each team member would get back if the team reached Flourishing.", title: "Time Impact", persona: "team", sample: true },
  ] },
  { id: "time-gain", name: "Time to Gain", category: "Time & Money", blurb: "Time you could win back each year by improving.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Hours/annum", name: "Time to Gain", blurb: "The hours a year you would get back by reaching Flourishing.", sample: true },
  ] },
  { id: "money-composition", name: "Money Impact", category: "Time & Money", blurb: "The money the organisation would get back a year if scores reached Flourishing.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Four-way split", name: "Money Impact", blurb: "What the organisation would get back a year: productivity, absenteeism, retention and claims.", title: "Money Impact", sample: true },
  ] },

  /* ---- Support ---- */
  { id: "support-nudge", name: "Support", category: "Support", blurb: "A nudge that points people to help when they need it.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Mindfulness", name: "Mindfulness", blurb: "Offers support to someone who is struggling or just wants to be heard.", title: "Mindfulness", sample: true, card: { bg: ds.bg.quaternary, border: ds.bg.quaternary } },
    { size: "1x1", label: "Psychological health", name: "Mindfulness · Low score", blurb: "Offers support when Psychological Health scores are low.", title: "Mindfulness", sample: true, card: { bg: "#fde8ea", border: "#fde8ea" } },
  ] },
];

export function familyById(id) {
  return FAMILIES.find((f) => f.id === id);
}

/* Card background/border for a form — white by default. */
export function cardSurface(familyId, formIndex = 0) {
  const c = familyById(familyId)?.forms[formIndex]?.card;
  return { background: c?.bg, borderColor: c?.border };
}

export const PERSONA_LABEL = { org: "Org", personal: "Personal", team: "Team" };

/* The persona of one form (its own, else its family's). */
export function formPersona(family, formIndex) {
  const f = family.forms[formIndex];
  return f.persona || family.persona || "org";
}

/* A form is illustrative when it says so, or when it's a Personal/Team card
   (no per-person / per-team data exists to back it). */
export function formIsSample(family, formIndex) {
  const f = family.forms[formIndex];
  return !!f.sample || formPersona(family, formIndex) !== "org";
}

/* The header text of a card: the form's own title, else the family name. */
export function formTitle(familyId, formIndex = 0) {
  const family = familyById(familyId);
  return family.forms[formIndex]?.title || family.name;
}

/* "Change widget" steps to the next form of the same persona, so cycling a
   Team card never turns it into an Org one. */
export function nextFormIndex(familyId, formIndex) {
  const family = familyById(familyId);
  const p = formPersona(family, formIndex);
  const n = family.forms.length;
  for (let k = 1; k <= n; k++) {
    const i = (formIndex + k) % n;
    if (formPersona(family, i) === p) return i;
  }
  return formIndex;
}

/* Every form of every family as one flat list — what the Library shows. */
export function catalogEntries() {
  return FAMILIES.flatMap((family) =>
    family.forms.map((form, formIndex) => ({
      key: `${family.id}:${formIndex}`,
      familyId: family.id,
      formIndex,
      group: family.category,
      name: form.name || form.label || family.name,
      title: form.title || family.name,
      size: form.size,
      persona: formPersona(family, formIndex),
      blurb: form.blurb || family.blurb,
      sample: formIsSample(family, formIndex),
      owned: family.owned,
    }))
  );
}
