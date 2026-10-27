import { makeWidgetDoc, findOne, LiveWidget, WidgetStage } from "../widgetDoc.jsx";
import { Prose, Variant } from "../../docKit.jsx";
import { SimpleTable } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { ds, dsSpace } from "../../../../lib/ds.js";
import { WHO, STATUS_ELEMENTS, statusBreakdown, statusWhats } from "../../../../lib/scoreWidget.js";
import { statusWidget, TEAM_NOTE, SMALL_NOTE, POPULATIONS } from "./subjectExamples.js";

/* ================================================================== */
/* THE STATUS WIDGET — one card for any subject (lib/scoreWidget.js,     */
/* widgets/StatusCard.jsx), like the Score. The Library's Org, Your and   */
/* Team Status forms are fixed presets of it.                             */
/* ================================================================== */
const header = { id: "header", name: "Header", note: "Who + what: “Org Status”, “Your Status”, “IT Group Status”.", find: findOne('[data-part="widget-header"]') };
const face = { id: "face", name: "Status", note: "1x1: the face and the status word.", find: findOne("[data-part=\"section-insight\"] > div") };
const art = { id: "art", name: "Illustration", note: "2x2: the status illustration.", find: findOne('[data-part="section-insight"] img') };
const word = { id: "word", name: "Status word", note: "20 / Bold in the band's colour.", find: findOne('[data-part="status-word"]') };
const bar = { id: "bar", name: "Breakdown bar", note: "People per band (a population) or parts per band (one person).", find: findOne('[data-part="status-bar"]') };
const counts = { id: "counts", name: "People in each band", note: "A population's 2x2.", find: findOne('[data-part="status-counts"]') };
const sentence = { id: "sentence", name: "Parts in each band", note: "One person's 2x2: “Across the 12 Explorers, …”", find: findOne('[data-part="parts-sentence"]') };

const yes = <span style={{ color: ds.status.success.textIndicator, fontWeight: 600 }}>Yes</span>;
const no = (why) => <span style={{ color: ds.text.tertiary }}>No · {why}</span>;
const BREAKDOWN_WORD = { people: "Its people", parts: "Its parts" };

function Model() {
  return (
    <>
      <Prose>
        <p>There is <b>one</b> Status widget, for the same subjects as the <DocLink id="widget-score">Score</DocLink>: the organisation, a team, a group (a department, an age band, a work model…) or one person, on the overall score, a cluster or an Explorer. There is <b>no Status widget for a Driver</b>: Drivers have no page of their own. It shows the band the score puts its subject in, Flourishing, Striving or Struggling, and a <b>breakdown bar</b> of what sits in each band.</p>
        <p><b>What the bar breaks down depends on who it's about.</b> A population (the organisation, a team, a group) always breaks down its <b>people</b>: how many are Flourishing, Striving and Struggling on that score. One person can't be split into people, so their bar breaks down the score's <b>parts</b> instead: their Explorers for their overall status, the Drivers of an Explorer (or a cluster) for that status.</p>
      </Prose>
      <SimpleTable
        head={["Who", ...statusWhats().map((w) => w.name)]}
        widths={["16%", "28%", "28%", "28%"]}
        rows={WHO.map((who) => [who.name, ...statusWhats().map((what) => (statusBreakdown(who.id, what.id) === "people" ? "People in each band" : `${what.parts} in each band`))])}
      />
    </>
  );
}

function Elements() {
  const cell = (e, who, what) => { const r = e.can(who, what); return r === true ? yes : no(r); };
  const what0 = statusWhats()[0];
  return (
    <>
      <SimpleTable
        head={["Element", ...WHO.map((w) => w.name)]}
        widths={["28%", "18%", "18%", "18%", "18%"]}
        rows={STATUS_ELEMENTS.map((e) => [<span key={e.id}><b>{e.name}</b><span style={{ display: "block", color: ds.text.tertiary }}>{e.note}</span></span>, ...WHO.map((w) => cell(e, w, what0))])}
      />
      <Prose>
        <p><b>1x1.</b> The status face and word over the breakdown bar, all in the Insight. <b>2x2.</b> The status illustration and word in the Insight; the 68px Evidence holds the bar and, under it, the count in each band (a population, 12px under the bar) or one statement (one person, 6px under the bar): “Across the 12 Explorers, 5 are Flourishing, 3 are Striving, and 4 are Struggling.”</p>
        <p><b>Privacy.</b> A team or group under five people never shows a status: the card says so and nothing else.</p>
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
        {show("Organisation · overall", statusWidget("org", "overall", "2x2"), "People in each band.")}
        {show(`Group (${grp}) · overall`, statusWidget("group", "overall", "2x2"), "The same, for one department.")}
        {show("Person · overall", statusWidget("person", "overall", "2x2"), "Their Explorers in each band.")}
        <Variant title="Team · overall" note={TEAM_NOTE}><WidgetStage pad={24}><LiveWidget familyId="org-status" formIndex={4} fit /></WidgetStage></Variant>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>
        {show("Organisation · Explorer", statusWidget("org", "explorer", "2x2"), "Still people: a population's bar is always its people.")}
        {show("Person · Explorer", statusWidget("person", "explorer", "2x2"), "That Explorer's Drivers in each band.")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>
        {show("1x1 · organisation", statusWidget("org", "overall"))}
        {show(`1x1 · ${grp}`, statusWidget("group", "explorer"))}
        {show("1x1 · person", statusWidget("person", "overall"), "The bar is their Explorers.")}
        {show("1x1 · person · Explorer", statusWidget("person", "explorer"), "The bar is the Explorer's Drivers.")}
        {POPULATIONS.small && show("Group under 5 people", statusWidget("small", "overall"), SMALL_NOTE)}
      </div>
    </>
  );
}

export const { meta, toc, Page } = makeWidgetDoc({
  id: "widget-status", familyId: "org-status", name: "Status", presets: true,
  blurb: "One card for any status: the organisation's, a team's, a group's or one person's, on any score. A population's bar breaks down its people; one person's breaks down their parts.",
  source: "components/widgets/StatusCard.jsx · lib/scoreWidget.js (statusBreakdown, STATUS_ELEMENTS) · WidgetBody.jsx and shape/shapeWidgets.jsx (the presets)",
  purpose: {
    does: "answers “which band is this in?”: the status a score puts its subject in (Flourishing, Striving or Struggling) and what sits in each band, its people or, for one person, its parts.",
    boundary: "a band, not a number. It never shows the score itself (the Score widget does) and doesn't explain why; the Scope does.",
    where: "every report (Org Status on the Org report, Your Status on a personal report, Team Status on a team report), the Library's Status group, and the Widget Builder's Status form for any topic.",
  },
  extra: [
    { id: "model", label: "One widget, any subject", lead: "What the breakdown bar shows, for each who × what.", render: () => <Model /> },
    { id: "elements", label: "What it can show", lead: "Every element, and for which subjects. Read from lib/scoreWidget.js, so this table is the rule.", render: () => <Elements /> },
    { id: "subjects", label: "Every subject", lead: "The one card, live, for each who × what.", render: () => <Subjects /> },
  ],
  forms: [
    "The status face and word over the people bar.",
    "The status illustration and word; the people bar and the count in each band in the Evidence.",
    "One person's status face and word over the bar of their Explorers.",
    "A team's status face and word over its members' bar.",
    "A team's status, its members' bar and the count in each band.",
    "One person's status; the bar of their Explorers and “Across the 12 Explorers, …” in the Evidence.",
  ],
  anatomy: [
    { familyId: "org-status", form: 0, parts: [header, face, bar] },
    { familyId: "org-status", form: 1, parts: [header, art, word, bar, counts] },
    { familyId: "org-status", form: 5, parts: [header, art, word, bar, sentence] },
  ],
  spec: [
    ["Status", "Face (1x1)", "48px status face in the band's graph colour, the word 20 / Bold in the band's text colour beneath, 6px apart."],
    ["", "Illustration (2x2)", "176px status illustration (assets/status-illustrations), the word 20 / Bold overlapping its foot by 30px."],
    ["Breakdown bar", "Bar", "8px, fully rounded; Flourishing, Striving and Struggling segments in status/*/bg-strong, widths to scale. 12px under the word on a 1x1; at the top of the Evidence on a 2x2."],
    ["People in each band", "Row (2x2)", "Three columns: band name 11 / Regular over its count 16 / Bold and a 14px people icon, in the band's text-indicator colour."],
    ["Parts in each band", "Statement (2x2)", "6px under the bar. Text 3xs / Regular (11 / 16) in text/tertiary; the total bold in the same grey; each count bold in its band's status/*/text colour; “is” for one, “are” for more, repeated for each band."],
  ],
  behaviour: [
    ["Click (on a report)", "Opens that status's Scope beside the report (or as a sheet on a phone)."],
    ["Change Widget", "Moves between the Library presets of the same persona: Org 1x1 ↔ 2x2, Your 1x1 ↔ 2x2, Team 1x1 ↔ 2x2."],
  ],
  opens: {
    what: "the Status Scope: what the status means, who or what is in each band, where each part sits, how scores are spread, the status shares round by round and how the status is worked out.",
    stories: [["Status Meaning", "score-meaning"], ["Breakdown (Who Is in Each Status)", "breakdown"], ["Breakdown (Zones)", "breakdown"], ["How Scores Are Spread", "breakdown"], ["Status Over Time", "trend"], ["Methodology", "methodology"]],
  },
  states: [
    ["Flourishing / Striving / Struggling", "Face, illustration, word and colour follow the band: 80 and above, 60 to 79, below 60 (lib/bands.js)."],
    ["A population", "The bar is its people, whatever the score."],
    ["One person", "The bar is the score's parts: Explorers for the overall score, Drivers for an Explorer or a cluster."],
    ["A Driver", "No Status widget: Drivers have no page of their own."],
    ["One band empty", "Its segment is left out of the bar; its count reads 0."],
    ["Group or team under 5 people", "No status: “Not shown” and a privacy line."],
  ],
  content: [
    ["Title", "Who + what: “Org Status”, “Your Status”, “Team Status”, “IT Group Status”, “Your Sleep Status”."],
    ["Status words", "Flourishing, Striving, Struggling: capitalised, never “thriving” or “at risk”."],
    ["Counts", "Whole people, never percentages on the card."],
    ["Parts statement", "“Across the 12 Explorers, 5 are Flourishing, 3 are Striving, and 4 are Struggling.” Oxford comma; “is” for one, “are” for more, for each band."],
  ],
  a11y: [
    "The face and illustration are decorative; the status word carries the meaning.",
    "The bar has no text of its own on a 1x1, so the card needs an accessible description such as “Struggling. 6 Flourishing, 39 Striving, 55 Struggling.” On a 2x2 the counts or the sentence carry it.",
  ],
  usageCode: `import StatusCard from "components/widgets/StatusCard.jsx";\n\n// who: "org" | "team" | "group" | "person"; what: "overall" | "cluster" | "explorer" (never "driver")\n// A population: send its people. One person: send their parts.\n<StatusCard size="2x2" who="group" what="overall" data={{ value: 61, n: 23, people: { f: 4, s: 9, t: 10 } }} />\n<StatusCard size="2x2" who="person" what="overall" data={{ value: 63, parts: { f: 2, s: 6, t: 4 }, partsNoun: "Explorers" }} />\n\n// As a widget on any report:\nconst widget = { id: "w1", kind: "status", size: "1x1", who: "person", what: "explorer", title: "Your Physical Health Status", data };`,
  usageNote: <Prose><p>Pass what you have; the card picks the breakdown from who it's about. A population's parts and a person's people are never drawn, even if sent.</p></Prose>,
  done: [
    "A population's bar is its people; one person's bar is their parts (Explorers, or an Explorer's Drivers).",
    "The face, word and colour always agree with the band of the score.",
    "The bar's segments add up to the people who answered (a population) or the parts that have a score (a person).",
    "A group or team under 5 shows no status.",
    "The title names who and what.",
  ],
});
export default Page;
