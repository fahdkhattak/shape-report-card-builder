import { useState } from "react";
import { ArrowUp, ArrowDown, X, CopyPlus, Info, ChevronDown, Check } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { storyById, formsOf, formOf, availableForms, unusedForm, canPlace } from "./storyCatalog.jsx";
import { useNavActions } from "../../lib/navActions.js";
import { docIdForStory } from "../developer/storyFamilies.js";

/* ================================================================== */
/* STORY TOOLBAR: the floating menu on a Story in the Widget Builder's   */
/* Scope. It appears while the Story is hovered or has focus (a Story is   */
/* focusable, so a tap or the keyboard opens it too) and holds everything  */
/* you do to a Story: choose its form, move it, add it again in another     */
/* form, read about it, remove it.                                          */
/* A Story that can be drawn several ways may be placed more than once, but */
/* never twice in the same form: a form another placement uses is shown     */
/* disabled in the menu ("In use"), and "Add another form" only appears     */
/* while a form is left.                                                   */
/* ================================================================== */
const SHADOW = "0 17px 5px rgba(0,0,0,0.01), 0 11px 4px rgba(0,0,0,0.02), 0 6px 4px rgba(0,0,0,0.05), 0 3px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.09)";

export default function StoryToolbar({ visible, storyKey, subject, built, index, count, onMove, onRemove, onOption, onAddAnother }) {
  const def = storyById(storyKey);
  const [menu, setMenu] = useState(false);
  const { openDeveloper } = useNavActions();
  const { stories, options, spec, reasons } = built;
  const forms = formsOf(def, subject);
  const choices = forms.length > 1 ? availableForms(stories, options, subject, spec, storyKey) : [];
  const current = formOf(def, subject, options?.[storyKey], spec);
  const currentLabel = forms.find((f) => f.id === current)?.label;
  const again = forms.length > 1 && canPlace(stories, options, subject, spec, def.id) && unusedForm(stories, options, subject, spec, def.id) != null;
  const docId = docIdForStory(def);
  const reason = reasons?.[def.id];
  const ib = { border: "none", background: "transparent", color: T.white, cursor: "pointer", padding: 4, borderRadius: radius.xs, display: "flex" };
  const about = () => { if (!docId) return; try { localStorage.setItem("developer-doc", docId); localStorage.setItem("developer-view", "developer"); } catch { /* storage unavailable */ } openDeveloper(); };
  if (!visible && !menu) return null;
  return (
    <div role="toolbar" aria-label={`${def.name} options`} data-part="story-toolbar" style={{ position: "absolute", top: -16, right: 16, zIndex: 6, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, background: T.gray900, borderRadius: radius.md, padding: "4px 6px 4px 10px", fontFamily: font, boxShadow: SHADOW, maxWidth: "calc(100% - 32px)" }}>
      <span title={reason ? `Added because ${reason.charAt(0).toLowerCase()}${reason.slice(1)}` : def.purpose} style={{ fontSize: 12, color: T.white, marginRight: 6, whiteSpace: "nowrap" }}>{def.name}</span>
      {def.sample && <span style={{ fontSize: 10, fontWeight: 600, color: T.gray900, background: T.amberBg, borderRadius: radius.full, padding: "1px 6px", marginRight: 6, whiteSpace: "nowrap" }}>{def.sample}</span>}
      {choices.length > 0 && (
        <span style={{ position: "relative", display: "inline-flex" }}>
          <button aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)} style={{ ...ib, alignItems: "center", gap: 4, padding: "4px 6px", fontSize: 12, fontFamily: font, background: menu ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)" }}>
            Show as {currentLabel}<ChevronDown size={14} />
          </button>
          {menu && (
            <div role="menu" aria-label="Show as" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 190, background: T.gray25, borderRadius: radius.lg, padding: 6, boxShadow: SHADOW, display: "flex", flexDirection: "column" }}>
              {choices.map((f) => (
                <button key={f.id} role="menuitemradio" aria-checked={f.id === current} disabled={f.taken} onClick={() => { onOption({ form: f.id }); setMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", border: "none", background: f.id === current ? T.gray75 : "transparent", cursor: f.taken ? "not-allowed" : "pointer", padding: "8px 10px", borderRadius: radius.sm, fontFamily: font, fontSize: 13, color: f.taken ? T.gray400 : T.gray900 }}>
                  <span style={{ width: 16, display: "inline-flex" }}>{f.id === current && <Check size={14} />}</span>
                  <span style={{ flex: 1 }}>{f.label}</span>
                  {f.taken && <span style={{ fontSize: 11, color: T.gray400 }}>In use</span>}
                </button>
              ))}
            </div>
          )}
        </span>
      )}
      {again && <button aria-label={`Add ${def.name} again in another form`} title="Add again in another form" onClick={onAddAnother} style={ib}><CopyPlus size={16} /></button>}
      <button aria-label="Move up" disabled={index === 0} onClick={() => onMove(storyKey, -1)} style={{ ...ib, opacity: index === 0 ? 0.35 : 1 }}><ArrowUp size={16} /></button>
      <button aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(storyKey, 1)} style={{ ...ib, opacity: index === count - 1 ? 0.35 : 1 }}><ArrowDown size={16} /></button>
      {docId && <button aria-label={`About ${def.name}`} title="About this Story (Developer page)" onClick={about} style={ib}><Info size={16} /></button>}
      <button aria-label={`Remove ${def.name}`} onClick={() => onRemove(storyKey)} style={ib}><X size={16} /></button>
    </div>
  );
}
