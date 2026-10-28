import { useRef, useEffect, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useDismiss, useInteractions } from "@floating-ui/react";
import { T, font, radius } from "../../lib/tokens.js";
import { subjectFromPrompt } from "../../lib/scopeSubject.js";
import NavRail from "../shell/NavRail.jsx";
import Button from "../ui/Button.jsx";
import { Header } from "../widgets/primitives.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import { TypingDots } from "../chat/Bubble.jsx";
import mascot from "../../assets/mascot-avatar.svg";
import { buildWidget, refine, openingReply, noMatchReply, startingChips, caseIdeas, pickerOptions, chooseKind } from "./builderEngine.js";
import WidgetOptions from "./WidgetOptions.jsx";
import WidgetEditor, { EditableWidget } from "./WidgetEditor.jsx";
import BuilderViewMenu from "./BuilderViewMenu.jsx";
import ScopeOutline, { useWidth, storyDomId, RAIL_W } from "./ScopeOutline.jsx";
import { STORIES, storyById, placeStory, removeStoryKeys, againIds, baseId, hasStory, placementForm } from "./storyCatalog.jsx";
import StoryToolbar from "./StoryToolbar.jsx";
import { ScopeNavContext } from "../scope/scopeNav.js";
import { useLayerStack, LayerBody, Breadcrumb } from "../scope/layers.jsx";
import { PreviewFrame } from "./PreviewWidth.jsx";
import { useStoryStyle, StoryMetaContext } from "../scope/stories/storyStyle.js";
import { SHELL_PADDING } from "../../lib/widgetStructure.js";

/* ================================================================== */
/* WIDGET BUILDER — Create → Widget Builder. A separate flow from the    */
/* Report Builder: describe the widget in chat, get the widget AND its    */
/* Scope back — the Scope pre-filled with Stories suggested from the      */
/* Stories taxonomy (Figma board 13622:35945) for what the widget is      */
/* about. Everything on the right is editable: swap the chart, rename,    */
/* then remove / reorder / add Stories. "Add to Report" puts the finished  */
/* widget (with its Scope) on the Org report.                              */
/*                                                                        */
/* State (`state` = { messages, built }) is owned by App so leaving the    */
/* builder and coming back doesn't lose the work.                          */
/* ================================================================== */
const SPRING = { type: "spring", bounce: 0, duration: 0.3 };
const SHADOW = "0 1px 2px rgba(0,0,0,0.14), 0 4px 4px rgba(0,0,0,0.1), 0 10px 6px rgba(0,0,0,0.06)";
const CHIP = { border: `1px solid ${T.gray100}` };

/* "**bold**" and blank-line paragraphs — all the formatting replies use. */
export function RichText({ text }) {
  return text.split("\n\n").map((para, i) => (
    <p key={i} style={{ margin: i ? "10px 0 0" : 0, fontSize: 14, lineHeight: "21px", color: T.gray900 }}>
      {para.split(/(\*\*.+?\*\*)/g).map((part, j) => (part.startsWith("**") ? <b key={j}>{part.slice(2, -2)}</b> : part))}
    </p>
  ));
}

function Composer({ onSend, placeholder, autoFocus }) {
  const [v, setV] = useState("");
  const submit = () => { if (v.trim()) { onSend(v); setV(""); } };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.full, padding: "8px 8px 8px 20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
      <input
        autoFocus={autoFocus} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={placeholder}
        className="placeholder-gray400" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: font, fontSize: 15, color: T.gray900 }}
      />
      <Button theme="brand" variation="primary" size="sm" shape="round" iconLeft={<ArrowRight size={20} />} onClick={submit} disabled={!v.trim()} aria-label="Send" />
    </div>
  );
}

function Chips({ chips, onPick }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {chips.map((c) => {
        const label = typeof c === "string" ? c : c.label;
        const prompt = typeof c === "string" ? c : c.prompt;
        return <Button key={label} theme="brand" variation="secondary" size="xs" shape="round" style={CHIP} onClick={() => onPick(prompt)}>{label}</Button>;
      })}
    </div>
  );
}

/* ---- empty state ------------------------------------------------------ */
function Welcome({ onSend, reply }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <img src={mascot} width={56} height={56} alt="" />
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, lineHeight: "36px", letterSpacing: "-0.3px", color: T.gray900, textAlign: "center" }}>What widget would you like to build?</h1>
        {reply && <div style={{ display: "flex", gap: 10, width: "100%" }}><img src={mascot} width={28} height={28} alt="" style={{ flexShrink: 0 }} /><div style={{ display: "flex", flexDirection: "column", gap: 12 }}><RichText text={reply.text} /></div></div>}
        <div style={{ width: "100%" }}><Composer onSend={onSend} placeholder="Describe it — a topic, a question, a goal…" autoFocus /></div>
        <Chips chips={reply?.chips || [...startingChips(), ...caseIdeas().slice(0, 5)]} onPick={onSend} />
      </div>
    </div>
  );
}

/* ---- chat column ------------------------------------------------------ */
function ChatColumn({ messages, typing, onSend }) {
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length, typing]);
  return (
    <div style={{ width: 380, flexShrink: 0, background: T.gray25, borderTopRightRadius: radius.widget, borderBottomRightRadius: radius.widget, display: "flex", flexDirection: "column", minHeight: 0, boxShadow: "4px 0 16px rgba(0,0,0,0.04)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 8px", display: "flex", flexDirection: "column", gap: 20 }}>
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
            {m.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: 280, background: T.white, border: `1px solid ${T.gray75}`, borderRadius: radius.xl, padding: "10px 14px", fontSize: 14, lineHeight: "20px", color: T.gray900 }}>{m.text}</div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <img src={mascot} width={28} height={28} alt="" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <div><RichText text={m.text} /></div>
                  {m.chips && i === messages.length - 1 && <Chips chips={m.chips} onPick={onSend} />}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {typing && <div style={{ display: "flex", gap: 10 }}><img src={mascot} width={28} height={28} alt="" /><TypingDots /></div>}
        <div ref={end} />
      </div>
      <div style={{ padding: "8px 16px 16px" }}><Composer onSend={onSend} placeholder="Ask for a change…" /></div>
    </div>
  );
}

/* ---- the widget ------------------------------------------------------- */
function WidgetPreview({ spec }) {
  const px = spec.size === "3x3" ? 524 : spec.size === "2x2" ? 344 : 164;
  return (
    <div style={{ width: px, height: px, flexShrink: 0, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.widget, padding: SHELL_PADDING, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
      <Header title={spec.title} estimated={spec.real === false} />
      <GeneratedBody spec={spec} />
    </div>
  );
}

const eyebrow = { fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: T.gray500, fontFamily: font };

function WidgetSection({ built, subject, onChange }) {
  const { spec } = built;
  const types = pickerOptions(built, subject);
  // Which section of the widget is open in the editor (WidgetEditor.jsx); click a part of the preview to open it.
  const [focus, setFocus] = useState(null);
  return (
    <section style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <EditableWidget focus={focus} onFocus={setFocus}><WidgetPreview spec={spec} /></EditableWidget>
        <span style={{ fontSize: 11, color: T.gray400, textAlign: "center" }}>Click any part to edit it</span>
      </div>
      <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={eyebrow}>Show it as</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {types.map((o) => (
              <button
                key={o.id} onClick={() => !o.on && onChange(chooseKind(built, subject, o.id))}
                style={{ border: `1px solid ${o.on ? T.gray800 : T.gray100}`, background: o.on ? T.gray800 : T.white, color: o.on ? T.white : T.gray700, borderRadius: radius.full, padding: "5px 12px", fontSize: 13, fontFamily: font, cursor: "pointer", opacity: o.good || o.on ? 1 : 0.6 }}
                title={o.good ? "A good fit for this question" : "Available, though a weaker fit for this question"}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: T.gray500 }}>{spec.explanation}</p>
        </div>
        <WidgetOptions built={built} subject={subject} onChange={onChange} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={eyebrow}>Edit by section</span>
          <WidgetEditor built={built} onChange={onChange} focus={focus} setFocus={setFocus} />
        </div>
      </div>
    </section>
  );
}

/* ---- the Scope -------------------------------------------------------- */
function StoryFrame({ id, subject, built, index, count, onMove, onRemove, onOption, onAddAnother, lit }) {
  const [hover, setHover] = useState(false);
  const refined = useStoryStyle() === "refined";
  const def = storyById(id);
  const options = built.options?.[id];
  return (
    <motion.div
      layout="position" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={SPRING}
      tabIndex={0} aria-label={def.name}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false); }}
      id={storyDomId(id)}
      style={{ position: "relative", scrollMarginTop: 16, outline: lit ? `2px solid ${T.accent}` : "2px solid transparent", outlineOffset: 4, borderRadius: refined ? 24 : 0, transition: "outline-color 150ms ease" }}
    >
      <StoryToolbar visible={hover} storyKey={id} subject={subject} built={built} index={index} count={count} onMove={onMove} onRemove={onRemove} onOption={onOption} onAddAnother={onAddAnother} />
      <StoryMetaContext.Provider value={{ kind: def.family }}>{def.render(subject, { stories: built.stories, options, spec: built.spec })}</StoryMetaContext.Provider>
    </motion.div>
  );
}

export function AddStoryMenu({ subject, present, onAdd, trigger, again = [] }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({ open, onOpenChange: setOpen, placement: "bottom-end", middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })], whileElementsMounted: autoUpdate });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);
  const rest = STORIES.filter((s) => !hasStory(present, s.id) || again.includes(s.id));
  return (
    <>
      <span ref={refs.setReference} style={{ display: "inline-flex" }}>
        {trigger ? trigger({ onClick: () => setOpen((v) => !v), open }) : <Button theme="brand" variation="ghost" size="xs" iconLeft={<Plus size={20} />} onClick={() => setOpen((v) => !v)}>Add Story</Button>}
      </span>
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <div ref={refs.setFloating} {...getFloatingProps()} style={{ ...floatingStyles, zIndex: 100 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: "spring", bounce: 0, duration: 0.18 }}
                style={{ transformOrigin: "top right", width: 340, maxHeight: 420, overflowY: "auto", background: T.gray25, borderRadius: radius.lg, padding: 6, boxShadow: SHADOW, fontFamily: font }}
              >
                {rest.length === 0 && <div style={{ padding: 12, fontSize: 13, color: T.gray500 }}>Every Story is already in this Scope.</div>}
                {rest.map((s) => {
                  const why = s.blocked(subject);
                  return (
                    <button
                      key={s.id} disabled={!!why} onClick={() => { onAdd(s.id); setOpen(false); }}
                      onMouseEnter={(e) => { if (!why) e.currentTarget.style.background = T.gray75; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: why ? "not-allowed" : "pointer", padding: "8px 12px", borderRadius: radius.sm, fontFamily: font, display: "flex", flexDirection: "column", gap: 2, opacity: why ? 0.55 : 1 }}
                    >
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.gray900 }}>{s.name}{hasStory(present, s.id) ? " · another form" : ""}{s.sample ? <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: T.gray700, background: T.amberBg, borderRadius: radius.full, padding: "1px 6px" }}>{s.sample}</span> : null}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: T.gray400, whiteSpace: "nowrap" }}>{s.family}</span>
                      </span>
                      <span style={{ fontSize: 12, color: why ? T.redStrong : T.gray500 }}>{why || s.purpose}</span>
                    </button>
                  );
                })}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

function ScopeSection({ built, subject, onChange, onMove, onRemove, onAddStory, litId }) {
  const { stories } = built;
  const refined = useStoryStyle() === "refined";
  const layers = useLayerStack(built.prompt);
  // Opening a deeper layer brings the Scope's top into view; coming back
  // returns to where the page was.
  const sectionRef = useRef(null);
  const saved = useRef(0);
  const scroller = () => { let n = sectionRef.current?.parentElement; while (n && getComputedStyle(n).overflowY !== "auto") n = n.parentElement; return n; };
  const nav = { depth: layers.depth, open: (l) => { saved.current = scroller()?.scrollTop || 0; layers.push(l); } };
  useLayoutEffect(() => {
    const sc = scroller();
    if (!sc) return;
    if (layers.depth) sc.scrollTop += sectionRef.current.getBoundingClientRect().top - sc.getBoundingClientRect().top - 16;
    else sc.scrollTop = saved.current;
  }, [layers.depth]);
  return (
    <section ref={sectionRef} style={refined ? { display: "flex", flexDirection: "column" } : { background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.widget, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: refined ? "0 4px 12px" : "8px 12px 8px 24px", borderBottom: refined ? "none" : `1px solid ${T.gray50}`, minHeight: 44, boxSizing: "border-box" }}>
        {layers.layer ? (
          <Breadcrumb rootTitle={built.spec.title} layer={layers.layer} onBack={layers.pop} onRoot={layers.reset} />
        ) : (
          <span style={{ fontSize: 14, fontWeight: 700, color: T.gray700, fontFamily: font }}>Scope <span style={{ fontWeight: 400, color: T.gray500 }}>· {stories.length} {stories.length === 1 ? "Story" : "Stories"}</span></span>
        )}
        {!layers.layer && !refined && <AddStoryMenu subject={subject} present={stories} again={againIds(built, subject)} onAdd={onAddStory} />}
      </div>
      <ScopeNavContext.Provider value={nav}>
        <div style={{ padding: refined ? 0 : 24, display: "flex", flexDirection: "column", gap: refined ? 20 : 16, maxWidth: refined ? 904 : 808 + 48, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {layers.layer && <div style={refined ? { background: T.white, borderRadius: 24, padding: "28px 32px 32px", boxShadow: "0 1px 2px rgba(35,31,32,0.05), 0 8px 24px -12px rgba(35,31,32,0.14)" } : undefined}><LayerBody layer={layers.layer} /></div>}
          <div style={{ display: layers.depth ? "none" : "contents" }}>
            <PreviewFrame>
            <AnimatePresence initial={false}>
              {stories.map((id, i) => (
                <StoryFrame key={id} id={id} subject={subject} built={built} index={i} count={stories.length} onMove={onMove} onRemove={onRemove} onOption={(patch) => onChange({ ...built, options: { ...built.options, [id]: { ...built.options?.[id], ...patch } } })} onAddAnother={() => onAddStory(baseId(id))} lit={litId === id} />
              ))}
            </AnimatePresence>
            </PreviewFrame>
            {stories.length === 0 && <p style={{ margin: 0, padding: 24, textAlign: "center", fontSize: 14, color: T.gray500, fontFamily: font }}>This Scope is empty. Add a Story, or ask me for one.</p>}
          </div>
        </div>
      </ScopeNavContext.Provider>
    </section>
  );
}

/* ---- screen ----------------------------------------------------------- */
export default function WidgetBuilderV1({ state, setState, navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder, onAddToReport, version, onVersionChange, storyStyle, onStoryStyleChange }) {
  const { messages, built } = state;
  const [typing, setTyping] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const subject = built ? subjectFromPrompt(built.prompt) : null;

  const send = (text) => {
    const t = text.trim();
    if (!t) return;
    let result;
    if (built) result = refine(t, built);
    else {
      const b = buildWidget(t);
      result = b ? { built: b, reply: openingReply(b) } : { reply: noMatchReply() };
    }
    setState((s) => ({ messages: [...s.messages, { role: "user", text: t }], built: result.built ?? s.built }));
    setTyping(true);
    timer.current = setTimeout(() => {
      setTyping(false);
      setState((s) => ({ ...s, messages: [...s.messages, { role: "ai", ...result.reply }] }));
    }, 500);
  };
  const setBuilt = (b) => setState((s) => ({ ...s, built: b }));
  // Scope edits, shared by the Stories themselves and the "In this scope" rail (Refined view).
  const [litId, setLitId] = useState(null);
  const wrapRef = useRef(null);
  const wrapW = useWidth(wrapRef);
  const refinedView = storyStyle === "refined";
  const railBeside = refinedView && wrapW >= 1180;
  const moveStory = (id, d) => {
    if (!built) return;
    const stories = built.stories, i = stories.indexOf(id), j = i + d;
    if (j < 0 || j >= stories.length) return;
    const next = [...stories];
    [next[i], next[j]] = [next[j], next[i]];
    setBuilt({ ...built, stories: next });
  };
  const removeStory = (key) => setBuilt({ ...built, ...removeStoryKeys(built, key) });
  const addStory = (id) => { const placed = placeStory(built, subject, id); if (placed) setBuilt({ ...built, stories: placed.stories, options: placed.options }); };
  const outline = (inline) => (
    <ScopeOutline formOf={(k) => placementForm(built, subject, k)} reasons={built.reasons} inline={inline} stories={built.stories} litId={litId} setLitId={setLitId} onMove={moveStory} onRemove={removeStory} renderAdd={(trigger) => <AddStoryMenu subject={subject} present={built.stories} again={againIds(built, subject)} onAdd={addStory} trigger={trigger} />} />
  );

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, fontFamily: font }}>
      <NavRail active="generate" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: T.gray50 }}>
        <div style={{ height: 44, flexShrink: 0, background: T.white, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px 0 32px" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.gray700 }}>Widget Builder</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BuilderViewMenu built={built} storyStyle={storyStyle} onStoryStyleChange={onStoryStyleChange} version={version} onVersionChange={onVersionChange} />
          {built && (
            <>
              <Button theme="brand" variation="ghost" size="xs" onClick={() => setState({ messages: [], built: null })}>Start over</Button>
              <Button theme="accent" variation="primary" size="xs" onClick={() => onAddToReport({ spec: built.spec, scope: { prompt: built.prompt, stories: built.stories, options: built.options } })}>Add to Report</Button>
            </>
          )}
          </div>
        </div>
        {!built ? (
          <>
            <Welcome onSend={send} reply={!typing ? messages.filter((m) => m.role === "ai").pop() : null} />
          </>
        ) : (
          <div ref={wrapRef} style={{ flex: 1, minHeight: 0, display: "flex" }}>
            <ChatColumn messages={messages} typing={typing} onSend={send} />
            <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
              <div style={{ maxWidth: 904, margin: "0 auto", padding: "32px 32px 64px", display: "flex", flexDirection: "column", gap: 32, boxSizing: "border-box" }}>
                {subject && <WidgetSection built={built} subject={subject} onChange={setBuilt} />}
                {subject && refinedView && !railBeside && outline(true)}
                {subject && <ScopeSection built={built} subject={subject} onChange={setBuilt} onMove={moveStory} onRemove={removeStory} onAddStory={addStory} litId={litId} />}
              </div>
            </div>
            {subject && railBeside && <div style={{ width: RAIL_W, flexShrink: 0, overflowY: "auto", borderLeft: `1px solid ${T.gray75}`, background: T.gray50 }}>{outline(false)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
