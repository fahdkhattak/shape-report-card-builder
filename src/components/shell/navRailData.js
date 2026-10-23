/* ================================================================== */
/* NAV RAIL — sample/presentational content only, no real backend.      */
/* The app has no multi-report persistence and no real account system,  */
/* so this is static demo content matching the real Figma sample data   */
/* verbatim (984qJvMt7fCHASYHRwgrab, node 11923:46254) rather than       */
/* invented placeholder text — accurate to design, honest about being   */
/* presentational (see docs/figma-sidebar-audit.md §7, §9).              */
/* ================================================================== */
// `blurb` is a one-line description shown as Reports' secondary line in
// SearchOverlay.jsx's results (Figma node 13750:16126's annotation: "Reports
// show description"). Same honest-sample-data status as the rest of this
// file — the "shape-perf" line is the literal example copy from that Figma
// node ("Performance Advantage Index" / "From employee signals to business
// clarity."), the others written in matching tone since no other report's
// blurb was sampled.
export const SAMPLE_REPORTS = [
  {
    id: "shape-perf",
    name: "SHAPE Performance Report",
    blurb: "From employee signals to business clarity.",
    subItems: [
      { id: "shape-perf-personal", name: "Personal" },
      { id: "shape-perf-team", name: "Team" },
      { id: "shape-perf-org", name: "Org" },
    ],
  },
  // The SHAPE report on the new survey dataset (lib/survey/surveyData.js): a personal report (one person's own answers)
  // and an Org report. The placeholder reports that used to follow were removed.
  {
    id: "shape",
    name: "SHAPE",
    blurb: "Your SHAPE survey results, for you and for the organisation.",
    subItems: [
      { id: "shape-personal", name: "Personal" },
      { id: "shape-org", name: "Org" },
    ],
  },
];

// Draft conversations — same honest-sample-data status as SAMPLE_REPORTS
// above: real copy from the SHAPE 3.0 Roughwork reference (Z6YmEggwvoiX3j4
// d3kCKqV, node 2031:8741 "Chat 12"), not invented placeholder text. The app
// has no multi-conversation model (one `mainChat` instance for the whole
// session, see lib/useChatThread.js) — so unlike a real Drafts feature where
// clicking a row would switch conversations, these are flat, inert rows,
// same as any SAMPLE_REPORTS entry with no subItems. The first entry is
// hardcoded active (matching the reference's own static frame, where
// "Motivation Investigation" is the currently-open conversation) rather than
// tracking real conversation identity, since there's only ever one real
// conversation to represent.
// `edited` is Drafts' secondary line in SearchOverlay.jsx's results (same
// Figma node's "Drafts show recency" note) — real example copy from the
// node's own Recent-Drafts/results-list frames, not invented.
export const SAMPLE_DRAFTS = [
  { id: "draft-motivation", name: "Motivation Investigation", edited: "Draft edited 2 hours ago" },
  { id: "draft-physical", name: "Physical health check", edited: "Draft edited 4 hours ago" },
  { id: "draft-absenteeism", name: "Underlying cause of absenteeism in the company", edited: "Draft created last week" },
];

export const ACCOUNTS = [
  { id: "olivia-work", name: "Olivia Rhye", email: "olivia@meta.com", current: true },
  { id: "olivia-personal", name: "Olivia Personal", email: "olivia.rhye@gmail.com", initials: "OP" },
];

export const EXTRA_LINKS_COLUMNS = [
  { header: "SHAPE", items: ["About Us", "Science"] },
  { header: "RESOURCES", items: ["White Papers"] },
  { header: "LEGAL", items: ["Privacy Policy", "Terms of Use"] },
];
