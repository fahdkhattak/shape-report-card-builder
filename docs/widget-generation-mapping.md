# Widget Generation Mapping
> How the engine decides which widget(s) to build — guided path and manual/chat path
> Draft for Day 1–2 alignment with Ahsan (build) and Omer (data)
> **Revised:** corrected data-scope logic per Fahd — Guided and Direct Construction do not share the same data-narrowing behavior (see Step 0).

---

## Principle

The engine doesn't map to widgets based on what the user *said* — it maps based on the **shape of the data** once drivers + insight type are known. This keeps it deterministic, per the brief. Words are just the input that determines shape.

Every widget produced must still obey the canonical ruleset (Header / Insight / Evidence / Action / Control) — new widget types are new *instances* of that anatomy, not new rules.

---

## Step 0 — Data scope: the real fork between the two paths

This was wrong in the original draft of this doc — the two paths do **not** share the same driver-narrowing logic. The fork happens here, before Step 1, and it's about scope, not widget type:

| Path | Default data scope |
|---|---|
| **Guided (mascot)** | Narrowed to the confirmed driver set from the conversation (mascot decision tree, Node 2–4) |
| **Direct Construction, Library-sourced** | **Full org-wide dataset**, no narrowing. A "Your Score" widget dragged from the Library pulls the entire org's data by default. |
| **Direct Construction, chat-generated** | Narrowed *if the prompt says so* (e.g. "narrow this to just these two topics"). Scoping only happens through chat — there's no filter control on a Library-dragged widget itself. |

So the same widget type (say, Metric) can be full-org or narrow-scoped depending entirely on *how it was created* — not on anything about the widget itself. Step 1 onward (data shape → widget type) applies identically regardless of scope; scope is a data-query parameter, not a mapping input.

---

## Step 1 — Classify the data shape

Before picking a widget, the engine answers three questions:

| Question | Possible answers |
|---|---|
| **How many drivers?** | 1 / few (2–5) / many (6+) |
| **What's the output form?** | single value · comparison across items · distribution · change over time · relationship between two variables · categorical/location |
| **Is there history to show?** | yes (multiple survey waves) / no (single wave only) |

This is a lookup, not a judgment call — Omer's data lead role here is making sure driver metadata (count, wave history, value type) is available for the engine to query.

---

## Step 2 — Map shape to widget type

| Data shape | Widget type | Why |
|---|---|---|
| 1 driver, single value | **Metric Widget** | Standalone value — no composition needed |
| Multiple drivers aggregated into one score | **Index Widget** | Composite headline + structural layers is exactly what Index is for |
| Comparison across 2–5 items | **Chart Widget** | Distribution/comparison is Chart's defined purpose |
| Ranked or narrative list across 6+ items | **List Insight Widget** | Structured narrative insight — built for volume Chart isn't |
| Change over time (2+ waves available) | **Graph Widget** | Trend/movement is Graph's exclusive job |
| No history available, trend requested | *(blocked)* | Trend Indicator rules require ≥2 measured points — fall back to Metric with a note, don't fake a trend |
| Relationship between two variables | **Scattergram** *(new)* | Correlation isn't covered by existing 5 types — build within ruleset |
| Categorical/location-based | **Map** *(new)* | Same — genuinely new shape, not a variant of existing ones |

This table *is* the deterministic engine, in effect — Ahsan can implement it close to literally.

---

## Step 3 — Decide widget size (1×1 vs 2×2)

Per the Widget Spec's size rules:

- **1×1** if the insight stands alone and doesn't need Evidence (no benchmark, no breakdown, no sample-size context)
- **2×2** if the story needs an Evidence Section to build confidence (comparators, benchmarks, sample size)

Rule of thumb for the engine: **single driver, no comparison → 1×1. Anything aggregated or compared → 2×2.**

---

## Step 3.5 — Library-sourced widgets (Direct Construction, non-chat)

Not previously covered in this doc. When a widget is dragged from the Library (not generated via chat), there's no data-shape classification step to run — the Library already stores **pre-built forms per widget family**, each a fixed size/composition. Dragging "Your Score" doesn't invoke Steps 1–3; it places a known, pre-existing form at full org scope (see Step 0).

This is why "Change Widget" (see `widget-editing-and-variants.md`) is a same-family swap, not a regeneration — it's picking a different pre-built form of the same concept, not re-running the mapping engine.

---

## Step 4 — Guided path: insight type → this mapping

Ties back to the mascot decision tree:

| Mascot insight type | Typical data shape | Resulting widget |
|---|---|---|
| Overall score | 1 driver or aggregated set | Metric or Index |
| Driver breakdown | Comparison across confirmed drivers | Chart or List Insight (by count, per Step 2) |
| Trends over time | Same drivers, historical | Graph |
| Surprise me | Engine tests for correlation/categorical shape | Scattergram, Map, or a novel type — falls back to List Insight highlighting outliers if nothing fits |

---

## Step 5 — Manual/chat path: generating variants

When a user types a prompt in chat (e.g. "show me team engagement"), the engine should **not** produce 3 versions of the same widget type. It should produce 1–3 *type* variants that all satisfy the request differently:

**Example — "show me team engagement":**
1. **Metric Widget** — single engagement score, fastest read
2. **Chart Widget** — engagement compared across teams
3. **List Insight Widget** — ranked narrative of contributing drivers

The user picks or regenerates. Each pick is a signal stored against that prompt pattern, so repeat/similar prompts bias toward the previously chosen type — this is the "memory" piece you described, and it's a straightforward preference-weighting layer on top of Step 2's table, not a separate system.

**Regenerate** should vary the *data cut or driver combination*, not just re-roll the same three types — otherwise regeneration feels random rather than useful.

---

## When the engine builds a genuinely new widget type

Only when Step 2's table has no fit (relationship or categorical shape today; more may emerge). Guardrails:

- Must still be built from Header / Insight / Evidence / Action / Control anatomy
- Must pass the One Insight Rule — one question answered, not two
- Should be treated as an addition to the canonical set going forward, not a one-off — once Scattergram or Map exists, it goes back into the Step 2 table

---

## Open questions to raise with Ahsan / Omer / Jasir

1. **Where does this table live?** As config Jasir's engine reads, or hardcoded logic? Config makes the widget set easier to extend post-prototype.
2. **Aggregation rule for Index** — when multiple drivers roll into one score, is the weighting equal, or does Omer's data model already define weights per driver?
3. **Preference memory scope** — per user, per team, or global across SHAPE? Affects how fast "better generated widgets" actually shows up.
4. **Fallback tone** — when trend is blocked (no history) or surprise-me finds nothing, what does the mascot/chat actually say? Worth scripting 2–3 lines now so it doesn't get improvised on Day 4 in front of the SRO tester.
