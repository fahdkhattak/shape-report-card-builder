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

function Dumbbell({ rows, hovered, onHover, open, onToggle }) {
  const refined = useStoryStyle() === "refined";
  const [chartHover, setChartHover] = useState(false);
  const alpha = chartHover ? "99" : "47"; // pastel at rest, stronger while the chart is hovered
  return (
    <div style={{ position: "relative", fontFamily: font }} onMouseEnter={() => setChartHover(true)} onMouseLeave={() => { setChartHover(false); onHover(null); }}>
      {/* the dashed guide at the hovered row's current score */}
      {hovered && (
        <div style={{ position: "absolute", top: 0, bottom: 36, left: LABEL_W, right: 0, pointerEvents: "none", zIndex: 1 }}>
          <div style={{ position: "absolute", left: `calc(16px + (100% - 32px) * ${hovered.cur / 100})`, top: 0, bottom: 0, borderLeft: `1px dashed ${T.gray300}` }} />
        </div>
      )}
      <div style={{ borderTop: `1px solid ${T.gray75}` }}>
        {rows.map((r) => {
          const hasPrev = r.prev != null;
          const up = hasPrev && r.cur > r.prev, down = hasPrev && r.cur < r.prev;
          const isOpen = open === r.label;
          return (
            <div key={r.label} style={{ borderBottom: `1px solid ${T.gray75}` }}>
              <div
                role="button" tabIndex={0} aria-expanded={isOpen} onClick={() => onToggle(r.label)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(r.label))}
                onMouseEnter={() => onHover(r.label)}
                style={{ display: "flex", alignItems: "center", height: ROW_H, cursor: "pointer", background: isOpen ? T.gray25 : "transparent" }}
              >
                <span style={{ flex: `0 0 ${LABEL_W}px`, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 4, paddingRight: 16, fontSize: 12, color: T.gray700, fontWeight: isOpen ? 700 : 400, lineHeight: "14px" }}>
                  <ChevronRight size={12} color={T.gray300} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 150ms ease", flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: "right" }}>{r.label}</span>
                </span>
                <div style={{ position: "relative", flex: 1, height: "100%", margin: "0 16px 0 0" }}>
                  <div style={{ position: "absolute", left: 16, right: 0, top: 0, bottom: 0 }}>
                    {hasPrev && r.cur !== r.prev && <span style={{ position: "absolute", top: "50%", height: 6, marginTop: -3, left: `${Math.min(r.prev, r.cur)}%`, width: `${Math.abs(r.cur - r.prev)}%`, background: `${up ? T.green : T.red}${alpha}`, transition: "background 150ms ease" }} />}
                    {hasPrev && <span style={{ position: "absolute", top: "50%", left: `${r.prev}%`, width: 8, height: 8, margin: "-4px 0 0 -4px", borderRadius: "50%", background: T.gray900 }} />}
                    <span style={{ position: "absolute", top: "50%", left: `${r.cur}%`, width: 16, height: 16, margin: "-8px 0 0 -8px", boxSizing: "border-box", borderRadius: "50%", background: T.white, border: `2px solid ${T.gray900}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.gray900 }} />
                    </span>
                    {hovered?.label === r.label && (
                      <div style={{ position: "absolute", bottom: "100%", left: `${r.cur}%`, transform: `translate(${r.cur > 70 ? "-85%" : r.cur < 25 ? "-10%" : "-50%"}, -6px)`, zIndex: 4, pointerEvents: "none", width: 200, background: T.gray25, borderRadius: radius.lg, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 17px 5px rgba(0,0,0,0.01), 0 11px 4px rgba(0,0,0,0.02), 0 6px 4px rgba(0,0,0,0.05), 0 3px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.09)" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.gray700 }}>{r.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: `2px solid ${band(r.cur).c}`, padding: "2px 0 2px 6px" }}>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.gray900 }}>Your Score</span>
                          {(up || down) && <TrendPill delta={r.cur - r.prev} numberOnly />}
                          <span style={{ fontSize: 16, fontWeight: 700, color: band(r.cur).cs }}>{r.cur}</span>
                        </div>
                        {hasPrev && <span style={{ fontSize: 12, color: T.gray500 }}>Was {r.prev}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key="open" onMouseEnter={() => onHover(null)} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} style={{ overflow: "hidden", background: T.gray25 }}>
                    <div style={{ padding: "16px 16px 8px" }}>
                      <span style={{ ...(refined ? refinedEyebrow : eyebrowStyle), display: "block", marginBottom: 8 }}>{r.label} across every round</span>
                      <HistoryLineChart values={r.values} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", height: 36 }}>
        <span style={{ flex: `0 0 ${LABEL_W}px`, boxSizing: "border-box", paddingRight: 16, textAlign: "right", fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", color: T.gray700 }}>SCORE</span>
        <div style={{ position: "relative", flex: 1, height: "100%", margin: "0 16px 0 0" }}>
          <div style={{ position: "absolute", left: 16, right: 0, top: 0, bottom: 0, borderTop: `1px solid ${T.gray300}` }}>
            {AXIS_TICKS.map((t, i) => (
              <span key={t} style={{ position: "absolute", top: 8, left: `${t}%`, transform: "translateX(-50%)", fontSize: 11, fontWeight: i === 0 || i === AXIS_TICKS.length - 1 ? 700 : 400, color: T.gray500 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
