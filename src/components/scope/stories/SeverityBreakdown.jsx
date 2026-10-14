import { useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace } from "../../../lib/ds.js";
import { SEVERITY } from "../../../lib/wellbeing.js";
import trendCaretDown from "../../../assets/trend-caret-down.svg";
import { StoryCard, EvidenceSection } from "./StoryCard.jsx";
import { ViewSwitch, CopyTable } from "./controls.jsx";
import { DataTable, tableText } from "./DataTable.jsx";
import { useStoryWidth } from "./storyWidth.js";
import { RULES } from "./breakdownRules.js";
import { ShowAll } from "./BreakdownStory.jsx";

/* ================================================================== */
/* SEVERITY BREAKDOWN: Mental Well-Being (Figma 13622:36188 "Your",      */
/* 13622:36298 "Team", 13622:36472 "Org"). Rows are measures (Feeling    */
/* Low, Feeling Anxious, Feeling Stressed); columns are five severity    */
/* bands from Normal to Extremely Severe, each cell tinted with the       */
/* Likert "subtle" colour for its band.                                   */
/*   personal  only the reader's own band is marked: a ring, a 4px line    */
/*             under the cell in the band's colour, and a trend caret;     */
/*             a sentence under the row says what it means                 */
/*   counts    (Team and Org) every cell shows its share, the caret for     */
/*             change, and how many people ("5 Members", "6 Employees")    */
/* Rows: [{ label, current?, trend?, sentence?, cells: [{ pct, count, delta }] x 5 }] */
/* ================================================================== */
const BG = [ds.likert.vGoodSubtle, ds.likert.goodSubtle, ds.likert.neutralSubtle, ds.likert.badSubtle, ds.likert.veryBadSubtle];
const EDGE = [ds.likert.vGood, ds.likert.good, ds.likert.neutral, ds.likert.bad, ds.likert.veryBad];
const GAP = 1.511;       // between cells (design: 1.511px)
const LABEL_GAP = 18.129; // between the label column and the cells

/* The trend caret: both caret assets point down, so up = rotate 180 degrees. Green up, red down, as in the design. */
function Caret({ delta, title, small }) {
  const bw = small ? 12 : 24;
  if (!delta) return small ? null : <span style={{ width: bw, flexShrink: 0 }} />;
  const up = delta > 0;
  return (
    <span title={title} style={{ width: bw, height: small ? 16 : 20, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <span data-part="caret" style={{ width: 8, height: 8, display: "block", backgroundColor: up ? ds.status.success.icon : ds.status.error.icon, WebkitMask: `url(${trendCaretDown}) center / contain no-repeat`, mask: `url(${trendCaretDown}) center / contain no-repeat`, transform: up ? "rotate(180deg)" : undefined }} />
    </span>
  );
}

function Marker({ colour }) {
  return <span data-part="marker" aria-hidden="true" style={{ width: 16, height: 16, borderRadius: "50%", boxSizing: "border-box", border: `2px solid ${colour}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: colour }} /></span>;
}

export default function SeverityBreakdownStory({ title, line, rows, unit = "Employees", personal = false, sample = false }) {
  const [view, setView] = useState("chart");
  // More than 8 measures: show the first 6 until someone asks for all (the table always has every row).
  const [showAll, setShowAll] = useState(false);
  const lim = RULES.wellbeing.firstRows;
  const cut = rows.length > lim + 2;
  const chartRows = cut && !showAll ? rows.slice(0, lim) : rows;
  const columns = [{ key: "label", label: "Measure" }, ...SEVERITY.map((b, i) => ({ key: `b${i}`, label: b, align: "center" }))];
  const tableRows = rows.map((r) => ({ label: r.label, ...Object.fromEntries(r.cells.map((c, i) => [`b${i}`, personal ? (r.current === i ? "You are here" : "") : `${c.pct}% (${c.count} ${unit})`])) }));
  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="t" getText={() => tableText(columns, tableRows)} />];
  const grid = { flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: GAP };

  return (
    <StoryCard title={title} controls={controls} line={line} data-story="breakdown-severity">
      {view === "table" ? <DataTable columns={columns} rows={tableRows} /> : (
        <SeverityChart rows={chartRows} personal={personal} unit={unit} />
      )}
      {cut && view === "chart" && <ShowAll open={showAll} total={rows.length} onToggle={() => setShowAll((v) => !v)} />}
      {sample && view === "chart" && <p style={{ margin: 0, ...dsText("Text xs"), color: ds.text.tertiary }}>Sample data. The dataset has no {personal ? "per-person" : "per-team"} well-being scores yet.</p>}
    </StoryCard>
  );
}

function SeverityChart({ rows, personal, unit }) {
  const { compact } = useStoryWidth();
  const grid = { flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: GAP };
  if (compact) {
    // Compact: the band names once across the top, then for each measure its name above a full-width row of five cells.
    // A cell keeps the share and shows the count as a bare number with the change caret ("5" under "21%"); the unit is in the note.
    return (
      <>
        <EvidenceSection gap={dsSpace[20]}>
          <div style={{ ...grid, fontFamily: font, alignItems: "end" }}>{SEVERITY.map((b) => <span key={b} data-part="band" style={{ ...dsText("Label xs", 600), lineHeight: "12px", textAlign: "center", color: ds.text.tertiary, overflowWrap: "anywhere" }}>{b}</span>)}</div>
          {rows.map((r, ri) => (
            <div key={`${ri}-${r.label}`} data-part="row" style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], fontFamily: font }}>
              <span style={{ ...dsText("Text sm", 600), color: ds.text.secondary }}>{r.label}</span>
              <div style={grid}>
                {r.cells.map((c, i) => {
                  const mine = personal && r.current === i;
                  return personal ? (
                    <div key={i} data-part="cell" aria-label={`${r.label}, ${SEVERITY[i]}${mine ? ", your level" : ""}`} style={{ background: BG[i], boxSizing: "border-box", minHeight: 40, padding: mine ? `${dsSpace[8]}px ${dsSpace[4]}px ${dsSpace[4]}px` : 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 2, ...(mine ? { borderBottom: `4px solid ${EDGE[i]}` } : null) }}>
                      {mine && <><Marker colour={EDGE[i]} /><Caret small delta={r.trend} title={r.trend > 0 ? "Up since last round" : "Down since last round"} /></>}
                    </div>
                  ) : (
                    <div key={i} data-part="cell" aria-label={`${r.label}, ${SEVERITY[i]}: ${c.pct}%, ${c.count} ${unit}${c.delta ? `, ${c.delta > 0 ? "up" : "down"} ${Math.abs(c.delta)} points` : ""}`} style={{ background: BG[i], boxSizing: "border-box", minHeight: 52, padding: `${dsSpace[8]}px ${dsSpace[2]}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                      <span data-part="pct" style={{ ...dsText("Text sm", 700), color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{c.pct}%</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                        <Caret small delta={c.delta} title={c.delta ? `${c.delta > 0 ? "Up" : "Down"} ${Math.abs(c.delta)} points since last round` : undefined} />
                        <span data-part="count" style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, fontVariantNumeric: "tabular-nums" }}>{c.count}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              {personal && r.sentence && <p data-part="sentence" style={{ margin: 0, ...dsText("Text sm"), color: ds.text.secondary }}>{r.sentence}</p>}
            </div>
          ))}
        </EvidenceSection>
        {!personal && <p style={{ margin: 0, ...dsText("Text xs"), color: ds.text.tertiary }}>Each cell shows the share of {unit.toLowerCase()}, then how many. An arrow shows the change since the last round.</p>}
      </>
    );
  }
  return (
        <EvidenceSection gap={dsSpace[16]}>
          <div style={{ display: "flex", alignItems: "center", gap: LABEL_GAP, fontFamily: font }}>
            <div style={{ width: 115, flexShrink: 0 }} />
            <div style={grid}>{SEVERITY.map((b) => <span key={b} data-part="band" style={{ ...dsText("Label xs", 600), lineHeight: "7px", textAlign: "center", color: ds.text.tertiary }}>{b}</span>)}</div>
          </div>
          {rows.map((r, ri) => (
            <div key={`${ri}-${r.label}`} data-part="row" style={{ display: "flex", flexDirection: "column", gap: dsSpace[4], fontFamily: font }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: LABEL_GAP }}>
                <div style={{ width: 115, flexShrink: 0, display: "flex", alignItems: "center", padding: "4.5px 0", ...dsText("Text sm"), color: ds.text.secondary }}>{r.label}</div>
                <div style={grid}>
                  {r.cells.map((c, i) => {
                    const mine = personal && r.current === i;
                    const edge = mine ? { borderBottom: `4px solid ${EDGE[i]}` } : null;
                    return personal ? (
                      <div key={i} data-part="cell" aria-label={`${r.label}, ${SEVERITY[i]}${mine ? ", your level" : ""}`} style={{ background: BG[i], boxSizing: "border-box", minHeight: 36, padding: mine ? `${dsSpace[8]}px ${dsSpace[8]}px ${dsSpace[4]}px` : 0, display: "flex", alignItems: "center", justifyContent: "center", ...edge }}>
                        {mine && <><span style={{ width: 24, flexShrink: 0 }} /><span style={{ flex: 1, display: "flex", justifyContent: "center" }}><Marker colour={EDGE[i]} /></span><Caret delta={r.trend} title={r.trend > 0 ? "Up since last round" : "Down since last round"} /></>}
                      </div>
                    ) : (
                      <div key={i} data-part="cell" aria-label={`${r.label}, ${SEVERITY[i]}: ${c.pct}%, ${c.count} ${unit}${c.delta ? `, ${c.delta > 0 ? "up" : "down"} ${Math.abs(c.delta)} points` : ""}`} style={{ background: BG[i], boxSizing: "border-box", minHeight: 56, padding: dsSpace[8], display: "flex", flexDirection: "column", justifyContent: "center", gap: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ width: 24, flexShrink: 0 }} />
                          <span data-part="pct" style={{ ...dsText("Text md", 700), color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{c.pct}%</span>
                          <Caret delta={c.delta} title={c.delta ? `${c.delta > 0 ? "Up" : "Down"} ${Math.abs(c.delta)} points since last round` : undefined} />
                        </div>
                        <span data-part="count" style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, textAlign: "center" }}>{c.count} {unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {personal && r.sentence && (
                <div style={{ display: "flex", gap: LABEL_GAP }}>
                  <div style={{ width: 115, flexShrink: 0 }} />
                  <p data-part="sentence" style={{ flex: 1, margin: 0, padding: "1px 0", ...dsText("Text sm"), color: ds.text.secondary }}>{r.sentence}</p>
                </div>
              )}
            </div>
          ))}
        </EvidenceSection>
  );
}
