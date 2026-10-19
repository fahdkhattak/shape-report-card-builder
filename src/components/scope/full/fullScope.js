import { createContext, useContext } from "react";

/* ================================================================== */
/* FULL-VIEW SCOPES — Scopes that only exist expanded (Figma 15299:41715 */
/* Heat Map, 15299:45659 Response Analysis). They are one large          */
/* component, not a stack of Stories, so the Scope pane gives them the   */
/* whole body (no 808px column, no padding) and a slot in its header for */
/* their own tools (search, Filter).                                     */
/*   toolsEl   the header slot (render into it with createPortal)         */
/*   openGroup open a group's own Scope as a layer (Heat Map rows)        */
/* Widgets whose Scope is full-view are listed in FULL_SCOPE_FAMILIES;     */
/* CanvasScreen opens them expanded and ScopePanel keeps them expanded    */
/* while they're showing (a group layer opened from one can collapse).    */
/* ================================================================== */
export const FullScopeContext = createContext({ toolsEl: null, openGroup: () => {} });
export const useFullScope = () => useContext(FullScopeContext);

export const FULL_SCOPE_FAMILIES = { "heat-map": "Heat Map", "popular-responses": "Response Analysis" };
export const isFullScope = (widget) => !!widget && widget.kind === "library" && !!FULL_SCOPE_FAMILIES[widget.familyId];
