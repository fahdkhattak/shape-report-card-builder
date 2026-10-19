import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useFloating, useInteractions, useClick, useDismiss, useRole, FloatingPortal, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace, dsShadow } from "../../../lib/ds.js";

/* ================================================================== */
/* Shared parts for the full-view Scopes: the header search field and   */
/* Filter button (Figma 15299:41715 header: a 300×30 pill search, then   */
/* "Filter" as a ghost button that turns grey while its panel is open), */
/* and one floating-panel hook for every menu they open (portalled, kept */
/* 8px inside the window, Escape / outside click to close).             */
/* ================================================================== */
export function usePopover({ placement = "bottom-end", offsetPx = 8 } = {}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({ open, onOpenChange: setOpen, placement, middleware: [offset(offsetPx), flip({ padding: 8 }), shift({ padding: 8 })], whileElementsMounted: autoUpdate });
  const { getReferenceProps, getFloatingProps } = useInteractions([useClick(context), useDismiss(context, { outsidePressEvent: "mousedown" }), useRole(context, { role: "dialog" })]);
  return { open, setOpen, refs, floatingStyles, getReferenceProps, getFloatingProps };
}

/* The panel that a usePopover opens: portalled, a small spring from its anchor corner. */
export function Popover({ pop, children, width, origin = "top right", style }) {
  return (
    <AnimatePresence>
      {pop.open && (
        <FloatingPortal>
          <div ref={pop.refs.setFloating} style={{ ...pop.floatingStyles, zIndex: 2000 }} {...pop.getFloatingProps()}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: "spring", bounce: 0, duration: 0.22 }}
              style={{ width, transformOrigin: origin, background: ds.surface.general.card, border: `1px solid ${ds.border.secondary}`, borderRadius: dsRadius.xl, boxShadow: dsShadow("md"), fontFamily: font, overflow: "hidden", ...style }}
            >
              {children}
            </motion.div>
          </div>
        </FloatingPortal>
      )}
    </AnimatePresence>
  );
}

export function SearchField({ value, onChange, placeholder = "Search", width = 300 }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: dsSpace[8], width, maxWidth: width === "100%" ? "100%" : "32vw", height: 30, boxSizing: "border-box", padding: `0 ${dsSpace[12]}px`, border: `1px solid ${ds.border.secondary}`, borderRadius: dsRadius.full, background: ds.surface.general.card, fontFamily: font }}>
      <Search size={16} aria-hidden="true" color={ds.icon.primary} style={{ flexShrink: 0 }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="placeholder-gray400" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", ...dsText("Text xs"), color: ds.text.primary, fontFamily: font }} />
      {value && <button type="button" aria-label="Clear search" onClick={() => onChange("")} style={{ border: "none", background: "transparent", padding: 0, display: "flex", cursor: "pointer", color: ds.text.tertiary }}><X size={14} /></button>}
    </label>
  );
}

/* The header's Filter button; `count` shows how many filters are on. */
export const FilterButton = ({ pop, count = 0, iconOnly = false }) => (
  <button ref={pop.refs.setReference} type="button" {...pop.getReferenceProps()}
    style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], height: 30, padding: `0 ${dsSpace[12]}px`, border: "none", borderRadius: dsRadius.full, background: pop.open ? ds.button.brand.ghost.bg.active : "transparent", cursor: "pointer", fontFamily: font, ...dsText("Text sm"), color: ds.text.secondary, transition: "background 120ms ease" }}
    className="ghost-hover">
    <SlidersHorizontal size={18} aria-hidden="true" />{iconOnly ? <span className="sr-only">Filter</span> : "Filter"}
    {count > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: ds.bg.inverse, color: ds.text.inverse, ...dsText("Text 3xs", 600), display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px", boxSizing: "border-box" }}>{count}</span>}
  </button>
);

/* A "Filter by" panel's frame: title row with a close button, the body, and a Clear row (Figma 15298:19603). */
export function FilterPanel({ onClose, onClear, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${dsSpace[12]}px ${dsSpace[16]}px`, borderBottom: `1px solid ${ds.border.tertiary}` }}>
        <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Filter by</span>
        <button type="button" aria-label="Close filters" onClick={onClose} style={{ border: "none", background: "transparent", padding: 2, display: "flex", cursor: "pointer", color: ds.icon.primary }}><X size={16} /></button>
      </div>
      <div style={{ padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[16] }}>{children}</div>
      <button type="button" onClick={onClear} style={{ border: "none", borderTop: `1px solid ${ds.border.tertiary}`, background: "transparent", padding: `${dsSpace[12]}px`, cursor: "pointer", fontFamily: font, ...dsText("Text sm"), color: ds.text.secondary }}>Clear</button>
    </div>
  );
}
export const FieldLabel = ({ children }) => <span style={{ ...dsText("Text xs"), color: ds.text.secondary }}>{children}</span>;

/* The design's select pill (Figma 15298:19603): 36px, rounded, placeholder grey; grey fill while open. */
export const SelectPill = ({ pop, label, placeholder, ...rest }) => (
  <button ref={pop.refs.setReference} type="button" {...pop.getReferenceProps()} {...rest}
    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[8], width: "100%", height: 36, boxSizing: "border-box", padding: `0 ${dsSpace[12]}px 0 ${dsSpace[16]}px`, border: `1px solid ${pop.open ? ds.border.strong : ds.border.secondary}`, borderRadius: dsRadius.full, background: pop.open ? ds.bg.primary : ds.surface.general.card, cursor: "pointer", fontFamily: font, ...dsText("Text sm", label ? 600 : 400), color: label ? ds.text.primary : ds.text.quaternary, textAlign: "left" }}>
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label || placeholder}</span>
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, transform: pop.open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </button>
);
