import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../../lib/ds.js";
import { font } from "../../../../lib/tokens.js";
import { FORMS, formById, buildFormSpec } from "../../../../lib/subjectForms.js";
import { customFor, ACTIONS } from "../../../../lib/widgetCustom.js";
import { auditStructure } from "../../../../lib/widgetStructure.js";
import { FullCard, useFits, keyOf } from "../../../widgetbuilder/WidgetEditor.jsx";
import { SAMPLE_SUBJECTS } from "../../sampleSubjects.js";
import RecipeBoard from "../../RecipeBoard.jsx";
import { Section, Prose, CodeBlock, Callout } from "../../docKit.jsx";
import { SpecTable } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";

/* ================================================================== */
/* WIDGET RECIPES: every widget as a recipe, one answer per decision:     */
/* subject → insight type → form → size → evidence → Action Bar. The board */
/* is driven by the same rules the Widget Builder uses (FORMS' blocked() and*/
/* sizes, widgetCustom.js customFor(), and the measured room from the       */
/* editor's useFits()), so a path that can be drawn here is a widget that   */
/* can be built, and anything ruled out says why.                           */
/* ================================================================== */
export const meta = {
  id: "widget-recipe", name: "Widget recipes", group: "Widgets", kind: "Widget recipes",
  blurb: "Every widget is a recipe: one choice per row, from what it's about to the link at its foot. Pick a path; what the earlier choices rule out is crossed out, with the reason.",
  source: "lib/subjectForms.js (FORMS, buildFormSpec) · lib/widgetCustom.js (customFor) · widgetbuilder/WidgetEditor.jsx (useFits) · developer/RecipeBoard.jsx",
};
export const toc = [
  { id: "board", label: "The recipe board" }, { id: "result", label: "The widget" }, { id: "math", label: "How many recipes" },
  { id: "rules", label: "How each choice narrows the next" }, { id: "code", label: "The recipe as data" },
];

/* What job the widget does, then the forms that do it. */
export const INSIGHT_TYPES = [
  { id: "number", label: "A number", forms: ["score", "gauge"] },
  { id: "status", label: "A status", forms: ["status", "people"] },
  { id: "time", label: "Over time", forms: ["history", "momentum", "heat", "goal"] },
  { id: "parts", label: "Its parts", forms: ["parts", "profile", "index", "movers", "whatif"] },
  { id: "groups", label: "By group", forms: ["groups", "focus", "team", "versus", "composition", "spread"] },
  { id: "overview", label: "Overview", forms: ["story", "check"] },
  { id: "pair", label: "Two measures", forms: ["duel"] },
  { id: "action", label: "An action", forms: ["nudge"] },
];
const typeOf = (form) => INSIGHT_TYPES.find((t) => t.forms.includes(form))?.id;
const SIZES = ["1x1", "2x2", "3x3"];
const sz = (s) => s.replace("x", "×");
const SUBJECTS = SAMPLE_SUBJECTS.map((x, i) => ({ id: String(i), label: x.subject.kind === "overall" ? "Organisation" : x.subject.label, kind: x.label, subject: x.subject }));

const PRESETS = [
  { name: "Org Score card", subj: "0", form: "score", size: "2x2", ev: "people", link: null },
  { name: "Sleep over time", subj: "2", form: "history", size: "2x2", ev: "own", link: null },
  { name: "Where to act in Corporate Culture", subj: "1", form: "nudge", size: "2x2", ev: "own", link: null },
  { name: "Who works here", subj: "0", form: "composition", size: "2x2", ev: "largest", link: null },
  { name: "Burnout Risk ring", subj: "4", form: "gauge", size: "1x1", ev: null, link: null },
].filter((p) => SUBJECTS[Number(p.subj)]);

/* Resolve a wish (what was picked) into a recipe the rules allow: each step falls back to the first open answer. */
function resolve(wish) {
  const S = SUBJECTS.find((x) => x.id === wish.subj) || SUBJECTS[0];
  const s = S.subject;
  const open = (f) => !formById(f).blocked(s);
  const types = INSIGHT_TYPES.filter((t) => t.forms.some(open));
  const type = types.find((t) => t.id === (wish.type || typeOf(wish.form))) || types[0];
  const form = type.forms.includes(wish.form) && open(wish.form) ? wish.form : type.forms.find(open);
  const base = buildFormSpec(form, s, { size: wish.size });
  return { S, s, type, form, base };
}

export default function WidgetRecipeDoc() {
  const [wish, setWish] = useState({ subj: "2", form: "history", size: "2x2", ev: "own", link: null });
  const [ghostWish, setGhostWish] = useState(null);
  const { S, s, type, form, base } = useMemo(() => resolve(wish), [wish]);
  const def = formById(form);

  // Evidence and the link are measured: every evidence choice, with and without a link, drawn full size and checked.
  const all = customFor(base, { own: true });
  const linkChoices = all.actionRequired ? [false] : [false, true];
  const probeSpec = { ...base, custom: { action: wish.link || "details" } };
  const [{ own, fits }, probes] = useFits(probeSpec, [null, ...all.kinds.map((k) => k.id)], linkChoices);
  const can = customFor(base, { own });
  const fit = (ev, link) => fits[keyOf(ev, link)] !== false;
  const oneByOne = base.size === "1x1";

  // Resolve the evidence and the link the same way: what was picked, if the rules and the room allow it.
  let link = all.actionRequired || can.action === "blocked" ? null : wish.link;
  // A choice that no longer applies falls back to the widget's own evidence (as built), or none if it draws none.
  const firstFit = () => (can.kinds.find((k) => !k.generic && fit(k.id, !!link)) || can.kinds.find((k) => fit(k.id, !!link)))?.id ?? null;
  let ev = can.evidence === "none" || (oneByOne && (link || all.actionRequired)) ? null
    : can.kinds.some((k) => k.id === wish.ev) && fit(wish.ev, !!link) ? wish.ev
    : wish.ev === null && can.evidence !== "required" ? null
    : own || can.evidence === "required" ? firstFit() : null;
  if (link && !fit(ev, true)) link = null;
  const spec = { ...base, custom: { evidence: ev != null, evidenceKind: ev || undefined, action: link } };

  const pick = (row, id) => setWish((w) => {
    if (row === "subj") return { ...w, subj: id };
    if (row === "type") { const t = INSIGHT_TYPES.find((x) => x.id === id); return { ...w, type: id, form: t.forms.find((f) => !formById(f).blocked(s)) }; }
    if (row === "form") return { ...w, type: typeOf(id), form: id };
    if (row === "size") return { ...w, size: id };
    if (row === "ev") return { ...w, ev: id === "none" ? null : id };
    if (row === "link") return { ...w, link: id === "none" ? null : id, ...(oneByOne && id !== "none" ? { ev: null } : {}) };
    return w;
  });

  const evLabel = ev ? (ev === "own" ? "its own evidence" : can.kinds.find((k) => k.id === ev)?.label.toLowerCase()) : null;
  const linkLabel = all.actionRequired ? "See actions you can take" : link ? ACTIONS.find((a) => a.id === link)?.label : null;
  const rows = [
    { id: "subj", label: "About", hint: "the subject", options: SUBJECTS.map((x) => ({ id: x.id, label: x.label, why: x.kind, state: x.id === S.id ? "on" : "open" })) },
    { id: "type", label: "Insight type", options: INSIGHT_TYPES.map((t) => {
      const blocked = t.forms.every((f) => formById(f).blocked(s));
      return { id: t.id, label: t.label, state: t.id === type.id ? "on" : blocked ? "off" : "open", why: blocked ? formById(t.forms[0]).blocked(s) : t.forms.map((f) => formById(f).name).join(", ") };
    }) },
    { id: "form", label: "Form", hint: "the Insight", options: type.forms.map((f) => { const why = formById(f).blocked(s); return { id: f, label: formById(f).name, state: f === form ? "on" : why ? "off" : "open", why: why || formById(f).why }; }) },
    { id: "size", label: "Size", options: SIZES.map((z) => {
      const ok = base.sizes.includes(z);
      return { id: z, label: sz(z), state: z === base.size ? "on" : ok ? "open" : "off", why: ok ? undefined : def.sizes.includes(z) ? `This data doesn't fit a ${sz(z)}` : `${def.name} doesn't come in a ${sz(z)}` };
    }) },
    { id: "ev", label: "Evidence", hint: "based on what?", options: can.evidence === "none"
      ? [{ id: "none", label: "None", state: "on", why: all.actionRequired && oneByOne ? "A 1×1 action widget's one bar is its link" : "This widget has no evidence it can show" }]
      : [
        { id: "none", label: "None", state: ev == null ? "on" : can.evidence === "required" ? "off" : "open", why: can.evidence === "required" ? "This widget can't be read without its evidence at this size" : "The Insight takes the card" },
        ...can.kinds.map((k) => {
          const blockedByLink = oneByOne && !!link;
          const room = fit(k.id, !!link);
          return { id: k.id, label: k.label, state: k.id === ev ? "on" : blockedByLink || !room ? "off" : "open", why: blockedByLink ? "On a 1×1 the link takes the Evidence Bar's place" : !room ? "No room beside the Insight at this size" : k.blurb };
        }),
      ] },
    { id: "link", label: "Action Bar", options: all.actionRequired
      ? [{ id: "actions", label: "See actions you can take", state: "on", why: "An action widget always has its link" }]
      : [
        { id: "none", label: "None", state: link ? "open" : "on" },
        ...ACTIONS.map((a) => {
          const ruled = can.action === "blocked" ? "A 1×1 has room for one bar, and this widget needs its evidence" : !fit(oneByOne ? null : ev, true) ? "No room for a link at this size" : null;
          return { id: a.id, label: a.label, state: a.id === link ? "on" : ruled ? "off" : "open", why: ruled || undefined };
        }),
      ] },
  ];
  const name = [`${S.label} ${def.name} ${sz(base.size)}`, evLabel && `with ${evLabel}`, linkLabel && `and “${linkLabel}”`].filter(Boolean).join(" ");

  // A preset hovered draws its path in grey, through whatever of it is on the board.
  const ghost = ghostWish ? (() => { const g = resolve(ghostWish); return { subj: g.S.id, type: g.type.id, form: g.form, size: g.base.size, ev: ghostWish.ev || "none", link: ghostWish.link || "none" }; })() : null;

  return (
    <>
      {probes}
      <Section id="board" title="The recipe board" lead="Pick one answer per row. The line is the recipe; the blue name reads straight off it. Crossed-out answers are ruled out by the ones above them; hover one to see why.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[8], alignItems: "center", marginBottom: dsSpace[12] }}>
          <span style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>Saved recipes</span>
          {PRESETS.map((p) => (
            <button key={p.name} type="button" onMouseEnter={() => setGhostWish(p)} onMouseLeave={() => setGhostWish(null)} onFocus={() => setGhostWish(p)} onBlur={() => setGhostWish(null)}
              onClick={() => { setWish({ subj: p.subj, form: p.form, size: p.size, ev: p.ev, link: p.link }); setGhostWish(null); }}
              style={{ border: `${dsBorder.sm}px solid ${ds.border.secondary}`, background: ds.surface.general.card, borderRadius: dsRadius.full, padding: "4px 12px", fontFamily: font, ...dsText("Text xs", 500), color: ds.text.secondary, cursor: "pointer" }}>
              {p.name}
            </button>
          ))}
        </div>
        <RecipeBoard rows={rows} onPick={pick} ghost={ghost} name={name} nameLabel="Widget" />
      </Section>

      <Section id="result" title="The widget" lead="The recipe, drawn. It's the real widget, measured by the structure check.">
        <Result spec={spec} />
      </Section>

      <Section id="math" title="How many recipes" lead="The rules multiply out. These are the paths through the board for each subject, counted from the rules alone; the room each one needs is then measured when it's drawn.">
        <Counts current={S.id} fits={fits} kinds={all.kinds.length} links={linkChoices.length} />
      </Section>

      <Section id="rules" title="How each choice narrows the next" lead="Every crossed-out answer comes from one of these. They live in the code the Widget Builder runs, not on this page.">
        <SpecTable head={["Choice", "Narrows", "Rule", "Where it lives"]} widths={["14%", "14%", "48%", "24%"]} rows={[
          ["About", "Insight type, Form", "A form needs what the subject has: parts (Parts, Movers, Heat strip: two or more; Profile: four; Index: three), per-person scores (People, Groups, Focus, Spread, Group, Versus), two named topics (Head to head), the whole organisation (Story). A Driver has no Status widget.", "FORMS[].blocked(subject)"],
          ["Form", "Size", "Each form comes in its own sizes, and the data can rule one out: a composition of more than seven groups, or more rounds than a 1×1 graph holds, can't be a 1×1.", "FORMS[].sizes, fitSizes(payload)"],
          ["Form + Size", "Evidence", "The form's own evidence if it draws one at that size, then the generic kinds that make sense with it (none that repeat the Insight; none on a widget about one group). A 1×1 Focus or Movers can't be read without its own.", "customFor(), CUSTOM[form].generic"],
          ["Evidence", "Room", "Each evidence choice is drawn full size and checked: nothing may spill, be squeezed, cut off or overlap. A choice that fails is crossed out.", "useFits() → auditStructure()"],
          ["Size + Evidence", "Action Bar", "A 1×1 has one bar: a link takes the Evidence Bar's place. A link is only offered where it fits beside what's already there.", "customFor(), useFits()"],
          ["Form", "Action Bar", "An action widget (Next Step) always has its link: it's what makes it that widget.", "CUSTOM.nudge.action = \"required\""],
        ]} />
        <Callout title="Same rules, three places">This board, the Widget Builder's editor (<DocLink id="widgets-builder">Widget Builder forms</DocLink>) and the gallery sweep all read these rules, so a recipe you can draw here is a widget the builder can make.</Callout>
      </Section>

      <Section id="code" title="The recipe as data" lead="A recipe is five answers. The builder turns it into a widget spec with buildFormSpec() and adds the evidence and link as custom.">
        <CodeBlock label="Recipe" code={JSON.stringify({ about: `${S.subject.kind}:${S.label}`, form, size: base.size, evidence: ev, link: all.actionRequired ? "actions (always on)" : link }, null, 2)} />
        <CodeBlock label="Spec" code={`buildFormSpec(${JSON.stringify(form)}, subject, { size: ${JSON.stringify(base.size)}, options: ${JSON.stringify(base.options)} })
// → { vizType: "form", form: ${JSON.stringify(form)}, size: ${JSON.stringify(base.size)}, title: ${JSON.stringify(base.title)}, … }
spec.custom = ${JSON.stringify(spec.custom)};`} />
        <Prose><p>Header: “{base.title}”. The title is part of the recipe too: it names what the widget is and can be renamed in the builder, but never to a value.</p></Prose>
      </Section>
    </>
  );
}

/* The widget, full size, with what the structure check measured. */
function Result({ spec }) {
  const ref = useRef(null);
  const [audit, setAudit] = useState(null);
  const sig = JSON.stringify([spec.form, spec.size, spec.custom, spec.title]);
  useLayoutEffect(() => {
    const t = setTimeout(() => { const card = ref.current?.querySelector("[data-widget-card]"); if (card) setAudit(auditStructure(card, spec.size)); }, 120);
    return () => clearTimeout(t);
  }, [sig]);
  return (
    <div style={{ display: "flex", gap: dsSpace[32], alignItems: "flex-start", flexWrap: "wrap", background: ds.bg.primary, borderRadius: dsRadius.xl, padding: dsSpace[32] }}>
      <div ref={ref}><FullCard spec={spec} /></div>
      {audit && (
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], maxWidth: 320 }}>
          <span style={{ ...dsText("Text sm", 600), color: audit.issues.length ? ds.status.error.text : ds.status.success.textIndicator }}>{audit.issues.length ? "Fails the structure check" : "Passes the structure check"}</span>
          <span style={{ ...dsText("Text xs"), color: ds.text.secondary }}>Template: {audit.template?.name || "none"}</span>
          {audit.issues.map((i) => <span key={i} style={{ ...dsText("Text xs"), color: ds.text.secondary }}>{i}</span>)}
        </div>
      )}
    </div>
  );
}

/* Paths through the board per subject, from the rules (before room is measured), and what was measured for the current form. */
function Counts({ current, fits, kinds, links }) {
  const rows = useMemo(() => SUBJECTS.map((S) => {
    let forms = 0, total = 0;
    FORMS.forEach((f) => {
      if (f.blocked(S.subject)) return;
      forms += 1;
      const sizes = buildFormSpec(f.id, S.subject).sizes;
      sizes.forEach((size) => {
        const c = customFor(buildFormSpec(f.id, S.subject, { size }), { own: true });
        const evs = c.evidence === "none" ? 1 : c.evidence === "required" ? c.kinds.length : 1 + c.kinds.length;
        const lk = c.actionRequired || c.action === "blocked" ? 0 : ACTIONS.length;
        // A 1×1 link replaces the Evidence Bar, so it adds options rather than multiplying them.
        total += size === "1x1" ? evs + lk : evs * (1 + lk);
      });
    });
    return { S, forms, total };
  }), []);
  const measured = Object.values(fits);
  return (
    <>
      <SpecTable head={["About", "Kind", "Forms open", "Recipes (by the rules)"]} widths={["28%", "26%", "18%", "28%"]} rows={rows.map((r) => [r.S.id === current ? <b key="b">{r.S.label}</b> : r.S.label, r.S.kind, String(r.forms), r.total.toLocaleString("en-GB")])} />
      {measured.length > 0 && (
        <Prose><p>For the form and size on the board: {kinds + 1} evidence choices × {links} link choice{links === 1 ? "" : "s"} = {measured.length} combinations drawn, <b>{measured.filter(Boolean).length} fit</b>. The others are crossed out on the board.</p></Prose>
      )}
    </>
  );
}
