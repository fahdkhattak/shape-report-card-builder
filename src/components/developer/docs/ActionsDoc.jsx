import { ds, dsText, dsSpace } from "../../../lib/ds.js";
import { DRIVER_DIMENSION } from "../../../lib/dataset.js";
import { driverAt, LAST } from "../../../lib/scopeData.js";
import { ActionsStoryBar, ActionsCta, ActionsLayer, ActionsYouCanTakeCard, ThinkAboutCard, PlaybookCard, LoveScienceCard, CitationsCard } from "../../scope/stories/ActionStories.jsx";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import { Section, Prose, Callout, Variant, StoryStage, PropsTable, CodeBlock, FileBadge, FigmaParity, lightHexOf } from "../docKit.jsx";
import { SpecTable, SimpleTable, T, Fact, Limit, Two, List, card_ } from "../docParts.jsx";
import DataNeeds from "../DataNeeds.jsx";

export const meta = {
  id: "actions", name: "Actions", group: "Stories", kind: "Actions",
  blurb: "What people can do about a Driver, one layer deeper than the Scope: the doorway into it, and the Action Stories inside.",
  source: "components/scope/stories/ActionStories.jsx", figma: "13622:36874",
  views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }],
};
export const toc = {
  developer: [
    { id: "overview", label: "Overview" }, { id: "forms", label: "The forms" }, { id: "spec", label: "Specification" },
    { id: "states", label: "States & variants" }, { id: "responsive", label: "Responsive" }, { id: "content", label: "Content & voice" },
    { id: "a11y", label: "Accessibility" }, { id: "data", label: "Data it needs" }, { id: "props", label: "Props & usage" }, { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
  ],
  researcher: [
    { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "limits", label: "Constraints" }, { id: "open", label: "Open questions" },
  ],
};

/* The design's own sample copy (13622:37133 ... 13622:36973), used for the parity checks and as the example of each card. */
const D = {
  actions: { title: "Streamline decisions, accelerate outcomes", subtitle: "Reducing bottlenecks in your approval workflows", summary: "Some parts of work feel clear and easy to move through. Others create delays or ask for more effort than they should.", body: "Frustrated by slow approvals holding up your projects? Keep it straightforward; focus on clarity! That means streamlining your decision-making processes for a big impact on overall team velocity and project delivery. We know it's easier said than done, but here are practical ways to reduce friction in your approval workflows and keep things moving forward." },
  think: ["What are the common bottlenecks slowing down approvals in my current workflow?", "How often do decisions stall because the right stakeholders aren't looped in early enough?", "What is the average turnaround time for approvals in my team or organisation?"],
  playbook: [
    ["Start with what's stuck.", "Audit your current approval chain. Identify the top three bottlenecks that consistently delay progress. Map out who truly needs to sign off versus who is included out of habit."],
    ["Set clear criteria.", "Define what “approved” actually means for each stage. Create decision rubrics so reviewers know exactly what to evaluate, reducing ambiguity and unnecessary revision cycles."],
    ["Prep in advance.", "Provide reviewers with concise briefs, context, and clear deadlines. Batch similar approvals together and establish regular review windows to prevent ad-hoc delays from derailing your timeline."],
  ],
  science: { finding: "A groundbreaking study in the Journal of Epidemiology tracked 65,226 participants over 7 years and found that each daily serving of fruits and vegetables reduced mortality risk by 5%", body: "Think about that: every apple, every handful of spinach is literally adding life to your years. But here's the real power move: you are in control. Every time you choose a fruit or vegetable, you're not just following advice, you're actively engineering your future health. The choice is yours, and it'll also show in your Health Age too." },
  cites: [
    { text: "Gallup, Inc. “How to Improve Employee Engagement in the Workplace.” Gallup.com. Gallup, January 18, 2022.", url: "https://www.gallup.com/workplace/285674/improve-employee-engagement-workplace.aspx" },
    { text: "Foster, Sarah. “Survey: 55% Expecting to Search for a New Job over the next 12 Months.” Bankrate, 2021.", url: "https://www.bankrate.com/personal-finance/job-seekers-survey-august-2021/" },
    { text: "Adkins, Amy, and Jim Harter. “Employees Want a Lot More from Their Managers.” Gallup.com. Gallup, November 20, 2021.", url: "https://www.gallup.com/workplace/236570/employees-lot-managers.aspx" },
  ],
};
/* Real Drivers for the layer: the Corporate Culture Explorer's, weakest first. */
const DRIVERS = Object.keys(DRIVER_DIMENSION).filter((d) => DRIVER_DIMENSION[d] === "Corporate Culture").sort((a, b) => driverAt(a, LAST) - driverAt(b, LAST));

const classic = (n) => <StoryStyleContext.Provider value="classic">{n}</StoryStyleContext.Provider>;
const px = (v) => Math.round(parseFloat(v) * 100) / 100;
const css = (el) => getComputedStyle(el);
const q = (r, s) => r.querySelector(s);
const rect = (el) => el.getBoundingClientRect();
const size = (el) => `${Math.round(rect(el).width)} × ${Math.round(rect(el).height)}`;
const type = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight)} · ${css(el).fontWeight}`;
const shell = (el) => { const s = css(el); return `${lightHexOf(el, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(el, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; };

const BAR_CHECKS = [
  { part: "Bar size", node: "13622:36875", figma: "808 × 62", read: (r) => size(q(r, '[data-story="actions-bar"]')) },
  { part: "Bar fill · border · radius · padding", node: "13622:36875", figma: "#e5e4e3 · 1 #cecdcc · 18 · 16", read: (r) => shell(q(r, '[data-story="actions-bar"]')) },
  { part: "Title: type · colour", node: "13622:36877", figma: "18/28 · 700 · #1d1a1b", read: (r) => { const t = q(r, '[data-part="title"]'); return `${type(t)} · ${lightHexOf(t, ["color"])}`; } },
  { part: "Read More: height · fill · text", node: "13622:36878", figma: "28 · #231f20 · #e5e4e3 · 14/20 · 400", read: (r) => { const p = q(r, '[data-part="dark-pill"]'); return `${Math.round(rect(p).height)} · ${lightHexOf(p, ["background"])} · ${lightHexOf(p, ["color"])} · ${type(p)}`; } },
  { part: "Read More: padding left · right · icon", node: "13622:36878", figma: "14 · 12 · 20", read: (r) => { const p = q(r, '[data-part="dark-pill"]'), s = css(p); return `${px(s.paddingLeft)} · ${px(s.paddingRight)} · ${Math.round(rect(p.querySelector("svg")).width)}`; } },
];
const CTA_CHECKS = [
  // Width isn't compared: the label renders at 129.x px in the browser against Figma's 130px text box, so the pill is
  // 157 wide against 158 from font rasterisation alone. Everything the component controls is checked instead.
  { part: "CTA: height · padding · fill · text", node: "13622:37128", figma: "28 · 14/14 · #231f20 · 14/20 · 400", read: (r) => { const p = q(r, '[data-part="dark-pill"]'), s = css(p); return `${Math.round(rect(p).height)} · ${px(s.paddingLeft)}/${px(s.paddingRight)} · ${lightHexOf(p, ["background"])} · ${type(p)}`; } },
];
const card = (r, id) => q(r, `[data-story="${id}"]`);
const CARD_CHECKS = [
  { part: "Card fill · border · radius · padding", node: "13622:37133", figma: "#ffffff · 1 #cecdcc · 18 · 16", read: (r) => shell(card(r, "action-actions")) },
  { part: "Actions you can take: headline · subhead", node: "13622:37139", figma: "18/28 · 700 · 14/20 · 700", read: (r) => `${type(q(r, '[data-part="headline"]'))} · ${type(q(r, '[data-part="subhead"]'))}` },
  { part: "Body text: type · colour", node: "13622:37141", figma: "14/20 · 400 · #504c4d", read: (r) => { const p = card(r, "action-actions").querySelectorAll("p")[3]; return `${type(p)} · ${lightHexOf(p, ["color"])}`; } },
  { part: "Think About: art tile fill · radius · padding", node: "13622:37148", figma: "#f2f2f2 · 12 · 16", read: (r) => { const t = q(card(r, "action-think"), '[data-part="art-tile"]'), s = css(t); return `${lightHexOf(t, ["background"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; } },
  { part: "Think About: tile → list gap", node: "13622:37147", figma: "20", read: (r) => { const c = card(r, "action-think"); return px(rect(c.querySelector("ul")).left - rect(q(c, '[data-part="art-tile"]')).right); } },
  { part: "Playbook: tile → list gap · illustration", node: "13622:37163", figma: "16 · 48 × 48", read: (r) => { const c = card(r, "action-playbook"), t = q(c, '[data-part="art-tile"]'); return `${px(rect(c.querySelector("ul")).left - rect(t).right)} · ${size(t.querySelector("img"))}`; } },
  { part: "Bullets: indent · type", node: "13622:37180", figma: "21 · 14/20 · 400", read: (r) => { const u = card(r, "action-playbook").querySelector("ul"); return `${px(css(u).paddingLeft)} · ${type(u)}`; } },
  { part: "Love Science: finding weight", node: "13622:37196", figma: "700", read: (r) => css(card(r, "action-science").querySelectorAll("p")[1]).fontWeight },
];
const NAV_CHECKS = [
  { part: "Nav fill · radius · padding · row gap", node: "13622:36917", figma: "#f9f8f7 · 18 · 16 · 2", read: (r) => { const n = q(r, '[data-part="driver-nav"]'), s = css(n); return `${lightHexOf(n, ["background"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)} · ${px(s.rowGap)}`; } },
  { part: "Row: padding · type · colour", node: "13622:36918", figma: "8/18 · 13/18 · 500 · #504c4d", read: (r) => { const b = q(r, '[data-part="driver-nav"] button:not([aria-current])'), s = css(b); return `${px(s.paddingTop)}/${px(s.paddingLeft)} · ${type(b)} · ${lightHexOf(b, ["color"])}`; } },
  { part: "Open row: fill · weight", node: "13622:36923", figma: "#e5e4e3 · 700", read: (r) => { const b = q(r, '[data-part="driver-nav"] [aria-current]'); return `${lightHexOf(b, ["background"])} · ${css(b).fontWeight}`; } },
];

function SampleCards() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], width: 533 }}>
      <ActionsYouCanTakeCard g={D.actions} shareText={() => ""} sample={false} />
      <ThinkAboutCard items={D.think} sample={false} />
      <PlaybookCard items={D.playbook} sample={false} />
      <LoveScienceCard science={D.science} sample={false} />
      <CitationsCard cites={D.cites} defaultOpen />
    </div>
  );
}

/* ======================================================================================================== */
function DeveloperView({ style }) {
  return (
    <>
      <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
        <Prose>
          <p><b>Purpose:</b> helps people move from understanding a result to considering what they can do next. Only for widgets that contain Drivers; the guidance changes with the selected Driver.</p>
          <p><b>Can contain:</b> Actions You Can Take (high-level guidance), Think About (questions to reflect on), From the Playbook (detailed, practical steps), Love Science (research-led guidance), and more types later.</p>
          <p><b>Boundary:</b> never shown inline in a Scope; always one layer deeper. The first Action set is Actions You Can Take and Think About; the others are added one at a time. In the product, adding Actions costs tokens and changes a widget's price.</p>
          <p><b>Two ways in, one layer:</b> the grey <i>Actions You Can Take</i> bar opens it with every Driver; the dark <i>Actions you can take</i> pill on a specific Driver (the Diagnostic's Biggest Pressure Point) opens it on that Driver.</p>
        </Prose>
      </Section>

      <Section id="forms" title="The forms">
        <SimpleTable head={["Form", "What it is", "Set"]} widths={["26%", "54%", "20%"]} rows={[
          ["Actions bar", "A grey Story bar with “Read More ›”. The doorway into the layer from a Scope.", "Doorway"],
          ["Actions CTA", "The dark pill on a specific Driver.", "Doorway"],
          ["Driver nav", "Every Driver with its score, in a light panel; the open one bold on grey.", "Layer"],
          ["Actions You Can Take", "Headline, subhead, two paragraphs, and Share this guidance.", "First set"],
          ["Think About", "An illustration beside three reflective questions.", "First set"],
          ["From the Playbook", "An illustration beside practical steps.", "Optional"],
          ["Love Science", "An illustration beside a research finding in bold and what it means.", "Optional"],
          ["Citations", "The sources, collapsed until opened.", "With Love Science"],
        ]} />
      </Section>

      <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark).">
        <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[
          ["Actions bar", "Shell", <span key="b" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{T("bg/secondary")}, 1px {T("border/secondary")}, 18px radius, 16px padding; title Text lg / Bold {T("text/primary")}. The whole bar is the button.</span>],
          ["Dark pill", "Two sizes", <span key="p" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{T("button/brand/primary/bg/default")} with {T("button/brand/primary/items/default text")}. Small: 28px, Text sm, 12px sides (+2 text padding), 20px chevron. Extra small: 24px, Text 2xs, 6px sides, 16px chevron. The CTA has no chevron.</span>],
          ["Layer", "Layout", "Driver nav a third of the width, cards two thirds, 16px apart; below about 640px the nav sits above the cards."],
          ["Driver nav", "Panel", <span key="n" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{T("surface/General/card-within-card")}, 18px radius, 16px top and bottom, rows 2px apart. Row: 8px / 18px padding, Text xs / Medium {T("text/secondary")}, the score bold in its status colour. Open row: {T("button/brand/ghost/bg/hover")}, name bold.</span>],
          ["Cards", "Shell", "The Story card: white, 1px border/secondary, 18px radius, 16px padding, 16px gap. Title Text lg / Bold."],
          ["", "Text", <span key="t" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Text sm {T("text/secondary")} throughout; the headline Text lg / Bold, the subhead and the Love Science finding Text sm / Bold. Bullets indent 21px.</span>],
          ["", "Illustration tile", <span key="i" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>{T("bg/primary")}, radius/lg (12), 16px padding, a 48px illustration, as tall as the text beside it. 20px to the text in Think About, 16px elsewhere.</span>],
          ["Citations", "Card", "Text sm / Bold title and a 16px chevron; open: a hairline, then each source (Text sm, the link in text/primary), 14px apart."],
        ]} />
      </Section>

      <Section id="states" title="States & variants" lead="The doorways and the layer, live.">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <Variant title="Actions bar"><StoryStage style={style} kind={meta.kind} width={808}><ActionsStoryBar drivers={DRIVERS} /></StoryStage></Variant>
          <Variant title="Actions bar, extra small pill"><StoryStage style={style} kind={meta.kind} width={808}><ActionsStoryBar drivers={DRIVERS} size="xs" /></StoryStage></Variant>
          <Variant title="Actions CTA" note="Small and extra small."><StoryStage style={style} kind={meta.kind} width={808}><div style={{ display: "flex", gap: dsSpace[16], alignItems: "center" }}><ActionsCta driver={DRIVERS[0]} /><ActionsCta driver={DRIVERS[0]} size="xs" /></div></StoryStage></Variant>
          <Variant title="The layer, real Drivers" note="Templated sample copy that follows the Driver's score. Love Science and Citations only appear when real content is supplied."><StoryStage style={style} kind={meta.kind} width={1000}><ActionsLayer drivers={DRIVERS} selected={DRIVERS[0]} /></StoryStage></Variant>
          <Variant title="Every card, with the design's sample copy"><StoryStage style={style} kind={meta.kind} width={581}><SampleCards /></StoryStage></Variant>
        </div>
      </Section>

      <Section id="responsive" title="Responsive">
        <Prose><p>The bar keeps title and pill on one line down to about 320px. In the layer, the nav and the cards wrap: under about 640px the nav sits on top at full width and the cards follow. The cards keep the illustration beside the text; at very narrow widths the text column is what narrows.</p></Prose>
        <Variant title="The layer at 480px"><StoryStage style={style} kind={meta.kind} width={480}><ActionsLayer drivers={DRIVERS.slice(0, 4)} selected={DRIVERS[0]} /></StoryStage></Variant>
      </Section>

      <Section id="content" title="Content & voice" lead="Written to the SHAPE Voice and Language Guide.">
        <SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={[
          ["Titles", "“Actions You Can Take” on the bar (a Story title, title case); “Actions you can take” on the CTA and the card, as the design writes them."],
          ["Sample copy", "Every card in the layer is templated and tagged “Sample copy”; real guidance per Driver is written upstream."],
          ["No em dashes", "The design's Love Science sample uses en dashes; the product copy uses a colon or a comma."],
          ["Claims", "Love Science states a study's finding; it needs a real, citable source before it ships, which is why it only appears with content supplied."],
        ]} />
      </Section>

      <Section id="a11y" title="Accessibility">
        <Prose>
          <p><b>The bar is one button</b> (role, Enter and Space), with the label “Actions You Can Take: read more”; the pill inside is decorative.</p>
          <p><b>The Driver nav</b> marks the open Driver with <code>aria-current</code>; scores are printed, so colour isn't the only signal.</p>
          <p><b>Illustrations</b> are decorative (empty alt). Citations' toggle uses <code>aria-expanded</code>.</p>
        </Prose>
      </Section>

      <DataNeeds id="actions" />
      <Section id="props" title="Props & usage">
        <PropsTable rows={[
          { name: "ActionsStoryBar.drivers", type: "string[]", required: true, desc: "The Drivers the layer will list; it opens on the weakest." },
          { name: "ActionsStoryBar.size", type: "\"sm\" | \"xs\"", def: "\"sm\"", desc: "The Read More pill's size." },
          { name: "ActionsCta.driver", type: "string", required: true, desc: "Opens the layer on this Driver alone." },
          { name: "ActionsLayer.drivers / selected", type: "string[] / string", required: true, desc: "Every Driver in the nav, and the one open first." },
          { name: "ActionsLayer.content", type: "{ [driver]: { science?, cites? } }", desc: "Real Love Science and Citations content per Driver. Without it those cards don't appear." },
        ]} />
        <CodeBlock label="Usage" code={`<ActionsStoryBar drivers={drivers} />\n<ActionsCta driver="Leaders" />\n<ActionsLayer drivers={drivers} selected="Leaders" content={{ Leaders: { science, cites } }} />`} />
        <Prose><p>The layer opens through the Scope's navigation (<FileBadge>scope/scopeNav.js</FileBadge>), which adds the “› Actions you can take” breadcrumb. Cards are exported one by one so other surfaces can reuse them.</p></Prose>
      </Section>

      <Section id="done" title="Done checklist">
        <List items={[
          "The bar and the CTA open the same layer; the CTA on its Driver, the bar on the weakest.",
          "The nav lists every Driver with its score; the open one is bold on grey.",
          "Actions You Can Take and Think About always appear; Playbook, Love Science and Citations only when the creator adds them.",
          "Cards match the design: Story card shell, 48px illustration tiles, bullets indented 21px.",
          "Sample copy is tagged until real guidance exists.",
        ]} />
      </Section>

      <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
        <Prose><p><b>1. The doorways</b> (13622:36875, 13622:37128)</p></Prose>
        <FigmaParity checks={BAR_CHECKS}>{classic(<ActionsStoryBar drivers={DRIVERS} />)}</FigmaParity>
        <FigmaParity checks={CTA_CHECKS} width={300}>{classic(<ActionsCta driver={DRIVERS[0]} />)}</FigmaParity>
        <Prose><p><b>2. The Action Stories</b> (13622:37133, 37143, 37159, 37181), with the design's sample copy</p></Prose>
        <FigmaParity checks={CARD_CHECKS} width={533}>{classic(<SampleCards />)}</FigmaParity>
        <Prose><p><b>3. The Driver nav</b> (13622:36917)</p></Prose>
        <FigmaParity checks={NAV_CHECKS} width={1000}>{classic(<ActionsLayer drivers={DRIVERS} selected={DRIVERS[1]} />)}</FigmaParity>
        <Prose>
          <p><b>What changed from the earlier build.</b> The bar and pills use the design-system button tokens; the nav became the design's light panel with bold-on-grey for the open Driver; Actions You Can Take gained the subhead and second paragraph and dropped the numbered steps the design doesn't have; Think About and Playbook use the design's illustrations instead of a blue icon tile; Love Science and Citations exist now.</p>
          <p><b>Decisions for you.</b> (1) <b>Love Science content.</b> It needs a real study per Driver; none exists in this prototype, so it is hidden unless supplied. (2) <b>The chevron on one nav row</b> (Approval Efficiency) in the design suggests sub-items; nothing is designed for them. (3) <b>The design's Love Science sample</b> is about nutrition and Health Age, beside approval-workflow guidance; it reads as placeholder content. (4) <b>Share this guidance</b> copies the guidance as text; what “share” should really do (link, email) isn't designed.</p>
        </Prose>
      </Section>
    </>
  );
}

function ResearcherView() {
  return (
    <>
      <Section id="story" title="The data story" lead="From what the result is to what to do about it.">
        <Prose><p>Every other Story describes. Actions is the one that suggests, so it is held one layer away from the evidence and clearly marked as guidance, not a finding.</p></Prose>
        <Callout title="The idea in one line">The Scope says where things stand. Actions says what to try next, Driver by Driver.</Callout>
      </Section>
      <Section id="glance" title="At a glance">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Question it answers" value="What can I do?" />
          <Fact label="Unit" value="A Driver" note="Guidance follows the selected Driver." />
          <Fact label="Data used" value="The Driver's score" note="Only to choose between protect, lift and fix wording." />
          <Fact label="Content" value="Sample copy" note="Real guidance is written upstream." />
        </div>
      </Section>
      <Section id="limits" title="Constraints">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="Guidance isn't evidence.">Nothing in the layer is computed from the data beyond which wording band a score falls in.</Limit>
          <Limit n="2" title="Research claims need sources.">Love Science quotes a study. Every claim needs a citation a reader can follow.</Limit>
          <Limit n="3" title="One Driver at a time.">The layer doesn't weigh Drivers against each other; the Diagnostic's Priority Map does.</Limit>
        </div>
      </Section>
      <Section id="open" title="Open questions">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Who writes the guidance?</span><p style={{ margin: 0, ...dsText("Text sm"), color: ds.text.secondary }}>Per Driver, per score band, reviewed by a specialist.</p></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Should guidance change by group?</span><p style={{ margin: 0, ...dsText("Text sm"), color: ds.text.secondary }}>A Driver low in one department may need different steps from one low everywhere.</p></div>
        </Two>
      </Section>
    </>
  );
}

export default function ActionsDoc({ style, view = "developer" }) {
  return view === "researcher" ? <ResearcherView /> : <DeveloperView style={style} />;
}
