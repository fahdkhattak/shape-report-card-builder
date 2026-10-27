import { DRIVERS, DIMENSION_DRIVERS } from "./dataset.js";

/* ================================================================== */
/* THE DRIVERS WIDGET — one widget (formerly "Factors" as well): it ranks */
/* the Drivers that sit under the page it's on, as many as fit its card.  */
/* What it lists depends on the level of the page, never on the widget:  */
/*   - a report's first level (Org / Team / Personal report): every Driver */
/*   - an Explorer's page: that Explorer's Drivers                        */
/*   - a cluster's page (a set of Drivers put together): those Drivers     */
/*   - any level added later between the report and the Explorers (say a  */
/*     dimension): the Drivers inside it, the same way                     */
/* A page is { level, name?, drivers? }. Pure data; the card is           */
/* WidgetBody's "factors" case, the rules are read by the Developer page. */
/* ================================================================== */
export const DRIVER_PAGES = [
  { level: "report", name: "A report (Org, Team, Personal)", lists: "Every Driver", title: "Drivers" },
  { level: "dimension", name: "A dimension (a level above the Explorers, if one is added)", lists: "The Drivers inside that dimension", title: "{name} Drivers" },
  { level: "explorer", name: "An Explorer's page", lists: "That Explorer's Drivers", title: "{name} Drivers" },
  { level: "cluster", name: "A cluster's page (a set of Drivers)", lists: "Only the cluster's Drivers", title: "{name} Drivers" },
];

/* The Drivers a page lists. A dimension or cluster passes its own `drivers`; an Explorer is looked up. */
export function driversOnPage(page = { level: "report" }) {
  if (page.drivers) return page.drivers.filter((d) => DRIVERS.includes(d));
  if (page.level === "explorer") return DIMENSION_DRIVERS[page.name] || [];
  return DRIVERS;
}
export const driversTitle = (page = { level: "report" }) => (DRIVER_PAGES.find((p) => p.level === page.level)?.title || "Drivers").replace("{name}", page.name || "");
