import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Play, Sparkles, ArrowUp, ArrowRight, Check, X, RefreshCw, CircleAlert, Lightbulb, CircleCheck } from "lucide-react";
import { T, font, radius, band } from "../../lib/tokens.js";
import NavRail from "../shell/NavRail.jsx";
import Button from "../ui/Button.jsx";
import Press from "../ui/Press.jsx";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import { TypingDots } from "../chat/Bubble.jsx";
import VersionSwitcher from "./VersionSwitcher.jsx";
import PreviewModalV2 from "./PreviewModalV2.jsx";
import { DIMENSION_COLORS } from "./SurveyOutline.jsx";
import { useStudio, Rail, DimensionPanel, ExplorerPanel, QuestionPanel, TitleInput, SHADOW, SHADOW_SOFT, SPRING, RAIL_W, plural } from "./SurveyBuilderV4.jsx";
import { questionTypeById } from "../../lib/questionTypes.js";
import { createQuestionV2 } from "../../lib/surveyBlueprintV2.js";
import { dimensionRankedRows } from "../../lib/dataset.js";
import {
  DEPTHS, draftSurvey, draftCounts, improvePrompt, splitPrompt, suggestQuestions, suggestExplorers, reviewQuestion, reviewSurvey,
  trimSurvey, interpret, surveySeconds, minutesLabel, questionSeconds,
} from "../../lib/surveyAssistant.js";
import { nextId } from "../../lib/id.js";
import mascot from "../../assets/mascot-avatar.svg";

/* ================================================================== */
/* SURVEY BUILDER — VERSION 5, "Studio AI". Studio (v4) with the         */
/* assistant built into the way you work instead of beside it.             */
/*                                                                         */
/*  - You start from a brief, not a blank page: say what you want to learn,  */
/*    get a drafted survey back — real Explorers and Drivers, each with the   */
/*    reason it is there (last round's score) — and approve it before it      */
/*    lands. Quick / Standard / Thorough changes how much it asks.            */
/*  - The assistant knows what is selected. On a question it offers wording    */
/*    (clearer, shorter, neutral) and a check; on an explorer, missing         */
/*    questions; on a dimension, missing explorers; on the survey, a review,   */
/*    a time estimate and "trim to N minutes".                                 */
/*  - Everything it does is a PROPOSAL you accept: a before/after for wording,  */
/*    a checklist for additions, a list of what a trim would remove. Nothing   */
/*    changes silently, and anything it adds to the survey is marked with a     */
/*    sparkle until you have read it and kept it.                              */
/*  - A quality check (leading wording, two questions in one, repeats, length,   */
/*    open-text fatigue) with a fix for each finding.                           */
/*                                                                           */
/* It edits the same survey as Sections / Studio and shares Studio's state       */
/* (`useStudio`). The "AI" is a scripted engine (lib/surveyAssistant.js), not a    */
/* language model — it is grounded in the real survey catalogue and never          */
/* contradicts the request, but a real model would replace it. The shapes it        */
/* returns are what this screen is built on.                                        */
/* ================================================================== */
const PANEL_W = 372;
const WIDE_AT = 1360;
const STEPS = ["Reading your brief", "Finding the areas it touches", "Drafting the questions", "Checking the wording"];

const uid = () => `m-${nextId()}`;

/* **bold** only. */
function Rich({ text }) {
  return <>{text.split(/(\*\*.+?\*\*)/g).map((p, i) => (p.startsWith("**") ? <b key={i} style={{ fontWeight: 600, color: T.gray900 }}>{p.slice(2, -2)}</b> : p))}</>;
}

/* ---- the brief input -------------------------------------------------------------- */
function BriefInput({ onSend, placeholder, large, autoFocus, flat }) {
  const [v, setV] = useState("");
  const submit = () => { if (v.trim()) { onSend(v); setV(""); } };
  return (
    <div className="wb2-field" style={{ display: "flex", alignItems: "center", gap: 10, background: flat ? T.gray50 : T.white, borderRadius: radius.xl, padding: large ? "10px 10px 10px 20px" : "6px 6px 6px 14px", boxShadow: flat ? "none" : SHADOW_SOFT }}>
      <input
        autoFocus={autoFocus} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder} aria-label={placeholder} className="placeholder-gray400"
        style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: font, fontSize: large ? 16 : 14, color: T.gray900, padding: large ? "8px 0" : "6px 0" }}
      />
      <Press aria-label="Send" onClick={submit} disabled={!v.trim()} style={{ width: large ? 40 : 32, height: large ? 40 : 32, borderRadius: radius.lg, border: "none", background: v.trim() ? T.gray900 : T.gray75, color: v.trim() ? T.white : T.gray400, display: "flex", alignItems: "center", justifyContent: "center", cursor: v.trim() ? "pointer" : "default", transition: "background 150ms ease, color 150ms ease" }}>
        <ArrowUp size={large ? 20 : 16} />
      </Press>
    </div>
  );
}

/* ---- main-sheet phases --------------------------------------------------------------- */
function BriefPanel({ onBrief }) {
  const weakest = dimensionRankedRows().slice(-3).reverse();
  return (
    <div style={{ padding: "56px 56px 64px", maxWidth: 640 }}>
      <img src={mascot} width={40} height={40} alt="" />
      <h2 style={{ margin: "24px 0 12px", fontSize: 36, lineHeight: "40px", fontWeight: 600, letterSpacing: "-0.9px", color: T.gray900, textWrap: "balance" }}>Tell me what you want to learn.</h2>
      <p style={{ margin: "0 0 28px", fontSize: 16, lineHeight: "24px", color: T.gray600, maxWidth: "50ch", textWrap: "pretty" }}>
        Describe the topic or the problem. I'll draft the survey — which areas to ask about, and the questions — and you decide what stays.
      </p>
      <BriefInput onSend={onBrief} placeholder="For example, a pulse survey on sleep and stress" large autoFocus />
      <div style={{ marginTop: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500, marginBottom: 6 }}>Or start from what needs attention</div>
        {weakest.map(([name, value]) => (
          <Press key={name} onClick={() => onBrief(`A survey about ${name}`)} className="wb2-row" style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto 20px", alignItems: "center", gap: 16, border: "none", background: "transparent", textAlign: "left", padding: "14px 4px", borderBottom: `1px solid ${T.gray75}`, borderRadius: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: T.gray900 }}>{name}</span>
            <span style={{ fontSize: 13, color: T.gray500 }}>scored <b style={{ color: band(value).cs, fontVariantNumeric: "tabular-nums" }}>{value}</b> last round</span>
            <ArrowRight size={16} color={T.gray400} />
          </Press>
        ))}
      </div>
    </div>
  );
}

function GeneratingPanel({ brief, step }) {
  const bar = (w, h = 12) => <div className="wb2-skel" style={{ width: w, height: h, borderRadius: 6 }} />;
  return (
    <div style={{ padding: "56px 56px 64px", maxWidth: 640 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500, marginBottom: 6 }}>Your brief</div>
      <p style={{ margin: "0 0 28px", fontSize: 20, lineHeight: "28px", fontWeight: 500, color: T.gray900, textWrap: "balance" }}>{brief}</p>
      <div role="status" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i <= step ? 1 : 0.4, fontSize: 15, color: T.gray800, transition: "opacity 200ms ease" }}>
            {i < step ? <Check size={16} color={T.greenStrong} /> : i === step ? <RefreshCw size={16} color={T.accent} className="spin" /> : <span style={{ width: 16 }} />}
            {label}
          </div>
        ))}
      </div>
      <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 1 - i * 0.25 }}>{bar("36%", 14)}{bar("88%", 10)}{bar("64%", 10)}</div>)}
      </div>
    </div>
  );
}

function DraftPanel({ pending, setPending, onApply, onDiscard, hasSurvey }) {
  const { draft, excluded, name, depth } = pending;
  const counts = draftCounts(draft, excluded);
  const redo = (d) => setPending((p) => ({ ...p, depth: d, draft: draftSurvey(p.brief, d) }));
  const toggle = (id) => setPending((p) => { const ex = new Set(p.excluded); ex.has(id) ? ex.delete(id) : ex.add(id); return { ...p, excluded: ex }; });
  return (
    <div style={{ padding: "32px 48px 56px", maxWidth: 840 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.gray500, marginBottom: 14 }}><Sparkles size={14} color={T.accent} />Draft for review — nothing is in your survey yet</div>
      {!hasSurvey && <TitleInput value={name} onChange={(v) => setPending((p) => ({ ...p, name: v }))} placeholder="Survey name" size={32} />}
      {hasSurvey && <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-0.6px", color: T.gray900 }}>Add to this survey</h2>}
      <p style={{ margin: "8px 0 0", fontSize: 14, color: T.gray500, fontVariantNumeric: "tabular-nums" }}>{plural(counts.explorers, "explorer")} · {plural(counts.questions, "question")} · {minutesLabel(counts.seconds)}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 6px", flexWrap: "wrap" }}>
        <SegmentedControl options={DEPTHS.map((d) => ({ id: d.id, label: d.label }))} value={depth} onChange={redo} />
        <span style={{ fontSize: 13, color: T.gray500 }}>{DEPTHS.find((d) => d.id === depth)?.hint}</span>
      </div>

      {draft.notes.length > 0 && (
        <ul style={{ margin: "18px 0 0", padding: "12px 16px 12px 32px", background: T.accentBg, borderRadius: radius.lg, fontSize: 13.5, lineHeight: "20px", color: T.gray800 }}>
          {draft.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}

      {draft.dimensions.map((d, i) => {
        const color = DIMENSION_COLORS[i % DIMENSION_COLORS.length];
        return (
          <section key={d.id} style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0, alignSelf: "center" }} />
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px", color: T.gray900 }}>{d.name}</h3>
              <span style={{ fontSize: 13, color: T.gray500 }}>{d.why}</span>
            </div>
            {d.explorers.map((e) => {
              const off = excluded.has(e.id);
              return (
                <div key={e.id} style={{ marginTop: 14, opacity: off ? 0.45 : 1, transition: "opacity 150ms ease" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={!off} onChange={() => toggle(e.id)} style={{ width: 16, height: 16, accentColor: T.gray900 }} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: T.gray900 }}>{e.name}</span>
                    <span style={{ fontSize: 12.5, color: T.gray500 }}>{e.why}</span>
                  </label>
                  <ol style={{ listStyle: "none", margin: "8px 0 0 26px", padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    {e.questions.map((q) => {
                      const Icon = questionTypeById(q.type).icon;
                      return (
                        <li key={q.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: "20px", color: T.gray700 }}>
                          <Icon size={14} color={T.gray400} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 3 }} />{q.prompt}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </section>
        );
      })}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 40, paddingTop: 20, borderTop: `1px solid ${T.gray50}` }}>
        <Button theme="accent" variation="primary" size="md" iconLeft={<Check size={18} />} disabled={counts.questions === 0} onClick={onApply}>{hasSurvey ? "Add to survey" : "Create survey"}</Button>
        <Button theme="brand" variation="ghost" size="md" onClick={onDiscard}>Discard</Button>
      </div>
    </div>
  );
}

/* ---- the AI banner on a drafted item ------------------------------------------------ */
function AiBanner({ text, onKeep, keepLabel = "Keep", children }) {
  return (
    <div role="note" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: T.accentBg, borderRadius: radius.lg, padding: "10px 12px 10px 14px", marginBottom: 20, fontSize: 13.5, color: T.gray800 }}>
      <Sparkles size={15} color={T.accent} style={{ flexShrink: 0 }} />
      <span style={{ flex: "1 1 220px" }}>{text}</span>
      {children}
      <Press onClick={onKeep} style={{ border: "none", background: T.white, color: T.gray900, borderRadius: radius.md, padding: "5px 12px", fontSize: 13, fontWeight: 600, boxShadow: SHADOW_SOFT }}>{keepLabel}</Press>
    </div>
  );
}
const QuickLink = ({ onClick, children }) => (
  <Press onClick={onClick} className="sv4-link" style={{ border: "none", background: "transparent", color: T.gray700, fontSize: 13, fontWeight: 500, padding: "5px 8px", borderRadius: radius.md }}>{children}</Press>
);

/* ---- assistant panel ------------------------------------------------------------------- */
const SEV = { issue: { c: T.red, Icon: CircleAlert }, tip: { c: T.amberStrong, Icon: Lightbulb }, info: { c: T.green, Icon: CircleCheck } };

function CardShell({ children, done }) {
  return <div style={{ background: T.gray25, borderRadius: radius.lg, padding: 12, marginTop: 8, opacity: done ? 0.7 : 1 }}>{children}</div>;
}
const smallBtn = (primary) => ({ border: "none", borderRadius: radius.md, padding: "5px 12px", fontSize: 13, fontWeight: 600, background: primary ? T.gray900 : "transparent", color: primary ? T.white : T.gray700 });

function ProposalCard({ card, onApply, onDismiss, onFix, onGo }) {
  const [picked, setPicked] = useState(() => new Set((card.items || []).map((i) => i.id)));
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const done = card.status !== "open";
  const status = card.status === "applied" ? <span style={{ fontSize: 13, color: T.greenStrong, fontWeight: 600 }}>Applied</span> : card.status === "dismissed" ? <span style={{ fontSize: 13, color: T.gray500 }}>Dismissed</span> : null;

  if (card.kind === "edit")
    return (
      <CardShell done={done}>
        <div style={{ fontSize: 12, color: T.gray500, marginBottom: 6 }}>{card.label}</div>
        <div style={{ fontSize: 13.5, lineHeight: "19px", color: T.gray500, textDecoration: "line-through" }}>{card.before}</div>
        <div style={{ fontSize: 13.5, lineHeight: "19px", color: T.gray900, fontWeight: 500, marginTop: 4 }}>{card.after}</div>
        {card.note && <div style={{ fontSize: 12, color: T.gray500, marginTop: 6 }}>{card.note}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          {done ? status : (<><Press onClick={() => onApply(card)} style={smallBtn(true)}>Accept</Press><Press onClick={() => onDismiss(card)} className="sv4-link" style={smallBtn(false)}>Dismiss</Press></>)}
        </div>
      </CardShell>
    );

  if (card.kind === "retype")
    return (
      <CardShell done={done}>
        <div style={{ fontSize: 13.5, lineHeight: "19px", color: T.gray800 }}>Switch to a <b>{card.toLabel}</b> question. {card.note}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          {done ? status : (<><Press onClick={() => onApply(card)} style={smallBtn(true)}>Switch</Press><Press onClick={() => onDismiss(card)} className="sv4-link" style={smallBtn(false)}>Dismiss</Press></>)}
        </div>
      </CardShell>
    );

  if (card.kind === "split")
    return (
      <CardShell done={done}>
        <div style={{ fontSize: 12, color: T.gray500, marginBottom: 6 }}>{card.label}</div>
        <div style={{ fontSize: 13.5, lineHeight: "19px", color: T.gray500, textDecoration: "line-through" }}>{card.before}</div>
        {card.parts.map((p, i) => <div key={i} style={{ fontSize: 13.5, lineHeight: "19px", color: T.gray900, fontWeight: 500, marginTop: 4 }}>{i + 1}. {p}</div>)}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          {done ? status : (<><Press onClick={() => onApply(card)} style={smallBtn(true)}>Split</Press><Press onClick={() => onDismiss(card)} className="sv4-link" style={smallBtn(false)}>Dismiss</Press></>)}
        </div>
      </CardShell>
    );

  if (card.kind === "add" || card.kind === "explorers" || card.kind === "remove")
    return (
      <CardShell done={done}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {card.items.map((it) => (
            <label key={it.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, lineHeight: "19px", color: T.gray800, cursor: done ? "default" : "pointer" }}>
              <input type="checkbox" disabled={done} checked={picked.has(it.id)} onChange={() => toggle(it.id)} style={{ marginTop: 3, accentColor: T.gray900 }} />
              <span><span style={{ fontWeight: 500 }}>{it.title}</span>{it.sub && <span style={{ display: "block", fontSize: 12, color: T.gray500 }}>{it.sub}</span>}</span>
            </label>
          ))}
        </div>
        {card.note && <div style={{ fontSize: 12, color: T.gray500, marginTop: 8 }}>{card.note}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          {done ? status : (<><Press disabled={picked.size === 0} onClick={() => onApply(card, picked)} style={{ ...smallBtn(true), opacity: picked.size ? 1 : 0.4 }}>{card.kind === "remove" ? `Remove ${picked.size}` : `Add ${picked.size}`}</Press><Press onClick={() => onDismiss(card)} className="sv4-link" style={smallBtn(false)}>Dismiss</Press></>)}
        </div>
      </CardShell>
    );

  if (card.kind === "review")
    return (
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {card.findings.map((f) => {
          const { c, Icon } = SEV[f.severity];
          return (
            <div key={f.id} style={{ background: T.gray25, borderRadius: radius.lg, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon size={15} color={c} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, lineHeight: "19px", color: T.gray800 }}>{f.message}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {f.where?.dimId && <Press onClick={() => onGo(f.where)} className="sv4-link" style={{ ...smallBtn(false), padding: "3px 8px", fontSize: 12.5 }}>Go there</Press>}
                  {f.fix && <Press onClick={() => onFix(f)} style={{ ...smallBtn(true), padding: "3px 10px", fontSize: 12.5 }}>{f.fix.label}</Press>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  return null;
}

function AssistantPanel({ messages, thinking, onSend, chips, context, onClose, overlay, cardApi }) {
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length, thinking]);
  return (
    <aside aria-label="Assistant" style={{ width: PANEL_W, flexShrink: 0, display: "flex", flexDirection: "column", background: T.white, borderRadius: radius.xxl, boxShadow: SHADOW, overflow: "hidden", ...(overlay ? { position: "absolute", top: 12, right: 12, bottom: 12, zIndex: 30 } : { margin: "12px 12px 12px 0" }) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px 10px" }}>
        <Sparkles size={16} color={T.accent} />
        <span style={{ fontSize: 14, fontWeight: 600, color: T.gray900, flex: 1 }}>Assistant</span>
        <span style={{ fontSize: 12, color: T.gray500, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{context}</span>
        {overlay && <Press aria-label="Close assistant" onClick={onClose} className="sv4-act" style={{ border: "none", background: "transparent", width: 28, height: 28, borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center", color: T.gray500 }}><X size={16} /></Press>}
      </div>
      <div role="log" aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: "4px 16px 12px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 && <p style={{ margin: "8px 0", fontSize: 13.5, lineHeight: "20px", color: T.gray500 }}>Ask for a draft, a rewrite, a check or a trim. I'll propose changes; you decide.</p>}
        {messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
            {m.role === "user"
              ? <div style={{ display: "flex", justifyContent: "flex-end" }}><div style={{ maxWidth: 280, background: T.gray50, borderRadius: radius.lg, padding: "8px 12px", fontSize: 14, lineHeight: "20px", color: T.gray900 }}>{m.text}</div></div>
              : (
                <div style={{ display: "flex", gap: 8 }}>
                  <img src={mascot} width={22} height={22} alt="" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {m.text && <div style={{ fontSize: 14, lineHeight: "20px", color: T.gray700 }}><Rich text={m.text} /></div>}
                    {m.card && <ProposalCard card={m.card} {...cardApi(m)} />}
                  </div>
                </div>
              )}
          </motion.div>
        ))}
        {thinking && <div style={{ display: "flex", gap: 8 }}><img src={mascot} width={22} height={22} alt="" /><TypingDots /></div>}
        <div ref={end} />
      </div>
      <div style={{ padding: "6px 12px 12px" }}>
        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {chips.map((c) => <Press key={c} onClick={() => onSend(c)} className="sv4-link" style={{ border: "none", background: T.gray50, color: T.gray800, borderRadius: radius.md, padding: "5px 10px", fontSize: 13 }}>{c}</Press>)}
          </div>
        )}
        <BriefInput onSend={onSend} placeholder="Ask the assistant…" flat />
      </div>
    </aside>
  );
}

/* ---- screen ----------------------------------------------------------------------------------- */
export default function SurveyBuilderV5({ navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder, onExit, version, onVersionChange }) {
  const S = useStudio();
  const { blueprint, sel, collapsed, toggle, previewOpen, setPreviewOpen, saveStatus, undo, restore, numbers, total, select, selectQuestionById, api, edit, withUndo, dimIdx, dim, expIdx, exp, qi, q } = S;
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [pending, setPending] = useState(null);       // a draft awaiting approval
  const [generating, setGenerating] = useState(null); // { brief, step }
  const [panelOpen, setPanelOpen] = useState(null);   // null = follow the width
  const [width, setWidth] = useState(1400);
  const rootRef = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);
  const wide = width >= WIDE_AT;
  const open = panelOpen ?? wide;
  const overlay = !wide;

  const hasSurvey = blueprint.dimensions.length > 0;
  const aiIds = useMemo(() => {
    const s = new Set();
    blueprint.dimensions.forEach((d) => { if (d.ai) s.add(d.id); d.explorers.forEach((e) => { if (e.ai) s.add(e.id); e.questions.forEach((x) => { if (x.ai) s.add(x.id); }); }); });
    return s;
  }, [blueprint]);
  const seconds = surveySeconds(blueprint);

  /* ---- messages ---- */
  const say = (m) => setMessages((ms) => [...ms, { id: uid(), role: "ai", ...m }]);
  const setCard = (msgId, patch) => setMessages((ms) => ms.map((m) => (m.id === msgId ? { ...m, card: { ...m.card, ...patch } } : m)));
  const reply = (fn) => { setThinking(true); later(() => { setThinking(false); fn(); }, 450); };

  /* ---- drafting ---- */
  const startDraft = (brief) => {
    setPending(null);
    setGenerating({ brief, step: 0 });
    [1, 2, 3].forEach((s) => later(() => setGenerating((g) => (g ? { ...g, step: s } : g)), s * 420));
    later(() => {
      const d = draftSurvey(brief, "standard");
      setGenerating(null);
      setPending({ brief, depth: "standard", draft: d, excluded: new Set(), name: d.name });
      const c = draftCounts(d);
      say({ text: `Here's a draft: **${plural(c.explorers, "explorer")}**, **${plural(c.questions, "question")}**, ${minutesLabel(c.seconds)}. ${d.fallback ? d.notes[0] : "Each explorer opens with a statement people can agree or disagree with."} Untick anything you don't want, then create it.` });
    }, 4 * 420);
  };
  const applyDraft = () => {
    const { draft, excluded, name } = pending;
    const dims = draft.dimensions.map((d) => ({
      id: d.id.replace("ad-", "dim-"), name: d.name, ai: true,
      explorers: d.explorers.filter((e) => !excluded.has(e.id)).map((e) => ({
        id: e.id.replace("ae-", "exp-"), name: e.name, ai: true,
        questions: e.questions.map((x) => ({ ...createQuestionV2(x.type, x.typeData), prompt: x.prompt, ai: true })),
      })),
    })).filter((d) => d.explorers.length);
    withUndo(hasSurvey ? "Added the draft" : "Created the survey", () => edit((b) => ({ ...b, name: b.dimensions.length ? b.name : name, dimensions: [...b.dimensions, ...dims] })));
    setPending(null);
    if (dims[0]) select({ kind: "dim", dimId: dims[0].id });
    say({ text: "Done. Everything I wrote is marked with a sparkle until you've read it. Open any item and choose **Keep**, or ask me to tighten the wording." });
  };

  /* ---- proposals ---- */
  const where = (d, e, x) => ({ dimId: d.id, expId: e.id, qId: x.id });
  const findQ = (id) => { for (const d of blueprint.dimensions) for (const e of d.explorers) { const x = e.questions.find((y) => y.id === id); if (x) return { d, e, x }; } return null; };
  const qLabel = (id) => `Question ${numbers.get(id)}`;

  const proposeImprove = (mode, qid) => {
    const hit = findQ(qid);
    if (!hit) return { text: "Select a question first and I'll work on its wording." };
    const r = improvePrompt(hit.x.prompt, mode);
    const name = { clearer: "Clearer wording", shorter: "Shorter", neutral: "More neutral" }[mode];
    if (!r) return { text: mode === "neutral" ? `${qLabel(qid)} reads neutrally already — I wouldn't change it.` : `I can't tighten ${qLabel(qid).toLowerCase()} without risking its meaning, so I'd leave it.` };
    return { text: `Here's a suggestion for ${qLabel(qid).toLowerCase()}.`, card: { id: uid(), kind: "edit", status: "open", where: where(hit.d, hit.e, hit.x), label: `${qLabel(qid)} · ${name}`, before: hit.x.prompt, after: r.text, note: r.change } };
  };
  const proposeQuestions = (expId) => {
    let target = null;
    for (const d of blueprint.dimensions) { const e = d.explorers.find((y) => y.id === expId); if (e) target = { d, e }; }
    if (!target) return { text: "Select an explorer and I'll suggest questions for it." };
    const qs = suggestQuestions(target.e.name, target.e.questions.map((x) => x.prompt));
    if (!qs.length) return { text: `“${target.e.name}” already covers what I'd ask. I'd leave it.` };
    return { text: `Questions “${target.e.name}” is missing:`, card: { id: uid(), kind: "add", status: "open", dimId: target.d.id, expId: target.e.id, items: qs.map((x) => ({ id: x.id, title: x.prompt, sub: questionTypeById(x.type).label, raw: x })) } };
  };
  const proposeExplorers = (dimId) => {
    const d = blueprint.dimensions.find((x) => x.id === dimId);
    if (!d) return { text: "Select a dimension and I'll suggest explorers for it." };
    const r = suggestExplorers(d.name, d.explorers.map((e) => e.name));
    if (!r.dim) return { text: `“${d.name}” isn't one of the survey's areas, so I don't have drivers to suggest. You can add explorers by hand.` };
    if (!r.explorers.length) return { text: `“${d.name}” already has every explorer I know of.` };
    return { text: `Explorers “${d.name}” could include, weakest first:`, card: { id: uid(), kind: "explorers", status: "open", dimId, items: r.explorers.map((e) => ({ id: e.id, title: e.name, sub: e.why, raw: e })) } };
  };
  const proposeTrim = (minutes) => {
    if (!hasSurvey) return { text: "There's nothing to trim yet." };
    if (seconds <= minutes * 60) return { text: `It's already ${minutesLabel(seconds)} — within ${minutes} minute${minutes === 1 ? "" : "s"}.` };
    const { drop, after } = trimSurvey(blueprint, minutes, numbers);
    if (!drop.length) return { text: `I can't get to ${minutes} minute${minutes === 1 ? "" : "s"} without emptying an explorer. You'd have to remove explorers yourself.` };
    return { text: `Removing these takes it to ${minutesLabel(after)}${after > minutes * 60 ? ` (not quite ${minutes}, without emptying an explorer)` : ""}:`, card: { id: uid(), kind: "remove", status: "open", items: drop.map((d) => ({ id: d.id, title: d.prompt || "Untitled question", sub: `Question ${d.number}` })) } };
  };
  const proposeRetype = (qid, to) => {
    const hit = findQ(qid); const t = questionTypeById(to);
    if (!hit) return { text: "Select a question first." };
    return { text: `A better type for ${qLabel(qid).toLowerCase()}:`, card: { id: uid(), kind: "retype", status: "open", where: where(hit.d, hit.e, hit.x), to, toLabel: t.label, note: "Its wording stays the same." } };
  };
  const proposeSplit = (qid) => {
    const hit = findQ(qid); const parts = hit && splitPrompt(hit.x.prompt);
    if (!parts) return { text: "I couldn't find a clean place to split that one." };
    return { text: `${qLabel(qid)} could be two questions:`, card: { id: uid(), kind: "split", status: "open", where: where(hit.d, hit.e, hit.x), label: qLabel(qid), before: hit.x.prompt, parts } };
  };

  /* ---- applying ---- */
  const cardApi = (m) => ({
    onDismiss: () => setCard(m.id, { status: "dismissed" }),
    onGo: (w) => select(w.qId ? { kind: "q", ...w } : w.expId ? { kind: "exp", ...w } : { kind: "dim", dimId: w.dimId }),
    onFix: (f) => runFix(f),
    onApply: (card, picked) => {
      const c = card;
      if (c.kind === "edit") api.patchQuestion(c.where.dimId, c.where.expId, c.where.qId, { prompt: c.after });
      else if (c.kind === "retype") api.patchQuestion(c.where.dimId, c.where.expId, c.where.qId, { questionType: c.to, typeData: questionTypeById(c.to).defaultTypeData() });
      else if (c.kind === "split") withUndo("Split the question", () => edit((b) => ({ ...b, dimensions: b.dimensions.map((d) => d.id !== c.where.dimId ? d : { ...d, explorers: d.explorers.map((e) => e.id !== c.where.expId ? e : { ...e, questions: e.questions.flatMap((x) => x.id !== c.where.qId ? [x] : c.parts.map((p, i) => ({ ...x, id: i ? `q-${nextId()}` : x.id, prompt: p, typeData: JSON.parse(JSON.stringify(x.typeData)), ai: false }))) }) }) })));
      else if (c.kind === "add") edit((b) => ({ ...b, dimensions: b.dimensions.map((d) => d.id !== c.dimId ? d : { ...d, explorers: d.explorers.map((e) => e.id !== c.expId ? e : { ...e, questions: [...e.questions, ...c.items.filter((i) => picked.has(i.id)).map((i) => ({ ...createQuestionV2(i.raw.type, i.raw.typeData), prompt: i.raw.prompt }))] }) }) }));
      else if (c.kind === "explorers") edit((b) => ({ ...b, dimensions: b.dimensions.map((d) => d.id !== c.dimId ? d : { ...d, explorers: [...d.explorers, ...c.items.filter((i) => picked.has(i.id)).map((i) => ({ id: `exp-${nextId()}`, name: i.raw.name, questions: i.raw.questions.map((x) => ({ ...createQuestionV2(x.type, x.typeData), prompt: x.prompt })) }))] }) }));
      else if (c.kind === "remove") withUndo(`Removed ${picked.size} question${picked.size === 1 ? "" : "s"}`, () => edit((b) => ({ ...b, dimensions: b.dimensions.map((d) => ({ ...d, explorers: d.explorers.map((e) => ({ ...e, questions: e.questions.filter((x) => !picked.has(x.id)) })) })) })));
      setCard(m.id, { status: "applied" });
    },
  });

  const runFix = (f) => {
    const w = f.where || {};
    const k = f.fix.kind;
    select(w.qId ? { kind: "q", ...w } : w.expId ? { kind: "exp", ...w } : w.dimId ? { kind: "dim", dimId: w.dimId } : sel);
    reply(() => {
      if (k === "improve") say(proposeImprove(f.fix.mode, w.qId));
      else if (k === "split") say(proposeSplit(w.qId));
      else if (k === "retype") say(proposeRetype(w.qId, f.fix.to));
      else if (k === "suggestQuestions") say(proposeQuestions(w.expId));
      else if (k === "suggestExplorers") say(proposeExplorers(w.dimId));
      else if (k === "trim") say(proposeTrim(f.fix.minutes));
      else if (k === "remove") { api.deleteQuestion(findQ(w.qId).d, findQ(w.qId).e, findQ(w.qId).x); say({ text: "Removed the repeat. You can undo it from the bar below." }); }
    });
  };

  /* ---- talking to it ---- */
  const send = (text) => {
    const t = text.trim();
    if (!t) return;
    setMessages((ms) => [...ms, { id: uid(), role: "user", text: t }]);
    if (panelOpen === null && !wide) setPanelOpen(true);
    const intent = interpret(t, { hasSurvey, selKind: sel.kind });
    const selQ = sel.kind === "q" ? sel.qId : null;
    const selExp = sel.expId || null;
    if (intent.kind === "draft") { reply(() => startDraft(intent.brief)); return; }
    reply(() => {
      switch (intent.kind) {
        case "time": say({ text: hasSurvey ? `**${minutesLabel(seconds)}** across ${plural(total, "question")}. Open-text questions take the longest — about 45 seconds each.` : "There's no survey yet to time." }); break;
        case "review": say(hasSurvey ? { text: "Here's what I found.", card: { id: uid(), kind: "review", status: "open", findings: reviewSurvey(blueprint, numbers) } } : { text: "There's nothing to review yet." }); break;
        case "reviewQuestion": { const h = findQ(selQ); const fs = h ? reviewQuestion(h.x, where(h.d, h.e, h.x)) : []; say(h ? (fs.length ? { text: `Here's what I found in ${qLabel(selQ).toLowerCase()}.`, card: { id: uid(), kind: "review", status: "open", findings: fs } } : { text: `${qLabel(selQ)} looks fine.` }) : { text: "Select a question first." }); break; }
        case "improve": say(proposeImprove(intent.mode, selQ)); break;
        case "suggestQuestions": say(proposeQuestions(selExp)); break;
        case "suggestExplorers": say(proposeExplorers(sel.dimId)); break;
        case "trim": say(proposeTrim(intent.minutes)); break;
        default: say({ text: "I can **draft a survey** from a brief, **rewrite** a question (clearer, shorter, neutral), **suggest** questions or explorers, **review** the survey, **time** it, or **trim** it to a number of minutes." });
      }
    });
  };

  /* ---- contextual chips ---- */
  const chips = pending || generating ? [] : !hasSurvey ? ["A survey about sleep and stress", "A survey about manager style"]
    : sel.kind === "q" ? ["Make it neutral", "Shorter", "Clearer wording", "Check this question"]
    : sel.kind === "exp" ? ["Suggest questions", "Review the survey"]
    : ["Review the survey", "How long will this take?", "Suggest explorers", "Trim to 5 minutes"];
  const context = sel.kind === "q" ? `Question ${numbers.get(sel.qId)}` : sel.kind === "exp" ? exp?.name : sel.kind === "dim" ? dim?.name : "";

  /* ---- keep ---- */
  const keepIds = (ids) => edit((b) => ({ ...b, dimensions: b.dimensions.map((d) => ({ ...d, ai: ids.has(d.id) ? false : d.ai, explorers: d.explorers.map((e) => ({ ...e, ai: ids.has(e.id) ? false : e.ai, questions: e.questions.map((x) => (ids.has(x.id) ? { ...x, ai: false } : x)) })) })) }));
  const aiIn = (item, kind) => {
    const ids = new Set();
    const walk = (x) => { if (x.ai) ids.add(x.id); };
    if (kind === "dim") { walk(item); item.explorers.forEach((e) => { walk(e); e.questions.forEach(walk); }); }
    else if (kind === "exp") { walk(item); item.questions.forEach(walk); }
    return ids;
  };

  const banner = (() => {
    if (sel.kind === "q" && q?.ai) return (
      <AiBanner text="Drafted from your brief. Read it, then keep it or ask for changes." onKeep={() => keepIds(new Set([q.id]))}>
        <QuickLink onClick={() => send("Make it neutral")}>Make it neutral</QuickLink><QuickLink onClick={() => send("Shorter")}>Shorter</QuickLink>
      </AiBanner>
    );
    if (sel.kind === "exp" && exp) { const ids = aiIn(exp, "exp"); if (ids.size) return <AiBanner text={`${plural(ids.size, "item")} here ${ids.size === 1 ? "was" : "were"} drafted by the assistant and still need a read.`} keepLabel="Keep all" onKeep={() => keepIds(ids)} />; }
    if (sel.kind === "dim" && dim) { const ids = aiIn(dim, "dim"); if (ids.size) return <AiBanner text={`${plural(ids.size, "item")} in this dimension ${ids.size === 1 ? "was" : "were"} drafted by the assistant and still need a read.`} keepLabel="Keep all" onKeep={() => keepIds(ids)} />; }
    return null;
  })();

  const phase = generating ? "generating" : pending ? "draft" : hasSurvey ? "survey" : "brief";

  return (
    <div ref={rootRef} className="sv4" style={{ flex: 1, minHeight: 0, display: "flex", fontFamily: font, position: "relative", overflow: "hidden" }}>
      <NavRail active="survey-builder" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, background: T.gray25, position: "relative" }}>
        <header style={{ padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.white, flexShrink: 0, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button aria-label="Back" onClick={onExit} className="sv4-link" style={{ border: "none", background: "transparent", color: T.gray500, cursor: "pointer", display: "flex", flexShrink: 0, padding: 4, borderRadius: radius.sm }}><ArrowLeft size={14} /></button>
            <div style={{ minWidth: 0 }}>
              <input aria-label="Survey name" value={blueprint.name} onChange={(e) => S.setBlueprint((b) => ({ ...b, name: e.target.value }))} className="sv4-title" style={{ border: "none", background: "transparent", fontSize: 14, fontWeight: 600, color: T.gray800, fontFamily: font, padding: "1px 6px", margin: "0 -6px", width: 200, borderRadius: radius.sm }} />
              <div style={{ fontSize: 11, color: T.gray400, fontVariantNumeric: "tabular-nums" }} aria-live="polite">{saveStatus === "saving" ? "Saving…" : hasSurvey ? `${plural(total, "question")} · ${minutesLabel(seconds)}` : "Saved on this device · draft"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <VersionSwitcher value={version} onChange={onVersionChange} />
            <Button theme="brand" variation={open ? "primary" : "secondary"} size="xs" iconLeft={<Sparkles size={14} />} onClick={() => setPanelOpen(!open)} aria-pressed={open}>Assistant</Button>
            <Button theme="accent" variation="primary" size="xs" iconLeft={<Play size={14} />} onClick={() => setPreviewOpen(true)} disabled={total === 0}>Preview</Button>
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden", position: "relative" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", alignContent: "stretch", overflowY: "auto" }}>
            {hasSurvey && phase === "survey" && <Rail blueprint={blueprint} sel={sel} select={select} collapsed={collapsed} toggle={toggle} numbers={numbers} onAddDimension={S.addDimension} aiIds={aiIds} />}
            <main style={{ flex: "1 1 560px", minWidth: 0, margin: phase === "survey" ? "12px 12px 12px 0" : "12px", background: T.white, borderRadius: radius.xxl, boxShadow: SHADOW, overflowY: "auto", position: "relative" }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={phase === "survey" ? `${sel.kind}-${sel.qId || sel.expId || sel.dimId || "none"}` : phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ ...SPRING, duration: 0.2 }}>
                  {phase === "generating" ? <GeneratingPanel brief={generating.brief} step={generating.step} />
                    : phase === "draft" ? <DraftPanel pending={pending} setPending={setPending} hasSurvey={hasSurvey} onApply={applyDraft} onDiscard={() => { setPending(null); say({ text: "Discarded. Nothing was added." }); }} />
                    : phase === "brief" ? <BriefPanel onBrief={(b) => send(b)} />
                    : sel.kind === "q" && q ? <QuestionPanel dim={dim} exp={exp} q={q} qi={qi} numbers={numbers} total={total} api={api} banner={banner} />
                    : sel.kind === "exp" && exp ? <ExplorerPanel dim={dim} exp={exp} index={expIdx} count={dim.explorers.length} numbers={numbers} api={api} banner={banner} />
                    : dim ? <DimensionPanel dim={dim} index={dimIdx} count={blueprint.dimensions.length} color={DIMENSION_COLORS[dimIdx % DIMENSION_COLORS.length]} numbers={numbers} api={api} banner={banner} /> : null}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div key="panel" initial={overlay ? { opacity: 0, x: 24 } : { opacity: 0 }} animate={{ opacity: 1, x: 0 }} exit={overlay ? { opacity: 0, x: 24 } : { opacity: 0 }} transition={SPRING} style={overlay ? { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 30 } : { display: "flex" }}>
                <div style={{ pointerEvents: "auto", display: "flex" }}>
                  <AssistantPanel messages={messages} thinking={thinking} onSend={send} chips={chips} context={context} overlay={overlay} onClose={() => setPanelOpen(false)} cardApi={cardApi} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {undo && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={SPRING} role="status" style={{ position: "absolute", left: "50%", bottom: 28, transform: "translateX(-50%)", zIndex: 40 }}>
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
