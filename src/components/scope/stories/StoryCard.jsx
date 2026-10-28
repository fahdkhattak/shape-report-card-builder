import { ds, dsShadow, dsText, dsRadius, dsSpace, dsBorder } from "../../../lib/ds.js";
import { useRef } from "react";
import { useStoryStyle, useStoryMeta } from "./storyStyle.js";
import { StoryWidthProvider, sizeFor, useElementWidth, useStoryWidth } from "./storyWidth.js";

/* ================================================================== */
/* STORY CARD — the shell every Story shares (Figma "Segment basic     */
/* structure", node 13622:39523): Story title, Controls/Functions,      */
/* an optional explanatory line, the main content, and optional text.   */
/* Stories are cards up to 808px wide; the Scope pane centres them.     */
/* ================================================================== */
export function ScopeCard({ children, style, ...rest }) {
  // Refined: each Story is its own card — one calm white surface, a tinted soft shadow and generous
  // padding, with space (not a hairline) between cards, so a long Scope reads as separate pieces
  // rather than one endless report. Tabular figures so numbers line up down a column.
  // The card measures itself so every Story inside can respond to its own width (see storyWidth.js).
  const refined = useStoryStyle() === "refined";
  const ref = useRef(null);
  const width = useElementWidth(ref);
  const Tag = refined ? "section" : "div";
  const base = refined
    ? { background: ds.surface.general.card, borderRadius: dsRadius["2xl"], padding: "28px 32px 32px", boxShadow: dsShadow("sm"), display: "flex", flexDirection: "column", gap: 20, boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }
    : { background: ds.surface.general.card, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.widget, padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[16], boxSizing: "border-box" };
  return (
    <StoryWidthProvider value={sizeFor(width)}>
      <Tag ref={ref} style={{ ...base, ...style }} {...rest}>{children}</Tag>
    </StoryWidthProvider>
  );
}

export const ScopeCardTitle = ({ children, size = 18 }) => {
  if (useStoryStyle() === "refined") {
    return <h3 style={{ margin: 0, fontSize: size === 20 ? 26 : 22, lineHeight: size === 20 ? "32px" : "28px", fontWeight: 600, letterSpacing: "-0.4px", color: ds.text.primary, textWrap: "balance" }}>{children}</h3>;
  }
  return <p style={{ margin: 0, ...dsText(size === 20 ? "Text xl" : "Text lg", 700), color: ds.text.primary }}>{children}</p>;
};

export const bodyText = { ...dsText("Text sm"), color: ds.text.secondary, margin: 0 };
export const noteText = { ...dsText("Text xs"), color: ds.text.tertiary, margin: 0 };
const leadText = { ...dsText("Text md"), color: ds.text.secondary, margin: 0, maxWidth: "64ch", textWrap: "pretty" };
const refinedNote = { ...noteText, maxWidth: "64ch", textWrap: "pretty" };

export function StoryCard({ title, titleSize, controls, line, note, children, style, ...rest }) {
  const refined = useStoryStyle() === "refined";
  const meta = useStoryMeta();
  return (
    <ScopeCard style={style} {...rest}>
      {(title || controls) && <StoryHead title={title} titleSize={titleSize} controls={controls} refined={refined} kind={meta?.kind} />}
      {line && <p data-part="story-line" style={refined ? leadText : bodyText}>{line}</p>}
      {children}
      {note && <p data-part="story-note" style={refined ? refinedNote : noteText}>{note}</p>}
    </ScopeCard>
  );
}

/* Title and controls. Wide: side by side. Compact: the title, then the controls on their own full-width row. */
function StoryHead({ title, titleSize, controls, refined, kind }) {
  const { compact } = useStoryWidth();
  return (
    <div data-part="story-head" style={{ display: "flex", flexDirection: compact ? "column" : "row", alignItems: compact ? "stretch" : "flex-start", justifyContent: "space-between", gap: compact ? 8 : 12, flexWrap: "wrap" }}>
      <div data-part="story-title" style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        {refined && kind && <span style={{ ...dsText("Text 2xs", 500), color: ds.text.tertiary }}>{kind}</span>}
        {title ? <ScopeCardTitle size={titleSize}>{title}</ScopeCardTitle> : <span />}
      </div>
      {controls && <div data-part="story-controls" style={{ display: "flex", alignItems: "center", justifyContent: compact ? "space-between" : "flex-start", gap: 8, flexWrap: "wrap", paddingTop: refined ? 2 : 0 }}>{controls}</div>}
    </div>
  );
}

/* Placeholder-content marker. Used wherever a Story's copy is draft wording
   written to show the layout, not approved or measured content. */
export function SampleTag({ children = "Sample copy" }) {
  // Refined: a plain square label in sentence case instead of an upper-case pill.
  if (useStoryStyle() === "refined") {
    return (
      <span title="Placeholder wording written to show the Story — not approved guidance" style={{ alignSelf: "flex-start", ...dsText("Text 2xs", 500), color: ds.text.secondary, background: ds.bg.primary, borderRadius: dsRadius.xs, padding: `${dsSpace[2]}px ${dsSpace[8]}px` }}>
        {children}
      </span>
    );
  }
  return (
    <span title="Placeholder wording written to show the Story — not approved guidance" style={{ alignSelf: "flex-start", ...dsText("Text 3xs-Header", 600), textTransform: "uppercase", color: ds.text.tertiary, background: ds.bg.primary, borderRadius: dsRadius.full, padding: `${dsSpace[4]}px ${dsSpace[8]}px` }}>
      {children}
    </span>
  );
}

/* The evidence section: a hairline above and below (border/tertiary) with 16px of space around its content.
   Figma 13622:39516 (Insight Summary), 13622:35958 (Breakdown). */
export function EvidenceSection({ children, pad = dsSpace[16], gap, style, ...rest }) {
  return (
    <div data-part="evidence" style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, padding: `${pad}px 0`, display: "flex", flexDirection: "column", gap, boxSizing: "border-box", ...style }} {...rest}>
      {children}
    </div>
  );
}
