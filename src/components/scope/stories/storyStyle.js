import { createContext, useContext } from "react";

/* Which look the Story shell wears. "classic" is the original (a bordered white
   card per Story) and is the default everywhere; "refined" is the redesign —
   flat sections with space and hairlines doing the grouping, editorial titles,
   a small kind label above each. The Widget Builder and the report's Scope pane
   (ScopePanel.jsx) both switch it with components/widgetbuilder/StoryStyleToggle.jsx,
   from one stored preference. */
export const StoryStyleContext = createContext("classic");
export const useStoryStyle = () => useContext(StoryStyleContext);

/* Set by a host around each Story it renders, so the refined shell can show what
   kind of Story this is ("Diagnostic", "Trend"…). Optional. */
export const StoryMetaContext = createContext(null);
export const useStoryMeta = () => useContext(StoryMetaContext);
