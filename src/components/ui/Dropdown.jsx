import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import { useFloating, useInteractions, useClick, useDismiss, useRole, FloatingPortal, offset, flip, shift, size, autoUpdate } from "@floating-ui/react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace, dsShadow } from "../../lib/ds.js";

/* ================================================================== */
/* DROPDOWN — our own select, replacing the browser's <select>.          */
/* The stock menu ignored the design system and, in a narrow card, opened */
/* wherever the browser chose (off the card, off the screen). This one is a */
/* trigger pill and a floating list drawn in the design's tokens, portalled  */
/* to the page so no card can clip it, kept at least 8px inside the window   */
/* (flip, shift, and a max width of what is left), and sized to its trigger.  */
/* options: [{ value, label, note? }]. Keyboard: Enter/Space or click to       */
/* open, arrows to move, Enter to pick, Escape to close (via useDismiss).      */
/* ================================================================== */
export default function Dropdown({ value, options, onChange, ariaLabel, maxWidth = 280 }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { refs, floatingStyles, context } = useFloating({
    open, onOpenChange: setOpen, placement: "bottom-start",
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 }), size({ padding: 8, apply({ availableWidth, rects, elements }) { Object.assign(elements.floating.style, { minWidth: `${Math.min(rects.reference.width, availableWidth)}px`, maxWidth: `${Math.min(maxWidth, availableWidth)}px` }); } })],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const role = useRole(context, { role: "listbox" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);
  const current = options.find((o) => o.value === value) || options[0];
  const pick = (v) => { onChange(v); setOpen(false); refs.domReference.current?.focus(); };
  const root = refs.domReference.current?.closest?.(".ds-dark") || undefined; // keep Dark mode inside the portal

  const onKey = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); setActive(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true); return; }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(options[active].value); }
  };

  return (
    <>
      <button
        ref={refs.setReference} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open}
        {...getReferenceProps({ onKeyDown: onKey })}
        style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], maxWidth: "100%", padding: `${dsSpace[4]}px ${dsSpace[8]}px ${dsSpace[4]}px ${dsSpace[12]}px`, border: `1px solid ${open ? ds.border.strong : "transparent"}`, borderRadius: dsRadius.full, background: ds.bg.primary, color: ds.text.primary, cursor: "pointer", fontFamily: font, ...dsText("Text xs", 500), transition: "border-color 120ms ease" }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{current?.label}</span>
        <ChevronDown size={14} aria-hidden="true" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease", color: ds.text.tertiary }} />
      </button>
      <AnimatePresence>
        {open && (
          <FloatingPortal root={root}>
            <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 2000 }} {...getFloatingProps()}>
              <motion.ul
                initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: "spring", bounce: 0, duration: 0.22 }}
                style={{ listStyle: "none", margin: 0, padding: dsSpace[4], background: ds.surface.general.card, border: `1px solid ${ds.border.secondary}`, borderRadius: dsRadius.lg, boxShadow: dsShadow("md"), transformOrigin: "top left", fontFamily: font }}
              >
                {options.map((o, i) => {
                  const on = o.value === value;
                  return (
                    <li key={o.value} role="option" aria-selected={on} onMouseEnter={() => setActive(i)} onClick={() => pick(o.value)}
                      style={{ display: "flex", alignItems: "center", gap: dsSpace[8], padding: `${dsSpace[8]}px ${dsSpace[12]}px`, minHeight: 36, boxSizing: "border-box", borderRadius: dsRadius.md, cursor: "pointer", background: active === i ? ds.interactive.ghostHover : "transparent", color: ds.text.primary, ...dsText("Text xs", on ? 600 : 400) }}>
                      <span style={{ flex: 1, minWidth: 0 }}>{o.label}</span>
                      {on && <Check size={14} aria-hidden="true" style={{ flexShrink: 0 }} />}
                    </li>
                  );
                })}
              </motion.ul>
            </div>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </>
  );
}
