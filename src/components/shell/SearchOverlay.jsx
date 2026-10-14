import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Search, Briefcase, LayoutGrid, MessageSquare, FileText, Building2, Wand2, BookOpen,
  Settings, Bell, Star, ArrowLeftRight, LogOut, X, Clock, Frown,
} from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { FAMILIES } from "../../lib/families.js";
import { SAMPLE_REPORTS, SAMPLE_DRAFTS } from "./navRailData.js";
import { SERVICES } from "../chat/AttachMenu.jsx";
import { dimensionRankedRows } from "../../lib/dataset.js";
import Button from "../ui/Button.jsx";

/* ================================================================== */
/* SEARCH OVERLAY — the product-wide command palette, opened from        */
/* NavRail's "Search" nav item or Cmd/Ctrl+K from anywhere.               */
/*                                                                        */
/* Rebuilt against a real Figma reference (984qJvMt7fCHASYHRwgrab, node   */
/* 13750:16126, "Search Function" — 6 annotated states: first-use empty,  */
/* returning-user empty, active results, loading, no-results, and a       */
/* fuller results reference). Previously this file had no design           */
/* reference at all and explored 3 visual "materials" live (solid/light-   */
/* glass/dark-glass) via a prototype-only switcher — that open question    */
/* is now resolved by the Figma node itself, which shows a plain solid      */
/* white card over a flat dark scrim, not a frosted/blurred one. The        */
/* switcher and the other two themes are removed; every color/spacing/      */
/* shadow value below is sampled directly off that node's real nodes         */
/* (13750:16469/16221/16333/16412), not eyeballed.                          */
/*                                                                        */
/* Six behavioral pieces this rebuild adds, one per annotated state:       */
/*  - First-use vs. returning landing views (see `recentSearches.length`   */
/*    check below) — a session with no real search history yet shows        */
/*    "Suggested Search" (today's real worst-3 dimensions, same signal      */
/*    ChatLanding's own starter chips use) + "Featured Services"; once a    */
/*    real search has happened, it's Recent Searches + Recent Drafts, as     */
/*    before.                                                               */
/*  - A real ~300ms debounce between the raw `query` (what the input        */
/*    shows) and `debouncedQuery` (what filtering/tabs run against) — the   */
/*    gap between them drives a genuine loading state (3 skeleton rows +    */
/*    "Searching records...", tabs hidden), not an instant synchronous      */
/*    filter.                                                               */
/*  - "No results" redesigned to the reference's actual dead-end treatment  */
/*    — sad-face icon, two-line copy, a "Clear Search" button — plus three  */
/*    fallback chips rendered *below* the card itself, not inside it        */
/*    ("Explore Services" has a real destination, `onGoLibrary`; "Create a  */
/*    Service"/"Review Insights" close the palette with no other effect,    */
/*    the same honest-inert treatment already used for Services/Reports/    */
/*    Drafts/Settings results below).                                       */
/*  - Sections cap at 3 (was 5) with a real "See all" link that jumps to     */
/*    that section's own tab — matches the reference's own per-section cap. */
/*  - An "OWNED" badge on Services/Widgets results, sourced from a real      */
/*    `owned` flag on FAMILIES/SERVICES (see families.js's and               */
/*    AttachMenu.jsx's own comments for what "owned" means for each — it's   */
/*    not fabricated per-item, it's derived from what this app actually      */
/*    seeds/uses by default).                                                */
/*  - Type-specific secondary text — Drafts show recency (`SAMPLE_DRAFTS`'s  */
/*    new `edited` field), Reports show a one-line description               */
/*    (`SAMPLE_REPORTS`'s new `blurb` field), Services/Widgets show "SHAPE"  */
/*    / category — matching the reference's own "secondary info is type-     */
/*    specific" annotation.                                                  */
/* ================================================================== */

const TOOLS = [
  { id: "home", label: "Home", sub: "Chat with the mascot", icon: MessageSquare },
  { id: "store", label: "Store", sub: "View your report canvas", icon: Building2 },
  { id: "create", label: "Create", sub: "Start a new blank canvas", icon: Wand2 },
  { id: "library", label: "Library", sub: "Browse widgets to add", icon: BookOpen },
];

const SETTINGS_ITEMS = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "rate-us", label: "Rate Us", icon: Star },
  { id: "switch-accounts", label: "Switch Accounts", icon: ArrowLeftRight },
  { id: "sign-out", label: "Sign out", icon: LogOut },
];

// Order matches the reference's own tab order (All / Drafts / Services /
// Reports / Widgets) — Tools/Settings appended after, still real and
// searchable, just outside the sampled node.
const ALL_SECTIONS = [
  { key: "drafts", label: "Drafts", icon: MessageSquare, items: SAMPLE_DRAFTS.map((d) => ({ id: d.id, label: d.name, sub: d.edited })) },
  { key: "services", label: "Services", icon: Briefcase, items: SERVICES.map((s) => ({ id: s.id, label: s.label, sub: "SHAPE", owned: s.owned, color: s.color })) },
  { key: "reports", label: "Reports", icon: FileText, items: SAMPLE_REPORTS.map((r) => ({ id: r.id, label: r.name, sub: r.blurb })) },
  { key: "widgets", label: "Widgets", icon: LayoutGrid, items: FAMILIES.map((f) => ({ id: f.id, label: f.name, sub: f.category, familyId: f.id, owned: f.owned })) },
  { key: "tools", label: "Tools", items: TOOLS },
  { key: "settings", label: "Settings", items: SETTINGS_ITEMS },
];

const MAX_PER_SECTION = 3; // the reference caps every section at 3 + "See all"
const RECENT_SEARCHES_KEY = "shape-search-recent-queries";
const RECENT_SEARCHES_MAX = 5;
const RECENT_DRAFTS_MAX = 2; // matches the reference's "2 most recently edited Drafts"
const SEARCH_DEBOUNCE_MS = 300; // matches the Loading state's own "debounce ~300ms" annotation
const SPRING = { type: "spring", bounce: 0, duration: 0.28 };

// Sampled off node 13750:16469's real shadow tokens (Shadow/shadow-md, 5
// DROP_SHADOW layers) rather than the old hand-guessed two-layer shadow.
const CARD_SHADOW = "0px 1px 2px rgba(0,0,0,0.14), 0px 3px 3px rgba(0,0,0,0.12), 0px 8px 5px rgba(0,0,0,0.07), 0px 14px 6px rgba(0,0,0,0.02), 0px 22px 6px rgba(0,0,0,0.01)";
// The active-tab pill's real color — Figma's own "brand/primary/bg/hover"
// token (#3A3737), one shade lighter than T.gray800 — same value Button.jsx
// already uses for that exact state, sampled here rather than approximated.
const TAB_ACTIVE_BG = "#3A3737";

function matches(text, q) {
  return !q || (text || "").toLowerCase().includes(q);
}

// Real, non-fabricated suggested searches for the first-use empty state —
// today's three worst-scoring dimensions, the same signal ChatLanding's own
// `liveStarterChips()` already surfaces, not a hardcoded list.
function suggestedSearches() {
  return dimensionRankedRows().slice(-3).reverse().map(([name]) => name);
}

export default function SearchOverlay({ open, onClose, onGoHome, onGoStore, onGoCreate, onGoLibrary, onAddWidget }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggested] = useState(suggestedSearches);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"); } catch { return []; }
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setActiveTab("all");
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  // The input reflects `query` instantly; filtering/tabs run against
  // `debouncedQuery`, which only catches up SEARCH_DEBOUNCE_MS after typing
  // stops — the gap between the two IS the loading state below. Clearing
  // the query skips the wait, since there's nothing to debounce back to.
  useEffect(() => {
    const q = query.trim();
    if (!q) { setDebouncedQuery(""); return; }
    const t = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const isLanding = !query.trim();
  const isLoading = !isLanding && query.trim().toLowerCase() !== debouncedQuery.trim().toLowerCase();

  // Every section filtered against the debounced query — also what decides
  // which tabs are offered (a section with zero matches gets no tab).
  const matchingSections = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items
        .filter((it) => matches(it.label, q) || matches(it.sub, q))
        .map((it) => ({ ...it, _section: sec.key, _icon: it.icon || sec.icon })),
    })).filter((sec) => sec.items.length > 0);
  }, [debouncedQuery]);

  // Tabs (and the FilterBar itself) are hidden during landing AND loading —
  // matches the reference's Loading frame, where FilterBar stays hidden too.
  const showTabs = !isLanding && !isLoading;
  const tabs = useMemo(
    () => (showTabs ? [{ key: "all", label: "All" }, ...matchingSections.map((s) => ({ key: s.key, label: s.label }))] : []),
    [showTabs, matchingSections]
  );

  useEffect(() => {
    if (isLanding) { setActiveTab("all"); return; }
    if (activeTab !== "all" && !matchingSections.some((s) => s.key === activeTab)) setActiveTab("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, matchingSections]);

  const displaySections = useMemo(() => {
    if (isLanding) {
      if (recentSearches.length === 0) {
        // First-ever use of this session — no real history to show yet.
        return [
          { key: "suggested", label: "Suggested Search", items: suggested.map((q) => ({ id: q, label: q, _section: "recent-search", _icon: Search })) },
          {
            key: "featured-services", label: "Featured Services", seeAll: true,
            items: SERVICES.slice(0, 2).map((s) => ({ id: s.id, label: s.label, sub: "SHAPE", _section: "services", color: s.color })),
          },
        ];
      }
      return [
        { key: "recent-searches", label: "Recent Searches", items: recentSearches.map((q) => ({ id: q, label: q, _section: "recent-search", _icon: Search })) },
        { key: "recent-drafts", label: "Recent Drafts", items: SAMPLE_DRAFTS.slice(0, RECENT_DRAFTS_MAX).map((d) => ({ id: d.id, label: d.name, sub: d.edited, _section: "drafts", _icon: MessageSquare })) },
      ];
    }
    if (isLoading) return [];
    if (activeTab === "all") {
      return matchingSections.map((sec) => ({ ...sec, _hasMore: sec.items.length > MAX_PER_SECTION, items: sec.items.slice(0, MAX_PER_SECTION) }));
    }
    return matchingSections.filter((s) => s.key === activeTab);
  }, [isLanding, isLoading, matchingSections, activeTab, recentSearches, suggested]);

  const isNoResults = !isLanding && !isLoading && matchingSections.length === 0;
  const totalResults = !isLanding && !isLoading ? matchingSections.reduce((n, s) => n + s.items.length, 0) : null;

  const flat = useMemo(() => displaySections.flatMap((sec) => sec.items), [displaySections]);

  useEffect(() => { setActiveIndex(0); }, [debouncedQuery, activeTab]);

  // Funnels every way the palette can close through one place so a real,
  // completed search always gets remembered — whether the user picked a
  // result, hit Escape, clicked the scrim, or clicked the X.
  const closeAndCommit = () => {
    const q = query.trim();
    if (q.length >= 2) {
      setRecentSearches((prev) => {
        const next = [q, ...prev.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_SEARCHES_MAX);
        try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch { /* private-browsing/storage-disabled — just won't persist */ }
        return next;
      });
    }
    onClose();
  };

  const clearQuery = () => { setQuery(""); inputRef.current?.focus(); };

  const activate = (item) => {
    if (!item) return;
    // A past (or suggested) search, clicked from the landing view — re-run
    // it rather than "activating" it; the palette stays open so the query
    // immediately shows real filtered/tabbed results.
    if (item._section === "recent-search") {
      setQuery(item.label);
      inputRef.current?.focus();
      return;
    }
    if (item._section === "widgets") {
      onAddWidget(item.familyId, 0);
    } else if (item._section === "tools") {
      if (item.id === "home") onGoHome();
      else if (item.id === "store") onGoStore();
      else if (item.id === "create") onGoCreate();
      else if (item.id === "library") onGoLibrary();
    }
    // Services/Reports/Drafts/Settings: no real destination exists yet —
    // just close, same as clicking any of those elsewhere in this app today.
    closeAndCommit();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { closeAndCommit(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, flat.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter") { e.preventDefault(); activate(flat[activeIndex]); }
  };

  const fallbackChips = [
    { id: "explore", label: "Explore Services", onClick: () => { onGoLibrary(); closeAndCommit(); } },
    { id: "create-service", label: "Create a Service", onClick: closeAndCommit },
    { id: "insights", label: "Review Insights", onClick: closeAndCommit },
  ];

  return (
    <motion.div
      onClick={closeAndCommit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING}
      style={{ position: "fixed", inset: 0, background: "rgba(35,31,32,0.4)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "12vh" }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={SPRING}
        style={{ width: 688, maxWidth: "90vw", maxHeight: "70vh", background: T.white, borderRadius: radius.modal, boxShadow: CARD_SHADOW, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderBottom: `1px solid ${T.gray100}`, flexShrink: 0 }}>
          <Search size={20} color={T.gray400} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search for anything"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: font, color: T.gray900 }}
          />
          {query && (
            <span onClick={clearQuery} style={{ fontSize: 12, fontFamily: font, color: T.gray700, textDecoration: "underline", cursor: "pointer", flexShrink: 0 }}>
              Clear
            </span>
          )}
          <Button theme="brand" variation="ghost" size="xs" iconLeft={<X size={20} />} onClick={closeAndCommit} />
        </div>

        {showTabs && tabs.length > 0 && (
          <div style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto", flexShrink: 0, borderBottom: `1px solid ${T.gray75}` }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                    padding: "4px 16px", borderRadius: radius.full, fontSize: 14, fontFamily: font,
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? TAB_ACTIVE_BG : "transparent",
                    color: isActive ? T.gray75 : T.gray400,
                    transition: "background 100ms ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ overflowY: "auto", padding: "4px 0", minHeight: 160 }}>
          {isLoading ? (
            <>
              <div style={{ padding: "8px 24px 4px" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.gray300, textTransform: "uppercase", letterSpacing: 0.4, fontFamily: font }}>Searching records...</span>
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: radius.md, background: T.gray75, flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                    <div style={{ height: 12, width: "62%", maxWidth: 320, borderRadius: 4, background: T.gray75 }} />
                    <div style={{ height: 8, width: "38%", maxWidth: 192, borderRadius: 4, background: T.gray100 }} />
                  </div>
                </div>
              ))}
            </>
          ) : isNoResults ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 24px" }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: T.gray75, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Frown size={32} color={T.gray500} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", textAlign: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: T.gray900, fontFamily: font }}>Sorry we couldn't find any results</span>
                <span style={{ fontSize: 14, color: T.gray500, fontFamily: font }}>Try searching for something else</span>
              </div>
              <Button theme="brand" variation="primary" size="xs" onClick={clearQuery}>Clear Search</Button>
            </div>
          ) : (
            displaySections.map((sec) => (
              <div key={sec.key} style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 24px 4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, color: T.gray300, textTransform: "uppercase", letterSpacing: 0.4, fontFamily: font }}>
                    {(sec.key === "recent-searches" || sec.key === "recent-drafts") && <Clock size={11} />}
                    {sec.label}
                  </div>
                  {(sec._hasMore || sec.seeAll) && (
                    <span
                      onClick={sec._hasMore ? () => setActiveTab(sec.key) : undefined}
                      style={{ fontSize: 12, fontFamily: font, color: T.gray700, textDecoration: "underline", cursor: sec._hasMore ? "pointer" : "default", opacity: sec._hasMore ? 1 : 0.7 }}
                    >
                      See all
                    </span>
                  )}
                </div>
                {sec.items.map((it) => {
                  const flatIndex = flat.indexOf(it);
                  const isActive = flatIndex === activeIndex;
                  const Icon = it.icon || it._icon;
                  return (
                    <div
                      key={`${sec.key}-${it.id}`}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => activate(it)}
                      style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px", background: isActive ? T.gray50 : "transparent", cursor: "pointer" }}
                    >
                      {it.color ? (
                        <div style={{ width: 32, height: 32, borderRadius: radius.md, background: T.white, border: `1px solid ${T.gray100}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 11, background: T[it.color] }} />
                        </div>
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: radius.md, background: T.gray50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={16} color={T.gray700} />
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font, color: T.gray700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                        {it.sub && <span style={{ fontSize: 12, fontFamily: font, color: T.gray300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.sub}</span>}
                      </div>
                      {it.owned && (
                        <span style={{ fontSize: 11, fontFamily: font, color: T.gray700, background: T.gray50, borderRadius: radius.full, padding: "4px 6px", flexShrink: 0 }}>OWNED</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 24px 10px", borderTop: `1px solid ${T.gray75}`, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontFamily: font, color: T.gray500 }}>{totalResults !== null ? `${totalResults} Result${totalResults === 1 ? "" : "s"}` : ""}</span>
          <div style={{ display: "flex", gap: 12 }}>
            {[["Navigate", "↑↓"], ["Open", "↵"], ["Close", "esc"]].map(([label, key]) => (
              <span key={label} style={{ fontSize: 11, fontFamily: font, color: T.gray500 }}>
                <span style={{ color: T.gray300 }}>{label} </span>
                <b>{key}</b>
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {isNoResults && (
        <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {fallbackChips.map((c) => (
            <button
              key={c.id}
              onClick={c.onClick}
              style={{ border: `1px solid ${T.gray100}`, background: T.white, borderRadius: radius.full, padding: "8px 16px", fontSize: 13, fontWeight: 500, fontFamily: font, color: T.gray700, cursor: "pointer" }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
