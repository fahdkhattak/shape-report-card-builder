import { useState } from "react";
import { T, font, radius, band } from "../../lib/tokens.js";
import { ScoreRing } from "../scope/stories/SummaryStories.jsx";

/* ================================================================== */
/* EXPLORER RING CARD — one of the 12 Explorers on the Explorers report  */
/* layer (Figma 984qJvMt7fCHASYHRwgrab, node 14531:20690): a 1×1 card     */
/* with the Explorer's name and a band-coloured ring around its score.    */
/* Hover lifts it; selected (its Scope is open) darkens the border. These  */
/* are a view of the report, not user widgets — not draggable, renamable   */
/* or removable.                                                           */
/* ================================================================== */
export default function ExplorerRingCard({ name, value, selected, onClick }) {
  const [hover, setHover] = useState(false);
  const lifted = hover || selected;
  return (
    <button
      onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} aria-pressed={selected}
      style={{
        width: 164, height: 164, boxSizing: "border-box", padding: 12, background: T.white, borderRadius: radius.widget, cursor: "pointer", fontFamily: font,
        border: `1px solid ${selected ? T.gray500 : T.gray100}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        boxShadow: lifted ? "0 1px 2px rgba(0,0,0,0.14), 0 3px 3px rgba(0,0,0,0.07), 0 6px 4px rgba(0,0,0,0.05)" : "none", transition: "box-shadow 120ms ease",
      }}
    >
      <span style={{ alignSelf: "stretch", textAlign: "left", fontSize: 11, fontWeight: 500, letterSpacing: "0.11px", textTransform: "uppercase", color: selected ? T.gray900 : T.gray200, lineHeight: "13px", minHeight: 26 }}>{name}</span>
      <ScoreRing value={value} size={72} stroke={8} />
    </button>
  );
}
