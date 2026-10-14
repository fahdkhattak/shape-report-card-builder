import { useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, MoreHorizontal, ChevronRight, Plus } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { CELL, GAP } from "./gridLayout.js";
import WidgetCard from "./WidgetCard.jsx";
import ExplorerRingCard from "./ExplorerRingCard.jsx";
import ScopePanel from "../scope/ScopePanel.jsx";
import { PersonaMenu, GhostBtn } from "./ReportHeader.jsx";
import { ScrollThumb } from "../ui/MinimalScroll.jsx";

/* ================================================================== */
/* MOBILE REPORT — the report laid out for one phone-width screen (the  */
/* phone preview, and each iPhone Duo variant). Rules: see the header   */
/* comment in DevicePreview.jsx. Extracted so DevicePreview and         */
/* DuoSafari can share it.                                              */
/* ================================================================== */
export const cardBox = (screenW) => {
  const S = (screenW - 344) / 2;
  // Floored, never over S: at 375 that's 15, so the card fits the screen (the Figma 375 frame's card is 376 on a 375 screen).
  const pad = Math.max(12, Math.min(32, Math.floor(S)));
  const margin = Math.round(Math.max(0, Math.min(64, S - 32)));
  return { pad, margin };
};

/* ---- the report, laid out for one phone screen --------------------------------------------------------- */
/* `duo`: no top-bar buttons and no Add Widget here — on the iPhone Duo they live in the vertical bar on the trailing edge.
   `scrollMemo` (a ref): the report's scroll position, kept across Duo poses so opening or closing the device never loses
   the reader's place (task continuity). */
/* `onScrollY(top, delta)`: lets a host react to scrolling (Safari's bar shrinks on the way down, returns on the way up).
   `topInset`: space at the top of the page that a host's overlay (Safari's bar) covers; the page starts below it. */
export function MobileReport({ width, report, items, layer, scopeWidget, sheet, onOpen, onCloseScope, onAddWidget, cardHandlers, duo = false, scrollMemo, onScrollY, topInset = 0 }) {
  const lastY = useRef(0);
  const scrollRef = useRef(null);
  useLayoutEffect(() => { if (scrollMemo && scrollRef.current) scrollRef.current.scrollTop = scrollMemo.current || 0; }, []); // restore once, on mount (a pose change remounts it)
  const { pad, margin } = cardBox(width);
  const gridW = CELL * 2 + GAP;
  return (
    <div style={{ position: "relative", width, height: "100%", display: "flex", flexDirection: "column", background: T.gray50, fontFamily: font, overflow: "hidden", paddingTop: topInset, boxSizing: "border-box", transition: "padding-top 260ms cubic-bezier(.2,.8,.2,1)" }}>
      {/* top bar */}
      <div style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 8px", background: T.white, position: "relative", zIndex: 4 }}>
        {!duo && <GhostBtn icon={<Menu size={20} />} aria-label="Menu" style={{ width: 28, height: 28, padding: 4 }} />}
        <span style={{ flex: 1, ...(duo ? { paddingLeft: 12 } : {}), minWidth: 0, fontWeight: 700, color: T.gray700, lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: duo ? 16 : 14 }}>{report.title}</span>
        <div style={{ width: 1, height: 20, background: T.gray100, flexShrink: 0 }} />
        <PersonaMenu persona={report.persona} />
        {!duo && <GhostBtn icon={<MoreHorizontal size={20} />} aria-label="More" />}
      </div>
      {/* sub-bar */}
      <div style={{ height: 28, flexShrink: 0, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
        {layer ? (
          <nav aria-label="Report breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={layer.onExit} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: font, fontSize: 14, color: T.gray500 }}>{report.reportType}</button>
            <ChevronRight size={16} color={T.gray300} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>{layer.label}</span>
          </nav>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: T.gray700 }}>{report.reportType}<ChevronRight size={16} color={T.gray500} /></span>
        )}
        {!duo && <GhostBtn icon={<Plus size={20} />} onClick={onAddWidget} disabled={!!layer} style={{ height: 28, padding: "4px 12px" }}>Add Widget</GhostBtn>}
      </div>
      {/* the report */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <div ref={scrollRef} onScroll={(e) => { const y = e.currentTarget.scrollTop; if (scrollMemo) scrollMemo.current = y; onScrollY?.(y, y - lastY.current); lastY.current = y; }} className="scroll-minimal" style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", padding: `16px ${margin}px 48px` }}>
          <div style={{ background: T.white, borderRadius: radius.reportCard, padding: `${pad + (pad <= 16 ? 4 : 0)}px ${pad}px ${pad}px`, border: `1px solid ${T.gray100}`, boxShadow: "0 22px 6px rgba(0,0,0,0.01), 0 14px 6px rgba(0,0,0,0.02), 0 8px 5px rgba(0,0,0,0.07), 0 3px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)", width: gridW + 2 * pad, margin: "0 auto", boxSizing: "border-box" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${CELL}px)`, gridAutoRows: `${CELL}px`, gridAutoFlow: "row dense", gap: GAP, width: gridW }}>
              {items.map((w, i) => w.kind === "explorer"
                ? <ExplorerRingCard key={w.id} index={i} name={w.dimension} value={w.value} selected={scopeWidget?.id === w.id} onClick={() => onOpen(w)} />
                : <WidgetCard key={w.id} widget={w} {...cardHandlers} onOpenModal={onOpen} selected={scopeWidget?.id === w.id} startHere={w.familyId === "org-score"} />)}
            </div>
          </div>
        </div>
        <ScrollThumb target={scrollRef} />
      </div>
      {/* the Scope as a sheet */}
      {sheet && (
        <AnimatePresence>
          {scopeWidget && (
            <>
              <motion.div key="dim" onClick={onCloseScope} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ position: "absolute", left: 0, right: 0, top: 44, bottom: 0, background: "rgba(29, 26, 27, 0.4)", zIndex: 5 }} />
              <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
                style={{ position: "absolute", left: 0, right: 0, top: 92, bottom: 0, zIndex: 6, boxShadow: "0 -4px 16px rgba(0,0,0,0.08)", borderTopLeftRadius: radius.widget, borderTopRightRadius: radius.widget }}>
                <ScopePanel widget={scopeWidget} width={width} sheet onClose={onCloseScope} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

