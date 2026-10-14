import { useId } from "react";
import { motion } from "motion/react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace, dsShadow } from "../../lib/ds.js";

const SPRING = { type: "spring", bounce: 0, duration: 0.35 };

/* ================================================================== */
/* SEGMENTED CONTROL — a real sliding-pill toggle (macOS/iOS's own        */
/* UISegmentedControl pattern: one highlighted "thumb" that glides         */
/* between options via a shared `layoutId`, not a swapped background       */
/* color) rather than a `<select>` dropdown — reserved for a small, fixed   */
/* set of mutually-exclusive views someone switches between often.          */
/*                                                                          */
/* `layoutId` is namespaced with `useId()` per instance — a real bug found   */
/* wiring this into QuestionFields.jsx's `SegmentedField`: with a hardcoded   */
/* literal id, Motion treats every SegmentedControl on the page as ONE         */
/* shared element, so the thumb visibly slid between two unrelated controls     */
/* (a question's Height-unit and Weight-unit toggles) shown at the same time.    */
/* ================================================================== */
export default function SegmentedControl({ options, value, onChange }) {
  const instanceId = useId();
  return (
    <div style={{ display: "inline-flex", position: "relative", background: ds.interactive.ghostHover, borderRadius: dsRadius.full, padding: dsSpace[4], gap: dsSpace[2], fontFamily: font }}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              position: "relative", border: "none", background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: dsSpace[6], padding: `${dsSpace[6]}px ${dsSpace[12]}px`, borderRadius: dsRadius.full,
              ...dsText("Text xs", 600), color: active ? ds.text.primary : ds.text.tertiary, fontFamily: font,
              zIndex: 1, whiteSpace: "nowrap",
            }}
          >
            {active && (
              <motion.div
                layoutId={`segmented-thumb-${instanceId}`}
                transition={SPRING}
                style={{ position: "absolute", inset: 0, background: ds.surface.general.card, borderRadius: dsRadius.full, boxShadow: dsShadow("xs"), zIndex: -1 }}
              />
            )}
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
