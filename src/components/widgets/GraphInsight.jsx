import { useRef } from "react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace } from "../../lib/ds.js";
import { TrendPill } from "./primitives.jsx";
import { useElementWidth } from "../scope/stories/storyWidth.js";

/* ================================================================== */
/* GRAPH INSIGHT WIDGET — change over time (specification board         */
/* 984qJvMt7fCHASYHRwgrab 9158:28146; docs/widget-insight-rules.md).    */
/*                                                                      */
/* The graph is the insight. One measure over one unit of time, left to */
/* right. Scale is fixed 0 to 100 (never dynamic), 28px between ticks:  */
/*   1x1  ticks 0, 50, 100, 2 to 3 points, one line, change pill        */
/*   2x2  ticks 0, 20 … 100, 2 to 7 points, up to 3 lines (the same      */
/*        measure for different groups), pill, optional benchmark line,  */
/*        and an evidence sentence (max 2 lines, 14px, 1.4)              */
/* More than 3 points or more than one line at 1x1 grows to 2x2; more    */
/* than 7 points or 3 lines gives way to the detailed view (`graphFit`).  */
/* Line: 1px, accent, straight joins, round caps. Markers: 8px circles,   */
/* same fill, 1px white border. First and last points sit 8px in from     */
/* the edges, equally spaced. Gridlines 1px full width, no vertical ones. */
/* Tick labels 11px Regular text/quaternary 6px off the line; x labels    */
/* 11px Medium text/quaternary, 10px under the graph.                     */
/* ================================================================== */
export const GRAPH_LIMITS = { "1x1": { points: 3, lines: 1 }, "2x2": { points: 7, lines: 3 } };

/* Which size a graph with this many points and lines must be: "1x1", "2x2", or "detail" (the modal). */
export function graphFit(points, lines = 1, wanted = "1x1") {
  if (points > GRAPH_LIMITS["2x2"].points || lines > GRAPH_LIMITS["2x2"].lines) return "detail";
  if (wanted === "2x2" || points > GRAPH_LIMITS["1x1"].points || lines > GRAPH_LIMITS["1x1"].lines) return "2x2";
  return "1x1";
}

const INTERVAL = 28;
const PAD_TOP = 8, X_LABEL_GAP = 10, X_LABEL_H = 14, EDGE = 8, TICK_W = 24;
const LINE_COLOURS = [ds.text.accent, ds.graph.hotPink, ds.graph.goldenYellow];

/* series: [{ label?, points: number[] }] (one for 1x1). labels: x labels, one per point.
   benchmark: { value, label?, positive? } (2x2 only, at most one). */
export function GraphLine({ series, labels, size = "1x1", benchmark }) {
  const ref = useRef(null);
  const w = useElementWidth(ref, size === "1x1" ? 100 : 280);
  const big = size === "2x2";
  const ticks = big ? [100, 80, 60, 40, 20, 0] : [100, 50, 0];
  const plotH = (ticks.length - 1) * INTERVAL;
  const maxPts = GRAPH_LIMITS[size].points;
  const lines = series.slice(0, GRAPH_LIMITS[size].lines).map((s) => ({ ...s, points: s.points.slice(-maxPts) }));
  const n = lines[0].points.length;
  const xs = labels.slice(-n);
  const plotW = Math.max(40, w - TICK_W - 6);
  const x = (i) => (n === 1 ? plotW / 2 : EDGE + (i * (plotW - 2 * EDGE)) / (n - 1));
  const y = (v) => PAD_TOP + (1 - Math.max(0, Math.min(100, v)) / 100) * plotH;
  const H = PAD_TOP + plotH + X_LABEL_GAP + X_LABEL_H;
  const bColour = benchmark ? (benchmark.positive === false ? ds.status.error.graph : ds.status.success.graph) : null;
  return (
    <div ref={ref} data-part="graph" style={{ display: "flex", width: "100%", fontFamily: font }}>
      <div aria-hidden="true" style={{ width: TICK_W, flexShrink: 0, position: "relative", height: H }}>
        {ticks.map((t) => <span key={t} style={{ position: "absolute", right: 0, top: y(t), transform: "translateY(-50%)", ...dsText("Text 2xs"), fontSize: 11, lineHeight: 1, color: ds.text.quaternary }}>{t}</span>)}
      </div>
      <svg width={plotW} height={H} viewBox={`0 0 ${plotW} ${H}`} style={{ display: "block", marginLeft: 6, overflow: "visible" }} role="img" aria-label={`${lines.map((l) => `${l.label ? `${l.label}: ` : ""}${l.points.map((p, i) => `${xs[i]} ${p}`).join(", ")}`).join(". ")}`}>
        {ticks.map((t) => <line key={t} x1="0" x2={plotW} y1={y(t)} y2={y(t)} stroke={ds.border.tertiary} strokeWidth="1" />)}
        {benchmark && (
          <g>
            <line x1="0" x2={plotW} y1={y(benchmark.value)} y2={y(benchmark.value)} stroke={bColour} strokeWidth="2" strokeDasharray="6 3" opacity="0.55" />
            <text x="0" y={y(benchmark.value) - 6} fontSize="10" fontFamily={font} fill={bColour}>{benchmark.label ?? benchmark.value}</text>
          </g>
        )}
        {lines.map((l, li) => {
          const c = LINE_COLOURS[li];
          return (
            <g key={li}>
              <polyline points={l.points.map((p, i) => `${x(i)},${y(p)}`).join(" ")} fill="none" stroke={c} strokeWidth="1" strokeLinejoin="miter" strokeLinecap="round" />
              {l.points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p)} r="4" fill={c} stroke="#fff" strokeWidth="1"><title>{`${l.label ? `${l.label}, ` : ""}${xs[i]}: ${p}`}</title></circle>)}
            </g>
          );
        })}
        {xs.map((l, i) => <text key={i} x={x(i)} y={PAD_TOP + plotH + X_LABEL_GAP + 11} textAnchor="middle" fontSize="11" fontWeight="500" fontFamily={font} fill={ds.text.quaternary}>{l}</text>)}
      </svg>
    </div>
  );
}

/* The whole widget body: change pill, the graph, and (2x2) an evidence sentence and a legend for several lines. */
export default function GraphInsight({ series, labels, size = "1x1", delta, benchmark, evidence }) {
  const big = size === "2x2";
  const several = series.length > 1;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: big ? dsSpace[12] : dsSpace[8], minHeight: 0 }}>
      {delta != null && <div style={{ display: "flex", justifyContent: big ? "center" : "flex-end" }}><TrendPill delta={delta} compact={!big} /></div>}
      <GraphLine series={series} labels={labels} size={size} benchmark={big ? benchmark : null} />
      {big && several && (
        <div style={{ display: "flex", gap: dsSpace[12], flexWrap: "wrap" }}>
          {series.slice(0, 3).map((s, i) => (
            <span key={s.label} style={{ display: "flex", alignItems: "center", gap: dsSpace[6], ...dsText("Text 2xs"), fontSize: 11, lineHeight: "12px", color: ds.text.tertiary }}>
              <span aria-hidden="true" style={{ width: 2, height: 12, background: LINE_COLOURS[i] }} />{s.label}
            </span>
          ))}
        </div>
      )}
      {big && evidence && <p style={{ margin: "auto 0 0", paddingTop: dsSpace[4], fontSize: 14, lineHeight: 1.4, color: ds.text.secondary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{evidence}</p>}
    </div>
  );
}
