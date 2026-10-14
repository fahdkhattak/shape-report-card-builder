import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pencil, Copy, Workflow, ArrowUpDown, Trash2, Info, ChevronUp, ChevronDown } from "lucide-react";
import {
  useFloating, offset, flip, shift, autoUpdate, useDismiss, useInteractions, FloatingPortal,
} from "@floating-ui/react";
import { T, font, radius } from "../../lib/tokens.js";
import { questionTypeById } from "../../lib/questionTypes.js";
import { QuestionEditorBody } from "./QuestionFields.jsx";
import QuestionBody from "./respond/QuestionBody.jsx";
import ToggleBoardRespond from "./respond/ToggleBoardRespond.jsx";
import CustomRespond from "./respond/CustomRespond.jsx";
import LogicPopover from "./LogicPopover.jsx";

const SPRING = { type: "spring", bounce: 0, duration: 0.3 };

// A real, inert preview of the respondent-facing body — reuses the exact
// same renderers PreviewModal(V1/V2/V3) use, wrapped so nothing in them is
// actually clickable inside the builder (a plain visual reference for the
// author, matching what Survio's real editor blocks show: the *actual*
// question, not an abstract summary card).
function LivePreviewBody({ questionType, typeData }) {
  const noop = () => {};
  return (
    <div style={{ pointerEvents: "none" }}>
      {questionType === "toggle-board" ? (
        <ToggleBoardRespond typeData={typeData} value={undefined} onChange={noop} />
      ) : questionType === "custom" ? (
        <CustomRespond typeData={typeData} value={undefined} onChange={noop} />
      ) : (
        <QuestionBody questionType={questionType} typeData={typeData} value={undefined} onChange={noop} />
      )}
    </div>
  );
}

// The floating dark pill toolbar — Edit/Copy/Logic/Move/Delete — modeled
// directly on the real hover toolbar in Survio's own screenshots
// (survio.com/en/create-a-questionnaire): a dark rounded pill, icon+label
// buttons, anchored above the block's top-right corner.
function BlockToolbar({ editing, onEdit, onCopy, logicRef, onLogic, logicActive, moveRef, onMove, moveActive, onDelete }) {
  const item = (label, icon, onClick, active, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5, border: "none", cursor: "pointer",
        background: active ? "rgba(255,255,255,0.18)" : "transparent", color: "#fff",
        padding: "6px 9px", borderRadius: radius.sm, fontSize: 11.5, fontWeight: 600, fontFamily: font,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {icon}{label}
    </button>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }} transition={{ ...SPRING, duration: 0.18 }}
      style={{ position: "absolute", top: -18, right: 12, zIndex: 5, display: "flex", alignItems: "center", gap: 1, background: T.gray900, borderRadius: radius.md, padding: 3, boxShadow: "0 6px 18px rgba(0,0,0,0.22)" }}
    >
      {item("Edit", <Pencil size={12} />, onEdit, editing)}
      {item("Copy", <Copy size={12} />, onCopy)}
      {item("Logic", <Workflow size={12} />, onLogic, logicActive, logicRef)}
      {item("Move", <ArrowUpDown size={12} />, onMove, moveActive, moveRef)}
      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.18)", margin: "0 2px" }} />
      <button onClick={onDelete} style={{ display: "flex", border: "none", background: "transparent", cursor: "pointer", color: "#ff8a8a", padding: "6px 8px", borderRadius: radius.sm }}>
        <Trash2 size={12} />
      </button>
    </motion.div>
  );
}

function MoveMenu({ open, onClose, canMoveUp, canMoveDown, onMoveUp, onMoveDown, pages, currentPageId, onMoveToPage, floatingRef, style, floatingProps }) {
  const item = (icon, label, onClick, disabled) => (
    <button
      onClick={() => { if (disabled) return; onClick(); onClose(); }}
      disabled={disabled}
      style={{ width: "100%", border: "none", background: "transparent", cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: radius.sm, fontSize: 12.5, fontFamily: font, color: disabled ? T.gray200 : T.gray900, textAlign: "left" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = T.gray75; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {icon}{label}
    </button>
  );
  return (
    <FloatingPortal>
      <AnimatePresence>
        {open && (
          <div ref={floatingRef} {...floatingProps} style={{ ...style, zIndex: 110 }}>
            <motion.div initial={{ opacity: 0, scale: 0.94, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -4 }} transition={{ type: "spring", bounce: 0, duration: 0.18 }}
              style={{ width: 190, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.lg, boxShadow: "0 16px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)", padding: 6, boxSizing: "border-box" }}>
              {item(<ChevronUp size={13} />, "Move up", onMoveUp, !canMoveUp)}
              {item(<ChevronDown size={13} />, "Move down", onMoveDown, !canMoveDown)}
              {pages.length > 1 && (
                <>
                  <div style={{ height: 1, background: T.gray75, margin: "4px 6px" }} />
                  <div style={{ padding: "4px 10px 2px", fontSize: 10.5, fontWeight: 700, color: T.gray300, textTransform: "uppercase" }}>Move to page</div>
                  {pages.filter((p) => p.id !== currentPageId).map((p) => (
                    <div key={p.id}>{item(<div style={{ width: 13 }} />, p.name, () => onMoveToPage(p.id))}</div>
                  ))}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}

export default function QuestionBlockV3({ question, pages, currentPageId, otherRows, onPatch, onDelete, onDuplicate, onMoveUp, onMoveDown, canMoveUp, canMoveDown, onMoveToPage }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [logicOpen, setLogicOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const type = questionTypeById(question.questionType);

  const logicFloating = useFloating({
    open: logicOpen, placement: "bottom-end", onOpenChange: setLogicOpen,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })], whileElementsMounted: autoUpdate,
  });
  const logicDismiss = useDismiss(logicFloating.context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps: getLogicFloatingProps } = useInteractions([logicDismiss]);

  const moveFloating = useFloating({
    open: moveOpen, placement: "bottom-end", onOpenChange: setMoveOpen,
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })], whileElementsMounted: autoUpdate,
  });
  const moveDismiss = useDismiss(moveFloating.context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps: getMoveFloatingProps } = useInteractions([moveDismiss]);

  return (
    <motion.div
      layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={SPRING}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.lg, marginBottom: 20, marginTop: 14, boxShadow: hovered || editing ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 2px rgba(0,0,0,0.03)" }}
    >
      <AnimatePresence>
        {(hovered || editing || logicOpen || moveOpen) && (
          <BlockToolbar
            editing={editing}
            onEdit={() => setEditing((v) => !v)}
            onCopy={onDuplicate}
            logicRef={logicFloating.refs.setReference}
            onLogic={() => setLogicOpen((v) => !v)}
            logicActive={!!question.skipRule}
            moveRef={moveFloating.refs.setReference}
            onMove={() => setMoveOpen((v) => !v)}
            moveActive={moveOpen}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>

      {editing ? (
        <div>
          <QuestionEditorBody data={question} onPatch={onPatch} />
        </div>
      ) : (
        <div onClick={() => setEditing(true)} style={{ padding: 18, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: T.gray900, lineHeight: 1.4 }}>
              {question.prompt || <span style={{ color: T.gray300, fontWeight: 500 }}>Untitled {type?.label.toLowerCase()} question</span>}
            </span>
            {question.helpText && <Info size={13} color={T.gray400} title={question.helpText} />}
          </div>
          <LivePreviewBody questionType={question.questionType} typeData={question.typeData} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.gray75}` }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: T.gray300, textTransform: "uppercase" }}>{type?.label}</span>
            {question.required && <span style={{ fontSize: 10.5, color: T.gray300 }}>· Required</span>}
            {question.skipRule && <span style={{ fontSize: 10.5, color: T.accent, display: "flex", alignItems: "center", gap: 3 }}><Workflow size={10} /> Has skip logic</span>}
          </div>
        </div>
      )}

      <LogicPopover
        open={logicOpen}
        floatingRef={logicFloating.refs.setFloating}
        style={logicFloating.floatingStyles}
        floatingProps={getLogicFloatingProps()}
        question={question}
        otherRows={otherRows}
        onPatch={onPatch}
      />
      <MoveMenu
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        pages={pages}
        currentPageId={currentPageId}
        onMoveToPage={onMoveToPage}
        floatingRef={moveFloating.refs.setFloating}
        style={moveFloating.floatingStyles}
        floatingProps={getMoveFloatingProps()}
      />
    </motion.div>
  );
}
