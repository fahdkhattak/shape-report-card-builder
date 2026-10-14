import { Layers, PanelRight } from "lucide-react";
import { T } from "../../lib/tokens.js";
import SegmentedControl from "../ui/SegmentedControl.jsx";

/* The Widget Builder's prototype switcher — same idea as the Survey Builder's
   (components/survey/VersionSwitcher.jsx): sits in each version's own header,
   next to its actions. */
export const WIDGET_BUILDER_VERSIONS = [
  { id: "v1", label: "Original", icon: <PanelRight size={13} /> },
  { id: "v2", label: "Workbench", icon: <Layers size={13} /> },
];

export function WidgetBuilderVersions({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.gray300, textTransform: "uppercase", letterSpacing: 0.4 }}>Prototype</span>
      <SegmentedControl options={WIDGET_BUILDER_VERSIONS} value={value} onChange={onChange} />
    </div>
  );
}
