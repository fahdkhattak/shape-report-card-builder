import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Plus } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { familyById } from "../../lib/families.js";
import { nextId } from "../../lib/id.js";
import LibraryPanel from "../library/LibraryPanel.jsx";
import ChatPanel from "../chat/ChatPanel.jsx";
import DetailModal from "../modal/DetailModal.jsx";
import NavRail from "../shell/NavRail.jsx";
import WidgetCard from "./WidgetCard.jsx";
import SkeletonWidgetCard from "./SkeletonWidgetCard.jsx";
import Button from "../ui/Button.jsx";
import mascotAvatar from "../../assets/mascot-avatar.svg";
import { CELL, GAP, colsForWidth } from "./gridLayout.js";

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
export default function CanvasScreen({ initialWidgets, scopeLabel, onExit, mainChat, initialChatOpen = false, initialGenerating = false, initialLibraryOpen = false, navExpanded, onNavExpandedChange, onOpenSearch }) {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [libCollapsed, setLibCollapsed] = useState(!initialLibraryOpen);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [generating, setGenerating] = useState(initialGenerating);
  const [editingId, setEditingId] = useState(null);
  const [modalWidget, setModalWidget] = useState(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const dragData = useRef(null);
  const scrollRef = useRef(null);
  const [cols, setCols] = useState(6);
  const pushedChecklistRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setCols(colsForWidth(el.clientWidth - GRID_CHROME));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [libCollapsed, chatOpen]);

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
        const name = w.customTitle || (w.kind === "library" ? familyById(w.familyId).name : w.spec.title);
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
    setWidgets((w) => w.map((x) => (x.id !== id || x.kind !== "library" ? x : { ...x, formIndex: (x.formIndex + 1) % familyById(x.familyId).forms.length })));
  const removeWidget = (id) => setWidgets((w) => w.filter((x) => x.id !== id));
  const renameWidget = (id, newTitle) => setWidgets((w) => w.map((x) => (x.id === id ? { ...x, customTitle: newTitle } : x)));
  const startEdit = (id) => { setLibCollapsed(true); setEditingId(id); setChatOpen(true); };
  const openLibrary = () => { setChatOpen(false); setLibCollapsed(false); };
  const toggleChat = () => { setEditingId(null); setLibCollapsed(true); setChatOpen((o) => !o); };

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
      setWidgets((w) => {
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

  const gridWidth = CELL * cols + GAP * (cols - 1);

  return (
    <div style={{ height: "100%", display: "flex", fontFamily: font, position: "relative", overflow: "hidden" }}>
      <NavRail active="org" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} />

      {/* Chat and Library share one left-of-canvas slot, mutually exclusive —
          chat now docks LEFT (per the newer side-modal reference, see
          ChatPanel.jsx's header comment), the same side Library already
          used, so only one can be open at a time; openLibrary()/toggleChat()
          above enforce that instead of letting both mount together. */}
      <AnimatePresence mode="wait">
        {chatOpen ? (
          <ChatPanel key="chat" onClose={() => setChatOpen(false)} editingWidget={editingWidget} onAddWidget={addGeneratedWidget} onReplaceWidget={replaceWidget} onCancelEdit={() => setEditingId(null)} mainChat={mainChat} reportGenerating={generating} onGeneratingComplete={() => setGenerating(false)} />
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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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

        <div
          ref={scrollRef}
          onDragOver={(e) => { e.preventDefault(); if (dragData.current?.type === "library") setDragOverCanvas(true); }}
          onDragLeave={onCanvasDragLeave}
          onDrop={onCanvasDrop}
          style={{ flex: 1, overflow: "auto", padding: 28, background: T.gray50 }}
        >
          <div style={{ background: T.white, borderRadius: radius.reportCard, padding: 32, border: `1px solid ${T.gray100}`, boxShadow: "0 22px 6px rgba(0,0,0,0.01), 0 14px 6px rgba(0,0,0,0.02), 0 8px 5px rgba(0,0,0,0.07), 0 3px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)", width: gridWidth + 64, boxSizing: "border-box" }}>
            <AnimatePresence mode="wait" initial={false}>
              {generating ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, gridAutoRows: `${CELL}px`, gap: GAP, width: gridWidth }}>
                  {SKELETON_LAYOUT.map((s, i) => <SkeletonWidgetCard key={i} size={s.size} variant={s.variant} />)}
                </motion.div>
              ) : widgets.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} style={{ width: gridWidth, height: 344, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.gray300, background: dragOverCanvas ? T.gray50 : "transparent", border: dragOverCanvas ? "none" : `2px dashed ${T.gray100}`, borderRadius: radius.widget, gap: 8, transition: "background 120ms ease" }}>
                  <Plus size={22} />
                  <span style={{ fontSize: 12.5 }}>Drag a widget here, or ask the mascot</span>
                </motion.div>
              ) : (
                <motion.div key="widgets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, gridAutoRows: `${CELL}px`, gap: GAP, width: gridWidth }}>
                  {widgets.map((w) => (
                    <div key={w.id} onDragOver={(e) => e.preventDefault()} onDrop={() => onWidgetDrop(w.id)} style={{ display: "contents" }}>
                      <WidgetCard widget={w} onChangeForm={changeForm} onEdit={startEdit} onRemove={removeWidget} onRename={renameWidget} onOpenModal={setModalWidget} dragProps={{ draggable: true, onDragStart: () => onWidgetDragStart(w.id) }} />
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
          </div>
        </div>
      </div>

      {/* The mascot trigger no longer needs to shift position when chat
          opens — chat now docks left (see above), so it never overlaps
          this bottom-right button the way the old right-docked panel did. */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", bounce: 0, duration: 0.2 }}
        style={{ position: "absolute", bottom: 24, right: 24, width: 52, height: 52, padding: 0, borderRadius: 9999, background: T.gray800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.25)", zIndex: 40, overflow: "hidden" }}
      >
        <img src={mascotAvatar} width={32} height={32} alt="Ask the mascot" />
      </motion.button>

      <DetailModal widget={modalWidget} onClose={() => setModalWidget(null)} />
    </div>
  );
}
