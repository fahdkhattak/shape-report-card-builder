import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { ActionsLayer } from "./stories/ActionStories.jsx";

/* ================================================================== */
/* SCOPE LAYERS — a Scope can go one layer DEEPER (Figma Roughwork node  */
/* 2280:15268). Today the only deeper layer is Actions, but the           */
/* mechanism is general: a Story calls `useScopeNav().open(layer)`, the   */
/* host swaps the Scope body for that layer and shows a breadcrumb        */
/* ("Organisational Flow > Actions you can take") with a back arrow. The   */
/* design has no back arrow; it's added because breadcrumbs alone are      */
/* easy to miss. The base Scope stays mounted (just hidden) so its          */
/* toggles, tabs and scroll position survive the round trip.               */
/*                                                                         */
/* Both hosts — the Scope pane (ScopePanel.jsx) and the Widget Builder's     */
/* Scope preview — own a stack via useLayerStack and provide it with        */
/* <ScopeNavContext.Provider>.                                              */
/* ================================================================== */
export { ScopeNavContext, useScopeNav } from "./scopeNav.js";

/* `resetKey` changes → back to the root (e.g. a different widget is opened). */
export function useLayerStack(resetKey) {
  const [stack, setStack] = useState([]);
  useEffect(() => setStack([]), [resetKey]);
  return { stack, depth: stack.length, layer: stack[stack.length - 1] || null, push: (l) => setStack((s) => [...s, l]), pop: () => setStack((s) => s.slice(0, -1)), reset: () => setStack([]) };
}

/* Renders whichever layer is on top. */
export function LayerBody({ layer }) {
  if (layer.kind === "actions") return <ActionsLayer key={`${layer.drivers.join("|")}`} drivers={layer.drivers} selected={layer.selected} />;
  return null;
}

/* Back arrow + "Parent > Current". Parent is a button back to the root. */
export function Breadcrumb({ rootTitle, layer, onBack, onRoot }) {
  const btn = { border: "none", background: "transparent", cursor: "pointer", fontFamily: font, padding: 0 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, fontFamily: font }}>
      <button aria-label="Back" title="Back" onClick={onBack} style={{ ...btn, display: "flex", padding: 2, borderRadius: radius.xs, marginLeft: -4 }}>
        <ChevronLeft size={20} color={T.gray700} />
      </button>
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontSize: 14, lineHeight: "20px" }}>
        <button onClick={onRoot} style={{ ...btn, color: T.gray500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{rootTitle}</button>
        <ChevronRight size={14} color={T.gray300} style={{ flexShrink: 0 }} />
        <span aria-current="page" style={{ fontWeight: 700, color: T.gray900, whiteSpace: "nowrap" }}>{layer.label}</span>
      </nav>
    </div>
  );
}
