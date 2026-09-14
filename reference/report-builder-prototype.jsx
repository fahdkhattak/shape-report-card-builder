import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  MoreHorizontal,
  X,
  Sparkles,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  ArrowLeft,
  Trash2,
  Shuffle,
  Edit3,
  Send,
  Mic,
  Paperclip,
} from "lucide-react";

/* ================================================================== */
/* FORMA TOKENS                                                        */
/* ================================================================== */
const T = {
  gray900: "#1d1a1b",
  gray800: "#231f20",
  gray700: "#504c4d",
  gray500: "#7c7879",
  gray300: "#a5a2a2",
  gray200: "#b4b2b1",
  gray100: "#cecdcc",
  gray75: "#e5e4e3",
  gray50: "#f2f2f2",
  gray25: "#f9f8f7",
  white: "#ffffff",
  accent: "#00a9eb",
  accentBg: "#ebfbff",
  accentBg2: "#dcf5ff",
  green: "#0e8c4f",
  greenStrong: "#0b703f",
  greenBg: "#e1f5ea",
  amber: "#f1a118",
  amberStrong: "#d98d0b",
  amberBg: "#fff6e4",
  red: "#cc2944",
  redStrong: "#a32136",
  redBg: "#fce3e7",
  personalBlue: "#00a9eb",
  teamBlue: "#0096ec",
  amberOrange: "#ff9900",
  lavender: "#a86cff",
  hotPink: "#ffabcf",
  goldenYellow: "#ffd700",
  mintGreen: "#00d998",
  turquoise: "#00ced1",
};
const font = "'IBM Plex Sans', sans-serif";
const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function band(val) {
  if (val >= 70) return { c: T.green, cs: T.greenStrong, bg: T.greenBg };
  if (val >= 40) return { c: T.amber, cs: T.amberStrong, bg: T.amberBg };
  return { c: T.red, cs: T.redStrong, bg: T.redBg };
}

/* ================================================================== */
/* SHARED WIDGET PRIMITIVES                                            */
/* ================================================================== */
function Header({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 13 }}>
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.11px", textTransform: "uppercase", color: T.gray200 }}>
        {title}
      </span>
    </div>
  );
}

function TrendPill({ delta, positive, compact }) {
  const pos = positive ?? delta > 0;
  const c = pos ? T.green : T.red;
  const bg = pos ? T.greenBg : T.redBg;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, borderRadius: 46, padding: "6px 8px", fontSize: 11, fontWeight: 600, color: c, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 8 }}>{pos ? "▲" : "▼"}</span>
      {!compact && (delta !== undefined ? `${delta > 0 ? "+" : ""}${delta} since last round` : "")}
    </span>
  );
}

function BigNumber({ value, unit, size = 64, colorBand }) {
  const b = colorBand ? band(value) : null;
  return (
    <span style={{ fontSize: size, fontWeight: 700, letterSpacing: -size * 0.02, color: b ? b.cs : T.gray800, lineHeight: 1 }}>
      {value}
      {unit && <span style={{ fontSize: 11, fontWeight: 400, color: T.gray900, marginLeft: 4 }}>{unit}</span>}
    </span>
  );
}

function EvidenceSegmentBar({ flourishing, striving, struggling }) {
  const total = flourishing + striving + struggling || 1;
  const fw = (flourishing / total) * 100;
  const sw = ((flourishing + striving) / total) * 100;
  return (
    <div style={{ height: 8, borderRadius: 6, background: T.red, position: "relative", width: "100%" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${sw}%`, background: T.amber, borderRadius: "6px 0 0 6px" }} />
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${fw}%`, background: T.green, borderRadius: "6px 0 0 6px" }} />
    </div>
  );
}

function StatusBreakdown({ flourishing, striving, struggling }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      {[["Flourishing", flourishing, T.greenStrong], ["Striving", striving, T.amberStrong], ["Struggling", struggling, T.redStrong]].map(([label, val, c]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 11, color: T.gray500 }}>{label}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: c }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

function DriverRow({ name, val, ok }) {
  return (
    <div style={{ borderLeft: `2px solid ${ok ? T.green : T.red}`, paddingLeft: 6, display: "flex", justifyContent: "space-between", alignItems: "center", height: 20 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: ok ? T.greenStrong : T.redStrong, flexShrink: 0, marginLeft: 8 }}>{val}</span>
    </div>
  );
}

function MiniBarChart({ rows, colors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {rows.map(([label, pct], i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: T.gray500, width: 46, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          <div style={{ flex: 1, height: 8, background: T.gray75, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 8, width: `${pct}%`, background: colors[i % colors.length], borderRadius: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ points, w = 130, h = 46 }) {
  const max = 100;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={T.accent} strokeWidth="2" />
      {points.map((p, i) => <circle key={i} cx={i * step} cy={h - (p / max) * h} r="3" fill={T.accent} />)}
    </svg>
  );
}

function Treemap({ tiles }) {
  const colors = [T.personalBlue, T.amberOrange, T.lavender];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", height: "100%" }}>
      <div style={{ background: colors[0], borderRadius: 8, padding: 6, color: T.white, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>{tiles[0][0]}</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{tiles[0][1]}</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {tiles.slice(1).map((t, i) => (
          <div key={i} style={{ flex: 1, background: colors[i + 1], borderRadius: 8, padding: 6, color: T.white }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusRing({ status }) {
  const c = status === "Flourishing" ? T.green : status === "Striving" ? T.amber : T.red;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ width: 64, height: 64, borderRadius: 9999, border: `6px solid ${c}22`, borderTopColor: c, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, borderRadius: 9999, background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🙂</div>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: c }}>{status}</span>
    </div>
  );
}

function ScatterMini({ topicA, topicB, r }) {
  const pts = Array.from({ length: 12 }).map(() => {
    const x = rand(10, 95);
    const noise = rand(-20, 20);
    const y = Math.max(5, Math.min(95, r < 0 ? 100 - x + noise : x + noise));
    return [x, y];
  });
  const w = 150, h = 90;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1="0" y1={h} x2={w} y2={h} stroke={T.gray100} strokeWidth="1" />
        <line x1="0" y1="0" x2="0" y2={h} stroke={T.gray100} strokeWidth="1" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={(x / 100) * w} cy={h - (y / 100) * h} r="3.5" fill={r < 0 ? T.red : T.green} opacity="0.75" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.gray300 }}>
        <span>{topicA}</span>
        <span>{topicB} →</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* FIXED LIBRARY FAMILIES                                              */
/* ================================================================== */
const FAMILIES = [
  { id: "your-score", name: "Your Score", category: "Score", blurb: "Your overall wellbeing score at a glance.", forms: [{ size: "1x1", label: "Plain" }, { size: "2x2", label: "With breakdown" }] },
  { id: "org-status", name: "Org Status", category: "Score", blurb: "See where your organisation stands right now.", forms: [{ size: "1x1", label: "Status only" }, { size: "2x2", label: "Status + breakdown" }] },
  { id: "explorers", name: "Explorers", category: "Areas to Focus", blurb: "Identify the areas holding performance back.", forms: [{ size: "2x2", label: "Ranked list" }] },
  { id: "score-history", name: "Score History", category: "Score over time", blurb: "Track how your score has changed over rounds.", forms: [{ size: "1x1", label: "Sparkline" }] },
  { id: "enps", name: "ENPS", category: "Score", blurb: "Employee net promoter score for this round.", forms: [{ size: "1x1", label: "Score + bar" }] },
  { id: "areas-focus", name: "Areas to Focus", category: "Areas to Focus", blurb: "See the area that needs your attention most.", forms: [{ size: "1x1", label: "Top concern" }] },
  { id: "avg-gender", name: "Avg. Score: Gender", category: "Explorers Results", blurb: "Compare average scores across gender groups.", forms: [{ size: "1x1", label: "Bar chart" }] },
  { id: "popular-responses", name: "Popular Responses", category: "Explorers Results", blurb: "The most common open-text themes this round.", forms: [{ size: "1x1", label: "Treemap" }] },
  { id: "time-impact", name: "Time Impact", category: "Health Age", blurb: "Estimated hours gained or lost per year.", forms: [{ size: "1x1", label: "Hours/annum" }] },
];
function familyById(id) { return FAMILIES.find((f) => f.id === id); }
let idCounter = 1;
const nextId = () => idCounter++;

/* ================================================================== */
/* FIXED-FAMILY WIDGET BODY (Library-sourced)                          */
/* ================================================================== */
function WidgetBody({ familyId, formIndex }) {
  switch (familyId) {
    case "your-score": {
      const val = 87;
      if (formIndex === 0) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <BigNumber value={val} colorBand />
              <TrendPill delta={9} positive />
            </div>
            <span style={{ fontSize: 11, color: T.gray900 }}>DEC 10, 2022</span>
          </div>
        );
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <BigNumber value={val} colorBand />
            <TrendPill delta={9} positive />
          </div>
          <EvidenceSegmentBar flourishing={5} striving={3} struggling={4} />
          <span style={{ fontSize: 11, color: T.gray500 }}>
            Across the <b style={{ color: T.gray900 }}>12</b> Explorers, <b style={{ color: T.greenStrong }}>5</b> are Flourishing,{" "}
            <b style={{ color: T.amberStrong }}>3</b> are Striving, and <b style={{ color: T.redStrong }}>4</b> are Struggling.
          </span>
        </div>
      );
    }
    case "org-status":
      if (formIndex === 0)
        return (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
            <StatusRing status="Striving" />
            <EvidenceSegmentBar flourishing={35} striving={110} struggling={24} />
          </div>
        );
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
          <StatusRing status="Flourishing" />
          <StatusBreakdown flourishing={155} striving={20} struggling={24} />
        </div>
      );
    case "explorers":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "hidden" }}>
          {[["Life Outside Work", 88, true], ["Physical Health", 86, true], ["Soft Work Environment", 76, false], ["Business Essentials", 70, false], ["Corporate Culture", 44, false], ["Job Satisfaction", 32, false]].map(([name, val, ok]) => (
            <DriverRow key={name} name={name} val={val} ok={ok} />
          ))}
          <span style={{ fontSize: 11, color: T.gray300, borderLeft: `2px solid ${T.gray200}`, paddingLeft: 6 }}>6 more Explorers</span>
        </div>
      );
    case "score-history":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <TrendPill delta={9} positive />
          <Sparkline points={[60, 68, 65, 83]} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.gray300 }}><span>R2</span><span>R3</span><span>R4</span></div>
        </div>
      );
    case "enps":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}><BigNumber value={60} size={48} /><TrendPill compact positive={false} /></div>
          <EvidenceSegmentBar flourishing={74} striving={35} struggling={132} />
        </div>
      );
    case "areas-focus":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}><BigNumber value={31} size={40} /><TrendPill compact positive={false} /></div>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.gray900 }}>South Asian ethnicity</span>
        </div>
      );
    case "avg-gender":
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <MiniBarChart rows={[["Male", 44], ["Female", 59], ["Other", 84], ["Prefer..", 49]]} colors={[T.teamBlue, T.hotPink, T.goldenYellow, T.gray200]} />
        </div>
      );
    case "popular-responses":
      return <div style={{ flex: 1 }}><Treemap tiles={[["Ergonomics", 18], ["", 16], ["", 14]]} /></div>;
    case "time-impact":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><BigNumber value={25} size={40} unit="hrs" /><TrendPill compact positive={false} /></div>
          <span style={{ fontSize: 11, color: T.gray900 }}>per annum</span>
        </div>
      );
    default:
      return <div style={{ flex: 1 }} />;
  }
}

/* ================================================================== */
/* GENERATIVE ENGINE — chat-created widgets (not fixed to Library)     */
/* ================================================================== */
const TOPIC_LEXICON = [
  ["sleep", "Sleep Quality"], ["stress", "Stress Levels"], ["nutrition", "Nutrition"], ["exercise", "Exercise"],
  ["workload", "Workload"], ["manager", "Manager Support"], ["culture", "Corporate Culture"],
  ["commitment", "Employee Commitment"], ["satisfaction", "Job Satisfaction"], ["life outside", "Life Outside Work"],
  ["psychological", "Psychological Health"], ["coworker", "Coworker Dynamics"], ["burnout", "Burnout Risk"],
  ["engagement", "Employee Engagement"], ["onboarding", "Onboarding Experience"], ["remote", "Work Model"],
  ["gender", "Gender"], ["tenure", "Tenure"], ["location", "Location"], ["wellbeing", "Overall Wellbeing"],
  ["flourish", "Flourishing"], ["environment", "Work Environment"], ["diversity", "Diversity"], ["pay", "Compensation"],
];

function extractTopics(prompt) {
  const p = prompt.toLowerCase();
  const found = TOPIC_LEXICON.filter(([kw]) => p.includes(kw)).map(([, label]) => label);
  return [...new Set(found)];
}

function titleFromPrompt(prompt, topics) {
  if (topics.length) return topics.slice(0, 2).join(" & ");
  const words = prompt.trim().split(/\s+/).filter((w) => !["show", "me", "the", "a", "for", "of", "in", "on", "about", "my", "our"].includes(w.toLowerCase()));
  return words.slice(0, 4).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "Custom Insight";
}

const EXPLANATIONS = {
  scatter: (p) => `Shown as a scatter plot because you asked to compare two topics — this reveals whether ${p.topicA} and ${p.topicB} move together.`,
  trend: () => `A line view surfaces how this has moved round to round, so a change over time is easy to spot.`,
  bar: () => `A bar comparison works best here since you're looking across a few distinct groups side by side.`,
  ranking: () => `Ranked so the drivers needing attention first rise straight to the top of the list.`,
  status: () => `A quick status read — good for a single at-a-glance check rather than a detailed breakdown.`,
  insight: () => `A generated pattern from the data — useful when the connection between two things isn't obvious from a single chart.`,
  metric: () => `A single clear number, best when there's one figure that matters most right now.`,
};

function buildSpec(vizType, topics, prompt) {
  const t = (i, fallback) => topics[i] || fallback;
  let spec;
  switch (vizType) {
    case "scatter": {
      const a = t(0, "Sleep Quality"), b = t(1, "Stress Levels");
      const r = (Math.random() * 1.4 - 0.7).toFixed(2);
      spec = { vizType, size: "2x2", title: `${a} vs. ${b}`, payload: { topicA: a, topicB: b, r: Number(r) } };
      break;
    }
    case "trend": {
      const topic = t(0, "Score");
      const pts = [rand(40, 70)];
      for (let i = 0; i < 3; i++) pts.push(Math.max(10, Math.min(95, pts[pts.length - 1] + rand(-12, 15))));
      spec = { vizType, size: "1x1", title: `${topic} Trend`, payload: { points: pts } };
      break;
    }
    case "bar": {
      const useTopics = topics.length >= 2;
      const cats = useTopics ? topics.slice(0, 4) : ["Onsite", "Remote", "Hybrid", "Contract"];
      const rows = cats.map((c) => [c.length > 10 ? c.slice(0, 10) + "…" : c, rand(30, 95)]);
      const title = useTopics ? `Comparing ${topics.slice(0, 2).join(" & ")}` : "Score by Work Model";
      spec = { vizType, size: "2x2", title, payload: { rows } };
      break;
    }
    case "ranking": {
      const pool = topics.length ? topics : ["Life Outside Work", "Corporate Culture", "Job Satisfaction", "Manager Support", "Physical Health"];
      const rows = pool.slice(0, 5).map((name) => [name, rand(28, 92), Math.random() > 0.35]);
      rows.sort((a, b) => b[1] - a[1]);
      spec = { vizType, size: "2x2", title: topics.length ? `Top Drivers — ${topics.slice(0, 2).join(" & ")}` : "Top Areas to Focus", payload: { rows } };
      break;
    }
    case "status": {
      const status = pick(["Flourishing", "Striving", "Struggling"]);
      spec = { vizType, size: "1x1", title: topics.length ? `${topics[0]} Status` : "Organisation Status", payload: { status } };
      break;
    }
    case "insight": {
      const a = t(0, "Sleep Quality"), b = t(1, "Burnout Risk");
      const mult = (1.5 + Math.random() * 1.5).toFixed(1);
      spec = { vizType, size: "2x2", title: "Did You Know?", payload: { text: `Participants reporting low ${a} are ${mult}x more likely to report high ${b}.`, stat: rand(58, 84) } };
      break;
    }
    case "metric":
    default: {
      const topic = t(0, "Overall Score");
      spec = { vizType: "metric", size: "1x1", title: topic, payload: { value: rand(45, 92), delta: rand(-8, 12) } };
    }
  }
  spec.explanation = EXPLANATIONS[spec.vizType](spec.payload);
  return spec;
}

function generateVariants(prompt) {
  const p = prompt.toLowerCase();
  const topics = extractTopics(prompt);
  const hasCompare = /compare|vs\.?|versus|correlat|relationship|against/.test(p);
  const hasTrend = /trend|over time|history|change|month|quarter|improv|declin/.test(p);
  const hasBreakdown = /breakdown|distribution|split|composition|across|by (team|department|gender|location)/.test(p);
  const hasRanking = /top|best|worst|rank|leaderboard|driver/.test(p);
  const hasStatus = /flourish|struggl|striv|mood|sentiment|status/.test(p);

  let primary;
  if (hasCompare && topics.length >= 2) primary = "scatter";
  else if (hasTrend) primary = "trend";
  else if (hasBreakdown || topics.length >= 3) primary = "bar";
  else if (hasRanking) primary = "ranking";
  else if (hasStatus) primary = "status";
  else primary = "metric";

  const pool = ["scatter", "trend", "bar", "ranking", "status", "insight", "metric"].filter((v) => v !== primary);
  const secondary = topics.length >= 2 && primary !== "insight" ? "insight" : pick(pool);
  const remaining = pool.filter((v) => v !== secondary);
  const tertiary = pick(remaining);

  const chosen = [...new Set([primary, secondary, tertiary])].slice(0, 3);
  return chosen.map((v) => buildSpec(v, topics, prompt));
}

/* ================================================================== */
/* GENERATED WIDGET BODY RENDERER                                      */
/* ================================================================== */
function GeneratedBody({ spec }) {
  const { vizType, payload } = spec;
  switch (vizType) {
    case "scatter": {
      const b = payload.r < 0 ? T.redStrong : T.greenStrong;
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: b }}>
            {payload.r < -0.4 ? "Strong negative" : payload.r < 0 ? "Weak negative" : payload.r < 0.4 ? "Weak positive" : "Strong positive"} correlation
          </span>
          <ScatterMini topicA={payload.topicA} topicB={payload.topicB} r={payload.r} />
        </div>
      );
    }
    case "trend":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <TrendPill delta={payload.points[payload.points.length - 1] - payload.points[0]} />
          <Sparkline points={payload.points} />
        </div>
      );
    case "bar":
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <MiniBarChart rows={payload.rows} colors={[T.teamBlue, T.hotPink, T.goldenYellow, T.lavender, T.turquoise]} />
        </div>
      );
    case "ranking":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "hidden" }}>
          {payload.rows.map(([name, val, ok]) => <DriverRow key={name} name={name} val={val} ok={ok} />)}
        </div>
      );
    case "status":
      return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><StatusRing status={payload.status} /></div>;
    case "insight":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
          <p style={{ fontSize: 12.5, color: T.gray900, lineHeight: 1.5, margin: 0 }}>{payload.text}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <BigNumber value={payload.stat} size={28} colorBand />
            <span style={{ fontSize: 10, color: T.gray500 }}>confidence score</span>
          </div>
        </div>
      );
    case "metric":
    default:
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <BigNumber value={payload.value} colorBand size={40} />
            <TrendPill delta={payload.delta} />
          </div>
        </div>
      );
  }
}

function sizeToSpan(size) { return size === "2x2" ? { col: 2, row: 2 } : { col: 1, row: 1 }; }
const CELL = 164, GAP = 16;
function pxForSpan(span) { return span === 2 ? CELL * 2 + GAP : CELL; }

/* ================================================================== */
/* WIDGET CARD (canvas instance) — handles both kinds                  */
/* ================================================================== */
function WidgetCard({ widget, onChangeForm, onEdit, onRemove, onRename, dragProps, onOpenModal }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const isLib = widget.kind === "library";
  const family = isLib ? familyById(widget.familyId) : null;
  const size = isLib ? family.forms[widget.formIndex].size : widget.spec.size;
  const span = sizeToSpan(size);
  const defaultTitle = isLib ? family.name : widget.spec.title;
  const title = widget.customTitle || defaultTitle;

  return (
    <div
      {...dragProps}
      onClick={() => onOpenModal(widget)}
      style={{
        gridColumn: `span ${span.col}`,
        gridRow: `span ${span.row}`,
        width: pxForSpan(span.col),
        height: pxForSpan(span.row),
        background: T.white,
        border: `1px solid ${T.gray100}`,
        borderRadius: 18,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        cursor: "pointer",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {renaming ? (
          <input
            autoFocus
            defaultValue={title}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => { onRename(widget.id, e.target.value.trim() || title); setRenaming(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.11px", textTransform: "uppercase", color: T.gray700, border: `1px solid ${T.accent}`, borderRadius: 4, padding: "1px 4px", width: "100%", fontFamily: font }}
          />
        ) : (
          <Header title={title} />
        )}
        <button onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, borderRadius: 6, color: T.gray500, flexShrink: 0 }}>
          <MoreHorizontal size={14} />
        </button>
      </div>

      {isLib ? <WidgetBody familyId={widget.familyId} formIndex={widget.formIndex} /> : <GeneratedBody spec={widget.spec} />}

      {menuOpen && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 34, right: 10, background: T.white, border: `1px solid ${T.gray75}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 6, zIndex: 20, width: 190 }}>
          {isLib && family.forms.length > 1 && (
            <MenuRow icon={<Shuffle size={13} />} label="Change widget" onClick={() => { onChangeForm(widget.id); setMenuOpen(false); }} />
          )}
          <MenuRow icon={<Edit3 size={13} />} label="Rename" onClick={() => { setRenaming(true); setMenuOpen(false); }} />
          <MenuRow icon={<Sparkles size={13} />} label="Edit with AI" onClick={() => { onEdit(widget.id); setMenuOpen(false); }} />
          <MenuRow icon={<Trash2 size={13} />} label="Remove" danger onClick={() => { onRemove(widget.id); setMenuOpen(false); }} />
        </div>
      )}
    </div>
  );
}

function MenuRow({ icon, label, onClick, danger }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: danger ? T.red : T.gray900 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.gray50)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      {icon}{label}
    </div>
  );
}

/* ================================================================== */
/* DETAIL MODAL                                                         */
/* ================================================================== */
function DetailModal({ widget, onClose }) {
  if (!widget) return null;
  const isLib = widget.kind === "library";
  const family = isLib ? familyById(widget.familyId) : null;
  const title = widget.customTitle || (isLib ? family.name : widget.spec.title);
  const category = isLib ? family.category : "AI-generated";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(35,31,32,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: "80vh", overflowY: "auto", background: T.white, borderRadius: 24, padding: 32, fontFamily: font }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>{category}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.gray900, marginTop: 4 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500 }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: T.gray700, marginBottom: 24 }}>
          Get a quick overview and easily compare scores in this interactive graphic. Remember, higher scores are better.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: `1px solid ${T.gray100}`, borderRadius: 18, padding: 16, minHeight: 220, display: "flex", flexDirection: "column", gap: 12 }}>
            <Header title="Your Organisation" />
            {isLib ? <WidgetBody familyId={widget.familyId} formIndex={Math.min(1, family.forms.length - 1)} /> : <GeneratedBody spec={widget.spec} />}
          </div>
          <div style={{ border: `1px solid ${T.gray100}`, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
            <p style={{ fontSize: 13, color: T.gray900, fontWeight: 600 }}>{isLib ? "What this means" : "Why this widget"}</p>
            <p style={{ fontSize: 12, color: T.gray700, lineHeight: 1.5 }}>
              {isLib
                ? "It's operating at peak performance with a strong score. The organisation's core foundations are solid — now it's about scaling excellence and staying ahead."
                : widget.spec.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* LIBRARY PANEL — real "Add Widget" carousel design                   */
/* ================================================================== */
function MiniWidgetPreview({ familyId, formIndex }) {
  return (
    <div style={{ width: 100, height: 100, flexShrink: 0, position: "relative" }}>
      <div style={{ width: 164, height: 164, transform: "scale(0.6098)", transformOrigin: "top left", position: "absolute", top: 0, left: 0, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: 18, padding: 16, boxShadow: "0 4px 10px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box" }}>
        <Header title={familyById(familyId).name} />
        <WidgetBody familyId={familyId} formIndex={formIndex} />
      </div>
    </div>
  );
}

function LibraryPanel({ collapsed, onToggle, onLibraryDragStart }) {
  const [expanded, setExpanded] = useState({ "your-score": true });
  const [query, setQuery] = useState("");
  const scrollRefs = useRef({});

  if (collapsed) {
    return (
      <div style={{ width: 52, borderRight: `1px solid ${T.gray75}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 8, background: T.white }}>
        <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.gray75}`, background: T.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Plus size={16} color={T.gray700} />
        </button>
      </div>
    );
  }

  const filtered = FAMILIES.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ width: 320, borderRight: `1px solid ${T.gray75}`, display: "flex", flexDirection: "column", background: T.white, flexShrink: 0 }}>
      <div style={{ padding: 20, borderBottom: `1px solid ${T.gray100}`, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.gray900 }}>Add Widget</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <MoreHorizontal size={18} color={T.gray700} />
            <button onClick={onToggle} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray700, display: "flex" }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${T.gray100}`, borderRadius: 25, padding: "8px 12px" }}>
          <Search size={16} color={T.gray300} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" style={{ border: "none", outline: "none", fontSize: 13.5, flex: 1, fontFamily: font }} />
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {filtered.map((family) => {
          const isOpen = expanded[family.id];
          return (
            <div key={family.id} style={{ borderBottom: `1px solid ${T.gray75}` }}>
              <div onClick={() => setExpanded((e) => ({ ...e, [family.id]: !e[family.id] }))} style={{ display: "flex", alignItems: "center", gap: 24, padding: "16px 20px", cursor: "pointer" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>{family.name}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: T.gray700, flex: 1 }}>{family.forms.length}</span>
                {isOpen ? <ChevronDown size={16} color={T.gray700} /> : <ChevronRight size={16} color={T.gray700} />}
              </div>
              {isOpen && (
                <div style={{ padding: "0 20px 20px" }}>
                  <p style={{ fontSize: 13, color: T.gray700, margin: "0 0 12px", lineHeight: 1.4 }}>{family.blurb}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => scrollRefs.current[family.id]?.scrollBy({ left: -110, behavior: "smooth" })} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500, flexShrink: 0 }}>
                      <ChevronLeft size={16} />
                    </button>
                    <div ref={(el) => (scrollRefs.current[family.id] = el)} style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
                      {family.forms.map((form, i) => (
                        <div key={i} draggable onDragStart={(e) => onLibraryDragStart(e, family.id, i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 100, flexShrink: 0, cursor: "grab" }}>
                          <MiniWidgetPreview familyId={family.id} formIndex={i} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.gray900, textAlign: "center" }}>{form.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.gray500 }}>{form.size}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => scrollRefs.current[family.id]?.scrollBy({ left: 110, behavior: "smooth" })} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500, flexShrink: 0 }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/* CHAT PRIMITIVES                                                      */
/* ================================================================== */
function Bubble({ mine, children }) {
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "88%", background: mine ? T.gray800 : T.gray50, color: mine ? T.white : T.gray900, borderRadius: mine ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "9px 13px", fontSize: 12.5, lineHeight: 1.4 }}>
        {children}
      </div>
    </div>
  );
}

function ChipRow({ chips, selected, onToggle, multi }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {chips.map((c) => {
        const isOn = selected.includes(c);
        return (
          <button key={c} onClick={() => onToggle(c)} style={{ border: `1px solid ${isOn ? T.accent : T.gray100}`, background: isOn ? T.accentBg : T.white, color: isOn ? T.accent : T.gray900, borderRadius: 9999, padding: "6px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: font }}>
            {isOn && multi && <Check size={11} />}{c}
          </button>
        );
      })}
    </div>
  );
}

const btnPrimarySmall = { display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: T.white, background: T.gray900, border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontFamily: font };
const btnGhostSmall = { display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: T.gray700, background: "transparent", border: `1px solid ${T.gray75}`, borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontFamily: font };

function GeneratedWidgetPreview({ spec, onTitleChange, onApprove, onRegenerate, approveLabel }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(spec.title);

  const commitTitle = () => {
    setEditingTitle(false);
    if (draftTitle.trim() && draftTitle !== spec.title) onTitleChange(draftTitle.trim());
  };

  return (
    <div style={{ border: `1px solid ${T.gray100}`, borderRadius: 14, padding: 12, background: T.white, marginTop: 8 }}>
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        {editingTitle ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === "Enter" && commitTitle()}
            style={{ fontSize: 11.5, fontWeight: 700, color: T.gray900, border: `1px solid ${T.accent}`, borderRadius: 6, padding: "2px 6px", fontFamily: font, flex: 1 }}
          />
        ) : (
          <>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.gray900 }}>
              {spec.title} <span style={{ color: T.gray300, fontWeight: 400 }}>· {spec.size}</span>
            </span>
            <button onClick={() => { setDraftTitle(spec.title); setEditingTitle(true); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray300, display: "flex", padding: 0 }}>
              <Edit3 size={11} />
            </button>
          </>
        )}
      </div>
      <div style={{ border: `1px solid ${T.gray75}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 120 }}>
        <Header title={spec.title} />
        <GeneratedBody spec={spec} />
      </div>
      {spec.explanation && (
        <p style={{ fontSize: 10.5, color: T.gray500, fontStyle: "italic", lineHeight: 1.4, margin: "8px 0 0" }}>{spec.explanation}</p>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button onClick={onApprove} style={btnPrimarySmall}><Check size={12} /> {approveLabel || "Add to canvas"}</button>
        <button onClick={onRegenerate} style={btnGhostSmall}><RefreshCw size={12} /> Regenerate</button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CHAT PANEL                                                          */
/* ================================================================== */
function ChatPanel({ open, onClose, editingWidget, onAddWidget, onReplaceWidget, onCancelEdit }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scoped = !!editingWidget;
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setMessages([]); }, [editingWidget?.id]);

  const send = (text) => {
    const val = text ?? input;
    if (!val.trim()) return;
    const variants = generateVariants(val);
    setMessages((m) => [
      ...m,
      { role: "user", text: val },
      { role: "ai", text: scoped ? `Here's a new version of ${editingWidget.name}.` : "Here's what I came up with — pick one, or ask me to try again.", variants },
    ]);
    setInput("");
  };

  const updateVariantTitle = (msgIndex, variantIndex, newTitle) => {
    setMessages((m) =>
      m.map((msg, i) => (i !== msgIndex ? msg : { ...msg, variants: msg.variants.map((v, vi) => (vi !== variantIndex ? v : { ...v, title: newTitle })) }))
    );
  };

  return (
    <div style={{ position: "fixed", top: 0, right: open ? 0 : -400, width: 392, height: "100%", background: T.white, borderLeft: `1px solid ${T.gray75}`, boxShadow: "-4px 0 24px rgba(0,0,0,0.08)", transition: "right 200ms ease", display: "flex", flexDirection: "column", zIndex: 50, fontFamily: font }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${T.gray75}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>{scoped ? "Editing widget" : "Ask the mascot"}</div>
          {scoped && <div style={{ fontSize: 11, color: T.accent, marginTop: 2 }}>{editingWidget.name}</div>}
        </div>
        <button onClick={() => { onClose(); if (scoped) onCancelEdit(); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500 }}><X size={18} /></button>
      </div>

      {scoped && (
        <div style={{ padding: "12px 16px 0" }}>
          <p style={{ fontSize: 10.5, fontWeight: 600, color: T.gray500, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Currently on canvas</p>
          <div style={{ width: 164, height: 164, border: `1px solid ${T.gray100}`, borderRadius: 18, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, background: T.gray25 }}>
            <Header title={editingWidget.name} />
            {editingWidget.kind === "library" ? (
              <WidgetBody familyId={editingWidget.familyId} formIndex={editingWidget.formIndex} />
            ) : (
              <GeneratedBody spec={editingWidget.spec} />
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.gray900 }}>{scoped ? "What should change?" : "What can I help you with?"}</div>
              <p style={{ fontSize: 12, color: T.gray500, marginTop: 4 }}>
                {scoped ? `Tell me what to change about ${editingWidget.name}.` : "Type a question or choose a trending query to generate a widget."}
              </p>
            </div>
            {!scoped && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Compare sleep and stress", "Show engagement trend over time", "What's our flourishing status?"].map((q) => (
                  <button key={q} onClick={() => send(q)} style={{ ...btnGhostSmall, justifyContent: "flex-start", padding: "8px 12px" }}>{q}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <Bubble key={i} mine>{m.text}</Bubble>
          ) : (
            <div key={i}>
              <Bubble>{m.text}</Bubble>
              {m.variants.map((spec, vi) => (
                <GeneratedWidgetPreview
                  key={vi}
                  spec={spec}
                  onTitleChange={(newTitle) => updateVariantTitle(i, vi, newTitle)}
                  approveLabel={scoped ? "Replace" : "Add to canvas"}
                  onApprove={() => (scoped ? onReplaceWidget(editingWidget.id, spec) : onAddWidget(spec))}
                  onRegenerate={() => send(messages[i - 1]?.text)}
                />
              ))}
            </div>
          )
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${T.gray75}` }}>
        <div style={{ border: `1px solid ${T.gray75}`, borderRadius: 16, padding: 10 }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Do anything with AI..." rows={2} style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 12.5, fontFamily: font }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <IconBtn><Paperclip size={14} /></IconBtn>
              <IconBtn><Mic size={14} /></IconBtn>
            </div>
            <button onClick={() => send()} style={{ ...btnPrimarySmall, borderRadius: 9999, padding: "7px 10px" }}><Send size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
function IconBtn({ children }) {
  return <button style={{ border: "none", background: "transparent", color: T.gray300, cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}>{children}</button>;
}

/* ================================================================== */
/* LANDING                                                              */
/* ================================================================== */
function Landing({ onGuided, onBlank }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: T.gray50, fontFamily: font }}>
      <div style={{ textAlign: "center", maxWidth: 560 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.accent, marginBottom: 8, letterSpacing: 0.5 }}>REPORT CARD BUILDER</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: T.gray900, margin: "0 0 8px" }}>How do you want to start?</h1>
        <p style={{ fontSize: 14, color: T.gray500, margin: "0 0 32px" }}>Both paths lead to the same live report canvas.</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onGuided} style={{ width: 220, padding: 24, borderRadius: 18, border: `1.5px solid ${T.accent}`, background: T.accentBg, cursor: "pointer", textAlign: "left", fontFamily: font }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🙂</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>Guided Create</div>
            <div style={{ fontSize: 11.5, color: T.gray700, marginTop: 4 }}>Chat with the mascot to build it</div>
          </button>
          <button onClick={onBlank} style={{ width: 220, padding: 24, borderRadius: 18, border: `1px solid ${T.gray100}`, background: T.white, cursor: "pointer", textAlign: "left", fontFamily: font }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>▦</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>Blank Canvas</div>
            <div style={{ fontSize: 11.5, color: T.gray700, marginTop: 4 }}>Start empty, build it yourself</div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* GUIDED CHAT — mascot leads with an open concern question             */
/* ================================================================== */
const DRIVER_POOL_DEFAULT = { matched: ["Workload", "Job Satisfaction", "Feeling Stressed"], suggested: ["Manager Support", "Life Outside Work"] };

function GuidedChat({ onComplete, onBack }) {
  const [messages, setMessages] = useState([{ role: "ai", text: "Hi — what are you concerned about, or what would you like to explore?", stage: "topic" }]);
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState(null);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [selectedInsights, setSelectedInsights] = useState([]);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const pushAI = (msg) => setMessages((m) => [...m, { role: "ai", ...msg }]);
  const pushUser = (text) => setMessages((m) => [...m, { role: "user", text }]);

  const handleTopicSubmit = (text) => {
    pushUser(text);
    setTopic(text);
    setTimeout(() => {
      pushAI({ text: `Got it. Here's what I'd measure for "${text}":`, stage: "drivers", chips: DRIVER_POOL_DEFAULT.matched, suggestedChips: DRIVER_POOL_DEFAULT.suggested });
    }, 350);
  };

  const toggleDriver = (d) => setSelectedDrivers((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  const toggleInsight = (i) => setSelectedInsights((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  const confirmDrivers = () => {
    const all = [...DRIVER_POOL_DEFAULT.matched, ...selectedDrivers];
    pushUser(`Include: ${all.join(", ")}`);
    setTimeout(() => pushAI({ text: "What do you want to see?", stage: "insights", chips: ["Overall score", "Driver breakdown", "Trends over time"] }), 350);
  };

  const generate = () => {
    pushUser(selectedInsights.join(", ") || "Overall score");
    setTimeout(() => pushAI({ text: "Here's your report card:", stage: "done" }), 350);
  };

  const lastStage = [...messages].reverse().find((m) => m.role === "ai")?.stage;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background: T.gray50, fontFamily: font }}>
      <div style={{ width: 520, display: "flex", flexDirection: "column", height: "100%", padding: "20px 0" }}>
        <button onClick={onBack} style={{ border: "none", background: "transparent", color: T.gray500, cursor: "pointer", fontSize: 11.5, display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
          <ArrowLeft size={13} /> Back
        </button>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "4px 4px 16px" }}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <Bubble key={i} mine>{m.text}</Bubble>
            ) : (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9999, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🙂</div>
                <div style={{ flex: 1 }}>
                  <Bubble>{m.text}</Bubble>
                  {m.stage === "drivers" && (
                    <div style={{ marginTop: 4 }}>
                      <ChipRow chips={m.chips} selected={m.chips} onToggle={() => {}} multi />
                      <p style={{ fontSize: 11, color: T.gray500, margin: "10px 0 0" }}>These could also be relevant — include?</p>
                      <ChipRow chips={m.suggestedChips} selected={selectedDrivers} onToggle={toggleDriver} multi />
                      {i === messages.length - 1 && <button onClick={confirmDrivers} style={{ ...btnPrimarySmall, marginTop: 10 }}>Continue</button>}
                    </div>
                  )}
                  {m.stage === "insights" && (
                    <div style={{ marginTop: 4 }}>
                      <ChipRow chips={m.chips} selected={selectedInsights} onToggle={toggleInsight} multi />
                      {i === messages.length - 1 && (
                        <button onClick={generate} disabled={!selectedInsights.length} style={{ ...btnPrimarySmall, marginTop: 10, opacity: selectedInsights.length ? 1 : 0.4 }}>
                          <Sparkles size={13} /> Generate report card
                        </button>
                      )}
                    </div>
                  )}
                  {m.stage === "done" && i === messages.length - 1 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <div style={{ width: 164, height: 164, border: `1px solid ${T.gray100}`, borderRadius: 18, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
                        <Header title="Your Score" />
                        <WidgetBody familyId="your-score" formIndex={0} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <button onClick={() => onComplete(topic, DRIVER_POOL_DEFAULT.matched.concat(selectedDrivers), selectedInsights)} style={btnPrimarySmall}>
                          Open in canvas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
          <div ref={endRef} />
        </div>

        {lastStage === "topic" && (
          <div style={{ borderTop: `1px solid ${T.gray100}`, paddingTop: 12 }}>
            <div style={{ border: `1px solid ${T.gray75}`, borderRadius: 16, padding: 10, display: "flex", gap: 8 }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { handleTopicSubmit(input); setInput(""); } }} placeholder="Describe what's on your mind..." style={{ flex: 1, border: "none", outline: "none", fontSize: 12.5, fontFamily: font }} />
              <button onClick={() => { if (input.trim()) { handleTopicSubmit(input); setInput(""); } }} style={{ ...btnPrimarySmall, borderRadius: 9999, padding: "7px 10px" }}><Send size={13} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* CANVAS SCREEN                                                        */
/* ================================================================== */
function CanvasScreen({ initialWidgets, scopeLabel, onExit }) {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [libCollapsed, setLibCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalWidget, setModalWidget] = useState(null);
  const dragData = useRef(null);

  const editingWidget = editingId
    ? (() => {
        const w = widgets.find((x) => x.id === editingId);
        if (!w) return null;
        const name = w.customTitle || (w.kind === "library" ? familyById(w.familyId).name : w.spec.title);
        return { id: w.id, name, kind: w.kind, familyId: w.familyId, formIndex: w.formIndex, spec: w.spec };
      })()
    : null;

  const addLibraryWidget = (familyId, formIndex) => setWidgets((w) => [...w, { id: nextId(), kind: "library", familyId, formIndex }]);
  const addGeneratedWidget = (spec) => setWidgets((w) => [...w, { id: nextId(), kind: "generated", spec }]);
  const replaceWidget = (id, spec) => {
    setWidgets((w) => w.map((x) => (x.id === id ? { id, kind: "generated", spec } : x)));
    setEditingId(null);
  };
  const changeForm = (id) =>
    setWidgets((w) => w.map((x) => (x.id !== id || x.kind !== "library" ? x : { ...x, formIndex: (x.formIndex + 1) % familyById(x.familyId).forms.length })));
  const removeWidget = (id) => setWidgets((w) => w.filter((x) => x.id !== id));
  const renameWidget = (id, newTitle) => setWidgets((w) => w.map((x) => (x.id === id ? { ...x, customTitle: newTitle } : x)));
  const startEdit = (id) => { setEditingId(id); setChatOpen(true); };

  const onLibraryDragStart = (e, familyId, formIndex) => { dragData.current = { type: "library", familyId, formIndex }; };
  const onCanvasDrop = (e) => {
    e.preventDefault();
    if (dragData.current?.type === "library") addLibraryWidget(dragData.current.familyId, dragData.current.formIndex);
    dragData.current = null;
  };
  const onWidgetDragStart = (id) => { dragData.current = { type: "canvas", id }; };
  const onWidgetDrop = (targetId) => {
    if (dragData.current?.type === "canvas" && dragData.current.id !== targetId) {
      setWidgets((w) => {
        const from = w.findIndex((x) => x.id === dragData.current.id);
        const to = w.findIndex((x) => x.id === targetId);
        const copy = [...w];
        const [moved] = copy.splice(from, 1);
        copy.splice(to, 0, moved);
        return copy;
      });
    }
    dragData.current = null;
  };

  const gridWidth = CELL * 6 + GAP * 5;

  return (
    <div style={{ height: "100%", display: "flex", fontFamily: font, position: "relative", overflow: "hidden" }}>
      <LibraryPanel collapsed={libCollapsed} onToggle={() => setLibCollapsed((c) => !c)} onLibraryDragStart={onLibraryDragStart} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 32px", borderBottom: `1px solid ${T.gray75}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.white }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onExit} style={{ border: "none", background: "transparent", color: T.gray500, cursor: "pointer", display: "flex" }}><ArrowLeft size={13} /></button>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.gray700 }}>{scopeLabel || "Org Report"}</div>
              <div style={{ fontSize: 10.5, color: T.gray300 }}>{scopeLabel ? "Scoped to selected drivers" : "Full org-wide data"}</div>
            </div>
          </div>
          <button onClick={() => setChatOpen(true)} style={{ ...btnGhostSmall, borderRadius: 9999, padding: "6px 14px" }}><Plus size={14} /> Add Widget</button>
        </div>

        <div onDragOver={(e) => e.preventDefault()} onDrop={onCanvasDrop} style={{ flex: 1, overflow: "auto", padding: 28, background: T.gray50 }}>
          <div style={{ background: T.white, borderRadius: 36, padding: 32, border: `1px solid ${T.gray100}`, boxShadow: "0 22px 6px rgba(0,0,0,0.01), 0 14px 6px rgba(0,0,0,0.02), 0 8px 5px rgba(0,0,0,0.07), 0 3px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)", width: gridWidth + 64, boxSizing: "border-box" }}>
            {widgets.length === 0 ? (
              <div style={{ width: gridWidth, height: 344, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.gray300, border: `2px dashed ${T.gray100}`, borderRadius: 16, gap: 8 }}>
                <Plus size={22} />
                <span style={{ fontSize: 12.5 }}>Drag a widget here, or ask the mascot</span>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(6, ${CELL}px)`, gridAutoRows: `${CELL}px`, gap: GAP, width: gridWidth }}>
                {widgets.map((w) => (
                  <div key={w.id} onDragOver={(e) => e.preventDefault()} onDrop={() => onWidgetDrop(w.id)} style={{ display: "contents" }}>
                    <WidgetCard widget={w} onChangeForm={changeForm} onEdit={startEdit} onRemove={removeWidget} onRename={renameWidget} onOpenModal={setModalWidget} dragProps={{ draggable: true, onDragStart: () => onWidgetDragStart(w.id) }} />
                  </div>
                ))}
                <div onClick={() => setChatOpen(true)} style={{ width: CELL, height: CELL, borderRadius: 18, background: T.gray50, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1px dashed ${T.gray100}`, boxSizing: "border-box" }}>
                  <Plus size={20} color={T.gray300} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={() => { setEditingId(null); setChatOpen((o) => !o); }} style={{ position: "absolute", bottom: 24, right: chatOpen ? 416 : 24, transition: "right 200ms ease", width: 52, height: 52, borderRadius: 9999, background: T.gray800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.25)", zIndex: 40, fontSize: 22 }}>
        🙂
      </button>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} editingWidget={editingWidget} onAddWidget={addGeneratedWidget} onReplaceWidget={replaceWidget} onCancelEdit={() => setEditingId(null)} />
      <DetailModal widget={modalWidget} onClose={() => setModalWidget(null)} />
    </div>
  );
}

/* ================================================================== */
/* APP ROOT                                                              */
/* ================================================================== */
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [canvasProps, setCanvasProps] = useState({ initialWidgets: [], scopeLabel: null });

  const startBlank = () => { setCanvasProps({ initialWidgets: [], scopeLabel: null }); setScreen("canvas"); };

  const completeGuided = (topic, driverList, insightTypes) => {
    const seeded = [
      { id: nextId(), kind: "library", familyId: "your-score", formIndex: 1 },
      { id: nextId(), kind: "library", familyId: "explorers", formIndex: 0 },
    ];
    if (insightTypes.includes("Trends over time")) seeded.push({ id: nextId(), kind: "library", familyId: "score-history", formIndex: 0 });
    if (insightTypes.includes("Overall score")) seeded.push({ id: nextId(), kind: "library", familyId: "org-status", formIndex: 0 });
    setCanvasProps({ initialWidgets: seeded, scopeLabel: topic });
    setScreen("canvas");
  };

  return (
    <div style={{ width: "100%", height: "100vh", background: T.white }}>
      {screen === "landing" && <Landing onGuided={() => setScreen("guided")} onBlank={startBlank} />}
      {screen === "guided" && <GuidedChat onComplete={completeGuided} onBack={() => setScreen("landing")} />}
      {screen === "canvas" && <CanvasScreen initialWidgets={canvasProps.initialWidgets} scopeLabel={canvasProps.scopeLabel} onExit={() => setScreen("landing")} />}
    </div>
  );
}
