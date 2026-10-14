import { T, font, radius, band } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsSpace } from "../../../lib/ds.js";
import { StoryCard, EvidenceSection, bodyText } from "./StoryCard.jsx";
import { ActionsCta } from "./ActionStories.jsx";
import { useStoryStyle } from "./storyStyle.js";
import { InnerCard, ScoreNumber, SegmentBar, GroupCard, CardGrid, plural, sentenceText } from "./diagnosticParts.jsx";

/* ================================================================== */
/* DIAGNOSTIC STORY — "What stands out" (Figma 13622:37239). Surfaces    */
/* strengths and pressure points; it must not just repeat the Breakdown. */
/*   StrongestWeakestStory — the best and worst single item              */
/*   AreasToFocusStory     — the lowest-scoring group on each axis        */
/* Both sit in an Evidence Section: cards two to a row, 16px apart, each   */
/* an InnerCard (see diagnosticParts.jsx). Strongest / weakest: a label    */
/* and its score on one line, a ten-segment bar, one sentence. Areas to    */
/* Focus: a group, its change and score, and how many of its people are    */
/* struggling. On a compact card the cards stack in one column.            */
/* ================================================================== */

/* Label and score on one line, a ten-segment bar, then the sentence (Figma 13622:37247). */
function Stat({ eyebrow, value, text, cta }) {
  const b = dsBand(value);
  if (useStoryStyle() === "refined") {
    // Refined: no box. A label, the number at display size, a hairline bar and one sentence.
    return (
      <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <span style={{ ...dsText("Text sm", 500), color: ds.text.secondary }}>{eyebrow}</span>
        <span style={{ fontSize: 48, fontWeight: 600, lineHeight: "48px", letterSpacing: -1.2, color: b.cs, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        <div style={{ height: 4, borderRadius: radius.full, background: ds.bg.secondary, maxWidth: 260 }}>
          <div style={{ width: `${value}%`, height: "100%", borderRadius: radius.full, background: b.c }} />
        </div>
        <span style={{ ...bodyText, fontSize: 15, lineHeight: "22px", maxWidth: "36ch", textWrap: "pretty" }}>{text}</span>
        {cta && <div style={{ marginTop: 4 }}>{cta}</div>}
      </div>
    );
  }
  return (
    <InnerCard data-part="stat-card">
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], whiteSpace: "nowrap" }}>
        <span data-part="stat-label" style={{ ...dsText("Text sm", 700), color: ds.text.secondary }}>{eyebrow}</span>
        <ScoreNumber data-part="stat-value" value={value} />
      </div>
      <SegmentBar value={value} />
      <p data-part="stat-text" style={sentenceText}>{text}</p>
      {cta}
    </InnerCard>
  );
}

/* `actionsCta`: when the Scope has Actions and the items are Drivers, the Biggest Pressure Point carries the dark
   "Actions you can take" button that opens that Driver's actions one layer deeper (Figma 2280:15268).
   One part only: the card says so instead of showing the same part twice. */
export function StrongestWeakestStory({ title = "What Stands Out", noun = "Explorer", strongest, weakest, actionsCta = false }) {
  const refined = useStoryStyle() === "refined";
  const same = strongest.label === weakest.label;
  const cards = same
    ? [<Stat key="only" eyebrow={`Only ${noun}`} value={strongest.value} text={<><b>{strongest.label}</b> is the only {noun} here, so there is nothing to compare it with.</>} />]
    : [
        <Stat key="s" eyebrow={`Strongest ${noun}`} value={strongest.value} text={<><b>{strongest.label}</b> is performing better than the other {plural(noun)}.</>} />,
        <Stat key="w" eyebrow="Biggest Pressure Point" value={weakest.value} text={<><b>{weakest.label}</b> is currently the lowest-scoring {noun}.</>} cta={actionsCta && noun === "Driver" ? <ActionsCta driver={weakest.label} /> : null} />,
      ];
  return (
    <StoryCard title={title} line={`Here are the ${plural(noun)} that stand out most in your results.`} data-story="diagnostic-stand-out">
      {refined
        ? <div style={{ display: "flex", gap: 56, flexWrap: "wrap", fontFamily: font }}>{cards}</div>
        : <EvidenceSection><CardGrid>{cards}</CardGrid></EvidenceSection>}
    </StoryCard>
  );
}

/* The lowest-scoring group on each way of grouping people (Figma 13622:37281). `groups`: focusGroups() rows, worst first.
   The design lists them highest first (33, 32, 27, 25); worst first is what "areas to focus" means, so that is the order here. */
export function AreasToFocusStory({ groups, title = "Areas to Focus On", sort = true }) {
  const line = "The lowest-scoring group on each part of your organisation. Groups with fewer than 5 people are never shown.";
  const rows = sort ? [...groups].sort((a, b) => a.score - b.score) : groups;
  if (useStoryStyle() === "refined") {
    // Refined: a ranked list, lowest first: where, who, how many are struggling, the score.
    return (
      <StoryCard title={title} line={line} data-story="diagnostic-areas">
        <div style={{ display: "flex", flexDirection: "column", fontFamily: font }}>
          {rows.map((g, i) => {
            const b = dsBand(g.score);
            return (
              <div key={`${g.axis}-${g.group}`} style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr) auto", alignItems: "center", gap: 20, padding: "14px 0", borderTop: i ? `1px solid ${ds.border.tertiary}` : "none" }}>
                <span style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>{g.axis}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: ds.text.primary }}>{g.group}</span>
                  <span style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>{g.struggling} of {g.n} employees are struggling</span>
                </span>
                <span style={{ fontSize: 32, fontWeight: 600, lineHeight: "36px", letterSpacing: -0.6, color: b.cs, fontVariantNumeric: "tabular-nums" }}>{g.score}</span>
              </div>
            );
          })}
        </div>
      </StoryCard>
    );
  }
  return (
    <StoryCard title={title} line={line} data-story="diagnostic-areas">
      {rows.length === 0
        ? <p style={{ ...bodyText, fontFamily: font }}>No group has 5 or more people yet, so none can be shown.</p>
        : <EvidenceSection><CardGrid>{rows.map((g) => <GroupCard key={`${g.axis}-${g.group}`} g={g} count={g.struggling} word="struggling" />)}</CardGrid></EvidenceSection>}
    </StoryCard>
  );
}
