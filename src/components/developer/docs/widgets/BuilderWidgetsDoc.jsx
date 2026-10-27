import { useCallback, useMemo, useState } from "react";
import { ds, dsSpace } from "../../../../lib/ds.js";
import { Section, Prose, Callout, CodeBlock } from "../../docKit.jsx";
import { SimpleTable, List } from "../../docParts.jsx";
import { FormExample, templateLabel } from "../widgetDoc.jsx";
import { FORMS, buildFormSpec } from "../../../../lib/subjectForms.js";
import { buildSpec } from "../../../../lib/generativeEngine.js";
import { overallSubject, dimensionSubject, subjectFromPrompt } from "../../../../lib/scopeSubject.js";

/* ================================================================== */
/* WIDGET BUILDER FORMS: every widget the Widget Builder can make         */
/* (lib/subjectForms.js FORMS, drawn by components/widgets/SubjectBody.jsx) */
/* and every chart the chat can generate (lib/generativeEngine.js), live,  */
/* each with its measured template. These aren't Library families: they're */
/* built for a subject (a topic, the organisation, a group) on demand.      */
/* ================================================================== */
export const meta = {
  id: "widgets-builder", name: "Widget Builder forms", group: "Widgets", kind: "Widgets",
  blurb: `Every widget the Widget Builder can build for a subject (${FORMS.length} forms) and every chart the chat can generate (9 types), live, with when each is offered and its template.`,
  source: "lib/subjectForms.js · components/widgets/SubjectBody.jsx · lib/generativeEngine.js · components/widgets/GeneratedBody.jsx",
};
export const toc = [{ id: "overview", label: "Overview" }, { id: "map", label: "The map" }, { id: "forms", label: "Builder forms" }, { id: "chat", label: "Chat charts" }, { id: "spec", label: "The spec object" }, { id: "rules", label: "Rules" }];

const OVERALL = overallSubject();
const DIM = dimensionSubject("Corporate Culture");
const PAIR = subjectFromPrompt("Compare Sleep vs Stress");
const SUBJECTS = [["the organisation", OVERALL], ["Corporate Culture", DIM], ["Sleep vs Stress", PAIR]];
/* The first subject a form isn't blocked for, so every form can be drawn. */
const subjectFor = (f) => SUBJECTS.find(([, s]) => s && !f.blocked(s)) || null;
const OPT = { axis: "Split by", target: "Target", group: "Split by + group", pair: "Split by + two groups", lift: "How many to lift" };

const CHAT = [["metric", ["Sleep"], "Number"], ["trend", ["Sleep"], "Trend line"], ["gauge", ["Sleep"], "Gauge (ring)"], ["status", ["Sleep"], "Status"], ["bar", ["Sleep", "Stress"], "Bar chart"], ["ranking", ["Sleep", "Stress", "Workload"], "Ranked list"], ["radar", ["Sleep", "Stress", "Workload"], "Radar"], ["scatter", ["Sleep", "Stress"], "Scatter"], ["insight", ["Sleep", "Stress"], "Did You Know"]];

export default function BuilderWidgetsDoc() {
  const [structures, setStructures] = useState({});
  const onStructure = useCallback((k, res) => setStructures((m) => (m[k] === res ? m : { ...m, [k]: res })), []);
  // Build every spec once (they read the dataset; no randomness).
  const forms = useMemo(() => FORMS.map((f) => {
    const sub = subjectFor(f);
    return { f, label: sub?.[0], specs: sub ? f.sizes.map((size) => ({ size, spec: buildFormSpec(f.id, sub[1], { size }) })) : [] };
  }), []);
  const chat = useMemo(() => CHAT.map(([viz, topics, name]) => ({ viz, name, topics, spec: buildSpec(viz, topics, topics.join(" and ")) })), []);
  const tpl = (k) => templateLabel(structures[k]);

  return (
    <>
      <Section id="overview" title="Overview" lead="The Widget Builder (Create › Widget Builder) turns a question into a widget for a subject: an Explorer, a Driver, a cluster, a concept, the whole organisation or a group. It picks the form by the data's job, and every form can be switched and tuned.">
        <Prose>
          <p>A built widget is <code>{"{ kind: \"generated\", spec }"}</code>: the spec carries a serialisable payload, so nothing in the drawing reads data and the widget works the same on a report, in the Library and in the chat. The forms reuse the Library's parts and follow the same <b>templates</b> (Widgets › Widget structure).</p>
          <p>Below, each form is drawn for the first of these subjects it supports: the organisation, then Corporate Culture, then Sleep vs Stress (Head to head needs two named topics).</p>
        </Prose>
      </Section>

      <Section id="map" title="The map" lead="Every form, its sizes, what it needs, its options and the template each size is built to.">
        <SimpleTable head={["Form", "Sizes", "Needs", "Options", "Template", "Why it exists"]} widths={["12%", "9%", "15%", "12%", "22%", "30%"]} rows={forms.map(({ f, specs }) => [
          f.name, f.sizes.join(" · "),
          [OVERALL, DIM].map((s) => f.blocked(s)).filter(Boolean)[0] || "Any subject",
          (f.options || []).map((o) => OPT[o] || o).join(", ") || "None",
          specs.map(({ size }) => `${size}: ${tpl(`${f.id}:${size}`)}`).join(" · ") || "Not drawable here",
          f.why,
        ])} />
        <SimpleTable head={["Chat chart", "Size", "Topics", "Template"]} widths={["24%", "10%", "36%", "30%"]} rows={chat.map((c) => [c.name, c.spec.size, c.topics.join(", "), tpl(`chat:${c.viz}`)])} />
      </Section>

      <Section id="forms" title="Builder forms" lead="Each form at every size it offers, live. Hover for the menu.">
        {forms.map(({ f, label, specs }) => (
          <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
            <Prose><p><b>{f.name}</b> <span style={{ color: ds.text.tertiary }}>· {f.id} · drawn for {label}</span><br />{f.why}</p></Prose>
            {specs.map(({ size, spec }) => <FormExample key={size} k={`${f.id}:${size}`} onStructure={onStructure} widget={{ id: `doc-b-${f.id}-${size}`, kind: "generated", spec, size: spec.size }} title={`${spec.title} · ${spec.size}`} />)}
          </div>
        ))}
      </Section>

      <Section id="chat" title="Chat charts" lead="What the chat makes when you ask it for a widget (ChatLanding, ChatPanel, the chat-only Widget Builder modal). The chart type is ranked by the data's job (rankForms), not picked at random.">
        {chat.map((c) => <FormExample key={c.viz} k={`chat:${c.viz}`} onStructure={onStructure} widget={{ id: `doc-c-${c.viz}`, kind: "generated", spec: c.spec, size: c.spec.size }} title={`${c.name} · ${c.spec.size}`} note={`Topics: ${c.topics.join(", ")}. ${c.spec.explanation || ""}`} />)}
        <Callout title="Real or estimated">A topic with no survey data falls back to a labelled estimate (a small dot after the title, spec.real false). Every builder form is real data.</Callout>
      </Section>

      <Section id="spec" title="The spec object" lead="What a built widget stores. The renderer reads only this.">
        <CodeBlock label="A built widget" code={`{
  id: "w7", kind: "generated",
  spec: {
    vizType: "form",           // chat charts use their own vizType (metric, trend, radar…)
    form: "groups",            // a FORMS id
    size: "2x2", sizes: ["2x2"], // sizes the data allows (fitSizes)
    title: "Overall Score by Department", autoTitle: true,
    options: { axis: "department" },
    payload: { /* serialisable: rows, values, labels */ },
    explanation: "How each group scores on this topic…",
    real: true,
  },
}`} />
      </Section>

      <Section id="rules" title="Rules">
        <List items={[
          "Every form is built from Sections / Insight / Evidence / ActionBar and is one of the templates for every size it offers.",
          "A form is only offered for a subject it isn't blocked for (needs parts, needs per-person scores, needs two rounds, needs two topics).",
          "Sizes follow the data (fitSizes): a form that can't fit its data at 1x1 doesn't offer 1x1.",
          "Groups under 5 people are never shown.",
          "A built title is curated, never a slice of the prompt; a title the person typed survives switching form.",
          "A 3x3 (Story, Index) follows the 2x2 templates.",
        ]} />
      </Section>
    </>
  );
}
