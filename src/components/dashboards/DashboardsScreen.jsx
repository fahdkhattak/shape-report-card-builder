import { useLayoutEffect, useRef, useState } from "react";
import NavRail from "../shell/NavRail.jsx";
import Dropdown from "../ui/Dropdown.jsx";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../lib/ds.js";
import { Report, PAGES } from "./cbi-wxi/pages.jsx";
import { PAGE_W, PAGE_H } from "./cbi-wxi/pbi.jsx";
import { GLOBAL_NOTES, PAGE_NOTES, THEME_SWATCHES } from "./cbi-wxi/notes.js";
import p1 from "./cbi-wxi/original/page-1.jpg";
import p2 from "./cbi-wxi/original/page-2.jpg";
import p3 from "./cbi-wxi/original/page-3.jpg";
import p4 from "./cbi-wxi/original/page-4.jpg";
import p5 from "./cbi-wxi/original/page-5.jpg";
import p6 from "./cbi-wxi/original/page-6.jpg";

/* ================================================================== */
/* DASHBOARDS — redesign mockups of client dashboards, kept isolated     */
/* from the rest of the product (everything lives in components/        */
/* dashboards/). A dropdown picks the dashboard; Original | Redesign     */
/* compares; the notes panel says what changed and how to build each    */
/* page in Power BI. Each dashboard is { id, name, pages, Report,        */
/* originals, notes }; add one by adding an entry to DASHBOARDS.        */
/* ================================================================== */
const DASHBOARDS = [
  { id: "cbi-wxi", name: "CBI · WXI Site Dashboard", tool: "Power BI", pages: PAGES, Report, originals: { 1: p1, 2: p2, 3: p3, 4: p4, 5: p5, 6: p6 }, notes: PAGE_NOTES, global: GLOBAL_NOTES, swatches: THEME_SWATCHES },
];
const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

/* Scale the fixed 1280 × 720 page to fit its stage, as Power BI's "Fit to page". */
function useFit(ref) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(el.clientWidth / PAGE_W, el.clientHeight / PAGE_H)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

export default function DashboardsScreen({ navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder }) {
  const [dashId, setDashId] = useState(() => read("dashboards-id", DASHBOARDS[0].id));
  const dash = DASHBOARDS.find((d) => d.id === dashId) || DASHBOARDS[0];
  const [page, setPage] = useState(() => read("dashboards-page", "overview"));
  const [view, setView] = useState(() => read("dashboards-view", "redesign"));
  const [notes, setNotes] = useState(() => read("dashboards-notes", "on") === "on");
  // Preview switch for client options the report shows only when requested (Health Age).
  const [healthAge, setHealthAge] = useState(() => read("dashboards-health-age", "off") === "on");
  const go = (p) => { setPage(p); write("dashboards-page", p); };
  const pick = (v) => { setView(v); write("dashboards-view", v); };
  const stage = useRef(null);
  const scale = useFit(stage);
  const cur = dash.pages.find((p) => p.id === page) || dash.pages[0];
  const n = dash.notes[cur.id];

  const tab = (on) => ({ height: 30, padding: `0 ${dsSpace[12]}px`, border: "none", borderRadius: dsRadius.md, background: on ? ds.surface.general.card : "transparent", boxShadow: on ? `0 0 0 1px ${ds.border.tertiary}` : "none", color: on ? ds.text.primary : ds.text.secondary, fontFamily: font, ...dsText("Text xs", on ? 600 : 500), cursor: "pointer", whiteSpace: "nowrap" });

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: font }}>
      <style>{`.pbi-row { border-radius: 6px; margin: 0 -8px; padding-left: 8px !important; padding-right: 8px !important; } .pbi-row:hover { background: #F3F5FA; } .pbi-row:focus-visible { outline: 2px solid #24317E; outline-offset: -2px; }`}</style>
      <NavRail active="dashboards" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: ds.bg.primary }}>
        {/* Top bar: which dashboard, which view, notes. */}
        <header style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", gap: dsSpace[12], padding: `0 ${dsSpace[20]}px`, background: ds.surface.general.card, borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` }}>
          <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Dashboards</span>
          <Dropdown ariaLabel="Dashboard" value={dash.id} onChange={(v) => { setDashId(v); write("dashboards-id", v); }} options={DASHBOARDS.map((d) => ({ value: d.id, label: d.name }))} />
          <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>Mockup for {dash.tool} · 1280 × 720 pages</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: dsSpace[12] }}>
            {view === "redesign" && cur.id === "overview" && (
              <label style={{ display: "flex", alignItems: "center", gap: dsSpace[6], ...dsText("Text xs", 500), color: ds.text.secondary, cursor: "pointer", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={healthAge} onChange={(e) => { setHealthAge(e.target.checked); write("dashboards-health-age", e.target.checked ? "on" : "off"); }} />
                Health Age requested
              </label>
            )}
            <SegmentedControl value={view} onChange={pick} options={[{ id: "original", label: "Original" }, { id: "redesign", label: "Redesign" }]} />
            <button type="button" onClick={() => { setNotes((v) => { write("dashboards-notes", v ? "off" : "on"); return !v; }); }} aria-pressed={notes}
              style={{ height: 32, padding: `0 ${dsSpace[12]}px`, borderRadius: dsRadius.full, border: `${dsBorder.sm}px solid ${notes ? ds.border.strong : ds.border.secondary}`, background: notes ? ds.interactive.ghostHover : "transparent", color: ds.text.primary, fontFamily: font, ...dsText("Text xs", 500), cursor: "pointer" }}>
              {notes ? "Hide notes" : "Build notes"}
            </button>
          </div>
        </header>
        {/* Page tabs (Power BI's page tabs). The drill-through page is listed so it can be reviewed directly. */}
        <div style={{ display: "flex", alignItems: "center", gap: dsSpace[4], padding: `${dsSpace[8]}px ${dsSpace[20]}px`, borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, background: ds.bg.primary, overflowX: "auto" }}>
          {dash.pages.map((p, i) => (
            <button key={p.id} type="button" onClick={() => go(p.id)} style={tab(p.id === cur.id)}>
              <span style={{ color: ds.text.quaternary, marginRight: 6 }}>{i + 1}</span>{p.name}{p.drill && <span style={{ color: ds.text.tertiary, fontWeight: 400 }}> · drill-through</span>}
            </button>
          ))}
          <span style={{ marginLeft: "auto", ...dsText("Text 2xs"), color: ds.text.tertiary, whiteSpace: "nowrap" }}>{view === "original" ? `Original page ${cur.original} of 6` : "Redesign · interactive mockup"}</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <div ref={stage} style={{ flex: 1, minWidth: 0, margin: dsSpace[20], display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: PAGE_W * scale, height: PAGE_H * scale, flexShrink: 0, boxShadow: "0 1px 3px rgba(30,34,48,0.12), 0 8px 24px rgba(30,34,48,0.08)", borderRadius: 4, overflow: "hidden", background: "#fff" }}>
              <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                {view === "original"
                  ? <img src={dash.originals[cur.original]} alt={`Original Power BI page ${cur.original}: ${cur.name}`} style={{ width: PAGE_W, height: PAGE_H, objectFit: "contain", background: "#fff", display: "block" }} />
                  : <dash.Report page={cur.id} go={go} healthAge={healthAge} />}
              </div>
            </div>
          </div>
          {notes && (
            <aside aria-label="Build notes" style={{ width: 340, flexShrink: 0, overflowY: "auto", background: ds.surface.general.card, borderLeft: `${dsBorder.sm}px solid ${ds.border.tertiary}`, padding: `${dsSpace[20]}px ${dsSpace[20]}px ${dsSpace[32]}px`, boxSizing: "border-box" }}>
              <div style={{ ...dsText("Text 3xs-Header", 600), textTransform: "uppercase", color: ds.text.quaternary }}>{cur.name}</div>
              <NoteList title="What changed" items={n.changed} />
              <NoteList title="Build it in Power BI" items={n.build} />
              <div style={{ height: 1, background: ds.border.tertiary, margin: `${dsSpace[20]}px 0` }} />
              <div style={{ ...dsText("Text 3xs-Header", 600), textTransform: "uppercase", color: ds.text.quaternary }}>Every page</div>
              <NoteList title="What changed" items={dash.global.changed} />
              <NoteList title="Build it in Power BI" items={dash.global.build} />
              <div style={{ ...dsText("Text xs", 600), color: ds.text.primary, marginTop: dsSpace[16] }}>Theme colours</div>
              <div style={{ display: "grid", gap: dsSpace[6], marginTop: dsSpace[8] }}>
                {dash.swatches.map(([name, hex]) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: dsSpace[8], ...dsText("Text 2xs"), color: ds.text.secondary }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: hex, boxShadow: `inset 0 0 0 1px ${ds.border.tertiary}` }} />{name}<code style={{ marginLeft: "auto", color: ds.text.tertiary }}>{hex}</code>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteList({ title, items }) {
  return (
    <div style={{ marginTop: dsSpace[12] }}>
      <div style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{title}</div>
      <ul style={{ margin: `${dsSpace[6]}px 0 0`, paddingLeft: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[6], ...dsText("Text 2xs"), color: ds.text.secondary }}>
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}
