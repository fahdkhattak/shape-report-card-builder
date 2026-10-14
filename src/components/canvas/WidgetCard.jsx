import { useState } from "react";
import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { dsShadow } from "../../lib/ds.js";
import { familyById, formTitle, cardSurface, nextFormIndex } from "../../lib/families.js";
import WidgetBody from "../widgets/WidgetBody.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import { Header } from "../widgets/primitives.jsx";
import { sizeToSpan, pxForSpan } from "./gridLayout.js";
import { DotsButton, WidgetMenu } from "./WidgetMenu.jsx";

/* ================================================================== */
/* WIDGET CARD (canvas instance) — handles both kinds:                 */
/* library-sourced (fixed family/form) and generated (chat spec).      */
/*                                                                      */
/* Hover (Figma "Hovers" 15266:24599): the card lifts — the md shadow    */
/* and a 2px rise — and the three-dot button fades in at its top-right   */
/* corner; the menu opens beside the card (WidgetMenu.jsx).               */
/* Press: a quick squash (0.97) on pointer-down, released on a slightly   */
/* bouncy spring, so the card feels like it gives and springs back before */
/* its Scope opens. Reduced motion is honoured globally (MotionConfig).   */
/* Two layers: the outer cell owns the grid placement and native HTML5     */
/* drag-and-drop (motion would take over onDrag* handlers on its own       */
/* elements); the inner motion layer is the card you see.                 */
/* ================================================================== */
const LIFT = { type: "spring", bounce: 0.3, duration: 0.35 };
const PRESS = { type: "spring", bounce: 0.45, duration: 0.4 };
const GLIDE = { type: "spring", bounce: 0, duration: 0.5 }; // the report reflow (same spring as the Scope, CanvasScreen.jsx)

export default function WidgetCard({ widget, onChangeForm, onEdit, onRemove, onRename, dragProps, onOpenModal, selected = false, startHere = false, layoutKey }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [hover, setHover] = useState(false);
  const [cardEl, setCardEl] = useState(null);
  const isLib = widget.kind === "library";
  const family = isLib ? familyById(widget.familyId) : null;
  const size = isLib ? family.forms[widget.formIndex].size : widget.spec.size;
  const span = sizeToSpan(size);
  const defaultTitle = isLib ? formTitle(widget.familyId, widget.formIndex) : widget.spec.title;
  const surface = isLib ? cardSurface(widget.familyId, widget.formIndex) : {};
  const title = widget.customTitle || defaultTitle;
  const canChange = isLib && nextFormIndex(widget.familyId, widget.formIndex) !== widget.formIndex;
  const raised = hover || menuOpen || selected;

  return (
    <div
      {...dragProps}
      data-widget-id={widget.id}
      style={{ gridColumn: `span ${span.col}`, gridRow: `span ${span.row}`, width: pxForSpan(span.col), height: pxForSpan(span.row), position: "relative", zIndex: menuOpen ? 5 : undefined }}
    >
      <motion.div
        ref={setCardEl}
        // When the report changes its column count (a Scope opening or closing), each card glides from its old cell to
        // its new one instead of jumping. Only then: `layoutKey` changes with the column count and the card's place.
        layout="position"
        layoutDependency={layoutKey}
        onClick={() => !renaming && onOpenModal(widget)}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
        initial={false}
        animate={{ y: raised && !selected ? -2 : 0 }}
        whileTap={renaming ? undefined : { scale: 0.97, y: 0, transition: { duration: 0.08 } }}
        transition={{ ...PRESS, layout: GLIDE }}
        style={{
          width: "100%", height: "100%",
          background: surface.background || T.white,
          border: `1px solid ${selected ? T.gray500 : surface.borderColor || T.gray100}`,
          boxShadow: raised ? dsShadow("md") : "0 0 0 rgba(0,0,0,0)",
          transition: "box-shadow 200ms ease, border-color 200ms ease",
          borderRadius: radius.widget,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          position: "relative",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        {startHere && (
          <span style={{ position: "absolute", top: -11, left: 16, zIndex: 2, display: "flex", alignItems: "center", gap: 4, background: T.gray900, color: T.white, fontSize: 11, lineHeight: "16px", padding: "2px 8px 2px 6px", borderRadius: radius.sm, pointerEvents: "none" }}>
            <ArrowDown size={11} />Start here
          </span>
        )}
        {/* The header is a direct child of the card, so it can measure the card (two lines only when the content has room). */}
        {renaming ? (
          <input
            autoFocus
            defaultValue={title}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => { onRename(widget.id, e.target.value.trim() || title); setRenaming(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.11px", textTransform: "uppercase", color: T.gray700, border: `1px solid ${T.accent}`, borderRadius: 4, padding: "1px 4px", width: "100%", boxSizing: "border-box", fontFamily: font }}
          />
        ) : (
          <Header title={title} estimated={!isLib && widget.spec.real === false} />
        )}

        {isLib ? <WidgetBody familyId={widget.familyId} formIndex={widget.formIndex} /> : <GeneratedBody spec={widget.spec} />}

        <DotsButton open={menuOpen} visible={hover} onToggle={() => setMenuOpen((v) => !v)} />
      </motion.div>
      <WidgetMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        anchor={cardEl}
        onChange={canChange ? () => onChangeForm(widget.id) : null}
        onAbout={() => onOpenModal(widget)}
        onRename={() => setRenaming(true)}
        onEdit={() => onEdit(widget.id)}
        onRemove={() => onRemove(widget.id)}
      />
    </div>
  );
}
