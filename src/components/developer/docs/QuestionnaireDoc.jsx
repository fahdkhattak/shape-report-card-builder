import { QuestionnaireStory } from "../../scope/stories/AddOnStories.jsx";
import { makeDoc } from "./storyDoc.jsx";
import { T } from "../docParts.jsx";

const Q = (p = {}) => () => <QuestionnaireStory {...p} />;

export const { meta, toc, Page } = makeDoc({
  id: "questionnaire", name: "Questionnaire", kind: "Questionnaire",
  blurb: "A short set of related questions, answered one at a time on a five-point scale. Not designed in Figma yet: built from the system's parts and offered for design review.",
  source: "components/scope/stories/AddOnStories.jsx (QuestionnaireStory)", figma: "",
  purpose: {
    does: "asks the reader a few short questions related to the insight, so they reflect on it or add context.",
    contains: "up to five statements, each on a five-point agree scale, a step count, Back / Next, and a finish state.",
    boundary: "it gathers reflection, not survey data: its answers never change the result, and it says where they go.",
    extra: ["There's no Figma frame for this family. It reuses the Story card, the pill language of the tabs and chips, and the dark pill buttons. Treat it as a proposal."],
    where: "addable from the Widget Builder catalogue (with a Sample tag); answers stay in the page in this prototype.",
  },
  forms: [{ id: "form-questionnaire", name: "Questionnaire", shows: "One statement at a time on a five-point scale, a progress bar, Back / Next, then a thank-you.", when: "A result invites reflection (Think About, but answered).", render: Q() }],
  spec: [
    ["Card", "Shell", "The Story card: title, explanatory line."],
    ["Progress", "Bar", <span key="p">“Question n of N” (Text 2xs / Semibold, text/tertiary), then a 4px track ({T("bg/secondary")}) filling in {T("text/primary")}.</span>],
    ["Question", "Text", "Text md / Bold, text/primary."],
    ["Scale", "Pills", <span key="s">Five pills (Strongly disagree … Strongly agree), Text xs, 6px / 12px, fully rounded, 1px {T("border/secondary")}; chosen: {T("bg/inverse")} with {T("text/inverse")}. 8px apart, wrapping.</span>],
    ["Actions", "Buttons", "Back (outlined) and Next / Submit (dark), 24px pills, at either end. Next waits for an answer."],
    ["Finish", "Panel", "card-within-card, radius/lg: a thank-you and where the answers went."],
  ],
  responsive: "The pills wrap onto more lines on a narrow card; the step count and buttons stay on one line.",
  content: [["Statements", "First person, one idea each, agree-able: “I understand what's behind this score.”"], ["Scale", "Strongly disagree, Disagree, Neutral, Agree, Strongly agree."], ["Honesty", "The finish state says where answers go (here: nowhere)."]],
  a11y: ["The scale is a radiogroup labelled with the statement; each pill is a radio.", "Progress is in text, not just the bar.", "Next is explained (“Pick an answer first”) until an answer is chosen."],
  props: [
    { name: "title / line", type: "string", desc: "Story title and explanatory line." },
    { name: "questions", type: "string[]", desc: "The statements, in order (3 to 5)." },
    { name: "sample", type: "boolean", def: "true", desc: "The Sample questions tag." },
  ],
  usage: `<QuestionnaireStory questions={["I understand what is behind my score.", "…"]} />`,
  done: ["One statement at a time with its step count.", "A five-point scale as a radiogroup.", "Next waits for an answer; Submit ends with a thank-you that says where answers went.", "Answers never change the result."],
  owner: ["Not designed. Questions for design: (1) One at a time, or all on one card? (2) Five-point agree scale, or the survey's own question types? (3) Where should answers go (the reader only, their manager, the next round)? (4) Should it reuse the Survey Builder's respondent screens instead?"],
  researcher: {
    lead: "A reader's own words next to their result.",
    story: ["A Questionnaire turns a result into a moment of reflection. Its answers are self-report about the result, not part of the survey, so they must never feed back into any score."],
    idea: "Ask the reader what they make of it.",
    facts: [["Question it answers", "What else could I answer?"], ["Data used", "None", "Answers stay in the page here."], ["Status", "Proposal", "Not in Figma."]],
    feeds: [["Questions", "Written per insight by the creator."], ["Answers", "Nowhere in this prototype."]],
    limits: [["Not survey data.", "Different people answer at different times, about a result they've just read; it can't be compared with the survey."], ["Leading questions.", "Statements shown right after a result can nudge answers."]],
    answers: ["What does the reader make of their result?"],
    nonAnswers: ["How do people feel? (The survey does that.)"],
    open: [["Where answers go", "Kept for the reader, shared, or discarded?"], ["Consent", "If stored, it needs its own consent and privacy rules."]],
  },
});
export default Page;
