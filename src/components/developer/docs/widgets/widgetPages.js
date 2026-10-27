import { FAMILIES, GROUPS } from "../../../../lib/families.js";
import { makeWidgetDoc } from "../widgetDoc.jsx";
import * as score from "./ScoreWidgetDoc.jsx";
import * as index from "./IndexWidgetDoc.jsx";
import * as status from "./StatusWidgetDoc.jsx";
import * as composition from "./CompositionWidgetDoc.jsx";
import * as scoreHistory from "./ScoreHistoryWidgetDoc.jsx";
import * as explorers from "./ExplorersWidgetDoc.jsx";
import { LIBRARY_DOCS } from "./libraryWidgetDocs.js";

/* Every Library family has a written Developer page: its own file where it needs custom sections (HAND), or a config in
   libraryWidgetDocs.js read by makeWidgetDoc. A family with neither still gets a page generated from families.js.
   One widget can be several Library families: the Score card is Org / Your / Team / Explorer Score, all presets of one
   card (lib/scoreWidget.js), so they share one page. */
const HAND = { composition, "org-status": status, "org-score": score, "your-score": score, "team-score": score, "explorer-score": score, index, "score-history": scoreHistory, explorers };

export const WIDGET_PAGES = [];
for (const f of FAMILIES) {
  const page = HAND[f.id] || makeWidgetDoc({ familyId: f.id, ...LIBRARY_DOCS[f.id] });
  const have = WIDGET_PAGES.find((p) => p.meta.id === page.meta.id);
  if (have) { have.familyIds.push(f.id); continue; }
  WIDGET_PAGES.push({ meta: page.meta, toc: page.toc, Page: page.Page, familyId: f.id, familyIds: [f.id], written: !!(HAND[f.id] || LIBRARY_DOCS[f.id]) });
}
export const pageIdOf = (familyId) => WIDGET_PAGES.find((p) => p.familyIds.includes(familyId))?.meta.id || `widget-${familyId}`;

/* The Library's groups, in its own order, with their families and their pages (one entry per page, so the four Score
   families are one "Score" entry). */
export const WIDGET_GROUPS = GROUPS.map((g) => {
  const families = FAMILIES.filter((f) => f.category === g.id);
  const pages = WIDGET_PAGES.filter((p) => families.some((f) => p.familyIds.includes(f.id)));
  return { name: g.id, blurb: g.blurb, families, pages: pages.map((p) => ({ id: p.meta.id, name: p.meta.name, written: p.written, familyIds: p.familyIds })) };
}).filter((g) => g.families.length);
