# Report Card Builder — Build Brief

## Read first, before writing any code

1. Everything in `/docs` — especially `shape-design-system.md` (tokens), `SHAPE-Widget-Spec.md`
   (widget anatomy rules), and the four spec docs (`mascot-conversation-decision-tree.md`,
   `widget-generation-mapping.md`, `direct-construction-spec.md`, `widget-editing-and-variants.md`).
   These are the source of truth for every rule below — don't take my summary here as complete,
   read the actual docs.
2. `/reference/report-builder-prototype.jsx` — a working single-file prototype that already
   implements most of this. Treat it as ground truth for behavior, not something to redesign from
   scratch. Your job is mainly to give it a real project structure, not reinvent the logic.

After reading, write a `CLAUDE.md` at the project root summarizing the key rules you'll need to
remember across future sessions (grid dimensions, token source, widget anatomy, the
library-vs-generated widget distinction) so they don't need to be re-explained.

## What this is

SHAPE 3.0's Report Card Builder — a prototype tool where users build a "report card" (a canvas of
data widgets) either by chatting with a mascot that guides them, or by starting from a blank
canvas and adding widgets manually. Both paths land on the same canvas.

## Stack

- Vite + React (JS, not TS, to match the reference file)
- No Tailwind — the reference file uses inline styles with a shared token object; keep that
  pattern unless you have a good reason to change it, but do split it into separate CSS modules
  or a styled-components-like approach if that's cleaner once componentized
- `lucide-react` for icons, `recharts` if you rebuild any charts (reference file uses hand-rolled
  SVG for sparklines/scatter — either is fine)

## Target file structure

```
/src
  /components
    /library       — Library panel, MiniWidgetPreview, category carousel
    /canvas        — CanvasScreen, WidgetCard, grid logic
    /chat          — ChatPanel, GuidedChat, GeneratedWidgetPreview, Bubble, ChipRow
    /widgets       — WidgetBody (library-sourced), GeneratedBody (chat-generated), shared
                      primitives (Header, TrendPill, BigNumber, Sparkline, etc.)
    /modal         — DetailModal
  /lib
    tokens.js        — Forma design tokens, sourced from shape-design-system.md
    families.js       — fixed Library widget families (from FAMILIES in reference file)
    generativeEngine.js — the prompt → widget-spec logic (extractTopics, buildSpec,
                           generateVariants, EXPLANATIONS)
  /docs (already present)
  /reference (already present — do not delete, keep as behavior reference)
  App.jsx
```

## Non-negotiable rules (from the docs — enforce these exactly)

- **Grid is fixed pixels, not fractional.** 1×1 widgets are exactly 164×164px, 2×2 are exactly
  344×344px (164×2 + 16px gap). 6-column grid, 16px gaps. Don't let this drift to `fr` units or
  responsive scaling — it must match the real Figma canvas math.
- **Two widget kinds, different rules.** Library-sourced widgets belong to a fixed "family" with
  pre-built forms (swappable via "Change widget," instant, no AI). Chat-generated widgets have no
  family — they're generated fresh each time, editable only via "Edit with AI" (regenerate) or
  manual rename.
- **Data scope fork:** Library-dragged widgets default to full org-wide data. Narrowing only
  happens through chat — either at generation time or via the edit flow. Never add a scope/filter
  control directly on a Library-dragged widget.
- **Widget anatomy** (every widget, both kinds): Header → Insight → Evidence (optional) → Action
  Bar (optional) → Control Menu (hover-only, three-dot). Don't skip sections or add new ones
  without checking `SHAPE-Widget-Spec.md`.
- **Status color rule:** Flourishing/Striving/Struggling and any status-coded data uses the brand
  Red/Amber/Green primitives from `shape-design-system.md`. Never the Graph/Dataviz palette for
  status. Category comparisons (non-status, e.g. gender, work model) use the Graph palette.
- **Generated widget titles are curated per viz type**, never a raw slice of the user's prompt.
  Every generated widget also carries a one-line `explanation` of why that visualization was
  chosen — this is required, not optional flavor text.
- **Editing shows the real widget.** When a user edits a placed widget via chat, render the actual
  current widget inline in the chat panel (not just its name) before the new draft appears.
- **Draft/approve pattern for AI edits:** editing never mutates the canvas widget directly — it
  generates a draft in chat with Replace / Regenerate controls, and only replaces the canvas
  widget when the user approves.

## Build order

1. Scaffold the Vite project, get the token file and family data extracted from the reference
   file into `/lib`.
2. Componentize the canvas + Library panel first (least logic-heavy, most visual).
3. Port the generative engine into its own module with the same behavior as the reference file.
4. Port the chat panel and guided-flow chat.
5. Wire it all together in `App.jsx`, verify it matches the reference file's behavior.
6. Only then: propose improvements, refactors, or new widget types — don't change behavior while
   still porting.

## What "done" looks like for this first pass

Feature parity with `/reference/report-builder-prototype.jsx`, just properly structured — not new
functionality yet. Confirm with me before adding anything the reference file doesn't already do.
