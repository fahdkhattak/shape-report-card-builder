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
  { id: "Score", blurb: "A single number for how people are doing overall, for you, a team or the whole organisation.", about: ["Score widgets show the headline number — the average of the SHAPE survey areas on a 0–100 scale — together with how it has moved since the last round and how many people answered.", "Use them as the anchor of a report. Everything else on the page explains why this number is what it is."] },
  { id: "Status", blurb: "Where people stand right now: Flourishing, Striving or Struggling.", about: ["A status is a band, not a number: 80 and above is Flourishing, 60 to 79 is Striving, and below 60 is Struggling.", "The bar underneath shows how everyone splits across the three bands, so a Striving organisation with a large Struggling tail reads differently from one that is evenly spread."] },
  { id: "ENPS", blurb: "How likely people are to recommend working here.", about: ["Employee Net Promoter Score asks one question — how likely are you to recommend this organisation as a place to work — and subtracts the share of detractors (0–6) from the share of promoters (9–10).", "A score can run from −100 to 100. Passives (7–8) don't count either way, but they are the easiest group to move."] },
  { id: "Areas to Focus", blurb: "Identify the areas holding performance back and where action is needed first.", about: ["Areas of Focus are the segments of your audience that scored below a defined threshold in one or more of the SHAPE survey areas. These aren't arbitrary flags — they're calculated from response data and weighted by participation, so the list reflects real signal, not noise.", "Each entry shows the segment name, its lowest-scoring area, and the score itself. The list is ordered by urgency: the segments with the most critical scores appear at the top.", "These widgets are most useful when you need a fast read on where your organisation is under pressure — without filtering through a full heat map manually."] },
  { id: "Explorers & Factors", blurb: "The areas and the individual drivers behind a score, ranked.", about: ["Explorers are the twelve areas the survey measures. Factors are the individual drivers inside them. Both are ranked into Great, Average and Poor so the strongest and weakest read at a glance.", "Start with Explorers to see which area to look at, then Factors to see what inside it is responsible."] },
  { id: "Explorer Results", blurb: "How scores differ between groups of people, and what they say in their own words.", about: ["These widgets split the same score by something about the person — gender, work model — or surface what people most often wrote about.", "Groups with fewer than five people are never shown, so nobody can be picked out of an average."] },
  { id: "Score over time", blurb: "Track how a score has changed across survey rounds.", about: ["Score History plots the score for every round so far. The pill shows the change since the previous round.", "A single dip isn't a trend — look for two or more rounds in the same direction before acting."] },
  { id: "Score Comparisons", blurb: "Your score next to your team's and the organisation's.", about: ["Comparisons line up your own score, your team's and the organisation's on the same 0–100 scale so you can see whether you are above or below the people around you.", "A comparison unlocks once enough people in each group have answered."] },
  { id: "Health Age", blurb: "Whether health habits are making people biologically older or younger.", about: ["Health Age estimates how old your health habits make you, compared with your actual age. Sleep, exercise, nutrition and smoking all move it.", "It is an estimate for conversation, not a medical measurement."] },
  { id: "Mental Well-being", blurb: "How many people are feeling low, anxious or stressed.", about: ["Mental Well-being groups the Depression, Anxiety and Stress questions into three feelings. Personal views show a severity for each; team and organisation views show the share of people affected.", "It is a screening signal, not a diagnosis. If someone needs support, point them to the Support widgets."] },
  { id: "Time & Money", blurb: "What wellbeing is worth in hours and in dollars.", about: ["Time widgets turn a score into hours gained or lost per year. Money Composition shows where the cost of poor wellbeing lands — productivity, absenteeism, retention and claims.", "These are estimates from the model behind the survey, not accounting figures."] },
  { id: "Support", blurb: "Nudges that point people to help when they need it.", about: ["Support widgets appear when a score suggests someone could use help, and link to the relevant service — for example Mindfulness for low Psychological Health.", "They carry no data of their own."] },
];
export const groupById = (id) => GROUPS.find((g) => g.id === id);

/* A few cards sit on their own surface instead of white (a locked
   comparison, the support nudges). */
const CARD_LOCKED = { bg: "#fff6e4", border: "#fbe7bd" };

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
  { id: "explorer-score", name: "Explorer Score", category: "Score", blurb: "One Explorer's score — here, Physical Health.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Plain", name: "Explorer Score", blurb: "One Explorer's score at a glance.", title: "Physical Health Score" },
    { size: "1x1", label: "With status", name: "Explorer Score · Status", blurb: "An Explorer's score with its status.", title: "Physical Health Score" },
    { size: "1x1", label: "Team headcount", name: "Explorer Score · Team", blurb: "An Explorer's score with team size and participation.", title: "Physical Health Score", persona: "team", sample: true },
    { size: "1x1", label: "Org headcount", name: "Explorer Score · Org", blurb: "An Explorer's score with headcount and participation.", title: "Physical Health Score", persona: "org" },
    { size: "2x2", label: "With status", name: "Explorer Score · Detail", blurb: "An Explorer's score, status and how it has moved.", title: "Physical Health Score" },
  ] },
  { id: "index", name: "Wellbeing Index", category: "Score", blurb: "Your overall score, broken down by Explorer and driver.", owned: false, persona: "org", forms: [
    { size: "2x2", label: "Explorer ring", name: "Wellbeing Index", blurb: "The overall score at the centre with all twelve Explorers around it." },
    { size: "3x3", label: "Explorer + driver ring", name: "Wellbeing Index · Drivers", blurb: "The same ring, with each Explorer split into its drivers and the weakest and strongest named outside." },
  ] },
  { id: "dimension-index", name: "Explorer Index", category: "Score", blurb: "One Explorer's score at the centre, with every driver inside it around the ring.", owned: false, persona: "org", forms: [
    { size: "2x2", label: "Driver ring", name: "Explorer Index", blurb: "One Explorer's score with each of its drivers around the ring.", title: "Corporate Culture Index" },
    { size: "3x3", label: "Driver + round ring", name: "Explorer Index · Rounds", blurb: "The same ring, with each driver's score in every round around the outside.", title: "Corporate Culture Index" },
  ] },

  /* ---- Status ---- */
  { id: "org-status", name: "Org Status", category: "Status", blurb: "See where your organisation stands right now.", owned: true, persona: "org", forms: [
    { size: "1x1", label: "Status only", name: "Org Status", blurb: "The status your organisation is in right now." },
    { size: "2x2", label: "Status + breakdown", name: "Org Status · Breakdown", blurb: "The status, and how many people sit in each band." },
    { size: "1x1", label: "Your status", name: "Your Status", blurb: "The status your own score puts you in.", title: "Your Status", persona: "personal" },
    { size: "1x1", label: "Team status", name: "Team Status", blurb: "The status your team is in.", title: "Team Status", persona: "team", sample: true },
    { size: "2x2", label: "Team status + breakdown", name: "Team Status · Breakdown", blurb: "Your team's status, and how its members split.", title: "Team Status", persona: "team", sample: true },
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

  /* ---- Explorers & Factors ---- */
  { id: "explorers", name: "Explorers", category: "Explorers & Factors", blurb: "Identify the areas holding performance back.", owned: true, persona: "org", forms: [
    { size: "2x2", label: "Ranked list", name: "Explorers", blurb: "Every Explorer ranked into Great, Average and Poor." },
    { size: "1x1", label: "Top and bottom", name: "Explorers · Top & Bottom", blurb: "Your strongest and weakest Explorer." },
  ] },
  { id: "factors", name: "Factors", category: "Explorers & Factors", blurb: "Rank the individual drivers behind your scores.", owned: false, persona: "org", forms: [
    { size: "2x2", label: "Ranked list", name: "Factors", blurb: "Every driver ranked into Great, Average and Poor." },
    { size: "1x1", label: "Top and bottom", name: "Factors · Top & Bottom", blurb: "Your strongest and weakest driver." },
  ] },

  /* ---- Explorer Results ---- */
  { id: "avg-gender", name: "Gender Composition", category: "Explorer Results", blurb: "Compare average scores across gender groups.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Bar chart", name: "Gender Composition", blurb: "Average score for each gender group." },
  ] },
  { id: "avg-work-model", name: "Work Composition", category: "Explorer Results", blurb: "Compare average scores by onsite/hybrid/remote.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Bar chart", name: "Work Composition", blurb: "Average score for onsite, remote and hybrid people." },
  ] },
  { id: "popular-responses", name: "Popular Responses", category: "Explorer Results", blurb: "The most common open-text themes this round.", owned: false, persona: "org", forms: [
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
  { id: "time-impact", name: "Time Impact", category: "Time & Money", blurb: "Estimated hours gained or lost per year.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Hours/annum", name: "Time Impact", blurb: "Hours gained or lost per year, estimated from work-life balance." },
    { size: "1x1", label: "Team hours/annum", name: "Team Time Impact", blurb: "Hours gained or lost per year for your team.", title: "Time Impact", persona: "team", sample: true },
  ] },
  { id: "time-gain", name: "Time to Gain", category: "Time & Money", blurb: "Time you could win back each year by improving.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Weeks/annum", name: "Time to Gain", blurb: "How much time improving your habits could give back each year.", sample: true },
  ] },
  { id: "money-composition", name: "Money Composition", category: "Time & Money", blurb: "Where the money goes: productivity, absenteeism, retention, claims.", owned: false, persona: "org", forms: [
    { size: "1x1", label: "Four-way split", name: "Money Composition", blurb: "Where the cost of poor wellbeing lands.", sample: true },
  ] },

  /* ---- Support ---- */
  { id: "support-nudge", name: "Support", category: "Support", blurb: "A nudge that points people to help when they need it.", owned: false, persona: "personal", forms: [
    { size: "1x1", label: "Mindfulness", name: "Mindfulness", blurb: "Offers support to someone who is struggling or just wants to be heard.", title: "Mindfulness", sample: true, card: { bg: "#cecdcc", border: "#cecdcc" } },
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
