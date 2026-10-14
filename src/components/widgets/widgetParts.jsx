import { Lock, Heart, Building2, User, Users } from "lucide-react";
import { T, font, band } from "../../lib/tokens.js";
import { ds, dsBand } from "../../lib/ds.js";
import { StatusFaceIcon, TrendPill, polar, describeArc } from "./primitives.jsx";
import { statusName } from "../../lib/bands.js";

/* ================================================================== */
/* WIDGET PARTS — the small pieces the Library widgets are built from.  */
/* Everything here was read off the Figma catalogue (984qJvMt7fCHAS…,    */
/* node 12635:69176 "Collated Widgets") rather than invented: the        */
/* status chip, headcount row, severity pills, younger/older scale,      */
/* heat-map table, comparison rows and the per-Explorer index ring.      */
/* WidgetBody.jsx assembles them into the actual forms.                  */
/* ================================================================== */

export const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
export const statusOf = statusName;
export const STATUS_COLOR = { Flourishing: T.green, Striving: T.amber, Struggling: T.red };
const STATUS_STRONG = { Flourishing: T.greenStrong, Striving: T.amberStrong, Struggling: T.redStrong };
const STATUS_BG = { Flourishing: T.greenBg, Striving: T.amberBg, Struggling: T.redBg };
export const TEAM_BLUE = "#0074bc"; // Team's blue in the Figma frames (headcount icons, distribution bars)

export const date11 = { fontSize: 11, color: T.gray900, lineHeight: "14px" };
export const muted11 = { fontSize: 11, color: T.gray500 };

/* ---- chips --------------------------------------------------------- */
export function Pill({ bg, color, children, style }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, color, borderRadius: 46, padding: "4px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", lineHeight: "16px", ...style }}>{children}</span>;
}

/* "Flourishing" with a tiny face — the status chip under a score. */
export function StatusChip({ status }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, alignSelf: "flex-start", background: STATUS_BG[status], borderRadius: 46, padding: "2px 8px 2px 2px", fontSize: 11, fontWeight: 700, color: STATUS_STRONG[status] }}>
      <StatusFaceIcon color={STATUS_COLOR[status]} status={status} size={18} />
      {status}
    </span>
  );
}

/* A change that can be good or bad independently of its direction — "feeling
   low" going UP is bad, so the caret follows the sign and the colour follows
   whether it helps. (TrendPill ties the two together.) */
export function DeltaPill({ delta, good }) {
  const c = good ? T.green : T.red, cs = good ? T.greenStrong : T.redStrong, bg = good ? T.greenBg : T.redBg;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, borderRadius: 46, height: 20, boxSizing: "border-box", lineHeight: "20px", padding: "0 8px", fontSize: 11, whiteSpace: "nowrap" }}>
      <Caret color={c} down={delta < 0} />
      <span style={{ fontWeight: 600, color: cs }}>{delta > 0 ? "+" : ""}{delta}</span>
    </span>
  );
}

const Caret = ({ color, down = true }) => (
  <svg width="8" height="6" viewBox="0 0 8 6" style={{ transform: down ? undefined : "rotate(180deg)", flexShrink: 0 }}><path d="M0 0h8L4 6z" fill={color} /></svg>
);

/* ---- headcount + participation ------------------------------------- */
function UsersGlyph({ color, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <path d="M18.3337 17.5V15.8333C18.3337 14.2801 17.2713 12.9751 15.8337 12.605M12.917 2.7423C14.1386 3.23679 15.0003 4.43443 15.0003 5.83333C15.0003 7.23224 14.1386 8.42988 12.917 8.92437M14.167 17.5C14.167 15.9469 14.167 15.1703 13.9133 14.5577C13.5749 13.741 12.926 13.092 12.1093 12.7537C11.4967 12.5 10.7201 12.5 9.16699 12.5H6.66699C5.11385 12.5 4.33728 12.5 3.72471 12.7537C2.90795 13.092 2.25904 13.741 1.92073 14.5577C1.66699 15.1703 1.66699 15.9469 1.66699 17.5M11.2503 5.83333C11.2503 7.67428 9.75794 9.16667 7.91699 9.16667C6.07604 9.16667 4.58366 7.67428 4.58366 5.83333C4.58366 3.99238 6.07604 2.5 7.91699 2.5C9.75794 2.5 11.2503 3.99238 11.2503 5.83333Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ParticipationGlyph({ color, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="8.25" stroke={T.gray100} strokeWidth="3.5" />
      <path d="M3.29891 2.57727C1.27307 4.4073 0 7.05498 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0V3.47826C13.6019 3.47826 16.5217 6.39814 16.5217 10C16.5217 13.6019 13.6019 16.5217 10 16.5217C6.39814 16.5217 3.47826 13.6019 3.47826 10C3.47826 7.95799 4.41675 6.13517 5.88594 4.93934L3.29891 2.57727Z" fill={color} />
    </svg>
  );
}

/* Headcount + participation. `labelled` (2x2) spells it out — "Team Members
   15 ▾  ◔ Participation Rate 95%"; the 1x1 shows just the icons and numbers. */
export function Headcount({ label, count, rate, tone = T.orgBlue, labelled }) {
  const base = { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.gray900, whiteSpace: "nowrap" };
  return (
    <div style={{ display: "flex", gap: labelled ? 12 : 10, alignItems: "center" }}>
      <span style={base}><UsersGlyph color={tone} />{labelled && label}<b style={{ color: T.gray700 }}>{count}</b><Caret color={tone} /></span>
      <span style={base}><ParticipationGlyph color={tone} />{labelled && "Participation Rate"}<b style={{ color: T.gray700 }}>{rate}%</b></span>
    </div>
  );
}

/* ---- score headline -------------------------------------------------- */
/* The big number with its change and "/100" stacked at its right edge.
   `compact` = caret-only pill (every 1x1); the 2x2s spell "since last round". */
export function ScoreHeadline({ value, delta, size = 64, compact, valueColor }) {
  const b = band(value);
  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <span style={{ fontSize: size, fontWeight: 700, letterSpacing: -size * 0.02, color: valueColor || b.cs, lineHeight: 0.82 }}>{value}</span>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, marginLeft: 4 }}>
        {delta !== undefined && <TrendPill delta={delta} compact={compact} />}
        <span style={{ fontSize: 11, color: T.gray900, lineHeight: "12px" }}>/100</span>
      </div>
    </div>
  );
}

/* "Flourishing 20 · Striving 155 · Struggling 24" — also reused with other
   labels (Promoters / Passives / Detractors). */
export function GroupCounts({ items }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      {items.map(([label, val, c]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={muted11}>{label}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 16, fontWeight: 700, color: c }}>{val}<MiniPeople color={c} /></span>
        </div>
      ))}
    </div>
  );
}
function MiniPeople({ color }) {
  return <Users size={12} color={color} strokeWidth={2.2} />;
}

export function MoreLine({ children }) {
  return <span style={{ fontSize: 11, color: ds.text.tertiary, borderLeft: `2px solid ${ds.border.strong}`, padding: "0 6px", lineHeight: "12px" }}>{children}</span>;
}

/* ---- Mental well-being ---------------------------------------------- */
const SEVERITY = {
  Moderate: { bg: "#ffefc4", c: T.amberStrong },
  Severe: { bg: T.redBg, c: T.redStrong },
  "Extremely Severe": { bg: "#f8c8d1", c: T.redStrong },
};
export function SeverityRow({ label, level, trend }) {
  const s = SEVERITY[level];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ ...muted11, lineHeight: "12px" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ background: s.bg, color: s.c, borderRadius: 46, padding: "1px 10px", fontSize: 11, fontWeight: 700, lineHeight: "16px", whiteSpace: "nowrap" }}>{level}</span>
        {trend && <Caret color={trend === "up" ? T.green : T.red} down={trend !== "up"} />}
      </span>
    </div>
  );
}

/* One share-of-people row: label, optional change, % — with a bar under it in
   the 2x2. Colour is the persona's (Team blue / Org dark blue). */
export function DistributionRow({ label, pct, delta, tone, bar }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: `2px solid ${tone}`, paddingLeft: 6, minHeight: bar ? 20 : 18 }}>
        <span style={{ flex: 1, fontSize: 11, color: T.gray900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {delta !== undefined && delta !== 0 && <DeltaPill delta={delta} good={delta < 0} />}
        <span style={{ fontSize: bar ? 12 : 13, fontWeight: 700, color: tone }}>{pct}%</span>
      </div>
      {bar && (
        <div style={{ height: 8, borderRadius: 6, background: T.gray100, overflow: "hidden" }}>
          <div style={{ height: 8, width: `${Math.min(100, pct)}%`, background: tone, borderRadius: 6 }} />
        </div>
      )}
    </div>
  );
}

export function SupportButton({ tone = T.gray900 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-end", border: `1px solid ${tone}`, borderRadius: 9999, padding: "4px 10px", fontSize: 11, color: tone, background: "transparent", whiteSpace: "nowrap" }}>
      <Heart size={14} fill={tone} color={tone} />Get Support
    </span>
  );
}

/* ---- Health age ------------------------------------------------------- */
/* years/months in the same big-number style as a score: "26 yrs 3 mo". */
export function AgeNumber({ years, months, color, size = 44 }) {
  const unit = { fontSize: 11, fontWeight: 500, marginLeft: 2, marginRight: 4 };
  return (
    <span style={{ fontSize: size, fontWeight: 700, color, letterSpacing: -size * 0.02, lineHeight: 0.9, whiteSpace: "nowrap" }}>
      {years}<span style={unit}>yrs</span>{months}<span style={unit}>mo</span>
    </span>
  );
}

/* Younger ←  ACTUAL AGE  → older. The coloured segment runs from the centre
   tick toward whichever side you are on. */
export function AgeScale({ older }) {
  const c = older ? T.red : T.green;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <div style={{ position: "relative", height: 8, borderRadius: 6, background: T.gray100 }}>
        <div style={{ position: "absolute", top: 0, height: 8, background: c, left: older ? "50%" : "26%", width: older ? "13%" : "24%", borderRadius: 4 }} />
        <div style={{ position: "absolute", left: "50%", top: -4, width: 1, height: 16, background: T.gray300 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.gray500, letterSpacing: 0.2 }}>
        <span>YOUNGER</span><span>ACTUAL AGE</span><span>OLDER</span>
      </div>
    </div>
  );
}

/* ---- Score comparisons ------------------------------------------------ */
export function CompareRow({ label, value, icon, chip, delta, big }) {
  const b = band(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, borderLeft: `2px solid ${b.c}`, paddingLeft: 6, minHeight: 20 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, color: T.gray900, whiteSpace: "nowrap" }}>{label}</span>
        {chip && <span style={{ background: T.gray50, borderRadius: 46, padding: "2px 8px", fontSize: 10, color: T.gray700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{chip}</span>}
        <span style={{ flex: 1 }} />
        {delta !== undefined && <TrendPill delta={delta} numberOnly />}
        <span style={{ fontSize: big ? 18 : 16, fontWeight: 700, color: b.cs }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: T.gray100, overflow: "hidden" }}>
        <div style={{ height: 6, width: `${value}%`, background: b.c, borderRadius: 4 }} />
      </div>
    </div>
  );
}
export const CompareIcons = {
  you: <User size={14} color={T.accent} strokeWidth={2.2} />,
  team: <Users size={14} color={T.amber} strokeWidth={2.2} />,
  org: <Building2 size={14} color={T.orgBlue} strokeWidth={2.2} />,
};

export function LockedBody({ date, text }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.amber }}>Available on</span>
      <span style={{ fontSize: 18, fontWeight: 700, color: "#8a5a0a" }}>{date}</span>
      {text && <span style={{ fontSize: 11, color: T.gray700, lineHeight: "15px", marginTop: 6 }}>{text}</span>}
      <span style={{ marginTop: "auto" }}><Lock size={20} color={T.amber} strokeWidth={2} /></span>
    </div>
  );
}

/* ---- Heat map ---------------------------------------------------------- */
const HEAT = (v) => (v >= 90 ? { bg: "#4fba85", c: "#0b5a33" } : v >= 80 ? { bg: "#9fe3c3", c: "#0b703f" } : v >= 70 ? { bg: "#d4f5e6", c: "#0b703f" } : v >= 40 ? { bg: "#ffe3b8", c: T.amberStrong } : { bg: "#fbd0d7", c: T.redStrong });
/* The design lets the table run past the card edge — "95 | 97 | 9" is cut
   off on purpose, hinting there are more Explorers across. */
export function HeatTable({ rows }) {
  const cell = { width: 30, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, boxSizing: "border-box", border: `1px solid ${T.white}` };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "hidden", flex: 1 }}>
      <div style={{ border: `1px solid ${T.gray75}`, borderRight: "none", overflow: "hidden" }}>
        {rows.map(([dept, vals, overall]) => (
          <div key={dept} style={{ display: "flex", borderBottom: `1px solid ${T.gray75}` }}>
            <span style={{ width: 40, flexShrink: 0, fontSize: 10, lineHeight: "20px", color: T.gray700, padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRight: `1px solid ${T.gray75}` }}>{dept}</span>
            <span style={{ ...cell, color: band(overall).cs, border: "none" }}>{overall}</span>
            {vals.map((v, i) => <span key={i} style={{ ...cell, background: HEAT(v).bg, color: HEAT(v).c }}>{v}</span>)}
          </div>
        ))}
      </div>
      <MoreLine>More</MoreLine>
    </div>
  );
}

/* ---- Popular responses (2x2) ------------------------------------------- */
/* The design's seven-tile treemap, laid out as drawn. The words and counts are
   its own sample values — the survey's free-text answers aren't modelled. */
export function PopularTreemap({ tiles }) {
  const tile = (i, extra) => {
    const [label, n, color] = tiles[i];
    return (
      <div key={i} style={{ background: color, borderRadius: 8, padding: 6, color: T.gray900, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0, overflow: "hidden", boxSizing: "border-box", ...extra }}>
        {label ? <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", lineHeight: "13px" }}>{label}</span> : <span />}
        <span style={{ fontSize: label ? 20 : 16, fontWeight: 700, lineHeight: 1 }}>{n}</span>
      </div>
    );
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
      <div style={{ display: "flex", gap: 4, flex: 141 }}>{tile(0, { flex: 176 })}{tile(1, { flex: 132 })}</div>
      <div style={{ display: "flex", gap: 4, flex: 143 }}>
        {tile(2, { flex: 106 })}{tile(3, { flex: 102 })}
        <div style={{ flex: 100, display: "flex", flexDirection: "column", gap: 4 }}>{tile(4, { flex: 70 })}{tile(5, { flex: 33 })}{tile(6, { flex: 33 })}</div>
      </div>
    </div>
  );
}

/* ---- Score history (2x2) ------------------------------------------------ */
/* Full-width line chart: 0–100 grid every 20, a dot per round, and a dashed
   line at the latest value with its number at the right edge. */
export function HistoryChart({ points, labels, w = 312, h = 150 }) {
  const gutter = 28, top = 6, bottom = 18, px = 14;
  const plotH = h - top - bottom, plotW = w - gutter - px;
  const x = (i) => gutter + px / 2 + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * (plotW - px / 2));
  const y = (v) => top + plotH - (v / 100) * plotH;
  const last = points[points.length - 1];
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      {[0, 20, 40, 60, 80, 100].map((g) => (
        <g key={g}>
          <line x1={gutter} x2={w} y1={y(g)} y2={y(g)} stroke={T.gray75} />
          <text x="0" y={y(g) + 3} fontSize="9" fill={T.gray300}>{g}</text>
        </g>
      ))}
      <line x1={gutter} x2={w} y1={y(last)} y2={y(last)} stroke={band(last).c} strokeOpacity="0.55" strokeDasharray="4 3" />
      <text x={w} y={y(last) - 4} fontSize="9" textAnchor="end" fill={band(last).c} fillOpacity="0.8">{last}</text>
      <path d={points.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p)}`).join(" ")} fill="none" stroke={T.accent} strokeWidth="1.5" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p)} r={i === points.length - 1 ? 4 : 3} fill={T.accent} />)}
      {labels.map((l, i) => <text key={l} x={x(i)} y={h - 3} fontSize="9" textAnchor="middle" fill={T.gray300}>{l}</text>)}
    </svg>
  );
}

/* ---- Focus (Areas to Focus) -------------------------------------------- */
/* Sizes read off Figma 11318:27848: the group name 11/600, its category tag 11/400 on a bg/primary pill, the change
   as a 20px pill, the score 16/700 in the status's strong text colour, and the caption 11/400 under a 2px status
   rule. (It used to be 9px tag and caption text on a 1px outline, which read much smaller than the design.) */
const strongOf = (v) => ds.status[dsBand(v).key].textStrong;
export function FocusRow({ name, value, tag, delta, sub }) {
  const b = dsBand(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, borderLeft: `2px solid ${b.c}`, borderRadius: "0 4px 4px 0", paddingLeft: 6, minHeight: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: ds.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: tag ? "0 1 auto" : 1, minWidth: 0, lineHeight: "16px" }}>{name}</span>
        {tag && <span style={{ background: ds.bg.primary, borderRadius: 9999, padding: "2px 6px", fontSize: 11, lineHeight: "12px", color: ds.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flexShrink: 1 }}>{tag}</span>}
        {tag && <span style={{ flex: 1 }} />}
        {delta !== undefined && delta !== 0 && <TrendPill delta={delta} numberOnly />}
        <span style={{ fontSize: 16, lineHeight: "24px", fontWeight: 700, color: strongOf(value), flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      {sub && <span style={{ fontSize: 11, color: ds.text.tertiary, lineHeight: "12px", borderLeft: `2px solid ${b.c}`, padding: "0 6px" }}>{sub}</span>}
    </div>
  );
}

/* Horizontal bars, one per group, on a 0–100 grid — the "Focus by Group"
   form. Colour is the status band of each group's score. */
export function GroupBars({ rows }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", paddingLeft: 92 }}>
        {[0, 25, 50, 75, 100].map((g) => <span key={g} style={{ position: "absolute", top: 0, bottom: 0, left: `calc(92px + (100% - 92px) * ${g / 100})`, borderLeft: `1px ${g === 0 ? "solid" : "dashed"} ${T.gray75}` }} />)}
        {rows.map(([name, v]) => {
          const b = band(v);
          return (
            <div key={name} style={{ position: "relative", display: "flex", alignItems: "center", height: 16 }}>
              <span style={{ position: "absolute", left: -92, width: 86, textAlign: "right", fontSize: 9, color: T.gray700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              <div style={{ height: 8, width: `${v}%`, background: b.c, borderRadius: "0 8px 8px 0", position: "relative" }}>
                <span style={{ position: "absolute", left: "100%", marginLeft: 4, top: -2, fontSize: 9, fontWeight: 700, color: b.cs }}>{v}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.gray300, paddingLeft: 92 }}>
        <span>0</span><span>50</span><span>100</span>
      </div>
    </div>
  );
}
