import { useState } from "react";
import { ChevronRight, MessageCircleQuestion, BookOpen } from "lucide-react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { DRIVER_DIMENSION } from "../../../lib/dataset.js";
import { driverAt, LAST } from "../../../lib/scopeData.js";
import Button from "../../ui/Button.jsx";
import { ScopeCard, ScopeCardTitle, bodyText, SampleTag } from "./StoryCard.jsx";
import { ShareGuidance } from "./controls.jsx";
import { useScopeNav } from "../scopeNav.js";
import { useStoryStyle } from "./storyStyle.js";
import { FLOURISHING_AT, STRIVING_AT } from "../../../lib/bands.js";

/* ================================================================== */
/* ACTIONS — one layer deeper into the Scope (Figma Roughwork node      */
/* 2280:15268; the family itself is on the Stories board, 13622:36874).  */
/*                                                                       */
/* Actions are never shown inline. There are two ways in, and both open   */
/* the SAME deeper layer (breadcrumb "<Scope title> > Actions you can     */
/* take"): a dark "Actions you can take" CTA on a specific Driver (e.g.   */
/* the Biggest Pressure Point) opens it for that Driver alone; the        */
/* "Actions You Can Take" story bar opens it with every Driver listed.    */
/*                                                                       */
/* The layer is a Driver list on the left and that Driver's action cards   */
/* on the right: Actions you can take, Think About, From the Playbook.     */
/*                                                                       */
/* Wording is TEMPLATED PLACEHOLDER copy — written to show the layout and   */
/* how guidance follows the Driver's score, not approved specialist        */
/* guidance — so each card carries a "Sample copy" tag. Real per-Driver     */
/* content is authored upstream. Love Science isn't built (no real study).  */
/* ================================================================== */
function guidance(driver, value) {
  const dim = DRIVER_DIMENSION[driver];
  const tone = value >= FLOURISHING_AT ? "keep" : value >= STRIVING_AT ? "lift" : "fix";
  const head = {
    keep: [`Protect what's working in ${driver}`, `${driver} is a strength right now (${value}/100). The aim is to keep it that way and learn from it.`],
    lift: [`Lift ${driver} from average to strong`, `${driver} sits in the middle (${value}/100) — some people feel it, others don't. Closing that gap is the quickest win.`],
    fix: [`Start with ${driver}`, `${driver} is one of the lowest-scoring Drivers (${value}/100) and is holding the ${dim} Explorer back.`],
  }[tone];
  return {
    actions: {
      title: head[0],
      summary: head[1],
      steps: [
        `See who scores ${driver} lowest — the Composition story shows which groups to talk to first.`,
        `Pick one specific change and run it until the next round, rather than several at once.`,
        `Name an owner and a date to check ${driver} again.`,
      ],
    },
    think: [
      `Where do people feel ${driver} most, and where least? What do those places have in common?`,
      `What changed since the last round that could explain a score of ${value}?`,
      `Who already handles ${driver} well, and what could others borrow from them?`,
    ],
    playbook: [
      ["Find what's stuck.", `List the two or three moments where ${driver} breaks down most often, and who is affected.`],
      ["Agree what good looks like.", `Write one sentence describing ${driver} working well, so everyone is aiming at the same thing.`],
      ["Make it routine.", `Build the fix into an existing meeting or process instead of adding a new one, and review it each round.`],
    ],
  };
}

export const ACTIONS_LABEL = "Actions you can take";
const weakestOf = (drivers) => [...drivers].sort((a, b) => driverAt(a, LAST) - driverAt(b, LAST))[0];

/* ---- the two entry points ------------------------------------------- */
/* Dark pill under a specific Driver → that Driver's actions. */
export function ActionsCta({ driver }) {
  const nav = useScopeNav();
  return (
    <Button theme="brand" variation="primary" size="xs" shape="round" onClick={() => nav?.open({ kind: "actions", label: ACTIONS_LABEL, drivers: [driver], selected: driver })}>
      {ACTIONS_LABEL}
    </Button>
  );
}

/* The separate-story entry: a grey bar with "Read More". */
export function ActionsStoryBar({ drivers, title = "Actions You Can Take" }) {
  const nav = useScopeNav();
  const go = () => nav?.open({ kind: "actions", label: ACTIONS_LABEL, drivers, selected: weakestOf(drivers) });
  if (useStoryStyle() === "refined") {
    // A card like every other Story, whose whole face is a doorway: title, one line saying what is
    // behind it, an arrow.
    return (
      <ScopeCard style={{ padding: 0 }}>
      <button onClick={go} className="story-door" style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", fontFamily: font, padding: "28px 32px", display: "flex", alignItems: "center", gap: 16, borderRadius: 24 }}>
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.4px", lineHeight: "28px", color: T.gray900 }}>{title}</span>
          <span style={{ fontSize: 15, color: T.gray600 }}>Specific steps for each of the {drivers.length} {drivers.length === 1 ? "Driver" : "Drivers"}, weakest first.</span>
        </span>
        <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: "50%", background: T.gray900, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight size={18} /></span>
      </button>
      </ScopeCard>
    );
  }
  return (
    <div
      role="button" tabIndex={0} onClick={go} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go())}
      style={{ background: T.gray75, borderRadius: radius.widget, padding: "16px 16px 16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer", fontFamily: font }}
    >
      <span style={{ fontSize: 18, fontWeight: 700, lineHeight: "28px", color: T.gray900 }}>{title}</span>
      <Button theme="brand" variation="primary" size="xs" shape="round" iconRight={<ChevronRight size={16} />} tabIndex={-1} style={{ pointerEvents: "none" }}>Read More</Button>
    </div>
  );
}

/* ---- the deeper layer ------------------------------------------------ */
function IconTile({ icon: Icon }) {
  return (
    <div style={{ width: 64, height: 96, flexShrink: 0, background: T.gray50, borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.orgBlue, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} color={T.white} />
      </div>
    </div>
  );
}

export function ActionsLayer({ drivers, selected }) {
  const refined = useStoryStyle() === "refined";
  const [sel, setSel] = useState(selected);
  const value = driverAt(sel, LAST);
  const g = guidance(sel, value);
  const shareText = () => [g.actions.title, g.actions.summary, ...g.actions.steps.map((s, i) => `${i + 1}. ${s}`), "", "Think about:", ...g.think.map((q) => `- ${q}`)].join("\n");

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", fontFamily: font }}>
      <nav aria-label="Drivers" style={{ flex: "0 0 256px", maxWidth: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 0, ...(refined ? { padding: "0 8px 0 0" } : { background: T.gray50, borderRadius: radius.lg, padding: 8 }) }}>
        {drivers.map((d) => {
          const active = d === sel;
          return (
            <button
              key={d} onClick={() => setSel(d)} aria-current={active ? "true" : undefined}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.gray75; }} onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              style={{ textAlign: "left", border: "none", cursor: "pointer", background: active ? (refined ? T.gray25 : T.gray75) : "transparent", borderRadius: radius.sm, padding: "10px 12px", fontFamily: font, fontSize: refined ? 14 : 13, lineHeight: "18px", color: T.gray900, fontWeight: refined && active ? 600 : 400, display: "flex", gap: 6, alignItems: "baseline", boxShadow: refined && active ? `inset 2px 0 0 ${T.gray900}` : "none" }}
            >
              <span style={{ flex: 1 }}>{d}</span>
              <b style={{ color: band(driverAt(d, LAST)).cs, fontVariantNumeric: "tabular-nums" }}>{driverAt(d, LAST)}</b>
            </button>
          );
        })}
      </nav>

      <div key={sel} style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <ScopeCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <ScopeCardTitle>Actions you can take</ScopeCardTitle>
            <ShareGuidance label="Share this guidance" getText={shareText} />
          </div>
          <SampleTag />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: refined ? 18 : 16, fontWeight: refined ? 600 : 700, letterSpacing: refined ? "-0.2px" : 0, color: T.gray900 }}>{g.actions.title}</span>
            <p style={refined ? { ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "58ch", textWrap: "pretty" } : bodyText}>{g.actions.summary}</p>
          </div>
          {refined ? (
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" }}>
              {g.actions.steps.map((s, i) => (
                <li key={i} style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${T.gray50}` : "none", ...bodyText, fontSize: 15, lineHeight: "22px" }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: T.gray300, fontVariantNumeric: "tabular-nums", lineHeight: "22px" }}>{i + 1}</span>{s}
                </li>
              ))}
            </ol>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, ...bodyText }}>
              {g.actions.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          )}
        </ScopeCard>

        <ScopeCard>
          <ScopeCardTitle>Think About</ScopeCardTitle>
          <SampleTag />
          {refined ? (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {g.think.map((q, i) => <li key={i} style={{ ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "62ch", paddingLeft: 16, boxShadow: `inset 2px 0 0 ${T.gray75}` }}>{q}</li>)}
            </ul>
          ) : (
            <div style={{ display: "flex", gap: 16 }}>
              <IconTile icon={MessageCircleQuestion} />
              <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, ...bodyText }}>
                {g.think.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </ScopeCard>

        <ScopeCard>
          <ScopeCardTitle>From the Playbook</ScopeCardTitle>
          <SampleTag />
          {refined ? (
            <dl style={{ margin: 0, display: "flex", flexDirection: "column" }}>
              {g.playbook.map(([lead, rest], i) => (
                <div key={lead} style={{ display: "grid", gridTemplateColumns: "160px minmax(0, 1fr)", gap: 20, padding: "12px 0", borderTop: i ? `1px solid ${T.gray50}` : "none" }}>
                  <dt style={{ fontSize: 15, fontWeight: 600, color: T.gray900 }}>{lead}</dt>
                  <dd style={{ margin: 0, ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "52ch" }}>{rest}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div style={{ display: "flex", gap: 16 }}>
              <IconTile icon={BookOpen} />
              <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, ...bodyText }}>
                {g.playbook.map(([lead, rest]) => <li key={lead}><b style={{ color: T.gray900 }}>{lead}</b> {rest}</li>)}
              </ul>
            </div>
          )}
        </ScopeCard>
      </div>
    </div>
  );
}
