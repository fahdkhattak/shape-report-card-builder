import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { X, ArrowLeft } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { PERSONAS } from "../../lib/surveyBlueprint.js";
import { flattenQuestionsV2 } from "../../lib/surveyBlueprintV2.js";
import QuestionScreen from "./respond/QuestionScreen.jsx";
import QuestionBody from "./respond/QuestionBody.jsx";
import ToggleBoardRespond from "./respond/ToggleBoardRespond.jsx";
import CustomRespond from "./respond/CustomRespond.jsx";

const SPRING = { type: "spring", bounce: 0, duration: 0.28 };

/* ================================================================== */
/* PREVIEW MODAL — VERSION 2. Walks the flattened dimension/explorer      */
/* question list in declared order — no graph, no condition evaluation,   */
/* just "next visible question" — since V2 has no branching by design.     */
/* Reuses the exact same respondent-facing shell/renderers V1's              */
/* PreviewModal.jsx uses (`QuestionScreen`, `QuestionBody`,                   */
/* `ToggleBoardRespond`, `CustomRespond`) — those are pure, type-driven and    */
/* don't know or care whether they're being walked by a graph or a list.       */
/* ================================================================== */
export default function PreviewModalV2({ blueprint, onClose }) {
  const allRows = useMemo(() => flattenQuestionsV2(blueprint), [blueprint]);
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);

  const visibleRows = useMemo(
    () => allRows.filter((r) => !r.question.visibleToPersonas || r.question.visibleToPersonas.includes(persona)),
    [allRows, persona]
  );
  const current = visibleRows[index] ?? null;
  const progress = visibleRows.length ? Math.min(1, Object.keys(answers).length / visibleRows.length) : 0;

  const restart = (nextPersona) => {
    setPersona(nextPersona);
    setAnswers({});
    setIndex(0);
  };

  const setAnswer = (value) => setAnswers((a) => ({ ...a, [current.question.id]: value }));
  const advance = () => setIndex((i) => i + 1);
  const goBack = () => setIndex((i) => Math.max(0, i - 1));

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
        {index > 0 && (
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
              {current.dimensionName} · {current.explorerName}
            </div>
            {renderBody()}
          </QuestionScreen>
        ) : (
          <div style={{ width: 480, maxWidth: "92vw", background: T.white, borderRadius: radius.xxl, border: `1px solid ${T.gray100}`, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.gray900, marginBottom: 8 }}>End of survey</div>
            <div style={{ fontSize: 13, color: T.gray500, marginBottom: 20 }}>
              {visibleRows.length ? `${Object.keys(answers).length} of ${visibleRows.length} questions answered as ${PERSONAS.find((p) => p.id === persona)?.label}.` : "This survey has no questions yet."}
            </div>
            <button onClick={() => restart(persona)} style={{ border: `1px solid ${T.gray100}`, background: T.white, borderRadius: radius.full, padding: "8px 16px", fontSize: 13, fontFamily: font, color: T.gray700, cursor: "pointer" }}>Restart preview</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
