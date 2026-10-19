import { Fragment, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ChevronDown, ChevronsRight, ChevronsLeft, Crosshair, Check } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace, dsShadow, dsBand } from "../../../lib/ds.js";
import { DIMENSIONS, LATEST } from "../../../lib/dataset.js";
import { HEAT_GROUPINGS, groupingLabel, heatRows, subRows, DRIVERS_OF, heatStep, HEAT_STEPS } from "../../../lib/heatMap.js";
import { UsersIcon } from "../../widgets/primitives.jsx";
import { useChartTip } from "../../widgets/ChartTip.jsx";
import { useElementWidth } from "../stories/storyWidth.js";
import { useFullScope } from "./fullScope.js";
import { usePopover, Popover, SearchField, FilterButton, FilterPanel, FieldLabel, SelectPill } from "./FullParts.jsx";

/* ================================================================== */
/* HEAT MAP — a full-view Scope (Figma 15299:41715; filters 15298:19603; */
/* flow 15299:47644). Groups of people down the side, the overall score   */
/* and the 12 Explorers across, every tile the group's real mean in the   */
/* design system's heat colours (utility/Heat Map).                       */
/*   - The first header cell picks the way of grouping (Standouts by        */
/*     default: the eight groups furthest from the organisation).          */
/*   - Hover an Explorer's header for "Expand Area" (») to open its Drivers  */
/*     in place under a spanning label; « collapses it. A Driver header      */
/*     explains what it is.                                                 */
/*   - A row's chevron splits it by a second way of grouping (lib/heatMap); */
/*     name (or any of its tiles) opens that group's own Scope.             */
/*   - Search (rows), Filter: Demographic (= the grouping), Area (which      */
/*     Explorers show), Score range (tiles outside it go blank).            */
/* Groups under 5 people are never shown, at any level.                     */
/* ================================================================== */
const HEAD_H = 60, ROW_H = 54;
const heatFill = (v) => ds.utility.heatMap[HEAT_STEPS[heatStep(v)][1]];
const heatInk = (v) => (v < 40 || v >= 95 ? ds.text.inverse : ds.text.primary);
const ORG = Math.round(LATEST.avgOverall);

export default function HeatMapScope() {
  const { toolsEl, openGroup } = useFullScope();
  // Narrow (a phone, a small pane): slimmer sticky columns, search in the body, Filter as an icon.
  const rootRef = useRef(null);
  const narrow = useElementWidth(rootRef, 1200) < 640;
  const nameHeadRef = useRef(null);
  const NAME_W = narrow ? 148 : 251, SCORE_W = narrow ? 52 : 62, NAME_MAX = narrow ? 148 : 320, EXP_W = narrow ? [72, 72] : [88, 112], DRV_W = narrow ? [60, 60] : [72, 88];
  const [grouping, setGrouping] = useState("standouts");
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState(DIMENSIONS);          // Explorers shown (Filter › Area)
  const [range, setRange] = useState([0, 100]);              // Filter › Score Range
  const [open, setOpen] = useState(() => new Set());         // Explorers opened into their Drivers
  const [split, setSplit] = useState(() => new Set());       // rows opened into their sub-groups
  const filterPop = usePopover({ placement: "bottom-end" });

  const { rows, hiddenCount } = useMemo(() => heatRows(grouping), [grouping]);
  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((r) => r.label.toLowerCase().includes(q) || groupingLabel(r.axis || "").toLowerCase().includes(q)) : rows;
  const dims = DIMENSIONS.filter((d) => areas.includes(d));
  // Column plan: [{ kind: "dim"|"driver", dim, key, label }]
  const cols = dims.flatMap((d) => (open.has(d) ? [{ kind: "dim", dim: d, key: d, label: d, opened: true }, ...DRIVERS_OF[d].map((k) => ({ kind: "driver", dim: d, key: k, label: k }))] : [{ kind: "dim", dim: d, key: d, label: d }]));
  // Explorer and Driver columns stay narrow and equal (names wrap onto two or three lines, as in the design: 112px at most).
  // Spare width fills the name column up to 320px, the Explorers up to 112, Drivers up to 88; past that it stays empty.
  const colW = (c) => (c.kind === "driver" || c.opened ? DRV_W : EXP_W);
  const template = `minmax(${NAME_W}px, ${NAME_MAX}px) ${SCORE_W}px ${cols.map((c) => `minmax(${colW(c)[0]}px, ${colW(c)[1]}px)`).join(" ")}`;
  const tableMinW = NAME_W + SCORE_W + cols.reduce((a, c) => a + colW(c)[0], 0);
  const nameW = useElementWidth(nameHeadRef, NAME_W); // the name column grows, so the score column sticks where it ends
  const filtersOn = (grouping !== "standouts" ? 1 : 0) + (areas.length !== DIMENSIONS.length ? 1 : 0) + (range[0] > 0 || range[1] < 100 ? 1 : 0);
  const toggle = (set, setter, key) => setter(() => { const n = new Set(set); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const clearFilters = () => { setGrouping("standouts"); setAreas(DIMENSIONS); setRange([0, 100]); };
  const tip = useChartTip();

  const tools = toolsEl && createPortal(
    <>
      {!narrow && <SearchField value={query} onChange={setQuery} placeholder="Search groups" />}
      <FilterButton pop={filterPop} count={filtersOn} iconOnly={narrow} />
      <Popover pop={filterPop} width={268}>
        <FilterPanel onClose={() => filterPop.setOpen(false)} onClear={clearFilters}>
          <Field label="Demographic"><GroupingSelect value={grouping} onChange={(g) => { setGrouping(g); setSplit(new Set()); }} pill /></Field>
          <Field label="Area"><AreaSelect value={areas} onChange={setAreas} /></Field>
          <Field label="Score Range"><RangeSlider value={range} onChange={setRange} /></Field>
        </FilterPanel>
      </Popover>
    </>,
    toolsEl,
  );

  const cellStyle = { boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 };
  const stickyName = { position: "sticky", left: 0, zIndex: 2 };
  const stickyScore = { position: "sticky", left: nameW, zIndex: 2 };
  const rowLine = `1px solid ${ds.border.tertiary}`;

  const renderRow = (r, sub = false) => (
    <Fragment key={r.id}>
      <div role="rowheader" style={{ ...stickyName, ...cellStyle, justifyContent: "space-between", gap: dsSpace[8], height: ROW_H, padding: `0 ${dsSpace[narrow ? 4 : 12]}px 0 ${sub ? (narrow ? 24 : 40) : narrow ? 12 : 24}px`, background: sub ? ds.bg.primary : ds.surface.general.card, borderBottom: rowLine, borderRight: rowLine }}>
        <button type="button" onClick={() => openGroup(r)} title={`Open ${r.label}'s Scope`} className="hm-name"
          style={{ flex: 1, minWidth: 0, textAlign: "left", border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: font, display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ ...dsText("Text sm", 500), color: ds.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
          {grouping === "standouts" && !sub && r.axis && <span style={{ ...dsText("Text 3xs"), fontSize: 10, color: ds.text.quaternary }}>{groupingLabel(r.axis)}</span>}
        </button>
        {!sub && r.axis && (
          <button type="button" aria-label={`${split.has(r.id) ? "Close" : "Split"} ${r.label}`} title={split.has(r.id) ? "Close" : "Split into smaller groups"} onClick={() => toggle(split, setSplit, r.id)}
            style={{ border: "none", background: "transparent", padding: 4, display: "flex", borderRadius: dsRadius.sm, cursor: "pointer", color: ds.icon.primary }} className="hm-icon">
            <ChevronDown size={16} style={{ transform: split.has(r.id) ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
          </button>
        )}
      </div>
      <div role="cell" style={{ ...stickyScore, ...cellStyle, flexDirection: "column", gap: 2, height: ROW_H, background: sub ? ds.bg.primary : ds.surface.general.card, borderBottom: rowLine, borderRight: rowLine }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, ...dsText("Text md", 700), color: dsBand(r.overall).cs, fontVariantNumeric: "tabular-nums" }}>
          {r.overall}
          {r.delta != null && r.delta !== 0 && <span aria-label={`${r.delta > 0 ? "up" : "down"} ${Math.abs(r.delta)}`} style={{ fontSize: 9, lineHeight: 1, color: r.delta > 0 ? ds.status.success.textIndicator : ds.status.error.text }}>{r.delta > 0 ? "▲" : "▼"}</span>}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, ...dsText("Text 3xs"), fontSize: 11, color: ds.text.tertiary }}><UsersIcon size={11} color={ds.text.tertiary} />{r.n}</span>
      </div>
      {cols.map((c) => {
        const v = c.kind === "driver" ? r.drivers[c.key] : r.dims[c.key];
        const out = v < range[0] || v > range[1];
        const b = tip.bind({ head: r.label, rows: [{ label: c.label, value: v, score: true }], note: `${v === ORG ? "Same as" : `${Math.abs(v - ORG)} ${v > ORG ? "above" : "below"}`} the organisation's overall ${ORG}` });
        return (
          <button key={c.key} type="button" role="cell" onClick={() => openGroup(r)} aria-label={`${r.label}, ${c.label}: ${v}`} className="hm-tile" {...b}
            style={{ ...cellStyle, height: ROW_H, border: "none", borderRight: `1px solid ${ds.surface.general.card}`, borderBottom: `1px solid ${ds.surface.general.card}`, padding: 0, cursor: "pointer", fontFamily: font, background: out ? ds.bg.primary : heatFill(v), color: out ? ds.text.quaternary : heatInk(v), ...dsText("Text sm", 500), fontVariantNumeric: "tabular-nums", opacity: c.kind === "driver" ? 0.97 : 1 }}>
            {v}
          </button>
        );
      })}
    </Fragment>
  );

  return (
    <div ref={rootRef} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", fontFamily: font }}>
      {tools}
      {narrow && <div style={{ padding: `${dsSpace[8]}px ${dsSpace[16]}px` }}><SearchField value={query} onChange={setQuery} placeholder="Search groups" width="100%" /></div>}
      <div className="scroll-minimal" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <div role="table" aria-label="Heat map" style={{ display: "grid", gridTemplateColumns: template, width: "100%", minWidth: tableMinW, borderTop: rowLine }}>
          {/* header row */}
          <div ref={nameHeadRef} role="columnheader" style={{ ...stickyName, top: 0, zIndex: 4, height: HEAD_H, display: "flex", alignItems: "center", padding: `0 ${dsSpace[12]}px 0 ${dsSpace[16]}px`, background: ds.surface.general.card, borderBottom: rowLine, borderRight: rowLine, boxSizing: "border-box" }}>
            <GroupingSelect value={grouping} onChange={(g) => { setGrouping(g); setSplit(new Set()); }} />
          </div>
          <div role="columnheader" style={{ ...stickyScore, top: 0, zIndex: 4, ...cellStyle, height: HEAD_H, padding: "0 4px", textAlign: "center", ...dsText("Text 3xs"), fontSize: 11, lineHeight: "14px", color: ds.text.secondary, background: ds.surface.general.card, borderBottom: rowLine, borderRight: rowLine }}>Overall Score</div>
          {dims.map((d) => (open.has(d) ? <OpenedHeader key={d} dim={d} onClose={() => toggle(open, setOpen, d)} /> : <ExplorerHeader key={d} dim={d} onOpen={() => toggle(open, setOpen, d)} />))}
          {/* rows */}
          {shown.map((r) => (
            <Fragment key={r.id}>
              {renderRow(r)}
              {split.has(r.id) && <SubRows row={r} render={(s) => renderRow(s, true)} span={cols.length + 2} />}
            </Fragment>
          ))}
        </div>
        {shown.length === 0 && (
          <div style={{ padding: `${dsSpace[48]}px ${dsSpace[24]}px`, textAlign: "center", ...dsText("Text sm"), color: ds.text.tertiary }}>
            No groups match “{query}”. <button type="button" onClick={() => setQuery("")} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: font, ...dsText("Text sm", 600), color: ds.text.primary, textDecoration: "underline" }}>Clear search</button>
          </div>
        )}
        <p style={{ margin: 0, padding: `${dsSpace[16]}px ${dsSpace[24]}px ${dsSpace[24]}px`, ...dsText("Text xs"), color: ds.text.tertiary }}>
          {grouping === "standouts" ? `The eight groups furthest from the organisation's overall score of ${ORG}, across every way of grouping. ` : ""}
          Each tile is the group's average this round. Groups with fewer than 5 people are never shown{hiddenCount ? ` (${hiddenCount} hidden here)` : ""}. Select a group to open its Scope.
        </p>
      </div>
      {tip.node}
    </div>
  );
}

/* A row's sub-groups, plus a quiet note for the ones too small to show. */
function SubRows({ row, render, span }) {
  const { rows, hiddenCount, by } = subRows(row);
  return (
    <>
      {rows.map((s) => render(s))}
      <div style={{ gridColumn: `1 / span ${span}`, position: "sticky", left: 0, width: "fit-content", padding: `${dsSpace[8]}px ${dsSpace[12]}px ${dsSpace[8]}px 40px`, ...dsText("Text xs"), color: ds.text.tertiary }}>
        {rows.length ? `${row.label} by ${groupingLabel(by)}.` : `${row.label} is too small to split.`} {hiddenCount ? `${hiddenCount} smaller ${hiddenCount === 1 ? "split has" : "splits have"} fewer than 5 people and ${hiddenCount === 1 ? "isn't" : "aren't"} shown.` : ""}
      </div>
    </>
  );
}

/* An Explorer's header: its name; hover (or focus) shows the » "Expand Area" button on its right edge. */
function ExplorerHeader({ dim, onOpen }) {
  return (
    <div role="columnheader" className="hm-head" style={{ position: "sticky", top: 0, zIndex: 3, height: HEAD_H, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 10px", textAlign: "center", ...dsText("Text 3xs"), fontSize: 11, lineHeight: "14px", color: ds.text.secondary, background: ds.surface.general.card, borderBottom: `1px solid ${ds.border.tertiary}`, borderRight: `1px solid ${ds.border.tertiary}`, boxSizing: "border-box" }}>
      {dim}
      <button type="button" className="hm-expand" onClick={onOpen} aria-label={`Expand ${dim} into its Drivers`} data-tip="Expand Area"><ChevronsRight size={14} /></button>
    </div>
  );
}

/* An opened Explorer: its own narrow column (bold, « collapses), then one column per Driver under a spanning label. */
function OpenedHeader({ dim, onClose }) {
  const drivers = DRIVERS_OF[dim];
  return (
    <>
      <div role="columnheader" className="hm-head" style={{ position: "sticky", top: 0, zIndex: 3, height: HEAD_H, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px", textAlign: "center", ...dsText("Text 3xs", 700), fontSize: 11, lineHeight: "14px", color: ds.text.primary, background: ds.bg.primary, borderBottom: `1px solid ${ds.border.tertiary}`, borderRight: `1px solid ${ds.border.secondary}`, boxSizing: "border-box" }}>
        {dim}
        <button type="button" className="hm-expand is-open" onClick={onClose} aria-label={`Collapse ${dim}`} data-tip="Collapse Area"><ChevronsLeft size={14} /></button>
      </div>
      <motion.div role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
        style={{ gridColumn: `span ${drivers.length}`, display: "grid", gridTemplateColumns: "subgrid", gridTemplateRows: "22px 1fr", position: "sticky", top: 0, zIndex: 3, height: HEAD_H, background: ds.surface.general.card, borderBottom: `1px solid ${ds.border.tertiary}`, boxSizing: "border-box" }}>
        <span style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", ...dsText("Text 3xs"), fontSize: 11, color: ds.text.tertiary, borderBottom: `1px solid ${ds.border.tertiary}` }}>{dim}</span>
        {drivers.map((k, i) => <DriverHeader key={k} name={k} dim={dim} n={drivers.length} last={i === drivers.length - 1} />)}
      </motion.div>
    </>
  );
}

/* A Driver's header: its name; hover explains it. (The survey's question text isn't in the dataset, so the card says
   where the Driver sits and how it's scored rather than quoting a question.) */
function DriverHeader({ name, dim, n, last }) {
  const pop = usePopover({ placement: "top", offsetPx: 6 });
  return (
    <div role="columnheader" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", textAlign: "center", borderRight: `1px solid ${last ? ds.border.secondary : ds.border.tertiary}`, boxSizing: "border-box" }}
      ref={pop.refs.setReference} onMouseEnter={() => pop.setOpen(true)} onMouseLeave={() => pop.setOpen(false)}>
      <span style={{ ...dsText("Text 3xs"), fontSize: 11, lineHeight: "13px", color: ds.text.secondary, textDecoration: pop.open ? "underline" : "none" }}>{name}</span>
      {pop.open && createPortal(
          <div ref={pop.refs.setFloating} style={{ ...pop.floatingStyles, zIndex: 2000, pointerEvents: "none" }}>
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}
              style={{ width: 260, background: ds.surface.general.card, borderRadius: dsRadius.lg, boxShadow: dsShadow("md"), padding: `${dsSpace[12]}px ${dsSpace[16]}px`, fontFamily: font, display: "flex", flexDirection: "column", gap: dsSpace[6] }}>
              <span style={{ ...dsText("Text xs", 600), textTransform: "uppercase", color: ds.text.secondary, letterSpacing: "0.02em" }}>{name}</span>
              <span style={{ ...dsText("Text xs"), color: ds.text.secondary }}>One of the {n} Drivers in {dim}. Each tile is the group's average on the questions tagged to this Driver.</span>
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* The way of grouping. In the table's corner it's the plain "Standouts ⌄" label; in the Filter it's the select pill. */
function GroupingSelect({ value, onChange, pill = false }) {
  const pop = usePopover({ placement: "bottom-start", offsetPx: 6 });
  const label = groupingLabel(value);
  return (
    <>
      {pill ? <SelectPill pop={pop} label={value === "standouts" ? "" : label} placeholder="Select Demographic" /> : (
        <button ref={pop.refs.setReference} type="button" {...pop.getReferenceProps()} aria-label={`Rows: ${label}`}
          style={{ display: "flex", alignItems: "center", gap: dsSpace[8], width: "100%", height: 36, padding: `0 ${dsSpace[12]}px 0 ${dsSpace[8]}px`, border: "none", borderRadius: dsRadius.full, background: pop.open ? ds.button.brand.ghost.bg.active : "transparent", cursor: "pointer", fontFamily: font, ...dsText("Text sm", 600), color: ds.text.primary }} className="fs-ghost">
          <Crosshair size={18} aria-hidden="true" />
          <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
          <ChevronDown size={18} aria-hidden="true" style={{ transform: pop.open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }} />
        </button>
      )}
      <Popover pop={pop} width={220} origin="top left" style={{ padding: dsSpace[4], background: ds.surface.general.card }}>
        <ul role="listbox" aria-label="Group rows by" style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 360, overflowY: "auto" }}>
          {HEAT_GROUPINGS.map((g) => {
            const on = g.id === value;
            return (
              <li key={g.id} role="option" aria-selected={on} aria-disabled={!!g.blocked} title={g.blocked || undefined}
                onClick={() => { if (g.blocked) return; onChange(g.id); pop.setOpen(false); }}
                className={g.blocked ? undefined : "fs-row"}
                style={{ display: "flex", alignItems: "center", gap: dsSpace[8], padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderRadius: dsRadius.md, cursor: g.blocked ? "default" : "pointer", background: on ? ds.interactive.ghostHover : "transparent", ...dsText("Text sm", on ? 600 : 400), color: g.blocked ? ds.text.quaternary : ds.text.primary }}>
                <span style={{ flex: 1 }}>{g.label}</span>
                {g.blocked ? <span style={{ ...dsText("Text 3xs"), fontSize: 10, color: ds.text.quaternary }}>No data</span> : on && <Check size={14} />}
              </li>
            );
          })}
        </ul>
      </Popover>
    </>
  );
}

/* Filter › Area: a checklist of the Explorers ("Select all" / "Clear"); the pill says how many are picked. */
function AreaSelect({ value, onChange }) {
  const pop = usePopover({ placement: "bottom-start", offsetPx: 6 });
  const all = value.length === DIMENSIONS.length;
  const label = all ? "" : value.length === 0 ? "No Areas" : value.length === 1 ? value[0] : `${value.length} Areas Selected`;
  return (
    <>
      <SelectPill pop={pop} label={label} placeholder="Select Area" />
      <Popover pop={pop} width={236} origin="top left">
        <ul style={{ listStyle: "none", margin: 0, padding: dsSpace[4], maxHeight: 260, overflowY: "auto" }}>
          {DIMENSIONS.map((d) => {
            const on = value.includes(d);
            return (
              <li key={d}>
                <label className="fs-row" style={{ display: "flex", alignItems: "center", gap: dsSpace[8], padding: `${dsSpace[6]}px ${dsSpace[8]}px`, borderRadius: dsRadius.md, cursor: "pointer", ...dsText("Text sm"), color: ds.text.primary }}>
                  <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== d) : DIMENSIONS.filter((x) => x === d || value.includes(x)))} style={{ width: 16, height: 16, accentColor: "var(--ds-color-bg-inverse)", margin: 0 }} />
                  {d}
                </label>
              </li>
            );
          })}
        </ul>
        <div style={{ display: "flex", justifyContent: "space-between", padding: `${dsSpace[8]}px ${dsSpace[16]}px`, borderTop: `1px solid ${ds.border.tertiary}` }}>
          <button type="button" onClick={() => onChange(DIMENSIONS)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: font, ...dsText("Text sm"), color: ds.text.secondary }}>Select all</button>
          <button type="button" onClick={() => onChange([])} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: font, ...dsText("Text sm"), color: ds.status.error.text }}>Clear</button>
        </div>
      </Popover>
    </>
  );
}

/* Filter › Score Range: two handles on one 0–100 track, the picked values above, ticks every 20 below. */
function RangeSlider({ value, onChange }) {
  const [lo, hi] = value;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[4] }}>
      <div style={{ display: "flex", justifyContent: "space-between", ...dsText("Text xs", 600), color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}><span>{lo}</span><span>{hi}</span></div>
      <div className="range-dual" style={{ position: "relative", height: 20 }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 8, right: 8, top: 9, height: 2, borderRadius: 1, background: ds.border.secondary }} />
        <span aria-hidden="true" style={{ position: "absolute", left: `calc(8px + (100% - 16px) * ${lo / 100})`, width: `calc((100% - 16px) * ${(hi - lo) / 100})`, top: 9, height: 2, background: ds.text.primary }} />
        <input type="range" min={0} max={100} value={lo} aria-label="Lowest score" onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])} />
        <input type="range" min={0} max={100} value={hi} aria-label="Highest score" onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])} />
      </div>
      <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", ...dsText("Text 3xs"), fontSize: 10, color: ds.text.quaternary, padding: "0 2px" }}>{[0, 20, 40, 60, 80, 100].map((t) => <span key={t}>{t}</span>)}</div>
    </div>
  );
}

const Field = ({ label, children }) => <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}><FieldLabel>{label}</FieldLabel>{children}</div>;
