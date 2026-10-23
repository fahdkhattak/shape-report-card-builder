import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../lib/ds.js";
import { Section, Prose, Callout } from "../docKit.jsx";
import { SimpleTable, Limit } from "../docParts.jsx";
import { DocLink } from "../DataNeeds.jsx";
import { TYPE_ROLES, SECTIONS, FONT_RULES } from "../../../lib/widgetTypeSystem.js";

/* ================================================================== */
/* WIDGET TYPE SYSTEM — Figma's Font System board (984qJvMt7fCHASYHRwgrab, */
/* node 9158:33686) as a Developer page: the font rules, the 13 text roles */
/* every widget text must use, the section-based colour mapping, and where */
/* the board and the design-system file disagree. The rules live in        */
/* lib/widgetTypeSystem.js, which also audits live widgets against them.   */
/* ================================================================== */
export const meta = {
  id: "widget-type-system", name: "Widget type system", group: "Foundations", kind: "Widget type system",
  blurb: "The text roles and colours every widget is built from: Figma's Font System board, written down and checked against the live widgets.",
  source: "lib/widgetTypeSystem.js (Figma 9158:33686)",
};
export const toc = [{ id: "overview", label: "Overview" }, { id: "font", label: "Font" }, { id: "roles", label: "The 13 roles" }, { id: "sections", label: "Colour by section" }, { id: "structure", label: "Widget structure" }, { id: "differences", label: "Where it disagrees" }];

const SAMPLE = { eyebrow: "Org score", display: "83", standard: "60", dense: "26", compact: "87", unit: "hrs", status: "Flourishing", status2: "Severe", supporting: "per annum", catLarge: "Great", catSmall: "Female", valueLarge: "88", valueSmall: "44" };
const sample = (r) => ({ fontFamily: font, fontSize: r.size, fontWeight: r.weight, letterSpacing: r.tracking ? "0.11px" : 0, textTransform: r.transform || "none", lineHeight: 1, color: r.section === "header" || r.section === "evidence" ? ds.text.tertiary : ds.text.primary, whiteSpace: "nowrap" });

export default function WidgetTypeSystemDoc() {
  const groups = [...new Set(TYPE_ROLES.map((r) => r.group))];
  return (
    <>
      <Section id="overview" title="Overview" lead="Every text element in a widget is exactly one of these roles. No new roles. Its colour comes from the section it sits in.">
        <Prose>
          <p>This is the design's Font System board for widgets. The board's own example widgets are marked “not a source of truth”; the role specifications are. Use it two ways: build a widget only from these roles, and read each widget's <b>type audit</b> (on its page and on <DocLink id="widgets-all">All widgets</DocLink>), which measures every text in the running card and names its role or says why it has none.</p>
        </Prose>
      </Section>

      <Section id="font" title="Font">
        <SimpleTable head={["Rule", "Value"]} widths={["28%", "72%"]} rows={[
          ["Family", FONT_RULES.family], ["Weights", "Regular (400), Medium (500), Bold (700). Nothing else, including Semibold (600)."],
          ["Not allowed", FONT_RULES.notAllowed.join(", ")], ["Line height", "Auto: cap height to baseline, on every role."], ["Hierarchy", FONT_RULES.note],
        ]} />
      </Section>

      <Section id="roles" title="The 13 roles" lead="Size and weight are what the audit checks. Several roles share 11 / Regular; they differ by what the text is.">
        {groups.map((g) => (
          <div key={g} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
            <span style={{ ...dsText("Text md", 600), color: ds.text.primary }}>{g}</span>
            <div style={{ overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font, tableLayout: "fixed" }}>
                <colgroup><col style={{ width: "18%" }} /><col style={{ width: "18%" }} /><col style={{ width: "17%" }} /><col style={{ width: "27%" }} /><col style={{ width: "20%" }} /></colgroup>
                <thead><tr>{["Role", "Looks like", "Size / weight", "Use", "Rules"].map((h) => <th key={h} style={{ padding: `${dsSpace[8]}px ${dsSpace[12]}px`, textAlign: "left", background: ds.surface.general.cardWithinCard, ...dsText("Text 2xs", 600), color: ds.text.tertiary }}>{h}</th>)}</tr></thead>
                <tbody>
                  {TYPE_ROLES.filter((r) => r.group === g).map((r) => (
                    <tr key={r.id} style={{ borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, verticalAlign: "middle" }}>
                      <td style={{ padding: `${dsSpace[12]}px`, ...dsText("Text xs", 600), color: ds.text.primary }}>{r.name}</td>
                      <td style={{ padding: `${dsSpace[12]}px`, overflow: "hidden" }}><span style={sample(r)}>{SAMPLE[r.id]}</span></td>
                      <td style={{ padding: `${dsSpace[12]}px`, ...dsText("Text xs"), color: ds.text.secondary }}>{r.size}px / {r.weight === 700 ? "Bold" : r.weight === 500 ? "Medium" : "Regular"}{r.tracking ? `, ${r.tracking} tracking` : ""}{r.transform ? ", uppercase" : ""}</td>
                      <td style={{ padding: `${dsSpace[12]}px`, ...dsText("Text xs"), color: ds.text.secondary }}>{r.use}<div style={{ color: ds.text.tertiary }}>e.g. {r.examples.join(", ")}</div></td>
                      <td style={{ padding: `${dsSpace[12]}px`, ...dsText("Text xs"), color: ds.text.secondary }}>{(r.rules || []).join(" ") || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>

      <Section id="sections" title="Colour by section" lead="A widget has up to four sections. Text takes its section's colour unless a semantic (status) colour applies, except in the header, which never takes one.">
        <SimpleTable head={["Section", "Applies to", "Colour", "Rules"]} widths={["16%", "30%", "26%", "28%"]} rows={SECTIONS.map((s) => [s.name, s.appliesTo, <span key="c" style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6] }}><span style={{ width: 14, height: 14, borderRadius: 3, background: s.hex, boxShadow: `inset 0 0 0 1px ${ds.border.secondary}` }} />{s.colour} · {s.hex}<span style={{ color: ds.text.tertiary }}> ({s.dsToken})</span></span>, s.rules.join(" ")])} />
      </Section>

      <Section id="structure" title="Widget structure" lead="Read from the board's examples and the widget anatomy: every widget is built from the same four sections, top to bottom.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[["Header", "The Eyebrow: what this is (ORG SCORE). One role, text-tertiary (text-secondary while the widget is active), two lines at most."], ["Insight", "The answer: a Primary Metric in one of four sizes (Display 64 for the headline score, Standard 48 for a single insight, Dense 36 for composite values, Compact 32 inside a ring), its Metric Unit, or a Status Metric. Coloured by status when the value has one."], ["Evidence", "What backs the answer up: dates, captions, category labels (Great / Average / Poor at 13 Bold, list and chart labels at 11 Regular) and their values (16 Bold, or 11 Bold in charts). Text-tertiary unless a status colours it."], ["Action Bar", "Optional: a button or link at the foot, in text-primary or its button style."]].map(([t, b], i) => <Limit key={t} n={String(i + 1)} title={t}>{b}</Limit>)}
        </div>
        <Callout title="Choosing the metric size">One dominant number for an index or organisation: Display (64). A single insight such as eNPS or an Area to Focus: Standard (48). Several parts in one value (26 yrs 3 mo, US$60K): Dense (36). A number inside a ring or a tight module: Compact (32).</Callout>
      </Section>

      <Section id="differences" title="Where it disagrees" lead="Recorded, not resolved: for the design owner.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="Grey numbers are one step apart">The board says text-tertiary (600) and text-quaternary (500); the design-system file maps text/tertiary to Gray/500 (#7C7879) and text/quaternary to Gray/300 (#A5A2A2). The audit checks the hexes the token names give.</Limit>
          <Limit n="2" title="The header colour (decided)">The board says utility-gray-300 (#A5A2A2). Product direction replaces it: text/tertiary (#7C7879), and text/secondary (#504C4D) while the widget is active (its Scope open), Text 3xs-Header / Medium, line height normal trimmed to the cap height. Applied to every widget's header.</Limit>
          <Limit n="3" title="Semibold is in use">Several widgets use 600 for names in lists and for trend numbers; the board allows 400, 500 and 700 only.</Limit>
          <Limit n="4" title="Sizes off the roles">Widgets use 12, 14, 18, 26 and 56px in places, which aren't roles. The audit lists each one.</Limit>
          <Limit n="5" title="The Header Label is 11pt">The board writes points; the product uses px. Read as 11px.</Limit>
        </div>
      </Section>
    </>
  );
}
