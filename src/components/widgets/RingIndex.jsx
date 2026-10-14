import { useState } from "react";
import { createPortal } from "react-dom";
import { font } from "../../lib/tokens.js";
import { ds, dsBand } from "../../lib/ds.js";
import { polar, describeArc } from "./primitives.jsx";
import { TipCard } from "./ChartTip.jsx";
import { DIMENSIONS, DIMENSION_DRIVERS, PREVIOUS, dimensionValue, driverValue } from "../../lib/dataset.js";

/* ================================================================== */
/* INDEX WIDGETS — the radial composite (specification board           */
/* 984qJvMt7fCHASYHRwgrab 9158:28363; rules written up in               */
/* docs/widget-insight-rules.md; frames 15061:40434 / 15061:40477).     */
/*                                                                      */
/* One score in a white disc, parts around it as equal radial slices    */
/* tinted by status, each slice a label (outer half) and its score      */
/* (inner half), a 3px rim in the status colour of the last visible     */
/* level, 1px white dividers, no gaps between rings.                    */
/*                                                                      */
/* 2×2, one level: 2 to 20 segments. Up to 12: label and score. 13 to   */
/* 20: labels hidden, the score moves to the middle of the segment.     */
/* A label that does not fit is truncated with an ellipsis, and hidden  */
/* when even that does not fit; the full label is on hover or tap.      */
/*                                                                      */
/* 3×3, two levels: 2 to 12 parents (their label inside the inner ring) */
/* and children in an outer ring whose labels sit outside the rim on a  */
/* connector (up to 25, and only if every one of them fits; otherwise   */
/* none, hover names them). A child narrower than 12° hides its score   */
/* but stays as a colour segment; hovering it opens its whole group.    */
/* Past 12 parents the widget gives way to the detailed view.            */
/*                                                                      */
/* Hover or tap a segment, or hover a label, for the tooltip: the full  */
/* label, the change since the last round and the score.                */
/* ================================================================== */
const G = { hole: 55.6, in: 58, out: 137, r2Out: 171 };
const MIN_CHILD_DEG = 12;
const MAX_CHILD_LABELS = 25;
const LEVEL2 = { success: "#D3F2E3", warning: "#FFF1CF", error: "#FCD7DD" }; // secondary tints from the board (not in the DS file)
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* Text width in px, measured with the real font (canvas measureText), so a label is only truncated when it really
   doesn't fit. Falls back to an average glyph width where there is no canvas. */
let ctx2d = null;
export function textWidth(text, size = 11, weight = 400) {
  if (typeof document !== "undefined" && !ctx2d) ctx2d = document.createElement("canvas").getContext("2d");
  if (!ctx2d) return text.length * size * 0.56;
  ctx2d.font = `${weight} ${size}px "IBM Plex Sans", sans-serif`;
  return ctx2d.measureText(text).width;
}

/* Fit a label to a width: whole, truncated with an ellipsis, or null when not even three letters and the ellipsis fit. */
export function fitLabel(label, widthPx, size = 11) {
  if (textWidth(label, size) <= widthPx) return label;
  for (let n = label.length - 1; n >= 3; n--) {
    const t = `${label.slice(0, n).trimEnd()}…`;
    if (textWidth(t, size) <= widthPx) return t;
  }
  return null;
}

/* Does a w × h box centred at (x, y) sit inside the ring slice (rIn..rOut, a0..a1 degrees, 0 = 12 o'clock, clockwise)
   with `pad` px to spare on every side? The slice is convex apart from the hole, so the box's corners decide the arcs'
   outer edge and the two straight edges, and its nearest point to the centre decides the hole. */
function boxInSlice(cx, cy, rIn, rOut, a0, a1, x, y, w, h, pad = 2) {
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2;
  const nx = clamp(cx, x0, x1) - cx, ny = clamp(cy, y0, y1) - cy;
  if (Math.hypot(nx, ny) < rIn + pad) return false;
  const edge = (a) => { const r = (a * Math.PI) / 180; return [Math.sin(r), -Math.cos(r)]; };
  const [ux0, uy0] = edge(a0), [ux1, uy1] = edge(a1);
  for (const [px, py] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
    const dx = px - cx, dy = py - cy;
    if (Math.hypot(dx, dy) > rOut - pad) return false;
    // cross(edge, p) = |p|·sin(θ − a): the signed distance from that straight edge (positive = clockwise of it)
    if (ux0 * dy - uy0 * dx < pad) return false;  // at least `pad` clockwise of a0
    if (ux1 * dy - uy1 * dx > -pad) return false; // and at least `pad` anticlockwise of a1
  }
  return true;
}
/* The widest box (up to `max`) of height h that fits in the slice, centred on the slice's mid-angle at one of the
   radii given; returns { w, r } for the best radius, or null. */
function roomInSlice(cx, cy, rIn, rOut, a0, a1, radii, h, max, avoid) {
  const mid = (a0 + a1) / 2;
  // `avoid`: a box ({ x, y, w, h }) the result must keep 4px clear of (the score, when placing the label).
  const clear = (x, y, w) => !avoid || Math.abs(x - avoid.x) >= (w + avoid.w) / 2 + 4 || Math.abs(y - avoid.y) >= (h + avoid.h) / 2 + 2;
  const ok = (x, y, w) => boxInSlice(cx, cy, rIn, rOut, a0, a1, x, y, w, h) && clear(x, y, w);
  let best = null;
  for (const r of radii) {
    const p = polar(cx, cy, r, mid);
    let lo = 0, hi = max;
    if (!ok(p.x, p.y, 4)) continue;
    while (hi - lo > 1) { const m = (lo + hi) / 2; if (ok(p.x, p.y, m)) lo = m; else hi = m; }
    if (!best || lo > best.w + 2) best = { w: Math.floor(lo), r, x: p.x, y: p.y };
  }
  return best;
}

function Txt({ x, y, w, h = 14, children, size = 11, weight = 400, color, align = "center" }) {
  const left = align === "end" ? x - w : align === "start" ? x : x - w / 2;
  return (
    <foreignObject x={left} y={y - h / 2} width={w} height={h} style={{ overflow: "visible", pointerEvents: "none" }}>
      <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: font, fontSize: size, fontWeight: weight, color: color || ds.text.primary, textAlign: align === "end" ? "right" : align === "start" ? "left" : "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: `${h}px` }}>{children}</div>
    </foreignObject>
  );
}

/* wedges: [{ label, value, prev?, sub?: [{ label, value, prev? }] }]. `center`: the overall score. */
function Ring({ wedges: all, center, size, title }) {
  const [hover, setHover] = useState(null); // { id, parent?, group? }; id = "p3" or "c3.1"
  const is3 = size === "3x3";
  const W = is3 ? 492 : 288, H = is3 ? 468 : 288;
  const cx = W / 2, cy = H / 2;
  const wedges = all.slice(0, is3 ? 12 : 20);
  const n = wedges.length;
  const hasSub = is3 && wedges.some((w) => w.sub?.length);
  const step = 360 / n;
  const rOut = hasSub ? G.r2Out : G.out;
  const rimIn = rOut + 2, rimOut = rOut + 5;
  const labelsOnWedge = n <= 12;
  const childTotal = wedges.reduce((a, w) => a + (w.sub?.length || 0), 0);

  // Child labels outside the rim: all or none (a ring half labelled reads as a mistake).
  const outside = [];
  let outsideOk = hasSub && childTotal > 0 && childTotal <= MAX_CHILD_LABELS;
  if (outsideOk) {
    const taken = { l: [], r: [] };
    wedges.forEach((w, i) => (w.sub || []).forEach((c, j) => {
      const mid = i * step + ((j + 0.5) * step) / w.sub.length;
      const side = Math.sin((mid * Math.PI) / 180) >= 0 ? "r" : "l";
      const p0 = polar(cx, cy, rimOut + 1, mid), p1 = polar(cx, cy, rimOut + 9, mid), p2 = polar(cx, cy, rimOut + 12, mid);
      if (taken[side].some((t) => Math.abs(t - p2.y) < 13)) outsideOk = false;
      taken[side].push(p2.y);
      const avail = (side === "r" ? W - p2.x : p2.x) - 4;
      const text = fitLabel(c.label, Math.min(avail, 104));
      if (!text) outsideOk = false;
      outside.push({ id: `c${i}.${j}`, parent: i, mid, side, p0, p1, p2, text, avail });
    }));
  }

  const tint = (v, level) => (level === 2 ? LEVEL2[dsBand(v).key] : dsBand(v).bg);
  const active = (id, pid) => !hover || hover.id === id || hover.group === pid || hover.id === pid || hover.parent === Number(pid?.slice(1));
  // Hover (mouse) or tap (touch) a segment: it stays lit, the others dim, and the shared chart tooltip opens at the
  // pointer, rendered into the page so the card can never clip it.
  const on = (id, extra = {}) => ({
    onPointerEnter: (e) => e.pointerType === "mouse" && setHover({ id, ...extra, x: e.clientX, y: e.clientY }),
    onPointerMove: (e) => e.pointerType === "mouse" && setHover((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h)),
    onPointerLeave: (e) => e.pointerType === "mouse" && setHover(null),
    onPointerDown: (e) => e.pointerType !== "mouse" && setHover((h) => (h?.id === id ? null : { id, ...extra, x: e.clientX, y: e.clientY })),
  });

  const rim = [];
  const body = wedges.map((w, i) => {
    const a0 = i * step, a1 = a0 + step, mid = a0 + step / 2, kids = hasSub ? w.sub || [] : [];
    const pid = `p${i}`;
    // Label in the outer half, score in the inner half, both inside the slice with 2px to spare (the board's safe zone).
    // Horizontal text in a side slice crosses the ring's depth, not its arc, so the room is measured, not taken from the chord.
    // The score is placed first (inner half); the label then takes the widest room left in the outer half that keeps
    // clear of it. On a side slice both run horizontally along the same line, so the label stops before the score.
    const depth = G.out - G.in;
    const SCORE_W = 18;
    const scoreIn = labelsOnWedge ? roomInSlice(cx, cy, G.in, G.out, a0, a1, [0.2, 0.26, 0.32, 0.38].map((f) => G.in + depth * f), 14, SCORE_W) : null;
    const scoreBox = scoreIn && scoreIn.w >= SCORE_W - 1 ? { x: scoreIn.x, y: scoreIn.y, w: SCORE_W, h: 14 } : null;
    // One line, as in the frames: the whole name if it fits, else truncated with an ellipsis ("Manag…"), else nothing.
    // The full name is always in the tooltip.
    const radii = [0.62, 0.68, 0.74, 0.8, 0.56].map((f) => G.in + depth * f);
    const room = labelsOnWedge && scoreBox ? roomInSlice(cx, cy, G.in, G.out, a0, a1, radii, 14, 96, scoreBox) : null;
    const labelText = room ? fitLabel(w.label, room.w) : null;
    const valAt = labelText ? scoreBox : polar(cx, cy, (G.in + G.out) / 2, mid);
    const nameAt = room;
    if (!kids.length) rim.push({ a0, a1, v: w.value });
    const childDeg = kids.length ? step / kids.length : 360;
    const smallKids = kids.length > 0 && childDeg < MIN_CHILD_DEG;
    return (
      <g key={pid} opacity={active(pid, pid) ? 1 : 0.55} style={{ transition: "opacity 120ms ease" }}>
        <path d={describeArc(cx, cy, G.in, G.out, a0, a1)} fill={tint(w.value, 1)} stroke="#fff" strokeWidth="1" style={{ cursor: "pointer" }} {...on(pid)} />
        {labelText && <Txt x={nameAt.x} y={nameAt.y} w={nameAt.w}>{labelText}</Txt>}
        <Txt x={valAt.x} y={valAt.y} w={30} h={16} size={12} weight={700} color={dsBand(w.value).cs}>{Math.round(w.value)}</Txt>
        {kids.map((c, j) => {
          const s0 = a0 + j * childDeg, s1 = s0 + childDeg;
          const at = polar(cx, cy, (G.out + G.r2Out) / 2, (s0 + s1) / 2);
          const fits = !smallKids && boxInSlice(cx, cy, G.out, G.r2Out, s0, s1, at.x, at.y, 16, 12, 1);
          const cid = `c${i}.${j}`;
          rim.push({ a0: s0, a1: s1, v: c.value });
          return (
            <g key={cid} opacity={!hover || hover.id === cid || hover.group === pid ? 1 : 0.55} style={{ transition: "opacity 120ms ease" }}>
              <path d={describeArc(cx, cy, G.out, G.r2Out, s0, s1)} fill={tint(c.value, 2)} stroke="#fff" strokeWidth="1" style={{ cursor: "pointer" }} {...on(smallKids ? `g${i}` : cid, smallKids ? { group: pid } : { parent: i })} />
              {fits && <Txt x={at.x} y={at.y} w={24} h={12} weight={700} color={dsBand(c.value).cs}>{Math.round(c.value)}</Txt>}
            </g>
          );
        })}
      </g>
    );
  });

  // The tooltip: the hovered segment, or (a child too narrow to read) its whole group.
  let tip = null;
  if (hover) {
    const m = hover.id.match(/^([pcg])(\d+)(?:\.(\d+))?$/);
    const w = wedges[Number(m[2])];
    if (w) {
      const row = (label, value, prev) => ({ label, value: Math.round(value), delta: prev == null ? 0 : Math.round(value) - Math.round(prev), score: true });
      if (m[1] === "g") tip = { head: w.label, rows: (w.sub || []).map((c) => row(c.label, c.value, c.prev)) };
      else if (m[1] === "c") { const c = w.sub[Number(m[3])]; tip = { head: w.label, rows: [row(c.label, c.value, c.prev)] }; }
      else tip = { rows: [row(w.label, w.value, w.prev)] };
    }
  }

  const rimEls = rim.map((c, k) => <path key={k} d={describeArc(cx, cy, rimIn, rimOut, c.a0 + 0.4, c.a1 - 0.4)} fill={dsBand(c.v).c} style={{ pointerEvents: "none" }} />);

  const labelEls = outsideOk ? outside.map((o) => (
    <g key={o.id} style={{ cursor: "pointer" }} opacity={!hover || hover.id === o.id ? 1 : 0.6} {...on(o.id, { parent: o.parent })}>
      <line x1={o.p0.x} y1={o.p0.y} x2={o.p1.x} y2={o.p1.y} stroke={ds.border.primary} strokeWidth="1" />
      <Txt x={o.side === "r" ? o.p2.x + 2 : o.p2.x - 2} y={o.p2.y} w={Math.min(o.avail, 104)} align={o.side === "r" ? "start" : "end"}>{o.text}</Txt>
    </g>
  )) : null;

  // With no labels outside the rim the ring has the whole box: crop the view to the ring so it is as big as it can be.
  const crop = hasSub && !outsideOk;
  const vb = crop ? { x: cx - (rimOut + 8), y: cy - (rimOut + 8), w: 2 * (rimOut + 8), h: 2 * (rimOut + 8) } : { x: 0, y: 0, w: W, h: H };
  const big = center >= 100 ? 52 : 64;
  return (
    <div style={{ flex: 1, alignSelf: "stretch", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", minWidth: 0, minHeight: 0 }}>
      <div style={{ position: "relative", width: "100%", maxWidth: crop ? 468 : W, aspectRatio: `${vb.w} / ${vb.h}` }}>
        <svg width="100%" height="100%" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} style={{ display: "block", overflow: "visible", touchAction: "pan-y" }} role="img" aria-label={`${title || "Index"}: ${center} out of 100. ${wedges.map((w) => `${w.label} ${Math.round(w.value)}`).join(", ")}`}>
          {body}
          {rimEls}
          <circle cx={cx} cy={cy} r={G.hole} fill="#fff" />
          <foreignObject x={cx - G.hole} y={cy - G.hole} width={G.hole * 2} height={G.hole * 2} style={{ pointerEvents: "none" }}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
              <span style={{ fontSize: big, fontWeight: 700, letterSpacing: -big * 0.02, lineHeight: 1, color: ds.status[dsBand(center).key].text }}>{center}</span>
            </div>
          </foreignObject>
          {labelEls}
        </svg>
        {tip && hover && typeof document !== "undefined" && createPortal(<TipCard x={hover.x} y={hover.y} content={tip} />, document.body)}
      </div>
    </div>
  );
}

/* ---- the whole organisation: the Explorers, and (3×3) the Drivers inside each --------------- */
export function IndexRing({ variant = "2x2", overall }) {
  const is3 = variant === "3x3";
  const wedges = DIMENSIONS.map((d) => ({
    label: d, value: dimensionValue(d), prev: dimensionValue(d, PREVIOUS),
    sub: is3 ? (DIMENSION_DRIVERS[d] || []).map((drv) => ({ label: drv, value: driverValue(drv), prev: driverValue(drv, PREVIOUS) })) : undefined,
  }));
  return <Ring wedges={wedges} center={Math.round(overall)} size={variant} title="Wellbeing index" />;
}

/* ---- one Explorer: its Drivers. There is no third level in the data (a round is not a sub-group), so this is a 2×2. */
export function DimensionIndex({ dimension }) {
  const wedges = (DIMENSION_DRIVERS[dimension] || []).map((d) => ({ label: d, value: driverValue(d), prev: driverValue(d, PREVIOUS) }));
  return <Ring wedges={wedges} center={Math.round(dimensionValue(dimension))} size="2x2" title={`${dimension} index`} />;
}
