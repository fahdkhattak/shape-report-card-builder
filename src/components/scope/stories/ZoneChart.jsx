import { useState } from "react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { sinceText } from "../../../lib/scopeData.js";
import { FLOURISHING_AT, STRIVING_AT, statusName } from "../../../lib/bands.js";
import { ds, dsBand, dsText, dsRadius, dsSpace } from "../../../lib/ds.js";
import { useStoryWidth } from "./storyWidth.js";
import { dotRadius, clampScore } from "./breakdownRules.js";
import { ShowAll } from "./BreakdownStory.jsx";

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
/* would be unreadable, so it becomes a slim strip of dots, a count line   */
/* and a short list, lowest first (see ZoneGroups).                         */
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

/* Compact: one slim 0–100 strip with every part as a small dot (the zones are thin tints, not big blocks), a one-line
   count, then a plain list, lowest first, grouped under quiet status labels. Six rows until "Show all". Tapping a row
   marks its dot on the strip. */
const COMPACT_ROWS = 6;
function stripLanes(dots) {
  const placed = [];
  [...dots].sort((a, b) => a.value - b.value).forEach((d) => {
    const v = clampScore(d.value);
    let lane = 0;
    for (let k = 0; k < 7; k++) {
      lane = k === 0 ? 0 : k % 2 ? (k + 1) / 2 : -k / 2;
      if (placed.every((p) => p.lane !== lane || Math.abs(p.v - v) >= 3)) break;
    }
    placed.push({ d, v, lane });
  });
  return placed;
}
function ZoneGroups({ dots, counts, noun, cmpOn, refName }) {
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState(null);
  const placed = stripLanes(dots);
  const maxLane = Math.max(0, ...placed.map((p) => Math.abs(p.lane)));
  const LANE = 9, stripH = 12 + maxLane * 2 * LANE;
  const zoneOf = (v) => (v >= FLOURISHING_AT ? 2 : v >= STRIVING_AT ? 1 : 0);
  const ordered = [...dots].sort((a, c) => a.value - c.value);
  const shown = showAll ? ordered : ordered.slice(0, COMPACT_ROWS);
  const plural = (n) => `${n} ${n === 1 ? noun : `${noun}s`}`;
  return (
    <div data-part="zone-groups" style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], fontFamily: font }}>
      <div role="img" aria-label={ZONES.map((z, i) => `${z.name}: ${plural(counts[i])}`).join(", ")}>
        <div style={{ position: "relative", height: stripH + 8, margin: "0 6px" }}>
          {ZONES.map((z, i) => (
            <span key={z.name} aria-hidden="true" style={{ position: "absolute", top: (stripH + 8) / 2 - 3, height: 6, left: `${z.from}%`, width: `${z.to - z.from}%`, background: dsBand(z.from).bg, borderRadius: i === 0 ? "3px 0 0 3px" : i === 2 ? "0 3px 3px 0" : 0, boxShadow: i ? `inset 1px 0 0 ${ds.surface.general.card}` : "none" }} />
          ))}
          {placed.map(({ d, v, lane }) => {
            const on = picked === d.label;
            const size = on ? 14 : 10;
            return <span key={d.label} aria-hidden="true" style={{ position: "absolute", left: `${v}%`, top: (stripH + 8) / 2 + lane * LANE, width: size, height: size, margin: `${-size / 2}px 0 0 ${-size / 2}px`, borderRadius: "50%", boxSizing: "border-box", background: dsBand(d.value).c, border: `2px solid ${ds.surface.general.card}`, boxShadow: on ? `0 0 0 2px ${dsBand(d.value).c}` : "none", opacity: picked && !on ? 0.35 : 1, transition: "all 150ms ease" }} />;
          })}
        </div>
        <div aria-hidden="true" style={{ position: "relative", height: 14, margin: "4px 6px 0" }}>
          {[0, STRIVING_AT, FLOURISHING_AT, 100].map((t, i) => (
            <span key={t} style={{ position: "absolute", left: `${t}%`, transform: i === 0 ? "none" : i === 3 ? "translateX(-100%)" : "translateX(-50%)", ...dsText("Text 3xs"), fontSize: 10, color: ds.text.tertiary, fontVariantNumeric: "tabular-nums" }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: `${dsSpace[4]}px ${dsSpace[12]}px` }}>
        {ZONES.map((z, i) => (
          <span key={z.name} style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6], ...dsText("Text 2xs"), color: ds.text.secondary }}>
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: dsBand(z.from).c }} />
            <b style={{ fontWeight: 700, color: ds.text.primary }}>{counts[i]}</b> {z.name}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {shown.map((d, i) => {
          const db = dsBand(d.value);
          const z = zoneOf(d.value);
          const head = i === 0 || zoneOf(shown[i - 1].value) !== z;
          const on = picked === d.label;
          return (
            <div key={`${d.label}-${d.value}`}>
              {head && <div style={{ ...dsText("Text 3xs-Header", 600), textTransform: "uppercase", letterSpacing: 0.4, color: ds.text.tertiary, padding: `${i ? dsSpace[12] : 0}px 0 ${dsSpace[4]}px` }}>{ZONES[z].name} · {counts[z]}</div>}
              <button
                type="button" aria-pressed={on} onClick={() => setPicked(on ? null : d.label)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: dsSpace[8], minHeight: 40, padding: `0 ${dsSpace[4]}px`, border: "none", borderTop: `1px solid ${ds.border.tertiary}`, background: on ? ds.interactive.ghostHover : "transparent", borderRadius: 0, cursor: "pointer", fontFamily: font, textAlign: "left" }}
              >
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: db.c, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, ...dsText("Text sm", on ? 600 : 400), color: ds.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
                {cmpOn ? <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{refName}: {d.prev}</span> : d.delta !== 0 && <TrendPill delta={d.delta} numberOnly />}
                <span style={{ ...dsText("Text md", 700), color: db.cs, minWidth: 24, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.value}</span>
              </button>
            </div>
          );
        })}
      </div>
      {ordered.length > COMPACT_ROWS && <ShowAll open={showAll} total={ordered.length} onToggle={() => setShowAll((v) => !v)} />}
    </div>
  );
}
