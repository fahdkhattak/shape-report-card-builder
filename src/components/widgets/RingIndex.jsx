import { useState } from "react";
import { T, font, band } from "../../lib/tokens.js";
import { polar, describeArc } from "./primitives.jsx";
import { ROUNDS, DIMENSIONS, DIMENSION_DRIVERS, dimensionValue, driverValue } from "../../lib/dataset.js";

/* ================================================================== */
/* INDEX WIDGETS — "Corporate Culture INDEX" (Figma 984qJvMt7fCHASYHRwgrab, */
/* node 15061:40683; 2x2 = 15061:40434, 3x3 = 15061:40477).                 */
/*                                                                          */
/* One score in a white disc, parts around it as tinted wedges (status       */
/* tint, white hairlines), each wedge naming itself and its score; a bold    */
/* rim in the status colour of the outermost ring; a 3×3 adds a second ring   */
/* of finer cells and labels outside the rim on a short tick.                 */
/*                                                                          */
/* Geometry read off the nodes (px): disc Ø111 with the score at 64/700;      */
/* wedges r 58–137; second ring r 139–171; rim 3px (r 173–176 at 3×3, 139.5–   */
/* 142.5 at 2×2); names 11/400 near the outer edge of a wedge, scores 11/700   */
/* near the disc; outside labels 11/400.                                       */
/*                                                                          */
/* The Figma 3×3's second ring is 20 survey *items*, which this dataset does    */
/* not have. So the second ring is whatever real, finer data the subject has:   */
/*   whole organisation → the Drivers inside each Explorer                       */
/*   one Explorer       → each Driver's score in every round (oldest first)      */
/* At 3×3 every inner wedge is named outside the rim (two lines at most) and      */
/* shows only its score inside, so every part is labelled the same way; the       */
/* outer ring's cells show scores and name themselves on hover, which also swaps   */
/* the disc to that part's name and score. There is no caption under the chart.    */
/* ================================================================== */
const G = { hole: 55.6, in: 58, wOut: 137, r2In: 139, r2Out: 171 };

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function Txt({ x, y, w, h = 14, children, size = 11, weight = 400, color = T.gray900, align = "center", ellipsis = true, lines = 1 }) {
  const left = align === "end" ? x - w : align === "start" ? x : x - w / 2;
  return (
    <foreignObject x={left} y={y - h / 2} width={w} height={h} style={{ overflow: "visible", pointerEvents: "none" }}>
      <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: font, fontSize: size, fontWeight: weight, color, textAlign: align === "end" ? "right" : align === "start" ? "left" : "center", ...(lines > 1 ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: `${Math.round(h / lines)}px` } : { whiteSpace: "nowrap", overflow: "hidden", textOverflow: ellipsis ? "ellipsis" : "clip", lineHeight: `${h}px` }) }}>{children}</div>
    </foreignObject>
  );
}

/* wedges: [{ label, value, sub?: [{ label, value }] }]. outside: [{ angle, text }] drawn beyond the rim. */
function Ring({ wedges, center, outside = [], size }) {
  const [hover, setHover] = useState(null);
  const is3 = size === "3x3";
  const W = is3 ? 492 : 288, H = is3 ? 468 : 288;
  const cx = W / 2, cy = H / 2;
  const hasSub = is3 && wedges.some((w) => w.sub?.length);
  const rimIn = hasSub ? 173 : 139.5, rimOut = hasSub ? 176 : 142.5;
  const step = 360 / wedges.length;
  const cb = band(center);
  const shown = hover || { label: null, value: center };
  const sb = band(shown.value);
  const big = shown.label ? 40 : center >= 100 ? 52 : 64;

  const rimCells = [];
  const body = wedges.map((w, i) => {
    const a0 = i * step, a1 = (i + 1) * step, mid = (a0 + a1) / 2, b = band(w.value);
    const chord = 2 * 107 * Math.sin((step / 2) * (Math.PI / 180));
    const nameAt = polar(cx, cy, 107, mid), valAt = polar(cx, cy, is3 ? 98 : 66, mid);
    const over = (label, value) => ({ onMouseEnter: () => setHover({ label, value }), onMouseLeave: () => setHover(null) });
    if (!(hasSub && w.sub?.length)) rimCells.push({ a0, a1, v: w.value });
    return (
      <g key={w.label}>
        <path d={describeArc(cx, cy, G.in, G.wOut, a0, a1)} fill={b.bg} stroke={T.white} strokeWidth="1.5" {...over(w.label, w.value)}><title>{`${w.label}: ${w.value}`}</title></path>
        {!is3 && <Txt x={nameAt.x} y={nameAt.y} w={clamp(chord - 6, 36, 74)} size={step <= 30 ? 10 : 11}>{w.label}</Txt>}
        <Txt x={valAt.x} y={valAt.y} w={34} h={16} size={is3 ? 14 : 11} weight={700} color={b.cs}>{w.value}</Txt>
        {hasSub && w.sub?.map((c, j) => {
          const n = w.sub.length, s0 = a0 + (j * step) / n, s1 = a0 + ((j + 1) * step) / n, cb2 = band(c.value);
          const at = polar(cx, cy, (G.r2In + G.r2Out) / 2, (s0 + s1) / 2);
          // A cell narrower than its own number (a 7-Driver Explorer's cells are ~12px wide) shows no number: hover names it.
          const fits = ((s1 - s0) * Math.PI / 180) * ((G.r2In + G.r2Out) / 2) >= 20;
          rimCells.push({ a0: s0, a1: s1, v: c.value });
          return (
            <g key={c.label}>
              <path d={describeArc(cx, cy, G.r2In, G.r2Out, s0, s1)} fill={cb2.bg} stroke={T.white} strokeWidth="1.2" {...over(c.label, c.value)}><title>{`${c.label}: ${c.value}`}</title></path>
              {fits && <Txt x={at.x} y={at.y} w={24} h={12} size={11} weight={700} color={cb2.cs}>{c.value}</Txt>}
            </g>
          );
        })}
      </g>
    );
  });

  // Labels outside the rim, each on a short tick; on a side, skip one that would sit on top of another.
  const taken = { l: [], r: [] };
  const labels = outside.map((o) => {
    const side = Math.sin((o.angle * Math.PI) / 180) >= 0 ? "r" : "l";
    const p0 = polar(cx, cy, rimOut + 3, o.angle), p1 = polar(cx, cy, rimOut + 11, o.angle), p2 = polar(cx, cy, rimOut + 14, o.angle);
    const y = p2.y;
    if (taken[side].some((t) => Math.abs(t - y) < 26)) return null;
    taken[side].push(y);
    const avail = side === "r" ? W - p2.x - 2 : p2.x - 2;
    return (
      <g key={o.angle + o.text}>
        <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={T.gray300} strokeWidth="1" />
        <Txt x={side === "r" ? p2.x + 2 : p2.x - 2} y={y} w={clamp(avail, 30, 110)} h={26} lines={2} align={side === "r" ? "start" : "end"} color={T.gray900}>{o.text}</Txt>
      </g>
    );
  });

  return (
    <div style={{ flex: 1, alignSelf: "stretch", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minWidth: 0, minHeight: 0 }}>
      <div style={{ width: "100%", maxWidth: W, aspectRatio: `${W} / ${H}` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }} role="img" aria-label={`Index: ${center} out of 100`}>
          {body}
          {rimCells.map((c, i) => <path key={i} d={describeArc(cx, cy, rimIn, rimOut, c.a0 + 0.5, c.a1 - 0.5)} fill={band(c.v).c} style={{ pointerEvents: "none" }} />)}
          <circle cx={cx} cy={cy} r={G.hole} fill={T.white} />
          <foreignObject x={cx - G.hole} y={cy - G.hole} width={G.hole * 2} height={G.hole * 2} style={{ pointerEvents: "none" }}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontFamily: font }}>
              <span style={{ fontSize: big, fontWeight: 700, letterSpacing: -big * 0.02, lineHeight: 1, color: sb.cs }}>{shown.value}</span>
              {shown.label && <span style={{ fontSize: 10, color: T.gray700, maxWidth: 92, textAlign: "center", lineHeight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shown.label}</span>}
            </div>
          </foreignObject>
          {labels}
        </svg>
      </div>
    </div>
  );
}

/* ---- the whole organisation: the Explorers, and (3×3) the Drivers inside each --------------- */
export function IndexRing({ variant = "2x2", overall }) {
  const is3 = variant === "3x3";
  const wedges = DIMENSIONS.map((d) => ({
    label: d, value: Math.round(dimensionValue(d)),
    sub: is3 ? (DIMENSION_DRIVERS[d] || []).map((drv) => ({ label: drv, value: Math.round(driverValue(drv)) })) : undefined,
  }));
  // Every Explorer is named outside the rim, at the middle of its wedge.
  const step = 360 / wedges.length;
  const outside = is3 ? wedges.map((w, i) => ({ text: w.label, angle: i * step + step / 2 })) : [];
  return <Ring wedges={wedges} center={Math.round(overall)} outside={outside} size={variant} />;
}

/* ---- one Explorer: its Drivers, and (3×3) each Driver's score in every round ----------------- */
export function DimensionIndex({ dimension, variant = "2x2" }) {
  const is3 = variant === "3x3";
  const drivers = DIMENSION_DRIVERS[dimension] || [];
  const wedges = drivers.map((d) => ({
    label: d, value: Math.round(driverValue(d)),
    sub: is3 ? ROUNDS.map((r) => ({ label: `${d} · Round ${r.round}`, value: Math.round(r.driverAvg[d]) })) : undefined,
  }));
  const step = 360 / (wedges.length || 1);
  const outside = is3 ? wedges.map((w, i) => ({ text: w.label, angle: i * step + step / 2 })) : [];
  return <Ring wedges={wedges} center={Math.round(dimensionValue(dimension))} outside={outside} size={variant} />;
}
