import { useState } from "react";
import { META, OWNERS, ACTIONS, STRUGGLING_DRIVERS, whoActs, TOPIC_OF, HEALTH_AGE, ACTION_DETAIL, HEAT, DIFFERENCE, FOOD_VOICE, FLOURISHING, PILLARS, STATE, WHO, DRIVER_SCORES, DEPT_VIEW, LEAGUE, DRIVER_DETAIL, statusOf } from "./data.js";
import { C, T, FONT, PAGE_W, PAGE_H, STATUS, st, ANSWER_FILL, Card, Kpi, StatusPill, Score, DataBar, StackBar, BarRow, Thresholds, th, td, Slicer, PbiButton } from "./pbi.jsx";

/* ================================================================== */
/* The redesigned report: six Power BI pages on a 1280 × 720 canvas.     */
/* One header (title + page navigator), one slicer bar, then the page.   */
/* ================================================================== */
export const PAGES = [
  { id: "overview", name: "Overview", original: 4 },
  { id: "actions", name: "Actions", original: 1 },
  { id: "detail", name: "Action detail", original: 2, drill: true },
  { id: "evidence", name: "Evidence", original: 3 },
  { id: "department", name: "Departments", original: 5 },
  { id: "driver", name: "Driver", original: 6 },
];

const pageSlicers = {
  overview: [],
  actions: [],
  detail: [],
  evidence: [],
  department: [{ label: "Department", value: DEPT_VIEW.dept, emphasis: true, width: 168 }],
  driver: [{ label: "Driver", value: DRIVER_DETAIL.driver, emphasis: true, width: 220 }],
};

export function Report({ page, go, healthAge = false }) {
  const [driver, setDriver] = useState(ACTION_DETAIL.driver);
  const [from, setFrom] = useState("actions");
  const openDetail = (d) => { setDriver(d); setFrom(page); go("detail"); };
  // Drill-through context only lasts while you're on the page; arriving any other way shows the worked example.
  const [lastPage, setLastPage] = useState(page);
  if (page !== lastPage) { setLastPage(page); if (page !== "detail" && driver !== ACTION_DETAIL.driver) setDriver(ACTION_DETAIL.driver); }
  const Page = { overview: Overview, actions: Actions, detail: Detail, evidence: Evidence, department: Department, driver: DriverPage }[page];
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: C.page, fontFamily: FONT, color: C.text, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header: title + page navigator (Power BI page navigator, styled from the theme). */}
      <div style={{ height: 48, flexShrink: 0, background: C.navy, display: "flex", alignItems: "center", padding: "0 20px", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, color: "#fff", minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>WXI Site Report</span>
          <span style={{ fontSize: 12, opacity: 0.75, whiteSpace: "nowrap" }}>{META.operator} · {META.client}</span>
        </div>
        <nav aria-label="Pages" style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
          {PAGES.filter((p) => !p.drill).map((p) => {
            const on = p.id === page || (page === "detail" && p.id === from);
            return (
              <button key={p.id} type="button" onClick={() => go(p.id)} style={{ height: 30, padding: "0 14px", border: "none", borderRadius: 4, background: on ? "#fff" : "transparent", color: on ? C.navy : "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}>{p.name}</button>
            );
          })}
        </nav>
      </div>
      {/* Slicer bar: the filters that used to fill a 230px sidebar. */}
      <div style={{ height: 52, flexShrink: 0, background: C.card, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 10, padding: "0 20px" }}>
        {pageSlicers[page].map((s) => <Slicer key={s.label} {...s} />)}
        {pageSlicers[page].length > 0 && <span style={{ width: 1, alignSelf: "stretch", margin: "10px 4px", background: C.line }} />}
        {["Site", "Gender", "Tenure", "Age range", ...(page === "department" ? [] : ["Department"])].map((l) => <Slicer key={l} label={l} width={page === "department" || page === "driver" ? 104 : 120} />)}
        <PbiButton style={{ alignSelf: "flex-end", marginBottom: 6, height: 24 }}>Reset</PbiButton>
        <div style={{ marginLeft: "auto", textAlign: "right", ...T.sub }}>
          <div>Surveyed <b style={{ color: C.text2 }}>{META.surveyed}</b></div>
          <div><b style={{ color: C.text2 }}>{META.n}</b> people · {META.departments} departments</div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 12, boxSizing: "border-box" }}>
        <Page go={go} openDetail={openDetail} driver={driver} back={() => go(from)} healthAge={healthAge} />
      </div>
    </div>
  );
}

const Grid = ({ cols, rows, children, style }) => <div style={{ display: "grid", gridTemplateColumns: cols, gridTemplateRows: rows, gap: 12, height: "100%", minHeight: 0, ...style }}>{children}</div>;
const Headline = ({ children }) => <div style={{ fontSize: 13, color: C.text2, lineHeight: "18px" }}>{children}</div>;
const owner = (id) => OWNERS.find((o) => o.id === id);
const tight = { padding: "3px 8px" };

/* ---------------------------------------------------------------- */
/* 1 · OVERVIEW (was "Home")                                          */
/* ---------------------------------------------------------------- */
function Overview({ healthAge }) {
  const total = STATE.Flourishing + STATE.Striving + STATE.Struggling;
  const [topic, setTopic] = useState(null);
  const drivers = [...DRIVER_SCORES].filter((d) => !topic || TOPIC_OF(d.driver) === topic).sort((a, b) => a.score - b.score);
  const ha = HEALTH_AGE.sample;
  return (
    <Grid cols="1fr" rows="auto 1fr">
      <Grid cols="300px 1fr 250px" rows="118px" style={{ height: "auto" }}>
        <Card pad={14}>
          <div style={T.label}>Drivers by status</div>
          <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
            {["Struggling", "Striving", "Flourishing"].map((s) => (
              <div key={s}><div style={{ ...T.kpi, fontSize: 28, color: STATUS[s].text }}>{STATE[s]}</div><div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{s}</div></div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}><StackBar height={8} labels={false} parts={["Struggling", "Striving", "Flourishing"].map((s) => ({ value: STATE[s], color: STATUS[s].fill, title: `${s}: ${STATE[s]}` }))} /></div>
          <div style={{ ...T.sub, marginTop: 6 }}>{total} Drivers in all.</div>
        </Card>
        <Card pad={14}>
          <div style={T.label}>Who answered</div>
          <div style={{ display: "grid", gridTemplateColumns: "92px 1fr 1fr 150px", gap: 18, marginTop: 6, alignItems: "start" }}>
            <div><div style={{ ...T.kpi, fontSize: 28 }}>{META.n}</div><div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>people in {META.departments} departments</div></div>
            <div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>Gender</div>
              <StackBar height={8} labels={false} parts={WHO.gender.map((g, i) => ({ value: g.n, color: ["#6B78C8", C.navy, "#B9C0E4"][i] }))} />
              <div style={{ display: "grid", gap: 2, marginTop: 6 }}>{WHO.gender.map((g, i) => <span key={g.label} style={{ fontSize: 11, color: C.text2, display: "flex", gap: 6, alignItems: "center" }}><i style={{ width: 8, height: 8, borderRadius: 2, background: ["#6B78C8", C.navy, "#B9C0E4"][i] }} />{g.label} <b style={{ marginLeft: "auto", color: C.text }}>{g.n}</b></span>)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>Where they work</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontSize: 22, fontWeight: 700 }}>93%</span><span style={{ fontSize: 11, color: C.text2 }}>hybrid</span></div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>6% office · 1% home</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>Tenure (years)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 40 }}>{WHO.tenure.map((t) => <div key={t.label} title={`${t.label}: ${t.n}`} style={{ flex: 1, height: `${(t.n / 174) * 100}%`, background: C.navy, borderRadius: "2px 2px 0 0", opacity: 0.8 }} />)}</div>
              <div style={{ display: "flex", gap: 4, marginTop: 3 }}>{WHO.tenure.map((t) => <span key={t.label} style={{ flex: 1, fontSize: 9, color: C.text3, textAlign: "center", whiteSpace: "nowrap" }}>{t.label}</span>)}</div>
            </div>
          </div>
        </Card>
        {/* Health Age: always has its place. Shown when the client has asked for it, otherwise a quiet "not requested" state. */}
        <Card pad={14}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={T.label}>Health Age</span>{healthAge && <span style={{ fontSize: 10, fontWeight: 600, color: C.amber, background: C.amberSoft, borderRadius: 3, padding: "1px 5px" }}>Sample</span>}</div>
          {healthAge ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}><span style={{ ...T.kpi, color: ha.healthAge > ha.actualAge ? C.red : C.green }}>{ha.healthAge.toFixed(1)}</span><span style={{ fontSize: 12, color: C.text3 }}>years</span></div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 6 }}><b style={{ color: ha.healthAge > ha.actualAge ? C.red : C.green }}>{(ha.healthAge - ha.actualAge).toFixed(1)} years {ha.healthAge > ha.actualAge ? "older" : "younger"}</b> than the average actual age ({ha.actualAge.toFixed(1)}).</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text3, marginTop: 10 }}>Not requested</div>
              <div style={{ ...T.sub, marginTop: 6 }}>Shows the Site's average Health Age against actual age when the client asks for it.</div>
            </>
          )}
        </Card>
      </Grid>
      <Grid cols="1fr 1fr" rows="1fr" style={{ minHeight: 0 }}>
        <Card title="Workplace Experience Index (WXI)" sub="The index, its two pillars and their seven topics. Select a topic to filter the Driver scores."
          right={topic && <button type="button" onClick={() => setTopic(null)} style={{ border: "none", background: "none", color: C.navy, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" }}>Clear selection</button>}>
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Wheel topic={topic} onTopic={(t) => setTopic((cur) => (cur === t ? null : t))} /></div>
        </Card>
        <Card title={topic ? `Driver scores · ${topic}` : "Driver scores"} sub="Lowest first. Struggling under 60, Striving 60 to 79, Flourishing 80+." bodyStyle={{ paddingRight: 6 }}>
          <div style={{ overflowY: "auto", flex: 1, minHeight: 0, display: "grid", gap: 7, alignContent: "start", paddingRight: 8 }}>
            {drivers.map((d) => <BarRow key={d.driver} label={d.driver} value={d.score} color={st(d.score).fill} labelW={250} height={10} marks={[60, 80]} />)}
          </div>
        </Card>
      </Grid>
    </Grid>
  );
}

/* The WXI wheel, kept from the source: index in the centre, the two pillars as the inner ring (Healthy Buildings left, Happy
   People right), the seven topics as the outer ring, coloured by status. In Power BI: an SVG measure (rendered in an Image or
   Table visual) or Deneb; clicking a topic needs Deneb, or invisible buttons over each segment that set a topic slicer. */
const polar = (cx, cy, r, deg) => { const a = ((deg - 90) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
const arc = (cx, cy, r0, r1, a0, a1) => {
  const [x0, y0] = polar(cx, cy, r1, a0), [x1, y1] = polar(cx, cy, r1, a1), [x2, y2] = polar(cx, cy, r0, a1), [x3, y3] = polar(cx, cy, r0, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0} A${r1} ${r1} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${big} 0 ${x3} ${y3} Z`;
};
const WHEEL_TOPICS = [
  // right half: Happy People, clockwise from 12 o'clock; left half: Healthy Buildings, clockwise from 6 o'clock
  ["Eating Habits", 0, 45], ["Nutrition", 45, 90], ["Physical Activity", 90, 135], ["Health Awareness", 135, 180],
  ["Meeting Rooms", 180, 240], ["Open Collaboration Spaces", 240, 300], ["Workstations", 300, 360],
];
function Wheel({ topic, onTopic }) {
  const W = 660, H = 400, cx = W / 2, cy = H / 2;
  const R = { core: 52, pIn: 56, pOut: 112, tIn: 116, tOut: 168, rim: 172 };
  const score = Object.fromEntries(PILLARS.flatMap((p) => p.topics.map((t) => [t.name, t.score])));
  const [hb, hp] = PILLARS;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ maxHeight: H, display: "block", fontFamily: FONT }} role="img" aria-label={`WXI ${META.wxi}. Healthy Buildings ${hb.score}, Happy People ${hp.score}.`}>
      {/* pillars */}
      {[[hb, 180, 360], [hp, 0, 180]].map(([p, a0, a1]) => {
        const on = topic && p.topics.some((t) => t.name === topic);
        const [lx, ly] = polar(cx, cy, (R.pIn + R.pOut) / 2, (a0 + a1) / 2);
        return (
          <g key={p.name}>
            <path d={arc(cx, cy, R.pIn, R.pOut, a0 + 0.6, a1 - 0.6)} fill={C.navySoft} stroke={on ? C.navy : "none"} strokeWidth="1.5" />
            <text x={lx} y={ly - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.navy}>{p.name.split(" ")[0]}</text>
            <text x={lx} y={ly + 5} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.navy}>{p.name.split(" ")[1]}</text>
            <text x={lx} y={ly + 24} textAnchor="middle" fontSize="17" fontWeight="700" fill={st(p.score).text}>{p.score}</text>
          </g>
        );
      })}
      {/* topics */}
      {WHEEL_TOPICS.map(([name, a0, a1]) => {
        const v = score[name], s = st(v), on = topic === name, dim = topic && !on;
        const lines = name.length > 18 ? [name.split(" ").slice(0, -1).join(" "), name.split(" ").slice(-1)[0]] : [name];
        const mid = (a0 + a1) / 2;
        const [vx, vy] = polar(cx, cy, (R.tIn + R.tOut) / 2, mid);
        const [p0x, p0y] = polar(cx, cy, R.rim + 4, mid), [p1x, p1y] = polar(cx, cy, R.rim + 16, mid);
        const right = Math.sin((mid * Math.PI) / 180) > 0.05, left = Math.sin((mid * Math.PI) / 180) < -0.05;
        const lx = right ? p1x + 6 : left ? p1x - 6 : p1x, ly = p1y + (Math.abs(Math.cos((mid * Math.PI) / 180)) > 0.9 ? (Math.cos((mid * Math.PI) / 180) > 0 ? -4 : 12) : 4);
        return (
          <g key={name} onClick={() => onTopic(name)} style={{ cursor: "pointer" }} opacity={dim ? 0.45 : 1}>
            <title>{`${name}: ${v}`}</title>
            <path d={arc(cx, cy, R.tIn, R.tOut, a0 + 0.6, a1 - 0.6)} fill={on ? s.fill : s.soft} stroke={on ? C.navy : "none"} strokeWidth="1.5" />
            <text x={vx} y={vy + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill={on ? "#fff" : s.text}>{v}</text>
            <line x1={p0x} y1={p0y} x2={p1x} y2={p1y} stroke={C.text3} strokeWidth="1" />
            <text x={lx} y={ly - (lines.length - 1) * 7} textAnchor={right ? "start" : left ? "end" : "middle"} fontSize="12" fontWeight={on ? 700 : 600} fill={C.text}>
              {lines.map((t, k) => <tspan key={k} x={lx} dy={k ? 14 : 0}>{t}</tspan>)}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={R.rim} fill="none" stroke={C.navy} strokeWidth="3" />
      <circle cx={cx} cy={cy} r={R.core} fill={C.navy} />
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="30" fontWeight="700" fill="#fff">{META.wxi}</text>
      <text x={cx} y={cy + 25} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">/100</text>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* 2 · ACTIONS (was "Operator Actions"): a cockpit of tiles           */
/* ---------------------------------------------------------------- */
function Actions({ go, openDetail }) {
  const [view, setView] = useState("Struggling");
  const [allCbi, setAllCbi] = useState(false);
  const by = (id) => ACTIONS.filter((a) => a.owner === id).sort((a, b) => a.score - b.score);
  const act = by("act"), plan = by("plan"), cbi = by("cbi"), nudge = by("nudge");
  const striving = DRIVER_SCORES.filter((d) => statusOf(d.score) === "Striving").sort((a, b) => b.score - a.score);
  return (
    <Grid cols="1fr" rows="40px 1fr">
      {/* Headline (a text box with a dynamic value) + the status toggle (bookmarks, or a button slicer on Status). */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 17, color: C.text2, flex: 1, minWidth: 0 }}>
          {view === "Struggling" && <><b style={{ color: C.text }}>{STRUGGLING_DRIVERS} of {STATE.Flourishing + STATE.Striving + STATE.Struggling} Drivers are Struggling.</b> Start with the {act.length} actions Sodexo can do within 30 days.</>}
          {view === "Striving" && <><b style={{ color: C.text }}>{STATE.Striving} Drivers are Striving.</b> The closest are a few points from Flourishing.</>}
          {view === "Flourishing" && <><b style={{ color: C.text }}>{STATE.Flourishing} Drivers are Flourishing.</b> Protect them while you fix the rest.</>}
        </div>
        <div role="tablist" aria-label="Status" style={{ display: "flex", border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden", background: C.card }}>
          {["Struggling", "Striving", "Flourishing"].map((s) => (
            <button key={s} type="button" role="tab" aria-selected={view === s} onClick={() => setView(s)} style={{ height: 32, padding: "0 16px", border: "none", borderLeft: s === "Struggling" ? "none" : `1px solid ${C.line}`, background: view === s ? C.navy : C.card, color: view === s ? "#fff" : C.text, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}>{s}</button>
          ))}
        </div>
      </div>
      <Grid cols="300px 1fr 1fr" rows="1fr 1fr" style={{ minHeight: 0 }}>
        {/* The index, spanning both rows. */}
        <Card style={{ gridRow: "1 / 3" }} pad={20}>
          <div style={{ ...T.label, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>Overall WXI</div>
          <div style={{ fontSize: 120, fontWeight: 700, lineHeight: 1, letterSpacing: -3, color: st(META.wxi).text, marginTop: 28 }}>{META.wxi}</div>
          <div style={{ marginTop: 14 }}><StatusPill status={statusOf(META.wxi)} /></div>
          <div style={{ display: "grid", gap: 10, marginTop: 36, fontSize: 15, color: C.text2 }}>
            <div>Happy People: <b style={{ color: st(META.happyPeople).text }}>{META.happyPeople}</b></div>
            <div>Healthy Buildings: <b style={{ color: st(META.healthyBuildings).text }}>{META.healthyBuildings}</b></div>
          </div>
          <div style={{ ...T.sub, fontSize: 12, marginTop: 36 }}>Score out of 100. Below 60 is Struggling, 80 and above is Flourishing.</div>
          <TileLink onClick={() => go("overview")}>See scores by topic</TileLink>
        </Card>
        {view === "Struggling" ? (
          <>
            <Tile n="1" title="Do now" sub="Sodexo · within 30 days" link={<TileLink onClick={() => go("evidence")}>See why</TileLink>}>
              {act.map((a, i) => <ActionRow key={a.driver} a={a} first={i === 0} onOpen={openDetail} />)}
            </Tile>
            <Tile n="2" title="Plan next" sub="Sodexo · 1 to 3 months" link={<TileLink onClick={() => go("evidence")}>See why</TileLink>}>
              {plan.map((a, i) => <ActionRow key={a.driver} a={a} first={i === 0} onOpen={openDetail} />)}
            </Tile>
            <Tile n="3" title="Raise with CBI" sub={`${cbi.length} actions · next review`} scroll={allCbi}
              link={<TileLink onClick={() => setAllCbi((v) => !v)}>{allCbi ? "Show top 3" : `See all ${cbi.length}`}</TileLink>}>
              {(allCbi ? cbi : cbi.slice(0, 3)).map((a, i) => <ActionRow key={a.driver} a={a} first={i === 0} onOpen={openDetail} compact />)}
            </Tile>
            <Grid cols="1fr" rows="1fr 1fr">
              <Tile n="4" title="Nudge staff" sub="Staff habits · checked at each pulse">
                {nudge.map((a, i) => <ActionRow key={a.driver} a={a} first={i === 0} onOpen={openDetail} compact />)}
              </Tile>
              <Balance />
            </Grid>
          </>
        ) : (
          <>
            <Card style={{ gridColumn: "2 / 3", gridRow: "1 / 3" }} title={view === "Striving" ? "Within reach" : "Working well: protect it"}
              sub={view === "Striving" ? "Striving Drivers, closest to Flourishing first." : "Flourishing Drivers, scoring 80 or more."}>
              <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
                {(view === "Striving" ? striving : FLOURISHING).map((d, i) => (
                  <div key={d.driver} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i ? `1px solid ${C.rule}` : "none" }}>
                    <ScoreChip v={d.score} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d.driver}</span>
                    {view === "Striving" && <span style={{ fontSize: 11, color: C.text3 }}>{80 - d.score} pts to Flourishing</span>}
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ gridColumn: "3 / 4", gridRow: "1 / 2" }} title={view === "Striving" ? "What to do with them" : "Why it matters"}>
              <div style={T.body}>{view === "Striving"
                ? "No actions are set for Striving Drivers in this report. Watch the closest ones at each pulse: a small dip moves them back to Struggling, a small lift makes them Flourishing."
                : "These are strengths people notice. Keep the services behind them as they are, and check them at each pulse so a change elsewhere doesn't pull them down."}</div>
            </Card>
            <div style={{ gridColumn: "3 / 4", gridRow: "2 / 3", display: "grid" }}><Balance /></div>
          </>
        )}
      </Grid>
    </Grid>
  );
}
function Tile({ n, title, sub, link, children, scroll }) {
  return (
    <Card pad={18}>
      <div style={{ ...T.label, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{n} · {title}</div>
      <div style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>{sub}</div>
      <div style={{ marginTop: 8, flex: 1, minHeight: 0, overflowY: scroll ? "auto" : "visible" }}>{children}</div>
      {link}
    </Card>
  );
}
const TileLink = ({ onClick, children }) => (
  <button type="button" onClick={onClick} style={{ marginTop: "auto", alignSelf: "flex-start", border: "none", background: "none", padding: 0, color: C.navy, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}>{children} →</button>
);
const ScoreChip = ({ v }) => <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 26, borderRadius: 5, background: st(v).soft, color: st(v).text, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v}</span>;
/* One action: score, Driver, what to do, who. The row drills through to Action detail. */
function ActionRow({ a, first, onOpen, compact }) {
  const who = whoActs(a);
  return (
    <div role="button" tabIndex={0} onClick={() => onOpen(a.driver)} onKeyDown={(e) => e.key === "Enter" && onOpen(a.driver)} className="pbi-row"
      title="Open the plan" style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", alignItems: "center", gap: 12, padding: compact ? "7px 0" : "10px 0", borderTop: first ? "none" : `1px solid ${C.rule}`, cursor: "pointer" }}>
      <ScoreChip v={a.score} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.driver}</div>
        <div style={{ fontSize: 12, color: C.text2, lineHeight: "16px", marginTop: 1, ...(compact ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } : {}) }}>{a.action}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.navy, background: C.navySoft, borderRadius: 10, padding: "2px 9px", whiteSpace: "nowrap" }}>{who}</span>
    </div>
  );
}
function Balance() {
  const total = STATE.Struggling + STATE.Striving + STATE.Flourishing;
  return (
    <Card pad={18}>
      <div style={{ ...T.label, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>5 · The balance</div>
      <div style={{ marginTop: 14 }}>
        <StackBar height={30} parts={["Struggling", "Striving", "Flourishing"].map((s) => ({ value: STATE[s], color: STATUS[s].fill, label: `${STATE[s]} ${s}` }))} />
      </div>
      <div style={{ ...T.sub, fontSize: 12, marginTop: 10 }}>Out of {total} Drivers. Switch the toggle above to see what is working well.</div>
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* 2a · ACTION DETAIL (drill-through, was "Action Detail")            */
/* ---------------------------------------------------------------- */
function Detail({ back, driver }) {
  const a = ACTIONS.find((x) => x.driver === driver) || ACTIONS.find((x) => x.driver === ACTION_DETAIL.driver);
  const full = a.driver === ACTION_DETAIL.driver ? ACTION_DETAIL : null;
  const o = owner(a.owner);
  const site = a.score;
  return (
    <Grid cols="1fr" rows="76px 1fr">
      <Card pad={12} bodyStyle={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <PbiButton onClick={back}>‹ Back</PbiButton>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: C.text3 }}><b style={{ color: C.navy }}>{o.name}</b> · {o.owner} · {o.when}{full && <> · Topic: {full.topic}</>}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 2 }}>{a.driver}</div>
          {full && <div style={{ fontSize: 12, color: C.text2, fontStyle: "normal", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Question: “{full.question}”</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end" }}><Score v={a.score} size={32} /><span style={{ fontSize: 12, color: C.text3 }}>/100</span></div>
          <div style={{ marginTop: 4 }}><StatusPill status={statusOf(a.score)} /></div>
        </div>
      </Card>
      {!full ? (
        <Grid cols="1fr 1fr" rows="1fr" style={{ minHeight: 0 }}>
          <Card title="At a glance">
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 14, alignItems: "center", fontSize: 12 }}>
              <span style={{ color: C.text3 }}>% Struggling</span><DataBar pct={a.struggling} width={160} />
              <span style={{ color: C.text3 }}>Worst department</span><span>{a.hot ? <>{a.hot.dept} <b>{a.hot.pct}%</b> <span style={{ color: a.hot.n < 10 ? C.amber : C.text3 }}>({a.hot.n} people)</span></> : "Even across the Site"}</span>
              <span style={{ color: C.text3 }}>Who can fix it</span><span>{o.owner} · {o.when}</span>
            </div>
            <div style={{ ...T.sub, marginTop: "auto", padding: 12, background: C.rule, borderRadius: 6 }}>In Power BI this page fills from the model for whichever Driver you drill from: how people answered, who is most affected and the full plan. The source report only shows those for Collaboration Space Noise Levels, so this mockup has the full page for that one.</div>
          </Card>
          <Card title="The plan">
            <PlanStep n="1" label="Suggested action" when={o.when} text={a.action} />
            <PlanStep label="How we'll know it worked" text="Target to be set at the review." pending suggestion={`Track % Struggling on ${a.driver} at each pulse.`} last />
          </Card>
        </Grid>
      ) : (
        <Grid cols="1fr 1fr" rows="1fr" style={{ minHeight: 0 }}>
          <Grid cols="1fr" rows="auto 1fr">
            <Card title="How people answered" sub={`${full.n} people. The first three answers count as Struggling, Agree as Striving, Strongly agree as Flourishing.`}>
              <StackBar height={26} parts={full.answers.map((x, i) => ({ value: x.n, color: ANSWER_FILL[i], label: x.n, title: `${x.label}: ${x.n}` }))} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 8 }}>{full.answers.map((x, i) => <span key={x.label} style={{ fontSize: 11, color: C.text2, display: "flex", alignItems: "center", gap: 5 }}><i style={{ width: 8, height: 8, borderRadius: 2, background: ANSWER_FILL[i] }} />{x.label}</span>)}</div>
              <div style={{ display: "flex", gap: 24, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.rule}` }}>
                {Object.entries(full.split).map(([s, v]) => <div key={s}><span style={{ fontSize: 22, fontWeight: 700, color: STATUS[s].text }}>{v}%</span><span style={{ fontSize: 11, color: C.text2, marginLeft: 6 }}>{s}</span></div>)}
              </div>
            </Card>
            <Card title="Who is most affected" sub={`Score by group. The line is the Site (${site}). Groups under 5 people are hidden.`}>
              <div style={{ display: "grid", gap: 9 }}>
                {full.lowest.map((g) => <BarRow key={g.group} label={g.group} sub={`· ${g.by}, ${g.n}`} value={g.score} color={st(g.score).fill} labelW={250} height={12} refAt={site} />)}
                <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Highest-scoring group</div>
                {full.highest.map((g) => <BarRow key={g.group} label={g.group} sub={`· ${g.by}, ${g.n}`} value={g.score} color={st(g.score).fill} labelW={250} height={12} refAt={site} />)}
              </div>
            </Card>
          </Grid>
          <Card title="The plan">
            <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
              <PlanStep label="Why it matters" text={full.plan.why} />
              <PlanStep n="1" label="Quick win" text={full.plan.quick} />
              <PlanStep n="2" label="Bigger fix" text={full.plan.bigger} />
              <PlanStep label="How we'll know it worked" text={full.plan.measure} pending suggestion="Track % Struggling on this Driver, Site-wide and in 4E Policy, at each pulse." last />
            </div>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}
function PlanStep({ n, label, when, text, pending, suggestion, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12, padding: "12px 0", borderBottom: last ? "none" : `1px solid ${C.rule}` }}>
      <span style={{ width: 24, height: 24, borderRadius: 24, background: n ? C.navy : C.navySoft, color: n ? "#fff" : C.navy, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{n || "i"}</span>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</span>{when && <span style={{ fontSize: 11, color: C.text3 }}>{when}</span>}</div>
        <div style={{ ...T.body, marginTop: 3, color: pending ? C.amber : C.text2 }}>{text}</div>
        {suggestion && <div style={{ ...T.sub, marginTop: 4 }}>Suggested measure: {suggestion}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* 3 · EVIDENCE (was "Evidence & Progress")                           */
/* ---------------------------------------------------------------- */
/* Heat cell colour by points above the Site's own rate (matrix conditional formatting, rules on a "gap" measure). */
const heatFill = (gap) => (gap >= 15 ? [C.red, "#fff"] : gap >= 10 ? ["#E58A95", C.text] : gap >= 5 ? ["#F5C9CF", C.text] : gap > 0 ? ["#FCEDEF", C.text] : ["#FFFFFF", C.text3]);
function Evidence() {
  return (
    <Grid cols="1fr" rows="auto 1fr">
      <Headline><b style={{ color: C.text }}>Where people work matters more than who they are.</b> Departments differ by 43 points of people Struggling; tenure and gender by 24. Act department by department.</Headline>
      <Grid cols="800px 1fr" rows="1fr" style={{ minHeight: 0 }}>
        <Grid cols="1fr" rows="1fr 136px">
          <Card title="Where to act: hot spots" sub="% of people Struggling, by department (5+ people) and Driver, shaded by how far each is above the Site's own rate."
            right={<div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 10, color: C.text3, whiteSpace: "nowrap" }}>Points above Site {[["#FCEDEF", "1-4"], ["#F5C9CF", "5-9"], ["#E58A95", "10-14"], [C.red, "15+"]].map(([c, l]) => <span key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}><i style={{ width: 10, height: 10, background: c, border: `1px solid ${C.line}` }} />{l}</span>)}</div>}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup><col style={{ width: 172 }} />{HEAT.drivers.map((d) => <col key={d} />)}</colgroup>
              <thead><tr><th style={{ ...th, verticalAlign: "bottom" }}>Department (people)</th>{HEAT.drivers.map((d) => <th key={d} style={{ ...th, whiteSpace: "normal", textAlign: "center", lineHeight: "13px", fontSize: 10, verticalAlign: "bottom", padding: "0 4px 6px" }}>{d}</th>)}</tr></thead>
              <tbody>
                <tr><td style={{ ...td, fontWeight: 700, background: C.rule }}>Site</td>{HEAT.site.map((v, i) => <td key={i} style={{ ...td, textAlign: "center", fontWeight: 700, background: C.rule }}>{v}</td>)}</tr>
                {HEAT.rows.map((r) => (
                  <tr key={r.dept}>
                    <td style={{ ...td, padding: "7px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.dept} <span style={{ color: C.text3 }}>({r.n})</span></td>
                    {r.v.map((v, i) => { const [bg, fg] = heatFill(v - HEAT.site[i]); return <td key={i} title={`${v}% Struggling, ${v - HEAT.site[i] >= 0 ? "+" : ""}${v - HEAT.site[i]} vs Site`} style={{ ...td, padding: "7px 8px", textAlign: "center", background: bg, color: fg, fontWeight: v - HEAT.site[i] >= 10 ? 700 : 400, borderBottom: `1px solid #fff`, borderRight: "1px solid #fff" }}>{v}</td>; })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ ...T.sub, marginTop: "auto", paddingTop: 8 }}>{HEAT.note}</div>
          </Card>
          <Card title="What staff told us about food" pad={12}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {FOOD_VOICE.map((f) => <div key={f.stat}><div style={{ fontSize: 24, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{f.stat}</div><div style={{ fontSize: 11, color: C.text, marginTop: 4, lineHeight: "15px" }}>{f.text}</div>{f.sub && <div style={{ ...T.sub, marginTop: 2 }}>{f.sub}</div>}</div>)}
            </div>
          </Card>
        </Grid>
        <Grid cols="1fr" rows="196px 1fr">
          <Card title="What makes the difference" sub="Gap between best and worst group, points of people Struggling (average over the 15 Struggling Drivers).">
            <div style={{ display: "grid", gap: 9 }}>{DIFFERENCE.map((d) => <BarRow key={d.by} label={d.by} value={d.gap} max={50} color={C.navy} labelW={80} height={12} valueLabel={`${d.gap}`} />)}</div>
          </Card>
          <Card title="Working well: protect it" sub="The 7 Flourishing Drivers, scoring 80 or more.">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>{FLOURISHING.map((f) => <tr key={f.driver}><td style={td}>{f.driver}</td><td style={{ ...td, textAlign: "right", width: 40 }}><Score v={f.score} /></td></tr>)}</tbody>
            </table>
            <div style={{ ...T.sub, marginTop: "auto", paddingTop: 8 }}>Progress against these needs a second pulse; it shows here from the next one.</div>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}

/* ---------------------------------------------------------------- */
/* 4 · DEPARTMENTS (was "Department View")                            */
/* ---------------------------------------------------------------- */
function Department({ openDetail }) {
  const d = DEPT_VIEW;
  const rows = [...d.rows].sort((a, b) => b.gap - a.gap);
  const struggling = new Set(ACTIONS.map((a) => a.driver));
  const biggest = rows.filter((r) => struggling.has(r.driver))[0];
  return (
    <Grid cols="1fr" rows="82px 1fr">
      <Grid cols="repeat(5, 1fr)" rows="82px" style={{ height: "auto" }}>
        <Kpi label="Department" value={<span style={{ fontSize: 20 }}>{d.dept}</span>} foot={`${d.people} people`} />
        <Kpi label="Average % Struggling" value={`${d.avgStruggling}%`} color={C.red} foot={<>Site {d.siteAvgStruggling}% · <b style={{ color: C.red }}>+{d.avgStruggling - d.siteAvgStruggling} pts</b></>} />
        <Kpi label="Rank" value={d.rank} unit={`of ${d.of}`} foot="by average % Struggling, 1 = highest" />
        <Kpi label="Drivers 10+ pts worse than Site" value={d.worse10} color={C.red} foot="These are the ones to raise" />
        <Kpi label="Biggest gap on a Struggling Driver" value={<span style={{ fontSize: 15 }}>{biggest.driver}</span>} foot={`${biggest.dept}% vs ${biggest.site}% Site · +${biggest.gap} pts`} />
      </Grid>
      <Grid cols="1fr 440px" rows="1fr" style={{ minHeight: 0 }}>
        <Card title={`Where ${d.dept} differs from the Site`} sub="% Struggling on each Driver, biggest gap first. Red = 10+ points worse than the Site; green = better.">
          <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup><col /><col style={{ width: 170 }} /><col style={{ width: 60 }} /><col style={{ width: 84 }} /></colgroup>
              <thead style={{ position: "sticky", top: 0, background: C.card }}><tr><th style={th}>Driver</th><th style={th}>This department</th><th style={{ ...th, textAlign: "right" }}>Site</th><th style={{ ...th, textAlign: "right" }}>Gap</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.driver}>
                  <td style={{ ...td, padding: "2px 8px" }}>{r.driver}{struggling.has(r.driver) && <span title="Struggling across the Site" style={{ marginLeft: 6, fontSize: 10, color: C.red }}>●</span>}</td>
                  <td style={{ ...td, padding: "2px 8px" }}><DataBar pct={r.dept} width={96} /></td>
                  <td style={{ ...td, padding: "2px 8px", textAlign: "right", color: C.text2 }}>{r.site}%</td>
                  <td style={{ ...td, padding: "2px 8px", textAlign: "right" }}>
                    <span style={{ fontWeight: 700, fontSize: 12, padding: "1px 6px", borderRadius: 3, background: r.gap >= 10 ? C.redSoft : r.gap < 0 ? C.greenSoft : "transparent", color: r.gap >= 10 ? C.red : r.gap < 0 ? C.green : C.text2 }}>{r.gap > 0 ? "+" : ""}{r.gap}</span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ ...T.sub, marginTop: 6 }}><span style={{ color: C.red }}>●</span> Struggling across the whole Site.</div>
        </Card>
        <Grid cols="1fr" rows="auto 1fr">
          <Card title="What to raise with the department lead" sub="The four biggest gaps that have an owner.">
            {d.raise.map((r, i) => (
              <div key={r.driver} onClick={() => openDetail(r.driver)} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "7px 0", borderTop: i ? `1px solid ${C.rule}` : "none", cursor: "pointer" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{r.driver} <span style={{ fontWeight: 400, color: C.text3, fontSize: 11 }}>· {r.owner}</span></div>
                  <div style={{ fontSize: 11, color: C.text2, lineHeight: "15px" }}>{r.ask}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: C.text3, whiteSpace: "nowrap" }}><b style={{ color: C.red, fontSize: 12 }}>{r.dept}%</b><br />Site {r.site}%</div>
              </div>
            ))}
          </Card>
          <Card title="Department league table" sub="Average % Struggling across the 15 Struggling Drivers. Groups under 5 are hidden." bodyStyle={{ paddingTop: 6 }}>
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup><col style={{ width: 22 }} /><col /><col style={{ width: 46 }} /><col style={{ width: 130 }} /></colgroup>
                <tbody>{LEAGUE.map((l, i) => {
                  const on = l.dept === d.dept;
                  return (
                    <tr key={l.dept} style={{ background: on ? "#E3E8FA" : undefined, boxShadow: on ? `inset 3px 0 0 ${C.navy}` : undefined }}>
                      <td style={{ ...td, padding: "3px 4px", color: C.text3, fontSize: 11 }}>{i + 1}</td>
                      <td style={{ ...td, padding: "3px 6px", fontWeight: on ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.dept}</td>
                      <td style={{ ...td, padding: "3px 6px", textAlign: "right", color: l.people < 10 ? C.amber : C.text3, fontSize: 11 }}>{l.people}</td>
                      <td style={{ ...td, padding: "3px 6px" }}><DataBar pct={l.avg} width={70} color={l.avg > d.siteAvgStruggling ? C.redFill : "#B9C0E4"} /></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}

/* ---------------------------------------------------------------- */
/* 5 · DRIVER (was "Driver Detail")                                   */
/* ---------------------------------------------------------------- */
function DriverPage() {
  const d = DRIVER_DETAIL;
  const maxN = Math.max(...d.answers.map((a) => a.n));
  return (
    <Grid cols="1fr" rows="84px 1fr">
      <Grid cols="1fr 420px" rows="84px" style={{ height: "auto" }}>
        <Card pad={12} bodyStyle={{ justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.text2 }}>
            <span>{d.dimension.name} <Score v={d.dimension.score} /></span><span style={{ color: C.text3 }}>›</span>
            <span>{d.topic.name} <Score v={d.topic.score} /></span><span style={{ color: C.text3 }}>›</span>
            <span style={{ color: C.text }}>Driver</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{d.driver}</span>
            <Score v={d.score} size={26} /><span style={{ fontSize: 12, color: C.text3, marginLeft: -8 }}>/100</span>
            <StatusPill status={statusOf(d.score)} />
          </div>
        </Card>
        <Card pad={12}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={T.label}>People in this Driver</span><span style={{ fontSize: 11, color: C.text3 }}>{d.n} people</span></div>
          <div style={{ marginTop: 10 }}><StackBar height={18} parts={["Struggling", "Striving", "Flourishing"].map((s) => ({ value: d.split[s], color: STATUS[s].fill, label: `${d.split[s]}%` }))} /></div>
          <div style={{ display: "flex", gap: 14, marginTop: 6 }}>{["Struggling", "Striving", "Flourishing"].map((s) => <span key={s} style={{ fontSize: 11, color: C.text2, display: "flex", alignItems: "center", gap: 5 }}><i style={{ width: 8, height: 8, borderRadius: 2, background: STATUS[s].fill }} />{s}</span>)}</div>
        </Card>
      </Grid>
      <Grid cols="1fr 1fr" rows="1fr" style={{ minHeight: 0 }}>
        <Grid cols="1fr" rows="1fr 150px">
          <Card title="How people answered" sub={<>“{d.question}”</>}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 18, padding: "16px 8px 0", borderBottom: `1px solid ${C.line}` }}>
              {d.answers.map((a, i) => (
                <div key={a.label} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{a.n}</span>
                  <div style={{ width: "100%", height: `${(a.n / maxN) * 82}%`, background: ANSWER_FILL[i], borderRadius: "3px 3px 0 0" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 18, padding: "6px 8px 0" }}>{d.answers.map((a) => <span key={a.label} style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.text2 }}>{a.label}</span>)}</div>
          </Card>
          <Card title={`Other Drivers in ${d.topic.name}`}>
            <div style={{ display: "grid", gap: 10 }}>{d.siblings.map((s) => <BarRow key={s.driver} label={s.driver} value={s.score} color={st(s.score).fill} labelW={220} height={12} active={s.driver === d.driver ? true : undefined} />)}</div>
          </Card>
        </Grid>
        <Grid cols="1fr" rows="auto 1fr">
          <Card title="Who scores highest and lowest" sub="For each way of grouping people: the lowest (left) and highest (right) group's score. Wide bars = uneven experience.">
            <div style={{ display: "grid", gap: 12 }}>
              {d.groups.map((g) => (
                <div key={g.by} style={{ display: "grid", gridTemplateColumns: "84px 1fr 44px", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{g.by}</span>
                  <div>
                    <div style={{ position: "relative", height: 10, background: C.track, borderRadius: 2 }}>
                      <div style={{ position: "absolute", left: `${g.low.score}%`, width: `${g.high.score - g.low.score}%`, top: 0, bottom: 0, background: "#B9C0E4", borderRadius: 2 }} />
                      <i style={{ position: "absolute", left: `${g.low.score}%`, top: -2, width: 14, height: 14, marginLeft: -7, borderRadius: 14, background: st(g.low.score).fill, border: "2px solid #fff", boxSizing: "border-box" }} />
                      <i style={{ position: "absolute", left: `${g.high.score}%`, top: -2, width: 14, height: 14, marginLeft: -7, borderRadius: 14, background: st(g.high.score).fill, border: "2px solid #fff", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: C.text2, gap: 8 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><Score v={g.low.score} size={11} /> {g.low.group} <span style={{ color: g.low.n < 20 ? C.amber : C.text3 }}>({g.low.n})</span></span>
                      <span style={{ whiteSpace: "nowrap" }}>{g.high.group} <span style={{ color: g.high.n < 20 ? C.amber : C.text3 }}>({g.high.n})</span> <Score v={g.high.score} size={11} /></span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, textAlign: "right" }}>{g.high.score - g.low.score}<span style={{ fontSize: 10, fontWeight: 400, color: C.text3 }}> pts</span></span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Recommended actions">
            <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>{d.actions.map((a) => <li key={a} style={{ ...T.body }}>{a}</li>)}</ol>
            <div style={{ ...T.sub, marginTop: "auto" }}>The third action is cut off in the source report; show the full text with word wrap on.</div>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}
