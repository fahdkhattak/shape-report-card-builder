import { useState } from "react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace, dsBorder } from "../../../lib/ds.js";
import { statusName, countByStatus } from "../../../lib/bands.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import ScopeRadar from "../ScopeRadar.jsx";
import AreaChart from "./AreaChart.jsx";
import ZoneChart from "./ZoneChart.jsx";
import { LAST, roundName, sinceText } from "../../../lib/scopeData.js";
import { StoryCard, EvidenceSection, noteText, bodyText } from "./StoryCard.jsx";
import { useCompare, CompareControl, ViewSwitch, CopyTable, FiltersControl } from "./controls.jsx";
import { DataTable, ScoreCell, ChangeCell, tableText } from "./DataTable.jsx";
import { useStoryStyle } from "./storyStyle.js";
import { WithWidth } from "./storyWidth.js";
import { RULES, fitForm } from "./breakdownRules.js";

/* ================================================================== */
/* BREAKDOWN STORY: "Shows what contributes to the result" (Figma       */
/* 13622:35946). Every item belongs to the same insight, population,    */
/* filters, and report round as the widget. Six forms share one frame    */
/* (title, controls, a line, an evidence section, a footnote):          */
/*   radar        one spoke per item; the shape is the insight           */
/*   area         a smooth curve across the items (an Explorer's Drivers)*/
/*   bars         a ranked bar per item with its score and change        */
/*   list         a big number and a sentence per item                   */
/*   distribution how many items are in each status, as one bar          */
/*   zones        every item as a dot on the score line (ours, not in     */
/*                the design); a form of its own, no longer behind a      */
/*                Bars | Zones switch                                     */
/* Controls follow the design: radar and area have Compare + Table View,  */
/* bars have Filters + Table View, the table adds Compare, Chart View     */
/* and Copy Table, list and distribution have none.                       */
/* Mental well-being (SeverityBreakdownStory), Health Age drivers         */
/* (EffectBreakdownStory) and parts of a whole (SplitBreakdownStory) are  */
/* their own files / exports.                                             */
/* ================================================================== */
const STATUSES = ["Flourishing", "Striving", "Struggling"];
const DEFAULT_FOOTNOTE = "Hover over a point to see its score. For each answer, the higher the score, the better.";

export default function BreakdownStory({ title = "What's Behind Your Score", line, items: allItems, variant: requested = "radar", noun = "Explorer", hint, limit, rank = true, initialView = "chart" }) {
  const refined = useStoryStyle() === "refined";
  // Parts with no score are left out first (and the Story says so); the form then fits the count (see breakdownRules.js).
  const items = allItems.filter((it) => Number.isFinite(it.values?.[LAST]));
  const missing = allItems.length - items.length;
  const fit = fitForm(requested, items.length);
  const variant = fit.variant;
  const [view, setView] = useState(initialView);
  const [showAll, setShowAll] = useState(false);
  const barStyle = variant === "zones" ? "zones" : "bars"; // Bars and Zones are separate forms now, so there is no switch between them
  const [statuses, setStatuses] = useState(STATUSES);
  const cmp = useCompare();
  const refName = roundName(cmp.refIdx);

  const rows = items.map((it) => {
    const value = it.values[LAST];
    const prev = it.values[cmp.refIdx];
    return { label: it.label, value, prev, delta: value - prev, blurb: it.blurb };
  });
  const ordered = rank ? [...rows].sort((a, b) => b.value - a.value) : rows;
  const shown = ordered.filter((r) => statuses.includes(statusName(r.value)));
  const ranked = ordered;

  const columns = [
    { key: "label", label: noun },
    ...(cmp.on ? [{ key: "prev", label: refName, render: (r) => <ScoreCell v={r.prev} /> }] : []),
    { key: "value", label: "Score", align: "center", render: (r) => <ScoreCell v={r.value} /> },
    { key: "delta", label: cmp.on ? `Change from ${refName}` : "Change from previous round", align: "right", render: (r) => <ChangeCell d={r.delta} />, text: (r) => (r.delta > 0 ? `+${r.delta}` : r.delta) },
  ];

  const bars = variant === "bars" || variant === "zones";
  const hasTable = variant === "radar" || variant === "area" || bars;
  const controls = view === "table"
    ? [<CompareControl key="c" cmp={cmp} />, <ViewSwitch key="v" view={view} onChange={setView} />, <CopyTable key="t" getText={() => tableText(columns, ranked)} />]
    : variant === "bars" && !refined
      ? [<FiltersControl key="f" value={statuses} onChange={setStatuses} />, <ViewSwitch key="v" view={view} onChange={setView} />]
      : hasTable
        ? [<CompareControl key="c" cmp={cmp} />, <ViewSwitch key="v" view={view} onChange={setView} />]
        : null;

  const barLimit = limit ?? (rows.length > RULES.bars.firstRows + 2 ? RULES.bars.firstRows : undefined);
  const dataStory = `breakdown-${variant}`;
  const footnote = hint ?? (variant === "radar" || variant === "area" ? DEFAULT_FOOTNOTE : null);
  const counts = countByStatus(rows.map((r) => r.value));
  const is = (n) => (n === 1 ? "is" : "are");
  const distLine = line ?? (rows.length === 1 ? <>The one {noun} is <b style={{ color: dsBand(rows[0].value).cs }}>{statusName(rows[0].value)}</b>.</> :
    <>Across the <b>{rows.length}</b> {noun}s, <b style={{ color: dsBand(100).cs }}>{counts.f}</b> {is(counts.f)} Flourishing, <b style={{ color: dsBand(70).cs }}>{counts.s}</b> {is(counts.s)} Striving, and <b style={{ color: dsBand(0).cs }}>{counts.t}</b> {is(counts.t)} Struggling.</>
  );

  return (
    <StoryCard title={title} controls={controls} line={variant === "distribution" ? distLine : line} data-story={dataStory} data-fallback={fit.from || undefined}>
      <WithWidth>{({ compact, tight }) => (
        <>
          {rows.length === 0 ? <p style={noteText}>There's nothing to show here yet.</p> : (<>
      {view === "table" && hasTable ? (
        <DataTable columns={columns} rows={ranked} />
      ) : variant === "area" ? (
        <>
          <EvidenceSection><AreaChart rows={items.map((it) => ({ label: it.label, value: it.values[LAST], prev: cmp.on ? it.values[cmp.refIdx] : undefined }))} refName={cmp.on ? refName : undefined} /></EvidenceSection>
          {cmp.on && <Legend refName={refName} accent={ds.graph.purple} />}
        </>
      ) : variant === "radar" ? (
        <>
          <EvidenceSection><ScopeRadar items={rows.map((r) => ({ ...r, prev: cmp.on ? r.prev : undefined, prevLabel: cmp.on ? refName : undefined }))} /></EvidenceSection>
          {cmp.on && <Legend refName={refName} />}
        </>
      ) : variant === "list" ? (
        <EvidenceSection pad={dsSpace[16]} gap={dsSpace[16]}><ListRows rows={ordered} compact={compact} tight={tight} /></EvidenceSection>
      ) : variant === "distribution" ? (
        <EvidenceSection><StatusSplitBar counts={counts} /></EvidenceSection>
      ) : (
        <>
          {barStyle === "zones" ? (
            <>
              <ZoneChart rows={rows} cmpOn={cmp.on} refName={refName} noun={noun} />
              {cmp.on && <p style={noteText}>The hollow marker shows each score in {refName}.</p>}
            </>
          ) : refined ? (
            <>
              <BarListRefined compact={compact} rows={barLimit && !showAll ? ranked.slice(0, barLimit) : ranked} cmpOn={cmp.on} refName={refName} />
              {barLimit && ranked.length > barLimit && <ShowAll open={showAll} total={ranked.length} onToggle={() => setShowAll((v) => !v)} />}
            </>
          ) : (
            <>
              <EvidenceSection gap={compact ? dsSpace[16] : 10}><BarsList compact={compact} rows={barLimit && !showAll ? shown.slice(0, barLimit) : shown} /></EvidenceSection>
              {shown.length === 0 && <p style={noteText}>No {noun.toLowerCase()}s match the filters.</p>}
              {barLimit && shown.length > barLimit && <ShowAll open={showAll} total={shown.length} onToggle={() => setShowAll((v) => !v)} />}
            </>
          )}
        </>
      )}
      {footnote && view === "chart" && <p data-part="footnote" style={noteText}>{compact ? footnote.replace(/^Hover over a point/, "Tap a point").replace(/^Hover over the chart/, "Tap a point on the chart") : footnote}</p>}
      {variant === "zones" && barStyle === "zones" && view === "chart" && <p style={noteText}>{hint || (compact ? "The tinted groups show the three status ranges." : "Hover a dot to see its score, status and what it means. The background shows the three status ranges.")}</p>}
          </>)}
          {missing > 0 && <p data-part="missing" style={noteText}>{missing} {noun}{missing === 1 ? "" : "s"} {missing === 1 ? "isn't" : "aren't"} shown because {missing === 1 ? "it has" : "they have"} no score yet.</p>}
        </>
      )}</WithWidth>
    </StoryCard>
  );
}

export function ShowAll({ open, total, onToggle }) {
  return (
    <button onClick={onToggle} style={{ alignSelf: "flex-start", border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: font, ...dsText("Text xs", 600), color: ds.text.secondary, textDecoration: "underline" }}>
      {open ? "Show fewer" : `Show all ${total}`}
    </button>
  );
}

function Legend({ refName, accent = "#ef5a1f" }) {
  const dot = (c, dashed) => <span style={{ width: 18, height: 0, borderTop: `2px ${dashed ? "dashed" : "solid"} ${c}`, display: "inline-block" }} />;
  return (
    <div style={{ display: "flex", gap: dsSpace[16], ...dsText("Text 2xs"), color: ds.text.secondary, fontFamily: font }}>
      <span style={{ display: "flex", alignItems: "center", gap: dsSpace[6] }}>{dot(accent)} Now</span>
      <span style={{ display: "flex", alignItems: "center", gap: dsSpace[6] }}>{dot(ds.text.quaternary, true)} {refName}</span>
    </div>
  );
}

/* ---- bars (Figma 13622:36051) ---------------------------------------------------------------- */
/* A label (right-aligned), an 8px track with the score filled in its status colour, the score in
   Text md / Bold and the change since the previous round. Rows are 10px apart. */
function BarsList({ rows, compact }) {
  return rows.map((r, i) => {
    const b = dsBand(r.value);
    if (compact) {
      // Compact: the label (it may wrap) and the score + change share a line, the track runs the full width below.
      return (
        <div key={`${i}-${r.label}`} data-part="bar-row" style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], fontFamily: font }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[12] }}>
            <span data-part="bar-label" style={{ flex: 1, minWidth: 0, textAlign: "left", ...dsText("Text sm"), color: ds.text.secondary }}>{r.label}</span>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: dsSpace[8] }}>
              <span data-part="bar-value" style={{ ...dsText("Text md", 700), lineHeight: "18px", color: b.cs, fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
              <TrendPill delta={r.delta} numberOnly />
            </div>
          </div>
          <div data-part="bar-track" role="img" aria-label={`${r.label}: ${r.value} out of 100`} style={{ height: dsSpace[8], borderRadius: dsRadius.full, overflow: "hidden", background: ds.bg.secondary }}>
            <div data-part="bar-fill" style={{ width: `${Math.max(0, Math.min(100, r.value))}%`, height: "100%", background: b.c }} />
          </div>
        </div>
      );
    }
    return (
      <div key={`${i}-${r.label}`} data-part="bar-row" style={{ display: "flex", alignItems: "center", gap: dsSpace[16], fontFamily: font }}>
        <span data-part="bar-label" title={r.label} style={{ flex: "0 1 247px", minWidth: 96, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...dsText("Text sm"), color: ds.text.secondary }}>{r.label}</span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: dsSpace[8] }}>
          <div data-part="bar-track" role="img" aria-label={`${r.label}: ${r.value} out of 100`} style={{ flex: 1, height: dsSpace[8], borderRadius: dsRadius.full, overflow: "hidden", background: ds.bg.secondary }}>
            <div data-part="bar-fill" style={{ width: `${Math.max(0, Math.min(100, r.value))}%`, height: "100%", background: b.c }} />
          </div>
          <div style={{ flexShrink: 0, minWidth: 84, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: dsSpace[12] }}>
            <span data-part="bar-value" style={{ ...dsText("Text md", 700), lineHeight: "18px", letterSpacing: "-0.01em", color: b.cs, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
            <TrendPill delta={r.delta} numberOnly />
          </div>
        </div>
      </div>
    );
  });
}

/* ---- list (Figma 13622:36646) ------------------------------------------------------------------ */
/* A big number with "/100" in a 115px block, a bold name, and a sentence. A hairline between rows. */
function ListRows({ rows, compact, tight }) {
  return rows.map((r, i) => {
    const b = dsBand(r.value);
    return (
      <div key={`${i}-${r.label}`} style={{ display: "contents" }}>
        {i > 0 && <div aria-hidden="true" style={{ height: 0, borderTop: `${dsBorder.sm}px solid ${ds.border.secondary}`, width: "100%" }} />}
        <div data-part="list-row" style={{ display: "flex", flexDirection: tight ? "column" : "row", alignItems: tight ? "flex-start" : "center", gap: tight ? dsSpace[8] : dsSpace[16], fontFamily: font }}>
          <div data-part="list-value" style={{ width: tight ? "auto" : compact ? 84 : 115, flexShrink: 0, display: "flex", alignItems: "baseline", justifyContent: tight ? "flex-start" : "center", gap: dsSpace[4], whiteSpace: "nowrap" }}>
            <span data-part="number" style={{ ...dsText("Display md-Trim", 700), lineHeight: "normal", textBox: "trim-both cap alphabetic", color: b.cs }}>{r.value}</span>
            <span data-part="unit" style={{ ...dsText("Text 3xs-Trim"), color: ds.text.secondary }}>/100</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: dsSpace[8], ...dsText("Text sm"), color: ds.text.secondary }}>
            <p data-part="list-name" style={{ margin: 0, fontWeight: 700 }}>{r.label}</p>
            {r.blurb && <p data-part="list-text" style={{ margin: 0 }}>{r.blurb}</p>}
          </div>
        </div>
      </div>
    );
  });
}

/* ---- distribution (Figma 13622:36158) ------------------------------------------------------------ */
/* One 8px bar split in proportion to how many items are in each status. */
export function StatusSplitBar({ counts }) {
  const seg = [["Flourishing", counts.f, ds.status.success.graph], ["Striving", counts.s, ds.status.warning.graph], ["Struggling", counts.t, ds.status.error.graph]];
  const total = counts.f + counts.s + counts.t;
  return (
    <div data-part="bar" role="img" aria-label={`${total} items: ${counts.f} Flourishing, ${counts.s} Striving, and ${counts.t} Struggling`} style={{ display: "flex", height: dsSpace[8], borderRadius: dsRadius.full, overflow: "hidden" }}>
      {seg.filter(([, n]) => n > 0).map(([name, n, c]) => <div key={name} title={`${name}: ${n}`} style={{ flex: n, background: c }} />)}
    </div>
  );
}

/* Change as plain coloured text ("+2"), the way a row in a list wants it; a pill per row is noise. */
function DeltaText({ d }) {
  if (!d) return null;
  return <span style={{ fontSize: 12, fontWeight: 500, color: d > 0 ? T.greenStrong : T.redStrong, fontVariantNumeric: "tabular-nums" }}>{d > 0 ? "+" : "−"}{Math.abs(d)}</span>;
}

/* The earlier ranked list, kept for the Refined style. */
function BarListRefined({ rows, cmpOn, refName, compact }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", fontFamily: font }}>
      {rows.map((r, i) => {
        const b = band(r.value);
        return (
          <div key={`${i}-${r.label}`} style={{ display: "grid", gridTemplateColumns: compact ? "minmax(0, 1fr) auto" : "minmax(120px, 1.1fr) minmax(0, 2fr) 92px", alignItems: "center", gap: compact ? "8px 12px" : 20, padding: "12px 0", borderTop: i ? `1px solid ${T.gray50}` : "none" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: T.gray900, minWidth: 0 }}>{r.label}</span>
            <div style={{ position: "relative", height: 6, borderRadius: radius.full, background: T.gray50, ...(compact ? { gridColumn: "1 / -1", gridRow: 2 } : null) }}>
              <div style={{ width: `${r.value}%`, height: "100%", borderRadius: radius.full, background: b.c }} />
              {cmpOn && <span title={`${refName}: ${r.prev}`} style={{ position: "absolute", left: `${r.prev}%`, top: -4, width: 2, height: 14, background: T.gray500, borderRadius: 1 }} />}
            </div>
            <span style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 10 }}>
              {cmpOn ? <span style={{ fontSize: 12, color: T.gray500 }}>{sinceText(r.delta, refName).replace(` since ${refName}`, "")}</span> : <DeltaText d={r.delta} />}
              <b style={{ fontSize: 18, fontWeight: 600, color: b.cs, fontVariantNumeric: "tabular-nums", minWidth: 24, textAlign: "right" }}>{r.value}</b>
            </span>
          </div>
        );
      })}
      {cmpOn && <p style={{ ...noteText, marginTop: 8 }}>The grey tick marks each score in {refName}.</p>}
    </div>
  );
}

/* ---- split: parts of a whole, counts per round ---------------------- */
/* parts: [{ label, color, counts: number[] per round }] */
export function SplitBreakdownStoryLegacy({ title, line, parts, unit = "people", hint }) {
  const refined = useStoryStyle() === "refined";
  const [view, setView] = useState("chart");
  const cmp = useCompare();
  const refName = roundName(cmp.refIdx);
  const total = (i) => parts.reduce((a, p) => a + p.counts[i], 0) || 1;
  const rows = parts.map((p) => ({ label: p.label, color: p.color, n: p.counts[LAST], pct: Math.round((p.counts[LAST] / total(LAST)) * 100), prevN: p.counts[cmp.refIdx], delta: p.counts[LAST] - p.counts[cmp.refIdx] }));

  const columns = [
    { key: "label", label: "Group" },
    ...(cmp.on ? [{ key: "prevN", label: refName, align: "right" }] : []),
    { key: "n", label: "Now", align: "right" },
    { key: "pct", label: "Share", align: "right", render: (r) => `${r.pct}%`, text: (r) => `${r.pct}%` },
    { key: "delta", label: cmp.on ? `Change from ${refName}` : "Change from previous round", align: "right", render: (r) => <ChangeCell d={r.delta} />, text: (r) => (r.delta > 0 ? `+${r.delta}` : r.delta) },
  ];
  const controls = [
    <CompareControl key="c" cmp={cmp} />,
    <ViewSwitch key="v" view={view} onChange={setView} />,
    view === "table" && <CopyTable key="t" getText={() => tableText(columns, rows)} />,
  ];
  return (
    <StoryCard title={title} controls={controls} line={line}>
      {view === "table" ? (
        <DataTable columns={columns} rows={rows} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: refined ? 0 : 14, fontFamily: font }}>
          <div style={{ display: "flex", height: refined ? 10 : 12, borderRadius: radius.full, overflow: "hidden", gap: 2, marginBottom: refined ? 12 : 0 }}>
            {rows.map((r) => <div key={r.label} title={`${r.label}: ${r.n}`} style={{ flex: Math.max(r.n, 0.0001), background: r.color }} />)}
          </div>
          {rows.map((r, ri) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, ...(refined ? { padding: "12px 0", borderTop: ri ? `1px solid ${T.gray50}` : "none", fontVariantNumeric: "tabular-nums" } : null) }}>
              <span style={{ width: 10, height: 10, borderRadius: refined ? 3 : "50%", background: r.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.gray900 }}>{r.label}</span>
              {cmp.on && <span style={{ fontSize: 12, color: T.gray500 }}>{refName}: {r.prevN} →</span>}
              {!cmp.on && r.delta !== 0 && (refined ? <DeltaText d={r.delta} /> : <TrendPill delta={r.delta} numberOnly />)}
              <span style={{ fontSize: 16, fontWeight: refined ? 600 : 700, color: T.gray900, minWidth: 60, textAlign: "right" }}>{r.n} <span style={{ fontSize: 12, fontWeight: 400, color: T.gray500 }}>{unit}</span></span>
              <span style={{ fontSize: 13, color: T.gray500, minWidth: 40, textAlign: "right" }}>{r.pct}%</span>
            </div>
          ))}
        </div>
      )}
      {hint && view === "chart" && <p style={noteText}>{hint}</p>}
    </StoryCard>
  );
}
