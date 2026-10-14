import { LayoutGrid, GitBranch, FileStack, PanelsLeftRight, Sparkles } from "lucide-react";
import { T } from "../../lib/tokens.js";
import SegmentedControl from "../ui/SegmentedControl.jsx";

/* ================================================================== */
/* VERSION SWITCHER — shared by all five Survey Builder prototypes.     */
/* Previously lived in `SurveyBuilderScreen.jsx` as its own separate       */
/* frosted header strip sitting above whichever version was mounted; per    */
/* explicit direction ("put the dropdown for prototypes next to preview     */
/* button instead of creating separate header") that strip is retired —     */
/* each version's own header row now renders this control directly, right   */
/* before its own Preview button. Extracted to its own file (rather than     */
/* living in `SurveyBuilderScreen.jsx`) specifically so `SurveyBuilderV1/2/3` */
/* can import it without a circular import back into the screen that mounts  */
/* them.                                                                       */
/* ================================================================== */
export const VERSIONS = [
  { id: "v2", label: "Sections", icon: <LayoutGrid size={13} /> },
  { id: "v1", label: "Canvas", icon: <GitBranch size={13} /> },
  { id: "v3", label: "Pages", icon: <FileStack size={13} /> },
  { id: "v4", label: "Studio", icon: <PanelsLeftRight size={13} /> },
  { id: "v5", label: "Studio AI", icon: <Sparkles size={13} /> },
];

export default function VersionSwitcher({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.gray300, textTransform: "uppercase", letterSpacing: 0.4 }}>Prototype</span>
      <SegmentedControl options={VERSIONS} value={value} onChange={onChange} />
    </div>
  );
}
