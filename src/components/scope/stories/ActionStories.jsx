import { useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { T, font, radius, band } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace, dsBorder } from "../../../lib/ds.js";
import { DRIVER_DIMENSION } from "../../../lib/dataset.js";
import { driverAt, LAST } from "../../../lib/scopeData.js";
import { ScopeCard, ScopeCardTitle, bodyText, SampleTag } from "./StoryCard.jsx";
import { ShareGuidance } from "./controls.jsx";
import { useScopeNav } from "../scopeNav.js";
import { useStoryStyle } from "./storyStyle.js";
import { FLOURISHING_AT, STRIVING_AT } from "../../../lib/bands.js";
import thinkAboutArt from "../../../assets/actions/think-about.svg";
import playbookArt from "../../../assets/actions/playbook.svg";
import loveScienceArt from "../../../assets/actions/love-science.svg";

/* ================================================================== */
/* ACTIONS — one layer deeper into the Scope (Figma 13622:36874).        */
/*                                                                       */
/* Purpose (from the frame): help people move from understanding a      */
/* result to what they can do next. Only for widgets that contain        */
/* Drivers; the guidance follows the selected Driver. The first Action    */
/* set is "Actions you can take" + "Think About"; "From the Playbook" and */
/* "Love Science" are optional extras a creator adds one at a time.       */
/*                                                                       */
/* Two ways in, both opening the SAME deeper layer:                       */
/*   ActionsCta       the dark "Actions you can take" pill (13622:37128)  */
/*                    on a specific Driver: opens it for that Driver.     */
/*   ActionsStoryBar  the grey "Actions You Can Take" bar with "Read      */
/*                    More ›" (13622:36875): opens it with every Driver.  */
/* The layer (13622:36883): a Driver nav (a third of the width) beside    */
/* that Driver's Action Stories (two thirds), 16px apart.                 */
/*                                                                       */
/* Wording is TEMPLATED SAMPLE copy that shows the layout and how the      */
/* guidance follows a Driver's score; real per-Driver content is written  */
/* upstream, so each card carries a "Sample copy" tag. Love Science and   */
/* Citations need a real study and real sources, which nothing in this    */
/* prototype has, so the layer shows them only when the content passed in  */
/* includes them (the Developer page shows them with the design's sample). */
/* ================================================================== */
function guidance(driver, value) {
  const dim = DRIVER_DIMENSION[driver];
  const tone = value >= FLOURISHING_AT ? "keep" : value >= STRIVING_AT ? "lift" : "fix";
  const head = {
    keep: [`Protect what's working in ${driver}`, `Keeping a strength strong`, `${driver} is a strength right now, at ${value} out of 100. The aim is to keep it that way and learn from it.`],
    lift: [`Lift ${driver} from average to strong`, `Closing the gap between people`, `${driver} sits in the middle, at ${value} out of 100. Some people feel it, others don't, and closing that gap is the quickest win.`],
    fix: [`Start with ${driver}`, `Taking the pressure off ${dim}`, `${driver} is one of the lowest-scoring Drivers, at ${value} out of 100, and it's holding the ${dim} Explorer back.`],
  }[tone];
  return {
    actions: {
      title: head[0],
      subtitle: head[1],
      summary: head[2],
      body: `Start small and stay specific. Look at who scores ${driver} lowest, pick one change you can run until the next round, and give it an owner and a date. It's easier said than done, so the steps below keep it practical.`,
      steps: [
        `See who scores ${driver} lowest. The Composition story shows which groups to talk to first.`,
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

/* ---- the dark pill (Buttons/Button, brand primary) ------------------------------------------------------------
   size "sm": 28px, Text sm, 12px sides, 20px icon (13622:36878, 13622:37129).
   size "xs": 24px, Text 2xs, 6px sides, 16px icon (13622:36882, 13622:37127). Both add 2px of text padding. */
function DarkPill({ children, size = "sm", icon, as: Tag = "button", ...rest }) {
  const sm = size === "sm";
  return (
    <Tag
      data-part="dark-pill" {...rest}
      style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[4], paddingTop: dsSpace[4], paddingBottom: dsSpace[4], paddingLeft: (sm ? dsSpace[12] : dsSpace[6]) + dsSpace[2], paddingRight: (sm ? dsSpace[12] : dsSpace[6]) + (icon ? 0 : dsSpace[2]), borderRadius: dsRadius.full, border: "none", background: ds.button.brand.primary.bg.default, color: ds.button.brand.primary.items.defaultText, ...dsText(sm ? "Text sm" : "Text 2xs"), fontFamily: font, whiteSpace: "nowrap", flexShrink: 0, cursor: Tag === "button" ? "pointer" : undefined, ...rest.style }}
    >
      {children}
      {icon && <ChevronRight size={sm ? 20 : 16} aria-hidden="true" />}
    </Tag>
  );
}

/* ---- the two entry points ------------------------------------------- */
/* Dark pill under a specific Driver → that Driver's actions. */
export function ActionsCta({ driver, size = "sm" }) {
  const nav = useScopeNav();
  return <DarkPill size={size} onClick={() => nav?.open({ kind: "actions", label: ACTIONS_LABEL, drivers: [driver], selected: driver })}>{ACTIONS_LABEL}</DarkPill>;
}

/* The separate-story entry: a grey bar with "Read More ›". `size` picks the pill: "sm" (the 62px bar) or "xs" (60px). */
export function ActionsStoryBar({ drivers, title = "Actions You Can Take", size = "sm" }) {
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
  // Figma 13622:36875: bg/secondary, 1px border/secondary, 18px radius, 16px padding, Text lg / Bold title, the pill on the right.
  return (
    <div
      role="button" tabIndex={0} onClick={go} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go())}
      data-story="actions-bar" aria-label={`${title}: read more`}
      style={{ background: ds.bg.secondary, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: radius.widget, padding: dsSpace[16], display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[12], cursor: "pointer", fontFamily: font, boxSizing: "border-box" }}
    >
      <span data-part="title" style={{ ...dsText("Text lg", 700), color: ds.text.primary }}>{title}</span>
      <DarkPill as="span" size={size} icon aria-hidden="true">Read More</DarkPill>
    </div>
  );
}

/* ---- the Action Story cards (Figma 13622:37133, 37143, 37159, 37181) ----------------------------------------------
   Each a Story card (surface/card, 1px border/secondary, 18px radius, 16px padding, 16px gap) with a Text lg / Bold
   title. Think About, From the Playbook and Love Science put a 48px illustration on a bg/primary tile (radius/lg, 16px
   padding, as tall as the text) beside their text. Text is Text sm in text/secondary throughout. */
const cardTitle = { margin: 0, ...dsText("Text lg", 700), color: ds.text.primary };
const para = { margin: 0, ...dsText("Text sm"), color: ds.text.secondary };
const bullets = { margin: 0, paddingLeft: 21, ...dsText("Text sm"), color: ds.text.secondary, display: "flex", flexDirection: "column" };

function ArtTile({ src }) {
  return (
    <div data-part="art-tile" style={{ alignSelf: "stretch", flexShrink: 0, background: ds.bg.primary, borderRadius: dsRadius.lg, padding: dsSpace[16], boxSizing: "border-box" }}>
      <img src={src} alt="" width={48} height={48} style={{ display: "block" }} />
    </div>
  );
}

export function ActionsYouCanTakeCard({ g, shareText, sample = true }) {
  return (
    <ScopeCard data-story="action-actions">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[8], flexWrap: "wrap" }}>
        <p style={{ ...cardTitle, flex: 1, minWidth: 0 }}>{ACTIONS_LABEL}</p>
        {shareText && <ShareGuidance label="Share this guidance" getText={shareText} />}
      </div>
      {sample && <SampleTag />}
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
        <p data-part="headline" style={cardTitle}>{g.title}</p>
        {g.subtitle && <p data-part="subhead" style={{ ...para, fontWeight: 700 }}>{g.subtitle}</p>}
        <p style={para}>{g.summary}</p>
        {g.body && <p style={para}>{g.body}</p>}
      </div>
    </ScopeCard>
  );
}

export function ThinkAboutCard({ items, sample = true }) {
  return (
    <ScopeCard data-story="action-think">
      <p style={cardTitle}>Think About</p>
      {sample && <SampleTag />}
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <ArtTile src={thinkAboutArt} />
        <ul style={{ ...bullets, flex: 1, minWidth: 0 }}>{items.map((q, i) => <li key={i}>{q}</li>)}</ul>
      </div>
    </ScopeCard>
  );
}

export function PlaybookCard({ items, sample = true }) {
  return (
    <ScopeCard data-story="action-playbook">
      <p style={cardTitle}>From the Playbook</p>
      {sample && <SampleTag />}
      <div style={{ display: "flex", gap: dsSpace[16], alignItems: "flex-start" }}>
        <ArtTile src={playbookArt} />
        <ul style={{ ...bullets, flex: 1, minWidth: 0 }}>{items.map(([lead, rest]) => <li key={lead}>{lead} {rest}</li>)}</ul>
      </div>
    </ScopeCard>
  );
}

/* science: { finding, body }. A research-led card: the finding in bold, then what it means. */
export function LoveScienceCard({ science, sample = true }) {
  return (
    <ScopeCard data-story="action-science">
      <p style={cardTitle}>Love Science</p>
      {sample && <SampleTag />}
      <div style={{ display: "flex", gap: dsSpace[16], alignItems: "flex-start" }}>
        <ArtTile src={loveScienceArt} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
          <p style={{ ...para, fontWeight: 700 }}>{science.finding}</p>
          <p style={para}>{science.body}</p>
        </div>
      </div>
    </ScopeCard>
  );
}

/* Citations (13622:36980 closed, 13622:36973 open): Text sm / Bold title and a chevron; open, a hairline and the
   sources, 14px apart, the link part in text/primary. cites: [{ text, url }]. */
export function CitationsCard({ cites, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    // Figma's 56px closed height counts the border inside its 16px padding.
    <ScopeCard data-story="action-citations" style={useStoryStyle() === "refined" ? undefined : { padding: dsSpace[16] - dsBorder.sm }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: dsSpace[8] }}>
        <p style={{ margin: 0, ...dsText("Text sm", 700), color: ds.text.secondary }}>Citations</p>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Hide citations" : "Show citations"} style={{ border: "none", background: "transparent", cursor: "pointer", borderRadius: dsRadius.full, padding: `${dsSpace[4]}px ${dsSpace[12]}px`, display: "flex", color: ds.icon.primary }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {open && (
        <>
          <div aria-hidden="true" style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}` }} />
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
            {cites.map((c, i) => (
              <li key={i} style={{ ...para, overflowWrap: "anywhere" }}>
                <sup>{i + 1}</sup> {c.text} {c.url && <a href={c.url} target="_blank" rel="noreferrer" style={{ color: ds.text.primary }}>{c.url}</a>}
              </li>
            ))}
          </ol>
        </>
      )}
    </ScopeCard>
  );
}

/* ---- the deeper layer ------------------------------------------------ */

/* The Driver nav (13622:36917): a light panel (surface/card-within-card, 18px radius, 16px top and bottom, rows 2px
   apart), each row 16 / 8 padding, the name in Text xs / Medium and the score in bold in its status colour. The open
   Driver's row is ghost-hover grey with its name in bold. */
function DriverNav({ drivers, sel, setSel }) {
  return (
    <nav aria-label="Drivers" data-part="driver-nav" style={{ flex: "1 1 220px", maxWidth: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: dsSpace[2], padding: `${dsSpace[16]}px 0`, background: ds.surface.general.cardWithinCard, borderRadius: radius.widget, position: "sticky", top: 0, fontFamily: font }}>
      {drivers.map((d) => {
        const active = d === sel;
        const v = driverAt(d, LAST);
        return (
          <button
            key={d} onClick={() => setSel(d)} aria-current={active ? "true" : undefined} className="driver-nav-item"
            style={{ textAlign: "left", border: "none", cursor: "pointer", background: active ? ds.button.brand.ghost.bg.hover : "transparent", padding: `${dsSpace[8]}px ${dsSpace[16] + dsSpace[2]}px`, fontFamily: font, ...dsText("Text xs", active ? 700 : 500), color: ds.text.secondary }}
          >
            {d} <b style={{ fontWeight: 700, color: dsBand(v).cs, fontVariantNumeric: "tabular-nums" }}>{v}</b>
          </button>
        );
      })}
    </nav>
  );
}

/* `content` (optional) overrides the templated guidance per Driver: { [driver]: { science?, cites? } }. */
export function ActionsLayer({ drivers, selected, content }) {
  const refined = useStoryStyle() === "refined";
  const [sel, setSel] = useState(selected);
  const value = driverAt(sel, LAST);
  const g = guidance(sel, value);
  const extra = content?.[sel] || {};
  const shareText = () => [g.actions.title, g.actions.subtitle, g.actions.summary, g.actions.body, "", "Think about:", ...g.think.map((q) => `- ${q}`)].filter((x) => x != null).join("\n");

  if (!refined) {
    // Figma 13622:36883: nav a third of the width, the Action Stories two thirds, 16px apart. Below about 640px the
    // nav sits above the cards.
    return (
      <div style={{ display: "flex", gap: dsSpace[16], flexWrap: "wrap", alignItems: "flex-start", fontFamily: font }}>
        <DriverNav drivers={drivers} sel={sel} setSel={setSel} />
        <div key={sel} style={{ flex: "2 1 400px", minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
          <ActionsYouCanTakeCard g={g.actions} shareText={shareText} />
          <ThinkAboutCard items={g.think} />
          <PlaybookCard items={g.playbook} />
          {extra.science && <LoveScienceCard science={extra.science} sample={false} />}
          {extra.cites?.length > 0 && <CitationsCard cites={extra.cites} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", fontFamily: font }}>
      <nav aria-label="Drivers" style={{ flex: "0 0 256px", maxWidth: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 0, padding: "0 8px 0 0" }}>
        {drivers.map((d) => {
          const active = d === sel;
          return (
            <button
              key={d} onClick={() => setSel(d)} aria-current={active ? "true" : undefined}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.gray75; }} onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              style={{ textAlign: "left", border: "none", cursor: "pointer", background: active ? T.gray25 : "transparent", borderRadius: radius.sm, padding: "10px 12px", fontFamily: font, fontSize: 14, lineHeight: "18px", color: T.gray900, fontWeight: active ? 600 : 400, display: "flex", gap: 6, alignItems: "baseline", boxShadow: active ? `inset 2px 0 0 ${T.gray900}` : "none" }}
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
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.2px", color: T.gray900 }}>{g.actions.title}</span>
            <p style={{ ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "58ch", textWrap: "pretty" }}>{g.actions.summary}</p>
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" }}>
            {g.actions.steps.map((s, i) => (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${T.gray50}` : "none", ...bodyText, fontSize: 15, lineHeight: "22px" }}>
                <span style={{ fontSize: 20, fontWeight: 600, color: T.gray300, fontVariantNumeric: "tabular-nums", lineHeight: "22px" }}>{i + 1}</span>{s}
              </li>
            ))}
          </ol>
        </ScopeCard>

        <ScopeCard>
          <ScopeCardTitle>Think About</ScopeCardTitle>
          <SampleTag />
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {g.think.map((q, i) => <li key={i} style={{ ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "62ch", paddingLeft: 16, boxShadow: `inset 2px 0 0 ${T.gray75}` }}>{q}</li>)}
          </ul>
        </ScopeCard>

        <ScopeCard>
          <ScopeCardTitle>From the Playbook</ScopeCardTitle>
          <SampleTag />
          <dl style={{ margin: 0, display: "flex", flexDirection: "column" }}>
            {g.playbook.map(([lead, rest], i) => (
              <div key={lead} style={{ display: "grid", gridTemplateColumns: "160px minmax(0, 1fr)", gap: 20, padding: "12px 0", borderTop: i ? `1px solid ${T.gray50}` : "none" }}>
                <dt style={{ fontSize: 15, fontWeight: 600, color: T.gray900 }}>{lead}</dt>
                <dd style={{ margin: 0, ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "52ch" }}>{rest}</dd>
              </div>
            ))}
          </dl>
        </ScopeCard>
      </div>
    </div>
  );
}

export { DarkPill };
