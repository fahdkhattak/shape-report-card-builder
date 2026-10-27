import { TipBox } from "../../widgets/ChartTip.jsx";
import { useRef, useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace, dsShadow } from "../../../lib/ds.js";
import { useStoryWidth, useElementWidth } from "./storyWidth.js";
import { NumberBadge, NumberedList, DetailCard } from "./compactParts.jsx";
import { clampScore } from "./breakdownRules.js";

/* ================================================================== */
/* AREA CHART — the "What's Behind Your Score" chart on an Explorer's    */
/* Scope (Figma 13622:35993): a 280px plot in a 1px box (radius 4), a    */
/* column of 0 to 100 labels beside it, one point per Driver, a smooth    */
/* purple curve (Graph colour Purple) over a tinted area, and the Driver  */
/* names under the plot (13px, the hovered one bold). No gridlines.       */
/* Hovering anywhere picks the nearest Driver: a ringed marker, a dashed   */
/* guide and a tooltip with its score. In Compare mode a dashed grey curve */
/* shows the earlier round and the tooltip reads both.                      */
/* Layout is HTML with one stretched SVG for the curve, so the labels      */
/* line up with the points at any width.                                    */
/* ================================================================== */
const VW = 1000, PLOT_H = 280, PLOT_H_COMPACT = 200;

/* Catmull-Rom to cubic Bezier through the points; control points are clamped to
   the plot so the curve never dips below 0 or above 100. */
function smoothPath(pts, ph = PLOT_H) {
  if (pts.length < 2) return "";
  const clamp = (v) => Math.max(0, Math.min(ph, v));
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${clamp(p1[1] + (p2[1] - p0[1]) / 6)} ${p2[0] - (p3[0] - p1[0]) / 6},${clamp(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${p2[1]}`;
  }
  return d;
}


/* Do the Driver names fit under the plot? Each name gets the plot width divided by the count, less 8px of air, and may
   wrap to three lines (as the design does); no single word may be wider than its slot (13px text is about 6.7px a character). If any name doesn't
   fit, every point gets a numbered mark and a key lists the names: one clean switch, never names squeezed or staggered. */
const NAME_CHAR = 6.7;
function linesIn(label, slot) {
  const words = label.split(" ");
  if (words.some((w) => w.length * NAME_CHAR > slot)) return Infinity;
  let lines = 1, cur = 0;
  words.forEach((w) => { const len = w.length * NAME_CHAR; if (cur && cur + NAME_CHAR + len > slot) { lines++; cur = len; } else cur += (cur ? NAME_CHAR : 0) + len; });
  return lines;
}
export function namesFit(labels, plotWidth) {
  const slot = plotWidth / labels.length - 8;
  return slot >= 36 && labels.every((l) => linesIn(l, slot) <= 3);
}

/* rows: [{ label, value, prev? }] */
/* When the Driver names can't sit under the plot (see namesFit), each point gets a numbered mark and a key
   below lists the names, scores and changes; pointing at a name in the key highlights its point. On a compact card
   (under 560px, see storyWidth.js) tapping the plot, a name or a key row selects a point and its detail shows under the
   chart in place of the hover tooltip. */
export default function AreaChart({ rows, refName }) {
  const { compact: narrow } = useStoryWidth();
  const plotRef = useRef(null);
  const plotW = useElementWidth(plotRef, 700);
  // Names stay under the plot while they fit its width; otherwise numbered marks and a key.
  const compact = !namesFit(rows.map((r) => r.label), plotW);
  const PH = narrow ? PLOT_H_COMPACT : PLOT_H;
  const y = (v) => (1 - clampScore(v) / 100) * PH;
  const [chartHover, setHover] = useState(null);
  const [keyHover, setKeyHover] = useState(null); // a name in the key under the mouse
  const hover = keyHover ?? chartHover;
  const n = rows.length;
  const x = (i) => ((i + 0.5) / n) * VW;
  // The curve runs edge to edge: the first and last values are held out to the plot's sides.
  const edge = (vals) => [[0, y(vals[0])], ...vals.map((v, i) => [x(i), y(v)]), [VW, y(vals[n - 1])]];
  const pts = edge(rows.map((r) => r.value));
  const hasPrev = rows.some((r) => r.prev != null);
  const prevPts = hasPrev ? edge(rows.map((r) => r.prev ?? r.value)) : null;
  const line = smoothPath(pts, PH);
  const area = `${line} L${VW},${PH} L0,${PH} Z`;

  const onMove = (e) => {
    if (!compact && e.pointerType && e.pointerType !== "mouse" && e.type === "pointermove") return;
    const rect = plotRef.current.getBoundingClientRect();
    setHover(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - rect.left) / rect.width) * n))));
  };
  const h = hover != null ? rows[hover] : null;
  const b = h ? dsBand(h.value) : null;
  const purple = ds.graph.purple;
  const pct = (i) => `${((i + 0.5) / n) * 100}%`;

  return (
    <div data-part="area-wrap" style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
    <div data-part="area" style={{ position: "relative", display: "flex", gap: compact ? dsSpace[8] : dsSpace[16], alignItems: "flex-start", fontFamily: font }}>
      <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: PH, flexShrink: 0, width: 22, textAlign: "right", ...dsText("Text 2xs"), lineHeight: "normal", color: ds.text.tertiary }}>
        {[100, 80, 60, 40, 20, 0].map((t) => <span key={t}>{t}</span>)}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
        <div ref={plotRef} data-part="plot" role="img" aria-label={`Area chart of ${n} items: ${rows.map((r) => `${r.label} ${r.value}`).join(", ")}`} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={(e) => { if (!narrow || e.pointerType === "mouse") setHover(null); }} style={{ position: "relative", height: PH, touchAction: compact ? "pan-y" : undefined, boxSizing: "border-box", border: `1px solid ${ds.border.tertiary}`, borderRadius: dsRadius.xs, overflow: "hidden", cursor: hover != null ? "pointer" : "default" }}>
          <svg viewBox={`0 0 ${VW} ${PH}`} preserveAspectRatio="none" width="100%" height="100%" style={{ position: "absolute", inset: 0, display: "block" }}>
            <path d={area} fill={purple} fillOpacity="0.12" />
            {prevPts && <path d={smoothPath(prevPts, PH)} fill="none" stroke={ds.text.quaternary} strokeWidth="2" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
            <path data-part="curve" d={line} fill="none" stroke={purple} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1="0" y2={PH} stroke={ds.border.primary} strokeWidth="1" strokeDasharray="4 7" vectorEffect="non-scaling-stroke" />}
          </svg>
          {h && <span style={{ position: "absolute", left: pct(hover), top: `${y(h.value)}px`, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: "50%", boxSizing: "border-box", border: `2px solid ${purple}`, background: ds.surface.general.card, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: purple }} /></span>}
        </div>
        {compact ? (
          <div aria-hidden="true" style={{ display: "flex" }}>
            {rows.map((r, i) => <span key={`${i}-${r.label}`} onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)} style={{ flex: "1 1 0", minWidth: 0, display: "flex", justifyContent: "center", cursor: "pointer" }}><NumberBadge n={i + 1} active={hover === i} /></span>)}
          </div>
        ) : (
          <div style={{ display: "flex", ...dsText("Text xs"), textAlign: "center" }}>
            {rows.map((r, i) => (
              <p key={`${i}-${r.label}`} data-part="xlabel" onPointerEnter={() => setHover(i)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)} onPointerDown={() => setHover(i)} style={{ cursor: "pointer", flex: "1 1 0", minWidth: 0, margin: 0, padding: `0 ${dsSpace[4]}px`, boxSizing: "border-box", fontWeight: hover === i ? 700 : 500, color: hover === i ? ds.text.tertiary : ds.text.quaternary }}>{r.label}</p>
            ))}
          </div>
        )}
      </div>
      {!narrow && h && <Tip plotRef={plotRef} hover={hover} n={n} h={h} b={b} refName={refName} y={y(h.value)} />}
    </div>
    {narrow && h && keyHover == null && <DetailCard row={{ label: h.label, value: h.value, prev: h.prev, delta: h.prev != null ? h.value - h.prev : undefined }} refName={refName} scoreLabel="Your Score" />}
    {compact && <NumberedList rows={rows.map((r) => ({ label: r.label, value: r.value, delta: r.prev != null ? r.value - r.prev : undefined }))} active={hover} onPick={setHover} hoverable onHover={setKeyHover} />}
    </div>
  );
}

/* The tooltip is positioned against the plot, so it is measured from the plot's box each render. */
function Tip({ plotRef, hover, n, h, b, refName, y: py }) {
  const box = plotRef.current;
  if (!box) return null;
  const left = box.offsetLeft + ((hover + 0.5) / n) * box.offsetWidth;
  const top = box.offsetTop + py;
  return (
    <TipBox
      style={{ position: "absolute", left, top, zIndex: 2, width: 200, transform: `translate(${hover < 1 ? "-12%" : hover > n - 2 ? "-88%" : "-50%"}, calc(-100% - 14px))` }}
      content={{ head: h.label, rows: [{ label: "Your Score", value: h.value, score: true, color: b.c }], note: h.prev != null && refName ? <>{refName}: <b>{h.prev}</b> → now <b>{h.value}</b></> : null }}
    />
  );
}
