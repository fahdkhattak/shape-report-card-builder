import { useState } from "react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsSpace, dsRadius, dsBorder } from "../../../lib/ds.js";
import { StoryCard, EvidenceSection, SampleTag, noteText, bodyText } from "./StoryCard.jsx";
import { ViewSwitch, CopyTable, PillTabs } from "./controls.jsx";
import { DataTable, tableText } from "./DataTable.jsx";
import DonutChart, { segmentColor } from "./DonutChart.jsx";
import { useOwnWidth } from "./storyWidth.js";
import { dimensionValue } from "../../../lib/dataset.js";
import { FLOURISHING_AT, STRIVING_AT } from "../../../lib/bands.js";
import {
  PARTS, RATES, IMPACT_TARGET, TIME_PARTS, MONEY_PARTS, impactLadder, impactByGroup, IMPACT_AXES, fmtMoney,
} from "../../../lib/impactModel.js";

/* ================================================================== */
/* IMPACT STORIES — for Time Impact, Money Impact and Time to Gain.     */
/* The gain if scores rose to Flourishing (lib/impactModel.js). They    */
/* follow the Story rules (one question each, Table View where there is */
/* a table, a compact layout under 560px) and sit beside the reused     */
/* Stories (Meaning, Breakdown bars, Score Over Time, Actions).          */
/*   ImpactSplitStory   Composition: where the gain comes from (2 or 4   */
/*                      parts of a whole), a ring and the parts' rows     */
/*   GainLadderStory    new: what each step up is worth (to 60, 70, 80,   */
/*                      90), so a partial lift has a visible value       */
/*   GainByGroupStory   new: where the gain sits (per person, by group),  */
/*                      groups under 5 people never shown                */
/*   ImpactMethodStory  the model: what is measured, what is assumed      */
/* `unit`: "time" (hours per person per year) or "money" (dollars a year */
/* for the organisation).                                               */
/* ================================================================== */
const sourcesOf = (k) => PARTS[k].explorers;
const fmtH = (h) => `${Math.round(h)} hrs`;
const valueText = (unit, v) => (unit === "time" ? fmtH(v) : fmtMoney(v));
const keyOf = (unit) => (unit === "time" ? "impactTime" : "impactMoney");

/* ---- Where the gain comes from ------------------------------------------------------------------------------------ */
export function ImpactSplitStory({ unit = "time", data, title, line }) {
  const [view, setView] = useState("chart");
  // This Story renders its own card, so it measures a wrapper around it (useOwnWidth), not the Scope around it.
  const [cardRef, { compact }] = useOwnWidth();
  const parts = unit === "time" ? TIME_PARTS : MONEY_PARTS;
  const values = unit === "time" ? data.hours : data.dollars;
  const total = values.total || 1;
  const rows = parts.map((k, i) => ({ key: k, label: PARTS[k].label, value: values[k], pct: Math.round((values[k] / total) * 100), color: segmentColor(keyOf(unit), i), sources: sourcesOf(k) }));
  const columns = [
    { key: "label", label: "Part" },
    { key: "value", label: unit === "time" ? "Hours / person / year" : "Per year", align: "right", render: (r) => <b>{valueText(unit, r.value)}</b>, text: (r) => (unit === "time" ? Math.round(r.value) : Math.round(r.value)) },
    { key: "pct", label: "Share", align: "right", render: (r) => `${r.pct}%`, text: (r) => r.pct },
  ];
  return (
    <div ref={cardRef}>
    <StoryCard
      title={title || (unit === "time" ? "Where the Time Comes From" : "Where the Money Comes From")}
      line={line}
      controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}
      data-story="impact-split"
    >
      {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
        <EvidenceSection>
          <div style={{ display: "flex", flexDirection: compact ? "column" : "row", alignItems: "center", gap: compact ? dsSpace[16] : dsSpace[32], fontFamily: font }}>
            <DonutChart axisKey={keyOf(unit)} label="" bare size={compact ? 128 : 148} rows={rows.map((r) => ({ group: r.label, n: Math.max(0.0001, r.value), pct: r.pct }))} />
            <div style={{ flex: 1, minWidth: 0, width: compact ? "100%" : undefined, alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", gap: dsSpace[12] }}>
              {rows.map((r) => (
                <div key={r.key} style={{ display: "flex", flexDirection: "column", gap: 2, borderLeft: `2px solid ${r.color}`, paddingLeft: dsSpace[8] }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: dsSpace[8] }}>
                    <span style={{ flex: 1, minWidth: 0, ...dsText("Text sm", 600), color: ds.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                    <span style={{ ...dsText("Text md", 700), color: ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{valueText(unit, r.value)}</span>
                    <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, width: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.pct}%</span>
                  </div>
                  <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>From {r.sources.join(" and ")}</span>
                </div>
              ))}
            </div>
          </div>
        </EvidenceSection>
      )}
    </StoryCard>
    </div>
  );
}

/* ---- What each step is worth ---------------------------------------------------------------------------------------
   One bar per target score; a bar's length is that target's gain against the stretch target's. Pick a step to read it. */
export function GainLadderStory({ unit = "time", ladder = impactLadder(), personal = false, title = "What Each Step Is Worth" }) {
  const steps = ladder.map((s) => ({ target: s.target, value: s.value ?? (unit === "time" ? s.hours.total : s.dollars.total), below: s.below }));
  const [pick, setPick] = useState(steps.findIndex((s) => s.target === IMPACT_TARGET));
  const max = Math.max(...steps.map((s) => s.value), 1);
  const full = steps.find((s) => s.target === IMPACT_TARGET)?.value || 1;
  const cur = steps[pick];
  const name = (t) => (t === STRIVING_AT ? "Striving" : t === FLOURISHING_AT ? "Flourishing" : t > FLOURISHING_AT ? "Stretch" : "Part-way");
  const who = personal ? "you" : "everyone below it";
  return (
    <StoryCard title={title} line={`The gain if ${who} reached each score. A partial lift still gives some of it back.`} data-story="impact-ladder">
      {personal && <SampleTag>Sample person</SampleTag>}
      <EvidenceSection gap={dsSpace[8]}>
        {steps.map((s, i) => {
          const on = i === pick;
          return (
            <button key={s.target} onClick={() => setPick(i)} aria-pressed={on}
              style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 64px", alignItems: "center", gap: dsSpace[12], border: "none", background: on ? ds.interactive.ghostHover : "transparent", borderRadius: dsRadius.md, padding: `${dsSpace[6]}px ${dsSpace[8]}px`, cursor: "pointer", fontFamily: font, textAlign: "left" }}>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ ...dsText("Text xs", 600), color: dsBand(s.target).cs }}>To {s.target}</span>
                <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{name(s.target)}</span>
              </span>
              <span aria-hidden="true" style={{ height: 8, borderRadius: 9999, background: ds.bg.primary, overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(s.value / max) * 100}%`, borderRadius: 9999, background: s.target === IMPACT_TARGET ? ds.text.accent : ds.border.strong, transition: "width 300ms ease" }} />
              </span>
              <span style={{ ...dsText("Text sm", 700), color: ds.text.primary, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{valueText(unit, s.value)}</span>
            </button>
          );
        })}
      </EvidenceSection>
      <p style={{ ...bodyText, margin: 0, fontFamily: font }}>
        {cur.target === IMPACT_TARGET
          ? <>Reaching Flourishing ({IMPACT_TARGET}) gives back <b>{valueText(unit, cur.value)}</b>{unit === "time" && !personal ? " a year for each person" : " a year"}{!personal && cur.below != null ? <>, from the <b>{cur.below}</b> people below it today</> : null}.</>
          : cur.target < IMPACT_TARGET
            ? <>Reaching {cur.target} gives back <b>{valueText(unit, cur.value)}</b>, <b>{Math.round((cur.value / full) * 100)}%</b> of what Flourishing would.</>
            : <>A stretch to {cur.target} would give back <b>{valueText(unit, cur.value)}</b>, more than Flourishing's {valueText(unit, full)}.</>}
      </p>
    </StoryCard>
  );
}

/* ---- Where the gain sits ---------------------------------------------------------------------------------------------- */
export function GainByGroupStory({ unit = "time", title = "Where the Gain Sits" }) {
  const tabs = IMPACT_AXES.map(([, label]) => label);
  const [tab, setTab] = useState("Department");
  const [view, setView] = useState("chart");
  const axisKey = IMPACT_AXES.find(([, l]) => l === tab)?.[0] || "department";
  const all = impactByGroup(axisKey);
  const rows = all.filter((g) => !g.hidden).map((g) => ({ ...g, value: unit === "time" ? g.hours : g.dollarsPerPerson })).sort((a, b) => b.value - a.value);
  const hidden = all.filter((g) => g.hidden).length;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const columns = [
    { key: "group", label: tab },
    { key: "n", label: "People", align: "right" },
    { key: "value", label: unit === "time" ? "Hours / person / year" : "Per person / year", align: "right", render: (r) => <b>{valueText(unit, r.value)}</b>, text: (r) => Math.round(r.value) },
  ];
  return (
    <StoryCard
      title={title} line={`How much each group would get back per person if it reached Flourishing. The most to gain is where scores sit lowest.`}
      controls={[<ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}
      data-story="impact-groups"
    >
      <div><PillTabs tabs={tabs} value={tab} onChange={setTab} label="Group people by" /></div>
      {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
        <EvidenceSection gap={dsSpace[12]}>
          {rows.length === 0 && <p style={{ ...noteText, margin: 0 }}>No group has 5 or more people.</p>}
          {rows.map((r, i) => (
            <div key={r.group} title={`${r.group}: ${r.n} people`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr) 64px", alignItems: "center", gap: dsSpace[12], fontFamily: font }}>
              <span style={{ ...dsText("Text xs", i === 0 ? 600 : 400), color: ds.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.group}</span>
              <span aria-hidden="true" style={{ height: 8, borderRadius: 9999, background: ds.bg.primary, overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(r.value / max) * 100}%`, borderRadius: 9999, background: unit === "time" ? ds.graph.personalBlue : ds.graph.orgBlue }} />
              </span>
              <span style={{ ...dsText("Text xs", 700), color: ds.text.primary, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{valueText(unit, r.value)}</span>
            </div>
          ))}
        </EvidenceSection>
      )}
      <p style={{ ...noteText, margin: 0 }}>Per person, so a small group and a large one compare fairly.{hidden ? ` ${hidden} group${hidden === 1 ? "" : "s"} under 5 people ${hidden === 1 ? "is" : "are"} not shown.` : ""}</p>
    </StoryCard>
  );
}

/* ---- How the estimate works -------------------------------------------------------------------------------------------- */
/* `scores`: { Explorer: score } to show someone's own scores (a personal report) instead of the organisation's. */
export function ImpactMethodStory({ unit = "time", scores }) {
  const parts = unit === "time" ? TIME_PARTS : MONEY_PARTS;
  const line = (k) => {
    const p = PARTS[k];
    if (p.hours != null) return unit === "time" ? `${p.hours} hours a year per point below ${IMPACT_TARGET}` : `${p.hours} hours a point, valued at $${RATES.hourValue} an hour`;
    if (p.leaveRisk != null) return `${(p.leaveRisk * 100).toFixed(2)}% lower chance of leaving per point, × $${RATES.replacementCost.toLocaleString("en-GB")} to replace someone`;
    return `$${p.dollars} per point below ${IMPACT_TARGET}`;
  };
  return (
    <StoryCard title="How This Estimate Works" data-story="impact-method">
      <SampleTag>Sample model</SampleTag>
      <p style={{ ...bodyText, margin: 0, fontFamily: font }}>
        {scores ? "Your" : "For each person, the"} gap between {scores ? "your" : "their"} score and Flourishing ({IMPACT_TARGET}) on the Explorers behind each part is measured from {scores ? "your" : "their"} answers. Nobody already at {IMPACT_TARGET} or above adds anything. The gaps are then turned into {unit === "time" ? "hours" : "dollars"} at the rates below.
      </p>
      <div style={{ display: "flex", flexDirection: "column", fontFamily: font }}>
        {parts.map((k, i) => (
          <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(0, 120px) minmax(0, 1fr)", gap: dsSpace[12], padding: `${dsSpace[8]}px 0`, borderTop: i ? `${dsBorder.sm}px solid ${ds.border.tertiary}` : "none" }}>
            <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{PARTS[k].label}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ ...dsText("Text xs"), color: ds.text.secondary }}>Measured: {PARTS[k].explorers.map((e) => `${e} (${scores ? scores[e] : Math.round(dimensionValue(e))})`).join(", ")}</span>
              <span style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>Assumed: {line(k)}</span>
            </span>
          </div>
        ))}
      </div>
      <p style={{ ...noteText, margin: 0 }}>The gaps are real; the rates are placeholders until the SHAPE impact model is connected. Treat the totals as indicative, not as accounting figures.</p>
    </StoryCard>
  );
}
