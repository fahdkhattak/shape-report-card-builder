import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Check } from "lucide-react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace, dsBorder, dsShadow, dsVar, tokenForVar, DS_RAW, DS_TYPE } from "../../lib/ds.js";
import { StoryStyleContext, StoryMetaContext } from "../scope/stories/storyStyle.js";

/* ================================================================== */
/* DEVELOPER DOC KIT — the pieces a component page is built from.        */
/*                                                                       */
/* The point of the Developer area is to replace opening Figma for        */
/* handoff, so everything here reads from the REAL running component,      */
/* not from a hand-typed copy of its spec:                                 */
/*   StoryStage   renders a real Story inside the style it was asked for   */
/*   Anatomy      draws numbered markers on the live render and builds a    */
/*                "measured spec" table from the browser's computed styles   */
/*   Inspectable  turns on hover-inspect: outline any element and read its   */
/*                size, type, colour (with token name) and spacing            */
/*   TokenTable   colour tokens with their light and dark values              */
/* What can't be measured (props, copy rules, behaviour) is written next to    */
/* the code that owns it and says where.                                       */
/*                                                                       */
/* Token names come from the design system (docs/shape-design-system-v4.md).  */
/* A colour is named when the element's own inline style uses a DS variable;   */
/* a hex literal in the source is shown as "not a DS token" so a miss is       */
/* visible, not silently rounded to the nearest swatch.                        */
/* ================================================================== */

/* ---- reading the design system back out of a rendered element ------------------- */
const num = (v) => Math.round(parseFloat(v) * 10) / 10;
const SCALE_SPACE = new Set(Object.values(DS_RAW.spacing));
const WEIGHT = { 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold" };
const namesFor = (table, value, prefix) => Object.entries(table).filter(([, v]) => v === value).map(([k]) => k.replace(prefix, ""));

/* The inline style value an element (or, for inherited text colour, its nearest ancestor) was given. */
export const inlineVar = (el, props, inherit) => {
  for (let n = el, hops = 0; n && n !== document.body && hops < 10; n = n.parentElement, hops++) {
    for (const p of props) {
      const v = n.style?.[p];
      if (v) return v;
    }
    if (!inherit) break;
  }
  return "";
};

export function describeColor(css, inline) {
  const m = css && css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (a === 0) return null;
  const hex = "#" + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
  const token = tokenForVar(inline);
  const literal = !!inline && !inline.includes("var(--ds-");
  const text = a < 1 ? `${hex} @ ${Math.round(a * 100)}%` : hex;
  return { hex, a, token, literal, text, full: token ? `${text} · ${token}` : literal ? `${text} · not a DS token` : text };
}

const sides = (t, r, b, l) => {
  const v = [t, r, b, l].map(num);
  if (v.every((x) => x === 0)) return null;
  if (v[0] === v[2] && v[1] === v[3]) return v[0] === v[1] ? `${v[0]}` : `${v[0]} ${v[1]}`;
  return v.join(" ");
};
const offScale = (...vals) => [...new Set(vals.flatMap((s) => String(s || "").split(/\s+/)).map(Number).filter((n) => n > 0 && !SCALE_SPACE.has(n)))];

/* font size + line height → the DS text style it matches (Text sm, Display md …) */
export function typeStyleName(size, lineHeightPx) {
  const exact = DS_TYPE.find((t) => t.size === size && parseInt(t.lineHeight, 10) === lineHeightPx && !/Trim/.test(t.name));
  const trim = DS_TYPE.find((t) => t.size === size && /Trim/.test(t.name));
  return (exact || trim)?.name || null;
}

export function measure(el) {
  const cs = getComputedStyle(el), r = el.getBoundingClientRect();
  const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const fg = describeColor(cs.color, inlineVar(el, ["color"], true));
  const bg = describeColor(cs.backgroundColor, inlineVar(el, ["background", "backgroundColor"]));
  const bInline = inlineVar(el, ["border", "borderTop", "borderLeft", "borderBottom", "borderRight", "borderColor"]);
  const lhPx = cs.lineHeight === "normal" ? null : num(cs.lineHeight);
  const size = num(cs.fontSize), weight = parseInt(cs.fontWeight, 10);
  const styleName = hasText ? typeStyleName(size, lhPx) : null;
  const radiusN = num(cs.borderTopLeftRadius);
  const bw = num(cs.borderTopWidth) || num(cs.borderLeftWidth) || num(cs.borderBottomWidth);
  const padding = sides(cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft);
  const gap = cs.display.includes("flex") || cs.display.includes("grid") ? (num(cs.rowGap) ? `${num(cs.rowGap)}${num(cs.columnGap) && num(cs.columnGap) !== num(cs.rowGap) ? ` / ${num(cs.columnGap)}` : ""}` : null) : null;
  const shadowVar = (el.style?.boxShadow || "").match(/--ds-shadow-([a-z0-9]+)/);
  return {
    tag: el.tagName.toLowerCase(),
    w: Math.round(r.width), h: Math.round(r.height),
    type: hasText ? `${styleName ? `${styleName} / ${WEIGHT[weight] || weight}` : `${size}px / ${weight} · not on the type scale`} · ${size}/${lhPx ?? "auto"}${num(cs.letterSpacing) ? ` · tracking ${num(cs.letterSpacing)}` : ""}` : null,
    fg: hasText ? fg : null, bg,
    padding, gap,
    off: offScale(padding, gap && gap.replace("/", " ")),
    radius: radiusN ? `${radiusN}${radiusN >= 9999 ? "" : ""}` : null,
    radiusName: radiusN ? namesFor(DS_RAW.radius, radiusN > 1000 ? 9999 : radiusN, "radius/").map((n) => `radius/${n}`).join(" · ") || "not on the radius scale" : null,
    border: bw ? `${bw} ${describeColor(cs.borderTopColor || cs.borderLeftColor, bInline)?.full || ""}` : null,
    borderName: bw ? (namesFor(DS_RAW.borderWidth, bw, "border-width/").map((n) => `border-width/${n}`)[0] || "not on the border scale") : null,
    shadow: cs.boxShadow && cs.boxShadow !== "none" ? (shadowVar ? `shadow-${shadowVar[1]}` : "custom (not a DS shadow)") : null,
  };
}

/* ---- hover inspect --------------------------------------------------------- */
const InspectContext = createContext({ on: false, dark: false });
export const InspectProvider = ({ on, dark = false, children }) => <InspectContext.Provider value={{ on, dark }}>{children}</InspectContext.Provider>;

function Row({ k, v, warn }) {
  if (!v) return null;
  return <div style={{ display: "flex", gap: dsSpace[8] }}><span style={{ color: ds.text.quaternary, width: 62, flexShrink: 0 }}>{k}</span><span style={{ color: warn ? ds.status.warning.textIndicator : ds.text.inverse }}>{v}</span></div>;
}

export function Inspectable({ children, style }) {
  const { on, dark } = useContext(InspectContext);
  const [tip, setTip] = useState(null);
  const last = useRef(null);
  const restore = () => { if (last.current) { last.current.style.outline = last.current.__prev ?? ""; last.current.style.outlineOffset = ""; last.current = null; } };
  useEffect(() => { if (!on) { restore(); setTip(null); } return restore; }, [on]);
  const move = (e) => {
    if (!on) return;
    const el = e.target;
    if (el === last.current) { setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t)); return; }
    restore();
    el.__prev = el.style.outline;
    el.style.outline = `1.5px solid ${ds.interactive.primary}`;
    el.style.outlineOffset = "-1px";
    last.current = el;
    setTip({ x: e.clientX, y: e.clientY, m: measure(el) });
  };
  const leave = () => { restore(); setTip(null); };
  return (
    <div onMouseMove={move} onMouseLeave={leave} style={{ cursor: on ? "crosshair" : undefined, ...style }}>
      {children}
      {on && tip && createPortal(
        <div className={dark ? "ds-dark" : undefined} style={{ position: "fixed", left: Math.min(tip.x + 16, window.innerWidth - 340), top: Math.min(tip.y + 16, window.innerHeight - 230), zIndex: 1000, width: 320, background: ds.bg.inverse, color: ds.text.inverse, borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px`, fontFamily: font, ...dsText("Text 2xs"), lineHeight: "17px", boxShadow: dsShadow("lg"), pointerEvents: "none", display: "flex", flexDirection: "column", gap: dsSpace[2] }}>
          <div style={{ fontWeight: 600, marginBottom: dsSpace[4] }}>{`<${tip.m.tag}>`} <span style={{ fontWeight: 400, color: ds.text.quaternary }}>{tip.m.w} × {tip.m.h}</span></div>
          <Row k="Type" v={tip.m.type} warn={tip.m.type?.includes("not on the type scale")} />
          <Row k="Colour" v={tip.m.fg?.full} warn={tip.m.fg?.literal} />
          <Row k="Fill" v={tip.m.bg?.full} warn={tip.m.bg?.literal} />
          <Row k="Padding" v={tip.m.padding && `${tip.m.padding}${tip.m.off.length ? `  ⚠ ${tip.m.off.join(", ")} not on the spacing scale` : ""}`} warn={tip.m.off.length > 0} />
          <Row k="Gap" v={tip.m.gap} />
          <Row k="Radius" v={tip.m.radius && `${tip.m.radius} · ${tip.m.radiusName}`} warn={tip.m.radiusName?.includes("not on")} />
          <Row k="Border" v={tip.m.border && `${tip.m.border} · ${tip.m.borderName}`} warn={tip.m.borderName?.includes("not on")} />
          <Row k="Shadow" v={tip.m.shadow} warn={tip.m.shadow?.includes("custom")} />
        </div>,
        document.body
      )}
    </div>
  );
}

/* ---- the stage a real Story is drawn on -------------------------------------- */
export const StoryStage = ({ style = "classic", kind, width = 808, children, pad = 24, bg = ds.bg.primary }) => (
  <StoryStyleContext.Provider value={style}>
    <StoryMetaContext.Provider value={kind ? { kind } : null}>
      <Inspectable style={{ background: bg, borderRadius: dsRadius.xl, padding: pad, boxSizing: "border-box" }}>
        <div style={{ maxWidth: width, margin: "0 auto" }}>{children}</div>
      </Inspectable>
    </StoryMetaContext.Provider>
  </StoryStyleContext.Provider>
);

/* ---- anatomy: numbered markers on the live render + a measured spec ------------ */
export function Anatomy({ parts, style, kind, width, children }) {
  const wrap = useRef(null), stage = useRef(null);
  const [found, setFound] = useState([]);
  const { dark } = useContext(InspectContext);
  const compute = () => {
    if (!wrap.current || !stage.current) return;
    const box = wrap.current.getBoundingClientRect();
    setFound(parts.map((p, i) => {
      const els = (p.find(stage.current) || []).filter(Boolean);
      if (!els.length) return { ...p, i, missing: true };
      const rs = els.map((e) => e.getBoundingClientRect());
      const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top)), rr = Math.max(...rs.map((r) => r.right)), bb = Math.max(...rs.map((r) => r.bottom));
      return { ...p, i, rect: { x: l - box.left, y: t - box.top, w: rr - l, h: bb - t }, m: measure(els[0]), count: els.length };
    }));
  };
  useLayoutEffect(() => {
    compute();
    const ro = new ResizeObserver(compute);
    if (stage.current) ro.observe(stage.current);
    const t = setTimeout(compute, 250); // after fonts and springs settle
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [style, kind, parts, dark]);

  const cell = { padding: `${dsSpace[8]}px ${dsSpace[12]}px`, verticalAlign: "top" };
  const mono = { fontFamily: "ui-monospace, Menlo, monospace" };
  const flag = (t) => <div style={{ color: ds.status.warning.textIndicator }}>⚠ {t}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[20] }}>
      <div ref={wrap} style={{ position: "relative" }}>
        <div ref={stage}><StoryStage style={style} kind={kind} width={width} pad={44}>{children}</StoryStage></div>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {found.filter((p) => !p.missing).map((p) => (
            <div key={p.id}>
              <div style={{ position: "absolute", left: p.rect.x - 2, top: p.rect.y - 2, width: p.rect.w + 4, height: p.rect.h + 4, border: `${dsBorder.sm}px dashed ${ds.interactive.primary}`, borderRadius: dsRadius.xs }} />
              <div style={{ position: "absolute", left: Math.max(4, p.rect.x - 12), top: Math.max(4, p.rect.y - 12), width: 20, height: 20, borderRadius: "50%", background: ds.interactive.primary, color: ds.interactive.primaryText, ...dsText("Text 3xs", 700), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, boxShadow: `0 0 0 ${dsBorder.md}px ${ds.bg.white}` }}>{p.i + 1}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...dsText("Text xs"), fontFamily: font }}>
          <thead>
            <tr style={{ textAlign: "left", color: ds.text.tertiary, ...dsText("Text 2xs") }}>
              {["", "Part", "Size", "Type", "Colour / fill", "Spacing & shape"].map((h) => <th key={h} style={{ ...cell, fontWeight: 600, borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, whiteSpace: "nowrap" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {found.map((p) => (
              <tr key={p.id} style={{ borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, verticalAlign: "top", opacity: p.missing ? 0.45 : 1 }}>
                <td style={cell}><span style={{ width: 20, height: 20, borderRadius: "50%", background: p.missing ? ds.bg.quaternary : ds.interactive.primary, color: ds.interactive.primaryText, ...dsText("Text 3xs", 700), display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{p.i + 1}</span></td>
                <td style={{ ...cell, minWidth: 190 }}>
                  <div style={{ fontWeight: 600, color: ds.text.primary }}>{p.name}{p.count > 1 ? <span style={{ fontWeight: 400, color: ds.text.tertiary }}> × {p.count}</span> : null}</div>
                  <div style={{ color: ds.text.tertiary, ...dsText("Text 2xs"), maxWidth: 300 }}>{p.missing ? "Not present in this style." : p.note}</div>
                </td>
                {p.missing ? <td colSpan={4} /> : (
                  <>
                    <td style={{ ...cell, whiteSpace: "nowrap", color: ds.text.secondary, fontVariantNumeric: "tabular-nums" }}>{p.m.w} × {p.m.h}</td>
                    <td style={{ ...cell, color: ds.text.secondary, minWidth: 210 }}>{p.m.type ? <>{p.m.type}{p.m.type.includes("not on the type scale") && flag("off the type scale")}</> : "—"}</td>
                    <td style={{ ...cell, color: ds.text.secondary, minWidth: 230 }}>
                      {p.m.fg && <div style={{ display: "flex", alignItems: "center", gap: dsSpace[6] }}><Swatch c={p.m.fg.hex} />{p.m.fg.full}<span style={{ color: ds.text.quaternary }}>text</span></div>}
                      {p.m.bg && <div style={{ display: "flex", alignItems: "center", gap: dsSpace[6] }}><Swatch c={p.m.bg.hex} />{p.m.bg.full}<span style={{ color: ds.text.quaternary }}>fill</span></div>}
                      {!p.m.fg && !p.m.bg && "—"}
                    </td>
                    <td style={{ ...cell, color: ds.text.secondary, minWidth: 210 }}>
                      {p.m.padding && <div>padding {p.m.padding}</div>}
                      {p.m.off.length > 0 && flag(`${p.m.off.join(", ")} not on the spacing scale`)}
                      {p.m.gap && <div>gap {p.m.gap}</div>}
                      {p.m.radius && <div>radius {p.m.radius} <span style={{ color: ds.text.quaternary }}>· {p.m.radiusName}</span></div>}
                      {p.m.border && <div>border {p.m.border} <span style={{ color: ds.text.quaternary }}>· {p.m.borderName}</span></div>}
                      {p.m.shadow && <div>{p.m.shadow}</div>}
                      {!p.m.padding && !p.m.gap && !p.m.radius && !p.m.border && !p.m.shadow && "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Swatch = ({ c, size = 12 }) => <span style={{ width: size, height: size, borderRadius: dsRadius.xs, background: c, boxShadow: `inset 0 0 0 ${dsBorder.sm}px ${ds.border.secondary}`, display: "inline-block", flexShrink: 0 }} />;

/* ---- page furniture --------------------------------------------------------------- */
export function Section({ id, title, lead, children }) {
  return (
    <section id={id} style={{ scrollMarginTop: 24, display: "flex", flexDirection: "column", gap: dsSpace[16], paddingTop: 44 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[6] }}>
        <h2 style={{ margin: 0, ...dsText("Display xs", 600), letterSpacing: "-0.01em", color: ds.text.primary }}>{title}</h2>
        {lead && <p style={{ margin: 0, ...dsText("Text md"), color: ds.text.secondary, maxWidth: "70ch", textWrap: "pretty" }}>{lead}</p>}
      </div>
      {children}
    </section>
  );
}

export const Prose = ({ children }) => <div className="dev-prose" style={{ ...dsText("Text sm"), lineHeight: "22px", color: ds.text.secondary, maxWidth: "74ch", display: "flex", flexDirection: "column", gap: dsSpace[12] }}>{children}</div>;

export function Callout({ tone = "info", title, children }) {
  const c = tone === "warn" ? { bg: ds.status.warning.bg, bar: ds.status.warning.border, fg: ds.status.warning.textStrong } : { bg: ds.surface.general.selected, bar: ds.interactive.primary, fg: ds.text.primary };
  return (
    <div style={{ background: c.bg, borderLeft: `${dsBorder.lg}px solid ${c.bar}`, borderRadius: dsRadius.md, padding: `${dsSpace[12]}px ${dsSpace[16]}px`, ...dsText("Text xs"), lineHeight: "20px", color: ds.text.primary, maxWidth: "80ch" }}>
      {title && <div style={{ fontWeight: 600, color: c.fg, marginBottom: dsSpace[2] }}>{title}</div>}
      {children}
    </div>
  );
}

export const StatusPill = ({ status }) => {
  const k = { Flourishing: "success", Striving: "warning", Struggling: "error" }[status];
  const s = ds.status[k];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6], background: s.bg, color: s.textIndicator, borderRadius: dsRadius.full, padding: `${dsSpace[2]}px ${dsSpace[12]}px ${dsSpace[2]}px ${dsSpace[8]}px`, ...dsText("Text 2xs", 600) }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: s.graph }} />{status}</span>;
};

/* One live variant with its caption. */
export function Variant({ title, status, note, children, wide }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8], gridColumn: wide ? "1 / -1" : undefined, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8], flexWrap: "wrap" }}>
        <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{title}</span>
        {status && <StatusPill status={status} />}
      </div>
      {note && <p style={{ margin: 0, ...dsText("Text 2xs"), lineHeight: "17px", color: ds.text.tertiary }}>{note}</p>}
      {children}
    </div>
  );
}

const tableShell = { overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg };
const mono = { fontFamily: "ui-monospace, Menlo, monospace" };

export function PropsTable({ rows }) {
  const cell = { padding: `${dsSpace[12]}px`, verticalAlign: "top", borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` };
  return (
    <div style={tableShell}>
      <table style={{ width: "100%", borderCollapse: "collapse", ...dsText("Text xs"), fontFamily: font }}>
        <thead><tr style={{ textAlign: "left", background: ds.surface.general.cardWithinCard, color: ds.text.tertiary, ...dsText("Text 2xs") }}>{["Prop", "Type", "Default", "What it does"].map((h) => <th key={h} style={{ ...cell, fontWeight: 600 }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td style={{ ...cell, whiteSpace: "nowrap" }}><code style={{ ...mono, ...dsText("Text xs"), color: ds.text.primary, fontWeight: 600 }}>{r.name}</code>{r.required && <span style={{ color: ds.status.error.text, marginLeft: dsSpace[4] }} title="Required">*</span>}</td>
              <td style={{ ...cell, color: ds.text.secondary }}><code style={{ ...mono, ...dsText("Text 2xs") }}>{r.type}</code></td>
              <td style={{ ...cell, color: ds.text.tertiary, whiteSpace: "nowrap" }}>{r.def ?? "—"}</td>
              <td style={{ ...cell, color: ds.text.secondary, lineHeight: "19px" }}>{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* rows: [{ name: "Flourishing" | …, range, tokens: ["color/status/success/graph", …], use }] — each token
   shown with its Light and Dark value, read from the design system file, so the page cannot drift from it. */
export function TokenTable({ rows }) {
  const cell = { padding: `${dsSpace[12]}px`, verticalAlign: "middle", borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` };
  return (
    <div style={tableShell}>
      <table style={{ width: "100%", borderCollapse: "collapse", ...dsText("Text xs"), fontFamily: font }}>
        <thead><tr style={{ textAlign: "left", background: ds.surface.general.cardWithinCard, color: ds.text.tertiary, ...dsText("Text 2xs") }}>{["Status", "Range", "Tokens (Light · Dark)", "Used for"].map((h) => <th key={h} style={{ ...cell, fontWeight: 600 }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td style={cell}><StatusPill status={r.name} /></td>
              <td style={{ ...cell, color: ds.text.secondary, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{r.range}</td>
              <td style={cell}>
                <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[6] }}>
                  {r.tokens.map((k) => {
                    const v = DS_RAW.semantic[k];
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: dsSpace[8], flexWrap: "wrap" }}>
                        <Swatch c={dsVar(k)} size={14} />
                        <code style={{ ...mono, ...dsText("Text 2xs"), color: ds.text.primary }}>{k}</code>
                        <span style={{ color: ds.text.tertiary, display: "inline-flex", alignItems: "center", gap: dsSpace[6] }}>{v.light}<span style={{ color: ds.text.quaternary }}>·</span>{v.dark}</span>
                      </div>
                    );
                  })}
                </div>
              </td>
              <td style={{ ...cell, color: ds.text.secondary, lineHeight: "19px" }}>{r.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CodeBlock({ code, label }) {
  const [done, setDone] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ } };
  return (
    <div style={{ background: ds.bg.inverse, borderRadius: dsRadius.lg, overflow: "hidden", fontFamily: font }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderBottom: `${dsBorder.sm}px solid ${ds.border.inverse}` }}>
        <span style={{ ...dsText("Text 2xs"), color: ds.text.quaternary }}>{label}</span>
        <button onClick={copy} style={{ border: "none", background: "transparent", color: ds.text.inverse, ...dsText("Text 2xs"), display: "flex", alignItems: "center", gap: dsSpace[6], cursor: "pointer", fontFamily: font }}>{done ? <Check size={14} /> : <Copy size={14} />}{done ? "Copied" : "Copy"}</button>
      </div>
      <pre style={{ margin: 0, padding: `${dsSpace[16]}px`, overflowX: "auto", ...dsText("Text xs"), lineHeight: "19px", color: ds.text.inverse, fontFamily: "ui-monospace, Menlo, monospace" }}>{code}</pre>
    </div>
  );
}

export const FileBadge = ({ children }) => <code style={{ ...mono, ...dsText("Text 2xs"), background: ds.bg.primary, color: ds.text.secondary, borderRadius: dsRadius.sm, padding: `${dsSpace[4]}px ${dsSpace[8]}px` }}>{children}</code>;


/* The Light value of the design-system token an element was styled with (via its inline var()), as lowercase hex.
   "literal" when it was given a hex instead of a token — so a parity check fails loudly on hard-coded colours. */
export function lightHexOf(el, props, inherit) {
  const v = inlineVar(el, props, inherit);
  const path = tokenForVar(v);
  if (path) return DS_RAW.semantic[path].light.toLowerCase();
  return v ? "literal" : "none";
}
export const tokenOfEl = (el, props, inherit) => tokenForVar(inlineVar(el, props, inherit));

/* ---- Figma parity: the live component measured against values read from the Figma node ------------------ */
/* checks: [{ part, node, figma, read(root) }] — `figma` is the value read from Figma (string), `read` returns
   what the running component actually has. Rendered as a table with a pass / fail mark and a total. */
export function FigmaParity({ checks, width = 808, children }) {
  const ref = useRef(null);
  const [rows, setRows] = useState([]);
  useLayoutEffect(() => {
    const run = () => { if (ref.current) setRows(checks.map((c) => { let actual; try { actual = String(c.read(ref.current)); } catch (e) { actual = "error"; } return { ...c, actual, ok: actual === String(c.figma) }; })); };
    run();
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [checks]);
  const pass = rows.filter((r) => r.ok).length;
  const cell = { padding: `${dsSpace[8]}px ${dsSpace[12]}px`, verticalAlign: "top", borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
      <div style={{ overflowX: "auto", background: ds.bg.primary, borderRadius: dsRadius.xl, padding: dsSpace[24] }}>
        <div ref={ref} style={{ width }}>{children}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8], ...dsText("Text sm", 600), color: pass === rows.length && rows.length ? ds.status.success.textIndicator : ds.status.warning.textStrong }}>
        {pass === rows.length && rows.length ? "✓" : "⚠"} {pass} of {rows.length} checks match Figma
      </div>
      <div style={tableShell}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...dsText("Text xs"), fontFamily: font }}>
          <thead><tr style={{ textAlign: "left", background: ds.surface.general.cardWithinCard, color: ds.text.tertiary, ...dsText("Text 2xs") }}>{["", "Part", "Figma node", "Figma says", "Shipped"].map((h) => <th key={h} style={{ ...cell, fontWeight: 600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.part}>
                <td style={{ ...cell, width: 24, color: r.ok ? ds.status.success.textIndicator : ds.status.error.text, fontWeight: 700 }}>{r.ok ? "✓" : "✗"}</td>
                <td style={{ ...cell, color: ds.text.primary, fontWeight: 600 }}>{r.part}</td>
                <td style={{ ...cell, color: ds.text.tertiary }}><code style={{ ...mono, ...dsText("Text 2xs") }}>{r.node}</code></td>
                <td style={{ ...cell, color: ds.text.secondary, fontVariantNumeric: "tabular-nums" }}>{r.figma}{r.mapped && <span style={{ color: ds.text.quaternary }}> (design: {r.mapped})</span>}</td>
                <td style={{ ...cell, color: r.ok ? ds.text.secondary : ds.status.error.text, fontVariantNumeric: "tabular-nums" }}>{r.actual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
