import { useRef, useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsSpace, dsRadius, dsShadow, dsBorder } from "../../../lib/ds.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { useChartTip, TipBox } from "../../widgets/ChartTip.jsx";
import { StoryCard, EvidenceSection, noteText } from "./StoryCard.jsx";
import { PillTabs, ViewSwitch, CopyTable } from "./controls.jsx";
import { DataTable, tableText } from "./DataTable.jsx";
import { useStoryWidth, useElementWidth, useOwnWidth } from "./storyWidth.js";

/* ================================================================== */
/* TREND CHARTS — the round-by-round Trend Stories (Figma 13622:37493).  */
/* Every chart sits in the same frame, read off the frames:              */
/*   an axis title rotated up the left (Text xs / Semibold, upper case),  */
/*   tick labels in a 22px column (Text 3xs / Semibold, text/tertiary),   */
/*   a 184px plot with a gridline at each tick (border/tertiary), and     */
/*   round labels 24px under it (Label xs / Medium, text/tertiary; the    */
/*   latest round in Text 3xs-Header / Bold, upper case).                 */
/* Forms:                                                                 */
/*   ScoreOverTime      one line, the value over each round in its status  */
/*                      colour (13622:38049). Also Health Age, with an     */
/*                      optional dashed reference line (13622:38481).      */
/*   ScoreOverTimeRows  one small line per part, an overall row on top    */
/*                      (13622:37676).                                    */
/*   StateOverTime      stacked severity bars per round, one tab per       */
/*                      measure (13622:38721).                             */
/*   LevelOverTime      one bar per round at its severity level, with a    */
/*                      hover that compares it with the round before       */
/*                      (13622:38815, hover 13622:38887).                  */
/*   ENPSOverTime       Promoters / Passives / Detractors stacked, the     */
/*                      eNPS line over them, a legend (13622:38987).       */
/* rounds: [{ label, latest? }] oldest first. Every form has a Table View. */
/* ================================================================== */
const PLOT_H = 184;
const BAR_PLOT = 180; // the bar forms: a 180px region with 4px of room above the bars (Figma 13622:38767)
const LINE = ds.border.primary;      // the line (Figma #B4B2B1)
const GRID = ds.border.tertiary;     // gridlines (Figma #E5E4E3)
const DOT = ds.border.strong;        // dots (Figma #908D8E)

/* Severity, Normal first. Colours are the design system's Likert scale, as in the frames. */
export const LEVELS = ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"];
export const LEVEL_FILL = [ds.likert.vGood, ds.likert.good, ds.likert.neutral, ds.likert.bad, ds.likert.veryBad];
const LEVEL_TEXT = [ds.status.success.textIndicator, ds.status.success.textIndicator, ds.status.warning.textStrong, ds.status.error.text, ds.status.error.text];

/* ---- the shared frame ----------------------------------------------------------------------------------------------
   Responsive by measurement, never by scrolling: the frame measures its plot and hands the forms { plotW, slot, barW,
   compact }. On a compact card (under 560px) the axis titles go, severity names wrap onto two lines in a 64px column,
   bars narrow to 60% of their slot (16 to 54px), and round labels shorten ("Sep 25"); when a slot is under 34px only
   every other label shows, always keeping the latest. */
function AxisTitle({ children, tone = "tertiary", h = PLOT_H }) {
  return (
    <div aria-hidden="true" style={{ width: 17, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", height: h }}>
      <span style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", ...dsText("Text xs", 600), lineHeight: 1, textTransform: "uppercase", color: tone === "secondary" ? ds.text.secondary : ds.text.tertiary }}>{children}</span>
    </div>
  );
}
function Ticks({ labels, align = "right", width = 22, inset = 0, h = PLOT_H, wrap = false }) {
  return (
    <div aria-hidden="true" style={{ width, flexShrink: 0, height: h, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: `${inset}px 0`, boxSizing: "border-box", textAlign: align, ...dsText("Text 3xs", 600), lineHeight: 1, color: ds.text.tertiary, whiteSpace: wrap ? "normal" : "nowrap" }}>
      {labels.map((t) => <span key={t} style={{ height: 0, display: "flex", alignItems: "center", justifyContent: align === "right" ? "flex-end" : "flex-start", fontSize: wrap ? 10 : undefined, lineHeight: wrap ? "11px" : undefined }}>{t}</span>)}
    </div>
  );
}
const shortRound = (label) => label.replace(/^([A-Za-z]{3})[a-z]* (\d{2})(\d{2})$/, "$1 $3");
function RoundLabels({ rounds, centre, slot }) {
  const short = slot < 60, sparse = slot < 34;
  return (
    <div data-part="round-labels" style={{ position: "relative", height: 8 }}>
      {rounds.map((r, i) => (sparse && !r.latest && (rounds.length - 1 - i) % 2 === 1) ? null : (
        <span key={i} style={{ position: "absolute", left: `${centre(i) * 100}%`, transform: "translateX(-50%)", whiteSpace: "nowrap", lineHeight: 1, color: ds.text.tertiary, ...(r.latest ? { ...dsText("Text 3xs", 700), lineHeight: 1, letterSpacing: "0.01em", textTransform: "uppercase" } : { fontSize: 10, fontWeight: 500 }) }}>{short ? shortRound(r.label) : r.label}</span>
      ))}
    </div>
  );
}
/* Axis title + ticks | plot (with gridlines at the ticks) over the round labels. `right` adds a second tick column.
   `plotH`: 184 for the line forms; the bar forms draw in 180 (Figma 13622:38767), so their cards come out 4px shorter.
   `children` may be a function of { plotW, slot, barW, compact }. */
function Frame({ title, titleTone, ticks, tickWidth, tickInset = 0, tickWrap, gridAt, right, rounds, centre, children, plotH = PLOT_H }) {
  const { compact } = useStoryWidth();
  const plotRef = useRef(null);
  const plotW = useElementWidth(plotRef, 600);
  const slot = plotW / rounds.length;
  const info = { plotW, slot, barW: Math.round(Math.max(16, Math.min(54, slot * 0.6))), compact };
  const levelTicks = tickWrap && compact;
  return (
    <div data-part="trend-frame" style={{ display: "flex", gap: compact ? dsSpace[8] : dsSpace[16], alignItems: "flex-start", fontFamily: font }}>
      <div style={{ display: "flex", gap: dsSpace[8], alignItems: "center", flexShrink: 0 }}>
        {title && !compact && <AxisTitle tone={titleTone} h={plotH}>{title}</AxisTitle>}
        <Ticks labels={ticks} width={levelTicks ? 64 : tickWidth} inset={tickInset} h={plotH} wrap={levelTicks} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[24] }}>
        <div ref={plotRef} data-part="plot" style={{ position: "relative", height: plotH }}>
          {gridAt.map((f, i) => <div key={i} aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: `${f * 100}%`, borderTop: `${dsBorder.sm}px solid ${GRID}` }} />)}
          {typeof children === "function" ? children(info) : children}
        </div>
        <RoundLabels rounds={rounds} centre={centre} slot={slot} />
      </div>
      {typeof right === "function" ? right(info) : right}
    </div>
  );
}
const evenGrid = (n) => Array.from({ length: n }, (_, i) => i / (n - 1));
const slotCentre = (n) => (i) => (i + 0.5) / n;          // bars: equal slots
const spreadCentre = (n) => (i) => (n === 1 ? 0.5 : 0.06 + (i / (n - 1)) * 0.88); // lines: first and last points inset

/* Copy/Table helpers shared by the forms */
function useView() { const [view, setView] = useState("chart"); return [view, setView]; }

/* ---- Score Over Time (one line) ------------------------------------------------------------------------------------- */
/* values: one per round. `banded` colours each value by status and prints it; `reference` (one per round) draws the
   dashed line Health Age uses for actual age. */
export function ScoreOverTime({ title = "Score Over Time", line, rounds, values, domain = [0, 100], ticks = [100, 80, 60, 40, 20, 0], axis = "Score", banded = true, reference, referenceLabel = "Actual age", unit = "" }) {
  const [view, setView] = useView();
  const columns = [{ key: "round", label: "Round" }, { key: "value", label: axis, align: "right", render: (r) => <b style={{ color: banded ? dsBand(r.value).cs : ds.text.primary }}>{r.value}{unit}</b>, text: (r) => r.value }, ...(reference ? [{ key: "ref", label: referenceLabel, align: "right" }] : [])];
  const rows = rounds.map((r, i) => ({ round: r.label, value: values[i], ref: reference?.[i] }));
  return (
    <StoryCard title={title} line={line} data-story="trend-line" controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
      <EvidenceSection style={{ padding: dsSpace[16] }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : <ScoreLine rounds={rounds} values={values} domain={domain} ticks={ticks} axis={axis} banded={banded} reference={reference} unit={unit} />}
      </EvidenceSection>
      {reference && view === "chart" && <p style={noteText}>The dashed line is {referenceLabel.toLowerCase()}. Below it is younger than {referenceLabel.toLowerCase()}.</p>}
    </StoryCard>
  );
}

/* The line chart on its own (no Story card): every place that draws one measure across rounds uses this, so the Trend
   Story, the Score History row that opens into a line, and the Explorer's own history all look and respond alike.
   `ticks` run top to bottom. It draws at the width it is given (11 to 12px text, no sideways scroll). */
export function ScoreLine({ rounds, values, domain = [0, 100], ticks = [100, 80, 60, 40, 20, 0], axis = "Score", banded = true, reference, referenceLabel = "Actual age", unit = "" }) {
  const [hover, setHover] = useState(null);
  const tip = useChartTip();
  const n = values.length, cx = spreadCentre(n);
  const [lo, hi] = domain;
  const y = (v) => (1 - (v - lo) / (hi - lo)) * PLOT_H;
  // Hover (or tap) anywhere in a round's column, not just on its 6px dot: the dot is ringed, a dashed guide marks the
  // round, and the shared chart tooltip gives the value, the change and what it was the round before.
  const tipFor = (i) => ({
    head: rounds[i].label,
    rows: [
      { label: axis === "Score" ? "Score" : axis, value: values[i], text: `${values[i]}${unit}`, delta: i > 0 ? values[i] - values[i - 1] : null, score: banded },
      ...(reference ? [{ label: referenceLabel, value: reference[i], text: `${reference[i]}${unit}`, color: DOT }] : []),
    ],
    note: i > 0 ? `${rounds[i - 1].label}: ${values[i - 1]}${unit}` : "First round",
  });
  return (
    <Frame title={axis} titleTone={banded ? "secondary" : "tertiary"} ticks={ticks} gridAt={evenGrid(ticks.length)} rounds={rounds} centre={cx}>
      <svg width="100%" height={PLOT_H} viewBox={`0 0 1000 ${PLOT_H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible" }} aria-hidden="true">
        {hover != null && <line x1={cx(hover) * 1000} x2={cx(hover) * 1000} y1="0" y2={PLOT_H} stroke={DOT} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
        {reference && <polyline points={reference.map((v, i) => `${cx(i) * 1000},${y(v)}`).join(" ")} fill="none" stroke={DOT} strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
        <polyline data-part="line" points={values.map((v, i) => `${cx(i) * 1000},${y(v)}`).join(" ")} fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ stroke: LINE }} />
      </svg>
      {values.map((v, i) => (
        <div key={i} role="img" aria-label={`${rounds[i].label}: ${v}${unit}`}
          style={{ position: "absolute", left: `${cx(i) * 100}%`, top: y(v), transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
          {banded && <span data-part="point-value" style={{ position: "absolute", bottom: "100%", marginBottom: dsSpace[4], ...dsText("Text 2xs", 600), lineHeight: 1, color: dsBand(v).cs, transition: "transform 120ms ease", transform: hover === i ? "translateY(-2px)" : "none" }}>{v}{unit}</span>}
          <span data-part="dot" style={{ width: hover === i ? 8 : banded ? 6 : 8, height: hover === i ? 8 : banded ? 6 : 8, borderRadius: "50%", background: hover === i && banded ? dsBand(v).c : DOT, boxShadow: hover === i ? `0 0 0 3px ${ds.surface.general.card}, 0 0 0 4px ${banded ? dsBand(v).c : DOT}` : "none", transition: "all 120ms ease" }} />
        </div>
      ))}
      {values.map((_, i) => {
        const left = i === 0 ? 0 : ((cx(i - 1) + cx(i)) / 2) * 100;
        const right = i === n - 1 ? 100 : ((cx(i) + cx(i + 1)) / 2) * 100;
        const b = tip.bind(tipFor(i));
        return (
          <div key={`hit-${i}`} aria-hidden="true"
            onMouseEnter={(e) => { setHover(i); b.onMouseEnter(e); }} onMouseMove={b.onMouseMove} onMouseLeave={() => { setHover(null); b.onMouseLeave(); }}
            style={{ position: "absolute", top: -8, bottom: 0, left: `${left}%`, width: `${right - left}%`, cursor: "default" }} />
        );
      })}
      {tip.node}
    </Frame>
  );
}

/* ---- Score Over Time, one row per part ----------------------------------------------------------------------------- */
/* rows: [{ label, values, overall? }]. Each row is a small line over the rounds with every value printed in its status
   colour: above its point, or below when the point is a peak (so the line never runs through its own number). */
export function ScoreOverTimeRows({ title = "Score Over Time", line, rounds, rows }) {
  const [view, setView] = useView();
  const [cardRef, { compact }] = useOwnWidth();
  const n = rounds.length;
  // Compact: each part's name sits on its own line above its small chart (full width), so nothing has to scroll.
  const LABEL_W = compact ? 0 : 185;
  const cx = (i) => (n === 1 ? 0.5 : 0.04 + (i / (n - 1)) * 0.92);
  const columns = [{ key: "label", label: "" }, ...rounds.map((r, i) => ({ key: `r${i}`, label: r.label, align: "right", render: (row) => <b style={{ color: dsBand(row.values[i]).cs }}>{row.values[i]}</b>, text: (row) => row.values[i] }))];
  return (
    <div ref={cardRef}>
    <StoryCard title={title} line={line} data-story="trend-rows" controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
      <EvidenceSection style={{ padding: `${dsSpace[16]}px ${dsSpace[12]}px` }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
          <div style={{ fontFamily: font }}>
            <div style={{ display: "flex", alignItems: "flex-end", height: 34, paddingBottom: dsSpace[8] }}>
              <div style={{ width: LABEL_W, flexShrink: 0 }} />
              <div style={{ position: "relative", flex: 1, height: "100%", marginLeft: compact ? 0 : dsSpace[24] }}>
                {rounds.map((r, i) => (
                  <span key={i} style={{ position: "absolute", left: `${cx(i) * 100}%`, bottom: 0, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: dsSpace[4], whiteSpace: "nowrap" }}>
                    {r.latest && <span data-part="latest" style={{ ...dsText("Text 3xs"), lineHeight: "14px", padding: `0 ${dsSpace[6]}px`, borderRadius: dsRadius.full, background: ds.status.info?.bg || ds.bg.primary, color: ds.graph.teamBlue }}>Latest</span>}
                    <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1, color: ds.text.tertiary }}>{r.label}</span>
                  </span>
                ))}
              </div>
            </div>
            {rows.map((row) => {
              const vals = row.values;
              return (
                <div key={row.label} data-part="trend-row" style={{ display: "flex", flexDirection: compact ? "column" : "row", alignItems: compact ? "stretch" : "center", height: compact ? 74 : 50, paddingTop: compact ? dsSpace[6] : 0, boxSizing: "border-box", borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, background: row.overall ? ds.surface.general.cardWithinCard : "transparent" }}>
                  <span style={{ width: compact ? "auto" : LABEL_W, flexShrink: 0, textAlign: compact ? "left" : "right", paddingLeft: compact ? dsSpace[4] : 0, ...dsText("Text xs", row.overall ? 700 : 400), color: ds.text.secondary, paddingRight: dsSpace[4] }}>{row.label}</span>
                  <div style={{ position: "relative", flex: compact ? "0 0 50px" : 1, height: compact ? 50 : "100%", marginLeft: compact ? 0 : dsSpace[24] }}>
                    <svg width="100%" height="100%" viewBox="0 0 1000 50" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible" }} aria-hidden="true">
                      <polyline points={vals.map((v, i) => `${cx(i) * 1000},${32 - (v / 100) * 16}`).join(" ")} fill="none" stroke={DOT} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    </svg>
                    {vals.map((v, i) => {
                      const peak = i > 0 && i < vals.length - 1 && v > vals[i - 1] && v > vals[i + 1];
                      return (
                        <span key={i} role="img" aria-label={`${row.label}, ${rounds[i].label}: ${v}`} style={{ position: "absolute", left: `${cx(i) * 100}%`, top: 32 - (v / 100) * 16, transform: "translate(-50%, -50%)", width: 5, height: 5, borderRadius: "50%", background: DOT }}>
                          <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", [peak ? "top" : "bottom"]: "calc(100% + 3px)", ...dsText("Text 2xs", 700), lineHeight: 1, color: dsBand(v).cs }}>{v}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}` }} />
          </div>
        )}
      </EvidenceSection>
    </StoryCard>
    </div>
  );
}

/* ---- State Over Time (stacked severity) ---------------------------------------------------------------------------- */
/* measures: [{ label, rounds: [[pctNormal, pctMild, pctModerate, pctSevere, pctExtreme] per round] }] */
export function StateOverTime({ title = "State over time", line, rounds, measures }) {
  const [view, setView] = useView();
  const [tab, setTab] = useState(measures[0].label);
  const [hover, setHover] = useState(null); // [round, level]
  const m = measures.find((x) => x.label === tab) || measures[0];
  const n = rounds.length, cx = slotCentre(n);
  const columns = [{ key: "round", label: "Round" }, ...LEVELS.map((l, k) => ({ key: `l${k}`, label: l, align: "right", render: (r) => `${r.p[k]}%`, text: (r) => `${r.p[k]}%` }))];
  const rows = rounds.map((r, i) => ({ round: r.label, p: m.rounds[i] }));
  return (
    <StoryCard title={title} line={line} data-story="trend-state" controls={[<PillTabs key="t" label="Measure" tone="default" tabs={measures.map((x) => x.label)} value={m.label} onChange={setTab} />, <ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
      <EvidenceSection style={{ padding: dsSpace[16] }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
          <Frame title="Percentage" ticks={[100, 80, 60, 40, 20, 0]} gridAt={evenGrid(6)} rounds={rounds} centre={cx} plotH={BAR_PLOT}>{(f) => (<>
            {m.rounds.map((p, i) => (
              <div key={i} data-part="stack" role="img" aria-label={`${rounds[i].label}: ${LEVELS.map((l, k) => `${l} ${p[k]}%`).join(", ")}`}
                style={{ position: "absolute", left: `${cx(i) * 100}%`, bottom: 0, transform: "translateX(-50%)", width: f.barW, height: BAR_PLOT - 4, display: "flex", flexDirection: "column", borderRadius: `${dsRadius.xs}px ${dsRadius.xs}px 0 0`, overflow: "hidden" }}>
                {p.map((pct, k) => (
                  <div key={k} onPointerEnter={(e) => e.pointerType === "mouse" && setHover([i, k])} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)} onPointerDown={(e) => e.pointerType !== "mouse" && setHover((c) => (c && c[0] === i && c[1] === k ? null : [i, k]))} style={{ flex: `${pct} 0 0`, minHeight: 0, background: LEVEL_FILL[k], opacity: hover && (hover[0] !== i || hover[1] !== k) ? 0.55 : 1, transition: "opacity 120ms ease" }} />
                ))}
              </div>
            ))}
            {hover && (
              // The design shows no hover for this form; a small tooltip over the bar names the segment so the card keeps its height.
              <TipBox data-part="state-tip" style={{ position: "absolute", left: `${cx(hover[0]) * 100}%`, top: -8, transform: `translate(${hover[0] === 0 ? "-16%" : hover[0] === n - 1 ? "-84%" : "-50%"}, -100%)` }}
                content={{ head: rounds[hover[0]].label, rows: [{ label: LEVELS[hover[1]], text: `${m.rounds[hover[0]][hover[1]]}%`, color: LEVEL_FILL[hover[1]], valueColor: LEVEL_TEXT[hover[1]] }] }} />
            )}
          </>)}</Frame>
        )}
      </EvidenceSection>
    </StoryCard>
  );
}

/* ---- Status Over Time (share of people in each status) ------------------------------------------------------------ */
/* counts: [{ flourishing, striving, struggling }] per round (people). One stacked bar per round in the shared frame, on a
   percentage axis: Flourishing on top, Struggling at the base, in the status graph colours. A segment tall enough to hold
   it prints its share; hover (tap on a phone) names the segment with its share, people and the change since the round
   before. A legend with the latest round's shares sits under the chart. Built on StateOverTime's frame so the Trend
   family reads the same. */
const STATUS_KEYS = [
  { key: "flourishing", label: "Flourishing", c: ds.status.success.graph, cs: ds.status.success.textIndicator },
  { key: "striving", label: "Striving", c: ds.status.warning.graph, cs: ds.status.warning.textStrong },
  { key: "struggling", label: "Struggling", c: ds.status.error.graph, cs: ds.status.error.text },
];
export function StatusOverTime({ title = "Status Over Time", line, rounds, counts }) {
  const [view, setView] = useView();
  const [hover, setHover] = useState(null); // [round, statusIndex]
  const n = rounds.length, cx = slotCentre(n);
  const share = counts.map((c) => {
    const total = STATUS_KEYS.reduce((a, k) => a + (c[k.key] || 0), 0) || 1;
    // Largest-remainder rounding so each round's shares add up to exactly 100.
    const raw = STATUS_KEYS.map((k) => ((c[k.key] || 0) / total) * 100);
    const fl = raw.map(Math.floor); let left = 100 - fl.reduce((a, b) => a + b, 0);
    raw.map((v, k) => [v - fl[k], k]).sort((a, b) => b[0] - a[0]).forEach(([, k]) => { if (left > 0) { fl[k] += 1; left -= 1; } });
    return { pct: fl, people: STATUS_KEYS.map((k) => c[k.key] || 0), total };
  });
  const columns = [{ key: "round", label: "Round" }, ...STATUS_KEYS.map((k, j) => ({ key: k.key, label: k.label, align: "right", render: (r) => <span><b style={{ color: k.cs }}>{r.s.pct[j]}%</b> <span style={{ color: ds.text.quaternary }}>· {r.s.people[j]}</span></span>, text: (r) => `${r.s.pct[j]}% (${r.s.people[j]})` }))];
  const rows = rounds.map((r, i) => ({ round: r.label, s: share[i] }));
  const last = share[n - 1], prev = n > 1 ? share[n - 2] : null;
  const h = hover;
  const tip = h && (() => {
    const [i, j] = h, d = i > 0 ? share[i].pct[j] - share[i - 1].pct[j] : null;
    return (
      <TipBox data-part="status-tip" style={{ position: "absolute", left: `${cx(i) * 100}%`, top: -8, transform: `translate(${i === 0 ? "-16%" : i === n - 1 ? "-84%" : "-50%"}, -100%)` }}
        content={{ head: rounds[i].label, rows: [{ label: STATUS_KEYS[j].label, text: `${share[i].pct[j]}%`, delta: d, color: STATUS_KEYS[j].c, valueColor: STATUS_KEYS[j].cs }], note: `${share[i].people[j]} of ${share[i].total} people${d ? ` · ${d > 0 ? "+" : "−"}${Math.abs(d)} points on the round before` : ""}` }} />
    );
  })();
  return (
    <StoryCard title={title} line={line} data-story="trend-status" controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
      <EvidenceSection style={{ padding: dsSpace[16], gap: dsSpace[24] }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : (<>
          <Frame title="Percentage" ticks={[100, 80, 60, 40, 20, 0]} gridAt={evenGrid(6)} rounds={rounds} centre={cx} plotH={BAR_PLOT}>{(f) => (<>
            {share.map((s, i) => (
              <div key={i} data-part="stack" role="img" aria-label={`${rounds[i].label}: ${STATUS_KEYS.map((k, j) => `${k.label} ${s.pct[j]}%`).join(", ")}`}
                style={{ position: "absolute", left: `${cx(i) * 100}%`, bottom: 0, transform: "translateX(-50%)", width: f.barW, height: BAR_PLOT, display: "flex", flexDirection: "column", gap: 2, borderRadius: `${dsRadius.xs}px ${dsRadius.xs}px 0 0`, overflow: "hidden" }}>
                {STATUS_KEYS.map((k, j) => s.pct[j] > 0 && (
                  <div key={k.key} onPointerEnter={(e) => e.pointerType === "mouse" && setHover([i, j])} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)} onPointerDown={(e) => e.pointerType !== "mouse" && setHover((c) => (c && c[0] === i && c[1] === j ? null : [i, j]))}
                    style={{ flex: `${s.pct[j]} 0 0`, minHeight: 0, background: k.c, opacity: h && (h[0] !== i || h[1] !== j) ? 0.45 : 1, transition: "opacity 120ms ease", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "pan-y" }}>
                    {(s.pct[j] / 100) * BAR_PLOT >= 18 && f.barW >= 28 && <span aria-hidden="true" style={{ ...dsText("Text 3xs", 700), lineHeight: 1, color: k.key === "striving" ? ds.text.primary : ds.text.inverse, pointerEvents: "none" }}>{s.pct[j]}%</span>}
                  </div>
                ))}
              </div>
            ))}
            {tip}
          </>)}</Frame>
          <div data-part="legend" style={{ display: "flex", gap: `${dsSpace[8]}px ${dsSpace[24]}px`, flexWrap: "wrap", fontFamily: font }}>
            {STATUS_KEYS.map((k, j) => {
              const d = prev ? last.pct[j] - prev.pct[j] : null;
              return (
                <span key={k.key} style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], ...dsText("Text xs"), color: ds.text.tertiary }}>
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: k.c }} />
                  {k.label} <b style={{ color: k.cs, fontVariantNumeric: "tabular-nums" }}>{last.pct[j]}%</b>
                  {d != null && d !== 0 && <span style={{ ...dsText("Text 2xs"), color: ds.text.quaternary }}>{d > 0 ? "+" : "−"}{Math.abs(d)}</span>}
                </span>
              );
            })}
          </div>
        </>)}
      </EvidenceSection>
    </StoryCard>
  );
}

/* ---- Level Over Time (one bar per round at its severity level) -------------------------------------------------- */
/* levels: one severity index (0 Normal … 4 Extremely Severe) per round. `dates` (optional) for the hover. */
const LEVEL_H = [180, 141, 106, 71, 34];
export function LevelOverTime({ title = "State over time", line, rounds, measures, who = "Your mental well-being" }) {
  const [cardRef, { compact }] = useOwnWidth();
  const [view, setView] = useView();
  const [tab, setTab] = useState(measures[0].label);
  const [hover, setHover] = useState(null);
  const m = measures.find((x) => x.label === tab) || measures[0];
  const n = rounds.length, cx = slotCentre(n);
  const columns = [{ key: "round", label: "Round" }, { key: "level", label: "Level", align: "right", render: (r) => <b style={{ color: LEVEL_TEXT[r.k] }}>{LEVELS[r.k]}</b>, text: (r) => LEVELS[r.k] }];
  const rows = rounds.map((r, i) => ({ round: r.label, k: m.levels[i] }));
  const h = hover;
  // The standard tooltip: the round's level, and the round before under "Compared to".
  const levelRow = (r) => ({ label: rounds[r].date || rounds[r].label, text: LEVELS[m.levels[r]], color: LEVEL_FILL[m.levels[r]], valueColor: LEVEL_TEXT[m.levels[r]] });
  const levelTip = (r) => ({ head: who, rows: [levelRow(r)], compare: r > 0 ? { rows: [levelRow(r - 1)] } : null });
  return (
    <div ref={cardRef}>
    <StoryCard title={title} line={line} data-story="trend-level" controls={[<PillTabs key="t" label="Measure" tone="default" tabs={measures.map((x) => x.label)} value={m.label} onChange={(t) => { setTab(t); setHover(null); }} />, <ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
      <EvidenceSection style={{ padding: dsSpace[16] }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
          <Frame ticks={LEVELS} tickWidth={98} tickWrap tickInset={24} gridAt={evenGrid(6)} rounds={rounds} centre={cx} plotH={BAR_PLOT}>{(f) => (<>
            {m.levels.map((k, i) => (
              <button
                key={i} type="button" data-part="level-bar" aria-label={`${rounds[i].label}: ${LEVELS[k]}`} onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)} onClick={(e) => e.detail === 0 || e.nativeEvent.pointerType !== "mouse" ? setHover((c) => (c === i ? null : i)) : null} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                style={{ position: "absolute", left: `${cx(i) * 100}%`, bottom: 0, transform: "translateX(-50%)", width: f.barW, height: LEVEL_H[k], padding: 0, border: hover === i ? `${dsBorder.sm}px solid ${LEVEL_TEXT[k]}` : "none", borderRadius: `${dsRadius.xs}px ${dsRadius.xs}px 0 0`, background: LEVEL_FILL[k], boxShadow: hover === i ? dsShadow("md") : "none", cursor: "default", boxSizing: "border-box" }}
              />
            ))}
            {h != null && !f.compact && (
              <TipBox data-part="level-tip" style={{ position: "absolute", left: Math.max(0, Math.min(f.plotW - 240, cx(h) * f.plotW + (cx(h) * f.plotW + 280 <= f.plotW ? 40 : -280))), top: -6, width: 240 }} content={levelTip(h)} />
            )}
          </>)}</Frame>
        )}
      </EvidenceSection>
      {/* On a compact card the comparison opens here, under the chart, when a bar is tapped. */}
      {view === "chart" && compact && h != null && (
        <TipBox flat data-part="level-detail" content={levelTip(h)} />
      )}
    </StoryCard>
    </div>
  );
}

/* ---- eNPS over time ------------------------------------------------------------------------------------------------- */
/* parts: [{ promoters, passives, detractors (percent), enps (-100..100) }] per round. The bars use the percentage axis;
   the eNPS line has its own axis on the right, -100 to 100, because a negative eNPS can't sit on a 0-100 axis. */
const ENPS_FILL = { promoters: ds.likert.vGoodSubtle, passives: ds.likert.neutralSubtle, detractors: ds.likert.veryBadSubtle };
export function ENPSOverTime({ title = "Score over time", line, rounds, parts, who = "eNPS Score" }) {
  const [view, setView] = useView();
  const [hover, setHover] = useState(null);
  const n = rounds.length, cx = slotCentre(n);
  const yE = (e) => (1 - (e + 100) / 200) * BAR_PLOT;
  const columns = [{ key: "round", label: "Round" }, { key: "promoters", label: "Promoters", align: "right", text: (r) => `${r.promoters}%`, render: (r) => `${r.promoters}%` }, { key: "passives", label: "Passives", align: "right", text: (r) => `${r.passives}%`, render: (r) => `${r.passives}%` }, { key: "detractors", label: "Detractors", align: "right", text: (r) => `${r.detractors}%`, render: (r) => `${r.detractors}%` }, { key: "enps", label: "eNPS", align: "right", render: (r) => <b>{r.enps}</b> }];
  const rows = rounds.map((r, i) => ({ round: r.label, ...parts[i] }));
  return (
    <StoryCard title={title} line={line} data-story="trend-enps" controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
      <EvidenceSection style={{ padding: dsSpace[16], gap: dsSpace[32] }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
          <>
            <Frame title="Percentage" ticks={[100, 80, 60, 40, 20, 0]} gridAt={evenGrid(6)} rounds={rounds} centre={cx} plotH={BAR_PLOT}
              right={(f) => <div style={{ display: "flex", gap: dsSpace[8], alignItems: "center", flexShrink: 0 }}><Ticks labels={[100, 50, 0, -50, -100]} width={26} align="left" h={BAR_PLOT} />{!f.compact && <AxisTitle h={BAR_PLOT}>eNPS</AxisTitle>}</div>}>{(f) => (<>
              {parts.map((p, i) => (
                <div key={i} data-part="stack" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} role="img" aria-label={`${rounds[i].label}: Promoters ${p.promoters}%, Passives ${p.passives}%, Detractors ${p.detractors}%, eNPS ${p.enps}`}
                  style={{ position: "absolute", left: `${cx(i) * 100}%`, bottom: 0, transform: "translateX(-50%)", width: f.barW, height: BAR_PLOT - 4, display: "flex", flexDirection: "column", borderRadius: `${dsRadius.xs}px ${dsRadius.xs}px 0 0`, overflow: "hidden" }}>
                  {["promoters", "passives", "detractors"].map((k) => <div key={k} style={{ flex: `${p[k]} 0 0`, minHeight: 0, background: ENPS_FILL[k] }} />)}
                </div>
              ))}
              <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: yE(0), borderTop: `${dsBorder.sm}px dashed ${ds.border.strong}` }} />
              <svg width="100%" height={BAR_PLOT} viewBox={`0 0 1000 ${BAR_PLOT}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }} aria-hidden="true">
                <polyline data-part="line" points={parts.map((p, i) => `${cx(i) * 1000},${yE(p.enps)}`).join(" ")} fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ stroke: LINE }} />
              </svg>
              {parts.map((p, i) => (
                <span key={i} aria-hidden="true" style={{ position: "absolute", left: `${cx(i) * 100}%`, top: yE(p.enps), transform: "translate(-50%, -50%)", width: 8, height: 8, borderRadius: "50%", background: DOT, pointerEvents: "none" }}>
                  {hover === i && <TipBox style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", width: 200, transform: `translateX(${i === 0 ? "-16%" : i === n - 1 ? "-84%" : "-50%"})` }}
                    content={{ head: rounds[i].label, rows: [{ label: "eNPS", text: p.enps > 0 ? `+${p.enps}` : `${p.enps}` }, { label: "Promoters", text: `${p.promoters}%`, color: ENPS_FILL.promoters }, { label: "Passives", text: `${p.passives}%`, color: ENPS_FILL.passives }, { label: "Detractors", text: `${p.detractors}%`, color: ENPS_FILL.detractors }] }} />}
                </span>
              ))}
            </>)}</Frame>
            <div data-part="legend" style={{ display: "flex", gap: dsSpace[24], flexWrap: "wrap", fontFamily: font }}>
              <LegendItem dot={<span style={{ width: 12, height: 12, borderRadius: "50%", boxSizing: "border-box", border: `2px solid ${DOT}` }} />}>{who}</LegendItem>
              <LegendItem fill={ENPS_FILL.promoters}>Promoters</LegendItem>
              <LegendItem fill={ENPS_FILL.passives}>Passives</LegendItem>
              <LegendItem fill={ENPS_FILL.detractors}>Detractors</LegendItem>
            </div>
          </>
        )}
      </EvidenceSection>
    </StoryCard>
  );
}
function LegendItem({ fill, dot, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], ...dsText("Text xs"), lineHeight: "19px", color: ds.text.tertiary }}>
      {dot || <span style={{ width: 12, height: 12, borderRadius: 20, background: fill }} />}{children}
    </span>
  );
}

/* ---- How People Moved (Sankey of levels, round to round) ------------------------------------------------------------
   Same people every round (a cohort), so every band is a real group: e.g. 6 people went from Mild in Nov 2025 to Moderate
   in Mar 2026. One column per round with the five levels stacked, Normal on top; bands join each level to the levels those
   people were at in the next round, widths to scale. Colour by Level (the band takes its starting level's colour) or by
   Change (better green, same grey, worse red), the second being the point of the chart. Hover a band or a level (tap on a
   phone) for the count; the line under the chart totals better / same / worse for the latest move. Table View lists every
   from → to pair per move.
   measures: [{ label, nodes: number[round][level], links: number[move][from][to] }]; cohort: people in every round. */
const MOVE = { better: ds.status.success.graph, same: ds.border.secondary, worse: ds.status.error.graph };
const moveOf = (from, to) => (to < from ? "better" : to > from ? "worse" : "same");
function moves(links) {
  const m = { better: 0, same: 0, worse: 0 };
  links.forEach((row, f) => row.forEach((n, t) => { m[moveOf(f, t)] += n; }));
  return m;
}
export function FlowOverTime({ title = "How People Moved", line, rounds, measures, cohort, levels = LEVELS }) {
  const [view, setView] = useView();
  const [tab, setTab] = useState(measures[0].label);
  const [colourBy, setColourBy] = useState("Change");
  const [over, setOver] = useState(null); // mouse: { kind: "link", t, f, to } | { kind: "node", r, l }
  const [tapped, setTapped] = useState(null); // touch: the same shape, stays until tapped again
  const hover = over || tapped;
  const tip = useChartTip();
  const box = useRef(null);
  const W = useElementWidth(box, 776);
  const compact = W < 520;
  const m = measures.find((x) => x.label === tab) || measures[0];
  const R = rounds.length, L = levels.length;

  // Geometry: node columns at both edges and spread between; labels outside the first and last column when there's room.
  const labelW = compact ? 0 : 118, nodeW = compact ? 10 : 14, gap = compact ? 4 : 6, H = compact ? 220 : 280;
  const colX = (i) => labelW + (i * (W - 2 * labelW - nodeW)) / Math.max(1, R - 1);
  const scale = (H - gap * (L - 1)) / Math.max(1, cohort);
  const nodeY = m.nodes.map((col) => { let y = 0; return col.map((n) => { const top = y; y += n * scale + gap; return { top, h: n * scale }; }); });
  // Bands: leave each level in target order, arrive in source order, so bands never cross inside a node.
  const bands = [];
  m.links.forEach((mat, t) => {
    const out = nodeY[t].map((nd) => nd.top);
    mat.forEach((row, f) => row.forEach((n, to) => {
      if (!n) return;
      const h = n * scale, y0 = out[f];
      out[f] += h;
      bands.push({ t, f, to, n, h, y0, y1: 0 });
    }));
    // second pass for arrival order: by source level within each target
    const arr = nodeY[t + 1].map((nd) => nd.top);
    bands.filter((b) => b.t === t).sort((a, b) => a.to - b.to || a.f - b.f).forEach((b) => { b.y1 = arr[b.to]; arr[b.to] += b.h; });
  });
  const x0 = (t) => colX(t) + nodeW, x1 = (t) => colX(t + 1);
  const path = (b) => {
    const a = x0(b.t), c = x1(b.t), mx = (a + c) / 2;
    return `M${a},${b.y0} C${mx},${b.y0} ${mx},${b.y1} ${c},${b.y1} L${c},${b.y1 + b.h} C${mx},${b.y1 + b.h} ${mx},${b.y0 + b.h} ${a},${b.y0 + b.h} Z`;
  };
  const lit = (b) => !hover || (hover.kind === "link" ? hover.t === b.t && hover.f === b.f && hover.to === b.to : (hover.r === b.t && hover.l === b.f) || (hover.r === b.t + 1 && hover.l === b.to));
  const bandColour = (b) => (colourBy === "Level" ? LEVEL_FILL[b.f] : MOVE[moveOf(b.f, b.to)]);
  const pct = (n) => `${Math.round((n / Math.max(1, cohort)) * 100)}%`;
  const linkTip = (b) => ({ head: `${rounds[b.t].label} → ${rounds[b.t + 1].label}`, rows: [{ label: `${levels[b.f]} → ${levels[b.to]}`, value: b.n, text: `${b.n} ${b.n === 1 ? "person" : "people"}`, color: bandColour(b) }], note: b.f === b.to ? "Stayed at the same level" : b.to < b.f ? "Moved to a better level" : "Moved to a worse level" });
  const nodeTip = (r, l) => ({ head: rounds[r].label, rows: [{ label: levels[l], value: m.nodes[r][l], text: `${m.nodes[r][l]} people · ${pct(m.nodes[r][l])}`, color: LEVEL_FILL[l] }] });
  const pick = (h) => (e) => { if (e.pointerType !== "mouse") setTapped((c) => (c && JSON.stringify(c) === JSON.stringify(h) ? null : h)); };
  const enter = (h, content) => (e) => { if (e.pointerType && e.pointerType !== "mouse") return; setOver(h); tip.bind(content).onMouseEnter(e); };
  const last = moves(m.links[m.links.length - 1]);
  const first = rounds[0].label, prevLabel = rounds[R - 2].label, latest = rounds[R - 1].label;
  const pinnedBand = tapped?.kind === "link" ? bands.find((b) => b.t === tapped.t && b.f === tapped.f && b.to === tapped.to) : null;
  const pinned = tapped ? (pinnedBand ? linkTip(pinnedBand) : tapped.kind === "node" ? nodeTip(tapped.r, tapped.l) : null) : null;

  // Table View: every from → to pair, a column per move.
  const columns = [{ key: "from", label: "From" }, { key: "to", label: "To" }, ...m.links.map((_, t) => ({ key: `t${t}`, label: `${rounds[t].label} → ${rounds[t + 1].label}`, short: `Move ${t + 1}`, align: "right" }))];
  const rows = [];
  levels.forEach((lf, f) => levels.forEach((lt, to) => { const v = m.links.map((mat) => mat[f][to]); if (v.some(Boolean)) rows.push({ from: lf, to: lt, ...Object.fromEntries(v.map((n, t) => [`t${t}`, n])) }); }));

  return (
    <StoryCard title={title} line={line ?? `The same ${cohort} people in every round, by level. Bands show where each level's people were at the next round.`} data-story="trend-flow"
      controls={[
        <PillTabs key="m" label="Measure" tone="default" tabs={measures.map((x) => x.label)} value={m.label} onChange={(v) => { setTab(v); setOver(null); setTapped(null); }} />,
        view === "chart" && <PillTabs key="c" label="Colour by" tone="default" tabs={["Change", "Level"]} value={colourBy} onChange={setColourBy} />,
        <ViewSwitch key="v" view={view} onChange={setView} />,
        view === "table" && <CopyTable key="cp" getText={() => tableText(columns, rows)} />,
      ]}>
      <EvidenceSection style={{ padding: dsSpace[16] }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
          <div ref={box} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
            {/* Round headings over their columns. */}
            <div style={{ position: "relative", height: 18 }}>
              {rounds.map((r, i) => (
                <span key={r.label} style={{ position: "absolute", left: colX(i) + nodeW / 2, transform: i === 0 && compact ? "none" : i === R - 1 && compact ? "translateX(-100%)" : "translateX(-50%)", ...dsText("Text 2xs", r.latest ? 600 : 400), color: r.latest ? ds.text.primary : ds.text.tertiary, textTransform: r.latest ? "uppercase" : "none", whiteSpace: "nowrap" }}>{r.label}</span>
              ))}
            </div>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${m.label}: how ${cohort} people moved between levels from ${first} to ${latest}. Latest move: ${last.better} better, ${last.same} the same, ${last.worse} worse.`} style={{ display: "block", overflow: "visible", touchAction: "pan-y" }}>
              {bands.map((b, i) => (
                <path key={i} d={path(b)} data-part="flow-band" style={{ fill: bandColour(b), opacity: lit(b) ? (hover ? 0.85 : 0.55) : 0.12, transition: "opacity 120ms ease", cursor: "pointer" }}
                  {...tip.bind(linkTip(b))} onMouseEnter={enter({ kind: "link", t: b.t, f: b.f, to: b.to }, linkTip(b))} onMouseLeave={() => { setOver(null); tip.bind(null).onMouseLeave(); }}
                  onPointerDown={pick({ kind: "link", t: b.t, f: b.f, to: b.to })} />
              ))}
              {m.nodes.map((col, r) => col.map((n, l) => n > 0 && (
                <g key={`${r}-${l}`}>
                  <rect x={colX(r)} y={nodeY[r][l].top} width={nodeW} height={Math.max(1, nodeY[r][l].h)} rx="2" data-part="flow-node" style={{ fill: LEVEL_FILL[l], cursor: "pointer", opacity: !hover || (hover.kind === "node" && hover.r === r && hover.l === l) || (hover.kind === "link" && ((hover.t === r && hover.f === l) || (hover.t + 1 === r && hover.to === l))) ? 1 : 0.5 }}
                    {...tip.bind(nodeTip(r, l))} onMouseEnter={enter({ kind: "node", r, l }, nodeTip(r, l))} onMouseLeave={() => { setOver(null); tip.bind(null).onMouseLeave(); }} onPointerDown={pick({ kind: "node", r, l })} />
                  {!compact && (r === 0 || r === R - 1) && nodeY[r][l].h >= 9 && (
                    <text x={r === 0 ? colX(r) - 8 : colX(r) + nodeW + 8} y={nodeY[r][l].top + nodeY[r][l].h / 2 + 4} textAnchor={r === 0 ? "end" : "start"} style={{ fill: ds.text.secondary, fontFamily: font, fontSize: 11 }}>
                      {levels[l]} <tspan style={{ fill: ds.text.primary, fontWeight: 700 }}>{n}</tspan>
                    </text>
                  )}
                </g>
              )))}
            </svg>
            {/* Key (always on a phone, where the side labels go). */}
            {(compact || colourBy === "Change") && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: `${dsSpace[4]}px ${dsSpace[12]}px` }}>
                {colourBy === "Change"
                  ? [["Better", MOVE.better], ["Same level", MOVE.same], ["Worse", MOVE.worse]].map(([k, c]) => <Key key={k} colour={c} label={k} />)
                  : null}
                {compact && levels.map((l, k) => <Key key={l} colour={LEVEL_FILL[k]} label={l} square />)}
              </div>
            )}
            {pinned && (
              <div role="status" style={{ ...dsText("Text xs"), color: ds.text.secondary, background: ds.surface.general.cardWithinCard, borderRadius: dsRadius.md, padding: `${dsSpace[8]}px ${dsSpace[12]}px` }}>
                <b style={{ color: ds.text.primary }}>{pinned.head}</b> · {pinned.rows[0].label}: {pinned.rows[0].text}{pinned.note ? ` · ${pinned.note}` : ""}
              </div>
            )}
            <p style={{ ...noteText, margin: 0 }}>
              {prevLabel} to {latest}: <b style={{ color: ds.status.success.textIndicator }}>{last.better} moved to a better level</b>, {last.same} stayed, <b style={{ color: ds.status.error.text }}>{last.worse} moved to a worse level</b>.
            </p>
          </div>
        )}
      </EvidenceSection>
      {tip.node}
    </StoryCard>
  );
}
function Key({ colour, label, square }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6], ...dsText("Text 2xs"), color: ds.text.secondary }}><i style={{ width: square ? 8 : 14, height: 8, borderRadius: square ? 2 : 4, background: colour, display: "inline-block" }} />{label}</span>;
}
