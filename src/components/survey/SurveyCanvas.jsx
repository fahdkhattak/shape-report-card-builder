import { useCallback } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { T } from "../../lib/tokens.js";
import SurveyNode from "./nodes/SurveyNode.jsx";

const NODE_TYPES = { survey: SurveyNode };

/* ================================================================== */
/* SURVEY CANVAS — thin ReactFlow wrapper. Node/edge STATE lives one     */
/* level up in SurveyBuilderScreen.jsx (same "screen owns its own        */
/* state" pattern CanvasScreen.jsx already uses for `widgets`) — this     */
/* component just renders it and reports changes back up, so the         */
/* palette/Inspector/autosave/Preview all read one shared source of       */
/* truth rather than reaching into a child's local state.                 */
/* ================================================================== */
export default function SurveyCanvas({ nodes, edges, setNodes, setEdges, selectedNodeId, onSelectNode }) {
  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

  // `selected` is derived here (not stored on the node itself) so
  // SurveyBuilderScreen's `selectedNodeId` — the same value the Inspector
  // reads — stays the one source of truth for which node is selected.
  const nodesWithSelection = nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId }));

  return (
    <div style={{ flex: 1, minWidth: 0, background: T.gray50 }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodesWithSelection}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => onSelectNode(node.id)}
          onPaneClick={() => onSelectNode(null)}
          selectNodesOnDrag={false}
          defaultEdgeOptions={{ style: { stroke: T.gray300, strokeWidth: 1.5 } }}
          fitView
        >
          <Background color={T.gray100} gap={20} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeColor={() => T.gray200} maskColor="rgba(242,242,242,0.6)" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
