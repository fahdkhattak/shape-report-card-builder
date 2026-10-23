// Static design-system token check of the WIDGETS (bodies, parts, charts, the card shell, the SHAPE widgets).
// Same idea as audit-ds.mjs (Stories), plus a suggestion for every raw colour: the design-system semantic tokens whose
// Light value is the same hex. Writes src/lib/widgetTokenAudit.generated.js for Developer › Widgets › Token audit.
//   node scripts/audit-widgets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DS } from "../src/lib/dsTokens.generated.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  ...fs.readdirSync(path.join(root, "src/components/widgets")).filter((f) => /\.jsx?$/.test(f)).map((f) => `src/components/widgets/${f}`),
  "src/components/shape/shapeWidgets.jsx",
  "src/components/canvas/WidgetCard.jsx", "src/components/canvas/WidgetMenu.jsx", "src/components/canvas/ExplorerRingCard.jsx",
];
const FONT = new Set(DS.type.map((t) => t.size));
const RADIUS = new Set(Object.values(DS.radius).concat([50]));
const SPACE = new Set(Object.values(DS.spacing));
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/* The legacy T palette (lib/tokens.js), read from the file so this can't drift. */
const tSrc = fs.readFileSync(path.join(root, "src/lib/tokens.js"), "utf8");
const T = Object.fromEntries([...tSrc.matchAll(/^\s+(\w+):\s*"(#[0-9a-fA-F]{6})"/gm)].map((m) => [m[1], m[2].toLowerCase()]));
/* Semantic tokens by Light hex, and primitives by hex. */
const byHex = {};
for (const [k, v] of Object.entries(DS.semantic)) { const h = (v.light || "").toLowerCase(); if (/^#[0-9a-f]{6}$/.test(h)) (byHex[h] = byHex[h] || []).push(k); }
const primByHex = {};
for (const [k, v] of Object.entries(DS.primitives)) if (typeof v === "string") (primByHex[v.toLowerCase()] = primByHex[v.toLowerCase()] || []).push(k);
/* A suggestion depends on what the colour is used FOR: the property in front of it (color → a text token, background → a
   bg / surface / status-bg token, border → a border token, fill / stroke → a graph / status / icon token). Tokens that are
   for a state (disabled, placeholder, inverse) or a single component come last. */
const FAMILY = {
  text: [/^color\/text\/(?!disabled|placeholder|inverse|alwaysblack)/, /^color\/status\/.*\/text/, /^color\/icon\//],
  bg: [/^color\/(bg|surface)\/(?!disabled|overlay)/, /^color\/status\/.*\/bg/, /^utility\/Likert/, /^color\/status\/.*\/graph/],
  border: [/^color\/border\//, /^color\/status\/.*\/border/],
  graph: [/^color\/status\/.*\/graph/, /^utility\/Graph/, /^color\/icon\//, /^color\/status\//],
  other: [/^color\/status\/.*\/(text|graph|bg)/, /^color\/text\/(?!disabled|placeholder|inverse|alwaysblack)/, /^utility\/Graph/, /^color\/(bg|surface|border)\//],
};
const usageOf = (prop) => (/^(color|stopColor)$/.test(prop) ? "text" : /^(background|backgroundColor|bg)$/.test(prop) ? "bg" : /^border/.test(prop) || prop === "outline" ? "border" : /^(fill|stroke|c|tone|colour|color\w*)$/i.test(prop) ? "graph" : "other");
const suggest = (hex, usage = "other") => {
  const all = byHex[hex] || [];
  const pref = FAMILY[usage] || [];
  const score = (t) => { const i = pref.findIndex((re) => re.test(t)); return (i < 0 ? 10 : i) + (/disabled|placeholder|alwaysblack|button|toggle|tooltip|interactive/.test(t) || (usage !== "bg" && /inverse/.test(t)) ? 20 : 0); };
  return [...all].sort((a, b) => score(a) - score(b) || a.length - b.length).slice(0, 3);
};
const expand3 = (h) => (h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h).toLowerCase().slice(0, 7);

const files = {};
const tUse = {}, hexUse = {};
for (const rel of FILES) {
  const src = stripComments(fs.readFileSync(path.join(root, rel), "utf8"));
  const count = (re) => (src.match(re) || []).length;
  const nums = (re, pick) => [...src.matchAll(re)].flatMap((m) => pick(m)).filter((n) => Number.isFinite(n));
  const fonts = nums(/fontSize(?::\s*|=\{\s*|=")(\d+(?:\.\d+)?)/g, (m) => [parseFloat(m[1])]);
  const radii = nums(/[rR]adius:\s*(\d+(?:\.\d+)?)\b/g, (m) => [parseFloat(m[1])]);
  const space = nums(/\b(?:gap|rowGap|columnGap|padding\w*|margin\w*)\s*:\s*(?:"([^"]*)"|(-?\d+(?:\.\d+)?))/g, (m) => (m[1] ? m[1].match(/-?\d+(?:\.\d+)?/g) || [] : [m[2]]).map(parseFloat)).filter((n) => n !== 0);
  // Each T use, with the property it's assigned to (the nearest "name:" or "name=" before it on the same line).
  const tHits = [...src.matchAll(/\bT\.([A-Za-z0-9]+)\b/g)].filter((m) => m[1] in T).map((m) => {
    const before = src.slice(Math.max(0, m.index - 80), m.index).split("\n").pop();
    const props = [...before.matchAll(/([A-Za-z]+)\s*[:=]\s*(?:\{)?/g)].map((x) => x[1]);
    return { key: m[1], usage: usageOf(props[props.length - 1] || "") };
  });
  const tKeys = tHits.map((h) => h.key);
  tHits.forEach(({ key: k, usage }) => { tUse[k] = tUse[k] || { count: 0, files: new Set(), usage: {} }; tUse[k].count++; tUse[k].files.add(rel); tUse[k].usage[usage] = (tUse[k].usage[usage] || 0) + 1; });
  const hexes = [...src.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)].map((m) => expand3(m[0]));
  hexes.forEach((h) => { hexUse[h] = hexUse[h] || { count: 0, files: new Set() }; hexUse[h].count++; hexUse[h].files.add(rel); });
  files[rel] = {
    tPrimitives: tKeys.length, hex: hexes.length, rgba: count(/rgba?\(/g),
    semibold: count(/fontWeight:\s*600\b/g),
    offScaleFont: [...new Set(fonts.filter((n) => !FONT.has(n)))].sort((a, b) => a - b),
    offScaleRadius: [...new Set(radii.filter((n) => !RADIUS.has(n)))].sort((a, b) => a - b),
    offScaleSpace: [...new Set(space.filter((n) => !SPACE.has(Math.abs(n))))].sort((a, b) => a - b),
    dsTokens: count(/\bds(?:\.[A-Za-z0-9]+)+|\bdsBand\(|\bdsShadow\(|\bdsRadius\b|\bdsText\(|\bdsSpace\b/g),
  };
}
const list = Object.values(files);
const sum = (k) => list.reduce((a, f) => a + (Array.isArray(f[k]) ? f[k].length : f[k]), 0);
const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  files,
  totals: { files: list.length, tPrimitives: sum("tPrimitives"), hex: sum("hex"), rgba: sum("rgba"), semibold: sum("semibold"), offScaleFont: sum("offScaleFont"), offScaleRadius: sum("offScaleRadius"), offScaleSpace: sum("offScaleSpace"), dsTokens: sum("dsTokens") },
  tMap: Object.entries(tUse).map(([key, u]) => ({ key, hex: T[key], count: u.count, files: [...u.files].map((f) => path.basename(f)), usage: Object.entries(u.usage).sort((a, b) => b[1] - a[1]).map(([use, n]) => ({ use, n, tokens: suggest(T[key], use) })), primitive: primByHex[T[key]]?.[0] || null })).sort((a, b) => b.count - a.count),
  hexMap: Object.entries(hexUse).map(([hex, u]) => ({ hex, count: u.count, files: [...u.files].map((f) => path.basename(f)), tokens: suggest(hex), primitive: primByHex[hex]?.[0] || null })).sort((a, b) => b.count - a.count),
};
fs.writeFileSync(path.join(root, "src/lib/widgetTokenAudit.generated.js"), `/* GENERATED by scripts/audit-widgets.mjs - do not edit by hand. */\nexport const WIDGET_TOKEN_AUDIT = ${JSON.stringify(out, null, 1)};\n`);
console.log(out.totals);
for (const [f, r] of Object.entries(files)) console.log(String(r.tPrimitives).padStart(4), String(r.hex).padStart(3), String(r.rgba).padStart(3), String(r.dsTokens).padStart(4), " font", r.offScaleFont.join(",") || "-", "| radius", r.offScaleRadius.join(",") || "-", "| space", r.offScaleSpace.join(",") || "-", " ", path.basename(f));
for (const t of out.tMap) console.log(`T.${t.key} ×${t.count}: ` + t.usage.map((u) => `${u.use} ${u.n} → ${u.tokens[0] || "no token (" + (t.primitive || "no primitive") + ")"}`).join("; "));
console.log("hex:", out.hexMap.map((t) => `${t.hex}×${t.count}→${t.tokens[0] || t.primitive || "none"}`).join(", "));
