import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Plus, ArrowRight, Mic, SquarePen, Maximize2, Minimize2, Minus } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { useChatThread } from "../../lib/useChatThread.js";
import { extractTopics } from "../../lib/topicResolver.js";
import { Header } from "../widgets/primitives.jsx";
import WidgetBody from "../widgets/WidgetBody.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import { TypingDots } from "./Bubble.jsx";
import GeneratedWidgetPreview from "./GeneratedWidgetPreview.jsx";
import WidgetBuilderModal from "./WidgetBuilderModal.jsx";
import GeneratingChecklist from "./GeneratingChecklist.jsx";
import Button from "../ui/Button.jsx";
import mascotAvatar from "../../assets/mascot-avatar.svg";
import { QUICK_ACTIONS } from "./quickActions.js";

// Same soft composer shadow and light chip-border fix as ChatLanding.jsx —
// see that file's header comment for where these values came from.
const COMPOSER_SHADOW = "0 14px 2px rgba(0,0,0,0.01), 0 9px 2px rgba(0,0,0,0.01), 0 5px 1.5px rgba(0,0,0,0.02), 0 2px 1px rgba(0,0,0,0.03), 0 1px 0.5px rgba(0,0,0,0.04)";
const CHIP_STYLE = { border: `1px solid ${T.gray100}` };
// Same critically damped message-entrance spring as ChatLanding.jsx.
const MSG_SPRING = { type: "spring", bounce: 0, duration: 0.3 };
// Structural dock-open/close move — same critically damped spring NavRail.jsx
// already uses for its own width collapse/expand, for a consistent feel.
const DOCK_SPRING = { type: "spring", bounce: 0, duration: 0.35 };

/* ================================================================== */
/* CHAT PANEL — the canvas's docked chat panel. Renders `mainChat`      */
/* (the same continuous thread from ChatLanding) when unscoped, or its  */
/* own ephemeral per-widget thread when editing a specific widget       */
/* (resets on `editingWidget.id` change — scoped edit threads are       */
/* intentionally not part of the main conversation).                    */
/*                                                                      */
/* Docks to the LEFT of the canvas, in-flow (a flex sibling, not a      */
/* `position: fixed` overlay) — per the "side-modal" state in the newer */
/* chat-redesign reference (Z6YmEggwvoiX3j4d3kCKqV, node 2032:12681),   */
/* which docks opposite the app's original right-docked drawer. Fixed   */
/* positioning would have needed to account for NavRail's own dynamic   */
/* collapsed/expanded width to avoid overlapping it; an in-flow flex    */
/* sibling (the same pattern LibraryPanel already uses) sidesteps that   */
/* entirely, at the cost of the old slide-in transition — CanvasScreen   */
/* now mounts/unmounts this panel directly instead of animating an      */
/* `open` prop, matching LibraryPanel's own conditional-render pattern.  */
/* Width (436px) matches that reference's side-modal frame. The header's */
/* own rename/scale/minus icon cluster (edit-05/scale-01/minus) was NOT   */
/* ported — those icons imply a rename action, a dock-to-floating toggle, */
/* and a minimize state, none of which exist in this app yet (there is    */
/* no floating-chat variant, no per-conversation rename). Adding the      */
/* icons without real behavior behind them would be exactly the kind of   */
/* decorative-but-dead control this project avoids — see CLAUDE.md.       */
/*                                                                      */
/* A message with `checklist: true` (pushed by CanvasScreen while a      */
/* report is generating) renders the inline `GeneratingChecklist`        */
/* instead of a text bubble — see CLAUDE.md for why this replaced the    */
/* old separate full-screen `GeneratingScreen` route.                    */
/* ================================================================== */
/* RESTYLED against Figma node 14463:12084 ("Chat / Thread"): a #f9f8f7 sheet    */
/* with rounded RIGHT corners and a soft right-hand shadow, sitting under the   */
/* report's full-width top bar (inset 8px) — the mirror image of the Scope      */
/* pane. 44px white header ("New Chat" menu; new-chat / expand / minimize),     */
/* plain-text AI turns beside a 28px mascot, white user bubbles, an optional     */
/* "service | scope" tag on the first user message, and a pill composer.         */
/* The header icons now have real behavior: new chat clears the thread, expand   */
/* fills the area (content capped at 792px, as in the frame), minimize closes.   */
const MAX_CONTENT_W = 792;
const PANEL_SHADOW = "31px 0 9px rgba(0,0,0,0.01), 20px 0 8px rgba(0,0,0,0.01), 11px 0 7px rgba(0,0,0,0.02), 5px 0 5px rgba(0,0,0,0.03), 1px 0 3px rgba(0,0,0,0.04)";
const BUBBLE_SHADOW = "0 14px 2px rgba(0,0,0,0.01), 0 9px 2px rgba(0,0,0,0.01), 0 5px 1.5px rgba(0,0,0,0.02), 0 2px 1px rgba(0,0,0,0.03), 0 1px 0.5px rgba(0,0,0,0.04)";
const formatStamp = (d) => d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

function AiText({ children }) {
  const paras = String(children).split(/\n\n+/);
  return (
    <div style={{ flex: 1, minWidth: 0, paddingLeft: 4, fontSize: 13, lineHeight: "18px", color: T.gray700 }}>
      {paras.map((t, i) => (
        <p key={i} style={{ margin: i === paras.length - 1 ? 0 : "0 0 12px", fontWeight: i === paras.length - 1 && paras.length > 1 && t.trim().endsWith("?") ? 700 : 400 }}>{t}</p>
      ))}
    </div>
  );
}

function UserBubble({ children, tag }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: "min(320px, 100%)", boxSizing: "border-box", background: T.white, borderRadius: radius.widget, padding: 12, display: "flex", flexDirection: "column", gap: 8, boxShadow: BUBBLE_SHADOW, fontSize: 13, lineHeight: "18px", color: T.gray900 }}>
        {tag && <span style={{ alignSelf: "flex-start", background: T.gray50, border: `1px solid ${T.gray200}`, borderRadius: radius.full, padding: "2px 6px", fontSize: 12, lineHeight: "16px", color: T.gray700 }}>{tag}</span>}
        <span>{children}</span>
      </div>
    </div>
  );
}

export default function ChatPanel({ onClose, editingWidget, onAddWidget, onReplaceWidget, onCancelEdit, mainChat, reportGenerating, onGeneratingComplete, width = 436, inset = false, expanded = false, onToggleExpand, contextTag }) {
  const scoped = !!editingWidget;
  const scopedChat = useChatThread(editingWidget?.name);
  useEffect(() => { if (scoped) scopedChat.reset(); }, [editingWidget?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = scoped ? scopedChat : mainChat;
  const { messages, send, updateVariantTitle, updateVariantSpec, regenerateVariant, createBlank, typing } = active;
  const [input, setInput] = useState("");
  const [startedAt] = useState(() => new Date());
  const [builderOpen, setBuilderOpen] = useState(null); // { msgIndex, variantIndex } | null — the Widget Builder modal

  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const submit = () => { if (input.trim()) { send(input); setInput(""); } };

  return (
    <>
    {/* Outer element animates WIDTH (0 -> 436) on mount/unmount so docking
        open/closed reads as a real panel sliding into place, not an instant
        pop — matching NavRail's own collapse/expand treatment. The inner div
        stays a fixed 436px so its content never reflows/squishes mid-animation;
        it's simply revealed as the outer clip region grows (`overflow: hidden`). */}
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={DOCK_SPRING}
      style={{ flexShrink: 0, alignSelf: "stretch", marginTop: inset ? 8 : 0, overflow: "hidden", borderTopRightRadius: radius.widget, borderBottomRightRadius: radius.widget, boxShadow: PANEL_SHADOW, position: "relative", zIndex: 2 }}
    >
    <div style={{ width, height: "100%", background: T.gray25, display: "flex", flexDirection: "column", fontFamily: font }}>
      <div style={{ height: 44, flexShrink: 0, background: T.white, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px 0 32px" }}>
        <Button theme="brand" variation="ghost" size="xs" iconRight={<ChevronDown size={20} />}>
          {scoped ? `Editing ${editingWidget.name}` : "New Chat"}
        </Button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button theme="brand" variation="ghost" size="xs" iconLeft={<SquarePen size={20} />} onClick={() => active.reset()} title="New chat" style={{ width: 28, padding: 0 }} />
          <Button theme="brand" variation="ghost" size="xs" iconLeft={expanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />} onClick={onToggleExpand} title={expanded ? "Back to report" : "Expand"} style={{ width: 28, padding: 0 }} />
          <Button theme="brand" variation="ghost" size="xs" iconLeft={<Minus size={20} />} onClick={() => { onClose(); if (scoped) onCancelEdit(); }} title="Minimize" style={{ width: 28, padding: 0 }} />
        </div>
      </div>

      {scoped && (
        <div style={{ padding: "12px 16px 0" }}>
          <p style={{ fontSize: 10.5, fontWeight: 600, color: T.gray500, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Currently on canvas</p>
          <div style={{ width: 164, height: 164, border: `1px solid ${T.gray100}`, borderRadius: radius.widget, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, background: T.white }}>
            <Header title={editingWidget.name} />
            {editingWidget.kind === "library" ? (
              <WidgetBody familyId={editingWidget.familyId} formIndex={editingWidget.formIndex} />
            ) : (
              <GeneratedBody spec={editingWidget.spec} />
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0", display: "flex", flexDirection: "column", justifyContent: messages.length ? "flex-start" : "flex-end" }}>
          <div style={{ width: "100%", maxWidth: MAX_CONTENT_W, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32, flexShrink: 0 }}>
            <p style={{ fontSize: 12, lineHeight: "16px", color: T.gray300, textAlign: "center", margin: 0 }}>{formatStamp(startedAt)}</p>

            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                  <AiText>{scoped ? `What should change?\n\nTell me what to change about ${editingWidget.name}.` : "Hi there, What can I help you with?\n\nHere are a few things I can do, or ask me anything"}</AiText>
                </div>
                {!scoped && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 36 }}>
                    {QUICK_ACTIONS.map((q) => (
                      <Button key={q} theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={() => send(q)}>{q}</Button>
                    ))}
                    <Button theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={createBlank}>Build a Widget</Button>
                  </div>
                )}
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MSG_SPRING}>
                  <UserBubble tag={i === messages.findIndex((x) => x.role === "user") ? contextTag : undefined}>{m.text}</UserBubble>
                </motion.div>
              ) : m.checklist ? (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, paddingTop: 6, paddingLeft: 4 }}>
                    <p style={{ fontSize: 13, color: T.gray700, margin: "0 0 6px" }}>Working...</p>
                    <GeneratingChecklist done={!reportGenerating} onComplete={onGeneratingComplete} />
                  </div>
                </div>
              ) : (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MSG_SPRING} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                    <AiText>{m.text}</AiText>
                  </div>
                  {m.variants && (
                    <div style={{ paddingLeft: 36, display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
                      {m.variants.map((spec, vi) => (
                        <div key={vi} style={{ flexShrink: 0, width: 280 }}>
                          <GeneratedWidgetPreview
                            spec={spec}
                            topicCount={extractTopics(m.prompt || "").length}
                            onTitleChange={(newTitle) => updateVariantTitle(i, vi, newTitle)}
                            approveLabel={scoped ? "Replace" : "Add to Report"}
                            onApprove={() => (scoped ? onReplaceWidget(editingWidget.id, spec) : onAddWidget(spec))}
                            onRegenerate={() => regenerateVariant(i, vi)}
                            onChangeType={(vizType) => regenerateVariant(i, vi, vizType)}
                            onExpand={() => setBuilderOpen({ msgIndex: i, variantIndex: vi })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {!scoped && !m.stage && i === messages.length - 1 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 36 }}>
                      {QUICK_ACTIONS.map((q) => (
                        <Button key={q} theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={() => send(q)}>{q}</Button>
                      ))}
                      <Button theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={createBlank}>Build a Widget</Button>
                    </div>
                  )}
                </motion.div>
              )
            )}
            {typing && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                <TypingDots />
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, pointerEvents: "none", background: `linear-gradient(${T.gray25}, ${T.gray25}00)` }} />
      </div>

      <div style={{ padding: "20px 16px 16px", width: "100%", maxWidth: MAX_CONTENT_W + 32, margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ border: `1px solid ${T.gray100}`, borderRadius: radius.full, background: T.white, padding: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <Button theme="brand" variation="ghost" size="xs" iconLeft={<Plus size={20} />} style={{ width: 28, padding: 0 }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="Type here..."
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: font, color: T.gray900 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Button theme="brand" variation="ghost" size="xs" iconLeft={<Mic size={20} />} style={{ width: 28, padding: 0 }} />
            <Button theme="brand" variation="primary" size="xs" shape="round" iconLeft={<ArrowRight size={20} />} onClick={submit} style={{ width: 28, padding: 0 }} />
          </div>
        </div>
      </div>
    </div>
    </motion.div>

      {/* Rendered outside the dock's own width-animating/overflow:hidden
          wrapper above — this is `position: fixed` and must never risk being
          clipped by an animating ancestor. */}
      <AnimatePresence>
        {builderOpen && (
          <WidgetBuilderModal
            key="widget-builder"
            variants={messages[builderOpen.msgIndex].variants}
            index={builderOpen.variantIndex}
            onIndexChange={(vi) => setBuilderOpen((b) => ({ ...b, variantIndex: vi }))}
            onClose={() => setBuilderOpen(null)}
            approveLabel={scoped ? "Replace" : "Add to Report"}
            onApprove={(spec) => { (scoped ? onReplaceWidget(editingWidget.id, spec) : onAddWidget(spec)); setBuilderOpen(null); }}
            onRegenerate={(vi) => regenerateVariant(builderOpen.msgIndex, vi)}
            onChangeType={(vi, vizType) => regenerateVariant(builderOpen.msgIndex, vi, vizType)}
            onUpdateSpec={(vi, patch) => updateVariantSpec(builderOpen.msgIndex, vi, patch)}
            topicCount={extractTopics(messages[builderOpen.msgIndex].prompt || "").length}
          />
        )}
      </AnimatePresence>
    </>
  );
}
