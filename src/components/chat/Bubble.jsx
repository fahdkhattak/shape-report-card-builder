import { T, radius } from "../../lib/tokens.js";

/* Updated against the newer chat reference (984qJvMt7fCHASYHRwgrab,        */
/* node 12618:39773) — superseded the earlier "Side Menu" node's gray600    */
/* user bubble with white/text-primary, and 13px text with 16px/Text-md.    */
/* Uniform 18px radius carries over unchanged (confirmed by both refs).     */
export default function Bubble({ mine, children }) {
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "80%", background: mine ? T.white : T.gray50, border: mine ? `1px solid ${T.gray100}` : "none", color: T.gray900, borderRadius: radius.widget, padding: 12, fontSize: 16, lineHeight: "24px", boxSizing: "border-box" }}>
        {children}
      </div>
    </div>
  );
}

/* Three bouncing dots in a bubble, shown while the mascot is "thinking" —
   replaces an instant/silent gap with a visible beat, so a response (even a
   fast synchronous one) reads as considered rather than just popping in. */
export function TypingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, background: T.gray50, borderRadius: radius.widget, padding: "14px 16px" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: T.gray300, animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
