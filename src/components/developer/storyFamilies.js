/* What each Story family is for, in one line. Shown in the Developer sidebar and on the "Story families" page.
   The families themselves come from storyCatalog.jsx's STORIES (`family`), so this only adds the wording. */
export const FAMILY_INFO = {
  "Insight Summary": { question: "How is it doing?", about: "The shortest answer. A headline and a line or two, so a reader can repeat it." },
  "Score / Status Meaning": { question: "What does it mean?", about: "Restates the current result and explains what it means for the reader, as a number, a ring, or a status word." },
  Breakdown: { question: "What is it made of?", about: "Shows the parts behind a result, or how people are spread across it." },
  Diagnostic: { question: "Where should I look?", about: "Points at what stands out: strongest and weakest parts, groups, gaps, links, and priorities." },
  Composition: { question: "Who is in it?", about: "Who is represented, and how each group scores." },
  Trend: { question: "How has it moved?", about: "Change over time, and where it's heading." },
  Actions: { question: "What can I do?", about: "Guidance one layer deeper. Never shown inline in a Scope." },
  Comparison: { question: "How do I compare?", about: "Me, Team, and Organisation side by side. Needs per-team data the product doesn't have yet." },
  Resource: { question: "Where can I learn more?", about: "A guide, service, or link relevant to the insight." },
  "Insight & Methodology": { question: "How was it worked out?", about: "What the measure is, how it's calculated, and who answered." },
  "Upgrade Path": { question: "What's next?", about: "An add-on that's relevant to the insight." },
  Citation: { question: "Where's it from?", about: "Sources behind the insight, collapsed until opened. Needs traceable sources to ship." },
  Questionnaire: { question: "What else could I answer?", about: "A short set of related questions, one at a time." },
  Video: { question: "Can someone explain it?", about: "An explanatory video with its transcript." },
};
/* Story name -> Developer page id, for the Stories that have a page. DeveloperScreen fills this in. */
export const DOCS_BY_STORY = {};

/* A family whose Stories are really several forms of one component lists the forms in the sidebar, each opening its
   page at that form. `covers` are catalogue Stories the forms replace in the list (they are documented by the same page). */
export const FAMILY_FORMS = {
  Breakdown: {
    doc: "breakdown",
    covers: ["Breakdown", "Mental Well-Being", "Health Age Drivers", "Who Is Where", "How Scores Are Spread"],
    forms: [
      { id: "form-radar", label: "Radar" },
      { id: "form-area", label: "Area" },
      { id: "form-bars", label: "Bars" },
      { id: "form-list", label: "List" },
      { id: "form-distribution", label: "Distribution" },
      { id: "form-zones", label: "Zones" },
      { id: "form-table", label: "Table View" },
      { id: "form-wellbeing", label: "Mental Well-Being", note: "Org, Team, Personal" },
      { id: "form-health", label: "Health Age Drivers" },
      { id: "form-who", label: "Who Is Where" },
      { id: "form-spread", label: "How Scores Are Spread" },
    ],
  },
  Diagnostic: {
    doc: "diagnostic",
    covers: ["Diagnostic", "What Changed", "Areas to Focus", "Bright Spots", "Within Reach", "How It Ranks", "Where Gaps Are Widest", "What Moves With This", "Priority Map"],
    forms: [
      { id: "form-stand-out", label: "What Stands Out" },
      { id: "form-areas", label: "Areas to Focus On" },
      { id: "form-changes", label: "What Changed" },
      { id: "form-bright", label: "Bright Spots" },
      { id: "form-gaps", label: "Where Gaps Are Widest" },
      { id: "form-connected", label: "What Moves With This" },
      { id: "form-priority", label: "Priority Map" },
      { id: "form-reach", label: "Within Reach" },
      { id: "form-rank", label: "How It Ranks" },
    ],
  },
};
FAMILY_FORMS.Composition = {
  doc: "composition",
  covers: ["Composition", "Composition (Donut)"],
  forms: [
    { id: "form-rings", label: "Rings" },
    { id: "form-donut", label: "Donut" },
    { id: "form-table", label: "Table View" },
  ],
};
FAMILY_FORMS.Comparison = {
  doc: "comparison",
  covers: ["Comparison"],
  forms: [
    { id: "form-radar", label: "Radar, legend beside" },
    { id: "form-radar-below", label: "Radar, legend below" },
    { id: "form-area", label: "Area" },
    { id: "form-age", label: "Health Age" },
    { id: "form-legend", label: "Legend" },
  ],
};
FAMILY_FORMS.Trend = {
  doc: "trend",
  covers: ["Trend"],
  forms: [
    { id: "form-history", label: "Score History" },
    { id: "form-line", label: "Score Over Time" },
    { id: "form-rows", label: "By part" },
    { id: "form-age", label: "Health Age Over Time" },
    { id: "form-state", label: "State Over Time" },
    { id: "form-level", label: "Level Over Time" },
    { id: "form-enps", label: "eNPS Over Time" },
  ],
};
FAMILY_FORMS.Resource = {
  doc: "resource",
  covers: ["Resource"],
  forms: [
    { id: "form-general", label: "General resource" },
    { id: "form-support", label: "Support resource" },
  ],
};
FAMILY_FORMS["Insight & Methodology"] = {
  doc: "methodology",
  covers: ["Insight & Methodology", "Who Answered"],
  forms: [
    { id: "form-status", label: "Status ranges" },
    { id: "form-health-short", label: "Health Age, short" },
    { id: "form-health-long", label: "Health Age, long" },
    { id: "form-dass", label: "DASS" },
    { id: "form-score", label: "Score" },
    { id: "form-enps", label: "eNPS" },
    { id: "form-coverage", label: "Who Answered" },
  ],
};

/* The Developer page that documents a Story: the page of the family form group it belongs to, else its own page. */
export const docIdForStory = (def) => Object.values(FAMILY_FORMS).find((f) => f.covers.includes(def.name))?.doc ?? DOCS_BY_STORY[def.name] ?? null;
