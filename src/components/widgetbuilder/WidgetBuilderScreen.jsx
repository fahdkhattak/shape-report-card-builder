import { useState } from "react";
import { font } from "../../lib/tokens.js";
import WidgetBuilderV1 from "./WidgetBuilderV1.jsx";
import WidgetBuilderV2 from "./WidgetBuilderV2.jsx";
import { StoryStyleContext } from "../scope/stories/storyStyle.js";
import { PreviewWidthProvider } from "./PreviewWidth.jsx";

const VERSION_KEY = "widget-builder-version";
const STYLE_KEY = "widget-builder-story-style";
const SCREENS = { v1: WidgetBuilderV1, v2: WidgetBuilderV2 };

/* ================================================================== */
/* WIDGET BUILDER — version switcher. Two self-contained prototypes of    */
/* the same flow (describe a widget → get the widget and its Scope):       */
/*  v1 "Original" — chat column on the left, widget + Scope on the right.   */
/*  v2 "Workbench" — a redesign pass (see WidgetBuilderV2.jsx).            */
/* Both read and write the same builder session (`state`, owned by App),    */
/* so switching mid-way keeps the widget you were working on. The choice     */
/* is remembered, like the Survey Builder's.                               */
/* ================================================================== */
export default function WidgetBuilderScreen(props) {
  const [version, setVersion] = useState(() => {
    try { return localStorage.getItem(VERSION_KEY) || "v1"; } catch { return "v1"; }
  });
  const choose = (v) => {
    setVersion(v);
    try { localStorage.setItem(VERSION_KEY, v); } catch { /* storage unavailable */ }
  };
  // How the Scope's Stories are drawn: "classic" (the original cards) or "refined" (the redesign).
  // Only this screen provides it, so the report's own Scope pane is never affected.
  const [storyStyle, setStoryStyle] = useState(() => {
    try { return localStorage.getItem(STYLE_KEY) || "classic"; } catch { return "classic"; }
  });
  const chooseStyle = (v) => {
    setStoryStyle(v);
    try { localStorage.setItem(STYLE_KEY, v); } catch { /* storage unavailable */ }
  };
  const Screen = SCREENS[version] ?? WidgetBuilderV1;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: font }}>
      <StoryStyleContext.Provider value={storyStyle}>
        <PreviewWidthProvider>
          <Screen {...props} version={version} onVersionChange={choose} storyStyle={storyStyle} onStoryStyleChange={chooseStyle} />
        </PreviewWidthProvider>
      </StoryStyleContext.Provider>
    </div>
  );
}
