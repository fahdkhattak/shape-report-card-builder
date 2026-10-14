import { Briefcase, Laptop, MapPin, Users, ChevronRight } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsBand, dsText, dsRadius, dsSpace, dsBorder } from "../../../lib/ds.js";
import { TrendPill } from "../../widgets/primitives.jsx";
import genderIcon from "../../../assets/axis-icons/gender.svg";
import ageIcon from "../../../assets/axis-icons/age.svg";
import ethnicityIcon from "../../../assets/axis-icons/ethnicity.svg";
import departmentIcon from "../../../assets/axis-icons/department.svg";
import jobLevelIcon from "../../../assets/axis-icons/job-level.svg";
import { useStoryWidth } from "./storyWidth.js";

/* ================================================================== */
/* DIAGNOSTIC PARTS: the pieces the Diagnostic Stories share, taken from */
/* the Figma frames (13622:37240 "What Stands Out", 13622:37281 "Areas    */
/* to Focus On") and used by every Story in the family:                   */
/*   InnerCard    a card inside the Evidence Section: surface/card, 1px     */
/*                border/secondary, radius/lg (12), 16 padding, 16 gap      */
/*   SegmentBar   ten equal segments, filled to the score (8px, rounded)    */
/*   GroupCard    icon + group + System Tag, change + score + chevron, then  */
/*                "18 out of 20 employees are struggling"                   */
/*   RailRow      a label, an 8px track and a value, the way Breakdown bars  */
/*                are drawn, so a row means the same thing in both families  */
/* Numbers are Text md-Trim / Bold in the status text colour; sentences are   */
/* Text xs (13/18) with the name or counts in bold.                          */
/* ================================================================== */

/* Plural of a part's name in running text: Explorers keep their capital, the rest are lower case (as in the design). */
export const plural = (noun) => (noun === "Explorer" ? "Explorers" : `${noun.toLowerCase()}s`);

export function InnerCard({ as: Tag = "div", children, style, ...rest }) {
  return (
    <Tag style={{ background: ds.surface.general.card, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.lg, padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[16], boxSizing: "border-box", minWidth: 0, fontFamily: font, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

/* The score in a card header or row: 16/24 Bold, trimmed to its cap height so it lines up with the label. */
export function ScoreNumber({ value, style, ...rest }) {
  return <span style={{ ...dsText("Text md-Trim", 700), textBox: "trim-both cap alphabetic", color: dsBand(value).cs, fontVariantNumeric: "tabular-nums", textAlign: "right", whiteSpace: "nowrap", ...style }} {...rest}>{value}</span>;
}

/* "Age", "Gender": the System Tag beside a group's name. */
export function SystemTag({ children }) {
  return <span data-part="system-tag" style={{ flexShrink: 0, background: ds.bg.primary, border: `${dsBorder.sm}px solid ${ds.border.primary}`, borderRadius: dsRadius.full, boxSizing: "border-box", height: 20, display: "inline-flex", alignItems: "center", padding: `0 ${dsSpace[6]}px`, ...dsText("Text 2xs"), color: ds.text.secondary, whiteSpace: "nowrap" }}>{children}</span>;
}

/* An icon for each way of grouping people. Gender and Tenure use the design's own icons (tenure takes the "Age" one, a
   person with a clock); the rest are the closest line icons at the same 20px and 1.667 stroke. Ethnicity has an icon in the
   design (assets/axis-icons/ethnicity.svg) but no such field exists in the data. */
const FILES = { gender: genderIcon, tenure: ageIcon, ethnicity: ethnicityIcon, department: departmentIcon, jobLevel: jobLevelIcon };
const LINE = { employmentStatus: Briefcase, workModel: Laptop, location: MapPin };
export function AxisIcon({ axis, size = 20 }) {
  const file = FILES[axis];
  if (file) return <span aria-hidden="true" style={{ width: size, height: size, flexShrink: 0, display: "inline-block", background: ds.icon.primary, WebkitMask: `url(${file}) center / contain no-repeat`, mask: `url(${file}) center / contain no-repeat` }} />;
  const Icon = LINE[axis] || Users;
  return <Icon size={size} strokeWidth={1.667} color={ds.icon.primary} aria-hidden="true" style={{ flexShrink: 0 }} />;
}

/* Ten equal segments, filled to the score and coloured by its status (Figma 13622:37252). */
export function SegmentBar({ value, label }) {
  const filled = Math.max(0, Math.min(10, Math.round(value / 10)));
  const c = dsBand(value).c;
  return (
    <div data-part="segment-bar" role="img" aria-label={label || `${value} out of 100`} style={{ display: "flex", height: dsSpace[8], borderRadius: dsRadius.full, overflow: "hidden" }}>
      {Array.from({ length: 10 }, (_, i) => <div key={i} style={{ flex: "1 1 0", minWidth: 0, background: i < filled ? c : ds.bg.secondary }} />)}
    </div>
  );
}

/* "18 out of 20 employees are struggling", with the counts in bold. Handles none and all. */
export function CountSentence({ n, k, word, who = "employees" }) {
  const b = (v) => <b style={{ fontWeight: 700 }}>{v}</b>;
  if (k === 0) return <>None of the {b(n)} {who} are {word}</>;
  if (k === n) return <>All {b(n)} {who} are {word}</>;
  return <>{b(k)} out of {b(n)} {who} are {word}</>;
}

export const sentenceText = { margin: 0, ...dsText("Text xs"), color: ds.text.primary };

/* One group on one way of grouping (Figma 13622:37288). `g`: { axisKey, axis, group, score, change, n }.
   `count` is how many of its n people are in the status named by `word`. The chevron is in the design and implies a
   drill-in the product does not have yet, so the card is inert unless `onOpen` is passed. */
export function GroupCard({ g, count, word, onOpen }) {
  const Tag = onOpen ? "button" : "div";
  return (
    <InnerCard as={Tag} data-part="group-card" style={onOpen ? { textAlign: "left", cursor: "pointer", width: "100%" } : undefined} onClick={onOpen}>
      {/* The change, score and chevron always hold the right of the first line, as in the design. When the group's name and
          tag don't fit beside them, the tag drops under the name rather than pushing the score onto its own row, so every
          card in the grid keeps the same shape. */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: dsSpace[12] }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: dsSpace[12], minWidth: 0, flex: "1 1 auto" }}>
          <AxisIcon axis={g.axisKey} />
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: dsSpace[12], rowGap: dsSpace[4], minWidth: 0 }}>
            <span data-part="group-name" title={g.group} style={{ ...dsText("Text sm", 700), color: ds.text.secondary, minWidth: 0, overflowWrap: "anywhere" }}>{g.group}</span>
            <SystemTag>{g.axis}</SystemTag>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, minHeight: 20 }}>
          {g.change != null && <TrendPill delta={g.change} numberOnly />}
          <ScoreNumber data-part="group-score" value={g.score} />
          <ChevronRight data-part="chevron" size={20} strokeWidth={2} style={{ color: ds.icon.tertiary, flexShrink: 0 }} aria-hidden="true" />
        </div>
      </div>
      <p data-part="group-sentence" style={sentenceText}><CountSentence n={g.n} k={count} word={word} /></p>
    </InnerCard>
  );
}

/* A label, an 8px track filled to a value, and a value on the right (the Bars row of the Breakdown Story).
   `marker` draws a tick at a position on the track; `lead` is a small leading node (a rank). On a compact card the label
   and the value share a line and the track runs full width below. */
export function RailRow({ label, labelNode, fill, color, marker, right, lead, highlight, title }) {
  const { compact } = useStoryWidth();
  const track = (
    <div data-part="rail-track" style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
      <div role="img" aria-label={title} style={{ flex: 1, height: dsSpace[8], borderRadius: dsRadius.full, overflow: "hidden", background: ds.bg.secondary }}>
        <div data-part="rail-fill" style={{ width: `${Math.max(0, Math.min(100, fill))}%`, height: "100%", background: color }} />
      </div>
      {marker != null && <span data-part="rail-marker" aria-hidden="true" style={{ position: "absolute", left: `${marker}%`, top: -3, width: 2, height: 14, marginLeft: -1, borderRadius: 1, background: ds.text.primary }} />}
    </div>
  );
  const wrap = { fontFamily: font, ...(highlight ? { background: ds.bg.primary, borderRadius: dsRadius.md, padding: `${dsSpace[6]}px ${dsSpace[8]}px`, margin: `0 -${dsSpace[8]}px` } : null) };
  if (compact) {
    return (
      <div data-part="rail-row" style={{ ...wrap, display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
        <div style={{ display: "flex", alignItems: "center", gap: dsSpace[12], justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: dsSpace[8], minWidth: 0, flex: 1 }}>{lead}<span data-part="rail-label" style={{ minWidth: 0, ...dsText("Text sm", highlight ? 700 : 400), color: ds.text.secondary }}>{labelNode ?? label}</span></span>
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: dsSpace[8] }}>{right}</span>
        </div>
        {track}
      </div>
    );
  }
  return (
    <div data-part="rail-row" style={{ ...wrap, display: "flex", alignItems: "center", gap: dsSpace[16] }}>
      {lead}
      <span data-part="rail-label" title={label} style={{ flex: "0 1 247px", minWidth: 96, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...dsText("Text sm", highlight ? 700 : 400), color: ds.text.secondary }}>{labelNode ?? label}</span>
      {track}
      <span style={{ flexShrink: 0, minWidth: 84, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: dsSpace[12] }}>{right}</span>
    </div>
  );
}

/* Two columns on a wide card and one on a compact card, 16px apart: the grid the Diagnostic cards sit in. */
export function CardGrid({ children, cols = 2 }) {
  const { compact } = useStoryWidth();
  return <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : `repeat(${cols}, minmax(0, 1fr))`, gap: dsSpace[16], alignItems: "stretch" }}>{children}</div>;
}
