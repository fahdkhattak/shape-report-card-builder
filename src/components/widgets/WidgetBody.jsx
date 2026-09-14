import { T } from "../../lib/tokens.js";
import {
  BigNumber,
  TrendPill,
  EvidenceSegmentBar,
  StatusBreakdown,
  DriverGroupedList,
  Sparkline,
  MiniBarChart,
  Treemap,
  StatusRing,
  IndexRing,
} from "./primitives.jsx";
import {
  ROUNDS, LATEST, PREVIOUS, ROUND_LABELS, delta,
  dimensionRankedRows, driverRankedRows, driverValue, driverTrend,
  avgScoreByGender, avgScoreByWorkModel, worstDemographicGroup,
} from "../../lib/dataset.js";

const orgStatus = (score) => (score >= 70 ? "Flourishing" : score >= 40 ? "Striving" : "Struggling");
const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
const GENDER_COLORS = { Male: T.teamBlue, Female: T.hotPink, Other: T.goldenYellow, "Prefer not to respond": T.gray300 };
const WORK_MODEL_COLORS = { Onsite: T.orgBlue, Remote: T.teamBlue, Hybrid: T.mintGreen };

/* ================================================================== */
/* FIXED-FAMILY WIDGET BODY (Library-sourced)                          */
/* Each family has a fixed set of pre-built forms — no AI involved.    */
/* Backed by the real generated dataset (lib/dataset.js /               */
/* data/generate-dataset.js) — full org-wide aggregates, per docs'      */
/* rule that Library-sourced widgets never scope/filter.                */
/* ================================================================== */
export default function WidgetBody({ familyId, formIndex }) {
  switch (familyId) {
    case "your-score": {
      const val = Math.round(LATEST.avgOverall);
      const trendDelta = delta(LATEST.avgOverall, PREVIOUS.avgOverall);
      if (formIndex === 0) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <BigNumber value={val} colorBand unit="/ 100" />
              <TrendPill delta={trendDelta} compact />
            </div>
            <span style={{ fontSize: 11, color: T.gray900 }}>{formatDate(LATEST.date)}</span>
          </div>
        );
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <BigNumber value={val} colorBand />
            <TrendPill delta={trendDelta} />
          </div>
          <EvidenceSegmentBar flourishing={LATEST.flourishing} striving={LATEST.striving} struggling={LATEST.struggling} />
          <span style={{ fontSize: 11, color: T.gray500 }}>
            Across <b style={{ color: T.gray900 }}>{LATEST.flourishing + LATEST.striving + LATEST.struggling}</b> Explorers, <b style={{ color: T.greenStrong }}>{LATEST.flourishing}</b> are Flourishing,{" "}
            <b style={{ color: T.amberStrong }}>{LATEST.striving}</b> are Striving, and <b style={{ color: T.redStrong }}>{LATEST.struggling}</b> are Struggling.
          </span>
        </div>
      );
    }
    case "org-status": {
      const status = orgStatus(LATEST.avgOverall);
      if (formIndex === 0)
        return (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
            <StatusRing status={status} />
            <EvidenceSegmentBar flourishing={LATEST.flourishing} striving={LATEST.striving} struggling={LATEST.struggling} />
          </div>
        );
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
          <StatusRing status={status} />
          <StatusBreakdown flourishing={LATEST.flourishing} striving={LATEST.striving} struggling={LATEST.struggling} />
        </div>
      );
    }
    case "explorers": {
      const rows = dimensionRankedRows();
      const shown = rows.slice(0, 6);
      const remaining = rows.length - shown.length;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "hidden" }}>
          <DriverGroupedList rows={shown} />
          {remaining > 0 && <span style={{ fontSize: 11, color: T.gray300, borderLeft: `2px solid ${T.gray200}`, paddingLeft: 6 }}>{remaining} more Explorers</span>}
        </div>
      );
    }
    case "score-history": {
      const points = ROUNDS.map((r) => Math.round(r.avgOverall));
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <TrendPill delta={delta(LATEST.avgOverall, PREVIOUS.avgOverall)} />
          <Sparkline points={points} xLabels={ROUND_LABELS} />
        </div>
      );
    }
    case "enps": {
      const val = LATEST.eNPS;
      const trendDelta = delta(LATEST.eNPS, PREVIOUS.eNPS);
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}><BigNumber value={val} size={48} /><TrendPill compact positive={trendDelta > 0} /></div>
          <EvidenceSegmentBar flourishing={LATEST.flourishing} striving={LATEST.striving} struggling={LATEST.struggling} />
        </div>
      );
    }
    case "areas-focus": {
      // Per explicit product correction: this surfaces the worst-scoring
      // DEMOGRAPHIC GROUP (e.g. a department, a tenure band), not a
      // dimension — see worstDemographicGroup() in lib/dataset.js.
      const [, group, value, trendDelta] = worstDemographicGroup();
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}><BigNumber value={Math.round(value)} size={48} colorBand /><TrendPill delta={trendDelta} compact /></div>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.gray900 }}>{group}</span>
        </div>
      );
    }
    case "avg-gender": {
      const genderScores = avgScoreByGender();
      const rows = genderScores.map(([g, v]) => [g === "Prefer not to respond" ? "Prefer.." : g, v]);
      const colors = genderScores.map(([g]) => GENDER_COLORS[g]);
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <MiniBarChart rows={rows} colors={colors} />
        </div>
      );
    }
    case "factors": {
      const rows = driverRankedRows();
      const shown = rows.slice(0, 6);
      const remaining = rows.length - shown.length;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "hidden" }}>
          <DriverGroupedList rows={shown} />
          {remaining > 0 && <span style={{ fontSize: 11, color: T.gray300, borderLeft: `2px solid ${T.gray200}`, paddingLeft: 6 }}>{remaining} more Factors</span>}
        </div>
      );
    }
    case "avg-work-model": {
      const rows = avgScoreByWorkModel();
      const colors = rows.map(([w]) => WORK_MODEL_COLORS[w]);
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <MiniBarChart rows={rows} colors={colors} />
        </div>
      );
    }
    case "index":
      return <IndexRing variant={formIndex === 1 ? "3x3" : "2x2"} overall={LATEST.avgOverall} />;
    case "popular-responses":
      // No free-text theme data in the generated dataset (survey's open-text
      // questions weren't modeled) — left as an illustrative placeholder.
      return <div style={{ flex: 1 }}><Treemap tiles={[["Ergonomics", 18], ["", 16], ["", 14]]} /></div>;
    case "time-impact": {
      const wlb = driverValue("Work-life balance");
      const wlbTrend = driverTrend("Work-life balance");
      const hours = Math.round(wlb / 4);
      const trendDelta = delta(wlbTrend[wlbTrend.length - 1], wlbTrend[wlbTrend.length - 2]);
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><BigNumber value={hours} size={48} unit="hrs" /><TrendPill compact positive={trendDelta > 0} /></div>
          <span style={{ fontSize: 11, color: T.gray900 }}>per annum, est. from work-life balance</span>
        </div>
      );
    }
    default:
      return <div style={{ flex: 1 }} />;
  }
}
