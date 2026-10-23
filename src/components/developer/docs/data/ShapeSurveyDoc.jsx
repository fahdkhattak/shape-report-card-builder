import survey from "../../../../data/surveys/shape-survey.json";
import { makeSurveyDoc } from "./surveyDoc.jsx";

/* The SHAPE survey (data/sources/SHAPE Survey File.xlsx), imported by data/import-survey.js. */
export const { meta, toc, Page } = makeSurveyDoc(survey, {
  id: "data-shape-survey", name: "SHAPE Survey",
  blurb: "Every question in the SHAPE survey: Your Profile, the HPQ performance questions, and the 12 Explorers, with what each answer scores and whether it counts.",
});
export default Page;
