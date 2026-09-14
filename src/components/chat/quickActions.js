/* Functional quick-action prompts — real strings our generative engine
   understands (see lib/generativeEngine.js). Shared between ChatLanding
   and ChatPanel so the same chips appear everywhere the main thread does.

   The real chat reference's own chip labels ("Create Widget"/"Create
   Report"/"Find Insights"/"Investigate Findings") are generic category
   names the engine doesn't parse — using them verbatim would make every
   click fall through to a plain metric card, a real regression for a
   prototype meant to demo real generation. "Create Report" is kept as its
   own distinct action (see onCreateReport) since it maps to a real,
   different behavior (a full multi-widget report, not a single variant). */
export const QUICK_ACTIONS = ["Compare sleep and stress", "Show engagement trend over time", "What's our flourishing status?"];
