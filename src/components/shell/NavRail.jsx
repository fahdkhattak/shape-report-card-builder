import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useFloating, offset, flip, shift, autoUpdate, FloatingPortal,
  useDismiss, useInteractions, FloatingTree, FloatingNode, useFloatingNodeId,
} from "@floating-ui/react";
import {
  MessageSquare, Building2, Wand2, Bell, Settings, User,
  Search, BookOpen, PanelLeft, ChevronRight, ChevronDown, ChevronUp,
  Plus, MoreHorizontal, ChevronsUpDown, Star, LogOut, ArrowLeftRight,
  Share2, Globe, Check, UserPlus,
  Workflow, FileQuestion, FileText, LayoutGrid, Presentation, BadgeCheck, Code2, LayoutDashboard, ClipboardList,
} from "lucide-react";
import { useNavActions } from "../../lib/navActions.js";
import { T, font, radius } from "../../lib/tokens.js";
import shapeLogo from "../../assets/shape-logo.svg";
import linkedinMark from "../../assets/linkedin-mark.svg";
import { SAMPLE_REPORTS, SAMPLE_DRAFTS, ACCOUNTS, EXTRA_LINKS_COLUMNS } from "./navRailData.js";

/* ================================================================== */
/* NAV RAIL — fully interactive, built against every real state of the  */
/* `Menu` component (984qJvMt7fCHASYHRwgrab, node 11923:46254 — see     */
/* docs/figma-sidebar-audit.md for the full per-state spec this ports). */
/*                                                                      */
/* Every floating element (tooltip, Share/Profile/Switch-Accounts/     */
/* Extra-Links menus) is positioned with `@floating-ui/react` and       */
/* rendered through a `FloatingPortal` straight to `document.body` —    */
/* NOT via CSS `position:absolute` inside a scrolling ancestor. That    */
/* was a real bug: the collapsed nav list needs `overflow-y:auto` for   */
/* (hypothetically) long content, and CSS forces `overflow-x` to also   */
/* compute as `auto` whenever the other axis isn't `visible` — so       */
/* every tooltip/menu nested in that list was being clipped by it, and  */
/* the clipped overflow was itself adding a spurious horizontal         */
/* scrollbar to the list. Portaling sidesteps the whole class of bug,   */
/* and floating-ui's `flip`/`shift` middleware keeps every menu fully   */
/* on-screen even right at a viewport edge (fixed the Extra Links panel */
/* overflowing past the browser's own edge in the expanded state).      */
/*                                                                      */
/* Outside-click/Escape dismissal uses floating-ui's own `useDismiss`,  */
/* not a hand-rolled `document.mousedown` + DOM-containment registry —  */
/* an earlier version of this file tried that, and it broke exactly on  */
/* the one interaction that most needed to work: clicking "Switch       */
/* Accounts" *inside* the already-open Profile menu was misread as an   */
/* "outside" click and closed the whole thing before the nested flyout  */
/* ever got a chance to open. Root cause was a real timing race (the    */
/* registry only learned the portaled menu's real DOM node a tick after */
/* it opened, via an effect keyed on a ref value — a value React doesn't */
/* re-render on when it changes, compounded by StrictMode's dev-only    */
/* double-effect-invocation). `useDismiss` + `FloatingTree`/            */
/* `FloatingNode`/`useFloatingNodeId` is the library's own purpose-built */
/* answer to exactly this "nested menu" case — a parent menu's dismiss   */
/* logic already knows not to fire for a press inside a registered      */
/* child node, with no manual bookkeeping required.                     */
/*                                                                      */
/* `expanded`/`onExpandedChange` are controlled from the parent screen   */
/* (App.jsx lifts this) so the user's expand/collapse choice survives    */
/* navigating between screens, the same pattern already used for the     */
/* chat scoping phase after that bug was found and fixed once already.  */
/*                                                                      */
/* "Your Reports" content and the two-account switcher are real Figma   */
/* SAMPLE data (navRailData.js) — this app has no multi-report backend   */
/* or real account system, so this is honest presentational content     */
/* matching the design exactly, not a claim of real persistence.         */
/* ================================================================== */

const SPRING = { type: "spring", bounce: 0, duration: 0.35 };
const POP_SPRING = { type: "spring", bounce: 0, duration: 0.18 };
const SHADOW_MD = "0 1px 2px rgba(0,0,0,0.14), 0 4px 4px rgba(0,0,0,0.1), 0 10px 6px rgba(0,0,0,0.06), 0 17px 7px rgba(0,0,0,0.02), 0 22px 8px rgba(0,0,0,0.01)";
const SHADOW_RIGHT = "1px 0 2px rgba(0,0,0,0.06), 8px 0 5px rgba(0,0,0,0.03), 18px 0 7px rgba(0,0,0,0.01), 31px 0 8px rgba(0,0,0,0.00)";

// Figma's own copy (Home/Search/Store/Create/Library) — kept distinct from
// the `active` id, which still matches the app's real screens (chat/org/
// generate). "Search" opens the real SearchOverlay.jsx command palette,
// "Create" opens the CreateToolsMenu below (see the `onClick`/`itemRef`
// wiring further down); "Library" opens the full Library screen
// (components/library/LibraryScreen.jsx), collapsed or expanded.
const NAV_ITEMS = [
  { id: "chat", label: "Home", icon: MessageSquare },
  { id: "search", label: "Search", icon: Search, expandedOnly: true },
  { id: "org", label: "Store", icon: Building2 },
  { id: "generate", label: "Create", icon: Wand2 },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "developer", label: "Developer", icon: Code2 }, // the handoff area — components, states and specs (components/developer/)
  { id: "dashboards", label: "Dashboards", icon: LayoutDashboard }, // dashboard redesign mockups (components/dashboards/), isolated
  { id: "survey", label: "Survey", icon: ClipboardList }, // the respondent survey page (components/surveypage/), isolated
];

// CREATE TOOLS MENU — a real Figma reference for this one
// (Z6YmEggwvoiX3j4d3kCKqV "SHAPE 3.0 Roughwork", node 2111:7157/7158),
// giving the "Create" nav item somewhere real to open instead of doing
// nothing. Five tools + a "Coming soon" card, matching that node's own
// two-column layout exactly (333px tool list + 275px promo panel).
//
// "Report Builder" and "Survey Builder" are wired to real destinations
// (`onOpenReportBuilder`/`onOpenSurveyBuilder`, threaded from App.jsx the
// same way `onOpenSearch` already is). Report Builder just goes to the
// existing chat-first flow's own entry point (Home) — that flow already IS
// this app's report builder, nothing new to build. Survey Builder opens the
// real node-based blueprint editor (components/survey/SurveyBuilderScreen.jsx).
// The other three rows exist so there's real layout space for them, per
// explicit product direction ("I need space for all these tools to sit") —
// for now they close the menu with no other effect, the same honest-inert
// treatment this app already uses elsewhere for a real-looking control with
// no destination yet (e.g. AttachMenu's "Add Files or Photos").
const CREATE_TOOLS = [
  { id: "service-builder", label: "Service Builder", sub: "Package surveys, reports and tools", icon: Workflow },
  { id: "survey-builder", label: "Survey Builder", sub: "Create your own survey", icon: FileQuestion, real: true },
  { id: "report-builder", label: "Report Builder", sub: "Build reports that drive action", icon: FileText, real: true },
  { id: "widget-builder", label: "Widget Builder", sub: "Turn data into insight", icon: LayoutGrid, real: true },
  { id: "exec-summary", label: "Executive Summary Generator", sub: "Key insights. Ready to share.", icon: Presentation },
];

/* Position-only — no dismiss behavior, used for the collapsed-mode
   hover tooltip (which opens/closes on mouseenter/leave, never needs
   outside-click handling). */
function useTooltipFloating(open, placement, gap = 8) {
  return useFloating({
    open,
    placement,
    middleware: [offset(gap), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
}

/* Position + real dismiss behavior (outside click, Escape) via
   floating-ui's own `useDismiss` — portal-aware and, when `nodeId` links
   it into a `FloatingTree`, aware of nested child menus too. Opening
   itself is still driven by the caller's own state/onClick (simpler to
   retrofit onto this file's existing styled buttons than adopting
   `useClick`'s prop-getters everywhere), only *closing* is delegated. */
function useMenuFloating({ open, onClose, placement, gap = 8, nodeId }) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    nodeId,
    placement,
    onOpenChange: (next) => { if (!next) onClose(); },
    middleware: [offset(gap), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getFloatingProps } = useInteractions([dismiss]);
  return { refs, floatingStyles, getFloatingProps };
}

function Divider() {
  return <div style={{ height: 1, background: T.gray100, margin: "6px 0", flexShrink: 0 }} />;
}

/* Every dropdown in this file shares this shell: gray25 rows, 12px radius,
   the file's own 5-layer shadow. `floatingRef`/`style`/`floatingProps`
   come straight from useMenuFloating — this component doesn't do its own
   positioning or dismiss logic. */
function FloatingMenu({ floatingRef, style, floatingProps, children, width = 214 }) {
  return (
    <div ref={floatingRef} {...floatingProps} style={{ ...style, zIndex: 100 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={POP_SPRING}
        style={{ width, background: T.gray25, borderRadius: radius.lg, boxShadow: SHADOW_MD, padding: 6, fontFamily: font, boxSizing: "border-box" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger, trailing, fullWidth, itemRef }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      ref={itemRef}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", border: "none", background: hover ? T.gray75 : "transparent", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8, padding: fullWidth ? "8px 16px" : "8px 12px", borderRadius: radius.sm,
        fontSize: 14, fontFamily: font, color: danger ? T.red : T.gray900, transition: "background 100ms ease",
        textAlign: "left", boxSizing: "border-box",
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {trailing}
    </button>
  );
}

/* Small round icon button used for ghost triggers (collapse toggle,
   profile chevron, Bell/Admin/More in the expanded footer). Three-tier
   hover system confirmed against real instances: transparent at rest,
   `gray75` on hover, `gray100` while its own menu is open ("active"). */
function GhostIconButton({ icon, active, onClick, title, size = 36, btnRef }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      style={{
        width: size, height: size, border: "none", cursor: "pointer", borderRadius: radius.full,
        background: active ? T.gray100 : hover ? T.gray75 : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", color: T.gray700,
        transition: "background 100ms ease", flexShrink: 0, padding: 0,
      }}
    >
      {icon}
    </button>
  );
}

function Avatar({ size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius.full, background: T.gray100, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <User size={Math.round(size * 0.6)} color={T.gray600} />
    </div>
  );
}

/* Nav item pill — used for both the top nav list and the collapsed-mode
   bottom icons (Bell/Settings), since they share the exact same treatment.
   Hover tint (`gray25`) is instant; the text tooltip (collapsed mode only)
   has a short 100ms show-delay to avoid flicker while scanning past
   several icons quickly — the pill's own tint is the real instant
   feedback, the tooltip is secondary/informational. Active color is the
   icon's own primary (`gray900`), not the brand accent — confirmed
   against real usage, not the app's earlier (wrong) accent-blue guess. */
function NavItemRow({ item, active, expanded, hovered, onHover, onClick, itemRef }) {
  const [showTip, setShowTip] = useState(false);
  const timerRef = useRef(null);
  const Icon = item.icon;
  const { refs, floatingStyles } = useTooltipFloating(!expanded && showTip, "right");

  const onEnter = () => {
    onHover(true);
    timerRef.current = setTimeout(() => setShowTip(true), 100);
  };
  const onLeave = () => {
    onHover(false);
    clearTimeout(timerRef.current);
    setShowTip(false);
  };

  // Composes the tooltip's own positioning ref with an optional external
  // one (e.g. CreateToolsMenu's anchor) — a row only ever needs the second
  // when it also opens a floating menu of its own.
  const setRefs = (node) => {
    refs.setReference(node);
    if (itemRef) itemRef(node);
  };

  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        ref={setRefs}
        onClick={onClick}
        style={{
          width: expanded ? "100%" : 44, height: 36, border: "none", cursor: "pointer",
          background: hovered ? T.gray25 : "transparent", borderRadius: radius.sm,
          display: "flex", alignItems: "center", gap: expanded ? 12 : 0, justifyContent: expanded ? "flex-start" : "center",
          padding: expanded ? "8px 8px 8px 12px" : 0, transition: "background 100ms ease", fontFamily: font, boxSizing: "border-box",
        }}
      >
        <Icon size={20} color={active ? T.gray900 : T.gray400} style={{ flexShrink: 0 }} />
        {expanded && (
          <span style={{ fontSize: 14, fontWeight: 500, color: T.gray700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.label}
          </span>
        )}
      </button>
      <AnimatePresence>
        {!expanded && showTip && (
          <FloatingPortal>
            <motion.div
              ref={refs.setFloating}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={POP_SPRING}
              style={{ ...floatingStyles, zIndex: 100, background: T.gray25, borderRadius: radius.md, padding: "8px 12px", whiteSpace: "nowrap", fontSize: 12, color: T.gray700, fontFamily: font, boxShadow: SHADOW_MD, pointerEvents: "none" }}
            >
              {item.label}
            </motion.div>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubItemRow({ item, isMenuOpen, onOpenChange }) {
  const [hover, setHover] = useState(false);
  const { openReport } = useNavActions();
  const hasReport = ["shape-perf-org", "shape-personal", "shape-org"].includes(item.id); // the persona versions with a built report
  const { refs, floatingStyles, getFloatingProps } = useMenuFloating({ open: isMenuOpen, onClose: () => onOpenChange(false), placement: "bottom-start", gap: 4 });
  return (
    <div
      onClick={hasReport ? () => openReport(item.id) : undefined}
      style={{ display: "flex", alignItems: "center", padding: "8px 8px 8px 24px", borderRadius: radius.sm, background: hover ? T.gray25 : "transparent", transition: "background 100ms ease", cursor: hasReport ? "pointer" : "default" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ flex: 1, fontSize: 14, color: T.gray700 }}>{item.name}</span>
      {(hover || isMenuOpen) && (
        <GhostIconButton btnRef={refs.setReference} icon={<MoreHorizontal size={16} />} active={isMenuOpen} onClick={(e) => { e?.stopPropagation?.(); onOpenChange(!isMenuOpen); }} size={28} />
      )}
      <AnimatePresence>
        {isMenuOpen && (
          <FloatingPortal>
            <FloatingMenu floatingRef={refs.setFloating} style={floatingStyles} floatingProps={getFloatingProps()} width={171}>
              <MenuItem icon={<Share2 size={16} />} label="Share Report" onClick={() => onOpenChange(false)} />
            </FloatingMenu>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportRow({ report, isOpen, onToggle, shareMenuFor, setShareMenuFor }) {
  const [hover, setHover] = useState(false);
  const hasSubItems = !!report.subItems;
  return (
    <div>
      <button
        onClick={hasSubItems ? onToggle : undefined}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: "100%", border: "none", background: hover ? T.gray25 : "transparent", cursor: hasSubItems ? "pointer" : "default",
          display: "flex", alignItems: "center", gap: 8, padding: "10px 8px", borderRadius: radius.sm, fontFamily: font,
          transition: "background 100ms ease", boxSizing: "border-box",
        }}
      >
        <span style={{ flex: 1, textAlign: "left", fontSize: 14, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.name}</span>
        {hasSubItems && (isOpen ? <ChevronUp size={16} color={T.gray400} /> : <ChevronDown size={16} color={T.gray400} />)}
      </button>
      {hasSubItems && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column", borderBottom: `1px solid ${T.gray50}`, paddingBottom: 4, marginBottom: 2 }}>
                {report.subItems.map((s) => (
                  <SubItemRow key={s.id} item={s} isMenuOpen={shareMenuFor === s.id} onOpenChange={(v) => setShareMenuFor(v ? s.id : null)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

/* Small ghost "+" used on both the "Your Reports" and "Drafts" section
   headers — confirmed against the newer chat-redesign reference
   (Z6YmEggwvoiX3j4d3kCKqV, node 2031:8741) as a plain transparent ghost
   icon, not the solid gray800 circle this file originally shipped with for
   "Your Reports" (a real, if small, styling delta fixed here for both
   sections at once rather than leaving them inconsistent). */
function SectionAddButton() {
  const [hover, setHover] = useState(false);
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: 20, height: 20, borderRadius: radius.full, background: hover ? T.gray75 : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 100ms ease" }}
    >
      <Plus size={14} color={T.gray500} />
    </span>
  );
}

/* A single draft-conversation row — flat, no expand/sub-items (unlike
   ReportRow), no hover-revealed "..." menu (the reference shows none for
   Drafts, unlike Reports' sub-items — see docs/figma-chat-redesign-audit.md
   §3a). `active` renders the same persistent gray25 background the
   reference gives the currently-open conversation, distinct from hover. */
function DraftRow({ draft, active }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "8px 12px", borderRadius: radius.sm, fontFamily: font, boxSizing: "border-box",
        background: active || hover ? T.gray25 : "transparent", transition: "background 100ms ease",
      }}
    >
      <span style={{ display: "block", fontSize: 14, color: T.gray700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{draft.name}</span>
    </div>
  );
}

/* `useFloatingNodeId()` here is called from within ProfileMenu, which is
   rendered inside NavRail's `<FloatingNode id={profileNodeId}>` wrapper —
   so it automatically resolves its *parent* to the profile menu via
   context. A press inside this flyout is correctly recognized as "still
   inside" the profile menu's own dismiss logic, and a press truly outside
   both closes both (floating-ui's tree-aware `useDismiss`, not manual
   bookkeeping — an earlier hand-rolled version of this file got exactly
   this case wrong). */
function ProfileMenu({ floatingRef, style, floatingProps, switchAccountsOpen, onToggleSwitchAccounts, onCloseSwitchAccounts, onClose }) {
  const switchNodeId = useFloatingNodeId();
  const switchFloating = useMenuFloating({ open: switchAccountsOpen, onClose: onCloseSwitchAccounts, placement: "right-start", gap: 4, nodeId: switchNodeId });

  return (
    <>
      <FloatingPortal>
        <FloatingMenu floatingRef={floatingRef} style={style} floatingProps={floatingProps} width={214}>
          <MenuItem icon={<Settings size={16} />} label="Settings" onClick={onClose} />
          <MenuItem icon={<Star size={16} />} label="Rate Us" onClick={onClose} />
          <MenuItem
            itemRef={switchFloating.refs.setReference}
            icon={<ArrowLeftRight size={16} />}
            label="Switch Accounts"
            trailing={<ChevronRight size={14} color={T.gray400} />}
            onClick={onToggleSwitchAccounts}
          />
          <Divider />
          <MenuItem icon={<LogOut size={16} />} label="Sign out" danger fullWidth onClick={onClose} />
        </FloatingMenu>
      </FloatingPortal>
      <FloatingNode id={switchNodeId}>
        <AnimatePresence>
          {switchAccountsOpen && (
            <FloatingPortal>
              <FloatingMenu floatingRef={switchFloating.refs.setFloating} style={switchFloating.floatingStyles} floatingProps={switchFloating.getFloatingProps()} width={220}>
                {ACCOUNTS.map((a) => (
                  <button
                    key={a.id}
                    style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: radius.sm, fontFamily: font, textAlign: "left" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.gray75)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {a.initials ? (
                      <div style={{ width: 32, height: 32, borderRadius: radius.full, background: T.gray100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: T.gray500, flexShrink: 0 }}>{a.initials}</div>
                    ) : (
                      <Avatar size={32} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: T.gray500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</div>
                    </div>
                    {a.current && <Check size={16} color={T.gray900} style={{ flexShrink: 0 }} />}
                  </button>
                ))}
                <Divider />
                <MenuItem icon={<UserPlus size={16} />} label="Add account" />
              </FloatingMenu>
            </FloatingPortal>
          )}
        </AnimatePresence>
      </FloatingNode>
    </>
  );
}

function ExtraLinksPanel({ floatingRef, style, floatingProps }) {
  return (
    <FloatingPortal>
      <FloatingMenu floatingRef={floatingRef} style={style} floatingProps={floatingProps} width={360}>
        <div style={{ borderRadius: radius.xl, padding: 6 }}>
          <div style={{ display: "flex", gap: 24 }}>
            {EXTRA_LINKS_COLUMNS.map((col) => (
              <div key={col.header} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.gray500, textTransform: "uppercase", padding: "4px 8px" }}>{col.header}</span>
                {col.items.map((it) => (
                  <button
                    key={it}
                    style={{ border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: "6px 8px", borderRadius: radius.sm, fontSize: 14, color: T.gray900, fontFamily: font }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.gray50)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {it}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${T.gray100}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <GhostIconButton icon={<Globe size={20} />} title="Website" />
            <GhostIconButton icon={<img src={linkedinMark} width={20} height={20} alt="LinkedIn" />} title="LinkedIn" />
          </div>
        </div>
      </FloatingMenu>
    </FloatingPortal>
  );
}

// Own shell rather than the shared `FloatingMenu` (gray25 rows-list look) —
// the real node samples a plain white surface, 16px radius, and a two-
// column layout `FloatingMenu` isn't built for. Colors/spacing/shadow below
// are sampled directly off node 2111:7158, not eyeballed.
function CreateToolsMenu({ floatingRef, style, floatingProps, onSelectReportBuilder, onSelectSurveyBuilder, onSelectWidgetBuilder, onClose }) {
  const [hoveredTool, setHoveredTool] = useState(null);
  return (
    <FloatingPortal>
      <div ref={floatingRef} {...floatingProps} style={{ ...style, zIndex: 100 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={POP_SPRING}
          style={{
            display: "flex", gap: 16, padding: 16, background: T.white, border: `1px solid ${T.gray100}`,
            borderRadius: radius.xl, boxShadow: "0px 5px 7.5px rgba(102,102,102,0.1)", fontFamily: font, boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 333 }}>
            {CREATE_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const hovered = hoveredTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  onClick={() => {
                    if (tool.id === "report-builder") onSelectReportBuilder();
                    if (tool.id === "survey-builder") onSelectSurveyBuilder();
                    if (tool.id === "widget-builder") onSelectWidgetBuilder();
                    onClose();
                  }}
                  style={{
                    width: "100%", height: 48, border: "none", cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 12, padding: "0 8px",
                    background: hovered ? T.gray75 : "transparent", borderRadius: radius.lg,
                    transition: "background 100ms ease", fontFamily: font, boxSizing: "border-box",
                  }}
                >
                  <div style={{ width: 48, height: 48, flexShrink: 0, border: `1px solid ${T.gray75}`, borderRadius: radius.lg, background: T.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={24} color={T.gray700} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.gray900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tool.label}</span>
                    <span style={{ fontSize: 12, color: T.gray500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tool.sub}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ width: 275, alignSelf: "stretch", background: T.gray50, borderRadius: radius.md, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, boxSizing: "border-box" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.gray900 }}>Coming soon</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 123, height: 123, border: `1px solid ${T.gray75}`, borderRadius: radius.lg, background: T.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BadgeCheck size={40} color={T.accent} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.gray900 }}>Survey Validator</span>
                <span style={{ fontSize: 12, color: T.gray500 }}>Check quality, clarity and readiness.</span>
              </div>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.gray900 }}>Be first to know</span>
          </div>
        </motion.div>
      </div>
    </FloatingPortal>
  );
}

function NavRailInner({ active, expanded, onExpandedChange, onOpenSearch, onOpenReportBuilder, onOpenSurveyBuilder }) {
  const { openReport, openWidgetBuilder, openLibrary, openDeveloper, openDashboards, openSurvey } = useNavActions();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = expanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

  const [hoveredItem, setHoveredItem] = useState(null);
  const [logoHovered, setLogoHovered] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [expandedReports, setExpandedReports] = useState({});
  const [draftsOpen, setDraftsOpen] = useState(true);
  const [shareMenuFor, setShareMenuFor] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [switchAccountsOpen, setSwitchAccountsOpen] = useState(false);
  const [extraLinksOpen, setExtraLinksOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const toggleExpanded = () => setExpanded(!isExpanded);
  const closeProfileMenu = () => { setProfileMenuOpen(false); setSwitchAccountsOpen(false); };

  const profileNodeId = useFloatingNodeId();
  const profileFloating = useMenuFloating({
    open: profileMenuOpen,
    onClose: closeProfileMenu,
    placement: isExpanded ? "top-start" : "right-end",
    gap: isExpanded ? 8 : 12,
    nodeId: profileNodeId,
  });
  const extraLinksFloating = useMenuFloating({ open: extraLinksOpen, onClose: () => setExtraLinksOpen(false), placement: "top-start" });
  const createFloating = useMenuFloating({ open: createMenuOpen, onClose: () => setCreateMenuOpen(false), placement: "right-start", gap: 12 });

  return (
    <motion.div
      animate={{ width: isExpanded ? 300 : 69 }}
      transition={SPRING}
      style={{
        flexShrink: 0, height: "100%", boxSizing: "border-box", background: T.white,
        borderTop: `1px solid ${T.gray100}`, borderRight: `1px solid ${T.gray100}`, borderBottom: `1px solid ${T.gray100}`,
        borderTopRightRadius: radius.widget, borderBottomRightRadius: radius.widget,
        display: "flex", flexDirection: "column", position: "relative", overflow: "visible", fontFamily: font,
        boxShadow: isExpanded ? SHADOW_RIGHT : "none",
      }}
    >
      {/* Logo row */}
      <div style={{ height: 36, margin: "24px 16px 0", display: "flex", alignItems: "center", justifyContent: isExpanded ? "space-between" : "center", flexShrink: 0 }}>
        {isExpanded ? (
          <>
            <img src={shapeLogo} width={24} height={36} alt="" style={{ flexShrink: 0 }} />
            <GhostIconButton icon={<PanelLeft size={20} />} onClick={toggleExpanded} title="Collapse sidebar" />
          </>
        ) : (
          <button
            onClick={toggleExpanded}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            title="Expand sidebar"
            style={{ border: "none", background: logoHovered ? T.gray25 : "transparent", cursor: "pointer", width: 44, height: 36, borderRadius: radius.sm, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 100ms ease", padding: 0 }}
          >
            {logoHovered ? <PanelLeft size={20} color={T.gray700} /> : <img src={shapeLogo} width={24} height={36} alt="" />}
          </button>
        )}
      </div>

      {/* Nav items (+ Your Reports when expanded). Never `overflow-x:
          visible` alongside `overflow-y:auto` on the same element — that
          combination silently computes overflow-x to `auto` too, which
          both clips and adds a spurious scrollbar for anything that
          pokes outside (the exact bug this rewrite fixes). Collapsed
          mode has a small fixed item count and never needs to scroll at
          all, so it just stays fully visible. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: isExpanded ? "auto" : "visible", overflowX: "hidden", display: "flex", flexDirection: "column", padding: isExpanded ? "10px 16px 0" : "10px 12px 0", boxSizing: "border-box" }}>
        {NAV_ITEMS.filter((item) => isExpanded || !item.expandedOnly).map((item) => (
          <NavItemRow
            key={item.id}
            item={item}
            active={active === item.id}
            expanded={isExpanded}
            hovered={hoveredItem === item.id}
            onHover={(v) => setHoveredItem(v ? item.id : null)}
            onClick={item.id === "search" ? onOpenSearch : item.id === "generate" ? () => setCreateMenuOpen((v) => !v) : item.id === "org" ? () => openReport("shape-perf-org") : item.id === "library" ? openLibrary : item.id === "developer" ? openDeveloper : item.id === "dashboards" ? openDashboards : item.id === "survey" ? openSurvey : undefined}
            itemRef={item.id === "generate" ? createFloating.refs.setReference : undefined}
          />
        ))}
        <AnimatePresence>
          {createMenuOpen && (
            <CreateToolsMenu
              floatingRef={createFloating.refs.setFloating}
              style={createFloating.floatingStyles}
              floatingProps={createFloating.getFloatingProps()}
              onSelectReportBuilder={onOpenReportBuilder}
              onSelectSurveyBuilder={onOpenSurveyBuilder}
              onSelectWidgetBuilder={openWidgetBuilder}
              onClose={() => setCreateMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {isExpanded && (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => setReportsOpen((v) => !v)}
              style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", borderRadius: radius.sm, fontFamily: font, boxSizing: "border-box" }}
            >
              {reportsOpen ? <ChevronDown size={20} color={T.gray500} /> : <ChevronRight size={20} color={T.gray500} />}
              <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 500, color: T.gray500, textTransform: "uppercase", letterSpacing: 0.3 }}>Your Reports</span>
              <SectionAddButton />
            </button>

            <AnimatePresence initial={false}>
              {reportsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 4, paddingBottom: 8 }}>
                    {SAMPLE_REPORTS.map((r) => (
                      <ReportRow
                        key={r.id}
                        report={r}
                        isOpen={!!expandedReports[r.id]}
                        onToggle={() => setExpandedReports((m) => ({ ...m, [r.id]: !m[r.id] }))}
                        shareMenuFor={shareMenuFor}
                        setShareMenuFor={setShareMenuFor}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setDraftsOpen((v) => !v)}
              style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", borderRadius: radius.sm, fontFamily: font, boxSizing: "border-box" }}
            >
              {draftsOpen ? <ChevronDown size={20} color={T.gray500} /> : <ChevronRight size={20} color={T.gray500} />}
              <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 500, color: T.gray500, textTransform: "uppercase", letterSpacing: 0.3 }}>Drafts</span>
              <SectionAddButton />
            </button>

            <AnimatePresence initial={false}>
              {draftsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 4, paddingBottom: 8 }}>
                    {SAMPLE_DRAFTS.map((d, i) => (
                      <DraftRow key={d.id} draft={d} active={i === 0} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Frame — Bell/Admin(/More when expanded) */}
      <div
        style={{
          flexShrink: 0, borderTop: isExpanded ? `1px solid ${T.gray75}` : "none",
          margin: isExpanded ? "0 16px" : 0, padding: isExpanded ? "8px 0" : "0 12px", boxSizing: "border-box",
          display: "flex", flexDirection: isExpanded ? "row" : "column", alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center", gap: isExpanded ? 12 : 0,
        }}
      >
        {isExpanded ? (
          <>
            <div style={{ display: "flex", gap: 12 }}>
              <GhostIconButton icon={<Bell size={20} />} title="Notifications" />
              <GhostIconButton icon={<Settings size={20} />} title="Admin" />
            </div>
            <GhostIconButton
              btnRef={extraLinksFloating.refs.setReference}
              icon={<MoreHorizontal size={20} />}
              active={extraLinksOpen}
              onClick={() => setExtraLinksOpen((v) => !v)}
              title="More"
            />
            <AnimatePresence>
              {extraLinksOpen && (
                <ExtraLinksPanel floatingRef={extraLinksFloating.refs.setFloating} style={extraLinksFloating.floatingStyles} floatingProps={extraLinksFloating.getFloatingProps()} />
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            <NavItemRow item={{ id: "bell", label: "Notifications", icon: Bell }} expanded={false} hovered={hoveredItem === "bell"} onHover={(v) => setHoveredItem(v ? "bell" : null)} />
            <NavItemRow item={{ id: "admin", label: "Admin", icon: Settings }} expanded={false} hovered={hoveredItem === "admin"} onHover={(v) => setHoveredItem(v ? "admin" : null)} />
          </>
        )}
      </div>

      {/* Avatar row — clickable in BOTH modes (collapsed included) to
          open the same Settings/Rate Us/Switch Accounts/Sign out menu;
          the trigger is just the avatar itself when collapsed (no
          name/email/chevron to click there) and the chevron button when
          expanded. */}
      <div style={{ flexShrink: 0, borderTop: isExpanded ? `1px solid ${T.gray75}` : "none", padding: isExpanded ? 16 : "16px 12px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 10 }}>
        {isExpanded ? (
          <>
            <Avatar />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Olivia Rhye</div>
              <div style={{ fontSize: 14, color: T.gray700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>olivia@meta.com</div>
            </div>
            <GhostIconButton btnRef={profileFloating.refs.setReference} icon={<ChevronsUpDown size={20} />} active={profileMenuOpen} onClick={() => setProfileMenuOpen((v) => !v)} title="Account menu" />
          </>
        ) : (
          <button
            ref={profileFloating.refs.setReference}
            onClick={() => setProfileMenuOpen((v) => !v)}
            title="Account menu"
            style={{ border: "none", background: profileMenuOpen ? T.gray75 : "transparent", cursor: "pointer", borderRadius: radius.full, padding: 0, display: "flex", margin: "0 auto", transition: "background 100ms ease" }}
          >
            <Avatar />
          </button>
        )}
        <AnimatePresence>
          {profileMenuOpen && (
            <FloatingNode id={profileNodeId}>
              <ProfileMenu
                floatingRef={profileFloating.refs.setFloating}
                style={profileFloating.floatingStyles}
                floatingProps={profileFloating.getFloatingProps()}
                switchAccountsOpen={switchAccountsOpen}
                onToggleSwitchAccounts={() => setSwitchAccountsOpen((v) => !v)}
                onCloseSwitchAccounts={() => setSwitchAccountsOpen(false)}
                onClose={closeProfileMenu}
              />
            </FloatingNode>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function NavRail(props) {
  return (
    <FloatingTree>
      <NavRailInner {...props} />
    </FloatingTree>
  );
}
