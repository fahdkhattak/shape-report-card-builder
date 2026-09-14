# Chat/First-Interface Redesign Audit — Figma `Z6YmEggwvoiX3j4d3kCKqV` ("SHAPE 3.0 Roughwork")

Research only — no app code changed. Covers frames 3, 5, 6, 7, 8, 9 of the top-level `2031:8457`
("Chat") section, per the user's framing: *"a proper set up chat start screen... the chat's
side-modal state and then the floating chat state... these draft conversations in a section in
the sidebar called 'Drafts'."* Frame 1 (empty landing) and frame 2 (the "+" cascading menu) were
already fully extracted before this pass and are not re-covered here except where frame 3 adds
new detail on top of them. Frame 4 (composer with example text typed) was **not** pulled — budget
went to the six frames explicitly in scope; treat it as unexamined, not "no delta."

All measurements below came from `get_design_context` (code + tokens) on the specific sub-nodes
named per frame, plus two `get_screenshot` pulls for the floating-chat frame where the JSON
metadata for the full frame exceeded the tool's own size limit. Node IDs are cited throughout so
any of this can be re-verified without re-deriving it.

**Current implementation for reference** (read in full before writing this):
`src/components/chat/ChatLanding.jsx`, `ChatPanel.jsx`, `GeneratedWidgetPreview.jsx`,
`src/components/shell/NavRail.jsx` + `navRailData.js`, `src/components/library/LibraryPanel.jsx`,
`src/components/chat/GeneratingScreen.jsx` + `GeneratingChecklist.jsx`, `src/lib/tokens.js`
(`T`/`font`/`radius`). Styling convention throughout the app is plain inline `style={{}}` objects
using `T`/`font`/`radius` — **not** Tailwind, despite Figma's own code-gen returning React+Tailwind
reference code. Every delta below is written against that convention.

---

## 1. Chat start screen's new functions (frame 3 `2031:8565` "Chat 9", plus frame 2 recap)

Pulled via `get_design_context` on `2031:8574` (the whole hero block: mascot, heading,
composer, pills, starter chips) — full code + screenshot returned cleanly, no truncation.

### 1a. The "+" cascading menu (frame 2, already extracted — recap for completeness)
Opens from the composer's left "+" button. Two-to-three level cascade:
- **Level 1**: "Add Files or Photos", "Add Data Source", "Service" (chevron-right → submenu).
- **Level 2** (under "Service"): "SHAPE Performance Index" (chevron-right → submenu),
  "Workplace Experience Report", "Total Employee Brand Report", "Brain Health Report"
  (chevron-right → submenu, contents not sampled), "DAS Report".
- **Level 3** (under "SHAPE Performance Index"): "Org" / "Team" / "Personal".

This is a 2–3 level cascading floating menu — structurally the same pattern already built in
`NavRail.jsx` (`FloatingMenu`/`useMenuFloating`/`MenuItem`, `@floating-ui/react`-based, with
`FloatingTree`/`FloatingNode` for nested submenus). Reuse that machinery rather than
re-inventing it; the existing nested "Switch Accounts" flyout inside the Profile menu is
functionally the same shape as "Service → SHAPE Performance Index → Org/Team/Personal".

### 1b. Persistent Service + Scope pills (new — node `2031:8592`)
Once a service is picked from the "+" menu, the composer grows a **second row directly below
the text-input row, inside the same rounded container** (not a separate element below the
composer):
- Outer wrapper: `bg #e5e4e3` (`T.gray75`), `border 1px #cecdcc` (`T.gray100`), `radius 24px`
  (between `radius.xl`=16 and `radius.xxl`=24 — exactly `radius.xxl`/`24`, no token currently
  named this for the *composer* specifically; app's own composer uses `radius.reportCard`=38,
  see delta below).
- Inner "Dark Chat Input Bar" (the actual white input, node `2031:8582`): `bg white`,
  `border 1px #cecdcc`, `radius 24px`, `padding 16px`, `gap 12px`, drop-shadow stack (five
  layered 2xs shadows, very soft — effectively the same visual weight as the app's existing
  composer shadow, `-4px 0 24px rgba(0,0,0,0.08)`-ish but lighter/tighter).
- Pills row (node `2031:8592`): `padding 6px 16px`, `gap 6px`. Two ghost buttons:
  - **"SHAPE Performance Index ⌄"** — 14px Regular, `#3a3737`, chevron-down 20px icon.
  - A vertical 1px divider (`Line 89`, height 20px).
  - **"Org ⌄"** — same styling, same chevron-down icon.
  Both are plain `Buttons/Button` ghost instances — i.e. real dropdown triggers (matching the
  frame-2 cascade: Service picks the report type, Scope picks Org/Team/Personal), not static
  labels.
- **This does not exist in the app at all today.** `ChatLanding.jsx`'s composer
  (lines ~212–228) is a single-row bar with no service/scope concept — the app's own "scope" is
  the freeform `topicResolver.js` conversation (`findScope()`/bespoke clusters), which is a
  fundamentally different mechanism (inferred from a sentence, not chosen from a fixed
  service/report-type list). Building this pill row would mean deciding whether it *replaces*
  or *sits alongside* the existing scoping conversation — a real product decision, not just a
  styling port (see Open Questions).

### 1c. Composer bottom-action icons (node `2031:8586`–`8591`)
- Left: "+" ghost button, `36×36` hit box (padding 8, `radius.full`), `20×20` plus icon.
- Right: mic ghost button (`36×36`, `20×20` microphone-01 icon) — matches app's `Mic` icon.
- **Send button is a solid dark circle, not the app's ghost `Send` icon**: `bg #231f20`
  (`T.gray800`), `36×36`, `20×20` **arrow-right** icon (not a paper-plane/Send glyph). App's
  `ChatLanding.jsx`/`ChatPanel.jsx` currently render `<Button theme="brand" variation="ghost"
  iconLeft={<Send size={20}/>}>` — both the fill (should be solid `gray800` primary, not ghost)
  and the icon (`ArrowRight`, not `Send`) differ from the real reference.
- Placeholder text: **"Ask a question or describe the report you need..."** (16px Regular,
  `#908d8e`/`T.gray400`) — differs from the app's current phase-dependent placeholders ("Ask
  for a widget, or describe another concern..." / "Describe your goal, challenge, or idea...").

### 1d. Starter chips (node `2031:8596`–`8599`)
Exactly **three** secondary-ghost pill buttons, confirmed labels and order:
1. "Explore Services"
2. "Create a Service"
3. "Review Insights"

Style: `border 1px #cecdcc`, transparent bg, `radius full`, `padding 12px 4px` (i.e. tall
padding, tight vertical — reads as a 28px-tall pill), 14px Regular `#3a3737`.

**Real delta from the app**: these are fixed, generic, function-oriented labels (about the
*product's* capabilities — services, insights) — not data-driven. The app's
`ChatLanding.jsx`'s `liveStarterChips()` (lines 17–19) instead surfaces the day's three
worst-scoring real dimensions (`dimensionRankedRows().slice(-3).reverse()`), i.e.
content-driven, not function-driven. These are two different ideas of what a starter chip is
for (discover product features vs. jump into today's worst data) — not a straightforward
"copy these three strings in" port. Worth a product call on which (or whether both, in two
rows) is wanted.

---

## 2. Full chat conversation anatomy (frame 5 `2031:8635` "Chat 11"; frame 6 `2031:8741` "Chat 12" for the sidebar-expanded variant)

Pulled via `get_design_context` on `2031:8649` (the entire conversation column, timestamp
through composer) — full text content, not just structure, came back.

### 2a. Layout
- Content column: **740px wide**, centered (`460px` left inset inside a `1660px` main area in
  the collapsed-rail variant). Composer wrapper has `max-width: 792px` — **note this is wider
  than the 740px message column itself**, a minor inconsistency in the reference file, not
  necessarily deliberate.
- Timestamp divider: **"3 Jun 2026, 18:36"**, 12px Regular, `#7c7879` (`T.gray500`), centered —
  matches the app's existing "Today" divider treatment almost exactly (app uses `T.gray300`,
  12px, centered; only the copy differs — a real date/time vs. the app's static "Today").

### 2b. AI messages
- Avatar: same `28×28` mascot circle asset (`Frame41069`) the app already uses via
  `mascotAvatar` — no change.
- Text: **16px/24px Regular**, `#1d1a1b` (`T.gray900`), multiple `<p>` blocks with `16px` bottom
  margin between them. A closing question ("Would you like me to show...?") renders in
  **SemiBold**, same size/color — the app currently renders all AI text as one plain block with
  no emphasis on the closing question; this is a real, easy-to-port micro-detail (bold the last
  sentence when it's a question prompting the next quick-action row).
- No per-message bubble background/border on AI turns — plain text in the page background,
  exactly like the app's `Bubble` (non-`mine`) treatment.

### 2c. Quick-action chip row (node `2031:8666`, `8698`, `8728`)
`padding-left: 44px` (aligns under the text, past the 28px avatar + 16px gap — matches the
app's `paddingLeft: 36` convention closely enough it's effectively the same idea, off by 8px).
Chip style: `border 1px #cecdcc`, transparent bg, `radius full`, `padding 12px 4px`, 14px
Regular `#3a3737` — **same visual family as the starter chips in §1d**, just reused inline.

**Confirmed chip sets per turn** (this varies — not a fixed row repeated verbatim, contrary to
the app's `QUICK_ACTIONS` which is the same 3 items every time):
- Turn 1 (initial greeting): **Create Report, Create Widget, Find Insights, Investigate
  Findings** (4 chips).
- Turn 2 (after first user question): **Create Widget, Create Report, Investigate Findings**
  (3 chips — reordered, "Find Insights" dropped).
- Turn 3 (after "Where is it happening?"): **no chip row at all** — the AI response ends in a
  SemiBold question but no chips are shown underneath it in this frame.
- Turn 4 (after the drill-down): **Create Report** only (1 chip).

This directly contradicts the app's current fixed `QUICK_ACTIONS` array (`quickActions.js`) —
the same 3 hardcoded prompts (`"Compare sleep and stress"`, `"Show engagement trend over
time"`, `"What's our flourishing status?"`) shown after every single AI turn, forever. The real
reference's chips are generic category actions ("Create Report"/"Create Widget"/"Find
Insights"/"Investigate Findings"), turn-dependent, and shrinking as the conversation narrows —
a materially different design (contextual next-steps, not a static suggestion rail). Note:
`quickActions.js`'s own header comment already flags that the *reference's* chip labels are
"generic category names the engine doesn't parse" and deliberately swapped them for
real, engine-understood prompt strings — that reasoning still applies; the delta worth acting
on here is the **turn-dependent, shrinking-set behavior**, not necessarily reverting to the
literal labels.

### 2d. User messages + the "Service | Scope" tag pill (node `2031:8671`/`8678`–`8680`)
- Right-aligned white card: `bg white`, same soft shadow stack as the composer, `radius 18px`
  (`radius.widget`), `padding 12px`, **fixed width 520px** (not full-bubble-to-content — every
  user message in this conversation is exactly 520px wide regardless of text length).
- **The tag pill only appears on the FIRST user message of the conversation**, not on every
  one — confirmed by comparing node `2031:8678` (has it) against the second user message,
  node `2031:8709` ("Where is it happening?", no tag). Pill style: `bg #f2f2f2` (`T.gray50`),
  `border 1px #b4b2b1` (`T.gray200`), `radius full`, `padding 12px 4px`, text **"SHAPE
  Performance Index | Org"** — 14px **Medium**, `#504c4d` (`T.gray700`).
- Message text below the pill: 16px Regular, `#1d1a1b` (`T.gray900`) — same treatment as AI
  text, just right-aligned inside the card.
- **This entire pattern (tag pill, fixed-width right-aligned card, first-message-only tag) does
  not exist in the app.** `Bubble.jsx`'s `mine` variant is a simple content-width bubble with no
  tag concept — building this needs the Service/Scope state from §1b to exist first (the tag has
  nothing to read from otherwise).

### 2e. In-conversation composer (node `2031:8731`)
Single-layer white bar (not the double-layer gray75-wrapper-plus-white-inner from the landing
composer in §1b) — `bg white`, `border 1px #cecdcc`, `radius 24px`, `padding 16px`. Same
icon set as §1c (Plus ghost / Mic ghost / solid-dark-circle Arrow-right send). No Service/Scope
pill row here — those only appear once, on the landing composer, before the first message.

### 2f. Sidebar-expanded variant (frame 6, `2031:8741`)
Identical conversation content and chip sets, just narrower (300px sidebar pushes the 740px
column to start at `x=344` instead of `x=460`). No new conversation-anatomy information beyond
confirming the layout doesn't reflow the message column width when the sidebar expands (it's
still exactly 740px, just re-centered in the remaining 1428px).

---

## 3. The Drafts sidebar section (frames 6 `2031:8741` and 7 `2032:12134`)

Pulled via `get_design_context` on `2031:8756` ("Menu Items" — nav list through the Drafts
group) — full code returned, no truncation.

### 3a. Structure, compared directly against "Your Reports" (`NavRail.jsx`)
- **"YOUR REPORTS"** row (node `2031:8763`): 13px Medium, uppercase, `#7c7879` (`T.gray500`),
  `chevron-right` (collapsed/closed in this frame) + a ghost "+" icon button on the right.
  `height: 40px`, `padding: 8px`, `radius: 6px`.
- **"DRAFTS"** row (node `2031:8765`): **identical treatment** — same 13px Medium uppercase
  gray500 label, same `chevron-down` (open here) + ghost "+" button, same 40px/8px/6px sizing.
  Sits directly below "Your Reports" as its own sibling section, not nested inside it.
- **Drafts are a flat list — no expand/sub-items**, unlike "SHAPE Performance Report" in
  `SAMPLE_REPORTS` which has its own `Personal`/`Team`/`Org` sub-items. Each draft is a single
  row (node under `2031:8766` "Sub-Items"): `height: 36px`, `padding: 8px 12px` (left)/`8px`
  (right), `radius: 6px`, text **14px Regular** (not Medium), `#504c4d` (`T.gray700`) — this
  font-weight/color combination already matches the app's existing `SubItemRow` exactly
  (`ChatRail.jsx` line ~261: `fontSize: 14, color: T.gray700`), so no new type-scale is needed.
- **Active/current draft gets a persistent background, not just a hover state**: "Motivation
  Investigation" (the draft matching the currently-open conversation) has `bg #f9f8f7`
  (`T.gray25`) at rest — the same token the app already uses for hover (`SubItemRow`'s
  `hover ? T.gray25 : "transparent"`), but here it's a **resting/active** state, distinct from
  hover. The other two drafts ("Physical health check", "Underlying cause of absenteeism in
  the company" — exact casing/text, not the truncated names the raw Figma node names suggested)
  are plain white/transparent at rest.
- **No visible per-draft "..." menu** (unlike `SubItemRow`'s hover-revealed `MoreHorizontal` →
  "Share Report" for Reports' sub-items) — no such instance exists anywhere in the sampled
  Drafts sub-item nodes. This is a real, if soft, finding: either Drafts genuinely have no
  per-item menu (rename/delete/etc.), or the design simply never captured a hovered state for
  them in a static frame — can't fully rule out the latter from a non-interactive file (see
  Open Questions).
- **The "+" buttons are plain transparent ghost icon buttons** (`bg rgba(255,255,255,0)`,
  `radius full`, `padding 4px`) on both "Your Reports" and "Drafts" — **not** the app's current
  solid black-circle "+" (`ReportRow`'s section header: `background: T.gray800`, white icon).
  This is a real, small styling delta on the *existing* "Your Reports" row too, not just new
  Drafts work — worth fixing both together if this file gets built against.

### 3b. What to build
A parallel `SAMPLE_DRAFTS` array in `navRailData.js` (flat, no `subItems`, unlike
`SAMPLE_REPORTS`), an `activeId` concept (whichever draft matches `mainChat`'s current
conversation — the app doesn't have a multi-conversation model today, so this also implies
either a fake single "always active" entry or real per-conversation persistence, a bigger
lift than styling), and a `DraftRow` component mirroring `ReportRow`/`SubItemRow`'s pattern
but without the expand/chevron/nested-sub-items machinery Reports has.

---

## 4. Generated-widget draft card inside chat (frame 7 `2032:12134` "Chat 14", node `2032:12561`)

Pulled via `get_design_context` on `2032:12561` — full code, confirms both the outer card
chrome and the actual widget shown is a real "Explorers" `DriverGroupedList` (Great/Average/Poor
sections, matching the app's own Explorers family and its real driver names/values —
Life Outside Work 88, Physical Health 86, Soft Work Environment 76, Business Essentials 70,
Corporate Culture 44, Job Satisfaction 32, "6 more Explorers" footer).

Direct comparison against `GeneratedWidgetPreview.jsx`:

| | **App (`GeneratedWidgetPreview.jsx`)** | **Figma reference** |
|---|---|---|
| Outer card | `border 1px gray75`, `radius 16px`, `padding 16px`, white-ish content area | `bg #e5e4e3` (`T.gray75`) **filled**, `border 1px gray100`, `radius 18px` (`radius.widget`), `padding 16px`, `gap 16px` — the whole card has a visible gray fill, not just a border on white |
| Widget preview scaling | Scales native size down to a fixed **164×164** display box | Scales down to **180×180** — close but not identical; app's `DISPLAY_BOX` constant would need updating to match exactly if pixel-parity matters |
| Size label | Small gray text beside the preview (e.g. "2x2") | Same idea, same position (beside the preview) — **12px Regular, `#a5a2a2`/`T.gray300`**, text is literally `"2x2"` — this one already matches closely |
| Action row | 1 labeled button ("Add to canvas"/"Add to Report"/"Replace") + 2 ghost icon buttons (`RefreshCw` regenerate, `Wand2` change-type) | **4 items**: "View Scope" (secondary/outline, `border #231f20`, transparent bg) + **"Add to Report"** (**primary/filled**, `bg #231f20`, light text `#e5e4e3`) + `edit-05` (pencil) ghost icon + `refresh-ccw-04` ghost icon |
| Primary action styling | `theme="brand" variation="secondary"` (outline) for Add/Replace | **Filled/primary** dark button for "Add to Report" — the real reference treats this as the primary CTA of the card, the app currently treats it as a secondary-style action |
| "View Scope" | **Does not exist** | New action — no equivalent anywhere in the app; likely surfaces the Service/Scope pill state from §1b/§2d for this specific widget (unconfirmed — no interaction data available, see Open Questions) |
| Edit icon | `Edit3` (title inline-rename, opens a text input in place) | `edit-05` (Figma tag: "edit, pencil, change, draw, design, write") — plausibly the same "rename title" affordance, but could equally mean "edit with AI" given the icon's generic tag; not confirmed which |
| Change-type (`Wand2`) | Exists (Power-BI-style chart-type dropdown, `VIZ_OPTIONS`) | **No equivalent icon in this card** — no wand/magic icon in the 4-item row. Either this feature doesn't exist in the new design's model, or it's reachable some other way (not visible in this frame) |
| Regenerate icon | `RefreshCw` | `refresh-ccw-04` — same concept, different icon variant in Figma's own icon set (04 vs. the general refresh glyph); functionally identical |

**Net read**: the real reference's card is a simpler 4-action model (View Scope / Add to Report
primary / Edit / Regenerate) that drops the app's chart-type-picker feature entirely and adds a
scope-inspection action instead. This is a real product-scope question, not just a visual port
— porting the visuals faithfully would mean removing the `onChangeType`/`VIZ_OPTIONS` dropdown
this session's own prior work built, unless it's meant to live under "Edit" instead.

---

## 5. The side-modal state (frame 8 `2032:12681` "Chat with Report")

The full frame's `get_metadata` XML was too large for one call (61.7KB) — extracted with a
local Node.js script instead of re-fetching per-child, then drilled `get_design_context` into
three specific sub-nodes (header icon cluster, breadcrumb+Publish row, inline checklist) once
the metadata pass showed exactly where they lived. Two structurally distinct "Side Menu" nodes
exist in this frame: a **500px-wide one that is `hidden="true"`** (`2032:12729`, an abandoned/
alternate width, not the real state) and the **436px-wide one that is actually visible**
(`2032:12861`, inside the un-hidden `2032:12860` wrapper) — make sure any future fetch targets
the visible one, not the hidden alternate.

### 5a. Docked chat panel — exact width
**436px** (`2032:12861`), docked to the **left** edge of the canvas area (nav rail is still the
separate collapsed 68px rail to its left) — confirmed the opposite side from the app's current
`ChatPanel.jsx`, which docks **right** (`right: open ? 0 : -400`). This is a structural, not
cosmetic, difference: the whole panel-anchoring logic in `CanvasScreen.jsx` would need to flip
sides, not just restyle.

### 5b. Header icon cluster — identified via Figma's own icon-library tags, not guessed
Node `2032:12866`, three ghost icon buttons (`28×28` hit area, `20×20` icon, `8px` gap between
them), confirmed via `get_design_context`'s component-description metadata (these are Figma's
own icon usage tags, i.e. **confirmed**, not inferred from the screenshot alone):
1. **`edit-05`** — "edit, pencil, change, draw, design, write" → rename the conversation title.
2. **`scale-01`** — "scale, expand, move, design, editor" → almost certainly the panel/layout
   toggle (dock ↔ float, or resize) the task description guessed at — the icon's own name
   literally means resize/scale.
3. **`minus`** — "minus, subtract, subtraction, mathematics, circle" → collapse/minimize.

Same 3-icon cluster (same icons, same order) appears in the floating-chat header in §6 — so
whatever these do, they're consistent across both docked and floating states, which supports
reading `scale-01` as the dock↔float toggle specifically (the one action that would need to
exist in *both* places to move between them).

Title button beside the icons: **"Motivation Investigation ⌄"**, ghost button, 14px Regular
`#3a3737`, chevron-down — same "conversation title" pattern used in the breadcrumb (§5c).

### 5c. Report Builder canvas — breadcrumb + Publish
Node `2032:13014`:
- **"Performance Advantage Index"** — 14px **Bold**, `#504c4d` (`T.gray700`) — reads as the
  top-level report-type name (matches "SHAPE Performance Index" from the Service picker in
  §1a/§1b, though the exact string differs slightly — "Performance Advantage Index" vs. "SHAPE
  Performance Index" — likely the same concept, inconsistent copy between mockup frames; flagged
  as an open question, not resolved as intentional).
- `slash-divider` icon (16×16) between segments.
- **"Motivation Investigation ⌄"** — 14px Regular `#504c4d`, ghost button with chevron-down —
  same conversation-title pattern as the chat panel's own header.
- A **mystery 103×20px placeholder frame** (`2032:13022`, inside `Frame 41141`) sits right after
  the breadcrumb with **zero content** — an empty node in the source file itself, not a fetch
  failure. Could be a status badge, a save-state indicator, or simply an unfinished piece of the
  mockup. Cannot be resolved from this file — see Open Questions.
- **"Publish"** button, top-right: rendered in its **disabled** state in this frame
  (`bg #a5a2a2`/`T.gray200`-equivalent, text `#e5e4e3`) — consistent with the report still being
  mid-generation at the moment this frame captures.

### 5d. Skeleton grid (node `2032:13025` "CARD")
A `1128×588` grid of rounded-rectangle placeholder shapes at real widget sizes/positions (two
`2x2` at 344×344, several `1x1` at 164×164, laid out in the app's own 164/16px grid math) —
confirms the same fixed-pixel grid system (`CELL=164, GAP=16`) already in `gridLayout.js`,
just with **more varied placeholder-shape variants** (score-block, metrics row, evidence bar +
legend, status-block + progress bar, bar chart, line chart) than the app's current
`SkeletonWidgetCard.jsx` (which only has `chart`/`bars`/`metric` variants, per
`GeneratingScreen.jsx`'s `SKELETON_LAYOUT`). Not pulled in full type-by-type detail (skeleton
shapes carry no real information beyond "a rounded rect placeholder," diminishing returns for
the time cost) — flag as available for a follow-up pass if closer skeleton-variant parity is
wanted.

### 5e. Inline "Working..." checklist (node `2032:12967`) — the key structural finding
This is the single most load-bearing discovery in this audit. Full text, confirmed verbatim:

```
Working...
✓ Creating Your Report
✓ Understanding your request
✓ Selecting insight logic
✓ Checking existing Widgets Library
⟳ Choosing widgets...
Estimated time 4 seconds
```

- "Working..." label: 13px Regular, `#504c4d` (`T.gray700`).
- Each step row: 16×16 icon (`check` for done, `refresh-ccw-01` for in-progress — a spinner
  glyph, not a different check state) + 12px Regular `#504c4d` text, `8px` gap, rows `10px`
  apart.
- "Estimated time 4 seconds": 12px **Medium**, `#1d1a1b` (`T.gray900`).
- Rendered **inline inside the chat message stream**, indented under the mascot avatar exactly
  like a normal AI turn (`pl-12` under a `28px` avatar) — not a separate full-screen route.

**This is verbatim, word-for-word identical** to the app's existing
`GeneratingChecklist.jsx` `STEPS` array (lines 15–21) and its "Estimated time N seconds" copy
(line 57) — right down to the trailing "..." on "Choosing widgets...". That file's own header
comment already flags the exact tension this frame resolves:

> "our guided flow is currently a separate full-screen route with no canvas visible alongside
> it, so only the checklist is ported here. See CLAUDE.md for the open question this reveals
> about chat/canvas being one shell vs. separate routes."

**Answer, now confirmed from this file**: the checklist runs **inline inside the docked chat
panel**, while the Report Builder canvas (with its skeleton grid) is visible simultaneously
behind/beside it in the same view — there is no separate full-screen "Generating..." route in
this reference. `GeneratingScreen.jsx`'s current design (a dedicated screen, chat docked at
right, full-width skeleton grid, checklist rendered as a big central block under the grid) is a
**different structural shape** from this reference (chat docked at *left*, narrower canvas,
checklist as a small inline chat message) — not just a smaller version of the same idea.
Whether `GeneratingScreen.jsx` should be retired in favor of this inline-in-chat pattern (chat
panel + canvas as one continuous state, no separate "generating" screen transition) or whether
both should coexist for different entry points is a real product decision this file doesn't
settle on its own — but the copy/step-list itself needs no rework, only relocation.

### 5f. Composer (node `2032:12851`)
Placeholder **"Type here..."** (differs from the landing/full-page composer's "Ask a question
or describe the report you need..." — matches the app's own `ChatPanel.jsx` placeholder
exactly, which already uses "Type here..."). Same Plus/Mic/dark-circle-Arrow-right icon set as
everywhere else.

---

## 6. The floating chat state (frame 9 `2032:13302` "Chat with Report")

`get_metadata` on the full frame exceeded the token limit (96.9KB) — same local-extraction
approach as §5, then two `get_screenshot` calls (one on just the floating card, one on the full
1728×916 frame) to visually confirm layout, since the JSON metadata alone doesn't carry
radius/shadow values without a further `get_design_context` call whose size risk wasn't worth
it once the screenshot answered the same questions directly.

### 6a. Floating card — exact size and position
Node `2032:13303` ("Side Menu"), confirmed from metadata: **x=1306, y=300, width=392,
height=593**, inside the 1728×916 canvas frame. Derived offsets:
- **Right edge**: `1728 - (1306 + 392) = 30px` from the canvas's right edge.
- **Bottom edge**: `916 - (300 + 593) = 23px` from the canvas's bottom edge.
- The `y=300`/height=593 combination is almost certainly a **resting size driven by how much
  conversation content is visible**, not a fixed anchor point — treat "~23–30px margin from the
  canvas's bottom-right corner" as the generalizable fact, and the card's height as
  content-dependent up to some max, not a fixed 593px.
- **Width 392px is an exact match** for the app's existing `ChatPanel.jsx` fixed width
  (`width: 392` at line 42) — a genuine, useful convergence point; no resizing work needed to
  reuse that panel's width for this floating variant.
- Corner radius and shadow: confirmed visually (screenshot) as a fully-rounded card (reads as
  ~16–18px, i.e. `radius.xl`/`radius.widget`) with a soft, wide drop shadow and a thin light
  border — consistent with the same shadow/radius language used everywhere else in this file
  (composer, user-message cards) rather than a distinct new treatment. Exact radius/shadow
  values were not pulled via `get_design_context` for this specific node (screenshot was
  sufficient to confirm "same visual family, not a new one" — a follow-up `get_design_context`
  on `2032:13303` would give exact numbers if pixel-parity is needed).

### 6b. Same header icon cluster as the side-modal — confirmed
Node `2032:13304`–`13311`: identical structure to §5b — "Motivation Investigation ⌄" title
button (`208px` wide) + the same three icons (`edit-05`, `scale-01`, `minus`) at the same
`28×28`/`20×20` sizing. This is a real, confirmed match (both pulled via `get_design_context`,
not assumed from visual similarity alone) — whatever component this header is, it's the same
component in both the side-modal and floating states.

### 6c. What's behind the floating card
Confirmed via screenshot: the **Add Widget/Library panel** (left, `"Add Widget"` header +
`"Library ⌄"` dropdown-styled tab selector next to it, then category rows — **Score 3, ENPS 2,
Areas to Focus 5** [with description text + two sample preview cards + "Top Focus"/"Focus List"
1×1 forms, matching the app's `areas-focus` family and its "worst demographic group" concept],
**Explorers Results 6, Flourishing Status 2, Health Age 2, Score over time 2, Score Comparisons
2**) sits behind/beside the floating card, with the **Report Builder canvas** (breadcrumb +
skeleton grid, same as §5c/§5d) further right.

**Category-taxonomy delta worth flagging**: comparing this to `src/lib/families.js`'s
`category` field — the app currently groups **ENPS under the "Score" category** (`enps` family,
`category: "Score"`), while this reference treats **"ENPS" as its own top-level category** (a
separate row, count 2) distinct from "Score" (count 3). The reference also has two categories
the app doesn't have at all: **"Flourishing Status"** and **"Score Comparisons"** — the latter
matches `docs/figma-widget-audit-new.md`'s already-cataloged-but-deferred "Score Comparison"
family (`SH.SCR-CMP`), so that gap was already known; "Flourishing Status" as a category name is
new information from this pass (possibly the same thing as the app's `org-status` family under
a different category label — not confirmed either way).

### 6d. Toggling between full-page / side-modal / floating — inferred, not confirmed
No Figma prototype/interaction data was queried in this pass (only static frame structure via
`get_metadata`/`get_design_context`/`get_screenshot` — none of these surface click-through
prototype links even if the file has them defined). Everything below is **inference from icon
naming and layout logic, not confirmed behavior**:
- `scale-01` ("scale, expand, move") appearing identically in both the side-modal (§5b) and
  floating (§6b) headers is the strongest signal that this is the **dock ↔ float toggle** — it's
  the one icon present in both states that would need to *do* the same thing (move between
  them) for its presence in both to make sense.
- `minus` most plausibly **minimizes further** (e.g. floating card → a small closed bubble, or
  closes the panel back to the plain canvas with just the mascot trigger button, matching the
  app's existing floating-mascot-avatar-opens-`ChatPanel` pattern) — but nothing in the file
  shows a "minimized" state to confirm this against.
- `edit-05` (pencil) most plausibly renames the conversation title (both here and on the
  breadcrumb's matching title button) — reasonably confident, but not confirmed by any renamed-
  state frame either.
- **No frame in this set shows the true full-page state (frame 1/2) transitioning directly into
  either docked mode** — the "how do you get from `ChatLanding` into the side-modal" moment
  (presumably: click "Create Report" or similar, same as the app's existing
  `finishGenerating()` flow) isn't itself pictured; it's inferred from the app's own existing
  analogous flow, not this file.

---

## 7. Open questions and ambiguities

Stated plainly, not silently resolved:

1. **Does the Service/Scope pill system (§1b) replace or coexist with the app's existing
   freeform scoping conversation** (`topicResolver.js`'s `findScope()`/bespoke clusters)? These
   are two different mental models for "what is this report about" — a fixed picklist vs. an
   inferred-from-text conversation. Building the pills faithfully doesn't by itself answer
   whether the scoping chat conversation still runs first, runs after, or is retired.
2. **What does "View Scope" (§4) do?** New action on the generated-widget draft card, no
   interaction data available. Best guess: surfaces the Service/Scope tag for that widget
   (echoing §2d's tag pill), but unconfirmed.
3. **Does the chart-type picker (`onChangeType`/`VIZ_OPTIONS` in `GeneratedWidgetPreview.jsx`)
   have any equivalent in the new design**, or is it dropped in favor of the simpler
   View-Scope/Add/Edit/Regenerate 4-action model in §4? Not shown anywhere in the sampled
   frames.
4. **The mystery 103×20px empty frame next to the Report Builder breadcrumb** (§5c,
   `2032:13022`) — genuinely empty in the source file, not a fetch artifact. Purpose unknown.
5. **"Performance Advantage Index" (breadcrumb, §5c) vs. "SHAPE Performance Index" (Service
   picker, §1a/§1b)** — likely the same concept with inconsistent placeholder copy across mockup
   frames, but not confirmed as intentional or a typo.
6. **Do Drafts (§3a) have a per-item menu at all** (rename/delete/share, mirroring Reports'
   sub-item "..." → Share Report)? No such instance exists in any sampled Drafts frame, but a
   hover-only affordance could simply not have been captured in a static mockup — genuinely
   can't rule this out from a non-interactive file.
7. **No Figma prototype/click-through data was queried** for how a user actually moves between
   full-page (§1–2) → side-modal (§5) → floating (§6). Section 6d's icon-behavior reasoning is
   inference from icon library naming and cross-state consistency, explicitly not confirmed
   interaction data — a future pass could check for prototype links via the Figma UI directly
   (not exposed by the MCP tools used here) if exact trigger-to-state mapping matters before
   implementation.
8. **Frame 4** (`2031:8600`, composer with example text typed) was not examined in this pass —
   unlike the other "skipped" items above, this is a scope decision (budget went to the six
   frames explicitly requested), not a genuine ambiguity in the file. A follow-up fetch on
   `2031:8600` would close this gap cheaply if it turns out to carry information frame 3 didn't
   (e.g. a state showing the send button becoming active/enabled).
9. **Skeleton-shape variant detail** (§5d) — the reference has ~9 distinct placeholder-shape
   archetypes (score-block, metrics-row, evidence+legend, status-block+progress, line-chart,
   bar-chart ×2 orientations, pill-list, blank/"+"-placeholder) against the app's current 3
   (`chart`/`bars`/`metric`). Not pulled to full per-shape pixel detail — flagged as available
   for a follow-up if closer skeleton parity becomes a priority.
