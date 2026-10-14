import { MethodologyStory } from "../../scope/stories/SummaryStories.jsx";
import { CoverageStory } from "../../scope/stories/ExtraStories.jsx";
import { EMPLOYEE_COUNT } from "../../../lib/dataset.js";
import { makeDoc, cardCheck, q, qa, rect, type, css, px } from "./storyDoc.jsx";
import { lightHexOf } from "../docKit.jsx";
import { T, tok } from "../docParts.jsx";

const M = (kind) => () => <MethodologyStory kind={kind} />;

export const { meta, toc, Page } = makeDoc({
  id: "methodology", name: "Insight & Methodology", kind: "Insight & Methodology",
  blurb: "What a measure is, why it's useful, what feeds it, how it's worked out, and how its ranges work. It explains the measure, never the reader's score.",
  source: "components/scope/stories/SummaryStories.jsx (MethodologyStory) · ExtraStories.jsx (CoverageStory)", figma: "13622:37419",
  purpose: {
    does: "explains what the insight measures, why it's useful, what data or answers are used, how the value is calculated, how scores, ranges or categories work, and any important assumptions or limitations.",
    contains: "the purpose of the measure, data inputs, calculation method, score ranges, assumptions, limitations, and supporting methodology.",
    boundary: "this Story explains the measure itself. It does not interpret the reader's current score or tell them what action to take.",
    where: "most Scopes end with one (score, status, eNPS or time); the Widget Builder's default Scope includes it.",
  },
  forms: [
    { id: "form-status", name: "Status ranges", shows: "The three status ranges as coloured pills, each with what it means.", when: "The reader sees a status word and needs its definition.", render: M("status") },
    { id: "form-health-short", name: "Health Age, short", shows: "One paragraph on what Health Age is.", when: "Above a Health Age result.", render: M("healthAge") },
    { id: "form-health-long", name: "Health Age, long", shows: "How Health Age works, with referenced claims and Read more.", when: "In the deeper layer of a Health Age Scope.", render: M("healthAgeLong") },
    { id: "form-dass", name: "DASS", shows: "How the Depression, Anxiety and Stress result is calculated.", when: "With Mental Well-Being.", render: M("dass") },
    { id: "form-score", name: "Score", shows: "How a ProScore is worked out from answers to Drivers to Explorers.", when: "Any score Scope.", render: M("score") },
    { id: "form-enps", name: "eNPS", shows: "How eNPS is worked out.", when: "With eNPS.", render: M("enps") },
    { id: "form-coverage", name: "Who Answered", shows: "How many took part each round, and the 5-person privacy rule.", when: "Readers ask how representative a result is.", render: () => <CoverageStory /> },
  ],
  spec: [
    ["Card", "Shell", "The Story card: 808px, 18px radius, 16px padding, 16px gap. Title Text lg / Bold."],
    ["Body", "Text", <span key="b">Text sm {T("text/tertiary")}; paragraphs 14px apart. Footnote references are superscript (9px).</span>],
    ["Status", "Lead", "“SHAPE ProScores run from 0 to 100.” in bold, then the rest of the sentence; 8px to the first range."],
    ["", "Range pill", <span key="p">Text sm / Medium, 4px / 8px, radius 46. Flourishing {tok("utility/Likert/V Good Subtle")} with {T("status/success/text-indicator")}; Striving {T("status/warning/bg")} with {T("status/warning/text-indicator")}; Struggling {tok("utility/Likert/Very Bad Subtle")} with {T("status/error/text")}. 8px to its meaning; 8px between ranges.</span>],
    ["Health Age, long", "Read more", <span key="r">The 36px outlined pill: Text sm, 16 + 2px sides, 1px {T("button/brand/secondary/border/default")}.</span>],
  ],
  content: [
    ["Titles", "“How Your Status Is Determined”, “How Health Age Works”, “How the Result Is Calculated”: title case (the DASS frame is sentence case; flagged)."],
    ["No em dashes", "The DASS paragraph's “– DASS for short –” became “(DASS for short)”."],
    ["Explain, don't interpret", "Never “your score means…”: that's Score Meaning. Never “you should…”: that's Actions."],
    ["Claims need sources", "Health Age's figures (ten years, 5 years, 27 years) carry footnotes; the Citation Story lists them."],
  ],
  a11y: ["Pills carry the status word and range as text; colour is never the only signal.", "Superscript references are real <sup> elements; their sources belong in a Citation Story beside this one."],
  props: [
    { name: "MethodologyStory.kind", type: "\"status\" | \"score\" | \"enps\" | \"time\" | \"dass\" | \"healthAge\" | \"healthAgeLong\"", required: true, desc: "Which measure to explain." },
    { name: "CoverageStory", type: "-", desc: "Who answered: no props, reads the dataset." },
  ],
  usage: `<MethodologyStory kind="status" />\n<MethodologyStory kind="healthAgeLong" />`,
  usageNote: "Copy lives in METHOD and STATUS_ROWS in SummaryStories.jsx so one edit changes every Scope.",
  done: ["Body text is Text sm, text/tertiary, paragraphs 14px apart.", "Status pills use the status tints and text colours.", "Health Age's references are superscript and sourced.", "No form interprets the reader's score."],
  parity: [
    { title: "Status ranges (13691:52353)", render: M("status"), checks: [
      ...cardCheck("13691:52353", "808 × 304"),
      { part: "Lead and body: type · colour", node: "13691:52359", figma: "14/20 · 400 · #7c7879", read: (r) => { const p = q(r, '[data-part="method-text"]'); return `${type(p)} · ${lightHexOf(p, ["color"])}`; } },
      { part: "Flourishing pill: fill · text", node: "13691:52361", figma: "#d3f2e3 · #0b703f", mapped: "text #009638 in the design, not a token", read: (r) => { const p = q(r, '[data-part="status-pill"]'); return `${lightHexOf(p, ["background"])} · ${lightHexOf(p, ["color"])}`; } },
      { part: "Striving pill: fill · text", node: "13691:52365", figma: "#fff6e4 · #d98d0b", read: (r) => { const p = qa(r, '[data-part="status-pill"]')[1]; return `${lightHexOf(p, ["background"])} · ${lightHexOf(p, ["color"])}`; } },
      { part: "Struggling pill: fill · text", node: "13691:52369", figma: "#fcd7dd · #cc2944", read: (r) => { const p = qa(r, '[data-part="status-pill"]')[2]; return `${lightHexOf(p, ["background"])} · ${lightHexOf(p, ["color"])}`; } },
      { part: "Pill: type · padding · radius", node: "13691:52361", figma: "14 · 500 · 4/8 · 46", read: (r) => { const p = q(r, '[data-part="status-pill"]'); return `${px(css(p).fontSize)} · ${css(p).fontWeight} · ${px(css(p).paddingTop)}/${px(css(p).paddingLeft)} · ${px(css(p).borderTopLeftRadius)}`; } },
    ] },
    { title: "Health Age, long (13622:37420)", render: M("healthAgeLong"), checks: [
      ...cardCheck("13622:37420", null),
      { part: "Read more: height · border · type", node: "13622:37428", figma: "36 · 1 #231f20 · 14/20 · 400", read: (r) => { const b = q(r, '[data-part="story-button"]'); return `${Math.round(rect(b).height)} · ${px(css(b).borderTopWidth)} ${lightHexOf(b, ["border"])} · ${type(b)}`; } },
    ] },
  ],
  owner: [
    "Decisions for you. (1) The status pill's green (#009638) isn't a design-system token; built with the success text-indicator (#0B703F). (2) The DASS title is sentence case (“How the result is calculated”); built title case. (3) Health Age's figures need their sources in a Citation Story beside it; the frame's footnotes point nowhere. (4) Health Age itself is blocked (no ages in the data), so its two Methodology forms are documented but no Scope shows them yet. (5) Copy edits: em dashes removed, “behaviors” → “behaviours” (UK English), the last line given its full stop.",
  ],
  researcher: {
    lead: "A number is only as useful as knowing how it was made.",
    story: ["Methodology tells a reader what a measure is, what feeds it, and how its ranges work, so they can judge it before they act on it. It deliberately says nothing about their own result."],
    idea: "The other Stories say what the score is. This one says what a score is.",
    facts: [["Question it answers", "How was it worked out?"], ["Data used", "None", "Except Who Answered, which counts respondents."], ["Respondents", `${EMPLOYEE_COUNT}`, "Synthetic data."]],
    feeds: [["Status ranges", "The fixed cut-offs: Flourishing 80 to 100, Striving 60 to 79, Struggling 0 to 59."], ["Score method", "Answers to Drivers (mean), Drivers to Explorers (mean), Explorers to overall."], ["DASS", "The Depression, Anxiety and Stress Driver scores; the Psychological Explorer takes the worst of the three."], ["Who Answered", "Respondents per round against headcount, and how many groups are hidden by the 5-person rule."]],
    limits: [["Fixed cut-offs.", "59 and 60 read as different statuses though they're practically the same."], ["Equal weights.", "Every Driver counts the same in its Explorer; no weighting by importance."], ["DASS here isn't the clinical DASS.", "The prototype's severity bands are an assumption, not the published DASS-21 scoring."]],
    answers: ["What does this measure?", "How is it calculated?", "What do the ranges mean?"],
    nonAnswers: ["What does my score mean? (Meaning)", "What should I do? (Actions)", "Where's the evidence? (Citation)"],
    open: [["80 / 60 or other cut-offs?", "The ranges are product decisions; their basis should be stated."], ["Clinical review", "DASS and Health Age copy needs specialist sign-off."]],
  },
});
export default Page;
