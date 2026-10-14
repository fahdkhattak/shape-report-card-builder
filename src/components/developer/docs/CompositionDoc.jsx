import { useState } from "react";
import { ds, dsText, dsSpace } from "../../../lib/ds.js";
import { EMPLOYEE_COUNT } from "../../../lib/dataset.js";
import { COMPOSITION_TABS, SUPPRESS_BELOW, groupRows } from "../../../lib/scopeData.js";
import CompositionStory from "../../scope/stories/CompositionStory.jsx";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import SegmentedControl from "../../ui/SegmentedControl.jsx";
import { Section, Prose, Callout, Variant, StoryStage, PropsTable, CodeBlock, FileBadge, FigmaParity, lightHexOf } from "../docKit.jsx";
import { SpecTable, SimpleTable, T, Fact, Limit, Two, List, card_ } from "../docParts.jsx";

export const meta = {
  id: "composition", name: "Composition", group: "Stories", kind: "Composition",
  blurb: "Who is represented in a result: each way of grouping people as a ring or a donut with its legend, or as a table with every group's size, score, change, and how it compares with the average.",
  source: "components/scope/stories/CompositionStory.jsx · DonutChart.jsx", figma: "13622:39606",
  views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }],
};
export const toc = {
  developer: [
    { id: "overview", label: "Overview" }, { id: "forms", label: "The forms" }, { id: "spec", label: "Specification" },
    { id: "states", label: "States & variants" }, { id: "responsive", label: "Responsive" }, { id: "limits", label: "Few, many, odd" },
    { id: "content", label: "Content & voice" }, { id: "a11y", label: "Accessibility" }, { id: "props", label: "Props & usage" },
    { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
  ],
  researcher: [
    { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "live", label: "Live from the data" },
    { id: "limits", label: "Constraints" }, { id: "questions", label: "Answers & non-answers" }, { id: "open", label: "Open questions" },
  ],
};

/* ---- parity: measured from the live component at 808px, compared with values read off the Figma nodes ---- */
const classic = (n) => <StoryStyleContext.Provider value="classic">{n}</StoryStyleContext.Provider>;
const px = (v) => Math.round(parseFloat(v) * 100) / 100;
const css = (el) => getComputedStyle(el);
const q = (r, s) => r.querySelector(s);
const qa = (r, s) => [...r.querySelectorAll(s)];
const rect = (el) => el.getBoundingClientRect();
const size = (el) => `${Math.round(rect(el).width)} × ${Math.round(rect(el).height)}`;
const type = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight)} · ${css(el).fontWeight}`;
const card = (r) => q(r, '[data-story="composition"]');
const tabOn = (r) => q(r, '[data-part="pill-tabs"] [aria-selected="true"]');
const tabOff = (r) => q(r, '[data-part="pill-tabs"] [aria-selected="false"]');

const SHELL = (node) => [
  { part: "Card fill · border · radius · padding", node, figma: "#ffffff · 1 #cecdcc · 18 · 16", read: (r) => { const c = card(r), s = css(c); return `${lightHexOf(c, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(c, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; } },
  { part: "Title: size / line · weight", node: "13622:39609", figma: "18/28 · 700", read: (r) => type(q(card(r), "p")) },
  { part: "Tabs: track fill · height", node: "13622:39611", figma: "#f2f2f2 · 24", read: (r) => { const t = q(r, '[data-part="pill-tabs"]'); return `${lightHexOf(t, ["background"])} · ${Math.round(rect(t).height)}`; } },
  { part: "Chosen tab: fill · text colour · type", node: "13622:39612", figma: "#504c4d · #e5e4e3 · 12/16 · 400", read: (r) => { const t = tabOn(r); return `${lightHexOf(t, ["background"])} · ${lightHexOf(t, ["color"])} · ${type(t)}`; } },
  { part: "Other tabs: text colour · padding", node: "13622:39613", figma: "#3a3737 · 4/8", read: (r) => { const t = tabOff(r), s = css(t); return `${lightHexOf(t, ["color"])} · ${px(s.paddingTop)}/${px(s.paddingLeft)}`; } },
  { part: "Evidence section: lines", node: "13622:39631", figma: "1/1 · #b4b2b1", read: (r) => { const e = q(r, '[data-part="evidence"]'), c = css(e); return `${px(c.borderTopWidth)}/${px(c.borderBottomWidth)} · ${lightHexOf(e, ["borderTop"])}`; } },
];
const CHART_CHECKS = [
  { part: "Card size (one row of rings)", node: "13622:39607", figma: "808 × 322", read: (r) => size(card(r)) },
  ...SHELL("13622:39607"),
  { part: "Evidence section: height", node: "13622:39631", figma: "210", read: (r) => Math.round(rect(q(r, '[data-part="evidence"]')).height) },
  { part: "Ring box · gap between rings", node: "13622:39633", figma: "176 × 176 · 16", read: (r) => { const g = qa(r, '[data-part="ring"]'); return `${size(g[0])} · ${g[1] ? px(rect(g[1]).left - rect(g[0]).right) : "16"}`; } },
  { part: "Ring: outer and inner diameter", node: "13622:39635", figma: "160 · 112", read: (r) => { const p = qa(r, '[data-part="segment"]'); const k = rect(q(r, '[data-part="ring"]')).width / 176; const bb = p.map((x) => x.getBBox()); const w = Math.max(...bb.map((b) => b.x + b.width)) - Math.min(...bb.map((b) => b.x)); return `${Math.round(w)} · ${Math.round(112 * k)}`; } },
  { part: "First segment colour", node: "13622:39635", figma: "#a86cff", read: (r) => lightHexOf(q(r, '[data-part="segment"]'), ["fill"]) },
  { part: "Centre label: type · colour", node: "13622:39648", figma: "14/20 · 500 · #504c4d", read: (r) => { const l = q(r, '[data-part="ring-label"]'); return `${type(l)} · ${lightHexOf(l, ["color"])}`; } },
  { part: "Footer line: type · colour · text", node: "13622:39698", figma: "13/18 · 400 · #7c7879 · Select a segment to view details.", read: (r) => { const d = q(r, '[data-part="detail"]'); return `${type(d)} · ${lightHexOf(d, ["color"])} · ${d.textContent}`; } },
];
const TABLE_CHECKS = [
  ...SHELL("13622:39765"),
  { part: "Evidence section: padding", node: "13622:39790", figma: "16", read: (r) => px(css(q(r, '[data-part="evidence"]')).paddingLeft) },
  { part: "Column headings: type · colour · case", node: "13622:39794", figma: "13/18 · 500 · #7c7879 · uppercase", read: (r) => { const h = q(r, '[data-part="table-head"] span'); return `${type(h)} · ${lightHexOf(h, ["color"])} · ${css(h).textTransform}`; } },
  { part: "Group band: fill · padding", node: "13622:39806", figma: "#f9f8f7 · 2/8", read: (r) => { const b = q(r, '[data-part="group-band"]'), s = css(b); return `${lightHexOf(b, ["background"])} · ${px(s.paddingTop)}/${px(s.paddingLeft)}`; } },
  { part: "Group name: type · colour", node: "13622:39808", figma: "14/20 · 700 · #7c7879", read: (r) => { const n = q(r, '[data-part="group-band"] span'); return `${type(n)} · ${lightHexOf(n, ["color"])}`; } },
  { part: "Row pitch (line to line)", node: "13622:39826", figma: "52", read: (r) => { const rows = qa(r, '[data-part="table-row"]'); return rows[1] ? Math.round(rect(rows[1]).top - rect(rows[0]).top) : "52"; } },
  { part: "Cell text: type · colour", node: "13622:39817", figma: "13/18 · 400 · #7c7879", read: (r) => { const c = q(r, '[data-part="table-row"]').children[1]; return `${type(c)} · ${lightHexOf(c, ["color"])}`; } },
  { part: "Change pill: height", node: "13622:39823", figma: "20", read: (r) => Math.round(rect(q(r, '[data-part="table-row"] [data-part="trend"]') || q(r, '[data-part="table-row"]').children[4].firstElementChild).height) },
  { part: "First group open, the rest closed", node: "13622:39872", figma: "open · closed", read: (r) => qa(r, '[data-part="group-band"] button').slice(0, 2).map((b) => (b.getAttribute("aria-expanded") === "true" ? "open" : "closed")).join(" · ") },
];

const TAB_WIDTHS = [320, 390, 480, 560, 808];
function ResponsiveShowcase({ style }) {
  const [w, setW] = useState(390);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], flexWrap: "wrap" }}>
        <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>Card width</span>
        <SegmentedControl options={TAB_WIDTHS.map((x) => ({ id: String(x), label: `${x}px` }))} value={String(w)} onChange={(v) => setW(+v)} />
      </div>
      <div style={{ display: "flex", gap: dsSpace[24], flexWrap: "wrap", alignItems: "flex-start" }}>
        {[["rings", "chart"], ["donut", "chart"], ["rings", "table"]].map(([f, v]) => (
          <StoryStyleContext.Provider key={f + v} value={style}><div style={{ width: w, maxWidth: "100%" }}><CompositionStory form={f} initialTab="Employment" initialView={v} /></div></StoryStyleContext.Provider>
        ))}
      </div>
    </div>
  );
}

/* ======================================================================================================== */
function DeveloperView({ style }) {
  return (
    <>
      <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
        <Prose>
          <p><b>Purpose:</b> shows who is represented in the result, so a reader knows whose answers a score is made of before reading anything into it.</p>
          <p><b>Can contain:</b> each way of grouping people (one tab per family of them), each group's size and share, and in Table View its score, change, and comparison with the average.</p>
          <p><b>Boundary:</b> never shows a score for a group under {SUPPRESS_BELOW} people. It describes who answered; it doesn't explain why a group scores as it does (that's the Diagnostic).</p>
          <p><b>Where it appears:</b> the Org Score and Explorer Scopes, and the Widget Builder's default Scope. Used by <FileBadge>scope/scopeRecipes.jsx</FileBadge> and <FileBadge>widgetbuilder/storyCatalog.jsx</FileBadge>.</p>
        </Prose>
      </Section>

      <Section id="forms" title="The forms" lead="One Story, two Chart View forms, a Table View, four tabs. Pick the form per Scope; the tabs, table and data are the same.">
        <SimpleTable head={["Form", "What it shows", "Use it when"]} widths={["20%", "50%", "30%"]} rows={[
          ["Rings (default)", "One ring per way of grouping in the tab, each segment a group sized by its share of people, the axis icon and name in the centre. Select a segment for its size, share, score and comparison in the footer line.", "Several ways of grouping should be compared at a glance, side by side."],
          ["Donut", "Each way of grouping in its own card: a donut beside a legend listing every group with its size, share and score. Point at a slice or a row and the two light up together; the centre swaps from the total to that group.", "The reader needs every group's number and score without hovering, or a grouping has many groups."],
          ["Table View", "Every group in the tab, in collapsible sections: employees, population share, score, change since the last round, and how it compares with the average. Copy Table copies it.", "Exact values, or copying them out."],
          ["Tabs", COMPOSITION_TABS.map((t) => `${t.tab}: ${t.axes.map(([k, l]) => ({ tenure: "Employment Duration", workModel: "Work Composition", location: "Site" }[k] || l)).join(", ")}`).join(". ") + ".", "Both forms."],
        ]} />
        <Prose><p>In the Widget Builder they are two Stories in the Composition family, <b>Composition</b> (rings) and <b>Composition (Donut)</b>, so either can be added to a Scope; in chat, “add composition donut” adds the donut. In code it's one component: <code>&lt;CompositionStory form="donut" /&gt;</code>. Both use the same colour for the same group, so switching forms never recolours anyone.</p></Prose>
      </Section>

      <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark); never hard-code the hex.">
        <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[
          ["Card", "Shell", "The shared Story card: up to 808px, 18px radius, 16px padding, 16px between parts. Title Text lg / Bold."],
          ["Tabs", "Pill", <span key="t" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Track {T("bg/primary")}, fully rounded. Each tab Text 2xs, 4px top and bottom, 8px sides. Chosen: {T("button/brand/primary/bg/active")} with {T("button/brand/primary/items/default text")}; others {T("button/brand/ghost/items/default text")}.</span>],
          ["Evidence section", "Lines and space", <span key="e" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>1px {T("border/primary")} above and below. Chart: 16px above and below the rings. Table: 16px on every side.</span>],
          ["Ring", "Geometry", "A 176px box; the ring is its centre 160px: outer radius 80, inner 56 (24px thick). Segments touch, start at 12 o'clock and run clockwise, sized by share of people. Rings 16px apart, centred, wrapping."],
          ["", "Colours", <span key="c" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>The graph palette in order: Lavender Violet, Amber Orange, Mint Green, Golden Yellow, Coral Red, Teal, Purple, Turquoise, Hot Pink, Orange Coral, then round again. Work Composition uses Personal Blue, Org Blue, Mint Green. Never status colours: these are categories.</span>],
          ["", "Centre", <span key="m" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>The axis icon (24px, {T("icon/primary")}) over the axis name (Text sm / Medium, {T("text/secondary")}), 8px apart, wrapping to two lines.</span>],
          ["", "Selected", "The chosen segment grows 4px outward; the others fade to 35%. Nothing else moves."],
          ["Footer line", "Text", <span key="f" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text xs {T("text/tertiary")}: “Select a segment to view details.”, replaced by the selected group's details in {T("text/secondary")}.</span>],
          ["Donut form", "Layout", <span key="d" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>One inner card per way of grouping ({T("surface/General/card")}, 1px {T("border/secondary")}, radius/lg, 16px padding), 16px apart in the Evidence Section. Header: the axis icon (20px) and name, Text sm / Bold {T("text/secondary")}, 12px apart.</span>],
          ["", "Donut", "200px: outer radius 92, inner 60 (of a 220 drawing), slices 1° apart, from 12 o'clock clockwise, the same colours as the rings. Centre: the total in Text xl / Bold over “people”; on a slice, the group, its size and share, and its score in its status colour."],
          ["", "Legend", <span key="l" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Beside the donut (wrapping under it below about 480px). Each row: a 10px dot, the group (Text xs), size · share (Text 2xs {T("text/tertiary")}), the score (Text sm / Bold, status colour). The hovered row gets {T("bg/primary")} and says how it compares with the average.</span>],
          ["", "Linked hover", "A slice and its legend row light up together; the slice grows 6px outward, the rest fade (slices 35%, rows 55%). Tap works the same on touch."],
          ["Table", "Columns", "Six equal columns with 8px side padding. Headings Text xs / Medium, text/tertiary, upper case; “Compared with average” wraps."],
          ["", "Group band", <span key="b" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{T("surface/General/card-within-card")}, 2px / 8px padding, the name Text sm / Bold upper case, a 16px chevron (up when open). The first section is open.</span>],
          ["", "Rows", <span key="r" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>1px {T("border/tertiary")} between rows, 16px either side of the content, so rows sit 52px apart. Text xs {T("text/tertiary")}; the group and the score bold, the score in its status colour.</span>],
          ["", "Change", "The Trend Indicator pill. No change, or nothing to compare: a 40px grey pill with a dash (bg/secondary, text/tertiary)."],
        ]} />
      </Section>

      <Section id="states" title="States & variants" lead="Each tab, in both views, from the real data.">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div id="form-rings" />
          {COMPOSITION_TABS.map((t) => (
            <Variant key={t.tab} title={`Rings · ${t.tab}`}><StoryStage style={style} kind={meta.kind} width={808}><CompositionStory initialTab={t.tab} /></StoryStage></Variant>
          ))}
          <div id="form-donut" />
          <Variant title="Donut · Employment" note="Three ways of grouping, each in its own card."><StoryStage style={style} kind={meta.kind} width={808}><CompositionStory form="donut" initialTab="Employment" /></StoryStage></Variant>
          <Variant title="Donut · Organisation" note="Many groups: the legend lists every one."><StoryStage style={style} kind={meta.kind} width={808}><CompositionStory form="donut" initialTab="Organisation" /></StoryStage></Variant>
          <div id="form-table" />
          <Variant title="Table View · Employment" note="The same for both forms."><StoryStage style={style} kind={meta.kind} width={808}><CompositionStory initialTab="Employment" initialView="table" /></StoryStage></Variant>
        </div>
      </Section>

      <Section id="responsive" title="Responsive" lead="The Story responds to its own card's width.">
        <ResponsiveShowcase style={style} />
        <Prose><p>At 560px and wider the rings are 176px, as designed. On a compact card they shrink to 150px (128px under 400px) so two still sit side by side, and the tabs scroll sideways if they don't fit. The table keeps its six columns and scrolls sideways under 560px rather than squeezing them unreadably.</p></Prose>
      </Section>

      <Section id="limits" title="Few, many, odd" lead="What the Story does at the edges.">
        <SimpleTable head={["Case", "What happens"]} widths={["30%", "70%"]} rows={[
          [`A group under ${SUPPRESS_BELOW} people`, "Drawn in the ring and listed in the table (it's part of who is represented), but its score, change and comparison are never shown: a dash in the table, a sentence when selected."],
          ["One group on an axis", "A full ring in one colour."],
          ["More than ten groups", "The palette goes round again. Adjacent repeats are possible past ten; the table is the precise view."],
          ["A tiny group", "Its segment can be a sliver. It is still selectable, and listed in the table."],
          ["No earlier round", "Every change is the grey dash pill."],
          ["A tab with one way of grouping", "One ring, centred (People and Site today, because the data has only Gender and Location there)."],
        ]} />
      </Section>

      <Section id="content" title="Content & voice" lead="Written to the SHAPE Voice and Language Guide.">
        <SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={[
          ["Title", "“Breakdowns”, as the design has it. Title case, no full stop."],
          ["Footer", "“Select a segment to view details.” A full sentence. Selected: “Hybrid (Work Composition): 34 people, 34% of everyone. Score 61, 2% above average.”"],
          ["Comparisons", "“10% above average”, “3% below average”, “Same as average”, “Not shown” for a hidden group."],
          ["Care with groups", "Describes who answered and how each group scores. Never says why."],
        ]} />
      </Section>

      <Section id="a11y" title="Accessibility" lead="What the component does today.">
        <Prose>
          <p><b>Each ring is an image with a label</b> listing every group and its share, so a screen reader hears the whole ring. Segments respond to tap as well as hover, and the selection is announced (<code>role="status"</code>).</p>
          <p><b>Table View is the accessible equivalent</b>, one click away: every number in the rings is there as text, plus the scores.</p>
          <p><b>Colour is never the only signal:</b> the footer and the table name every group; the categorical colours carry no meaning of their own.</p>
          <p><b>Tabs</b> use <code>role="tablist"</code> and <code>aria-selected</code>; section toggles use <code>aria-expanded</code> and say which section they show or hide.</p>
        </Prose>
      </Section>

      <Section id="props" title="Props & usage">
        <PropsTable rows={[
          { name: "initialTab", type: "\"People\" | \"Organisation\" | \"Employment\" | \"Locations\"", def: "\"People\"", desc: "The tab it opens on." },
          { name: "initialView", type: "\"chart\" | \"table\"", def: "\"chart\"", desc: "Chart View or Table View." },
          { name: "title", type: "string", def: "\"Breakdowns\"", desc: "The design's title." },
          { name: "line", type: "string", desc: "An optional explanatory line under the title (hidden in the design's frames)." },
          { name: "scoreOf", type: "(round) => number", desc: "Which score to compare groups on. Defaults to the overall score; an Explorer's Scope passes its own." },
        ]} />
        <CodeBlock label="Usage" code={`<CompositionStory initialTab="Employment" />\n<CompositionStory initialView="table" scoreOf={(r) => r.dimensionScores["Job Satisfaction"]} />`} />
        <Prose><p><b>Data.</b> <FileBadge>lib/scopeData.js</FileBadge>'s <code>groupRows(axis)</code> returns every group with its size, share, score, change and comparison, and applies the {SUPPRESS_BELOW}-person rule. The ring is <FileBadge>stories/DonutChart.jsx</FileBadge>; the axis icons are shared with the Diagnostic's group cards (<code>AxisIcon</code>).</p></Prose>
      </Section>

      <Section id="done" title="Done checklist" lead="You're done when every line is true.">
        <List items={[
          "Title, pill tabs, Table View (and Copy Table in the table) on one line; tabs change the rings and the table together.",
          "Rings are 176px with a 24px band, segments start at 12 o'clock, touch, and use the graph palette in order.",
          "Each ring's centre shows its axis icon and name. Rings are 16px apart and centred.",
          "Selecting a segment fills the footer with its details; nothing moves.",
          "Table: six equal columns, a light band per group with a chevron, the first open, rows 52px apart.",
          `No score, change or comparison is ever shown for a group under ${SUPPRESS_BELOW} people.`,
          "Colours are design-system tokens and follow Light and Dark.",
        ]} />
      </Section>

      <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
        <Prose><p><b>Matches the design.</b> Measured in your browser from the live component at 808px, against values read from the Figma frames. The ring data is the real dataset (the design's own sample axes, such as Education, don't exist in it), so these checks are about the drawing, not the numbers.</p></Prose>
        <Prose><p><b>1. Chart View</b> (13622:39607, 13622:39699)</p></Prose><FigmaParity checks={CHART_CHECKS}>{classic(<CompositionStory initialTab="Organisation" />)}</FigmaParity>
        <Prose><p><b>2. Table View</b> (13622:39765)</p></Prose><FigmaParity checks={TABLE_CHECKS}>{classic(<CompositionStory initialTab="Employment" initialView="table" />)}</FigmaParity>
        <Prose>
          <p><b>What changed from the earlier build.</b> Underlined tabs became the design's pill; the in-card Donut/Bars switch is gone (Bars is dropped; the donut with its legend is kept, by request, as its own form, <i>Donut</i>, which the design doesn't have and needs a design review); rings are the design's size and palette, with the axis icon in the centre; the generic table became the design's sectioned table.</p>
          <p><b>Not in the data, so not shown.</b> Age, Ethnicity, Education, Salary and Country appear in the design. The dataset has Gender, Department, Job Level, Employment Status, Employment Duration (tenure), Work Composition (work model) and Site (office), so People has one ring and Locations one.</p>
          <p><b>Decisions for you.</b> (1) <b>What does selecting a segment show?</b> The design says “Select a segment to view details.” but draws no details; we fill the footer line, so the card doesn't move. (2) <b>Icons.</b> Department and Job Level are the design's; Employment Duration uses the Age icon; Employment Status, Work Composition and Site use the closest line icons until the “SHAPE – &Form” set is exported. (3) <b>Site vs Site Code.</b> Our location is an office name, so it's called Site. (4) <b>Colour order</b> follows the frames; past ten groups the palette repeats. (5) Every frame shows the People tab chosen whatever rings it draws; we treat that as a frame slip.</p>
        </Prose>
      </Section>
    </>
  );
}

/* ======================================================================================================== */
function ResearcherView({ style }) {
  const work = groupRows("workModel");
  const small = COMPOSITION_TABS.flatMap((t) => t.axes).flatMap(([k]) => groupRows(k)).filter((r) => r.hidden).length;
  return (
    <>
      <Section id="story" title="The data story" lead="Before reading a score, know whose answers make it up.">
        <Prose>
          <p>A score is an average of people. If most of them are in one department, or one work pattern, the score mostly describes them. Composition shows that mix first, and only then how each group scores.</p>
        </Prose>
        <Callout title="The idea in one line">The Breakdown says what a score is made of. Composition says who it's made of.</Callout>
      </Section>
      <Section id="glance" title="At a glance">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Question it answers" value="Who is in it?" />
          <Fact label="Unit" value="People" note="Each person counts once per way of grouping." />
          <Fact label="Ways of grouping" value={String(COMPOSITION_TABS.flatMap((t) => t.axes).length)} note="Across four tabs." />
          <Fact label="Privacy" value={`Scores for ${SUPPRESS_BELOW}+ only`} note={`${small} small groups show no score right now.`} />
          <Fact label="People behind it" value={`${EMPLOYEE_COUNT} respondents`} note="Synthetic data in this prototype." />
        </div>
      </Section>
      <Section id="live" title="Live from the data" lead="Real examples built from the dataset right now.">
        <Variant title="Employment"><StoryStage style={style} kind={meta.kind} width={808}><CompositionStory initialTab="Employment" /></StoryStage></Variant>
        <SimpleTable head={["In the Story", "Data behind it"]} widths={["32%", "68%"]} rows={[
          ["A segment's size", "The group's share of everyone who answered in the latest round."],
          ["Score", "The mean overall score of the people in the group (or the Scope's own score)."],
          ["Change", "That mean now minus the mean in the round before, when both have 5+ people."],
          ["Compared with average", "The group's mean against everyone's mean, as a percentage of everyone's mean."],
          ["Work Composition today", work.map((r) => `${r.group} ${r.pct}%`).join(", ")],
        ]} />
      </Section>
      <Section id="limits" title="Constraints" lead="What a reader, or a researcher quoting this, should keep in mind.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="Share isn't representativeness.">A ring shows who answered, not who works there. Without headcounts per group, nobody can tell whether a group is under-represented.</Limit>
          <Limit n="2" title="“Compared with average” is relative.">“10% above average” is 10% of the average score, not 10 points.</Limit>
          <Limit n="3" title="Small groups move a lot.">A group of 6 can swing several points on one person; the 5-person rule protects identity, not confidence.</Limit>
          <Limit n="4" title="The data is synthetic.">It shows how the Story behaves, not a finding about a real organisation.</Limit>
        </div>
      </Section>
      <Section id="questions" title="What it answers, and what it does not">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>It answers</span><List items={["Who answered, by each way of grouping?", "How big is each group?", "How does each group score, and has it moved?"]} /></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>It does not answer</span><List items={["Why does a group score lower? (Nothing explains it.)", "Which group needs attention first? (Diagnostic)", "Is the response rate good? (Methodology)"]} /></div>
        </Two>
      </Section>
      <Section id="open" title="Open questions">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="A" title="Show headcounts?">With the organisation's headcount per group, the ring could show response rate, not just share.</Limit>
          <Limit n="B" title="Age and ethnicity">The design shows them; the dataset deliberately has neither. Collecting them needs a privacy decision first.</Limit>
        </div>
      </Section>
    </>
  );
}

export default function CompositionDoc({ style, view = "developer" }) {
  return view === "researcher" ? <ResearcherView style={style} /> : <DeveloperView style={style} />;
}
