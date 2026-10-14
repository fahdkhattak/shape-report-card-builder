import { nextId } from "./id.js";

/* ================================================================== */
/* SURVEY BLUEPRINT — the data model behind the Survey Builder          */
/* (components/survey/*). A blueprint is a plain node+edge graph        */
/* (same shape React Flow itself uses) plus a little top-level meta —   */
/* it's a document, not a running workflow: nothing here executes       */
/* anything, it just describes a survey's structure for the canvas      */
/* editor to read/write and PreviewModal.jsx to walk through.           */
/*                                                                      */
/* Phase 2 only (see the approved plan) — `status` exists as a future    */
/* hook for phase 1 (prompt -> AI-generated survey) and a real publish   */
/* pipeline, neither of which this pass touches; it always stays        */
/* "draft" here.                                                        */
/* ================================================================== */

// Fixed, per explicit product correction — NOT demographic-based (age/
// gender/tenure/etc. are reserved for later classification/heatmap
// features elsewhere in SHAPE, not this tool). These three roles are
// "uniform in the shape system": regular employees, managers (have
// direct reports), and the rare "senior most person" role.
export const PERSONAS = [
  { id: "employee", label: "Employee" },
  { id: "manager", label: "Manager" },
  { id: "senior-leader", label: "Senior Leader" },
];
export const ALL_PERSONAS = PERSONAS.map((p) => p.id);

// A small extensible catalog for `component` nodes — inserted non-question
// blocks. "your-network" is the user's own example; the other two are
// obvious, low-risk additions to the same mechanism, not scope creep.
export const COMPONENT_TYPES = [
  { id: "your-network", label: "Your Network", description: "Shows the respondent their support network graphic." },
  { id: "intro-screen", label: "Intro Screen", description: "A welcome/context screen before questions begin." },
  { id: "thank-you-screen", label: "Thank You Screen", description: "A closing screen shown at the end of the survey." },
];

const STORAGE_KEY = "survey-blueprint-draft";

export function createBlueprint() {
  const now = Date.now();
  return {
    id: `blueprint-${nextId()}`,
    name: "Untitled Survey",
    status: "draft", // "draft" | "validated" | "published" — unused hook this pass
    createdAt: now,
    updatedAt: now,
    nodes: [],
    edges: [],
  };
}

export function createNode(kind, position, extra = {}) {
  return {
    id: `node-${nextId()}`,
    type: "survey",
    position,
    data: { kind, ...extra },
  };
}

export function createQuestionNode(questionType, position, defaultTypeData) {
  return createNode("question", position, {
    questionType,
    prompt: "",
    helpText: null,
    required: true,
    dimension: null,
    driver: null,
    visibleToPersonas: [...ALL_PERSONAS],
    typeData: defaultTypeData,
  });
}

export function createConditionNode(position) {
  return createNode("condition", position, {
    label: "New condition",
    rule: { sourceNodeId: null, op: "eq", value: "" },
    branches: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  });
}

export function createActionNode(position) {
  return createNode("action", position, {
    name: "New action",
    description: "",
  });
}

export function createComponentNode(position) {
  return createNode("component", position, {
    componentType: COMPONENT_TYPES[0].id,
    visibleToPersonas: [...ALL_PERSONAS],
  });
}

// The start of the survey — the one node nothing points to. Falls back to
// the first node if the graph is a cycle/every node has an incoming edge
// (shouldn't normally happen, but PreviewModal needs somewhere to start).
export function findStartNode(nodes, edges) {
  const targets = new Set(edges.map((e) => e.target));
  return nodes.find((n) => !targets.has(n.id)) ?? nodes[0] ?? null;
}

export function outgoingEdges(nodeId, edges) {
  return edges.filter((e) => e.source === nodeId);
}

export function loadBlueprint() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private-browsing/storage-disabled — just won't persist
  }
}

export function saveBlueprint(blueprint) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
  } catch {
    /* private-browsing/storage-disabled — just won't persist */
  }
}
