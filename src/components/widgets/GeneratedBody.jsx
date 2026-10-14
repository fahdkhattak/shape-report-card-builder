import { T, band } from "../../lib/tokens.js";
import {
  BigNumber,
  TrendPill,
  DriverGroupedList,
  StatusRing,
  ScatterMini,
  RadarChart,
  Gauge,
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
      const b = payload.r < 0 ? T.redStrong : T.greenStrong;
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: b }}>
            {payload.r < -0.4 ? "Strong negative" : payload.r < 0 ? "Weak negative" : payload.r < 0.4 ? "Weak positive" : "Strong positive"} correlation
          </span>
          <ScatterMini topicA={payload.topicA} topicB={payload.topicB} r={payload.r} points={payload.points} />
        </div>
      );
    }
    case "trend": {
      // Graph rules: fixed 0–100 scale, change pill, 1x1 shows the last 3 rounds, 2x2 up to 7.
      const pts = payload.points, d = pts[pts.length - 1] - pts[pts.length - 2];
      return <GraphInsight series={[{ points: pts }]} labels={pts.map((_, i) => `R${i + 1}`)} size={size} delta={d} />;
    }
    case "bar":
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          {/* Topics compared on one 0–100 score scale: colour = the score's own status band
              (the same 60/80 thresholds as everywhere else), never a different hue per bar. */}
          {/* Chart rules, horizontal bars: 0–100 scale, 1x1 2 to 5 categories, 2x2 up to 13. */}
          <HBars size={size} values={size === "2x2"} rows={payload.rows.map((r, i) => ({ label: r[0], value: r[1], color: payload.byStatus ? band(r[1]).c : [T.teamBlue, T.hotPink, T.goldenYellow, T.lavender, T.turquoise][i % 5] }))} />
        </div>
      );
    case "ranking":
      return <DriverGroupedList rows={payload.rows} />;
    case "status":
      return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><StatusRing status={payload.status} /></div>;
    case "radar":
      return <RadarChart items={payload.items} />;
    case "gauge":
      return <Gauge value={payload.value} />;
    case "insight":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
          <p style={{ fontSize: 12.5, color: T.gray900, lineHeight: 1.5, margin: 0 }}>{payload.text}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <BigNumber value={payload.stat} size={28} colorBand />
            <span style={{ fontSize: 10, color: T.gray500 }}>strength of the link (0–100)</span>
          </div>
        </div>
      );
    case "metric":
    default:
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <BigNumber value={payload.value} colorBand size={40} />
            <TrendPill delta={payload.delta} />
          </div>
        </div>
      );
  }
}
