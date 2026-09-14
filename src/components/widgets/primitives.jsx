import { T, font, band, rand } from "../../lib/tokens.js";
import trendCaretUp from "../../assets/trend-caret-up.svg";
import trendCaretDown from "../../assets/trend-caret-down.svg";
import { DIMENSIONS, DIMENSION_DRIVERS, dimensionValue, driverValue } from "../../lib/dataset.js";

/* ================================================================== */
/* SHARED WIDGET PRIMITIVES                                            */
/* Small presentational building blocks used by both WidgetBody        */
/* (library-sourced) and GeneratedBody (chat-generated).                */
/*                                                                      */
/* Corrected against the real widget reference (984qJvMt7fCHASYHRwgrab, */
/* node 12618:37890) — see CLAUDE.md for the full list of deltas this   */
/* fixed (two-tone trend pill, banded driver-row tiers, axis-labeled    */
/* charts, flat status icon instead of a hand-drawn ring, etc).         */
/* ================================================================== */

/* `estimated` renders a small, deliberately understated dot after the
   title — the only visual difference between a widget backed by real
   survey data and one that fell back to a plausible placeholder number
   (e.g. asking about a topic, like Diversity, nothing in the dataset
   scores). Never text, never a color/urgency cue — just enough for anyone
   who looks closely to notice and hover; nothing that reads as "broken"
   or "wrong" for what's otherwise a perfectly normal-looking widget. */
export function Header({ title, estimated }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 13, gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.11px", textTransform: "uppercase", color: T.gray200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </span>
      {estimated && (
        <span title="Estimated — no close survey data for this topic yet" style={{ width: 5, height: 5, borderRadius: "50%", background: T.gray200, flexShrink: 0, cursor: "help" }} />
      )}
    </div>
  );
}

/* Three display modes, all confirmed against real Figma instances:
   default = caret + colored number + "since last round" (2x2 forms);
   numberOnly = caret + colored number, no trailing text (per-row trends,
   e.g. DriverRow, SH.DRV-SUM); compact = caret only (1x1 forms). */
export function TrendPill({ delta, positive, compact, numberOnly }) {
  const pos = positive ?? delta > 0;
  const c = pos ? T.green : T.red;
  const cs = pos ? T.greenStrong : T.redStrong;
  const bg = pos ? T.greenBg : T.redBg;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, borderRadius: 46, padding: "6px 8px", fontSize: 11, whiteSpace: "nowrap" }}>
      <img src={pos ? trendCaretUp : trendCaretDown} width={8} height={8} alt="" />
      {!compact && delta !== undefined && (
        <>
          <span style={{ fontWeight: 600, color: cs }}>{delta > 0 ? "+" : ""}{delta}</span>
          {!numberOnly && <span style={{ fontWeight: 400, color: c }}> since last round</span>}
        </>
      )}
    </span>
  );
}

export function BigNumber({ value, unit, size = 64, colorBand }) {
  const b = colorBand ? band(value) : null;
  return (
    <span style={{ fontSize: size, fontWeight: 700, letterSpacing: -size * 0.02, color: b ? b.cs : T.gray800, lineHeight: 1 }}>
      {value}
      {unit && <span style={{ fontSize: 11, fontWeight: 400, color: T.gray900, marginLeft: 4 }}>{unit}</span>}
    </span>
  );
}

export function EvidenceSegmentBar({ flourishing, striving, struggling }) {
  const total = flourishing + striving + struggling || 1;
  const fw = (flourishing / total) * 100;
  const sw = ((flourishing + striving) / total) * 100;
  return (
    <div style={{ height: 8, borderRadius: 6, background: T.red, position: "relative", width: "100%" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${sw}%`, background: T.amber, borderRadius: "6px 0 0 6px" }} />
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${fw}%`, background: T.green, borderRadius: "6px 0 0 6px" }} />
    </div>
  );
}

/* Inline (not <img>) so its stroke can be recolored per status/tier — the
   downloaded asset (12618:37890) only exported one fixed green copy. */
function PersonIcon({ color, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.999 10.5V9.5C10.999 8.56808 10.3616 7.78503 9.49902 7.56301M7.74902 1.64538C8.48198 1.94207 8.99902 2.66066 8.99902 3.5C8.99902 4.33934 8.48198 5.05793 7.74902 5.35462M8.49902 10.5C8.49902 9.56812 8.49902 9.10218 8.34678 8.73463C8.14379 8.24458 7.75445 7.85523 7.26439 7.65224C6.89685 7.5 6.43091 7.5 5.49902 7.5H3.99902C3.06714 7.5 2.6012 7.5 2.23366 7.65224C1.7436 7.85523 1.35425 8.24458 1.15126 8.73463C0.999023 9.10218 0.999023 9.56812 0.999023 10.5M6.74902 3.5C6.74902 4.60457 5.85359 5.5 4.74902 5.5C3.64445 5.5 2.74902 4.60457 2.74902 3.5C2.74902 2.39543 3.64445 1.5 4.74902 1.5C5.85359 1.5 6.74902 2.39543 6.74902 3.5Z" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Two-person glyph — the real Org/Team Status breakdown (SH.PERF-STS 2x2)
   exports a distinct "users" icon per status, not a recolored single-person
   shape; this hand-drawn approximation swaps the silhouette count to match
   until the real per-status assets are downloaded (same known compromise as
   PersonIcon/StatusFaceIcon above — see CLAUDE.md). */
const PERSON_PATH = "M10.999 10.5V9.5C10.999 8.56808 10.3616 7.78503 9.49902 7.56301M7.74902 1.64538C8.48198 1.94207 8.99902 2.66066 8.99902 3.5C8.99902 4.33934 8.48198 5.05793 7.74902 5.35462M8.49902 10.5C8.49902 9.56812 8.49902 9.10218 8.34678 8.73463C8.14379 8.24458 7.75445 7.85523 7.26439 7.65224C6.89685 7.5 6.43091 7.5 5.49902 7.5H3.99902C3.06714 7.5 2.6012 7.5 2.23366 7.65224C1.7436 7.85523 1.35425 8.24458 1.15126 8.73463C0.999023 9.10218 0.999023 9.56812 0.999023 10.5M6.74902 3.5C6.74902 4.60457 5.85359 5.5 4.74902 5.5C3.64445 5.5 2.74902 4.60457 2.74902 3.5C2.74902 2.39543 3.64445 1.5 4.74902 1.5C5.85359 1.5 6.74902 2.39543 6.74902 3.5Z";
function UsersIcon({ color, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(-1.5, 0) scale(0.72)"><path d={PERSON_PATH} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g transform="translate(5, 0) scale(0.72)"><path d={PERSON_PATH} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>
    </svg>
  );
}

/* Label row on top, value+icon row below (icon after the number) — the
   reverse of an earlier version, corrected against the real SH.PERF-STS 2x2
   breakdown, which also uses a two-person "users" glyph, not a lone figure. */
export function StatusBreakdown({ flourishing, striving, struggling }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      {[["Flourishing", flourishing, T.greenStrong], ["Striving", striving, T.amberStrong], ["Struggling", struggling, T.redStrong]].map(([label, val, c]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: T.gray500 }}>{label}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 16, fontWeight: 700, color: c }}>{val}<UsersIcon color={c} /></span>
        </div>
      ))}
    </div>
  );
}

/* Tier is derived from value via the same banding as BigNumber's colorBand
   (>=70 great/green, >=40 average/amber, else poor/red) — not a boolean
   flag — so a row's color always agrees with its number. */
export function driverTier(val) {
  if (val >= 70) return "great";
  if (val >= 40) return "average";
  return "poor";
}

const TIER_LABEL = { great: "Great", average: "Average", poor: "Poor" };
const TIER_COLOR = { great: T.green, average: T.amber, poor: T.red };

export function DriverGroupLabel({ tier }) {
  return <span style={{ fontSize: 13, fontWeight: 700, color: TIER_COLOR[tier] }}>{TIER_LABEL[tier]}</span>;
}

export function DriverRow({ name, val, trend }) {
  const b = band(val);
  return (
    <div style={{ borderLeft: `2px solid ${b.c}`, paddingLeft: 6, display: "flex", justifyContent: "space-between", alignItems: "center", height: 20, gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{name}</span>
      {trend !== undefined && <TrendPill delta={trend} numberOnly />}
      <span style={{ fontSize: 16, fontWeight: 700, color: b.cs, flexShrink: 0 }}>{val}</span>
    </div>
  );
}

/* Groups rows [name, val, trend?] into Great/Average/Poor sections with a
   tier header, matching the real Explorers widget rather than a flat list. */
export function DriverGroupedList({ rows }) {
  const groups = { great: [], average: [], poor: [] };
  rows.forEach((r) => groups[driverTier(r[1])].push(r));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "hidden" }}>
      {["great", "average", "poor"].map((tier) =>
        groups[tier].length > 0 && (
          <div key={tier} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <DriverGroupLabel tier={tier} />
            {groups[tier].map(([name, val, trend]) => <DriverRow key={name} name={name} val={val} trend={trend} />)}
          </div>
        )
      )}
    </div>
  );
}

/* Bars rounded on the right edge only, sitting on a left axis line, with a
   0/100 axis row below — no full track fill (matches the real design; our
   earlier version filled the whole track and rounded both edges). */
export function MiniBarChart({ rows, colors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {rows.map(([label, pct], i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: T.gray500, width: 46, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          <div style={{ flex: 1, height: 8, position: "relative", borderLeft: `1px solid ${T.gray100}` }}>
            <div style={{ height: 8, width: `${pct}%`, background: colors[i % colors.length], borderRadius: "0 12px 12px 0" }} />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: T.gray300, paddingLeft: 52 }}>
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}

/* Y-axis (100/50/0) gridlines + labels, X-axis labels below, and only the
   last two points marked (not every point) — matches the real Score
   History widget rather than a bare unlabeled line. */
export function Sparkline({ points, xLabels, w = 130, h = 46 }) {
  const max = 100;
  const gutter = 16;
  const chartW = w - gutter;
  const step = chartW / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${gutter + i * step} ${h - (p / max) * h}`).join(" ");
  const gridY = [0, 20, 40, 60, 80, 100];
  return (
    <div style={{ width: "100%" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {gridY.map((g) => (
          <line key={g} x1={gutter} y1={h - (g / max) * h} x2={w} y2={h - (g / max) * h} stroke={T.gray75} strokeWidth="1" />
        ))}
        {gridY.map((g) => (
          <text key={g} x="0" y={h - (g / max) * h + 3} fontSize="8" fill={T.gray300}>{g}</text>
        ))}
        <path d={path} fill="none" stroke={T.accent} strokeWidth="2" />
        {points.map((p, i) => i >= points.length - 2 && (
          <circle key={i} cx={gutter + i * step} cy={h - (p / max) * h} r="3" fill={T.accent} />
        ))}
      </svg>
      {xLabels && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.gray300, paddingLeft: gutter }}>
          {xLabels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

export function Treemap({ tiles }) {
  const colors = [T.personalBlue, T.amberOrange, T.lavender];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", height: "100%" }}>
      <div style={{ background: colors[0], borderRadius: 8, padding: 6, color: T.white, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{tiles[0][0]}</span>
        <span style={{ fontSize: 20, fontWeight: 700 }}>{tiles[0][1]}</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {tiles.slice(1).map((t, i) => (
          <div key={i} style={{ flex: 1, background: colors[i + 1], borderRadius: 8, padding: 6, color: T.white }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{t[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Recolored copy of the real Org Status icon (12618:37890, exported fixed
   amber for "Striving") — the circle+smile shape is generic, so the fill is
   parameterized per status rather than assuming separate per-status exports
   exist (unconfirmed — see CLAUDE.md). */
function StatusFaceIcon({ color, size = 51 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.5 51C39.5833 51 51 39.5833 51 25.5C51 11.4167 39.5833 0 25.5 0C11.4167 0 0 11.4167 0 25.5C0 39.5833 11.4167 51 25.5 51Z" fill={color} />
      <path d="M36.8385 33.916C36.4966 33.916 36.152 34.038 35.8789 34.2898C33.0374 36.8901 29.3528 38.3215 25.4987 38.3215C21.6472 38.3215 17.96 36.8901 15.1184 34.2924C14.5379 33.7623 13.6393 33.802 13.1092 34.3825C12.579 34.9631 12.6188 35.8617 13.1993 36.3918C16.5657 39.4719 20.9341 41.1684 25.4987 41.1684C30.0659 41.1684 34.4343 39.4719 37.8007 36.3918C38.3812 35.8617 38.421 34.9604 37.8908 34.3825C37.6099 34.0751 37.2255 33.9213 36.8411 33.9213L36.8385 33.916Z" fill="white" />
    </svg>
  );
}

/* Flat status icon, not a hand-drawn ring/donut (confirmed against
   12618:37890) — true for the 1x1/compact forms used here. The 2x2
   SH.PERF-STS form does have a decorative concentric-ring illustration
   behind the icon (confirmed against 12635:69176); that's a large, purely
   decorative background asset this component doesn't attempt to reproduce. */
export function StatusRing({ status }) {
  const c = status === "Flourishing" ? T.green : status === "Striving" ? T.amber : T.red;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <StatusFaceIcon color={c} />
      <span style={{ fontSize: 20, fontWeight: 700, color: c }}>{status}</span>
    </div>
  );
}

export function ScatterMini({ topicA, topicB, r }) {
  const pts = Array.from({ length: 12 }).map(() => {
    const x = rand(10, 95);
    const noise = rand(-20, 20);
    const y = Math.max(5, Math.min(95, r < 0 ? 100 - x + noise : x + noise));
    return [x, y];
  });
  const w = 150, h = 90;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1="0" y1={h} x2={w} y2={h} stroke={T.gray100} strokeWidth="1" />
        <line x1="0" y1="0" x2="0" y2={h} stroke={T.gray100} strokeWidth="1" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={(x / 100) * w} cy={h - (y / 100) * h} r="3.5" fill={r < 0 ? T.red : T.green} opacity="0.75" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.gray300 }}>
        <span>{topicA}</span>
        <span>{topicB} →</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* INDEX WIDGET — center score + a ring of dimension ("Explorer") wedges, */
/* with an optional second ring subdividing each dimension into its own   */
/* driver wedges for the 3x3 form.                                        */
/*                                                                        */
/* Built against the real "Index Widget" nodes (12637:71238/71336,        */
/* 984qJvMt7fCHASYHRwgrab) for rendering conventions (annular-sector      */
/* wedges, pale-bg + strong-stroke banding, center score styling, radial  */
/* label placement) — but NOT against that node's exact hierarchy. The    */
/* single sampled instance turned out to be a per-dimension drill-down    */
/* ("Corporate Culture INDEX": one dimension's score at center, its own   */
/* drivers as the ring) rather than the org-wide overview described       */
/* verbally when this was commissioned (main score at center, all 12      */
/* dimensions as the ring, drivers-within-dimension one level deeper for  */
/* 3x3). This build follows the verbal spec, not the single sampled       */
/* instance, because: (a) it's what was explicitly asked for, (b) it's    */
/* fully buildable from real dimension+driver aggregates with zero        */
/* fabricated data (unlike the sampled instance's own 3x3, whose second   */
/* ring needs individual-survey-item scores this dataset doesn't have —   */
/* see docs/figma-widget-audit-new.md), and (c) a per-dimension version   */
/* is a straightforward variant of this same component later if wanted.   */
/* ================================================================== */

/* angle 0 = 12 o'clock, positive = clockwise. */
function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/* SVG path for one annular sector (a ring "wedge") between rInner/rOuter,
   spanning startAngle..endAngle degrees. Figma's own export flattened each
   wedge into a separate cropped image per instance — this computes the
   path directly instead, so it works for any dimension/driver count. */
function describeArc(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const outerStart = polar(cx, cy, rOuter, startAngle);
  const outerEnd = polar(cx, cy, rOuter, endAngle);
  const innerStart = polar(cx, cy, rInner, endAngle);
  const innerEnd = polar(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

/* A small ellipsis-truncating label placed via <foreignObject> (not raw SVG
   <text>, which has no native wrap/ellipsis) — matches Figma's own
   fixed-width truncating box (e.g. "Outcome Focus" -> "Outcome"). Anchor
   branches on which half of the circle the angle falls in, so labels grow
   away from the ring instead of colliding with it. */
function RingLabel({ cx, cy, angle, radius, width, height = 14, align, color, size, weight, children }) {
  const p = polar(cx, cy, radius, angle);
  const x = align === "end" ? p.x - width : align === "middle" ? p.x - width / 2 : p.x;
  return (
    <foreignObject x={x} y={p.y - height / 2} width={width} height={height} style={{ overflow: "visible" }}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          fontFamily: font, fontSize: size, fontWeight: weight, color,
          textAlign: align === "end" ? "right" : align === "middle" ? "center" : "left",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: `${height}px`,
        }}
      >
        {children}
      </div>
    </foreignObject>
  );
}

function Wedge({ cx, cy, rInner, rOuter, start, end, value, showNameLabel, name, labelWidth }) {
  const b = band(value);
  const mid = (start + end) / 2;
  const isRight = Math.sin((mid * Math.PI) / 180) >= 0;
  const valuePos = polar(cx, cy, (rInner + rOuter) / 2, mid);
  return (
    <>
      <path d={describeArc(cx, cy, rInner, rOuter, start, end)} fill={b.bg} stroke={b.c} strokeWidth={1.5} />
      <foreignObject x={valuePos.x - 18} y={valuePos.y - 8} width={36} height={16} style={{ overflow: "visible" }}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: b.cs, textAlign: "center", lineHeight: "16px" }}>
          {Math.round(value)}
        </div>
      </foreignObject>
      {showNameLabel && (
        <RingLabel cx={cx} cy={cy} angle={mid} radius={rOuter + 10} width={labelWidth} align={isRight ? "start" : "end"} color={T.gray900} size={labelWidth > 44 ? 8 : 10} weight={400}>
          {name}
        </RingLabel>
      )}
    </>
  );
}

/* variant: "2x2" (dimension ring only) or "3x3" (adds a driver ring, each
   driver wedge subdividing its parent dimension's exact angular span). */
export function IndexRing({ variant = "2x2", overall }) {
  const is3x3 = variant === "3x3";
  const box = is3x3 ? 467 : 287;
  const cx = box / 2, cy = box / 2;
  const centerR = is3x3 ? 54 : 47;
  const dimRInner = centerR + 4;
  const dimROuter = is3x3 ? dimRInner + 38 : dimRInner + 38;
  const drvRInner = dimROuter + 4;
  const drvROuter = drvRInner + 46;
  const n = DIMENSIONS.length;
  const step = 360 / n;
  const gap = 2.5;
  const ob = band(overall);

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minWidth: 0, minHeight: 0 }}>
      {/* Square, capped at `box`, but shrinks to fit a smaller host (e.g. the
          Detail Modal's fixed-width preview column) without overflowing —
          the canvas widget card is always exactly `box`-sized already, so
          this is a no-op there. */}
      <div style={{ width: "100%", maxWidth: box, aspectRatio: "1 / 1" }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${box} ${box}`} style={{ display: "block" }}>
          {DIMENSIONS.map((dim, i) => {
          const dimStart = i * step, dimEnd = (i + 1) * step;
          const value = dimensionValue(dim);
          const drivers = DIMENSION_DRIVERS[dim] || [];
          return (
            <g key={dim}>
              <Wedge
                cx={cx} cy={cy} rInner={dimRInner} rOuter={dimROuter}
                start={dimStart + gap / 2} end={dimEnd - gap / 2}
                value={value}
                showNameLabel={!is3x3}
                name={dim}
                labelWidth={44}
              />
              {is3x3 && drivers.length > 0 && (() => {
                const driverStep = (dimEnd - dimStart) / drivers.length;
                const driverGap = drivers.length > 1 ? 1.5 : 0;
                return drivers.map((drv, j) => {
                  const dStart = dimStart + j * driverStep;
                  const dEnd = dimStart + (j + 1) * driverStep;
                  return (
                    <Wedge
                      key={drv}
                      cx={cx} cy={cy} rInner={drvRInner} rOuter={drvROuter}
                      start={dStart + driverGap / 2} end={dEnd - driverGap / 2}
                      value={driverValue(drv)}
                      showNameLabel
                      name={drv}
                      labelWidth={40}
                    />
                  );
                });
              })()}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={centerR} fill={T.white} />
        <foreignObject x={cx - centerR} y={cy - centerR} width={centerR * 2} height={centerR * 2} style={{ overflow: "visible" }}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: font, fontSize: is3x3 ? 40 : 36, fontWeight: 700, letterSpacing: (is3x3 ? -40 : -36) * 0.02, color: ob.cs, lineHeight: 1 }}>
              {Math.round(overall)}
            </span>
          </div>
        </foreignObject>
        </svg>
      </div>
    </div>
  );
}

/* ================================================================== */
/* GAUGE — radial single-value dial for chat-generated widgets. A 270°  */
/* arc (90° gap at the bottom) reused from the Index Widget's arc math   */
/* above (polar()) — a single stroked arc rather than annular sectors,   */
/* since there's only one value to show, not per-segment data.           */
/* ================================================================== */
function arcPath(cx, cy, r, startAngle, endAngle) {
  const s = polar(cx, cy, r, startAngle);
  const e = polar(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export function Gauge({ value, size = 148 }) {
  const b = band(value);
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 16;
  const start = -135, end = 135;
  const sweep = start + ((end - start) * Math.max(0, Math.min(100, value))) / 100;
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={arcPath(cx, cy, r, start, end)} fill="none" stroke={T.gray75} strokeWidth={12} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, start, sweep)} fill="none" stroke={b.c} strokeWidth={12} strokeLinecap="round" />
        <foreignObject x={cx - 60} y={cy - 24} width={120} height={48} style={{ overflow: "visible" }}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <span style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: b.cs, letterSpacing: -0.64, lineHeight: 1 }}>{Math.round(value)}</span>
            <span style={{ fontFamily: font, fontSize: 10, color: T.gray400, marginTop: 3 }}>/ 100</span>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}

/* ================================================================== */
/* RADAR CHART — spider/polygon chart for comparing several drivers at   */
/* once. Built for the "form a bespoke dimension" case: whatever cluster */
/* of real drivers the topic resolver assembled (lib/topicResolver.js)   */
/* renders here as one shape, so the *shape itself* becomes the insight  */
/* (a dent on one spoke = the one driver dragging the group down) rather */
/* than requiring a reader to scan a list of numbers.                    */
/* ================================================================== */
export function RadarChart({ items, size = 260 }) {
  const n = items.length;
  const cx = size / 2, cy = size / 2 - 4;
  const rOuter = size / 2 - 54;
  const angleStep = 360 / n;
  const rings = [25, 50, 75, 100];

  const pointFor = (i, value) => polar(cx, cy, (Math.max(0, Math.min(100, value)) / 100) * rOuter, i * angleStep);

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={items.map((_, i) => { const p = pointFor(i, ring); return `${p.x},${p.y}`; }).join(" ")}
            fill="none"
            stroke={T.gray75}
            strokeWidth={1}
          />
        ))}
        {items.map((it, i) => {
          const p = polar(cx, cy, rOuter, i * angleStep);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={T.gray75} strokeWidth={1} />;
        })}
        <polygon
          points={items.map((it, i) => { const p = pointFor(i, it.value); return `${p.x},${p.y}`; }).join(" ")}
          fill={T.accentBg2}
          fillOpacity={0.65}
          stroke={T.accent}
          strokeWidth={2}
        />
        {items.map((it, i) => {
          const p = pointFor(i, it.value);
          const b = band(it.value);
          return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={b.c} stroke={T.white} strokeWidth={1.5} />;
        })}
        {items.map((it, i) => {
          const angle = i * angleStep;
          const sin = Math.sin((angle * Math.PI) / 180);
          const align = sin > 0.2 ? "start" : sin < -0.2 ? "end" : "middle";
          return (
            <RingLabel key={i} cx={cx} cy={cy} angle={angle} radius={rOuter + 14} width={68} align={align} color={T.gray900} size={10} weight={600}>
              {it.label}
            </RingLabel>
          );
        })}
      </svg>
    </div>
  );
}
