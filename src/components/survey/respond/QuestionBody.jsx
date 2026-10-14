import { Smile } from "lucide-react";
import { T, font, radius } from "../../../lib/tokens.js";

/* ================================================================== */
/* QUESTION BODY — respondent-facing input for the 7 more-standard        */
/* question types, one switch case each (mirrors WidgetBuilderModal.jsx's  */
/* PayloadEditor switch pattern, just for reading/answering instead of     */
/* editing). `toggle-board` and `custom` are deliberately NOT here — they're */
/* their own files (ToggleBoardRespond.jsx/CustomRespond.jsx), since they're  */
/* the two most novel bodies (a rows x columns grid; a composed set of        */
/* labeled fields with an optional computed result).                          */
/* ================================================================== */

const fieldStyle = { border: `1px solid ${T.gray100}`, borderRadius: radius.md, padding: "8px 12px", fontFamily: font, fontSize: 14, color: T.gray900, boxSizing: "border-box", width: "100%" };

function OptionRow({ label, selected, onClick, shape = "round" }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
        border: `1px solid ${selected ? T.gray800 : T.gray100}`, borderRadius: radius.md, background: selected ? T.gray50 : T.white,
        cursor: "pointer", fontFamily: font, fontSize: 14, color: T.gray900,
      }}
    >
      <span style={{ width: 16, height: 16, flexShrink: 0, borderRadius: shape === "round" ? radius.full : radius.xs, border: `1.5px solid ${selected ? T.gray800 : T.gray300}`, background: selected ? T.gray800 : "transparent" }} />
      {label}
    </button>
  );
}

export default function QuestionBody({ questionType, typeData, value, onChange }) {
  switch (questionType) {
    case "input":
      return (
        <input
          type={typeData.inputKind === "number" ? "number" : "text"}
          value={value ?? ""}
          placeholder={typeData.placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={fieldStyle}
        />
      );

    case "likert":
      return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
          {typeData.labels.map((label, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer" }}
            >
              <span style={{ width: 22, height: 22, borderRadius: radius.full, border: `2px solid ${value === i ? T.gray800 : T.gray200}`, background: value === i ? T.gray800 : T.white }} />
              <span style={{ fontSize: 10, color: T.gray500, textAlign: "center" }}>{label}</span>
            </button>
          ))}
        </div>
      );

    case "multiple-choice": {
      const selectedSet = new Set(Array.isArray(value) ? value : value != null ? [value] : []);
      const pick = (opt) => {
        if (typeData.allowMultiple) {
          const next = new Set(selectedSet);
          next.has(opt) ? next.delete(opt) : next.add(opt);
          onChange([...next]);
        } else onChange(opt);
      };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {typeData.options.map((opt) => (
            <OptionRow key={opt} label={opt} selected={selectedSet.has(opt)} onClick={() => pick(opt)} shape={typeData.allowMultiple ? "square" : "round"} />
          ))}
        </div>
      );
    }

    case "smiley-5":
      return (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => onChange(n)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: radius.full, display: "flex", alignItems: "center", justifyContent: "center", background: value === n ? T.gray800 : T.gray50 }}>
                <Smile size={20} color={value === n ? T.white : T.gray400} />
              </div>
              <span style={{ fontSize: 10, color: T.gray400 }}>{n}</span>
            </button>
          ))}
        </div>
      );

    case "scale-0-10":
    case "scale-1-10": {
      const start = questionType === "scale-0-10" ? 0 : 1;
      const points = Array.from({ length: 11 - start }, (_, i) => start + i);
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
            {points.map((n) => (
              <button
                key={n}
                onClick={() => onChange(n)}
                style={{
                  flex: 1, height: 32, border: `1px solid ${value === n ? T.gray800 : T.gray100}`, borderRadius: radius.sm,
                  background: value === n ? T.gray800 : T.white, color: value === n ? T.white : T.gray700,
                  fontSize: 12, fontFamily: font, cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 10.5, color: T.gray400 }}>{typeData.minLabel}</span>
            <span style={{ fontSize: 10.5, color: T.gray400 }}>{typeData.maxLabel}</span>
          </div>
        </div>
      );
    }

    case "freetext":
      return typeData.multiline ? (
        <textarea value={value ?? ""} placeholder={typeData.placeholder} onChange={(e) => onChange(e.target.value)} rows={4} style={{ ...fieldStyle, resize: "vertical", fontFamily: font }} />
      ) : (
        <input type="text" value={value ?? ""} placeholder={typeData.placeholder} onChange={(e) => onChange(e.target.value)} style={fieldStyle} />
      );

    default:
      return null;
  }
}
