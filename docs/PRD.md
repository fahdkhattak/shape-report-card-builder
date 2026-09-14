# PRD — AI-Centred Report Card Builder
> SHAPE 3.0 · Internal prototype
> Owner: Fahd (experience lead) · Dev lead: Ahsan · Data lead: Omer
> Sign-off: Amna · Sponsor: Ali · Orchestration support: Munim · Admin Panel guidance: Rafeh
> Status: Draft — circulating for informal alignment ahead of build

**Companion documents** (read alongside this PRD, not duplicated here):
- `mascot-conversation-decision-tree.md` — guided path conversation logic
- `widget-generation-mapping.md` — data shape → widget type engine, both paths
- `direct-construction-spec.md` — manual path workspace, grounded in Amna's Figma
- `widget-editing-and-variants.md` — Change Widget vs. Edit via Chat mechanics

---

## 1. Problem

Report-card creation today runs through Excel, PowerPoint, and Power BI — slow, specialist-dependent, and disconnected. Ideas pass through research, spreadsheets, slides, and BI tools before anyone can actually experience the report card. Two consequences:

- **Too much specialist knowledge required.** People can't create or test a report-card story without design, data, or reporting support.
- **Too little live learning.** Static concepts don't reveal whether widgets work together, respond to the same data, or tell a coherent story.

Since SHAPE's report-card and widget concepts were first formed, conversational, AI-native creation has become the norm elsewhere. SHAPE 3.0 should start from that standard rather than carrying yesterday's workflow forward.

---

## 2. Opportunity

Give the SRO team — and eventually anyone across SHAPE — a no-training way to construct proposed report cards on the fly, turning a plain-English request into a live, editable report card within minutes. This prototype proves the experience before approved report cards are operationalised through the Admin Panel.

---

## 3. Goals & success criteria

**The test:** without training, an SRO user can create and change a credible report card through either route.

**The evidence:**
- AI suggestions feel relevant
- Widget handling is clear
- Every score remains consistent (deterministic mapping holds under real use)

**The boundary — explicitly out of scope for this prototype:**
- Mobile
- Full widget coverage
- Power BI migration
- Admin operationalisation (publishing report cards live for clients)
- Production hardening

---

## 4. The core model

One tool — the **Report Canvas** — reached by two doors:

| | **Guided (mascot)** | **Direct Construction** |
|---|---|---|
| **Starting state** | Pre-populated — mascot builds a v1 from the conversation | Blank canvas |
| **Data scope default** | Narrowed to confirmed driver set from the conversation | Full org-wide dataset |
| **How it's built** | Conversational — mascot clarifies topic, drivers, insight type | Manual — drag from Library, or generate via chat |

Both doors lead to the **same workspace**: Library panel + Canvas + Chat panel, coexisting in one shell (see `direct-construction-spec.md`). From that point on, every capability — adding widgets, editing them, regenerating them — works identically regardless of which door the user came through.

---

## 5. End-to-end flows

### 5.1 Guided path

1. User states a topic in plain English (typed or voice)
2. Mascot identifies the topic, proposes a driver set, confirms/clarifies (multi-choice only — see decision tree for disambiguation and fallback branches)
3. Mascot asks what insight types are wanted (score / breakdown / trends / surprise me)
4. Engine generates v1 report card — widgets selected deterministically from data shape (see mapping doc), scoped to the confirmed drivers
5. User lands on the same Report Canvas as Direct Construction, now pre-populated, and refines from there

### 5.2 Direct Construction path

1. User lands directly on a blank Report Canvas
2. Adds widgets one of two ways:
   - **Drag from Library** — pre-built widget forms, organized by insight category, pulling full org-wide data by default
   - **Generate via chat** — describes what they want; engine returns 1–3 widget-type variants to pick from or regenerate (see mapping doc, Step 5)
3. Refines in place — reorder, remove, swap forms (Change Widget), or request AI edits (Edit via Chat) — see `widget-editing-and-variants.md`
4. Publish is out of scope for this prototype (see §3)

### 5.3 Shared refinement, either path

Once on the canvas, both paths converge completely:
- **Change Widget** — instant swap to a different pre-built form of the same widget family (e.g. Your Score 1×1 → 1×1 with status bar → 2×2). No AI involved, no draft step.
- **Edit via Chat** — reference a widget (drag into chat, or three-dot menu → Edit), describe the change, AI drafts a new instance inline in the chat thread with Replace / Regenerate controls. Original stays untouched on canvas until Replace is pressed.
- Canvas is free-flowing — no restriction on duplicate widgets.

---

## 6. Widget system

**Existing types** (built in Storybook): Index, Metric, Chart, Graph, List Insight.

**New types, built within the canonical ruleset:** Scattergram (specced and prototyped — see companion artifact), Map, and others as data shape demands. Every widget — existing or new — is built from the same anatomy: Header / Insight / Evidence / Action Bar / Widget Control Menu (see SHAPE Widget Spec).

**Sizes:** 1×1 and 2×2 are general-purpose. 3×3 exists specifically for Index-type composite widgets (confirmed against Amna's Figma; not yet formally added to the Widget Spec document — open action item).

**Widget selection is deterministic**, mapped from data shape (driver count, output form, history availability) to widget type — not from literal user wording. Full logic in `widget-generation-mapping.md`.

**Generation always offers choice.** Whenever the engine builds a widget from a prompt, it returns 1–3 type variants, not one answer — the product doesn't assume it knows the single best visualization for a given request. User picks; picks are stored as preference signal, so repeat prompt patterns bias toward what people actually chose before.

---

## 7. Mascot conversation

Deterministic in majority, per the brief's constraint. Full node-by-node logic in `mascot-conversation-decision-tree.md`. Summary:

- Topic recognition → confirmed match, disambiguation, or fallback to macro-category picklist
- Driver suggestion, shown as a checklist with adjacent-driver suggestions ("these could also be relevant")
- Insight type selection (multi-select, multi-choice)
- "Surprise me" flagged as stretch, not core — it's the one non-deterministic branch and shouldn't block the thin slice

All copy follows the existing SHAPE Voice and Language Guide (mascot voice: sentence case, short, warm, never pushy) — scripted lines still needed as a follow-up artifact, not yet written.

---

## 8. Data

Every widget calls the same seeded table of ~100 realistic responses. Owned by Omer. Key dependency surfaced during this design work: **topic-to-driver tagging must exist** for the mascot's topic recognition to work reliably (see decision tree, open questions) — this is the single biggest risk to the guided path, and needs confirming before the mascot conversation can be built as specced.

---

## 9. Squad & ownership

| Role | Owner |
|---|---|
| Experience lead — design ideation, coordination, asset use, demo rhythm, stakeholder signoff | **Fahd** |
| Development lead — AI-assisted build, mascot conversation, builder interactions | **Ahsan** |
| Data lead — seeded dataset, calculation logic, coordinated widget connections | **Omer** |
| Product/experience sign-off | **Amna** |
| Sponsor | **Ali** |
| Orchestration support (as needed) | **Munim** |
| Admin Panel guidance (2.0 and 3.0 — deferred per §3) | **Rafeh** |

---

## 10. Demo cadence

No end-of-week reveal — demonstrate early, decide in the room, adjust immediately.

- **Day 1.** Agree use case, routes, data, widget set. Show opening experience.
- **Day 2 or 3.** Show first complete request-to-report-card path. Resolve choices live.
- **Day 4.** Show both routes with live data. Test with an untrained SRO colleague.
- **Day 5 max.** Deliver usable v1 and a short learning readout.

---

## 11. Open items across the package

Consolidated from companion docs — not duplicated in full here:

1. **Topic-to-driver tagging** (data) — biggest risk to guided path. *Owner: Omer.*
2. **3×3 size** needs formal addition to the Widget Spec document. *Owner: Fahd/Amna.*
3. **4 unlabeled Library toolbar icons** — meaning unconfirmed from Amna's file. *Owner: Amna.*
4. **In-canvas "+" tile vs. Library drag** — both staying, or consolidating? *Owner: Fahd/Amna.*
5. **Chat-card component reuse** — generation picker and edit-draft card assumed to be one shared component. *Owner: Ahsan, confirm before estimating.*
6. **Widget-scoped chat thread persistence** — does it reset per edit, or stay live for follow-ups? *Owner: Ahsan.*
7. **Fallback/error copy** — trend blocked (no history), surprise-me finds nothing, ambiguous prompt loops. Not yet scripted. *Owner: Fahd.*
8. **Demo scenario** — which topic/company story anchors the Day 1–4 demos, so they're not improvised each time. *Owner: Fahd.*
9. **Mascot scripted lines** — logic is specced, actual copy is not. *Owner: Fahd, against Voice & Language Guide.*
10. **Publish → Admin Panel handoff** — deferred per scope boundary, but needs at minimum a stub before this reads as a complete package long-term. *Owner: Rafeh, deferred.*
