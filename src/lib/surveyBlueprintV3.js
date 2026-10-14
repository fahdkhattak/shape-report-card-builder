import { nextId } from "./id.js";
import { ALL_PERSONAS } from "./surveyBlueprint.js";

/* ================================================================== */
/* SURVEY BLUEPRINT V3 — the "pages" data model behind                   */
/* `components/survey/SurveyBuilderV3.jsx`, modeled directly on real       */
/* research into how Survio (survio.com) structures a survey: a flat        */
/* ordered list of Pages, each holding an ordered list of Questions — no     */
/* Dimension/Explorer nesting (V2) and no free node graph (V1). Real           */
/* Survio screenshots (survio.com/en/create-a-questionnaire) show a "Survey    */
/* pages" sidebar (Welcome page / Page 1 / Page 2 / Exit page, each with a      */
/* "..." menu) and a main column where each question renders as an actual       */
/* live-styled preview of the real respondent question, not an abstract form.    */
/*                                                                                 */
/* Logic is per-question, not a separate block (Survio's own "Logic" action        */
/* lives in the hover toolbar on the question itself) — a question optionally       */
/* carries `skipRule: { op, value, targetId }`, evaluated against that SAME          */
/* question's own answer once it's answered (targetId is another question's id       */
/* or the literal string "end"). This is a deliberately simpler branching model       */
/* than V1's separate condition nodes with named multi-way branches — matches          */
/* Survio's real "Skip to" picker (Question / Survey exit), not a general-purpose        */
/* workflow primitive. "Your web" (an external-URL skip target, also real in            */
/* Survio) was deliberately left out — this app has no real destination for an           */
/* external redirect to go to, and building an inert-looking URL field would be           */
/* exactly the kind of fake functionality this project avoids elsewhere.                   */
/*                                                                                          */
/* Reuses V1/V2's real question `data` shape verbatim (questionType/prompt/                 */
/* helpText/required/dimension/driver/visibleToPersonas/typeData) plus the new               */
/* `skipRule` field, so `QuestionFields.jsx`'s `QuestionEditorBody` and every                  */
/* `components/survey/respond/*` renderer both work on it unmodified. Saved under              */
/* its own `localStorage` key — a deliberately separate, independent prototype to               */
/* compare against V1/V2, not a third view onto the same data (same reasoning                    */
/* `surveyBlueprintV2.js`'s own header comment already gives for why V1/V2 don't                  */
/* share one model either).                                                                        */
/* ================================================================== */

const STORAGE_KEY = "survey-blueprint-v3-draft";

export function createBlueprintV3() {
  const now = Date.now();
  return {
    id: `survey-v3-${nextId()}`,
    name: "Untitled Survey",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    pages: [],
  };
}

export function createPage(name = "New Page") {
  return { id: `page-${nextId()}`, name, questions: [] };
}

export function createQuestionV3(questionType, defaultTypeData, defaultTag) {
  return {
    id: `q-${nextId()}`,
    questionType,
    prompt: "",
    helpText: null,
    required: true,
    dimension: defaultTag?.dimension ?? null,
    driver: defaultTag?.driver ?? null,
    visibleToPersonas: [...ALL_PERSONAS],
    typeData: defaultTypeData,
    skipRule: null,
  };
}

// Flattens pages into an ordered list of questions with page context — the
// survey's real respondent-facing order absent any skip jump, and the base
// sequence PreviewModalV3's walker steps through (jumping via skipRule when
// one fires).
export function flattenQuestionsV3(blueprint) {
  const rows = [];
  for (const page of blueprint.pages) {
    for (const q of page.questions) {
      rows.push({ question: q, pageId: page.id, pageName: page.name });
    }
  }
  return rows;
}

export function findQuestionV3(blueprint, questionId) {
  for (const page of blueprint.pages) {
    const q = page.questions.find((q) => q.id === questionId);
    if (q) return q;
  }
  return null;
}

export function loadBlueprintV3() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private-browsing/storage-disabled — just won't persist
  }
}

export function saveBlueprintV3(blueprint) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
  } catch {
    /* private-browsing/storage-disabled — just won't persist */
  }
}
