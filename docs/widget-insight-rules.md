# Insight widget rules — Index, Graph and Chart

Read off the Figma specification boards (file `984qJvMt7fCHASYHRwgrab`): **Index Widget** `9158:28363`, **Graph Insight Widget**
`9158:28146`, **Chart Insight Widget** `9158:22652`. These boards are rules, not mock-ups: the numbers below (limits, sizes, when
a widget must grow or give way to a modal) are what the widgets are built to. The example frames on the boards "are not a
source of truth"; where an example disagrees with a rule, the rule wins. Widget = `1x1` (164px) or `2x2` (344px), 16px padding,
so the content box is 132px (1x1) or 312px (2x2) wide.

Every Insight widget is one vertical layout: **Header bar** (context only, upper-case 11px) · **Insight section** (the chart is the
insight) · **Evidence section** (2x2 and bigger only, when there is vertical room) · **Action bar** (optional, navigation only).
No decorative visuals, no icons that imply meaning, no text that interprets the chart, no mixed chart types in one widget.
"Modal" below means the detailed view of the widget; the widget itself never scrolls.

---
## 1. Index widget (radial composite)

**Purpose:** one headline composite score at the centre; surrounding rings explain it structurally (not by distribution).
Use when the question is "how are we doing overall, where is strength and weakness concentrated, how do the main areas contribute".
Do not use for a single standalone value, no composite score, time progression, or category ranking.

**Structure.** Centre = overall index score. Inner ring = group segments. Outer ring = sub-group segments (3x3 only). Outer rim =
semantic colour of the last visible level. Segments are equal-sized radial slices (360° ÷ n); size never represents the score.
Segments are separated by a **1px white divider**, no gap between rings, ring thickness is the same for each ring. Scores are
shown only as a number and a semantic colour.

**Colour.** Score text uses the status system token. Segment fill: Level 1 (parent / only ring) `bg-success-primary #E1F5EA`,
`bg-warning-primary #FFF6E4`, `bg-error-primary #FCE3E7`; Level 2 (child ring) the secondary tints `#D3F2E3`, `#FFF1CF`, `#FCD7DD`.
(The secondary tints are not in `docs/shape-design-system-v4.md`; they are constants in `RingIndex.jsx`.)

**Content placement.** Text sits in a radial safe zone, 2px padding from the segment edge, on the segment's radial centre line.
Inside the segment the **label is in the outer half** (horizontal, truncated with an ellipsis if space is limited) and the **score is
in the inner half**, nearer the centre. When the label is hidden the score moves to the centre of the segment area.

**2x2 (one level).** Segments 2 to 20, recommended up to 12 (beyond 12 labels are unreadable in the arc).
- ≤ 12 segments: labels and scores visible.
- 13 to 20: labels hidden, scores visible, hover/tap reveals the label.
- More than 20: detail moves to the modal.
- Label truncation: arc width fits the full label → render it; not enough → truncate with an ellipsis; can't fit even a truncated label →
  hide it. The full label is always available on hover/tap.
- Escalation: if deeper detail is needed → 3x3 Index or the modal.

**3x3 (two levels).** Parent segments (level 1) 2 to 12, recommended 6 to 12; parents show their label inside the inner ring.
Child segments (level 2) at least 3 (at least one parent must split), up to 25 labels, subject to arc width; **child labels sit outside
the donut**, anchored at the child's mid-angle on a 1px neutral connector from the rim; right-side labels are left-aligned,
left-side labels right-aligned; labels truncate with an ellipsis (e.g. "Management → Manag…"); full label on hover.
- Children must sit entirely inside their parent's arc and are distributed only within it; a child never crosses parents.
- **Minimum readable segment angle: 12°.** A child below 12° hides its score but stays visible as a colour segment; hover/tap applies
  to the whole child group under that parent and reveals all its child labels and scores.
- More than 12 parents → the 3x3 is not rendered, go to the modal. More than 25 children → the extra segments appear in the modal.
- Density: labels render only when spacing allows; hidden labels are revealed by hover; hovering a label highlights its segment.
- Priority is readability over density: when density prevents clear numbers or labels, numbers are hidden, group hover is used and the
  modal gives full detail.

**Interaction.** Hover/tap on a segment shows a tooltip: full label, the change since the last round (pill) and the score, with a
status-coloured rail. Interaction stays available when labels are hidden.

---
## 2. Graph insight widget (change over time)

**Purpose:** communicates change over time through one continuous progression. The graph is the insight; it is never decorative.
Use for "is it improving or declining, when did it change, how stable is it". Don't use for a single score, one time point, distribution
across categories, or ranking between groups (use the Metric or Chart widget).

**Governance.** (1) Declare the time unit (Round, Month, Quarter, Year) and the direction; time moves one way (left to right), unordered
timelines are not allowed. (2) At least 2 points, all the same measure and unit. (3) One primary measure: one line, or several lines only
to compare the *same* measure across groups; no unrelated measures, no dual axis. (4) A snapshot of measured progression only: no
causation, no forecasts or projections; a direction indicator is allowed only when derived from two measured points and must not imply
continuation. (5) Visual integrity: left to right, no inverted axes, no exaggerated scaling, honest baseline. (6) No legend, reference or
annotation may overpower the chart. (7) **Escalation (system controlled, no override):** 1x1 = 2 to 3 points, 1 group; more than 3 points or
more than 1 group → auto 2x2. 2x2 = 2 to 7 points, up to 3 groups; more than 7 points or more than 3 groups → Detailed view.

**Allowed types.** Line (primary); area only when accumulating magnitude matters; multi-line (same measure across groups); indexed line
(base 100). Optional reference elements (structural, never interpretive): one benchmark line (horizontal, dashed or muted), an average
line (system-calculated), a threshold boundary (if explicitly defined); same unit as the measure, at most one per widget. Not allowed:
3D lines, decorative curves or smoothing, several competing benchmarks, a moving benchmark.

**Specification.**
- Graph fills the full width of the insight section; time left to right; x-axis at the bottom, y-axis at the left; straight segments;
  scale **fixed 0 to 100**. Minimum graph height 80px (1x1) and 160px (2x2) including its internal top/bottom padding; it excludes the title,
  change badge and evidence text and never shrinks below that.
- Y axis: 28px vertical distance between adjacent intervals; 1px full-width gridlines in `border/primary`, no vertical gridlines;
  tick labels 11px Regular `text/quaternary`, 6px gap from the line start, always linear. **1x1: ticks 0, 50, 100. 2x2: 0, 20, 40, 60, 80, 100.**
- X labels: 11px Medium `text/quaternary`, centred under each point, 10px under the graph; max 3 (1x1) / 7 (2x2). First and last points inset 8px
  from the graph edges; equal horizontal distribution.
- Line: 1px stroke, primary accent colour, straight joins, round caps. Markers: circle, 8px, same fill as the line, 1px `fg-white` border.
- Direction / change indicator (optional): the platform trend pill ("▲ +9 since the last survey" at 2x2; caret only at 1x1); references two
  measured points, never implies the future, never extends past the last measured point.
- Benchmark line (optional): horizontal, 2px stroke, dash 6 / gap 3, `utility-success-50` for positive, `utility-error-50` for negative; label 10px,
  left-aligned with the left edge of the gridlines, 6px above the line; one per widget.
- Evidence section (only when vertical space allows): below the graph, max 2 lines (3 on larger widgets), 14px, line height 1.4, highlight values bold and
  coloured, 16px from the graph. No causation, no projection language. e.g. "After dipping in R3, Your Score increased by **+9 points**, reaching **83** in the latest round."

---
## 3. Chart insight widget (relationship across categories)

**Purpose:** one primary insight through visual relationships. Use when the insight depends on comparison across categories, distribution,
composition or balance ("how do these compare / how is this split"), and pattern matters more than exact values. Don't use for a single score,
when one value should dominate, when ranking/ordered scanning is the task, or when precision matters more than pattern.

**Governance.** (1) **Declare exactly one Primary Type: Composition or Comparison**; never mix their logic. (2) A single snapshot: no time series; history may appear
only as a secondary trend indicator (a full trend uses the Graph widget). (3) At least 2 categories, all from one dataset, no unrelated measures. (4) *Composition*: values are
parts of a whole, total = 100% (or the full aggregate), no ranking emphasis, no emphasis on a dominant segment (a text summary of the largest segment is allowed as context);
allowed structures: donut, stacked bar, compact grid. (5) *Comparison*: two or more categories, same unit, no winner styling, no judgment language, no trend arrows; allowed
structures: horizontal bars, grouped bars, matrix comparison. (6) Escalation: if the category count passes the visual-clarity limit, 1x1 is not permitted → 2x2, or the modal.
(7) No legend, reference or annotation may overpower the chart.

### Donut (Composition)
- Built in a fixed square frame (W = H), centre anchored; inner radius ratio 70 (1x1) / 81 (2x2); the ring's thickness comes only from that ratio, not from category count.
  Slices are mutually exclusive and sum to 100%; no exploded slices, no winner styling; **start angle fixed (12 o'clock) across all donuts**.
- Centre (optional, choose one): empty / icon only / icon + short label (2x2 and bigger). Label 11px Bold, icon 20×20, 6px apart. The centre never competes with the ring (no big numbers).
- Callout (e.g. Largest Group): two lines only, both 11px Regular `text/tertiary`; line 1 the descriptor ("Largest Group", "Total Group", "Smallest Group"), line 2 `Category (Value%)`, no bolding, no wrapping of the number.
- Legend (optional): a 2px × 12px solid rail in the slice's colour + a single-line 11px Regular `text/tertiary` label (ellipsis allowed, no wrapping, no scaling). Show it only when it stays readable
  without wrapping; otherwise drop it and keep the callout. If no legend is required, the callout under the chart is the default.
- 1x1: min 2 categories; **no legend: max 7; with legend: max 4** (two columns); beyond that → 2x2 or modal. Variants: with legend / without legend / with icon.
- 2x2: insight only = ring + three callouts (Total / Largest / Smallest group); insight + evidence = ring + legend (3 columns). Up to 15 categories; more than 15 → modal.
- Line height is 100% of font size; legends and chart labels never clip.

### Horizontal bars (Comparison)
- Category column: min 50px, max 100px, never more than 45% of the chart width; all rows share the same width, computed before the bars render; long labels truncate with an ellipsis.
- Bars: height 8px, ends rounded (radius 4), min visible length 2, 12px between bars, a common start baseline.
- Value labels (optional): right of the bar end, 6px gap, bold 11px in the bar's colour; value area fixed max 48px (1x1) / 64px (2x2), at most 20% of the chart width; max 4 visible characters,
  large numbers abbreviated (1K, 1.2M); no wrapping, scaling or truncation. If value labels are off, bars use the full width.
- Scale: use the metric's fixed range if it has one; else 0–100 for percentages; else start at 0 and round the max up. 0 is a solid baseline, 100 aligns with the chart edge, dashed gridlines
  (1x1: 4 divisions of 25; 2x2: 5 divisions of 20), only the min and max labelled by default.
- Category labels 11px Regular `text/tertiary`; never bold a category because it is highest. Line height 1.0.
- Limits: **1x1: 2 to 5 categories** (more → 2x2 or modal); **2x2 insight only: up to 13** (more → modal); **2x2 with evidence: 2 to 9** (more → modal).

### Compact grid (Composition, tiles)
- Default 2 columns; 3 columns in a high-density 2x2; categories fill left to right and wrap; fixed 6px gutter; columns distribute evenly, no resizing by value; tiles share identical size.
- Tile (default height 40px): 2px left rail (the category colour, neutral by default), left padding 6px, category label 11px Regular `text/secondary` on one line (ellipsis), value 16px Bold `text/primary` below it, 6px apart.
  No ranking, emphasis or sorting implied by position. Under the grid, an 8px segmented proportion bar of the same colours (full width).
- Limits: **1x1 max 4 categories** (more → 2x2 or modal); 2x2 up to 12 in 2 columns × 6 rows, up to 18 in 3 columns × 6 rows; more than 18 → modal. No scroll inside the widget.

### Treemap (Composition)
- Value-proportional rectangular tiles filling the whole insight section; no column-grid logic; deterministic tiling (largest first, the rest fill the remaining space in descending order); 4px gap.
  Large values are dominant tiles, small values stack in the remaining space; tile size is fluid and data-driven; no positional ranking implied.
- Tile: category name upper-case top-left, value bold bottom-left. Limits: **1x1 exactly 3 categories; 2x2 3 to 7**; beyond that → modal.

### Vertical bars (Comparison)
- Use for comparing categories with exact values, single snapshot. At least 2 categories, same unit, mutually exclusive. **Declare the order**: neutral (a natural order: age bands, departments)
  or ranked (high→low) only when ranking is the point; never reorder dynamically without explanation.
- Common zero baseline, no truncated axes, no 3D, consistent bar thickness (8px), min visible height 2px, top corners rounded, no winner styling, value labels support rather than dominate.
- Y axis 24px wide at the left, 0–100, 1px `border/primary` dashed gridlines, tick labels right-aligned; 8px between the axis and the bars; bars grow bottom to top, a 2px gap between bars in a group.
- Plain = single colour; stacked = each segment a palette colour; grouped (groups of 2 to 5) = a distinct colour per series.
- Limits: **1x1: 2 to 4 categories** (more → 2x2 or modal); **2x2: 5 to 10** (with evidence 2 to 10); more than 10 → modal.

### Which structure for which question (Demographics, Money and Time)
- Context (composition), 1x1: ≤ 4 categories → compact grid + bar, or donut; 5 to 7 → donut only (with the Largest Group callout); more than 7 → not allowed in 1x1, escalate to 2x2.
- Comparison, 1x1: 2 to 4 categories → bar comparison; 5 or more → not allowed in 1x1, escalate to 2x2.
- Money / time composition 1x1: tiles with `$26K` / `19 hrs` values over a proportion bar, or a donut with a two-column legend.
- Popular responses: treemap. Org heat map: matrix comparison.
