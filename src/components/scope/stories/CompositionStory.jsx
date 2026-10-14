import { useState } from "react";
import { T, font, radius } from "../../../lib/tokens.js";
import { COMPOSITION_TABS, groupRows, SUPPRESS_BELOW } from "../../../lib/scopeData.js";
import { StoryCard, noteText } from "./StoryCard.jsx";
import { StoryTabs, ViewSwitch, CopyTable } from "./controls.jsx";
import { DataTable, ScoreCell, ChangeCell, tableText } from "./DataTable.jsx";
import { band } from "../../../lib/tokens.js";
import SegmentedControl from "../../ui/SegmentedControl.jsx";
import DonutChart from "./DonutChart.jsx";
import { useStoryStyle } from "./storyStyle.js";

/* ================================================================== */
/* COMPOSITION STORY — "who is represented" (Figma 13622:39606). Tabs    */
/* split the population (People / Organisation / Employment /            */
/* Locations); each tab shows one block per axis. Chart View shows each  */
/* group's share of the population with its score — as a Donut (default,  */
/* hover a slice for who/how many/score) or the original Bars; Table View is the      */
/* Figma table (group, employees, population, score, change, vs average), */
/* grouped and collapsible, with Copy Table.                              */
/* Privacy: a group under SUPPRESS_BELOW people never shows a score.      */
/* ================================================================== */
const vsAvgText = (v) => (v == null ? "—" : v === 0 ? "Same as average" : `${Math.abs(v)}% ${v > 0 ? "above" : "below"} average`);

export default function CompositionStory({ initialTab = "People", title = "Breakdowns", line = "See who is represented in this result and how each group is scoring.", scoreOf }) {
  const refined = useStoryStyle() === "refined";
  const [tab, setTab] = useState(initialTab);
  const [view, setView] = useState("chart");
  const [style, setStyle] = useState("donut");
  const def = COMPOSITION_TABS.find((t) => t.tab === tab);
  const blocks = def.axes.map(([key, label]) => ({ label, rows: groupRows(key, undefined, scoreOf) }));
  const anyHidden = blocks.some((b) => b.rows.some((r) => r.hidden));

  const columns = [
    { key: "group", label: "Group" },
    { key: "n", label: "Employees", align: "right", render: (r) => r.n },
    { key: "pct", label: "Population", align: "right", render: (r) => `${r.pct}%`, text: (r) => `${r.pct}%` },
    { key: "score", label: "Score", align: "right", render: (r) => <ScoreCell v={r.score} />, text: (r) => r.score ?? "Not shown" },
    { key: "change", label: "Change", align: "right", render: (r) => <ChangeCell d={r.change} />, text: (r) => (r.change == null ? "" : r.change > 0 ? `+${r.change}` : r.change) },
    { key: "vsAvg", label: "Compared with average", render: (r) => vsAvgText(r.vsAvg), text: (r) => (r.vsAvg == null ? "Not shown" : vsAvgText(r.vsAvg)) },
  ];
  const flat = () => blocks.flatMap((b) => b.rows.map((r) => ({ ...r, group: `${b.label}: ${r.group}` })));

  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, flat())} />];

  return (
    <StoryCard title={title} controls={controls} line={line}>
      <StoryTabs tabs={COMPOSITION_TABS.map((t) => t.tab)} value={tab} onChange={setTab} />
      {view === "table" ? (
        <DataTable columns={columns} groups={blocks.map((b) => ({ label: b.label, rows: b.rows }))} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: font }}>
          <div><SegmentedControl options={[{ id: "donut", label: "Donut" }, { id: "bars", label: "Bars" }]} value={style} onChange={setStyle} /></div>
          {blocks.map((b, bi) => (
            <div key={b.label} style={refined ? { paddingTop: bi ? 28 : 8, borderTop: bi ? `1px solid ${T.gray75}` : "none", display: "flex", flexDirection: "column", gap: 14 } : { border: `1px solid ${T.gray75}`, borderRadius: radius.lg, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={refined ? { fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px", color: T.gray900 } : { fontSize: 14, fontWeight: 700, color: T.gray900 }}>{b.label}</span>
              {style === "donut" ? <DonutChart rows={b.rows} /> : b.rows.map((r) => (
                <div key={r.group} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 1.2fr) minmax(0, 2fr) 40px", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: T.gray900, minWidth: 0 }}>{r.group}</span>
                  <div title={`${r.n} people · ${r.pct}% of the population`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: refined ? 6 : 8, borderRadius: radius.full, background: T.gray50 }}>
                      <div style={{ width: `${r.pct}%`, height: "100%", borderRadius: radius.full, background: T.teamBlue }} />
                    </div>
                    <span style={{ fontSize: 12, color: T.gray500, minWidth: 62, textAlign: "right" }}>{r.n} · {r.pct}%</span>
                  </div>
                  <span style={{ textAlign: "right", fontSize: 15 }} title={r.hidden ? `Fewer than ${SUPPRESS_BELOW} people — score not shown` : undefined}>
                    {r.hidden ? <span style={{ color: T.gray300 }}>—</span> : <b style={{ color: band(r.score).cs }}>{r.score}</b>}
                  </span>
                </div>
              ))}
            </div>
          ))}
          {anyHidden && <p style={noteText}>— means fewer than {SUPPRESS_BELOW} people are in that group, so its score isn't shown.</p>}
        </div>
      )}
    </StoryCard>
  );
}
