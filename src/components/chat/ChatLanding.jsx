import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowRight, Mic, ChevronDown, MoreHorizontal } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { matchAreas, AREAS } from "../../lib/topicAreas.js";
import { findScope, extractTopics } from "../../lib/topicResolver.js";
import { dimensionRankedRows } from "../../lib/dataset.js";
import NavRail from "../shell/NavRail.jsx";
import Bubble, { TypingDots } from "./Bubble.jsx";
import GeneratedWidgetPreview from "./GeneratedWidgetPreview.jsx";
import WidgetBuilderModal from "./WidgetBuilderModal.jsx";
import AttachMenu from "./AttachMenu.jsx";
import Button from "../ui/Button.jsx";
import mascotAvatar from "../../assets/mascot-avatar.svg";
import { QUICK_ACTIONS } from "./quickActions.js";

// Soft 5-layer shadow sampled off the reference composer's own "Dark Chat
// Input Bar" node (Z6YmEggwvoiX3j4d3kCKqV, 2031:8508) — much lighter than
// this app's card-level shadows elsewhere, deliberately barely visible.
const COMPOSER_SHADOW = "0 14px 2px rgba(0,0,0,0.01), 0 9px 2px rgba(0,0,0,0.01), 0 5px 1.5px rgba(0,0,0,0.02), 0 2px 1px rgba(0,0,0,0.03), 0 1px 0.5px rgba(0,0,0,0.04)";
// The shared `Button` "secondary" variation's border is dark (gray800,
// sampled off the OTHER Figma file's Buttons/Button component) — the chat-
// redesign reference's own pill chips use a much lighter gray100 border
// (docs/figma-chat-redesign-audit.md §1d/§2c). `Button` spreads a `style`
// override last, so this narrow fix (just the border) is applied wherever
// a Button is standing in as one of these outline chips, without touching
// the shared component's real button styling.
const CHIP_STYLE = { border: `1px solid ${T.gray100}` };
// New messages settle in rather than popping instantly — a critically
// damped spring (no overshoot), per Apple's own default for non-gesture UI.
const MSG_SPRING = { type: "spring", bounce: 0, duration: 0.3 };

// Today's actual weakest-scoring real dimensions, worst first — a live
// starting point instead of three fixed guesses, so the very first thing a
// user sees already reflects the current data rather than a static list.
function liveStarterChips() {
  return dimensionRankedRows().slice(-3).reverse().map(([name]) => name);
}

/* ================================================================== */
/* CHAT LANDING — the actual entry point of the product (per the real  */
/* reference, 984qJvMt7fCHASYHRwgrab node 12618:39773, "Chat 1/2/3"):   */
/* nav rail + a full-page, centered chat column. Not a drawer.         */
/*                                                                      */
/* Opens with a topic/driver SCOPING conversation (docs/mascot-        */
/* conversation-decision-tree.md, Node 1-2) before any widget can be    */
/* generated — per explicit product direction: this should read as a   */
/* real conversation clarifying scope, not jump straight to widgets.    */
/* Once scope is confirmed (or skipped), quick-action chips and         */
/* "Create Report" unlock and behave as before.                         */
/*                                                                      */
/* Uses the same `mainChat` thread (lib/useChatThread.js) that carries  */
/* straight into CanvasScreen's docked chat panel — this is one          */
/* continuous conversation, not a reset between screens.                */
/* ================================================================== */
export default function ChatLanding({ mainChat, scopeInfo, onAddWidgetDirect, onCreateReport, onScopeConfirmed, onBlankCanvas, navExpanded, onNavExpandedChange, onOpenSearch }) {
  const { messages, send, pushUser, pushAI, updateVariantTitle, updateVariantSpec, regenerateVariant, createBlank, typing } = mainChat;
  const [input, setInput] = useState("");
  const [starterChips] = useState(liveStarterChips);
  const [builderOpen, setBuilderOpen] = useState(null); // { msgIndex, variantIndex } | null — the Widget Builder modal
  const [scopingTyping, setScopingTyping] = useState(false);
  // Scoping runs once per session (see the architecture note below) — if
  // App.jsx already has a confirmed (or explicitly skipped) scope, e.g.
  // because the user navigated back to landing from the canvas after
  // already scoping, resume straight into "open" instead of re-running the
  // scoping conversation and misrouting the next prompt into it.
  const [phase, setPhase] = useState(scopeInfo ? "open" : "scoping");
  const [suggestedOn, setSuggestedOn] = useState([]);
  const [selection, setSelection] = useState(null); // { service, scope } from the composer's "+" Attach menu
  const [attachOpen, setAttachOpen] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const empty = messages.length === 0;

  // Unified scope shape used everywhere below: { label, matched, suggested, kind }.
  // Curated AREAS entries (hand-tuned adjacent-driver suggestions for common
  // phrasing) are tried first; anything they don't recognize falls through to
  // findScope() (lib/topicResolver.js), which scores the prompt against the
  // FULL real dimension/driver catalog and — per explicit product direction —
  // assembles a bespoke driver cluster with its own synthesized label when no
  // single real dimension fits either, rather than only ever offering the
  // curated starter areas.
  const toScope = (area) => ({ label: area.label, matched: area.matched, suggested: area.suggested, kind: "curated" });

  const afterBeat = (fn) => {
    setScopingTyping(true);
    setTimeout(() => { setScopingTyping(false); fn(); }, 450);
  };

  const presentScope = (scope) => {
    setSuggestedOn([]);
    const intro = scope.kind === "bespoke"
      ? `That's not one of the dimensions we track directly, but I pulled together a bespoke set of drivers that fits — call it "${scope.label}." I'd start with`
      : `Sounds like this is about ${scope.label.toLowerCase()}. I'd start by looking at`;
    pushAI({ text: `${intro} ${scope.matched.join(", ")}.`, stage: "confirm", scope });
  };

  const handleTopicInput = (text) => {
    pushUser(text);
    const matches = matchAreas(text);
    if (matches.length === 1) {
      afterBeat(() => presentScope(toScope(matches[0])));
    } else if (matches.length > 1) {
      afterBeat(() => {
        pushAI({ text: `A couple of areas could fit here — did you mean ${matches.map((a) => a.label).join(" or ")}?`, stage: "disambiguate", options: matches.map(toScope) });
      });
    } else {
      const resolved = findScope(text);
      if (resolved) {
        afterBeat(() => presentScope(resolved));
      } else {
        afterBeat(() => {
          pushAI({ text: "I couldn't quite place that one — here's what's closest to what you're describing:", stage: "fallback", options: AREAS.slice(0, 4).map(toScope) });
        });
      }
    }
  };

  const confirmScope = (scope) => {
    const drivers = [...scope.matched, ...suggestedOn];
    pushUser(`Include: ${drivers.join(", ")}`);
    afterBeat(() => {
      pushAI({ text: "Great, that gives me a solid base to work with. Ask me for a specific widget anytime, or just say the word and I'll put together the full report." });
      setPhase("open");
      onScopeConfirmed(scope.label, drivers);
    });
  };

  const skipScoping = () => {
    pushUser("Skip — just show me widgets");
    afterBeat(() => {
      pushAI({ text: "No problem — ask me for anything, or tell me when you want the full report." });
      setPhase("open");
      onScopeConfirmed(null, []);
    });
  };

  const submit = () => {
    if (!input.trim()) return;
    if (phase === "open") send(input);
    else handleTopicInput(input);
    setInput("");
  };

  return (
    <div style={{ height: "100%", display: "flex", fontFamily: font }}>
      <NavRail active="chat" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.gray50, overflow: "hidden" }}>
        {/* Thin white header strip — present on every chat frame in the
            reference (Z6YmEggwvoiX3j4d3kCKqV, node 2031:8498, "Header"),
            blank on the empty-state frame it was sampled from; once a
            conversation exists it carries the conversation's own title +
            a "..." menu, mirroring ChatPanel's own header treatment. */}
        <div style={{ height: 44, flexShrink: 0, background: T.white, borderBottom: `1px solid ${T.gray75}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", boxSizing: "border-box" }}>
          {!empty && (
            <>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scopeInfo?.areaLabel || "New chat"}</span>
              <MoreHorizontal size={18} color={T.gray500} />
            </>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" }}>
        <div style={{ width: 740, maxWidth: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: empty ? "center" : "flex-start", overflowY: "auto", padding: "0 24px" }}>
          {empty ? (
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <img src={mascotAvatar} width={50} height={50} alt="" style={{ marginBottom: 16 }} />
              <h1 style={{ fontSize: 30, fontWeight: 700, color: T.gray900, margin: 0 }}>Where would you like to start today?</h1>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "32px 0 16px" }}>
              <p style={{ fontSize: 12, color: T.gray500, textAlign: "center", margin: 0 }}>Today</p>
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                return m.role === "user" ? (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MSG_SPRING}>
                    <Bubble mine>{m.text}</Bubble>
                  </motion.div>
                ) : (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MSG_SPRING}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                      <Bubble>{m.text}</Bubble>
                    </div>

                    {m.stage === "confirm" && isLast && (
                      <div style={{ paddingLeft: 36, marginTop: 10 }}>
                        <ChipGroup chips={m.scope.matched} locked />
                        {m.scope.suggested.length > 0 && (
                          <>
                            <p style={{ fontSize: 11, color: T.gray500, margin: "10px 0 6px" }}>These could also be relevant — include?</p>
                            <ChipGroup chips={m.scope.suggested} selected={suggestedOn} onToggle={(d) => setSuggestedOn((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))} />
                          </>
                        )}
                        <div style={{ marginTop: 10 }}>
                          <Button theme="accent" size="xs" onClick={() => confirmScope(m.scope)}>Sounds good, let's go</Button>
                        </div>
                      </div>
                    )}

                    {(m.stage === "disambiguate" || m.stage === "fallback") && isLast && (
                      <div style={{ paddingLeft: 36, marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {m.options.map((opt, oi) => (
                          <Button key={oi} theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={() => presentScope(opt)}>{opt.label}</Button>
                        ))}
                        {m.stage === "fallback" && (
                          <Button theme="brand" variation="ghost" size="xs" onClick={skipScoping}>None of these — just show me widgets</Button>
                        )}
                      </div>
                    )}

                    {m.variants && (
                      <div style={{ paddingLeft: 36, marginTop: 10, display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
                        {m.variants.map((spec, vi) => (
                          <div key={vi} style={{ flexShrink: 0, width: 300 }}>
                            <GeneratedWidgetPreview
                              spec={spec}
                              topicCount={extractTopics(m.prompt || "").length}
                              onTitleChange={(newTitle) => updateVariantTitle(i, vi, newTitle)}
                              approveLabel="Add to Report"
                              onApprove={() => onAddWidgetDirect(spec)}
                              onRegenerate={() => regenerateVariant(i, vi)}
                              onChangeType={(vizType) => regenerateVariant(i, vi, vizType)}
                              onExpand={() => setBuilderOpen({ msgIndex: i, variantIndex: vi })}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {phase === "open" && isLast && !m.stage && (
                      <div style={{ paddingLeft: 36 }}>
                        <QuickActionRow onPick={send} onCreateReport={onCreateReport} onBuildWidget={createBlank} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {(typing || scopingTyping) && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <img src={mascotAvatar} width={28} height={28} alt="" style={{ flexShrink: 0 }} />
                  <TypingDots />
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          <div style={{ paddingBottom: 24 }}>
            {/* Two-layer composer — outer gray75/gray100 frame + inner white
                card — matching the reference's own node structure
                (Z6YmEggwvoiX3j4d3kCKqV, 2031:8507/8508): the outer frame's
                edges peek out below the white card as a footer strip once a
                Service/Scope selection exists (§1b), which is where those
                pills actually live, not inside the white card itself. Once
                a conversation has started, the reference's own in-thread
                composer (§2e) drops back to a single plain white bar with
                no pills — the outer frame collapses to transparent/no-
                padding here rather than duplicating a second JSX branch. */}
            <div style={empty ? { background: T.gray75, border: `1px solid ${T.gray100}`, borderRadius: 24, padding: 4, boxSizing: "border-box" } : { boxSizing: "border-box" }}>
              <div style={{ background: T.white, border: `1px solid ${T.gray100}`, borderRadius: 20, boxShadow: COMPOSER_SHADOW, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box" }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
                  placeholder={phase === "open" ? "Ask for a widget, or describe another concern..." : "Describe your goal, challenge, or idea..."}
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 16, fontFamily: font, color: T.gray900, boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <AttachMenu open={attachOpen} onOpenChange={setAttachOpen} onSelect={setSelection} />
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <Button theme="brand" variation="ghost" size="xs" iconLeft={<Mic size={20} />} />
                    <Button theme="brand" variation="primary" size="xs" shape="round" iconLeft={<ArrowRight size={20} />} onClick={submit} />
                  </div>
                </div>
              </div>
              {empty && selection && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px" }}>
                  <Button theme="brand" variation="ghost" size="xs" iconRight={<ChevronDown size={16} />} onClick={() => setAttachOpen(true)}>{selection.service}</Button>
                  {selection.scope && (
                    <>
                      <div style={{ width: 1, height: 20, background: T.gray200 }} />
                      <Button theme="brand" variation="ghost" size="xs" iconRight={<ChevronDown size={16} />} onClick={() => setAttachOpen(true)}>{selection.scope}</Button>
                    </>
                  )}
                </div>
              )}
            </div>
            {empty && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 14 }}>
                {starterChips.map((name) => (
                  <Button key={name} theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={() => handleTopicInput(name)}>{name}</Button>
                ))}
              </div>
            )}
            {empty && (
              <p style={{ textAlign: "center", marginTop: 20 }}>
                <button onClick={onBlankCanvas} style={{ border: "none", background: "transparent", color: T.gray400, fontSize: 12, fontFamily: font, cursor: "pointer", textDecoration: "underline" }}>
                  or start from a blank canvas
                </button>
              </p>
            )}
          </div>
        </div>
        </div>
      </div>

      <AnimatePresence>
        {builderOpen && (
          <WidgetBuilderModal
            key="widget-builder"
            variants={messages[builderOpen.msgIndex].variants}
            index={builderOpen.variantIndex}
            onIndexChange={(vi) => setBuilderOpen((b) => ({ ...b, variantIndex: vi }))}
            onClose={() => setBuilderOpen(null)}
            approveLabel="Add to Report"
            onApprove={(spec) => { onAddWidgetDirect(spec); setBuilderOpen(null); }}
            onRegenerate={(vi) => regenerateVariant(builderOpen.msgIndex, vi)}
            onChangeType={(vi, vizType) => regenerateVariant(builderOpen.msgIndex, vi, vizType)}
            onUpdateSpec={(vi, patch) => updateVariantSpec(builderOpen.msgIndex, vi, patch)}
            topicCount={extractTopics(messages[builderOpen.msgIndex].prompt || "").length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChipGroup({ chips, selected = [], onToggle, locked }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {chips.map((c) => {
        const isOn = locked || selected.includes(c);
        return (
          <button
            key={c}
            onClick={() => onToggle?.(c)}
            disabled={locked}
            style={{
              border: `1px solid ${isOn ? T.accent : T.gray100}`,
              background: isOn ? T.accentBg : T.white,
              color: isOn ? T.accent : T.gray900,
              borderRadius: 9999,
              padding: "6px 12px",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: locked ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: font,
            }}
          >
            {isOn && <Check size={11} />}{c}
          </button>
        );
      })}
    </div>
  );
}

function QuickActionRow({ onPick, onCreateReport, onBuildWidget }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {QUICK_ACTIONS.map((q) => (
        <Button key={q} theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={() => onPick(q)}>{q}</Button>
      ))}
      <Button theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={onBuildWidget}>Build a Widget</Button>
      <Button theme="brand" variation="secondary" size="xs" style={CHIP_STYLE} onClick={onCreateReport}>Create Report</Button>
    </div>
  );
}
