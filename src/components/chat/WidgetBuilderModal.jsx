import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Pencil, Eye, RefreshCw, Trash2, Plus, Check } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { Header } from "../widgets/primitives.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import Button from "../ui/Button.jsx";
import { VIZ_OPTIONS } from "./GeneratedWidgetPreview.jsx";
import { SHELL_PADDING } from "../../lib/widgetStructure.js";

/* ================================================================== */
/* WIDGET BUILDER MODAL — the chat-exclusive "focus on one widget"       */
/* view. Ported in spirit (not literal copy — Figma showed a read-only   */
/* drill-down, this project's own ask layers real editing on top of it)  */
/* from the chat-redesign reference's hidden detail panel                */
/* (Z6YmEggwvoiX3j4d3kCKqV, node 2033:14849, "Frame 1597885236" — a       */
/* full-bleed white header bar + stacked bordered "window" cards on a     */
/* gray body). That frame is a rich read-only reading view for ONE metric */
/* (headline + evidence bar, a driver-by-driver breakdown list, a "what   */
/* your score is telling you" block) — it has no editable fields, no      */
/* carousel, and no chart-type picker anywhere in it. Per explicit        */
/* direction, this component keeps that "bordered window" visual          */
/* language but adds: a carousel (prev/next + "n / total") for paging     */
/* through a message's several generated variants one at a time, and an   */
/* Edit/Preview toggle that turns the same window cards into a real        */
/* editing surface — headline, chart type (reusing the existing            */
/* VIZ_OPTIONS picker), the "metric" payload (vizType-specific fields via  */
/* `PayloadEditor`), and the insight/explanation statement, each with a    */
/* "Regenerate with AI" escape hatch back to the engine's own output.      */
/*                                                                        */
/* Never mutates the canvas — `onApprove` (Add to Report / Replace) is     */
/* the only action that commits anything, same draft/approve discipline    */
/* as `GeneratedWidgetPreview`. Opened from clicking a widget's preview     */
/* box inside `GeneratedWidgetPreview` (ChatLanding.jsx/ChatPanel.jsx) —   */
/* per explicit direction this modal exclusively lives in chat; there is   */
/* no canvas/DetailModal entry point into it.                              */
/* ================================================================== */
const NATIVE = { "1x1": 164, "2x2": 344 };
const PREVIEW_BOX = 260;

// Critically damped (bounce: 0) springs throughout — per Apple's own
// interaction-design guidance (see CLAUDE.md), start non-gesture-driven UI
// at damping 1.0/no overshoot; nothing here is dragged or flicked, so there's
// no momentum to preserve with a bouncier spring. `MotionConfig` at the App
// root already makes every one of these defer to prefers-reduced-motion.
const SPRING = { type: "spring", bounce: 0, duration: 0.32 };
const POP_SPRING = { type: "spring", bounce: 0, duration: 0.22 };

// `layout` makes this card smoothly resize/reposition (a spring, not a
// jump) whenever a sibling Window mounts/unmounts around it — e.g. the
// Insight card sliding up when Edit mode's Chart type/Metric cards below it
// disappear. `initial`/`animate`/`exit` cover the card's OWN mount/unmount.
function Window({ label, children, right }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={SPRING}
      style={{ border: `1px solid ${T.gray100}`, borderRadius: radius.widget, padding: 20, background: T.white, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", overflow: "hidden" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.gray900 }}>{label}</span>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

const fieldStyle = { border: `1px solid ${T.gray100}`, borderRadius: 8, padding: "6px 10px", fontFamily: font, fontSize: 14, color: T.gray900, boxSizing: "border-box" };
const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: T.gray500, flex: 1 };

function NumberField({ label, value, onChange }) {
  return (
    <label style={labelStyle}>
      {label}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} style={fieldStyle} />
    </label>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label style={labelStyle}>
      {label}
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={fieldStyle} />
    </label>
  );
}

// Shared editor for [label, value, ...] row lists (bar/ranking payloads).
function RowListEditor({ rows, onChange }) {
  const update = (i, field, val) => onChange(rows.map((r, idx) => (idx === i ? (field === 0 ? [val, r[1], r[2]] : [r[0], val, r[2]]) : r)));
  const add = () => onChange([...rows, ["New item", 50]]);
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={r[0]} onChange={(e) => update(i, 0, e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
          <input type="number" value={r[1]} onChange={(e) => update(i, 1, Number(e.target.value))} style={{ ...fieldStyle, width: 72, flexShrink: 0 }} />
          <button onClick={() => remove(i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray300, display: "flex", flexShrink: 0 }}><Trash2 size={14} /></button>
        </div>
      ))}
      <Button theme="brand" variation="ghost" size="xs" iconLeft={<Plus size={14} />} onClick={add}>Add row</Button>
    </div>
  );
}

// Switches on vizType — covers every shape `generativeEngine.js`'s
// `buildSpec()` produces (see its own payload comments per case).
function PayloadEditor({ spec, onPatch }) {
  const p = spec.payload;
  const set = (payload) => onPatch({ payload });
  switch (spec.vizType) {
    case "metric":
      return (
        <div style={{ display: "flex", gap: 12 }}>
          <NumberField label="Value" value={p.value} onChange={(value) => set({ value })} />
          <NumberField label="Delta since last round" value={p.delta} onChange={(delta) => set({ delta })} />
        </div>
      );
    case "gauge":
      return <NumberField label="Value" value={p.value} onChange={(value) => set({ value })} />;
    case "trend":
      return (
        <TextField
          label="Points (comma separated)"
          value={p.points.join(", ")}
          onChange={(v) => set({ points: v.split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n)) })}
        />
      );
    case "status":
      return (
        <label style={labelStyle}>
          Status
          <select value={p.status} onChange={(e) => set({ status: e.target.value })} style={fieldStyle}>
            {["Flourishing", "Striving", "Struggling"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      );
    case "bar":
    case "ranking":
      return <RowListEditor rows={p.rows} onChange={(rows) => set({ rows })} />;
    case "radar":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {p.items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={it.label}
                onChange={(e) => set({ items: p.items.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)) })}
                style={{ ...fieldStyle, flex: 1 }}
              />
              <input
                type="number"
                value={it.value}
                onChange={(e) => set({ items: p.items.map((x, idx) => (idx === i ? { ...x, value: Number(e.target.value) } : x)) })}
                style={{ ...fieldStyle, width: 72, flexShrink: 0 }}
              />
            </div>
          ))}
        </div>
      );
    case "scatter":
      return (
        <div style={{ display: "flex", gap: 12 }}>
          <TextField label="Topic A" value={p.topicA} onChange={(topicA) => set({ topicA })} />
          <TextField label="Topic B" value={p.topicB} onChange={(topicB) => set({ topicB })} />
          <NumberField label="Correlation (-1 to 1)" value={p.r} onChange={(r) => set({ r })} />
        </div>
      );
    case "insight":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={labelStyle}>
            Statement
            <textarea value={p.text} onChange={(e) => set({ text: e.target.value })} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
          </label>
          <NumberField label="Stat (%)" value={p.stat} onChange={(stat) => set({ stat })} />
        </div>
      );
    default:
      return null;
  }
}

function TitleField({ spec, editable, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(spec.title);
  if (!editable) return <span style={{ fontSize: 16, fontWeight: 700, color: T.gray900 }}>{spec.title}</span>;
  return editing ? (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); if (draft.trim() && draft !== spec.title) onChange(draft.trim()); }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      style={{ fontSize: 16, fontWeight: 700, color: T.gray900, border: `1px solid ${T.accent}`, borderRadius: 6, padding: "3px 8px", fontFamily: font }}
    />
  ) : (
    <button onClick={() => { setDraft(spec.title); setEditing(true); }} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.gray900 }}>{spec.title}</span>
      <Pencil size={12} color={T.gray300} />
    </button>
  );
}

export default function WidgetBuilderModal({ variants, index, onIndexChange, onClose, approveLabel, onApprove, onRegenerate, onChangeType, onUpdateSpec, topicCount = 0 }) {
  const [mode, setMode] = useState("preview"); // "preview" | "edit"
  // Tracks which way the carousel just moved so the slide direction always
  // matches the arrow pressed (Apple's "hint in the direction of the
  // gesture" + "spatial consistency" — content should leave the side it
  // came from, not the opposite one).
  const [direction, setDirection] = useState(0);
  const spec = variants[index];
  const hasMultiple = variants.length > 1;
  const availableTypes = VIZ_OPTIONS.filter((o) => !o.needsTwoTopics || topicCount >= 2);
  const native = NATIVE[spec.size] || 164;
  const scale = PREVIEW_BOX / native;
  const patch = (p) => onUpdateSpec(index, p);
  const goTo = (newIndex) => { setDirection(newIndex > index ? 1 : -1); onIndexChange(newIndex); };

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={POP_SPRING}
      style={{ position: "fixed", inset: 0, background: "rgba(35,31,32,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={SPRING}
        style={{ width: 860, maxWidth: "100%", maxHeight: "88vh", background: T.gray50, borderRadius: radius.modal, fontFamily: font, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ background: T.white, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.gray75}`, flexShrink: 0 }}>
          <TitleField spec={spec} editable={mode === "edit"} onChange={(title) => patch({ title })} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {spec.real === false && <span title="Estimated — no close survey data for this topic yet" style={{ width: 6, height: 6, borderRadius: "50%", background: T.amber, display: "inline-block", flexShrink: 0 }} />}
            <Button theme="brand" variation={mode === "edit" ? "secondary" : "ghost"} size="xs" iconLeft={mode === "edit" ? <Eye size={16} /> : <Pencil size={16} />} onClick={() => setMode((m) => (m === "edit" ? "preview" : "edit"))}>
              {mode === "edit" ? "Preview" : "Edit"}
            </Button>
            <Button theme="brand" variation="ghost" size="xs" iconLeft={<X size={18} />} onClick={onClose} />
          </div>
        </div>

        <div style={{ padding: 32, overflowY: "auto", overflowX: "hidden", flex: 1 }}>
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              initial={{ opacity: 0, x: direction >= 0 ? 32 : -32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -32 : 32 }}
              transition={SPRING}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ width: PREVIEW_BOX, height: PREVIEW_BOX, position: "relative", flexShrink: 0 }}>
                  <div style={{ width: native, height: native, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", background: T.white, border: `1px solid ${T.gray100}`, borderRadius: 18, padding: SHELL_PADDING, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
                    <Header title={spec.title} estimated={spec.real === false} />
                    <GeneratedBody spec={spec} />
                  </div>
                </div>
              </div>

              <Window
                label="Insight"
                right={mode === "edit" && (
                  <Button theme="brand" variation="ghost" size="xs" iconLeft={<RefreshCw size={14} />} onClick={() => onRegenerate(index)}>Regenerate with AI</Button>
                )}
              >
                {mode === "edit" ? (
                  <textarea value={spec.explanation} onChange={(e) => patch({ explanation: e.target.value })} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
                ) : (
                  <p style={{ margin: 0, fontSize: 14, color: T.gray700, lineHeight: 1.6 }}>{spec.explanation}</p>
                )}
              </Window>

              <AnimatePresence initial={false}>
                {mode === "edit" && (
                  <Window key="chart-type" label="Chart type">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {availableTypes.map((o) => (
                        <Button key={o.id} theme="brand" variation={o.id === spec.vizType ? "secondary" : "ghost"} size="xs" iconLeft={o.id === spec.vizType ? <Check size={13} /> : undefined} onClick={() => onChangeType(index, o.id)}>
                          {o.label}
                        </Button>
                      ))}
                    </div>
                  </Window>
                )}
                {mode === "edit" && (
                  <Window key="metric" label="Metric">
                    <PayloadEditor spec={spec} onPatch={patch} />
                  </Window>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.gray75}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: T.white }}>
          {hasMultiple ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button theme="brand" variation="ghost" size="xs" iconLeft={<ChevronLeft size={18} />} disabled={index === 0} onClick={() => goTo(index - 1)} />
              <span style={{ fontSize: 12, color: T.gray500 }}>{index + 1} / {variants.length}</span>
              <Button theme="brand" variation="ghost" size="xs" iconLeft={<ChevronRight size={18} />} disabled={index === variants.length - 1} onClick={() => goTo(index + 1)} />
            </div>
          ) : <div />}
          <div style={{ display: "flex", gap: 8 }}>
            <Button theme="brand" variation="ghost" size="xs" iconLeft={<RefreshCw size={14} />} onClick={() => onRegenerate(index)}>Regenerate</Button>
            <Button theme="accent" size="xs" onClick={() => onApprove(spec)}>{approveLabel}</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
