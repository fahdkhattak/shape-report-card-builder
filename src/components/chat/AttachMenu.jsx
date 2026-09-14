import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useFloating, offset, flip, shift, autoUpdate, FloatingPortal,
  useDismiss, useInteractions, FloatingTree, FloatingNode, useFloatingNodeId,
} from "@floating-ui/react";
import { Plus, Paperclip, Database, ChevronRight } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";

/* ================================================================== */
/* ATTACH MENU — the composer's "+" cascading menu, ported from the      */
/* chat-redesign reference (Z6YmEggwvoiX3j4d3kCKqV, node 2031:8491,      */
/* "Chat 8" — see docs/figma-chat-redesign-audit.md §1a). Three levels:  */
/* Add Files or Photos / Add Data Source / Service -> five report types, */
/* one of which ("SHAPE Performance Index") opens a further Org/Team/    */
/* Personal scope level. Built on the same @floating-ui/react nested-    */
/* menu primitives (`FloatingTree`/`FloatingNode`/`useFloatingNodeId`)   */
/* already proven in NavRail.jsx's Profile -> Switch Accounts flyout —   */
/* each new level's node id is computed inside the PREVIOUS level's own  */
/* `<FloatingNode>` subtree so a click inside a submenu is correctly     */
/* recognized as "still inside" its parent, not an outside dismiss.      */
/*                                                                      */
/* "Brain Health Report" also has a chevron-right in the reference, but  */
/* its submenu contents were never sampled (get_design_context budget    */
/* went to the confirmed Org/Team/Personal path) — rather than fabricate */
/* a guess at its contents, it's rendered here as a plain, directly-      */
/* selectable row like the other non-nested services. "Add Files or      */
/* Photos"/"Add Data Source" have no real upload mechanism in this        */
/* prototype (no backend), so they close the menu with no other effect,  */
/* the same "honest, inert" treatment already used elsewhere in this app  */
/* for controls with no real destination (NavRail's Search/Library).      */
/*                                                                      */
/* `open`/`onOpenChange` are optionally controlled (same merge pattern as */
/* NavRail's `expanded`/`onExpandedChange`) so a selection "pill" outside */
/* this component can re-open the same menu from the top.                */
/* ================================================================== */

// Exported so SearchOverlay.jsx can list these same report types under its
// "Services" section without redefining the list a second time.
export const SERVICES = [
  { id: "shape-perf", label: "SHAPE Performance Index", scoped: true },
  { id: "workplace-exp", label: "Workplace Experience Report" },
  { id: "total-brand", label: "Total Employee Brand Report" },
  { id: "brain-health", label: "Brain Health Report" },
  { id: "das", label: "DAS Report" },
];
const SCOPES = ["Org", "Team", "Personal"];

const POP_SPRING = { type: "spring", bounce: 0, duration: 0.18 };
const SHADOW_MD = "0 1px 2px rgba(0,0,0,0.14), 0 4px 4px rgba(0,0,0,0.1), 0 10px 6px rgba(0,0,0,0.06), 0 17px 7px rgba(0,0,0,0.02), 0 22px 8px rgba(0,0,0,0.01)";

function useMenuFloating({ open, onClose, placement, nodeId, gap = 4 }) {
  const { refs, floatingStyles, context } = useFloating({
    open, nodeId, placement,
    onOpenChange: (next) => { if (!next) onClose(); },
    middleware: [offset(gap), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);
  return { refs, floatingStyles, getFloatingProps };
}

function MenuShell({ floatingRef, style, floatingProps, children, width = 214 }) {
  return (
    <div ref={floatingRef} {...floatingProps} style={{ ...style, zIndex: 100 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={POP_SPRING}
        style={{ width, background: T.gray25, borderRadius: radius.lg, boxShadow: SHADOW_MD, padding: 6, fontFamily: font, boxSizing: "border-box" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function Row({ itemRef, icon, label, trailing, onClick, divider }) {
  const [hover, setHover] = useState(false);
  return (
    <>
      {divider && <div style={{ height: 1, background: T.gray100, margin: "6px 0" }} />}
      <button
        ref={itemRef}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: "100%", border: "none", background: hover ? T.gray75 : "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: radius.sm,
          fontSize: 14, fontFamily: font, color: T.gray900, textAlign: "left", boxSizing: "border-box",
        }}
      >
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
        {trailing}
      </button>
    </>
  );
}

function ScopeMenu({ floatingRef, style, floatingProps, onPick }) {
  return (
    <MenuShell floatingRef={floatingRef} style={style} floatingProps={floatingProps} width={140}>
      {SCOPES.map((s) => (
        <Row key={s} label={s} onClick={() => onPick(s)} />
      ))}
    </MenuShell>
  );
}

function ServiceMenu({ floatingRef, style, floatingProps, onFinalize }) {
  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeNodeId = useFloatingNodeId();
  const scopeFloating = useMenuFloating({ open: scopeOpen, onClose: () => setScopeOpen(false), placement: "right-start", nodeId: scopeNodeId });

  return (
    <div ref={floatingRef} {...floatingProps} style={{ ...style, zIndex: 100 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={POP_SPRING}
        style={{ width: 220, background: T.gray25, borderRadius: radius.lg, boxShadow: SHADOW_MD, padding: 6, fontFamily: font, boxSizing: "border-box" }}
      >
        {SERVICES.map((svc) =>
          svc.scoped ? (
            <Row key={svc.id} itemRef={scopeFloating.refs.setReference} label={svc.label} trailing={<ChevronRight size={16} color={T.gray400} />} onClick={() => setScopeOpen((v) => !v)} />
          ) : (
            <Row key={svc.id} label={svc.label} onClick={() => onFinalize(svc.label, null)} />
          )
        )}
      </motion.div>
      <FloatingNode id={scopeNodeId}>
        <AnimatePresence>
          {scopeOpen && (
            <FloatingPortal>
              <ScopeMenu floatingRef={scopeFloating.refs.setFloating} style={scopeFloating.floatingStyles} floatingProps={scopeFloating.getFloatingProps()} onPick={(scope) => onFinalize("SHAPE Performance Index", scope)} />
            </FloatingPortal>
          )}
        </AnimatePresence>
      </FloatingNode>
    </div>
  );
}

function MainMenu({ floatingRef, style, floatingProps, onClose, onFinalize }) {
  const [serviceOpen, setServiceOpen] = useState(false);
  const serviceNodeId = useFloatingNodeId();
  const serviceFloating = useMenuFloating({ open: serviceOpen, onClose: () => setServiceOpen(false), placement: "right-start", nodeId: serviceNodeId });

  return (
    <div ref={floatingRef} {...floatingProps} style={{ ...style, zIndex: 100 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={POP_SPRING}
        style={{ width: 214, background: T.gray25, borderRadius: radius.lg, boxShadow: SHADOW_MD, padding: 6, fontFamily: font, boxSizing: "border-box" }}
      >
        <Row icon={<Paperclip size={16} color={T.gray700} />} label="Add Files or Photos" onClick={onClose} />
        <Row icon={<Database size={16} color={T.gray700} />} label="Add Data Source" onClick={onClose} />
        <Row itemRef={serviceFloating.refs.setReference} label="Service" trailing={<ChevronRight size={16} color={T.gray400} />} onClick={() => setServiceOpen((v) => !v)} divider />
      </motion.div>
      <FloatingNode id={serviceNodeId}>
        <AnimatePresence>
          {serviceOpen && (
            <FloatingPortal>
              <ServiceMenu floatingRef={serviceFloating.refs.setFloating} style={serviceFloating.floatingStyles} floatingProps={serviceFloating.getFloatingProps()} onFinalize={onFinalize} />
            </FloatingPortal>
          )}
        </AnimatePresence>
      </FloatingNode>
    </div>
  );
}

function AttachMenuRoot({ open, onOpenChange, onSelect }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const mainNodeId = useFloatingNodeId();
  const mainFloating = useMenuFloating({ open: isOpen, onClose: () => setOpen(false), placement: "top-start", nodeId: mainNodeId, gap: 8 });

  return (
    <>
      <button
        ref={mainFloating.refs.setReference}
        onClick={() => setOpen(!isOpen)}
        title="Add or set context"
        style={{ width: 36, height: 36, border: "none", background: isOpen ? T.gray75 : "transparent", borderRadius: radius.full, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.gray700, flexShrink: 0, padding: 0 }}
      >
        <Plus size={20} />
      </button>
      <FloatingNode id={mainNodeId}>
        <AnimatePresence>
          {isOpen && (
            <FloatingPortal>
              <MainMenu
                floatingRef={mainFloating.refs.setFloating}
                style={mainFloating.floatingStyles}
                floatingProps={mainFloating.getFloatingProps()}
                onClose={() => setOpen(false)}
                onFinalize={(service, scope) => { onSelect({ service, scope }); setOpen(false); }}
              />
            </FloatingPortal>
          )}
        </AnimatePresence>
      </FloatingNode>
    </>
  );
}

export default function AttachMenu(props) {
  return (
    <FloatingTree>
      <AttachMenuRoot {...props} />
    </FloatingTree>
  );
}
