import { useLayoutEffect, useRef, useState } from "react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius } from "../../lib/ds.js";

/* ================================================================== */
/* RECIPE BOARD: a config builder drawn as a recipe card. Each row is one */
/* decision (subject, insight type, form, size, evidence…), each option   */
/* one answer; a recipe is one answer per row, drawn as a line through    */
/* them, and its name reads straight off the line. Options the earlier     */
/* answers rule out stay in place, faded, with the reason on hover, so the */
/* rules are visible as well as enforced. A second recipe (`ghost`) can be */
/* drawn in grey under the first, to compare two.                          */
/*   rows   [{ id, label, options: [{ id, label, state, why }] }]           */
/*          state: "on" (chosen) | "open" (can be chosen) | "off" (ruled out)*/
/*   ghost  { [rowId]: optionId }, the comparison recipe                    */
/*   name   the recipe's name, drawn under the first row                    */
/* ================================================================== */
const ACCENT = "var(--ds-color-button-accent-primary-bg-default)";
const LABEL_W = 176;

export default function RecipeBoard({ rows, onPick, ghost, name, nameLabel = "Recipe" }) {
  const box = useRef(null);
  const [lines, setLines] = useState({ main: [], ghost: [], w: 0, h: 0 });

  // The line runs through the centre of each chosen option, row by row. Measured from the DOM so wrapping rows still work.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = () => {
      const b = el.getBoundingClientRect();
      const at = (rowId, optId) => {
        const o = optId != null && el.querySelector(`[data-opt="${CSS.escape(`${rowId}::${optId}`)}"]`);
        if (!o) return null;
        const r = o.getBoundingClientRect();
        return [r.left - b.left + r.width / 2, r.top - b.top + r.height / 2];
      };
      const main = rows.map((r) => at(r.id, r.options.find((o) => o.state === "on")?.id)).filter(Boolean);
      const gh = ghost ? rows.map((r) => at(r.id, ghost[r.id])).filter(Boolean) : [];
      setLines({ main, ghost: gh, w: b.width, h: b.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows, ghost]);

  const pts = (p) => p.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <div ref={box} data-recipe-board style={{ position: "relative", background: ds.bg.primary, borderRadius: dsRadius.xl, padding: `${dsSpace[32]}px ${dsSpace[32]}px`, fontFamily: font }}>
      <svg aria-hidden="true" width={lines.w} height={lines.h} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
        {lines.ghost.length > 1 && <polyline points={pts(lines.ghost)} fill="none" stroke={ds.border.secondary} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
        {lines.main.length > 1 && <polyline points={pts(lines.main)} fill="none" stroke={ACCENT} strokeOpacity="0.55" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
      </svg>
      <div role="group" aria-label={nameLabel} style={{ position: "relative", display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
        {rows.map((r, i) => (
          <div key={r.id}>
            <Row row={r} onPick={onPick} chosenIsGhost={ghost?.[r.id]} />
            {i === 0 && name && (
              <div style={{ display: "flex", gap: dsSpace[16], alignItems: "baseline", marginTop: dsSpace[16] }}>
                <span style={{ width: LABEL_W, flexShrink: 0, ...dsText("Text sm", 500), color: ds.text.primary }}>{nameLabel}</span>
                <span data-part="recipe-name" style={{ ...dsText("Text md", 700), color: ACCENT, background: ds.bg.primary, padding: "0 4px", marginLeft: -4 }}>{name}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ row, onPick, chosenIsGhost }) {
  const chosen = row.options.some((o) => o.state === "on");
  return (
    <div role="radiogroup" aria-label={row.label} style={{ display: "flex", gap: dsSpace[16], alignItems: "baseline" }}>
      <span style={{ width: LABEL_W, flexShrink: 0, ...dsText("Text sm", 500), color: chosen ? ds.text.primary : ds.text.tertiary }}>
        {row.label}
        {row.hint && <span style={{ display: "block", ...dsText("Text 3xs"), color: ds.text.quaternary, fontWeight: 400 }}>{row.hint}</span>}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: dsSpace[8], rowGap: dsSpace[8], minWidth: 0 }}>
        {row.options.map((o) => {
          const on = o.state === "on", off = o.state === "off", ghost = chosenIsGhost === o.id && !on;
          return (
            <button
              key={o.id} type="button" role="radio" aria-checked={on} aria-disabled={off || undefined}
              data-opt={`${row.id}::${o.id}`} title={off ? o.why || "Not possible with the choices above" : o.why || undefined}
              onClick={() => !off && !on && onPick(row.id, o.id)}
              className="recipe-opt"
              style={{
                border: "none", background: ds.bg.primary, fontFamily: font, padding: "2px 8px", borderRadius: dsRadius.sm,
                ...dsText("Text sm", on ? 600 : 400), cursor: off ? "not-allowed" : on ? "default" : "pointer",
                color: on ? ds.text.primary : off ? ds.text.disabled : ghost ? ds.text.secondary : ds.text.tertiary,
                textDecorationLine: off ? "line-through" : "none", textDecorationColor: ds.border.secondary,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
