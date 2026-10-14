import { useState } from "react";
import { font } from "../../lib/tokens.js";
import { dsVar } from "../../lib/ds.js";

/* ================================================================== */
/* BUTTON — ported from the real Figma `Buttons/Button` component      */
/* (file htfKAasKxHwztnQLb6ZFad, node 22494:2499 component set).       */
/*                                                                      */
/* Geometry and color values below are read directly off individual    */
/* variant instances (not the doc summary) — see CLAUDE.md for the     */
/* node IDs sampled and the one confirmed doc/Figma discrepancy        */
/* (square buttons render at 0px radius in Figma, not the 8px the      */
/* design-system doc's component table claims).                        */
/*                                                                      */
/* Figma's variant property is named `Variation: primary/secondary/    */
/* link`, but the `link` value's CSS variables all read                */
/* `color/button/{theme}/ghost/*` — so this component names the prop   */
/* `ghost` to match the token group it actually draws from.             */
/* ================================================================== */

const SIZES = {
  xs: { height: 28, paddingX: 12, paddingY: 4, fontSize: 14, fontWeight: 400, lineHeight: 20 },
  sm: { height: 36, paddingX: 20, paddingY: 6, fontSize: 16, fontWeight: 600, lineHeight: 24 },
  md: { height: 48, paddingX: 24, paddingY: 12, fontSize: 16, fontWeight: 600, lineHeight: 24 },
  lg: { height: 60, paddingX: 32, paddingY: 16, fontSize: 18, fontWeight: 600, lineHeight: 28 },
};
const ICON_SIZE = 20;
const ICON_GAP = 8;

/* Colour tables - every value is a design-system button token (color/button/{theme}/{variation}/...),
   so buttons follow light/dark. In light mode these resolve to the same hex the table used to hold
   (checked against docs/shape-design-system-v4.md by scripts/audit-ds.mjs). */
const tok = (theme, variation, rest) => dsVar(`color/button/${theme}/${variation}/${rest}`);
const table = (theme, variation) => {
  const t = (rest) => tok(theme, variation, rest);
  const c = { bg: variation === "primary" ? t("bg/default") : "transparent", bgHover: t("bg/hover"), bgActive: t("bg/active"), text: t("items/default text"), textDisabled: t("items/disabled text") };
  if (variation === "primary") c.bgDisabled = t("bg/disabled");
  if (variation === "secondary") { c.border = t("border/default"); c.borderDisabled = t("border/disabled"); }
  return c;
};
const THEMES = Object.fromEntries(["accent", "brand", "destructive"].map((th) => [th, Object.fromEntries(["primary", "secondary", "ghost"].map((v) => [v, table(th, v)]))]));

export default function Button({
  children,
  theme = "accent",
  variation = "primary",
  size = "md",
  shape = "round",
  iconLeft = null,
  iconRight = null,
  disabled = false,
  loading = false,
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const s = SIZES[size];
  const c = THEMES[theme][variation];
  const iconOnly = !children;
  const isOff = disabled || loading;

  const bg = isOff ? c.bgDisabled ?? c.bg : active ? c.bgActive : hover ? c.bgHover : c.bg;
  const textColor = isOff ? c.textDisabled : c.text;
  const borderColor = c.border ? (isOff ? c.borderDisabled : c.border) : undefined;

  const squarePadding = (s.height - ICON_SIZE) / 2;

  return (
    <button
      disabled={isOff}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: ICON_GAP,
        height: s.height,
        padding: iconOnly ? squarePadding : `${s.paddingY}px ${s.paddingX}px`,
        background: bg,
        border: borderColor ? `1px solid ${borderColor}` : "none",
        borderRadius: shape === "round" ? 9999 : 0,
        color: textColor,
        fontFamily: font,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: `${s.lineHeight}px`,
        whiteSpace: "nowrap",
        cursor: isOff ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        boxSizing: "border-box",
        transition: "background 120ms ease, border-color 120ms ease",
        ...style,
      }}
      {...rest}
    >
      {iconLeft && <span style={{ display: "flex", width: ICON_SIZE, height: ICON_SIZE, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{iconLeft}</span>}
      {children}
      {iconRight && <span style={{ display: "flex", width: ICON_SIZE, height: ICON_SIZE, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{iconRight}</span>}
    </button>
  );
}
