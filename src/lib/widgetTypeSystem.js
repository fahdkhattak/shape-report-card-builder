/* ================================================================== */
/* WIDGET TYPE SYSTEM — the Font System board (Figma 984qJvMt7fCHASYHRwgrab, */
/* node 9158:33686), as data, plus an auditor that checks live widgets.  */
/*                                                                      */
/* The board's rule: every text element in a widget is exactly one of    */
/* these roles; no new roles. Font IBM Plex Sans; weights Regular (400), */
/* Medium (500) and Bold (700) only; no Light, Italic or Underline; line */
/* height "Auto, cap height to baseline". Colour follows the section the  */
/* text sits in (Header, Insight, Evidence, Action Bar).                  */
/* The board's own examples "are not a source of truth": the role specs   */
/* are. Sizes are px (the board writes 11pt for 11px).                    */
/* ================================================================== */
/* THE HEADER RULE (product direction). Every widget's header, in one place: the Header component, the audit and the
   Developer pages all read this. Text 3xs-Header / Medium; the text is trimmed to cap height and baseline; the box around
   it is 12px tall for one line (text centred) and 22px for two (first cap top to second baseline); two lines at most. */
export const HEADER_RULE = {
  style: "Text 3xs-Header / Medium", family: "IBM Plex Sans", size: 11, weight: 500, tracking: "0.11px", transform: "uppercase",
  lineHeight: "normal", trim: "trim-both cap alphabetic", colour: "text/tertiary", hex: "#7c7879", activeColour: "text/secondary", activeHex: "#504c4d",
  boxOneLine: 12, boxTwoLines: 22, maxLines: 2, gapBelow: 12,
};

export const FONT_RULES = {
  family: "IBM Plex Sans",
  weights: [400, 500, 700],
  notAllowed: ["Thin", "Light", "Italic", "Underline", "Alternative fonts", "Mixed families"],
  note: "Weight must be used intentionally to define hierarchy. Random emphasis changes are not permitted.",
};

/* Sections and their default colours. The board names greys by number; the design-system file names the same hexes one
   step differently (see `hex` and `dsToken`): the hex is what's checked. */
export const SECTIONS = [
  // Product direction (supersedes the board's utility-gray-300): text/tertiary, and text/secondary while the widget is
  // active (its Scope is open). Text 3xs-Header / Medium, line height normal trimmed to cap height and baseline.
  { id: "header", name: "Header Section", appliesTo: "All text inside the header.", colour: "text-tertiary (text-secondary when active)", hex: "#7c7879", activeHex: "#504c4d", dsToken: "text/tertiary · text/secondary when the Scope is open", rules: ["No semantic colours.", "No primary black.", "Active widget (Scope open): text-secondary."] },
  { id: "insight", name: "Insight Section", appliesTo: "Primary Metric, Metric Unit, core insight statement.", colour: "text-primary (900)", hex: "#1d1a1b", dsToken: "text/primary (Gray/950)", rules: ["A semantic colour (status) overrides the default.", "Sub-roles: chart bars semantic or neutral; data labels, legend labels, category labels in charts and axis labels → text-quaternary (500)."] },
  { id: "evidence", name: "Evidence Section", appliesTo: "Supporting caption, secondary numeric values, comparative references.", colour: "text-tertiary (600)", hex: "#7c7879", dsToken: "text/tertiary (Gray/500)", rules: ["A semantic colour overrides the default."] },
  { id: "action", name: "Action Bar", appliesTo: "Buttons and links at the foot.", colour: "text-primary (900)", hex: "#1d1a1b", dsToken: "text/primary (Gray/950)", rules: ["A semantic button style overrides the default."] },
];

/* The 13 roles. `group` is the board's column. */
export const TYPE_ROLES = [
  { id: "eyebrow", group: "Header Label", name: "Header Label (Eyebrow)", size: 11, weight: 500, tracking: "0.11px (1%)", transform: "uppercase", section: "header", use: "Context label above main content. Text 3xs-Header / Medium, line height normal, trimmed to cap height and baseline.", examples: ["ORG SCORE", "TIME IMPACT"], rules: ["Max 2 lines in 1x1.", "Truncate on overflow.", "No semantic colour override.", "text-tertiary; text-secondary while the widget is active."] },
  { id: "display", group: "Numeric Metric", name: "Primary Metric – Display", size: 64, weight: 700, section: "insight", use: "Index-level or collective summary. Single dominant metric.", examples: ["Overall Score", "Org Score", "Explorer Score (in the Explorer report card)"] },
  { id: "standard", group: "Numeric Metric", name: "Primary Metric – Standard", size: 48, weight: 700, section: "insight", use: "Single insight score.", examples: ["ENPS Score", "Time Impact", "Area to Focus"] },
  { id: "dense", group: "Numeric Metric", name: "Primary Metric – Dense", size: 36, weight: 700, section: "insight", use: "Composite or structured metric. Ranking or multi-part values.", examples: ["Health Age", "Benchmark"] },
  { id: "compact", group: "Numeric Metric", name: "Primary Metric – Compact", size: 32, weight: 700, section: "insight", use: "Metric inside a graphical container: a ring or constrained module.", examples: ["Single Explorer (score with ring)"] },
  { id: "unit", group: "Numeric Metric", name: "Metric Unit", size: 11, weight: 400, section: "insight", use: "Units beside a metric, baseline-aligned.", examples: ["US$", "K", "%", "hrs"], rules: ["Currency symbol attaches directly.", "Measurement units use a space before the unit.", "Units lowercase."] },
  { id: "status", group: "Status Metric", name: "Status Metric – Primary", size: 20, weight: 700, section: "insight", use: "Categorical state output.", examples: ["Flourishing", "Striving", "Struggling"] },
  { id: "status2", group: "Status Metric", name: "Status Metric – Secondary", size: 11, weight: 400, section: "insight", use: "Severity or intensity level.", examples: ["Moderate", "Severe", "Extremely Severe"], rules: ["Must not compete with the Primary Metric."] },
  { id: "supporting", group: "Supporting Text", name: "Supporting Text – Standard", size: 11, weight: 400, section: "evidence", use: "Captions, comparative context, dates.", examples: ["per annum", "Compared to last year", "DEC 10, 2022"] },
  { id: "catLarge", group: "Supporting Text", name: "Label – Category (large)", size: 13, weight: 700, section: "evidence", use: "Divides items into groups.", examples: ["Great", "Average", "Poor"], rules: ["Max one line.", "Truncate if overflow."] },
  { id: "catSmall", group: "Supporting Text", name: "Label – Category (small)", size: 11, weight: 400, section: "evidence", use: "Chart labels, list items, axis labels.", examples: ["Male", "Female", "Other"], rules: ["Max two lines.", "Truncate if overflow."] },
  { id: "valueLarge", group: "Supporting Text", name: "Label – Value Large", size: 16, weight: 700, section: "evidence", use: "Comparative numeric values in lists or charts.", examples: ["88", "32"], rules: ["Greater emphasis than the Category Label.", "Right aligned in row layouts.", "Never truncate."] },
  { id: "valueSmall", group: "Supporting Text", name: "Label – Value Small", size: 11, weight: 700, section: "evidence", use: "Comparative numeric values in lists or charts.", examples: ["44", "60"], rules: ["Greater emphasis than the Category Label."] },
];

/* What a text element could be, from its size and weight (several roles share 11 / Regular). */
export const rolesFor = (size, weight) => TYPE_ROLES.filter((r) => Math.abs(r.size - size) < 0.6 && r.weight === weight);
const toHex = (rgb) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || ""); return m ? `#${[m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("")}` : null; };

/* Every visible text in a rendered widget, with what it is and whether it's on the system.
   Returns [{ text, size, weight, colour, transform, roles: [ids], issues: [string], inHeader }]. */
export function auditText(root) {
  if (!root) return [];
  const out = [];
  const seen = new Set();
  const all = root.querySelectorAll("*");
  for (const el of all) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
    if (!own || seen.has(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || el.getBoundingClientRect().width === 0) continue;
    seen.add(el);
    const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400;
    const colour = toHex(el instanceof SVGElement ? cs.fill : cs.color);
    const inHeader = !!el.closest('[data-part="widget-header"]');
    const roles = rolesFor(size, weight).map((r) => r.id);
    const issues = [];
    if (![400, 500, 700].includes(weight)) issues.push(`Weight ${weight} isn't allowed (Regular, Medium, Bold only)`);
    if (!roles.length) issues.push(`${Math.round(size * 10) / 10}px / ${weight} isn't a role`);
    if (cs.fontStyle === "italic") issues.push("Italic isn't allowed");
    if (/underline/.test(cs.textDecorationLine)) issues.push("Underline isn't allowed");
    if (!/IBM Plex Sans/i.test(cs.fontFamily)) issues.push("Not IBM Plex Sans");
    if (inHeader) {
      if (!roles.includes("eyebrow")) issues.push("The header must be the Eyebrow role (11 / Medium)");
      if (colour && colour !== SECTIONS[0].hex && colour !== SECTIONS[0].activeHex) issues.push(`Header colour ${colour}, should be text-tertiary ${SECTIONS[0].hex} (text-secondary ${SECTIONS[0].activeHex} when active)`);
      if (cs.textTransform !== "uppercase") issues.push("Header must be uppercase");
    }
    out.push({ text: own.length > 40 ? `${own.slice(0, 38)}…` : own, size, weight, colour, transform: cs.textTransform, roles, issues, inHeader });
  }
  return out;
}
export const offSystem = (rows) => rows.filter((r) => r.issues.length);
