import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Plus, CheckCircle2, X, ExternalLink, Info } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { GROUPS, groupById, catalogEntries, PERSONA_LABEL } from "../../lib/families.js";
import NavRail from "../shell/NavRail.jsx";
import Button from "../ui/Button.jsx";
import MiniWidgetPreview, { SLOT_W, SLOT_H, nativeForSize } from "./MiniWidgetPreview.jsx";
import { Header } from "../widgets/primitives.jsx";
import WidgetBody from "../widgets/WidgetBody.jsx";
import { cardSurface } from "../../lib/families.js";

/* ================================================================== */
/* LIBRARY — every widget, in one place (Figma 984qJvMt7fCHASYHRwgrab,   */
/* nodes 12260:50379 Widgets · 12264:59417 Hover · 12264:63187 Info).     */
/*                                                                       */
/* Widgets are listed as their own cards — one per size/persona form —    */
/* and grouped by what they show (Score, Status, ENPS, Areas to Focus…).   */
/* Each group is an accordion with a one-line description and a            */
/* horizontally paged row of cards; hovering a card gives Add / View       */
/* Detail / Remove. The Org / Personal / Team chips filter by persona.     */
/*                                                                       */
/* Left out on purpose: the Services tab and the other providers' blocks   */
/* (this pass is widgets only), and the crown/"Purchase to unlock" state.   */
/* "Created by you" will list widgets from the Widget Builder once those    */
/* can be saved — nothing is persisted yet.                                 */
/*                                                                       */
/* "In use" = on the Org report. App.jsx owns that list (`orgLibrary`), so   */
/* adding here shows up the next time the report opens.                    */
/* ================================================================== */
const SPRING = { type: "spring", bounce: 0, duration: 0.3 };
const PERSONAS = ["org", "personal", "team"];
const SHADOW = "0 1px 2px rgba(0,0,0,0.14), 0 4px 4px rgba(0,0,0,0.1), 0 10px 6px rgba(0,0,0,0.06)";

function Count({ n, dark }) {
  return <span style={{ minWidth: 20, height: 20, padding: "0 6px", boxSizing: "border-box", borderRadius: 9999, background: dark ? "rgba(255,255,255,0.2)" : T.gray75, color: dark ? T.white : T.gray700, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{n}</span>;
}

/* ---- one card in a group's row ---------------------------------------- */
function LibraryCard({ entry, inUse, onAdd, onRemove, onInfo }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: SLOT_W + 8, flexShrink: 0, fontFamily: font }}>
      <MiniWidgetPreview
        familyId={entry.familyId} formIndex={entry.formIndex} inUse={inUse} dimDisabled
        onQuickAdd={() => onAdd(entry)} onRemove={inUse ? () => onRemove(entry) : undefined} onInfo={() => onInfo(entry)}
        removeLabel="Remove from Report"
      />
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: T.gray900, textAlign: "center" }}>
        {inUse && <CheckCircle2 size={16} color={T.green} title="Added to Report" />}
        {entry.name}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T.gray500 }}>
        {entry.size}
        {entry.sample && (
          <span title="Illustrative numbers — not yet backed by survey data" style={{ fontWeight: 500, fontSize: 10, color: T.gray500, background: T.gray50, border: `1px solid ${T.gray75}`, borderRadius: 9999, padding: "0 6px", lineHeight: "16px" }}>Sample data</span>
        )}
      </span>
      <span style={{ fontSize: 12, lineHeight: "16px", color: T.gray500, textAlign: "center", maxWidth: SLOT_W + 4 }}>{entry.blurb}</span>
    </div>
  );
}

/* ---- a group's row of cards, paged with arrows --------------------------- */
function CardRow({ entries, inUseKeys, onAdd, onRemove, onInfo }) {
  const ref = useRef(null);
  const step = (SLOT_W + 8 + 16) * 3;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <button aria-label="Previous" onClick={() => ref.current?.scrollBy({ left: -step, behavior: "smooth" })} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500, flexShrink: 0, height: SLOT_H, display: "flex", alignItems: "center" }}><ChevronLeft size={18} /></button>
      <div ref={ref} style={{ display: "flex", gap: 16, overflowX: "auto", scrollbarWidth: "none", flex: 1, padding: "4px 0 8px" }}>
        {entries.map((e) => <LibraryCard key={e.key} entry={e} inUse={inUseKeys.has(e.key)} onAdd={onAdd} onRemove={onRemove} onInfo={onInfo} />)}
      </div>
      <button aria-label="Next" onClick={() => ref.current?.scrollBy({ left: step, behavior: "smooth" })} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500, flexShrink: 0, height: SLOT_H, display: "flex", alignItems: "center" }}><ChevronRight size={18} /></button>
    </div>
  );
}

/* ---- the info window ------------------------------------------------------ */
function InfoRow({ label, children, link }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", fontSize: 14 }}>
      <span style={{ color: T.gray400 }}>{label}</span>
      {link ? <ExternalLink size={16} color={T.gray700} /> : <span style={{ color: T.gray700, textDecoration: label === "Creator" || label === "Contact" ? "underline" : "none" }}>{children}</span>}
    </div>
  );
}

function WidgetInfo({ entry, onClose }) {
  const group = groupById(entry.group);
  const native = nativeForSize(entry.size);
  const box = 208, shown = entry.size === "1x1" ? 150 : entry.size === "2x2" ? 170 : 180;
  const surface = cardSurface(entry.familyId, entry.formIndex);
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(35,31,32,0.45)", zIndex: 200 }}
      />
      <div style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "56px 24px 24px", pointerEvents: "none", overflowY: "auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={SPRING}
          style={{ width: 688, maxWidth: "100%", pointerEvents: "auto", fontFamily: font }}
        >
          <div style={{ height: 52, borderRadius: 9999, background: "rgba(229,228,227,0.92)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px 0 28px", marginBottom: 8, boxSizing: "border-box" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>Widget Information</span>
            <button aria-label="Close" onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", color: T.gray700 }}><X size={20} /></button>
          </div>
          <div style={{ background: T.white, borderRadius: 32, padding: "32px 32px 28px", boxSizing: "border-box", boxShadow: SHADOW }}>
            <div style={{ fontSize: 14, color: T.gray500 }}>{group?.id}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.gray900, marginTop: 2, paddingBottom: 20, borderBottom: `1px solid ${T.gray75}` }}>{entry.name}</div>

            <div style={{ display: "flex", gap: 32, marginTop: 28, alignItems: "flex-start" }}>
              <div style={{ width: box, height: box, borderRadius: 24, background: T.gray50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: shown, height: shown, position: "relative", overflow: "hidden", borderRadius: radius.widget * (shown / native) }}>
                  <div style={{ width: native, height: native, transform: `scale(${shown / native})`, transformOrigin: "top left", background: surface.background || T.white, border: `1px solid ${surface.borderColor || T.gray100}`, borderRadius: radius.widget, padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
                    <Header title={entry.title} />
                    <WidgetBody familyId={entry.familyId} formIndex={entry.formIndex} />
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>About Widget</div>
                <p style={{ margin: "8px 0 20px", fontSize: 16, lineHeight: "24px", color: T.gray700 }}>{entry.blurb}</p>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>Widget Size</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 16, color: T.gray700 }} title="Sizes are measured in grid cells — 1x1 is one cell wide and tall, 2x2 is two by two.">
                  {entry.size} <Info size={16} color={T.gray500} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: T.gray700, background: T.gray50, border: `1px solid ${T.gray75}`, borderRadius: 9999, padding: "2px 10px" }}>{PERSONA_LABEL[entry.persona]}</span>
                  {entry.sample && <span style={{ fontSize: 12, color: T.gray700, background: T.gray50, border: `1px solid ${T.gray75}`, borderRadius: 9999, padding: "2px 10px" }}>Sample data</span>}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: T.gray900, marginTop: 36 }}>About {group?.id}</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
              {group?.about.map((p, i) => <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: "24px", color: T.gray700 }}>{p}</p>)}
            </div>

            <div style={{ fontSize: 13, letterSpacing: 0.4, color: T.gray400, marginTop: 32, paddingBottom: 6, borderBottom: `1px solid ${T.gray75}` }}>INFORMATION</div>
            <InfoRow label="Creator">SHAPE</InfoRow>
            <InfoRow label="Website" link />
            <InfoRow label="Version">1.0.0</InfoRow>
            <InfoRow label="Privacy Policy" link />
            <InfoRow label="Terms of Service" link />
            <InfoRow label="Contact">help@shapepowered.com</InfoRow>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ---- the screen ------------------------------------------------------------ */
export default function LibraryScreen({ inUse, onAdd, onRemove, onCreateWidget, navExpanded, onNavExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder }) {
  const entries = useMemo(() => catalogEntries(), []);
  const [persona, setPersona] = useState("org");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState({ Score: true });
  const [tab, setTab] = useState("others");
  const [serviceOpen, setServiceOpen] = useState(true);
  const [info, setInfo] = useState(null);

  const inUseKeys = useMemo(() => new Set(inUse), [inUse]);
  const q = query.trim().toLowerCase();
  const matches = (e) => !q || [e.name, e.title, e.blurb, e.group, e.size].some((t) => t.toLowerCase().includes(q));
  const searched = entries.filter(matches);
  const personaCount = (p) => searched.filter((e) => e.persona === p).length;
  const visible = searched.filter((e) => e.persona === persona);
  const groups = GROUPS.map((g) => ({ ...g, items: visible.filter((e) => e.group === g.id) })).filter((g) => g.items.length);
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div style={{ display: "flex", height: "100%", background: T.gray25, fontFamily: font }}>
      <NavRail active="library" expanded={navExpanded} onExpandedChange={onNavExpandedChange} onOpenSearch={onOpenSearch} onOpenReportBuilder={onOpenReportBuilder} onOpenSurveyBuilder={onOpenSurveyBuilder} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 44, background: T.white, display: "flex", alignItems: "center", padding: "0 32px", flexShrink: 0, borderBottom: `1px solid ${T.gray75}` }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>Library</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", background: T.white }}>
          <div style={{ maxWidth: 1128, margin: "0 auto", padding: "40px 32px 80px", boxSizing: "border-box" }}>
            {/* Tabs + search */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: T.gray25, border: `1px solid ${T.gray75}`, borderRadius: 9999, padding: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.gray800, color: T.white, borderRadius: 9999, padding: "8px 14px", fontSize: 14, fontWeight: 600 }}>
                Widgets <Count n={entries.length} dark />
              </div>
              <span style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: 300, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: 9999, padding: "8px 14px", boxSizing: "border-box" }}>
                <Search size={18} color={T.gray700} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search widgets" className="placeholder-gray400" style={{ border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 0, fontFamily: font, fontSize: 14, color: T.gray900 }} />
                {query && <button aria-label="Clear" onClick={() => setQuery("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex", color: T.gray500 }}><X size={14} /></button>}
              </div>
            </div>

            {/* Created by others / you */}
            <div style={{ display: "flex", alignItems: "flex-end", marginTop: 12 }}>
              <div style={{ flex: 1, display: "flex" }}>
                {[["others", "Created by others", entries.length], ["you", "Created by you", 0]].map(([id, label, n]) => (
                  <button key={id} onClick={() => setTab(id)} style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer", padding: "12px 0", fontFamily: font, fontSize: 14, fontWeight: tab === id ? 600 : 400, color: tab === id ? T.gray900 : T.gray400, borderBottom: `2px solid ${tab === id ? T.gray500 : T.gray75}`, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
                    {label} <Count n={n} />
                  </button>
                ))}
              </div>
              <Button theme="brand" variation="secondary" size="sm" shape="round" iconLeft={<Plus size={18} />} onClick={onCreateWidget} style={{ marginLeft: 40, marginBottom: 6, border: `1px solid ${T.gray800}` }}>Create Widget</Button>
            </div>

            {tab === "you" ? (
              <div style={{ textAlign: "center", padding: "72px 0", color: T.gray500 }}>
                <p style={{ margin: 0, fontSize: 15, color: T.gray700, fontWeight: 600 }}>Nothing here yet</p>
                <p style={{ margin: "6px 0 18px", fontSize: 13 }}>Widgets you build in the Widget Builder will show up here.</p>
                <Button theme="brand" variation="primary" size="sm" shape="round" onClick={onCreateWidget}>Create Widget</Button>
              </div>
            ) : (
              <>
                {/* The service these widgets belong to */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 28 }}>
                  <div style={{ width: 48, height: 48, borderRadius: radius.lg, background: T.gray50, border: `1px solid ${T.gray75}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.accent }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.gray900 }}>Performance Advantage Index</div>
                    <div style={{ fontSize: 13, color: T.gray500, textDecoration: "underline" }}>SHAPE</div>
                  </div>
                  <span style={{ border: `1px solid ${T.gray100}`, borderRadius: 9999, padding: "6px 12px", fontSize: 13, color: T.gray700 }}><b>{inUseKeys.size}</b> of {entries.length} Widgets In Use</span>
                  <button aria-label="Toggle widgets" onClick={() => setServiceOpen((v) => !v)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", color: T.gray700, transform: serviceOpen ? undefined : "rotate(-90deg)", transition: "transform 150ms ease" }}><ChevronDown size={20} /></button>
                </div>

                {serviceOpen && (
                  <>
                    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                      {PERSONAS.map((p) => {
                        const on = persona === p;
                        return (
                          <button key={p} onClick={() => setPersona(p)} style={{ border: "none", cursor: "pointer", fontFamily: font, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, borderRadius: 9999, padding: "8px 14px 8px 18px", background: on ? T.gray800 : T.gray75, color: on ? T.white : T.gray500 }}>
                            {PERSONA_LABEL[p]} <Count n={personaCount(p)} dark={on} />
                          </button>
                        );
                      })}
                    </div>
                    {persona !== "org" && (
                      <p style={{ margin: "12px 0 0", fontSize: 12, color: T.gray500 }}>
                        {PERSONA_LABEL[persona]} widgets show illustrative numbers for now — the survey has no per-{persona === "team" ? "team" : "person"} data yet.
                      </p>
                    )}

                    <div style={{ marginTop: 16 }}>
                      {groups.length === 0 && <p style={{ padding: "48px 0", textAlign: "center", fontSize: 14, color: T.gray500 }}>No widgets match “{query}”.</p>}
                      {groups.map((g) => {
                        const isOpen = q ? true : !!open[g.id];
                        return (
                          <div key={g.id} style={{ borderTop: `1px solid ${T.gray75}` }}>
                            <button onClick={() => toggle(g.id)} aria-expanded={isOpen} style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 24, padding: "18px 0", fontFamily: font, textAlign: "left" }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: T.gray900 }}>{g.id}</span>
                              <span style={{ fontSize: 14, color: T.gray700, flex: 1 }}>{g.items.length}</span>
                              <ChevronDown size={18} color={T.gray700} style={{ transform: isOpen ? "rotate(180deg)" : undefined, transition: "transform 150ms ease" }} />
                            </button>
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
                                  <p style={{ margin: "0 0 12px", fontSize: 14, color: T.gray700 }}>{g.blurb}</p>
                                  <div style={{ paddingBottom: 24 }}>
                                    <CardRow entries={g.items} inUseKeys={inUseKeys} onAdd={(e) => onAdd(e.familyId, e.formIndex)} onRemove={(e) => onRemove(e.familyId, e.formIndex)} onInfo={setInfo} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                      <div style={{ borderTop: `1px solid ${T.gray75}` }} />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>{info && <WidgetInfo key="info" entry={info} onClose={() => setInfo(null)} />}</AnimatePresence>
    </div>
  );
}
