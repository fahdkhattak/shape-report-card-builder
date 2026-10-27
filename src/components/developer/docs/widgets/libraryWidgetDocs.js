import { DRIVER_PAGES } from "../../../../lib/driversWidget.js";
/* ================================================================== */
/* LIBRARY WIDGET PAGES: the write-up for every Library family that has  */
/* no page of its own file (Score, Status, Index, Score History and     */
/* Explorers do).                                                       */
/* One config per family, read by makeWidgetDoc (widgetDoc.jsx): purpose, */
/* what each form shows, the widget's own spec, behaviour, the Scope it    */
/* opens, states, copy rules and a done checklist. The forms, their        */
/* templates and the anatomy come from the live cards. The data contract  */
/* for each page is in dataContract.js                                    */
/* (WIDGET_CONTRACTS, keyed by the page id `widget-<familyId>`).          */
/* ================================================================== */
const WB = (id) => `components/widgets/WidgetBody.jsx (case "${id}")`;

/* Stories as [name, Developer page id]. */
const S = {
  summary: ["Insight Summary", "insight-summary"], meaning: ["Score Meaning", "score-meaning"], statusMeaning: ["Status Meaning", "score-meaning"],
  breakdown: ["Breakdown", "breakdown"], zones: ["Breakdown (Zones)", "breakdown"], split: ["Breakdown (Who Is in Each Status)", "breakdown"], spread: ["How Scores Are Spread", "breakdown"],
  diag: ["What Stands Out", "diagnostic"], changes: ["What Changed", "diagnostic"], priority: ["Priority Map", "diagnostic"], reach: ["Within Reach", "diagnostic"],
  focus: ["Areas to Focus On", "diagnostic"], bright: ["Bright Spots", "diagnostic"], gaps: ["Where Gaps Are Widest", "diagnostic"],
  composition: ["Composition", "composition"], trendRows: ["Score Over Time (by part)", "trend"], trend: ["Score Over Time", "trend"], statusTime: ["Status Over Time", "trend"], enpsTime: ["eNPS Over Time", "trend"],
  actions: ["Actions You Can Take", "actions"], method: ["Methodology", "methodology"],
};

/* Score by Group: one page for both families (avg-gender is any grouping, avg-work-model the work-model preset). */
const SCORE_BY_GROUP = {
  id: "widget-score-by-group", name: "Score by Group", familyIds: ["avg-gender", "avg-work-model"],
  source: `${WB("avg-gender")} · widgets/ChartInsight.jsx (HBars) · lib/scopeData.js (groupRows) · lib/insightRules.js (comparisonSize)`,
  purpose: {
    does: "answers “does the score differ between groups?”: the overall score for each group of one way of grouping people (gender, work model, employment status, job level, department…), as bars on one 0 to 100 scale.",
    boundary: "a score per group, never a count of people (that's Composition). One way of grouping at a time. Groups under 5 people are left out. Colours are the group's Graph colour (the same as in its Composition), never status.",
    where: "the Library's Areas to Focus group; the Org report (Score by Gender, Score by Work Model); the SHAPE Org report.",
  },
  forms: ["Gender: two to four groups, a 1x1.", "Employment status: a 1x1.", "Job level: seven groups, so a 2x2.", "Department: a 2x2, value labels on."],
  spec: [
    ["Size", "Rule", "2 to 4 groups → bars in a 1x1; 5 or more → not allowed in a 1x1, a 2x2."],
    ["Bars", "HBars", "Category column 50 to 100px, 8px bars 12px apart, fixed 0 to 100 axis, highest first. No value labels in a 1x1 (hover for the number); value labels in a 2x2."],
  ],
  behaviour: [["Hover a bar", "Tooltip with the group and its score; the others dim."], ["Change Widget", "Cycles the groupings."]],
  opens: { what: "the Score by Group Scope for that grouping: which group scores highest and lowest, who is in each group, and each group's score round by round.", stories: [S.summary, S.composition, S.trendRows] },
  states: [["Group under 5", "Left out."], ["One group left", "Not offered: a comparison needs two."], ["5 or more groups", "A 2x2."]],
  content: [["Title", "“Score by {grouping}”."], ["Work model", "Office, Hybrid and Home (from the hours people work in each place)."]],
  a11y: ["The numbers must be reachable without a pointer (the Scope's Table View has them)."],
  done: ["One fixed 0 to 100 scale; never zoomed.", "Size follows the count: 2 to 4 in a 1x1, 5 or more in a 2x2.", "Category colours, never status colours."],
};

const NOT_A_FILTER = "Library widgets describe the whole population of their report. Never add a filter or scope control to the card.";

export const LIBRARY_DOCS = {
  /* ---- ENPS ------------------------------------------------------------ */
  enps: {
    source: `${WB("enps")} · lib/dataset.js (enpsGroups)`,
    purpose: {
      does: "answers “would people recommend working here?”: the Employee Net Promoter Score, the change since the round before, and how people split into Promoters, Passives and Detractors.",
      boundary: "one question, one round. It doesn't say why people answered as they did. eNPS is not a status: its number is never band-coloured.",
      where: "the Org report and the Library's ENPS group; the SHAPE Org report has its own (from CC2.3).",
    },
    forms: [
      "The score and a caret in the Insight, the split bar in the 24px Evidence Bar.",
      "The score large in the Insight; the bar and the three group counts in the Evidence Section.",
      "The score with the full change pill; the bar and one sentence naming each group's count.",
    ],
    spec: [
      ["Score", "Number", "48 (1x1) or 64 (2x2) Bold, text/primary, negative tracking. A minus sign for a negative score; never coloured by band."],
      ["Change", "Pill", "Caret only on the 1x1, the full pill on the Summary form."],
      ["Bar", "Split", "Promoters status/success, Passives status/warning, Detractors status/error, to scale."],
      ["Counts", "Groups form", "GroupCounts: label 11 / Regular, value 16 / Bold in the group's text-indicator colour."],
      ["Sentence", "Summary form", "11px, text/tertiary, the counts bold in their colours."],
    ],
    behaviour: [["Change Widget", "Cycles 1x1 → Groups → Summary."]],
    opens: { what: "the eNPS Scope: what the number means, the 0 to 10 answers grouped, the groups round by round on their own −100 to 100 axis, and how eNPS is worked out.", stories: [S.meaning, S.split, S.enpsTime, S.method] },
    states: [
      ["Negative eNPS", "A minus sign."],
      ["No earlier round", "No change pill."],
      ["No answers to the question", "Not shown."],
    ],
    content: [["Group names", "Promoters (9 to 10), Passives (7 to 8), Detractors (0 to 6). Capitalised."], ["Name", "“eNPS” in sentences, “ENPS” as the widget title (the Library's own label)."]],
    a11y: ["The bar's split must be in text (the Groups and Summary forms carry it; the 1x1 needs an accessible description)."],
    done: ["Score = % Promoters − % Detractors, rounded.", "The number is never band-coloured.", "Counts add up to the people who answered."],
  },

  /* ---- Areas to Focus -------------------------------------------------- */
  "areas-focus": {
    source: `${WB("areas-focus")} · lib/dataset.js (focusGroups, worstDemographicGroup) · widgets/ChartInsight.jsx (HBars)`,
    purpose: {
      does: "answers “which group of people needs attention first?”: the lowest-scoring groups (departments, tenure bands, work models…) with their score and change.",
      boundary: "groups of people, never Explorers or Drivers (the Explorers and Drivers widgets rank those). Groups under 5 people are never shown.",
      where: "the Org report, the Library's Areas to Focus group; the SHAPE Org report's Areas to Focus is the 2x2 list.",
    },
    forms: [
      "The single lowest group: its score (band-coloured) and change in the Insight, its name in the Evidence Bar.",
      "The two lowest groups below Flourishing, with “N more Areas” in the Evidence Bar.",
      "The lowest group in up to three categories (People, Organisation, Employment, Locations): name, tag, change, score and how many are struggling; “N more Areas” at the foot.",
      "Every department as a horizontal bar on one 0 to 100 scale (Chart rules: 2x2 up to 13 bars).",
    ],
    spec: [
      ["Focus row", "Text", "Group name 11 / Medium; axis tag 11 / Regular on bg/primary; change pill 20px; score 16 / Bold in the band's strong text colour; caption 11 / Regular under a 2px status rule."],
      ["Category label", "List by category", "13 / Regular, text/accent."],
      ["Bars", "By group", "HBars: 8px bars 12px apart, category column 50 to 100px, fixed 0 to 100 scale, value labels in the bar's colour."],
      ["More", "Line", "“N more Areas”, pinned to the foot of the widget."],
    ],
    behaviour: [["Change Widget", "Cycles the four forms."], ["Hover a bar (By group)", "Tooltip: the group, its score; other bars dim."]],
    opens: { what: "the Areas to Focus Scope: where scores are lowest, the lowest group per way of grouping, the highest (bright spots), the widest gaps, and who is in each group.", stories: [S.summary, S.focus, S.bright, S.gaps, S.composition] },
    states: [
      ["Group under 5 people", "Never shown, never counted in “N more”."],
      ["Nothing below Flourishing", "The List forms show no rows; the Top concern still shows the lowest group."],
      ["More departments than bars", "The lowest that fit, and “N more”."],
    ],
    content: [["Captions", "“3/14 (21%) employees are struggling”, as the design writes it."], ["Names", "Groups as the data names them; the axis as a tag (Department, Tenure…)."]],
    a11y: ["Rows read as “IT, Department, 48, down 2”. Colour is never the only cue: the score is printed."],
    done: ["No group under 5 people appears anywhere on the card.", "Rows are lowest first.", NOT_A_FILTER],
  },
  "heat-map": {
    source: `${WB("heat-map")} · widgets/widgetParts.jsx (HeatTable) · lib/dataset.js (heatMap) · scope/full/HeatMapScope.jsx`,
    purpose: {
      does: "answers “where do groups and Explorers meet low?”: four groups down the side, each group's overall score, then its Explorers as heat tiles.",
      boundary: "a window onto the full map: the tiles run on past the card's edge, and the whole grid (every group, every Explorer, filters) is in its full-view Scope.",
      where: "the Org report (last widget in every column layout) and the Library's Areas to Focus group.",
    },
    forms: ["Template Insight + Evidence Bar: four groups as 18px rows (name, overall score, heat tiles cut off at the card's edge), “More” in the Evidence Bar."],
    spec: [
      ["Table", "Rows", "18px each, four of them, filling the 72px Insight. A 1px border/secondary line above the first row and under every row; between columns too; no outer left or right edge."],
      ["", "Columns", "Name 43px; score 34px; heat tiles 34px each, as many as the card shows, the last one cut off by the card's edge."],
      ["Name", "Text", "11 / Regular, text/tertiary, one line, truncated with an ellipsis (full name on hover)."],
      ["Score", "Text", "11 / Bold in the band's text-indicator colour, centred."],
      ["Tile", "Fill", "Heat colours from utility/Heat Map (ten steps); the value 11 / Regular, text/primary from 40 up, text/inverse below."],
      ["More", "Evidence Bar", "A 2px border/strong rail and “More”, 11 / Regular, text/tertiary."],
    ],
    behaviour: [["Click", "Opens the Heat Map full-view Scope, already expanded."]],
    opens: { what: "the Heat Map full-view Scope: every group (by any way of grouping) against the overall score and all 12 Explorers, with search, filters, opened Explorers and a group's own Scope." },
    states: [["Group under 5 people", "Left out."], ["Heat colours", "A separate scale from the status bands; it's never Red / Amber / Green."]],
    a11y: ["Every tile prints its number; colour is a second cue. A truncated name keeps its full name in the title."],
    done: ["Four rows exactly fill the Insight; “More” sits in the Evidence Bar.", "The tiles are cut by the card's edge, never squeezed.", "Uses the same heat colours as the full-view Scope."],
  },

  /* ---- Explorers & Drivers --------------------------------------------- */
  factors: {
    name: "Drivers", id: "widget-factors",
    source: `${WB("factors")} · lib/driversWidget.js (DRIVER_PAGES, driversOnPage) · widgets/primitives.jsx (DriverGroupedList)`,
    purpose: {
      does: "answers “which Drivers are strongest and weakest here?”: the Drivers under the page the widget sits on, ranked into Great, Average and Poor, as many as fit the card.",
      boundary: "Drivers only (Explorers are the Explorers widget). What it lists comes from the page, never from a setting on the card: every Driver on a report (Org, Team, Personal), an Explorer's own Drivers on that Explorer's page, only a cluster's Drivers on the cluster's page, and, if a level is added above the Explorers, that level's Drivers on its page.",
      where: "the first level of every report, an Explorer's page, a cluster's page; the Library's Explorers & Drivers group; the SHAPE reports (Your Drivers, Drivers).",
    },
    forms: ["A report: up to two Drivers per tier (Great, Average, Poor) with their score and change, then “N more Drivers”.", "A report, 1x1: the strongest and the weakest Driver, with “N more Drivers”.", "An Explorer's page (Physical Health): only that Explorer's Drivers.", "A cluster's page (Rest and Recovery): only its four Drivers."],
    spec: [
      ["Tier label", "Text", "Great / Average / Poor (Top / Bottom on the 1x1), 11 / Medium in the band's base colour."],
      ["Row", "Text", "Driver name 11 / Regular, change (caret + number), score 11 / Bold in the band's strong text colour."],
      ["More", "Line", "“N more Drivers” at the foot."],
      ["Title", "Header", "“Drivers” on a report; “{Explorer} Drivers” or “{Cluster} Drivers” on their pages."],
    ],
    behaviour: [["Change Widget", "Cycles the forms."], ...DRIVER_PAGES.map((p) => [`On ${p.name.charAt(0).toLowerCase()}${p.name.slice(1)}`, `${p.lists}.`])],
    opens: { what: "the Drivers Scope for the same page: those Drivers ranked, the strongest and weakest (with Actions), the ones close to the next status line, the weakest three over time and the Actions bar.", stories: [S.summary, S.breakdown, S.diag, S.reach, S.trendRows, S.actions, S.method] },
    states: [["Tier empty", "Its label is left out."], ["Driver with no score", "Left out; not counted in “N more”."], ["Fewer Drivers than the card holds", "All of them, no “N more”."]],
    content: [["Name", "Drivers, never Factors."], ["Tiers", "Great, Average and Poor are the bands renamed for this widget."]],
    done: ["The list is exactly the Drivers under the page the widget is on.", "Every Poor Driver that fits is shown before Average or Great rows are added.", "Tier colour, row colour and number always agree."],
  },

  /* ---- Score by Group (Areas to Focus) ---------------------------------- */
  "avg-gender": SCORE_BY_GROUP,
  "avg-work-model": SCORE_BY_GROUP,
  "popular-responses": {
    source: `${WB("popular-responses")} · widgets/ChartInsight.jsx (Treemap) · lib/responseSample.js`,
    purpose: {
      does: "answers “what are people writing about?”: the themes of the open-text answers, sized by how many responses mention them.",
      boundary: "themes, not sentiment, not quotes. The themes come from the open-text answers.",
      where: "the Org report and the Library's Responses group.",
    },
    forms: ["The three largest themes as a treemap (1x1 is always exactly three).", "Up to seven themes as a treemap."],
    spec: [["Treemap", "Tiles", "Value-proportional, largest first, split into two runs of near-equal total along the longer side, 4px gaps; name upper-case one line top-left, value bold bottom-left; labels drop when a tile is too small."]],
    behaviour: [["Hover a tile", "Tooltip: theme, count and share."], ["Click", "Opens the Response Analysis full-view Scope."]],
    opens: { what: "the Response Analysis full-view Scope: questions on the left; Executive Summary, Verbatims and a Response Map of the same themes (a tile opens its verbatims)." },
    states: [["Fewer than three themes", "The 1x1 isn't offered."]],
    done: ["The 1x1 shows the three largest of the same themes as the 2x2, so they agree.", "The themes match the Response Map in the Scope."],
  },

  /* ---- Score Comparisons ----------------------------------------------- */
  "score-comparisons": {
    source: `${WB("score-comparisons")} · widgets/widgetParts.jsx (CompareRow, LockedBody)`,
    purpose: {
      does: "answers “how do I compare with the people around me?”: your score next to your team's and the organisation's, on one scale.",
      boundary: "Personal only. It compares, it doesn't explain: the Scope says where the gaps are.",
      where: "the Library's Score Comparisons group (Personal reports).",
    },
    forms: [
      "Team and Org scores as two rows, “1 more Comparison” in the Evidence Bar.",
      "Your score (with change), each of your teams (with its mailing list as a chip) and the Org score.",
      "Locked: shown until enough people in each group have answered, with the date it unlocks.",
      "Locked, 2x2.",
    ],
    spec: [
      ["Row", "Text", "Label 11 / Medium; score 16 / Bold (2x2: 20) in the band's text colour; an icon per kind (you, team, org) on the 2x2."],
      ["Locked", "Card", "status/warning/bg card surface; the unlock date in status/warning/text-strong."],
    ],
    behaviour: [["Change Widget", "Cycles the four forms."]],
    opens: { what: "the Score Comparisons Scope: you, your teams and the organisation side by side, part by part.", stories: [["Comparison", "comparison"]] },
    states: [["A team under 5", "Locked."], ["One team", "One Team row."]],
    done: ["Every row uses the same 0 to 100 scale.", "A team under 5 people stays locked."],
  },

  /* ---- Health Age ------------------------------------------------------ */
  "health-age": {
    source: `${WB("health-age")} · widgets/widgetParts.jsx (AgeNumber, AgeScale)`,
    purpose: {
      does: "answers “are my habits making me older or younger?”: a health age next to the gap from actual age.",
      boundary: "an estimate for conversation, not a medical measurement. It needs each person's age.",
      where: "the Library's Health Age group (Personal, Team, Org).",
    },
    forms: [
      "Your health age and caret in the Insight; the gap (“2 yrs 3 mo younger”) as a chip in the Evidence Bar.",
      "Your health age, the change pill, one sentence, and the younger-to-older scale in the Evidence Section.",
      "Team health age, 1x1.", "Team health age, 2x2.", "Org health age, 1x1 (the “older” state).", "Org health age, 2x2.",
    ],
    spec: [
      ["Age", "Number", "Years 48 / Bold (2x2: 36, Dense), months smaller; green when younger, red when older."],
      ["Gap chip", "1x1", "Pill on status/success/bg or status/error/bg, 11 / Bold."],
      ["Scale", "2x2", "AgeScale: Younger ← → Older with the actual-age centre line and the marker."],
    ],
    behaviour: [["Change Widget", "Cycles the forms of the same persona."]],
    opens: { what: "the Health Age Scope: what's shaping the health age and how it compares.", stories: [["Health Age Drivers", "breakdown"], ["Health Age Comparison", "comparison"]] },
    states: [["Younger", "Green, “younger”."], ["Older", "Red, “older”."], ["Same age", "Neutral colour: “the same as your age”."]],
    content: [["Units", "“yrs” and “mo”, as the design writes them; “2 yrs 3 mo younger”."]],
    done: ["Colour follows younger / older, never the status bands."],
  },

  /* ---- Mental Well-being ----------------------------------------------- */
  "mental-wellbeing": {
    source: `${WB("mental-wellbeing")} · widgets/widgetParts.jsx (SeverityRow, DistributionRow, SupportButton) · lib/dataset.js (feelingShare)`,
    purpose: {
      does: "answers “how are people feeling?”: Feeling Low, Feeling Anxious and Feeling Stressed, as a severity for one person, or the share affected for a team or the organisation.",
      boundary: "a screening signal, not a diagnosis. Each feeling comes from the survey's DASS questions (Feeling Low from Depression, Feeling Anxious from Anxiety, Feeling Stressed from Stress).",
      where: "the Library's Mental Well-being group; the SHAPE reports have their own (from the 9-item DASS).",
    },
    forms: [
      "Your three feelings, each with its severity pill.",
      "The same with a trend per feeling, and Get Support in the Action Bar (template Insight + Action Bar).",
      "Team: the share of the team affected per feeling.", "Team, 2x2: the same as bars, with the change.",
      "Org: the share of the organisation affected per feeling.", "Org, 2x2: the same as bars, with the change.",
    ],
    spec: [
      ["Severity pill", "Personal", "Normal, Mild, Moderate, Severe, Extremely Severe in the Likert Subtle tints, 11 / Bold."],
      ["Distribution row", "Team / Org", "Feeling name 11 / Medium, share %, a bar on 2x2 (Team Blue for team, Org Blue for org)."],
      ["Get Support", "Action Bar", "A 24px pill at the right of the Action Bar."],
    ],
    behaviour: [["Get Support", "Opens the support service the organisation has set up."], ["Change Widget", "Cycles the forms of the same persona."]],
    opens: { what: "the Mental Well-being Scope: the level of each feeling and how people moved between levels round by round.", stories: [["Mental Well-Being", "breakdown"], ["How People Moved", "trend"]] },
    states: [["Levels", "Normal, Mild, Moderate, Severe and Extremely Severe, from the survey's cut-offs."], ["Group under 5", "Not shown."]],
    content: [["Feelings", "Feeling Low, Feeling Anxious, Feeling Stressed. Never clinical labels on the card."]],
    done: ["The Support button is always reachable on the forms that have it.", "A group under 5 people shows nothing."],
  },

  /* ---- Time & Money ---------------------------------------------------- */
  "time-impact": {
    source: `${WB("time-impact")} · lib/impactModel.js (impactSeries)`,
    purpose: {
      does: "answers “what would reaching Flourishing give back?”: the hours a year each person would get back (more focused work, fewer days lost).",
      boundary: "the gaps come from people's own scores below 80; the rates that turn a point into hours come from the SHAPE impact model. Team reports show time only, never money.",
      where: "the Org report and the Library's Time & Money group.",
    },
    forms: ["“25 hrs to gain” in Org Blue with a caret (fewer hours than last round is good), “per person, per year” in the Evidence Bar.", "The team's hours, in Team Blue."],
    spec: [["Number", "Text", "48 / Bold in Org or Team Blue (not a status), unit 11 / Regular."], ["Caret", "Direction", "Down is good: fewer hours to gain means people moved closer to Flourishing."]],
    opens: { what: "the Time Impact Scope: what the number means, where the time comes from, what each step (60, 70, 80, 90) is worth, the scores behind it, where the gain sits, its history, Actions and the model.", stories: [S.meaning, ["Where the Time Comes From", null], ["What Each Step Is Worth", null], S.breakdown, ["Where the Gain Sits", null], S.trend, S.actions, ["How This Estimate Works", null]] },
    states: [["Everyone at 80+", "0 hours: nothing to gain."], ["No earlier round", "No caret."]],
    done: ["Hours come from the SHAPE impact model.", "The caret reads down as good."],
  },
  "time-gain": {
    source: `${WB("time-gain")} · lib/impactModel.js (samplePerson)`,
    purpose: {
      does: "answers “how much time would I get back?”: one person's hours a year if they reached Flourishing.",
      boundary: "Personal only, one number, no breakdown: the signed-in person's own hours.",
      where: "the Library's Time & Money group (Personal reports).",
    },
    forms: ["The hours in Org Blue, “to gain, per year” in the Evidence Bar."],
    spec: [["Number", "Text", "48 / Bold, unit “hrs” 11 / Regular."]],
    opens: { what: "the Time to Gain Scope: what it means, what each step is worth to you, and how the estimate works with your own Explorer scores.", stories: [S.meaning, ["What Each Step Is Worth to You", null], ["How This Estimate Works", null]] },
    states: [["At 80 or above", "0 hours."]],
    done: ["Never shows a split or money: a personal report shows time only."],
  },
  "money-composition": {
    source: `${WB("money-composition")} · widgets/ChartInsight.jsx (TileGrid) · lib/impactModel.js (impact)`,
    purpose: {
      does: "answers “what would reaching Flourishing be worth to the organisation?”: dollars a year from productivity, absenteeism, retention and injury / claims.",
      boundary: "Org only (never on a team report). Gaps from people's own scores; rates from the SHAPE impact model. Family id is money-composition; the name is Money Impact.",
      where: "the Org report and the Library's Time & Money group.",
    },
    forms: ["Four dollar tiles ($26K…) over a proportion bar."],
    spec: [["Tiles", "TileGrid 1x1", "40px tiles, 2px rail in the part's colour, value 11 / Bold, label 11 / Regular, the proportion bar beneath; up to four."]],
    behaviour: [["Hover a tile", "Tooltip: the part, its dollars and its share."]],
    opens: { what: "the Money Impact Scope: the total, where it comes from, what each step is worth, the scores behind it, where the gain sits, its history, Actions and the model.", stories: [S.meaning, ["Where the Money Comes From", null], ["What Each Step Is Worth", null], S.breakdown, ["Where the Gain Sits", null], S.trend, S.actions, ["How This Estimate Works", null]] },
    states: [["A part at $0", "Its tile still shows, $0."]],
    content: [["Money", "Rounded to thousands on the card (“$26K”), the currency of the organisation."]],
    done: ["The four parts add up to the Scope's total.", "Rates come from the SHAPE impact model."],
  },

  /* ---- Support --------------------------------------------------------- */
  "support-nudge": {
    source: `${WB("support-nudge")} · widgets/widgetParts.jsx (SupportButton)`,
    purpose: {
      does: "points someone to help: a short message and a Get Support button.",
      boundary: "no data of its own. It appears when a score suggests someone could use help (for example low Psychological Health).",
      where: "the Library's Support group (Personal reports).",
    },
    forms: ["Mindfulness: “Struggling or just want to be heard? Get support now.” on bg/quaternary.", "Mindfulness for a low Psychological Health score, on a soft red surface."],
    spec: [["Message", "Text", "13 / Regular, text/primary, in the Insight."], ["Button", "Action Bar", "Get Support pill at the right."], ["Surface", "Card", "The form's own card colour (families.js `card`): bg/quaternary, or the soft red of a low score."]],
    behaviour: [["Get Support", "Opens the support service the organisation has set up."]],
    states: [["Score recovers", "The low-score form is no longer offered."]],
    done: ["The button is in the Action Bar, at the right."],
  },
};
