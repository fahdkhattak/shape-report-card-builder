/* ================================================================== */
/* WIDGET CUSTOMISATION: what a person may change on a widget they built */
/* in the Widget Builder, section by section, inside the section rules    */
/* (lib/widgetStructure.js SECTION_RULES):                                */
/*   Header     the title (two lines at most, never a value)               */
/*   Insight    always on; its form changes with the form buttons, and some */
/*              of its elements can be hidden (`elements`)                  */
/*   Evidence   on or off (off → the Insight takes the card). On, it shows  */
/*              the form's own evidence or one of the generic kinds below   */
/*              (`GENERIC_EVIDENCE`), so a form drawn without evidence can   */
/*              be given some, and one drawn with it can swap or drop it    */
/*   Action Bar off, or one link; on a 1x1 it takes the Evidence Bar's     */
/*              place (a 1x1 never has both bars). An action widget keeps   */
/*              its link: it's what makes it that widget                   */
/* Stored on the spec as `custom: { hide: [ids], evidence: true | false,  */
/* evidenceKind, action: null | id }`; the bodies read it through the     */
/* WidgetCustom context (widgets/primitives.jsx).                          */
/* ================================================================== */
export const ACTIONS = [
  { id: "details", label: "Open details" },
  { id: "support", label: "Get support" },
  { id: "report", label: "Open the full report" },
  { id: "method", label: "How it's measured" },
];
export const actionLabel = (id) => ACTIONS.find((a) => a.id === id)?.label || null;

/* Evidence any built widget can carry, read from the spec's facts (payload.ev) (subjectForms.js evidenceFacts). `needs` says whether
   this subject has what it takes. Each answers "based on what?", never a new conclusion. */
export const GENERIC_EVIDENCE = [
  { id: "g:people", label: "People by status", blurb: "How many people are Flourishing, Striving and Struggling.", needs: (f) => !!f.people },
  { id: "g:parts", label: (f) => `${f.parts?.noun || "Part"}s by status`, blurb: "How the parts behind the score split across the statuses.", needs: (f) => !!f.parts },
  { id: "g:change", label: "Change since last round", blurb: "How far the score moved, and since when.", needs: (f) => f.delta != null && !!f.prevLabel },
  { id: "g:line", label: "Distance to the next status", blurb: "Points to the next status line, or how far above Flourishing.", needs: (f) => f.value != null },
  { id: "g:range", label: "Strongest and lowest", blurb: "The highest and lowest part, with their scores.", needs: (f) => !!f.strongest },
  { id: "g:sample", label: "Who answered", blurb: "How many people the score is based on.", needs: (f) => f.n != null },
];
const genericLabel = (k, f) => (typeof k.label === "function" ? k.label(f) : k.label);

/* Per form. elements: Insight parts that may be hidden (`when(payload, size)` decides if the form has it).
   evidence: false (none of its own), true (its own, on / off), "required1x1" (a 1x1 can't be read without it), or [kinds].
   generic: the generic kinds that make sense with it (default all); a kind that repeats the Insight is left out, and a
   widget about one group (Group, Versus, Head to head) gets none, because the generic facts are about the whole subject.
   action: "toggle" (default) or "required" (an action widget). */
const CHANGE = { id: "change", label: "Change" };
const DATE = { id: "date", label: "Date" };
const ALL = GENERIC_EVIDENCE.map((k) => k.id);
const but = (...ids) => ALL.filter((id) => !ids.includes(id));
export const CUSTOM = {
  score: {
    elements: [CHANGE, DATE, { id: "headcount", label: "Headcount", when: (p) => !!p.org }, { id: "status", label: "Status", when: (p, size) => !p.org && size !== "1x1" }, { id: "highlights", label: "Strongest and lowest", when: (p, size) => !p.org && size !== "1x1" && !!p.strongest }],
    // A 1x1 has one Evidence Bar of its own (headcount or status); a 2x2 can show people or parts by status.
    evidence: (p, size) => (size === "1x1" ? true : [{ id: "people", label: "People by status", when: (q) => !!q.people }, { id: "parts", label: (q) => `${q.partNoun || "Part"}s by status`, when: (q) => !q.org && !!q.parts }]),
    generic: but("g:change"),
  },
  gauge: { elements: [CHANGE], evidence: true, generic: but("g:change", "g:line") },
  status: { evidence: true, generic: but("g:people", "g:parts") },
  history: { elements: [CHANGE], evidence: true, generic: but("g:change") },
  parts: { generic: but("g:parts", "g:range") },
  profile: {},
  people: { evidence: true, generic: but("g:people") },
  groups: {},
  composition: { evidence: [{ id: "legend", label: "Legend", when: (p, size) => size !== "1x1" || p.rows?.length <= 4 }, { id: "largest", label: "Largest group" }], generic: ["g:sample"] },
  focus: { evidence: "required1x1" },
  movers: { evidence: "required1x1", generic: but("g:range") },
  spread: { evidence: true, generic: but("g:people") },
  goal: { evidence: true, generic: but("g:line", "g:change") },
  index: { generic: but("g:parts") },
  heat: { generic: but("g:parts") },
  momentum: { evidence: true, generic: but("g:change") },
  nudge: { evidence: true, action: "required", generic: but("g:range") },
  story: { evidence: true, generic: [] },
  team: { evidence: true, generic: [] },
  versus: { evidence: true, generic: [] },
  duel: { evidence: true, generic: [] },
  check: { evidence: true, generic: [] },
  whatif: { evidence: true, generic: [] },
};

/* What this spec can change right now.
   evidence: "toggle" | "required" (can't be switched off at this size) | "none" (no room: a 1x1 whose bar is the action).
   kinds: [{ id, label, blurb, generic }]: the form's own kinds first (or one "own" kind), then the generic kinds it allows.
   ownAt: whether the form draws evidence of its own (decided by the editor from the live drawing; see `own` below).
   action: "toggle" | "required" | "blocked" (a 1x1 that needs its Evidence Bar). */
export function customFor(spec, { own = true } = {}) {
  const c = CUSTOM[spec?.form];
  const size = spec?.size, p = spec?.payload || {}, f = p.ev || null;
  if (!c) return { elements: [], evidence: "none", kinds: [], action: "toggle" };
  const elements = (c.elements || []).filter((e) => !e.when || e.when(p, size));
  const ev = typeof c.evidence === "function" ? c.evidence(p, size) : c.evidence;
  const asDrawn = [{ id: "own", label: "As designed", blurb: "The evidence this widget is drawn with.", generic: false }];
  const listed = Array.isArray(ev) ? ev.filter((k) => !k.when || k.when(p, size)).map((k) => ({ ...k, label: typeof k.label === "function" ? k.label(p) : k.label, generic: false })) : [];
  const ownKinds = !own ? [] : listed.length ? listed : asDrawn;
  const required = c.evidence === "required1x1" && size === "1x1";
  // A generic kind the form already offers as its own (Score's people / parts by status) isn't offered twice.
  const genericKinds = required || !f ? [] : GENERIC_EVIDENCE.filter((k) => (c.generic || ALL).includes(k.id) && k.needs(f) && !ownKinds.some((o) => `g:${o.id}` === k.id)).map((k) => ({ id: k.id, label: genericLabel(k, f), blurb: k.blurb, generic: true }));
  const actionRequired = c.action === "required";
  const action = actionRequired ? "required" : required ? "blocked" : "toggle";
  const kinds = [...ownKinds, ...genericKinds];
  const evidence = actionRequired && size === "1x1" ? "none" : required ? "required" : kinds.length ? "toggle" : "none";
  return { elements, evidence, kinds, action, actionRequired };
}

/* Which evidence is showing: "own" (or a form's own kind), a generic kind, or null (none). `own` = the form draws its own here. */
export function currentEvidence(spec, own) {
  const c = spec?.custom || {}, can = customFor(spec, { own });
  if (can.evidence === "none") return null;
  if (c.evidence === false && can.evidence !== "required") return null;
  if (c.evidenceKind && can.kinds.some((k) => k.id === c.evidenceKind)) return c.evidenceKind;
  if (own) return can.kinds[0]?.id ?? null;
  // No evidence of its own: off unless the person turned one on.
  return c.evidence === true ? can.kinds[0]?.id ?? null : null;
}

/* Keep what still applies when the form or size changes. */
export function carryCustom(custom, spec) {
  if (!custom) return undefined;
  const ok = customFor(spec);
  const hide = (custom.hide || []).filter((id) => ok.elements.some((e) => e.id === id));
  const kindOk = ok.kinds.some((k) => k.id === custom.evidenceKind);
  const evidenceKind = kindOk ? custom.evidenceKind : undefined;
  // A generic kind that no longer applies falls back to the form's own drawing.
  const evidence = ok.evidence === "required" ? true : custom.evidence;
  const action = ok.action === "toggle" ? custom.action : null;
  return { ...custom, hide, evidenceKind, evidence, action };
}
