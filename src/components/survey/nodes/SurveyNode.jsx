import { Handle, Position } from "@xyflow/react";
import { GitBranch, Zap, Blocks } from "lucide-react";
import { T, font, radius } from "../../../lib/tokens.js";
import { questionTypeById } from "../../../lib/questionTypes.js";
import { COMPONENT_TYPES } from "../../../lib/surveyBlueprint.js";

/* ================================================================== */
/* SURVEY NODE — the one shared custom React Flow node component for   */
/* every kind (question/condition/action/component), registered once   */
/* as `nodeTypes = { survey: SurveyNode }`. All four kinds share the    */
/* same card chrome and differ only in accent color/icon/summary text   */
/* and handle count — a condition node gets one labeled source Handle   */
/* per branch instead of the usual single one. Colors are drawn from    */
/* the app's Graph/Dataviz palette (never red/amber/green), since this  */
/* is a category distinction between node kinds, not a status.          */
/* ================================================================== */

const KIND_META = {
  question: { color: T.accent, label: "Question" },
  condition: { color: T.hotPink, label: "Condition", icon: GitBranch },
  action: { color: T.goldenYellow, label: "Action", icon: Zap },
  component: { color: T.turquoise, label: "Component", icon: Blocks },
};

function bodyFor(data) {
  if (data.kind === "question") {
    const t = questionTypeById(data.questionType);
    return {
      icon: t?.icon,
      title: data.prompt || `New ${t?.label ?? "question"}`,
      summary: t ? t.summary(data.typeData) : "",
    };
  }
  if (data.kind === "condition") {
    return { icon: KIND_META.condition.icon, title: data.label || "Condition", summary: data.rule.sourceNodeId ? "Branches on a prior answer" : "No rule set yet" };
  }
  if (data.kind === "action") {
    return { icon: KIND_META.action.icon, title: data.name || "Action", summary: data.description || "No real integration — inert" };
  }
  const c = COMPONENT_TYPES.find((c) => c.id === data.componentType);
  return { icon: KIND_META.component.icon, title: c?.label ?? "Component", summary: c?.description ?? "" };
}

const dotStyle = (color) => ({ width: 9, height: 9, background: color, border: `2px solid ${T.white}` });

export default function SurveyNode({ data, selected }) {
  const meta = KIND_META[data.kind];
  const { icon: Icon, title, summary } = bodyFor(data);
  const isCondition = data.kind === "condition";

  return (
    <div
      style={{
        width: 220, background: T.white, border: `1.5px solid ${selected ? meta.color : T.gray100}`,
        borderRadius: radius.lg, boxShadow: selected ? `0 0 0 3px ${meta.color}22, 0 4px 10px rgba(0,0,0,0.08)` : "0 1px 3px rgba(0,0,0,0.06)",
        fontFamily: font, boxSizing: "border-box", position: "relative",
      }}
    >
      <Handle type="target" position={Position.Left} style={dotStyle(T.gray400)} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: `1px solid ${T.gray75}` }}>
        <div style={{ width: 26, height: 26, flexShrink: 0, borderRadius: radius.sm, background: `${meta.color}1f`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {Icon && <Icon size={14} color={meta.color} />}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, textTransform: "uppercase", letterSpacing: 0.3 }}>{meta.label}</span>
      </div>

      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{title}</div>
        {summary && <div style={{ fontSize: 11, color: T.gray500, marginTop: 3 }}>{summary}</div>}
      </div>

      {isCondition ? (
        <div style={{ borderTop: `1px solid ${T.gray75}`, padding: "4px 0" }}>
          {data.branches.map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, padding: "5px 14px", position: "relative" }}>
              <span style={{ fontSize: 10.5, color: T.gray500 }}>{b.label}</span>
              <Handle type="source" position={Position.Right} id={b.id} style={{ ...dotStyle(meta.color), position: "absolute", right: -5 }} />
            </div>
          ))}
        </div>
      ) : (
        <Handle type="source" position={Position.Right} style={dotStyle(meta.color)} />
      )}
    </div>
  );
}
