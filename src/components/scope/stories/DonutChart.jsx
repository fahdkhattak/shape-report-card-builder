import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsSpace } from "../../../lib/ds.js";
import { AxisIcon } from "./diagnosticParts.jsx";

/* ================================================================== */
/* COMPOSITION RING — one way of grouping people as a ring (Figma         */
/* 13622:39607 / 13622:39699, the Composition Story's Chart View).        */
/* Read off the frames: a 176px box, the ring drawn in its centre 160px   */
/* (outer radius 80, inner 56, so 24px thick), segments touching with no  */
/* gaps, starting at 12 o'clock and running clockwise, each sized by its   */
/* share of people. Inside: the axis icon (24px) over its name (Text sm /  */
/* Medium, text/secondary), 8px apart. Colours are the design system's     */
/* graph palette in the frames' own order. Work Composition is drawn in    */
/* the blues and mint the frame uses for it.                              */
/* Hover or tap a segment to select it; the Story says what it is in its   */
/* footer line, so the ring itself never changes size or moves.            */
/* ================================================================== */
const ORDER = ["lavenderViolet", "amberOrange", "mintGreen", "goldenYellow", "coralRed", "teal", "purple", "turquoise", "hotPink", "orangeCoral", "limeGreen", "magenta", "oliveGreen", "cyanGlow", "neonLime"];
// Composition widgets (the design's Gender / Work / Time / Money Composition cards) keep their own colours per group.
const BY_AXIS = { gender: ["personalBlue", "hotPink", "goldenYellow", "slateGray"], workModel: ["personalBlue", "orgBlue", "mintGreen"], impactTime: ["personalBlue", "teamBlue"], impactMoney: ["personalBlue", "teamBlue", "teal", "lavenderViolet"] };
export const segmentColor = (axisKey, i) => { const keys = BY_AXIS[axisKey] || ORDER; return ds.graph[keys[i % keys.length]]; };

const BOX = 176, C = BOX / 2, RO = 80, RI = 56;
const polar = (r, a) => [C + r * Math.sin(a), C - r * Math.cos(a)]; // 0 = 12 o'clock, clockwise
function arc(a0, a1, ro, ri) {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 = a0 + Math.PI * 2 - 1e-4; // a full ring still needs two distinct ends
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(ro, a0), [x1, y1] = polar(ro, a1), [x2, y2] = polar(ri, a1), [x3, y3] = polar(ri, a0);
  return `M${x0},${y0} A${ro},${ro} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${ri},${ri} 0 ${large} 0 ${x3},${y3} Z`;
}

/* rows: groupRows() output. `selected`: index of the chosen segment or null. `size` scales the whole ring. `bare` draws
   the ring without the icon and name in the middle (a 1x1 widget is too small for them). */
export default function DonutChart({ axisKey, label, rows, selected, onSelect, size = BOX, bare = false }) {
  const total = rows.reduce((a, r) => a + r.n, 0) || 1;
  let a = 0;
  const slices = rows.map((r, i) => {
    const span = (r.n / total) * Math.PI * 2;
    const s = { ...r, i, color: segmentColor(axisKey, i), a0: a, a1: a + span };
    a += span;
    return s;
  });
  const k = size / BOX;
  return (
    <div data-part="ring" style={{ position: "relative", width: size, height: size, flexShrink: 0, fontFamily: font }}>
      <svg
        viewBox={`0 0 ${BOX} ${BOX}`} width={size} height={size} role="img"
        aria-label={`${label}: ${rows.map((r) => `${r.group} ${r.pct}%`).join(", ")}`}
        style={{ display: "block", overflow: "visible", touchAction: "pan-y" }}
        onPointerLeave={(e) => e.pointerType === "mouse" && onSelect?.(null)}
      >
        {slices.map((s) => {
          const on = selected === s.i;
          return (
            <path
              key={`${s.i}-${s.group}`} data-part="segment" d={arc(s.a0, s.a1, on ? RO + 4 : RO, RI)}
              opacity={selected == null || on ? 1 : 0.35}
              onPointerEnter={(e) => e.pointerType === "mouse" && onSelect?.(s.i)}
              onPointerDown={() => onSelect?.(on ? null : s.i)}
              style={{ fill: s.color, cursor: "pointer", transition: "opacity 120ms ease" }}
            >
              <title>{`${s.group}: ${s.n} people (${s.pct}%)`}</title>
            </path>
          );
        })}
      </svg>
      {!bare && <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: dsSpace[8] * k, pointerEvents: "none" }}>
        <AxisIcon axis={axisKey} size={24 * k} />
        <span data-part="ring-label" style={{ ...dsText("Text sm", 500), fontSize: 14 * k, lineHeight: `${20 * k}px`, color: ds.text.secondary, textAlign: "center", maxWidth: (RI * 2 - 12) * k, textWrap: "balance" }}>{label}</span>
      </div>}
    </div>
  );
}
