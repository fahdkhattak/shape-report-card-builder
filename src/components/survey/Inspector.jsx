import { Trash2, Plus, X } from "lucide-react";
import { T, font } from "../../lib/tokens.js";
import { questionTypeById } from "../../lib/questionTypes.js";
import { COMPONENT_TYPES } from "../../lib/surveyBlueprint.js";
import { TextField, SelectField, Section, QuestionEditorBody, fieldStyle } from "./QuestionFields.jsx";
import PersonaVisibilityField from "./PersonaVisibilityField.jsx";
import Button from "../ui/Button.jsx";

/* ================================================================== */
/* INSPECTOR — right-docked property panel for the selected node          */
/* (Survey Builder V1, the node canvas). One small form per node kind,    */
/* all patching through `onPatch(nodeId, dataPatch)`. Question editing    */
/* itself lives in `QuestionFields.jsx`'s `QuestionEditorBody` — shared    */
/* verbatim with V2's inline section editor, not duplicated here.         */
/* ================================================================== */

function ConditionInspector({ node, nodes, onPatch }) {
  const { data } = node;
  const priorQuestions = nodes.filter((n) => n.data.kind === "question" && n.id !== node.id);
  const source = priorQuestions.find((n) => n.id === data.rule.sourceNodeId);
  const sourceType = source ? questionTypeById(source.data.questionType) : null;
  const setRule = (patch) => onPatch({ rule: { ...data.rule, ...patch } });

  const addBranch = () => {
    const n = data.branches.length + 1;
    onPatch({ branches: [...data.branches, { id: `branch-${Date.now()}`, label: `Branch ${n}` }] });
  };
  const removeBranch = (id) => onPatch({ branches: data.branches.filter((b) => b.id !== id) });
  const renameBranch = (id, label) => onPatch({ branches: data.branches.map((b) => (b.id === id ? { ...b, label } : b)) });

  return (
    <>
      <Section label="Condition">
        <TextField label="Label" value={data.label} onChange={(v) => onPatch({ label: v })} />
        <SelectField
          label="If the answer to"
          value={data.rule.sourceNodeId ?? ""}
          onChange={(v) => setRule({ sourceNodeId: v || null, value: "" })}
          options={[{ value: "", label: "Select a question..." }, ...priorQuestions.map((n) => ({ value: n.id, label: n.data.prompt || `Untitled ${questionTypeById(n.data.questionType)?.label ?? "question"}` }))]}
        />
        <SelectField
          label="Comparison"
          value={data.rule.op}
          onChange={(v) => setRule({ op: v })}
          options={[{ value: "eq", label: "is" }, { value: "lte", label: "is at most" }, { value: "gte", label: "is at least" }, { value: "includes", label: "includes" }]}
        />
        {sourceType && sourceType.id === "multiple-choice" ? (
          <SelectField label="Value" value={data.rule.value} onChange={(v) => setRule({ value: v })} options={[{ value: "", label: "Select..." }, ...(source.data.typeData.options ?? []).map((o) => ({ value: o, label: o }))]} />
        ) : (
          <TextField label="Value" value={data.rule.value} onChange={(v) => setRule({ value: v })} placeholder="e.g. 3" />
        )}
      </Section>

      <Section label="Branches">
        {data.branches.map((b) => (
          <div key={b.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={b.label} onChange={(e) => renameBranch(b.id, e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
            <button onClick={() => removeBranch(b.id)} disabled={data.branches.length <= 1} style={{ border: "none", background: "transparent", cursor: data.branches.length <= 1 ? "default" : "pointer", color: T.gray300, display: "flex", flexShrink: 0 }}><Trash2 size={13} /></button>
          </div>
        ))}
        <Button theme="brand" variation="ghost" size="xs" iconLeft={<Plus size={13} />} onClick={addBranch}>Add branch</Button>
        <span style={{ fontSize: 11, color: T.gray400 }}>Drag a connection from each branch's dot on the canvas to the question it should lead to.</span>
      </Section>
    </>
  );
}

function ActionInspector({ node, onPatch }) {
  const { data } = node;
  return (
    <Section label="Action">
      <TextField label="Name" value={data.name} onChange={(v) => onPatch({ name: v })} />
      <TextField label="Description" value={data.description} onChange={(v) => onPatch({ description: v })} placeholder="What this action is meant to do" />
      <span style={{ fontSize: 11, color: T.gray400 }}>Documentation only — no real integration fires this yet.</span>
    </Section>
  );
}

function ComponentInspector({ node, onPatch }) {
  const { data } = node;
  return (
    <>
      <Section label="Component">
        <SelectField label="Type" value={data.componentType} onChange={(v) => onPatch({ componentType: v })} options={COMPONENT_TYPES.map((c) => ({ value: c.id, label: c.label }))} />
      </Section>
      <Section label="Visibility">
        <PersonaVisibilityField value={data.visibleToPersonas} onChange={(v) => onPatch({ visibleToPersonas: v })} />
      </Section>
    </>
  );
}

const KIND_INSPECTORS = {
  question: ({ node, onPatch }) => <QuestionEditorBody data={node.data} onPatch={onPatch} />,
  condition: ConditionInspector,
  action: ActionInspector,
  component: ComponentInspector,
};
const KIND_LABELS = { question: "Question", condition: "Condition", action: "Action", component: "Component" };

export default function Inspector({ node, nodes, onPatch, onDeleteNode, onClose }) {
  if (!node) return null;
  const Body = KIND_INSPECTORS[node.data.kind];

  return (
    <div style={{ width: 300, flexShrink: 0, borderLeft: `1px solid ${T.gray100}`, background: T.white, overflowY: "auto", display: "flex", flexDirection: "column", fontFamily: font }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${T.gray75}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.gray900 }}>{KIND_LABELS[node.data.kind]}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onDeleteNode(node.id)} title="Delete node" style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray400, display: "flex", padding: 4 }}><Trash2 size={15} /></button>
          <button onClick={onClose} title="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray400, display: "flex", padding: 4 }}><X size={15} /></button>
        </div>
      </div>
      <Body node={node} nodes={nodes} onPatch={(patch) => onPatch(node.id, patch)} />
    </div>
  );
}
