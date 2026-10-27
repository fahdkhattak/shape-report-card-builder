import { TipBox } from "../../widgets/ChartTip.jsx";
import { useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace } from "../../../lib/ds.js";
import { statusName } from "../../../lib/bands.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { useStoryWidth } from "./storyWidth.js";

/* ================================================================== */
/* COMPACT PARTS: shared by the Breakdown charts when their card is      */
/* narrow (see storyWidth.js). A chart can't fit its names around it at   */
/* phone width, so the chart carries small numbered marks and a key       */
/* below lists the names, scores and changes. Tapping a mark or a row      */
/* selects it, and a detail card says what hovering says on a wide card.   */
/* ================================================================== */

/* A small numbered circle. `size` is in px; `active` fills it. */
export function NumberBadge({ n, active, size = 20, style }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size, flexShrink: 0, boxSizing: "border-box", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${active ? ds.text.primary : ds.border.secondary}`, background: active ? ds.text.primary : ds.bg.primary, color: active ? ds.surface.general.card : ds.text.secondary, ...dsText("Text 3xs"), fontWeight: 600, fontVariantNumeric: "tabular-nums", ...style }}>{n}</span>
  );
}

/* The key under a chart: one tappable row per item. rows: [{ label, value, delta }]. With `hoverable`, pointing at a
   name with a mouse calls `onHover(i)` so the chart lights that point up as if the chart itself were hovered.
   To keep the Story short it is a grid (as many columns of at least 220px as fit) and, on a narrow card, shows the first
   six until someone asks for all. A selected row beyond the first six opens the list. */
const KEY_FIRST = 6;
export function NumberedList({ rows, active, onPick, hoverable = false, onHover }) {
  const { compact } = useStoryWidth();
  const [all, setAll] = useState(false);
  const cut = compact && rows.length > KEY_FIRST + 2;
  const open = !cut || all || (active != null && active >= KEY_FIRST);
  const shown = open ? rows : rows.slice(0, KEY_FIRST);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}>
      <ul data-part="key" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", columnGap: dsSpace[16], fontFamily: font }}>
        {shown.map((r, i) => {
          const b = dsBand(r.value);
          const on = active === i;
          return (
            <li key={`${i}-${r.label}`}>
              <button type="button" aria-pressed={on} onClick={() => onPick(on ? null : i)} onPointerEnter={hoverable ? (e) => e.pointerType === "mouse" && onHover?.(i) : undefined} onPointerLeave={hoverable ? (e) => e.pointerType === "mouse" && onHover?.(null) : undefined} style={{ width: "100%", minHeight: compact ? 40 : 32, display: "flex", alignItems: "center", gap: dsSpace[8], textAlign: "left", border: "none", cursor: "pointer", fontFamily: font, padding: `${dsSpace[4]}px ${dsSpace[8]}px`, borderRadius: dsRadius.md, background: on ? ds.interactive.ghostHover : "transparent", color: ds.text.secondary }}>
                <NumberBadge n={i + 1} active={on} size={compact ? 20 : 18} />
                <span style={{ flex: 1, minWidth: 0, ...dsText("Text xs"), fontWeight: on ? 600 : 400, color: ds.text.secondary }}>{r.label}</span>
                {r.series ? (
                  // Comparison: one score per series, each after a dot in its series colour.
                  <span style={{ display: "inline-flex", gap: dsSpace[8], flexShrink: 0 }}>
                    {r.series.map((s, si) => <span key={si} style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[4], ...dsText("Text xs", 700), color: dsBand(s.value).cs, fontVariantNumeric: "tabular-nums" }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />{s.value}</span>)}
                  </span>
                ) : (
                  <>
                    {r.delta != null && r.delta !== 0 && <TrendPill delta={r.delta} numberOnly />}
                    <span style={{ ...dsText("Text sm", 700), color: b.cs, minWidth: 22, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {cut && !open && <button type="button" onClick={() => setAll(true)} style={{ alignSelf: "flex-start", border: "none", background: "transparent", cursor: "pointer", padding: `${dsSpace[4]}px ${dsSpace[8]}px`, fontFamily: font, ...dsText("Text xs", 600), color: ds.text.secondary, textDecoration: "underline" }}>Show all {rows.length} names</button>}
      {cut && open && all && <button type="button" onClick={() => setAll(false)} style={{ alignSelf: "flex-start", border: "none", background: "transparent", cursor: "pointer", padding: `${dsSpace[4]}px ${dsSpace[8]}px`, fontFamily: font, ...dsText("Text xs", 600), color: ds.text.secondary, textDecoration: "underline" }}>Show fewer</button>}
    </div>
  );
}

/* What the tooltip says on a wide card, shown in the page when something is selected. */
export function DetailCard({ row, refName, scoreLabel }) {
  if (!row) return null;
  const b = dsBand(row.value);
  // The standard tooltip (widgets/ChartTip.jsx), laid flat in the page.
  return (
    <TipBox flat data-part="detail" content={{
      rows: [{ label: row.label, value: row.value, delta: row.delta, score: true }],
      note: <>{scoreLabel ? `${scoreLabel}: ` : ""}<b style={{ color: b.cs }}>{statusName(row.value)}</b>{row.prev != null && refName ? <> · {refName}: <b>{row.prev}</b> → now <b>{row.value}</b></> : null}</>,
      body: row.blurb,
    }} />
  );
}
