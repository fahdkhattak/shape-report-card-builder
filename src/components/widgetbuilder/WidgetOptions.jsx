import { Minus, Plus } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import { formById, GROUP_AXES, defaultTarget, pickGroup, pickPair } from "../../lib/subjectForms.js";
import { changeSpec } from "./builderEngine.js";

/* ================================================================== */
/* WIDGET OPTIONS — what can be tuned on the widget that was built:     */
/* its size (1×1 / 2×2), the way of grouping people for a Groups widget, */
/* and the target for a Goal widget. Only the options the chosen form    */
/* actually has are shown; nothing is a dead control.                    */
/* Shared by both builder screens.                                       */
/* ================================================================== */
const label = { fontSize: 13, fontWeight: 600, color: T.gray500, fontFamily: font };

export default function WidgetOptions({ built, subject, onChange }) {
  const { spec } = built;
  if (spec.vizType !== "form") return null;
  const def = formById(spec.form);
  const apply = (change) => onChange(changeSpec(built, subject, change));
  const rows = [];

  if (def.sizes.length > 1) {
    rows.push(
      <div key="size" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ ...label, width: 64 }}>Size</span>
        <SegmentedControl options={def.sizes.map((s) => ({ id: s, label: s.replace("x", "×") }))} value={spec.size} onChange={(size) => apply({ size })} />
      </div>
    );
  }
  if (def.options?.includes("axis")) {
    rows.push(
      <div key="axis" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ ...label, width: 64 }}>Group by</span>
        <select
          aria-label="Group people by" className="field-soft" value={spec.payload.axis} onChange={(e) => apply({ options: { axis: e.target.value } })}
          style={{ fontFamily: font, fontSize: 13, padding: "6px 10px", borderRadius: radius.md, color: T.gray900 }}
        >
          {GROUP_AXES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
        </select>
      </div>
    );
  }
  const select = (key, name, value, items, onPick) => (
    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ ...label, width: 64 }}>{name}</span>
      <select aria-label={name} className="field-soft" value={value} onChange={(e) => onPick(e.target.value)} style={{ fontFamily: font, fontSize: 13, padding: "6px 10px", borderRadius: radius.md, color: T.gray900, maxWidth: 220 }}>
        {items.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
      </select>
    </div>
  );
  if (def.options?.includes("group")) {
    const g = pickGroup(subject, spec.options);
    rows.push(select("axis", "Split by", g.axis, GROUP_AXES.map((a) => ({ value: a.key, label: a.label })), (axis) => apply({ options: { axis, group: undefined } })));
    rows.push(select("group", "Group", g.group, g.groups.map((x) => ({ value: x, label: x })), (group) => apply({ options: { axis: g.axis, group } })));
  }
  if (def.options?.includes("pair")) {
    const p = pickPair(subject, spec.options);
    rows.push(select("axis", "Split by", p.axis, GROUP_AXES.map((a) => ({ value: a.key, label: a.label })), (axis) => apply({ options: { axis, a: undefined, b: undefined } })));
    rows.push(select("a", "This", p.a, p.groups.filter((x) => x !== p.b).map((x) => ({ value: x, label: x })), (a) => apply({ options: { axis: p.axis, a, b: p.b } })));
    rows.push(select("b", "Against", p.b, p.groups.filter((x) => x !== p.a).map((x) => ({ value: x, label: x })), (b) => apply({ options: { axis: p.axis, a: p.a, b } })));
  }
  if (def.options?.includes("lift")) {
    const n = spec.payload.lift;
    const btn2 = { width: 28, height: 28, borderRadius: radius.full, border: "none", background: T.gray75, color: T.gray700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 };
    rows.push(
      <div key="lift" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ ...label, width: 64 }}>Lift</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button aria-label="Lift fewer parts" onClick={() => apply({ options: { lift: Math.max(1, n - 1) } })} style={btn2}><Minus size={14} /></button>
          <span style={{ minWidth: 70, textAlign: "center", fontSize: 14, fontWeight: 600, color: T.gray900, fontFamily: font }}>weakest {n}</span>
          <button aria-label="Lift more parts" onClick={() => apply({ options: { lift: Math.min(5, n + 1) } })} style={btn2}><Plus size={14} /></button>
        </div>
      </div>
    );
  }
  if (def.options?.includes("target")) {
    const t = spec.payload.target;
    const step = (d) => apply({ options: { target: Math.max(10, Math.min(100, t + d)) } });
    const btn = { width: 28, height: 28, borderRadius: radius.full, border: "none", background: T.gray75, color: T.gray700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 };
    rows.push(
      <div key="target" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ ...label, width: 64 }}>Target</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button aria-label="Lower the target" onClick={() => step(-5)} style={btn}><Minus size={14} /></button>
          <span style={{ minWidth: 32, textAlign: "center", fontSize: 15, fontWeight: 600, color: T.gray900, fontVariantNumeric: "tabular-nums", fontFamily: font }}>{t}</span>
          <button aria-label="Raise the target" onClick={() => step(5)} style={btn}><Plus size={14} /></button>
          {t !== defaultTarget(spec.payload.value) && (
            <button onClick={() => apply({ options: { target: defaultTarget(spec.payload.value) } })} style={{ border: "none", background: "transparent", color: T.gray500, fontSize: 12, fontFamily: font, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Reset</button>
          )}
        </div>
      </div>
    );
  }
  if (!rows.length) return null;
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{rows}</div>;
}
