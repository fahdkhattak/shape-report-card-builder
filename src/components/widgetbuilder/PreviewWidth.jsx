import { createContext, useContext, useState } from "react";
import { T } from "../../lib/tokens.js";
import SegmentedControl from "../ui/SegmentedControl.jsx";

/* ================================================================== */
/* PREVIEW WIDTH: the Widget Builder shows a Scope at the width of the   */
/* screen, but every Story also has to work on a phone. This lets you     */
/* narrow the Scope to a 360px phone column and see the compact layouts   */
/* (Stories measure their own card, so nothing else changes). Remembered   */
/* between visits.                                                         */
/* ================================================================== */
const KEY = "widget-builder-preview-width";
export const PHONE_W = 360;
const Ctx = createContext({ width: "desktop", setWidth: () => {} });
export const usePreviewWidth = () => useContext(Ctx);

export function PreviewWidthProvider({ children }) {
  const [width, setW] = useState(() => { try { return localStorage.getItem(KEY) === "phone" ? "phone" : "desktop"; } catch { return "desktop"; } });
  const setWidth = (v) => { setW(v); try { localStorage.setItem(KEY, v); } catch { /* storage unavailable */ } };
  return <Ctx.Provider value={{ width, setWidth }}>{children}</Ctx.Provider>;
}

export function PreviewWidthToggle() {
  const { width, setWidth } = usePreviewWidth();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.gray300, textTransform: "uppercase", letterSpacing: 0.4 }}>Preview</span>
      <SegmentedControl options={[{ id: "desktop", label: "Desktop" }, { id: "phone", label: "Phone" }]} value={width} onChange={setWidth} />
    </div>
  );
}

/* Wrap the Stories: at full width on desktop, a centred 360px column on phone. */
export function PreviewFrame({ children }) {
  const { width } = usePreviewWidth();
  if (width !== "phone") return children;
  return (
    <div data-part="phone-preview" style={{ width: "100%", maxWidth: PHONE_W, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <span style={{ textAlign: "center", fontSize: 11, color: T.gray400 }}>Phone preview · {PHONE_W}px</span>
      {children}
    </div>
  );
}
