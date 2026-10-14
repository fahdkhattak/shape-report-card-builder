import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Plus, MoreHorizontal, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import {
  useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useDismiss, useInteractions,
} from "@floating-ui/react";
import { T, font, radius } from "../../lib/tokens.js";

const POP_SPRING = { type: "spring", bounce: 0, duration: 0.18 };

/* ================================================================== */
/* PAGE SIDEBAR — Survey Builder V3's left rail, modeled directly on      */
/* Survio's real "Survey pages" panel (survio.com/en/create-a-               */
/* questionnaire, section 05 "Structure and pagination"): a flat list of      */
/* pages, a "+" in the header to add one, and a per-row "..." menu for         */
/* Move up/down + Delete. Survio's own real reference also shows fixed          */
/* Welcome/Exit pages flanking the user's own — deliberately not built            */
/* here: they'd be purely cosmetic in this prototype (no real welcome/exit         */
/* copy or behavior exists anywhere else in this app to back them), and             */
/* every other page in this app already avoids decorative-only elements.             */
/* ================================================================== */

function PageMenu({ onMoveUp, onMoveDown, canMoveUp, canMoveDown, onDelete, canDelete }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open, placement: "bottom-end", onOpenChange: setOpen,
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);

  const item = (icon, label, onClick, disabled, danger) => (
    <button
      onClick={(e) => { e.stopPropagation(); if (disabled) return; onClick(); setOpen(false); }}
      disabled={disabled}
      style={{ width: "100%", border: "none", background: "transparent", cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: radius.sm, fontSize: 12.5, fontFamily: font, color: disabled ? T.gray200 : danger ? T.red : T.gray900, textAlign: "left" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? "#feebee" : T.gray75; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {icon}{label}
    </button>
  );

  return (
    <>
      <button
        ref={refs.setReference}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray400, display: "flex", padding: 4, borderRadius: radius.sm, flexShrink: 0 }}
      >
        <MoreHorizontal size={14} />
      </button>
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <motion.div ref={refs.setFloating} {...getFloatingProps()} style={{ ...floatingStyles, zIndex: 100 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -4 }} transition={POP_SPRING}
                style={{ width: 150, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.lg, boxShadow: "0 16px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)", padding: 6, boxSizing: "border-box" }}
              >
                {item(<ChevronUp size={13} />, "Move up", onMoveUp, !canMoveUp)}
                {item(<ChevronDown size={13} />, "Move down", onMoveDown, !canMoveDown)}
                {item(<Trash2 size={13} />, "Delete page", onDelete, !canDelete, true)}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

function PageRow({ page, questionCount, selected, onSelect, onRename, ...menuProps }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: radius.md, cursor: "pointer", background: selected ? T.gray75 : "transparent" }}
    >
      <FileText size={14} color={selected ? T.gray700 : T.gray300} style={{ flexShrink: 0 }} />
      {selected ? (
        <input
          value={page.name}
          onChange={(e) => onRename(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: font, fontSize: 13, fontWeight: 600, color: T.gray900, padding: 0 }}
        />
      ) : (
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: T.gray700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.name}</span>
      )}
      <span style={{ fontSize: 10.5, color: T.gray300, flexShrink: 0 }}>{questionCount}</span>
      <div style={{ opacity: hovered || selected ? 1 : 0, transition: "opacity 120ms ease", display: "flex", flexShrink: 0 }}>
        <PageMenu {...menuProps} />
      </div>
    </div>
  );
}

export default function PageSidebar({ pages, selectedPageId, onSelectPage, onAddPage, onRenamePage, onMovePage, onDeletePage }) {
  return (
    <div style={{ width: 216, flexShrink: 0, borderRight: `1px solid ${T.gray75}`, background: T.white, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px 8px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.4 }}>Survey pages</span>
        <button onClick={onAddPage} title="Add page" style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray400, display: "flex", padding: 3, borderRadius: radius.sm }}>
          <Plus size={15} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {pages.map((p, i) => (
          <PageRow
            key={p.id}
            page={p}
            questionCount={p.questions.length}
            selected={p.id === selectedPageId}
            onSelect={() => onSelectPage(p.id)}
            onRename={(name) => onRenamePage(p.id, name)}
            onMoveUp={() => onMovePage(i, i - 1)}
            onMoveDown={() => onMovePage(i, i + 1)}
            canMoveUp={i > 0}
            canMoveDown={i < pages.length - 1}
            onDelete={() => onDeletePage(p.id)}
            canDelete={pages.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
