import { useRef } from "react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace } from "../../lib/ds.js";
import { useElementWidth } from "../scope/stories/storyWidth.js";
import DonutChart, { segmentColor } from "../scope/stories/DonutChart.jsx";
import { MoreLine } from "./widgetParts.jsx";
import { chartLimit } from "../../lib/insightRules.js";
import { useChartTip } from "./ChartTip.jsx";

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
/* Limits per structure and size live in lib/insightRules.js (shared with the Widget Builder's sizing). */
export { chartLimit, chartFit } from "../../lib/insightRules.js";

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
export function HBars({ rows, size = "1x1", values = size === "2x2", domain = [0, 100], evidence = false, noun = "categories", score = true, head }) {
  const ref = useRef(null);
  // Hover (or the label beside it): a tooltip with the full name, the value and any change; the other bars dim.
  const tip = useChartTip();
  const on = tip.active?.i;
  const hb = (r, i) => tip.bind({ i, head, rows: [{ label: r.label, value: r.value, text: r.text, color: r.color, delta: r.delta, score }] });
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
          {shown.map((r, i) => <div key={r.label} {...hb(r, i)} style={{ opacity: on != null && on !== i ? 0.4 : 1, transition: "opacity 120ms ease", cursor: "default", height: 8, marginBottom: 12, display: "flex", alignItems: "center", ...quiet, color: ds.text.tertiary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 6, boxSizing: "border-box" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span></div>)}
        </div>
        <div style={{ position: "relative", width: plotW + 8 + valueW, height: rowsH }}>
          {Array.from({ length: divisions + 1 }, (_, i) => (
            <span key={i} aria-hidden="true" style={{ position: "absolute", top: -4, bottom: -4, left: 8 + (i * plotW) / divisions, borderLeft: i === 0 ? `1px solid ${ds.border.primary}` : `1px dashed ${ds.border.tertiary}` }} />
          ))}
          {shown.map((r, i) => {
            const len = Math.max(2, pos(r.value));
            return (
              <div key={r.label} style={{ position: "absolute", left: 8, top: i * PITCH, height: 8, width: len, background: r.color, borderRadius: 4, opacity: on != null && on !== i ? 0.4 : 1, transition: "opacity 120ms ease", pointerEvents: "none" }}>
                {values && <span style={{ position: "absolute", left: "100%", marginLeft: 6, top: "50%", transform: "translateY(-50%)", ...quiet, fontWeight: 700, color: r.color, whiteSpace: "nowrap" }}>{abbreviate(r.value)}</span>}
              </div>
            );
          })}
          {/* hover rows: the full row height (20px), not just the 8px bar */}
          {shown.map((r, i) => <div key={`hit-${i}`} {...hb(r, i)} style={{ position: "absolute", left: 0, right: 0, top: i * PITCH - 6, height: PITCH }} />)}
        </div>
      </div>
      {tip.node}
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
export function VBars({ rows, size = "2x2", domain, height, score = false, head, text }) {
  const ref = useRef(null);
  const tip = useChartTip();
  const on = tip.active?.i;
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
              return <span key={r.label} style={{ position: "absolute", bottom: 0, left: i * slot + slot / 2 - 4, width: 8, height: h, background: r.color, borderRadius: "4px 4px 0 0", opacity: on != null && on !== i ? 0.4 : 1, transition: "opacity 120ms ease", pointerEvents: "none" }} />;
            })}
            {/* hover columns: the whole slot, top to bottom */}
            {shown.map((r, i) => <span key={`hit-${i}`} {...tip.bind({ i, head, rows: [{ label: r.tipLabel || r.label, value: r.value, text: text ? text(r) : r.text, color: r.color, score }] })} style={{ position: "absolute", top: 0, bottom: 0, left: i * slot, width: slot }} />)}
          </div>
          <div style={{ position: "relative", height: 14, marginTop: 8 }}>
            {shown.map((r, i) => <span key={r.label} style={{ position: "absolute", left: i * slot, width: slot, textAlign: "center", ...quiet, fontWeight: on === i ? 700 : 500, color: on === i ? ds.text.primary : ds.text.quaternary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>)}
          </div>
        </div>
      </div>
      {tip.node}
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
  const tip = useChartTip();
  const on = tip.active?.i;
  const tb = (r, i) => tip.bind({ i, rows: [{ label: r.label, value: r.value, text: format(r.value), color: r.color }], note: `${Math.round((r.value / total) * 100)}% of the total` });
  return (
    <div data-part="tile-grid" style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], flex: 1, justifyContent: size === "1x1" ? "space-between" : "flex-start", fontFamily: font }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 6 }}>
        {shown.map((r, i) => (
          <div key={r.label} {...tb(r, i)} style={{ opacity: on != null && on !== i ? 0.4 : 1, transition: "opacity 120ms ease", cursor: "default", minHeight: 40, boxSizing: "border-box", background: ds.bg.primary, borderLeft: `2px solid ${r.color}`, padding: "0 0 0 6px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, overflow: "hidden", minWidth: 0 }}>
            <span style={{ ...quiet, color: ds.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
            <span style={{ fontSize: 16, lineHeight: "20px", fontWeight: 700, color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{format(r.value)}</span>
          </div>
        ))}
      </div>
      <div role="img" aria-label={shown.map((r) => `${r.label} ${Math.round((r.value / total) * 100)}%`).join(", ")} style={{ display: "flex", gap: 1, height: 8, borderRadius: 9999, overflow: "hidden", marginTop: size === "2x2" ? "auto" : 0 }}>
        {shown.map((r, i) => <span key={r.label} {...tb(r, i)} style={{ flex: r.value, background: r.color, opacity: on != null && on !== i ? 0.4 : 1, transition: "opacity 120ms ease" }} />)}
      </div>
      {tip.node}
    </div>
  );
}

/* ---- Donut composition (Composition) -----------------------------------------------------------------------------------
   rows: groupRows() output ({ group, n, pct }). The ring starts at 12 o'clock; slices sum to 100% and carry no emphasis.
   Callouts are two lines of 11px text/tertiary: what it is ("Largest Group"), then "Category (Value%)" — the name may
   truncate, the number never does.
   1x1: a bare ring with a two-column legend (up to 4 groups) or the Largest Group callout (up to 7).
   2x2, two variants per the rules: ring + three-column legend (insight + evidence, the default), or, without a legend,
   ring + three callouts (Total / Largest / Smallest Group). A legend that would pass 5 rows (15 groups) falls back to
   the callouts. */
const rail = (c) => <span aria-hidden="true" style={{ width: 2, height: 12, background: c, flexShrink: 0 }} />;
function Callout({ title, name, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...quiet, color: ds.text.tertiary, minWidth: 0 }}>
      <span>{title}</span>
      <span style={{ display: "flex", minWidth: 0, whiteSpace: "nowrap" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
        <span style={{ flexShrink: 0 }}>&nbsp;({value})</span>
      </span>
    </div>
  );
}
export function DonutInsight({ axisKey, label, rows, size = "1x1", legend = true }) {
  const n = rows.length;
  const largest = rows.reduce((a, r) => (r.n > a.n ? r : a), rows[0]);
  const smallest = rows.reduce((a, r) => (r.n < a.n ? r : a), rows[0]);
  const total = rows.reduce((a, r) => a + r.n, 0);
  const largestCallout = <Callout title="Largest Group" name={largest.group} value={`${largest.pct}%`} />;
  const Legend = ({ cols, max }) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: 8, rowGap: 2 }}>
      {rows.slice(0, max).map((r, i) => <span key={r.group} title={`${r.group}: ${r.pct}%`} style={{ display: "flex", alignItems: "center", gap: 4, ...quiet, color: ds.text.tertiary, minWidth: 0 }}>{rail(segmentColor(axisKey, i))}<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.group}</span></span>)}
    </div>
  );
  if (size === "1x1") {
    const withLegend = legend && n <= chartLimit("donut", "1x1", { legend: true });
    return (
      <div data-part="donut-1x1" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 0 }}>
        <DonutChart axisKey={axisKey} label={label} rows={rows} size={75} bare />
        <div style={{ alignSelf: "stretch", minWidth: 0 }}>{withLegend ? <Legend cols={2} max={4} /> : largestCallout}</div>
      </div>
    );
  }
  const withLegend = legend && n <= chartLimit("donut", "2x2");
  const ring = n > 9 ? 150 : 170;
  return (
    <div data-part="donut-2x2" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minHeight: 0 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}><DonutChart axisKey={axisKey} label={label} rows={rows} size={ring} /></div>
      <div style={{ alignSelf: "stretch", minWidth: 0 }}>
        {withLegend ? <Legend cols={3} max={15} /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: 8 }}>
            <Callout title="Total Group" name={`${n} groups`} value={`${total}`} />
            {largestCallout}
            <Callout title="Smallest Group" name={smallest.group} value={`${smallest.pct}%`} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Treemap (Composition) ---------------------------------------------------------------------------------------------
   rows: [{ label, value, color }]. Value-proportional tiles that fill the whole insight section, deterministic: sorted
   largest first, then split into two runs of near-equal total along the box's longer side, and again inside each run, so
   the same data always gives the same layout and no position implies a rank. 4px between tiles. Each tile: the name in
   upper case top-left on one line (an ellipsis, never a broken word), the value bold bottom-left; a tile too small for its name keeps its value, one too small for that
   keeps only its colour (both stay in the tooltip). 1x1: exactly 3 tiles, 2x2: 3 to 7. */
export function splitTiles(items, x, y, w, h, out) {
  if (!items.length) return;
  if (items.length === 1) { out.push({ ...items[0], x, y, w, h }); return; }
  const total = items.reduce((a, r) => a + r.value, 0) || 1;
  let acc = 0, k = 0;
  // the first run takes items until it holds about half the total (always at least one item on each side)
  while (k < items.length - 1 && acc + items[k].value / 2 < total / 2) acc += items[k++].value;
  k = Math.max(1, Math.min(items.length - 1, k));
  const first = items.slice(0, k), second = items.slice(k);
  const share = first.reduce((a, r) => a + r.value, 0) / total;
  if (w >= h) {
    const w1 = w * share;
    splitTiles(first, x, y, w1, h, out); splitTiles(second, x + w1, y, w - w1, h, out);
  } else {
    const h1 = h * share;
    splitTiles(first, x, y, w, h1, out); splitTiles(second, x, y + h1, w, h - h1, out);
  }
}
export function Treemap({ rows, size = "1x1", format = (v) => v }) {
  const ref = useRef(null);
  const W = useElementWidth(ref, size === "1x1" ? 132 : 312);
  const H = size === "1x1" ? 106 : 280;
  const GAP = 4;
  const shown = [...rows].filter((r) => r.value > 0).sort((a, b) => b.value - a.value).slice(0, chartLimit("treemap", size));
  const tiles = [];
  const total = shown.reduce((a, r) => a + r.value, 0) || 1;
  const tip = useChartTip();
  const on = tip.active?.i;
  // lay out in a box GAP bigger, then shrink every tile by GAP, so gaps are exactly 4px and the outer edges line up
  splitTiles(shown, 0, 0, W + GAP, H + GAP, tiles);
  return (
    <div ref={ref} data-part="treemap" style={{ position: "relative", width: "100%", height: H, fontFamily: font }} role="img" aria-label={shown.map((r) => `${r.label} ${format(r.value)}`).join(", ")}>
      {tiles.map((t, i) => {
        const w = Math.max(0, t.w - GAP), h = Math.max(0, t.h - GAP);
        const name = w >= 44 && h >= 36 && t.label, value = w >= 20 && h >= 20;
        return (
          <div key={i} {...tip.bind({ i, rows: [{ label: t.label || "Other", value: t.value, text: format(t.value), color: t.color }], note: `${Math.round((t.value / total) * 100)}% of all responses` })} style={{ opacity: on != null && on !== i ? 0.4 : 1, transition: "opacity 120ms ease", cursor: "default", position: "absolute", left: t.x, top: t.y, width: w, height: h, background: t.color, borderRadius: 8, padding: 6, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", color: ds.text.primary }}>
            {name ? <span style={{ fontSize: 11, lineHeight: "13px", fontWeight: 700, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span> : <span />}
            {value && <span style={{ fontSize: name && h >= 60 ? 20 : 14, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{format(t.value)}</span>}
          </div>
        );
      })}
      {tip.node}
    </div>
  );
}
