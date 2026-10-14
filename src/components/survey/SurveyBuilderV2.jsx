import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Play } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import NavRail from "../shell/NavRail.jsx";
import Button from "../ui/Button.jsx";
import { DimensionBlock, DIMENSION_COLORS } from "./SurveyOutline.jsx";
import PreviewModalV2 from "./PreviewModalV2.jsx";
import VersionSwitcher from "./VersionSwitcher.jsx";
import { questionTypeById } from "../../lib/questionTypes.js";
import {
  createBlueprintV2, createDimension, createExplorer, createQuestionV2,
  loadBlueprintV2, saveBlueprintV2, flattenQuestionsV2,
} from "../../lib/surveyBlueprintV2.js";
import mascotAvatar from "../../assets/mascot-avatar.svg";

const AUTOSAVE_DELAY_MS = 400;
const SPRING = { type: "spring", bounce: 0, duration: 0.35 };

const moveItem = (arr, from, to) => {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};
const updateDim = (dims, dimId, fn) => dims.map((d) => (d.id === dimId ? fn(d) : d));
const updateExp = (dim, expId, fn) => ({ ...dim, explorers: dim.explorers.map((e) => (e.id === expId ? fn(e) : e)) });

/* ================================================================== */
/* SURVEY BUILDER — VERSION 2, the "sections" outline editor. Per         */
/* explicit direction ("make this more usable and consumer friendly...     */
/* think simple people need to make this"): a plain Dimension > Explorer >  */
/* Question document instead of V1's node canvas — no manual linking, no     */
/* pan/zoom, nothing to learn beyond "add a section, add a question." A       */
/* second round of direct feedback ("still looks too cluttered... take        */
/* liberties — how would Apple do this") drove `SurveyOutline.jsx`'s own       */
/* visual rebuild (typographic hierarchy instead of nested boxes, hover-        */
/* revealed controls, real springs, a color per dimension) — see that            */
/* file's own header comment for the full reasoning; this file's own change      */
/* is the empty state (now the same mascot-centered, editorial welcome           */
/* ChatLanding uses elsewhere in this app, not a plain dashed placeholder         */
/* box) and handing each dimension a real color as it mounts.                     */
/*                                                                                  */
/* Deliberately linear — no condition/action/component blocks. Branching is        */
/* exactly what forces a graph in the first place; dropping it is the actual        */
/* simplification, not just the visual reskin. A survey that genuinely needs         */
/* skip logic still has V1 for that. Same real 10-question-type catalog and the       */
/* same editing UI as V1 (`QuestionFields.jsx`'s `QuestionEditorBody`) and the          */
/* same respondent-facing Preview chrome — only the authoring structure changed.        */
/* ================================================================== */
export default function SurveyBuilderV2({ navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder, onExit, version, onVersionChange }) {
  const [blueprint, setBlueprint] = useState(() => loadBlueprintV2() ?? createBlueprintV2());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimer = useRef(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveBlueprintV2({ ...blueprint, updatedAt: Date.now() });
      setSaveStatus("saved");
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprint]);

  const setName = (name) => setBlueprint((b) => ({ ...b, name }));

  const addDimension = () => setBlueprint((b) => ({ ...b, dimensions: [...b.dimensions, createDimension(`Dimension ${b.dimensions.length + 1}`)] }));
  const patchDimension = (dimId, patch) => setBlueprint((b) => ({ ...b, dimensions: updateDim(b.dimensions, dimId, (d) => ({ ...d, ...patch })) }));
  const deleteDimension = (dimId) => setBlueprint((b) => ({ ...b, dimensions: b.dimensions.filter((d) => d.id !== dimId) }));
  const moveDimension = (from, to) => setBlueprint((b) => ({ ...b, dimensions: moveItem(b.dimensions, from, to) }));

  const addExplorer = (dimId) => setBlueprint((b) => ({ ...b, dimensions: updateDim(b.dimensions, dimId, (d) => ({ ...d, explorers: [...d.explorers, createExplorer(`Explorer ${d.explorers.length + 1}`)] })) }));
  const patchExplorer = (dimId, expId, patch) => setBlueprint((b) => ({ ...b, dimensions: updateDim(b.dimensions, dimId, (d) => updateExp(d, expId, (e) => ({ ...e, ...patch }))) }));
  const deleteExplorer = (dimId, expId) => setBlueprint((b) => ({ ...b, dimensions: updateDim(b.dimensions, dimId, (d) => ({ ...d, explorers: d.explorers.filter((e) => e.id !== expId) })) }));
  const moveExplorer = (dimId, from, to) => setBlueprint((b) => ({ ...b, dimensions: updateDim(b.dimensions, dimId, (d) => ({ ...d, explorers: moveItem(d.explorers, from, to) })) }));

  const addQuestion = (dimId, expId, questionType) => setBlueprint((b) => {
    const type = questionTypeById(questionType);
    const question = createQuestionV2(questionType, type.defaultTypeData(), type.defaultTag);
    return { ...b, dimensions: updateDim(b.dimensions, dimId, (d) => updateExp(d, expId, (e) => ({ ...e, questions: [...e.questions, question] }))) };
  });
  const patchQuestion = (dimId, expId, qId, patch) => setBlueprint((b) => ({ ...b, dimensions: updateDim(b.dimensions, dimId, (d) => updateExp(d, expId, (e) => ({ ...e, questions: e.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)) }))) }));
  const deleteQuestion = (dimId, expId, qId) => setBlueprint((b) => ({ ...b, dimensions: updateDim(b.dimensions, dimId, (d) => updateExp(d, expId, (e) => ({ ...e, questions: e.questions.filter((q) => q.id !== qId) }))) }));
  const moveQuestion = (dimId, expId, from, to) => setBlueprint((b) => ({ ...b, dimensions: updateDim(b.dimensions, dimId, (d) => updateExp(d, expId, (e) => ({ ...e, questions: moveItem(e.questions, from, to) }))) }));

  const totalQuestions = flattenQuestionsV2(blueprint).length;

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", fontFamily: font, position: "relative", overflow: "hidden" }}>
      <NavRail active="survey-builder" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div style={{ padding: "12px 24px", borderBottom: `1px solid ${T.gray75}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.white, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button onClick={onExit} style={{ border: "none", background: "transparent", color: T.gray500, cursor: "pointer", display: "flex", flexShrink: 0 }}><ArrowLeft size={13} /></button>
            <div style={{ minWidth: 0 }}>
              <input
                value={blueprint.name}
                onChange={(e) => setName(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, fontWeight: 700, color: T.gray700, fontFamily: font, padding: 0, width: 220 }}
              />
              <div style={{ fontSize: 10.5, color: T.gray300 }}>{saveStatus === "saving" ? "Saving…" : "Saved locally · Draft"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <VersionSwitcher value={version} onChange={onVersionChange} />
            <Button theme="accent" variation="primary" size="xs" iconLeft={<Play size={14} />} onClick={() => setPreviewOpen(true)} disabled={totalQuestions === 0}>Preview</Button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "32px", background: T.gray50 }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <AnimatePresence mode="wait">
              {blueprint.dimensions.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING} style={{ textAlign: "center", padding: "56px 24px" }}>
                  <img src={mascotAvatar} width={56} height={56} alt="" style={{ marginBottom: 16 }} />
                  <div style={{ fontSize: 19, fontWeight: 700, color: T.gray900, marginBottom: 6, letterSpacing: "-0.01em" }}>Let's build a survey</div>
                  <div style={{ fontSize: 13.5, color: T.gray500, maxWidth: 380, margin: "0 auto 22px", lineHeight: 1.5 }}>
                    Start with a Dimension — a broad area like "Physical Health." Each one holds a few
                    Explorers, and each Explorer holds the actual questions.
                  </div>
                  <Button theme="accent" variation="primary" size="sm" onClick={addDimension}>Add your first Dimension</Button>
                </motion.div>
              ) : (
                <motion.div key="list">
                  <AnimatePresence initial={false}>
                    {blueprint.dimensions.map((dim, i) => (
                      <DimensionBlock
                        key={dim.id}
                        dimension={dim}
                        color={DIMENSION_COLORS[i % DIMENSION_COLORS.length]}
                        onRename={(name) => patchDimension(dim.id, { name })}
                        onDelete={() => deleteDimension(dim.id)}
                        onMove={(dir) => moveDimension(i, i + dir)}
                        canMoveUp={i > 0}
                        canMoveDown={i < blueprint.dimensions.length - 1}
                        onAddExplorer={() => addExplorer(dim.id)}
                        onPatchExplorer={(expId, patch) => patchExplorer(dim.id, expId, patch)}
                        onDeleteExplorer={(expId) => deleteExplorer(dim.id, expId)}
                        onMoveExplorer={(from, to) => moveExplorer(dim.id, from, to)}
                        onAddQuestion={(expId, questionType) => addQuestion(dim.id, expId, questionType)}
                        onPatchQuestion={(expId, qId, patch) => patchQuestion(dim.id, expId, qId, patch)}
                        onDeleteQuestion={(expId, qId) => deleteQuestion(dim.id, expId, qId)}
                        onMoveQuestion={(expId, from, to) => moveQuestion(dim.id, expId, from, to)}
                      />
                    ))}
                  </AnimatePresence>
                  <motion.button
                    onClick={addDimension}
                    whileHover={{ borderColor: T.gray300, background: T.white }}
                    whileTap={{ scale: 0.99 }}
                    style={{ width: "100%", border: `1.5px dashed ${T.gray100}`, borderRadius: radius.xl, background: "transparent", cursor: "pointer", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: T.gray400, fontFamily: font }}
                  >
                    + Add Dimension
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {previewOpen && <PreviewModalV2 blueprint={blueprint} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
