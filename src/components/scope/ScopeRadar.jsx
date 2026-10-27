import { TipBox } from "../widgets/ChartTip.jsx";
import { useRef, useState } from "react";
import { font } from "../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace, dsShadow } from "../../lib/ds.js";
import { TrendPill } from "../widgets/primitives.jsx";
import { useElementWidth } from "./stories/storyWidth.js";
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
/* Names stay around the plot for as long as they fit (fitRadarLabels):    */
/* on a narrower card the rings shrink so 11px+ names still fit beside     */
/* them. Only when they can't (too many, or too long for the width) is the */
/* plot cropped square, each spoke given a numbered mark, and a key below  */
/* lists names, scores and changes. Tapping a mark, a sector or a key row  */
/* selects it, pointing at a key row with a mouse highlights its spoke,    */
/* and the detail card that hovering opens appears under the chart.        */
/* ================================================================== */
const W = 774;
const H = 524;
const CX = W / 2;
const CY = 288;
const R_DESIGN = 216; // outer ring in the design; spokes run 34 past it, labels sit 46 past it (see radarGeometry)
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


/* Do the names fit around the plot? Names are the point of the chart, so it gives up a lot before it falls back to
   numbered marks and a key. Text is kept at 11px or more on screen whatever the chart's width (`scale` = screen px per
   drawing unit), so on a narrower card the text is larger in drawing units, and the rings shrink to make room for it
   (216, the design, down to whatever leaves at least 90px of radius on screen). At each ring size it tries wrapping the
   names at 18, 14, then 11 characters (12px text is about 6.3 units a character, 16 a line), and keeps the first layout
   where no two boxes touch and none leaves the drawing. Returns { R, wrapAt, text, line } or null (numbers and a key). */
const CHAR = 6.3, LINE = 16;
const RINGS = [216, 200, 184, 168, 152, 136, 120, 104];
export const radarGeometry = (R) => ({ R, spoke: R + 34, label: R + 46 });
export function fitRadarLabels(labels, angleOf, scale = 1) {
  const n = labels.length;
  const text = Math.max(12, 11 / scale);   // drawing units for the label text
  const f = text / 12;
  for (const R of RINGS) {
    if (R * scale < 90) break;
    const { label: RL } = radarGeometry(R);
    for (const max of [18, 14, 11]) {
      const boxes = [];
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        const lines = wrap(labels[i], max);
        const longest = labels[i].split(" ").reduce((m, w) => Math.max(m, w.length), 0);
        if (longest > max + 3) { ok = false; break; }
        const w = Math.max(...lines.map((l) => l.length)) * CHAR * f, h = lines.length * LINE * f;
        const a = angleOf(i), side = Math.sin(a), cos = Math.cos(a);
        const x = CX + RL * side, y = CY - RL * cos;
        const left = Math.abs(side) < 0.2 ? x - w / 2 : side > 0 ? x : x - w;
        const top = Math.abs(side) < 0.2 ? (cos > 0 ? y - h + (LINE * f) / 2 - 4 : y + 4 - (LINE * f) / 2) : y - h / 2;
        boxes.push({ l: left, r: left + w, t: top, b: top + h });
        if (left < -8 || left + w > W + 8) ok = false;
      }
      if (!ok) continue;
      const hit = boxes.some((a, i) => boxes.some((b, j) => j > i && a.l < b.r + 4 && b.l < a.r + 4 && a.t < b.b + 2 && b.t < a.b + 2));
      if (!hit) return { R, wrapAt: max, text, line: LINE * f };
    }
  }
  return null;
}

/* From this many spokes the radar always uses numbered marks and a key, even where names would squeeze in: past about
   20 a ring of names reads as noise (product direction). */
export const RADAR_NAMES_BELOW = 20;

/* items: [{ label, value, prev?, delta?, prevLabel?, blurb? }].
   series (optional, Comparison): [{ id, label, color, values }] drawn instead of the one orange series, each in its own
   colour; the tooltip, detail card and key then list every series at the selected spoke. */
export default function ScopeRadar({ items, series }) {
  const svgRef = useRef(null);
  const outerRef = useRef(null);
  const boxRef = useRef(null);
  const wrapW = useElementWidth(outerRef, W); // the width on offer, not the capped width the chart uses
  const cw = useElementWidth(boxRef, W);
  // Names stay on the chart for as long as they physically fit (see fitRadarLabels): the rings shrink and the text stays
  // 11px or more on screen. Only when even the smallest rings leave no room, or on a phone-width card, do numbered marks
  // and a key take over. A phone-width card tries too: a handful of short names can fit at 400px.
  const fit = items.length >= RADAR_NAMES_BELOW ? null : fitRadarLabels(items.map((it) => it.label), (i) => (i / items.length) * Math.PI * 2, Math.min(wrapW, W) / W);
  const compact = fit == null;
  const { R, spoke: R_SPOKE, label: R_LABEL } = radarGeometry(fit ? fit.R : R_DESIGN);
  const [chartHoverIdx, setHover] = useState(null);
  const [keyHover, setKeyHover] = useState(null); // a name in the key under the mouse
  const hover = keyHover ?? chartHoverIdx;
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
  // A mouse leaving always clears; a finger lifting on a compact chart keeps its selection (there's no hover to lose).
  const onLeave = (e) => { if (!compact || e.pointerType === "mouse") { setChartHover(false); setHover(null); } };

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
          {series ? series.map((s) => (
            <polygon key={s.id} data-part="series" points={s.values.map((v, i) => polar(angle(i), (clampScore(v) / 100) * R).join(",")).join(" ")} fill={s.color} fillOpacity="0.08" stroke={s.color} strokeWidth={line(2.5)} strokeLinejoin="round" style={{ pointerEvents: "none" }} />
          )) : <polygon data-part="series" points={points.map((p) => p.join(",")).join(" ")} fill={RADAR_SERIES} fillOpacity="0.06" stroke={RADAR_SERIES} strokeWidth={line(2.5)} strokeLinejoin="round" />}

          {items.map((_, i) => {
            const [x, y] = polar(angle(i), R);
            return <circle key={i} data-part="node" cx={x} cy={y} r={compact ? 3.5 * Math.max(1, k * 0.7) : 3.5} fill={grey} />;
          })}

          {series ? series.map((s) => hover != null && (() => { const [x, y] = polar(angle(hover), (clampScore(s.values[hover]) / 100) * R); const dot = compact ? 3.5 * Math.max(1, k * 0.7) : 3.5; return <circle key={s.id} cx={x} cy={y} r={dot * 1.4} fill={s.color} stroke={ds.surface.general.card} strokeWidth={line(1.5)} style={{ pointerEvents: "none" }} />; })()) : points.map(([x, y], i) => {
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
            const lines = wrap(it.label, fit.wrapAt);
            const lh = fit.line;
            const top = Math.abs(side) < 0.2 && Math.cos(angle(i)) > 0; // the top label sits above its spoke
            const y0 = (top ? y - (lines.length - 1) * lh : Math.abs(side) < 0.2 ? y + 4 : y - ((lines.length - 1) * lh) / 2);
            return (
              <text key={i} data-part="label" textAnchor={anchor} dominantBaseline="middle" fontSize={fit.text} fontFamily={font} fill={ds.text.secondary} fontWeight={hover === i ? 700 : 400} style={{ pointerEvents: "none" }}>
                {lines.map((ln, k2) => <tspan key={k2} x={x} y={y0 + k2 * lh}>{ln}</tspan>)}
              </text>
            );
          })}
        </svg>

        {!compact && hovered && (
          <TipBox
            content={radarTip(hovered, series, hover, b)}
            style={{ position: "absolute", left: `${(hx / W) * 100}%`, top: `${(hy / H) * 100}%`, width: 240, zIndex: 2, transform: `translate(${hx < 130 ? "-12%" : hx > W - 130 ? "-88%" : "-50%"}, ${below ? "18px" : "calc(-100% - 18px)"})` }}
          />
        )}
      </div>

      {compact && (
        <>
          {hovered && keyHover == null && (series ? <TipBox flat data-part="detail" content={radarTip(hovered, series, hover)} /> : <DetailCard row={{ ...hovered }} refName={hovered.prevLabel} />)}
          <NumberedList rows={series ? items.map((it, i) => ({ ...it, series: series.map((s) => ({ color: s.color, value: s.values[i] })) })) : items} active={hover} onPick={setHover} hoverable onHover={setKeyHover} />
        </>
      )}
    </div>
    </div>
  );
}

/* Every series at one spoke: the spoke name, then a row per series with its colour, name and score. */
/* The tooltip's content (the standard tooltip, widgets/ChartTip.jsx): one spoke's score, or every series' at that spoke. */
function radarTip(hovered, series, i, b) {
  if (series) return { head: hovered.label, rows: series.map((s) => ({ label: s.label, value: s.values[i], score: true, color: s.color })) };
  return {
    rows: [{ label: hovered.label, value: hovered.value, delta: hovered.delta, score: true, color: b?.c }],
    note: hovered.prevLabel ? <>{hovered.prevLabel}: <b>{hovered.prev}</b> → now <b>{hovered.value}</b></> : null,
    body: hovered.blurb,
  };
}
