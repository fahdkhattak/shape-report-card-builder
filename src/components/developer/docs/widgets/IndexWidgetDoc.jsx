import { makeWidgetDoc, LiveWidget, WidgetStage } from "../widgetDoc.jsx";
import { Prose, Variant } from "../../docKit.jsx";
import { SimpleTable } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { ds, dsSpace } from "../../../../lib/ds.js";
import { WHAT, indexSizes, INDEX_LAYERS } from "../../../../lib/scoreWidget.js";
import { indexWidget, POPULATIONS } from "./subjectExamples.js";

/* ================================================================== */
/* THE INDEX — one widget for any score that breaks down into parts      */
/* (lib/scoreWidget.js, widgets/RingIndex.jsx). 2x2 = one layer deeper,   */
/* 3x3 = two. Formerly "Wellbeing Index" and "Explorer Index".            */
/* ================================================================== */
function Layers() {
  return (
    <>
      <Prose>
        <p>The Index is the same score as the <DocLink id="widget-score">Score</DocLink> card, with its parts around it. Where the Score card stays on the number and a little of its meaning, the Index shows one or two layers deeper, so you can see which parts carry the score and which hold it back. It works for anyone the Score card does (the organisation, a team, a group, one person), and for any score that has parts.</p>
      </Prose>
      <SimpleTable head={["Size", "What it draws"]} widths={["16%", "84%"]} rows={Object.entries(INDEX_LAYERS)} />
      <SimpleTable head={["Score", "Layers under it", "Sizes", "Ring"]} widths={["18%", "18%", "16%", "48%"]} rows={WHAT.map((w) => {
        const sizes = indexSizes(w.id);
        return [w.name, String(w.layers), sizes.length ? sizes.join(", ") : <span key={w.id} style={{ color: ds.text.tertiary }}>No Index</span>, w.id === "overall" ? "Explorers; at 3x3, each Explorer's Drivers outside" : w.parts ? w.parts : "Nothing below it: use the Score card"];
      })} />
      <Prose><p>The ring holds up to 20 parts on a 2x2 (named while there are 12 or fewer) and 12 on a 3x3, whose outer ring holds the parts of each. Names and scores sit inside their slice only where they fit; hover any slice for its name, score and change.</p></Prose>
    </>
  );
}

function Subjects() {
  const show = (label, w, note) => <Variant key={w.id} title={label} note={note}><WidgetStage pad={24}><LiveWidget widget={w} fit /></WidgetStage></Variant>;
  return (
    <>
      <Prose><p>Real numbers from the SHAPE survey dataset (150 people, latest round), drawn by the one component.</p></Prose>
      <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>
        {show("Organisation · overall · 2x2", indexWidget("org", "overall"), "The twelve Explorers.")}
        {show("Person · overall · 2x2", indexWidget("person", "overall"), "Their own Explorers.")}
        {show(`Group (${POPULATIONS.group.label}) · overall · 2x2`, indexWidget("group", "overall"))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>
        {show("Organisation · Explorer · 2x2", indexWidget("org", "explorer"), "Physical Health and its Drivers. One layer, so 2x2 only.")}
        {show("Organisation · cluster · 2x2", indexWidget("org", "cluster"), "Rest and Recovery: four Drivers.")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>
        {show("Organisation · overall · 3x3", indexWidget("org", "overall", "3x3"), "Explorers, and each one's Drivers outside.")}
        {show("Person · overall · 3x3", indexWidget("person", "overall", "3x3"))}
      </div>
    </>
  );
}

export const { meta, toc, Page } = makeWidgetDoc({
  id: "widget-index", familyId: "index", name: "Index",
  blurb: "Any score with parts: the score in the centre and its parts around it, one layer deep on a 2x2, two on a 3x3.",
  source: "components/widgets/RingIndex.jsx (Index) · lib/scoreWidget.js (indexSizes) · lib/subjectForms.js (the builder's Index form)",
  purpose: {
    does: "answers “what is this score made of?”: every part's score around the whole, coloured by status, so the weak and strong parts read at a glance.",
    boundary: "describes, it doesn't rank or explain. A Driver has no parts, so it has no Index.",
    where: "the Library's Score group, the Widget Builder (Index form, for the organisation, an Explorer or a cluster), and the Explorer layer of a report.",
  },
  extra: [
    { id: "layers", label: "Layers and sizes", lead: "How deep it goes depends on the score.", render: () => <Layers /> },
    { id: "subjects", label: "Every subject", lead: "The one ring, live, for each who × what that has parts.", render: () => <Subjects /> },
  ],
  spec: [
    ["Centre", "Score", "A white disc Ø111 with the score at 64 / 700 in the status's text colour."],
    ["Ring", "Slices", "Equal slices, 1px white dividers, each tinted by its status. Name in the outer half, score (12 / 700) in the inner half, both only where they fit."],
    ["Rim", "Edge", "3px in the status colour of the outermost ring's slice."],
    ["3x3", "Outer ring", "Each part's own parts as cells; their names outside on a short tick when there are 25 or fewer, scores inside cells wide enough."],
  ],
  behaviour: [["Hover or tap a slice", "It stays lit, the rest dim, and the chart tooltip names it with its score and change."]],
  states: [
    ["A score with one layer", "2x2 only."],
    ["A Driver", "No Index; the builder offers the Score card."],
    ["More than 12 parts", "Scores only on the slices, names in the tooltip."],
    ["A part with no score", "Left out of the ring."],
  ],
  a11y: ["The ring is an image with a label listing every part and its score."],
  usageCode: `import { Index } from "components/widgets/RingIndex.jsx";\n\n// wedges: the score's parts; sub: their parts (drawn at 3x3 only)\n<Index size="2x2" center={61} title="Org Index"\n  wedges={[{ label: "Physical Health", value: 58, prev: 55, sub: [{ label: "Sleep", value: 49 }] }, …]} />`,
  usageNote: <Prose><p>Check the size against <code>indexSizes(what)</code>: a score with one layer of parts can only be a 2x2.</p></Prose>,
  done: [
    "Only scores with parts get an Index; one layer → 2x2 only, two layers → 2x2 or 3x3.",
    "Every slice's colour matches its status; names and scores never spill out of their slice.",
  ],
});
export default Page;
