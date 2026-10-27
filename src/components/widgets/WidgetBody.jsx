import { T, band } from "../../lib/tokens.js";
import { themeTotals } from "../../lib/responseSample.js";
import { ds } from "../../lib/ds.js";
import {
  BigNumber,
  TrendPill,
  EvidenceSegmentBar,
  DriverGroupedList,
  driverTier,
  Sparkline,
  Sections, Insight, Evidence, ActionBar,
} from "./primitives.jsx";
import {
  TEAM_BLUE, date11, muted11,
  GroupCounts, MoreLine,
  SeverityRow, DistributionRow, SupportButton, AgeNumber, AgeScale,
  CompareRow, CompareIcons, LockedBody, HeatTable, HistoryChart,
  FocusRow,
} from "./widgetParts.jsx";
import { IndexRing, DimensionIndex } from "./RingIndex.jsx";
import ScoreCard from "./ScoreCard.jsx";
import StatusCard from "./StatusCard.jsx";
import GraphInsight, { HistoryCaption } from "./GraphInsight.jsx";
import { impact, impactSeries, samplePerson, fmtMoney } from "../../lib/impactModel.js";
import { HBars, TileGrid, Treemap, CompositionInsight } from "./ChartInsight.jsx";
import { segmentColor } from "../scope/stories/DonutChart.jsx";
import { groupRows, LAST } from "../../lib/scopeData.js";
import { driversOnPage } from "../../lib/driversWidget.js";
import { comparisonSize } from "../../lib/insightRules.js";
import {
  ROUNDS, LATEST, PREVIOUS, ROUND_LABELS, DIMENSIONS, delta,
  dimensionRankedRows, driverRankedRows, dimensionValue, driverValue, driverTrend, DIMENSION_DRIVERS,
  avgScoreByGender, avgScoreByWorkModel, worstDemographicGroup, EMPLOYEE_COUNT, participationRate,
  focusGroups, enpsGroups, feelingShare, heatMap,
} from "../../lib/dataset.js";
import { FLOURISHING_AT, countByStatus } from "../../lib/bands.js";
import { familyById } from "../../lib/families.js";

// Groups in the order their colours are drawn (DonutChart.jsx BY_AXIS); other axes keep size order.
const COMPOSITION_ORDER = { gender: ["Male", "Female", "Other", "Prefer not to respond"], workModel: ["Onsite", "Remote", "Hybrid"] };
// A group keeps one colour whether it's counted (Composition) or scored (Score by Group).
const groupColor = (axis, group, i) => { const o = COMPOSITION_ORDER[axis]; return segmentColor(axis, o ? Math.max(0, o.indexOf(group)) : i); };
const COMPOSITION_LABEL = { gender: "Gender", workModel: "Work", location: "Location", jobLevel: "Job Level", department: "Department", tenure: "Employment Duration", employmentStatus: "Employment" };
const MONEY_COLORS = { Productivity: ds.text.accent, Absenteeism: ds.utility.graphColors.main.teamBlue, Retention: ds.utility.graphColors.main.teal, "Injury/Claims": ds.utility.graphColors.main.lavenderViolet };

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
/* An Insight-only widget (the board's first template at each size). */
const Only = ({ size, children, style, center }) => <Sections size={size}><Insight style={style} center={center}>{children}</Insight></Sections>;

/* How many of a set of values land in each status band. */
function bandCounts(values) {
  return countByStatus(values);
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
    // Insight only: the two tiers need the whole Insight (88px), so "N more" sits at its foot, not in a 24px Evidence Bar.
    return (
      <Only size="1x1">
        <DriverGroupedList rows={picked} tierLabels={noun === "Drivers" ? { great: "Top", average: "Average", poor: "Bottom" } : undefined} />
        <MoreLine>{rows.length - 2} more {noun}</MoreLine>
      </Only>
    );
  }
  const shown = pickTiered(rows);
  return (
    <Only size="2x2" style={{ gap: 6 }}>
      <DriverGroupedList rows={shown} />
      {rows.length > shown.length && <MoreLine>{rows.length - shown.length} more {noun}</MoreLine>}
    </Only>
  );
}


/* The design's own sample figures for anything that has no data behind it. */
const SAMPLE = { team: { score: 87, d: 9, members: 15, rate: 95, counts: [9, 3, 3] } };

export default function WidgetBody({ familyId, formIndex = 0 }) {
  const avg = Math.round(LATEST.avgOverall);
  const avgDelta = delta(LATEST.avgOverall, PREVIOUS.avgOverall);
  const orgPeople = { f: LATEST.flourishing, s: LATEST.striving, t: LATEST.struggling };
  const explorers = bandCounts(DIMENSIONS.map((d) => dimensionValue(d)));

  switch (familyId) {
    /* ---- Score ---- */
    /* One Score card for every subject (widgets/ScoreCard.jsx, lib/scoreWidget.js): who and what decide what it may
       show, each form picks from that. */
    case "org-score": {
      const data = { value: avg, delta: avgDelta, date: LATEST.date, n: EMPLOYEE_COUNT, rate: participationRate(), people: orgPeople };
      return <ScoreCard size={formIndex === 1 ? "1x1" : "2x2"} who="org" what="overall" data={data} />;
    }

    case "your-score": {
      const data = { value: avg, delta: avgDelta, date: LATEST.date, parts: explorers, partsNoun: "Explorers" };
      const show = [["score", "change", "date"], ["score", "change", "date", "parts"], null, null][formIndex];
      return <ScoreCard size={formIndex % 2 ? "2x2" : "1x1"} who="person" what="overall" data={data} show={show} />;
    }

    case "team-score": {
      const s = SAMPLE.team;
      const data = { value: formIndex === 0 ? 83 : s.score, delta: s.d, date: LATEST.date, n: s.members, rate: s.rate, people: { f: s.counts[0], s: s.counts[1], t: s.counts[2] } };
      return <ScoreCard size={formIndex === 0 ? "1x1" : "2x2"} who="team" what="overall" data={data} />;
    }

    case "explorer-score": {
      const dim = "Physical Health";
      const parts = bandCounts((DIMENSION_DRIVERS[dim] || []).map((x) => driverValue(x)));
      const data = { value: Math.round(dimensionValue(dim)), delta: delta(dimensionValue(dim), dimensionValue(dim, PREVIOUS)), date: LATEST.date, parts, partsNoun: "Drivers" };
      if (formIndex === 2) return <ScoreCard size="1x1" who="team" what="explorer" data={{ ...data, n: SAMPLE.team.members, rate: SAMPLE.team.rate }} numberSize={48} />;
      if (formIndex === 3) return <ScoreCard size="1x1" who="org" what="explorer" data={{ ...data, n: EMPLOYEE_COUNT, rate: participationRate() }} numberSize={48} />;
      if (formIndex === 4) return <ScoreCard size="2x2" who="person" what="explorer" data={data} />;
      return <ScoreCard size="1x1" who="person" what="explorer" data={data} show={formIndex === 0 ? ["score", "change", "date"] : null} numberSize={48} />;
    }

    case "index":
      if (formIndex === 2) return <Only size="2x2" center><DimensionIndex dimension="Corporate Culture" /></Only>;
      return <Only size={formIndex === 1 ? "3x3" : "2x2"} center><IndexRing variant={formIndex === 1 ? "3x3" : "2x2"} overall={LATEST.avgOverall} /></Only>;

    /* ---- Status ---- */
    /* One Status card for every subject (widgets/StatusCard.jsx): a population's bar is its people, one person's is
       their Explorers. */
    case "org-status": {
      const form = familyById("org-status").forms[formIndex];
      const { who, what } = form.subject;
      const s = SAMPLE.team;
      const data = who === "team" ? { value: s.score, n: s.members, people: { f: s.counts[0], s: s.counts[1], t: s.counts[2] } }
        : who === "person" ? { value: avg, parts: explorers, partsNoun: "Explorers" }
        : { value: avg, people: orgPeople };
      return <StatusCard size={form.size} who={who} what={what} data={data} />;
    }

    /* ---- ENPS ---- */
    case "enps": {
      const g = enpsGroups();
      const prev = enpsGroups(1);
      const score = Math.round(((g.promoters - g.detractors) / g.total) * 100);
      const d = score - Math.round(((prev.promoters - prev.detractors) / prev.total) * 100);
      const bar = <EvidenceSegmentBar flourishing={g.promoters} striving={g.passives} struggling={g.detractors} />;
      if (formIndex === 0) {
        // Board example (15497:3164): the number in the Insight, the bar in the Evidence Bar.
        return (
          <Sections size="1x1">
            <Insight center>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.96, color: ds.text.primary, lineHeight: 0.9 }}>{score}</span>
                <TrendPill delta={d} compact />
              </div>
            </Insight>
            <Evidence>{bar}</Evidence>
          </Sections>
        );
      }
      if (formIndex === 1) {
        return (
          <Sections size="2x2">
            <Insight center><span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1.3, color: ds.text.primary, lineHeight: 0.82 }}>{score}</span></Insight>
            <Evidence style={{ gap: 12 }}>
              {bar}
              <GroupCounts items={[["Promoters", g.promoters, ds.status.success.textIndicator], ["Passives", g.passives, ds.status.warning.textIndicator], ["Detractors", g.detractors, ds.status.error.textIndicator]]} />
            </Evidence>
          </Sections>
        );
      }
      return (
        <Sections size="2x2">
          <Insight center>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1.3, color: ds.text.primary, lineHeight: 0.82 }}>{score}</span>
              <TrendPill delta={d} />
            </div>
          </Insight>
          <Evidence style={{ gap: 12 }}>
            {bar}
            <span style={{ fontSize: 11, color: ds.text.tertiary, lineHeight: "16px" }}>
              Across the <b style={{ color: ds.text.primary }}>{g.total}</b> people who answered, <b style={{ color: ds.status.success.textIndicator }}>{g.promoters}</b> are Promoters, <b style={{ color: ds.status.warning.textIndicator }}>{g.passives}</b> are Passives, and <b style={{ color: ds.status.error.textIndicator }}>{g.detractors}</b> are Detractors.
            </span>
          </Evidence>
        </Sections>
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
          <Sections size="1x1">
            <Insight center>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BigNumber value={Math.round(value)} size={48} colorBand />
                <TrendPill delta={trendDelta} numberOnly />
              </div>
            </Insight>
            <Evidence><span title={group} style={{ fontSize: 11, fontWeight: 700, color: ds.text.primary, lineHeight: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{group}</span></Evidence>
          </Sections>
        );
      }
      if (formIndex === 1) {
        const areas = groups.filter((g) => g.value < FLOURISHING_AT);
        return (
          <Sections size="1x1">
            <Insight style={{ gap: 6 }}>{areas.slice(0, 2).map((g) => <FocusRow key={g.axis + g.group} name={g.group} value={g.value} />)}</Insight>
            {areas.length > 2 && <Evidence><MoreLine bottom={false}>{areas.length - 2} more Areas</MoreLine></Evidence>}
          </Sections>
        );
      }
      if (formIndex === 2) {
        const CATEGORIES = [["People", ["Gender"]], ["Organisation", ["Department", "Job Level"]], ["Employment", ["Tenure", "Employment Status", "Work Model"]], ["Locations", ["Location"]]];
        return (
          <Only size="2x2" style={{ gap: 12 }}>
            {/* Three categories fit a 2x2; the rest are counted in "N more" at the foot. */}
            {CATEGORIES.filter(([, axes]) => groups.some((x) => axes.includes(x.axis))).slice(0, 3).map(([title, axes]) => {
              const g = groups.find((x) => axes.includes(x.axis));
              return (
                <div key={title} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, lineHeight: "16px", fontWeight: 400, color: ds.text.accent }}>{title}</span>
                  <FocusRow name={g.group} value={g.value} tag={g.axis} delta={g.delta} sub={`${g.struggling}/${g.n} (${Math.round((g.struggling / g.n) * 100)}%) employees are struggling`} />
                </div>
              );
            })}
            {(() => {
              const shown = Math.min(3, CATEGORIES.filter(([, axes]) => groups.some((x) => axes.includes(x.axis))).length);
              const more = groups.filter((g) => g.value < FLOURISHING_AT).length - shown;
              return more > 0 ? <MoreLine bottom>{more} more Areas</MoreLine> : null;
            })()}
          </Only>
        );
      }
      // Chart rules, horizontal bars (Comparison): one 0–100 scale, 2x2 up to 13 groups, value labels in the bar's colour.
      const rows = groups.filter((g) => g.axis === "Department").map((g) => ({ label: g.group, value: g.value, color: band(g.value).c }));
      return <Only size="2x2" center><HBars rows={rows} size="2x2" values noun="departments" /></Only>;
    }

    case "heat-map": {
      // Template Insight + Evidence Bar: four groups (18px rows fill the 72px Insight), the tiles cut off at the card's
      // edge, and "More" in the Evidence Bar (the whole map is in its full-view Scope).
      const { rows } = heatMap(4, 4);
      return (
        <Sections size="1x1">
          <Insight><HeatTable rows={rows} /></Insight>
          <Evidence><MoreLine bottom={false}>More</MoreLine></Evidence>
        </Sections>
      );
    }

    /* ---- Explorers & Drivers ---- */
    case "explorers":
      return <RankedList rows={dimensionRankedRows()} noun="Explorers" form={formIndex === 1 ? "1x1" : "2x2"} />;
    case "factors": {
      // One Drivers widget: it ranks the Drivers under the page it sits on (lib/driversWidget.js), as many as fit.
      const form = familyById("factors").forms[formIndex];
      const names = new Set(driversOnPage(form.page));
      return <RankedList rows={driverRankedRows().filter((r) => names.has(r[0]))} noun="Drivers" form={form.size} />;
    }

    /* ---- Score by Group (Comparison) ---- */
    /* A score for each group of people on one fixed 0–100 scale; hover a bar for its score. Chart rules: 2 to 4 groups
       in a 1x1 (no value labels: the 48px value area would leave a 26px plot), 5 or more in a 2x2. Groups under 5
       people are never shown. */
    case "avg-gender":
    case "avg-work-model": {
      const form = familyById(familyId).forms[formIndex];
      const rows = groupRows(form.axis, LAST).filter((g) => !g.hidden).sort((a, b) => b.score - a.score)
        .map((g, i) => ({ label: g.group, value: g.score, color: groupColor(form.axis, g.group, i) }));
      const size = comparisonSize(rows.length);
      return <Only size={size} center={size === "1x1"}><HBars rows={rows} size={size} values={size !== "1x1"} noun="groups" /></Only>;
    }

    /* ---- Composition ---- */
    /* Who makes up the organisation, or what a total is made of (ChartInsight.jsx CompositionInsight); the form follows
       the number of groups (compositionFit). Hover a part for how many people (or hours, or dollars) it holds. */
    case "composition": {
      const form = familyById("composition").forms[formIndex];
      const { axis, form: kind, legend } = form.comp;
      if (axis === "impactTime" || axis === "impactMoney") {
        const time = axis === "impactTime", m = impact();
        const parts = time ? [["Productivity", m.hours.productivity], ["Absenteeism", m.hours.absenteeism]] : [["Productivity", m.dollars.productivity], ["Absenteeism", m.dollars.absenteeism], ["Retention", m.dollars.retention], ["Injury/Claims", m.dollars.claims]];
        const total = parts.reduce((a, [, v]) => a + v, 0) || 1;
        const rows = parts.map(([group, v]) => ({ group, n: time ? Math.round(v) : Math.round(v), pct: Math.round((v / total) * 100) }));
        const fmt = time ? (v) => `${v} hrs` : fmtMoney;
        return <CompositionInsight rows={rows} axisKey={axis} label={time ? "Time" : "Money"} size={form.size} form={kind} legend={legend !== false} format={fmt} tipText={time ? (v) => `${v} hrs per person` : (v) => `${fmtMoney(v)} a year`} />;
      }
      const order = COMPOSITION_ORDER[axis];
      const rows = groupRows(axis, LAST).map((g) => ({ group: g.group, n: g.n, pct: g.pct }))
        .sort((a, b) => (order ? order.indexOf(a.group) - order.indexOf(b.group) : 0));
      return <CompositionInsight rows={rows} axisKey={axis} label={COMPOSITION_LABEL[axis] || axis} size={form.size} form={kind} legend={legend !== false} />;
    }
    case "popular-responses":
      // No free-text theme data in the generated dataset (the survey's open-text
      // questions weren't modelled), so these are sample themes.
      // Chart rules, treemap (Composition): value-proportional tiles, 1x1 exactly 3, 2x2 3 to 7. The 1x1 shows the
      // three largest of the same sample, so the two sizes agree.
      {
        // Same sample themes as the Response Analysis Scope it opens (lib/responseSample.js), so the two agree.
        const themes = themeTotals().map((t) => ({ label: t.label, value: t.value, color: t.color }));
        return formIndex === 1 ? <Only size="2x2"><Treemap rows={themes} size="2x2" /></Only> : <Only size="1x1"><Treemap rows={themes.slice(0, 3)} size="1x1" /></Only>;
      }

    /* ---- Score over time ---- */
    case "score-history": {
      const points = ROUNDS.map((r) => Math.round(r.avgOverall));
      // Graph insight rules (docs/widget-insight-rules.md): 1x1 up to 3 rounds, 2x2 up to 7; past that the widget grows or gives way to the detailed view.
      return <GraphInsight series={[{ points }]} labels={ROUND_LABELS} size={formIndex === 1 ? "1x1" : "2x2"} delta={avgDelta} evidence={<HistoryCaption points={points} labels={ROUND_LABELS} noun="the Org Score" />} />;
    }

    /* ---- Score comparisons ---- */
    case "score-comparisons": {
      const next = new Date(LATEST.date);
      next.setDate(next.getDate() + 33);
      const when = next.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (formIndex === 2) return <Only size="1x1"><LockedBody date={when} /></Only>;
      if (formIndex === 3) return <Only size="2x2"><LockedBody date={when} text="Your score compared with your team(s) and the organisation" /></Only>;
      if (formIndex === 0)
        return (
          <Sections size="1x1">
            <Insight style={{ gap: 8 }}>
              <CompareRow label="Team Score" value={64} />
              <CompareRow label="Org Score" value={avg} />
            </Insight>
            <Evidence><MoreLine bottom={false}>1 more Comparison</MoreLine></Evidence>
          </Sections>
        );
      return (
        <Only size="2x2" style={{ gap: 12 }}>
          <CompareRow label="Your Score" value={83} icon={CompareIcons.you} delta={9} big />
          <CompareRow label="Team Score" value={71} icon={CompareIcons.team} chip="team-a@example.com" big />
          <CompareRow label="Team Score" value={64} icon={CompareIcons.team} chip="team-b@example.com" big />
          <CompareRow label="Org Score" value={avg} icon={CompareIcons.org} big />
        </Only>
      );
    }

    /* ---- Health age (design sample values — no age field in the dataset) ---- */
    case "health-age": {
      const persona = formIndex < 2 ? "personal" : formIndex < 4 ? "team" : "org";
      const older = persona === "org"; // the Org frame shows the "older" state
      const tone = older ? ds.status.error.textIndicator : ds.status.success.textIndicator;
      const who = persona === "personal" ? "Your health actions make you" : persona === "team" ? "Your Team's health actions make them" : "Your Employees' health actions make them";
      const gapChip = (
        <span style={{ alignSelf: "flex-start", background: older ? ds.status.error.bg : ds.status.success.bg, color: older ? ds.status.error.textIndicator : ds.status.success.textIndicator, borderRadius: 9999, padding: "4px 8px", fontSize: 11, fontWeight: 700 }}>
          {older ? "1 yr 1 mo older" : "2 yrs 3 mo younger"}
        </span>
      );
      if (formIndex % 2 === 0) {
        // Board example (15497:3180): the age in the Insight, the gap in the Evidence Bar.
        return (
          <Sections size="1x1">
            <Insight center>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AgeNumber years={26} months={3} color={tone} />
                <TrendPill delta={older ? 2 : -2} compact positive={older} />
              </div>
            </Insight>
            <Evidence>{gapChip}</Evidence>
          </Sections>
        );
      }
      return (
        <Sections size="2x2">
          <Insight style={{ justifyContent: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AgeNumber years={26} months={3} color={tone} size={36} />
            {older
              ? <span style={{ display: "inline-flex", gap: 4, background: ds.status.success.bg, color: ds.status.success.text, borderRadius: 9999, height: 20, boxSizing: "border-box", lineHeight: "20px", alignItems: "center", padding: "0 8px", fontSize: 11 }}>▲ Improved by <b style={{ color: ds.status.success.textIndicator }}>2 yrs 3 mo</b></span>
              : <span style={{ display: "inline-flex", gap: 4, background: ds.status.error.bg, color: ds.status.error.text, borderRadius: 9999, height: 20, boxSizing: "border-box", lineHeight: "20px", alignItems: "center", padding: "0 8px", fontSize: 11 }}>▼ Declined by <b style={{ color: ds.status.error.textIndicator }}>2 yrs 3 mo</b></span>}
          </div>
          <span style={{ fontSize: 11, color: ds.text.primary, lineHeight: "16px" }}>{who} <b style={{ color: tone }}>{older ? "1 yr 1 mo older" : "2 yrs 3 mo younger"}</b> than your actual age.</span>
          </Insight>
          <Evidence><AgeScale older={older} /></Evidence>
        </Sections>
      );
    }

    /* ---- Mental well-being ---- */
    case "mental-wellbeing": {
      if (formIndex < 2) {
        const rowsEl = (
          <div style={{ display: "flex", flexDirection: "column", gap: formIndex === 1 ? 12 : 4 }}>
            <SeverityRow label="Feeling Low" level="Moderate" trend={formIndex === 1 ? "up" : undefined} />
            <SeverityRow label="Feeling Anxious" level="Severe" trend={formIndex === 1 ? "down" : undefined} />
            <SeverityRow label="Feeling Stressed" level="Extremely Severe" trend={formIndex === 1 ? "down" : undefined} />
          </div>
        );
        // 2x2 (template Insight + Action Bar): the Get Support button sits in the Action Bar, at the right.
        return formIndex === 1
          ? <Sections size="2x2"><Insight>{rowsEl}</Insight><ActionBar><SupportButton tone={ds.utility.graphColors.main.personalBlue} /></ActionBar></Sections>
          : <Only size="1x1" center>{rowsEl}</Only>;
      }
      const team = formIndex < 4;
      const tone = team ? TEAM_BLUE : ds.utility.graphColors.main.orgBlue;
      const rows = team ? [["Feeling Low", 60, -3], ["Feeling Anxious", 24, 2], ["Feeling Stressed", 32, 2]] : feelingShare();
      const big = formIndex % 2 === 1;
      return (
        <Only size={big ? "2x2" : "1x1"} style={{ gap: big ? 8 : 4 }}>
          <span style={{ ...muted11, lineHeight: "13px" }}>{team ? "Team" : "Org"} distribution (%)</span>
          <div style={{ display: "flex", flexDirection: "column", gap: big ? 12 : 4 }}>
            {rows.map(([label, pct, d]) => <DistributionRow key={label} label={label} pct={pct} delta={big ? d : undefined} tone={tone} bar={big} />)}
          </div>
        </Only>
      );
    }

    /* ---- Time & Money ---- */
    // Time / Money Impact and Time to Gain: what people would get back if scores reached Flourishing (lib/impactModel.js —
    // real gaps, sample rates). Fewer hours to gain than last round is the good direction.
    case "time-impact": {
      const series = impactSeries();
      const now = Math.round(series[series.length - 1].hours.total), before = Math.round(series[series.length - 2]?.hours.total ?? now);
      const team = formIndex === 1;
      const tone = team ? TEAM_BLUE : ds.utility.graphColors.main.orgBlue;
      return (
        <Sections size="1x1">
          <Insight center>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <BigNumber value={team ? 25 : now} size={48} unit="hrs to gain" color={tone} />
              {!team && now !== before && <TrendPill compact positive={now < before} />}
            </div>
          </Insight>
          <Evidence><span style={date11}>per person, per year</span></Evidence>
        </Sections>
      );
    }
    case "time-gain": {
      const p = samplePerson();
      return (
        <Sections size="1x1">
          <Insight center><BigNumber value={Math.round(p.hours)} size={48} unit="hrs" color={ds.utility.graphColors.main.orgBlue} /></Insight>
          <Evidence><span style={date11}>to gain, per year</span></Evidence>
        </Sections>
      );
    }
    case "money-composition": {
      const m = impact().dollars;
      // Chart rules, compact grid (Composition): dollar tiles over a proportion bar; 1x1 holds up to 4.
      return <Only size="1x1"><TileGrid size="1x1" format={fmtMoney} rows={[["Productivity", m.productivity], ["Absenteeism", m.absenteeism], ["Retention", m.retention], ["Injury/Claims", m.claims]].map(([label, value]) => ({ label, value, color: MONEY_COLORS[label] }))} /></Only>;
    }

    /* ---- Support ---- */
    case "support-nudge":
      // Board example (15497:3215): the message in the Insight, the button in the Action Bar at the right.
      return (
        <Sections size="1x1">
          <Insight>
            <span style={{ fontSize: 13, color: ds.text.primary, lineHeight: "18px" }}>
              {formIndex === 0 ? "Struggling or just want to be heard? Get support now." : "Want help with low Psychological Health Scores?"}
            </span>
          </Insight>
          <ActionBar><SupportButton tone={formIndex === 0 ? ds.text.primary : ds.text.accent} /></ActionBar>
        </Sections>
      );

    default:
      return <Only size="1x1" />;
  }
}
