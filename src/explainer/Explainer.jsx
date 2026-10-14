import { useLayoutEffect, useRef, useState } from "react";
import { STORIES } from "../components/widgetbuilder/storyCatalog.jsx";
import { overallSubject, dimensionSubject } from "../lib/scopeSubject.js";
import { ScopeCard, ScopeCardTitle } from "../components/scope/stories/StoryCard.jsx";
import { ActionsLayer } from "../components/scope/stories/ActionStories.jsx";
import logo from "../assets/shape-logo.svg";

/* ================================================================== */
/* THE STORIES EXPLAINER: a 30-second motion piece, 1920 by 1080, 30fps.  */
/* A pure function of time (t, in seconds), so frames can be rendered in    */
/* any order. Every Story you see is the real component, drawn from the     */
/* real data, so the video can't drift from the product.                     */
/*   0.0  Every score has a story.                                          */
/*   3.6  SHAPE turns it into Stories.        (a fan of real Stories)        */
/*   8.5  One question each.                  (six questions, six Stories)   */
/*  21.0  Show it your way.                   (the Show as menu)            */
/*  26.6  SHAPE Stories. See where you stand. Know where to look.            */
/* Copy follows the SHAPE Voice and Language Guide (UK English, no em       */
/* dashes, short sentences).                                                */
/* ================================================================== */
export const DURATION = 30;

const C = { bg: "#120f10", text: "#F9F8F7", dim: "rgba(249,248,247,0.62)", faint: "rgba(249,248,247,0.14)", accent: "#00A9EB", sky: "#16C1FF", violet: "#B26BFF" };
const clamp = (x) => Math.min(1, Math.max(0, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutBack = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;
const FONT = '"IBM Plex Sans", system-ui, sans-serif';
const grad = { background: `linear-gradient(90deg, ${C.sky}, ${C.violet})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" };

/* ---- the real Stories ---------------------------------------------------------------------------------------- */
const overall = overallSubject();
const culture = dimensionSubject("Corporate Culture");
const story = (id) => STORIES.find((s) => s.id === id);
const draw = (id, subject, ctx) => story(id).render(subject, ctx || { stories: [id] });
const CARDS = {
  summary: () => draw("summary", overall),
  meaning: () => draw("meaning", overall),
  breakdown: () => draw("breakdown", overall),
  diagnostic: () => draw("diagnostic", overall),
  composition: () => draw("composition", overall),
  trend: () => draw("trend", overall),
  actions: () => (
    <ScopeCard>
      <ScopeCardTitle>Actions You Can Take</ScopeCardTitle>
      <ActionsLayer drivers={overall.drivers} selected={overall.drivers[0]} />
    </ScopeCard>
  ),
};
const FORMS = [["radar", "Radar"], ["bars", "Bars"], ["list", "List"], ["zones", "Zones"]];
/* When each form takes over in "Show it your way" (the chip lights and the Story cross-fades at the same moment). */
const FB = [21.9, 23.1, 24.3, 25.5];

/* A real Story, drawn once at its normal 808px and moved and scaled by the timeline. `fit` caps its size on screen. */
function Card({ node, x = 0, y = 0, s = 1, r = 0, o = 1, z = 0, fit = { w: 960, h: 860, max: 1.2 } }) {
  const ref = useRef(null);
  const [h, setH] = useState(600);
  useLayoutEffect(() => {
    const measure = () => ref.current && setH(ref.current.offsetHeight || 600);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ref.current);
    const t = setTimeout(measure, 800);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);
  const base = Math.min(fit.max, fit.w / 808, fit.h / h);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 808, zIndex: z, opacity: o, visibility: o <= 0.001 ? "hidden" : "visible", transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${r}deg) scale(${base * s})`, transformOrigin: "50% 50%", filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.45))", fontFamily: FONT }}>
      <div ref={ref} style={{ borderRadius: 18 }}>{node}</div>
    </div>
  );
}

/* A word that rises out of a mask. */
function Word({ children, p, style }) {
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.16em", marginBottom: "-0.16em", marginRight: "0.26em" }}>
      <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 112}%)`, opacity: p > 0.001 ? 1 : 0, ...style }}>{children}</span>
    </span>
  );
}
const H1 = { margin: 0, fontFamily: FONT, fontWeight: 600, fontSize: 148, lineHeight: 1.04, letterSpacing: "-0.045em", color: C.text };
const SUB = { margin: 0, fontFamily: FONT, fontWeight: 400, fontSize: 40, lineHeight: 1.35, letterSpacing: "-0.01em", color: C.dim };

/* ---- scenes -------------------------------------------------------------------------------------------------- */
function Background({ t }) {
  const orb = (x, y, d, col, a, ph) => <div style={{ position: "absolute", left: x + Math.sin(t * 0.35 + ph) * 90, top: y + Math.cos(t * 0.28 + ph) * 70, width: d, height: d, borderRadius: "50%", background: col, opacity: a, filter: "blur(120px)" }} />;
  const pulse = 1 + 0.35 * Math.max(0, Math.sin(((t - 26.6) / 3.4) * Math.PI)) * (t > 26.6 ? 1 : 0);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: C.bg }}>
      {orb(-200, -240, 900, C.accent, 0.34 * pulse, 0)}
      {orb(1180, 520, 980, "#7B3FE4", 0.28 * pulse, 2)}
      {orb(520, 760, 760, "#0E8C4F", 0.12, 4)}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(18,15,16,0) 35%, rgba(18,15,16,0.72) 100%)" }} />
    </div>
  );
}

function Intro({ t }) {
  const out = easeIn(prog(t, 3.0, 3.6));
  if (t > 3.7) return null;
  const line = (words, start, gradLast) => words.map((w, i) => <Word key={w} p={easeOut(prog(t, start + i * 0.13, start + i * 0.13 + 0.7))} style={gradLast && i === words.length - 1 ? grad : undefined}>{w}</Word>);
  const u = easeInOut(prog(t, 1.7, 2.6));
  return (
    <div style={{ position: "absolute", left: 160, top: 300, opacity: 1 - out, transform: `translateY(${-out * 60}px)` }}>
      <h1 style={H1}>{line(["Every", "score"], 0.3)}<br />{line(["has", "a", "story."], 0.75, true)}</h1>
      <div style={{ marginTop: 34, height: 8, width: 520 * u, borderRadius: 4, background: `linear-gradient(90deg, ${C.sky}, ${C.violet})`, opacity: u > 0 ? 1 : 0 }} />
    </div>
  );
}

const DECK = [
  { id: "composition", x: -190, y: -230, r: -7, s: 0.52, d: 0 },
  { id: "diagnostic", x: 215, y: -200, r: 6, s: 0.5, d: 0.2 },
  { id: "breakdown", x: 10, y: 40, r: -2, s: 0.62, d: 0.4 },
  { id: "meaning", x: -215, y: 300, r: 5, s: 0.6, d: 0.6 },
  { id: "summary", x: 200, y: 330, r: -5, s: 0.62, d: 0.8 },
];
function Fan({ t }) {
  const a = 3.6, b = 8.5;
  const out = easeIn(prog(t, 7.8, 8.5));
  const text = easeOut(prog(t, 3.9, 4.8));
  const visible = t > a - 0.1 && t < b + 0.05;
  return (
    <div style={{ position: "absolute", inset: 0, visibility: visible ? "visible" : "hidden" }}>
      <div style={{ position: "absolute", left: 160, top: 330, opacity: 1 - out, transform: `translateY(${-out * 50}px)` }}>
        <h1 style={{ ...H1, fontSize: 120 }}>{["SHAPE", "turns", "it"].map((w, i) => <Word key={w} p={easeOut(prog(t, 3.8 + i * 0.12, 4.6 + i * 0.12))}>{w}</Word>)}<br />{["into"].map((w) => <Word key={w} p={easeOut(prog(t, 4.2, 5))}>{w}</Word>)}<Word p={easeOut(prog(t, 4.35, 5.15))} style={grad}>Stories.</Word></h1>
        <p style={{ ...SUB, marginTop: 36, width: 720, opacity: text, transform: `translateY(${(1 - text) * 24}px)` }}>Short, plain answers you can read in seconds.</p>
      </div>
      <div style={{ position: "absolute", left: 1000, top: 0, width: 760, height: 1080 }}>
        {DECK.map((c, k) => {
          const e = easeOutBack(prog(t, 3.9 + c.d, 4.9 + c.d));
          const fl = Math.sin(t * 1.3 + k * 1.7) * 9 * prog(t, 5, 5.6);
          return <Card key={c.id} node={CARDS[c.id]()} x={c.x} y={lerp(1100, c.y, e) + fl - out * 900} r={c.r + (1 - e) * 14} s={c.s * (0.9 + 0.1 * e)} o={clamp(e * 3) * (1 - out)} z={k + 1} fit={{ w: 960, h: 900, max: 1.2 }} />;
        })}
      </div>
    </div>
  );
}

const QS = [
  { q: ["How is it", "doing?"], fam: "Insight Summary", card: "summary" },
  { q: ["What is it", "made of?"], fam: "Breakdown", card: "breakdown" },
  { q: ["Where should", "I look?"], fam: "Diagnostic", card: "diagnostic" },
  { q: ["Who is", "in it?"], fam: "Composition", card: "composition" },
  { q: ["How has it", "moved?"], fam: "Trend", card: "trend" },
  { q: ["What can", "I do?"], fam: "Actions", card: "actions" },
];
const Q0 = 8.5, QD = 2.08;
function Questions({ t }) {
  if (t < Q0 - 0.2 || t > Q0 + QS.length * QD + 0.2) return null;
  const kick = easeOut(prog(t, 8.5, 9.1)) * (1 - easeIn(prog(t, 20.5, 21)));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 160, top: 150, opacity: kick, transform: `translateY(${(1 - kick) * 16}px)`, ...SUB, fontSize: 30, letterSpacing: "0.02em" }}>Each Story answers one question.</div>
      {QS.map((it, i) => {
        const s = Q0 + i * QD;
        const vis = t > s - 0.05 && t < s + QD + 0.05;
        const e = easeOutBack(prog(t, s, s + 0.6)), ex = easeIn(prog(t, s + QD - 0.38, s + QD));
        const ee = easeOut(prog(t, s, s + 0.45));
        return (
          <div key={it.card} style={{ position: "absolute", inset: 0, visibility: vis ? "visible" : "hidden" }}>
            <div style={{ position: "absolute", left: 160, top: 340, opacity: ee * (1 - ex), transform: `translateY(${(1 - ee) * 70 - ex * 60}px)` }}>
              <h2 style={{ ...H1, fontSize: 132 }}>{it.q[0]}<br /><span style={grad}>{it.q[1]}</span></h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginTop: 40, padding: "12px 26px 12px 18px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: `1px solid ${C.faint}`, fontFamily: FONT, fontSize: 30, fontWeight: 500, color: C.text }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: `linear-gradient(135deg, ${C.sky}, ${C.violet})` }} />{it.fam}
              </div>
            </div>
            <div style={{ position: "absolute", left: 940, top: 70, width: 920, height: 940 }}>
              <Card node={CARDS[it.card]()} x={lerp(170, 0, e) - ex * 120} y={lerp(150, 0, e) - ex * 70} r={(1 - e) * 3} s={lerp(0.9, 1, e) * (1 - ex * 0.05)} o={clamp(e * 3) * (1 - ex)} fit={{ w: 900, h: 880, max: 1.15 }} />
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 160, top: 930, display: "flex", gap: 12, opacity: kick }}>
        {QS.map((_, i) => { const on = t >= Q0 + i * QD && t < Q0 + (i + 1) * QD; return <div key={i} style={{ width: on ? 56 : 14, height: 14, borderRadius: 7, background: on ? `linear-gradient(90deg, ${C.sky}, ${C.violet})` : "rgba(255,255,255,0.22)" }} />; })}
      </div>
    </div>
  );
}

function Forms({ t }) {
  const a = 21, b = 26.9;
  if (t < a - 0.1 || t > b + 0.1) return null;
  const out = easeIn(prog(t, 26.2, 26.9));
  const enter = easeOutBack(prog(t, 21.3, 22.1));
  const idx = t < FB[1] ? 0 : t < FB[2] ? 1 : t < FB[3] ? 2 : 3;
  const tb = easeOut(prog(t, 21.9, 22.6));
  const form = FORMS[Math.min(idx, 3)];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 160, top: 280, transform: `translateY(${-out * 40}px)` }}>
        <h1 style={H1}>{["Show", "it"].map((w, i) => <Word key={w} p={easeOut(prog(t, 21.1 + i * 0.12, 21.9 + i * 0.12))}>{w}</Word>)}<br />{["your"].map((w) => <Word key={w} p={easeOut(prog(t, 21.35, 22.1))}>{w}</Word>)}<Word p={easeOut(prog(t, 21.5, 22.25))} style={grad}>way.</Word></h1>
        <p style={{ ...SUB, marginTop: 36, width: 700, opacity: easeOut(prog(t, 21.9, 22.6)) }}>Pick the form that fits the question.</p>
        <div style={{ display: "flex", gap: 14, marginTop: 52, opacity: easeOut(prog(t, 22.1, 22.8)) }}>
          {FORMS.map(([id, label], i) => { const on = i === idx && t >= 21.9; return <span key={id} style={{ fontFamily: FONT, fontSize: 32, fontWeight: 600, padding: "14px 30px", borderRadius: 999, color: on ? "#120f10" : C.text, background: on ? `linear-gradient(90deg, ${C.sky}, ${C.violet})` : "rgba(255,255,255,0.08)", border: `1px solid ${on ? "transparent" : C.faint}`, transform: `scale(${on ? 1.06 : 1})` }}>{label}</span>; })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 940, top: 70, width: 920, height: 940 }}>
        {FORMS.map(([id], i) => {
          // Each form is on screen from its boundary to the next one, cross-fading over 0.3s either side of the cut.
          const start = FB[i], end = i === 3 ? 26.9 : FB[i + 1];
          const fadeIn = i === 0 ? easeOut(prog(t, 21.3, 21.8)) : prog(t, start - 0.15, start + 0.15);
          const fadeOut = i === 3 ? 1 : 1 - prog(t, end - 0.15, end + 0.15);
          return <Card key={id} node={draw("breakdown", culture, { stories: ["breakdown"], options: { form: id } })} x={lerp(140, 0, enter)} y={lerp(120, 0, enter)} s={lerp(0.92, 1, enter)} o={fadeIn * fadeOut * Math.min(1, enter * 3)} fit={{ w: 900, h: 840, max: 1.1 }} />;
        })}
        <div style={{ position: "absolute", left: "50%", top: 20, transform: `translate(-50%, ${(1 - tb) * -20}px)`, opacity: tb, display: "flex", alignItems: "center", gap: 14, background: "#231F20", color: "#fff", borderRadius: 14, padding: "12px 20px", fontFamily: FONT, fontSize: 24, whiteSpace: "nowrap", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", zIndex: 20 }}>
          <span style={{ opacity: 0.85 }}>Breakdown</span>
          <span style={{ background: "rgba(255,255,255,0.14)", borderRadius: 9, padding: "6px 14px", fontWeight: 500 }}>Show as {form[1]} ▾</span>
          <span style={{ opacity: 0.8, letterSpacing: 8 }}>↑ ↓ ⧉ ✕</span>
        </div>
      </div>
    </div>
  );
}

function Outro({ t }) {
  if (t < 26.5) return null;
  const e = easeOutBack(prog(t, 26.7, 27.6));
  const w = easeOut(prog(t, 27.3, 28.1));
  const tag = easeOut(prog(t, 27.9, 28.7));
  const fade = easeInOut(prog(t, 29.45, 30));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", opacity: 1 - fade }}>
      <div style={{ width: 210, height: 210, borderRadius: 58, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${lerp(0.4, 1, e)})`, opacity: clamp(e * 2), boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}><img src={logo} alt="" style={{ height: 124 }} /></div>
      <h1 style={{ ...H1, fontSize: 170, marginTop: 40, opacity: w, transform: `translateY(${(1 - w) * 40}px)` }}>SHAPE <span style={grad}>Stories</span></h1>
      <p style={{ ...SUB, fontSize: 48, marginTop: 30, color: C.text, opacity: tag * 0.85, transform: `translateY(${(1 - tag) * 24}px)` }}>See where you stand. Know where to look.</p>
    </div>
  );
}

export default function Explainer({ t }) {
  const logoIn = easeOut(prog(t, 0.2, 0.9)) * (t < 26.4 ? 1 : 1 - easeIn(prog(t, 26.4, 26.9)));
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, overflow: "hidden", fontFamily: FONT, background: C.bg }}>
      <Background t={t} />
      <div style={{ position: "absolute", left: 80, top: 56, width: 64, height: 64, borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: logoIn, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}><img src={logo} alt="" style={{ height: 36 }} /></div>
      <Intro t={t} />
      <Fan t={t} />
      <Questions t={t} />
      <Forms t={t} />
      <Outro t={t} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width: 1920, height: 6, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${(t / DURATION) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.sky}, ${C.violet})` }} />
      </div>
    </div>
  );
}
