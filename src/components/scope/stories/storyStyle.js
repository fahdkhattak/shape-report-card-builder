import { createContext, useContext } from "react";

/* Which look the Story shell wears. "classic" is the original (a bordered white
   card per Story) and is the default everywhere; "refined" is the redesign —
   flat sections with space and hairlines doing the grouping, editorial titles,
   a small kind label above each. Only the Widget Builder switches it (see
   components/widgetbuilder/StoryStyleToggle.jsx); the report's Scope pane
   never provides it, so it stays classic. */
export const StoryStyleContext = createContext("classic");
export const useStoryStyle = () => useContext(StoryStyleContext);

/* Set by a host around each Story it renders, so the refined shell can show what
   kind of Story this is ("Diagnostic", "Trend"…). Optional. */
export const StoryMetaContext = createContext(null);
export const useStoryMeta = () => useContext(StoryMetaContext);
