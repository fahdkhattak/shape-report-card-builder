import { T, font, radius, band } from "../../../lib/tokens.js";
import { ROUNDS } from "../../../lib/dataset.js";
import { LAST, fmtDate, fmtMonth } from "../../../lib/scopeData.js";
import { ds, dsText, dsRadius, dsShadow } from "../../../lib/ds.js";
import { useStoryStyle } from "./storyStyle.js";
import { useStoryWidth } from "./storyWidth.js";

/* ================================================================== */
/* HISTORY CARDS — one tile per round, newest first (after Figma          */
/* 13622:37494, tidied): a single segmented strip. Each tile shows the     */
/* month, the score and the change since the round before; "· Latest" on */
/* the newest. With `onSelect` the strip is a selector (tabs): the picked  */
/* tile is raised white. The oldest round reads "First round".             */
/* ================================================================== */
export function HistoryCards({ values, banded = true, unit = "", sel, onSelect }) {
  const idxs = ROUNDS.map((_, i) => i).reverse();
  // On a compact card the rounds wrap into a grid (every round visible, no sideways scrolling); wide, the designed row.
  const { compact } = useStoryWidth();
  if (useStoryStyle() === "refined") {
    // Rounds as a row of columns, not a row of cards: date, the score, the change in plain
    // text. The selected round is marked by a bar underneath and a tint, not an outline.
    return (
      <div role={onSelect ? "tablist" : undefined} style={{ display: "flex", gap: 8, overflowX: "auto", fontFamily: font, fontVariantNumeric: "tabular-nums" }}>
        {idxs.map((i) => {
          const v = values[i];
          const d = i > 0 ? v - values[i - 1] : null;
          const selected = (sel ?? LAST) === i;
          const clickable = !!onSelect;
          const Tag = clickable ? "button" : "div";
          return (
            <Tag
              key={i} role={clickable ? "tab" : undefined} aria-selected={clickable ? selected : undefined} onClick={clickable ? () => onSelect(i) : undefined}
              style={{ flex: "0 0 176px", boxSizing: "border-box", textAlign: "left", border: "none", cursor: clickable ? "pointer" : "default", fontFamily: font, padding: "14px 16px 12px", borderRadius: `${radius.md}px ${radius.md}px 0 0`, background: selected ? T.gray25 : "transparent", borderBottom: `2px solid ${selected ? T.gray900 : T.gray75}`, display: "flex", flexDirection: "column", gap: 4, transition: "background 120ms ease" }}
            >
              <span style={{ fontSize: 13, color: T.gray600 }}>{fmtDate(ROUNDS[i].date)}{i === LAST && <span style={{ color: T.gray400 }}> · latest</span>}</span>
              <span style={{ fontSize: 36, fontWeight: 600, lineHeight: "40px", letterSpacing: -0.8, color: banded ? band(v).cs : T.gray900 }}>{v}{unit}</span>
              <span style={{ fontSize: 13, color: d == null ? T.gray500 : d === 0 ? T.gray500 : d > 0 ? T.greenStrong : T.redStrong }}>
                {d == null ? "First round" : d === 0 ? "No change" : `${d > 0 ? "+" : "−"}${Math.abs(d)} since ${fmtDate(ROUNDS[i - 1].date)}`}
              </span>
            </Tag>
          );
        })}
      </div>
    );
  }
  // Current: one segmented strip, not separate cards. Tiles share the width (so three rounds fill a phone card with no
  // scrolling); with more rounds than fit they keep 112px and the strip scrolls sideways, snapping tile by tile. The
  // picked round is a raised white tile; the date, the score in its status colour, and the change since the round before.
  return (
    <div role={onSelect ? "tablist" : undefined} aria-label="Rounds" className="scroll-minimal" style={{ display: "flex", gap: 4, padding: 4, background: ds.bg.secondary, borderRadius: dsRadius.lg + 4, overflowX: "auto", scrollSnapType: "x mandatory", fontFamily: font, fontVariantNumeric: "tabular-nums" }}>
      {idxs.map((i) => {
        const v = values[i];
        const d = i > 0 ? v - values[i - 1] : null;
        const selected = (sel ?? LAST) === i;
        const clickable = !!onSelect;
        const Tag = clickable ? "button" : "div";
        return (
          <Tag
            key={i} type={clickable ? "button" : undefined} role={clickable ? "tab" : undefined} aria-selected={clickable ? selected : undefined} onClick={clickable ? () => onSelect(i) : undefined}
            className={clickable ? "round-tile" : undefined}
            style={{ flex: "1 0 112px", scrollSnapAlign: "start", minWidth: 0, boxSizing: "border-box", textAlign: "left", border: "none", fontFamily: font, cursor: clickable ? "pointer" : "default", padding: compact ? "10px 12px" : "12px 16px", borderRadius: dsRadius.lg, background: selected && clickable ? ds.surface.general.card : "transparent", boxShadow: selected && clickable ? dsShadow("sm") : "none", display: "flex", flexDirection: "column", gap: 2 }}
          >
            <span style={{ ...dsText("Text xs", selected ? 600 : 500), color: selected ? ds.text.secondary : ds.text.tertiary, whiteSpace: "nowrap" }}>
              {fmtMonth(ROUNDS[i].date)}{i === LAST && !compact && <span style={{ color: ds.text.quaternary, fontWeight: 400 }}> · Latest</span>}
            </span>
            <span style={compact ? { display: "flex", flexDirection: "column" } : { display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: compact ? 24 : 28, fontWeight: 700, lineHeight: compact ? "30px" : "34px", letterSpacing: -0.5, color: banded ? band(v).cs : ds.text.primary }}>{v}{unit}</span>
              <span style={{ ...dsText("Text xs", 600), whiteSpace: "nowrap", color: d == null || d === 0 ? ds.text.quaternary : d > 0 ? ds.status.success.textIndicator : ds.status.error.text }}>
                {d == null ? "First round" : d === 0 ? "No change" : `${d > 0 ? "+" : "−"}${Math.abs(d)}`}
              </span>
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
