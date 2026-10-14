import { useState } from "react";
import { ds, dsText, dsSpace, dsRadius, dsBorder, dsVar, DS_RAW } from "../../../lib/ds.js";
import { sinceText, statusOf, roundName, LAST, ALL_AXES } from "../../../lib/scopeData.js";
import { ROUNDS, EMPLOYEE_COUNT, DIMENSIONS, DRIVERS, dimensionRankedRows } from "../../../lib/dataset.js";
import { dimensionSubject } from "../../../lib/scopeSubject.js";
import { InsightSummaryStory, SummaryP, Strong, BandBar, STATUS_TEXT, statusText } from "../../scope/stories/SummaryStories.jsx";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import { ExplorerSummary, GapSummary, HEADLINE } from "../../scope/scopeRecipes.jsx";
import { SUMMARY_HEADLINE, STORIES } from "../../widgetbuilder/storyCatalog.jsx";
import { ContrastTable, SpecTable, SimpleTable, T, Fact, Limit, Two, List, card_ } from "../docParts.jsx";
import { Section, Prose, Callout, Variant, Anatomy, StoryStage, PropsTable, CodeBlock, FileBadge, FigmaParity, Swatch, lightHexOf, StatusPill } from "../docKit.jsx";
import { FLOURISHING_AT, STRIVING_AT, RANGES, statusName } from "../../../lib/bands.js";

export const meta = {
  id: "insight-summary", name: "Insight Summary", group: "Stories", kind: "Insight Summary",
  blurb: "A short, plain-language overview of the insight. The first thing a reader sees in a Scope.",
  source: "components/scope/stories/SummaryStories.jsx · InsightSummaryStory", figma: "13622:39509",
  views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }],
};
export const toc = {
  developer: [
    { id: "overview", label: "Overview" }, { id: "playground", label: "Try it" }, { id: "anatomy", label: "Anatomy" }, { id: "spec", label: "Specification" },
    { id: "states", label: "States & variants" }, { id: "edges", label: "Sizes & edge cases" }, { id: "content", label: "Content & voice" }, { id: "a11y", label: "Accessibility" },
    { id: "props", label: "Props & usage" }, { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
  ],
  researcher: [
    { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "shows", label: "What it can show" }, { id: "made", label: "How the sentence is made" },
    { id: "levels", label: "It follows the widget" }, { id: "live", label: "Live from the data" }, { id: "limits", label: "Constraints" }, { id: "questions", label: "Answers & non-answers" },
    { id: "neighbours", label: "Next to other Stories" }, { id: "open", label: "Open questions" },
  ],
};

/* ======================================================================================================== */
/* Shared samples                                                                                            */
/* ======================================================================================================== */
const BAR_ROWS = [["Smoking", 88], ["Alcohol", 82], ["Nutrition", 68], ["Exercise", 64], ["Sleep", 38]];
const SAMPLE = { Flourishing: { v: 86, d: 2 }, Striving: { v: 61, d: 0 }, Struggling: { v: 32, d: -3 } };

/* The Story as the Widget Builder builds it. `d` is the change since the round before (null = no earlier round). */
function Summary({ subject = "Sleep", v, d, parts = true, bar }) {
  const status = statusOf(v);
  return (
    <InsightSummaryStory headline={SUMMARY_HEADLINE(subject)[status]} bar={bar}>
      <SummaryP>{subject} scores <Strong c={statusText(v)}>{v}</Strong>/100 this round, which is {status}.{d !== null && <> {sinceText(d, "Round 2")}.</>}</SummaryP>
      {parts && <SummaryP>It's built from <b>5 Drivers</b>. <b>Smoking</b> is strongest at 88. <b>Sleep</b> is lowest at 38.</SummaryP>}
    </InsightSummaryStory>
  );
}
const ofStatus = (st, extra) => <Summary v={SAMPLE[st].v} d={SAMPLE[st].d} {...extra} />;

/* The exact sample in Figma node 13622:39511 (its own wording), drawn with the real component. Used by the design-owner section only. */
const FIGMA_BAR = [["Area 1", 86], ["Area 2", 72], ["Area 3", 64], ["Area 4", 41], ["Area 5", 28]];
function FigmaSample() {
  return (
    <StoryStyleContext.Provider value="classic">
      <InsightSummaryStory headline="Much of your work is flowing, though some parts are asking more of you." bar={<BandBar values={FIGMA_BAR} />}>
        <SummaryP>Your Flow at Work score is built from <b>5 key Areas</b>. Together, they show where work feels supportive and where more attention may be needed.</SummaryP>
        <SummaryP>Across the <b>5</b> Areas, <Strong c={STATUS_TEXT.success}>1</Strong> is Flowing Healthy, <Strong c={STATUS_TEXT.warning}>2</Strong> are Mostly Flowing, and <Strong c={STATUS_TEXT.error}>2</Strong> are Flowing Low</SummaryP>
      </InsightSummaryStory>
    </StoryStyleContext.Provider>
  );
}

/* ---- parity checks: what Figma says (read from the node) vs what the running component has ---- */
const px = (v) => Math.round(parseFloat(v) * 10) / 10;
const css = (el) => getComputedStyle(el);
const q = (r, sel) => r.querySelector(sel);
const card = (r) => q(r, '[data-story="insight-summary"]');
const titleEl = (r) => q(card(r), "p");
const bodyEl = (r) => q(r, '[data-part="body"]');
const evEl = (r) => q(r, '[data-part="evidence"]');
const barEl = (r) => q(r, '[data-part="bar"]');
const type = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight)} · ${css(el).fontWeight}`;
const CHECKS = [
  { part: "Card size", node: "13622:39511", figma: "808 × 210", read: (r) => { const b = card(r).getBoundingClientRect(); return `${Math.round(b.width)} × ${Math.round(b.height)}`; } },
  { part: "Card fill", node: "13622:39511", figma: "#ffffff", read: (r) => lightHexOf(card(r), ["background", "backgroundColor"]) },
  { part: "Card border", node: "13622:39511", figma: "1 · #cecdcc", read: (r) => `${px(css(card(r)).borderTopWidth)} · ${lightHexOf(card(r), ["border", "borderTop", "borderColor"])}` },
  { part: "Card radius", node: "13622:39511", figma: "18", read: (r) => px(css(card(r)).borderTopLeftRadius) },
  { part: "Card padding", node: "13622:39511", figma: "16", read: (r) => { const c = css(card(r)); return [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft].map(px).every((n) => n === px(c.paddingTop)) ? px(c.paddingTop) : "uneven"; } },
  { part: "Gap: title → text → evidence", node: "13622:39511", figma: "16 / 16", read: (r) => { const row = titleEl(r).parentElement.parentElement.getBoundingClientRect(); const b = bodyEl(r).getBoundingClientRect(), e = evEl(r).getBoundingClientRect(); return `${px(b.top - row.bottom)} / ${px(e.top - b.bottom)}`; } },
  { part: "Title: size / line · weight", node: "13622:39513", figma: "18/28 · 700", read: (r) => type(titleEl(r)) },
  { part: "Title colour", node: "13622:39513", figma: "#1d1a1b", read: (r) => lightHexOf(titleEl(r), ["color"], true) },
  { part: "Body: size / line · weight", node: "13622:39515", figma: "14/20 · 400", read: (r) => type(bodyEl(r).firstElementChild) },
  { part: "Body colour", node: "13622:39515", figma: "#504c4d", read: (r) => lightHexOf(bodyEl(r).firstElementChild, ["color"], true) },
  { part: "Gap between the two paragraphs", node: "13622:39515", figma: "14", read: (r) => { const [a, b] = bodyEl(r).children; return px(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom); } },
  { part: "Counts: colour (Healthy · Mostly · Low)", node: "13622:39515", figma: "#0b703f · #f1a118 · #cc2944", read: (r) => [...bodyEl(r).querySelectorAll("b")].filter((b) => b.style.color).map((b) => lightHexOf(b, ["color"])).join(" · ") },
  { part: "Evidence section: height · hairlines · colour (softened from Figma's #b4b2b1)", node: "13622:39516", figma: "42 · 1/1 · #e5e4e3", read: (r) => { const e = evEl(r), c = css(e); return `${Math.round(e.getBoundingClientRect().height)} · ${px(c.borderTopWidth)}/${px(c.borderBottomWidth)} · ${lightHexOf(e, ["borderTop"])}`; } },
  { part: "Evidence section: space above / below the bar", node: "13622:39516", figma: "16 / 16", read: (r) => { const c = css(evEl(r)); return `${px(c.paddingTop)} / ${px(c.paddingBottom)}`; } },
  { part: "Bar: height · radius", node: "13622:39517", figma: "8 · 9999", read: (r) => `${Math.round(barEl(r).getBoundingClientRect().height)} · ${px(css(barEl(r)).borderTopLeftRadius)}` },
  { part: "Bar: segments", node: "13622:39518–22", figma: "5 equal", read: (r) => { const w = [...barEl(r).children].map((c) => c.getBoundingClientRect().width); return `${w.length} ${w.every((x) => Math.abs(x - w[0]) < 1) ? "equal" : "unequal"}`; } },
  { part: "Bar: colours, left to right", node: "13622:39518–22", figma: "#0e8c4f #f1a118 #f1a118 #cc2944 #cc2944", read: (r) => [...barEl(r).children].map((c) => lightHexOf(c, ["background"])).join(" ") },
];

/* ======================================================================================================== */
/* Developer view                                                                                           */
/* ======================================================================================================== */
const title = (r) => [r.querySelector("h3") || r.querySelector("p")];
const PARTS = [
  { id: "card", name: "Story card", note: "The surface every Story shares: white, 1px border, 18px radius, 16px padding, 16px between parts.", find: (r) => [r.querySelector("[data-story]")] },
  { id: "kind", name: "Kind label (Refined only)", note: "Names the Story type, from StoryMetaContext.", find: (r) => { const el = r.querySelector("h3")?.previousElementSibling; return el ? [el] : []; } },
  { id: "title", name: "Headline", note: "One sentence naming the subject and its status. Text lg / Bold. Passed as `headline`.", find: title },
  { id: "body", name: "Body paragraphs", note: "One or two short paragraphs, 14px apart. Numbers are bold and coloured by status.", find: (r) => [r.querySelector('[data-part="body"]')] },
  { id: "evidence", name: "Evidence section (optional)", note: "A hairline above and below, with 16px above and below the bar. Passed as `bar`.", find: (r) => { const el = r.querySelector('[data-part="evidence"]'); return el ? [el] : []; } },
  { id: "bar", name: "Evidence bar", note: "BandBar: 8px, one equal segment per part, coloured by that part's band, strongest first.", find: (r) => { const el = r.querySelector('[data-part="bar"]'); return el ? [el] : []; } },
];

/* ---- the interactive playground: change the inputs, watch the component, copy the code ---- */
function Playground({ style }) {
  const [subject, setSubject] = useState("Sleep");
  const [v, setV] = useState(61);
  const [d, setD] = useState(3);
  const [hasPrev, setHasPrev] = useState(true);
  const [parts, setParts] = useState(true);
  const [bar, setBar] = useState(false);
  const status = statusOf(v);
  const change = hasPrev ? d : null;
  const label = { ...dsText("Text xs", 600), color: ds.text.primary };
  const row = { display: "flex", alignItems: "center", gap: dsSpace[12], flexWrap: "wrap" };
  const code = `<InsightSummaryStory headline="${SUMMARY_HEADLINE(subject || "Sleep")[status]}"${bar ? "\n  bar={<BandBar values={parts} />}" : ""}>
  <SummaryP>
    ${subject || "Sleep"} scores <Strong c={statusText(${v})}>${v}</Strong>/100 this round, which is ${status}.${change !== null ? `\n    ${sinceText(change, "Round 2")}.` : ""}
  </SummaryP>${parts ? `
  <SummaryP>
    It's built from <b>5 Drivers</b>. <b>Smoking</b> is strongest at 88.
    <b>Sleep</b> is lowest at 38.
  </SummaryP>` : ""}
</InsightSummaryStory>`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)", gap: dsSpace[24], alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], background: ds.surface.general.cardWithinCard, border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.card, padding: dsSpace[16] }}>
        <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={label}>Subject</span><input className="field-soft" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...dsText("Text sm"), padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, background: ds.bg.primary, color: ds.text.primary, fontFamily: "inherit" }} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}><span style={label}>Score: {v} <span style={{ color: ds.text.tertiary, fontWeight: 400 }}>({status})</span></span><input type="range" min={0} max={100} value={v} onChange={(e) => setV(+e.target.value)} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: dsSpace[4], opacity: hasPrev ? 1 : 0.5 }}><span style={label}>Change since last round: {d > 0 ? `+${d}` : d}</span><input type="range" min={-15} max={15} value={d} disabled={!hasPrev} onChange={(e) => setD(+e.target.value)} /></label>
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], ...dsText("Text xs"), color: ds.text.secondary }}>
          <label style={row}><input type="checkbox" checked={hasPrev} onChange={(e) => setHasPrev(e.target.checked)} />There is an earlier round</label>
          <label style={row}><input type="checkbox" checked={parts} onChange={(e) => setParts(e.target.checked)} />Subject has parts</label>
          <label style={row}><input type="checkbox" checked={bar} onChange={(e) => setBar(e.target.checked)} />Show the evidence bar</label>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], minWidth: 0 }}>
        <StoryStage style={style} kind={meta.kind} width={808}>
          <Summary subject={subject || "Sleep"} v={v} d={change} parts={parts} bar={bar ? <BandBar values={BAR_ROWS} /> : undefined} />
        </StoryStage>
        <CodeBlock label="What you'd write" code={code} />
      </div>
    </div>
  );
}

function DeveloperView({ style }) {
  const narrow = (w, node) => (
    <StoryStyleContext.Provider value={style}>
      <div style={{ width: w, flexShrink: 0 }}>{node}</div>
    </StoryStyleContext.Provider>
  );
  return (
    <>
      <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
        <Prose>
          <p><b>Purpose:</b> gives a short, plain-language overview of the insight shown by the selected widget.</p>
          <p><b>Can contain:</b> a headline, a short summary, the current value, the status, the distribution, or key context.</p>
          <p><b>Boundary:</b> it follows the level and scope of the widget. It only summarises the whole report when the widget itself is the whole report.</p>
          <p><b>It doesn't:</b> explain what the score means for the reader (<i>Score Meaning</i>), say how it's calculated (<i>Methodology</i>), break it into parts (<i>Breakdown</i>), or say what to do (<i>Actions</i>). If it needs a third paragraph, the content belongs in another Story.</p>
          <p><b>Where it appears:</b> first in a Scope, and the first Story the Widget Builder suggests for every subject. Used by <FileBadge>widgetbuilder/storyCatalog.jsx</FileBadge> and <FileBadge>scope/scopeRecipes.jsx</FileBadge> (Org Score, Explorers, Score History, Areas to Focus, Gender and Work Composition).</p>
        </Prose>
      </Section>

      <Section id="playground" title="Try it" lead="Change the inputs and the component updates. The code underneath is what you'd write for the same result.">
        <Playground style={style} />
      </Section>

      <Section id="anatomy" title="Anatomy" lead="The numbered parts are drawn on the live component. The table is measured in your browser, so it always shows what ships, with the design-system token behind each colour. It warns about anything off the type, spacing, or radius scales. Switch Current and Refined at the top to compare, and turn on Inspect to read any element.">
        <Anatomy parts={PARTS} style={style} kind={meta.kind} width={808}>
          <Summary v={61} d={0} bar={<BandBar values={BAR_ROWS} />} />
        </Anatomy>
      </Section>

      <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark); never hard-code the hex.">
        <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "20%", "60%"]} rows={[
          ["Card", "Width", "100% of the Scope, up to 808px"],
          ["", "Fill", T("surface/General/card")],
          ["", "Border", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>1px {T("border/secondary")}</span>],
          ["", "Radius", "18px (radius/widget)"],
          ["", "Padding", "16px (spacing/16)"],
          ["", "Gap between headline, text, and evidence", "16px (spacing/16)"],
          ["Headline", "Type", "Text lg / Bold: 18px, 28px line height"],
          ["", "Colour", T("text/primary")],
          ["Body", "Type", "Text sm / Regular: 14px, 20px line height"],
          ["", "Colour", T("text/secondary")],
          ["", "Space between paragraphs", "14px"],
          ["Numbers in the text", "Style", "Bold, coloured by status band (see below)"],
          ["", `Flourishing (${RANGES.Flourishing})`, T("status/success/text-indicator")],
          ["", `Striving (${RANGES.Striving})`, T("status/warning/text")],
          ["", `Struggling (${RANGES.Struggling})`, T("status/error/text")],
          ["Evidence section", "Lines", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>1px above and below, {T("border/tertiary")}</span>],
          ["", "Space above and below the bar", "16px (spacing/16). The section is 42px tall."],
          ["Evidence bar", "Size", "8px tall, full width, fully rounded (radius/full)"],
          ["", "Segments", "One per part, equal width, strongest first, no gaps"],
          ["", "Segment colour", <span style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap" }}>{T("status/success/graph")}{T("status/warning/graph")}{T("status/error/graph")}</span>],
          ["Whole Story", "Interaction", "None. No hover, focus, or motion."],
          ["", "Refined style", "Own card (24px radius, 28px and 32px padding, soft shadow). Evidence bar shown without the lines. Headline is an h3."],
        ]} />
      </Section>

      <Section id="states" title="States & variants" lead={`Wording and colour follow the status band: ${FLOURISHING_AT} and above is Flourishing, ${STRIVING_AT} to ${FLOURISHING_AT - 1} is Striving, under ${STRIVING_AT} is Struggling. These use sample values so the page stays still.`}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 28 }}>
          {Object.keys(SAMPLE).map((st) => (
            <Variant key={st} title={`Score ${SAMPLE[st].v}`} status={st} note={`Headline: “${SUMMARY_HEADLINE("Sleep")[st]}”`}>
              <StoryStage style={style} kind={meta.kind} width={560}>{ofStatus(st)}</StoryStage>
            </Variant>
          ))}
          <Variant title="Without parts" note="A subject with no parts, such as a single Driver, drops the second paragraph.">
            <StoryStage style={style} kind={meta.kind} width={560}>{ofStatus("Struggling", { parts: false })}</StoryStage>
          </Variant>
          <Variant title="With the evidence section" note="The Org Score Scope adds it under the text: one segment per Explorer.">
            <StoryStage style={style} kind={meta.kind} width={560}>{ofStatus("Striving", { bar: <BandBar values={BAR_ROWS} /> })}</StoryStage>
          </Variant>
          <Variant title="Org Score, real data" note="The Scope's own summary, built from the dataset (all 12 Explorers)." wide>
            <StoryStage style={style} kind={meta.kind} width={808}><ExplorerSummary headline={HEADLINE[statusOf(Math.round(dimensionRankedRows().reduce((a, r) => a + r[1], 0) / DIMENSIONS.length))]} /></StoryStage>
          </Variant>
        </div>
      </Section>

      <Section id="edges" title="Sizes & edge cases" lead="How it behaves when the space or the content isn't ideal. The text wraps; nothing is cut off, and nothing scrolls.">
        <Prose><p><b>Widths.</b> The card fills the width it's given and the text wraps. The Scope pane keeps cards at 808px or less.</p></Prose>
        <div style={{ display: "flex", gap: dsSpace[24], overflowX: "auto", alignItems: "flex-start", paddingBottom: dsSpace[8] }}>
          {[320, 480, 808].map((w) => <div key={w} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}><span style={{ ...dsText("Text 2xs", 600), color: ds.text.tertiary }}>{w}px</span>{narrow(w, ofStatus("Striving", { bar: <BandBar values={BAR_ROWS} /> }))}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 28 }}>
          <Variant title="Long subject name" note="The headline wraps to two lines. Nothing truncates.">
            <StoryStage style={style} kind={meta.kind} width={560}><Summary subject="Policies and practices communication quality" v={52} d={1} /></StoryStage>
          </Variant>
          <Variant title="Lowest and highest scores" note="0 and 100 are valid. Both sit in a band, so the words and colours still apply.">
            <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
              <StoryStage style={style} kind={meta.kind} width={560} pad={12}><Summary v={0} d={-4} parts={false} /></StoryStage>
              <StoryStage style={style} kind={meta.kind} width={560} pad={12}><Summary v={100} d={2} parts={false} /></StoryStage>
            </div>
          </Variant>
          <Variant title="No change" note="Say it plainly: “No change since Round 2.” Never “Up 0”.">
            <StoryStage style={style} kind={meta.kind} width={560}><Summary v={61} d={0} parts={false} /></StoryStage>
          </Variant>
          <Variant title="No earlier round" note="Leave the change sentence out. Don't write “No change”, because nothing was compared.">
            <StoryStage style={style} kind={meta.kind} width={560}><Summary v={61} d={null} parts={false} /></StoryStage>
          </Variant>
        </div>
        <Prose>
          <p><b>One part.</b> Drop the second paragraph. <b>No parts at all.</b> Same. <b>Counts of 0 or 1.</b> Use “is” for 1 and “are” for everything else, including 0.</p>
          <p><b>Loading and empty.</b> The Story receives finished text, so it has no loading or empty state of its own. If the data isn't ready, don't render it.</p>
        </Prose>
      </Section>

      <Section id="content" title="Content & voice" lead="Written to the SHAPE Voice and Language Guide (docs/shape-voice-and-language-guide.md).">
        <SpecTable head={["Rule", "Applied here"]} widths={["30%", "70%"]} rows={[
          ["One sentence for the headline", "A statement about the subject and its band. Sentence case, ends with a full stop. It's a statement, not a title, so the title-case heading rule doesn't apply."],
          ["Short and direct", "Two paragraphs at most. Short sentences. One idea each."],
          ["Contractions", "Use them: “It's built from…”, “Here's how…”. Skip them only in legal or policy text."],
          ["No em dashes", "Use a comma or a full stop. “…this round, which is Struggling.” not “…this round — Struggling.”"],
          ["UK English", "organisation, summarise, behaviour."],
          ["Names", "SHAPE in capitals. Explorers and Drivers capitalised. Well-being with a hyphen."],
          ["Lists", "Oxford comma for three or more: “1 is Flourishing, 10 are Striving, and 1 is Struggling”. No comma for two."],
          ["Words to avoid", "fostering, cultivate, unleash, driving, embrace, embark, unlock, tailored, thriving, and “one ___ at a time”."],
          ["Numbers", "Bold and coloured, and always with the status named in words next to them. Scores are written “61/100”."],
        ]} />
        <SpecTable head={["Don't", "Do"]} widths={["50%", "50%"]} rows={[
          ["Sleep scores 32/100 this round — Struggling.", "Sleep scores 32/100 this round, which is Struggling."],
          ["It is built from 5 Drivers.", "It's built from 5 Drivers."],
          ["Here is how each Driver is doing.", "Here's how each Driver is doing."],
          ["Sleep is a thriving area that drives engagement.", "Sleep is a strength right now."],
          ["Your score has dipped over time — down 5 overall.", "Your score has dipped over time, down 5 overall."],
        ]} />
        <Prose>
          <p><b>Headline wording.</b> Three fixed lines per subject, one per band: “{"{Subject}"} is a strength right now.” (Flourishing), “…is doing okay, with room to improve.” (Striving), “…is holding scores back.” (Struggling). They live in <FileBadge>storyCatalog.jsx · SUMMARY_HEADLINE</FileBadge>. The Org Score has its own three in <FileBadge>scopeRecipes.jsx · HEADLINE</FileBadge>.</p>
          <p><b>First paragraph.</b> “{"{Subject}"} scores 86/100 this round, which is Flourishing. Up 2 since Round 2.” The change comes from <FileBadge>sinceText()</FileBadge>: “Up n”, “Down n”, or “No change since Round n”.</p>
          <p><b>Second paragraph</b> (only when there are parts). “It's built from <b>5 Drivers</b>. <b>Smoking</b> is strongest at 88. <b>Sleep</b> is lowest at 38.” Names are bold; scores are plain. In the Org Score Scope: “Across the <b>12</b> Explorers, <b>1</b> is Flourishing, <b>10</b> are Striving, and <b>1</b> is Struggling”.</p>
          <p><b>Second person.</b> Scopes about the whole report speak to the reader: “Your score has held steady.”, “{"{Group}"} is where scores are lowest.”</p>
        </Prose>
      </Section>

      <Section id="a11y" title="Accessibility" lead="What the component does today, and what to keep doing.">
        <Prose>
          <p><b>Reading order.</b> Headline, text, then evidence. It's static text, so there's no focus order and no keyboard interaction.</p>
          <p><b>Colour is never the only signal.</b> The status is always named in the words (“…which is Striving”), so the colour of a number only reinforces it.</p>
          <p><b>The evidence bar</b> is a picture, so it has <code>role="img"</code> and a label that says the same thing in words (“12 parts: 1 Flourishing, 10 Striving, and 1 Struggling”). Keep that label if you rebuild it.</p>
          <p><b>Headings.</b> Current renders the headline in a <code>&lt;p&gt;</code>; Refined renders an <code>&lt;h3&gt;</code>. If the page needs a heading outline, use an <code>&lt;h3&gt;</code> in both.</p>
          <p><b>Contrast of the status numbers</b> on the card, computed from the token values (WCAG 2.x asks for 4.5:1 at this size):</p>
        </Prose>
        <ContrastTable />
        <Callout tone="warn" title="Known gap">The Striving number is below 4.5:1 on a white card, and the Struggling number is just below it in Dark. The darker text tokens in the table are the fix. It's a one-line change in <FileBadge>STATUS_TEXT</FileBadge> once the colour is decided.</Callout>
      </Section>

      <Section id="props" title="Props & usage">
        <PropsTable rows={[
          { name: "headline", type: "string", required: true, desc: "The headline sentence. Rendered as the Story title: Text lg / Bold in Current, 20px in Refined." },
          { name: "children", type: "ReactNode", required: true, desc: "The body: one or two <SummaryP> paragraphs. Wrap numbers in <Strong c={statusText(v)}> so they take the status colour." },
          { name: "bar", type: "ReactNode", def: "none", desc: "Optional evidence, normally <BandBar values={[[name, score], …]} />. In Current it sits in the evidence section (lines and 16px space). In Refined it's shown without the lines." },
        ]} />
        <PropsTable rows={[
          { name: "SummaryP", type: "component", desc: "A paragraph. 14/20 in Current, 16/24 capped at 62 characters in Refined." },
          { name: "Strong", type: "component ({ c })", desc: "Bold text in the colour `c`." },
          { name: "statusText(score)", type: "function", desc: "The number colour for a score: Flourishing, Striving, or Struggling." },
          { name: "STATUS_TEXT", type: "{ success, warning, error }", desc: "The three number colours, for when you have a band and not a score." },
          { name: "BandBar", type: "component ({ values })", desc: "The evidence bar. `values` is [[name, score], …], strongest first. Draws one equal segment per entry and labels itself for screen readers." },
        ]} />
        <CodeBlock label="Usage" code={`import { InsightSummaryStory, SummaryP, Strong, BandBar, statusText } from "./SummaryStories.jsx";

<InsightSummaryStory
  headline="Sleep is holding scores back."
  bar={<BandBar values={[["Smoking", 88], ["Alcohol", 82], ["Nutrition", 68], ["Exercise", 64], ["Sleep", 38]]} />}
>
  <SummaryP>
    Sleep scores <Strong c={statusText(32)}>32</Strong>/100 this round, which is Struggling.
    Down 3 since Round 2.
  </SummaryP>
  <SummaryP>
    It's built from <b>5 Drivers</b>. <b>Smoking</b> is strongest at 88.
    <b>Sleep</b> is lowest at 38.
  </SummaryP>
</InsightSummaryStory>`} />
        <Prose><p><b>Data.</b> The Story reads no data itself. Pass finished text. <b>Layout.</b> The parent decides the width. <b>Placement.</b> First in a Scope.</p></Prose>
      </Section>

      <Section id="done" title="Done checklist" lead="You're done when every line is true.">
        <List items={[
          "The card is white with a 1px border, an 18px radius, and 16px padding, and 16px between the headline, text, and evidence.",
          "The headline is 18px bold with a 28px line height in the primary text colour.",
          "The body is 14px with a 20px line height in the secondary text colour, with 14px between paragraphs.",
          "Numbers are bold, and take the Flourishing, Striving, or Struggling colour from their score.",
          "The evidence section has a line above and below, 16px of space around an 8px bar, and is 42px tall.",
          "The bar has one equal segment per part, strongest first, coloured by band, with a text label for screen readers.",
          "Every colour is a design-system token and follows Light and Dark. No hex values in the component.",
          "Copy follows the voice guide: contractions, UK English, no em dashes, Oxford comma for three or more.",
          "It's correct at 320px, 480px, and 808px wide, with a long subject name, with and without parts, with and without an earlier round.",
          "It has no interaction, and nothing moves.",
        ]} />
      </Section>

      <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
        <Prose><p><b>Matches the design.</b> The exact sample from Figma node 13622:39511, drawn with the real component at the design's width (808px) and measured in your browser. Each row is a value read from the Figma node next to what the component has. It's shown in Current, whichever Style is selected.</p></Prose>
        <FigmaParity checks={CHECKS}><FigmaSample /></FigmaParity>
        <Callout tone="warn" title="Two things in the design that aren't on the design-system scales">
          The gap between the two body paragraphs is <b>14px</b> (paragraph spacing inside the text, not a spacing token, where the scale goes 12 to 16). The card's padding variable carries a <b>17px</b> fallback in the generated code, which is 16px of padding plus the 1px border. Both are built as drawn.
        </Callout>
        <Prose>
          <p><b>Where Figma and the v4 design-system file disagree.</b> The component follows Figma's drawn value and says which token it used.</p>
          <p>· <b>Card radius.</b> Figma's variable <code>radius-card</code> is 18. The markdown has <code>radius/card</code> at 16 and <code>radius/widget</code> at 18. Used: <code>radius/widget</code>.</p>
          <p>· <b>Flourishing number colour.</b> Figma binds <code>status/success/text-strong</code> at #0B703F. In the markdown that value is <code>text-indicator</code>, and its <code>text-strong</code> is #08542F. Used: <code>text-indicator</code>.</p>
          <p>· <b>Evidence bar colour.</b> Figma binds <code>border/success</code>, <code>border/warning</code>, and <code>border/error</code>. The component uses <code>status/*/graph</code>. Same hex in Light and Dark.</p>
          <p>· <b>Status number colours.</b> Figma uses the brand fill colours as text for Striving and Struggling. They are lighter than the design system's text tokens, so Striving fails contrast (see Accessibility). Decision: keep Figma's colours, or move to <code>warning/text-strong</code> and <code>error/text-indicator</code>.</p>
          <p>· <b>The hidden button.</b> Figma has a hidden 24px button at the right end of the headline row. The shell supports it (<code>controls</code>); this Story passes none.</p>
          <p>· <b>The Figma sample's own wording.</b> It shows a Flow at Work score with 5 Areas and the bands Flowing Healthy, Mostly Flowing, and Flowing Low. The product scores the whole organisation from {DIMENSIONS.length} Explorers and uses Flourishing, Striving, and Struggling.</p>
          <p><b>Voice-guide calls.</b> (1) The Headings rule says titles are under 7 words, in title case, with no full stop. The Insight Summary headline is a full sentence, so it's treated as a statement in the mascot and body style: sentence case, ends with a full stop. Confirm that's what you want. (2) The Org Score's counts sentence has no full stop, as in the design. Everywhere else a sentence ends with one. (3) Em dashes still appear in other Stories' copy (Score Meaning's three paragraphs, Methodology, and others). They'll be fixed Story by Story.</p>
        </Prose>
      </Section>
    </>
  );
}

function ResearcherView({ style }) {
  const rows = dimensionRankedRows();
  const overall = Math.round(rows.reduce((a, r) => a + r[1], 0) / rows.length);
  const weakest = rows[rows.length - 1][0];
  const builder = STORIES.find((s) => s.id === "summary");
  const prev = ROUNDS.length >= 2 ? roundName(LAST - 1) : "n/a";
  const nGreat = rows.filter((r) => r[1] >= FLOURISHING_AT).length, nAvg = rows.filter((r) => r[1] >= STRIVING_AT && r[1] < FLOURISHING_AT).length, nLow = rows.length - nGreat - nAvg;
  return (
    <>
      <Section id="story" title="The data story" lead="The one-sentence answer to “how is this doing?” for whatever the reader is looking at.">
        <Prose>
          <p>Every report widget is a number. The Insight Summary is the first thing under it that turns the number into a statement a person can repeat. It takes one score, an average on a 0 to 100 scale across everyone who answered. It decides which of three bands the score falls in, says so in plain words, and adds just enough evidence to be trusted: the number, whether it moved since the last round, and how its parts are spread.</p>
          <p>It's deliberately a <b>description, not an explanation</b>. It tells the reader where things stand and stops. Why, who, and what next belong to the Stories below it.</p>
        </Prose>
        <Callout title="The scope rule">
          The Insight Summary follows the level and scope of the widget. On the Org Score it talks about the organisation. On a single Driver it talks about that Driver. On a group comparison it talks about the groups. It never reaches beyond the widget the reader opened.
        </Callout>
      </Section>

      <Section id="glance" title="At a glance">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Question it answers" value="How is this doing, in one glance?" />
          <Fact label="The measure" value="A score from 0 to 100" note="Higher is always better. An average across respondents." />
          <Fact label="The bands" value={`${FLOURISHING_AT}+ · ${STRIVING_AT} to ${FLOURISHING_AT - 1} · under ${STRIVING_AT}`} note="Flourishing, Striving, and Struggling." />
          <Fact label="Level" value="Follows the widget" note="Organisation, an Explorer, a Driver, or a group. Whatever was opened." />
          <Fact label="Time reference" value={`Latest round vs ${prev}`} note={`${ROUNDS.length} rounds exist. One comparison, not a trend.`} />
          <Fact label="People behind it" value={`${EMPLOYEE_COUNT} respondents`} note="Synthetic data in this prototype (see Constraints)." />
        </div>
      </Section>

      <Section id="shows" title="What it can show" lead="Anything from this list, in a headline and a line or two. Never more.">
        <SimpleTable head={["Evidence", "What the reader learns", "Where the number comes from"]} widths={["26%", "40%", "34%"]} rows={[
          ["Status headline", "Which band the subject is in, in a sentence.", `The score, banded at ${STRIVING_AT} and ${FLOURISHING_AT}; one of three fixed headlines.`],
          ["Current value", "The score itself, coloured by band.", "Latest round's average."],
          ["Change since last round", "Up, down, or no change, in points.", "Latest round minus the round before. One comparison."],
          ["Distribution across parts", "How many of the parts are in each band (for example “1 Flourishing, 2 Striving, 2 Struggling”). The same thing is drawn as the evidence bar, one segment per part, strongest first.", "Each part's own score, banded the same way."],
          ["Strongest and weakest part", "Where the score is carried and where it is dragged down.", "Highest and lowest part score."],
          ["Extremes between groups", "Which group scores highest and lowest, and the gap in points.", "Group averages. Only groups of 5 or more people."],
        ]} />
      </Section>

      <Section id="made" title="How the sentence is made" lead="A model doesn't write any of it. Every word is chosen by a rule from the numbers, so the sentence can never claim more than the data says.">
        <SimpleTable head={["Step", "What happens", "Rule"]} widths={["20%", "50%", "30%"]} rows={[
          ["1. Answers to Driver", "A Driver's score is the average of the answers about it.", "Mean, 0–100"],
          ["2. Driver to Explorer", `An Explorer's score is the average of its Drivers. ${DRIVERS.length} Drivers roll up into ${DIMENSIONS.length} Explorers.`, "Mean of parts"],
          ["3. Explorer to organisation", "The organisation's score is the average of everyone's overall score for the round.", "Mean over people"],
          ["4. Score to band", "The score is placed in a band.", `${FLOURISHING_AT} or more: Flourishing. ${STRIVING_AT} or more: Striving. Otherwise Struggling.`],
          ["5. Band to words", "The headline is picked from three fixed sentences for that subject.", "Template, one per band"],
          ["6. Numbers to text", "The score, the change, and the parts' counts or extremes are dropped into the paragraph.", "Template; numbers coloured by band"],
        ]} />
      </Section>

      <Section id="levels" title="It follows the widget" lead="The same Story, written for whichever widget the reader opened.">
        <SimpleTable head={["Widget / Scope", "What it summarises", "Headline pattern", "Evidence it carries"]} widths={["20%", "26%", "30%", "24%"]} rows={[
          ["Org Score", `The whole organisation, as ${DIMENSIONS.length} Explorers`, "By status: “Much of your organisation is doing well, though some areas are asking more of it.”", "Counts of Explorers per band + evidence bar"],
          ["Explorers and Factors layer", "Every Explorer, or every Driver", "“Here's how each Explorer is doing.”", "Counts per band (Explorers), or how many Drivers roll up (Factors)"],
          ["Score History", "Movement across all rounds", "“Your score has risen / held steady / dipped over time.”", `First round to latest round, in points (${ROUNDS.length} rounds)`],
          ["Areas to Focus", "The lowest-scoring group, across the ways of grouping people", "“{Group} is where scores are lowest.”", `Its score, out of ${ALL_AXES.length} ways of grouping`],
          ["Gender and Work Composition", "One way of grouping people", "“{Highest} scores highest, {Lowest} lowest.”", "Both averages and the gap in points; groups of 5+ only"],
          ["Widget Builder (any subject)", "An Explorer, Driver, cluster or the organisation", "By status: “{Subject} is a strength / doing okay / holding scores back.”", "Score, change since last round, strongest and weakest part"],
        ]} />
      </Section>

      <Section id="live" title="Live from the data" lead="Three real summaries, built from the dataset right now. Under each, where every part of the sentence comes from.">
        <Variant title="Organisation" note="The Org Score Scope's summary.">
          <StoryStage style={style} kind={meta.kind} width={808}><ExplorerSummary headline={HEADLINE[statusOf(overall)]} /></StoryStage>
        </Variant>
        <SimpleTable head={["In the sentence", "Data behind it"]} widths={["32%", "68%"]} rows={[
          ["Headline", `Overall score ${overall} gives ${statusOf(overall)} (the average of the ${rows.length} Explorer scores shown here).`],
          [`“built from ${rows.length} Explorers”`, `Count of Explorers in the dataset (${DIMENSIONS.length}).`],
          ["The three counts", `Explorers at ${FLOURISHING_AT} or more: ${nGreat}. At ${STRIVING_AT} to ${FLOURISHING_AT - 1}: ${nAvg}. Under ${STRIVING_AT}: ${nLow}.`],
          ["Evidence bar", `${rows.length} equal segments, strongest to weakest. A segment's colour is that Explorer's band, and segment size carries no information.`],
        ]} />
        <Variant title={`One Explorer: ${weakest}, the weakest`} note="The Widget Builder's version, with parts (Drivers).">
          <StoryStage style={style} kind={meta.kind} width={808}>{builder.render(dimensionSubject(weakest))}</StoryStage>
        </Variant>
        <Variant title="One way of grouping people: Gender" note="The Composition Scope's version.">
          <StoryStage style={style} kind={meta.kind} width={808}><GapSummary axisKey="gender" noun="gender" /></StoryStage>
        </Variant>
        <Prose><p>All three are rendered by the same component from different data; change the data and the sentence changes with it. The numbers are the dataset's, which is synthetic.</p></Prose>
      </Section>

      <Section id="limits" title="Constraints" lead="What a reader, or a researcher quoting this, should keep in mind. Each is a real property of how the Story works today.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="It describes; it does not explain." use="For causes and drivers, see Breakdown, Diagnostic and Actions.">The summary says where a score stands and how it moved. It makes no claim about why, and it can't. It has only the score and its parts.</Limit>
          <Limit n="2" title="An average hides how people differ." use="The Widget Builder's “How Scores Are Spread” Story shows the distribution.">A score of 61 could be everyone at 61, or two camps at 30 and 90. The summary reports the average and, at most, the spread across <i>parts</i>, not across <i>people</i>.</Limit>
          <Limit n="3" title="One comparison is not a trend." use="For movement over time, see Score History.">“Up 2 since Round 2” compares two rounds. There are only {ROUNDS.length} rounds, and no confidence interval or significance test is computed, so a change of a point or two shouldn't be read as real movement.</Limit>
          <Limit n="4" title="The bands are fixed cut-offs.">{STRIVING_AT} and {FLOURISHING_AT} are the status thresholds. A {FLOURISHING_AT - 1} and a {FLOURISHING_AT} get different words and colours although they're practically the same.</Limit>
          <Limit n="5" title="Small groups are never shown.">A group with fewer than 5 people never gets a score, so the “lowest group” and “gap” sentences only ever name groups of 5 or more. This protects individuals. It also means a very small group can be the true lowest and still not appear.</Limit>
          <Limit n="6" title="Every part counts the same.">“3 of {DIMENSIONS.length} Explorers are Struggling” counts Explorers, not people or questions. Explorers have different numbers of Drivers, and a small one weighs as much as a large one in the count.</Limit>
          <Limit n="7" title="The wording is templated.">There are three headlines per subject and one sentence structure for the numbers. That keeps it honest and consistent, but it can't express nuance, such as a score that's rising overall while one part falls.</Limit>
          <Limit n="8" title="It does not say how many people answered.">The sentence is silent on participation. A summary based on 60% of the organisation reads the same as one based on 100%. The “Who Answered” Story carries that.</Limit>
          <Limit n="9" title="The prototype's data is synthetic.">{EMPLOYEE_COUNT} generated respondents × {ROUNDS.length} rounds, with some correlations built in on purpose. This page shows how the Story behaves. It isn't a finding about a real organisation.</Limit>
        </div>
      </Section>

      <Section id="questions" title="What it answers, and what it does not">
        <Two>
          <div style={card_}>
            <span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>It answers</span>
            <List items={["How is this doing right now?", "Which band is it in: Flourishing, Striving, or Struggling?", "Did it move since the last round, and which way?", "How many of its parts are healthy, middling or struggling?", "Which part is strongest, and which is weakest?", "Which group scores highest and lowest?"]} />
          </div>
          <div style={card_}>
            <span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>It does not answer</span>
            <List items={["Why is it this way? (Breakdown, Diagnostic)", "Who is affected, and how many people? (Composition, Who Answered)", "Is the change real or noise? (Not computed anywhere yet.)", "How do we compare with other organisations? (No external benchmark exists.)", "How was the score worked out? (Methodology)", "What should we do about it? (Actions)"]} />
          </div>
        </Two>
      </Section>

      <Section id="neighbours" title="Next to the other Stories" lead="Each Story answers one question. The Insight Summary is the shortest and comes first.">
        <SimpleTable head={["Story", "The question it answers", "Relationship to the Insight Summary"]} widths={["22%", "34%", "44%"]} rows={[
          ["Insight Summary", "How is it doing?", "n/a"],
          ["Score Meaning", "What does this result mean for me?", "Restates the score and explains its band. The Summary says where things stand."],
          ["Breakdown", "What is it made of?", "The Summary names the strongest and weakest. Breakdown shows every part."],
          ["Diagnostic", "Where should I look? Which part, which group?", "The Summary points at the extremes. Diagnostic ranks and highlights them."],
          ["Trend and Score History", "How has it moved over time?", "The Summary gives one comparison. Trend gives the whole line."],
          ["Methodology", "How was it worked out?", "Never interprets the reader's own score. The Summary always does."],
          ["Actions", "What can I do about it?", "The Summary never recommends."],
        ]} />
      </Section>

      <Section id="open" title="Open questions" lead="Decisions this page can't make for you. Each changes what the Story says or how far it can be trusted.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="A" title="Should the summary say how many people answered?">Adding “based on 87 of 100 people” would make a summary qualify itself, at the cost of length. The Story is meant to be short.</Limit>
          <Limit n="B" title="When is a change big enough to call?">Today any non-zero change is reported as up or down. A minimum detectable change, or a confidence interval, would let the Story say “no meaningful change” for small moves.</Limit>
          <Limit n="C" title="Names for the three bands at organisation level">An earlier design sample used Flowing Healthy, Mostly Flowing, and Flowing Low for a Flow at Work score. The product uses Flourishing, Striving, and Struggling everywhere. One vocabulary should win.</Limit>
          <Limit n="D" title="Number colour and legibility">The amber and red numbers use the brand fill colours, which are lighter than the design system's text colours. See Accessibility in the Developer view for the measured contrast.</Limit>
        </div>
      </Section>
    </>
  );
}


export default function InsightSummaryDoc({ style, view = "developer" }) {
  return view === "researcher" ? <ResearcherView style={style} /> : <DeveloperView style={style} />;
}
