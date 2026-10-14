import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Play, Plus, ChevronRight, ChevronDown, ArrowUp, ArrowDown, ArrowRight, Trash2, Copy, Sparkles } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import NavRail from "../shell/NavRail.jsx";
import Button from "../ui/Button.jsx";
import Press from "../ui/Press.jsx";
import VersionSwitcher from "./VersionSwitcher.jsx";
import PreviewModalV2 from "./PreviewModalV2.jsx";
import { DIMENSION_COLORS } from "./SurveyOutline.jsx";
import { QuestionEditorBody } from "./QuestionFields.jsx";
import QuestionScreen from "./respond/QuestionScreen.jsx";
import QuestionBody from "./respond/QuestionBody.jsx";
import ToggleBoardRespond from "./respond/ToggleBoardRespond.jsx";
import CustomRespond from "./respond/CustomRespond.jsx";
import { QUESTION_TYPE_CATALOG, questionTypeById } from "../../lib/questionTypes.js";
import { createBlueprintV2, createDimension, createExplorer, createQuestionV2, loadBlueprintV2, saveBlueprintV2, flattenQuestionsV2 } from "../../lib/surveyBlueprintV2.js";
import { nextId } from "../../lib/id.js";
import mascotAvatar from "../../assets/mascot-avatar.svg";

/* ================================================================== */
/* SURVEY BUILDER — VERSION 4, "Studio". A redesign of the Sections      */
/* builder (v2) done with the redesign-existing-projects audit. It edits   */
/* the SAME survey as v2 (same data model, same saved draft), so you can    */
/* flip between them mid-way; only the way you work on it changes.          */
/*                                                                          */
/* What the audit found in v2, and what Studio does about it:               */
/*  - One narrow, centred column holding three levels of collapsible        */
/*    boxes: every edit happened inline, so the list jumped around under     */
/*    your hands and you never saw the whole survey.  -> a structure rail on   */
/*    the left (the whole survey, always visible, numbered) and ONE thing in    */
/*    focus on the right. Select, then edit; nothing shifts under you.         */
/*  - You edited a question blind: a form, with no sight of what a             */
/*    respondent gets.  -> a question opens as the live respondent screen      */
/*    beside its settings (the real renderer, read-only).                      */
/*  - "Add question" was a dropdown of nine names.  -> a gallery: icon, name    */
/*    and what you get by default, so the types are understandable at a glance. */
/*  - Cards-in-cards, ALL-CAPS labels, borders everywhere.  -> the sheet on the */
/*    right is the only card; the rail is flat on the page; sentence case.      */
/*  - Destructive actions had no way back.  -> deleting shows an Undo.          */
/*  - Nothing between empty and full, no keyboard flow.  -> a composed first      */
/*    screen, and a Previous / Next footer so you can walk the survey question    */
/*    by question; focus rings and press feedback throughout (`.sv4`, index.css).  */
/* Kept as-is: IBM Plex Sans, the warm greys, one accent — the product's design    */
/* system, not a default to swap — and the colour-per-dimension from v2.            */
/* ================================================================== */
const AUTOSAVE_DELAY_MS = 400;
export const SPRING = { type: "spring", bounce: 0, duration: 0.3 };
export const SHADOW = "0 1px 2px rgba(35,31,32,0.06), 0 14px 32px -14px rgba(35,31,32,0.2)";
export const SHADOW_SOFT = "0 1px 2px rgba(35,31,32,0.05), 0 6px 16px -8px rgba(35,31,32,0.14)";
export const RAIL_W = 300;
const UNDO_MS = 6000;

export const moveItem = (arr, from, to) => {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};
export const mapDim = (b, dimId, fn) => ({ ...b, dimensions: b.dimensions.map((d) => (d.id === dimId ? fn(d) : d)) });
export const mapExp = (b, dimId, expId, fn) => mapDim(b, dimId, (d) => ({ ...d, explorers: d.explorers.map((e) => (e.id === expId ? fn(e) : e)) }));

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* The read-only respondent screen for a question — the same renderers the Preview uses. */
export function LiveQuestion({ q, number, total }) {
  const noop = () => {};
  return (
    <QuestionScreen prompt={q.prompt} helpText={q.helpText} progress={total ? number / total : 0} onOk={noop} okDisabled>
      <div style={{ pointerEvents: "none" }}>
        {q.questionType === "toggle-board" ? <ToggleBoardRespond typeData={q.typeData} value={undefined} onChange={noop} />
          : q.questionType === "custom" ? <CustomRespond typeData={q.typeData} value={undefined} onChange={noop} />
          : <QuestionBody questionType={q.questionType} typeData={q.typeData} value={undefined} onChange={noop} />}
      </div>
    </QuestionScreen>
  );
}

/* A heading you can type into: no box until you hover or focus it. */
export function TitleInput({ value, onChange, placeholder, size = 30, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus) ref.current?.select(); }, [autoFocus]);
  return (
    <input
      ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="sv4-title"
      style={{ width: "100%", boxSizing: "border-box", border: "none", background: "transparent", fontFamily: font, fontSize: size, lineHeight: `${size + 6}px`, fontWeight: 600, letterSpacing: `${-size * 0.02}px`, color: T.gray900, padding: "2px 8px", margin: "0 -8px", borderRadius: radius.md }}
    />
  );
}

export function IconAction({ label, icon, onClick, disabled, danger }) {
  return (
    <Press aria-label={label} title={label} onClick={onClick} disabled={disabled} className="sv4-act" style={{ width: 32, height: 32, border: "none", background: "transparent", borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center", color: danger ? T.redStrong : T.gray600, opacity: disabled ? 0.3 : 1, cursor: disabled ? "default" : "pointer" }}>
      {icon}
    </Press>
  );
}

export function Crumbs({ items }) {
  return (
    <nav aria-label="Where you are" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.gray500, minHeight: 20 }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {i > 0 && <ChevronRight size={12} color={T.gray300} />}
          {it.onClick
            ? <button onClick={it.onClick} className="sv4-link" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: font, fontSize: 13, color: T.gray600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{it.label}</button>
            : <span style={{ color: T.gray900, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/* ---- gallery of question types ---------------------------------------------- */
export function TypeGallery({ onPick }) {
  return (
    <div role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
      {QUESTION_TYPE_CATALOG.map((t) => {
        const Icon = t.icon;
        return (
          <Press key={t.id} role="listitem" onClick={() => onPick(t.id)} className="sv4-tile" style={{ textAlign: "left", border: "none", background: T.gray25, borderRadius: radius.lg, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: radius.md, background: T.white, boxShadow: SHADOW_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={18} strokeWidth={1.75} color={T.gray800} /></span>
            <span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.gray900 }}>{t.label}</span>
              <span style={{ display: "block", fontSize: 12.5, color: T.gray500, marginTop: 2 }}>{t.summary(t.defaultTypeData())}</span>
            </span>
          </Press>
        );
      })}
    </div>
  );
}

/* ---- the structure rail ------------------------------------------------------- */
export function Rail({ blueprint, sel, select, collapsed, toggle, numbers, onAddDimension, aiIds }) {
  const spark = (id) => (aiIds?.has(id) ? <Sparkles size={11} color={T.accent} aria-label="Drafted by AI" style={{ flexShrink: 0 }} /> : null);
  const stats = { dims: blueprint.dimensions.length, exps: blueprint.dimensions.reduce((n, d) => n + d.explorers.length, 0), qs: numbers.size };
  const row = (active, color) => ({
    display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: "none", cursor: "pointer", fontFamily: font,
    background: active ? T.white : "transparent", boxShadow: active ? SHADOW_SOFT : "none", borderRadius: radius.md,
    boxSizing: "border-box", position: "relative", transition: "background 120ms ease, box-shadow 120ms ease",
    ...(active && color ? { } : {}),
  });
  return (
    <nav aria-label="Survey structure" style={{ flex: `0 0 ${RAIL_W}px`, minWidth: 0, overflowY: "auto", padding: "28px 12px 40px 20px", boxSizing: "border-box" }}>
      <div style={{ padding: "0 8px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500 }}>Structure</div>
        <div style={{ fontSize: 12, color: T.gray400, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{plural(stats.dims, "dimension")} · {plural(stats.exps, "explorer")} · {plural(stats.qs, "question")}</div>
      </div>
      {blueprint.dimensions.map((d, i) => {
        const color = DIMENSION_COLORS[i % DIMENSION_COLORS.length];
        const dimActive = sel.kind === "dim" && sel.dimId === d.id;
        const closed = collapsed[d.id];
        return (
          <div key={d.id} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button aria-label={closed ? `Expand ${d.name}` : `Collapse ${d.name}`} onClick={() => toggle(d.id)} className="sv4-link" style={{ border: "none", background: "transparent", cursor: "pointer", width: 22, height: 28, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: T.gray400 }}>
                {closed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
              <button onClick={() => select({ kind: "dim", dimId: d.id })} className="sv4-row" aria-current={dimActive ? "true" : undefined} style={{ ...row(dimActive), padding: "7px 8px", flex: 1, minWidth: 0 }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name || "Untitled dimension"}</span>
                {spark(d.id)}
              </button>
            </div>
            {!closed && d.explorers.map((e) => {
              const expActive = sel.kind === "exp" && sel.expId === e.id;
              const expClosed = collapsed[e.id];
              return (
                <div key={e.id} style={{ marginLeft: 22 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button aria-label={expClosed ? `Expand ${e.name}` : `Collapse ${e.name}`} onClick={() => toggle(e.id)} className="sv4-link" style={{ border: "none", background: "transparent", cursor: "pointer", width: 20, height: 26, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: T.gray300 }}>
                      {e.questions.length ? (expClosed ? <ChevronRight size={12} /> : <ChevronDown size={12} />) : null}
                    </button>
                    <button onClick={() => select({ kind: "exp", dimId: d.id, expId: e.id })} className="sv4-row" aria-current={expActive ? "true" : undefined} style={{ ...row(expActive), padding: "6px 8px", flex: 1, minWidth: 0 }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: T.gray800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name || "Untitled explorer"}</span>
                      {spark(e.id)}
                      <span style={{ fontSize: 11, color: T.gray400, fontVariantNumeric: "tabular-nums" }}>{e.questions.length}</span>
                    </button>
                  </div>
                  {!expClosed && e.questions.map((q) => {
                    const qActive = sel.kind === "q" && sel.qId === q.id;
                    const Icon = questionTypeById(q.questionType)?.icon;
                    return (
                      <button key={q.id} onClick={() => select({ kind: "q", dimId: d.id, expId: e.id, qId: q.id })} className="sv4-row" aria-current={qActive ? "true" : undefined} style={{ ...row(qActive), marginLeft: 20, width: "calc(100% - 20px)", padding: "5px 8px" }}>
                        <span style={{ width: 18, fontSize: 11, color: T.gray400, fontVariantNumeric: "tabular-nums" }}>{numbers.get(q.id)}</span>
                        {Icon && <Icon size={13} color={T.gray400} style={{ flexShrink: 0 }} />}
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: q.prompt ? T.gray700 : T.gray400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.prompt || "Untitled question"}</span>
                        {spark(q.id)}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
      <Press onClick={onAddDimension} className="sv4-link" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: T.gray700, fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: radius.md }}>
        <Plus size={16} />Add a dimension
      </Press>
    </nav>
  );
}

/* ---- the panels ----------------------------------------------------------------- */
function StartPanel({ onAdd }) {
  return (
    <div style={{ padding: "64px 56px", maxWidth: 560 }}>
      <img src={mascotAvatar} width={40} height={40} alt="" />
      <h2 style={{ margin: "24px 0 12px", fontSize: 36, lineHeight: "40px", fontWeight: 600, letterSpacing: "-0.9px", color: T.gray900, textWrap: "balance" }}>Build the survey from the top down.</h2>
      <p style={{ margin: "0 0 28px", fontSize: 16, lineHeight: "24px", color: T.gray600, textWrap: "pretty" }}>
        A dimension is a broad area, such as Physical Health. It holds a few explorers, and each explorer holds the questions people actually answer.
      </p>
      <Button theme="accent" variation="primary" size="md" iconLeft={<Plus size={18} />} onClick={onAdd}>Add a dimension</Button>
    </div>
  );
}

export function ListRow({ onClick, lead, title, meta, accent }) {
  return (
    <Press onClick={onClick} className="sv4-listrow" style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, textAlign: "left", border: "none", background: "transparent", padding: "14px 4px", borderBottom: `1px solid ${T.gray50}`, borderRadius: 0 }}>
      <span style={{ width: 24, textAlign: "right", fontSize: 12, color: T.gray400, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{lead}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: title.muted ? T.gray400 : T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title.text}</span>
        {meta && <span style={{ display: "block", fontSize: 12.5, color: T.gray500, marginTop: 2 }}>{meta}</span>}
      </span>
      {accent}
      <ArrowRight size={15} color={T.gray300} />
    </Press>
  );
}

export function PanelShell({ crumbs, actions, banner, children }) {
  return (
    <div style={{ padding: "28px 48px 56px", maxWidth: 1040 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <Crumbs items={crumbs} />
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>{actions}</div>
      </div>
      {banner}
      {children}
    </div>
  );
}

export function SectionLabel({ children, trailing }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "36px 0 4px" }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.gray500 }}>{children}</h3>
      {trailing}
    </div>
  );
}

export function AddLink({ children, onClick }) {
  return (
    <Press onClick={onClick} className="sv4-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: T.gray700, fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: radius.md, marginLeft: -8 }}>
      <Plus size={16} />{children}
    </Press>
  );
}

export function DimensionPanel({ dim, index, count, color, numbers, api, banner }) {
  const qCount = dim.explorers.reduce((n, e) => n + e.questions.length, 0);
  return (
    <PanelShell
      banner={banner}
      crumbs={[{ label: "Survey" }, { label: dim.name || "Untitled dimension" }]}
      actions={<>
        <IconAction label="Move up" icon={<ArrowUp size={16} />} disabled={index === 0} onClick={() => api.moveDimension(index, index - 1)} />
        <IconAction label="Move down" icon={<ArrowDown size={16} />} disabled={index === count - 1} onClick={() => api.moveDimension(index, index + 1)} />
        <IconAction label="Delete dimension" danger icon={<Trash2 size={16} />} onClick={() => api.deleteDimension(dim)} />
      </>}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}><TitleInput value={dim.name} onChange={(name) => api.patchDimension(dim.id, { name })} placeholder="Dimension name" autoFocus={api.freshId === dim.id} /></div>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: T.gray500, fontVariantNumeric: "tabular-nums" }}>{plural(dim.explorers.length, "explorer")} · {plural(qCount, "question")}</p>

      <SectionLabel>Explorers</SectionLabel>
      {dim.explorers.length === 0 && <p style={{ margin: "10px 0 8px", fontSize: 14, color: T.gray500, maxWidth: "52ch" }}>No explorers yet. An explorer is a focused topic inside this dimension, such as Sleep or Workload.</p>}
      <div>
        {dim.explorers.map((e, i) => (
          <ListRow key={e.id} lead={i + 1} onClick={() => api.select({ kind: "exp", dimId: dim.id, expId: e.id })} title={{ text: e.name || "Untitled explorer", muted: !e.name }} meta={plural(e.questions.length, "question")} />
        ))}
      </div>
      <div style={{ marginTop: 10 }}><AddLink onClick={() => api.addExplorer(dim.id)}>Add an explorer</AddLink></div>
    </PanelShell>
  );
}

export function ExplorerPanel({ dim, exp, index, count, numbers, api, banner }) {
  const [gallery, setGallery] = useState(exp.questions.length === 0);
  useEffect(() => { setGallery(exp.questions.length === 0); }, [exp.id]);
  return (
    <PanelShell
      banner={banner}
      crumbs={[{ label: "Survey" }, { label: dim.name || "Untitled dimension", onClick: () => api.select({ kind: "dim", dimId: dim.id }) }, { label: exp.name || "Untitled explorer" }]}
      actions={<>
        <IconAction label="Move up" icon={<ArrowUp size={16} />} disabled={index === 0} onClick={() => api.moveExplorer(dim.id, index, index - 1)} />
        <IconAction label="Move down" icon={<ArrowDown size={16} />} disabled={index === count - 1} onClick={() => api.moveExplorer(dim.id, index, index + 1)} />
        <IconAction label="Delete explorer" danger icon={<Trash2 size={16} />} onClick={() => api.deleteExplorer(dim, exp)} />
      </>}
    >
      <TitleInput value={exp.name} onChange={(name) => api.patchExplorer(dim.id, exp.id, { name })} placeholder="Explorer name" size={28} autoFocus={api.freshId === exp.id} />
      <p style={{ margin: "8px 0 0", fontSize: 14, color: T.gray500, fontVariantNumeric: "tabular-nums" }}>{plural(exp.questions.length, "question")}</p>

      <SectionLabel>Questions</SectionLabel>
      <div>
        {exp.questions.map((q) => {
          const t = questionTypeById(q.questionType);
          const Icon = t.icon;
          return (
            <ListRow
              key={q.id} lead={numbers.get(q.id)} onClick={() => api.select({ kind: "q", dimId: dim.id, expId: exp.id, qId: q.id })}
              title={{ text: q.prompt || "Untitled question", muted: !q.prompt }} meta={`${t.label} · ${t.summary(q.typeData)}`}
              accent={<Icon size={16} color={T.gray400} strokeWidth={1.75} />}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        {gallery ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.gray900, margin: "0 0 12px" }}>What kind of question?</div>
            <TypeGallery onPick={(type) => api.addQuestion(dim.id, exp.id, type)} />
          </motion.div>
        ) : (
          <AddLink onClick={() => setGallery(true)}>Add a question</AddLink>
        )}
      </div>
    </PanelShell>
  );
}

export function QuestionPanel({ dim, exp, q, qi, numbers, total, api, banner }) {
  const t = questionTypeById(q.questionType);
  const Icon = t.icon;
  const number = numbers.get(q.id);
  const order = useMemo(() => [...numbers.keys()], [numbers]);
  const prevId = order[order.indexOf(q.id) - 1], nextQId = order[order.indexOf(q.id) + 1];
  const [wide, setWide] = useState(true);
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= 900));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <PanelShell
      banner={banner}
      crumbs={[{ label: dim.name || "Untitled dimension", onClick: () => api.select({ kind: "dim", dimId: dim.id }) }, { label: exp.name || "Untitled explorer", onClick: () => api.select({ kind: "exp", dimId: dim.id, expId: exp.id }) }, { label: `Question ${number}` }]}
      actions={<>
        <IconAction label="Duplicate question" icon={<Copy size={16} />} onClick={() => api.duplicateQuestion(dim.id, exp.id, q)} />
        <IconAction label="Move up" icon={<ArrowUp size={16} />} disabled={qi === 0} onClick={() => api.moveQuestion(dim.id, exp.id, qi, qi - 1)} />
        <IconAction label="Move down" icon={<ArrowDown size={16} />} disabled={qi === exp.questions.length - 1} onClick={() => api.moveQuestion(dim.id, exp.id, qi, qi + 1)} />
        <IconAction label="Delete question" danger icon={<Trash2 size={16} />} onClick={() => api.deleteQuestion(dim, exp, q)} />
      </>}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.gray50, borderRadius: radius.md, padding: "4px 10px", fontSize: 13, fontWeight: 500, color: T.gray700 }}><Icon size={14} strokeWidth={1.75} />{t.label}</span>
        <span style={{ fontSize: 13, color: T.gray500, fontVariantNumeric: "tabular-nums" }}>Question {number} of {total}</span>
      </div>
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: wide ? "minmax(0, 480px) minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 40, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500, marginBottom: 10 }}>What people see</div>
          <div style={{ background: T.gray25, borderRadius: radius.xxl, padding: 20, display: "flex", justifyContent: "center", overflow: "hidden" }}>
            <div style={{ boxShadow: SHADOW_SOFT, borderRadius: radius.xxl, maxWidth: "100%" }}><LiveQuestion q={q} number={number} total={total} /></div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500, marginBottom: 10 }}>Settings</div>
          <div style={{ background: T.gray25, borderRadius: radius.xl }}>
            <QuestionEditorBody data={q} onPatch={(patch) => api.patchQuestion(dim.id, exp.id, q.id, patch)} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40, paddingTop: 20, borderTop: `1px solid ${T.gray50}` }}>
        <Button theme="brand" variation="ghost" size="sm" iconLeft={<ArrowLeft size={16} />} disabled={!prevId} onClick={() => api.selectQuestionById(prevId)}>Previous</Button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button theme="brand" variation="secondary" size="sm" iconLeft={<Plus size={16} />} onClick={() => api.select({ kind: "exp", dimId: dim.id, expId: exp.id })}>Add another</Button>
          <Button theme="brand" variation="primary" size="sm" iconRight={<ArrowRight size={16} />} disabled={!nextQId} onClick={() => api.selectQuestionById(nextQId)}>Next</Button>
        </div>
      </div>
    </PanelShell>
  );
}

/* ---- screen ------------------------------------------------------------------------ */
/* All of Studio's state and actions, shared with Studio AI (SurveyBuilderV5.jsx). */
export function useStudio() {
  const [blueprint, setBlueprint] = useState(() => loadBlueprintV2() ?? createBlueprintV2());
  const [sel, setSel] = useState({ kind: null });
  const [collapsed, setCollapsed] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [undo, setUndo] = useState(null); // { label, snapshot }
  const [freshId, setFreshId] = useState(null);
  const saveTimer = useRef(null), undoTimer = useRef(null), isFirstRun = useRef(true), latest = useRef(blueprint);
  latest.current = blueprint;

  // Autosave (same draft as v2), and flush on the way out so switching tabs never loses the last edit.
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveBlueprintV2({ ...blueprint, updatedAt: Date.now() }); setSaveStatus("saved"); }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(saveTimer.current);
  }, [blueprint]);
  useEffect(() => () => { saveBlueprintV2({ ...latest.current, updatedAt: Date.now() }); clearTimeout(undoTimer.current); }, []);

  // Keep the selection valid, and start on something.
  useEffect(() => {
    const exists = (s) => {
      const d = blueprint.dimensions.find((x) => x.id === s.dimId);
      if (s.kind === "dim") return !!d;
      const e = d?.explorers.find((x) => x.id === s.expId);
      if (s.kind === "exp") return !!e;
      if (s.kind === "q") return !!e?.questions.some((x) => x.id === s.qId);
      return false;
    };
    if (sel.kind && exists(sel)) return;
    const d = blueprint.dimensions[0];
    setSel(d ? { kind: "dim", dimId: d.id } : { kind: null });
  }, [blueprint, sel]);

  const numbers = useMemo(() => {
    const m = new Map();
    flattenQuestionsV2(blueprint).forEach((r, i) => m.set(r.question.id, i + 1));
    return m;
  }, [blueprint]);

  const select = (s) => setSel(s);
  const selectQuestionById = (id) => {
    for (const d of blueprint.dimensions) for (const e of d.explorers) if (e.questions.some((q) => q.id === id)) return setSel({ kind: "q", dimId: d.id, expId: e.id, qId: id });
  };
  // A brand-new dimension/explorer starts with its name selected for typing — but only the first time it appears.
  const flagFresh = (id) => { setFreshId(id); setTimeout(() => setFreshId(null), 800); };
  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  const edit = (fn) => setBlueprint((b) => fn(b));
  const withUndo = (label, fn) => {
    setUndo({ label, snapshot: blueprint });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
    fn();
  };

  const api = {
    select, selectQuestionById, freshId,
    patchDimension: (id, patch) => edit((b) => mapDim(b, id, (d) => ({ ...d, ...patch, ai: false }))),
    moveDimension: (from, to) => edit((b) => ({ ...b, dimensions: moveItem(b.dimensions, from, to) })),
    deleteDimension: (d) => withUndo(`Deleted “${d.name || "Untitled dimension"}”`, () => edit((b) => ({ ...b, dimensions: b.dimensions.filter((x) => x.id !== d.id) }))),
    addExplorer: (dimId) => {
      const e = createExplorer("");
      edit((b) => mapDim(b, dimId, (d) => ({ ...d, explorers: [...d.explorers, e] })));
      flagFresh(e.id); setSel({ kind: "exp", dimId, expId: e.id });
    },
    patchExplorer: (dimId, expId, patch) => edit((b) => mapExp(b, dimId, expId, (e) => ({ ...e, ...patch, ai: false }))),
    moveExplorer: (dimId, from, to) => edit((b) => mapDim(b, dimId, (d) => ({ ...d, explorers: moveItem(d.explorers, from, to) }))),
    deleteExplorer: (d, e) => withUndo(`Deleted “${e.name || "Untitled explorer"}”`, () => { edit((b) => mapDim(b, d.id, (x) => ({ ...x, explorers: x.explorers.filter((y) => y.id !== e.id) }))); setSel({ kind: "dim", dimId: d.id }); }),
    addQuestion: (dimId, expId, type) => {
      const t = questionTypeById(type);
      const q = createQuestionV2(type, t.defaultTypeData(), t.defaultTag);
      edit((b) => mapExp(b, dimId, expId, (e) => ({ ...e, questions: [...e.questions, q] })));
      setSel({ kind: "q", dimId, expId, qId: q.id });
    },
    patchQuestion: (dimId, expId, qId, patch) => edit((b) => mapExp(b, dimId, expId, (e) => ({ ...e, questions: e.questions.map((q) => (q.id === qId ? { ...q, ...patch, ai: false } : q)) }))),
    moveQuestion: (dimId, expId, from, to) => edit((b) => mapExp(b, dimId, expId, (e) => ({ ...e, questions: moveItem(e.questions, from, to) }))),
    duplicateQuestion: (dimId, expId, q) => {
      const copy = { ...q, id: `q-${nextId()}`, typeData: JSON.parse(JSON.stringify(q.typeData)), visibleToPersonas: [...q.visibleToPersonas] };
      edit((b) => mapExp(b, dimId, expId, (e) => { const i = e.questions.findIndex((x) => x.id === q.id); const next = [...e.questions]; next.splice(i + 1, 0, copy); return { ...e, questions: next }; }));
      setSel({ kind: "q", dimId, expId, qId: copy.id });
    },
    deleteQuestion: (d, e, q) => withUndo("Deleted the question", () => { edit((b) => mapExp(b, d.id, e.id, (x) => ({ ...x, questions: x.questions.filter((y) => y.id !== q.id) }))); setSel({ kind: "exp", dimId: d.id, expId: e.id }); }),
  };

  const addDimension = () => {
    const d = createDimension(`Dimension ${blueprint.dimensions.length + 1}`);
    edit((b) => ({ ...b, dimensions: [...b.dimensions, d] }));
    flagFresh(d.id); setSel({ kind: "dim", dimId: d.id });
  };
  const restore = () => { if (!undo) return; setBlueprint(undo.snapshot); setUndo(null); clearTimeout(undoTimer.current); };

  const total = numbers.size;
  const dimIdx = blueprint.dimensions.findIndex((d) => d.id === sel.dimId);
  const dim = blueprint.dimensions[dimIdx];
  const expIdx = dim ? dim.explorers.findIndex((e) => e.id === sel.expId) : -1;
  const exp = dim?.explorers[expIdx];
  const qi = exp ? exp.questions.findIndex((q) => q.id === sel.qId) : -1;
  const q = exp?.questions[qi];

  return {
    blueprint, setBlueprint, sel, setSel, collapsed, toggle, previewOpen, setPreviewOpen, saveStatus, undo, restore, freshId,
    numbers, total, select, selectQuestionById, edit, withUndo, flagFresh, api, addDimension,
    dimIdx, dim, expIdx, exp, qi, q,
  };
}

export default function SurveyBuilderV4({ navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder, onExit, version, onVersionChange }) {
  const { blueprint, setBlueprint, sel, collapsed, toggle, previewOpen, setPreviewOpen, saveStatus, undo, restore, numbers, total, select, api, addDimension, dimIdx, dim, expIdx, exp, qi, q } = useStudio();

  return (
    <div className="sv4" style={{ flex: 1, minHeight: 0, display: "flex", fontFamily: font, position: "relative", overflow: "hidden" }}>
      <NavRail active="survey-builder" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, background: T.gray25 }}>
        <header style={{ padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.white, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button aria-label="Back" onClick={onExit} className="sv4-link" style={{ border: "none", background: "transparent", color: T.gray500, cursor: "pointer", display: "flex", flexShrink: 0, padding: 4, borderRadius: radius.sm }}><ArrowLeft size={14} /></button>
            <div style={{ minWidth: 0 }}>
              <input aria-label="Survey name" value={blueprint.name} onChange={(e) => setBlueprint((b) => ({ ...b, name: e.target.value }))} className="sv4-title" style={{ border: "none", background: "transparent", fontSize: 14, fontWeight: 600, color: T.gray800, fontFamily: font, padding: "1px 6px", margin: "0 -6px", width: 240, borderRadius: radius.sm }} />
              <div style={{ fontSize: 11, color: T.gray400 }} aria-live="polite">{saveStatus === "saving" ? "Saving…" : "Saved on this device · draft"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <VersionSwitcher value={version} onChange={onVersionChange} />
            <Button theme="accent" variation="primary" size="xs" iconLeft={<Play size={14} />} onClick={() => setPreviewOpen(true)} disabled={total === 0}>Preview</Button>
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexWrap: "wrap", alignContent: "stretch", overflowY: "auto" }}>
          <Rail blueprint={blueprint} sel={sel} select={select} collapsed={collapsed} toggle={toggle} numbers={numbers} onAddDimension={addDimension} />
          <main style={{ flex: "1 1 560px", minWidth: 0, margin: "12px 12px 12px 0", background: T.white, borderRadius: radius.xxl, boxShadow: SHADOW, overflowY: "auto", position: "relative" }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`${sel.kind}-${sel.qId || sel.expId || sel.dimId || "none"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ ...SPRING, duration: 0.2 }}>
                {!dim ? <StartPanel onAdd={addDimension} />
                  : sel.kind === "q" && q ? <QuestionPanel dim={dim} exp={exp} q={q} qi={qi} numbers={numbers} total={total} api={api} />
                  : sel.kind === "exp" && exp ? <ExplorerPanel dim={dim} exp={exp} index={expIdx} count={dim.explorers.length} numbers={numbers} api={api} />
                  : <DimensionPanel dim={dim} index={dimIdx} count={blueprint.dimensions.length} color={DIMENSION_COLORS[dimIdx % DIMENSION_COLORS.length]} numbers={numbers} api={api} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <AnimatePresence>
          {undo && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={SPRING} role="status" style={{ position: "absolute", left: "50%", bottom: 28, transform: "translateX(-50%)", zIndex: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, background: T.gray900, color: T.white, borderRadius: radius.lg, padding: "10px 12px 10px 18px", fontSize: 14, boxShadow: SHADOW }}>
                {undo.label}
                <Press onClick={restore} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: T.white, borderRadius: radius.md, padding: "5px 12px", fontSize: 13, fontWeight: 600 }}>Undo</Press>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {previewOpen && <PreviewModalV2 blueprint={blueprint} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
