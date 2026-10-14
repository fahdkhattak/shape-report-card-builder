import { T, font, radius } from "../../lib/tokens.js";
import { PERSONAS } from "../../lib/surveyBlueprint.js";

/* ================================================================== */
/* PERSONA VISIBILITY — shared 3-chip control ("show this only to these */
/* personas") used by both question and component node inspectors.      */
/* Fixed role set, NOT demographic-based — see surveyBlueprint.js's      */
/* own comment on PERSONAS for why.                                     */
/* ================================================================== */
export default function PersonaVisibilityField({ value, onChange }) {
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    // Never allow zero personas selected — that would make the node
    // invisible to everyone with no way to tell why in the editor.
    onChange(next.length ? next : PERSONAS.map((p) => p.id));
  };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {PERSONAS.map((p) => {
        const active = value.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            style={{
              border: `1px solid ${active ? T.gray800 : T.gray100}`, background: active ? T.gray800 : T.white,
              color: active ? T.white : T.gray600, borderRadius: radius.full, padding: "5px 12px",
              fontSize: 12, fontWeight: 500, fontFamily: font, cursor: "pointer", transition: "background 100ms ease",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
