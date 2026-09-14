/* ================================================================== */
/* NAV RAIL — sample/presentational content only, no real backend.      */
/* The app has no multi-report persistence and no real account system,  */
/* so this is static demo content matching the real Figma sample data   */
/* verbatim (984qJvMt7fCHASYHRwgrab, node 11923:46254) rather than       */
/* invented placeholder text — accurate to design, honest about being   */
/* presentational (see docs/figma-sidebar-audit.md §7, §9).              */
/* ================================================================== */
export const SAMPLE_REPORTS = [
  {
    id: "shape-perf",
    name: "SHAPE Performance Report",
    subItems: [
      { id: "shape-perf-personal", name: "Personal" },
      { id: "shape-perf-team", name: "Team" },
      { id: "shape-perf-org", name: "Org" },
    ],
  },
  { id: "workplace-exp", name: "Workplace Experience Report" },
  { id: "total-brand", name: "Total Employee Brand Report" },
  { id: "brain-health", name: "Brain Health Report" },
  { id: "das", name: "DAS Report" },
  { id: "wfi", name: "WFI Report" },
  { id: "diversity", name: "Diversity and Inclusion Report" },
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
export const SAMPLE_DRAFTS = [
  { id: "draft-motivation", name: "Motivation Investigation" },
  { id: "draft-physical", name: "Physical health check" },
  { id: "draft-absenteeism", name: "Underlying cause of absenteeism in the company" },
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
