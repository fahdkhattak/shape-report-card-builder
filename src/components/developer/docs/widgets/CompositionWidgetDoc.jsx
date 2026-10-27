import { makeWidgetDoc, findOne } from "../widgetDoc.jsx";
import { Prose } from "../../docKit.jsx";
import { SimpleTable } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { compositionFit } from "../../../../lib/insightRules.js";

/* ================================================================== */
/* THE COMPOSITION WIDGET — how a whole splits into its groups          */
/* (widgets/ChartInsight.jsx CompositionInsight): people by any way of   */
/* grouping them, or time and money by part. The form follows the count  */
/* (lib/insightRules.js compositionFit).                                 */
/* ================================================================== */
const FORM_NAME = { grid: "Stacked grid + bar", donut: "Donut" };

function Rules() {
  const cases = [["4 or fewer", 4], ["5 to 7", 6], ["More than 7", 8]];
  return (
    <>
      <SimpleTable head={["Groups", "1x1", "2x2"]} widths={["24%", "38%", "38%"]} rows={cases.map(([label, n]) => {
        const fit = compositionFit(n);
        return [label, fit["1x1"] ? fit["1x1"].map((f) => FORM_NAME[f]).join(" or ") : "Not allowed: escalate to a 2x2", fit["2x2"].map((f) => FORM_NAME[f]).join(" or ")];
      })} />
      <Prose>
        <p>A composition counts: how many people are in each group, or how many hours or dollars sit in each part. It never shows a score. To compare a <b>score</b> between groups, use <DocLink id="widget-score-by-group">Score by Group</DocLink> (bars, 2 to 4 groups in a 1x1, 5 or more in a 2x2).</p>
        <p>Any way of grouping people works (gender, work model, location, job level, department, employment status, tenure…), and so does any total that splits into parts, such as the time and money people would get back if scores reached Flourishing.</p>
      </Prose>
    </>
  );
}

export const { meta, toc, Page } = makeWidgetDoc({
  id: "widget-composition", familyId: "composition", name: "Composition", presets: true,
  blurb: "How a population splits across a way of grouping people, or a total across its parts. The number of groups decides the form: a grid or a donut up to four, a donut up to seven, a 2x2 donut past that.",
  source: "components/widgets/ChartInsight.jsx (CompositionInsight, TileGrid, DonutInsight) · lib/insightRules.js (compositionFit) · scope/stories/DonutChart.jsx (segmentColor)",
  purpose: {
    does: "answers “who makes up this population?” (or “what is this total made of?”): every group with how many it holds, and which is largest.",
    boundary: "counts and shares, never scores. Hover a part for how many people (or hours, or dollars) it holds and its share.",
    where: "the Library's Composition group; the Widget Builder's Composition form; the time and money Scopes.",
  },
  extra: [{ id: "rules", label: "Which form", lead: "The number of groups decides the form and the size. Read from lib/insightRules.js, so this table is the rule.", render: () => <Rules /> }],
  anatomy: [
    { familyId: "composition", form: 0, parts: [
      { id: "header", name: "Header", note: "“{Grouping} Composition”.", find: findOne('[data-part="widget-header"]') },
      { id: "tile", name: "Tile", note: "A 2px rail in the group's colour, the name 11 / Regular, the count 16 / Bold in the group's colour.", find: findOne('[data-part="tile-grid"] > div > div') },
      { id: "bar", name: "Proportion bar", note: "8px, each group's share in its colour, segments touching.", find: findOne('[data-part="tile-grid"] > div[role="img"]') },
    ] },
    { familyId: "composition", form: 6, parts: [
      { id: "ring", name: "Ring (Insight)", note: "Segments from 12 o'clock, clockwise; the grouping's icon and name in the middle.", find: findOne('[data-part="ring"]') },
      { id: "largest", name: "Largest Group (Evidence)", note: "Or the legend, never both.", find: findOne('[data-part="section-evidence"]') },
    ] },
  ],
  spec: [
    ["Grid", "Tiles", "Two columns, 6px apart, 40px tall on bg/primary; 2px rail in the group's Graph colour; name 11 / Regular text/secondary; value 16 / Bold in the group's colour, any unit (“$”, “K”, “hrs”) 11 / Regular text/primary."],
    ["", "Bar", "8px, fully rounded, the groups' shares in their colours with no gap; 12px under the tiles."],
    ["Donut 1x1", "Insight", "The ring, 72px, bare, centred."],
    ["", "Evidence Bar", "One thing: a two-column legend (up to 4 groups: 2px rail + name, 12px rows) or the Largest Group line (“Largest Group” over “Name (32%)”: the name truncates, the share never does)."],
    ["Donut 2x2", "Insight", "The ring, 196px, with the grouping's icon and name in the middle."],
    ["", "Evidence Section", "One thing: the Largest Group line, or a three-column legend of up to 15 groups (12px rows, 2px apart). Never both."],
    ["Colour", "Per group", "The group's Graph colour (DonutChart.jsx segmentColor), the same in its Score by Group bars."],
  ],
  behaviour: [
    ["Hover a tile, a bar segment or a slice", "Tooltip: the group, how many it holds (“155 people”, “19 hrs per person”, “$26K a year”) and its share; the other parts fade."],
    ["Hover a legend row", "Highlights its slice."],
    ["Change Widget", "Cycles the forms."],
  ],
  opens: { what: "for people, the Composition Story for that grouping (who is in each group and how each scores); for time and money, the Time or Money Impact Scope.", stories: [["Composition", "composition"]] },
  states: [["One group", "Not offered: a composition needs two."], ["More than 7 groups", "A 2x2 donut only."], ["A small group", "Counted and drawn; a composition never shows a score, so the 5-person rule doesn't hide it."]],
  content: [["Title", "“{Grouping} Composition”: Gender, Work, Location, Job Level, Departments, Time, Money."], ["Counts", "Whole numbers; money rounded to thousands (“$26K”)."]],
  a11y: ["The bar has a text alternative listing every share. The ring has an aria-label with every group and its share."],
  usageCode: `import { CompositionInsight } from "components/widgets/ChartInsight.jsx";\n\n// rows: [{ group, n, pct }]; form: "grid" | "donut" (a grid is only drawn for 4 groups or fewer)\n<CompositionInsight rows={rows} axisKey="gender" label="Gender" size="1x1" form="grid" />\n<CompositionInsight rows={money} axisKey="impactMoney" label="Money" size="1x1" form="donut" format={fmtMoney} tipText={(v) => \`\${fmtMoney(v)} a year\`} />`,
  done: ["The form and size follow the count (the table above).", "Every part shows how many it holds on hover.", "A group keeps one colour in its Composition and its Score by Group."],
});
export default Page;
