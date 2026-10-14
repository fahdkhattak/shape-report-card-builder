import { ds, dsText } from "../../../lib/ds.js";
import { SAMPLE_SUBJECTS } from "../sampleSubjects.js";
import { STORIES, formsOf, suggestStories, suggestScope, SUGGEST_RULES, storyById } from "../../widgetbuilder/storyCatalog.jsx";
import { Section, Prose } from "../docKit.jsx";
import { SimpleTable } from "../docParts.jsx";

export const meta = {
  id: "story-availability", name: "Story availability", group: "Foundations", kind: "Story availability",
  blurb: "Which Stories the Widget Builder can offer for each kind of subject, and why not when it can't.",
  source: "components/widgetbuilder/storyCatalog.jsx · blocked(), suggest, forms()",
};
export const toc = [{ id: "overview", label: "Overview" }, { id: "matrix", label: "The matrix" }, { id: "defaults", label: "Default Scopes" }, { id: "why", label: "Why a Story is added" }, { id: "forms", label: "Forms" }];

const SUBJECTS = SAMPLE_SUBJECTS;

const reasonFor = (story, subject) => { try { return story.blocked(subject); } catch { return "Not available for this subject"; } };
const cell = (story, subject) => {
  const why = reasonFor(story, subject);
  return why
    ? <span title={why} aria-label={`Not available: ${why}`} style={{ color: ds.text.quaternary }}>–</span>
    : <span aria-label="Available" style={{ color: ds.status.success.textIndicator, fontWeight: 700 }}>{story.suggest ? "✓ ●" : "✓"}</span>;
};

export default function StoryAvailabilityDoc() {
  const families = [...new Set(STORIES.map((s) => s.family))];
  return (
    <>
      <Section id="overview" title="Overview" lead="The Widget Builder asks each Story whether it can honestly be built for the subject, so the answer is data, not a rule someone has to remember.">
        <Prose>
          <p>Every Story in <code>storyCatalog.jsx</code> has a <code>blocked(subject)</code> that returns a plain reason or nothing. The builder's "Add Story" menu lists blocked Stories with that reason, and the chat engine quotes it. This page runs the real rules against one real subject of each kind, so a change to a rule shows up here.</p>
          <p><b>Reading it.</b> ✓ means available. ● means the builder adds it by default. – means blocked: hover for the reason. A Story that needs per-person scores is blocked for a concept, which has none; Stories that need parts are blocked for a lone Driver.</p>
        </Prose>
      </Section>

      <Section id="matrix" title="The matrix" lead={`${STORIES.length} Stories by ${SUBJECTS.length} kinds of subject.`}>
        <SimpleTable
          head={["Story", ...SUBJECTS.map((x) => `${x.label} (${x.subject.kind})`)]}
          widths={["24%", ...SUBJECTS.map(() => `${Math.floor(76 / SUBJECTS.length)}%`)]}
          rows={families.flatMap((f) => STORIES.filter((s) => s.family === f).map((s) => [
            <span key={s.id}><b>{s.name}</b><span style={{ display: "block", ...dsText("Text 3xs"), color: ds.text.tertiary }}>{f}</span></span>,
            ...SUBJECTS.map((x) => <span key={x.label}>{cell(s, x.subject)}</span>),
          ]))}
        />
      </Section>

      <Section id="defaults" title="Default Scopes" lead="What the builder adds when it first builds a widget for each kind of subject.">
        <SimpleTable head={["Subject", "Stories added by default"]} widths={["26%", "74%"]} rows={SUBJECTS.map((x) => [`${x.label} (${x.subject.kind})`, suggestScope(x.subject).stories.map((id) => storyById(id).name).join(", ")])} />
      </Section>

      <Section id="why" title="Why a Story is added" lead={`Every subject starts with the eight Stories marked ●. The builder then adds up to ${SUGGEST_RULES.max} more whose rule fires on the subject's real data, and says why.`}>
        <SimpleTable head={["Story", "Rule", "Threshold"]} widths={["22%", "52%", "26%"]} rows={Object.entries(SUGGEST_RULES).filter(([k]) => k !== "max").map(([k, r]) => [storyById(r.story).name, r.rule, Object.entries(r).filter(([n]) => !["story", "rule"].includes(n)).map(([n, v]) => `${n}: ${v}`).join(", ")])} />
        <SimpleTable head={["Subject", "Extras the rules add right now, and why"]} widths={["26%", "74%"]} rows={SUBJECTS.map((x) => { const r = suggestScope(x.subject).reasons; const ids = Object.keys(r); return [`${x.label} (${x.subject.kind})`, ids.length ? ids.map((id) => `${storyById(id).name}: ${r[id]}`).join("; ") : "None."]; })} />
        <Prose><p>The thresholds are starting points, in <code>SUGGEST_RULES</code> in <code>storyCatalog.jsx</code>. They are meant to be changed once real data shows which are too eager or too shy. What Moves With This has no rule: in the prototype's data every topic is strongly linked, so it would be added every time.</p></Prose>
      </Section>

      <Section id="forms" title="Forms" lead="Stories that can be drawn more than one way offer a “Show as” menu in the floating toolbar that appears when you hover or focus a Story in the builder. Which forms are offered depends on the subject.">
        <SimpleTable
          head={["Story", ...SUBJECTS.map((x) => x.label)]}
          widths={["24%", ...SUBJECTS.map(() => `${Math.floor(76 / SUBJECTS.length)}%`)]}
          rows={STORIES.filter((s) => s.forms).map((s) => [<b key={s.id}>{s.name}</b>, ...SUBJECTS.map((x) => <span key={x.label}>{reasonFor(s, x.subject) ? "–" : formsOf(s, x.subject).map((f) => f.label).join(", ") || "One form"}</span>)])}
        />
        <Prose>
          <p>Breakdown offers the forms the number of parts allows (see the rules on its page): a radar needs 3 to 24 parts, an area chart 3 to 20, a list 8 or fewer; bars and zones take any count. Score Meaning offers a number or the Explorer ring, but it is only ever placed once: the two forms are two looks for the same message. Breakdown can be placed again for each form it has, but never twice in the same form. The choice is kept with the widget and carried into its Scope on the report, and a Profile widget opens its Breakdown as a radar.</p>
        </Prose>
      </Section>
    </>
  );
}
