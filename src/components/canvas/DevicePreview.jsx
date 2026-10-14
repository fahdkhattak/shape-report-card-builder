import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, MoreHorizontal, ChevronRight, ChevronLeft, Plus, Signal, Wifi, BatteryFull, X, Share, MessageSquare, BarChart3, BookOpen } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { CELL, GAP } from "./gridLayout.js";
import WidgetCard from "./WidgetCard.jsx";
import ExplorerRingCard from "./ExplorerRingCard.jsx";
import ScopePanel from "../scope/ScopePanel.jsx";
import { MobileReport } from "./MobileReport.jsx";
import { DuoSafari } from "./DuoSafari.jsx";
import { PersonaMenu, GhostBtn } from "./ReportHeader.jsx";
import { ScrollThumb } from "../ui/MinimalScroll.jsx";
import mascot from "../../assets/mascot-avatar.svg";

/* ================================================================== */
/* DEVICE PREVIEW — the report on a phone, and on an iPhone Duo          */
/* (Figma 984qJvMt7fCHASYHRwgrab, "Mobile Behavior Scope" 14679:86632:    */
/* 375 / 402 / 440 wide, the report and its Scope sheet).                */
/*                                                                        */
/* Rules read off those frames (and the desktop rule they extend):        */
/*  1. Widgets never shrink. A phone shows 2 columns: 2 × 164 + 16 = 344.  */
/*  2. The space around them gives way instead. With S = (screen − 344)/2  */
/*     per side: the report card's padding is S held up to 32 (16 in the    */
/*     375 frame; 15 here so the card never overhangs the screen),          */
/*     and the margin outside the card is what's left (S − 32, 0 to 64).   */
/*     375 → no margin, 16 padding (the card runs edge to edge);           */
/*     402 → no margin, 29 padding; 440 → 16 margin, 32 padding. The same  */
/*     sum gives the desktop's 64 + 32 + 344 once there's room.            */
/*  3. Top bar (44): menu, report title (truncates), divider, persona, "…". */
/*     The round picker and Filter don't fit and aren't shown.              */
/*     Under it, 8px down: "Org Report ›" and Add Widget (28), then the     */
/*     report card 16px below.                                              */
/*  4. A Scope is a sheet: the report dims below the top bar, the sheet's   */
/*     top sits 48px under it (the sub-bar stays visible, dimmed), top      */
/*     corners rounded, Stories 16px from the edges. Tap the dim to close.  */
/* iPhone Duo: see DuoPreview below (Apple HIG "Designing for iPhone Duo",  */
/* "Preparing your app for iPhone Duo", and the Duo References board,       */
/* Figma Z6YmEggwvoiX3j4d3kCKqV 2352:2764).                                 */
/* The device chrome (bezel, Dynamic Island, status bar, home indicator) is  */
/* drawn here; it isn't part of the product.                                */
/* ================================================================== */
export const PHONES = [
  { w: 375, h: 812 },
  { w: 402, h: 874 },
  { w: 440, h: 956 },
];
/* iPhone Duo displays (pt): outer 466 × 678; inner 951 × 669 with the fold through the centre (475.5 from the edge). */
const OUTER = { w: 466, h: 678 };
const INNER = { w: 951, h: 669, fold: 475.5 };
const BAR_W = 84; // the vertical bar on the trailing edge (status, toolbar, tab bar): its 84pt inset
const FOLD_BAND = 27; // keep-clear band centred on the fold when partially folded
const STATUS_H = 54;
const BEZEL = 12;

/* ---- device chrome -------------------------------------------------------------------------------------- */
function StatusBar({ left = true, right = true, island = true }) {
  return (
    <div aria-hidden="true" style={{ height: STATUS_H, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 30px 0 34px", background: T.white, fontFamily: "-apple-system, 'SF Pro Text', 'IBM Plex Sans', sans-serif", color: "#000" }}>
      <span style={{ fontSize: 17, fontWeight: 600, visibility: left ? "visible" : "hidden" }}>9:41</span>
      {island && <span style={{ position: "absolute", left: "50%", top: 11, width: 124, height: 36, marginLeft: -62, borderRadius: 20, background: "#000" }} />}
      <span style={{ display: "flex", alignItems: "center", gap: 6, visibility: right ? "visible" : "hidden" }}><Signal size={17} strokeWidth={2.4} /><Wifi size={17} strokeWidth={2.4} /><BatteryFull size={24} strokeWidth={1.8} /></span>
    </div>
  );
}
const HomeIndicator = () => <span aria-hidden="true" style={{ position: "absolute", left: "50%", bottom: 8, width: 134, height: 5, marginLeft: -67, borderRadius: 9999, background: "#000", zIndex: 10, pointerEvents: "none" }} />;

function Screen({ w, h, children, status }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 46, overflow: "hidden", background: T.white, display: "flex", flexDirection: "column", position: "relative", flexShrink: 0 }}>
      <StatusBar {...status} />
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</div>
      <HomeIndicator />
    </div>
  );
}

function Body({ children, radius: r = 58 }) {
  return (
    <div style={{ padding: BEZEL, borderRadius: r, background: "linear-gradient(145deg, #2b2a2a, #121111)", boxShadow: "0 0 0 1.5px #3c3a3a, 0 30px 60px rgba(0,0,0,0.25), 0 10px 20px rgba(0,0,0,0.15)", display: "flex", flexShrink: 0 }}>
      {children}
    </div>
  );
}

/* Scales the device down (never up) to fit the stage. */
function useFit(w, h) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => setScale(Math.min(1, (el.clientWidth - 48) / w, (el.clientHeight - 32) / h));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);
  return [ref, scale];
}

const chip = (on) => ({ border: "none", cursor: "pointer", fontFamily: font, fontSize: 12, padding: "4px 10px", borderRadius: 9999, background: on ? T.gray900 : "transparent", color: on ? T.white : T.gray700, fontVariantNumeric: "tabular-nums" });

export default function DevicePreview({ device, ...rest }) {
  const [phone, setPhone] = useState(PHONES[1]);
  const [pose, setPose] = useState("open");
  // Duo layout variants: SHAPE is a web app, so the Safari ones are the real case; "app" is the native-bars version.
  const [variant, setVariant] = useState("dashboard");
  const scrollMemo = useRef(0); // the report's scroll position, shared across Duo poses
  const isDuo = device === "duo";
  const duoDisplay = pose === "closed" ? OUTER : INNER;
  const devW = (isDuo ? duoDisplay.w : phone.w) + 2 * BEZEL;
  const devH = (isDuo ? duoDisplay.h : phone.h) + 2 * BEZEL;
  const [stageRef, scale] = useFit(devW, devH);
  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: T.gray50 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "10px 0 0", fontFamily: font, fontSize: 12, color: T.gray500 }}>
        {isDuo ? (
          <>
            <div role="radiogroup" aria-label="Duo layout" style={{ display: "flex", gap: 2, background: T.white, borderRadius: 9999, padding: 2, border: `1px solid ${T.gray100}` }}>
              {DUO_VARIANTS.map((v) => <button key={v.id} role="radio" aria-checked={v.id === variant} title={v.hint} onClick={() => setVariant(v.id)} style={chip(v.id === variant)}>{v.label}</button>)}
            </div>
            <div role="radiogroup" aria-label="Device pose" style={{ display: "flex", gap: 2, background: T.white, borderRadius: 9999, padding: 2, border: `1px solid ${T.gray100}` }}>
              {DUO_POSES.map((p) => <button key={p.id} role="radio" aria-checked={p.id === pose} onClick={() => setPose(p.id)} style={chip(p.id === pose)}>{p.label}</button>)}
            </div>
            <span>{pose === "closed" ? `Outer display ${OUTER.w} × ${OUTER.h}` : `Inner display ${INNER.w} × ${INNER.h}${pose === "folded" ? " · fold region active" : ""}`}</span>
          </>
        ) : (
          <>
            <span>Phone width</span>
            <div role="radiogroup" aria-label="Phone width" style={{ display: "flex", gap: 2, background: T.white, borderRadius: 9999, padding: 2, border: `1px solid ${T.gray100}` }}>
              {PHONES.map((p) => <button key={p.w} role="radio" aria-checked={p.w === phone.w} onClick={() => setPhone(p)} style={chip(p.w === phone.w)}>{p.w}</button>)}
            </div>
            <span>{phone.w} × {phone.h}</span>
          </>
        )}
      </div>
      <div ref={stageRef} style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <motion.div key={device + phone.w + (isDuo ? pose + variant : "")} initial={{ opacity: 0, scale: scale * 0.96 }} animate={{ opacity: 1, scale }} transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} style={{ transformOrigin: "center center", flexShrink: 0 }}>
          <Body radius={isDuo ? 52 : 58}>
            {isDuo ? (
              variant === "app"
                ? <DuoPreview pose={pose} scrollMemo={scrollMemo} {...rest} />
                : <DuoSafari variant={variant} pose={pose} display={duoDisplay} scrollMemo={scrollMemo} {...rest} />
            ) : (
              <Screen w={phone.w} h={phone.h}>
                <MobileReport width={phone.w} sheet {...rest} />
              </Screen>
            )}
          </Body>
        </motion.div>
      </div>
    </div>
  );
}

/* ==================================================================
   iPHONE DUO — a foldable iPhone: a compact OUTER display (466 × 678) used closed, and a large INNER display (951 × 669)
   that folds through its centre. Rules applied (Apple HIG "Designing for iPhone Duo", "Preparing your app for iPhone Duo",
   and the Duo References board: Do / Don't, Layout guides, Adaptive patterns, Templates):
   - Bars sit in a VERTICAL BAR on the trailing edge (84pt) on the outer display and on the inner display in this pose, in
     a fixed order that never changes between poses: (outer camera) · time and status · navigation (Back, or Close for a
     Scope on the outer display) · the prominent action (Add Widget) · the toolbar group (Share, the one "…" overflow) ·
     the tab bar (Chat, Reports, Library) at the foot. Icon-only, every item titled. The leading inset is 0.
   - Closed (outer): the phone rules on 382pt of content (466 − 84): 2 columns, and the card's padding gives way (19pt).
     A Scope covers the content like a sheet; Close moves to the top of the bar.
   - Open (inner): master-detail meeting at the fold, as in the board's Master Detail and Dashboard patterns. The report
     (the list) fills the leading half, 0 to 475.5pt: exactly 2 columns with the desktop's 32pt card padding. The selected
     widget's Scope (the item) fills the trailing half. An even split, so no widget straddles the fold. The selected widget
     stays highlighted, and there's no Close, because the detail pane always shows the selection.
   - Half-folded: the same layout (nothing rearranges when the device folds), with the fold's 27pt keep-clear band drawn.
     Nothing interactive sits in it: the report's outer margin is 33pt, and the Scope's Stories are 16pt in.
   - Task continuity: the selected widget, the layer (Explorers) and the report's scroll position carry across poses.
   ================================================================== */
const DUO_VARIANTS = [
  { id: "dashboard", label: "Safari · Dashboard", hint: "Web app in Safari, Weather-style: hero, widgets split at the fold; a picked widget gathers them to the left and its Scope comes in on the right" },
  { id: "desktop", label: "Safari · Desktop", hint: "The desktop report in Safari: full header, 4 columns; a picked widget gathers the report to the left half and its Scope opens on the right" },
  { id: "split", label: "Safari · Split", hint: "Web app in Safari: report on the left half, the selected widget's Scope on the right" },
  { id: "app", label: "App · Native bars", hint: "If SHAPE were a native app: the system's vertical bar on the trailing edge" },
];
const DUO_POSES = [
  { id: "closed", label: "Closed" },
  { id: "open", label: "Open" },
  { id: "folded", label: "Half-folded" },
];

const pill = { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 4, borderRadius: 9999, background: T.white, border: `1px solid ${T.gray75}`, boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 6px 14px rgba(0,0,0,0.06)" };

function BarButton({ icon: Icon, title, onClick, active, prominent, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
      onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
      whileTap={disabled ? undefined : { scale: 0.88 }} transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
      style={{
        width: prominent ? 44 : 36, height: prominent ? 44 : 36, borderRadius: 9999, border: "none", display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.35 : 1, transition: "background 120ms ease",
        background: prominent ? T.accent : hover && !disabled ? T.gray75 : "transparent",
        color: prominent ? T.white : active ? T.accent : T.gray900,
        boxShadow: prominent ? "0 4px 10px rgba(0,0,0,0.12)" : "none",
      }}
    >
      <Icon size={prominent ? 22 : 19} strokeWidth={2} />
    </motion.button>
  );
}

/* The vertical bar: the same items in the same order in every pose. */
function DuoBar({ outer, nav, onAdd, addDisabled }) {
  return (
    <div style={{ width: BAR_W, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: outer ? "10px 0 18px" : "14px 0 18px", boxSizing: "border-box", gap: 12, fontFamily: "-apple-system, 'SF Pro Text', 'IBM Plex Sans', sans-serif" }}>
      {outer && <span aria-hidden="true" title="Outer camera (reserved region)" style={{ width: 30, height: 30, borderRadius: 9999, background: "#000", flexShrink: 0 }} />}
      <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#000" }}>
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: "16px" }}>9:41</span>
        <Wifi size={16} strokeWidth={2.4} />
      </span>
      {nav && <div style={pill}><BarButton icon={nav.icon} title={nav.title} onClick={nav.onClick} /></div>}
      <BarButton icon={Plus} title="Add Widget" prominent onClick={onAdd} disabled={addDisabled} />
      <div style={pill}>
        <BarButton icon={Share} title="Share report" />
        <BarButton icon={MoreHorizontal} title="More" />
      </div>
      <div style={{ ...pill, marginTop: "auto" }}>
        <BarButton icon={MessageSquare} title="Chat" />
        <BarButton icon={BarChart3} title="Reports" active />
        <BarButton icon={BookOpen} title="Library" />
      </div>
    </div>
  );
}

function DuoPreview({ pose, scrollMemo, ...rest }) {
  const { scopeWidget, onCloseScope, layer, onAddWidget } = rest;
  const outer = pose === "closed";
  const display = outer ? OUTER : INNER;
  // Navigation leads the bar: Close for a Scope covering the outer display, otherwise Back out of a report layer.
  const nav = outer && scopeWidget
    ? { icon: X, title: "Close", onClick: onCloseScope }
    : layer ? { icon: ChevronLeft, title: `Back to ${rest.report.reportType}`, onClick: layer.onExit } : null;
  const contentW = display.w - BAR_W;
  // Nothing picked yet: the inner display's detail pane shows the "Start here" widget's Scope (never a half-empty display).
  const detail = scopeWidget || rest.items.find((w) => w.familyId === "org-score") || null;
  return (
    <div style={{ width: display.w, height: display.h, borderRadius: 40, overflow: "hidden", background: T.gray50, display: "flex", position: "relative", flexShrink: 0 }}>
      <div style={{ width: contentW, height: "100%", position: "relative", display: "flex" }}>
        {outer ? (
          <>
            <MobileReport width={contentW} sheet={false} duo scrollMemo={scrollMemo} {...rest} />
            <AnimatePresence>
              {scopeWidget && (
                <motion.div key={scopeWidget.id} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
                  style={{ position: "absolute", inset: "8px 0 0 0", zIndex: 6, boxShadow: "0 -4px 16px rgba(0,0,0,0.08)", borderTopLeftRadius: radius.widget, borderTopRightRadius: radius.widget }}>
                  <ScopePanel widget={scopeWidget} width={contentW} sheet hideClose onClose={onCloseScope} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* master: the report, on the leading half up to the fold */}
            <div style={{ width: INNER.fold, flexShrink: 0, height: "100%" }}>
              <MobileReport width={INNER.fold} sheet={false} duo scrollMemo={scrollMemo} {...rest} />
            </div>
            {/* detail: the selected widget's Scope, on the trailing half */}
            <div style={{ flex: 1, minWidth: 0, height: "100%", position: "relative", borderLeft: pose === "open" ? `1px solid ${T.gray75}` : "none" }}>
              <AnimatePresence mode="wait" initial={false}>
                {detail ? (
                  <motion.div key={detail.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ type: "spring", bounce: 0.1, duration: 0.35 }} style={{ position: "absolute", inset: "8px 0 0 0" }}>
                    <ScopePanel widget={detail} width={contentW - INNER.fold} sheet hideClose onClose={onCloseScope} />
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center", fontFamily: font }}>
                    <img src={mascot} alt="" width={40} height={40} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: T.gray900 }}>Pick a widget to see its Scope.</span>
                    <span style={{ fontSize: 13, color: T.gray500, lineHeight: "18px" }}>The report stays on the left; the story behind the widget you pick opens here.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* the fold: inactive when flat; a keep-clear band when partially folded */}
            {pose === "folded" && (
              <span aria-hidden="true" title="Folding region: keep clear" style={{
                position: "absolute", top: 0, bottom: 0, left: INNER.fold - FOLD_BAND / 2, width: FOLD_BAND, pointerEvents: "none", zIndex: 8,
                background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 42%, rgba(0,0,0,0.16) 50%, rgba(0,0,0,0.10) 58%, rgba(0,0,0,0) 100%)",
              }} />
            )}
          </>
        )}
      </div>
      <DuoBar outer={outer} nav={nav} onAdd={onAddWidget} addDisabled={!!layer} />
    </div>
  );
}
