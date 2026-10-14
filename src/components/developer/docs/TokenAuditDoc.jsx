import { T } from "../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder, DS_RAW, dsVar } from "../../../lib/ds.js";
import { AUDIT } from "../../../lib/dsAudit.generated.js";
import { Section, Prose, Callout, Swatch, FileBadge } from "../docKit.jsx";

export const meta = {
  id: "token-audit", name: "Token audit", group: "Foundations", kind: "Design system",
  blurb: "The Stories checked against the SHAPE design system (v4): what was off, what now matches, and what is still open.",
  source: "docs/shape-design-system-v4.md · scripts/audit-ds.mjs · src/lib/ds.js", figma: null,
};
export const toc = [
  { id: "summary", label: "Summary" }, { id: "how", label: "How it works" }, { id: "files", label: "File by file" },
  { id: "legacy", label: "Old tokens → DS" }, { id: "calls", label: "Calls & gaps" },
];

const cell = { padding: `${dsSpace[8]}px ${dsSpace[12]}px`, verticalAlign: "top", borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` };
const head = { ...cell, textAlign: "left", fontWeight: 600, color: ds.text.tertiary, ...dsText("Text 2xs"), background: ds.surface.general.cardWithinCard, whiteSpace: "nowrap" };
const shell = { overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg };
const mono = { fontFamily: "ui-monospace, Menlo, monospace" };

const B = AUDIT.baseline, C = AUDIT.current;
const rows = Object.keys(C.files).map((f) => ({ f, b: B.files[f] || {}, c: C.files[f] }));
const aligned = (r) => r.c.tPrimitives === 0 && r.c.hex === 0;
const delta = (b, c) => (b === c ? <span style={{ color: ds.text.tertiary }}>{c}</span> : <span><span style={{ color: ds.text.quaternary, textDecoration: "line-through" }}>{b}</span> <b style={{ color: c < b ? ds.status.success.textIndicator : ds.status.error.textIndicator }}>{c}</b></span>);
const list = (a) => (a.length ? a.join(", ") : <span style={{ color: ds.text.quaternary }}>—</span>);

function Stat({ label, before, after }) {
  return (
    <div style={{ flex: "1 1 150px", background: ds.surface.general.card, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.card, padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[4] }}>
      <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{label}</span>
      <span style={{ ...dsText("Display xs", 700), color: ds.text.primary }}>{after}</span>
      <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>was {before}</span>
    </div>
  );
}

/* Which DS tokens carry the same Light value as an old T.* colour (the honest "is this the same colour?" test). */
function legacyRows() {
  return Object.entries(T).map(([k, hex]) => {
    const h = String(hex).toLowerCase();
    const sem = Object.entries(DS_RAW.semantic).filter(([, v]) => v.light.toLowerCase() === h).map(([n]) => n.replace(/^color\//, ""));
    const prim = Object.entries(DS_RAW.primitives).filter(([, v]) => v.toLowerCase() === h).map(([n]) => n.replace("Colors/", ""));
    return { k, hex: h, sem, prim };
  });
}

export default function TokenAuditDoc() {
  const done = rows.filter(aligned), open = rows.filter((r) => !aligned(r));
  const t = (key) => `${C.totals[key]}`, b = (key) => `${B.totals[key]}`;
  return (
    <>
      <Section id="summary" title="Summary" lead="A static check of every Story file and every Developer page against docs/shape-design-system-v4.md: colours still written as old T.* primitives or hex, and font sizes, radii and spacing that are not on the design system's scales.">
        <div style={{ display: "flex", gap: dsSpace[12], flexWrap: "wrap" }}>
          <Stat label="Old T.* colour references" before={b("tPrimitives")} after={t("tPrimitives")} />
          <Stat label="Hex literals" before={b("hex")} after={t("hex")} />
          <Stat label="rgba() literals" before={b("rgba")} after={t("rgba")} />
          <Stat label="DS token uses" before={b("dsTokens")} after={t("dsTokens")} />
        </div>
        <Prose>
          <p><b>{done.length} of {rows.length} files</b> are fully on design-system tokens: the Story shell, Insight Summary, Score Meaning and Methodology Stories, the Story controls, and this Developer area. The other {open.length} Story files are not converted yet and are listed below — they are the same job, now mechanical because the shared building blocks they depend on (card, text styles, status colours, controls) already speak the design system.</p>
        </Prose>
      </Section>

      <Section id="how" title="How it works" lead="Colours are CSS variables named after the design system's own tokens, with a Light value on the page and a Dark value inside the Developer area's Dark mode.">
        <Prose>
          <p><b>Source.</b> <FileBadge>docs/shape-design-system-v4.md</FileBadge> is parsed by <FileBadge>scripts/build-ds-tokens.mjs</FileBadge> into <FileBadge>src/lib/dsTokens.generated.js</FileBadge> — {Object.keys(DS_RAW.semantic).length} semantic colours with Light and Dark values, shadows, radius, spacing, border widths and the type scale. Edit the markdown and re-run the script; nothing is typed by hand.</p>
          <p><b>Use.</b> <code>ds.text.primary</code> becomes <code>var(--ds-color-text-primary)</code>; <code>dsText("Text sm", 600)</code> returns the size, line height and tracking of that text style; <code>dsBand(score)</code> returns the Flourishing / Striving / Struggling colours (<code>graph</code> for fills, <code>text-indicator</code> for text, <code>bg</code> for tints). <code>band()</code> in <FileBadge>tokens.js</FileBadge> and the Button component now read the same variables, so they follow the mode too — in Light they resolve to the exact hex they replaced (Button's 48 colours were checked one by one).</p>
          <p><b>Dark.</b> The Mode switch in the header puts the page inside <code>.ds-dark</code>, which redefines every variable to its Dark value. Primitives (Gray/500 …) are never applied directly, as the design system requires.</p>
          <p><b>Measured spec.</b> The Anatomy tables now name the design-system token behind each colour, the text style (<code>Text sm / Semibold</code>), the radius and border-width tokens, and warn when a size, spacing or radius is not on a scale. A colour written as a hex literal shows as <i>not a DS token</i>.</p>
        </Prose>
      </Section>

      <Section id="files" title="File by file" lead="Counts per file, before → after. Off-scale columns list the distinct values that are not on the design system's scales (font sizes, radii, spacing).">
        <div style={shell}>
          <table style={{ width: "100%", borderCollapse: "collapse", ...dsText("Text xs") }}>
            <thead><tr>{["File", "T.*", "hex", "rgba", "Off-scale font", "Off-scale radius", "Off-scale spacing"].map((h) => <th key={h} style={head}>{h}</th>)}</tr></thead>
            <tbody>
              {[...done, ...open].map(({ f, b: bb, c }) => (
                <tr key={f}>
                  <td style={cell}><code style={{ ...mono, ...dsText("Text 2xs"), color: ds.text.primary }}>{f.replace("src/components/", "")}</code>{aligned({ c }) && <span style={{ marginLeft: dsSpace[8], color: ds.status.success.textIndicator, fontWeight: 600 }}>✓ on tokens</span>}</td>
                  <td style={cell}>{delta(bb.tPrimitives ?? 0, c.tPrimitives)}</td>
                  <td style={cell}>{delta(bb.hex ?? 0, c.hex)}</td>
                  <td style={cell}>{delta(bb.rgba ?? 0, c.rgba)}</td>
                  <td style={{ ...cell, color: ds.text.secondary }}>{list(c.offScaleFont)}</td>
                  <td style={{ ...cell, color: ds.text.secondary }}>{list(c.offScaleRadius)}</td>
                  <td style={{ ...cell, color: ds.text.secondary }}>{list(c.offScaleSpace)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout title="What the remaining off-scale numbers are">
          Mostly the <b>Refined</b> style (22 / 26px titles, 28 / 32px padding, an 80px score) — it is an exploration of the Story, not the shipped Current, so it was left as designed — and 10 / 14px gaps and padding in Stories not yet converted (the scale goes 8 → 12 → 16). Fonts of 15px sit between Text sm (14) and Text md (16).
        </Callout>
      </Section>

      <Section id="legacy" title="Old tokens → design system" lead="The app's original colour object (T in tokens.js) was written before this design system file. Each old colour, and the design-system token(s) that hold the same Light value — computed from the file, not typed.">
        <div style={shell}>
          <table style={{ width: "100%", borderCollapse: "collapse", ...dsText("Text xs") }}>
            <thead><tr>{["Old", "Value", "Same value in the design system", "Verdict"].map((h) => <th key={h} style={head}>{h}</th>)}</tr></thead>
            <tbody>
              {legacyRows().map(({ k, hex, sem, prim }) => {
                const none = !sem.length && !prim.length;
                const grayShift = /^gray(900|800)$/.test(k);
                return (
                  <tr key={k}>
                    <td style={cell}><code style={{ ...mono, ...dsText("Text 2xs") }}>T.{k}</code></td>
                    <td style={cell}><span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6] }}><Swatch c={hex} size={14} />{hex}</span></td>
                    <td style={{ ...cell, color: ds.text.secondary, maxWidth: 420 }}>
                      {prim.length > 0 && <div style={{ color: ds.text.tertiary }}>primitive: {prim.join(", ")}</div>}
                      {sem.length > 0 ? <div>{sem.slice(0, 4).join(" · ")}{sem.length > 4 ? ` · +${sem.length - 4} more` : ""}</div> : !prim.length ? "—" : null}
                    </td>
                    <td style={{ ...cell, color: none ? ds.status.error.textIndicator : grayShift ? ds.status.warning.textIndicator : ds.status.success.textIndicator, fontWeight: 600 }}>
                      {none ? "No match — value differs from the DS" : grayShift ? `Same colour, different name (${prim[0]})` : "Matches"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="calls" title="Calls & gaps" lead="Where the design system and the existing Stories disagree, or where it has no answer. Each is stated, not smoothed over.">
        <Prose>
          <p><b>1 · T.gray900 and T.gray800 are one step off.</b> In the design system <code>#1D1A1B</code> is Gray/950 and <code>#231F20</code> is Gray/900; the old object called them gray900 and gray800. Colours now come from semantic tokens, so this no longer matters for Stories, but anything still on <code>T.gray900</code> is really Gray/950.</p>
          <p><b>2 · Graph colours differ.</b> <code>T.teamBlue</code> (#0096ec) and <code>T.hotPink</code> (#ffabcf) are not the design system's Team Blue (#0074BC) or Hot Pink (#FF4081). They are used by the category charts (gender, work model, etc.), which are not converted yet; those should move to <code>ds.graph.*</code> and will change colour when they do.</p>
          <p><b>3 · Ring and bar tracks.</b> The design system has no "track" token for the unfilled part of a ring or bar. The score ring uses <code>color/interactive/ghost-hover</code> (E5E4E3 Light, 3A3737 Dark), the nearest neutral that stays visible in both modes. Worth deciding whether the system should get a real one.</p>
          <p><b>4 · Story card radius.</b> The Story card uses <code>radius/widget</code> (18) to match Figma's Segment frame; the design system's <code>radius/card</code> is 16. Both are valid tokens — the choice is yours.</p>
          <p><b>5 · Score number line height.</b> The 64px score is <code>Display 1.5xl-Trim</code> (line height Auto, −2% tracking). It keeps line-height 1 because the row's height comes from the layout, not the text — as the system describes for Trim styles.</p>
          <p><b>6 · Score status text.</b> Status text uses <code>status/…/text-indicator</code> and fills use <code>…/graph</code>. The design system also has <code>status/…/text</code> and <code>text-strong</code>; the old Strong shade matched text-indicator exactly, so that is what was kept.</p>
          <p><b>7 · Small corrections that change pixels.</b> Compare switch: the off track is now <code>toggle/inactive/primary</code> (E5E4E3, was CECDCC) and the thumb follows the toggle tokens (was always white). Methodology rows: left border 4px (<code>border-width/lg</code>, was 3px). Sample-copy tag: 4px/8px padding and the system's 11px header text. Status Meaning label: <code>Display sm</code> 30px (was 28px, not a scale size). All spacing nudged onto the 4px scale (10→8/12, 14→12, 22→24).</p>
          <p><b>8 · Not mode-aware yet.</b> The navigation rail and anything still on <code>T.*</code> (the {open.length} files above) stay Light inside Dark mode. The Story pages shown here are fully covered.</p>
        </Prose>
      </Section>
    </>
  );
}
