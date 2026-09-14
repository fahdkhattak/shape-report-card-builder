import { useState, useEffect } from "react";
import { MotionConfig, AnimatePresence } from "motion/react";
import { T } from "./lib/tokens.js";
import { nextId } from "./lib/id.js";
import { useChatThread } from "./lib/useChatThread.js";
import { extractTopics } from "./lib/generativeEngine.js";
import ChatLanding from "./components/chat/ChatLanding.jsx";
import CanvasScreen from "./components/canvas/CanvasScreen.jsx";
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
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [canvasProps, setCanvasProps] = useState({ initialWidgets: [], scopeLabel: null, chatOpen: false, generating: false });
  const [scopeInfo, setScopeInfo] = useState(null); // { areaLabel, drivers } once the opening scoping conversation confirms, else null
  const [navExpanded, setNavExpanded] = useState(false); // lifted so NavRail's expand/collapse survives screen transitions, not reset per remount
  const [searchOpen, setSearchOpen] = useState(false); // the Cmd/Ctrl+K command palette — see SearchOverlay.jsx
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

  // Search's "Library" tool — same as above, but opens an empty canvas with
  // the Library panel already open instead of adding a specific widget.
  const goLibrary = () => {
    setCanvasProps({ initialWidgets: [], scopeLabel: null, chatOpen: false, libraryOpen: true });
    setScreen("canvas");
  };

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
        />
      )}
      {screen === "canvas" && (
        <CanvasScreen
          initialWidgets={canvasProps.initialWidgets}
          scopeLabel={canvasProps.scopeLabel}
          initialChatOpen={canvasProps.chatOpen}
          initialGenerating={canvasProps.generating}
          initialLibraryOpen={canvasProps.libraryOpen}
          mainChat={mainChat}
          onExit={() => setScreen("landing")}
          navExpanded={navExpanded}
          onNavExpandedChange={setNavExpanded}
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}
    </div>

    <AnimatePresence>
      {searchOpen && (
        <SearchOverlay
          key="search"
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onGoHome={() => setScreen("landing")}
          onGoStore={() => setScreen("canvas")}
          onGoCreate={startBlank}
          onGoLibrary={goLibrary}
          onAddWidget={addLibraryWidgetDirect}
        />
      )}
    </AnimatePresence>
    </MotionConfig>
  );
}
