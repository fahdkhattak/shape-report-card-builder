import { GoalStory } from "../../scope/stories/ExtraStories.jsx";
import { makeDoc } from "./storyDoc.jsx";
import { T } from "../docParts.jsx";
import { overallSubject } from "../../../lib/scopeSubject.js";

const subject = overallSubject();
const S = subject.series;
const goal = (p = {}) => <GoalStory label="Overall Score" series={S} {...p} />;

export const { meta, toc, Page } = makeDoc({
  id: "goal-pace", name: "Goal & Pace", kind: "Trend",
  blurb: "A target the reader sets, the gap to it, and a straight-line estimate of when it is reached at the pace so far. Not in Figma: built from the Trend and Diagnostic parts and offered for design review.",
  source: "components/scope/stories/ExtraStories.jsx (GoalStory)", figma: "",
  purpose: {
    does: "turns a trend into a target: how far the score is from a number the reader picks, and how long the recent pace would take to close it.",
    contains: "the target (a field and three presets), the headline sentence, Now / Target / Gap, a line chart of past rounds with the target line and the estimate, and a note.",
    boundary: "the estimate is a straight line through the first and latest rounds. It is never a forecast and never says what will happen.",
    extra: ["Only three rounds exist in the prototype data, so the pace is rough and the Story says so. It refuses to project past 12 more rounds and says a smaller target may be a better next step."],
    where: "the Widget Builder's Add Story menu (not suggested by default). It lives in the Trend family but has its own page because it takes input.",
  },
  forms: [{
    id: "form-goal", name: "Goal & Pace", shows: "Target field and presets, a sentence, Now / Target / Gap, and the chart with the target line and the estimate.", when: "A reader has a number in mind, or the score is close to the next status line.", render: () => goal(),
    states: [
      { title: "Default · the next status line", note: "The target starts at the next line up (60, then 80), or 90 once Flourishing.", render: () => goal() },
      { title: "A far target", note: "Past 12 more rounds the sentence says so and suggests a smaller target.", render: () => goal({ initialTarget: 90 }) },
      { title: "Already there", note: "A target at or below the score.", render: () => goal({ initialTarget: 50 }) },
      { title: "Not rising", note: "A series that has been flat or falling gets no estimate line.", render: () => goal({ series: S.map((v, i) => v - i * 2), initialTarget: 60 }) },
    ],
  }],
  spec: [
    ["Card", "Shell", "The Story card; title Text lg / Bold, explanatory line, then the content."],
    ["Target control", "Field + presets", <span key="t">A 64px number field ({T("bg/secondary")} fill) and three preset pills: 60, 80 and 90 (the two status lines and a stretch goal). The chosen preset is dark. On a compact card the controls take a full row.</span>],
    ["Headline", "Text", "Text sm, text/primary. Numbers in the sentence are bold."],
    ["Now · Target · Gap", "Stats", "28px / 700 in tabular figures, 24px apart. Now is in its status colour; Target and Gap are text/primary. Gap never goes below 0."],
    ["Chart", "SVG", <span key="c">Drawn at the card's own width (never a wide picture scaled down), 240px tall (220 on a compact card). The scale is zoomed to the past scores, the target and the estimate (with 8 points of room, in steps of 10 or 20) so a few points show as a slope, and the note says where it runs from and to. Gridlines in {T("border/tertiary")}; the past rounds in grey with their score in the status colour above each point and the month under it; the target as a dashed dark line labelled TARGET n; the estimate as a dashed blue line ending in an open dot labelled with the month (or "+8 rounds").</span>],
    ["Note", "Text", "Text xs, text/tertiary: a straight line from past rounds, not a forecast, and how many rounds exist."],
  ],
  responsive: "The chart measures its wrapper and draws at that width, so its text stays 11 to 12px on a phone instead of shrinking with a fixed 776px picture. Under 520px the left axis narrows (32px), the chart is 220px tall, and the controls take their own row.",
  content: [
    ["Wording", "“would reach 80 in about 2 more rounds, around Mar 26.” Never “will”. “Not a forecast” is always on the card."],
    ["Far targets", "Past 12 rounds: “a long way off. A smaller target may be a better next step.” Never a date."],
    ["Numbers", "Whole numbers; the pace to one decimal (+1.5 a round)."],
  ],
  a11y: [
    "The target field has a label (“Target score”) and the presets are buttons with their number as the name.",
    "The chart's meaning is in the headline sentence and the Now / Target / Gap row, so the SVG adds nothing the text doesn't say.",
    "The estimate is dashed and blue, the target dashed and dark: they differ by label and style as well as colour.",
  ],
  props: [
    { name: "label", type: "string", required: true, desc: "What the score is called in the sentence (the widget's subject)." },
    { name: "series", type: "number[]", required: true, desc: "The score in every round, oldest first. The last is \"now\"." },
    { name: "initialTarget", type: "number", def: "next status line", desc: "Where the target starts. The reader can change it." },
  ],
  usage: `<GoalStory label="Overall Score" series={[54, 54, 57]} initialTarget={60} />`,
  done: [
    "The chart draws at the card's width at 320, 390 and 808px, with 11 to 12px text and no sideways scroll.",
    "The estimate line stops at 8 rounds and never claims more than 12.",
    "A target at or below the score says so; a flat or falling series draws no estimate.",
    "Changing the target updates the sentence, the Gap and the chart together.",
    "“Not a forecast” is on the card.",
  ],
  owner: [
    "Not designed. Questions for design: (1) Should the target be saved with the widget, or only for the reader? (2) Is a straight line the right estimate with so few rounds, or should the Story wait until there are four or more? (3) Should a reader see a range, not one line? (4) Does Goal & Pace belong in a report at all, or only in the builder?",
  ],
  researcher: {
    lead: "A target makes a trend something to act on.",
    story: ["Goal & Pace takes the score's change from the first round to the latest, divides it by the number of rounds, and asks how many more rounds of that pace close the gap to a number the reader chooses. It is arithmetic on the average, not a model of what will happen."],
    idea: "Say how far away the goal is, and be honest that the estimate is only the recent pace continued.",
    facts: [["Question it answers", "How far is it, and how long at this pace?"], ["Data used", "The score in every round"], ["Pace", "(latest − first) ÷ rounds between"], ["Status", "Proposal", "Not in Figma."]],
    feeds: [["Now, past rounds", "The subject's score in each round."], ["Target", "The reader's choice (or the next status line)."], ["Estimate", "Latest score + pace × rounds, capped at 8 rounds on the chart."], ["Month", "The round dates, stepped forward by the average gap between rounds."]],
    limits: [["Three points are not a trend.", "With three rounds the pace is the average of two changes. It can swing on one noisy round."], ["It assumes the pace holds.", "Scores usually flatten as they rise; a straight line is optimistic near the top."], ["It describes the average.", "The Story says nothing about who moves or why."], ["Targets are the reader's.", "A target of 90 is allowed; the Story says plainly when it is far off."]],
    answers: ["How far am I from 80?", "At this pace, when would we get there?"],
    nonAnswers: ["What will happen? (Not a forecast.)", "What should we change? (Actions)", "Is the change real? (No significance test exists.)"],
    open: [["Minimum rounds", "Should it need four or more rounds before it shows an estimate?"], ["Saving a target", "Does a target belong to the report, the widget or the reader?"]],
  },
});
export default Page;
