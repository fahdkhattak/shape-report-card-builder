import { useState, useRef } from "react";
import { motion } from "motion/react";
import { X, ArrowLeft, Blocks } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { PERSONAS, COMPONENT_TYPES, findStartNode, outgoingEdges } from "../../lib/surveyBlueprint.js";
import QuestionScreen from "./respond/QuestionScreen.jsx";
import QuestionBody from "./respond/QuestionBody.jsx";
import ToggleBoardRespond from "./respond/ToggleBoardRespond.jsx";
import CustomRespond from "./respond/CustomRespond.jsx";

const SPRING = { type: "spring", bounce: 0, duration: 0.28 };

/* ================================================================== */
/* PREVIEW MODAL — walks the blueprint's node graph as a simulated        */
/* respondent, per the approved plan's "preview mechanics" section.        */
/* Condition/action nodes and persona-filtered nodes are never shown —      */
/* `resolveVisibleNode` transparently walks past all of them (with a         */
/* cycle guard) until it lands on a real question/component node or the      */
/* end of the graph. A condition's rule is a single comparison, so only       */
/* its first two branches are ever reachable from it (matched -> branch 0,    */
/* else -> branch 1) — a deliberate v1 simplification, not a bug: modeling     */
/* true multi-way branching from one rule would need a richer rule shape       */
/* than the approved plan's `{sourceNodeId, op, value}` covers.                */
/* ================================================================== */

function evaluateRule(rule, answers) {
  const answer = answers[rule.sourceNodeId];
  switch (rule.op) {
    case "lte": return Number(answer) <= Number(rule.value);
    case "gte": return Number(answer) >= Number(rule.value);
    case "includes": return Array.isArray(answer) ? answer.includes(rule.value) : String(answer ?? "").includes(rule.value);
    default: return String(answer ?? "") === String(rule.value);
  }
}

function resolveVisibleNode(startId, nodeById, edges, answers, persona, onAction) {
  let id = startId;
  const guard = new Set();
  while (id) {
    if (guard.has(id)) return null; // cycle guard
    guard.add(id);
    const node = nodeById.get(id);
    if (!node) return null;
    const { kind } = node.data;

    if (kind === "condition") {
      const matched = node.data.rule.sourceNodeId ? evaluateRule(node.data.rule, answers) : false;
      const branchId = matched ? node.data.branches[0]?.id : node.data.branches[1]?.id;
      id = edges.find((e) => e.source === id && e.sourceHandle === branchId)?.target ?? null;
      continue;
    }
    if (kind === "action") {
      onAction(node.data.name);
      id = outgoingEdges(id, edges)[0]?.target ?? null;
      continue;
    }
    if (node.data.visibleToPersonas && !node.data.visibleToPersonas.includes(persona)) {
      id = outgoingEdges(id, edges)[0]?.target ?? null;
      continue;
    }
    return node; // a real question/component to show
  }
  return null;
}

export default function PreviewModal({ nodes, edges, onClose }) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const totalQuestions = nodes.filter((n) => n.data.kind === "question").length;
  const actionLog = useRef([]);

  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState([]);
  const [currentNode, setCurrentNode] = useState(() => resolveVisibleNode(findStartNode(nodes, edges)?.id ?? null, nodeById, edges, {}, PERSONAS[0].id, (n) => actionLog.current.push(n)));

  const restart = (nextPersona = persona, keepAnswers = false) => {
    const a = keepAnswers ? answers : {};
    setAnswers(a);
    setHistory([]);
    setPersona(nextPersona);
    setCurrentNode(resolveVisibleNode(findStartNode(nodes, edges)?.id ?? null, nodeById, edges, a, nextPersona, (n) => actionLog.current.push(n)));
  };

  const advance = () => {
    if (!currentNode) return;
    setHistory((h) => [...h, currentNode.id]);
    const next = outgoingEdges(currentNode.id, edges)[0]?.target ?? null;
    setCurrentNode(resolveVisibleNode(next, nodeById, edges, answers, persona, (n) => actionLog.current.push(n)));
  };

  const goBack = () => {
    if (!history.length) return;
    const prevId = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentNode(nodeById.get(prevId) ?? null);
  };

  const setAnswer = (value) => setAnswers((a) => ({ ...a, [currentNode.id]: value }));
  const progress = totalQuestions ? Math.min(1, Object.keys(answers).length / totalQuestions) : 0;

  const renderBody = () => {
    if (!currentNode) return null;
    const { data } = currentNode;
    if (data.kind === "component") {
      const c = COMPONENT_TYPES.find((c) => c.id === data.componentType);
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0", textAlign: "center" }}>
          <Blocks size={28} color={T.turquoise} />
          <span style={{ fontSize: 13, color: T.gray500 }}>{c?.description}</span>
        </div>
      );
    }
    const value = answers[currentNode.id];
    if (data.questionType === "toggle-board") return <ToggleBoardRespond typeData={data.typeData} value={value} onChange={setAnswer} />;
    if (data.questionType === "custom") return <CustomRespond typeData={data.typeData} value={value} onChange={setAnswer} />;
    return <QuestionBody questionType={data.questionType} typeData={data.typeData} value={value} onChange={setAnswer} />;
  };

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING}
      style={{ position: "fixed", inset: 0, background: "rgba(35,31,32,0.45)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: font }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", borderRadius: radius.full, padding: "6px 6px 6px 14px" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Previewing as</span>
        <select value={persona} onChange={(e) => restart(e.target.value)} style={{ fontSize: 12, fontFamily: font, fontWeight: 600, color: T.gray900, background: T.white, border: "none", borderRadius: radius.full, padding: "5px 10px", cursor: "pointer" }}>
          {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {history.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); goBack(); }} title="Back" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#fff", display: "flex", padding: 6 }}><ArrowLeft size={16} /></button>
        )}
        <button onClick={onClose} title="Close preview" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#fff", display: "flex", padding: 6 }}><X size={18} /></button>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        {currentNode ? (
          <QuestionScreen
            prompt={currentNode.data.kind === "component" ? (COMPONENT_TYPES.find((c) => c.id === currentNode.data.componentType)?.label) : currentNode.data.prompt}
            helpText={currentNode.data.helpText}
            progress={progress}
            onOk={advance}
            okDisabled={currentNode.data.kind === "question" && currentNode.data.required && (answers[currentNode.id] === undefined || answers[currentNode.id] === "")}
          >
            {renderBody()}
          </QuestionScreen>
        ) : (
          <div style={{ width: 480, maxWidth: "92vw", background: T.white, borderRadius: radius.xxl, border: `1px solid ${T.gray100}`, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.gray900, marginBottom: 8 }}>End of survey</div>
            <div style={{ fontSize: 13, color: T.gray500, marginBottom: 20 }}>
              {totalQuestions ? `${Object.keys(answers).length} of ${totalQuestions} questions answered as ${PERSONAS.find((p) => p.id === persona)?.label}.` : "This blueprint has no questions yet."}
            </div>
            <button onClick={() => restart(persona)} style={{ border: `1px solid ${T.gray100}`, background: T.white, borderRadius: radius.full, padding: "8px 16px", fontSize: 13, fontFamily: font, color: T.gray700, cursor: "pointer" }}>Restart preview</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
