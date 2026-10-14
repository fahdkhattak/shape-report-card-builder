import { ExternalLink } from "lucide-react";
import { T, font, radius } from "../../../lib/tokens.js";
import Button from "../../ui/Button.jsx";
import { StoryCard, SampleTag, bodyText } from "./StoryCard.jsx";
import { useStoryStyle } from "./storyStyle.js";

/* ================================================================== */
/* RESOURCE + UPGRADE PATH STORIES (Figma 13622:37386, 13622:37468).     */
/* Both point somewhere beyond the widget's own data, and both are        */
/* placeholders here: there is no resource library, product catalogue or   */
/* purchasing model in this prototype, so the copy is illustrative and     */
/* the buttons are inert.                                                  */
/* ================================================================== */
export function ResourceStory({ title, description, linkLabel = "Read the guide" }) {
  if (useStoryStyle() === "refined") {
    // The link is a link: text with an arrow, not a bordered button.
    return (
      <StoryCard title={title}>
        <SampleTag>Sample resource</SampleTag>
        <p style={{ ...bodyText, fontSize: 16, lineHeight: "24px", maxWidth: "62ch", textWrap: "pretty" }}>{description}</p>
        <span title="No resource library exists in this prototype" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, color: T.gray900, textDecoration: "underline", textUnderlineOffset: 4, textDecorationColor: T.gray300, cursor: "default" }}>
          {linkLabel}<ExternalLink size={15} />
        </span>
      </StoryCard>
    );
  }
  return (
    <StoryCard title={title}>
      <SampleTag>Sample resource</SampleTag>
      <p style={bodyText}>{description}</p>
      <div>
        <Button theme="brand" variation="secondary" size="xs" iconRight={<ExternalLink size={16} />} style={{ border: `1px solid ${T.gray100}` }} title="No resource library exists in this prototype">{linkLabel}</Button>
      </div>
    </StoryCard>
  );
}

/* Upgrade Path rules (from the board): visually separate from the result and
   guidance; sits after the result/explanation/diagnostics; explains how it
   connects to the current insight; one CTA; only for products not yet owned. */
export function UpgradePathStory({ eyebrow = "Available to Add", title = "See the Wider Team Picture", description = "Add Team Analytics to compare results across your team, identify shared patterns, and see where support may be needed.", cta = "Add Team Analytics" }) {
  if (useStoryStyle() === "refined") {
    // Still visibly apart from the result (the board's rule) — a tinted panel, no dashed border or caps.
    return (
      <div style={{ background: T.gray25, borderRadius: radius.xl, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", fontFamily: font }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.gray500 }}>{eyebrow}</span>
        <p style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: "30px", letterSpacing: "-0.4px", color: T.gray900, textWrap: "balance" }}>{title}</p>
        <p style={{ ...bodyText, fontSize: 16, lineHeight: "24px", maxWidth: "58ch", textWrap: "pretty" }}>{description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
          <Button theme="brand" variation="primary" size="sm" title="No purchasing flow exists in this prototype">{cta}</Button>
          <SampleTag>Sample offer</SampleTag>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: T.gray25, border: `1px dashed ${T.gray100}`, borderRadius: radius.widget, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", fontFamily: font }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: T.gray500 }}>{eyebrow}</span>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: "28px", color: T.gray900 }}>{title}</p>
      <p style={bodyText}>{description}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Button theme="brand" variation="primary" size="xs" title="No purchasing flow exists in this prototype">{cta}</Button>
        <SampleTag>Sample offer</SampleTag>
      </div>
    </div>
  );
}
