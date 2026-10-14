import { useState } from "react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { ROUNDS } from "../../../lib/dataset.js";
import { LAST, roundName, fmtDate, fmtMonth, groupGaps, connections, priorityPoints, responseCoverage, scoreSpread, brightSpots, withinReach, rankAmong, SUPPRESS_BELOW } from "../../../lib/scopeData.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { StoryCard, noteText, bodyText } from "./StoryCard.jsx";
import { ViewSwitch, CopyTable } from "./controls.jsx";
import { DataTable, ScoreCell, tableText } from "./DataTable.jsx";
import { useStoryStyle } from "./storyStyle.js";
import { FLOURISHING_AT, STRIVING_AT, nextLine } from "../../../lib/bands.js";

/* ================================================================== */
/* EXTRA STORIES — the REFINED styles of the Stories that now have a       */
/* Figma-aligned Current version in FamilyStories.jsx (the exports here are  */
/* named ...Legacy and are what Refined renders). Goal & Pace and Who         */
/* Answered still live only here.                                             */
/* Originally: added in the Widget Builder (not yet on the report).          */
/* Each follows the pattern: one clear Purpose, a Boundary, real data     */
/* only, Table View + Copy Table where there's a table, and no Compare     */
/* toggle on anything that is already about change.                        */
/*                                                                         */
/*   What Changed       — the biggest gains and drops since a past round    */
/*   Where Gaps Are Widest — lowest vs highest group, per way of grouping    */
/*   What Moves With This  — topics whose scores rise and fall with it        */
/*   Priority Map          — score against how closely a part tracks overall   */
/*   Goal & Pace           — a target, the gap, and a straight-line estimate    */
/*   Who Answered          — response counts and the privacy rule               */
/* (Who Is Where and Areas to Focus reuse existing story components.)          */
/* ================================================================== */
const eyebrow = { fontSize: 11, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: T.gray500, fontFamily: font };

/* ---- What Changed ----------------------------------------------------- */
export function ChangesStoryLegacy({ items, noun = "Driver" }) {
  const refined = useStoryStyle() === "refined";
  const [ref, setRef] = useState(Math.max(0, LAST - 1));
  const rows = items.map((it) => ({ label: it.label, from: it.values[ref], to: it.values[LAST], d: it.values[LAST] - it.values[ref] }));
  const gains = rows.filter((r) => r.d > 0).sort((a, b) => b.d - a.d).slice(0, 3);
  const drops = rows.filter((r) => r.d < 0).sort((a, b) => a.d - b.d).slice(0, 3);
  const earlier = ROUNDS.map((_, i) => i).filter((i) => i < LAST);
  const col = (heading, color, list, empty) => refined ? (
    <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color, paddingBottom: 8 }}>{heading}</span>
      {list.length === 0 && <span style={{ ...bodyText, fontSize: 14, padding: "10px 0" }}>{empty}</span>}
      {list.map((r) => (
        <div key={r.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", alignItems: "baseline", gap: 12, padding: "12px 0", borderTop: `1px solid ${T.gray50}`, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: T.gray900, minWidth: 0 }}>{r.label}</span>
          <span style={{ fontSize: 13, color: T.gray500 }}>{r.from} → <b style={{ fontSize: 18, fontWeight: 600, color: band(r.to).cs }}>{r.to}</b></span>
          <span style={{ fontSize: 13, fontWeight: 600, color, minWidth: 28, textAlign: "right" }}>{r.d > 0 ? "+" : "−"}{Math.abs(r.d)}</span>
        </div>
      ))}
    </div>
  ) : (
    <div style={{ flex: "1 1 260px", border: `1px solid ${T.gray100}`, borderRadius: radius.md, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{heading}</span>
      {list.length === 0 && <span style={{ ...bodyText, fontSize: 13 }}>{empty}</span>}
      {list.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: `2px solid ${band(r.to).c}`, paddingLeft: 8 }}>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.gray900, minWidth: 0 }}>{r.label}</span>
          <span style={{ fontSize: 12, color: T.gray500 }}>{r.from} →</span>
          <b style={{ fontSize: 15, color: band(r.to).cs, minWidth: 22, textAlign: "right" }}>{r.to}</b>
          <TrendPill delta={r.d} numberOnly />
        </div>
      ))}
    </div>
  );
  return (
    <StoryCard
      title="What Changed" line={`The ${noun}s that moved most since ${roundName(ref)}.`}
      controls={earlier.length > 1 && (
        <select className="field-soft" value={ref} onChange={(e) => setRef(Number(e.target.value))} aria-label="Since which round" style={{ fontFamily: font, fontSize: 13, padding: "4px 8px", borderRadius: radius.sm, color: T.gray900 }}>
          {earlier.map((i) => <option key={i} value={i}>Since {roundName(i)} · {fmtMonth(ROUNDS[i].date)}</option>)}
        </select>
      )}
    >
      <div style={{ display: "flex", gap: refined ? 48 : 12, flexWrap: "wrap", fontFamily: font }}>
        {col("Biggest gains", T.greenStrong, gains, "Nothing has risen.")}
        {col("Biggest drops", T.redStrong, drops, "Nothing has dropped.")}
      </div>
    </StoryCard>
  );
}

/* ---- Where Gaps Are Widest ------------------------------------------- */
export function GroupGapStoryLegacy({ scoreOf, label }) {
  const refined = useStoryStyle() === "refined";
  const [view, setView] = useState("chart");
  const gaps = groupGaps(scoreOf);
  const cols = [
    { key: "axis", label: "Grouped by" },
    { key: "lo", label: "Lowest group", render: (r) => r.lo.group, text: (r) => r.lo.group },
    { key: "los", label: "Score", align: "right", render: (r) => <ScoreCell v={r.lo.score} />, text: (r) => r.lo.score },
    { key: "hi", label: "Highest group", render: (r) => r.hi.group, text: (r) => r.hi.group },
    { key: "his", label: "Score", align: "right", render: (r) => <ScoreCell v={r.hi.score} />, text: (r) => r.hi.score },
    { key: "gap", label: "Gap", align: "right", render: (r) => <b>{r.gap}</b> },
  ];
  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(cols, gaps)} />];
  return (
    <StoryCard title="Where Gaps Are Widest" controls={controls} line={`The distance between the lowest- and highest-scoring group on ${label}, for each way of grouping people. Groups under ${SUPPRESS_BELOW} people are never shown.`}>
      {view === "table" ? (
        <DataTable columns={cols} rows={gaps} />
      ) : refined ? (
        /* Widest gap first. Each row: the way of grouping and the gap in points, then one shared 0–100
           rail with the 60 / 80 status lines and the stretch between the lowest and highest group,
           then who they are. Rows align on the same rail so they can be compared at a glance. */
        <div style={{ display: "flex", flexDirection: "column", fontFamily: font, fontVariantNumeric: "tabular-nums" }}>
          {gaps.map((g, i) => {
            const lo = band(g.lo.score), hi = band(g.hi.score);
            return (
              <div key={g.axis} style={{ display: "flex", flexDirection: "column", gap: 12, padding: "18px 0", borderTop: i ? `1px solid ${T.gray75}` : "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: T.gray900 }}>{g.axis}</span>
                  <span style={{ fontSize: 13, color: T.gray500 }}><b style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, color: T.gray900 }}>{g.gap}</b> points apart</span>
                </div>
                <div style={{ position: "relative", height: 14, margin: "0 7px" }}>
                  <span style={{ position: "absolute", left: -7, right: -7, top: 5, height: 4, borderRadius: radius.full, background: T.gray50 }} />
                  {[STRIVING_AT, FLOURISHING_AT].map((t) => <span key={t} style={{ position: "absolute", left: `${t}%`, top: 2, width: 1, height: 10, background: T.gray100 }} />)}
                  <span style={{ position: "absolute", left: `${g.lo.score}%`, width: `${g.gap}%`, top: 5, height: 4, borderRadius: radius.full, background: T.gray300 }} />
                  <span title={`${g.lo.group}: ${g.lo.score}`} style={{ position: "absolute", top: 0, left: `${g.lo.score}%`, width: 14, height: 14, margin: "0 0 0 -7px", borderRadius: "50%", background: lo.c, boxShadow: `0 0 0 3px ${T.white}` }} />
                  <span title={`${g.hi.group}: ${g.hi.score}`} style={{ position: "absolute", top: 0, left: `${g.hi.score}%`, width: 14, height: 14, margin: "0 0 0 -7px", borderRadius: "50%", background: hi.c, boxShadow: `0 0 0 3px ${T.white}` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 14, color: T.gray700 }}>
                  <span><b style={{ color: lo.cs, fontWeight: 600 }}>{g.lo.score}</b> · {g.lo.group}</span>
                  <span style={{ textAlign: "right" }}>{g.hi.group} · <b style={{ color: hi.cs, fontWeight: 600 }}>{g.hi.score}</b></span>
                </div>
              </div>
            );
          })}
          <div style={{ position: "relative", height: 16, margin: "0 7px", fontSize: 12, color: T.gray500 }}>
            {[[0, "0"], [STRIVING_AT, String(STRIVING_AT)], [FLOURISHING_AT, String(FLOURISHING_AT)], [100, "100"]].map(([p, t]) => <span key={t} style={{ position: "absolute", left: `${p}%`, transform: "translateX(-50%)" }}>{t}</span>)}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: font }}>
          {gaps.map((g) => (
            <div key={g.axis} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>{g.axis}</span>
                <span style={{ fontSize: 13, color: T.gray500 }}>gap <b style={{ color: T.gray900 }}>{g.gap}</b></span>
              </div>
              <div style={{ position: "relative", height: 16, margin: "0 8px" }}>
                <span style={{ position: "absolute", top: 7, height: 2, left: `${g.lo.score}%`, width: `${g.gap}%`, background: T.gray300 }} />
                <span title={`${g.lo.group}: ${g.lo.score}`} style={{ position: "absolute", top: 4, left: `${g.lo.score}%`, width: 8, height: 8, margin: "0 0 0 -4px", borderRadius: "50%", background: T.gray900 }} />
                <span title={`${g.hi.group}: ${g.hi.score}`} style={{ position: "absolute", top: 0, left: `${g.hi.score}%`, width: 16, height: 16, margin: "0 0 0 -8px", boxSizing: "border-box", borderRadius: "50%", background: T.white, border: `2px solid ${T.gray900}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gray900 }} />
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: T.gray700 }}>
                <span>Lowest: <b>{g.lo.group}</b> <span style={{ color: band(g.lo.score).cs, fontWeight: 700 }}>{g.lo.score}</span></span>
                <span style={{ textAlign: "right" }}>Highest: <b>{g.hi.group}</b> <span style={{ color: band(g.hi.score).cs, fontWeight: 700 }}>{g.hi.score}</span></span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.gray500, margin: "0 8px" }}><span>0</span><span>50</span><span>100</span></div>
        </div>
      )}
    </StoryCard>
  );
}

/* ---- What Moves With This -------------------------------------------- */
const strengthOf = (r) => (Math.abs(r) >= 0.6 ? "Strong" : Math.abs(r) >= 0.3 ? "Moderate" : "Weak");
export function ConnectedStoryLegacy({ scoreOf, label, exclude }) {
  const refined = useStoryStyle() === "refined";
  const [view, setView] = useState("chart");
  const rows = connections(scoreOf, exclude).slice(0, 6);
  const cols = [
    { key: "label", label: "Topic" },
    { key: "r", label: "Link (r)", align: "right", render: (r) => r.r.toFixed(2), text: (r) => r.r.toFixed(2) },
    { key: "s", label: "Strength", render: (r) => `${strengthOf(r.r)}${r.r < 0 ? " (opposite)" : ""}`, text: (r) => strengthOf(r.r) },
    { key: "value", label: "Score", align: "right", render: (r) => <ScoreCell v={r.value} /> },
  ];
  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(cols, rows)} />];
  return (
    <StoryCard title="What Moves With This" controls={controls} line={`Topics whose scores rise and fall together with ${label} across people. This shows a link, not a cause.`}>
      {view === "table" ? (
        <DataTable columns={cols} rows={rows} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: font }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 1.2fr) minmax(0, 2fr) auto", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.gray900 }}>{r.label}</span>
              <div style={{ height: refined ? 6 : 8, borderRadius: radius.full, background: T.gray50 }}>
                <div style={{ width: `${Math.abs(r.r) * 100}%`, height: "100%", borderRadius: radius.full, background: r.r < 0 ? T.hotPink : T.teamBlue }} />
              </div>
              <span style={{ display: "flex", gap: 8, alignItems: "baseline", justifyContent: "flex-end", minWidth: 120 }}>
                <span style={{ fontSize: 12, color: T.gray500 }}>{strengthOf(r.r)}{r.r < 0 ? ", opposite" : ""}</span>
                <b style={{ fontSize: 15, color: band(r.value).cs }}>{r.value}</b>
              </span>
            </div>
          ))}
          <p style={noteText}>The number on the right is each topic's own score. Links come from how the same people answered, so they point to where to look, not what to change.</p>
        </div>
      )}
    </StoryCard>
  );
}

/* ---- Priority Map ----------------------------------------------------- */
const QUAD = {
  fix: { name: "Fix first", note: `Scores below ${FLOURISHING_AT} and closely tied to overall well-being` },
  protect: { name: "Protect", note: `Scores ${FLOURISHING_AT}+ and closely tied to overall well-being` },
  watch: { name: "Watch", note: `Scores below ${FLOURISHING_AT}, less tied to overall well-being` },
  maintain: { name: "Maintain", note: `Scores ${FLOURISHING_AT}+, less tied to overall well-being` },
};
const quadOf = (p, medianLink) => (p.score < FLOURISHING_AT ? (p.link >= medianLink ? "fix" : "watch") : p.link >= medianLink ? "protect" : "maintain");

export function PriorityMapStoryLegacy({ items, noun = "Driver" }) {
  const refined = useStoryStyle() === "refined";
  const [view, setView] = useState("chart");
  const [hover, setHover] = useState(null);
  const pts = priorityPoints(items);
  const sorted = [...pts].sort((a, b) => a.link - b.link);
  const medianLink = sorted[Math.floor(sorted.length / 2)].link;
  const rows = pts.map((p) => ({ ...p, quad: quadOf(p, medianLink) })).sort((a, b) => ({ fix: 0, watch: 1, protect: 2, maintain: 3 }[a.quad] - { fix: 0, watch: 1, protect: 2, maintain: 3 }[b.quad]) || a.score - b.score);

  const W = 776, H = 400, PL = 56, PR = 24, PT = 24, PB = 48;
  const lo = Math.min(...pts.map((p) => p.link)), hi = Math.max(...pts.map((p) => p.link));
  const pad = (hi - lo) * 0.15 || 0.1;
  const yLo = lo - pad, yHi = hi + pad;
  const x = (v) => PL + (v / 100) * (W - PL - PR);
  const y = (v) => PT + (1 - (v - yLo) / (yHi - yLo)) * (H - PT - PB);

  const cols = [
    { key: "label", label: noun },
    { key: "score", label: "Score", align: "right", render: (r) => <ScoreCell v={r.score} /> },
    { key: "link", label: "Link to overall", align: "right", render: (r) => r.link.toFixed(2), text: (r) => r.link.toFixed(2) },
    { key: "quad", label: "Priority", render: (r) => QUAD[r.quad].name, text: (r) => QUAD[r.quad].name },
  ];
  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(cols, rows)} />];
  const h = hover != null ? rows[hover] : null;
  const quadColor = { fix: T.redStrong, protect: T.greenStrong, watch: T.amberStrong, maintain: T.gray500 };

  return (
    <StoryCard title="Priority Map" controls={controls} line={`Where to put effort first. Each ${noun} is placed by its score (across) and how closely it moves with people's overall score (up).`}>
      {view === "table" ? (
        <DataTable columns={cols} rows={rows} />
      ) : (
        <>
          <div style={{ position: "relative", width: "100%", maxWidth: W, margin: "0 auto", aspectRatio: `${W} / ${H}` }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
              <rect x={PL} y={PT} width={x(FLOURISHING_AT) - PL} height={y(medianLink) - PT} fill={`${T.red}0d`} />
              <rect x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} fill="none" stroke={T.gray100} />
              <line x1={x(FLOURISHING_AT)} x2={x(FLOURISHING_AT)} y1={PT} y2={H - PB} stroke={T.gray300} strokeDasharray="5 4" />
              <line x1={PL} x2={W - PR} y1={y(medianLink)} y2={y(medianLink)} stroke={T.gray300} strokeDasharray="5 4" />
              {[["fix", PL + 10, PT + 18, "start"], ["protect", W - PR - 10, PT + 18, "end"], ["watch", PL + 10, H - PB - 10, "start"], ["maintain", W - PR - 10, H - PB - 10, "end"]].map(([q, qx, qy, anchor]) => (
                <text key={q} x={qx} y={qy} textAnchor={anchor} fontSize="11" fontWeight="700" letterSpacing="0.6" fontFamily={font} fill={quadColor[q]} opacity="0.85">{refined ? QUAD[q].name : QUAD[q].name.toUpperCase()}</text>
              ))}
              {[0, 25, 50, 75, 100].map((t) => <text key={t} x={x(t)} y={H - PB + 18} textAnchor="middle" fontSize="11" fontFamily={font} fill={T.gray500}>{t}</text>)}
              <text x={(PL + W - PR) / 2} y={H - 8} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="0.6" fontFamily={font} fill={T.gray700}>{refined ? "Score" : "SCORE"}</text>
              <text transform={`translate(14 ${(PT + H - PB) / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="0.6" fontFamily={font} fill={T.gray700}>{refined ? "Link to overall" : "LINK TO OVERALL"}</text>
              {rows.map((p, i) => (
                <g key={p.label} onMouseEnter={() => setHover(i)} style={{ cursor: "default" }}>
                  <circle cx={x(p.score)} cy={y(p.link)} r={hover === i ? 9 : 6.5} fill={band(p.score).c} stroke={T.white} strokeWidth="2" />
                  {(rows.length <= 8 || p.quad === "fix") && <text x={x(p.score) + 11} y={y(p.link) + 4} fontSize="11" fontFamily={font} fill={T.gray700} style={{ pointerEvents: "none" }}>{p.label}</text>}
                </g>
              ))}
            </svg>
            {h && (
              <div style={{ position: "absolute", left: `${(x(h.score) / W) * 100}%`, top: `${(y(h.link) / H) * 100}%`, pointerEvents: "none", zIndex: 3, width: 200, transform: `translate(${h.score > 70 ? "-100%" : "0"}, -110%)`, background: T.gray25, borderRadius: radius.lg, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4, fontFamily: font, boxShadow: "0 6px 4px rgba(0,0,0,0.05), 0 3px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.09)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.gray900 }}>{h.label}</span>
                <span style={{ fontSize: 12, color: T.gray700 }}>Score <b style={{ color: band(h.score).cs }}>{h.score}</b> · link {h.link.toFixed(2)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: quadColor[h.quad] }}>{QUAD[h.quad].name}</span>
              </div>
            )}
          </div>
          <p style={noteText}>Dashed lines split the map at a score of {FLOURISHING_AT} and at the middle link. {QUAD.fix.name}: {QUAD.fix.note.toLowerCase()}. Link comes from how the same people answered, so it points to where effort is likely to matter, not a guaranteed result.</p>
        </>
      )}
    </StoryCard>
  );
}

/* ---- Goal & Pace ------------------------------------------------------ */
const nextTarget = (v) => nextLine(v) ?? 90;
export function GoalStory({ label, series }) {
  const refined = useStoryStyle() === "refined";
  const cur = series[LAST];
  const [target, setTarget] = useState(nextTarget(cur));
  const t = Math.max(1, Math.min(100, Number(target) || 1));
  const pace = (series[LAST] - series[0]) / Math.max(1, LAST);
  const gap = t - cur;
  const k = gap > 0 && pace > 0.05 ? Math.ceil(gap / pace) : null;
  const msPerRound = (new Date(ROUNDS[LAST].date) - new Date(ROUNDS[0].date)) / Math.max(1, LAST);
  const eta = k ? new Date(new Date(ROUNDS[LAST].date).getTime() + k * msPerRound) : null;

  const m = LAST + Math.min(k ?? 3, 8);
  const W = 776, H = 240, PL = 48, PR = 24, PT = 20, PB = 36;
  const x = (i) => PL + (i / m) * (W - PL - PR);
  const y = (v) => PT + (1 - v / 100) * (H - PT - PB);
  const proj = k ? [[x(LAST), y(cur)], [x(LAST + Math.min(k, 8)), y(Math.min(100, cur + pace * Math.min(k, 8)))]] : null;

  let headline;
  if (gap <= 0) headline = <>You're already at or above <b>{t}</b>.</>;
  else if (k && k > 12) headline = <>At the pace of the last {LAST} rounds (<b>+{pace.toFixed(1)}</b> a round), {label} would take <b>more than 12 more rounds</b> to reach <b>{t}</b> — a long way off. A smaller target may be a better next step.</>;
  else if (k) headline = <>At the pace of the last {LAST} rounds (<b>{pace > 0 ? "+" : ""}{pace.toFixed(1)}</b> a round), {label} would reach <b>{t}</b> in about <b>{k} more {k === 1 ? "round" : "rounds"}</b>, around <b>{fmtMonth(eta)}</b>.</>;
  else headline = <>{label} hasn't been rising, so a straight-line estimate wouldn't reach <b>{t}</b>.</>;

  return (
    <StoryCard
      title="Goal & Pace" line={`Set a target for ${label} and see how far away it is.`}
      controls={
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 13, color: T.gray700 }}>
          Target
          <input type="number" min={1} max={100} value={target} onChange={(e) => setTarget(e.target.value)} className="field-soft" aria-label="Target score" style={{ width: 64, fontFamily: font, fontSize: 13, padding: "4px 8px", borderRadius: radius.sm, color: T.gray900 }} />
          {[STRIVING_AT, FLOURISHING_AT, 90].map((p) => (
            <button key={p} onClick={() => setTarget(p)} style={{ border: refined ? "1px solid transparent" : `1px solid ${t === p ? T.gray800 : T.gray100}`, background: t === p ? T.gray800 : refined ? T.gray50 : T.white, color: t === p ? T.white : T.gray700, borderRadius: refined ? radius.sm : radius.full, padding: "3px 10px", fontSize: 12, fontFamily: font, cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      }
    >
      <p style={refined ? { ...bodyText, fontSize: 18, lineHeight: "26px", fontWeight: 500, letterSpacing: "-0.2px", color: T.gray900, maxWidth: "58ch", textWrap: "pretty" } : { ...bodyText, color: T.gray900 }}>{headline}</p>
      <div style={{ display: "flex", gap: refined ? 48 : 24, flexWrap: "wrap", fontFamily: font }}>
        {[["Now", cur, band(cur).cs], ["Target", t, T.gray900], ["Gap", Math.max(0, gap), T.gray900]].map(([name, v, c]) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={refined ? { fontSize: 13, color: T.gray500 } : eyebrow}>{name}</span>
            <span style={{ fontSize: refined ? 40 : 28, fontWeight: refined ? 600 : 700, lineHeight: refined ? "44px" : "32px", letterSpacing: refined ? -1 : 0, color: c, fontVariantNumeric: "tabular-nums" }}>{v}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", maxWidth: W, margin: "0 auto" }}>
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}><line x1={PL} x2={W - PR} y1={y(g)} y2={y(g)} stroke={T.gray75} /><text x={PL - 8} y={y(g)} textAnchor="end" dominantBaseline="middle" fontSize="11" fontFamily={font} fill={T.gray500}>{g}</text></g>
        ))}
        <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke={T.gray800} strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={W - PR} y={y(t) - 6} textAnchor="end" fontSize="11" fontWeight="700" fontFamily={font} fill={T.gray800}>{refined ? `Target ${t}` : `TARGET ${t}`}</text>
        <path d={series.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")} fill="none" stroke="#908d8e" strokeWidth="1.5" />
        {proj && <path d={`M${proj[0][0]},${proj[0][1]} L${proj[1][0]},${proj[1][1]}`} fill="none" stroke={T.teamBlue} strokeWidth="2" strokeDasharray="5 4" />}
        {series.map((v, i) => <g key={i}><circle cx={x(i)} cy={y(v)} r="3.5" fill="#908d8e" /><text x={x(i)} y={y(v) - 10} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily={font} fill={band(v).cs}>{v}</text><text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fontFamily={font} fill={T.gray500}>{fmtMonth(ROUNDS[i].date)}</text></g>)}
        {proj && <><circle cx={proj[1][0]} cy={proj[1][1]} r="4" fill={T.white} stroke={T.teamBlue} strokeWidth="2" /><text x={proj[1][0]} y={H - 10} textAnchor="end" fontSize="11" fontFamily={font} fill={T.teamBlue}>{k > 8 ? `+${Math.min(k, 8)} rounds` : `≈ ${fmtMonth(eta)}`}</text></>}
      </svg>
      <p style={noteText}>A straight line from past rounds, not a forecast — real results depend on what changes. Only {ROUNDS.length} rounds exist, so treat it as a rough guide.</p>
    </StoryCard>
  );
}

/* ---- Who Answered ------------------------------------------------------ */
export function CoverageStory() {
  const c = responseCoverage();
  if (useStoryStyle() === "refined") {
    return (
      <StoryCard title="Who Answered" line="How many people took part each round. This is about coverage, not what they said.">
        <div style={{ display: "flex", flexWrap: "wrap", fontFamily: font, fontVariantNumeric: "tabular-nums" }}>
          {[...c.perRound].reverse().map((r, k) => (
            <div key={r.date} style={{ flex: "1 1 160px", display: "flex", flexDirection: "column", gap: 4, padding: "4px 24px 4px 0", marginRight: 24, borderRight: k < c.perRound.length - 1 ? `1px solid ${T.gray75}` : "none" }}>
              <span style={{ fontSize: 13, color: k === 0 ? T.gray900 : T.gray500, fontWeight: k === 0 ? 600 : 400 }}>{fmtDate(r.date)}</span>
              <span style={{ fontSize: 36, fontWeight: 600, lineHeight: "40px", letterSpacing: -0.8, color: T.gray900 }}>{r.n}</span>
              <span style={{ fontSize: 13, color: T.gray500 }}>{r.rate}% of {c.headcount} people</span>
            </div>
          ))}
        </div>
        <p style={noteText}>{c.hidden} of {c.total} groups (across every way of grouping people) have fewer than {SUPPRESS_BELOW} people, so their scores are never shown.</p>
      </StoryCard>
    );
  }
  return (
    <StoryCard title="Who Answered" line="How many people took part each round. This is about coverage, not what they said.">
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontFamily: font }}>
        {[...c.perRound].reverse().map((r, k) => (
          <div key={r.date} style={{ flex: "1 1 160px", border: `1px solid ${k === 0 ? T.gray700 : T.gray100}`, borderRadius: radius.lg, padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: T.gray700 }}>{fmtDate(r.date)}</span>
            <span style={{ fontSize: 28, fontWeight: 700, lineHeight: "32px", color: T.gray900 }}>{r.n}</span>
            <span style={{ fontSize: 12, color: T.gray500 }}>{r.rate}% of {c.headcount} people</span>
          </div>
        ))}
      </div>
      <p style={noteText}>{c.hidden} of {c.total} groups (across every way of grouping people) have fewer than {SUPPRESS_BELOW} people, so their scores are never shown.</p>
    </StoryCard>
  );
}


/* ================================================================== */
/* NEWER STORIES — each has one Purpose and one Boundary, real data only  */
/*   How Scores Are Spread — one bar per ten points, people in each        */
/*   Bright Spots          — the highest-scoring group on each way of       */
/*                           grouping (the mirror of Areas to Focus)         */
/*   Within Reach          — parts closest to the next status line up        */
/*   How It Ranks          — where this Explorer / Driver sits among peers    */
/* ================================================================== */

/* ---- How Scores Are Spread ------------------------------------------- */
export function SpreadStoryLegacy({ scoreOf, label }) {
  const [view, setView] = useState("chart");
  const [hover, setHover] = useState(null);
  const sp = scoreSpread(scoreOf);
  const max = Math.max(...sp.bins.map((b) => b.n), 1);
  const cols = [
    { key: "range", label: "Score range" },
    { key: "n", label: "People", align: "right" },
    { key: "pct", label: "Share", align: "right", render: (r) => `${r.pct}%`, text: (r) => `${r.pct}%` },
  ];
  const rows = sp.bins.map((b) => ({ range: `${b.from}–${b.to}`, n: b.n, pct: Math.round((b.n / sp.total) * 100) }));
  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(cols, rows)} />];
  const H = 140;
  const active = hover != null ? sp.bins[hover] : null;
  return (
    <StoryCard
      title="How Scores Are Spread" controls={controls}
      line={`Where each of the ${sp.total} people landed on ${label}. A single average hides this: the same average can be one group of people who all feel the same, or two very different groups.`}
      note={`Half of people score between ${sp.p25} and ${sp.p75}. The middle score is ${sp.median}.`}
    >
      {view === "table" ? <DataTable columns={cols} rows={rows} /> : (
        <div style={{ fontFamily: font, fontVariantNumeric: "tabular-nums" }}>
          <div style={{ height: 20, fontSize: 13, color: T.gray700, marginBottom: 6 }}>
            {active ? <><b style={{ color: T.gray900 }}>{active.n}</b> {active.n === 1 ? "person" : "people"} scored {active.from}–{active.to}</> : "Hover a bar to see how many people it holds."}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: H }}>
            {sp.bins.map((b, i) => (
              <div key={b.from} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", cursor: "default" }}>
                <div style={{ width: "100%", height: Math.max(b.n ? 4 : 0, (b.n / max) * H), borderRadius: "3px 3px 0 0", background: band(b.from + 5).c, opacity: hover == null || hover === i ? 1 : 0.45, transition: "opacity 120ms" }} />
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: T.gray100 }} />
          <div style={{ position: "relative", height: 18, marginTop: 6, fontSize: 12, color: T.gray500 }}>
            {[[0, "0"], [STRIVING_AT, `${STRIVING_AT} · Striving`], [FLOURISHING_AT, `${FLOURISHING_AT} · Flourishing`], [100, "100"]].map(([p, t], i, a) => (
              <span key={t} style={{ position: "absolute", left: `${p}%`, transform: i === 0 ? "none" : i === a.length - 1 ? "translateX(-100%)" : "translateX(-50%)", whiteSpace: "nowrap" }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </StoryCard>
  );
}

/* ---- Bright Spots ----------------------------------------------------- */
export function BrightSpotsStoryLegacy({ scoreOf, label }) {
  const groups = brightSpots(4, scoreOf);
  return (
    <StoryCard title="Bright Spots" line={`The highest-scoring group on each part of your organisation for ${label} — what is working, and who could share it. Groups with fewer than ${SUPPRESS_BELOW} people are never shown.`}>
      <div style={{ display: "flex", flexDirection: "column", fontFamily: font, fontVariantNumeric: "tabular-nums" }}>
        {groups.map((g, i) => {
          const b = band(g.score);
          return (
            <div key={`${g.axis}-${g.group}`} style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr) auto", alignItems: "center", gap: 20, padding: "14px 0", borderTop: i ? `1px solid ${T.gray75}` : "none" }}>
              <span style={{ fontSize: 13, color: T.gray500 }}>{g.axis}</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: T.gray900 }}>{g.group}</span>
                <span style={{ fontSize: 13, color: T.gray500 }}>{g.n} people{g.change != null ? ` · ${g.change > 0 ? "up" : g.change < 0 ? "down" : "no change"}${g.change ? ` ${Math.abs(g.change)}` : ""} since last round` : ""}</span>
              </span>
              <span style={{ fontSize: 32, fontWeight: 600, lineHeight: "36px", letterSpacing: -0.6, color: b.cs }}>{g.score}</span>
            </div>
          );
        })}
      </div>
    </StoryCard>
  );
}

/* ---- Within Reach ----------------------------------------------------- */
export function WithinReachStoryLegacy({ items, noun = "Driver" }) {
  const rows = withinReach(items, 4);
  return (
    <StoryCard
      title="Within Reach" line={`The ${noun}s closest to the next status line up. A small improvement here changes how the result reads, so these are good first steps.`}
      note={rows.length ? `Struggling means below ${STRIVING_AT}, Striving ${STRIVING_AT} to ${FLOURISHING_AT - 1}, Flourishing ${FLOURISHING_AT} and over.` : undefined}
    >
      {rows.length === 0 ? <p style={{ ...bodyText, fontFamily: font }}>Every {noun} is already Flourishing.</p> : (
        <div style={{ display: "flex", flexDirection: "column", fontFamily: font, fontVariantNumeric: "tabular-nums" }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(120px, 1.2fr) 150px", alignItems: "center", gap: 20, padding: "14px 0", borderTop: i ? `1px solid ${T.gray75}` : "none" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: T.gray900, minWidth: 0 }}>{r.label}</span>
              <div style={{ position: "relative", height: 14 }}>
                <span style={{ position: "absolute", left: 0, right: 0, top: 5, height: 4, borderRadius: radius.full, background: T.gray50 }} />
                <span style={{ position: "absolute", left: 0, width: `${r.score}%`, top: 5, height: 4, borderRadius: radius.full, background: band(r.score).c }} />
                <span style={{ position: "absolute", left: `${r.next}%`, top: 0, width: 2, height: 14, background: T.gray900 }} />
              </div>
              <span style={{ fontSize: 13, color: T.gray500, textAlign: "right" }}>
                <b style={{ fontSize: 18, fontWeight: 600, color: band(r.score).cs }}>{r.score}</b> · {r.gap} to {r.nextName}
              </span>
            </div>
          ))}
        </div>
      )}
    </StoryCard>
  );
}

/* ---- How It Ranks ----------------------------------------------------- */
export function RankStoryLegacy({ rank: info, label }) {
  const { rows, rank, total, noun } = info;
  // 12 Explorers all fit; 45 Drivers show the top, the neighbourhood of this one, and the bottom.
  let shown = rows.map((r, i) => ({ ...r, pos: i + 1 }));
  if (rows.length > 14) {
    const keep = new Set([0, 1, 2, rows.length - 1, rows.length - 2, rows.length - 3]);
    for (let k = rank - 3; k <= rank + 1; k++) if (k >= 0 && k < rows.length) keep.add(k);
    shown = [...keep].sort((a, b) => a - b).map((i) => ({ ...rows[i], pos: i + 1 }));
  }
  return (
    <StoryCard
      title="How It Ranks" line={`${label} is ${rank === 1 ? "the highest-scoring" : rank === total ? "the lowest-scoring" : `number ${rank} of ${total} among all`} ${noun}${rank === 1 || rank === total ? "" : "s"}${rank === 1 || rank === total ? ` of ${total}` : ""}, best first.`}
      note={rows.length > shown.length ? "Showing the top and bottom three and the places around this one." : undefined}
    >
      <div style={{ display: "flex", flexDirection: "column", fontFamily: font, fontVariantNumeric: "tabular-nums" }}>
        {shown.map((r, i) => {
          const me = r.label === label;
          const gap = i > 0 && r.pos - shown[i - 1].pos > 1;
          return (
            <div key={r.label}>
              {gap && <div style={{ padding: "2px 0 2px 38px", fontSize: 12, color: T.gray300 }}>⋮</div>}
              <div style={{ display: "grid", gridTemplateColumns: "30px minmax(0, 1fr) minmax(80px, 1.2fr) 36px", alignItems: "center", gap: 12, padding: "9px 10px", margin: "0 -10px", borderRadius: radius.sm, background: me ? T.gray50 : "transparent" }}>
                <span style={{ fontSize: 13, color: T.gray500 }}>{r.pos}</span>
                <span style={{ fontSize: 14, fontWeight: me ? 700 : 500, color: T.gray900, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                <span style={{ height: 4, borderRadius: radius.full, background: me ? T.white : T.gray50 }}><span style={{ display: "block", width: `${r.score}%`, height: "100%", borderRadius: radius.full, background: band(r.score).c }} /></span>
                <span style={{ fontSize: 14, fontWeight: 600, color: band(r.score).cs, textAlign: "right" }}>{r.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </StoryCard>
  );
}
