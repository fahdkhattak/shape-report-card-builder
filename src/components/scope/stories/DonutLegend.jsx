import { useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsSpace, dsRadius } from "../../../lib/ds.js";
import { SUPPRESS_BELOW } from "../../../lib/scopeData.js";
import { segmentColor } from "./DonutChart.jsx";

/* ================================================================== */
/* DONUT + LEGEND — the Composition Story's second form ("Donut"),       */
/* kept by request alongside the Figma rings (DonutChart.jsx). Not in    */
/* the design: it is the earlier build, brought onto design-system       */
/* tokens and text styles.                                               */
/* A donut (slices with small gaps) beside a legend of every group with   */
/* its size, share and score. The two are linked: point at (or tap) a     */
/* slice or a legend row and the slice pops out, the rest fade, the       */
/* centre swaps from the total to that group, and its row says how it     */
/* compares with the average. Colours are the same as the rings', so a    */
/* group keeps its colour when switching forms.                           */
/* A group under SUPPRESS_BELOW people is drawn but never shows a score.  */
/* ================================================================== */
const SIZE = 220, C = SIZE / 2, RO = 92, RI = 60, GAP = 0.018; // radians between slices

const polar = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
function arc(a0, a1, ro, ri) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(ro, a0), [x1, y1] = polar(ro, a1), [x2, y2] = polar(ri, a1), [x3, y3] = polar(ri, a0);
  return `M${x0},${y0} A${ro},${ro} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${ri},${ri} 0 ${large} 0 ${x3},${y3} Z`;
}
const vsAvgText = (v) => (v == null ? null : v === 0 ? "Same as average" : `${Math.abs(v)}% ${v > 0 ? "above" : "below"} average`);

export default function DonutLegend({ axisKey, label, rows }) {
  const [hover, setHover] = useState(null);
  const total = rows.reduce((a, r) => a + r.n, 0) || 1;
  const single = rows.length === 1;
  let a = -Math.PI / 2;
  const slices = rows.map((r, i) => {
    const span = (r.n / total) * Math.PI * 2;
    const g = single ? 0 : GAP;
    const s = { ...r, i, color: segmentColor(axisKey, i), a0: a + g / 2, a1: single ? a + Math.PI * 2 - 1e-4 : Math.max(a + span - g / 2, a + g / 2 + 0.02) };
    a += span;
    return s;
  });
  const h = hover != null ? slices[hover] : null;
  const pick = (i) => (e) => { if (e.pointerType === "mouse") setHover(i); };
  const tap = (i) => () => setHover((cur) => (cur === i ? null : i));

  return (
    <div data-part="donut-legend" style={{ display: "flex", gap: dsSpace[24], alignItems: "center", flexWrap: "wrap", fontFamily: font }} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={200} height={200} role="img" aria-label={`${label}: ${rows.map((r) => `${r.group} ${r.n} people`).join(", ")}`} style={{ flexShrink: 0, display: "block", margin: "0 auto", touchAction: "pan-y" }}>
        {slices.map((s) => (
          <path
            key={`${s.i}-${s.group}`} data-part="slice" d={arc(s.a0, s.a1, hover === s.i ? RO + 6 : RO, hover === s.i ? RI - 2 : RI)}
            onPointerEnter={pick(s.i)} onPointerDown={tap(s.i)}
            style={{ fill: s.color, opacity: hover == null || hover === s.i ? 1 : 0.35, transition: "opacity 120ms ease", cursor: "pointer" }}
          >
            <title>{`${s.group}: ${s.n} people (${s.pct}%)`}</title>
          </path>
        ))}
        <foreignObject x={C - 50} y={C - 36} width={100} height={72} style={{ pointerEvents: "none" }}>
          <div style={{ width: 100, height: 72, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: font, gap: dsSpace[2] }}>
            {h ? (
              <>
                <span style={{ ...dsText("Text 3xs", 700), lineHeight: "13px", color: ds.text.primary, maxWidth: 96, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{h.group}</span>
                <span style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>{h.n} · {h.pct}%</span>
                {h.hidden ? <span style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>score hidden</span> : <span style={{ fontSize: 18, fontWeight: 700, lineHeight: "20px", color: dsBand(h.score).cs }}>{h.score}</span>}
              </>
            ) : (
              <>
                <span style={{ ...dsText("Text xl", 700), color: ds.text.primary }}>{total}</span>
                <span style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>people</span>
              </>
            )}
          </div>
        </foreignObject>
      </svg>

      <div data-part="legend" style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[2] }}>
        {slices.map((s) => {
          const on = hover === s.i;
          return (
            <div
              key={`${s.i}-${s.group}`} data-part="legend-row" onPointerEnter={pick(s.i)} onPointerDown={tap(s.i)}
              style={{ display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto 36px", alignItems: "center", columnGap: 10, padding: `${dsSpace[6]}px ${dsSpace[8]}px`, borderRadius: dsRadius.md, cursor: "pointer", background: on ? ds.bg.primary : "transparent", opacity: hover == null || on ? 1 : 0.55, transition: "opacity 120ms ease, background 120ms ease" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
              <span style={{ ...dsText("Text xs", on ? 700 : 400), color: ds.text.primary, minWidth: 0 }}>{s.group}</span>
              <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, whiteSpace: "nowrap" }}>{s.n} · {s.pct}%</span>
              <span style={{ textAlign: "right", ...dsText("Text sm", 700) }} title={s.hidden ? `Fewer than ${SUPPRESS_BELOW} people, so the score isn't shown` : undefined}>
                {s.hidden ? <span style={{ color: ds.text.quaternary }}>-</span> : <span style={{ color: dsBand(s.score).cs }}>{s.score}</span>}
              </span>
              {on && vsAvgText(s.vsAvg) && <span style={{ gridColumn: "2 / -1", ...dsText("Text 2xs"), color: ds.text.tertiary, marginTop: -2 }}>{vsAvgText(s.vsAvg)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
