import { T, font, radius, band } from "../../../lib/tokens.js";
import { useRounds } from "../../../lib/roundsContext.js";
import { LAST, fmtDate, fmtMonth } from "../../../lib/scopeData.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { useStoryStyle } from "./storyStyle.js";
import { useStoryWidth } from "./storyWidth.js";

/* ================================================================== */
/* HISTORY CARDS — one card per round, newest first, scrolling sideways  */
/* (Figma 984qJvMt7fCHASYHRwgrab, node 13622:37494). Each shows the date, */
/* the score, a "Latest" pill on the newest, and the change since the     */
/* round before. With `onSelect` the cards are a selector: the selected    */
/* card is outlined darker and bold. The oldest round reads "First round".*/
/* ================================================================== */
export function HistoryCards({ values, banded = true, unit = "", sel, onSelect }) {
  const ROUNDS = useRounds();
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
  // Current: one card per round in a row (a snapping sideways strip on a phone). A segmented-strip version was tried
  // and dropped: the product keeps these cards.
  return (
    <div className={compact ? "scroll-minimal" : undefined} style={compact ? { display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory", margin: "0 -16px", padding: "1px 16px 4px", scrollPaddingLeft: 16, fontFamily: font } : { display: "flex", gap: 16, overflowX: "auto", padding: "1px 1px 4px", fontFamily: font }}>
      {idxs.map((i) => {
        const v = values[i];
        const d = i > 0 ? v - values[i - 1] : null;
        const selected = (sel ?? LAST) === i;
        const clickable = !!onSelect;
        return (
          <div
            key={i} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined} aria-pressed={clickable ? selected : undefined}
            onClick={clickable ? () => onSelect(i) : undefined} onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(i)) : undefined}
            style={{ flex: compact ? "0 0 124px" : "0 0 200px", scrollSnapAlign: compact ? "start" : undefined, minWidth: 0, boxSizing: "border-box", border: `1px solid ${selected ? T.gray700 : T.gray100}`, borderRadius: radius.lg, padding: compact ? 12 : 16, display: "flex", flexDirection: "column", gap: compact ? 6 : 10, background: T.white, cursor: clickable ? "pointer" : "default" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 20 }}>
              <span style={{ fontSize: compact ? 12 : 13, fontWeight: selected ? 700 : 400, color: selected ? T.gray900 : T.gray700, whiteSpace: "nowrap" }}>{compact ? fmtMonth(ROUNDS[i].date) : fmtDate(ROUNDS[i].date)}</span>
              {i === LAST && <span style={{ fontSize: 11, color: T.gray700, background: T.gray50, borderRadius: radius.full, padding: "2px 8px" }}>Latest</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 36 }}>
              <span style={{ fontSize: compact ? 26 : 32, fontWeight: 700, lineHeight: compact ? "30px" : "36px", letterSpacing: -0.5, color: banded ? band(v).cs : T.gray900 }}>{v}{unit}</span>
              {d != null && d !== 0 && <TrendPill delta={d} numberOnly />}
            </div>
            <span style={{ fontSize: compact ? 11 : 13, color: T.gray500, whiteSpace: "nowrap", marginTop: compact ? -2 : -6 }}>{d != null ? `since ${compact ? fmtMonth(ROUNDS[i - 1].date) : fmtDate(ROUNDS[i - 1].date)}` : "First round"}</span>
          </div>
        );
      })}
    </div>
  );
}
