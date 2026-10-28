import { useRef } from "react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace } from "../../lib/ds.js";
import { TrendPill, Sections, Insight, Evidence, FillBox } from "./primitives.jsx";
import { useElementWidth } from "../scope/stories/storyWidth.js";
import { GRAPH_LIMITS } from "../../lib/insightRules.js";
import { bandKind } from "../../lib/bands.js";
import { useChartTip } from "./ChartTip.jsx";

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
/* Limits (points and lines per size) live in lib/insightRules.js, shared with the Widget Builder's sizing. */
export { GRAPH_LIMITS, graphFit } from "../../lib/insightRules.js";

const INTERVAL = 28;
const PAD_TOP = 8, X_LABEL_GAP = 10, X_LABEL_H = 14, EDGE = 8, TICK_W = 24;
const LINE_COLOURS = [ds.text.accent, ds.graph.hotPink, ds.graph.goldenYellow];

/* series: [{ label?, points: number[] }] (one for 1x1). labels: x labels, one per point.
   benchmark: { value, label?, positive? } (2x2 only, at most one). */
export function GraphLine({ series, labels, size = "1x1", benchmark, height }) {
  const ref = useRef(null);
  const w = useElementWidth(ref, size === "1x1" ? 100 : 280);
  const big = size === "2x2";
  const ticks = big ? [100, 80, 60, 40, 20, 0] : [100, 50, 0];
  // `height` (the whole graph, labels included): the plot stretches to fill it; never tighter than the 28px tick interval.
  const plotH = height ? Math.max((ticks.length - 1) * INTERVAL, height - PAD_TOP - X_LABEL_GAP - X_LABEL_H) : (ticks.length - 1) * INTERVAL;
  const maxPts = GRAPH_LIMITS[size].points;
  const lines = series.slice(0, GRAPH_LIMITS[size].lines).map((s) => ({ ...s, points: s.points.slice(-maxPts) }));
  const n = lines[0].points.length;
  // A 1x1 has about 44px per round: "Nov 25" labels run together, so it shows the month alone ("Nov").
  const xs = labels.slice(-n).map((l) => (size === "1x1" ? String(l).split(" ")[0] : l));
  const plotW = Math.max(40, w - TICK_W - 6);
  const x = (i) => (n === 1 ? plotW / 2 : EDGE + (i * (plotW - 2 * EDGE)) / (n - 1));
  const y = (v) => PAD_TOP + (1 - Math.max(0, Math.min(100, v)) / 100) * plotH;
  const H = PAD_TOP + plotH + X_LABEL_GAP + X_LABEL_H;
  // Hover a round's column (the whole height, not just the 8px marker): that round's score for each line and its
  // change since the round before; the hovered markers grow and a hairline marks the round.
  const tip = useChartTip();
  const on = tip.active?.i;
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
              {l.points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p)} r={on === i ? 5 : 4} fill={c} stroke={ds.surface.general.card} strokeWidth="1" />)}
            </g>
          );
        })}
        {on != null && <line x1={x(on)} x2={x(on)} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={ds.border.strong} strokeWidth="1" strokeDasharray="2 2" pointerEvents="none" />}
        {xs.map((_, i) => {
          const left = i === 0 ? 0 : (x(i - 1) + x(i)) / 2, right = i === n - 1 ? plotW : (x(i) + x(i + 1)) / 2;
          return <rect key={`hit-${i}`} x={left} y="0" width={Math.max(0, right - left)} height={PAD_TOP + plotH + X_LABEL_GAP} fill="transparent" {...tip.bind({ i, head: xs[i], rows: lines.map((l, li) => ({ label: l.label || "Score", value: l.points[i], delta: i > 0 ? l.points[i] - l.points[i - 1] : null, color: LINE_COLOURS[li], score: true })) })} />;
        })}
        {/* The end labels align to the plot's edges (centred on a point 8px in, a month label would run past the widget). */}
        {xs.map((l, i) => { const end = n > 1 && i === n - 1, start = n > 1 && i === 0; return <text key={i} x={end ? plotW : start ? 0 : x(i)} y={PAD_TOP + plotH + X_LABEL_GAP + 11} textAnchor={end ? "end" : start ? "start" : "middle"} fontSize="11" fontWeight="500" fontFamily={font} fill={ds.text.quaternary}>{l}</text>; })}
      </svg>
      {tip.node}
    </div>
  );
}

/* The 2x2 history caption (the design's Score History card): how the score moved, naming rounds as the axis does.
   Text 3xs / Regular (11 / 16) in text/secondary; the round and "latest round" bold in the same grey; the change bold
   in green (up) or red (down) and the latest score bold in its band's status colour. */
export function HistoryCaption({ points, labels, noun = "the score" }) {
  const n = points.length, last = points[n - 1], prev = points[n - 2], d = last - prev;
  const was = labels?.[labels.length - 2] ?? `R${n - 1}`;
  const B = ({ children, c }) => <b style={{ fontWeight: 700, color: c || ds.text.secondary }}>{children}</b>;
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const score = <B c={ds.status[bandKind(last)].text}>{last}</B>;
  if (d > 0) {
    const dipped = n >= 3 && points[n - 2] < points[n - 3];
    return dipped
      ? <>After dipping in <B>{was}</B>, {noun} increased by <B c={ds.status.success.text}>+{d} {d === 1 ? "point" : "points"},</B> reaching {score} in the <B>latest round</B>.</>
      : <>{Noun} increased by <B c={ds.status.success.text}>+{d} {d === 1 ? "point" : "points"}</B> since <B>{was}</B>, reaching {score} in the <B>latest round</B>.</>;
  }
  if (d < 0) return <>{Noun} fell by <B c={ds.status.error.text}>{-d} {d === -1 ? "point" : "points"}</B> since <B>{was}</B>, to {score} in the <B>latest round</B>.</>;
  return <>{Noun} held at {score} since <B>{was}</B>.</>;
}

/* The whole widget body: change pill, the graph, and (2x2) an evidence sentence and a legend for several lines. */
export default function GraphInsight({ series, labels, size = "1x1", delta, benchmark, evidence }) {
  const big = size === "2x2";
  const several = series.length > 1;
  return (
    <Sections size={size}>
    <Insight style={{ gap: big ? dsSpace[12] : 0, justifyContent: big ? "flex-end" : "flex-start" }}>
      {big && delta != null && <div style={{ display: "flex", justifyContent: "center" }}><TrendPill delta={delta} /></div>}
      {/* 1x1 (the design's Score History card): the caret pill has its own row above the plot, at the right, so it never
          sits on the line or a gridline. The header gives way to one line when the card needs the room. */}
      {!big && delta != null && <div data-part="trend-row" style={{ display: "flex", justifyContent: "flex-end" }}><TrendPill delta={delta} compact /></div>}
      {/* 2x2: the pill, 12px, then the graph takes every pixel left (FillBox measures it). */}
      {big ? <FillBox min={(6 - 1) * INTERVAL + PAD_TOP + X_LABEL_GAP + X_LABEL_H}>{(h) => <GraphLine series={series} labels={labels} size={size} benchmark={benchmark} height={h} />}</FillBox>
        : <GraphLine series={series} labels={labels} size={size} />}
      {big && several && (
        <div style={{ display: "flex", gap: dsSpace[12], flexWrap: "wrap" }}>
          {series.slice(0, 3).map((s, i) => (
            <span key={s.label} style={{ display: "flex", alignItems: "center", gap: dsSpace[6], ...dsText("Text 2xs"), fontSize: 11, lineHeight: "12px", color: ds.text.tertiary }}>
              <span aria-hidden="true" style={{ width: 2, height: 12, background: LINE_COLOURS[i] }} />{s.label}
            </span>
          ))}
        </div>
      )}
    </Insight>
    {/* 2x2: the sentence is the Evidence Section (68px, three lines at most), set from its top as the design draws it. */}
    {big && evidence && <Evidence style={{ justifyContent: "flex-start" }}><p data-part="caption" style={{ margin: 0, fontSize: 11, lineHeight: "16px", fontWeight: 400, color: ds.text.secondary, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{evidence}</p></Evidence>}
    </Sections>
  );
}
