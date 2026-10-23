import { tokenForVar, DS_RAW } from "./ds.js";

/* ================================================================== */
/* LIVE TOKEN CHECK — is every colour, size, radius and gap in a rendered */
/* widget a design-system token? Reads each element's own inline style   */
/* (and SVG fill / stroke attributes): a value written as               */
/* var(--ds-…) is a token; a hex, rgb or a legacy T.* value (which        */
/* arrives as a hex) is not. Font sizes, radii and gaps are checked       */
/* against the design system's scales. The static side is                */
/* scripts/audit-widgets.mjs (which file, which T key, which token).      */
/* ================================================================== */
const COLOUR_PROPS = ["color", "background", "backgroundColor", "border", "borderTop", "borderBottom", "borderLeft", "borderRight", "borderColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "outline", "fill", "stroke", "boxShadow"];
const FONT = new Set(DS_RAW.type.map((t) => t.size));
const RADIUS = new Set(Object.values(DS_RAW.radius).concat([50]));
const SPACE = new Set(Object.values(DS_RAW.spacing));
const IGNORE = /^(none|transparent|inherit|currentcolor|initial|unset|0|)$/i;
const colourIn = (v) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(v);

/* Every non-token value in `root`: [{ el: short description, prop, value, kind: "colour" | "font" | "radius" | "gap" }].
   Also returns how many colour values were tokens, for the ratio. */
export function auditTokens(root) {
  const raw = [];
  let tokens = 0;
  if (!root) return { raw, tokens };
  const describe = (el) => {
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    return `${el.tagName.toLowerCase()}${text ? ` “${text.length > 22 ? `${text.slice(0, 20)}…` : text}”` : ""}`;
  };
  for (const el of root.querySelectorAll("*")) {
    const st = el.style;
    if (st) {
      const seen = new Set(); // a shorthand and its longhand carry the same colour: count it once per element
      const colourKey = (v) => (v.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || [v]).join(",");
      for (const p of COLOUR_PROPS) {
        const v = (st[p] || "").replace(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)/g, "transparent"); // a fully transparent colour isn't seen
        if (!v || IGNORE.test(v.trim()) || /^(transparent\s*0px 0px 0px|transparent)$/.test(v.trim())) continue;
        if (v.includes("var(--ds-")) { tokens++; if (!colourIn(v.replace(/var\([^)]*\)/g, ""))) continue; }
        const isRaw = colourIn(v) || (!v.includes("var(") && !/^(url|linear|radial)/.test(v) && !/^(box|border|outline)/.test(p) && !/^\d/.test(v));
        if (isRaw && !seen.has(colourKey(v))) { seen.add(colourKey(v)); raw.push({ el: describe(el), prop: p, value: v, kind: "colour" }); }
      }
      const fs = parseFloat(st.fontSize);
      if (st.fontSize && st.fontSize.endsWith("px") && !FONT.has(fs)) raw.push({ el: describe(el), prop: "fontSize", value: st.fontSize, kind: "font" });
      const r = parseFloat(st.borderRadius);
      if (st.borderRadius && /^\d+(\.\d+)?px$/.test(st.borderRadius) && !RADIUS.has(r)) raw.push({ el: describe(el), prop: "borderRadius", value: st.borderRadius, kind: "radius" });
      for (const p of ["gap", "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "margin"]) {
        const v = st[p];
        if (!v || v.includes("var(")) continue;
        const bad = (v.match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat).filter((n) => n !== 0 && !SPACE.has(Math.abs(n)));
        if (bad.length) raw.push({ el: describe(el), prop: p, value: v, kind: "gap" });
      }
    }
    // SVG presentation attributes.
    for (const a of ["fill", "stroke", "stop-color"]) {
      const v = el.getAttribute?.(a);
      if (!v || IGNORE.test(v.trim()) || /^url\(/.test(v)) continue;
      if (v.includes("var(--ds-")) tokens++;
      else if (colourIn(v)) raw.push({ el: describe(el), prop: a, value: v, kind: "colour" });
    }
  }
  return { raw, tokens };
}
export { tokenForVar };
