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
  Citation: { question: "Where's it from?", about: "Sources behind the insight. Needs traceable sources." },
  Questionnaire: { question: "What else could I answer?", about: "A short set of related questions. Not designed yet." },
  Video: { question: "Can someone explain it?", about: "An explanatory video. Not designed yet." },
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
      { id: "form-stand-out", label: "What Stands Out", note: "Figma" },
      { id: "form-areas", label: "Areas to Focus On", note: "Figma" },
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
