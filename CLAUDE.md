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

## The status scale — Struggling 0 to 59, Striving 60 to 79, Flourishing 80 to 100

**Correction from the product owner: the scale is 60 / 80, not 40 / 70.** It lives in one file, `src/lib/bands.js`
(`FLOURISHING_AT = 80`, `STRIVING_AT = 60`, `statusName()`, `bandKind()`, `nextLine()`, `countByStatus()`, `RANGES`). Everything that
bands a score, draws a threshold line, or counts people or parts by status reads from it: `band()`/`dsBand()`, `statusOf`
(scopeData, widgetParts, ZoneChart), the Dial and Gauge ticks, `ThresholdScale`, Methodology's status rows, Zone chart zones,
spread histogram labels, Priority Map split (Flourishing line), Goal & Pace targets (60 / 80 / 90), What if (lift to 80), Within
Reach (next line up), Health Check wording, the survey assistant, Areas to Focus. **Never type 40 or 70 for a band again; import from
`bands.js`.** Any older section of this file that says 70 / 40, "≥70", "40–69" or "0–39" is superseded by this one.
- **The dataset is re-banded at load** (`lib/dataset.js`): each person's stored `status` and each round's flourishing / striving /
  struggling counts are recomputed on the new scale; scores are untouched. `data/generate-dataset.js` was updated to match for
  future regenerations (the checked-in JSON still holds the old statuses, which are overwritten at load).
- **Side effect to know about:** the synthetic data was tuned to the old scale (about 20 / 55 / 25). On the new scale the latest
  round is **6% Flourishing / 39% Striving / 55% Struggling**, the org score of 57 reads **Struggling**, and no Explorer reaches
  Flourishing (6 Striving, 6 Struggling). The generator's baseline would need lifting by roughly 12 points to look like the old
  story; not done, because the request was the scale only.
- Docs pages and samples were updated (Insight Summary and Score Meaning now use 86 / 61 / 32 as the three sample scores).
  Heat-map colours (`HEAT`) and the eNPS promoter / passive / detractor cut-offs are separate scales and unchanged.

## Design-system alignment + dark mode (docs/shape-design-system-v4.md)

The user's own design system file (`docs/shape-design-system-v4.md`: semantic colour tokens with **Light and Dark** values,
button/status/toggle/likert/heat-map colours, 5-layer shadows, radius, spacing, border widths, type scale) is now the
source for Story styling. Trigger: *"the tokens used on the Stories aren't aligning with this"* - the old `T` object
predates the file. Primitives (`Colors/Gray/500` …) are never applied directly, as the file requires.

- **Generated, not typed.** `scripts/build-ds-tokens.mjs` parses the markdown into `src/lib/dsTokens.generated.js`
  (251 semantic colours, 66 primitives, shadows, radius, spacing, border widths, type scale). Edit the markdown, re-run
  `node scripts/build-ds-tokens.mjs`, commit both.
- **`src/lib/ds.js`** - `ds.text.primary` → `var(--ds-color-text-primary)` (nested accessor from the token paths;
  `ds.graph.*`, `ds.likert.*` aliases), `dsBand(score)` ({c: status/*/graph, cs: text-indicator, bg: status bg, key, name}),
  `dsText("Text sm", 600)` (size / line height / tracking of a named text style), `dsRadius`, `dsSpace`, `dsBorder`,
  `dsShadow("sm")`, `tokenForVar()` (var → token path). Importing it injects a `<style id="ds-vars">`: Light values on
  `:root`, Dark values inside `.ds-dark` (+ `color-scheme: dark`). Variable names are the token path, e.g.
  `--ds-color-status-success-text-indicator`.
- **`band()` in `tokens.js` now returns those variables** (same `{c, cs, bg}` shape), so every widget/Story that colours by
  status follows the mode; in Light they resolve to exactly the `T.green/greenStrong/greenBg…` they replaced. Never append
  alpha digits to a band colour (`b.c + "33"`) - it is `var(...)` now.
- **Button** (`ui/Button.jsx`) builds its colour tables from `color/button/{theme}/{variation}/…` tokens; all 48 Light
  values were checked equal to the hex they replaced. `SegmentedControl` and `.field-soft` (index.css) use tokens too.
- **Converted to tokens (Current style):** `StoryCard.jsx` (shell, title, `bodyText`/`noteText`, `SampleTag`),
  `SummaryStories.jsx` (Insight Summary, Meaning number/ring/status, `ThresholdScale`, Methodology), `controls.jsx`
  (Switch → `color/toggle/*`, Compare, tabs, chips, copy buttons). Refined branches got their colours converted but keep
  their own off-scale sizes (it is an exploration, not the shipped style).
- **Small corrections that change pixels:** toggle off-track now E5E4E3 (was CECDCC) and the thumb follows the toggle
  tokens; Methodology left border 4px (`border-width/lg`, was 3); Status Meaning label `Display sm` 30px (was 28, not a
  scale size); Sample-copy tag 4/8 padding + the system's 11px header text; spacing 10→8/12, 14→12, 22→24. Story card
  radius stays `radius/widget` (18, matches Figma's Segment frame) though `radius/card` is 16 - the user's call.
- **Developer area:** header **Mode: Light | Dark** (remembered, `developer-mode`) wraps everything right of the nav rail
  in `.ds-dark`; the nav rail itself is not tokenised yet and stays Light. Inspect tooltip and code blocks use
  `bg/inverse` + `text/inverse` so they invert with the mode. `docKit.jsx` `measure()` now names the DS token behind each
  colour by reading the element's own inline `var(--ds-…)` (a hex literal shows as "not a DS token"), the text style
  (`Text sm / Semibold`), `radius/…`, `border-width/…`, `shadow-…`, and warns on sizes/spacing/radii off the scales.
  `TokenTable` takes DS paths and shows Light · Dark values read from the file.
- **Token audit page** (Developer → Foundations): `scripts/audit-ds.mjs` counts per file the old `T.*` references, hex/rgba
  literals and off-scale font/radius/spacing values; `scripts/ds-audit-baseline.json` is the pre-change snapshot and
  `src/lib/dsAudit.generated.js` ({baseline, current}) feeds the page. Baseline → now (all 22 Story + Developer files):
  `T.*` 469 → 322, hex 16 → 6, rgba 39 → 30. 8 of 22 files are fully on tokens; the other 14 Story files (Breakdown,
  Diagnostic, Composition, Trend, History*, Zone/Area/Donut charts, Actions, AddOn, Extra…) are the same mechanical job
  and still stay Light in Dark mode. Re-run `node scripts/audit-ds.mjs` after converting more.
- **Findings recorded on that page:** `T.gray900/gray800` are really DS Gray/950 and Gray/900 (one step off); `T.teamBlue`
  (#0096ec) and `T.hotPink` (#ffabcf) match no DS graph colour (DS: #0074BC / #FF4081) - the category charts will change
  colour when converted to `ds.graph.*`; the DS has no "track" token for unfilled rings/bars (using
  `color/interactive/ghost-hover`); Score number is `Display 1.5xl-Trim` with line-height 1 kept.
- Verified in-browser: Light renders identically to before (Insight Summary, Score Meaning states/forms, Org report, an
  open Scope), Dark renders all of them with correct status colours, measured tables show DS token names, zero console
  errors in a fresh tab.

### Insight Summary checked against Figma (node `13622:39509`) + Developer / Researcher views

First of the "get each Story right, one by one" passes. Read the Figma section (`13622:39511` the Story, `13622:39510` its
Purpose / Can contain / Boundary note) with `get_design_context` + `get_variable_defs`, compared every value to the running
component, and fixed the differences:
- **Fixed in `SummaryStories.jsx` (`InsightSummaryStory`)**: headline is Text lg / Bold **18/28** in Current (was 20/30 - the
  caller had `titleSize={20}`; Refined keeps 20); the two body paragraphs are **14px** apart (Figma's paragraph spacing - it had
  been "tidied" to 12; off the 4px scale but drawn that way); the bar now sits in the **Evidence Section** - 1px `border/primary`
  hairline above and below, 16px padding (42px tall) - which was missing; **number colours** follow Figma: Flourishing
  `status/success/text-indicator` (#0B703F), Striving `status/warning/text` (#F1A118), Struggling `status/error/text` (#CC2944)
  - exported as `STATUS_TEXT` / `statusText(score)` and used by `storyCatalog.jsx` and `scopeRecipes.jsx` (the callers had used the
  darker `band().cs`). `ScopeCard`/`StoryCard` now pass extra props through (`data-story`, `data-part` hooks for the docs).
- **Token discrepancies recorded, not hidden** (also on the page): Figma's variable `radius-card` = 18 (markdown `radius/card`
  = 16, `radius/widget` = 18 - component uses widget); Figma binds the Healthy number to `status/success/text-strong` = #0B703F
  while the markdown's `text-strong` is #08542F and #0B703F is `text-indicator`; Figma binds the bar to `border/*`, code uses
  `status/*/graph` (same hex Light and Dark). Contrast (computed on the page): the amber number is 2.1:1 on white (fails AA) and the
  red is 4.4:1 in Dark; the design system's `warning/text-strong` (5.4:1) is the one-line fix in `STATUS_TEXT` if accessibility wins.
- **Developer pages can now have views.** `meta.views` + `toc` as `{developer, researcher}` + a `view` prop; `DeveloperScreen`
  shows a **View: Developer | Researcher** switch (remembered, `developer-view`) and the contents list follows it.
- **Developer view** gains **"Matches Figma"** (`FigmaParity` in `docKit.jsx`): the exact Figma sample drawn with the real
  component at 808px and **17 checks** (card size 808x210, fill, border, radius, padding, gaps, type, colours, evidence section,
  bar height/radius/segments/colours) read live from the DOM and compared with values read from the Figma nodes - 17 of 17 pass.
  Plus contrast table, token tables (Light/Dark), Figma's Purpose/Can contain/Boundary text, updated props/usage/copy rules.
- **Researcher view** (data-scientist point of view, plain language): the data story, at-a-glance facts, what evidence it can carry,
  how the sentence is made (answers -> Driver -> Explorer -> organisation -> band -> template), how it follows the widget's level
  (table of every Scope that uses it), three **live** summaries from the dataset with a "where each part comes from" table, nine
  constraints (describes not explains; averages hide spread; one comparison is not a trend and no significance test exists; fixed
  70/40 cut-offs; groups under 5 hidden; parts count equally; templated wording; silent on participation; synthetic data), what
  it does / does not answer, how it sits next to the other Stories, and five open questions (70/40 vs 80/60, show n, minimum
  detectable change, band vocabulary, amber legibility). Repeat this two-view page shape for the next Stories.

### Developer pages are the handoff; design-review material goes last (Insight Summary pass 2)

Direction: the Developer pages are for the people who build the component, so Figma ids, parity checks, token
disagreements and "what Figma says" are **hidden from the main flow and collected in one closing section, "For the design
owner"** (anchor `owner`, last in the Developer view). The header no longer shows a Figma id. A Developer page should define
everything needed to build the component without opening Figma: Overview (purpose / can contain / boundary, where it appears),
**Try it** (interactive playground: change inputs, see the live component, copy the generated code), Anatomy (measured),
**Specification** (every value with its token, Light | Dark), States, **Sizes and edge cases** (320 / 480 / 808px, long names,
0 and 100, no change, no earlier round, one part), **Content and voice**, Accessibility (with computed contrast), Props and usage,
a **Done checklist** of testable statements, then the owner section (the `FigmaParity` table, 17 of 17, plus the token and copy
decisions). Researcher view stays Figma-free too (neutral wording, "an earlier design sample"). Reuse this shape for each Story.

**SHAPE Voice and Language Guide** (`docs/shape-voice-and-language-guide.md`, added by the user) is now a standing rule for all
product copy and for docs copy: UK English; contractions ("It's", "Here's"); **no em dashes** (comma or full stop); no AI-sounding
words (fostering, cultivate, unleash, driving, embrace, embark, unlock, tailored, thriving, "one ___ at a time"); SHAPE in
capitals; Explorers capitalised; well-being with a hyphen; Oxford comma for three or more, none for two; acronym plurals without
an apostrophe; mascot lines are sentence case, one line, end with a full stop; headings (titles) are title case, under 7 words,
no full stop. Insight Summary headlines are full-sentence statements, so they follow the sentence-case / full-stop style, not the
title rule (flagged for the owner to confirm). Applied so far to the Insight Summary strings (`storyCatalog.jsx`, the summary
recipes in `scopeRecipes.jsx`, the Developer pages). **Not yet applied** to the other Stories' copy: em dashes remain in Score
Meaning, Methodology, MEANING texts, Breakdown, Diagnostic, Composition, Actions and others, to be fixed Story by Story with each
Developer pass. `BandBar` now has `role="img"` and a text label.

## Breakdown Story — rebuilt against Figma `13622:35946` (10 frames)

The Breakdown section was sorted in one pass: shared controls, the table, the radar and area charts were rebuilt to the
frames, four new forms were added, and a Developer + Researcher page was written. The Developer page's closing "For the
design owner" section holds **nine parity tables (91 rows, all matching)** measured in the browser against the real frames.
- **Status faces are now the supplied SVGs** (`src/assets/status-faces/*.svg`); `StatusFaceIcon` draws the circle in the
  status colour plus the verbatim mouth path per status. Never estimate a face again.
- **Shared pieces changed** (every Story that uses them follows): `controls.jsx` (Switch 36x20, compact ghost `ControlButton`
  with 16px icons, new `FiltersControl`), `DataTable.jsx` (Figma `13622:36806`: lines above the header and under each row,
  52px rows, Text md/600 band-coloured score), `StoryCard.jsx` (`EvidenceSection`), `TrendPill` (tokenised).
- **`BreakdownStory`** variants: `radar` (774x524, five rings to r216, spokes to 250, `#EB5421`), `area` (HTML+SVG, purple
  curve edge to edge), `bars` (247px label column, 8px track, score + change pill), `list` (115px number block + sentence),
  `distribution` (one 8px split bar), `zones` (ours). `rank` (default true) sorts strongest first; pass `rank={false}` to keep the
  design's order. `initialView="table"` opens in Table View. Radar labels now overflow visibly and 9+ spokes get 28px below.
- **New:** `SeverityBreakdown.jsx` (Mental Well-Being, Personal / Team / Org, five tinted Likert cells per measure),
  `EffectBreakdown.jsx` (Health Age drivers), `lib/wellbeing.js` (`orgSeverity()`). Catalog ids `wellbeing`, `healthage`;
  chat words "mental well-being", "health age". **Mental Well-Being is Org only from real data**; Your/Team and Health Age are
  sample data and tagged so (no per-person, per-team or age data exists). Health Age is blocked in the builder.
- **Figma facts worth keeping:** a Story's evidence frame can be taller than you expect (Area is 380, not 400); band header
  text is trimmed to 7px; Team cells are 56px with no gap between the percent and count; the marked "Your" cell is 36px with the
  4px underline inside it; the table header's line plus 16px padding made it 1px too tall until its padding was trimmed.
  Check node ids against real Figma output before citing them (two were wrong and corrected).
- **Flagged for the design owner (on the page):** non-design-system colours `#4d4d4d`/`#666`/`#808080`/`#C7C7C7` mapped to
  text/border tokens and the radar's `#EB5421`/`#FD531B` kept as constants; Team/Org Moderate cell is green in the design but
  amber in Your (built amber); carets are green-up/red-down whatever the band; Filters has no designed contents (built as a
  status checklist); "Select a point" says click but charts are hover-driven (ours says Hover); severity cut-offs
  (80/60/40/20) are an assumption, not a clinical scale; toggle knob is white in the design vs a grey DS token; sentences such
  as "Seek support immediately" need clinical review; 7 frames share the name "Chart Breakdown -02".
- Verified in-browser: all nine parity tables, the playground's nine forms, the Researcher view (no Figma mentions), the Org
  Score Scope radar with 12 real Explorers, and the Widget Builder (Breakdown radar; "add mental well-being" on an org-wide
  widget gives 15 real cells); zero console errors in a fresh tab. Not checked: Dark mode of the new forms.

## Responsive Stories — a Story responds to its card's width, not the window

Feedback: the Breakdown charts broke at phone width (bars spilled past the card, the zone chart's text was unreadable,
Mental Well-Being's grid overlapped), and every Story has to work on mobile and inside a Scope of any width. So responsiveness
is now a property of the **Story card**, not of media queries.
- **`stories/storyWidth.js`**: `ScopeCard` (the shell every Story renders through) measures itself with a `ResizeObserver` and
  shares `{ width, compact (<560), tight (<400) }` through `useStoryWidth()`. At 560px and up nothing changes from the designed
  808px layouts (all 91 Figma parity rows still match). A Story that renders its own card cannot read its own width, so it
  reads it from inside the card with `<WithWidth>{({ compact, tight }) => …}</WithWidth>`. `useElementWidth(ref)` is the
  generic hook. `StoryCard`'s title/controls row is its own component (`StoryHead`): on compact the controls take a full-width row.
- **Compact layouts** (all in the Story's own file): Bars stack the label (may wrap) beside the score and change with the track
  full-width below; List shrinks its number block to 84px, and stacks fully when tight; Radar becomes a square cropped plot with
  numbered marks on the spokes and a key below; Area gets a 200px plot, numbers under the points and the same key; Zones become
  three tinted groups of rows; Mental Well-Being puts the measure name above a full-width row of five cells (share, then count
  and caret, unit in a note); Health Age drivers put the name and pill on one line over a full-width track; DataTable headings wrap
  and the table scrolls sideways when columns need more room.
- **Hover becomes tap.** `stories/compactParts.jsx` (`NumberedList`, `DetailCard`, `NumberBadge`) is the shared key and the inline
  detail that replaces the hover tooltip. Charts use pointer events; on compact, selection sticks until tapped again (no pointer
  to leave), with `touch-action: pan-y` so vertical scroll still works. Rows in the key are 44px tall.
- **Developer page**: a **Responsive** section renders every Breakdown form at a chosen card width (320/390/480/560/808) with a
  table of what changes. The sidebar's Breakdown family now lists the forms (Radar, Area, Bars, List, Distribution, Zones, Table
  View, Mental Well-Being [Org, Team, Personal], Health Age Drivers), each opening the page at its form
  (`FAMILY_FORMS` in `developer/storyFamilies.js`; ids `form-*` in `BreakdownDoc.jsx`). Sidebar jumps scroll instantly and
  re-align once after 900ms because live examples change height while they measure themselves.
- **Not done yet, by scope:** only the Breakdown Stories have compact layouts. Every other Story (Diagnostic, Composition, Trend,
  Score History, Actions, Methodology…) already receives the width context but has not been adapted, so check each at 320px
  when its Developer page is written. The app shell itself (nav rail, report grid, Scope pane chrome) isn't mobile-adapted either.
  The Scope pane's CSS `zoom` (50 to 125%) may change what `offsetWidth` reports; not tested at non-default zoom.

### Phone pass on Score History and Explorers by Status

Feedback: on a phone Score History was a very long card (round tiles stacked in a grid, 12 two-line rows, the scale at the
very bottom) and Explorers by Status was "a big chunk of RAG" (three tinted blocks).
- **Round tiles** (`HistoryCards.jsx`, compact, Current style): a sideways strip that snaps tile by tile, bleeding to the
  card edges, 124px tiles, 26px score, month-only dates ("Nov 2025"). Desktop and Refined unchanged.
- **Explorer Changes** (`ScoreHistoryStory.jsx` `Dumbbell`, compact): biggest moves first, five rows then `ShowAll`, rows
  ~44px (name, change and score on one line over an 18px track). The legend ("before" dot, "now" ring) and the zoomed scale
  ticks sit at the **top** of the chart; the bottom axis and "the scale runs from…" caption are gone.
- **Explorers by Status** (`ZoneChart.jsx` `ZoneGroups`, compact): one slim 0–100 strip with thin zone tints and 10px dots
  (lanes when close), a one-line count per status, then a plain hairline list **lowest first** under quiet uppercase status
  labels, six rows then Show all. Tapping a row marks its dot on the strip (others dim). The wide (560px+) zone chart is
  unchanged.
- Verified at 360px: no overflow, row tap, Show all, row expand; Score History card ~1,410px tall (was much longer).

### Softer dividers, phone tables, Status Over Time, Score History changes redesign, pinned "Add a story"

- **Divider lines are `border/tertiary` now, not `border/primary`** (product direction: "not enjoying all these harsh lines"):
  the Evidence Section hairlines (`StoryCard.jsx`, used by every Story), Comparison's dividers and the Breakdown List separators.
  The Developer pages' spec rows say tertiary and their evidence parity rows expect `#e5e4e3`, labelled "softened from Figma's
  #b4b2b1", so the difference from Figma stays visible. Tables were already tertiary.
- **Table View on a phone** (`DataTable.jsx`): up to 3 columns stay a table with tight cells, number columns hugging their content
  and long "Change from …/since …" headers shortened to "Change" (or a column's own `short` label); **4+ columns become stacked
  row blocks** (the row's name, then each other column as a small label over its value, in a wrapping grid). Nothing scrolls
  sideways any more (it did for Gaps 503px, Mental Well-Being 537px and every 4-column table). Composition's own table becomes two
  lines per group on a phone (name and score; people · share · against average, change pill). Mental Well-Being cells read
  "24% · 24" on one line (Copy Table keeps "24% (24 Employees)"). Scratch check: `widgets-gallery.html?stories&subject=0&w=360`
  (new: renders catalogue Stories for a sample subject; `subject` indexes `SAMPLE_SUBJECTS`).
- **Status Over Time** (Org Status Scope) is now a Trend-family form, `StatusOverTime` in `TrendCharts.jsx`: one stacked bar per
  round in the shared frame (percentage axis), Flourishing on top in the status graph colours, shares printed inside segments that
  fit, hover/tap names the segment (share, change in points, people), a legend with the latest shares. It replaces the old
  three-line `TrendStory` there.
- **Score History changes, redesigned** (redesign-existing-projects pass; `ScoreHistoryStory.jsx`, `HistoryCards.jsx`): round tiles
  are **one segmented strip** (tiles share the width, the picked one raised white; scrolls only when rounds don't fit); "Explorer
  changes" is one sentence-case heading with a summary line ("9 rose · 0 fell · 3 held, Nov 2025 against Jun 2025") and a ○/● key;
  rows are **one grid (name | track | change | score), sorted biggest rise to biggest fall**, the track zoomed to the scores' range
  with the ticks once on top and soft gridlines, a hollow dot for before and a solid status-coloured dot for now; no tooltip, no
  chevron column (the numbers are on every row; the whole row tints on hover, `.sh-row`). Phone: track under the name line, a
  single hairline instead of gridlines, five rows then Show all. Desktop shows 12 before Show all (45 Drivers on Factors).
  **A New | Previous switch** (pill tabs in the Story's controls, chart view only, remembered in `score-history-style`, default
  New) brings back the layout from before this pass: `ScoreHistoryClassic.jsx` (`ClassicHistoryCards` + `ClassicChanges`), i.e.
  the separate round cards and the 0–100 dumbbell with right-aligned names, change pills, hover tooltip, and its phone layout.
  Selection and the expanded row are shared; switching closes an open row.
- **"Add a story" is always visible** in the Widget Builder's side panel (Workbench left panel, Original's wide rail): the outline's
  list scrolls on its own and the button is pinned under it (`ScopeOutline.jsx`). Inline (narrow) it still follows the list.

## Breakdown — which form, and how many parts (rules)

**Which form (product direction):** **List** is for introducing the **Areas**: it is large, a big number and a sentence each, so
"what's behind your score" reads as bigger and more important (2 to 6 parts). **Bars** is for the **Drivers** under an Area:
smaller rows, many of them. Radar and Area show the shape of a handful of parts; Zones shows where many parts sit against the
status ranges. This is on the Breakdown Developer page (overview and forms table) and the Researcher view.

**Few, many, odd (`stories/breakdownRules.js`, one table read by the components and by the Developer page):**
- `RULES` per form: `min`, `ideal`, `labelled` (most parts that keep names on the chart), `max`, `fallback`, `firstRows`.
  `fitForm(variant, n)` returns what to draw. **Radar** needs 3 to 24 parts (names while they physically fit, see "Radar and area labels" below; numbers + a key only after that, even on a
  wide card); **Area** 3 to 20 (names in one row, then staggered over two, then numbers + key); **List** 1 to 8; outside those, the Story draws **bars** and
  marks the card `data-fallback="radar"`. **Bars** take any count: past 12 rows only the first 10 show until "Show all" (a "+2"
  rule, so 12 rows show all 12). **Mental Well-Being** shows the first 6 measures past 8; **Health Age drivers** the first 10
  past 12 (`ShowAll` is exported from `BreakdownStory.jsx`). **Zones** dots shrink 22 to 16 to 12px at 16 and 32 parts
  (`dotRadius`). The table always has every row.
- **Odd values:** a part with no score (not a finite number) is left out of every form and the Story says how many; no parts at
  all gives "There's nothing to show here yet."; scores outside 0 to 100 are drawn clamped (`clampScore`) with the real number
  printed; 0, 100 and all-equal draw as they are; parts are keyed by position so repeated names don't break React (names must
  still be unique in one insight, since the table can't tell them apart); one part in the distribution reads as a sentence.
- **Developer page:** a "Few, many, odd" section has the rules table, an interactive "Try the rules" showcase (form × count
  0 to 45 × case × card width, with a live readout of what the rules did) and the odd-case table. A 168-combination sweep
  (forms × cases × 3 and 13 parts × 320 and 808px) found no horizontal spill and no errors.
- Known cosmetic: motion's layout animation in the Bars | Zones switch can emit an invalid `box-shadow: …NaN` for a frame when a
  card is resized; the chart is unaffected.

## Diagnostic Story — rebuilt against Figma `13622:37239` (2 frames + 7 of ours)

Built in an earlier session (on another account) whose notes never reached this file; recorded here from the code.
- **From Figma:** *What Stands Out* (`13622:37240`, `StrongestWeakestStory`) and *Areas to Focus On* (`13622:37281`,
  `AreasToFocusStory`), both in `DiagnosticStory.jsx`. Shared parts in `stories/diagnosticParts.jsx`: `InnerCard`
  (surface/card, 1px border/secondary, radius/lg, 16/16), `SegmentBar` (ten 8px segments, filled = score/10 rounded),
  `GroupCard` (axis icon + group + System Tag | change pill + score + inert chevron, then "n out of N employees are …"),
  `RailRow` (the Breakdown bar row reused), `CardGrid` (2 columns, 1 when compact), `AxisIcon` (Figma's gender / age /
  ethnicity icons; tenure uses the age icon; the rest are lucide line icons).
- **Ours, restyled to those rules** (`FamilyStories.jsx`): What Changed, Bright Spots, Where Gaps Are Widest, What Moves
  With This, Priority Map, Within Reach, How It Ranks. Refined style keeps the `*Legacy` versions in `ExtraStories.jsx`.
- **Developer page** `developer/docs/DiagnosticDoc.jsx` (Developer + Researcher views): 34 parity checks (16 + 18), all
  matching. Two rows had the same label ("Card fill…" for the Story card and the inner card), giving React duplicate
  keys; the inner-card rows are now "Inner card fill…".
- **Fixes this pass:** `GroupCard`'s header no longer wraps the change/score/chevron cluster onto its own row when the
  name + tag are long (Bright Spots had mixed card shapes); the tag drops under the name instead and every card keeps
  the design's shape. The Priority Map's on-plot names now avoid other dots and the quadrant titles, try right / left /
  above / below, and are offered to every part (Fix first placed first), not only to Fix first when there are 9+ parts:
  12 Explorers went from 3 named to 9, with no collisions.

## Composition Story — rebuilt against Figma `13622:39606`

The section is too big for one `get_design_context`/`get_metadata` call (the connector truncates at ~69KB), so children
were read one by one: `13622:39607` (Organisation rings), `13622:39699` (People rings), `13622:39765` (Table View).
Employment/Locations card labels were read from a full-resolution `get_screenshot` cropped locally with PowerShell's
System.Drawing (the browser pane refuses figma.com URLs; there is no Python on this machine).
- **`CompositionStory.jsx`** (rewritten): title "Breakdowns", tabs as one pill (`PillTabs`, new in `controls.jsx`), Table
  View / Copy Table. Chart View = one ring per axis, 16px apart, centred in an Evidence Section, footer "Select a segment to
  view details." that becomes the selected group's details (the design draws no details panel, so nothing moves).
  Table View = six equal columns, a `card-within-card` band per axis with an up/down chevron (first open), rows 52px apart
  with hairlines, bold group + status-coloured bold score, grey 40px "-" pill for no change. `initialView` prop added.
  The old Donut/Bars switch, side legend and generic table are gone.
- **`DonutChart.jsx`** (rewritten as the Figma ring): 176 box, ring r80/r56, segments touching from 12 o'clock clockwise,
  DS graph palette in the frames' order (`segmentColor`; Work Composition uses Personal Blue / Org Blue / Mint), axis icon
  + name in the centre. Compact cards shrink rings to 150 / 128px.
- **Labels follow the design where the data matches:** tenure → "Employment Duration", workModel → "Work Composition",
  location → "Site" (local map in `CompositionStory.jsx`; `COMPOSITION_TABS` unchanged so other Stories keep their labels).
  Age, Ethnicity, Education, Salary, Country don't exist in the data and aren't shown.
- **Icons:** Figma's Department (its path is drawn sideways and rotated on canvas; the swap of x/y is baked into
  `assets/axis-icons/department.svg`) and Job Level are now in `AxisIcon` (so Diagnostic cards changed too). Employment
  Status / Work Composition / Site still use lucide stand-ins; the real ones live in the "SHAPE – &Form" library file.
- **Developer page** `docs/CompositionDoc.jsx`: 27 parity checks (13 chart + 14 table), all matching, measured on live data.
- **Second form, "Donut", kept by request** (the user preferred the earlier donut): `CompositionStory form="donut"` puts
  each axis in an `InnerCard` (icon + name header) with `DonutLegend.jsx` (the earlier donut + linked legend, restored from
  git and moved onto DS tokens/text styles, tap support added, colours from `segmentColor` so a group keeps its colour
  across forms). Tabs, Table View and data are shared. Offered as a separate catalogue Story, **"Composition (Donut)"**
  (`composition-donut`, family Composition, not suggested by default; chat "donut" / "pie chart" / "composition donut",
  which suppresses the plain "composition" match). Developer sidebar lists Rings / Donut / Table View
  (`FAMILY_FORMS.Composition`, anchors `form-rings` / `form-donut` / `form-table`). It isn't in Figma and needs a design
  review; that's said on the page's owner section, never as a label in the nav (the user dislikes those).

## Actions — rebuilt against Figma `13622:36874`

- **Current style rebuilt** (`ActionStories.jsx`; Refined branch untouched): `ActionsStoryBar` = bg/secondary bar, 1px
  border, 18 radius, "Read More ›" dark pill (sm 28px / xs 24px, `DarkPill`); `ActionsCta` = the 28px dark pill with no
  icon. The layer: a Driver nav (card-within-card panel, rows 8/18, Text xs/Medium, bold status-coloured score, open row
  ghost-hover grey + bold) a third of the width, cards two thirds. Cards exported one by one: `ActionsYouCanTakeCard`
  (headline, subhead, two paragraphs, Share this guidance), `ThinkAboutCard`, `PlaybookCard`, `LoveScienceCard`,
  `CitationsCard` (collapsible). Illustrations from Figma in `assets/actions/`.
- **Love Science and Citations only render when real content is passed** (`ActionsLayer content={{ [driver]: { science,
  cites } }}`): they make research claims and nothing in the prototype has real studies. The Developer page shows them with
  the design's own sample. Templated copy lost its em dashes and gained the subhead / second paragraph.
- **Bug fixed while checking:** `padding` shorthand + an undefined `paddingRight` gave the CTA 6px on the right instead of
  14; all four paddings are explicit now. CTA width parity compares height/padding/type, not width (the label renders
  129.x px vs Figma's 130px box).
- **Developer page** `docs/ActionsDoc.jsx`: 17 parity checks (bar 5, CTA 1, cards 8, nav 3), all matching.

## Comparison and Trend Stories — Developer pages only (Figma `13622:39086`, `13622:37493`)

Per explicit direction, built as components + Developer / Researcher pages only; **not wired into Scopes or the Widget
Builder yet** (the catalogue's "Comparison" entry is still blocked).
- **Comparison** (`stories/ComparisonStories.jsx`, `docs/ComparisonDoc.jsx`): the legend is the control: an entity card per
  You / team / Org (card-within-card, 1px border, radius/lg, 16px from the edge including the border; team cards 88px with
  a full-width System Tag) with a 36×20 toggle in its series colour (`seriesColor`: You Purple, Org `#FD531B` Orange Coral
  600, a primitive; teams Team Blue / Mint Green / Lavender Violet, none shown on in any frame). You + Org start on; with
  no You, the first team does. Forms: `ComparisonRadar` (legend `side` 511+247 or `below`), `ComparisonArea` (Sort on /
  Sort by / Clear as small menus, tooltip per part), `HealthAgeComparison` (bars from an actual-age centre line, 10 years
  = half the track; the frames' own bar lengths contradict their numbers), `ComparisonLegend` (vertical / horizontal).
  Live examples use the two largest departments as "teams" (`groupPartMeans`); there is no per-person You, and no ages, so
  You and Health Age appear only with the design's sample values (tagged). 14 parity checks, all matching.
- **Trend** (`stories/TrendCharts.jsx`, `docs/TrendDoc.jsx`, existing `ScoreHistoryStory` documented as the first form): one
  shared `Frame`: rotated axis title, 22px tick column, a 184px plot (180 for the bar forms), gridlines in border/tertiary,
  round labels 24px under with the latest in bold capitals. Forms: `ScoreOverTime` (line in border/primary, dots
  border/strong, values in status colours; also Health Age with a dashed reference), `ScoreOverTimeRows` (small multiples),
  `StateOverTime` (stacked Likert severity, pill tabs with `tone="default"`, hover tooltip), `LevelOverTime` (bar heights
  180/141/106/71/34, hover compares with the round before), `ENPSOverTime` (Likert Subtle stacks; **eNPS on its own −100…100
  right axis** because our eNPS is negative every round and the frame's 0–100 axis can't show it). New
  `wellbeing.js` `severityByRound()`. The frame only scrolls sideways when the card is narrower than its minimum (an
  overflow container clips the value labels and tooltips otherwise). 16 parity checks, all matching.
- Gotchas hit: `docParts`' `T()` prefixes `color/`; utility tokens (Likert, graph) need `tok("utility/…")`. Figma's
  padding includes the border; match it with `padding: 16 - border`. SVG `stroke`/`fill` set as attributes can't be read
  by the token-aware parity helpers; set them in `style`.

### Responsive pass on Comparison / Trend + label rules (user: "a lot of points where it seems unusable")

- **Real bug, the root of most of it:** a Story that renders its own card and called `useStoryWidth()` at its top level
  read the context *outside* its card (the Scope's width, or the default 808), so ComparisonRadar/Area, HealthAge,
  ScoreOverTimeRows and LevelOverTime never went compact. New **`useOwnWidth()`** (`storyWidth.js`) measures a wrapper div
  around the card; use it whenever the component renders the `StoryCard` itself. Components inside a card keep using
  `useStoryWidth()`.
- **No sideways scrolling anywhere.** Trend `Frame` now measures its plot and passes `{ plotW, slot, barW, compact }`
  (children/`right` may be functions): compact drops axis titles, bars are 60% of the slot (16–54px), round labels shorten
  to "Sep 25" under a 60px slot and show every other one (always the latest) under 34px, Level names wrap in 64px, the
  Level comparison opens under the chart on a tap, tooltips are clamped inside the plot. By-part rows stack the name
  above the line. Score History's round cards become a grid on compact (Figma's own row overflows the card).
- **Comparison radar now uses `ScopeRadar`** (new `series` prop: polygons per series, tooltip/detail/key list every series;
  `NumberedList` rows accept `series: [{color, value}]`). Legend beside only when the card fits 460 + 247px.
  Comparison area: numbered marks + key under 26px a part or on compact, 200px plot, tap detail under the chart, sort
  menus left-anchored on compact.
- **Label rules (product direction):** radar always numbers from **20 spokes** (`RADAR_NAMES_BELOW`); the Breakdown area
  chart's **staggered names were removed** (user disliked them) — one row of names (up to three lines, as designed) or
  numbers, nothing in between.
- **Developer pages:** `docs/WidthShowcase.jsx` renders every form at 320/390/480/560/808 (used by Comparison and Trend).
  Audited by script at every width: no element outside its card, no scroll containers, no overlapping round labels.

## Developer screen chrome

- The breadcrumb moved out of the sticky header (its width made the header grow and shrink) to just above each page's
  `<h1>` (`<nav aria-label="Breadcrumb">`); the header holds only View / Style / Mode / Inspect, right-aligned.
- The "Figma" notes under What Stands Out / Areas to Focus On in the sidebar were removed (user didn't want them).

## Radar and area labels — numbers are the last resort

Feedback: once labels got crowded, the charts switched to numbered marks plus a key, which made Stories much longer. The
radar did it on any card under 645px, even with five short names.
- **Radar** (`ScopeRadar.jsx`, `fitRadarLabels(labels, angleOf, scale)`): text is kept at 11px or more on screen, and on
  a narrower card the rings shrink (216 down to a 90px on-screen radius, `RINGS`) so names still fit beside them. Each ring
  size tries wrapping at 18 / 14 / 11 characters. It returns `{ R, wrapAt, text, line }` or null; null is the only route
  to numbers. The width gate is gone, and phone-width cards try too. 12 Explorers keep names down to about a 450px card.
- **Area** (`AreaChart.jsx`, `fitNames`): one row of names first (up to three lines each); if too tight, **staggered over
  two rows** (each name gets twice the room, up to three lines, with a hairline tying a second-row name to its point; end
  names are clipped to the plot via `staggerBox` so nothing spills sideways); numbers only when neither fits. A 6-Driver
  chart on a 446px card now staggers instead of showing a key.
- **Hover on names everywhere:** the key (`NumberedList`, `hoverable` + `onHover`) now drives both charts (the props
  existed, but neither chart had passed them). A key hover only highlights; the detail card stays for taps and chart
  hovers, because inserting it above the key moved the hovered row out from under the mouse. Hover from a name under the
  area chart (row or staggered) already worked. Separately fixed: a wide card in numbered mode never cleared its hover
  when the mouse left (leave was gated on `compact`, which is now also the numbered state); it now checks for a mouse.
- `BreakdownDoc.jsx`'s rule text and responsive table were updated to match.

## Widget Builder: Story toolbar, forms, repeats, suggestions, phone preview, sweep

How the Story system plugs into the Widget Builder (`components/widgetbuilder/`). Supersedes the earlier "Show as" switch in the Story header, which was removed.
- **Floating Story toolbar** (`StoryToolbar.jsx`): hover or focus a Story in either builder screen and a dark toolbar appears above it with
  the Story's name (tooltip: why it is here, or its purpose), a **Sample** tag where the Story's copy is sample, **Show as ▾** (forms),
  **Add again in another form**, move up, move down, **About** (opens its Developer page via `docIdForStory()` and `openDeveloper`),
  and remove. A Story is focusable (`tabIndex 0`), so a tap or the keyboard opens it too. The "In this scope" rail keeps its always-visible
  move/remove. The header switch and `storyForm.js` are gone, so no Story knows about forms.
- **Forms** are declared in the catalogue: `forms(subject)` and `defaultForm(subject, spec)`. Breakdown: Radar, Area, Bars, List, Zones (only
  those `fitForm()` allows for the number of parts). Score Meaning: Number, Ring. The default follows the widget: a Profile widget opens
  its Breakdown as a radar, a Parts widget as bars, a Gauge widget its Meaning as a ring (`spec` is passed in `ctx`).
- **Placements.** `built.stories` is still a flat array, but each entry is a placement key: the Story id, or `id~2`, `id~3` for another
  placement of the same Story. Only a Story with more than one form can be placed again, and **never twice in the same form**: the menu
  shows a form another placement uses as disabled ("In use"), "Add again" appears only while a form is left, and the new placement takes
  the first unused form. Helpers in `storyCatalog.jsx`: `baseId`, `storyById` (understands keys), `hasStory`, `placementsOf`, `formsOf`,
  `formOf(def, subject, options, spec)`, `formsInUse`, `availableForms`, `unusedForm`, `canPlace`, `placeStory`, `removeStoryKeys`,
  `againIds`, `placementForm`. `insertStory` puts a repeat next to its siblings. The Add Story menu lists a placed multi-form Story as
  "Name · another form". Chat: "add the breakdown" again adds another form; "remove the breakdown" removes every placement; asking for a
  form already used says so.
- **Options are saved with the widget**: `built.options[key] = { form }` goes into `scope.options` on "Add to Report"; `BuiltScope` takes
  `scope` and the widget's `spec` and draws what was built. The report shows no toolbar.
- **Data-driven default Scope** (`suggestScope(subject)`, `SUGGEST_RULES` in `storyCatalog.jsx`): the eight base Stories plus up to 3 whose
  rule fires on the subject's data, each with a reason stored in `built.reasons`, shown in the toolbar tooltip, the rail row tooltip, and the
  opening chat reply. Starting thresholds, changeable in one table: Where Gaps Are Widest at a 15-point gap, Within Reach with 2 parts within 3
  points of a status line, How Scores Are Spread when the middle half spans 30 points, What Changed at an 8-point move, Areas to Focus On when
  the lowest group is 10 points under the whole, Who Is Where when half of people are Struggling, How It Ranks in the top or bottom 3. What
  Moves With This has no rule: in the prototype data every link is strong, so it would always fire.
- **Phone preview** (`PreviewWidth.jsx`): a Preview Desktop | Phone toggle in both builder headers narrows the Scope to a 360px column
  (remembered in `widget-builder-preview-width`). Stories already measure their own card, so they show their compact layouts.
- **Developer pages**: **Story availability** (every Story by five real subjects using each Story's `blocked()`, the default Scope per subject,
  the suggestion rules and what they add right now, and the forms offered) and **Story sweep** (draws every Story, in every form, for every
  subject that supports it, at 320, 560 and 808px, off screen, and reports errors, empty drawings, and overflow; the overflow check ignores
  tables, charts, scrolling areas, and boxless elements such as `display: contents`). Both use `developer/sampleSubjects.js`.
- Verified in-browser: toolbar on both builder screens (focus), move, forms menu with in-use forms disabled, Add again, About opening the
  Developer page, phone preview (all Stories 360px, no overflow), rail labels, reasons in the opening reply, a report Scope showing the chosen
  forms, and a clean sweep (336 renders, 0 errors, 0 overflows, 0 empty).
- **Not done:** forms for Stories beyond Breakdown and Meaning, a toolbar on the report's own Scope pane, and thresholds tuned on real data.

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

### Rebuild against a real Figma reference (984qJvMt7fCHASYHRwgrab, node 13750:16126)

Search finally got a dedicated Figma reference — "Search Function," 6 annotated states (first-use
empty, returning-user empty, active results, loading, no-results, plus a fuller results
reference), each with its own designer note. Studied via `get_metadata` (structure + the
annotation cards' own text) and `get_design_context` on each state's real node before writing any
code, per the design-to-code skill. User confirmed "add all this."

- **The old 3-theme prototype switcher (solid/light-glass/dark-glass) is retired.** The open
  "which material" question it existed to explore is now answered by the Figma node itself — a
  plain solid white card over a flat dark scrim, no blur/frost anywhere. Every color/spacing/
  shadow value in the rewritten `SearchOverlay.jsx` is sampled directly off the real nodes
  (13750:16469/16221/16333/16412), not eyeballed — and all of them turned out to already exist as
  named tokens in `lib/tokens.js` (e.g. the sampled `#504c4d`/`#a5a2a2`/`#f2f2f2` are exactly
  `T.gray700`/`T.gray300`/`T.gray50`), so nothing new needed adding there.
- **First-use vs. returning landing views** — a session with zero real search history
  (`recentSearches.length === 0`) now shows "Suggested Search" (today's real worst-3 dimensions,
  the same `dimensionRankedRows().slice(-3).reverse()` signal `ChatLanding`'s own starter chips
  already use — not a new hardcoded list) + "Featured Services"; once a real search has happened,
  it's Recent Searches + Recent Drafts as before. This is a genuine behavioral fork, not just new
  copy — the previous version only ever had one landing view.
- **A real ~300ms debounce** between the raw `query` (what the input shows, so typing feels
  instant) and a new `debouncedQuery` (what filtering/tabs actually run against) — the gap between
  the two drives a real loading state per the Loading annotation ("Search is live... debounce
  ~300ms"): "SEARCHING RECORDS...", 3 skeleton rows, tabs/FilterBar hidden. The old version
  filtered synchronously on every keystroke with no loading state at all.
- **"No results" redesigned** to the reference's actual dead-end treatment — sad-face icon (lucide
  `Frown`, standing in for Figma's own `face-sad` asset), two-line copy, a real "Clear Search"
  button (`Button` component, `theme="brand" variation="primary" size="xs"` — its color table
  already matched the sampled node's `#231F20`/`#E5E4E3` exactly) — plus three fallback chips
  rendered *below* the card, not inside it: "Explore Services" has a real destination
  (`onGoLibrary`), "Create a Service"/"Review Insights" close the palette with no other effect,
  the same honest-inert treatment this file already uses for Services/Reports/Drafts/Settings
  results.
- **Sections now cap at 3** (was 5) with a real "See all" link that jumps to that section's own
  tab — matches the reference's per-section cap exactly (confirmed live: searching "score" surfaces
  7 real widget matches, shows 3 + "See all," and clicking it switches to the Widgets tab showing
  all 7).
- **A real footer result count** ("N Results"/"0 Results," blank during landing/loading) — the old
  footer only ever showed keyboard hints.
- **"OWNED" badge on Services/Widgets results** — new `owned` fields on `FAMILIES`
  (`lib/families.js`) and `SERVICES` (`components/chat/AttachMenu.jsx`), per the user's own
  clarification ("distinguish widgets and services that you own from store or not"). Not an
  arbitrary curated flag: a family is `owned: true` iff it's one of the exact three
  (`your-score`/`explorers`/`org-status`) `App.jsx`'s `createReport()` always seeds onto every new
  report — a real signal, since every report you generate really does start with those three. A
  service is `owned: true` only for "SHAPE Performance Index," the one service that same seed path
  actually corresponds to. `SERVICES` also gained a decorative `color` field (existing
  Graph/Dataviz palette tokens) so each service row gets a small colored-dot "logo" placeholder,
  standing in for the per-service brand icons the reference shows (e.g. "Culture Reputation
  Index"/"Sedgwick Richardson") — per the user's own clarification, those specific examples were
  illustrative only, not a request to build a real multi-provider/logo system, so no such system
  was built; every real service here is genuinely SHAPE's own.
- **Type-specific secondary text**, per the reference's own "secondary info is type-specific"
  annotation — `SAMPLE_DRAFTS` (`components/shell/navRailData.js`) gained a real `edited` field
  (recency text, e.g. "Draft edited 2 hours ago" — the reference's own example copy where
  sampled), `SAMPLE_REPORTS` gained a `blurb` field (one-line description, same honest-sample-data
  status the rest of that file already has; the `shape-perf` line reuses the reference's exact
  sampled copy — "From employee signals to business clarity." — the others written in matching
  tone since no other report's blurb was sampled). Services/Widgets rows show "SHAPE"/category as
  before.
- Verified end-to-end in-browser: first-use empty state (Suggested Search + Featured Services,
  matching the landing chat's own starter chips), typing "Performance" → visible loading skeleton
  → settles to a real 2-result Services+Reports view with an OWNED badge and the real report
  blurb, "score" → 7 real widget matches capped at 3 with a working "See all" → Widgets tab,
  "xyz123abc" → the full no-results treatment with all three fallback chips, "Clear Search"
  returns to landing, closing with Escape after a real query correctly flips the next open to the
  returning-user view (Recent Searches + Recent Drafts with real recency text), and a widget result
  still adds directly to a fresh canvas via the existing `onAddWidget` path — zero console errors
  throughout.

## Create Tools Menu (`components/shell/NavRail.jsx`)

The nav rail's "Create" item previously did nothing at all (no `onClick` wired, per the older
note elsewhere in this file). Given a real Figma reference (`Z6YmEggwvoiX3j4d3kCKqV` "SHAPE 3.0
Roughwork", node 2111:7157/7158) and explicit direction to make room for a growing tool set, it
now opens `CreateToolsMenu` — a two-column floating panel (333px tool list + 275px "Coming soon"
promo, matching that node's own layout exactly) built on this file's existing
`useMenuFloating`/`FloatingPortal` pattern rather than the shared gray25 `FloatingMenu` shell,
since the sampled node uses a plain white surface at a different radius.

- **Five tool rows** (`CREATE_TOOLS`): Service Builder, Survey Builder, Report Builder, Widget
  Builder, Executive Summary Generator — real copy/icons from the sampled node (icons are the
  closest lucide equivalents to Figma's own: `Workflow`/`FileQuestion`/`FileText`/`LayoutGrid`/
  `Presentation`). Only **Report Builder** is wired to a real destination — it's the one tool this
  app actually has, since the existing chat-first flow already *is* the report builder. Selecting
  it calls a new `onOpenReportBuilder` prop, threaded from `App.jsx` down through
  `ChatLanding.jsx`/`CanvasScreen.jsx` the same way `onOpenSearch` already is; `App.jsx` wires it
  (and `SearchOverlay`'s pre-existing `onGoHome`) to one shared `goHome()` rather than two
  separate inline closures doing the same thing.
- The other four rows exist so there's real layout space for them — per explicit direction, this
  pass was about making room for the growing tool set, with Survey Builder named as the next one
  to actually build. Until then they close the menu with no other effect, the same honest-inert
  treatment this app already uses for a real-looking control with no destination yet (e.g.
  AttachMenu's "Add Files or Photos"). The right-column "Coming soon" card (Survey Validator +
  "Be first to know") is presentational only, same status.
- Verified end-to-end in-browser in both expanded and collapsed rail states (`right-start`
  placement + this file's existing `flip`/`shift` middleware keeps it fully on-screen either way):
  opening from the rail, "Report Builder" navigating home from the canvas screen, an inert row
  (Survey Builder) closing cleanly with no crash — zero console errors throughout.

## Survey Builder — node-based blueprint editor (`components/survey/`, `lib/surveyBlueprint.js`, `lib/questionTypes.js`)

A second, entirely separate tool from the chat-first Report Builder, reached from NavRail's
Create menu (its `survey-builder` row is now `real: true`, same wiring pattern as
`onOpenReportBuilder`). Per explicit product direction, this is **phase 2 only**: a manual,
node-linking canvas (DaVinci Resolve / n8n's *node-linking feel*, deliberately not a generic
workflow-execution engine) for hand-building a survey's structure — question blocks connected in
sequence, condition blocks for branching, persona visibility, action triggers, inserted
components — producing a "blueprint" (a plain node+edge JSON document) that a future editor/
publish step would consume. **Phase 1 (prompt → AI-generated, science-backed survey) is
explicitly out of scope this pass** — the blueprint's `status` field (`draft`/`validated`/
`published`) exists as an unused hook for it, never set to anything but `draft` here.

Full design reasoning lives in the approved plan this was built from
(`~/.claude/plans/velvet-hatching-dream.md`, in case it's still around) — key points:

- **New dependency: `@xyflow/react`** (React Flow v12) — the only sane choice for real node-
  linking (custom node components via one `nodeTypes` map, named `Handle`s for a condition node's
  multiple branches, `onConnect`'s `sourceHandle` carrying branch identity onto the edge). No
  other node/canvas library existed in this repo before this pass.
- **One shared custom node** (`components/survey/nodes/SurveyNode.jsx`, `type: "survey"`) rather
  than four near-identical ones — `data.kind` (`question`/`condition`/`action`/`component`)
  drives icon/color/summary/handle-count internally. Kind colors are drawn from the existing
  Graph/Dataviz palette (accent/hotPink/goldenYellow/turquoise) per this file's own status-color
  rule — these are category distinctions, not status data, so red/amber/green was deliberately
  not used here.
- **Persona visibility is a fixed 3-role set — NOT demographic-based.** The user explicitly
  corrected an earlier assumption here: demographics (age/gender/tenure/department/etc.) are
  reserved for later classification/heatmap features elsewhere in SHAPE, out of scope for this
  tool entirely. `lib/surveyBlueprint.js`'s `PERSONAS` is just `Employee`/`Manager`/`Senior
  Leader` — "uniform in the shape system" per the user's own words — and any question/component
  node carries an optional `visibleToPersonas` subset (default = everyone).
- **10 real question types** (`lib/questionTypes.js`'s `QUESTION_TYPE_CATALOG`, one source of
  truth feeding the palette, the Inspector's per-type edit forms, and the Preview walker's per-
  type respondent renderers): input, likert, multiple-choice, toggle-board, smiley-5, scale-0-10,
  scale-1-10, alcohol, bmi, freetext. `alcohol` defaults its dimension/driver tag to the real
  "Alcohol" driver (`data/generate-dataset.js`'s `DRIVER_DIMENSION`, under Physical Health) — the
  one type that can auto-tag with confidence, which is why the user called it out as unique.
  **`toggle-board` and `bmi` were corrected against real reference screenshots the user shared
  mid-build**, not guessed: toggle-board is a rating matrix (rows of sub-items × a shared Likert-
  style column scale, one radio per row — not literal on/off toggles despite the name), and bmi
  collects height (feet+inches or centimeters) and weight (kilograms, pounds, or stones+pounds)
  with a live-computed "Your BMI is: X.X" — the respondent never types a BMI number directly.
  Both live in their own respond-view files (`ToggleBoardRespond.jsx`/`BMIRespond.jsx`) and their
  own Inspector field forms, isolated from the other 8 types' shared switch, since their shape was
  explicitly provisional pending those images.
- **Condition nodes** are a real IF/branch primitive (`{ rule: {sourceNodeId, op, value},
  branches: [{id,label}, ...] }`), each branch becoming a named source `Handle` on the canvas —
  matches the user's own mental model ("if there's a separate kind of clause or condition... you
  could mention that too") more directly than modeling conditions as edge labels would have. A
  condition's rule is a single comparison, so only its first two branches are ever reachable
  from evaluation (matched → branch 0, else → branch 1) — a stated v1 simplification, not a bug;
  true multi-way branching would need a richer rule shape than this pass's `{sourceNodeId, op,
  value}` covers.
- **Action nodes are intentionally inert** ("this will trigger that action") — free-text name +
  description only, no integration/webhook field, the same honest-placeholder treatment
  `AttachMenu.jsx` already uses for "Add Files or Photos." The Preview walker still "fires" them
  silently (logs for the previewer's own benefit) and passes through — respondents never see them.
- **Component nodes** ("add this Your Network component at this point") are a small extensible
  catalog (`COMPONENT_TYPES` — `your-network` is the user's own example, plus `intro-screen`/
  `thank-you-screen` as obvious low-risk additions to the same mechanism) rather than a fully-
  built "Your Network" feature, which doesn't exist elsewhere in this app.
- **Inspector** (`components/survey/Inspector.jsx`) mirrors `WidgetBuilderModal.jsx`'s
  `PayloadEditor` pattern exactly — one small field-form per `questionType`, all patching through
  a single `onPatch(nodeId, patch)` that shallow-merges into the node's `data`. Same field
  primitives (`TextField`/`NumberField`/a `RowListEditor`-equivalent `StringListEditor`) that file
  already established, not reinvented.
- **`localStorage`-only persistence** (`survey-blueprint-draft` key, same try/catch-and-ignore
  pattern as `SearchOverlay.jsx`'s recent searches) — a single in-progress blueprint, autosaved
  ~400ms after any change with a "Saving…"/"Saved locally · Draft" header indicator. No backend,
  no real "Publish" control this pass — matches this app's existing honest-prototype persistence
  story everywhere else.
- **Preview** (`PreviewModal.jsx`) walks the graph as a simulated respondent, rendering every step
  through one shared `QuestionScreen` shell built directly from the user's reference screenshots
  (circular marker + prompt + optional `(i)` help icon, a dark "OK" pill, a progress bar + `%`
  readout) rather than per-type chrome. A shared skip-loop transparently walks past
  condition/action nodes and any node whose `visibleToPersonas` excludes the "previewing as"
  persona, with a cycle guard; the previewer can switch persona (restarts), answer through
  branches, and hits an explicit "End of survey" screen at any node with no outgoing edge.
- Verified end-to-end in-browser: built a real 7-node graph (input → likert → condition → two
  branches, one leading through freetext → toggle-board → bmi) via click-to-add + drag-to-connect
  (including a condition node's two separate named handles), edited every question type's
  Inspector fields, previewed and confirmed both branches route correctly off the Likert answer,
  confirmed persona-exclusion on the Multiple Choice node correctly skips it when previewing as
  Employee but shows it for Manager, confirmed the BMI screen computes a correct live BMI
  (5'10"/160lb → 23.0) and the toggle-board renders a real rows×columns radio grid, and confirmed
  a full page reload restores the exact same 7-node graph from `localStorage` — zero console
  errors throughout.

### Survey Builder V2 — the "sections" outline, and a version switcher

Direct feedback on V1: *"it's coming across super complicated... think simple people need to
make this."* The user's own proposed fix — sections/areas instead of individual card nodes,
mirroring the real SHAPE survey's Dimension → Explorer → Question structure (a handful of
dimensions, each made of several Explorers, each holding the actual questions) — is exactly
right, and is the real simplification, not just a reskin: dropping the graph is what removes
manual node-linking, pan/zoom, and "where am I in the flow" confusion, all at once. Per explicit
direction, V1 is kept intact (still the only version with branching), and a version dropdown at
the top of the screen switches between them.

- **`components/survey/SurveyBuilderScreen.jsx` is now a thin switcher**, not the builder itself
  — a slim dark strip (🧪-style, matching the SearchOverlay prototype-switcher precedent) holding
  a `<select>` of `VERSIONS`, remembered in `localStorage` (`survey-builder-version`) so
  reopening Survey Builder returns to whichever you were comparing last. It mounts either
  `SurveyBuilderV1.jsx` (V1's entire previous body, moved verbatim — only its root style changed
  from `height:"100%"` to `flex:1` so it fills the switcher's content row) or the new
  `SurveyBuilderV2.jsx`.
- **V2's data model is a deliberately separate tree** (`lib/surveyBlueprintV2.js`,
  `{ dimensions: [{ explorers: [{ questions: [...] }] }] }`, own `localStorage` key
  `survey-blueprint-v2-draft`), not a second view onto V1's node+edge graph — a free-form graph
  (branches, multiple incoming edges, orphan nodes) has no clean tree equivalent, so converting
  either loses real V1 structure or invents structure V1 users never asked for. Each question
  object reuses V1's real question `data` shape verbatim (`questionType`/`prompt`/`helpText`/
  `required`/`dimension`/`driver`/`visibleToPersonas`/`typeData`) with the node envelope
  stripped, so every existing type-driven piece works on it unmodified.
- **Question editing is one shared implementation, not two.** `Inspector.jsx`'s field
  primitives and per-type forms were extracted into `components/survey/QuestionFields.jsx`
  (`TextField`/`SelectField`/`StringListEditor`/etc., `TYPE_FIELD_FORMS`, and a new
  `QuestionEditorBody` bundling the full common-fields + type-options + topic-tag + visibility
  UI) — V1's `Inspector.jsx` now just calls `<QuestionEditorBody data={node.data} onPatch={...}/>`
  for question nodes, and V2's inline expanded question row calls the exact same component. The
  "Topic tag" section's labels were reworded to "Dataset dimension"/"Dataset driver" (still the
  real `DIMENSIONS`/`DIMENSION_DRIVERS` from `lib/dataset.js`) specifically to avoid colliding
  with V2's own "Dimension"/"Explorer" authoring-structure terms, which mean something different.
- **`components/survey/SurveyOutline.jsx`** — the actual tree UI: `DimensionBlock` >
  `ExplorerBlock` > `QuestionRow`, each collapsible, each with up/down icon buttons for
  reordering (deliberately not drag-and-drop — reliable with zero new dependency, and just as
  usable for the handful of sections a real survey has) and a plain inline-reveal
  `QuestionTypePicker` ("Add Question" click drops the 10-type list right below the button,
  rather than a floating/portaled menu — simpler and more discoverable for a first-time,
  non-technical author).
- **V2 is deliberately linear — no condition/action/component nodes.** Branching is exactly what
  forces a graph in the first place; removing it is the actual simplification. Declaration order
  IS the survey's respondent-facing order. A survey that genuinely needs skip logic still has V1.
- **A real, instructive bug found while building this**: `DimensionBlock`/`ExplorerBlock`'s card
  containers used `overflow: "hidden"` to clip their flat-color header strip to the card's
  rounded corners — but that also clipped `QuestionTypePicker`'s absolutely-positioned dropdown
  the moment it was nested inside one, the same class of bug NavRail.jsx's own header comment
  already documents (`overflow:hidden` clipping a child that needs to escape the container).
  NavRail's fix there was portaling every floating menu to `document.body`; here, since the
  picker only needs to escape its own two ancestors (not the whole app), the simpler fix was
  removing `overflow:hidden` from both card containers and giving each header its own explicit
  `borderTopLeftRadius`/`borderTopRightRadius` (matching the card's own radius, `0` on the bottom
  corners while expanded) — same visual clipping, without clipping anything that needs to escape.
- **`PreviewModalV2.jsx`** walks the flattened dimension/explorer question list (`flattenQuestionsV2`)
  in declared order — no condition evaluation needed, just "next persona-visible question."
  Reuses the exact same respondent-facing chrome V1's preview uses (`respond/QuestionScreen.jsx`,
  `QuestionBody.jsx`, `ToggleBoardRespond.jsx`, `BMIRespond.jsx` — all pure and type-driven,
  they don't know or care whether a graph or a flat list is walking them) with one addition: a
  small "Dimension · Explorer" label above each question's prompt, so a previewer always knows
  where they are in the outline.
- Verified end-to-end in-browser: added a dimension ("Physical Health") and an explorer
  ("Sleep") with live-updating counts on every parent header, added questions of several types
  via the type picker, confirmed the picker's real bug (clipped dropdown) is fixed and every one
  of its 10 rows is fully visible and clickable, expanded a question inline and confirmed
  `QuestionEditorBody` renders and edits identically to how it does in V1's side panel, ran
  Preview and confirmed the "Dimension · Explorer" label + real respondent UI + progress bar all
  render correctly, switched the version dropdown to V1 and confirmed it still loads and
  functions independently with its own separately-keyed `localStorage` data, and reloaded the
  page to confirm V2's tree survives — zero console errors throughout.

### V2 visual rebuild — "still looks too cluttered... how would Apple do this"

Direct follow-up feedback, with explicit license to redesign: the sections version was a real
structural improvement but still read as an engineering tool (three levels of nested bordered
boxes, every row always showing 5 icon buttons, all-gray with no color differentiation, no
motion). Rebuilt `components/survey/SurveyOutline.jsx` against the `apple-design` skill's own
principles (already this app's standing house style for motion, first applied in the nav-rail/
Widget-Builder passes) rather than iterating on the existing boxes.

- **Hierarchy now comes from typography and spacing, not nested cards.** Per the skill's
  "simplicity through hierarchy (order/spacing/contrast), not boxing everything": only the
  Question — the thing someone actually touches most — gets real card elevation (a soft resting
  shadow that deepens on hover). Dimension and Explorer are plain section headers (19px/700 tight
  tracking for Dimension, 14px/600 for Explorer) connected by a thin colored guide line, not
  boxes-inside-boxes.
- **Every Dimension gets a real color**, cycling through the app's existing Graph/Dataviz palette
  (`DIMENSION_COLORS` — teamBlue/hotPink/goldenYellow/lavender/turquoise/orgBlue/mintGreen) —
  exactly CLAUDE.md's own status-color rule for categorical, non-status groupings. Used as a
  small icon-badge, the explorer guide-line tint, and the "Add Explorer" link color. This alone
  is most of the "delight" — sections are now instantly scannable by color, not just by reading.
- **Secondary controls (move/delete/grip) are hover-revealed**, not permanently visible — the
  same "control menu dims in on hover" discipline `WidgetCard.jsx` already established for report
  widgets, applied here for the identical reason: don't force someone to look at five icons to
  read one line of content.
- **Real springs everywhere a state changes**, matching this app's existing `bounce: 0`
  critically-damped house style (NavRail.jsx/WidgetBuilderModal.jsx): collapse/expand animates
  height, adding a question/dimension "materializes" (scale+fade+y-offset) rather than popping in
  via `AnimatePresence`, deleting animates out, hover/press give immediate scale feedback (Apple's
  "respond on pointer-down" principle) on every interactive control.
- **"Add Question" became an icon-tile grid popover** (2-column, `QUESTION_TYPE_CATALOG` icon +
  label per tile) closer to Shortcuts' own action gallery than a plain text dropdown — spring-in
  anchored to its own trigger corner (`transformOrigin: "top left"`) per the skill's spatial-
  consistency principle, dismissed by an invisible full-screen click-catcher rather than a
  positioning library, since it only ever needs to escape its own two ancestors.
- **A real, instructive bug found while building this**: `DimensionBlock`/`ExplorerBlock`'s
  original card containers used `overflow: "hidden"` to clip their flat header strip to the
  card's rounded corners — which also clipped the new `QuestionTypePicker`'s popover the moment
  it was nested inside one. Same class of bug NavRail.jsx's own header comment already documents
  (an `overflow:hidden` ancestor clipping a child that needs to escape it) — NavRail's fix there
  was portaling every menu to `document.body`; here, since the picker only needs to escape two
  known ancestors (not the whole app), the simpler fix was dropping `overflow:hidden` from both
  containers and giving each header its own explicit `borderTopLeftRadius`/`borderTopRightRadius`
  instead (same visual clipping of the flat color strip, without clipping anything that needs to
  escape). Confirmed via the DOM directly (`getBoundingClientRect`/computed style all correct,
  `opacity:1`, all 10 rows present and labeled in the accessibility tree) when a couple of this
  session's own screenshots failed to render the popover's contents clearly — a capture/scaling
  quirk of the browser tool at this zoom level, not a real rendering bug, the same class of
  automation-tool flakiness already noted elsewhere in this file (SearchOverlay's coordinate-click
  and Enter-key notes) — don't mistake a blurry screenshot for a broken popover; check the DOM.
- **The version switcher itself was restyled** from a flat dark `<select>` bar to a small
  translucent, frosted strip (`backdrop-filter: blur()`, per the skill's materials guidance — "a
  floating functional layer, not an opaque bar") holding a real sliding-pill `SegmentedControl`
  (new `components/ui/SegmentedControl.jsx`, a shared `motion` `layoutId` gliding the highlighted
  background between options — the actual macOS/iOS segmented-control mechanic, not a swapped
  background color) instead of a dropdown, since switching between exactly two fixed views is
  what segmented controls are for.
- **V2's empty state now matches `ChatLanding.jsx`'s own mascot-centered welcome** (same
  `mascot-avatar.svg`, editorial headline + one clear accent CTA) instead of a plain dashed-border
  placeholder box — consistent with how this app already introduces every other empty first-run
  surface.
- Verified end-to-end in-browser (re-tested after the redesign, not just the original build):
  added a colored Dimension, an Explorer nested under its guide line, a Likert question via the
  new icon-grid picker, confirmed the question card's hover elevation and inline expand/collapse
  animate smoothly, confirmed the dimension's own collapse hides its whole subtree with a height
  spring, confirmed hover-reveal action icons appear/disappear correctly, and confirmed the new
  segmented control's sliding thumb correctly switches to V1's canvas (still fully independent,
  own `localStorage` data, unaffected by any of this) and back — zero console errors throughout.

### The question editor itself — "really form-like and not really nice"

Direct follow-up: the outline shell got the redesign, but expanding a question still dropped
into `QuestionFields.jsx`'s original `QuestionEditorBody` — literally `WidgetBuilderModal.jsx`'s
`PayloadEditor` pattern ported over (uppercase eyebrow labels, hard `border-bottom` dividers,
bordered boxed inputs). Correct architecture (one form per `questionType`, one `onPatch`, shared
verbatim by V1's side panel and V2's inline card), generic settings-panel visual language.
Rebuilt the craft, kept the architecture:

- **Soft filled fields, not outlined boxes** — new `.field-soft` rule in `index.css` (light
  gray fill at rest, white + a real accent border on focus, border is transparent-not-`none` at
  rest so focusing never shifts layout). Applied everywhere: `TextField`/`NumberField`/`SelectField`/
  `StringListEditor`'s rows.
- **The Prompt reads as the hero**, not just another labeled row — first, no label, larger/bolder
  text (15.5px/600) than every other field, exactly what someone opens the card to actually do.
- **Real iOS-style toggle switches** (new `Toggle`, a spring-driven knob via `motion`) replace
  every checkbox — Required, Allow multiple selections, Multi-line.
- **`SegmentedControl` (the same sliding-pill component built for the V1/V2 version switcher) is
  reused here** for every small 2-3 option field — Input kind, BMI height/weight units — instead
  of a plain `<select>`. One control language, reused everywhere it genuinely fits, rather than a
  dropdown for a binary choice.
- **A real bug found wiring this in**: `SegmentedControl` used a hardcoded literal `layoutId`
  ("segmented-thumb") for its sliding highlight. With two instances on screen at once (a BMI
  question's Height-unit and Weight-unit toggles both visible together), Motion treated them as
  ONE shared element — the thumb visibly slid between two unrelated controls instead of each
  animating independently. Fixed by namespacing the `layoutId` per instance with React's
  `useId()`. Worth remembering generally: a `layoutId` is a page-wide namespace, not scoped to
  its component instance by default — any reusable component using one needs to generate its own
  unique id, not hardcode a literal.
- **Secondary fields tucked behind "More options"** — Help text and the dataset dimension/driver
  topic tag (a real feature, but not something most people set on most questions) now live behind
  a small disclosure instead of padding out the common case with two extra fields shown every
  time. The type-specific options (the thing someone actually opens the card to configure) sit in
  a soft gray card directly under the prompt; Required and Visibility stay always-visible since
  they're worth a glance on every question.
- Verified end-to-end in-browser in both contexts: V2's wide inline card (Likert options, BMI's
  two independent segmented unit toggles both now animating correctly, "More options" expanding
  smoothly) and V1's narrow 300px side panel (same component, same soft fields, segmented Input-
  kind toggle, fits without feeling cramped) — zero console errors throughout.

### Likert's point-count field, and reviewing all 10 types together

Direct follow-up, specific this time: *"For standard likert, i didn't like how the 'number of
points' is right above the actual answer options - the points should be handled with like a
toggle bar or something."* `LikertFields`' `Points` `NumberField` is now a `SegmentedField`
(`LIKERT_POINT_OPTIONS = [3, 4, 5, 6, 7]`, the realistic range for an actual Likert scale — a
plain number input let someone type e.g. 47 and generate an unusable label list) labeled "Scale
points," with the label list now under its own "Answer labels" heading and a little more
vertical separation from the points control above it — the two are visibly two different
decisions now, not one control bleeding into the next. Confirmed live: switching points
correctly resizes the label list while preserving already-typed labels (5→7 re-added blank
`Point 6`/`Point 7` rows; 7→5 trimmed back down to the first 5, keeping two labels a prior test
had customized to "Strongly Agree"/"Agree").

Also added one question of every one of the 10 real types into the running prototype (previously
only Likert/BMI/Input had actually been exercised through the redesigned editor) specifically to
review the whole catalog together, per "let's get all the different question types in there."
Multiple Choice and Toggle Board's editors were spot-checked in addition to Likert — both already
consistent with the new soft-field/toggle/segmented language with no further changes needed;
Toggle Board's two `StringListEditor`s (Rows/Columns) don't have Likert's old problem in the
first place (no bare count field, just two labeled lists) so they were left as they were built in
the earlier pass. `Input`, `Smiley 1-5`, `Scale 0-10`, `Scale 1-10`, `Alcohol`, and `Freetext`
were added and render/collapse cleanly but weren't individually re-verified field-by-field this
pass (each is a strict subset of components already confirmed elsewhere: `SegmentedField`,
`TextField`, `Toggle`, `StringListEditor`) — zero console errors throughout.

### Retiring `alcohol`/`bmi` for a general `custom` type — "I'm trying to reduce the amount of choices"

Direct follow-up: *"I feel like some of these are super niche, Like the alcohol question and the
BMI question. There should be a custom question crafter or something that you can do the BMI
question with... reduce the amount of choices and create some simplicity here while retaining
the question's integrity."* Both retired as fixed catalog entries — the catalog is 9 types now,
not 10 (`lib/questionTypes.js`):

- **`alcohol` is just gone**, not replaced by anything — it was mechanically identical to
  `multiple-choice` (a single-select list) with nothing genuinely type-specific about it beyond a
  preset option list and an auto-tag to the real Alcohol driver. That exact result is one click
  away via Multiple Choice; keeping it as its own catalog entry was the "niche choice" the
  feedback was about, not a real capability gap.
- **`bmi` needed a real composite UI** (two inputs + a computed result) no other type covers, so
  it became the first real use of a new general-purpose **`custom` type** instead of staying a
  one-off: a handful of author-defined labeled numeric fields (`typeData.fields`, each
  `{id, label, unit}` — `unit` is a plain display string like "cm"/"kg"/"years", not
  semantically parsed) plus an optional computed result (`typeData.compute`:
  `none`/`sum`/`average`/`bmi`, `CUSTOM_COMPUTE_MODES` in `questionTypes.js`). The editor
  (`CustomFields` in `QuestionFields.jsx`) offers a **"Use the Body Mass Index template"** quick-
  start (`BMI_TEMPLATE`) rather than the catalog hardcoding BMI's own field shape — click it once
  and you get real Height(cm)/Weight(kg) fields with `compute: "bmi"` and a "Your BMI is" result
  label already filled in, then still fully editable (rename fields, add more, change the result
  label) same as anything else.
- **The old dedicated `bmi` type's three-way weight-unit (kg/lb/stone+lb) and two-way height-unit
  (ft-in/cm) pickers are gone too, not preserved inside the template** — `custom`'s `bmi` compute
  mode always reads field 1 as centimeters and field 2 as kilograms (`computeCustomResult()` in
  `questionTypes.js`, reusing the same `computeBMI()` kg/m² formula the old type had). That
  imperial/metric unit-switcher was itself exactly the kind of bespoke complexity this pass is
  removing — a real BMI question is retained (the question's actual integrity), the elaborate
  unit-conversion UI around it isn't. `lib/questionTypes.js`'s old `toCm`/`toKg` helpers were
  deleted along with it.
- **New respondent renderer** `respond/CustomRespond.jsx` replaces the deleted
  `respond/BMIRespond.jsx` — one number input per field (with its unit shown as a suffix) and, if
  a compute mode is set, a live-updating result line at the bottom. `respond/QuestionBody.jsx`'s
  `alcohol` case is gone (nothing routes to it anymore); both `PreviewModal.jsx` (V1) and
  `PreviewModalV2.jsx` (V2) route `questionType === "custom"` to the new renderer the same way
  they already special-cased `toggle-board`.
- `Inspector.jsx`'s `ConditionInspector` had one small knock-on fix: its "is the source question's
  answer a pick-from-a-list?" check (which decides whether a condition's Value field renders as a
  dropdown of that question's options or a free-text box) referenced `sourceType.id === "alcohol"`
  alongside `"multiple-choice"` — trimmed back to just `multiple-choice` now that `alcohol` doesn't
  exist. `custom` was deliberately not added to that check — a custom question's answer is an
  array of field values, not a single pick, and the existing free-text fallback already degrades
  gracefully for it without needing new condition-rule logic this pass didn't ask for.
- Verified end-to-end in-browser: the type picker now lists exactly 9 types (confirmed via the
  DOM, not just visually) with neither `Alcohol` nor `Body Mass Index` present; added a blank
  `custom` question, applied the BMI template, set a prompt, and ran Preview — entering a real
  178cm/72kg pair live-computed "Your BMI is: 22.7" (correct: 72 / 1.78² = 22.72) — zero console
  errors throughout, including through the mid-edit HMR churn while the old `alcohol`/`bmi`-typed
  test data and `BMIRespond.jsx`/`toCm`/`toKg` were being removed (confirmed transient by opening
  a fresh tab — a real, currently-broken app would still show it there too, and this one didn't).

## Survey Builder — Add Question dropdown, header restructure, and a third prototype (Survio-style Pages)

Follow-up to the alcohol/bmi → custom consolidation pass. User feedback, verbatim: *"The add
question should have a dropdown and stuff - the questions aren't completely working correctly.
Let's improve this and make a third variant of prototype - can you put the dropdown for
prototypes next to preview button instead of creating separate header? And now i want another
variant - I need you to study how Survio creates surveys and use that as a third approach for
prototyping."* Four distinct asks, all shipped:

**A real, confirmed bug — "the questions aren't completely working correctly"**: V2's "Add
Question" popover (`QuestionTypePicker` in `SurveyOutline.jsx`) opened but was **completely
invisible** — DOM inspection (not just a screenshot, which can mislead per this file's own
earlier automation-tool notes) confirmed it rendered correctly (`opacity: 1`, correct position,
all 9 rows present in the tree) but was clipped to near-zero visible area on screen. Root cause:
it's nested inside `ExplorerBlock`'s/`DimensionBlock`'s own collapse-animation wrapper
(`motion.div style={{ overflow: "hidden" }}`, needed there so the section's height spring doesn't
reveal unrendered content mid-animation) — any absolutely-positioned child that intentionally
overflows that box, like this popover, gets silently clipped by it. This is the **exact same class
of bug** already found and fixed once this session for `NavRail.jsx`'s floating menus (documented
in that section above) — the fix is the same: render through `@floating-ui/react`'s
`FloatingPortal` straight to `document.body`, with `useDismiss` replacing the old hand-rolled
full-screen click-catcher. Also swapped the visual shape from a 2-column icon-tile grid to a real
single-column dropdown list, directly answering "should have a dropdown." Verified in-browser:
the list now renders fully visible and scrollable, adding a question from it works end-to-end
with the newly-added Likert question expanding correctly inline — zero console errors.

**Header restructure** — `SurveyBuilderScreen.jsx` previously rendered its own separate frosted
strip above whichever prototype was mounted, holding the version `SegmentedControl`. Per explicit
direction, that strip is gone; the picker moved into `VersionSwitcher.jsx` (new, extracted
specifically to avoid a circular import back into `SurveyBuilderScreen.jsx`, which mounts all
three prototype screens) and each version's own header now renders it directly beside its own
Preview button. `SurveyBuilderScreen.jsx` itself is now just a thin mount-point — `version`/
`onVersionChange` are passed down as ordinary props, same pattern the other cross-screen state in
this app (`navExpanded`, `scopeInfo`) already uses.

**Version 3 — the "Pages" prototype, modeled on real, researched Survio UX**
(`SurveyBuilderV3.jsx`, `lib/surveyBlueprintV3.js`, `PageSidebar.jsx`, `QuestionBlockV3.jsx`,
`LogicPopover.jsx`, `PreviewModalV3.jsx`). Per explicit instruction to actually study Survio
(survio.com) rather than invent a third style from imagination — its real
`/en/create-a-questionnaire` page embeds genuine screenshots of its own live product editor (not
just marketing copy), which were read directly via the Browser pane tools. Confirmed structural
facts from those screenshots, not guessed:

- A flat **"Survey pages"** sidebar (`www.my.survio.com/builder`'s own URL, confirmed in a
  screenshot) — Welcome page / Page 1 / Page 2 / Exit page, each with a "..." menu (Add page / Up
  / Delete page). `PageSidebar.jsx` ports the real structure (flat pages, "..." → Move up/down/
  Delete, "+" in the header to add one) but **deliberately drops the fixed Welcome/Exit pages** —
  they'd be purely cosmetic here (no real welcome/exit copy or behavior exists anywhere else in
  this app to back them), and this project consistently avoids decoration with no function behind
  it.
- Each question renders in the main column as an **actual live-styled preview of the real
  respondent question** (a genuine "Where did you first learn about our new product?" with real
  answer rows, not an abstract summary card) — confirmed directly from Survio's own screenshot.
  `QuestionBlockV3.jsx`'s `LivePreviewBody` achieves this exactly by reusing this app's own
  `respond/QuestionBody.jsx`/`ToggleBoardRespond.jsx`/`CustomRespond.jsx` renderers **read-only**
  (`pointerEvents: "none"`, a no-op `onChange`) rather than building a second, separate rendering
  path — one real implementation of "what does this question look like," already proven correct
  by V1/V2's own Preview modals, reused a third time.
- **A dark floating hover toolbar — Edit/Copy/Logic/Move/Delete** — anchored above a question
  block's top-right corner, confirmed pixel-for-pixel from a real Survio screenshot taken during
  research (`BlockToolbar` in `QuestionBlockV3.jsx`). "Edit" toggles the same shared
  `QuestionEditorBody` V1/V2 already use inline in place of the read-only preview; "Copy"
  duplicates the question in place (including any skip rule); "Move" opens a small menu (Move up/
  down within the page, plus a "Move to page" section — real page names, only shown once a second
  page exists); "Delete" removes it.
- **Skip logic lives on the question itself**, not as a separate block — Survio's real "Skip to"
  action opens from the same per-question hover toolbar, a structurally different model from V1's
  standalone condition nodes wired in from a prior question. `question.skipRule` (`{ op, value,
  targetId }`, `targetId` another question's id or the literal `"end"`) is evaluated against that
  SAME question's own just-given answer in `PreviewModalV3.jsx`'s walker — confirmed working
  end-to-end: a Multiple Choice question with "if answer is Option 1 → End of survey" correctly
  jumped straight to the End-of-survey screen after only 1 of 2 questions were answered, skipping
  the second entirely. Survio's own real "Skip to" picker also offers "Your web" (an external-URL
  redirect target) — deliberately **not** ported: this app has no real destination for a redirect
  to go to, and an inert-looking URL field would be exactly the kind of fake functionality this
  project avoids elsewhere (see `AttachMenu.jsx`'s "Add Files or Photos" for the established
  honest-inert alternative) — since this field would affect real preview behavior rather than
  being purely decorative, the right call was to not offer the option at all rather than build a
  fake one.
- Reuses the real 9-question-type catalog, the same `QuestionEditorBody` editing UI, the same
  respondent-facing `QuestionScreen` chrome, and the exact `QuestionTypePicker` dropdown component
  (now exported from `SurveyOutline.jsx`) V2 uses for its own "Add Question" — one dropdown
  implementation serving both prototypes, so V3 gets the clipping fix above for free.

**A real bug found and fixed while building this**: `MoveMenu`'s "Move to page" list (mapping
`pages` to menu rows) initially had no `key` prop on its mapped rows — confirmed via a genuine
React console warning ("Each child in a list should have a unique key prop... Check the render
method of `MoveMenu`"), not just a lint guess. Fixed by wrapping each mapped row in a `<div
key={p.id}>`.

Verified end-to-end in-browser across all three prototypes: the version switcher now sits inline
next to Preview in every version's own header (no separate strip); V1's Canvas still renders
correctly with the new header layout; V2's Add Question dropdown is fully visible and functional
(the actual bug fix); V3 was built from empty state through a full real flow — added a page,
added a Multiple Choice question, hovered to confirm the toolbar, opened Logic and set a real
skip rule (Option 1 → End of survey), toggled Edit/Preview, duplicated a question, added a second
page, moved a question to it via "Move to page," renamed a page inline, ran Preview and confirmed
the skip rule correctly short-circuited to "End of survey" after 1 of 2 questions — and a full
page reload restored the exact same blueprint from `localStorage` (`survey-blueprint-v3-draft`).
Zero console errors throughout, including the one real bug found and fixed mid-pass above.

## SHAPE Performance Report — Org version (Figma node 11070:9301)

First fully-built report, reached from the sidebar's **Your Reports → SHAPE Performance Report → Org**
(and the rail's Org/building icon, which is the only way in while the rail is collapsed). Built as a
**mode of `CanvasScreen`** (new `report` prop: `{ title, persona, reportType }`), not a new screen, so
Add Widget / Library / chat / drag-reorder all keep working on it.

- **Navigation**: `lib/navActions.js` is a small context (`openReport`) provided in `App.jsx`, so
  `NavRail`'s `SubItemRow` ("Org" only — Personal/Team have no report yet) and its `org` nav item can
  open the report without threading another prop through the five screens that each render a NavRail.
  `App.jsx`'s `openOrgReport()` seeds the widgets in the design's own order; `CanvasScreen` is keyed on
  report-vs-plain so switching remounts it.
- **Layout needs no special grid**: the existing 6-col/164px grid with that seeding order reproduces
  the design exactly (2x2 Org Score, 1x1 Org Status + Score History stacked, 2x2 Explorers, ENPS +
  Popular Responses stacked, then six 1x1s ending in the "+" tile). The report card is centered in
  report mode. At <1184px of canvas width (e.g. rail expanded) the existing responsive 4/2-col
  fallback applies, so the layout only matches the design at 6 columns.
- **`ReportHeader.jsx`** — the design's two rows: 44px bar (title | persona menu … round picker,
  Filter, "...") and a sub-bar (report-type breadcrumb … Add Widget). Honest-inert parts: the persona
  menu lists Personal/Team/Org but only Org exists; the round picker shows the latest round with its
  arrows disabled (every widget reads `LATEST`, no per-round threading); Filter and "..." do nothing
  (no filter model or report actions exist).
- **New/changed widgets**: `org-score` (2x2: big number, date, Employees + Participation stat row with
  the already-downloaded `icon-users`/`icon-participation` assets, status bar + counts — closes the
  long-standing "Org Score stat row" gap); `score-history` gained a **1x1 form** (3 gridlines, compact
  pill — new `gridY` prop on `Sparkline`); `money-composition` (1x1, `MoneyComposition` primitive).
  Employees/Participation come from `dataset.js` (`EMPLOYEE_COUNT`, `participationRate()`) — real, so
  Participation reads 100%, not the mockup's 85%. **Money Composition has no data behind it** (cost
  isn't modeled), so like Popular Responses it shows the mockup's own sample values. The mockup's blue
  caret beside the Employees count was omitted: no previous headcount exists to trend against.
- **Real bug fixed along the way**: `TrendPill` showed ▼ for positive deltas everywhere. Both caret
  SVGs (`trend-caret-up/down.svg`) point down — Figma flips the "Positive" one in-layout — so the up
  case now rotates 180°. Existing widgets (Explorers rows, ENPS, etc.) pick this up too.
- Verified in-browser: both entry paths (collapsed Org icon; expanded sidebar → Your Reports → SHAPE
  Performance Report → Org) open the report; collapsed-rail layout matches the Figma screenshot cell
  for cell; persona menu opens; Add Widget opens the Library (lists the new Org Score family); zero
  console errors.

## Scope — the panel that opens when you click a report widget (Figma node 14463:13793)

Clicking a widget **in the Org report** (not the generic canvas, which still opens `DetailModal`)
selects it and opens a **Scope** beside the report. The design shows three screen sizes; the logic is
one rule in `CanvasScreen.jsx`: `reportW = max(536, mainW - 1000)`, scope gets the rest. Scope cards
cap at **808px** (+96px padding each side = a 1000px Scope), so the Scope never grows past 1000px and
**every extra pixel goes to the report** (it passes 660px, then reflows to 4 and 6 columns; confirmed
at 2400px: cards 808, Scope 1000). The report never goes under 536px.

- **Report reflows per width.** `colsForWidth()` gained a 3-column step (4 → 3 → 2). The design orders
  the widgets differently at 6, 3 and 2 columns, so the report carries `layouts` (familyId order per
  column count, set in `App.jsx`'s `openOrgReport()`); `CanvasScreen` sorts by it until the user drags
  (then `customOrder` turns it off). The 2-column order beyond the visible widgets is a guess.
- **Selected state + "Start here"** (`WidgetCard`): selected = darker border + soft shadow. The dark
  "Start here" tag sits on the Org Score widget; whether it should show only when selected or always
  isn't clear from the frames, so it currently always shows on the headline widget.
- **`components/scope/`**: `ScopePanel` (44px header: title, zoom menu, expand/collapse, close; white
  sheet rounded on the left, tucked 8px under the top bar; Esc closes). The Figma "75%" is content
  zoom and 75% is the design's native size, so the body uses CSS `zoom: pct/75` (50/75/100/125).
  Scope and Chat can coexist when there's room (see the Chat section); Library always replaces both.
- **Resizable**: drag the Scope's left edge (`.scope-resize-handle` in `index.css` — a slim grip pill
  that lengthens and tints accent-blue on hover/drag, no edge line; double-click resets). Min 420px; the report keeps its 536px floor. Width animation is switched off
  while dragging so it tracks the pointer 1:1.
- **`OrgScoreScope`** is the only designed Scope: headline card, "What Your Score is Telling You", and
  "What's Behind Your Score" with `ScopeRadar` (5 rings, gray nodes always on the spoke ends, orange
  polygon). Per Figma node 13622:35947 the **data points are hidden until you hover the chart**: then a
  dot appears on every vertex and the axis nearest the cursor (picked by angle, so the whole chart is
  the hover target, not tiny dots) gets a ringed marker plus a tooltip (name, trend pill, score, blurb). The mockup is written for a Flow-at-Work score built from 5 Areas;
  ours reads the real overall score and the **12 real Explorers**, with this app's Flourishing/
  Striving/Struggling wording. Hover paragraphs are one generic sentence per band — the dataset has no
  per-dimension commentary and none was invented. Every other widget gets a placeholder Scope (blurb +
  the widget at native size) until its own is designed.
- **Renamed per the newer frames**: "Avg. Score: Gender/Work Model" → "Gender Composition" /
  "Work Composition".
- Verified in-browser at normal (2-col report + 709px scope) and 1800px (3-col report) widths: open,
  switch widget, zoom, expand/collapse, Esc, hover tooltip. The radar tooltip was verified by
  dispatching `mouseover` — the automation hover didn't reach the SVG dots.

## Chat panel restyle — "Chat / Thread" (Figma node 14463:12084)

The docked chat is now the mirror image of the Scope pane. Per the frame it sits on the **left** of the
report (not the right — the frame's report is on the right), under the report's **full-width top bar**,
inset 8px, as a `#f9f8f7` sheet with rounded **right** corners and a soft right-hand shadow.

- **Layout**: in report mode `CanvasScreen` now renders `ReportTopBar` across the whole area (right of
  the nav rail) and the chat/Library panels + report + Scope in a row beneath it. Width 436px, yielding
  to the report's 536px minimum down to 320px (`chatW`). **Chat and Scope can be open together**
  (Figma node 14463:16260) when the area is ≥1,364px (`COEXIST_MIN_W` = 436 chat + 536 report + 392
  minimum Scope): chat stays 436px, the report keeps 536px, and the Scope compresses to the rest (688px
  in the 1,728px frame). Below that width opening one closes the other; Library closes both.
  Not built (not asked, not in the frame): a resize handle on the chat's right edge.
- **Header** (44px white): "New Chat" menu (still inert — no conversation list), and three icons that
  now have real behavior: **new chat** clears the thread, **expand** fills the area (hides the report;
  content capped at 792px, as the frame's composer `max-width` implies), **minimize** closes. This
  supersedes the older note that the icons were left off because they had nothing behind them.
- **Messages**: AI turns are plain 13px text beside a 28px mascot, the closing question in bold (the last
  paragraph, when it ends in "?"); user turns are white 320px bubbles, the first carrying a "SHAPE
  Performance Index | Org" tag pill in report mode; a centered timestamp replaces "Today" (it's the time
  the panel opened — messages don't store times); a 40px fade at the top of the scroll area; pill
  composer (8px padding, 28px icon buttons). The mascot FAB is hidden while chat is open (the frame
  hides it too).
- Verified in-browser (report and plain canvas): open from the FAB, send via a chip, expand/back,
  new chat, minimize; zero console errors in a fresh tab.

## Scope Stories — the blocks that fill a Scope (Figma board 13622:35945)

A Scope is a vertical stack of **Story** cards. The board defines the shell (title, Controls/Functions,
optional explanatory line, content, optional text; each Story has its own 6-column grid, independent of
the Scope's), the controls, and ~12 story types with a Purpose and a Boundary each. Built as a kit in
`components/scope/stories/` plus **recipes** (`components/scope/scopeRecipes.jsx`) that say which Stories
fill each widget's Scope. Data helpers: `lib/scopeData.js`. These recipes are a first draft meant to be
refined with the user, one widget at a time.

- **Shell + controls** (`StoryCard.jsx`, `controls.jsx`, `DataTable.jsx`): Compare previous rounds
  (per-Story toggle; defaults to the latest earlier round, user can pick another; **never on a Trend
  Story**), Chart/Table View (same data), Copy Table (tab-separated, headings included, "Table copied."
  only if the browser accepted the copy), Tabs, grouped collapsible tables.
- **Stories built**: Insight Summary, Meaning (score / status), Breakdown (radar, area, zone chart, and a
  "split" for parts of a whole), Diagnostic (strongest/weakest; Areas to Focus), Composition (tabs ×
  chart/table), Trend (single line with history cards + Explorer chips, or multi-line; table/matrix view),
  Actions family (see "Actions are one layer deeper" below),
  Resource, Upgrade Path, Methodology (score / status / eNPS / time estimate).
- **Not built, on purpose**: Comparison (Me/Team/Org — no per-team or per-person data), Citation (no real
  sources to cite), Love Science (would need a real study), conditional Support resource (nothing in the
  data triggers it), Questionnaire and Video (no frames on the board), age/ethnicity composition (no such
  fields). Don't fake these.
- **Placeholder content is tagged**: Action Stories copy is templated from the Driver's name and score and
  carries a "Sample copy" tag; Resource and Upgrade Path are "Sample" with inert buttons.
- **Privacy rule, real**: a group with fewer than 5 people never shows a score (`SUPPRESS_BELOW` in
  `scopeData.js`; `MIN_GROUP_SIZE` in `dataset.js`). This also changed the **Areas to Focus widget**, which
  used to single out a 1-person group ("Other"); it now picks the lowest group of 5+.
- **Status bands** are 60 / 80 (see "The status scale" above). The board's Methodology sample's 80 / 60 turned out to be right.
- `OrgScoreScope.jsx` is gone — Org Score's Scope is the `OverallRecipe`. Org Score, Your Score and Index
  share it. Popular Responses and Money Composition have no data, so they keep the generic placeholder Scope.

### Alternative chart types (nothing replaced — every earlier view is still one click away)

- **Breakdown — Bars | Zones** (`BreakdownStory`'s `list`/`zones` variants share a small Bars | Zones switch).
  *Bars* is the original ranked bar list (with the "Show all" limit on Factors). *Zones* (`ZoneChart.jsx`)
  puts every part as a dot on one 0–100 line split into the three status zones, with a count per zone,
  lowest/highest labelled, and a hover tooltip (score, status, change, what it means); Compare adds a hollow
  marker at the earlier score. Zones is the default on Org Status ("Explorers by Status"); Explorers and
  Factors default to Bars.
- **Composition — Donut | Bars** (the story with the People / Organisation / Employment / Locations tabs).
  *Donut* (`DonutChart.jsx`, default) is one ring per way of grouping people, a slice per group sized by its
  share of the population; hovering a slice or its legend row (linked) shows in the centre who, how many, share
  and score, plus how it compares with the average. Groups under 5 people are still drawn but never show a
  score. *Bars* is the original share-of-population bars. Table View is unchanged.

### Actions are one layer deeper (Figma Roughwork `2280:15268`)

Actions are never shown inline in a Scope. Two entry points, **same destination**:
- **CTA on a specific Driver** — a dark "Actions you can take" pill, e.g. under the Diagnostic's *Biggest
  Pressure Point* (`ActionsCta`; `StrongestWeakestStory`'s `actionsCta`, only when the items are Drivers and
  the Scope includes Actions). Opens the deeper layer with **that Driver alone** in the left list.
- **A separate story** — the grey "Actions You Can Take … Read More ›" bar (`ActionsStoryBar`). Opens the same
  layer with **every Driver** listed, the weakest selected.

The layer (`ActionsLayer`): Driver list on the left (name + band-coloured score), that Driver's cards on the
right — Actions you can take (with "Share this guidance"), Think About, From the Playbook. At narrow widths
the list stacks above the cards. **Layers** (`scope/layers.jsx`, `scopeNav.js`): a Story calls
`useScopeNav().open(layer)`; the host (Scope pane or the Widget Builder's Scope preview) swaps the body and
shows a breadcrumb — "<Scope title> › Actions you can take". The design has no back arrow; one was added
(also Esc steps back a layer before it closes the Scope). The base Scope stays mounted but hidden so its
toggles, tabs and scroll position survive. Copy is templated "Sample copy" (tagged) — real per-Driver
guidance is authored upstream; Love Science isn't built. The design's chevron on one list row
("Approval Efficiency ⌄") wasn't understood and isn't built.

### Score History story (Figma `984qJvMt7fCHASYHRwgrab`, node `13622:37494`)

`ScoreHistoryStory.jsx` replaces the chip-style Trend for any score-and-its-parts (Org Score / Your Score /
Index and the Score History widget, and a builder subject with 2+ parts). Round **cards** (newest first,
"Latest" pill, change since the round before) are a *selector*: the picked card sets which change to look at.
**Explorer Changes** is a dumbbell chart — per row, a small dot = the score the round before, a ringed dot =
the picked round, a bar between them (green rose / red fell; pastel, stronger while the chart is hovered);
hover gives a tooltip + dashed guide. **Selecting a row expands it, in place, into that part's own line graph**
across every round (`HistoryLineChart`: grey line, band-coloured labels, hover tooltip "YOUR SCORE / COMPARED
TO" the round before); pick it again to fold it away. Table View is the series × rounds matrix, unchanged. The
single-line `TrendStory` (chips) now also uses the new cards and line chart. Our data has only 3 rounds, so
there are 2 selectable cards and the oldest can't be selected (nothing earlier to compare).

### Extra Stories (Widget Builder only — not on the report yet)

Eight Stories added to the builder's catalog to fill gaps the original taxonomy left, each with a Purpose,
a Boundary, real data, and Table View/Copy Table where there's a table. None are suggested by default (the
default Scope is unchanged); add them from "Add Story" (each row shows its family) or by chat ("add priority
map"). Components in `stories/ExtraStories.jsx`; per-person helpers in `lib/scopeData.js`.
- **Who Is Where** (Breakdown) — people Flourishing / Striving / Struggling on the topic, with Compare.
- **What Changed** (Diagnostic) — biggest gains and drops since a chosen earlier round.
- **Areas to Focus** (Diagnostic) — lowest group per way of grouping; now takes any topic's scores.
- **Where Gaps Are Widest** (Diagnostic) — lowest vs highest group per axis, as a range bar.
- **What Moves With This** (Diagnostic) — topics whose scores rise and fall with it (Pearson r across people;
  a link, not a cause — said on the card).
- **Priority Map** (Diagnostic) — each part by score (across) and how closely it moves with people's overall
  score (up); Fix first / Protect / Watch / Maintain. Needs 3+ parts. The "link" is correlation with overall,
  so it is somewhat inflated for parts that make up the overall score — stated in the note.
- **Goal & Pace** (Trend) — a target (editable, presets 40/70/85), the gap, and a straight-line estimate from
  the past rounds' pace. Labelled "not a forecast"; with only 3 rounds it's a rough guide, and it refuses to
  project beyond 12 rounds.
- **Who Answered** (Insight & Methodology) — responses per round and how many groups the 5-person privacy
  rule hides.
Ideas considered and left out: Comparison/Benchmark (no external data), Citation (no sources), a free-text
"Creator Note" (needs per-Story config the builder doesn't store yet), Status Journey (folds into Trend).

## Report layers — the Explorers widget (Figma 984qJvMt7fCHASYHRwgrab, node `14531:9772`)

The **Explorers widget doesn't open a Scope** — clicking it takes the whole *report* one layer deeper
(`CanvasScreen`'s `reportLayer`). This is the first report layer (the earlier "layers" note, node
`14679:48411`, described the idea). Flow, five frames:
1. Org Report → Explorers widget (hover lifts it; not built).
2. **Layer view**: the sub-bar breadcrumb becomes "Org Report › Explorers" (first crumb returns); the card
   shows the **12 Explorers** as 1×1 ring cards (`ExplorerRingCard`: name + band-coloured ring + score), in
   dimension order, 6 columns × 2 rows (2 columns when a Scope is open). They're a *view*, not user widgets —
   no drag/rename/remove. **Add Widget is disabled** in a layer. Changing layer closes any open Scope.
3. **Click an Explorer** → its Scope opens (`ExplorerScope` in `scopeRecipes.jsx`): ring Meaning, an **area
   chart across its Drivers** ("what's behind"), What Stands Out, then the "Actions You Can Take" bar, which
   goes one layer deeper *inside the Scope* (see "Actions are one layer deeper"). Only the four designed
   Stories are in it; Trend / Composition / Methodology would slot in after What Stands Out.
- New pieces: `AreaChart.jsx` (smooth curve, hover dot + tooltip, dashed earlier-round curve in Compare;
  `BreakdownStory` variant `"area"`), `ScoreRing` (Meaning `ring` mode), `dimensionSubject()` in
  `lib/scopeSubject.js`. The **Diagnostic stat cards were restyled** to the board (label + score on one line,
  progress bar, sentence) — this affects every Scope that uses them.
- Differences from the Figma sample, deliberately kept: our Explorer is "Life Outside Work" (Figma says
  "Factors Outside Work"); Physical Health has 5 Drivers here (Figma shows 6, with BMI) because that's what
  the dataset has. The Figma's chevron beside one Driver in the Actions list is still not understood.

## Widget Builder (Create tool) — chat → widget + Scope (`components/widgetbuilder/`)

Not the older chat-exclusive `WidgetBuilderModal` (above) — this is **Create → Widget Builder** in the
sidebar, a separate flow from the Report Builder. Describe a widget in chat; the builder makes the widget
**and** opens its Scope pre-filled with Stories suggested from the Stories taxonomy. Kept deliberately
minimal: one empty-state prompt, then chat on the left and, on the right, the widget (title + chart-type
chips) and its Scope (Stories you can remove / reorder / add).

- **Subject** (`lib/scopeSubject.js`): the prompt resolves to a real dimension, driver, a bespoke cluster
  of drivers, or a curated concept. Only things the prompt literally names count — the resolver's
  near-matches (e.g. "Employee Commitment" for "Employee Engagement") are dropped so one topic doesn't
  silently become a cluster. The widget and the Scope are built from the same subject so they agree. A
  prompt that resolves to nothing gets a "name a topic" reply, not an invented widget.
- **Story catalog** (`storyCatalog.jsx`): every Story as data — `blocked(subject)` returns a plain reason
  or null, `render(subject)` builds it from the kit in `components/scope/stories/`. Unbuildable Stories
  stay in the Add Story menu, disabled, with the reason (Comparison needs Me/Team/Org data, Citation needs
  sources, Questionnaire/Video aren't designed). Default suggestion = Summary, Meaning, Breakdown,
  Diagnostic, Composition, Trend, Actions, Methodology — minus whatever the subject can't support (a lone
  Driver has no parts, so no Breakdown/Diagnostic; a concept has no per-person scores, so no Composition).
  Resource and Upgrade Path are available but not suggested.
- **Chat** (`builderEngine.js`): rule-based, like `generativeEngine.js`. It understands add/remove a
  Story, "make it a gauge/radar/…", "call it …", or a new topic (starts a new widget). Anything else gets
  a short help reply. A real model would replace `refine`, not extend it.
- **Add to Report** opens the Org report with the built widget appended; its Scope (`widget.scope =
  { prompt, stories }`) opens in the Scope pane via `BuiltScope`, re-resolving real data from the prompt.
  The builder session lives in `App.jsx` so leaving the screen doesn't lose it; there's no persistence
  beyond that (nothing is saved to the Library).
- `groupRows`/`CompositionStory` take a `scoreOf` so Composition can split any subject (not just the
  overall score) by group.

## Widget Library + the full widget catalogue (Figma `12635:69176` "Collated Widgets", `12264:73756` "Library")

Two Figma references drove this pass: the 61-instance **Collated Widgets** board (every widget, every size) and
the **Library** frames (Widgets tab, hover state, Widget Information window). Their `ignore services` part was
left out. This supersedes the "cataloged but deferred" list in the widget-economy section above — Mental
Wellbeing, Health Age, Time to Gain, Score Comparison, EAP/Support, Heat Map, the 6-tile Popular Responses and
ENPS promoters are all built now (see "Sample data" below for which numbers are real).

**Model** (`lib/families.js`): a *family* is one kind of widget, a *form* is one concrete card of it (size, and
sometimes a persona). Form fields: `size · name` (Library card title) `· blurb · persona · title` (card header
when it isn't the family name — "Team Score", "Physical Health Score") `· sample · card` (own surface: the locked
comparison, the support nudges). Forms are only ever **appended** — report seeds address a form by index.
`catalogEntries()` flattens everything for the Library; `formTitle()`, `cardSurface()`, `nextFormIndex()` ("Change
widget" cycles within the same persona) are used by `WidgetCard`, `MiniWidgetPreview`, `DetailModal`,
`ScopePanel`, `CanvasScreen`. `GROUPS` = the Library sections (Score, Status, ENPS, Areas to Focus, Explorers &
Factors, Explorer Results, Score over time, Score Comparisons, Health Age, Mental Well-being, Time & Money,
Support) with the one-line description and the long "About …" copy for the info window.

**Sample data, honestly tagged.** A form is `sample` when it says so or when its persona isn't Org — the dataset
has no per-person/per-team identity. Those cards show the design's own numbers (or org numbers under a Personal
label) and the Library tags them "Sample data". Org forms read real data, except those nothing in the dataset can
back (Health Age, Popular Responses, Money, Score Comparisons), which are `sample` too. New read
helpers in `lib/dataset.js`: `focusGroups()` (every 5+ group on every axis, lowest first), `enpsGroups()`
(promoters 9–10 / passives 7–8 / detractors 0–6 from each person's `recommendScore`), `feelingShare()` (% of
people below 40 on Depression/Anxiety/Stress), `heatMap()` (departments of 5+ × the first Explorers).

**Bodies**: `widgets/WidgetBody.jsx` (rewritten) assembles forms from `widgets/widgetParts.jsx` (status chip,
headcount row, severity pills, younger/older scale, comparison rows, heat table, 7-tile treemap, history chart,
focus rows, `DimensionIndex`). **Real bugs fixed while checking against the design:** the "Across the 12
Explorers…" sentence counted *people* (it printed "Across 100 Explorers") — now counts Explorers by band; the
ENPS bar used Flourishing/Striving/Struggling instead of Promoters/Passives/Detractors; Explorers/Factors listed
the top 6 by score and could hide every Poor one — now up to two per tier; the status face always smiled (mouth
now follows the status) and the 2x2 Status forms gained the concentric-ring illustration (`StatusRipple`, clean /
wobbly / tangled); Popular Responses tile text was white (design: dark); a zero change rendered as a red ▼
(`TrendPill` now has a neutral state); `Sparkline` clipped its 100/0 labels; the Header now wraps to two lines
(design: "Physical Health Score" in a 1x1) instead of ellipsising.
Not built, on purpose: the 3×3 Explorer Index (needs per-question scores), the crown / "Purchase to unlock"
state, Score History's per-persona line colours. The Figma Store labels "Focus List by Categories" and "Focus by
Group" as 1x1 but draws them larger — built as 2x2.

**Library screen** (`components/library/LibraryScreen.jsx`, `App.jsx` screen `"library"`): reached from the
sidebar's Library item (now also in the collapsed rail) or Search's Library tool. Widgets tab + search, Created by
others / Created by you (empty — nothing is saved yet; "Create Widget" opens the Widget Builder), the service
header with "N of M Widgets In Use", Org / Personal / Team chips (counts follow the search), accordion groups
with a paged card row. Hover a card (`MiniWidgetPreview`, now with `inUse`/`onInfo`/`dimDisabled`): Add to Report,
View Detail, Remove from Report; an in-use card has a green check and its + is dimmed. The info window mirrors
node `12264:63187`. "In use" = on the Org report: `App.jsx`'s `orgLibrary` (`{familyId, formIndex}[]`, default =
the original 11 seeds) is what `buildOrgReport()` builds from, so adding here shows up the next time the report
opens — edits made on the report canvas itself aren't written back. The Add Widget panel on the canvas
(`LibraryPanel`) still lists every family and now shows each form's `name`.

## Choosing a chart — rules, not dice (`rankForms()` in `lib/generativeEngine.js`)

Chat-generated widgets and the Widget Builder used to pick their 2nd/3rd chart with `pick()` — random — so the
same question gave different charts. They now come from `rankForms(prompt, topics)`: a deterministic ranking by
what the data's job is, built from the `dataviz` and `ui-ux-pro-max` (chart domain) guidance. `primaryViz()` is
its first entry, `generateVariants()` its top three, and the Builder's chart chips are sorted by it (the top three
full-strength, the rest dimmed but still selectable, tooltip says why).
- **One thing asked about** → Number (value + change) · Trend line · Gauge · Status. A dial is only offered because
  our scores have real 40/70 thresholds; it now draws those two ticks and the status word (it used to be a bare arc).
- **Two named things** → Bars (longest first). A ranked list is dropped unless asked for — it would show the same two rows.
- **Three or more named things** → Radar (the widget widens to 6 spokes from the topic's own drivers) · Ranked list · Bars.
  A radar needs 4–8 spokes; fewer falls back to a ranked list.
- **Two measures** → Scatter. Words in the prompt ("trend", "top", "breakdown", "compare"…) outrank the defaults.
- "Named" means the prompt literally says it; the resolver's near-matches ("sleep trend over time" pulls in Workload,
  Stress…) don't make a one-topic question into a comparison.

**Honesty fixes made alongside** (all were drawing something the data didn't say): the scatter now plots the real
respondents — one dot each (`pairedScores()` in `lib/dataset.js`, 100 points) with a least-squares line; before it drew
random dots around the correlation and re-rolled them on every render (a topic with no survey data gets a fixed,
labelled "illustrative" cloud). Trend's pill said "since last round" but computed last − first. Bars were one hue per
topic; they're now coloured by the score's own status band and sorted longest-first (group splits like gender keep the
Graph palette) — and "gender breakdown" no longer silently returned the work-model split; the title now says "Overall
Score by …" because that is what the numbers are. In the Builder, a widget about several topics (a cluster) now shows
the cluster's own score on number/dial/line/status instead of the first topic's, under a title naming both
(`fitToSubject()`). The "Did You Know" stat is labelled "strength of the link", not "confidence score". The radar's
long spoke labels were clipped at the edge.

## Widget Builder — two prototypes (`components/widgetbuilder/`)

`WidgetBuilderScreen.jsx` is now a thin switcher (like the Survey Builder's): **Original** (`WidgetBuilderV1.jsx`, the
old screen unchanged apart from the switcher in its header) and **Workbench** (`WidgetBuilderV2.jsx`), a redesign pass
done with the `redesign-existing-projects` audit. Both run on the same builder session (`state`, owned by App), so
switching keeps your widget; the choice is remembered (`widget-builder-version`, default Original).

What the audit found in the original, and what Workbench does about it — same engine, same data, same Stories:
- A permanent 380px chat sidebar → a **command dock** at the bottom (latest reply, suggestions as quiet buttons, the
  composer; full thread behind "History"). The work gets the width.
- Cards inside cards (a bordered Scope card around bordered Story cards) → no outer card; Stories sit on the page.
- Story move/remove only on hover (invisible to keyboard/touch) → a persistent **outline rail** ("In this scope") with
  the controls always visible; hovering a row lights up its Story, clicking scrolls to it. Below ~1080px it moves
  inline above the Scope.
- Centred layout, pill chips, ALL-CAPS eyebrows → left-aligned hierarchy, sentence case, an inline-editable title, and a
  chart-type **icon strip** that marks the best fits (`rankForms()`, see "Choosing a chart") with a dot and dims the rest.
- Nothing between "empty" and "built" → a composed first screen (a grey preview of the result; "Where to look first" =
  today's three weakest Explorers with live scores) and loading states: a progress hairline in the header and shimmering
  lines in place of the explanation while it replies.
- No press feedback / focus ring → springs, a 0.97 press, and `:focus-visible` rings scoped under `.wb2` (index.css).
Deliberately **not** changed from the audit's list: the font (IBM Plex Sans), the warm greys and the one accent are the
design system from Figma, so "swap the font / change the palette" doesn't apply; shadows are tinted with the grey family
instead of pure black. `AddStoryMenu` and `RichText` are exported from V1 and reused (`AddStoryMenu` takes an optional
`trigger` render prop).

### Story style toggle — "Current" vs "Refined" (Widget Builder only)

A **Stories: Current | Refined** switch in the Widget Builder header (both Original and Workbench) re-skins every Story in
the Scope; remembered in `widget-builder-story-style` (default Current). It is a context
(`components/scope/stories/storyStyle.js`), provided only by `WidgetBuilderScreen.jsx`, and read by the shared Story shell
(`StoryCard.jsx`: `ScopeCard`, `ScopeCardTitle`, `StoryCard`, `SampleTag`) — so all ~20 Stories change at once without
touching any of them, and the report's Scope pane (no provider) stays Current. Done with the `redesign-existing-projects`
audit; what Refined changes:
- Cards inside cards / the generic border-shadow-white card → **no card per Story**. The Scope is one surface (Workbench: a
  single white sheet; Original: its existing section), and Stories are flat sections with a hairline and 40px of space between.
- Titles: 22px/600 with tight tracking and balanced wrapping (was 18px/700), plus a small **kind label** above
  ("Diagnostic", "Trend"…) set by the host through `StoryMetaContext`; the explanatory line is a 16px lead capped at 64
  characters; notes are capped too; figures are tabular.
- `SampleTag` is a plain square sentence-case label instead of an upper-case pill.
**Inside each Story** (second pass — every change is gated by `useStoryStyle() === "refined"`, so Current is byte-for-byte
what it was). Verified in the Workbench with all 15 Stories added by chat, zero console errors:
- *Controls* (`controls.jsx`): Chart/Table is a sliding `SegmentedControl`; tabs get a wider gap and 600/500 weights; chips are
  filled and squarer.
- *Meaning* (`SummaryStories.jsx`): a 80px number (or 88px ring) + 18px headline + the new **`ThresholdScale`** — a 0–100 track
  in red/amber/green tints with the 40/70 ticks and a marker — so the band is visible, not just stated. Status Meaning is a
  40px label with a dot. Methodology is a status definition list + 15px/24 paragraphs.
- *Diagnostic*: stat cards lose their box (48px number, 4px bar, ≤36ch sentence). **Areas to Focus** is a ranked hairline list
  (axis | group + "n of N struggling" | 32px score). What Changed / Who Answered use hairline columns, no boxes.
- *Breakdown / Composition*: 6px bars, hairline rows, 18px values; deltas are plain coloured text ("+2") instead of pills;
  Composition axis blocks lose their borders.
- *History*: round cards become tab-like columns (selected = bottom bar, "· latest", plain-text change).
- *Actions*: the "Actions you can take" bar is a **`.story-door`** row (title, subline, dark circular arrow; hover/focus in
  `index.css`). The layer is a flat driver nav with an inset bar for the active one, a numbered steps list, Think About as a
  left-ruled list and the Playbook as a definition grid — no icon tiles.
- *Add-ons / Extras*: Resource is an underlined link; Upgrade Path a tinted panel; Goal & Pace has squarer presets and 40px
  stats; Priority Map uses sentence-case labels; Connected uses 6px bars.
Left as they were (their internals are charts the redesign skill doesn't speak to): `ZoneChart`, `AreaChart`, `DonutChart`,
`ScopeRadar`, `HistoryLineChart`, the Score History dumbbell, `GroupGapStory`, `DataTable` (except the eyebrow). Title Case in
Story titles is left alone — they're strings, some with proper names, so sentence-casing them automatically isn't safe.
Known nit: in Priority Map two near-identical points (Exercise/Nutrition) have overlapping labels, in both styles.

**Where Gaps Are Widest — refined chart** (it had been skipped): rows widest-gap first, each with the way of grouping, the
gap as a 22px number ("23 points apart"), and one shared 0–100 rail with faint 40/70 lines, a grey stretch between the lowest
and highest group and band-coloured dots, then "52 · Administrative staff … Upper management · 75" underneath. Rows align on
the same rail so they compare at a glance; the old caps/boxed-dot version remains in Current.

**Four more Stories** (`ExtraStories.jsx`, `storyCatalog.jsx`, chat keywords in `builderEngine.js`'s `STORY_WORDS`; helpers
`scoreSpread` / `brightSpots` / `withinReach` / `rankAmong` in `lib/scopeData.js`) — each real data, one Purpose, one Boundary:
- **How Scores Are Spread** (Breakdown) — one bar per ten points of people's scores, bars coloured by status band, hover for the
  count, median and middle half in the note; Table View + Copy Table. The reason it exists: an average hides whether people agree.
- **Bright Spots** (Diagnostic) — the highest-scoring group per way of grouping (mirror of Areas to Focus; 5+ people only).
- **Within Reach** (Diagnostic) — the parts closest to the next status line (Struggling→40, Striving→70) with the points to go.
- **How It Ranks** (Diagnostic) — where an Explorer (of 12) or Driver (of 45; top/bottom three + neighbours) sits among its peers.
  Blocked for clusters/concepts, which have no peer set. None is suggested by default; add by chat ("add bright spots", "add
  within reach", "add how it ranks", "add how scores are spread") or "Add Story". They have one design (no Current/Refined split)
  because they didn't exist before.

### Survey Builder V4 — "Studio" (a redesign of Sections, via the redesign-existing-projects audit)

A fourth tab next to Sections / Canvas / Pages (`components/survey/SurveyBuilderV4.jsx`, `VersionSwitcher.jsx`
now lists four). It edits the **same survey as Sections** — same data model and the same saved draft
(`survey-blueprint-v2-draft`) — so flipping between the two keeps your work (Studio also flushes its autosave when you
leave). Only how you work on it changes. What the audit found in Sections and what Studio does:
- Everything inline in one narrow centred column of nested boxes, so the list jumped as you edited and you never saw
  the whole survey → a **structure rail** (the whole survey, numbered, collapsible, with counts) and **one thing in
  focus** on a white sheet beside it. Select, then edit.
- Editing a question blind → a question opens as the **live respondent screen** (the real renderers, read-only)
  beside its Settings (`QuestionEditorBody`, unchanged). At narrow widths they stack.
- "Add question" as a dropdown of nine names → a **gallery** (icon, name, what you get by default).
- Dimension / Explorer panels are overviews: a big inline-editable name, counts, their children as rows.
- Destructive actions had no way back → deleting shows an **Undo** for six seconds (restores a snapshot).
- Previous / Next at the bottom of a question to walk the survey; Duplicate; move up/down; a composed first screen.
- Focus rings, press feedback and hover states under `.sv4` in `index.css`; sentence case; tabular numerals.
Kept: IBM Plex Sans, the warm greys, the single accent and v2's colour per dimension (the product's design system).
No branching (like Sections) — Canvas is still the version for skip logic. New shared `components/ui/Press.jsx`
(a button with a 0.97 press) is used by Studio and the Workbench Widget Builder.

### Survey Builder V5 — "Studio AI" (`SurveyBuilderV5.jsx`, `lib/surveyAssistant.js`)

A fifth tab: Studio with the assistant built into how you work. Same survey and same saved draft as Sections/Studio, and
it runs on Studio's state (`useStudio()`, now exported from `SurveyBuilderV4.jsx`, along with its panels and `Rail`).
**The "AI" is a scripted engine, not a language model** — like `generativeEngine.js` it is grounded in the real catalogue
(12 dimensions, ~45 drivers, last round's scores) and never contradicts the request, but a real model would replace
`draftSurvey` / `improvePrompt` / `interpret`; the shapes they return (drafts, proposals, findings) are what the screen is
built on. Nothing it does lands silently — everything is a proposal you accept (the app's draft/approve rule).
- **Brief → draft.** You start from "what do you want to learn", not a blank page. `draftSurvey()` picks real Explorers /
  Drivers the brief literally names (near-matches dropped; nothing recognised → your three weakest Explorers), weakest
  first, each with the reason it's there ("Sleep scored 38 last round"), and drafts the questions from a bank of 45
  positively-worded statements (agree = good, the direction the survey scores in). Quick / Standard / Thorough = 1 / 2 /
  3 questions per explorer (statement, 0–10 rating, open question). A staged "thinking" state, then a **draft panel** to
  review — untick explorers, change depth — before "Create survey". Creating is undoable and marks everything with a ✦
  until you read it; a banner on the item offers Keep / Keep all, and editing an item also clears the mark.
- **A context-aware assistant** (right panel; overlay below ~1360px, toggled from the header). It knows the selection: on a
  question — clearer / shorter / more neutral wording (before/after, with what it changed), a check, a better question type,
  splitting a two-in-one question; on an explorer — missing questions; on a dimension — missing explorers; on the survey —
  a review, a time estimate, "trim to N minutes" (lists what it would drop: open text first, never empties an explorer).
  Free text is read by `interpret()` (rules, not understanding); chips change with the selection.
- **Review** finds leading wording, two-things-in-one, repeats, long questions, a mismatched type, empty explorers, length
  over ~8 min and open-text fatigue, each with a Fix that becomes a proposal. Time = seconds per question type (open text 45s).
- Reuses `Press`, Studio's panels and focus-ring CSS. Items carry an optional `ai: true` field in the shared draft; v2/v4
  ignore it.

## Widget Builder — what it can build (`lib/subjectForms.js`, `components/widgets/SubjectBody.jsx`)

The builder used to make nine generic charts from `generativeEngine.js`'s `buildSpec()`, and the bare number was a number
floating in an empty card. It now builds **real catalogue-quality forms for any subject**, from the same parts as the
Library (score headline, status chip, evidence bar, grouped list, history chart, focus rows…), so a built widget looks
like it belongs next to the real ones.
- **11 forms** (`FORMS`): Score, Gauge, Status, History, Parts (Great/Average/Poor), Profile (radar), People (who is
  Flourishing/Striving/Struggling), Groups (by Gender / Department / Work Model / …), Focus (lowest group per axis), Movers
  (biggest gains/drops), Spread (histogram), Goal (target, gap, pace). Each has `sizes` (1×1 / 2×2), a `blocked(subject)`
  reason (Groups/Focus/People/Spread need per-person scores; Parts/Movers need 2+ parts; Profile needs 4+), a `title`, a
  one-line `why`, and `build(subject, options)` → a **serialisable payload**. Nothing in the renderer reads data, so a built
  widget keeps working in the report and the Library. The legacy Scatter / Did You Know / two-topic Compare (bar) remain, for
  prompts that name two topics.
- **A spec** is `{ vizType: "form", form, size, title, autoTitle, options, payload, explanation, real: true }`.
  `GeneratedBody` routes `vizType "form"` to `SubjectBody`. Every form is real data (`real: true`).
- **Chosen by the data's job** (`rankSubjectForms()`): a base order per subject kind (Explorer / Driver / cluster / concept)
  plus keyword boosts ("by department" → Groups, "where should we focus" → Focus, "target of 80" → Goal, "trend" → History…).
  So "Compare Employee Engagement by department" opens a Groups widget, not a number.
- **Tunable, not just switchable** (`WidgetOptions.jsx`, both builder screens): size 1×1 ↔ 2×2, the group axis, the goal
  target. Only the options the chosen form has are shown. Switching form keeps a title the person typed (`autoTitle` marks
  the generated one).
- **Chat** (`builderEngine.js`): "make it bigger / smaller / 2x2", "set a target of 80", "show it by tenure", "make it a
  gauge / radar / list…". `pickerOptions()`, `chooseKind()` and `changeSpec()` are shared by both screens.
- Fixes along the way: the old 1x1 gauge was 148px in a 106px box; the old number card had no status, date or context;
  "1 points" is now "1 point".
Not built: 3×3 forms; Mental Wellbeing / Health Age / Score Comparison forms (no per-person identity or age field — see the
Library section); anything needing Team data.

### Widget Builder — the overall picture and cases with a point of view

The builder was topic-only (an Explorer, a Driver, a cluster, a concept). It can now also build for **the whole organisation**
and has **nine more forms** (20 in total). All real data; anything that needs data we don't have stays out.
- **New subject, `overall`** (`lib/scopeSubject.js`'s `overallSubject()`): overall score, the 12 Explorers as its parts, the
  weakest Drivers as the ones to act on. Triggered by "overall / organisation / company / full story / big picture / how are
  we…" (`isOverallAsk`) **or by a named group** with no topic literally named. The rule that matters: a near-match topic no
  longer hijacks the prompt ("Compare Remote and Onsite" used to build a *Soft Work Environment* widget). Titles say "Org …",
  as the Library does. `priorityPoints()` now reads Explorer parts too, so the whole Scope (Priority Map included) works.
- **Groups by name** (`scopeData.js`: `findGroups`, `groupSnapshot`, `groupPartMeans`, `GROUPS_BY_AXIS`): a group is matched as
  written ("IT"), or in any case when the text has a cue word ("team", "compare", "vs") — so "show the distribution" never
  means the Distribution department. Groups under 5 people never appear. There is **no team structure in the data beyond
  Department**, so "Team Score" = a department's score; any other axis says "Group".
- **Two named topics** now keep a `pair` on the subject (Sleep vs Stress, Employee Engagement vs Job Satisfaction).
- **New forms** (`lib/subjectForms.js`, drawn in `components/widgets/SubjectBody.jsx`):
  - **Story** (3×3) — the full picture on one card: score, status, people split, history, parts, and four facts (weakest,
    strongest, biggest mover, group to watch / people struggling). **Index** (2×2 / 3×3, overall only) — the Library's ring.
  - **Team** (1×1 / 2×2) — one group's score, people split and gap to the organisation. **Versus** (2×2) — two groups side by
    side with where they differ most. **Head to head** (2×2) — two topics over every round plus the link between them (r).
  - **Check-up** — a pass / worth-a-look / fail checklist (score, direction, struggling parts, struggling people, weakest group,
    participation). **What if** — lift the N weakest parts to 70, see what the score adds up to (labelled arithmetic, not a
    prediction). **Heat strip** — every part × every round as coloured cells. **Momentum** — change since round 1, the run
    it is on, round-on-round bars, most improved / furthest down.
- **Options** (`WidgetOptions.jsx`): Team → split by + group; Versus → split by + this + against; What if → how many to lift
  (plus the existing size / axis / target). Options carry across forms, so the group chosen for Team is still the group for
  Versus. 3×3 is now a size (`WidgetBuilderV1/V2` stage, the report grid already spans 3).
- **Chat**: "How is the IT team doing?" → Team; "Compare Remote and Onsite" → Versus (a later "…and Hybrid" swaps a side);
  "Compare Sleep vs Stress" → Head to head; "tell me the full story of the organisation", "run a health check", "what if we
  lifted the weakest 3", "show every Explorer round by round", "what is our momentum". A message that names a *different*
  subject starts a fresh widget instead of being applied to the current one. The empty screens show one chip per case.
**Default for the whole organisation is the Org Score card, not the Story.** "Overall picture", "how is the organisation doing", "org score" open the Library's own Org Score card (2×2: big score, date, Employees + Participation Rate, status bar, Flourishing / Striving / Struggling counts; `Score` form with `payload.org`). The Story is one ask away — "tell me the full story" / "make it the full story", the "Tell me the full story" chip, or the Story chip — and ranks first only when the prompt says story / full picture / tell me everything.
Gotcha found while testing: with the dock input unfocused, typed spaces activate whatever chip has focus — use the textbox ref.

## Index widgets — redesigned against Figma 15061:40683 (`components/widgets/RingIndex.jsx`)

The two Index widgets (Library: Wellbeing Index = whole organisation, Explorer Index = one Explorer; Widget Builder: the
`index` form) now share one drawing component, `RingIndex.jsx`, rebuilt to the new "Corporate Culture INDEX" frames (2×2
`15061:40434`, 3×3 `15061:40477`). It replaces `IndexRing` (was in `primitives.jsx`) and `DimensionIndex` (was in
`widgetParts.jsx`) — both deleted; `polar`/`describeArc`/`RingLabel` stay in `primitives.jsx`.
- Read off the nodes: white disc Ø111 with the score at **64/700** (-1.28 tracking, status-coloured); wedges r 58–137 in the
  status tint with white hairlines, **name 11/400 near the outer edge and score 11/700 near the disc**; a **3px rim in the
  status colour** of the outermost ring (was a stroke around each wedge); at 3×3 a second ring r 139–171 and the rim at
  r 173–176, with **labels outside the rim on a short tick**.
- **The Figma 3×3's second ring is 20 survey items, which the dataset doesn't have**, so it holds whatever real, finer data the
  subject has: whole organisation → the Drivers inside each Explorer (the six weakest and three strongest are named outside —
  naming all 45 would be noise); one Explorer → each Driver's score in every round, oldest first, clockwise (every Driver named
  outside), with a one-line caption saying so.
- Hovering a wedge or cell swaps the disc to that part's name and score (and a tooltip names it) — useful with 45 cells.
- New forms: Library `dimension-index` gained a 3×3 ("Explorer Index · Rounds"); the builder's `index` form now also works for
  a single Explorer, not just the organisation.
- Not done: the 10-wedge density of the Figma sample (ours follows the real count — 12 Explorers, 5–10 Drivers); per-item
  labels and scores (no such data).

### "In this scope" rail in the Original builder's Refined view (`components/widgetbuilder/ScopeOutline.jsx`)

The Workbench's right-hand **"In this scope"** rail (every Story, numbered, with move up / down / remove always visible, hover
to light up its Story, click to jump, "Add a story" at the foot) was the control people preferred, so it now also appears in
the **Original** builder whenever **Stories: Refined** is on — and the hover toolbar on each Story and the header's "Add
Story" button are gone in that view (Current keeps both, unchanged). The rail sits beside the Scope when the work area is
1,180px or wider and drops inline above the Scope below that. The outline component was extracted from `WidgetBuilderV2.jsx`
so both screens share one (`renderAdd(trigger)` supplies the add menu, avoiding an import cycle); the Scope edits (move /
remove / add) now live on the Original screen and are shared by the rail and the Stories.

**Bug fixed — expanding a Score History row crashed the page.** `ScoreHistoryStory.jsx`'s `Dumbbell` (the Explorer / Driver
changes chart) used `refined` — defined only in its parent — so selecting a row threw `ReferenceError: refined is not defined`
and unmounted the whole screen. It affected every Scope that shows the Score History story (Org Score, Index, Score History,
the Widget Builder), in Current as well as Refined, because the variable was read unconditionally. Introduced by the Refined
per-story pass, which was verified by looking, not by clicking every control. An ESLint `no-undef` pass over `src` is now clean
(`npx eslint@8 --no-eslintrc --env browser,es2022 --parser-options=ecmaVersion:2022 --parser-options=sourceType:module
--parser-options=ecmaFeatures:{jsx:true} --rule '{"no-undef":"error"}' --ext .js,.jsx src`) — run it after edits that thread
a variable into sub-components; `vite build` does not catch this.

**Refined = one card per Story, not one long sheet.** (The Actions door — "Actions You Can Take ›" — had been a bare row; it is now a card like the rest, the whole face clickable, with a light hover tint.) The first Refined pass dropped the card around each Story and drew a
hairline between them (the Workbench even wrapped them all in one white sheet); a long Scope then read as one endless report.
Now `ScopeCard` (Refined) is its own card — white, 24px radius, 28/32px padding, a tinted soft shadow — and the hosts just leave
20px between cards (no hairlines, no shared sheet, in either builder screen; a deeper layer such as Actions sits in a card
too). Everything inside the Stories (the per-story redesign above) is unchanged. Current is untouched.

### Workbench layout — outline and chat on the left, widget and Scope on the right

The Workbench (`WidgetBuilderV2.jsx`) used to float the chat as a dock over the bottom of the page with the "In this scope" rail
on the right. It is now two columns when the work area is **1,060px or wider**: a **340px left column** with "In this scope"
(`ScopeOutline`, `panel` mode) on top — it takes only the height it needs, up to half — and the **whole conversation under it**
(scrolling log, the suggestion chips under the latest reply, the composer at the bottom, auto-scroll to the newest message);
and on the right the widget (picker, size and options) with the Scope's cards below. Below 1,060px the old layout is kept: the
outline inline above the Scope and the floating dock. The Original builder is unchanged (chat left, rail right in Refined).

## Developer — the handoff area (`components/developer/`)

A **Developer** item in the sidebar (Code icon, `NavRail` `NAV_ITEMS`, wired through `navActions`' `openDeveloper` like Library) opens a
component-documentation screen so developers don't need Figma. Left: the list of pages (documented Stories; every other Story in
`storyCatalog.jsx` listed as "not documented yet", so the roadmap is always the real remainder; "Coming later": Widgets, Controls,
Colour & type). Main: the page, with a header toggle **Style: Current | Refined** (remembered, `developer-story-style`) and an
**Inspect** switch, plus an "On this page" index.
- **Everything is the real running component, not a screenshot or a retyped spec** (`docKit.jsx`): `StoryStage` renders a real Story
  in the chosen style; **`Anatomy`** draws numbered markers on the live render and builds a **measured spec table from the browser's
  computed styles** (size, type, colour with its `T.` token name, fill, padding, gap, radius, border, shadow) — so the table cannot
  drift from what ships; **Inspect** outlines any element under the cursor and shows the same measurements; `TokenTable` /
  `PropsTable` / `CodeBlock` (copy button) / `Variant` (a live example with its status pill) fill in the rest. What can't be measured
  (props, copy rules, behaviour, where it's used) is written by hand next to the code that owns it and names the file.
- **A page** = `docs/<Name>Doc.jsx` exporting `meta` (id, name, group, kind, blurb, source file, Figma node), `toc` and a default
  component `({ style })`; register it in `DeveloperScreen.jsx`'s `DOCS`. Sections used: Purpose (does / does not), Anatomy, States &
  variants (every status band, in green / amber / red), Colour (token table), Copy rules (real strings), Props, Usage, Notes.
- **Built so far (light start, as asked): Insight Summary and Score Meaning.** Score Meaning covers number, ring and status-only forms ×
  Flourishing / Striving / Struggling, the neutral `bandColor={false}` case (eNPS), with/without Compare, `ThresholdScale` and `ScoreRing`
  on their own. Examples use fixed sample values so the page doesn't move; the copy comes from the real source
  (`storyCatalog.jsx` now exports `MEANING` and `SUMMARY_HEADLINE` for this).
- **Real findings the pages record**: Current renders a Story title in a `<p>`, Refined in an `<h3>` (a heading-outline gap in Current);
  the threshold scale exists in Refined only.
- Not done: the other 20+ Stories, Widgets (the 60+ Library forms and the builder's 20 forms), the controls (Compare, Chart/Table,
  tabs…), and a colour / type foundations page. Add them one page at a time with the same kit.

### Developer menu by Story family, and Score Meaning (pass 3)

- **Sidebar grouped by family.** The Stories list is now "Stories by family" (collapsible): every family in `storyCatalog.jsx`
  (`STORIES[].family`: Insight Summary, Score / Status Meaning, Breakdown, Diagnostic, Composition, Trend, Actions, Comparison,
  Resource, Insight & Methodology, Upgrade Path, Citation, Questionnaire, Video), each with the question it answers and a
  documented count ("1/1", "0/9"). Families with a page open by default. The wording lives in
  `developer/storyFamilies.js` (`FAMILY_INFO`); `DOCS_BY_STORY` maps a Story name to its page. **Foundations > Story families** is a
  page listing every Story under its family with purpose, "Suggested by default", Documented / Not documented yet, and the four
  that can't be built (Comparison, Citation, Questionnaire, Video) with their reason. The breadcrumb is Developer > Stories >
  {family} > page. New docs register in `DOCS` and need no other wiring.
- **Shared doc parts** moved to `developer/docParts.jsx` (`SpecTable`, `SimpleTable`, `T`/`tok` token chips, `Fact`, `Limit`, `Two`,
  `List`, `ContrastTable`) so each Story page is just content.
- **Score Meaning checked against Figma `13622:37198`** (three frames: number `13622:37199`, status-only `13622:37225`, value with
  units `13622:37213`; the ring is the separate node `14531:21543`). 56 of 56 parity checks pass (20 + 18 + 18). Fixed in
  `SummaryStories.jsx`: the number form's row was 16px too tall (fixed 84px block) - now a 115px-min block, 64px number with the
  cap-height trim (`text-box: trim-both cap alphabetic`), unit on the baseline with no gap, card 146px; the **status-only form
  was missing its tile and face** - now a `radius/lg` tile in the band's `status/*/bg` with the 48px `StatusFaceIcon`, a bold 14px
  "You're {Status}." with the status word coloured, paragraphs 14px apart (`StatusMeaningStory` now takes `status` and `text`
  string | array; Refined still takes `label`/`color`); a **new fourth form, "value with units"** (`MeaningStory tile={{parts,status}}`,
  36px values, 11px units, one bold sentence). `ScoreRing` got `role="img"` and a label. Number colours stay `band().cs`
  (`status/*/text-indicator`), which equal Figma's #0B703F / #D98D0B / red.
- **Voice guide applied**: Meaning titles are now "What Your Score **Is** Telling You" (title case capitalises the verb; Figma says
  "is"), the Striving paragraph lost its em dash and uses "there's", and the Org Status text bolds and colours the score. Org
  Meaning wording is exported as `ORG_MEANING` (scopeRecipes), the builder's as `MEANING` (storyCatalog). The design's long
  Flourishing paragraph is used only in the owner-section parity sample; the product keeps its shorter lines (flagged).
- **Page** (`ScoreMeaningDoc.jsx`): Developer view (overview, the four forms, playground that generates code, anatomy, full spec,
  states, sizes and edge cases at 320/480/808 and boundary scores 59/60/79/80, content and voice, accessibility with contrast,
  props, done checklist, then "For the design owner" with the three parity tables, what changed, token/voice calls, and apparent
  slips in the design: "26 yrs" tile vs "2 yrs" sentence, "than their your age", black vs primary title colour). Researcher view
  (data story, at a glance, evidence, how the words are chosen, forms, live examples from the dataset, eight constraints, answers
  and non-answers, neighbours, open questions: paragraphs chosen by band not data, who is "you", status copy for other bands,
  Health Age needs ages, should 100 read differently from 80).

## Insight widget rules — Index, Graph and Chart (Figma boards 9158:28363, 9158:28146, 9158:22652)

The three specification boards are **rules, not mock-ups** (limits, sizes, when a widget grows or gives way to the detailed
view). All of them are written down in **`docs/widget-insight-rules.md`** — read it before touching any chart in a widget.
Started on the other machine (rules doc, Index ring, the two components below), finished here.
- **Limits live in one place, `lib/insightRules.js`** (`GRAPH_LIMITS`/`graphFit`, `CHART_LIMITS`/`chartLimit`/`chartFit`/
  `chartSizes`). Pure, no React: the widgets and the Widget Builder's sizing both read it, so a widget is never offered a size
  the rules forbid. `GraphInsight.jsx` / `ChartInsight.jsx` re-export them for older imports.
- **Index** (`RingIndex.jsx`): equal slices, 1px white dividers, label outer half / score inner half, 2x2 ≤12 labelled, 13–20
  scores only, 3x3 ≤12 parents, ≤25 child labels outside on connectors, children under 12° lose their score.
- **Graph** (`GraphInsight.jsx`): fixed 0–100, 28px between ticks (1x1 0/50/100, 2x2 every 20), 1x1 ≤3 points / 1 line,
  2x2 ≤7 points / 3 lines, 8px markers, optional benchmark, evidence sentence (2 lines max) at 2x2. Used by Score History (library),
  the builder's History form and chat-generated trend widgets. **At 1x1 the caret pill sits inside the plot's right corner**
  (bottom corner when the latest point is 70+): the graph height is fixed and a two-line title left no room for a pill row.
- **Chart** (`ChartInsight.jsx`): `HBars` (Comparison: category column 50–100px ≤45%, 8px bars 12px apart, fixed scale, value
  area 48/64px, 1x1 ≤5 / 2x2 ≤13, "N more" past that), `VBars` (24px axis, 8px bars, zero baseline, 1x1 ≤4 / 2x2 ≤10), `TileGrid`
  (compact grid: 40px tiles, 2px rail, proportion bar, 1x1 ≤4), `DonutInsight` (ring from 12 o'clock; 1x1 = a small ring with a legend (≤4)
  or the Largest Group callout (≤7); 2x2 = ring + 3-column legend, or ring + Total / Largest / Smallest callouts; the name in a callout
  truncates, the "(19%)" never does), `Treemap` (new: value-proportional, deterministic — largest first, split into two runs of near-
  equal total along the longer side — 4px gaps, name upper-case one line top-left, value bold bottom-left, labels drop when a tile is
  too small; 1x1 exactly 3, 2x2 3–7).
- **Wired in:** Gender / Work Composition → `HBars` (no value labels at 1x1: the 48px value area would leave a 26px plot); Focus by
  Group → `HBars`; Popular Responses → `Treemap` (the 1x1 now shows the three largest of the same sample as the 2x2, so the two
  agree); Money Composition → `TileGrid` (`$26K`); builder Groups → `HBars` (all groups, was capped at 6), Composition → `TileGrid` /
  `DonutInsight`, Spread → `VBars`; chat-generated bar → `HBars`. `MiniBarChart`, `Treemap` (primitives), `PopularTreemap`,
  `MoneyComposition` and `GroupBars` are no longer used by any widget (left in place, not deleted).
- **Builder sizing follows the data**: a form can declare `fitSizes(payload)`; `buildFormSpec` stores the allowed sizes on the spec
  (`spec.sizes`) and grows a 1x1 that doesn't fit. Composition with 8+ groups (e.g. 13 departments) is 2x2 only; History with 4+ rounds
  would be; Spread (10 bars) is 2x2 only. The size switch (`WidgetOptions`) shows only allowed sizes, and "make it smaller" in chat says
  why when it can't.
- **Widget header now stops at two lines** (ellipsis, full title on hover) — the design allows a second line, never a third, which had
  been pushing 1x1 bodies out of the card.
- **Gallery** (`widgets-gallery.html`, scratch): `?family=a,b` library forms, `?forms&only=a,b&subject=dim|overall&axes=gender,tenure`
  builder forms. Verified every library family (61 cards) and every builder form for both subjects: no errors, nothing spilling out of
  its card except two untouched widgets — Focus List by Categories (more rows than the 2x2 holds) and Heat Map (table wider than 1x1) —
  which are still open.
- Not done: the "detailed view" (modal) the rules send overflow to doesn't exist; past a limit a widget shows what fits and "N more".
  Head to head (two different measures on one graph) and Momentum were left as they are — the graph rules allow several lines only for
  the *same* measure across groups.

### Widget polish + the report catches up (follow-up pass)

Product direction, standing rules from here on:
- **Widget titles: never more than two lines, and the content wins.** `Header` (`primitives.jsx`) measures its own card (its
  parent): if anything else in the card ends below the card's inner bottom edge, the title drops to one line (ellipsis, full
  title on hover); it goes back to two only when a whole line of room appears, so it can't flicker. Works in every host that
  renders `Header` as a direct child of the card (canvas, Library, Scope, builders, gallery).
- **"N more" always sits at the foot of the widget** (as in Parts): `MoreLine` pins itself (`marginTop: auto`) by default.
- **One footnote style** for a widget's bottom note — `Footnote` (`widgetParts.jsx`), What if's style (10.5px, gray500, 15px
  lines), pinned to the bottom. Used by What if, Groups, Movers and Focus.
- **Hovers on the chart widgets** — `ChartTip.jsx` (`useChartTip`): the Index tooltip's card, rendered into `document.body` at
  the pointer so a card can't clip it. Bars (`HBars`/`VBars`, hit areas are the full row/column, others dim), tiles and
  treemap tiles (value + share), and the line graph (hover a round's column: each line's score and change, a dashed guide).
- **Areas to Focus (builder Focus 2x2)**: header → 12px → "The lowest-scoring groups across your organisation." → rows 12px
  apart → footnote "Groups under 5 people are never shown." (was spread with `space-between` and an odd "each way of splitting
  people" line). Library Focus List by Categories now shows 3 categories so its "N more" isn't cut off; the 1x1 Heat Map shows
  overall + two Explorer columns (it ran past the card edge).
- **Real bug: the Department icon never rendered** — `assets/axis-icons/department.svg` had a duplicated `d` attribute
  (`d="Icon"` then the path), which is invalid XML, so it failed as a mask image everywhere (Composition rings, Diagnostic cards).

**Applied to the main report (Org report Scope pane):**
- **Stories: Current | Refined** switch in the Scope pane header — the same stored preference as the Widget Builder
  (`widget-builder-story-style`), so choosing it in one place carries to the other. Refined spaces cards 20px apart.
- **Recipes (`scopeRecipes.jsx`) now use the newer Stories**: Org Score adds What Changed, Within Reach and Priority Map; Org
  Status adds How Scores Are Spread; Explorers adds What Changed and Priority Map; Factors adds Within Reach; Areas to Focus adds
  Bright Spots and Where Gaps Are Widest. Old `TrendStory` replaced by the Trend forms: Explorer History / Weakest Drivers / Score
  by Gender or Work Model → `ScoreOverTimeRows`, eNPS → `ENPSOverTime` (own −100…100 axis), Work-life Balance → `ScoreOverTime`.
  Status Over Time keeps `TrendStory` — no newer form shows status shares round by round.
- Widget-level changes (charts, hovers, titles) already reach the report: `WidgetCard` uses the shared bodies.
- Not brought over: the builder's editing tools (outline rail, story toolbar, add-story menu, phone-width preview) — the report's
  Scopes are fixed recipes, not editable; a builder widget added to the report keeps its Stories via `BuiltScope`.
- Gallery gained `?scopes=a,b&style=refined` (render report Scopes directly) — used to check every changed recipe in both styles.

### Widget hover + three-dot menu (Figma "Hovers" 15266:24599) and the Explorer rings (14531:20690)

- **Hover** (`canvas/WidgetCard.jsx`): the card lifts — the md shadow (`dsShadow("md")`) and a 2px rise — and a 28px round
  three-dot button (`dots-horizontal`, 4px padding) fades in 7px from the top-right corner. The old 3% grey wash and 14px dots
  are gone (the older "dims the card ~3% on hover" note in Widget anatomy is superseded). **Press** (ours, per direction to make
  it feel alive): a quick squash to 0.97 on pointer-down, released on a bouncy spring (bounce 0.45), then the Scope opens.
  The card is two layers: the outer cell keeps the grid placement and native HTML5 drag (motion takes over `onDrag*` on its own
  elements); the inner `motion.div` is the visible card. The header is now a direct child of the card (the dots float over the
  corner), which also makes the two-line title rule measure the right element.
- **Menu** (`canvas/WidgetMenu.jsx`): 220px, radius 12, md shadow, `surface/card` rows 36px tall (8/12, 20px icon, 10px gap, Text
  sm): Change Widget (only when the family has another form), About Widget (opens the Scope / detail), then a `border/secondary`
  hairline and Remove Widget in the destructive ghost colours. Opens just right of the card (3px), level with the dots
  (`right-start`, crossAxis −33), portaled, flips/shifts on screen; Escape / outside click close it. The dots sit on
  `ghost/bg/hover` when hovered and `ghost/bg/active` while open. Icons downloaded to `assets/widget-menu/` and drawn as masks.
  **Rename and Edit with AI aren't in the frame** — kept as extra rows in the same style because they're working features;
  drop them if the design is meant to be exactly three items. The Org Score card's eye icon in the frame isn't built (its
  meaning isn't shown).
- **Explorer rings** (`canvas/ExplorerRingCard.jsx`): 80px ring (8px stroke, `border/secondary` track, status `graph` arc, round
  caps, 12 o'clock), the number Display sm 30/38 Bold in the status `text-indicator` colour (Figma's file names that token
  `text-strong`), header box always two lines tall so every ring lines up. Character (ours): on arrival each arc sweeps to its
  score on a spring while the number counts up, staggered 50ms per card; hover lifts the card and swells the ring 5%; press
  squashes like the widgets. Reduced motion skips the sweep and count.

### Scope open / close motion (the "janky" fix)

Why it was janky: the report measured its own width with a ResizeObserver on every frame while the Scope's width sprang
open, so the grid re-flowed 6 → 5 → 4 → 3 → 2 mid-motion (and re-sorted into each column count's designed order), and the
Scope was uncovered left to right like a wipe while fading in. Now (`CanvasScreen.jsx`):
- **Widths come from the destination, not from measuring the animation.** Only the area right of the nav rail is measured;
  `mainW` = area − the open side panel (chat `chatW` or Library 516), the report = `mainW` − the Scope. `cols` is
  `colsForWidth()` of that, so it changes **once**, at the start of the motion. (`mainW` is no longer state.)
- **One spring for everything** (`SCOPE_SPRING`, bounce 0, 0.5s): the Scope's space opening, the report card's width
  (`motion.div`, the grid centred and clipped inside it while it moves) and every widget gliding to its new cell
  (`WidgetCard` / `ExplorerRingCard` get `layout="position"` with `layoutDependency` = column count + position, so they only
  animate on a reflow, never on hover or scroll; the press spring stays separate).
- **The Scope slides**: its sheet is pinned to the right edge at full width inside the animating space, so it moves in from
  the edge and leaves the same way; no opacity fade.
- **Switching widgets with the Scope open**: the new content settles in (short fade + 6px rise) and the pane starts at its
  top (`ScopePanel.jsx`); the first open has no fade.
- After opening, if the reflow moved the picked widget out of view, the report scrolls it to the centre (`data-widget-id`).
- Verified by sampling every 40–50ms: columns switch once, card / Scope / widgets move continuously on the same curve, no
  console errors. Reduced Motion is respected by the app-wide `MotionConfig`.

### Report: protected width, minimal scrollbars, 2–6 columns, device preview (phone 14679:86632 + iPhone Duo)

- **The report's 536px (344 grid + 2 × 32 card padding + 2 × 64 margin) is never compromised.** The sideways scroll when a
  Scope opened came from the native vertical scrollbar eating ~15px of that width at the floor. Fix: **minimal overlay
  scrollbars** — `scroll-minimal` (index.css) hides the native bar so it takes no width, and `ScrollThumb`
  (`components/ui/MinimalScroll.jsx`) draws a 4px thumb, 3px from the edge, visible only while scrolling (fades ~0.8s after) or
  hovering, draggable. Used by the report and the Scope pane (and the phone preview). Report scroller is also `overflowX: hidden`.
- **Columns are 2, 3, 4, 5 or 6** (product direction — odd counts allowed now). `colsForWidth()` picks as many 164px columns
  as fit; report grids use `grid-auto-flow: row dense` so a 2x2 never leaves a hole on an odd count. The Org report has a
  designed widget order for 6, 5, 4, 3 and 2 columns (`App.jsx` `layouts`). Steps land at about 900 (3), 1,000 (4), 1,144 (5)
  and 1,264px (6) of window with the rail collapsed. (Older notes saying "always even" / "6/4/2" are superseded.)
- **Scope pane header** stays on one line: the title truncates, and the Stories switch drops its label under 560px.
- **Device preview** (`canvas/DevicePreview.jsx`, prototype tool): a **Device** dropdown in the report's top bar
  (`ReportHeader.jsx` `DeviceMenu`: Desktop / Phone / iPhone Duo). Rules read off the three Figma phone frames (375 / 402 / 440):
  widgets never shrink (2 columns = 344); with S = (screen − 344)/2 per side, the card padding is S up to 32 (floored, so 15 at
  375 — Figma's 375 card is 1px wider than the screen) and the outside margin is S − 32 (0 to 64) — the same sum gives the
  desktop's 64 + 32 + 344. Phone top bar (44): menu, title (truncates), divider, persona, "…" — no round picker or Filter. Then
  "Org Report ›" + Add Widget (28, 8px down), the card 16px below. **Scope on a phone is a sheet**: the report dims below the
  top bar, the sheet's top sits 48px under it, top corners rounded, Stories 16px in, no expand or Stories switch; tap the dim to
  close (`ScopePanel` `sheet` prop). Phone width picker 375 / 402 / 440 above the device. Device chrome (bezel, Dynamic
  Island, 9:41 status bar, home indicator) is drawn, scaled down to fit the stage. Add Widget and Edit with AI switch back to
  Desktop (the Library and chat panels live there).

### iPhone Duo preview — rebuilt from Apple's guidance and the Duo References board

Sources: Apple HIG "Designing for iPhone Duo", "Preparing your app for iPhone Duo", and the user's board (Figma
`Z6YmEggwvoiX3j4d3kCKqV` node `2352:2764`: Do / Don't (10 rules), Layout guides, Adaptive Patterns, Templates, Examples). The
first version (two phone screens on a hinge) was **wrong**: the iPhone Duo is a **foldable** with a compact **outer display
(466 × 678)** used closed and one large **inner display (951 × 669)** that folds through its centre (fold 475.5pt from the edge).
Facts worth keeping (board's Layout guides): outer trailing inset 84pt (vertical bar), inner portrait top 84 / bottom 95, inner
landscape trailing 84, leading inset 0 everywhere; content margin 20; pane gap 16 outer / 24 inner; text max 600; fold takes no
space flat, 27pt keep-clear band when partially folded; columns: outer 4/6, inner 6/8, partial book 4 + 4 (always even).
- **`DuoPreview`** (`canvas/DevicePreview.jsx`), with a pose switch **Closed / Open / Half-folded** above the device.
- **Vertical bar** on the trailing edge (84pt), same items in the same order in every pose ("keep control order stable"):
  (outer camera) · 9:41 + status · navigation (Back out of a layer; **Close** for a Scope on the outer display) · the prominent
  action **Add Widget** (accent circle) · toolbar pill (Share, the single "…" overflow) · the **tab bar** pill at the foot
  (Chat, Reports active, Library — the nav rail's role). Icon-only, every item titled. The report header keeps only the title
  and the persona menu (text items stay out of the vertical bar); the phone's menu / "…" / Add Widget buttons aren't shown.
- **Closed**: the phone rules on 382pt of content (466 − 84) — 2 columns, card padding 19. A Scope covers the content like a
  sheet with Close in the bar (`ScopePanel` `hideClose`).
- **Open**: **master-detail meeting at the fold** (the board's Master Detail + Dashboard patterns; HIG split view): the report on
  the leading half (0–475.5pt → exactly 2 columns with the desktop's 32pt card padding and 33pt margin), the selected widget's
  Scope on the trailing half. Even split, so no widget straddles the fold; no Close (the detail pane always shows the selection);
  arriving with nothing open shows the "Start here" Org Score Scope, otherwise a "Pick a widget" prompt.
- **Half-folded**: the same layout (no rearranging), with the 27pt keep-clear band drawn at the fold; nothing interactive is in it.
- **Task continuity**: selection, the Explorers layer and the report's scroll position carry across poses (`scrollMemo`).
- Verified in-browser: all three poses, the Scope sheet + Close on the outer display, the band, scroll 300 kept Open → Closed → Open.

**SHAPE is a web app, so on the Duo it lives inside Safari** (user direction, with screenshots of Safari and the Weather app
on the Duo). The native vertical bar above is kept only as the **"App · Native bars"** variant; the Duo toolbar now has a
**layout switch** (default **Safari · Dashboard**) next to the poses. `canvas/DuoSafari.jsx`; `MobileReport` was extracted to
`canvas/MobileReport.jsx` (`onScrollY`, `topInset` props) so both files share it.
- **Safari's chrome (inner display, from the screenshots):** one 64pt bar across the top — back + bookmarks pill, the address
  pill centred (page menu · domain · reload), new tab + tabs pill, then 9:41 + Wi-Fi top-trailing; translucent (blur), the page
  scrolls under it. **Scrolling down shrinks it to a small address pill** at the top centre; scrolling up or tapping the pill brings
  it back (`useSafariChrome`). Outer display (no screenshot, inferred from the HIG's side-bar rule): Safari's controls in the 84pt
  trailing bar, minimised to camera + time + one button. Home indicator drawn on the inner display.
- **Safari · Split:** master-detail at the fold, each pane with the web app's own header (menu, title, Org, "…", Add Widget):
  report on the leading half, the selected widget's Scope on the trailing half (the "Start here" Org Score Scope while nothing is
  picked — shown, not opened). The panes scroll inside themselves, so their top follows the bar (64 → 40).
- **Safari · Dashboard (after the Weather app):** no report card; the web app's small header (sidebar toggle; Org, +, "…"), a
  centred hero ("ORG REPORT · ORG", the title, "57 | Struggling" in the band colour) over a soft wash of the status's bg colour,
  then the widgets straight on the background in **two 2-column grids, one each side of the fold, meeting 24pt from it** (a 48pt
  gutter, wider than the 27pt band), split by area so both halves weigh the same. **A tapped widget no longer opens a centred
  sheet** (user: it felt like an iPad): the page (header, hero, widgets) gathers into the leading half on 2 columns, every widget
  gliding to its new place, and the Scope slides in from the trailing edge into the trailing half (under Safari's bar; past the
  fold band when half-folded). Closing it spreads the widgets back out. The outer display keeps the bottom sheet. The
  page itself is the scroller here, so its top padding stays fixed while the bar shrinks — moving it caused a scroll feedback loop.
- **Safari · Desktop:** the desktop report inside Safari. Under Safari's bar, the report's own `ReportTopBar` (title | Org … round,
  Filter, "…") across the whole width, then the column with `ReportSubBar` ("Org Report ›" + Add Widget) and the report card on
  **4 columns**: two either side of the fold with a **32pt gutter at the middle** (wider than the 27pt band), and a 2×2 only starts on
  the 1st or 3rd column so nothing straddles the fold. Picking a widget gathers the report into the leading half on **2 columns** (card
  34pt from the edge, as the phone rule gives at 475.5) and the Scope (the desktop `ScopePanel`, no expand) slides in from the trailing
  edge into the trailing half, **tucked 8pt under the top bar** as on desktop. It stays two-pane while other widgets are picked; closing
  the Scope spreads the report back to 4 columns. Closed, it uses the phone layout.
- **Widgets glide, they don't snap** (Dashboard and Desktop): `pack()` places them by hand (a dense packer, `pairs` for the fold rule) and
  each one springs to its x/y with a small stagger (`Glide`), the card's width and height spring with it. Not motion's `layout`: the
  device preview is scaled to fit and measured layout animation drifts under a scaled parent. `TrailingScope` is the shared right pane.
  `ScopePanel` now hides its expand button when no `onToggleExpand` is passed.
- No device switch auto-opens a Scope any more (it covered the Dashboard); the split layouts show the "Start here" Scope in their
  detail pane instead.
- Verified in-browser: the bar shrinks on scroll down and returns on scroll up in both Safari variants with the scroll position kept,
  the Dashboard hero and fold split, the half-folded sheet at 501–939pt (band ends at 489), closed Dashboard with the minimised side
  bar, Explorers layer inside the Dashboard; no console errors.

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

## Stories explainer video (30 s) — `explainer.html`, `src/explainer/`, `scripts/video/`

A real 30-second film about Stories, shown in the **Video Story** (Developer → Video; Widget Builder → Add Story → Video).
It's the one video this prototype ships, so the Video Story is no longer blocked and carries no "Sample" tag
(`src/components/scope/stories/explainerVideo.js` holds the title, line, transcript and the file imports).
- **Rendered, not recorded.** `explainer.html` (dev-only entry, not in the production build's pages) mounts `src/explainer/Explainer.jsx`,
  a pure function of time that draws the real Story components (Insight Summary, Breakdown, Diagnostic, Composition, Trend,
  Actions, the form chips) inside a dark stage. `main.jsx` exposes `window.__seek(t)`, `window.__duration` (30) and
  `window.__ready`; open `explainer.html?play` to watch it live.
- **Re-render** after changing a Story or the script: start `npm run dev` in the root, then in `scripts/video` run
  `npm install` (first time) and `npm run render`. It drives system Google Chrome through puppeteer-core (set `CHROME_PATH` if it
  isn't in `/Applications`), captures 900 frames at 1920×1080, and encodes `src/assets/video/stories-explainer.mp4`
  (1280×720, 30 fps, H.264, no audio, ~3 MB) with ffmpeg-static, plus `stories-explainer-poster.jpg` (the fan of Stories at 8 s).
  `scripts/video` has its own package.json, like `/data`; the frames folder is git-ignored.
- Scenes: intro (0–3.7 s) · fan of Stories · six questions at ~2.1 s each (How is it doing? … What can I do?) · forms
  (Radar / Bars / List / Zones with the hover toolbar) · outro.
- **No soundtrack**, so the transcript carries the words and the caption says so. A voice-over would be a new asset, not a re-render.

## Widget and Story fixes pass (status art, Index, Group Composition, Score History, dropdown)

- **Status illustrations are the design's SVGs** (`assets/status-illustrations/{flourishing,striving,struggling}.svg`, supplied by the
  user, face included); `StatusRipple` is now just that `<img>`. The hand-drawn wobbling-ring code is gone. The Org Score / status
  counts use `UsersIcon` = Lucide `users` at 14px, 2px stroke (the hand-scaled path it replaced squashed to noise at 12px).
- **Gauge is a ring** (`ScoreDial` in `primitives.jsx`, full circle from 12 o'clock, notches at 60 and 80). The builder form's name is
  "Ring" (id stays `gauge`; chat also understands "ring"); the older `Gauge` primitive wraps `ScoreDial`.
- **Index 3×3** (`RingIndex.jsx`): the "tiny" ring was a layout bug (the form's `alignItems: center` shrink-wrapped the ring's
  `width: 100%`), fixed. Every inner wedge is named outside the rim (two lines max) and shows only its score inside; the outer ring's
  cells show a score only when the cell is wide enough (hover names any cell); the caption line is gone. 2×2 is unchanged.
- **Heat strip** shows at most 11 rows; past that the weakest 9 and a "N more Explorers" line (`MoreLine`, same as Parts).
- **Profile (radar) widget** is drawn like the Radar story: circular rings 20 to 100, grey nodes on the spoke ends, orange series
  polygon, 11px two-line names.
- **Areas to Focus sizes read off Figma 11318:27848**: group label 13/400 accent, name 11/600, tag 11/400 on `bg/primary`, change
  pill 20px, score 16/700 in the status's strong text colour, caption 11/400 under a 2px status rule, plus the "N more Areas" line.
  Captions say "employees are struggling" as the design does.
- **Group, not Team.** The builder's "Team" form is named **Group** ("IT Group Score", prompt chip "How is the IT group doing?").
  The id is still `team` in code. Real teams (manager-led, from "your network") are left for later.
- **New builder form: Composition** (`subjectForms.js` `composition`, `CompositionForm` in `SubjectBody.jsx`; Figma 11318:27838 and
  the 1×1s beside it). 2×2: a 180px ring of one grouping (axis icon and name inside) with "Largest Group …" under it; 1×1: up to four
  groups as headcount tiles over a proportion bar, more groups a small bare ring and the same line. Option: the grouping
  (`axis`, default Department, named as the design does: Departments / Work / Employment Duration / Site). Chat: "department
  composition", "who is in the organisation", "tenure composition". It describes people, not the topic's score. Other Extras frames
  not built: Benchmark (no external data), Age (no age field); Time and Money composition already exist in the Library.
- **Phantom rules**: no more `People` 2×2 gap; `DonutChart` has a `bare` prop.
- **Breakdown Zones** no longer has its Bars | Zones switch (they are separate forms).
- **Score Meaning is placed once** (`once: true` on the catalogue entry; Number and Ring are two looks for one message, so "Add
  again" is never offered). Breakdown can still be placed once per form.
- **Goal & Pace** draws at its card's width (it was a fixed 776px picture scaled down, so text was ~5px on a phone) and zooms its
  axis to the scores, the target and the estimate. It has its own Developer page (`docs/GoalPaceDoc.jsx`, id `goal-pace`).
- **Score History changes chart**: on a compact card each part is two lines (name, change, score; then a full-width track) on an
  axis zoomed to the range the scores span; at the designed width a change number sits right of the track. The part's own line
  graph now uses the Trend family's `ScoreLine` (exported from `TrendCharts.jsx`; `HistoryLineChart` is a thin wrapper), so it looks
  and responds like every other line chart.
- **`ui/Dropdown.jsx`** replaces the browser `<select>` in the Compare control: a portalled floating list in the design's tokens
  (keeps 8px inside the window, sized to its trigger, Dark mode follows), and the compare row wraps so it never pushes a phone-width
  card wider.
- Verified: story sweep 351 renders, 0 errors / overflows / empty; lint clean (the five known warnings); build passes.

### Index labels fit their slices (checked against `13324:470`)

The Index ring's labels were sized from the slice's *chord*, which is only right at 12 and 6 o'clock: on a side slice the
horizontal label crosses the ring's depth instead, so names ran over the rim and into the scores. `RingIndex.jsx` now
measures: `boxInSlice()` tests a text box against the slice (2px safe zone: inside the arcs, clear of both straight edges
and the hole); `roomInSlice()` finds the widest such box on the slice's mid-angle. The score is placed first (inner half,
12px Bold, `status/*/text-indicator`), then the label takes the widest room left in the outer half that keeps 4px clear of
it, on one line, measured with the real font (`textWidth`, canvas) and truncated with an ellipsis only when it doesn't fit
("Manag…", as the frames do). A child score shows only if its cell holds it. Centre number in `status/*/text` (#0E8C4F in the
frames, not the darker indicator). The tooltip is now the shared `ChartTip` card (`TipCard` exported), portalled at the
pointer, so a card can't clip it. **Outer labels on the Wellbeing Index 3×3 stay off**: 45 Drivers is past the 25-label limit,
and labelling only the few Drivers wide enough to score (Employee Engagement's and Business Essentials') read as random —
hover names every cell. A two-line wrap was tried and dropped: mixing one- and two-line names looked messier than the
frames' single truncated line.

## Library — Refined design (redesign-existing-projects pass) + Current | Refined switch

The Library's top bar has a **Design: Current | Refined** switch (remembered in `library-design`, default Current). Current is
`LibraryScreen.jsx` exactly as it was; Refined is `library/LibraryRefined.jsx`, same data and actions (add / remove from the Org
report, the Widget Information window, Create widget). What the audit found in Current and what Refined does instead:
- 12 accordions with only Score open (most widgets behind clicks) → every section open, a **sticky index** on the left that jumps to
  a section and follows the scroll (scroll-spy measured against the scroller, not `offsetTop`); hidden under 900px.
- Cards in sideways rows paged by arrows → a **wrapping grid** (`minmax(232px, 1fr)`), all visible.
- Add / Detail / Remove only in a hover toolbar (no keyboard or touch way in) → **actions on the card**, always visible: "Add to report"
  (dark pill) or "Remove from report" (destructive ghost) and "Details"; "On report ✓" beside the name. The preview opens the details too.
- Centred title / size / blurb stacks → left-aligned text, the blurb clamped to two lines, size / persona / Sample data as quiet square tags.
- Two tab rows and a "Widgets 61" pill → a headline ("Widget library", the count, how many are on the report with a thin progress bar)
  and **one sticky, translucent toolbar**: SHAPE | Yours, search, persona (Org / Personal / Team with counts), and a **size filter**
  (All / 1×1 / 2×2 / 3×3, only sizes that exist for the persona).
- Composed empty states (no search match → "Clear filters"; Yours → Create widget), focus rings, hover lift on cards, 0.97 press
  (`.lib2` rules in `index.css`), staggered card entry.
Kept: IBM Plex Sans, the warm greys and one accent (the design system), the Widget Information window. Verified at full width and
760px (no sideways scroll), index jumps, add/remove, filters, empty states, switching back and forth; no console errors.

## Time Impact, Money Impact, Time to Gain — the concept, a model, and their Scopes

**The concept (product owner):** these widgets have been called value of benefit, your potential, time to gain. They mean one
thing: **if scores rose to Flourishing, this is what people would get back each year.** Time comes back as productivity and fewer
absences; money as productivity, absenteeism, retention and injury / claims. **Team reports show time only (no money); a personal
report shows Time to Gain as one number, no breakdown.** "Money Composition" is renamed **Money Impact** (family id unchanged).
- **`lib/impactModel.js`**: per person, the gap to Flourishing (80) on the Explorers behind each part (`PARTS`: productivity ←
  Engagement + Job Satisfaction; absenteeism ← Physical + Psychological Health; retention ← Employee Commitment; claims ← Physical
  Work Environment + Physical Health). **The gaps are real** (every person, every round; people at 80+ add nothing). **The rates
  that turn a point into hours or dollars are a sample model** (`PARTS[].hours/leaveRisk/dollars`, `RATES`: $40 an hour, $9,000
  replacement) — swap them for the real SHAPE model and nothing else changes. Time = hours per person a year; money = the
  organisation's dollars a year. `impact(i, target, filter)`, `impactSeries()`, `impactLadder()` (to 60/70/80/90),
  `impactByGroup(axis)` (per person, groups under 5 hidden), `samplePerson()` (the median person below 80, for the personal
  report: no signed-in person exists). Widgets read it too, so widget and Scope agree; all three forms are tagged sample.
- **Scopes** (`scopeRecipes.jsx`): Time Impact and Money Impact = Meaning (the per-year number) → **Where the Time / Money Comes
  From** (Composition: ring + parts with what each is built from) → **What Each Step Is Worth** (new: the gain at 60 / 70 / 80 /
  90, so a partial lift has a visible value) → The Scores Behind It (Breakdown bars of the source Explorers) → **Where the Gain Sits**
  (new: per person by Department / Work Model / …) → Time / Money to Gain Over Time (Score Over Time, own axis) → Actions (weakest
  Drivers in those Explorers) → **How This Estimate Works** (what is measured, what is assumed, "Sample model"). Time to Gain
  (personal): Meaning → the ladder for that person → the model with their own Explorer scores; sample-tagged throughout.
  New Stories live in `stories/ImpactStories.jsx`. The team form of Time Impact uses the same Scope (no team data exists).
- Gallery: `?scopes=time-impact,money-composition,time-gain&w=340` renders Scopes at a card width (new `w` param).
