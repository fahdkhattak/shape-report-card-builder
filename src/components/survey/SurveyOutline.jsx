import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, ChevronUp, Trash2, Plus, GripVertical } from "lucide-react";
import {
  useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useDismiss, useInteractions,
} from "@floating-ui/react";
import { T, font, radius } from "../../lib/tokens.js";
import { QUESTION_TYPE_CATALOG, questionTypeById } from "../../lib/questionTypes.js";
import { QuestionEditorBody } from "./QuestionFields.jsx";

/* ================================================================== */
/* SURVEY OUTLINE — the Dimension > Explorer > Question tree for         */
/* Survey Builder V2. Redesigned per explicit direction ("take            */
/* liberties... how would Apple do this") away from the original           */
/* three-nested-bordered-boxes look: hierarchy now comes from               */
/* typography/spacing/color (Apple's "simplicity through hierarchy,          */
/* not boxing everything"), not from a card inside a card inside a            */
/* card. Only the Question — the thing someone actually touches most           */
/* often — gets real card elevation; Dimension/Explorer are plain             */
/* section headers with a colored accent, connected by a thin guide            */
/* line (an outline, not a box). Every dimension gets a real color from         */
/* the app's existing Graph/Dataviz palette, cycling — a categorical             */
/* distinction between sections, exactly what that palette is for per             */
/* CLAUDE.md's own status-color rule (never red/amber/green here, that's           */
/* reserved for score status elsewhere in this app).                                */
/*                                                                                   */
/* Secondary actions (move/delete) are hover-revealed, not permanently               */
/* visible — the same "control menu dims in on hover" discipline this app's           */
/* own WidgetCard already established for report widgets, applied here for            */
/* the same reason: don't make someone stare at five icons to read one line             */
/* of content. Reordering stays simple up/down buttons (no drag-and-drop                */
/* dependency) but every structural change — collapse, add, delete — now                 */
/* animates via a real spring instead of snapping, per the Apple interaction               */
/* pass's own house style (`bounce: 0` critically damped, matching NavRail.jsx's            */
/* and WidgetBuilderModal.jsx's established constants).                                      */
/* ================================================================== */

export const DIMENSION_COLORS = [T.teamBlue, T.hotPink, T.goldenYellow, T.lavender, T.turquoise, T.orgBlue, T.mintGreen];

const SPRING = { type: "spring", bounce: 0, duration: 0.35 };
const POP_SPRING = { type: "spring", bounce: 0, duration: 0.22 };

function ActionCluster({ visible, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, opacity: visible ? 1 : 0, transition: "opacity 120ms ease", flexShrink: 0 }}>
      {children}
    </div>
  );
}

function IconButton({ icon, onClick, title, disabled, danger }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      title={title}
      whileHover={disabled ? {} : { background: danger ? "#feebee" : T.gray100 }}
      whileTap={disabled ? {} : { scale: 0.9 }}
      style={{
        border: "none", background: "transparent", cursor: disabled ? "default" : "pointer",
        color: disabled ? T.gray200 : danger ? T.red : T.gray500, display: "flex", alignItems: "center", justifyContent: "center",
        width: 24, height: 24, borderRadius: radius.sm, flexShrink: 0,
      }}
    >
      {icon}
    </motion.button>
  );
}

function NameInput({ value, onChange, placeholder, style }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ border: "none", background: "transparent", outline: "none", fontFamily: font, color: T.gray900, minWidth: 0, padding: "2px 0", ...style }}
    />
  );
}

// A quiet "+ Add..." list row (Apple Reminders/Notes' own "add new item"
// convention) rather than a boxed button — reads as extending the list,
// not as a separate control floating below it.
function AddRow({ label, onClick, color }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer",
        padding: "6px 4px", fontSize: 13, fontWeight: 500, color: color ?? T.gray400, fontFamily: font,
      }}
    >
      <Plus size={14} />
      {label}
    </motion.button>
  );
}

// Real dropdown list (one column, icon + label per row) for adding a
// question — replaces an earlier icon-tile-grid popover that had a real,
// confirmed bug: it lived inside ExplorerBlock's/DimensionBlock's own
// `overflow:hidden` collapse-animation wrapper (needed there so the
// section's height spring doesn't reveal unrendered content mid-animation),
// which silently clipped the popover to near-zero visible area the moment
// it opened — DOM inspection confirmed it rendered correctly (opacity 1,
// right position, all 9 rows present) but was invisible on screen, exactly
// matching the "the questions aren't completely working correctly" report.
// Fixed the same way NavRail.jsx/AttachMenu.jsx already fixed this identical
// class of bug for their own floating menus: render through
// `@floating-ui/react`'s `FloatingPortal` straight to `document.body`, so no
// ancestor's overflow can clip it again, with `useDismiss` handling
// outside-click/Escape instead of a hand-rolled full-screen catcher.
export function QuestionTypePicker({ onPick, label = "Add Question" }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    placement: "bottom-start",
    onOpenChange: setOpen,
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);

  return (
    <>
      <div ref={refs.setReference}>
        <AddRow label={label} onClick={() => setOpen((v) => !v)} color={T.accent} />
      </div>
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={refs.setFloating}
              {...getFloatingProps()}
              style={{ ...floatingStyles, zIndex: 100 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={POP_SPRING}
                style={{ transformOrigin: "top left", width: 236, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.lg, boxShadow: "0 16px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)", padding: 6, boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: font, maxHeight: 320, overflowY: "auto" }}
              >
                {QUESTION_TYPE_CATALOG.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { onPick(t.id); setOpen(false); }}
                      style={{ border: "none", background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: radius.sm, fontSize: 13, fontFamily: font, color: T.gray900, boxSizing: "border-box", width: "100%" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = T.gray75; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ width: 24, height: 24, flexShrink: 0, borderRadius: radius.sm, background: `${T.accent}1f`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={13} color={T.accent} />
                      </div>
                      {t.label}
                    </button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

function QuestionRow({ question, onPatch, onDelete, onMove, canMoveUp, canMoveDown }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const type = questionTypeById(question.questionType);
  const Icon = type?.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={SPRING}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: T.white, borderRadius: radius.lg, marginBottom: 6, boxShadow: hovered ? "0 4px 14px rgba(0,0,0,0.08)" : "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}
    >
      <div onClick={() => setExpanded((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }}>
        {Icon && (
          <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: radius.sm, background: `${T.accent}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={14} color={T.accent} />
          </div>
        )}
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {question.prompt || <span style={{ color: T.gray300 }}>Untitled {type?.label.toLowerCase()} question</span>}
        </span>
        <span style={{ fontSize: 10.5, color: T.gray300, flexShrink: 0 }}>{type?.label}</span>
        <ActionCluster visible={hovered}>
          <IconButton icon={<ChevronUp size={13} />} onClick={(e) => { e.stopPropagation(); onMove(-1); }} disabled={!canMoveUp} title="Move up" />
          <IconButton icon={<ChevronDown size={13} />} onClick={(e) => { e.stopPropagation(); onMove(1); }} disabled={!canMoveDown} title="Move down" />
          <IconButton icon={<Trash2 size={13} />} onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete question" danger />
        </ActionCluster>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={POP_SPRING} style={{ display: "flex", flexShrink: 0, color: T.gray300 }}>
          <ChevronRight size={14} />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
            <div style={{ borderTop: `1px solid ${T.gray75}` }} onClick={(e) => e.stopPropagation()}>
              <QuestionEditorBody data={question} onPatch={onPatch} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExplorerBlock({ explorer, color, onRename, onDelete, onMove, canMoveUp, canMoveDown, onAddQuestion, onPatchQuestion, onDeleteQuestion, onMoveQuestion }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ marginBottom: 14, paddingLeft: 18, borderLeft: `2px solid ${color}33` }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <button onClick={() => setCollapsed((v) => !v)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", color: T.gray300, flexShrink: 0, padding: 2 }}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
        <div style={{ width: 6, height: 6, borderRadius: 9999, background: color, flexShrink: 0 }} />
        <NameInput value={explorer.name} onChange={onRename} placeholder="Explorer name" style={{ fontSize: 14, fontWeight: 600, flex: 1 }} />
        <span style={{ fontSize: 11, color: T.gray300, flexShrink: 0 }}>{explorer.questions.length}</span>
        <ActionCluster visible={hovered}>
          <IconButton icon={<ChevronUp size={13} />} onClick={() => onMove(-1)} disabled={!canMoveUp} title="Move up" />
          <IconButton icon={<ChevronDown size={13} />} onClick={() => onMove(1)} disabled={!canMoveDown} title="Move down" />
          <IconButton icon={<Trash2 size={13} />} onClick={onDelete} title="Delete explorer" danger />
        </ActionCluster>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
            <AnimatePresence initial={false}>
              {explorer.questions.map((q, i) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  onPatch={(patch) => onPatchQuestion(q.id, patch)}
                  onDelete={() => onDeleteQuestion(q.id)}
                  onMove={(dir) => onMoveQuestion(i, i + dir)}
                  canMoveUp={i > 0}
                  canMoveDown={i < explorer.questions.length - 1}
                />
              ))}
            </AnimatePresence>
            <QuestionTypePicker onPick={onAddQuestion} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DimensionBlock({ dimension, color, onRename, onDelete, onMove, canMoveUp, canMoveDown, onAddExplorer, onPatchExplorer, onDeleteExplorer, onMoveExplorer, onAddQuestion, onPatchQuestion, onDeleteQuestion, onMoveQuestion }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const totalQuestions = dimension.explorers.reduce((n, e) => n + e.questions.length, 0);

  return (
    <motion.div layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={SPRING} style={{ marginBottom: 28 }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ opacity: hovered ? 1 : 0, transition: "opacity 120ms ease", display: "flex", flexShrink: 0 }}>
          <GripVertical size={14} color={T.gray300} />
        </div>
        <button onClick={() => setCollapsed((v) => !v)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", color: T.gray400, flexShrink: 0, padding: 2 }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: radius.md, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: color }} />
        </div>
        <NameInput value={dimension.name} onChange={onRename} placeholder="Dimension name" style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", flex: 1 }} />
        <span style={{ fontSize: 11.5, color: T.gray300, flexShrink: 0, whiteSpace: "nowrap" }}>
          {dimension.explorers.length} explorer{dimension.explorers.length === 1 ? "" : "s"} · {totalQuestions} question{totalQuestions === 1 ? "" : "s"}
        </span>
        <ActionCluster visible={hovered}>
          <IconButton icon={<ChevronUp size={14} />} onClick={() => onMove(-1)} disabled={!canMoveUp} title="Move up" />
          <IconButton icon={<ChevronDown size={14} />} onClick={() => onMove(1)} disabled={!canMoveDown} title="Move down" />
          <IconButton icon={<Trash2 size={14} />} onClick={onDelete} title="Delete dimension" danger />
        </ActionCluster>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
            <div style={{ paddingLeft: 4 }}>
              <AnimatePresence initial={false}>
                {dimension.explorers.map((exp, i) => (
                  <ExplorerBlock
                    key={exp.id}
                    explorer={exp}
                    color={color}
                    onRename={(name) => onPatchExplorer(exp.id, { name })}
                    onDelete={() => onDeleteExplorer(exp.id)}
                    onMove={(dir) => onMoveExplorer(i, i + dir)}
                    canMoveUp={i > 0}
                    canMoveDown={i < dimension.explorers.length - 1}
                    onAddQuestion={(questionType) => onAddQuestion(exp.id, questionType)}
                    onPatchQuestion={(qId, patch) => onPatchQuestion(exp.id, qId, patch)}
                    onDeleteQuestion={(qId) => onDeleteQuestion(exp.id, qId)}
                    onMoveQuestion={(from, to) => onMoveQuestion(exp.id, from, to)}
                  />
                ))}
              </AnimatePresence>
              <div style={{ paddingLeft: 18 }}>
                <AddRow label="Add Explorer" onClick={onAddExplorer} color={color} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
