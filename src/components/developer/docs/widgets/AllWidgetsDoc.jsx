import { useCallback, useEffect, useRef, useState } from "react";
import { font } from "../../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../../lib/ds.js";
import { Section, Prose, Callout } from "../../docKit.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { Fact } from "../../docParts.jsx";
import { offSystem } from "../../../../lib/widgetTypeSystem.js";
import { LiveWidget, WidgetStage, useTypeAudit, AuditBadge, AuditTable } from "../widgetDoc.jsx";
import { WIDGET_GROUPS, pageIdOf } from "./widgetPages.js";
import { SHAPE_WIDGETS, SHAPE_REPORT_WIDGETS } from "../../../shape/shapeWidgets.jsx";
import { DEFAULT_PERSON } from "../../../../lib/survey/surveyData.js";

/* ================================================================== */
/* ALL WIDGETS — every widget in the product, live, in one place, for     */
/* review: the 22 Library families (61 forms) by Library group, then the  */
/* SHAPE report's own widgets (new survey dataset). Each card has its     */
/* type audit against the widget Font System; the counts roll up top.     */
/* ================================================================== */
export const meta = {
  id: "widgets-all", name: "All widgets", group: "Widgets", kind: "Widgets",
  blurb: "Every widget form in the product, running live, grouped as the Library groups them, each checked against the widget Font System. The review sheet.",
  source: "lib/families.js · components/widgets/WidgetBody.jsx · components/shape/shapeWidgets.jsx",
};
export const toc = [{ id: "overview", label: "Overview" }, ...WIDGET_GROUPS.map((g) => ({ id: `g-${g.name.replace(/\W+/g, "-")}`, label: g.name })), { id: "shape", label: "SHAPE report" }];

/* One small card: the live widget, its badge, and its audit on demand. Reports its result up for the totals. */
function Tile({ k, familyId, formIndex, widget, label, onResult }) {
  const ref = useRef(null);
  const rows = useTypeAudit(ref, [k]);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (rows) onResult(k, rows); }, [rows, k, onResult]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[6], minWidth: 0, maxWidth: "100%" }}>
      <span style={{ ...dsText("Text 2xs", 600), color: ds.text.secondary, maxWidth: 360 }}>{label}</span>
      <div ref={ref}><WidgetStage pad={16}><LiveWidget familyId={familyId} formIndex={formIndex} widget={widget} fit /></WidgetStage></div>
      <div style={{ display: "flex", gap: dsSpace[8], alignItems: "center", flexWrap: "wrap" }}>
        <AuditBadge rows={rows} />
        {rows && offSystem(rows).length > 0 && <button type="button" onClick={() => setOpen((v) => !v)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: font, ...dsText("Text 2xs", 600), color: ds.text.link }}>{open ? "Hide" : "Show"} what's off</button>}
      </div>
      {open && <AuditTable rows={offSystem(rows)} />}
    </div>
  );
}

const grid = { display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" };

export default function AllWidgetsDoc() {
  const [results, setResults] = useState({});
  const onResult = useCallback((k, rows) => setResults((r) => (r[k] ? r : { ...r, [k]: rows })), []);
  const all = Object.values(results);
  const texts = all.reduce((a, r) => a + r.length, 0), off = all.reduce((a, r) => a + offSystem(r).length, 0);
  const cleanForms = all.filter((r) => !offSystem(r).length).length;
  // The header colour is one shared fix (WidgetCard's Header), so also count forms that are clean apart from it.
  const headerOnly = (x) => x.issues.every((i) => /^Header colour/.test(i));
  const cleanButHeader = all.filter((r) => offSystem(r).every(headerOnly)).length;
  const libForms = WIDGET_GROUPS.reduce((a, g) => a + g.families.reduce((b, f) => b + f.forms.length, 0), 0);
  const shapeCount = SHAPE_REPORT_WIDGETS.personal.length + SHAPE_REPORT_WIDGETS.org.length;
  // The most common reasons, across everything measured so far.
  const reasons = {};
  all.forEach((r) => offSystem(r).forEach((x) => x.issues.forEach((i) => { reasons[i] = (reasons[i] || 0) + 1; })));
  const top = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <>
      <Section id="overview" title="Overview" lead="Every widget, live. Click a family's name for its page. Under each card: how many of its texts match a role in the widget Font System.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Library" value={`${WIDGET_GROUPS.reduce((a, g) => a + g.families.length, 0)} families`} note={`${libForms} forms in ${WIDGET_GROUPS.length} groups.`} />
          <Fact label="SHAPE report" value={`${shapeCount} widgets`} note="Personal and Org, on the new survey dataset." />
          <Fact label="Forms on-system" value={`${cleanForms} of ${all.length}`} note={all.length < libForms + shapeCount ? "Still measuring…" : "Every text matches a role."} />
          <Fact label="Clean apart from the header colour" value={`${cleanButHeader} of ${all.length}`} note="The header colour is one shared fix, in the card's Header." />
          <Fact label="Texts off-system" value={`${off} of ${texts}`} note="Sizes, weights or colours the Font System doesn't have." />
        </div>
        {top.length > 0 && (
          <Callout title="The ten most common reasons">
            <ul style={{ margin: 0, paddingLeft: 18 }}>{top.map(([k, n]) => <li key={k}>{k} <span style={{ color: ds.text.tertiary }}>({n})</span></li>)}</ul>
          </Callout>
        )}
        <Prose><p>The rules are on <DocLink id="widget-type-system">Foundations › Widget type system</DocLink> (Figma's Font System board). Nothing has been changed to fit them yet: this is the list to review.</p></Prose>
      </Section>

      {WIDGET_GROUPS.map((g) => (
        <Section key={g.name} id={`g-${g.name.replace(/\W+/g, "-")}`} title={g.name} lead={g.blurb}>
          {g.families.map((f) => (
            <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], paddingBottom: dsSpace[16], borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` }}>
              <span style={{ ...dsText("Text md", 600) }}><DocLink id={pageIdOf(f.id)}>{f.name}</DocLink> <span style={{ ...dsText("Text xs"), color: ds.text.tertiary, fontWeight: 400 }}>{f.forms.length} form{f.forms.length === 1 ? "" : "s"} · {f.blurb}</span></span>
              <div style={grid}>{f.forms.map((fm, i) => <Tile key={i} k={`${f.id}:${i}`} familyId={f.id} formIndex={i} label={`${fm.name} · ${fm.size}${fm.sample || (fm.persona && fm.persona !== "org") ? " · sample" : ""}`} onResult={onResult} />)}</div>
            </div>
          ))}
        </Section>
      ))}

      <Section id="shape" title="SHAPE report" lead="The SHAPE report's own widgets (Your Reports › SHAPE), drawn from the new 150-person survey dataset. Personal shows one person's own data.">
        {["personal", "org"].map((persona) => (
          <div key={persona} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
            <span style={{ ...dsText("Text md", 600), color: ds.text.primary }}>{persona === "personal" ? "Personal" : "Org"}</span>
            <div style={grid}>{SHAPE_REPORT_WIDGETS[persona].map((id) => <Tile key={id} k={`shape:${id}`} widget={{ id: `doc-${id}`, kind: "shape", widgetId: id, personId: DEFAULT_PERSON }} label={`${SHAPE_WIDGETS[id].name} · ${SHAPE_WIDGETS[id].size}`} onResult={onResult} />)}</div>
          </div>
        ))}
      </Section>
    </>
  );
}
