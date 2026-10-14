import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { T, font } from "../../lib/tokens.js";
import NavRail from "../shell/NavRail.jsx";
import NodePalette from "./NodePalette.jsx";
import SurveyCanvas from "./SurveyCanvas.jsx";
import Inspector from "./Inspector.jsx";
import PreviewModal from "./PreviewModal.jsx";
import Button from "../ui/Button.jsx";
import VersionSwitcher from "./VersionSwitcher.jsx";
import { questionTypeById } from "../../lib/questionTypes.js";
import {
  createBlueprint, createQuestionNode, createConditionNode, createActionNode, createComponentNode,
  loadBlueprint, saveBlueprint,
} from "../../lib/surveyBlueprint.js";

const AUTOSAVE_DELAY_MS = 400;

/* ================================================================== */
/* SURVEY BUILDER — VERSION 1, the node-canvas blueprint editor.         */
/* Kept exactly as originally built (see CLAUDE.md's "Survey Builder"     */
/* section) — full free-form node linking (questions, conditions,        */
/* actions, components), the power-user version. `SurveyBuilderScreen    */
/* .jsx` is now the version switcher that mounts this OR                  */
/* `SurveyBuilderV2.jsx`; this file was previously that screen's whole     */
/* body, unchanged except its root now fills the switcher's content row    */
/* (`flex:1`) instead of the full viewport height.                         */
/*                                                                        */
/* Per explicit direction: V1 stays around specifically because it's the   */
/* only version that supports branching/conditions — V2 is deliberately    */
/* linear (see SurveyBuilderV2.jsx's own header comment) for a simpler,    */
/* "simple people can build this" editing experience. Reach for V1 when    */
/* a survey genuinely needs skip logic.                                    */
/* ================================================================== */
export default function SurveyBuilderV1({ navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder, onExit, version, onVersionChange }) {
  const [blueprint] = useState(() => loadBlueprint() ?? createBlueprint());
  const [name, setName] = useState(blueprint.name);
  const [nodes, setNodes] = useState(blueprint.nodes);
  const [edges, setEdges] = useState(blueprint.edges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimer = useRef(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveBlueprint({ ...blueprint, name, nodes, edges, updatedAt: Date.now() });
      setSaveStatus("saved");
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, nodes, edges]);

  // Simple grid cascade so newly-added nodes never stack directly on top
  // of each other — the user drags them to a real layout afterward.
  const nextPosition = () => {
    const i = nodes.length;
    return { x: 80 + (i % 5) * 260, y: 60 + Math.floor(i / 5) * 170 };
  };

  const addNode = (kind, questionType) => {
    const position = nextPosition();
    let node;
    if (kind === "question") {
      const type = questionTypeById(questionType);
      node = createQuestionNode(questionType, position, type.defaultTypeData());
      if (type.defaultTag) Object.assign(node.data, type.defaultTag);
    } else if (kind === "condition") node = createConditionNode(position);
    else if (kind === "action") node = createActionNode(position);
    else node = createComponentNode(position);
    setNodes((nds) => [...nds, node]);
    setSelectedNodeId(node.id);
  };

  const patchNode = (id, patch) => setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  const deleteNode = (id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId((cur) => (cur === id ? null : cur));
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", fontFamily: font, position: "relative", overflow: "hidden" }}>
      <NavRail active="survey-builder" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div style={{ padding: "12px 24px", borderBottom: `1px solid ${T.gray75}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.white, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button onClick={onExit} style={{ border: "none", background: "transparent", color: T.gray500, cursor: "pointer", display: "flex", flexShrink: 0 }}><ArrowLeft size={13} /></button>
            <div style={{ minWidth: 0 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, fontWeight: 700, color: T.gray700, fontFamily: font, padding: 0, width: 220 }}
              />
              <div style={{ fontSize: 10.5, color: T.gray300 }}>{saveStatus === "saving" ? "Saving…" : "Saved locally · Draft"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <VersionSwitcher value={version} onChange={onVersionChange} />
            <Button theme="accent" variation="primary" size="xs" iconLeft={<Play size={14} />} onClick={() => setPreviewOpen(true)} disabled={nodes.length === 0}>Preview</Button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          <NodePalette onAddNode={addNode} />
          <SurveyCanvas nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
          <Inspector node={selectedNode} nodes={nodes} onPatch={patchNode} onDeleteNode={deleteNode} onClose={() => setSelectedNodeId(null)} />
        </div>
      </div>

      {previewOpen && <PreviewModal nodes={nodes} edges={edges} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
