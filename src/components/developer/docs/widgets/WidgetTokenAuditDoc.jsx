import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { font } from "../../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder, dsVar } from "../../../../lib/ds.js";
import { Section, Prose, Callout } from "../../docKit.jsx";
import { SimpleTable, Fact, Limit } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { WIDGET_TOKEN_AUDIT as A } from "../../../../lib/widgetTokenAudit.generated.js";
import { auditTokens } from "../../../../lib/widgetTokenCheck.js";
import { LiveWidget, WidgetStage } from "../widgetDoc.jsx";
import { WIDGET_GROUPS, pageIdOf } from "./widgetPages.js";
import { SHAPE_WIDGETS, SHAPE_REPORT_WIDGETS } from "../../../shape/shapeWidgets.jsx";
import { DEFAULT_PERSON } from "../../../../lib/survey/surveyData.js";

/* ================================================================== */
/* WIDGET TOKEN AUDIT — are the widgets built from design-system tokens? */
/* Two views of the same question: the code (scripts/audit-widgets.mjs:  */
/* every legacy T.* colour, raw hex, off-scale size, with the token each  */
/* should become, by how it's used) and the live cards (lib/            */
/* widgetTokenCheck.js: every colour, size, radius and gap actually      */
/* rendered). Re-run `node scripts/audit-widgets.mjs` after converting.   */
/* ================================================================== */
export const meta = {
  id: "widgets-tokens", name: "Token audit", group: "Widgets", kind: "Token audit",
  blurb: "Is every widget built from design-system tokens? Almost: what was converted, and the few values still waiting on a design call.",
  source: "scripts/audit-widgets.mjs → lib/widgetTokenAudit.generated.js · lib/widgetTokenCheck.js",
};
export const toc = [{ id: "overview", label: "Overview" }, { id: "files", label: "By file" }, { id: "legacy", label: "Legacy colours → tokens" }, { id: "hex", label: "Raw hex" }, { id: "scales", label: "Off the scales" }, { id: "live", label: "Live, widget by widget" }, { id: "plan", label: "Converted and left" }];

const mono = { fontFamily: "ui-monospace, Menlo, monospace", ...dsText("Text 2xs") };
const sw = (hex) => <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: hex, verticalAlign: "middle", marginRight: 6, boxShadow: `inset 0 0 0 1px ${ds.border.secondary}` }} />;
const tokenChip = (path) => <span key={path} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 8 }}>{(() => { try { return sw(dsVar(path)); } catch { return null; } })()}<code style={mono}>{path}</code></span>;
const none = <span style={{ color: ds.status.warning.textStrong }}>No token with this value</span>;
const USE = { text: "text colour", bg: "fill / background", border: "border", graph: "chart, icon or dot", other: "passed on (a prop or a list)" };

/* One live card with its token check. */
function Tile({ k, familyId, formIndex, widget, label, onResult }) {
  const ref = useRef(null);
  const [res, setRes] = useState(null);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => { const t = setTimeout(() => setRes(auditTokens(ref.current)), 450); return () => clearTimeout(t); }, [k]);
  useEffect(() => { if (res) onResult(k, res); }, [res, k, onResult]);
  const colours = res ? res.raw.filter((r) => r.kind === "colour").length : 0, other = res ? res.raw.length - colours : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[6], minWidth: 0, maxWidth: "100%" }}>
      <span style={{ ...dsText("Text 2xs", 600), color: ds.text.secondary, maxWidth: 360 }}>{label}</span>
      <div ref={ref}><WidgetStage pad={16}><LiveWidget familyId={familyId} formIndex={formIndex} widget={widget} fit /></WidgetStage></div>
      {res && (
        <div style={{ display: "flex", gap: dsSpace[8], alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ ...dsText("Text 3xs", 600), borderRadius: dsRadius.full, padding: `2px ${dsSpace[8]}px`, background: res.raw.length ? ds.status.warning.bg : ds.status.success.bg, color: res.raw.length ? ds.status.warning.textStrong : ds.status.success.textIndicator }}>
            {res.raw.length ? `${colours} raw colour${colours === 1 ? "" : "s"} · ${other} off-scale` : "All tokens"}
          </span>
          {res.raw.length > 0 && <button type="button" onClick={() => setOpen((v) => !v)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: font, ...dsText("Text 2xs", 600), color: ds.text.link }}>{open ? "Hide" : "Show"}</button>}
        </div>
      )}
      {open && <SimpleTable head={["Element", "Property", "Value"]} rows={res.raw.map((r) => [r.el, r.prop, <code key="v" style={mono}>{r.value}</code>])} />}
    </div>
  );
}

export default function WidgetTokenAuditDoc() {
  const [live, setLive] = useState({});
  const onResult = useCallback((k, r) => setLive((x) => (x[k] ? x : { ...x, [k]: r })), []);
  const results = Object.values(live);
  const rawColours = results.reduce((a, r) => a + r.raw.filter((x) => x.kind === "colour").length, 0);
  const tokenColours = results.reduce((a, r) => a + r.tokens, 0);
  const offScale = results.reduce((a, r) => a + r.raw.filter((x) => x.kind !== "colour").length, 0);
  const clean = results.filter((r) => !r.raw.length).length;
  const libForms = WIDGET_GROUPS.reduce((a, g) => a + g.families.reduce((b, f) => b + f.forms.length, 0), 0);
  const total = libForms + SHAPE_REPORT_WIDGETS.personal.length + SHAPE_REPORT_WIDGETS.org.length;
  const T = A.totals;
  const files = Object.entries(A.files).sort((a, b) => b[1].tPrimitives + b[1].hex - (a[1].tPrimitives + a[1].hex));
  const share = tokenColours + rawColours ? Math.round((tokenColours / (tokenColours + rawColours)) * 100) : 0;

  return (
    <>
      <Section id="overview" title="Overview" lead="Short answer: almost. The widgets were converted from the legacy T palette to design-system tokens (21 Oct 2026), so they follow Dark mode and any change to the token file. What's left is listed below: two colours that need a design call, the radar orange, and a few hairline and layout offsets that aren't spacing.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="In the code" value={`${T.tPrimitives + T.hex + T.rgba} raw colours`} note={`${T.tPrimitives} legacy T.* uses, ${T.hex} hex, ${T.rgba} rgba, in ${T.files} files; ${T.dsTokens} token uses.`} />
          <Fact label="Off the scales (code)" value={`${T.offScaleFont + T.offScaleRadius + T.offScaleSpace} values`} note={`${T.offScaleFont} font sizes, ${T.offScaleRadius} radii, ${T.offScaleSpace} spacings; ${T.semibold} Semibold weights.`} />
          <Fact label="Rendered colours on tokens" value={results.length ? `${share}%` : "…"} note={results.length ? `${tokenColours} token, ${rawColours} raw, across ${results.length} of ${total} widget forms.` : "Measuring the live cards…"} />
          <Fact label="Widgets fully on tokens" value={results.length ? `${clean} of ${results.length}` : "…"} note={`${offScale} rendered sizes, radii or gaps off the scales.`} />
        </div>
        <Callout title="What “on tokens” means here">A colour is on tokens when it's written as a design-system variable (<code style={mono}>var(--ds-…)</code>, from <code style={mono}>ds.*</code>, <code style={mono}>dsBand()</code> or <code style={mono}>band()</code>), so it follows Light / Dark and any change to the token file. A legacy <code style={mono}>T.*</code> value is a fixed hex: it looks the same in Light today but never changes. Sizes, radii and gaps are on tokens when they're on the design system's scales.</Callout>
        <Prose><p>Code numbers from <code style={mono}>node scripts/audit-widgets.mjs</code> ({A.generatedAt}); live numbers measured now, in this browser. The Stories have their own audit on <DocLink id="token-audit">Foundations › Token audit</DocLink>.</p></Prose>
      </Section>

      <Section id="files" title="By file" lead="The widget code, worst first. Three files hold most of it.">
        <SimpleTable head={["File", "T.*", "Hex", "rgba", "Semibold", "Token uses", "Off-scale font / radius / spacing"]} rows={files.map(([f, r]) => [<code key="f" style={mono}>{f.replace("src/components/", "")}</code>, r.tPrimitives, r.hex, r.rgba, r.semibold, r.dsTokens, <span key="o" style={mono}>{[r.offScaleFont.join(", ") || "–", r.offScaleRadius.join(", ") || "–", r.offScaleSpace.join(", ") || "–"].join("  /  ")}</span>])} />
      </Section>

      <Section id="legacy" title="Legacy colours → tokens" lead="Every T.* colour the widgets use, how often, what it's used for, and the design-system token with the same value for that use. The swap is one-for-one in Light.">
        <SimpleTable head={["Legacy", "Uses", "Used as → token"]} widths={["20%", "8%", "72%"]} rows={A.tMap.map((t) => [
          <span key="k" style={{ whiteSpace: "nowrap" }}>{sw(t.hex)}<code style={mono}>T.{t.key}</code><div style={{ ...mono, color: ds.text.tertiary }}>{t.hex}</div></span>,
          t.count,
          <div key="u" style={{ display: "flex", flexDirection: "column", gap: 4 }}>{t.usage.map((u) => <span key={u.use}><span style={{ color: ds.text.tertiary }}>{USE[u.use]} ×{u.n} → </span>{u.tokens.length ? tokenChip(u.tokens[0]) : none}{u.tokens.length > 1 && <span style={{ color: ds.text.quaternary }}> (or {u.tokens.slice(1).join(", ")})</span>}</span>)}</div>,
        ])} />
        <Prose><p><b>Two legacy colours have no token:</b> <code style={mono}>T.teamBlue</code> (#0096EC; the design system's Team Blue is #0074BC) and <code style={mono}>T.hotPink</code> (#FFABCF; its Hot Pink is #FF4081). Switching them to the graph tokens will change those charts' colours: a design call.</p></Prose>
      </Section>

      <Section id="hex" title="Raw hex" lead="Colours written straight into the widget code.">
        <SimpleTable head={["Colour", "Uses", "Files", "Token with this value"]} rows={A.hexMap.map((h) => [<span key="h" style={{ whiteSpace: "nowrap" }}>{sw(h.hex)}<code style={mono}>{h.hex}</code></span>, h.count, h.files.join(", "), h.tokens.length ? h.tokens.map(tokenChip) : none])} />
      </Section>

      <Section id="scales" title="Off the scales" lead="Numbers the design system has no step for. Type sizes are also covered by the widget Font System; spacing and radii by the spacing and radius scales.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="Font sizes">{[...new Set(Object.values(A.files).flatMap((r) => r.offScaleFont))].sort((a, b) => a - b).join(", ")}px aren't on the type scale. 9, 10.5 and 12.5 are tiny labels; 17, 22, 44, 52 and 56 sit between Font System roles.</Limit>
          <Limit n="2" title="Radii">{[...new Set(Object.values(A.files).flatMap((r) => r.offScaleRadius))].sort((a, b) => a - b).join(", ")}px. 46 is the old pill radius (use radius/full); 1, 3 and 5 are bars and dots.</Limit>
          <Limit n="3" title="Spacing">{[...new Set(Object.values(A.files).flatMap((r) => r.offScaleSpace))].sort((a, b) => a - b).join(", ")}px aren't spacing steps (2, 4, 6, 8, 12, 16, 20, 24…). Most are 1, 3, 5, 10 and 14 nudges.</Limit>
          <Limit n="4" title="Semibold">{T.semibold} uses of 600, which the Font System doesn't allow.</Limit>
        </div>
      </Section>

      <Section id="live" title="Live, widget by widget" lead="Every widget form, measured as it renders. “Show” lists each raw colour and off-scale value with the element it's on.">
        {WIDGET_GROUPS.map((g) => (
          <div key={g.name} style={{ display: "flex", flexDirection: "column", gap: dsSpace[12], paddingBottom: dsSpace[16], borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` }}>
            <span style={{ ...dsText("Text md", 600), color: ds.text.primary }}>{g.name}</span>
            {g.families.map((f) => (
              <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
                <span style={{ ...dsText("Text sm", 600) }}><DocLink id={pageIdOf(f.id)}>{f.name}</DocLink></span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>{f.forms.map((fm, i) => <Tile key={i} k={`${f.id}:${i}`} familyId={f.id} formIndex={i} label={`${fm.name} · ${fm.size}`} onResult={onResult} />)}</div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
          <span style={{ ...dsText("Text md", 600), color: ds.text.primary }}>SHAPE report</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[24], alignItems: "flex-start" }}>{[...SHAPE_REPORT_WIDGETS.personal, ...SHAPE_REPORT_WIDGETS.org].map((id) => <Tile key={id} k={`shape:${id}`} widget={{ id: `doc-${id}`, kind: "shape", widgetId: id, personId: DEFAULT_PERSON }} label={`${SHAPE_WIDGETS[id].name} · ${SHAPE_WIDGETS[id].size}`} onResult={onResult} />)}</div>
        </div>
      </Section>

      <Section id="plan" title="What was converted, and what's left" lead="Done file by file: every T.* colour became the token with the same Light value for the way it's used, so Light looks the same apart from the changes listed here.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="Colours">312 legacy uses in the shared parts (primitives.jsx, widgetParts.jsx), the bodies (WidgetBody, SubjectBody, shapeWidgets, GeneratedBody, ScoreCard) and the shell. Text uses text tokens even where an icon token shares the hex; chart labels text/quaternary; marker outlines, slice dividers and the Index centre the card surface (white in Light, the card colour in Dark).</Limit>
          <Limit n="2" title="Hex with a token">#0074BC → Graph Team Blue; #26A69A → Graph Teal; the Index's second-ring tints and the severity pills' Moderate / Extremely Severe fills → the Likert Subtle colours (#FFEFC4 → #FFF1CF, #F8C8D1 → #FCD7DD); the SHAPE Org well-being bar → the five Likert colours; the locked date → status/warning/text-strong; the Score Comparisons locked card → status/warning/bg (its #FBE7BD edge has no token); Mindfulness → bg/quaternary.</Limit>
          <Limit n="3" title="Type">Semibold (600) is gone: values and status words 700, names and labels 500. Sizes moved to the nearest role: 9 → 10, 10.5 → 11, 12.5 → 12, 17 → 16, 22 → 20, 44 / 52 / 54 / 56 → 48 (Primary Metric Standard), Health Age → 36 (Dense).</Limit>
          <Limit n="4" title="Radii and spacing">Pills (46) → radius/full; 3 and 5 → 4. Gaps and padding down to the nearest step (3, 5 → 4; 9, 10 → 8; 14 → 12; 18 → 16; 28 → 24), so nothing can overflow. Checked: no widget form spills its card.</Limit>
          <Limit n="5" title="Still waiting on a decision">Team Blue (#0096EC) and Hot Pink (#FFABCF) in the category charts: the design system's Team Blue is #0074BC and Hot Pink #FF4081, so switching changes those charts' colours. The radar orange (#EB5421, shared with the Breakdown radar Story). The Mindfulness low-score card (#FDE8EA). Left as they are: 1px hairline gaps between bar segments and label gutters (55, 92, 105px), which are geometry rather than spacing.</Limit>
        </div>
      </Section>
    </>
  );
}
