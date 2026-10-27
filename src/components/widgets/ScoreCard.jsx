import { ds } from "../../lib/ds.js";
import { EvidenceSegmentBar, StatusBreakdown, Sections, Insight, Evidence } from "./primitives.jsx";
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
const PEOPLE_WORD = { org: "Employees", team: "Team Members", group: "People" };
const TONE = { org: ds.utility.graphColors.main.orgBlue, team: ds.utility.graphColors.main.teamBlue, group: ds.utility.graphColors.main.orgBlue }; // team: the frames' team blue, #0074BC

/* "Across the 12 Explorers, 5 are Flourishing, 3 are Striving, and 4 are Struggling." Counts of parts, not people.
   Figma Evidence Section 11317:12785: Text 3xs / Regular (11/16) in text/tertiary, the total bold in the same grey, each
   count bold in its status's text colour. */
const isAre = (n) => (n === 1 ? "is" : "are");
export function BandSentence({ noun, f, s, t }) {
  const C = ({ n, c }) => <b style={{ color: c }}>{n}</b>;
  return (
    <span data-part="parts-sentence" style={{ fontSize: 11, fontWeight: 400, color: ds.text.tertiary, lineHeight: "16px" }}>
      Across the <b>{f + s + t}</b> {noun}, <C n={f} c={ds.status.success.text} /> {isAre(f)} Flourishing, <C n={s} c={ds.status.warning.text} /> {isAre(s)} Striving, and <C n={t} c={ds.status.error.text} /> {isAre(t)} Struggling.
    </span>
  );
}
/* The Evidence Section when it's a bar with a statement under it: 6px apart (Figma 11317:12785). */
export const BAR_STATEMENT_GAP = 6;
export function BarStatement({ noun, f, s, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: BAR_STATEMENT_GAP, width: "100%" }}>
      <EvidenceSegmentBar flourishing={f} striving={s} struggling={t} />
      <BandSentence noun={noun} f={f} s={s} t={t} />
    </div>
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
      <Sections size={size}>
        <Insight center style={{ gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: ds.text.secondary }}>Not shown</span>
          <span style={{ fontSize: 11, color: ds.text.tertiary, lineHeight: "16px" }}>Fewer than {MIN_GROUP} people answered, so this score stays private.</span>
        </Insight>
      </Sections>
    );
  }

  const status = statusName(data.value);
  const rate = !has("participation") ? null : data.rate ?? (data.invited ? Math.round((data.n / data.invited) * 100) : null);
  const headcount = has("headcount") && data.n != null
    ? <Headcount labelled={size !== "1x1"} label={peopleLabel || PEOPLE_WORD[who]} count={data.n} rate={rate} tone={TONE[who]} />
    : null;
  const chip = has("status") ? <StatusChip status={status} /> : null;
  const delta = has("change") ? data.delta : undefined;
  const dateEl = has("date") && date ? <span data-part="date" style={date11}>{date}</span> : null;

  /* 1x1 (template Insight + Evidence Bar): the number, with the date under it when the bar holds a headcount or a status;
     otherwise the date is the bar. */
  if (size === "1x1") {
    const bar = headcount || chip || dateEl;
    return (
      <Sections size="1x1">
        <Insight style={{ justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={data.value} delta={delta} size={numberSize || 64} compact /></div>
          {bar !== dateEl && dateEl}
        </Insight>
        {bar && <Evidence>{bar}</Evidence>}
      </Sections>
    );
  }

  /* 2x2 (template Insight + Evidence Section): the number with its date, status and headcount; the 68px Evidence holds the
     split (people or parts) and its counts or sentence. */
  const people = has("people") && data.people;
  const parts = !people && has("parts") && data.parts;
  return (
    <Sections size={size}>
      <Insight style={{ justifyContent: "space-between" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}><ScoreHeadline value={data.value} delta={delta} size={numberSize || 64} /></div>
        {(dateEl || chip || headcount) && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{dateEl}{chip}{headcount}</div>}
      </Insight>
      {people && (
        <Evidence style={{ gap: 12 }}>
          <EvidenceSegmentBar flourishing={people.f} striving={people.s} struggling={people.t} />
          <StatusBreakdown flourishing={people.f} striving={people.s} struggling={people.t} />
        </Evidence>
      )}
      {parts && <Evidence><BarStatement noun={data.partsNoun || "parts"} {...parts} /></Evidence>}
    </Sections>
  );
}
