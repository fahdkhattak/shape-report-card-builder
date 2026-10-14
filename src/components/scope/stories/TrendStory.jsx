import { useRef, useState } from "react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { ROUNDS } from "../../../lib/dataset.js";
import { LAST, fmtDate, fmtMonth } from "../../../lib/scopeData.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { StoryCard, noteText } from "./StoryCard.jsx";
import HistoryLineChart from "./HistoryLineChart.jsx";
import { ViewSwitch, CopyTable, Chip } from "./controls.jsx";
import { DataTable, ScoreCell, ChangeCell, tableText } from "./DataTable.jsx";
import { useStoryStyle } from "./storyStyle.js";

/* ================================================================== */
/* TREND STORY — how a measure changed across rounds (Figma 13622:37493). */
/* Needs at least two comparable rounds. It never offers "Compare          */
/* previous rounds" — the Story already shows history.                     */
/*   mode "single" — one line; chips pick which series (e.g. an Explorer)  */
/*                   and            */
/*   mode "multi"  — every series drawn together with a legend             */
/* Table View: a per-round table for one series, or a series × rounds      */
/* matrix when there are several.                                          */
/* ================================================================== */
const W = 776, H = 280, PL = 40, PR = 24, PT = 24, PB = 32;
const LINE_COLORS = [T.teamBlue, T.hotPink, T.mintGreen, T.goldenYellow, T.lavender, T.orgBlue];

export default function TrendStory({ title = "Score Over Time", line, series, mode = "single", domain = [0, 100], ticks = [0, 20, 40, 60, 80, 100], banded = true, unit = "", chipLabel = "Explorer Changes", note }) {
  const refined = useStoryStyle() === "refined";
  const [view, setView] = useState("chart");
  const [key, setKey] = useState(series[0].key);
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const n = ROUNDS.length;
  const active = mode === "single" ? series.find((s) => s.key === key) || series[0] : null;
  const drawn = mode === "single" ? [active] : series;
  const colorOf = (s, i) => s.color || (mode === "multi" ? LINE_COLORS[i % LINE_COLORS.length] : T.gray900);

  const x = (i) => PL + (n === 1 ? 0 : (i / (n - 1)) * (W - PL - PR));
  const [lo, hi] = domain;
  const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - PL) / (W - PL - PR)) * (n - 1)))));
  };

  const fmt = (v) => (v == null ? "—" : `${v}${unit}`);
  const matrix = series.length > 1;
  const roundCols = ROUNDS.map((r, i) => ({ key: `r${i}`, label: fmtMonth(r.date), align: "right", render: (row) => <ScoreCell v={banded ? row.values[i] : null} />, text: (row) => row.values[i] ?? "" }));
  const matrixCols = [{ key: "label", label: chipLabel.replace(" Changes", "") }, ...roundCols.map((c, i) => ({ ...c, render: (row) => (banded ? <ScoreCell v={row.values[i]} /> : fmt(row.values[i])) }))];
  const singleRows = active ? [...active.values.map((v, i) => ({ date: fmtDate(ROUNDS[i].date), v, d: i > 0 ? v - active.values[i - 1] : null }))].reverse() : [];
  const singleCols = [
    { key: "date", label: "Report round" },
    { key: "v", label: "Score", align: "right", render: (r) => (banded ? <ScoreCell v={r.v} /> : fmt(r.v)) },
    { key: "d", label: "Change from previous round", align: "right", render: (r) => <ChangeCell d={r.d} none="First recorded score" />, text: (r) => (r.d == null ? "First recorded score" : r.d > 0 ? `+${r.d}` : r.d) },
  ];
  const tableCols = mode === "single" && !matrix ? singleCols : matrixCols;
  const tableRows = mode === "single" && !matrix ? singleRows : series;

  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(tableCols, tableRows)} />];

  return (
    <StoryCard title={title} controls={controls} line={line}>
      {view === "table" ? (
        <DataTable columns={tableCols} rows={tableRows} />
      ) : (
        <>
          {mode === "single" && series.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.gray500, fontFamily: font }}>{chipLabel}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {series.map((s) => <Chip key={s.key} active={s.key === active.key} onClick={() => setKey(s.key)}>{s.label}</Chip>)}
              </div>
            </div>
          )}
          {mode === "multi" && (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: T.gray700, fontFamily: font }}>
              {series.map((s, i) => <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: colorOf(s, i) }} />{s.label}</span>)}
            </div>
          )}
          {mode === "single" ? (
            <HistoryLineChart values={active.values} banded={banded} domain={domain} ticks={ticks} unit={unit} />
          ) : (
          <div style={{ position: "relative", width: "100%", maxWidth: W, aspectRatio: `${W} / ${H}`, margin: "0 auto" }}>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke={T.gray75} strokeWidth="1" />
                  <text x={PL - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fontFamily={font} fill={T.gray500}>{t}</text>
                </g>
              ))}
              {ROUNDS.map((r, i) => <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fontFamily={font} fill={hover === i ? T.gray900 : T.gray500} fontWeight={hover === i ? 700 : 400}>{fmtMonth(r.date)}</text>)}
              {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke={T.gray100} strokeWidth="1" strokeDasharray="4 3" />}
              {drawn.map((s, si) => {
                const c = colorOf(s, si);
                const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)]));
                const path = pts.filter(Boolean).map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
                return (
                  <g key={s.key}>
                    <path d={path} fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    {pts.map((p, i) => p && (
                      <g key={i}>
                        <circle cx={p[0]} cy={p[1]} r={hover === i ? 6 : 4} fill={T.white} stroke={c} strokeWidth="2.5" />
                        {mode === "single" && <text x={p[0]} y={p[1] - 12} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily={font} fill={banded ? band(s.values[i]).cs : T.gray900}>{s.values[i]}</text>}
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
            {hover != null && (
              <div style={{ position: "absolute", left: `${(x(hover) / W) * 100}%`, top: 8, transform: `translateX(${hover === n - 1 ? "-100%" : hover === 0 ? "0" : "-50%"})`, pointerEvents: "none", background: T.gray25, borderRadius: radius.lg, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6, minWidth: 150, zIndex: 2, fontFamily: font, boxShadow: refined ? "0 1px 2px rgba(35,31,32,0.06), 0 10px 24px -10px rgba(35,31,32,0.22)" : "0 17px 5px rgba(0,0,0,0.01), 0 11px 4px rgba(0,0,0,0.02), 0 6px 4px rgba(0,0,0,0.05), 0 3px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.09)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, ...(refined ? { color: T.gray600 } : { fontSize: 11, letterSpacing: "0.4px", textTransform: "uppercase", color: T.gray500 }) }}>{fmtDate(ROUNDS[hover].date)}</span>
                {drawn.map((s, si) => (
                  <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.gray900 }}>
                    {mode === "multi" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: colorOf(s, si) }} />}
                    <span style={{ flex: 1 }}>{mode === "multi" ? s.label : "Score"}</span>
                    <b>{fmt(s.values[hover])}</b>
                    {hover > 0 && s.values[hover] != null && s.values[hover - 1] != null && s.values[hover] !== s.values[hover - 1] && <TrendPill delta={s.values[hover] - s.values[hover - 1]} numberOnly />}
                  </span>
                ))}
              </div>
            )}
          </div>
          )}
          {note && <p style={noteText}>{note}</p>}
        </>
      )}
    </StoryCard>
  );
}
