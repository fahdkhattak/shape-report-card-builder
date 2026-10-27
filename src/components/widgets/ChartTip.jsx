import { useState } from "react";
import { createPortal } from "react-dom";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsShadow, dsBand, dsBorder } from "../../lib/ds.js";
import { TrendPill } from "./primitives.jsx";

/* ================================================================== */
/* THE TOOLTIP — one standard for every chart in the product (widgets,  */
/* Stories, full-view Scopes), from the Figma Story tooltips (the radar  */
/* 13622:35947, the comparison area 13622:39305):                        */
/*   card   surface/General/tooltip, radius/lg, 12 / 16 padding, 8 gap,  */
/*          shadow-sm, 180 to 240px wide                                  */
/*   head   optional: Text xs / Semibold, upper case, text/tertiary      */
/*   rows   a 2px rail in the row's colour; label Text xs / Semibold     */
/*          text/primary (an optional tag pill under it); an optional     */
/*          change (TrendPill, number only); the value Text md / Bold,    */
/*          in its band's text-indicator colour when it's a 0–100 score   */
/*   compare optional: "Compared to" (Text 3xs / Semibold, upper case,    */
/*          text/quaternary) and its own rows                             */
/*   note   optional: Text 2xs / Regular, text/secondary                 */
/*   body   optional: Text xs / Regular, text/primary (a sentence)       */
/*                                                                      */
/* Content is data: { head?, rows: [{ label, value, text?, color?,       */
/* delta?, score?, valueColor?, tag? }], compare?: { head?, rows },       */
/* note?, body? }. Three ways to show it:                                */
/*   useChartTip()  follows the pointer, portalled to document.body       */
/*   <TipBox>       placed by the chart (absolute), or in the page (a     */
/*                  tap's detail on a phone: pass `flat`)                  */
/*   <TipContent>   just the inside, for a host that draws its own card    */
/* Developer › Foundations › Tooltips documents it.                       */
/* ================================================================== */
export const TIP_CARD = {
  background: ds.surface.general.tooltip, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, boxShadow: dsShadow("sm"),
  display: "flex", flexDirection: "column", gap: dsSpace[8], fontFamily: font, boxSizing: "border-box", minWidth: 180, maxWidth: 240,
};

export function TipRow({ label, value, text, delta, color, score, valueColor, tag }) {
  const band = score && typeof value === "number" ? dsBand(value) : null;
  return (
    <div data-part="tip-row" style={{ display: "flex", alignItems: "center", gap: dsSpace[8], borderLeft: `2px solid ${color || band?.c || ds.border.strong}`, padding: `${dsSpace[2]}px 0 ${dsSpace[2]}px ${dsSpace[6]}px` }}>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[2] }}>
        <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{label}</span>
        {tag && <span style={{ alignSelf: "flex-start", maxWidth: "100%", border: `${dsBorder.sm}px solid ${ds.border.primary}`, borderRadius: dsRadius.full, padding: `${dsSpace[2]}px ${dsSpace[6]}px`, ...dsText("Text 3xs"), color: ds.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tag}</span>}
      </span>
      {delta != null && delta !== 0 && <TrendPill delta={delta} numberOnly />}
      <span style={{ ...dsText("Text md", 700), color: valueColor || (band ? band.cs : ds.text.primary), fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{text ?? value}</span>
    </div>
  );
}

export function TipContent({ head, rows = [], compare, note, body }) {
  return (
    <>
      {head && <span data-part="tip-head" style={{ ...dsText("Text xs", 600), color: ds.text.tertiary, textTransform: "uppercase" }}>{head}</span>}
      {rows.map((r, i) => <TipRow key={`${r.label}-${i}`} {...r} />)}
      {compare && (
        <>
          <span style={{ ...dsText("Text 3xs", 600), lineHeight: 1, textTransform: "uppercase", color: ds.text.quaternary }}>{compare.head || "Compared to"}</span>
          {compare.rows.map((r, i) => <TipRow key={`c-${r.label}-${i}`} {...r} />)}
        </>
      )}
      {note && <span data-part="tip-note" style={{ ...dsText("Text 2xs"), color: ds.text.secondary }}>{note}</span>}
      {body && <p style={{ margin: 0, ...dsText("Text xs"), color: ds.text.primary }}>{body}</p>}
    </>
  );
}

/* A tooltip placed by its chart (pass the position in `style`), or `flat` in the page (no shadow, full width). */
export function TipBox({ content, style, flat = false, ...rest }) {
  return (
    <div data-part="tip" role="status" {...rest} style={{ ...TIP_CARD, ...(flat ? { boxShadow: "none", maxWidth: "none", minWidth: 0 } : { pointerEvents: "none", zIndex: 3 }), ...style }}>
      <TipContent {...content} />
    </div>
  );
}

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

/* Follows the pointer: above it, or below it near the top of the window, and always inside the window sideways. */
export function TipCard({ x, y, content }) {
  const below = y < 140;
  const left = Math.max(126, Math.min(x, (window.innerWidth || 1200) - 126));
  return (
    <TipBox content={content} style={{ position: "fixed", left, top: y, zIndex: 1000, transform: below ? "translate(-50%, 16px)" : "translate(-50%, calc(-100% - 12px))" }} />
  );
}
