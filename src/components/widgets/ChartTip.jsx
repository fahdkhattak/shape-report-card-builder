import { useState } from "react";
import { createPortal } from "react-dom";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsShadow, dsBand } from "../../lib/ds.js";
import { TrendPill } from "./primitives.jsx";

/* ================================================================== */
/* CHART TIP — the hover tooltip for the Graph and Chart widgets.       */
/* Same card as the Index widget's (RingIndex.jsx): tooltip surface,    */
/* an optional small upper-case heading, then one row per value with a  */
/* 2px rail in its colour, the label, an optional change and the value.  */
/* Rendered into document.body at the pointer, so a widget card's        */
/* `overflow: hidden` can never clip it; it opens below the pointer near */
/* the top of the window and stays inside the window sideways.           */
/*                                                                      */
/*   const tip = useChartTip();                                          */
/*   <rect {...tip.bind({ head, rows: [{ label, value, text?, color?, delta?, score? }] })} /> */
/*   {tip.node}                                                          */
/* `score: true` colours the value by its status band (0–100 scores);    */
/* otherwise the value is plain text/primary (counts, money, shares).    */
/* ================================================================== */
export function useChartTip() {
  const [tip, setTip] = useState(null);
  const bind = (content) => ({
    onMouseEnter: (e) => setTip({ x: e.clientX, y: e.clientY, content }),
    onMouseMove: (e) => setTip({ x: e.clientX, y: e.clientY, content }),
    onMouseLeave: () => setTip(null),
  });
  const node = tip && typeof document !== "undefined" ? createPortal(<TipCard {...tip} />, document.body) : null;
  return { bind, node, active: tip?.content ?? null };
}

export function TipCard({ x, y, content }) {
  const below = y < 140;
  const left = Math.max(110, Math.min(x, (window.innerWidth || 1200) - 110));
  return (
    <div
      role="status"
      style={{ position: "fixed", left, top: y, transform: below ? "translate(-50%, 16px)" : "translate(-50%, calc(-100% - 12px))", pointerEvents: "none", zIndex: 1000, minWidth: 150, maxWidth: 220, boxSizing: "border-box", background: ds.surface.general.tooltip, borderRadius: dsRadius.lg, padding: `${dsSpace[8]}px ${dsSpace[12]}px`, boxShadow: dsShadow("sm"), display: "flex", flexDirection: "column", gap: dsSpace[6], fontFamily: font }}
    >
      {content.head && <span style={{ ...dsText("Text 2xs", 600), color: ds.text.tertiary, textTransform: "uppercase" }}>{content.head}</span>}
      {content.rows.map((r, i) => {
        const band = r.score ? dsBand(r.value) : null;
        return (
          <div key={`${r.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: dsSpace[8], borderLeft: `2px solid ${r.color || band?.c || ds.border.strong}`, padding: `${dsSpace[2]}px 0 ${dsSpace[2]}px ${dsSpace[6]}px` }}>
            <span style={{ flex: 1, minWidth: 0, ...dsText("Text xs", 600), color: ds.text.primary }}>{r.label}</span>
            {r.delta != null && r.delta !== 0 && <TrendPill delta={r.delta} numberOnly />}
            <span style={{ ...dsText("Text md", 700), color: band ? band.cs : ds.text.primary, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.text ?? r.value}</span>
          </div>
        );
      })}
      {content.note && <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{content.note}</span>}
    </div>
  );
}
