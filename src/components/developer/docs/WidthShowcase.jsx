import { useState } from "react";
import { ds, dsText, dsSpace } from "../../../lib/ds.js";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import SegmentedControl from "../../ui/SegmentedControl.jsx";

/* Every form of a Story at one chosen card width (320 / 390 / 480 / 560 / 808), side by side, so a reviewer can see what each
   does on a phone, in a narrow Scope, and at the designed width. `forms`: [{ name, render: () => node }]. */
const WIDTHS = [320, 390, 480, 560, 808];
export default function WidthShowcase({ forms, style, initial = 390 }) {
  const [w, setW] = useState(initial);
  return (
    <div data-part="width-showcase" style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], flexWrap: "wrap" }}>
        <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>Card width</span>
        <SegmentedControl options={WIDTHS.map((x) => ({ id: String(x), label: `${x}px` }))} value={String(w)} onChange={(v) => setW(+v)} />
        <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{w < 400 ? "Phone" : w < 560 ? "Compact" : "Designed layout"}</span>
      </div>
      <div style={{ display: "flex", gap: dsSpace[24], flexWrap: "wrap", alignItems: "flex-start" }}>
        {forms.map((f) => (
          <div key={f.name} data-showcase-form={f.name} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], width: w, maxWidth: "100%" }}>
            <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{f.name}</span>
            <StoryStyleContext.Provider value={style}>{f.render()}</StoryStyleContext.Provider>
          </div>
        ))}
      </div>
    </div>
  );
}
