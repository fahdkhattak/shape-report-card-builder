import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Lock, RotateCcw } from "lucide-react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsShadow, dsBorder } from "../../lib/ds.js";
import { Header } from "../widgets/primitives.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import { SHELL_PADDING, auditStructure } from "../../lib/widgetStructure.js";
import { customFor, currentEvidence, ACTIONS } from "../../lib/widgetCustom.js";
import { formById } from "../../lib/subjectForms.js";

/* ================================================================== */
/* WIDGET EDITOR: shape a built widget one section at a time, inside the */
/* section rules (lib/widgetCustom.js, lib/widgetStructure.js).           */
/*                                                                        */
/* The widget preview is the map: click its Header, Insight, Evidence or   */
/* Action Bar and that section opens here (and lights up on the widget).   */
/*   Header      the title, with a reset to the suggested one              */
/*   Insight     always on; hide the parts of it you don't need (the form  */
/*               itself changes with the form buttons)                     */
/*   Evidence    on / off, and a gallery of every evidence this widget can  */
/*               carry, each drawn live on the widget                       */
/*   Action Bar  off or one link; an action widget keeps its link           */
/* Each choice that would break a rule is shown, switched off, with why.   */
/* Room is measured, not guessed: every evidence choice, with and without  */
/* a link, is drawn full size off screen and put through auditStructure;   */
/* a combination where anything spills or a section is off its height is  */
/* never offered (useFits).                                                */
/* ================================================================== */
export const EDIT_SECTIONS = [
  { id: "header", name: "Header", part: "widget-header" },
  { id: "insight", name: "Insight", part: "section-insight" },
  { id: "evidence", name: "Evidence", part: "section-evidence" },
  { id: "action", name: "Action Bar", part: "section-action" },
];
const SPRING = { type: "spring", bounce: 0, duration: 0.3 };
const PX = { "1x1": 164, "2x2": 344, "3x3": 524 };

/* A widget drawn small, for the evidence gallery. */
function MiniWidget({ spec, w = 112 }) {
  const px = PX[spec.size] || 344, k = w / px;
  return (
    <div style={{ width: w, height: w, position: "relative", overflow: "hidden", borderRadius: 10, pointerEvents: "none", flexShrink: 0 }}>
      <div style={{ width: px, height: px, transform: `scale(${k})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0, background: ds.surface.general.card, border: `1px solid ${ds.border.secondary}`, borderRadius: 18, padding: SHELL_PADDING, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
        <Header title={spec.title} />
        <GeneratedBody spec={spec} />
      </div>
    </div>
  );
}

/* A widget at full size, as the canvas draws it, for measuring. */
export function FullCard({ spec }) {
  const px = PX[spec.size] || 344;
  return (
    <div data-widget-card data-size={spec.size} style={{ width: px, height: px, background: ds.surface.general.card, border: `1px solid ${ds.border.secondary}`, borderRadius: 18, padding: SHELL_PADDING, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
      <Header title={spec.title} />
      <GeneratedBody spec={spec} />
    </div>
  );
}

/* Draws every configuration off screen and measures it. Returns { own, fits }: whether the form draws evidence of its own
   at this size (read with every customisation cleared), and for each "evidence|link" key whether it passes the structure check. */
export const keyOf = (ev, link) => `${ev || "none"}|${link ? 1 : 0}`;
export function useFits(spec, evidenceIds, links) {
  const ref = useRef(null);
  const [res, setRes] = useState({ own: true, fits: {} });
  const custom = spec.custom || {};
  const configs = [{ key: "plain", custom: { hide: custom.hide } }];
  evidenceIds.forEach((ev) => links.forEach((link) => configs.push({ key: keyOf(ev, link), custom: { hide: custom.hide, evidence: ev !== null, evidenceKind: ev || undefined, action: link ? custom.action || custom.lastAction || "details" : null } })));
  const sig = JSON.stringify([spec.form, spec.vizType, spec.size, spec.title, spec.options, custom.hide, configs.map((c) => c.key)]);
  useLayoutEffect(() => {
    const t = setTimeout(() => {
      const root = ref.current;
      if (!root) return;
      const fits = {};
      let own = true;
      root.querySelectorAll("[data-fit]").forEach((el) => {
        const card = el.querySelector("[data-widget-card]");
        if (!card) return;
        if (el.dataset.fit === "plain") own = !!card.querySelector('[data-part="section-evidence"]');
        else fits[el.dataset.fit] = auditStructure(card, spec.size).issues.length === 0;
      });
      setRes({ own, fits });
    }, 80);
    return () => clearTimeout(t);
  }, [sig]);
  const probes = (
    <div ref={ref} aria-hidden="true" style={{ position: "fixed", left: -20000, top: 0, visibility: "hidden", pointerEvents: "none" }}>
      {configs.map((c) => <div key={c.key} data-fit={c.key}><FullCard spec={{ ...spec, custom: c.custom }} /></div>)}
    </div>
  );
  return [res, probes];
}

/* Clicking a section on the preview opens it in the editor; the open section is outlined on the preview. */
export function EditableWidget({ focus, onFocus, children }) {
  const pick = (e) => {
    const hit = e.target.closest('[data-part="widget-header"], [data-part^="section-"]');
    const s = hit && EDIT_SECTIONS.find((x) => x.part === hit.dataset.part);
    if (s) onFocus(s.id);
  };
  return <div className={`wb-edit${focus ? ` wb-focus-${focus}` : ""}`} onClick={pick} title="Click a part of the widget to edit it">{children}</div>;
}

function Toggle({ on, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      style={{ width: 36, height: 20, borderRadius: 999, border: "none", padding: 2, cursor: disabled ? "not-allowed" : "pointer", background: on ? ds.bg.inverse : ds.border.secondary, opacity: disabled ? 0.45 : 1, display: "flex", justifyContent: on ? "flex-end" : "flex-start", transition: "background 150ms ease", flexShrink: 0 }}>
      <motion.span layout transition={SPRING} style={{ width: 16, height: 16, borderRadius: "50%", background: ds.surface.general.card, boxShadow: dsShadow("sm") }} />
    </button>
  );
}

const hint = { ...dsText("Text xs"), color: ds.text.tertiary, margin: 0 };
const chip = (on, disabled) => ({ border: `${dsBorder.sm}px solid ${on ? ds.border.strong : ds.border.secondary}`, background: on ? ds.bg.inverse : ds.surface.general.card, color: on ? ds.text.inverse : ds.text.secondary, borderRadius: dsRadius.full, padding: "4px 10px", ...dsText("Text xs", 500), cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, fontFamily: font });

/* One section of the editor: a row that says what's set, and opens to its controls. */
function Panel({ id, name, summary, open, onOpen, control, children }) {
  return (
    <div data-edit-section={id} style={{ borderRadius: dsRadius.lg, background: open ? ds.surface.general.card : "transparent", boxShadow: open ? dsShadow("sm") : "none", border: `${dsBorder.sm}px solid ${open ? ds.border.tertiary : "transparent"}`, transition: "background 150ms ease, box-shadow 150ms ease" }}>
      <div role="button" tabIndex={0} aria-expanded={open} onClick={() => onOpen(open ? null : id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(open ? null : id))}
        style={{ display: "flex", alignItems: "center", gap: dsSpace[12], padding: `${dsSpace[8]}px ${dsSpace[12]}px`, cursor: "pointer", borderRadius: dsRadius.lg, minHeight: 36 }} className="wb-edit-row">
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: open ? "var(--ds-color-button-accent-primary-bg-default)" : ds.border.secondary, flexShrink: 0 }} />
        <span style={{ ...dsText("Text sm", 600), color: ds.text.primary, width: 84, flexShrink: 0 }}>{name}</span>
        <span style={{ ...dsText("Text xs"), color: ds.text.tertiary, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        {control}
        <ChevronDown size={16} style={{ color: ds.text.tertiary, transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease", flexShrink: 0 }} />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
            <div style={{ padding: `${dsSpace[4]}px ${dsSpace[12]}px ${dsSpace[16]}px ${dsSpace[32]}px`, display: "flex", flexDirection: "column", gap: dsSpace[12] }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WidgetEditor({ built, onChange, focus, setFocus }) {
  const { spec } = built;
  const custom = spec.custom || {};
  // Every evidence choice the form could take (its own counted until measured), with and without a link.
  const all = customFor(spec, { own: true });
  const links = all.actionRequired ? [false] : [false, true];
  const [{ own, fits }, probe] = useFits(spec, [null, ...all.kinds.map((k) => k.id)], links);
  const can = customFor(spec, { own });
  const ev = currentEvidence(spec, own);
  // undefined while measuring: assume it fits, so nothing flickers off.
  const fit = (evId, link) => fits[keyOf(evId, link)] !== false;
  const set = (patch) => onChange({ ...built, spec: { ...spec, custom: { ...custom, ...patch } } });
  const oneByOne = spec.size === "1x1";
  const hidden = new Set(custom.hide || []);

  const [title, setTitle] = useState(spec.title);
  useEffect(() => setTitle(spec.title), [spec.title]);
  const commitTitle = () => { const t = title.trim().slice(0, 48); if (t && t !== spec.title) onChange({ ...built, spec: { ...spec, title: t } }); else setTitle(spec.title); };
  const statesValue = /\d/.test(title);

  const evKind = can.kinds.find((k) => k.id === ev);
  const actionOn = can.actionRequired || !!custom.action;
  const evidenceOff = can.evidence === "none" || (oneByOne && actionOn);
  const linkOn = !!custom.action;
  const fitting = can.kinds.filter((k) => fit(k.id, linkOn));
  const turnEvidence = (on) => set(on ? { evidence: true, evidenceKind: fitting.some((k) => k.id === custom.evidenceKind) ? custom.evidenceKind : fitting[0]?.id } : { evidence: false });
  const pickEvidence = (id) => set({ evidence: true, evidenceKind: id });
  const turnAction = (on) => set({ action: on ? custom.lastAction || "details" : null, lastAction: custom.action || custom.lastAction });
  const linkFits = fit(ev, true), linkFitsAlone = fit(null, true);
  const bigger = oneByOne && (spec.sizes || []).includes("2x2");

  // A size or form change can leave a combination that no longer fits: drop the link first, then the evidence.
  useEffect(() => {
    if (fits[keyOf(ev, linkOn)] !== false) return;
    if (linkOn && fit(ev, false)) set({ action: null, lastAction: custom.action });
    else if (ev) set({ evidence: false });
  }, [fits]);

  const formName = spec.vizType === "form" ? formById(spec.form)?.name : spec.vizType;
  const why = {
    evidence: can.evidence === "none" ? (can.actionRequired && oneByOne ? "A 1x1 action widget's one bar is its link." : "This widget has no evidence it can show.") : oneByOne && actionOn ? "On a 1x1 the link takes the Evidence Bar's place. Switch the link off to bring evidence back." : can.evidence === "required" ? "This widget can't be read without its evidence at 1x1." : null,
    action: can.actionRequired ? "An action widget always has its link: it's what makes it this widget." : can.action === "blocked" ? "A 1x1 has room for one bar, and this widget needs its evidence." : oneByOne && custom.action ? "On a 1x1 the link takes the Evidence Bar's place." : null,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[4], fontFamily: font, position: "relative" }}>
      {probe}
      <Panel id="header" name="Header" open={focus === "header"} onOpen={setFocus} summary={spec.title}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={commitTitle} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} maxLength={48} aria-label="Widget title" className="field-soft"
          style={{ fontFamily: font, ...dsText("Text sm", 600), padding: "8px 12px", borderRadius: dsRadius.md, color: ds.text.primary }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[12] }}>
          <p style={{ ...hint, color: statesValue ? ds.status.warning.textStrong : ds.text.tertiary }}>{statesValue ? "Headers name the thing, never the result. Leave numbers to the Insight." : "Name what this is, in two lines at most. Never the result."}</p>
          {spec.autoTitle && spec.title !== spec.autoTitle && (
            <button type="button" onClick={() => onChange({ ...built, spec: { ...spec, title: spec.autoTitle } })} style={{ ...chip(false), display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}><RotateCcw size={12} />Suggested</button>
          )}
        </div>
      </Panel>

      <Panel id="insight" name="Insight" open={focus === "insight"} onOpen={setFocus}
        summary={`${formName}${hidden.size ? ` · ${hidden.size} hidden` : ""}`} control={<span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...dsText("Text 3xs"), color: ds.text.tertiary }}><Lock size={11} />Always on</span>}>
        <p style={hint}>The Insight is the answer, so it's always there. Change how it's shown with the form buttons; hide the parts you don't need here.</p>
        {can.elements.length ? can.elements.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[12], minHeight: 28 }}>
            <span style={{ ...dsText("Text sm"), color: ds.text.primary }}>{e.label}</span>
            <Toggle label={e.label} on={!hidden.has(e.id)} onChange={(on) => set({ hide: on ? [...hidden].filter((x) => x !== e.id) : [...hidden, e.id] })} />
          </div>
        )) : <p style={hint}>Nothing in this form can be hidden.</p>}
      </Panel>

      <Panel id="evidence" name="Evidence" open={focus === "evidence"} onOpen={setFocus}
        summary={evidenceOff ? "None" : ev ? evKind?.label : "Off"}
        control={<Toggle label="Show evidence" disabled={evidenceOff || can.evidence === "required" || (!ev && !fitting.length)} on={!evidenceOff && !!ev} onChange={turnEvidence} />}>
        {why.evidence && <p style={hint}>{why.evidence}</p>}
        {!why.evidence && !ev && !fitting.length && can.kinds.length > 0 && <p style={hint}>No room: at this size the Insight needs the whole card{linkOn ? " beside the link" : ""}.{bigger ? " Try the 2×2." : ""}{linkOn ? " Or switch the link off." : ""}</p>}
        {!evidenceOff && can.kinds.length > 0 && (fitting.length > 0 || ev) && (
          <>
            <p style={hint}>Evidence answers “based on what?”. Pick one: each is drawn on your widget.</p>
            <div role="radiogroup" aria-label="Evidence" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: dsSpace[8] }}>
              {can.evidence !== "required" && (
                <EvidenceChoice label="None" blurb="The Insight takes the card." on={!ev} onPick={() => set({ evidence: false })} spec={{ ...spec, custom: { ...custom, evidence: false } }} />
              )}
              {can.kinds.map((k) => (
                <EvidenceChoice key={k.id} label={k.label} blurb={k.blurb} tag={k.generic ? null : "Its own"} on={ev === k.id} noRoom={!fit(k.id, linkOn)} onPick={() => pickEvidence(k.id)} spec={{ ...spec, custom: { ...custom, evidence: true, evidenceKind: k.id } }} />
              ))}
            </div>
          </>
        )}
      </Panel>

      <Panel id="action" name="Action Bar" open={focus === "action"} onOpen={setFocus}
        summary={can.actionRequired ? "See actions you can take" : custom.action ? ACTIONS.find((a) => a.id === custom.action)?.label : "Off"}
        control={can.actionRequired ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...dsText("Text 3xs"), color: ds.text.tertiary }}><Lock size={11} />Always on</span> : <Toggle label="Add a link" disabled={can.action === "blocked" || (!linkOn && !linkFits)} on={linkOn} onChange={turnAction} />}>
        {why.action && <p style={hint}>{why.action}</p>}
        {!why.action && !linkOn && !linkFits && <p style={hint}>{linkFitsAlone && ev ? "No room for a link beside this evidence. Pick a smaller evidence, or none." : `No room for a link: at this size the Insight needs the whole card.${bigger ? " Try the 2×2." : ""}`}</p>}
        {!can.actionRequired && can.action !== "blocked" && (linkOn || linkFits) && (
          <>
            <p style={hint}>Optional: one link at the foot of the widget, the lowest priority thing on it.</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ACTIONS.map((a) => <button key={a.id} type="button" onClick={() => set({ action: a.id })} style={chip(custom.action === a.id)}>{a.label}</button>)}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

function EvidenceChoice({ label, blurb, tag, on, onPick, spec, noRoom }) {
  return (
    <button type="button" role="radio" aria-checked={on} disabled={noRoom && !on} onClick={onPick} title={noRoom ? "No room for this beside the Insight at this size" : blurb} className="wb-thumb"
      style={{ border: `2px solid ${on ? ds.border.strong : "transparent"}`, borderRadius: 14, padding: 6, background: on ? ds.bg.primary : "transparent", cursor: on ? "default" : noRoom ? "not-allowed" : "pointer", opacity: noRoom && !on ? 0.4 : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: font, minWidth: 0 }}>
      <MiniWidget spec={spec} w={104} />
      <span style={{ ...dsText("Text 2xs", on ? 600 : 500), color: on ? ds.text.primary : ds.text.secondary, textAlign: "center", lineHeight: "14px" }}>{label}</span>
      {(noRoom || tag) && <span style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>{noRoom ? "No room" : tag}</span>}
    </button>
  );
}
