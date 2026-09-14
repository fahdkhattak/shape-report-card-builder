# Figma Widget Audit — Existing Families

Source of truth: Figma file `984qJvMt7fCHASYHRwgrab` ("SHAPE 3.0 Handoff"), frame "Collated
Widgets" (`12635:69176`). This audit calls `get_design_context` on specific widget instances
inside that frame and diffs the returned styling/spacing/color/typography against our current
implementation (`src/components/widgets/primitives.jsx`, `WidgetBody.jsx`, `lib/families.js`,
`lib/tokens.js`). Scope: families we've **already built**. New families discovered in the same
sweep (SH.DRV-SUM, SH.ORG-GLC Work Model, SH.SCR-CMP) are documented at the end for context but
are out of scope for "correction" work — they need net-new build-out, not fixes.

Naming convention seen in the file: `SH.<CODE>.<Scope>.<size>.<variant>`, Scope = `P`
(personal/your) / `T`/`O` (team/org). In practice the header **text** shown inside a card
doesn't reliably match its own P/T/O suffix (e.g. a node named `...P.2x2.1` renders the header
"ORG STATUS"; a node named `...P.1x1.1` renders "Team STatus") — this looks like designer
copy‑paste drift in the sample instances, not a real behavior spec. Don't treat literal header
strings as authoritative; our own scope-derived labels are fine.

---

## Top finding #1 — 1x1 trend-indicator overflow (confirmed real, root cause + fix identified)

**Every 1x1 SCR-SUM instance in Figma (`12599:8132`, `12599:8143`, `12599:8161`, `12599:8185`)
renders its `TrendIndictator` with `number={false} round={false}`** — i.e. the 1x1 form shows
**only the caret triangle inside the colored pill, no "+9" and no "since last round" text at
all.** The full pill (caret + number + "since last round") is used **only in the 2x2 forms**
(`12599:8209`, `12599:8231`, and EXP‑SCR `12599:8426`).

Our `TrendPill` primitive (`src/components/widgets/primitives.jsx:26-42`) already supports this
exact mode via its `compact` prop (`compact` hides both the number and the "since last round"
text, leaving just the caret in the colored pill) — the primitive is correct. **The bug is that
`WidgetBody.jsx`'s `your-score` case never uses it for the 1x1 form:**

```js
// WidgetBody.jsx line 35-44, formIndex === 0 (the 1x1 "Plain" form)
<BigNumber value={val} colorBand />
<TrendPill delta={trendDelta} />   {/* <-- full pill, should be compact */}
```

**Overflow math.** 1x1 content width = `CELL(164) - 2*16 padding = 132px`. `BigNumber` at the
default `size=64` renders 2 digits (e.g. "83") at roughly 64px IBM Plex Sans Bold ≈ 77px wide.
The full `TrendIndictator` (`px-8 py-6` padding, 8px caret, 4px gap, "+9 " at 11px Semibold,
"since last round" at 11px Regular) measures roughly **150–180px wide** — visually confirmed
against the 2x2 screenshot, where the pill alone spans well over a third of the 312px content
row. Laid out inline with `gap: 8` next to the 77px number, total required width is
**≈235–265px against a 132px box — an overflow on the order of 100–135px**, i.e. the pill by
itself is already wider than the entire widget before the number is even added.

**Fix**: in `WidgetBody.jsx`, `your-score` case, `formIndex === 0` branch, change
`<TrendPill delta={trendDelta} />` → `<TrendPill delta={trendDelta} compact />`. This is also
almost certainly needed for `time-impact`/`enps`/`areas-focus` if they aren't already using
`compact` — checked below, those three already pass `compact` correctly. Only `your-score`'s
1x1 form has the bug.

**Secondary bugs found in the same 1x1 form while investigating:**
- Figma's 1x1 always shows a `/100` suffix to the right of the trend pill (e.g. "83 / 100"),
  rendered as a separate 11px-regular line stacked under the compact pill. Our 1x1 `your-score`
  form never renders `/100` at all — `BigNumber` supports a `unit` prop for exactly this but the
  `your-score` case doesn't pass it.
- Figma's `O.1x1.3` variant (`12599:8132`, no participation stat row) is the closest structural
  match to our "Plain" 1x1 form; other 1x1 SCR-SUM variants (`P.1x1.1` node `12599:8143`,
  `T.1x1.2` node `12599:8161`, `P.1x1.4` node `12599:8185`) additionally show either a status
  pill ("😊 Flourishing", green rounded pill, 20px icon) **or** a stat row ("👥 566 ▼ 85% ⏱")
  below the date — this is the exact "Org Score stat row" gap already flagged in CLAUDE.md as
  not-yet-implemented, now with concrete assets/copy: icon 20px, labels "Team Members"/
  "Participation Rate" (2x2 only — 1x1 omits the text labels, just icon+value), value style
  11px Bold, color `#504c4d` (= `T.gray700`, but note: `T.gray700` isn't currently used anywhere
  in `primitives.jsx`/`WidgetBody.jsx` — it exists in `tokens.js` and is the right token to use).

---

## Top finding #2 — "Areas to Focus" is scored on the wrong axis (dimension, not demographic group)

Confirmed against `12599:9353` ("SH.ORG-GLC.O.1x1.1", named "Areas to focus" inside the card
itself). Exact layout:

- Header: "Areas to focus", 11px Medium, uppercase, `T.gray200` (`#b4b2b1`) — matches our
  `Header` primitive exactly, no change needed there.
- Big number: **48px** Bold (not 64), tracking `-0.96px`, color `T.redStrong` (`#a32136`,
  `--color-status-error-text-strong`). Value in the sample: `31`.
- Trend indicator: compact form (`round={false}`, i.e. caret + number, no "since last round"),
  red bg `T.redBg` (`#fce3e7`), positioned inline next to the big number (not stacked below it).
- Below that: a demographic-group label, **11px Semibold**, color `T.gray900` (`#1d1a1b`,
  `--color-text-primary`), wrapping up to 2 lines with ellipsis truncation on overflow. The
  sample text is **`"South Asian (e.g, Pakistan, India, something else"`** — an **ethnicity**
  example, not a dimension name.

Our current implementation (`WidgetBody.jsx:106-115`) already gets the *styling* right —
`size={48}`, `TrendPill compact`, label at `fontSize: 11, fontWeight: 600, color: T.gray900` all
already match. **The only thing wrong is the data source**: we call `worstDimension()`
(`src/lib/dataset.js:34-36`) and show a dimension name ("Physical Health", etc.) where Figma
shows a demographic subgroup with the worst score. This is exactly the bug the user already
flagged: *"the areas to focus actually is looking at different demographic groups that actually
need help... instead of highlighting a dimension you need to look at."*

**Data gap**: our generated dataset (`data/generate-dataset.js`) has **no ethnicity field** —
confirmed demographic axes actually present are `gender`, `department`, `jobLevel`, `location`,
`tenure`, `employmentStatus`, `workModel`. Figma's own sample happens to use ethnicity, which we
can't reproduce; the fix should pick the worst-scoring group across the axes we *do* have.

**Concrete fix**: `src/lib/dataset.js` already has a generic `groupAverage(keyFn, order)` helper
(line 38, used by `avgScoreByGender`/`avgScoreByWorkModel`). Add a `worstDemographicGroup()`
function that runs `groupAverage` across all seven real axes and returns the single
lowest-scoring `[axisLabel, groupName, score]` triple (mirroring `worstDimension()`'s shape),
then swap `WidgetBody.jsx`'s `areas-focus` case from `worstDimension()` to
`worstDemographicGroup()`, rendering `groupName` (not a dimension name) as the label. `trendDelta`
needs an equivalent group-level previous-round comparison (currently `PREVIOUS.dimensionAvg[name]`
— there's no `PREVIOUS`-round per-group equivalent yet, since `groupAverage` only reads
`u.rounds[u.rounds.length-1]`; it'll need a `round` parameter to compute a delta, or the trend
pill can be dropped until that's wired up).

---

## Per-family detail

### SH.PERF-STS → `org-status` family

Nodes sampled: `12599:7945` (2x2), `12599:8120` (1x1, labeled "Team STatus" despite `.P.` suffix),
`12599:7909` (bare "1x1" frame, labeled "Your STatus").

- Header text is present in every sampled instance ("ORG STATUS" / "Team STatus" / "Your
  STatus", 11px Medium uppercase, `T.gray200`). **Our `WidgetBody.jsx` `org-status` case never
  renders a `Header` at all** (`case "org-status"` at line 60 goes straight into the
  `StatusRing`/`EvidenceSegmentBar` — no header row). This is a real omission, not a styling
  nit: every other family has one.
- **2x2 form only** (`12599:7945`) has a decorative "illustration" behind the status face icon —
  a 204×204px set of faint concentric rings, radiating out from the smiley (`imgIllustration` +
  two nested `<Group>` overlays). This **directly contradicts** the note in
  `primitives.jsx:222-224` ("the real design has no ring visual at all") — that note was written
  against a different reference (`12618:37890`, the "CARD" doc) and is correct for the 1x1 form
  and for other families' status icons, but **the 2x2 PERF-STS form does have a ring
  illustration**. Not urgent to add (it's a large, purely decorative background asset), but the
  code comment should be corrected to scope the claim to "no ring in the 1x1/compact forms" —
  don't extend it universally.
- `StatusBreakdown` (used inside `org-status` 2x2's second form): our current layout puts the
  icon+label on the **top** row and the bare value on the **bottom** row
  (`primitives.jsx:76-87`). Figma's actual order is **reversed** — label alone on top (11px
  Regular, `T.gray500`, no icon), then **value + icon together** on the bottom row (16px Bold,
  tier color, icon **after** the number). Also: Figma's icon is a multi-person "users" glyph
  (`imgUsers01`/`imgUsers2`/`imgUsers3` — three distinct pre-colored exports, one per status),
  not a single-person icon. This resolves the "unconfirmed assumption" flagged in
  `primitives.jsx:66-67` and `210-212` about whether Figma exports genuinely separate
  per-status icon assets: **it does** — three separate SVGs, not one recolored shape. Our
  `PersonIcon` (single person, recolored via `stroke` prop) is the wrong glyph family; should be
  a "users" (two-person) glyph to match, ideally the actual exported asset rather than a
  hand-approximated stroke path (per the design-to-code skill's "reproduce icons faithfully"
  rule — the current `PersonIcon`/`StatusFaceIcon` inlined-SVG approach was already a known,
  flagged compromise; this audit confirms the shapes should be swapped, not just recolored).
- Evidence bar (`EvidenceSegmentBar`): pixel widths (312px content row, 8px height, 6px radius)
  match our implementation exactly. No change needed there.
- Icon size in the 1x1 form: `50.727px` (Figma) vs our `StatusFaceIcon` default `51` — close
  enough to be a rounding artifact, no action needed.

### SH.SCR-SUM → `your-score` family

Nodes sampled: 2x2 `12599:8209`; 1x1 `12599:8132`, `12599:8143`, `12599:8161`, `12599:8185`.
Full detail in "Top finding #1" above. Summary of exact values not covered there:

- 64px Bold, tracking `-1.28px`, color **`T.greenStrong`** (`#0b703f`,
  `--color-status-success-text-strong`) for a positive/green score — our `BigNumber`'s
  `colorBand` prop already resolves to `band(val).cs` which is the Strong variant, so this
  already matches.
- 2x2 evidence caption ("Across the **12** Explorers, **5** are Flourishing, **3** are Striving,
  and **4** are Struggling.") — text, weights, and per-clause colors (gray body / green bold "5"
  / amber bold "3" / red bold "4") all match our existing implementation
  (`WidgetBody.jsx:53-56`) exactly. No change needed.
- Date row: 11px Regular, `T.gray900` (`--color-text-primary`) — matches
  (`formatDate` output styled with `color: T.gray900` already).

### SH.EXP-SCR → mapped to `explorers`? **No — semantic mismatch found.**

Node sampled: `12599:8426` ("SH.EXP-SCR.P.2x2.1", header text "Physical health score").

This is the most important structural finding after the two above. **`SH.EXP-SCR` is not a
ranked list.** It's a single-dimension score card — structurally almost identical to
`SH.SCR-SUM`("Your Score"), just scoped to one dimension instead of the overall score: 64px big
number, full trend pill + `/100`, date, a "Team Members: 15 ▼ / Participation Rate: 95%" stat
row (same pattern flagged as missing in SCR-SUM above), and a Flourishing/Striving/Struggling
evidence breakdown with per-status counts. Given the name ("Explorer Score") and the fact that
"Explorers" in this product = dimensions, **`SH.EXP-SCR` is almost certainly the "drill into one
Explorer/dimension" widget** — e.g. a "Physical Health Score" card — not a list of all
Explorers ranked together.

**The ranked Great/Average/Poor list pattern our `explorers` family (`DriverGroupedList`)
currently implements visually matches `SH.DRV-SUM` ("Factors"), not `SH.EXP-SCR`.** See next
section — `12599:8472` (DRV-SUM) is pixel-for-pixel the tier-grouped list layout our
`DriverGroupedList` component already builds, just fed with **driver** data ("Sleep", "Alcohol",
"Smoking"...) rather than **dimension** data ("Physical Health", "Job Satisfaction"...).

**Recommendation**: don't rename our existing `explorers` family away from `dimensionRankedRows()`
— a dimension-ranked grouped list is a legitimate, useful widget and matches what CLAUDE.md
describes it as ("Identify the areas holding performance back"). But be aware going forward that:
1. Its *visual pattern* is really the DRV-SUM ("Factors") pattern, and a true DRV-SUM/"Factors"
   family (driver-ranked, not dimension-ranked) is a distinct widget we don't have yet — see below.
2. A true `SH.EXP-SCR` single-dimension drill-down card ("Physical Health Score", etc.) is *also*
   a distinct widget we don't have yet, structurally = `your-score` + a stat row, scoped to one
   dimension instead of the overall average. If the product wants per-dimension drill-down cards,
   this is the reference.
This audit only had budget to sample one EXP-SCR instance; if this reading surprises you, it's
worth spot-checking one or two more EXP-SCR nodes from the full "Collated Widgets" metadata tree
to rule out this one instance being mislabeled in the source file.

### SH.DRV-SUM ("Factors") — visual twin of our `explorers`, not a family we have (context only)

Nodes sampled: `12599:8472` (2x2, header "Factors": Sleep/Alcohol under "Great", Smoking/Vaping
under "Average", Nutrition/Home Duties under "Poor", footer "6 more Explorers").

Confirms `DriverGroupedList`/`DriverRow`/`DriverGroupLabel` in `primitives.jsx` are visually very
close already (tier grouping, border-left color strip, right-aligned bold value, footer overflow
row) but with two concrete deltas worth fixing regardless of which family ends up using this
component:

1. **Tier header color bug.** Figma's "Great"/"Average"/"Poor" headers use the **base** status
   text color (`--color-status-success-text #0e8c4f` / `warning-text #f1a118` / `error-text
   #cc2944` = `T.green`/`T.amber`/`T.red`), not the Strong variant. Our `TIER_COLOR` map
   (`primitives.jsx:99`) currently uses `T.greenStrong`/`T.amberStrong`/`T.redStrong` for these
   headers — one shade too dark/saturated. Row **values** correctly use the Strong variant
   already (`DriverRow`'s `color: b.cs` — that part's right, don't touch it). Fix: change
   `TIER_COLOR` to `{ great: T.green, average: T.amber, poor: T.red }`.
2. **Per-row trend indicator uses a third pill mode we don't have**: Figma's row-level trend
   (e.g. Sleep "▲ +9", Vaping "▼ -9") is `round={false}` — caret **and** colored number shown,
   but no "since last round" text. That's different from our `compact` mode, which hides *both*
   the number and the text (caret only). `DriverRow` currently calls `<TrendPill delta={trend}
   compact />` (`primitives.jsx:110`), i.e. caret-only — Figma shows caret+number. Recommend
   adding a middle ground, e.g. a `numberOnly` prop on `TrendPill` (shows icon + colored number,
   hides "since last round"), and switching `DriverRow` to use it. Colors for the negative case
   already match exactly (`redBg`/`redStrong` = Figma's `#fce3e7`/`#a32136`).
3. Minor/cosmetic, low priority: row gap inside a tier is 6px in Figma
   (`gap-[var(--spacing-sm,6px)]` uniformly) vs our `DriverGroupedList`'s inner `gap: 4`
   (`primitives.jsx:122`); the footer "N more Explorers" row's left-border color in Figma is a
   generic `#808080` ("utility-gray-500") that doesn't correspond to any of our named tokens —
   not worth adding a new token for a ~1-shade difference from `T.gray400`, leave as is.

### SH.SCR-HST → `score-history` family

Node sampled: `12599:9141` (2x2, header "Score History").

- Full (non-compact) `TrendIndictator` at the top ("▲ +9 since last round") — matches our
  existing `score-history` case, which already uses the non-compact `<TrendPill />` correctly.
- Y-axis gridlines: Figma shows **6 lines** (100/80/60/40/20/0). Our `Sparkline` primitive
  (`primitives.jsx:160-188`) only draws **3** (`gridY = [0, 50, 100]`). Recommend changing to
  `[0, 20, 40, 60, 80, 100]` for closer fidelity — cheap, no layout impact.
- X-axis: Figma's sample data has 7 rounds (R1–R7); our real dataset only has 3 rounds. This is
  a data-scale difference, not a component bug — nothing to fix in the chart component itself.
- **Content gap, not a styling bug**: below the chart, Figma renders a dynamic narrative caption
  — "After dipping in **R3**, Your Score increased by **+9 points**, reaching **83** in the
  **latest round**." (11px, base color `#504c4d`/`T.gray700`, bolded/colored spans for the
  numbers) — a small templated insight sentence. Our `score-history` case renders nothing below
  the sparkline. Not urgent, but worth flagging as a real content gap if this widget gets
  revisited — would need a small "compute the last local min → current delta" helper in
  `dataset.js` plus a template string, similar to the your-score evidence caption.
- Also present but lower priority: a dashed horizontal reference line at the current score value
  with a small "83" label — decorative goal-line, no equivalent in our `Sparkline` at all. Nice-
  to-have, not correctness-critical.

### SH.ENPS → `enps` family

Nodes sampled: `12599:9502` (2x2, header "Employee Net Promoter Score").

- Big number: **48px** Bold, `T.gray900` (`--color-text-primary`, not a status-banded color) —
  matches our `<BigNumber value={val} size={48} />` call (no `colorBand`) exactly.
- **No trend indicator was rendered in the sampled instance** — the slot where one would go is
  an empty 120px-wide placeholder div with no children. This could mean eNPS intentionally never
  shows a trend, or it could mean this specific sampled instance simply has the trend component
  detached/hidden. Our current `enps` case *does* render `<TrendPill compact positive={trendDelta
  > 0} />` next to the number — treat this as unconfirmed rather than a definite bug; if you can
  spot-check a second ENPS instance (`12599:9534`, not sampled in this pass) and it also omits
  the trend, remove ours to match.
- **Evidence-row semantic mismatch**: Figma's ENPS evidence row is **Promoters / Passives /
  Detractors** (green/amber/red segmented bar + 12px "users" icon + 16px Bold value per bucket,
  using the *base* status colors — `success-icon #0e8c4f` / `warning-text #f1a118` /
  `error-text #cc2944` — not the Strong variants), values in the sample: 20 / 155 / 24. **Our
  `enps` case reuses `EvidenceSegmentBar`/implicitly the Flourishing/Striving/Struggling bucket
  data** (`WidgetBody.jsx:100-104`, passing `LATEST.flourishing/striving/struggling`) — i.e. it's
  showing overall wellbeing status counts under an eNPS card, not promoter/passive/detractor
  counts. This is a real mislabeling, structurally identical in spirit to the Areas-to-Focus bug.
  **Data gap**: `src/lib/dataset.js` and `data/generate-dataset.js` don't currently compute a
  promoter/passive/detractor breakdown anywhere — only a single aggregate `LATEST.eNPS` number
  exists. Fixing this properly needs a small generator/dataset addition (bucket users by their
  eNPS response into promoter ≥9, passive 7–8, detractor ≤6, or whatever scale the source survey
  uses) before the widget can show real Promoters/Passives/Detractors counts instead of
  Flourishing/Striving/Struggling ones.
- Value font-size in the evidence row is 16px Bold with `lineHeight: 22` in Figma vs our
  `StatusBreakdown`'s implicit line-height (browser default) — negligible, not worth a special case.

### SH.RSP-ANL → `popular-responses` family

Node sampled: `12599:9113` (2x2, header "POPULAR RESPONSES").

CLAUDE.md flagged this as "already corrected, sanity-check only" — **that's not quite right**;
there's a real structural gap, though low priority since the family is a placeholder anyway (no
real free-text data exists to drive it). Figma's actual treemap is **6 tiles**, not 3:
- Row 1: "Ergonomics" (176×141px, `personal-blue #00a9eb` = `T.personalBlue`, value 18) +
  "Office Environment" (flex-1, `amber-orange #ff9900` = `T.amberOrange`, two-line label, value 16).
- Row 2: "Technology" (106px, `lavender-violet #a86cff` = `T.lavender`, value 14), "Furniture"
  (98px, `mint-green #00d998` = `T.mintGreen`, value 12), then a narrow column of 3 stacked
  tiles — "Lighting" (`golden-yellow #ffd700` = `T.goldenYellow`, value 5), then two short
  33px-tall tiles: `coral-red #ff6b6b` (value 3) and `teal #26a69a` (value 2).

Two of those six colors (`coral-red #ff6b6b`, `teal #26a69a`) **don't exist in `tokens.js`** —
they're distinct from anything in the current `T.*` graph palette (closest existing token is
`T.turquoise #00ced1`, which is visibly a different, colder hue than `#26a69a`). Our current
`Treemap` (`primitives.jsx:190-207`) is a fixed 3-tile layout (1 big top tile + 2 equal bottom
tiles) using only `[T.personalBlue, T.amberOrange, T.lavender]` — matches Figma's first 3 tiles'
colors but not the full 6-tile structure or the other 3 colors/proportions. Label styling (11px
Semibold uppercase, 20px Bold value, `space-between` layout) already matches exactly — that part
needs no change. If this widget is ever populated with real data, the component itself needs a
6-tile variant (or a flexible N-tile treemap) and two new tokens for coral-red/teal.

### SH.ORG-GLC "Avg. Score: Gender" → `avg-gender` family (sanity check — confirmed correct)

Node sampled: `12599:9257` (1x1, header "AVG. SCORE: Gender").

Everything checked out: bar colors (Male `team-blue/400 #0096ec` = `T.teamBlue`, Female
`hot-pink/100 #ffabcf` = `T.hotPink`, Other `golden-yellow/500 #ffd700` = `T.goldenYellow`,
"Prefer.." `utility-gray/300 #a5a2a2` = `T.gray300`) match `WidgetBody.jsx`'s `GENDER_COLORS`
map exactly, right-edge-only bar radius (12px) matches `MiniBarChart`, 0/100 axis row matches.
**Only a minor type-scale nit**: Figma's row labels are **11px** Regular vs our `MiniBarChart`'s
**10px** (`primitives.jsx:143`); axis "0"/"100" labels are **8px** vs our **9px**
(`primitives.jsx:150`). Both are 1px off — cosmetic, cheap to fix if you're already touching the
component, not worth a special trip on their own.

---

## New families found in the same sweep (not yet implemented — context, not "corrections")

### SH.ORG-GLC "Avg. Score: Work Model" (`12599:9308`)

Same `MiniBarChart` pattern as Avg. Score: Gender, three rows: Onsite / Remote / Hybrid.
Colors: Onsite = `org-blue/500 #20409a` (**new token needed** — not close to anything in
`tokens.js`; closest existing, `T.teamBlue #0096ec`, is a materially lighter/brighter blue),
Remote = `team-blue/400 #0096ec` (= `T.teamBlue`, exact match), Hybrid = `mint-green/500
#00d998` (= `T.mintGreen`, exact match). Label column is wider (56px vs 44px for gender) to fit
"Remote"/"Hybrid". **Good news**: the data layer is already done —
`src/lib/dataset.js:49` already exports `avgScoreByWorkModel()`, built on the same generic
`groupAverage()` helper as `avgScoreByGender()`. Adding this family is mostly a `WidgetBody.jsx`
case + a `FAMILIES` entry + one new `orgBlue` token — not a data-modeling project.

### SH.SCR-CMP "Score Comparisons" (`12599:8624` — real widget; `12599:9479` is a locked/
teaser "Available on [date]" paywall state of the same family, not the real layout)

A vertical stack of comparison rows, each: colored 2px left border (tier color) → icon (person
for "Your Score", two-person "users" for "Team Score", building for "Org Score") → label (11px
Semibold) → for Team Score rows only, a rounded pill "badge" showing an email address (e.g.
"john.lennon@example.com" — presumably the team's manager/lead identity) → for Your Score only,
a compact trend pill (caret + colored number, no "since last round") → right-aligned 16px Bold
value in the tier's Strong color → below the row, a full-width 8px rounded track (`T.gray100`
background) with a colored fill bar sized to `value/100`. Sample shows 4 rows: Your Score (83,
green), Team Score × 2 different teams/leads (71 amber, 64 amber), Org Score (92, green). This
is a genuinely new visual pattern — not a re-skin of anything we have — would need its own
`WidgetBody.jsx` case and a small new "labeled progress row" primitive.

---

## Summary of concrete code changes (by file)

**`src/components/widgets/WidgetBody.jsx`**
1. `your-score`, `formIndex === 0` (1x1): change `<TrendPill delta={trendDelta} />` →
   `<TrendPill delta={trendDelta} compact />` (fixes the overflow bug) and add a `/100` unit
   label to match Figma.
2. `org-status`: add a `<Header title="ORG STATUS" />` (or scope-appropriate label) — currently
   missing entirely.
3. `areas-focus`: replace `worstDimension()` with a new `worstDemographicGroup()` (see below),
   render the returned group name instead of a dimension name.
4. `enps`: replace the Flourishing/Striving/Struggling evidence row with a Promoters/Passives/
   Detractors one once the dataset supports it (blocked on a data-layer addition, see below);
   until then, at minimum stop passing wellbeing-status data into a component labeled around
   eNPS semantics.

**`src/components/widgets/primitives.jsx`**
1. `TIER_COLOR` (used by `DriverGroupLabel`): change `great`/`average`/`poor` from
   `T.greenStrong`/`T.amberStrong`/`T.redStrong` to `T.green`/`T.amber`/`T.red`.
2. `TrendPill`: add a third display mode (e.g. `numberOnly`) that shows the caret + colored
   number but omits "since last round" — needed by `DriverRow`'s per-row trend and by
   `SH.SCR-CMP`'s Your-Score row.
3. `StatusBreakdown`: swap row order (label-only row on top, value+icon row below) and swap
   `PersonIcon` for a "users" (multi-person) glyph — ideally the real exported asset per the
   design-to-code skill's icon-fidelity rule, not a hand-drawn approximation.
4. `Sparkline`: widen `gridY` from `[0, 50, 100]` to `[0, 20, 40, 60, 80, 100]`.
5. `MiniBarChart`: bump row-label font-size 10→11px, axis-label font-size 9→8px (cosmetic,
   optional).
6. Correct the comment at lines 222-224 ("the real design has no ring visual at all") to scope
   it to compact/1x1 forms only — the 2x2 PERF-STS form does have a decorative concentric-ring
   illustration.

**`src/lib/dataset.js`**
1. Add `worstDemographicGroup()` — run the existing `groupAverage()` helper across all seven
   real demographic axes (`gender`, `department`, `jobLevel`, `location`, `tenure`,
   `employmentStatus`, `workModel`) and return the single lowest-scoring `[axisLabel, groupName,
   score]`. Needed for the Areas-to-Focus fix.
2. (Blocked/needs data-model work, not just a dataset.js read-layer change) add a promoter/
   passive/detractor bucketing of `LATEST`/`PREVIOUS` for the `enps` fix — requires touching
   `data/generate-dataset.js`, not just the read layer, since no such breakdown is currently
   generated at all.
3. `avgScoreByWorkModel()` already exists and is unused — ready to wire into a new `FAMILIES`
   entry for "Avg. Score: Work Model" whenever that family gets built.

**`src/lib/tokens.js`**
1. Add `orgBlue: "#20409a"` if/when the Work Model family is built.
2. Add two new graph-palette tokens (`coralRed: "#ff6b6b"`, and a real `teal: "#26a69a"` —
   distinct from the existing `T.turquoise #00ced1`) if/when `popular-responses` gets a real
   6-tile treemap.
