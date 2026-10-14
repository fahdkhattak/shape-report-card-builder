import { createContext, useContext } from "react";

/* App-level navigation actions NavRail needs but doesn't own — currently
   opening a built report from the sidebar, the Create menu's Widget Builder, and the Library screen. A context rather than one
   more prop threaded through ChatLanding / CanvasScreen / all three Survey
   Builder screens, each of which already renders its own <NavRail>. */
export const NavActionsContext = createContext({ openReport: () => {}, openWidgetBuilder: () => {}, openLibrary: () => {}, openDeveloper: () => {} });
export const useNavActions = () => useContext(NavActionsContext);
