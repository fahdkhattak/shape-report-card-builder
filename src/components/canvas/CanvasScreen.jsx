import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Plus } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { familyById, formTitle, nextFormIndex } from "../../lib/families.js";
import { nextId } from "../../lib/id.js";
import LibraryPanel from "../library/LibraryPanel.jsx";
import ChatPanel from "../chat/ChatPanel.jsx";
import DetailModal from "../modal/DetailModal.jsx";
import NavRail from "../shell/NavRail.jsx";
import WidgetCard from "./WidgetCard.jsx";
import SkeletonWidgetCard from "./SkeletonWidgetCard.jsx";
import { ReportTopBar, ReportSubBar } from "./ReportHeader.jsx";
import ScopePanel from "../scope/ScopePanel.jsx";
import ExplorerRingCard from "./ExplorerRingCard.jsx";
import { LATEST, DIMENSIONS, dimensionValue } from "../../lib/dataset.js";
import Button from "../ui/Button.jsx";
import mascotAvatar from "../../assets/mascot-avatar.svg";
import { CELL, GAP, colsForWidth } from "./gridLayout.js";
import { ScrollThumb } from "../ui/MinimalScroll.jsx";
import DevicePreview from "./DevicePreview.jsx";

// Placeholder shapes shown in the grid while a report is generating —
// ported from the retired GeneratingScreen.jsx (see CLAUDE.md for why that
// separate full-screen route was folded into this one).
const SKELETON_LAYOUT = [
  { size: "2x2", variant: "chart" },
  { size: "2x2", variant: "bars" },
  { size: "1x1", variant: "metric" },
  { size: "1x1", variant: "metric" },
];

// Padding eaten by chrome around the actual grid: the scroll area's own
// 28px padding on each side, plus the white report-card's 32px padding on
// each side — subtracted from the measured container width so the column
// count reflects the space the grid itself actually has.
const GRID_CHROME = (28 + 32) * 2;
// Report mode: 64px of margin each side of the report card + its 32px padding.
const REPORT_GRID_CHROME = (64 + 32) * 2;
const REPORT_MIN_W = 536; // 2 columns (344) + 32px card padding + 64px margin, each side
const SCOPE_MIN_W = 392; // a 344px story + 24px of padding each side
const SCOPE_MAX_W = 1000; // an 808px story + 96px of padding each side
const CHAT_W = 436; // fixed, per the Chat / Thread frames
const LIBRARY_W = 516; // LibraryPanel's fixed width
// One spring for everything that moves when a Scope opens or closes: the Scope sliding, the report card narrowing and
// its widgets gliding to their new cells. Critically damped (no bounce: nothing here was thrown), long enough to read.
const SCOPE_SPRING = { type: "spring", bounce: 0, duration: 0.5 };
// Chat + report + Scope can share the screen only when each fits at its minimum
// (436 + 536 + 392); below that, opening one closes the other.
const COEXIST_MIN_W = CHAT_W + REPORT_MIN_W + SCOPE_MIN_W;

/* ================================================================== */
/* CANVAS SCREEN — the Report Canvas. Reached either freshly seeded     */
/* (straight from ChatLanding's "Create Report", chat docked and         */
/* already showing a live generation checklist — see `initialGenerating` */
/* below) or blank (direct-construction path, chat starts closed).      */
/* `mainChat` is the same thread instance from ChatLanding — carries    */
/* the conversation through, never resets on arrival here.              */
/*                                                                      */
/* `initialGenerating` replaces the old separate `GeneratingScreen`      */
/* route (see CLAUDE.md): per the newer chat-redesign reference          */
/* (Z6YmEggwvoiX3j4d3kCKqV, node 2032:12681), report generation isn't    */
/* its own screen — the checklist runs inline as a chat message in the   */
/* docked ChatPanel while this same canvas is visible underneath,        */
/* showing a skeleton grid until generation completes.                   */
/* ================================================================== */
export default function CanvasScreen({ initialWidgets, scopeLabel, onExit, mainChat, initialChatOpen = false, initialGenerating = false, initialLibraryOpen = false, report = null, navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder }) {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [libCollapsed, setLibCollapsed] = useState(!initialLibraryOpen);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [generating, setGenerating] = useState(initialGenerating);
  const [editingId, setEditingId] = useState(null);
  const [modalWidget, setModalWidget] = useState(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const dragData = useRef(null);
  const scrollRef = useRef(null);
  const pushedChecklistRef = useRef(false);
  const mainRef = useRef(null);
  const [scopeId, setScopeId] = useState(null);
  const [reportLayer, setReportLayer] = useState(null); // null = the report itself, "explorers" = one layer deep (see below)
  const [scopeExpanded, setScopeExpanded] = useState(false);
  const [scopeCustomW, setScopeCustomW] = useState(null); // set while/after the user drags the Scope's left edge; null = automatic width
  const [resizingScope, setResizingScope] = useState(false);
  const [customOrder, setCustomOrder] = useState(false);
  const areaRef = useRef(null);
  const [areaW, setAreaW] = useState(1200); // everything right of the nav rail
  const [chatExpanded, setChatExpanded] = useState(false);
  // Report only: preview the report on a phone or an iPhone Duo (DevicePreview.jsx). Desktop is the real layout.
  const [device, setDevice] = useState("desktop");

  useEffect(() => {
    const el = mainRef.current, area = areaRef.current;
    if (!el || !area) return;
    // Only the area right of the nav rail is measured. The report's own width is worked out from it (see `mainW`
    // below), so a Scope or a side panel springing open never re-measures — and never re-lays out — every frame.
    const ro = new ResizeObserver(() => setAreaW(area.clientWidth));
    setAreaW(area.clientWidth);
    ro.observe(area);
    return () => ro.disconnect();
  }, [device]); // the main column remounts when a device preview closes

  useEffect(() => {
    if (!scopeId) return;
    const onKey = (e) => { if (e.key === "Escape") setScopeId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scopeId]);

  useEffect(() => {
    if (generating && !pushedChecklistRef.current) {
      pushedChecklistRef.current = true;
      mainChat.pushAI({ checklist: true });
    }
  }, [generating, mainChat]);

  const editingWidget = editingId
    ? (() => {
        const w = widgets.find((x) => x.id === editingId);
        if (!w) return null;
        const name = w.customTitle || (w.kind === "library" ? formTitle(w.familyId, w.formIndex) : w.spec.title);
        return { id: w.id, name, kind: w.kind, familyId: w.familyId, formIndex: w.formIndex, spec: w.spec };
      })()
    : null;

  const addLibraryWidget = (familyId, formIndex) => setWidgets((w) => [...w, { id: nextId(), kind: "library", familyId, formIndex }]);
  const addGeneratedWidget = (spec) => setWidgets((w) => [...w, { id: nextId(), kind: "generated", spec }]);
  const replaceWidget = (id, spec) => {
    setWidgets((w) => w.map((x) => (x.id === id ? { id, kind: "generated", spec } : x)));
    setEditingId(null);
  };
  const changeForm = (id) =>
    setWidgets((w) => w.map((x) => (x.id !== id || x.kind !== "library" ? x : { ...x, formIndex: nextFormIndex(x.familyId, x.formIndex) })));
  const removeWidget = (id) => setWidgets((w) => w.filter((x) => x.id !== id));
  const renameWidget = (id, newTitle) => setWidgets((w) => w.map((x) => (x.id === id ? { ...x, customTitle: newTitle } : x)));
  // Scope and Chat share the screen when there's room for both (see
  // COEXIST_MIN_W): the chat keeps its fixed 436px, the report keeps its 536px
  // minimum, and the Scope compresses to whatever is left. Library always
  // replaces both.
  const closeScope = () => { setScopeId(null); setScopeExpanded(false); };
  const canCoexist = areaW >= COEXIST_MIN_W;
  const openScope = (w) => {
    if (w.id === scopeId) { closeScope(); return; }
    if (!canCoexist) setChatOpen(false);
    setChatExpanded(false); setLibCollapsed(true); setScopeId(w.id);
    // Once the report has settled into its new columns, bring the picked widget into view if the reflow moved it out.
    setTimeout(() => {
      const el = scrollRef.current?.querySelector(`[data-widget-id="${CSS.escape(String(w.id))}"]`);
      const box = scrollRef.current?.getBoundingClientRect(), r = el?.getBoundingClientRect();
      if (el && box && (r.top < box.top + 40 || r.bottom > box.bottom)) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 520);
  };
  // The Explorers widget doesn't open a Scope — it takes the whole report one
  // layer deeper, to the 12 Explorers (Figma 984qJvMt7fCHASYHRwgrab,
  // 14531:9772); each Explorer then opens its own Scope. Changing layer closes
  // any open Scope. The Explorer cards aren't user widgets: they're a view.
  // Switching device keeps what's open (the Duo's split layouts show the "Start here" widget's Scope in their detail
  // pane while nothing is picked — see DevicePreview / DuoSafari — without opening anything).
  const chooseDevice = (d) => {
    setDevice(d);
    setChatOpen(false); setChatExpanded(false); setLibCollapsed(true); setScopeExpanded(false);
  };
  const enterLayer = () => { closeScope(); setReportLayer("explorers"); };
  const exitLayer = () => { closeScope(); setReportLayer(null); };
  const openWidget = (w) => (report && w.kind === "library" && w.familyId === "explorers" ? enterLayer() : openScope(w));
  const explorerCards = reportLayer === "explorers" ? DIMENSIONS.map((name) => ({ id: `explorer:${name}`, kind: "explorer", dimension: name, value: Math.round(dimensionValue(name)) })) : [];
  const startEdit = (id) => { closeScope(); setLibCollapsed(true); setEditingId(id); setChatOpen(true); };
  const openLibrary = () => { closeScope(); setChatOpen(false); setLibCollapsed(false); };
  const toggleChat = () => { if (!canCoexist) closeScope(); setEditingId(null); setLibCollapsed(true); setChatExpanded(false); setChatOpen((o) => !o); };

  const onLibraryDragStart = (e, familyId, formIndex) => { dragData.current = { type: "library", familyId, formIndex }; };
  const onCanvasDrop = (e) => {
    e.preventDefault();
    setDragOverCanvas(false);
    if (dragData.current?.type === "library") addLibraryWidget(dragData.current.familyId, dragData.current.formIndex);
    dragData.current = null;
  };
  const onCanvasDragLeave = (e) => { if (e.target === e.currentTarget) setDragOverCanvas(false); };
  const onWidgetDragStart = (id) => { dragData.current = { type: "canvas", id }; };
  const onWidgetDrop = (targetId) => {
    if (dragData.current?.type === "canvas" && dragData.current.id !== targetId) {
      setCustomOrder(true);
      setWidgets(() => {
        const w = displayWidgets;
        const from = w.findIndex((x) => x.id === dragData.current.id);
        const to = w.findIndex((x) => x.id === targetId);
        const copy = [...w];
        const [moved] = copy.splice(from, 1);
        copy.splice(to, 0, moved);
        return copy;
      });
    }
    dragData.current = null;
  };

  const scopeWidget = scopeId ? widgets.find((w) => w.id === scopeId) || explorerCards.find((w) => w.id === scopeId) || null : null;
  // The Scope's cards top out at 808px (+96px padding each side = 1000px), so
  // once the Scope has that much, every extra pixel goes to the report (min 536).
  // The report keeps at least REPORT_MIN_W (2 columns + margins); the Scope takes
  // the rest, up to SCOPE_MAX_W. Past that, extra width goes back to the report,
  // which then reflows to 4 or 6 columns. A resized Scope stays within the same
  // bounds (and never squeezes the report under its minimum).
  // Widths are worked out from where the layout is going, not measured while it animates: the main column is the area
  // minus the open side panel (chat or Library), and the report is that minus the Scope. The report picks its column
  // count from its final width once, at the start of the motion, and its widgets glide there (WidgetCard `layout`),
  // instead of the grid jumping 6 → 5 → 4 → 3 → 2 as the Scope's width springs open.
  const chatW = chatExpanded ? areaW : Math.max(320, Math.min(CHAT_W, areaW - REPORT_MIN_W));
  const leftW = chatOpen ? chatW : !libCollapsed ? LIBRARY_W : 0;
  const mainW = Math.max(0, areaW - leftW);
  const scopeMaxW = Math.max(0, Math.min(SCOPE_MAX_W, mainW - REPORT_MIN_W));
  const scopeMinW = Math.min(SCOPE_MIN_W, scopeMaxW);
  const clampScope = (w) => Math.max(scopeMinW, Math.min(scopeMaxW, w));
  const scopeW = scopeExpanded ? mainW : scopeCustomW != null ? clampScope(scopeCustomW) : scopeMaxW;
  // (The chat is 436px, Figma node 14463:12084, but yields to the report's 536px minimum, down to 320px; expanded, it
  // fills the whole area. Worked out above.)
  const reportW = scopeWidget && !scopeExpanded ? mainW - scopeW : mainW;
  const cols = colsForWidth(reportW - (report ? REPORT_GRID_CHROME : GRID_CHROME));

  const gridWidth = CELL * cols + GAP * (cols - 1);

  // A report's widgets are re-ordered per column count (the design lays the
  // 6-, 3- and 2-column versions out differently); dragging switches that off.
  const layoutOrder = report?.layouts && !customOrder ? report.layouts[cols] : null;
  const displayWidgets = layoutOrder
    ? [...widgets].sort((a, b) => {
        const ia = layoutOrder.indexOf(a.familyId), ib = layoutOrder.indexOf(b.familyId);
        return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
      })
    : widgets;
  // The phone shows 2 columns, in the report's own 2-column order.
  const mobileOrder = report?.layouts?.[2];
  const mobileWidgets = mobileOrder ? [...widgets].sort((a, b) => { const ia = mobileOrder.indexOf(a.familyId), ib = mobileOrder.indexOf(b.familyId); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); }) : widgets;
  const onScopeResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX, startW = scopeW;
    setResizingScope(true);
    const move = (ev) => setScopeCustomW(clampScope(startW + (startX - ev.clientX)));
    const up = () => { setResizingScope(false); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div style={{ height: "100%", display: "flex", fontFamily: font, position: "relative", overflow: "hidden" }}>
      <NavRail active="org" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />

      {/* Chat and Library share one left-of-canvas slot, mutually exclusive —
          chat now docks LEFT (per the newer side-modal reference, see
          ChatPanel.jsx's header comment), the same side Library already
          used, so only one can be open at a time; openLibrary()/toggleChat()
          above enforce that instead of letting both mount together. */}
      <div ref={areaRef} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {report && (
          <div style={{ background: T.gray50, flexShrink: 0 }}>
            <ReportTopBar title={report.title} persona={report.persona} roundLabel={`Round ${LATEST.round}`} device={device} onDeviceChange={chooseDevice} />
          </div>
        )}
        {report && device !== "desktop" ? (
          <DevicePreview
            device={device}
            report={report}
            items={reportLayer === "explorers" ? explorerCards : mobileWidgets}
            layer={reportLayer ? { label: "Explorers", onExit: exitLayer } : null}
            scopeWidget={scopeWidget}
            onOpen={(w) => (w.kind === "explorer" ? openScope(w) : openWidget(w))}
            onCloseScope={closeScope}
            onAddWidget={() => { setDevice("desktop"); openLibrary(); }}
            cardHandlers={{ onChangeForm: changeForm, onEdit: (id) => { setDevice("desktop"); startEdit(id); }, onRemove: removeWidget, onRename: renameWidget }}
          />
        ) : (
        <div style={{ flex: 1, minHeight: 0, display: "flex", background: report ? T.gray50 : T.white }}>
      <AnimatePresence mode="wait">
        {chatOpen ? (
          <ChatPanel key="chat" width={chatW} inset={!!report} expanded={chatExpanded} onToggleExpand={() => setChatExpanded((v) => !v)} contextTag={report ? `SHAPE Performance Index | ${report.persona}` : undefined} onClose={() => { setChatOpen(false); setChatExpanded(false); }} editingWidget={editingWidget} onAddWidget={addGeneratedWidget} onReplaceWidget={replaceWidget} onCancelEdit={() => setEditingId(null)} mainChat={mainChat} reportGenerating={generating} onGeneratingComplete={() => setGenerating(false)} />
        ) : (
          !libCollapsed && (
            <LibraryPanel
              key="library"
              onClose={() => setLibCollapsed(true)}
              onLibraryDragStart={onLibraryDragStart}
              onQuickAdd={addLibraryWidget}
              generatedWidgets={widgets.filter((w) => w.kind === "generated")}
              onQuickAddGenerated={addGeneratedWidget}
              onRemoveGenerated={removeWidget}
            />
          )
        )}
      </AnimatePresence>

      <div ref={mainRef} style={{ flex: 1, display: chatExpanded && chatOpen ? "none" : "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {!report && (
        <div style={{ padding: "12px 32px", borderBottom: `1px solid ${T.gray75}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.white }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onExit} style={{ border: "none", background: "transparent", color: T.gray500, cursor: "pointer", display: "flex" }}><ArrowLeft size={13} /></button>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.gray700 }}>{generating ? "Generating your report..." : (scopeLabel || "Org Report")}</div>
              <div style={{ fontSize: 10.5, color: T.gray300 }}>{generating ? "Working..." : scopeLabel ? "Scoped to selected drivers" : "Full org-wide data"}</div>
            </div>
          </div>
          <Button theme="brand" variation="ghost" size="xs" iconLeft={<Plus size={16} />} onClick={openLibrary} disabled={generating}>Add Widget</Button>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", minHeight: 0, background: T.gray50 }}>
          <div style={{ flex: 1, minWidth: 0, display: scopeExpanded && scopeWidget ? "none" : "flex", flexDirection: "column" }}>
            {report && <ReportSubBar reportType={report.reportType} onAddWidget={openLibrary} addDisabled={generating || !!reportLayer} layer={reportLayer ? { label: "Explorers", onExit: exitLayer } : null} />}
        <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
        {/* Scroll-edge fade (same treatment as the Scope and chat headers) in the
            report's own grey, so widgets dissolve under the sub-bar instead of
            being cut off by a hard edge. */}
        {report && <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, zIndex: 3, pointerEvents: "none", background: `linear-gradient(${T.gray50}, ${T.gray50}00)` }} />}
        <div
            ref={scrollRef}
            onDragOver={(e) => { e.preventDefault(); if (dragData.current?.type === "library") setDragOverCanvas(true); }}
            onDragLeave={onCanvasDragLeave}
            onDrop={onCanvasDrop}
            className="scroll-minimal"
            style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: report ? "40px 64px" : 28, background: T.gray50 }}
          >
            {/* The card's width springs to its new column count with the Scope; the grid inside is centred and
                clipped while it does, and each widget glides to its new cell (WidgetCard's `layout`). */}
            <motion.div initial={false} animate={{ width: gridWidth + 64 }} transition={SCOPE_SPRING} style={{ background: T.white, borderRadius: radius.reportCard, padding: 32, border: `1px solid ${T.gray100}`, boxShadow: "0 22px 6px rgba(0,0,0,0.01), 0 14px 6px rgba(0,0,0,0.02), 0 8px 5px rgba(0,0,0,0.07), 0 3px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)", margin: report ? "0 auto" : undefined, boxSizing: "border-box", display: "flex", justifyContent: "center", overflow: "clip", overflowClipMargin: 24 }}>
              <AnimatePresence mode="wait" initial={false}>
                {generating ? (
                  <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, gridAutoRows: `${CELL}px`, gridAutoFlow: "row dense", gap: GAP, width: gridWidth }}>
                    {SKELETON_LAYOUT.map((s, i) => <SkeletonWidgetCard key={i} size={s.size} variant={s.variant} />)}
                  </motion.div>
                ) : reportLayer === "explorers" ? (
                  <motion.div key="explorers-layer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, gridAutoRows: `${CELL}px`, gridAutoFlow: "row dense", gap: GAP, width: gridWidth }}>
                    {explorerCards.map((w, i) => <ExplorerRingCard key={w.id} layoutKey={cols} index={i} name={w.dimension} value={w.value} selected={w.id === scopeId} onClick={() => openScope(w)} />)}
                  </motion.div>
                ) : widgets.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} style={{ width: gridWidth, height: 344, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.gray300, background: dragOverCanvas ? T.gray50 : "transparent", border: dragOverCanvas ? "none" : `2px dashed ${T.gray100}`, borderRadius: radius.widget, gap: 8, transition: "background 120ms ease" }}>
                    <Plus size={22} />
                    <span style={{ fontSize: 12.5 }}>Drag a widget here, or ask the mascot</span>
                  </motion.div>
                ) : (
                  <motion.div key="widgets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, gridAutoRows: `${CELL}px`, gridAutoFlow: "row dense", gap: GAP, width: gridWidth }}>
                    {displayWidgets.map((w, i) => (
                      <div key={w.id} onDragOver={(e) => e.preventDefault()} onDrop={() => onWidgetDrop(w.id)} style={{ display: "contents" }}>
                        <WidgetCard layoutKey={`${cols}:${i}`} widget={w} onChangeForm={changeForm} onEdit={startEdit} onRemove={removeWidget} onRename={renameWidget} onOpenModal={report ? openWidget : setModalWidget} selected={w.id === scopeId} startHere={!!report && w.familyId === "org-score"} dragProps={{ draggable: true, onDragStart: () => onWidgetDragStart(w.id) }} />
                      </div>
                    ))}
                    {dragOverCanvas ? (
                      <div style={{ width: CELL, height: CELL, borderRadius: radius.widget, background: T.gray50, boxSizing: "border-box" }} />
                    ) : (
                      <div onClick={openLibrary} style={{ width: CELL, height: CELL, borderRadius: radius.widget, background: T.gray50, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1px dashed ${T.gray100}`, boxSizing: "border-box" }}>
                        <Plus size={20} color={T.gray300} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          <ScrollThumb target={scrollRef} />
          </div>
          </div>
          <AnimatePresence>
            {scopeWidget && (
              // The space opens at the same pace the sheet slides in: the sheet is pinned to the right edge at its full
              // width, so it moves in from the edge (and leaves the same way) instead of being uncovered left to right.
              // No fade: a solid sheet arriving reads cleaner than a translucent one. Same spring as the report.
              <motion.div
                key="scope"
                initial={{ width: 0 }}
                animate={{ width: scopeW }}
                exit={{ width: 0 }}
                transition={resizingScope ? { duration: 0 } : SCOPE_SPRING}
                style={{ flexShrink: 0, marginTop: 8, overflow: "hidden", position: "relative" }}
              >
                {!scopeExpanded && (
                  <div
                    onPointerDown={onScopeResizeStart}
                    onDoubleClick={() => setScopeCustomW(null)}
                    title="Drag to resize · double-click to reset"
                    className={`scope-resize-handle${resizingScope ? " is-resizing" : ""}`}
                  >
                    <div className="scope-resize-grip" />
                  </div>
                )}
                <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: scopeW }}>
                  <ScopePanel widget={scopeWidget} width={scopeW} expanded={scopeExpanded} onToggleExpand={() => setScopeExpanded((v) => !v)} onClose={closeScope} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
        </div>
        )}
      </div>

      {/* The mascot trigger no longer needs to shift position when chat
          opens — chat now docks left (see above), so it never overlaps
          this bottom-right button the way the old right-docked panel did. */}
      {!chatOpen && <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", bounce: 0, duration: 0.2 }}
        style={{ position: "absolute", bottom: 24, right: 24, width: 52, height: 52, padding: 0, borderRadius: 9999, background: T.gray800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.25)", zIndex: 40, overflow: "hidden" }}
      >
        <img src={mascotAvatar} width={32} height={32} alt="Ask the mascot" />
      </motion.button>}

      <DetailModal widget={modalWidget} onClose={() => setModalWidget(null)} />
    </div>
  );
}
