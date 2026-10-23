import { makeWidgetDoc, findOne } from "../widgetDoc.jsx";

const card = { id: "card", name: "Card", note: "The shared widget shell.", find: (r) => [r.querySelector("[data-widget-id] > div")] };
const header = { id: "header", name: "Header", note: "The title.", find: findOne('[data-part="widget-header"]') };
const trend = { id: "trend", name: "Trend pill", note: "Change since the round before.", find: findOne('[data-part="trend"]') };
const graph = { id: "graph", name: "Line graph", note: "Fixed 0 to 100 axis, one point per round.", find: findOne('[data-part="graph"]') };

export const { meta, toc, Page } = makeWidgetDoc({
  id: "widget-score-history", familyId: "score-history", name: "Score History",
  blurb: "One score across every round, as a line, with the change since the round before. The 2x2 adds one sentence saying how it moved.",
  source: "components/widgets/WidgetBody.jsx (case \"score-history\") · widgets/GraphInsight.jsx",
  purpose: {
    does: "answers “which way is it heading?” for the overall score: every round on a fixed scale, the latest change, and (2x2) a sentence saying how it moved.",
    boundary: "one measure, one population. It doesn't explain the movement or show parts; the Scope does. It follows the Graph insight rules (docs/widget-insight-rules.md).",
    where: "the Org report, the Library's “Score over time” group, and the Widget Builder's History form for any topic.",
  },
  forms: ["Every round as a line on a 0 to 100 axis (gridlines every 20), the change pill centred above, and one sentence below.", "Up to three rounds on a 0 / 50 / 100 axis, with the caret pill inside the plot's corner."],
  anatomy: [
    { form: 0, parts: [card, header, trend, graph, { id: "caption", name: "Caption", note: "One sentence, two lines at most.", find: findOne('[data-part="caption"]') }] },
    { form: 1, parts: [card, header, graph, trend] },
  ],
  spec: [
    ["Graph", "Axis", "Fixed 0 to 100, never zoomed. 28px between ticks: 0 / 50 / 100 on the 1x1, every 20 on the 2x2. Tick labels 11px, text/quaternary."],
    ["", "Line", "1px, text/primary; 8px markers with a 1px white ring; round labels under the plot, the latest in bold."],
    ["", "Limits", "1x1 up to 3 rounds, 2x2 up to 7 (Graph rules). More rounds send the reader to the Scope rather than squeezing."],
    ["Trend pill", "2x2", "Centred above the graph: caret, signed number, “since last round”."],
    ["", "1x1", "Caret only, inside the plot's right corner: at the top, or the bottom when the latest point is high, so it never covers the line."],
    ["Caption", "Text", "2x2 only. 14px / 1.4, text/secondary, two lines at most, pinned to the bottom. The change is bold in its status text colour."],
  ],
  behaviour: [
    ["Hover a round (2x2)", "A dashed guide and a tooltip: that round's score and its change from the round before."],
    ["Click (on a report)", "Opens the Score History Scope."],
    ["Change Widget", "Swaps between the 2x2 and the 1x1."],
  ],
  opens: {
    what: "the Score History Scope: the same score with every Explorer's movement behind it.",
    stories: [["Insight Summary", "insight-summary"], ["Score History (rounds and Explorer changes)", "trend"], ["Score Meaning", "score-meaning"], ["Methodology", "methodology"]],
  },
  states: [
    ["Rising, falling, flat", "The caption names the shape: “increased by +3 points since R2”, “fell by…”, “held at…”. After a dip it says so."],
    ["One round", "Not offered: a history needs two points."],
    ["A round not asked or suppressed", "A gap in the line, never a zero."],
    ["More rounds than the size allows", "The latest rounds that fit; the Scope has them all."],
  ],
  content: [
    ["Caption", "Plain past tense, the change in points with its sign, the latest score bold. No em dashes."],
    ["Round names", "Finding: the caption says “R2” while the axis says the month. Use the round's label (“Jun 2025”) in both; the caption is built in code today (historyCaption) and should come from a Content template."],
  ],
  a11y: [
    "The caption carries the graph's meaning in words; the SVG can be hidden from screen readers on the 2x2. The 1x1 needs an accessible description (“57, up 3 since Jun 2025”).",
  ],
  done: [
    "The axis is always 0 to 100, never zoomed.",
    "The 1x1 never shows more than 3 rounds; the 2x2 never more than 7.",
    "The caption and the pill agree with the last two points.",
    "A missing round is a gap, not a drop to zero.",
  ],
});
export default Page;
