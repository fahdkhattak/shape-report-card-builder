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

/* The key under a chart: one tappable row per item. rows: [{ label, value, delta }].
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
              <button type="button" aria-pressed={on} onClick={() => onPick(on ? null : i)} onPointerEnter={hoverable ? () => onHover?.(i) : undefined} onPointerLeave={hoverable ? () => onHover?.(null) : undefined} style={{ width: "100%", minHeight: compact ? 40 : 32, display: "flex", alignItems: "center", gap: dsSpace[8], textAlign: "left", border: "none", cursor: "pointer", fontFamily: font, padding: `${dsSpace[4]}px ${dsSpace[8]}px`, borderRadius: dsRadius.md, background: on ? ds.interactive.ghostHover : "transparent", color: ds.text.secondary }}>
                <NumberBadge n={i + 1} active={on} size={compact ? 20 : 18} />
                <span style={{ flex: 1, minWidth: 0, ...dsText("Text xs"), fontWeight: on ? 600 : 400, color: ds.text.secondary }}>{r.label}</span>
                {r.delta != null && r.delta !== 0 && <TrendPill delta={r.delta} numberOnly />}
                <span style={{ ...dsText("Text sm", 700), color: b.cs, minWidth: 22, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
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
  return (
    <div data-part="detail" role="status" style={{ background: ds.surface.general.tooltip, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, display: "flex", flexDirection: "column", gap: dsSpace[8], fontFamily: font }}>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], borderLeft: `2px solid ${b.c}`, padding: `${dsSpace[2]}px 0 ${dsSpace[2]}px ${dsSpace[6]}px` }}>
        <span style={{ flex: 1, minWidth: 0, ...dsText("Text xs", 600), color: ds.text.primary }}>{row.label}</span>
        {row.delta != null && row.delta !== 0 && <TrendPill delta={row.delta} numberOnly />}
        <span style={{ ...dsText("Text md", 700), color: b.cs }}>{row.value}</span>
      </div>
      <p style={{ margin: 0, ...dsText("Text 2xs"), color: ds.text.secondary }}>{scoreLabel ? `${scoreLabel}: ` : ""}<b style={{ color: b.cs }}>{statusName(row.value)}</b>{row.prev != null && refName ? <> · {refName}: <b>{row.prev}</b> → now <b>{row.value}</b></> : null}</p>
      {row.blurb && <p style={{ margin: 0, ...dsText("Text xs"), color: ds.text.primary }}>{row.blurb}</p>}
    </div>
  );
}
