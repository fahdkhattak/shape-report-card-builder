import { useState } from "react";
import { MoreHorizontal, Shuffle, Edit3, Sparkles, Trash2 } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { familyById } from "../../lib/families.js";
import WidgetBody from "../widgets/WidgetBody.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import { Header } from "../widgets/primitives.jsx";
import { sizeToSpan, pxForSpan } from "./gridLayout.js";
import MenuRow from "./MenuRow.jsx";

/* ================================================================== */
/* WIDGET CARD (canvas instance) — handles both kinds:                 */
/* library-sourced (fixed family/form) and generated (chat spec).      */
/* ================================================================== */
export default function WidgetCard({ widget, onChangeForm, onEdit, onRemove, onRename, dragProps, onOpenModal }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [hover, setHover] = useState(false);
  const isLib = widget.kind === "library";
  const family = isLib ? familyById(widget.familyId) : null;
  const size = isLib ? family.forms[widget.formIndex].size : widget.spec.size;
  const span = sizeToSpan(size);
  const defaultTitle = isLib ? family.name : widget.spec.title;
  const title = widget.customTitle || defaultTitle;

  return (
    <div
      {...dragProps}
      onClick={() => onOpenModal(widget)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: `span ${span.col}`,
        gridRow: `span ${span.row}`,
        width: pxForSpan(span.col),
        height: pxForSpan(span.row),
        background: T.white,
        border: `1px solid ${T.gray100}`,
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {renaming ? (
          <input
            autoFocus
            defaultValue={title}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => { onRename(widget.id, e.target.value.trim() || title); setRenaming(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.11px", textTransform: "uppercase", color: T.gray700, border: `1px solid ${T.accent}`, borderRadius: 4, padding: "1px 4px", width: "100%", fontFamily: font }}
          />
        ) : (
          <Header title={title} estimated={!isLib && widget.spec.real === false} />
        )}
        {(hover || menuOpen) && (
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, borderRadius: 6, color: T.gray500, flexShrink: 0 }}>
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>

      {isLib ? <WidgetBody familyId={widget.familyId} formIndex={widget.formIndex} /> : <GeneratedBody spec={widget.spec} />}

      {(hover || menuOpen) && (
        <div style={{ position: "absolute", inset: 0, background: T.gray800, opacity: 0.03, borderRadius: radius.widget, pointerEvents: "none" }} />
      )}

      {menuOpen && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 34, right: 10, background: T.white, border: `1px solid ${T.gray75}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 6, zIndex: 20, width: 190 }}>
          {isLib && family.forms.length > 1 && (
            <MenuRow icon={<Shuffle size={13} />} label="Change widget" onClick={() => { onChangeForm(widget.id); setMenuOpen(false); }} />
          )}
          <MenuRow icon={<Edit3 size={13} />} label="Rename" onClick={() => { setRenaming(true); setMenuOpen(false); }} />
          <MenuRow icon={<Sparkles size={13} />} label="Edit with AI" onClick={() => { onEdit(widget.id); setMenuOpen(false); }} />
          <MenuRow icon={<Trash2 size={13} />} label="Remove" danger onClick={() => { onRemove(widget.id); setMenuOpen(false); }} />
        </div>
      )}
    </div>
  );
}
