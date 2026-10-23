import { ds, dsText, dsSpace } from "../../../lib/ds.js";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import { Section, Prose, Callout, Variant, StoryStage, PropsTable, CodeBlock, FigmaParity, lightHexOf } from "../docKit.jsx";
import { SpecTable, SimpleTable, Fact, Limit, Two, List, card_ } from "../docParts.jsx";
import WidthShowcase from "./WidthShowcase.jsx";
import DataNeeds from "../DataNeeds.jsx";

/* ================================================================== */
/* STORY DOC: one page shape for every Story family, driven by config,   */
/* so each family's page is content only. Same sections as the hand-     */
/* written pages: Developer (overview, forms, specification, states,     */
/* responsive, content, accessibility, props, done, design owner with    */
/* parity tables) and Researcher (data story, at a glance, what feeds    */
/* it, constraints, answers / non-answers, open questions).              */
/* ================================================================== */
export const classic = (n) => <StoryStyleContext.Provider value="classic">{n}</StoryStyleContext.Provider>;

/* Measuring helpers for parity checks (read in the browser, compared with values read off the Figma nodes). */
export const px = (v) => Math.round(parseFloat(v) * 100) / 100;
export const css = (el) => getComputedStyle(el);
export const q = (r, s) => r.querySelector(s);
export const qa = (r, s) => [...r.querySelectorAll(s)];
export const rect = (el) => el.getBoundingClientRect();
export const size = (el) => `${Math.round(rect(el).width)} × ${Math.round(rect(el).height)}`;
export const type = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight)} · ${css(el).fontWeight}`;
export const shell = (el) => { const s = css(el); return `${lightHexOf(el, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(el, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; };
export const cardCheck = (node, figmaSize, sel = "[data-story]") => [
  ...(figmaSize ? [{ part: "Card size", node, figma: figmaSize, read: (r) => size(q(r, sel)) }] : []),
  { part: "Card fill · border · radius · padding", node, figma: "#ffffff · 1 #cecdcc · 18 · 16", read: (r) => shell(q(r, sel)) },
  { part: "Title: size / line · weight", node, figma: "18/28 · 700", read: (r) => type(q(q(r, sel), "p")) },
];

export function makeDoc(c) {
  // `group` defaults to Stories; a page with no `researcher` config offers only the Developer view.
  const meta = { id: c.id, name: c.name, group: c.group || "Stories", kind: c.kind || c.name, blurb: c.blurb, source: c.source, figma: c.figma, ...(c.researcher ? { views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }] } : {}) };
  const toc = {
    developer: [
      { id: "overview", label: "Overview" }, { id: "forms", label: "The forms" }, { id: "spec", label: "Specification" }, { id: "states", label: "States & variants" },
      { id: "responsive", label: "Responsive" }, { id: "content", label: "Content & voice" }, { id: "a11y", label: "Accessibility" }, { id: "data", label: "Data it needs" }, { id: "props", label: "Props & usage" },
      { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
    ],
    researcher: [
      { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "feeds", label: "What feeds it" },
      { id: "limits", label: "Constraints" }, { id: "questions", label: "Answers & non-answers" }, { id: "open", label: "Open questions" },
    ],
  };

  function DeveloperView({ style }) {
    return (
      <>
        <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
          <Prose>
            <p><b>Purpose:</b> {c.purpose.does}</p>
            <p><b>Can contain:</b> {c.purpose.contains}</p>
            <p><b>Boundary:</b> {c.purpose.boundary}</p>
            {c.purpose.extra && c.purpose.extra.map((p, i) => <p key={i}>{p}</p>)}
            {c.purpose.where && <p><b>Where it appears:</b> {c.purpose.where}</p>}
          </Prose>
        </Section>

        <Section id="forms" title="The forms">
          <SimpleTable head={["Form", "What it shows", "Use it when"]} widths={["22%", "48%", "30%"]} rows={c.forms.map((f) => [<a key={f.id} href={`#${f.id}`} style={{ color: "inherit" }}>{f.name}</a>, f.shows, f.when])} />
        </Section>

        <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark); never hard-code the hex.">
          <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={c.spec} />
        </Section>

        <Section id="states" title="States & variants">
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {c.forms.map((f) => (
              <div key={f.id}>
                <div id={f.id} />
                {(f.states || [{ title: f.name, render: f.render }]).map((s, i) => (
                  <Variant key={i} title={s.title} note={s.note}><StoryStage style={style} kind={meta.kind} width={s.width || 808}>{s.render()}</StoryStage></Variant>
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Section id="responsive" title="Responsive" lead="Each form responds to the width of its own card, never the window. Pick a width to see every form at it.">
          <WidthShowcase style={style} forms={c.forms.map((f) => ({ name: f.name, render: f.render }))} />
          {c.responsive && <Prose><p>{c.responsive}</p></Prose>}
        </Section>

        <Section id="content" title="Content & voice" lead="Written to the SHAPE Voice and Language Guide.">
          <SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={c.content} />
        </Section>

        <Section id="a11y" title="Accessibility">
          <Prose>{c.a11y.map((p, i) => <p key={i}>{p}</p>)}</Prose>
        </Section>

        <DataNeeds id={c.id} />
        <Section id="props" title="Props & usage">
          <PropsTable rows={c.props} />
          <CodeBlock label="Usage" code={c.usage} />
          {c.usageNote && <Prose><p>{c.usageNote}</p></Prose>}
        </Section>

        <Section id="done" title="Done checklist" lead="You're done when every line is true.">
          <List items={c.done} />
        </Section>

        <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
          {(c.parity || []).map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
              <Prose><p><b>{i + 1}. {p.title}</b></p></Prose>
              <FigmaParity checks={p.checks} width={p.width || 808}>{classic(p.render())}</FigmaParity>
            </div>
          ))}
          <Prose>{c.owner.map((p, i) => <p key={i}>{p}</p>)}</Prose>
        </Section>
      </>
    );
  }

  function ResearcherView({ style }) {
    const r = c.researcher;
    return (
      <>
        <Section id="story" title="The data story" lead={r.lead}>
          <Prose>{r.story.map((p, i) => <p key={i}>{p}</p>)}</Prose>
          <Callout title="The idea in one line">{r.idea}</Callout>
        </Section>
        <Section id="glance" title="At a glance">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
            {r.facts.map(([label, value, note]) => <Fact key={label} label={label} value={value} note={note} />)}
          </div>
        </Section>
        <Section id="feeds" title="What feeds it">
          {r.example && <Variant title={r.example.title}><StoryStage style={style} kind={meta.kind} width={808}>{r.example.render()}</StoryStage></Variant>}
          <SimpleTable head={["In the Story", "Where it comes from"]} widths={["32%", "68%"]} rows={r.feeds} />
        </Section>
        <Section id="limits" title="Constraints">
          <div style={{ display: "flex", flexDirection: "column" }}>{r.limits.map(([t, body], i) => <Limit key={t} n={String(i + 1)} title={t}>{body}</Limit>)}</div>
        </Section>
        <Section id="questions" title="What it answers, and what it does not">
          <Two>
            <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>It answers</span><List items={r.answers} /></div>
            <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>It does not answer</span><List items={r.nonAnswers} /></div>
          </Two>
        </Section>
        <Section id="open" title="Open questions">
          <div style={{ display: "flex", flexDirection: "column" }}>{r.open.map(([t, body], i) => <Limit key={t} n={String.fromCharCode(65 + i)} title={t}>{body}</Limit>)}</div>
        </Section>
      </>
    );
  }

  function Page({ style, view = "developer" }) {
    return view === "researcher" && c.researcher ? <ResearcherView style={style} /> : <DeveloperView style={style} />;
  }
  return { meta, toc, Page };
}
