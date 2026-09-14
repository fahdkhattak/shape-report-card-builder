# Widget Editing & Variants
> Two distinct mechanisms for changing a widget already on the canvas
> Direct Construction path — draft for Day 2–3 alignment with Ahsan

---

## Two mechanisms, not one

A placed widget can be changed in two ways. They look similar (both start from the three-dot Widget Control Menu) but do fundamentally different things — worth keeping sharply separate in both the spec and the UI copy, or Ahsan ends up building one flexible-but-vague system instead of two simple ones.

| | **Change Widget** | **Edit via Chat** |
|---|---|---|
| **Trigger** | Three-dot menu → "Change widget" | Three-dot menu → "Edit" **or** drag the widget into the chat panel |
| **What it does** | Instantly swaps to a different pre-built form in the same family | Opens a chat thread scoped to that widget; AI generates a new draft instance based on a request |
| **Generative?** | No — selecting from existing forms | Yes — AI builds something new |
| **Data scope** | Unchanged — same scope as the original | Can change — e.g. "narrow this to just these two topics" |
| **Commit behavior** | Immediate | Draft, not committed until approved (see below) |

---

## Change Widget

Every widget belongs to a **family** — e.g. "Your Score" exists as multiple pre-built forms: a plain 1×1, a 1×1 with a Red/Amber/Green status bar, a 2×2 with driver breakdown. "Change widget" lets the user cycle between these forms without leaving the canvas or opening chat.

- No AI involved — this is a fixed set of pre-built alternates, same as picking a different size/layout of the same widget concept
- Swap is instant, no draft/approve step needed since nothing is being generated
- Family membership is defined by the Library (same concept, same underlying data, different presentation)

**No dedup restriction on canvas.** A user can place two "Your Score" widgets side by side, for any reason or none. The canvas stays free-flowing — this is a deliberate product stance, not an oversight to fix later.

---

## Edit via Chat

**Entry:**
- Three-dot menu → "Edit" — opens the chat panel with that widget already referenced, prompts the user for what they want changed
- Or: drag the widget directly into the chat panel — same result, more direct gesture

**Everything happens inside the chat panel.** No separate modal, no second interface. This keeps the flow simple — the person never leaves the conversation to make a decision.

**The flow:**
1. User references the widget (via menu or drag) and states the change — e.g. *"only show sleep and stress, not the other drivers"*
2. AI generates a **draft** and posts it as a card inline in the chat thread — a live preview of the proposed new widget, sitting under the assistant's message
3. Below the draft card, action controls: **Replace** (approve — swaps into the canvas, original is gone), **Regenerate** (try again, same request), and a way to refine the prompt (continue the chat thread with more detail)
4. Until "Replace" is pressed, the **original widget on the canvas is untouched**. The draft only exists in the chat.
5. Once approved, the draft replaces the original on the canvas. The user then exits the chat panel normally — no extra confirmation step, no other screen involved.

This is the same underlying interaction as the 1–3 variant picker used for fresh widget generation (see `widget-generation-mapping.md`, Step 5) — a generated card with approve/regenerate controls. Editing an existing widget is really "generate a new variant, scoped to one existing widget's context" rather than a separate system. Worth building it as one shared chat-card component with two entry contexts (new generation vs. edit-in-place), not two separate features.

---

## Why this matters for the mapping doc

This confirms the Widget Generation Mapping's Step 0 correction: **scope narrowing for Direct Construction widgets only happens through chat** — either at creation or via this edit flow. A Library-dragged widget has no scope control on the canvas itself; the only way to narrow it is to route it through chat, either by generating it via chat originally, or by editing an existing one this way.

---

## Open questions

1. **Chat-card component reuse** — confirm with Ahsan this is genuinely one component (generation card) used in two contexts, not two builds. Worth flagging early since it changes estimate.
2. **What happens to the chat thread after Replace?** Does the widget-scoped thread stay accessible for further edits later, or does each edit start a fresh thread?
3. **Regenerate limits** — same open question as the original variant-picker doc: does regenerate cap at some number of attempts before nudging the user to refine the prompt instead?
