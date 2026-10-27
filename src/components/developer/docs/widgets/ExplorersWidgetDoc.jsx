import { makeWidgetDoc, find, findOne } from "../widgetDoc.jsx";

const card = { id: "card", name: "Card", note: "The shared widget shell.", find: (r) => [r.querySelector("[data-widget-id] > div")] };
const header = { id: "header", name: "Header", note: "The title.", find: findOne('[data-part="widget-header"]') };
const tier = { id: "tier", name: "Tier label", note: "Great, Average or Poor: the survey's bands, top to bottom.", find: find('[data-part="tier-label"]') };
const row = { id: "row", name: "Row", note: "Name, change and score, with a 2px rule in the band colour.", find: find('[data-part="row"]') };
const more = { id: "more", name: "More line", note: "How many weren't shown. Pinned to the foot.", find: findOne('[data-part="more"]') };

export const { meta, toc, Page } = makeWidgetDoc({
  id: "widget-explorers", familyId: "explorers", name: "Explorers",
  blurb: "Every Explorer (the first level under the overall score) ranked and grouped into Great, Average and Poor, so what's holding the score back is visible at a glance.",
  source: "components/widgets/WidgetBody.jsx (RankedList) · widgets/primitives.jsx (DriverGroupedList, DriverRow)",
  purpose: {
    does: "answers “which areas are strong and which are holding us back?” by ranking the overall score's children and grouping them by band.",
    boundary: "the first level only (the Drivers widget is the same pattern for the level below). It ranks; it doesn't explain or compare groups of people.",
    where: "the Org report, and the Library's “Explorers & Drivers” group. The same component draws the Drivers widget.",
  },
  forms: ["Up to two rows from each tier (strongest Great, middle Average, weakest Poor), each with its change, then “N more Explorers”.", "The strongest and the weakest only, under Great and Poor, then “N more Explorers”."],
  anatomy: [
    { form: 0, parts: [card, header, tier, row, more] },
    { form: 1, parts: [card, header, tier, row, more] },
  ],
  spec: [
    ["Tier label", "Text", "13px / 700 in the band's base colour (green / amber / red graph colour). Rows 4px below; tiers 6px apart."],
    ["Row", "Layout", "20px tall, a 2px left rule in the band colour, 6px in from it. Name 11px / 600 (ellipsis), then the change (caret and number only, 2x2), then the score 16px / 700 in the band's text colour."],
    ["Which rows", "2x2", "Up to two per tier (Great: the strongest; Average: the middle two; Poor: the weakest), topped up to six from the rest, then sorted strongest first. A Poor row is never hidden to make room."],
    ["", "1x1", "Strongest and weakest only; no change numbers (the design drops them for room)."],
    ["More line", "Text", "11px, text/tertiary, a 2px border/strong rule on the left. “6 more Explorers”."],
  ],
  behaviour: [
    ["Click (on a report)", "Doesn't open a Scope: it takes the whole report one layer deeper, to one ring card per Explorer (“Org Report › Explorers”). Each ring card opens that Explorer's own Scope."],
    ["Click (elsewhere)", "Opens the Explorers Scope."],
    ["Change Widget", "Swaps between the 2x2 and the 1x1."],
  ],
  opens: {
    what: "on a report, the Explorers layer; each Explorer's Scope holds Score Meaning (ring), a Breakdown of its Drivers (area chart), What Stands Out and Actions. Elsewhere, the Explorers Scope:",
    stories: [["Breakdown", "breakdown"], ["What Stands Out", "diagnostic"], ["What Changed", "diagnostic"], ["Priority Map", "diagnostic"], ["Explorer History", "trend"], ["Actions", "actions"], ["Methodology", "methodology"]],
  },
  states: [
    ["No Explorer in a tier", "That tier's label isn't shown."],
    ["Every Explorer Poor", "Only the Poor tier, with up to six rows, strongest first."],
    ["First round", "No change numbers on the rows."],
    ["An Explorer suppressed or not asked", "Left out, and not counted in “N more”."],
    ["Another survey", "The tier names stay Great / Average / Poor; the noun (“Explorers”) and the band lines come from the survey."],
  ],
  content: [
    ["Names", "Explorer names as the survey writes them, never shortened by hand (the row ellipsises, the full name is on hover)."],
    ["More line", "“N more Explorers”, with the survey's plural noun."],
  ],
  a11y: [
    "Each row reads as one sentence (“Coworker Dynamic, 84, up 2”): the colour rule and the caret are decorative.",
  ],
  done: [
    "Rows come from the latest round, ranked strongest first, grouped by band.",
    "The weakest Explorer is always on the card.",
    "“N more” counts the Explorers not shown, and nothing suppressed.",
    "On a report, clicking enters the Explorers layer instead of opening a Scope.",
  ],
});
export default Page;
