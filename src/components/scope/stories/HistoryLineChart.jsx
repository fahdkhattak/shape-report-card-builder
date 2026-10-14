import { useRef, useState } from "react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { ROUNDS } from "../../../lib/dataset.js";
import { LAST, fmtDate, fmtMonth } from "../../../lib/scopeData.js";
import { TrendPill } from "../../widgets/primitives.jsx";

/* ================================================================== */
/* HISTORY LINE CHART — one measure across rounds, in the Score History  */
/* style (Figma 984qJvMt7fCHASYHRwgrab, nodes 13622:38049 / 38393): a     */
/* thin grey line with grey dots, each score labelled in its band colour, */
/* "SCORE" down the side, the latest round's date in bold. Hovering a     */
/* round draws a dashed guide, rings the dot and opens a tooltip: YOUR     */
/* SCORE for that round, and COMPARED TO the round before it.             */
/* ================================================================== */
const W = 776, H = 280, PL = 64, PR = 48, PT = 28, PB = 40;
const LINE = "#908d8e";

export default function HistoryLineChart({ values, banded = true, domain = [0, 100], ticks = [0, 20, 40, 60, 80, 100], unit = "" }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const n = ROUNDS.length;
  const [lo, hi] = domain;
  const x = (i) => PL + (n === 1 ? 0 : (i / (n - 1)) * (W - PL - PR));
  const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const colorOf = (v) => (banded ? band(v).cs : T.gray900);

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - PL) / (W - PL - PR)) * (n - 1)))));
  };
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const tipRight = hover != null && hover < (n - 1) / 2 + 0.01;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: W, aspectRatio: `${W} / ${H}`, margin: "0 auto" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke={T.gray75} strokeWidth="1" />
            <text x={PL - 10} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fontFamily={font} fill={T.gray500}>{t}</text>
          </g>
        ))}
        <text transform={`translate(14 ${(PT + H - PB) / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="0.6" fontFamily={font} fill={T.gray700}>SCORE</text>
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PT - 8} y2={H - PB} stroke={T.gray300} strokeWidth="1.2" strokeDasharray="4 4" />}
        <path d={path} fill="none" stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
        {values.map((v, i) => (
          <g key={i}>
            {hover === i ? (
              <>
                <circle cx={x(i)} cy={y(v)} r="8" fill={T.white} stroke={T.gray600} strokeWidth="2" />
                <circle cx={x(i)} cy={y(v)} r="4" fill={T.gray600} />
              </>
            ) : (
              <circle cx={x(i)} cy={y(v)} r="3.5" fill={LINE} />
            )}
            <text x={x(i)} y={y(v) - 14} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily={font} fill={colorOf(v)}>{v}{unit}</text>
          </g>
        ))}
        {ROUNDS.map((r, i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fontFamily={font} fontWeight={i === LAST || hover === i ? 700 : 400} fill={hover === i ? T.gray900 : T.gray500}>{fmtMonth(r.date)}</text>
        ))}
      </svg>
      {hover != null && (
        <div
          style={{
            position: "absolute", left: `${(x(hover) / W) * 100}%`, top: 12, pointerEvents: "none", zIndex: 3, width: 168, boxSizing: "border-box",
            transform: `translateX(${tipRight ? "16px" : "calc(-100% - 16px)"})`, background: T.gray25, borderRadius: radius.lg, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, fontFamily: font,
            boxShadow: "0 17px 5px rgba(0,0,0,0.01), 0 11px 4px rgba(0,0,0,0.02), 0 6px 4px rgba(0,0,0,0.05), 0 3px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.09)",
          }}
        >
          <Stamp eyebrow="Your score" date={ROUNDS[hover].date} value={values[hover]} unit={unit} color={colorOf(values[hover])} delta={hover > 0 ? values[hover] - values[hover - 1] : null} />
          {hover > 0 && <Stamp eyebrow="Compared to" date={ROUNDS[hover - 1].date} value={values[hover - 1]} unit={unit} color={colorOf(values[hover - 1])} />}
        </div>
      )}
    </div>
  );
}

function Stamp({ eyebrow, date, value, unit, color, delta }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: T.gray600 }}>{eyebrow}</span>
      <div style={{ borderLeft: `2px solid ${color}`, paddingLeft: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.3px", textTransform: "uppercase", color: T.gray600 }}>{fmtDate(date)}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color }}>{value}{unit}</span>
          {delta != null && delta !== 0 && <TrendPill delta={delta} numberOnly />}
        </span>
      </div>
    </div>
  );
}
