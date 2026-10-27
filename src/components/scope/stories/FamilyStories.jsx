import { TipBox } from "../../widgets/ChartTip.jsx";
import { useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace, dsBorder, dsShadow } from "../../../lib/ds.js";
import { FLOURISHING_AT, STRIVING_AT, statusName } from "../../../lib/bands.js";
import { useRounds } from "../../../lib/roundsContext.js";
import { LAST, roundName, fmtMonth, groupGaps, connections, priorityPoints, scoreSpread, brightSpots, withinReach, SUPPRESS_BELOW } from "../../../lib/scopeData.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { StoryCard, EvidenceSection, bodyText, noteText } from "./StoryCard.jsx";
import { ViewSwitch, CopyTable, useCompare, CompareControl } from "./controls.jsx";
import { DataTable, ScoreCell, tableText } from "./DataTable.jsx";
import { useStoryStyle } from "./storyStyle.js";
import { WithWidth, useStoryWidth } from "./storyWidth.js";
import { InnerCard, ScoreNumber, AxisIcon, GroupCard, CardGrid, RailRow, plural, sentenceText } from "./diagnosticParts.jsx";
import { ChangesStoryLegacy, GroupGapStoryLegacy, ConnectedStoryLegacy, PriorityMapStoryLegacy, SpreadStoryLegacy, BrightSpotsStoryLegacy, WithinReachStoryLegacy, RankStoryLegacy } from "./ExtraStories.jsx";
import { SplitBreakdownStoryLegacy, ShowAll } from "./BreakdownStory.jsx";

/* ================================================================== */
/* FAMILY STORIES: the Stories the product added around the Figma ones,  */
/* drawn in the same vocabulary as the Figma Diagnostic frames           */
/* (13622:37240, 13622:37281): an Evidence Section holding InnerCards or  */
/* rows, scores as Text md-Trim / Bold in the status text colour, 13/18   */
/* sentences with the name in bold, 8px tracks, trend pills, system tags. */
/* None of them has its own Figma frame, so each page records them as      */
/* "designed from the system". The earlier drawings are kept as the        */
/* Refined style (ExtraStories.jsx, BreakdownStory.jsx: ...Legacy).        */
/*                                                                        */
/* Diagnostic: What Changed, Where Gaps Are Widest, What Moves With This,  */
/*   Priority Map, Bright Spots, Within Reach, How It Ranks               */
/* Breakdown:  How Scores Are Spread, Who Is Where                        */
/* Every one is responsive to its card (storyWidth.js), keeps Table View  */
/* where there is a table, and says so when there is nothing to show.      */
/* ================================================================== */
const byStyle = (Classic, Legacy) => function Styled(props) { return useStoryStyle() === "refined" ? <Legacy {...props} /> : <Classic {...props} />; };
const panel = { fontFamily: font };
const emptyNote = (text) => <p style={{ ...bodyText, fontFamily: font }}>{text}</p>;

/* ------------------------------------------------------------------ */
/* What Changed                                                         */
/* ------------------------------------------------------------------ */
function ChangeRow({ r }) {
  return (
    <div data-part="change-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[8], rowGap: dsSpace[4], flexWrap: "wrap" }}>
      <span style={{ ...dsText("Text xs", 700), color: ds.text.primary, minWidth: 0, flex: "1 1 140px" }}>{r.label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: dsSpace[8], flexShrink: 0 }}>
        <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{r.from} →</span>
        <ScoreNumber value={r.to} />
        <TrendPill delta={r.d} numberOnly />
      </span>
    </div>
  );
}
function ChangesClassic({ items, noun = "Driver" }) {
  const ROUNDS = useRounds();
  const [ref, setRef] = useState(Math.max(0, LAST - 1));
  const rows = items.map((it) => ({ label: it.label, from: it.values[ref], to: it.values[LAST], d: it.values[LAST] - it.values[ref] }));
  const gains = rows.filter((r) => r.d > 0).sort((a, b) => b.d - a.d).slice(0, 3);
  const drops = rows.filter((r) => r.d < 0).sort((a, b) => a.d - b.d).slice(0, 3);
  const earlier = ROUNDS.map((_, i) => i).filter((i) => i < LAST);
  const card = (heading, list, empty) => (
    <InnerCard data-part="changes-card">
      <span style={{ ...dsText("Text sm", 700), color: ds.text.secondary }}>{heading}</span>
      {list.length === 0 ? <p style={sentenceText}>{empty}</p> : <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>{list.map((r, i) => <ChangeRow key={`${i}-${r.label}`} r={r} />)}</div>}
    </InnerCard>
  );
  return (
    <StoryCard
      title="What Changed" line={`The ${plural(noun)} that moved most since ${roundName(ref)}.`} data-story="diagnostic-changes"
      controls={earlier.length > 1 && (
        <select className="field-soft" value={ref} onChange={(e) => setRef(Number(e.target.value))} aria-label="Since which round" style={{ ...dsText("Text xs"), fontFamily: font, padding: `${dsSpace[4]}px ${dsSpace[8]}px`, borderRadius: dsRadius.sm, color: ds.text.primary }}>
          {earlier.map((i) => <option key={i} value={i}>Since {roundName(i)} · {fmtMonth(ROUNDS[i].date)}</option>)}
        </select>
      )}
    >
      {gains.length === 0 && drops.length === 0
        ? emptyNote(`Nothing has moved since ${roundName(ref)}.`)
        : <EvidenceSection><CardGrid>{card("Biggest gains", gains, "Nothing has risen.")}{card("Biggest drops", drops, "Nothing has dropped.")}</CardGrid></EvidenceSection>}
    </StoryCard>
  );
}
export const ChangesStory = byStyle(ChangesClassic, ChangesStoryLegacy);

/* ------------------------------------------------------------------ */
/* Where Gaps Are Widest                                                */
/* ------------------------------------------------------------------ */
/* One 0 to 100 rail: faint lines at the 60 and 80 status lines, a grey stretch from the lowest to the highest group, and a
   dot at each end in its status colour. */
function GapRail({ g }) {
  const dot = (score, name) => <span title={`${name}: ${score}`} style={{ position: "absolute", top: "50%", left: `${score}%`, width: 14, height: 14, marginLeft: -7, marginTop: -7, borderRadius: "50%", background: dsBand(score).c, boxShadow: `0 0 0 3px ${ds.surface.general.card}` }} />;
  return (
    <div data-part="gap-rail" style={{ position: "relative", height: 14, margin: "0 7px" }}>
      <span style={{ position: "absolute", left: -7, right: -7, top: 3, height: dsSpace[8], borderRadius: dsRadius.full, background: ds.bg.secondary }} />
      {[STRIVING_AT, FLOURISHING_AT].map((t) => <span key={t} aria-hidden="true" style={{ position: "absolute", left: `${t}%`, top: 0, width: 1, height: 14, background: ds.border.primary }} />)}
      <span style={{ position: "absolute", left: `${g.lo.score}%`, width: `${g.gap}%`, top: 3, height: dsSpace[8], borderRadius: dsRadius.full, background: ds.border.primary }} />
      {dot(g.lo.score, g.lo.group)}{dot(g.hi.score, g.hi.group)}
    </div>
  );
}
/* On a narrow card seven stacked cards make the Story very long, so the four widest show until someone asks for all. */
const GAPS_FIRST = 4;
function GapCards({ gaps }) {
  const { compact } = useStoryWidth();
  const [all, setAll] = useState(false);
  const cut = compact && gaps.length > GAPS_FIRST + 1;
  const shown = cut && !all ? gaps.slice(0, GAPS_FIRST) : gaps;
  const card = (g) => (
    <InnerCard key={g.axis} data-part="gap-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[12] }}>
                  <span style={{ display: "flex", alignItems: "center", gap: dsSpace[12], minWidth: 0 }}>
                    <AxisIcon axis={g.axisKey} />
                    <span style={{ ...dsText("Text sm", 700), color: ds.text.secondary }}>{g.axis}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "baseline", gap: dsSpace[4], flexShrink: 0 }}>
                    <span data-part="gap-value" style={{ ...dsText("Text md", 700), color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{g.gap}</span>
                    <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{g.gap === 1 ? "point apart" : "points apart"}</span>
                  </span>
                </div>
                <GapRail g={g} />
                <div style={{ position: "relative", height: 14, margin: "-8px 7px 0", ...dsText("Text 3xs"), color: ds.text.tertiary }} aria-hidden="true">
                  {[0, STRIVING_AT, FLOURISHING_AT, 100].map((t) => <span key={t} style={{ position: "absolute", left: `${t}%`, transform: "translateX(-50%)" }}>{t}</span>)}
                </div>
                <p style={{ ...sentenceText, display: "flex", justifyContent: "space-between", gap: dsSpace[12] }}>
                  <span><b style={{ color: dsBand(g.lo.score).cs }}>{g.lo.score}</b> · {g.lo.group}</span>
                  <span style={{ textAlign: "right" }}>{g.hi.group} · <b style={{ color: dsBand(g.hi.score).cs }}>{g.hi.score}</b></span>
                </p>
              </InnerCard>
  );
  return (
    <>
      <EvidenceSection><CardGrid>{shown.map(card)}</CardGrid></EvidenceSection>
      {cut && <ShowAll open={all} total={gaps.length} onToggle={() => setAll((v) => !v)} />}
    </>
  );
}
function GapsClassic({ scoreOf, label }) {
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
    <StoryCard title="Where Gaps Are Widest" controls={controls} data-story="diagnostic-gaps" line={`The distance between the lowest- and highest-scoring group for ${label}, for each way of grouping people. Groups under ${SUPPRESS_BELOW} people are never shown.`}>
      {gaps.length === 0 ? emptyNote("No way of grouping people has two groups of 5 or more yet.") : view === "table" ? <DataTable columns={cols} rows={gaps} /> : (
        <GapCards gaps={gaps} />
      )}
    </StoryCard>
  );
}
export const GroupGapStory = byStyle(GapsClassic, GroupGapStoryLegacy);

/* ------------------------------------------------------------------ */
/* What Moves With This                                                 */
/* ------------------------------------------------------------------ */
const strengthOf = (r) => (Math.abs(r) >= 0.6 ? "Strong" : Math.abs(r) >= 0.3 ? "Moderate" : "Weak");
function ConnectedClassic({ scoreOf, label, exclude }) {
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
    <StoryCard title="What Moves With This" controls={controls} data-story="diagnostic-connected" line={`Topics whose scores rise and fall together with ${label} across people. This shows a link, not a cause.`}>
      {rows.length === 0 ? emptyNote("No other topic has enough scores to compare.") : view === "table" ? <DataTable columns={cols} rows={rows} /> : (
        <>
          <EvidenceSection gap={dsSpace[16]}>
            {rows.map((r, i) => (
              <RailRow key={`${i}-${r.label}`} label={r.label} fill={Math.abs(r.r) * 100} color={r.r < 0 ? ds.graph.hotPink : ds.graph.teamBlue} title={`${r.label}: ${strengthOf(r.r).toLowerCase()} link, ${r.r.toFixed(2)}${r.r < 0 ? ", opposite" : ""}`}
                right={<><span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, whiteSpace: "nowrap" }}>{strengthOf(r.r)}{r.r < 0 ? ", opposite" : ""}</span><ScoreNumber value={r.value} /></>} />
            ))}
          </EvidenceSection>
          <p style={noteText}>The bar is the strength of the link and the number is that topic's own score. Links come from how the same people answered, so they point to where to look, not what to change.</p>
        </>
      )}
    </StoryCard>
  );
}
export const ConnectedStory = byStyle(ConnectedClassic, ConnectedStoryLegacy);

/* ------------------------------------------------------------------ */
/* Priority Map                                                         */
/* ------------------------------------------------------------------ */
const QUAD = {
  fix: { name: "Fix first", note: `Scores below ${FLOURISHING_AT} and closely tied to overall well-being`, tone: 0 },
  watch: { name: "Watch", note: `Scores below ${FLOURISHING_AT}, less tied to overall well-being`, tone: 70 },
  protect: { name: "Protect", note: `Scores ${FLOURISHING_AT}+ and closely tied to overall well-being`, tone: 100 },
  maintain: { name: "Maintain", note: `Scores ${FLOURISHING_AT}+, less tied to overall well-being`, tone: null },
};
const QUAD_ORDER = ["fix", "watch", "protect", "maintain"];
const quadOf = (p, medianLink) => (p.score < FLOURISHING_AT ? (p.link >= medianLink ? "fix" : "watch") : p.link >= medianLink ? "protect" : "maintain");
const quadColor = (q) => (QUAD[q].tone == null ? ds.text.tertiary : dsBand(QUAD[q].tone).cs);

function PriorityChart({ rows, medianLink, noun }) {
  const [hover, setHover] = useState(null);
  const W = 776, H = 400, PL = 56, PR = 24, PT = 24, PB = 48;
  const lo = Math.min(...rows.map((p) => p.link)), hi = Math.max(...rows.map((p) => p.link));
  const pad = (hi - lo) * 0.15 || 0.1;
  const yLo = lo - pad, yHi = hi + pad;
  const x = (v) => PL + (v / 100) * (W - PL - PR);
  const y = (v) => PT + (1 - (v - yLo) / (yHi - yLo)) * (H - PT - PB);
  const h = hover != null ? rows[hover] : null;
  const label = { fontFamily: font, fontSize: 12 };
  // Name every part whose name fits near its dot without touching another name, another dot, or a quadrant title: to its
  // right, left, above, then below; otherwise it is left unnamed (hover or tap shows it). Fix first parts are placed first,
  // so when space runs out it's the parts that matter most that keep their names.
  const dotBox = (p) => ({ l: x(p.score) - 8, r: x(p.score) + 8, t: y(p.link) - 8, b: y(p.link) + 8 });
  const titleBox = (qx, qy, anchor, name) => { const w = name.length * 7; const l = anchor === "start" ? qx : qx - w; return { l, r: l + w, t: qy - 13, b: qy + 4 }; };
  const titles = [titleBox(PL + 10, PT + 18, "start", "Fix first"), titleBox(W - PR - 10, PT + 18, "end", "Protect"), titleBox(PL + 10, H - PB - 10, "start", "Watch"), titleBox(W - PR - 10, H - PB - 10, "end", "Maintain")];
  const overlaps = (a, o) => a.l < o.r + 3 && o.l < a.r + 3 && a.t < o.b + 1 && o.t < a.b + 1;
  const taken = [...titles];
  const named = rows.map(() => null);
  const order = rows.map((p, i) => i).sort((a, b) => (rows[a].quad === "fix" ? 0 : 1) - (rows[b].quad === "fix" ? 0 : 1));
  for (const i of order) {
    const p = rows[i];
    const w = p.label.length * 6.4, cx = x(p.score), cy = y(p.link);
    const spots = [
      { side: "start", l: cx + 11, t: cy - 9 },
      { side: "end", l: cx - 11 - w, t: cy - 9 },
      { side: "above", l: cx - w / 2, t: cy - 28 },
      { side: "below", l: cx - w / 2, t: cy + 10 },
    ];
    for (const s of spots) {
      const box = { l: s.l, r: s.l + w, t: s.t, b: s.t + 18 };
      if (box.l < PL || box.r > W - PR + 8 || box.t < PT || box.b > H - PB) continue;
      const clash = taken.some((o) => overlaps(box, o)) || rows.some((q, j) => j !== i && overlaps(box, dotBox(q)));
      if (!clash) { taken.push(box); named[i] = s; break; }
    }
  }
  return (
    <div data-part="priority-plot" style={{ position: "relative", width: "100%", maxWidth: W, margin: "0 auto", aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
        <rect x={PL} y={PT} width={x(FLOURISHING_AT) - PL} height={y(medianLink) - PT} fill={dsBand(0).bg} opacity="0.6" />
        <rect x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} fill="none" stroke={ds.border.tertiary} />
        <line x1={x(FLOURISHING_AT)} x2={x(FLOURISHING_AT)} y1={PT} y2={H - PB} stroke={ds.border.primary} strokeDasharray="5 4" />
        <line x1={PL} x2={W - PR} y1={y(medianLink)} y2={y(medianLink)} stroke={ds.border.primary} strokeDasharray="5 4" />
        {[["fix", PL + 10, PT + 18, "start"], ["protect", W - PR - 10, PT + 18, "end"], ["watch", PL + 10, H - PB - 10, "start"], ["maintain", W - PR - 10, H - PB - 10, "end"]].map(([q, qx, qy, anchor]) => (
          <text key={q} x={qx} y={qy} textAnchor={anchor} {...label} fontWeight="700" fill={quadColor(q)}>{QUAD[q].name}</text>
        ))}
        {[0, 25, 50, 75, 100].map((t) => <text key={t} x={x(t)} y={H - PB + 18} textAnchor="middle" {...label} fill={ds.text.tertiary}>{t}</text>)}
        <text x={(PL + W - PR) / 2} y={H - 8} textAnchor="middle" {...label} fontWeight="600" fill={ds.text.secondary}>Score</text>
        <text transform={`translate(14 ${(PT + H - PB) / 2}) rotate(-90)`} textAnchor="middle" {...label} fontWeight="600" fill={ds.text.secondary}>Link to overall</text>
        {rows.map((p, i) => (
          <g key={`${i}-${p.label}`} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} style={{ cursor: "pointer" }}>
            <circle cx={x(p.score)} cy={y(p.link)} r={hover === i ? 9 : 6.5} fill={dsBand(p.score).c} stroke={ds.surface.general.card} strokeWidth="2" />
            {named[i] && <text x={named[i].side === "start" || named[i].side === "end" ? x(p.score) + (named[i].side === "start" ? 11 : -11) : x(p.score)} y={named[i].t + 13} textAnchor={named[i].side === "start" ? "start" : named[i].side === "end" ? "end" : "middle"} {...label} fontWeight={hover === i ? 700 : 400} fill={ds.text.secondary} style={{ pointerEvents: "none" }}>{p.label}</text>}
          </g>
        ))}
      </svg>
      {h && (
        <TipBox style={{ position: "absolute", left: `${(x(h.score) / W) * 100}%`, top: `${(y(h.link) / H) * 100}%`, width: 220, transform: `translate(${h.score > 70 ? "-100%" : "0"}, -110%)` }}
          content={{ rows: [{ label: h.label, value: h.score, score: true }], note: <>Link to the overall score {h.link.toFixed(2)} · <b style={{ color: quadColor(h.quad) }}>{QUAD[h.quad].name}</b></> }} />
      )}
      <span className="sr-only" style={{ display: "none" }}>{noun}</span>
    </div>
  );
}
/* Compact: the map in miniature. Four quadrant tiles laid out where they sit on the full map (Fix first top-left,
   Protect top-right, Watch bottom-left, Maintain bottom-right), each with its count and its rule; tap one to list its
   parts under it. The list shows each part's link to the overall score as a small meter (not a raw 0.94) and its score.
   Empty quadrants stay in place, quiet and not tappable, so the map's shape still reads. */
const QUAD_GRID = [["fix", "protect"], ["watch", "maintain"]];
const QUAD_SHORT = { fix: `Below ${FLOURISHING_AT} · strong link`, protect: `${FLOURISHING_AT}+ · strong link`, watch: `Below ${FLOURISHING_AT} · weaker link`, maintain: `${FLOURISHING_AT}+ · weaker link` };
function PriorityGroups({ rows, noun }) {
  const counts = Object.fromEntries(QUAD_ORDER.map((q) => [q, rows.filter((r) => r.quad === q).length]));
  const [pick, setPick] = useState(() => QUAD_ORDER.find((q) => counts[q]) || "fix");
  const list = rows.filter((r) => r.quad === pick).sort((a, b) => b.link - a.link);
  const plural = (n) => `${n} ${n === 1 ? noun : `${noun}s`}`;
  return (
    <div data-part="priority-groups" style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], fontFamily: font }}>
      <div role="tablist" aria-label="Priority groups" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: dsSpace[6] }}>
        {QUAD_GRID.flat().map((q) => {
          const on = pick === q, n = counts[q];
          return (
            <button
              key={q} type="button" role="tab" aria-selected={on} disabled={!n} onClick={() => setPick(q)}
              style={{ textAlign: "left", fontFamily: font, cursor: n ? "pointer" : "default", padding: `${dsSpace[8]}px ${dsSpace[12]}px ${dsSpace[12]}px`, borderRadius: dsRadius.lg, boxSizing: "border-box",
                border: `${dsBorder.sm}px solid ${on ? ds.border.strong : ds.border.tertiary}`, background: on ? ds.surface.general.card : n ? ds.surface.general.cardWithinCard : "transparent", boxShadow: on ? dsShadow("sm") : "none",
                display: "flex", flexDirection: "column", gap: 2, opacity: n ? 1 : 0.55, transition: "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease" }}
            >
              <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: dsSpace[8] }}>
                <span style={{ ...dsText("Text xs", 700), color: n ? quadColor(q) : ds.text.tertiary }}>{QUAD[q].name}</span>
                <span style={{ ...dsText("Text lg", 700), color: n ? ds.text.primary : ds.text.quaternary, fontVariantNumeric: "tabular-nums" }}>{n}</span>
              </span>
              <span style={{ ...dsText("Text 3xs"), fontSize: 10, color: ds.text.tertiary }}>{QUAD_SHORT[q]}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" aria-label={QUAD[pick].name}>
        <div style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>{QUAD[pick].name} <span style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>· {plural(list.length)}</span></div>
        <div style={{ ...dsText("Text xs"), color: ds.text.tertiary, marginTop: 2 }}>{QUAD[pick].note}.</div>
        <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 56px 28px", gap: dsSpace[12], marginTop: dsSpace[12], paddingBottom: dsSpace[6], borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, ...dsText("Text 3xs-Header", 600), textTransform: "uppercase", letterSpacing: "0.02em", color: ds.text.quaternary }}>
          <span>{noun}</span><span>Link</span><span style={{ textAlign: "right" }}>Score</span>
        </div>
        {list.map((r, i) => (
          <div key={`${i}-${r.label}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 56px 28px", gap: dsSpace[12], alignItems: "center", minHeight: 40, borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` }}>
            <span style={{ ...dsText("Text sm"), color: ds.text.secondary, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
            <span role="img" aria-label={`Link to overall ${r.link.toFixed(2)}`} title={`Link to overall: ${r.link.toFixed(2)}`} style={{ position: "relative", height: 4, borderRadius: 2, background: ds.bg.quaternary }}>
              <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(1, r.link)) * 100}%`, borderRadius: 2, background: ds.text.tertiary }} />
            </span>
            <ScoreNumber value={r.score} style={{ textAlign: "right" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
function PriorityClassic({ items, noun = "Driver" }) {
  const [view, setView] = useState("chart");
  const pts = priorityPoints(items);
  const sorted = [...pts].sort((a, b) => a.link - b.link);
  const medianLink = sorted[Math.floor(sorted.length / 2)].link;
  const rows = pts.map((p) => ({ ...p, quad: quadOf(p, medianLink) })).sort((a, b) => QUAD_ORDER.indexOf(a.quad) - QUAD_ORDER.indexOf(b.quad) || a.score - b.score);
  const cols = [
    { key: "label", label: noun },
    { key: "score", label: "Score", align: "right", render: (r) => <ScoreCell v={r.score} /> },
    { key: "link", label: "Link to overall", align: "right", render: (r) => r.link.toFixed(2), text: (r) => r.link.toFixed(2) },
    { key: "quad", label: "Priority", render: (r) => QUAD[r.quad].name, text: (r) => QUAD[r.quad].name },
  ];
  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(cols, rows)} />];
  return (
    <StoryCard title="Priority Map" controls={controls} data-story="diagnostic-priority" line={`Where to put effort first. Each ${noun} is placed by its score (across) and how closely it moves with people's overall score (up).`}>
      {view === "table" ? <DataTable columns={cols} rows={rows} /> : (
        <>
          <EvidenceSection>
            <WithWidth>{({ compact }) => (compact ? <PriorityGroups rows={rows} noun={noun} /> : <PriorityChart rows={rows} medianLink={medianLink} noun={noun} />)}</WithWidth>
          </EvidenceSection>
          <WithWidth>{({ compact }) => <p style={noteText}>{compact ? `Tap a group to see its ${noun}s. The split is at a score of ${FLOURISHING_AT} and at the middle link. ` : `Dashed lines split the map at a score of ${FLOURISHING_AT} and at the middle link. ${QUAD.fix.name}: ${QUAD.fix.note.toLowerCase()}. `}Link comes from how the same people answered, so it points to where effort is likely to matter, not a guaranteed result.</p>}</WithWidth>
        </>
      )}
    </StoryCard>
  );
}
export const PriorityMapStory = byStyle(PriorityClassic, PriorityMapStoryLegacy);

/* ------------------------------------------------------------------ */
/* How Scores Are Spread                                                */
/* ------------------------------------------------------------------ */
function SpreadBody({ scoreOf, label }) {
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
      title="How Scores Are Spread" controls={controls} data-story="breakdown-spread"
      line={`Where each of the ${sp.total} people landed on ${label}. The same average can be people who all feel the same, or two very different groups.`}
      note={`Half of people score between ${sp.p25} and ${sp.p75}. The middle score is ${sp.median}.`}
    >
      {view === "table" ? <DataTable columns={cols} rows={rows} /> : (
        <EvidenceSection gap={dsSpace[8]}>
          <WithWidth>{({ compact }) => (
            <div style={{ fontFamily: font, fontVariantNumeric: "tabular-nums", display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
              <p data-part="spread-readout" role="status" style={{ ...sentenceText, minHeight: 18 }}>
                {active ? <><b>{active.n}</b> {active.n === 1 ? "person" : "people"} scored {active.from} to {active.to}</> : compact ? "Tap a bar to see how many people it holds." : "Hover a bar to see how many people it holds."}
              </p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: compact ? 3 : 6, height: H }}>
                {sp.bins.map((b, i) => (
                  <div key={b.from} data-part="spread-bin" onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)} onPointerDown={() => setHover(hover === i ? null : i)} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", cursor: "pointer" }}>
                    <div style={{ width: "100%", height: Math.max(b.n ? 4 : 0, (b.n / max) * H), borderRadius: `${dsRadius.xs}px ${dsRadius.xs}px 0 0`, background: dsBand(b.from + 5).c, opacity: hover == null || hover === i ? 1 : 0.45, transition: "opacity 120ms" }} />
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: ds.border.tertiary }} />
              <div aria-hidden="true" style={{ position: "relative", height: 16, ...dsText("Text 2xs"), color: ds.text.tertiary }}>
                {[[0, "0"], [STRIVING_AT, compact ? String(STRIVING_AT) : `${STRIVING_AT} · Striving`], [FLOURISHING_AT, compact ? String(FLOURISHING_AT) : `${FLOURISHING_AT} · Flourishing`], [100, "100"]].map(([p, t], i, a) => (
                  <span key={p} style={{ position: "absolute", left: `${p}%`, transform: i === 0 ? "none" : i === a.length - 1 ? "translateX(-100%)" : "translateX(-50%)", whiteSpace: "nowrap" }}>{t}</span>
                ))}
              </div>
            </div>
          )}</WithWidth>
        </EvidenceSection>
      )}
    </StoryCard>
  );
}
export const SpreadStory = byStyle(SpreadBody, SpreadStoryLegacy);

/* ------------------------------------------------------------------ */
/* Bright Spots                                                         */
/* ------------------------------------------------------------------ */
function BrightClassic({ scoreOf, label }) {
  const groups = brightSpots(4, scoreOf);
  return (
    <StoryCard title="Bright Spots" data-story="diagnostic-bright" line={`The highest-scoring group on each part of your organisation for ${label}: what is working, and who could share it. Groups with fewer than ${SUPPRESS_BELOW} people are never shown.`}>
      {groups.length === 0 ? emptyNote("No group has 5 or more people yet, so none can be shown.") : (
        <EvidenceSection><CardGrid>{groups.map((g) => <GroupCard key={`${g.axis}-${g.group}`} g={g} count={g.flourishing} word="flourishing" />)}</CardGrid></EvidenceSection>
      )}
    </StoryCard>
  );
}
export const BrightSpotsStory = byStyle(BrightClassic, BrightSpotsStoryLegacy);

/* ------------------------------------------------------------------ */
/* Within Reach                                                         */
/* ------------------------------------------------------------------ */
function ReachClassic({ items, noun = "Driver" }) {
  const rows = withinReach(items, 4);
  return (
    <StoryCard
      title="Within Reach" data-story="diagnostic-reach" line={`The ${plural(noun)} closest to the next status line up. A small improvement here changes how the result reads, so these are good first steps.`}
      note={rows.length ? `Struggling means below ${STRIVING_AT}, Striving ${STRIVING_AT} to ${FLOURISHING_AT - 1}, Flourishing ${FLOURISHING_AT} and over. The dark tick marks the next line up.` : undefined}
    >
      {rows.length === 0 ? emptyNote(`Every ${noun} is already Flourishing.`) : (
        <EvidenceSection gap={dsSpace[16]}>
          {rows.map((r, i) => (
            <RailRow key={`${i}-${r.label}`} label={r.label} fill={r.score} color={dsBand(r.score).c} marker={r.next} title={`${r.label}: ${r.score}, ${r.gap} to ${r.nextName}`}
              right={<><span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, whiteSpace: "nowrap" }}>{r.gap} to {r.nextName}</span><ScoreNumber value={r.score} /></>} />
          ))}
        </EvidenceSection>
      )}
    </StoryCard>
  );
}
export const WithinReachStory = byStyle(ReachClassic, WithinReachStoryLegacy);

/* ------------------------------------------------------------------ */
/* How It Ranks                                                         */
/* ------------------------------------------------------------------ */
function RankClassic({ rank: info, label }) {
  const { rows, rank, total, noun } = info;
  // Up to 14 parts all show; more show the top three, the bottom three, and the places around this one.
  let shown = rows.map((r, i) => ({ ...r, pos: i + 1 }));
  if (rows.length > 14) {
    const keep = new Set([0, 1, 2, rows.length - 1, rows.length - 2, rows.length - 3]);
    for (let k = rank - 3; k <= rank + 1; k++) if (k >= 0 && k < rows.length) keep.add(k);
    shown = [...keep].sort((a, b) => a - b).map((i) => ({ ...rows[i], pos: i + 1 }));
  }
  return (
    <StoryCard
      title="How It Ranks" data-story="diagnostic-rank"
      line={`${label} is ${rank === 1 ? "the highest-scoring" : rank === total ? "the lowest-scoring" : `number ${rank} of ${total} among all`} ${noun}${rank === 1 || rank === total ? ` of ${total}` : "s"}, best first.`}
      note={rows.length > shown.length ? "Showing the top and bottom three and the places around this one." : undefined}
    >
      <EvidenceSection gap={dsSpace[12]}>
        {shown.map((r, i) => {
          const me = r.label === label;
          const gap = i > 0 && r.pos - shown[i - 1].pos > 1;
          return (
            <div key={`${r.pos}-${r.label}`} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
              {gap && <span aria-hidden="true" style={{ ...dsText("Text 2xs"), color: ds.text.quaternary, paddingLeft: dsSpace[8] }}>···</span>}
              <RailRow label={r.label} fill={r.score} color={dsBand(r.score).c} highlight={me} title={`${r.label}: number ${r.pos}, score ${r.score}`}
                lead={<span style={{ ...dsText("Text 2xs", me ? 700 : 400), color: ds.text.tertiary, minWidth: 18, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.pos}</span>}
                right={<ScoreNumber value={r.score} />} />
            </div>
          );
        })}
      </EvidenceSection>
    </StoryCard>
  );
}
export const RankStory = byStyle(RankClassic, RankStoryLegacy);

/* ------------------------------------------------------------------ */
/* Who Is Where                                                         */
/* ------------------------------------------------------------------ */
const STATUS_TONE = { Flourishing: 100, Striving: 70, Struggling: 0 };
/* parts: [{ label, color, counts: number[] per round }]. A part named after a status takes that status's colour. */
function WhoIsWhereClassic({ title = "Who Is Where", line, parts, unit = "people", hint }) {
  const [view, setView] = useState("chart");
  const cmp = useCompare();
  const refName = roundName(cmp.refIdx);
  const total = (i) => parts.reduce((a, p) => a + p.counts[i], 0) || 1;
  const rows = parts.map((p) => ({ label: p.label, color: STATUS_TONE[p.label] != null ? dsBand(STATUS_TONE[p.label]).c : p.color, text: STATUS_TONE[p.label] != null ? dsBand(STATUS_TONE[p.label]).cs : ds.text.primary, n: p.counts[LAST], pct: Math.round((p.counts[LAST] / total(LAST)) * 100), prevN: p.counts[cmp.refIdx], delta: p.counts[LAST] - p.counts[cmp.refIdx] }));
  const columns = [
    { key: "label", label: "Group" },
    ...(cmp.on ? [{ key: "prevN", label: refName, align: "right" }] : []),
    { key: "n", label: "Now", align: "right" },
    { key: "pct", label: "Share", align: "right", render: (r) => `${r.pct}%`, text: (r) => `${r.pct}%` },
    { key: "delta", label: cmp.on ? `Change from ${refName}` : "Change from previous round", align: "right", render: (r) => <TrendPill delta={r.delta} numberOnly />, text: (r) => (r.delta > 0 ? `+${r.delta}` : r.delta) },
  ];
  const controls = [<CompareControl key="c" cmp={cmp} />, <ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="t" getText={() => tableText(columns, rows)} />];
  return (
    <StoryCard title={title} controls={controls} line={line} data-story="breakdown-who">
      {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
        <EvidenceSection gap={dsSpace[16]}>
          <div data-part="split-bar" role="img" aria-label={rows.map((r) => `${r.label}: ${r.n}`).join(", ")} style={{ display: "flex", height: dsSpace[8], borderRadius: dsRadius.full, overflow: "hidden" }}>
            {rows.filter((r) => r.n > 0).map((r) => <div key={r.label} title={`${r.label}: ${r.n}`} style={{ flex: r.n, background: r.color }} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
            {rows.map((r) => (
              <div key={r.label} data-part="split-row" style={{ display: "flex", alignItems: "center", gap: dsSpace[8], rowGap: dsSpace[4], flexWrap: "wrap", fontFamily: font }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                <span style={{ flex: "1 1 120px", minWidth: 0, ...dsText("Text sm", 700), color: ds.text.secondary }}>{r.label}</span>
                {cmp.on ? <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{refName}: {r.prevN} →</span> : r.delta !== 0 && <TrendPill delta={r.delta} numberOnly />}
                <span style={{ ...dsText("Text md", 700), color: r.text, fontVariantNumeric: "tabular-nums" }}>{r.n} <span style={{ ...dsText("Text 2xs"), fontWeight: 400, color: ds.text.tertiary }}>{unit}</span></span>
                <span style={{ ...dsText("Text xs"), color: ds.text.tertiary, minWidth: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.pct}%</span>
              </div>
            ))}
          </div>
        </EvidenceSection>
      )}
      {hint && view === "chart" && <p style={noteText}>{hint}</p>}
    </StoryCard>
  );
}
export const SplitBreakdownStory = byStyle(WhoIsWhereClassic, SplitBreakdownStoryLegacy);
