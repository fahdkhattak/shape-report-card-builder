import { useState, useRef } from "react";
import { MoreHorizontal, X, Search, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { T, font } from "../../lib/tokens.js";
import { FAMILIES } from "../../lib/families.js";
import MiniWidgetPreview, { setWidgetDragImage, SLOT_W } from "./MiniWidgetPreview.jsx";

/* ================================================================== */
/* LIBRARY PANEL — organized by insight category, not by widget type.  */
/* Widgets pull full org-wide data by default (see docs Step 0) —      */
/* never add a scope/filter control here.                              */
/*                                                                      */
/* Panel width (516px) corrected against the real "Add Widget Window"  */
/* reference (984qJvMt7fCHASYHRwgrab, node 12618:45262) — was a guess   */
/* at 320px before.                                                    */
/*                                                                      */
/* No "collapsed" state anymore — this panel is either mounted (open,   */
/* triggered only from the canvas header's "Add Widget" button, or the  */
/* grid's "+" tile) or not rendered at all (`CanvasScreen.jsx` controls  */
/* mounting). Previously a collapsed 52px icon rail sat here             */
/* unconditionally; per explicit product direction it should be fully   */
/* hidden until called, not a persistent rail. */
/* ================================================================== */
export default function LibraryPanel({ onClose, onLibraryDragStart, onQuickAdd, generatedWidgets = [], onQuickAddGenerated, onRemoveGenerated }) {
  const [expanded, setExpanded] = useState({ "your-score": true });
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("library");
  const scrollRefs = useRef({});

  const filtered = FAMILIES.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  const filteredGenerated = generatedWidgets.filter((w) => w.spec.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ width: 516, borderRight: `1px solid ${T.gray75}`, display: "flex", flexDirection: "column", background: T.white, flexShrink: 0 }}>
      <div style={{ padding: 20, borderBottom: `1px solid ${T.gray100}`, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.gray900 }}>Add Widget</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <MoreHorizontal size={18} color={T.gray700} />
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray700, display: "flex" }}><X size={18} /></button>
          </div>
        </div>

        {/* Library = the fixed, always-full-org-wide-data catalog (this file's
            existing rule below); Your Widgets = things assembled from a chat
            prompt, which may use a bespoke driver cluster or fall back to a
            plausible estimate — segregating them keeps that distinction
            visible at the point where widgets get chosen, not just on the
            widget itself. */}
        <div style={{ display: "flex", gap: 4, background: T.gray50, borderRadius: 9999, padding: 3 }}>
          {[["library", "Library"], ["yours", `Your Widgets${generatedWidgets.length ? ` (${generatedWidgets.length})` : ""}`]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, border: "none", cursor: "pointer", borderRadius: 9999, padding: "7px 10px",
                fontSize: 12.5, fontWeight: 600, fontFamily: font,
                background: tab === id ? T.white : "transparent",
                color: tab === id ? T.gray900 : T.gray500,
                boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${T.gray100}`, borderRadius: 25, padding: "8px 12px" }}>
          <Search size={16} color={T.gray400} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="placeholder-gray400" style={{ border: "none", outline: "none", fontSize: 13.5, flex: 1, fontFamily: font, color: T.gray900 }} />
        </div>
      </div>

      {tab === "yours" ? (
        <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
          {filteredGenerated.length === 0 ? (
            <p style={{ fontSize: 13, color: T.gray400, lineHeight: 1.5, textAlign: "center", marginTop: 40 }}>
              Widgets you create through chat will show up here — ask the mascot for something and add it to your report.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {filteredGenerated.map((w) => (
                <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: SLOT_W }}>
                  <MiniWidgetPreview spec={w.spec} onQuickAdd={() => onQuickAddGenerated?.(w.spec)} onRemove={() => onRemoveGenerated?.(w.id)} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.gray900, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: SLOT_W }}>{w.spec.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.gray500 }}>{w.spec.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div style={{ overflowY: "auto", flex: 1 }}>
        {filtered.map((family) => {
          const isOpen = expanded[family.id];
          return (
            <div key={family.id} style={{ borderBottom: `1px solid ${T.gray75}` }}>
              <div onClick={() => setExpanded((e) => ({ ...e, [family.id]: !e[family.id] }))} style={{ display: "flex", alignItems: "center", gap: 24, padding: "16px 20px", cursor: "pointer" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>{family.name}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: T.gray700, flex: 1 }}>{family.forms.length}</span>
                {isOpen ? <ChevronDown size={16} color={T.gray700} /> : <ChevronRight size={16} color={T.gray700} />}
              </div>
              {isOpen && (
                <div style={{ padding: "0 20px 20px" }}>
                  <p style={{ fontSize: 13, color: T.gray700, margin: "0 0 12px", lineHeight: 1.4 }}>{family.blurb}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => scrollRefs.current[family.id]?.scrollBy({ left: -(SLOT_W + 16), behavior: "smooth" })} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500, flexShrink: 0 }}>
                      <ChevronLeft size={16} />
                    </button>
                    <div ref={(el) => (scrollRefs.current[family.id] = el)} style={{ display: "flex", gap: 16, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
                      {family.forms.map((form, i) => (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => { setWidgetDragImage(e, family.id, i); onLibraryDragStart(e, family.id, i); }}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: SLOT_W, flexShrink: 0, cursor: "grab" }}
                        >
                          <MiniWidgetPreview familyId={family.id} formIndex={i} onQuickAdd={() => onQuickAdd(family.id, i)} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.gray900, textAlign: "center" }}>{form.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.gray500 }}>{form.size}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => scrollRefs.current[family.id]?.scrollBy({ left: SLOT_W + 16, behavior: "smooth" })} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500, flexShrink: 0 }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
