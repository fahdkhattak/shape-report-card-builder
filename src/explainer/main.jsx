import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useEffect, useState } from "react";
import Explainer, { DURATION } from "./Explainer.jsx";

/* ================================================================== */
/* EXPLAINER RENDER PAGE: dev-only (served at /explainer.html, not part   */
/* of the app bundle). The video is a pure function of time: window.__seek */
/* (t) draws the frame at t seconds, so scripts/video/render.mjs can step  */
/* through it frame by frame and encode an MP4. Add ?play to watch it live. */
/* ================================================================== */
let setTime = () => {};
function Host() {
  const [t, set] = useState(0);
  setTime = set;
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("play")) return undefined;
    let raf; const t0 = performance.now();
    const loop = (now) => { set(((now - t0) / 1000) % DURATION); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <Explainer t={t} />;
}
const root = createRoot(document.getElementById("root"));
root.render(<Host />);
window.__duration = DURATION;
window.__seek = (t) => { flushSync(() => setTime(t)); };
// Ready once the fonts are in and the real Story cards have measured themselves.
document.fonts.ready.then(() => setTimeout(() => { window.__ready = true; }, 1500));
