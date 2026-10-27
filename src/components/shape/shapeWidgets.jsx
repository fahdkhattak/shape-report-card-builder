import { T } from "../../lib/tokens.js";
import { ds } from "../../lib/ds.js";
import { FLOURISHING_AT, STRIVING_AT, statusName } from "../../lib/bands.js";
import { ScoreHeadline, StatusChip, Headcount, MoreLine, Footnote, SeverityRow, FocusRow, GroupCounts, fmtDate, date11, muted11, STATUS_COLOR } from "../widgets/widgetParts.jsx";
import { EvidenceSegmentBar, StatusBreakdown, DriverGroupedList, DriverRow, TrendPill, BigNumber, driverTier, Sections, Insight, Evidence } from "../widgets/primitives.jsx";
import GraphInsight from "../widgets/GraphInsight.jsx";
import ScoreCard from "../widgets/ScoreCard.jsx";
import StatusCard from "../widgets/StatusCard.jsx";
import { HBars } from "../widgets/ChartInsight.jsx";
import { ROUNDS, LATEST_ROUND, EXPLORERS, DRIVERS, QUESTION, personById, summary, respondents, orgSeries, personSeries, groups, focusGroups, answerText, roundIndex } from "../../lib/survey/surveyData.js";
import { WELLBEING, WELLBEING_LEVELS, enpsGroup } from "../../lib/survey/scoring.js";

/* ================================================================== */
/* SHAPE WIDGETS — the widgets of the SHAPE report (Personal and Org),   */
/* drawn from the new survey dataset (lib/survey/surveyData.js) with the */
/* same parts as the Library widgets, so they look like the rest.        */
/*                                                                      */
/* A widget on the canvas is `{ id, kind: "shape", widgetId, personId? }`.*/
/* Personal widgets read one person's own answers and scores, never a    */
/* group or anyone else's data. Org widgets average people, and never    */
/* show a group under 5 (surveyData's MIN_GROUP).                        */
/* Each entry: name, size, persona, title(w), Body(w), Scope (in          */
/* shapeScopes.jsx).                                                      */
/* ================================================================== */
const r0 = (v) => (v == null ? null : Math.round(v));
const col = (extra) => ({ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, ...extra });
/* Widget sections (lib/widgetStructure.js): Insight only, or Insight + Evidence (24px bar on a 1x1, 68px on a 2x2). */
const Only = ({ size, children, style, center }) => <Sections size={size}><Insight style={style} center={center}>{children}</Insight></Sections>;
const line1 = { fontSize: 11, color: ds.text.tertiary, lineHeight: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const sentence = { fontSize: 11, color: ds.text.tertiary, lineHeight: "16px" };
const ROUND_LABELS = ROUNDS.map((r) => r.label.replace(/ (\d\d)(\d\d)$/, " $2"));
const statusOfScore = statusName;

/* A person's latest round and the one before it (by calendar: a skipped round means no change is shown). */
export function personRounds(person) {
  const answered = ROUNDS.filter((r) => person.rounds[r.id]);
  const latest = answered[answered.length - 1];
  const i = roundIndex(latest.id), prev = i > 0 ? person.rounds[ROUNDS[i - 1].id] : null;
  return { latest, now: person.rounds[latest.id], prev };
}
const delta = (a, b) => (a == null || b == null ? undefined : r0(a) - r0(b));
/* In a row, no change shows nothing (a column of "0" pills is noise); the headline pill still says "0 since last round". */
const rowDelta = (a, b) => { const d = delta(a, b); return d === 0 ? undefined : d; };
const prevOrg = () => summary(ROUNDS[ROUNDS.length - 2].id);

/* Great / Average / Poor, up to two of each, so the list never hides what's dragging the score down. */
function pickTiered(rows, perTier = 2, total = 6) {
  const by = { great: [], average: [], poor: [] };
  rows.forEach((r) => by[driverTier(r[1])].push(r));
  const mid = Math.floor(Math.max(0, by.average.length - perTier) / 2);
  const picked = [...by.great.slice(0, perTier), ...by.average.slice(mid, mid + perTier), ...by.poor.slice(-perTier)];
  const rest = rows.filter((r) => !picked.includes(r));
  while (picked.length < Math.min(total, rows.length) && rest.length) picked.push(rest.shift());
  return picked.sort((a, b) => b[1] - a[1]);
}
function Ranked({ rows, noun }) {
  const shown = pickTiered(rows);
  return (
    <Only size="2x2" style={{ gap: 6 }}>
      <DriverGroupedList rows={shown} />
      {rows.length > shown.length && <MoreLine>{rows.length - shown.length} more {noun}</MoreLine>}
    </Only>
  );
}
const counts = (vals) => ({ f: vals.filter((v) => v >= FLOURISHING_AT).length, s: vals.filter((v) => v >= STRIVING_AT && v < FLOURISHING_AT).length, t: vals.filter((v) => v < STRIVING_AT).length });
/* A 1x1 number: the number (and a change) in the Insight, one line of evidence in the 24px Evidence Bar. */
function Big({ value, unit, sub, color, delta }) {
  return (
    <Sections size="1x1">
      <Insight center>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.96, lineHeight: 0.9, color: color || ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{value ?? "–"}</span>
          {unit && <span style={{ fontSize: 11, color: ds.text.primary }}>{unit}</span>}
          {delta != null && <span style={{ alignSelf: "center", marginLeft: 2 }}><TrendPill delta={delta} compact /></span>}
        </div>
      </Insight>
      {sub && <Evidence><span style={line1}>{sub}</span></Evidence>}
    </Sections>
  );
}

/* ---- Personal ------------------------------------------------------ */
const P = (w) => personById(w.personId);
const explorerRows = (scores, prevScores) => EXPLORERS.map((e) => [e.name, r0(scores.explorers[e.id]), prevScores ? rowDelta(scores.explorers[e.id], prevScores.explorers[e.id]) : undefined]).filter((r) => r[1] != null).sort((a, b) => b[1] - a[1]);
const driverRows = (scores, prevScores) => DRIVERS.map((d) => [d, r0(scores.drivers[d]), prevScores ? rowDelta(scores.drivers[d], prevScores.drivers[d]) : undefined]).filter((r) => r[1] != null).sort((a, b) => b[1] - a[1]);

/* The health answers a personal report can show back to the person (their own, never compared with anyone). */
const HEALTH = [["PHYS5", "Sleep"], ["PHYS2", "Exercise"], ["PHYS1", "Fruit and veg"], ["PHYS4", "Alcohol"], ["PHYS3", "Smoking"], ["PHYS6", "BMI"]];
const short = (qid, v) => {
  const t = answerText(QUESTION[qid], v) || "–";
  if (qid === "PHYS5") return { Never: "Rested", Sometimes: "Sometimes tired", Often: "Often tired", "Almost Always": "Usually tired" }[t] || t;
  if (qid === "PHYS2") return `${t} hrs a week`.replace("None hrs a week", "None");
  if (qid === "PHYS1") return `${t} a day`;
  if (qid === "PHYS4") return `${v} a week`;
  if (qid === "PHYS6") return `BMI ${(v[1] / (v[0] / 100) ** 2).toFixed(1)}`;
  if (qid === "PHYS3") return t === "None" ? "Non-smoker" : t === "Ex Smoker" ? "Ex-smoker" : `${t} a day`;
  return t;
};

export const SHAPE_WIDGETS = {
  "p-score": {
    persona: "personal", name: "Your Score", size: "2x2",
    Body: (w) => { const { now, prev, latest } = personRounds(P(w)); return <ScoreCard who="person" what="overall" data={{ value: r0(now.scores.overall), delta: prev ? delta(now.scores.overall, prev.scores.overall) : undefined, date: latest.closedAt, parts: counts(Object.values(now.scores.explorers).filter((v) => v != null)), partsNoun: "Explorers" }} />; },
  },
  "p-status": { persona: "personal", name: "Your Status", size: "1x1", Body: (w) => { const { now } = personRounds(P(w)); return <StatusCard who="person" what="overall" data={{ status: now.scores.status, parts: counts(Object.values(now.scores.explorers).filter((v) => v != null)), partsNoun: "Explorers" }} />; } },
  "p-history": {
    persona: "personal", name: "Score History", size: "1x1",
    Body: (w) => { const pts = personSeries(P(w), (s) => r0(s.overall)); const idx = pts.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0); const points = idx.map((i) => pts[i]); return <GraphInsight series={[{ points }]} labels={idx.map((i) => ROUND_LABELS[i])} size="1x1" delta={points.length > 1 ? points[points.length - 1] - points[points.length - 2] : undefined} />; },
  },
  "p-explorers": { persona: "personal", name: "Your Explorers", size: "2x2", Body: (w) => { const { now, prev } = personRounds(P(w)); return <Ranked rows={explorerRows(now.scores, prev?.scores)} noun="Explorers" />; } },
  "p-drivers": { persona: "personal", name: "Your Drivers", size: "2x2", Body: (w) => { const { now, prev } = personRounds(P(w)); return <Ranked rows={driverRows(now.scores, prev?.scores)} noun="Drivers" />; } },
  "p-focus": {
    persona: "personal", name: "Where to Focus", size: "1x1",
    Body: (w) => { const { now, prev } = personRounds(P(w)); const rows = driverRows(now.scores, prev?.scores).slice(-3).reverse(); return <Only size="1x1" center style={{ gap: 6 }}>{rows.map(([n, v, d]) => <DriverRow key={n} name={n} val={v} trend={d} />)}</Only>; },
  },
  "p-wellbeing": {
    persona: "personal", name: "Mental Well-being", size: "1x1",
    Body: (w) => { const { now, prev } = personRounds(P(w)); const order = WELLBEING_LEVELS; return <Only size="1x1" center style={{ gap: 6 }}>{WELLBEING.map(({ label }) => { const lv = now.scores.wellbeing[label].level, was = prev?.scores.wellbeing[label].level; const tr = was && was !== lv ? (order.indexOf(lv) < order.indexOf(was) ? "up" : "down") : undefined; return <SeverityRow key={label} label={label} level={lv} trend={tr} />; })}</Only>; },
  },
  "p-health": {
    persona: "personal", name: "Health Snapshot", size: "2x2",
    Body: (w) => { const { now } = personRounds(P(w)); return (
      <Only size="2x2" style={{ gap: 8 }}>
        {HEALTH.map(([qid, label]) => { const v = now.answers[qid], s = now.scores.questions[qid]; return (
          <div key={qid} style={{ display: "grid", gridTemplateColumns: "88px 1fr 28px", gap: 8, alignItems: "center", borderLeft: `2px solid ${s == null ? ds.bg.quaternary : STATUS_COLOR[statusOfScore(s)]}`, paddingLeft: 6, minHeight: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: ds.text.primary }}>{label}</span>
            <span style={{ fontSize: 11, color: ds.text.tertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{short(qid, v)}</span>
            <span style={{ fontSize: 14, fontWeight: 700, textAlign: "right", color: s == null ? ds.text.quaternary : ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{r0(s) ?? "–"}</span>
          </div>
        ); })}
      </Only>
    ); },
  },
  "p-balance": {
    persona: "personal", name: "Work-life Balance", size: "1x1",
    Body: (w) => { const { now, prev } = personRounds(P(w)); const v = r0(now.scores.drivers["Work-life balance"]); return <Sections size="1x1"><Insight center><div style={{ display: "flex", alignItems: "center", gap: 6 }}><BigNumber value={v} size={48} colorBand /><TrendPill delta={prev ? delta(now.scores.drivers["Work-life balance"], prev.scores.drivers["Work-life balance"]) : undefined} numberOnly /></div></Insight><Evidence><span style={line1}>You said: <b style={{ color: ds.text.primary }}>{answerText(QUESTION.FOW2, now.answers.FOW2)?.toLowerCase()}</b></span></Evidence></Sections>; },
  },
  "p-morale": {
    persona: "personal", name: "Your Morale", size: "1x1",
    Body: (w) => { const { now } = personRounds(P(w)); const g = enpsGroup(now.answers["CC2.3"]); return <Big value={now.answers["CC2.1"]} unit="/10" />; },
  },
  "p-performance": {
    persona: "personal", name: "Your Performance", size: "1x1",
    Body: (w) => { const { now } = personRounds(P(w)); return <Big value={now.scores.hpq?.absolute} unit="/100" sub={<>Peers <b style={{ color: ds.text.primary }}>{now.answers["PRO16.1"] * 10}</b></>} />; },
  },

  /* ---- Org --------------------------------------------------------- */
  "o-score": {
    persona: "org", name: "Org Score", size: "2x2",
    Body: () => { const s = summary(), p = prevOrg(); return <ScoreCard who="org" what="overall" data={{ value: r0(s.overall), delta: delta(s.overall, p.overall), date: ROUNDS[ROUNDS.length - 1].closedAt, n: s.invited, rate: Math.round((s.n / s.invited) * 100), people: { f: s.status.Flourishing, s: s.status.Striving, t: s.status.Struggling } }} />; },
  },
  "o-status": { persona: "org", name: "Org Status", size: "1x1", Body: () => { const s = summary(); return <StatusCard who="org" what="overall" data={{ value: s.overall, people: { f: s.status.Flourishing, s: s.status.Striving, t: s.status.Struggling } }} />; } },
  "o-history": { persona: "org", name: "Score History", size: "1x1", Body: () => { const pts = orgSeries((s) => r0(s.overall)); return <GraphInsight series={[{ points: pts }]} labels={ROUND_LABELS} size="1x1" delta={pts[pts.length - 1] - pts[pts.length - 2]} />; } },
  "o-explorers": { persona: "org", name: "Explorers", size: "2x2", Body: () => { const s = summary(), p = prevOrg(); return <Ranked rows={EXPLORERS.map((e) => [e.name, r0(s.explorers[e.id]), rowDelta(s.explorers[e.id], p.explorers[e.id])]).sort((a, b) => b[1] - a[1])} noun="Explorers" />; } },
  "o-drivers": { persona: "org", name: "Drivers", size: "2x2", Body: () => { const s = summary(), p = prevOrg(); return <Ranked rows={DRIVERS.map((d) => [d, r0(s.drivers[d]), rowDelta(s.drivers[d], p.drivers[d])]).filter((r) => r[1] != null).sort((a, b) => b[1] - a[1])} noun="Drivers" />; } },
  "o-enps": {
    persona: "org", name: "ENPS", size: "2x2",
    Body: () => { const now = enpsSplit(LATEST_ROUND), prev = enpsSplit(ROUNDS[ROUNDS.length - 2].id); return (
      <Sections size="2x2">
        <Insight style={{ justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1.3, color: ds.text.primary, lineHeight: 0.82 }}>{now.enps > 0 ? `+${now.enps}` : now.enps}</span><TrendPill delta={now.enps - prev.enps} /></div>
          <span style={sentence}>From “How likely are you to recommend your company to others as a place to work?” (0 to 10).</span>
        </Insight>
        <Evidence style={{ gap: 12 }}>
          <EvidenceSegmentBar flourishing={now.p} striving={now.pa} struggling={now.d} />
          <GroupCounts items={[["Promoters", now.p, ds.status.success.textIndicator], ["Passives", now.pa, ds.status.warning.textIndicator], ["Detractors", now.d, ds.status.error.textIndicator]]} />
        </Evidence>
      </Sections>
    ); },
  },
  "o-focus": {
    persona: "org", name: "Areas to Focus", size: "2x2",
    Body: () => { const all = focusGroups(), g = all.slice(0, 3); return <Sections size="2x2"><Insight style={{ gap: 8 }}>{g.map((x) => <FocusRow key={x.axisKey} name={x.value} tag={x.axis} value={r0(x.score)} delta={x.change == null ? undefined : r0(x.change)} sub={`${x.struggling} of ${x.n} are struggling`} />)}</Insight>{all.length > 3 && <Evidence><MoreLine bottom={false}>{all.length - 3} more groups</MoreLine></Evidence>}</Sections>; },
  },
  "o-workmodel": { persona: "org", name: "Score by Work Model", size: "1x1", Body: () => <Only size="1x1" center><HBars rows={["Office", "Hybrid", "Home"].map((m, i) => ({ label: m, value: r0(groups("workModel").find((g) => g.value === m)?.score), color: [ds.utility.graphColors.main.orgBlue, ds.utility.graphColors.main.lavenderViolet, ds.utility.graphColors.main.turquoise][i] })).filter((r) => r.value != null)} size="1x1" values={false} noun="work models" /></Only> },
  "o-gender": { persona: "org", name: "Score by Gender", size: "1x1", Body: () => <Only size="1x1" center><HBars rows={groups("gender").filter((g) => !g.suppressed).map((g, i) => ({ label: g.value, value: r0(g.score), color: [T.teamBlue, T.hotPink, ds.utility.graphColors.main.goldenYellow, ds.text.quaternary][i] }))} size="1x1" values={false} noun="groups" /></Only> },
  "o-wellbeing": {
    persona: "org", name: "Mental Well-being", size: "2x2",
    Body: () => { const s = summary(); return (
      <Sections size="2x2">
      <Insight style={{ gap: 12, justifyContent: "center" }}>
        {WELLBEING.map(({ label }) => { const c = s.wellbeing[label], tot = WELLBEING_LEVELS.reduce((a, l) => a + c[l], 0); return (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ fontWeight: 500, color: ds.text.primary }}>{label}</span><span style={{ color: ds.text.tertiary }}><b style={{ color: ds.text.primary }}>{Math.round((c.Normal / tot) * 100)}%</b> Normal</span></div>
            <div style={{ display: "flex", height: 8, borderRadius: 6, overflow: "hidden", gap: 1 }}>{WELLBEING_LEVELS.map((l, i) => c[l] > 0 && <span key={l} title={`${l}: ${c[l]}`} style={{ flex: c[l], background: [ds.utility.likert.vGood, ds.utility.likert.good, ds.utility.likert.neutral, ds.utility.likert.bad, ds.utility.likert.veryBad][i] }} />)}</div>
          </div>
        ); })}
      </Insight>
      {/* Evidence: the key to the bar's colours. */}
      <Evidence><div style={{ display: "flex", flexWrap: "wrap", columnGap: 12, rowGap: 4 }}>{WELLBEING_LEVELS.map((l, i) => <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "12px", color: ds.text.tertiary }}><span aria-hidden="true" style={{ width: 2, height: 12, background: [ds.utility.likert.vGood, ds.utility.likert.good, ds.utility.likert.neutral, ds.utility.likert.bad, ds.utility.likert.veryBad][i] }} />{l}</span>)}</div></Evidence>
      </Sections>
    ); },
  },
  "o-performance": { persona: "org", name: "Performance (HPQ)", size: "1x1", Body: () => { const s = summary(), p = prevOrg(); return <Big value={r0(s.hpq)} unit="/100" delta={p.hpq ? r0(s.hpq) - r0(p.hpq) : undefined} />; } },
};

/* eNPS split for a round: counts and the score. */
export function enpsSplit(roundId) {
  const vals = ROUNDS.find((r) => r.id === roundId) ? summaryAnswers(roundId, "CC2.3") : [];
  const p = vals.filter((v) => v >= 9).length, d = vals.filter((v) => v <= 6).length, pa = vals.length - p - d;
  return { p, pa, d, n: vals.length, enps: vals.length ? Math.round(((p - d) / vals.length) * 100) : null };
}
export const summaryAnswers = (roundId, qid) => respondents(roundId).map((p) => p.rounds[roundId].answers[qid]).filter((v) => v != null);

/* The two SHAPE reports: their widgets in order (a familyId-like key per widget, used for the per-column layouts). */
const PERSONAL = ["p-score", "p-status", "p-history", "p-explorers", "p-wellbeing", "p-focus", "p-drivers", "p-health", "p-balance", "p-morale", "p-performance"];
const ORG = ["o-score", "o-status", "o-history", "o-explorers", "o-enps", "o-focus", "o-drivers", "o-wellbeing", "o-workmodel", "o-gender", "o-performance"];
export const SHAPE_REPORT_WIDGETS = { personal: PERSONAL, org: ORG };
export const shapeTitle = (w) => w.customTitle || SHAPE_WIDGETS[w.widgetId]?.name || w.widgetId;
export const shapeSize = (w) => SHAPE_WIDGETS[w.widgetId]?.size || "1x1";
export function ShapeWidgetBody({ widget }) {
  const def = SHAPE_WIDGETS[widget.widgetId];
  return def ? def.Body(widget) : null;
}
