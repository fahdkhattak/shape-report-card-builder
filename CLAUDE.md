# Report Card Builder — CLAUDE.md

SHAPE 3.0's Report Card Builder prototype. Vite + React (JS, not TS). Read
`CLAUDE_CODE_BRIEF.md` and `/docs` before making structural changes.

**The Figma file `984qJvMt7fCHASYHRwgrab` ("SHAPE 3.0 Handoff") is the source of truth for
the actual product** — confirmed explicitly by the user. Where it conflicts with `/docs` (the
original PRD/spec set) or the reference prototype, Figma wins. `/docs` is still useful for
things Figma doesn't show (data model, widget-generation mapping logic, voice/copy rules) —
just don't treat it as authoritative on layout/visuals/flow once a real screen exists for it.

## The dataset (`/data`, `src/data/shape-survey-dataset.json`)

Synthetic response data generated from the real `Survey.xlsx` question set (desktop, not in
this repo) — 100 users × 3 rounds, correlated (not independent-random), with a deliberate
org-wide narrative across rounds. **Wired in** — see `src/lib/dataset.js` (the read layer:
rounding, trend/delta helpers, gender/work-model grouping, real Pearson correlation) below.
Full detail (model, assumptions, known gaps) is in
`data/generate-dataset.js`'s header comment — read that before touching this, don't rediscover
it from scratch. Quick orientation:

- `data/generate-dataset.js` — the generator (`npm run generate` from `/data`, regenerates
  both `data/dataset.json` and `src/data/shape-survey-dataset.json`). Has its own
  `package.json`/`node_modules` (just `xlsx`), deliberately separate from the app's — this is
  build-time tooling, not something Vite should ever bundle.
- `data/export-to-excel.js` (`npm run export`) — dumps the dataset to
  `data/SHAPE_Survey_Dataset.xlsx` for human review (Users / Overall / DriverScores-tidy /
  OrgSummary / Driver-Dimension-Map sheets).
- **Scores are driver- and dimension-level (0-100), not raw per-question Likert responses.**
  The survey has ~145 substantive questions across 12 dimensions (Physical Health,
  Psychological Health, Life Outside Work, Job Satisfaction, Employee Commitment, Employee
  Engagement, Coworker Dynamic, Manager Style, Corporate Culture, Business Essentials,
  Physical Work Environment, Soft Work Environment) and ~45 curated driver tags rolled up from
  the survey's own "Associated Driver" column — full map in `generate-dataset.js`'s
  `DRIVER_DIMENSION` object. Raw item-level polarity (which response option means "good")
  wasn't reliably inferable for every question without manual review, and no current widget
  consumes item-level data anyway — aggregated scores are what `Explorers`, `Your Score`,
  trend widgets etc. actually need.
- Real, demonstrable correlations exist by design (verify with the generator's own console
  output): Sleep↔Stress r≈0.9+, Workload↔Work-life-balance r≈0.7+ — deliberately strong so the
  `insight` generated-widget type has something obvious to surface, stronger than a real survey
  would show.
- Overall-score distribution lands roughly 20% Flourishing / 55% Striving / 25% Struggling
  (banded at the app's existing ≥70/≥40 thresholds) — this took real tuning: a naive
  independent-per-driver-noise model regresses every user to the same overall score via
  double-averaging (driver → dimension → overall) and nobody ever crosses a threshold. The fix
  was a single dominant per-user `wellbeingBaseline` factor applied to nearly every driver.
- Demographics generated per user (gender, department, job level, location, tenure, employment
  status, work model) support the `Avg. Score: Gender`/`Work Model` style segmentation widgets.
- `src/data/shape-survey-dataset.json` is ~700KB — imported directly (eagerly bundled) by
  `src/lib/dataset.js`. Fine for a prototype; reconsider lazy-loading/fetching if this ever
  ships past demo stage.
- `src/lib/dataset.js` is the only thing that reads the raw JSON — everything else (widgets,
  chat) goes through it. It exports round/dimension/driver aggregates (`LATEST`, `PREVIOUS`,
  `dimensionRankedRows()`, `worstDimension()`, `avgScoreByGender()`, `avgScoreByWorkModel()`,
  etc.) plus a `TOPIC_TO_METRIC` map that resolves the chat generative engine's topic labels
  (see `TOPIC_LEXICON` in `src/lib/generativeEngine.js`) to real dataset keys, with `invert`
  support for topics whose natural polarity is opposite the underlying driver's (e.g. "Burnout
  Risk" reads high-is-bad but is derived from "Resilience," where high is good).
- **Library-sourced widgets** (`src/components/widgets/WidgetBody.jsx`) always read full
  org-wide `LATEST`/`PREVIOUS` aggregates — no scoping, per the library-vs-chat-generated rule
  above. Every family (Your Score, Org Status, Explorers, Score History, ENPS, Areas to Focus,
  Avg. Score: Gender, Time Impact) shows real computed numbers; only `Popular Responses` stays
  a hardcoded placeholder since the survey's open-text questions weren't modeled into the
  dataset.
- **Chat-generated widgets** (`src/lib/generativeEngine.js`'s `buildSpec()`) try
  `metricForTopic()`/`correlationForTopics()` first for whatever topic(s) the prompt resolved
  to real dataset keys; a topic with no real counterpart (Diversity, Compensation, Tenure,
  Gender, Location, Onboarding Experience — nothing in the generated dataset scores these)
  falls back to the original `rand()`-based synthetic generation, same as before this was wired
  in. Verified in-browser: "Compare sleep and stress" produces a scatter card reading "Strong
  positive correlation" and a Did You Know card with a real ~95 stat (r≈0.95, matching the
  generator's deliberately strong Sleep↔Stress correlation noted above).

## Project structure

```
/src
  /components
    /library   — LibraryPanel, MiniWidgetPreview
    /canvas    — CanvasScreen, WidgetCard, SkeletonWidgetCard, MenuRow, gridLayout.js
    /chat      — ChatLanding (full-page entry point), GeneratingScreen, GeneratingChecklist,
                 ChatPanel (canvas drawer), GeneratedWidgetPreview, Bubble, quickActions.js
    /widgets   — WidgetBody (library-sourced), GeneratedBody (chat-generated), primitives.jsx (shared)
    /modal     — DetailModal
    /shell     — NavRail (global left nav, present on every screen)
    /ui        — Button.jsx (real Figma `Buttons/Button` component, see below)
  /lib
    tokens.js            — T (color/token object), radius (component radius tokens), font, rand, pick, band
    families.js          — FAMILIES (fixed Library widget families), familyById
    generativeEngine.js  — prompt → widget-spec engine (extractTopics, buildSpec, generateVariants, EXPLANATIONS)
    topicAreas.js        — AREAS + matchAreas(), the opening scoping conversation's topic recognition
    useChatThread.js     — shared {messages, send, pushUser, pushAI, updateVariantTitle, reset} hook
    id.js                — nextId() widget id counter
  /assets
    mascot-avatar.svg, trend-caret-up.svg, trend-caret-down.svg — real assets from Figma
    icon-users.svg, icon-participation.svg — downloaded, not yet used (see Org Score gap below)
  App.jsx
```

Node/npm are installed (winget, `OpenJS.NodeJS.LTS`) and the app has been run and verified
in-browser end to end repeatedly — chat landing, generating transition, canvas (both fresh and
blank-canvas paths), chat generation, drag-and-drop, hover states, detail modal — zero console
errors at every checkpoint.

## Architecture: chat-first flow, one continuous conversation

This was a structural rebuild, not a styling pass — the app used to be a "Landing: two big
choice cards" → separate "GuidedChat" wizard → "CanvasScreen" flow. That's gone. The real
product (confirmed against Figma nodes `12618:39773`, `12618:40160`, `12616:13246`) is:

1. **`ChatLanding.jsx`** — the actual entry point. Nav rail + a full-page, centered chat
   column (not a drawer). Empty state: mascot icon, "Where would you like to start today?",
   composer, a few example-topic starter chips. A subtle "or start from a blank canvas" link
   preserves the PRD's direct-construction door without competing visually with the chat-first
   design.
2. **Scoping phase first, per explicit product direction — no widgets before scope is
   confirmed.** The first exchange runs a topic/driver clarification conversation
   (`lib/topicAreas.js`'s `AREAS` + `matchAreas()`, modeled on
   `docs/mascot-conversation-decision-tree.md` Node 1-2, but expressed as natural mascot
   copy + chips rather than a rigid wizard): a recognized topic gets a direct "sounds like
   this is about X, I'd start with these drivers" response with adjacent drivers offered as
   togglable "these could also be relevant"; an ambiguous topic gets a disambiguation
   question; an unrecognized one gets a "closest matches" fallback with a "none of these —
   just show me widgets" escape hatch. Only once the user confirms (or explicitly skips) does
   `phase` flip to `"open"` and the functional `QUICK_ACTIONS` chip row / **"Create Report"**
   action appear. The confirmed area label + driver list is reported up via `onScopeConfirmed`
   and used to label the eventual report (`App.jsx`'s `scopeInfo`) instead of re-guessing the
   scope from the whole transcript. This scoping step **runs once per session** — later
   messages in the `"open"` phase are ordinary widget-generation requests, not re-triggers of
   topic recognition; re-scoping mid-conversation (Node 3's "anything else?" loop) wasn't built.
3. Clicking **Create Report** → `GeneratingScreen.jsx`: nav rail + a skeleton-loading canvas
   grid (`SkeletonWidgetCard.jsx`, flat gray75 placeholder shapes) + `GeneratingChecklist.jsx`
   (5-step animated checklist, ~1.5s) in the main area, **and the same chat panel now docked
   to the right as `ChatPanel`** — this is the literal "chat becomes a mini version and moves
   to the side, still working" behavior from the real reference.
4. Checklist completes → `CanvasScreen.jsx`, seeded with a default widget set, chat panel
   **already open**, continuing the exact same thread (not reset).
5. Clicking **Add to Report** on a single-widget variant *before* a report exists (still on
   `ChatLanding`) skips the generating screen entirely — it creates a one-widget canvas
   directly and opens the drawer, matching the existing "instant add" pattern used everywhere
   else in the app for single-widget actions.

### The shared thread (`lib/useChatThread.js`)

One hook — `{ messages, send, pushUser, pushAI, updateVariantTitle, reset }` — used everywhere
a conversation happens. `App.jsx` owns exactly **one** instance (`mainChat`), created once via
`useState` inside the hook, and passes it down to `ChatLanding`, `GeneratingScreen`, and
`CanvasScreen`→`ChatPanel`. This is what makes the conversation genuinely continuous across
all three screens instead of resetting at each transition — verified by testing: generate a
widget variant on the landing chat, click Create Report, and the same variant cards (and the
scoping exchange before them) are still in the drawer's scrollback once you land on the canvas.

`send()` is the "generate widget variants" behavior. `pushUser`/`pushAI` are lower-level —
`ChatLanding` uses them directly to drive the scoping conversation (chips, clarifying
questions) without triggering widget generation. **Any AI message pushed via `pushAI` may or
may not have a `variants` array** — `ChatPanel.jsx` and `ChatLanding.jsx` both guard with
`m.variants?.map(...)`, never `m.variants.map(...)`; a real crash from exactly this
(`ChatPanel` assumed every AI message had variants) was hit and fixed while building the
scoping phase — if you add another message-consuming component, guard it too.

`ChatPanel.jsx` calls `useChatThread()` a **second, independent time** internally for the
per-widget "Edit with AI" scoped thread (reset on `editingWidget.id` change) — that one is
intentionally ephemeral and separate from `mainChat`, per `widget-editing-and-variants.md`.

### Panel-opening triggers on `CanvasScreen.jsx` — each panel has exactly one opener

Real bug, fixed: the header's "Add Widget" button and the grid's trailing "+" tile were both
wired to `setChatOpen(true)` — clicking either one opened the **chat** drawer, not the Library.
Combined with `LibraryPanel` defaulting to expanded (`libCollapsed = false`), this meant the
library sat open unconditionally while "Add Widget" silently did the wrong thing, and the chat
drawer could pop open from places that had nothing to do with the mascot. Fixed:
- `LibraryPanel` is **fully unmounted, not a persistent rail, until opened** —
  `CanvasScreen.jsx` conditionally renders it (`{!libCollapsed && <LibraryPanel .../>}`)
  instead of always mounting it and toggling a `collapsed` prop. It used to render a 52px icon
  rail even when "closed"; per explicit product direction that was wrong too — nothing should
  occupy that space until "Add Widget" is pressed. `LibraryPanel.jsx` no longer has a
  `collapsed` prop or rail-rendering branch at all; it only ever renders its full 516px form,
  and takes an `onClose` prop (its internal `×` button) instead of the old toggle-flavored
  `onToggle`.
- The header "Add Widget" button and the grid's "+" tile both call `setLibCollapsed(false)` —
  they open the **Library**, never the chat.
- **The floating mascot avatar button is the only thing that opens `ChatPanel` for the general
  (unscoped) thread.** The one deliberate exception: a widget's "Edit with AI" menu action
  still opens chat directly (`startEdit`) — that's a distinct, explicitly-labeled action that
  inherently needs to show a scoped AI conversation, not a stray trigger of the general chat.

### Nav rail (`components/shell/NavRail.jsx`)

68px, present on every real screen. Rebuilt against the actual `Menu` component
(`htfKAasKxHwztnQLb6ZFad`, node `22562:4084`, `State=Mini` variant `22562:4385`) rather than
inferred from screen mockups alone — structural facts confirmed from the live node:
- Border on **right/top/bottom only** (no left border), radius on the **right corners only**
  (18px/`radius.widget`) — the rail sits flush against the screen edge.
- Each nav item is a 44px hit box wrapping a 36px/`radius.sm` pill, 20px icon centered.
- **Active state is the icon rendered in Accent color, not a background highlight** — confirmed
  from the node's own screenshot (a solid accent dot vs. hollow-outline icons for the rest).
  Earlier version of this file used a gray background pill for active state; that was wrong.
- Avatar is a real 40px `gray100` circle + centered person icon (`lucide-react`'s `User`), not
  a stock photo placeholder.
- Logo is the real SHAPE brand mark — two overlapping gradient paths, downloaded and combined
  into `src/assets/shape-logo.svg` (see its own header comment for the geometry) — not the
  mascot avatar, which is a different asset used only in chat contexts.
- **The real component's 7 top-group + 2 bottom-group nav icons are all exported as the same
  generic "placeholder, circle" glyph** (Figma's own component description literally says
  "placeholder, circle") — their real per-item identities are genuinely undefined, same open
  status as the "4 unlabeled toolbar icons" question in `direct-construction-spec.md`. Rather
  than invent 6 meaningless icons to match the count, `NavRail` only renders the icons whose
  meaning is actually known (Chat/Org/Generate up top, Bell/Admin at the bottom) — 5 total, not
  9. Purely presentational either way — icon destinations/behavior aren't defined anywhere, so
  `active` is just a highlight prop (`"chat"`/`"org"`/`"generate"`), not real navigation.

### What "Create Report" seeds

`App.jsx`'s `finishGenerating()` runs `extractTopics()` (already-existing engine function)
against the conversation's user messages to derive a scope label, then seeds a fixed
your-score/explorers/org-status set — the same baseline the old `GuidedChat`'s
`completeGuided()` used, just derived from freeform conversation instead of an explicit
driver-checklist wizard. **The old structured mascot flow (topic → driver checklist →
insight-type multiselect, per `mascot-conversation-decision-tree.md`) is retired** — it isn't
shown anywhere in the real Figma screens given as canon, and reconciling it with the simpler
chat-to-report flow wasn't attempted. If that structured flow turns out to still be wanted
(e.g. as a step *within* the chat, not a separate wizard), it needs new design reference.

### Retired files

`Landing.jsx`, `GuidedChat.jsx`, `ChipRow.jsx`, `lib/buttonStyles.js`, `chat/IconBtn.jsx` were
deleted, not left as dead code. If you're looking for the old two-card landing chooser or the
step-by-step guided wizard, they no longer exist — see above for what replaced them.

## Design system is now wired to real Figma, not just the doc

`docs/shape-design-system.md` is regenerated periodically from Figma Variables — re-read it
after any "I updated the design doc" message, it may rename/add/correct tokens (a past
revision corrected `colorsRed500` and added `radiusWidget`/`radiusReportCard`, both now used
via `lib/tokens.js`'s `radius` export instead of hardcoded pixel values).

Beyond the doc, two live Figma files are the actual source for component-level fidelity:

- **`htfKAasKxHwztnQLb6ZFad`** ("SHAPE — Form") — the component library. `Buttons/Button`
  lives at node `22494:2499` as a *component set* (1080 variant instances) — too large for
  `get_design_context` in one call; it returns a sparse metadata index instead (bounding
  boxes only, no styles). Fetch **individual variant node IDs** instead (see `Button.jsx`'s
  header comment for the exact ones sampled). Confirmed from real instance data, not the doc
  summary:
  - Sizes: xs=28px/sm=36px/md=48px/lg=60px, height = `max(20px icon, lineHeight) + 2×paddingY`.
  - **`square` type renders at 0px radius in Figma, not the 8px the doc's component table
    claims** — trust the live node, not the doc's one-line summary, when they disagree.
  - The variant property is literally named `link` (not `ghost`), but its CSS variables all
    read `color/button/{theme}/ghost/*` — `Button.jsx` names the prop `ghost` to match the
    token group, not Figma's property label.
- **`984qJvMt7fCHASYHRwgrab`** ("SHAPE 3.0 Handoff") — the actual product mockups. Key nodes
  used so far, so you don't have to re-discover them:
  - `12616:13246` ("AI / Mockup – Minimal") — canvas + chat-drawer-open screen.
  - `12616:13589` ("Side Menu" — Figma's name, not "Chat") — the chat drawer itself. First
    reference used; several details were **superseded** by the newer node below.
  - `12618:39773` ("Chat 1/2/3") — the real entry-point chat screens + nav rail. This is the
    node that established the chat-first architecture (see above) and corrected several
    details from `12616:13589`: user bubbles are white + `colorTextPrimary` (not gray600 +
    white), message text is 16px/24px (not 13px/18px), composer radius is 38px/padding 12px
    (not 16px/8px), quick-action chips repeat after every AI turn (not just the first).
  - `12618:37890` ("CARD") — widget visual corrections, see below.
  - `12618:45262` — Add Widget panel corrections, see below.
  - `12618:40160` — the generating/loading screen, see Architecture above.
- `mascot-avatar.svg`, `trend-caret-up/down.svg` were downloaded from temporary Figma asset
  URLs (expire ~7 days) and committed to `/src/assets` — download-and-commit is the pattern
  for any future real asset pulls, never leave a temp `figma.com/api/mcp/asset/...` URL in
  code. `icon-users.svg`/`icon-participation.svg` are downloaded but not yet used (see Org
  Score gap below). Two other downloaded SVGs (a status face icon, a person icon) were inlined
  as recolorable React components instead of kept as files — `StatusFaceIcon`/`PersonIcon` in
  `primitives.jsx` — because the real design only exports one fixed-color instance each, and
  our status/tier colors need to recolor the same shape (unconfirmed assumption — Figma may
  have genuinely separate per-status icon assets; nobody's checked).

### Widget visuals corrected against node `12618:37890`

`primitives.jsx`, `WidgetBody.jsx`, and `GeneratedBody.jsx` were corrected against the real
"CARD" reference (11 widgets):
- **`DriverRow` no longer takes a boolean `ok` flag** — tier (green/amber/red) is now derived
  from the value itself via `driverTier()`/the existing `band()` thresholds (≥70/≥40/else), so
  a row's color always agrees with its number. This also **fixed a real data bug**: the old
  hardcoded Explorers data had 76 and 70 marked red and 44 marked red, when `band()` puts all
  three in green/amber — the grouped `DriverGroupedList` (new; renders Great/Average/Poor
  section headers, matching the real design) surfaced this immediately when tested.
- `TrendPill` now uses the real caret SVGs and a two-tone treatment (delta number = strong
  shade/Semibold, "since last round" = base shade/Regular) instead of one flat color.
- `StatusRing` no longer draws a hand-built ring/donut — the real design has no ring at all,
  just a flat status-colored circle icon (`StatusFaceIcon`) + 20px bold label (was 15px).
- `MiniBarChart` bars are right-edge-rounded only (was both edges), no full track fill (was
  always-visible gray track), and there's now a 0/100 axis row — also fixed the 4th
  gender-chart color from `gray200` to `gray300` to match the real "Prefer.." bar.
- `Sparkline` now renders Y-axis gridlines/labels (100/50/0) and only marks the **last two**
  points, not every point; `xLabels` prop replaces the old sibling `<div>` of hand-written
  round labels (which had a latent bug: 4 data points but only 3 labels — now always
  `points.length` labels).
- `Treemap` label sizes corrected (10→11px header, 16→20px bottom-tile values).
- `StatusBreakdown` now shows a small person icon per stat (`PersonIcon`, recolored per tier).
- **Not implemented** — flagged as a real gap, not silently dropped: the Org Score widget's
  real design has an extra "stat row" (Employees count + Participation Rate, each with its own
  icon — assets already downloaded, see above) that our `your-score` case doesn't render at
  all. Skipped because adding it risks overflowing the fixed 344×344 2×2 layout without visual
  iteration; do this properly with the real widget open in-browser, not blind.
- **Also skipped**: the real design has a distinct "Avg. Score: Work Model" widget
  (Onsite/Remote/Hybrid) alongside "Avg. Score: Gender" — a second instance of the same
  horizontal-bar pattern that doesn't exist in `FAMILIES` at all. Worth adding as a new library
  family later.

### Add Widget panel corrected against node `12618:45262`

- **Panel width is 516px**, not the 320px guess (`LibraryPanel.jsx`).
- Search placeholder color is `T.gray400` (`#908d8e`, newly added token) — styled via a scoped
  `.placeholder-gray400::placeholder` rule in `index.css` (inline `style` can't target
  `::placeholder`, don't try).
- **Hover state on a library preview card** (`MiniWidgetPreview.jsx`) — dark 15%-opacity
  multiply-blend scrim, plus a floating white pill toolbar (top-right) with three ghost icon
  buttons: `+` (quick-add, wired to `onQuickAdd` → `CanvasScreen`'s `addLibraryWidget`,
  bypasses drag entirely), info (inert — no info content defined anywhere yet), and `x` (inert
  — no remove-from-library concept exists). Hovering `+` shows an "Add to Report" tooltip.
- **Custom drag ghost** — `setWidgetDragImage()` in `MiniWidgetPreview.jsx` builds a full-size
  (164px), 78%-opacity DOM node at drag time and passes it to `dataTransfer.setDragImage()`,
  replacing the browser's default scaled-down drag thumbnail.
- **Drop-target feedback** — `CanvasScreen.jsx` tracks `dragOverCanvas` (set on
  `dragEnter`/cleared on `dragLeave`/`drop`) and swaps the trailing "+" add-tile (or the whole
  empty-state box) for a flat, borderless `T.gray50` rounded rect while a library item is being
  dragged over — an approximation of the real per-cell hover placeholder: since our widgets
  always append to the end of the array (no arbitrary-position drop), highlighting the tile at
  the real insertion point is both accurate to actual behavior and visually correct, rather
  than faking a precise cursor-tracked cell that wouldn't match where the widget actually lands.
- Confirmed **no delta** (already correct): category row structure (name/count/chevron, no
  badge despite older doc language), the chevron-left/right horizontal scroll pattern, preview
  card sizing. The `direct-construction-spec.md` open questions (4 unlabeled toolbar icons in
  the collapsed rail, "+ tile vs. Library drag") are **still unresolved** — this node never
  shows the collapsed 52px rail state.
- **Real bug fixed, then the whole card rebuilt against a dedicated reference**: first pass
  fixed `MiniWidgetPreview` always assuming a 164×164 native card regardless of the form's
  actual size (a 2×2 form renders more content — evidence bar, explanation text — than 1×1, and
  was getting crammed into a box a quarter the area it needed). Second pass rebuilt the whole
  component against node `12629:51747` ("SHAPE 3.0 Handoff"), which the user pointed at
  specifically for this: the real display unit is a **fixed 192×190px slot** (`SLOT_W`/`SLOT_H`,
  exported from `MiniWidgetPreview.jsx`), not a 100×100 box — the widget card renders at its own
  scaled-down size **centered inside** that slot with real margin around it, not filling it.
  Scale isn't constant across sizes either: confirmed from the reference, 1×1 displays at 100px
  (scale ≈0.61) while 2×2 displays at 145px (scale ≈0.42) — bigger widgets are shrunk more, not
  by the same ratio. `LibraryPanel.jsx`'s wrapping card width and horizontal-scroll paging
  amount both now reference `SLOT_W` instead of a hardcoded 100.
- **Hover toolbar anchors to the slot's corner (top:8/right:8 of the 192×190 box), not the
  card's** — since the card is much smaller than the slot, this is a materially different
  relationship than "toolbar overhangs the card edge" (what an earlier pass assumed). Buttons
  are real size now too: 28px hit target, **20px icon** (was 16px/10px) — confirmed from the
  reference, not a guess. Per-button hover states use real token colors: add/info use Brand
  Ghost hover (`T.gray75`), delete uses Destructive Ghost hover (`#feebee`) — distinct from each
  other, not one shared hover style. Tooltip ("Add to Report") styling corrected to match: no
  arrow, `radius.md` (8px), 12px/8px padding, `T.gray25` background.

### Generated-widget "smartness" (`lib/generativeEngine.js`)

Feedback: generated widgets often looked unrelated to what was actually typed. Root cause —
when a prompt didn't hit any `TOPIC_LEXICON` keyword, every fallback used a fixed, unrelated
hardcoded topic ("Sleep Quality", "Stress Levels", "Overall Score") regardless of what was
typed, *and* `scatter`/`insight` (both need two real topics to mean anything) could still be
picked at random as the `tertiary` variant even with zero topics found, silently triggering
that same wrong-topic fallback. Fixed:
- `TOPIC_LEXICON` roughly doubled (retention/turnover/morale/collaboration/leadership/growth/
  career/training/trust/communication/autonomy/flexibility/hybrid/etc. added) — more real
  prompts now hit a genuine keyword instead of falling back at all.
- Every remaining fallback (`trend`, `metric`, generic `bar`/`ranking`/`status` titles) now
  derives from the actual prompt text via `titleFromPrompt()` (previously written but unused)
  instead of an unrelated fixed string — a widget's title always traces back to what was typed.
- `scatter`/`insight` are excluded from the random variant pool entirely when fewer than two
  topics were found, rather than relying on downstream fallback text to paper over a mismatch.
- This is still a scripted heuristic engine, not a real model — "smartness" here means
  never visibly contradicting the prompt, not true language understanding. A genuine LLM-backed
  generator (mentioned as a likely future direction — "probably gonna have an AI agent that
  makes the widgets") would replace this file's `buildSpec`/`generateVariants`, not extend it.

### `GeneratedWidgetPreview` spacing

Was cramped (marginTop 8, gap 10, no card boundary around the whole thing). Now wrapped in a
bordered/padded container (16px padding, 16px radius) with larger internal gaps throughout
(card-to-info 16px, explanation margin-top 14px with 1.6 line-height, action row margin-top
16px) — reads as one cohesive card instead of loosely stacked elements.

## The `Button` component

`src/components/ui/Button.jsx` replaces the old ad-hoc button style objects everywhere except
the Library panel's own chrome (collapse toggle, search) and the widget card's three-dot menu,
which stayed as lightweight local styles — those weren't sampled against real Figma data and
forcing the full color-table component onto every micro icon-trigger isn't an improvement
without real data backing it.

Props: `theme` (`accent`/`brand`/`destructive`) · `variation` (`primary`/`secondary`/`ghost`)
· `size` (`xs`/`sm`/`md`/`lg`) · `shape` (`round`/`square`) · `iconLeft`/`iconRight` · `disabled`
· `loading`. Omit `children` for an icon-only button — padding switches to the square icon-only
formula automatically. Color tables per theme/variation are the literal hex values from
`docs/shape-design-system.md` §2.3 (light mode only — this app doesn't have a dark-mode pass).

**Theme usage found in real mockups, follow this rather than guessing:** chat panel chrome
(New Chat, close, composer icons, quick-action chips) is all `theme="brand"`. The canvas
header's "Add Widget" is `theme="brand" variation="ghost"` — *not* `accent`, despite the old
design doc's "user-facing report actions → Accent" guidance; trust the sampled instance.
`theme="accent"` is used for the "Create Report" / send-in-empty-composer style primary CTAs.

## Grid — fixed pixels, never fractional

6-column grid, 16px gaps. `CELL = 164`, `GAP = 16` (`src/components/canvas/gridLayout.js`).
- 1×1 = 164×164px
- 2×2 = 344×344px (164×2 + 16)
- 3×3 = 524×524px — used for Index-type composites per `direct-construction-spec.md`,
  **not yet implemented**. Formal Widget Spec addition is an open action item owned by
  Fahd/Amna per the PRD.

This must match the real Figma canvas math exactly. Do not let it drift to `fr` units, `%`,
or any responsive/fluid sizing.

## Two widget kinds — different rules, do not blur them

| | **Library-sourced** (`widget.kind === "library"`) | **Generated** (`widget.kind === "generated"`) |
|---|---|---|
| Defined by | Fixed `familyId` + `formIndex` into `FAMILIES` (`lib/families.js`) | A `spec` object built by `generativeEngine.js` |
| Body renderer | `WidgetBody` (`components/widgets/WidgetBody.jsx`) | `GeneratedBody` (`components/widgets/GeneratedBody.jsx`) |
| Data scope | Full org-wide by default. **Never add a scope/filter control on a Library widget.** | Can be narrowed — but only via chat, at generation or edit time |
| "Change widget" | Yes — cycles `formIndex` within the same family, instant, no AI | N/A — no family to cycle |
| "Edit with AI" | Opens chat scoped to the widget; AI drafts a fresh `generated` spec | Same mechanism |
| Commit behavior | Change Widget is immediate | AI edits are draft-only until "Replace" is pressed in chat |

A widget on canvas is one object: `{ id, kind, familyId?, formIndex?, spec?, customTitle? }`.
`kind` decides which branch every downstream component takes — see `WidgetCard.jsx`,
`DetailModal.jsx`, `ChatPanel.jsx`.

## Widget anatomy (every widget)

Header → Insight → Evidence (optional) → Action Bar (optional) → Control Menu (hover-only,
three-dot, dims the card ~3% on hover). Don't skip sections or invent new ones without
checking `SHAPE-Widget-Spec.md`. The shared primitives for building these bodies live in
`components/widgets/primitives.jsx` (`Header`, `TrendPill`, `BigNumber`, `Sparkline`, etc.) —
reuse these rather than hand-rolling new markup for a similar shape.

## Status color rule

Flourishing/Striving/Struggling and any status-coded data → brand Red/Amber/Green
(`T.red`/`T.amber`/`T.green` family in `lib/tokens.js`). Never the Graph/Dataviz palette for
status. Category comparisons (gender, work model, etc., non-status) → Graph palette
(`T.teamBlue`, `T.hotPink`, `T.goldenYellow`, `T.lavender`, `T.turquoise`, ...).

## Generated widget titles

Never a raw slice of the user's prompt — curated per `vizType` inside `buildSpec()`
(`lib/generativeEngine.js`). Every generated spec carries a required one-line `explanation`
(see `EXPLANATIONS` map) — surfaced under the widget preview in chat and in the Detail Modal's
"Why this widget" panel.

## Draft/approve pattern

Editing a placed widget never mutates it directly. `ChatPanel` renders the *actual current
widget* inline (via `WidgetBody`/`GeneratedBody`) under "Currently on canvas" before showing
the new draft. The draft is a `GeneratedWidgetPreview` card with Replace/Regenerate controls;
only `onReplaceWidget` (fired by "Replace") swaps the canvas widget. Regenerate re-runs
`generateVariants` on the same prompt text.

## Widget economy correction pass (against `12635:69176`, "Collated Widgets")

A full-catalog Figma audit — 61 widget instances across ~15 families — driven by an explicit
walkthrough of what each widget's underlying data actually means (flourishing/striving/
struggling banding, Explorers=dimensions vs. Factors/drivers, the Index widget, etc.). Two
research docs hold the full detail and should be read before extending any widget further:
`docs/figma-widget-audit-existing.md` (corrections to families we already had) and
`docs/figma-widget-audit-new.md` (full specs for families we didn't, incl. the Index widget's
geometry). What actually shipped from them, vs. what's cataloged-but-deferred:

**Shipped:**
- **Fixed a real overflow bug**: `your-score`'s 1x1 form rendered the full trend pill (caret +
  number + "since last round") in a 132px content box — Figma's own 1x1 instances always use
  the caret-only `compact` mode, which `TrendPill` already supported but the 1x1 case never
  used. Also added the `/100` unit Figma always shows there.
- **`TrendPill` gained a third mode**, `numberOnly` (caret + colored number, no trailing text) —
  matches Figma's per-row trend style; `DriverRow` now uses it instead of `compact`.
- **Tier header color fix**: `DriverGroupLabel`'s Great/Average/Poor headers now use the base
  status color (`T.green`/`amber`/`red`), not the Strong variant — Figma uses base there, Strong
  only for the row values.
- **"Areas to Focus" corrected to its actual product meaning** — per explicit correction, this
  widget highlights the worst-scoring *demographic group* (department, tenure band, etc.), not
  the worst-scoring dimension. `worstDemographicGroup()` (`lib/dataset.js`) scans all seven real
  demographic axes (no ethnicity/age field exists, unlike Figma's own ethnicity-based sample —
  see the audit doc) and replaces the old `worstDimension()` call.
- **`StatusBreakdown` row order + icon** corrected (label row on top, value+icon below; a
  two-person "users" glyph, not the single-person `PersonIcon`) and **`Sparkline`'s gridlines**
  widened from 3 to 6 lines (0/20/40/60/80/100) — both confirmed against real instances.
- **Two new "quick win" families**, both backed by data helpers that already existed or were
  trivial to add: **Factors** (`driverRankedRows()`, same `DriverGroupedList` visual as
  Explorers but driver- not dimension-ranked) and **Avg. Score: Work Model**
  (`avgScoreByWorkModel()` was already written and unused — new `T.orgBlue` token added for its
  Onsite bar color).
- **`score-history`'s family size corrected** from 1x1 to 2x2, matching its real Figma frame.
- **The Index Widget** (`IndexRing` in `primitives.jsx`, new `index` family, 2x2 + 3x3 forms) —
  the flagship ask of this pass. Center = overall score (`LATEST.avgOverall`, banded), one ring
  around it = all 12 dimensions ("Explorers"), each wedge colored/valued via `dimensionValue()`;
  the 3x3 form adds a second ring subdividing each dimension's wedge into its own drivers via
  `DIMENSION_DRIVERS` (built from `raw.meta.driverDimensionMap`, exported from `dataset.js`).
  Rendered as computed SVG annular sectors (`describeArc`/`polar` helpers), not Figma's exported
  per-wedge images, so it works for any dimension's actual driver count (2–7, not a fixed 10).
  **This deliberately does not match the single Figma "Index Widget" instance actually sampled**
  (`12637:71238`/`71336`), which turned out to be a *per-dimension* drill-down ("Corporate
  Culture INDEX": one dimension's score at center, its drivers as the only ring) rather than the
  org-wide overview described when this was commissioned — see the long comment above
  `IndexRing` in `primitives.jsx` for the full reasoning. The org-wide version was built instead
  because it's what was explicitly asked for and, unlike the sampled instance's own 3x3 (which
  needs individual-survey-item scores this dataset doesn't have), it's fully buildable from real
  dimension+driver aggregates with nothing fabricated. `gridLayout.js` and `MiniWidgetPreview.jsx`
  were both generalized to support 3x3 sizing (previously only 1x1/2x2 existed anywhere).

**Cataloged but deferred** (full specs already written in `docs/figma-widget-audit-new.md`, not
implemented this pass — flagged, not silently dropped):
- **Mental Wellbeing** (Team/Org/Personal) — buildable today as an approximation via inverting
  the `Stress`/`Anxiety`/`Depression` drivers, but needs new severity-band UI + a design call on
  two new colors (`#0074bc` team-blue variant, Likert severity pill colors).
- **Health Age** — fully specced visually, but blocked on a real gap: no age/DOB field exists
  anywhere in the generated dataset. Do not fake one to unblock this.
- **Time to Gain** (`SH.TME-GAN`) — a distinct proprietary multi-metric insight, not the same
  thing as our existing `time-impact` family (`SH.TME-ADV`, confirmed by matching header text) —
  `time-impact` itself is still missing its Team/Org color+trend variants from Figma.
- **Score Comparison** (`SH.SCR-CMP`, Your/Team/Org score list) — not built because our data
  model has no real "Team" or per-user "Your Score" concept distinct from the org-wide aggregate
  (library widgets are always org-wide per the rule below); building it would mean faking three
  numbers that are actually the same number.
- **EAP Service** nudge card, **Org Heat Map** (explicitly deprioritized by the user), and a real
  6-tile `Popular Responses` treemap (currently still a 3-tile placeholder, two of the six real
  colors don't exist in `tokens.js` yet) — all fully specced, not built.
- **ENPS's evidence row** shows Flourishing/Striving/Struggling counts under an eNPS-labeled
  card — Figma's real card shows Promoters/Passives/Detractors, which needs a small
  `data/generate-dataset.js` addition (bucketing eNPS responses), not just a `dataset.js` read-
  layer change, so it wasn't done in this pass.

## Topic resolution + generative chart expansion pass

Follow-up to the widget-economy pass above, once real data existed to make the chat and
chat-generated widgets genuinely "understand" a prompt rather than pattern-matching a curated
keyword list.

### `lib/topicResolver.js` (new) — scores prompts against the real dataset catalog

Previously two separate, narrower systems: `topicAreas.js`'s `AREAS` (8 curated topic areas,
hand-picked keywords) for the mascot's opening scoping conversation, and
`generativeEngine.js`'s `TOPIC_LEXICON` (~25 keyword → label pairs) for chat-generated widget
topic extraction. Neither scanned the real catalog — a prompt not on either list fell back to a
generic "closest match" or synthetic random data even when real drivers existed for it.
`topicResolver.js` replaces both extraction paths with one scorer that ranks a prompt's tokens
against **all 12 real dimensions and ~45 real drivers by name** (auto-derived keywords from each
name, plus a small curated synonym overlay for common alternate phrasing — `DRIVER_SYNONYMS`/
`DIMENSION_SYNONYMS`), so most real prompts now resolve to something genuine instead of needing
a bespoke lexicon entry.

- `extractTopics(prompt)` — ranked real dimension/driver/concept names the prompt resolves to;
  used by `generativeEngine.js`'s `buildSpec()`/`generateVariants()` (unmapped topics — e.g.
  Diversity, Compensation, still nothing in the generated dataset scores these — fall back to
  the previous synthetic `rand()` generation, same safety net as before).
- `findScope(prompt)` — powers the scoping conversation. Tries a real **dimension** match first
  (`kind: "dimension"`, matched drivers = that dimension's own worst-3-scoring real drivers, so
  "I'd start by looking at X, Y, Z" surfaces genuine areas of concern, not an arbitrary subset).
  Failing that, per **explicit product direction** ("use your judgement to collect a good amount
  of drivers to form a new dimension bespoke to the query"), assembles a **bespoke cluster**
  (`kind: "bespoke"`) from whichever individual real drivers scored best against the prompt,
  synthesizes a label from them (e.g. a prompt about "values... empowered... proud" with no
  single matching dimension yields a real "Values & Empowerment" cluster: `[Values, Empowerment,
  Pride]` matched, `[Leaders, Collaboration, "Policies and Practices", Morale]` suggested — all
  real Corporate Culture drivers, not fabricated). Only returns `null` (triggering the true
  fallback to curated `AREAS` + the "just show me widgets" escape hatch) when literally nothing
  in the real catalog scored above zero.
- `dataset.js`'s topic-metric layer was generalized to match: `metricForTopic()`/
  `correlationForTopics()` now accept a real name directly (no lookup table needed for the common
  case), the small `CONCEPTS` overlay (currently just "Burnout Risk" → inverted `Resilience`) for
  the few concepts whose natural polarity runs opposite an underlying driver's, **or** a bespoke
  `{ label, drivers }` cluster object — computing that cluster's value/trend/correlation as the
  real average across its drivers, the same operation the generator used to build the 12 real
  dimensions in the first place. Not fabricated data, just a fresh real aggregate.
- `ChatLanding.jsx`'s scoping flow was refactored around a single unified "scope" shape (`{
  label, matched, suggested, kind }`) used for curated areas, real-dimension matches, and bespoke
  clusters alike — messages now carry the resolved scope object directly (`m.scope`) instead of
  an id re-looked-up via `areaById()`, since bespoke scopes are generated on the fly and have no
  id to look up.

**Real bug found and fixed while testing this**: `ChatLanding`'s scoping-vs-open `phase` was
local `useState` that reset to `"scoping"` on every remount — including navigating back to
landing from the canvas (`CanvasScreen`'s back arrow → `App.jsx` `onExit` → `setScreen
("landing")`). Since `mainChat`'s message history is lifted to `App.jsx` and survives the
remount, a user who'd already confirmed scope and generated widgets, then went back and typed a
new prompt, got silently misrouted into the scoping conversation's fallback branch instead of
generating a widget — confusing, and specifically undermined this pass's own topic-resolution
work by showing the wrong response type. Fixed by lifting the confirmed-or-skipped signal
(`App.jsx`'s existing `scopeInfo` state, already non-null the moment `onScopeConfirmed` fires
either way) down as a prop and seeding `phase`'s initial value from it
(`useState(scopeInfo ? "open" : "scoping")`) instead of always starting at `"scoping"`.

### Two new chat-generated chart types — `Gauge` and `RadarChart` (`primitives.jsx`)

Per explicit direction to make chat-generated widgets support "all kinds of graphs" as long as
they fit the header+insight anatomy:

- **`Gauge`** (`vizType: "gauge"`, 1x1) — a 270° radial dial (90° gap at the bottom, reusing the
  Index Widget's `polar()` arc math above) with a single banded-color value arc over a pale
  track and the number centered inside. A faster read than a bare number for "how's X doing"
  single-topic prompts.
- **`RadarChart`** (`vizType: "radar"`, 2x2) — a spider/polygon chart, one spoke per driver in a
  cluster, gridline rings at 25/50/75/100, a filled polygon connecting each driver's real value,
  radially-placed name labels (same left/right text-anchor branching as the Index Widget's ring
  labels, via the shared `RingLabel` helper). Deliberately built to showcase the bespoke-cluster
  work above: `radarTopics()` in `generativeEngine.js` widens a short topic list into a fuller
  cluster by pulling in sibling drivers from the same dimension(s), so even a single-topic prompt
  gets a real multi-spoke shape, not a degenerate 1-2-point one. The *shape itself* becomes the
  insight — a dent on one spoke is the one driver dragging the group down — rather than requiring
  a reader to scan a list of numbers.
- `generateVariants()`'s heuristics updated accordingly: `radar` is now the primary pick when 3+
  real topics resolve (or an explicit "radar"/"spider"/"snapshot"/"profile" keyword appears);
  both new types are in the secondary/tertiary random pool alongside the existing seven.
- Verified in-browser end to end: a bespoke-triggering prompt correctly produced the "Values &
  Empowerment" scope with real Corporate Culture drivers; the follow-up widget prompt produced a
  real radar (6 real driver values), a real correlation insight card, and a real gauge — zero
  console errors throughout, including the phase-reset regression test after the fix above.

## UX pass — editability, discoverability, honesty, responsiveness

Follow-up to a UX self-review (trust/honesty problems, structural gaps, moment-to-moment
friction) the user then triaged item by item — some built now, some explicitly deferred to their
own judgement calls, recorded here so the reasoning isn't lost.

**Built:**
- **Real-vs-estimated disclosure, `Header`'s new `estimated` prop** — every generated spec now
  carries `spec.real` (set per-`vizType` case in `generativeEngine.js`'s `buildSpec()`, based on
  whether `metricForTopic()`/`correlationForTopics()` actually resolved or fell back to
  `rand()`). When false, a small 5px dot renders after the title with a `title` tooltip
  ("Estimated — no close survey data for this topic yet") — deliberately minimal, no color/
  urgency cue, just enough to notice on close inspection. Wired everywhere a generated widget's
  title renders: `WidgetCard` (canvas), `GeneratedWidgetPreview` (chat draft card),
  `MiniWidgetPreview` (library "Your Widgets" tab). `spec.explanation` also gets a plain-language
  suffix ("shown as an estimate") in the same case. This was judged the more important disclosure
  than labeling *which chat clusters are bespoke* (the original ask) — the real risk is a
  fabricated number reading with the same confidence as a real one, not which specific
  methodology produced a real one.
- **Chart-type picker + true single-widget regenerate** (`GeneratedWidgetPreview.jsx`,
  `useChatThread.js`'s new `regenerateVariant(msgIndex, variantIndex, vizType?)`) — a
  Power-BI-style dropdown (via the existing `MenuRow`) listing every `vizType` by friendly name
  (Number/Trend Line/Gauge/Bar Chart/Ranked List/Radar Chart/Status Badge/Scatter Plot/Did You
  Know), filtered to hide Scatter/Did-You-Know when the originating prompt didn't resolve 2+
  topics. Picking one re-runs `buildSpec()` for *that slot only* — the other variants next to it
  are untouched. The existing refresh icon was rewired the same way (re-rolls the same chart type
  with fresh data) instead of its old behavior of calling `send()` again and replacing all three
  variants. This single feature was the direct answer to three separate complaints at once:
  chart-type discoverability (the dropdown lists them by name), editability ("give me Power-BI-
  style options"), and "regenerating shouldn't spawn three more."
- **Library panel "Library" / "Your Widgets" tabs** (`LibraryPanel.jsx`, extended
  `MiniWidgetPreview.jsx` to accept a `spec` directly instead of only `familyId`/`formIndex`) —
  segregates the fixed service catalog from widgets assembled via chat, per explicit direction
  ("created by you" vs "created by the service"). "Your Widgets" mirrors whatever `kind:
  "generated"` widgets are currently on canvas (`CanvasScreen.jsx` passes `widgets.filter(w =>
  w.kind === "generated")` down); click-to-add duplicates one back onto canvas, delete removes it
  — both wired straight to `CanvasScreen`'s existing `addGeneratedWidget`/`removeWidget`. Not
  draggable (unlike the fixed catalog) — serializing a full spec through `dataTransfer` was judged
  not worth it for this pass; click-to-add covers the same need.
- **Horizontal variant layout + typing indicator** — the vertical stack of variant cards became a
  horizontally-scrolling row (fixed-width cards in a `overflowX: auto` flex container) in both
  `ChatLanding.jsx` and `ChatPanel.jsx`, cutting down the scroll depth of a single AI turn. A new
  `TypingDots` (`Bubble.jsx`, `@keyframes typingBounce` in `index.css`) replaces the previous
  silent/instant gap — `useChatThread.js`'s `send()` now resolves after a short delay with a
  `typing` flag exposed from the hook; `ChatLanding.jsx`'s scoping-flow delays (`presentScope`/
  `confirmScope`/`skipScoping`/the fallback branch) got the same treatment via a local
  `scopingTyping` flag, so the *whole* conversation reads as considered, not just widget
  generation.
- **Data-driven starter chips** (`ChatLanding.jsx`'s `liveStarterChips()`) — the three empty-state
  suggestion chips are now `dimensionRankedRows().slice(-3).reverse()` (today's three actual
  worst-scoring real dimensions, worst first) instead of three fixed labels, so the very first
  thing a new session sees already reflects current data.
- **Responsive grid — 6/4/2 columns** (`gridLayout.js`'s new `colsForWidth()`,
  `CanvasScreen.jsx`) — a `ResizeObserver` on the canvas's scroll container drives a `cols` state
  (6 at full desktop width, 4 once space gets tight, 2 at mobile widths), feeding both
  `gridTemplateColumns` and the report-card/empty-state width. Cell size itself never changes
  (per the fixed-pixel rule elsewhere in this doc) — only how many fit per row, which existing
  `gridColumn: span N` widget cards already handle correctly with no per-widget changes needed.
  Verified at 1300px (6 cols), 1050px (4 cols), and 375px/mobile preset (2 cols, with expected
  horizontal scroll at true mobile width since nav rail + card chrome weren't also
  compressed — out of scope for "without this becoming a whole thing").

**A real bug found and fixed while testing this pass**: `ChatLanding`'s scoping-vs-open `phase`
was local `useState` that reset to `"scoping"` on every remount — including navigating back to
landing from the canvas (`CanvasScreen`'s back arrow → `App.jsx`'s `onExit` → `setScreen
("landing")`). Since `mainChat`'s message history is lifted to `App.jsx` and survives the
remount, a user who'd already confirmed scope and generated widgets, then went back and typed a
new prompt, got silently misrouted into the scoping conversation's fallback branch instead of
generating a widget. Fixed by seeding `phase`'s initial value from `App.jsx`'s existing
`scopeInfo` (`useState(scopeInfo ? "open" : "scoping")`) instead of always starting at
`"scoping"`.

**Explicitly deferred, per the user's own scoping calls, not silently dropped:**
- **Demographics dataset expansion** (age, country, ethnicity, education, etc., beyond the seven
  axes already generated) — the user said skip if too long; deliberately not rushed into this
  pass given the ethical care synthetic ethnicity/age data deserves (no field should be generated
  in a way that could read as the dataset "deciding" a demographic group scores worse — any real
  variation must come from independent random sampling, never a designed correlation). Worth a
  focused follow-up, not a bullet in a larger pass.
- **Org/Team/Personal perspective question** at the start of the scoping conversation, and
  "Your Score" actually meaning something different per perspective — the user explicitly said
  "okay for now." A cosmetic rename (e.g. "Your Score" → "Org Score") without also building real
  per-team/per-person data segmentation would be worse than not touching it: it would look fixed
  while still being architecturally the same org-wide aggregate underneath. Needs real design
  thought on what "Team"/"Personal" scope even means against a dataset with no per-user or
  per-team identity concept today, not a label swap.
- **Detail Modal's per-family "What this means" copy** — user said it's covered elsewhere by
  specs not yet shared; left untouched this pass.

## Nav rail — fully interactive sidebar (984qJvMt7fCHASYHRwgrab, node 11923:46254)

`components/shell/NavRail.jsx` was rebuilt from a static 68px icon strip into the real, fully
interactive `Menu` component — every state researched against Figma first
(`docs/figma-sidebar-audit.md`, 9 states covering Default/Expand/Logo hover/Menu hover/Profile
menu/Your Reports/Report share menu/Extra Links/Switch Accounts; the 4 Pending Surveys states
were explicitly skipped, out of scope for now).

**Collapsed (69px) vs. expanded (300px) is not a label toggle** — confirmed from Figma and now
true in code: collapsed shows 3 nav icons (Chat/Org/Generate) + 2 bottom icons, matching the old
static rail exactly; expanded shows **5** nav items (adds Search and Library, which don't exist
collapsed, per Figma's own labels Home/Search/Store/Create/Library — kept as Figma's literal copy
while `active` still matches the app's real screen ids), a 3rd bottom icon ("more"), a full
"Your Reports" section, and name/email/chevron under the avatar (vs. just the avatar collapsed).

**Real interactivity, not just visual states**: expand/collapse (click the logo collapsed, or a
dedicated `PanelLeft` button expanded), instant hover-tint feedback on every nav pill/ghost
button (three real tokens — `gray25` nav-item hover, `gray75` ghost-button hover, `gray100`
ghost-button "menu open" — kept distinct per the audit, not collapsed to one gray), a
short-delay tooltip in collapsed mode, an expandable "Your Reports" list (sample data,
`navRailData.js` — this app has no multi-report backend, so it's honest presentational content
matching Figma's own sample report names verbatim, not invented placeholder text) with its own
per-report expand-to-sub-items and a per-sub-item "..." → Share Report menu, a cascading Profile
menu (Settings/Rate Us/**Switch Accounts → nested flyout**/Sign out) anchored above the avatar,
and an Extra Links panel (SHAPE/Resources/Legal columns + Website/LinkedIn footer) triggered from
the bottom row's "more" button. Every floating menu shares one shell (`FloatingMenu`: `gray25`
rows, `radius.lg`, one shared 5-layer shadow) and is deliberately allowed to overflow the rail's
own edge into the canvas rather than being clipped — confirmed real behavior across every
floating menu sampled in Figma, not a mockup mistake.

**Real bug found and fixed while building this**: the Extra Links panel was first anchored
`right: 0` (grow leftward from the trigger), which put its left edge off the visible viewport
entirely since the nav rail sits flush against the browser's own left edge with nothing further
left to overflow into — the SHAPE column was rendering fully off-screen. Fixed by anchoring
`left: 0` instead (grow rightward, into the canvas), matching every other floating menu's
direction and Figma's own `left:284` position for this exact panel.

**`expanded` is lifted to `App.jsx`** (`navExpanded`/`onNavExpandedChange`, threaded through all
three screens the rail renders on), not local `useState` inside `NavRail` — a local-only flag
would silently reset to collapsed on every screen transition (landing → generating → canvas each
mount a fresh `NavRail`), the exact class of bug already found and fixed once this session for
the chat scoping phase. Verified in-browser: expand on landing, confirm scope, create a report,
land on canvas — the rail stays expanded the whole way through.

**Motion, not fixed-duration CSS transitions**, per explicit direction to apply Apple's
interaction-design principles (loaded via the `apple-design` skill): installed the `motion`
package and used critically-damped springs (`bounce: 0`) for every structural move (rail width,
section expand/collapse) since none of these carry gesture momentum to preserve/hand off, plus
short pop-in springs for every floating menu, each anchored to (and scaling from) the control
that opened it rather than a generic center-fade — the "anchor to source" spatial-consistency
principle. Hover feedback itself is instant (no transition delay on the color/background change);
only the secondary tooltip has a short 100ms show-delay to avoid flicker while scanning past
several icons quickly.

Known simplification, stated plainly rather than silently: the avatar is still a generic person
icon on a gray circle (no real per-user photo exists in this app, same honest fallback the
original rail already used) — Figma's own canonical avatar is a photo placeholder, not an icon.

### Follow-up fix pass — clipping, portal dismissal, and a real color correction

User-reported after the initial build: hovers/menus were clipped in the collapsed rail (with a
spurious horizontal scrollbar appearing alongside), the expanded-state Extra Links panel clipped
too, the profile menu wasn't reachable from the collapsed state, and the active nav icon's color
was wrong.

- **Root cause of the clipping + spurious scroll, confirmed and fixed**: the collapsed nav-items
  container had `overflowY: "auto"` (for hypothetically-long content) alongside
  `overflowX: "visible"` (so tooltips could escape sideways) — CSS silently forces the `visible`
  axis to compute as `auto` too whenever its sibling axis isn't `visible`, so every tooltip and
  menu nested in that list was being clipped by the container's own bounds, and the clipped
  overflow was itself what added the spurious horizontal scrollbar. **Fix: every floating element
  (tooltip, Share/Profile/Switch-Accounts/Extra-Links menus) now renders through
  `@floating-ui/react`'s `FloatingPortal`, straight to `document.body`**, so nothing rendered
  outside the rail's own DOM subtree can be clipped by one of its internal scroll containers again
  — the collapsed list itself no longer needs `overflow-x` to be anything but `hidden`. This also
  fixed the expanded-state Extra Links panel overflowing past the browser's own left edge (it was
  anchored `right: 0`, growing leftward from a trigger with nothing further left to overflow into
  since the rail sits flush against the screen edge — fixed to `left: 0`, matching every other
  floating menu's rightward-into-the-canvas direction and Figma's own position for this panel).
  `flip`/`shift` middleware (8px viewport padding) now also keeps every menu on-screen generally,
  not just for this one case.
- **A real, instructive bug found while fixing the above**: the first portal-based attempt tracked
  open floating nodes in a hand-rolled registry (a `Set` populated by a `useEffect` keyed on
  `refs.floating.current`) so a single `document.mousedown` listener could tell "click landed
  inside a portaled menu" from "click was actually outside." This broke exactly the interaction
  that most needed to work: clicking "Switch Accounts" *inside* the already-open profile menu was
  read as an outside click and closed everything before the nested flyout ever opened. Root cause
  was a genuine timing race — the registry only learned the real DOM node a tick after the menu
  opened (via an effect keyed on a ref value, which React doesn't consider a render trigger),
  compounded by React 18 StrictMode's dev-only double-invocation of effects. **Replaced entirely
  with floating-ui's own `useDismiss` + `FloatingTree`/`FloatingNode`/`useFloatingNodeId`** — the
  library's purpose-built answer to nested menus, where a parent's dismiss logic already knows not
  to fire for a press inside a registered child node, with zero manual bookkeeping. Configured
  `outsidePressEvent: "mousedown"` explicitly (rather than the default `pointerdown`) after
  confirming in-browser that Escape-key dismissal worked immediately but outside-press initially
  didn't — a real compatibility difference worth pinning explicitly rather than relying on the
  library default. The lesson generalizes: for portaled/nested floating UI, reach for the
  positioning library's own interaction primitives before hand-rolling dismissal logic — the
  hand-rolled version looked correct in isolation and still had a real race condition.
- **Profile menu now opens from the collapsed rail too** — the user explicitly asked for this;
  the avatar itself (no name/email/chevron exists in collapsed mode to click otherwise) is now a
  real button opening the same Settings/Rate Us/Switch Accounts/Sign out menu, anchored
  `right-end` so it flips/shifts to stay on-screen near the bottom of a short viewport.
- **Active nav icon color corrected from the brand accent (blue) to the icon's own primary color
  (`T.gray900`)** — per explicit user correction; the original build's `T.accent` choice traced
  back to an *older* Menu component reference sampled earlier in the project, not to any frame in
  the newer sidebar audit (which never actually showed an active-state frame to confirm against
  either way) — trusting the direct correction over a carried-forward, never-reconfirmed guess.

## Chat/first-interface redesign pass (Z6YmEggwvoiX3j4d3kCKqV, "SHAPE 3.0 Roughwork")

A newer Figma file was pointed at specifically for the chat/first-interface area — per the same
"newer/more specific reference wins" pattern as the main Handoff file, this one is authoritative
for the chat start screen, the docked-chat ("side-modal") state, and the sidebar's Drafts
section, superseding the corresponding parts of `984qJvMt7fCHASYHRwgrab` where they conflict. A
background research agent audited 6 of the file's 9 "Chat" section frames in detail —
`docs/figma-chat-redesign-audit.md` has the full pixel-level breakdown; read that before
extending anything in this area further. Several of its findings were real forks against
decisions made explicitly *earlier in this same project* (the freeform topic-resolution scoping
conversation, the chart-type picker, the right-docked chat panel) rather than simple styling
ports, so they were put back to the user rather than silently overridden. Their answers, and what
shipped as a result:

- **Service/Scope picklist** (a fixed report-type + Org/Team/Personal picker the new design adds
  to the composer, a completely different mechanism from `topicResolver.js`'s freeform scoping
  conversation) — **skipped for now**, per explicit direction. Nothing in this pass touches the
  composer's scoping model; `findScope()`/bespoke clusters are untouched. The cascading "+" menu
  structure that would host this (Add Files/Photos → Add Data Source → Service → report type →
  Org/Team/Personal) is documented in the audit (§1a) but not built — the existing `NavRail.jsx`
  `FloatingMenu`/`useMenuFloating`/`FloatingTree` machinery is the right foundation if this gets
  picked up later, per the audit's own note.
- **Dock side** — the reference's side-modal chat docks **left** of the canvas, opposite the
  app's original right-docked drawer. **Flipped to left**, per explicit direction. This was a
  structural change, not restyling: `ChatPanel.jsx` went from a `position: fixed` overlay
  (sliding in via `right: open ? 0 : -400`) to an in-flow flex sibling (matching how
  `LibraryPanel.jsx` already worked) rendered directly after `NavRail` in `CanvasScreen.jsx`.
  Fixed positioning would have needed to account for `NavRail`'s own dynamic collapsed/expanded
  width to avoid overlapping it on the left; flowing in-flow sidesteps that entirely, at the cost
  of the old slide-in transition (now a plain mount/unmount, same as Library's own pattern).
  Width bumped from 392px to **436px** to match the reference's side-modal frame exactly. Chat
  and Library now share one left-of-canvas slot and are mutually exclusive — `openLibrary()`
  closes chat, `toggleChat()`/`startEdit()` close Library — the same "each panel has exactly one
  opener" discipline this file already established for the old right/left split. The floating
  mascot trigger button no longer needs to shift position when chat opens (it used to slide left
  to avoid the right-docked panel) since chat is now on the opposite side and never overlaps it.
- **Separate "Generating..." screen** — the reference has no such screen; the generation
  checklist runs as an inline chat message inside the docked panel while the Report Builder
  canvas (with a skeleton grid) is visible at the same time. **Retired `GeneratingScreen.jsx`**
  (deleted, not left as dead code) in favor of this inline pattern — `App.jsx`'s `createReport()`
  now goes straight to `CanvasScreen` with a new `initialGenerating` prop; `CanvasScreen` shows
  the same `SKELETON_LAYOUT` placeholder grid it always rendered widgets into, pushes one
  `{ checklist: true }` message into `mainChat` on mount (guarded by a ref against
  StrictMode's double-invoke), and reveals the real seeded widgets when `GeneratingChecklist`
  (rendered inline inside `ChatPanel`, no `Bubble` chrome around it, matching the reference's
  plain-text treatment) calls its `onComplete`. This directly resolves the tension
  `GeneratingChecklist.jsx`'s own header comment had flagged since it was first written ("our
  guided flow is currently a separate full-screen route... see CLAUDE.md for the open question
  this reveals") — confirmed by the audit as verbatim-identical copy to the reference's inline
  checklist, right down to the "Choosing widgets..." trailing ellipsis.
  - **Real bug found and fixed while testing this**: toggling the chat panel closed and back open
    after generation finished restarted the checklist's entire animation from zero and re-fired
    `onComplete` — because `CanvasScreen` conditionally mounts/unmounts `ChatPanel`
    (`{chatOpen && <ChatPanel/>}`), and `GeneratingChecklist` owned its progress as local
    `useState` with no memory of prior completion. Fixed with a `done` prop
    (`GeneratingChecklist.jsx`) driven by `CanvasScreen`'s own `generating` boolean (passed down
    as `reportGenerating`): when `done`, the component renders every step already checked with no
    timers and never calls `onComplete` again, regardless of how many times it remounts.
- **Generated-widget draft card's action model** — the reference's card has 4 actions (View
  Scope / Add to Report primary / Edit / Regenerate) and drops the chart-type picker
  (`onChangeType`/`VIZ_OPTIONS`) this project built in the earlier UX pass entirely. **Chart-type
  picker kept as-is**, per explicit direction — `GeneratedWidgetPreview.jsx` is unchanged this
  pass. "View Scope" still isn't added — see the follow-up pass below, which built the
  Service/Scope picklist this action would read from, but didn't extend it onto the draft card
  itself; still a real, open follow-up, not silently dropped.

**Shipped, no open decision needed:**
- **Drafts sidebar section** (`navRailData.js`'s new `SAMPLE_DRAFTS`, `NavRail.jsx`'s new
  `DraftRow`/`SectionAddButton`) — a flat list (no expand/sub-items, no per-item "..." menu,
  confirmed absent from every sampled reference frame — audit §3a), sitting as its own sibling
  section directly below "Your Reports," same 13px uppercase-gray500 header treatment. Same
  honest-sample-data status as `SAMPLE_REPORTS` — real copy from the reference
  ("Motivation Investigation," "Physical health check," "Underlying cause of absenteeism in the
  company"), not invented text, but inert: this app has no multi-conversation model (one
  `mainChat` instance for the whole session), so there's no real conversation for a click to
  switch to. The first entry is hardcoded `active` (persistent `gray25`, not just hover) to match
  the reference's own static frame, where "Motivation Investigation" is the one currently open.
- **"+" button styling fix on both "Your Reports" and "Drafts"** — was a solid `gray800` circle,
  the reference (audit §3a) shows a plain transparent ghost icon for both sections. New shared
  `SectionAddButton` component fixes both at once rather than leaving them inconsistent.
- **Composer send button** — solid dark (`brand`/`primary`) circle with an `ArrowRight` icon,
  replacing the previous ghost-styled `Send` icon button, in both `ChatLanding.jsx` and
  `ChatPanel.jsx` — confirmed from the reference's own composer (audit §1c) rather than a guess.

**Explicitly deferred, flagged rather than dropped** (see `docs/figma-chat-redesign-audit.md`
§7 for the full list of open questions behind these):
- The fixed-width (520px) right-aligned user-message card and its first-message-only
  "Service | Scope" tag pill (audit §2d) — depends on the Service/Scope picklist feature above,
  which was skipped this pass.
- Turn-dependent, shrinking quick-action chip sets (4→3→0→1 chips across a conversation, audit
  §2c) — the app's `QUICK_ACTIONS` stays a fixed 3-item row shown after every AI turn. The
  reference's own chip labels are still generic category names the engine can't parse (the exact
  tension `quickActions.js`'s header comment already documents), so adopting the shrinking
  *behavior* without the generic *labels* would need new per-turn chip logic this pass didn't
  build.
- Bolding an AI message's closing question (audit §2b) — a real, easy-to-port micro-detail, just
  not done yet.
- The reference's ~9-shape skeleton-variant catalog (score-block, evidence+legend, status+
  progress, etc., audit §5d/§9) vs. the app's existing 3 (`chart`/`bars`/`metric`) —
  `SKELETON_LAYOUT` unchanged.
- The header's rename/scale/minus icon cluster (`edit-05`/`scale-01`/`minus`, audit §5b/§6b) on
  the docked chat panel — not added, since none of the three have real behavior to wire up yet
  (no per-conversation rename, no floating-chat variant to toggle to, no minimize state).
  Decorative icons with no function were judged worse than omitting them.
- The floating-chat state itself (audit §6) and the toggle between full-page/side-modal/floating
  — not built this pass. The audit's own §6d flags that no prototype/click-through data was
  available to confirm the actual trigger-to-state mapping, and the four-decision check-in this
  pass already ran covered the highest-value structural forks; the floating variant is a genuine
  follow-up, not an oversight.

### Follow-up fidelity pass — the user pointed out the first pass still didn't look like Figma

User feedback, verbatim: *"Dont you see? The header is skipped - the chat box is different, the
background is different, the buttons on the thing are different, the way the chat appears etc is
different. The Add function - and selecting a service as context for query - none of that is
there."* This directly reversed the "skip pills for now" answer from the four-decision check-in
above — on reflection, the Service/Scope picklist wasn't an optional nicety to defer, it was a
core, explicitly-requested part of "implement all this." Root-caused each complaint against the
audit and fixed all of them:

- **"The header is skipped"** — `ChatLanding.jsx` had no top bar at all, in either the empty or
  conversation state. Added the reference's 44px white header strip (node `2031:8498`, blank on
  the sampled empty frame, but populated with a title + "..." in the full-conversation frames) —
  blank while `empty`, then showing `scopeInfo?.areaLabel || "New chat"` + a `MoreHorizontal`
  icon once a conversation starts, mirroring `ChatPanel`'s own header pattern.
- **"The background is different" / "the chat box is different"** — root cause was an inverted
  contrast relationship: the reference's content area is light gray (`T.gray50`, `#f2f2f2`,
  confirmed as the literal `bg-primary` token in the raw Figma dump) with a **white** composer
  standing out against it; the app had it backwards (white page, `T.gray50` composer). Flipped
  `ChatLanding.jsx`'s content background to `T.gray50` and the composer to `T.white` with a
  `T.gray100` border and a new `COMPOSER_SHADOW` (a soft 5-layer shadow sampled off the
  reference's own "Dark Chat Input Bar" node) — same fix mirrored in `ChatPanel.jsx`'s message
  area and its own composer. This one change incidentally fixed a second, unrelated-looking
  problem for free: `Bubble.jsx`'s non-`mine` (AI) variant already rendered on a flat `T.gray50`
  fill with no border — once the page behind it is the same `T.gray50`, AI text now reads as
  plain text directly on the page with no visible bubble box at all, exactly matching the
  reference's own "no bubble on AI turns" treatment (audit §2b) without touching `Bubble.jsx`.
  Also rebuilt the composer's internal layout to match the reference's actual structure (text
  input on its own row, the `+`/mic/send icon row directly below it — confirmed from the
  reference's own screenshots) instead of the old single-row icon-input-icon layout, and restored
  the reference's two-layer composer shape (outer `gray75`/`gray100` frame + inset white card,
  `2031:8507`/`8508`) which collapses to a single plain white bar once a conversation starts
  (audit §2e) — implemented as one conditional style object rather than a duplicated JSX branch.
- **"The buttons... are different"** — traced to the shared `Button` component's `secondary`
  variation border: `#231F20` (`T.gray800`, dark), sampled off the *other* Figma file's
  `Buttons/Button` component set. The chat-redesign reference's own pill chips (starter chips,
  quick-action chips, scope-disambiguation options, "Create Report") all use a much lighter
  `#cecdcc` (`T.gray100`) border instead (audit §1d/§2c). Rather than fork the shared `Button`
  component's global color table (which is correctly sampled for *other* real buttons elsewhere
  in the app), every chat-chip usage now passes a `CHIP_STYLE = { border: `1px solid
  ${T.gray100}` }` override — `Button.jsx` already spreads a consumer `style` prop last for
  exactly this kind of narrow, local override.
- **"The Add function - and selecting a service as context for query - none of that is there"**
  — built the composer's "+" cascading menu for real this time: new `AttachMenu.jsx`, a 3-level
  nested floating menu (Add Files or Photos / Add Data Source / **Service** → five report types →
  **Org/Team/Personal** under "SHAPE Performance Index") built on the exact same
  `@floating-ui/react` `FloatingTree`/`FloatingNode`/`useFloatingNodeId` nested-menu primitives
  already proven correct in `NavRail.jsx`'s Profile → Switch Accounts flyout — each level's node
  id is computed inside the *previous* level's own `<FloatingNode>` subtree so a click inside a
  submenu is never misread as an outside dismiss (the same class of bug fixed once already this
  session for the sidebar). "Brain Health Report" also shows a chevron in the reference, but its
  nested submenu contents were never sampled by the earlier audit pass — rather than fabricate a
  guess at what it contains, it's rendered as a plain, directly-selectable row like the other
  non-nested services, flagged in `AttachMenu.jsx`'s own header comment. "Add Files or
  Photos"/"Add Data Source" close the menu with no other effect (no real upload backend exists in
  this prototype) — the same honest-but-inert treatment already used for `NavRail`'s decorative
  Search/Library items. Once a selection is made, it renders as the reference's own persistent
  "Service ⌄ | Scope ⌄" pill row (only in the empty, pre-first-message composer, per audit §1b/
  §2e) — clicking either pill reopens the same menu from the top (`AttachMenu` takes an optional
  controlled `open`/`onOpenChange` pair, the same merge pattern `NavRail`'s `expanded` prop
  already uses, rather than a one-way write-only display).
- Also fixed in the same pass, smaller deltas the audit had already flagged but the first
  implementation pass missed: the "Today" divider's color (`T.gray300` → the reference's actual
  `T.gray500`) in both `ChatLanding.jsx` and `ChatPanel.jsx`, and removed a pre-existing subtitle
  line under the landing heading ("What are you concerned about...") that doesn't exist in any
  sampled reference frame at all.
- **Still not done, and now genuinely open rather than a considered skip**: the "View Scope"
  action on generated-widget draft cards (there's a real Service/Scope selection to show now, but
  nothing wires the two together yet), the fixed-width right-aligned message card + its
  first-message-only tag pill (audit §2d — the Service/Scope state this would read from now
  exists, this specific rendering just wasn't built), and everything else already listed as
  deferred above (turn-dependent chip shrinking, bolded closing questions, the floating-chat
  state, the header's rename/scale/minus icons).

## Widget Builder — the chat-exclusive "focus on one widget" editor

Per explicit direction, pointed at a specific hidden frame in the chat-redesign reference
(Z6YmEggwvoiX3j4d3kCKqV, node 2032:12134 "Chat 14" → its hidden child `2033:14849`,
"Frame 1597885236"): a rich detail panel for a single metric, not visible in the normal chat flow
but present in the file as a sibling hidden layer. That frame is a **read-only drill-down** —
white header bar (title + a "75%"/Expand/Close button row whose meaning wasn't decodable from a
static export) over a gray body holding three stacked bordered "window" cards (a headline
statement + a 5-segment colored evidence bar, a big band-colored number + sentence, and a
driver-by-driver breakdown list with a number and its own explanatory paragraph per driver). It
has **no carousel, no chart-type picker, and no editable fields anywhere in it** — those are this
project's own explicit ask layered on top, not a port.

**What shipped** (`src/components/chat/WidgetBuilderModal.jsx`, new):
- Kept the reference's visual language (white header bar, bordered/rounded "window" cards on a
  gray body) but built a **generic** version driven by this app's real `spec` shape
  (`{ vizType, title, payload, explanation, real }` from `generativeEngine.js`) rather than
  porting the Figma frame's own "Communication Flow / Digital Flow /…" driver-breakdown content
  verbatim — that content is specific to one hypothetical "Flow at Work" metric this app's real
  dataset/engine has no equivalent for, and fabricating a matching breakdown for every generated
  widget type would be exactly the kind of invented data this project avoids. The "What's Behind
  Your Score" driver-list card and the "Why It's Important" long-form explainer (also hidden,
  sibling node, lightbulb icon + paragraph) were **not ported** for the same reason — nothing in
  `buildSpec()`'s output carries that kind of per-driver narrative text today.
- **Carousel** (prev/next + "n / total", hidden entirely when there's only one candidate) — pages
  through a chat message's `variants` array one at a time, per explicit direction ("focus on one
  widget at a time"). Opened by clicking a widget's own preview box inside
  `GeneratedWidgetPreview` (a new `onExpand` prop — the small inline card's Add/Edit/Regenerate/
  chart-type actions are unchanged, this is a new way in, not a replacement).
- **Edit/Preview toggle** in the header — Preview shows the rendered widget + a read-only
  "Insight" window; Edit turns on three more windows: **Chart type** (reuses the exact
  `VIZ_OPTIONS` picker/`onChangeType` already built for the small card, so there's one picker
  implementation, not two), **Metric** (a new `PayloadEditor` switched on `spec.vizType` — every
  shape `buildSpec()` produces has a real editable form: number fields for metric/gauge, a
  comma-separated point list for trend, a status `<select>`, an add/remove row list for
  bar/ranking, a label+value list for radar, topic/correlation fields for scatter, a
  statement+stat pair for insight), and an editable **Insight** textarea with its own
  "Regenerate with AI" button (re-runs `buildSpec()` for that slot, the same mechanism
  `onRegenerate` already used — "AI-assisted" here means the existing rules-engine regeneration,
  not a new freeform LLM call, consistent with how `EXPLANATIONS`/`buildSpec()` are described
  elsewhere in this file). The title is also editable inline in Edit mode (reuses the same
  click-to-rename pattern `GeneratedWidgetPreview` already had).
- **New `updateVariantSpec(msgIndex, variantIndex, patch)`** in `lib/useChatThread.js` — a manual,
  direct merge into one variant's spec (shallow-merges `patch.payload` so editing just one field
  doesn't drop the rest of the payload). This is deliberately separate from `regenerateVariant`
  (which re-runs the engine) — a manual edit stands until the user explicitly regenerates again,
  the same "draft is yours until you ask the engine to redo it" distinction the rest of this
  file's editing features already follow.
- **"Build a Widget" — create from scratch.** New `createBlank()` in `useChatThread.js` pushes a
  normal AI turn with a single blank variant (`metric`, title "New Widget", value 50) — deliberately
  routed through the *exact same* message/variants rendering (and therefore the exact same
  Widget Builder modal, small-card actions, everything) as a real generated response, rather than
  a special-cased local-only state. A new "Build a Widget" chip sits next to "Create Report" in
  both `ChatLanding.jsx`'s `QuickActionRow` and `ChatPanel.jsx`'s quick-action row (hidden in
  `ChatPanel`'s scoped/"Edit with AI" mode — building a blank widget from scratch doesn't make
  sense there, you're already editing one specific widget).
- Confirmed **"exclusively lives in chat"**: no `DetailModal.jsx` (the canvas's own click-to-view
  modal) entry point was added or touched — `WidgetBuilderModal` is only reachable from
  `ChatLanding.jsx`/`ChatPanel.jsx`'s generated-widget cards.
- Verified end-to-end in-browser: opened a blank from-scratch widget, toggled Edit, edited the
  Value field, changed chart type (confirmed a chart-type click always re-rolls via the engine
  even when the clicked type matches the current one — same pre-existing behavior the small
  card's picker already had, not a new inconsistency), generated a real 3-variant set from a
  prompt, paged the carousel 1→2→3, and approved a variant straight to canvas via "Add to
  Report" from inside the modal — zero console errors throughout.

**Open/deferred, flagged rather than dropped**: the header's "75%"/Expand button pair from the
Figma frame has no equivalent here (replaced with a plain Edit/Preview toggle + Close, since
their real meaning couldn't be confirmed from a static export — see the frame's own audit note
above); the driver-breakdown and "Why It's Important" long-form cards described above; and a
real per-widget "AI, rewrite this for me" freeform prompt (today "AI-assisted" only means
re-running the deterministic engine, per the explanation above) — would need an actual LLM call
this prototype doesn't have, not a rules-engine re-roll.

## Apple interaction-design pass — motion across the chat/widget-builder experience

Per explicit direction ("get those Apple Motion principles in play... apply throughout this
experience... keep those principles in mind for further iteration as we proceed"), loaded via
the `apple-design` skill (same one used for the NavRail rebuild earlier). This pass specifically
targeted everything built in the chat/Widget Builder passes above, since that work had shipped
functionally complete but with almost no motion — modals popped instantly, messages appeared
with no transition, and the chat panel's dock open/close was an instant mount/unmount. This is
now the standing house style: any new interactive surface in this app should default to
critically-damped springs on `motion`-driven state changes, not silent instant snaps, going
forward — not just this one pass.

**Global foundation**: `App.jsx` now wraps the whole tree in `<MotionConfig reducedMotion="user">`
— every Motion-driven animation in the app (this pass's and NavRail's existing ones) automatically
defers to the OS's Reduce Motion setting with no per-component opt-in, per the skill's own
guidance that reduced motion means a gentler equivalent, not silently dropping all feedback.

**`WidgetBuilderModal.jsx`** — the most animation-bare surface, now fully covered:
- Scrim fades in/out, the modal card itself scales+fades+lifts in on open (critically damped,
  `bounce: 0` — nothing here is gesture-driven, so no overshoot is warranted per the skill's own
  "start non-gesture UI at damping 1.0" default) — both wrapped in `AnimatePresence` at the two
  call sites (`ChatLanding.jsx`/`ChatPanel.jsx`) so the exit animation actually gets to play
  before unmount, which a bare conditional render can't do.
- **Carousel now slides with direction**, per the skill's "spatial consistency" + "hint in the
  direction of the gesture" principles: a `direction` state set by which arrow was pressed drives
  which side the outgoing/incoming content enters/exits from, so paging right always visually
  reads as moving right, never the same generic fade regardless of direction.
- **Edit-mode's Chart type/Metric cards now animate in/out** (height+opacity spring via
  `AnimatePresence`) instead of snapping the layout open, and the `Window` card wrapping every
  section uses `layout` so the Insight card above them smoothly resizes/repositions as siblings
  mount/unmount around it, rather than jumping.
- Reused the exact same critically-damped spring constants (`bounce: 0`) NavRail.jsx already
  established this session, rather than inventing a new motion language for this component.

**`GeneratedWidgetPreview.jsx`** — the small draft card's clickable preview box is now a
`motion.div` with `whileHover`/`whileTap` (scale up slightly on hover, down on press), giving
real press feedback on the exact affordance that opens the Widget Builder — per the skill's
"respond on pointer-down, not on release" principle, feedback should be immediate and visible
the moment you touch something interactive, not only after the modal finishes opening.

**`ChatPanel.jsx` docking** — previously an instant mount/unmount when toggled (documented at
the time as a deliberate simplification once the panel moved from `position: fixed` to in-flow).
Revisited now that motion is the house style: the outer element animates `width` (0 → 436px) on
mount/exit via a critically-damped spring, matching NavRail's own collapse/expand treatment, so
opening/closing the dock reads as a panel sliding into place rather than popping. The inner
content stays a fixed 436px inside an `overflow: hidden` clip region so nothing reflows mid-
animation — only the reveal window grows. `CanvasScreen.jsx`'s Chat/Library conditional (they
share one slot) is now wrapped in `AnimatePresence mode="wait"` so this exit animation is actually
given the chance to run instead of an immediate unmount.

**Message entrance** (`ChatLanding.jsx` and `ChatPanel.jsx`) — each chat bubble (user and AI)
now mounts with a small opacity+y-offset spring instead of popping in instantly the moment
`pushAI`/`send` appends it. Because `messages.map` keys each bubble by its stable index, this
correctly plays once per new message and never replays on unrelated re-renders of the list.

**`CanvasScreen.jsx` skeleton → real-widgets reveal** — the generating skeleton grid, the empty
drag-and-drop state, and the real widget grid are now three `AnimatePresence`-managed branches
that cross-fade into each other instead of an instant swap the moment `generating` flips to
`false` — small, but it's the exact moment a user's report "finishes," worth a deliberate
materialize rather than a flicker. The floating mascot toggle button also gained
`whileHover`/`whileTap` scale feedback for the same "respond immediately to touch" reason as the
widget preview above.

**Deliberately not attempted this pass**: a true shared-element/FLIP morph from a widget's small
preview box to its position inside the opened Widget Builder modal (Motion's `layoutId` can do
this across components) — genuinely the more "Apple-native" answer to "anchor interactions to
their source," but risky to get pixel-right without a tighter visual feedback loop than blind
edits allow (mismatched native sizes between 1×1/2×2 forms, nested `overflow`/`transform`
ancestors), so a plain centered scale+fade was used instead — a real, acceptable presentation
per the skill's own materials guidance (modal tasks pair with a scrim; the anchor-to-source rule
matters more for popovers/menus, which NavRail's `FloatingMenu`s and `AttachMenu.jsx` already do
correctly by positioning at their trigger). Also not attempted: any drag/gesture-driven
interaction (there isn't one anywhere in this app yet — the drag-and-drop widget reordering on
canvas is native HTML5 DnD, not a pointer-tracked gesture, so the skill's direct-manipulation/
velocity-handoff/rubber-banding sections don't yet have a surface to apply to). If a real drag
gesture gets built later (e.g. a touch-friendly widget reorder), that's where those specific
principles — 1:1 pointer tracking, velocity handoff on release, rubber-banding at bounds — should
be reached for first, rather than the simpler enter/exit springs used everywhere in this pass.

## Search — the product-wide command palette (`components/shell/SearchOverlay.jsx`)

Gives NavRail's "Search" nav item a real destination — it was previously inert ("no real
destination anywhere in this app," per the nav-rail section above; that note is now stale for
Search specifically, still true for Library). No Figma reference exists for this yet — built to
the user's own explicit description ("a floating search bar... like Apple Spotlight or ChatGPT
search," ChatGPT-style specifically requested over Spotlight-style) — expect this to get revised
once real design reference shows up, per the user's own "I'll provide design help afterwards."

**Six sections, per the user's own explicit list of what should be searchable:**
- **Services** — the composer's `AttachMenu.jsx` report-type list (now `export`ed from there so
  this doesn't redefine the same five names a second time).
- **Widgets** — the Library's real `FAMILIES` (`lib/families.js`), matched on both name and
  category.
- **Drafts** / **Reports** — `navRailData.js`'s existing `SAMPLE_DRAFTS`/`SAMPLE_REPORTS`, same
  honest-sample-data status they already have in the sidebar.
- **Tools** — real screen navigation: Home (landing chat), Store (canvas, reusing whatever's
  already there rather than resetting it), Create (a fresh blank canvas, `startBlank`), Library
  (an empty canvas with the Library panel already open — new `initialLibraryOpen` prop on
  `CanvasScreen.jsx`, `libCollapsed`'s initial value now derives from it instead of always
  starting `true`).
- **Settings** — mirrors `NavRail.jsx`'s own `ProfileMenu` items (Settings/Notifications/Rate Us/
  Switch Accounts/Sign out).

**Only Tools and Widgets carry real actions.** Services/Reports/Drafts/Settings close the palette
and do nothing else — a deliberate choice, not a gap: NavRail's own Your-Reports/Drafts rows and
ProfileMenu's Settings/Rate-Us/etc. have never had real `onClick` destinations either (see the
nav-rail sections above), so Search matches that existing precedent instead of inventing new fake
navigation just because it's a new surface. Widgets reuse the exact "single-widget direct-add"
pattern `App.jsx`'s `addWidgetDirect` already established for generated specs — new
`addLibraryWidgetDirect(familyId, formIndex)` is the same thing for a library family.

**Trigger**: click the Search nav item (only visible when the rail is expanded, same as before —
`Cmd/Ctrl+K` covers the collapsed case, wired as a single `window` keydown listener in `App.jsx`
rather than duplicated per-screen), or the global shortcut from anywhere. `searchOpen` is lifted
to `App.jsx` (mirrors the existing `navExpanded` lift-to-App pattern exactly, for the same
reason — a screen-local flag would silently reset on every landing↔canvas transition, the same
class of bug this file has already documented and fixed twice for other flags) and threaded down
to both `ChatLanding.jsx` and `CanvasScreen.jsx` as `onOpenSearch` so either screen's rail can
open it, while the overlay itself renders once, at the `App.jsx` level, wrapped in
`AnimatePresence` for its exit animation.

**Interaction**: live substring filtering (case-insensitive, matches name and, where relevant,
category/sub-label), capped at 5 results per section so it reads as a curated quick-access panel
rather than a full dump even before typing. Arrow-key navigation moves a highlighted index across
the flattened, cross-section result list; Enter activates whatever's highlighted; Escape or a
click on the scrim closes it. Same critically-damped spring language (`bounce: 0`) the Apple
interaction-design pass above established — scrim fade + card scale/fade/lift on open, both
wrapped in `AnimatePresence` at the `App.jsx` call site so the close animation gets to play.

Verified end-to-end in-browser: Cmd/Ctrl+K opens it from both screens, typing filters correctly
across sections (including a category-only match — "explor" surfaces "Popular Responses" via its
"Explorers Results" category, not just literal name matches), arrow-key highlighting moves
correctly, mouse-click activation on a Widget result adds it directly to a fresh canvas, a Tools
result ("Home") navigates back to the landing chat with `navExpanded` state preserved, and
click-outside-the-card closes cleanly — zero console errors throughout. (Note for future testing:
this session's browser-automation tool did not reliably deliver synthetic Enter/Return keydown
events to this overlay's input during testing — arrow-key events landed fine, mouse clicks landed
fine, only Enter didn't register through the automation layer. The handler itself is the same
`e.key === "Enter"` pattern already proven working elsewhere in this codebase via real interaction
— e.g. the composer's submit-on-Enter — so this reads as an automation-tool quirk with this
specific key, not a component bug, but a human should double-check Enter-to-activate directly.)

### Restyle pass — glass materials, category tabs, Recents (`SearchOverlay.jsx`)

Follow-up once the user reacted to the first version and shared two ChatGPT search screenshots
directly (a tabbed All/Chats/Images/Documents/Projects row, and its centered-icon "No results"
empty state) — still not a Figma reference, just matched to those two screenshots plus the
user's own explicit asks.

- **Three selectable visual themes** (`STYLE_THEMES`): `solid` (the original plain white card,
  kept as the control), `light-glass`, and `dark-glass` — the latter two use `backdrop-filter:
  blur()` + a translucent background, per the Apple interaction-design skill's own materials
  guidance from the earlier motion pass above (translucent layers over content, not opaque bars).
  `dark-glass` matches the user's ChatGPT reference screenshot closely (dark charcoal frost,
  light text); `light-glass` is the same treatment kept inside this app's own light palette,
  offered as the other real option to compare against it side by side.
- **A prototype-only style switcher** — a small pill above the card, explicitly labeled
  "🧪 Prototype style" in the UI itself (not just in code comments), per the user's own explicit
  ask ("put a dropdown button thing that can change the UI... for this prototype"). Session-local
  `useState`, not persisted — this is a design-exploration aid to compare options, not a real
  product setting, and should be deleted once a direction is picked rather than shipped as a
  real preference toggle.
- **Category tabs** (All + the six real sections) replace what was a flat scroll of section
  headers — matches the reference screenshot's own All/Chats/Images/Documents/Projects row
  exactly in spirit, scaled to this product's own six categories instead of ChatGPT's four.
  Selecting a specific tab shows that section's full real list (not capped at 5 the way "All"
  still is, since it's now the one thing on screen); selecting a tab with an empty query browses
  that category directly, which reads naturally as "browse Widgets" even with nothing typed.
- **Real Recents, not fabricated ones** — every `activate()` call (including the inert
  Services/Reports/Drafts/Settings ones) now records `{id, section}` into `localStorage`
  (`shape-search-recents`, capped at 6, deduped), and the empty-query "All" landing view shows a
  real "Recents" section (clock icon, only rendered when at least one exists — no fake seed data)
  above an always-present "Quick Access" row of the four real Tools. This was the direct answer
  to "start simple with Recents and maybe some common stuff people might reach for" — Recents is
  genuine interaction history (this is a real browser-persisted value, unlike, say, `SAMPLE_
  DRAFTS`'s presentational-only status elsewhere in this file), Quick Access is the one section
  that's honestly always useful with nothing typed rather than an arbitrary curated guess.
- **"No results" empty state** restyled to match the reference exactly — a centered muted search
  icon above the text, rather than the smaller left-aligned message the first version had.
  Added a "Clear" text button (visible only once there's a query) alongside the close `X`, also
  matching the reference's own header row layout.
- Verified end-to-end in-browser across all three themes: tab switching (via ref-targeted clicks
  — plain coordinate clicks were unreliable mid-session due to layout shifting between
  screenshots, not an app bug), a Widgets-tab full list render, activating a widget and
  confirming it appears in Recents on the next open, the "No results" state, and switching
  between all three `STYLE_THEMES` via the prototype dropdown — zero console errors throughout.

### Correction pass — the landing view and tab visibility were both wrong

Direct feedback on the restyle pass above: *"First state of Search isn't working for me. It
should be Recent searches and maybe recent drafts"* and *"Once user starts to write something in
- the categories/tabs show up - and only the relevant ones should show up."* Two real corrections,
not refinements:

- **The empty-query landing view was a generic "Recents" (whatever was last clicked across every
  category) + a fixed Tools "Quick Access" row.** Replaced with exactly what was asked for:
  **Recent Searches** — real query strings, not clicked items — persisted to `localStorage`
  (`shape-search-recent-queries`, capped at 5, deduped case-insensitively) every time the palette
  closes with a non-empty query (Escape, the `X`, the scrim, or picking a result — all funneled
  through one `closeAndCommit()` so nothing slips past un-recorded, the same "one place" discipline
  `useChatThread.js`'s `pushAI`/`pushUser` already established for message state elsewhere in this
  app) — and **Recent Drafts** (`SAMPLE_DRAFTS`, the same honest-sample-data source the sidebar's
  own Drafts section already uses). Clicking a past search re-runs it (sets the query, keeps the
  palette open) rather than "activating" it like a real result. Quick Access/Tools no longer force-
  appears on empty query — Tools are still fully searchable once you type (e.g. "home"), this just
  stopped pinning them to the very first thing you see.
- **Tabs are now hidden entirely until there's a query**, and once there is one, only render for
  categories that actually contain a match (`matchingSections` computed fresh per keystroke) —
  contrary to the reference screenshot's own behavior (ChatGPT keeps all five tabs visible even at
  zero results), a deliberate improvement past what that screenshot showed, per explicit
  instruction. `activeTab` resets to `"all"` whenever the query empties or the currently-selected
  tab's own matches drop to zero (its tab button would have just disappeared above it), so the view
  never gets stuck silently filtered on a tab that's no longer offered.
- Verified end-to-end in-browser: empty state shows only Recent Drafts before any search has
  happened (no fabricated Recent Searches placeholder), typing "score" shows only All + Widgets
  tabs (nothing else matches), a nonsense query collapses to just the All tab with "No results",
  completing a search (clicking a real result) correctly records the query and surfaces it under
  Recent Searches on the next open, and clicking a Recent Searches row re-runs that query in place
  — zero console errors throughout. (Coordinate-based clicks were flaky again mid-verification in
  a couple of spots — confirmed via `localStorage`-visible before/after state and ref-targeted
  retries that the underlying behavior is correct; see the same note on the previous pass above.)

## Status

Chat-first architecture rebuild complete and verified end-to-end (landing → canvas with inline
generation, blank-canvas path, single-widget direct-add path, widget generation, drag-and-drop,
hover states, detail modal, Edit-with-AI — all with zero console errors). Widgets, the Add Widget
panel, the Button component, the nav rail, and now the chat/first-interface area are corrected
against real Figma component data rather than guesses across several passes (see the sections
above for the widget-economy, UX, nav-rail, and chat-redesign passes specifically). Known gaps
are flagged inline above and in `docs/figma-widget-audit-*.md`/`docs/figma-chat-redesign-audit.md`
(Org Score stat row, Health Age's missing age field, Score Comparison's missing per-team data,
3×3 Index's per-item-level middle ring, collapsed-rail toolbar icons, the Service/Scope picklist,
the floating-chat state) — none silently dropped. `npm install` + `npm run dev` both verified
working; `.claude/launch.json` runs it via `cmd /c "set PATH=...nodejs...&& npm run dev"` since
this machine's Node install didn't propagate to the harness's preview-server PATH by default.
