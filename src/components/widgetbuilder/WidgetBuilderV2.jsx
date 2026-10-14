import { useRef, useEffect, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, ArrowDown, ArrowRight, X, Plus, Hash, TrendingUp, CircleDot, BarChart3, ListOrdered, Radar, Smile, ScatterChart, Lightbulb, History, Users, BarChartHorizontal, Crosshair, ArrowUpDown, BarChart2, Flag, Scale, BookOpen, Target, Swords, ClipboardCheck, Sparkles, Grid3x3, Activity, Building2, GitCompare } from "lucide-react";
import { T, font, radius, band } from "../../lib/tokens.js";
import { subjectFromPrompt } from "../../lib/scopeSubject.js";
import { dimensionRankedRows } from "../../lib/dataset.js";
import NavRail from "../shell/NavRail.jsx";
import Button from "../ui/Button.jsx";
import Press from "../ui/Press.jsx";
import { Header } from "../widgets/primitives.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import { TypingDots } from "../chat/Bubble.jsx";
import mascot from "../../assets/mascot-avatar.svg";
import { buildWidget, refine, openingReply, noMatchReply, pickerOptions, chooseKind, caseIdeas } from "./builderEngine.js";
import WidgetOptions from "./WidgetOptions.jsx";
import ScopeOutline from "./ScopeOutline.jsx";
import { storyById, placeStory, removeStoryKeys, againIds, baseId, placementForm } from "./storyCatalog.jsx";
import StoryToolbar from "./StoryToolbar.jsx";
import { ScopeNavContext } from "../scope/scopeNav.js";
import { useLayerStack, LayerBody, Breadcrumb } from "../scope/layers.jsx";
import { RichText, AddStoryMenu } from "./WidgetBuilderV1.jsx";
import { WidgetBuilderVersions } from "./WidgetBuilderVersions.jsx";
import { StoryStyleToggle } from "./StoryStyleToggle.jsx";
import { PreviewWidthToggle, PreviewFrame } from "./PreviewWidth.jsx";
import { useStoryStyle, StoryMetaContext } from "../scope/stories/storyStyle.js";

/* ================================================================== */
/* WIDGET BUILDER — "Workbench" (v2). A redesign pass over the original,  */
/* done with the redesign-existing-projects audit. What the audit found    */
/* in v1, and what changed here (same flow, same engine, same data):       */
/*                                                                         */
/*  - A permanent 380px chat sidebar ate a third of the screen while the    */
/*    work (the widget, the Scope) sat in what was left.  -> the chat is     */
/*    now a command dock at the bottom: the latest reply + the composer, with */
/*    the full thread one click away. The work gets the width.              */
/*  - Cards inside cards: the Scope was a bordered white card holding        */
/*    bordered white Story cards.  -> the outer card is gone; Stories sit    */
/*    straight on the page, with space doing the grouping.                 */
/*  - Story controls (move / remove) only appeared on hover, so keyboard and  */
/*    touch users never saw them.  -> a persistent outline rail lists every   */
/*    Story with its controls; hovering a row lights up its Story.           */
/*  - Everything centred, a row of identical pills for chart type, ALL-CAPS    */
/*    eyebrows.  -> left-aligned editorial hierarchy, an icon strip that     */
/*    marks the best-fit charts, sentence case, an inline-editable title.     */
/*  - No loading or empty state beyond a typing dot.  -> an indeterminate      */
/*    progress hairline, shimmering placeholder lines while it "thinks", and  */
/*    a composed first screen that previews what you will get and starts from  */
/*    today's weakest Explorers (live data), not three fixed chips.           */
/*  - No press feedback, no visible focus.  -> springs + a 0.97 press, and a    */
/*    focus ring on everything (see `.wb2` in index.css).                     */
/* Kept as-is on purpose: IBM Plex Sans, the warm-grey tokens and the single   */
/* accent — they are the product's design system (Figma), not a default to      */
/* swap out. Shadows are tinted with the grey family instead of pure black.     */
/* ================================================================== */
const SPRING = { type: "spring", bounce: 0, duration: 0.3 };
const SHADOW = "0 1px 2px rgba(35,31,32,0.06), 0 12px 28px -12px rgba(35,31,32,0.2)";
const SHADOW_SOFT = "0 1px 2px rgba(35,31,32,0.05), 0 6px 16px -8px rgba(35,31,32,0.14)";
const LEFT_W = 340; // the outline + conversation column

const TYPE_ICONS = { score: Hash, gauge: CircleDot, status: Smile, history: TrendingUp, parts: ListOrdered, profile: Radar, people: Users, groups: BarChartHorizontal, focus: Crosshair, movers: ArrowUpDown, spread: BarChart2, goal: Flag, story: BookOpen, index: Target, team: Building2, versus: GitCompare, duel: Swords, check: ClipboardCheck, whatif: Sparkles, heat: Grid3x3, momentum: Activity, bar: Scale, scatter: ScatterChart, insight: Lightbulb };

/* Observe an element's width so the layout can drop the outline rail on narrow panes. */
function useWidth(ref) {
  const [w, setW] = useState(1200);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* The same send / refine logic as v1, on the shared builder session. */
function useBuilderChat(state, setState) {
  const { built } = state;
  const [typing, setTyping] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
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
  return { typing, send };
}

/* ---- the input -------------------------------------------------------- */
function CommandInput({ onSend, placeholder, autoFocus, large, flat }) {
  const [v, setV] = useState("");
  const submit = () => { if (v.trim()) { onSend(v); setV(""); } };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: flat ? T.gray50 : T.white, borderRadius: radius.xl, padding: large ? "10px 10px 10px 20px" : "6px 6px 6px 16px", boxShadow: flat ? "none" : SHADOW_SOFT }} className="wb2-field">
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

/* ---- first screen ------------------------------------------------------ */
/* Shape of the result, in grey — what you get back, so the empty page isn't empty. */
function GhostResult() {
  const bar = (w, h = 10) => <div className="wb2-skel" style={{ width: w, height: h, borderRadius: 6 }} />;
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 16, pointerEvents: "none", opacity: 0.9 }}>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ width: 164, height: 164, borderRadius: radius.widget, background: T.white, padding: 16, boxSizing: "border-box", boxShadow: SHADOW_SOFT, display: "flex", flexDirection: "column", gap: 14 }}>
          {bar(72, 8)}{bar(88, 44)}<div style={{ marginTop: "auto" }}>{bar(120, 8)}</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, paddingTop: 6 }}>{bar("70%", 14)}{bar("45%", 10)}{bar("60%", 10)}</div>
      </div>
      {[0, 1].map((i) => (
        <div key={i} style={{ background: T.white, borderRadius: radius.xl, padding: 20, boxShadow: SHADOW_SOFT, display: "flex", flexDirection: "column", gap: 12, opacity: i ? 0.55 : 1 }}>
          {bar("38%", 12)}{bar("92%", 8)}{bar("74%", 8)}
        </div>
      ))}
    </div>
  );
}

function Intro({ onSend, reply, typing }) {
  // Today's three weakest Explorers, worst first — the same signal the landing chat uses.
  const weakest = dimensionRankedRows().slice(-3).reverse();
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 48px 80px", display: "grid", gridTemplateColumns: "minmax(0, 520px) minmax(240px, 1fr)", gap: 72, alignItems: "start" }}>
        <div>
          <img src={mascot} width={40} height={40} alt="" />
          <h1 style={{ margin: "24px 0 12px", fontSize: 40, lineHeight: "44px", fontWeight: 600, letterSpacing: "-1px", color: T.gray900, textWrap: "balance" }}>Describe the widget you want.</h1>
          <p style={{ margin: "0 0 28px", fontSize: 16, lineHeight: "24px", color: T.gray600, maxWidth: "46ch", textWrap: "pretty" }}>
            Name a topic, a question or a goal. You get the widget back with a scope already drafted — then change either one.
          </p>
          <AnimatePresence>
            {reply && !typing && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SPRING} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <img src={mascot} width={24} height={24} alt="" style={{ flexShrink: 0, marginTop: 2 }} />
                <RichText text={reply.text} />
              </motion.div>
            )}
          </AnimatePresence>
          <CommandInput onSend={onSend} placeholder="For example, how is sleep affecting stress?" autoFocus large />

          <div style={{ marginTop: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500, marginBottom: 6 }}>Where to look first</div>
            <div role="list">
              {weakest.map(([name, value, trend]) => {
                const b = band(value);
                return (
                  <Press
                    key={name} role="listitem" onClick={() => onSend(`How is ${name} doing?`)}
                    className="wb2-row"
                    style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto auto 20px", alignItems: "center", gap: 16, border: "none", background: "transparent", textAlign: "left", padding: "14px 4px", borderBottom: `1px solid ${T.gray75}`, borderRadius: 0 }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 500, color: T.gray900 }}>{name}</span>
                    <span style={{ fontSize: 12, color: T.gray500, fontVariantNumeric: "tabular-nums" }}>{trend > 0 ? `up ${trend}` : trend < 0 ? `down ${-trend}` : "no change"} since last round</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: b.cs, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px" }}>{value}</span>
                    <ArrowRight size={16} color={T.gray400} />
                  </Press>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 36 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500, marginBottom: 12 }}>Or try a different kind of widget</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {caseIdeas().map((c) => (
                <Press key={c.label} onClick={() => onSend(c.prompt)} style={{ border: "none", background: T.white, color: T.gray800, boxShadow: SHADOW_SOFT, borderRadius: radius.full, padding: "8px 14px", fontSize: 13, fontWeight: 500 }}>{c.label}</Press>
              ))}
            </div>
          </div>
        </div>
        <div style={{ paddingTop: 8 }}><GhostResult /></div>
      </div>
    </div>
  );
}

/* ---- the stage: the widget, its title, its chart ----------------------- */
function WidgetCard({ spec }) {
  const px = spec.size === "3x3" ? 524 : spec.size === "2x2" ? 344 : 164;
  return (
    <div style={{ width: px, height: px, flexShrink: 0, background: T.white, borderRadius: radius.widget, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, boxShadow: SHADOW }}>
      <Header title={spec.title} estimated={spec.real === false} />
      <GeneratedBody spec={spec} />
    </div>
  );
}

function ChartPicker({ built, subject, thinking, onChange }) {
  const { spec } = built;
  const options = pickerOptions(built, subject);
  const current = options.find((o) => o.on);
  const fit = !!current?.good;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500 }}>Widget</div>
      <div role="radiogroup" aria-label="Widget type" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => {
          const Icon = TYPE_ICONS[o.id] || Hash;
          return (
            <Press
              key={o.id} role="radio" aria-checked={o.on} aria-label={o.label}
              title={`${o.label} — ${o.good ? "a good fit for this question" : "a weaker fit for this question"}`}
              onClick={() => !o.on && onChange(chooseKind(built, subject, o.id))}
              style={{ position: "relative", width: 56, height: 52, borderRadius: radius.lg, border: "none", background: o.on ? T.gray900 : T.white, color: o.on ? T.white : T.gray700, boxShadow: o.on ? "none" : SHADOW_SOFT, display: "flex", flexDirection: "column", gap: 3, alignItems: "center", justifyContent: "center", opacity: o.good || o.on ? 1 : 0.55, transition: "background 150ms ease, color 150ms ease, opacity 150ms ease", fontFamily: font }}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span style={{ fontSize: 10, fontWeight: 500, lineHeight: "12px" }}>{o.label}</span>
              {o.good && !o.on && <span aria-hidden="true" style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: T.accent }} />}
            </Press>
          );
        })}
      </div>
      <div style={{ fontSize: 13, color: T.gray500 }}>
        <b style={{ color: T.gray900, fontWeight: 600 }}>{current?.label}</b>{spec.size ? ` · ${spec.size.replace("x", "×")}` : ""} · {fit ? "a good fit for this question" : "a weaker fit — your call"}
      </div>
      <WidgetOptions built={built} subject={subject} onChange={onChange} />
      {thinking ? (
        <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
          <div className="wb2-skel" style={{ height: 10, width: "92%", borderRadius: 5 }} />
          <div className="wb2-skel" style={{ height: 10, width: "64%", borderRadius: 5 }} />
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", color: T.gray700, maxWidth: "52ch", textWrap: "pretty" }}>{spec.explanation}</p>
      )}
    </div>
  );
}

function Stage({ built, subject, thinking, onChange }) {
  const { spec } = built;
  const [title, setTitle] = useState(spec.title);
  useEffect(() => setTitle(spec.title), [spec.title]);
  const commit = () => { const t = title.trim(); if (t && t !== spec.title) onChange({ ...built, spec: { ...spec, title: t } }); else setTitle(spec.title); };
  return (
    <section style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 40, alignItems: "start" }}>
      <div className="wb2-dots" style={{ borderRadius: 28, background: T.gray25, padding: 36, display: "grid", placeItems: "center", minWidth: 260, minHeight: 260 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${spec.vizType}-${spec.form || ""}-${spec.size}`} initial={{ opacity: 0, scale: 0.97, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={SPRING}>
            <WidgetCard spec={spec} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28, minWidth: 0, paddingTop: 4 }}>
        <label style={{ display: "block" }}>
          <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Widget title</span>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
            className="wb2-title"
            style={{ width: "100%", boxSizing: "border-box", border: "none", background: "transparent", fontFamily: font, fontSize: title.length > 24 ? 24 : 30, lineHeight: "36px", fontWeight: 600, letterSpacing: "-0.6px", color: T.gray900, padding: "2px 8px", margin: "0 -8px", borderRadius: radius.md, textWrap: "balance" }}
          />
        </label>
        <ChartPicker built={built} subject={subject} thinking={thinking} onChange={onChange} />
      </div>
    </section>
  );
}

/* ---- the Scope ---------------------------------------------------------- */
function StoryBlock({ id, index, count, subject, built, onMove, onRemove, onOption, onAddAnother, lit }) {
  const [hover, setHover] = useState(false);
  const def = storyById(id);
  const options = built.options?.[id];
  const refined = useStoryStyle() === "refined";
  return (
    <motion.div
      id={`wb2-story-${id}`} layout="position" tabIndex={0} aria-label={def.name}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false); }}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
      transition={{ ...SPRING, delay: Math.min(index, 6) * 0.04 }}
      style={{ position: "relative", borderRadius: refined ? 24 : radius.widget + 4, outline: lit ? `2px solid ${T.accent}` : "2px solid transparent", outlineOffset: 4, transition: "outline-color 150ms ease", scrollMarginTop: 72 }}
    >
      <StoryToolbar visible={hover} storyKey={id} subject={subject} built={built} index={index} count={count} onMove={onMove} onRemove={onRemove} onOption={onOption} onAddAnother={onAddAnother} />
      <StoryMetaContext.Provider value={{ kind: def.family }}>{def.render(subject, { stories: built.stories, options, spec: built.spec })}</StoryMetaContext.Provider>
    </motion.div>
  );
}

function ScopeBlock({ built, subject, scrollRef, litId, onChange, onMove, onRemove, onAddStory }) {
  const { stories } = built;
  const refined = useStoryStyle() === "refined";
  const layers = useLayerStack(built.prompt);
  const blockRef = useRef(null);
  const saved = useRef(0);
  const nav = { depth: layers.depth, open: (l) => { saved.current = scrollRef.current?.scrollTop || 0; layers.push(l); } };
  // Opening a deeper layer (e.g. Actions) brings the Scope's top into view; coming back returns to where you were.
  useLayoutEffect(() => {
    const sc = scrollRef.current;
    if (!sc || !blockRef.current) return;
    if (layers.depth) sc.scrollTop += blockRef.current.getBoundingClientRect().top - sc.getBoundingClientRect().top - 72;
    else sc.scrollTop = saved.current;
  }, [layers.depth, scrollRef]);
  return (
    <section ref={blockRef} style={{ marginTop: 56 }} aria-label="Scope">
      <div style={{ position: "sticky", top: 0, zIndex: 4, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", margin: "0 0 12px", background: "linear-gradient(to bottom, rgba(249,248,247,1) 70%, rgba(249,248,247,0))", minHeight: 44, boxSizing: "border-box" }}>
        {layers.layer ? (
          <Breadcrumb rootTitle={built.spec.title} layer={layers.layer} onBack={layers.pop} onRoot={layers.reset} />
        ) : (
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px", color: T.gray900 }}>Scope <span style={{ fontSize: 14, fontWeight: 400, color: T.gray500, letterSpacing: 0 }}>· {stories.length} {stories.length === 1 ? "story" : "stories"}</span></h2>
        )}
      </div>
      <ScopeNavContext.Provider value={nav}>
        <div style={{ display: "flex", flexDirection: "column", gap: refined ? 20 : 24 }}>
          {layers.layer && <div style={refined ? { background: T.white, borderRadius: 24, padding: "28px 32px 32px", boxShadow: "0 1px 2px rgba(35,31,32,0.05), 0 8px 24px -12px rgba(35,31,32,0.14)" } : undefined}><LayerBody layer={layers.layer} /></div>}
          <div style={{ display: layers.depth ? "none" : "contents" }}>
            <PreviewFrame>
            <AnimatePresence initial={false}>
              {stories.map((id, i) => <StoryBlock key={id} id={id} index={i} count={stories.length} subject={subject} built={built} onMove={onMove} onRemove={onRemove} onOption={(patch) => onChange({ ...built, options: { ...built.options, [id]: { ...built.options?.[id], ...patch } } })} onAddAnother={() => onAddStory(baseId(id))} lit={litId === id} />)}
            </AnimatePresence>
            </PreviewFrame>
            {stories.length === 0 && (
              <p style={{ margin: 0, padding: "40px 0", fontSize: 15, color: T.gray500, textAlign: "left" }}>This scope is empty. Add a story from the list, or ask for one below.</p>
            )}
          </div>
        </div>
      </ScopeNavContext.Provider>
    </section>
  );
}

/* ---- the conversation, docked under the outline (wide layout) ------------- */
function Conversation({ messages, typing, onSend }) {
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length, typing]);
  const lastAi = [...messages].map((m, i) => ({ m, i })).reverse().find((x) => x.m.role === "ai")?.i;
  return (
    <div style={{ flex: 1, minHeight: 180, display: "flex", flexDirection: "column", borderTop: `1px solid ${T.gray75}` }}>
      <div role="log" aria-label="Conversation" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            {m.role === "ai" && <img src={mascot} width={22} height={22} alt="" style={{ flexShrink: 0, marginTop: 2 }} />}
            {m.role === "user"
              ? <div style={{ maxWidth: 230, background: T.white, boxShadow: SHADOW_SOFT, borderRadius: radius.lg, padding: "8px 12px", fontSize: 13, lineHeight: "19px", color: T.gray900 }}>{m.text}</div>
              : (
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13 }}><RichText text={m.text} /></div>
                  {i === lastAi && !typing && m.chips && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {m.chips.map((c) => {
                        const label = typeof c === "string" ? c : c.label, prompt = typeof c === "string" ? c : c.prompt;
                        return <Press key={label} onClick={() => onSend(prompt)} className="wb2-link" style={{ border: "none", background: T.white, boxShadow: SHADOW_SOFT, borderRadius: radius.md, padding: "5px 10px", fontSize: 12, color: T.gray800 }}>{label}</Press>;
                      })}
                    </div>
                  )}
                </div>
              )}
          </div>
        ))}
        {typing && <div style={{ display: "flex", gap: 8 }}><img src={mascot} width={22} height={22} alt="" style={{ flexShrink: 0 }} /><TypingDots /></div>}
        <div ref={end} />
      </div>
      <div style={{ padding: "8px 12px 14px" }}>
        <CommandInput onSend={onSend} placeholder="Ask for a change…" />
      </div>
    </div>
  );
}

/* ---- the command dock (narrow layout) ------------------------------------- */
function Dock({ messages, typing, onSend, left, rightInset }) {
  const [open, setOpen] = useState(false);
  const latest = [...messages].reverse().find((m) => m.role === "ai");
  const lead = latest ? latest.text.split("\n\n")[0] : null;
  const end = useRef(null);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: "end" }); }, [open, messages.length]);
  return (
    <div style={{ position: "absolute", left, right: rightInset, bottom: 0, padding: "40px 40px 24px 48px", background: "linear-gradient(to bottom, rgba(249,248,247,0), rgba(249,248,247,0.96) 45%)", pointerEvents: "none" }}>
      <div style={{ maxWidth: 760, pointerEvents: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={SPRING} style={{ background: T.white, borderRadius: radius.xl, boxShadow: SHADOW, maxHeight: 340, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }} role="log" aria-label="Conversation">
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                  {m.role === "ai" && <img src={mascot} width={22} height={22} alt="" style={{ flexShrink: 0, marginTop: 2 }} />}
                  {m.role === "user"
                    ? <div style={{ maxWidth: 360, background: T.gray50, borderRadius: radius.lg, padding: "8px 12px", fontSize: 14, lineHeight: "20px", color: T.gray900 }}>{m.text}</div>
                    : <div style={{ maxWidth: 520 }}><RichText text={m.text} /></div>}
                </div>
              ))}
              <div ref={end} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ background: T.white, borderRadius: radius.xl + 4, boxShadow: SHADOW, padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {(lead || typing) && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 8px 0" }}>
            <img src={mascot} width={22} height={22} alt="" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {typing ? <TypingDots /> : (
                <>
                  <div style={{ maxHeight: 44, overflow: "hidden" }}><RichText text={lead} /></div>
                  {latest?.chips && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {latest.chips.map((c) => {
                        const label = typeof c === "string" ? c : c.label, prompt = typeof c === "string" ? c : c.prompt;
                        return <Press key={label} onClick={() => onSend(prompt)} className="wb2-link" style={{ border: "none", background: T.white, boxShadow: SHADOW_SOFT, borderRadius: radius.md, padding: "5px 10px", fontSize: 13, color: T.gray800 }}>{label}</Press>;
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
            <Press onClick={() => setOpen((v) => !v)} aria-expanded={open} className="wb2-link" style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: T.gray500, fontSize: 12, fontWeight: 600, padding: "4px 6px", borderRadius: radius.sm, flexShrink: 0 }}>
              <History size={14} />{open ? "Hide" : "History"}
            </Press>
          </div>
        )}
        <CommandInput onSend={onSend} flat placeholder="Ask for a change — “add actions”, “make it a ring”…" />
        </div>
      </div>
    </div>
  );
}

/* ---- screen -------------------------------------------------------------- */
export default function WidgetBuilderV2({ state, setState, navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder, onAddToReport, version, onVersionChange, storyStyle, onStoryStyleChange }) {
  const { messages, built } = state;
  const { typing, send } = useBuilderChat(state, setState);
  const subject = built ? subjectFromPrompt(built.prompt) : null;
  const setBuilt = (b) => setState((s) => ({ ...s, built: b }));
  const [litId, setLitId] = useState(null);
  const wrapRef = useRef(null), scrollRef = useRef(null);
  const width = useWidth(wrapRef);
  const wide = width >= 1060;

  const move = (id, d) => {
    const { stories } = built;
    const i = stories.indexOf(id), j = i + d;
    if (j < 0 || j >= stories.length) return;
    const next = [...stories];
    [next[i], next[j]] = [next[j], next[i]];
    setBuilt({ ...built, stories: next });
  };
  const remove = (key) => setBuilt({ ...built, ...removeStoryKeys(built, key) });
  const add = (id) => { const placed = placeStory(built, subject, id); if (placed) setBuilt({ ...built, stories: placed.stories, options: placed.options }); };

  return (
    <div className="wb2" style={{ display: "flex", flex: 1, minHeight: 0, fontFamily: font }}>
      <NavRail active="generate" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: T.gray25, position: "relative" }}>
        <div style={{ height: 44, flexShrink: 0, background: T.white, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px 0 32px", position: "relative" }}>
          <h1 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.gray700 }}>Widget builder</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {built && <PreviewWidthToggle />}
            {built && <StoryStyleToggle value={storyStyle} onChange={onStoryStyleChange} />}
            <WidgetBuilderVersions value={version} onChange={onVersionChange} />
            {built && (
              <>
                <Button theme="brand" variation="ghost" size="xs" onClick={() => setState({ messages: [], built: null })}>Start over</Button>
                <Button theme="accent" variation="primary" size="xs" onClick={() => onAddToReport({ spec: built.spec, scope: { prompt: built.prompt, stories: built.stories, options: built.options } })}>Add to report</Button>
              </>
            )}
          </div>
          {typing && (
            <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, overflow: "hidden" }}>
              <div className="wb2-load" style={{ width: "30%", height: 2, background: T.accent }} />
            </div>
          )}
        </div>

        {!built || !subject ? (
          <Intro onSend={send} reply={messages.filter((m) => m.role === "ai").pop()} typing={typing} />
        ) : (
          <div ref={wrapRef} style={{ flex: 1, minHeight: 0, position: "relative", display: "flex" }}>
            {wide && (
              <aside aria-label="Scope and conversation" style={{ width: LEFT_W, flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0, borderRight: `1px solid ${T.gray75}`, background: T.gray25 }}>
                <div style={{ flex: "0 1 auto", maxHeight: "52%", minHeight: 120, overflowY: "auto" }}>
                  <ScopeOutline formOf={(k) => placementForm(built, subject, k)} reasons={built.reasons} panel stories={built.stories} litId={litId} setLitId={setLitId} onMove={move} onRemove={remove} renderAdd={(trigger) => <AddStoryMenu subject={subject} present={built.stories} again={againIds(built, subject)} onAdd={add} trigger={trigger} />} />
                </div>
                <Conversation messages={messages} typing={typing} onSend={send} />
              </aside>
            )}
            <div ref={scrollRef} style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
              <div style={{ maxWidth: 944, padding: wide ? "40px 48px 64px 40px" : "40px 40px 240px 48px", boxSizing: "border-box" }}>
                <Stage built={built} subject={subject} thinking={typing} onChange={setBuilt} />
                {!wide && <ScopeOutline formOf={(k) => placementForm(built, subject, k)} reasons={built.reasons} inline stories={built.stories} litId={litId} setLitId={setLitId} onMove={move} onRemove={remove} renderAdd={(trigger) => <AddStoryMenu subject={subject} present={built.stories} again={againIds(built, subject)} onAdd={add} trigger={trigger} />} />}
                <ScopeBlock built={built} subject={subject} scrollRef={scrollRef} litId={litId} onChange={setBuilt} onMove={move} onRemove={remove} onAddStory={add} />
              </div>
            </div>
            {!wide && <Dock messages={messages} typing={typing} onSend={send} left={0} rightInset={0} />}
          </div>
        )}
      </main>
    </div>
  );
}
