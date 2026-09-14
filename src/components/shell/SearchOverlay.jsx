import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Search, Briefcase, LayoutGrid, MessageSquare, FileText, Building2, Wand2, BookOpen,
  Settings, Bell, Star, ArrowLeftRight, LogOut, X, Clock,
} from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { FAMILIES } from "../../lib/families.js";
import { SAMPLE_REPORTS, SAMPLE_DRAFTS } from "./navRailData.js";
import { SERVICES } from "../chat/AttachMenu.jsx";

/* ================================================================== */
/* SEARCH OVERLAY — the product-wide command palette, opened from        */
/* NavRail's "Search" nav item or Cmd/Ctrl+K from anywhere. No specific   */
/* Figma reference exists for this yet — built to the user's own          */
/* explicit description (a ChatGPT/Spotlight-style floating search),      */
/* restyled against two ChatGPT search screenshots the user shared        */
/* (glass materials, category tabs, "No results" state), then corrected   */
/* a third time per explicit feedback on the empty state and tab          */
/* behavior — see the two notes below, both are direct answers to that    */
/* feedback, not a Figma port.                                            */
/*                                                                        */
/* "First state... should be Recent searches and maybe recent drafts" —   */
/* the empty-query landing view is no longer a generic "Recents" of        */
/* whatever was last clicked across every category + a fixed Tools row.   */
/* It's now two specific, real things: **Recent Searches** (the actual     */
/* query strings the user typed, persisted to localStorage — clicking one  */
/* re-runs it) and **Recent Drafts** (`SAMPLE_DRAFTS`, same honest-sample-  */
/* data status it already has in the sidebar). Nothing fabricated —        */
/* Recent Searches starts empty and only shows once a real search           */
/* happened; Quick Access/Tools is no longer force-surfaced on empty query  */
/* (still reachable normally once you type, e.g. "home"/"library").         */
/*                                                                        */
/* "Once user starts to write something in - the categories/tabs show up  */
/* - and only the relevant ones should show up" — tabs are now hidden      */
/* entirely until there's a query, and only render for sections that       */
/* actually have a match (plus "All"), computed fresh per keystroke —      */
/* not the reference screenshot's own fixed always-all-tabs-visible         */
/* behavior, a deliberate improvement the user asked for past what         */
/* ChatGPT's own UI does.                                                  */
/*                                                                        */
/* PROTOTYPE-ONLY: the small pill above the card ("Prototype style ▾")    */
/* is a design-exploration aid, not a real product setting — see its own  */
/* inline comment below.                                                  */
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

// Static — computed once, not per-render. Every item carries its section's
// real, un-fabricated data (FAMILIES/SAMPLE_REPORTS/SAMPLE_DRAFTS/SERVICES,
// same sources as before); `icon` here is a fallback used when an item has
// none of its own (Tools/Settings rows already carry a specific one).
const ALL_SECTIONS = [
  { key: "services", label: "Services", icon: Briefcase, items: SERVICES.map((s) => ({ id: s.id, label: s.label })) },
  { key: "widgets", label: "Widgets", icon: LayoutGrid, items: FAMILIES.map((f) => ({ id: f.id, label: f.name, sub: f.category, familyId: f.id })) },
  { key: "drafts", label: "Drafts", icon: MessageSquare, items: SAMPLE_DRAFTS.map((d) => ({ id: d.id, label: d.name })) },
  { key: "reports", label: "Reports", icon: FileText, items: SAMPLE_REPORTS.map((r) => ({ id: r.id, label: r.name })) },
  { key: "tools", label: "Tools", items: TOOLS },
  { key: "settings", label: "Settings", items: SETTINGS_ITEMS },
];

const MAX_PER_SECTION = 5;
const RECENT_SEARCHES_KEY = "shape-search-recent-queries";
const RECENT_SEARCHES_MAX = 5;
const RECENT_DRAFTS_MAX = 4;
const SPRING = { type: "spring", bounce: 0, duration: 0.28 };

// Three visual treatments to compare live — see the PROTOTYPE-ONLY note
// above. "solid" is the original plain-card look; the other two are the
// glass exploration the user asked for (a light frost and a ChatGPT-style
// dark frost), both using `backdrop-filter` per the Apple interaction-
// design skill's own materials guidance (translucent layers, not opaque
// bars — see CLAUDE.md's Apple pass for the rest of that skill's rules).
const STYLE_THEMES = {
  solid: {
    name: "Solid (original)",
    scrim: "rgba(35,31,32,0.4)", blur: "none",
    cardBg: T.white, cardBorder: "1px solid transparent",
    shadow: "0 24px 48px rgba(0,0,0,0.24), 0 4px 16px rgba(0,0,0,0.12)",
    text: T.gray900, textSecondary: T.gray500, textMuted: T.gray400,
    divider: T.gray75, rowHover: T.gray50, iconBg: T.gray50, iconColor: T.gray700,
    activeTabBg: T.gray900, activeTabText: T.white, inactiveTabText: T.gray500, tabHover: T.gray50,
    chipBg: T.gray50, chipText: T.gray400,
  },
  "light-glass": {
    name: "Light Glass",
    scrim: "rgba(35,31,32,0.28)", blur: "blur(28px) saturate(180%)",
    cardBg: "rgba(255,255,255,0.62)", cardBorder: "1px solid rgba(255,255,255,0.6)",
    shadow: "0 24px 48px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
    text: T.gray900, textSecondary: T.gray600, textMuted: T.gray500,
    divider: "rgba(35,31,32,0.08)", rowHover: "rgba(35,31,32,0.06)", iconBg: "rgba(35,31,32,0.05)", iconColor: T.gray700,
    activeTabBg: "rgba(35,31,32,0.82)", activeTabText: T.white, inactiveTabText: T.gray600, tabHover: "rgba(35,31,32,0.05)",
    chipBg: "rgba(35,31,32,0.06)", chipText: T.gray500,
  },
  "dark-glass": {
    name: "Dark Glass",
    scrim: "rgba(0,0,0,0.55)", blur: "blur(32px) saturate(180%)",
    cardBg: "rgba(32,32,34,0.76)", cardBorder: "1px solid rgba(255,255,255,0.1)",
    shadow: "0 24px 56px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)",
    text: "#f5f5f5", textSecondary: "rgba(255,255,255,0.55)", textMuted: "rgba(255,255,255,0.4)",
    divider: "rgba(255,255,255,0.1)", rowHover: "rgba(255,255,255,0.09)", iconBg: "rgba(255,255,255,0.08)", iconColor: "rgba(255,255,255,0.85)",
    activeTabBg: "rgba(255,255,255,0.16)", activeTabText: "#fff", inactiveTabText: "rgba(255,255,255,0.55)", tabHover: "rgba(255,255,255,0.08)",
    chipBg: "rgba(255,255,255,0.08)", chipText: "rgba(255,255,255,0.5)",
  },
};

function matches(text, q) {
  return !q || (text || "").toLowerCase().includes(q);
}

export default function SearchOverlay({ open, onClose, onGoHome, onGoStore, onGoCreate, onGoLibrary, onAddWidget }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [styleVariant, setStyleVariant] = useState("dark-glass");
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"); } catch { return []; }
  });
  const inputRef = useRef(null);
  const theme = STYLE_THEMES[styleVariant];

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveTab("all");
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  const showLanding = !query.trim();

  // Every section filtered against the current query, regardless of which
  // tab is active — this is also what decides which tabs are even offered
  // (a section with zero matches doesn't get a tab at all).
  const matchingSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items
        .filter((it) => matches(it.label, q) || matches(it.sub, q))
        .map((it) => ({ ...it, _section: sec.key, _icon: it.icon || sec.icon })),
    })).filter((sec) => sec.items.length > 0);
  }, [query]);

  const tabs = useMemo(() => {
    if (showLanding) return [];
    return [{ key: "all", label: "All" }, ...matchingSections.map((s) => ({ key: s.key, label: s.label }))];
  }, [showLanding, matchingSections]);

  // Query cleared, or the active tab no longer has any matches (its own tab
  // button just disappeared above) — both cases fall back to "All" rather
  // than silently showing a stale, now-invalid filter.
  useEffect(() => {
    if (!query.trim()) { setActiveTab("all"); return; }
    if (activeTab !== "all" && !matchingSections.some((s) => s.key === activeTab)) setActiveTab("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, matchingSections]);

  const displaySections = useMemo(() => {
    if (showLanding) {
      return [
        ...(recentSearches.length
          ? [{ key: "recent-searches", label: "Recent Searches", icon: Search, items: recentSearches.map((q) => ({ id: q, label: q, _section: "recent-search", _icon: Search })) }]
          : []),
        { key: "recent-drafts", label: "Recent Drafts", icon: MessageSquare, items: SAMPLE_DRAFTS.slice(0, RECENT_DRAFTS_MAX).map((d) => ({ id: d.id, label: d.name, _section: "drafts", _icon: MessageSquare })) },
      ];
    }
    if (activeTab === "all") return matchingSections.map((sec) => ({ ...sec, items: sec.items.slice(0, MAX_PER_SECTION) }));
    return matchingSections.filter((s) => s.key === activeTab);
  }, [showLanding, matchingSections, activeTab, recentSearches]);

  const flat = useMemo(() => displaySections.flatMap((sec) => sec.items), [displaySections]);

  useEffect(() => { setActiveIndex(0); }, [query, activeTab]);

  // Funnels every way the palette can close through one place so a real,
  // completed search always gets remembered — whether the user picked a
  // result, hit Escape, clicked the scrim, or clicked the X — the same
  // "did you actually search for something" moment Google/ChatGPT's own
  // history treats as worth keeping, not just an explicit "save" action.
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

  const activate = (item) => {
    if (!item) return;
    // A past search, clicked from the landing view — re-run it rather than
    // "activating" it; the palette stays open so the (now non-empty) query
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
    // Services/Reports/Drafts/Settings: no real destination exists yet
    // (see header comment) — just close, same as clicking any of those
    // elsewhere in this app today.
    closeAndCommit();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { closeAndCommit(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, flat.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter") { e.preventDefault(); activate(flat[activeIndex]); }
  };

  return (
    <motion.div
      onClick={closeAndCommit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING}
      style={{ position: "fixed", inset: 0, background: theme.scrim, backdropFilter: styleVariant === "solid" ? "none" : "blur(4px)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "12vh" }}
    >
      {/* PROTOTYPE-ONLY style switcher — see file header comment. */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: radius.full, padding: "6px 6px 6px 14px", fontFamily: font }}
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>🧪 Prototype style</span>
        <select
          value={styleVariant}
          onChange={(e) => setStyleVariant(e.target.value)}
          style={{ fontSize: 12, fontFamily: font, fontWeight: 600, color: T.gray900, background: T.white, border: "none", borderRadius: radius.full, padding: "5px 10px", cursor: "pointer" }}
        >
          {Object.entries(STYLE_THEMES).map(([key, t]) => (
            <option key={key} value={key}>{t.name}</option>
          ))}
        </select>
      </div>

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={SPRING}
        style={{ width: 640, maxWidth: "90vw", maxHeight: "70vh", background: theme.cardBg, backdropFilter: theme.blur, WebkitBackdropFilter: theme.blur, border: theme.cardBorder, borderRadius: radius.modal, boxShadow: theme.shadow, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${theme.divider}`, flexShrink: 0 }}>
          <Search size={20} color={theme.textMuted} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search services, widgets, drafts, reports..."
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 17, fontFamily: font, color: theme.text }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: theme.textSecondary, fontFamily: font, flexShrink: 0, padding: "4px 6px" }}>
              Clear
            </button>
          )}
          <div style={{ width: 1, height: 20, background: theme.divider, flexShrink: 0 }} />
          <button onClick={closeAndCommit} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", color: theme.textSecondary, flexShrink: 0, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {tabs.length > 0 && (
          <div style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto", flexShrink: 0, borderBottom: `1px solid ${theme.divider}` }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                    padding: "6px 14px", borderRadius: radius.full, fontSize: 13, fontWeight: 500, fontFamily: font,
                    background: isActive ? theme.activeTabBg : "transparent",
                    color: isActive ? theme.activeTabText : theme.inactiveTabText,
                    transition: "background 100ms ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ overflowY: "auto", padding: 8, minHeight: 200 }}>
          {flat.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 12px", color: theme.textMuted }}>
              <Search size={28} color={theme.textMuted} />
              <span style={{ fontSize: 14 }}>No results</span>
            </div>
          ) : (
            displaySections.map((sec) => (
              <div key={sec.key} style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px 4px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {(sec.key === "recent-searches" || sec.key === "recent-drafts") && <Clock size={11} />}
                  {sec.label}
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
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: radius.sm, background: isActive ? theme.rowHover : "transparent", cursor: "pointer" }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: radius.sm, background: theme.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={15} color={theme.iconColor} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                      {it.sub && <span style={{ fontSize: 12, color: theme.textMuted, marginLeft: "auto", flexShrink: 0, paddingLeft: 8 }}>{it.sub}</span>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderTop: `1px solid ${theme.divider}`, flexShrink: 0 }}>
          {["↑↓ navigate", "↵ select", "esc close"].map((hint) => (
            <span key={hint} style={{ fontSize: 11, color: theme.chipText, background: theme.chipBg, borderRadius: 4, padding: "2px 6px" }}>{hint}</span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
