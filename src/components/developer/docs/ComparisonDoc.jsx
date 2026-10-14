import { ds, dsText, dsSpace } from "../../../lib/ds.js";
import { ROUNDS, DIMENSIONS, EMPLOYEE_COUNT } from "../../../lib/dataset.js";
import { LAST, groupRows, groupPartMeans, SUPPRESS_BELOW } from "../../../lib/scopeData.js";
import { ComparisonRadar, ComparisonArea, HealthAgeComparison, ComparisonLegend, seriesColor } from "../../scope/stories/ComparisonStories.jsx";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import { SampleTag } from "../../scope/stories/StoryCard.jsx";
import { Section, Prose, Callout, Variant, StoryStage, PropsTable, CodeBlock, FileBadge, FigmaParity, lightHexOf } from "../docKit.jsx";
import { SpecTable, SimpleTable, T, tok, Fact, Limit, Two, List, card_ } from "../docParts.jsx";
import { useState } from "react";
import WidthShowcase from "./WidthShowcase.jsx";

export const meta = {
  id: "comparison", name: "Comparison", group: "Stories", kind: "Comparison",
  blurb: "The same insight side by side for you, the teams you're part of, and the organisation, with each one switched on or off from its own card.",
  source: "components/scope/stories/ComparisonStories.jsx", figma: "13622:39086",
  views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }],
};
export const toc = {
  developer: [
    { id: "overview", label: "Overview" }, { id: "forms", label: "The forms" }, { id: "spec", label: "Specification" },
    { id: "states", label: "States & variants" }, { id: "responsive", label: "Responsive" }, { id: "content", label: "Content & voice" },
    { id: "a11y", label: "Accessibility" }, { id: "props", label: "Props & usage" }, { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
  ],
  researcher: [
    { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "live", label: "Live from the data" },
    { id: "limits", label: "Constraints" }, { id: "questions", label: "Answers & non-answers" }, { id: "open", label: "Open questions" },
  ],
};

/* ---- samples ---- */
/* The design's own values (13622:39405, 13622:39125), used for the parity checks and the Health Age form (no ages exist in
   the data). */
const DESIGN_PARTS = ["Organisational Flow", "Communication Flow", "Digital Flow", "Engagement Flow", "Information Flow"];
const DESIGN = [
  { id: "you", kind: "you", label: "Your Score", score: 39, values: [36, 40, 38, 42, 39] },
  { id: "t1", kind: "team", label: "Team", tag: "paul.mccartney@example.com", score: 72, values: [70, 75, 68, 74, 72] },
  { id: "t2", kind: "team", label: "Team", tag: "john.lennon@example.com", score: 62, values: [60, 64, 61, 63, 62] },
  { id: "org", kind: "org", label: "Org Score", score: 92, values: [60, 80, 86, 54, 66] },
];
const AGE = [
  { id: "you", kind: "you", label: "You", age: { value: 2 + 3 / 12, gap: -(2 + 5 / 12) } },
  { id: "t1", kind: "team", label: "Team", tag: "paul.mccartney@example.com", age: { value: 32 + 4 / 12, gap: 5 + 5 / 12 } },
  { id: "t2", kind: "team", label: "Team", tag: "john.lennon@example.com", age: { value: 30 + 1 / 12, gap: -(2 + 5 / 12) } },
  { id: "org", kind: "org", label: "Org", age: { value: 136 + 3 / 12, gap: 2 + 5 / 12 } },
];
/* Live: the two largest departments as "teams" and the whole organisation, on every Explorer, latest round. There is no
   per-person "You" in the data, so the live examples leave it out. */
const LIVE_TEAMS = groupRows("department").filter((g) => !g.hidden).slice(0, 2);
const orgValues = DIMENSIONS.map((d) => Math.round(ROUNDS[LAST].dimensionAvg[d]));
const LIVE = [
  ...LIVE_TEAMS.map((g, i) => ({ id: `t${i}`, kind: "team", label: "Team", tag: g.group, score: g.score, values: groupPartMeans("department", g.group, DIMENSIONS) })),
  { id: "org", kind: "org", label: "Org Score", score: Math.round(ROUNDS[LAST].avgOverall), values: orgValues },
];

const classic = (n) => <StoryStyleContext.Provider value="classic">{n}</StoryStyleContext.Provider>;
const px = (v) => Math.round(parseFloat(v) * 100) / 100;
const css = (el) => getComputedStyle(el);
const q = (r, s) => r.querySelector(s);
const qa = (r, s) => [...r.querySelectorAll(s)];
const rect = (el) => el.getBoundingClientRect();
const type = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight)} · ${css(el).fontWeight}`;
const shell = (el) => { const s = css(el); return `${lightHexOf(el, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(el, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; };

const LEGEND_CHECKS = [
  // Figma draws the border inside its 16px padding, so padding is measured from the outer edge (CSS padding + border).
  { part: "Card fill · border · radius · padding (from the edge)", node: "13622:39437", figma: "#f9f8f7 · 1 #cecdcc · 12 · 16", read: (r) => { const c = q(r, '[data-part="series-card"]'), s = css(c); return `${lightHexOf(c, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(c, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop) + px(s.borderTopWidth)}`; } },
  { part: "Name: type · colour", node: "13622:39440", figma: "14/20 · 600 · #1d1a1b", read: (r) => { const n = q(r, '[data-part="series-name"]'); return `${type(n)} · ${lightHexOf(n, ["color"])}`; } },
  { part: "Score: type", node: "13622:39442", figma: "16/24 · 700", read: (r) => type(q(r, '[data-part="series-score"]')) },
  { part: "Toggle: size · on colour (You)", node: "13622:39443", figma: "36 × 20 · #8e24aa", read: (r) => { const t = q(r, '[data-part="series-toggle"]'); return `${Math.round(rect(t).width)} × ${Math.round(rect(t).height)} · ${lightHexOf(t, ["background"])}`; } },
  { part: "Toggle: off colour (Team)", node: "13622:39455", figma: "#e5e4e3", read: (r) => lightHexOf(qa(r, '[data-part="series-toggle"]')[1], ["background"]) },
  { part: "Team card height", node: "13622:39447", figma: "88", read: (r) => Math.round(rect(qa(r, '[data-part="series-card"]')[1]).height) },
  { part: "System tag: fill · border · text", node: "13622:39451", figma: "#f2f2f2 · 1 #cecdcc · 12/16", read: (r) => { const t = q(r, '[data-part="system-tag"]'); return `${lightHexOf(t, ["background"])} · ${px(css(t).borderTopWidth)} ${lightHexOf(t, ["border"])} · ${px(css(t).fontSize)}/${px(css(t).lineHeight)}`; } },
  { part: "Teams header: type · colour · padding", node: "13622:39445", figma: "13/18 · 600 · #7c7879 · 8/16", read: (r) => { const h = q(r, '[data-part="teams-header"]'); return `${type(h)} · ${lightHexOf(h, ["color"])} · ${px(css(h).paddingTop)}/${px(css(h).paddingLeft)}`; } },
  { part: "Gaps: You → teams → Org · between team cards", node: "13622:39436", figma: "16 · 8", read: (r) => { const l = q(r, '[data-part="comparison-legend"]'); const col = l.children[1]; return `${px(css(l).rowGap)} · ${px(css(col).rowGap)}`; } },
];
const AGE_CHECKS = [
  { part: "Track: height · radius · colour", node: "13622:39147", figma: "8 · 8 · #cecdcc", read: (r) => { const t = q(r, '[data-part="age-track"]'); return `${Math.round(rect(t).height)} · ${px(css(t).borderTopLeftRadius)} · ${lightHexOf(t, ["background"])}`; } },
  { part: "Younger fill colour", node: "13622:39148", figma: "#0e8c4f", read: (r) => lightHexOf(q(r, '[data-part="age-fill"]'), ["background"]) },
  { part: "Older fill colour", node: "13622:39177", figma: "#cc2944", read: (r) => lightHexOf(qa(r, '[data-part="age-fill"]')[1], ["background"]) },
  { part: "Younger fill grows left of the centre", node: "13622:39148", figma: "left", read: (r) => { const f = q(r, '[data-part="age-fill"]'), t = q(r, '[data-part="age-track"]'); return rect(f).right <= rect(t).left + rect(t).width / 2 + 1 ? "left" : "right"; } },
  { part: "Age pill: height · fill (younger)", node: "13622:39137", figma: "20 · #e1f5ea", read: (r) => { const p = q(r, '[data-part="age-pill"]'); return `${Math.round(rect(p).height)} · ${lightHexOf(p, ["background"])}`; } },
];

function LegendDemo({ layout }) {
  const [on, setOn] = useState({ you: true, t1: false, t2: false, org: true });
  return <ComparisonLegend entities={DESIGN} on={on} setOn={setOn} colors={seriesColor(DESIGN)} layout={layout} />;
}

/* ======================================================================================================== */
function DeveloperView({ style }) {
  return (
    <>
      <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
        <Prose>
          <p><b>Purpose:</b> compares the same insight across compatible people, teams, organisations, populations, or reference points.</p>
          <p><b>Can contain:</b> scores, statuses, gaps, rankings, benchmarks, charts, and tables.</p>
          <p><b>Boundary:</b> every comparison uses the same measure, calculation method, reporting period, and compatible data scope. Privacy rules apply to aggregate comparisons: a team under {SUPPRESS_BELOW} people is never shown.</p>
          <p><b>The legend is the control.</b> Each entity (You, the teams you're part of, the Org) is a card with its score and a toggle in its series colour. Switch a toggle and that series appears in, or leaves, the chart. You and the Org start on; teams start off (with no You, the first team starts on so there is something to compare).</p>
        </Prose>
      </Section>

      <Section id="forms" title="The forms">
        <SimpleTable head={["Form", "What it shows", "Use it when"]} widths={["22%", "48%", "30%"]} rows={[
          [<a key="r" href="#form-radar" style={{ color: "inherit" }}>Radar, legend beside</a>, "Each entity as a polygon over the same parts; the legend in a column to the right.", "A handful of parts (3 to 8) and the shape matters."],
          [<a key="b" href="#form-radar-below" style={{ color: "inherit" }}>Radar, legend below</a>, "The same radar full width, the legend in three columns under it.", "The radar needs the room, or the card is narrower."],
          [<a key="a" href="#form-area" style={{ color: "inherit" }}>Area</a>, "One area per entity over every part, sortable, with a tooltip that lists every entity at the hovered part.", "Many parts (8 or more), or the order of parts should be sortable."],
          [<a key="h" href="#form-age" style={{ color: "inherit" }}>Health Age</a>, "Each entity's Health Age as a bar from the actual-age line: younger left in green, older right in red.", "Comparing ages, not scores."],
          [<a key="l" href="#form-legend" style={{ color: "inherit" }}>Legend</a>, "The cards alone, vertical or horizontal.", "As part of another chart."],
        ]} />
      </Section>

      <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark).">
        <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[
          ["Card", "Shell", "The Story card: 808px, 18px radius, 16px padding. Title Text lg / Bold, the explanatory line Text sm text/secondary, then an Evidence Section."],
          ["Entity card", "Surface", <span key="c" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{T("surface/General/card-within-card")}, 1px {T("border/secondary")}, radius/lg (12), 16px padding. Name Text sm / Semibold {T("text/primary")}; score Text md / Bold in its status colour; toggle 8px after it.</span>],
          ["", "Team card", "88px tall: the name, then the team's System Tag 16px under it (bg/primary, 1px border/secondary, fully rounded, 2px / 8px, Text 2xs text/secondary)."],
          ["", "Teams header", <span key="h" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>The same surface, 8px / 16px, “TEAM(S) YOU'RE PART OF” in Text xs / Semibold {T("text/tertiary")}, centred.</span>],
          ["Toggle", "Switch", <span key="t" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>36 × 20, 2px padding, a 16px white knob. On: the series colour. Off: {T("bg/secondary")}.</span>],
          ["Series colours", "Fixed", <span key="s" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>You {tok("utility/Graph Colors/Main/Purple")}; Org Orange Coral 600 (#FD531B, a primitive); teams Team Blue, Mint Green, Lavender Violet in order.</span>],
          ["Legend", "Layout", "Vertical: You, the teams (header + cards 8px apart), the Org, 16px apart. Horizontal: the same three groups as three equal columns, 16px apart."],
          ["Radar", "Plot", "Five rings to the outer radius, a spoke per part past the outer ring with a node on it, labels 12px text/secondary. Each series: 2.5px stroke, 8% fill. Beside: 511px plot + 247px legend, 16px apart."],
          ["Area", "Plot", "280px, 1px border/tertiary, radius/xs. Ticks 0 to 100 at the left (Text 2xs). Each series a smooth curve (2px) over a 14% fill. Part names rotated −60°, Text xs / Medium text/quaternary; the hovered one Semibold, underlined, text/primary."],
          ["", "Controls", "Clear, Sort on (which entity to sort by), Sort by (highest or lowest first): ghost buttons, Text sm text/secondary, 20px icons, 20px apart, right-aligned."],
          ["", "Tooltip", "240px, surface/tooltip, radius/lg, 12 / 16 padding, shadow-sm. The part in upper case, then a row per shown entity: a 2px left rule in its status colour, the name and tag, the change pill and the score."],
          ["Health Age", "Rows", "A 247px entity card, then the bar (the rest of the width). Groups (You / teams / Org) separated by a 1px border/primary line."],
          ["", "Bar", <span key="b" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>“YOUNGER | OLDER” over an 8px {T("bg/quaternary")} track with a 20px centre line. The fill grows from the centre: left in {T("status/success/icon")}, right in {T("status/error/icon")}. Half the track is 10 years. The sentence under it in the status text colour, numbers and the word bold.</span>],
        ]} />
      </Section>

      <Section id="states" title="States & variants" lead="Live examples use the two largest departments as teams. There is no per-person “You” in the data, so it appears only in the design samples.">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div id="form-radar" /><Variant title="Radar, legend beside · design sample"><StoryStage style={style} kind={meta.kind} width={808}><ComparisonRadar parts={DESIGN_PARTS} entities={DESIGN} line="How your score compares with your teams and the organisation across five areas." /></StoryStage></Variant>
          <Variant title="Radar, legend beside · live" note="Two departments and the organisation, every Explorer."><StoryStage style={style} kind={meta.kind} width={808}><ComparisonRadar parts={DIMENSIONS} entities={LIVE} line="How each team compares with the organisation on every Explorer." /></StoryStage></Variant>
          <div id="form-radar-below" /><Variant title="Radar, legend below · design sample"><StoryStage style={style} kind={meta.kind} width={808}><ComparisonRadar parts={DESIGN_PARTS} entities={DESIGN} legend="below" /></StoryStage></Variant>
          <div id="form-area" /><Variant title="Area · live" note="Sort on an entity, then highest or lowest first. Hover a part for every entity's score there."><StoryStage style={style} kind={meta.kind} width={808}><ComparisonArea parts={DIMENSIONS} entities={LIVE} line="Every Explorer, for each team and the organisation." /></StoryStage></Variant>
          <div id="form-age" /><Variant title="Health Age · design sample" note="No ages exist in the data, so this form runs on sample values only."><StoryStage style={style} kind={meta.kind} width={808}><div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}><SampleTag>Sample data</SampleTag><HealthAgeComparison entities={AGE} /></div></StoryStage></Variant>
          <div id="form-legend" /><Variant title="Legend, vertical"><StoryStage style={style} kind={meta.kind} width={300}><LegendDemo layout="vertical" /></StoryStage></Variant>
          <Variant title="Legend, horizontal"><StoryStage style={style} kind={meta.kind} width={808}><LegendDemo layout="horizontal" /></StoryStage></Variant>
        </div>
      </Section>

      <Section id="responsive" title="Responsive" lead="Each form responds to the width of its own card, never the window. Pick a width to see every form at it.">
        <WidthShowcase style={style} forms={[
          { name: "Radar · design sample", render: () => <ComparisonRadar parts={DESIGN_PARTS} entities={DESIGN} /> },
          { name: "Radar · live, 12 Explorers", render: () => <ComparisonRadar parts={DIMENSIONS} entities={LIVE} /> },
          { name: "Area · live", render: () => <ComparisonArea parts={DIMENSIONS} entities={LIVE} /> },
          { name: "Health Age · sample", render: () => <HealthAgeComparison entities={AGE} /> },
        ]} />
        <SimpleTable head={["Form", "Designed (560px+)", "Compact and phone"]} widths={["18%", "41%", "41%"]} rows={[
          ["Radar", "Legend beside the radar when the card fits a 460px radar and the 247px legend; otherwise below. Names around the plot while they fit.", "Legend below, in one column. Numbered marks and a key when the names don't fit (always from 20 parts); the key lists each series' score. Tap a spoke or a key row; the detail opens under the chart."],
          ["Area", "Part names rotated under the plot; hover for every series at a part.", "Numbered marks and a key once parts get narrower than 26px (always on a compact card); a 200px plot; tap a part and the detail opens under the chart. Sort controls align left so their menus stay on the card."],
          ["Health Age", "Card and bar side by side.", "The card above its bar, full width."],
          ["Legend", "Three columns (horizontal) or one (vertical).", "Always one column."],
        ]} />
      </Section>

      <Section id="content" title="Content & voice">
        <SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={[
          ["Entity names", "“Your Score”, “Team”, “Org Score” on score cards; “You”, “Team”, “Org” on Health Age, as in the design. A team is identified by its System Tag."],
          ["Header", "“TEAM(S) YOU'RE PART OF”, upper case, with a typographic apostrophe."],
          ["Health Age sentence", "“2 yrs 5 mo younger than actual age”, the numbers and “younger” / “older” bold."],
          ["Comparability", "Never compare across different measures, periods, or calculation methods; the Story says what it compares in its explanatory line."],
        ]} />
      </Section>

      <Section id="a11y" title="Accessibility">
        <Prose>
          <p><b>Toggles are switches</b> (<code>role="switch"</code>, <code>aria-checked</code>, “Show Team”), so a series can be shown or hidden from the keyboard.</p>
          <p><b>Colour isn't the only signal:</b> every series has a card with its name and score, and every chart has a Table View with every value.</p>
          <p><b>The radar</b> is an image with a label naming its series. <b>The Health Age bar</b> says its gap in words.</p>
        </Prose>
      </Section>

      <Section id="props" title="Props & usage">
        <PropsTable rows={[
          { name: "entities", type: "[{ id, kind: \"you\"|\"team\"|\"org\", label, tag?, score?, values?, age? }]", required: true, desc: "Who is compared. `values` are one per part (radar, area); `age` is { value, gap } (Health Age)." },
          { name: "parts", type: "string[]", required: true, desc: "The parts every entity is scored on, in order (radar, area)." },
          { name: "ComparisonRadar.legend", type: "\"side\" | \"below\"", def: "\"side\"", desc: "Where the legend sits." },
          { name: "HealthAgeComparison.span", type: "number", def: "10", desc: "Years that fill half the track." },
          { name: "title / line", type: "string", desc: "The Story title and explanatory line." },
        ]} />
        <CodeBlock label="Usage" code={`<ComparisonRadar parts={explorers} entities={[team, org]} />\n<ComparisonArea parts={explorers} entities={[team, org]} />\n<HealthAgeComparison entities={[you, ...teams, org]} />`} />
        <Prose><p>Series colours come from <code>seriesColor(entities)</code> so every form and the legend agree. <FileBadge>lib/scopeData.js</FileBadge>'s <code>groupPartMeans</code> gives a team's part scores; teams under {SUPPRESS_BELOW} people must be left out before they reach the Story.</p></Prose>
      </Section>

      <Section id="done" title="Done checklist">
        <List items={[
          "Each entity has a card with its score and a toggle in its series colour; toggling shows or hides its series.",
          "You and the Org start on, teams off; with no You, the first team starts on.",
          "The radar and area use the same colours as the legend.",
          "Area: Sort on, Sort by and Clear reorder the parts; the tooltip lists every shown entity at the hovered part.",
          "Health Age: younger grows left in green, older right in red, from the centre line.",
          "No team under 5 people appears. Every form has a Table View.",
        ]} />
      </Section>

      <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
        <Prose><p><b>1. The legend</b> (13622:39436), with the design's sample values</p></Prose>
        <FigmaParity checks={LEGEND_CHECKS} width={247}>{classic(<LegendDemo layout="vertical" />)}</FigmaParity>
        <Prose><p><b>2. Health Age</b> (13622:39125)</p></Prose>
        <FigmaParity checks={AGE_CHECKS}>{classic(<HealthAgeComparison entities={AGE} />)}</FigmaParity>
        <Prose>
          <p><b>Decisions for you.</b> (1) <b>Team colours.</b> No frame shows a team switched on; teams take Team Blue, Mint Green and Lavender Violet. (2) <b>The Org colour</b> is Orange Coral 600, a primitive; the system has no semantic token for it. (3) <b>Health Age bar scale.</b> The frames' bar lengths don't follow their own numbers (2 yrs 5 mo younger is longer than 5 yrs 5 mo older); we use one scale, 10 years to half the track. (4) <b>“136 yrs 3 mo”</b> for the Org is a sample slip. (5) <b>Sort on / Sort by</b> have no designed menus; built as two small menus (which entity; highest or lowest first). (6) <b>No “You” or team data</b> exists in this prototype; live examples use departments as teams. A real product needs a person's own score and their team membership.</p>
        </Prose>
      </Section>
    </>
  );
}

function ResearcherView({ style }) {
  return (
    <>
      <Section id="story" title="The data story" lead="A score means more next to the right reference point.">
        <Prose><p>A 62 is good news in a team where most are at 50, and a warning where most are at 80. Comparison puts the same measure for you, your teams and the organisation side by side, so the reader sees where they sit, not just the number.</p></Prose>
        <Callout title="The idea in one line">Same measure, same period, same method: only the group changes.</Callout>
      </Section>
      <Section id="glance" title="At a glance">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Question it answers" value="How do I compare?" />
          <Fact label="Unit" value="An entity" note="You, a team, the organisation." />
          <Fact label="Privacy" value={`Teams of ${SUPPRESS_BELOW}+`} note="Smaller teams never appear." />
          <Fact label="People behind it" value={`${EMPLOYEE_COUNT} respondents`} note="Synthetic data in this prototype." />
        </div>
      </Section>
      <Section id="live" title="Live from the data">
        <Variant title="Two departments and the organisation"><StoryStage style={style} kind={meta.kind} width={808}><ComparisonArea parts={DIMENSIONS} entities={LIVE} /></StoryStage></Variant>
        <SimpleTable head={["In the Story", "Data behind it"]} widths={["32%", "68%"]} rows={[
          ["A team's value on a part", "The mean of that part's score for the team's members, latest round."],
          ["The Org's value", "The organisation's mean for the part, latest round."],
          ["“You”", "Not available here: the data has no way to say which respondent is the reader."],
          ["Health Age", "Not available: the data has no ages."],
        ]} />
      </Section>
      <Section id="limits" title="Constraints">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="A team is inside the organisation.">The team's people are part of the Org average, so the two aren't independent; a small team pulls the Org less.</Limit>
          <Limit n="2" title="Differences aren't tested.">Two points between a team and the Org may be noise, especially for small teams.</Limit>
          <Limit n="3" title="One person isn't a group.">Comparing one person's score with a group's mean compares a single answer with an average; it says where they sit, not whether it's unusual.</Limit>
          <Limit n="4" title="Comparability is a rule, not a check.">The component can't tell if two series used different methods; the data must guarantee it.</Limit>
        </div>
      </Section>
      <Section id="questions" title="What it answers, and what it does not">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>It answers</span><List items={["Where do I sit against my teams and the organisation?", "On which parts is the gap widest?", "Is my Health Age younger or older than the others'?"]} /></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>It does not answer</span><List items={["Why is there a gap?", "Is the gap significant?", "How has the gap changed? (Trend)"]} /></div>
        </Two>
      </Section>
      <Section id="open" title="Open questions">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="A" title="Which teams count?">A person can be in several teams; which are listed, and in what order, needs a rule.</Limit>
          <Limit n="B" title="External benchmarks">The family allows reference points beyond the organisation (industry, region). None exist in this prototype.</Limit>
        </div>
      </Section>
    </>
  );
}

export default function ComparisonDoc({ style, view = "developer" }) {
  return view === "researcher" ? <ResearcherView style={style} /> : <DeveloperView style={style} />;
}
