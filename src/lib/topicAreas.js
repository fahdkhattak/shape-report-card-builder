/* ================================================================== */
/* TOPIC AREAS — deterministic topic recognition for the mascot's       */
/* opening scoping conversation. See docs/mascot-conversation-decision-  */
/* tree.md, Node 1-2: turn a vague human topic into a confirmed driver   */
/* set before any widget generation happens.                            */
/*                                                                      */
/* Each area is a plausible "what are you concerned about" topic, with  */
/* a matched driver set (what the mascot would measure first) and a     */
/* suggested set (adjacent drivers worth offering, per Node 2's "these  */
/* could also be relevant" pattern).                                    */
/* ================================================================== */
export const AREAS = [
  {
    id: "burnout",
    label: "Burnout & Workload",
    keywords: ["burnout", "workload", "overwhelm", "exhaust", "overtime", "tired", "capacity"],
    matched: ["Workload", "Burnout Risk", "Stress Levels"],
    suggested: ["Manager Support", "Life Outside Work"],
  },
  {
    id: "engagement",
    label: "Employee Engagement",
    keywords: ["engagement", "motivat", "morale", "commitment", "retention", "turnover"],
    matched: ["Employee Engagement", "Job Satisfaction", "Employee Commitment"],
    suggested: ["Corporate Culture", "Manager Support"],
  },
  {
    id: "wellbeing",
    label: "Overall Wellbeing",
    keywords: ["wellbeing", "well-being", "health", "flourish"],
    matched: ["Overall Wellbeing", "Physical Health", "Psychological Health"],
    suggested: ["Sleep Quality", "Stress Levels"],
  },
  {
    id: "culture",
    label: "Culture & Environment",
    keywords: ["culture", "environment", "onboarding", "trust", "belonging"],
    matched: ["Corporate Culture", "Work Environment", "Onboarding Experience"],
    suggested: ["Diversity", "Coworker Dynamics"],
  },
  {
    id: "mental-health",
    label: "Mental Health",
    keywords: ["mental health", "anxiety", "psychological", "safety"],
    matched: ["Psychological Health", "Stress Levels", "Burnout Risk"],
    suggested: ["Sleep Quality", "Life Outside Work"],
  },
  {
    id: "team-dynamics",
    label: "Team Dynamics",
    keywords: ["team", "collaboration", "communication", "coworker", "manager", "leadership"],
    matched: ["Coworker Dynamics", "Manager Support", "Corporate Culture"],
    suggested: ["Employee Engagement", "Job Satisfaction"],
  },
  {
    id: "growth",
    label: "Career Growth",
    keywords: ["growth", "career", "development", "training", "promotion", "skills"],
    matched: ["Career Growth", "Job Satisfaction", "Manager Support"],
    suggested: ["Employee Commitment", "Corporate Culture"],
  },
  {
    id: "flexibility",
    label: "Work Model & Flexibility",
    keywords: ["remote", "hybrid", "flexib", "in-office", "location"],
    matched: ["Work Model", "Life Outside Work", "Job Satisfaction"],
    suggested: ["Coworker Dynamics", "Employee Engagement"],
  },
];

/* Returns every area whose keywords appear in the prompt — 0 = no match
   (fallback), 1 = confirmed, 2+ = ambiguous (disambiguate). */
export function matchAreas(prompt) {
  const p = prompt.toLowerCase();
  return AREAS.filter((a) => a.keywords.some((k) => p.includes(k)));
}

export function areaById(id) {
  return AREAS.find((a) => a.id === id);
}
