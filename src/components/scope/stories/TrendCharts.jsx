import { useRef, useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsSpace, dsRadius, dsShadow, dsBorder } from "../../../lib/ds.js";
import { TrendPill } from "../../widgets/primitives.jsx";
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
  const n = values.length, cx = spreadCentre(n);
  const [lo, hi] = domain;
  const y = (v) => (1 - (v - lo) / (hi - lo)) * PLOT_H;
  return (
    <Frame title={axis} titleTone={banded ? "secondary" : "tertiary"} ticks={ticks} gridAt={evenGrid(ticks.length)} rounds={rounds} centre={cx}>
      <svg width="100%" height={PLOT_H} viewBox={`0 0 1000 ${PLOT_H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible" }} aria-hidden="true">
        {reference && <polyline points={reference.map((v, i) => `${cx(i) * 1000},${y(v)}`).join(" ")} fill="none" stroke={DOT} strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
        <polyline data-part="line" points={values.map((v, i) => `${cx(i) * 1000},${y(v)}`).join(" ")} fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ stroke: LINE }} />
      </svg>
      {values.map((v, i) => (
        <div key={i} role="img" aria-label={`${rounds[i].label}: ${v}${unit}`} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}
          style={{ position: "absolute", left: `${cx(i) * 100}%`, top: y(v), transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", cursor: "default" }}>
          {banded && <span data-part="point-value" style={{ position: "absolute", bottom: "100%", marginBottom: dsSpace[4], ...dsText("Text 2xs", 600), lineHeight: 1, color: dsBand(v).cs }}>{v}{unit}</span>}
          <span data-part="dot" style={{ width: banded ? 6 : 8, height: banded ? 6 : 8, borderRadius: "50%", background: DOT, boxShadow: hover === i ? `0 0 0 3px ${ds.surface.general.card}, 0 0 0 4px ${DOT}` : "none" }} />
          {hover === i && !banded && <span style={{ position: "absolute", bottom: "100%", marginBottom: dsSpace[8], ...dsText("Text 2xs", 600), color: ds.text.primary, background: ds.surface.general.tooltip, borderRadius: dsRadius.md, padding: `${dsSpace[4]}px ${dsSpace[8]}px`, boxShadow: dsShadow("sm"), whiteSpace: "nowrap" }}>{v}{unit}{reference ? ` · ${referenceLabel.toLowerCase()} ${reference[i]}${unit}` : ""}</span>}
        </div>
      ))}
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
              <div data-part="state-tip" role="status" style={{ position: "absolute", left: `${cx(hover[0]) * 100}%`, top: -8, transform: `translate(${hover[0] === 0 ? "-16%" : hover[0] === n - 1 ? "-84%" : "-50%"}, -100%)`, zIndex: 3, pointerEvents: "none", whiteSpace: "nowrap", background: ds.surface.general.tooltip, borderRadius: dsRadius.md, padding: `${dsSpace[6]}px ${dsSpace[8]}px`, boxShadow: dsShadow("sm"), borderLeft: `2px solid ${LEVEL_FILL[hover[1]]}`, ...dsText("Text 2xs"), color: ds.text.secondary }}>
                {rounds[hover[0]].label} · <b style={{ color: LEVEL_TEXT[hover[1]] }}>{LEVELS[hover[1]]}</b> · {m.rounds[hover[0]][hover[1]]}%
              </div>
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
      <div data-part="status-tip" role="status" style={{ position: "absolute", left: `${cx(i) * 100}%`, top: -8, transform: `translate(${i === 0 ? "-16%" : i === n - 1 ? "-84%" : "-50%"}, -100%)`, zIndex: 3, pointerEvents: "none", whiteSpace: "nowrap", background: ds.surface.general.tooltip, borderRadius: dsRadius.md, padding: `${dsSpace[8]}px ${dsSpace[12]}px`, boxShadow: dsShadow("sm"), borderLeft: `2px solid ${STATUS_KEYS[j].c}`, display: "flex", flexDirection: "column", gap: dsSpace[2], fontFamily: font }}>
        <span style={{ ...dsText("Text 2xs", 500), color: ds.text.tertiary }}>{rounds[i].label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: dsSpace[8] }}>
          <b style={{ ...dsText("Text sm", 700), color: STATUS_KEYS[j].cs }}>{STATUS_KEYS[j].label} {share[i].pct[j]}%</b>
          {d != null && d !== 0 && <span style={{ ...dsText("Text 2xs", 600), color: ds.text.secondary }}>{d > 0 ? "+" : "−"}{Math.abs(d)} pts</span>}
        </span>
        <span style={{ ...dsText("Text 2xs"), color: ds.text.secondary }}>{share[i].people[j]} of {share[i].total} people</span>
      </div>
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
              <div data-part="level-tip" role="status" style={{ position: "absolute", left: Math.max(0, Math.min(f.plotW - 240, cx(h) * f.plotW + (cx(h) * f.plotW + 280 <= f.plotW ? 40 : -280))), top: -6, width: 240, boxSizing: "border-box", zIndex: 3, pointerEvents: "none", background: ds.surface.general.tooltip, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, boxShadow: dsShadow("sm"), display: "flex", flexDirection: "column", gap: dsSpace[8], fontFamily: font }}>
                <span style={{ ...dsText("Text xs", 600), color: ds.text.secondary, textTransform: "uppercase" }}>{who}</span>
                <TipLevel date={rounds[h].date || rounds[h].label} k={m.levels[h]} big delta={h > 0 ? m.levels[h - 1] - m.levels[h] : null} />
                {h > 0 && <>
                  <span style={{ ...dsText("Text 3xs", 600), lineHeight: 1, letterSpacing: "0.01em", textTransform: "uppercase", color: ds.text.quaternary }}>Compared to</span>
                  <TipLevel date={rounds[h - 1].date || rounds[h - 1].label} k={m.levels[h - 1]} />
                </>}
              </div>
            )}
          </>)}</Frame>
        )}
      </EvidenceSection>
      {/* On a compact card the comparison opens here, under the chart, when a bar is tapped. */}
      {view === "chart" && compact && h != null && (
        <div data-part="level-detail" role="status" style={{ background: ds.surface.general.tooltip, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, display: "flex", flexDirection: "column", gap: dsSpace[8], fontFamily: font }}>
          <span style={{ ...dsText("Text xs", 600), color: ds.text.secondary, textTransform: "uppercase" }}>{who}</span>
          <TipLevel date={rounds[h].date || rounds[h].label} k={m.levels[h]} big delta={h > 0 ? m.levels[h - 1] - m.levels[h] : null} />
          {h > 0 && <>
            <span style={{ ...dsText("Text 3xs", 600), lineHeight: 1, letterSpacing: "0.01em", textTransform: "uppercase", color: ds.text.quaternary }}>Compared to</span>
            <TipLevel date={rounds[h - 1].date || rounds[h - 1].label} k={m.levels[h - 1]} />
          </>}
        </div>
      )}
    </StoryCard>
    </div>
  );
}
function TipLevel({ date, k, big, delta }) {
  return (
    <div style={{ borderLeft: `2px solid ${LEVEL_FILL[k]}`, padding: `${dsSpace[2]}px 0 ${dsSpace[2]}px ${dsSpace[6]}px`, display: "flex", flexDirection: "column", gap: dsSpace[2] }}>
      <span style={{ ...dsText("Text 2xs", 500), color: ds.text.tertiary, textTransform: "uppercase" }}>{date}</span>
      <span style={{ display: "flex", alignItems: "center", gap: dsSpace[8] }}>
        <span style={{ ...dsText(big ? "Text lg" : "Text md", 700), color: LEVEL_TEXT[k] }}>{LEVELS[k]}</span>
        {delta != null && delta !== 0 && <TrendPill delta={delta} compact />}
      </span>
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
                  {hover === i && <span style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", ...dsText("Text 2xs", 600), color: ds.text.primary, background: ds.surface.general.tooltip, borderRadius: dsRadius.md, padding: `${dsSpace[4]}px ${dsSpace[8]}px`, boxShadow: dsShadow("sm") }}>eNPS {p.enps} · {p.promoters}% / {p.passives}% / {p.detractors}%</span>}
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
