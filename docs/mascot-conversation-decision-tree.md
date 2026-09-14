# Mascot Conversation — Decision Tree
> Guided "Create" path — AI-Centred Report Card Builder
> Draft for Day 1 alignment with Ahsan (build) + Omer (data)

---

## Design principle

The conversation has one job: turn a vague human topic into a **confirmed driver set + insight type**, deterministically enough that widget generation is predictable. Every question is multi-choice. No open text after the first prompt.

---

## Node 0 — Entry

**Mascot:** "What would you like to report on?"

- Input: free text or voice, one open field, no other choice needed
- No validation here — anything goes to Node 1

---

## Node 1 — Topic Recognition

AI parses the input and matches it against tagged macro-category + dimension data (Personal / People / Org and their topic areas).

```
Input parsed
   │
   ├── Single clear match ──────────────► Node 2 (Driver Suggestion)
   │
   ├── Multiple plausible matches ──────► Node 1a (Disambiguate)
   │
   └── No confident match ──────────────► Node 1b (Fallback)
```

**Node 1a — Disambiguate**
**Mascot:** "Did you mean [Topic A] or [Topic B]?"
- Multi-choice, 2–3 options pulled from the closest matches
- Selecting one → Node 2

**Node 1b — Fallback**
**Mascot:** "I couldn't quite place that — pick the closest area:"
- Multi-choice: the three macro-categories (Personal / People / Org)
- Selecting one → shows that category's dimensions as multi-choice → Node 2

*This is the node that depends on Omer's driver-tagging work. If topics aren't reliably tagged to drivers, this whole branch degrades to Node 1b by default — worth stress-testing Day 1.*

---

## Node 2 — Driver Suggestion

**Mascot:** "Here's what I'd measure for [Topic]:"

- Shows the **matched drivers**, pre-selected, as a checklist (not free text)
- Below that: **"These could also be relevant — include?"** — adjacent/related drivers, shown unchecked
- User toggles any on/off

```
User reviews checklist
   │
   ├── Confirms as-is ──────────────────► Node 3
   ├── Adds/removes drivers ────────────► Node 3
   └── "None of these fit" ─────────────► back to Node 1b
```

---

## Node 3 — Anything Else?

**Mascot:** "Anything else you're concerned about?"

- Multi-choice: **Add another topic** / **No, that's everything**
- "Add another topic" → loops back to Node 0 input, results merge into the same driver set
- "No" → Node 4

---

## Node 4 — Insight Type

**Mascot:** "What do you want to see?"

- Multi-select, multi-choice:
  - **Overall score**
  - **Driver breakdown**
  - **Trends over time**
  - **Surprise me**
- User can pick more than one; each maps to a widget category (see below)

*"Surprise me" is the one non-deterministic branch — flag as Day 3–4 stretch, not part of the thin slice, per the brief's deterministic-first constraint.*

---

## Node 5 — Generation

Deterministic mapping from (driver set × insight type) → widget selection:

| Insight type | Widget type |
|---|---|
| Overall score | Index or Metric Widget |
| Driver breakdown | List Insight or Chart Widget |
| Trends over time | Graph Widget |
| Surprise me | AI selects/builds a new widget type within the canonical ruleset (e.g. scattergram) |

- Engine pulls seeded data for the confirmed drivers
- Assembles v1 report card, coherent story across widgets

---

## Node 6 — Handoff to Canvas

Same exit point as the manual path: live, editable canvas. Add / remove / reorder widgets. Chat remains available for further widget generation (1–3 variants per request, per the manual-path pattern).

---

## Open questions to raise Day 1

1. **Driver tagging** — does Omer's dataset already tag drivers to topic keywords, or does this need to be built? This is the single biggest risk to Node 1 working reliably.
2. **Merge logic** — when a user adds a second topic (Node 3 loop), how do overlapping drivers get deduplicated or weighted?
3. **Minimum data threshold** — with ~100 seeded responses, is there a floor below which a driver shouldn't be offered (too thin to report on)?
4. **"None of these fit" recovery** — how many times can a user bounce between Node 1b and Node 2 before this becomes a bad experience? Worth a soft cap or an escape hatch to manual canvas.
