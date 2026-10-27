import { Check, AlertTriangle, X, ArrowRight } from "lucide-react";
import { T, font, band } from "../../lib/tokens.js";
import {
  TrendPill, EvidenceSegmentBar, StatusBreakdown, DriverGroupedList, driverTier, Sparkline, RadarChart, polar, ScoreDial,
  Sections, Insight, Evidence,
} from "./primitives.jsx";
import { Index, IndexRing, DimensionIndex } from "./RingIndex.jsx";
import { StatusChip, DeltaPill, Headcount, ScoreHeadline, MoreLine, HistoryChart, FocusRow, Footnote, fmtDate, date11, muted11, STATUS_COLOR } from "./widgetParts.jsx";
import { FLOURISHING_AT, STRIVING_AT, statusName, nextLine } from "../../lib/bands.js";
import { ds } from "../../lib/ds.js";
import GraphInsight, { HistoryCaption } from "./GraphInsight.jsx";
import { StatusView } from "./StatusCard.jsx";
import { BarStatement } from "./ScoreCard.jsx";
import { segmentColor } from "../scope/stories/DonutChart.jsx";
import { HBars, VBars, TileGrid, CompositionInsight } from "./ChartInsight.jsx";

/* ================================================================== */
/* SUBJECT BODY — draws the widget forms in lib/subjectForms.js.         */
/* Built from the same parts as the Library catalogue (WidgetBody.jsx),   */
/* at the same two sizes: 1x1 has a 132 × ~106px content box, 2x2 has      */
/* 312 × ~286. The payload is already computed; nothing here reads data.   */
/* ================================================================== */
const col = (extra) => ({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, ...extra });
/* Every form is drawn in the widget sections (lib/widgetStructure.js): an Insight, then an Evidence Bar (1x1, 24px) or
   Evidence Section (2x2 / 3x3, 68px) when there is something to back it up. Summary sentences and footnotes are Evidence. */
const Only = ({ size, children, style, center }) => <Sections size={size}><Insight style={style} center={center}>{children}</Insight></Sections>;
const Two = ({ size, insight, evidence, style, center }) => <Sections size={size}><Insight style={style} center={center}>{insight}</Insight>{evidence && <Evidence>{evidence}</Evidence>}</Sections>;
const sentence = { fontSize: 11, color: ds.text.tertiary, lineHeight: "16px" };

const pts = (n) => `${n} point${n === 1 ? "" : "s"}`;
const B = ({ children, c }) => <b style={{ color: c || ds.text.primary }}>{children}</b>;

/* ---- Score ---------------------------------------------------------------- */
function Score({ p, size }) {
  const bar = p.people ? p.people : p.parts ? { f: p.parts.f, s: p.parts.s, t: p.parts.t } : null;
  // The whole organisation: the Library's Org Score card — headcount and participation, no status chip.
  if (p.org) {
    const hc = (labelled) => <Headcount labelled={labelled} label="Employees" count={p.org.employees} rate={p.org.rate} tone={ds.utility.graphColors.main.orgBlue} />;
    if (size === "1x1") {
      return (
        <Sections size="1x1">
          <Insight style={{ justifyContent: "space-between" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} size={p.value >= 100 ? 48 : 64} compact /></div>
            <span style={date11}>{fmtDate(p.date)}</span>
          </Insight>
          <Evidence>{hc(false)}</Evidence>
        </Sections>
      );
    }
    return (
      <Sections size={size}>
        <Insight style={{ justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span style={date11}>{fmtDate(p.date)}</span>{hc(true)}</div>
        </Insight>
        {bar && (
          <Evidence style={{ gap: 12 }}>
            <EvidenceSegmentBar flourishing={bar.f} striving={bar.s} struggling={bar.t} />
            {p.people && <StatusBreakdown flourishing={p.people.f} striving={p.people.s} struggling={p.people.t} />}
          </Evidence>
        )}
      </Sections>
    );
  }
  if (size === "1x1") {
    // Board example (15489:3046): the number and its date in the Insight, the status in the Evidence Bar.
    return (
      <Sections size="1x1">
        <Insight style={{ justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} size={p.value >= 100 ? 48 : 64} compact /></div>
          <span style={date11}>{fmtDate(p.date)}</span>
        </Insight>
        <Evidence><StatusChip status={p.status} /></Evidence>
      </Sections>
    );
  }
  return (
    <Sections size={size}>
      <Insight style={{ justifyContent: "space-between" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={date11}>{fmtDate(p.date)}</span>
          <StatusChip status={p.status} />
          {p.strongest && p.weakest && (
            <span style={sentence}>
              <B>{p.strongest[0]}</B> is strongest at <B c={band(p.strongest[1]).cs}>{p.strongest[1]}</B>; <B>{p.weakest[0]}</B> is lowest at <B c={band(p.weakest[1]).cs}>{p.weakest[1]}</B>.
            </span>
          )}
        </div>
      </Insight>
      {p.people ? (
        <Evidence style={{ gap: 12 }}>
          <EvidenceSegmentBar flourishing={p.people.f} striving={p.people.s} struggling={p.people.t} />
          <StatusBreakdown flourishing={p.people.f} striving={p.people.s} struggling={p.people.t} />
        </Evidence>
      ) : p.parts ? <Evidence><BarStatement noun={`${p.partNoun}s`} {...p.parts} /></Evidence> : null}
    </Sections>
  );
}

/* ---- Ring (was a 270° gauge; a full ring matches the Meaning story) ---- */
function GaugeForm({ p, size }) {
  if (size === "1x1") return <Only size="1x1" center style={{ alignItems: "center" }}><ScoreDial value={p.value} size={100} stroke={11} numberSize={26} wordSize={9} /></Only>;
  const nl = nextLine(p.value), next = nl ? { at: nl, name: statusName(nl) } : null;
  return (
    <Two size={size} style={{ position: "relative", alignItems: "center", justifyContent: "center" }}
      insight={<><div style={{ position: "absolute", top: 0, right: 0 }}><TrendPill delta={p.delta} /></div><ScoreDial value={p.value} size={180} stroke={18} numberSize={48} wordSize={13} /></>}
      evidence={<span style={sentence}>{next ? <><B c={band(p.value).cs}>{pts(next.at - p.value)}</B> from <B>{next.name}</B> (a score of {next.at}).</> : <>Above the Flourishing line of <B>{FLOURISHING_AT}</B> by <B c={ds.status.success.textIndicator}>{pts(p.value - FLOURISHING_AT)}</B>.</>}</span>} />
  );
}

/* ---- Status ---------------------------------------------------------------- */
/* The Status card's drawing (widgets/StatusCard.jsx). A builder subject is a population, so its bar is its people; a
   subject with no per-person scores (a concept) splits its parts instead. */
function StatusForm({ p, size }) {
  return <StatusView size={size} status={p.status} people={p.people} parts={p.people ? null : p.parts} partsNoun={p.partNoun ? `${p.partNoun}s` : "parts"} />;
}

/* ---- History --------------------------------------------------------------- */
function HistoryForm({ p, size }) {
  return <GraphInsight series={[{ points: p.points }]} labels={p.labels} size={size} delta={p.delta} evidence={<HistoryCaption points={p.points} labels={p.labels} />} />;
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
      <Only size="1x1">
        <DriverGroupedList rows={picked} tierLabels={{ great: "Top", average: "Average", poor: "Bottom" }} />
        {rows.length > 2 && <MoreLine>{rows.length - 2} more {p.noun}s</MoreLine>}
      </Only>
    );
  }
  const shown = pickTiered(rows);
  return (
    <Only size={size} style={{ gap: 6 }}>
      <DriverGroupedList rows={shown} />
      {rows.length > shown.length && <MoreLine>{rows.length - shown.length} more {p.noun}s</MoreLine>}
    </Only>
  );
}

/* ---- People ---------------------------------------------------------------- */
const PEOPLE_ROWS = (q) => [
  ["Flourishing", q.f, q.pf, ds.status.success.text, ds.status.success.textIndicator, true],
  ["Striving", q.s, q.ps, ds.status.warning.text, ds.status.warning.textIndicator, true],
  ["Struggling", q.t, q.pt, ds.status.error.text, ds.status.error.textIndicator, false],
];
function PeopleForm({ p, size }) {
  const q = p.people;
  if (size === "1x1") {
    return (
      <Two size="1x1" center
        insight={<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.96, lineHeight: 1, color: ds.status.success.textIndicator }}>{q.f}</span>
          <span style={muted11}>Flourishing of {q.total} people</span>
        </div>}
        evidence={<EvidenceSegmentBar flourishing={q.f} striving={q.s} struggling={q.t} />} />
    );
  }
  return (
    <Sections size={size}>
      <Insight center>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PEOPLE_ROWS(q).map(([label, n, prev, c, cs, higherBetter]) => {
          const pct = Math.round((n / (q.total || 1)) * 100), prevPct = Math.round((prev / (q.total || 1)) * 100), d = pct - prevPct;
          return (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, borderLeft: `2px solid ${c}`, paddingLeft: 6 }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: ds.text.primary }}>{label}</span>
                <span style={{ fontSize: 11, color: ds.text.tertiary }}>{n} {n === 1 ? "person" : "people"}</span>
                {d !== 0 && <span style={{ fontSize: 11, fontWeight: 700, color: (d > 0) === higherBetter ? ds.status.success.textIndicator : ds.status.error.textIndicator }}>{d > 0 ? "+" : "−"}{Math.abs(d)}</span>}
                <span style={{ fontSize: 16, fontWeight: 700, color: cs, minWidth: 40, textAlign: "right" }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: ds.bg.primary }}><div style={{ height: 6, width: `${pct}%`, borderRadius: 4, background: c }} /></div>
            </div>
          );
        })}
      </div>
      </Insight>
      <Evidence>
        <EvidenceSegmentBar flourishing={q.f} striving={q.s} struggling={q.t} />
      </Evidence>
    </Sections>
  );
}

/* ---- Groups ---------------------------------------------------------------- */
/* Chart rules, horizontal bars (Comparison): one 0–100 scale, 2x2 up to 13 groups ("N more" past that), value labels
   in the bar's colour. Bars are coloured by the score's status band, the same as every other score in the product. */
function GroupsForm({ p }) {
  const rows = p.rows.map(([label, value]) => ({ label, value, color: band(value).c }));
  return (
    <Only size="2x2" center><HBars rows={rows} size="2x2" values noun="groups" /></Only>
  );
}

/* ---- Composition (Figma 11318:27838; chart rules: compact grid / donut) ---------------------------------------------
   Who is in the organisation, as parts of a whole. 1x1: up to 4 groups are headcount tiles over a proportion bar; 5 to 7
   a bare ring with the Largest Group callout; more than 7 can't be a 1x1 (the builder grows it, see subjectForms.js).
   2x2: the ring with the axis icon and name inside, the callout, and a three-column legend while it stays readable. */
function CompositionForm({ p, size }) {
  const rows = p.rows;
  if (!rows.length) return <Only size={size} center><span style={muted11}>No one to show yet.</span></Only>;
  // The Composition widget's own drawing (ChartInsight.jsx CompositionInsight): a grid up to 4 groups at 1x1, else a donut.
  return <CompositionInsight rows={rows} axisKey={p.axis} label={size === "1x1" ? p.name : p.axisLabel} size={size === "1x1" ? "1x1" : "2x2"} form={size === "1x1" && rows.length <= 4 ? "grid" : "donut"} legend={size !== "1x1"} />;
}

/* ---- Focus ----------------------------------------------------------------- */
function FocusForm({ p, size }) {
  const rows = p.rows;
  if (!rows.length) return <Only size={size} center><span style={muted11}>No group has 5 or more people to compare.</span></Only>;
  if (size === "1x1") {
    const g = rows[0], b = band(g.score);
    return (
      <Two size="1x1" style={{ justifyContent: "space-between" }}
        insight={<>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={muted11}>{g.axis}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: ds.text.primary, lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.group}</span>
          </div>
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.72, lineHeight: 1, color: b.cs }}>{g.score}</span>
        </>}
        evidence={<span style={muted11}>{g.struggling} of {g.n} struggling</span>} />
    );
  }
  return (
    <Two size={size} style={{ gap: 12 }}
      insight={<>{rows.slice(0, 3).map((g) => <FocusRow key={`${g.axis}-${g.group}`} name={g.group} value={g.score} tag={g.axis} delta={g.change ?? undefined} sub={`${g.struggling} of ${g.n} people are struggling`} />)}</>}
      evidence={rows.length > 3 ? <MoreLine bottom={false}>{rows.length - 3} more groups</MoreLine> : null} />
  );
}

/* ---- Movers ---------------------------------------------------------------- */
function MoversForm({ p, size }) {
  const { gains, drops } = p;
  if (size === "1x1") {
    const top = [...gains, ...drops].sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
    if (!top) return <Only size="1x1" center><span style={muted11}>Nothing moved since the last round.</span></Only>;
    const up = top.d > 0;
    return (
      <Two size="1x1" center insight={<ScoreHeadline value={top.value} delta={top.d} size={48} compact />}
        evidence={<span style={{ fontSize: 11, lineHeight: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b style={{ color: up ? ds.status.success.textIndicator : ds.status.error.textIndicator }}>{up ? "Rise" : "Drop"}:</b> <b style={{ color: ds.text.primary }}>{top.label}</b></span>} />
    );
  }
  const list = (heading, color, rows, empty) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{heading}</span>
      {rows.length === 0 ? <span style={muted11}>{empty}</span> : rows.map((r) => <FocusRow key={r.label} name={r.label} value={r.value} delta={r.d} />)}
    </div>
  );
  return (
    <Two size={size} style={{ gap: 16 }}
      insight={<>{list("Biggest gains", ds.status.success.textIndicator, gains, "Nothing has risen.")}{list("Biggest drops", ds.status.error.textIndicator, drops, "Nothing has dropped.")}</>} />
  );
}

/* ---- Spread ---------------------------------------------------------------- */
function SpreadForm({ p }) {
  const rows = p.bins.map((b) => ({ label: String(b.from), tipLabel: `Scored ${b.from}–${b.to}`, value: b.n, text: `${b.n} ${b.n === 1 ? "person" : "people"}`, color: band(b.from + 5).c }));
  return (
    <Two size="2x2" style={{ gap: 12, justifyContent: "space-between" }}
      insight={<VBars rows={rows} size="2x2" />}
      evidence={<span style={sentence}>Half of people score between <B>{p.p25}</B> and <B>{p.p75}</B>. The middle score is <B c={band(p.median).cs}>{p.median}</B>.</span>} />
  );
}

/* ---- Goal ------------------------------------------------------------------ */
function Track({ value, target, h = 8 }) {
  return (
    <div style={{ position: "relative", height: h + 12, marginTop: 4 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 6, height: h, borderRadius: h, background: ds.bg.secondary }} />
      <div style={{ position: "absolute", left: 0, top: 6, width: `${value}%`, height: h, borderRadius: h, background: band(value).c }} />
      <div title={`Target ${target}`} style={{ position: "absolute", left: `${target}%`, top: 0, width: 2, height: h + 12, marginLeft: -1, background: ds.bg.inverse }} />
    </div>
  );
}
function GoalForm({ p, size }) {
  const reached = p.gap <= 0;
  if (size === "1x1") {
    return (
      <Two size="1x1" center
        insight={<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.96, lineHeight: 1, color: reached ? ds.status.success.textIndicator : band(p.value).cs }}>{reached ? "✓" : p.gap}</span>
          <span style={muted11}>{reached ? `above the target of ${p.target}` : `${p.gap === 1 ? "point" : "points"} to reach ${p.target}`}</span>
        </div>}
        evidence={<Track value={p.value} target={p.target} />} />
    );
  }
  const stat = (label, v, c) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={muted11}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.6, lineHeight: "36px", color: c }}>{v}</span>
    </div>
  );
  return (
    <Sections size={size}>
    <Insight style={{ justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 24 }}>
        {stat("Now", p.value, band(p.value).cs)}
        {stat("Target", p.target, ds.text.primary)}
        {stat(reached ? "Ahead by" : "Gap", Math.abs(p.gap), reached ? ds.status.success.textIndicator : band(p.value).cs)}
      </div>
      <div>
        <Track value={p.value} target={p.target} h={10} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: ds.text.quaternary, marginTop: 2 }}><span>0</span><span>100</span></div>
      </div>
    </Insight>
    <Evidence>
      <span style={sentence}>
        {reached ? <>Already at or above <B>{p.target}</B>.</>
          : p.rounds == null ? <>The score has not been rising across {p.nRounds} rounds, so there is no pace to project.</>
          : p.rounds > 12 ? <>At the pace of past rounds (<B>{p.pace > 0 ? "+" : ""}{p.pace}</B> a round) this would take <B>more than 12 rounds</B>.</>
          : <>At the pace of past rounds (<B>+{p.pace}</B> a round) this would take about <B>{p.rounds} more round{p.rounds === 1 ? "" : "s"}</B>.</>}
      </span>
    </Evidence>
    </Sections>
  );
}


/* ================================================================== */
/* The overall picture, and cases with a point of view                  */
/* ================================================================== */
const BG = { Flourishing: ds.status.success.bg, Striving: ds.status.warning.bg, Struggling: ds.status.error.bg };
const tint = (v) => (v >= FLOURISHING_AT ? ds.status.success.bg : v >= STRIVING_AT ? ds.status.warning.bg : ds.status.error.bg);
const IDENT = [T.teamBlue, T.hotPink]; // identity colours for "this vs that" — categories, never status
const hair = { height: 1, background: ds.bg.secondary, flexShrink: 0 };
const eyebrow = { fontSize: 10, fontWeight: 500, color: ds.text.tertiary, letterSpacing: "0.3px", textTransform: "uppercase" };

/* ---- Story (3x3) ---------------------------------------------------------- */
function StoryForm({ p }) {
  const bar = p.people ? p.people : null;
  const tiered = p.rows ? pickTiered(p.rows, 1, 3) : null;
  const d = p.delta;
  return (
    <Sections size="3x3">
    <Insight style={{ gap: 16 }}>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <ScoreHeadline value={p.value} delta={p.delta} size={64} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><StatusChip status={p.status} /><span style={date11}>{fmtDate(p.date)}</span></div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "22px", color: ds.text.primary, textWrap: "balance" }}>{p.headline}</span>
          <span style={{ fontSize: 12, color: ds.text.tertiary, lineHeight: "17px" }}>{d > 0 ? `Up ${d}` : d < 0 ? `Down ${-d}` : "No change"} since the last round.</span>
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
    </Insight>
    <Evidence>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${p.facts.length}, minmax(0, 1fr))`, gap: 16 }}>
        {p.facts.map((f) => (
          <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span style={eyebrow}>{f.label}</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: ds.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.value}</span>
              {f.num != null && <span style={{ fontSize: 14, fontWeight: 700, color: band(f.num).cs }}>{f.num}</span>}
            </span>
            <span style={{ ...muted11, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.sub}</span>
          </div>
        ))}
      </div>
    </Evidence>
    </Sections>
  );
}

/* ---- Index ---------------------------------------------------------------- */
function IndexForm({ p, size }) {
  // Older specs carried `dimension` (the retired "Explorer Index" form) instead of their own parts.
  const ring = p.wedges ? <Index wedges={p.wedges} center={p.value} size={p.layers >= 2 ? size : "2x2"} /> : p.dimension ? <DimensionIndex dimension={p.dimension} /> : <IndexRing variant={size} overall={p.value} />;
  return <Only size={size} center>{ring}</Only>;
}

/* ---- Team ---------------------------------------------------------------- */
function TeamForm({ p, size }) {
  const q = p.people;
  const vs = p.vs;
  const vsText = vs === 0 ? "level with the organisation" : `${Math.abs(vs)} ${Math.abs(vs) === 1 ? "point" : "points"} ${vs > 0 ? "above" : "below"} the organisation`;
  if (size === "1x1") {
    return (
      <Sections size="1x1">
        <Insight style={{ justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} size={p.value >= 100 ? 48 : 64} compact /></div>
        </Insight>
        <Evidence><span style={{ ...muted11, lineHeight: "14px", whiteSpace: "nowrap" }}>{p.n} people · <b style={{ color: vs >= 0 ? ds.status.success.textIndicator : ds.status.error.textIndicator }}>{vs > 0 ? "+" : vs < 0 ? "−" : ""}{Math.abs(vs)}</b> vs Org</span></Evidence>
      </Sections>
    );
  }
  return (
    <Sections size={size}>
      <Insight style={{ justifyContent: "space-between" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={p.value} delta={p.delta} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={date11}>{p.axisLabel} · <b>{p.n} people</b></span>
          <StatusChip status={p.status} />
          <span style={sentence}>This is <B c={vs >= 0 ? ds.status.success.textIndicator : ds.status.error.textIndicator}>{vsText}</B>, which scores <B c={band(p.org).cs}>{p.org}</B>.</span>
        </div>
      </Insight>
      <Evidence style={{ gap: 12 }}>
        <EvidenceSegmentBar flourishing={q.f} striving={q.s} struggling={q.t} />
        <StatusBreakdown flourishing={q.f} striving={q.s} struggling={q.t} />
      </Evidence>
    </Sections>
  );
}

/* ---- Versus -------------------------------------------------------------- */
function Side({ g, color, align }) {
  const b = band(g.value);
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, alignItems: align }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: ds.text.primary, maxWidth: "100%" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span></span>
      <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.96, lineHeight: 1, color: b.cs }}>{g.value}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><TrendPill delta={g.delta} compact /><span style={muted11}>{g.n} people</span></span>
    </div>
  );
}
function VersusForm({ p }) {
  const hi = p.gap >= 0 ? p.a : p.b, lo = p.gap >= 0 ? p.b : p.a, gap = Math.abs(p.gap);
  return (
    <Sections size="2x2">
    <Insight style={{ gap: 12, justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Side g={p.a} color={IDENT[0]} align="flex-start" />
        <div style={{ alignSelf: "center", textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: ds.text.quaternary, fontWeight: 500 }}>VS</div>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: "26px", color: gap === 0 ? ds.text.tertiary : ds.text.primary }}>{gap}</div>
          <div style={{ fontSize: 10, color: ds.text.tertiary }}>{gap === 1 ? "point" : "points"}</div>
        </div>
        <Side g={p.b} color={IDENT[1]} align="flex-end" />
      </div>
      {p.rows && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={eyebrow}>Where they differ most</span>
          {p.rows.slice(0, 3).map((r) => (
            <div key={r.label} style={{ display: "grid", gridTemplateColumns: "104px minmax(0, 1fr)", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: ds.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              <div style={{ position: "relative", height: 14 }}>
                <span style={{ position: "absolute", left: 0, right: 0, top: 6, height: 2, background: ds.bg.secondary }} />
                <span style={{ position: "absolute", left: `${Math.min(r.a, r.b)}%`, width: `${Math.abs(r.a - r.b)}%`, top: 6, height: 2, background: ds.icon.tertiary }} />
                {[[r.a, IDENT[0]], [r.b, IDENT[1]]].map(([v, c], i) => <span key={i} title={`${i ? p.b.name : p.a.name}: ${v}`} style={{ position: "absolute", top: 1, left: `${v}%`, width: 12, height: 12, marginLeft: -6, borderRadius: "50%", background: c, boxShadow: `0 0 0 2px ${ds.bg.white}` }} />)}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: ds.text.quaternary, paddingLeft: 112 }}><span>0</span><span>50</span><span>100</span></div>
        </div>
      )}
    </Insight>
    <Evidence>
      <span style={sentence}><B>{p.a.n}</B> people in {p.a.name} · <B>{p.b.n}</B> in {p.b.name}</span>
    </Evidence>
    </Sections>
  );
}

/* ---- Head to head ---------------------------------------------------------- */
function DuelChart({ items, labels, w = 312, h = 126 }) {
  const gx = 22, top = 6, bottom = 16, plotW = w - gx - 8, plotH = h - top - bottom;
  const x = (i) => gx + (items[0].points.length === 1 ? plotW / 2 : (i / (items[0].points.length - 1)) * plotW);
  const y = (v) => top + plotH - (v / 100) * plotH;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      {[0, 25, 50, 75, 100].map((g) => <g key={g}><line x1={gx} x2={w} y1={y(g)} y2={y(g)} stroke={ds.bg.secondary} /><text x="0" y={y(g) + 3} fontSize="8" fill={ds.text.quaternary}>{g}</text></g>)}
      {items.map((it, k) => (
        <g key={it.label}>
          <path d={it.points.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ")} fill="none" stroke={IDENT[k]} strokeWidth="2" />
          {it.points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === it.points.length - 1 ? 4 : 2.5} fill={IDENT[k]} stroke={ds.surface.general.card} strokeWidth="1.5" />)}
        </g>
      ))}
      {labels.map((l, i) => <text key={l} x={x(i)} y={h - 2} fontSize="10" textAnchor="middle" fill={ds.text.quaternary}>{l}</text>)}
    </svg>
  );
}
function DuelForm({ p }) {
  const [A, Bi] = p.items, gap = Math.abs(p.gap), hi = p.gap >= 0 ? A : Bi, lo = p.gap >= 0 ? Bi : A;
  const strength = Math.abs(p.r) >= 0.6 ? "strong" : Math.abs(p.r) >= 0.3 ? "moderate" : "weak";
  return (
    <Sections size="2x2">
    <Insight style={{ gap: 12, justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 12 }}>
        {p.items.map((it, k) => (
          <div key={it.label} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: ds.text.primary }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: IDENT[k], flexShrink: 0 }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span></span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.96, lineHeight: 1, color: band(it.value).cs }}>{it.value}</span>
              <TrendPill delta={it.delta} compact />
            </span>
          </div>
        ))}
      </div>
      <DuelChart items={p.items} labels={p.labels} />
    </Insight>
    <Evidence>
      <span style={sentence}>Link between them: <B>r = {p.r}</B> ({strength})</span>
    </Evidence>
    </Sections>
  );
}

/* ---- Health check ------------------------------------------------------------- */
const CHECK_STYLE = { pass: { bg: ds.status.success.bg, c: ds.status.success.textIndicator, Icon: Check }, warn: { bg: ds.status.warning.bg, c: ds.status.warning.textIndicator, Icon: AlertTriangle }, fail: { bg: ds.status.error.bg, c: ds.status.error.textIndicator, Icon: X } };
function CheckForm({ p }) {
  const ratio = p.passed / p.checks.length;
  const c = ratio >= 0.8 ? ds.status.success.textIndicator : ratio >= 0.5 ? ds.status.warning.textIndicator : ds.status.error.textIndicator;
  return (
    <Only size="2x2" style={{ gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.96, lineHeight: 1, color: c }}>{p.passed}<span style={{ fontSize: 20, color: ds.text.quaternary }}>/{p.checks.length}</span></span>
        <span style={{ fontSize: 12, color: ds.text.tertiary }}>checks passing</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {p.checks.map((k, i) => {
          const s = CHECK_STYLE[k.state];
          return (
            <div key={k.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: i ? `1px solid ${ds.bg.primary}` : "none" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: s.bg, color: s.c, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><s.Icon size={12} strokeWidth={2.6} /></span>
              <span style={{ flex: 1, fontSize: 12, color: ds.text.primary, minWidth: 0 }}>{k.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.c, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{k.detail}</span>
            </div>
          );
        })}
      </div>
    </Only>
  );
}

/* ---- What if ------------------------------------------------------------------- */
function WhatIfForm({ p }) {
  const b0 = band(p.value), b1 = band(p.after), gain = p.after - p.value;
  return (
    <Sections size="2x2">
    <Insight style={{ gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={eyebrow}>Now</span><span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: b0.cs }}>{p.value}</span></div>
        <ArrowRight size={22} color={ds.text.quaternary} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={eyebrow}>If lifted</span><span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: b1.cs }}>{p.after}</span></div>
        <div style={{ marginLeft: "auto", alignSelf: "flex-start" }}>{gain !== 0 ? <TrendPill delta={gain} numberOnly /> : null}</div>
      </div>
      {p.lifted.length === 0 ? (
        <span style={{ fontSize: 12, color: ds.text.tertiary }}>Every {p.noun.toLowerCase()} is already at 70 or more, so there is nothing to lift.</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={eyebrow}>The {p.lift === 1 ? "weakest" : `${p.lifted.length} weakest`} {p.noun.toLowerCase()}{p.lifted.length === 1 ? "" : "s"}, brought to {FLOURISHING_AT}</span>
          {p.lifted.map((r) => (
            <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: ds.text.primary }}>{r.label}</span>
                <span style={{ fontSize: 12, color: ds.text.tertiary }}><b style={{ color: band(r.from).cs }}>{r.from}</b> → <b style={{ color: band(r.to).cs }}>{r.to}</b></span>
              </div>
              <div style={{ position: "relative", height: 6, borderRadius: 4, background: ds.bg.primary }}>
                <span style={{ position: "absolute", left: 0, width: `${r.to}%`, top: 0, height: 6, borderRadius: 4, background: band(r.to).c, opacity: 0.28 }} />
                <span style={{ position: "absolute", left: 0, width: `${r.from}%`, top: 0, height: 6, borderRadius: 4, background: band(r.from).c }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Insight>
    </Sections>
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
    <Only size="2x2" style={{ gap: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: `minmax(0, 1fr) repeat(${p.labels.length}, 44px)`, gap: 4, paddingBottom: 2 }}>
        <span />
        {p.labels.map((l) => <span key={l} style={{ fontSize: 10, color: ds.text.tertiary, textAlign: "center" }}>{l}</span>)}
      </div>
      {rows.map(([label, vals]) => (
        <div key={label} style={{ display: "grid", gridTemplateColumns: `minmax(0, 1fr) repeat(${p.labels.length}, 44px)`, gap: 4, alignItems: "center", height: rowH }}>
          <span style={{ fontSize: 11, color: ds.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          {vals.map((v, i) => (
            <span key={i} title={`${label}, ${p.labels[i]}: ${v}`} style={{ height: rowH - 4, borderRadius: 4, background: tint(v), color: band(v).cs, fontSize: 11, fontWeight: i === vals.length - 1 ? 700 : 500, display: "flex", alignItems: "center", justifyContent: "center", fontVariantNumeric: "tabular-nums" }}>{v}</span>
          ))}
        </div>
      ))}
      {capped && <MoreLine bottom>{all.length - rows.length} more {p.noun}s</MoreLine>}
    </Only>
  );
}

/* ---- Momentum -------------------------------------------------------------------- */
const sgn = (d) => (d > 0 ? `+${d}` : d < 0 ? `−${-d}` : "0");
const dcol = (d) => (d > 0 ? ds.status.success.textIndicator : d < 0 ? ds.status.error.textIndicator : ds.text.tertiary);
function MomentumForm({ p, size }) {
  const run = p.streak >= 2 ? `Rising ${p.streak} rounds in a row` : p.fall >= 2 ? `Falling ${p.fall} rounds in a row` : p.streak === 1 ? "Up on the last round" : p.fall === 1 ? "Down on the last round" : "Flat on the last round";
  if (size === "1x1") {
    return (
      <Two size="1x1" center
        insight={<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: dcol(p.change) }}>{sgn(p.change)}</span>
          <span style={muted11}>since the first round</span>
        </div>}
        evidence={<span style={{ fontSize: 11, fontWeight: 700, color: dcol(p.streak ? 1 : p.fall ? -1 : 0), lineHeight: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{run}</span>} />
    );
  }
  const maxAbs = Math.max(4, ...p.steps.map((s) => Math.abs(s.d)));
  return (
    <Sections size={size}>
    <Insight style={{ gap: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.96, lineHeight: 1, color: dcol(p.change) }}>{sgn(p.change)}</span>
        <span style={{ fontSize: 12, color: ds.text.tertiary, lineHeight: "16px" }}>points since the first round<br /><b style={{ color: ds.text.primary }}>{p.first}</b> → <b style={{ color: band(p.value).cs }}>{p.value}</b></span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={eyebrow}>Round on round</span>
        {p.steps.map((s) => (
          <div key={s.label} style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) 30px", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: ds.text.tertiary }}>{s.label}</span>
            <div style={{ position: "relative", height: 8 }}>
              <span style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: ds.bg.quaternary }} />
              <span style={{ position: "absolute", top: 1, height: 6, borderRadius: 4, background: s.d >= 0 ? ds.status.success.bgStrong : ds.status.error.text, ...(s.d >= 0 ? { left: "50%", width: `${(s.d / maxAbs) * 50}%` } : { right: "50%", width: `${(-s.d / maxAbs) * 50}%` }) }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: dcol(s.d), textAlign: "right" }}>{sgn(s.d)}</span>
          </div>
        ))}
      </div>
    </Insight>
    <Evidence style={{ gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: dcol(p.streak ? 1 : p.fall ? -1 : 0) }}>{run}</span>
        {p.riser && p.riser.d > 0 && <span style={{ fontSize: 11, color: ds.text.tertiary }}>Most improved: <B>{p.riser.label}</B> <B c={ds.status.success.textIndicator}>{sgn(p.riser.d)}</B></span>}
        {p.faller && p.faller.d < 0 && <span style={{ fontSize: 11, color: ds.text.tertiary }}>Furthest down: <B>{p.faller.label}</B> <B c={ds.status.error.textIndicator}>{sgn(p.faller.d)}</B></span>}
    </Evidence>
    </Sections>
  );
}

const RENDER = { dindex: IndexForm, composition: CompositionForm, story: StoryForm, index: IndexForm, team: TeamForm, versus: VersusForm, duel: DuelForm, check: CheckForm, whatif: WhatIfForm, heat: HeatForm, momentum: MomentumForm, score: Score, gauge: GaugeForm, status: StatusForm, history: HistoryForm, parts: PartsForm, people: PeopleForm, groups: GroupsForm, focus: FocusForm, movers: MoversForm, spread: SpreadForm, goal: GoalForm };

export default function SubjectBody({ spec }) {
  const { form, payload, size } = spec;
  if (form === "profile") return <Only size={size} center><RadarChart items={payload.items} /></Only>;
  const View = RENDER[form] || Score;
  return <View p={payload} size={size} />;
}
