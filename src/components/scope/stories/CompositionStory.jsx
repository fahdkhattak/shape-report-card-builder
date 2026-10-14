import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsSpace, dsBorder, dsRadius } from "../../../lib/ds.js";
import { COMPOSITION_TABS, groupRows, SUPPRESS_BELOW } from "../../../lib/scopeData.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { StoryCard, EvidenceSection, noteText } from "./StoryCard.jsx";
import { PillTabs, ViewSwitch, CopyTable } from "./controls.jsx";
import { tableText } from "./DataTable.jsx";
import { useStoryWidth } from "./storyWidth.js";
import DonutChart from "./DonutChart.jsx";
import DonutLegend from "./DonutLegend.jsx";
import { InnerCard, AxisIcon } from "./diagnosticParts.jsx";

/* ================================================================== */
/* COMPOSITION STORY: "who is represented" (Figma 13622:39606).          */
/* Title "Breakdowns", the four tabs as one pill (People, Organisation,  */
/* Employment, Locations), then Table View (and Copy Table in the table). */
/* Chart View (13622:39607, 13622:39699): one ring per way of grouping    */
/* people in the tab, 16px apart and centred in an Evidence Section, and   */
/* "Select a segment to view details." underneath, which becomes the       */
/* details of the segment you select.                                     */
/* Table View (13622:39765): six equal columns (Group, Employees,          */
/* Population, Score, Change, Compared with average), one collapsible      */
/* section per way of grouping on a light band, the first open. Rows are    */
/* 52px apart with a hairline between; the group name and the score are    */
/* bold; no change is a grey "-" pill.                                     */
/* The design's axes the data doesn't have (Age, Ethnicity, Education,      */
/* Salary, Country) are left out. Ours are named as the design names them   */
/* where they match: tenure is "Employment Duration", work model is "Work   */
/* Composition", location is "Site".                                       */
/* Two forms of Chart View (`form`): "rings" (the design, default) and     */
/* "donut" (the earlier build, kept by request: one card per way of        */
/* grouping with a donut beside a linked legend, DonutLegend.jsx). Tabs,   */
/* Table View and the data are the same for both.                          */
/* Privacy: a group under SUPPRESS_BELOW people is drawn (it is part of who */
/* is represented) but never shows a score, change or comparison.          */
/* ================================================================== */
const LABEL = { tenure: "Employment Duration", workModel: "Work Composition", location: "Site" };
const axisName = (key, fallback) => LABEL[key] || fallback;
const vsAvgText = (v) => (v == null ? "Not shown" : v === 0 ? "Same as average" : `${Math.abs(v)}% ${v > 0 ? "above" : "below"} average`);
const PROMPT = "Select a segment to view details.";

export default function CompositionStory({ form = "rings", initialTab = "People", initialView = "chart", title = "Breakdowns", line, scoreOf }) {
  const [tab, setTab] = useState(initialTab);
  const [view, setView] = useState(initialView);
  const [sel, setSel] = useState(null); // { axis, i }
  const def = COMPOSITION_TABS.find((t) => t.tab === tab) || COMPOSITION_TABS[0];
  const blocks = def.axes.map(([key, label]) => ({ key, label: axisName(key, label), rows: groupRows(key, undefined, scoreOf) }));
  const pick = (t) => { setTab(t); setSel(null); };

  const columns = [
    { key: "group", label: "Group" },
    { key: "n", label: "Employees" },
    { key: "pct", label: "Population", text: (r) => `${r.pct}%` },
    { key: "score", label: "Score", text: (r) => r.score ?? "Not shown" },
    { key: "change", label: "Change", text: (r) => (r.change == null ? "" : r.change > 0 ? `+${r.change}` : r.change) },
    { key: "vsAvg", label: "Compared with average", text: (r) => vsAvgText(r.vsAvg) },
  ];
  const flat = () => blocks.flatMap((b) => b.rows.map((r) => ({ ...r, group: `${b.label}: ${r.group}` })));
  const controls = [
    <PillTabs key="tabs" label="Ways of grouping people" tabs={COMPOSITION_TABS.map((t) => t.tab)} value={def.tab} onChange={pick} />,
    <ViewSwitch key="v" view={view} onChange={setView} />,
    view === "table" && <CopyTable key="c" getText={() => tableText(columns, flat())} />,
  ];

  return (
    <StoryCard title={title} controls={controls} line={line} data-story="composition" data-form={form}>
      {view === "table" ? <CompositionTable blocks={blocks} /> : form === "donut" ? <DonutBlocks blocks={blocks} /> : <RingRow blocks={blocks} sel={sel} setSel={setSel} />}
      {view === "chart" && form !== "donut" && <Detail blocks={blocks} sel={sel} />}
      {view === "chart" && form === "donut" && blocks.some((b) => b.rows.some((r) => r.hidden)) && <p style={noteText}>- means fewer than {SUPPRESS_BELOW} people are in that group, so its score isn't shown.</p>}
    </StoryCard>
  );
}

/* The rings, centred and wrapping. On a compact card they shrink so two still sit side by side. */
function RingRow({ blocks, sel, setSel }) {
  const { compact, tight } = useStoryWidth();
  const size = tight ? 128 : compact ? 150 : 176;
  return (
    <EvidenceSection>
      <div data-part="rings" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: dsSpace[16] }}>
        {blocks.map((b, bi) => (
          <DonutChart key={b.key} axisKey={b.key} label={b.label} rows={b.rows} size={size}
            selected={sel?.axis === bi ? sel.i : null} onSelect={(i) => setSel(i == null ? null : { axis: bi, i })} />
        ))}
      </div>
    </EvidenceSection>
  );
}

/* The "Donut" form: each way of grouping in its own inner card (icon + name, then the donut beside its legend), in an
   Evidence Section, 16px apart. Kept by request alongside the Figma rings; see DonutLegend.jsx. */
function DonutBlocks({ blocks }) {
  return (
    <EvidenceSection gap={dsSpace[16]}>
      {blocks.map((b) => (
        <InnerCard key={b.key} data-part="donut-block">
          <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12] }}>
            <AxisIcon axis={b.key} />
            <span style={{ ...dsText("Text sm", 700), color: ds.text.secondary }}>{b.label}</span>
          </div>
          <DonutLegend axisKey={b.key} label={b.label} rows={b.rows} />
        </InnerCard>
      ))}
    </EvidenceSection>
  );
}

/* The footer line: the prompt, or what the selected segment is. */
function Detail({ blocks, sel }) {
  const r = sel ? blocks[sel.axis]?.rows[sel.i] : null;
  if (!r) return <p data-part="detail" style={noteText}>{PROMPT}</p>;
  const b = blocks[sel.axis];
  return (
    <p data-part="detail" role="status" style={{ ...noteText, color: ds.text.secondary }}>
      <b style={{ color: ds.text.primary }}>{r.group}</b> ({b.label}): {r.n} {r.n === 1 ? "person" : "people"}, {r.pct}% of everyone.{" "}
      {r.hidden
        ? <>Fewer than {SUPPRESS_BELOW} people, so the score isn't shown.</>
        : <>Score <b style={{ color: dsBand(r.score).cs }}>{r.score}</b>, {vsAvgText(r.vsAvg).toLowerCase()}.</>}
    </p>
  );
}

/* ---- Table View -------------------------------------------------------------------------------------------- */
const cellText = { ...dsText("Text xs"), color: ds.text.tertiary, margin: 0 };
const COLS = "repeat(6, minmax(0, 1fr))";

/* "-" when a group's score didn't move (or can't be compared): the grey pill in the design (13622:39853). */
function ChangePill({ d }) {
  if (d == null || d === 0) {
    return <span data-part="trend" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 20, borderRadius: 46, background: ds.bg.secondary, ...dsText("Text 3xs-Trim", 600), fontSize: 11, color: ds.text.tertiary }}>-</span>;
  }
  return <TrendPill delta={d} numberOnly />;
}

function CompositionTable({ blocks }) {
  const { compact } = useStoryWidth();
  const [open, setOpen] = useState(() => ({ [blocks[0]?.key]: true }));
  // On a phone the six columns don't fit, so each group is two lines: name and score, then people · share · against the
  // average, with the change pill. Nothing scrolls sideways.
  return (
    <EvidenceSection style={{ padding: compact ? `${dsSpace[12]}px 0` : dsSpace[16] }}>
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? dsSpace[12] : dsSpace[16], fontFamily: font }}>
        {!compact && <div role="row" data-part="table-head" style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: `0 ${dsSpace[8]}px` }}>
          {["Group", "Employees", "Population", "Score", "Change", "Compared with average"].map((h) => (
            <span key={h} role="columnheader" style={{ ...dsText("Text xs", 500), color: ds.text.tertiary, textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>}
        {blocks.map((b) => {
          const isOpen = !!open[b.key];
          return (
            <div key={b.key} role="rowgroup" data-part="table-group">
              <div data-part="group-band" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: ds.surface.general.cardWithinCard, padding: `${dsSpace[2]}px ${dsSpace[8]}px` }}>
                <span style={{ ...dsText("Text sm", 700), color: ds.text.tertiary, textTransform: "uppercase" }}>{b.label}</span>
                <button
                  onClick={() => setOpen((s) => ({ ...s, [b.key]: !s[b.key] }))} aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} ${b.label}`}
                  style={{ border: "none", background: "transparent", cursor: "pointer", borderRadius: dsRadius.full, padding: `${dsSpace[4]}px ${dsSpace[12]}px`, display: "flex", color: ds.icon.primary }}
                >
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              {isOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: compact ? 0 : dsSpace[16], paddingTop: 0 }}>
                  {compact && b.rows.map((r) => (
                    <div key={r.group} role="row" data-part="table-row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", gap: `${dsSpace[4]}px ${dsSpace[8]}px`, padding: `${dsSpace[12]}px ${dsSpace[8]}px`, borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` }}>
                      <span style={{ ...dsText("Text sm", 700), color: ds.text.secondary, minWidth: 0 }}>{r.group}</span>
                      <span style={{ ...dsText("Text md", 700), color: r.hidden ? ds.text.quaternary : dsBand(r.score).cs, textAlign: "right", fontVariantNumeric: "tabular-nums" }} title={r.hidden ? `Fewer than ${SUPPRESS_BELOW} people, so the score isn't shown` : undefined}>{r.hidden ? "-" : r.score}</span>
                      <span style={{ ...dsText("Text xs"), color: ds.text.tertiary, minWidth: 0 }}>{r.n} {r.n === 1 ? "person" : "people"} · {r.pct}%{vsAvgText(r.vsAvg) ? ` · ${vsAvgText(r.vsAvg)}` : ""}</span>
                      <span style={{ display: "flex", justifyContent: "flex-end" }}><ChangePill d={r.hidden ? null : r.change} /></span>
                    </div>
                  ))}
                  {!compact && b.rows.map((r) => (
                    <div key={r.group} role="row" data-part="table-row" style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: `${dsSpace[16] - dsBorder.sm}px ${dsSpace[8]}px 0`, borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, height: 20, boxSizing: "content-box" }}>
                      <p style={{ ...cellText, fontWeight: 700 }}>{r.group}</p>
                      <p style={cellText}>{r.n}</p>
                      <p style={cellText}>{r.pct}%</p>
                      <p style={{ ...cellText, fontWeight: 700, color: r.hidden ? ds.text.quaternary : dsBand(r.score).cs }} title={r.hidden ? `Fewer than ${SUPPRESS_BELOW} people, so the score isn't shown` : undefined}>{r.hidden ? "-" : r.score}</p>
                      <span style={{ display: "flex" }}><ChangePill d={r.hidden ? null : r.change} /></span>
                      <p style={cellText}>{vsAvgText(r.vsAvg)}</p>
                    </div>
                  ))}
                  {!compact && <div aria-hidden="true" style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}` }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </EvidenceSection>
  );
}
