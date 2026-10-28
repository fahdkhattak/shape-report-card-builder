import { ds } from "../../lib/ds.js";
import { band } from "../../lib/tokens.js";
import { STRUCTURE } from "../../lib/widgetStructure.js";
import { FLOURISHING_AT } from "../../lib/bands.js";
import { EvidenceSegmentBar, TrendPill } from "./primitives.jsx";
import { BarStatement } from "./ScoreCard.jsx";

/* ================================================================== */
/* GENERIC EVIDENCE: the evidence a person can put on a built widget     */
/* in place of its own (lib/widgetCustom.js GENERIC_EVIDENCE). Each kind   */
/* answers "based on what?" from the facts every built spec carries       */
/* (payload.ev, subjectForms.js evidenceFacts), so it works on any form */
/* and any size: one line on a 1x1's 24px bar, a little more on a 2x2.     */
/* ================================================================== */
const line = { fontSize: 11, lineHeight: "16px", color: ds.text.tertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 };
const B = ({ children, c }) => <b style={{ fontWeight: 700, color: c || ds.text.secondary }}>{children}</b>;
const pts = (n) => `${n} point${n === 1 ? "" : "s"}`;

function Body({ kind, f, small }) {
  switch (kind) {
    case "g:people": {
      const q = f.people;
      return small ? <EvidenceSegmentBar flourishing={q.f} striving={q.s} struggling={q.t} /> : <BarStatement noun="people" f={q.f} s={q.s} t={q.t} />;
    }
    case "g:parts": {
      const q = f.parts;
      return small ? <EvidenceSegmentBar flourishing={q.f} striving={q.s} struggling={q.t} /> : <BarStatement noun={`${q.noun}s`} f={q.f} s={q.s} t={q.t} />;
    }
    case "g:change":
      return <span style={{ ...line, display: "flex", alignItems: "center", gap: 6 }}><TrendPill delta={f.delta} numberOnly /><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>since {f.prevLabel}</span></span>;
    case "g:line": {
      if (!f.next) return <span style={line}>Above Flourishing by <B c={ds.status.success.textIndicator}>{pts(f.value - FLOURISHING_AT)}</B></span>;
      return <span style={line}><B c={band(f.value).cs}>{pts(f.next.at - f.value)}</B> to {f.next.name}</span>;
    }
    case "g:range":
      return small
        ? <span style={line}>Lowest <B>{f.weakest[0]}</B> <B c={band(f.weakest[1]).cs}>{f.weakest[1]}</B></span>
        : <span style={{ ...line, whiteSpace: "normal" }}>Strongest <B>{f.strongest[0]}</B> <B c={band(f.strongest[1]).cs}>{f.strongest[1]}</B> · Lowest <B>{f.weakest[0]}</B> <B c={band(f.weakest[1]).cs}>{f.weakest[1]}</B></span>;
    case "g:sample":
      return <span style={line}><B>{f.n}</B> people answered{small ? "" : <> in <B>{f.latestLabel}</B></>}</span>;
    default:
      return null;
  }
}

/* The Evidence box itself (same box as the Evidence component), drawn after the Insight and before any Action Bar. */
export default function GenericEvidence({ kind, facts, size }) {
  if (!facts) return null;
  const small = size === "1x1";
  const box = small ? { height: STRUCTURE.evidence["1x1"] } : { minHeight: STRUCTURE.evidenceMin, maxHeight: STRUCTURE.evidence[size] || STRUCTURE.evidence["2x2"] };
  return (
    <div data-part="section-evidence" data-evidence={kind} className={small ? undefined : "ev-hug"} style={{ ...box, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8, minWidth: 0 }}>
      <Body kind={kind} f={facts} small={small} />
    </div>
  );
}
