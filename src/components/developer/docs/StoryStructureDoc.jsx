import { useState } from "react";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../lib/ds.js";
import { StoryCard, EvidenceSection } from "../../scope/stories/StoryCard.jsx";
import { CompareControl, ViewSwitch, CopyTable, useCompare } from "../../scope/stories/controls.jsx";
import { ScopeNavContext } from "../../scope/scopeNav.js";
import { STORIES } from "../../widgetbuilder/storyCatalog.jsx";
import { SAMPLE_SUBJECTS } from "../sampleSubjects.js";
import { Section, Prose, Anatomy, StoryStage, Callout, CodeBlock, Variant } from "../docKit.jsx";
import { SpecTable, Two, List, Limit, card_ } from "../docParts.jsx";
import { DocLink } from "../DataNeeds.jsx";

/* ================================================================== */
/* STORY STRUCTURE — the blank Story, and the rules every Story is built */
/* to, the counterpart of Widgets › Widget structure. What a Story is made */
/* of (card → title and controls → explanatory line → content → note), how */
/* it responds to its own width, and where a widget ends and a Story       */
/* begins. The blank Story is the real StoryCard with the real controls,   */
/* so what's measured here is what ships.                                  */
/* ================================================================== */
export const meta = {
  id: "story-structure", name: "Story structure", group: "Stories", kind: "Story structure",
  blurb: "The skeleton every Story is built on (title, controls, explanatory line, content, note), how it responds to its own width, and the line between a widget and a Story.",
  source: "components/scope/stories/StoryCard.jsx (StoryCard, ScopeCard, EvidenceSection) · stories/controls.jsx · stories/storyWidth.js · widgetbuilder/storyCatalog.jsx",
};
export const toc = [
  { id: "overview", label: "Overview" }, { id: "boundary", label: "Widget, Story, Scope" }, { id: "skeleton", label: "The skeleton" },
  { id: "anatomy", label: "Anatomy" }, { id: "parts", label: "The parts" }, { id: "widths", label: "Widths" }, { id: "examples", label: "Examples" },
  { id: "build", label: "Building a Story" }, { id: "rules", label: "Can and can't" }, { id: "checklist", label: "New Story checklist" },
];

const slot = (label, h = 120) => (
  <div style={{ height: h, border: `${dsBorder.sm}px dashed ${ds.border.secondary}`, borderRadius: dsRadius.sm, background: ds.bg.secondary, display: "flex", alignItems: "center", justifyContent: "center", ...dsText("Text 2xs", 500), color: ds.text.quaternary, textAlign: "center", padding: 8, boxSizing: "border-box" }}>{label}</div>
);

/* The blank Story: the real shell and the real controls; the dashed slots only mark where content goes. */
function BlankStory({ withEvidence = true, withNote = true }) {
  const cmp = useCompare();
  const [view, setView] = useState("chart");
  return (
    <div data-story-blank>
      <StoryCard
        title="Story Title"
        controls={<><CompareControl cmp={cmp} /><ViewSwitch view={view} onChange={setView} /><CopyTable getText={() => "Name\tScore\nExample\t64"} /></>}
        line="One line on what this Story does. Never the data."
        note={withNote ? "An optional note: what isn't shown here, and why." : undefined}
      >
        <div data-part="story-content">{slot(view === "chart" ? "Content · one chart, list or table (Chart View)" : "Content · the same data as a table (Table View)", 140)}</div>
        {withEvidence && <EvidenceSection>{slot("Evidence Section · what backs the content up", 40)}</EvidenceSection>}
      </StoryCard>
    </div>
  );
}

const PARTS = [
  { id: "card", name: "Card (shell)", note: "Up to 808px wide, 16px padding, 16px between parts, radius/widget, 1px border/secondary. Refined: no border, a soft shadow, 28 / 32px padding.", find: (r) => [r.querySelector("[data-story-blank] > *")] },
  { id: "title", name: "Title", note: "What the Story is, title case, under 7 words.", find: (r) => [r.querySelector('[data-part="story-title"]')] },
  { id: "controls", name: "Controls", note: "Compare, Chart / Table, Copy Table, a choice of what to show. Beside the title; a row of their own on a compact card.", find: (r) => [r.querySelector('[data-part="story-controls"]')] },
  { id: "line", name: "Explanatory line", note: "Optional. What the Story does, never a reading of the data.", find: (r) => [r.querySelector('[data-part="story-line"]')] },
  { id: "content", name: "Content", note: "The one chart, list or table the Story is about.", find: (r) => [r.querySelector('[data-part="story-content"]')] },
  { id: "evidence", name: "Evidence Section", note: "Optional. A hairline above and below, 16px of space: a bar, a key, a sentence that backs the content up.", find: (r) => [r.querySelector('[data-part="evidence"]')] },
  { id: "note", name: "Note", note: "Optional. Short: what's left out, a caveat, how it's worked out.", find: (r) => [r.querySelector('[data-part="story-note"]')] },
];

const CAN = [
  "Answer one question in depth: a chart, a list or a table, with the controls to read it differently.",
  "Carry what a widget can't: how it's worked out, caveats, what's left out (in the note), a Table View, a comparison with an earlier round.",
  "Offer a Table View of the same data whenever it draws a chart, and Copy Table with it.",
  "Offer Compare previous rounds when an earlier round means something (never on a Trend Story: a trend already shows every round).",
  "Let the reader choose what to show: tabs for a small fixed set (up to four), a dropdown when the options can grow.",
  "Have more than one form (Breakdown: Radar, Area, Bars, List, Zones), chosen by the number of parts it shows.",
  "Go one layer deeper (Actions): the Scope swaps its body for the layer and shows a breadcrumb back.",
  "Draw a compact layout under 560px of card width and a tight one under 400px, from its own width (useStoryWidth).",
];
const CANNOT = [
  "Be wider than 808px, scroll sideways, or let anything spill past the card at any width from 320px.",
  "Put a reading of the data in the explanatory line (“49% of people are…”). The line says what the Story does; the content says what the data says.",
  "Answer two questions. Two questions are two Stories.",
  "Repeat the widget it opens from. The widget is the glance; the Story is what's behind it.",
  "Show a group of fewer than 5 people, or anyone else's answers in a personal report.",
  "Make a research claim without a source (Love Science and Citations only show with real content).",
  "Hide meaning behind hover alone: on a phone hover becomes tap, and every number in a chart is in its Table View.",
  "Invent its own card, title style, divider or control. Build it from StoryCard, EvidenceSection and the controls.",
];

export default function StoryStructureDoc({ style }) {
  const subject = SAMPLE_SUBJECTS[1]?.subject;
  const examples = ["summary", "diagnostic", "trend"].map((id) => STORIES.find((s) => s.id === id)).filter((d) => d && subject && !d.blocked?.(subject));
  return (
    <>
      <Section id="overview" title="Overview" lead="Every Story is the same card with the same parts, in the same order. What changes is the content, and only within these rules.">
        <Prose>
          <p>A Scope is a stack of Stories. Each Story answers <b>one question</b> about the widget it opens from, in more depth than a widget can: a <b>title</b> (what it is) with its <b>controls</b>, an optional <b>explanatory line</b> (what it does), the <b>content</b> (one chart, list or table), an optional <b>Evidence Section</b>, and an optional <b>note</b>. A Story measures its own card and lays itself out for that width, so the same Story works in a 1,000px Scope, beside the report, and on a phone.</p>
        </Prose>
      </Section>

      <Section id="boundary" title="Widget, Story, Scope" lead="Where each one ends. Most mistakes are something in the wrong one of these.">
        <SpecTable head={["", "Widget", "Story", "Scope"]} widths={["16%", "28%", "28%", "28%"]} rows={[
          ["Answers", "One question, at a glance.", "One question, in depth.", "Everything behind one widget."],
          ["Made of", "Header → Insight → Evidence → Action Bar, fixed heights.", "Title + controls → line → content → Evidence → note.", "A stack of Stories, one per question."],
          ["Size", "1x1, 2x2 or 3x3 cells; never fluid.", "Fluid up to 808px; compact under 560, tight under 400.", "Beside the report (up to 1,000px) or expanded; a sheet on a phone."],
          ["Interaction", "Hover lifts it; a click opens its Scope.", "Controls (Compare, Chart / Table, tabs), hover and tap on charts, Copy Table.", "Scrolls, zooms, goes one layer deeper (Actions)."],
          ["Text", "No explanations, no side notes.", "Explains: how it's worked out, caveats, what's left out.", "Nothing of its own beyond its title."],
          ["Rules", <DocLink key="ws" id="widget-structure">Widget structure</DocLink>, "This page", <DocLink key="sf" id="story-families">Story families</DocLink>],
        ]} />
      </Section>

      <Section id="skeleton" title="The skeleton" lead="The blank Story: the real StoryCard and the real controls (they work), with dashed slots where the content goes. Switch Style in the header to see Current and Refined.">
        <StoryStage style={style}><BlankStory /></StoryStage>
        <Two>
          <Variant title="Content only"><StoryStage style={style} pad={16}><StoryCard title="Story Title"><div data-part="story-content">{slot("Content", 100)}</div></StoryCard></StoryStage></Variant>
          <Variant title="With a line and a note"><StoryStage style={style} pad={16}><StoryCard title="Story Title" line="What this Story does." note="What isn't shown here."><div data-part="story-content">{slot("Content", 100)}</div></StoryCard></StoryStage></Variant>
        </Two>
      </Section>

      <Section id="anatomy" title="Anatomy" lead="Numbered on the blank Story, then measured from the browser.">
        <Anatomy parts={PARTS} style={style} width={808}><BlankStory /></Anatomy>
      </Section>

      <Section id="parts" title="The parts" lead="What each part is for, what may go in it, and what may not.">
        <SpecTable head={["Part", "Holds", "Never", "Spec (Current)"]} widths={["14%", "32%", "30%", "24%"]} rows={[
          ["Card", "Everything below, in this order.", "A second card inside it, a scrollbar, a width past 808px.", "surface/General/card, 1px border/secondary, radius/widget (18), 16px padding and gaps."],
          ["Title", "What the Story is: “What Stands Out”, “Score History”.", "A value or a result; more than 7 words; a full stop.", "Text lg / Bold (18 / 28), text/primary."],
          ["Controls", "Compare previous rounds, Chart / Table, Copy Table, a choice of what to show (tabs up to four, else a dropdown), Filters.", "Anything that changes another Story; a control on a Trend Story that compares rounds.", "Beside the title; on a compact card a full-width row under it. Gaps 8px."],
          ["Explanatory line", "What the Story does, in one sentence.", "A number or a reading of the data.", "Text sm / Regular (14 / 20), text/secondary."],
          ["Content", "One chart, list or table; Table View holds the same data.", "A second unrelated chart; sideways scroll; meaning on hover only.", "Fills the card's width; charts measure their own space."],
          ["Evidence Section", "What backs the content up: a status bar, a key, a short sentence.", "A new conclusion, or the content again.", "1px border/tertiary above and below, 16px padding."],
          ["Note", "What's left out and why, a caveat, how it's worked out.", "Advice or a call to action (those are Actions).", "Text xs / Regular (13 / 18), text/tertiary."],
        ]} />
        <Callout title="Order">Title and controls → explanatory line → content → Evidence Section → note. Leave a part out; never reorder or repeat one.</Callout>
      </Section>

      <Section id="widths" title="Widths" lead="A Story responds to its own card's width, not the window. The same blank Story at three widths.">
        <SpecTable head={["Card width", "Name", "What changes"]} widths={["20%", "16%", "64%"]} rows={[
          ["560px and up", "Wide", "The designed layout (808px is the design's width)."],
          ["400 to 559px", "Compact", "Controls take their own row; charts switch to their compact form (numbered marks and a key, stacked rows); hover becomes tap."],
          ["Under 400px", "Tight", "The narrowest forms: lists stack fully, tables become row blocks, sentences shorten."],
        ]} />
        <div style={{ display: "flex", gap: dsSpace[24], flexWrap: "wrap", alignItems: "flex-start" }}>
          {[320, 480].map((w) => <Variant key={w} title={`${w}px`}><StoryStage style={style} width={w} pad={16}><BlankStory withEvidence={false} /></StoryStage></Variant>)}
        </div>
      </Section>

      {examples.length > 0 && (
        <Section id="examples" title="Examples" lead={`Real Stories built on the skeleton, for ${SAMPLE_SUBJECTS[1].label.toLowerCase()} (${subject.label}).`}>
          <StoryStage style={style}>
            <ScopeNavContext.Provider value={{ depth: 0, open: () => {} }}>
              <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>{examples.map((d) => <div key={d.id}>{d.render(subject, { stories: [d.id] })}</div>)}</div>
            </ScopeNavContext.Provider>
          </StoryStage>
        </Section>
      )}

      <Section id="build" title="Building a Story" lead="A Story is a StoryCard with its content inside. Width, the compact layouts and the style all come from the shell.">
        <CodeBlock label="A Story with controls, content and evidence" code={`import { StoryCard, EvidenceSection } from "components/scope/stories/StoryCard.jsx";
import { CompareControl, ViewSwitch, CopyTable, useCompare } from "components/scope/stories/controls.jsx";
import { useStoryWidth } from "components/scope/stories/storyWidth.js";

function MyStory({ rows }) {
  const cmp = useCompare();
  const [view, setView] = useState("chart");
  return (
    <StoryCard
      title="What Stands Out"
      controls={<><CompareControl cmp={cmp} /><ViewSwitch view={view} onChange={setView} /><CopyTable getText={() => toTsv(rows)} /></>}
      line="The strongest and weakest parts, and how far apart they are."
      note="Groups under 5 people aren't shown."
    >
      {view === "chart" ? <Chart rows={rows} /> : <DataTable rows={rows} />}
      <EvidenceSection>…a bar or a key…</EvidenceSection>
    </StoryCard>
  );
}

// Inside the card, read the card's own width:
const { compact, tight } = useStoryWidth();`} />
        <Prose><p>Register it in the catalogue (<code>widgetbuilder/storyCatalog.jsx</code>): an <code>id</code>, a <code>name</code>, its <code>family</code>, a one-line <code>purpose</code>, <code>blocked(subject)</code> (a plain reason, or null) and <code>render(subject)</code>. Then it can be added to any Scope in the Widget Builder, and the <DocLink id="story-sweep">Story sweep</DocLink> draws it at 320, 560 and 808px.</p></Prose>
      </Section>

      <Section id="rules" title="Can and can't" lead="What can and can't happen when a Story is made.">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>A Story can</span><List items={CAN} /></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>A Story can't</span><List items={CANNOT} /></div>
        </Two>
      </Section>

      <Section id="checklist" title="New Story checklist" lead="Before a new Story goes into the catalogue.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            ["It answers one question.", "Say it in one sentence. If it needs two, it's two Stories."],
            ["It's built on the skeleton.", "StoryCard, the shared controls and EvidenceSection; no card or title of its own."],
            ["It has a purpose and a boundary.", "One line each in the catalogue: what it does, and what it doesn't."],
            ["It reads real data, or says it's sample.", "Placeholder copy carries the Sample tag; nothing is invented."],
            ["Its chart has a Table View.", "The same rows, with Copy Table."],
            ["It works from 320 to 808px.", "Compact and tight layouts; no sideways scroll; the Story sweep reports no overflow."],
            ["It's private by default.", "Groups under 5 are hidden; a personal Story shows only that person's answers."],
            ["Its data has a contract.", "Its Developer page's Data it needs section says what the backend sends."],
          ].map(([t, b], i) => <Limit key={t} n={String(i + 1)} title={t}>{b}</Limit>)}
        </div>
      </Section>
    </>
  );
}
