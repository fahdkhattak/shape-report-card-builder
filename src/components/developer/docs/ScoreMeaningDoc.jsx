import { useState } from "react";
import { band } from "../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder, DS_RAW, tokenForVar } from "../../../lib/ds.js";
import { FLOURISHING_AT, STRIVING_AT, RANGES, statusName } from "../../../lib/bands.js";
import { overallSeries, enpsSeries, roundName, LAST } from "../../../lib/scopeData.js";
import { LATEST, ROUNDS, EMPLOYEE_COUNT, DIMENSIONS, dimensionRankedRows } from "../../../lib/dataset.js";
import { dimensionSubject } from "../../../lib/scopeSubject.js";
import { MeaningStory, StatusMeaningStory, ThresholdScale, ScoreRing } from "../../scope/stories/SummaryStories.jsx";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import { ORG_MEANING } from "../../scope/scopeRecipes.jsx";
import { MEANING } from "../../widgetbuilder/storyCatalog.jsx";
import { Section, Prose, Callout, Variant, Anatomy, StoryStage, PropsTable, CodeBlock, FileBadge, FigmaParity, lightHexOf, StatusPill } from "../docKit.jsx";
import { ContrastTable, SpecTable, SimpleTable, T, Fact, Limit, Two, List, card_ } from "../docParts.jsx";
import DataNeeds from "../DataNeeds.jsx";

export const meta = {
  id: "score-meaning", name: "Score Meaning", group: "Stories", kind: "Score / Status Meaning",
  blurb: "What the current result means for the reader, as a number, a ring, a status word, or a value with units.",
  source: "components/scope/stories/SummaryStories.jsx · MeaningStory, StatusMeaningStory", figma: "13622:37198 · 14531:21543",
  views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }],
};
export const toc = {
  developer: [
    { id: "overview", label: "Overview" }, { id: "forms", label: "The four forms" }, { id: "playground", label: "Try it" }, { id: "anatomy", label: "Anatomy" },
    { id: "spec", label: "Specification" }, { id: "states", label: "States & variants" }, { id: "edges", label: "Sizes & edge cases" }, { id: "content", label: "Content & voice" },
    { id: "a11y", label: "Accessibility" }, { id: "data", label: "Data it needs" }, { id: "props", label: "Props & usage" }, { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
  ],
  researcher: [
    { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "shows", label: "What it can show" }, { id: "made", label: "How the words are chosen" },
    { id: "forms", label: "The forms" }, { id: "live", label: "Live from the data" }, { id: "limits", label: "Constraints" }, { id: "questions", label: "Answers & non-answers" },
    { id: "neighbours", label: "Next to other Stories" }, { id: "open", label: "Open questions" },
  ],
};

/* ======================================================================================================== */
/* Samples                                                                                                   */
/* ======================================================================================================== */
const SAMPLE = { Flourishing: 86, Striving: 61, Struggling: 32 };
const SERIES = [54, 57]; // the two earlier rounds, enough for the Compare switch

/* The number and ring forms. `report` = the report's wording ("Your score of…"); otherwise the Widget Builder's ("Sleep scores…"). */
function Score({ v, ring = false, report = false, subject = "Sleep", compare = true, unit = "/100" }) {
  const status = statusName(v);
  const head = report
    ? <>Your score of <span style={{ color: band(v).cs }}>{v}</span>/100 places you in {status}.</>
    : <>{subject} scores <span style={{ color: band(v).cs }}>{v}</span>/100, which is {status}.</>;
  return (
    <MeaningStory title={report ? "What Your Score Is Telling You" : "What This Score Is Telling You"} value={v} unit={ring ? undefined : unit} ring={ring}
      values={compare ? [...SERIES, v] : undefined} headline={head} text={report ? ORG_MEANING[status] : MEANING[status]} />
  );
}
function StatusOnly({ v, paragraphs }) {
  const status = statusName(v);
  return <StatusMeaningStory title="What Your Status Is Telling You" status={status} text={paragraphs || [<>{ORG_MEANING[status]} Your organisation's score is <b style={{ color: band(v).cs }}>{v}</b>/100.</>]} />;
}
const TILE = { parts: [{ value: "2", unit: "yrs" }, { value: "3", unit: "mo" }], status: "Flourishing" };
function Units() {
  return <MeaningStory title="What Your Score Is Telling You" tile={TILE} headline={<>Your health actions make you <span style={{ color: band(86).cs }}>2 yrs 3 mo younger</span> than your age.</>} />;
}

/* ======================================================================================================== */
/* Parity samples: the exact three frames in Figma node 13622:37198, drawn with the real component          */
/* ======================================================================================================== */
const classic = (n) => <StoryStyleContext.Provider value="classic">{n}</StoryStyleContext.Provider>;
const FigmaNumber = () => classic(
  <MeaningStory title="What Your Score is Telling You" value={67} unit="/100" bandColor
    headline={<>Your score of <span style={{ color: band(67).cs }}>67</span>/100 places you in Mostly Flowing.</>}
    text="Some parts of work feel clear and easy to move through. Others create delays or ask for more effort than they should." />
);
const FigmaStatus = () => classic(
  <StatusMeaningStory title="What Your Status is Telling You" status="Flourishing" text={[
    <>This is a moment to celebrate. You’re in a good place, operating at peak performance with a score of <b style={{ color: band(83).cs }}>83</b>/100.</>,
    "The foundations are already in place, and what lies ahead are small adjustments that will help you maintain balance and keep moving forward with confidence.",
  ]} />
);
const FigmaUnits = () => classic(
  <MeaningStory title="What Your Score is Telling You" tile={{ parts: [{ value: "26", unit: "yrs" }, { value: "3", unit: "mo" }], status: "Flourishing" }}
    headline={<>Your health actions make you <span style={{ color: band(86).cs }}>2 yrs 3 mo younger</span> than their your age.</>} />
);

const px = (v) => Math.round(parseFloat(v) * 100) / 100;
const css = (el) => getComputedStyle(el);
const q = (r, sel) => r.querySelector(sel);
const rect = (el) => el.getBoundingClientRect();
const size = (el) => `${Math.round(rect(el).width)} × ${Math.round(rect(el).height)}`;
const cardOf = (r) => q(r, '[data-story^="meaning"]');
const titleOf = (r) => q(cardOf(r), "p");
const row = (r) => q(r, '[data-part="row"]');
const headlineOf = (r) => q(r, '[data-part="headline"]');
const textOf = (r) => q(r, '[data-part="text"]');
const tileOf = (r) => q(r, '[data-part="tile"]');
const type14 = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight)} · ${css(el).fontWeight}`;
const light = (path) => DS_RAW.semantic[path]?.light.toLowerCase();
const common = (node, cardSize) => [
  { part: "Card size", node, figma: cardSize, read: (r) => size(cardOf(r)) },
  { part: "Card fill", node, figma: "#ffffff", read: (r) => lightHexOf(cardOf(r), ["background", "backgroundColor"]) },
  { part: "Card border", node, figma: "1 · #cecdcc", read: (r) => `${px(css(cardOf(r)).borderTopWidth)} · ${lightHexOf(cardOf(r), ["border", "borderTop", "borderColor"])}` },
  { part: "Card radius", node, figma: "18", read: (r) => px(css(cardOf(r)).borderTopLeftRadius) },
  { part: "Card padding", node, figma: "16", read: (r) => { const c = css(cardOf(r)); return [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft].map(px).every((n) => n === px(c.paddingTop)) ? px(c.paddingTop) : "uneven"; } },
  { part: "Title: size / line · weight", node, figma: "18/28 · 700", read: (r) => type14(titleOf(r)) },
  { part: "Title colour", node, figma: "#1d1a1b", read: (r) => lightHexOf(titleOf(r), ["color"], true) },
  { part: "Gap: title → row", node, figma: "16", read: (r) => px(rect(row(r)).top - rect(titleOf(r).parentElement.parentElement).bottom) },
  { part: "Gap: tile → text", node, figma: "16", read: (r) => { const t = tileOf(r) || q(r, '[data-part="value"]'); return px(rect(headlineOf(r).parentElement).left - rect(t).right); } },
];
const NUMBER_CHECKS = [
  ...common("13622:37199", "808 × 146"),
  { part: "Row height", node: "13622:37203", figma: "68", read: (r) => Math.round(rect(row(r)).height) },
  { part: "Value block width", node: "13622:37204", figma: "115", read: (r) => Math.round(rect(q(r, '[data-part="value"]')).width) },
  { part: "Number: size · weight · tracking", node: "13622:37206", figma: "64 · 700 · -1.28", read: (r) => { const n = q(r, '[data-part="number"]'); return `${px(css(n).fontSize)} · ${css(n).fontWeight} · ${px(css(n).letterSpacing)}`; } },
  { part: "Number colour", node: "13622:37206", figma: "#d98d0b", read: (r) => lightHexOf(q(r, '[data-part="number"]'), ["color"]) },
  { part: "Number height (cap height, trimmed)", node: "13622:37205", figma: "45", read: (r) => Math.round(rect(q(r, '[data-part="number"]')).height) },
  { part: "Unit: size · weight · colour", node: "13622:37209", figma: "11 · 400 · #504c4d", read: (r) => { const u = q(r, '[data-part="unit"]'); return `${px(css(u).fontSize)} · ${css(u).fontWeight} · ${lightHexOf(u, ["color"])}`; } },
  { part: "Headline: size / line · weight", node: "13622:37211", figma: "14/20 · 700", read: (r) => type14(headlineOf(r)) },
  { part: "Headline colour · number colour", node: "13622:37211", figma: "#504c4d · #d98d0b", read: (r) => `${lightHexOf(headlineOf(r), ["color"], true)} · ${lightHexOf([...headlineOf(r).querySelectorAll("span")].find((s) => s.style.color), ["color"])}` },
  { part: "Paragraph: size / line · weight", node: "13622:37212", figma: "14/20 · 400", read: (r) => type14(textOf(r)) },
  { part: "Paragraph colour", node: "13622:37212", figma: "#504c4d", read: (r) => lightHexOf(textOf(r), ["color"], true) },
  { part: "Gap: headline → paragraph", node: "13622:37210", figma: "8", read: (r) => px(rect(textOf(r)).top - rect(headlineOf(r)).bottom) },
];
const iconHex = (r) => { const c = q(tileOf(r), "svg circle, svg path"); const p = tokenForVar(c?.getAttribute("fill")); return p ? light(p) : "literal"; };
const STATUS_CHECKS = [
  ...common("13622:37225", "808 × 200"),
  { part: "Row height", node: "13622:37229", figma: "122", read: (r) => Math.round(rect(row(r)).height) },
  { part: "Tile: size", node: "13622:37230", figma: "115 × 122", read: (r) => size(tileOf(r)) },
  { part: "Tile: fill · radius", node: "13622:37230", figma: "#e1f5ea · 12", read: (r) => `${lightHexOf(tileOf(r), ["background"])} · ${px(css(tileOf(r)).borderTopLeftRadius)}` },
  { part: "Face icon: size · colour", node: "13622:37232", figma: "48 × 48 · #0e8c4f", read: (r) => { const s = q(tileOf(r), "svg"); return `${Math.round(rect(s).width)} × ${Math.round(rect(s).height)} · ${iconHex(r)}`; } },
  { part: "Headline: size / line · weight", node: "13622:37236", figma: "14/20 · 700", read: (r) => type14(headlineOf(r)) },
  { part: "Headline colour · status word", node: "13622:37236", figma: "#504c4d · #0b703f", read: (r) => `${lightHexOf(headlineOf(r), ["color"], true)} · ${lightHexOf(q(headlineOf(r), "span"), ["color"])}` },
  { part: "Paragraph: size / line · weight", node: "13622:37237", figma: "14/20 · 400", read: (r) => type14(textOf(r).firstElementChild) },
  { part: "Gap between the two paragraphs", node: "13622:37237", figma: "14", read: (r) => { const [a, b] = textOf(r).children; return px(rect(b).top - rect(a).bottom); } },
  { part: "Gap: headline → paragraphs", node: "13622:37235", figma: "8", read: (r) => px(rect(textOf(r)).top - rect(headlineOf(r)).bottom) },
];
const UNITS_CHECKS = [
  ...common("13622:37213", "808 × 172"),
  { part: "Row height", node: "13622:37217", figma: "94", read: (r) => Math.round(rect(row(r)).height) },
  { part: "Tile: size", node: "13622:37218", figma: "115 × 94", read: (r) => size(tileOf(r)) },
  { part: "Tile: fill · radius", node: "13622:37218", figma: "#e1f5ea · 12", read: (r) => `${lightHexOf(tileOf(r), ["background"])} · ${px(css(tileOf(r)).borderTopLeftRadius)}` },
  { part: "Number: size · weight · tracking", node: "13622:37220", figma: "36 · 700 · -0.72", read: (r) => { const n = q(r, '[data-part="number"]'); return `${px(css(n).fontSize)} · ${css(n).fontWeight} · ${px(css(n).letterSpacing)}`; } },
  { part: "Number colour", node: "13622:37220", figma: "#0b703f", read: (r) => lightHexOf(q(r, '[data-part="number"]'), ["color"]) },
  { part: "Unit: size · weight · colour", node: "13622:37220", figma: "11 · 400 · #1d1a1b", read: (r) => { const u = q(r, '[data-part="unit"]'); return `${px(css(u).fontSize)} · ${css(u).fontWeight} · ${lightHexOf(u, ["color"])}`; } },
  { part: "Gap between the two values", node: "13622:37219", figma: "4", read: (r) => { const [a, b] = tileOf(r).children; return px(rect(b).left - rect(a).right); } },
  { part: "Sentence: size / line · weight", node: "13622:37224", figma: "14/20 · 700", read: (r) => type14(headlineOf(r)) },
  { part: "Sentence colour · highlighted phrase", node: "13622:37224", figma: "#504c4d · #0b703f", read: (r) => `${lightHexOf(headlineOf(r), ["color"], true)} · ${lightHexOf(q(headlineOf(r), "span"), ["color"])}` },
];

/* ======================================================================================================== */
/* Developer view                                                                                           */
/* ======================================================================================================== */
const PARTS = [
  { id: "card", name: "Story card", note: "The surface every Story shares.", find: (r) => [r.querySelector("[data-story]")] },
  { id: "title", name: "Title", note: "“What Your Score Is Telling You”. Text lg / Bold.", find: (r) => [r.querySelector("h3") || r.querySelector("p")] },
  { id: "controls", name: "Compare control", note: "Switch and round picker. Only when `values` (earlier rounds) are passed.", find: (r) => [...r.querySelectorAll("label")] },
  { id: "value", name: "Value block", note: "At least 115px wide, content centred.", find: (r) => [r.querySelector('[data-part="value"]')] },
  { id: "number", name: "Score number", note: "Display 1.5xl-Trim / Bold (64px), coloured by band.", find: (r) => [r.querySelector('[data-part="number"]')] },
  { id: "unit", name: "Unit", note: "Text 3xs-Trim (11px), sits on the number's baseline.", find: (r) => [r.querySelector('[data-part="unit"]')] },
  { id: "headline", name: "Headline", note: "One bold sentence naming the score and its status. The number inside is coloured.", find: (r) => [r.querySelector('[data-part="headline"]')] },
  { id: "text", name: "Meaning text", note: "One fixed paragraph per band.", find: (r) => [r.querySelector('[data-part="text"]')] },
];

function Playground({ style }) {
  const [form, setForm] = useState("number");
  const [v, setV] = useState(61);
  const [subject, setSubject] = useState("Sleep");
  const [report, setReport] = useState(false);
  const [compare, setCompare] = useState(true);
  const status = statusName(v);
  const label = { ...dsText("Text xs", 600), color: ds.text.primary };
  const rowS = { display: "flex", alignItems: "center", gap: dsSpace[8] };
  const forms = [["number", "Number"], ["ring", "Ring"], ["status", "Status only"], ["units", "Value with units"]];
  const node = form === "status" ? <StatusOnly v={v} /> : form === "units" ? <Units /> : <Score v={v} ring={form === "ring"} report={report} subject={subject || "Sleep"} compare={compare} />;
  const code = form === "status"
    ? `<StatusMeaningStory
  title="What Your Status Is Telling You"
  status="${status}"
  text={["${(report ? ORG_MEANING : MEANING)[status]} Your organisation's score is ${v}/100."]}
/>`
    : form === "units"
      ? `<MeaningStory
  title="What Your Score Is Telling You"
  tile={{ parts: [{ value: "2", unit: "yrs" }, { value: "3", unit: "mo" }], status: "Flourishing" }}
  headline={<>Your health actions make you <span style={{ color: band(86).cs }}>2 yrs 3 mo younger</span> than your age.</>}
/>`
      : `<MeaningStory${form === "ring" ? "\n  ring" : ""}
  title="${report ? "What Your Score Is Telling You" : "What This Score Is Telling You"}"
  value={${v}}${form === "ring" ? "" : '\n  unit="/100"'}${compare ? "\n  values={[54, 57, " + v + "]}   // earlier rounds, oldest first" : ""}
  headline={<>${report ? `Your score of <span style={{ color: band(${v}).cs }}>${v}</span>/100 places you in ${status}.` : `${subject || "Sleep"} scores <span style={{ color: band(${v}).cs }}>${v}</span>/100, which is ${status}.`}</>}
  text="${(report ? ORG_MEANING : MEANING)[status]}"
/>`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)", gap: dsSpace[24], alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], background: ds.surface.general.cardWithinCard, border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.card, padding: dsSpace[16] }}>
        <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={label}>Form</span>
          <select className="field-soft" value={form} onChange={(e) => setForm(e.target.value)} style={{ ...dsText("Text sm"), padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, background: ds.bg.primary, color: ds.text.primary, fontFamily: "inherit" }}>{forms.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
        </label>
        {form !== "units" && <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={label}>Score: {v} <span style={{ color: ds.text.tertiary, fontWeight: 400 }}>({status})</span></span><input type="range" min={0} max={100} value={v} onChange={(e) => setV(+e.target.value)} /></label>}
        {(form === "number" || form === "ring") && !report && <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={label}>Subject</span><input className="field-soft" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...dsText("Text sm"), padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, background: ds.bg.primary, color: ds.text.primary, fontFamily: "inherit" }} /></label>}
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], ...dsText("Text xs"), color: ds.text.secondary }}>
          {form !== "units" && form !== "status" && <label style={rowS}><input type="checkbox" checked={report} onChange={(e) => setReport(e.target.checked)} />Use the report's wording</label>}
          {(form === "number" || form === "ring") && <label style={rowS}><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />Offer "Compare previous rounds"</label>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], minWidth: 0 }}>
        <StoryStage style={style} kind={meta.kind} width={808}>{node}</StoryStage>
        <CodeBlock label="What you'd write" code={code} />
      </div>
    </div>
  );
}

function DeveloperView({ style }) {
  const at = (w, node) => <StoryStyleContext.Provider value={style}><div style={{ width: w, flexShrink: 0 }}>{node}</div></StoryStyleContext.Provider>;
  return (
    <>
      <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
        <Prose>
          <p><b>Purpose:</b> explains what the selected score, status, or result means for the reader.</p>
          <p><b>Can contain:</b> the current value, its score band or status, and a plain-language interpretation.</p>
          <p><b>Boundary:</b> it explains the current result. It doesn't explain how the result was calculated (<i>Methodology</i>), what contributed to it (<i>Breakdown</i>), or what action to take (<i>Actions</i>).</p>
          <p><b>Where it appears:</b> the Org Score, Score History, Explorer, and Org Status Scopes, the eNPS and Time Impact Scopes, and the Widget Builder (any subject). Suggested by default in the builder, second after the Insight Summary.</p>
        </Prose>
      </Section>

      <Section id="forms" title="The four forms" lead="One Story, four shapes. Pick by what the result is.">
        <SimpleTable head={["Form", "Use it when", "Lead", "Text"]} widths={["16%", "34%", "24%", "26%"]} rows={[
          ["Number", "The result is a score from 0 to 100, or another measure.", "The number at 64px with its unit", "A bold headline and one paragraph"],
          ["Ring", "An Explorer's Scope, where the score is part of a family of rings.", "A ring that fills to the score", "A bold headline and one paragraph"],
          ["Status only", "The result is a band, not a number (Org Status).", "A tinted tile with the status face", "A bold “You're {Status}.” and one or two paragraphs"],
          ["Value with units", "The result is a value in more than one unit, such as “2 yrs 3 mo”.", "A tinted tile with the value and units", "One bold sentence, no paragraph"],
        ]} />
        <Prose><p>A measure with no status band (eNPS, hours per year) uses the Number form with <code>bandColor=false</code>: the number is neutral and nothing is coloured.</p></Prose>
      </Section>

      <Section id="playground" title="Try it" lead="Pick a form, change the score, and the component updates. The code underneath is what you'd write for the same result.">
        <Playground style={style} />
      </Section>

      <Section id="anatomy" title="Anatomy" lead="The numbered parts are drawn on the live Number form. The table is measured in your browser, with the design-system token behind each colour, and warns about anything off the type, spacing, or radius scales.">
        <Anatomy parts={PARTS} style={style} kind={meta.kind} width={808}><Score v={61} report /></Anatomy>
      </Section>

      <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark); never hard-code the hex.">
        <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[
          ["Card", "Size and shape", "Up to 808px wide. 18px radius, 16px padding, 16px between parts, 1px border."],
          ["", "Fill and border", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap" }}>{T("surface/General/card")}{T("border/secondary")}</span>],
          ["Title", "Type and colour", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text lg / Bold, 18/28 {T("text/primary")}</span>],
          ["Row", "Layout", "Lead and text side by side, centred vertically, 16px apart. Wraps below about 360px."],
          ["Number form", "Value block", "At least 115px wide, content centred, 8px side padding. Grows for long values."],
          ["", "Number", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Display 1.5xl-Trim / Bold, 64px, -2% tracking, cap-height trimmed. Coloured by band: {T("status/success/text-indicator")}{T("status/warning/text-indicator")}{T("status/error/text-indicator")}</span>],
          ["", "Unit", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text 3xs-Trim / Regular, 11px, on the number's baseline, no gap. {T("text/secondary")}</span>],
          ["Ring form", "Ring", "72px by default, 7px stroke. Track is color/interactive/ghost-hover; the arc is the band's graph colour; the number is inside."],
          ["Status form", "Tile", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>At least 115px wide, as tall as the text, 12px radius (radius/lg). Fill is the band's bg: {T("status/success/bg")}{T("status/warning/bg")}{T("status/error/bg")}</span>],
          ["", "Face icon", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>48px, centred, decorative. Colour: {T("status/success/icon")}{T("status/warning/icon")}{T("status/error/icon")}</span>],
          ["Units form", "Tile", "At least 115px wide and 94px tall, 12px radius, the band's bg. Each value is a number and its unit, 4px apart, centred."],
          ["", "Value and unit", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Value: Display md / Bold, 36px, in the band's text colour. Unit: Text 3xs-Trim, 11px, {T("text/primary")}</span>],
          ["Text (all forms)", "Headline", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text sm / Bold, 14/20 {T("text/secondary")}. The number or status word inside takes the band's text colour.</span>],
          ["", "Paragraph", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text sm / Regular, 14/20 {T("text/secondary")}. 8px below the headline. Several paragraphs sit 14px apart.</span>],
          ["Compare line", "When the switch is on", "Text xs, below the row: “Round 2: 54 → now 61 · Up 7 since Round 2”."],
          ["Whole Story", "Interaction", "Only the Compare control. Nothing else is interactive or animated."],
          ["", "Refined style", "Own card. 80px number, a 0 to 100 track showing where the score sits against the 60 and 80 lines, and a bigger headline."],
        ]} />
      </Section>

      <Section id="states" title="States & variants" lead={`Everything that changes with the score is driven by its band: ${FLOURISHING_AT} and above is Flourishing, ${STRIVING_AT} to ${FLOURISHING_AT - 1} is Striving, under ${STRIVING_AT} is Struggling. Sample values, so the page stays still.`}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 28 }}>
          {Object.keys(SAMPLE).map((st) => <Variant key={st} title={`Number, score ${SAMPLE[st]}`} status={st}><StoryStage style={style} kind={meta.kind} width={560}><Score v={SAMPLE[st]} report /></StoryStage></Variant>)}
          {Object.keys(SAMPLE).map((st) => <Variant key={`s${st}`} title={`Status only, ${st}`} status={st}><StoryStage style={style} kind={meta.kind} width={560}><StatusOnly v={SAMPLE[st]} /></StoryStage></Variant>)}
          <Variant title="Ring" note="The Explorer Scope's form. The ring track is neutral and the arc takes the band colour." wide>
            <StoryStage style={style} kind={meta.kind} width={808}>
              <div style={{ display: "flex", gap: dsSpace[24], flexWrap: "wrap" }}>{Object.values(SAMPLE).map((v) => <ScoreRing key={v} value={v} size={72} stroke={7} />)}</div>
            </StoryStage>
          </Variant>
          <Variant title="Value with units" note="Sample: Health Age, which the dataset can't produce yet (no ages)."><StoryStage style={style} kind={meta.kind} width={560}><Units /></StoryStage></Variant>
          <Variant title="No band (eNPS)" note="For a measure with no Flourishing, Striving, or Struggling. The number is neutral.">
            <StoryStage style={style} kind={meta.kind} width={560}><MeaningStory title="What Your eNPS Is Telling You" value={-38} unit="eNPS" bandColor={false} values={[-30, -34, -38]} headline="Your eNPS is -38." text="More people would hold back from recommending the organisation than would recommend it." /></StoryStage>
          </Variant>
          <Variant title="With the Compare switch on" note="The switch is the Story's only interaction. Try it." wide>
            <StoryStage style={style} kind={meta.kind} width={808}><Score v={61} report /></StoryStage>
          </Variant>
          <Variant title="Threshold scale (Refined only)" note="ThresholdScale({ value }). 0 to 100 track in the three status tints, ticks at 60 and 80, marker at the score. Max width 440px." wide>
            <StoryStage style="refined" width={560}><ThresholdScale value={SAMPLE.Striving} /></StoryStage>
          </Variant>
        </div>
      </Section>

      <Section id="edges" title="Sizes & edge cases" lead="How it behaves when the space or the content isn't ideal. The text wraps; nothing is cut off.">
        <div style={{ display: "flex", gap: dsSpace[24], overflowX: "auto", alignItems: "flex-start", paddingBottom: dsSpace[8] }}>
          {[320, 480, 808].map((w) => <div key={w} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}><span style={{ ...dsText("Text 2xs", 600), color: ds.text.tertiary }}>{w}px</span>{at(w, <Score v={61} report />)}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 28 }}>
          <Variant title="100" note="Three digits. The value block grows past 115px; the row doesn't break."><StoryStage style={style} kind={meta.kind} width={560}><Score v={100} compare={false} /></StoryStage></Variant>
          <Variant title="0" note="A valid score. It's Struggling, so it takes the Struggling colour."><StoryStage style={style} kind={meta.kind} width={560}><Score v={0} compare={false} /></StoryStage></Variant>
          <Variant title="Long subject" note="The headline wraps. The number stays centred beside it."><StoryStage style={style} kind={meta.kind} width={560}><Score v={52} subject="Policies and practices communication quality" compare={false} /></StoryStage></Variant>
          <Variant title="Boundary scores" note={`${STRIVING_AT - 1} is Struggling and ${STRIVING_AT} is Striving; ${FLOURISHING_AT - 1} is Striving and ${FLOURISHING_AT} is Flourishing.`}>
            <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>{[STRIVING_AT - 1, STRIVING_AT, FLOURISHING_AT - 1, FLOURISHING_AT].map((v) => <StoryStage key={v} style={style} kind={meta.kind} width={560} pad={8}><Score v={v} compare={false} /></StoryStage>)}</div>
          </Variant>
        </div>
        <Prose>
          <p><b>No earlier round.</b> Don't pass <code>values</code>. The Compare control then doesn't appear. <b>Status only with one paragraph.</b> Pass a single-item array. <b>Units tile with a long sentence.</b> The tile stays 115px wide and at least 94px tall; the sentence wraps beside it.</p>
          <p><b>Loading and empty.</b> The Story receives finished text, so it has no loading or empty state. If the score isn't ready, don't render it.</p>
        </Prose>
      </Section>

      <Section id="content" title="Content & voice" lead="Written to the SHAPE Voice and Language Guide (docs/shape-voice-and-language-guide.md).">
        <SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={[
          ["Titles are headings", "“What Your Score Is Telling You”, “What Your Status Is Telling You”, “What Your eNPS Is Telling You”. Title case (the verb “Is” is capitalised), under 7 words, no full stop. The builder says “What This Score Is Telling You” because it isn't addressed to a reader."],
          ["Headline is one sentence", "States the score and its band, and ends with a full stop: “Your score of 67/100 places you in Striving.” In the builder: “Sleep scores 61/100, which is Striving.”"],
          ["One fixed paragraph per band", "Plain words about what the band means. Short sentences, no jargon, no em dashes."],
          ["Status only", "A bold “You're Flourishing.” (the status word is coloured), then the paragraph with the score in bold and coloured: “Your organisation's score is 57/100.”"],
          ["Contractions", "“You're”, “don't”, “there's”."],
          ["Words to avoid", "fostering, cultivate, unleash, driving, embrace, embark, unlock, tailored, thriving, and “one ___ at a time”."],
          ["Names", "SHAPE in capitals. Explorers capitalised. Well-being with a hyphen. UK English."],
        ]} />
        <SpecTable head={["Band", "Report wording (Org Score)", "Builder wording (any subject)"]} widths={["16%", "42%", "42%"]} rows={Object.keys(SAMPLE).map((st) => [st, ORG_MEANING[st], MEANING[st]])} />
        <SpecTable head={["Don't", "Do"]} widths={["50%", "50%"]} rows={[
          ["Your score of 67/100 places you in Striving — mixed.", "Your score of 67/100 places you in Striving."],
          ["This is mixed — it works well for some people.", "This is mixed. It works well for some people."],
          ["You are thriving and driving success!", "You're Flourishing."],
          ["There is room to improve.", "There's room to improve."],
        ]} />
        <Prose><p><b>Compare line.</b> “Round 2: <b>54</b> → now <b>61</b> · Up 7 since Round 2”. The change comes from <FileBadge>sinceText()</FileBadge>: “Up n”, “Down n”, or “No change since Round n”.</p></Prose>
      </Section>

      <Section id="a11y" title="Accessibility" lead="What the component does today, and what to keep doing.">
        <Prose>
          <p><b>Reading order.</b> Title, headline, paragraph. The Compare switch is a real <code>role="switch"</code> button with a label, so it works with a keyboard and a screen reader. The round picker is a labelled select.</p>
          <p><b>Colour is never the only signal.</b> The band is always named in words (“places you in Striving”, “You're Flourishing.”), so the colour only reinforces it.</p>
          <p><b>The ring</b> is a picture, so it has <code>role="img"</code> and a label (“61 out of 100, Striving”). <b>The status face</b> is decorative and hidden from screen readers, because the headline says the same thing in words.</p>
          <p><b>Headings.</b> Current renders the title in a <code>&lt;p&gt;</code>; Refined renders an <code>&lt;h3&gt;</code>. If the page needs a heading outline, use an <code>&lt;h3&gt;</code> in both.</p>
          <p><b>Contrast of the number colours</b> on the card (WCAG 2.x asks for 4.5:1 for text this size, and the 64px number counts as large text at 3:1):</p>
        </Prose>
        <ContrastTable rows={[
          ["color/status/success/text-indicator", "Used", "Flourishing"], ["color/status/warning/text-indicator", "Used", "Striving"], ["color/status/error/text-indicator", "Used", "Struggling"],
          ["color/status/warning/text-strong", "Alternative", "Strong amber"], ["color/status/success/text-strong", "Alternative", "Strong green"],
        ]} />
        <Callout tone="warn" title="Known gap">The Striving number is below 4.5:1 on a white card at 14px, where it appears inside the headline. The 64px number passes the 3:1 rule for large text. The darker <code>warning/text-strong</code> would fix the headline.</Callout>
      </Section>

      <DataNeeds id="score-meaning" />
      <Section id="props" title="Props & usage">
        <PropsTable rows={[
          { name: "title", type: "string", required: true, desc: "The Story title, in title case (“What Your Score Is Telling You”)." },
          { name: "headline", type: "ReactNode", required: true, desc: "The bold sentence. Colour the number inside with band(v).cs." },
          { name: "text", type: "string", desc: "The paragraph for the band. Leave it out for the units form." },
          { name: "value", type: "number", desc: "The score. Decides the band, colour, and ring. Not needed for the units form." },
          { name: "unit", type: "string", def: "none", desc: "Shown after the number on its baseline: “/100”, “eNPS”, “hrs / year”." },
          { name: "bandColor", type: "boolean", def: "true", desc: "false for a measure with no status band. The number is neutral and nothing is coloured." },
          { name: "ring", type: "boolean", def: "false", desc: "Draw a ring instead of the number (the Explorer Scope)." },
          { name: "tile", type: "{ parts: [{ value, unit }], status }", def: "none", desc: "The units form. A tinted tile holding the values, tinted by `status`." },
          { name: "values", type: "number[]", def: "none", desc: "The score in each round, oldest first, ending with the current one. Turns on the Compare control." },
        ]} />
        <PropsTable rows={[
          { name: "StatusMeaningStory.status", type: "\"Flourishing\" | \"Striving\" | \"Struggling\"", required: true, desc: "Sets the tile tint, the face, and the colour of the status word." },
          { name: "StatusMeaningStory.text", type: "ReactNode | ReactNode[]", required: true, desc: "One paragraph, or an array of paragraphs 14px apart." },
          { name: "StatusMeaningStory.title", type: "string", required: true, desc: "“What Your Status Is Telling You”." },
        ]} />
        <CodeBlock label="Usage" code={`import { MeaningStory, StatusMeaningStory } from "./SummaryStories.jsx";
import { band } from "../../../lib/tokens.js";

<MeaningStory
  title="What Your Score Is Telling You"
  value={61}
  unit="/100"
  values={[54, 57, 61]}
  headline={<>Your score of <span style={{ color: band(61).cs }}>61</span>/100 places you in Striving.</>}
  text="Some parts of work feel clear and easy to move through. Others create delays or ask for more effort than they should."
/>

<StatusMeaningStory
  title="What Your Status Is Telling You"
  status="Striving"
  text={["Some parts of work feel clear and easy to move through. Others create delays or ask for more effort than they should."]}
/>`} />
        <Prose><p><b>Data.</b> The Story reads no data itself. Pass finished numbers and text. <b>Layout.</b> The parent decides the width. <b>Used by</b> <FileBadge>scope/scopeRecipes.jsx</FileBadge> and <FileBadge>widgetbuilder/storyCatalog.jsx</FileBadge>.</p></Prose>
      </Section>

      <Section id="done" title="Done checklist" lead="You're done when every line is true.">
        <List items={[
          "The card matches the Insight Summary card: white, 1px border, 18px radius, 16px padding, 16px between parts.",
          "The title is 18px bold with a 28px line height, in title case.",
          "Number form: a 64px bold number in the band's colour, with a 11px unit on its baseline, in a block at least 115px wide.",
          "The headline is bold 14px and the paragraph regular 14px, 8px apart, both in the secondary text colour.",
          "The Number form card is 146px tall at 808px wide with a one-line headline and a two-line paragraph.",
          "Status form: a tinted tile with the 48px face, a bold “You're {Status}.” with the status word coloured, and paragraphs 14px apart.",
          "Units form: a tinted tile at least 94px tall, with 36px values and 11px units, and one bold sentence.",
          "The Compare control appears only when earlier rounds are passed, and the compare line appears only when it's on.",
          "Every colour is a design-system token and follows Light and Dark. The band comes from lib/bands.js (60 and 80).",
          "It's correct at 320px, 480px, and 808px wide, with a score of 0, 59, 60, 79, 80, and 100, and with no band (eNPS).",
          "Copy follows the voice guide: title case titles, contractions, no em dashes.",
        ]} />
      </Section>

      <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
        <Prose><p><b>Matches the design.</b> The three frames in Figma node 13622:37198, drawn with the real component at the design's width (808px) and measured in your browser. Each row is a value read from the Figma node next to what the component has. Shown in Current, whichever Style is selected.</p><p><b>1. Number</b> (node 13622:37199)</p></Prose>
        <FigmaParity checks={NUMBER_CHECKS}><FigmaNumber /></FigmaParity>
        <Prose><p><b>2. Status only</b> (node 13622:37225)</p></Prose>
        <FigmaParity checks={STATUS_CHECKS}><FigmaStatus /></FigmaParity>
        <Prose><p><b>3. Value with units</b> (node 13622:37213)</p></Prose>
        <FigmaParity checks={UNITS_CHECKS}><FigmaUnits /></FigmaParity>
        <Prose>
          <p><b>What changed to match the design.</b> The Number form's row was 16px taller than the design (a fixed 84px value block); it now sizes to its content with the cap-height trim, so the card is 146px. The unit sits on the number's baseline with no gap. The Status form had no tile or face at all and a 28px label; it now has the tinted tile, the 48px face, and a bold 14px “You're Flourishing.”. The Value with units form is new (the product had no way to draw it).</p>
          <p><b>Where Figma and the v4 design-system file disagree.</b> Figma binds the number colours to <code>status/*/text-strong</code> (#0B703F, #D98D0B). In the markdown those values are <code>text-indicator</code> (its <code>text-strong</code> is darker). Used: <code>text-indicator</code>. The card radius is Figma's 18 (<code>radius-card</code>), the markdown's <code>radius/widget</code>. The tile radius is <code>radius/lg</code> (12) in both.</p>
          <p><b>Things in the design that look like slips.</b> (1) The units frame says “26 yrs 3 mo” in the tile but “2 yrs 3 mo younger” in the sentence. (2) The sentence reads “than their your age”. (3) The Number and Units frames set the title in black (#000); the Status frame uses the primary text colour. The component uses the primary text colour for all three. (4) The Status frame's headline is 682px wide in a 643px column. Built as drawn, with the 643px column.</p>
          <p><b>Voice-guide calls.</b> (1) The design writes the titles “What Your Score is Telling You”. The guide's title case capitalises verbs, so the component says “Is”, as the Methodology titles already did. (2) The design's Flourishing paragraph (“This is a moment to celebrate… maintain balance and keep moving forward with confidence.”) is long and uses stock phrases the guide discourages. The product's own shorter wording is used in the product; the design's is only used in the parity sample above. (3) The design only gives copy for Flourishing. The Striving and Struggling status-only copy is the product's own.</p>
          <p><b>Design questions.</b> Mostly Flowing is the design's name for Striving. “You're Flourishing.” speaks to the reader, but on the Org Status it describes the organisation. Confirm that's intended.</p>
        </Prose>
      </Section>
    </>
  );
}

/* ======================================================================================================== */
/* Researcher view                                                                                          */
/* ======================================================================================================== */
function ResearcherView({ style }) {
  const rows = dimensionRankedRows();
  const org = Math.round(LATEST.avgOverall);
  const weakest = rows[rows.length - 1][0];
  const wSub = dimensionSubject(weakest);
  const wv = wSub.series[LAST];
  const series = overallSeries();
  const enps = LATEST.eNPS;
  return (
    <>
      <Section id="story" title="The data story" lead="A number alone doesn't tell a reader whether to be pleased or worried. This Story does.">
        <Prose>
          <p>The Score Meaning takes the current result, puts it in one of three bands, and says in plain words what that band means for the reader. It restates the value so the reader doesn't have to look elsewhere, names the band, and gives one fixed paragraph of interpretation.</p>
          <p>It explains <b>this result</b>. It doesn't explain how the result was calculated, what contributed to it, or what to do about it. Those belong to the Stories around it.</p>
        </Prose>
        <Callout title="The idea in one line">A score is a fact. The meaning is the first sentence of interpretation, and it's the same wording for every result in the same band.</Callout>
      </Section>

      <Section id="glance" title="At a glance">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Question it answers" value="What does this result mean for me?" />
          <Fact label="The measure" value="A score from 0 to 100" note="Or another measure, such as eNPS (-100 to +100) or hours a year, with no band." />
          <Fact label="The bands" value={`${FLOURISHING_AT}+ · ${STRIVING_AT} to ${FLOURISHING_AT - 1} · under ${STRIVING_AT}`} note="Flourishing, Striving, and Struggling." />
          <Fact label="Wording" value="Three fixed paragraphs" note="One per band. Written by people, not generated." />
          <Fact label="Time reference" value="The latest round" note={`Optionally set against an earlier round (${ROUNDS.length} rounds exist).`} />
          <Fact label="People behind it" value={`${EMPLOYEE_COUNT} respondents`} note="Synthetic data in this prototype." />
        </div>
      </Section>

      <Section id="shows" title="What it can show" lead="The current value, its band, and a plain-language interpretation. Nothing else.">
        <SimpleTable head={["Evidence", "What the reader learns", "Where it comes from"]} widths={["24%", "42%", "34%"]} rows={[
          ["The current value", "The number, large, with its unit.", "The latest round's average."],
          ["The band", "Whether the result is Flourishing, Striving, or Struggling, in words and colour.", `The score, banded at ${STRIVING_AT} and ${FLOURISHING_AT}.`],
          ["An interpretation", "What that band means, in one short paragraph.", "A fixed paragraph for the band."],
          ["A comparison (optional)", "What the score was in an earlier round of the reader's choosing, and the change in points.", "The stored score for that round. A switch on the Story turns it on."],
        ]} />
      </Section>

      <Section id="made" title="How the words are chosen" lead="Every word is chosen by a rule from the score, so the sentence can't claim more than the data says.">
        <SimpleTable head={["Step", "What happens", "Rule"]} widths={["22%", "48%", "30%"]} rows={[
          ["1. The score", "The latest round's average for the subject.", "Mean, 0 to 100"],
          ["2. The band", "The score is placed in a band.", `${FLOURISHING_AT} or more: Flourishing. ${STRIVING_AT} or more: Striving. Otherwise Struggling.`],
          ["3. The colour", "The number takes the band's colour.", "Green, amber, or red"],
          ["4. The headline", "A sentence names the score and the band.", "“Your score of 61/100 places you in Striving.”"],
          ["5. The paragraph", "The fixed paragraph for the band is shown.", "One per band"],
          ["6. The comparison", "If switched on, the earlier round's score and the change are added.", "Later minus earlier, in points"],
        ]} />
      </Section>

      <Section id="forms" title="The forms" lead="One Story, four shapes, chosen by what kind of result it is.">
        <SimpleTable head={["Form", "Used for", "Example in the product"]} widths={["20%", "40%", "40%"]} rows={[
          ["Number", "A score on the 0 to 100 scale, or a measure with no band.", "Org Score, Score History, eNPS, Time Impact, the Widget Builder"],
          ["Ring", "A score inside a family of rings.", "An Explorer's Scope"],
          ["Status only", "A result that is a band, not a number.", "The Org Status Scope"],
          ["Value with units", "A result in several units, such as “2 yrs 3 mo”.", "Health Age. Not buildable yet: the dataset has no ages."],
        ]} />
      </Section>

      <Section id="live" title="Live from the data" lead="Four real examples, built from the dataset right now.">
        <Variant title="Organisation, number form" note="The Org Score Scope."><StoryStage style={style} kind={meta.kind} width={808}><Score v={org} report /></StoryStage></Variant>
        <Variant title="Organisation, status only" note="The Org Status Scope."><StoryStage style={style} kind={meta.kind} width={808}><StatusOnly v={org} /></StoryStage></Variant>
        <Variant title={`One Explorer, ring form: ${weakest}`} note="The weakest Explorer, as an Explorer Scope shows it."><StoryStage style={style} kind={meta.kind} width={808}><Score v={wv} ring subject={weakest} /></StoryStage></Variant>
        <Variant title="eNPS, no band" note="A measure on a different scale. No colour, no status."><StoryStage style={style} kind={meta.kind} width={808}><MeaningStory title="What Your eNPS Is Telling You" value={enps} unit="eNPS" bandColor={false} values={enpsSeries()} headline={`Your eNPS is ${enps > 0 ? "+" : ""}${enps}.`} text={enps < 0 ? "More people would hold back from recommending the organisation than would recommend it." : "More people would recommend the organisation than would hold back."} /></StoryStage></Variant>
        <SimpleTable head={["In the Story", "Data behind it"]} widths={["30%", "70%"]} rows={[
          ["Organisation score", `${org}, the latest round's average overall score (${series.join(", ")} across ${ROUNDS.length} rounds).`],
          ["The band", `${statusName(org)}, because ${org} is ${org >= FLOURISHING_AT ? `${FLOURISHING_AT} or more` : org >= STRIVING_AT ? `${STRIVING_AT} to ${FLOURISHING_AT - 1}` : `under ${STRIVING_AT}`}.`],
          ["Compare control", `Offers ${roundName(0)} to ${roundName(LAST - 1)}. Picking one shows that round's score and the change since.`],
          ["The paragraph", "Chosen by the band alone. It isn't checked against this organisation's data."],
        ]} />
      </Section>

      <Section id="limits" title="Constraints" lead="What a reader, or a researcher quoting this, should keep in mind. Each is a real property of how the Story works today.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="It restates one number." use="For how it was worked out, see Methodology. For what's behind it, Breakdown. For what to do, Actions.">The Story interprets the current result and stops. It makes no claim about why the score is what it is.</Limit>
          <Limit n="2" title="The paragraph is chosen by the band, not by the data.">Everyone in a band gets the same words. “Several parts of your organisation are under strain” appears for any Struggling score, whether or not several parts really are. The wording is a description of what the band usually means, not a finding.</Limit>
          <Limit n="3" title="The bands are fixed cut-offs.">An {FLOURISHING_AT - 1} reads as Striving and an {FLOURISHING_AT} as Flourishing, although they're practically the same result. A score of {FLOURISHING_AT} and a score of 100 read identically.</Limit>
          <Limit n="4" title="The comparison is two points, not a trend." use="For movement over time, see Score History.">“Round 2: 54 → now 61” compares two rounds. There are only {ROUNDS.length}, and no confidence interval or significance test is computed, so a small change shouldn't be read as real movement.</Limit>
          <Limit n="5" title="An average hides how people differ.">The score is an average. A score of 61 could be everyone at 61, or two camps at 30 and 90. The “How Scores Are Spread” Story shows the spread.</Limit>
          <Limit n="6" title="Some measures have no band.">eNPS runs from -100 to +100 and hours a year isn't a score at all. These use the neutral form with no colour and no status, so they carry less interpretation.</Limit>
          <Limit n="7" title="“You're Flourishing.” speaks to the reader.">On the Org Status it describes the organisation. The wording treats the organisation and the reader as the same “you”.</Limit>
          <Limit n="8" title="The prototype's data is synthetic.">{EMPLOYEE_COUNT} generated respondents × {ROUNDS.length} rounds. This page shows how the Story behaves. It isn't a finding about a real organisation.</Limit>
        </div>
      </Section>

      <Section id="questions" title="What it answers, and what it does not">
        <Two>
          <div style={card_}>
            <span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>It answers</span>
            <List items={["What is the result, in a number?", "Which band is it in?", "What does that band mean, in plain words?", "What was it in an earlier round, if the reader wants to see?"]} />
          </div>
          <div style={card_}>
            <span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>It does not answer</span>
            <List items={["How was the score worked out? (Methodology)", "What is behind it? (Breakdown, Diagnostic)", "Who is affected? (Composition)", "Is the change real or noise? (Not computed anywhere yet.)", "What should we do? (Actions)"]} />
          </div>
        </Two>
      </Section>

      <Section id="neighbours" title="Next to the other Stories" lead="Each Story answers one question. The Meaning comes right after the Insight Summary.">
        <SimpleTable head={["Story", "The question it answers", "Relationship to Score Meaning"]} widths={["22%", "34%", "44%"]} rows={[
          ["Insight Summary", "How is it doing?", "The Summary says where things stand in a line. The Meaning explains the result."],
          ["Score Meaning", "What does this result mean for me?", "n/a"],
          ["Breakdown", "What is it made of?", "The Meaning never explains what contributed to the result."],
          ["Methodology", "How was it worked out?", "Never interprets the reader's own score. The Meaning always does."],
          ["Actions", "What can I do about it?", "The Meaning never recommends an action."],
        ]} />
      </Section>

      <Section id="open" title="Open questions" lead="Decisions this page can't make for you. Each changes what the Story says or how far it can be trusted.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="A" title="Should the paragraph be checked against the data?">Today “Most parts of work feel supportive” appears for any Flourishing score. A version that checks the parts (for example, how many Explorers are in each band) before making a claim would be more honest, at the cost of more rules.</Limit>
          <Limit n="B" title="Who is “you”?">On the Org Status the Story says “You're Flourishing.” about the organisation. Is the reader the organisation, or a person looking at it?</Limit>
          <Limit n="C" title="Copy for the other bands of the status form">Only the Flourishing copy exists in the design. The Striving and Struggling status-only paragraphs are the product's own short lines.</Limit>
          <Limit n="D" title="Value with units needs data">Health Age can't be built until the dataset has ages. Until then the form is documented and runs on sample values only.</Limit>
          <Limit n="E" title="Should a score of 100 read differently from 80?">Both are Flourishing with the same paragraph. A top band could say more.</Limit>
        </div>
      </Section>
    </>
  );
}

export default function ScoreMeaningDoc({ style, view = "developer" }) {
  return view === "researcher" ? <ResearcherView style={style} /> : <DeveloperView style={style} />;
}
