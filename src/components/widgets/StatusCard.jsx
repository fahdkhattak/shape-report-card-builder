import { ds } from "../../lib/ds.js";
import { EvidenceSegmentBar, StatusBreakdown, StatusRing, StatusRipple, Sections, Insight, Evidence } from "./primitives.jsx";
import { STATUS_COLOR } from "./widgetParts.jsx";
import { BarStatement } from "./ScoreCard.jsx";
import { statusName } from "../../lib/bands.js";
import { statusBreakdown, statusBlocked, whoById, MIN_GROUP } from "../../lib/scoreWidget.js";

/* ================================================================== */
/* THE STATUS CARD — one widget for any subject (lib/scoreWidget.js).    */
/* The band a score puts its subject in, and a breakdown bar of what     */
/* sits in each band: a population's people, or one person's parts       */
/* (their Explorers, or an Explorer's Drivers).                           */
/*                                                                      */
/* data: { value? | status?, n?, people?: { f, s, t },                   */
/*         parts?: { f, s, t }, partsNoun? }                              */
/* ================================================================== */

/* The drawing, given what to split. `people` gives the counts row; `parts` the "Across the …" sentence. */
export function StatusView({ size = "1x1", status, people, parts, partsNoun = "parts" }) {
  const split = people || parts;
  const bar = split ? <EvidenceSegmentBar flourishing={split.f} striving={split.s} struggling={split.t} /> : null;
  if (size === "1x1") {
    // Insight only: the face, the word and the bar together (board example 15497:3097).
    return (
      <Sections size="1x1">
        <Insight center style={{ gap: 12 }}>
          <StatusRing status={status} />
          {bar}
        </Insight>
      </Sections>
    );
  }
  return (
    <Sections size={size}>
      <Insight center style={{ alignItems: "center", overflow: "hidden" }}>
        <StatusRipple status={status} size={176} />
        <span data-part="status-word" style={{ fontSize: 20, fontWeight: 700, color: STATUS_COLOR[status], marginTop: -30, position: "relative" }}>{status}</span>
      </Insight>
      {people && (
        <Evidence style={{ gap: 12 }}>
          {bar}
          <StatusBreakdown flourishing={people.f} striving={people.s} struggling={people.t} />
        </Evidence>
      )}
      {!people && parts && <Evidence><BarStatement noun={partsNoun} {...parts} /></Evidence>}
    </Sections>
  );
}

export default function StatusCard({ size = "1x1", who = "org", what = "overall", data }) {
  if (statusBlocked(what)) return null; // no Status widget for a Driver
  // A group or team too small to show (the privacy rule): no status at all.
  if (whoById(who)?.people && who !== "org" && data.n != null && data.n < MIN_GROUP) {
    return (
      <Sections size={size}>
        <Insight center style={{ gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: ds.text.secondary }}>Not shown</span>
          <span style={{ fontSize: 11, color: ds.text.tertiary, lineHeight: "16px" }}>Fewer than {MIN_GROUP} people answered, so this status stays private.</span>
        </Insight>
      </Sections>
    );
  }
  const status = data.status || statusName(data.value);
  const kind = statusBreakdown(who, what);
  return <StatusView size={size} status={status} people={kind === "people" ? data.people : null} parts={kind === "parts" ? data.parts : null} partsNoun={data.partsNoun} />;
}
