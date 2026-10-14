import { useState } from "react";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../lib/ds.js";
import { FLOURISHING_AT, STRIVING_AT } from "../../../lib/bands.js";
import { EMPLOYEE_COUNT, ROUNDS, DIMENSIONS } from "../../../lib/dataset.js";
import { overallSubject, dimensionSubject } from "../../../lib/scopeSubject.js";
import { rankAmong, focusGroups, SUPPRESS_BELOW } from "../../../lib/scopeData.js";
import { STORIES } from "../../widgetbuilder/storyCatalog.jsx";
import { StrongestWeakestStory, AreasToFocusStory } from "../../scope/stories/DiagnosticStory.jsx";
import { WithinReachStory, ChangesStory } from "../../scope/stories/FamilyStories.jsx";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import SegmentedControl from "../../ui/SegmentedControl.jsx";
import { Section, Prose, Callout, Variant, Anatomy, StoryStage, PropsTable, CodeBlock, FileBadge, FigmaParity, lightHexOf } from "../docKit.jsx";
import { SpecTable, SimpleTable, T, Fact, Limit, Two, List, card_ } from "../docParts.jsx";

export const meta = {
  id: "diagnostic", name: "Diagnostic", group: "Stories", kind: "Diagnostic",
  blurb: "What stands out within the selected insight: strengths, pressure points, groups that need attention, and the changes and links worth a look.",
  source: "components/scope/stories/DiagnosticStory.jsx · FamilyStories.jsx", figma: "13622:37239",
  views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }],
};
export const toc = {
  developer: [
    { id: "overview", label: "Overview" }, { id: "forms", label: "The forms" }, { id: "anatomy", label: "Anatomy" }, { id: "spec", label: "Specification" },
    { id: "states", label: "States & variants" }, { id: "responsive", label: "Responsive" }, { id: "limits", label: "Few, many, odd" }, { id: "content", label: "Content & voice" },
    { id: "a11y", label: "Accessibility" }, { id: "props", label: "Props & usage" }, { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
  ],
  researcher: [
    { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "forms", label: "The forms" }, { id: "live", label: "Live from the data" },
    { id: "limits", label: "Constraints" }, { id: "questions", label: "Answers & non-answers" }, { id: "neighbours", label: "Next to other Stories" }, { id: "open", label: "Open questions" },
  ],
};

/* ---- samples: the design's own values for the parity tables, and live data for everything else ---- */
const classic = (n) => <StoryStyleContext.Provider value="classic">{n}</StoryStyleContext.Provider>;
const DESIGN_GROUPS = [
  { axisKey: "tenure", axis: "Age", group: "18 - 25", score: 33, change: -2, n: 20, struggling: 18 },
  { axisKey: "gender", axis: "Gender", group: "Male", score: 32, change: 3, n: 200, struggling: 80 },
  { axisKey: "ethnicity", axis: "Ethnicity", group: "Asian", score: 27, change: 2, n: 20, struggling: 18 },
  { axisKey: "gender", axis: "Gender", group: "Female", score: 25, change: -2, n: 200, struggling: 80 },
];
const FStand = () => classic(<StrongestWeakestStory noun="Driver" strongest={{ label: "Coordination Friction", value: 61 }} weakest={{ label: "Decision-Making Speed", value: 12 }} />);
const FAreas = () => classic(<AreasToFocusStory groups={DESIGN_GROUPS} sort={false} />);

const px = (v) => Math.round(parseFloat(v) * 100) / 100;
const css = (el) => getComputedStyle(el);
const q = (r, sel) => r.querySelector(sel);
const qa = (r, sel) => [...r.querySelectorAll(sel)];
const rect = (el) => el.getBoundingClientRect();
const size = (el) => `${Math.round(rect(el).width)} × ${Math.round(rect(el).height)}`;
const type = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight)} · ${css(el).fontWeight}`;
const cardOf = (r) => q(r, "[data-story]");
const titleOf = (r) => q(cardOf(r), "p");
const common = (node, cardSize) => [
  { part: "Card size", node, figma: cardSize, read: (r) => size(cardOf(r)) },
  { part: "Card fill · border · radius · padding", node, figma: "#ffffff · 1 #cecdcc · 18 · 16", read: (r) => { const c = cardOf(r), s = css(c); return `${lightHexOf(c, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(c, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; } },
  { part: "Title: size / line · weight · colour", node, figma: "18/28 · 700 · #1d1a1b", mapped: "black in the design", read: (r) => `${type(titleOf(r))} · ${lightHexOf(titleOf(r), ["color"], true)}` },
  { part: "Intro line: size / line · colour", node, figma: "14/20 · 400 · #504c4d", read: (r) => { const l = cardOf(r).children[1]; return `${type(l)} · ${lightHexOf(l, ["color"], true)}`; } },
];
const STAND_CHECKS = [
  ...common("13622:37240", "808 × 278"),
  { part: "Evidence section: height · lines (softened from Figma's #b4b2b1)", node: "13622:37246", figma: "164 · 1/1 · #e5e4e3", read: (r) => { const e = q(r, '[data-part="evidence"]'), c = css(e); return `${Math.round(rect(e).height)} · ${px(c.borderTopWidth)}/${px(c.borderBottomWidth)} · ${lightHexOf(e, ["borderTop"])}`; } },
  { part: "Cards: size · gap", node: "13622:37247", figma: "379 × 130 · 16", read: (r) => { const [a, b] = qa(r, '[data-part="stat-card"]'); return `${size(a)} · ${px(rect(b).left - rect(a).right)}`; } },
  { part: "Inner card fill · border · radius · padding", node: "13622:37247", figma: "#ffffff · 1 #cecdcc · 12 · 16", read: (r) => { const c = q(r, '[data-part="stat-card"]'), s = css(c); return `${lightHexOf(c, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(c, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; } },
  { part: "Label: size / line · weight · colour", node: "13622:37249", figma: "14/20 · 700 · #504c4d", read: (r) => { const l = q(r, '[data-part="stat-label"]'); return `${type(l)} · ${lightHexOf(l, ["color"], true)}`; } },
  { part: "Score: size / line · weight · colour (61)", node: "13622:37250", figma: "16/24 · 700 · #d98d0b", mapped: "the design names it text-strong; the value is text-indicator", read: (r) => { const v = q(r, '[data-part="stat-value"]'); return `${type(v)} · ${lightHexOf(v, ["color"])}`; } },
  { part: "Score colour (12)", node: "13622:37267", figma: "#a32136", read: (r) => lightHexOf(qa(r, '[data-part="stat-value"]')[1], ["color"]) },
  { part: "Gap: label → score", node: "13622:37248", figma: "12", read: (r) => { const l = q(r, '[data-part="stat-label"]'), v = q(r, '[data-part="stat-value"]'); return px(rect(v).left - rect(l).right); } },
  { part: "Bar: height · radius · segments", node: "13622:37252", figma: "8 · 9999 · 10", read: (r) => { const b = q(r, '[data-part="segment-bar"]'); return `${Math.round(rect(b).height)} · ${px(css(b).borderTopLeftRadius)} · ${b.children.length}`; } },
  { part: "Filled segments (61, then 12)", node: "13622:37253", figma: "6 · 1", read: (r) => qa(r, '[data-part="segment-bar"]').map((b) => [...b.children].filter((c) => lightHexOf(c, ["background"]) !== "#e5e4e3").length).join(" · ") },
  { part: "Filled colours (Striving, Struggling)", node: "13622:37253", figma: "#f1a118 #cc2944", read: (r) => qa(r, '[data-part="segment-bar"]').map((b) => lightHexOf(b.children[0], ["background"])).join(" ") },
  { part: "Unfilled colour", node: "13622:37259", figma: "#e5e4e3", read: (r) => lightHexOf(q(r, '[data-part="segment-bar"]').lastElementChild, ["background"]) },
  { part: "Sentence: size / line · colour", node: "13622:37263", figma: "13/18 · 400 · #1d1a1b", mapped: "the second card uses #504c4d in the design", read: (r) => { const t = q(r, '[data-part="stat-text"]'); return `${type(t)} · ${lightHexOf(t, ["color"], true)}`; } },
];
const AREA_CHECKS = [
  ...common("13622:37281", "808 × 340"),
  { part: "Evidence section: height · lines (softened from Figma's #b4b2b1)", node: "13622:37286", figma: "226 · 1/1 · #e5e4e3", read: (r) => { const e = q(r, '[data-part="evidence"]'), c = css(e); return `${Math.round(rect(e).height)} · ${px(c.borderTopWidth)}/${px(c.borderBottomWidth)} · ${lightHexOf(e, ["borderTop"])}`; } },
  { part: "Cards: size · gaps", node: "13622:37288", figma: "379 × 88 · 16 · 16", read: (r) => { const c = qa(r, '[data-part="group-card"]'); return `${size(c[0])} · ${px(rect(c[1]).left - rect(c[0]).right)} · ${px(rect(c[2]).top - rect(c[0]).bottom)}`; } },
  { part: "Inner card fill · border · radius · padding", node: "13622:37288", figma: "#ffffff · 1 #cecdcc · 12 · 16", read: (r) => { const c = q(r, '[data-part="group-card"]'), s = css(c); return `${lightHexOf(c, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(c, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; } },
  { part: "Icon size", node: "13622:37292", figma: "20 × 20", read: (r) => { const c = q(r, '[data-part="group-card"]'); const i = c.firstElementChild.firstElementChild.firstElementChild; return size(i); } },
  { part: "Name: size / line · weight · colour", node: "13622:37293", figma: "14/20 · 700 · #504c4d", read: (r) => { const n = q(r, '[data-part="group-name"]'); return `${type(n)} · ${lightHexOf(n, ["color"])}`; } },
  { part: "Gap: icon → name → tag", node: "13622:37291", figma: "12 · 12", read: (r) => { const c = q(r, '[data-part="group-card"]'); const i = c.firstElementChild.firstElementChild.firstElementChild, n = q(c, '[data-part="group-name"]'), t = q(c, '[data-part="system-tag"]'); return `${px(rect(n).left - rect(i).right)} · ${px(rect(t).left - rect(n).right)}`; } },
  { part: "System tag: fill · border · radius", node: "13622:37294", figma: "#f2f2f2 · 1 #b4b2b1 · 9999", read: (r) => { const t = q(r, '[data-part="system-tag"]'); return `${lightHexOf(t, ["background"])} · ${px(css(t).borderTopWidth)} ${lightHexOf(t, ["border", "borderTop"])} · ${px(css(t).borderTopLeftRadius)}`; } },
  { part: "System tag: height · padding · text", node: "13622:37294", figma: "20 · 6 · 12/16 · #504c4d", read: (r) => { const t = q(r, '[data-part="system-tag"]'), s = css(t); return `${Math.round(rect(t).height)} · ${px(s.paddingLeft)} · ${px(s.fontSize)}/${px(s.lineHeight)} · ${lightHexOf(t, ["color"])}`; } },
  { part: "Trend pill: height · radius · fill (-2)", node: "13622:37296", figma: "20 · 46 · #fce3e7", read: (r) => { const t = q(r, '[data-part="trend"]'); return `${Math.round(rect(t).height)} · ${px(css(t).borderTopLeftRadius)} · ${lightHexOf(t, ["background"])}`; } },
  { part: "Score: size / line · weight · colour", node: "13622:37297", figma: "16/24 · 700 · #a32136", read: (r) => { const v = q(r, '[data-part="group-score"]'); return `${type(v)} · ${lightHexOf(v, ["color"])}`; } },
  { part: "Chevron: size · colour", node: "13622:37298", figma: "20 · #a5a2a2", read: (r) => { const c = q(r, '[data-part="chevron"]'); return `${Math.round(rect(c).width)} · ${lightHexOf(c, ["color"])}`; } },
  { part: "Gap: pill → score → chevron", node: "13622:37295", figma: "10 · 10", read: (r) => { const c = q(r, '[data-part="group-card"]'); const t = q(c, '[data-part="trend"]'), s = q(c, '[data-part="group-score"]'), v = q(c, '[data-part="chevron"]'); return `${px(rect(s).left - rect(t).right)} · ${px(rect(v).left - rect(s).right)}`; } },
  { part: "Sentence: size / line · colour", node: "13622:37311", figma: "13/18 · 400 · #1d1a1b", mapped: "the right-hand cards use #504c4d in the design", read: (r) => { const t = q(r, '[data-part="group-sentence"]'); return `${type(t)} · ${lightHexOf(t, ["color"], true)}`; } },
  { part: "Gap: header → sentence", node: "13622:37288", figma: "16", read: (r) => { const c = q(r, '[data-part="group-card"]'); return px(rect(q(c, '[data-part="group-sentence"]')).top - rect(c.firstElementChild).bottom); } },
];

/* ---- live Stories through the catalogue, so each form shows real data ---- */
const STORY = (id) => STORIES.find((s) => s.id === id);
const overall = overallSubject();
const culture = dimensionSubject("Corporate Culture");
const live = (id, subject = overall) => { const s = STORY(id); return s.blocked(subject) ? null : s.render(subject, {}); };

const FORMS = [
  { id: "form-stand-out", name: "What Stands Out", use: "The best and the worst part, side by side. The first thing to read.", from: "Figma", sid: "diagnostic" },
  { id: "form-areas", name: "Areas to Focus On", use: "The lowest-scoring group on each way of grouping people, with how many are struggling.", from: "Figma", sid: "areas" },
  { id: "form-changes", name: "What Changed", use: "The biggest gains and drops since an earlier round.", from: "System", sid: "changes" },
  { id: "form-bright", name: "Bright Spots", use: "The highest-scoring group on each way of grouping, and how many are flourishing. The mirror of Areas to Focus.", from: "System", sid: "bright" },
  { id: "form-gaps", name: "Where Gaps Are Widest", use: "The distance between the lowest and highest group, per way of grouping.", from: "System", sid: "gap" },
  { id: "form-connected", name: "What Moves With This", use: "Topics whose scores rise and fall with this one across people. A link, not a cause.", from: "System", sid: "connected" },
  { id: "form-priority", name: "Priority Map", use: "Which parts to fix first, protect, watch or maintain, by score and by how closely each moves with the overall score.", from: "System", sid: "priority" },
  { id: "form-reach", name: "Within Reach", use: "The parts closest to the next status line up: good first steps.", from: "System", sid: "reach" },
  { id: "form-rank", name: "How It Ranks", use: "Where one Explorer or Driver sits among all its peers.", from: "System", sid: "rank" },
];
const renderForm = (f) => (f.sid === "rank" ? live("rank", culture) : live(f.sid));

const PARTS = [
  { id: "card", name: "Story card", note: "The shared surface.", find: (r) => [r.querySelector("[data-story]")] },
  { id: "evidence", name: "Evidence section", note: "A line above and below, 16px around the cards.", find: (r) => [r.querySelector('[data-part="evidence"]')] },
  { id: "inner", name: "Inner card", note: "surface/card, 1px border/secondary, radius/lg, 16 padding, 16 gap.", find: (r) => [r.querySelector('[data-part="stat-card"]')] },
  { id: "label", name: "Label", note: "Text sm / Bold, text/secondary.", find: (r) => [r.querySelector('[data-part="stat-label"]')] },
  { id: "score", name: "Score", note: "Text md-Trim / Bold in the status text colour.", find: (r) => [r.querySelector('[data-part="stat-value"]')] },
  { id: "bar", name: "Segment bar", note: "Ten equal segments, filled to the score in the status colour.", find: (r) => [r.querySelector('[data-part="segment-bar"]')] },
  { id: "sentence", name: "Sentence", note: "Text xs, the name in bold.", find: (r) => [r.querySelector('[data-part="stat-text"]')] },
];
const GROUP_PARTS = [
  { id: "card", name: "Group card", note: "An inner card, one per group.", find: (r) => [r.querySelector('[data-part="group-card"]')] },
  { id: "icon", name: "Icon", note: "20px, icon/primary. One per way of grouping.", find: (r) => [r.querySelector('[data-part="group-card"]').firstElementChild.firstElementChild.firstElementChild] },
  { id: "name", name: "Group", note: "Text sm / Bold, truncates with an ellipsis.", find: (r) => [r.querySelector('[data-part="group-name"]')] },
  { id: "tag", name: "System tag", note: "Names the way of grouping.", find: (r) => [r.querySelector('[data-part="system-tag"]')] },
  { id: "trend", name: "Change", note: "The Trend Indicator pill, since the round before.", find: (r) => [r.querySelector('[data-part="trend"]')] },
  { id: "score", name: "Score", note: "The group's score.", find: (r) => [r.querySelector('[data-part="group-score"]')] },
  { id: "chevron", name: "Chevron", note: "In the design. Inert until the product has somewhere to go.", find: (r) => [r.querySelector('[data-part="chevron"]')] },
  { id: "sentence", name: "Sentence", note: "How many of the group are in the status.", find: (r) => [r.querySelector('[data-part="group-sentence"]')] },
];

const WIDTHS = [320, 390, 480, 560, 808];
function ResponsiveShowcase({ style }) {
  const [w, setW] = useState(320);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], flexWrap: "wrap" }}>
        <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>Card width</span>
        <SegmentedControl options={WIDTHS.map((x) => ({ id: String(x), label: `${x}px` }))} value={String(w)} onChange={(v) => setW(+v)} />
        <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{w < 400 ? "Tight" : w < 560 ? "Compact" : "Designed layout"}</span>
      </div>
      <div style={{ display: "flex", gap: dsSpace[24], flexWrap: "wrap", alignItems: "flex-start" }}>
        {FORMS.map((f) => (
          <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], maxWidth: "100%" }}>
            <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{f.name}</span>
            <StoryStyleContext.Provider value={style}><div style={{ width: w, maxWidth: "100%", overflowX: "auto" }}>{renderForm(f)}</div></StoryStyleContext.Provider>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================================================================================================== */
function DeveloperView({ style }) {
  const g = (n, extra) => ({ axisKey: "department", axis: "Department", group: "Operations", score: 38, change: -1, n, struggling: 8, ...extra });
  const part = (label, value) => ({ label, value });
  return (
    <>
      <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
        <Prose>
          <p><b>Purpose:</b> identifies what stands out within the selected insight.</p>
          <p><b>Can contain:</b> strengths, pressure points, lowest or highest measures, outliers, important changes, and groups that may need attention.</p>
          <p><b>Boundary:</b> findings must follow approved diagnostic rules and available data. It should not simply repeat the full Breakdown Story.</p>
          <p><b>Which one?</b> <i>What Stands Out</i> is the first read: one strong part, one weak part. <i>Areas to Focus On</i> moves from parts to people: which group needs attention. The rest answer a narrower question each: what moved, who is doing well, where groups differ, what tracks with this, what to fix first, what is close to the next line, and where this one ranks.</p>
          <p><b>Where it appears:</b> after the Breakdown in the Org Score, Explorer, and Factors Scopes, and in the Widget Builder's default Scope. Used by <FileBadge>scope/scopeRecipes.jsx</FileBadge> and <FileBadge>widgetbuilder/storyCatalog.jsx</FileBadge>.</p>
        </Prose>
      </Section>

      <Section id="forms" title="The forms" lead="Two are in the design. The other seven were added around them in the same style, and the page marks which is which.">
        <SimpleTable head={["Form", "Use it when", "Source"]} widths={["24%", "60%", "16%"]} rows={FORMS.map((f) => [<a key={f.id} href={`#${f.id}`} style={{ color: "inherit" }}>{f.name}</a>, f.use, f.from === "Figma" ? "Figma" : "Designed from the system"])} />
      </Section>

      <Section id="anatomy" title="Anatomy" lead="The numbered parts are drawn on the live Stories, and the table is measured in your browser with the design-system token behind each colour.">
        <Variant title="What Stands Out"><Anatomy parts={PARTS} style={style} kind={meta.kind} width={808}><StrongestWeakestStory noun="Driver" strongest={{ label: "Coordination Friction", value: 61 }} weakest={{ label: "Decision-Making Speed", value: 12 }} /></Anatomy></Variant>
        <Variant title="Areas to Focus On"><Anatomy parts={GROUP_PARTS} style={style} kind={meta.kind} width={808}><AreasToFocusStory groups={DESIGN_GROUPS} sort={false} /></Anatomy></Variant>
      </Section>

      <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark); never hard-code the hex.">
        <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[
          ["Card", "Shell", "The shared Story card: up to 808px, 18px radius, 16px padding, 16px between parts."],
          ["Evidence section", "Lines and space", <span key="e" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>1px above and below {T("border/tertiary")}; 16px above and below the cards</span>],
          ["Card grid", "Layout", "Two columns 16px apart on a wide card, one column on a compact card. Cards in a row stretch to the same height."],
          ["Inner card", "Surface", <span key="i" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{T("surface/General/card")}, 1px {T("border/secondary")}, radius/lg (12), 16px padding, 16px between parts</span>],
          ["Stat card", "Header", <span key="h" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Label Text sm / Bold {T("text/secondary")}, 12px, then the score Text md-Trim / Bold in the status colour</span>],
          ["", "Segment bar", "Ten equal segments, 8px tall, fully rounded. Filled segments = the score divided by ten, rounded; they take the status graph colour, the rest bg/secondary."],
          ["", "Sentence", <span key="s" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text xs (13/18), {T("text/primary")}, the part's name in bold</span>],
          ["Group card", "Header", "An icon (20px), the group in Text sm / Bold, and the System Tag, 12px apart. At the right: the change pill, the score, and a 20px chevron, 10px apart."],
          ["", "System tag", <span key="t" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{T("bg/primary")}, 1px {T("border/primary")}, fully rounded, 20px tall with 6px side padding, Text 2xs {T("text/secondary")}</span>],
          ["", "Sentence", "“18 out of 20 employees are struggling”, with the counts in bold. “None of the 20…” and “All 20…” when it is none or all."],
          ["", "Chevron", <span key="c" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>20px, 2px stroke, {T("icon/tertiary")}. The card is inert unless it is given an <code>onOpen</code>.</span>],
          ["Rail row (changes, links, within reach, rank)", "Row", "The same row as the Breakdown bars: a right-aligned label up to 247px, an 8px track, then the score and a detail. Rows 16px apart."],
          ["Gap card", "Rail", "A 0 to 100 rail with faint lines at the status thresholds, a grey stretch from the lowest to the highest group, and a 14px dot at each end in its status colour, ringed in the card colour."],
          ["Priority map", "Plot", "776 by 400. A dashed line at the Flourishing threshold and at the middle link. Dots take the status colour; the Fix first quadrant is tinted with the Struggling background."],
          ["Compact (under 560px)", "All forms", "One column. The priority map becomes four tinted lists. Rail rows put the label and score on one line over a full-width track. Hover becomes tap."],
        ]} />
      </Section>

      <Section id="states" title="States & variants" lead="Every form drawn from the real data. Switch Current and Refined at the top to compare (Refined is the earlier drawing).">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {FORMS.map((f) => (
            <div id={f.id} key={f.id}>
              <Variant title={f.name} note={f.from === "Figma" ? "From the design." : "Designed from the system. No Figma frame yet."}>
                <StoryStage style={style} kind={meta.kind} width={808}>{renderForm(f)}</StoryStage>
              </Variant>
            </div>
          ))}
        </div>
      </Section>

      <Section id="responsive" title="Responsive" lead="Each form responds to the width of its own card. Pick a width to see all nine at it.">
        <ResponsiveShowcase style={style} />
        <Prose><p>At 560px and wider nothing changes from the designed layouts. Below that the cards stack into one column; the rail rows put label and score on one line with the track full width underneath; the priority map becomes four tinted lists; the spread chart labels only its thresholds; and a tap selects what hover selects on a wide card.</p></Prose>
      </Section>

      <Section id="limits" title="Few, many, odd" lead="What each form does with nothing, one, or too many, and with values at the edges.">
        <SimpleTable head={["Form", "Most it shows", "When there's less or more"]} widths={["22%", "16%", "62%"]} rows={[
          ["What Stands Out", "2 cards", "One part: a single card, “Only Driver”, saying there is nothing to compare it with. Ties go to the first in the order given."],
          ["Areas to Focus On", "4 groups", "One group per way of grouping, worst first, 4 by default and 7 at most. Groups under 5 people are never shown; with none, the Story says so. An odd count leaves the last card half width. A group with no change since the last round shows no pill."],
          ["What Changed", "3 + 3", "Fewer if fewer moved. If nothing moved the Story says so in one line. The round picker is hidden with only one earlier round."],
          ["Bright Spots", "4 groups", "As Areas to Focus On, best first."],
          ["Where Gaps Are Widest", "7 cards", "Only ways of grouping with at least two groups of 5 or more. Widest gap first. A gap of 0 puts both dots in one place."],
          ["What Moves With This", "6 rows", "Fewer if fewer topics have scores. A link of 0 draws an empty bar and reads “Weak”."],
          ["Priority Map", "Any", "Needs 3 parts. On a wide card, parts are named on the plot up to 8; past that only the Fix first parts are. If every part falls in one quadrant, the other groups are left out."],
          ["Within Reach", "4 rows", "When every part is already Flourishing: “Every Driver is already Flourishing.”"],
          ["How It Ranks", "14 rows", "More than 14 peers: the top three, the bottom three, and the places around this one, with “···” where rows are skipped."],
        ]} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 28 }}>
          <Variant title="One part" note="No comparison is possible."><StoryStage style={style} kind={meta.kind} width={560}><StrongestWeakestStory noun="Driver" strongest={part("Sleep", 38)} weakest={part("Sleep", 38)} /></StoryStage></Variant>
          <Variant title="No group of 5 or more"><StoryStage style={style} kind={meta.kind} width={560}><AreasToFocusStory groups={[]} /></StoryStage></Variant>
          <Variant title="Three groups, none struggling, all struggling" note="An odd count, and the none and all sentences."><StoryStage style={style} kind={meta.kind} width={560}><AreasToFocusStory groups={[g(12, { struggling: 0, score: 71 }), g(30, { struggling: 30, score: 12, group: "Sales", change: 0 }), g(40, { group: "Finance", change: null })]} /></StoryStage></Variant>
          <Variant title="Every part Flourishing" note="Within Reach has nothing to show."><StoryStage style={style} kind={meta.kind} width={560}><WithinReachStory noun="Driver" items={[{ label: "Sleep", values: [88, 90, 91] }, { label: "Exercise", values: [85, 86, 92] }]} /></StoryStage></Variant>
        </div>
      </Section>

      <Section id="content" title="Content & voice" lead="Written to the SHAPE Voice and Language Guide (docs/shape-voice-and-language-guide.md).">
        <SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={[
          ["Titles", "“What Stands Out”, “Areas to Focus On”, “Where Gaps Are Widest”: title case, under 7 words, no full stop."],
          ["Intro line", "Says what the Story shows and for what. “Here are the drivers that stand out most in your results.” Explorers keep their capital; the others are lower case."],
          ["Sentences", "Short, with the name or the counts in bold. “Coordination Friction is performing better than the other drivers.”"],
          ["Counts", "“18 out of 20 employees are struggling”, “None of the 20…”, “All 20…”. Never “1 employees”: groups under 5 are never shown."],
          ["No em dashes", "A colon or a full stop instead. “…for Sleep: what is working, and who could share it.”"],
          ["Status words", "Flourishing, Striving, Struggling, capitalised. “Struggling” as a count is lower case: “are struggling”."],
          ["Care with groups", "A group is a way of describing people the organisation already has. The Story never says why a group scores lower, only that it does."],
        ]} />
      </Section>

      <Section id="a11y" title="Accessibility" lead="What the component does today, and what to keep doing.">
        <Prose>
          <p><b>Bars and rails are pictures</b>, so each has <code>role="img"</code> and a label that says the value in words (“61 out of 100”). The number beside it is always printed, so colour is never the only signal.</p>
          <p><b>Cards are plain text</b> unless they are given <code>onOpen</code>, in which case they become a real button. The chevron is hidden from screen readers.</p>
          <p><b>Hover is never the only way in.</b> The spread chart and the priority map select on tap as well as hover, and the table view of any chart form is one click away.</p>
          <p><b>Colour.</b> The numbers use the status text colours checked on the Insight Summary page. The amber number on white is 2.1:1, the one place this family fails AA; the <code>warning/text-strong</code> token is the one-line fix.</p>
        </Prose>
      </Section>

      <Section id="props" title="Props & usage">
        <PropsTable rows={[
          { name: "StrongestWeakestStory.strongest / weakest", type: "{ label, value }", required: true, desc: "The best and the worst part, from the same list. Pass the same part twice for the one-part card." },
          { name: "StrongestWeakestStory.noun", type: "string", def: "\"Explorer\"", desc: "What the parts are called, singular. Used in the labels and the intro line." },
          { name: "StrongestWeakestStory.actionsCta", type: "boolean", def: "false", desc: "Adds the dark “Actions you can take” button under the weakest Driver." },
          { name: "AreasToFocusStory.groups", type: "[{ axisKey, axis, group, score, change, n, struggling }]", required: true, desc: "From focusGroups(): one group per way of grouping, 5 people or more." },
          { name: "AreasToFocusStory.sort", type: "boolean", def: "true", desc: "Worst first. Pass false to keep the order given." },
          { name: "GroupCard.onOpen", type: "() => void", desc: "Makes the card a button. Without it the card, and its chevron, are inert." },
        ]} />
        <CodeBlock label="Usage" code={`<StrongestWeakestStory
  noun="Driver"
  strongest={{ label: "Coordination Friction", value: 61 }}
  weakest={{ label: "Decision-Making Speed", value: 12 }}
/>

<AreasToFocusStory groups={focusGroups(4, scoreOf)} />`} />
        <Prose><p><b>Data.</b> The Stories read no data themselves; the helpers in <FileBadge>lib/scopeData.js</FileBadge> (<code>focusGroups</code>, <code>brightSpots</code>, <code>groupGaps</code>, <code>connections</code>, <code>priorityPoints</code>, <code>withinReach</code>, <code>rankAmong</code>) do, and always apply the 5-person rule. The shared parts are in <FileBadge>stories/diagnosticParts.jsx</FileBadge>.</p></Prose>
      </Section>

      <Section id="done" title="Done checklist" lead="You're done when every line is true.">
        <List items={[
          "The card, title, intro line, and evidence section match the Insight Summary and the Breakdown.",
          "Cards sit two to a row, 16px apart, and stretch to the same height; one column when compact.",
          "A stat card: label and score on one line, a ten-segment bar filled to the score, a sentence with the name in bold.",
          "A group card: icon, group, system tag, change, score, chevron, then the count sentence.",
          "Every score is Text md-Trim / Bold in the status text colour, from lib/bands.js (60 and 80).",
          "Groups under 5 people never appear. Counts read “None of…”, “All…”, or “n out of N”.",
          "Every form says so when there is nothing to show, and handles one part.",
          "Every rail is 8px with a role and a label. Hover has a tap equivalent.",
          "Colours are design-system tokens and follow Light and Dark. Copy follows the voice guide.",
        ]} />
      </Section>

      <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
        <Prose><p><b>Matches the design.</b> The two frames in Figma node 13622:37239, drawn with the real components at the design's width (808px) with the design's own sample values, and measured in your browser. A row marked “design” is where the design's value differs from the design system.</p></Prose>
        <Prose><p><b>1. What Stands Out</b> (13622:37240)</p></Prose><FigmaParity checks={STAND_CHECKS}><FStand /></FigmaParity>
        <Prose><p><b>2. Areas to Focus On</b> (13622:37281)</p></Prose><FigmaParity checks={AREA_CHECKS}><FAreas /></FigmaParity>
        <Prose>
          <p><b>Not in the design.</b> Seven of the nine forms (What Changed, Bright Spots, Where Gaps Are Widest, What Moves With This, Priority Map, Within Reach, How It Ranks) have no frame. They were drawn from the same parts: the inner card, the rail row, the status colours, the Evidence Section. They need a design review.</p>
          <p><b>Slips and questions in the frames.</b> (1) The intro line of both says “drivers”, but Areas to Focus On lists groups of people; the component says “parts of your organisation”. (2) The cards are listed 33, 32, 27, 25, highest first; “areas to focus” should be worst first, so the component sorts that way unless told not to. (3) The sentence is #1d1a1b in the left card and #504c4d in the right, in both frames; built as primary throughout. (4) The title is black (#000) in the first frame and the primary text colour in the second. (5) The scores use the variable named <code>text-strong</code> but with the <code>text-indicator</code> value (#d98d0b, #a32136); the component uses text-indicator, as on the Insight Summary. (6) The chevron implies tapping a group opens something. Nothing is designed for that, so it's inert.</p>
          <p><b>Decisions for you.</b> (1) <b>Icons.</b> The design has Age, Gender, and Ethnicity icons. The data has no age or ethnicity, so Tenure uses the Age icon (a person with a clock), Gender its own, and the rest use the closest line icons. A set for Department, Job Level, Location, Employment Status, and Work Model is needed. (2) <b>Segments.</b> The bar fills the score divided by ten, rounded, so 61 fills six and 65 fills seven. Confirm rounding rather than flooring. (3) <b>Ethnicity and age</b> appear in the design as groups, but the data deliberately has neither. (4) <b>A group's trend</b> compares its average with the round before, with no significance test; a swing of 2 in a group of 20 is noise.</p>
        </Prose>
      </Section>
    </>
  );
}

/* ======================================================================================================== */
function ResearcherView({ style }) {
  const groups = focusGroups(4);
  const rk = rankAmong(culture);
  return (
    <>
      <Section id="story" title="The data story" lead="The Breakdown lists every part. The Diagnostic picks the ones worth a look.">
        <Prose>
          <p>A reader with twelve Explorers and a handful of ways of grouping people can't read everything. The Diagnostic does the first pass: the strongest and weakest part, the groups furthest behind, and the changes, gaps, and links that stand out. It uses fixed rules and the data that exists, so it surfaces things to look at and never explains them.</p>
          <p>It must not just repeat the Breakdown. The Breakdown shows every part. The Diagnostic shows two, and says which.</p>
        </Prose>
        <Callout title="The idea in one line">The Breakdown says what it's made of. The Diagnostic says where to look.</Callout>
      </Section>

      <Section id="glance" title="At a glance">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Question it answers" value="What stands out?" />
          <Fact label="Unit" value="A part or a group" note="An Explorer, a Driver, or a group of 5 or more people." />
          <Fact label="Forms" value="Nine" note="Two designed, seven added." />
          <Fact label="Privacy" value="Groups of 5+" note="Smaller groups never appear." />
          <Fact label="Time reference" value="The latest round" note={`Changes compare with the round before (${ROUNDS.length} rounds exist).`} />
          <Fact label="People behind it" value={`${EMPLOYEE_COUNT} respondents`} note="Synthetic data in this prototype." />
        </div>
      </Section>

      <Section id="forms" title="The forms" lead="Each answers one narrow question.">
        <SimpleTable head={["Form", "Question", "Rule that picks it"]} widths={["22%", "34%", "44%"]} rows={[
          ["What Stands Out", "Which part is best and which is worst?", "Highest and lowest score among the parts. Ties go to the first."],
          ["Areas to Focus On", "Which group is furthest behind?", "The lowest-scoring group with 5+ people on each way of grouping, worst first."],
          ["What Changed", "What moved most?", "Largest rises and falls since a round the reader picks."],
          ["Bright Spots", "Who is doing best?", "The highest-scoring group on each way of grouping."],
          ["Where Gaps Are Widest", "Where do groups differ most?", "Highest minus lowest group score, per way of grouping."],
          ["What Moves With This", "What tracks with this?", "Pearson correlation across people. A link, not a cause."],
          ["Priority Map", "What should be fixed first?", "Low score and a strong link to the overall score. See constraints."],
          ["Within Reach", "What is closest to the next line?", "Smallest gap to the next status threshold."],
          ["How It Ranks", "Where does this sit?", "Rank among all Explorers or all Drivers."],
        ]} />
      </Section>

      <Section id="live" title="Live from the data" lead="Real examples built from the dataset right now.">
        <Variant title="Areas to Focus On" note="Worst first. Counts are people below 60."><StoryStage style={style} kind={meta.kind} width={808}><AreasToFocusStory groups={groups} /></StoryStage></Variant>
        {FORMS.filter((f) => ["form-stand-out", "form-priority", "form-rank"].includes(f.id)).map((f) => <Variant key={f.id} title={f.name}><StoryStage style={style} kind={meta.kind} width={808}>{renderForm(f)}</StoryStage></Variant>)}
        <SimpleTable head={["In the Story", "Data behind it"]} widths={["30%", "70%"]} rows={[
          ["A group's score", "The mean overall score of the people in it, latest round."],
          ["“n out of N are struggling”", `People in the group scoring under ${STRIVING_AT}, out of the group's size. Groups under ${SUPPRESS_BELOW} are hidden.`],
          ["A group's change", "Its mean now minus its mean in the round before, in points."],
          ["The strongest and weakest", `Highest and lowest of the ${DIMENSIONS.length} Explorers, or of an Explorer's Drivers.`],
          ["How It Ranks", `${rk ? `Corporate Culture is number ${rk.rank} of ${rk.total} Explorers.` : "Rank among peers."}`],
        ]} />
      </Section>

      <Section id="limits" title="Constraints" lead="What a reader, or a researcher quoting this, should keep in mind.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="Strongest and weakest are only the ends.">Two parts a point apart both look decisive when they're picked as “strongest” and “weakest”. The card doesn't say how far apart they are or how many are close.</Limit>
          <Limit n="2" title="A group's score is an average of people.">A group of 5 is five people. Its score and its change can move several points on one person. The 5-person rule protects identity, not statistical confidence.</Limit>
          <Limit n="3" title="Worst on each axis is not the worst group overall.">Areas to Focus On picks the lowest group within each way of grouping. A small group on one axis can sit above a large group on another that isn't shown.</Limit>
          <Limit n="4" title="Groups overlap.">A person is in a department, a location, a work model, and more. “Struggling” counts on different cards include some of the same people, so the counts shouldn't be added.</Limit>
          <Limit n="5" title="Links are correlation." use="Treat a link as a place to look, never an instruction.">What Moves With This and the Priority Map rank by correlation across people. A strong link doesn't mean changing one changes the other, and the Priority Map's link to the overall score is inflated for parts that make up the overall score.</Limit>
          <Limit n="6" title="The status lines are fixed.">Within Reach treats 59 and 60 very differently (one is a status away), though they're practically the same.</Limit>
          <Limit n="7" title="One comparison is not a trend.">What Changed compares two rounds with no significance test. The prototype has three rounds.</Limit>
          <Limit n="8" title="The data is synthetic.">{EMPLOYEE_COUNT} generated respondents. It shows how the Stories behave, not a finding about a real organisation.</Limit>
        </div>
      </Section>

      <Section id="questions" title="What it answers, and what it does not">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>It answers</span><List items={["Which part is strongest and weakest?", "Which group is furthest behind?", "What moved most?", "Where do groups differ most?", "What is closest to the next status?"]} /></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>It does not answer</span><List items={["Why is a group low? (Nothing explains it.)", "Is a difference real or noise? (Not computed.)", "What should be done? (Actions)", "Who is in each group? (Composition)", "How was it measured? (Methodology)"]} /></div>
        </Two>
      </Section>

      <Section id="neighbours" title="Next to the other Stories" lead="Each Story answers one question.">
        <SimpleTable head={["Story", "The question it answers", "Relationship to the Diagnostic"]} widths={["22%", "34%", "44%"]} rows={[
          ["Breakdown", "What is it made of?", "The Breakdown lists every part. The Diagnostic names the ends."],
          ["Composition", "Who is in it?", "Composition lists every group. Areas to Focus On names the lowest."],
          ["Trend", "How has it moved?", "What Changed picks the biggest moves; Trend shows the whole path."],
          ["Actions", "What can I do?", "The weakest Driver card can open its Actions one layer deeper."],
        ]} />
      </Section>

      <Section id="open" title="Open questions" lead="Decisions this page can't make for you.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="A" title="Should the cards say how far apart the ends are?">“Strongest” and “weakest” could carry the gap, or only appear when the gap is meaningful.</Limit>
          <Limit n="B" title="What makes a group change meaningful?">A minimum group size or a minimum move before the pill appears would stop reading noise as news.</Limit>
          <Limit n="C" title="Should a card open something?">The chevron says yes. What it opens (the group's own Scope, its Breakdown) needs deciding.</Limit>
          <Limit n="D" title="Which ways of grouping belong here?">The design shows age, gender, and ethnicity. The data has none of age or ethnicity, by design.</Limit>
        </div>
      </Section>
    </>
  );
}

export default function DiagnosticDoc({ style, view = "developer" }) {
  return view === "researcher" ? <ResearcherView style={style} /> : <DeveloperView style={style} />;
}
