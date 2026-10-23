import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Maximize2, Minimize2, X } from "lucide-react";
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useDismiss, useInteractions } from "@floating-ui/react";
import { T, font, radius } from "../../lib/tokens.js";
import { familyById, formTitle } from "../../lib/families.js";
import { sizeToSpan, pxForSpan } from "../canvas/gridLayout.js";
import WidgetBody from "../widgets/WidgetBody.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import { Header } from "../widgets/primitives.jsx";
import Button from "../ui/Button.jsx";
import { ScopeCard, ScopeCardTitle } from "./stories/StoryCard.jsx";
import ScopeRecipe, { hasRecipe, ExplorerScope } from "./scopeRecipes.jsx";
import BuiltScope from "../widgetbuilder/BuiltScope.jsx";
import ShapeScope, { shapeScopeTitle } from "../shape/shapeScopes.jsx";
import { ScopeNavContext } from "./scopeNav.js";
import { useLayerStack, LayerBody, Breadcrumb } from "./layers.jsx";
import { StoryStyleContext } from "./stories/storyStyle.js";
import { ScrollThumb } from "../ui/MinimalScroll.jsx";
import { FullScopeContext, FULL_SCOPE_FAMILIES, isFullScope } from "./full/fullScope.js";
import HeatMapScope from "./full/HeatMapScope.jsx";
import ResponseAnalysisScope from "./full/ResponseAnalysisScope.jsx";

/* The report's Scopes always draw the Current Story style (product decision). The Current | Refined switch stays only
   where design is still being explored: the Widget Builder and the Developer pages. */

const ZOOMS = [50, 75, 100, 125];
const DEFAULT_ZOOM = 75;
const POP_SPRING = { type: "spring", bounce: 0, duration: 0.18 };

/* ================================================================== */
/* SCOPE PANEL — what opens beside the report when a widget is clicked    */
/* (Figma node 14463:13793, "Scopes"). A 44px header (title, zoom menu,   */
/* expand, close) over a scrolling body of white cards on a white sheet    */
/* that rounds only its left corners, tucked 8px under the report's top    */
/* bar. The Figma "75%" is the content zoom — 75% is the design's native   */
/* size, so the body scales by pct/75 via CSS `zoom`.                      */
/*                                                                         */
/* The body is a stack of Stories chosen per widget (scopeRecipes.jsx,     */
/* Figma board 13622:35945). A widget with no data behind it falls back to */
/* a generic Scope — its blurb plus the widget at native size.             */
/* ================================================================== */
function ZoomMenu({ zoom, onChange }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({ open, onOpenChange: setOpen, placement: "bottom-end", middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })], whileElementsMounted: autoUpdate });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);
  return (
    <>
      <span ref={refs.setReference} style={{ display: "inline-flex" }}>
        <Button theme="brand" variation="ghost" size="xs" iconRight={<ChevronDown size={20} />} onClick={() => setOpen((v) => !v)} style={{ fontWeight: 500 }}>{zoom}%</Button>
      </span>
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <div ref={refs.setFloating} {...getFloatingProps()} style={{ ...floatingStyles, zIndex: 100 }}>
              <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={POP_SPRING}
                style={{ transformOrigin: "top right", width: 110, background: T.gray25, borderRadius: radius.lg, padding: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.14), 0 4px 4px rgba(0,0,0,0.1), 0 10px 6px rgba(0,0,0,0.06)", fontFamily: font }}>
                {ZOOMS.map((z) => (
                  <button key={z} onClick={() => { onChange(z); setOpen(false); }}
                    style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: "8px 12px", borderRadius: radius.sm, fontSize: 14, fontFamily: font, color: T.gray900, fontWeight: z === zoom ? 700 : 400 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.gray75; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    {z}%
                  </button>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

function GenericScope({ widget }) {
  const isLib = widget.kind === "library";
  const family = isLib ? familyById(widget.familyId) : null;
  const size = isLib ? family.forms[widget.formIndex].size : widget.spec.size;
  const span = sizeToSpan(size);
  const title = widget.customTitle || (isLib ? formTitle(widget.familyId, widget.formIndex) : widget.spec.title);
  const about = isLib ? family.blurb : widget.spec.explanation;
  return (
    <>
      <ScopeCard>
        <ScopeCardTitle>About this widget</ScopeCardTitle>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: T.gray700 }}>{about}</p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: T.gray500 }}>This widget has no data behind it yet, so its Scope is a placeholder.</p>
      </ScopeCard>
      <ScopeCard>
        <ScopeCardTitle>{title}</ScopeCardTitle>
        <div style={{ width: pxForSpan(span.col), height: pxForSpan(span.row), maxWidth: "100%", border: `1px solid ${T.gray100}`, borderRadius: radius.widget, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box" }}>
          <Header title={title} />
          {isLib ? <WidgetBody familyId={widget.familyId} formIndex={widget.formIndex} /> : <GeneratedBody spec={widget.spec} />}
        </div>
      </ScopeCard>
    </>
  );
}

export function scopeTitle(widget) {
  if (widget.kind === "explorer") return widget.dimension;
  if (widget.kind === "shape") return widget.customTitle || shapeScopeTitle(widget);
  if (isFullScope(widget)) return FULL_SCOPE_FAMILIES[widget.familyId];
  if (widget.familyId === "org-score") return "Your Headline Score";
  return widget.customTitle || (widget.kind === "library" ? formTitle(widget.familyId, widget.formIndex) : widget.spec.title);
}

/* `sheet`: the phone layout (Figma "Mobile Behavior Scope" 14679:86632) — the Scope rises as a sheet over the dimmed
   report: top corners rounded, Stories 16px from the edges, no expand (it's already full width). */
// `hideClose`: the iPhone Duo keeps Close in its vertical bar (outer display) or has none (the inner display's detail pane).
export default function ScopePanel({ widget, width, expanded, onToggleExpand, onClose, sheet = false, hideClose = false }) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const storyStyle = "classic";
  // Stories shrink to 344px (24px side padding) before anything else; once they hit
  // their 808px cap the padding grows instead, up to 96px at the 1000px maximum.
  const padX = sheet ? 16 : width <= 856 ? 24 : Math.min(96, (width - 808) / 2);

  // Layers: a Story can open a deeper layer (Actions) — see layers.jsx. Opening
  // one scrolls to the top; coming back restores where you were. Esc steps back
  // one layer before it closes the Scope.
  const layers = useLayerStack(widget.id);
  const scrollRef = useRef(null);
  const firstWidget = useRef(widget.id);
  // A different widget's Scope starts at its top, not wherever the last one was scrolled to.
  useLayoutEffect(() => { if (scrollRef.current && firstWidget.current !== widget.id) scrollRef.current.scrollTop = 0; }, [widget.id]);
  const savedScroll = useRef(0);
  const nav = { depth: layers.depth, open: (l) => { savedScroll.current = scrollRef.current?.scrollTop || 0; layers.push(l); } };
  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = layers.depth ? 0 : savedScroll.current; }, [layers.depth]);
  // Full-view Scopes (Heat Map, Response Analysis) only exist expanded: while one is showing (no layer open) the pane asks
  // to be expanded and hides the collapse button. A group opened from the Heat Map is a regular Scope, so it can collapse
  // to sit beside the report; going back to the map expands again (Figma flow 15299:47644).
  const full = isFullScope(widget);
  const fullRoot = full && layers.depth === 0;
  const [toolsEl, setToolsEl] = useState(null);
  useEffect(() => { if (fullRoot && !expanded && onToggleExpand && !sheet) onToggleExpand(); }, [fullRoot, expanded]);
  const fullCtx = { toolsEl, openGroup: (row) => nav.open({ kind: "group", label: row.parent ? `${row.parent.label} · ${row.label}` : row.label, row }) };
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && layers.depth > 0) { e.stopImmediatePropagation(); layers.pop(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [layers.depth]);

  return (
    <div style={{ width: "100%", height: "100%", background: T.white, borderTopLeftRadius: radius.widget, borderBottomLeftRadius: sheet ? 0 : radius.widget, borderTopRightRadius: sheet ? radius.widget : 0, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font }}>
      <div style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: sheet ? "0 12px 0 20px" : "0 12px 0 32px", background: T.white }}>
        {layers.layer ? (
          <Breadcrumb rootTitle={scopeTitle(widget)} layer={layers.layer} onBack={layers.pop} onRoot={layers.reset} />
        ) : (
          <span title={scopeTitle(widget)} style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: T.gray700, lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scopeTitle(widget)}</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 12 }}>
          {full && <div ref={setToolsEl} style={{ display: fullRoot ? "flex" : "none", alignItems: "center", gap: 12 }} />}
          <ZoomMenu zoom={zoom} onChange={setZoom} />
          {!sheet && onToggleExpand && !fullRoot && <Button theme="brand" variation="ghost" size="xs" iconLeft={expanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />} onClick={onToggleExpand} title={expanded ? "Back to report" : "Expand"} style={{ width: 28, height: 28, padding: 0 }} />}
          {!hideClose && <Button theme="brand" variation="ghost" size="xs" iconLeft={<X size={20} />} onClick={onClose} title="Close" style={{ width: 28, height: 28, padding: 0 }} />}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
      {/* A full-view Scope fills the body, zoomed as a whole (drawn at 1/zoom of the space, then zoomed up), and stays
          mounted while a group layer is open so its grouping, filters and opened columns are still there on the way back. */}
      {full && (
        <div style={{ position: "absolute", inset: 0, display: fullRoot ? "block" : "none", overflow: "hidden" }}>
          <div style={{ position: "relative", width: `${(100 * DEFAULT_ZOOM) / zoom}%`, height: `${(100 * DEFAULT_ZOOM) / zoom}%`, zoom: zoom / DEFAULT_ZOOM }}>
            <FullScopeContext.Provider value={fullCtx}>{widget.familyId === "heat-map" ? <HeatMapScope /> : <ResponseAnalysisScope />}</FullScopeContext.Provider>
          </div>
        </div>
      )}
      {!fullRoot && <>
      {/* Scroll-edge fade, the same treatment as the chat panel's: a plain
          white-to-transparent gradient, so content dissolves under the header
          instead of being cut off (or blurred into a block). */}
      <div
        aria-hidden
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, zIndex: 3, pointerEvents: "none", background: `linear-gradient(${T.white}, ${T.white}00)` }}
      />
      <div ref={scrollRef} className="scroll-minimal" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: sheet ? `24px ${padX}px 48px` : `48px ${padX}px` }}>
        <ScopeNavContext.Provider value={nav}>
        <StoryStyleContext.Provider value={storyStyle}>
        <div style={{ zoom: zoom / DEFAULT_ZOOM, display: "flex", flexDirection: "column", gap: storyStyle === "refined" ? 20 : 16, maxWidth: 808, margin: "0 auto" }}>
          {layers.layer && <LayerBody layer={layers.layer} />}
          {/* Switching to another widget's Scope: the new content settles in (a short fade and a 6px rise) from the top
              of the pane. The first open has no fade; the sheet's own slide carries that. */}
          <motion.div key={widget.id} initial={firstWidget.current === widget.id ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} style={{ display: layers.depth || full ? "none" : "flex", flexDirection: "column", gap: storyStyle === "refined" ? 20 : 16 }}>
          {full ? null : widget.kind === "explorer" ? <ExplorerScope dimension={widget.dimension} /> : widget.kind === "shape" ? <ShapeScope widget={widget} /> : widget.scope ? <BuiltScope scope={widget.scope} spec={widget.spec} /> : widget.kind === "library" && hasRecipe(widget.familyId) ? <ScopeRecipe familyId={widget.familyId} /> : <GenericScope widget={widget} />}
          </motion.div>
        </div>
        </StoryStyleContext.Provider>
        </ScopeNavContext.Provider>
      </div>
      <ScrollThumb target={scrollRef} />
      </>}
      </div>
    </div>
  );
}
