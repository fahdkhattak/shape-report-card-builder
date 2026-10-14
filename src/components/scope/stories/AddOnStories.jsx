import { useState } from "react";
import { ExternalLink, ChevronRight, Play, ChevronDown, ChevronUp } from "lucide-react";
import { T, font, radius } from "../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../lib/ds.js";
import Button from "../../ui/Button.jsx";
import { StoryCard, SampleTag, bodyText, noteText } from "./StoryCard.jsx";
import { useStoryStyle } from "./storyStyle.js";
import { useOwnWidth } from "./storyWidth.js";
import { CitationsCard } from "./ActionStories.jsx";
import resourceArt from "../../../assets/stories/resource-flow.svg";
import supportArt from "../../../assets/stories/support-heart.svg";
import phoneIcon from "../../../assets/stories/phone.svg";
import reportIcon from "../../../assets/stories/report-icon.svg";
import premiumIcon from "../../../assets/stories/premium-icon.svg";

/* ================================================================== */
/* ADD-ON STORIES: the Stories that point beyond the widget's own data.  */
/*   ResourceStory        a guide, paper or tool (Figma 13622:37387)      */
/*   SupportResourceStory conditional support, e.g. the EAP (13622:37402) */
/*   UpgradePathStory     an add-on product (13622:37469)                 */
/*   CitationStory        the sources behind an insight (13622:40137/42)  */
/*   VideoStory, QuestionnaireStory  not designed in Figma; built from    */
/*                        the same parts (Story card, 124px side column,  */
/*                        dark pills) and flagged for design review.      */
/* There is no resource library, product catalogue, purchasing model,      */
/* video host or answer store in this prototype, so copy is sample and     */
/* buttons that would leave the page are inert (they say so on hover).    */
/* Read off the frames: the side column is 124px with the 60px art 16px    */
/* from its top, 16px to the text; title Text sm / Bold text/primary and   */
/* body Text sm text/secondary 8px apart; actions 16px under the text.     */
/* ================================================================== */

/* The design's buttons, three sizes: "xs" 24px (Text 2xs, 6+2px sides), "sm" 32px (Text 2xs, 16+2px sides, 16px icon),
   "md" 36px (Text sm, 16+2px sides). Primary is the dark brand pill; secondary the outlined one. */
export function StoryButton({ children, variant = "primary", size = "sm", icon, iconRight, title, onClick, href }) {
  // A fixed height per size (border included), so an icon or the outline never makes a button taller than the design's.
  const s = { xs: { h: 24, px: dsSpace[6], text: "Text 2xs" }, sm: { h: 32, px: dsSpace[16], text: "Text 2xs" }, md: { h: 36, px: dsSpace[16], text: "Text sm" } }[size];
  const primary = variant === "primary";
  const Tag = href ? "a" : "button";
  return (
    <Tag
      href={href} target={href ? "_blank" : undefined} rel={href ? "noreferrer" : undefined} onClick={onClick} title={title} data-part="story-button"
      style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], height: s.h, padding: `0 ${s.px + dsSpace[2]}px`, borderRadius: dsRadius.full, boxSizing: "border-box", border: primary ? "none" : `${dsBorder.sm}px solid ${ds.button.brand.secondary.border.default}`, background: primary ? ds.button.brand.primary.bg.default : "transparent", color: primary ? ds.button.brand.primary.items.defaultText : ds.button.brand.secondary.items.defaultText, ...dsText(s.text), fontFamily: font, whiteSpace: "nowrap", cursor: onClick || href ? "pointer" : "default", textDecoration: "none", flexShrink: 0 }}
    >
      {icon}{children}{iconRight}
    </Tag>
  );
}

/* The shared body: the side column (art or a tile) beside the title, text and actions. On a compact card the art sits
   above the text instead of beside it. */
function SideAndText({ side, title, body, bodyTone = "secondary", actions, compact }) {
  return (
    <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: dsSpace[16], alignItems: compact ? "flex-start" : "stretch", fontFamily: font }}>
      {side}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
          <p data-part="resource-title" style={{ margin: 0, ...dsText("Text sm", 700), color: ds.text.primary }}>{title}</p>
          <p data-part="resource-body" style={{ margin: 0, ...dsText("Text sm"), color: bodyTone === "tertiary" ? ds.text.tertiary : ds.text.secondary }}>{body}</p>
        </div>
        {actions && <div style={{ display: "flex", gap: dsSpace[12], flexWrap: "wrap" }}>{actions}</div>}
      </div>
    </div>
  );
}
const artColumn = (src, compact) => (
  <div data-part="art-column" style={{ width: compact ? "auto" : 124, flexShrink: 0, boxSizing: "border-box", padding: compact ? 0 : `${dsSpace[16]}px ${dsSpace[12]}px 0`, display: "flex", justifyContent: "center" }}>
    <img src={src} alt="" width={60} height={60} style={{ display: "block", objectFit: "contain" }} />
  </div>
);
const INERT = "Nothing to open in this prototype";

/* ---- Resource ------------------------------------------------------------------------------------------------------ */
/* `title` is the Story title ("Explore [Flow at Work] This Further"); `resource` the item's name; `description` what it is;
   `linkLabel` the CTA ("Get White Paper"). */
export function ResourceStory({ title, resource = "How the Five Areas Shape Your Experience at Work", description, linkLabel = "Get White Paper", href, sample = true }) {
  const refined = useStoryStyle() === "refined";
  const [ref, { compact }] = useOwnWidth();
  if (refined) {
    // The link is a link: text with an arrow, not a bordered button.
    return (
      <StoryCard title={title}>
        {sample && <SampleTag>Sample resource</SampleTag>}
        <p style={{ ...bodyText, fontSize: 16, lineHeight: "24px", maxWidth: "62ch", textWrap: "pretty" }}>{description}</p>
        <span title={INERT} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, color: T.gray900, textDecoration: "underline", textUnderlineOffset: 4, textDecorationColor: T.gray300, cursor: "default" }}>
          {linkLabel}<ExternalLink size={15} />
        </span>
      </StoryCard>
    );
  }
  return (
    <div ref={ref}>
      <StoryCard title={title} data-story="resource">
        {sample && <SampleTag>Sample resource</SampleTag>}
        <SideAndText compact={compact} side={artColumn(resourceArt, compact)} title={resource} body={description}
          actions={<StoryButton size="xs" href={href} title={href ? undefined : INERT}>{linkLabel}</StoryButton>} />
      </StoryCard>
    </div>
  );
}

/* ---- Conditional support ------------------------------------------------------------------------------------------ */
/* Shown only when its trigger fires (e.g. a Mental Well-Being result in the severe range) and only with a verified service.
   `service`: { name, description, ctaLabel, href, phone }. */
export function SupportResourceStory({ title = "Support Is Available", service, sample = true }) {
  const [ref, { compact }] = useOwnWidth();
  const s = service || { name: "[BetterHelp], your organisation's EAP service can help you", description: "[Your organisation's Employee Assistance Programme (EAP)] is a confidential service to support with personal and psychological health concerns. SHAPE looks at factors like depression, anxiety, stress and how they affect you and your work performance. You can check your scores here. Connect with your company service now for immediate help.", ctaLabel: "Go to EAP Service", phone: "888-688-9296" };
  return (
    <div ref={ref}>
      <StoryCard title={title} data-story="resource-support">
        {sample && <SampleTag>Sample service</SampleTag>}
        <SideAndText compact={compact} side={artColumn(supportArt, compact)} title={s.name} body={s.description}
          actions={<>
            <StoryButton size="sm" href={s.href} title={s.href ? undefined : INERT} iconRight={<ChevronRight size={16} aria-hidden="true" />}>{s.ctaLabel}</StoryButton>
            {s.phone && <StoryButton size="sm" variant="secondary" href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} icon={<img src={phoneIcon} alt="" width={16} height={16} />}>{s.phone}</StoryButton>}
          </>} />
      </StoryCard>
    </div>
  );
}

/* ---- Upgrade Path --------------------------------------------------------------------------------------------------- */
/* Rules (from the board): visually separate from the result and guidance; after the result, explanation and diagnostics;
   explains how it connects to the current insight; only for products not already owned; hidden if unavailable; when the
   reader can't buy, the CTA becomes Ask Your Admin or Contact Creator. `canBuy` picks the CTA. */
export function UpgradePathStory({ eyebrow = "Available to Add", title = "See the Wider Team Picture", description = "Add Team Analytics to compare results across your team, identify shared patterns, and see where support may be needed.", cta = "Get Team Analytics", altCta = "Contact Creator", canBuy = true, preview, sample = true }) {
  const refined = useStoryStyle() === "refined";
  const [ref, { compact }] = useOwnWidth();
  if (refined) {
    // Still visibly apart from the result (the board's rule): a tinted panel, no dashed border or caps.
    return (
      <div style={{ background: T.gray25, borderRadius: radius.xl, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", fontFamily: font }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.gray500 }}>{eyebrow}</span>
        <p style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: "30px", letterSpacing: "-0.4px", color: T.gray900, textWrap: "balance" }}>{title}</p>
        <p style={{ ...bodyText, fontSize: 16, lineHeight: "24px", maxWidth: "58ch", textWrap: "pretty" }}>{description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
          <Button theme="brand" variation="primary" size="sm" title="No purchasing flow exists in this prototype">{canBuy ? cta : altCta}</Button>
          <SampleTag>Sample offer</SampleTag>
        </div>
      </div>
    );
  }
  const tile = (
    <div data-part="preview-tile" style={{ width: compact ? "100%" : 124, minHeight: compact ? 96 : undefined, flexShrink: 0, alignSelf: "stretch", background: ds.bg.primary, borderRadius: dsRadius.lg, overflow: "hidden" }}>
      {preview && <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
    </div>
  );
  return (
    <div ref={ref}>
      <StoryCard data-story="upgrade" title={eyebrow} controls={[
        <span key="i" style={{ display: "inline-flex", gap: dsSpace[8], alignItems: "center" }} aria-hidden="true">
          <img src={reportIcon} alt="" width={24} height={24} data-part="upgrade-icon" />
          <img src={premiumIcon} alt="" width={24} height={24} data-part="upgrade-icon" />
        </span>,
      ]}>
        {sample && <SampleTag>Sample offer</SampleTag>}
        <SideAndText compact={compact} side={tile} title={title} body={description} bodyTone="tertiary"
          actions={<>
            {canBuy && <StoryButton size="md" title="No purchasing flow exists in this prototype">{cta}</StoryButton>}
            <StoryButton size="md" title="No purchasing flow exists in this prototype">{altCta}</StoryButton>
          </>} />
      </StoryCard>
    </div>
  );
}

/* ---- Citation ------------------------------------------------------------------------------------------------------- */
/* The same card the Actions layer uses (13622:36973): collapsed it is a 56px bar, open it lists each source. */
export function CitationStory({ cites, defaultOpen = false }) {
  return <CitationsCard cites={cites} defaultOpen={defaultOpen} />;
}

/* ---- Video (not designed) ------------------------------------------------------------------------------------------ */
/* A 16:9 poster with a centred play button and the duration, a caption, and a transcript that opens like Citations.
   `src` plays a real file when there is one; without it the poster is inert. */
export function VideoStory({ title = "Watch: What Your Score Means", line, caption, duration = "2:30", src, poster, transcript, sample = true }) {
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <StoryCard title={title} line={line} data-story="video">
      {sample && <SampleTag>Sample video</SampleTag>}
      <div data-part="video-frame" style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: dsRadius.lg, overflow: "hidden", background: ds.bg.inverse }}>
        {playing && src ? (
          <video src={src} controls autoPlay style={{ width: "100%", height: "100%", display: "block", background: "#000" }} />
        ) : (
          <>
            {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
            <button onClick={() => src && setPlaying(true)} aria-label={src ? `Play ${title}` : `${title} (no video in this prototype)`} title={src ? undefined : "No video in this prototype"}
              style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 56, height: 56, borderRadius: "50%", border: "none", cursor: src ? "pointer" : "default", background: ds.surface.general.card, color: ds.text.primary, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
              <Play size={22} fill="currentColor" style={{ marginLeft: 3 }} />
            </button>
            <span style={{ position: "absolute", right: dsSpace[12], bottom: dsSpace[12], background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: dsRadius.full, padding: `${dsSpace[2]}px ${dsSpace[8]}px`, ...dsText("Text 2xs", 600), fontFamily: font }}>{duration}</span>
          </>
        )}
      </div>
      {caption && <p style={{ ...bodyText, fontFamily: font }}>{caption}</p>}
      {transcript && (
        <div style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, paddingTop: dsSpace[12], fontFamily: font }}>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: 0, ...dsText("Text sm", 700), fontFamily: font, color: ds.text.secondary }}>
            Transcript {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {open && <p style={{ ...bodyText, marginTop: dsSpace[12] }}>{transcript}</p>}
        </div>
      )}
    </StoryCard>
  );
}

/* ---- Questionnaire (not designed) -------------------------------------------------------------------------------- */
/* A short set of related questions, one at a time, each answered on a five-point scale of pills (Strongly disagree ...
   Strongly agree), with a step count, Back / Next and a Submit. Answers stay in the page: there is no answer store, so the
   finish state says so plainly. questions: string[]. */
const SCALE = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
export function QuestionnaireStory({ title = "A Few Quick Questions", line = "Three short questions about this result. They take under a minute.", questions, sample = true }) {
  const qs = questions || ["I understand what's behind this score.", "I know one thing I could change to improve it.", "My team talks openly about this topic."];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const last = step === qs.length - 1;
  return (
    <StoryCard title={title} line={line} data-story="questionnaire">
      {sample && <SampleTag>Sample questions</SampleTag>}
      {done ? (
        <div role="status" style={{ background: ds.surface.general.cardWithinCard, borderRadius: dsRadius.lg, padding: dsSpace[16], fontFamily: font, display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
          <p style={{ margin: 0, ...dsText("Text sm", 700), color: ds.text.primary }}>Thanks, that's everything.</p>
          <p style={{ ...noteText }}>Your answers stay on this page in the prototype; nothing is sent anywhere.</p>
          <div><StoryButton size="xs" variant="secondary" onClick={() => { setDone(false); setStep(0); setAnswers({}); }}>Start again</StoryButton></div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16], fontFamily: font }}>
          <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8] }}>
            <span style={{ ...dsText("Text 2xs", 600), color: ds.text.tertiary }}>Question {step + 1} of {qs.length}</span>
            <div aria-hidden="true" style={{ flex: 1, height: 4, borderRadius: dsRadius.full, background: ds.bg.secondary, overflow: "hidden" }}>
              <div style={{ width: `${((step + 1) / qs.length) * 100}%`, height: "100%", background: ds.text.primary, transition: "width 200ms ease" }} />
            </div>
          </div>
          <p data-part="question" style={{ margin: 0, ...dsText("Text md", 700), color: ds.text.primary }}>{qs[step]}</p>
          <div role="radiogroup" aria-label={qs[step]} style={{ display: "flex", gap: dsSpace[8], flexWrap: "wrap" }}>
            {SCALE.map((label, k) => {
              const on = answers[step] === k;
              return (
                <button key={label} role="radio" aria-checked={on} onClick={() => setAnswers((a) => ({ ...a, [step]: k }))}
                  style={{ border: `${dsBorder.sm}px solid ${on ? ds.bg.inverse : ds.border.secondary}`, background: on ? ds.bg.inverse : ds.surface.general.card, color: on ? ds.text.inverse : ds.text.secondary, borderRadius: dsRadius.full, padding: `${dsSpace[6]}px ${dsSpace[12]}px`, ...dsText("Text xs"), fontFamily: font, cursor: "pointer" }}>
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: dsSpace[12], justifyContent: "space-between" }}>
            <StoryButton size="xs" variant="secondary" onClick={step ? () => setStep((s) => s - 1) : undefined} title={step ? undefined : "This is the first question"}>Back</StoryButton>
            <StoryButton size="xs" onClick={answers[step] == null ? undefined : () => (last ? setDone(true) : setStep((s) => s + 1))} title={answers[step] == null ? "Pick an answer first" : undefined}>{last ? "Submit" : "Next"}</StoryButton>
          </div>
        </div>
      )}
    </StoryCard>
  );
}
