import { useLayoutEffect, useRef, useState } from "react";
import { T, font, radius } from "../../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder, dsShadow } from "../../../../lib/ds.js";
import { Header, Sections, Insight, Evidence, ActionBar } from "../../../widgets/primitives.jsx";
import { Section, Prose, Variant, Anatomy, Callout, CodeBlock } from "../../docKit.jsx";
import { SpecTable, Two, List, Limit, card_ } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { HEADER_RULE, SECTIONS, TYPE_ROLES } from "../../../../lib/widgetTypeSystem.js";
import { STRUCTURE, TEMPLATES, SHELL_PADDING, SECTION_RULES } from "../../../../lib/widgetStructure.js";
import { WidgetStage, LiveWidget } from "../widgetDoc.jsx";

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
  blurb: "The templates every widget is built from (Header, Insight, Evidence, Action Bar, at fixed heights), the Header Rule, and what can and can't happen when one is made.",
  source: "lib/widgetStructure.js (STRUCTURE, TEMPLATES, auditStructure) · components/widgets/primitives.jsx (Sections, Insight, Evidence, ActionBar, Header) · components/canvas/WidgetCard.jsx (shell)",
};
export const toc = [
  { id: "overview", label: "Overview" }, { id: "templates", label: "The templates" }, { id: "structure", label: "The structure rules" }, { id: "examples", label: "Examples" },
  { id: "build", label: "Building a widget" }, { id: "check", label: "Checking a widget" }, { id: "anatomy", label: "Anatomy" }, { id: "header", label: "The Header Rule" },
  { id: "section-rules", label: "The section rules" }, { id: "sections", label: "The sections" }, { id: "sizes", label: "Sizes and the grid" }, { id: "states", label: "States" }, { id: "rules", label: "Can and can't" }, { id: "checklist", label: "New widget checklist" },
];

const PX = { "1x1": 164, "2x2": 344, "3x3": 524 };
/* The canvas card's shell (WidgetCard.jsx): 16 padding, 12 between parts, radius/widget, 1px border/secondary, fill
   color/surface/General/card. The dashed slots (bg/secondary, text/quaternary) only mark where each section goes; a real
   widget puts its own content there, with no slot fill or outline. */
function BlankWidget({ size = "2x2", title = "Widget title", sections = ["insight", "evidence"], active = false }) {
  const slot = (label) => <div style={{ position: "absolute", inset: 0, border: `${dsBorder.sm}px dashed ${ds.border.secondary}`, borderRadius: dsRadius.sm, background: ds.bg.secondary, display: "flex", alignItems: "center", justifyContent: "center", ...dsText("Text 3xs", 500), color: ds.text.quaternary, textAlign: "center", padding: 4, boxSizing: "border-box" }}>{label}</div>;
  const h = { evidence: STRUCTURE.evidence[size], action: STRUCTURE.action };
  return (
    <div data-widget-blank data-widget-card data-size={size} style={{ width: PX[size], height: PX[size], boxSizing: "border-box", background: ds.surface.general.card, border: `1px solid ${active ? ds.border.strong : ds.border.secondary}`, borderRadius: radius.widget, padding: SHELL_PADDING, display: "flex", flexDirection: "column", gap: STRUCTURE.gap, boxShadow: active ? dsShadow("md") : "none", fontFamily: font }}>
      <Header title={title} selected={active} />
      <Sections size={size}>
        {sections.includes("insight") && <Insight>{slot("Insight · fills")}</Insight>}
        {sections.includes("evidence") && <Evidence style={{ position: "relative" }}>{slot(`${size === "1x1" ? "Evidence Bar" : "Evidence Section"} · ${h.evidence}`)}</Evidence>}
        {sections.includes("action") && <ActionBar style={{ position: "relative" }}>{slot(`Action Bar · ${h.action}`)}</ActionBar>}
      </Sections>
    </div>
  );
}

/* A template drawn with the real section components, with its section heights. */
function MeasuredTemplate({ size, t }) {
  const ref = useRef(null);
  const [res, setRes] = useState(null);
  useLayoutEffect(() => {
    const id = setTimeout(() => {
      const card = ref.current?.querySelector("[data-widget-blank]");
      if (!card) return;
      const hs = [...card.querySelectorAll('[data-part="widget-header"], [data-part^="section-"]')].map((el) => Math.round(el.getBoundingClientRect().height));
      setRes({ hs });
    }, 300);
    return () => clearTimeout(id);
  }, [size, t.id]);
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], maxWidth: PX[size] }}>
      <BlankWidget size={size} title="Header" sections={t.sections} />
      <span style={{ ...dsText("Text 2xs", 600), color: ds.text.primary }}>{t.name}</span>
      {res && <span style={{ ...dsText("Text 2xs"), color: ds.text.secondary }}>{res.hs.join(" · ")} px</span>}
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
      {m && <span style={{ ...dsText("Text 2xs"), color: ds.text.secondary }}>{m.lines} line{m.lines === 1 ? "" : "s"} · header box {m.box}px</span>}
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
  "Use one of the templates: Header, Insight, then Evidence and/or an Action Bar as the size allows. Leave out Evidence or the Action Bar when there's nothing to say.",
  "Put the date under the number in the Insight when the Evidence Bar holds something else (a status, a headcount); otherwise the date can be the bar.",
  "Put a legend or the largest group in the Evidence of a chart: one of them, never both.",
  "Pin “N more” to the foot of the Insight when the list needs the whole Insight; summary sentences and footnotes go in the Evidence.",
  "Build every text from the 13 Font System roles, choosing the Primary Metric size by what the number is (Display 64, Standard 48, Dense 36, Compact 32).",
  "Colour an Insight value or an Evidence value with its status colour when it has a status.",
  "Let the header drop from two lines to one (with an ellipsis and the full title on hover) when the content needs the room.",
  "Use the Graph palette for categories (gender, work model) and the status colours for status. Never the other way round.",
  "Offer more than one form of the same widget (1x1, 2x2, 3x3), switched with Change Widget.",
];
const CANNOT = [
  "Change the card size: 1x1, 2x2 and 3x3 only, fixed pixels on the 164px grid. Never fluid, never in between.",
  "Change the shell: 16px padding, 12px between sections, radius/widget (18), 1px border/secondary, color/surface/General/card fill.",
  "Make a section taller or shorter than its rule: the Evidence Bar is 24px (1x1); the Evidence Section (2x2, 3x3) hugs its content between 24 and 68px, and is 68 when it holds a bar-type element (a status bar, the Health Age scale) with its text; the Action Bar is 24px. The Insight takes the rest and centres a chart vertically.",
  "Put both an Evidence Bar and an Action Bar on a 1x1, reorder the sections, or add a section the templates don't have.",
  "Lay out a body without the section components (Sections, Insight, Evidence, ActionBar).",
  "Break the Header Rule: no other size, weight or case, no semantic colour, no black, never more than two lines.",
  "Add a header element of its own (an icon, a close button, a filter). The three-dot menu belongs to the shell.",
  "Add a scope or filter control to a Library widget: it always shows the whole population of its report. Narrowing happens in the Scope or the chat.",
  "Invent a text role or size, or use Semibold (600), Light, Italic or Underline, or another font.",
  "Show more than one Primary Metric.",
  "Let anything spill past the card, or scroll inside it. Past a limit, show what fits and “N more”.",
  "Show a group of fewer than 5 people on an Org widget, or anyone else's data on a personal one.",
  "Write a side note anywhere on the card: what the chart shows, how it's worked out, privacy rules, caveats. A widget can always be expanded; its Scope carries them.",
  "Tell a meaning by colour alone: a status word or a sign goes with every status colour.",
];

export default function WidgetStructureDoc() {
  return (
    <>
      <Section id="overview" title="Overview" lead="Every widget is the same card with the same four sections. What changes is what's inside them, and only within these rules.">
        <Prose>
          <p>A widget answers one question at a glance and opens into its Scope. It's built top to bottom from a <b>Header</b> (what this is), an <b>Insight</b> (the answer), <b>Evidence</b> (what backs it up) and, rarely, an <b>Action Bar</b>, in one of the templates below: the Insight takes the space, everything else has a fixed height. The type inside follows the widget <DocLink id="widget-type-system">Font System</DocLink>; the header follows the <b>Header Rule</b> below, which is the same for every widget. What a widget opens into is a Scope of Stories, built on their own skeleton: <DocLink id="story-structure">Story structure</DocLink>.</p>
        </Prose>
      </Section>

      <Section id="templates" title="The templates" lead="Every widget is one of these. Only the Insight stretches; every other part has a fixed height. Each card below is the real section components, with its heights top to bottom: header, then each section.">
        {["1x1", "2x2"].map((size) => (
          <div key={size} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], marginBottom: dsSpace[24] }}>
            <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>{size} · {PX[size]} × {PX[size]}</span>
            <WidgetStage>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
                {TEMPLATES[size].map((t) => <MeasuredTemplate key={t.id} size={size} t={t} />)}
              </div>
            </WidgetStage>
          </div>
        ))}
        <Callout title="3x3">A 3x3 follows the 2x2 templates (an Evidence Section of 24 to 68px, a 24px Action Bar).</Callout>
      </Section>

      <Section id="structure" title="The structure rules" lead="The numbers behind the templates. They live in one place, STRUCTURE in lib/widgetStructure.js; the section components read them, so a widget can't drift.">
        <SpecTable head={["Rule", "Value"]} widths={["32%", "68%"]} rows={[
          ["Card padding", `${STRUCTURE.padding}px on every side, measured from the card's outer edge: the shell's 1px border plus ${SHELL_PADDING}px of padding (SHELL_PADDING). A 1x1's content box is 132px wide.`],
          ["Between sections", `${STRUCTURE.gap}px, header included. Never another gap between sections.`],
          ["Header", `${STRUCTURE.header[0]}px for one line, ${STRUCTURE.header[1]}px for two (the Header Rule, below).`],
          ["Insight", "Fills the space left. Always present, always first after the header."],
          ["Evidence", `1x1: an Evidence Bar, ${STRUCTURE.evidence["1x1"]}px. 2x2 and 3x3: an Evidence Section, ${STRUCTURE.evidence["2x2"]}px. Its content sits at the foot.`],
          ["Action Bar", `${STRUCTURE.action}px at every size, its content at the right (a button or a link).`],
          ["Order", "Header → Insight → Evidence → Action Bar. Leave a section out; never reorder or repeat one."],
          ["Combinations", "1x1: Insight; Insight + Evidence Bar; Insight + Action Bar (one 24px bar at most). 2x2: Insight; Insight + Evidence; Insight + Evidence + Action Bar; Insight + Action Bar."],
          ["Insight height", `What's left: a 1x1 with one bar has ${164 - 32 - 12 - 12 - 24 - 12}px (${164 - 32 - 22 - 12 - 24 - 12}px under a two-line header); a 2x2 with Evidence has ${344 - 32 - 12 - 12 - 68 - 12}px; with Evidence and an Action Bar ${344 - 32 - 12 - 12 - 68 - 12 - 24 - 12}px.`],
          ["Overflow", "Nothing spills out of its section. Too much content means fewer rows and “N more”, a shorter sentence, or the header dropping to one line; never a taller section."],
        ]} />
      </Section>

      <Section id="examples" title="Examples" lead="One real widget for each template.">
        <WidgetStage>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            {[["org-status", 0, "Insight only: face, status and bar"], ["org-score", 1, "Insight + Evidence Bar: headcount"], ["your-score", 2, "Insight + Evidence Bar: status"], ["enps", 0, "Insight + Evidence Bar: the bar"], ["health-age", 0, "Insight + Evidence Bar: the gap"], ["support-nudge", 1, "Insight + Action Bar"]].map(([f, i, note]) => (
              <div key={f + i} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], width: 164 }}>
                <LiveWidget familyId={f} formIndex={i} />
                <span style={{ ...dsText("Text 2xs"), color: ds.text.secondary }}>{note}</span>
              </div>
            ))}
          </div>
        </WidgetStage>
      </Section>

      <Section id="build" title="Building a widget" lead="Every widget body is these four components, nothing else at the top level.">
        <CodeBlock label="A 1x1 with an Evidence Bar" code={`import { Sections, Insight, Evidence } from "components/widgets/primitives.jsx";

<Sections size="1x1">
  <Insight center>
    <ScoreHeadline value={83} delta={4} compact />
  </Insight>
  <Evidence>
    <StatusChip status="Flourishing" />
  </Evidence>
</Sections>`} />
        <CodeBlock label="A 2x2 with Evidence and an Action Bar" code={`<Sections size="2x2">
  <Insight>…the answer…</Insight>
  <Evidence>…what backs it up, at most 68px…</Evidence>
  <ActionBar><Button size="xs">Get Support</Button></ActionBar>
</Sections>`} />
        <Prose><p><b>Sections</b> takes the widget's size and supplies the 12px gaps. <b>Insight</b> fills the space (<code>center</code> centres its content). <b>Evidence</b> is 24 or 68px by size and puts its content at the foot. <b>ActionBar</b> is 24px with its content at the right. The card shell (WidgetCard) supplies the padding and the Header.</p></Prose>
      </Section>

      <Section id="check" title="Checking a widget" lead="auditStructure(card, size) in lib/widgetStructure.js measures a rendered widget: padding, the gap between every section, each fixed height, whether the sections form a template for that size, and whether anything spills out of a section.">
        <Prose>
          <p>It returns <code>{"{ template, sections, issues }"}</code>; a widget is right when <code>issues</code> is empty. Run it in a test, or on any page with widgets: <code>{`import("/src/lib/widgetStructure.js").then((m) => [...document.querySelectorAll("[data-widget-card]")].map((c) => m.auditStructure(c, c.dataset.size)))`}</code></p>
        </Prose>
      </Section>

      <Section id="anatomy" title="Anatomy" lead="Numbered on the blank 2x2, then measured from the browser.">
        <Anatomy parts={PARTS} width={1040}><div style={{ display: "flex" }}><BlankWidget size="2x2" sections={["insight", "evidence", "action"]} /></div></Anatomy>
      </Section>

      <Section id="header" title="The Header Rule" lead="One rule for every widget's header. It lives in one place (HEADER_RULE in lib/widgetTypeSystem.js), which the Header component reads.">
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

      <Section id="section-rules" title="The section rules" lead="What each section is for, and what may and may not go in it. Check every widget against these when it's made: the structure check only measures the geometry.">
        {SECTION_RULES.map((r) => (
          <div key={r.id} data-part={`rules-${r.id}`} style={{ ...card_, display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
            <span style={{ ...dsText("Text md", 600), color: ds.text.primary }}>{r.name}</span>
            <Prose><p><b>Role.</b> {r.role}</p></Prose>
            <Two>
              <div><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>Allowed</span><List items={r.allowed} /></div>
              <div><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>Not allowed</span><List items={r.notAllowed} /><Prose><p style={{ color: ds.text.tertiary }}>{r.notAllowedRule}</p></Prose></div>
            </Two>
            <Two>
              <div><span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Behaviour</span><List items={r.behaviour} /></div>
              <div><span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Visual</span><List items={r.visual} /></div>
            </Two>
            <Callout title="Validation check">{r.check}</Callout>
          </div>
        ))}
      </Section>

      <Section id="sections" title="The sections" lead="What each section holds, its default colour, and the roles it can use.">
        <SpecTable head={["Section", "Holds", "Colour", "Roles"]} widths={["16%", "34%", "22%", "28%"]} rows={[
          ["Header", "What this widget is. One title, nothing else.", "text/tertiary; text/secondary when active", "Header Label (Eyebrow) only"],
          ["Insight", "The answer: one Primary Metric with its unit, or a Status Metric, or a chart. Takes the free space.", "text/primary; a status colour when the value has one", TYPE_ROLES.filter((r) => r.section === "insight").map((r) => r.name.replace("Primary Metric – ", "")).join(", ")],
          ["Evidence", "What backs the insight up: a breakdown, a threshold, a comparator, a sample size, a legend or the largest group, “N more”. Never a side note.", "text/tertiary; a status colour when a value has one", TYPE_ROLES.filter((r) => r.section === "evidence").map((r) => r.name.replace("Label – ", "").replace("Supporting Text – ", "Supporting ")).join(", ")],
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
          {[["It's a template.", "Built from Sections, Insight, Evidence and ActionBar; auditStructure returns no issues (no section off its height, nothing spilling)."], ["It answers one question.", "Say it in one sentence. If it needs two, it's two widgets, or a widget and its Scope."], ["It's a 1x1, 2x2 or 3x3.", "Its content fits at that size with the Header on two lines, and still reads with it on one."], ["The Header Rule holds.", "The header is the Header Label (Eyebrow), text/tertiary, in a 12px or 22px box."], ["Every text has a role.", "Each text is one of the 13 roles of the widget type system."], ["Its data has a contract.", "It reads the report's population, and the Data it needs section on its page says what the backend sends."], ["It opens somewhere.", "A Scope (or a report layer) that explains the number."]].map(([t, b], i) => <Limit key={t} n={String(i + 1)} title={t}>{b}</Limit>)}
        </div>
      </Section>
    </>
  );
}
