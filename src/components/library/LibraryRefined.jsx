import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Search, X, Plus, Check, Info } from "lucide-react";
import { font, radius } from "../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsShadow } from "../../lib/ds.js";
import { GROUPS, PERSONA_LABEL, cardSurface } from "../../lib/families.js";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import Press from "../ui/Press.jsx";
import { Header } from "../widgets/primitives.jsx";
import WidgetBody from "../widgets/WidgetBody.jsx";
import { nativeForSize } from "./MiniWidgetPreview.jsx";
import { useElementWidth } from "../scope/stories/storyWidth.js";

/* ================================================================== */
/* LIBRARY · REFINED — a redesign of the Library page (the Current one,  */
/* LibraryScreen.jsx, is untouched and one switch away).                 */
/*                                                                      */
/* What the audit found in Current, and what this does instead:         */
/*  - 12 accordions, only Score open: most widgets hidden behind clicks  */
/*    → every section open, with a sticky index on the left that jumps   */
/*      to a section and follows the scroll (scroll-spy).                */
/*  - cards in sideways rows paged by arrows (a carousel) → a wrapping   */
/*    grid, everything visible at once.                                  */
/*  - Add / Detail / Remove only in a hover toolbar (no keyboard or      */
/*    touch way in) → the actions sit on the card, always visible.       */
/*  - centred title + size + blurb stacks → left-aligned card text, the  */
/*    blurb clamped to two lines, size / persona / sample as quiet tags.  */
/*  - two tab rows and a dark "Widgets 61" pill doing one job → one      */
/*    headline with the count, one toolbar (search, persona, size).      */
/*  - no size filter, no focus rings, no press feedback → all three.     */
/* Kept: IBM Plex Sans, the warm greys and the one accent (the product's   */
/* design system), the Widget Information window, and every behaviour.    */
/* ================================================================== */
const SIZES = ["all", "1x1", "2x2", "3x3"];
const THUMB = { "1x1": 112, "2x2": 164, "3x3": 176 };
const SPRING = { type: "spring", bounce: 0, duration: 0.35 };

/* The widget itself, scaled into the card's preview area (the real body, not a picture). */
function Thumb({ entry }) {
  const native = nativeForSize(entry.size);
  const shown = THUMB[entry.size] || 112;
  const s = shown / native;
  const surface = cardSurface(entry.familyId, entry.formIndex);
  return (
    <div aria-hidden="true" style={{ height: 200, background: ds.bg.primary, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: `${dsRadius.lg}px ${dsRadius.lg}px 0 0`, overflow: "hidden" }}>
      <div style={{ width: shown, height: shown, position: "relative" }}>
        <div style={{ width: native, height: native, transform: `scale(${s})`, transformOrigin: "top left", position: "absolute", inset: 0, background: surface.background || ds.surface.general.card, border: `1px solid ${surface.borderColor || ds.border.secondary}`, borderRadius: radius.widget, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, boxShadow: dsShadow("sm"), overflow: "hidden", pointerEvents: "none" }}>
          <Header title={entry.title} />
          <WidgetBody familyId={entry.familyId} formIndex={entry.formIndex} />
        </div>
      </div>
    </div>
  );
}

const tag = { ...dsText("Text 2xs", 500), fontSize: 11, lineHeight: "16px", color: ds.text.secondary, background: ds.bg.primary, borderRadius: dsRadius.xs, padding: "0 6px" };

function Card({ entry, inUse, onAdd, onRemove, onInfo, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: Math.min(index, 8) * 0.03 }}
      className="lib2-card"
      style={{ display: "flex", flexDirection: "column", background: ds.surface.general.card, border: `1px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg + 4, overflow: "hidden", minWidth: 0 }}
    >
      <button onClick={() => onInfo(entry)} aria-label={`About ${entry.name}`} style={{ border: "none", padding: 0, background: "transparent", cursor: "pointer", display: "block", textAlign: "left" }}>
        <Thumb entry={entry} />
      </button>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1, fontFamily: font }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <h3 style={{ margin: 0, flex: 1, minWidth: 0, ...dsText("Text sm", 600), color: ds.text.primary, textWrap: "balance" }}>{entry.name}</h3>
          {inUse && <span title="On your Org report" style={{ display: "inline-flex", alignItems: "center", gap: 4, ...dsText("Text 2xs", 600), fontSize: 11, color: ds.status.success.textIndicator, whiteSpace: "nowrap", paddingTop: 2 }}><Check size={13} strokeWidth={2.5} />On report</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ ...tag, fontVariantNumeric: "tabular-nums" }}>{entry.size.replace("x", "×")}</span>
          <span style={tag}>{PERSONA_LABEL[entry.persona]}</span>
          {entry.sample && <span title="Illustrative numbers, not yet backed by survey data" style={{ ...tag, color: ds.status.warning.textStrong, background: ds.status.warning.bg }}>Sample data</span>}
        </div>
        <p style={{ margin: 0, ...dsText("Text xs"), color: ds.text.tertiary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textWrap: "pretty" }}>{entry.blurb}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 6 }}>
          {inUse ? (
            <Press className="lib2-btn" onClick={() => onRemove(entry)} style={{ ...btn, color: ds.button.destructive.ghost.items.defaultText }}>Remove from report</Press>
          ) : (
            <Press className="lib2-btn" onClick={() => onAdd(entry)} style={{ ...btn, background: ds.button.brand.primary.bg.default, color: ds.button.brand.primary.items.defaultText }}><Plus size={14} />Add to report</Press>
          )}
          <Press className="lib2-btn" onClick={() => onInfo(entry)} style={{ ...btn, color: ds.text.secondary }}><Info size={14} />Details</Press>
        </div>
      </div>
    </motion.article>
  );
}
const btn = { display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: 9999, border: "none", background: "transparent", ...dsText("Text xs", 600), whiteSpace: "nowrap" };

export default function LibraryRefined({ entries, inUseKeys, onAdd, onRemove, onInfo, onCreateWidget }) {
  const [persona, setPersona] = useState("org");
  const [size, setSize] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("catalogue");
  const [active, setActive] = useState(null);
  const scroller = useRef(null);
  const sections = useRef({});
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, 1100);
  const wide = width >= 900;

  const q = query.trim().toLowerCase();
  const searched = entries.filter((e) => !q || [e.name, e.title, e.blurb, e.group, e.size].some((t) => t.toLowerCase().includes(q)));
  const bySize = (e) => size === "all" || e.size === size;
  const personaCount = (p) => searched.filter((e) => e.persona === p && bySize(e)).length;
  const visible = searched.filter((e) => e.persona === persona && bySize(e));
  const groups = useMemo(() => GROUPS.map((g) => ({ ...g, items: visible.filter((e) => e.group === g.id) })).filter((g) => g.items.length), [visible]);
  const sizesHere = new Set(searched.filter((e) => e.persona === persona).map((e) => e.size));

  // Scroll-spy: the index follows whichever section's heading is nearest the top.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return undefined;
    const onScroll = () => {
      const top = root.getBoundingClientRect().top;
      let cur = groups[0]?.id ?? null;
      for (const g of groups) { const el = sections.current[g.id]; if (el && el.getBoundingClientRect().top - top <= 140) cur = g.id; }
      // at the very bottom the last section can't reach the top: count it as current
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4 && groups.length) cur = groups[groups.length - 1].id;
      setActive(cur);
    };
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [groups]);
  // Section top measured against the scroller itself (offsetTop is relative to whichever ancestor is positioned).
  const jump = (id) => {
    const root = scroller.current, el = sections.current[id];
    if (!root || !el) return;
    root.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 76), behavior: "smooth" });
  };

  const total = entries.length;
  return (
    <div ref={scroller} className="lib2" style={{ flex: 1, overflowY: "auto", background: ds.surface.general.card, fontFamily: font }}>
      <div ref={wrapRef} style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 32px 96px", boxSizing: "border-box" }}>
        {/* Headline */}
        <header style={{ display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: "38px", fontWeight: 600, letterSpacing: "-0.8px", color: ds.text.primary }}>Widget library</h1>
            <p style={{ margin: "8px 0 0", ...dsText("Text sm"), color: ds.text.secondary, maxWidth: "62ch", textWrap: "pretty" }}>
              <b style={{ color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{total}</b> widgets for the Performance Advantage Index by SHAPE. <b style={{ color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{inUseKeys.size}</b> are on your Org report.
            </p>
            <div aria-hidden="true" style={{ marginTop: 12, height: 4, width: 240, maxWidth: "100%", borderRadius: 9999, background: ds.bg.primary, overflow: "hidden" }}>
              <div style={{ width: `${(inUseKeys.size / total) * 100}%`, height: "100%", background: ds.status.success.graph, borderRadius: 9999 }} />
            </div>
          </div>
          <Press className="lib2-btn" onClick={onCreateWidget} style={{ ...btn, height: 40, padding: "0 18px", ...dsText("Text sm", 600), background: ds.button.brand.primary.bg.default, color: ds.button.brand.primary.items.defaultText }}><Plus size={16} />Create widget</Press>
        </header>

        {/* Toolbar — sticks under the page top while you scroll */}
        <div style={{ position: "sticky", top: 0, zIndex: 3, margin: "28px -32px 0", padding: "12px 32px", background: `color-mix(in srgb, ${ds.surface.general.card} 86%, transparent)`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${ds.border.tertiary}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <SegmentedControl options={[{ id: "catalogue", label: `SHAPE · ${total}` }, { id: "yours", label: "Yours · 0" }]} value={view} onChange={setView} />
          {view === "catalogue" && (
            <>
              <label className="lib2-search" style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 220px", maxWidth: 340, height: 36, padding: "0 12px", borderRadius: 9999, background: ds.bg.primary, boxSizing: "border-box" }}>
                <Search size={16} color={ds.text.tertiary} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search widgets" aria-label="Search widgets" style={{ border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 0, fontFamily: font, ...dsText("Text sm"), color: ds.text.primary }} />
                {query && <button aria-label="Clear search" onClick={() => setQuery("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex", color: ds.text.tertiary }}><X size={14} /></button>}
              </label>
              <span style={{ flex: 1 }} />
              <SegmentedControl options={["org", "personal", "team"].map((p) => ({ id: p, label: `${PERSONA_LABEL[p]} ${personaCount(p)}` }))} value={persona} onChange={setPersona} />
              <SegmentedControl options={SIZES.filter((s) => s === "all" || sizesHere.has(s)).map((s) => ({ id: s, label: s === "all" ? "All sizes" : s.replace("x", "×") }))} value={sizesHere.has(size) || size === "all" ? size : "all"} onChange={setSize} />
            </>
          )}
        </div>

        {view === "yours" ? (
          <section style={{ padding: "88px 0", display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: 460 }}>
            <h2 style={{ margin: 0, fontSize: 22, lineHeight: "28px", fontWeight: 600, letterSpacing: "-0.4px", color: ds.text.primary }}>Nothing of yours yet</h2>
            <p style={{ margin: "8px 0 20px", ...dsText("Text sm"), color: ds.text.secondary, textWrap: "pretty" }}>Widgets you build in the Widget Builder will appear here, ready to add to any report.</p>
            <Press className="lib2-btn" onClick={onCreateWidget} style={{ ...btn, height: 36, padding: "0 16px", background: ds.button.brand.primary.bg.default, color: ds.button.brand.primary.items.defaultText }}><Plus size={14} />Create widget</Press>
          </section>
        ) : (
          <div style={{ display: "flex", gap: 40, alignItems: "flex-start", marginTop: 28 }}>
            {wide && groups.length > 0 && (
              <nav aria-label="Widget groups" style={{ position: "sticky", top: 84, width: 180, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                {groups.map((g) => {
                  const on = active === g.id;
                  return (
                    <button key={g.id} className="lib2-index" onClick={() => jump(g.id)} aria-current={on ? "true" : undefined}
                      style={{ display: "flex", alignItems: "center", gap: 8, border: "none", background: on ? ds.bg.primary : "transparent", borderRadius: dsRadius.md, padding: "7px 10px", cursor: "pointer", textAlign: "left", fontFamily: font, ...dsText("Text xs", on ? 600 : 400), color: on ? ds.text.primary : ds.text.secondary, transition: "background 150ms ease, color 150ms ease" }}>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.id}</span>
                      <span style={{ color: ds.text.tertiary, fontVariantNumeric: "tabular-nums" }}>{g.items.length}</span>
                    </button>
                  );
                })}
              </nav>
            )}
            <main style={{ flex: 1, minWidth: 0 }}>
              {persona !== "org" && (
                <p style={{ margin: "0 0 20px", padding: "10px 14px", borderRadius: dsRadius.md, background: ds.status.warning.bg, ...dsText("Text xs"), color: ds.status.warning.textStrong, maxWidth: "72ch" }}>
                  {PERSONA_LABEL[persona]} widgets show illustrative numbers for now: the survey has no per-{persona === "team" ? "team" : "person"} data yet.
                </p>
              )}
              {groups.length === 0 && (
                <div style={{ padding: "72px 0", maxWidth: 440 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px", color: ds.text.primary }}>No widgets match{q ? ` “${query}”` : ""}</h2>
                  <p style={{ margin: "6px 0 16px", ...dsText("Text sm"), color: ds.text.secondary }}>Try another word, or look across every persona and size.</p>
                  <Press className="lib2-btn" onClick={() => { setQuery(""); setSize("all"); }} style={{ ...btn, background: ds.bg.primary, color: ds.text.primary }}>Clear filters</Press>
                </div>
              )}
              {groups.map((g) => (
                <section key={g.id} ref={(el) => { sections.current[g.id] = el; }} aria-labelledby={`lib2-${g.id}`} style={{ marginBottom: 48 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                    <h2 id={`lib2-${g.id}`} style={{ margin: 0, fontSize: 20, lineHeight: "28px", fontWeight: 600, letterSpacing: "-0.3px", color: ds.text.primary }}>{g.id}</h2>
                    <span style={{ ...dsText("Text sm"), color: ds.text.tertiary, fontVariantNumeric: "tabular-nums" }}>{g.items.length}</span>
                  </div>
                  <p style={{ margin: "0 0 16px", ...dsText("Text sm"), color: ds.text.secondary, maxWidth: "65ch", textWrap: "pretty" }}>{g.blurb}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))", gap: 16 }}>
                    {g.items.map((e, i) => <Card key={e.key} entry={e} index={i} inUse={inUseKeys.has(e.key)} onAdd={onAdd} onRemove={onRemove} onInfo={onInfo} />)}
                  </div>
                </section>
              ))}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
