import { GitBranch, Zap, Blocks } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { QUESTION_TYPE_CATALOG } from "../../lib/questionTypes.js";

/* ================================================================== */
/* NODE PALETTE — left-docked, click-to-add list of every node kind      */
/* (all 10 question types + Condition/Action/Component). Click-to-add    */
/* rather than drag-to-canvas — see the approved plan's rationale        */
/* (no existing precedent in this app for native-HTML-DnD creating       */
/* something at an arbitrary canvas position, and a click gets a         */
/* working add-flow in one step).                                       */
/* ================================================================== */

const OTHER_KINDS = [
  { kind: "condition", label: "Condition", icon: GitBranch, color: T.hotPink },
  { kind: "action", label: "Action", icon: Zap, color: T.goldenYellow },
  { kind: "component", label: "Component", icon: Blocks, color: T.turquoise },
];

function PaletteRow({ icon: Icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: radius.sm,
        fontFamily: font, fontSize: 13, color: T.gray700, boxSizing: "border-box",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.gray50)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: radius.xs, background: `${color}1f`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={13} color={color} />
      </div>
      {label}
    </button>
  );
}

export default function NodePalette({ onAddNode }) {
  return (
    <div style={{ width: 216, flexShrink: 0, borderRight: `1px solid ${T.gray100}`, background: T.white, overflowY: "auto", padding: "16px 10px", boxSizing: "border-box" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.4, padding: "4px 10px 8px" }}>Question Types</div>
      {QUESTION_TYPE_CATALOG.map((t) => (
        <PaletteRow key={t.id} icon={t.icon} label={t.label} color={T.accent} onClick={() => onAddNode("question", t.id)} />
      ))}

      <div style={{ height: 1, background: T.gray75, margin: "10px 0" }} />

      <div style={{ fontSize: 11, fontWeight: 700, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.4, padding: "4px 10px 8px" }}>Flow</div>
      {OTHER_KINDS.map((k) => (
        <PaletteRow key={k.kind} icon={k.icon} label={k.label} color={k.color} onClick={() => onAddNode(k.kind)} />
      ))}
    </div>
  );
}
