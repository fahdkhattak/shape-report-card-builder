import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Search } from "lucide-react";
import { font } from "../../../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../../../lib/ds.js";
import { Section, Prose, Callout } from "../../docKit.jsx";
import { SimpleTable, Fact } from "../../docParts.jsx";

/* ================================================================== */
/* SURVEY RECORD PAGE — Developer › Data. One survey, every question,    */
/* as the import read it (data/import-survey.js → src/data/surveys/*). */
/* Generic: give makeSurveyDoc another survey record and it draws the    */
/* same page, so more records (and a switcher later) slot in.            */
/*                                                                      */
/* What's the file's and what's proposed is always visible: a dashed    */
/* outline and the word "proposed" mark anything the file doesn't say.  */
/* ================================================================== */
const STATUS = {
  scored: { label: "Scored", tip: "Counts towards its Explorer and the overall score.", c: () => ({ bg: ds.status.success.bg, fg: ds.status.success.textIndicator }) },
  separate: { label: "Shown separately", tip: "Has a score, but it's shown on its own and never added to the Explorer or overall score.", c: () => ({ bg: ds.surface.general.selected, fg: ds.text.primary }) },
  unscored: { label: "Not scored", tip: "No score: free text, yes / no, or a count.", c: () => ({ bg: ds.bg.primary, fg: ds.text.secondary }) },
  profile: { label: "Profile", tip: "Who the person is. Used to group people, never scored.", c: () => ({ bg: ds.bg.primary, fg: ds.text.secondary }) },
  unknown: { label: "Unplaced", tip: "Not in either list.", c: () => ({ bg: ds.status.warning.bg, fg: ds.status.warning.textStrong }) },
};
const KIND = { conflict: "Conflict", gap: "Missing", naming: "Naming", wording: "Wording" };
const STATE = {
  open: { label: "Open", c: () => ({ bg: ds.status.warning.bg, fg: ds.status.warning.textStrong }) },
  "for-now": { label: "Decided for now", c: () => ({ bg: ds.surface.general.selected, fg: ds.text.primary }) },
  resolved: { label: "Answered", c: () => ({ bg: ds.status.success.bg, fg: ds.status.success.textIndicator }) },
};
/* Where a value comes from: the file, the product owner's answer, or a proposal still to be confirmed. */
const SourceMark = ({ source }) => source === "confirmed"
  ? <span title="Not in the file: confirmed by the product owner." style={{ display: "inline-flex", alignItems: "center", gap: 2, ...dsText("Text 3xs", 600), color: ds.status.success.textIndicator }}><Check size={11} aria-hidden="true" />confirmed</span>
  : source === "proposed" ? <span title="Not in the file and not confirmed yet." style={{ ...dsText("Text 3xs", 600), color: ds.status.warning.textStrong }}>proposed</span> : null;
const mono = { fontFamily: "ui-monospace, Menlo, monospace" };

const Badge = ({ status, proposed, confirmed, note }) => {
  const s = STATUS[status] || STATUS.unknown, c = s.c();
  return (
    <span title={`${s.tip}${proposed ? " Proposed: the file doesn't say." : ""}${note ? ` ${note}` : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[4], ...dsText("Text 3xs", 600), background: c.bg, color: c.fg, borderRadius: dsRadius.full, padding: `${dsSpace[2]}px ${dsSpace[8]}px`, whiteSpace: "nowrap", outline: proposed ? `${dsBorder.sm}px dashed ${ds.border.strong}` : "none", outlineOffset: 1 }}>
      {s.label}{proposed && <span style={{ fontWeight: 400 }}>· proposed</span>}{confirmed && <Check size={11} aria-label="confirmed" />}
    </span>
  );
};

const Opt = ({ label, score, proposed }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6], ...dsText("Text 2xs"), color: ds.text.secondary, background: ds.surface.general.card, border: `${dsBorder.sm}px ${proposed ? "dashed" : "solid"} ${ds.border.secondary}`, borderRadius: dsRadius.sm, padding: `1px ${dsSpace[6]}px` }}>
    {label}
    {score !== undefined && <b style={{ ...mono, fontSize: 11, color: score === null ? ds.status.error.text : score === "excluded" ? ds.text.tertiary : ds.text.primary }}>{score === null ? "no score" : score === "excluded" ? "left out" : score}</b>}
  </span>
);

const IssueLink = ({ id, state }) => <a href={`#issue-${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`issue-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} style={{ ...dsText("Text 3xs", 600), color: state === "open" ? ds.status.warning.textStrong : ds.text.tertiary, background: state === "open" ? ds.status.warning.bg : ds.bg.primary, borderRadius: dsRadius.xs, padding: `1px ${dsSpace[4]}px`, textDecoration: "none" }} title={state === "open" ? "Open question" : "Answered"}>{id}</a>;

/* A question's own options; a long list (the countries) shows its first 12 until opened. */
function Options({ q, proposedScale }) {
  const [open, setOpen] = useState(false);
  const long = q.options.length > 16, list = long && !open ? q.options.slice(0, 12) : q.options;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[4], alignItems: "center" }}>
      {list.map((o, i) => <Opt key={i} label={o} score={q.scores ? q.scores[i] : undefined} proposed={proposedScale || q.proposedOptions?.includes(o)} />)}
      {long && <button type="button" onClick={() => setOpen((v) => !v)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: font, ...dsText("Text 2xs", 600), color: ds.text.link }}>{open ? "Show fewer" : `and ${q.options.length - 12} more`}</button>}
    </div>
  );
}

function QuestionRow({ q, survey }) {
  const scale = q.scale ? survey.scales[q.scale] : null;
  const proposedScale = q.scaleSource === "proposed";
  const cell = { padding: `${dsSpace[12]}px ${dsSpace[12]}px`, verticalAlign: "top", borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}` };
  const notes = [
    q.audience && `Asked: ${q.audience}.`,
    q.parts && `Parts: ${q.parts.join(", ")}.`,
    q.followUps && q.followUps.map((f) => `Follow-up: “${f.text}” (${f.design}).`).join(" "),
    q.field && `Becomes: ${q.field}.`,
    q.derives && `Work model: ${q.derives.workModel.map(([k, w]) => `${k} (${w})`).join(", ")}.`,
    q.dependsOn && `Depends on the answer to ${q.dependsOn}.`,
    q.optionsNote,
    q.combine,
    q.renumbered && `Number restored: Excel stored it as ${q.renumbered}.`,
    q.textInFile && `File's text: “${q.textInFile}”.`,
    q.hoverInFile && `File's hover label: “${q.hoverInFile}”.`,
    q.scaleNote, q.statusNote,
  ].filter(Boolean);
  return (
    <tr id={`q-${q.id}`} style={{ scrollMarginTop: 150 }}>
      <td style={{ ...cell, width: 64 }}><span style={{ ...mono, ...dsText("Text 2xs"), color: ds.text.tertiary }}>{q.number}</span></td>
      <td style={{ ...cell, minWidth: 260 }}>
        <div style={{ ...dsText("Text sm", 500), color: ds.text.primary, textWrap: "pretty" }}>{q.text}</div>
        {(q.shortLabel || q.hoverLabel) && (
          <div style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, marginTop: dsSpace[4] }}>
            {q.shortLabel && <>Short label <b style={{ color: ds.text.secondary, fontWeight: 600 }}>{q.shortLabel}</b></>}
            {q.hoverLabel && q.hoverLabel !== q.text && <>{q.shortLabel ? " · " : ""}Hover “{q.hoverLabel}”</>}
          </div>
        )}
        {notes.length > 0 && <div style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, marginTop: dsSpace[4], maxWidth: "70ch" }}>{notes.join(" ")}</div>}
      </td>
      <td style={{ ...cell, width: 150, ...dsText("Text xs"), color: q.driver ? ds.text.primary : ds.text.quaternary }} title={q.driverNote || undefined}>
        {q.driver || "—"}
        {q.driverSource && <div><SourceMark source={q.driverSource} /></div>}
        {q.driverInFile && <div style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>File: {q.driverInFile}</div>}
      </td>
      <td style={{ ...cell, minWidth: 240 }}>
        <div style={{ ...dsText("Text 2xs"), color: ds.text.tertiary, marginBottom: dsSpace[4], display: "flex", gap: dsSpace[6], flexWrap: "wrap", alignItems: "center" }}>{q.design}{scale && <> · <span title={scale.note || ""}>{scale.name}</span><SourceMark source={q.scaleSource} /></>}{q.optionsSource && <SourceMark source={q.optionsSource} />}</div>
        {q.options.length > 0
          ? <Options q={q} proposedScale={proposedScale} />
          : scale && <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[4] }}>{scale.options.map((o, i) => <Opt key={i} label={o.label} score={o.score} proposed={proposedScale} />)}</div>}
      </td>
      <td style={{ ...cell, width: 150 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: dsSpace[6] }}>
          <Badge status={q.status} proposed={q.statusSource === "proposed"} confirmed={q.statusSource === "confirmed"} />
          {q.sensitive && <span title="Personal or sensitive. Can be turned off for a client." style={{ ...dsText("Text 3xs", 600), color: ds.text.secondary }}>Sensitive · optional</span>}
          {q.issues && <span style={{ display: "flex", gap: dsSpace[4], flexWrap: "wrap" }}>{q.issues.map((id) => <IssueLink key={id} id={id} state={survey.issues.find((i) => i.id === id)?.state} />)}</span>}
        </div>
      </td>
    </tr>
  );
}

function SectionBlock({ s, survey, filter }) {
  const groups = s.groups.map((g) => ({ ...g, questions: g.questions.filter(filter) })).filter((g) => g.questions.length);
  if (!groups.length) return null;
  const qs = s.groups.flatMap((g) => g.questions);
  const n = (st) => qs.filter((q) => q.status === st).length;
  const th = { ...dsText("Text 2xs", 600), color: ds.text.tertiary, textAlign: "left", padding: `${dsSpace[8]}px ${dsSpace[12]}px`, background: ds.surface.general.cardWithinCard };
  return (
    <div id={`sec-${s.id}`} style={{ scrollMarginTop: 150, display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: dsSpace[12], flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, ...dsText("Text lg", 600), color: ds.text.primary }}>{s.name}</h3>
        <span style={{ ...dsText("Text xs"), color: ds.text.tertiary }}>
          {qs.length} questions{s.kind === "explorer" ? ` · ${n("scored")} scored · ${n("separate")} shown separately · ${n("unscored")} not scored` : ""}
          {s.fileName && s.fileName !== s.name ? ` · “${s.fileName}” in the file` : ""}{s.aka ? ` · also called ${s.aka}` : ""}
        </span>
      </div>
      <div style={{ overflowX: "auto", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.lg }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font }}>
          <thead><tr>{["#", "Question", "Driver", "Answers and scores", "Counts as"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {groups.map((g, gi) => [
              g.text && (
                <tr key={`g${gi}`}><td colSpan={5} style={{ padding: `${dsSpace[8]}px ${dsSpace[12]}px`, background: ds.bg.secondary, borderTop: `${dsBorder.sm}px solid ${ds.border.tertiary}`, ...dsText("Text xs", 600), color: ds.text.secondary }}>{g.number ? `Q${g.number} · ` : ""}{g.text}</td></tr>
              ),
              ...g.questions.map((q) => <QuestionRow key={q.id} q={q} survey={survey} />),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function makeSurveyDoc(survey, { id, name, blurb }) {
  const sections = survey.sections;
  const all = sections.flatMap((s) => s.groups.flatMap((g) => g.questions));
  const explorers = sections.filter((s) => s.kind === "explorer");
  const meta = { id, name, group: "Data", kind: "Survey", blurb, source: `${survey.source.file} → src/data/surveys/${survey.id}.json` };
  const toc = [
    { id: "overview", label: "Overview" }, { id: "questions", label: "Every question" }, { id: "scales", label: "Scoring scales" },
    { id: "derived", label: "Worked out from answers" }, { id: "drivers", label: "Drivers" }, { id: "lists", label: "Scored and non-scored" }, { id: "enps", label: "eNPS wordings" }, { id: "issues", label: "Open questions" },
  ];

  function Page() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [issuesOnly, setIssuesOnly] = useState(false);
    const qq = query.trim().toLowerCase();
    const filter = useMemo(() => (q) => (status === "all" || q.status === status) && (!issuesOnly || q.issues?.some((id) => survey.issues.find((i) => i.id === id)?.state === "open")) && (!qq || [q.text, q.shortLabel, q.driver, q.hoverLabel, q.id, ...q.options].some((t) => t && String(t).toLowerCase().includes(qq))), [status, issuesOnly, qq]);
    const shown = all.filter(filter).length;
    const count = (st) => all.filter((q) => q.status === st).length;
    const chip = (on) => ({ border: `${dsBorder.sm}px solid ${on ? ds.border.strong : ds.border.secondary}`, background: on ? ds.bg.inverse : ds.surface.general.card, color: on ? ds.text.inverse : ds.text.secondary, borderRadius: dsRadius.full, padding: `${dsSpace[4]}px ${dsSpace[12]}px`, cursor: "pointer", fontFamily: font, ...dsText("Text xs", 500) });
    const usedBy = (k) => all.filter((q) => q.scale === k);

    return (
      <>
        <Section id="overview" title="Overview" lead="The survey as a record the product can read: every question, what each answer is worth, and whether it counts towards the score.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: dsSpace[12] }}>
            <Fact label="Questions" value={all.length} note={`In ${sections.length} sections: Your Profile and ${explorers.length} Explorers.`} />
            <Fact label="Scored" value={count("scored")} note="Count towards an Explorer and the overall score." />
            <Fact label="Shown separately" value={count("separate")} note="Scored, but never added (resilience, stress sources, HPQ…)." />
            <Fact label="Not scored" value={count("unscored")} note="Free text, yes / no, counts." />
            <Fact label="Your Profile" value={sections[0].groups.flatMap((g) => g.questions).length} note="Who people are, plus the 3 HPQ performance questions." />
            <Fact label="Drivers" value={survey.drivers.length} note="Named on scored questions." />
            <Fact label="Open questions" value={survey.issues.filter((i) => i.state === "open").length} note={`Of ${survey.issues.length} raised: ${survey.issues.filter((i) => i.state === "resolved").length} answered, ${survey.issues.filter((i) => i.state === "for-now").length} decided for now.`} />
          </div>
          <Prose>
            <p><b>Your Profile</b> is in every survey (a client can turn the sensitive questions off). It's what people are grouped by: department, site, country, job level, tenure, employment status, work model, age, gender, ethnicity, education and salary. The <b>HPQ</b> questions (Q16) rate work performance on 0 to 10 and feed Time & Money; they're never part of the SHAPE score.</p>
            <p>The <b>12 Explorers</b> give the scores. Each answer is turned into 0 to 100 with the scales below. A <b>scored</b> question counts towards its Explorer (and through it the overall score) and, if it names one, its Driver. <b>Shown separately</b> questions have a score but are kept apart, as the file says.</p>
          </Prose>
          <Callout title="Where each value comes from">Everything is read from <code style={mono}>{survey.source.file}</code> ({survey.source.sheets.join(", ")}). Where the file was silent or wrong, the product owner's answer is used and marked <b>confirmed</b> (answered {survey.decisions?.on}). Anything still waiting on an answer is marked <b>proposed</b> and drawn with a <b>dashed outline</b>. Every one links to its question at the bottom of the page.</Callout>
        </Section>

        <Section id="questions" title="Every question" lead="In the file's order, with its stem, short label, Driver, answer options and what each is worth.">
          <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8], flexWrap: "wrap", position: "sticky", top: 61, zIndex: 5, background: "color-mix(in srgb, var(--ds-color-bg-white) 94%, transparent)", backdropFilter: "blur(8px)", padding: `${dsSpace[8]}px 0` }}>
            <label style={{ display: "flex", alignItems: "center", gap: dsSpace[8], height: 32, padding: `0 ${dsSpace[12]}px`, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.full, background: ds.surface.general.card, minWidth: 220 }}>
              <Search size={14} color={ds.icon.primary} aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, Drivers, answers" aria-label="Search questions" style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontFamily: font, ...dsText("Text xs"), color: ds.text.primary }} />
            </label>
            {[["all", "All"], ["scored", "Scored"], ["separate", "Shown separately"], ["unscored", "Not scored"], ["profile", "Profile"]].map(([k, l]) => <button key={k} type="button" onClick={() => setStatus(k)} aria-pressed={status === k} style={chip(status === k)}>{l}</button>)}
            <button type="button" onClick={() => setIssuesOnly((v) => !v)} aria-pressed={issuesOnly} style={chip(issuesOnly)}>With an open question</button>
            <span style={{ ...dsText("Text xs"), color: ds.text.tertiary, marginLeft: "auto" }}>{shown} of {all.length}</span>
          </div>
          <nav aria-label="Sections" style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[6] }}>
            {sections.map((s) => <a key={s.id} href={`#sec-${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} style={{ ...dsText("Text 2xs", 500), color: ds.text.secondary, textDecoration: "none", border: `${dsBorder.sm}px solid ${ds.border.tertiary}`, borderRadius: dsRadius.full, padding: `${dsSpace[2]}px ${dsSpace[8]}px` }}>{s.name}</a>)}
          </nav>
          <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[32] }}>
            {sections.map((s) => <SectionBlock key={s.id} s={s} survey={survey} filter={filter} />)}
            {shown === 0 && <p style={{ ...dsText("Text sm"), color: ds.text.tertiary }}>No question matches.</p>}
          </div>
        </Section>

        <Section id="scales" title="Scoring scales" lead="From the “Score per response” sheet, with the sheet's own label for where each applies. Proposed scales are marked.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: dsSpace[12] }}>
            {Object.values(survey.scales).map((sc) => {
              const used = usedBy(sc.id);
              return (
                <div key={sc.id} style={{ border: `${dsBorder.sm}px ${sc.proposed ? "dashed" : "solid"} ${ds.border.secondary}`, borderRadius: dsRadius.lg, padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[8], background: ds.surface.general.card }}>
                  <span style={{ ...dsText("Text sm", 600), color: ds.text.primary, display: "flex", gap: dsSpace[8], alignItems: "center" }}>{sc.name}{sc.confirmed && <SourceMark source="confirmed" />}{sc.proposed && <SourceMark source="proposed" />}</span>
                  {sc.appliesTo && <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>Sheet says: <span style={mono}>{sc.appliesTo}</span></span>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[4] }}>{sc.options.map((o) => <Opt key={o.label} label={o.label} score={o.score} proposed={sc.proposed} />)}</div>
                  <span style={{ ...dsText("Text 2xs"), color: used.length ? ds.text.secondary : ds.status.error.text }}>{used.length ? `Used by ${used.length}: ${used.map((q) => q.id).join(", ")}` : "No question uses it."}</span>
                  {sc.note && <span style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>{sc.note}</span>}
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="derived" title="Worked out from the answers" lead="Values the product calculates rather than asks: the scores, work model, age, eNPS, the mental well-being measures and HPQ.">
          <SimpleTable head={["Value", "How", "From"]} widths={["20%", "56%", "24%"]} rows={(survey.derived || []).map((d) => [<span key="n">{d.name}<div><SourceMark source={d.source} /></div></span>, d.rule, d.from])} />
        </Section>

        <Section id="drivers" title="Drivers" lead={`The ${survey.drivers.length} Drivers on scored questions: the file's “Associated Driver” column, one renamed, and a scored question with no Driver becoming its own (named by its short label). A Driver's score is the mean of its questions.`}>
          <SimpleTable head={["Driver", "Explorer", "Questions"]} widths={["26%", "30%", "44%"]} rows={survey.drivers.map((d) => [<span key="n">{d.name}{d.nameInFile && <div style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>File: {d.nameInFile}</div>}{d.source !== "file" && <div><SourceMark source={d.source} /></div>}</span>, d.explorers.map((e) => sections.find((s) => s.id === e)?.name).join(", "), <span key="q" style={mono}>{d.questions.join(", ")}</span>])} />
        </Section>

        <Section id="lists" title="Scored and non-scored" lead="The “ScoredNonscored” sheet, as written. Excel had turned “1-6” and “1-2” into dates; the import reads the cell's own text.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: dsSpace[16] }}>
            <SimpleTable head={["Scored: Explorer", "Questions"]} rows={survey.scoredList} />
            <SimpleTable head={["Non-scored: Explorer", "Question"]} rows={survey.nonScoredList} />
          </div>
        </Section>

        <Section id="enps" title="eNPS wordings" lead="The “eNPS” sheet, as written. The survey itself uses the 0 to 10 version, as Corporate Culture 2.3.">
          <SimpleTable head={["#", "Option 1", "Option 2", "Type"]} rows={survey.enps.map((r) => [r[0], r[1], r[2], r[3]])} />
        </Section>

        <Section id="issues" title="Open questions" lead="Where the file was silent or disagreed with itself. Open ones first, with the value used until they're answered; answered ones keep the answer.">
          <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[12] }}>
            {["open", "for-now", "resolved"].flatMap((st) => survey.issues.filter((i) => (i.state || "open") === st)).map((iss) => {
              const st = STATE[iss.state || "open"], c = st.c();
              return (
                <div key={iss.id} id={`issue-${iss.id}`} style={{ scrollMarginTop: 120, border: `${dsBorder.sm}px ${iss.state === "open" ? "dashed" : "solid"} ${iss.state === "open" ? ds.border.strong : ds.border.tertiary}`, borderRadius: dsRadius.lg, padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[6], background: iss.state === "resolved" ? "transparent" : ds.surface.general.card }}>
                  <div style={{ display: "flex", alignItems: "center", gap: dsSpace[8], flexWrap: "wrap" }}>
                    <span style={{ ...mono, ...dsText("Text 2xs", 600), color: ds.text.secondary }}>{iss.id}</span>
                    <span style={{ ...dsText("Text 3xs", 600), background: c.bg, color: c.fg, borderRadius: dsRadius.full, padding: `1px ${dsSpace[8]}px` }}>{st.label}</span>
                    <span style={{ ...dsText("Text 3xs", 600), textTransform: "uppercase", letterSpacing: "0.04em", color: ds.text.tertiary }}>{KIND[iss.kind]}</span>
                    <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>{iss.title}</span>
                  </div>
                  <span style={{ ...dsText("Text sm"), color: ds.text.secondary, maxWidth: "80ch" }}>{iss.detail}</span>
                  {iss.answer && <span style={{ ...dsText("Text sm"), color: ds.text.primary, maxWidth: "80ch" }}><b>Answer:</b> {iss.answer}</span>}
                  {iss.proposal && <span style={{ ...dsText("Text sm"), color: ds.text.primary, maxWidth: "80ch" }}><b>Used for now:</b> {iss.proposal}</span>}
                  {iss.qs.length > 0 && (
                    <span style={{ display: "flex", flexWrap: "wrap", gap: dsSpace[4], ...dsText("Text 2xs"), color: ds.text.tertiary, alignItems: "center" }}>
                      Questions:{iss.qs.map((qid) => <a key={qid} href={`#q-${qid}`} onClick={(e) => { e.preventDefault(); document.getElementById(`q-${qid}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} style={{ ...mono, color: ds.text.link }}>{qid}</a>)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      </>
    );
  }
  return { meta, toc, Page };
}
