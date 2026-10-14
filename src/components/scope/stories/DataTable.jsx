import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsBorder } from "../../../lib/ds.js";
import { dsBand } from "../../../lib/ds.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { useStoryWidth } from "./storyWidth.js";

/* ================================================================== */
/* DATA TABLE — Table View for every Story (Figma 13622:36806).          */
/* Same data as the chart, in rows and columns. A hairline above the      */
/* header and under every row (border/tertiary), rows 52px tall, header   */
/* labels in capitals (Text sm / Medium, tertiary), the first column a    */
/* muted label, scores bold in their band colour (Text md / Semibold),    */
/* changes as the Trend Indicator. Grouped rows can be expanded and        */
/* collapsed. `tableText` builds the Copy Table output (tab-separated,    */
/* headings included).                                                    */
/* ================================================================== */
export const ScoreCell = ({ v }) => (v == null ? <span style={{ color: ds.text.quaternary }}>—</span> : <b style={{ ...dsText("Text md", 600), color: dsBand(v).cs }}>{v}</b>);
export const ChangeCell = ({ d, none = "—" }) => (d == null ? <span style={{ color: ds.text.quaternary }}>{none}</span> : d === 0 ? <span style={{ color: ds.text.tertiary }}>0</span> : <TrendPill delta={d} numberOnly />);

const line = `${dsBorder.sm}px solid ${ds.border.tertiary}`;
const th = { ...dsText("Text sm", 500), textTransform: "uppercase", color: ds.text.tertiary, padding: `15px ${dsSpace[8]}px`, borderTop: line, borderBottom: line, whiteSpace: "nowrap", height: 50, boxSizing: "border-box" };
const td = { ...dsText("Text sm", 500), color: ds.text.tertiary, padding: `0 ${dsSpace[8]}px`, borderBottom: line, verticalAlign: "middle", height: 52, boxSizing: "border-box" };

export function tableText(columns, rows) {
  const cell = (c, r) => String(c.text ? c.text(r) : r[c.key] ?? "");
  return [columns.map((c) => c.label).join("\t"), ...rows.map((r) => columns.map((c) => cell(c, r)).join("\t"))].join("\n");
}

/* columns: [{ key, label, align?, render?(row), text?(row) }]
   Either `rows` (flat) or `groups` ([{ label, rows }], collapsible). Without `align`, the first column is left,
   the last right, and the ones between centred (the three-column table in the design). */
export function DataTable({ columns, rows, groups }) {
  const { compact } = useStoryWidth();
  const [closed, setClosed] = useState({});
  const alignOf = (c, i) => c.align || (i === 0 ? "left" : i === columns.length - 1 ? "right" : "center");
  const head = (
    <thead>
      <tr>{columns.map((c, i) => <th key={c.key} style={{ ...th, textAlign: alignOf(c, i), ...(compact ? { whiteSpace: "normal", height: "auto", minHeight: 50 } : null) }}>{c.label}</th>)}</tr>
    </thead>
  );
  const renderRow = (r, i) => (
    <tr key={i} data-part="row">
      {columns.map((c, ci) => <td key={c.key} style={{ ...td, textAlign: alignOf(c, ci) }}>{c.render ? c.render(r) : r[c.key]}</td>)}
    </tr>
  );
  return (
    <div style={{ overflowX: "auto", fontFamily: font }}>
      <table data-part="table" style={{ width: "100%", minWidth: compact ? Math.min(480, columns.length * 84) : 480, borderCollapse: "collapse" }}>
        {head}
        <tbody>
          {groups
            ? groups.map((g) => (
                <GroupRows key={g.label} g={g} cols={columns.length} open={!closed[g.label]} onToggle={() => setClosed((s) => ({ ...s, [g.label]: !s[g.label] }))} renderRow={renderRow} />
              ))
            : rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({ g, cols, open, onToggle, renderRow }) {
  return (
    <>
      <tr>
        <td colSpan={cols} style={{ padding: 0, borderBottom: line, background: ds.surface.general.cardWithinCard }}>
          <button onClick={onToggle} aria-expanded={open} style={{ width: "100%", display: "flex", alignItems: "center", gap: dsSpace[6], border: "none", background: "transparent", cursor: "pointer", padding: `${dsSpace[8]}px ${dsSpace[8]}px`, fontFamily: font, ...dsText("Text 3xs-Header", 700), textTransform: "uppercase", color: ds.text.secondary, textAlign: "left" }}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {g.label}
          </button>
        </td>
      </tr>
      {open && g.rows.map(renderRow)}
    </>
  );
}
