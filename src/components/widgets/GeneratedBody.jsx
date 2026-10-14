import { T, band } from "../../lib/tokens.js";
import {
  BigNumber,
  TrendPill,
  DriverGroupedList,
  MiniBarChart,
  Sparkline,
  StatusRing,
  ScatterMini,
  RadarChart,
  Gauge,
} from "./primitives.jsx";
import SubjectBody from "./SubjectBody.jsx";

/* ================================================================== */
/* GENERATED WIDGET BODY RENDERER (chat-generated)                     */
/* Renders whatever vizType the generative engine produced.            */
/* ================================================================== */
export default function GeneratedBody({ spec }) {
  const { vizType, payload } = spec;
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
    case "trend":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <TrendPill delta={payload.points[payload.points.length - 1] - payload.points[payload.points.length - 2]} />
          <Sparkline points={payload.points} xLabels={payload.points.map((_, i) => `R${i + 1}`)} />
        </div>
      );
    case "bar":
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          {/* Topics compared on one 0–100 score scale: colour = the score's own status band
              (the same 60/80 thresholds as everywhere else), never a different hue per bar. */}
          <MiniBarChart rows={payload.rows} colors={payload.byStatus ? payload.rows.map((r) => band(r[1]).c) : [T.teamBlue, T.hotPink, T.goldenYellow, T.lavender, T.turquoise]} />
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
