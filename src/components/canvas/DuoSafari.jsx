import { useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, BookOpen, Menu, RotateCw, Plus, Copy, Wifi, MoreHorizontal, PanelLeft } from "lucide-react";
import { T, font, radius, band } from "../../lib/tokens.js";
import { LATEST } from "../../lib/dataset.js";
import { statusName } from "../../lib/bands.js";
import { CELL, GAP } from "./gridLayout.js";
import { sizeToSpan } from "./gridLayout.js";
import { familyById } from "../../lib/families.js";
import WidgetCard from "./WidgetCard.jsx";
import ExplorerRingCard from "./ExplorerRingCard.jsx";
import ScopePanel from "../scope/ScopePanel.jsx";
import { MobileReport } from "./MobileReport.jsx";
import { PersonaMenu, GhostBtn, ReportTopBar, ReportSubBar } from "./ReportHeader.jsx";
import { ScrollThumb } from "../ui/MinimalScroll.jsx";

/* ================================================================== */
/* iPHONE DUO · SAFARI VARIANTS — SHAPE is a web app, so on the Duo it   */
/* sits inside Safari and can't use the system's vertical bar. Read off  */
/* Safari on the Duo's inner display (screenshots supplied by the user): */
/*  - At rest: one horizontal bar across the top (64pt here): back and    */
/*    bookmarks (a pill) on the leading side, the address field centred   */
/*    (page menu, domain, reload), new tab and tabs (a pill) on the        */
/*    trailing side, then the time and Wi-Fi in the top-trailing corner.  */
/*  - Scrolling down shrinks it to a small address pill at the top centre */
/*    and the page runs edge to edge; scrolling up (or tapping the pill)  */
/*    brings the bar back. The page scrolls under it (translucent).       */
/*  - Closed (outer display): no screenshot exists. Inferred from Apple's  */
/*    rule that bars sit on the side of the outer display: Safari's        */
/*    controls in the 84pt trailing bar; minimised, only the camera and    */
/*    the time stay.                                                       */
/* Three layouts for the page (variants, chosen in the Duo toolbar):          */
/*  - SPLIT: master-detail at the fold — the report (with the web app's     */
/*    own header) on the leading half, the selected widget's Scope on the   */
/*    trailing half.                                                       */
/*  - DASHBOARD (after the iPhone Weather app on the Duo): no report card;  */
/*    a centred hero (Org report, title, score | status) over a soft wash  */
/*    of the status colour, then the widgets straight on the background,    */
/*    split evenly at the fold — two columns either side, meeting 24pt      */
/*    from the fold (48pt gutter, wider than the 27pt keep-clear band).     */
/*    A tapped widget gathers the page into the leading half (the widgets   */
/*    glide to two columns) and its Scope slides in from the trailing edge  */
/*    into the trailing half. On the outer display it's a sheet.            */
/*  - DESKTOP: the desktop report inside Safari: the report's own top bar   */
/*    and sub-bar, then the card on 4 columns (2 either side of the fold).  */
/*    A tapped widget gathers the report into the leading half on 2         */
/*    columns and the Scope takes the trailing half, under the top bar.     */
/*    Closed, it falls back to the phone layout.                            */
/* Widgets never shrink (164pt cells), in every variant.                    */
/* ================================================================== */
const DOMAIN = "app.shapepowered.com";
const BAR_H = 64; // Safari's bar at rest
const OUTER_BAR = 84;

/* Safari's bar shrinks while scrolling down and returns on the way up. */
export function useSafariChrome() {
  const [min, setMin] = useState(false);
  const onScrollY = (y, dy) => {
    if (y < BAR_H) setMin(false);
    else if (dy > 4) setMin(true);
    else if (dy < -8) setMin(false);
  };
  return { min, setMin, onScrollY };
}

const glass = { background: "rgba(246, 245, 244, 0.82)", backdropFilter: "blur(18px) saturate(1.4)", WebkitBackdropFilter: "blur(18px) saturate(1.4)" };
const sPill = { display: "flex", alignItems: "center", gap: 2, padding: 4, borderRadius: 9999, background: "rgba(255,255,255,0.75)", border: `1px solid ${T.gray75}` };
const sBtn = { width: 36, height: 36, borderRadius: 9999, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: T.gray900, cursor: "pointer", padding: 0 };
const sys = "-apple-system, 'SF Pro Text', 'IBM Plex Sans', sans-serif";

/* Inner display: the horizontal bar, or its minimised address pill. */
function SafariTopBar({ min, onExpand }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, zIndex: 20, pointerEvents: "none", fontFamily: sys }}>
      <AnimatePresence initial={false} mode="popLayout">
        {min ? (
          <motion.button
            key="min" type="button" onClick={onExpand} title="Show Safari's toolbar"
            initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
            style={{ pointerEvents: "auto", display: "block", margin: "8px auto 0", height: 26, padding: "0 14px", borderRadius: 9999, border: `1px solid rgba(255,255,255,0.7)`, ...glass, fontSize: 12, color: T.gray700, cursor: "pointer", fontFamily: sys }}
          >
            {DOMAIN}
          </motion.button>
        ) : (
          <motion.div
            key="full" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
            style={{ pointerEvents: "auto", height: BAR_H, display: "flex", alignItems: "center", gap: 10, padding: "0 16px 0 20px", boxSizing: "border-box", ...glass, borderBottom: `1px solid ${T.gray75}` }}
          >
            <div style={sPill}>
              <button type="button" title="Back" style={sBtn}><ChevronLeft size={20} /></button>
              <button type="button" title="Bookmarks" style={sBtn}><BookOpen size={18} /></button>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ ...sPill, width: 340, height: 44, boxSizing: "border-box", padding: "0 6px", justifyContent: "space-between" }}>
                <button type="button" title="Page menu" style={sBtn}><Menu size={18} /></button>
                <span style={{ fontSize: 14, color: T.gray900 }}>{DOMAIN}</span>
                <button type="button" title="Reload" style={sBtn}><RotateCw size={16} /></button>
              </div>
            </div>
            <div style={sPill}>
              <button type="button" title="New tab" style={sBtn}><Plus size={20} /></button>
              <button type="button" title="Tabs" style={sBtn}><Copy size={17} /></button>
            </div>
            <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6, color: "#000" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>9:41</span><Wifi size={18} strokeWidth={2.4} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Outer display (inferred): Safari's controls in the trailing side bar; minimised, only the camera and the time stay. */
function SafariSideBar({ min, onExpand }) {
  const col = { ...sPill, flexDirection: "column" };
  return (
    <div style={{ width: OUTER_BAR, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "10px 0 18px", boxSizing: "border-box", background: T.gray50, fontFamily: sys }}>
      <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 9999, background: "#000", flexShrink: 0 }} />
      <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#000" }}>
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: "16px" }}>9:41</span><Wifi size={16} strokeWidth={2.4} />
      </span>
      <AnimatePresence initial={false}>
        {min ? (
          <motion.button key="min" type="button" onClick={onExpand} title={`Show Safari's toolbar (${DOMAIN})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ ...col, cursor: "pointer", padding: "10px 4px" }}><Menu size={16} /></motion.button>
        ) : (
          <motion.div key="full" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={col}><button type="button" title="Back" style={sBtn}><ChevronLeft size={20} /></button><button type="button" title="Bookmarks" style={sBtn}><BookOpen size={18} /></button></div>
            <div style={col}><button type="button" title={`Page menu (${DOMAIN})`} style={sBtn}><Menu size={18} /></button><button type="button" title="Reload" style={sBtn}><RotateCw size={16} /></button></div>
            <div style={col}><button type="button" title="New tab" style={sBtn}><Plus size={20} /></button><button type="button" title="Tabs" style={sBtn}><Copy size={17} /></button></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- SPLIT ------------------------------------------------------------------------------------------- */
function SplitInner({ display, pose, chrome, scrollMemo, rest }) {
  // The panes scroll inside themselves, so they can follow Safari's bar (40pt for the minimised pill) without the page's
  // own scroll moving — unlike the Dashboard, where the page is the scroller and must stay put.
  const inset = chrome.min ? 40 : BAR_H;
  // Nothing picked yet: the detail pane shows the "Start here" widget's Scope, so half the display is never empty.
  const detail = rest.scopeWidget || rest.items.find((w) => w.familyId === "org-score") || null;
  return (
    <>
      <div style={{ width: display.fold, flexShrink: 0, height: "100%" }}>
        <MobileReport width={display.fold} sheet={false} scrollMemo={scrollMemo} onScrollY={chrome.onScrollY} topInset={inset} {...rest} />
      </div>
      <div style={{ flex: 1, minWidth: 0, height: "100%", position: "relative", borderLeft: pose === "open" ? `1px solid ${T.gray75}` : "none", background: T.gray50 }}>
        <AnimatePresence mode="wait" initial={false}>
          {detail ? (
            <motion.div key={detail.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
              style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: inset + 8, transition: "top 260ms cubic-bezier(.2,.8,.2,1)" }}>
              <ScopePanel widget={detail} width={display.w - display.fold} sheet hideClose onClose={rest.onCloseScope} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", fontFamily: font, fontSize: 15, fontWeight: 600, color: T.gray700 }}>
              Pick a widget to see its Scope.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ---- widgets that glide to their new place ------------------------------------------------------------------- */
/* The Dashboard and Desktop variants re-arrange the same widgets (4 columns → 2 when a Scope opens). Each widget is placed
   by hand (a small dense packer, like the grid's `row dense`) and animated to its spot, so every widget visibly moves rather
   than the grid snapping. Hand placement rather than motion's `layout`: the device preview is scaled to fit the stage, and
   measured layout animations drift under a scaled parent. */
const STEP = CELL + GAP;
const spanOf = (w) => {
  if (w.kind === "explorer") return { col: 1, row: 1 };
  const size = w.kind === "library" ? familyById(w.familyId).forms[w.formIndex].size : w.spec.size;
  return sizeToSpan(size);
};
/* Place `items` on `cols` columns, top first. `pairs`: a 2-wide widget only starts on column 1 or 3, so on 4 columns
   nothing straddles the middle (the fold). Returns [{ w, c, r, span }] and the rows used. */
function pack(items, cols, { pairs = false } = {}) {
  const used = [];
  const isFree = (r, c, s) => {
    for (let y = r; y < r + s.row; y++) for (let x = c; x < c + s.col; x++) if (x >= cols || used[y]?.[x]) return false;
    return true;
  };
  let rows = 0;
  const out = items.map((w) => {
    const raw = spanOf(w);
    const s = { col: Math.min(raw.col, cols), row: raw.row };
    for (let r = 0; r < 200; r++) {
      for (let c = 0; c + s.col <= cols; c++) {
        if (pairs && s.col === 2 && c % 2) continue;
        if (!isFree(r, c, s)) continue;
        for (let y = r; y < r + s.row; y++) { used[y] = used[y] || []; for (let x = c; x < c + s.col; x++) used[y][x] = true; }
        rows = Math.max(rows, r + s.row);
        return { w, c, r, span: s };
      }
    }
    return { w, c: 0, r: rows, span: s };
  });
  return { placed: out, rows };
}
const rowsHeight = (rows) => (rows ? rows * STEP - GAP : 0);
const GLIDE = { type: "spring", bounce: 0.16, duration: 0.6 };

/* Absolutely placed widgets: `placed` = [{ w, x, y }]. */
function Glide({ placed, height, rest }) {
  return (
    <motion.div initial={false} animate={{ height }} transition={GLIDE} style={{ position: "relative" }}>
      {placed.map(({ w, x, y }, i) => (
        <motion.div key={w.id} initial={false} animate={{ x, y }} transition={{ ...GLIDE, delay: Math.min(i, 10) * 0.018 }} style={{ position: "absolute", left: 0, top: 0 }}>
          {w.kind === "explorer"
            ? <ExplorerRingCard index={i} name={w.dimension} value={w.value} selected={rest.scopeWidget?.id === w.id} onClick={() => rest.onOpen(w)} />
            : <WidgetCard widget={w} {...rest.cardHandlers} onOpenModal={rest.onOpen} selected={rest.scopeWidget?.id === w.id} startHere={w.familyId === "org-score"} />}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* The Scope, coming in from the trailing edge into the trailing half. `left`: where the pane starts (the fold, or past
   the fold's keep-clear band when half-folded). */
const PANE_SPRING = { type: "spring", bounce: 0.1, duration: 0.5 };
function TrailingScope({ widget, left, top, width, sheet, onClose }) {
  return (
    <AnimatePresence>
      {widget && (
        <motion.div key="scope-pane" initial={{ x: "105%" }} animate={{ x: 0 }} exit={{ x: "105%" }} transition={PANE_SPRING}
          style={{ position: "absolute", left, right: 0, top, bottom: 0, zIndex: 12, boxShadow: "-8px 0 24px rgba(0,0,0,0.08), -1px 0 2px rgba(0,0,0,0.06)", borderTopLeftRadius: radius.widget, borderTopRightRadius: sheet ? radius.widget : 0, overflow: "hidden" }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={widget.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ type: "spring", bounce: 0.1, duration: 0.3 }} style={{ position: "absolute", inset: 0 }}>
              <ScopePanel widget={widget} width={width} sheet={sheet} onClose={onClose} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- DASHBOARD (Weather-style) -------------------------------------------------------------------------- */
/* Split the widgets into two halves of about the same area, keeping their order. */
function halves(items) {
  const area = (w) => { const s = spanOf(w); return s.col * s.row; };
  const total = items.reduce((a, w) => a + area(w), 0);
  const left = [], right = [];
  let acc = 0;
  items.forEach((w) => { if (acc < total / 2) { left.push(w); acc += area(w); } else right.push(w); });
  return [left, right];
}

function Dashboard({ width, display, pose, chrome, scrollMemo, rest, outer }) {
  const ref = useRef(null);
  const lastY = useRef(0);
  useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = scrollMemo.current || 0; }, []); // keep the reader's place across poses
  const inset = outer ? 0 : BAR_H; // constant, see SplitInner
  const score = Math.round(LATEST.avgOverall);
  const status = statusName(score);
  const b = band(score);
  const gridW = CELL * 2 + GAP;
  // Inner display with a Scope: the page gathers into the leading half (clear of the fold band when half-folded) and the
  // Scope takes the trailing half. Without one: two columns either side of the fold, 24pt from it.
  const side = !outer && !!rest.scopeWidget;
  const leadW = pose === "folded" ? display.fold - 13.5 : display.fold;
  const pageW = side ? leadW : width;
  let placed, rows;
  if (outer || side) {
    const p = pack(rest.items, 2);
    const x0 = (pageW - gridW) / 2;
    placed = p.placed.map(({ w, c, r }) => ({ w, x: x0 + c * STEP, y: r * STEP }));
    rows = p.rows;
  } else {
    const gutter = 24; // each side of the fold
    const [l, r] = halves(rest.items);
    const pl = pack(l, 2), pr = pack(r, 2);
    const lx = display.fold - gutter - gridW, rx = display.fold + gutter;
    placed = [...pl.placed.map(({ w, c, r: y }) => ({ w, x: lx + c * STEP, y: y * STEP })), ...pr.placed.map(({ w, c, r: y }) => ({ w, x: rx + c * STEP, y: y * STEP }))];
    rows = Math.max(pl.rows, pr.rows);
  }
  const btn = { width: 36, height: 36, padding: 8, background: "rgba(255,255,255,0.6)" };
  return (
    <div style={{ position: "relative", width, height: "100%", overflow: "hidden", fontFamily: font, background: `linear-gradient(180deg, ${b.bg} 0%, ${T.gray50} 360px)` }}>
      <div
        ref={ref} className="scroll-minimal"
        onScroll={(e) => { const y = e.currentTarget.scrollTop; scrollMemo.current = y; chrome.onScrollY(y, y - lastY.current); lastY.current = y; }}
        style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", paddingTop: inset, boxSizing: "border-box" }}
      >
        {/* the page: full width, or the leading half while a Scope is open */}
        <motion.div initial={false} animate={{ width: pageW }} transition={GLIDE} style={{ position: "relative" }}>
          {/* the web app's own header: sidebar toggle leading; persona, Add Widget and "…" trailing */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: outer ? "10px 12px 0" : "10px 20px 0" }}>
            <GhostBtn icon={<PanelLeft size={20} />} aria-label="Menu" title="Menu" style={btn} />
            <span style={{ flex: 1 }} />
            {rest.layer ? <GhostBtn icon={<ChevronLeft size={18} />} onClick={rest.layer.onExit} style={{ height: 32, padding: "4px 12px", background: "rgba(255,255,255,0.6)" }}>{rest.report.reportType}</GhostBtn> : <PersonaMenu persona={rest.report.persona} />}
            <GhostBtn icon={<Plus size={20} />} aria-label="Add Widget" title="Add Widget" onClick={rest.onAddWidget} disabled={!!rest.layer} style={btn} />
            <GhostBtn icon={<MoreHorizontal size={20} />} aria-label="More" title="More" style={btn} />
          </div>
          {/* hero, centred over the page, like the Weather app's location + temperature + condition */}
          <div style={{ textAlign: "center", padding: outer ? "14px 16px 22px" : "18px 24px 30px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: T.gray500 }}>{rest.layer ? `${rest.report.reportType} · ${rest.layer.label}` : `${rest.report.reportType} · ${rest.report.persona}`}</div>
            <div style={{ fontSize: outer ? 24 : 30, fontWeight: 700, color: T.gray900, lineHeight: 1.15, marginTop: 4, letterSpacing: -0.3 }}>{rest.layer ? rest.layer.label : rest.report.title}</div>
            <div style={{ fontSize: outer ? 15 : 17, color: T.gray700, marginTop: 6 }}>
              <b style={{ color: b.cs, fontVariantNumeric: "tabular-nums" }}>{score}</b>
              <span style={{ color: T.gray300, margin: "0 8px" }}>|</span>{status}
            </div>
          </div>
          <div style={{ paddingBottom: 48 }}>
            <Glide placed={placed} height={rowsHeight(rows)} rest={rest} />
          </div>
        </motion.div>
      </div>
      <ScrollThumb target={ref} top={inset} />
      {outer ? (
        /* outer display: no room for two panes, so the Scope covers the page like a sheet */
        <AnimatePresence>
          {rest.scopeWidget && (
            <motion.div key={`sheet-${rest.scopeWidget.id}`} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
              style={{ position: "absolute", zIndex: 11, left: 0, right: 0, top: 8, bottom: 0, borderRadius: `${radius.widget}px ${radius.widget}px 0 0`, overflow: "hidden", boxShadow: "0 -4px 16px rgba(0,0,0,0.1)" }}>
              <ScopePanel widget={rest.scopeWidget} width={width} sheet onClose={rest.onCloseScope} />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <TrailingScope widget={rest.scopeWidget} left={pose === "folded" ? display.fold + 13.5 : display.fold} top={inset + 8} width={width - display.fold} sheet onClose={rest.onCloseScope} />
      )}
    </div>
  );
}

/* ---- DESKTOP (the desktop report, in Safari) ------------------------------------------------------------------ */
/* The desktop layout on the inner display: Safari's bar, then the report's own header (top bar across the whole width,
   sub-bar with the breadcrumb and Add Widget), then the report card. Four columns with no Scope open, two either side of
   the fold (a 32pt gutter at the middle, wider than the 27pt keep-clear band, and a 2×2 never starts on the 2nd column, so
   nothing straddles the fold). Picking a widget gathers the report into the leading half on two columns, and the Scope comes
   in from the trailing edge into the trailing half, under the report's top bar, as on desktop. It stays like that while you
   pick other widgets; closing the Scope spreads the report back out. */
const FOLD_GUTTER = 32;
function DesktopInner({ display, pose, chrome, scrollMemo, rest }) {
  const ref = useRef(null);
  const lastY = useRef(0);
  useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = scrollMemo.current || 0; }, []);
  const inset = chrome.min ? 40 : BAR_H;
  const open = !!rest.scopeWidget;
  const folded = pose === "folded";
  const colW = open ? (folded ? display.fold - 13.5 : display.fold) : display.w;
  const PAD = 32;
  const cols = open ? 2 : 4;
  const colX = open ? [0, STEP] : [0, STEP, 2 * STEP + FOLD_GUTTER - GAP, 3 * STEP + FOLD_GUTTER - GAP];
  const innerW = open ? CELL * 2 + GAP : CELL * 4 + GAP * 2 + FOLD_GUTTER;
  const cardW = innerW + 2 * PAD;
  const cardX = Math.max(0, (colW - cardW) / 2);
  const { placed: p, rows } = pack(rest.items, cols, { pairs: !open });
  const placed = p.map(({ w, c, r }) => ({ w, x: colX[c], y: r * STEP }));
  const layer = rest.layer ? { label: rest.layer.label, onExit: rest.layer.onExit } : null;
  return (
    <div style={{ position: "absolute", inset: 0, paddingTop: inset, boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: font, background: T.gray50, transition: "padding-top 260ms cubic-bezier(.2,.8,.2,1)" }}>
      <ReportTopBar title={rest.report.title} persona={rest.report.persona} roundLabel={`Round ${LATEST.round}`} />
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {/* the report column: the whole width, or the leading half while a Scope is open */}
        <motion.div initial={false} animate={{ width: colW }} transition={GLIDE} style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column" }}>
          <ReportSubBar reportType={rest.report.reportType} onAddWidget={rest.onAddWidget} addDisabled={!!rest.layer} layer={layer} />
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            <div ref={ref} className="scroll-minimal"
              onScroll={(e) => { const y = e.currentTarget.scrollTop; scrollMemo.current = y; chrome.onScrollY(y, y - lastY.current); lastY.current = y; }}
              style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", padding: "16px 0 48px" }}>
              <motion.div initial={false} animate={{ x: cardX, width: cardW }} transition={GLIDE}
                style={{ background: T.white, borderRadius: radius.reportCard, padding: PAD, border: `1px solid ${T.gray100}`, boxSizing: "border-box", boxShadow: "0 22px 6px rgba(0,0,0,0.01), 0 14px 6px rgba(0,0,0,0.02), 0 8px 5px rgba(0,0,0,0.07), 0 3px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)" }}>
                <Glide placed={placed} height={rowsHeight(rows)} rest={rest} />
              </motion.div>
            </div>
            <ScrollThumb target={ref} />
          </div>
        </motion.div>
        {/* the Scope: the trailing half, tucked 8pt under the report's top bar, as on desktop */}
        <TrailingScope widget={rest.scopeWidget} left={folded ? display.fold + 13.5 : display.fold} top={8} width={display.w - display.fold} onClose={rest.onCloseScope} />
      </div>
    </div>
  );
}

/* One Duo screen in a Safari variant: `variant` "split" | "dashboard" | "desktop"; `pose` "closed" | "open" | "folded". */
export function DuoSafari({ variant, pose, display, scrollMemo, ...rest }) {
  const chrome = useSafariChrome();
  const outer = pose === "closed";
  const contentW = outer ? display.w - OUTER_BAR : display.w;
  return (
    <div style={{ width: display.w, height: display.h, borderRadius: 40, overflow: "hidden", background: T.gray50, display: "flex", position: "relative", flexShrink: 0 }}>
      <div style={{ width: contentW, height: "100%", position: "relative", display: "flex" }}>
        {variant === "dashboard" ? (
          <Dashboard width={contentW} display={display} pose={pose} chrome={chrome} scrollMemo={scrollMemo} rest={rest} outer={outer} />
        ) : variant === "desktop" && !outer ? (
          <DesktopInner display={display} pose={pose} chrome={chrome} scrollMemo={scrollMemo} rest={rest} />
        ) : outer ? (
          <MobileReport width={contentW} sheet scrollMemo={scrollMemo} onScrollY={chrome.onScrollY} {...rest} />
        ) : (
          <SplitInner display={display} pose={pose} chrome={chrome} scrollMemo={scrollMemo} rest={rest} />
        )}
        {!outer && pose === "folded" && (
          <span aria-hidden="true" title="Folding region: keep clear" style={{ position: "absolute", top: 0, bottom: 0, left: display.fold - 13.5, width: 27, pointerEvents: "none", zIndex: 30,
            background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 42%, rgba(0,0,0,0.16) 50%, rgba(0,0,0,0.10) 58%, rgba(0,0,0,0) 100%)" }} />
        )}
        {!outer && <SafariTopBar min={chrome.min} onExpand={() => chrome.setMin(false)} />}
        {!outer && <span aria-hidden="true" style={{ position: "absolute", left: "50%", bottom: 8, width: 134, height: 5, marginLeft: -67, borderRadius: 9999, background: "#000", zIndex: 40, pointerEvents: "none" }} />}
      </div>
      {outer && <SafariSideBar min={chrome.min} onExpand={() => chrome.setMin(false)} />}
    </div>
  );
}
