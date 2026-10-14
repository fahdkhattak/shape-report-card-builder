import { createContext, useContext } from "react";

/* The Scope navigation context: a Story calls `useScopeNav()?.open(layer)` to
   go one layer deeper (see layers.jsx). Kept in its own file so the Stories
   and the layer host can import it without importing each other. */
export const ScopeNavContext = createContext(null);
export const useScopeNav = () => useContext(ScopeNavContext);
