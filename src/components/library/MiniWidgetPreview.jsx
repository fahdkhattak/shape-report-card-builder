import { useState } from "react";
import { Plus, Info, X } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { familyById } from "../../lib/families.js";
import { Header } from "../widgets/primitives.jsx";
import WidgetBody from "../widgets/WidgetBody.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";

/* ================================================================== */
/* MINI WIDGET PREVIEW — Add Widget panel's draggable card.            */
/* Rebuilt against the real reference (984qJvMt7fCHASYHRwgrab, node    */
/* 12629:51747) — a fixed 192×190 display SLOT (not the card itself),  */
/* with the widget rendered at its own scaled-down size CENTERED       */
/* inside that slot, leaving visible margin around it. The hover       */
/* toolbar anchors to the slot's corner, not the card's — since the    */
/* card is much smaller than the slot, this is a meaningfully          */
/* different relationship than "toolbar overhangs the card edge".      */
/*                                                                      */
/* Display scale is NOT constant across sizes — the real reference      */
/* shrinks bigger widgets more (1×1 renders at 100px, ~0.61 scale;      */
/* 2×2 renders at 145px, ~0.42 scale), rather than one fixed ratio.     */
/* ================================================================== */
export const SLOT_W = 192;
export const SLOT_H = 190;
const CARD_DISPLAY = { "1x1": 100, "2x2": 145, "3x3": 165 };
const NATIVE_PX = { "1x1": 164, "2x2": 344, "3x3": 524 };
export const nativeForSize = (size) => NATIVE_PX[size] || 164;
const CARD_SHADOW = "0 22px 6px rgba(0,0,0,0.01), 0 14px 6px rgba(0,0,0,0.02), 0 8px 5px rgba(0,0,0,0.07), 0 3px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)";
const TOOLBAR_SHADOW = "0 17px 3px rgba(0,0,0,0), 0 11px 2px rgba(0,0,0,0.01), 0 6px 2px rgba(0,0,0,0.03), 0 3px 2px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.06)";

const TOOLBAR_BTNS = [
  { id: "add", icon: Plus, hoverBg: T.gray75 },
  { id: "info", icon: Info, hoverBg: T.gray75 },
  { id: "delete", icon: X, hoverBg: "#feebee", color: T.red },
];

/* `spec` (generated widgets, for the library panel's "Your Widgets" tab)
   is an alternative to `familyId`/`formIndex` (the fixed service catalog) —
   same slot/scale/hover mechanics either way, just a different renderer
   and title source. `onRemove` (generated only) wires the toolbar's
   delete button, which is otherwise inert (no remove-from-library concept
   exists for the fixed catalog). */
export default function MiniWidgetPreview({ familyId, formIndex, spec, onQuickAdd, onRemove }) {
  const [hover, setHover] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const isGenerated = !!spec;
  const family = isGenerated ? null : familyById(familyId);
  const formSize = isGenerated ? spec.size : family.forms[formIndex].size;
  const title = isGenerated ? spec.title : family.name;
  const native = nativeForSize(formSize);
  const cardDisplay = CARD_DISPLAY[formSize] || 100;
  const scale = cardDisplay / native;
  const offsetX = (SLOT_W - cardDisplay) / 2;
  const offsetY = (SLOT_H - cardDisplay) / 2;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setHoveredBtn(null); }}
      style={{ width: SLOT_W, height: SLOT_H, flexShrink: 0, position: "relative", borderRadius: radius.lg, overflow: "hidden" }}
    >
      <div style={{ width: native, height: native, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: offsetY, left: offsetX, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.widget, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, boxShadow: CARD_SHADOW, overflow: "hidden" }}>
        <Header title={title} estimated={isGenerated && spec.real === false} />
        {isGenerated ? <GeneratedBody spec={spec} /> : <WidgetBody familyId={familyId} formIndex={formIndex} />}
      </div>

      {hover && (
        <>
          <div style={{ position: "absolute", inset: 0, background: T.gray800, opacity: 0.15, mixBlendMode: "multiply", borderRadius: radius.widget, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 4, background: T.white, borderRadius: 9999, padding: 4, boxShadow: TOOLBAR_SHADOW }}>
            {TOOLBAR_BTNS.map(({ id, icon: Icon, hoverBg, color }) => (
              <button
                key={id}
                onClick={
                  id === "add" ? (e) => { e.stopPropagation(); onQuickAdd?.(); } :
                  id === "delete" && onRemove ? (e) => { e.stopPropagation(); onRemove(); } :
                  undefined
                }
                onMouseEnter={() => setHoveredBtn(id)}
                onMouseLeave={() => setHoveredBtn((h) => (h === id ? null : h))}
                style={{ border: "none", background: hoveredBtn === id ? hoverBg : "transparent", borderRadius: 9999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: (id === "delete" && !onRemove) ? "default" : "pointer", position: "relative", padding: 0 }}
              >
                <Icon size={20} color={color || T.gray700} />
              </button>
            ))}
          </div>

          {hoveredBtn === "add" && (
            <span style={{ position: "absolute", top: 44, right: 8, background: T.gray25, color: T.gray700, fontSize: 12, fontFamily: font, borderRadius: radius.md, padding: "8px 12px", whiteSpace: "nowrap", boxShadow: CARD_SHADOW, zIndex: 10 }}>
              Add to Report
            </span>
          )}
        </>
      )}
    </div>
  );
}

/* Custom HTML5 drag image — a full-size (native, not the display slot),
   78%-opacity copy of the card, matching the real "Drag" reference rather
   than the browser's default scaled-down drag thumbnail. Built at drag
   time, discarded after. */
export function setWidgetDragImage(e, familyId, formIndex) {
  const family = familyById(familyId);
  const native = nativeForSize(family.forms[formIndex].size);
  const node = document.createElement("div");
  node.style.cssText = `position:fixed; top:-1000px; left:-1000px; width:${native}px; height:${native}px; background:${T.white}; border:1px solid ${T.gray100}; border-radius:${radius.widget}px; padding:16px; box-sizing:border-box; opacity:0.78; box-shadow:0 38px 11px rgba(0,0,0,0.01),0 25px 10px rgba(0,0,0,0.04),0 13px 8px rgba(0,0,0,0.1),0 6px 6px rgba(0,0,0,0.15),0 1px 3px rgba(0,0,0,0.17); font-family:${font};`;
  node.innerHTML = `<div style="font-size:11px;font-weight:500;letter-spacing:0.11px;text-transform:uppercase;color:${T.gray200}">${family.name}</div>`;
  document.body.appendChild(node);
  e.dataTransfer.setDragImage(node, 20, 20);
  setTimeout(() => document.body.removeChild(node), 0);
}
