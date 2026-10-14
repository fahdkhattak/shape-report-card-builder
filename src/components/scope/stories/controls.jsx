import { useState } from "react";
import { motion } from "motion/react";
import { BarChart3, Table, Copy, Share2, ListFilter } from "lucide-react";
import { font } from "../../../lib/tokens.js";
import { ds, dsText, dsRadius, dsSpace, dsBorder, dsShadow } from "../../../lib/ds.js";
import { ROUNDS } from "../../../lib/dataset.js";
import { LAST, roundName, fmtMonth } from "../../../lib/scopeData.js";
import SegmentedControl from "../../ui/SegmentedControl.jsx";
import Dropdown from "../../ui/Dropdown.jsx";
import { useStoryStyle } from "./storyStyle.js";

/* ================================================================== */
/* STORY CONTROLS — the Controls/Functions slot (Figma node 13622:39531). */
/* Every control here acts on its own Story only.                        */
/* ================================================================== */
const SPRING = { type: "spring", bounce: 0, duration: 0.25 };

/* The toggle in a Story's control row, Figma 13622:35955: 36 by 20, 2px padding, 16px knob. */
function Switch({ on, onChange, label }) {
  return (
    <button
      role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      style={{ width: 36, height: 20, borderRadius: dsRadius.full, border: "none", padding: dsSpace[2], cursor: "pointer", background: on ? ds.toggle.active.primary : ds.toggle.inactive.primary, display: "flex", alignItems: "center", flexShrink: 0, transition: "background 150ms ease" }}
    >
      <motion.span animate={{ x: on ? 16 : 0 }} transition={SPRING} style={{ width: 16, height: 16, borderRadius: "50%", background: on ? ds.toggle.active.toggle : ds.surface.general.card, display: "block" }} />
    </button>
  );
}

/* A compact ghost button for the control row (icon 16, text 12, 4/6 padding), Figma 13622:35956.
   The shared Button's smallest size is taller, so the control row has its own. */
export function ControlButton({ icon, children, onClick, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...rest}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: dsSpace[6], padding: `${dsSpace[4]}px ${dsSpace[6]}px`, borderRadius: dsRadius.full, border: "none", background: hover ? ds.button.brand.ghost.bg.hover : "transparent", color: ds.button.brand.ghost.items.defaultText, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap", transition: "background 120ms ease", flexShrink: 0 }}
    >
      <span aria-hidden="true" style={{ display: "flex", width: 16, height: 16, color: ds.button.brand.ghost.items.defaultIcon }}>{icon}</span>
      <span style={{ ...dsText("Text 2xs"), padding: `0 ${dsSpace[2]}px` }}>{children}</span>
    </button>
  );
}

/* State for one Story's "Compare previous rounds" toggle. Turning it on picks
   the most recent previous round; the user can pick another. */
export function useCompare() {
  const [on, setOn] = useState(false);
  const [idx, setIdx] = useState(Math.max(0, LAST - 1));
  return { on, setOn, idx, setIdx, refIdx: on ? idx : Math.max(0, LAST - 1) };
}

export function CompareControl({ cmp }) {
  const options = ROUNDS.map((_, i) => i).filter((i) => i < LAST);
  // Wraps: on a phone the round picker drops to its own line instead of pushing the card wider.
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: dsSpace[8], rowGap: dsSpace[4], fontFamily: font, maxWidth: "100%" }}>
      <label style={{ display: "flex", alignItems: "center", gap: dsSpace[8], padding: `${dsSpace[2]}px ${dsSpace[6]}px`, ...dsText("Text 2xs"), color: ds.button.brand.ghost.items.defaultText, cursor: "pointer", whiteSpace: "nowrap" }}>
        Compare previous rounds
        <Switch on={cmp.on} onChange={cmp.setOn} label="Compare previous rounds" />
      </label>
      {cmp.on && options.length > 1 && (
        <Dropdown value={cmp.idx} onChange={cmp.setIdx} ariaLabel="Round to compare with" options={options.map((i) => ({ value: i, label: `${roundName(i)} · ${fmtMonth(ROUNDS[i].date)}` }))} />
      )}
    </div>
  );
}

export function ViewSwitch({ view, onChange }) {
  // Refined: a Chart | Table switch showing both options, instead of one button whose label
  // flips to the thing you are NOT looking at.
  if (useStoryStyle() === "refined") {
    return <SegmentedControl options={[{ id: "chart", label: "Chart" }, { id: "table", label: "Table" }]} value={view} onChange={onChange} />;
  }
  const toTable = view === "chart";
  return <ControlButton icon={toTable ? <Table size={16} /> : <BarChart3 size={16} />} onClick={() => onChange(toTable ? "table" : "chart")}>{toTable ? "Table View" : "Chart View"}</ControlButton>;
}

/* Copies plain, tab-separated text. Only reports success when the browser
   actually accepted the copy. */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

function CopyButton({ label, done, icon, getText }) {
  const [state, setState] = useState(null); // null | "ok" | "fail"
  const run = async () => {
    setState((await copyText(getText())) ? "ok" : "fail");
    setTimeout(() => setState(null), 1800);
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <ControlButton icon={icon} onClick={run}>{label}</ControlButton>
      <span aria-live="polite" style={{ ...dsText("Text 2xs"), fontFamily: font, color: state === "fail" ? ds.status.error.textIndicator : ds.status.success.textIndicator }}>
        {state === "ok" ? done : state === "fail" ? "Couldn't copy" : ""}
      </span>
    </span>
  );
}
export const CopyTable = ({ getText }) => <CopyButton label="Copy Table" done="Table copied." icon={<Copy size={16} />} getText={getText} />;
export const ShareGuidance = ({ getText, label = "Share" }) => <CopyButton label={label} done="Guidance copied." icon={<Share2 size={16} />} getText={getText} />;

export function StoryTabs({ tabs, value, onChange }) {
  const refined = useStoryStyle() === "refined";
  return (
    <div role="tablist" style={{ display: "flex", gap: refined ? 28 : dsSpace[20], borderBottom: `${dsBorder.sm}px solid ${ds.border.tertiary}`, fontFamily: font, overflowX: "auto" }}>
      {tabs.map((t) => (
        <button
          key={t} role="tab" aria-selected={t === value} onClick={() => onChange(t)}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: refined ? "10px 0" : `${dsSpace[8]}px 0`, ...dsText("Text sm"), fontFamily: font, fontWeight: t === value ? (refined ? 600 : 700) : (refined ? 500 : 400), color: t === value ? ds.text.primary : ds.text.tertiary, borderBottom: `${dsBorder.md}px solid ${t === value ? ds.text.primary : "transparent"}`, marginBottom: -1, whiteSpace: "nowrap" }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* Tabs as one pill (Figma 13622:39611, Composition): a bg/primary track, the chosen tab a filled brand-primary pill
   (bg/active, light text), the rest ghost text. 12/16 text, 4/6 padding plus 2px of text padding, 24px tall. */
// `tone`: "active" (Composition 13622:39612, #504c4d) or "default" (Trend 13622:38726, #231f20); the frames use both.
export function PillTabs({ tabs, value, onChange, label, tone = "active" }) {
  return (
    <div role="tablist" aria-label={label} data-part="pill-tabs" style={{ display: "inline-flex", alignItems: "center", background: ds.bg.primary, borderRadius: dsRadius.full, fontFamily: font, maxWidth: "100%", overflowX: "auto" }}>
      {tabs.map((t) => {
        const on = t === value;
        return (
          <button
            key={t} role="tab" aria-selected={on} onClick={() => onChange(t)}
            style={{ border: "none", cursor: "pointer", borderRadius: dsRadius.full, padding: `${dsSpace[4]}px ${dsSpace[6] + dsSpace[2]}px`, ...dsText("Text 2xs"), fontFamily: font, whiteSpace: "nowrap", flexShrink: 0, background: on ? ds.button.brand.primary.bg[tone] : "transparent", color: on ? ds.button.brand.primary.items.defaultText : ds.button.brand.ghost.items.defaultText, transition: "background 120ms ease, color 120ms ease" }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ active, onClick, children, dot }) {
  // Refined: squarer, filled instead of outlined, so a row of them reads as one control.
  const refined = useStoryStyle() === "refined";
  return (
    <button
      onClick={onClick} aria-pressed={active}
      style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[6], border: refined ? `${dsBorder.sm}px solid transparent` : `${dsBorder.sm}px solid ${active ? ds.bg.inverse : ds.border.secondary}`, background: active ? ds.bg.inverse : refined ? ds.bg.primary : ds.surface.general.card, color: active ? ds.text.inverse : ds.text.secondary, borderRadius: refined ? dsRadius.md : dsRadius.full, padding: refined ? `${dsSpace[6]}px ${dsSpace[12]}px` : `${dsSpace[4]}px ${dsSpace[12]}px`, ...dsText("Text xs"), fontFamily: font, cursor: "pointer", whiteSpace: "nowrap" }}
    >
      {dot && <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />}
      {children}
    </button>
  );
}

/* "Filters" for a ranked list: choose which statuses to show. Figma 13622:36054 shows the button; what it opens
   isn't designed, so this is the smallest useful thing: a status checklist. */
export function FiltersControl({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const all = ["Flourishing", "Striving", "Struggling"];
  const off = all.length - value.length;
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <ControlButton icon={<ListFilter size={16} />} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">{off ? `Filters (${off})` : "Filters"}</ControlButton>
      {open && (
        <>
          <span onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
          <div role="group" aria-label="Show statuses" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 31, minWidth: 180, background: ds.surface.general.popover, borderRadius: dsRadius.lg, padding: dsSpace[8], boxShadow: dsShadow("md"), display: "flex", flexDirection: "column", gap: dsSpace[2], fontFamily: font }}>
            {all.map((st) => (
              <label key={st} style={{ display: "flex", alignItems: "center", gap: dsSpace[8], padding: `${dsSpace[6]}px ${dsSpace[8]}px`, borderRadius: dsRadius.md, ...dsText("Text xs"), color: ds.text.primary, cursor: "pointer" }}>
                <input type="checkbox" checked={value.includes(st)} onChange={() => onChange(value.includes(st) ? value.filter((x) => x !== st) : [...value, st])} />
                {st}
              </label>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
