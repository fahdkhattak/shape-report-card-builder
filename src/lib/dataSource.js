/* ================================================================== */
/* DATA SOURCE — which dataset the widgets, Stories and Scopes read.     */
/*   sample  the prototype's generated dataset (100 people, 45 Drivers,  */
/*           data/generate-dataset.js)                                   */
/*   shape   the SHAPE survey dataset (150 people, scored by             */
/*           lib/survey/scoring.js from every stored answer)             */
/* Chosen in the Widget Builder; remembered; read once when the app      */
/* loads (lib/dataset.js), so switching reloads the app and reopens the  */
/* screen it was switched from. Every widget then agrees with every      */
/* Story on the same data.                                              */
/* ================================================================== */
export const DATA_SOURCES = [
  { id: "sample", label: "Prototype sample", note: "100 people · 45 Drivers · Feb to Nov 2025" },
  { id: "shape", label: "SHAPE survey", note: "150 people · 56 Drivers · Nov 2025 to Aug 2026" },
];
const KEY = "data-source";
export function activeSource() {
  try { return localStorage.getItem(KEY) === "shape" ? "shape" : "sample"; } catch { return "sample"; }
}
export function switchSource(id, reopen) {
  try {
    localStorage.setItem(KEY, id);
    if (reopen) sessionStorage.setItem("reopen-screen", reopen);
  } catch { /* storage blocked: the switch can't persist */ }
  window.location.reload();
}
/* Read in a state initialiser (which React's StrictMode runs twice), then cleared once the app has mounted. */
export function peekReopenScreen() {
  try { return sessionStorage.getItem("reopen-screen"); } catch { return null; }
}
export function clearReopenScreen() {
  try { sessionStorage.removeItem("reopen-screen"); } catch { /* nothing to clear */ }
}
