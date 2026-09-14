import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown, Plus, ArrowRight, Mic } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { useChatThread } from "../../lib/useChatThread.js";
import { extractTopics } from "../../lib/topicResolver.js";
import { Header } from "../widgets/primitives.jsx";
import WidgetBody from "../widgets/WidgetBody.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import Bubble, { TypingDots } from "./Bubble.jsx";
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
export default function ChatPanel({ onClose, editingWidget, onAddWidget, onReplaceWidget, onCancelEdit, mainChat, reportGenerating, onGeneratingComplete }) {
  const scoped = !!editingWidget;
  const scopedChat = useChatThread(editingWidget?.name);
  useEffect(() => { if (scoped) scopedChat.reset(); }, [editingWidget?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = scoped ? scopedChat : mainChat;
  const { messages, send, updateVariantTitle, updateVariantSpec, regenerateVariant, createBlank, typing } = active;
  const [input, setInput] = useState("");
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
      animate={{ width: 436, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={DOCK_SPRING}
      style={{ flexShrink: 0, height: "100%", overflow: "hidden", borderRight: `1px solid ${T.gray75}`, boxShadow: "4px 0 24px rgba(0,0,0,0.08)" }}
    >
    <div style={{ width: 436, height: "100%", background: T.white, display: "flex", flexDirection: "column", fontFamily: font }}>
      <div style={{ padding: 12, borderBottom: `1px solid ${T.gray75}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button theme="brand" variation="ghost" size="xs" iconRight={<ChevronDown size={20} />}>
          {scoped ? `Editing ${editingWidget.name}` : "New Chat"}
        </Button>
        <Button theme="brand" variation="ghost" size="xs" iconLeft={<X size={18} />} onClick={() => { onClose(); if (scoped) onCancelEdit(); }} />
      </div>

      {scoped && (
        <div style={{ padding: "12px 16px 0" }}>
          <p style={{ fontSize: 10.5, fontWeight: 600, color: T.gray500, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Currently on canvas</p>
          <div style={{ width: 164, height: 164, border: `1px solid ${T.gray100}`, borderRadius: radius.widget, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, background: T.gray25 }}>
            <Header title={editingWidget.name} />
            {editingWidget.kind === "library" ? (
              <WidgetBody familyId={editingWidget.familyId} formIndex={editingWidget.formIndex} />
            ) : (
              <GeneratedBody spec={editingWidget.spec} />
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0", background: T.gray50, display: "flex", flexDirection: "column", gap: 20, justifyContent: messages.length ? "flex-start" : "flex-end" }}>
        <p style={{ fontSize: 12, color: T.gray500, textAlign: "center", margin: 0 }}>Today</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 && (
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                <Bubble>
                  <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{scoped ? "What should change?" : "Hi there. What can I help you with?"}</p>
                  <p style={{ margin: 0 }}>{scoped ? `Tell me what to change about ${editingWidget.name}.` : "Here are a few things I can do, or ask me anything."}</p>
                </Bubble>
              </div>
              {!scoped && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 36, marginTop: 10 }}>
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
                <Bubble mine>{m.text}</Bubble>
              </motion.div>
            ) : m.checklist ? (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <p style={{ fontSize: 13, color: T.gray700, margin: "0 0 6px" }}>Working...</p>
                  <GeneratingChecklist done={!reportGenerating} onComplete={onGeneratingComplete} />
                </div>
              </div>
            ) : (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MSG_SPRING}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                  <Bubble>{m.text}</Bubble>
                </div>
                {m.variants && (
                  <div style={{ paddingLeft: 36, marginTop: 10, display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 36, marginTop: 10 }}>
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
        </div>
        <div ref={endRef} />
      </div>

      <div style={{ padding: 16, background: T.gray50 }}>
        <div style={{ border: `1px solid ${T.gray100}`, borderRadius: radius.reportCard, background: T.white, boxShadow: COMPOSER_SHADOW, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <Button theme="brand" variation="ghost" size="xs" iconLeft={<Plus size={20} />} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="Type here..."
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: font, color: T.gray900 }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <Button theme="brand" variation="ghost" size="xs" iconLeft={<Mic size={20} />} />
            <Button theme="brand" variation="primary" size="xs" shape="round" iconLeft={<ArrowRight size={20} />} onClick={submit} />
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
