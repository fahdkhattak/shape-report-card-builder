import { T } from "../../lib/tokens.js";
import { ds } from "../../lib/ds.js";
import {
  BigNumber,
  TrendPill,
  EvidenceSegmentBar,
  StatusBreakdown,
  DriverGroupedList,
  driverTier,
  Sparkline,
  MiniBarChart,
  Treemap,
  StatusRing,
  StatusRipple,
  MoneyComposition,
} from "./primitives.jsx";
import {
  fmtDate, statusOf, STATUS_COLOR, TEAM_BLUE, date11, muted11,
  StatusChip, Headcount, ScoreHeadline, GroupCounts, MoreLine,
  SeverityRow, DistributionRow, SupportButton, AgeNumber, AgeScale,
  CompareRow, CompareIcons, LockedBody, HeatTable, PopularTreemap, HistoryChart,
  FocusRow, GroupBars,
} from "./widgetParts.jsx";
import { IndexRing, DimensionIndex } from "./RingIndex.jsx";
import GraphInsight from "./GraphInsight.jsx";
import {
  ROUNDS, LATEST, PREVIOUS, ROUND_LABELS, DIMENSIONS, delta,
  dimensionRankedRows, driverRankedRows, dimensionValue, driverValue, driverTrend, DIMENSION_DRIVERS,
  avgScoreByGender, avgScoreByWorkModel, worstDemographicGroup, EMPLOYEE_COUNT, participationRate,
  focusGroups, enpsGroups, feelingShare, heatMap,
} from "../../lib/dataset.js";
import { FLOURISHING_AT, countByStatus } from "../../lib/bands.js";

const GENDER_COLORS = { Male: T.teamBlue, Female: T.hotPink, Other: T.goldenYellow, "Prefer not to respond": T.gray300 };
const WORK_MODEL_COLORS = { Onsite: T.orgBlue, Remote: T.teamBlue, Hybrid: T.mintGreen };

/* ================================================================== */
/* FIXED-FAMILY WIDGET BODY (Library-sourced)                          */
/* Each family has a fixed set of pre-built forms — no AI involved.    */
/* Backed by the real generated dataset (lib/dataset.js /               */
/* data/generate-dataset.js) — full org-wide aggregates, per docs'      */
/* rule that Library-sourced widgets never scope/filter.                */
/*                                                                      */
/* Rebuilt against the full Figma catalogue (984qJvMt7fCHASYHRwgrab,     */
/* node 12635:69176). Where the dataset has nothing to back a form       */
/* (Personal/Team figures, Health Age, Money, Popular Responses…) it      */
/* shows the design's own sample values and the Library tags the card     */
/* "Sample data" — see `sample` in lib/families.js.                       */
/* ================================================================== */

const col = (extra) => ({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, ...extra });

/* How many of a set of values land in each status band. */
function bandCounts(values) {
  return countByStatus(values);
}

/* "Across the 12 Explorers, 5 are Flourishing, 3 are Striving, and 4 are
   Struggling." — counts of parts, not of people. */
function BandSentence({ noun, f, s, t }) {
  return (
    <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>
      Across the <b style={{ color: T.gray900 }}>{f + s + t}</b> {noun}, <b style={{ color: T.greenStrong }}>{f}</b> are Flourishing, <b style={{ color: T.amberStrong }}>{s}</b> are Striving, and <b style={{ color: T.redStrong }}>{t}</b> are Struggling.
    </span>
  );
}

/* 1x1 score card: headline up top, date (and any footer) at the bottom. */
function Score1x1({ value, delta: d, size = 64, footer, date = fmtDate(LATEST.date), color }) {
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <div style={{ paddingTop: 4 }}><ScoreHeadline value={value} delta={d} size={size} compact valueColor={color} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={date11}>{date}</span>
        {footer}
      </div>
    </div>
  );
}

/* 2x2 score card: headline centred in the free space, date / extras / bar at
   the bottom. */
function Score2x2({ value, delta: d, extra, bar, sentence, chip, date = fmtDate(LATEST.date) }) {
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={value} delta={d} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={date11}>{date}</span>
          {chip}
          {extra}
        </div>
        {bar}
        {sentence}
      </div>
    </div>
  );
}

/* Great / Average / Poor — up to two of each, strongest and weakest first, so
   a list never hides what is actually dragging the score down. */
function pickTiered(rows, perTier = 2, total = 6) {
  const by = { great: [], average: [], poor: [] };
  rows.forEach((r) => by[driverTier(r[1])].push(r));
  const picked = [...by.great.slice(0, perTier), ...by.average.slice(Math.floor(Math.max(0, by.average.length - perTier) / 2), Math.floor(Math.max(0, by.average.length - perTier) / 2) + perTier), ...by.poor.slice(-perTier)];
  const rest = rows.filter((r) => !picked.includes(r));
  while (picked.length < Math.min(total, rows.length) && rest.length) picked.push(rest.shift());
  return picked.sort((a, b) => b[1] - a[1]);
}

function RankedList({ rows, noun, form }) {
  if (form === "1x1") {
    // No per-row trend in the 1x1 (the design drops it to make room), and a
    // Factors card says "Top / Bottom" where Explorers say "Great / Poor".
    const picked = [rows[0], rows[rows.length - 1]].map((r) => [r[0], r[1]]);
    return (
      <div style={col({ gap: 6, overflow: "hidden" })}>
        <DriverGroupedList rows={picked} tierLabels={noun === "Factors" ? { great: "Top", average: "Average", poor: "Bottom" } : undefined} />
        <MoreLine>{rows.length - 2} more {noun}</MoreLine>
      </div>
    );
  }
  const shown = pickTiered(rows);
  return (
    <div style={col({ gap: 6, overflow: "hidden" })}>
      <DriverGroupedList rows={shown} />
      {rows.length > shown.length && <MoreLine>{rows.length - shown.length} more {noun}</MoreLine>}
    </div>
  );
}

/* Wording for how a score moved across rounds ("After dipping in R2, …"). */
function historyCaption(points) {
  const n = points.length, last = points[n - 1], prev = points[n - 2], d = last - prev;
  const B = ({ children, c }) => <b style={{ color: c || T.gray900 }}>{children}</b>;
  if (d > 0) {
    const dipped = n >= 3 && points[n - 2] < points[n - 3];
    return <>{dipped ? <>After dipping in <B>R{n - 1}</B>, the score increased by </> : <>The score increased by </>}<B c={T.greenStrong}>+{d} points</B>{!dipped && <> since <B>R{n - 1}</B></>}, reaching <B>{last}</B> in the latest round.</>;
  }
  if (d < 0) return <>The score fell by <B c={T.redStrong}>{-d} points</B> since <B>R{n - 1}</B>, to <B>{last}</B> in the latest round.</>;
  return <>The score held at <B>{last}</B> since <B>R{n - 1}</B>.</>;
}

/* The design's own sample figures for anything that has no data behind it. */
const SAMPLE = { team: { score: 87, d: 9, members: 15, rate: 95, counts: [9, 3, 3] } };

export default function WidgetBody({ familyId, formIndex = 0 }) {
  const avg = Math.round(LATEST.avgOverall);
  const avgDelta = delta(LATEST.avgOverall, PREVIOUS.avgOverall);
  const orgBar = <EvidenceSegmentBar flourishing={LATEST.flourishing} striving={LATEST.striving} struggling={LATEST.struggling} />;
  const orgCounts = <StatusBreakdown flourishing={LATEST.flourishing} striving={LATEST.striving} struggling={LATEST.struggling} />;
  const explorers = bandCounts(DIMENSIONS.map((d) => dimensionValue(d)));
  const explorerBar = <EvidenceSegmentBar flourishing={explorers.f} striving={explorers.s} struggling={explorers.t} />;

  switch (familyId) {
    /* ---- Score ---- */
    case "org-score":
      if (formIndex === 1) return <Score1x1 value={avg} delta={avgDelta} footer={<Headcount count={EMPLOYEE_COUNT} rate={participationRate()} tone={T.orgBlue} />} />;
      return (
        <Score2x2
          value={avg} delta={avgDelta}
          extra={<Headcount labelled label="Employees" count={EMPLOYEE_COUNT} rate={participationRate()} tone={T.orgBlue} />}
          bar={orgBar} sentence={orgCounts}
        />
      );

    case "your-score": {
      const status = statusOf(LATEST.avgOverall);
      if (formIndex === 0) return <Score1x1 value={avg} delta={avgDelta} />;
      if (formIndex === 2) return <Score1x1 value={avg} delta={avgDelta} footer={<StatusChip status={status} />} />;
      return (
        <Score2x2
          value={avg} delta={avgDelta}
          chip={formIndex === 3 ? <StatusChip status={status} /> : null}
          bar={explorerBar} sentence={<BandSentence noun="Explorers" {...explorers} />}
        />
      );
    }

    case "team-score": {
      const s = SAMPLE.team;
      if (formIndex === 0) return <Score1x1 value={83} delta={s.d} footer={<Headcount count={s.members} rate={s.rate} tone={TEAM_BLUE} />} />;
      return (
        <Score2x2
          value={s.score} delta={s.d}
          extra={<Headcount labelled label="Team Members" count={s.members} rate={s.rate} tone={TEAM_BLUE} />}
          bar={<EvidenceSegmentBar flourishing={s.counts[0]} striving={s.counts[1]} struggling={s.counts[2]} />}
          sentence={<StatusBreakdown flourishing={s.counts[0]} striving={s.counts[1]} struggling={s.counts[2]} />}
        />
      );
    }

    case "explorer-score": {
      const dim = "Physical Health";
      const val = Math.round(dimensionValue(dim));
      const d = delta(dimensionValue(dim), dimensionValue(dim, PREVIOUS));
      const status = statusOf(val);
      const drivers = bandCounts((DIMENSION_DRIVERS[dim] || []).map((x) => driverValue(x)));
      if (formIndex === 0) return <Score1x1 value={val} delta={d} size={54} />;
      if (formIndex === 1) return <Score1x1 value={val} delta={d} size={54} footer={<StatusChip status={status} />} />;
      if (formIndex === 2) return <Score1x1 value={val} delta={d} size={54} footer={<Headcount count={SAMPLE.team.members} rate={SAMPLE.team.rate} tone={TEAM_BLUE} />} />;
      if (formIndex === 3) return <Score1x1 value={val} delta={d} size={54} footer={<Headcount count={EMPLOYEE_COUNT} rate={participationRate()} tone={T.orgBlue} />} />;
      return (
        <Score2x2
          value={val} delta={d} chip={<StatusChip status={status} />}
          bar={<EvidenceSegmentBar flourishing={drivers.f} striving={drivers.s} struggling={drivers.t} />}
          sentence={<BandSentence noun="Factors" {...drivers} />}
        />
      );
    }

    case "index":
      return <IndexRing variant={formIndex === 1 ? "3x3" : "2x2"} overall={LATEST.avgOverall} />;

    case "dimension-index":
      return <DimensionIndex dimension="Corporate Culture" />;

    /* ---- Status ---- */
    case "org-status": {
      const sample = formIndex >= 3;
      const status = sample ? "Flourishing" : statusOf(LATEST.avgOverall);
      const bar = sample ? <EvidenceSegmentBar flourishing={9} striving={3} struggling={3} /> : orgBar;
      if (formIndex === 1 || formIndex === 4) {
        return (
          <div style={col({ justifyContent: "space-between" })}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
              <StatusRipple status={status} size={196} />
              <span style={{ fontSize: 20, fontWeight: 700, color: STATUS_COLOR[status], marginTop: -34, position: "relative" }}>{status}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
              {bar}
              {sample ? <StatusBreakdown flourishing={9} striving={3} struggling={3} /> : orgCounts}
            </div>
          </div>
        );
      }
      return (
        <div style={col({ justifyContent: "center", gap: 10 })}>
          <StatusRing status={status} />
          {bar}
        </div>
      );
    }

    /* ---- ENPS ---- */
    case "enps": {
      const g = enpsGroups();
      const prev = enpsGroups(1);
      const score = Math.round(((g.promoters - g.detractors) / g.total) * 100);
      const d = score - Math.round(((prev.promoters - prev.detractors) / prev.total) * 100);
      const bar = <EvidenceSegmentBar flourishing={g.promoters} striving={g.passives} struggling={g.detractors} />;
      if (formIndex === 0) {
        return (
          <div style={col({ justifyContent: "space-between" })}>
            <div style={{ paddingTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.1, color: T.gray800, lineHeight: 0.9 }}>{score}</span>
              <TrendPill delta={d} compact />
            </div>
            {bar}
          </div>
        );
      }
      if (formIndex === 1) {
        return (
          <div style={col({ justifyContent: "space-between" })}>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}><span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1.3, color: T.gray800, lineHeight: 0.82 }}>{score}</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {bar}
              <GroupCounts items={[["Promoters", g.promoters, T.greenStrong], ["Passives", g.passives, T.amberStrong], ["Detractors", g.detractors, T.redStrong]]} />
            </div>
          </div>
        );
      }
      return (
        <div style={col({ justifyContent: "space-between" })}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1.3, color: T.gray800, lineHeight: 0.82 }}>{score}</span>
            <TrendPill delta={d} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bar}
            <span style={{ fontSize: 11, color: T.gray500, lineHeight: "16px" }}>
              Across the <b style={{ color: T.gray900 }}>{g.total}</b> people who answered, <b style={{ color: T.greenStrong }}>{g.promoters}</b> are Promoters, <b style={{ color: T.amberStrong }}>{g.passives}</b> are Passives, and <b style={{ color: T.redStrong }}>{g.detractors}</b> are Detractors.
            </span>
          </div>
        </div>
      );
    }

    /* ---- Areas to Focus ---- */
    case "areas-focus": {
      const groups = focusGroups();
      if (formIndex === 0) {
        // Per explicit product correction: this surfaces the worst-scoring
        // DEMOGRAPHIC GROUP (e.g. a department, a tenure band), not a
        // dimension — see worstDemographicGroup() in lib/dataset.js.
        const [, group, value, trendDelta] = worstDemographicGroup();
        return (
          <div style={col({ justifyContent: "space-between" })}>
            <div style={{ paddingTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <BigNumber value={Math.round(value)} size={56} colorBand />
              <TrendPill delta={trendDelta} numberOnly />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gray900, lineHeight: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{group}</span>
          </div>
        );
      }
      if (formIndex === 1) {
        const areas = groups.filter((g) => g.value < FLOURISHING_AT);
        return (
          <div style={col({ gap: 6, overflow: "hidden" })}>
            {areas.slice(0, 3).map((g) => <FocusRow key={g.axis + g.group} name={g.group} value={g.value} />)}
            {areas.length > 3 && <MoreLine>{areas.length - 3} more Areas</MoreLine>}
          </div>
        );
      }
      if (formIndex === 2) {
        const CATEGORIES = [["People", ["Gender"]], ["Organisation", ["Department", "Job Level"]], ["Employment", ["Tenure", "Employment Status", "Work Model"]], ["Locations", ["Location"]]];
        return (
          <div style={col({ gap: 12, overflow: "hidden" })}>
            {CATEGORIES.map(([title, axes]) => {
              const g = groups.find((x) => axes.includes(x.axis));
              if (!g) return null;
              return (
                <div key={title} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, lineHeight: "16px", fontWeight: 400, color: ds.text.accent }}>{title}</span>
                  <FocusRow name={g.group} value={g.value} tag={g.axis} delta={g.delta} sub={`${g.struggling}/${g.n} (${Math.round((g.struggling / g.n) * 100)}%) employees are struggling`} />
                </div>
              );
            })}
            {(() => {
              const shown = CATEGORIES.filter(([, axes]) => groups.some((x) => axes.includes(x.axis))).length;
              const more = groups.filter((g) => g.value < FLOURISHING_AT).length - shown;
              return more > 0 ? <MoreLine>{more} more Areas</MoreLine> : null;
            })()}
          </div>
        );
      }
      const rows = groups.filter((g) => g.axis === "Department").map((g) => [g.group, g.value]);
      return <GroupBars rows={rows} />;
    }

    case "heat-map": {
      const { rows } = heatMap();
      return <HeatTable rows={rows} />;
    }

    /* ---- Explorers & Factors ---- */
    case "explorers":
      return <RankedList rows={dimensionRankedRows()} noun="Explorers" form={formIndex === 1 ? "1x1" : "2x2"} />;
    case "factors":
      return <RankedList rows={driverRankedRows()} noun="Factors" form={formIndex === 1 ? "1x1" : "2x2"} />;

    /* ---- Explorer Results ---- */
    case "avg-gender": {
      const genderScores = avgScoreByGender();
      const rows = genderScores.map(([g, v]) => [g === "Prefer not to respond" ? "Prefer.." : g, v]);
      const colors = genderScores.map(([g]) => GENDER_COLORS[g]);
      return <div style={{ flex: 1, display: "flex", alignItems: "center" }}><MiniBarChart rows={rows} colors={colors} /></div>;
    }
    case "avg-work-model": {
      const rows = avgScoreByWorkModel();
      const colors = rows.map(([w]) => WORK_MODEL_COLORS[w]);
      return <div style={{ flex: 1, display: "flex", alignItems: "center" }}><MiniBarChart rows={rows} colors={colors} /></div>;
    }
    case "popular-responses":
      // No free-text theme data in the generated dataset (survey's open-text
      // questions weren't modeled) — the design's own sample tiles.
      if (formIndex === 1)
        return <PopularTreemap tiles={[["Ergonomics", 18, T.personalBlue], ["Office Environment", 16, T.amberOrange], ["Technology", 14, T.lavender], ["Furniture", 12, T.mintGreen], ["Lighting", 5, T.goldenYellow], ["", 3, "#ff6b6b"], ["", 2, "#26a69a"]]} />;
      return <div style={{ flex: 1 }}><Treemap tiles={[["Ergonomics", 18], ["", 16], ["", 14]]} /></div>;

    /* ---- Score over time ---- */
    case "score-history": {
      const points = ROUNDS.map((r) => Math.round(r.avgOverall));
      // Graph insight rules (docs/widget-insight-rules.md): 1x1 up to 3 rounds, 2x2 up to 7; past that the widget grows or gives way to the detailed view.
      return <GraphInsight series={[{ points }]} labels={ROUND_LABELS} size={formIndex === 1 ? "1x1" : "2x2"} delta={avgDelta} evidence={historyCaption(points)} />;
    }

    /* ---- Score comparisons ---- */
    case "score-comparisons": {
      const next = new Date(LATEST.date);
      next.setDate(next.getDate() + 33);
      const when = next.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (formIndex === 2) return <LockedBody date={when} />;
      if (formIndex === 3) return <LockedBody date={when} text="Your score compared with your team(s) and the organisation" />;
      if (formIndex === 0)
        return (
          <div style={col({ gap: 8, overflow: "hidden" })}>
            <CompareRow label="Team Score" value={64} />
            <CompareRow label="Org Score" value={avg} />
            <MoreLine>1 more Comparison</MoreLine>
          </div>
        );
      return (
        <div style={col({ gap: 10, overflow: "hidden" })}>
          <CompareRow label="Your Score" value={83} icon={CompareIcons.you} delta={9} big />
          <CompareRow label="Team Score" value={71} icon={CompareIcons.team} chip="team-a@example.com" big />
          <CompareRow label="Team Score" value={64} icon={CompareIcons.team} chip="team-b@example.com" big />
          <CompareRow label="Org Score" value={avg} icon={CompareIcons.org} big />
        </div>
      );
    }

    /* ---- Health age (design sample values — no age field in the dataset) ---- */
    case "health-age": {
      const persona = formIndex < 2 ? "personal" : formIndex < 4 ? "team" : "org";
      const older = persona === "org"; // the Org frame shows the "older" state
      const tone = older ? T.redStrong : T.greenStrong;
      const who = persona === "personal" ? "Your health actions make you" : persona === "team" ? "Your Team's health actions make them" : "Your Employees' health actions make them";
      const gapChip = (
        <span style={{ alignSelf: "flex-start", background: older ? T.redBg : T.greenBg, color: older ? T.redStrong : T.greenStrong, borderRadius: 46, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
          {older ? "1 yr 1 mo older" : "2 yrs 3 mo younger"}
        </span>
      );
      if (formIndex % 2 === 0) {
        return (
          <div style={col({ justifyContent: "space-between" })}>
            <div style={{ paddingTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <AgeNumber years={26} months={3} color={tone} />
              <TrendPill delta={older ? 2 : -2} compact positive={older} />
            </div>
            <span style={{ background: older ? T.redBg : T.greenBg, color: older ? T.redStrong : T.greenStrong, borderRadius: 46, padding: "4px 8px", fontSize: 11, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}>{older ? "1 yr 1 mo older" : "2 yrs 3 mo younger"}</span>
          </div>
        );
      }
      return (
        <div style={col({ justifyContent: "space-between" })}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <AgeNumber years={26} months={3} color={tone} size={52} />
            {older
              ? <span style={{ display: "inline-flex", gap: 4, background: T.greenBg, color: T.green, borderRadius: 46, height: 20, boxSizing: "border-box", lineHeight: "20px", alignItems: "center", padding: "0 10px", fontSize: 11 }}>▲ Improved by <b style={{ color: T.greenStrong }}>2 yrs 3 mo</b></span>
              : <span style={{ display: "inline-flex", gap: 4, background: T.redBg, color: T.red, borderRadius: 46, height: 20, boxSizing: "border-box", lineHeight: "20px", alignItems: "center", padding: "0 10px", fontSize: 11 }}>▼ Declined by <b style={{ color: T.redStrong }}>2 yrs 3 mo</b></span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.gray900 }}>{who}</span>
            {gapChip}
            <span style={{ fontSize: 11, color: T.gray900 }}>than your actual age.</span>
            <AgeScale older={older} />
          </div>
        </div>
      );
    }

    /* ---- Mental well-being ---- */
    case "mental-wellbeing": {
      if (formIndex < 2) {
        return (
          <div style={col({ justifyContent: "space-between" })}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <SeverityRow label="Feeling Low" level="Moderate" trend={formIndex === 1 ? "up" : undefined} />
              <SeverityRow label="Feeling Anxious" level="Severe" trend={formIndex === 1 ? "down" : undefined} />
              <SeverityRow label="Feeling Stressed" level="Extremely Severe" trend={formIndex === 1 ? "down" : undefined} />
            </div>
            {formIndex === 1 && <SupportButton tone={T.accent} />}
          </div>
        );
      }
      const team = formIndex < 4;
      const tone = team ? TEAM_BLUE : T.orgBlue;
      const rows = team ? [["Feeling Low", 60, -3], ["Feeling Anxious", 24, 2], ["Feeling Stressed", 32, 2]] : feelingShare();
      const big = formIndex % 2 === 1;
      return (
        <div style={col({ gap: big ? 8 : 4 })}>
          <span style={{ ...muted11, lineHeight: "13px" }}>{team ? "Team" : "Org"} distribution (%)</span>
          <div style={{ display: "flex", flexDirection: "column", gap: big ? 14 : 4 }}>
            {rows.map(([label, pct, d]) => <DistributionRow key={label} label={label} pct={pct} delta={big ? d : undefined} tone={tone} bar={big} />)}
          </div>
        </div>
      );
    }

    /* ---- Time & Money ---- */
    case "time-impact": {
      const wlb = driverValue("Work-life balance");
      const wlbTrend = driverTrend("Work-life balance");
      const hours = Math.round(wlb / 4);
      const trendDelta = delta(wlbTrend[wlbTrend.length - 1], wlbTrend[wlbTrend.length - 2]);
      const tone = formIndex === 1 ? TEAM_BLUE : T.orgBlue;
      return (
        <div style={col({ justifyContent: "space-between" })}>
          <div style={{ paddingTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <BigNumber value={formIndex === 1 ? 25 : hours} size={56} unit="hrs" color={tone} />
            <TrendPill compact positive={formIndex === 1 ? false : trendDelta > 0} />
          </div>
          <span style={date11}>per annum</span>
        </div>
      );
    }
    case "time-gain":
      return (
        <div style={col({ justifyContent: "space-between" })}>
          <div style={{ paddingTop: 8 }}><BigNumber value={2} size={56} unit="wks" color={T.orgBlue} /></div>
          <span style={date11}>per annum</span>
        </div>
      );
    case "money-composition":
      // No monetary figures exist in the generated dataset (the survey doesn't
      // model cost), so — like Popular Responses — this shows the Figma
      // mockup's own sample values rather than invented ones.
      return <MoneyComposition items={[["Productivity", 26], ["Absenteeism", 4], ["Retention", 13], ["Injury/Claims", 22]]} />;

    /* ---- Support ---- */
    case "support-nudge":
      return (
        <div style={col({ justifyContent: "space-between" })}>
          <span style={{ fontSize: 11, color: T.gray900, lineHeight: "14px" }}>
            {formIndex === 0 ? "Struggling or just want to be heard? Get support now." : "Want help with low Psychological Health Scores?"}
          </span>
          <SupportButton tone={formIndex === 0 ? T.gray900 : T.accent} />
        </div>
      );

    default:
      return <div style={{ flex: 1 }} />;
  }
}
