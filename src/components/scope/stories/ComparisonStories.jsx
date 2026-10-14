import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronsUpDown, Target } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsSpace, dsRadius, dsShadow, dsBorder } from "../../../lib/ds.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { StoryCard, EvidenceSection, noteText } from "./StoryCard.jsx";
import { ViewSwitch, CopyTable } from "./controls.jsx";
import { DataTable, tableText } from "./DataTable.jsx";
import { useStoryWidth, useElementWidth, useOwnWidth } from "./storyWidth.js";
import ScopeRadar from "../ScopeRadar.jsx";
import { NumberBadge, NumberedList } from "./compactParts.jsx";

/* ================================================================== */
/* COMPARISON STORIES — the same insight across compatible people,      */
/* teams and the organisation (Figma 13622:39086).                      */
/* Boundary (from the frame): every comparison uses the same measure,   */
/* calculation, period and a compatible scope; privacy rules apply.     */
/*                                                                      */
/* The legend is the control. Each entity (You, the teams you're part    */
/* of, the Org) is a card with its score and a toggle in its series      */
/* colour; switching a toggle shows or hides that series in the chart.   */
/* Read off the frames: cards are card-within-card (#F9F8F7), 1px        */
/* border/secondary, radius/lg, 16px padding; the name Text sm /         */
/* Semibold, the score Text md / Bold in its status colour; a team card  */
/* is 88px with the team's System Tag under its name; "TEAM(S) YOU'RE    */
/* PART OF" heads the team cards (Text xs / Semibold, text/tertiary).   */
/* Forms:                                                                */
/*   ComparisonRadar   radar + legend beside it (13622:39405) or below   */
/*                     it (13622:39236)                                  */
/*   ComparisonArea    one area per series over every part, with Sort on */
/*                     / Sort by / Clear and a hover tooltip (13622:39305)*/
/*   HealthAgeComparison  each entity's Health Age as a younger/older    */
/*                     bar from the actual-age line (13622:39125)        */
/*   ComparisonLegend  the legend alone, vertical (13622:39472) or        */
/*                     horizontal (13622:39087)                          */
/* entities: [{ id, kind: "you"|"team"|"org", label, tag?, score?,        */
/*            values?: number[] per part, age?: { value, gap } }]         */
/* ================================================================== */
/* Series colours. You is Purple and the Org Orange Coral, as in the frames (the Org toggle is Orange Coral 600, a
   primitive the design system doesn't expose semantically, so it is named here). Teams aren't shown switched on in any
   frame; they take Team Blue, then Mint Green, Lavender Violet. */
export const ORG_SERIES = "#FD531B";
const TEAM_COLORS = [ds.graph.teamBlue, ds.graph.mintGreen, ds.graph.lavenderViolet];
export function seriesColor(entities) {
  let t = 0;
  return Object.fromEntries(entities.map((e) => [e.id, e.kind === "you" ? ds.graph.purple : e.kind === "org" ? ORG_SERIES : TEAM_COLORS[t++ % TEAM_COLORS.length]]));
}
/* Which series start on: You and the Org (as every frame shows), teams off. With no You there is nothing to compare the
   Org against, so the first team starts on instead. */
const startOn = (entities) => {
  const firstTeam = entities.some((e) => e.kind === "you") ? null : entities.find((e) => e.kind === "team")?.id;
  return Object.fromEntries(entities.map((e) => [e.id, e.kind !== "team" || e.id === firstTeam]));
};

/* ---- the legend --------------------------------------------------------------------------------------------------- */
const legendCard = { background: ds.surface.general.cardWithinCard, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.lg, boxSizing: "border-box", fontFamily: font };

function Toggle({ on, color, onChange, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onChange} data-part="series-toggle"
      style={{ width: 36, height: 20, flexShrink: 0, borderRadius: dsRadius.full, border: "none", padding: dsSpace[2], cursor: "pointer", background: on ? color : ds.bg.secondary, display: "flex", alignItems: "center", transition: "background 150ms ease" }}>
      <motion.span animate={{ x: on ? 16 : 0 }} transition={{ type: "spring", bounce: 0, duration: 0.25 }} style={{ width: 16, height: 16, borderRadius: "50%", background: ds.surface.general.card, display: "block" }} />
    </button>
  );
}
function SystemTag({ children }) {
  return <span data-part="system-tag" style={{ display: "inline-flex", alignSelf: "flex-start", maxWidth: "100%", background: ds.bg.primary, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.full, height: 20, alignItems: "center", padding: `0 ${dsSpace[8]}px`, ...dsText("Text 2xs"), color: ds.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", boxSizing: "border-box" }}>{children}</span>;
}
/* The value shown on a card: a score in its status colour, or (Health Age) a pill of the age with a caret. */
function CardValue({ e }) {
  if (e.age) return <AgePill years={e.age.value} younger={e.age.gap < 0} />;
  return <span data-part="series-score" style={{ ...dsText("Text md", 700), color: dsBand(e.score).cs, minWidth: 30, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.score}</span>;
}
function EntityCard({ e, on, color, onToggle, toggle = true }) {
  const team = e.kind === "team";
  return (
    // The name and the score + toggle share the first line; a team's tag runs the full width under both (in the design
    // it is wider than the name's column and sits under the score too).
    <div data-part="series-card" style={{ ...legendCard, padding: dsSpace[16] - dsBorder.sm, minHeight: team ? 88 : undefined, display: "flex", flexDirection: "column", justifyContent: "center", gap: dsSpace[16] }}>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], height: 20 }}>{/* 20px like the name; the 24px score overhangs, as in the design */}
        <span data-part="series-name" style={{ flex: 1, minWidth: 0, ...dsText("Text sm", 600), color: ds.text.primary }}>{e.label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8], flexShrink: 0 }}>
          <CardValue e={e} />
          {toggle && <Toggle on={on} color={color} onChange={onToggle} label={`Show ${e.label}`} />}
        </div>
      </div>
      {team && e.tag && <SystemTag>{e.tag}</SystemTag>}
    </div>
  );
}
function TeamsHeader() {
  return <div data-part="teams-header" style={{ ...legendCard, padding: `${dsSpace[8]}px ${dsSpace[16]}px`, textAlign: "center", ...dsText("Text xs", 600), color: ds.text.tertiary, textTransform: "uppercase" }}>Team(s) you're part of</div>;
}

/* `layout`: "vertical" (one column, 16px between You, the teams and the Org) or "horizontal" (three columns). */
export function ComparisonLegend({ entities, on, setOn, colors, layout = "vertical", toggle = true }) {
  const { compact } = useStoryWidth();
  const you = entities.filter((e) => e.kind === "you"), teams = entities.filter((e) => e.kind === "team"), org = entities.filter((e) => e.kind === "org");
  const card = (e) => <EntityCard key={e.id} e={e} on={on[e.id]} color={colors[e.id]} onToggle={() => setOn((s) => ({ ...s, [e.id]: !s[e.id] }))} toggle={toggle} />;
  const horizontal = layout === "horizontal" && !compact;
  const col = (children) => <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], minWidth: 0 }}>{children}</div>;
  return (
    <div data-part="comparison-legend" style={horizontal ? { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: dsSpace[16], alignItems: "start" } : { display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
      {you.length > 0 && col(you.map(card))}
      {teams.length > 0 && col([<TeamsHeader key="h" />, ...teams.map(card)])}
      {org.length > 0 && col(org.map(card))}
    </div>
  );
}

/* ---- Radar ---------------------------------------------------------------------------------------------------------- */
/* parts: the spoke names; each entity carries `values` (one per part). Drawn by the Breakdown radar (ScopeRadar) with one
   series per shown entity, so it keeps names while they fit, switches to numbered marks + a key past that (always from 20
   spokes), and taps on a phone. `legend`: "side" (only when the card has room for a 460px radar beside the 247px legend)
   or "below". */
const SIDE_MIN = 460 + 16 + 247 + 2;
export function ComparisonRadar({ title = "How You Compare", line, parts, entities, legend = "side" }) {
  const [cardRef, { width }] = useOwnWidth();
  const [view, setView] = useState("chart");
  const [on, setOn] = useState(() => startOn(entities));
  const colors = useMemo(() => seriesColor(entities), [entities]);
  const side = legend === "side" && width - 34 >= SIDE_MIN;
  const shown = entities.filter((e) => on[e.id]);
  const columns = [{ key: "part", label: "" }, ...entities.map((e) => ({ key: e.id, label: e.label, align: "right", render: (r) => <b style={{ color: dsBand(r[e.id]).cs }}>{r[e.id]}</b> }))];
  const rows = parts.map((p, i) => ({ part: p, ...Object.fromEntries(entities.map((e) => [e.id, e.values[i]])) }));
  const series = shown.map((e) => ({ id: e.id, label: e.kind === "team" && e.tag ? `${e.label} · ${e.tag}` : e.label, color: colors[e.id], values: e.values }));
  const items = parts.map((p, i) => ({ label: p, value: shown[0] ? shown[0].values[i] : 0 }));
  return (
    <div ref={cardRef}>
    <StoryCard title={title} line={line} data-story="comparison-radar" controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
      <EvidenceSection style={{ padding: `${dsSpace[16]}px 0` }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
          <div style={{ display: "flex", flexDirection: side ? "row" : "column", gap: dsSpace[16], alignItems: side ? "flex-start" : "stretch" }}>
            <div data-part="radar-slot" style={{ flex: side ? "1 1 0" : "1 1 auto", minWidth: 0 }}>
              <ScopeRadar items={items} series={series} />
            </div>
            {!side && <div style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}` }} />}
            <div style={{ flex: side ? "0 0 247px" : "1 1 auto", minWidth: 0 }}>
              <ComparisonLegend entities={entities} on={on} setOn={setOn} colors={colors} layout={side ? "vertical" : "horizontal"} />
            </div>
          </div>
        )}
      </EvidenceSection>
    </StoryCard>
    </div>
  );
}

/* ---- Area --------------------------------------------------------------------------------------------------------- */
const smooth = (pts) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
};
export function ComparisonArea({ title = "How You Compare", line, parts, entities }) {
  const [cardRef, { compact }] = useOwnWidth();
  const [view, setView] = useState("chart");
  const [on, setOn] = useState(() => startOn(entities));
  const [hover, setHover] = useState(null);
  const [sortOn, setSortOn] = useState(null);   // an entity id, or null for the survey's order
  const [sortDir, setSortDir] = useState("desc");
  const [menu, setMenu] = useState(null);
  const colors = useMemo(() => seriesColor(entities), [entities]);
  const shown = entities.filter((e) => on[e.id]);
  const order = useMemo(() => {
    const idx = parts.map((_, i) => i);
    const ref = entities.find((e) => e.id === sortOn);
    return ref ? idx.sort((a, b) => (sortDir === "desc" ? ref.values[b] - ref.values[a] : ref.values[a] - ref.values[b])) : idx;
  }, [parts, entities, sortOn, sortDir]);
  const n = parts.length, H = compact ? 200 : 280, VW = 1000;
  const x = (k) => ((k + 0.5) / n) * VW;
  const y = (v) => (1 - Math.max(0, Math.min(100, v)) / 100) * H;
  const columns = [{ key: "part", label: "" }, ...entities.map((e) => ({ key: e.id, label: e.label, align: "right", render: (r) => <b style={{ color: dsBand(r[e.id]).cs }}>{r[e.id]}</b> }))];
  const rows = order.map((i) => ({ part: parts[i], ...Object.fromEntries(entities.map((e) => [e.id, e.values[i]])) }));
  const h = hover != null ? order[hover] : null;
  // Rotated names need about 26px a part; under that (or on a compact card) every part gets a numbered mark and the key
  // below lists the names with each series' score. On a compact card the detail opens under the chart, not as a tooltip.
  const plotRef = useRef(null);
  const plotW = useElementWidth(plotRef, 700);
  const numbered = compact || plotW / n < 26;
  const labelH = Math.min(130, Math.round(Math.max(...parts.map((p) => p.length)) * 6.4 * 0.87) + 12);
  const pick = (k) => setHover((cur) => (cur === k ? null : k));
  const ctl = { display: "inline-flex", alignItems: "center", gap: dsSpace[8], border: "none", background: "transparent", cursor: "pointer", borderRadius: dsRadius.full, padding: `${dsSpace[8]}px ${dsSpace[16]}px`, ...dsText("Text sm"), fontFamily: font, color: ds.text.secondary };
  return (
    <div ref={cardRef}>
    <StoryCard title={title} line={line} data-story="comparison-area" controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
      <EvidenceSection style={{ padding: `${dsSpace[16]}px 0`, gap: dsSpace[16] }}>
        {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], fontFamily: font }}>
            <div data-part="area-controls" style={{ display: "flex", justifyContent: compact ? "flex-start" : "flex-end", gap: compact ? dsSpace[4] : dsSpace[20], flexWrap: "wrap", position: "relative" }}>
              <button style={ctl} onClick={() => { setSortOn(null); setSortDir("desc"); setMenu(null); }}>Clear</button>
              <span style={{ position: "relative" }}>
                <button style={ctl} onClick={() => setMenu(menu === "on" ? null : "on")} aria-expanded={menu === "on"}><Target size={20} />{sortOn ? entities.find((e) => e.id === sortOn).label : "Sort on"}<ChevronDown size={20} /></button>
                {menu === "on" && <Menu side={compact ? "left" : "right"} items={entities.map((e) => [e.id, e.label])} value={sortOn} onPick={(v) => { setSortOn(v); setMenu(null); }} />}
              </span>
              <span style={{ position: "relative" }}>
                <button style={ctl} onClick={() => setMenu(menu === "by" ? null : "by")} aria-expanded={menu === "by"}><ChevronsUpDown size={20} />{sortOn ? (sortDir === "desc" ? "Highest first" : "Lowest first") : "Sort by"}<ChevronDown size={20} /></button>
                {menu === "by" && <Menu side={compact ? "left" : "right"} items={[["desc", "Highest first"], ["asc", "Lowest first"]]} value={sortDir} onPick={(v) => { setSortDir(v); if (!sortOn) setSortOn(entities[0].id); setMenu(null); }} />}
              </span>
            </div>
            <div style={{ display: "flex", gap: dsSpace[16], alignItems: "flex-start" }}>
              <div aria-hidden="true" style={{ width: 22, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "right", ...dsText("Text 2xs"), lineHeight: 1, color: ds.text.tertiary, flexShrink: 0 }}>{[100, 80, 60, 40, 20, 0].map((t) => <span key={t}>{t}</span>)}</div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
                <div ref={plotRef} data-part="area-plot" onPointerMove={(e) => { if (e.pointerType !== "mouse") return; const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width) * n)))); }} onPointerDown={(e) => { if (e.pointerType === "mouse") return; const r = e.currentTarget.getBoundingClientRect(); pick(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width) * n)))); }} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
                  style={{ position: "relative", height: H, touchAction: "pan-y", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.xs, overflow: "hidden", boxSizing: "border-box" }}>
                  <svg viewBox={`0 0 ${VW} ${H}`} preserveAspectRatio="none" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
                    {shown.map((e) => {
                      const pts = [[0, y(e.values[order[0]])], ...order.map((i, k) => [x(k), y(e.values[i])]), [VW, y(e.values[order[n - 1]])]];
                      const d = smooth(pts);
                      return (
                        <g key={e.id}>
                          <path d={`${d} L${VW},${H} L0,${H} Z`} fill={colors[e.id]} fillOpacity="0.14" />
                          <path data-part="series" d={d} fill="none" stroke={colors[e.id]} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        </g>
                      );
                    })}
                    {hover != null && <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke={ds.border.primary} strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />}
                  </svg>
                  {hover != null && shown.map((e) => <span key={e.id} style={{ position: "absolute", left: `${((hover + 0.5) / n) * 100}%`, top: y(e.values[h]), width: 16, height: 16, margin: "-8px 0 0 -8px", borderRadius: "50%", boxSizing: "border-box", border: `2px solid ${colors[e.id]}`, background: ds.surface.general.card, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[e.id] }} /></span>)}
                  {hover != null && shown.length > 0 && !compact && (
                    <div data-part="area-tip" style={{ position: "absolute", top: 12, [hover < n / 2 ? "left" : "right"]: hover < n / 2 ? `min(calc(${((hover + 0.5) / n) * 100}% + 16px), calc(100% - ${Math.min(240, plotW - 16)}px - 8px))` : `min(calc(${(1 - (hover + 0.5) / n) * 100}% + 16px), calc(100% - ${Math.min(240, plotW - 16)}px - 8px))`, width: Math.min(240, plotW - 16), boxSizing: "border-box", pointerEvents: "none", zIndex: 2, background: ds.surface.general.tooltip, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, boxShadow: dsShadow("sm"), display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
                      <span style={{ ...dsText("Text xs", 600), color: ds.text.tertiary, textTransform: "uppercase" }}>{parts[h]}</span>
                      {shown.map((e) => (
                        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: dsSpace[12], borderLeft: `2px solid ${dsBand(e.values[h]).c}`, padding: `${dsSpace[2]}px 0 ${dsSpace[2]}px ${dsSpace[6]}px` }}>
                          <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[2] }}>
                            <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{e.kind === "team" ? "Team Score" : e.label}</span>
                            {e.tag && <span style={{ alignSelf: "flex-start", maxWidth: "100%", border: `${dsBorder.sm}px solid ${ds.border.primary}`, borderRadius: dsRadius.full, padding: `${dsSpace[2]}px ${dsSpace[6]}px`, ...dsText("Text 3xs"), color: ds.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.tag}</span>}
                          </span>
                          {e.deltas && <TrendPill delta={e.deltas[h]} numberOnly />}
                          <span style={{ ...dsText("Text md", 700), color: dsBand(e.values[h]).cs }}>{e.values[h]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {numbered ? (
                  <div data-part="area-marks" aria-hidden="true" style={{ display: "flex" }}>
                    {order.map((i, k) => <span key={i} onPointerEnter={(e) => e.pointerType === "mouse" && setHover(k)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)} onPointerDown={(e) => e.pointerType !== "mouse" && pick(k)} style={{ flex: "1 1 0", minWidth: 0, display: "flex", justifyContent: "center", cursor: "pointer" }}><NumberBadge n={k + 1} active={hover === k} size={n > 16 ? 16 : 20} /></span>)}
                  </div>
                ) : (
                  <div data-part="area-labels" style={{ display: "flex", height: labelH }}>
                    {order.map((i, k) => (
                      <span key={i} onPointerEnter={() => setHover(k)} onPointerLeave={() => setHover(null)} style={{ flex: "1 1 0", minWidth: 0, position: "relative", cursor: "default" }}>
                        <span style={{ position: "absolute", right: "50%", top: 4, transform: "rotate(-60deg)", transformOrigin: "right center", whiteSpace: "nowrap", ...dsText("Text xs", hover === k ? 600 : 500), color: hover === k ? ds.text.primary : ds.text.quaternary, textDecoration: hover === k ? "underline" : "none" }}>{parts[i]}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {view === "chart" && compact && h != null && shown.length > 0 && (
          <div data-part="detail" role="status" style={{ background: ds.surface.general.tooltip, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, display: "flex", flexDirection: "column", gap: dsSpace[8], fontFamily: font }}>
            <span style={{ ...dsText("Text xs", 600), color: ds.text.tertiary, textTransform: "uppercase" }}>{parts[h]}</span>
            {shown.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: dsSpace[8], borderLeft: `2px solid ${colors[e.id]}`, padding: `${dsSpace[2]}px 0 ${dsSpace[2]}px ${dsSpace[6]}px` }}>
                <span style={{ flex: 1, minWidth: 0, ...dsText("Text xs", 600), color: ds.text.primary }}>{e.kind === "team" && e.tag ? `${e.label} · ${e.tag}` : e.label}</span>
                <span style={{ ...dsText("Text md", 700), color: dsBand(e.values[h]).cs }}>{e.values[h]}</span>
              </div>
            ))}
          </div>
        )}
        {view === "chart" && numbered && <NumberedList rows={order.map((i) => ({ label: parts[i], value: shown[0] ? shown[0].values[i] : 0, series: shown.map((e) => ({ color: colors[e.id], value: e.values[i] })) }))} active={hover} onPick={setHover} hoverable onHover={setHover} />}
        {view === "chart" && <div style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, paddingTop: dsSpace[16] }}><ComparisonLegend entities={entities} on={on} setOn={setOn} colors={colors} layout="horizontal" /></div>}
      </EvidenceSection>
    </StoryCard>
    </div>
  );
}
function Menu({ items, value, onPick, side = "right" }) {
  return (
    <div role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", [side]: 0, zIndex: 5, minWidth: 180, background: ds.surface.general.popover, borderRadius: dsRadius.lg, padding: dsSpace[8], boxShadow: dsShadow("md"), display: "flex", flexDirection: "column", gap: dsSpace[2] }}>
      {items.map(([id, label]) => <button key={id} role="menuitemradio" aria-checked={value === id} onClick={() => onPick(id)} style={{ textAlign: "left", border: "none", cursor: "pointer", borderRadius: dsRadius.md, padding: `${dsSpace[6]}px ${dsSpace[8]}px`, background: value === id ? ds.bg.primary : "transparent", ...dsText("Text xs", value === id ? 600 : 400), fontFamily: font, color: ds.text.primary }}>{label}</button>)}
    </div>
  );
}

/* ---- Health Age comparison ------------------------------------------------------------------------------------------ */
/* Each entity: age: { value (health age in years), gap (health age minus actual age; negative = younger) }.
   The bar runs from the centre line (actual age): younger to the left in the success colour, older to the right in the
   error colour, scaled so `span` years fill half the track. */
const fmtYears = (y) => { const a = Math.abs(y), yrs = Math.floor(a), mo = Math.round((a - yrs) * 12); return { yrs: mo === 12 ? yrs + 1 : yrs, mo: mo === 12 ? 0 : mo }; };
function YearsText({ years, strong }) {
  const { yrs, mo } = fmtYears(years);
  return <><b style={{ fontWeight: 600 }}>{yrs}</b> yrs <b style={{ fontWeight: 600 }}>{mo}</b> mo{strong}</>;
}
function AgePill({ years, younger }) {
  const tone = younger ? ds.status.success : ds.status.error;
  return (
    <span data-part="age-pill" style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], background: tone.bg, borderRadius: 46, padding: `0 ${dsSpace[8]}px`, height: 20, ...dsText("Text 2xs"), lineHeight: 1, color: tone.textStrong || tone.text, whiteSpace: "nowrap" }}>
      <span><YearsText years={years} /></span>
      <span aria-hidden="true" style={{ fontSize: 8 }}>{younger ? "▲" : "▼"}</span>
    </span>
  );
}
function AgeBar({ gap, span = 10 }) {
  const younger = gap < 0;
  const w = Math.min(50, (Math.abs(gap) / span) * 50);
  const tone = younger ? ds.status.success : ds.status.error;
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: dsSpace[8], fontFamily: font }}>
      <div aria-hidden="true" style={{ display: "flex", gap: dsSpace[40], ...dsText("Text xs"), color: ds.text.tertiary }}><span style={{ width: 60, textAlign: "right" }}>YOUNGER</span><span style={{ width: 60 }}>OLDER</span></div>
      <div data-part="age-track" role="img" aria-label={`${fmtYears(gap).yrs} years ${fmtYears(gap).mo} months ${younger ? "younger" : "older"} than actual age`} style={{ position: "relative", width: "100%", height: 8, borderRadius: 8, background: ds.bg.quaternary }}>
        <div data-part="age-fill" style={{ position: "absolute", top: 0, bottom: 0, [younger ? "right" : "left"]: "50%", width: `${w}%`, background: tone.icon }} />
        <div style={{ position: "absolute", left: "50%", top: -6, height: 20, borderLeft: `${dsBorder.sm}px solid ${ds.text.tertiary}` }} />
      </div>
      <span style={{ ...dsText("Text 2xs"), lineHeight: 1, padding: `${dsSpace[6]}px ${dsSpace[8]}px`, color: tone.textStrong || tone.text }}><YearsText years={gap} strong={<> <b style={{ fontWeight: 600 }}>{younger ? "younger" : "older"}</b> than actual age</>} /></span>
    </div>
  );
}
export function HealthAgeComparison({ title = "Health Age Compared", line, entities, span = 10 }) {
  const [cardRef, { compact }] = useOwnWidth();
  const [view, setView] = useState("chart");
  const columns = [{ key: "label", label: "" }, { key: "age", label: "Health Age", align: "right", text: (r) => r.age.value.toFixed(1), render: (r) => <AgePill years={r.age.value} younger={r.age.gap < 0} /> }, { key: "gap", label: "Against actual age", align: "right", text: (r) => r.age.gap.toFixed(1), render: (r) => `${r.age.gap < 0 ? "" : "+"}${r.age.gap.toFixed(1)} yrs` }];
  const groups = [entities.filter((e) => e.kind === "you"), entities.filter((e) => e.kind === "team"), entities.filter((e) => e.kind === "org")].filter((g) => g.length);
  const row = (e) => (
    <div key={e.id} data-part="age-row" style={{ display: "flex", gap: dsSpace[16], alignItems: "center", flexDirection: compact ? "column" : "row" }}>
      <div style={{ width: compact ? "100%" : 247, flexShrink: 0, alignSelf: "stretch" }}><EntityCard e={e} toggle={false} /></div>
      <AgeBar gap={e.age.gap} span={span} />
    </div>
  );
  return (
    <div ref={cardRef}>
    <StoryCard title={title} line={line} data-story="comparison-age" controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, entities)} />]}>
      {view === "table" ? <DataTable columns={columns} rows={entities} /> : groups.map((g, gi) => (
        <div key={gi} style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, paddingTop: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[8], ...(gi === groups.length - 1 ? { borderBottom: "none" } : null) }}>
          {g[0].kind === "team" && <div style={{ width: compact ? "100%" : 247 }}><TeamsHeader /></div>}
          {g.map(row)}
        </div>
      ))}
      {view === "chart" && <p style={noteText}>The line in the middle is actual age. Each bar shows how far Health Age sits from it.</p>}
    </StoryCard>
    </div>
  );
}
