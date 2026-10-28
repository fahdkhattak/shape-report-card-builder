import { carryCustom } from "./widgetCustom.js";
import { LATEST, PREVIOUS, ROUNDS, ROUND_LABELS, EMPLOYEE_COUNT, participationRate, DIMENSION_DRIVERS, driverValue } from "./dataset.js";
import { LAST, ALL_AXES, groupRows, groupGaps, focusGroups, statusCountSeries, scoreSpread, statusOf, findGroups, groupSnapshot, groupPartMeans, GROUPS_BY_AXIS, pairLink, responseCoverage } from "./scopeData.js";
import { FLOURISHING_AT, STRIVING_AT, nextLine, countByStatus, statusName } from "./bands.js";
import { graphFit, chartSizes } from "./insightRules.js";

/* ================================================================== */
/* SUBJECT FORMS — the widget forms the Widget Builder can make for any  */
/* real subject (an Explorer, a Driver, a cluster, a concept).            */
/*                                                                        */
/* The old builder could only produce nine generic charts, one of which    */
/* (the bare number) was a number floating in an empty card. These forms   */
/* are built from the same pieces as the Library catalogue (score         */
/* headline, status chip, evidence bar, grouped lists, history chart…), so */
/* a built widget looks like it belongs next to the real ones.             */
/*                                                                        */
/* Every form is pure data: `build()` computes a serialisable payload from */
/* the subject, and components/widgets/SubjectBody.jsx draws it. So a built */
/* widget keeps working after it is added to a report or the Library.      */
/*                                                                        */
/*   blocked(subject)  a plain reason this subject can't support the form  */
/*   sizes             the cards it can be drawn on                        */
/*   options           what the person can tune (group axis, target)       */
/*   fitSizes(payload) optional: the sizes this payload may be drawn at,   */
/*                     per the Graph / Chart rules (lib/insightRules.js) —   */
/*                     e.g. a composition of 8 groups can't be a 1x1. The    */
/*                     spec carries the result as `sizes`.                  */
/* ================================================================== */
const r0 = Math.round;

/* ---- facts shared by many forms -------------------------------------- */
function people(s) {
  if (!s.scoreOf) return null;
  const c = statusCountSeries(s.scoreOf);
  const f = c.flourishing[LAST], st = c.striving[LAST], t = c.struggling[LAST];
  const pf = c.flourishing[LAST - 1] ?? f, ps = c.striving[LAST - 1] ?? st, pt = c.struggling[LAST - 1] ?? t;
  return { f, s: st, t, total: f + st + t, pf, ps, pt };
}
function partRows(s) {
  return s.children.map((c) => [c.label, c.values[LAST], c.values[LAST] - (c.values[LAST - 1] ?? c.values[LAST])]).sort((a, b) => b[1] - a[1]);
}
const bandCounts = countByStatus;
function base(s) {
  const value = s.series[LAST], prev = s.series[LAST - 1] ?? value;
  return { value, delta: value - prev, status: statusOf(value), date: LATEST.date };
}

/* The facts any evidence can be drawn from (lib/widgetCustom.js GENERIC_EVIDENCE, widgets/GenericEvidence.jsx). Every built
   spec carries them as payload.ev, so a person can put evidence on a form that's drawn without it, or swap its own. */
export function evidenceFacts(s) {
  const b = base(s), p = people(s);
  const rows = s.children.length >= 2 ? partRows(s) : null;
  const nl = nextLine(b.value);
  return {
    value: b.value, delta: b.delta, prevLabel: ROUND_LABELS[LAST - 1] ?? null, latestLabel: ROUND_LABELS[LAST],
    people: p, n: p?.total ?? null,
    parts: rows ? { ...bandCounts(rows.map((r) => r[1])), noun: s.childNoun || "Part" } : null,
    strongest: rows?.[0]?.slice(0, 2) ?? null, weakest: rows?.[rows.length - 1]?.slice(0, 2) ?? null,
    next: nl ? { at: nl, name: statusName(nl) } : null,
  };
}

/* Default target: the next status line up, or a stretch goal once Flourishing. */
export const defaultTarget = (v) => nextLine(v) ?? 90;

/* "Org" for the whole organisation, otherwise the subject's own name — the Library says "Org Score" too. */
const nm = (s) => (s.kind === "overall" ? "Org" : s.label);
const scoreFn = (s) => s.scoreOf || ((r) => r.overallScore);

export const GROUP_AXES = ALL_AXES.map(([key, label]) => ({ key, label }));
function groupData(s, axisKey) {
  // No axis asked for: the one that splits people into the most groups big enough to show.
  const visibleCount = (a) => groupRows(a.key, LAST, s.scoreOf).filter((g) => !g.hidden).length;
  const richest = [...GROUP_AXES].sort((a, b) => visibleCount(b) - visibleCount(a))[0];
  const axis = GROUP_AXES.find((a) => a.key === axisKey) || richest;
  const all = groupRows(axis.key, LAST, s.scoreOf);
  // All groups big enough to show; the bars show up to 13 on a 2x2 and say how many more (chart rules).
  const rows = all.filter((g) => !g.hidden).sort((a, b) => b.score - a.score).map((g) => [g.group, g.score]);
  return { axis: axis.key, axisLabel: axis.label, rows, hidden: all.filter((g) => g.hidden).length };
}

/* The grouping a Composition widget shows: the one asked for, else Department (the design's own example). Names
   follow the design where it has one ("Departments Composition", "Work Composition", "Employment Duration"). */
const COMPOSITION_NAME = { department: "Departments", workModel: "Work", tenure: "Employment Duration", location: "Site" };
const axisOf = (o) => GROUP_AXES.find((a) => a.key === o?.axis) || GROUP_AXES.find((a) => a.key === "department") || GROUP_AXES[0];
const compositionName = (a) => COMPOSITION_NAME[a.key] || a.label;

/* Which group a Group widget is about: the one asked for, else the biggest department. */
function pickGroup(s, o) {
  const axes = GROUPS_BY_AXIS();
  const ax = axes.find((a) => a.key === o?.axis) || axes.find((a) => a.key === "department") || axes[0];
  const group = ax.groups.includes(o?.group) ? o.group : ax.groups[0];
  return { axis: ax.key, axisLabel: ax.label, group, groups: ax.groups };
}
/* Which two groups a Versus widget sets side by side: the ones asked for, else the widest gap. */
function pickPair(s, o) {
  const axes = GROUPS_BY_AXIS();
  let ax = axes.find((a) => a.key === o?.axis);
  let a = o?.a, b = o?.b;
  if (!ax || !ax.groups.includes(a) || !ax.groups.includes(b) || a === b) {
    const gap = groupGaps(scoreFn(s))[0];
    ax = (gap && axes.find((x) => x.label === gap.axis)) || axes[0];
    if (!(ax.groups.includes(a) && ax.groups.includes(b) && a !== b)) { a = gap?.hi.group ?? ax.groups[0]; b = gap?.lo.group ?? ax.groups[1]; }
  }
  return { axis: ax.key, axisLabel: ax.label, a, b, groups: ax.groups };
}
export { pickGroup, pickPair };

const needsScores = (s) => (s.scoreOf ? null : "Needs per-person scores for this topic");
const needsParts = (s) => (s.children.length < 2 ? "Needs two or more parts" : null);

/* ---- the catalogue ----------------------------------------------------- */
export const FORMS = [
  {
    id: "score", name: "Score", sizes: ["1x1", "2x2"], blocked: () => null,
    // For the whole organisation the Org Score card is the 2×2, as in the Library.
    defaultSize: (s) => (s.kind === "overall" ? "2x2" : "1x1"),
    title: (s) => `${nm(s)} Score`,
    why: "The number and how it moved, with its status. Best when one figure matters most.",
    build: (s) => {
      const p = people(s);
      const parts = s.children.length >= 2 ? bandCounts(s.children.map((c) => c.values[LAST])) : null;
      const rows = s.children.length >= 2 ? partRows(s) : null;
      // The whole organisation reads as the Library's Org Score card: headcount and participation under the number.
      const org = s.kind === "overall" ? { employees: EMPLOYEE_COUNT, rate: participationRate() } : null;
      return { ...base(s), people: p, parts, partNoun: s.childNoun, org, strongest: rows?.[0]?.slice(0, 2), weakest: rows?.[rows.length - 1]?.slice(0, 2) };
    },
  },
  {
    id: "gauge", name: "Ring", sizes: ["1x1", "2x2"], blocked: () => null,
    title: (s) => (s.kind === "overall" ? "Org Score" : s.label),
    why: "The score as a ring with the 60 and 80 status lines marked, so you can see how close it is to the next band.",
    build: (s) => base(s),
  },
  {
    // No Status for a Driver: Drivers have no page of their own in the product, so no status widget either (lib/scoreWidget.js).
    id: "status", name: "Status", sizes: ["1x1", "2x2"], blocked: (s) => (s.kind === "driver" ? "A Driver has no Status widget" : null),
    title: (s) => `${nm(s)} Status`,
    why: "One status (Flourishing, Striving or Struggling), when the band matters more than the exact number.",
    build: (s) => ({ ...base(s), people: people(s), parts: s.children.length >= 2 ? bandCounts(s.children.map((c) => c.values[LAST])) : null, partNoun: s.childNoun }),
  },
  {
    id: "history", name: "History", sizes: ["1x1", "2x2"], blocked: () => (ROUNDS.length < 2 ? "Needs at least two rounds" : null),
    title: (s) => `${nm(s)} History`,
    // Graph rules: a 1x1 holds 2 to 3 points; more rounds than that must be a 2x2.
    fitSizes: (p) => (graphFit(p.points.length) === "1x1" ? ["1x1", "2x2"] : ["2x2"]),
    why: "The score across every survey round, so a change over time is easy to see.",
    build: (s) => ({ ...base(s), points: s.series.slice(), labels: ROUND_LABELS }),
  },
  {
    id: "parts", name: "Parts", sizes: ["1x1", "2x2"], blocked: needsParts,
    title: (s) => `${s.childNoun}s in ${nm(s)}`,
    why: "The parts behind the score, grouped Great / Average / Poor so what needs attention sits where you look first.",
    build: (s) => ({ ...base(s), noun: s.childNoun, rows: partRows(s) }),
  },
  {
    id: "profile", name: "Profile", sizes: ["2x2"],
    blocked: (s) => (s.children.length < 4 ? "Needs four or more parts to make a shape" : null),
    title: (s) => `${nm(s)} Profile`,
    why: "Several parts on one shape: a dent on one spoke is the part pulling the rest down.",
    build: (s) => {
      const rows = partRows(s);
      // A radar reads best with 4–8 spokes; keep the lowest if there are more.
      const use = rows.length > 8 ? rows.slice(-8) : rows;
      return { ...base(s), items: use.map((r) => ({ label: r[0], value: r[1] })) };
    },
  },
  {
    id: "people", name: "People", sizes: ["1x1", "2x2"], blocked: needsScores,
    title: (s) => `${nm(s)}: People by Status`,
    why: "How many people are Flourishing, Striving or Struggling: the spread a single average hides.",
    build: (s) => ({ ...base(s), people: people(s) }),
  },
  {
    id: "groups", name: "Groups", sizes: ["2x2"], blocked: needsScores, options: ["axis"],
    title: (s, o) => `${nm(s)} Score by ${groupData(s, o?.axis).axisLabel}`,
    why: "How each group scores on this topic, on one 0–100 scale. Groups under 5 people are never shown.",
    build: (s, o) => ({ ...base(s), ...groupData(s, o?.axis) }),
  },
  {
    id: "composition", name: "Composition", sizes: ["1x1", "2x2"], blocked: () => null, options: ["axis"],
    title: (s, o) => `${compositionName(axisOf(o))} Composition`,
    // Chart rules: a 1x1 holds up to 7 groups (tiles up to 4, a ring with the Largest Group line up to 7).
    fitSizes: (p) => chartSizes("donut", p.rows.length),
    why: "Who is in the organisation: how people split across one way of grouping them, and which group is biggest. It describes the people, not the topic's score.",
    build: (s, o) => {
      const axis = axisOf(o);
      const rows = groupRows(axis.key, LAST).map((g) => ({ group: g.group, n: g.n, pct: g.pct }));
      return { axis: axis.key, axisLabel: axis.label, name: compositionName(axis), rows, total: rows.reduce((a, r) => a + r.n, 0), largest: rows[0] || null };
    },
  },
  {
    id: "focus", name: "Focus", sizes: ["1x1", "2x2"], blocked: needsScores,
    title: (s) => `Areas to Focus · ${nm(s)}`,
    why: "The lowest-scoring group on each way of splitting people: where to start. Groups under 5 people are never shown.",
    build: (s) => ({ ...base(s), rows: focusGroups(4, s.scoreOf).map((g) => ({ axis: g.axis, group: g.group, score: g.score, n: g.n, struggling: g.struggling, change: g.change })) }),
  },
  {
    id: "movers", name: "Movers", sizes: ["1x1", "2x2"], blocked: needsParts,
    title: (s) => `${nm(s)} Movers`,
    why: "The parts that rose or fell most since the last round.",
    build: (s) => {
      const rows = partRows(s).map(([label, v, d]) => ({ label, value: v, d }));
      return { ...base(s), noun: s.childNoun, gains: rows.filter((r) => r.d > 0).sort((a, b) => b.d - a.d).slice(0, 3), drops: rows.filter((r) => r.d < 0).sort((a, b) => a.d - b.d).slice(0, 3) };
    },
  },
  {
    // Ten bands of ten points: past the vertical-bar 1x1 limit (4), so 2x2 only.
    id: "spread", name: "Spread", sizes: ["2x2"], blocked: needsScores,
    title: (s) => `${nm(s)} Spread`,
    why: "How many people sit at each score, not just the average. The same average can hide two very different groups.",
    build: (s) => ({ ...base(s), ...scoreSpread(s.scoreOf) }),
  },
  {
    id: "goal", name: "Goal", sizes: ["1x1", "2x2"], blocked: () => null, options: ["target"],
    title: (s) => `${nm(s)} Goal`,
    why: "How far the score is from a target, and a straight-line estimate from past rounds. An estimate, not a forecast.",
    build: (s, o) => {
      const b = base(s);
      const target = o?.target ?? defaultTarget(b.value);
      const n = s.series.length;
      const pace = n > 1 ? (s.series[n - 1] - s.series[0]) / (n - 1) : 0;
      const gap = target - b.value;
      const rounds = gap <= 0 ? 0 : pace > 0 ? Math.ceil(gap / pace) : null;
      return { ...b, target, gap, pace: Math.round(pace * 10) / 10, rounds, nRounds: n };
    },
  },

  /* ============ the overall picture, and cases with a point of view ============ */
  {
    // The full picture is the organisation's: for an Explorer, a Driver or a cluster the Scope tells the story.
    id: "story", name: "Story", sizes: ["3x3"], blocked: (s) => (s.kind === "overall" ? null : "The full picture is for the whole organisation"),
    title: (s) => `${nm(s)} Story`,
    why: "The whole picture on one card: the score, how people are spread, what moved, where the weak spots are and who to look at.",
    build: (s) => {
      const b = base(s), p = people(s);
      const rows = s.children.length >= 2 ? partRows(s) : null;
      const mover = rows ? [...rows].sort((x, y) => Math.abs(y[2]) - Math.abs(x[2]))[0] : null;
      const focus = s.scoreOf ? focusGroups(1, s.scoreOf)[0] : null;
      const headline = { Flourishing: `${nm(s)} is a strength right now.`, Striving: `${nm(s)} is doing okay, with room to improve.`, Struggling: `${nm(s)} is holding scores back.` }[b.status];
      const facts = [];
      if (rows) {
        const w = rows[rows.length - 1], st = rows[0];
        facts.push({ label: `Weakest ${s.childNoun.toLowerCase()}`, value: w[0], num: w[1], sub: `${w[2] > 0 ? "up" : w[2] < 0 ? "down" : "no change"}${w[2] ? ` ${Math.abs(w[2])}` : ""} since last round` });
        facts.push({ label: `Strongest ${s.childNoun.toLowerCase()}`, value: st[0], num: st[1], sub: `${st[2] > 0 ? "up" : st[2] < 0 ? "down" : "no change"}${st[2] ? ` ${Math.abs(st[2])}` : ""} since last round` });
        if (mover && mover[2] !== 0) facts.push({ label: "Biggest mover", value: mover[0], num: mover[1], sub: `${mover[2] > 0 ? "up" : "down"} ${Math.abs(mover[2])} since last round`, d: mover[2] });
      }
      if (focus) facts.push({ label: "Group to watch", value: focus.group, num: focus.score, sub: `${focus.axis} · ${focus.struggling} of ${focus.n} struggling` });
      if (p) facts.push({ label: "People struggling", value: `${p.t} of ${p.total}`, num: null, sub: `${Math.round((p.t / (p.total || 1)) * 100)}% of people` });
      return { ...b, points: s.series.slice(), labels: ROUND_LABELS, people: p, rows, noun: s.childNoun, headline, facts: facts.slice(0, 4) };
    },
  },
  {
    // One Index for any score with parts (lib/scoreWidget.js): 2x2 = one layer deeper, 3x3 = two. Only the overall score
    // has two layers (Explorers, then Drivers); an Explorer or a cluster has one (its Drivers); a Driver has none.
    id: "index", name: "Index", sizes: ["2x2", "3x3"],
    blocked: (s) => (s.children.length >= 3 ? null : s.kind === "driver" ? "A Driver has no parts to break down into" : "Needs a score with at least three parts"),
    fitSizes: (p) => (p.layers >= 2 ? ["2x2", "3x3"] : ["2x2"]),
    title: (s) => `${nm(s)} Index`,
    why: "The score at the centre with its parts around it as a ring. A 2x2 goes one layer deeper; a 3x3 two, so only the overall score (Explorers, then their Drivers) has one.",
    build: (s) => {
      const two = s.kind === "overall";
      const wedges = s.children.map((c) => ({
        label: c.label, value: c.values[LAST], prev: c.values[LAST - 1],
        sub: two ? (DIMENSION_DRIVERS[c.label] || []).map((d) => ({ label: d, value: driverValue(d), prev: driverValue(d, PREVIOUS) })) : undefined,
      }));
      return { ...base(s), wedges, layers: two ? 2 : 1 };
    },
  },
  {
    id: "team", name: "Group", sizes: ["1x1", "2x2"], blocked: needsScores, options: ["group"],
    title: (s, o) => { const g = pickGroup(s, o); return `${g.group} Group Score${s.kind === "overall" ? "" : ` · ${s.label}`}`; },
    why: "One group's score (a department, a work model, a tenure band…), how it compares with the organisation, and how its people are spread. Groups under 5 people are never shown.",
    build: (s, o) => {
      const g = pickGroup(s, o), snap = groupSnapshot(g.axis, g.group, scoreFn(s));
      const org = s.series[LAST];
      return { ...snap, axisLabel: g.axisLabel, org, vs: snap.value - org, date: LATEST.date };
    },
  },
  {
    id: "versus", name: "Versus", sizes: ["2x2"], blocked: needsScores, options: ["pair"],
    // The header names what's compared, never the result: the two groups are the Insight's job.
    title: (s, o) => `${nm(s)} Score by ${pickPair(s, o).axisLabel}`,
    why: "Two groups side by side on the same measure: who scores higher, by how much, and which parts the gap comes from.",
    build: (s, o) => {
      const p = pickPair(s, o), fn = scoreFn(s);
      const A = groupSnapshot(p.axis, p.a, fn), B = groupSnapshot(p.axis, p.b, fn);
      let rows = null;
      if (s.children.length >= 2) {
        const labels = s.children.map((c) => c.label);
        const ma = groupPartMeans(p.axis, p.a, labels), mb = groupPartMeans(p.axis, p.b, labels);
        rows = labels.map((label, i) => ({ label, a: ma[i], b: mb[i] })).sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b)).slice(0, 4);
      }
      return { axisLabel: p.axisLabel, a: { name: p.a, n: A.n, value: A.value, delta: A.delta, status: A.status }, b: { name: p.b, n: B.n, value: B.value, delta: B.delta, status: B.status }, gap: A.value - B.value, rows, noun: s.childNoun };
    },
  },
  {
    id: "duel", name: "Head to head", sizes: ["2x2"], blocked: (s) => (s.pair ? null : "Needs exactly two named topics, like Sleep vs Stress"),
    title: (s) => (s.pair ? `${s.pair[0].label} vs ${s.pair[1].label}` : s.label),
    why: "Two topics side by side across every round, and whether the people who score high on one also score high on the other.",
    build: (s) => {
      const items = s.pair.map((it) => { const v = it.series[LAST], pv = it.series[LAST - 1] ?? v; return { label: it.label, value: v, delta: v - pv, status: statusOf(v), points: it.series.slice() }; });
      return { items, gap: items[0].value - items[1].value, r: pairLink(s.pair[0].scoreOf, s.pair[1].scoreOf), labels: ROUND_LABELS };
    },
  },
  {
    id: "check", name: "Check-up", sizes: ["2x2"], blocked: () => null,
    title: (s) => `${nm(s)} Health Check`,
    why: "A short checklist (passing, worth a look, or failing) so a reader can see in seconds whether things are on track.",
    build: (s) => {
      const b = base(s), p = people(s);
      const checks = [];
      const st = (ok, warn) => (ok ? "pass" : warn ? "warn" : "fail");
      checks.push({ label: `Score is Flourishing (${FLOURISHING_AT}+)`, state: st(b.value >= FLOURISHING_AT, b.value >= STRIVING_AT), detail: `${b.value}` });
      checks.push({ label: "Improving since last round", state: st(b.delta > 0, b.delta === 0), detail: `${b.delta > 0 ? "+" : b.delta < 0 ? "−" : ""}${Math.abs(b.delta)}` });
      if (s.children.length >= 2) {
        const t = s.children.filter((c) => c.values[LAST] < STRIVING_AT).length;
        checks.push({ label: `No ${s.childNoun.toLowerCase()} is Struggling`, state: st(t === 0, t === 1), detail: `${t} of ${s.children.length}` });
      }
      if (p) {
        const share = (p.t / (p.total || 1)) * 100;
        checks.push({ label: "Under 1 in 4 people struggling", state: st(share < 15, share < 25), detail: `${p.t} of ${p.total}` });
      }
      if (s.scoreOf) {
        const w = focusGroups(1, s.scoreOf)[0];
        if (w) checks.push({ label: "No group is Struggling", state: st(w.score >= STRIVING_AT + 5, w.score >= STRIVING_AT), detail: `${w.group} ${w.score}` });
      }
      const cov = responseCoverage();
      const rate = cov.perRound[cov.perRound.length - 1].rate;
      checks.push({ label: "Participation is 80% or more", state: st(rate >= 80, rate >= 60), detail: `${rate}%` });
      return { ...b, checks, passed: checks.filter((c) => c.state === "pass").length };
    },
  },
  {
    id: "whatif", name: "What if", sizes: ["2x2"], blocked: (s) => (s.children.length < 3 ? "Needs three or more parts" : null), options: ["lift"],
    title: (s) => `${nm(s)}: What If`,
    why: `If the weakest parts reached ${FLOURISHING_AT}, what would the score be? Plain arithmetic on today's scores, not a prediction.`,
    build: (s, o) => {
      const b = base(s), rows = partRows(s).slice().reverse(); // weakest first
      const lift = Math.max(1, Math.min(5, o?.lift ?? 2));
      const lifted = rows.filter((r) => r[1] < FLOURISHING_AT).slice(0, lift).map((r) => ({ label: r[0], from: r[1], to: FLOURISHING_AT }));
      const gain = lifted.reduce((a, r) => a + (r.to - r.from), 0) / s.children.length;
      const after = Math.min(100, Math.round(b.value + gain));
      return { ...b, after, lift, lifted, n: s.children.length, noun: s.childNoun, statusAfter: statusOf(after) };
    },
  },
  {
    id: "heat", name: "Heat strip", sizes: ["2x2"], blocked: needsParts,
    title: (s) => `${nm(s)} Heat Strip`,
    why: "Every part in every round as a coloured cell, so a slide or a recovery shows up as a colour change, not a number to compare.",
    build: (s) => ({ ...base(s), noun: s.childNoun, labels: ROUND_LABELS, rows: s.children.map((c) => [c.label, c.values.slice()]).sort((a, b) => b[1][b[1].length - 1] - a[1][a[1].length - 1]) }),
  },
  {
    id: "momentum", name: "Momentum", sizes: ["1x1", "2x2"], blocked: () => (ROUNDS.length < 2 ? "Needs at least two rounds" : null),
    title: (s) => `${nm(s)} Momentum`,
    why: "Which way the score has been heading over the rounds: the total change, the run it is on, and what moved most.",
    build: (s) => {
      const sr = s.series, n = sr.length, b = base(s);
      const steps = sr.slice(1).map((v, i) => ({ label: ROUND_LABELS[i + 1], d: v - sr[i] }));
      let streak = 0; for (let i = steps.length - 1; i >= 0 && steps[i].d > 0; i--) streak++;
      let fall = 0; for (let i = steps.length - 1; i >= 0 && steps[i].d < 0; i--) fall++;
      const rows = s.children.length >= 2 ? s.children.map((c) => ({ label: c.label, d: c.values[LAST] - c.values[0] })) : [];
      return { ...b, first: sr[0], change: sr[n - 1] - sr[0], steps, streak, fall, nRounds: n, riser: rows.sort((x, y) => y.d - x.d)[0], faller: rows.sort((x, y) => x.d - y.d)[0] };
    },
  },
  {
    // An action widget: what to act on first, with a link to the actions you can take. The link is what makes it this
    // widget, so its Action Bar can't be switched off (lib/widgetCustom.js action: "required").
    id: "nudge", name: "Next Step", sizes: ["1x1", "2x2"], blocked: () => null,
    title: (s) => `${nm(s)} Next Step`,
    why: "The part most worth acting on, with a link to the actions you can take. The link is what makes this widget, so it's always there.",
    build: (s) => {
      const rows = s.children.length >= 2 ? partRows(s) : null;
      const items = rows ? rows.slice(-3).reverse().map(([label, value, d]) => ({ label, value, d })) : [{ label: s.label, value: s.series[LAST], d: s.series[LAST] - (s.series[LAST - 1] ?? s.series[LAST]) }];
      return { ...base(s), items, noun: s.childNoun || "Part", of: rows?.length ?? 1 };
    },
  },
];

export const formById = (id) => FORMS.find((f) => f.id === id);

/* ---- ranking: what is the data's job? ---------------------------------- */
const BASE = {
  overall: { nudge: 2, score: 9, composition: 1, story: 4, index: 5, parts: 5, history: 4, momentum: 4, check: 4, heat: 4, whatif: 3, people: 3, status: 3, gauge: 3, groups: 3, focus: 2, movers: 2, spread: 2, profile: 2, team: 2, versus: 2, goal: 1 },
  dimension: { nudge: 2, score: 6, composition: 1, parts: 5, profile: 4, history: 4, index: 3, heat: 3, check: 3, whatif: 3, momentum: 3, people: 3, status: 3, gauge: 3, groups: 2, focus: 2, movers: 2, spread: 2, team: 1, versus: 1, goal: 1 },
  driver: { nudge: 1, score: 6, composition: 1, history: 5, gauge: 4, status: 3, people: 3, momentum: 3, groups: 3, check: 2, spread: 2, focus: 2, goal: 2, team: 1, versus: 1 },
  cluster: { nudge: 2, score: 6, composition: 1, parts: 5, duel: 5, profile: 4, history: 4, heat: 3, check: 3, whatif: 3, momentum: 3, people: 3, gauge: 3, status: 2, groups: 2, focus: 2, movers: 2, spread: 2, team: 1, versus: 1, goal: 1 },
  concept: { nudge: 1, score: 6, composition: 1, history: 5, gauge: 4, status: 3, momentum: 3, check: 2, goal: 1 },
};
const ASKS = [
  ["history", /trend|over time|history|across rounds|round by round|improv|declin/],
  ["people", /how many|who is|which people|people (are|in)|struggling people|share of people|status share/],
  ["groups", /gender|department|work model|remote|hybrid|onsite|location|tenure|job level|employment|by group|between groups|demographic|compare groups|by team|by office/],
  ["focus", /focus|worst group|lowest group|where to start|where to look/],
  ["movers", /mover|biggest change|gains|drops|risers|fallers|moved|what changed/],
  ["spread", /spread|distribution|histogram|range of|variation/],
  ["goal", /goal|target|on track|pace|reach \d+/],
  ["composition", /composition|make-?up|who works|who is in|who are we|headcount|how many (people|employees)|split of people/],
  ["gauge", /gauge|dial|\bring\b/],
  ["status", /status|flourish|struggl|striv/],
  ["profile", /radar|spider|profile|snapshot/],
  ["parts", /rank|top |worst|best|drivers|factors|breakdown|parts|what's behind|what is behind|contribut/],
  ["score", /number|score\b|single/],
  ["story", /story|full (story|picture)|tell me everything|the whole story/],
  ["index", /\bindex\b|wheel/],
  ["team", /\bteam\b|\bsquad\b|\bdepartment\b/],
  ["check", /health check|check-?up|checklist|red flags?|are we ok|all good|how healthy|risks?/],
  ["whatif", /what if|if we|simulat|lift|raise|bring up|what would/],
  ["heat", /heat|grid|matrix|round by round|every explorer|all (the )?explorers|colou?r/],
  ["nudge", /next step|what (can|should) (we|i) do|where to act|act on|action/],
  ["momentum", /momentum|streak|keep(ing)? up|gaining|losing steam|trajectory|heading/],
];

/* Every form this subject can honestly support, best fit first. */
export function rankSubjectForms(prompt, subject) {
  const p = (prompt || "").toLowerCase();
  const score = { ...(BASE[subject.kind] || BASE.dimension) };
  ASKS.forEach(([id, re]) => { if (re.test(p) && id in score) score[id] += 8; });
  // "department composition" is about who is in a group, not how the group scores (which "department" alone would suggest).
  if (/composition|make-?up|who is in|who works|who are we|headcount/.test(p) && "composition" in score) score.composition += 12;
  // A named group is a Team widget; two named groups are a Versus; two named topics are a Head to head.
  const groups = findGroups(prompt || "");
  if (groups.length === 1) score.team = (score.team || 0) + 14;
  if (groups.length >= 2 && groups[0].axis === groups[1].axis) score.versus = (score.versus || 0) + 16;
  if (subject.pair) score.duel = (score.duel || 0) + (/vs\.?|versus|compare|against|between/.test(p) ? 14 : 5);
  return FORMS.filter((f) => !f.blocked(subject)).map((f) => f.id).sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0));
}

/* Settings a prompt already implies: the group(s) it names, how many parts to lift. */
export function optionsFromPrompt(prompt) {
  const o = {};
  const g = findGroups(prompt || "");
  if (g.length) { o.axis = g[0].axis; o.group = g[0].group; }
  if (g.length >= 2 && g[0].axis === g[1].axis) { o.a = g[0].group; o.b = g[1].group; }
  // "Tenure composition", "work model make-up": the grouping is named, not asked for with "by".
  const named = axisFromText((prompt || "").toLowerCase());
  if (!o.axis && named && /composition|make-?up|who (is|works)|headcount/i.test(prompt || "")) o.axis = named;
  const lift = (prompt || "").toLowerCase().match(/(?:lift|raise|bring up|improve|fix)\D{0,24}?(\d)\b|weakest (\d)/);
  if (lift) o.lift = Number(lift[1] || lift[2]);
  return o;
}

/* ---- text asks the chat can pick up ------------------------------------ */
const AXIS_WORDS = { gender: /gender|\bmen\b|women/, department: /department|\bteam\b/, jobLevel: /job level|seniority|\blevel\b/, employmentStatus: /employment|contract|full-time|part-time|casual/, tenure: /tenure|years of service/, workModel: /work model|remote|hybrid|onsite/, location: /location|office|site/ };
export const axisFromText = (t) => Object.entries(AXIS_WORDS).find(([, re]) => re.test(t))?.[0] || null;

/* ---- building a spec ------------------------------------------------------ */
export function buildFormSpec(formId, subject, { size, options } = {}) {
  const def = formById(formId);
  const opts = { ...(options || {}) };
  const payload = { ...def.build(subject, opts), ev: evidenceFacts(subject) };
  // The sizes this data may be drawn at (the rules can rule out a 1x1); a size that no longer fits grows to the next one.
  const sizes = def.fitSizes ? def.sizes.filter((x) => def.fitSizes(payload).includes(x)) : def.sizes;
  const pick = (x) => (sizes.includes(x) ? x : null);
  const sz = pick(size) || (size === "1x1" && pick("2x2")) || pick(def.defaultSize?.(subject)) || sizes[0];
  const title = def.title(subject, opts);
  return { vizType: "form", form: formId, size: sz, sizes, title, autoTitle: title, options: opts, payload, explanation: def.why, real: true };
}

/* Re-make a spec after a change of form / size / option, keeping a title the person typed. */
export function rebuildFormSpec(prev, subject, change) {
  const form = change.form || prev.form;
  const def = formById(form);
  const carriedSize = change.size || prev.size;
  // buildFormSpec checks the carried size against what this data allows and grows it if needed.
  const size = def.sizes.includes(carriedSize) ? carriedSize : def.sizes[def.sizes.length - 1];
  // Options carry across forms (the group you picked for a Team widget is still the group for a Versus one).
  const options = { ...(prev.options || {}), ...(change.options || {}) };
  const next = buildFormSpec(form, subject, { size, options });
  const typed = prev.title && prev.title !== prev.autoTitle;
  const custom = carryCustom(prev.custom, next);
  const out = custom ? { ...next, custom } : next;
  return typed ? { ...out, title: prev.title, autoTitle: next.autoTitle } : out;
}
