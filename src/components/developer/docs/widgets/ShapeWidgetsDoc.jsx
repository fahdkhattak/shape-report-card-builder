import { useCallback, useState } from "react";
import { ds, dsSpace } from "../../../../lib/ds.js";
import { Section, Prose } from "../../docKit.jsx";
import { SimpleTable, SpecTable, List } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { FormExample, templateLabel } from "../widgetDoc.jsx";
import { pageIdOf } from "./widgetPages.js";
import { SHAPE_WIDGETS, SHAPE_REPORT_WIDGETS } from "../../../shape/shapeWidgets.jsx";
import { DEFAULT_PERSON } from "../../../../lib/survey/surveyData.js";

/* ================================================================== */
/* SHAPE REPORT WIDGETS: the 22 widgets on Your Reports › SHAPE           */
/* (components/shape/shapeWidgets.jsx), on the 150-person survey dataset. */
/* Each one: what it shows, what it reads, the Scope it opens, the Library */
/* widget it mirrors, and its measured template.                          */
/* ================================================================== */
export const meta = {
  id: "widgets-shape", name: "SHAPE report widgets", group: "Widgets", kind: "Widgets",
  blurb: "The 22 widgets on the SHAPE report (Personal and Org), drawn from the new survey dataset: what each shows, what it reads, what it opens, and the Library widget it mirrors.",
  source: "components/shape/shapeWidgets.jsx · components/shape/shapeScopes.jsx · lib/survey/surveyData.js",
};
export const toc = [{ id: "overview", label: "Overview" }, { id: "map", label: "The map" }, { id: "personal", label: "Personal" }, { id: "org", label: "Org" }, { id: "rules", label: "Rules" }];

/* What each widget shows, what it reads (lib/survey/surveyData.js unless said), its Scope's Stories and its Library twin. */
const W = {
  "p-score": { shows: "The person's overall score, change and date; their status and how their 12 Explorers split.", reads: "personRounds(): scores.overall, the round before, scores.explorers", scope: "Insight Summary, Score Meaning, Breakdown (radar), What Stands Out, What Changed, Score History, Methodology", lib: "your-score" },
  "p-status": { shows: "The person's status, and the bar of their 12 Explorers by band.", reads: "scores.status, scores.explorers", scope: "Status Meaning, Breakdown (zones), Methodology", lib: "org-status" },
  "p-history": { shows: "The person's overall score in every round they answered (a gap for a round they missed).", reads: "personSeries(overall)", scope: "Score History, Score Over Time", lib: "score-history" },
  "p-explorers": { shows: "The person's 12 Explorers ranked into Great, Average and Poor, with changes.", reads: "scores.explorers (and the round before)", scope: "Breakdown (bars), What Stands Out, What Changed, Score Over Time (by part)", lib: "explorers" },
  "p-wellbeing": { shows: "Feeling Low, Stressed and Anxious: the person's level for each, with the change.", reads: "scores.wellbeing[measure].level", scope: "Mental Well-Being, Score Over Time (by part)", lib: "mental-wellbeing" },
  "p-focus": { shows: "The person's three lowest Drivers with score and change.", reads: "scores.drivers, lowest three", scope: "Breakdown, What Stands Out, Within Reach", lib: "factors" },
  "p-drivers": { shows: "The person's Drivers ranked into Great, Average and Poor.", reads: "scores.drivers (and the round before)", scope: "Breakdown, What Stands Out, Within Reach", lib: "factors" },
  "p-health": { shows: "The person's own answers on sleep, exercise, fruit and veg, alcohol, smoking and BMI, each with its score.", reads: "answers[qid] and scores.questions[qid] for the health questions", scope: "Breakdown (question level), Score Over Time", lib: null },
  "p-balance": { shows: "The Work-life balance Driver score and change.", reads: "scores.drivers[\"Work-life balance\"]", scope: "Score Meaning, Breakdown (question level)", lib: "explorer-score" },
  "p-morale": { shows: "Morale out of 10, with the would-recommend answer and its group.", reads: "answers CC2.1 and CC2.3", scope: "Score Over Time (morale), Score Over Time (recommend)", lib: null },
  "p-performance": { shows: "Self-rated performance (HPQ absolute) with the peers' rating.", reads: "scores.hpq.absolute, answers PRO16.1", scope: "Score Meaning, Score Over Time", lib: null },
  "o-score": { shows: "The organisation's overall score, change, date, Employees (invited) and Participation; people by status.", reads: "summary(): overall, invited, n, status counts", scope: "Insight Summary, Score Meaning, Breakdown (radar), What Stands Out, What Changed, Within Reach, Areas to Focus On, What Makes the Difference, Score History, Methodology ×2", lib: "org-score" },
  "o-status": { shows: "The organisation's status, and the bar of its people by band.", reads: "summary(): overall, status counts", scope: "Status Meaning, Who Is in Each Status, Breakdown (zones), Why Flourishing Matters, Status Over Time, Methodology", lib: "org-status" },
  "o-history": { shows: "The overall score in every round.", reads: "orgSeries(overall)", scope: "Score History, Score Over Time", lib: "score-history" },
  "o-explorers": { shows: "The 12 Explorers ranked into Great, Average and Poor, with changes.", reads: "summary().explorers (and the round before)", scope: "Breakdown, What Stands Out, What Changed, Score Over Time (by part)", lib: "explorers" },
  "o-enps": { shows: "eNPS from CC2.3, the change, the question, and Promoters / Passives / Detractors.", reads: "enpsSplit(round): answers to CC2.3", scope: "Score Meaning, eNPS Over Time", lib: "enps" },
  "o-focus": { shows: "The lowest group of 5+ on three ways of grouping people.", reads: "focusGroups()", scope: "Areas to Focus On, Breakdown", lib: "areas-focus" },
  "o-drivers": { shows: "The 60 Drivers ranked into Great, Average and Poor.", reads: "summary().drivers", scope: "Breakdown, What Stands Out, Within Reach, What Changed", lib: "factors" },
  "o-wellbeing": { shows: "The share of people at each of the five levels, per measure.", reads: "summary().wellbeing", scope: "Mental Well-Being, How People Moved, Where People Sit, Score Over Time (by part)", lib: "mental-wellbeing" },
  "o-workmodel": { shows: "Overall score for Office, Hybrid and Home.", reads: "groups(\"workModel\")", scope: "Breakdown, Score Over Time (by part)", lib: "avg-work-model" },
  "o-gender": { shows: "Overall score per gender group of 5+.", reads: "groups(\"gender\")", scope: "Breakdown, Score Over Time (by part)", lib: "avg-gender" },
  "o-performance": { shows: "Average self-rated performance (HPQ) and the change.", reads: "summary().hpq", scope: "Score Meaning, Score Over Time", lib: null },
};

const widgetOf = (id) => ({ id: `doc-${id}`, kind: "shape", widgetId: id, personId: DEFAULT_PERSON, size: SHAPE_WIDGETS[id].size });

export default function ShapeWidgetsDoc() {
  const [structures, setStructures] = useState({});
  const onStructure = useCallback((k, res) => setStructures((m) => (m[k] === res ? m : { ...m, [k]: res })), []);
  const rows = (persona) => SHAPE_REPORT_WIDGETS[persona].map((id) => {
    const w = SHAPE_WIDGETS[id], x = W[id];
    return [w.name, w.size, templateLabel(structures[id]), x.shows, x.lib ? <DocLink key={id} id={pageIdOf(x.lib)}>{x.lib}</DocLink> : <span key={id} style={{ color: ds.text.tertiary }}>None (SHAPE only)</span>];
  });
  const block = (persona) => SHAPE_REPORT_WIDGETS[persona].map((id) => {
    const w = SHAPE_WIDGETS[id], x = W[id];
    return (
      <div key={id} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
        <FormExample k={id} onStructure={onStructure} widget={widgetOf(id)} title={`${w.name} · ${w.size}`} note={x.shows} />
        <SpecTable head={["Aspect", "Detail"]} widths={["18%", "82%"]} rows={[["Reads", x.reads], ["Opens", `Its Scope: ${x.scope}.`], ["Library twin", x.lib ? <DocLink key="l" id={pageIdOf(x.lib)}>Same structure and parts as the Library widget</DocLink> : "None: this widget exists only on the SHAPE report."]]} />
      </div>
    );
  });
  return (
    <>
      <Section id="overview" title="Overview" lead="The SHAPE report (Your Reports › SHAPE) is the first report on the new 150-person survey dataset. Its widgets are drawn with the Library's own parts and follow the same templates.">
        <Prose>
          <p><b>Personal</b> is one person's own answers only: no group, no one else. <b>Org</b> is the whole organisation; groups under 5 people are never shown.</p>
          <p>Each widget is <code>{"{ kind: \"shape\", widgetId, personId? }"}</code>; its body is in <code>SHAPE_WIDGETS</code> and its Scope in <code>shapeScopes.jsx</code>.</p>
        </Prose>
      </Section>
      <Section id="map" title="The map" lead="Every SHAPE widget, its template and the Library widget it mirrors (same structure and parts; that page has the full spec).">
        <span style={{ fontWeight: 600 }}>Personal</span>
        <SimpleTable head={["Widget", "Size", "Template", "What it shows", "Library twin"]} widths={["16%", "7%", "20%", "40%", "17%"]} rows={rows("personal")} />
        <span style={{ fontWeight: 600 }}>Org</span>
        <SimpleTable head={["Widget", "Size", "Template", "What it shows", "Library twin"]} widths={["16%", "7%", "20%", "40%", "17%"]} rows={rows("org")} />
      </Section>
      <Section id="personal" title="Personal" lead="Eleven widgets, one person's own data.">{block("personal")}</Section>
      <Section id="org" title="Org" lead="Eleven widgets, the whole organisation.">{block("org")}</Section>
      <Section id="rules" title="Rules">
        <List items={[
          "A Personal widget never shows anyone else's data, a group's, or a comparison with a group.",
          "Org widgets never show a group under 5 people (summary() returns suppressed).",
          "Every widget is a template for its size and passes the structure check (Widgets › Widget structure).",
          "Scores, statuses, eNPS and well-being levels are worked out by lib/survey/scoring.js from stored answers; nothing stores a score.",
          "New SHAPE widgets reuse the Library's parts (ScoreCard, Ranked, GraphInsight, HBars, FocusRow…) rather than new markup.",
        ]} />
      </Section>
    </>
  );
}
