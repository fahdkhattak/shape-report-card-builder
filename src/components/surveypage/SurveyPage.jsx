import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Undo2, Menu, MoreHorizontal } from "lucide-react";
import NavRail from "../shell/NavRail.jsx";
import Button from "../ui/Button.jsx";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsBorder } from "../../lib/ds.js";

/* ================================================================== */
/* SURVEY — the respondent's survey page, one question at a time.        */
/* Isolated: nothing else reads or writes it. Built to the user's two    */
/* design images. Desktop: a top bar (Survey | title), a section pill    */
/* (back + section name), then one card holding the question, its 0 to  */
/* 10 scale, OK, and the progress bar at the card's foot. Phone: a 44px  */
/* bar (menu, Survey, "…"), the pill, the question and scale on white,   */
/* and a full-width OK pinned at the foot. A window under 600px gets the */
/* phone page; the prototype's View switch shows it in a 375px frame.    */
/*                                                                      */
/* Long end labels: clients write long anchors ("Not maintained at all: */
/* screens, cameras…"), so the scale has four layouts and an Auto rule   */
/* that picks between them from the labels' length and the room:        */
/*   Ends      the design: labels above the two ends. Short labels.     */
/*   Key       labels above the scale as two staggered lines, 0 from    */
/*             the left edge, 10 from the right, each nearly the full   */
/*             width. Any length, scale stays horizontal, phone too.    */
/*   Anchored  labels under the scale, each tied to its end number, up   */
/*             to three lines in its half.                              */
/*   List      one row per number, the label beside 0 and 10.           */
/* The top bar's Prototype controls switch view, label length, layout.  */
/* ================================================================== */
const LABEL_SETS = {
  short: { low: "Text for Low", high: "Text for High" },
  long: {
    low: "Rarely maintained, and equipment often doesn't work",
    high: "Always well maintained, and everything works first time",
  },
  "very-long": {
    low: "Not maintained at all: screens, cameras, booking panels and climate control regularly fail, and issues take weeks to be fixed",
    high: "Fully maintained: every screen, camera, booking panel and climate control works first time, and any issue is fixed the same day",
  },
};
const QUESTION = {
  section: "Well",
  marker: "X",
  text: "Meeting rooms are well-maintained and fully functional in the following areas:",
  min: 0,
  max: 10,
};
const CHAR_W = 7; // average width of a Text sm character, for the Auto rule
const GAP = 24; // between the two end labels

const LAYOUTS = [{ id: "auto", label: "Auto" }, { id: "ends", label: "Ends" }, { id: "key", label: "Key" }, { id: "anchored", label: "Anchored" }, { id: "list", label: "List" }];
const PHONE = { w: 375, h: 812 };

// The Auto rule: Ends while each label fits one line in its half of the scale, Key for anything longer.
// The same rule on a phone: the design keeps the 0 to 10 row horizontal there too.
function autoLayout(width, low, high) {
  const half = (width - GAP) / 2;
  const longest = Math.max(low.length, high.length) * CHAR_W;
  return longest <= half ? "ends" : "key";
}

function useWidth(ref, initial = 560) {
  const [w, setW] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function useNarrowWindow(max = 600) {
  const query = `(max-width: ${max - 1}px)`;
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return narrow;
}

export default function SurveyPage({ navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder }) {
  const [value, setValue] = useState(null);
  const [done, setDone] = useState(false);
  const [labelSet, setLabelSet] = useState("short");
  const [layoutPick, setLayoutPick] = useState("auto");
  const [view, setView] = useState("desktop");
  const [chosen, setChosen] = useState(null);
  const narrow = useNarrowWindow();
  const stageRef = useRef(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const { low, high } = LABEL_SETS[labelSet];

  // Number keys pick a point (0 to 9); Enter confirms.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      if (/^[0-9]$/.test(e.key) && !done) setValue(Number(e.key));
      if (e.key === "Enter" && value != null) setDone(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [value, done]);

  // The phone frame is scaled down to fit the stage, never up.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  const q = {
    value, done, low, high, layoutPick, onLayout: setChosen,
    onPick: setValue, onConfirm: () => setDone(true), onBack: () => { setDone(false); setValue(null); },
  };

  // A real phone-width window gets the phone page, full screen, without the prototype controls.
  if (narrow) return <PhoneSurvey {...q} full />;

  const s = stage.h ? Math.min(1, (stage.h - 48) / PHONE.h, (stage.w - 32) / PHONE.w) : 1;
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: font, background: ds.bg.primary }}>
      <NavRail active="survey" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ minHeight: 44, flexShrink: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: dsSpace[16], padding: `${dsSpace[4]}px ${dsSpace[32]}px`, background: ds.surface.general.card }}>
          <span style={{ ...dsText("Text sm", 700), color: ds.text.primary }}>Survey</span>
          <span aria-hidden="true" style={{ width: 1, height: 20, background: ds.border.secondary }} />
          <span style={{ ...dsText("Text sm"), color: ds.text.secondary }}>Survey Title</span>
          {/* Prototype controls: view, label length and layout, to compare the options */}
          <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: dsSpace[12] }}>
            <span style={{ ...dsText("Text 2xs", 500), color: ds.text.tertiary }}>View</span>
            <SegmentedControl value={view} onChange={setView} options={[{ id: "desktop", label: "Desktop" }, { id: "phone", label: "Phone" }]} />
            <span style={{ ...dsText("Text 2xs", 500), color: ds.text.tertiary }}>Labels</span>
            <SegmentedControl value={labelSet} onChange={setLabelSet} options={[{ id: "short", label: "Short" }, { id: "long", label: "Long" }, { id: "very-long", label: "Very long" }]} />
            <span style={{ ...dsText("Text 2xs", 500), color: ds.text.tertiary }}>Layout</span>
            <SegmentedControl value={layoutPick} onChange={setLayoutPick} options={LAYOUTS} />
            {layoutPick === "auto" && chosen && <span data-part="auto-choice" style={{ ...dsText("Text 2xs"), color: ds.text.tertiary }}>Auto chose {LAYOUTS.find((l) => l.id === chosen)?.label}</span>}
          </div>
        </header>

        {view === "phone" ? (
          <main ref={stageRef} style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: dsSpace[24] }}>
            <div style={{ width: PHONE.w * s, height: PHONE.h * s, flexShrink: 0 }}>
              <div data-part="phone-frame" style={{ width: PHONE.w, height: PHONE.h, transform: `scale(${s})`, transformOrigin: "top left", borderRadius: 44, overflow: "hidden", boxShadow: `0 0 0 ${dsBorder.sm}px ${ds.border.secondary}, 0 24px 48px -16px rgba(35, 31, 32, 0.18)` }}>
                <PhoneSurvey {...q} />
              </div>
            </div>
          </main>
        ) : (
          <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: `${dsSpace[32]}px ${dsSpace[16]}px ${dsSpace[40]}px` }}>
            <div style={{ width: "100%", maxWidth: 688, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
              <SectionPill onBack={q.onBack} />
              {/* The question card */}
              <section style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: ds.surface.general.card, border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: 40 }}>
                <div className="scroll-minimal" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `${dsSpace[64]}px clamp(20px, 9%, 64px) ${dsSpace[24]}px` }}>
                  <QuestionHead />
                  <ScaleArea {...q} />
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: dsSpace[16], marginTop: dsSpace[24] }}>
                    {done && <span role="status" style={{ ...dsText("Text sm"), color: ds.text.secondary }}>Answer saved.</span>}
                    <Button theme="brand" variation="primary" size="md" disabled={value == null || done} onClick={q.onConfirm}>OK</Button>
                  </div>
                </div>
                <Progress done={done} />
              </section>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

/* The phone page, from the phone design image: a 44px bar (menu, Survey centred, "…"), then the pill,
   the question and the scale on white, 24px from the edges, and a full-width OK pinned 48px from the foot.
   The menu and "…" have nothing to open in this prototype. */
function PhoneSurvey(q) {
  return (
    <div data-part="phone-survey" style={{ height: q.full ? "100dvh" : "100%", display: "flex", flexDirection: "column", background: ds.surface.general.card, fontFamily: font }}>
      <header style={{ height: 44, flexShrink: 0, display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", padding: `0 ${dsSpace[4]}px`, borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}` }}>
        <button type="button" aria-label="Menu" title="Menu" style={phoneIcon}><Menu size={20} strokeWidth={1.75} /></button>
        <span style={{ textAlign: "center", ...dsText("Text sm", 700), color: ds.text.primary }}>Survey</span>
        <button type="button" aria-label="More" title="More" style={phoneIcon}><MoreHorizontal size={20} strokeWidth={1.75} /></button>
      </header>
      <div className="scroll-minimal" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `${dsSpace[24]}px ${dsSpace[24]}px ${dsSpace[24]}px` }}>
        <SectionPill onBack={q.onBack} />
        <div style={{ marginTop: dsSpace[40] }}><QuestionHead /></div>
        <ScaleArea {...q} initialWidth={327} />
        {q.done && <p role="status" style={{ margin: `${dsSpace[16]}px 0 0`, ...dsText("Text sm"), color: ds.text.secondary }}>Answer saved.</p>}
      </div>
      <div style={{ flexShrink: 0, padding: `${dsSpace[16]}px ${dsSpace[24]}px ${dsSpace[48]}px` }}>
        <Button theme="brand" variation="primary" size="md" disabled={q.value == null || q.done} onClick={q.onConfirm} style={{ width: "100%" }}>OK</Button>
      </div>
    </div>
  );
}
const phoneIcon = { width: 44, height: 44, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: ds.text.primary, cursor: "pointer", padding: 0 };

function SectionPill({ onBack }) {
  return (
    <nav aria-label="Section" style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", gap: dsSpace[16], padding: `0 ${dsSpace[24]}px`, borderRadius: dsRadius.full, background: `linear-gradient(180deg, ${ds.surface.general.card}, ${ds.bg.secondary})`, boxShadow: `0 0 0 1px ${ds.border.tertiary}` }}>
      <button type="button" aria-label="Back" title="Back" onClick={onBack} style={{ border: "none", background: "transparent", padding: 0, display: "flex", cursor: "pointer", color: ds.text.primary }}>
        <Undo2 size={20} strokeWidth={1.75} />
      </button>
      <span style={{ ...dsText("Text xs", 700), textTransform: "uppercase", color: ds.text.primary }}>{QUESTION.section}</span>
    </nav>
  );
}

function QuestionHead() {
  return (
    <div style={{ display: "flex", gap: dsSpace[16], alignItems: "flex-start" }}>
      <span aria-hidden="true" style={{ width: 28, height: 28, flexShrink: 0, marginTop: 2, borderRadius: dsRadius.full, background: ds.text.secondary, color: ds.text.inverse, display: "flex", alignItems: "center", justifyContent: "center", ...dsText("Text sm", 500) }}>{QUESTION.marker}</span>
      <h1 id="q-text" style={{ margin: 0, ...dsText("Text lg", 700), color: ds.text.primary }}>{QUESTION.text}</h1>
    </div>
  );
}

function Progress({ done }) {
  const progress = done ? 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: dsSpace[16], padding: `${dsSpace[16]}px ${dsSpace[32]}px ${dsSpace[32]}px` }}>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Survey progress" style={{ flex: 1, height: 10, borderRadius: dsRadius.full, background: ds.border.secondary, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", borderRadius: dsRadius.full, background: ds.bg.inverse, transition: "width 400ms ease" }} />
      </div>
      <span style={{ width: 36, textAlign: "right", ...dsText("Text sm"), color: ds.text.quaternary, fontVariantNumeric: "tabular-nums" }}>{progress}%</span>
    </div>
  );
}

/* The scale and its labels. Measures its own width, so the Auto rule and the Key's pins follow whatever
   holds it (the desktop card or the phone page), and reports the layout it chose. */
function ScaleArea({ value, done, low, high, layoutPick, onLayout, onPick, initialWidth }) {
  const ref = useRef(null);
  const width = useWidth(ref, initialWidth);
  const points = Array.from({ length: QUESTION.max - QUESTION.min + 1 }, (_, i) => QUESTION.min + i);
  const layout = layoutPick === "auto" ? autoLayout(width, low, high) : layoutPick;
  useEffect(() => { onLayout?.(layout); }, [layout, onLayout]);
  const scale = { points, value, done, onPick, low, high, width };
  return (
    <div ref={ref} data-layout={layout} style={{ marginTop: dsSpace[32] }}>
      {layout === "ends" && <EndsScale {...scale} />}
      {layout === "key" && <KeyScale {...scale} />}
      {layout === "anchored" && <AnchoredScale {...scale} />}
      {layout === "list" && <ListScale {...scale} />}
    </div>
  );
}

/* One horizontal strip of numbers, shared by Ends and Anchored. The group's accessible name carries both
   end labels, so a screen reader hears what 0 and 10 mean whichever layout draws them. */
function Strip({ points, value, done, onPick, low, high }) {
  return (
    <div role="radiogroup" aria-labelledby="q-text" aria-describedby="scale-ends" style={{ display: "flex", border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.md, overflow: "hidden" }}>
      <span id="scale-ends" hidden>{`${points[0]} means ${low}. ${points[points.length - 1]} means ${high}.`}</span>
      {points.map((p, i) => {
        const on = value === p;
        return (
          <button
            key={p} type="button" role="radio" aria-checked={on} disabled={done}
            onClick={() => onPick(p)}
            className="survey-point"
            style={{
              flex: 1, minWidth: 0, height: 70, border: "none", borderLeft: i ? `${dsBorder.sm}px solid ${ds.border.secondary}` : "none",
              background: on ? ds.bg.inverse : ds.surface.general.card, color: on ? ds.text.inverse : ds.text.primary,
              fontFamily: font, ...dsText("Text md", 700), cursor: done ? "default" : "pointer",
            }}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

const endLabel = { ...dsText("Text sm"), color: ds.text.secondary, maxWidth: `calc(50% - ${GAP / 2}px)`, textWrap: "pretty" };

/* Ends: the design. Labels above the two ends of the strip. */
function EndsScale(props) {
  return (
    <>
      <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: GAP, marginBottom: dsSpace[12] }}>
        <span style={endLabel}>{props.low}</span>
        <span style={{ ...endLabel, textAlign: "right" }}>{props.high}</span>
      </div>
      <Strip {...props} />
    </>
  );
}

/* Key: the two labels above the strip as staggered lines, 0 from the left edge and 10 from the right, each
   with nearly the full width, so even very long anchors take two lines rather than five. Each end number
   sits in a tag directly above its own cell, with a hairline down to the strip, so a label is never far
   from its number. The label on the side nearer the picked number darkens. */
function KeyScale(props) {
  const { points, value, low, high, width } = props;
  const first = points[0], last = points[points.length - 1], mid = (first + last) / 2;
  const near = value == null || value === mid ? null : value < mid ? "low" : "high";
  const cellW = width / points.length;
  // On a narrow scale (a phone) the stagger padding goes: the 0 label also takes the empty corner above the
  // 10 pin, so each label has as many characters per line as the width allows.
  const compact = width < 480;
  const Pin = ({ n, side }) => (
    <div style={{ gridColumn: side === "low" ? 1 : 3, gridRow: side === "low" ? "1 / span 2" : 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ minWidth: 24, height: 22, padding: "0 6px", borderRadius: dsRadius.sm, background: near === side ? ds.bg.inverse : ds.bg.secondary, color: near === side ? ds.text.inverse : ds.text.primary, ...dsText("Text xs", 700), display: "flex", alignItems: "center", justifyContent: "center", transition: "background 150ms ease, color 150ms ease" }}>{n}</span>
      <span style={{ flex: 1, width: 1, minHeight: 12, marginTop: dsSpace[4], background: near === side ? ds.border.strong : ds.border.secondary, transition: "background 150ms ease" }} />
    </div>
  );
  const text = (side) => ({ ...dsText("Text sm"), color: near === side ? ds.text.primary : ds.text.secondary, textWrap: "balance", paddingTop: 1, transition: "color 150ms ease" });
  return (
    <>
      <div aria-hidden="true" data-part="scale-key" style={{ display: "grid", gridTemplateColumns: `${cellW}px 1fr ${cellW}px`, gridTemplateRows: "auto auto", rowGap: dsSpace[12], columnGap: dsSpace[8] }}>
        <Pin n={first} side="low" />
        <span style={{ ...text("low"), gridColumn: compact ? "2 / 4" : 2, gridRow: 1, paddingRight: compact ? 0 : cellW }}>{low}</span>
        <span style={{ ...text("high"), gridColumn: 2, gridRow: 2, paddingLeft: compact ? 0 : cellW, textAlign: "right" }}>{high}</span>
        <Pin n={last} side="high" />
      </div>
      <Strip {...props} />
    </>
  );
}

/* Anchored: the strip first, then each label under its end, tied to its number by a tag, so a label that
   wraps never loses which number it explains. The label on the side nearer the picked number darkens. */
function AnchoredScale(props) {
  const { points, value, low, high } = props;
  const first = points[0], last = points[points.length - 1], mid = (first + last) / 2;
  const near = value == null || value === mid ? null : value < mid ? "low" : "high";
  const Anchor = ({ n, text, side }) => (
    <div style={{ ...endLabel, display: "flex", flexDirection: side === "high" ? "row-reverse" : "row", gap: dsSpace[8], alignItems: "flex-start", textAlign: side === "high" ? "right" : "left", color: near === side ? ds.text.primary : ds.text.secondary, transition: "color 150ms ease" }}>
      <span style={{ flexShrink: 0, minWidth: 24, height: 20, padding: "0 6px", borderRadius: dsRadius.sm, background: ds.bg.secondary, ...dsText("Text xs", 700), color: ds.text.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      <span>{text}</span>
    </div>
  );
  return (
    <>
      <Strip {...props} />
      <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: GAP, marginTop: dsSpace[12] }}>
        <Anchor n={first} text={low} side="low" />
        <Anchor n={last} text={high} side="high" />
      </div>
    </>
  );
}

/* List: one row per number, top to bottom, with the end labels written beside 0 and 10. Labels can be any
   length; this is also the phone layout. */
function ListScale({ points, value, done, onPick, low, high }) {
  const first = points[0], last = points[points.length - 1];
  return (
    <div role="radiogroup" aria-labelledby="q-text" style={{ border: `${dsBorder.sm}px solid ${ds.border.secondary}`, borderRadius: dsRadius.md, overflow: "hidden" }}>
      {points.map((p, i) => {
        const on = value === p;
        const label = p === first ? low : p === last ? high : null;
        return (
          <button
            key={p} type="button" role="radio" aria-checked={on} disabled={done}
            onClick={() => onPick(p)}
            className="survey-point"
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center", gap: dsSpace[16], padding: `${dsSpace[8]}px ${dsSpace[16]}px`,
              border: "none", borderTop: i ? `${dsBorder.sm}px solid ${ds.border.secondary}` : "none", textAlign: "left",
              background: on ? ds.bg.inverse : ds.surface.general.card, color: on ? ds.text.inverse : ds.text.primary,
              fontFamily: font, cursor: done ? "default" : "pointer",
            }}
          >
            <span style={{ width: 24, flexShrink: 0, ...dsText("Text md", 700), fontVariantNumeric: "tabular-nums" }}>{p}</span>
            {label && <span style={{ ...dsText("Text sm"), color: on ? ds.text.inverse : ds.text.secondary, textWrap: "pretty" }}>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
