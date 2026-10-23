import { useState } from "react";
import { User } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsShadow } from "../../../lib/ds.js";
import { StoryCard, EvidenceSection, noteText } from "./StoryCard.jsx";
import { PillTabs, ViewSwitch, CopyTable } from "./controls.jsx";
import { DataTable, tableText } from "./DataTable.jsx";
import { useOwnWidth } from "./storyWidth.js";
import Dropdown from "../../ui/Dropdown.jsx";

/* ================================================================== */
/* RELATIONSHIP STORIES (Diagnostic family): three ways of showing how   */
/* one thing goes with another, from the SHAPE survey's reports.         */
/*   QuadrantStory      Where People Sit: everyone on two measures, in   */
/*                      four zones cut at the Striving line             */
/*   WithWithoutStory   What Makes the Difference: the outcome with and   */
/*                      without something, one row each, exact test      */
/*   StatusOutcomeStory Why Flourishing Matters: an outcome per status,  */
/*                      as a 100-square waffle (a share) or a level      */
/* All are props-in components; lib/survey/insightData.js builds the     */
/* props from the dataset. They describe links, never causes.            */
/* ================================================================== */
const ZONE = { good: ds.status.success, mixed: ds.status.warning, bad: ds.status.error };
const zoneOf = (key) => (key === "1,1" ? ZONE.good : key === "0,0" ? ZONE.bad : ZONE.mixed);
const zoneNumber = (z) => (z === ZONE.mixed ? z.textStrong : z.textIndicator); // amber needs the stronger shade to read
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);
const tab = { fontVariantNumeric: "tabular-nums" };
const isMouse = (e) => e.pointerType === "mouse";
/* Long tab labels don't fit a phone-width card: there the choice becomes a dropdown. */
const Choice = ({ compact, label, tabs, value, onChange }) => (compact
  ? <Dropdown ariaLabel={label} value={value} options={tabs.map((t) => ({ value: t, label: t }))} onChange={onChange} />
  : <PillTabs label={label} tone="default" tabs={tabs} value={value} onChange={onChange} />);
/* The line under a chart that says what the hovered or picked thing is. */
const DetailLine = ({ children }) => (
  <div role="status" style={{ alignSelf: "stretch", ...dsText("Text xs"), color: ds.text.secondary, background: ds.surface.general.cardWithinCard, borderRadius: dsRadius.md, padding: `${dsSpace[8]}px ${dsSpace[12]}px`, minHeight: 20 }}>{children}</div>
);

/* ---- Where People Sit ------------------------------------------------------------------------------------------
   pairs: [{ key, label, x: { label, low, high, note }, y: {…}, cut, n, cells: [{ key "x,y", name, about, n, pct, change }],
            points: [{ id, x, y, k }] }]
   A scatter of every person on a 0 to 100 square, the four zones tinted behind them and cut at `cut`, so a zone's size is
   honest (the good corner is 40 × 40 of the scale, not a quarter). Each axis runs bad → good, so the top-right zone is always
   the good one. Each zone has a small label chip in its outer corner: share, name. Hover or tap a zone to light up its people;
   switching pairs glides every dot to its new place. */
/* Survey answers come in steps, so many people share a score. People at the same spot are packed into a small sunflower
   cluster around it (each dot still one person, the cluster's size their count), kept on their own side of the cut lines. */
function packPoints(points, cut) {
  const groups = new Map();
  points.forEach((p) => { const k = `${p.x}|${p.y}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
  const out = [];
  groups.forEach((g) => {
    const R = 1.05 * Math.sqrt(g.length - 1), pad = R + 1.1;
    const hiX = g[0].k[0] === "1", hiY = g[0].k[2] === "1";
    let cx = hiX ? Math.max(g[0].x, cut + pad) : Math.min(g[0].x, cut - pad);
    let cy = hiY ? Math.max(g[0].y, cut + pad) : Math.min(g[0].y, cut - pad);
    cx = Math.min(100 - pad, Math.max(pad, cx)); cy = Math.min(100 - pad, Math.max(pad, cy));
    g.forEach((p, i) => { const r = 1.05 * Math.sqrt(i), a = i * 2.39996; out.push({ ...p, px: cx + r * Math.cos(a), py: cy + r * Math.sin(a) }); });
  });
  return out;
}
const OUTER_CORNER = { "0,1": "borderTopLeftRadius", "1,1": "borderTopRightRadius", "0,0": "borderBottomLeftRadius", "1,0": "borderBottomRightRadius" };
const QUAD = { "0,1": ["top", "left"], "1,1": ["top", "right"], "0,0": ["bottom", "left"], "1,0": ["bottom", "right"] };
export function QuadrantStory({ title = "Where People Sit", line, pairs }) {
  const [ref, { compact }] = useOwnWidth();
  const [pairKey, setPairKey] = useState(pairs[0].key);
  const [view, setView] = useState("chart");
  const [picked, setPicked] = useState(null);
  const [hover, setHover] = useState(null);
  const q = pairs.find((p) => p.key === pairKey) || pairs[0];
  const plainName = (k) => { const [x, y] = k.split(","); return `${x === "1" ? q.x.high : q.x.low} ${q.x.label.toLowerCase()}, ${y === "1" ? q.y.high : q.y.low} ${q.y.label.toLowerCase()}`; };
  const cell = (k) => { const found = q.cells.find((c) => c.key === k); return found && { ...found, name: found.name || plainName(k), about: found.about || "" }; };
  const order = ["0,1", "1,1", "0,0", "1,0"]; // reading order: top-left, top-right, bottom-left, bottom-right
  const columns = [{ key: "name", label: "Zone" }, { key: "where", label: "Where" }, { key: "n", label: "People", align: "right" }, { key: "pct", label: "Share", align: "right", render: (r) => `${r.pct}%`, text: (r) => `${r.pct}%` }, ...(q.cells[0].change != null ? [{ key: "change", label: "Change", short: "Change", align: "right", render: (r) => `${signed(r.change)} pts`, text: (r) => `${signed(r.change)} pts` }] : [])];
  const where = plainName;
  const rows = order.map((k) => ({ ...cell(k), where: where(k) }));
  const best = cell("1,1"), worst = cell("0,0");
  const active = hover || picked;
  const pick = active ? cell(active) : null;
  const [lo, hi] = q.scale || [0, 100]; // the survey's own range; everything is drawn in % of it
  const u = (v) => ((v - lo) / (hi - lo)) * 100;
  const c = u(q.cut);
  const box = { "0,1": { left: 0, top: 0, width: c, height: 100 - c }, "1,1": { left: c, top: 0, width: 100 - c, height: 100 - c }, "0,0": { left: 0, top: 100 - c, width: c, height: c }, "1,0": { left: c, top: 100 - c, width: 100 - c, height: c } };
  const pc = (v) => `${v}%`;
  const placed = packPoints((q.points || []).map((p) => ({ ...p, x: u(p.x), y: u(p.y) })), c);
  const tickStyle = { position: "absolute", ...dsText("Text 3xs"), color: ds.text.quaternary, ...tab, lineHeight: 1 };
  const vertical = { writingMode: "vertical-rl", transform: "rotate(180deg)" };
  return (
    <div ref={ref}>
      <StoryCard title={title} data-story="insight-quadrant"
        line={line ?? `${best.pct}% of people are ${best.name.toLowerCase()} and ${worst.pct}% ${worst.name.toLowerCase()}. ${q.n} people, cut at ${q.cut} on each measure.`}
        controls={[pairs.length > 1 && <Choice key="p" compact={compact} label="Measures" tabs={pairs.map((p) => p.label)} value={q.label} onChange={(l) => { setPairKey(pairs.find((p) => p.label === l).key); setPicked(null); setHover(null); }} />, <ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows)} />]}>
        <EvidenceSection style={{ padding: dsSpace[16] }}>
          {view === "table" ? <DataTable columns={columns} rows={rows} /> : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: dsSpace[12] }}>
              <div style={{ display: "grid", gridTemplateColumns: "14px 20px minmax(0, 1fr)", columnGap: dsSpace[4], width: compact ? "100%" : 500, maxWidth: "100%" }}>
                {/* y axis: its title with the two ends (bad at the bottom), then the ticks */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", ...dsText("Text 3xs"), color: ds.text.tertiary }}>
                  <span style={vertical}>{q.y.high}</span>
                  <span style={{ ...vertical, ...dsText("Text 2xs", 700), color: ds.text.secondary }}>{q.y.label}</span>
                  <span style={vertical}>{q.y.low}</span>
                </div>
                <div style={{ position: "relative" }} aria-hidden="true">
                  {[[100, hi], [c, q.cut], [0, lo]].map(([v, l]) => <span key={v} style={{ ...tickStyle, right: 0, top: pc(100 - v), transform: `translateY(${v === 100 ? 0 : v === 0 ? -100 : -50}%)` }}>{l}</span>)}
                </div>
                <div role="group" aria-label={`${q.y.label} against ${q.x.label}, ${q.n} people`} onPointerLeave={() => setHover(null)}
                  style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: dsRadius.lg, overflow: "hidden", background: ds.surface.general.card }}>
                  {order.map((k) => {
                    const z = zoneOf(k), b = box[k], on = active === k, cl = cell(k), [v, h] = QUAD[k];
                    return (
                      <button key={k} type="button" data-part="zone" className="quad-zone" aria-pressed={picked === k} aria-label={`${cl.name}: ${cl.pct}%, ${cl.n} ${cl.n === 1 ? "person" : "people"}. ${cl.about}`}
                        onClick={() => setPicked(picked === k ? null : k)} onPointerEnter={(e) => isMouse(e) && setHover(k)} onFocus={() => setHover(k)} onBlur={() => setHover(null)}
                        style={{ position: "absolute", left: pc(b.left), top: pc(b.top), width: pc(b.width), height: pc(b.height), border: "none", borderRadius: 0, [OUTER_CORNER[k]]: dsRadius.lg, margin: 0, padding: compact ? dsSpace[6] : dsSpace[8], boxSizing: "border-box", cursor: "pointer", background: z.bg, boxShadow: on ? `inset 0 0 0 2px ${z.graph}` : "none", transition: "box-shadow 160ms ease", display: "flex", alignItems: v === "top" ? "flex-start" : "flex-end", justifyContent: h === "left" ? "flex-start" : "flex-end", fontFamily: font, outlineOffset: -2 }}>
                        <span style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: h === "left" ? "flex-start" : "flex-end", gap: 2, padding: `${dsSpace[4]}px ${dsSpace[8]}px`, borderRadius: dsRadius.md, background: ds.surface.general.card, boxShadow: dsShadow("xs"), opacity: active && !on ? 0.55 : 1, transition: "opacity 160ms ease", pointerEvents: "none", maxWidth: "100%", boxSizing: "border-box" }}>
                          <span style={{ fontSize: compact ? 16 : 20, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em", color: zoneNumber(z), ...tab }}>{cl.pct}<span style={{ fontSize: compact ? 10 : 12, fontWeight: 500 }}>%</span></span>
                          <span style={{ ...dsText(compact ? "Text 3xs" : "Text 2xs", 500), color: ds.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{cl.name}</span>
                        </span>
                      </button>
                    );
                  })}
                  {/* the people and the cut lines, over the tints and under the label chips */}
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                    <line x1={c} x2={c} y1={0} y2={100} vectorEffect="non-scaling-stroke" style={{ stroke: ds.border.strong, strokeWidth: 1, strokeDasharray: "3 3" }} />
                    <line x1={0} x2={100} y1={100 - c} y2={100 - c} vectorEffect="non-scaling-stroke" style={{ stroke: ds.border.strong, strokeWidth: 1, strokeDasharray: "3 3" }} />
                    {placed.map((p) => {
                      const dim = active && active !== p.k;
                      return <circle key={p.id} r={compact ? 1.1 : 0.9} cx={0} cy={0} style={{ transform: `translate(${p.px}px, ${100 - p.py}px)`, transition: "transform 520ms cubic-bezier(.2,.8,.2,1), opacity 160ms ease", fill: zoneOf(p.k).graph, stroke: ds.surface.general.card, strokeWidth: 0.3, opacity: dim ? 0.15 : 0.95 }} />;
                    })}
                  </svg>
                </div>
                {/* x axis: the ticks, then its title with the two ends (bad on the left) */}
                <span /><span />
                <div style={{ position: "relative", height: 16 }} aria-hidden="true">
                  {[[0, lo], [c, q.cut], [100, hi]].map(([v, l]) => <span key={v} style={{ ...tickStyle, top: 5, left: pc(v), transform: `translateX(${v === 0 ? 0 : v === 100 ? -100 : -50}%)` }}>{l}</span>)}
                </div>
                <span /><span />
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: dsSpace[8], ...dsText("Text 3xs"), color: ds.text.tertiary }}>
                  <span>{q.x.low}</span>
                  <span style={{ ...dsText("Text 2xs", 700), color: ds.text.secondary }}>{q.x.label}</span>
                  <span>{q.x.high}</span>
                </div>
              </div>
              <DetailLine>
                {pick
                  ? <><b style={{ color: ds.text.primary }}>{pick.name}</b> · {pick.n} {pick.n === 1 ? "person" : "people"} ({pick.pct}%){pick.change != null && <> · {signed(pick.change)} pts since the round before</>}. {pick.about}</>
                  : "Each dot is one person. Hover or tap a zone to see who is in it."}
              </DetailLine>
              <p style={{ ...noteText, alignSelf: "stretch" }}>High and low are split at {q.cut} on each measure (the dashed lines), so the zones are drawn to scale, not as equal quarters. People with the same two scores are grouped around that point. {q.x.label}: {q.x.note}. {q.y.label}: {q.y.note}. A link, not proof that one causes the other.</p>
            </div>
          )}
        </EvidenceSection>
      </StoryCard>
    </div>
  );
}

/* ---- What Makes the Difference ---------------------------------------------------------------------------------
   items: [{ key, offer, question, with: { n, k, pct }, without: { n, k, pct }, neutral, p, evidence, enough }]
   A small card per thing people have or don't: two circles on one baseline, the share who reach the outcome with it and
   without it, areas to scale across the whole Story (the largest share fills the largest circle). Under them, one number
   ("2.6×") and the evidence in two words. Everything else (the question, the counts, the p-value) is one hover or tap away, in
   the line under the cards, so the chart itself stays quiet. A group under 5 people shows no share (a dashed ring). */
const fmtP = (p) => (p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(p < 0.1 ? 3 : 2)}`); // three places near the 0.05 line, so 0.049 never reads as 0.05
const OFFER_COLOURS = [ds.graph.mintGreen, ds.graph.personalBlue, ds.graph.goldenYellow, ds.graph.lavenderViolet, ds.graph.turquoise, ds.graph.hotPink];
const shown = (i) => i.with.pct != null && i.without.pct != null;
export function WithWithoutStory({ title = "What Makes the Difference", line, data, outcomes, splits, onChange }) {
  const [ref, { compact, tight }] = useOwnWidth();
  const [view, setView] = useState("chart");
  const [picked, setPicked] = useState(null);
  const [hover, setHover] = useState(null);
  const { outcome, split, items } = data;
  const columns = [{ key: "offer", label: "People with…" }, { key: "w", label: "With", align: "right", render: (r) => cellText(r.with), text: (r) => cellText(r.with) }, { key: "wo", label: "Without", align: "right", render: (r) => cellText(r.without), text: (r) => cellText(r.without) }, { key: "p", label: "Test", align: "right", render: (r) => testText(r), text: (r) => testText(r) }];
  const strongest = [...items].filter(shown).sort((a, b) => (b.with.pct - b.without.pct) - (a.with.pct - a.without.pct))[0];
  const maxPct = Math.max(1, ...items.flatMap((i) => [i.with.pct, i.without.pct]).filter((v) => v != null));
  const R = tight ? 26 : compact ? 34 : 46; // radius of the largest share in the Story
  const active = items.find((i) => i.key === (hover || picked));
  return (
    <div ref={ref}>
      <StoryCard title={title} data-story="insight-withwithout"
        line={line ?? (strongest ? `People with ${strongest.offer} are more likely to ${outcome.phrase}: ${strongest.with.pct}% against ${strongest.without.pct}% without it.` : `How likely people are to ${outcome.phrase}, with and without each of these.`)}
        controls={[outcomes && <PillTabs key="o" label="Outcome" tone="default" tabs={outcomes.map((o) => o.label)} value={outcome.label} onChange={(l) => onChange?.({ outcome: outcomes.find((o) => o.label === l).key })} />, splits && <PillTabs key="s" label="People" tone="default" tabs={splits.map((s) => s.label)} value={split.label} onChange={(l) => onChange?.({ split: splits.find((s) => s.label === l).key })} />, <ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, items)} />]}>
        <EvidenceSection style={{ padding: dsSpace[16] }}>
          {view === "table" ? <DataTable columns={columns} rows={items} /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
              <div role="list" onPointerLeave={() => setHover(null)} style={{ display: "grid", gridTemplateColumns: `repeat(${compact ? 2 : 3}, minmax(0, 1fr))`, gap: compact ? dsSpace[8] : dsSpace[12] }}>
                {items.map((it, i) => (
                  <OfferCard key={it.key} it={it} colour={OFFER_COLOURS[i % OFFER_COLOURS.length]} R={R} maxPct={maxPct}
                    on={(hover || picked) === it.key} pressed={picked === it.key}
                    onPick={() => setPicked(picked === it.key ? null : it.key)} onHover={(v) => setHover(v ? it.key : null)} />
                ))}
              </div>
              <DetailLine>
                {active
                  ? <><b style={{ color: ds.text.primary }}>“{active.question}”</b> {cellSentence(active.with, "agree")}; {cellSentence(active.without, "disagree")}. {active.p == null ? "Too few to test." : `${fmtP(active.p)}.`}</>
                  : "Hover or tap a card for the question and the counts."}
              </DetailLine>
              <p style={noteText}>{split.key === "all" ? `${data.n} people.` : `${data.n} people who work ${split.label.toLowerCase() === "home" ? "from home" : split.label === "Office" ? "in the office" : "hybrid"}.`} With = agree, without = disagree. Fisher's exact test. A link, not a cause.</p>
            </div>
          )}
        </EvidenceSection>
      </StoryCard>
    </div>
  );
}
const cellText = (g) => (g.pct == null ? `${g.n} (too few)` : `${g.pct}% of ${g.n}`);
const testText = (r) => (r.p == null ? "Too few to test" : `${fmtP(r.p)} · ${r.evidence}`);
const cellSentence = (g, verb) => (g.pct == null ? `${g.n} ${verb}, too few to show` : `${g.k} of the ${g.n} who ${verb} (${g.pct}%)`);
function OfferCard({ it, colour, R, maxPct, on, pressed, onPick, onHover }) {
  const W = 4 * R + 16, H = 2 * R + 18, base = 2 * R + 2;
  const rOf = (pct) => (pct ? Math.max(4, R * Math.sqrt(pct / maxPct)) : 0);
  const ratio = shown(it) && it.without.pct ? Math.round((it.with.pct / it.without.pct) * 10) / 10 : null;
  const strong = it.p != null && it.p < 0.05;
  const circle = (g, cx, filled) => {
    const r = rOf(g.pct), inside = r >= 20, empty = !r;
    return (
      <g>
        {empty
          ? <circle cx={cx} cy={base - 11} r={10} style={{ fill: "none", stroke: ds.border.secondary, strokeWidth: 1.5, strokeDasharray: "3 3" }} />
          : <circle cx={cx} cy={base - r} r={r} style={{ fill: colour, transition: "r 420ms cubic-bezier(.2,.8,.2,1), cy 420ms cubic-bezier(.2,.8,.2,1)" }} opacity={filled ? 1 : 0.35} />}
        <text x={cx} y={empty ? base - 27 : inside ? base - r + 5 : base - 2 * r - 6} textAnchor="middle"
          style={{ fill: inside && filled ? ds.text.alwaysblack : ds.text.primary, fontFamily: font, fontSize: inside ? 16 : 13, fontWeight: 700, ...tab }}>{g.pct == null ? "–" : `${g.pct}%`}</text>
        <text x={cx} y={base + 15} textAnchor="middle" style={{ fill: ds.text.tertiary, fontFamily: font, fontSize: 10 }}>{filled ? "With" : "Without"}</text>
      </g>
    );
  };
  return (
    <button type="button" role="listitem" data-part="offer" aria-pressed={pressed}
      aria-label={`With ${it.offer}: ${it.with.pct ?? "too few"}${it.with.pct != null ? "%" : ""}. Without: ${it.without.pct ?? "too few"}${it.without.pct != null ? "%" : ""}. ${it.p == null ? "Too few to test." : it.evidence + "."}`}
      onClick={onPick} onPointerEnter={(e) => isMouse(e) && onHover(true)} onFocus={() => onHover(true)} onBlur={() => onHover(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: dsSpace[8], minWidth: 0, border: "none", borderRadius: dsRadius.lg, padding: `${dsSpace[12]}px ${dsSpace[8]}px`, background: on ? ds.interactive.ghostHover : "transparent", cursor: "pointer", fontFamily: font, transition: "background 140ms ease" }}>
      <span style={{ ...dsText("Text xs", 500), color: ds.text.secondary, textAlign: "center", minHeight: 32, display: "flex", alignItems: "center", textWrap: "balance" }}>{it.offer.charAt(0).toUpperCase() + it.offer.slice(1)}</span>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ display: "block", maxWidth: "100%", overflow: "visible" }}>
        <line x1={0} x2={W} y1={base} y2={base} style={{ stroke: ds.border.tertiary }} />
        {circle(it.with, R, true)}
        {circle(it.without, 3 * R + 16, false)}
      </svg>
      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: dsSpace[6], flexWrap: "wrap" }}>
        {shown(it)
          ? <>
              <span style={{ ...dsText("Text md", 700), color: ds.text.primary, ...tab }}>{ratio ? `${ratio}×` : `+${it.with.pct} pts`}</span>
              <span style={{ ...dsText("Text 3xs", strong ? 700 : 400), color: strong ? ds.text.secondary : ds.text.quaternary, whiteSpace: "nowrap" }}>{it.evidence}</span>
            </>
          : <span style={{ ...dsText("Text 2xs"), color: ds.text.quaternary }}>Too few to compare</span>}
      </span>
    </button>
  );
}

/* ---- Why Flourishing Matters (outcome by band) ----------------------------------------------------------------
   groups: [{ status, n, values: { [outcomeKey]: number }, tone? }], best first; outcomes: [{ key, label, kind "share" | "score",
   caption, sentence }]. Works for any survey that bands its main score (or any segmentation in order): `status` is the group's
   label, `tone` ("success" | "warning" | "error" | "neutral") picks its colour; SHAPE's three status names map to tones by
   themselves. The title defaults to "Why {best group} Matters".
   Two forms (`form`):
   - "waffle" (default): one column per group side by side, a share as 100 squares filled from the bottom, a score as the same
     square filled to its level, the number under it.
   - "people": one row per group, a share as ten figures (part-filled for parts), a score as a bar. */
const TONE_BY_STATUS = { Flourishing: "success", Striving: "warning", Struggling: "error" };
const NEUTRAL = { graph: ds.border.strong, textIndicator: ds.text.primary };
const toneOf = (g) => ds.status[g.tone || TONE_BY_STATUS[g.status]] || NEUTRAL;
export function StatusOutcomeStory({ title, line, statuses, groups, outcomes, form = "waffle" }) {
  const rows_ = groups || statuses;
  const [ref, { compact }] = useOwnWidth();
  const [key, setKey] = useState(outcomes[0].key);
  const [view, setView] = useState("chart");
  const o = outcomes.find((x) => x.key === key) || outcomes[0];
  const top = rows_[0], low = rows_[rows_.length - 1];
  const fmt = (v) => (v == null ? "–" : o.kind === "share" ? `${v}%` : `${v}`);
  const columns = [{ key: "status", label: "Group" }, { key: "n", label: "People", align: "right" }, ...outcomes.map((x) => ({ key: x.key, label: x.label, short: x.label.split(" ").slice(0, 2).join(" "), align: "right", render: (r) => (r.values[x.key] == null ? "–" : x.kind === "share" ? `${r.values[x.key]}%` : r.values[x.key]), text: (r) => String(r.values[x.key] ?? "") }))];
  const sentence = (g) => (g.values[o.key] == null ? "no answer" : o.sentence(g.values[o.key]));
  return (
    <div ref={ref}>
      <StoryCard title={title ?? `Why ${top.status.replace(/\b\w/g, (ch) => ch.toUpperCase())} Matters`} data-story="insight-status-outcome" data-form={form}
        line={line ?? `${top.status} people: ${sentence(top)}. ${low.status} people: ${sentence(low)}.`}
        controls={[outcomes.length > 1 && <Choice key="o" compact={compact} label="Outcome" tabs={outcomes.map((x) => x.label)} value={o.label} onChange={(l) => setKey(outcomes.find((x) => x.label === l).key)} />, <ViewSwitch key="v" view={view} onChange={setView} />, view === "table" && <CopyTable key="c" getText={() => tableText(columns, rows_)} />]}>
        <EvidenceSection style={{ padding: dsSpace[16] }}>
          {view === "table" ? <DataTable columns={columns} rows={rows_} /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
              {form === "people" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
                  {rows_.map((g) => {
                    const c = toneOf(g), v = g.values[o.key];
                    return (
                      <div key={g.status} data-part="status-row" style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "180px minmax(0, 1fr)", gap: compact ? dsSpace[6] : dsSpace[16], alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: dsSpace[8], minWidth: 0 }}>
                          <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", color: c.textIndicator, ...tab }}>{fmt(v)}</span>
                          <span style={{ ...dsText("Text sm", 700), color: c.textIndicator }}>{g.status}</span>
                        </div>
                        {o.kind === "share"
                          ? <People pct={v ?? 0} colour={c.graph} compact={compact} label={`${g.status}: ${fmt(v)} ${o.caption}`} />
                          : <div role="img" aria-label={`${g.status}: ${fmt(v)}, ${o.caption}`} style={{ height: 8, borderRadius: dsRadius.full, background: ds.interactive.ghostHover, overflow: "hidden" }}><div style={{ width: `${v ?? 0}%`, height: "100%", background: c.graph, borderRadius: dsRadius.full, transition: "width 520ms cubic-bezier(.2,.8,.2,1)" }} /></div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${rows_.length}, minmax(0, 1fr))`, gap: compact ? dsSpace[12] : dsSpace[32], maxWidth: 600, width: "100%", alignSelf: "center" }}>
                  {rows_.map((g) => {
                    const c = toneOf(g), v = g.values[o.key];
                    return (
                      <figure key={g.status} data-part="status-row" style={{ margin: 0, display: "flex", flexDirection: "column", gap: dsSpace[8], minWidth: 0 }}>
                        <figcaption style={{ ...dsText(compact ? "Text xs" : "Text sm", 700), color: c.textIndicator }}>{g.status}</figcaption>
                        {o.kind === "share"
                          ? <Waffle value={v ?? 0} colour={c.graph} compact={compact} label={`${g.status}: ${fmt(v)} ${o.caption}`} />
                          : <Level value={v ?? 0} colour={c.graph} label={`${g.status}: ${fmt(v)}, ${o.caption}`} />}
                        <div style={{ fontSize: compact ? 24 : 32, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: ds.text.primary, ...tab }}>{v ?? "–"}{v != null && o.kind === "share" && <span style={{ fontSize: compact ? 14 : 18, fontWeight: 500, color: ds.text.tertiary }}>%</span>}</div>
                      </figure>
                    );
                  })}
                </div>
              )}
              <p style={noteText}>{o.kind === "share" ? `${o.caption.charAt(0).toUpperCase() + o.caption.slice(1)}, by group. ${form === "people" ? "Each figure is ten percent." : "Each square is one percent."}` : `${o.caption.charAt(0).toUpperCase() + o.caption.slice(1)}, by group.`} {rows_.reduce((a, g) => a + g.n, 0)} people. A link, not a cause.</p>
            </div>
          )}
        </EvidenceSection>
      </StoryCard>
    </div>
  );
}
/* Ten figures, the last one part-filled for a part (35% fills three and a half). */
function People({ pct, colour, compact, label }) {
  const size = compact ? 22 : 30;
  return (
    <div role="img" aria-label={label} style={{ display: "flex", gap: compact ? 2 : 6 }}>
      {Array.from({ length: 10 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, pct / 10 - i));
        return (
          <span key={i} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <User size={size} strokeWidth={1.5} color={ds.border.secondary} style={{ position: "absolute", inset: 0 }} />
            <span style={{ position: "absolute", inset: 0, width: `${fill * 100}%`, overflow: "hidden", transition: `width 260ms ease ${i * 30}ms` }}><User size={size} strokeWidth={2} color={colour} /></span>
          </span>
        );
      })}
    </div>
  );
}
/* 100 squares, filled from the bottom row up, left to right. Switching outcome re-fills them with a short ripple. */
function Waffle({ value, colour, compact, label }) {
  const filled = Math.round(value);
  return (
    <div role="img" aria-label={label} style={{ display: "grid", gridTemplateColumns: "repeat(10, minmax(0, 1fr))", gap: compact ? 1.5 : 2, width: "100%", aspectRatio: "1 / 1" }}>
      {Array.from({ length: 100 }, (_, i) => {
        const order = (9 - Math.floor(i / 10)) * 10 + (i % 10), on = order < filled;
        return <span key={i} style={{ borderRadius: compact ? 1.5 : 2, background: on ? colour : ds.interactive.ghostHover, transition: `background 220ms ease ${order * 4}ms` }} />;
      })}
    </div>
  );
}
/* The same square, filled to the score (0 to 100) with faint quarter lines. */
function Level({ value, colour, label }) {
  return (
    <div role="img" aria-label={label} style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: dsRadius.md, background: ds.interactive.ghostHover, overflow: "hidden" }}>
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${value}%`, background: colour, transition: "height 520ms cubic-bezier(.2,.8,.2,1)" }} />
      {[25, 50, 75].map((t) => <span key={t} style={{ position: "absolute", left: 0, right: 0, bottom: `${t}%`, height: 1, background: ds.surface.general.card }} />)}
    </div>
  );
}
