import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Report, PAGES } from "../cbi-wxi/pages.jsx";
import { PAGE_W, PAGE_H } from "../cbi-wxi/pbi.jsx";
import { GLOBAL_NOTES, PAGE_NOTES, THEME_SWATCHES } from "../cbi-wxi/notes.js";
import p1 from "../cbi-wxi/original/page-1.jpg";
import p2 from "../cbi-wxi/original/page-2.jpg";
import p3 from "../cbi-wxi/original/page-3.jpg";
import p4 from "../cbi-wxi/original/page-4.jpg";
import p5 from "../cbi-wxi/original/page-5.jpg";
import p6 from "../cbi-wxi/original/page-6.jpg";

/* ================================================================== */
/* Shareable build of the CBI WXI dashboard redesign: the same Report  */
/* as Developer › Dashboards, in a self-contained page (built by        */
/* scripts/share/build-cbi-wxi.mjs, React from cdnjs). Its own chrome,   */
/* light and dark; the Power BI canvas itself stays in the report's     */
/* light theme because that is what the client will ship.               */
/* ================================================================== */
const ORIGINALS = { 1: p1, 2: p2, 3: p3, 4: p4, 5: p5, 6: p6 };
const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
const fromHash = () => { const h = (typeof location !== "undefined" && location.hash.slice(1)) || ""; return PAGES.some((p) => p.id === h) ? h : null; };

function useFit(ref) {
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => setScale(Math.min(el.clientWidth / PAGE_W, 1.25));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

function App() {
  const [page, setPage] = useState(() => fromHash() || read("wxi-share-page", "overview"));
  const [view, setView] = useState(() => read("wxi-share-view", "redesign"));
  const [healthAge, setHealthAge] = useState(false);
  const go = (p) => { setPage(p); write("wxi-share-page", p); };
  const pick = (v) => { setView(v); write("wxi-share-view", v); };
  useEffect(() => {
    const on = () => { const h = fromHash(); if (h) setPage(h); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const stage = useRef(null);
  const scale = useFit(stage);
  const cur = PAGES.find((p) => p.id === page) || PAGES[0];
  const notes = PAGE_NOTES[cur.id];

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <p className="eyebrow">Power BI redesign · mockup for discussion</p>
          <h1>WXI Site Dashboard</h1>
          <p className="lede">Sodexo × Central Bank of Ireland · survey of September 2026 · six pages on a 1280 × 720 canvas. Compare the original with the redesign page by page; the notes say what changed and how to build it.</p>
        </div>
        <div className="controls">
          {view === "redesign" && cur.id === "overview" && (
            <label className="check" htmlFor="health-age">
              <input id="health-age" type="checkbox" checked={healthAge} onChange={(e) => setHealthAge(e.target.checked)} />
              Health Age requested
            </label>
          )}
          <div className="seg" role="tablist" aria-label="Version">
            {[["original", "Original"], ["redesign", "Redesign"]].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={view === id} className={view === id ? "on" : ""} onClick={() => pick(id)}>{label}</button>
            ))}
          </div>
        </div>
      </header>

      <nav className="tabs" aria-label="Pages">
        {PAGES.map((p, i) => (
          <button key={p.id} type="button" className={p.id === cur.id ? "tab on" : "tab"} aria-current={p.id === cur.id ? "page" : undefined} onClick={() => go(p.id)}>
            <span className="num">{i + 1}</span>{p.name}{p.drill && <span className="muted"> · drill-through</span>}
          </button>
        ))}
      </nav>

      <main className="body">
        <section className="stagewrap" aria-label={view === "original" ? `Original page ${cur.original}` : `Redesigned ${cur.name} page`}>
          <div className="stagemeta">
            <span>{view === "original" ? `Original · page ${cur.original} of 6` : "Redesign · interactive: tabs, toggles, rows and the wheel respond"}</span>
          </div>
          <div ref={stage} className="stage">
            <div className="canvas" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
              <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                {view === "original"
                  ? <img src={ORIGINALS[cur.original]} alt={`Original Power BI page ${cur.original}: ${cur.name}`} width={PAGE_W} height={PAGE_H} style={{ width: PAGE_W, height: PAGE_H, objectFit: "contain", display: "block", background: "#fff", maxWidth: "none" }} />
                  : <Report page={cur.id} go={go} healthAge={healthAge} />}
              </div>
            </div>
          </div>
        </section>

        <aside className="notes" aria-label="Notes">
          <h2>{cur.name}</h2>
          <NoteList title="What changed" items={notes.changed} />
          <NoteList title="Build it in Power BI" items={notes.build} />
          <hr />
          <h2>Every page</h2>
          <NoteList title="What changed" items={GLOBAL_NOTES.changed} />
          <NoteList title="Build it in Power BI" items={GLOBAL_NOTES.build} />
          <h3>Theme colours</h3>
          <ul className="swatches">
            {THEME_SWATCHES.map(([name, hex]) => <li key={name}><span className="sw" style={{ background: hex }} />{name}<code>{hex}</code></li>)}
          </ul>
        </aside>
      </main>
      <footer className="foot">Scores, actions and text are from the client's current Power BI prototype. Health Age values, when switched on, are sample numbers. Topic grouping on the wheel is confirmed for Nutrition and read from Driver names for the rest.</footer>
    </div>
  );
}

function NoteList({ title, items }) {
  return (
    <div className="notelist">
      <h3>{title}</h3>
      <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
