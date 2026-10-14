import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Plus, ChevronDown, Tag, Eye, Sparkles } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { DIMENSIONS, DIMENSION_DRIVERS } from "../../lib/dataset.js";
import { questionTypeById, BMI_TEMPLATE, CUSTOM_COMPUTE_MODES } from "../../lib/questionTypes.js";
import PersonaVisibilityField from "./PersonaVisibilityField.jsx";
import SegmentedControl from "../ui/SegmentedControl.jsx";

/* ================================================================== */
/* QUESTION FIELDS — the field primitives + per-questionType edit forms  */
/* shared by both V1's Inspector.jsx (a side panel) and V2's inline       */
/* section editor. Redesigned per direct feedback ("really form-like       */
/* and not really nice") — the previous version was WidgetBuilderModal's    */
/* PayloadEditor pattern ported as-is (uppercase eyebrow labels, hard        */
/* border-bottom dividers, boxed labeled inputs): correct information         */
/* architecture, generic settings-panel visual language. This pass keeps       */
/* the same architecture (one form per questionType, one `onPatch`) and         */
/* changes the craft: soft filled fields instead of outlined boxes, the          */
/* Prompt reads as the hero (not just another labeled row), real iOS-style         */
/* toggle switches instead of checkboxes, `SegmentedControl` (the same sliding      */
/* pill used for the V1/V2 version switcher) for small 2-3 option choices           */
/* instead of a plain `<select>`, and secondary fields (help text, dataset           */
/* topic tag) tucked behind a "More options" disclosure so the common case            */
/* — write the question, set its options, done — isn't buried in a full form.          */
/* ================================================================== */

const SPRING = { type: "spring", bounce: 0, duration: 0.3 };

export const fieldStyle = { border: `1px solid ${T.gray100}`, borderRadius: 8, padding: "6px 10px", fontFamily: font, fontSize: 13, color: T.gray900, boxSizing: "border-box", width: "100%" };
export const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: T.gray500 };

// The shared soft-fill look (`.field-soft` in index.css handles hover/focus).
const softField = { border: "1px solid transparent", borderRadius: radius.md, padding: "9px 12px", fontFamily: font, fontSize: 13.5, color: T.gray900, background: T.gray50, boxSizing: "border-box", width: "100%" };

export function TextField({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <span style={{ fontSize: 12, color: T.gray500 }}>{label}</span>}
      <input type="text" className="field-soft" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={softField} />
    </label>
  );
}
export function NumberField({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <span style={{ fontSize: 12, color: T.gray500 }}>{label}</span>}
      <input type="number" className="field-soft" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} style={softField} />
    </label>
  );
}
export function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <span style={{ fontSize: 12, color: T.gray500 }}>{label}</span>}
      <select className="field-soft" value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ ...softField, cursor: "pointer" }}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// A small 2-3 option enum — the same sliding-pill SegmentedControl used
// for the Survey Builder version switcher, reused here rather than a
// plain dropdown for the handful of fields that are genuinely a toggle
// (input kind, unit choices), not a real "pick from a list."
export function SegmentedField({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
      {label && <span style={{ fontSize: 12, color: T.gray500 }}>{label}</span>}
      <SegmentedControl options={options.map((o) => ({ id: o.value, label: o.label }))} value={value} onChange={onChange} />
    </div>
  );
}

// A real switch, not a checkbox — matches iOS's own toggle, complete with
// a spring-driven knob instead of an instant flip.
export function Toggle({ label, checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}>
      <span style={{ fontSize: 13.5, color: T.gray700, fontWeight: 500 }}>{label}</span>
      <div style={{ width: 38, height: 22, borderRadius: 9999, padding: 2, background: checked ? T.accent : T.gray200, display: "flex", justifyContent: checked ? "flex-end" : "flex-start", flexShrink: 0, transition: "background 150ms ease" }}>
        <motion.div layout transition={SPRING} style={{ width: 18, height: 18, borderRadius: 9999, background: T.white, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
      </div>
    </div>
  );
}

function AddLink({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "transparent", cursor: "pointer", padding: "4px 0", fontSize: 12.5, fontWeight: 600, color: T.accent, fontFamily: font }}>
      <Plus size={13} />
      {label}
    </button>
  );
}

// Plain string list — add/remove/edit — used for MC options, likert
// labels, and toggle-board rows/columns.
export function StringListEditor({ items, onChange, addLabel = "Add item" }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const update = (i, val) => onChange(items.map((it, idx) => (idx === i ? val : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, `Item ${items.length + 1}`]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input className="field-soft" value={it} onChange={(e) => update(i, e.target.value)} style={{ ...softField, flex: 1 }} />
          <button onClick={() => remove(i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray300, display: "flex", flexShrink: 0, opacity: hoveredIdx === i ? 1 : 0, transition: "opacity 120ms ease", width: 22, justifyContent: "center" }}><Trash2 size={13} /></button>
        </div>
      ))}
      <AddLink label={addLabel} onClick={add} />
    </div>
  );
}

// Kept for ConditionInspector/ActionInspector/ComponentInspector in
// Inspector.jsx, which weren't part of this feedback (V1's condition
// rule-builder is intentionally a denser, power-user panel).
export function Section({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", borderBottom: `1px solid ${T.gray75}` }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      {children}
    </div>
  );
}

/* ---- per-questionType field forms ---- */

function InputFields({ typeData, onPatch }) {
  return (
    <>
      <SegmentedField label="Kind" value={typeData.inputKind} onChange={(v) => onPatch({ typeData: { ...typeData, inputKind: v } })} options={[{ value: "short", label: "Short text" }, { value: "number", label: "Number" }]} />
      <TextField label="Placeholder" value={typeData.placeholder} onChange={(v) => onPatch({ typeData: { ...typeData, placeholder: v } })} />
    </>
  );
}
const LIKERT_POINT_OPTIONS = [3, 4, 5, 6, 7];

function LikertFields({ typeData, onPatch }) {
  const setPoints = (n) => {
    const labels = Array.from({ length: n }, (_, i) => typeData.labels[i] ?? `Point ${i + 1}`);
    onPatch({ typeData: { points: n, labels } });
  };
  return (
    <>
      <SegmentedField
        label="Scale points"
        value={String(typeData.points)}
        onChange={(v) => setPoints(Number(v))}
        options={LIKERT_POINT_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 12, color: T.gray500 }}>Answer labels</span>
        <StringListEditor items={typeData.labels} onChange={(labels) => onPatch({ typeData: { ...typeData, labels, points: labels.length } })} addLabel="Add point" />
      </div>
    </>
  );
}
function MultipleChoiceFields({ typeData, onPatch }) {
  return (
    <>
      <Toggle label="Allow multiple selections" checked={typeData.allowMultiple} onChange={(v) => onPatch({ typeData: { ...typeData, allowMultiple: v } })} />
      <StringListEditor items={typeData.options} onChange={(options) => onPatch({ typeData: { ...typeData, options } })} addLabel="Add option" />
    </>
  );
}
function ToggleBoardFields({ typeData, onPatch }) {
  return (
    <>
      <div style={{ fontSize: 12, color: T.gray500, marginBottom: -2 }}>Rows (sub-items rated)</div>
      <StringListEditor items={typeData.rows} onChange={(rows) => onPatch({ typeData: { ...typeData, rows } })} addLabel="Add row" />
      <div style={{ fontSize: 12, color: T.gray500, marginTop: 4, marginBottom: -2 }}>Columns (shared scale)</div>
      <StringListEditor items={typeData.columns} onChange={(columns) => onPatch({ typeData: { ...typeData, columns } })} addLabel="Add column" />
    </>
  );
}
function ScaleFields({ typeData, onPatch }) {
  return (
    <>
      <TextField label="Low-end label" value={typeData.minLabel} onChange={(v) => onPatch({ typeData: { ...typeData, minLabel: v } })} />
      <TextField label="High-end label" value={typeData.maxLabel} onChange={(v) => onPatch({ typeData: { ...typeData, maxLabel: v } })} />
    </>
  );
}
// Label + unit pairs — the building blocks of a `custom` question.
function FieldListEditor({ fields, onChange }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const update = (i, patch) => onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const remove = (i) => onChange(fields.filter((_, idx) => idx !== i));
  const add = () => onChange([...fields, { id: `field-${Date.now()}`, label: `Field ${fields.length + 1}`, unit: "" }]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {fields.map((f, i) => (
        <div key={f.id} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input className="field-soft" value={f.label} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} style={{ ...softField, flex: 2 }} />
          <input className="field-soft" value={f.unit} placeholder="Unit" onChange={(e) => update(i, { unit: e.target.value })} style={{ ...softField, flex: 1 }} />
          <button onClick={() => remove(i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray300, display: "flex", flexShrink: 0, opacity: hoveredIdx === i ? 1 : 0, transition: "opacity 120ms ease", width: 22, justifyContent: "center" }}><Trash2 size={13} /></button>
        </div>
      ))}
      <AddLink label="Add field" onClick={add} />
    </div>
  );
}
// The general-purpose escape hatch — a handful of labeled numeric fields
// with an optional computed result. Retires the old dedicated `alcohol`
// (mechanically just a Multiple Choice) and `bmi` (needed a real composite
// UI, now the flagship example of this type instead of its own catalog
// entry) — see this file's own header note and questionTypes.js's.
function CustomFields({ typeData, onPatch }) {
  const setFields = (fields) => onPatch({ typeData: { ...typeData, fields } });
  return (
    <>
      {typeData.fields.length === 0 && (
        <button
          onClick={() => onPatch({ typeData: { ...BMI_TEMPLATE } })}
          style={{ display: "flex", alignItems: "center", gap: 6, border: `1px dashed ${T.accent}55`, background: `${T.accent}0d`, borderRadius: radius.md, padding: "9px 12px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: T.accent, fontFamily: font }}
        >
          <Sparkles size={13} />
          Use the Body Mass Index template
        </button>
      )}
      <FieldListEditor fields={typeData.fields} onChange={setFields} />
      {typeData.fields.length > 0 && (
        <>
          <SegmentedField label="Computed result" value={typeData.compute} onChange={(v) => onPatch({ typeData: { ...typeData, compute: v } })} options={CUSTOM_COMPUTE_MODES} />
          {typeData.compute !== "none" && (
            <TextField label="Result label" value={typeData.resultLabel} onChange={(v) => onPatch({ typeData: { ...typeData, resultLabel: v } })} placeholder="e.g. Your BMI is" />
          )}
        </>
      )}
    </>
  );
}
function FreetextFields({ typeData, onPatch }) {
  return (
    <>
      <TextField label="Placeholder" value={typeData.placeholder} onChange={(v) => onPatch({ typeData: { ...typeData, placeholder: v } })} />
      <Toggle label="Multi-line" checked={typeData.multiline} onChange={(v) => onPatch({ typeData: { ...typeData, multiline: v } })} />
    </>
  );
}

export const TYPE_FIELD_FORMS = {
  input: InputFields,
  likert: LikertFields,
  "multiple-choice": MultipleChoiceFields,
  "toggle-board": ToggleBoardFields,
  "smiley-5": null,
  "scale-0-10": ScaleFields,
  "scale-1-10": ScaleFields,
  freetext: FreetextFields,
  custom: CustomFields,
};

// The full question-editing UI — one implementation reused verbatim by
// V1's side-panel Inspector and V2's inline expanded row. Structure:
// Prompt reads as the hero (large, first, no label) with type-specific
// options directly below it in a soft card, Required as an inline toggle,
// Visibility always visible (it's the one thing worth a second look every
// time) — Help text and the dataset topic tag are real but secondary, so
// they live behind a "More options" disclosure instead of padding out the
// common case with two extra fields nobody sets most of the time.
export function QuestionEditorBody({ data, onPatch }) {
  const [moreOpen, setMoreOpen] = useState(!!(data.helpText || data.dimension));
  const typeMeta = questionTypeById(data.questionType);
  const TypeForm = TYPE_FIELD_FORMS[data.questionType];
  const drivers = data.dimension ? DIMENSION_DRIVERS[data.dimension] ?? [] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>
      <input
        className="field-soft"
        value={data.prompt ?? ""}
        placeholder="Type your question..."
        onChange={(e) => onPatch({ prompt: e.target.value })}
        style={{ ...softField, fontSize: 15.5, fontWeight: 600, padding: "11px 13px", color: T.gray900 }}
      />

      {TypeForm && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, background: T.gray25, borderRadius: radius.lg, padding: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.gray400 }}>{typeMeta?.label} options</span>
          <TypeForm typeData={data.typeData} onPatch={onPatch} />
        </div>
      )}

      <Toggle label="Required" checked={data.required} onChange={(v) => onPatch({ required: v })} />

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.gray400, marginBottom: 8 }}>
          <Eye size={12} />
          Visible to
        </div>
        <PersonaVisibilityField value={data.visibleToPersonas} onChange={(v) => onPatch({ visibleToPersonas: v })} />
      </div>

      <div>
        <button
          onClick={() => setMoreOpen((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "transparent", cursor: "pointer", padding: 0, fontSize: 12, fontWeight: 600, color: T.gray400, fontFamily: font }}
        >
          <motion.span animate={{ rotate: moreOpen ? 180 : 0 }} transition={SPRING} style={{ display: "flex" }}><ChevronDown size={13} /></motion.span>
          More options
        </button>
        <AnimatePresence initial={false}>
          {moreOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 12 }}>
                <TextField label="Help text" value={data.helpText} onChange={(v) => onPatch({ helpText: v || null })} placeholder="Shown next to an (i) icon" />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.gray500, marginBottom: 6 }}>
                    <Tag size={12} />
                    Dataset topic tag (optional)
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <SelectField value={data.dimension ?? ""} onChange={(v) => onPatch({ dimension: v || null, driver: null })} options={[{ value: "", label: "No dimension" }, ...DIMENSIONS.map((d) => ({ value: d, label: d }))]} />
                    </div>
                    {data.dimension && (
                      <div style={{ flex: 1 }}>
                        <SelectField value={data.driver ?? ""} onChange={(v) => onPatch({ driver: v || null })} options={[{ value: "", label: "No driver" }, ...drivers.map((d) => ({ value: d, label: d }))]} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
