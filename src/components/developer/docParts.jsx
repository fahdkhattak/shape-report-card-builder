import { ds, dsText, dsSpace, dsRadius, dsBorder, dsVar, DS_RAW } from "../../lib/ds.js";
import { Swatch } from "./docKit.jsx";

/* Small building blocks shared by the Developer / Researcher pages (tables, fact cards, constraints). */
/* ---- contrast, computed from the design-system file ---- */
const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q2) => q2 - p); return (x + 0.05) / (y + 0.05); };
const CARD = DS_RAW.semantic["color/surface/General/card"];
export function ContrastTable({ rows: rowsIn }) {
  const rows = rowsIn || [
    ["color/status/success/text-indicator", "Used", "Flourishing number"],
    ["color/status/warning/text", "Used", "Striving number"],
    ["color/status/error/text", "Used", "Struggling number"],
    ["color/status/warning/text-indicator", "Alternative", "Darker amber"],
    ["color/status/warning/text-strong", "Alternative", "Strong amber"],
    ["color/status/error/text-indicator", "Alternative", "Darker red"],
  ];
  const cell = { padding: `${dsSpace[8]}px ${dsSpace[12]}px`, borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, ...dsText("Text xs"), verticalAlign: "middle" };
  const verdict = (n) => <span style={{ color: n >= 4.5 ? ds.status.success.textIndicator : ds.status.error.text, fontWeight: 600 }}>{n.toFixed(1)}:1 {n >= 4.5 ? "AA" : "fails AA"}</span>;
  return (
    <div style={{ overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", background: ds.surface.general.cardWithinCard, color: ds.text.tertiary }}>{["Token", "Role", "Light on card", "Dark on card"].map((h) => <th key={h} style={{ ...cell, fontWeight: 600 }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map(([path, role, note]) => {
            const v = DS_RAW.semantic[path];
            return (
              <tr key={path}>
                <td style={cell}><span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8] }}><Swatch c={dsVar(path)} size={14} /><code style={{ fontFamily: "ui-monospace, Menlo, monospace", ...dsText("Text 2xs") }}>{path}</code></span><div style={{ color: ds.text.tertiary }}>{note}</div></td>
                <td style={{ ...cell, color: ds.text.secondary }}>{role}</td>
                <td style={cell}>{v.light} · {verdict(ratio(v.light, CARD.light))}</td>
                <td style={cell}>{v.dark} · {verdict(ratio(v.dark, CARD.dark))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


export function SpecTable({ head, rows, widths }) {
  const cell = { padding: `${dsSpace[8]}px ${dsSpace[12]}px`, verticalAlign: "top", borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, ...dsText("Text xs"), color: ds.text.secondary, lineHeight: "19px" };
  return (
    <div style={{ overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", background: ds.surface.general.cardWithinCard }}>{head.map((h, i) => <th key={h} style={{ ...cell, fontWeight: 600, color: ds.text.tertiary, width: widths?.[i] }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ ...cell, ...(j === 0 ? { color: ds.text.primary, fontWeight: 600 } : null) }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
export const tok = (path) => {
  const v = DS_RAW.semantic[path];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], flexWrap: "wrap" }}><Swatch c={dsVar(path)} size={14} /><code style={{ fontFamily: "ui-monospace, Menlo, monospace", ...dsText("Text 2xs"), color: ds.text.primary }}>{path}</code><span style={{ color: ds.text.tertiary }}>{v.light} · {v.dark}</span></span>;
};
export const T = (path) => tok(`color/${path}`);


export const card_ = { background: ds.surface.general.card, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.card, padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[4], minWidth: 0 };
export function Fact({ label, value, note }) {
  return (
    <div style={card_}>
      <span style={{ ...dsText("Text 2xs", 600), color: ds.text.tertiary, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ ...dsText("Text md", 600), color: ds.text.primary }}>{value}</span>
      {note && <span style={{ ...dsText("Text xs"), color: ds.text.secondary }}>{note}</span>}
    </div>
  );
}
export function SimpleTable({ head, rows, widths }) {
  const cell = { padding: `${dsSpace[8]}px ${dsSpace[12]}px`, verticalAlign: "top", borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, ...dsText("Text xs"), color: ds.text.secondary, lineHeight: "19px" };
  return (
    <div style={{ overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", background: ds.surface.general.cardWithinCard, color: ds.text.tertiary }}>{head.map((h, i) => <th key={h} style={{ ...cell, fontWeight: 600, color: ds.text.tertiary, width: widths?.[i] }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ ...cell, ...(j === 0 ? { color: ds.text.primary, fontWeight: 600 } : null) }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
export function Limit({ n, title, children, use }) {
  return (
    <div style={{ display: "flex", gap: dsSpace[16], padding: `${dsSpace[16]}px 0`, borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}` }}>
      <span style={{ ...dsText("Text xs", 700), color: ds.text.quaternary, width: 20, flexShrink: 0, paddingTop: dsSpace[2] }}>{n}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[4], minWidth: 0 }}>
        <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>{title}</span>
        <span style={{ ...dsText("Text sm"), color: ds.text.secondary, maxWidth: "74ch" }}>{children}</span>
        {use && <span style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>{use}</span>}
      </div>
    </div>
  );
}
export const Two = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: dsSpace[16] }}>{children}</div>;
export const List = ({ items }) => <ul style={{ margin: 0, paddingLeft: dsSpace[20], display: "flex", flexDirection: "column", gap: dsSpace[6], ...dsText("Text sm"), color: ds.text.secondary }}>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>;
