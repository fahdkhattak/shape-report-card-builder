import { useRef, useState } from "react";
import { font } from "../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace, dsShadow } from "../../lib/ds.js";
import { TrendPill } from "../widgets/primitives.jsx";
import { useStoryWidth, useElementWidth } from "./stories/storyWidth.js";
import { NumberedList, DetailCard } from "./stories/compactParts.jsx";
import { clampScore } from "./stories/breakdownRules.js";

/* ================================================================== */
/* SCOPE RADAR — the "What's Behind Your Score" spider graph (Figma      */
/* 13622:35947, plot 774 by 524): five concentric rings at 20 to 100     */
/* (outer ring 216 from the centre), a spoke per axis that runs past      */
/* the outer ring to 250, a small grey node where each spoke meets the    */
/* outer ring (always visible), and an orange polygon through the real    */
/* values. Labels sit beyond the spoke ends (12px).                        */
/*                                                                        */
/* The data points are hidden until you hover the chart: moving over it    */
/* reveals a dot on every vertex and picks the axis nearest the cursor     */
/* (by angle) as the active one: its dot becomes a ringed marker, its      */
/* label turns bold, and a tooltip opens. Picking by angle rather than by  */
/* hitting a tiny dot makes the whole chart the hover target. Drawn as     */
/* computed SVG so it works for any axis count; the design shows 5 Areas,  */
/* ours are the 12 real Explorers.                                         */
/* On a compact card (under 560px, see stories/storyWidth.js) the labels   */
/* cannot sit around the plot, so the plot is cropped square, each spoke   */
/* gets a numbered mark, and a key below lists names, scores and changes.   */
/* Tapping a mark, a sector or a key row selects it; the detail card that   */
/* hovering opens on a wide card appears under the chart.                   */
/* ================================================================== */
const W = 774;
const H = 524;
const CX = W / 2;
const CY = 288;
const R = 216;        // outer ring
const R_SPOKE = 250;  // spokes run past the ring
const R_LABEL = 262;
/* The design draws the series in #EB5421 (marker #FD531B). Neither is a design-system colour, so they are named here. */
export const RADAR_SERIES = "#EB5421";
const RADAR_MARKER = "#FD531B";

const polar = (angle, r) => [CX + r * Math.sin(angle), CY - r * Math.cos(angle)];

/* "Cross-Team Collaboration Efficiency" -> short lines, so labels never run off the chart. */
function wrap(label, max = 16) {
  const lines = [];
  let cur = "";
  label.split(" ").forEach((w) => {
    if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  });
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}


/* Do the names fit around the plot? Estimate each label's box (12px text is about 6.3 units a character, 16 a line),
   try wrapping at 18, 14, then 11 characters, and use the first wrapping where no two boxes touch and none leaves the
   drawing. Returns the wrap width that works, or null (names don't fit, so the chart uses numbered marks and a key). */
const CHAR = 6.3, LINE = 16;
export function fitRadarLabels(labels, angleOf) {
  const n = labels.length;
  for (const max of [18, 14, 11]) {
    const boxes = [];
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      const lines = wrap(labels[i], max);
      const longest = labels[i].split(" ").reduce((m, w) => Math.max(m, w.length), 0);
      if (longest > max + 3) { ok = false; break; }
      const w = Math.max(...lines.map((l) => l.length)) * CHAR, h = lines.length * LINE;
      const a = angleOf(i), side = Math.sin(a), cos = Math.cos(a);
      const x = CX + R_LABEL * side, y = CY - R_LABEL * cos;
      const left = Math.abs(side) < 0.2 ? x - w / 2 : side > 0 ? x : x - w;
      const top = Math.abs(side) < 0.2 ? (cos > 0 ? y - h + LINE / 2 - 4 : y + 4 - LINE / 2) : y - h / 2;
      boxes.push({ l: left, r: left + w, t: top, b: top + h });
      if (left < -8 || left + w > W + 8) ok = false;
    }
    if (!ok) continue;
    const hit = boxes.some((a, i) => boxes.some((b, j) => j > i && a.l < b.r + 4 && b.l < a.r + 4 && a.t < b.b + 2 && b.t < a.b + 2));
    if (!hit) return max;
  }
  return null;
}

export default function ScopeRadar({ items }) {
  const { compact: narrowCard } = useStoryWidth();
  const svgRef = useRef(null);
  const outerRef = useRef(null);
  const boxRef = useRef(null);
  const wrapW = useElementWidth(outerRef, W); // the width on offer, not the capped width the chart uses
  const cw = useElementWidth(boxRef, W);
  // Names stay on the chart for as long as they physically fit: the plot is wide enough that 12px text stays at least 10px
  // on screen, and the names don't collide when wrapped (see fitRadarLabels). Otherwise numbered marks and a key.
  const wrapMax = fitRadarLabels(items.map((it) => it.label), (i) => (i / items.length) * Math.PI * 2);
  const compact = narrowCard || wrapW < 645 || wrapMax == null;
  const [hover, setHover] = useState(null);
  const [chartHover, setChartHover] = useState(false);
  const n = items.length;
  const angle = (i) => (i / n) * Math.PI * 2;
  const points = items.map((it, i) => polar(angle(i), (clampScore(it.value) / 100) * R));
  // Compare mode: each item may carry the earlier round's value as `prev`.
  const prevPoints = items.some((it) => it.prev != null) ? items.map((it, i) => polar(angle(i), (clampScore(it.prev ?? it.value) / 100) * R)) : null;

  // The visible window of the drawing. Wide: the designed 774 by 524. Compact: a square just big enough for the spokes
  // and a numbered mark (22px across) past each end, scaled so the marks and lines stay a readable size on screen.
  const vw = compact ? 524 / (1 - 48 / Math.max(cw, 120)) : W;
  const k = compact ? vw / Math.max(cw, 120) : 1;          // drawing units per screen pixel
  const view = compact ? { x: CX - vw / 2, y: CY - vw / 2, w: vw, h: vw } : { x: 0, y: 0, w: W, h: H };
  const line = (v) => (compact ? v * Math.max(1, k * 0.7) : v);
  const markR = 11 * k;

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = view.x + ((e.clientX - rect.left) / rect.width) * view.w - CX;
    const y = view.y + ((e.clientY - rect.top) / rect.height) * view.h - CY;
    if (Math.hypot(x, y) > R_SPOKE + (compact ? 12 + 2 * markR : 24)) { if (!compact) { setChartHover(false); setHover(null); } return; }
    setChartHover(true);
    let a = Math.atan2(x, -y); // 0 at top, clockwise
    if (a < 0) a += Math.PI * 2;
    setHover(Math.round(a / ((Math.PI * 2) / n)) % n);
  };
  const onLeave = () => { if (!compact) { setChartHover(false); setHover(null); } };

  const hovered = hover != null ? items[hover] : null;
  const [hx, hy] = hover != null ? points[hover] : [0, 0];
  const b = hovered ? dsBand(hovered.value) : null;
  const below = hy < 170; // near the top: drop the tooltip below the dot instead of above it
  const grey = ds.border.secondary;
  const showPoints = compact || chartHover;

  return (
    <div ref={outerRef} style={{ width: "100%" }}>
    <div data-part="radar-wrap" style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], margin: n > 8 && !compact ? "0 auto 28px" : "0 auto", width: "100%", maxWidth: compact ? 520 : W }}>
      <div ref={boxRef} data-part="radar" style={{ position: "relative", width: "100%", aspectRatio: compact ? "1 / 1" : `${W} / ${H}` }}>
        <svg ref={svgRef} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} width="100%" height="100%" role="img" aria-label={`Radar chart of ${n} items: ${items.map((it) => `${it.label} ${it.value}`).join(", ")}`} style={{ display: "block", overflow: "visible", cursor: chartHover ? "pointer" : "default", touchAction: compact ? "pan-y" : undefined }} onPointerMove={(e) => { if (!compact && e.pointerType !== "mouse") return; onMove(e); }} onPointerDown={onMove} onPointerLeave={onLeave}>
          {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
            <circle key={f} data-part="ring" cx={CX} cy={CY} r={R * f} fill="none" stroke={grey} strokeWidth={line(0.75)} />
          ))}
          {items.map((_, i) => {
            const [x, y] = polar(angle(i), R_SPOKE);
            return <line key={i} data-part="spoke" x1={CX} y1={CY} x2={x} y2={y} stroke={grey} strokeWidth={line(0.75)} />;
          })}
          {prevPoints && <polygon points={prevPoints.map((p) => p.join(",")).join(" ")} fill="none" stroke={ds.text.quaternary} strokeWidth={line(2)} strokeDasharray={compact ? `${line(5)} ${line(4)}` : "5 4"} strokeLinejoin="round" />}
          <polygon data-part="series" points={points.map((p) => p.join(",")).join(" ")} fill={RADAR_SERIES} fillOpacity="0.06" stroke={RADAR_SERIES} strokeWidth={line(2.5)} strokeLinejoin="round" />

          {items.map((_, i) => {
            const [x, y] = polar(angle(i), R);
            return <circle key={i} data-part="node" cx={x} cy={y} r={compact ? 3.5 * Math.max(1, k * 0.7) : 3.5} fill={grey} />;
          })}

          {points.map(([x, y], i) => {
            const active = hover === i;
            const dot = compact ? 3.5 * Math.max(1, k * 0.7) : 3.5;
            return (
              <g key={i} style={{ pointerEvents: "none", opacity: showPoints ? 1 : 0, transition: "opacity 150ms ease" }}>
                {active ? (
                  <>
                    <circle cx={x} cy={y} r={dot * 2} fill={ds.surface.general.card} stroke={RADAR_MARKER} strokeWidth={line(2)} />
                    <circle cx={x} cy={y} r={dot} fill={RADAR_MARKER} />
                  </>
                ) : (
                  <circle cx={x} cy={y} r={dot} fill={RADAR_SERIES} stroke={ds.surface.general.card} strokeWidth={line(1.5)} />
                )}
              </g>
            );
          })}

          {compact ? items.map((it, i) => {
            const [x, y] = polar(angle(i), R_SPOKE + 12 + markR);
            const active = hover === i;
            return (
              <g key={i} style={{ pointerEvents: "none" }}>
                <circle data-part="mark" cx={x} cy={y} r={markR} fill={active ? ds.text.primary : ds.bg.primary} stroke={active ? ds.text.primary : grey} strokeWidth={line(1)} />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11 * k} fontWeight="600" fontFamily={font} fill={active ? ds.surface.general.card : ds.text.secondary}>{i + 1}</text>
              </g>
            );
          }) : items.map((it, i) => {
            const [x, y] = polar(angle(i), R_LABEL);
            const side = Math.sin(angle(i));
            const anchor = Math.abs(side) < 0.2 ? "middle" : side > 0 ? "start" : "end";
            const lines = wrap(it.label, wrapMax || 16);
            const top = Math.abs(side) < 0.2 && Math.cos(angle(i)) > 0; // the top label sits above its spoke
            const y0 = (top ? y - (lines.length - 1) * 16 : Math.abs(side) < 0.2 ? y + 4 : y - ((lines.length - 1) * 16) / 2);
            return (
              <text key={i} data-part="label" textAnchor={anchor} dominantBaseline="middle" fontSize="12" fontFamily={font} fill={ds.text.secondary} fontWeight={hover === i ? 700 : 400} style={{ pointerEvents: "none" }}>
                {lines.map((ln, k2) => <tspan key={k2} x={x} y={y0 + k2 * 16}>{ln}</tspan>)}
              </text>
            );
          })}
        </svg>

        {!compact && hovered && (
          <div
            style={{
              position: "absolute", left: `${(hx / W) * 100}%`, top: `${(hy / H) * 100}%`, width: 240, boxSizing: "border-box", pointerEvents: "none",
              transform: `translate(${hx < 130 ? "-12%" : hx > W - 130 ? "-88%" : "-50%"}, ${below ? "18px" : "calc(-100% - 18px)"})`,
              background: ds.surface.general.tooltip, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, display: "flex", flexDirection: "column", gap: dsSpace[8], zIndex: 2,
              boxShadow: dsShadow("sm"),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], borderLeft: `2px solid ${b.c}`, padding: `${dsSpace[2]}px 0 ${dsSpace[2]}px ${dsSpace[6]}px` }}>
              <span style={{ flex: 1, minWidth: 0, ...dsText("Text xs", 600), color: ds.text.primary }}>{hovered.label}</span>
              {hovered.delta != null && hovered.delta !== 0 && <TrendPill delta={hovered.delta} numberOnly />}
              <span style={{ ...dsText("Text md", 700), color: b.cs }}>{hovered.value}</span>
            </div>
            {hovered.prevLabel && (
              <p style={{ margin: 0, ...dsText("Text 2xs"), color: ds.text.secondary }}>
                {hovered.prevLabel}: <b>{hovered.prev}</b> → now <b>{hovered.value}</b>
              </p>
            )}
            {hovered.blurb && <p style={{ margin: 0, ...dsText("Text xs"), color: ds.text.primary }}>{hovered.blurb}</p>}
          </div>
        )}
      </div>

      {compact && (
        <>
          {hovered && <DetailCard row={{ ...hovered }} refName={hovered.prevLabel} />}
          <NumberedList rows={items} active={hover} onPick={setHover} />
        </>
      )}
    </div>
    </div>
  );
}
