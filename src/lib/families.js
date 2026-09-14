/* ================================================================== */
/* FIXED LIBRARY FAMILIES                                              */
/* Library-sourced widgets belong to a fixed family with pre-built     */
/* forms — no AI involved, swappable via "Change widget".              */
/* ================================================================== */
export const FAMILIES = [
  { id: "your-score", name: "Your Score", category: "Score", blurb: "Your overall wellbeing score at a glance.", forms: [{ size: "1x1", label: "Plain" }, { size: "2x2", label: "With breakdown" }] },
  { id: "org-status", name: "Org Status", category: "Score", blurb: "See where your organisation stands right now.", forms: [{ size: "1x1", label: "Status only" }, { size: "2x2", label: "Status + breakdown" }] },
  { id: "explorers", name: "Explorers", category: "Areas to Focus", blurb: "Identify the areas holding performance back.", forms: [{ size: "2x2", label: "Ranked list" }] },
  { id: "factors", name: "Factors", category: "Areas to Focus", blurb: "Rank the individual drivers behind your scores.", forms: [{ size: "2x2", label: "Ranked list" }] },
  { id: "score-history", name: "Score History", category: "Score over time", blurb: "Track how your score has changed over rounds.", forms: [{ size: "2x2", label: "Sparkline" }] },
  { id: "enps", name: "ENPS", category: "Score", blurb: "Employee net promoter score for this round.", forms: [{ size: "1x1", label: "Score + bar" }] },
  { id: "areas-focus", name: "Areas to Focus", category: "Areas to Focus", blurb: "See the demographic group that needs your attention most.", forms: [{ size: "1x1", label: "Top concern" }] },
  { id: "avg-gender", name: "Avg. Score: Gender", category: "Explorers Results", blurb: "Compare average scores across gender groups.", forms: [{ size: "1x1", label: "Bar chart" }] },
  { id: "avg-work-model", name: "Avg. Score: Work Model", category: "Explorers Results", blurb: "Compare average scores by onsite/hybrid/remote.", forms: [{ size: "1x1", label: "Bar chart" }] },
  { id: "popular-responses", name: "Popular Responses", category: "Explorers Results", blurb: "The most common open-text themes this round.", forms: [{ size: "1x1", label: "Treemap" }] },
  { id: "time-impact", name: "Time Impact", category: "Health Age", blurb: "Estimated hours gained or lost per year.", forms: [{ size: "1x1", label: "Hours/annum" }] },
  { id: "index", name: "Wellbeing Index", category: "Score", blurb: "Your overall score, broken down by Explorer and driver.", forms: [{ size: "2x2", label: "Explorer ring" }, { size: "3x3", label: "Explorer + driver ring" }] },
];

export function familyById(id) {
  return FAMILIES.find((f) => f.id === id);
}
