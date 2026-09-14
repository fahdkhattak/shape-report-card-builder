# SHAPE Widget Spec
> Design logic and rules reference — extracted from Figma roughwork spec sheet  
> This is background context, not a component spec. Use it to inform ideation, layout decisions, and copy on anything widget-related.

---

## What a Widget Is

A widget presents a single primary insight at a glance. Widgets always live within a Report Card and derive context from it. Primary interaction opens a Detailed View, which may appear as an in-app overlay (modal) or navigate to a related card.

---

## Widget Classifications

### Type A — Insight Widgets
**Purpose:** Communicate a measurable insight.  
**Core rule:** The Insight Section must answer a question about data.  
**Used for:** Scores, trends and comparisons, charts or visuals, analytical dashboards and reports.

### Type B — Content Widgets
**Purpose:** Communicate knowledge, instruction, or exploration.  
**Core rule:** The Insight Section presents instructional content, not data.  
**Used for:** Courses and lessons, tips and guidance, visual or video-based teaching, educator-created widgets.

### Type C — Question Widgets
**Purpose:** Collect structured responses.  
**Core rule:** The Insight Section captures user input, not output.  
**Used for:** Survey questions, quizzes and check-ins, assessments, interactive prompts.

---

## Widget Types

| # | Name | Description |
|---|---|---|
| 1 | Index Widget | Composite headline. Overall score + structural layers. |
| 2 | Metric Widget | Standalone values. |
| 3 | Chart Widget | Distribution, comparison, composition. |
| 4 | Graph Widget | Trend, movement, change over time. |
| 5 | List Insight Widget | Structured narrative insights. |
| 6 | Action Widgets | *(spec ongoing)* |

---

## Core Widget Anatomy

Every Insight Widget is built from up to five sections. Each section has a strict role.

---

### 1. Header Bar

**Role:** Tells the user what they are looking at before any data appears.

**Allowed content:** Title only — the one piece of information that defines context.

**Not allowed:** Values or scores, charts or visuals, trends or comparisons, explanations or conclusions.

**Behaviour rules:**
- Always present, regardless of widget size
- Header remains consistent across widgets

**Visual rules (global — apply to all widgets):**
- Header height: **32px**
- Font: **IBM Plex Sans Medium**
- Font size: **11pt**
- Colour: *(defined in font system — Utility Gray 300)*
- Left align always

**Validation check:**  
*If I hide everything below it, the user still knows what the widget is about, but not what the result is. If it reveals the result, it's doing too much.*

---

### 2. Insight Section

**Role:** Delivers the primary insight in one glance. Must be understandable in under three seconds.

**Allowed content:** One dominant element only — Score, Status state, Chart, Trend, Distribution, Ranked list, or Data-encoded visual. *(Insight visuals must use one of the approved core chart types defined in the Standard Visual Analytics framework.)*

**Not allowed:** Multiple primary insights, competing visual systems, long explanations, calls to action.

**Behaviour rules:**
- One primary insight per widget
- Visual hierarchy must clearly indicate what matters most
- Always visible, regardless of widget size

**Visual rules:**
- Highest visual priority in the widget
- Strongest visual weight (size, colour, or emphasis)
- Secondary elements must step back clearly

**Validation check:**  
*If I glance at this section, I immediately understand the result, without reading anything else. If understanding requires explanation, the insight is not clear enough.*

---

### 3. Evidence Section

**Role:** Answers "based on what?" without competing with the Insight Section. Exists to build confidence and credibility, not to introduce new meaning or conclusions.

**Allowed content:** Only content that supports or contextualises the primary insight. May include: distributions or breakdowns of the primary metric, benchmarks or thresholds used to determine status, comparators directly tied to the same metric, supporting metrics that explain composition not performance, sample size, coverage, or participation context.

**Not allowed:** New insights or alternative conclusions, primary results or headline metrics, visuals that compete for attention with the Insight Section, calls to action, charts and graphs *(these must be in the Insight Section)*.

**Behaviour rules:**
- Never required to understand the Insight Section
- Never visually dominates the Insight Section
- Must be removable without breaking comprehension

**Visual rules:**
- Lower visual priority than the Insight Section
- Reduced contrast, scale, and emphasis
- Clear spatial separation from the Insight Section

**Validation check:**  
*If I hide this section, the primary insight still makes sense, but I lose confidence and detail. If removing it changes the meaning, it's doing too much.*

---

### 4. Action Bar

**Role:** Provides access to additional actions and links related to the widget.

**Function:** When used, the viewer is offered two options — Open details (in-app detailed view) or Open link (external page or support resource). Allows the user to explore the insight further inside the system or move to a related external destination.

**Allowed content:** Only actions that extend the widget experience.  
Examples: Support page, Help resource, Related documentation, External report, Reference link.  
All links must be relevant to the widget's insight.

**Not allowed:** Primary insights or results, explanations or interpretations, mandatory actions, anything required to understand the widget.

**Behaviour rules:**
- Optional
- Appears only when additional actions are available
- Selecting the Action Bar always shows: Open details, Open link
- Widget's main interaction remains unchanged

**Visual rules:**
- Lowest visual priority in the widget
- Clear separation from Evidence and Insight Sections
- Subtle styling (text link, icon, or lightweight button)

**Validation check:**  
*If I remove this section, the widget still makes sense. I only lose quick access to links and details. If removing it breaks understanding, it's doing too much.*

---

### 5. Widget Control Menu

**Role:** Provides contextual controls for managing a widget within a card. Supports configuration and organisation. Never affects the meaning of the insight.

**Trigger:** Appears on hover over the widget. Accessed via the overflow (···) icon. Hidden by default. No permanent visual presence.

**Allowed content — system-level management actions only:**  
Pin, Edit, Hide, Remove, Duplicate (if enabled later), Edit widgets.  
All actions affect the widget container, not the data. *(NEEDS TO FINALISE)*

**Not allowed:** Insight explanations, data interpretation, support actions, primary navigation, reporting actions.

**Behaviour rules:**
- Always secondary to content
- Never opens automatically
- Requires deliberate user action

**Visual rules:**
- Appears only on hover / focus
- Minimal surface
- Neutral styling
- No brand emphasis
- Clear separation from content

**Validation check:**  
*If I never open it, the report still works perfectly. I only lose personalisation and management options. If it is required for understanding, it is wrongly placed.*

---

## Supported Sizes & Layout

### 1×1 — Size: 164 × 164px
Fast signal. Scan-level insight.

**Section eligibility:**
- Header bar: **Required**
- Insight Section: **Required**
- Evidence Section: **Not allowed**
- Action bar: **Optional (icon or single line only)**

**Hard rule:** A 1×1 widget must communicate the insight without explanation. If Evidence is required, the widget is too small.

---

### 2×2 — Size: 344 × 344px
Decision support. Explanation allowed.

**Section eligibility:**
- Header bar: **Required**
- Insight Section: **Required**
- Evidence Section: **Allowed**
- Action bar: **Optional**

**Hard rule:** Evidence may add confidence, but must never replace clarity.

---

### Layout Options for the Insight Section

**Full Insight Layout** — The insight section is used as a single full area to present a primary insight clearly and prominently. Primary insight fills the entire section.

**Split Insight Layout** — The insight section is divided into two parts:
- Primary Insight: Height Auto, Alignment middle-left
- Sub-Insight: Height 24px, Internal gap 8px, Alignment bottom-left

---

## Global Widget Rules

These apply to all Insight Widget instances, regardless of size or content type.

- Widget padding (horizontal & vertical): **16px**
- Gap between widget sections: **12px**
- Corner radius: **18px**
- Minimum font size: **11pt**

---

## Non-Negotiable Rules (Ruleset)

### Rule 1: One Insight Rule
A widget only answers one primary question. If it answers two, it must be split.

### Rule 2: Sections Integrity
- **Header bar** never explains
- **Insight section** never justifies
- **Evidence Section** never leads
- **Action bar** never rescues clarity

*If content feels misplaced, it probably is.*

### Rule 3: Size Never Changes Meaning
Reducing size may: remove Evidence, simplify visuals, hide Actions.  
It must never: change the insight, introduce ambiguity, require a click to understand the **core** message.

### Rule 4: Visual Consistency Across Data Types
A score, chart, or status all live in the Insight Surface. Data type changes visuals. It does not change structure.

### Rule 5: Escalation Increases Information, Not Decoration
When a widget scales from 1×1 to 2×2: visual structure stays identical, decorative elements do not change, layout logic remains consistent, only informational depth increases.  
- 1×1 → Fast signal  
- 2×2 → Signal + explanation

---

## Layout Ruleset

### Global (all sizes)
- **Header bar is always on top** — full width, never moves, never splits
- **Insight Section is always visually dominant** — largest visual weight, first thing the eye lands on
- **Evidence and Action are subordinate** — they adapt to space, they never interrupt Insight

---

## Trend Indicator (Shared Across All Widget Types and Sizes)

### Data Logic
- Compares latest measured point with immediately previous measured point
- Delta = Latest minus Previous
- Positive = Up state, Negative = Down state, Zero = Neutral state

**Rules:**
- Must reference actual measured values only
- Cannot imply forecast
- Cannot extend past last measured point
- Hidden if fewer than 2 data points

### Visual Spec
**Container:** Pill shape, height 20px, corner radius = half of container height, horizontal gap 4px, padding H:8px V:6px, auto layout horizontal (icon left, text right).

**Icon:** Arrow shape, 8×8px, vertically centred. Up = Positive, Down = Negative, Dash/no arrow = Neutral.

**Text:** Format "+9 since the last survey", font size 11pt. Description text Regular, delta value Semibold. Truncate if exceeds container width.

**Colours:**  
- Positive: bg-success-primary / text-success-primary (500)  
- Negative: bg-error-primary / text-error-primary (500)  
- Neutral: utility-grey-50 / utility-grey-500  
- Contrast must meet accessibility ratio.

### Behaviour Scaling
- **1×1:** Icon only
- **2×2:** Icon + Delta Value + time indication text

---

## Status Pills (Shared Across All Widget Types and Sizes)

**Types:** Text Only, Icon + Text

### Text Only Pill
Pill shape, height 20px, corner radius = half height, padding L:8 R:8 T:6 B:6, auto layout horizontal.

**Text:** 11pt, Bold, cap height to baseline, truncate if exceeds width, center aligned.

**Colours:** Use semantic colours when available.  
- Positive: bg-success-primary / text-success-primary (500)  
- Negative: bg-error-primary / text-error-primary (500)  
- Neutral: utility-grey-50 / utility-grey-500

**Behaviour Scaling:** Pill structure and height remain fixed. Container hugs text width. Text may truncate in smaller containers, expands in larger ones.

### Icon + Text Pill
Pill shape, height 20px, padding L:0 R:8 T:6 B:6, horizontal gap 4px, auto layout horizontal (icon left, text right).

**Icon:** Circle shape, 20×20px, vertically centred.

**Text:** 11pt, Bold, cap height to baseline, truncate if exceeds width.

**Colours:** Use semantic colours.  
- Positive: bg-success-primary / text-success-primary (500)  
- Negative: bg-error-primary / text-error-primary (500)  
- Neutral: utility-warning-50 / utility-warning-500

**Examples:** Flourishing (green circle), Striving (amber circle), Struggling (red circle)

---

## Font System (Widget-Specific)

**Font:** IBM Plex Sans only  
**Allowed weights:** Regular, Medium, Bold  
**Not allowed:** Thin, Light, Italic, Underline, Mixed families, No primary black allowed  
**Letter spacing:** 1%  
**Case:** Uppercase (content rule)  
Weight must be used intentionally to define hierarchy. Random emphasis changes are not allowed.

### Typographic Role System
Each text element must be assigned exactly one role. No two roles allowed.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Header Label (Eyebrow) | 11pt | Medium | Uppercase, max 2 lines in 1×1, truncate on overflow, no semantic colour overrides |
| Primary Metric – Display | 18pt | Bold | Auto line height, letter spacing 0. Use: index-level or collective summary. Examples: Org Score, Explorer Score |
| Primary Metric – Standard | 14pt | Bold | Auto line height, letter spacing 0. Use: single insight score. Examples: ENPS Score, Time Impact, Area to Focus |
| Primary Metric – Dense | 16pt | Bold | Auto line height, letter spacing 0. Use: composite or structured metric, string or multi-part values. Examples: Health age, Benchmark |
| Primary Metric – Compact | 13pt | Bold (700) | Auto line height, letter spacing 0. Use: metric inside graphical container (ring or constrained module). Example: Single Explorer score with Ring |
| Metric Unit | 11pt | Regular | Baseline aligned with metric. Currency symbol attaches directly. Measurement units use space before unit. Units lowercase. |
| Status Metric – Primary | 20pt | Bold | Auto line height, letter spacing 0, baseline aligned with metric. Use: categorical state output. Examples: Flourishing, Striving, Struggling |
| Status Metric – Secondary | 11pt | Bold | Auto line height, letter spacing 0, baseline aligned with metric. Use: severity or intensity level. Examples: Moderate, Severe, Extremely Severe. Rule: must not compete with Primary Metric. |
| Supporting Text – Standard | 11pt | Regular | Auto line height, letter spacing 0, baseline aligned with metric. Use: comparative context, dates. Examples: per annum, compared to last year, DEC 10, 2022 |
| Label – Category (large) | 13pt | Bold | Auto line height, letter spacing 0, baseline aligned. Use: make divisions between items. Examples: Good, Average, Poor. Rules: one line, truncate if overflow. |
| Label – Category (small) | 11pt | Regular | Auto line height, letter spacing 0, baseline aligned. Use: chart labels, list items, axis labels. Rules: max two lines, truncate if overflow. |
| Label – Value Large | 14pt | Bold | Auto line height, letter spacing 0, baseline aligned. Use: comparative numeric values in lists or charts. Rule: greater emphasis than Category Label, right aligned in row layouts. Never truncate. |
| Label – Value Small | 13pt | Bold | Auto line height, letter spacing 0, baseline aligned. Use: comparative numeric values in lists or charts. Rule: greater emphasis than Category Label. |

---

## Section-Based Colour Mapping

### 1. Header Section
All text inside Header Section → **utility-grey-300**. No semantic colours allowed. No primary black allowed.

### 2. Insight Section
**Default colour:** text-primary (900)  
**Override:** If semantic colour is active, semantic overrides default.

**Sub-role colour adjustments:**  
- Chart bars = semantic or neutral as defined in chart rules  
- Data labels inside charts = text-quaternary (300)  
- Category labels in charts = text-quaternary (300)  
- Axis labels = text-quaternary (300)

### 3. Evidence Section
**Default colour:** text-tertiary (400)  
**Override:** If semantic colour is active, semantic overrides default.  
Applies to: Supporting Caption, Secondary numeric values, Comparative references.

### 4. Action Bar
**Default colour:** text-primary (900)  
**Override:** If semantic button style is active, semantic overrides default.
