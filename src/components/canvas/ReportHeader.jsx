import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, SlidersHorizontal, MoreHorizontal, BarChart3, Plus, Monitor, Smartphone, Columns2 } from "lucide-react";
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useDismiss, useInteractions } from "@floating-ui/react";
import { T, font, radius } from "../../lib/tokens.js";
import Button from "../ui/Button.jsx";

const POP_SPRING = { type: "spring", bounce: 0, duration: 0.18 };
const PERSONAS = ["Personal", "Team", "Org"];

/* ================================================================== */
/* REPORT HEADER — the two-row header the real SHAPE Performance        */
/* report uses (984qJvMt7fCHASYHRwgrab, node 11070:9301): a 44px white   */
/* bar (report title | persona menu ... round picker, Filter, "...") over */
/* a gray sub-bar (report-type breadcrumb ... Add Widget).               */
/*                                                                       */
/* Only what has a real backing is live: the persona menu shows Personal/ */
/* Team/Org but only Org has a report built; the round picker shows the   */
/* latest round with its arrows disabled (every widget reads the latest   */
/* round, there's no per-round data threading yet); Filter and "..." are  */
/* inert — no filter model or report-actions exist anywhere in this app.  */
/* ================================================================== */
export function GhostBtn({ children, icon, iconRight, disabled, style, ...rest }) {
  return (
    <Button theme="brand" variation="ghost" size="xs" iconLeft={icon} iconRight={iconRight} disabled={disabled} style={{ height: 36, padding: children ? "8px 16px" : 8, ...style }} {...rest}>
      {children}
    </Button>
  );
}

/* `personas` (optional): this report's own versions, `[{ label, onSelect }]`. A version with no onSelect is shown but does
   nothing (the old Performance report's Personal and Team aren't built). Without `personas`, the three labels are inert. */
export function PersonaMenu({ persona, personas }) {
  const list = personas || PERSONAS.map((label) => ({ label }));
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({ open, onOpenChange: setOpen, placement: "bottom-start", middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })], whileElementsMounted: autoUpdate });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);
  return (
    <>
      <button
        ref={refs.setReference}
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, border: "none", background: "transparent", cursor: "pointer", fontFamily: font, fontSize: 14, color: T.gray700, padding: "4px 8px", borderRadius: radius.sm }}
      >
        {persona}
        <ChevronDown size={20} color={T.gray700} />
      </button>
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <div ref={refs.setFloating} {...getFloatingProps()} style={{ ...floatingStyles, zIndex: 100 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={POP_SPRING}
                style={{ transformOrigin: "top left", width: 160, background: T.gray25, borderRadius: radius.lg, padding: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.14), 0 4px 4px rgba(0,0,0,0.1), 0 10px 6px rgba(0,0,0,0.06)", fontFamily: font, boxSizing: "border-box" }}
              >
                {list.map(({ label: p, onSelect }) => (
                  <button
                    key={p}
                    onClick={() => { setOpen(false); if (p !== persona) onSelect?.(); }}
                    style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: "8px 12px", borderRadius: radius.sm, fontSize: 14, fontFamily: font, color: T.gray900, fontWeight: p === persona ? 700 : 400 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.gray75; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {p}
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

export function ReportTopBar({ title, persona, personas, extra, roundLabel, device, onDeviceChange }) {
  return (
    <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px 0 32px", background: T.white, flexShrink: 0, fontFamily: font }}>
      <div style={{ display: "flex", alignItems: "center", gap: 17 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.gray700, lineHeight: "20px" }}>{title}</span>
        <div style={{ width: 1, height: 20, background: T.gray100 }} />
        <PersonaMenu persona={persona} personas={personas} />
        {extra}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <GhostBtn icon={<ChevronLeft size={20} />} disabled title="Only the latest round is available" />
          <GhostBtn icon={<Calendar size={20} />} disabled style={{ opacity: 1, color: "#3a3737" }}>{roundLabel}</GhostBtn>
          <GhostBtn icon={<ChevronRight size={20} />} disabled title="Only the latest round is available" />
        </div>
        {onDeviceChange && <DeviceMenu device={device} onChange={onDeviceChange} />}
        <GhostBtn icon={<SlidersHorizontal size={20} />}>Filter</GhostBtn>
        <GhostBtn icon={<MoreHorizontal size={20} />} />
      </div>
    </div>
  );
}

/* Device preview (prototype tool): view the report as it lays out on a desktop, a phone, or an iPhone Duo — see
   DevicePreview.jsx for the rules. Same menu shell as the persona menu. */
export const DEVICES = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "phone", label: "Phone", icon: Smartphone },
  { id: "duo", label: "iPhone Duo", icon: Columns2 },
];
export function DeviceMenu({ device, onChange }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({ open, onOpenChange: setOpen, placement: "bottom-end", middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })], whileElementsMounted: autoUpdate });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);
  const cur = DEVICES.find((d) => d.id === device) || DEVICES[0];
  const Icon = cur.icon;
  return (
    <>
      <span ref={refs.setReference} style={{ display: "inline-flex" }}>
        <GhostBtn icon={<Icon size={20} />} iconRight={<ChevronDown size={16} />} onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} title="Preview the report on a device">{cur.label}</GhostBtn>
      </span>
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <div ref={refs.setFloating} {...getFloatingProps()} style={{ ...floatingStyles, zIndex: 100 }}>
              <motion.div
                role="menu"
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={POP_SPRING}
                style={{ transformOrigin: "top right", width: 180, background: T.gray25, borderRadius: radius.lg, padding: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.14), 0 4px 4px rgba(0,0,0,0.1), 0 10px 6px rgba(0,0,0,0.06)", fontFamily: font, boxSizing: "border-box" }}
              >
                {DEVICES.map((d) => {
                  const I = d.icon;
                  return (
                    <button
                      key={d.id} role="menuitemradio" aria-checked={d.id === device}
                      onClick={() => { onChange(d.id); setOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: "8px 12px", borderRadius: radius.sm, fontSize: 14, fontFamily: font, color: T.gray900, fontWeight: d.id === device ? 700 : 400 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = T.gray75; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <I size={18} color={T.gray700} />{d.label}
                    </button>
                  );
                })}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

/* `layer` ({ label, onExit }): the report is one layer deep (e.g. Explorers) —
   the breadcrumb reads "Org Report › Explorers", the first part returns. */
export function ReportSubBar({ reportType, onAddWidget, addDisabled, layer }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 32px 0", flexShrink: 0, fontFamily: font }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {layer ? (
          <nav aria-label="Report breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={layer.onExit} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: font, fontSize: 14, lineHeight: "20px", color: T.gray500 }}>{reportType}</button>
            <ChevronRight size={16} color={T.gray300} />
            <span aria-current="page" style={{ fontSize: 14, fontWeight: 700, color: T.gray900, lineHeight: "20px" }}>{layer.label}</span>
          </nav>
        ) : (
          <>
            <BarChart3 size={20} color={T.gray700} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T.gray700, lineHeight: "20px" }}>{reportType}</span>
            <ChevronRight size={16} color={T.gray500} />
          </>
        )}
      </div>
      <Button theme="brand" variation="ghost" size="xs" iconLeft={<Plus size={20} />} onClick={onAddWidget} disabled={addDisabled}>Add Widget</Button>
    </div>
  );
}
