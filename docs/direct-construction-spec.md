# Direct Construction — Interaction Spec
> The manual/blank-canvas path of the Report Card Builder
> Grounded in Amna's Figma file `dC95bsfH8QXQHPdJl5I0Kk` ("Report Builder" frames, node 2029:6974)
> Draft for Day 1–2 alignment with Ahsan (build) and Amna (sign-off)

---

## Key finding — confirmed by Fahd

Both paths lead to the same **Report Canvas** — one tool, shared shell (Library panel + Canvas + Chat panel). The distinction between the two paths is simpler than "two screens" vs. "one screen":

- **Guided (mascot):** arrives at the canvas **pre-populated** — the mascot has already built a v1 from the conversation, narrowed to the confirmed driver set
- **Direct Construction:** arrives at a **blank canvas**. Nothing pre-built. The same Library, same Canvas, same Chat panel are all present and usable — the user just starts from empty.

So it's one workspace either way, but the starting state differs: populated vs. blank. Widget generation, editing, and the chat panel behave identically from that point forward regardless of which door the user came through.

---

## 1. Workspace anatomy

```
┌────┬───────────────┬─────────────────────────────┬──────────────┐
│    │               │                               │              │
│Nav │   Library      │           Canvas              │  Chat panel  │
│68px│   536px        │      (fills remaining)        │  392px       │
│    │  (collapsible  │                               │  (slides in, │
│    │   to 52px      │                               │   hidden by  │
│    │   icon rail)   │                               │   default)   │
│    │               │                               │              │
└────┴───────────────┴─────────────────────────────┴──────────────┘
                                                    [mascot avatar]
                                                    floating, bottom-right
```

- **Nav rail** (68px) — standing app navigation, not builder-specific.
- **Library panel** — browsable, seeded-data-backed widget source. Collapses to a 52px icon rail (just the tool icons) when canvas needs more room.
- **Canvas** — the report card itself, grid-based.
- **Chat panel** — hidden by default, slides in from the right. Contains the full mascot conversation thread. This is shared infrastructure for *both* the guided flow and manual chat-based widget generation.
- **Mascot avatar** — persistent floating trigger, bottom-right, opens the Chat panel from anywhere in the workspace.

---

## 2. Library panel

**Structure:** organized by **insight category**, not by widget type. Categories observed in the file: Score, ENPS, Areas to Focus, Explorers Results, Flourishing Status, Health Age, Score over time, Score Comparisons.

Each category row shows:
- Category name
- A count badge (e.g. "Areas to Focus · 5") — meaning 5 pre-computed widget variants exist for that category, seeded from real data
- An expand chevron

**Expanded state:** reveals actual widget preview cards (e.g. "Areas to Focus" as a 1×1, "Focus List" as a related 1×1 variant) — small, real, data-populated previews, not generic icons. Each has a drag handle.

**Search:** a search field sits above the category list — filters by category or presumably by driver name.

**Interaction:** drag a preview card from the Library directly onto the Canvas grid. Drag-and-drop mechanics are already in progress on the dev side — not a design open question, no need to re-spec.

**Widgets pull full org-wide data by default.** A "Your Score" widget dragged from the Library isn't scoped to any narrowed driver set — it pulls from the entire seeded dataset. Narrowing only happens through chat (see `widget-generation-mapping.md` Step 0, and `widget-editing-and-variants.md`). There's no filter control on a Library-dragged widget itself.

---

## 3. Canvas — grid system

This is more concrete than anything in the current Widget Spec, and it fills a real gap: **the spec only defines 1×1 and 2×2 sizes, but Amna's file uses a 3×3 as well.**

**Grid:** 6 columns × 164px cells, 16px gap. Card container: 32px padding, 36px corner radius, `shadow-sm`-equivalent elevation.

| Size | Spans | Pixel dimensions | Matches widget spec? |
|---|---|---|---|
| 1×1 | 1 col × 1 row | 164 × 164 | Yes — defined |
| 2×2 | 2 col × 2 row | 344 × 344 | Yes — defined |
| 3×3 | 3 col × 3 row | 524 × 524 | **No — needs to be added.** Used for the Index-type composite widget (radial/donut with driver segments) |

**Action item:** the Widget Spec's "Supported Sizes & Layout" section needs a 3×3 entry before this can be called complete. Given the anatomy rules (Header required, Insight required, Evidence allowed, Action optional) already scale cleanly from 1×1 → 2×2, 3×3 is likely just "more of the same" — but should be confirmed with Amna since it's her canonical ruleset file this depends on.

**In-canvas add affordance:** an empty 1×1 tile with a centered "+" sits directly in the grid (bottom-right slot in the example). This is a **second way to add a widget** — separate from dragging out of the Library — presumably opening the Add Widget menu or Library directly. Worth deciding if both entry points stay, or if this consolidates to one.

**Widget visual pattern observed (worth carrying into the mapping doc):** the 2×2 "Drivers" widget colors each row's left border and progress bar by status — green for on-track drivers, red for at-risk ones — using the same brand Red/Green primitives we used for the Scattergram. Third confirmation of the same rule.

---

## 4. Tools rail (collapsed Library state)

When the Library collapses to its 52px icon-only state, three tool groups remain:
- **Add Widgets** — 4 icon buttons (category unconfirmed from the file — likely quick filters, possibly the widget Type A/B/C split or macro-categories; **needs confirmation from Amna**, don't guess further)
- **Report templates** — 1 button
- **Customise Reports** — 1 button

Flagging as open rather than asserting: the file doesn't label these icons, so this is inferred structure, not confirmed behavior.

---

## 5. Chat panel

Confirms the manual path's chat-based generation isn't a separate mini-feature — it's the same mascot, same panel, same thread used for guided creation. Structure observed:
- User message bubbles (right-aligned)
- AI message bubbles (left-aligned, with Mascot avatar) — includes **Quick Action** buttons inline (e.g. "Add first user") for one-tap follow-through
- Below the thread: an input field, with a **trending query suggestion list** — 4 suggested prompts with checkmarks, plus a refresh action for more

This directly matches the manual-path spec we already wrote: chat generates widgets, user picks/regenerates. The Quick Action buttons are the likely home for the "pick 1 of 3 variants" interaction — worth designing that pattern to slot into this exact spot rather than inventing a new UI region.

---

## 6. What this resolves vs. what's still open

**Resolved by this file:**
- Grid system and widget sizing (with one gap: 3×3 needs to be formally added to the Widget Spec)
- Library panel structure and how it surfaces seeded-data-backed widgets
- Confirmation that manual chat-generation and guided mascot conversation share one Chat panel — not two systems
- Visual confirmation (3rd instance) that status-coded data uses brand Red/Amber/Green primitives

**Resolved since first draft:**
- Widget "forms" confirmed — a concept like "Your Score" exists as multiple pre-built sizes/layouts (1×1 plain, 1×1 with status bar, 2×2 with breakdown). Switching between them is the "Change Widget" mechanism — see `widget-editing-and-variants.md`.
- No dedup restriction — canvas stays free-flowing, duplicate widgets are allowed.
- Variant-picker / draft-approval UI confirmed to live entirely inside the Chat panel, as an inline card with Replace / Regenerate / refine-prompt controls under it — not a separate overlay.

**Still open — needs Amna or a build decision:**
1. What the 4 unlabeled "Add Widgets" icons filter by
2. Whether the in-canvas "+" tile and the Library drag are both staying, or consolidating
3. Whether a widget-scoped chat thread (from "Edit") persists for follow-up edits later, or resets each time
