import { useState, useRef, useEffect } from "react";
import { ds, dsText, dsSpace, dsRadius, dsBorder, DS_RAW } from "../../../lib/ds.js";
import { band } from "../../../lib/tokens.js";
import { FLOURISHING_AT, STRIVING_AT, countByStatus } from "../../../lib/bands.js";
import { dimensionSeries, LAST } from "../../../lib/scopeData.js";
import { ROUNDS, EMPLOYEE_COUNT, DIMENSIONS, DRIVERS } from "../../../lib/dataset.js";
import { orgSeverity, SEVERITY, SEVERITY_FROM } from "../../../lib/wellbeing.js";
import BreakdownStory from "../../scope/stories/BreakdownStory.jsx";
import SeverityBreakdownStory from "../../scope/stories/SeverityBreakdown.jsx";
import EffectBreakdownStory from "../../scope/stories/EffectBreakdown.jsx";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import SegmentedControl from "../../ui/SegmentedControl.jsx";
import { RULES, fitForm } from "../../scope/stories/breakdownRules.js";
import { STORIES } from "../../widgetbuilder/storyCatalog.jsx";
import { overallSubject } from "../../../lib/scopeSubject.js";
import { Section, Prose, Callout, Variant, Anatomy, StoryStage, PropsTable, CodeBlock, FileBadge, FigmaParity, lightHexOf } from "../docKit.jsx";
import { ContrastTable, SpecTable, SimpleTable, T, tok, Fact, Limit, Two, List, card_ } from "../docParts.jsx";

const OVERALL = overallSubject();
const liveStory = (id) => STORIES.find((x) => x.id === id).render(OVERALL, {});

export const meta = {
  id: "breakdown", name: "Breakdown", group: "Stories", kind: "Breakdown",
  blurb: "The parts, factors, categories, or measures that contribute to the selected insight.",
  source: "components/scope/stories/BreakdownStory.jsx · BreakdownStory, SeverityBreakdownStory, EffectBreakdownStory", figma: "13622:35946",
  views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }],
};
export const toc = {
  developer: [
    { id: "overview", label: "Overview" }, { id: "forms", label: "The forms" }, { id: "playground", label: "Try it" }, { id: "anatomy", label: "Anatomy" },
    { id: "spec", label: "Specification" }, { id: "states", label: "States & variants" }, { id: "responsive", label: "Responsive" }, { id: "limits", label: "Few, many, odd" }, { id: "edges", label: "Sizes & edge cases" }, { id: "content", label: "Content & voice" },
    { id: "a11y", label: "Accessibility" }, { id: "props", label: "Props & usage" }, { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
  ],
  researcher: [
    { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "shows", label: "What it can show" }, { id: "forms", label: "The forms" },
    { id: "live", label: "Live from the data" }, { id: "limits", label: "Constraints" }, { id: "questions", label: "Answers & non-answers" }, { id: "neighbours", label: "Next to other Stories" }, { id: "open", label: "Open questions" },
  ],
};

/* ======================================================================================================== */
/* Samples                                                                                                   */
/* ======================================================================================================== */
const series = (now, delta) => Array.from({ length: LAST + 1 }, (_, i) => (i === LAST ? now : i === LAST - 1 ? now - delta : now - delta - 1));
const item = (label, now, delta, blurb) => ({ label, values: series(now, delta), blurb });
const AREAS = [
  item("Communication Flow", 84, 9, "You hear what matters in time to act, and can raise concerns without weighing the risk. Use that to say what others may be holding back."),
  item("Digital Flow", 65, 1, "Digital tools and systems work reliably together, helping people stay focused on meaningful work."),
  item("Engagement Flow", 61, -11, "You're engaged, though some days ask more than others. Noticing what those days share is useful."),
  item("Information Flow", 55, -9, "You usually find what you need, though not always first time. It's worth noticing where the searching happens most."),
  item("Organisational Flow", 40, 2, "Flow at work is regularly interrupted by unclear decisions or heavy processes. Track where time goes to show the delays."),
];
const DRIVER_ITEMS = [item("Process Effectiveness", 61, 9), item("Strategic Alignment Clarity", 52, -2), item("Approval Efficiency", 38, -2), item("Coordination Friction", 44, -2), item("Cross-Team Collaboration Efficiency", 41, -2), item("Decision-Making Speed", 43, -2)];
const CURVE = [item("Strategic Alignment Clarity", 47, 0), item("Approval Efficiency", 40, 0), item("Coordination Friction", 61, 0), item("Cross-Team Collaboration Efficiency", 36, 0), item("Decision-Making Speed", 34, 0), item("Process Effectiveness", 8, 0)];
const FOOT = "Select a point to see its score. For each answer, the higher the score, the better.";
const DRIVERS_LINE = <>Organisational Flow is made up of <b>6 drivers</b>. Explore them to see which parts are helping your flow and which may be getting in the way.</>;
const AREAS_LINE = "See how your results compare across the 5 Areas.";

const cells = (arr) => arr.map(([pct, count, delta]) => ({ pct, count, delta }));
const SEVERITY_TEAM = [
  { label: "Feeling Low", cells: cells([[21, 5, 1], [9, 6, -1], [31, 15, 1], [10, 2, -1], [21, 14, -1]]) },
  { label: "Feeling Anxious", cells: cells([[25, 5, 1], [15, 6, 1], [20, 15, 1], [10, 2, -1], [30, 14, 1]]) },
  { label: "Feeling Stressed", cells: cells([[30, 5, -1], [15, 6, -1], [10, 6, -1], [20, 5, -1], [25, 14, 1]]) },
];
const SEVERITY_PERSONAL = [
  { label: "Feeling Low", current: 2, trend: 1, sentence: "You're experiencing occasional low moods that may impact your overall well-being. Stay mindful.", cells: cells([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]) },
  { label: "Feeling Anxious", current: 0, trend: 1, sentence: "You're feeling calm and composed, with no significant signs of anxiety present.", cells: cells([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]) },
  { label: "Feeling Stressed", current: 4, trend: -1, sentence: "You're under extreme stress, heavily affecting your well-being. Seek support immediately.", cells: cells([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]) },
];
const HEALTH = [{ label: "BMI", months: 6 }, { label: "Stress", months: 5 }, { label: "Sleep", months: 3 }, { label: "Vaping", months: null }, { label: "Nutrition", months: -4 }, { label: "Alcohol", months: -6 }, { label: "Exercise", months: -11 }, { label: "Smoking", months: -20 }];

/* ---- parity samples: the frames in Figma node 13622:35946, with the design's own wording ---- */
const classic = (n) => <StoryStyleContext.Provider value="classic">{n}</StoryStyleContext.Provider>;
const FRadar = () => classic(<BreakdownStory variant="radar" items={AREAS} noun="Area" line={AREAS_LINE} hint={FOOT} />);
const FArea = () => classic(<BreakdownStory variant="area" items={CURVE} noun="Driver" line={DRIVERS_LINE} hint={FOOT} />);
const FBars = () => classic(<BreakdownStory variant="bars" items={DRIVER_ITEMS} noun="Driver" line={DRIVERS_LINE} rank={false} />);
const FList = () => classic(<BreakdownStory variant="list" items={AREAS} noun="Area" />);
const FDist = () => classic(<BreakdownStory variant="distribution" items={[...Array(7)].map((_, i) => item(`E${i}`, 85, 0)).concat([...Array(3)].map((_, i) => item(`S${i}`, 65, 0)), [...Array(2)].map((_, i) => item(`T${i}`, 40, 0)))} noun="Explorer" />);
const FSevPersonal = () => classic(<SeverityBreakdownStory personal title="Your Mental Well-Being" line="Your psychological health level" rows={SEVERITY_PERSONAL} />);
const FSevTeam = () => classic(<SeverityBreakdownStory title="Team Mental Well-Being" line="Team members experiencing psychological health symptoms" rows={SEVERITY_TEAM} unit="Members" />);
const FHealth = () => classic(<EffectBreakdownStory rows={HEALTH} />);

const px = (v) => Math.round(parseFloat(v) * 100) / 100;
const css = (el) => getComputedStyle(el);
const q = (r, sel) => r.querySelector(sel);
const qa = (r, sel) => [...r.querySelectorAll(sel)];
const rect = (el) => el.getBoundingClientRect();
const size = (el) => `${Math.round(rect(el).width)} × ${Math.round(rect(el).height)}`;
const cardOf = (r) => q(r, '[data-story^="breakdown"]');
const titleOf = (r) => q(cardOf(r), "p");
const type = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight)} · ${css(el).fontWeight}`;
const common = (node, cardSize) => [
  { part: "Card size", node, figma: cardSize, read: (r) => size(cardOf(r)) },
  { part: "Card fill · border · radius · padding", node, figma: "#ffffff · 1 #cecdcc · 18 · 16", read: (r) => { const c = cardOf(r), s = css(c); return `${lightHexOf(c, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(c, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; } },
  { part: "Title: size / line · weight · colour", node, figma: "18/28 · 700 · #1d1a1b", read: (r) => `${type(titleOf(r))} · ${lightHexOf(titleOf(r), ["color"], true)}`, mapped: "black" },
];
const evidence = (node, h) => ({ part: "Evidence section: height · lines (softened from Figma's #b4b2b1)", node, figma: `${h} · 1/1 · #e5e4e3`, read: (r) => { const e = q(r, '[data-part="evidence"]'), c = css(e); return `${Math.round(rect(e).height)} · ${px(c.borderTopWidth)}/${px(c.borderBottomWidth)} · ${lightHexOf(e, ["borderTop"])}`; } });
const footnote = (node) => ({ part: "Footnote: size / line · colour", node, figma: "13/18 · 400 · #7c7879", read: (r) => { const f = q(r, '[data-part="footnote"]'); return `${type(f)} · ${lightHexOf(f, ["color"], true)}`; } });

const BARS_CHECKS = [
  ...common("13622:36051", "808 × 338"), evidence("13622:36057", 204),
  { part: "Row gap", node: "13622:36057", figma: "10", read: (r) => { const [a, b] = qa(r, '[data-part="bar-row"]'); return px(rect(b).top - rect(a).bottom); } },
  { part: "Label: width · type", node: "13622:36059", figma: "247 · 14/20 · 400", read: (r) => { const l = q(r, '[data-part="bar-label"]'); return `${Math.round(rect(l).width)} · ${type(l)}`; } },
  { part: "Label colour", node: "13622:36060", figma: "#504c4d", mapped: "#4d4d4d", read: (r) => lightHexOf(q(r, '[data-part="bar-label"]'), ["color"]) },
  { part: "Track: height · radius · colour", node: "13622:36063", figma: "8 · 9999 · #e5e4e3", read: (r) => { const t = q(r, '[data-part="bar-track"]'); return `${Math.round(rect(t).height)} · ${px(css(t).borderTopLeftRadius)} · ${lightHexOf(t, ["background"])}`; } },
  { part: "Fill colours (Striving, then Struggling)", node: "13622:36065", figma: "#f1a118 #cc2944", read: (r) => qa(r, '[data-part="bar-fill"]').slice(0, 2).map((f) => lightHexOf(f, ["background"])).join(" ") },
  { part: "Fill length (61)", node: "13622:36067", figma: "61%", read: (r) => { const f = q(r, '[data-part="bar-fill"]'); return `${Math.round((rect(f).width / rect(f.parentElement).width) * 100)}%`; } },
  { part: "Value: size / line · weight · colour", node: "13622:36071", figma: "16/18 · 700 · #d98d0b", read: (r) => { const v = q(r, '[data-part="bar-value"]'); return `${type(v)} · ${lightHexOf(v, ["color"])}`; } },
  { part: "Trend pill: height · radius · fill", node: "13622:36057", figma: "20 · 46 · #e1f5ea", read: (r) => { const t = q(r, '[data-part="trend"]'); return `${Math.round(rect(t).height)} · ${px(css(t).borderTopLeftRadius)} · ${lightHexOf(t, ["background"])}`; } },
  { part: "Gap: value → pill", node: "13622:36070", figma: "12", read: (r) => { const v = q(r, '[data-part="bar-value"]'), t = q(r, '[data-part="trend"]'); return px(rect(t).left - rect(v).right); } },
];
const RADAR_CHECKS = [
  ...common("13622:35947", "808 × 706"), evidence("13622:35958", 558), footnote("13622:35992"),
  { part: "Plot size", node: "13622:35959", figma: "774 × 524", read: (r) => size(q(r, '[data-part="radar"]')) },
  { part: "Rings: count · outer radius · stroke", node: "13622:35960–64", figma: "5 · 216 · 0.75", read: (r) => { const c = qa(r, '[data-part="ring"]'); return `${c.length} · ${Math.max(...c.map((x) => +x.getAttribute("r")))} · ${c[0].getAttribute("stroke-width")}`; } },
  { part: "Spokes: count · length", node: "13622:35965–69", figma: "5 · 250", read: (r) => { const s = qa(r, '[data-part="spoke"]'); const l = s[0]; return `${s.length} · ${Math.round(Math.hypot(+l.getAttribute("x2") - +l.getAttribute("x1"), +l.getAttribute("y2") - +l.getAttribute("y1")))}`; } },
  { part: "Series: stroke · width · fill opacity", node: "13622:35970", figma: "#EB5421 · 2.5 · 0.06", mapped: "not a design-system colour", read: (r) => { const s = q(r, '[data-part="series"]'); return `${s.getAttribute("stroke")} · ${s.getAttribute("stroke-width")} · ${s.getAttribute("fill-opacity")}`; } },
  { part: "End nodes: count · radius", node: "13622:35971–74", figma: "5 · 3.5", read: (r) => { const n = qa(r, '[data-part="node"]'); return `${n.length} · ${n[0].getAttribute("r")}`; } },
  { part: "Label: size", node: "13622:35977", figma: "12", read: (r) => px(css(q(r, '[data-part="label"]')).fontSize) },
  { part: "Intro line: size / line · colour", node: "13622:35957", figma: "14/20 · 400 · #504c4d", read: (r) => { const l = cardOf(r).children[1]; return `${type(l)} · ${lightHexOf(l, ["color"], true)}`; } },
];
const AREA_CHECKS = [
  ...common("13622:35993", "808 × 548"), evidence("13622:36004", 380), footnote("13622:36049"),
  { part: "Plot: height · border · radius", node: "13622:36014", figma: "280 · 1 #e5e4e3 · 4", read: (r) => { const p = q(r, '[data-part="plot"]'), c = css(p); return `${Math.round(rect(p).height)} · ${px(c.borderTopWidth)} ${lightHexOf(p, ["border"])} · ${px(c.borderTopLeftRadius)}`; } },
  { part: "Axis labels: width · size · colour", node: "13622:36006", figma: "22 · 12 · #7c7879", read: (r) => { const a = q(r, '[data-part="area"]').firstElementChild, l = a.firstElementChild; return `${Math.round(rect(a).width)} · ${px(css(l).fontSize)} · ${lightHexOf(a, ["color"])}`; } },
  { part: "Curve: stroke · width", node: "13622:36018", figma: "#8e24aa · 2", read: (r) => { const c = q(r, '[data-part="curve"]'); return `${DS_RAW.semantic["utility/Graph Colors/Main/Purple"].light.toLowerCase()} · ${c.getAttribute("stroke-width")}`; } },
  { part: "Driver names: size / line · weight · colour", node: "13622:36027", figma: "13/18 · 500 · #a5a2a2", read: (r) => { const l = q(r, '[data-part="xlabel"]'); return `${type(l)} · ${lightHexOf(l, ["color"])}`; } },
  { part: "Gap: plot → names", node: "13622:36013", figma: "12", read: (r) => { const p = q(r, '[data-part="plot"]'), l = q(r, '[data-part="xlabel"]'); return px(rect(l).top - rect(p).bottom); } },
];
const LIST_CHECKS = [
  ...common("13622:36646", "808 × 544"), evidence("13622:36650", 466),
  { part: "Value block width", node: "13622:36652", figma: "115", read: (r) => Math.round(rect(q(r, '[data-part="list-value"]')).width) },
  { part: "Number: size · weight · tracking", node: "13622:36654", figma: "36 · 700 · -0.72", read: (r) => { const n = q(r, '[data-part="number"]'); return `${px(css(n).fontSize)} · ${css(n).fontWeight} · ${px(css(n).letterSpacing)}`; } },
  { part: "Number colour (84)", node: "13622:36654", figma: "#0b703f", read: (r) => lightHexOf(q(r, '[data-part="number"]'), ["color"]) },
  { part: "Unit: size · colour", node: "13622:36655", figma: "11 · #504c4d", read: (r) => { const u = q(r, '[data-part="unit"]'); return `${px(css(u).fontSize)} · ${lightHexOf(u, ["color"])}`; } },
  { part: "Name: size / line · weight", node: "13622:36657", figma: "14/20 · 700", read: (r) => type(q(r, '[data-part="list-name"]')) },
  { part: "Text: size / line · weight", node: "13622:36658", figma: "14/20 · 400", read: (r) => type(q(r, '[data-part="list-text"]')) },
  { part: "Gap: name → text", node: "13622:36656", figma: "8", read: (r) => px(rect(q(r, '[data-part="list-text"]')).top - rect(q(r, '[data-part="list-name"]')).bottom) },
  { part: "Row divider: colour", node: "13622:36659", figma: "#cecdcc", read: (r) => { const d = qa(r, '[data-part="list-row"]')[1].previousElementSibling; return lightHexOf(d, ["borderTop"]); } },
];
const DIST_CHECKS = [...common("13622:36158", "808 × 156"), evidence("13622:36158", 42),
  { part: "Bar: height · radius", node: "13622:36158", figma: "8 · 9999", read: (r) => { const b = q(r, '[data-part="bar"]'); return `${Math.round(rect(b).height)} · ${px(css(b).borderTopLeftRadius)}`; } },
  { part: "Bar colours, left to right", node: "13622:36158", figma: "#0e8c4f #f1a118 #cc2944", read: (r) => qa(r, '[data-part="bar"] > div').map((d) => lightHexOf(d, ["background"])).join(" ") },
];
const SEV_COMMON = (node, h) => [...common(node, `808 × ${h}`), evidence(node, h - 114 - 0)];
const SEV_CHECKS = (node, h) => [
  ...common(node, `808 × ${h}`),
  { part: "Band headers: size · weight", node, figma: "10/7 · 600", read: (r) => { const b = q(r, '[data-part="band"]'); return `${px(css(b).fontSize)}/${px(css(b).lineHeight)} · ${css(b).fontWeight}`; } },
  { part: "Band headers (5)", node, figma: SEVERITY.join(", "), read: (r) => qa(r, '[data-part="band"]').map((b) => b.textContent).join(", ") },
  { part: "Cell backgrounds, Normal to Extremely Severe", node, figma: "#d3f2e3 #c2ffef #fff1cf #ffe3dc #fcd7dd", read: (r) => qa(r, '[data-part="row"]')[0] ? qa(qa(r, '[data-part="row"]')[0], '[data-part="cell"]').map((c) => lightHexOf(c, ["background"])).join(" ") : "none" },
  { part: "Cells: gap", node, figma: "1.51", read: (r) => { const [a, b] = qa(qa(r, '[data-part="row"]')[0], '[data-part="cell"]'); return px(rect(b).left - rect(a).right); } },
];
const SEV_TEAM_EXTRA = [
  { part: "Cell height", node: "13622:36328", figma: "56", read: (r) => Math.round(rect(q(r, '[data-part="cell"]')).height) },
  { part: "Percent: size / line · weight · colour", node: "13622:36332", figma: "16/24 · 700 · #1d1a1b", read: (r) => { const p = q(r, '[data-part="pct"]'); return `${type(p)} · ${lightHexOf(p, ["color"])}`; } },
  { part: "Count: size / line · colour", node: "13622:36334", figma: "12/16 · #7c7879", read: (r) => { const c = q(r, '[data-part="count"]'); return `${type(c).split(" ·")[0]} · ${lightHexOf(c, ["color"])}`; } },
];
const SEV_YOUR_EXTRA = [
  { part: "Marked cell: underline", node: "13622:36224", figma: "4 · #f1a118", read: (r) => { const c = qa(r, '[data-part="cell"]').find((x) => x.style.borderBottom); return `${px(css(c).borderBottomWidth)} · ${lightHexOf(c, ["borderBottom"])}`; } },
  { part: "Sentence: size / line · colour", node: "13622:36244", figma: "14/20 · #504c4d", read: (r) => { const s = q(r, '[data-part="sentence"]'); return `${type(s).split(" ·")[0]} · ${lightHexOf(s, ["color"])}`; } },
];
const HEALTH_CHECKS = [
  ...common("13622:36697", "808 × 406"),
  { part: "Label: width · size · colour", node: "13622:36710", figma: "115 · 11 · #7c7879", read: (r) => { const l = q(r, '[data-part="label"]'); return `${Math.round(rect(l).width)} · ${px(css(l).fontSize)} · ${lightHexOf(l, ["color"])}`; } },
  { part: "Pill: size · radius", node: "13622:36711", figma: "115 × 20 · 46", read: (r) => { const p = q(r, '[data-part="pill"]'); return `${size(p)} · ${px(css(p).borderTopLeftRadius)}`; } },
  { part: "Track: height · colour", node: "13622:36716", figma: "8 · #cecdcc", read: (r) => { const t = q(r, '[data-part="track"]'); return `${Math.round(rect(t).height)} · ${lightHexOf(t, ["background"])}`; } },
  { part: "Older / younger bar colours", node: "13622:36717", figma: "#a32136 · #0e8c4f", read: (r) => { const e = qa(r, '[data-part="effect"]'); return `${lightHexOf(e[0], ["background"])} · ${lightHexOf(e[e.length - 1], ["background"])}`; } },
  { part: "Row gap", node: "13622:36702", figma: "10", read: (r) => { const [a, b] = qa(r, '[data-part="row"]'); return px(rect(b).top - rect(a).bottom); } },
];
const TABLE_CHECKS = [
  ...common("13622:36806", "808 × 426"),
  { part: "Row height", node: "13622:36832", figma: "52", read: (r) => Math.round(rect(q(r, '[data-part="row"]')).height) },
  { part: "Table height (header + 5 rows)", node: "13622:36821", figma: "312", read: (r) => Math.round(rect(q(r, '[data-part="table"]')).height) },
  { part: "Header: size / line · weight · colour", node: "13622:36826", figma: "14/20 · 500 · #7c7879", read: (r) => { const h = q(r, "th"); return `${type(h)} · ${lightHexOf(h, ["color"])}`; } },
  { part: "Label: size / line · weight", node: "13622:36834", figma: "14/20 · 500", read: (r) => type(q(r, "td")) },
  { part: "Score: size · weight · colour (84)", node: "13622:36836", figma: "16 · 600 · #0b703f", read: (r) => { const b = q(r, "td:nth-child(2) b"); return `${px(css(b).fontSize)} · ${css(b).fontWeight} · ${lightHexOf(b, ["color"])}`; } },
  { part: "Row lines: colour", node: "13622:36839", figma: "#e5e4e3", read: (r) => lightHexOf(q(r, "td"), ["borderBottom"]) },
];
const FTable = () => classic(<BreakdownStory variant="bars" items={AREAS} noun="Area" line={AREAS_LINE} rank={false} initialView="table" />);

/* ======================================================================================================== */
/* Developer view                                                                                           */
/* ======================================================================================================== */
const PARTS = [
  { id: "card", name: "Story card", note: "The shared surface.", find: (r) => [r.querySelector("[data-story]")] },
  { id: "title", name: "Title", note: "“What's Behind Your Score”. Text lg / Bold.", find: (r) => [r.querySelector("h3") || r.querySelector("p")] },
  { id: "controls", name: "Controls", note: "Filters and Table View on the bars form. Compare and Table View on radar and area.", find: (r) => [...r.querySelectorAll("button")].slice(0, 2) },
  { id: "line", name: "Intro line", note: "One or two sentences, 14/20. May carry a bold count.", find: (r) => [r.querySelector('[data-story]').children[1]] },
  { id: "evidence", name: "Evidence section", note: "A line above and below, 16px around the chart.", find: (r) => [r.querySelector('[data-part="evidence"]')] },
  { id: "row", name: "Bar row", note: "A right-aligned label, an 8px track, the score, and the change.", find: (r) => [r.querySelector('[data-part="bar-row"]')] },
  { id: "fill", name: "Fill", note: "Status colour, length = score as a share of the track.", find: (r) => [r.querySelector('[data-part="bar-fill"]')] },
  { id: "value", name: "Score", note: "Text md / Bold, coloured by status.", find: (r) => [r.querySelector('[data-part="bar-value"]')] },
  { id: "pill", name: "Change", note: "The Trend Indicator pill.", find: (r) => [r.querySelector('[data-part="trend"]')] },
];

const NAMES8 = ["Strategic Alignment", "Approval Efficiency", "Coordination", "Cross-Team Work", "Decision Speed", "Process Quality", "Clarity of Goals", "Tool Reliability"];
const PRESETS = { Strong: [88, 84, 91, 82, 86, 90, 85, 83], Mixed: [84, 71, 66, 58, 74, 49, 63, 80], Weak: [58, 44, 51, 39, 62, 47, 33, 55] };
const nowOf = (preset, i) => PRESETS[preset][i];

function Playground({ style }) {
  const [form, setForm] = useState("bars");
  const [preset, setPreset] = useState("Mixed");
  const [count, setCount] = useState(6);
  const forms = [["radar", "Radar"], ["area", "Area"], ["bars", "Bars"], ["list", "List"], ["distribution", "Distribution"], ["sev-org", "Well-Being: Org"], ["sev-team", "Well-Being: Team"], ["sev-you", "Well-Being: Personal"], ["effect", "Health Age drivers"]];
  const n = form === "radar" ? Math.max(3, count) : count;
  const items = NAMES8.slice(0, n).map((l, i) => item(l, nowOf(preset, i), ((i * 7) % 9) - 4, `${l} sits at ${nowOf(preset, i)}.`));
  const label = { ...dsText("Text xs", 600), color: ds.text.primary };
  const node = form === "sev-org" ? <SeverityBreakdownStory title="Org Mental Well-Being" line="Employees experiencing psychological health symptoms" rows={orgSeverity()} unit="Employees" />
    : form === "sev-team" ? <SeverityBreakdownStory title="Team Mental Well-Being" line="Team members experiencing psychological health symptoms" rows={SEVERITY_TEAM} unit="Members" sample />
      : form === "sev-you" ? <SeverityBreakdownStory personal title="Your Mental Well-Being" line="Your psychological health level" rows={SEVERITY_PERSONAL} sample />
        : form === "effect" ? <EffectBreakdownStory rows={HEALTH} sample />
          : <BreakdownStory key={form} variant={form} items={items} noun="Driver" line={form === "distribution" ? undefined : `See how the ${n} drivers compare.`} rank={form !== "bars" ? true : true} />;
  const code = ["sev-org", "sev-team", "sev-you"].includes(form)
    ? `<SeverityBreakdownStory${form === "sev-you" ? "\n  personal" : ""}\n  title="${form === "sev-org" ? "Org" : form === "sev-team" ? "Team" : "Your"} Mental Well-Being"\n  line="…"\n  unit="${form === "sev-team" ? "Members" : "Employees"}"\n  rows={rows}   // [{ label, cells: [{ pct, count, delta } x 5], current?, trend?, sentence? }]\n/>`
    : form === "effect" ? `<EffectBreakdownStory rows={[{ label: "BMI", months: 6 }, { label: "Vaping", months: null }, { label: "Exercise", months: -11 }]} />`
      : `<BreakdownStory\n  variant="${form}"\n  noun="Driver"\n  line="See how the ${n} drivers compare."\n  items={[\n${items.slice(0, 3).map((it) => `    { label: "${it.label}", values: [${it.values.join(", ")}] },`).join("\n")}\n    // …${n - 3} more. values = the score in each round, oldest first.\n  ]}\n/>`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)", gap: dsSpace[24], alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], background: ds.surface.general.cardWithinCard, border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.card, padding: dsSpace[16] }}>
        <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={label}>Form</span>
          <select className="field-soft" value={form} onChange={(e) => setForm(e.target.value)} style={{ ...dsText("Text sm"), padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, background: ds.bg.primary, color: ds.text.primary, fontFamily: "inherit" }}>{forms.map(([id, nme]) => <option key={id} value={id}>{nme}</option>)}</select>
        </label>
        {!form.startsWith("sev") && form !== "effect" && (<>
          <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={label}>Scores</span>
            <select className="field-soft" value={preset} onChange={(e) => setPreset(e.target.value)} style={{ ...dsText("Text sm"), padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, background: ds.bg.primary, color: ds.text.primary, fontFamily: "inherit" }}>{Object.keys(PRESETS).map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={label}>Items: {n}</span><input type="range" min={3} max={8} value={count} onChange={(e) => setCount(+e.target.value)} /></label>
        </>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], minWidth: 0 }}>
        <StoryStage style={style} kind={meta.kind} width={808}>{node}</StoryStage>
        <CodeBlock label="What you'd write" code={code} />
      </div>
    </div>
  );
}


/* Explore the rules: choose a form, a count, an odd case, and a card width. */
const CASES = [["normal", "Normal scores"], ["zero", "Every score 0"], ["hundred", "Every score 100"], ["same", "Every score the same"], ["range", "Scores under 0 and over 100"], ["missing", "One part has no score"], ["long", "Very long names"], ["repeat", "The same name repeated"]];
const COUNTS = [0, 1, 2, 3, 4, 8, 12, 13, 20, 45];
function makeItems(n, kase) {
  return Array.from({ length: n }, (_, i) => {
    let v = 30 + ((i * 37) % 65);
    let name = DRIVERS[i % DRIVERS.length];
    if (kase === "zero") v = 0;
    if (kase === "hundred") v = 100;
    if (kase === "same") v = 60;
    if (kase === "range") v = i % 2 ? 130 : -10;
    if (kase === "long") name = `${name} and how it shapes day to day work across every team`;
    if (kase === "repeat") name = DRIVERS[i % 3];
    if (kase === "missing" && i === n - 1) v = NaN;
    return { label: name, values: series(v, ((i * 5) % 7) - 3), blurb: `${DRIVERS[i % DRIVERS.length]} is a sample sentence for this part.` };
  });
}
function ExtremesShowcase({ style }) {
  const hostRef = useRef(null);
  const [keyed, setKeyed] = useState(false);
  useEffect(() => { const t = setTimeout(() => setKeyed(!!hostRef.current?.querySelector('[data-part="key"]')), 200); return () => clearTimeout(t); });
  const [form, setForm] = useState("radar");
  const [count, setCount] = useState(3);
  const [kase, setKase] = useState("normal");
  const [w, setW] = useState(808);
  const forms = [["radar", "Radar"], ["area", "Area"], ["bars", "Bars"], ["list", "List"], ["zones", "Zones"], ["distribution", "Distribution"], ["wellbeing", "Mental Well-Being"], ["health", "Health Age drivers"]];
  const items = makeItems(count, kase);
  const scored = items.filter((it) => Number.isFinite(it.values[LAST])).length;
  const fit = fitForm(form, scored);
  const field = { ...dsText("Text sm"), padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, background: ds.bg.primary, color: ds.text.primary, fontFamily: "inherit" };
  const lab = { ...dsText("Text xs", 600), color: ds.text.primary };
  const node = form === "wellbeing"
    ? <SeverityBreakdownStory title="Mental Well-Being" line="Employees experiencing psychological health symptoms" rows={Array.from({ length: count }, (_, i) => ({ label: `Measure ${i + 1}`, cells: SEVERITY_TEAM[i % 3].cells }))} unit="Employees" sample />
    : form === "health"
      ? <EffectBreakdownStory rows={Array.from({ length: count }, (_, i) => ({ label: DRIVERS[i % DRIVERS.length], months: i % 6 === 5 ? null : ((i * 7) % 25) - 12 }))} sample />
      : <BreakdownStory key={`${form}-${count}-${kase}`} variant={form} items={items} noun="Driver" line={form === "distribution" ? undefined : `${count} parts, ${CASES.find((c) => c[0] === kase)[1].toLowerCase()}.`} />;
  const unknown = form === "wellbeing" || form === "health";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], background: ds.surface.general.cardWithinCard, border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.card, padding: dsSpace[16] }}>
      <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Try the rules</span>
      <div style={{ display: "flex", gap: dsSpace[16], flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={lab}>Form</span><select className="field-soft" value={form} onChange={(e) => setForm(e.target.value)} style={field}>{forms.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></label>
        <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={lab}>Case</span><select className="field-soft" value={kase} onChange={(e) => setKase(e.target.value)} disabled={unknown} style={field}>{CASES.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></label>
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={lab}>Parts</span><SegmentedControl options={COUNTS.map((c) => ({ id: String(c), label: String(c) }))} value={String(count)} onChange={(v) => setCount(+v)} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={lab}>Card width</span><SegmentedControl options={[{ id: "320", label: "320px" }, { id: "808", label: "808px" }]} value={String(w)} onChange={(v) => setW(+v)} /></div>
      </div>
      <p data-part="rule-readout" style={{ margin: 0, ...dsText("Text xs"), color: ds.text.secondary }}>
        {unknown ? `${count} ${form === "health" ? (count === 1 ? "driver" : "drivers") : (count === 1 ? "measure" : "measures")}. ${count > RULES[form === "health" ? "health" : "wellbeing"].firstRows + 2 ? `Only the first ${RULES[form === "health" ? "health" : "wellbeing"].firstRows} show until "Show all".` : "All show."}`
          : count === 0 ? "Nothing to draw: the Story says so."
            : fit.from ? <><b>Drawn as bars.</b> {fit.reason}</>
              : <><b>Drawn as {forms.find((f) => f[0] === form)[1].toLowerCase()}.</b> {form === "zones" ? `Dots are ${scored <= 16 ? 22 : scored <= 32 ? 16 : 12}px across, and the lowest and highest are named.` : form === "distribution" ? "One bar and a sentence, whatever the count." : (form === "radar" || form === "area") ? (keyed ? "The names no longer fit, so the chart carries numbered marks and a short key." : "Names stay on the chart: they fit.") : RULES[form]?.firstRows && scored > RULES[form].firstRows + 2 ? `Only the first ${RULES[form].firstRows} rows show until "Show all".` : "Names stay on the chart."}</>}
      </p>
      <div ref={hostRef} style={{ overflowX: "auto" }}><StoryStyleContext.Provider value={style}><div style={{ width: w, maxWidth: "100%" }}>{node}</div></StoryStyleContext.Provider></div>
    </div>
  );
}

const WIDTHS = [320, 390, 480, 560, 808];
function ResponsiveShowcase({ style }) {
  const [w, setW] = useState(320);
  const at = (node) => <div style={{ width: w, flexShrink: 0 }}>{node}</div>;
  const forms = [
    ["Bars", <BreakdownStory variant="bars" items={DRIVER_ITEMS} noun="Driver" line={DRIVERS_LINE} rank={false} />],
    ["Radar", <BreakdownStory variant="radar" items={items12()} noun="Explorer" line="See how your results compare across the 12 Explorers." />],
    ["Area", <BreakdownStory variant="area" items={CURVE} noun="Driver" line={DRIVERS_LINE} />],
    ["Zones", <BreakdownStory variant="zones" items={DRIVER_ITEMS} noun="Driver" line="Where each Driver sits against the three status ranges." />],
    ["List", <BreakdownStory variant="list" items={AREAS} noun="Area" />],
    ["Distribution", <FDist />],
    ["Mental Well-Being: Org", <SeverityBreakdownStory title="Org Mental Well-Being" line="Employees experiencing psychological health symptoms" rows={orgSeverity()} unit="Employees" />],
    ["Mental Well-Being: Team", <SeverityBreakdownStory title="Team Mental Well-Being" line="Team members experiencing psychological health symptoms" rows={SEVERITY_TEAM} unit="Members" sample />],
    ["Mental Well-Being: Personal", <SeverityBreakdownStory personal title="Your Mental Well-Being" line="Your psychological health level" rows={SEVERITY_PERSONAL} sample />],
    ["Health Age drivers", <EffectBreakdownStory rows={HEALTH} sample />],
    ["Table View", <BreakdownStory variant="bars" items={AREAS} noun="Area" line={AREAS_LINE} rank={false} initialView="table" />],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], flexWrap: "wrap" }}>
        <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>Card width</span>
        <SegmentedControl options={WIDTHS.map((x) => ({ id: String(x), label: `${x}px` }))} value={String(w)} onChange={(v) => setW(+v)} />
        <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{w < 400 ? "Tight" : w < 560 ? "Compact" : "Designed layout"}</span>
      </div>
      <div style={{ display: "flex", gap: dsSpace[24], flexWrap: "wrap", alignItems: "flex-start" }}>
        {forms.map(([t, node]) => (
          <div key={t} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], maxWidth: "100%" }}>
            <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{t}</span>
            <StoryStyleContext.Provider value={style}><div style={{ maxWidth: "100%", overflowX: "auto" }}>{at(node)}</div></StoryStyleContext.Provider>
          </div>
        ))}
      </div>
    </div>
  );
}
const items12 = () => DIMENSIONS.map((d) => ({ label: d, values: dimensionSeries(d) }));

function DeveloperView({ style }) {
  const at = (w, node) => <StoryStyleContext.Provider value={style}><div style={{ width: w, flexShrink: 0 }}>{node}</div></StoryStyleContext.Provider>;
  return (
    <>
      <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
        <Prose>
          <p><b>Purpose:</b> shows the parts, factors, categories, or measures that contribute to the selected insight.</p>
          <p><b>Can contain:</b> scores, statuses, counts, percentages, charts, tables, lists, and expandable groups.</p>
          <p><b>Boundary:</b> every item must belong to the same insight, population, filters, and report round as the selected widget.</p>
          <p><b>It doesn't:</b> say what the result means (<i>Score Meaning</i>), how it was worked out (<i>Methodology</i>), who is affected (<i>Composition</i>), or what to do (<i>Actions</i>).</p>
          <p><b>Which one?</b> <i>List</i> is for introducing the <b>Areas</b>: it is large, so the section feels bigger and more important. <i>Bars</i> is for the <b>Drivers</b> under an Area: smaller rows, more of them. <i>Radar</i> and <i>Area</i> show the shape of a handful of parts, and <i>Zones</i> shows where many parts sit against the status ranges.</p>
          <p><b>Where it appears:</b> after the Score Meaning in the Org Score, Explorer, Org Status, and Factors Scopes, and as the second Story the Widget Builder suggests. Used by <FileBadge>scope/scopeRecipes.jsx</FileBadge> and <FileBadge>widgetbuilder/storyCatalog.jsx</FileBadge>.</p>
        </Prose>
      </Section>

      <Section id="forms" title="The forms" lead="One Story with several shapes. Pick by what the parts are and how many there are.">
        <SimpleTable head={["Form", "Use it when", "Controls"]} widths={["22%", "52%", "26%"]} rows={[
          ["Radar", "3 to 12 parts and the overall shape is the point. A dent on one spoke is the weakest part.", "Compare, Table View"],
          ["Area", "An Explorer's Drivers, read left to right as a profile.", "Compare, Table View"],
          ["Bars", "Driver level. Many parts, ranked or in a set order, each with its score and change. Compact, so it scans fast.", "Filters, Table View"],
          ["List", "Area level. It introduces the parts of a result, so \"what's behind your score\" reads as bigger and more important: a large number and a sentence for each. 2 to 6 parts.", "None"],
          ["Distribution", "How many parts are Flourishing, Striving, and Struggling, as one bar.", "None"],
          ["Table", "Any of the above as rows and columns. Always one click away.", "Compare, Chart View, Copy Table"],
          ["Zones", "Every part as a dot against the three status ranges. Ours; not in the design.", "Compare, Table View"],
          ["Mental Well-Being", "How many people sit in each of five severity bands for each measure. Personal, Team, and Org.", "Table View"],
          ["Health Age drivers", "How much each driver makes someone younger or older. Sample data only.", "Table View"],
          ["Who Is Where", "How many people are Flourishing, Striving, and Struggling on the topic. People, not parts: Distribution counts parts.", "Compare, Table View"],
          ["How Scores Are Spread", "Where people landed, ten points at a time, so you can see whether an average hides two groups.", "Table View"],
        ]} />
      </Section>

      <Section id="playground" title="Try it" lead="Pick a form and the scores and the component updates. The code underneath is what you'd write for the same result.">
        <Playground style={style} />
      </Section>

      <Section id="anatomy" title="Anatomy" lead="The numbered parts are drawn on the live Bars form. The table is measured in your browser with the design-system token behind each colour.">
        <Anatomy parts={PARTS} style={style} kind={meta.kind} width={808}><BreakdownStory variant="bars" items={DRIVER_ITEMS} noun="Driver" line={DRIVERS_LINE} rank={false} /></Anatomy>
      </Section>

      <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark); never hard-code the hex.">
        <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[
          ["Card", "Shell", "The shared Story card: up to 808px, 18px radius, 16px padding, 16px between parts, 1px border."],
          ["Controls", "Row", "Right of the title. Each is a compact ghost button: 16px icon, 12px text, 4px and 6px padding, fully rounded."],
          ["", "Compare previous rounds", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>12px label, a 36 by 20 switch (16px knob). Off: {T("toggle/inactive/primary")}</span>],
          ["Intro line", "Type", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text sm, 14/20 {T("text/secondary")}</span>],
          ["Evidence section", "Lines and space", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>1px above and below {T("border/tertiary")}; 16px above and below the content</span>],
          ["Footnote", "Type", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text xs, 13/18 {T("text/tertiary")}</span>],
          ["Bars", "Row", "Label column up to 247px, right-aligned, Text sm. Track 8px, fully rounded. Rows 10px apart. Score and change at the right, 12px apart."],
          ["", "Track and fill", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Track {T("bg/secondary")}. Fill = the status graph colour, width = score%.</span>],
          ["", "Score", "Text md / Bold, 16/18, in the status text colour. The change is the Trend Indicator pill (20px tall, 46px radius)."],
          ["Radar", "Plot", "774 by 524. Five rings out to 216 (20 to 100), 0.75px. Spokes run to 250. A 3.5px node where each spoke meets the outer ring."],
          ["", "Series", "Stroke 2.5px, 6% fill. The design's #EB5421 is not a design-system colour; it is a named constant (RADAR_SERIES)."],
          ["", "Labels and tooltip", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>12px labels beyond the spokes, the active one bold. Tooltip: {T("surface/General/tooltip")}, 12px radius, 240px wide.</span>],
          ["Area", "Plot", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>280px tall, 1px {T("border/tertiary")}, 4px radius, no gridlines. A 22px column of 0 to 100 labels, Text 2xs {T("text/tertiary")}.</span>],
          ["", "Curve", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>2px, Graph colour Purple {tok("utility/Graph Colors/Main/Purple")}, area under it at 12%. Runs edge to edge.</span>],
          ["", "Names", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>13/18 Medium {T("text/quaternary")}, 12px under the plot. The active one is bold {T("text/tertiary")}.</span>],
          ["List", "Row", "A 115px block with a 36px bold number and “/100”, then a bold name and a sentence 8px apart. A 1px line between rows."],
          ["Distribution", "Bar", "8px, fully rounded, split in proportion to the counts. Flourishing, Striving, Struggling, left to right."],
          ["Mental Well-Being", "Grid", "A 115px label column, then five equal cells 1.5px apart. Headers Label xs / Semibold (10px). Team and Org cells are 56px tall; personal cells 36px."],
          ["", "Cell colours", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{tok("utility/Likert/V Good Subtle")}{tok("utility/Likert/Good Subtle")}{tok("utility/Likert/Neutral Subtle")}{tok("utility/Likert/Bad Subtle")}{tok("utility/Likert/Very Bad Subtle")}</span>],
          ["", "Marked cell", "A 4px line under it in the band's Likert colour, a 16px ring, and a trend caret. Team and Org cells show the share (Text md / Bold), the count (12px), and a caret."],
          ["Health Age drivers", "Row", "A right-aligned 11px label (115px), a 115 by 20 pill, and an 8px track with a centre line. Younger grows left in green, older grows right in red."],
          ["Table", "Layout", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>A line above the header and under every row ({T("border/tertiary")}), rows 52px. Header: Text sm / Medium, capitals, {T("text/tertiary")}. Score: Text md / Semibold, centred.</span>],
          ["Whole Story", "Interaction", "Radar and area: hover. Bars: Filters opens a status checklist. Everything else is static."],
        ]} />
      </Section>

      <Section id="states" title="States & variants" lead="Every form with sample values. Switch Current and Refined at the top to compare (Refined changes the bars only).">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div id="form-radar"><Variant title="Radar" note="Hover the chart."><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="radar" items={AREAS} noun="Area" line={AREAS_LINE} /></StoryStage></Variant></div>
          <div id="form-area"><Variant title="Area" note="Hover the plot."><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="area" items={CURVE} noun="Driver" line={DRIVERS_LINE} /></StoryStage></Variant></div>
          <div id="form-bars"><Variant title="Bars"><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="bars" items={DRIVER_ITEMS} noun="Driver" line={DRIVERS_LINE} rank={false} /></StoryStage></Variant></div>
          <Variant title="Bars, ranked and limited" note="`rank` sorts strongest first; `limit` shows the first n with “Show all”."><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="bars" items={DRIVER_ITEMS} noun="Driver" line="Every Driver, ranked from strongest to weakest." limit={4} /></StoryStage></Variant>
          <div id="form-list"><Variant title="List"><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="list" items={AREAS} noun="Area" /></StoryStage></Variant></div>
          <div id="form-distribution"><Variant title="Distribution"><StoryStage style={style} kind={meta.kind} width={808}><FDist /></StoryStage></Variant></div>
          <div id="form-table"><Variant title="Table View" note="Any chart form as rows and columns, one click away."><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="bars" items={AREAS} noun="Area" line={AREAS_LINE} rank={false} initialView="table" /></StoryStage></Variant></div>
          <div id="form-zones"><Variant title="Zones" note="Ours. A dot per part against the three status ranges."><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="zones" items={DRIVER_ITEMS} noun="Driver" line="Where each Driver sits against the three status ranges." /></StoryStage></Variant></div>
          <div id="form-wellbeing"><Variant title="Mental Well-Being: Org" note="Derived from the dataset (see Constraints)."><StoryStage style={style} kind={meta.kind} width={808}><SeverityBreakdownStory title="Org Mental Well-Being" line="Employees experiencing psychological health symptoms" rows={orgSeverity()} unit="Employees" /></StoryStage></Variant></div>
          <div id="form-wellbeing-team"><Variant title="Mental Well-Being: Team" note="Sample."><StoryStage style={style} kind={meta.kind} width={808}><SeverityBreakdownStory title="Team Mental Well-Being" line="Team members experiencing psychological health symptoms" rows={SEVERITY_TEAM} unit="Members" sample /></StoryStage></Variant></div>
          <div id="form-wellbeing-personal"><Variant title="Mental Well-Being: Personal" note="Sample."><StoryStage style={style} kind={meta.kind} width={808}><SeverityBreakdownStory personal title="Your Mental Well-Being" line="Your psychological health level" rows={SEVERITY_PERSONAL} sample /></StoryStage></Variant></div>
          <div id="form-health"><Variant title="Health Age drivers" note="Sample."><StoryStage style={style} kind={meta.kind} width={808}><EffectBreakdownStory rows={HEALTH} sample /></StoryStage></Variant></div>
          <div id="form-who"><Variant title="Who Is Where" note="How many people are Flourishing, Striving, and Struggling on the topic, with Compare."><StoryStage style={style} kind={meta.kind} width={808}>{liveStory("distribution")}</StoryStage></Variant></div>
          <div id="form-spread"><Variant title="How Scores Are Spread" note="One bar per ten points of people's scores, so an average can't hide two groups."><StoryStage style={style} kind={meta.kind} width={808}>{liveStory("spread")}</StoryStage></Variant></div>
        </div>
      </Section>

      <Section id="responsive" title="Responsive" lead="A Story responds to the width of its own card, not the window, because the same Story sits in a 1000px Scope, a narrow Scope beside the chat, and a phone. Pick a width to see every form at it.">
        <ResponsiveShowcase style={style} />
        <SimpleTable head={["Form", "Compact (under 560px)", "Tight (under 400px)"]} widths={["20%", "46%", "34%"]} rows={[
          ["Controls", "The title, then the controls on their own full-width row.", "Same. They wrap to a second line if they don't fit."],
          ["Bars", "The label (it may wrap) shares a line with the score and change. The track runs the full width underneath.", "Same."],
          ["Radar", "Names stay around the plot while they fit, with smaller rings and 11px+ text (12 Explorers fit down to about 450px). Past that: a square plot with a numbered mark on each spoke and a short key below (six names, then \"Show all\"). Tap a mark, the plot, or a row; the detail card appears under the plot.", "Usually the numbered form, with larger marks so they stay about 22px on screen."],
          ["Area", "A 200px plot. Names under it while they fit in one row, otherwise a number under each point and the same key. Tap a point or a name to select.", "Same."],
          ["Zones", "A slim 0 to 100 strip of dots, a count per status, then a list lowest first under quiet status labels (six rows, then Show all). Tapping a row marks its dot.", "Same."],
          ["List", "The number block shrinks to 84px beside the name and sentence.", "Stacked: the number, then the name, then the sentence."],
          ["Mental Well-Being", "The measure's name sits above its row. The five bands share the full width; a cell shows the share, and the count as a plain number with its caret. A note explains the unit.", "Same. Band names wrap to two lines."],
          ["Health Age drivers", "The driver name and its pill share a line. The track runs the full width underneath.", "Same."],
          ["Table View", "Headings wrap. The table scrolls sideways when its columns need more room.", "Same."],
          ["Distribution", "No change. It's already one bar and a sentence.", "No change."],
        ]} />
        <Prose>
          <p><b>The rule.</b> At 560px and wider, nothing changes from the designed 808px layouts. Below that, a form changes shape rather than shrinking: text stays readable (never smaller than 11px on screen) and every target is at least 44px tall.</p>
          <p><b>Hover becomes tap.</b> The radar, area, and zones are hover-driven on a wide card. On a compact card the same detail opens when you tap, and it stays open until you tap again, because there's no pointer to leave. Mouse users still get hover on wide cards.</p>
          <p><b>How a Story learns its width.</b> <FileBadge>stories/storyWidth.js</FileBadge> gives every Story card a <code>ResizeObserver</code> and shares <code>{`{ width, compact, tight }`}</code> through <code>useStoryWidth()</code>. A Story that draws its own card, like these, reads it through <code>WithWidth</code> from inside the card.</p>
        </Prose>
      </Section>

      <Section id="limits" title="Few, many, odd" lead="What each form does with two parts or sixty, and with scores that are 0, 100, missing, or out of range. The rules live in one file, breakdownRules.js, and the components and this page both read it.">
        <SimpleTable head={["Form", "Fewest", "Designed for", "Names on the chart up to", "Most", "Outside that"]} widths={["13%", "9%", "14%", "24%", "9%", "31%"]} rows={[
          ["Radar", RULES.radar.min, `${RULES.radar.ideal[0]} to ${RULES.radar.ideal[1]}`, "While they fit (about 20 ordinary names at full width), then numbered marks and a short key", RULES.radar.max, "Fewer than 3 or more than 24: drawn as bars."],
          ["Area", RULES.area.min, `${RULES.area.ideal[0]} to ${RULES.area.ideal[1]}`, "While they fit (about 10 at full width), then numbered marks and a short key", RULES.area.max, "Fewer than 3 or more than 20: drawn as bars."],
          ["Bars", RULES.bars.min, `${RULES.bars.ideal[0]} to ${RULES.bars.ideal[1]}`, "Always", "Any", `More than ${RULES.bars.firstRows + 2}: the first ${RULES.bars.firstRows}, then "Show all".`],
          ["List", RULES.list.min, `${RULES.list.ideal[0]} to ${RULES.list.ideal[1]}`, "Always", RULES.list.max, "More than 8: drawn as bars."],
          ["Zones", RULES.zones.min, "Any", "The lowest and highest", "Any", "Dots shrink from 22px to 16px past 16 parts and to 12px past 32."],
          ["Distribution", RULES.distribution.min, "Any", "n/a", "Any", "One part reads as a sentence, not a count."],
          ["Mental Well-Being", RULES.wellbeing.min, `${RULES.wellbeing.ideal[0]} to ${RULES.wellbeing.ideal[1]}`, "Always", "Any", `More than ${RULES.wellbeing.firstRows + 2}: the first ${RULES.wellbeing.firstRows}, then "Show all".`],
          ["Health Age drivers", RULES.health.min, `${RULES.health.ideal[0]} to ${RULES.health.ideal[1]}`, "Always", "Any", `More than ${RULES.health.firstRows + 2}: the first ${RULES.health.firstRows}, then "Show all".`],
        ]} />
        <Prose>
          <p><b>Why a fallback, not a warning.</b> A reader should never see a broken chart. When a form can't carry the count, the Story draws the form that can (bars) and the card says <code>data-fallback="radar"</code> so a developer can see it happened. The table is always complete, whatever the form shows.</p>
          <p><b>Names stay for as long as they physically fit.</b> Names are the point of these charts, so numbers are the last resort. A radar keeps its names at 11px or more on screen and, on a narrower card, shrinks its rings to make room for them (from the designed 216 down to a 90px radius on screen). At each ring size it tries each name wrapped at 18, then 14, then 11 characters, and keeps names if none touch each other or leave the drawing; 12 Explorers keep their names on a card as narrow as about 450px. From 20 spokes the radar always uses numbered marks and a key: past that a ring of names reads as noise. An area chart gives each name its share of the plot width (less 8px, up to three lines, as designed); if any name doesn't fit, it switches to numbers in one clean step (names are never staggered or squeezed). When names don't fit, the charts carry small numbered marks, with a key listing the names in a grid (several columns on a wide card) and, on a narrow card, the first six until someone asks for all.</p><p><b>Hovering a name works the same as hovering its point</b>, on both charts and in both places names appear: under the area chart and in the key under either chart. The point, the guide, and the tooltip follow. Pointing at a key row only highlights, so the key never moves under the mouse; tapping a row selects it and opens the detail.</p>
          <p><b>Why a "+2" before Show all.</b> Hiding one or two rows behind a link is worse than showing them, so a list of 12 shows all 12 and a list of 13 shows 10.</p>
        </Prose>
        <ExtremesShowcase style={style} />
        <SimpleTable head={["Case", "What the Story does"]} widths={["26%", "74%"]} rows={[
          ["No parts", "\"There's nothing to show here yet.\" No chart."],
          ["A part with no score", "Left out of every form and the table, and a line says how many: \"1 Driver isn't shown because it has no score yet.\" It never counts as a zero."],
          ["Every score 0, or every score 100", "Drawn as it is. A radar collapses to the centre at 0 and sits on the outer ring at 100. Bars are empty or full. Nothing special is shown, because it is a real result."],
          ["Every score the same", "Bars are equal. Order stays as given. A radar is a regular shape."],
          ["A score under 0 or over 100", "Drawn clamped to 0 or 100. The number printed is the real value, so the mistake is visible. Fix it upstream."],
          ["Very long names", "Bars truncate with an ellipsis on a wide card and wrap on a compact one. Radar wraps to three lines, then switches to numbers. The list and table wrap."],
          ["The same name twice", "Both are drawn (parts are keyed by position). The table can't tell them apart, so names must be unique within one insight."],
          ["Every part in one status", "The distribution bar is one colour, and the sentence says so."],
          ["No change, or no earlier round", "A neutral pill with a dash. Never \"+0\"."],
        ]} />
      </Section>

      <Section id="edges" title="Sizes & edge cases" lead="How it behaves when the space or the content isn't ideal.">
        <div style={{ display: "flex", gap: dsSpace[24], overflowX: "auto", alignItems: "flex-start", paddingBottom: dsSpace[8] }}>
          {[480, 808].map((w) => <div key={w} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}><span style={{ ...dsText("Text 2xs", 600), color: ds.text.tertiary }}>{w}px</span>{at(w, <BreakdownStory variant="bars" items={DRIVER_ITEMS} noun="Driver" line={DRIVERS_LINE} rank={false} />)}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 28 }}>
          <Variant title="Long labels" note="The label column shrinks and the label truncates with an ellipsis. Hover shows the full name."><StoryStage style={style} kind={meta.kind} width={560}><BreakdownStory variant="bars" items={[item("Cross-Team Collaboration Efficiency and Planning", 41, -2), item("Decision-Making Speed", 43, 1)]} noun="Driver" line="Two drivers." rank={false} /></StoryStage></Variant>
          <Variant title="One item" note="Bars work for one part. A radar or area with one part is drawn as bars (see the rules)."><StoryStage style={style} kind={meta.kind} width={560}><BreakdownStory variant="bars" items={[item("Sleep", 38, -3)]} noun="Driver" line="One driver." /></StoryStage></Variant>
          <Variant title="Scores of 0 and 100" note="Both are valid. The fill is empty at 0 and full at 100."><StoryStage style={style} kind={meta.kind} width={560}><BreakdownStory variant="bars" items={[item("Lowest", 0, 0), item("Highest", 100, 0)]} noun="Driver" line="Two drivers." rank={false} /></StoryStage></Variant>
          <Variant title="No change" note="A neutral pill with a dash, never “+0”."><StoryStage style={style} kind={meta.kind} width={560}><BreakdownStory variant="bars" items={[item("Sleep", 61, 0), item("Stress", 52, 0)]} noun="Driver" line="Two drivers." rank={false} /></StoryStage></Variant>
        </div>
        <Prose>
          <p><b>Few or many parts</b> are handled by rules, not by hand: see <a href="#limits">Few, many, odd</a>. <b>Filters that match nothing.</b> The list is empty and the Story says so. <b>Compare on.</b> The radar and area add a dashed earlier-round shape and a legend; the table adds a column for that round.</p>
          <p><b>Loading and empty.</b> The Story receives finished items. If there are none, don't render it.</p>
        </Prose>
      </Section>

      <Section id="content" title="Content & voice" lead="Written to the SHAPE Voice and Language Guide (docs/shape-voice-and-language-guide.md).">
        <SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={[
          ["Title", "“What's Behind Your Score”: title case, under 7 words, no full stop. Others: “Your Mental Well-Being”, “What's Shaping Your Health Age”. Well-Being keeps its hyphen in a heading."],
          ["Intro line", "One or two plain sentences that say what the chart shows: “See how your results compare across the 5 Areas.” A count can be bold."],
          ["Footnote", "Tells the reader how to use the chart and how to read the score. “For each answer, the higher the score, the better.”"],
          ["Severity labels", "Normal, Mild, Moderate, Severe, Extremely Severe. Title case."],
          ["Units", "“5 Members” for a team, “6 Employees” for the organisation."],
          ["Contractions", "“You're experiencing…”, “It's worth noticing…”."],
          ["Well-being", "Hyphenated. “well-being” in body text, “Well-Being” in a heading."],
          ["No em dashes, UK English, Oxford comma", "As everywhere. A list of three or more: “7 are Flourishing, 3 are Striving, and 2 are Struggling.”"],
          ["Care with health copy", "A sentence such as “Seek support immediately” is health guidance. It needs review by someone qualified before it ships."],
        ]} />
        <Prose><p><b>The sentence under each row (Mental Well-Being, personal).</b> One per measure and band, written in the second person, short, and warm. Only three exist in the design; the other twelve need writing and review.</p></Prose>
      </Section>

      <Section id="a11y" title="Accessibility" lead="What the component does today, and what to keep doing.">
        <Prose>
          <p><b>Charts are pictures</b>, so each has <code>role="img"</code> and a label that lists every item and its score. The <b>Table View</b> is the accessible alternative to the radar and area charts, which are hover-only. Keep it on every chart form.</p>
          <p><b>Hover isn't keyboard-reachable</b> on the radar and area. The tooltip's content is in the Table View and in the chart's label. A focusable version (arrow keys between points) is a good next step.</p>
          <p><b>Colour is never the only signal.</b> Every score is printed, and the status appears in the number's colour and the bar. Mental Well-Being cells print their share and count; their colour only repeats the band, which is named in the header.</p>
          <p><b>Controls</b> are real buttons. The Compare switch is a <code>role="switch"</code>. Filters opens a labelled group of checkboxes.</p>
          <p><b>Contrast of the score colours</b> on the card:</p>
        </Prose>
        <ContrastTable rows={[["color/status/success/text-indicator", "Used", "Flourishing"], ["color/status/warning/text-indicator", "Used", "Striving"], ["color/status/error/text-indicator", "Used", "Struggling"]]} />
      </Section>

      <Section id="props" title="Props & usage">
        <PropsTable rows={[
          { name: "items", type: "[{ label, values, blurb? }]", required: true, desc: "One per part. `values` is the score in each round, oldest first, ending with the current one. `blurb` is the sentence the radar tooltip and the List form show." },
          { name: "variant", type: "\"radar\" | \"area\" | \"bars\" | \"list\" | \"distribution\" | \"zones\"", def: "\"radar\"", desc: "Which form to draw." },
          { name: "title", type: "string", def: "“What's Behind Your Score”", desc: "The Story title, in title case." },
          { name: "line", type: "ReactNode", desc: "The intro line. On the distribution form it defaults to the counts sentence." },
          { name: "noun", type: "string", def: "\"Explorer\"", desc: "What the parts are called, singular. Used in table headers and the counts sentence." },
          { name: "hint", type: "string", desc: "The footnote. Radar and area default to a hover instruction." },
          { name: "rank", type: "boolean", def: "true", desc: "Sort strongest first. Pass false to keep the order given (the design's bars are unsorted)." },
          { name: "limit", type: "number", desc: "Bars only. Show the first n and a “Show all” link." },
        ]} />
        <PropsTable rows={[
          { name: "SeverityBreakdownStory.rows", type: "[{ label, cells, current?, trend?, sentence? }]", required: true, desc: "Five cells per row: { pct, count, delta }. For the personal form, `current` is the index of the reader's band." },
          { name: "SeverityBreakdownStory.unit", type: "string", def: "\"Employees\"", desc: "“Members” for a team." },
          { name: "SeverityBreakdownStory.personal", type: "boolean", def: "false", desc: "Mark only the reader's own cell and show a sentence under each row." },
          { name: "EffectBreakdownStory.rows", type: "[{ label, months }]", required: true, desc: "Negative months = younger, positive = older, null = no calculated effect." },
        ]} />
        <CodeBlock label="Usage" code={`import BreakdownStory from "./BreakdownStory.jsx";

<BreakdownStory
  variant="bars"
  noun="Driver"
  line={<>Organisational Flow is made up of <b>6 drivers</b>. Explore them…</>}
  rank={false}
  items={[
    { label: "Process Effectiveness", values: [51, 52, 61] },
    { label: "Approval Efficiency",   values: [41, 40, 38] },
  ]}
/>`} />
        <Prose><p><b>Data.</b> The Story reads no data. Pass finished scores. <b>Layout.</b> The parent decides the width. <b>Used by</b> <FileBadge>scope/scopeRecipes.jsx</FileBadge> and <FileBadge>widgetbuilder/storyCatalog.jsx</FileBadge>. The org well-being rows come from <FileBadge>lib/wellbeing.js</FileBadge>.</p></Prose>
      </Section>

      <Section id="done" title="Done checklist" lead="You're done when every line is true.">
        <List items={[
          "Every item in a Story belongs to the same insight, population, filters, and round.",
          "The card, title, intro line, evidence section, and footnote match the Insight Summary and Score Meaning.",
          "Controls are compact ghost buttons: 16px icon, 12px text. The switch is 36 by 20.",
          "Bars: a right-aligned label up to 247px, an 8px track, the score in status colour, and the change as a pill. Rows 10px apart.",
          "Radar: five rings, spokes past the outer ring, nodes on the ring, the active label bold, and a tooltip.",
          "Area: a 280px plot with no gridlines, a purple curve edge to edge, and the active name bold.",
          "List: a 115px value block with a 36px number, a bold name, and a sentence, with a line between rows.",
          "Mental Well-Being: five tinted cells per row, 1.5px apart, the marked cell underlined 4px.",
          "The Table View of every chart form has the same data and a Copy Table button.",
          "Every colour is a design-system token and follows Light and Dark, except the radar series.",
          "The status scale comes from lib/bands.js (60 and 80).",
          "Charts have a text label. Copy follows the voice guide.",
        ]} />
      </Section>

      <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
        <Prose><p><b>Matches the design.</b> The ten frames in Figma node 13622:35946, drawn with the real component at the design's width (808px) with the design's own sample data, and measured in your browser. Each row is a value read from the Figma node next to what the component has. A row that says “design:” is a colour the design uses that isn't in the design system; the component uses the nearest token and the row compares against that.</p></Prose>
        <Prose><p><b>1. Bars</b> (13622:36051)</p></Prose><FigmaParity checks={BARS_CHECKS}><FBars /></FigmaParity>
        <Prose><p><b>2. Radar</b> (13622:35947)</p></Prose><FigmaParity checks={RADAR_CHECKS}><FRadar /></FigmaParity>
        <Prose><p><b>3. Area</b> (13622:35993)</p></Prose><FigmaParity checks={AREA_CHECKS}><FArea /></FigmaParity>
        <Prose><p><b>4. List</b> (13622:36646)</p></Prose><FigmaParity checks={LIST_CHECKS}><FList /></FigmaParity>
        <Prose><p><b>5. Distribution</b> (13622:36158)</p></Prose><FigmaParity checks={DIST_CHECKS}><FDist /></FigmaParity>
        <Prose><p><b>6. Table View</b> (13622:36806)</p></Prose><FigmaParity checks={TABLE_CHECKS}><FTable /></FigmaParity>
        <Prose><p><b>7. Mental Well-Being: Your</b> (13622:36188)</p></Prose><FigmaParity checks={[...SEV_CHECKS("13622:36188", 389), ...SEV_YOUR_EXTRA]}><FSevPersonal /></FigmaParity>
        <Prose><p><b>8. Mental Well-Being: Team and Org</b> (13622:36298, 13622:36472)</p></Prose><FigmaParity checks={[...SEV_CHECKS("13622:36298", 371), ...SEV_TEAM_EXTRA]}><FSevTeam /></FigmaParity>
        <Prose><p><b>9. Health Age drivers</b> (13622:36697)</p></Prose><FigmaParity checks={HEALTH_CHECKS}><FHealth /></FigmaParity>
        <Prose>
          <p><b>Colours in the design that aren't in the design system.</b> #4d4d4d (bar labels) became <code>text/secondary</code>. #666 (radar labels) became <code>text/secondary</code>. #808080 (severity headers) became <code>text/tertiary</code>. #C7C7C7 (radar rings, spokes, nodes) became <code>border/secondary</code>. The radar's #EB5421 and #FD531B stay as named constants because nothing in the system is close. The area's tint #F0CBF8 at 50% became Purple at 12%.</p>
          <p><b>Things in the design that look like slips.</b> (1) In Team and Org the Moderate cell is tinted green (V Good Subtle) while in Your it is amber (Neutral Subtle). Built as amber throughout. (2) Seven frames are all named “Chart Breakdown -02”, which makes the file hard to navigate. (3) The title is black (#000) in some frames and the primary text colour in others; the component uses the primary text colour. (4) The bar chart's rows aren't sorted (61, 52, 38, 44, 41, 43), but the Org and Factors Scopes say “ranked”; <code>rank</code> covers both.</p>
          <p><b>Decisions for you.</b> (1) <b>Trend carets in Mental Well-Being</b> are green up and red down whatever the band. More people in Extremely Severe is bad, yet drawn green. Built as drawn; recommend colouring by whether the change is good. (2) <b>Filters</b> is a button with no design for what it opens; it is built as a status checklist. (3) <b>“Select a point”</b> says click, but the charts are hover-driven here; the default text says “Hover”. (4) <b>The severity cut-offs</b> (80, 60, 40, 20) are an assumption, not a SHAPE-defined scale. (5) <b>Health Age bar lengths</b> are hand-set in the design; the component uses a smooth curve that matches them closely. (6) <b>The toggle's knob</b> is white in the design; the design system's <code>toggle/inactive/toggle</code> is #CECDCC. The component uses the card colour, so it is white in Light and dark in Dark.</p>
          <p><b>Voice-guide calls.</b> The design says “Select a point to see its score” where ours says “Hover”. “Seek support immediately” and the other health sentences need clinical review. Titles already follow the guide (“Well-Being”).</p>
        </Prose>
      </Section>
    </>
  );
}

/* ======================================================================================================== */
/* Researcher view                                                                                          */
/* ======================================================================================================== */
function ResearcherView({ style }) {
  const items = DIMENSIONS.map((d) => ({ label: d, values: dimensionSeries(d) }));
  const orgRows = orgSeverity();
  const now = items.map((i) => i.values[LAST]);
  const c = countByStatus(now);
  return (
    <>
      <Section id="story" title="The data story" lead="A score is one number. The Breakdown shows what it's made of.">
        <Prose>
          <p>Every score in SHAPE is an average of smaller scores: an Explorer is the average of its Drivers, and the organisation's score is the average of everyone's overall result. The Breakdown opens that average up. It lists or draws the parts, each with its own score and how it moved, so a reader can see which parts are holding the result up and which are dragging it down.</p>
          <p>It explains <b>what contributes</b>. It doesn't say what the result means, how it was calculated, or what to do. And every part must belong to the same insight, population, filters, and round as the widget it sits under, so the parts always add up to the thing above them.</p>
        </Prose>
        <Callout title="The idea in one line">The Insight Summary says where things stand. The Breakdown shows which parts are behind it.</Callout>
      </Section>

      <Section id="glance" title="At a glance">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Question it answers" value="What is behind this result?" />
          <Fact label="Unit" value="A part" note={`An Explorer (${DIMENSIONS.length}), a Driver (${DRIVERS.length}), a group, or a measure.`} />
          <Fact label="Each part carries" value="A score and a change" note="0 to 100, and the move since the round before." />
          <Fact label="Forms" value="Nine" note="Radar, area, bars, list, distribution, table, zones, well-being, health age." />
          <Fact label="Time reference" value="The latest round" note={`Optionally set against an earlier one (${ROUNDS.length} rounds exist).`} />
          <Fact label="People behind it" value={`${EMPLOYEE_COUNT} respondents`} note="Synthetic data in this prototype." />
        </div>
      </Section>

      <Section id="shows" title="What it can show" lead="Scores, statuses, counts, percentages, charts, tables, lists, and expandable groups.">
        <SimpleTable head={["Evidence", "What the reader learns", "Where it comes from"]} widths={["24%", "46%", "30%"]} rows={[
          ["A score per part", "How each part is doing, in a number and a status colour.", "Each part's latest-round average."],
          ["A change per part", "Whether the part moved since the round before, or since a round the reader picks.", "Latest minus that round."],
          ["The shape", "Which parts are high and which are low, at a glance (radar, area).", "The same scores, drawn."],
          ["Counts by status", "How many parts are Flourishing, Striving, and Struggling.", `Parts banded at ${STRIVING_AT} and ${FLOURISHING_AT}.`],
          ["A sentence per part", "What a part means in words (list, radar tooltip).", "Fixed copy per part and band."],
          ["People by severity", "How many people sit in each severity band for low mood, anxiety, and stress.", "Each person's score on that Driver, banded."],
        ]} />
      </Section>

      <Section id="forms" title="The forms" lead="Pick the form that suits the data.">
        <SimpleTable head={["Form", "Reads best when", "Watch for"]} widths={["18%", "42%", "40%"]} rows={[
          ["Radar", "You want the overall shape and 3 to 12 parts.", "The order of spokes is arbitrary, so the polygon's shape depends on it."],
          ["Area", "You want a profile across an Explorer's Drivers.", "A line joining unrelated categories implies a slope that isn't there. See Constraints."],
          ["Bars", "You are at Driver level: many parts, exact scores and changes, quick to scan.", "Rows in the design aren't sorted; ranking is a choice."],
          ["List", "You are introducing the Areas (one level above Drivers) and want the section to carry weight. A few parts, a sentence each.", "The sentences are fixed copy, not findings. It reads as important because it is large, so keep it to the level above Drivers."],
          ["Distribution", "You want the split by status.", "Counts parts, not people."],
          ["Mental Well-Being", "You want to see severity across measures.", "The band cut-offs are an assumption."],
          ["Health Age", "You want what pushes age up or down.", "No data or model yet."],
        ]} />
      </Section>

      <Section id="live" title="Live from the data" lead="Real examples built from the dataset right now.">
        <Variant title="The 12 Explorers, ranked" note="The Org Score's breakdown as bars."><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="bars" items={items} noun="Explorer" line="Every Explorer, ranked from strongest to weakest." /></StoryStage></Variant>
        <Variant title="The 12 Explorers by status" note="How the parts split."><StoryStage style={style} kind={meta.kind} width={808}><BreakdownStory variant="distribution" items={items} noun="Explorer" /></StoryStage></Variant>
        <Variant title="Org Mental Well-Being" note="Real, with an assumed banding."><StoryStage style={style} kind={meta.kind} width={808}><SeverityBreakdownStory title="Org Mental Well-Being" line="Employees experiencing psychological health symptoms" rows={orgRows} unit="Employees" /></StoryStage></Variant>
        <SimpleTable head={["In the Story", "Data behind it"]} widths={["30%", "70%"]} rows={[
          ["Each bar", "An Explorer's latest-round average, from the 100 respondents."],
          ["The status counts", `Explorers at ${FLOURISHING_AT} or more: ${c.f}. At ${STRIVING_AT} to ${FLOURISHING_AT - 1}: ${c.s}. Under ${STRIVING_AT}: ${c.t}.`],
          ["Well-Being cells", `Each person's score on Depression, Anxiety, or Stress, placed in a band by ${SEVERITY_FROM.slice(0, 4).join(", ")} (an assumption, see Constraints). Share = people in the band ÷ ${EMPLOYEE_COUNT}.`],
          ["The carets", "The cell's share now minus its share in the round before, in points."],
        ]} />
      </Section>

      <Section id="limits" title="Constraints" lead="What a reader, or a researcher quoting this, should keep in mind. Each is a real property of how the Story works today.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="Parts count the same.">An Explorer's score is the plain average of its Drivers, and the overall score the average of its Explorers, so a Driver in a small Explorer counts for more than one in a large one. The Breakdown doesn't weight the parts.</Limit>
          <Limit n="2" title="The area form joins categories with a line." use="Use Bars or Radar when the order of the parts isn't meaningful.">A smooth curve between “Approval Efficiency” and “Coordination Friction” suggests a trend from one to the next. The order is arbitrary, so the slope means nothing. The area form is in the design, and it reads as a profile, but the line is decoration.</Limit>
          <Limit n="3" title="Radar shape depends on spoke order.">Reordering the same scores changes the polygon. Compare radars only when the spoke order is fixed, as it is across rounds.</Limit>
          <Limit n="4" title="The change is one comparison.">“−2” is this round against one earlier round, with no significance test. A move of a point or two shouldn't be read as real.</Limit>
          <Limit n="5" title="The status bands are fixed cut-offs.">A 59 and a 60 get different colours although they're practically the same.</Limit>
          <Limit n="6" title="Severity bands are an assumption, not a clinical scale.">The survey scores Depression, Anxiety, and Stress as 0 to 100 well-being scores. SHAPE hasn't defined what “Mild” or “Severe” means for them. The prototype splits the range at 80, 60, 40, and 20. Don't read the labels as diagnoses.</Limit>
          <Limit n="7" title="Personal and Team views need small-group protection.">A Team cell of 2 people shows a share and a count. Below 5 people a cell can identify someone; the product's rule (no score for fewer than 5) should apply to Team and Personal well-being too. The Org view has 100 respondents, so it isn't affected here.</Limit>
          <Limit n="8" title="Health Age has no data behind it.">The dataset has no ages or health-age model. The form runs on sample values and says so.</Limit>
          <Limit n="9" title="The prototype's data is synthetic.">{EMPLOYEE_COUNT} generated respondents × {ROUNDS.length} rounds. This page shows how the Story behaves. It isn't a finding about a real organisation.</Limit>
          <Limit n="10" title="A shape from a few parts is easy to over-read." use="Use Bars for fewer than five parts, or when the order is arbitrary.">A radar of three parts is a triangle, and any three numbers make one. With many parts the polygon looks rich but is hard to compare. The chart is a sketch of the pattern; the table has the numbers.</Limit>
        </div>
      </Section>

      <Section id="questions" title="What it answers, and what it does not">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>It answers</span><List items={["Which parts are strongest and weakest?", "How many parts are in each status?", "Did a part move since the last round?", "What is the overall shape of the result?", "How many people sit in each severity band?"]} /></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>It does not answer</span><List items={["Why is a part low? (Diagnostic, Actions)", "Who is affected? (Composition)", "Is a change real or noise? (Not computed yet.)", "How should I weigh the parts? (They're equal.)", "What should I do? (Actions)"]} /></div>
        </Two>
      </Section>

      <Section id="neighbours" title="Next to the other Stories" lead="Each Story answers one question.">
        <SimpleTable head={["Story", "The question it answers", "Relationship to the Breakdown"]} widths={["22%", "34%", "44%"]} rows={[
          ["Insight Summary", "How is it doing?", "The Summary names the strongest and weakest part. The Breakdown shows every part."],
          ["Score Meaning", "What does this result mean?", "The Meaning explains the total. The Breakdown shows what it's made of."],
          ["Breakdown", "What is it made of?", "n/a"],
          ["Diagnostic", "Where should I look?", "The Breakdown lists the parts. The Diagnostic picks the ones that stand out."],
          ["Composition", "Who is in it?", "The Breakdown splits by part. Composition splits by group of people."],
          ["Methodology", "How was it worked out?", "The Breakdown never explains the calculation."],
        ]} />
      </Section>

      <Section id="open" title="Open questions" lead="Decisions this page can't make for you.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="A" title="Should the area form stay?">It's in the design, but its curve joins categories. A dot-and-line profile with no fill, or bars, says the same thing without the implied slope.</Limit>
          <Limit n="B" title="What are the severity cut-offs?">Mental Well-Being needs SHAPE's own definition of Normal to Extremely Severe for each measure, ideally from the survey's authors.</Limit>
          <Limit n="C" title="How are small teams protected?">The 5-person rule exists for groups. It isn't built for Team or Personal well-being, which the design shows with counts of 2 and 5.</Limit>
          <Limit n="D" title="Should the parts be weighted?">Today every part counts equally. If larger parts should count more, the Breakdown would need to say so.</Limit>
          <Limit n="E" title="Who reviews the health sentences?">“Seek support immediately” and the other personal sentences should be reviewed by a qualified person before they ship.</Limit>
        </div>
      </Section>
    </>
  );
}

export default function BreakdownDoc({ style, view = "developer" }) {
  return view === "researcher" ? <ResearcherView style={style} /> : <DeveloperView style={style} />;
}
