/* ================================================================== */
/* WIDGET STRUCTURE RULES — the "Compatible Widget Template" board      */
/* (Figma 984qJvMt7fCHASYHRwgrab, node 15463:2092), as data, plus a      */
/* checker that measures a live widget against it.                      */
/*                                                                      */
/* A widget is a column: Header, then Insight, then optionally Evidence  */
/* and/or an Action Bar, 12px apart, inside 16px of padding. Only the     */
/* Insight stretches; every other section has a fixed height. Which      */
/* sections a widget may have depends on its size (TEMPLATES).          */
/* Every widget body draws its sections with the components in            */
/* components/widgets/primitives.jsx (Sections, Insight, Evidence,        */
/* ActionBar), which read these numbers, so a body can't drift.           */
/* ================================================================== */
export const STRUCTURE = {
  padding: 16,          // card padding, all sides
  gap: 12,              // between every section, header included
  header: [12, 22],     // one line, two lines (the Header Rule, lib/widgetTypeSystem.js)
  evidence: { "1x1": 24, "2x2": 68, "3x3": 68 }, // 1x1: the Evidence Bar; 2x2 and up: the Evidence Section
  action: 24,           // the Action Bar, any size; its content sits at the right
};
/* The board measures the 16px from the card's outer edge (Figma strokes sit inside the frame). Our shell draws a 1px
   border, so it pads 15px inside it: 1 + 15 = 16, and a 1x1's content is 132px wide, as on the board. A shell without a
   border pads the full 16. */
export const SHELL_BORDER = 1;
export const SHELL_PADDING = STRUCTURE.padding - SHELL_BORDER;

/* The board's templates. `sections` after the header; the Insight always fills what's left. 3x3 isn't on the board: it
   follows the 2x2 rules (flagged on the Widget structure page). */
export const TEMPLATES = {
  "1x1": [
    { id: "1x1-i", sections: ["insight"], name: "Insight", figma: "15463:2094" },
    { id: "1x1-ie", sections: ["insight", "evidence"], name: "Insight + Evidence Bar", figma: "15489:3026" },
    { id: "1x1-ia", sections: ["insight", "action"], name: "Insight + Action Bar", figma: "15497:3229" },
  ],
  "2x2": [
    { id: "2x2-i", sections: ["insight"], name: "Insight", figma: "15463:2099" },
    { id: "2x2-ie", sections: ["insight", "evidence"], name: "Insight + Evidence Section", figma: "15463:2104" },
    { id: "2x2-iea", sections: ["insight", "evidence", "action"], name: "Insight + Evidence + Action Bar", figma: "15463:2112" },
    { id: "2x2-ia", sections: ["insight", "action"], name: "Insight + Action Bar", figma: "15463:2140" },
  ],
};
TEMPLATES["3x3"] = TEMPLATES["2x2"].map((t) => ({ ...t, id: t.id.replace("2x2", "3x3"), figma: null }));

export const templateFor = (size, sections) => (TEMPLATES[size] || []).find((t) => t.sections.join() === sections.join()) || null;
/* Height left for the Insight, by size, header lines and the other sections. */
export const insightHeight = (size, sections = ["insight"], headerLines = 1) => {
  const px = { "1x1": 164, "2x2": 344, "3x3": 524 }[size];
  let h = px - 2 * STRUCTURE.padding - STRUCTURE.header[headerLines - 1] - STRUCTURE.gap;
  if (sections.includes("evidence")) h -= STRUCTURE.evidence[size] + STRUCTURE.gap;
  if (sections.includes("action")) h -= STRUCTURE.action + STRUCTURE.gap;
  return h;
};

/* Measures one rendered widget card (the element with the 16px padding). Returns { template, sections, issues }. */
export function auditStructure(card, size) {
  const issues = [];
  if (!card) return { template: null, sections: [], issues: ["No card found"] };
  const cs = getComputedStyle(card), cr = card.getBoundingClientRect();
  const pad = ["Top", "Right", "Bottom", "Left"].map((s) => parseFloat(cs[`padding${s}`]) + parseFloat(cs[`border${s}Width`] || 0));
  if (pad.some((p) => Math.abs(p - STRUCTURE.padding) > 0.6)) issues.push(`Padding ${pad.map((p) => Math.round(p * 10) / 10).join("/")} (border included), should be ${STRUCTURE.padding}`);
  const header = card.querySelector('[data-part="widget-header"]');
  const parts = [...card.querySelectorAll('[data-part^="section-"]')].filter((el) => el.closest("[data-widget-card], [data-widget-blank]") === card || !el.closest("[data-widget-card], [data-widget-blank]"));
  const ids = parts.map((el) => el.dataset.part.replace("section-", ""));
  if (!header) issues.push("No header");
  if (!parts.length) { issues.push("Not built from sections (Insight / Evidence / Action Bar)"); return { template: null, sections: ids, issues }; }
  const tpl = templateFor(size, ids);
  if (!tpl) issues.push(`Sections ${ids.join(" + ")} isn't a ${size} template`);
  const chain = [header, ...parts].filter(Boolean).map((el) => ({ el, r: el.getBoundingClientRect(), id: el.dataset.part }));
  for (let i = 1; i < chain.length; i++) {
    const g = Math.round(chain[i].r.top - chain[i - 1].r.bottom);
    if (Math.abs(g - STRUCTURE.gap) > 1) issues.push(`${chain[i - 1].id.replace("section-", "")} → ${chain[i].id.replace("section-", "")}: ${g}px apart, should be ${STRUCTURE.gap}`);
  }
  const innerBottom = cr.bottom - pad[2];
  const last = chain[chain.length - 1];
  if (Math.abs(last.r.bottom - innerBottom) > 1.1) issues.push(`Last section ends ${Math.round(innerBottom - last.r.bottom)}px above the padding`);
  parts.forEach((el) => {
    const id = el.dataset.part.replace("section-", ""), h = Math.round(el.getBoundingClientRect().height);
    const want = id === "evidence" ? STRUCTURE.evidence[size] : id === "action" ? STRUCTURE.action : null;
    if (want != null && Math.abs(h - want) > 1) issues.push(`${id} is ${h}px, should be ${want}`);
    // Nothing may spill out of its section. Content cut off on purpose by a clipping box inside the section (the Heat
    // Map's tiles running past the card's edge) doesn't count: what shows is the clip.
    const r = el.getBoundingClientRect();
    const clipped = (c) => { for (let p = c.parentElement; p && p !== el; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflowX !== "visible" || s.overflowY !== "visible") return true; } return false; };
    const spill = [...el.querySelectorAll("*")].some((c) => { const q = c.getBoundingClientRect(); return q.width && q.height && (q.bottom > r.bottom + 1.5 || q.top < r.top - 1.5 || q.right > r.right + 1.5 || q.left < r.left - 1.5) && getComputedStyle(c).position !== "fixed" && !clipped(c); });
    if (spill) issues.push(`Something spills out of the ${id}`);
  });
  return { template: tpl, sections: ids, issues };
}

/* THE SECTION RULES (product owner): what each section is for, what may and may not go in it. Read by the Widget structure
   page; every widget is checked against them by hand when it's made (the structure check above covers only the geometry). */
export const SECTION_RULES = [
  {
    id: "header", name: "Header bar",
    role: "Tells the user what they are looking at before any data appears.",
    allowed: ["Only information that defines context: the title."],
    notAllowed: ["Values or scores", "Charts or visuals", "Trends or comparisons", "Explanations or conclusions"],
    notAllowedRule: "If it explains or interprets, it does not belong here.",
    behaviour: ["Always present, regardless of widget size.", "Height stays consistent across widgets (the Header Rule: 12px, or 22px for two lines)."],
    visual: ["Low emphasis by design. It should guide, not compete."],
    check: "If I hide everything below it, the user still knows what the widget is about, but not what the result is. If it reveals the result, it's doing too much.",
  },
  {
    id: "insight", name: "Insight Section",
    role: "Delivers the primary insight in one glance, understandable in under three seconds.",
    allowed: ["One dominant element only: a score, a status, a chart, a trend, a distribution, a ranked list or a data-encoded visual.", "Supporting elements only if they clearly reinforce the dominant insight."],
    notAllowed: ["Multiple primary insights", "Competing visual systems", "Long explanations (including a sentence above the chart that says what it shows)", "Calls to action"],
    notAllowedRule: "If it competes for attention, it does not belong here.",
    behaviour: ["One primary insight per widget.", "Visual hierarchy makes clear what matters most.", "Always visible, regardless of widget size. If this section is removed, the widget has no reason to exist."],
    visual: ["Highest visual priority in the widget.", "Strongest visual weight (size, colour or emphasis); secondary elements step back clearly."],
    check: "If I glance at this section, I immediately understand the result, without reading anything else. If understanding requires explanation, the insight is not clear enough.",
  },
  {
    id: "evidence", name: "Evidence Section",
    role: "Answers “based on what?” without competing with the Insight. It builds confidence and credibility; it never introduces new meaning or conclusions.",
    allowed: ["Distributions or breakdowns of the primary metric (a status bar, counts per band, “Across the 12 Explorers…”)", "Benchmarks or thresholds used to determine status", "Comparators directly tied to the same metric", "Supporting metrics that explain composition, not performance", "Sample size, coverage or participation", "A key to the Insight's colours (a legend), or the largest group"],
    notAllowed: ["New insights or alternative conclusions", "Primary results or headline metrics", "Visuals that compete with the Insight", "Calls to action", "Charts and graphs (they belong in the Insight)", "Side notes: what the chart shows, how it's calculated, privacy rules (“groups under 5 people aren't shown”), caveats. The Scope carries these."],
    notAllowedRule: "If it changes the takeaway, it does not belong here.",
    behaviour: ["Never required to understand the Insight.", "Never visually dominates the Insight.", "Removable without breaking comprehension.", "Holds one thing: a legend or a callout, not both."],
    visual: ["Lower visual priority than the Insight: reduced contrast, scale and emphasis.", "Clear spatial separation from the Insight."],
    check: "If I hide this section, the primary insight still makes sense, but I lose confidence and detail. If removing it changes the meaning, it's doing too much.",
  },
  {
    id: "action", name: "Action Bar",
    role: "Gives access to additional actions and links related to the widget: a support page, a help resource, related documentation, an external report, a reference link.",
    allowed: ["Only actions that extend the widget experience, relevant to its insight."],
    notAllowed: ["Primary insights or results", "Explanations or interpretations", "Mandatory actions", "Anything required to understand the widget"],
    notAllowedRule: "If the widget depends on the Action Bar to make sense, it is incomplete.",
    behaviour: ["Optional: appears only when additional actions are available.", "Selecting it opens details or opens a link.", "The widget's main interaction stays unchanged."],
    visual: ["Lowest visual priority in the widget.", "Clear separation from the Evidence and Insight.", "Subtle styling: a text link, an icon or a lightweight button."],
    check: "It should be discoverable, not demanding.",
  },
];
