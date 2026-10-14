import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Play } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import NavRail from "../shell/NavRail.jsx";
import Button from "../ui/Button.jsx";
import VersionSwitcher from "./VersionSwitcher.jsx";
import PageSidebar from "./PageSidebar.jsx";
import QuestionBlockV3 from "./QuestionBlockV3.jsx";
import { QuestionTypePicker } from "./SurveyOutline.jsx";
import PreviewModalV3 from "./PreviewModalV3.jsx";
import { questionTypeById } from "../../lib/questionTypes.js";
import {
  createBlueprintV3, createPage, createQuestionV3,
  loadBlueprintV3, saveBlueprintV3, flattenQuestionsV3,
} from "../../lib/surveyBlueprintV3.js";
import mascotAvatar from "../../assets/mascot-avatar.svg";

const AUTOSAVE_DELAY_MS = 400;
const SPRING = { type: "spring", bounce: 0, duration: 0.35 };

const movePage = (pages, from, to) => {
  if (to < 0 || to >= pages.length) return pages;
  const copy = [...pages];
  const [p] = copy.splice(from, 1);
  copy.splice(to, 0, p);
  return copy;
};
const moveInArray = (arr, from, to) => {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

/* ================================================================== */
/* SURVEY BUILDER — VERSION 3, the "pages" prototype. Per explicit           */
/* direction ("study how Survio creates surveys and use that as a third       */
/* approach for prototyping"), this is modeled directly on real, researched    */
/* Survio UX (survio.com/en/create-a-questionnaire — a live product page         */
/* whose real screenshots show the actual editor, not marketing copy):            */
/*                                                                                  */
/* - A flat "Survey pages" sidebar (Welcome/Page 1/Page 2/Exit in Survio's own       */
/*   screenshot) instead of V2's Dimension>Explorer nesting or V1's free graph —      */
/*   see `PageSidebar.jsx`.                                                            */
/* - Each question renders in the main column as an actual live-styled preview          */
/*   of the real respondent question (reusing this app's own `respond/*`                 */
/*   renderers read-only), not an abstract editor card — see                              */
/*   `QuestionBlockV3.jsx`'s `LivePreviewBody`.                                            */
/* - Hovering a question reveals a dark floating pill toolbar (Edit/Copy/Logic/             */
/*   Move/Delete) anchored above it — a direct visual match to Survio's own                  */
/*   real hover toolbar, confirmed via an in-browser screenshot during research.              */
/* - Skip logic lives ON the question itself (its own "Logic" action), not as a                */
/*   separate block wired in from elsewhere — Survio's real "Skip to" model, a                  */
/*   deliberately simpler alternative to V1's standalone condition nodes. See                     */
/*   `surveyBlueprintV3.js`'s and `LogicPopover.jsx`'s own header comments for                      */
/*   exactly what was and wasn't ported (no external-URL skip target — nothing                       */
/*   real to redirect to in this app).                                                                 */
/*                                                                                                       */
/* Reuses the same real 9-question-type catalog, the same `QuestionEditorBody`                          */
/* editing UI, the same respondent-facing Preview chrome, and even the exact                             */
/* `QuestionTypePicker` dropdown component V2 uses for "Add Question" (that                               */
/* component was rebuilt this same pass to fix a real clipping bug — see its                                */
/* own header comment in `SurveyOutline.jsx` — reusing it here means V3 gets the                             */
/* fix for free and there's one dropdown implementation, not three).                                          */
/* ================================================================== */
export default function SurveyBuilderV3({ navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder, onExit, version, onVersionChange }) {
  const [blueprint, setBlueprint] = useState(() => loadBlueprintV3() ?? createBlueprintV3());
  const [selectedPageId, setSelectedPageId] = useState(() => blueprint.pages[0]?.id ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimer = useRef(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveBlueprintV3({ ...blueprint, updatedAt: Date.now() });
      setSaveStatus("saved");
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprint]);

  const setName = (name) => setBlueprint((b) => ({ ...b, name }));
  const updatePage = (pages, pageId, fn) => pages.map((p) => (p.id === pageId ? fn(p) : p));

  const addPage = () => {
    const page = createPage(`Page ${blueprint.pages.length + 1}`);
    setBlueprint((b) => ({ ...b, pages: [...b.pages, page] }));
    setSelectedPageId(page.id);
  };
  const renamePage = (pageId, name) => setBlueprint((b) => ({ ...b, pages: updatePage(b.pages, pageId, (p) => ({ ...p, name })) }));
  const deletePage = (pageId) => setBlueprint((b) => {
    const pages = b.pages.filter((p) => p.id !== pageId);
    if (selectedPageId === pageId) setSelectedPageId(pages[0]?.id ?? null);
    return { ...b, pages };
  });
  const reorderPage = (from, to) => setBlueprint((b) => ({ ...b, pages: movePage(b.pages, from, to) }));

  const addQuestion = (pageId, questionType) => setBlueprint((b) => {
    const type = questionTypeById(questionType);
    const question = createQuestionV3(questionType, type.defaultTypeData(), type.defaultTag);
    return { ...b, pages: updatePage(b.pages, pageId, (p) => ({ ...p, questions: [...p.questions, question] })) };
  });
  const patchQuestion = (pageId, qId, patch) => setBlueprint((b) => ({ ...b, pages: updatePage(b.pages, pageId, (p) => ({ ...p, questions: p.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)) })) }));
  const deleteQuestion = (pageId, qId) => setBlueprint((b) => ({ ...b, pages: updatePage(b.pages, pageId, (p) => ({ ...p, questions: p.questions.filter((q) => q.id !== qId) })) }));
  const duplicateQuestion = (pageId, qId) => setBlueprint((b) => ({
    ...b,
    pages: updatePage(b.pages, pageId, (p) => {
      const idx = p.questions.findIndex((q) => q.id === qId);
      if (idx === -1) return p;
      const copy = { ...p.questions[idx], id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      const questions = [...p.questions];
      questions.splice(idx + 1, 0, copy);
      return { ...p, questions };
    }),
  }));
  const moveQuestion = (pageId, from, to) => setBlueprint((b) => ({ ...b, pages: updatePage(b.pages, pageId, (p) => ({ ...p, questions: moveInArray(p.questions, from, to) })) }));
  const moveQuestionToPage = (fromPageId, qId, toPageId) => setBlueprint((b) => {
    const fromPage = b.pages.find((p) => p.id === fromPageId);
    const question = fromPage?.questions.find((q) => q.id === qId);
    if (!question) return b;
    return {
      ...b,
      pages: b.pages.map((p) => {
        if (p.id === fromPageId) return { ...p, questions: p.questions.filter((q) => q.id !== qId) };
        if (p.id === toPageId) return { ...p, questions: [...p.questions, question] };
        return p;
      }),
    };
  });

  const allRows = flattenQuestionsV3(blueprint);
  const selectedPage = blueprint.pages.find((p) => p.id === selectedPageId) ?? null;

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
            <Button theme="accent" variation="primary" size="xs" iconLeft={<Play size={14} />} onClick={() => setPreviewOpen(true)} disabled={allRows.length === 0}>Preview</Button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {blueprint.pages.length === 0 ? (
            <div style={{ flex: 1, overflowY: "auto", padding: "32px", background: T.gray50 }}>
              <AnimatePresence>
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={SPRING} style={{ textAlign: "center", padding: "56px 24px", maxWidth: 420, margin: "0 auto" }}>
                  <img src={mascotAvatar} width={56} height={56} alt="" style={{ marginBottom: 16 }} />
                  <div style={{ fontSize: 19, fontWeight: 700, color: T.gray900, marginBottom: 6, letterSpacing: "-0.01em" }}>Let's build a survey, page by page</div>
                  <div style={{ fontSize: 13.5, color: T.gray500, maxWidth: 380, margin: "0 auto 22px", lineHeight: 1.5 }}>
                    Every survey is a set of pages, and every page holds a few questions — add a page to get started.
                  </div>
                  <Button theme="accent" variation="primary" size="sm" onClick={addPage}>Add your first Page</Button>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <>
              <PageSidebar
                pages={blueprint.pages}
                selectedPageId={selectedPageId}
                onSelectPage={setSelectedPageId}
                onAddPage={addPage}
                onRenamePage={renamePage}
                onMovePage={reorderPage}
                onDeletePage={deletePage}
              />
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 80px", background: T.gray50 }}>
                <div style={{ maxWidth: 640, margin: "0 auto" }}>
                  {selectedPage && (
                    <>
                      <AnimatePresence initial={false}>
                        {selectedPage.questions.map((q, i) => (
                          <QuestionBlockV3
                            key={q.id}
                            question={q}
                            pages={blueprint.pages}
                            currentPageId={selectedPage.id}
                            otherRows={allRows.filter((r) => r.question.id !== q.id)}
                            onPatch={(patch) => patchQuestion(selectedPage.id, q.id, patch)}
                            onDelete={() => deleteQuestion(selectedPage.id, q.id)}
                            onDuplicate={() => duplicateQuestion(selectedPage.id, q.id)}
                            onMoveUp={() => moveQuestion(selectedPage.id, i, i - 1)}
                            onMoveDown={() => moveQuestion(selectedPage.id, i, i + 1)}
                            canMoveUp={i > 0}
                            canMoveDown={i < selectedPage.questions.length - 1}
                            onMoveToPage={(toPageId) => moveQuestionToPage(selectedPage.id, q.id, toPageId)}
                          />
                        ))}
                      </AnimatePresence>
                      {selectedPage.questions.length === 0 && (
                        <div style={{ textAlign: "center", padding: "32px 0 20px", fontSize: 13, color: T.gray300 }}>No questions on this page yet.</div>
                      )}
                      <div style={{ background: T.white, border: `1.5px dashed ${T.gray100}`, borderRadius: radius.xl, padding: "14px 18px" }}>
                        <QuestionTypePicker onPick={(type) => addQuestion(selectedPage.id, type)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {previewOpen && <PreviewModalV3 blueprint={blueprint} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
