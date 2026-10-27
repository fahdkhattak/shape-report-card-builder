import { makeWidgetDoc, findOne, LiveWidget, WidgetStage } from "../widgetDoc.jsx";
import { Prose, Variant } from "../../docKit.jsx";
import { SimpleTable, T } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { ds, dsSpace } from "../../../../lib/ds.js";
import { WHO, WHAT, SCORE_ELEMENTS, defaultElements } from "../../../../lib/scoreWidget.js";
import { scoreWidget, TEAM_NOTE, SMALL_NOTE, POPULATIONS } from "./subjectExamples.js";

/* ================================================================== */
/* THE SCORE WIDGET — one card for any subject (lib/scoreWidget.js,      */
/* widgets/ScoreCard.jsx). The Library's Org Score, Your Score, Team      */
/* Score and Explorer Score are fixed presets of it.                      */
/* ================================================================== */
const card = { id: "card", name: "Card", note: "The shared widget shell.", find: (r) => [r.querySelector("[data-widget-id] > div")] };
const header = { id: "header", name: "Header", note: "Who + what: “Org Score”, “Your Sleep Score”. Two lines at most.", find: findOne('[data-part="widget-header"]') };
const number = { id: "number", name: "Score", note: "64px / 700, coloured by band (54px when the title takes two lines on a 1x1).", find: findOne('[data-part="score-number"]') };
const trend = { id: "trend", name: "Change", note: "Since the round before. Caret only on the 1x1.", find: findOne('[data-part="trend"]') };
const unit = { id: "unit", name: "Unit", note: "“/100”, from the survey's scale.", find: findOne('[data-part="unit"]') };
const date = { id: "date", name: "Round date", note: "When the latest round closed.", find: findOne('[data-part="date"]') };
const headcount = { id: "headcount", name: "Headcount and participation", note: "Populations only.", find: findOne('[data-part="headcount"]') };
const bar = { id: "bar", name: "Status bar", note: "People (a population) or parts (one person) per band.", find: findOne('[data-part="status-bar"]') };

const yes = <span style={{ color: ds.status.success.textIndicator, fontWeight: 600 }}>Yes</span>;
const no = (why) => <span style={{ color: ds.text.tertiary }} title={why}>No · {why}</span>;
const who0 = WHO[0], what0 = WHAT[0];

function Model() {
  return (
    <>
      <Prose>
        <p>There is <b>one</b> Score widget. The same card shows the organisation's score, a team's, a group's (a department, an age band, a work model…), one person's, or the score of a cluster, an Explorer or a Driver. Two things decide what goes on it: <b>who</b> it's about and <b>what</b> score it is. The card always stays on the score and a little of what it means; when the parts matter, use the <DocLink id="widget-index">Index</DocLink>.</p>
      </Prose>
      <SimpleTable head={["Who", "Covers", "Notes"]} widths={["18%", "22%", "60%"]} rows={WHO.map((w) => [w.name, w.people ? "A population of people" : "One person", w.note])} />
      <SimpleTable head={["What", "Its parts", "Notes"]} widths={["18%", "22%", "60%"]} rows={WHAT.map((w) => [w.name, w.parts || "None", w.note])} />
    </>
  );
}

function Elements() {
  const cell = (e, who, what) => { const r = e.can(who, what); return r === true ? yes : no(r); };
  return (
    <>
      <SimpleTable
        head={["Element", ...WHO.map((w) => w.name), ...WHAT.map((w) => w.name)]}
        widths={["20%", ...Array(8).fill("10%")]}
        rows={SCORE_ELEMENTS.map((e) => [<span key={e.id}><b>{e.name}</b><span style={{ display: "block", color: ds.text.tertiary }}>{e.note}</span></span>, ...WHO.map((w) => cell(e, w, what0)), ...WHAT.map((w) => cell(e, who0, w))])}
      />
      <Prose>
        <p>Who decides the counts (headcount, participation, people by status); what decides the parts. A card may carry anything marked Yes for both its who and its what, and never anything else: <code>ScoreCard</code> drops an element that isn't allowed even if a form asks for it, so a personal card can't grow a headcount.</p>
        <p><b>Defaults.</b> A 1x1 has room for one line under the date: a population shows its headcount (and participation where invites are known), one person their status. A 2x2 has room for one evidence bar: a population shows how its <b>people</b> split across the statuses (who is where matters most for a group), one person how their <b>parts</b> split. So the default Org Score is {defaultElements("org", "overall", "2x2").join(", ")}; the default Your Score is {defaultElements("person", "overall", "2x2").join(", ")}.</p>
        <p><b>Privacy.</b> A team or group under five people never shows a score: the card says so and nothing else.</p>
      </Prose>
    </>
  );
}

function Subjects() {
  const show = (label, w, note) => <Variant key={w.id} title={label} note={note}><WidgetStage pad={24}><LiveWidget widget={w} fit /></WidgetStage></Variant>;
  const grp = POPULATIONS.group.label;
  return (
    <>
      <Prose><p>Real numbers from the SHAPE survey dataset (150 people, latest round), drawn by the one component. Hover any card for its menu.</p></Prose>
      <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>
        {show("Organisation · overall", scoreWidget("org", "overall"), "Headcount, participation and how people split.")}
        {show(`Group (${grp}) · overall`, scoreWidget("group", "overall"), "The same, for one department.")}
        {show("Person · overall", scoreWidget("person", "overall"), "Status and how their Explorers split. No counts.")}
        <Variant title="Team · overall" note={TEAM_NOTE}><WidgetStage pad={24}><LiveWidget familyId="team-score" formIndex={1} fit /></WidgetStage></Variant>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>
        {show("Organisation · cluster", scoreWidget("org", "cluster"), "Rest and Recovery: Sleep, Stress, Exercise, Nutrition.")}
        {show("Organisation · Explorer", scoreWidget("org", "explorer"))}
        {show("Organisation · Driver", scoreWidget("org", "driver"), "People still split; a Driver has no parts.")}
        {show("Person · Explorer", scoreWidget("person", "explorer"), "Their status and how their Drivers split.")}
        {show("Person · Driver", scoreWidget("person", "driver"), "Just the score and its status: nothing to split.")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>
        {show("1x1 · organisation", scoreWidget("org", "overall", "1x1"))}
        {show(`1x1 · ${grp}`, scoreWidget("group", "explorer", "1x1"))}
        {show("1x1 · person", scoreWidget("person", "overall", "1x1"))}
        {show("1x1 · person · Driver", scoreWidget("person", "driver", "1x1"))}
        {POPULATIONS.small && show("Group under 5 people", scoreWidget("small", "overall", "1x1"), SMALL_NOTE)}
      </div>
    </>
  );
}

export const { meta, toc, Page } = makeWidgetDoc({
  id: "widget-score", familyIds: ["org-score", "your-score", "team-score", "explorer-score"], name: "Score",
  blurb: "One card for any score: the organisation's, a team's, a group's, a person's, a cluster's, an Explorer's or a Driver's. Who and what it's about decide what else it carries.",
  source: "components/widgets/ScoreCard.jsx · lib/scoreWidget.js (the rules) · WidgetBody.jsx and shape/shapeWidgets.jsx (the presets)",
  purpose: {
    does: "answers “how is this score doing?” in one look: the number, its change, its status, and a little of what backs it (who it covers, or how its parts split).",
    boundary: "stays on one score. It never explains why (that's the Scope), never lists the parts by name (that's the Index or Explorers), and never shows what doesn't apply to its subject.",
    where: "first on every report (the Org report's “Start here” card, the personal report's Your Score), the Library's Score group, and the Widget Builder's Score form for any topic.",
  },
  extra: [
    { id: "model", label: "One widget, any subject", lead: "Who it's about × what score it is.", render: () => <Model /> },
    { id: "elements", label: "What it can show", lead: "Every element, and for which subjects. Read from lib/scoreWidget.js, so this table is the rule.", render: () => <Elements /> },
    { id: "subjects", label: "Every subject", lead: "The one card, live, for each who × what.", render: () => <Subjects /> },
  ],
  anatomy: [
    { familyId: "org-score", form: 0, parts: [card, header, number, trend, unit, date, headcount, bar, { id: "counts", name: "People by status", note: "Each band's count with a people icon.", find: findOne('[data-part="status-counts"]') }] },
    { familyId: "your-score", form: 3, parts: [card, header, number, trend, unit, date, { id: "chip", name: "Status", note: "The status chip: face and word.", find: findOne('[data-part="status-chip"]') }, bar, { id: "parts", name: "Parts by status", note: "“Across the 12 Explorers, …”", find: findOne('[data-part="parts-sentence"]') }] },
  ],
  spec: [
    ["Score", "Number", <span key="n">64px / 700, letter-spacing −2%, line-height 0.82, in the band's text-indicator colour ({T("status/error/text-indicator")} for Struggling). 54px on a 1x1 whose title takes two lines.</span>],
    ["", "Change", "20px pill, fully rounded. 2x2: caret, the signed number and “since last round”. 1x1: caret only. No change: grey with a dash."],
    ["", "Unit", "11px, text/primary, under the pill at the number's right edge."],
    ["Date", "Text", "11px. “NOV 17, 2025”."],
    ["Status", "Chip", "18px face and the status word, 11px / 700 in the band's strong text colour, on the band's bg."],
    ["Headcount", "Row", "A people icon and the bold count; a participation icon and the bold percent (left out when invites aren't known). Labels (“Employees”, “Team Members”, “People”) on the 2x2 only."],
    ["Status bar", "Bar", "8px tall, one segment per band in its graph colour, widths by share. 2x2 only."],
    ["People by status", "Row", "Three columns: band name over its count (16px / 700) and a 14px people icon."],
    ["Parts by status", "Statement", "6px under the bar. Text 3xs / Regular (11 / 16) in text/tertiary; the total bold in the same grey; each count bold in its band's status/*/text colour; “is” / “are” for each band."],
    ["Layout", "2x2", "Number centred in the free space; date, status, headcount, bar and counts stacked at the foot, 8 and 12px apart."],
  ],
  behaviour: [
    ["Click (on a report)", "Opens that score's Scope beside the report (or as a sheet on a phone)."],
    ["Change Widget", "Moves between the Library presets of the same persona."],
  ],
  opens: {
    what: "the Scope for that score: what it means, what's behind it, what moved, and what to do.",
    stories: [["Score Meaning", "score-meaning"], ["Breakdown", "breakdown"], ["What Stands Out", "diagnostic"], ["What Changed", "diagnostic"], ["Score History", "trend"], ["Methodology", "methodology"]],
  },
  states: [
    ["Each band", "The number, change and status change colour with the band."],
    ["First round", "No change pill."],
    ["No change", "Grey pill with a dash."],
    ["Group or team under 5 people", "No number: “Not shown” and a privacy line."],
    ["Invites not known for the population", "Headcount without a participation rate."],
    ["A person", "Never a headcount, participation or people split."],
    ["A Driver", "Never a parts split."],
  ],
  content: [
    ["Title", "Who + what: “Org Score”, “Your Score”, “IT Group Score”, “Physical Health Score”, “Your Sleep Score”, “IT Group · Sleep Score”."],
    ["Numbers", "Whole numbers. Participation as a whole percent."],
    ["Change", "“+3 since last round”: the sign always shown; no “points”."],
    ["Status words", "Flourishing, Striving, Struggling, capitalised."],
  ],
  a11y: [
    "The status bar has no text of its own: the counts or sentence under it carry the same information.",
    "On a 1x1 (caret only) the card needs an accessible description such as “57, up 3 since last round”.",
  ],
  usageCode: `import ScoreCard from "components/widgets/ScoreCard.jsx";\n\n// who: "org" | "team" | "group" | "person"; what: "overall" | "cluster" | "explorer" | "driver"\n<ScoreCard size="2x2" who="group" what="explorer"\n  data={{ value: 61, delta: 3, date: "2026-08-14", n: 23, people: { f: 4, s: 9, t: 10 }, parts: { f: 1, s: 2, t: 2 }, partsNoun: "Drivers" }} />\n\n// As a widget on any report:\nconst widget = { id: "w1", kind: "score", size: "2x2", who: "group", what: "explorer", title: "IT Group · Physical Health Score", data };`,
  usageNote: <Prose><p>Pass what you have; the card decides what it may show. To force a smaller card, pass <code>show</code> (a list of element ids); anything not allowed for the subject is still dropped.</p></Prose>,
  done: [
    "The card shows only what its who × what allows (the table above).",
    "The number, change and counts match the latest round for that subject.",
    "A group or team under 5 shows no number.",
    "The title names who and what.",
  ],
});
export default Page;
