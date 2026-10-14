import { overallSubject, subjectFromPrompt } from "../../lib/scopeSubject.js";

/* One real subject of each kind, resolved the way the Widget Builder resolves a prompt. Used by the pages that test the
   Story catalogue against every kind of subject (Story availability, Story sweep). */
export const SAMPLE_SUBJECTS = [
  { label: "Whole organisation", subject: overallSubject() },
  { label: "An Explorer", subject: subjectFromPrompt("Corporate Culture") },
  { label: "A Driver", subject: subjectFromPrompt("Sleep") },
  { label: "A cluster", subject: subjectFromPrompt("Sleep and Stress") },
  { label: "A concept", subject: subjectFromPrompt("Burnout Risk") },
].filter((x) => x.subject);
