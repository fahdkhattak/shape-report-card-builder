import { useCallback, useEffect, useRef, useState } from "react";
import { ds, dsText, dsSpace, dsRadius } from "../../../lib/ds.js";
import { familyById, nextFormIndex, GROUPS, PERSONA_LABEL } from "../../../lib/families.js";
import { shapeSize } from "../../shape/shapeWidgets.jsx";
import WidgetCard from "../../canvas/WidgetCard.jsx";
import { Section, Prose, Variant, Anatomy, Inspectable, CodeBlock } from "../docKit.jsx";
import { SpecTable, SimpleTable, List } from "../docParts.jsx";
import DataNeeds, { DocLink } from "../DataNeeds.jsx";
import { contractFor } from "../dataContract.js";
import { auditStructure } from "../../../lib/widgetStructure.js";

/* ================================================================== */
/* WIDGET DOC: one page shape for every widget, driven by config (like    */
/* storyDoc.jsx for Stories). The live examples are the real canvas       */
/* WidgetCard (hover, three-dot menu, Change Widget), each with the       */
/* template it is built to (lib/widgetStructure.js).                       */
/* ================================================================== */
const noop = () => {};

/* One real widget card at its native size. Library: `familyId` + `formIndex` (local, so Change Widget works). Any other
   widget (a SHAPE report widget): `widget`. */
export function LiveWidget({ familyId, formIndex: start = 0, title, widget: given, fit = false }) {
  const [formIndex, setFormIndex] = useState(start);
  const widget = given || { id: `doc-${familyId}-${start}`, kind: "library", familyId, formIndex, customTitle: title };
  const next = () => setFormIndex((i) => nextFormIndex(familyId, i));
  // `fit`: the grid is only as wide as the card (for the All widgets sheet, where cards sit side by side).
  const size = given ? given.size || given.spec?.size || shapeSize(given) : familyById(familyId).forms[formIndex].size;
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

/* The structure check (lib/widgetStructure.js) on a live card, once it has settled: its template, or what's off. */
export function useStructure(ref, k) {
  const [res, setRes] = useState(null);
  useEffect(() => {
    setRes(null);
    const t = setTimeout(() => { const c = ref.current?.querySelector("[data-widget-card]"); if (c) setRes(auditStructure(c, c.dataset.size)); }, 900);
    return () => clearTimeout(t);
  }, [ref, k]);
  return res;
}
/* The template a form uses, for tables: "Insight + Evidence Section". */
export const templateLabel = (res) => (!res ? "…" : res.template?.name || "…");

/* One form: the live card. `onStructure(key, result)` reports its measured template up (for the forms tables). */
export function FormExample({ familyId, formIndex, widget, title, note, k, onStructure }) {
  const ref = useRef(null);
  const key = k || `${familyId}:${formIndex}:${widget?.widgetId || widget?.id || ""}:${widget?.personId || ""}`;
  const structure = useStructure(ref, key);
  useEffect(() => { if (structure && onStructure) onStructure(key, structure); }, [structure, key, onStructure]);
  return (
    <Variant title={title} note={note}>
      <div ref={ref}><WidgetStage><LiveWidget familyId={familyId} formIndex={formIndex} widget={widget} /></WidgetStage></div>
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
    { id: "overview", label: "Overview" }, ...(c.extra || []).map(({ id, label }) => ({ id, label })), { id: "forms", label: c.familyIds || c.presets ? "Library forms" : "The forms" },
    { id: "anatomy", label: "Anatomy" }, { id: "spec", label: "Specification" },
    hasContract && { id: "data", label: "Data it needs" }, { id: "behaviour", label: "Behaviour" },
    c.states && { id: "states", label: "States & edge cases" }, c.content && { id: "content", label: "Content & voice" },
    { id: "a11y", label: "Accessibility" }, { id: "usage", label: "Usage" }, { id: "done", label: "Done checklist" },
  ].filter(Boolean);
  const allForms = families.flatMap((fam) => fam.forms.map((f, i) => ({ fam, f, i })));

  // Anatomy: the hand-written parts, or the four sections on the first form of each size.
  const anatomy = c.anatomy || [...new Set(allForms.map(({ f }) => f.size))].map((size) => { const x = allForms.find(({ f }) => f.size === size); return { familyId: x.fam.id, form: x.i, parts: SECTION_PARTS }; });

  function Page() {
    const [structures, setStructures] = useState({});
    const onStructure = useCallback((k, res) => setStructures((m) => (m[k] === res ? m : { ...m, [k]: res })), []);
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
            <p><b>Library group:</b> {family.category}. <b>Forms:</b> {allForms.length}{c.familyIds ? ` across ${families.length} Library families (${families.map((f) => f.name).join(", ")})` : ""}.</p>
          </Prose>
        </Section>

        {(c.extra || []).map((x) => <Section key={x.id} id={x.id} title={x.label} lead={x.lead}>{x.render()}</Section>)}

        <Section id="forms" title={c.familyIds || c.presets ? "Library forms" : "The forms"} lead={`${c.familyIds || c.presets ? "The fixed forms the Library offers, each a preset of the one widget. " : ""}Each form is one fixed size on the report grid (1x1 = 164px, 2x2 = 344px, 3x3 = 524px) and one of the templates for its size. Hover a card for its menu.`}>
          <SimpleTable head={["Form", "Size", "Persona", "Template", "What it shows"]} widths={["22%", "8%", "10%", "20%", "40%"]} rows={allForms.map(({ fam, f, i }) => [f.name, f.size, PERSONA_LABEL[f.persona || fam.persona] || "Org", templateLabel(structures[`${fam.id}:${i}`]), (fam === family && c.forms?.[i]) || f.blurb])} />
          <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[24] }}>
            {allForms.map(({ fam, f, i }) => <FormExample key={`${fam.id}-${i}`} k={`${fam.id}:${i}`} onStructure={onStructure} familyId={fam.id} formIndex={i} title={`${f.name} · ${f.size}`} note={f.blurb} />)}
          </div>
        </Section>

        {(
          <Section id="anatomy" title="Anatomy" lead={c.anatomy ? "Numbered on the live card, then measured from the browser, so the table can't drift from what ships." : "The widget's sections (Widgets › Widget structure), numbered on the live card and measured from the browser: the header, the Insight, and the Evidence and Action Bar where the form has them."}>
            {anatomy.map((a, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
                {anatomy.length > 1 && <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>{familyById(a.familyId || family.id).forms[a.form].name} · {familyById(a.familyId || family.id).forms[a.form].size}</span>}
                <Anatomy parts={a.parts} width={1040}><div style={{ display: "flex" }}><LiveWidget familyId={a.familyId || family.id} formIndex={a.form} /></div></Anatomy>
              </div>
            ))}
          </Section>
        )}

        <Section id="spec" title="Specification" lead="The card shell is shared by every widget; its text follows the widget Font System (Foundations › Widget type system).">
          <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[...SHELL_SPEC, ...(c.spec || [])]} />
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
          <List items={[...(c.done || []), "Every form is one of the templates for its size: sections 12px apart, nothing spilling.", "Every text matches a role in the widget Font System.", "Every colour is a design-system token; Light and Dark both read.", "The card is exactly its grid size; nothing spills past its edge at any title length."]} />
        </Section>
      </>
    );
  }
  return { meta, toc, Page };
}

/* ---- shared by every widget ------------------------------------------------ */
/* The default anatomy: the template's sections. A module constant, so the Anatomy's measuring effect doesn't loop. */
export const SECTION_PARTS = [
  { id: "card", name: "Card", note: "The shared widget shell: 1px border + 15px padding = 16px from the edge.", find: (r) => [r.querySelector("[data-widget-card]")] },
  { id: "header", name: "Header", note: "12px for one line, 22px for two.", find: (r) => [r.querySelector('[data-part="widget-header"]')] },
  { id: "insight", name: "Insight", note: "The answer. The only section that stretches.", find: (r) => [r.querySelector('[data-part="section-insight"]')] },
  { id: "evidence", name: "Evidence", note: "24px Evidence Bar (1x1), 68px Evidence Section (2x2, 3x3). Content at its foot.", find: (r) => [r.querySelector('[data-part="section-evidence"]')] },
  { id: "action", name: "Action Bar", note: "24px, content at the right.", find: (r) => [r.querySelector('[data-part="section-action"]')] },
];
const SHELL_SPEC = [
  ["Card", "Size", "1x1 164 × 164, 2x2 344 × 344, 3x3 524 × 524. Fixed pixels on a 164px grid with 16px gaps; never fluid."],
  ["", "Shell", "16px from the outer edge to the content (1px border/secondary + 15px padding), 12px between sections, 18px radius (radius/widget); fill color/surface/General/card; border/strong while active."],
  ["Sections", "Template", "Header, Insight, then Evidence and / or an Action Bar, as the size's templates allow (Widgets › Widget structure). Evidence 24px on a 1x1, 68px on a 2x2 or 3x3; Action Bar 24px; only the Insight stretches. Nothing spills out of a section."],
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
  "The card is a button: Enter or Space opens it, and its accessible name is the widget title. The three-dot button shows on keyboard focus as well as on hover.",
  "Numbers are never told by colour alone: the status word or the sign of the change is always in the text.",
];

export const find = (sel) => (r) => [...r.querySelectorAll(sel)];
export const findOne = (sel) => (r) => [r.querySelector(sel)];
