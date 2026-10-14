import { CitationStory } from "../../scope/stories/AddOnStories.jsx";
import { makeDoc, q, rect, type, css, px } from "./storyDoc.jsx";
import { lightHexOf } from "../docKit.jsx";
import { T } from "../docParts.jsx";

/* The design's own sources (13622:40148), used as the sample. */
const CITES = [
  { text: "Gallup, Inc. “How to Improve Employee Engagement in the Workplace.” Gallup.com. Gallup, January 18, 2022.", url: "https://www.gallup.com/workplace/285674/improve-employee-engagement-workplace.aspx" },
  { text: "Foster, Sarah. “Survey: 55% Expecting to Search for a New Job over the next 12 Months.” Bankrate, 2021.", url: "https://www.bankrate.com/personal-finance/job-seekers-survey-august-2021/" },
  { text: "“A Report from the Economist Intelligence Unit ...” Accessed February 2, 2022.", url: "https://impact.economist.com/perspectives/sites/default/files/EIU_Lucidchart-Communication%20barriers%20in%20the%20modern%20workplace.pdf" },
  { text: "Adkins, Amy, and Jim Harter. “Employees Want a Lot More from Their Managers.” Gallup.com. Gallup, November 20, 2021.", url: "https://www.gallup.com/workplace/236570/employees-lot-managers.aspx" },
];
const C = (open) => () => <CitationStory cites={CITES} defaultOpen={open} />;

export const { meta, toc, Page } = makeDoc({
  id: "citation", name: "Citation", kind: "Citation",
  blurb: "The evidence and sources behind an insight, its methodology, interpretation or guidance, collapsed until the reader asks for them.",
  source: "components/scope/stories/AddOnStories.jsx (CitationStory) · ActionStories.jsx (CitationsCard)", figma: "13622:40136",
  purpose: {
    does: "shows the evidence and sources supporting the insight, methodology, interpretation, or guidance.",
    contains: "research papers, datasets, frameworks, publications, and source links.",
    boundary: "sources must be traceable and connected to the claims they support. Citations do not replace the Insight and Methodology Story.",
    extra: ["One component, two states: closed (a 56px bar) and open (a hairline, then each source). The Actions layer uses the same card under Love Science."],
    where: "after Methodology or Love Science, wherever a claim has a footnote. Not addable from the catalogue until real sources exist.",
  },
  forms: [
    { id: "form-closed", name: "Closed", shows: "The title and a chevron.", when: "The default: sources are there for whoever wants them.", render: C(false) },
    { id: "form-open", name: "Open", shows: "A hairline, then each source numbered with its link.", when: "After the reader opens it.", render: C(true) },
  ],
  spec: [
    ["Card", "Shell", "The Story card: 808px, 18px radius, 16px padding, 16px gap. Closed it's 56px tall."],
    ["Header", "Title", <span key="h">“Citations”, Text sm / Bold {T("text/secondary")}; a 16px chevron in a 40 × 24 ghost button at the right (down closed, up open).</span>],
    ["Open", "Sources", <span key="s">A 1px {T("border/tertiary")} hairline, then each source as Text sm {T("text/secondary")} with its link in {T("text/primary")}, 14px apart, numbered with a superscript.</span>],
  ],
  responsive: "Long URLs wrap anywhere so they never push the card wider.",
  content: [["Numbering", "Superscript numbers match the footnotes in the Story they support."], ["Format", "Author. “Title.” Publisher, date. URL."], ["Links", "Open in a new tab."]],
  a11y: ["The toggle uses aria-expanded and says what it does (Show / Hide citations).", "Links are real links with their URL as text."],
  props: [
    { name: "cites", type: "[{ text, url? }]", required: true, desc: "The sources, in footnote order." },
    { name: "defaultOpen", type: "boolean", def: "false", desc: "Start open." },
  ],
  usage: `<CitationStory cites={[{ text: "Gallup… 2022.", url: "https://…" }]} />`,
  done: ["Closed by default, 56px.", "Open: hairline, then numbered sources 14px apart, links in text/primary.", "Every footnote in the Scope has a source here."],
  parity: [
    { title: "Closed (13622:40137)", render: C(false), checks: [
      { part: "Card size", node: "13622:40137", figma: "808 × 56", read: (r) => { const c = q(r, "[data-story]"); return `${Math.round(rect(c).width)} × ${Math.round(rect(c).height)}`; } },
      { part: "Title: type · colour", node: "13622:40140", figma: "14/20 · 700 · #504c4d", read: (r) => { const t = q(r, "[data-story] p"); return `${type(t)} · ${lightHexOf(t, ["color"])}`; } },
    ] },
    { title: "Open (13622:40142)", render: C(true), checks: [
      { part: "Source text: type", node: "13622:40148", figma: "14/20 · 400", read: (r) => type(q(r, "[data-story] li")) },
      { part: "Gap between sources", node: "13622:40148", figma: "14", read: (r) => px(css(q(r, "[data-story] ol")).rowGap) },
    ] },
  ],
  owner: ["Decisions for you. (1) The frame's sources are placeholders about engagement, not tied to any SHAPE claim; the catalogue keeps the Story blocked until real, traceable sources exist. (2) The frame's text is #4D4D4D (not a token), built as text/secondary. (3) The last source ends in a stray “]” in the frame; dropped."],
  researcher: {
    lead: "Every claim should be checkable.",
    story: ["Citations let a reader check where a claim came from. They sit closed so they never crowd the result, and open on request."],
    idea: "If we say it, we can show where it came from.",
    facts: [["Question it answers", "Where's it from?"], ["Data used", "None"], ["Default", "Closed"]],
    feeds: [["Sources", "Each claim's reference, written by the content author."]],
    limits: [["A source isn't a guarantee.", "Citing a study doesn't make it apply to this organisation."], ["Sources age.", "Links break and findings get revised; they need checking."]],
    answers: ["Where did this claim come from?"],
    nonAnswers: ["How was my score worked out? (Methodology)"],
    open: [["Who owns sources?", "Content team, research, or the creator?"], ["Link checking", "How often are links verified?"]],
  },
});
export default Page;
