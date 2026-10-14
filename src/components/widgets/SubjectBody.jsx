import { Check, AlertTriangle, X, ArrowRight } from "lucide-react";
import { T, font, band } from "../../lib/tokens.js";
import {
  TrendPill, EvidenceSegmentBar, StatusBreakdown, DriverGroupedList, driverTier, Sparkline, StatusRing, StatusRipple, RadarChart, polar, ScoreDial,
} from "./primitives.jsx";
import { IndexRing, DimensionIndex } from "./RingIndex.jsx";
import { StatusChip, DeltaPill, Headcount, ScoreHeadline, MoreLine, HistoryChart, FocusRow, GroupBars, fmtDate, date11, muted11, STATUS_COLOR } from "./widgetParts.jsx";
import { FLOURISHING_AT, STRIVING_AT, statusName, nextLine } from "../../lib/bands.js";
import { ds } from "../../lib/ds.js";
import DonutChart, { segmentColor } from "../scope/stories/DonutChart.jsx";

/* ================================================================== */
/* SUBJECT BODY — draws the widget forms in lib/subjectForms.js.         */
/* Built from the same parts as the Library catalogue (WidgetBody.jsx),   */
/* at the same two sizes: 1x1 has a 132 × ~106px content box, 2x2 has      */
/* 312 × ~286. The payload is already computed; nothing here reads data.   */
/* ================================================================== */
const col = (extra) => ({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, ...extra });

function BandSentence({ noun, f, s, t }) {
  return (
    <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>
      Across the <b style={{ color: T.gray900 }}>{f + s + t}</b> {noun}s, <b style={{ color: T.greenStrong }}>{f}</b> are Flourishing, <b style={{ color: T.amberStrong }}>{s}</b> are Striving, and <b style={{ color: T.redStrong }}>{t}</b> are Struggling.
    </span>
  );
}

const pts = (n) => `${n} point${n === 1 ? "" : "s"}`;
const B = ({ children, c }) => <b style={{ color: c || T.gray900 }}>{children}</b>;

/* ---- Score ---------------------------------------------------------------- */
function Score({ p, size }) {
  const bar = p.people ? p.people : p.parts ? { f: p.parts.f, s: p.parts.s, t: p.parts.t } : null;
  // The whole organisation: the Library's Org Score card — headcount and participation, no status chip.
  if (p.org) {
    const hc = (labelled) => <Headcount labelled={labelled} label="Employees" count={p.org.employees} rate={p.org.rate} tone={T.orgBlue} />;
    if (size === "1x1") {
      return (
        <div style={col({ justifyContent: "space-between" })}>
          <div style={{ paddingTop: 4 }}><ScoreHeadline value={p.value} delta={p.delta} size={p.value >= 100 ? 52 : 64} compact /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span style={date11}>{fmtDate(p.date)}</span>{hc(false)}</div>
        </div>
      );
    }
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span style={date11}>{fmtDate(p.date)}</span>{hc(true)}</div>
          {bar && <EvidenceSegmentBar flourishing={bar.f} striving={bar.s} struggling={bar.t} />}
          {p.people && <StatusBreakdown flourishing={p.people.f} striving={p.people.s} struggling={p.people.t} />}
        </div>
      </div>
    );
  }
  if (size === "1x1") {
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ paddingTop: 4 }}><ScoreHeadline value={p.value} delta={p.delta} size={p.value >= 100 ? 52 : 64} compact /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={date11}>{fmtDate(p.date)}</span>
          <StatusChip status={p.status} />
        </div>
      </div>
    );
  }
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={date11}>{fmtDate(p.date)}</span>
          <StatusChip status={p.status} />
        </div>
        {bar && <EvidenceSegmentBar flourishing={bar.f} striving={bar.s} struggling={bar.t} />}
        {p.people ? <StatusBreakdown flourishing={p.people.f} striving={p.people.s} struggling={p.people.t} /> : p.parts ? <BandSentence noun={p.partNoun} {...p.parts} /> : null}
        {p.strongest && p.weakest && (
          <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>
            <B>{p.strongest[0]}</B> is strongest at <B c={band(p.strongest[1]).cs}>{p.strongest[1]}</B>; <B>{p.weakest[0]}</B> is lowest at <B c={band(p.weakest[1]).cs}>{p.weakest[1]}</B>.
          </span>
        )}
      </div>
    </div>
  );
}

/* ---- Ring (was a 270° gauge; a full ring matches the Meaning story) ---- */
function GaugeForm({ p, size }) {
  if (size === "1x1") return <div style={col({ alignItems: "center", justifyContent: "center" })}><ScoreDial value={p.value} size={104} stroke={11} numberSize={26} wordSize={9} /></div>;
  const nl = nextLine(p.value), next = nl ? { at: nl, name: statusName(nl) } : null;
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><TrendPill delta={p.delta} /></div>
      <div style={{ display: "flex", justifyContent: "center" }}><ScoreDial value={p.value} size={190} stroke={18} numberSize={50} wordSize={13} /></div>
      <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>
        {next ? <><B c={band(p.value).cs}>{pts(next.at - p.value)}</B> from <B>{next.name}</B> (a score of {next.at}).</> : <>Above the Flourishing line of <B>{FLOURISHING_AT}</B> by <B c={T.greenStrong}>{pts(p.value - FLOURISHING_AT)}</B>.</>}
      </span>
    </div>
  );
}

/* ---- Status ---------------------------------------------------------------- */
function StatusForm({ p, size }) {
  const bar = p.people ? { f: p.people.f, s: p.people.s, t: p.people.t } : p.parts;
  if (size === "1x1") {
    return (
      <div style={col({ justifyContent: "center", gap: 10 })}>
        <StatusRing status={p.status} />
        {bar && <EvidenceSegmentBar flourishing={bar.f} striving={bar.s} struggling={bar.t} />}
      </div>
    );
  }
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <StatusRipple status={p.status} size={196} />
        <span style={{ fontSize: 20, fontWeight: 700, color: STATUS_COLOR[p.status], marginTop: -34, position: "relative" }}>{p.status}</span>
      </div>
      {bar && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
          <EvidenceSegmentBar flourishing={bar.f} striving={bar.s} struggling={bar.t} />
          {p.people ? <StatusBreakdown flourishing={p.people.f} striving={p.people.s} struggling={p.people.t} /> : <BandSentence noun="part" {...bar} />}
        </div>
      )}
    </div>
  );
}

/* ---- History --------------------------------------------------------------- */
function historyCaption(points) {
  const n = points.length, last = points[n - 1], prev = points[n - 2], d = last - prev;
  if (d > 0) {
    const dipped = n >= 3 && points[n - 2] < points[n - 3];
    return <>{dipped ? <>After dipping in <B>R{n - 1}</B>, the score increased by </> : <>The score increased by </>}<B c={T.greenStrong}>+{d} points</B>{!dipped && <> since <B>R{n - 1}</B></>}, reaching <B>{last}</B> in the latest round.</>;
  }
  if (d < 0) return <>The score fell by <B c={T.redStrong}>{-d} points</B> since <B>R{n - 1}</B>, to <B>{last}</B> in the latest round.</>;
  return <>The score held at <B>{last}</B> since <B>R{n - 1}</B>.</>;
}
function HistoryForm({ p, size }) {
  if (size === "1x1") {
    return (
      <div style={col({ gap: 6 })}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><TrendPill delta={p.delta} compact /></div>
        <Sparkline points={p.points} xLabels={p.labels} w={132} h={60} gridY={[0, 50, 100]} />
      </div>
    );
  }
  return (
    <div style={col({ gap: 12, justifyContent: "space-between" })}>
      <div><TrendPill delta={p.delta} /></div>
      <HistoryChart points={p.points} labels={p.labels} h={178} />
      <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>{historyCaption(p.points)}</span>
    </div>
  );
}

/* ---- Parts ------------------------------------------------------------------- */
function pickTiered(rows, perTier = 2, total = 6) {
  const by = { great: [], average: [], poor: [] };
  rows.forEach((r) => by[driverTier(r[1])].push(r));
  const mid = Math.floor(Math.max(0, by.average.length - perTier) / 2);
  const picked = [...by.great.slice(0, perTier), ...by.average.slice(mid, mid + perTier), ...by.poor.slice(-perTier)];
  const rest = rows.filter((r) => !picked.includes(r));
  while (picked.length < Math.min(total, rows.length) && rest.length) picked.push(rest.shift());
  return picked.sort((a, b) => b[1] - a[1]);
}
function PartsForm({ p, size }) {
  const rows = p.rows;
  if (size === "1x1") {
    const picked = [rows[0], rows[rows.length - 1]].map((r) => [r[0], r[1]]);
    return (
      <div style={col({ gap: 6, overflow: "hidden" })}>
        <DriverGroupedList rows={picked} tierLabels={{ great: "Top", average: "Average", poor: "Bottom" }} />
      </div>
    );
  }
  const shown = pickTiered(rows);
  return (
    <div style={col({ gap: 6, overflow: "hidden" })}>
      <DriverGroupedList rows={shown} />
      {rows.length > shown.length && <MoreLine>{rows.length - shown.length} more {p.noun}s</MoreLine>}
    </div>
  );
}

/* ---- People ---------------------------------------------------------------- */
const PEOPLE_ROWS = (q) => [
  ["Flourishing", q.f, q.pf, T.green, T.greenStrong, true],
  ["Striving", q.s, q.ps, T.amber, T.amberStrong, true],
  ["Struggling", q.t, q.pt, T.red, T.redStrong, false],
];
function PeopleForm({ p, size }) {
  const q = p.people;
  if (size === "1x1") {
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 2 }}>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -0.9, lineHeight: 1, color: T.greenStrong }}>{q.f}</span>
          <span style={muted11}>Flourishing of {q.total} people</span>
        </div>
        <EvidenceSegmentBar flourishing={q.f} striving={q.s} struggling={q.t} />
      </div>
    );
  }
  return (
    <div style={col({ gap: 24 })}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>How the <B>{q.total}</B> people who answered are spread across the three statuses.</span>
        <EvidenceSegmentBar flourishing={q.f} striving={q.s} struggling={q.t} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {PEOPLE_ROWS(q).map(([label, n, prev, c, cs, higherBetter]) => {
          const pct = Math.round((n / (q.total || 1)) * 100), prevPct = Math.round((prev / (q.total || 1)) * 100), d = pct - prevPct;
          return (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, borderLeft: `2px solid ${c}`, paddingLeft: 6 }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.gray900 }}>{label}</span>
                <span style={{ fontSize: 11, color: T.gray500 }}>{n} {n === 1 ? "person" : "people"}</span>
                {d !== 0 && <span style={{ fontSize: 11, fontWeight: 600, color: (d > 0) === higherBetter ? T.greenStrong : T.redStrong }}>{d > 0 ? "+" : "−"}{Math.abs(d)}</span>}
                <span style={{ fontSize: 16, fontWeight: 700, color: cs, minWidth: 40, textAlign: "right" }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: T.gray50 }}><div style={{ height: 6, width: `${pct}%`, borderRadius: 4, background: c }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Groups ---------------------------------------------------------------- */
function GroupsForm({ p }) {
  return (
    <div style={col({ gap: 8, justifyContent: "space-between" })}>
      <div style={{ display: "flex", flexDirection: "column", height: Math.min(236, p.rows.length * 34 + 22) }}><GroupBars rows={p.rows} /></div>
      <span style={{ ...muted11, fontSize: 10 }}>{p.axisLabel}{p.hidden ? ` · ${p.hidden} group${p.hidden === 1 ? "" : "s"} under 5 people not shown` : ""}</span>
    </div>
  );
}

/* ---- Composition (Figma 11318:27838 and the 1x1s beside it) ----------------------- */
/* Who is in the organisation: a ring of one grouping with the axis icon and name inside and "Largest Group …" under it
   (2x2); a few groups on a 1x1 are headcount tiles over a proportion bar, many groups a small ring and the same line. */
const largestText = (p) => (p.largest ? `${p.largest.group} (${p.largest.pct}%)` : "No one to show");
const quiet12 = { fontSize: 11, lineHeight: "12px", color: ds.text.quaternary };
function CompositionForm({ p, size }) {
  const rows = p.rows;
  if (!rows.length) return <span style={muted11}>No one to show yet.</span>;
  if (size === "2x2") {
    return (
      <div style={col({ alignItems: "center", gap: 6 })}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
          <DonutChart axisKey={p.axis} label={p.axisLabel} rows={rows} size={180} />
        </div>
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
          <span style={quiet12}>Largest Group</span>
          <span style={quiet12}>{largestText(p)}</span>
        </div>
      </div>
    );
  }
  if (rows.length <= 4) {
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {rows.map((r, i) => (
            <div key={r.group} title={`${r.group}: ${r.n} people (${r.pct}%)`} style={{ minWidth: 0, borderLeft: `2px solid ${segmentColor(p.axis, i)}`, padding: "2px 0 2px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 11, lineHeight: "12px", color: ds.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.group}</span>
              <span style={{ fontSize: 16, lineHeight: "20px", fontWeight: 700, color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{r.n}</span>
            </div>
          ))}
        </div>
        <div role="img" aria-label={rows.map((r) => `${r.group} ${r.pct}%`).join(", ")} style={{ display: "flex", gap: 1, height: 8, borderRadius: 9999, overflow: "hidden" }}>
          {rows.map((r, i) => <span key={r.group} style={{ flex: r.n, background: segmentColor(p.axis, i) }} />)}
        </div>
      </div>
    );
  }
  return (
    <div style={col({ alignItems: "center", gap: 6 })}>
      <DonutChart axisKey={p.axis} label={p.name} rows={rows} size={75} bare />
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
        <span style={quiet12}>Largest Group</span>
        <span style={{ ...quiet12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{largestText(p)}</span>
      </div>
    </div>
  );
}

/* ---- Focus ----------------------------------------------------------------- */
function FocusForm({ p, size }) {
  const rows = p.rows;
  if (!rows.length) return <span style={muted11}>No group has 5 or more people to compare.</span>;
  if (size === "1x1") {
    const g = rows[0], b = band(g.score);
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ ...muted11, fontSize: 10 }}>{g.axis}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.gray900, lineHeight: "16px" }}>{g.group}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -0.9, lineHeight: 1, color: b.cs }}>{g.score}</span>
          <span style={{ ...muted11, fontSize: 10 }}>{g.struggling} of {g.n} struggling</span>
        </div>
      </div>
    );
  }
  return (
    <div style={col({ gap: 14, justifyContent: "space-between" })}>
      <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>The lowest-scoring group on each way of splitting people. Groups under 5 people are never shown.</span>
      {rows.map((g) => <FocusRow key={`${g.axis}-${g.group}`} name={g.group} value={g.score} tag={g.axis} delta={g.change ?? undefined} sub={`${g.struggling} of ${g.n} people are struggling`} />)}
    </div>
  );
}

/* ---- Movers ---------------------------------------------------------------- */
function MoversForm({ p, size }) {
  const { gains, drops } = p;
  if (size === "1x1") {
    const top = [...gains, ...drops].sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
    if (!top) return <span style={muted11}>Nothing moved since the last round.</span>;
    const up = top.d > 0;
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: up ? T.greenStrong : T.redStrong }}>{up ? "Biggest rise" : "Biggest drop"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.gray900, lineHeight: "16px" }}>{top.label}</span>
        </div>
        <ScoreHeadline value={top.value} delta={top.d} size={44} compact />
      </div>
    );
  }
  const list = (heading, color, rows, empty) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{heading}</span>
      {rows.length === 0 ? <span style={muted11}>{empty}</span> : rows.map((r) => <FocusRow key={r.label} name={r.label} value={r.value} delta={r.d} />)}
    </div>
  );
  return (
    <div style={col({ gap: 18 })}>
      {list("Biggest gains", T.greenStrong, gains, "Nothing has risen.")}
      {list("Biggest drops", T.redStrong, drops, "Nothing has dropped.")}
      <span style={{ ...muted11, fontSize: 10, marginTop: "auto" }}>Change in score since the last round, by {p.noun.toLowerCase()}.</span>
    </div>
  );
}

/* ---- Spread ---------------------------------------------------------------- */
function Bars({ bins, h }) {
  const max = Math.max(...bins.map((b) => b.n), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: h }}>
      {bins.map((b) => <div key={b.from} title={`${b.from}–${b.to}: ${b.n}`} style={{ flex: 1, height: Math.max(b.n ? 3 : 0, (b.n / max) * h), borderRadius: "2px 2px 0 0", background: band(b.from + 5).c }} />)}
    </div>
  );
}
function SpreadForm({ p, size }) {
  if (size === "1x1") {
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <Bars bins={p.bins} h={54} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: band(p.median).cs }}>{p.median}</span>
          <span style={{ ...muted11, fontSize: 10 }}>middle score</span>
        </div>
      </div>
    );
  }
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>Where each of the <B>{p.total}</B> people landed, ten points per bar.</span>
      <div>
        <Bars bins={p.bins} h={150} />
        <div style={{ height: 1, background: T.gray100 }} />
        <div style={{ position: "relative", height: 14, marginTop: 4, fontSize: 9, color: T.gray300 }}>
          {[[0, "0"], [STRIVING_AT, String(STRIVING_AT)], [FLOURISHING_AT, String(FLOURISHING_AT)], [100, "100"]].map(([at, t], i, a) => <span key={t} style={{ position: "absolute", left: `${at}%`, transform: i === 0 ? "none" : i === a.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}>{t}</span>)}
        </div>
      </div>
      <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>Half of people score between <B>{p.p25}</B> and <B>{p.p75}</B>. The middle score is <B c={band(p.median).cs}>{p.median}</B>.</span>
    </div>
  );
}

/* ---- Goal ------------------------------------------------------------------ */
function Track({ value, target, h = 8 }) {
  return (
    <div style={{ position: "relative", height: h + 12, marginTop: 4 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 6, height: h, borderRadius: h, background: T.gray75 }} />
      <div style={{ position: "absolute", left: 0, top: 6, width: `${value}%`, height: h, borderRadius: h, background: band(value).c }} />
      <div title={`Target ${target}`} style={{ position: "absolute", left: `${target}%`, top: 0, width: 2, height: h + 12, marginLeft: -1, background: T.gray900 }} />
    </div>
  );
}
function GoalForm({ p, size }) {
  const reached = p.gap <= 0;
  if (size === "1x1") {
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 2 }}>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -0.9, lineHeight: 1, color: reached ? T.greenStrong : band(p.value).cs }}>{reached ? "✓" : p.gap}</span>
          <span style={muted11}>{reached ? `above the target of ${p.target}` : `${p.gap === 1 ? "point" : "points"} to reach ${p.target}`}</span>
        </div>
        <Track value={p.value} target={p.target} />
      </div>
    );
  }
  const stat = (label, v, c) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={muted11}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.6, lineHeight: "36px", color: c }}>{v}</span>
    </div>
  );
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <div style={{ display: "flex", gap: 28 }}>
        {stat("Now", p.value, band(p.value).cs)}
        {stat("Target", p.target, T.gray900)}
        {stat(reached ? "Ahead by" : "Gap", Math.abs(p.gap), reached ? T.greenStrong : band(p.value).cs)}
      </div>
      <div>
        <Track value={p.value} target={p.target} h={10} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.gray300, marginTop: 2 }}><span>0</span><span>100</span></div>
      </div>
      <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>
        {reached ? <>Already at or above <B>{p.target}</B>.</>
          : p.rounds == null ? <>The score has not been rising across {p.nRounds} rounds, so there is no pace to project.</>
          : p.rounds > 12 ? <>At the pace of past rounds (<B>{p.pace > 0 ? "+" : ""}{p.pace}</B> a round) this would take <B>more than 12 rounds</B> — a smaller target may be a better next step.</>
          : <>At the pace of past rounds (<B>+{p.pace}</B> a round) this would take about <B>{p.rounds} more round{p.rounds === 1 ? "" : "s"}</B>. A straight line from {p.nRounds} rounds, not a forecast.</>}
      </span>
    </div>
  );
}


/* ================================================================== */
/* The overall picture, and cases with a point of view                  */
/* ================================================================== */
const BG = { Flourishing: T.greenBg, Striving: T.amberBg, Struggling: T.redBg };
const tint = (v) => (v >= FLOURISHING_AT ? T.greenBg : v >= STRIVING_AT ? T.amberBg : T.redBg);
const IDENT = [T.teamBlue, T.hotPink]; // identity colours for "this vs that" — categories, never status
const hair = { height: 1, background: T.gray75, flexShrink: 0 };
const eyebrow = { fontSize: 10, fontWeight: 600, color: T.gray500, letterSpacing: "0.3px", textTransform: "uppercase" };

/* ---- Story (3x3) ---------------------------------------------------------- */
function StoryForm({ p }) {
  const bar = p.people ? p.people : null;
  const tiered = p.rows ? pickTiered(p.rows, 1, 3) : null;
  const d = p.delta;
  return (
    <div style={col({ gap: 16 })}>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <ScoreHeadline value={p.value} delta={p.delta} size={76} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><StatusChip status={p.status} /><span style={date11}>{fmtDate(p.date)}</span></div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 600, lineHeight: "22px", color: T.gray900, textWrap: "balance" }}>{p.headline}</span>
          <span style={{ fontSize: 12, color: T.gray500, lineHeight: "17px" }}>{d > 0 ? `Up ${d}` : d < 0 ? `Down ${-d}` : "No change"} since the last round.</span>
          {bar && <><EvidenceSegmentBar flourishing={bar.f} striving={bar.s} struggling={bar.t} /><StatusBreakdown flourishing={bar.f} striving={bar.s} struggling={bar.t} /></>}
        </div>
      </div>
      <div style={hair} />
      <div style={{ display: "grid", gridTemplateColumns: tiered ? "1fr 1fr" : "1fr", gap: 24, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={eyebrow}>Round by round</span>
          <HistoryChart points={p.points} labels={p.labels} w={226} h={138} />
        </div>
        {tiered && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <span style={eyebrow}>{p.noun}s</span>
            <DriverGroupedList rows={tiered} />
          </div>
        )}
      </div>
      <div style={hair} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
        {p.facts.map((f) => (
          <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span style={eyebrow}>{f.label}</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.value}</span>
              {f.num != null && <span style={{ fontSize: 14, fontWeight: 700, color: band(f.num).cs }}>{f.num}</span>}
            </span>
            <span style={{ ...muted11, fontSize: 10.5 }}>{f.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Index ---------------------------------------------------------------- */
function IndexForm({ p, size }) {
  return <div style={col({ justifyContent: "center", overflow: "hidden" })}>{p.dimension ? <DimensionIndex dimension={p.dimension} variant={size} /> : <IndexRing variant={size} overall={p.value} />}</div>;
}

/* ---- Team ---------------------------------------------------------------- */
function TeamForm({ p, size }) {
  const q = p.people;
  const vs = p.vs;
  const vsText = vs === 0 ? "level with the organisation" : `${Math.abs(vs)} ${Math.abs(vs) === 1 ? "point" : "points"} ${vs > 0 ? "above" : "below"} the organisation`;
  if (size === "1x1") {
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ paddingTop: 4 }}><ScoreHeadline value={p.value} delta={p.delta} size={p.value >= 100 ? 52 : 64} compact /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={date11}>{p.n} people</span>
          <span style={{ ...muted11, fontSize: 10, lineHeight: "13px" }}><b style={{ color: vs >= 0 ? T.greenStrong : T.redStrong }}>{vs > 0 ? "+" : vs < 0 ? "−" : ""}{Math.abs(vs)}</b> vs Org</span>
        </div>
      </div>
    );
  }
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={date11}>{p.axisLabel} · <b>{p.n} people</b></span>
          <StatusChip status={p.status} />
        </div>
        <EvidenceSegmentBar flourishing={q.f} striving={q.s} struggling={q.t} />
        <StatusBreakdown flourishing={q.f} striving={q.s} struggling={q.t} />
        <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>This is <B c={vs >= 0 ? T.greenStrong : T.redStrong}>{vsText}</B>, which scores <B c={band(p.org).cs}>{p.org}</B>.</span>
      </div>
    </div>
  );
}

/* ---- Versus -------------------------------------------------------------- */
function Side({ g, color, align }) {
  const b = band(g.value);
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, alignItems: align }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.gray900, maxWidth: "100%" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span></span>
      <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: b.cs }}>{g.value}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><TrendPill delta={g.delta} compact /><span style={muted11}>{g.n} people</span></span>
    </div>
  );
}
function VersusForm({ p }) {
  const hi = p.gap >= 0 ? p.a : p.b, lo = p.gap >= 0 ? p.b : p.a, gap = Math.abs(p.gap);
  return (
    <div style={col({ gap: 14, justifyContent: "space-between" })}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Side g={p.a} color={IDENT[0]} align="flex-start" />
        <div style={{ alignSelf: "center", textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: T.gray300, fontWeight: 600 }}>VS</div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: "26px", color: gap === 0 ? T.gray500 : T.gray900 }}>{gap}</div>
          <div style={{ fontSize: 9, color: T.gray500 }}>{gap === 1 ? "point" : "points"}</div>
        </div>
        <Side g={p.b} color={IDENT[1]} align="flex-end" />
      </div>
      <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>
        {gap === 0 ? <>Both score the same.</> : <><B>{hi.name}</B> scores <B>{gap} {gap === 1 ? "point" : "points"}</B> higher than <B>{lo.name}</B> ({p.axisLabel.toLowerCase()}).</>}
      </span>
      {p.rows && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={eyebrow}>Where they differ most</span>
          {p.rows.map((r) => (
            <div key={r.label} style={{ display: "grid", gridTemplateColumns: "104px minmax(0, 1fr)", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10.5, color: T.gray700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              <div style={{ position: "relative", height: 14 }}>
                <span style={{ position: "absolute", left: 0, right: 0, top: 6, height: 2, background: T.gray75 }} />
                <span style={{ position: "absolute", left: `${Math.min(r.a, r.b)}%`, width: `${Math.abs(r.a - r.b)}%`, top: 6, height: 2, background: T.gray300 }} />
                {[[r.a, IDENT[0]], [r.b, IDENT[1]]].map(([v, c], i) => <span key={i} title={`${i ? p.b.name : p.a.name}: ${v}`} style={{ position: "absolute", top: 1, left: `${v}%`, width: 12, height: 12, marginLeft: -6, borderRadius: "50%", background: c, boxShadow: `0 0 0 2px ${T.white}` }} />)}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.gray300, paddingLeft: 112 }}><span>0</span><span>50</span><span>100</span></div>
        </div>
      )}
    </div>
  );
}

/* ---- Head to head ---------------------------------------------------------- */
function DuelChart({ items, labels, w = 312, h = 126 }) {
  const gx = 22, top = 6, bottom = 16, plotW = w - gx - 8, plotH = h - top - bottom;
  const x = (i) => gx + (items[0].points.length === 1 ? plotW / 2 : (i / (items[0].points.length - 1)) * plotW);
  const y = (v) => top + plotH - (v / 100) * plotH;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      {[0, 25, 50, 75, 100].map((g) => <g key={g}><line x1={gx} x2={w} y1={y(g)} y2={y(g)} stroke={T.gray75} /><text x="0" y={y(g) + 3} fontSize="8" fill={T.gray300}>{g}</text></g>)}
      {items.map((it, k) => (
        <g key={it.label}>
          <path d={it.points.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ")} fill="none" stroke={IDENT[k]} strokeWidth="2" />
          {it.points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === it.points.length - 1 ? 4 : 2.5} fill={IDENT[k]} stroke={T.white} strokeWidth="1.5" />)}
        </g>
      ))}
      {labels.map((l, i) => <text key={l} x={x(i)} y={h - 2} fontSize="9" textAnchor="middle" fill={T.gray300}>{l}</text>)}
    </svg>
  );
}
function DuelForm({ p }) {
  const [A, Bi] = p.items, gap = Math.abs(p.gap), hi = p.gap >= 0 ? A : Bi, lo = p.gap >= 0 ? Bi : A;
  const strength = Math.abs(p.r) >= 0.6 ? "strong" : Math.abs(p.r) >= 0.3 ? "moderate" : "weak";
  return (
    <div style={col({ gap: 12, justifyContent: "space-between" })}>
      <div style={{ display: "flex", gap: 12 }}>
        {p.items.map((it, k) => (
          <div key={it.label} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.gray900 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: IDENT[k], flexShrink: 0 }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span></span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -0.9, lineHeight: 1, color: band(it.value).cs }}>{it.value}</span>
              <TrendPill delta={it.delta} compact />
            </span>
          </div>
        ))}
      </div>
      <DuelChart items={p.items} labels={p.labels} />
      <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>
        {gap === 0 ? <>Both score the same today.</> : <><B>{hi.label}</B> is <B>{gap} {gap === 1 ? "point" : "points"}</B> above <B>{lo.label}</B>.</>}{" "}
        People who score high on one {p.r >= 0 ? "tend to score high on the other" : "tend to score low on the other"} — a <B>{strength}</B> link (r = {p.r}). A link, not a cause.
      </span>
    </div>
  );
}

/* ---- Health check ------------------------------------------------------------- */
const CHECK_STYLE = { pass: { bg: T.greenBg, c: T.greenStrong, Icon: Check }, warn: { bg: T.amberBg, c: T.amberStrong, Icon: AlertTriangle }, fail: { bg: T.redBg, c: T.redStrong, Icon: X } };
function CheckForm({ p }) {
  const ratio = p.passed / p.checks.length;
  const c = ratio >= 0.8 ? T.greenStrong : ratio >= 0.5 ? T.amberStrong : T.redStrong;
  return (
    <div style={col({ gap: 14 })}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -0.9, lineHeight: 1, color: c }}>{p.passed}<span style={{ fontSize: 22, color: T.gray300 }}>/{p.checks.length}</span></span>
        <span style={{ fontSize: 12, color: T.gray500 }}>checks passing</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {p.checks.map((k, i) => {
          const s = CHECK_STYLE[k.state];
          return (
            <div key={k.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i ? `1px solid ${T.gray50}` : "none" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: s.bg, color: s.c, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><s.Icon size={12} strokeWidth={2.6} /></span>
              <span style={{ flex: 1, fontSize: 12, color: T.gray900, minWidth: 0 }}>{k.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.c, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{k.detail}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- What if ------------------------------------------------------------------- */
function WhatIfForm({ p }) {
  const b0 = band(p.value), b1 = band(p.after), gain = p.after - p.value;
  return (
    <div style={col({ gap: 14, justifyContent: "space-between" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={eyebrow}>Now</span><span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: b0.cs }}>{p.value}</span></div>
        <ArrowRight size={22} color={T.gray300} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={eyebrow}>If lifted</span><span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: b1.cs }}>{p.after}</span></div>
        <div style={{ marginLeft: "auto", alignSelf: "flex-start" }}>{gain !== 0 ? <TrendPill delta={gain} numberOnly /> : null}</div>
      </div>
      {p.lifted.length === 0 ? (
        <span style={{ fontSize: 12, color: T.gray500 }}>Every {p.noun.toLowerCase()} is already at 70 or more, so there is nothing to lift.</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={eyebrow}>The {p.lift === 1 ? "weakest" : `${p.lifted.length} weakest`} {p.noun.toLowerCase()}{p.lifted.length === 1 ? "" : "s"}, brought to 70</span>
          {p.lifted.map((r) => (
            <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.gray900 }}>{r.label}</span>
                <span style={{ fontSize: 12, color: T.gray500 }}><b style={{ color: band(r.from).cs }}>{r.from}</b> → <b style={{ color: band(r.to).cs }}>{r.to}</b></span>
              </div>
              <div style={{ position: "relative", height: 6, borderRadius: 4, background: T.gray50 }}>
                <span style={{ position: "absolute", left: 0, width: `${r.to}%`, top: 0, height: 6, borderRadius: 4, background: band(r.to).c, opacity: 0.28 }} />
                <span style={{ position: "absolute", left: 0, width: `${r.from}%`, top: 0, height: 6, borderRadius: 4, background: band(r.from).c }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <span style={{ fontSize: 10.5, color: T.gray500, lineHeight: "15px" }}>Plain arithmetic: the score is the average of its {p.n} {p.noun.toLowerCase()}s. It shows what lifting them would add up to — not a prediction that it will happen.</span>
    </div>
  );
}

/* ---- Heat strip ------------------------------------------------------------------ */
/* The card's content box is ~286px: a 16px header row, then rows. More than 11 parts can't fit, so the weakest
   9 (the ones worth a look) show and a "N more" line says the rest exist (the same line the Parts widget uses). */
const HEAT_FIT = 11;
function HeatForm({ p }) {
  const all = p.rows;
  const capped = all.length > HEAT_FIT;
  const rows = capped ? all.slice(-(HEAT_FIT - 2)) : all;
  const rowH = 22;
  return (
    <div style={col({ gap: 4, minHeight: 0, overflow: "hidden" })}>
      <div style={{ display: "grid", gridTemplateColumns: `minmax(0, 1fr) repeat(${p.labels.length}, 44px)`, gap: 4, paddingBottom: 2 }}>
        <span />
        {p.labels.map((l) => <span key={l} style={{ fontSize: 10, color: T.gray500, textAlign: "center" }}>{l}</span>)}
      </div>
      {rows.map(([label, vals]) => (
        <div key={label} style={{ display: "grid", gridTemplateColumns: `minmax(0, 1fr) repeat(${p.labels.length}, 44px)`, gap: 4, alignItems: "center", height: rowH }}>
          <span style={{ fontSize: 11, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          {vals.map((v, i) => (
            <span key={i} title={`${label}, ${p.labels[i]}: ${v}`} style={{ height: rowH - 4, borderRadius: 5, background: tint(v), color: band(v).cs, fontSize: 11, fontWeight: i === vals.length - 1 ? 700 : 500, display: "flex", alignItems: "center", justifyContent: "center", fontVariantNumeric: "tabular-nums" }}>{v}</span>
          ))}
        </div>
      ))}
      {capped && <MoreLine>{all.length - rows.length} more {p.noun}s</MoreLine>}
    </div>
  );
}

/* ---- Momentum -------------------------------------------------------------------- */
const sgn = (d) => (d > 0 ? `+${d}` : d < 0 ? `−${-d}` : "0");
const dcol = (d) => (d > 0 ? T.greenStrong : d < 0 ? T.redStrong : T.gray500);
function MomentumForm({ p, size }) {
  const run = p.streak >= 2 ? `Rising ${p.streak} rounds in a row` : p.fall >= 2 ? `Falling ${p.fall} rounds in a row` : p.streak === 1 ? "Up on the last round" : p.fall === 1 ? "Down on the last round" : "Flat on the last round";
  if (size === "1x1") {
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 2 }}>
          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: dcol(p.change) }}>{sgn(p.change)}</span>
          <span style={muted11}>since the first round</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: dcol(p.streak ? 1 : p.fall ? -1 : 0), lineHeight: "14px" }}>{run}</span>
      </div>
    );
  }
  const maxAbs = Math.max(4, ...p.steps.map((s) => Math.abs(s.d)));
  return (
    <div style={col({ gap: 16, justifyContent: "space-between" })}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1, color: dcol(p.change) }}>{sgn(p.change)}</span>
        <span style={{ fontSize: 12, color: T.gray500, lineHeight: "16px" }}>points since the first round<br /><b style={{ color: T.gray900 }}>{p.first}</b> → <b style={{ color: band(p.value).cs }}>{p.value}</b></span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={eyebrow}>Round on round</span>
        {p.steps.map((s) => (
          <div key={s.label} style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) 30px", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.gray500 }}>{s.label}</span>
            <div style={{ position: "relative", height: 8 }}>
              <span style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: T.gray100 }} />
              <span style={{ position: "absolute", top: 1, height: 6, borderRadius: 3, background: s.d >= 0 ? T.green : T.red, ...(s.d >= 0 ? { left: "50%", width: `${(s.d / maxAbs) * 50}%` } : { right: "50%", width: `${(-s.d / maxAbs) * 50}%` }) }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: dcol(s.d), textAlign: "right" }}>{sgn(s.d)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: dcol(p.streak ? 1 : p.fall ? -1 : 0) }}>{run}</span>
        {p.riser && p.riser.d > 0 && <span style={{ fontSize: 11, color: T.gray500 }}>Most improved: <B>{p.riser.label}</B> <B c={T.greenStrong}>{sgn(p.riser.d)}</B></span>}
        {p.faller && p.faller.d < 0 && <span style={{ fontSize: 11, color: T.gray500 }}>Furthest down: <B>{p.faller.label}</B> <B c={T.redStrong}>{sgn(p.faller.d)}</B></span>}
      </div>
    </div>
  );
}

const RENDER = { composition: CompositionForm, story: StoryForm, index: IndexForm, team: TeamForm, versus: VersusForm, duel: DuelForm, check: CheckForm, whatif: WhatIfForm, heat: HeatForm, momentum: MomentumForm, score: Score, gauge: GaugeForm, status: StatusForm, history: HistoryForm, parts: PartsForm, people: PeopleForm, groups: GroupsForm, focus: FocusForm, movers: MoversForm, spread: SpreadForm, goal: GoalForm };

export default function SubjectBody({ spec }) {
  const { form, payload, size } = spec;
  if (form === "profile") return <RadarChart items={payload.items} />;
  const View = RENDER[form] || Score;
  return <View p={payload} size={size} />;
}
