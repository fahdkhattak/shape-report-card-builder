import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../lib/ds.js";
import { STORIES } from "../../widgetbuilder/storyCatalog.jsx";
import { Section, Prose } from "../docKit.jsx";
import { FAMILY_INFO, DOCS_BY_STORY } from "../storyFamilies.js";

export const meta = {
  id: "story-families", name: "Story families", group: "Foundations", kind: "Story families",
  blurb: "Every Story, grouped by the kind of question it answers.",
  source: "components/widgetbuilder/storyCatalog.jsx · STORIES",
};
export const toc = [{ id: "overview", label: "Overview" }, { id: "families", label: "The families" }];

/* Stories the product can't build yet. Their reason is a fixed string in the catalogue. */
const UNBUILT = new Set(["citation", "questionnaire", "video", "comparison", "healthage"]);
const unbuiltReason = (s) => { if (!UNBUILT.has(s.id)) return null; try { return s.blocked({ children: [], series: [] }); } catch { return null; } };

const chip = (bg, fg) => ({ ...dsText("Text 3xs", 600), background: bg, color: fg, borderRadius: dsRadius.full, padding: `${dsSpace[2]}px ${dsSpace[8]}px`, whiteSpace: "nowrap" });

export default function StoryFamiliesDoc({ onOpenDoc }) {
  const families = [...new Set(STORIES.map((s) => s.family))].map((f) => ({ name: f, stories: STORIES.filter((s) => s.family === f) }));
  const documented = STORIES.filter((s) => DOCS_BY_STORY[s.name]).length;
  return (
    <>
      <Section id="overview" title="Overview" lead="A Story is one block in a Scope. Stories are grouped into families by the question they answer, so you can see at a glance what kinds exist and which ones a family holds.">
        <Prose>
          <p>There are <b>{STORIES.length} Stories</b> in <b>{families.length} families</b>. {documented} {documented === 1 ? "has" : "have"} a Developer page so far. The rest are listed here so the remaining work is always the real remainder.</p>
          <p>Families are the same ones the Widget Builder's "Add Story" menu shows, so a developer and a designer use the same names.</p>
        </Prose>
      </Section>
      <Section id="families" title="The families">
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
          {families.map((f) => {
            const info = FAMILY_INFO[f.name] || {};
            return (
              <div key={f.name} style={{ background: ds.surface.general.card, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.card, padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: dsSpace[12], flexWrap: "wrap" }}>
                  <span style={{ ...dsText("Text md", 700), color: ds.text.primary }}>{f.name}</span>
                  {info.question && <span style={{ ...dsText("Text sm"), color: ds.text.secondary }}>{info.question}</span>}
                  <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, marginLeft: "auto" }}>{f.stories.length} {f.stories.length === 1 ? "Story" : "Stories"}</span>
                </div>
                {info.about && <p style={{ margin: 0, ...dsText("Text sm"), color: ds.text.secondary, maxWidth: "80ch" }}>{info.about}</p>}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {f.stories.map((s) => {
                    const doc = DOCS_BY_STORY[s.name];
                    const reason = unbuiltReason(s);
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: dsSpace[12], padding: `${dsSpace[8]}px 0`, borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, flexWrap: "wrap" }}>
                        {doc ? <button onClick={() => onOpenDoc?.(doc)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", ...dsText("Text sm", 600), color: ds.interactive.secondaryText, textAlign: "left", textDecoration: "underline", fontFamily: "inherit" }}>{s.name}</button> : <span style={{ ...dsText("Text sm", 600), color: ds.text.primary, minWidth: 180 }}>{s.name}</span>}
                        <span style={{ ...dsText("Text xs"), color: ds.text.secondary, flex: "1 1 260px" }}>{s.purpose}</span>
                        {s.suggest && <span style={chip(ds.surface.general.selected, ds.interactive.secondaryText)}>Suggested by default</span>}
                        {doc ? <span style={chip(ds.status.success.bg, ds.status.success.textIndicator)}>Documented</span> : <span style={chip(ds.bg.primary, ds.text.tertiary)}>Not documented yet</span>}
                        {reason && <span style={chip(ds.status.warning.bg, ds.status.warning.textStrong)}>Not built: {reason}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
