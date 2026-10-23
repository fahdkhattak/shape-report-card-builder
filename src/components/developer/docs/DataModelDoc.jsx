import { ds, dsText, dsSpace, dsBorder } from "../../../lib/ds.js";
import { Section, Prose, Callout } from "../docKit.jsx";
import { SimpleTable, Limit } from "../docParts.jsx";
import { DocLink } from "../DataNeeds.jsx";
import { ENTITIES, RULES, CONTRACTS, WIDGET_CONTRACTS } from "../dataContract.js";

export const meta = {
  id: "data-model", name: "Data model", group: "Foundations", kind: "Data model",
  blurb: "The generic vocabulary every Story and widget is specified in, so the same components work for any survey type, not only the Performance Index.",
  source: "components/developer/dataContract.js",
};
export const toc = [{ id: "overview", label: "Overview" }, { id: "entities", label: "The vocabulary" }, { id: "rules", label: "Rules" }, { id: "matrix", label: "Who needs what" }];

const code = (s) => <code style={{ fontFamily: "ui-monospace, Menlo, monospace", ...dsText("Text 2xs"), color: ds.text.primary }}>{s}</code>;

/* Which entities a contract uses, read from its "Shape" column so the matrix can't drift from the contracts. */
const MATRIX_COLS = [["Survey", /Survey/], ["Measure", /Measure/], ["Series", /Series/], ["Score", /Score\b/], ["BandCounts", /BandCounts/], ["Distribution", /Distribution/], ["Segment", /Segment|Attribute/], ["LevelShare", /LevelShare/], ["Relationship", /Relationship/], ["Content", /Content/], ["Entitlement", /Entitlement/]];
const uses = (c, re) => c.needs.some((n) => re.test(n[1]));
const DOC_NAMES = { "insight-summary": "Insight Summary", "score-meaning": "Score Meaning", breakdown: "Breakdown", diagnostic: "Diagnostic", composition: "Composition", actions: "Actions", comparison: "Comparison", trend: "Trend", "goal-pace": "Goal & Pace", methodology: "Insight & Methodology", resource: "Resource", upgrade: "Upgrade Path", citation: "Citation", video: "Video", questionnaire: "Questionnaire", "widget-score": "Score (widget)", "widget-index": "Index (widget)", "widget-score-history": "Score History (widget)", "widget-explorers": "Explorers (widget)" };

export default function DataModelDoc() {
  const all = { ...CONTRACTS, ...WIDGET_CONTRACTS };
  const dot = (on) => <span aria-label={on ? "uses" : "doesn't use"} style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: on ? ds.text.primary : "transparent", boxShadow: on ? "none" : `inset 0 0 0 ${dsBorder.sm}px ${ds.border.secondary}` }} />;
  return (
    <>
      <Section id="overview" title="Overview" lead="Every Story and widget page has a “Data it needs” section. They're all written with the words on this page.">
        <Prose>
          <p>SHAPE runs more than one kind of survey. The Performance Index has an overall score, 12 Explorers and about 45 Drivers on a 0 to 100 scale with three status bands, but a Pulse or a Brain Health survey can have other levels, other bands or none. So the contracts never say "Explorer" or "60". They say <b>a measure and its children</b>, <b>the survey's bands</b> and <b>the level's noun</b>, and the survey supplies the rest.</p>
          <p>A report asks for data about one <b>population</b> (the organisation, a team, a group of people, or the viewer), across <b>rounds</b>, for one or more <b>measures</b>. Everything else is a view of those three.</p>
        </Prose>
        <Callout title="The idea in one line">The survey describes itself; the Story only asks for measures, populations and rounds.</Callout>
      </Section>

      <Section id="entities" title="The vocabulary" lead="Fifteen entities. Field names are suggestions for the API; the shapes are what matter.">
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[24] }}>
          {ENTITIES.map((e) => (
            <div key={e.id} id={`entity-${e.id}`} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: dsSpace[8], flexWrap: "wrap" }}>
                <span style={{ ...dsText("Text md", 600), color: ds.text.primary }}>{e.name}</span>
                <span style={{ ...dsText("Text sm"), color: ds.text.secondary, maxWidth: "70ch" }}>{e.what}</span>
              </div>
              <SimpleTable head={["Field", "Type", "Notes"]} widths={["26%", "30%", "44%"]} rows={e.fields.map(([f, t, n]) => [code(f), code(t), n])} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="rules" title="Rules" lead="Every contract follows these. They're what make a Story safe to point at any survey.">
        <div style={{ display: "flex", flexDirection: "column" }}>{RULES.map(([t, body], i) => <Limit key={t} n={String(i + 1)} title={t}>{body}</Limit>)}</div>
      </Section>

      <Section id="matrix" title="Who needs what" lead="Which entities each documented Story and widget asks for. Read from the contracts themselves, so it stays current. Every page also needs the Population it describes.">
        <SimpleTable
          head={["Page", ...MATRIX_COLS.map(([n]) => n)]}
          rows={Object.entries(all).map(([id, c]) => [<DocLink key={id} id={id}>{DOC_NAMES[id] || id}</DocLink>, ...MATRIX_COLS.map(([n, re]) => <span key={n} style={{ display: "flex", justifyContent: "center" }}>{dot(uses(c, re))}</span>)])}
        />
      </Section>
    </>
  );
}
