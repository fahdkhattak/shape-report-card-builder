import { useMemo, useState } from "react";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../lib/ds.js";
import { font } from "../../../lib/tokens.js";
import { STORIES, formsOf, FORM_STORIES } from "../../widgetbuilder/storyCatalog.jsx";
import { formById } from "../../../lib/subjectForms.js";
import { ScopeNavContext } from "../../scope/scopeNav.js";
import { SAMPLE_SUBJECTS } from "../sampleSubjects.js";
import RecipeBoard from "../RecipeBoard.jsx";
import { Section, Prose, CodeBlock, StoryStage, Callout } from "../docKit.jsx";
import { SpecTable } from "../docParts.jsx";
import { DocLink } from "../DataNeeds.jsx";

/* ================================================================== */
/* STORY RECIPES: every Story as a recipe, the counterpart of Widget      */
/* recipes: subject → family → Story → form → card width → style. Driven by */
/* the Story catalogue (blocked(), forms()), so a path that can be drawn    */
/* here is a Story a Scope can hold, and anything ruled out says why.       */
/* ================================================================== */
export const meta = {
  id: "story-recipe", name: "Story recipes", group: "Stories", kind: "Story recipes",
  blurb: "Every Story is a recipe too: what it's about, which Story, in which form, at what width and in which style. Pick a path; what the earlier choices rule out is crossed out, with the reason.",
  source: "widgetbuilder/storyCatalog.jsx (STORIES, blocked, forms, FORM_STORIES) · scope/stories/storyWidth.js · developer/RecipeBoard.jsx",
};
export const toc = [
  { id: "board", label: "The recipe board" }, { id: "result", label: "The Story" }, { id: "math", label: "How many recipes" },
  { id: "rules", label: "How each choice narrows the next" }, { id: "code", label: "The recipe as data" },
];

const SUBJECTS = SAMPLE_SUBJECTS.map((x, i) => ({ id: String(i), label: x.subject.kind === "overall" ? "Organisation" : x.subject.label, kind: x.label, subject: x.subject }));
const FAMILIES = [...new Set(STORIES.map((s) => s.family))];
const WIDTHS = [{ id: "808", label: "Wide · 808", px: 808, why: "The designed layout (560px and up)" }, { id: "480", label: "Compact · 480", px: 480, why: "Controls on their own row, compact charts, hover becomes tap (under 560px)" }, { id: "360", label: "Tight · 360", px: 360, why: "The narrowest forms: stacked lists and row-block tables (under 400px)" }];
const STYLES = [{ id: "classic", label: "Current" }, { id: "refined", label: "Refined" }];
const FORM_NAMES = { score: "Score", gauge: "Ring", status: "Status", history: "History", parts: "Parts", profile: "Profile", people: "People", groups: "Groups", composition: "Composition", focus: "Focus", movers: "Movers", spread: "Spread", goal: "Goal", index: "Index", team: "Group", versus: "Versus", duel: "Head to head", check: "Check-up", whatif: "What if", heat: "Heat strip", momentum: "Momentum", nudge: "Next Step" };

const PRESETS = [
  { name: "Corporate Culture, what's behind it, as a radar", subj: "1", story: "breakdown", form: "radar", width: "808", style: "classic" },
  { name: "Sleep over time, on a phone", subj: "2", story: "trend", width: "360", style: "classic" },
  { name: "Where the organisation should focus", subj: "0", story: "areas", width: "808", style: "refined" },
  { name: "Organisation score meaning as a ring", subj: "0", story: "meaning", form: "ring", width: "480", style: "classic" },
].filter((p) => STORIES.some((s) => s.id === p.story));

function resolve(wish) {
  const S = SUBJECTS.find((x) => x.id === wish.subj) || SUBJECTS[0];
  const s = S.subject;
  const open = (d) => !d.blocked(s);
  const famOpen = (f) => STORIES.some((d) => d.family === f && open(d));
  const wantFam = wish.family || STORIES.find((d) => d.id === wish.story)?.family;
  const family = famOpen(wantFam) ? wantFam : FAMILIES.find(famOpen);
  const inFam = STORIES.filter((d) => d.family === family);
  const story = inFam.find((d) => d.id === wish.story && open(d)) || inFam.find(open);
  const forms = formsOf(story, s);
  const form = forms.length ? (forms.find((f) => f.id === wish.form) ? wish.form : story.defaultForm?.(s) ?? forms[0].id) : null;
  const width = WIDTHS.find((w) => w.id === wish.width) || WIDTHS[0];
  const style = STYLES.find((x) => x.id === wish.style) || STYLES[0];
  return { S, s, family, story, forms, form, width, style };
}

export default function StoryRecipeDoc() {
  const [wish, setWish] = useState({ subj: "1", story: "breakdown", form: "radar", width: "808", style: "classic" });
  const [ghostWish, setGhostWish] = useState(null);
  const r = useMemo(() => resolve(wish), [wish]);
  const { S, s, family, story, forms, form, width, style } = r;

  const pick = (row, id) => setWish((w) => {
    if (row === "subj") return { ...w, subj: id };
    if (row === "family") { const d = STORIES.find((x) => x.family === id && !x.blocked(s)); return { ...w, family: id, story: d?.id, form: undefined }; }
    if (row === "story") return { ...w, family: STORIES.find((x) => x.id === id).family, story: id, form: undefined };
    if (row === "form") return { ...w, form: id };
    if (row === "width") return { ...w, width: id };
    if (row === "style") return { ...w, style: id };
    return w;
  });

  const rows = [
    { id: "subj", label: "About", hint: "the subject", options: SUBJECTS.map((x) => ({ id: x.id, label: x.label, why: x.kind, state: x.id === S.id ? "on" : "open" })) },
    { id: "family", label: "Family", hint: "the question", options: FAMILIES.map((f) => {
      const ds_ = STORIES.filter((d) => d.family === f);
      const blocked = ds_.every((d) => d.blocked(s));
      return { id: f, label: f, state: f === family ? "on" : blocked ? "off" : "open", why: blocked ? ds_[0].blocked(s) : ds_.map((d) => d.name).join(", ") };
    }) },
    { id: "story", label: "Story", options: STORIES.filter((d) => d.family === family).map((d) => { const why = d.blocked(s); return { id: d.id, label: d.name, state: d.id === story.id ? "on" : why ? "off" : "open", why: why || d.purpose }; }) },
    { id: "form", label: "Form", hint: "how it's drawn", options: forms.length ? forms.map((f) => ({ id: f.id, label: f.label, state: f.id === form ? "on" : "open", why: f.why })) : [{ id: "one", label: "One form", state: "on", why: "This Story is drawn one way" }] },
    { id: "width", label: "Card width", options: WIDTHS.map((w) => ({ id: w.id, label: w.label, state: w.id === width.id ? "on" : "open", why: w.why })) },
    { id: "style", label: "Style", options: STYLES.map((x) => ({ id: x.id, label: x.label, state: x.id === style.id ? "on" : "open" })) },
  ];
  const formLabel = forms.find((f) => f.id === form)?.label;
  const name = [S.label, story.name, formLabel && `as ${formLabel.toLowerCase()}`, `at ${width.px}px`, style.id === "refined" ? "(Refined)" : null].filter(Boolean).join(" ");
  const ghost = ghostWish ? (() => { const g = resolve(ghostWish); return { subj: g.S.id, family: g.family, story: g.story.id, form: g.form || "one", width: g.width.id, style: g.style.id }; })() : null;
  const leads = Object.entries(FORM_STORIES).filter(([, ids]) => ids.includes(story.id)).map(([f]) => FORM_NAMES[f] || formById(f)?.name || f);

  return (
    <>
      <Section id="board" title="The recipe board" lead="Pick one answer per row. The line is the recipe; the blue name reads straight off it. Crossed-out answers are ruled out by the ones above them; hover one to see why.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[8], alignItems: "center", marginBottom: dsSpace[12] }}>
          <span style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>Saved recipes</span>
          {PRESETS.map((p) => (
            <button key={p.name} type="button" onMouseEnter={() => setGhostWish(p)} onMouseLeave={() => setGhostWish(null)} onFocus={() => setGhostWish(p)} onBlur={() => setGhostWish(null)}
              onClick={() => { setWish({ subj: p.subj, story: p.story, form: p.form, width: p.width, style: p.style }); setGhostWish(null); }}
              style={{ border: `${dsBorder.sm}px solid ${ds.border.secondary}`, background: ds.surface.general.card, borderRadius: dsRadius.full, padding: "4px 12px", fontFamily: font, ...dsText("Text xs", 500), color: ds.text.secondary, cursor: "pointer" }}>
              {p.name}
            </button>
          ))}
        </div>
        <RecipeBoard rows={rows} onPick={pick} ghost={ghost} name={name} nameLabel="Story" />
      </Section>

      <Section id="result" title="The Story" lead={`The recipe, drawn: the real Story at ${width.px}px.${leads.length ? ` It leads the Scope of these widgets in the Widget Builder: ${leads.join(", ")}.` : ""}`}>
        <StoryStage style={style.id} kind={family} width={width.px}>
          <ScopeNavContext.Provider value={{ depth: 0, open: () => {} }}>
            {story.render(s, { stories: [story.id], options: form ? { form } : undefined }) || <Prose><p>This Story has nothing to draw for this subject.</p></Prose>}
          </ScopeNavContext.Provider>
        </StoryStage>
      </Section>

      <Section id="math" title="How many recipes" lead="The paths through the board for each subject: every Story it can hold, in every form, at three widths and in two styles.">
        <Counts current={S.id} />
      </Section>

      <Section id="rules" title="How each choice narrows the next" lead="Every crossed-out answer comes from one of these, in the Story catalogue the Widget Builder reads.">
        <SpecTable head={["Choice", "Narrows", "Rule", "Where it lives"]} widths={["14%", "14%", "48%", "24%"]} rows={[
          ["About", "Family, Story", "A Story needs what the subject has: parts (Breakdown, Diagnostic, Priority Map), per-person scores (Composition, Who Is Where, Areas to Focus, How Scores Are Spread), a peer set (How It Ranks), real sources (Citation). A family is open while any of its Stories is.", "STORIES[].blocked(subject)"],
          ["Story", "Form", "Only some Stories have more than one form. Breakdown's forms depend on how many parts there are (a radar needs 3 to 24).", "STORIES[].forms(subject), fitForm()"],
          ["Card width", "Layout", "A Story lays itself out for its own card: wide from 560px, compact under 560, tight under 400. Nothing scrolls sideways at any width.", "storyWidth.js (useStoryWidth)"],
          ["Style", "Look", "Current is the shipped style; Refined is the redesign being explored in the Widget Builder.", "storyStyle.js"],
          ["The widget", "Order", "In a Scope, the Stories that expand on the widget come first (a History widget leads with Trend and Goal & Pace).", "FORM_STORIES, suggestScope()"],
        ]} />
        <Callout title="Widgets and Stories together">A widget's recipe (<DocLink id="widget-recipe">Widget recipes</DocLink>) picks its form; that form picks which Stories lead its Scope. The skeleton every Story is built on is on <DocLink id="story-structure">Story structure</DocLink>.</Callout>
      </Section>

      <Section id="code" title="The recipe as data" lead="A Story recipe is a placement in a Scope: the Story's id and its options. Width and style come from where it's drawn.">
        <CodeBlock label="Recipe" code={JSON.stringify({ about: `${s.kind}:${S.label}`, story: story.id, options: form ? { form } : {}, width: width.px, style: style.id }, null, 2)} />
        <CodeBlock label="In a Scope" code={`scope = { prompt, stories: [${JSON.stringify(story.id)}], options: { ${JSON.stringify(story.id)}: ${JSON.stringify(form ? { form } : {})} } }
storyById(${JSON.stringify(story.id)}).render(subject, { stories: scope.stories, options: scope.options[${JSON.stringify(story.id)}] })`} />
      </Section>
    </>
  );
}

function Counts({ current }) {
  const rows = SUBJECTS.map((S) => {
    const open = STORIES.filter((d) => !d.blocked(S.subject));
    const variants = open.reduce((n, d) => n + Math.max(1, formsOf(d, S.subject).length), 0);
    return [S.id === current ? <b key="b">{S.label}</b> : S.label, S.kind, `${open.length} of ${STORIES.length}`, String(variants), (variants * WIDTHS.length * STYLES.length).toLocaleString("en-GB")];
  });
  return <SpecTable head={["About", "Kind", "Stories open", "Story × form", "Recipes (× 3 widths × 2 styles)"]} widths={["20%", "20%", "18%", "16%", "26%"]} rows={rows} />;
}
