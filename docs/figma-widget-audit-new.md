# Figma Widget Audit — New Families (Index, Mental Wellbeing, Health Age, Time Impact, EAP, Heat Map)

Source of truth: Figma file `984qJvMt7fCHASYHRwgrab` ("SHAPE 3.0 Handoff"), pulled via
`get_design_context`/`get_screenshot` on the specific node IDs below. This is a research/cataloging
document only — no app code was touched. Written against the codebase as it stands today: read
`src/components/widgets/primitives.jsx`, `WidgetBody.jsx`, `src/lib/families.js`, `src/lib/tokens.js`,
`src/lib/dataset.js`, and `data/generate-dataset.js`'s header comment before implementing — this
report references all of them by name rather than restating their contents.

All widget bodies below assume they render inside the existing card chrome (white bg, 1px
`T.gray100` border, `radius.widget` (18px), 16px padding, `Header`/`Insight`/`Evidence`/`Action Bar`
anatomy) — that part is unchanged from every other widget and isn't re-described per family.

---

## PRIORITY 1 — Index Widget

Nodes: `12637:71238` ("Index Widget 2x2", 344×344) and `12637:71336` ("Index Widget 3X3", 524×524).

### It is a per-dimension drill-down, not a 12-dimension wheel

**Important correction to the brief's working assumption.** Both nodes' header reads
**"Corporate Culture INDEX"** — this is not a wheel of the app's 12 top-level dimensions
("Explorers"). It's a **single-dimension detail widget**: pick one dimension (here, Corporate
Culture), show that dimension's own overall score in the center, and put a colored ring around it
with **one segment per driver that rolls up into that dimension** (per
`DRIVER_DIMENSION` in `data/generate-dataset.js`). The widget is presumably instantiable per
dimension — the family is generic ("Index Widget"), the sampled instance just happens to be
Corporate Culture. Our "Explorers" family already covers the 12-dimension-wheel use case (as a
ranked list, not a ring) — this is a different, complementary widget: pick one dimension, see
its drivers.

**Label mismatch, worth flagging before implementation:** the ring's 10 segment labels in this
mockup ("Pride", "Manager to Peer", "Aesthetic", "Outcome", "Processes", "Peer to Peer", "Rules &
…", "Leaders", "Values", "Morale") do **not** cleanly match our dataset's real
`DRIVER_DIMENSION` Corporate Culture list, which has **7** drivers: `Values`, `Leaders`,
`Empowerment`, `Collaboration`, `"Policies and Practices"`, `Morale`, `Pride`. Several of the
mockup's labels ("Manager to Peer", "Aesthetic", "Outcome", "Processes", "Peer to Peer") read
more like Coworker Dynamic / Physical Work Environment / Manager Style concepts. This mockup was
very likely built against an earlier or hypothetical driver taxonomy, not the one baked into our
generated dataset. **Build against our real `DRIVER_DIMENSION` map, not the mockup's exact
labels/count** — the widget should render however many drivers a given dimension actually has (2
to 7, see the table under "Segment count varies a lot" below), not assume 10.

**The "Outcome Focus" label spotted in earlier metadata scanning**: this is almost certainly the
driver-name label at `data-node-id="12637:71270"` — its container div is `overflow-hidden
text-ellipsis w-[42.282px]` and renders as `"Outcome"`. A 42px-wide box truncating to just
"Outcome" strongly suggests the underlying full string was longer (e.g. "Outcome Focus") before
CSS ellipsis clipped it. It isn't a separate annotation or legend element — it's one of the ring's
own driver-name labels, just visually truncated. Don't chase it further; treat our own driver
names as the source of truth and truncate with ellipsis the same way `DriverRow` already does in
`primitives.jsx` (`overflow: hidden, textOverflow: ellipsis`).

### Overall shape: single annular ring (donut) around a filled center circle

Confirmed from the code and screenshot, not a sunburst-with-independent-inner/outer-dimension-
rings as the brief speculated for the 2x2 case:

- A **white filled circle** sits at dead center — asset `imgEllipse314`, exactly **111.247px**
  diameter, positioned via `-translate-x-1/2 -translate-y-1/2` at the exact center of the graphic.
  This is the donut hole; the big score number sits inside it.
- Around that hole, a **single ring subdivided into N equal-angle wedges**, one per driver in the
  dimension (N=10 in this sampled instance, but see below — real N varies 2–7 per our dataset).
  Each wedge is exported as its own flattened SVG asset (`imgDonut0`…`imgDonut9`) rather than
  drawn as one path — that's a Figma export artifact, not evidence of anything structurally
  unusual; don't try to reproduce 10 separately-cropped image assets, compute the wedges
  programmatically (see "Recommended implementation" below).
- Ring outer diameter ≈ **273.836px**, i.e. outer radius ≈ **137px**. Inner hole radius ≈ **55.6px**
  (half of 111.247). Ring band thickness ≈ **81px**. These are the proportions for the 2x2's
  ~344×344 card; the whole graphic (`Donut` + label layers) sits in a ~377×379px box that gets
  centered/fit into the widget's available Insight area (344px card minus 16px padding × 2 minus
  header row).
- Each wedge's **fill** is a pale status-band tint, and its **outer arc edge** carries a thin
  (~3–4px) stroke in the strong status color. Gaps between adjacent wedges are thin white/
  background lines (a few px), giving the "segmented ring" look in the screenshot.

### Center content

- **Big number** = the dimension's own overall average score (85 in the sample) — i.e.
  `dimensionValue("Corporate Culture")` in our dataset, not a sum/average recomputed from the
  visible wedges (though in practice they should agree since it's the same underlying dimension
  aggregate).
- Typography: **64px, bold, tracking -1.28px (-2%)**, color = the value's status-strong color
  (green/amber/red via `band()`). This is **exactly** what `BigNumber` from `primitives.jsx`
  already produces (`size={64}`, `colorBand` — its own letter-spacing formula is
  `-size * 0.02` = -1.28 for size 64). No new component needed for the center number; reuse
  `BigNumber` directly.

### How each driver segment is rendered

- **Shape**: an annular sector (donut wedge) — pale bg fill (`T.greenBg`/`T.amberBg`/`T.redBg`),
  thin strong-color stroke traced only along its outer arc, thin white gap on both radial edges.
  Color is picked from **that individual driver's own score band**, not a fixed per-dimension
  palette color — confirmed by the sample: 8 wedges are green (scores 81–90), one is amber (68),
  one is red (33), each independently banded. This is the same `band()` thresholds (≥70/≥40/else)
  and the same hex values already in `T` (`greenStrong #0b703f`, `amberStrong #d98d0b`,
  `redStrong #a32136`, and their `*Bg` pale variants `#e1f5ea`/`#fff6e4`/`#fce3e7`) — **no new
  color tokens needed**, `band()` from `lib/tokens.js` maps directly.
- **Value display**: the driver's score is printed as a **number label inside the ring band**,
  not as arc length/fill percentage — every wedge is the same angular width (360/N°) regardless
  of score; only color and the printed number carry the value. Label: **11px, bold**, color =
  that wedge's `band(value).cs` (strong status color), positioned at the wedge's angular midpoint,
  roughly mid-radius (~96px from center for the 2x2 proportions above), horizontally centered.
- **Driver name label**: 11px, regular weight, color `#1d1a1b` (≈ `T.gray900`/`gray800`),
  positioned just outside the ring's outer edge at the same angular midpoint. Long names are
  ellipsis-truncated inside a narrow fixed-width box (~42–54px) — see "Outcome" above. Labels on
  the left half of the circle are right-anchored (`translate-x-full` in the source, text grows
  leftward, away from the ring) while labels elsewhere are center-anchored
  (`translate-x-1/2`) — a standard radial-label technique to keep text from colliding with the
  ring; replicate this by branching on which half of the circle the wedge's angle falls in.
- **Wedge ordering/rotation**: first driver ("Pride") is centered at 12 o'clock (0°/top); wedges
  proceed **clockwise** at 360/N degrees each.

### Header & other text

- Header: `"{DIMENSION NAME} INDEX"`, uppercase, **11px medium, tracking 0.11px**, color
  `#b4b2b1` — this is `T.gray200`, and this is **exactly** what the existing `Header` primitive
  already renders (`fontSize: 11, fontWeight: 500, letterSpacing: "0.11px", textTransform:
  "uppercase", color: T.gray200`). Reuse `Header` with `title={`${dim.toUpperCase()} INDEX`}`
  verbatim — no new header component needed.

### Segment count varies a lot — plan for N ≠ 10

Per `DRIVER_DIMENSION`, the number of drivers per dimension (and therefore ring segments) is:

| Dimension | # drivers (N) |
|---|---|
| Corporate Culture | 7 |
| Physical Health | 5 |
| Coworker Dynamic | 5 |
| Psychological Health | 4 |
| Life Outside Work | 4 |
| Employee Commitment | 4 |
| Job Satisfaction | 3 |
| Manager Style | 3 |
| Physical Work Environment | 3 |
| Soft Work Environment | 3 |
| Employee Engagement | 2 |
| Business Essentials | 2 |

So real instances will range from a 2-wedge ring (Employee Engagement, Business Essentials — each
wedge spans 180°) up to a 7-wedge ring (Corporate Culture, the closest real match to the mockup's
density, though still not 10). The wedge-angle math must be driven by `N =
Object.values(DRIVER_DIMENSION).filter(d => d === dim).length` (or equivalently, count of keys in
a `DIMENSION_DRIVERS` reverse-map you build once), not hardcoded to 10. Sparse 2-wedge rings will
look visually different from the dense mockup sample — that's expected, not a bug, given the real
data model.

### The 3x3 variant — two-layer ring, and a real data gap

Structurally the 3x3 (`12637:71336`) is the 2x2 layout **plus**:

1. A background image asset (`Frame1597884776`, ~403×403px, offset behind the rings) — this
   almost certainly contains the leader/connector lines fanning from ring segments out to the
   free-floating outer labels described below. It's a single flattened decorative image in the
   export, not individually inspectable strokes.
2. A **middle ring** (~342px diameter, outer radius ≈171px) subdivided into **2×N segments** (20
   segments for this 10-segment inner-ring sample) — i.e., roughly **2 sub-items per driver**,
   same wedge-annulus rendering (pale bg fill, strong-color outer stroke, banded per-segment),
   each with its own 11px bold number label at its own mid-radius. Same green/amber/red banding
   pattern as the inner ring (mix of 81s/85s/88s green, a couple ~70s amber, two reds 31/37).
3. A **thin outer ring** (~352px diameter — only 10px larger than the middle ring) that is really
   just the middle ring's outer edge/segment-divider strokes, not an independent third data layer.
4. **20 free-floating text labels** outside the ring (e.g. "Great Place to Work", "Dress Code",
   "Decor", "Decisiveness", "Boundaries", "Meetings", "Leave Policies", "Toxicity",
   "Competitive", "Oppositional", "Self-actualising", "Respect", "Democratic", "Open", "Reporting
   line", "Leaders", "Adaptable", "Morals of Colleagues", "Spaces", "Intimidation") — positioned
   at scattered (not strictly radial) coordinates, presumably laid out by hand or by a
   collision-avoidance step in the design tool, connected back to their ring segment via the
   background connector-line image from point 1. These read like **individual survey
   question/topic names**, one layer of detail below "driver."

**This is a real, sizable data gap — flag it prominently, don't quietly fake it.** Per
`CLAUDE.md` and `data/generate-dataset.js`'s header comment, our dataset only has
**dimension-level and driver-level** scores (0–100) — it deliberately does not model the ~145
individual survey *items* (raw item polarity wasn't reliably inferable, and "no current widget
consumes item-level data anyway" — until now). The 3x3's middle ring genuinely needs one score
per sub-item, and we have no such data. Recommended options, in order of preference:

- **(a) Ship only the 2x2 for now.** It's fully buildable with real data today. Treat the 3x3 as
  blocked on a real data-model addition (item-level scores, or at minimum a second-level grouping
  under each driver), same category of gap as Health Age's missing age field below.
- **(b) If a 3x3 is wanted for visual completeness anyway**, subdivide each driver's wedge into a
  small fixed number of purely-cosmetic sub-slices (e.g. 2) that all inherit the parent driver's
  exact score and color — comment it clearly as a synthetic visual subdivision with **no real
  distinct data**, and drop the outer free-floating labels entirely (we have no real names for
  them). Do not invent plausible-sounding survey-item names — that would misrepresent placeholder
  data as real.

### Colors used (all already in `T`, confirmed hex-exact)

| Role | Hex | Token |
|---|---|---|
| Green wedge fill | `#e1f5ea` | `T.greenBg` |
| Green wedge stroke / number | `#0b703f` | `T.greenStrong` |
| Amber wedge fill | `#fff6e4` | `T.amberBg` |
| Amber wedge stroke / number | `#d98d0b` | `T.amberStrong` |
| Red wedge fill | `#fce3e7` | `T.redBg` |
| Red wedge stroke / number | `#a32136` | `T.redStrong` |
| Driver name label | `#1d1a1b` | `T.gray900`/`gray800` |
| Header | `#b4b2b1` | `T.gray200` |
| Center number | status-strong (as above) | `band(value).cs` |

No new tokens needed for this widget.

### Recommended implementation approach

1. Add a `describeArc(cx, cy, rInner, rOuter, startAngleDeg, endAngleDeg)` SVG helper (return a
   `<path>` `d` string for an annular sector) to `primitives.jsx` or a new small
   `arcMath.js` — standard "donut wedge" path math (two arcs + two radial lines), not something
   the Figma export gives you directly since it shipped as flattened per-wedge images.
2. Build a `DimensionRing({ dimension, size })` component (new export in `primitives.jsx`):
   - `const drivers = Object.keys(DRIVER_DIMENSION).filter(d => DRIVER_DIMENSION[d] === dimension)`
     (or precompute a `DIMENSION_DRIVERS` reverse map once, e.g. in `dataset.js`).
   - `angleStep = 360 / drivers.length`; wedge *i* spans
     `[i*angleStep - angleStep/2, i*angleStep + angleStep/2]` measured clockwise from 12 o'clock.
   - For each driver: `const val = driverValue(driver); const b = band(val);` → wedge fill
     `b.bg`, outer stroke `b.c`/`b.cs`, number label `val` in `b.cs`.
   - Trig for label placement: for an angle θ (degrees, 0 = top, clockwise), at radius r:
     `x = cx + r * Math.sin(θ * Math.PI/180); y = cy - r * Math.cos(θ * Math.PI/180)`. Use this
     for both the inside-ring value label (r ≈ midpoint of rInner/rOuter) and the outside-ring
     name label (r ≈ rOuter + ~12px label gap).
   - Branch name-label text-anchor/justify on which half of the circle θ falls in (left half:
     anchor right / grow left; right half: anchor left / grow right; near-vertical: center) to
     avoid ring collisions, matching the mockup's `translate-x-1/2` vs `translate-x-full` split.
   - Render center via the existing `BigNumber` primitive: `<BigNumber value={Math.round(dimensionValue(dimension))} colorBand />`.
3. New family entry in `families.js`, e.g. `{ id: "dimension-index", name: "Index", category:
   "Areas to Focus", forms: [{ size: "2x2", label: "Driver ring" }] }` (add a 3x3 form only once
   the data gap above is resolved or knowingly accepted per option (b)). Since library widgets
   have no per-instance config UI today, default the dimension to `worstDimension()[0]` (same
   pattern `areas-focus` already uses) rather than inventing a dimension-picker — flag to
   product/design if a picker is actually wanted; that's a UI decision beyond this audit's scope.
4. `WidgetBody.jsx` case: `case "dimension-index": { const [dim] = worstDimension(); return
   (<><Header title={`${dim.toUpperCase()} INDEX`} /><DimensionRing dimension={dim} /></>); }` —
   note `Header` is normally rendered by the card wrapper already for other families (check
   whether `WidgetBody` itself or its caller renders `Header` for other cases — from the current
   file, other cases render only the Insight content and rely on the family's own title elsewhere;
   confirm this against `WidgetCard.jsx` before wiring in, since this widget's header text is
   dynamic (per-dimension) unlike other families' static family-name headers).

---

## PRIORITY 2 — Smaller Families

### SH.MNT-WLB — Mental Wellbeing

Nodes: `12599:8809` (Team, 2x2), `12599:8866` (Org, 2x2), `12599:8752` (Personal, 2x2).

Three scope variants of the same concept, not three different visuals:

- **Team** (`12599:8809`, header "TEAM Mental Well-being") and **Org** (`12599:8866`, header "ORG
  Mental Well-being") are the same layout: a **caption** ("Team distribution (%)"), then a stack
  of **3 rows** — "Feeling Low", "Feeling Anxious", "Feeling Stressed" — each row is: label (11px
  regular, `T.gray900`) + right-aligned bold percentage (13px number + 11px "%" suffix) above a
  **horizontal progress bar** (8px tall, `T.gray100` track, colored fill rounded on the right edge
  only — same `MiniBarChart` pattern already in `primitives.jsx`, just one bar per row instead of
  N bars in one chart) with a **2px left border** on the label row in the same fill color. Team
  variant additionally shows a compact trend pill (caret + delta number, no "since last round"
  text) per row; Org variant omits the trend pill entirely. Bar/text color: Team uses
  `#0074bc` ("team-blue/500"), Org uses `#20409a` ("org-blue/500") — **both are new colors, not
  in `T`**: `T.teamBlue` currently = `#0096ec`, which does not match this instance's `#0074bc`.
  Flag this drift; either add `orgBlue`/reconcile `teamBlue`, or treat these bars as status-neutral
  (not literally "team/org" branded) and reuse an existing Graph-palette color — needs a design
  call, not just an engineering one.
- **Personal** (`12599:8752`, header "Mental Well-being") is a different, simpler layout: 3
  label/pill/trend rows (no bars, no percentages) where each pill shows a **severity band name**
  ("Moderate", "Severe", "Extremely Severe") in a pill colored by severity (uses new Likert-scale
  utility colors — `#fff1cf`/`#ffe3dc`/`#fcd7dd` bg with `#d98d0b`/`#a32136` text — not existing
  `T` tokens, would need new `likertNeutral`/`likertBad`/`likertVeryBad` additions or reuse
  `amberBg`/`redBg` as an approximation since the text colors already match `T.amberStrong`/
  `T.redStrong`), plus a compact trend caret. Below the 3 rows, a right-aligned **"Get Support"**
  action-bar button (`theme="accent" variation="secondary"` in our `Button` vocabulary — outlined
  accent pill, heart icon) — same CTA pattern reused in SH.EAP-SVC below.

**Data mapping** (per the user's guidance, since there's no raw PHQ-9 field): use our
Psychological-Health-dimension drivers `Stress`, `Depression`(N/A — not in `DRIVER_DIMENSION`,
only `Stress`/`Anxiety`/`Resilience`/`Depression` — checked: `Depression` **is** a listed driver)
i.e. `Stress`, `Anxiety`, `Depression` map to "Feeling Stressed"/"Feeling Anxious"/"Feeling Low"
respectively (our drivers are 0–100 "higher is better," so this needs inversion — `100 -
driverValue(x)` — to read as severity, matching the `invert` pattern already used for "Burnout
Risk" in `dataset.js`'s `TOPIC_TO_METRIC`). For the Team/Org % bars: interpret the inverted value
as "% of the group reporting elevated {driver}" (a defensible proxy, though the mockup's
underlying real metric is presumably a literal Likert-response percentage, not a driver-score
percentage — document this as an approximation). For the Personal severity band pill: bucket the
inverted per-user driver score into 5 tiers (Normal/Mild/Moderate/Severe/Extremely Severe), e.g.
by quintile thresholds (0–20/20–40/40–60/60–80/80–100) — pick real thresholds when building, this
audit doesn't attempt to reverse-engineer PHQ-9's actual cutoffs since we're already one
inference-step removed from real PHQ-9 data.

**What to build**: new family `mental-wellbeing` with 3 forms (Team/Org/Personal, all 2x2 per
the node sizes). Team/Org forms are close to a new primitive — a labeled-progress-row list; could
generalize `MiniBarChart` or add a sibling `LabeledProgressRows` primitive since `MiniBarChart`
currently renders all bars sharing one 46px label column and one shared 0/100 axis, not
independent full-width rows with their own trend pills. Personal form's severity pills are new —
no existing primitive matches a labeled-severity-pill-list; build alongside the EAP CTA button
pattern (see SH.EAP-SVC — same "Get Support" button appears in both).

### SH.HLT-AGE — Health Age

Nodes: `12599:9008` (Team, 2x2), `12599:9036` (Org, 2x2), `12599:8980` (Personal, 2x2). All three
are the *same* layout, differing only in header ("Team/ORG/Your HEALTH AGE"), pronouns
("Your Team's"/"Your Employees'"/"Your"), and which direction is colored (green when younger-than-
actual, red when older).

- **Big number**: `"{years}yrs {months}mo"` as two adjacent number+unit pairs — years in **36px
  bold**, tracking -0.72px, colored green (`#0b703f`) or red (`#a32136`) depending on direction;
  months in the same 36px/bold styling; unit suffixes ("yrs"/"mo") in 11px regular `#1d1a1b`.
  Note: **this is not our existing `BigNumber` primitive's size scale** (which goes 64/48/etc, not
  36) — would need a new size variant or a bespoke two-part number component.
  Next to it, a trend pill (caret + "Declined by"/"Improved by" + bold delta duration, e.g. "2 yrs
  3 mo") — a variant of `TrendPill` that renders duration text instead of a plain numeric delta;
  `TrendPill` would need a `deltaText` prop alternative to its current numeric `delta`.
- **Sentence + pill**: a plain-text line ("Your health actions make {you/them}"), then a **pill**
  ("2 yrs 3 mo younger" / "1 yr 1 mo older" — green/red bg per direction), then another plain-text
  line ("than your actual age."). All 11px.
- **Evidence section**: a horizontal track (`T.gray100`, 8px, rounded) with a colored fill segment
  positioned off-center (left-of-center = younger/green, right-of-center = older/red) representing
  where the person/group falls on a younger↔older spectrum, plus a vertical center tick mark
  (the `imgLine50` asset — a plain divider line, trivial to reproduce as a 1px absolute-positioned
  div rather than an image asset) and a 3-label axis row below ("YOUNGER" / "ACTUAL AGE" / "OLDER",
  11px, `T.gray600`-ish `#504c4d`). This is close to `EvidenceSegmentBar` in spirit (a colored
  segment on a track) but structurally different enough (single off-center colored bar + center
  tick + 3-way axis labels, vs. `EvidenceSegmentBar`'s 3-way cumulative-width flourishing/striving/
  struggling split) that it warrants its own small primitive rather than forcing reuse.

**Known gap (flag clearly, do not build a fake age field to unblock this):** there is **no
age or date-of-birth field anywhere in the generated dataset** (`data/generate-dataset.js`'s
demographic fields are gender/department/jobLevel/location/tenure/employmentStatus/workModel —
confirmed, no age). This widget's entire premise (chronological age vs. "health age") is
unbuildable with real numbers today. Document the visual spec above so it's ready to wire up the
moment an age field is added to the generator, but do not attempt to synthesize a fake age
distribution as a substitute — that would be fabricating a demographic field, a bigger step than
a normal data-gap workaround. Recommend surfacing this as an explicit open item for whoever owns
the dataset generator.

### SH.TME-GAN / SH.TME-ADV — "Time to Gain" and "Time Impact"

Nodes: `12599:9436` (TME-GAN, Personal, 1x1), `12599:9448` (TME-ADV, Team, 1x1), `12599:9460`
(TME-ADV, Org, 1x1).

**These are two genuinely different metrics, not one concept at two scopes** — and one of them
is a direct match for a family we already have:

- **`SH.TME-ADV` is our existing `time-impact` family**, confirmed by its own header text: both
  the Team (`12599:9448`) and Org (`12599:9460`) instances literally read **"Time Impact"** in
  the header — same label our `families.js` already uses (`{ id: "time-impact", name: "Time
  Impact", ... blurb: "Estimated hours gained or lost per year." }`). Same shape as our current
  `time-impact` case in `WidgetBody.jsx`: big number + "hrs" unit + "per annum" caption. What's
  new here is **scope variants we don't have yet**: Team uses `#0074bc` (team-blue) for the
  number, Org uses `#20409a` (org-blue) — same new-color caveat as MNT-WLB above — plus a compact
  trend-caret pill next to the number (currently our `time-impact` case has no trend indicator at
  all). **Recommendation: add Team/Org forms to the existing `time-impact` family** (extending
  `driverValue("Work-life balance")`-based logic with a trend pill) rather than creating a new
  family for TME-ADV.
- **`SH.TME-GAN` ("Time to Gain", node `12599:9436`, Personal 1x1) is a distinct new family.**
  Header "Time to gain" (note: lowercase "to gain", sentence case, unlike "Time Impact"'s title
  case — copy detail worth preserving). Big number in **weeks**, not hours (48px bold,
  tracking -0.96px, org-blue `#20409a`), "wks" unit suffix, "per annum" caption below — same
  bones as `time-impact`'s layout but different unit/color and **no trend indicator** at all (the
  sampled instance has no pill). Since the user described this as "a proprietary insight which
  takes a lot of different metrics in" — i.e. explicitly a multi-metric composite, not a
  single-driver estimate — don't just reuse the `time-impact` family's single-driver math
  (`driverValue("Work-life balance")/4`) verbatim; this is presented as a distinct, more
  "premium-feeling" insight, so it likely deserves its own (even if still heuristic) formula
  blending a few drivers, e.g. a small weighted combination of Work-life balance, Workload,
  Sleep, Stress — treat the exact weights as a placeholder same as `time-impact`'s current `/4`
  approximation, just don't 1:1 copy that exact divisor since the two widgets are meant to read
  as different insights.

**What to build**: extend `families.js`'s `time-impact` entry with 2 more forms (Team/Org,
1x1 — note these are 1x1 per the node names, not 2x2, differing from our current single 1x1 form
only in color/trend). Add a **new** family `time-to-gain` (1x1, Personal scope) with its own
`WidgetBody.jsx` case producing a weeks-denominated big number, org-blue, no trend pill, "per
annum" caption — reusing `BigNumber`-style layout but note the 48px size (not our primitive's
default sizes) and the specific `#20409a` color (new token needed either way, see MNT-WLB above).

### SH.EAP-SVC — EAP Service (inferred purpose)

Nodes: `12599:9086` (pink/error-bg variant), `12599:9094` (gray/hover-bg variant), both 1x1.

Not explained by the user — inferred from content: both instances are headed **"MINDFULNESS"**
(not "EAP Service" — the header text is presumably driven by *which* wellbeing topic triggered
the nudge, "Mindfulness" being one such topic/program name) and both show a short prompt sentence
+ a **"Get Support"** button with a heart icon — the same CTA pattern used in SH.MNT-WLB's
Personal variant. This reads as an **Employee Assistance Program referral nudge**: a small card
that surfaces when a person's (or org's) score in some area is low, inviting them to click through
to EAP/counseling support. The two variants differ only in tone/emphasis, not structure:

- `12599:9086`: bg `#feebee` (pale red/error-bg-subtle), copy **"Want help with low Psychological
  Health Scores?"** — a directly score-triggered nudge (explicitly names "Psychological Health"),
  button styled `theme="accent" variation="secondary"` (outlined accent pill, matches our `Button`
  component's `accent`/`secondary` table).
- `12599:9094`: bg `#cecdcc` (`T.gray100`, "surface-card-hover" per the Figma variable name —
  looks like a neutral/default or hover state rather than a second distinct card), copy
  **"Struggling or just want to be heard? Get support now."** — softer, less score-specific
  copy, button styled `theme="brand" variation="secondary"` (dark-outlined, not accent-colored).

**What to build**: new family `eap-service` (1x1). Given the copy explicitly references
"Psychological Health," trigger condition should be: when `dimensionValue("Psychological
Health")` (or a relevant driver like `Stress`/`Depression`/`Anxiety`) falls below some threshold
(e.g. `< 40`, matching our existing `band()` "poor" tier), show the pink/error variant with the
dimension-specific copy; otherwise show the neutral gray variant with generic copy. This is a
judgment call since the user didn't specify — document it as inferred, and flag to
product/design for confirmation before treating it as final behavior. The "Get Support" button
itself is presentational only (no real EAP link/destination exists anywhere in this app).

### SH.HTMP — Org Heat Map (brief, per explicit "we can ignore that one")

Node `12599:9364` (1x1, "Org Heat Map"). A small preview card: department rows (Customer Service,
Finance, HR, IT & Digital, …) × a few metric columns, each cell a **flat colored tile** (a
distinct heat-map palette — `#3ea372`/`#94ffdf`/`#c2ffef`/`#ffdeaa` for descending score bands,
**none of which exist in `T`** — a genuinely new 5-ish-step sequential palette, separate from our
existing status-triad and Graph/Dataviz palettes) with the score number inside, a bold summary
score per row in the leading column (colored via our normal `band()` status colors, not the heat
palette), and a "More" link at the bottom implying it opens a bigger full heat map elsewhere. Per
the user, deprioritized — no further effort spent here; revisit with its own audit pass if it
becomes wanted, including sourcing/confirming the full heat-map palette from Figma variables
before building.

---

## Summary: new tokens needed

| Token (suggested name) | Hex | Used by |
|---|---|---|
| `orgBlue` | `#20409a` | MNT-WLB (Org), TME-ADV (Org), TME-GAN |
| `teamBlue` reconciliation | `#0074bc` vs. existing `T.teamBlue` `#0096ec` | MNT-WLB (Team), TME-ADV (Team) — needs a design decision, not just a new token |
| `likertNeutralBg` / `likertBadBg` / `likertVeryBadBg` | `#fff1cf` / `#ffe3dc` / `#fcd7dd` | MNT-WLB (Personal) severity pills — text colors already match existing `amberStrong`/`redStrong` |
| Heat-map sequential palette (5 steps) | `#3ea372` / `#94ffdf` / `#c2ffef` / `#ffdeaa` / (a 5th, <70, not sampled) | SH.HTMP only — deprioritized |

No new tokens needed for the Index Widget — every color it uses already exists in `T` and matches
hex-for-hex.

## Summary: known data gaps (don't silently fake these)

1. **Index Widget 3x3's middle ring** needs individual survey-*item*-level scores (roughly 2 per
   driver) that don't exist in the generated dataset — dimension/driver aggregates aren't enough.
2. **Health Age** needs a chronological age or DOB field that doesn't exist anywhere in the
   dataset's demographics — the entire widget is unbuildable with real numbers until one is added.
3. **Mental Wellbeing**'s Team/Org "% of people reporting X" bars are a driver-score-based proxy
   for what's presumably meant to be a literal Likert-response percentage — flagged as an
   approximation, not a data gap per se (we do have the underlying driver scores).
