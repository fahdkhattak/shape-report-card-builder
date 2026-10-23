import { useMemo, useState } from "react";
import { font } from "../../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../../lib/ds.js";
import { dsBand } from "../../../../lib/ds.js";
import { Section, Prose, Callout } from "../../docKit.jsx";
import { SimpleTable, Fact, Two, card_ } from "../../docParts.jsx";
import { DocLink } from "../../DataNeeds.jsx";
import { SURVEY, DATASET, ROUNDS, LATEST_ROUND, PEOPLE, EXPLORERS, QUESTIONS, summary, composition, answerText, personById } from "../../../../lib/survey/surveyData.js";
import { WELLBEING, WELLBEING_LEVELS } from "../../../../lib/survey/scoring.js";

/* ================================================================== */
/* DATASET PAGE — Developer › Data › SHAPE Survey · 150 people.          */
/* The generated responses (data/generate-survey-dataset.mjs), scored    */
/* live by lib/survey/scoring.js, so every number here is what the       */
/* reports will show. "One person" is a personal report's whole input.  */
/* ================================================================== */
export const meta = {
  id: "data-shape-dataset", name: "SHAPE Survey · 150 people", group: "Data", kind: "Dataset",
  blurb: "A synthetic organisation of 150 people answering the SHAPE survey over three rounds. Answers are stored; every score is worked out from them with the product's scoring rules.",
  source: "data/generate-survey-dataset.mjs → src/data/surveys/shape-survey-responses.json · lib/survey/surveyData.js",
};
export const toc = [
  { id: "overview", label: "Overview" }, { id: "rounds", label: "Rounds" }, { id: "explorers", label: "Explorers by round" },
  { id: "people", label: "Who's in it" }, { id: "wellbeing", label: "Mental well-being" }, { id: "person", label: "One person" },
  { id: "made", label: "How it was made" }, { id: "checks", label: "Checks" },
];

const r0 = (v) => (v == null ? "–" : Math.round(v));
const Num = ({ v, band = true }) => <b style={{ color: band && v != null ? dsBand(v).cs : ds.text.primary, fontVariantNumeric: "tabular-nums" }}>{r0(v)}</b>;
const Delta = ({ d }) => (d == null ? null : <span style={{ ...dsText("Text 2xs", 600), color: d > 0 ? ds.status.success.textIndicator : d < 0 ? ds.status.error.text : ds.text.tertiary, marginLeft: dsSpace[6] }}>{d > 0 ? "+" : ""}{Math.round(d)}</span>);

function Bars({ rows, total }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[6] }}>
      {rows.map(([k, n]) => (
        <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(0, 180px) 1fr 40px", gap: dsSpace[8], alignItems: "center", ...dsText("Text xs") }}>
          <span style={{ color: ds.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={k}>{k}</span>
          <span style={{ height: 8, borderRadius: 4, background: ds.bg.primary, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${(n / total) * 100}%`, background: ds.graph.personalBlue, borderRadius: 4 }} /></span>
          <span style={{ color: ds.text.primary, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

const PROFILE_ROWS = [["Name", (p) => `${p.title} ${p.firstName} ${p.lastName}`], ["Age", (p) => `${p.age} (born ${p.dateOfBirth})`], ["Gender", (p) => p.gender + (p.genderOther ? ` (${p.genderOther})` : "")], ["Country", (p) => p.country], ["Site", (p) => p.site], ["Department", (p) => p.department], ["Job title", (p) => p.jobTitle], ["Job level", (p) => p.jobLevel], ["Employment", (p) => `${p.employmentStatus}, ${p.officeHours + p.homeHours} hours (${p.officeHours} office, ${p.homeHours} home)`], ["Work model", (p) => p.workModel], ["Tenure", (p) => p.tenure], ["Education", (p) => p.education], ["Annual salary", (p) => `${p.salary.amount.toLocaleString("en-GB")} ${p.salary.currency}`], ["Ethnicity", () => "Not collected (turned off)"]];

function PersonView() {
  const [id, setId] = useState(() => PEOPLE.find((p) => Object.keys(p.rounds).length === ROUNDS.length)?.id);
  const [round, setRound] = useState(LATEST_ROUND);
  const person = personById(id);
  const answered = ROUNDS.filter((r) => person.rounds[r.id]);
  const res = person.rounds[round] || person.rounds[answered[answered.length - 1].id];
  const sel = { height: 32, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.md, padding: `0 ${dsSpace[8]}px`, fontFamily: font, ...dsText("Text xs"), color: ds.text.primary, background: ds.surface.general.card };
  const cell = { padding: `${dsSpace[6]}px ${dsSpace[12]}px`, borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, ...dsText("Text xs"), verticalAlign: "top" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[16] }}>
      <div style={{ display: "flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>Person{" "}
          <select value={id} onChange={(e) => setId(e.target.value)} style={sel}>
            {PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.profile.firstName} {p.profile.lastName} · {p.profile.department} · {Object.keys(p.rounds).length} round{Object.keys(p.rounds).length === 1 ? "" : "s"}</option>)}
          </select>
        </label>
        <label style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>Round{" "}
          <select value={round} onChange={(e) => setRound(e.target.value)} style={sel}>
            {ROUNDS.map((r) => <option key={r.id} value={r.id} disabled={!person.rounds[r.id]}>{r.label}{person.rounds[r.id] ? "" : " (didn't answer)"}</option>)}
          </select>
        </label>
      </div>
      <Two>
        <div style={card_}>
          <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Your Profile</span>
          <SimpleTable head={["Question", "Answer"]} widths={["34%", "66%"]} rows={PROFILE_ROWS.map(([k, f]) => [k, f(person.profile)])} />
        </div>
        <div style={card_}>
          <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Scores, round by round</span>
          <SimpleTable head={["Score", ...ROUNDS.map((r) => r.label)]} rows={[
            ["Overall", ...ROUNDS.map((r) => person.rounds[r.id] ? <span key={r.id}><Num v={person.rounds[r.id].scores.overall} /> <span style={{ color: ds.text.tertiary }}>{person.rounds[r.id].scores.status}</span></span> : "–")],
            ...EXPLORERS.map((e) => [e.name, ...ROUNDS.map((r) => person.rounds[r.id] ? <Num key={r.id} v={person.rounds[r.id].scores.explorers[e.id]} /> : "–")]),
            ["eNPS answer", ...ROUNDS.map((r) => person.rounds[r.id]?.scores.enps ? `${person.rounds[r.id].scores.enps.answer} · ${person.rounds[r.id].scores.enps.group}` : "–")],
            ...WELLBEING.map(({ label }) => [label, ...ROUNDS.map((r) => person.rounds[r.id]?.scores.wellbeing[label].level || "–")]),
            ["HPQ performance", ...ROUNDS.map((r) => person.rounds[r.id]?.scores.hpq ? `${person.rounds[r.id].scores.hpq.absolute}` : "–")],
          ]} />
        </div>
      </Two>
      <div style={{ overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg, maxHeight: 520, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font }}>
          <thead><tr>{["Question", "Answer", "Score", "Counts as"].map((h) => <th key={h} style={{ ...cell, position: "sticky", top: 0, background: ds.surface.general.cardWithinCard, textAlign: "left", fontWeight: 600, color: ds.text.tertiary, borderTop: "none" }}>{h}</th>)}</tr></thead>
          <tbody>
            {QUESTIONS.filter((q) => q.section !== "profile" || q.group === "hpq").map((q) => {
              const v = res.answers[q.id], text = res.comments[q.id];
              if (v == null && !text) return null;
              return (
                <tr key={q.id}>
                  <td style={{ ...cell, maxWidth: 420 }}><span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: ds.text.tertiary, marginRight: dsSpace[6] }}>{q.id}</span>{q.shortLabel || q.text}</td>
                  <td style={{ ...cell, color: ds.text.primary }}>{text ? `“${text}”` : answerText(q, v)}</td>
                  <td style={cell}>{res.scores.questions[q.id] != null ? <Num v={res.scores.questions[q.id]} band={false} /> : <span style={{ color: ds.text.quaternary }}>–</span>}</td>
                  <td style={{ ...cell, color: ds.text.tertiary }}>{q.status === "scored" ? "Scored" : q.status === "separate" ? "Shown separately" : "Not scored"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Checks, run live against the stored answers. */
function useChecks() {
  return useMemo(() => {
    let responses = 0, bad = 0, wrongAudience = 0, hybridSingle = 0;
    for (const p of PEOPLE) for (const [, r] of Object.entries(p.rounds)) {
      responses++;
      for (const [qid, v] of Object.entries(r.answers)) {
        const q = QUESTIONS.find((x) => x.id === qid);
        if (!q) { bad++; continue; }
        const one = (x) => { if (q.options.length && !(Number.isInteger(x) && x >= 0 && x < q.options.length)) bad++; };
        if (Array.isArray(v) && q.combine) v.forEach(one); else if (q.options.length) one(v);
        if ((/^SoftWE2\./.test(qid) && p.profile.workModel === "Office") || (qid === "SoftWE3" && p.profile.workModel !== "Hybrid") || (/^SoftWE4\./.test(qid) && !p.profile.manager)) wrongAudience++;
        if (q.combine && p.profile.workModel === "Hybrid" && !Array.isArray(v)) hybridSingle++;
      }
    }
    const latest = PEOPLE.filter((p) => p.rounds[LATEST_ROUND]).map((p) => p.rounds[LATEST_ROUND].scores);
    const corr = (a, b) => { const x = latest.map((s) => s.drivers[a]), y = latest.map((s) => s.drivers[b]); const mx = x.reduce((s, v) => s + v, 0) / x.length, my = y.reduce((s, v) => s + v, 0) / y.length; let n = 0, dx = 0, dy = 0; x.forEach((v, i) => { n += (v - mx) * (y[i] - my); dx += (v - mx) ** 2; dy += (y[i] - my) ** 2; }); return n / Math.sqrt(dx * dy); };
    return { responses, bad, wrongAudience, hybridSingle, corr: [["Sleep", "Stress"], ["Workload", "Work-life balance"], ["Relationship with manager", "Role clarity"], ["Exercise", "Values"]].map(([a, b]) => [a, b, corr(a, b)]) };
  }, []);
}

export default function ShapeDatasetDoc() {
  const sums = ROUNDS.map((r) => ({ r, s: summary(r.id) }));
  const last = sums[sums.length - 1].s, first = sums[0].s;
  const checks = useChecks();
  const comp = (field, title) => { const rows = composition(field); return <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>{title}</span><Bars rows={rows} total={last.n} /></div>; };
  const ageBands = (() => { const c = {}; PEOPLE.filter((p) => p.rounds[LATEST_ROUND]).forEach((p) => { const a = p.profile.age; const k = a < 25 ? "Under 25" : a < 35 ? "25 to 34" : a < 45 ? "35 to 44" : a < 55 ? "45 to 54" : "55 and over"; c[k] = (c[k] || 0) + 1; }); return ["Under 25", "25 to 34", "35 to 44", "45 to 54", "55 and over"].map((k) => [k, c[k] || 0]); })();

  return (
    <>
      <Section id="overview" title="Overview" lead="One organisation, 150 people, three rounds of the SHAPE survey. It's built from the survey record, so every answer is a real option to a question that person was actually asked.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="People" value={DATASET.meta.people} note={`${PEOPLE.filter((p) => Object.keys(p.rounds).length === ROUNDS.length).length} answered all three rounds.`} />
          <Fact label="Responses" value={checks.responses} note={sums.map(({ r, s }) => `${r.label} ${s.n}`).join(" · ")} />
          <Fact label="Overall, latest" value={<Num v={last.overall} />} note={`${r0(first.overall)} in ${ROUNDS[0].label}, ${r0(sums[1].s.overall)} in ${ROUNDS[1].label}.`} />
          <Fact label="Status, latest" value={`${last.status.Flourishing} · ${last.status.Striving} · ${last.status.Struggling}`} note="Flourishing · Striving · Struggling" />
          <Fact label="eNPS" value={sums.map(({ s }) => (s.enps > 0 ? `+${s.enps}` : s.enps)).join(" → ")} note="From Corporate Culture 2.3, round by round." />
        </div>
        <Prose>
          <p><b>The story it tells.</b> {DATASET.meta.story}</p>
          <p>Answers are stored, scores are not: every number on this page is worked out from the answers by <code>lib/survey/scoring.js</code>, the same code the reports will use, following the rules on <DocLink id="data-shape-survey">SHAPE Survey</DocLink>.</p>
        </Prose>
        <Callout title="Personal and Org reports read it differently">An Org report averages people and never shows a group under 5. A personal report is one person's own answers (pick anyone under <b>One person</b>): no groups, no one else's data.</Callout>
      </Section>

      <Section id="rounds" title="Rounds">
        <SimpleTable head={["Round", "Invited", "Answered", "Overall", "Flourishing", "Striving", "Struggling", "eNPS", "HPQ"]} rows={sums.map(({ r, s }) => [r.label, s.invited, `${s.n} (${Math.round((s.n / s.invited) * 100)}%)`, <Num key="o" v={s.overall} />, s.status.Flourishing, s.status.Striving, s.status.Struggling, s.enps, r0(s.hpq)])} />
        <Prose><p>Invited grows because people joined: anyone with under a year's tenure joined after the first or second round and only answers the rounds since.</p></Prose>
      </Section>

      <Section id="explorers" title="Explorers by round" lead="The mean of people's Explorer scores. Manager Style and Corporate Culture lift in the last round; workload pressure shows in round 2.">
        <SimpleTable head={["Explorer", ...ROUNDS.map((r) => r.label)]} rows={EXPLORERS.map((e) => [e.name, ...sums.map(({ s }, i) => <span key={i}><Num v={s.explorers[e.id]} />{i > 0 && <Delta d={s.explorers[e.id] - sums[i - 1].s.explorers[e.id]} />}</span>)])} />
      </Section>

      <Section id="people" title="Who's in it" lead={`The ${last.n} people who answered the latest round, by their Your Profile answers.`}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: dsSpace[12] }}>
          {comp("department", "Department")}
          {comp("site", "Site")}
          {comp("country", "Country")}
          {comp("workModel", "Work model")}
          {comp("jobLevel", "Job level")}
          {comp("tenure", "Employment duration")}
          {comp("employmentStatus", "Employment status")}
          {comp("gender", "Gender")}
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Age</span><Bars rows={ageBands} total={last.n} /></div>
          {comp("education", "Education")}
        </div>
      </Section>

      <Section id="wellbeing" title="Mental well-being" lead="The three DASS measures in the latest round, by level (cut-offs still open: 80 / 60 / 40 / 20 for now).">
        <SimpleTable head={["Measure", ...WELLBEING_LEVELS]} rows={WELLBEING.map(({ label, driver }) => [`${label} (${driver})`, ...WELLBEING_LEVELS.map((lv) => last.wellbeing[label][lv])])} />
      </Section>

      <Section id="person" title="One person" lead="Everything a personal report has to work with: one person's profile, their scores in each round, and every answer they gave.">
        <PersonView />
      </Section>

      <Section id="made" title="How it was made">
        <Prose>
          <p>Each person has hidden traits: a general outlook that runs through everything, plus body, mind, life outside work, job fit, manager, team, view of the organisation, workload, office and home environment, IT and pay. Department, site and work model shift them (Customer Services/Support carries the heaviest workload; home workers have a quieter environment but feel more isolated; London's office is the poorest). Each round adds its shift and a little personal drift.</p>
          <p>For each question, the traits it depends on set a target score, and the person picks the option nearest it, with noise. So answers are always real options, and things that should move together do (Sleep with Stress, Workload with Work-life balance) because they share traits, not because a formula forces it.</p>
          <p>The survey's rules are followed: home questions only for Home and Hybrid people, the office-versus-home question only for Hybrid people, the manager questions only for managers, two answers (office and home) to the work-environment questions for Hybrid people, N/A where it applies (caring for people with no dependants, commuting for home workers), and free text from about a third of people. Ethnicity is turned off (its lists are still to come) and salary is an amount in local currency (the bands are still to come).</p>
          <p>Seed {DATASET.meta.seed}: <code>npm run dataset</code> in <code>/data</code> always makes the same 150 people. Generated {DATASET.meta.generatedAt} from the survey record imported {SURVEY.source.importedAt}.</p>
        </Prose>
      </Section>

      <Section id="checks" title="Checks" lead="Run live on the stored answers.">
        <SimpleTable head={["Check", "Result"]} rows={[
          ["Every answer is a real option for its question", checks.bad === 0 ? "Pass" : `${checks.bad} invalid`],
          ["Nobody answered a question they aren't asked", checks.wrongAudience === 0 ? "Pass" : `${checks.wrongAudience} answers`],
          ["Hybrid people answer the work-environment questions twice", checks.hybridSingle === 0 ? "Pass" : `${checks.hybridSingle} single answers`],
          ...checks.corr.map(([a, b, r]) => [`Correlation: ${a} with ${b}`, `r = ${r.toFixed(2)}`]),
        ]} />
      </Section>
    </>
  );
}
