import { ds, dsText, dsSpace, dsBorder } from "../../../../lib/ds.js";
import { Section, Prose } from "../../docKit.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { Fact } from "../../docParts.jsx";
import { LiveWidget, WidgetStage } from "../widgetDoc.jsx";
import { WIDGET_GROUPS, pageIdOf } from "./widgetPages.js";
import { SHAPE_WIDGETS, SHAPE_REPORT_WIDGETS } from "../../../shape/shapeWidgets.jsx";
import { DEFAULT_PERSON } from "../../../../lib/survey/surveyData.js";

/* ================================================================== */
/* ALL WIDGETS — every widget in the product, live, in one place: the     */
/* Library families by Library group, then the SHAPE report's own        */
/* widgets. Each family links to its page.                               */
/* ================================================================== */
export const meta = {
  id: "widgets-all", name: "All widgets", group: "Widgets", kind: "Widgets",
  blurb: "Every widget form in the product, running live, grouped as the Library groups them.",
  source: "lib/families.js · components/widgets/WidgetBody.jsx · components/shape/shapeWidgets.jsx",
};
export const toc = [{ id: "overview", label: "Overview" }, ...WIDGET_GROUPS.map((g) => ({ id: `g-${g.name.replace(/\W+/g, "-")}`, label: g.name })), { id: "shape", label: "SHAPE report" }];

/* One small card: its name and the live widget. */
function Tile({ familyId, formIndex, widget, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[6], minWidth: 0, maxWidth: "100%" }}>
      <span style={{ ...dsText("Text 2xs", 600), color: ds.text.secondary, maxWidth: 360 }}>{label}</span>
      <WidgetStage pad={16}><LiveWidget familyId={familyId} formIndex={formIndex} widget={widget} fit /></WidgetStage>
    </div>
  );
}

const grid = { display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" };

export default function AllWidgetsDoc() {
  const families = WIDGET_GROUPS.reduce((a, g) => a + g.families.length, 0);
  const libForms = WIDGET_GROUPS.reduce((a, g) => a + g.families.reduce((b, f) => b + f.forms.length, 0), 0);
  const shapeCount = SHAPE_REPORT_WIDGETS.personal.length + SHAPE_REPORT_WIDGETS.org.length;
  return (
    <>
      <Section id="overview" title="Overview" lead="Every widget, live. Click a family's name for its page.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Library" value={`${families} families`} note={`${libForms} forms in ${WIDGET_GROUPS.length} groups.`} />
          <Fact label="SHAPE report" value={`${shapeCount} widgets`} note="Personal and Org." />
        </div>
        <Prose><p>Every Library widget has its own page (the sidebar's groups). The SHAPE report's widgets are mapped on <DocLink id="widgets-shape">SHAPE report widgets</DocLink>, and everything the Widget Builder and the chat can make on <DocLink id="widgets-builder">Widget Builder forms</DocLink>. Every widget is built to a <DocLink id="widget-structure">widget template</DocLink> and the <DocLink id="widget-type-system">widget type system</DocLink>.</p></Prose>
      </Section>

      {WIDGET_GROUPS.map((g) => (
        <Section key={g.name} id={`g-${g.name.replace(/\W+/g, "-")}`} title={g.name} lead={g.blurb}>
          {g.families.map((f) => (
            <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], paddingBottom: dsSpace[16], borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` }}>
              <span style={{ ...dsText("Text md", 600) }}><DocLink id={pageIdOf(f.id)}>{f.name}</DocLink> <span style={{ ...dsText("Text xs"), color: ds.text.tertiary, fontWeight: 400 }}>{f.forms.length} form{f.forms.length === 1 ? "" : "s"} · {f.blurb}</span></span>
              <div style={grid}>{f.forms.map((fm, i) => <Tile key={i} familyId={f.id} formIndex={i} label={`${fm.name} · ${fm.size}`} />)}</div>
            </div>
          ))}
        </Section>
      ))}

      <Section id="shape" title="SHAPE report" lead="The SHAPE report's own widgets (Your Reports › SHAPE). Personal shows one person's own data.">
        {["personal", "org"].map((persona) => (
          <div key={persona} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
            <span style={{ ...dsText("Text md", 600), color: ds.text.primary }}>{persona === "personal" ? "Personal" : "Org"}</span>
            <div style={grid}>{SHAPE_REPORT_WIDGETS[persona].map((id) => <Tile key={id} widget={{ id: `doc-${id}`, kind: "shape", widgetId: id, personId: DEFAULT_PERSON }} label={`${SHAPE_WIDGETS[id].name} · ${SHAPE_WIDGETS[id].size}`} />)}</div>
          </div>
        ))}
      </Section>
    </>
  );
}
