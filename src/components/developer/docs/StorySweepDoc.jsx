import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ds, dsText, dsSpace, dsRadius } from "../../../lib/ds.js";
import { STORIES, formsOf } from "../../widgetbuilder/storyCatalog.jsx";
import { ScopeNavContext } from "../../scope/scopeNav.js";
import { SAMPLE_SUBJECTS } from "../sampleSubjects.js";
import { Section, Prose } from "../docKit.jsx";
import { SimpleTable } from "../docParts.jsx";

export const meta = {
  id: "story-sweep", name: "Story sweep", group: "Foundations", kind: "Story sweep",
  blurb: "Draws every Story, in every form, for every kind of subject, at phone, tablet, and desktop widths, and reports what breaks.",
  source: "components/developer/docs/StorySweepDoc.jsx",
};
export const toc = [{ id: "overview", label: "Overview" }, { id: "run", label: "Run it" }];

const WIDTHS = [320, 560, 808];

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { this.props.onError(err); }
  render() { return this.state.err ? null : this.props.children; }
}
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))));

/* Render one Story into an off-screen box of a given width and report: did it throw, is it empty, does anything poke out of
   the right edge (tables, charts, and scrolling areas excepted, since they are meant to scroll or scale; elements with no box of their own, such as display: contents wrappers and closed menu options, are ignored). */
async function renderOne(node, width) {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;visibility:hidden`;
  document.body.appendChild(host);
  const root = createRoot(host);
  let error = null;
  root.render(<ScopeNavContext.Provider value={{ depth: 0, open: () => {} }}><Boundary onError={(e) => { error = e; }}>{node}</Boundary></ScopeNavContext.Provider>);
  await frame();
  const box = host.getBoundingClientRect();
  const out = [...host.querySelectorAll("*")].filter((e) => e.getClientRects().length > 0 && !e.closest('[data-part="table"]') && !e.closest("svg") && !e.closest("[style*='overflow-x: auto']") && e.getBoundingClientRect().right > box.right + 1);
  const spill = out.length;
  const first = out[0] ? `${out[0].tagName.toLowerCase()}${out[0].dataset.part ? `[${out[0].dataset.part}]` : ""} "${(out[0].textContent || "").trim().slice(0, 22)}" +${Math.round(out[0].getBoundingClientRect().right - box.right)}px` : null;
  const empty = !error && host.textContent.trim().length === 0;
  root.unmount();
  host.remove();
  return { error: error ? String(error.message || error).slice(0, 120) : null, spill, empty, first };
}

export default function StorySweepDoc() {
  const [state, setState] = useState({ running: false, done: 0, total: 0, fails: [], summary: null });
  const stop = useRef(false);
  const run = async () => {
    stop.current = false;
    const jobs = [];
    STORIES.forEach((def) => SAMPLE_SUBJECTS.forEach(({ label, subject }) => {
      let why = null;
      try { why = def.blocked(subject); } catch { why = "error in blocked()"; }
      if (why) return;
      const forms = formsOf(def, subject);
      (forms.length > 1 ? forms.map((f) => f.id) : [null]).forEach((form) => WIDTHS.forEach((w) => jobs.push({ def, label, subject, form, w })));
    }));
    setState({ running: true, done: 0, total: jobs.length, fails: [], summary: null });
    const fails = []; let errors = 0, spills = 0, empties = 0;
    for (let i = 0; i < jobs.length && !stop.current; i++) {
      const { def, label, subject, form, w } = jobs[i];
      let r;
      try { r = await renderOne(def.render(subject, { stories: [def.id], options: form ? { form } : undefined }), w); } catch (e) { r = { error: String(e.message || e).slice(0, 120), spill: 0, empty: false }; }
      const issue = r.error ? `Error: ${r.error}` : r.spill ? `${r.spill} past the right edge, first: ${r.first}` : r.empty ? "Drew nothing" : null;
      if (r.error) errors++; else if (r.spill) spills++; else if (r.empty) empties++;
      if (issue) fails.push({ story: def.name + (form ? ` (${form})` : ""), subject: label, width: w, issue });
      if (i % 5 === 0) setState((s) => ({ ...s, done: i + 1, fails: [...fails] }));
    }
    setState({ running: false, done: jobs.length, total: jobs.length, fails, summary: { renders: jobs.length, errors, spills, empties } });
  };
  const { running, done, total, fails, summary } = state;
  const btn = { border: "none", cursor: running ? "default" : "pointer", borderRadius: dsRadius.full, padding: `${dsSpace[8]}px ${dsSpace[16]}px`, background: ds.interactive.primary, color: ds.interactive.primaryText, ...dsText("Text sm", 600), fontFamily: "inherit", opacity: running ? 0.6 : 1 };
  return (
    <>
      <Section id="overview" title="Overview" lead="A quick way to find out whether a change broke a Story somewhere you weren't looking.">
        <Prose>
          <p>The sweep draws every Story in the catalogue for each kind of subject that can support it (see Story availability), in every form it offers, at {WIDTHS.join(", ")}px. It reports a Story that throws, draws nothing, or has something poking out past its right edge. Tables, charts, and areas meant to scroll are left out of the edge check.</p>
          <p>It runs in your browser, off screen, and takes under a minute. It doesn't check that a Story looks right, only that it works.</p>
        </Prose>
      </Section>
      <Section id="run" title="Run it">
        <div style={{ display: "flex", alignItems: "center", gap: dsSpace[16], flexWrap: "wrap" }}>
          <button onClick={run} disabled={running} style={btn}>{running ? "Running…" : summary ? "Run again" : "Run the sweep"}</button>
          {running && <span style={{ ...dsText("Text sm"), color: ds.text.secondary }}>{done} of {total}</span>}
          {summary && <span data-part="sweep-summary" style={{ ...dsText("Text sm", 600), color: summary.errors + summary.spills + summary.empties ? ds.status.error.textIndicator : ds.status.success.textIndicator }}>{summary.renders} renders: {summary.errors} errors, {summary.spills} overflows, {summary.empties} empty</span>}
        </div>
        {fails.length > 0 && <SimpleTable head={["Story", "Subject", "Width", "Problem"]} widths={["28%", "22%", "10%", "40%"]} rows={fails.slice(0, 60).map((f) => [f.story, f.subject, `${f.width}px`, f.issue])} />}
        {summary && fails.length === 0 && <Prose><p>Every Story drew cleanly for every subject, form, and width.</p></Prose>}
      </Section>
    </>
  );
}
