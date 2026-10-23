/* ================================================================== */
/* DATA CONTRACTS — what each Story and widget needs from the backend.   */
/*                                                                      */
/* Written in one generic vocabulary (ENTITIES below, shown on           */
/* Foundations › Data model) so it fits any survey type, not only the    */
/* SHAPE Performance Index: a survey names its own levels ("Explorer",   */
/* "Domain", "Facet"…), its own bands and its own scale. No contract     */
/* hard-codes 60 / 80, "Explorer" or "Driver".                           */
/*                                                                      */
/* Each contract: `needs` (rows: input · shape · required · notes),      */
/* `example` (a response, as JSON), `derived` (worked out in the client), */
/* `missing` (what the component does when part of it isn't there).      */
/* The prototype reads a generated dataset directly (lib/dataset.js);    */
/* these contracts are the shape a real service should send instead.    */
/* ================================================================== */

/* ---- The vocabulary ------------------------------------------------ */
export const ENTITIES = [
  {
    id: "survey", name: "Survey", what: "The instrument and its configuration. Everything that differs between survey types lives here, so components never assume one.",
    fields: [
      ["id · name", "string", "\"perf-index\" · \"SHAPE Performance Index\""],
      ["service", "string", "The product it belongs to (Performance Index, Pulse, Brain Health…)."],
      ["scale", "{ min, max }", "The range every score is normalised to. SHAPE: 0 to 100."],
      ["levels", "Level[]", "Names the tiers of the measure tree (below)."],
      ["bands", "Band[]", "The status scale. Empty when the survey has none."],
      ["minGroupSize", "number", "The privacy threshold. SHAPE: 5."],
      ["version", "string", "Changes when questions, weights or bands change, so rounds on different versions aren't compared silently."],
    ],
  },
  {
    id: "level", name: "Level", what: "One tier of the measure tree and what it's called. Components take their nouns from here.",
    fields: [["depth", "number", "0 is the overall score."], ["noun · nounPlural", "string", "\"Explorer\" · \"Explorers\" for SHAPE depth 1; \"Driver\" · \"Drivers\" for depth 2. Another survey might say \"Domain\" · \"Facet\"."]],
  },
  {
    id: "band", name: "Band", what: "One status on the survey's scale. Ordered lowest first.",
    fields: [["key", "string", "\"struggling\" · \"striving\" · \"flourishing\""], ["name", "string", "\"Struggling\""], ["from · to", "number", "Inclusive. SHAPE: 0 to 59, 60 to 79, 80 to 100."], ["tone", "\"error\" | \"warning\" | \"success\" | \"neutral\"", "Picks the design-system status colour. The component never picks colour from the number itself."]],
  },
  {
    id: "measure", name: "Measure", what: "Anything that gets a score: the overall score, an Explorer, a Driver, an index, a single question. Measures form a tree through parentId.",
    fields: [
      ["id · name", "string", "\"psych-health\" · \"Psychological Health\""],
      ["depth · parentId · order", "number · string · number", "Where it sits in the tree, and its order among siblings."],
      ["kind", "\"score\" | \"categorical\" | \"index\" | \"modelled\"", "score: a 0–100 mean. categorical: answers fall into levels (a severity scale, eNPS groups). modelled: an estimate from a model (Health Age, Time & Money)."],
      ["unit", "string?", "Shown after the number: \"/100\", \"eNPS\", \"hrs / year\"."],
      ["bandable", "boolean", "false when the bands don't apply (eNPS, a count). The number is then drawn neutral."],
      ["polarity", "\"higher-better\" | \"lower-better\"", "Lets a stress or risk measure read correctly. Default higher-better."],
    ],
  },
  {
    id: "round", name: "Round", what: "One administration of the survey. Always sent oldest first.",
    fields: [["id · label", "string", "\"r3\" · \"Nov 2025\""], ["closedAt", "ISO date", "\"2025-11-17\""], ["invited · responded", "number", "For participation and the Who Answered Story."], ["surveyVersion", "string", "So a change of version can be flagged instead of compared."]],
  },
  {
    id: "population", name: "Population", what: "Who the numbers describe. The report being viewed decides it; components only label it.",
    fields: [["type", "\"organisation\" | \"team\" | \"segment\" | \"person\"", "A segment is a group of people on an attribute (below)."], ["id · label", "string", "\"org\" · \"Organisation\", or \"dept:IT\" · \"IT\""], ["n", "number", "People it covers in the round shown."]],
  },
  {
    id: "score", name: "Score", what: "One measure, for one population, in one round.",
    fields: [["measureId · populationId · roundId", "string", ""], ["value", "number | null", "On the survey's scale. null when suppressed or not asked that round."], ["n", "number", "People behind the value."], ["suppressed", "boolean", "true when n is under minGroupSize. value is then null."]],
  },
  {
    id: "series", name: "Series", what: "A measure's scores across rounds for one population: the Score entity, one per round, oldest first.",
    fields: [["measureId · populationId", "string", ""], ["points", "{ roundId, value, n, suppressed }[]", "One per round, including rounds with value null, so gaps stay gaps."]],
  },
  {
    id: "bandCounts", name: "BandCounts", what: "How many people sit in each band, for one measure, population and round. Counts of people, never of measures.",
    fields: [["measureId · populationId · roundId", "string", ""], ["counts", "{ [bandKey]: number }", "{ flourishing: 6, striving: 39, struggling: 55 }"]],
  },
  {
    id: "distribution", name: "Distribution", what: "The spread of people's scores, binned on the server so no individual value leaves it.",
    fields: [["bins", "{ from, to, count }[]", "Ten-point bins on a 0–100 scale."], ["median · q1 · q3", "number", "For the \"middle half\" sentence."]],
  },
  {
    id: "segment", name: "Attribute & Segment", what: "Ways of grouping people (attributes) and the groups on each (segments). Any field the client collects can be an attribute; none are assumed.",
    fields: [["attribute", "{ key, label, kind }", "{ key: \"department\", label: \"Department\", kind: \"org-structure\" }. kind: demographic | org-structure | custom."], ["segment", "{ attributeKey, value, n, suppressed }", "Plus the Score / Series / BandCounts the Story asks for, scoped to that segment."]],
  },
  {
    id: "levelShare", name: "LevelShare", what: "For categorical measures: the share of people at each level (Normal to Extremely Severe; Promoter / Passive / Detractor).",
    fields: [["levels", "{ key, label, count, pct }[]", "Ordered best first. pct adds to 100."], ["summary", "number?", "A single figure the levels make, when the measure has one (eNPS)."]],
  },
  {
    id: "relationship", name: "Relationship", what: "How closely two measures move together across people.",
    fields: [["a · b", "measureId", ""], ["r · n · method", "number · number · \"pearson\"", "Computed on person-level scores on the server."]],
  },
  {
    id: "content", name: "Content", what: "Authored text and media, kept out of code: band paragraphs, headline templates, actions, citations, resources, video. Versioned and localised.",
    fields: [["key", "string", "\"meaning.overall.struggling\", \"actions.sleep\""], ["measureId · bandKey", "string?", "What it's attached to."], ["body", "string | object", "Templates use slots: {measure}, {value}, {band}, {population}."], ["locale · version · reviewed", "string · string · boolean", "Only reviewed content ships; unreviewed shows a Sample tag."]],
  },
  {
    id: "entitlement", name: "Entitlement", what: "What the viewer can see or buy. Decides locked states and upgrade offers.",
    fields: [["product", "string", "\"team-analytics\""], ["canView · canBuy", "boolean", ""], ["offer", "{ title, description, cta, href, preview? }?", ""]],
  },
];

/* Rules every contract follows. */
export const RULES = [
  ["Scores arrive on the survey's scale.", "The server averages people, not averages of averages, and sends the result normalised to survey.scale. The client never receives item answers or another person's record."],
  ["Privacy is applied on the server.", "Anything describing fewer than survey.minGroupSize people comes back with suppressed: true and value: null. The client never fills a suppressed value back in, and never works one out by subtraction."],
  ["Bands and nouns come from the survey.", "Components read survey.bands and survey.levels. Nothing hard-codes 60 / 80, \"Explorer\" or \"Driver\", so a survey with other bands or no bands works unchanged."],
  ["Rounds are oldest first.", "Change = the latest value minus the most recent earlier value that isn't null. Compare lets the reader pick another earlier round."],
  ["A null is a gap, not a zero.", "A round where a measure wasn't asked, or was suppressed, keeps its place with value null and draws as a gap."],
  ["Text is content.", "Sentences come from Content templates with slots. The component fills the slots; it doesn't write the sentence."],
  ["Every response says what it describes.", "population, roundId (asOf) and survey.version travel with the data, so a card can say \"Nov 2025\" and a version change can be flagged."],
];

/* ---- Shared request pieces ---------------------------------------- */
const SURVEY = ["survey", "Survey (scale, levels, bands, minGroupSize)", "Yes", "Once per report; every Story reads it."];
const POP = ["population", "Population", "Yes", "Who the Story describes. Labels only."];
const ROUNDS = ["rounds", "Round[]", "Yes", "Oldest first."];

const surveyEx = { scale: { min: 0, max: 100 }, levels: [{ depth: 0, noun: "Overall" }, { depth: 1, noun: "Explorer", nounPlural: "Explorers" }, { depth: 2, noun: "Driver", nounPlural: "Drivers" }], bands: [{ key: "struggling", name: "Struggling", from: 0, to: 59, tone: "error" }, { key: "striving", name: "Striving", from: 60, to: 79, tone: "warning" }, { key: "flourishing", name: "Flourishing", from: 80, to: 100, tone: "success" }], minGroupSize: 5 };
const popEx = { type: "organisation", id: "org", label: "Organisation", n: 100 };
const roundsEx = [{ id: "r1", label: "Feb 2025", closedAt: "2025-02-10" }, { id: "r2", label: "Jun 2025", closedAt: "2025-06-16" }, { id: "r3", label: "Nov 2025", closedAt: "2025-11-17" }];

/* ---- Story contracts (keyed by Developer page id) ------------------- */
export const CONTRACTS = {
  "insight-summary": {
    lead: "One measure, its latest and earlier score, and (for the evidence bar) its children's latest scores.",
    needs: [
      SURVEY, POP,
      ["measure", "Measure", "Yes", "The subject: its name goes in the sentence."],
      ["series", "Series of the measure", "Yes", "At least the latest point. The earlier point makes the \"up / down since\" clause."],
      ["children", "Measure[] + latest Score each", "No", "Draws the evidence bar, strongest first. Any depth: an overall score's children are Explorers, an Explorer's are Drivers."],
      ["headline template", "Content (summary.{bandKey})", "Yes", "\"Your organisation is {band}.\" Filled with the band of the latest value."],
    ],
    example: { survey: surveyEx, population: popEx, measure: { id: "overall", name: "Overall Score", depth: 0, kind: "score", bandable: true }, series: { points: [{ roundId: "r2", value: 54, n: 98 }, { roundId: "r3", value: 57, n: 100 }] }, children: [{ id: "coworker", name: "Coworker Dynamic", value: 84 }, { id: "psych", name: "Psychological Health", value: 41 }], content: { "summary.struggling": "Your {population} is {band}." } },
    derived: ["The band of the latest value (from survey.bands).", "The change since the earlier point, and its word (up / down / no change).", "The order of the evidence bar (strongest first)."],
    missing: [["Only one round", "The change clause is left out; the sentence still reads."], ["No children", "No evidence bar."], ["Measure not bandable", "The sentence has no status word and the number stays neutral."], ["Latest value suppressed", "The Story isn't drawn; the Scope shows the privacy note instead."]],
  },
  "score-meaning": {
    lead: "One value, its band, and the paragraph written for that band.",
    needs: [
      SURVEY, POP,
      ["measure", "Measure (name, unit, bandable)", "Yes", "unit is printed after the number."],
      ["series", "Series of the measure", "Yes", "The latest point is the number. Earlier points turn on Compare."],
      ["meaning text", "Content (meaning.{measureKind}.{bandKey})", "Yes", "The paragraph under the number, one per band. A measure with no bands has one neutral paragraph."],
      ["tile parts", "{ value, unit }[] + bandKey", "Units form only", "For a modelled measure shown in units (\"26 yrs\"). Comes from the model, not from Score."],
    ],
    example: { measure: { id: "overall", name: "Overall Score", unit: "/100", bandable: true }, series: { points: [{ roundId: "r1", value: 54 }, { roundId: "r2", value: 54 }, { roundId: "r3", value: 57 }] }, content: { "meaning.overall.struggling": "Your score sits in the Struggling range. There's real room to lift it…" } },
    derived: ["The band, its colour token and face (from the band's tone).", "The ring's fill (value ÷ scale.max).", "With Compare: the chosen earlier value and the difference."],
    missing: [["No earlier rounds", "No Compare control."], ["No content for the band", "The Story isn't shown: it never invents a paragraph."], ["bandable: false", "Neutral number, no face, no colour."]],
  },
  breakdown: {
    lead: "A measure's children, each with its score in every round. The same request draws the radar, area, bars, list, distribution and zones forms.",
    needs: [
      SURVEY, POP, ROUNDS,
      ["measure", "Measure", "Yes", "The parent. Its children are the parts."],
      ["children", "Measure[] + Series each", "Yes", "One per part. Latest point = the part's score; the earlier point = its change."],
      ["noun", "Level.noun of the children's depth", "Yes", "\"Explorer\" in table headers and sentences. From survey.levels."],
      ["part blurb", "Content (blurb.{measureId}.{bandKey})", "No", "The sentence in the radar tooltip and the List form."],
      ["Who Is Where", "BandCounts of the measure", "That form only", "People per band, for this population and round (and the compared round)."],
      ["How Scores Are Spread", "Distribution of the measure", "That form only", "Binned on the server."],
      ["Severity form", "LevelShare per child (categorical measures)", "That form only", "Five levels per measure, per round, with counts."],
    ],
    example: { measure: { id: "overall", name: "Overall Score" }, noun: "Explorer", children: [{ id: "physical", name: "Physical Health", points: [{ roundId: "r2", value: 60 }, { roundId: "r3", value: 63 }] }, { id: "psych", name: "Psychological Health", points: [{ roundId: "r2", value: 40 }, { roundId: "r3", value: 41 }] }] },
    derived: ["Ranking (strongest first, unless rank is off).", "Which form fits the number of parts (breakdownRules.js).", "Each part's band and change."],
    missing: [["A part's value is null", "Left out of every form; the Story says how many were left out."], ["No parts", "\"There's nothing to show here yet.\""], ["Only one round", "No change pills; no earlier ring in Compare."], ["A measure with no children", "The Story isn't offered for it (blocked in the builder)."]],
  },
  diagnostic: {
    lead: "Comparisons inside the data: strongest against weakest part, the lowest group on each attribute, what moved, what moves together.",
    needs: [
      SURVEY, POP, ROUNDS,
      ["children", "Measure[] + Series each", "Yes", "What Stands Out, What Changed, Within Reach, How It Ranks."],
      ["attributes", "Attribute[]", "Areas to Focus, Bright Spots, Gaps", "Every way the client can group people. None is assumed."],
      ["segments", "Segment[] + Series + BandCounts of the measure", "Areas to Focus, Bright Spots, Gaps", "Each segment's score, change, n and how many people are in the lowest band. Suppressed segments arrive flagged."],
      ["relationships", "Relationship[] (measure ↔ others)", "What Moves With This", "r and n per pair, from person-level scores."],
      ["part ↔ parent", "Relationship per child against the measure", "Priority Map", "How closely each part moves with the whole."],
      ["siblings", "Measure[] at the same depth + latest Score", "How It Ranks", "The peer set the measure is ranked in."],
    ],
    example: { children: [{ id: "coworker", name: "Coworker Dynamic", points: [{ roundId: "r3", value: 84 }] }, { id: "psych", name: "Psychological Health", points: [{ roundId: "r3", value: 41 }] }], segments: [{ attributeKey: "department", value: "IT", n: 14, points: [{ roundId: "r2", value: 49 }, { roundId: "r3", value: 47 }], counts: { struggling: 10, striving: 3, flourishing: 1 } }, { attributeKey: "department", value: "Legal", n: 3, suppressed: true }] },
    derived: ["Strongest and weakest; the lowest and highest segment per attribute; gap sizes; quadrants; distance to the next band line."],
    missing: [["Segment suppressed", "Never shown and never ranked. The footnote counts it."], ["No attributes", "Areas to Focus, Bright Spots and Gaps aren't offered."], ["One child", "What Stands Out shows the one part as both."], ["Fewer than 3 children", "Priority Map isn't offered."]],
  },
  composition: {
    lead: "Who the population is made of, attribute by attribute, and how each group scores.",
    needs: [
      SURVEY, POP,
      ["attributes", "Attribute[] (grouped into tabs)", "Yes", "Tabs come from attribute.kind or a tab field; the Story doesn't know the names."],
      ["segments", "Segment[] (n) + latest Score of the measure", "Yes", "n sizes each ring segment; the score fills the table."],
      ["measure", "Measure", "Yes", "Which score groups are compared on (the overall, or the Scope's own)."],
      ["population n", "number", "Yes", "Turns n into a share."],
    ],
    example: { attributes: [{ key: "department", label: "Department", tab: "Organisation" }, { key: "workModel", label: "Work Model", tab: "Organisation" }], segments: [{ attributeKey: "workModel", value: "Hybrid", n: 41, score: 58 }, { attributeKey: "workModel", value: "Remote", n: 33, score: 55 }] },
    derived: ["Each segment's share and colour (by order, from the graph palette).", "Against the average: segment score minus the population's."],
    missing: [["Segment suppressed", "Still drawn by headcount, but no score anywhere."], ["An attribute with one segment", "Left out (nothing to compare)."], ["No attributes in a tab", "The tab isn't shown."]],
  },
  actions: {
    lead: "The lowest-scoring measures at the deepest level, and the guidance written for each.",
    needs: [
      SURVEY, POP,
      ["measures", "Measure[] + latest Score (deepest level)", "Yes", "The list on the left, weakest first. For SHAPE, Drivers."],
      ["guidance", "Content (actions.{measureId})", "Yes", "{ headline, subhead, paragraphs[], thinkAbout[], playbook[] } per measure."],
      ["science · citations", "Content (science.{measureId}, citations.{measureId})", "No", "Only shown when reviewed content exists."],
    ],
    example: { measures: [{ id: "sleep", name: "Sleep", value: 38 }, { id: "stress", name: "Stress", value: 41 }], content: { "actions.sleep": { headline: "Protect recovery time", thinkAbout: ["…"], playbook: [{ title: "…", body: "…" }] } } },
    derived: ["Which measure opens first (the weakest).", "Band colour of each score in the list."],
    missing: [["No guidance for a measure", "It's left out of the list."], ["No reviewed science or citations", "Those cards don't appear."], ["No measures below the top band", "The Story still lists the weakest few."]],
  },
  comparison: {
    lead: "The same parts, scored for several populations side by side: the reader, their teams and the organisation.",
    needs: [
      SURVEY, ROUNDS,
      ["populations", "Population[] (person, team…, organisation)", "Yes", "Each becomes a legend card with its own toggle. A person population is only ever the viewer."],
      ["parts", "Measure[] (same list for every population)", "Yes", "In display order."],
      ["scores", "Score per population × part (latest round)", "Yes", "Suppressed teams arrive flagged."],
      ["Health Age form", "Modelled measure: { actualAge, healthAge } per population", "That form only", "From the Health Age model, not from Score."],
    ],
    example: { populations: [{ type: "person", id: "me", label: "You" }, { type: "team", id: "t-ops", label: "Operations", n: 12 }, { type: "organisation", id: "org", label: "Organisation", n: 100 }], parts: ["physical", "psych", "outside"], scores: { me: [72, 64, 58], "t-ops": [61, 44, 52], org: [63, 41, 55] } },
    derived: ["Series colours by population type.", "Which toggles start on (You and Organisation; the first team when there's no You)."],
    missing: [["No person data", "No You card; the first team starts on."], ["Team suppressed", "Its card shows, disabled, with the privacy note."], ["A part missing for one population", "Gap in that series only."]],
  },
  trend: {
    lead: "Measures over rounds. Every form shares one frame; they differ in what each round carries.",
    needs: [
      SURVEY, POP, ROUNDS,
      ["series", "Series per measure", "Score over time, by part", "One per line or row."],
      ["band shares", "BandCounts per round", "Status Over Time", "Turned into shares of the population."],
      ["levels", "LevelShare per measure per round", "State / Level over time, eNPS", "Five levels for a severity scale; three plus summary for eNPS."],
      ["reference", "Series of a modelled comparison", "Health Age only", "Drawn dashed (actual age)."],
    ],
    example: { rounds: roundsEx, series: [{ measureId: "overall", points: [{ roundId: "r1", value: 54 }, { roundId: "r2", value: 54 }, { roundId: "r3", value: 57 }] }], enps: [{ roundId: "r3", levels: [{ key: "promoter", pct: 18 }, { key: "passive", pct: 33 }, { key: "detractor", pct: 49 }], summary: -31 }] },
    derived: ["Axis range (a measure on its own scale: eNPS −100 to 100).", "Change between each round and the one before.", "Short round labels when space is tight."],
    missing: [["One round", "The Story isn't offered (a trend needs two points)."], ["A null round", "A gap in the line, labelled as not asked."], ["Survey version changed between rounds", "A marker on that round; values either side aren't joined."]],
  },
  "goal-pace": {
    lead: "The measure's series with dates, and a target.",
    needs: [
      SURVEY, POP, ROUNDS,
      ["series", "Series of the measure", "Yes", "Two or more points."],
      ["target", "number", "No", "Saved with the widget if the product keeps it; otherwise the next band's lower edge."],
    ],
    example: { rounds: roundsEx, series: { points: [{ roundId: "r1", value: 54 }, { roundId: "r2", value: 54 }, { roundId: "r3", value: 57 }] }, target: 60 },
    derived: ["Pace = (latest − first) ÷ rounds between.", "Rounds to target, and an estimated date from the average gap between closedAt dates."],
    missing: [["Fewer than two points", "Not offered."], ["Flat or falling", "No estimate line."]],
  },
  relationships: {
    lead: "Counts, not people: the service does the cross-tabulation and the test, and sends only cells of 5 or more.",
    needs: [
      SURVEY, POP,
      ["quadrant.pairs", "{ key, label, x: MeasureRef, y: MeasureRef, cut, n, cells: [{ key, name, about, n, pct, change }] }[]", "Where People Sit", "Four cells per pair, keyed \"x,y\" with 1 = the good side of the cut. Each axis carries its own low / high words (Stress: High / Low)."],
      ["withWithout.items", "{ key, offer, question, with: { n, k, pct }, without: { n, k, pct }, neutral, p, evidence }[]", "What Makes the Difference", "pct is null when n is under minGroupSize; p is null when either group is. p is the two-sided Fisher's exact test."],
      ["withWithout.outcome", "{ label, phrase }", "What Makes the Difference", "The outcome the offers are tested against (SHAPE: Flourishing). The phrase completes the hover sentence."],
      ["statusOutcome.statuses", "{ status, n, values: { [outcomeKey]: number } }[]", "Why Flourishing Matters", "One row per band, best first."],
      ["statusOutcome.outcomes", "{ key, label, kind: \"share\" | \"score\" }[]", "Why Flourishing Matters", "A share is drawn as ten people, a score as a bar."],
    ],
    example: {
      quadrant: { key: "stress-resilience", label: "Stress and Resilience", cut: 60, n: 146, cells: [{ key: "1,1", name: "Steady", n: 72, pct: 49, change: 3 }, { key: "0,0", name: "At risk", n: 36, pct: 25, change: -2 }] },
      withWithout: { outcome: { key: "flourishing", label: "Flourishing" }, items: [{ key: "ergonomic", offer: "an ergonomically sound workstation", with: { n: 65, k: 18, pct: 28 }, without: { n: 16, k: 1, pct: 6 }, p: 0.1, evidence: "Could be chance" }] },
      statusOutcome: { statuses: [{ status: "Flourishing", n: 23, values: { lookforward: 96, performance: 89 } }] },
    },
    derived: ["Ratio of the two shares (\"3.2× as likely\").", "Plain words for p (under 0.01 strong, under 0.05 some, else could be chance).", "Zone colour from the cell key, never from the number."],
    missing: [["A group under 5", "No share and no test: \"Too few people without it to show\"."], ["Only one quadrant pair", "No measure tabs."], ["No earlier round", "No change in the zone detail or the table."]],
  },
  methodology: {
    lead: "How the numbers were made: the survey's scale, bands and method text, and who answered.",
    needs: [
      SURVEY, ROUNDS,
      ["method text", "Content (method.{measureKind})", "Yes", "One per kind of measure explained (status, score, eNPS, a model)."],
      ["coverage", "Round.invited · responded, per round", "Who Answered", "Participation per round."],
      ["suppressed count", "number per attribute", "Who Answered", "How many segments the privacy rule hid. A count only, never which."],
    ],
    example: { survey: surveyEx, rounds: [{ id: "r3", invited: 104, responded: 100 }], suppressed: { department: 2, location: 0 }, content: { "method.score": "Each score is the average of the answers to its questions, on a 0 to 100 scale…" } },
    derived: ["The band rows from survey.bands (so another survey's bands show correctly).", "Participation rate."],
    missing: [["Survey has no bands", "The status rows are left out."], ["No invited count", "Responses only, no rate."]],
  },
  resource: {
    lead: "One authored resource, or a support service shown only when its trigger fires.",
    needs: [
      ["resource", "Content (resource.{key}): { title, name, description, linkLabel, href }", "Yes", ""],
      ["trigger", "{ measureId, rule } evaluated on the server", "Support form only", "The server says whether it fired; the client never evaluates health data itself."],
      ["service", "{ name, description, ctaLabel, href, phone } for the viewer's region", "Support form only", "Verified per country."],
    ],
    example: { resource: { title: "Read the Research", name: "Sleep and Performance", description: "…", linkLabel: "Get White Paper", href: "https://…" } },
    derived: [],
    missing: [["No href", "The button is inert."], ["Trigger didn't fire", "The Support Story isn't drawn."], ["Not reviewed", "Sample tag."]],
  },
  upgrade: {
    lead: "An offer the viewer can act on, from their entitlements.",
    needs: [["entitlement", "Entitlement (canView, canBuy, offer)", "Yes", "Decides Buy versus Contact Creator."]],
    example: { product: "team-analytics", canView: false, canBuy: true, offer: { title: "Team Analytics", description: "See how each team compares…", cta: "Get Team Analytics", href: "/store/team-analytics" } },
    derived: [],
    missing: [["canView already true", "Not shown."], ["canBuy false", "Only the fallback CTA."]],
  },
  citation: {
    lead: "The sources behind a claim on the Scope.",
    needs: [["citations", "Content (citations.{measureId|claimId}): { text, url? }[]", "Yes", "Footnote order. Reviewed only."]],
    example: { citations: [{ text: "Walker, M. (2017). Why We Sleep.", url: "https://…" }] },
    derived: [],
    missing: [["None reviewed", "Not drawn."]],
  },
  video: {
    lead: "One media item and its transcript.",
    needs: [["media", "Content (media.{key}): { src, poster, duration, transcript, captions? }", "Yes", "A transcript is required to ship."]],
    example: { media: { src: "/media/stories.mp4", poster: "/media/stories.jpg", duration: "0:30", transcript: "…" } },
    derived: [],
    missing: [["No src", "Poster only, inert."], ["No transcript", "Not shipped."]],
  },
  questionnaire: {
    lead: "The question text behind a measure, so a reader sees what people were asked.",
    needs: [["items", "{ id, text, order }[] for the measure (3 to 5)", "Yes", "From the survey's own question bank, for the survey version of the round shown."]],
    example: { measureId: "sleep", items: [{ id: "q41", text: "I usually wake up feeling rested." }, { id: "q42", text: "I get enough sleep most nights." }] },
    derived: [],
    missing: [["No items for the version shown", "Not drawn."]],
  },
};

/* ---- Widget contracts (keyed by widget page id) --------------------- */
export const WIDGET_CONTRACTS = {
  // One Score widget for any population and any measure (lib/scoreWidget.js): what is sent follows who it is about.
  "widget-score": {
    lead: "Any one measure (the root, a cluster, an Explorer, a Driver) for any population (the organisation, a team, a segment, one person). What is sent depends on who it is about: a person sends no counts, a measure with no children sends no part counts.",
    needs: [
      SURVEY,
      ["population", "Population (organisation, team, segment or person)", "Yes", "Who it's about. A team or segment under survey.minGroupSize arrives suppressed: true with value null, and the card shows nothing."],
      ["measure", "Measure (any depth)", "Yes", "What it's about. The title is built from the two: \"Org Score\", \"Your Sleep Score\", \"IT Group Score\"."],
      ["series", "Series of that measure for that population", "Yes", "Latest point = the number; the point before = the change."],
      ["round", "Round (latest): closedAt, invited, responded", "Date always; counts for populations", "Headcount and participation for a population. Participation only when invited is known for that population (always for the organisation and a team; a segment only if the invite list carries the attribute)."],
      ["bandCounts", "BandCounts of people on that measure", "Populations, 2x2", "People by status (bar and counts)."],
      ["partCounts", "BandCounts of the measure's children", "Measures with children, 2x2", "Parts by status (bar and sentence); the noun from survey.levels."],
    ],
    example: { population: popEx, measure: { id: "overall", depth: 0 }, series: { measureId: "overall", points: [{ roundId: "r2", value: 54, n: 98 }, { roundId: "r3", value: 57, n: 100 }] }, round: { id: "r3", closedAt: "2025-11-17", invited: 100, responded: 100 }, bandCounts: { counts: { flourishing: 6, striving: 39, struggling: 55 } } },
    derived: ["Band and colour of the number.", "Change (latest − earlier).", "Participation = responded ÷ invited.", "Which elements the card may carry (who × what) and which it shows by default."],
    missing: [["One round", "No change pill."], ["A person", "No headcount, participation or people by status; their status and their parts by status instead."], ["A leaf measure (a Driver)", "No parts by status."], ["Population under minGroupSize", "Nothing shown but a privacy note."], ["No invited count", "Headcount only, no rate."], ["No bands", "Neutral number, no status or splits."]],
  },
  // One Index for any measure with children: 2x2 = one layer, 3x3 = two.
  "widget-index": {
    lead: "A measure, its children and (3x3) their children, for one population.",
    needs: [
      SURVEY, POP,
      ["measure", "Measure with at least one layer of children", "Yes", "A leaf measure (a Driver) has no Index; offer the Score widget instead."],
      ["value", "Series of the measure (latest)", "Yes", "The number in the centre."],
      ["children", "Measure[] at depth + 1, each with its latest and earlier value", "Yes", "The ring. Up to 20 on a 2x2 (names on up to 12), 12 on a 3x3."],
      ["grandchildren", "Measure[] at depth + 2 under each child", "3x3 only", "The outer ring. A measure with only one layer under it is 2x2 only."],
    ],
    example: { measure: { id: "overall", depth: 0, value: 57 }, children: [{ id: "physical", name: "Physical Health", value: 48, prev: 46, children: [{ id: "sleep", name: "Sleep", value: 41 }] }] },
    derived: ["Wedge order and size (equal slices), colours by band, which labels and scores fit inside each slice."],
    missing: [["A child with no value", "Left out of the ring."], ["Only one layer", "2x2 only."], ["No layers", "No Index."]],
  },
  "widget-score-history": {
    lead: "One measure's value in every round.",
    needs: [
      SURVEY, POP, ROUNDS,
      ["series", "Series of the measure", "Yes", "1x1 shows up to 3 rounds, 2x2 up to 7 (Graph rules); more sends the reader to the Scope."],
      ["caption template", "Content (history.{shape})", "2x2 only", "The sentence under the chart (\"After dipping in Jun, …\")."],
    ],
    example: { rounds: roundsEx, series: { measureId: "overall", points: [{ roundId: "r1", value: 54 }, { roundId: "r2", value: 54 }, { roundId: "r3", value: 57 }] } },
    derived: ["Which rounds fit the size (the latest always).", "The change pill (latest − previous).", "The caption's shape: rising, falling, dip then rise…"],
    missing: [["One round", "Not offered (a history needs two points)."], ["A null round", "A gap in the line."]],
  },
  "widget-explorers": {
    lead: "Every child of the root measure (for SHAPE, the Explorers) with its latest value and change.",
    needs: [
      SURVEY, POP,
      ["children", "Measure[] at depth 1 + Series (latest and earlier point)", "Yes", "The rows. The noun comes from survey.levels."],
      ["tiers", "survey.bands", "Yes", "Great / Average / Poor are the bands, top to bottom, renamed for this widget."],
    ],
    example: { noun: "Explorer", children: [{ id: "coworker", name: "Coworker Dynamic", points: [{ roundId: "r2", value: 82 }, { roundId: "r3", value: 84 }] }, { id: "psych", name: "Psychological Health", points: [{ roundId: "r2", value: 40 }, { roundId: "r3", value: 41 }] }] },
    derived: ["Ranking, tiering by band, and which rows fit (up to two per tier on the 2x2; strongest and weakest on the 1x1).", "\"N more\" count."],
    missing: [["Child suppressed or null", "Left out; \"N more\" doesn't count it."], ["Fewer than 2 children", "1x1 shows the one row."]],
  },
};

export const contractFor = (id) => CONTRACTS[id] || WIDGET_CONTRACTS[id] || null;
