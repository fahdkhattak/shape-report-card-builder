import { T } from "../../lib/tokens.js";
import SegmentedControl from "../ui/SegmentedControl.jsx";

/* Switches how the Widget Builder draws its Scope's Stories: the original cards
   ("Current") or the redesign ("Refined"). Lives in each builder version's header. */
export const STORY_STYLES = [{ id: "classic", label: "Current" }, { id: "refined", label: "Refined" }];

export function StoryStyleToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.gray300, textTransform: "uppercase", letterSpacing: 0.4 }}>Stories</span>
      <SegmentedControl options={STORY_STYLES} value={value} onChange={onChange} />
    </div>
  );
}
