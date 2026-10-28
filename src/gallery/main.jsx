import { createRoot } from "react-dom/client";
import WidgetBody from "../components/widgets/WidgetBody.jsx";
import GeneratedBody from "../components/widgets/GeneratedBody.jsx";
import { Header } from "../components/widgets/primitives.jsx";
import { FAMILIES, formTitle, cardSurface } from "../lib/families.js";
import { FORMS, buildFormSpec } from "../lib/subjectForms.js";
import { buildSpec } from "../lib/generativeEngine.js";
import { overallSubject, dimensionSubject } from "../lib/scopeSubject.js";
import { T, radius } from "../lib/tokens.js";
import "../lib/ds.js";
import "../index.css";
import ScopeRecipe from "../components/scope/scopeRecipes.jsx";
import { StoryStyleContext } from "../components/scope/stories/storyStyle.js";
import { STORIES } from "../components/widgetbuilder/storyCatalog.jsx";
import { SAMPLE_SUBJECTS } from "../components/developer/sampleSubjects.js";
import { ScopeNavContext } from "../components/scope/scopeNav.js";
import EffectBreakdownStory from "../components/scope/stories/EffectBreakdown.jsx";
import { SHELL_PADDING } from "../lib/widgetStructure.js";
import { customFor } from "../lib/widgetCustom.js";

/* Scratch: ?scopes=a,b&style=refined (report Scopes) · ?family=a,b (library forms) or ?forms&only=a,b&subject=dim|overall&axes=gender,tenure (builder forms; axes repeats each form per grouping). */
const params = new URLSearchParams(location.search);
const PX = { "1x1": 164, "2x2": 344, "3x3": 524 };
const Card = ({ id, size, surface = {}, title, children }) => (
  <div data-w={id}>
    <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>{id} · {size}</div>
    <div data-widget-card data-size={size} style={{ width: PX[size], height: PX[size], background: surface.background || "#fff", border: `1px solid ${surface.borderColor || T.gray100}`, borderRadius: radius.widget, padding: SHELL_PADDING, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", overflow: "hidden" }}>
      <Header title={title} />{children}
    </div>
  </div>
);
let cells;
if (params.has("effect")) {
  // ?effect&w=360 — the Health Age drivers Story with the design's sample rows.
  const HEALTH = [{ label: "BMI", months: 6 }, { label: "Stress", months: 5 }, { label: "Sleep", months: 3 }, { label: "Vaping", months: null }, { label: "Nutrition", months: -4 }, { label: "Alcohol", months: -6 }, { label: "Exercise", months: -11 }, { label: "Smoking", months: -20 }];
  cells = [<div key="e" data-catalog="effect" style={{ width: Number(params.get("w")) || 808 }}><EffectBreakdownStory rows={HEALTH} sample /></div>];
} else if (params.has("stories")) {
  // ?stories[=id,id]&subject=0..4&w=360 — catalogue Stories for one sample subject (Story sweep's subjects).
  const only = params.get("stories") ? params.get("stories").split(",") : null;
  const subject = SAMPLE_SUBJECTS[Number(params.get("subject")) || 0].subject;
  cells = STORIES.filter((d) => (!only || only.includes(d.id)) && (params.has("all") || !d.blocked?.(subject))).map((d) => (
    <div key={d.id} data-catalog={d.id} style={{ width: Number(params.get("w")) || 808, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: "#888" }}>{d.id}</div>
      <StoryStyleContext.Provider value={params.get("style") || "classic"}><ScopeNavContext.Provider value={{ depth: 0, open: () => {} }}>{d.render(subject, { stories: [d.id] })}</ScopeNavContext.Provider></StoryStyleContext.Provider>
    </div>
  ));
} else if (params.has("scopes")) {
  // ?scopes=enps,explorers&style=refined&w=360 — each family's report Scope, as the Scope pane draws it (w = card width).
  cells = params.get("scopes").split(",").map((id) => (
    <div key={id} data-scope={id} style={{ width: Number(params.get("w")) || 808, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12, color: "#888" }}>{id}</div>
      <StoryStyleContext.Provider value={params.get("style") || "classic"}><ScopeRecipe familyId={id} /></StoryStyleContext.Provider>
    </div>
  ));
} else if (params.has("generated")) {
  // ?generated — every chat-generated chart type (lib/generativeEngine.js), for one-topic and two-topic prompts, at both sizes.
  const cases = [["metric", ["Sleep"]], ["trend", ["Sleep"]], ["gauge", ["Sleep"]], ["status", ["Sleep"]], ["bar", ["Sleep", "Stress"]], ["ranking", ["Sleep", "Stress", "Workload"]], ["radar", ["Sleep", "Stress", "Workload"]], ["scatter", ["Sleep", "Stress"]], ["insight", ["Sleep", "Stress"]]];
  cells = cases.flatMap(([viz, topics]) => [buildSpec(viz, topics, topics.join(" and ")).size].map((size) => {
    const spec = { ...buildSpec(viz, topics, topics.join(" and ")), size };
    return <Card key={viz + size} id={`${viz}:${size}`} size={size} title={spec.title}><GeneratedBody spec={spec} /></Card>;
  }));
} else if (params.has("custom")) {
  // ?custom&subject=0..4 — every builder form, at every size, with every evidence choice and with / without a link
  // (lib/widgetCustom.js): the Widget Builder's editor can't offer a combination that fails the structure check.
  const subject = SAMPLE_SUBJECTS[Number(params.get("subject")) || 0].subject;
  cells = FORMS.filter((f) => !f.blocked(subject)).flatMap((f) => f.sizes.flatMap((size) => {
    const base = buildFormSpec(f.id, subject, { size });
    if (base.size !== size) return [];
    const can = customFor(base);
    const evs = [...(can.evidence === "toggle" ? [{ evidence: false }] : []), ...can.kinds.map((k) => ({ evidence: true, evidenceKind: k.id }))];
    const acts = can.action === "toggle" ? [null, "details"] : [null];
    return (evs.length ? evs : [{}]).flatMap((e) => acts.map((a) => {
      const spec = { ...base, custom: { ...e, action: a } };
      const id = `${f.id}:${size}:${e.evidence === false ? "none" : e.evidenceKind || "-"}:${a || "-"}`;
      return <Card key={id} id={id} size={size} title={spec.title}><GeneratedBody spec={spec} /></Card>;
    }));
  }));
} else if (params.has("forms")) {
  const subject = params.get("subject") === "dim" ? dimensionSubject("Corporate Culture") : overallSubject();
  const only = params.get("only")?.split(",");
  const axes = params.get("axes")?.split(",") || [undefined];
  cells = FORMS.filter((f) => (!only || only.includes(f.id)) && !f.blocked(subject)).flatMap((f) => axes.flatMap((axis) => f.sizes.map((size) => {
    const spec = buildFormSpec(f.id, subject, { size, options: axis ? { axis } : {} });
    return <Card key={f.id + size + axis} id={`${f.id}:${size}${axis ? `:${axis}` : ""}`} size={spec.size} title={spec.title}><GeneratedBody spec={spec} /></Card>;
  })));
} else {
  const q = params.get("family");
  cells = FAMILIES.filter((f) => !q || q.split(",").includes(f.id)).flatMap((f) => f.forms.map((form, i) => (
    <Card key={f.id + i} id={`${f.id}:${i}`} size={form.size} surface={cardSurface(f.id, i)} title={formTitle(f.id, i)}><WidgetBody familyId={f.id} formIndex={i} /></Card>
  )));
}
createRoot(document.getElementById("root")).render(<div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 16, alignItems: "flex-start" }}>{cells}</div>);
