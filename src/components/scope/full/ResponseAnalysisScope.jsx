import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, MessageSquare, LayoutGrid, Download, Check, ListFilter, X } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace } from "../../../lib/ds.js";
import { QUESTIONS, VERBATIMS, THEMES, SAMPLE_RESPONDENTS, themeById, themeTotals, summaryFor } from "../../../lib/responseSample.js";
import { splitTiles } from "../../widgets/ChartInsight.jsx";
import { useElementWidth } from "../stories/storyWidth.js";
import { SampleTag } from "../stories/StoryCard.jsx";
import { useFullScope } from "./fullScope.js";
import { usePopover, Popover, SearchField, FilterButton, FilterPanel, FieldLabel } from "./FullParts.jsx";

/* ================================================================== */
/* RESPONSE ANALYSIS — a full-view Scope, opened by the Popular          */
/* Responses widget (Figma 15299:45659). Left: the open-text questions   */
/* (filter by Explorer, pick one, several or all). Right: three tabs over */
/* the picked questions:                                                  */
/*   Executive Summary  a written summary of what people said (AI chip,   */
/*                      download as text, totals)                          */
/*   Verbatims          the responses, numbered (download as CSV)          */
/*   Response Map       one tile per theme, sized by how many responses;   */
/*                      a tile opens the Verbatims for that theme          */
/* Header: search (the responses and questions), Filter (themes).          */
/* ALL OF THIS IS SAMPLE CONTENT (lib/responseSample.js): the dataset has   */
/* no open-text answers. Every tab says so.                                */
/* ================================================================== */
const TABS = [
  { id: "summary", label: "Executive Summary", short: "Summary", icon: Sparkles },
  { id: "verbatims", label: "Verbatims", short: "Verbatims", icon: MessageSquare },
  { id: "map", label: "Response Map", short: "Map", icon: LayoutGrid },
];
const EXPLORERS = [...new Set(QUESTIONS.map((q) => q.explorer))];
const chip = (on) => ({ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, height: 30, padding: "0 12px", borderRadius: 999, border: `1px solid ${on ? ds.text.primary : ds.border.secondary}`, background: on ? ds.bg.secondary : ds.surface.general.card, cursor: "pointer", fontFamily: font, ...dsText("Text xs", on ? 600 : 400), color: ds.text.primary, whiteSpace: "nowrap" });

export default function ResponseAnalysisScope() {
  const { toolsEl } = useFullScope();
  const [tab, setTab] = useState("summary");
  const [explorer, setExplorer] = useState("all");
  const [picked, setPicked] = useState(() => QUESTIONS.map((q) => q.id));
  const [themes, setThemes] = useState(() => THEMES.map((t) => t.id)); // Filter › Theme
  const [query, setQuery] = useState("");
  const filterPop = usePopover({ placement: "bottom-end" });
  // Narrow (a phone, a small pane): the questions become a row of chips above the tabs; search moves into the body.
  const rootRef = useRef(null);
  const narrow = useElementWidth(rootRef, 1200) < 720;

  const listed = QUESTIONS.filter((q) => (explorer === "all" || q.explorer === explorer) && (!query.trim() || q.text.toLowerCase().includes(query.trim().toLowerCase()) || q.explorer.toLowerCase().includes(query.trim().toLowerCase()) || VERBATIMS.some((v) => v.question === q.id && v.text.toLowerCase().includes(query.trim().toLowerCase()))));
  const active = picked.filter((id) => listed.some((q) => q.id === id));
  const allOn = listed.length > 0 && listed.every((q) => picked.includes(q.id));
  const toggleQ = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const totals = themeTotals(active).filter((t) => themes.includes(t.id));
  const total = totals.reduce((a, t) => a + t.value, 0);
  const themesOn = themes.length !== THEMES.length;
  const openTheme = (id) => { setThemes([id]); setTab("verbatims"); };

  const tools = toolsEl && createPortal(
    <>
      {!narrow && <SearchField value={query} onChange={setQuery} placeholder="Search responses" />}
      <FilterButton pop={filterPop} count={themesOn ? 1 : 0} iconOnly={narrow} />
      <Popover pop={filterPop} width={268}>
        <FilterPanel onClose={() => filterPop.setOpen(false)} onClear={() => setThemes(THEMES.map((t) => t.id))}>
          <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
            <FieldLabel>Theme</FieldLabel>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 280, overflowY: "auto" }}>
              {THEMES.map((t) => {
                const on = themes.includes(t.id);
                return (
                  <li key={t.id}>
                    <label className="fs-row" style={{ display: "flex", alignItems: "center", gap: dsSpace[8], padding: `${dsSpace[6]}px ${dsSpace[4]}px`, borderRadius: dsRadius.md, cursor: "pointer", ...dsText("Text sm"), color: ds.text.primary }}>
                      <input type="checkbox" checked={on} onChange={() => setThemes(on ? themes.filter((x) => x !== t.id) : [...themes, t.id])} style={{ width: 16, height: 16, accentColor: "var(--ds-color-bg-inverse)", margin: 0 }} />
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                      {t.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </FilterPanel>
      </Popover>
    </>,
    toolsEl,
  );

  return (
    <div ref={rootRef} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: narrow ? "column" : "row", fontFamily: font, borderTop: `1px solid ${ds.border.tertiary}` }}>
      {tools}
      {narrow && (
        <div style={{ flexShrink: 0, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, display: "flex", flexDirection: "column", gap: dsSpace[8], borderBottom: `1px solid ${ds.border.tertiary}` }}>
          <SearchField value={query} onChange={setQuery} placeholder="Search responses" width="100%" />
          <div className="scroll-minimal" role="group" aria-label="Questions" style={{ display: "flex", gap: dsSpace[6], overflowX: "auto", paddingBottom: 2 }}>
            <button type="button" aria-pressed={allOn} onClick={() => setPicked(allOn ? [] : QUESTIONS.map((q) => q.id))} style={chip(allOn)}>{allOn && <Check size={14} aria-hidden="true" />}All questions</button>
            {QUESTIONS.map((q) => <button key={q.id} type="button" aria-pressed={picked.includes(q.id)} title={q.text} onClick={() => toggleQ(q.id)} style={chip(picked.includes(q.id) && !allOn)}>{q.explorer} · {q.responses}</button>)}
          </div>
        </div>
      )}
      {/* ---- questions ---- */}
      {!narrow && <aside aria-label="Questions" style={{ width: 376, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: `1px solid ${ds.border.tertiary}` }}>
        <div style={{ padding: `${dsSpace[24]}px ${dsSpace[24]}px ${dsSpace[16]}px`, display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[8] }}>
            <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Select Question</span>
            <ExplorerSelect value={explorer} onChange={setExplorer} />
          </div>
          <button type="button" aria-pressed={allOn} onClick={() => setPicked(allOn ? [] : [...new Set([...picked, ...listed.map((q) => q.id)])])}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: dsSpace[8], height: 36, borderRadius: dsRadius.full, border: `1px solid ${allOn ? ds.text.primary : ds.border.secondary}`, background: allOn ? ds.bg.secondary : ds.surface.general.card, cursor: "pointer", fontFamily: font, ...dsText("Text sm"), color: ds.text.primary }}>
            {allOn && <Check size={16} aria-hidden="true" />}{allOn ? "All Questions Selected" : "Select All Questions"}
          </button>
        </div>
        <div className="scroll-minimal" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `0 ${dsSpace[24]}px ${dsSpace[24]}px`, display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
          {listed.map((q) => {
            const on = picked.includes(q.id);
            return (
              <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...dsText("Text xs"), color: ds.text.secondary, border: `1px solid ${ds.border.secondary}`, borderRadius: dsRadius.full, padding: `0 ${dsSpace[8]}px`, lineHeight: "18px" }}>{q.explorer}</span>
                  <span style={{ ...dsText("Text xs"), color: ds.text.quaternary }}>{q.responses} Responses</span>
                </div>
                <button type="button" aria-pressed={on} onClick={() => toggleQ(q.id)} className="ra-q"
                  style={{ textAlign: "left", border: `1px solid ${on ? ds.border.strong : "transparent"}`, borderRadius: dsRadius.lg, background: on ? ds.bg.primary : ds.surface.general.cardWithinCard, padding: dsSpace[12], cursor: "pointer", fontFamily: font, ...dsText("Text sm"), color: on ? ds.text.primary : ds.text.tertiary, transition: "border-color 120ms ease, background 120ms ease" }}>
                  <b style={{ fontWeight: 700 }}>Q.</b> {q.text}
                </button>
              </div>
            );
          })}
          {listed.length === 0 && <p style={{ margin: 0, ...dsText("Text sm"), color: ds.text.tertiary }}>No questions match. Try another Explorer or search.</p>}
        </div>
      </aside>}

      {/* ---- tabs ---- */}
      <section style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div role="tablist" style={{ display: "flex", borderBottom: `1px solid ${ds.border.tertiary}`, flexShrink: 0 }}>
          {TABS.map((t) => {
            const on = tab === t.id, Icon = t.icon;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => setTab(t.id)} className="ra-tab"
                style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: dsSpace[8], height: 44, border: "none", borderRight: `1px solid ${ds.border.tertiary}`, background: "transparent", cursor: "pointer", fontFamily: font, ...dsText("Text sm", on ? 600 : 400), textTransform: "uppercase", letterSpacing: "0.02em", color: on ? ds.text.primary : ds.text.tertiary }}>
                <Icon size={16} aria-hidden="true" color={on && t.id === "summary" ? ds.utility.graphColors.main.lavenderViolet : undefined} />{narrow ? t.short : t.label}
                {on && <motion.span layoutId="ra-tab-line" style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, background: ds.text.primary }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} />}
              </button>
            );
          })}
        </div>
        <div className="scroll-minimal" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: narrow ? `${dsSpace[16]}px` : `${dsSpace[24]}px ${dsSpace[32]}px ${dsSpace[24]}px` }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.25 }}>
              {active.length === 0 ? <Empty>Pick a question on the left to see its responses.</Empty>
                : tab === "summary" ? <Summary ids={active} total={QUESTIONS.filter((q) => active.includes(q.id)).reduce((a, q) => a + q.responses, 0)} />
                : tab === "verbatims" ? <Verbatims ids={active} themes={themes} query={query} onClearTheme={() => setThemes(THEMES.map((t) => t.id))} />
                : <ResponseMap rows={totals} total={total} onOpen={openTheme} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: dsSpace[6], padding: `${dsSpace[8]}px ${dsSpace[32]}px ${dsSpace[12]}px`, ...dsText("Text xs"), color: ds.text.tertiary }}>
          <Sparkles size={14} aria-hidden="true" color={ds.utility.graphColors.main.lavenderViolet} />AI responses can be inaccurate or misleading
        </div>
      </section>
    </div>
  );
}

/* ---- the three tabs --------------------------------------------------------------------------------------------- */
function TabHead({ icon: Icon, iconColor, title, ai, count, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[16], marginBottom: dsSpace[16], flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8] }}>
        <Icon size={20} aria-hidden="true" color={iconColor} />
        <h3 style={{ margin: 0, ...dsText("Text lg", 700), color: ds.text.primary }}>{title}</h3>
        {ai && <span style={{ ...dsText("Text 3xs", 600), fontSize: 10, border: `1px solid ${ds.border.strong}`, borderRadius: dsRadius.full, padding: "1px 7px", color: ds.text.secondary }}>AI</span>}
        {count != null && <span style={{ ...dsText("Text xs"), color: ds.text.quaternary, borderLeft: `1px solid ${ds.border.secondary}`, paddingLeft: dsSpace[8] }}>{count}</span>}
        <SampleTag>Sample data</SampleTag>
      </div>
      {action}
    </div>
  );
}
const DownloadButton = ({ label, onClick }) => (
  <button type="button" onClick={onClick} className="fs-ghost" style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], height: 32, padding: `0 ${dsSpace[12]}px`, border: "none", borderRadius: dsRadius.full, background: "transparent", cursor: "pointer", fontFamily: font, ...dsText("Text sm"), color: ds.text.secondary }}>
    <Download size={18} aria-hidden="true" />{label}
  </button>
);
function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Summary({ ids, total }) {
  const paras = summaryFor(ids);
  return (
    <>
      <TabHead icon={Sparkles} iconColor={ds.utility.graphColors.main.lavenderViolet} title="Executive Summary" ai
        action={<DownloadButton label="Download Executive Summary" onClick={() => download("executive-summary.txt", `Executive Summary (sample)\n\n${paras.join("\n\n")}\n`)} />} />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: dsSpace[24], marginBottom: dsSpace[12], ...dsText("Text xs"), color: ds.text.tertiary }}>
        <span>Total Verbatim Responses <b style={{ color: ds.text.primary, marginLeft: dsSpace[8] }}>{total}</b></span>
        <span>Unique Respondents <b style={{ color: ds.text.primary, marginLeft: dsSpace[8] }}>{Math.min(SAMPLE_RESPONDENTS, total)}</b></span>
      </div>
      {/* The design's soft iridescent edge: a 1px gradient border around a faint wash. */}
      <div style={{ borderRadius: dsRadius.xl, padding: 1, background: "linear-gradient(135deg, #9fd8ff, #c9b6ff 45%, #ffb4c8 80%, #ffd1a6)" }}>
        <div style={{ borderRadius: dsRadius.xl - 1, padding: `${dsSpace[24]}px ${dsSpace[24]}px ${dsSpace[32]}px`, background: `linear-gradient(135deg, ${ds.surface.general.card}, ${ds.surface.general.card} 60%, rgba(255, 214, 230, 0.25))`, minHeight: 240, display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
          {paras.map((p, i) => <p key={i} style={{ margin: 0, maxWidth: 900, ...dsText("Text sm"), lineHeight: "22px", color: ds.text.secondary }}>{p}</p>)}
        </div>
      </div>
    </>
  );
}

function Verbatims({ ids, themes, query, onClearTheme }) {
  const q = query.trim().toLowerCase();
  const list = VERBATIMS.filter((v) => ids.includes(v.question) && themes.includes(v.theme) && (!q || v.text.toLowerCase().includes(q)));
  const oneTheme = themes.length === 1 ? themeById(themes[0]) : null;
  const csv = () => ["Number,Question,Explorer,Theme,Response", ...list.map((v, i) => { const qq = QUESTIONS.find((x) => x.id === v.question); return [i + 1, qq.text, qq.explorer, themeById(v.theme).label, v.text].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","); })].join("\n");
  return (
    <>
      <TabHead icon={MessageSquare} iconColor={ds.utility.graphColors.main.teamBlue} title="Verbatims" count={`${list.length} ${list.length === 1 ? "Response" : "Responses"}`}
        action={<DownloadButton label="Download Verbatims" onClick={() => download("verbatims.csv", csv(), "text/csv")} />} />
      {oneTheme && (
        <button type="button" onClick={onClearTheme} style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6], marginBottom: dsSpace[12], border: `1px solid ${ds.border.secondary}`, borderRadius: dsRadius.full, background: ds.surface.general.card, padding: `2px ${dsSpace[8]}px 2px ${dsSpace[12]}px`, cursor: "pointer", fontFamily: font, ...dsText("Text xs"), color: ds.text.secondary }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: oneTheme.color }} />{oneTheme.label}<X size={12} aria-label="Show every theme" />
        </button>
      )}
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {list.map((v, i) => {
          const qq = QUESTIONS.find((x) => x.id === v.question), th = themeById(v.theme);
          return (
            <li key={v.id} style={{ display: "flex", gap: dsSpace[12], padding: `${dsSpace[12]}px ${dsSpace[12]}px`, borderBottom: `1px solid ${ds.border.tertiary}` }}>
              <span style={{ minWidth: 24, ...dsText("Text sm"), color: ds.text.secondary, fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[4] }}>
                <span style={{ ...dsText("Text sm"), color: ds.text.secondary }}>{v.text}</span>
                <span style={{ display: "flex", alignItems: "center", gap: dsSpace[6], ...dsText("Text 3xs"), fontSize: 11, color: ds.text.quaternary }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: th.color }} />{th.label} · {qq.explorer}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {list.length === 0 && <Empty>No responses match{q ? ` “${query}”` : ""}.</Empty>}
      <p style={{ margin: `${dsSpace[16]}px 0 0`, ...dsText("Text xs"), color: ds.text.tertiary }}>A sample of what people might write. The survey's real open-text answers aren't in this prototype's data.</p>
    </>
  );
}

/* One tile per theme, sized by responses (the same split as the widget's treemap), the theme name top-left and the count
   large at the bottom. A tile opens its Verbatims. */
function ResponseMap({ rows, total, onOpen }) {
  const ref = useRef(null);
  const W = useElementWidth(ref, 900);
  const H = Math.max(420, Math.round(W * 0.5));
  const GAP = 4;
  const tiles = useMemo(() => { const out = []; splitTiles(rows, 0, 0, W + GAP, H + GAP, out); return out; }, [rows, W, H]);
  return (
    <>
      <TabHead icon={LayoutGrid} iconColor={ds.utility.graphColors.main.hotPink} title="Response Map" ai />
      <div ref={ref} role="list" aria-label="Themes" style={{ position: "relative", width: "100%", height: rows.length ? H : 0 }}>
        {tiles.map((t) => {
          const w = Math.max(0, t.w - GAP), h = Math.max(0, t.h - GAP);
          return (
            <motion.button key={t.id} type="button" role="listitem" onClick={() => onOpen(t.id)} title={`${t.label}: ${t.value} responses (${Math.round((t.value / (total || 1)) * 100)}%). Open its verbatims.`}
              layout transition={{ type: "spring", bounce: 0, duration: 0.4 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{ position: "absolute", left: t.x, top: t.y, width: w, height: h, border: "none", borderRadius: dsRadius.md, background: t.color, padding: dsSpace[12], boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", textAlign: "left", cursor: "pointer", fontFamily: font, color: ds.text.primary, overflow: "hidden" }}>
              {w > 90 && h > 56 ? <span style={{ ...dsText("Text sm", 500), maxWidth: "100%" }}>{t.label}</span> : <span />}
              <span style={{ fontSize: h > 140 && w > 90 ? 32 : 18, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{t.value}</span>
            </motion.button>
          );
        })}
      </div>
      {rows.length === 0 && <Empty>No themes match the filter.</Empty>}
    </>
  );
}

const Empty = ({ children }) => <p style={{ margin: `${dsSpace[32]}px 0`, textAlign: "center", ...dsText("Text sm"), color: ds.text.tertiary }}>{children}</p>;

function ExplorerSelect({ value, onChange }) {
  const pop = usePopover({ placement: "bottom-end", offsetPx: 6 });
  return (
    <>
      <button ref={pop.refs.setReference} type="button" {...pop.getReferenceProps()} className="fs-ghost"
        style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6], height: 30, padding: `0 ${dsSpace[8]}px`, border: "none", borderRadius: dsRadius.full, background: pop.open ? ds.button.brand.ghost.bg.active : "transparent", cursor: "pointer", fontFamily: font, ...dsText("Text sm"), color: ds.text.secondary }}>
        <ListFilter size={18} aria-hidden="true" />{value === "all" ? "All Explorers" : value}
      </button>
      <Popover pop={pop} width={240} style={{ padding: dsSpace[4] }}>
        <ul role="listbox" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {["all", ...EXPLORERS].map((e) => {
            const on = e === value;
            return (
              <li key={e} role="option" aria-selected={on} className="fs-row" onClick={() => { onChange(e); pop.setOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: dsSpace[8], padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, cursor: "pointer", ...dsText("Text sm", on ? 600 : 400), color: ds.text.primary }}>
                <span style={{ flex: 1 }}>{e === "all" ? "All Explorers" : e}</span>{on && <Check size={14} />}
              </li>
            );
          })}
        </ul>
      </Popover>
    </>
  );
}
