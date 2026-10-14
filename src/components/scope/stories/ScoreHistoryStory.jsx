import { useStoryStyle } from "./storyStyle.js";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight } from "lucide-react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { ROUNDS } from "../../../lib/dataset.js";
import { LAST, fmtMonth, fmtDate } from "../../../lib/scopeData.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import { StoryCard } from "./StoryCard.jsx";
import { ViewSwitch, CopyTable } from "./controls.jsx";
import { DataTable, ScoreCell, tableText } from "./DataTable.jsx";
import { HistoryCards } from "./HistoryCards.jsx";
import HistoryLineChart from "./HistoryLineChart.jsx";
import { useStoryWidth } from "./storyWidth.js";

/* ================================================================== */
/* SCORE HISTORY STORY — the Trend Story for a score and its parts       */
/* (Figma 984qJvMt7fCHASYHRwgrab, node 13622:37494).                      */
/*   1. History cards: one per round, newest first. Picking a card picks   */
/*      WHICH change to look at — that round against the one before it.    */
/*   2. "Explorer Changes": one row per part (an Explorer, or a Driver).   */
/*      A small dot is its score the round before, the ringed dot its score */
/*      in the picked round, and a bar joins them — green if it rose, red   */
/*      if it fell. Hover a row for its numbers.                           */
/*   3. Pick a row and it expands, in place, into that part's own line      */
/*      graph across every round. Pick it again to fold it away.           */
/* Table View is the series × rounds matrix. No Compare toggle — the       */
/* Story is already about change over rounds.                              */
/* ================================================================== */
const LABEL_W = 168;
const ROW_H = 32;
const DELTA_W = 56; // the change as a number, right of the track (designed width only)
const AXIS_TICKS = [0, 20, 40, 60, 80, 100];
const spring = { type: "spring", bounce: 0, duration: 0.35 };
const refinedEyebrow = { fontSize: 13, fontWeight: 600, color: T.gray600, fontFamily: font };
const eyebrowStyle = { fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: T.gray700, fontFamily: font };

export default function ScoreHistoryStory({ title = "Your Score History", line = "Explore your past performance and trends in this detailed score history.", overall, items, noun = "Explorer" }) {
  const refined = useStoryStyle() === "refined";
  const [view, setView] = useState("chart");
  const [sel, setSel] = useState(LAST);
  const [open, setOpen] = useState(null); // label of the expanded row
  const [hoverRow, setHoverRow] = useState(null);

  const rows = items.map((it) => ({ label: it.label, values: it.values, prev: sel > 0 ? it.values[sel - 1] : null, cur: it.values[sel] }));
  const hovered = hoverRow != null ? rows.find((r) => r.label === hoverRow) : null;

  // Table view: the series × rounds matrix (overall first), as on every Trend Story.
  const matrix = [{ label: "Overall Score", values: overall }, ...items];
  const cols = [
    { key: "label", label: noun },
    ...ROUNDS.map((r, i) => ({ key: `r${i}`, label: fmtMonth(r.date), align: "right", render: (row) => <ScoreCell v={row.values[i]} />, text: (row) => row.values[i] ?? "" })),
  ];
  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(cols, matrix)} />];

  return (
    <StoryCard title={title} controls={controls} line={line}>
      {view === "table" ? (
        <DataTable columns={cols} rows={matrix} />
      ) : (
        <>
          <HistoryCards values={overall} sel={sel} onSelect={(i) => { setSel(i); }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: font }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900, paddingBottom: 6, borderBottom: `1px solid ${T.gray300}` }}>{noun} Changes</span>
            <span style={{ fontSize: 13, color: T.gray500 }}>{sel > 0 ? `${fmtDate(ROUNDS[sel].date)} against ${fmtDate(ROUNDS[sel - 1].date)}.` : `${fmtDate(ROUNDS[sel].date)} — the first round, so there is nothing earlier to compare with.`} Pick {noun === "Explorer" ? "an" : "a"} {noun} to see its history.</span>
          </div>
          <Dumbbell rows={rows} hovered={hovered} onHover={setHoverRow} open={open} onToggle={(l) => setOpen((o) => (o === l ? null : l))} />
        </>
      )}
    </StoryCard>
  );
}

/* The changes chart. At the designed width it is the design's: names on the left, a 0 to 100 track, and (new) the change
   as a number on the right. On a compact card (a phone, a narrow Scope) a 168px name column would leave a track too
   short to see a 3-point move, so each part becomes two lines: its name, change and score on top, a full-width track
   under it, and the track is zoomed to the range the scores actually span (it says where it starts), so a move of a few
   points is still a visible bar. */
function Dumbbell({ rows, hovered, onHover, open, onToggle }) {
  const refined = useStoryStyle() === "refined";
  const { compact } = useStoryWidth();
  const [chartHover, setChartHover] = useState(false);
  const alpha = chartHover ? "99" : "47"; // pastel at rest, stronger while the chart is hovered
  const all = rows.flatMap((r) => [r.cur, r.prev]).filter((v) => v != null);
  const lo = compact && all.length ? Math.max(0, Math.floor((Math.min(...all) - 6) / 10) * 10) : 0;
  const hi = compact && all.length ? Math.min(100, Math.ceil((Math.max(...all) + 6) / 10) * 10) : 100;
  const span = Math.max(10, hi - lo);
  const pos = (v) => ((v - lo) / span) * 100;
  const step = span > 60 ? 20 : 10;
  const ticks = compact ? Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => lo + i * step) : AXIS_TICKS;
  const LW = compact ? 0 : LABEL_W;
  const inset = compact ? 8 : 16;

  const track = (r, hasPrev, up) => (
    <div style={{ position: "relative", flex: compact ? "0 0 24px" : 1, height: compact ? 24 : "100%", margin: compact ? `0 ${inset}px` : "0 0 0 0" }}>
      <div style={{ position: "absolute", left: compact ? 0 : inset, right: compact ? 0 : inset, top: 0, bottom: 0 }}>
        {compact && <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: T.gray75 }} />}
        {hasPrev && r.cur !== r.prev && <span style={{ position: "absolute", top: "50%", height: compact ? 8 : 6, marginTop: compact ? -4 : -3, borderRadius: compact ? 4 : 0, left: `${pos(Math.min(r.prev, r.cur))}%`, width: `${Math.abs(pos(r.cur) - pos(r.prev))}%`, background: `${up ? T.green : T.red}${compact ? "b3" : alpha}`, transition: "background 150ms ease" }} />}
        {hasPrev && <span style={{ position: "absolute", top: "50%", left: `${pos(r.prev)}%`, width: 8, height: 8, margin: "-4px 0 0 -4px", borderRadius: "50%", background: T.gray900 }} />}
        <span style={{ position: "absolute", top: "50%", left: `${pos(r.cur)}%`, width: 16, height: 16, margin: "-8px 0 0 -8px", boxSizing: "border-box", borderRadius: "50%", background: T.white, border: `2px solid ${T.gray900}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.gray900 }} />
        </span>
        {!compact && hovered?.label === r.label && (
          <div style={{ position: "absolute", bottom: "100%", left: `${pos(r.cur)}%`, transform: `translate(${r.cur > 70 ? "-85%" : r.cur < 25 ? "-10%" : "-50%"}, -6px)`, zIndex: 4, pointerEvents: "none", width: 200, background: T.gray25, borderRadius: radius.lg, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 17px 5px rgba(0,0,0,0.01), 0 11px 4px rgba(0,0,0,0.02), 0 6px 4px rgba(0,0,0,0.05), 0 3px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.09)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.gray700 }}>{r.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: `2px solid ${band(r.cur).c}`, padding: "2px 0 2px 6px" }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.gray900 }}>Your Score</span>
              {hasPrev && r.cur !== r.prev && <TrendPill delta={r.cur - r.prev} numberOnly />}
              <span style={{ fontSize: 16, fontWeight: 700, color: band(r.cur).cs }}>{r.cur}</span>
            </div>
            {hasPrev && <span style={{ fontSize: 12, color: T.gray500 }}>Was {r.prev}</span>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative", fontFamily: font }} onMouseEnter={() => setChartHover(true)} onMouseLeave={() => { setChartHover(false); onHover(null); }}>
      {/* the dashed guide at the hovered row's current score */}
      {!compact && hovered && (
        <div style={{ position: "absolute", top: 0, bottom: 36, left: LW, right: DELTA_W, pointerEvents: "none", zIndex: 1 }}>
          <div style={{ position: "absolute", left: `calc(${inset}px + (100% - ${inset * 2}px) * ${hovered.cur / 100})`, top: 0, bottom: 0, borderLeft: `1px dashed ${T.gray300}` }} />
        </div>
      )}
      <div style={{ borderTop: `1px solid ${T.gray75}` }}>
        {rows.map((r) => {
          const hasPrev = r.prev != null;
          const up = hasPrev && r.cur > r.prev, down = hasPrev && r.cur < r.prev;
          const isOpen = open === r.label;
          const chev = <ChevronRight size={12} color={T.gray300} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 150ms ease", flexShrink: 0 }} />;
          const change = hasPrev && (up || down) ? <TrendPill delta={r.cur - r.prev} numberOnly /> : hasPrev ? <span style={{ fontSize: 11, color: T.gray500 }}>No change</span> : null;
          return (
            <div key={r.label} style={{ borderBottom: `1px solid ${T.gray75}` }}>
              <div
                role="button" tabIndex={0} aria-expanded={isOpen} onClick={() => onToggle(r.label)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(r.label))}
                onMouseEnter={() => onHover(r.label)}
                style={compact
                  ? { display: "flex", flexDirection: "column", gap: 2, padding: "10px 0 6px", cursor: "pointer", background: isOpen ? T.gray25 : "transparent" }
                  : { display: "flex", alignItems: "center", height: ROW_H, cursor: "pointer", background: isOpen ? T.gray25 : "transparent" }}
              >
                {compact ? (
                  <>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, padding: `0 ${inset}px 0 4px`, minHeight: 24 }}>
                      {chev}
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: "16px", color: T.gray900, fontWeight: isOpen ? 700 : 500 }}>{r.label}</span>
                      {change}
                      <span style={{ fontSize: 16, fontWeight: 700, color: band(r.cur).cs, minWidth: 24, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.cur}</span>
                    </span>
                    {track(r, hasPrev, up)}
                  </>
                ) : (
                  <>
                    <span style={{ flex: `0 0 ${LABEL_W}px`, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 4, paddingRight: 16, fontSize: 12, color: T.gray700, fontWeight: isOpen ? 700 : 400, lineHeight: "14px" }}>
                      {chev}
                      <span style={{ flex: 1, textAlign: "right" }}>{r.label}</span>
                    </span>
                    <div style={{ position: "relative", flex: 1, height: "100%", margin: "0 0 0 0", display: "flex" }}>{track(r, hasPrev, up)}</div>
                    <span style={{ flex: `0 0 ${DELTA_W}px`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, paddingRight: 4 }}>{change && hasPrev && (up || down) ? change : null}</span>
                  </>
                )}
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key="open" onMouseEnter={() => onHover(null)} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} style={{ overflow: "hidden", background: T.gray25 }}>
                    <div style={{ padding: compact ? "12px 12px 8px" : "16px 16px 8px" }}>
                      <span style={{ ...(refined ? refinedEyebrow : eyebrowStyle), display: "block", marginBottom: 12 }}>{r.label} across every round</span>
                      <HistoryLineChart values={r.values} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      {compact ? (
        <div style={{ padding: `8px ${inset}px 0`, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ position: "relative", height: 16, borderTop: `1px solid ${T.gray300}` }}>
            {ticks.map((t, i) => (
              <span key={t} style={{ position: "absolute", top: 4, left: `${pos(t)}%`, transform: i === 0 ? "none" : i === ticks.length - 1 ? "translateX(-100%)" : "translateX(-50%)", fontSize: 11, color: T.gray500, fontWeight: i === 0 || i === ticks.length - 1 ? 700 : 400 }}>{t}</span>
            ))}
          </div>
          <span style={{ fontSize: 11, color: T.gray500, lineHeight: "14px" }}>Score. {lo > 0 || hi < 100 ? `The scale runs from ${lo} to ${hi} so small moves show.` : ""} Small dot: the round before. Ringed dot: this round.</span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", height: 36 }}>
          <span style={{ flex: `0 0 ${LABEL_W}px`, boxSizing: "border-box", paddingRight: 16, textAlign: "right", fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", color: T.gray700 }}>SCORE</span>
          <div style={{ position: "relative", flex: 1, height: "100%" }}>
            <div style={{ position: "absolute", left: inset, right: inset, top: 0, bottom: 0, borderTop: `1px solid ${T.gray300}` }}>
              {ticks.map((t, i) => (
                <span key={t} style={{ position: "absolute", top: 8, left: `${pos(t)}%`, transform: "translateX(-50%)", fontSize: 11, fontWeight: i === 0 || i === ticks.length - 1 ? 700 : 400, color: T.gray500 }}>{t}</span>
              ))}
            </div>
          </div>
          <span style={{ flex: `0 0 ${DELTA_W}px` }} />
        </div>
      )}
    </div>
  );
}
