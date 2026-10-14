import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace, dsBorder, dsShadow } from "../../../lib/ds.js";
import { LAST, roundName, sinceText } from "../../../lib/scopeData.js";
import { StoryCard, EvidenceSection, bodyText } from "./StoryCard.jsx";
import { StatusFaceIcon } from "../../widgets/primitives.jsx";
import { useCompare, CompareControl } from "./controls.jsx";
import { useStoryStyle } from "./storyStyle.js";
import { FLOURISHING_AT, STRIVING_AT, statusName } from "../../../lib/bands.js";

/* ================================================================== */
/* INSIGHT SUMMARY / MEANING / METHODOLOGY STORIES                      */
/* (Figma 13622:39509, 13622:37198, 13622:37419). Three different jobs,  */
/* kept deliberately separate:                                           */
/*   Insight Summary — a short plain-language overview of the insight    */
/*   Meaning        — what the current result means for the reader      */
/*   Methodology    — what the measure is and how it's worked out;       */
/*                    never interprets the reader's own score            */
/* ================================================================== */
export const Strong = ({ c, children }) => <b style={{ color: c }}>{children}</b>;

/* The colour of a number inside Insight Summary text, from Figma node 13622:39511: Flourishing uses the
   strong green (#0B703F), Striving and Struggling use the base amber / red (#F1A118 / #CC2944).
   Figma binds these as status/success/text-strong, status/warning/text and status/error/text; in the v4
   design-system file the #0B703F value is `status/success/text-indicator` (its `text-strong` is #08542F). */
export const STATUS_TEXT = { success: ds.status.success.textIndicator, warning: ds.status.warning.text, error: ds.status.error.text };
export const statusText = (v) => STATUS_TEXT[dsBand(v).key];

/* Insight Summary — Figma 13622:39511. Title (Text lg/Bold), body paragraphs 14px apart, and an optional
   Evidence Section: a hairline above and below (border/primary) around the 8px evidence bar, 16px padding. */
export function InsightSummaryStory({ headline, children, bar }) {
  const refined = useStoryStyle() === "refined";
  return (
    <StoryCard title={headline} titleSize={refined ? 20 : 18} data-story="insight-summary">
      <div data-part="body" style={{ display: "flex", flexDirection: "column", gap: refined ? dsSpace[12] : 14 }}>
        {children}
      </div>
      {bar && (refined ? bar : (
        <EvidenceSection>{bar}</EvidenceSection>
      ))}
    </StoryCard>
  );
}
export const SummaryP = ({ children }) => {
  // Refined: 16px with a readable line length (the body copy of the headline Story).
  const refined = useStoryStyle() === "refined";
  return <p style={refined ? { ...bodyText, fontSize: 16, lineHeight: "24px", maxWidth: "62ch", textWrap: "pretty" } : bodyText}>{children}</p>;
};

/* A row of segments, one per item, coloured by band — the "evidence bar". */
export function BandBar({ values }) {
  const n = (lo, hi) => values.filter(([, v]) => v >= lo && v < hi).length;
  const label = `${values.length} parts: ${n(FLOURISHING_AT, Infinity)} Flourishing, ${n(STRIVING_AT, FLOURISHING_AT)} Striving, and ${n(-Infinity, STRIVING_AT)} Struggling`;
  return (
    <div data-part="bar" role="img" aria-label={label} style={{ display: "flex", height: dsSpace[8], borderRadius: dsRadius.full, overflow: "hidden" }}>
      {values.map(([name, v]) => <div key={name} title={`${name} · ${v}`} style={{ flex: 1, background: dsBand(v).c }} />)}
    </div>
  );
}

/* value: the current number; `values` (optional, per round) turns on the
   Compare-previous-rounds control; `bandColor` colours the number by band. */
/* Where a score sits against the two status thresholds: a track in the three
   status tints with a marker at the score. The number says "59"; this says "59 is
   one point short of Striving". */
export function ThresholdScale({ value }) {
  const b = dsBand(value);
  const zone = (from, to, c) => <span style={{ position: "absolute", left: `${from}%`, width: `${to - from}%`, top: 0, bottom: 0, background: c, opacity: 0.28 }} />;
  const tick = (v) => <span style={{ position: "absolute", left: `${v}%`, top: 12, transform: "translateX(-50%)", ...dsText("Text 3xs"), color: ds.text.tertiary, fontVariantNumeric: "tabular-nums" }}>{v}</span>;
  return (
    <div role="img" aria-label={`${value} out of 100`} style={{ position: "relative", maxWidth: 440, paddingBottom: dsSpace[24], fontFamily: font }}>
      <div style={{ position: "relative", height: dsSpace[6], borderRadius: dsRadius.full, overflow: "hidden" }}>
        {zone(0, STRIVING_AT, ds.status.error.graph)}{zone(STRIVING_AT, FLOURISHING_AT, ds.status.warning.graph)}{zone(FLOURISHING_AT, 100, ds.status.success.graph)}
      </div>
      <span style={{ position: "absolute", left: `${value}%`, top: -4, width: 14, height: 14, marginLeft: -7, borderRadius: "50%", background: ds.surface.general.card, border: `${dsBorder.lg}px solid ${b.c}`, boxSizing: "border-box", boxShadow: dsShadow("xs") }} />
      <span style={{ position: "absolute", left: 0, top: 12, ...dsText("Text 3xs"), color: ds.text.tertiary }}>0</span>
      {tick(STRIVING_AT)}{tick(FLOURISHING_AT)}
      <span style={{ position: "absolute", right: 0, top: 12, ...dsText("Text 3xs"), color: ds.text.tertiary }}>100</span>
    </div>
  );
}

/* The tinted tile of a Meaning with a value and units ("2 yrs 3 mo"), Figma 13622:37213. */
function MeaningTile({ parts, status }) {
  const k = { Flourishing: "success", Striving: "warning", Struggling: "error" }[status] || "success";
  const st = ds.status[k];
  return (
    <div data-part="tile" style={{ minWidth: 115, minHeight: 94, alignSelf: "stretch", boxSizing: "border-box", background: st.bg, borderRadius: dsRadius.lg, display: "flex", alignItems: "center", justifyContent: "center", gap: dsSpace[4], padding: `0 ${dsSpace[8]}px` }}>
      {parts.map((p) => (
        <span key={p.unit} style={{ display: "inline-flex", alignItems: "baseline" }}>
          <span data-part="number" style={{ ...dsText("Display md", 700), lineHeight: "16px", color: st.textIndicator }}>{p.value}</span>
          <span data-part="unit" style={{ ...dsText("Text 3xs-Trim"), color: ds.text.primary }}>{p.unit}</span>
        </span>
      ))}
    </div>
  );
}

/* Score Meaning, Current style (Figma 13622:37199 / 37213). Three forms:
   number  - the score at 64px with "/100", then a bold sentence and a paragraph
   ring    - the Explorer Scope's ring instead of the number (Figma 14531:21543)
   tile    - a tinted tile holding a value with units ("2 yrs 3 mo") and one bold sentence, no paragraph */
export function MeaningStory({ title, value, unit, bandColor = true, headline, text, values, ring = false, tile }) {
  const cmp = useCompare();
  const refined = useStoryStyle() === "refined";
  const b = dsBand(value);
  const prev = values ? values[cmp.refIdx] : null;
  if (refined) {
    return (
      <StoryCard title={title} controls={values && <CompareControl cmp={cmp} />}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
          {ring ? <ScoreRing value={value} size={88} stroke={8} /> : (
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 80, fontWeight: 600, letterSpacing: -2.4, lineHeight: 0.95, color: bandColor ? b.cs : ds.text.primary }}>{value}</span>
              {unit && <span style={{ fontSize: 13, color: ds.text.tertiary }}>{unit}</span>}
            </div>
          )}
          <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0, paddingTop: 6 }}>
            <p style={{ margin: 0, fontSize: 18, lineHeight: "26px", fontWeight: 600, letterSpacing: "-0.2px", color: ds.text.primary, textWrap: "balance" }}>{headline}</p>
            <p style={{ ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "52ch", textWrap: "pretty" }}>{text}</p>
          </div>
        </div>
        {bandColor && <ThresholdScale value={value} />}
        {cmp.on && prev != null && (
          <p style={{ ...bodyText, ...dsText("Text xs") }}>
            {roundName(cmp.refIdx)}: <b>{prev}</b> → now <b>{values[LAST]}</b> · {sinceText(values[LAST] - prev, roundName(cmp.refIdx))}
          </p>
        )}
      </StoryCard>
    );
  }
  const lead = ring ? <ScoreRing value={value} />
    : tile ? <MeaningTile {...tile} />
    : (
      <div data-part="value" style={{ minWidth: 115, boxSizing: "border-box", padding: `0 ${dsSpace[8]}px`, display: "flex", alignItems: "baseline", justifyContent: "center", alignSelf: "center" }}>
        <span data-part="number" style={{ ...dsText("Display 1.5xl-Trim", 700), lineHeight: "normal", textBox: "trim-both cap alphabetic", color: bandColor ? b.cs : ds.text.primary }}>{value}</span>
        {unit && <span data-part="unit" style={{ ...dsText("Text 3xs-Trim"), color: ds.text.secondary }}>{unit}</span>}
      </div>
    );
  return (
    <StoryCard title={title} controls={values && <CompareControl cmp={cmp} />} data-story="meaning">
      <div data-part="row" style={{ display: "flex", alignItems: "center", gap: dsSpace[16], flexWrap: "wrap" }}>
        {lead}
        <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: dsSpace[8], minWidth: 0 }}>
          <p data-part="headline" style={{ ...bodyText, fontWeight: 700 }}>{headline}</p>
          {!tile && text && <p data-part="text" style={bodyText}>{text}</p>}
        </div>
      </div>
      {cmp.on && prev != null && (
        <p style={{ ...bodyText, ...dsText("Text xs") }}>
          {roundName(cmp.refIdx)}: <b>{prev}</b> → now <b>{values[LAST]}</b> · {sinceText(values[LAST] - prev, roundName(cmp.refIdx))}
        </p>
      )}
    </StoryCard>
  );
}

/* A circular score ring (the Explorer Scope's Meaning, Figma 14531:21543). */
export function ScoreRing({ value, size = 72, stroke = 7 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, b = dsBand(value);
  return (
    <div data-part="ring" role="img" aria-label={`${value} out of 100, ${statusName(value)}`} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg aria-hidden="true" width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ds.interactive.ghostHover} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={b.c} strokeWidth={stroke} strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 700, color: b.cs }}>{value}</span>
    </div>
  );
}

/* A status-style Meaning (no number), Figma 13622:37225: a tinted tile with the status face, a bold
   "You're Flourishing." line, and one or two paragraphs 14px apart.
   `status` is "Flourishing" | "Striving" | "Struggling". `text` is a string or an array of paragraphs.
   (Refined still takes the older `label` + `color`.) */
const STATUS_KIND = { Flourishing: "success", Striving: "warning", Struggling: "error" };
export function StatusMeaningStory({ title, status, text, label, color }) {
  const st = ds.status[STATUS_KIND[status] || "success"];
  const paras = Array.isArray(text) ? text : [text];
  if (useStoryStyle() === "refined") {
    const c = color || st.textIndicator, l = label || `You're ${status}.`;
    return (
      <StoryCard title={title}>
        <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 14, fontSize: 40, fontWeight: 600, lineHeight: "44px", letterSpacing: "-1px", color: c }}>
          <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: "50%", background: c, flexShrink: 0 }} />{l}
        </p>
        <p style={{ ...bodyText, fontSize: 16, lineHeight: "24px", maxWidth: "62ch", textWrap: "pretty" }}>{paras.join(" ")}</p>
      </StoryCard>
    );
  }
  return (
    <StoryCard title={title} data-story="meaning-status">
      <div data-part="row" style={{ display: "flex", alignItems: "center", gap: dsSpace[16], flexWrap: "wrap" }}>
        <div data-part="tile" aria-hidden="true" style={{ minWidth: 115, alignSelf: "stretch", boxSizing: "border-box", background: st.bg, borderRadius: dsRadius.lg, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 94 }}>
          <StatusFaceIcon size={48} color={st.icon} status={status} />
        </div>
        <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: dsSpace[8], minWidth: 0 }}>
          <p data-part="headline" style={{ ...bodyText, fontWeight: 700 }}>You're <span style={{ color: st.textIndicator }}>{status}.</span></p>
          <div data-part="text" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {paras.map((t, i) => <p key={i} style={bodyText}>{t}</p>)}
          </div>
        </div>
      </div>
    </StoryCard>
  );
}

/* ---- Methodology ---------------------------------------------------- */
const STATUS_ROWS = [
  ["Flourishing", `${FLOURISHING_AT} – 100`, ds.status.success.graph, ds.status.success.textIndicator, "High scores signify a state of flourishing. Most of the hard work has been done — adjustments bring marginal gains and help maintain excellence."],
  ["Striving", `${STRIVING_AT} – ${FLOURISHING_AT - 1}`, ds.status.warning.graph, ds.status.warning.textIndicator, "Mid-range scores signify room to improve. They point to areas where striving results in real gains."],
  ["Struggling", `0 – ${STRIVING_AT - 1}`, ds.status.error.graph, ds.status.error.textIndicator, "Lower scores signify struggling. They point to areas that will benefit most from targeted attention."],
];

const METHOD = {
  score: {
    title: "How Your Score Is Worked Out",
    paras: [
      "Every score runs from 0 to 100, and a higher score is always better. Each question belongs to a Driver, each Driver rolls up into one of 12 Explorers, and the Explorers combine into the overall score.",
      "A Driver's score is the average of the answers about it. An Explorer's score is the average of its Drivers. The organisation's score is the average of everyone's overall score for the round.",
    ],
  },
  enps: {
    title: "How eNPS Is Worked Out",
    paras: [
      "Everyone answers one question: how likely are you to recommend this organisation as a place to work, from 0 to 10. Answers of 9–10 are Promoters, 7–8 are Passives, and 0–6 are Detractors.",
      "eNPS is the percentage of Promoters minus the percentage of Detractors, so it runs from −100 to +100. Passives count towards the total but not the score.",
    ],
  },
  time: {
    title: "How This Estimate Works",
    paras: [
      "This is a prototype estimate, not a validated calculation: it takes the organisation's Work-life balance score and divides it by four to show hours per year.",
      "It exists to show how the widget behaves with real data. The production method will replace it.",
    ],
  },
};

export function MethodologyStory({ kind }) {
  const refined = useStoryStyle() === "refined";
  if (refined && kind === "status") {
    // A definition list, not three boxed callouts: dot + name + range, then the meaning.
    return (
      <StoryCard title="How Your Status Is Determined" line="Scores run from 0 to 100. Each score falls into one of three status ranges:">
        <div style={{ display: "flex", flexDirection: "column", fontFamily: font }}>
          {STATUS_ROWS.map(([name, range, c, cs, text], i) => (
            <div key={name} style={{ display: "grid", gridTemplateColumns: "150px minmax(0, 1fr)", gap: 24, padding: "16px 0", borderTop: i ? `${dsBorder.sm}px solid ${ds.border.tertiary}` : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: cs }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{name}</span>
                <span style={{ fontSize: 13, color: ds.text.tertiary, fontVariantNumeric: "tabular-nums", paddingLeft: 16 }}>{range}</span>
              </div>
              <span style={{ ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "58ch", textWrap: "pretty" }}>{text}</span>
            </div>
          ))}
        </div>
      </StoryCard>
    );
  }
  if (kind === "status") {
    return (
      <StoryCard title="How Your Status Is Determined" line="Scores run from 0 to 100. Each score falls into one of three status ranges:">
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], fontFamily: font }}>
          {STATUS_ROWS.map(([name, range, c, cs, text]) => (
            <div key={name} style={{ borderLeft: `${dsBorder.lg}px solid ${c}`, paddingLeft: dsSpace[12], display: "flex", flexDirection: "column", gap: dsSpace[4] }}>
              <span style={{ ...dsText("Text sm", 700), color: cs }}>{name} <span style={{ fontWeight: 400, color: ds.text.secondary }}>{range}</span></span>
              <span style={bodyText}>{text}</span>
            </div>
          ))}
        </div>
      </StoryCard>
    );
  }
  const m = METHOD[kind];
  return (
    <StoryCard title={m.title}>
      {m.paras.map((p, i) => <p key={i} style={refined ? { ...bodyText, fontSize: 15, lineHeight: "24px", maxWidth: "62ch", textWrap: "pretty" } : bodyText}>{p}</p>)}
    </StoryCard>
  );
}
