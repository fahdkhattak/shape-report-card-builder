import { useEffect, useRef, useState } from "react";
import { Sun, Moon, ChevronRight, ChevronDown } from "lucide-react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace, dsBorder, dsShadow } from "../../lib/ds.js";
import NavRail from "../shell/NavRail.jsx";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import { STORIES } from "../widgetbuilder/storyCatalog.jsx";
import { InspectProvider, FileBadge } from "./docKit.jsx";
import InsightSummaryDoc, { meta as insightMeta, toc as insightToc } from "./docs/InsightSummaryDoc.jsx";
import ScoreMeaningDoc, { meta as meaningMeta, toc as meaningToc } from "./docs/ScoreMeaningDoc.jsx";
import BreakdownDoc, { meta as breakdownMeta, toc as breakdownToc } from "./docs/BreakdownDoc.jsx";
import DiagnosticDoc, { meta as diagnosticMeta, toc as diagnosticToc } from "./docs/DiagnosticDoc.jsx";
import CompositionDoc, { meta as compositionMeta, toc as compositionToc } from "./docs/CompositionDoc.jsx";
import ActionsDoc, { meta as actionsMeta, toc as actionsToc } from "./docs/ActionsDoc.jsx";
import ComparisonDoc, { meta as comparisonMeta, toc as comparisonToc } from "./docs/ComparisonDoc.jsx";
import TrendDoc, { meta as trendMeta, toc as trendToc } from "./docs/TrendDoc.jsx";
import ResourceDoc, { meta as resourceMeta, toc as resourceToc } from "./docs/ResourceDoc.jsx";
import MethodologyDoc, { meta as methodologyMeta, toc as methodologyToc } from "./docs/MethodologyDoc.jsx";
import UpgradeDoc, { meta as upgradeMeta, toc as upgradeToc } from "./docs/UpgradeDoc.jsx";
import CitationDoc, { meta as citationMeta, toc as citationToc } from "./docs/CitationDoc.jsx";
import VideoDoc, { meta as videoMeta, toc as videoToc } from "./docs/VideoDoc.jsx";
import QuestionnaireDoc, { meta as questionnaireMeta, toc as questionnaireToc } from "./docs/QuestionnaireDoc.jsx";
import GoalPaceDoc, { meta as goalMeta, toc as goalToc } from "./docs/GoalPaceDoc.jsx";
import RelationshipsDoc, { meta as relMeta, toc as relToc } from "./docs/RelationshipsDoc.jsx";
import ControlsDoc, { meta as controlsMeta, toc as controlsToc } from "./docs/ControlsDoc.jsx";
import TokenAuditDoc, { meta as auditMeta, toc as auditToc } from "./docs/TokenAuditDoc.jsx";
import StoryFamiliesDoc, { meta as famMeta, toc as famToc } from "./docs/StoryFamiliesDoc.jsx";
import StoryAvailabilityDoc, { meta as availMeta, toc as availToc } from "./docs/StoryAvailabilityDoc.jsx";
import StorySweepDoc, { meta as sweepMeta, toc as sweepToc } from "./docs/StorySweepDoc.jsx";
import DataModelDoc, { meta as dataMeta, toc as dataToc } from "./docs/DataModelDoc.jsx";
import { WIDGET_PAGES, WIDGET_GROUPS } from "./docs/widgets/widgetPages.js";
import AllWidgetsDoc, { meta as allWMeta, toc as allWToc } from "./docs/widgets/AllWidgetsDoc.jsx";
import WidgetStructureDoc, { meta as wsMeta, toc as wsToc } from "./docs/widgets/WidgetStructureDoc.jsx";
import WidgetTokenAuditDoc, { meta as wtaMeta, toc as wtaToc } from "./docs/widgets/WidgetTokenAuditDoc.jsx";
import WidgetTypeSystemDoc, { meta as wtsMeta, toc as wtsToc } from "./docs/WidgetTypeSystemDoc.jsx";
import ShapeSurveyDoc, { meta as surveyMeta, toc as surveyToc } from "./docs/data/ShapeSurveyDoc.jsx";
import ShapeDatasetDoc, { meta as datasetMeta, toc as datasetToc } from "./docs/data/ShapeDatasetDoc.jsx";
import { DevNavContext } from "./DataNeeds.jsx";
import { FAMILY_INFO, FAMILY_FORMS, DOCS_BY_STORY } from "./storyFamilies.js";

/* ================================================================== */
/* DEVELOPER — the handoff area. Component pages that show every Story   */
/* and every one of its states as the real running component, with its    */
/* anatomy, measured spec, colour tokens, copy rules and props — so a     */
/* developer does not have to open Figma. Nothing here is a screenshot or  */
/* a hand-typed spec where it can be measured instead (see docKit.jsx).    */
/*                                                                        */
/* To document another Story: add a page under ./docs/ exporting           */
/* `meta`, `toc` and a default component taking `{ style }`, then list it   */
/* in DOCS below. The "Not documented yet" list is every Story in the       */
/* catalog that has no page, so the roadmap is always the real remainder.    */
/* ================================================================== */
const DOCS = [
  { meta: insightMeta, toc: insightToc, Page: InsightSummaryDoc },
  { meta: meaningMeta, toc: meaningToc, Page: ScoreMeaningDoc },
  { meta: breakdownMeta, toc: breakdownToc, Page: BreakdownDoc },
  { meta: diagnosticMeta, toc: diagnosticToc, Page: DiagnosticDoc },
  { meta: compositionMeta, toc: compositionToc, Page: CompositionDoc },
  { meta: actionsMeta, toc: actionsToc, Page: ActionsDoc },
  { meta: comparisonMeta, toc: comparisonToc, Page: ComparisonDoc },
  { meta: trendMeta, toc: trendToc, Page: TrendDoc },
  { meta: resourceMeta, toc: resourceToc, Page: ResourceDoc },
  { meta: methodologyMeta, toc: methodologyToc, Page: MethodologyDoc },
  { meta: upgradeMeta, toc: upgradeToc, Page: UpgradeDoc },
  { meta: citationMeta, toc: citationToc, Page: CitationDoc },
  { meta: videoMeta, toc: videoToc, Page: VideoDoc },
  { meta: questionnaireMeta, toc: questionnaireToc, Page: QuestionnaireDoc },
  { meta: goalMeta, toc: goalToc, Page: GoalPaceDoc },
  { meta: relMeta, toc: relToc, Page: RelationshipsDoc },
];
const FOUNDATIONS = [{ meta: wtsMeta, toc: wtsToc, Page: WidgetTypeSystemDoc }, { meta: dataMeta, toc: dataToc, Page: DataModelDoc }, { meta: famMeta, toc: famToc, Page: StoryFamiliesDoc }, { meta: availMeta, toc: availToc, Page: StoryAvailabilityDoc }, { meta: sweepMeta, toc: sweepToc, Page: StorySweepDoc }, { meta: auditMeta, toc: auditToc, Page: TokenAuditDoc }];
const COMPONENTS = [{ meta: controlsMeta, toc: controlsToc, Page: ControlsDoc }];
/* Widgets: one page per Library family (docs/widgets/, built with widgetDoc.jsx). Every other family is listed as not documented yet. */
const WIDGETS = [{ meta: wsMeta, toc: wsToc, Page: WidgetStructureDoc }, { meta: allWMeta, toc: allWToc, Page: AllWidgetsDoc }, { meta: wtaMeta, toc: wtaToc, Page: WidgetTokenAuditDoc }, ...WIDGET_PAGES];
/* Data: survey records (data/import-survey.js). More records go here; a switcher can pick between them later. */
const DATA = [{ meta: surveyMeta, toc: surveyToc, Page: ShapeSurveyDoc }, { meta: datasetMeta, toc: datasetToc, Page: ShapeDatasetDoc }];
const ALL_DOCS = [...DOCS, ...WIDGETS, ...DATA, ...COMPONENTS, ...FOUNDATIONS];
DOCS.forEach((d) => { DOCS_BY_STORY[d.meta.name] = d.meta.id; });
/* The Breakdown page also covers these two forms (they are separate Stories in the catalogue). */
["Mental Well-Being", "Health Age Drivers", "Who Is Where", "How Scores Are Spread"].forEach((n) => { DOCS_BY_STORY[n] = breakdownMeta.id; });
DOCS_BY_STORY["Composition (Donut)"] = compositionMeta.id;
DOCS_BY_STORY["Who Answered"] = methodologyMeta.id;
/* Stories grouped by family, in catalogue order. */
const FAMILIES = [...new Set(STORIES.map((s) => s.family))].map((name) => ({ name, stories: STORIES.filter((s) => s.family === name) }));
const familyOf = (docName) => STORIES.find((s) => s.name === docName)?.family;

const read = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export default function DeveloperScreen({ navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder }) {
  const [docId, setDocId] = useState(() => read("developer-doc", DOCS[0].meta.id));
  const [style, setStyle] = useState(() => read("developer-story-style", "classic"));
  const [mode, setMode] = useState(() => read("developer-mode", "light"));
  const [view, setView] = useState(() => read("developer-view", "developer"));
  const [inspect, setInspect] = useState(false);
  const [openWGroup, setOpenWGroup] = useState(() => new Set());
  const toggleWGroup = (n) => setOpenWGroup((o) => { const x = new Set(o); x.has(n) ? x.delete(n) : x.add(n); return x; });
  const [openFam, setOpenFam] = useState(() => new Set(FAMILIES.filter((f) => f.stories.some((s) => DOCS_BY_STORY[s.name])).map((f) => f.name)));
  const toggleFam = (n) => setOpenFam((o) => { const x = new Set(o); x.has(n) ? x.delete(n) : x.add(n); return x; });
  const scroller = useRef(null);
  const [pendingAnchor, setPendingAnchor] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const openForm = (docTarget, anchor) => { setDocId(docTarget); setView("developer"); write("developer-view", "developer"); setActiveForm(anchor); setPendingAnchor(anchor); };
  const doc = ALL_DOCS.find((d) => d.meta.id === docId) || DOCS[0];
  const { Page } = doc;
  useEffect(() => { write("developer-doc", doc.meta.id); scroller.current?.scrollTo({ top: 0 }); }, [doc.meta.id]);
  useEffect(() => {
    if (!pendingAnchor) return undefined;
    // Jump, then once more after the page has settled (live examples change height as they measure themselves).
    const go = () => document.getElementById(pendingAnchor)?.scrollIntoView({ behavior: "auto", block: "start" });
    const t1 = setTimeout(go, 150);
    const t2 = setTimeout(() => { go(); setPendingAnchor(null); }, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pendingAnchor, doc.meta.id]);
  const pickStyle = (s) => { setStyle(s); write("developer-story-style", s); };
  const dark = mode === "dark";
  const pickView = (v) => { setView(v); write("developer-view", v); scroller.current?.scrollTo({ top: 0 }); };
  // A page can offer more than one view (Developer / Researcher); its contents list follows the view.
  const hasViews = !!doc.meta.views;
  const activeView = hasViews ? view : "developer";
  const toc = Array.isArray(doc.toc) ? doc.toc : doc.toc[activeView] || doc.toc.developer;
  const pickMode = (m) => { setMode(m); write("developer-mode", m); };

  const sideItem = (active, disabled) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[8], width: "100%", textAlign: "left", border: "none", background: active ? ds.surface.general.card : "transparent", boxShadow: active ? dsShadow("xs") : "none", color: disabled ? ds.text.disabled : active ? ds.text.primary : ds.text.secondary, fontWeight: active ? 600 : 500, ...dsText("Text xs"), fontFamily: font, padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, cursor: disabled ? "default" : "pointer" });
  const groupLabel = { ...dsText("Text 3xs-Header", 600), textTransform: "uppercase", color: ds.text.quaternary, padding: `0 ${dsSpace[12]}px`, margin: `${dsSpace[20]}px 0 ${dsSpace[6]}px` };

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: font }}>
      <NavRail active="developer" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />

      <div className={dark ? "ds-dark" : undefined} data-mode={mode} style={{ display: "flex", flex: 1, minWidth: 0, height: "100%", background: ds.bg.white, color: ds.text.primary }}>
      <aside aria-label="Components" style={{ width: 248, flexShrink: 0, background: ds.surface.general.cardWithinCard, borderRight: `${dsBorder.sm}px solid ${ds.border.tertiary}`, overflowY: "auto", padding: `${dsSpace[20]}px ${dsSpace[12]}px ${dsSpace[32]}px`, boxSizing: "border-box" }}>
        <div style={{ padding: `0 ${dsSpace[12]}px ${dsSpace[4]}px` }}>
          <div style={{ ...dsText("Text md", 600), color: ds.text.primary }}>Developer</div>
          <div style={{ ...dsText("Text 2xs"), lineHeight: "17px", color: ds.text.tertiary, marginTop: dsSpace[2] }}>Components, states, and specs. The handoff, live.</div>
        </div>
        <div style={groupLabel}>Stories by family</div>
        {FAMILIES.map((f) => {
          const ff = FAMILY_FORMS[f.name];
          const rest = ff ? f.stories.filter((s) => !ff.covers.includes(s.name)) : f.stories;
          const total = (ff ? ff.forms.length : 0) + rest.length;
          const done = (ff ? ff.forms.length : 0) + rest.filter((s) => DOCS_BY_STORY[s.name]).length, open = openFam.has(f.name);
          return (
            <div key={f.name} style={{ marginBottom: dsSpace[2] }}>
              <button onClick={() => toggleFam(f.name)} aria-expanded={open} title={FAMILY_INFO[f.name]?.question} style={{ ...sideItem(false), fontWeight: 600, color: ds.text.primary }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6] }}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{f.name}</span>
                <span style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>{done}/{total}</span>
              </button>
              {open && (
                <div style={{ paddingLeft: dsSpace[20], display: "flex", flexDirection: "column" }}>
                  {FAMILY_INFO[f.name]?.question && <div style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, padding: `${dsSpace[2]}px ${dsSpace[12]}px ${dsSpace[4]}px` }}>{FAMILY_INFO[f.name].question}</div>}
                  {ff && ff.forms.map((fm) => (
                    <button key={fm.id} onClick={() => openForm(fm.doc || ff.doc, fm.id)} aria-current={doc.meta.id === (fm.doc || ff.doc) && activeForm === fm.id ? "true" : undefined} style={sideItem(doc.meta.id === (fm.doc || ff.doc) && activeForm === fm.id)}>
                      <span>{fm.label}{fm.note && <span style={{ display: "block", ...dsText("Text 3xs"), fontWeight: 400, color: ds.text.tertiary }}>{fm.note}</span>}</span>
                    </button>
                  ))}
                  {rest.map((s) => {
                    const id = DOCS_BY_STORY[s.name];
                    return id
                      ? <button key={s.id} onClick={() => setDocId(id)} style={sideItem(id === doc.meta.id)}>{s.name}</button>
                      : <div key={s.id} style={sideItem(false, true)} title="No page yet. Each Story gets its own page.">{s.name}</div>;
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div style={groupLabel}>Widgets</div>
        <button onClick={() => setDocId(wsMeta.id)} style={sideItem(doc.meta.id === wsMeta.id)}>Widget structure</button>
        <button onClick={() => setDocId(allWMeta.id)} style={sideItem(doc.meta.id === allWMeta.id)}>All widgets</button>
        <button onClick={() => setDocId(wtaMeta.id)} style={sideItem(doc.meta.id === wtaMeta.id)}>Token audit</button>
        {WIDGET_GROUPS.map((g) => {
          const open = openWGroup.has(g.name) || g.pages.some((p) => p.id === doc.meta.id);
          const written = g.pages.filter((p) => p.written).length;
          return (
            <div key={g.name} style={{ marginBottom: dsSpace[2] }}>
              <button onClick={() => toggleWGroup(g.name)} aria-expanded={open} title={g.blurb} style={{ ...sideItem(false), fontWeight: 600, color: ds.text.primary }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6] }}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{g.name}</span>
                <span style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }} title="Written up / pages">{written}/{g.pages.length}</span>
              </button>
              {open && <div style={{ paddingLeft: dsSpace[20], display: "flex", flexDirection: "column" }}>{g.pages.map((p) => <button key={p.id} onClick={() => setDocId(p.id)} title={p.familyIds.length > 1 ? `One widget: ${p.familyIds.length} Library families` : undefined} style={sideItem(p.id === doc.meta.id)}>{p.name}</button>)}</div>}
            </div>
          );
        })}
        <div style={groupLabel}>Data</div>
        {DATA.map((d) => <button key={d.meta.id} onClick={() => setDocId(d.meta.id)} style={sideItem(d.meta.id === doc.meta.id)}>{d.meta.name}</button>)}
        <div style={groupLabel}>Components</div>
        {COMPONENTS.map((d) => <button key={d.meta.id} onClick={() => setDocId(d.meta.id)} style={sideItem(d.meta.id === doc.meta.id)}>{d.meta.name}</button>)}
        <div style={groupLabel}>Foundations</div>
        {FOUNDATIONS.map((d) => <button key={d.meta.id} onClick={() => setDocId(d.meta.id)} style={sideItem(d.meta.id === doc.meta.id)}>{d.meta.name}</button>)}
      </aside>

      <main ref={scroller} style={{ flex: 1, minWidth: 0, overflowY: "auto", background: ds.bg.white }}>
        <header style={{ position: "sticky", top: 0, zIndex: 20, background: "color-mix(in srgb, var(--ds-color-bg-white) 94%, transparent)", backdropFilter: "blur(8px)", borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, padding: `${dsSpace[12]}px ${dsSpace[40]}px`, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: dsSpace[16] }}>
            {hasViews && (
              <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8] }}>
                <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>View</span>
                <SegmentedControl options={doc.meta.views.map((v) => ({ id: v.id, label: v.label }))} value={activeView} onChange={pickView} />
              </div>
            )}
            {!["token-audit", "data-model", "widget-type-system", "widgets-tokens"].includes(doc.meta.id) && !["Widgets", "Data"].includes(doc.meta.group) && (
              <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8] }}>
                <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>Style</span>
                <SegmentedControl options={[{ id: "classic", label: "Current" }, { id: "refined", label: "Refined" }]} value={style} onChange={pickStyle} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8] }}>
              <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>Mode</span>
              <SegmentedControl options={[{ id: "light", label: <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[4] }}><Sun size={14} />Light</span> }, { id: "dark", label: <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[4] }}><Moon size={14} />Dark</span> }]} value={mode} onChange={pickMode} />
            </div>
            <button onClick={() => setInspect((v) => !v)} aria-pressed={inspect} title="Hover any element in a live example to read its size, type, colour and spacing" style={{ border: "none", cursor: "pointer", fontFamily: font, ...dsText("Text xs", 600), borderRadius: dsRadius.full, padding: `${dsSpace[8]}px ${dsSpace[16]}px`, background: inspect ? ds.interactive.primary : ds.interactive.ghostHover, color: inspect ? ds.interactive.primaryText : ds.text.primary }}>{inspect ? "Inspect on" : "Inspect"}</button>
          </div>
        </header>

        <div style={{ display: "flex", gap: dsSpace[48], padding: `${dsSpace[40]}px ${dsSpace[40]}px ${dsSpace[128]}px`, alignItems: "flex-start" }}>
          <article style={{ flex: 1, minWidth: 0, maxWidth: 1040 }}>
            <nav aria-label="Breadcrumb" style={{ ...dsText("Text xs"), color: ds.text.tertiary, marginBottom: dsSpace[12] }}>Developer <span style={{ color: ds.text.quaternary }}>›</span> {doc.meta.group}{familyOf(doc.meta.name) && familyOf(doc.meta.name) !== doc.meta.name && <> <span style={{ color: ds.text.quaternary }}>›</span> {familyOf(doc.meta.name)}</>} <span style={{ color: ds.text.quaternary }}>›</span> <b style={{ color: ds.text.primary, fontWeight: 600 }}>{doc.meta.name}</b></nav>
            <h1 style={{ margin: 0, ...dsText("Display md", 600), color: ds.text.primary }}>{doc.meta.name}</h1>
            <p style={{ margin: `${dsSpace[12]}px 0 ${dsSpace[16]}px`, ...dsText("Text lg"), color: ds.text.secondary, maxWidth: "62ch", textWrap: "pretty" }}>{doc.meta.blurb}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <FileBadge>{doc.meta.source}</FileBadge>
              
            </div>
            <DevNavContext.Provider value={{ openDoc: (id) => setDocId(id) }}><InspectProvider on={inspect} dark={dark}><Page style={style} view={activeView} onOpenDoc={(id) => setDocId(id)} /></InspectProvider></DevNavContext.Provider>
          </article>
          <nav aria-label="On this page" style={{ width: 168, flexShrink: 0, position: "sticky", top: 84, display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ ...dsText("Text 3xs-Header", 600), textTransform: "uppercase", color: ds.text.quaternary, marginBottom: dsSpace[6] }}>On this page</div>
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} style={{ ...dsText("Text xs"), color: ds.text.secondary, textDecoration: "none", padding: `${dsSpace[4]}px 0` }}>{t.label}</a>
            ))}
          </nav>
        </div>
      </main>
      </div>
    </div>
  );
}
