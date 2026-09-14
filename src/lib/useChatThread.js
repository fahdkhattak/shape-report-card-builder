import { useState } from "react";
import { generateVariants, buildSpec } from "./generativeEngine.js";
import { extractTopics } from "./topicResolver.js";

/* ================================================================== */
/* SHARED CHAT THREAD — one send/messages/updateVariantTitle contract  */
/* used everywhere a conversation happens: the full-page chat landing, */
/* the docked panel during generation, the canvas drawer's main        */
/* thread, and (a second, independent instance of) a per-widget        */
/* scoped edit thread inside ChatPanel.                                 */
/*                                                                      */
/* Lifting this out is what lets the SAME conversation carry from the   */
/* landing screen through generation into the canvas's chat drawer —    */
/* per the product spec, it's one continuous thread, not three resets.  */
/*                                                                      */
/* `pushUser`/`pushAI` are exposed alongside `send` so callers that need */
/* custom, non-widget-generating turns (the opening topic/driver         */
/* scoping conversation in ChatLanding — chips and clarifying questions, */
/* no widget cards) can still write into the same thread/array.          */
/*                                                                      */
/* `typing` is a small "is the mascot thinking right now" flag — send()  */
/* now resolves after a short delay (instead of instantly) so a visible  */
/* typing-dots beat replaces what used to be a silent, instant pop-in.   */
/* ================================================================== */
export function useChatThread(scopedName) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  const pushUser = (text) => setMessages((m) => [...m, { role: "user", text }]);
  const pushAI = (msg) => setMessages((m) => [...m, { role: "ai", ...msg }]);

  const send = (text) => {
    const val = text?.trim();
    if (!val) return;
    pushUser(val);
    setTyping(true);
    setTimeout(() => {
      const variants = generateVariants(val);
      pushAI({ text: scopedName ? `Here's a new version of ${scopedName}.` : "Here's what I came up with — pick one, or ask me to try again.", variants, prompt: val });
      setTyping(false);
    }, 450);
  };

  const updateVariantTitle = (msgIndex, variantIndex, newTitle) => {
    setMessages((m) =>
      m.map((msg, i) => (i !== msgIndex ? msg : { ...msg, variants: msg.variants.map((v, vi) => (vi !== variantIndex ? v : { ...v, title: newTitle })) }))
    );
  };

  // General-purpose manual edit for the Widget Builder modal — merges a
  // partial spec (title/explanation/vizType/etc.) into one variant, and
  // shallow-merges `patch.payload` into the existing payload so an edit to
  // one field (e.g. just `value`) doesn't wipe out the rest of the payload.
  // Unlike `regenerateVariant`, this never touches the engine — it's a
  // direct, manual override that stands until the user regenerates again.
  const updateVariantSpec = (msgIndex, variantIndex, patch) => {
    setMessages((m) =>
      m.map((msg, i) =>
        i !== msgIndex
          ? msg
          : {
              ...msg,
              variants: msg.variants.map((v, vi) =>
                vi !== variantIndex ? v : { ...v, ...patch, payload: patch.payload ? { ...v.payload, ...patch.payload } : v.payload }
              ),
            }
      )
    );
  };

  // "Build a widget from scratch" — pushes a normal AI turn with a single
  // blank variant, so it flows through the exact same message/variants
  // rendering (and the same Widget Builder modal) as any real generated
  // response, rather than a special-cased local-only state.
  const createBlank = () => {
    pushAI({
      text: "Here's a blank widget — open it to build it from scratch.",
      variants: [{ vizType: "metric", size: "1x1", title: "New Widget", payload: { value: 50, delta: 0 }, real: false, explanation: "A manually created widget — edit the fields below to make it your own." }],
      prompt: "",
    });
  };

  // Re-runs buildSpec() for a single variant slot only — either re-rolling
  // the same chart type with fresh data ("try again") or switching to an
  // explicitly chosen type (the chart-type picker) — never regenerates the
  // other two variants sitting next to it, unlike a fresh send().
  const regenerateVariant = (msgIndex, variantIndex, vizType) => {
    setMessages((m) => {
      const msg = m[msgIndex];
      if (!msg?.variants?.[variantIndex]) return m;
      const prompt = msg.prompt || "";
      const topics = extractTopics(prompt);
      const type = vizType || msg.variants[variantIndex].vizType;
      const newSpec = buildSpec(type, topics, prompt);
      return m.map((mm, i) => (i !== msgIndex ? mm : { ...mm, variants: mm.variants.map((v, vi) => (vi !== variantIndex ? v : newSpec)) }));
    });
  };

  const reset = () => setMessages([]);

  return { messages, send, pushUser, pushAI, updateVariantTitle, updateVariantSpec, regenerateVariant, createBlank, typing, reset };
}
