import { T } from "../../lib/tokens.js";
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

/* ================================================================== */
/* GENERATED WIDGET BODY RENDERER (chat-generated)                     */
/* Renders whatever vizType the generative engine produced.            */
/* ================================================================== */
export default function GeneratedBody({ spec }) {
  const { vizType, payload } = spec;
  switch (vizType) {
    case "scatter": {
      const b = payload.r < 0 ? T.redStrong : T.greenStrong;
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: b }}>
            {payload.r < -0.4 ? "Strong negative" : payload.r < 0 ? "Weak negative" : payload.r < 0.4 ? "Weak positive" : "Strong positive"} correlation
          </span>
          <ScatterMini topicA={payload.topicA} topicB={payload.topicB} r={payload.r} />
        </div>
      );
    }
    case "trend":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <TrendPill delta={payload.points[payload.points.length - 1] - payload.points[0]} />
          <Sparkline points={payload.points} xLabels={payload.points.map((_, i) => `R${i + 1}`)} />
        </div>
      );
    case "bar":
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <MiniBarChart rows={payload.rows} colors={[T.teamBlue, T.hotPink, T.goldenYellow, T.lavender, T.turquoise]} />
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
            <span style={{ fontSize: 10, color: T.gray500 }}>confidence score</span>
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
