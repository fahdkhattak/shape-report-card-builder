/* Renders the Stories explainer (explainer.html, a pure function of time) to an MP4.
   Needs the dev server running (npm run dev in the repo root) and Google Chrome installed.
   Run from this folder: npm install && npm run render
   Output: src/assets/video/stories-explainer.mp4 + stories-explainer-poster.jpg */
import puppeteer from "puppeteer-core";
import ffmpegPath from "ffmpeg-static";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(root, "src/assets/video");
const frames = path.join(here, "frames");
const URL = process.env.EXPLAINER_URL || "http://localhost:5173/explainer.html";
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FPS = 30;
const POSTER_AT = 8.0; // the fan of Stories

if (!existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}. Set CHROME_PATH.`);
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars", "--force-device-scale-factor=1"] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: "networkidle0" });
await page.waitForFunction("window.__ready === true", { timeout: 30000 });
const duration = await page.evaluate("window.__duration");
const total = Math.round(duration * FPS);
console.log(`Rendering ${total} frames (${duration}s @ ${FPS}fps)`);

const shot = async (t, file) => {
  await page.evaluate((x) => window.__seek(x), t);
  await new Promise((r) => setTimeout(r, 30));
  await page.screenshot({ path: file, type: "jpeg", quality: 92 });
};

for (let i = 0; i < total; i++) {
  await shot(i / FPS, path.join(frames, `f${String(i).padStart(4, "0")}.jpg`));
  if (i % 60 === 0) console.log(`  ${i}/${total}`);
}
await shot(POSTER_AT, path.join(out, "stories-explainer-poster.jpg"));
await browser.close();

const mp4 = path.join(out, "stories-explainer.mp4");
const r = spawnSync(ffmpegPath, [
  "-y", "-framerate", String(FPS), "-i", path.join(frames, "f%04d.jpg"),
  "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow",
  "-movflags", "+faststart", "-an", mp4,
], { stdio: "inherit" });
if (r.status !== 0) throw new Error("ffmpeg failed");
rmSync(frames, { recursive: true, force: true });
console.log(`Wrote ${mp4}`);
