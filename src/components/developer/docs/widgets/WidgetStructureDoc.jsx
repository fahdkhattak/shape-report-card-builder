import { useLayoutEffect, useRef, useState } from "react";
import { T, font, radius } from "../../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder, dsShadow } from "../../../../lib/ds.js";
import { Header } from "../../../widgets/primitives.jsx";
import { Section, Prose, Variant, Anatomy, Callout } from "../../docKit.jsx";
import { SpecTable, Two, List, Limit, card_ } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { HEADER_RULE, SECTIONS, TYPE_ROLES } from "../../../../lib/widgetTypeSystem.js";
import { WidgetStage } from "../widgetDoc.jsx";

/* ================================================================== */
/* WIDGET STRUCTURE — the blank widget, and the rules every widget is    */
/* built to. First page of Developer › Widgets: what a widget is made of */
/* (shell → Header → Insight → Evidence → Action Bar), THE HEADER RULE,   */
/* and what can and can't happen when a widget is made. The blank card    */
/* uses the real Header component and the canvas card's own shell values  */
/* (WidgetCard.jsx), so what's measured here is what ships.              */
/* ================================================================== */
export const meta = {
  id: "widget-structure", name: "Widget structure", group: "Widgets", kind: "Widget structure",
  blurb: "A blank widget and the rules every widget is built to: its sections, the Header Rule, and what can and can't happen when one is made.",
  source: "components/canvas/WidgetCard.jsx (shell) · components/widgets/primitives.jsx (Header) · lib/widgetTypeSystem.js (HEADER_RULE, roles, sections)",
};
export const toc = [
  { id: "overview", label: "Overview" }, { id: "blank", label: "The blank widget" }, { id: "anatomy", label: "Anatomy" }, { id: "header", label: "The Header Rule" },
  { id: "sections", label: "The sections" }, { id: "sizes", label: "Sizes and the grid" }, { id: "states", label: "States" }, { id: "rules", label: "Can and can't" }, { id: "checklist", label: "New widget checklist" },
];

const PX = { "1x1": 164, "2x2": 344, "3x3": 524 };
/* The canvas card's shell (WidgetCard.jsx): 16 padding, 12 between parts, radius/widget, 1px border/secondary, fill
   color/surface/General/card. The dashed slots (bg/secondary, text/quaternary) only mark where each section goes; a real
   widget puts its own content there, with no slot fill or outline. */
function BlankWidget({ size = "2x2", title = "Widget title", sections = ["insight", "evidence"], active = false }) {
  const slot = (id, label, grow) => (
    <div data-part={`section-${id}`} style={{ flex: grow ? 1 : "0 0 auto", minHeight: grow ? 0 : id === "action" ? 28 : 36, border: `${dsBorder.sm}px dashed ${ds.border.secondary}`, borderRadius: dsRadius.sm, background: ds.bg.secondary, display: "flex", alignItems: "center", justifyContent: "center", ...dsText("Text 3xs", 500), color: ds.text.quaternary, textAlign: "center", padding: 4, boxSizing: "border-box" }}>{label}</div>
  );
  return (
    <div data-widget-blank style={{ width: PX[size], height: PX[size], boxSizing: "border-box", background: ds.surface.general.card, border: `1px solid ${active ? ds.border.strong : ds.border.secondary}`, borderRadius: radius.widget, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: active ? dsShadow("md") : "none", fontFamily: font }}>
      <Header title={title} selected={active} />
      {sections.includes("insight") && slot("insight", "Insight", true)}
      {sections.includes("evidence") && slot("evidence", "Evidence")}
      {sections.includes("action") && slot("action", "Action Bar")}
    </div>
  );
}

/* Measures the header box and its text, so the page proves the rule rather than repeating it. */
function HeaderMeasure({ title, size = "1x1" }) {
  const ref = useRef(null);
  const [m, setM] = useState(null);
  useLayoutEffect(() => {
    const t = setTimeout(() => {
      const h = ref.current?.querySelector('[data-part="widget-header"]');
      if (!h) return;
      const tx = h.firstChild, hr = h.getBoundingClientRect(), r = document.createRange();
      r.selectNodeContents(tx);
      const lines = new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
      setM({ box: Math.round(hr.height * 10) / 10, lines, colour: getComputedStyle(tx).color });
    }, 300);
    return () => clearTimeout(t);
  }, [title]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
      <div ref={ref}><BlankWidget size={size} title={title} sections={["insight"]} /></div>
      {m && <span style={{ ...dsText("Text 2xs"), color: ds.text.secondary }}>{m.lines} line{m.lines === 1 ? "" : "s"} · header box <b style={{ color: m.box === (m.lines === 1 ? HEADER_RULE.boxOneLine : HEADER_RULE.boxTwoLines) ? ds.status.success.textIndicator : ds.status.error.text }}>{m.box}px</b> (rule: {m.lines === 1 ? HEADER_RULE.boxOneLine : HEADER_RULE.boxTwoLines}px)</span>}
    </div>
  );
}

const PARTS = [
  { id: "card", name: "Card (shell)", note: "Fixed grid size, 16px padding, 12px between parts, radius/widget, 1px border.", find: (r) => [r.querySelector("[data-widget-blank]")] },
  { id: "header", name: "Header", note: "The Header Rule: 12px box for one line, 22px for two.", find: (r) => [r.querySelector('[data-part="widget-header"]')] },
  { id: "insight", name: "Insight section", note: "The answer: one primary metric, a status, or a chart. Takes the free space.", find: (r) => [r.querySelector('[data-part="section-insight"]')] },
  { id: "evidence", name: "Evidence section", note: "What backs it up: date, captions, labels and their values.", find: (r) => [r.querySelector('[data-part="section-evidence"]')] },
  { id: "action", name: "Action Bar", note: "Optional: one button or link at the foot.", find: (r) => [r.querySelector('[data-part="section-action"]')] },
];

const CAN = [
  "Use the four sections in order: Header, Insight, Evidence, Action Bar. Leave out Evidence or the Action Bar when there's nothing to say.",
  "Build every text from the 13 Font System roles, choosing the Primary Metric size by what the number is (Display 64, Standard 48, Dense 36, Compact 32).",
  "Colour an Insight value or an Evidence value with its status colour when it has a status.",
  "Let the header drop from two lines to one (with an ellipsis and the full title on hover) when the content needs the room.",
  "Use the Graph palette for categories (gender, work model) and the status colours for status. Never the other way round.",
  "Show sample data where the dataset can't back a form yet, as long as the Library tags it Sample data.",
  "Offer more than one form of the same widget (1x1, 2x2, 3x3), switched with Change Widget.",
];
const CANNOT = [
  "Change the card size: 1x1, 2x2 and 3x3 only, fixed pixels on the 164px grid. Never fluid, never in between.",
  "Change the shell: 16px padding, 12px between sections, radius/widget (18), 1px border/secondary, color/surface/General/card fill.",
  "Break the Header Rule: no other size, weight or case, no semantic colour, no black, never more than two lines.",
  "Add a header element of its own (an icon, a close button, a filter). The three-dot menu belongs to the shell.",
  "Add a scope or filter control to a Library widget: it always shows the whole population of its report. Narrowing happens in the Scope or the chat.",
  "Invent a text role or size, or use Semibold (600), Light, Italic or Underline, or another font.",
  "Show more than one Primary Metric.",
  "Let anything spill past the card, or scroll inside it. Past a limit, show what fits and “N more”.",
  "Show a group of fewer than 5 people on an Org widget, or anyone else's data on a personal one.",
  "Tell a meaning by colour alone: a status word or a sign goes with every status colour.",
];

export default function WidgetStructureDoc() {
  return (
    <>
      <Section id="overview" title="Overview" lead="Every widget is the same card with the same four sections. What changes is what's inside them, and only within these rules.">
        <Prose>
          <p>A widget answers one question at a glance and opens into its Scope. It's built top to bottom from a <b>Header</b> (what this is), an <b>Insight</b> (the answer), <b>Evidence</b> (what backs it up) and, rarely, an <b>Action Bar</b>. The type inside follows the widget <DocLink id="widget-type-system">Font System</DocLink>; the header follows the <b>Header Rule</b> below, which is the same for every widget.</p>
        </Prose>
      </Section>

      <Section id="blank" title="The blank widget" lead="The shell and its sections, empty. The header is the real component. The card is filled with color/surface/General/card; the dashed grey slots only show where each section goes and are always replaced by the section's real content.">
        <WidgetStage>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Variant title="1x1 · 164px"><BlankWidget size="1x1" /></Variant>
            <Variant title="2x2 · 344px"><BlankWidget size="2x2" sections={["insight", "evidence", "action"]} /></Variant>
            <Variant title="3x3 · 524px"><BlankWidget size="3x3" sections={["insight", "evidence"]} /></Variant>
          </div>
        </WidgetStage>
      </Section>

      <Section id="anatomy" title="Anatomy" lead="Numbered on the blank 2x2, then measured from the browser.">
        <Anatomy parts={PARTS} width={1040}><div style={{ display: "flex" }}><BlankWidget size="2x2" sections={["insight", "evidence", "action"]} /></div></Anatomy>
      </Section>

      <Section id="header" title="The Header Rule" lead="One rule for every widget's header. It lives in one place (HEADER_RULE in lib/widgetTypeSystem.js), which the Header component, the audit and these pages all read.">
        <SpecTable head={["Property", "Value"]} widths={["28%", "72%"]} rows={[
          ["Text style", `${HEADER_RULE.style}: ${HEADER_RULE.family}, ${HEADER_RULE.size}px, ${HEADER_RULE.weight}, ${HEADER_RULE.transform}, letter spacing ${HEADER_RULE.tracking}, normal style.`],
          ["Line height", `${HEADER_RULE.lineHeight}, trimmed to the cap height and the baseline (leading-trim: both; text-edge: cap → text-box: ${HEADER_RULE.trim}).`],
          ["Box, one line", `${HEADER_RULE.boxOneLine}px tall, the text centred in it (display: flex; align-items: center; align-self: stretch).`],
          ["Box, two lines", `${HEADER_RULE.boxTwoLines}px tall, the text from the top (first cap top to second baseline).`],
          ["Lines", `${HEADER_RULE.maxLines} at most. When the content needs the room, it drops to one line with an ellipsis; the full title is on hover. It goes back to two only when a whole line of room appears, so it never flickers.`],
          ["Colour", `${HEADER_RULE.colour} (${HEADER_RULE.hex}). While the widget is active (its Scope is open): ${HEADER_RULE.activeColour} (${HEADER_RULE.activeHex}). Never a semantic colour, never black.`],
          ["Below it", `${HEADER_RULE.gapBelow}px to the Insight (the shell's gap).`],
        ]} />
        <div style={{ display: "flex", gap: dsSpace[24], flexWrap: "wrap", alignItems: "flex-start" }}>
          <Variant title="One line"><HeaderMeasure title="Score history" /></Variant>
          <Variant title="Two lines"><HeaderMeasure title="Physical health score" /></Variant>
          <Variant title="Active (Scope open)"><BlankWidget size="1x1" title="Score history" sections={["insight"]} active /></Variant>
        </div>
      </Section>

      <Section id="sections" title="The sections" lead="What each section holds, its default colour, and the roles it can use.">
        <SpecTable head={["Section", "Holds", "Colour", "Roles"]} widths={["16%", "34%", "22%", "28%"]} rows={[
          ["Header", "What this widget is. One title, nothing else.", "text/tertiary; text/secondary when active", "Header Label (Eyebrow) only"],
          ["Insight", "The answer: one Primary Metric with its unit, or a Status Metric, or a chart. Takes the free space.", "text/primary; a status colour when the value has one", TYPE_ROLES.filter((r) => r.section === "insight").map((r) => r.name.replace("Primary Metric – ", "")).join(", ")],
          ["Evidence", "Date, captions, comparisons, category labels and their values, “N more”.", "text/tertiary; a status colour when a value has one", TYPE_ROLES.filter((r) => r.section === "evidence").map((r) => r.name.replace("Label – ", "").replace("Supporting Text – ", "Supporting ")).join(", ")],
          ["Action Bar", "One button or link (Get Support, Unlock). Optional, at the foot.", SECTIONS.find((s) => s.id === "action").colour, "The design system's Button"],
        ]} />
      </Section>

      <Section id="sizes" title="Sizes and the grid">
        <SpecTable head={["Size", "Pixels", "Use it for"]} widths={["16%", "24%", "60%"]} rows={[
          ["1x1", "164 × 164", "One number or status with a line of evidence."],
          ["2x2", "344 × 344 (164 × 2 + 16)", "A number with its breakdown, a ranked list, a chart."],
          ["3x3", "524 × 524 (164 × 3 + 32)", "A composite that needs room: the Index ring with its second level."],
        ]} />
        <Prose><p>The report is a grid of 164px cells with 16px gaps (2 to 6 columns). Cells never stretch; only how many fit in a row changes.</p></Prose>
      </Section>

      <Section id="states" title="States">
        <SpecTable head={["State", "What changes"]} widths={["24%", "76%"]} rows={[
          ["Rest", "color/surface/General/card fill, 1px border/secondary, header text/tertiary."],
          ["Hover or focus", "The md shadow and a 2px rise; the 28px three-dot button fades in 7px from the top-right corner."],
          ["Pressed", "A quick squash to 0.97, released on a spring."],
          ["Active (Scope open)", "The border turns border/strong, a soft shadow, and the header turns text/secondary."],
          ["Menu open", "The three-dot button stays visible on ghost/bg/active; the menu opens beside the card."],
        ]} />
      </Section>

      <Section id="rules" title="Can and can't" lead="What can and can't happen when a widget is made.">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>A widget can</span><List items={CAN} /></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>A widget can't</span><List items={CANNOT} /></div>
        </Two>
      </Section>

      <Section id="checklist" title="New widget checklist" lead="Before a new widget or form goes into the Library.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[["It answers one question.", "Say it in one sentence. If it needs two, it's two widgets, or a widget and its Scope."], ["It's a 1x1, 2x2 or 3x3.", "Its content fits at that size with the Header on two lines, and still reads with it on one."], ["The Header Rule holds.", "The type audit shows the header as Header Label (Eyebrow), text/tertiary, in a 12px or 22px box."], ["Every text has a role.", "The type audit on its page says “All on-system”."], ["Its data is real or tagged.", "Real data from the report's population, or a Sample data tag. A contract on its page says what the backend sends."], ["It opens somewhere.", "A Scope (or a report layer) that explains the number."]].map(([t, b], i) => <Limit key={t} n={String(i + 1)} title={t}>{b}</Limit>)}
        </div>
        <Callout title="Where to check">Each widget's page and <DocLink id="widgets-all">All widgets</DocLink> run the type audit on the live cards.</Callout>
      </Section>
    </>
  );
}
