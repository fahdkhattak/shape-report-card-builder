import { DS } from "./dsTokens.generated.js";
import { bandKind } from "./bands.js";

/* ================================================================== */
/* DESIGN SYSTEM ACCESS — docs/shape-design-system-v4.md              */
/*                                                                    */
/* Every semantic colour is a CSS custom property that resolves to its */
/* Light value on :root and its Dark value inside a `.ds-dark` scope,  */
/* so a component written with `ds.text.primary` follows the mode with */
/* no per-component branching. The values are generated from the      */
/* markdown (scripts/build-ds-tokens.mjs → dsTokens.generated.js).    */
/*                                                                    */
/*   ds.text.primary            → var(--ds-color-text-primary)         */
/*   ds.status.success.graph    → var(--ds-color-status-success-graph) */
/*   dsBand(72).cs              → the status's text-indicator colour  */
/*   dsShadow("sm")             → the DS's 5-layer shadow, mode-aware  */
/*   dsText("Text sm")          → { fontSize, lineHeight, letterSpacing } */
/*                                                                    */
/* Primitives (Colors/Gray/500 …) are deliberately not exported: the   */
/* system says never to apply them directly.                          */
/* ================================================================== */
const slug = (path) => "--ds-" + path.toLowerCase().replace(/[\s/]+/g, "-").replace(/[^a-z0-9-]/g, "");
const camel = (s) => s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toLowerCase());

export const cssVar = (path) => slug(path);
export const dsVar = (path) => `var(${slug(path)})`;

/* nested accessor: color/status/success/text-indicator → ds.status.success.textIndicator */
export const ds = {};
const PATH_BY_VAR = {};
for (const path of Object.keys(DS.semantic)) {
  PATH_BY_VAR[slug(path)] = path;
  const parts = path.replace(/^color\//, "").split("/").map(camel);
  let node = ds;
  parts.slice(0, -1).forEach((p) => { node = node[p] && typeof node[p] === "object" ? node[p] : (node[p] = {}); });
  node[parts[parts.length - 1]] ??= dsVar(path);
}
ds.graph = ds.utility.graphColors.main;
ds.likert = ds.utility.likert;

/* var(--ds-…) → "color/text/primary", for showing the token a style resolves to */
export const tokenForVar = (v) => {
  const m = /var\((--ds-[a-z0-9-]+)\)/.exec(v || "");
  return m ? PATH_BY_VAR[m[1]] || null : null;
};

/* Status colours for a 0–100 score on the status scale in lib/bands.js (Flourishing 80+, Striving 60 to 79, Struggling under 60).
   c  = fills and strokes   (status/{kind}/graph)
   cs = text on a light or dark surface (status/{kind}/text-indicator)
   bg = tint behind it      (status/{kind}/bg)                      */
export function dsBand(v) {
  const k = bandKind(v);
  const s = ds.status[k];
  return { key: k, name: k === "success" ? "Flourishing" : k === "warning" ? "Striving" : "Struggling", c: s.graph, cs: s.textIndicator, bg: s.bg, tokens: { c: `color/status/${k}/graph`, cs: `color/status/${k}/text-indicator`, bg: `color/status/${k}/bg` } };
}

/* shadow-xs … shadow-2xl: five layers, colours that change with the mode */
export const dsShadow = (name) => `var(--ds-shadow-${name})`;

/* scales */
export const dsRadius = Object.fromEntries(Object.entries(DS.radius).map(([k, v]) => [camel(k.replace("radius/", "")), v]));
export const dsSpace = Object.fromEntries(Object.entries(DS.spacing).map(([k, v]) => [k.replace("spacing/", ""), v]));
export const dsBorder = Object.fromEntries(Object.entries(DS.borderWidth).map(([k, v]) => [k.replace("border-width/", ""), v]));
export const DS_TYPE = DS.type;
export function dsText(name, weight) {
  const t = DS.type.find((x) => x.name === name);
  if (!t) throw new Error(`Unknown DS text style: ${name}`);
  const pct = parseFloat(t.tracking);
  return {
    fontSize: t.size,
    lineHeight: /^\d/.test(t.lineHeight) ? `${parseInt(t.lineHeight, 10)}px` : "normal",
    letterSpacing: pct ? `${pct / 100}em` : undefined,
    ...(weight ? { fontWeight: weight } : null),
  };
}

/* ---- CSS: light on :root, dark in .ds-dark ------------------------------------------------ */
export function dsCss() {
  const light = [], dark = [];
  for (const [path, v] of Object.entries(DS.semantic)) { light.push(`${slug(path)}:${v.light}`); dark.push(`${slug(path)}:${v.dark}`); }
  for (const [name, layers] of Object.entries(DS.shadows)) {
    layers.forEach((l, i) => { light.push(`--ds-shadow-${name}-${i + 1}:${l.light}`); dark.push(`--ds-shadow-${name}-${i + 1}:${l.dark}`); });
    light.push(`--ds-shadow-${name}:${layers.map((l, i) => `0 ${l.y}px ${l.blur}px var(--ds-shadow-${name}-${i + 1})`).join(",")}`);
  }
  return `:root{${light.join(";")}}\n.ds-dark{color-scheme:dark;${dark.join(";")}}`;
}
if (typeof document !== "undefined" && !document.getElementById("ds-vars")) {
  const el = document.createElement("style");
  el.id = "ds-vars";
  el.textContent = dsCss();
  document.head.appendChild(el);
}

export const DS_RAW = DS; // the parsed tables, for the documentation pages (never for styling)
