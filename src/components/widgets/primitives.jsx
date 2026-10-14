import { Users } from "lucide-react";
import { ds } from "../../lib/ds.js";
import { T, font, band, rand } from "../../lib/tokens.js";
import trendCaretUp from "../../assets/trend-caret-up.svg";
import trendCaretDown from "../../assets/trend-caret-down.svg";
import rippleFlourishing from "../../assets/status-illustrations/flourishing.svg";
import rippleStriving from "../../assets/status-illustrations/striving.svg";
import rippleStruggling from "../../assets/status-illustrations/struggling.svg";
import { FLOURISHING_AT, STRIVING_AT, statusName } from "../../lib/bands.js";

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
    <div style={{ display: "flex", alignItems: "center", minHeight: 13, gap: 5 }}>
      {/* Wraps (not ellipsis) — the design lets a long header such as
          "Physical Health Score" run to a second line in a 1x1. */}
      <span style={{ fontSize: 11, fontWeight: 500, lineHeight: "14px", letterSpacing: "0.11px", textTransform: "uppercase", color: T.gray200 }}>
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
  // No change: a neutral grey pill, not a red "down" one.
  if (delta === 0) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: ds.bg.primary, borderRadius: 46, height: 20, boxSizing: "border-box", lineHeight: "20px", padding: compact ? "0 6px" : "0 8px", fontSize: 11, whiteSpace: "nowrap" }}>
        <span style={{ width: 8, height: 2, background: ds.text.tertiary, borderRadius: 1 }} />
        {!compact && (
          <>
            <span style={{ fontWeight: 600, color: ds.text.secondary }}>0</span>
            {!numberOnly && <span style={{ fontWeight: 400, color: ds.text.tertiary }}> since last round</span>}
          </>
        )}
      </span>
    );
  }
  const pos = positive ?? delta > 0;
  const st = pos ? ds.status.success : ds.status.error;
  const c = st.text, cs = st.textIndicator, bg = st.bg;
  return (
    <span data-part="trend" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, borderRadius: 46, height: 20, boxSizing: "border-box", lineHeight: "20px", padding: compact ? "0 6px" : "0 8px", fontSize: 11, whiteSpace: "nowrap" }}>
      {/* Both exported caret assets point down (Figma flips the "Positive" one in-layout), so up = rotate 180°. */}
      <img src={pos ? trendCaretUp : trendCaretDown} width={8} height={8} alt="" style={pos ? { transform: "rotate(180deg)" } : undefined} />
      {!compact && delta !== undefined && (
        <>
          <span style={{ fontWeight: 600, color: cs }}>{delta > 0 ? "+" : ""}{delta}</span>
          {!numberOnly && <span style={{ fontWeight: 400, color: c }}> since last round</span>}
        </>
      )}
    </span>
  );
}

export function BigNumber({ value, unit, size = 64, colorBand, color }) {
  const b = colorBand ? band(value) : null;
  return (
    <span style={{ fontSize: size, fontWeight: 700, letterSpacing: -size * 0.02, color: b ? b.cs : color || T.gray800, lineHeight: 1 }}>
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
export function PersonIcon({ color, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.999 10.5V9.5C10.999 8.56808 10.3616 7.78503 9.49902 7.56301M7.74902 1.64538C8.48198 1.94207 8.99902 2.66066 8.99902 3.5C8.99902 4.33934 8.48198 5.05793 7.74902 5.35462M8.49902 10.5C8.49902 9.56812 8.49902 9.10218 8.34678 8.73463C8.14379 8.24458 7.75445 7.85523 7.26439 7.65224C6.89685 7.5 6.43091 7.5 5.49902 7.5H3.99902C3.06714 7.5 2.6012 7.5 2.23366 7.65224C1.7436 7.85523 1.35425 8.24458 1.15126 8.73463C0.999023 9.10218 0.999023 9.56812 0.999023 10.5M6.74902 3.5C6.74902 4.60457 5.85359 5.5 4.74902 5.5C3.64445 5.5 2.74902 4.60457 2.74902 3.5C2.74902 2.39543 3.64445 1.5 4.74902 1.5C5.85359 1.5 6.74902 2.39543 6.74902 3.5Z" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Two-person glyph for the status counts (SH.PERF-STS 2x2 shows a "users" icon per status). Drawn with the
   same Lucide "users" glyph the rest of the app uses, at 14px and a 2px stroke so it stays crisp at this size
   (the earlier hand-scaled copy of the single-person path squashed into 12px and read as noise). */
export function UsersIcon({ color, size = 14 }) {
  return <Users size={size} color={color} strokeWidth={2} style={{ flexShrink: 0 }} aria-hidden="true" />;
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
   (Flourishing = great/green, Striving = average/amber, else poor/red; see lib/bands.js) — not a boolean
   flag — so a row's color always agrees with its number. */
export function driverTier(val) {
  if (val >= FLOURISHING_AT) return "great";
  if (val >= STRIVING_AT) return "average";
  return "poor";
}

const TIER_LABEL = { great: "Great", average: "Average", poor: "Poor" };
const TIER_COLOR = { great: T.green, average: T.amber, poor: T.red };

export function DriverGroupLabel({ tier, labels }) {
  return <span style={{ fontSize: 13, fontWeight: 700, color: TIER_COLOR[tier] }}>{(labels || TIER_LABEL)[tier]}</span>;
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
export function DriverGroupedList({ rows, tierLabels }) {
  const groups = { great: [], average: [], poor: [] };
  rows.forEach((r) => groups[driverTier(r[1])].push(r));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "hidden" }}>
      {["great", "average", "poor"].map((tier) =>
        groups[tier].length > 0 && (
          <div key={tier} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <DriverGroupLabel tier={tier} labels={tierLabels} />
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
export function Sparkline({ points, xLabels, w = 130, h = 46, gridY = [0, 20, 40, 60, 80, 100] }) {
  const max = 100;
  const gutter = 16;
  const chartW = w - gutter;
  const step = chartW / (points.length - 1);
  // Keep the top and bottom gridline labels inside the box (they sit on the
  // 100 and 0 lines, which used to be the very edge of the SVG).
  const pad = 5;
  const yOf = (v) => pad + (h - 2 * pad) * (1 - v / max);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${gutter + i * step} ${yOf(p)}`).join(" ");
  return (
    <div style={{ width: "100%" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {gridY.map((g) => (
          <line key={g} x1={gutter} y1={yOf(g)} x2={w} y2={yOf(g)} stroke={T.gray75} strokeWidth="1" />
        ))}
        {gridY.map((g) => (
          <text key={g} x="0" y={yOf(g) + 3} fontSize="8" fill={T.gray300}>{g}</text>
        ))}
        <path d={path} fill="none" stroke={T.accent} strokeWidth="2" />
        {points.map((p, i) => i >= points.length - 2 && (
          <circle key={i} cx={gutter + i * step} cy={yOf(p)} r="3" fill={T.accent} />
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
      <div style={{ background: colors[0], borderRadius: 8, padding: 6, color: T.gray900, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{tiles[0][0]}</span>
        <span style={{ fontSize: 20, fontWeight: 700 }}>{tiles[0][1]}</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {tiles.slice(1).map((t, i) => (
          <div key={i} style={{ flex: 1, background: colors[i + 1], borderRadius: 8, padding: 6, color: T.gray900, display: "flex", alignItems: "flex-end" }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{t[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Money Composition (1x1, node 13465:26549) — four labeled dollar tiles
   (a 2px colored left rule, gray50 fill) over one stacked bar showing each
   tile's share. Colors are the Graph palette, not status colors (this is a
   categorical split). Teal isn't a named token elsewhere, so it's the
   design's own #26a69a. */
const MONEY_TEAL = "#26a69a";
export function MoneyComposition({ items }) {
  const total = items.reduce((n, [, v]) => n + v, 0) || 1;
  const colors = { Productivity: T.personalBlue, Absenteeism: "#0074bc", Retention: MONEY_TEAL, "Injury/Claims": T.lavender };
  const grid = ["Productivity", "Absenteeism", "Retention", "Injury/Claims"].map((k) => items.find(([n]) => n === k));
  let acc = 0;
  const stops = ["Productivity", "Absenteeism", "Retention", "Injury/Claims"].map((k) => { acc += items.find(([n]) => n === k)[1]; return [k, (acc / total) * 100]; });
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "40px 41px", gap: 6, height: 87 }}>
        {grid.map(([name, v]) => (
          <div key={name} style={{ background: T.gray50, borderLeft: `2px solid ${colors[name]}`, paddingLeft: 6, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: T.gray500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1 }}>{name}</span>
            <span style={{ display: "flex", alignItems: "flex-end", fontSize: 11, color: T.gray900, lineHeight: 1 }}>
              $<b style={{ fontSize: 16, fontWeight: 700, color: colors[name], lineHeight: "16px" }}>{v}</b>K
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", height: 8, width: "100%" }}>
        {[...stops].reverse().map(([k, pct], i) => (
          <div key={k} style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${pct}%`, background: colors[k], borderRadius: i === 0 ? 50 : "50px 0 0 50px" }} />
        ))}
      </div>
    </div>
  );
}

/* Recolored copy of the real Org Status icon (12618:37890, exported fixed
   amber for "Striving") — the circle+smile shape is generic, so the fill is
   parameterized per status rather than assuming separate per-status exports
   exist (unconfirmed — see CLAUDE.md). */
/* Face: see FACE_MOUTH below. Full smile = Flourishing, shallow smile = Striving, frown = Struggling (exact supplied assets). */
/* The three status faces, exactly as supplied by the product owner (src/assets/status-faces/*.svg, 51x51).
   The circle takes the status colour (a token); the mouth is white. Paths are verbatim from the supplied files - never
   estimate or transform one face to make another. */
const FACE_MOUTH = {
  Flourishing: "M25.6349 43.7362C23.5032 43.7362 21.4087 43.3809 19.4128 42.681C17.4835 42.0051 15.6848 41.022 14.0673 39.7558C12.4658 38.5055 11.0828 37.0122 9.9556 35.3212C8.80976 33.6008 7.95972 31.7201 7.4321 29.7299C7.23491 28.9926 7.67192 28.2366 8.40738 28.0416C9.14285 27.8439 9.89698 28.282 10.0915 29.0193C10.5445 30.7183 11.2693 32.3239 12.2473 33.7905C13.2092 35.2357 14.3924 36.51 15.7621 37.5785C17.1451 38.6578 18.68 39.4966 20.3268 40.0736C22.0295 40.6694 23.8176 40.9739 25.6403 40.9739C27.463 40.9739 29.251 40.672 30.9538 40.0736C32.6006 39.4966 34.1355 38.6578 35.5185 37.5785C36.8881 36.51 38.0686 35.2357 39.0333 33.7905C40.0112 32.3239 40.736 30.7183 41.189 29.0193C41.3862 28.282 42.1404 27.8466 42.8732 28.0416C43.6086 28.2393 44.043 28.9953 43.8485 29.7299C43.3182 31.7201 42.4681 33.6035 41.3249 35.3212C40.1978 37.0122 38.8148 38.5055 37.2132 39.7558C35.5957 41.0193 33.7944 42.0024 31.8678 42.681C29.8719 43.3809 27.7801 43.7362 25.6456 43.7362H25.6349Z",
  Striving: "M36.8385 33.916C36.4966 33.916 36.152 34.038 35.8789 34.2898C33.0374 36.8901 29.3528 38.3215 25.4987 38.3215C21.6472 38.3215 17.96 36.8901 15.1184 34.2924C14.5379 33.7623 13.6393 33.802 13.1092 34.3825C12.579 34.9631 12.6188 35.8617 13.1993 36.3918C16.5657 39.4719 20.9341 41.1684 25.4987 41.1684C30.0659 41.1684 34.4343 39.4719 37.8007 36.3918C38.3812 35.8617 38.421 34.9604 37.8908 34.3825C37.6099 34.0751 37.2255 33.9213 36.8411 33.9213L36.8385 33.916Z",
  Struggling: "M14.1596 40.4848C14.5015 40.4848 14.8461 40.3629 15.1191 40.1111C17.9607 37.5107 21.6452 36.0793 25.4994 36.0793C29.3509 36.0793 33.0381 37.5107 35.8796 40.1084C36.4601 40.6386 37.3587 40.5988 37.8889 40.0183C38.419 39.4378 38.3793 38.5392 37.7988 38.009C34.4323 34.9289 30.0639 33.2324 25.4994 33.2324C20.9322 33.2324 16.5638 34.9289 13.1974 38.009C12.6168 38.5392 12.5771 39.4404 13.1072 40.0183C13.3882 40.3258 13.7726 40.4795 14.1569 40.4795L14.1596 40.4848Z",
};
export function StatusFaceIcon({ color, size = 51, status = "Flourishing" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", flexShrink: 0 }}>
      <path d="M25.5 51C39.5833 51 51 39.5833 51 25.5C51 11.4167 39.5833 0 25.5 0C11.4167 0 0 11.4167 0 25.5C0 39.5833 11.4167 51 25.5 51Z" fill={color} />
      <path d={FACE_MOUTH[status]} fill="white" />
    </svg>
  );
}

const STATUS_COLOR = { Flourishing: T.green, Striving: T.amber, Struggling: T.red };

/* The status illustration: concentric rings (clean, wobbly, tangled) around the face. These are the exact SVGs from
   the design (status-illustrations/*), including the face, so nothing here is drawn by hand any more. */
const RIPPLE = { Flourishing: rippleFlourishing, Striving: rippleStriving, Struggling: rippleStruggling };
export function StatusRipple({ status, size = 190 }) {
  return <img src={RIPPLE[status] || rippleStruggling} alt="" width={size} height={size} style={{ display: "block", objectFit: "contain" }} />;
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
      <StatusFaceIcon color={c} status={status} />
      <span style={{ fontSize: 20, fontWeight: 700, color: c }}>{status}</span>
    </div>
  );
}

/* One dot per person, on a 0–100 grid. `points` are the real respondents
   ([x, y] pairs). With none (a topic the survey doesn't score) it draws a
   fixed, clearly-illustrative cloud from `r` — seeded, so it never shuffles
   between renders. Dots are small and translucent so the dense middle shows
   as darker, and a sloped fit line makes the direction obvious. */
export function ScatterMini({ topicA, topicB, r, points }) {
  const w = 150, h = 90, pad = 4;
  const real = Array.isArray(points) && points.length > 0;
  let pts = points;
  if (!real) {
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    pts = Array.from({ length: 40 }).map(() => {
      const x = 10 + rnd() * 85;
      const y = Math.max(5, Math.min(95, 50 + (x - 50) * (r || 0) + (rnd() - 0.5) * 40));
      return [x, y];
    });
  }
  const X = (v) => pad + (v / 100) * (w - 2 * pad), Y = (v) => h - pad - (v / 100) * (h - 2 * pad);
  // Least-squares fit line.
  const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
  let num = 0, den = 0;
  pts.forEach(([x, y]) => { num += (x - mx) * (y - my); den += (x - mx) ** 2; });
  const slope = den ? num / den : 0, x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
  const c = r < 0 ? T.red : T.accent;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        {[25, 50, 75].map((g) => <line key={g} x1={pad} x2={w - pad} y1={Y(g)} y2={Y(g)} stroke={T.gray75} strokeWidth="1" />)}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={T.gray100} strokeWidth="1" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke={T.gray100} strokeWidth="1" />
        {pts.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r="2.4" fill={c} fillOpacity={real ? 0.45 : 0.3} stroke={T.white} strokeWidth="0.6" />)}
        <line x1={X(x0)} y1={Y(my + slope * (x0 - mx))} x2={X(x1)} y2={Y(my + slope * (x1 - mx))} stroke={T.gray800} strokeWidth="1.2" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.gray500 }}>
        <span>↑ {topicB}</span>
        <span>{topicA} →</span>
      </div>
      {!real && <span style={{ fontSize: 9, color: T.gray300 }}>Illustrative — no survey data for this pair</span>}
    </div>
  );
}

/* ================================================================== */
/* RING GEOMETRY — shared by the Index widgets (RingIndex.jsx), which     */
/* draw annular-sector wedges around a centre score. `polar` and           */
/* `describeArc` are the arc math; `RingLabel` is the radial label the      */
/* Radar chart still uses.                                                  */
/* ================================================================== */

/* angle 0 = 12 o'clock, positive = clockwise. */
export function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/* SVG path for one annular sector (a ring "wedge") between rInner/rOuter,
   spanning startAngle..endAngle degrees. Figma's own export flattened each
   wedge into a separate cropped image per instance — this computes the
   path directly instead, so it works for any dimension/driver count. */
export function describeArc(cx, cy, rInner, rOuter, startAngle, endAngle) {
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
export function RingLabel({ cx, cy, angle, radius, width, height = 14, align, color, size, weight, children }) {
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

/* A score as a full ring (the same shape the Meaning story uses, so a score looks the same everywhere): the value
   sweeps clockwise from 12 o'clock over a pale track, the number and its status word sit in the middle, and two
   white notches mark where Striving (60) and Flourishing (80) begin. */
export function ScoreDial({ value, size = 104, stroke = 11, numberSize = 26, wordSize = 9 }) {
  const v = Math.max(0, Math.min(100, Math.round(value))), b = band(v), status = statusName(v);
  const cx = size / 2, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const at = (n) => (n / 100) * 360;
  const tick = (n) => { const a = polar(cx, cx, r - stroke / 2 - 0.5, at(n)), e = polar(cx, cx, r + stroke / 2 + 0.5, at(n)); return <line key={n} x1={a.x} y1={a.y} x2={e.x} y2={e.y} stroke="#fff" strokeWidth={Math.max(1.5, stroke / 6)} />; };
  return (
    <div role="img" aria-label={`${v} out of 100, ${status}`} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg aria-hidden="true" width={size} height={size} style={{ display: "block" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={T.gray75} strokeWidth={stroke} />
        {v > 0 && <circle cx={cx} cy={cx} r={r} fill="none" stroke={b.c} strokeWidth={stroke} strokeLinecap="butt" strokeDasharray={`${(v / 100) * c} ${c}`} transform={`rotate(-90 ${cx} ${cx})`} />}
        {[STRIVING_AT, FLOURISHING_AT].map(tick)}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <span style={{ fontSize: numberSize, fontWeight: 700, letterSpacing: -numberSize * 0.02, lineHeight: 1, color: b.cs }}>{v}</span>
        <span style={{ fontSize: wordSize, fontWeight: 600, color: b.cs, marginTop: 3 }}>{status}</span>
      </div>
    </div>
  );
}

export function Gauge({ value, size = 112 }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ScoreDial value={value} size={size} stroke={Math.round(size / 9.5)} numberSize={Math.round(size / 4)} wordSize={Math.max(9, Math.round(size / 11))} />
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
/* Drawn like the Radar story (Scope): five circular rings at 20 to 100, a spoke per part that runs a little past the
   outer ring, a grey node where each spoke meets it, and the orange series polygon through the real values. Names sit
   beyond the spoke ends, wrapped to two lines, 11px. (This used to be a polygon grid with band-coloured dots, which read
   as a different chart from the Story's.) */
const RADAR_SERIES = "#EB5421"; // the design's series colour; not a design-system colour (see ScopeRadar.jsx)
function wrapLabel(label, max = 12) {
  const lines = []; let cur = "";
  label.split(" ").forEach((w) => { if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); });
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}
export function RadarChart({ items, size = 286 }) {
  const n = items.length;
  const W = 312, H = size;
  const cx = W / 2, cy = H / 2;
  const R = 78;
  const step = 360 / n;
  const grey = ds.border.secondary;
  const at = (i, v) => polar(cx, cy, (Math.max(0, Math.min(100, v)) / 100) * R, i * step);
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Radar of ${n} parts: ${items.map((it) => `${it.label} ${it.value}`).join(", ")}`} style={{ display: "block", overflow: "visible" }}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((f) => <circle key={f} cx={cx} cy={cy} r={R * f} fill="none" stroke={grey} strokeWidth="0.75" />)}
        {items.map((_, i) => { const p = polar(cx, cy, R + 8, i * step); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={grey} strokeWidth="0.75" />; })}
        <polygon points={items.map((it, i) => { const p = at(i, it.value); return `${p.x},${p.y}`; }).join(" ")} fill={RADAR_SERIES} fillOpacity="0.08" stroke={RADAR_SERIES} strokeWidth="2" strokeLinejoin="round" />
        {items.map((it, i) => { const p = at(i, it.value); return <circle key={`v${i}`} cx={p.x} cy={p.y} r="3" fill={RADAR_SERIES} stroke="#fff" strokeWidth="1.2"><title>{`${it.label}: ${it.value}`}</title></circle>; })}
        {items.map((_, i) => { const p = polar(cx, cy, R, i * step); return <circle key={`n${i}`} cx={p.x} cy={p.y} r="2.5" fill={ds.border.strong} />; })}
        {items.map((it, i) => {
          const a = i * step, sin = Math.sin((a * Math.PI) / 180), cos = Math.cos((a * Math.PI) / 180);
          const p = polar(cx, cy, R + 14, a);
          const anchor = Math.abs(sin) < 0.2 ? "middle" : sin > 0 ? "start" : "end";
          const lines = wrapLabel(it.label);
          const lh = 12;
          const y0 = Math.abs(sin) < 0.2 ? (cos > 0 ? p.y - (lines.length - 1) * lh : p.y + 8) : p.y - ((lines.length - 1) * lh) / 2 + 3;
          return (
            <text key={`l${i}`} textAnchor={anchor} fontSize="11" fontFamily={font} fill={ds.text.secondary}>
              {lines.map((ln, k) => <tspan key={k} x={p.x} y={y0 + k * lh}>{ln}</tspan>)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
