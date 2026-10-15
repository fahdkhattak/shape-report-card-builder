import { useStoryStyle } from "./storyStyle.js";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { T, font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsSpace, dsRadius } from "../../../lib/ds.js";
import { ROUNDS } from "../../../lib/dataset.js";
import { LAST, fmtMonth, fmtDate } from "../../../lib/scopeData.js";
import { StoryCard } from "./StoryCard.jsx";
import { ViewSwitch, CopyTable } from "./controls.jsx";
import { HistoryCards } from "./HistoryCards.jsx";
import { DataTable, ScoreCell, tableText } from "./DataTable.jsx";
import HistoryLineChart from "./HistoryLineChart.jsx";
import { useStoryWidth } from "./storyWidth.js";
import { ShowAll } from "./BreakdownStory.jsx";

/* ================================================================== */
/* SCORE HISTORY STORY — the Trend Story for a score and its parts       */
/* (Figma 984qJvMt7fCHASYHRwgrab, node 13622:37494).                      */
/*   1. History cards: one per round, newest first. Picking a card picks   */
/*      WHICH change to look at — that round against the one before it.    */
/*   2. "Explorer changes": one row per part, biggest rise first. A hollow */
/*      dot is its score the round before, a solid dot its score in the    */
/*      picked round, a soft bar joins them; the change and the score sit  */
/*      at the end of every row (no tooltip needed).                       */
/*   3. Pick a row and it expands, in place, into that part's own line      */
/*      graph across every round. Pick it again to fold it away.           */
/* Table View is the series × rounds matrix. No Compare toggle — the       */
/* Story is already about change over rounds.                              */
/* ================================================================== */
const spring = { type: "spring", bounce: 0, duration: 0.35 };
const refinedEyebrow = { fontSize: 13, fontWeight: 600, color: T.gray600, fontFamily: font };

export default function ScoreHistoryStory({ title = "Your Score History", line = "Explore your past performance and trends in this detailed score history.", overall, items, noun = "Explorer" }) {
  const refined = useStoryStyle() === "refined";
  const [view, setView] = useState("chart");
  const [sel, setSel] = useState(LAST);
  const [open, setOpen] = useState(null); // label of the expanded row
  const [, setHoverRow] = useState(null);

  const rows = items.map((it) => ({ label: it.label, values: it.values, prev: sel > 0 ? it.values[sel - 1] : null, cur: it.values[sel] }));

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
          {/* Top half: the round cards and the "Explorer Changes" heading as designed; the changes list under it is the
              tidied one (redesign pass). */}
          <HistoryCards values={overall} sel={sel} onSelect={setSel} />
          <ChangesHead sel={sel} noun={noun} />
          <Dumbbell rows={rows} noun={noun} onHover={setHoverRow} open={open} onToggle={(l) => setOpen((o) => (o === l ? null : l))} />
        </>
      )}
    </StoryCard>
  );
}

/* The changes chart (redesigned for neatness). One grid for every row: name | track | change | score. Rows run from
   the biggest rise to the biggest fall, so the story reads top to bottom. The track is zoomed to the range the scores
   span (ticks and soft gridlines on top), a hollow dot is the earlier round and a solid dot in the status colour is the
   picked round, joined by a soft green or red bar. Every row shows its numbers, so there is no tooltip; hovering tints
   the row and picking it opens that part's line across every round. On a phone the track drops under the name line and
   the five biggest moves show until "Show all". */
const GRID_W = "minmax(132px, 196px) minmax(0, 1fr) 44px 32px";
function Dumbbell({ rows, onHover, open, onToggle, noun }) {
  const refined = useStoryStyle() === "refined";
  const { compact } = useStoryWidth();
  const [showAll, setShowAll] = useState(false);
  const all = rows.flatMap((r) => [r.cur, r.prev]).filter((v) => v != null);
  const lo = all.length ? Math.max(0, Math.floor((Math.min(...all) - 4) / 10) * 10) : 0;
  const hi = all.length ? Math.min(100, Math.ceil((Math.max(...all) + 4) / 10) * 10) : 100;
  const span = Math.max(10, hi - lo);
  const step = span > 60 ? 20 : 10;
  const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => lo + i * step);
  const pos = (v) => ((v - lo) / span) * 100;
  const delta = (r) => (r.prev == null ? null : r.cur - r.prev);
  const ordered = [...rows].sort((a, b) => (delta(b) ?? -999) - (delta(a) ?? -999));
  const limit = compact ? 5 : 12;
  const cut = ordered.length > limit + 2;
  const shown = cut && !showAll ? ordered.slice(0, limit) : ordered;

  const grid = (
    <span aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
      {ticks.map((t) => <span key={t} style={{ position: "absolute", top: 0, bottom: 0, left: `${pos(t)}%`, borderLeft: `1px solid ${ds.border.tertiary}` }} />)}
    </span>
  );
  const track = (r) => {
    const d = delta(r);
    const up = d > 0;
    const b = dsBand(r.cur);
    return (
      <span style={{ position: "relative", display: "block", height: compact ? 20 : "100%", minHeight: 20 }}>
        {compact ? <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: `1px solid ${ds.border.tertiary}` }} /> : grid}
        {d != null && d !== 0 && <span style={{ position: "absolute", top: "50%", height: 4, marginTop: -2, borderRadius: 2, left: `${pos(Math.min(r.prev, r.cur))}%`, width: `${Math.abs(pos(r.cur) - pos(r.prev))}%`, background: up ? ds.status.success.graph : ds.status.error.graph, opacity: 0.4 }} />}
        {r.prev != null && <span style={{ position: "absolute", top: "50%", left: `${pos(r.prev)}%`, width: 9, height: 9, margin: "-4.5px 0 0 -4.5px", boxSizing: "border-box", borderRadius: "50%", background: ds.surface.general.card, border: `1.5px solid ${ds.border.strong}` }} />}
        <span style={{ position: "absolute", top: "50%", left: `${pos(r.cur)}%`, width: 11, height: 11, margin: "-5.5px 0 0 -5.5px", borderRadius: "50%", background: b.c, boxShadow: `0 0 0 2px ${ds.surface.general.card}` }} />
      </span>
    );
  };
  const changeText = (d) => (d == null ? <span style={{ color: ds.text.quaternary }}>–</span> : d === 0 ? <span style={{ color: ds.text.quaternary }}>0</span> : <span style={{ color: d > 0 ? ds.status.success.textIndicator : ds.status.error.text }}>{d > 0 ? "+" : "−"}{Math.abs(d)}</span>);
  const num = { fontVariantNumeric: "tabular-nums", textAlign: "right", whiteSpace: "nowrap" };

  return (
    <div style={{ fontFamily: font }} onMouseLeave={() => onHover(null)}>
      {/* the scale, once, aligned with the tracks */}
      <div aria-hidden="true" style={compact ? { position: "relative", height: 14, margin: "0 6px 6px" } : { display: "grid", gridTemplateColumns: GRID_W, columnGap: 12, padding: "0 8px 6px", height: 14 }}>
        {!compact && <span />}
        <span style={{ position: "relative", display: "block", height: 14 }}>
          {ticks.map((t, i) => <span key={t} style={{ position: "absolute", left: `${pos(t)}%`, transform: i === 0 ? "none" : i === ticks.length - 1 ? "translateX(-100%)" : "translateX(-50%)", ...dsText("Text 3xs", 500), fontSize: 10, lineHeight: "14px", color: ds.text.quaternary, fontVariantNumeric: "tabular-nums" }}>{t}</span>)}
        </span>
      </div>
      <div role="list" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {shown.map((r) => {
          const isOpen = open === r.label;
          const d = delta(r);
          const b = dsBand(r.cur);
          return (
            <div key={r.label} role="listitem">
              <div
                role="button" tabIndex={0} aria-expanded={isOpen} aria-label={`${r.label}: ${r.cur}${d != null ? `, ${d > 0 ? "up" : d < 0 ? "down" : "no change"} ${d ? Math.abs(d) : ""}` : ""}. Show its history.`}
                onClick={() => onToggle(r.label)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(r.label))}
                onMouseEnter={() => onHover(r.label)}
                className="sh-row"
                style={compact
                  ? { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto 28px", columnGap: 8, rowGap: 4, alignItems: "center", padding: "8px 6px", borderRadius: dsRadius.md, cursor: "pointer", background: isOpen ? ds.interactive.ghostHover : undefined }
                  : { display: "grid", gridTemplateColumns: GRID_W, columnGap: 12, alignItems: "center", height: 34, padding: "0 8px", borderRadius: dsRadius.md, cursor: "pointer", background: isOpen ? ds.interactive.ghostHover : undefined }}
              >
                <span style={{ ...dsText("Text sm", isOpen ? 600 : 400), color: ds.text.secondary, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                {!compact && track(r)}
                <span style={{ ...dsText("Text xs", 600), ...num }}>{changeText(d)}</span>
                <span style={{ ...dsText("Text sm", 700), ...num, color: b.cs }}>{r.cur}</span>
                {compact && <span style={{ gridColumn: "1 / -1" }}>{track(r)}</span>}
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key="open" onMouseEnter={() => onHover(null)} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} style={{ overflow: "hidden" }}>
                    <div style={{ margin: "4px 0 10px", padding: compact ? "12px 12px 8px" : "16px 16px 8px", background: ds.surface.general.cardWithinCard, borderRadius: dsRadius.lg }}>
                      <span style={{ ...(refined ? refinedEyebrow : { ...dsText("Text xs", 600), color: ds.text.tertiary }), display: "block", marginBottom: 12 }}>{r.label} across every round</span>
                      <HistoryLineChart values={r.values} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      {cut && <div style={{ paddingTop: 10 }}><ShowAll open={showAll} total={ordered.length} onToggle={() => setShowAll((v) => !v)} /></div>}
      {!rows.length && <p style={{ margin: 0, ...dsText("Text sm"), color: ds.text.tertiary }}>There are no {noun.toLowerCase()}s to compare yet.</p>}
    </div>
  );
}

function ChangesHead({ sel, noun }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: font }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900, paddingBottom: 6, borderBottom: `1px solid ${T.gray300}` }}>{noun} Changes</span>
      <span style={{ fontSize: 13, color: T.gray500 }}>{sel > 0 ? `${fmtDate(ROUNDS[sel].date)} against ${fmtDate(ROUNDS[sel - 1].date)}.` : `${fmtDate(ROUNDS[sel].date)} is the first round, so there is nothing earlier to compare with.`} Pick {noun === "Explorer" ? "an" : "a"} {noun} to see its history.</span>
    </div>
  );
}
