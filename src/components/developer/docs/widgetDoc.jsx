import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../lib/ds.js";
import { familyById, nextFormIndex, GROUPS } from "../../../lib/families.js";
import { shapeSize } from "../../shape/shapeWidgets.jsx";
import WidgetCard from "../../canvas/WidgetCard.jsx";
import { Section, Prose, Variant, Anatomy, Inspectable, CodeBlock } from "../docKit.jsx";
import { SpecTable, SimpleTable, List } from "../docParts.jsx";
import DataNeeds, { DocLink } from "../DataNeeds.jsx";
import { contractFor } from "../dataContract.js";
import { auditText, offSystem, TYPE_ROLES } from "../../../lib/widgetTypeSystem.js";

/* ================================================================== */
/* WIDGET DOC: one page shape for every widget, driven by config (like    */
/* storyDoc.jsx for Stories). The live examples are the real canvas       */
/* WidgetCard (hover, three-dot menu, Change Widget), and every form has   */
/* a type audit: each text in it measured against the widget Font System  */
/* (lib/widgetTypeSystem.js, Figma 9158:33686).                            */
/* A family with no hand-written config still gets a full page from        */
/* families.js (name, group copy, every form); hand-written pages add       */
/* anatomy, specification, states, content and a done checklist.           */
/* ================================================================== */
const noop = () => {};
const ROLE_NAME = Object.fromEntries(TYPE_ROLES.map((r) => [r.id, r.name.replace("Primary Metric – ", "").replace("Label – ", "")]));

/* One real widget card at its native size. Library: `familyId` + `formIndex` (local, so Change Widget works). Any other
   widget (a SHAPE report widget): `widget`. */
export function LiveWidget({ familyId, formIndex: start = 0, title, widget: given, fit = false }) {
  const [formIndex, setFormIndex] = useState(start);
  const widget = given || { id: `doc-${familyId}-${start}`, kind: "library", familyId, formIndex, customTitle: title };
  const next = () => setFormIndex((i) => nextFormIndex(familyId, i));
  // `fit`: the grid is only as wide as the card (for the All widgets sheet, where cards sit side by side).
  const size = given ? given.size || shapeSize(given) : familyById(familyId).forms[formIndex].size;
  const cols = fit ? Number(size[0]) : 6;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 164px)`, gridAutoRows: "164px", gap: 16, width: "max-content" }}>
      <WidgetCard widget={widget} onChangeForm={given ? noop : next} onEdit={noop} onRemove={noop} onRename={noop} onOpenModal={noop} />
    </div>
  );
}

export const WidgetStage = ({ children, pad = 44 }) => (
  <Inspectable style={{ background: ds.bg.primary, borderRadius: dsRadius.xl, padding: pad, boxSizing: "border-box", overflowX: "auto" }}>{children}</Inspectable>
);

/* Measure every text in `ref` once it has settled (fonts, springs, the header's line rule). */
export function useTypeAudit(ref, deps = []) {
  const [rows, setRows] = useState(null);
  useLayoutEffect(() => {
    const t = setTimeout(() => setRows(auditText(ref.current)), 450);
    return () => clearTimeout(t);
  }, deps);
  return rows;
}

const mono = { fontFamily: "ui-monospace, Menlo, monospace" };
export function AuditBadge({ rows }) {
  if (!rows) return <span style={{ ...dsText("Text 2xs"), color: ds.text.quaternary }}>Measuring…</span>;
  const bad = offSystem(rows).length;
  return <span title={bad ? "Texts that don't match a Font System role" : "Every text matches a Font System role"} style={{ ...dsText("Text 3xs", 600), borderRadius: dsRadius.full, padding: `2px ${dsSpace[8]}px`, background: bad ? ds.status.warning.bg : ds.status.success.bg, color: bad ? ds.status.warning.textStrong : ds.status.success.textIndicator, whiteSpace: "nowrap" }}>{bad ? `${bad} of ${rows.length} off-system` : `All ${rows.length} on-system`}</span>;
}

export function AuditTable({ rows }) {
  if (!rows) return null;
  const cell = { padding: `${dsSpace[6]}px ${dsSpace[12]}px`, borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, ...dsText("Text 2xs"), verticalAlign: "top", color: ds.text.secondary };
  return (
    <div style={{ overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font }}>
        <thead><tr>{["Text", "Size / weight", "Colour", "Role", "Off the system because"].map((h) => <th key={h} style={{ ...cell, borderTop: "none", background: ds.surface.general.cardWithinCard, textAlign: "left", fontWeight: 600, color: ds.text.tertiary }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...cell, color: ds.text.primary, maxWidth: 220 }}>{r.text}{r.inHeader && <span style={{ color: ds.text.quaternary }}> · header</span>}</td>
              <td style={{ ...cell, ...mono, whiteSpace: "nowrap" }}>{Math.round(r.size * 10) / 10} / {r.weight}</td>
              <td style={{ ...cell, ...mono, whiteSpace: "nowrap" }}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: r.colour, verticalAlign: "middle", marginRight: 6, boxShadow: `inset 0 0 0 1px ${ds.border.secondary}` }} />{r.colour}</td>
              <td style={cell}>{r.roles.length ? r.roles.map((id) => ROLE_NAME[id]).join(" or ") : <span style={{ color: ds.text.quaternary }}>none</span>}</td>
              <td style={{ ...cell, color: r.issues.length ? ds.status.warning.textStrong : ds.status.success.textIndicator }}>{r.issues.length ? r.issues.join(". ") : "On the system"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* One form: the live card, its audit badge, and the audit table (closed until opened). */
export function AuditedWidget({ familyId, formIndex, widget, title, note }) {
  const ref = useRef(null);
  const rows = useTypeAudit(ref, [familyId, formIndex, widget?.widgetId, widget?.personId]);
  const [open, setOpen] = useState(false);
  return (
    <Variant title={title} note={note}>
      <div ref={ref}><WidgetStage><LiveWidget familyId={familyId} formIndex={formIndex} widget={widget} /></WidgetStage></div>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8] }}>
        <AuditBadge rows={rows} />
        {rows && <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: font, ...dsText("Text 2xs", 600), color: ds.text.link }}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}Type audit</button>}
      </div>
      {open && <AuditTable rows={rows} />}
    </Variant>
  );
}

/* c.familyId, or c.familyIds when one widget is several Library families (the Score card is Org / Your / Team /
   Explorer Score). c.extra: [{ id, label, render }] sections placed after the Overview. */
export function makeWidgetDoc(c) {
  const familyIds = c.familyIds || [c.familyId];
  const families = familyIds.map(familyById);
  const family = families[0];
  const group = GROUPS.find((g) => g.id === family.category);
  const name = c.name || family.name;
  const meta = { id: c.id || `widget-${family.id}`, name, group: "Widgets", kind: name, blurb: c.blurb || family.blurb, source: c.source || `components/widgets/WidgetBody.jsx (case "${family.id}") · lib/families.js` };
  const hasContract = !!contractFor(meta.id);
  const toc = [
    { id: "overview", label: "Overview" }, ...(c.extra || []).map(({ id, label }) => ({ id, label })), { id: "forms", label: c.familyIds ? "Library forms" : "The forms" },
    c.anatomy && { id: "anatomy", label: "Anatomy" }, { id: "spec", label: "Specification" },
    hasContract && { id: "data", label: "Data it needs" }, { id: "behaviour", label: "Behaviour" },
    c.states && { id: "states", label: "States & edge cases" }, c.content && { id: "content", label: "Content & voice" },
    { id: "a11y", label: "Accessibility" }, { id: "usage", label: "Usage" }, { id: "done", label: "Done checklist" },
  ].filter(Boolean);
  const allForms = families.flatMap((fam) => fam.forms.map((f, i) => ({ fam, f, i })));
  const sampleForms = allForms.filter(({ f }) => f.sample || (f.persona && f.persona !== "org")).length;

  function Page() {
    return (
      <>
        <Section id="overview" title="Overview" lead="A widget is one card on a report: it answers one question at a glance and opens into more. These are the real cards, running below.">
          <Prose>
            {c.purpose ? <>
              <p><b>Purpose:</b> {c.purpose.does}</p>
              <p><b>Boundary:</b> {c.purpose.boundary}</p>
              <p><b>Where it appears:</b> {c.purpose.where}</p>
            </> : <p><b>Purpose:</b> {family.blurb}</p>}
            {group?.about?.map((p, i) => <p key={i}>{p}</p>)}
            <p><b>Library group:</b> {family.category}. <b>Forms:</b> {allForms.length}{c.familyIds ? ` across ${families.length} Library families (${families.map((f) => f.name).join(", ")})` : ""}{sampleForms ? ` (${sampleForms} drawn with sample data: the dataset has no per-person or per-team data for them, or no data at all)` : ""}.</p>
            {!c.purpose && <p style={{ color: ds.text.tertiary }}>This page is generated from the Library's own definitions. Anatomy, specification, states and a data contract get written when the widget is reviewed.</p>}
          </Prose>
        </Section>

        {(c.extra || []).map((x) => <Section key={x.id} id={x.id} title={x.label} lead={x.lead}>{x.render()}</Section>)}

        <Section id="forms" title={c.familyIds ? "Library forms" : "The forms"} lead={`${c.familyIds ? "The fixed forms the Library offers, each a preset of the one widget. " : ""}Each form is one fixed size on the report grid (1x1 = 164px, 2x2 = 344px, 3x3 = 524px). Hover a card for its menu. Under each: how many of its texts match the widget Font System, and the full type audit.`}>
          <SimpleTable head={["Form", "Size", "Persona", "What it shows"]} widths={["28%", "10%", "12%", "50%"]} rows={allForms.map(({ fam, f, i }, k) => [f.name, f.size, f.persona ? f.persona[0].toUpperCase() + f.persona.slice(1) : fam.persona === "org" ? "Org" : fam.persona, <span key={k}>{(fam === family && c.forms?.[i]) || f.blurb}{(f.sample || (f.persona && f.persona !== "org")) && <span style={{ color: ds.text.tertiary }}> · sample data</span>}</span>])} />
          <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[24] }}>
            {allForms.map(({ fam, f, i }) => <AuditedWidget key={`${fam.id}-${i}`} familyId={fam.id} formIndex={i} title={`${f.name} · ${f.size}`} note={f.blurb} />)}
          </div>
        </Section>

        {c.anatomy && (
          <Section id="anatomy" title="Anatomy" lead="Numbered on the live card, then measured from the browser, so the table can't drift from what ships.">
            {c.anatomy.map((a, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
                {c.anatomy.length > 1 && <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>{familyById(a.familyId || family.id).forms[a.form].name} · {familyById(a.familyId || family.id).forms[a.form].size}</span>}
                <Anatomy parts={a.parts} width={1040}><div style={{ display: "flex" }}><LiveWidget familyId={a.familyId || family.id} formIndex={a.form} /></div></Anatomy>
              </div>
            ))}
          </Section>
        )}

        <Section id="spec" title="Specification" lead="The card shell is shared by every widget; its text follows the widget Font System (Foundations › Widget type system).">
          <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[...SHELL_SPEC, ...(c.spec || [])]} />
          {!c.spec && <Prose><p style={{ color: ds.text.tertiary }}>This widget's own parts aren't written up yet. The type audit under each form says what its text measures today.</p></Prose>}
        </Section>

        {hasContract && <DataNeeds id={meta.id} />}

        <Section id="behaviour" title="Behaviour">
          <SpecTable head={["Interaction", "What happens"]} widths={["28%", "72%"]} rows={[...SHELL_BEHAVIOUR, ...(c.behaviour || [])]} />
          {c.opens && (
            <Prose>
              <p><b>Opens:</b> {c.opens.what}</p>
              {c.opens.stories && <p>Its Scope holds, in order: {c.opens.stories.map(([n, doc], i) => <span key={n}>{i > 0 && ", "}{doc ? <DocLink id={doc}>{n}</DocLink> : n}</span>)}.</p>}
            </Prose>
          )}
        </Section>

        {c.states && <Section id="states" title="States & edge cases"><SimpleTable head={["Case", "What it shows"]} widths={["32%", "68%"]} rows={c.states} /></Section>}
        {c.content && <Section id="content" title="Content & voice" lead="Written to the SHAPE Voice and Language Guide."><SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={c.content} /></Section>}

        <Section id="a11y" title="Accessibility">
          <Prose>{[...SHELL_A11Y, ...(c.a11y || [])].map((p, i) => <p key={i}>{p}</p>)}</Prose>
        </Section>

        <Section id="usage" title="Usage">
          <CodeBlock label="On a report" code={c.usageCode || `// A widget on the canvas is one object; the card picks its body from familyId + formIndex.\nconst widget = { id: "w1", kind: "library", familyId: "${family.id}", formIndex: 0 };\n\n<WidgetCard widget={widget} onOpenModal={openScope} onChangeForm={cycleForm} onRemove={remove} />`} />
          {c.usageNote || <Prose><p>Library widgets always describe the whole population of the report they sit on. Never add a filter or scope control to the card: narrowing happens in the Scope or through the chat.</p></Prose>}
        </Section>

        <Section id="done" title="Done checklist" lead="You're done when every line is true.">
          <List items={[...(c.done || []), "Every text matches a role in the widget Font System (the type audit says “All on-system”).", "Every colour is a design-system token; Light and Dark both read.", "The card is exactly its grid size; nothing spills past its edge at any title length."]} />
        </Section>
      </>
    );
  }
  return { meta, toc, Page };
}

/* ---- shared by every widget ------------------------------------------------ */
const SHELL_SPEC = [
  ["Card", "Size", "1x1 164 × 164, 2x2 344 × 344, 3x3 524 × 524. Fixed pixels on a 164px grid with 16px gaps; never fluid."],
  ["", "Shell", "16px padding, 12px between parts, 18px radius (radius/widget), 1px border/secondary; fill color/surface/General/card; border/strong while active."],
  ["Header", "Title", "Text 3xs-Header / Medium: 11px, 500, uppercase, 0.11px tracking, line height normal trimmed to cap height and baseline (text-box: trim-both cap alphabetic), in a box 12px tall for one line (text centred) and 22px for two (the Header Rule: Widgets › Widget structure). text/tertiary; text/secondary while the widget is active (its Scope is open). Two lines at most; drops to one (ellipsis, full title on hover) when the body needs the room."],
  ["Hover", "Lift", "The md shadow and a 2px rise; a 28px round three-dot button fades in 7px from the top-right corner."],
];
const SHELL_BEHAVIOUR = [
  ["Hover or focus", "The card lifts and shows the three-dot button."],
  ["Press", "A quick squash to 0.97, released on a spring; then it opens."],
  ["Three-dot menu", "Change Widget (when the family has another form), About Widget, Rename, Edit with AI, Remove Widget."],
  ["Drag", "Reorders the card on the report (the report's own grid; no free placement)."],
];
const SHELL_A11Y = [
  "To ship: the card must be a button (Enter or Space opens it, its name is the widget title). In the prototype it's a clickable element that a keyboard can't reach yet, and the three-dot button only appears on hover. Both are open work.",
  "Numbers are never told by colour alone: the status word or the sign of the change is always in the text.",
];

export const find = (sel) => (r) => [...r.querySelectorAll(sel)];
export const findOne = (sel) => (r) => [r.querySelector(sel)];
