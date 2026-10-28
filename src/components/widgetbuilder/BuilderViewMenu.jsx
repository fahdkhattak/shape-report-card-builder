import { useState } from "react";
import { useFloating, offset, flip, shift, autoUpdate, useDismiss, useClick, useInteractions, FloatingPortal } from "@floating-ui/react";
import { motion } from "motion/react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace, dsRadius, dsShadow, dsBorder } from "../../lib/ds.js";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import { usePreviewWidth } from "./PreviewWidth.jsx";
import { STORY_STYLES } from "./StoryStyleToggle.jsx";
import { WIDGET_BUILDER_VERSIONS } from "./WidgetBuilderVersions.jsx";
import { DATA_SOURCES, activeSource, switchSource } from "../../lib/dataSource.js";

/* ================================================================== */
/* VIEW MENU: the Widget Builder's view settings in one place. The       */
/* header used to carry four rows of switches (Preview, Data, Stories,   */
/* Prototype); now one "View" button opens a small window with them.      */
/* The button says what's set, so nothing is hidden.                      */
/* ================================================================== */
const SPRING = { type: "spring", bounce: 0, duration: 0.25 };

function Row({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[6] }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: dsSpace[8] }}>
        <span style={{ ...dsText("Text xs", 600), color: ds.text.primary }}>{label}</span>
        {hint && <span style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function BuilderViewMenu({ built, storyStyle, onStoryStyleChange, version, onVersionChange }) {
  const [open, setOpen] = useState(false);
  const { width, setWidth } = usePreviewWidth();
  const data = activeSource();
  const { refs, floatingStyles, context } = useFloating({ open, onOpenChange: setOpen, placement: "bottom-end", whileElementsMounted: autoUpdate, middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })] });
  const { getReferenceProps, getFloatingProps } = useInteractions([useClick(context), useDismiss(context, { outsidePressEvent: "mousedown" })]);
  const dataLabel = DATA_SOURCES.find((d) => d.id === data)?.label;
  const summary = [built && (width === "phone" ? "Phone" : "Desktop"), dataLabel, built && STORY_STYLES.find((s) => s.id === storyStyle)?.label, WIDGET_BUILDER_VERSIONS.find((v) => v.id === version)?.label].filter(Boolean).join(" · ");

  return (
    <>
      <button ref={refs.setReference} type="button" aria-haspopup="dialog" aria-expanded={open} {...getReferenceProps()} title="View settings"
        style={{ display: "inline-flex", alignItems: "center", gap: dsSpace[8], height: 28, padding: `0 ${dsSpace[8]}px 0 ${dsSpace[12]}px`, borderRadius: dsRadius.full, border: `${dsBorder.sm}px solid ${open ? ds.border.strong : ds.border.secondary}`, background: open ? ds.interactive.ghostHover : ds.surface.general.card, cursor: "pointer", fontFamily: font, ...dsText("Text xs", 500), color: ds.text.secondary, maxWidth: 420 }}>
        <SlidersHorizontal size={14} />
        <span style={{ color: ds.text.primary, fontWeight: 600 }}>View</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: ds.text.tertiary }}>{summary}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 70 }} {...getFloatingProps()}>
            <motion.div role="dialog" aria-label="View settings" initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={SPRING}
              style={{ width: 300, background: ds.surface.general.card, borderRadius: dsRadius.xl, boxShadow: dsShadow("lg"), padding: dsSpace[16], display: "flex", flexDirection: "column", gap: dsSpace[16], fontFamily: font, transformOrigin: "top right" }}>
              {built && (
                <Row label="Preview" hint="Stories at phone width">
                  <SegmentedControl options={[{ id: "desktop", label: "Desktop" }, { id: "phone", label: "Phone" }]} value={width} onChange={setWidth} />
                </Row>
              )}
              <Row label="Data" hint="Switching reloads">
                <SegmentedControl options={DATA_SOURCES.map((d) => ({ id: d.id, label: d.label }))} value={data} onChange={(id) => id !== data && switchSource(id, "widget-builder")} />
                <span style={{ ...dsText("Text 3xs"), color: ds.text.tertiary }}>{DATA_SOURCES.find((d) => d.id === data)?.note}</span>
              </Row>
              {built && (
                <Row label="Stories">
                  <SegmentedControl options={STORY_STYLES} value={storyStyle} onChange={onStoryStyleChange} />
                </Row>
              )}
              <Row label="Prototype">
                <SegmentedControl options={WIDGET_BUILDER_VERSIONS} value={version} onChange={onVersionChange} />
              </Row>
            </motion.div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
