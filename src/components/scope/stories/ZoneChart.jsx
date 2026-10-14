import { useState } from "react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { sinceText } from "../../../lib/scopeData.js";
import { FLOURISHING_AT, STRIVING_AT, statusName } from "../../../lib/bands.js";
import { ds, dsBand, dsText, dsRadius, dsSpace } from "../../../lib/ds.js";
import { useStoryWidth } from "./storyWidth.js";
import { dotRadius, clampScore } from "./breakdownRules.js";

/* ================================================================== */
/* ZONE CHART — the Breakdown chart for a set of parts (Explorers,       */
/* Drivers). Every part is a dot placed on one 0–100 score line that is   */
/* split into the three status zones (Struggling / Striving / Flourishing) */
/* — so what you see is *where the parts sit against the thresholds*, how  */
/* they cluster and how many fall in each zone, not a ranked list of bars   */
/* (which just repeats the table). Dots that would overlap stack into      */
/* lanes. The lowest and highest parts are labelled; hover any dot for its  */
/* score, status, change and what it means, while the rest dim. In Compare   */
/* mode each dot is tied to a hollow marker showing where it was in the      */
/* earlier round.                                                            */
/* On a compact card (under 560px, see storyWidth.js) a scaled-down plot    */
/* would be unreadable, so the same three zones are drawn as three tinted  */
/* groups: the zone and its count, then a row per part, highest first.      */
/* ================================================================== */
const W = 776, PL = 16, PR = 16, R = 11, STEP = 2 * R + 3, HEAD = 56, AXIS = 34;
const ZONES = [
  { name: "Struggling", from: 0, to: STRIVING_AT, bg: T.redBg, c: T.redStrong },
  { name: "Striving", from: STRIVING_AT, to: FLOURISHING_AT, bg: T.amberBg, c: T.amberStrong },
  { name: "Flourishing", from: FLOURISHING_AT, to: 100, bg: T.greenBg, c: T.greenStrong },
];
const x = (v) => PL + (clampScore(v) / 100) * (W - PL - PR);
const statusOf = statusName;

/* Place dots by score; when one would overlap an already-placed dot, move it
   to the nearest free lane above/below the centre line. */
function layout(rows, R, STEP) {
  const placed = [];
  [...rows].sort((a, b) => a.value - b.value).forEach((r) => {
    const px = x(r.value);
    for (let k = 0; k < 40; k++) {
      const lane = k === 0 ? 0 : k % 2 ? (k + 1) / 2 : -k / 2;
      const py = lane * STEP;
      if (placed.every((p) => Math.hypot(p.px - px, p.py - py) >= 2 * R + 2)) { placed.push({ ...r, px, py, lane }); return; }
    }
    placed.push({ ...r, px, py: 0, lane: 0 });
  });
  return placed;
}

export default function ZoneChart({ rows, cmpOn, refName, noun = "Explorer" }) {
  const { compact } = useStoryWidth();
  const [hover, setHover] = useState(null);
  const R = dotRadius(rows.length), STEP = 2 * R + 3; // dots shrink as the count grows
  const dots = layout(rows, R, STEP);
  const maxLane = Math.max(1, ...dots.map((d) => Math.abs(d.py)));
  const plotH = Math.max(176, maxLane * 2 + 2 * R + 56);
  const H = HEAD + plotH + AXIS;
  const cy = HEAD + plotH / 2;
  const lo = dots[0], hi = dots[dots.length - 1];
  const h = hover != null ? dots[hover] : null;
  const hb = h ? band(h.value) : null;
  const counts = ZONES.map((z) => dots.filter((d) => d.value >= z.from && (z.to === 100 ? d.value <= 100 : d.value < z.to)).length);

  if (compact) return <ZoneGroups dots={dots} counts={counts} noun={noun} cmpOn={cmpOn} refName={refName} />;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: W, margin: "0 auto", aspectRatio: `${W} / ${H}`, fontFamily: font }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
        {ZONES.map((z, i) => (
          <g key={z.name}>
            <rect x={x(z.from)} y={HEAD - 8} width={x(z.to) - x(z.from)} height={plotH + 8} fill={z.bg} opacity={0.65} rx={i === 0 ? 10 : 0} />
            <text x={x(z.from) + 12} y={HEAD + 10} fontSize="12" fontWeight="700" fill={z.c}>{z.name}</text>
            <text x={x(z.from) + 12} y={HEAD + 26} fontSize="11" fill={T.gray500}>{counts[i]} {counts[i] === 1 ? noun : `${noun}s`}</text>
          </g>
        ))}
        {[STRIVING_AT, FLOURISHING_AT].map((t) => <line key={t} x1={x(t)} x2={x(t)} y1={HEAD - 8} y2={HEAD + plotH} stroke={T.gray100} strokeDasharray="4 4" />)}
        <line x1={PL} x2={W - PR} y1={cy + 6} y2={cy + 6} stroke={T.gray200} strokeWidth="1" />
        {[0, STRIVING_AT, FLOURISHING_AT, 100].map((t) => <text key={t} x={x(t)} y={HEAD + plotH + 20} textAnchor={t === 0 ? "start" : t === 100 ? "end" : "middle"} fontSize="11" fill={T.gray500}>{t}</text>)}

        {cmpOn && dots.map((d, i) => d.prev !== d.value && (
          <g key={`p-${i}`} opacity={hover == null || hover === i ? 1 : 0.2}>
            <line x1={x(d.prev)} x2={d.px} y1={cy + 6 + d.py} y2={cy + 6 + d.py} stroke={T.gray300} strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx={x(d.prev)} cy={cy + 6 + d.py} r={5} fill={T.white} stroke={T.gray400} strokeWidth="1.5" />
          </g>
        ))}

        {dots.map((d, i) => {
          const b = band(d.value);
          const active = hover === i;
          const labelled = d === lo || d === hi;
          return (
            <g key={`${i}-${d.label}`} onMouseEnter={() => setHover(i)} style={{ cursor: "default", transition: "opacity 120ms ease" }} opacity={hover == null || active ? 1 : 0.3}>
              <circle cx={d.px} cy={cy + 6 + d.py} r={active ? R + 3 : R} fill={b.c} stroke={T.white} strokeWidth="2" style={{ transition: "r 120ms ease" }} />
              {active && <circle cx={d.px} cy={cy + 6 + d.py} r={R + 7} fill="none" stroke={b.c} strokeWidth="1.5" opacity="0.4" />}
              {labelled && !active && (
                <text x={d.px} y={cy + 6 + d.py - R - 7} textAnchor={d.px < 120 ? "start" : d.px > W - 120 ? "end" : "middle"} fontSize="11" fontWeight="600" fill={T.gray700} style={{ pointerEvents: "none" }}>{d.label}</text>
              )}
            </g>
          );
        })}
      </svg>

      {h && (
        <div
          style={{
            position: "absolute", left: `${(h.px / W) * 100}%`, top: `${((cy + 6 + h.py) / H) * 100}%`, width: 230, boxSizing: "border-box", pointerEvents: "none", zIndex: 3,
            transform: `translate(${h.px < 150 ? "-12%" : h.px > W - 150 ? "-88%" : "-50%"}, ${h.py > 0 || cy + h.py < HEAD + 90 ? "20px" : "calc(-100% - 20px)"})`,
            background: T.gray25, borderRadius: radius.lg, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8,
            boxShadow: "0 17px 5px rgba(0,0,0,0.01), 0 11px 4px rgba(0,0,0,0.02), 0 6px 4px rgba(0,0,0,0.05), 0 3px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.09)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: `2px solid ${hb.c}`, padding: "2px 0 2px 6px" }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, lineHeight: "18px", color: T.gray900 }}>{h.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: hb.cs }}>{h.value}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.gray700 }}>
            <span style={{ fontWeight: 700, color: hb.cs }}>{statusOf(h.value)}</span>
            {h.delta !== 0 && <TrendPill delta={h.delta} numberOnly />}
            <span style={{ color: T.gray500 }}>{h.delta === 0 ? sinceText(0, refName) : `since ${refName}`}</span>
          </div>
          {cmpOn && <span style={{ fontSize: 12, color: T.gray700 }}>{refName}: <b>{h.prev}</b> → now <b>{h.value}</b></span>}
          {h.blurb && <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: T.gray900 }}>{h.blurb}</p>}
        </div>
      )}
    </div>
  );
}

function ZoneGroups({ dots, counts, noun, cmpOn, refName }) {
  const keys = [0, STRIVING_AT, FLOURISHING_AT];
  return (
    <div data-part="zone-groups" style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], fontFamily: font }}>
      {ZONES.map((z, zi) => {
        const b = dsBand(keys[zi]);
        const list = dots.filter((d) => d.value >= z.from && (z.to === 100 ? d.value <= 100 : d.value < z.to)).sort((a, c) => c.value - a.value);
        return (
          <section key={z.name} aria-label={`${z.name}: ${counts[zi]}`} style={{ background: b.bg, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[12]}px ${list.length ? dsSpace[4] : dsSpace[12]}px` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: dsSpace[8] }}>
              <span style={{ ...dsText("Text xs", 700), color: b.cs }}>{z.name}</span>
              <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{z.from}{z.to === 100 ? " to 100" : ` to ${z.to - 1}`} · {counts[zi]} {counts[zi] === 1 ? noun : `${noun}s`}</span>
            </div>
            {list.map((d) => {
              const db = dsBand(d.value);
              return (
                <div key={`${d.label}-${d.value}`} style={{ display: "flex", alignItems: "center", gap: dsSpace[8], minHeight: 40 }}>
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: db.c, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, ...dsText("Text sm"), color: ds.text.secondary }}>{d.label}</span>
                  {cmpOn ? <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{refName}: {d.prev}</span> : d.delta !== 0 && <TrendPill delta={d.delta} numberOnly />}
                  <span style={{ ...dsText("Text md", 700), color: db.cs, minWidth: 24, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.value}</span>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
