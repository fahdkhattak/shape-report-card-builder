import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { X, ArrowLeft } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { PERSONAS } from "../../lib/surveyBlueprint.js";
import { flattenQuestionsV3 } from "../../lib/surveyBlueprintV3.js";
import QuestionScreen from "./respond/QuestionScreen.jsx";
import QuestionBody from "./respond/QuestionBody.jsx";
import ToggleBoardRespond from "./respond/ToggleBoardRespond.jsx";
import CustomRespond from "./respond/CustomRespond.jsx";

const SPRING = { type: "spring", bounce: 0, duration: 0.28 };

function evaluateRule(rule, answer) {
  switch (rule.op) {
    case "lte": return Number(answer) <= Number(rule.value);
    case "gte": return Number(answer) >= Number(rule.value);
    case "includes": return Array.isArray(answer) ? answer.includes(rule.value) : String(answer ?? "").includes(rule.value);
    default: return String(answer ?? "") === String(rule.value);
  }
}

/* ================================================================== */
/* PREVIEW MODAL — VERSION 3. Walks `flattenQuestionsV3`'s ordered row        */
/* list, same shared respondent chrome V1/V2 use (`QuestionScreen`,            */
/* `QuestionBody`, `ToggleBoardRespond`, `CustomRespond`). The one real           */
/* structural difference from V2's walker: after each answer, if the JUST-         */
/* answered question carries a `skipRule` (see `surveyBlueprintV3.js`) that         */
/* evaluates true against that answer, the walker jumps directly to the              */
/* rule's `targetId` (or ends the survey for `"end"`) instead of advancing to          */
/* the next row in declared order — V1's condition-node branching, expressed            */
/* as a property of the question itself rather than a separate node, matching            */
/* Survio's real "Skip to" model this version is built from.                               */
/* ================================================================== */
export default function PreviewModalV3({ blueprint, onClose }) {
  const allRows = useMemo(() => flattenQuestionsV3(blueprint), [blueprint]);

  const firstVisibleFrom = (startIdx, p) => {
    for (let i = startIdx; i < allRows.length; i++) {
      const q = allRows[i].question;
      if (!q.visibleToPersonas || q.visibleToPersonas.includes(p)) return i;
    }
    return null;
  };

  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState([]);
  const [index, setIndex] = useState(() => firstVisibleFrom(0, PERSONAS[0].id)); // null = end of survey

  const restart = (nextPersona) => {
    setPersona(nextPersona);
    setAnswers({});
    setHistory([]);
    setIndex(firstVisibleFrom(0, nextPersona));
  };

  const current = index != null ? allRows[index] : null;
  const progress = allRows.length ? Math.min(1, Object.keys(answers).length / allRows.length) : 0;

  const setAnswer = (value) => setAnswers((a) => ({ ...a, [current.question.id]: value }));

  const advance = () => {
    if (!current) return;
    const value = answers[current.question.id];
    const rule = current.question.skipRule;
    setHistory((h) => [...h, index]);
    if (rule && rule.targetId && evaluateRule(rule, value)) {
      if (rule.targetId === "end") { setIndex(null); return; }
      const targetIdx = allRows.findIndex((r) => r.question.id === rule.targetId);
      setIndex(targetIdx === -1 ? null : firstVisibleFrom(targetIdx, persona));
      return;
    }
    setIndex(firstVisibleFrom(index + 1, persona));
  };

  const goBack = () => {
    if (!history.length) return;
    const prevIdx = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setIndex(prevIdx);
  };

  const renderBody = () => {
    if (!current) return null;
    const { question } = current;
    const value = answers[question.id];
    if (question.questionType === "toggle-board") return <ToggleBoardRespond typeData={question.typeData} value={value} onChange={setAnswer} />;
    if (question.questionType === "custom") return <CustomRespond typeData={question.typeData} value={value} onChange={setAnswer} />;
    return <QuestionBody questionType={question.questionType} typeData={question.typeData} value={value} onChange={setAnswer} />;
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
        {current ? (
          <QuestionScreen
            prompt={current.question.prompt}
            helpText={current.question.helpText}
            progress={progress}
            onOk={advance}
            okDisabled={current.question.required && (answers[current.question.id] === undefined || answers[current.question.id] === "")}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
              {current.pageName}
            </div>
            {renderBody()}
          </QuestionScreen>
        ) : (
          <div style={{ width: 480, maxWidth: "92vw", background: T.white, borderRadius: radius.xxl, border: `1px solid ${T.gray100}`, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.gray900, marginBottom: 8 }}>End of survey</div>
            <div style={{ fontSize: 13, color: T.gray500, marginBottom: 20 }}>
              {allRows.length ? `${Object.keys(answers).length} of ${allRows.length} questions answered as ${PERSONAS.find((p) => p.id === persona)?.label}.` : "This survey has no questions yet."}
            </div>
            <button onClick={() => restart(persona)} style={{ border: `1px solid ${T.gray100}`, background: T.white, borderRadius: radius.full, padding: "8px 16px", fontSize: 13, fontFamily: font, color: T.gray700, cursor: "pointer" }}>Restart preview</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
