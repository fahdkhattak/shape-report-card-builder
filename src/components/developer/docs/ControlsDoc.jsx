import { useState, useEffect } from "react";
import { ds, dsBorder, dsSpace, dsRadius } from "../../../lib/ds.js";
import { overallSubject } from "../../../lib/scopeSubject.js";
import { CompareControl, useCompare, ViewSwitch, CopyTable, ShareGuidance, PillTabs, FiltersControl } from "../../scope/stories/controls.jsx";
import BreakdownStory from "../../scope/stories/BreakdownStory.jsx";
import { makeDoc, q, qa, rect, size, type, css, px } from "./storyDoc.jsx";
import { lightHexOf } from "../docKit.jsx";
import { T } from "../docParts.jsx";

/* ================================================================== */
/* CONTROLS: the Controls/Functions slot every Story shares (Figma       */
/* 13622:39531). Each demo is the real control from controls.jsx, alone  */
/* on a card, then once in context inside a live Breakdown Story.        */
/* ================================================================== */
const subject = overallSubject();
const SAMPLE_TABLE = "Explorer\tScore\tChange from previous round\nPhysical Health\t72\t+3\nPsychological Health\t58\t-2";

const Bar = ({ children }) => (
  <div data-part="controls-demo" style={{ background: ds.surface.general.card, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.widget, padding: dsSpace[16] - dsBorder.sm, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: dsSpace[12] }}>{children}</div>
);

function CompareDemo({ on = false }) {
  const cmp = useCompare();
  useEffect(() => { if (on) cmp.setOn(true); }, [on]); // runs once: `on` never changes for a demo
  return <Bar><CompareControl cmp={cmp} /></Bar>;
}
function TabsDemo() {
  const [a, setA] = useState("People"), [b, setB] = useState("Feeling Low");
  return (
    <Bar>
      <PillTabs label="Group by" tabs={["People", "Organisation", "Employment", "Locations"]} value={a} onChange={setA} />
      <PillTabs label="Measure" tone="default" tabs={["Feeling Low", "Feeling Anxious", "Feeling Stressed"]} value={b} onChange={setB} />
    </Bar>
  );
}
function ViewDemo() {
  const [v, setV] = useState("chart");
  return <Bar><ViewSwitch view={v} onChange={setV} /></Bar>;
}
function FilterDemo() {
  const [v, setV] = useState(["Flourishing", "Striving", "Struggling"]);
  return <Bar><FiltersControl value={v} onChange={setV} /></Bar>;
}
const ShareDemo = () => <Bar><ShareGuidance label="Share this guidance" getText={() => "Three things you can try this week…"} /></Bar>;
const CopyDemo = () => <Bar><CopyTable getText={() => SAMPLE_TABLE} /></Bar>;
const InContext = (view) => () => <BreakdownStory items={subject.children} variant="bars" noun={subject.childNoun} initialView={view} />;

/* Text widths differ by a fraction of a pixel between Figma and the browser, so widths are compared within 1px (shown as ±1). */
const near = (figma, got) => (figma.length === got.length && figma.every((v, i) => Math.abs(v - got[i]) <= 1) ? `${figma.join(" · ")} (±1)` : got.join(" · "));
const widths = (els) => els.map((e) => Math.round(rect(e).width));
const wh = (el, w) => `${near([w], [Math.round(rect(el).width)])} × ${Math.round(rect(el).height)}`;
const btn = (r, i = 0) => qa(r, '[data-part="controls-demo"] button')[i];

export const { meta, toc, Page } = makeDoc({
  id: "controls", name: "Controls", group: "Components", kind: "Controls",
  blurb: "The small controls in a Story's top-right slot: compare with a previous round, tabs, chart or table, copy, share and filter. Each acts on its own Story only.",
  source: "components/scope/stories/controls.jsx", figma: "13622:39531",
  purpose: {
    does: "lets the reader change how one Story shows its data (another round, another group, chart or table, fewer statuses) or take it away (copy, share).",
    contains: "Compare Previous Rounds, Tabs, Chart View / Table View, Copy Table, Share and Filters.",
    boundary: "every control affects only the Story it sits in. Changing the round for the whole Scope Pane or report is the header's round selector, not this.",
    extra: [
      "Which Story shows which control is decided per family (Breakdown's bars have Filters and Table View; the table adds Compare, Chart View and Copy Table; Trend never shows Compare because it already shows every round).",
      "Chart View is the default on desktop. Table View replaces the chart with the same data in rows, never more or less.",
    ],
    where: "the top-right of almost every Story, and the Actions layer's Share.",
  },
  forms: [
    { id: "form-compare", name: "Compare Previous Rounds", shows: "A label and a 36 × 20 toggle; on, a round picker appears beside it.", when: "A Story shows one round and an earlier one helps.", render: () => <CompareDemo />, states: [{ title: "Off", render: () => <CompareDemo /> }, { title: "On", note: "The most recent comparable round is chosen by default; the reader can pick another.", render: () => <CompareDemo on /> }] },
    { id: "form-tabs", name: "Tabs", shows: "One pill holding the options; the chosen one filled.", when: "A Story has two to five views of the same kind (groupings, measures).", render: () => <TabsDemo /> },
    { id: "form-view", name: "Chart View / Table View", shows: "One ghost button naming the view you'd switch to.", when: "Any Story with a chart and a table of the same data.", render: () => <ViewDemo /> },
    { id: "form-copy", name: "Copy Table", shows: "A ghost button; after copying, “Table copied.” beside it.", when: "Table View is showing.", render: () => <CopyDemo /> },
    { id: "form-share", name: "Share", shows: "A ghost button that copies the guidance; confirms beside it.", when: "Guidance a reader may pass on (Actions).", render: () => <ShareDemo /> },
    { id: "form-filter", name: "Filters", shows: "A ghost button opening a status checklist; the count of hidden statuses in its label.", when: "A ranked list long enough to want narrowing.", render: () => <FilterDemo /> },
    { id: "form-context", name: "In a Story", shows: "The controls in place on a live Breakdown: Filters and Table View on the chart; Compare, Chart View and Copy Table on the table.", when: "Reference for how they sit together.", render: InContext("chart"), states: [{ title: "Chart showing", render: InContext("chart") }, { title: "Table showing", note: "Turn on Compare to add the earlier round as a column.", render: InContext("table") }] },
  ],
  spec: [
    ["Row", "Layout", "Top-right of the Story's title row, 8px apart, wrapping under the title on a narrow card."],
    ["Ghost button", "Shell", <span key="g">24px tall, fully rounded, 4px / 6px padding, 6px icon gap; transparent, {T("button/brand/ghost/bg/hover")} on hover.</span>],
    ["", "Content", <span key="c">16px icon in {T("button/brand/ghost/items/default icon")}; Text 2xs (12/16) in {T("button/brand/ghost/items/default text")} with 2px text padding.</span>],
    ["Compare", "Toggle row", "24px tall, 2px / 6px padding, label then toggle 8px apart."],
    ["", "Toggle", <span key="t">36 × 20, 2px padding, fully rounded, 16px knob. On: {T("toggle/active/primary")} track, knob slides right on a spring. Off: {T("toggle/inactive/primary")}.</span>],
    ["", "Round picker", "Shown only when on and there's more than one earlier round. Text xs, radius/sm."],
    ["Tabs", "Pill", <span key="p">{T("bg/primary")} track, fully rounded, 24px tall. Each tab 4px / 8px, Text 2xs. Chosen: filled {T("button/brand/primary/bg/active")} (or bg/default, see owner notes), light text; others ghost text.</span>],
    ["Copy / Share", "Confirmation", <span key="k">Text 2xs in {T("status/success/text-indicator")} beside the button for about 2 seconds: “Table copied.” / “Guidance copied.”; on failure “Couldn't copy” in the error colour.</span>],
    ["Filters", "Popover", <span key="f">Under the button, right-aligned, min 180px, {T("surface/General/popover")}, radius/lg, shadow-md, one checkbox per status.</span>],
  ],
  responsive: "Controls never shrink: the row wraps under the title on a narrow card, and Tabs wrap or narrow inside their Story (see each Story's page).",
  content: [
    ["Labels", "Title case on buttons: “Table View”, “Copy Table”. Sentence case on the toggle label: “Compare previous rounds”, as designed."],
    ["Confirmations", "Short, with a full stop: “Table copied.”"],
    ["Changes", "Written as values, not just colours: “Up 4 since Round 2”."],
  ],
  a11y: [
    "The toggle is a real switch (role=switch, aria-checked) labelled “Compare previous rounds”.",
    "Tabs are a tablist; each tab is a tab with aria-selected.",
    "Copy confirmations are announced (aria-live=polite), and only claim success when the browser accepted the copy.",
    "Filters says how many statuses are hidden in its own label, so the narrowing is never silent.",
  ],
  props: [
    { name: "CompareControl.cmp", type: "useCompare()", required: true, desc: "{ on, setOn, idx, setIdx, refIdx }: refIdx is the round to compare with (the previous one until the reader picks)." },
    { name: "PillTabs", type: "{ tabs, value, onChange, label, tone }", desc: "tone \"active\" (#504c4d) or \"default\" (#231f20)." },
    { name: "ViewSwitch", type: "{ view: \"chart\" | \"table\", onChange }", desc: "Names the view you'd switch to." },
    { name: "CopyTable / ShareGuidance", type: "{ getText, label? }", desc: "getText returns plain, tab-separated text, built when clicked." },
    { name: "FiltersControl", type: "{ value: string[], onChange }", desc: "The statuses shown." },
  ],
  usage: `const cmp = useCompare();\n<CompareControl cmp={cmp} />\n<ViewSwitch view={view} onChange={setView} />\n{view === "table" && <CopyTable getText={() => tableText(columns, rows)} />}`,
  done: [
    "Every control changes only its own Story.",
    "Compare picks the most recent previous round, lets the reader choose another, and labels both values; off restores the original view.",
    "No Compare inside a Trend Story.",
    "Table View shows the same data as the chart and its hovers; Copy Table copies all of it, headings included, tab-separated.",
    "Copy and Share confirm in text.",
  ],
  parity: [
    { title: "Compare Previous Rounds (13622:39536)", render: () => <CompareDemo on />, checks: [
      { part: "Toggle row: size", node: "13622:39536", figma: "195 (±1) × 24", read: (r) => wh(q(r, '[data-part="controls-demo"] label'), 195) },
      { part: "Label: type · colour", node: "13622:39539", figma: "12/16 · 400 · #3a3737", read: (r) => { const l = q(r, '[data-part="controls-demo"] label'); return `${type(l)} · ${lightHexOf(l, ["color"])}`; } },
      { part: "Toggle: size · radius", node: "13622:39541", figma: "36 × 20 · 9999", read: (r) => { const s = q(r, '[role="switch"]'); return `${size(s)} · ${px(css(s).borderTopLeftRadius) >= 10 ? 9999 : px(css(s).borderTopLeftRadius)}`; } },
      { part: "Toggle on: track · knob", node: "13622:39541", figma: "#231f20 · #ffffff", read: (r) => { const s = q(r, '[role="switch"]'); return `${lightHexOf(s, ["background"])} · ${lightHexOf(s.firstChild, ["background"])}`; } },
    ] },
    { title: "Tabs (13622:39551)", render: () => <TabsDemo />, checks: [
      { part: "Tab widths", node: "13622:39552", figma: "54 · 85 · 85 · 68 (±1)", read: (r) => near([54, 85, 85, 68], widths(qa(q(r, '[data-part="pill-tabs"]'), "button"))) },
      { part: "Tab height · type", node: "13622:39553", figma: "24 · 12/16 · 400", read: (r) => { const b = q(r, '[data-part="pill-tabs"] button'); return `${Math.round(rect(b).height)} · ${type(b)}`; } },
      { part: "Second set: widths", node: "13622:39571", figma: "80 · 101 · 106 (±1)", read: (r) => near([80, 101, 106], widths(qa(qa(r, '[data-part="pill-tabs"]')[1], "button"))) },
    ] },
    { title: "Ghost buttons (13622:39589 · 39591 · 39600 · 39534)", render: () => <><FilterDemo /><ViewDemo /><CopyDemo /><ShareDemo /></>, checks: [
      { part: "Filters: size", node: "13622:39589", figma: "72 (±1) × 24", read: (r) => wh(btn(r, 0), 72) },
      { part: "Table View: size", node: "13622:39595", figma: "97 (±1) × 24", read: (r) => wh(btn(r, 1), 97) },
      { part: "Copy Table: size", node: "13622:39600", figma: "98 (±1) × 24", read: (r) => wh(btn(r, 2), 98) },
      { part: "Share: size", node: "13622:39534", figma: "158 × 24", mapped: "Figma's Share uses 4/12 padding and an 8px gap; the others use 4/6 and 6. Built like the others.", read: (r) => size(btn(r, 3)) },
      { part: "Label: type · colour", node: "13622:39534", figma: "12/16 · 400 · #3a3737", read: (r) => { const b = btn(r, 0); return `${type(b.lastChild)} · ${lightHexOf(b, ["color"])}`; } },
    ] },
  ],
  owner: [
    "Decisions for you. (1) Share's button is wider than its siblings (12px sides and an 8px gap against 6 and 6); built to match the others so the row reads as one set. (2) The two tab sets use different fills for the chosen tab (#504c4d and #231f20); both are kept via PillTabs' `tone` until one is picked. (3) Filters' button is drawn but not what it opens; it's a status checklist here. (4) The round picker that appears when Compare is on isn't drawn; it's a plain select for now. (5) Share copies the guidance as text; a real share sheet (link, email) isn't designed.",
  ],
});
export default Page;
