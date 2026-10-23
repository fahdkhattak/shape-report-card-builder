import { statusOf } from "./data.js";

/* ================================================================== */
/* Power BI building blocks for the mockup. Everything here maps to a   */
/* native Power BI visual or formatting option, so the redesign can be  */
/* built as drawn: a report theme (colours, Segoe UI), cards, tables and */
/* matrices with conditional formatting and data bars, bar / column     */
/* charts, 100% stacked bars, dropdown and tile slicers, buttons and    */
/* the page navigator. Fixed 1280 × 720 page, as Power BI's 16:9 canvas.  */
/* ================================================================== */
export const PAGE_W = 1280, PAGE_H = 720;
export const FONT = '"Segoe UI", "Segoe UI Web (West European)", Selawik, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

/* The report theme (a Power BI theme JSON would carry exactly these). */
export const C = {
  navy: "#24317E", navySoft: "#E9ECF8", navyLine: "#C9CFEA",
  page: "#EEF0F4", card: "#FFFFFF", line: "#E2E5EC", rule: "#EFF1F5", track: "#EEF0F4",
  text: "#1E2230", text2: "#4B5266", text3: "#7A8194",
  red: "#C23B4B", redFill: "#D2495A", redSoft: "#FBE9EB",
  amber: "#B9740A", amberFill: "#EDA93A", amberSoft: "#FDF2E0",
  green: "#22804F", greenFill: "#3A9B66", greenSoft: "#E5F3EB",
};
export const STATUS = {
  Struggling: { text: C.red, fill: C.redFill, soft: C.redSoft },
  Striving: { text: C.amber, fill: C.amberFill, soft: C.amberSoft },
  Flourishing: { text: C.green, fill: C.greenFill, soft: C.greenSoft },
};
export const st = (v) => STATUS[statusOf(v)];
/* Five answer shades: the three Struggling answers in reds, Agree amber, Strongly agree green. */
export const ANSWER_FILL = ["#9E2232", C.redFill, "#E8949E", C.amberFill, C.greenFill];

export const T = {
  title: { fontSize: 13, fontWeight: 600, color: C.text },
  sub: { fontSize: 11, color: C.text3, lineHeight: "15px" },
  body: { fontSize: 12, color: C.text2, lineHeight: "17px" },
  label: { fontSize: 11, color: C.text3 },
  kpi: { fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: -0.5 },
};

/* A visual container: white, 8px radius, a hairline border (Power BI: visual background, border, rounded corners). */
export function Card({ title, sub, right, children, style, bodyStyle, pad = 14 }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, display: "flex", flexDirection: "column", minHeight: 0, boxSizing: "border-box", ...style }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: `${pad - 2}px ${pad}px 0` }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={T.title}>{title}</div>}
            {sub && <div style={{ ...T.sub, marginTop: 2 }}>{sub}</div>}
          </div>
          {right}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: pad, paddingTop: title ? 10 : pad, display: "flex", flexDirection: "column", ...bodyStyle }}>{children}</div>
    </div>
  );
}

/* A KPI card (Power BI's card visual with a reference label). */
export function Kpi({ label, value, unit, color = C.text, foot, style }) {
  return (
    <Card style={style} pad={14}>
      <div style={T.label}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
        <span style={{ ...T.kpi, color }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: C.text3 }}>{unit}</span>}
      </div>
      {foot && <div style={{ ...T.sub, marginTop: 6 }}>{foot}</div>}
    </Card>
  );
}

export function StatusPill({ status, children }) {
  const s = STATUS[status];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.soft, color: s.text, fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap" }}><span style={{ width: 6, height: 6, borderRadius: 6, background: s.fill }} />{children || status}</span>;
}
/* A score in its status colour (conditional formatting: font colour by rules). */
export const Score = ({ v, size = 12, weight = 700 }) => <span style={{ color: st(v).text, fontWeight: weight, fontSize: size, fontVariantNumeric: "tabular-nums" }}>{v}</span>;

/* A data bar (table conditional formatting). */
export function DataBar({ pct, color = C.redFill, label, width = 90, max = 100 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "100%" }}>
      <span style={{ width, height: 8, background: C.track, borderRadius: 2, flexShrink: 0, overflow: "hidden" }}><span style={{ display: "block", width: `${Math.min(100, (pct / max) * 100)}%`, height: "100%", background: color }} /></span>
      <span style={{ fontSize: 12, color: C.text, fontVariantNumeric: "tabular-nums", minWidth: 30 }}>{label ?? `${pct}%`}</span>
    </span>
  );
}

/* A 100% stacked bar (Power BI's 100% stacked bar chart, one category). parts: [{ value, color, label }]. */
export function StackBar({ parts, height = 14, labels = true }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div style={{ display: "flex", height, borderRadius: 3, overflow: "hidden", gap: 2, background: C.card }}>
      {parts.map((p, i) => (
        <div key={i} title={p.title} style={{ flex: `${p.value} 0 0`, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 600, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap" }}>
          {labels && (p.value / total) > 0.07 ? p.label ?? p.value : ""}
        </div>
      ))}
    </div>
  );
}

/* A horizontal bar row (bar chart with data labels). Optional reference line (constant line) at `ref`. */
export function BarRow({ label, value, color, max = 100, labelW = 200, height = 12, valueLabel, refAt, sub, onClick, active, marks }) {
  return (
    <div onClick={onClick} style={{ display: "grid", gridTemplateColumns: `${labelW}px 1fr 34px`, alignItems: "center", gap: 10, cursor: onClick ? "pointer" : "default", opacity: active === false ? 0.45 : 1 }}>
      <div style={{ fontSize: 12, color: C.text, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>{label}{sub && <span style={{ color: C.text3 }}> {sub}</span>}</div>
      <div style={{ position: "relative", height }}>
        <div style={{ position: "absolute", inset: 0, background: C.track, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(value / max) * 100}%`, background: color, borderRadius: 2 }} />
        {marks?.map((m) => <div key={m} style={{ position: "absolute", left: `${(m / max) * 100}%`, top: -3, bottom: -3, borderLeft: `1px dashed ${C.text3}`, opacity: 0.5 }} />)}
        {refAt != null && <div style={{ position: "absolute", left: `${(refAt / max) * 100}%`, top: -3, bottom: -3, width: 2, background: C.text, opacity: 0.55 }} />}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{valueLabel ?? value}</div>
    </div>
  );
}

/* Status thresholds drawn behind a 0 to 100 bar list (constant lines at 60 and 80). */
export function Thresholds({ labelW = 200 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `${labelW}px 1fr 34px`, gap: 10, fontSize: 10, color: C.text3 }}>
      <span />
      <div style={{ position: "relative", height: 12 }}>
        {[0, 60, 80, 100].map((v) => <span key={v} style={{ position: "absolute", left: `${v}%`, transform: v === 0 ? "none" : v === 100 ? "translateX(-100%)" : "translateX(-50%)" }}>{v}</span>)}
      </div>
      <span />
    </div>
  );
}

/* A table header / row in Power BI's minimal table style. */
export const th = { fontSize: 11, fontWeight: 600, color: C.text3, textAlign: "left", padding: "0 8px 6px", borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };
export const td = { fontSize: 12, lineHeight: "16px", color: C.text, padding: "5px 8px", borderBottom: `1px solid ${C.rule}`, verticalAlign: "middle" };

/* A dropdown slicer (closed). */
export function Slicer({ label, value = "All", width = 132, emphasis }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, width }}>
      <span style={{ fontSize: 10, color: emphasis ? C.navy : C.text3, fontWeight: emphasis ? 600 : 400, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 24, padding: "0 8px", border: `1px solid ${emphasis ? C.navy : C.line}`, borderRadius: 4, background: C.card, fontSize: 12, color: value === "All" ? C.text3 : C.text, fontWeight: value === "All" ? 400 : 600, overflow: "hidden", whiteSpace: "nowrap" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}><path d="M2 3.5 5 6.5 8 3.5" stroke={C.text3} strokeWidth="1.4" fill="none" /></svg>
      </span>
    </div>
  );
}

/* A button (Power BI button: navigation, drill through, bookmark). */
export function PbiButton({ children, onClick, primary, disabled, style }) {
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ height: 28, padding: "0 12px", borderRadius: 4, border: `1px solid ${primary ? C.navy : C.line}`, background: disabled ? C.rule : primary ? C.navy : C.card, color: disabled ? C.text3 : primary ? "#fff" : C.text, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: disabled ? "default" : "pointer", whiteSpace: "nowrap", ...style }}>
      {children}
    </button>
  );
}
