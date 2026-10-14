import { T, font, radius } from "../../../lib/tokens.js";
import { computeCustomResult } from "../../../lib/questionTypes.js";

/* ================================================================== */
/* CUSTOM RESPOND — the respondent-facing body for a `custom` question:  */
/* one number input per author-defined field, plus a live computed        */
/* result when the author turned one on (Sum/Average/BMI). Own file per    */
/* the same reasoning `ToggleBoardRespond.jsx` already documents — the      */
/* most novel body, isolated so it can be revised on its own. Replaces the   */
/* old dedicated `BMIRespond.jsx`; a BMI question is now just a `custom`      */
/* question started from the Body Mass Index template (questionTypes.js's     */
/* `BMI_TEMPLATE`), so this is the general case, not a special one.            */
/* ================================================================== */

const fieldStyle = { border: `1px solid ${T.gray100}`, borderRadius: radius.md, padding: "8px 12px", fontFamily: font, fontSize: 14, color: T.gray900, boxSizing: "border-box", width: "100%" };

export default function CustomRespond({ typeData, value, onChange }) {
  const values = typeData.fields.map((_, i) => value?.[i] ?? "");
  const setFieldValue = (i, v) => {
    const next = [...values];
    next[i] = v;
    onChange(next);
  };
  const result = computeCustomResult(typeData.compute, values);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {typeData.fields.map((f, i) => (
        <div key={f.id}>
          <div style={{ fontSize: 12, color: T.gray500, marginBottom: 6 }}>{f.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" value={values[i]} onChange={(e) => setFieldValue(i, e.target.value)} style={fieldStyle} />
            {f.unit && <span style={{ fontSize: 13, color: T.gray400, flexShrink: 0 }}>{f.unit}</span>}
          </div>
        </div>
      ))}
      {typeData.compute !== "none" && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, paddingTop: 4, borderTop: `1px solid ${T.gray75}` }}>
          <span style={{ fontSize: 13, color: T.gray500 }}>{typeData.resultLabel || "Result"}:</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: T.gray900 }}>{result != null ? result.toFixed(1) : "—"}</span>
        </div>
      )}
    </div>
  );
}
