import { ds, dsSpace } from "../../../lib/ds.js";
import { Section, Prose, Variant, Anatomy, CodeBlock, Callout } from "../docKit.jsx";
import { SpecTable, SimpleTable, List, Two, card_ } from "../docParts.jsx";
import { dsText } from "../../../lib/ds.js";
import { TipBox } from "../../widgets/ChartTip.jsx";

/* ================================================================== */
/* TOOLTIPS — the one tooltip every chart uses (widgets/ChartTip.jsx).  */
/* ================================================================== */
export const meta = {
  id: "tooltips", name: "Tooltips", group: "Foundations", kind: "Tooltips",
  blurb: "The one tooltip every chart in the product uses, in widgets, Stories and full-view Scopes: its anatomy, its content model and where it opens.",
  source: "components/widgets/ChartTip.jsx (TIP_CARD, TipRow, TipContent, TipBox, TipCard, useChartTip)",
};
export const toc = [
  { id: "overview", label: "Overview" }, { id: "examples", label: "Examples" }, { id: "anatomy", label: "Anatomy" }, { id: "spec", label: "Specification" },
  { id: "content", label: "Content model" }, { id: "placing", label: "Where it opens" }, { id: "rules", label: "Rules" }, { id: "used", label: "Where it's used" }, { id: "usage", label: "Usage" },
];

const EX = {
  score: { rows: [{ label: "Physical Health", value: 48, delta: 2, score: true }], note: <>Jun 2025: <b>46</b> → now <b>48</b></>, body: "Some areas are asking more of you. Small steps on the lowest Drivers move this most." },
  series: { head: "Sleep", rows: [{ label: "You", value: 74, score: true, color: ds.graph.purple }, { label: "Team Score", value: 61, score: true, tag: "team-a@company.com" }, { label: "Org", value: 57, score: true }] },
  count: { head: "Aug 2026", rows: [{ label: "Flourishing", text: "16%", delta: 3, color: ds.status.success.graph, valueColor: ds.status.success.textIndicator }], note: "23 of 146 people · +3 points on the round before" },
  compare: { head: "Your mental well-being", rows: [{ label: "Aug 2026", text: "Mild", color: ds.likert.good, valueColor: ds.likert.good }], compare: { rows: [{ label: "Mar 2026", text: "Moderate", color: ds.likert.neutral, valueColor: ds.likert.neutral }] } },
  population: { rows: [{ label: "Female", text: "57 people", color: ds.graph.hotPink }], note: "57% of the total" },
};
const Stage = ({ children }) => <div style={{ background: ds.bg.primary, borderRadius: 16, padding: 32, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>{children}</div>;
const Static = ({ content }) => <TipBox content={content} style={{ position: "relative", pointerEvents: "auto" }} />;

const PARTS = [
  { id: "card", name: "Card", note: "surface/General/tooltip, radius/lg, 12 / 16 padding, 8 between parts, shadow-sm, 180 to 240px wide.", find: (r) => [r.querySelector('[data-part="tip"]')] },
  { id: "head", name: "Heading", note: "Optional. What the tooltip is about: a part, a round. Text xs / Semibold, upper case, text/tertiary.", find: (r) => [r.querySelector('[data-part="tip-head"]')] },
  { id: "row", name: "Row", note: "A 2px rail in the row's colour; the label Text xs / Semibold; an optional change; the value Text md / Bold.", find: (r) => [r.querySelector('[data-part="tip-row"]')] },
  { id: "note", name: "Note", note: "Optional. Text 2xs / Regular, text/secondary: the round before, a count, a share.", find: (r) => [r.querySelector('[data-part="tip-note"]')] },
];

export default function TooltipsDoc() {
  return (
    <>
      <Section id="overview" title="Overview" lead="There is one tooltip. Every chart that has something to say on hover says it in this card, with the same parts in the same order.">
        <Prose>
          <p>It comes from the Figma Story tooltips (the Breakdown radar and the Comparison area chart). The widget charts, the Stories, the Heat Map and Response Analysis Scopes and the Index all use it. On a phone, where there's no hover, the same card is laid flat in the page under the chart when something is tapped.</p>
          <p>A tooltip only repeats and details what the chart already shows: the exact value, its change, its share, the round before. It never says something the chart doesn't.</p>
        </Prose>
      </Section>

      <Section id="examples" title="Examples" lead="The real component, with the kinds of content it carries.">
        <Stage>
          <Variant title="A score, with its change, the round before and a sentence"><Static content={EX.score} /></Variant>
          <Variant title="Several series at one point"><Static content={EX.series} /></Variant>
          <Variant title="A share, with a note"><Static content={EX.count} /></Variant>
          <Variant title="With “Compared to”"><Static content={EX.compare} /></Variant>
          <Variant title="A population (Composition)"><Static content={EX.population} /></Variant>
        </Stage>
      </Section>

      <Section id="anatomy" title="Anatomy" lead="Numbered on the live card, then measured from the browser.">
        <Anatomy parts={PARTS} width={1040}><div style={{ display: "flex" }}><Static content={{ head: "Physical Health", rows: [{ label: "Your Score", value: 48, delta: 2, score: true }], note: <>Jun 2025: <b>46</b> → now <b>48</b></> }} /></div></Anatomy>
      </Section>

      <Section id="spec" title="Specification">
        <SpecTable head={["Part", "Property", "Value"]} widths={["18%", "22%", "60%"]} rows={[
          ["Card", "Surface", "color/surface/General/tooltip, radius/lg, shadow-sm; padding 12 top and bottom, 16 sides; 8 between parts; 180 to 240px wide."],
          ["Heading", "Text", "Text xs / Semibold, upper case, text/tertiary. Optional."],
          ["Row", "Rail", "2px on the left in the row's colour: a series' colour, a group's colour, or the score's status graph colour. 2px above and below, 6px to the text."],
          ["", "Label", "Text xs / Semibold, text/primary; an optional tag pill under it (Text 3xs, a 1px border/primary outline)."],
          ["", "Change", "Optional. The TrendPill in its number-only form."],
          ["", "Value", "Text md / Bold, tabular figures. A 0 to 100 score is in its band's text-indicator colour; anything else (counts, shares, money, levels) is text/primary or the level's own colour."],
          ["Compared to", "Text", "Optional. Text 3xs / Semibold, upper case, text/quaternary, then its own rows."],
          ["Note", "Text", "Optional. Text 2xs / Regular, text/secondary; numbers in it may be bold."],
          ["Body", "Text", "Optional. Text xs / Regular, text/primary: one sentence about what the value means (the radar's band sentence)."],
        ]} />
      </Section>

      <Section id="content" title="Content model" lead="A tooltip is data; the component draws it.">
        <CodeBlock label="Content" code={`{
  head?: "Physical Health",                 // what it's about
  rows: [{ label, value, text?, delta?, color?, score?, valueColor?, tag? }],
  compare?: { head?: "Compared to", rows: [...] },
  note?: "Jun 2025: 46 → now 48",            // string or JSX
  body?: "Some areas are asking more of you.",
}`} />
        <SimpleTable head={["Field", "Use"]} widths={["20%", "80%"]} rows={[
          ["score: true", "Colours the value by its status band. Only for 0 to 100 scores."],
          ["text", "Shown instead of the value: “57 people”, “16%”, “$93K a year”, “Mild”."],
          ["color", "The rail. Defaults to the band colour for a score, else border/strong."],
          ["valueColor", "Overrides the value's colour (a level's own colour)."],
        ]} />
      </Section>

      <Section id="placing" title="Where it opens" lead="Three ways to show the same card.">
        <SimpleTable head={["Component", "When", "How"]} widths={["20%", "30%", "50%"]} rows={[
          ["useChartTip()", "Widgets and most charts", "Follows the pointer, portalled to document.body, so a card's overflow never clips it. Opens above the pointer, below it near the top of the window, and stays inside the window sideways."],
          ["<TipBox>", "A chart that anchors it to a point", "Absolutely placed by the chart (the radar's spoke, a line's round, a bar's segment), flipped to stay inside the chart."],
          ["<TipBox flat>", "A phone (no hover)", "Laid in the page under the chart when something is tapped: no shadow, full width. It stays until tapped again."],
        ]} />
      </Section>

      <Section id="rules" title="Rules">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>Do</span><List items={["Use the component; never draw a card by hand.", "Repeat what the chart shows, exactly: the value, its change, its share, the round before.", "Name the round or the part in the heading.", "Give every row a rail in the colour it has on the chart.", "On a phone, show the same card flat under the chart on tap."]} /></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>Don't</span><List items={["Use another size, padding, radius, colour or font weight for a tooltip.", "Put something in a tooltip the chart doesn't show (a new conclusion, a call to action).", "Put a link or button in a tooltip: it disappears when the pointer leaves.", "Let a tooltip be the only way to read a number: the Table View or the evidence carries it too."]} /></div>
        </Two>
        <Callout title="Not tooltips">The Heat Map's column header cards and the Relationship Stories' hover line are part of their layouts (they push or label the content) and aren't covered here.</Callout>
      </Section>

      <Section id="used" title="Where it's used">
        <SimpleTable head={["Where", "Charts"]} widths={["24%", "76%"]} rows={[
          ["Widgets", "Bars (Comparison, Score by Group), columns, tiles, treemap, donut (Composition), line graph (Score History), Index ring"],
          ["Stories", "Radar (Breakdown, Comparison), area (Breakdown, Comparison), Score Over Time, State Over Time, Status Over Time, Level Over Time, eNPS Over Time, How People Moved, Priority Map, phone details"],
          ["Full-view Scopes", "Heat Map tiles"],
        ]} />
      </Section>

      <Section id="usage" title="Usage">
        <CodeBlock label="Follow the pointer" code={`const tip = useChartTip();\n<rect {...tip.bind({ head: "Aug 2026", rows: [{ label: "Org Score", value: 57, delta: 3, score: true }] })} />\n{tip.node}`} />
        <CodeBlock label="Placed by the chart, or flat on a phone" code={`<TipBox style={{ position: "absolute", left, top, transform }} content={content} />\n<TipBox flat content={content} />`} />
        <Prose><p style={{ ...dsText("Text xs"), color: ds.text.tertiary, margin: `${dsSpace[8]}px 0 0` }}>Source: components/widgets/ChartTip.jsx.</p></Prose>
      </Section>
    </>
  );
}
