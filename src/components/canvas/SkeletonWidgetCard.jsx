import { T, radius } from "../../lib/tokens.js";
import { sizeToSpan, pxForSpan } from "./gridLayout.js";

/* ================================================================== */
/* SKELETON WIDGET CARD — placeholder tile shown on the report canvas   */
/* while a report is being generated (984qJvMt7fCHASYHRwgrab, node      */
/* 12618:40160). Flat gray75 shapes standing in for header/score/bars,  */
/* not real content — no data exists yet at this point in the flow.     */
/* ================================================================== */
export default function SkeletonWidgetCard({ size = "1x1", variant = "metric" }) {
  const span = sizeToSpan(size);
  const bar = (w, h = 8, extra = {}) => <div style={{ width: w, height: h, borderRadius: 4, background: T.gray75, ...extra }} />;

  return (
    <div
      style={{
        gridColumn: `span ${span.col}`,
        gridRow: `span ${span.row}`,
        width: pxForSpan(span.col),
        height: pxForSpan(span.row),
        background: T.white,
        border: `1px solid ${T.gray100}`,
        borderRadius: radius.widget,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxSizing: "border-box",
      }}
    >
      {bar(60, 8)}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
        {variant === "metric" && (
          <>
            {bar(70, 28, { borderRadius: 6 })}
            {bar(90, 8)}
          </>
        )}
        {variant === "bars" && (
          <>
            {bar("100%", 10)}
            {bar("100%", 10)}
            {bar("80%", 10)}
            {bar("60%", 10)}
          </>
        )}
        {variant === "chart" && (
          <>
            {bar(48, 48, { borderRadius: 9999, alignSelf: "center" })}
            {bar(60, 8, { alignSelf: "center" })}
          </>
        )}
      </div>
    </div>
  );
}
