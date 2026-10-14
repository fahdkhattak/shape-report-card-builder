import { nextId } from "./id.js";
import { ALL_PERSONAS } from "./surveyBlueprint.js";

/* ================================================================== */
/* SURVEY BLUEPRINT V2 — the "sections" data model behind                */
/* `components/survey/SurveyBuilderV2.jsx`. A plain 3-level tree          */
/* (Dimension > Explorer > Questions) instead of V1's node+edge graph —   */
/* per explicit direction, this is a deliberately separate, simpler        */
/* prototype to compare against V1, not a second view onto the same        */
/* saved data: a free-form graph doesn't map cleanly onto a strict tree     */
/* (branches, multiple incoming edges, orphan nodes have no tree            */
/* equivalent), so forcing one conversion would either lose real V1 data     */
/* or silently invent structure V1 users never asked for. Saved under its     */
/* own `localStorage` key, same honest "prototype, not backend persistence"   */
/* pattern V1/SearchOverlay.jsx already use.                                  */
/*                                                                            */
/* Reuses V1's real question `data` shape verbatim (questionType/prompt/       */
/* helpText/required/dimension/driver/visibleToPersonas/typeData) — a          */
/* V2 question object IS that shape, just without the node envelope            */
/* (`type`/`position`/`kind`), so `QuestionFields.jsx`'s `QuestionEditorBody`    */
/* and every `components/survey/respond/*` renderer both work on it              */
/* unmodified.                                                                    */
/* ================================================================== */

const STORAGE_KEY = "survey-blueprint-v2-draft";

export function createBlueprintV2() {
  const now = Date.now();
  return {
    id: `survey-v2-${nextId()}`,
    name: "Untitled Survey",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    dimensions: [],
  };
}

export function createDimension(name = "New Dimension") {
  return { id: `dim-${nextId()}`, name, explorers: [] };
}

export function createExplorer(name = "New Explorer") {
  return { id: `exp-${nextId()}`, name, questions: [] };
}

export function createQuestionV2(questionType, defaultTypeData, defaultTag) {
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
  };
}

// Flattens the whole tree into an ordered list of questions, each tagged
// with which dimension/explorer it lives under — the survey's actual
// respondent-facing order (V2 has no branching, so declaration order IS
// the flow) and what PreviewModal.jsx's V2 walker steps through.
export function flattenQuestionsV2(blueprint) {
  const rows = [];
  for (const dim of blueprint.dimensions) {
    for (const exp of dim.explorers) {
      for (const q of exp.questions) {
        rows.push({ question: q, dimensionName: dim.name, explorerName: exp.name });
      }
    }
  }
  return rows;
}

export function loadBlueprintV2() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private-browsing/storage-disabled — just won't persist
  }
}

export function saveBlueprintV2(blueprint) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
  } catch {
    /* private-browsing/storage-disabled — just won't persist */
  }
}
