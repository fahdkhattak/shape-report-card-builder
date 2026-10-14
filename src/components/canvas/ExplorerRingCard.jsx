import { useEffect, useState } from "react";
import { motion, animate, useReducedMotion } from "motion/react";
import { font, radius } from "../../lib/tokens.js";
import { ds, dsBand, dsShadow } from "../../lib/ds.js";

/* ================================================================== */
/* EXPLORER RING CARD — one of the 12 Explorers on the Explorers report  */
/* layer (Figma 984qJvMt7fCHASYHRwgrab, "Explorers / Pick Explorer"       */
/* 14531:20690; card 14531:21265):                                         */
/*  - 1x1 card: surface/card, 1px border/secondary, radius 18, 16px        */
/*    padding, 12px gap; header Text 3xs-Header (11 / Medium / upper case) */
/*    in text/tertiary.                                                     */
/*    The header box is always two lines tall, so every ring lines up.     */
/*  - Ring: 80px across the stroke's centre line, 8px stroke, a           */
/*    border/secondary track, the arc in the score's status graph colour,  */
/*    round caps, from 12 o'clock clockwise. The number inside is Display  */
/*    sm (30 / 38, Bold) in the status text-indicator colour.              */
/* Character (ours): on arrival each ring sweeps round to its score while  */
/* its number counts up, staggered across the grid; hover lifts the card   */
/* (the widgets' md shadow) and swells the ring a touch; a press squashes   */
/* the card and it springs back. Selected (its Scope is open) darkens the   */
/* border and keeps it lifted. These are a view of the report, not user     */
/* widgets — not draggable, renamable or removable.                         */
/* ================================================================== */
const R = 40, STROKE = 8, BOX = 2 * R + STROKE; // 88
const C = 2 * Math.PI * R;
const SWEEP = { type: "spring", bounce: 0.15, duration: 1.1 };
const PRESS = { type: "spring", bounce: 0.45, duration: 0.4 };

function useCountUp(to, delay, skip) {
  const [n, setN] = useState(skip ? to : 0);
  useEffect(() => {
    if (skip) { setN(to); return undefined; }
    const c = animate(0, to, { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [to, delay, skip]);
  return n;
}

export default function ExplorerRingCard({ name, value, selected, onClick, index = 0, layoutKey }) {
  const [hover, setHover] = useState(false);
  const reduce = useReducedMotion();
  const b = dsBand(value);
  const delay = reduce ? 0 : 0.08 + index * 0.05;
  const shown = useCountUp(value, delay, reduce);
  const raised = hover || selected;
  const share = Math.max(0, Math.min(100, value)) / 100;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      aria-pressed={selected}
      aria-label={`${name}: ${value} out of 100, ${b.name}`}
      initial={false}
      animate={{ y: hover && !selected ? -2 : 0 }}
      whileTap={{ scale: 0.97, y: 0, transition: { duration: 0.08 } }}
      layout="position"
      layoutDependency={layoutKey}
      transition={{ ...PRESS, layout: { type: "spring", bounce: 0, duration: 0.5 } }}
      style={{
        width: 164, height: 164, boxSizing: "border-box", padding: 16, background: ds.surface.general.card, borderRadius: radius.widget, cursor: "pointer", fontFamily: font,
        border: `1px solid ${selected ? ds.border.strong : ds.border.secondary}`, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12,
        boxShadow: raised ? dsShadow("md") : "0 0 0 rgba(0,0,0,0)", transition: "box-shadow 200ms ease, border-color 200ms ease", textAlign: "left",
      }}
    >
      <span style={{ flexShrink: 0, height: 28, fontSize: 11, fontWeight: 500, letterSpacing: "0.11px", textTransform: "uppercase", lineHeight: "14px", color: selected ? ds.text.primary : ds.text.tertiary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{name}</span>
      <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <motion.span animate={{ scale: hover ? 1.05 : 1 }} transition={{ type: "spring", bounce: 0.4, duration: 0.45 }} style={{ position: "relative", width: BOX, height: BOX, display: "block" }}>
          <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true" style={{ display: "block", transform: "rotate(-90deg)" }}>
            <circle cx={BOX / 2} cy={BOX / 2} r={R} fill="none" style={{ stroke: ds.border.secondary }} strokeWidth={STROKE} />
            <motion.circle
              cx={BOX / 2} cy={BOX / 2} r={R} fill="none" strokeWidth={STROKE} strokeLinecap="round"
              style={{ stroke: b.c }}
              strokeDasharray={C}
              initial={{ strokeDashoffset: reduce ? C * (1 - share) : C }}
              animate={{ strokeDashoffset: C * (1 - share) }}
              transition={{ ...SWEEP, delay }}
            />
          </svg>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, lineHeight: "38px", fontWeight: 700, color: b.cs, fontVariantNumeric: "tabular-nums" }}>{shown}</span>
        </motion.span>
      </span>
    </motion.button>
  );
}
