import { useState } from "react";
import { T, font, band } from "../../../lib/tokens.js";
import { SUPPRESS_BELOW } from "../../../lib/scopeData.js";

/* ================================================================== */
/* DONUT CHART — "who is represented" as a circular breakdown            */
/* (Composition Story, Chart View). One ring per way of grouping people;   */
/* each group is a slice sized by its share of the population. Hover a      */
/* slice — or its row in the legend, they are linked — and the centre        */
/* explains it: the group, how many people, its share, its score and how      */
/* that compares with the average. A group under SUPPRESS_BELOW people is      */
/* still drawn (it is part of who is represented) but its score is never       */
/* shown.                                                                      */
/* ================================================================== */
const PALETTE = [T.teamBlue, T.orgBlue, T.mintGreen, T.goldenYellow, T.lavender, T.turquoise, T.hotPink, T.amberOrange, T.gray400, T.gray300, T.gray200, T.gray500, T.gray100];
const SIZE = 220, C = SIZE / 2, RO = 92, RI = 60, GAP = 0.018; // radians between slices

const polar = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
function arc(a0, a1, ro, ri) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(ro, a0), [x1, y1] = polar(ro, a1), [x2, y2] = polar(ri, a1), [x3, y3] = polar(ri, a0);
  return `M${x0},${y0} A${ro},${ro} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${ri},${ri} 0 ${large} 0 ${x3},${y3} Z`;
}
const vsAvgText = (v) => (v == null ? null : v === 0 ? "Same as average" : `${Math.abs(v)}% ${v > 0 ? "above" : "below"} average`);

export default function DonutChart({ rows }) {
  const [hover, setHover] = useState(null);
  const total = rows.reduce((a, r) => a + r.n, 0) || 1;
  let a = -Math.PI / 2;
  const slices = rows.map((r, i) => {
    const span = (r.n / total) * Math.PI * 2;
    const s = { ...r, i, color: PALETTE[i % PALETTE.length], a0: a + GAP / 2, a1: Math.max(a + span - GAP / 2, a + GAP / 2 + 0.02) };
    a += span;
    return s;
  });
  const h = hover != null ? slices[hover] : null;

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", fontFamily: font }} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={200} height={200} style={{ flexShrink: 0, display: "block", margin: "0 auto" }}>
        {slices.map((s) => (
          <path
            key={s.group} d={arc(s.a0, s.a1, hover === s.i ? RO + 6 : RO, hover === s.i ? RI - 2 : RI)} fill={s.color} onMouseEnter={() => setHover(s.i)}
            opacity={hover == null || hover === s.i ? 1 : 0.35} style={{ transition: "opacity 120ms ease", cursor: "default" }}
          >
            <title>{`${s.group}: ${s.n} people (${s.pct}%)`}</title>
          </path>
        ))}
        <foreignObject x={C - 50} y={C - 36} width={100} height={72} style={{ pointerEvents: "none" }}>
          <div style={{ width: 100, height: 72, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: font, gap: 2 }}>
            {h ? (
              <>
                <span style={{ fontSize: 11, fontWeight: 700, lineHeight: "13px", color: T.gray900, maxWidth: 96, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{h.group}</span>
                <span style={{ fontSize: 11, color: T.gray500 }}>{h.n} · {h.pct}%</span>
                {h.hidden ? <span style={{ fontSize: 10, color: T.gray500 }}>score hidden</span> : <span style={{ fontSize: 18, fontWeight: 700, lineHeight: "20px", color: band(h.score).cs }}>{h.score}</span>}
              </>
            ) : (
              <>
                <span style={{ fontSize: 24, fontWeight: 700, lineHeight: "28px", color: T.gray900 }}>{total}</span>
                <span style={{ fontSize: 11, color: T.gray500 }}>people</span>
              </>
            )}
          </div>
        </foreignObject>
      </svg>

      <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {slices.map((s) => {
          const on = hover === s.i;
          return (
            <div
              key={s.group} onMouseEnter={() => setHover(s.i)}
              style={{ display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto 36px", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8, background: on ? T.gray50 : "transparent", opacity: hover == null || on ? 1 : 0.55, transition: "opacity 120ms ease, background 120ms ease" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 13, color: T.gray900, fontWeight: on ? 700 : 400, minWidth: 0 }}>{s.group}</span>
              <span style={{ fontSize: 12, color: T.gray500, whiteSpace: "nowrap" }}>{s.n} · {s.pct}%</span>
              <span style={{ textAlign: "right", fontSize: 15 }} title={s.hidden ? `Fewer than ${SUPPRESS_BELOW} people — score not shown` : undefined}>
                {s.hidden ? <span style={{ color: T.gray300 }}>—</span> : <b style={{ color: band(s.score).cs }}>{s.score}</b>}
              </span>
              {on && vsAvgText(s.vsAvg) && <span style={{ gridColumn: "2 / -1", fontSize: 12, color: T.gray500, marginTop: -4 }}>{vsAvgText(s.vsAvg)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
