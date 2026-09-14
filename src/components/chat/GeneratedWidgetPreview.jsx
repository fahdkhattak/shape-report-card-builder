import { useState } from "react";
import { motion } from "motion/react";
import { RefreshCw, Edit3, Wand2, Check } from "lucide-react";
import { T, font } from "../../lib/tokens.js";
import { Header } from "../widgets/primitives.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import Button from "../ui/Button.jsx";
import MenuRow from "../canvas/MenuRow.jsx";

/* ================================================================== */
/* GENERATED WIDGET PREVIEW — the draft/approve card shown inline in   */
/* the chat thread. Used both for fresh generation (Add to canvas)     */
/* and for edit-in-place (Replace) — never mutates the canvas widget   */
/* until the user approves.                                            */
/*                                                                      */
/* Card layout (scaled-down native widget + size label beside it, real */
/* Buttons/Button for the action row) ported from the reference chat   */
/* panel (984qJvMt7fCHASYHRwgrab, node 12616:13589).                   */
/*                                                                      */
/* `onChangeType` (new) is the direct answer to "how do I even know    */
/* radar/gauge/etc exist, and how do I ask for a specific one" — a      */
/* Power-BI-style visualization picker right on the card, rather than   */
/* relying on the user guessing a magic keyword or re-rolling variants  */
/* and hoping. `onRegenerate` (existing) now re-rolls just THIS card's  */
/* chart type with fresh data, not three new unrelated variants.        */
/* ================================================================== */
const DISPLAY_BOX = 164;
const NATIVE = { "1x1": 164, "2x2": 344 };

export const VIZ_OPTIONS = [
  { id: "metric", label: "Number" },
  { id: "trend", label: "Trend Line" },
  { id: "gauge", label: "Gauge" },
  { id: "bar", label: "Bar Chart" },
  { id: "ranking", label: "Ranked List" },
  { id: "radar", label: "Radar Chart" },
  { id: "status", label: "Status Badge" },
  { id: "scatter", label: "Scatter Plot", needsTwoTopics: true },
  { id: "insight", label: "Did You Know", needsTwoTopics: true },
];

export default function GeneratedWidgetPreview({ spec, onTitleChange, onApprove, onRegenerate, onChangeType, onExpand, approveLabel, topicCount = 0 }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(spec.title);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  const commitTitle = () => {
    setEditingTitle(false);
    if (draftTitle.trim() && draftTitle !== spec.title) onTitleChange(draftTitle.trim());
  };

  const native = NATIVE[spec.size] || 164;
  const scale = DISPLAY_BOX / native;
  const availableTypes = VIZ_OPTIONS.filter((o) => !o.needsTwoTopics || topicCount >= 2);

  return (
    <div style={{ border: `1px solid ${T.gray75}`, borderRadius: 16, padding: 16, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <motion.div
          onClick={onExpand}
          title={onExpand ? "Open in Widget Builder" : undefined}
          whileHover={onExpand ? { scale: 1.03 } : undefined}
          whileTap={onExpand ? { scale: 0.97 } : undefined}
          transition={{ type: "spring", bounce: 0, duration: 0.2 }}
          style={{ width: DISPLAY_BOX, height: DISPLAY_BOX, flexShrink: 0, position: "relative", cursor: onExpand ? "pointer" : "default" }}
        >
          <div style={{ width: native, height: native, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: 18, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
            <Header title={spec.title} estimated={spec.real === false} />
            <GeneratedBody spec={spec} />
          </div>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4, minWidth: 0 }}>
          {editingTitle ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => e.key === "Enter" && commitTitle()}
              style={{ fontSize: 13, fontWeight: 700, color: T.gray900, border: `1px solid ${T.accent}`, borderRadius: 6, padding: "3px 6px", fontFamily: font, width: 140 }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis" }}>{spec.title}</span>
              <button onClick={() => { setDraftTitle(spec.title); setEditingTitle(true); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray300, display: "flex", padding: 0, flexShrink: 0 }}>
                <Edit3 size={12} />
              </button>
            </div>
          )}
          <span style={{ fontSize: 12, color: T.gray300 }}>{spec.size}</span>
        </div>
      </div>

      {spec.explanation && (
        <p style={{ fontSize: 11, color: T.gray500, fontStyle: "italic", lineHeight: 1.6, margin: "14px 0 0", flex: 1 }}>{spec.explanation}</p>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16, position: "relative" }}>
        <Button theme="brand" variation="secondary" size="xs" onClick={onApprove}>{approveLabel || "Add to canvas"}</Button>
        <Button theme="brand" variation="ghost" size="xs" onClick={onRegenerate} iconLeft={<RefreshCw size={14} />} title="Try again with this same chart type" />
        {onChangeType && (
          <Button theme="brand" variation="ghost" size="xs" onClick={() => setTypeMenuOpen((v) => !v)} iconLeft={<Wand2 size={14} />} title="Change chart type" />
        )}

        {typeMenuOpen && (
          <div onMouseLeave={() => setTypeMenuOpen(false)} style={{ position: "absolute", bottom: 34, left: 0, background: T.white, border: `1px solid ${T.gray75}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 6, zIndex: 20, width: 172, fontFamily: font }}>
            {availableTypes.map((o) => (
              <MenuRow
                key={o.id}
                label={o.label}
                icon={o.id === spec.vizType ? <Check size={13} color={T.accent} /> : <span style={{ width: 13, display: "inline-block" }} />}
                onClick={() => { onChangeType(o.id); setTypeMenuOpen(false); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
