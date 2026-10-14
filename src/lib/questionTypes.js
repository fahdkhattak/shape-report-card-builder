import {
  Type, ListOrdered, ListChecks, Grid3x3, Smile, Gauge, BarChart3, AlignLeft, Layers,
} from "lucide-react";

/* ================================================================== */
/* QUESTION TYPE CATALOG — one entry per real question type. Feeds both  */
/* `NodePalette.jsx`/`SurveyOutline.jsx`'s `QuestionTypePicker` (click-to- */
/* add) and `QuestionFields.jsx`'s `TYPE_FIELD_FORMS` (per-type edit       */
/* form dispatch) and `components/survey/respond/*` (per-type respondent-  */
/* render dispatch) — one source of truth for "what types exist" rather     */
/* than three independently-maintained lists.                                */
/*                                                                            */
/* `alcohol` and `bmi` used to be their own dedicated types here. Per         */
/* explicit feedback ("some of these are super niche... there should be a     */
/* custom question crafter... I'm trying to reduce the amount of choices       */
/* and create some simplicity here while retaining the question's integrity")   */
/* both are retired as fixed catalog entries: `alcohol` was mechanically         */
/* identical to `multiple-choice` (a single-select list) with nothing genuinely   */
/* type-specific about it beyond a preset option list and an auto-tag, so it's     */
/* just gone — that same result is one click away via Multiple Choice. `bmi`        */
/* needed a real composite UI (two inputs + a computed result) no other type         */
/* covers, so it became the first real use of the new general-purpose `custom`        */
/* type below rather than staying a one-off. `toggle-board` was corrected against      */
/* a real reference screenshot the user shared: it's a RATING MATRIX (rows of           */
/* sub-items x a shared scale, one radio per row), not literal on/off toggles.            */
/* ================================================================== */
export const QUESTION_TYPE_CATALOG = [
  {
    id: "input",
    label: "Input",
    icon: Type,
    defaultTypeData: () => ({ inputKind: "short", placeholder: "" }),
    summary: (d) => (d.inputKind === "number" ? "Number input" : "Short text input"),
  },
  {
    id: "likert",
    label: "Likert",
    icon: ListOrdered,
    defaultTypeData: () => ({ points: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] }),
    summary: (d) => `${d.points}-point scale`,
  },
  {
    id: "multiple-choice",
    label: "Multiple Choice",
    icon: ListChecks,
    defaultTypeData: () => ({ options: ["Option 1", "Option 2"], allowMultiple: false }),
    summary: (d) => `${d.options.length} option${d.options.length === 1 ? "" : "s"}${d.allowMultiple ? " · multi-select" : ""}`,
  },
  {
    id: "toggle-board",
    label: "Toggle Board",
    icon: Grid3x3,
    defaultTypeData: () => ({ rows: ["Row 1", "Row 2", "Row 3"], columns: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"] }),
    summary: (d) => `${d.rows.length} row${d.rows.length === 1 ? "" : "s"} × ${d.columns.length} col${d.columns.length === 1 ? "" : "s"}`,
  },
  {
    id: "smiley-5",
    label: "Smiley 1-5",
    icon: Smile,
    defaultTypeData: () => ({}),
    summary: () => "5-point smiley scale",
  },
  {
    id: "scale-0-10",
    label: "Scale 0-10",
    icon: Gauge,
    defaultTypeData: () => ({ minLabel: "Not at all", maxLabel: "Extremely" }),
    summary: () => "0-10 scale",
  },
  {
    id: "scale-1-10",
    label: "Scale 1-10",
    icon: BarChart3,
    defaultTypeData: () => ({ minLabel: "Not at all", maxLabel: "Extremely" }),
    summary: () => "1-10 scale",
  },
  {
    id: "freetext",
    label: "Freetext",
    icon: AlignLeft,
    defaultTypeData: () => ({ placeholder: "Share your thoughts...", multiline: true }),
    summary: () => "Open text response",
  },
  {
    id: "custom",
    label: "Custom",
    icon: Layers,
    // The escape hatch for anything the 7 fixed types above don't cover —
    // a handful of labeled numeric fields, with an optional computed
    // result (Sum/Average/BMI). Starts blank; the editor itself offers a
    // "Use the Body Mass Index template" quick-start rather than this
    // catalog hardcoding BMI's own field shape.
    defaultTypeData: () => ({ fields: [], compute: "none", resultLabel: "" }),
    summary: (d) => {
      if (!d.fields.length) return "No fields yet";
      const base = `${d.fields.length} field${d.fields.length === 1 ? "" : "s"}`;
      const mode = CUSTOM_COMPUTE_MODES.find((m) => m.value === d.compute);
      return d.compute === "none" ? base : `${base} · ${mode.label} result`;
    },
  },
];

export function questionTypeById(id) {
  return QUESTION_TYPE_CATALOG.find((t) => t.id === id);
}

/* ---- Custom question type support ---- */

export const CUSTOM_COMPUTE_MODES = [
  { value: "none", label: "None" },
  { value: "sum", label: "Sum" },
  { value: "average", label: "Average" },
  { value: "bmi", label: "BMI" },
];

// A real starting point for the most common composite question this app
// knows about — applied by the editor's "Use a template" action, not
// hardcoded as its own catalog entry. Height/weight are fixed to cm/kg
// (no imperial unit switcher) — the old dedicated `bmi` type's three-way
// weight-unit/two-way height-unit pickers were exactly the kind of
// bespoke complexity this pass is removing; a plain metric pair keeps the
// question's real integrity (a genuine computed BMI) without it.
export const BMI_TEMPLATE = {
  fields: [
    { id: "height", label: "Height", unit: "cm" },
    { id: "weight", label: "Weight", unit: "kg" },
  ],
  compute: "bmi",
  resultLabel: "Your BMI is",
};

// Standard kg/m² formula.
export function computeBMI({ heightCm, weightKg }) {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

// `values` is an array aligned with `typeData.fields`, each a string/number
// or "" for unanswered. `bmi` reads the first two fields as height(cm)/
// weight(kg) — the shape `BMI_TEMPLATE` always produces.
export function computeCustomResult(mode, values) {
  const nums = values.map((v) => (v === "" || v == null ? null : Number(v))).filter((v) => v !== null && !Number.isNaN(v));
  if (mode === "sum") return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
  if (mode === "average") return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  if (mode === "bmi") return computeBMI({ heightCm: Number(values[0]), weightKg: Number(values[1]) });
  return null;
}
