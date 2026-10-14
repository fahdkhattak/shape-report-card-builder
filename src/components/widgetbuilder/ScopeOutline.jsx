import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import Press from "../ui/Press.jsx";
import { storyById } from "./storyCatalog.jsx";

/* ================================================================== */
/* IN THIS SCOPE — the outline of a Scope's Stories with move / remove   */
/* controls that are always visible (not hover-only), a click to jump to  */
/* that Story, and a row that lights up its Story while hovered.           */
/* Shared by the Workbench and by the Original builder's Refined view.     */
/* `renderAdd(trigger)` returns the "add a story" menu, so this file does  */
/* not have to import the builder screens.                                 */
/* ================================================================== */
export const RAIL_W = 288;
const SHADOW_SOFT = "0 1px 2px rgba(35,31,32,0.05), 0 6px 16px -8px rgba(35,31,32,0.14)";

/* Observe an element's width so the rail can drop inline on narrow panes. */
export function useWidth(ref) {
  const [w, setW] = useState(1200);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export const storyDomId = (id) => `wb2-story-${id}`;

export default function ScopeOutline({ stories, litId, setLitId, onMove, onRemove, renderAdd, inline, panel, formOf, reasons }) {
  const iconBtn = { border: "none", background: "transparent", color: T.gray500, width: 24, height: 24, borderRadius: radius.sm, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 };
  return (
    // Panel and rail: the list scrolls on its own and "Add a story" stays pinned under it, so it's never below the fold.
    <nav aria-label="Stories in this scope" style={panel ? { display: "flex", flexDirection: "column", minHeight: 0, maxHeight: "100%", padding: "20px 12px 0 16px", boxSizing: "border-box" } : inline ? { marginTop: 32 } : { position: "sticky", top: 0, width: RAIL_W, flexShrink: 0, alignSelf: "flex-start", height: "100%", display: "flex", flexDirection: "column", minHeight: 0, padding: "40px 24px 16px 8px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.gray500 }}>In this scope</span>
        <span style={{ fontSize: 12, color: T.gray400, fontVariantNumeric: "tabular-nums" }}>{stories.length}</span>
      </div>
      <ol className={inline ? undefined : "scroll-minimal"} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2, ...(inline ? {} : { flex: "0 1 auto", minHeight: 0, overflowY: "auto" }) }}>
        {stories.map((id, i) => {
          const def = storyById(id);
          const lit = litId === id;
          return (
            <li key={id} title={reasons?.[def.id] ? `Added because ${reasons[def.id].charAt(0).toLowerCase()}${reasons[def.id].slice(1)}` : undefined} onMouseEnter={() => setLitId(id)} onMouseLeave={() => setLitId(null)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 4px 6px 8px", borderRadius: radius.md, background: lit ? T.white : "transparent", boxShadow: lit ? SHADOW_SOFT : "none", transition: "background 120ms ease, box-shadow 120ms ease" }}>
              <span style={{ width: 16, fontSize: 11, color: T.gray400, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
              <button onClick={() => document.getElementById(storyDomId(id))?.scrollIntoView({ behavior: "smooth", block: "start" })} style={{ flex: 1, minWidth: 0, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: font, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.name}</span>
                <span style={{ fontSize: 11, color: T.gray400 }}>{def.family}{formOf?.(id) ? ` · ${formOf(id)}` : ""}</span>
              </button>
              <button aria-label={`Move ${def.name} up`} disabled={i === 0} onClick={() => onMove(id, -1)} style={{ ...iconBtn, opacity: i === 0 ? 0.3 : 1 }}><ArrowUp size={14} /></button>
              <button aria-label={`Move ${def.name} down`} disabled={i === stories.length - 1} onClick={() => onMove(id, 1)} style={{ ...iconBtn, opacity: i === stories.length - 1 ? 0.3 : 1 }}><ArrowDown size={14} /></button>
              <button aria-label={`Remove ${def.name}`} onClick={() => onRemove(id)} style={iconBtn}><X size={14} /></button>
            </li>
          );
        })}
      </ol>
      {stories.length === 0 && <p style={{ margin: "8px 0", fontSize: 13, color: T.gray500 }}>Nothing here yet.</p>}
      <div style={inline ? { marginTop: 12 } : { flexShrink: 0, marginTop: 8, padding: "8px 0 12px", borderTop: `1px solid ${T.gray75}` }}>
        {renderAdd(({ onClick }) => (
          <Press onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: T.gray700, fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: radius.md }} className="wb2-link">
            <Plus size={16} />Add a story
          </Press>
        ))}
      </div>
    </nav>
  );
}
