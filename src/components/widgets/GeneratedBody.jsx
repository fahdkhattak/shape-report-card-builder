import { T, band } from "../../lib/tokens.js";
import { ds } from "../../lib/ds.js";
import {
  BigNumber,
  TrendPill,
  DriverGroupedList,
  StatusRing,
  ScatterMini,
  RadarChart,
  Gauge,
  Sections, Insight, Evidence,
} from "./primitives.jsx";
import SubjectBody from "./SubjectBody.jsx";
import GraphInsight from "./GraphInsight.jsx";
import { HBars } from "./ChartInsight.jsx";

/* ================================================================== */
/* GENERATED WIDGET BODY RENDERER (chat-generated)                     */
/* Renders whatever vizType the generative engine produced.            */
/* ================================================================== */
export default function GeneratedBody({ spec }) {
  const { vizType, payload } = spec;
  const size = spec.size === "1x1" ? "1x1" : "2x2";
  switch (vizType) {
    // Forms made by the Widget Builder (lib/subjectForms.js) — built from the Library's own parts.
    case "form":
      return <SubjectBody spec={spec} />;
    case "scatter": {
      const b = payload.r < 0 ? ds.status.error.textIndicator : ds.status.success.textIndicator;
      return (
        <Sections size={size}>
          <Insight center style={{ gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: b }}>
              {payload.r < -0.4 ? "Strong negative" : payload.r < 0 ? "Weak negative" : payload.r < 0.4 ? "Weak positive" : "Strong positive"} correlation
            </span>
            <ScatterMini topicA={payload.topicA} topicB={payload.topicB} r={payload.r} points={payload.points} />
          </Insight>
        </Sections>
      );
    }
    case "trend": {
      // Graph rules: fixed 0–100 scale, change pill, 1x1 shows the last 3 rounds, 2x2 up to 7.
      const pts = payload.points, d = pts[pts.length - 1] - pts[pts.length - 2];
      return <GraphInsight series={[{ points: pts }]} labels={pts.map((_, i) => `R${i + 1}`)} size={size} delta={d} />;
    }
    case "bar":
      return (
        <Sections size={size}><Insight center>
          {/* Topics compared on one 0–100 score scale: colour = the score's own status band
              (the same 60/80 thresholds as everywhere else), never a different hue per bar. */}
          {/* Chart rules, horizontal bars: 0–100 scale, 1x1 2 to 5 categories, 2x2 up to 13. */}
          <HBars size={size} values={size === "2x2"} rows={payload.rows.map((r, i) => ({ label: r[0], value: r[1], color: payload.byStatus ? band(r[1]).c : [T.teamBlue, T.hotPink, ds.utility.graphColors.main.goldenYellow, ds.utility.graphColors.main.lavenderViolet, ds.utility.graphColors.main.turquoise][i % 5] }))} />
        </Insight></Sections>
      );
    case "ranking":
      return <Sections size={size}><Insight style={{ overflow: "hidden" }}><DriverGroupedList rows={payload.rows} /></Insight></Sections>;
    case "status":
      return <Sections size={size}><Insight center style={{ alignItems: "center" }}><StatusRing status={payload.status} /></Insight></Sections>;
    case "radar":
      return <Sections size={size}><Insight center><RadarChart items={payload.items} /></Insight></Sections>;
    case "gauge":
      return <Sections size={size}><Insight center style={{ alignItems: "center" }}><Gauge value={payload.value} size={size === "1x1" ? 100 : 180} /></Insight></Sections>;
    case "insight":
      return (
        <Sections size={size}>
          <Insight center><p style={{ fontSize: 12, color: ds.text.primary, lineHeight: 1.5, margin: 0 }}>{payload.text}</p></Insight>
          <Evidence>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <BigNumber value={payload.stat} size={size === "1x1" ? 20 : 28} colorBand />
              <span style={{ fontSize: 11, color: ds.text.tertiary }}>strength of the link (0–100)</span>
            </div>
          </Evidence>
        </Sections>
      );
    case "metric":
    default:
      return (
        <Sections size={size}>
          <Insight center>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <BigNumber value={payload.value} colorBand size={40} />
              <TrendPill delta={payload.delta} compact={size === "1x1"} />
            </div>
          </Insight>
        </Sections>
      );
  }
}
