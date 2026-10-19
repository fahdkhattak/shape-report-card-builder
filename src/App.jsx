import { useState, useEffect } from "react";
import { MotionConfig, AnimatePresence } from "motion/react";
import { T } from "./lib/tokens.js";
import { nextId } from "./lib/id.js";
import { useChatThread } from "./lib/useChatThread.js";
import { extractTopics } from "./lib/generativeEngine.js";
import ChatLanding from "./components/chat/ChatLanding.jsx";
import CanvasScreen from "./components/canvas/CanvasScreen.jsx";
import LibraryScreen from "./components/library/LibraryScreen.jsx";
import SurveyBuilderScreen from "./components/survey/SurveyBuilderScreen.jsx";
import WidgetBuilderScreen from "./components/widgetbuilder/WidgetBuilderScreen.jsx";
import DeveloperScreen from "./components/developer/DeveloperScreen.jsx";
import { NavActionsContext } from "./lib/navActions.js";
import SearchOverlay from "./components/shell/SearchOverlay.jsx";

/* ================================================================== */
/* APP ROOT — chat-first flow, per the real product reference           */
/* (984qJvMt7fCHASYHRwgrab): full-page chat landing -> canvas, sharing   */
/* one continuous `mainChat` thread. A blank canvas is still reachable   */
/* (direct-construction path, PRD §5.2) via a subtle link on landing.    */
/*                                                                       */
/* There is no separate "generating" screen anymore — per the newer      */
/* chat-redesign reference (Z6YmEggwvoiX3j4d3kCKqV), "Create Report"     */
/* goes straight to CanvasScreen with `initialGenerating: true`; that     */
/* screen shows a skeleton grid + an inline chat checklist itself. See   */
/* CLAUDE.md for why the old GeneratingScreen.jsx route was retired.     */
/* ================================================================== */
// What the Org report starts with, in the design's own order (Figma 11070:9301).
const DEFAULT_ORG_WIDGETS = [
  ["org-score", 0], ["org-status", 0], ["explorers", 0], ["enps", 0], ["score-history", 1], ["popular-responses", 0],
  ["areas-focus", 0], ["avg-gender", 0], ["avg-work-model", 0], ["time-impact", 0], ["money-composition", 0], ["heat-map", 0],
].map(([familyId, formIndex]) => ({ familyId, formIndex }));

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [canvasProps, setCanvasProps] = useState({ initialWidgets: [], scopeLabel: null, chatOpen: false, generating: false });
  const [scopeInfo, setScopeInfo] = useState(null); // { areaLabel, drivers } once the opening scoping conversation confirms, else null
  const [navExpanded, setNavExpanded] = useState(false); // lifted so NavRail's expand/collapse survives screen transitions, not reset per remount
  const [searchOpen, setSearchOpen] = useState(false); // the Cmd/Ctrl+K command palette — see SearchOverlay.jsx
  // The widgets on the Org report, as { familyId, formIndex } — what the Library
  // screen calls "in use". The report is rebuilt from this each time it opens.
  const [orgLibrary, setOrgLibrary] = useState(DEFAULT_ORG_WIDGETS);
  const [builder, setBuilder] = useState({ messages: [], built: null }); // Widget Builder session — lives here so it survives leaving the screen
  const mainChat = useChatThread();

  // Global Cmd/Ctrl+K — SearchOverlay's own Escape handling covers closing it
  // once open; this only needs to handle the open trigger, from anywhere.
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const startBlank = () => {
    setCanvasProps({ initialWidgets: [], scopeLabel: null, chatOpen: false });
    setScreen("canvas");
  };

  // The chat-first flow's own entry point — reused both by SearchOverlay's
  // "Home" tool and by NavRail's CreateToolsMenu "Report Builder" row,
  // since that flow already IS this app's report builder; there's no
  // separate tool to launch, just its start screen.
  const goHome = () => setScreen("landing");

  // Same pattern, for NavRail's CreateToolsMenu "Survey Builder" row — the
  // node-based blueprint editor (components/survey/SurveyBuilderScreen.jsx).
  const goSurveyBuilder = () => setScreen("survey-builder");

  // Create menu "Widget Builder" — a separate flow from the report builder
  // (components/widgetbuilder/WidgetBuilderScreen.jsx).
  const goWidgetBuilder = () => setScreen("widget-builder");

  const addWidgetDirect = (spec) => {
    setCanvasProps({ initialWidgets: [{ id: nextId(), kind: "generated", spec }], scopeLabel: spec.title, chatOpen: true });
    setScreen("canvas");
  };

  // Search's "Widgets" section — same single-widget direct-add path as
  // `addWidgetDirect` above, just for a library familyId/formIndex instead
  // of a generated spec.
  const addLibraryWidgetDirect = (familyId, formIndex = 0) => {
    setCanvasProps({ initialWidgets: [{ id: nextId(), kind: "library", familyId, formIndex }], scopeLabel: null, chatOpen: false });
    setScreen("canvas");
  };

  // The Library screen (every widget, grouped) — Search's "Library" tool and
  // the sidebar's Library item both land here.
  const goLibrary = () => setScreen("library");
  const goDeveloper = () => setScreen("developer"); // the handoff area (components/developer/)
  const addToOrgReport = (familyId, formIndex) => setOrgLibrary((l) => (l.some((w) => w.familyId === familyId && w.formIndex === formIndex) ? l : [...l, { familyId, formIndex }]));
  const removeFromOrgReport = (familyId, formIndex) => setOrgLibrary((l) => l.filter((w) => !(w.familyId === familyId && w.formIndex === formIndex)));

  // Sidebar "Your Reports > SHAPE Performance Report > Org" (and the Org nav
  // icon) — the Org version of the Performance report, built to Figma node
  // 11070:9301. Widgets are seeded in that design's own order; the 6-column
  // grid's auto-placement then reproduces its layout (see CLAUDE.md).
  const buildOrgReport = (extraWidgets = []) => {
    setCanvasProps({
      initialWidgets: [
        ...orgLibrary.map((w) => ({ id: nextId(), kind: "library", familyId: w.familyId, formIndex: w.formIndex })),
        ...extraWidgets,
      ],
      scopeLabel: null, chatOpen: false, generating: false, libraryOpen: false,
      report: {
        title: "Performance Advantage Index", persona: "Org", reportType: "Org Report",
        // Per-column-count widget order, read off the 6-/3-/2-column frames of
        // Figma nodes 11070:9301 and 14463:13793 (keyed by familyId).
        layouts: {
          6: ["org-score", "org-status", "explorers", "enps", "score-history", "popular-responses", "areas-focus", "avg-gender", "avg-work-model", "time-impact", "money-composition", "heat-map"],
          5: ["org-score", "org-status", "explorers", "score-history", "enps", "popular-responses", "areas-focus", "avg-gender", "avg-work-model", "time-impact", "money-composition", "heat-map"],
          4: ["org-score", "explorers", "org-status", "score-history", "enps", "time-impact", "areas-focus", "money-composition", "popular-responses", "avg-gender", "avg-work-model", "heat-map"],
          3: ["org-score", "org-status", "score-history", "explorers", "enps", "popular-responses", "areas-focus", "avg-gender", "avg-work-model", "time-impact", "money-composition", "heat-map"],
          2: ["org-score", "org-status", "score-history", "time-impact", "enps", "money-composition", "areas-focus", "explorers", "avg-work-model", "popular-responses", "avg-gender", "heat-map"],
        },
      },
    });
    setScreen("canvas");
  };

  const openOrgReport = () => buildOrgReport();

  // Widget Builder's "Add to Report": the Org report with the built widget
  // after the standard ones. Its Scope (spec.scope) opens in the Scope pane.
  const addBuiltToReport = ({ spec, scope }) => buildOrgReport([{ id: nextId(), kind: "generated", spec, scope }]);

  const createReport = () => {
    // Prefer the confirmed scope from the opening topic/driver conversation
    // over re-deriving it from the whole transcript — that conversation is
    // exactly what establishes what this report is actually about.
    const label = scopeInfo?.areaLabel
      || extractTopics(mainChat.messages.filter((m) => m.role === "user").map((m) => m.text).join(" ")).slice(0, 2).join(" & ")
      || null;
    const seeded = [
      { id: nextId(), kind: "library", familyId: "your-score", formIndex: 1 },
      { id: nextId(), kind: "library", familyId: "explorers", formIndex: 0 },
      { id: nextId(), kind: "library", familyId: "org-status", formIndex: 0 },
    ];
    setCanvasProps({ initialWidgets: seeded, scopeLabel: label, chatOpen: true, generating: true });
    setScreen("canvas");
  };

  return (
    // `reducedMotion="user"` makes every spring/animation in this app —
    // Motion-driven ones, not plain CSS transitions — automatically defer to
    // the OS's "Reduce Motion" setting (disables transforms, keeps opacity),
    // per Apple's own reduced-motion guidance: a gentler equivalent, not a
    // silent removal of all feedback. Set once here rather than per-component.
    <MotionConfig reducedMotion="user">
    <NavActionsContext.Provider value={{ openReport: openOrgReport, openWidgetBuilder: goWidgetBuilder, openLibrary: goLibrary, openDeveloper: goDeveloper }}>
    <div style={{ width: "100%", height: "100vh", background: T.white }}>
      {screen === "landing" && (
        <ChatLanding
          mainChat={mainChat}
          scopeInfo={scopeInfo}
          onAddWidgetDirect={addWidgetDirect}
          onCreateReport={createReport}
          onScopeConfirmed={(areaLabel, drivers) => setScopeInfo({ areaLabel, drivers })}
          onBlankCanvas={startBlank}
          navExpanded={navExpanded}
          onNavExpandedChange={setNavExpanded}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenReportBuilder={goHome}
          onOpenSurveyBuilder={goSurveyBuilder}
        />
      )}
      {screen === "canvas" && (
        <CanvasScreen
          key={canvasProps.report ? "org-report" : "canvas"}
          initialWidgets={canvasProps.initialWidgets}
          scopeLabel={canvasProps.scopeLabel}
          initialChatOpen={canvasProps.chatOpen}
          initialGenerating={canvasProps.generating}
          initialLibraryOpen={canvasProps.libraryOpen}
          report={canvasProps.report}
          mainChat={mainChat}
          onExit={() => setScreen("landing")}
          navExpanded={navExpanded}
          onNavExpandedChange={setNavExpanded}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenReportBuilder={goHome}
          onOpenSurveyBuilder={goSurveyBuilder}
        />
      )}
      {screen === "widget-builder" && (
        <WidgetBuilderScreen
          state={builder}
          setState={setBuilder}
          navExpanded={navExpanded}
          onNavExpandedChange={setNavExpanded}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenReportBuilder={goHome}
          onOpenSurveyBuilder={goSurveyBuilder}
          onAddToReport={addBuiltToReport}
        />
      )}
      {screen === "library" && (
        <LibraryScreen
          inUse={orgLibrary.map((w) => `${w.familyId}:${w.formIndex}`)}
          onAdd={addToOrgReport}
          onRemove={removeFromOrgReport}
          onCreateWidget={goWidgetBuilder}
          navExpanded={navExpanded}
          onNavExpandedChange={setNavExpanded}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenReportBuilder={goHome}
          onOpenSurveyBuilder={goSurveyBuilder}
        />
      )}
      {screen === "developer" && (
        <DeveloperScreen
          navExpanded={navExpanded}
          onNavExpandedChange={setNavExpanded}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenReportBuilder={goHome}
          onOpenSurveyBuilder={goSurveyBuilder}
        />
      )}
      {screen === "survey-builder" && (
        <SurveyBuilderScreen
          navExpanded={navExpanded}
          onNavExpandedChange={setNavExpanded}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenReportBuilder={goHome}
          onOpenSurveyBuilder={goSurveyBuilder}
          onExit={goHome}
        />
      )}
    </div>

    <AnimatePresence>
      {searchOpen && (
        <SearchOverlay
          key="search"
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onGoHome={goHome}
          onGoStore={() => setScreen("canvas")}
          onGoCreate={startBlank}
          onGoLibrary={goLibrary}
          onAddWidget={addLibraryWidgetDirect}
        />
      )}
    </AnimatePresence>
    </NavActionsContext.Provider>
    </MotionConfig>
  );
}
