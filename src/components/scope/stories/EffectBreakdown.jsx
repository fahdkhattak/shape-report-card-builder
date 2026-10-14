import { useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace } from "../../../lib/ds.js";
import { StoryCard, EvidenceSection } from "./StoryCard.jsx";
import { ViewSwitch, CopyTable } from "./controls.jsx";
import { DataTable, tableText } from "./DataTable.jsx";
import { useStoryWidth } from "./storyWidth.js";
import { RULES } from "./breakdownRules.js";
import { ShowAll } from "./BreakdownStory.jsx";

/* ================================================================== */
/* EFFECT BREAKDOWN: "What's Shaping Your Health Age" (Figma             */
/* 13622:36697). One row per driver: its name (right-aligned, small), a   */
/* pill saying how much younger or older it makes you, and a bar that     */
/* grows left from a centre line for younger (green) or right for older   */
/* (red). A driver with no effect gets a grey "No calculated effect" pill. */
/* rows: [{ label, months }]  months < 0 is younger, > 0 older, null = none */
/* ================================================================== */
const SCALE = 26; // months at which a bar has grown to about 63% of its half-track
/* Bar length as a share of the half-track. The design's bars are hand-set (6 mo = 20%, 11 mo = 32%, 20 mo = 41%),
   so this is a saturating curve fitted to them: long effects keep growing but never reach the edge. */
export const effectShare = (m) => 100 * (1 - Math.exp(-Math.abs(m) / SCALE));

export function monthsText(m) {
  const a = Math.abs(m), y = Math.floor(a / 12), mo = a % 12;
  return { y, mo };
}

function EffectPill({ months, fit }) {
  const none = months == null || months === 0;
  const older = months > 0;
  const st = older ? ds.status.error : ds.status.success;
  const { y, mo } = none ? { y: 0, mo: 0 } : monthsText(months);
  return (
    <span data-part="pill" style={{ width: fit ? undefined : 115, minWidth: fit ? 115 : undefined, padding: fit ? "0 8px" : undefined, height: 20, flexShrink: 0, boxSizing: "border-box", borderRadius: 46, background: none ? ds.bg.primary : st.bg, color: none ? ds.text.quaternary : st.textIndicator, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3, ...dsText("Text 3xs-Trim"), whiteSpace: "nowrap" }}>
      {none ? "No calculated effect" : (
        <>
          {y > 0 && <><b>{y}</b> yr</>}
          {mo > 0 && <><b>{mo}</b> mo</>}
          <b>{older ? "older" : "younger"}</b>
        </>
      )}
    </span>
  );
}

export default function EffectBreakdownStory({ title = "What's Shaping Your Health Age", line = "See how each driver impacts your Health Age.", rows, sample = false }) {
  const [view, setView] = useState("chart");
  // More than 12 drivers: show the first 10 until someone asks for all (the table always has every row).
  const [showAll, setShowAll] = useState(false);
  const lim = RULES.health.firstRows;
  const cut = rows.length > lim + 2;
  const textOf = (m) => { if (m == null || m === 0) return "No calculated effect"; const { y, mo } = monthsText(m); return `${y ? `${y} yr ` : ""}${mo ? `${mo} mo ` : ""}${m > 0 ? "older" : "younger"}`; };
  const columns = [{ key: "label", label: "Driver" }, { key: "text", label: "Effect on Health Age", align: "right" }];
  const tableRows = rows.map((r) => ({ label: r.label, text: textOf(r.months) }));
  const controls = [<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="t" getText={() => tableText(columns, tableRows)} />];
  const head = { ...dsText("Text xs"), color: ds.text.tertiary, textTransform: "uppercase" };
  return (
    <StoryCard title={title} controls={controls} line={line} data-story="breakdown-effect">
      {view === "table" ? <DataTable columns={columns} rows={tableRows} /> : (
        <EffectChart rows={cut && !showAll ? rows.slice(0, lim) : rows} textOf={textOf} head={head} />
      )}
      {cut && view === "chart" && <ShowAll open={showAll} total={rows.length} onToggle={() => setShowAll((v) => !v)} />}
      {sample && view === "chart" && <p style={{ margin: 0, ...dsText("Text xs"), color: ds.text.tertiary }}>Sample data. The dataset has no ages or health-age model yet.</p>}
    </StoryCard>
  );
}

function EffectChart({ rows, textOf, head }) {
  const { compact } = useStoryWidth();
  const track = (r, none) => (
    <div data-part="track" role="img" aria-label={`${r.label}: ${textOf(r.months)}`} style={{ flex: 1, minWidth: 0, position: "relative", height: dsSpace[8], borderRadius: dsSpace[8], background: ds.bg.quaternary }}>
      {!none && <span data-part="effect" style={{ position: "absolute", top: 0, height: "100%", width: `${effectShare(r.months) / 2}%`, ...(r.months > 0 ? { left: "50%", background: ds.status.error.textIndicator } : { right: "50%", background: ds.status.success.graph }) }} />}
      <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: 1, height: 20, transform: "translate(-50%, -50%)", background: ds.border.primary }} />
    </div>
  );
  if (compact) {
    // Compact: the driver name and its pill share a line, the track runs the full width under them.
    return (
      <EvidenceSection gap={dsSpace[16]}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: font, ...head }}>
          <span style={{ textAlign: "right", paddingRight: dsSpace[8] }}>Younger</span>
          <span style={{ textAlign: "left", paddingLeft: dsSpace[8] }}>Older</span>
        </div>
        {rows.map((r, ri) => {
          const none = r.months == null || r.months === 0;
          return (
            <div key={`${ri}-${r.label}`} data-part="row" style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], fontFamily: font }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[12] }}>
                <span data-part="label" style={{ minWidth: 0, ...dsText("Text sm"), color: ds.text.secondary }}>{r.label}</span>
                <EffectPill months={r.months} fit />
              </div>
              {track(r, none)}
            </div>
          );
        })}
      </EvidenceSection>
    );
  }
  return (
        <EvidenceSection gap={10}>
          <div style={{ display: "flex", alignItems: "center", gap: dsSpace[16], fontFamily: font }}>
            <div style={{ flex: "0 0 247px", maxWidth: "40%" }} />
            <div style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "1fr 1fr", ...head }}>
              <span style={{ textAlign: "right", paddingRight: dsSpace[40] }}>Younger</span>
              <span style={{ textAlign: "left", paddingLeft: dsSpace[40] }}>Older</span>
            </div>
          </div>
          {rows.map((r, ri) => {
            const none = r.months == null || r.months === 0;
            const w = none ? 0 : effectShare(r.months);
            return (
              <div key={`${ri}-${r.label}`} data-part="row" style={{ display: "flex", alignItems: "center", gap: dsSpace[16], fontFamily: font }}>
                <span data-part="label" style={{ flex: "0 0 114.9px", textAlign: "right", ...dsText("Text 3xs-Trim", 600), color: ds.text.tertiary }}>{r.label}</span>
                <EffectPill months={r.months} />
                <div data-part="track" role="img" aria-label={`${r.label}: ${textOf(r.months)}`} style={{ flex: 1, minWidth: 0, position: "relative", height: dsSpace[8], borderRadius: dsSpace[8], background: ds.bg.quaternary }}>
                  {!none && <span data-part="effect" style={{ position: "absolute", top: 0, height: "100%", width: `${w / 2}%`, ...(r.months > 0 ? { left: "50%", background: ds.status.error.textIndicator } : { right: "50%", background: ds.status.success.graph }) }} />}
                  <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: 1, height: 20, transform: "translate(-50%, -50%)", background: ds.border.primary }} />
                </div>
              </div>
            );
          })}
        </EvidenceSection>
  );
}
