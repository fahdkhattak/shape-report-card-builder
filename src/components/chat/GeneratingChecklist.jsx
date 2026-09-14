import { useState, useEffect } from "react";
import { Check, RefreshCw } from "lucide-react";
import { T } from "../../lib/tokens.js";

/* ================================================================== */
/* GENERATING CHECKLIST — the report-generation loading state, ported  */
/* from the real reference (984qJvMt7fCHASYHRwgrab, node 12618:40160). */
/* Copy is verbatim from that node. The real design pairs this with a  */
/* skeleton-loading canvas grid, shown simultaneously in a side panel — */
/* our guided flow is currently a separate full-screen route with no   */
/* canvas visible alongside it, so only the checklist is ported here.  */
/* See CLAUDE.md for the open question this reveals about chat/canvas  */
/* being one shell vs. separate routes.                                */
/* ================================================================== */
const STEPS = [
  "Creating Your Report",
  "Understanding your request",
  "Selecting insight logic",
  "Checking existing Widgets Library",
  "Choosing widgets...",
];
const STEP_DELAY_MS = 300;

// `done` lets a caller render this already-finished, with no animation and
// no `onComplete` call — needed because the chat message hosting this
// component can remount (e.g. CanvasScreen unmounts/remounts ChatPanel when
// the user toggles it closed and back open) well after generation actually
// finished; without this, every remount would restart the whole animation
// from zero and re-fire `onComplete`, even though nothing is actually
// regenerating. A real bug found and fixed while testing the redesign that
// merged this into CanvasScreen — see CLAUDE.md.
export default function GeneratingChecklist({ onComplete, done = false }) {
  const [doneCount, setDoneCount] = useState(done ? STEPS.length : 0);

  useEffect(() => {
    if (done) return;
    if (doneCount >= STEPS.length) {
      const t = setTimeout(onComplete, STEP_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDoneCount((c) => c + 1), STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [doneCount, onComplete, done]);

  const remaining = done ? 0 : Math.max(0, Math.ceil(((STEPS.length - doneCount) * STEP_DELAY_MS) / 1000));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
      {STEPS.map((label, i) => {
        const isDone = i < doneCount;
        const isActive = i === doneCount;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, opacity: isDone || isActive ? 1 : 0.4 }}>
            {isDone ? (
              <Check size={16} color={T.greenStrong} />
            ) : isActive ? (
              <RefreshCw size={16} color={T.accent} className="spin" />
            ) : (
              <RefreshCw size={16} color={T.gray300} />
            )}
            <span style={{ fontSize: 12, color: T.gray700 }}>{label}</span>
          </div>
        );
      })}
      {remaining > 0 && (
        <p style={{ fontSize: 12, fontWeight: 500, color: T.gray900, margin: "4px 0 0" }}>Estimated time {remaining} second{remaining === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}
