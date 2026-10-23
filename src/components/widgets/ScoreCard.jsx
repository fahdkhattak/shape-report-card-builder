import { ds } from "../../lib/ds.js";
import { EvidenceSegmentBar, StatusBreakdown } from "./primitives.jsx";
import { ScoreHeadline, StatusChip, Headcount, date11, fmtDate } from "./widgetParts.jsx";
import { statusName } from "../../lib/bands.js";
import { allowedElements, defaultElements, whoById, MIN_GROUP } from "../../lib/scoreWidget.js";

/* ================================================================== */
/* THE SCORE CARD — one widget for any subject (lib/scoreWidget.js).     */
/* `who` (org / team / group / person) and `what` (overall / cluster /  */
/* explorer / driver) decide what it may show; `show` picks from that   */
/* (default: defaultElements). Anything not allowed is dropped even if   */
/* asked for, so a personal card can never grow a headcount.             */
/*                                                                      */
/* data: { value, delta?, date (ISO or text), n?, invited?,              */
/*         people?: { f, s, t }, parts?: { f, s, t }, partsNoun? }        */
/* ================================================================== */
const col = (extra) => ({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, ...extra });
const PEOPLE_WORD = { org: "Employees", team: "Team Members", group: "People" };
const TONE = { org: ds.utility.graphColors.main.orgBlue, team: ds.utility.graphColors.main.teamBlue, group: ds.utility.graphColors.main.orgBlue }; // team: the frames' team blue, #0074BC

/* "Across the 12 Explorers, 5 are Flourishing, 3 Striving, and 4 Struggling." Counts of parts, not people. */
export function BandSentence({ noun, f, s, t }) {
  return (
    <span data-part="parts-sentence" style={{ fontSize: 11, color: ds.text.tertiary, lineHeight: "16px" }}>
      Across the <b style={{ color: ds.text.primary }}>{f + s + t}</b> {noun}, <b style={{ color: ds.status.success.textIndicator }}>{f}</b> {f === 1 ? "is" : "are"} Flourishing, <b style={{ color: ds.status.warning.textIndicator }}>{s}</b> Striving, and <b style={{ color: ds.status.error.textIndicator }}>{t}</b> Struggling.
    </span>
  );
}

export default function ScoreCard({ size = "2x2", who = "org", what = "overall", data, show, numberSize, peopleLabel }) {
  const ok = new Set(allowedElements(who, what));
  const want = new Set((show || defaultElements(who, what, size)).filter((id) => ok.has(id)));
  const has = (id) => want.has(id);
  const date = data.date && /^\d{4}-/.test(data.date) ? fmtDate(data.date) : data.date;

  // A group or team too small to show (the privacy rule): no number at all.
  if (whoById(who)?.people && who !== "org" && data.n != null && data.n < MIN_GROUP) {
    return (
      <div style={col({ justifyContent: "center", gap: 6 })}>
        <span style={{ fontSize: 13, fontWeight: 700, color: ds.text.secondary }}>Not shown</span>
        <span style={{ fontSize: 11, color: ds.text.tertiary, lineHeight: "16px" }}>Fewer than {MIN_GROUP} people answered, so this score stays private.</span>
      </div>
    );
  }

  const status = statusName(data.value);
  const rate = !has("participation") ? null : data.rate ?? (data.invited ? Math.round((data.n / data.invited) * 100) : null);
  const headcount = has("headcount") && data.n != null
    ? <Headcount labelled={size !== "1x1"} label={peopleLabel || PEOPLE_WORD[who]} count={data.n} rate={rate} tone={TONE[who]} />
    : null;
  const chip = has("status") ? <StatusChip status={status} /> : null;
  const delta = has("change") ? data.delta : undefined;

  if (size === "1x1") {
    return (
      <div style={col({ justifyContent: "space-between" })}>
        <div style={{ paddingTop: 4 }}><ScoreHeadline value={data.value} delta={delta} size={numberSize || 64} compact /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {has("date") && date && <span data-part="date" style={date11}>{date}</span>}
          {headcount || chip}
        </div>
      </div>
    );
  }

  // One evidence bar fits a 2x2: people when the score covers people, else its parts.
  const people = has("people") && data.people;
  const parts = !people && has("parts") && data.parts;
  const split = people || parts;
  return (
    <div style={col({ justifyContent: "space-between" })}>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={data.value} delta={delta} size={numberSize || 64} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {has("date") && date && <span data-part="date" style={date11}>{date}</span>}
          {chip}
          {headcount}
        </div>
        {split && <EvidenceSegmentBar flourishing={split.f} striving={split.s} struggling={split.t} />}
        {people && <StatusBreakdown flourishing={people.f} striving={people.s} struggling={people.t} />}
        {parts && <BandSentence noun={data.partsNoun || "parts"} {...parts} />}
      </div>
    </div>
  );
}
