import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useDismiss, useInteractions } from "@floating-ui/react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsShadow, dsBorder } from "../../lib/ds.js";
import swapIcon from "../../assets/widget-menu/widget-swap.svg";
import infoIcon from "../../assets/widget-menu/info-circle.svg";
import xIcon from "../../assets/widget-menu/x.svg";
import dotsIcon from "../../assets/widget-menu/dots-horizontal.svg";
import { Edit3, Sparkles } from "lucide-react";

/* ================================================================== */
/* WIDGET MENU — the three-dot button and its menu on a report widget   */
/* (Figma 984qJvMt7fCHASYHRwgrab, "Hovers" 15266:24599).                 */
/*  - The dots: a 28px round ghost button, 7px in from the card's        */
/*    top-right corner, shown while the card is hovered. Hover tint       */
/*    button/brand/ghost/bg/hover; while its menu is open, bg/active.      */
/*  - The menu: 220px, radius/xl (12), the md shadow, 36px rows (8/12      */
/*    padding, 20px icon, 10px gap, Text sm): Change Widget, About Widget, */
/*    then a border/secondary hairline and Remove Widget in the            */
/*    destructive ghost colours. It opens just right of the card, level    */
/*    with the dots, and flips/shifts to stay on screen.                   */
/* Rename and Edit with AI aren't in the frame; they're real features, so  */
/* they're kept as rows in the same style, before the hairline.           */
/* ================================================================== */
const SPRING = { type: "spring", bounce: 0.25, duration: 0.32 };

/* Downloaded Figma icons, drawn as masks so they take the row's colour. */
const MaskIcon = ({ src, color }) => (
  <span aria-hidden="true" style={{ width: 20, height: 20, flexShrink: 0, background: color, WebkitMask: `url(${src}) center / contain no-repeat`, mask: `url(${src}) center / contain no-repeat` }} />
);

export function DotsButton({ open, visible, onToggle, setRef }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      ref={setRef}
      type="button"
      aria-label="Widget options"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      onPointerDown={(e) => e.stopPropagation()}
      initial={false}
      animate={{ opacity: visible || open ? 1 : 0, scale: visible || open ? 1 : 0.85 }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      whileTap={{ scale: 0.88 }}
      transition={SPRING}
            style={{ position: "absolute", top: 7, right: 7, zIndex: 3, width: 28, height: 28, padding: 4, boxSizing: "border-box", border: "none", borderRadius: 9999, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: open ? ds.button.brand.ghost.bg.active : hover ? ds.button.brand.ghost.bg.hover : "transparent", transition: "background 120ms ease", pointerEvents: visible || open ? "auto" : "none" }}
    >
      <MaskIcon src={dotsIcon} color={ds.button.brand.ghost.items.defaultIcon} />
    </motion.button>
  );
}

function Row({ icon, label, onClick, danger, topRule }) {
  const [hover, setHover] = useState(false);
  const fg = danger ? ds.button.destructive.ghost.items.defaultText : ds.text.primary;
  return (
    <motion.button
      type="button"
      role="menuitem"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", boxSizing: "border-box", border: "none", borderTop: topRule ? `${dsBorder.sm}px solid ${ds.border.secondary}` : "none", background: hover ? (danger ? ds.button.destructive.ghost.bg.hover : ds.surface.general.cardHover) : ds.surface.general.card, transition: "background 100ms ease", cursor: "pointer", fontFamily: font, textAlign: "left", ...dsText("Text sm"), color: fg }}
    >
      {icon}
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
    </motion.button>
  );
}

/* The menu itself. `anchor` is the card element: the menu sits 3px past its right edge, its top 40px above the dots. */
export function WidgetMenu({ open, onOpenChange, anchor, onChange, onAbout, onRename, onEdit, onRemove }) {
  const { refs, floatingStyles, context } = useFloating({
    open, onOpenChange, placement: "right-start", elements: { reference: anchor },
    middleware: [offset({ mainAxis: 3, crossAxis: -33 }), flip({ padding: 8 }), shift({ padding: 8 })], whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);
  const close = (fn) => () => { onOpenChange(false); fn(); };
  const iconC = ds.icon.primary;
  return (
    <FloatingPortal>
      <AnimatePresence>
        {open && (
          <div ref={refs.setFloating} {...getFloatingProps()} style={{ ...floatingStyles, zIndex: 200 }} onClick={(e) => e.stopPropagation()}>
            <motion.div
              role="menu"
              initial={{ opacity: 0, scale: 0.92, x: -6 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.96, x: -4 }}
              transition={SPRING}
              style={{ transformOrigin: "top left", width: 220, borderRadius: 12, overflow: "hidden", boxShadow: dsShadow("md"), background: ds.surface.general.card }}
            >
              {onChange && <Row icon={<MaskIcon src={swapIcon} color={iconC} />} label="Change Widget" onClick={close(onChange)} />}
              <Row icon={<MaskIcon src={infoIcon} color={iconC} />} label="About Widget" onClick={close(onAbout)} />
              {onRename && <Row icon={<Edit3 size={18} color={iconC} style={{ margin: 1 }} />} label="Rename" onClick={close(onRename)} />}
              {onEdit && <Row icon={<Sparkles size={18} color={iconC} style={{ margin: 1 }} />} label="Edit with AI" onClick={close(onEdit)} />}
              <Row danger topRule icon={<MaskIcon src={xIcon} color={ds.button.destructive.ghost.items.defaultIcon} />} label="Remove Widget" onClick={close(onRemove)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}
