// Builds the shareable CBI WXI dashboard page: one self-contained HTML file (the report code, its data, the six original
// page images as data URIs, and the notes), with React loaded from cdnjs. Publish the output as an Artifact.
//   node scripts/share/build-cbi-wxi.mjs [out.html]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.resolve(process.argv[2] || path.join(root, "dist-share/wxi-site-dashboard.html"));
const tmp = path.join(path.dirname(out), ".wxi-build");

await build({
  root,
  configFile: false,
  logLevel: "warn",
  esbuild: { jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment", jsxInject: `import React from "react"` },
  build: {
    outDir: tmp,
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    lib: { entry: path.join(root, "src/components/dashboards/share/CbiWxiShare.jsx"), formats: ["iife"], name: "WxiShare", fileName: () => "app.js" },
    rollupOptions: { external: ["react", "react-dom", "react-dom/client"], output: { globals: { react: "React", "react-dom": "ReactDOM", "react-dom/client": "ReactDOM" } } },
    minify: true,
  },
});

const js = fs.readFileSync(path.join(tmp, "app.js"), "utf8").replace(/<\/script/gi, "<\\/script");
const html = `<title>WXI Site Dashboard</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400&display=swap">
<style>
/* Layout: a review sheet. Header with the version switch, page tabs, then the Power BI canvas (scaled to the column) beside
   the notes; the notes stack under the canvas on narrow screens. The canvas keeps the report's own light theme. */
:root {
  --bg: #eceef3; --surface: #ffffff; --ink: #1d2130; --ink-2: #4a5165; --ink-3: #767d90; --line: #dde0e8;
  --accent: #24317e; --accent-soft: #e7eaf7; --on-accent: #ffffff; --shadow: 0 1px 2px rgba(29,33,48,.08), 0 10px 30px rgba(29,33,48,.10);
  --font: "IBM Plex Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #11131a; --surface: #1a1d27; --ink: #eceef4; --ink-2: #b7bccb; --ink-3: #8a90a2; --line: #2b2f3d;
  --accent: #a3adf2; --accent-soft: #262c4b; --on-accent: #11131a; --shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35); color-scheme: dark; } }
:root[data-theme="dark"] {
  --bg: #11131a; --surface: #1a1d27; --ink: #eceef4; --ink-2: #b7bccb; --ink-3: #8a90a2; --line: #2b2f3d;
  --accent: #a3adf2; --accent-soft: #262c4b; --on-accent: #11131a; --shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35); color-scheme: dark; }
body { background: var(--bg); color: var(--ink); font-family: var(--font); font-size: 14px; }
.shell { max-width: 1680px; margin: 0 auto; padding-block: 24px 32px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 16px; }
.top { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 24px; }
.brand { min-width: 0; max-width: 72ch; }
.eyebrow { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); }
h1 { margin: 4px 0 0; font-size: clamp(24px, 3vw, 32px); font-weight: 700; letter-spacing: -.01em; text-wrap: balance; }
.lede { margin: 8px 0 0; color: var(--ink-2); line-height: 1.5; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.check { display: flex; align-items: center; gap: 8px; color: var(--ink-2); font-size: 13px; cursor: pointer; }
.seg { display: inline-flex; padding: 3px; gap: 2px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); }
.seg button { height: 32px; padding: 0 16px; border: 0; border-radius: 999px; background: transparent; color: var(--ink-2); font: 600 13px var(--font); cursor: pointer; }
.seg button.on { background: var(--accent); color: var(--on-accent); }
.tabs { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 2px; border-bottom: 1px solid var(--line); }
.tab { flex-shrink: 0; height: 34px; padding: 0 12px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--ink-2); font: 500 13px var(--font); cursor: pointer; white-space: nowrap; }
.tab.on { color: var(--ink); font-weight: 600; border-bottom-color: var(--accent); }
.tab .num { color: var(--ink-3); margin-right: 6px; font-variant-numeric: tabular-nums; }
.muted { color: var(--ink-3); font-weight: 400; }
.body { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.stagewrap { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.stagemeta { font-size: 12px; color: var(--ink-3); }
.stage { width: 100%; min-width: 0; }
.canvas { overflow: hidden; border-radius: 6px; box-shadow: var(--shadow); background: #fff; max-width: 100%; }
.notes { min-width: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px 22px; position: sticky; top: calc(env(safe-area-inset-top, 0px) + 16px); max-height: calc(100vh - 32px); overflow-y: auto; }
.notes h2 { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-3); }
.notes h3 { margin: 14px 0 6px; font-size: 13px; font-weight: 600; color: var(--ink); }
.notes ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; color: var(--ink-2); font-size: 13px; line-height: 1.5; }
.notes hr { border: 0; border-top: 1px solid var(--line); margin: 20px 0 16px; }
.swatches { list-style: none; padding: 0 !important; }
.swatches li { display: flex; align-items: center; gap: 8px; }
.sw { width: 16px; height: 16px; border-radius: 4px; box-shadow: inset 0 0 0 1px var(--line); flex-shrink: 0; }
.swatches code { margin-left: auto; font-family: var(--mono); font-size: 12px; color: var(--ink-3); }
.foot { font-size: 12px; color: var(--ink-3); line-height: 1.5; max-width: 90ch; }
button:focus-visible, input:focus-visible, [role="button"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.pbi-row { border-radius: 6px; margin: 0 -8px; padding-left: 8px !important; padding-right: 8px !important; }
.pbi-row:hover { background: #f3f5fa; }
@media (max-width: 1100px) { .body { grid-template-columns: minmax(0, 1fr); } .notes { position: static; max-height: none; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(out, (Buffer.byteLength(html) / 1024 / 1024).toFixed(2) + " MB");
