import { T } from "../../lib/tokens.js";
import SegmentedControl from "../ui/SegmentedControl.jsx";

/* Switches how a Scope's Stories are drawn: the original cards ("Current") or the redesign ("Refined").
   Lives in each builder version's header and in the report's Scope pane header (one shared preference). */
export const STORY_STYLES = [{ id: "classic", label: "Current" }, { id: "refined", label: "Refined" }];

// `compact`: no "Stories" label (narrow headers, e.g. a 400px Scope pane).
export function StoryStyleToggle({ value, onChange, compact = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
      {!compact && <span style={{ fontSize: 10, fontWeight: 700, color: T.gray300, textTransform: "uppercase", letterSpacing: 0.4 }}>Stories</span>}
      <SegmentedControl options={STORY_STYLES} value={value} onChange={onChange} />
    </div>
  );
}
