import { createRoot } from "react-dom/client";
import WidgetBody from "../components/widgets/WidgetBody.jsx";
import GeneratedBody from "../components/widgets/GeneratedBody.jsx";
import { Header } from "../components/widgets/primitives.jsx";
import { FAMILIES, formTitle, cardSurface } from "../lib/families.js";
import { FORMS, buildFormSpec } from "../lib/subjectForms.js";
import { overallSubject, dimensionSubject } from "../lib/scopeSubject.js";
import { T, radius } from "../lib/tokens.js";
import "../lib/ds.js";
import ScopeRecipe from "../components/scope/scopeRecipes.jsx";
import { StoryStyleContext } from "../components/scope/stories/storyStyle.js";

/* Scratch: ?scopes=a,b&style=refined (report Scopes) · ?family=a,b (library forms) or ?forms&only=a,b&subject=dim|overall&axes=gender,tenure (builder forms; axes repeats each form per grouping). */
const params = new URLSearchParams(location.search);
const PX = { "1x1": 164, "2x2": 344, "3x3": 524 };
const Card = ({ id, size, surface = {}, title, children }) => (
  <div data-w={id}>
    <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>{id} · {size}</div>
    <div style={{ width: PX[size], height: PX[size], background: surface.background || "#fff", border: `1px solid ${surface.borderColor || T.gray100}`, borderRadius: radius.widget, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", overflow: "hidden" }}>
      <Header title={title} />{children}
    </div>
  </div>
);
let cells;
if (params.has("scopes")) {
  // ?scopes=enps,explorers&style=refined — each family's report Scope, as the Scope pane draws it.
  cells = params.get("scopes").split(",").map((id) => (
    <div key={id} data-scope={id} style={{ width: 808, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12, color: "#888" }}>{id}</div>
      <StoryStyleContext.Provider value={params.get("style") || "classic"}><ScopeRecipe familyId={id} /></StoryStyleContext.Provider>
    </div>
  ));
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
