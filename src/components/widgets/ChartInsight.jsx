import { useRef } from "react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace } from "../../lib/ds.js";
import { useElementWidth } from "../scope/stories/storyWidth.js";
import DonutChart, { segmentColor } from "../scope/stories/DonutChart.jsx";
import { MoreLine } from "./widgetParts.jsx";

/* ================================================================== */
/* CHART INSIGHT WIDGET — relationships across categories              */
/* (specification board 984qJvMt7fCHASYHRwgrab 9158:22652;             */
/* docs/widget-insight-rules.md). One primary type per widget:          */
/*   Composition — parts of a whole (donut, compact grid, treemap)     */
/*   Comparison  — categories side by side (horizontal / vertical bars) */
/* A single snapshot, at least 2 categories, one unit, no winner         */
/* styling. Each structure has limits per size; past them the widget     */
/* grows (1x1 → 2x2) or gives way to the detailed view (`chartFit`).     */
/* ================================================================== */
const LIMITS = {
  hbars: { "1x1": 5, "2x2": 13, "2x2e": 9 },
  vbars: { "1x1": 4, "2x2": 10 },
  grid: { "1x1": 4, "2x2": 18 },
  donut: { "1x1": 7, "1x1legend": 4, "2x2": 15 },
  treemap: { "1x1": 3, "2x2": 7 },
};
export const chartLimit = (kind, size, opts = {}) => LIMITS[kind][size === "2x2" && opts.evidence && LIMITS[kind]["2x2e"] ? "2x2e" : size === "1x1" && opts.legend && LIMITS[kind]["1x1legend"] ? "1x1legend" : size];

/* The size a chart of `kind` with `n` categories needs: the wanted size, grown to 2x2 if it does not fit, or "detail" (the modal). */
export function chartFit(kind, n, wanted = "1x1", opts = {}) {
  if (n < 2) return "none";
  if (wanted === "1x1" && n <= chartLimit(kind, "1x1", opts)) return "1x1";
  if (n <= chartLimit(kind, "2x2", opts)) return "2x2";
  return "detail";
}

const quiet = { ...dsText("Text 2xs"), fontSize: 11, lineHeight: "12px" };
const abbreviate = (v) => {
  const a = Math.abs(v);
  const s = a >= 1e6 ? `${+(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${+(a / 1e3).toFixed(1)}K` : `${Math.round(a * 10) / 10}`;
  return v < 0 ? `-${s}` : s;
};

/* ---- Horizontal bars (Comparison) ----------------------------------------------------------------------------------
   rows: [{ label, value, color }]. Category column 50 to 100px (never over 45% of the chart), the same for every row,
   labels truncate; bars 8px with round ends, 12px apart, min length 2; optional bold value labels (max 4 characters,
   abbreviated) in a fixed area (48px at 1x1, 64px at 2x2); a fixed scale (0 to 100 unless `domain`) with dashed
   gridlines every 25 (1x1) or 20 (2x2), only the ends labelled. Rows past the limit say so ("N more"). */
export function HBars({ rows, size = "1x1", values = size === "2x2", domain = [0, 100], evidence = false, noun = "categories" }) {
  const ref = useRef(null);
  const W = useElementWidth(ref, size === "1x1" ? 132 : 312);
  const limit = chartLimit("hbars", size, { evidence });
  const shown = rows.slice(0, limit);
  const more = rows.length - shown.length;
  const [lo, hi] = domain;
  const longest = Math.max(...shown.map((r) => r.label.length));
  const col = Math.round(Math.min(100, Math.max(50, longest * 6.2), W * 0.45));
  const valueW = values ? (size === "1x1" ? 48 : 64) : 0;
  const plotW = Math.max(30, W - col - 8 - valueW);
  const divisions = size === "1x1" ? 4 : 5;
  const pos = (v) => ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * plotW;
  const PITCH = 20, rowsH = shown.length * PITCH - 12;
  return (
    <div ref={ref} data-part="hbars" style={{ width: "100%", fontFamily: font, display: "flex", flexDirection: "column", gap: dsSpace[6] }}>
      <div style={{ display: "flex" }}>
        <div style={{ width: col, flexShrink: 0, paddingTop: 0 }}>
          {shown.map((r) => <div key={r.label} title={r.label} style={{ height: 8, marginBottom: 12, display: "flex", alignItems: "center", ...quiet, color: ds.text.tertiary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 6, boxSizing: "border-box" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span></div>)}
        </div>
        <div style={{ position: "relative", width: plotW + 8 + valueW, height: rowsH }}>
          {Array.from({ length: divisions + 1 }, (_, i) => (
            <span key={i} aria-hidden="true" style={{ position: "absolute", top: -4, bottom: -4, left: 8 + (i * plotW) / divisions, borderLeft: i === 0 ? `1px solid ${ds.border.primary}` : `1px dashed ${ds.border.tertiary}` }} />
          ))}
          {shown.map((r, i) => {
            const len = Math.max(2, pos(r.value));
            return (
              <div key={r.label} title={`${r.label}: ${r.value}`} style={{ position: "absolute", left: 8, top: i * PITCH, height: 8, width: len, background: r.color, borderRadius: 4 }}>
                {values && <span style={{ position: "absolute", left: "100%", marginLeft: 6, top: "50%", transform: "translateY(-50%)", ...quiet, fontWeight: 700, color: r.color, whiteSpace: "nowrap" }}>{abbreviate(r.value)}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", ...quiet, color: ds.text.quaternary, fontSize: 10, paddingLeft: col + 8 - 3, width: col + 8 + plotW + 6, boxSizing: "border-box", justifyContent: "space-between" }}>
        <span>{lo}</span><span>{hi}</span>
      </div>
      {more > 0 && <MoreLine>{more} more {noun}</MoreLine>}
    </div>
  );
}

/* ---- Vertical bars (Comparison) -------------------------------------------------------------------------------------
   rows: [{ label, value, color }] in a declared order (the caller's). Y axis 24px, 8px to the bars, dashed gridlines;
   bars 8px wide, top corners rounded, min height 2, a common zero baseline, equal slots. The scale is 0 to 100 for
   percentages, else 0 up to a rounded-up maximum. 1x1: 2 to 4 categories, 2x2: 5 to 10. */
export function VBars({ rows, size = "2x2", domain, height }) {
  const ref = useRef(null);
  const W = useElementWidth(ref, size === "1x1" ? 132 : 312);
  const shown = rows.slice(0, chartLimit("vbars", size));
  const max = domain ? domain[1] : (() => { const m = Math.max(...shown.map((r) => r.value), 1); const step = m <= 10 ? 2 : m <= 50 ? 10 : m <= 200 ? 50 : 100; return Math.ceil(m / step) * step; })();
  const ticks = size === "1x1" ? [0, 0.5, 1] : [0, 0.2, 0.4, 0.6, 0.8, 1];
  const plotH = height || (size === "1x1" ? 56 : 140);
  const plotW = Math.max(40, W - 24 - 8);
  const slot = plotW / shown.length;
  return (
    <div ref={ref} data-part="vbars" style={{ width: "100%", fontFamily: font }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div aria-hidden="true" style={{ width: 24, flexShrink: 0, position: "relative", height: plotH, marginTop: 0 }}>
          {ticks.map((t) => <span key={t} style={{ position: "absolute", right: 0, top: (1 - t) * plotH, transform: "translateY(-50%)", ...quiet, fontSize: 10, color: ds.text.quaternary }}>{abbreviate(Math.round(t * max))}</span>)}
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <div style={{ position: "relative", height: plotH }}>
            {ticks.map((t) => <span key={t} aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: (1 - t) * plotH, borderTop: t === 0 ? `1px solid ${ds.border.primary}` : `1px dashed ${ds.border.tertiary}` }} />)}
            {shown.map((r, i) => {
              const h = Math.max(2, (Math.min(r.value, max) / max) * plotH);
              return <span key={r.label} title={`${r.label}: ${r.value}`} style={{ position: "absolute", bottom: 0, left: i * slot + slot / 2 - 4, width: 8, height: h, background: r.color, borderRadius: "4px 4px 0 0" }} />;
            })}
          </div>
          <div style={{ position: "relative", height: 14, marginTop: 8 }}>
            {shown.map((r, i) => <span key={r.label} style={{ position: "absolute", left: i * slot, width: slot, textAlign: "center", ...quiet, fontWeight: 500, color: ds.text.quaternary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Compact grid (Composition tiles) ---------------------------------------------------------------------------------
   rows: [{ label, value, color }]. Two columns (three in a dense 2x2), 6px gutter, tiles 40px tall with a 2px rail in the
   category colour, label 11px regular, value 16px bold below it, then an 8px segmented proportion bar. 1x1: up to 4,
   2x2: up to 18 (12 in two columns, 18 in three). */
export function TileGrid({ rows, size = "1x1", format = (v) => v }) {
  const shown = rows.slice(0, chartLimit("grid", size));
  const cols = size === "2x2" && shown.length > 12 ? 3 : 2;
  const total = shown.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <div data-part="tile-grid" style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], flex: 1, justifyContent: size === "1x1" ? "space-between" : "flex-start", fontFamily: font }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 6 }}>
        {shown.map((r) => (
          <div key={r.label} title={`${r.label}: ${r.value}`} style={{ minHeight: 40, boxSizing: "border-box", background: ds.bg.primary, borderLeft: `2px solid ${r.color}`, padding: "0 0 0 6px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, overflow: "hidden", minWidth: 0 }}>
            <span style={{ ...quiet, color: ds.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
            <span style={{ fontSize: 16, lineHeight: "20px", fontWeight: 700, color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{format(r.value)}</span>
          </div>
        ))}
      </div>
      <div role="img" aria-label={shown.map((r) => `${r.label} ${Math.round((r.value / total) * 100)}%`).join(", ")} style={{ display: "flex", gap: 1, height: 8, borderRadius: 9999, overflow: "hidden", marginTop: size === "2x2" ? "auto" : 0 }}>
        {shown.map((r) => <span key={r.label} style={{ flex: r.value, background: r.color }} />)}
      </div>
    </div>
  );
}

/* ---- Donut composition (Composition) -----------------------------------------------------------------------------------
   rows: groupRows() output ({ group, n, pct }). The ring starts at 12 o'clock; slices sum to 100% and carry no emphasis.
   1x1: a bare ring with either a two-column legend (up to 4) or the Largest Group callout (up to 7). 2x2: a 180px ring with
   the axis icon and name inside, then the Largest Group callout and, when it fits, a three-column legend (up to 15). */
const rail = (c) => <span aria-hidden="true" style={{ width: 2, height: 12, background: c, flexShrink: 0 }} />;
export function DonutInsight({ axisKey, label, rows, size = "1x1", legend = true }) {
  const n = rows.length;
  const largest = rows.reduce((a, r) => (r.n > a.n ? r : a), rows[0]);
  const callout = (
    <div style={{ display: "flex", flexDirection: "column", ...quiet, color: ds.text.tertiary }}>
      <span>Largest Group</span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{largest.group} ({largest.pct}%)</span>
    </div>
  );
  const Legend = ({ cols, max }) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: 8, rowGap: 2 }}>
      {rows.slice(0, max).map((r, i) => <span key={r.group} title={r.group} style={{ display: "flex", alignItems: "center", gap: 4, ...quiet, color: ds.text.tertiary, minWidth: 0 }}>{rail(segmentColor(axisKey, i))}<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.group}</span></span>)}
    </div>
  );
  if (size === "1x1") {
    const withLegend = legend && n <= chartLimit("donut", "1x1", { legend: true });
    return (
      <div data-part="donut-1x1" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <DonutChart axisKey={axisKey} label={label} rows={rows} size={75} bare />
        <div style={{ alignSelf: "stretch" }}>{withLegend ? <Legend cols={2} max={4} /> : callout}</div>
      </div>
    );
  }
  const legendRows = Math.ceil(Math.min(n, 15) / 3);
  const ring = n > 9 ? 150 : 170;
  return (
    <div data-part="donut-2x2" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minHeight: 0 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}><DonutChart axisKey={axisKey} label={label} rows={rows} size={ring} /></div>
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 6 }}>
        {callout}
        {legend && n >= 3 && legendRows <= 5 && <Legend cols={3} max={15} />}
      </div>
    </div>
  );
}

