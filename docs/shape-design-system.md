# SHAPE Design System Reference
> Source of truth: Figma file `SHAPE — Form` (`htfKAasKxHwztnQLb6ZFad`) + Figma Variables export
> Last updated: August 2026 — regenerated from a fresh Variables2JSON export
> Single reference document for developers and AI tooling

---

## What changed in this update

This revision was regenerated from a new Figma Variables export, not hand-edited. Notable changes
since the previous version of this document:

- **Dark mode was substantially rebalanced.** Over half of all semantic dark-mode tokens now
  resolve to different primitive steps than before — this is a deliberate, comprehensive pass on
  dark mode, not drift. Every dark value in this document reflects the new export.
- **Two primitive corrections:** `colorsRed500` changed from `#cc2844` → `#CC2944`, and
  `colorsAmber25` changed from `#fff9ef` → `#FFFAF0`. These ripple through every error/destructive
  and warning-subtle token that references them.
- **The Heat Map color scale is now a real token set.** `utility/Heat Map/0-20` through `90-100`
  (10 steps, light + dark) exists as its own semantic scale — see §2.4. This is the finalized
  scale from the earlier heat map color-contract fix.
- **A new Likert scale exists:** `utility/Likert/*` — Very Bad → V Good with subtle variants, for
  survey-response visualizations (§2.4).
- **Two new radius tokens resolve previously-hardcoded values:** `radius/widget` (18px — the
  Global Widget Rules corner radius) and `radius/report-card` (38px — the report canvas card
  radius). Neither was a named token before; both were just hardcoded numbers in spec docs.
- **Two new spacing steps:** `spacing/2` (2px) and `spacing/6` (6px), filling gaps in the existing
  scale.
- **Typography scale expanded:** a new `Display 1.5xl` size (64px), a new `Label` category (8px
  and 10px, smaller than anything in the Text scale), a new `Text xs-Header` variant, and several
  new `-Trim` line-height variants. The old `-Auto` suffix has been renamed to `-Trim` throughout.
- **New Glass effect styles and tokens:** `bg/glass`, `bg/glass-intense`, `text/glass`, and two new
  `Glass/*` effect styles, plus two new Focus Ring variants (`focus-ring-subtle`,
  `focus-ring-error-subtle`).
- **A few new semantic tokens:** `surface/General/card-within-card`, `surface/General/header-brand`
  (an Accent-colored header variant), `text/alwaysWhite` (paired with the existing `alwaysBlack`),
  and `-text-strong` variants for all three status colors (error/warning/success), adding a third
  emphasis tier alongside the existing `-text` and `-text-indicator`.

---

## Overview

SHAPE 3.0 is a creator and user platform for survey-based intelligence services. This design system underpins all SHAPE 3.0 surfaces: Store, Creator Studio, Library, and the Report layer.

**Two things define the visual identity:**

**Gray** is the primary identity color. All surfaces, text, borders, icons, and the Brand button are built from this scale. `colorsGray900` (`#231F20`) is the primary dark value throughout.

**Accent** is the interactive highlight color — used for focus rings, links, selected states, and the Accent button. This is the color users interact with when building and configuring reports. It is designed to be user-configurable in a future release.

All other tokens are utilities — they describe component states, not the platform's character.

**Figma is the source of truth.** This document reflects the current state of Figma Variables and text/effect styles. Update this document whenever the Figma file is updated.

---

## How to Use Tokens

Always reference semantic tokens, not primitives.

| ✅ Correct | ❌ Incorrect |
|---|---|
| `colorTextPrimary` | `colorsGray900` |
| `colorBgPrimary` | `#f2f2f2` |
| `colorStatusErrorText` | `colorsRed500` |

Semantic tokens adapt between light and dark mode automatically. Raw primitive values do not.

---

## 1. Typography

**Typeface:** IBM Plex Sans
**Weights in use:** Regular (400), Medium (500), Semibold (600), Bold (700)

### Type Scale


| Style Name | Size | Line Height | Letter Spacing |
|---|---|---|---|
| `Display 4xl` | 96px | 120px | -2% |
| `Display 3xl` | 84px | 105px | -2% |
| `Display 2xl` | 72px | 90px | -2% |
| `Display xl` | 60px | 72px | -2% |
| `Display 1.5xl-Trim` | 64px | Auto | -2% |
| `Display lg` | 48px | 60px | -2% |
| `Display lg-Trim` | 48px | Auto | -2% |
| `Display md` | 36px | 44px | -2% |
| `Display md-Trim` | 36px | Auto | -2% |
| `Display sm` | 30px | 38px | 0 |
| `Display xs` | 24px | 32px | 0 |
| `Text xl` | 20px | 30px | 0 |
| `Text xl-Trim` | 20px | Auto | 0 |
| `Text lg` | 18px | 28px | 0 |
| `Text md` | 16px | 24px | 0 |
| `Text md-Trim` | 16px | 24px | 0 |
| `Text sm` | 14px | 20px | 0 |
| `Text xs` | 13px | 18px | 0 |
| `Text xs-Header` | 13px | 18px | 0 |
| `Text xs-Trim` | 13px | Auto | 0 |
| `Text 2xs` | 12px | 16px | 0 |
| `Text 2xs-Trim` | 12px | Auto | 0 |
| `Text 3xs` | 11px | 16px | 0 |
| `Text 3xs-Header` | 11px | Auto | 1% |
| `Text 3xs-Trim` | 11px | Auto | 0 |
| `Label xs` | 10px | Auto | 0 |
| `Label 2xs` | 8px | Auto | 0 |

Each style is available in `/Regular`, `/Medium`, `/Semibold`, `/Bold` — e.g. `Text md/Regular`, `Display xl/Semibold`.

**New in this update:**
- `Display 1.5xl-Trim` — 64px, fills the gap between Display lg (48px) and Display xl (60px)... actually sits just above Display xl at 64px. Trim (auto line-height) only, no fixed-line-height counterpart yet.
- `Label xs` / `Label 2xs` — 10px and 8px. Smaller than any existing Text style; for micro-labels like axis ticks or dense table headers. Auto line-height only.
- `Text xs-Header` — 13px with +1% letter spacing, same eyebrow-label pattern as `Text 3xs-Header` but at the larger 13px size.
- `-Trim` suffix (replaces the old `-Auto` naming) — auto line height, used where vertical rhythm is set by the container. Now available for several sizes that previously only had a fixed-line-height version.

### Usage Notes

Use `Text md/Regular` as the default body copy size. Use Display tokens for headings and section titles. Do not set custom font sizes — always apply a named text style. Contrast is handled through the `colorText*` token system, not by setting custom colors.

---

## 2. Color

### 2.1 Primitives

Raw scales. Never apply these directly in components or code — they exist to feed semantic tokens.

#### Gray — Primary Identity Scale

| Token | Value |
|---|---|

| `colorsGray25` | `#F9F8F7` |
| `colorsGray50` | `#F2F2F2` |
| `colorsGray75` | `#E5E4E3` |
| `colorsGray100` | `#CECDCC` |
| `colorsGray200` | `#B4B2B1` |
| `colorsGray300` | `#A5A2A2` |
| `colorsGray400` | `#908D8E` |
| `colorsGray500` | `#7C7879` |
| `colorsGray600` | `#666263` |
| `colorsGray700` | `#504C4D` |
| `colorsGray800` | `#3A3737` |
| `colorsGray900` | `#231F20` |
| `colorsGray950` | `#1D1A1B` |
| `colorsGray1000` | `#171516` |

#### Accent — User-Configurable Highlight Scale

| Token | Value |
|---|---|

| `colorsAccent25` | `#EBFBFF` |
| `colorsAccent50` | `#DCF5FF` |
| `colorsAccent100` | `#96E7FF` |
| `colorsAccent200` | `#6BDCFF` |
| `colorsAccent300` | `#41CFFF` |
| `colorsAccent400` | `#16C1FF` |
| `colorsAccent500` | `#00A9EB` |
| `colorsAccent600` | `#0094CD` |
| `colorsAccent700` | `#007EB0` |
| `colorsAccent800` | `#006992` |
| `colorsAccent900` | `#005474` |
| `colorsAccent950` | `#003E57` |
| `colorsAccent1000` | `#002939` |

#### Red — Error Scale

| Token | Value |
|---|---|

| `colorsRed25` | `#FEEBEE` |
| `colorsRed50` | `#FCE3E7` |
| `colorsRed100` | `#FCD7DD` |
| `colorsRed200` | `#F0BFC7` |
| `colorsRed300` | `#E07F8F` |
| `colorsRed400` | `#D65469` |
| `colorsRed500` | `#CC2944`  *(corrected — was `#cc2844`)* |
| `colorsRed600` | `#A32136` |
| `colorsRed700` | `#7A1929` |
| `colorsRed800` | `#5E121F` |
| `colorsRed900` | `#400C15` |
| `colorsRed950` | `#29080E` |
| `colorsRed1000` | `#140407` |

#### Amber — Warning Scale

| Token | Value |
|---|---|

| `colorsAmber25` | `#FFFAF0`  *(corrected — was `#fff9ef`)* |
| `colorsAmber50` | `#FFF6E4` |
| `colorsAmber100` | `#FFF1CF` |
| `colorsAmber200` | `#F9D9A3` |
| `colorsAmber300` | `#F7C774` |
| `colorsAmber400` | `#F4B446` |
| `colorsAmber500` | `#F1A118` |
| `colorsAmber600` | `#D98D0B` |
| `colorsAmber700` | `#91610E` |
| `colorsAmber800` | `#6A470B` |
| `colorsAmber900` | `#452E07` |
| `colorsAmber950` | `#302005` |
| `colorsAmber1000` | `#1A1003` |

#### Green — Success Scale

| Token | Value |
|---|---|

| `colorsGreen25` | `#E9F8F0` |
| `colorsGreen50` | `#E1F5EA` |
| `colorsGreen100` | `#D3F2E3` |
| `colorsGreen200` | `#B7DDCB` |
| `colorsGreen300` | `#6EBA95` |
| `colorsGreen400` | `#3EA372` |
| `colorsGreen500` | `#0E8C4F` |
| `colorsGreen600` | `#0B703F` |
| `colorsGreen700` | `#08542F` |
| `colorsGreen800` | `#074025` |
| `colorsGreen900` | `#052E1A` |
| `colorsGreen950` | `#031C10` |
| `colorsGreen1000` | `#01130B` |
---

### 2.2 Semantic Tokens

These adapt between light and dark mode. Always use these in components and code.

**Dark mode note:** the dark-mode column below reflects a comprehensive rebalancing in this
export — many values differ substantially from earlier versions of this document. Treat every
dark-mode value here as current.

#### Text

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorTextPrimary` | `#1D1A1B` | `#F9F8F7` | Primary body text |
| `colorTextSecondary` | `#504C4D` | `#CECDCC` | Supporting / secondary text |
| `colorTextTertiary` | `#7C7879` | `#A5A2A2` | Muted text, labels |
| `colorTextQuaternary` | `#A5A2A2` | `#7C7879` | Subtle text, captions |
| `colorTextQuinary` | `#B4B2B1` | `#666263` | Near-invisible text |
| `colorTextDisabled` | `#A5A2A2` | `#504C4D` | Disabled state text |
| `colorTextInverse` | `#F9F8F7` | `#1D1A1B` | Text on dark backgrounds |
| `colorTextPlaceholder` | `#908D8E` | `#A5A2A2` | Input placeholder text |
| `colorTextLink` | `#0094CD` | `#16C1FF` | Hyperlinks |
| `colorTextLinkHover` | `#007EB0` | `#41CFFF` | Hovered hyperlinks |
| `colorTextAccent` | `#00A9EB` | `#16C1FF` | Accent-coloured text |
| `colorTextAlwaysblack` | `#1D1A1B` | `#1D1A1B` | Always dark, regardless of mode |
| `colorTextAlwaysWhite` | `#F9F8F7` | `#F9F8F7` | Always light, regardless of mode  *(new)* |
| `colorTextGlass` | `#FFFFFF40` | `#00000040` | Text over glass surfaces  *(new)* |

#### Background

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorBgPrimary` | `#F2F2F2` | `#171516` | Primary page background |
| `colorBgSecondary` | `#E5E4E3` | `#1D1A1B` | Secondary / elevated background |
| `colorBgWhite` | `#FFFFFF` | `#171516` | White surface background |
| `colorBgQuaternary` | `#CECDCC` | `#3A3737` | Subtle filled background |
| `colorBgInverse` | `#1D1A1B` | `#FFFFFF` | Inverted background |
| `colorBgOverlay` | `#231F20` | `#1D1A1B` | Modal overlay / scrim |
| `colorBgDisabled` | `#CECDCC` | `#3A3737` | Disabled element background |
| `colorBgDisabledSubtle` | `#F2F2F2` | `#231F20` | Subtle disabled background |
| `colorBgGlass` | `#FFFFFF40` | `#00000040` | Glass / frosted surface background  *(new)* |
| `colorBgGlassIntense` | `#FFFFFF80` | `#00000080` | Stronger glass surface background  *(new)* |

#### Border

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorBorderPrimary` | `#B4B2B1` | `#504C4D` | Default border |
| `colorBorderSecondary` | `#CECDCC` | `#3A3737` | Subtle / secondary border |
| `colorBorderTertiary` | `#E5E4E3` | `#231F20` | Very subtle border |
| `colorBorderStrong` | `#908D8E` | `#7C7879` | Emphasised border |
| `colorBorderInverse` | `#FFFFFF` | `#1D1A1B` | Border on dark backgrounds |
| `colorBorderDisabled` | `#F2F2F2` | `#1D1A1B` | Disabled state border |
| `colorBorderFocus` | `#00A9EB` | `#16C1FF` | Focus ring — Accent |
| `colorBorderError` | `#CC2944` | `#D65469` | Error state border |
| `colorBorderWarning` | `#F1A118` | `#F4B446` | Warning state border |
| `colorBorderSuccess` | `#0E8C4F` | `#3EA372` | Success state border |

#### Surface

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorSurfaceGeneralCard` | `#FFFFFF` | `#1D1A1B` | Card background |
| `colorSurfaceGeneralCardHover` | `#F9F8F7` | `#3A3737` | Card hover state |
| `colorSurfaceGeneralCardWithinCard` | `#F9F8F7` | `#231F20` | Nested card on top of a card  *(new)* |
| `colorSurfaceGeneralHeader` | `#FFFFFF` | `#1D1A1B` | App header background |
| `colorSurfaceGeneralHeaderBrand` | `#00A9EB` | `#16C1FF` | Accent-coloured header variant  *(new)* |
| `colorSurfaceGeneralModal` | `#FFFFFF` | `#1D1A1B` | Modal background |
| `colorSurfaceGeneralTooltip` | `#F9F8F7` | `#3A3737` | Tooltip background |
| `colorSurfaceGeneralPopover` | `#FFFFFF` | `#3A3737` | Popover / dropdown background |
| `colorSurfaceGeneralSelected` | `#EBFBFF` | `#003E57` | Selected item background — Accent |
| `colorSurfaceGeneralSelectedStrong` | `#DCF5FF` | `#005474` | Strong selected state — Accent |
| `colorSurfaceSidebarSidebar` | `#FFFFFF` | `#231F20` | Sidebar background |
| `colorSurfaceSidebarItemDefault` | `#FFFFFF` | `#231F20` | Sidebar item default |
| `colorSurfaceSidebarItemHover` | `#F9F8F7` | `#3A3737` | Sidebar item hover |
| `colorSurfaceSidebarItemPressed` | `#F2F2F2` | `#504C4D` | Sidebar item pressed |
| `colorSurfaceSidebarItemActive` | `#FFFFFF` | `#231F20` | Sidebar item active / selected |
| `colorSurfaceSidebarItemDisabled` | `#FFFFFF` | `#231F20` | Sidebar item disabled |

#### Icon

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorIconPrimary` | `#231F20` | `#B4B2B1` | Primary icon |
| `colorIconSecondary` | `#666263` | `#908D8E` | Secondary icon |
| `colorIconTertiary` | `#A5A2A2` | `#666263` | Muted icon |
| `colorIconInverse` | `#FFFFFF` | `#1D1A1B` | Icon on dark backgrounds |
| `colorIconDisabled` | `#B4B2B1` | `#666263` | Disabled icon |
| `colorIconDisabledSubtle` | `#CECDCC` | `#504C4D` | Very subtle disabled icon |
| `colorIconAccent` | `#00A9EB` | `#16C1FF` | Accent icon |
| `colorIconError` | `#CC2944` | `#D65469` | Error icon |
| `colorIconWarning` | `#F1A118` | `#F4B446` | Warning icon |
| `colorIconSuccess` | `#0E8C4F` | `#3EA372` | Success icon |

#### Interactive

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorInteractivePrimary` | `#00A9EB` | `#00A9EB` | Primary interactive highlight — Accent |
| `colorInteractivePrimaryHover` | `#0094CD` | `#16C1FF` | Accent hover |
| `colorInteractivePrimaryPressed` | `#007EB0` | `#41CFFF` | Accent pressed |
| `colorInteractivePrimaryDisabled` | `#6BDCFF` | `#006992` | Accent disabled |
| `colorInteractivePrimaryText` | `#FFFFFF` | `#FFFFFF` | Text on Accent background |
| `colorInteractiveSecondary` | `#DCF5FF` | `#003E57` | Secondary interactive background |
| `colorInteractiveSecondaryHover` | `#96E7FF` | `#005474` | Secondary hover |
| `colorInteractiveSecondaryText` | `#007EB0` | `#41CFFF` | Text on secondary interactive |
| `colorInteractiveGhostHover` | `#E5E4E3` | `#3A3737` | Ghost element hover |
| `colorInteractiveGhostPressed` | `#CECDCC` | `#504C4D` | Ghost element pressed |
| `colorInteractiveDestructive` | `#A32136` | `#CC2944` | Destructive action |
| `colorInteractiveDestructiveHover` | `#7A1929` | `#D65469` | Destructive hover |
| `colorInteractiveDestructiveText` | `#FFFFFF` | `#FFFFFF` | Text on destructive background |

#### Status

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorStatusErrorBgSubtle` | `#FEEBEE` | `#400C15` | Error subtle background |
| `colorStatusErrorBg` | `#FCE3E7` | `#5E121F` | Error background |
| `colorStatusErrorBgStrong` | `#CC2944` | `#D65469` | Error strong fill |
| `colorStatusErrorText` | `#CC2944` | `#D65469` | Error text |
| `colorStatusErrorTextIndicator` | `#A32136` | `#E07F8F` | Error indicator text |
| `colorStatusErrorTextStrong` | `#7A1929` | `#F0BFC7` | Error strong text — new third emphasis tier  *(new)* |
| `colorStatusErrorBorder` | `#D65469` | `#A32136` | Error border |
| `colorStatusErrorIcon` | `#CC2944` | `#D65469` | Error icon |
| `colorStatusErrorGraph` | `#CC2944` | `#D65469` | Error in data visualisation |
| `colorStatusWarningBgSubtle` | `#FFFAF0` | `#452E07` | Warning subtle background |
| `colorStatusWarningBg` | `#FFF6E4` | `#6A470B` | Warning background |
| `colorStatusWarningBgStrong` | `#F1A118` | `#F4B446` | Warning strong fill |
| `colorStatusWarningText` | `#F1A118` | `#F4B446` | Warning text |
| `colorStatusWarningTextIndicator` | `#D98D0B` | `#F7C774` | Warning indicator text |
| `colorStatusWarningTextStrong` | `#91610E` | `#F9D9A3` | Warning strong text — new third emphasis tier  *(new)* |
| `colorStatusWarningBorder` | `#F4B446` | `#D98D0B` | Warning border |
| `colorStatusWarningIcon` | `#F1A118` | `#F4B446` | Warning icon |
| `colorStatusWarningGraph` | `#F1A118` | `#F4B446` | Warning in data visualisation |
| `colorStatusSuccessBgSubtle` | `#E9F8F0` | `#052E1A` | Success subtle background |
| `colorStatusSuccessBg` | `#E1F5EA` | `#074025` | Success background |
| `colorStatusSuccessBgStrong` | `#0E8C4F` | `#3EA372` | Success strong fill |
| `colorStatusSuccessText` | `#0E8C4F` | `#3EA372` | Success text |
| `colorStatusSuccessTextIndicator` | `#0B703F` | `#6EBA95` | Success indicator text |
| `colorStatusSuccessTextStrong` | `#08542F` | `#B7DDCB` | Success strong text — new third emphasis tier  *(new)* |
| `colorStatusSuccessBorder` | `#3EA372` | `#0B703F` | Success border |
| `colorStatusSuccessIcon` | `#0E8C4F` | `#3EA372` | Success icon |
| `colorStatusSuccessGraph` | `#0E8C4F` | `#3EA372` | Success in data visualisation |

#### Inputs

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorInputsBgPrimary` | `#F2F2F2` | `#504C4D` | Default input background |
| `colorInputsBgWhite` | `#FFFFFF` | `#1D1A1B` | White variant input background |
| `colorInputsBgHover` | `#E5E4E3` | `#3A3737` | Input hover state |
| `colorInputsBgActive` | `#CECDCC` | `#231F20` | Input active / focused state |
| `colorInputsBgDisabled` | `#CECDCC` | `#231F20` | Disabled input background |
| `colorInputsIconPrimary` | `#7C7879` | `#A5A2A2` | Icon inside input |
| `colorInputsIconDisabled` | `#A5A2A2` | `#504C4D` | Disabled icon inside input |

#### Float (Tooltips, popovers, dropdowns)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorFloatBgPrimary` | `#F9F8F7` | `#504C4D` | Default floating element background |
| `colorFloatBgHover` | `#F2F2F2` | `#3A3737` | Hover state |
| `colorFloatBgActive` | `#E5E4E3` | `#231F20` | Active / pressed state |
| `colorFloatBgDisabled` | `#CECDCC` | `#231F20` | Disabled state |
| `colorFloatBgWhite` | `#FFFFFF` | `#1D1A1B` | White variant |

#### Toggle

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorToggleActivePrimary` | `#231F20` | `#F2F2F2` | Active toggle track |
| `colorToggleActiveHover` | `#1D1A1B` | `#E5E4E3` | Active toggle track hover |
| `colorToggleActiveFocused` | `#231F20` | `#F2F2F2` | Active toggle track focused |
| `colorToggleActiveDisabled` | `#A5A2A2` | `#504C4D` | Active toggle track disabled |
| `colorToggleActiveToggle` | `#FFFFFF` | `#231F20` | Active toggle thumb |
| `colorToggleInactivePrimary` | `#E5E4E3` | `#7C7879` | Inactive toggle track |
| `colorToggleInactiveHover` | `#CECDCC` | `#666263` | Inactive toggle track hover |
| `colorToggleInactiveFocused` | `#E5E4E3` | `#7C7879` | Inactive toggle track focused |
| `colorToggleInactiveDisabled` | `#E5E4E3` | `#504C4D` | Inactive toggle track disabled |
| `colorToggleInactiveToggle` | `#CECDCC` | `#3A3737` | Inactive toggle thumb |

#### Checkboxes

| Token | Light | Dark | Usage |
|---|---|---|---|
| `colorCheckboxesPrimary` | `#00000003` | `#FFFFFF03` | Default checkbox background |
| `colorCheckboxesHover` | `#0000000D` | `#FFFFFF0D` | Hover state |
| `colorCheckboxesFocused` | `#00000003` | `#FFFFFF03` | Focused state |
| `colorCheckboxesDisabled` | `#F2F2F2` | `#231F20` | Disabled state |

---

### 2.3 Button Color Tokens

#### Button — Brand
The primary button across all SHAPE 3.0 surfaces. Built from the Gray identity scale.

**Primary**

| Token | Light | Dark |
|---|---|---|
| `colorButtonBrandPrimaryBgDefault` | `#231F20` | `#F9F8F7` |
| `colorButtonBrandPrimaryBgHover` | `#3A3737` | `#E5E4E3` |
| `colorButtonBrandPrimaryBgActive` | `#504C4D` | `#CECDCC` |
| `colorButtonBrandPrimaryBgFocused` | `#231F20` | `#F9F8F7` |
| `colorButtonBrandPrimaryBgDisabled` | `#A5A2A2` | `#3A3737` |
| `colorButtonBrandPrimaryBgLoading` | `#231F20` | `#F9F8F7` |
| `colorButtonBrandPrimaryItemsDefaultText` | `#E5E4E3` | `#3A3737` |
| `colorButtonBrandPrimaryItemsDefaultIcon` | `#F9F8F7` | `#231F20` |
| `colorButtonBrandPrimaryItemsDisabledText` | `#E5E4E3` | `#908D8E` |
| `colorButtonBrandPrimaryItemsDisabledIcon` | `#E5E4E3` | `#666263` |

**Secondary**

| Token | Light | Dark |
|---|---|---|
| `colorButtonBrandSecondaryBgDefault` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonBrandSecondaryBgHover` | `#E5E4E3` | `#3A3737` |
| `colorButtonBrandSecondaryBgActive` | `#CECDCC` | `#504C4D` |
| `colorButtonBrandSecondaryBgFocused` | `#FFFFFF03` | `#FFFFFF03` |
| `colorButtonBrandSecondaryBgDisabled` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonBrandSecondaryBorderDefault` | `#231F20` | `#F9F8F7` |
| `colorButtonBrandSecondaryBorderDisabled` | `#908D8E` | `#666263` |
| `colorButtonBrandSecondaryItemsDefaultText` | `#3A3737` | `#E5E4E3` |
| `colorButtonBrandSecondaryItemsDefaultIcon` | `#231F20` | `#F9F8F7` |
| `colorButtonBrandSecondaryItemsDisabledText` | `#B4B2B1` | `#504C4D` |
| `colorButtonBrandSecondaryItemsDisabledIcon` | `#A5A2A2` | `#666263` |

**Ghost**

| Token | Light | Dark |
|---|---|---|
| `colorButtonBrandGhostBgDefault` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonBrandGhostBgHover` | `#E5E4E3` | `#3A3737` |
| `colorButtonBrandGhostBgActive` | `#CECDCC` | `#504C4D` |
| `colorButtonBrandGhostBgDisabled` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonBrandGhostItemsDefaultText` | `#3A3737` | `#E5E4E3` |
| `colorButtonBrandGhostItemsDefaultIcon` | `#231F20` | `#F9F8F7` |
| `colorButtonBrandGhostItemsDisabledText` | `#B4B2B1` | `#504C4D` |
| `colorButtonBrandGhostItemsDisabledIcon` | `#A5A2A2` | `#666263` |

#### Button — Accent
Used for user-facing report and configuration actions. Tied to the Accent scale.

**Primary**

| Token | Light | Dark |
|---|---|---|
| `colorButtonAccentPrimaryBgDefault` | `#00A9EB` | `#16C1FF` |
| `colorButtonAccentPrimaryBgHover` | `#0094CD` | `#41CFFF` |
| `colorButtonAccentPrimaryBgActive` | `#007EB0` | `#6BDCFF` |
| `colorButtonAccentPrimaryBgFocused` | `#00A9EB` | `#16C1FF` |
| `colorButtonAccentPrimaryBgDisabled` | `#A5A2A2` | `#3A3737` |
| `colorButtonAccentPrimaryBgLoading` | `#00A9EB` | `#16C1FF` |
| `colorButtonAccentPrimaryItemsDefaultText` | `#FFFFFF` | `#1D1A1B` |
| `colorButtonAccentPrimaryItemsDefaultIcon` | `#F9F8F7` | `#1D1A1B` |
| `colorButtonAccentPrimaryItemsDisabledText` | `#E5E4E3` | `#908D8E` |
| `colorButtonAccentPrimaryItemsDisabledIcon` | `#E5E4E3` | `#666263` |

**Secondary**

| Token | Light | Dark |
|---|---|---|
| `colorButtonAccentSecondaryBgDefault` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonAccentSecondaryBgHover` | `#EBFBFF` | `#003E57` |
| `colorButtonAccentSecondaryBgActive` | `#DCF5FF` | `#005474` |
| `colorButtonAccentSecondaryBgFocused` | `#FFFFFF03` | `#FFFFFF03` |
| `colorButtonAccentSecondaryBgDisabled` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonAccentSecondaryBorderDefault` | `#00A9EB` | `#16C1FF` |
| `colorButtonAccentSecondaryBorderDisabled` | `#908D8E` | `#666263` |
| `colorButtonAccentSecondaryItemsDefaultText` | `#00A9EB` | `#41CFFF` |
| `colorButtonAccentSecondaryItemsDefaultIcon` | `#00A9EB` | `#41CFFF` |
| `colorButtonAccentSecondaryItemsDisabledText` | `#B4B2B1` | `#504C4D` |
| `colorButtonAccentSecondaryItemsDisabledIcon` | `#A5A2A2` | `#666263` |

**Ghost**

| Token | Light | Dark |
|---|---|---|
| `colorButtonAccentGhostBgDefault` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonAccentGhostBgHover` | `#EBFBFF` | `#003E57` |
| `colorButtonAccentGhostBgActive` | `#DCF5FF` | `#005474` |
| `colorButtonAccentGhostBgDisabled` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonAccentGhostItemsDefaultText` | `#00A9EB` | `#41CFFF` |
| `colorButtonAccentGhostItemsDefaultIcon` | `#00A9EB` | `#41CFFF` |
| `colorButtonAccentGhostItemsDisabledText` | `#B4B2B1` | `#504C4D` |
| `colorButtonAccentGhostItemsDisabledIcon` | `#A5A2A2` | `#3A3737` |

#### Button — Destructive

**Primary**

| Token | Light | Dark |
|---|---|---|
| `colorButtonDestructivePrimaryBgDefault` | `#A32136` | `#D65469` |
| `colorButtonDestructivePrimaryBgHover` | `#7A1929` | `#E07F8F` |
| `colorButtonDestructivePrimaryBgActive` | `#5E121F` | `#F0BFC7` |
| `colorButtonDestructivePrimaryBgFocused` | `#A32136` | `#D65469` |
| `colorButtonDestructivePrimaryBgDisabled` | `#A5A2A2` | `#3A3737` |
| `colorButtonDestructivePrimaryBgLoading` | `#A32136` | `#D65469` |
| `colorButtonDestructivePrimaryItemsDefaultText` | `#FFFFFF` | `#1D1A1B` |
| `colorButtonDestructivePrimaryItemsDefaultIcon` | `#F9F8F7` | `#1D1A1B` |
| `colorButtonDestructivePrimaryItemsDisabledText` | `#E5E4E3` | `#908D8E` |
| `colorButtonDestructivePrimaryItemsDisabledIcon` | `#E5E4E3` | `#666263` |

**Secondary**

| Token | Light | Dark |
|---|---|---|
| `colorButtonDestructiveSecondaryBgDefault` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonDestructiveSecondaryBgHover` | `#FEEBEE` | `#29080E` |
| `colorButtonDestructiveSecondaryBgActive` | `#FCE3E7` | `#400C15` |
| `colorButtonDestructiveSecondaryBgFocused` | `#FFFFFF03` | `#FFFFFF03` |
| `colorButtonDestructiveSecondaryBgDisabled` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonDestructiveSecondaryBorderDefault` | `#CC2944` | `#D65469` |
| `colorButtonDestructiveSecondaryBorderDisabled` | `#908D8E` | `#666263` |
| `colorButtonDestructiveSecondaryItemsDefaultText` | `#CC2944` | `#E07F8F` |
| `colorButtonDestructiveSecondaryItemsDefaultIcon` | `#CC2944` | `#D65469` |
| `colorButtonDestructiveSecondaryItemsDisabledText` | `#B4B2B1` | `#504C4D` |
| `colorButtonDestructiveSecondaryItemsDisabledIcon` | `#A5A2A2` | `#666263` |

**Ghost**

| Token | Light | Dark |
|---|---|---|
| `colorButtonDestructiveGhostBgDefault` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonDestructiveGhostBgHover` | `#FEEBEE` | `#29080E` |
| `colorButtonDestructiveGhostBgActive` | `#FCE3E7` | `#400C15` |
| `colorButtonDestructiveGhostBgDisabled` | `#FFFFFF00` | `#FFFFFF00` |
| `colorButtonDestructiveGhostItemsDefaultText` | `#CC2944` | `#E07F8F` |
| `colorButtonDestructiveGhostItemsDefaultIcon` | `#CC2944` | `#D65469` |
| `colorButtonDestructiveGhostItemsDisabledText` | `#B4B2B1` | `#504C4D` |
| `colorButtonDestructiveGhostItemsDisabledIcon` | `#A5A2A2` | `#666263` |

---

### 2.4 Graph / Data Visualisation Colors

Used exclusively in charts and data visualisation. Do not use for UI states or feedback. Values
below are the 500-step representative shade for each color; each has a full scale (25–1000).

| Name | Token | Value |
|---|---|---|
| Personal Blue | `colorsGraphColorsMainPersonalBlue` | `#00A9EB` |
| Team Blue | `colorsGraphColorsMainTeamBlue` | `#0074BC` |
| Org Blue | `colorsGraphColorsMainOrgBlue` | `#20409A` |
| Lavender Violet | `colorsGraphColorsMainLavenderViolet` | `#A86CFF` |
| Amber Orange | `colorsGraphColorsMainAmberOrange` | `#FF9900` |
| Mint Green | `colorsGraphColorsMainMintGreen` | `#00D998` |
| Golden Yellow | `colorsGraphColorsMainGoldenYellow` | `#FFD700` |
| Coral Red | `colorsGraphColorsMainCoralRed` | `#FF6B6B` |
| Teal | `colorsGraphColorsMainTeal` | `#26A69A` |
| Purple | `colorsGraphColorsMainPurple` | `#8E24AA` |
| Turquoise | `colorsGraphColorsMainTurquoise` | `#00CED1` |
| Hot Pink | `colorsGraphColorsMainHotPink` | `#FF4081` |
| Orange Coral | `colorsGraphColorsMainOrangeCoral` | `#FF7043` |
| Lime Green | `colorsGraphColorsMainLimeGreen` | `#8BC34A` |
| Magenta | `colorsGraphColorsMainMagenta` | `#FF00FF` |
| Olive Green | `colorsGraphColorsMainOliveGreen` | `#6B8E23` |
| Cyan Glow | `colorsGraphColorsMainCyanGlow` | `#00E5FF` |
| Neon Lime | `colorsGraphColorsMainNeonLime` | `#C6FF00` |
| Steel Blue | `colorsGraphColorsMainSteelBlue` | `#4682B4` |
| Slate Gray | `colorsGraphColorsMainSlateGray` | `#37474F` |

Each graph color has a full shade scale (25 through 1000) using the pattern `colorsGraphColors[Name][Shade]`. Unchanged from the previous version of this document.

---

### 2.5 Heat Map Scale *(new)*

A dedicated 10-step diverging scale for heat map views — Red at one end, Green at the other,
anchored to the brand primitives at both endpoints (`0–20` = `colorsRed500`, `95–100` sits at
`colorsGreen400`). This is the resolved output of the earlier heat-map color-contract fix:
saturation was pulled from the Graph/Dataviz palette before, now it's a purpose-built scale that
reads as part of the same brand family.

| Token | Light | Dark |
|---|---|---|
| `utility/Heat Map/0 - 20` | `#CC2944` | `#FF9696` |
| `utility/Heat Map/20 - 30` | `#FF6B6B` | `#FF8080` |
| `utility/Heat Map/30 - 40` | `#FF8080` | `#FF6B6B` |
| `utility/Heat Map/40 - 50` | `#FF9D80` | `#BD3806` |
| `utility/Heat Map/50 - 60` | `#FFB49F` | `#922E06` |
| `utility/Heat Map/60 - 70` | `#FFD088` | `#553400`  *(the earlier targeted correction — confirmed current)* |
| `utility/Heat Map/70 - 80` | `#FFDEAA` | `#331F00` |
| `utility/Heat Map/80 - 90` | `#C2FFEF` | `#002A1F` |
| `utility/Heat Map/90 - 95` | `#94FFDF` | `#007A55` |
| `utility/Heat Map/95 - 100` | `#3EA372` | `#6EBA95` |

Apply score-to-color mapping as fixed, absolute thresholds — a score of 62 is always the `60–70`
band regardless of what other values are in the same row or column. Row-relative binning was the
bug identified in the earlier heat map review; this scale only works correctly with absolute
thresholds.

---

### 2.6 Likert Scale *(new)*

A 5-point Likert scale (Very Bad → V Good) with subtle background variants for each step —
intended for survey-response visualizations (e.g. agreement scales, satisfaction ratings).

| Token | Light | Dark |
|---|---|---|
| `utility/Likert/Very Bad` | `#CC2944` | `#D65469` |
| `utility/Likert/Very Bad Subtle` | `#FCD7DD` | `#400C15` |
| `utility/Likert/Bad` | `#FF6B6B` | `#FF8080` |
| `utility/Likert/Bad Subtle` | `#FFE3DC` | `#33160D` |
| `utility/Likert/Neutral` | `#F1A118` | `#F4B446` |
| `utility/Likert/Neutral Subtle` | `#FFF1CF` | `#302005` |
| `utility/Likert/Good` | `#00C389` | `#00D998` |
| `utility/Likert/Good Subtle` | `#C2FFEF` | `#002A1F` |
| `utility/Likert/V Good` | `#0E8C4F` | `#3EA372` |
| `utility/Likert/V Good Subtle` | `#D3F2E3` | `#052E1A` |
---

## 3. Shadows and Effects

All shadow effect styles are defined in Figma under `Shadow/*`, `Focus Ring/*`, and `Glass/*`. Shadow colors are bound to variables from the `utility/Shadows/` collection, which resolve to different opacity values in light and dark mode. Never hardcode shadow color values — always reference the variable.

Shadow structure (5 layered `DROP_SHADOW` effects per style: `shadow-xs` through `shadow-2xl`, plus directional variants `shadow-left`, `shadow-right`, `shadow-right-subtle`, `shadow-top`, `shadow-top-subtle`, `shadow-bottom`) is unchanged from the previous version of this document.

### Focus Ring Styles

| Style | Structure |
|---|---|
| `Focus Ring/focus-ring` | Outer ring: 4px spread, color `utility/Accent/200`. Inner ring: 2px spread, color `utility/Base/white` |
| `Focus Ring/focus-ring-subtle` | *(new)* Softer variant of the default focus ring — lower-contrast contexts |
| `Focus Ring/focus-ring-error` | Outer ring: 4px spread, color `utility/Error/400`. Inner ring: 2px spread, color `utility/Base/white` |
| `Focus Ring/focus-ring-error-subtle` | *(new)* Softer variant of the error focus ring |

### Glass Effect Styles *(new)*

| Style | Usage |
|---|---|
| `Glass/glass` | Frosted/blurred surface effect, paired with `colorBgGlass` |
| `Glass/glass-subtle` | Lighter frosted effect, paired with `colorBgGlassIntense`/`colorTextGlass` |

### Elevation Usage Guide

| Level | Component examples |
|---|---|
| `shadow-xs` | Chips, tags, inline badges |
| `shadow-sm` | Cards, input fields, surface panels |
| `shadow-md` | Dropdowns, popovers, floating menus, tooltips |
| `shadow-lg` | Modals, dialogs, side drawers |
| `shadow-xl` | Context panels, full-screen overlays |
| `shadow-2xl` | Command palettes, highest-priority overlays |

---

## 4. Spacing

Base unit: **4px**. Semantic spacing tokens are still named by pixel value (`spacing/4` = 4px) —
unchanged usage pattern, even though the underlying primitive scale was renamed internally to a
step-index system (`Spacing/1` = 4px, `Spacing/2` = 8px, etc). You should never reference the
primitive scale directly, so this internal rename doesn't affect how you use these tokens.

| Token | Value |
|---|---|
| `spacing0` | 0px |
| `spacing2` | 2px  *(new)* |
| `spacing4` | 4px |
| `spacing6` | 6px  *(new)* |
| `spacing8` | 8px |
| `spacing12` | 12px |
| `spacing16` | 16px |
| `spacing20` | 20px |
| `spacing24` | 24px |
| `spacing32` | 32px |
| `spacing40` | 40px |
| `spacing48` | 48px |
| `spacing64` | 64px |
| `spacing80` | 80px |
| `spacing96` | 96px |
| `spacing128` | 128px |
| `spacing160` | 160px |
| `spacing192` | 192px |
| `spacing224` | 224px |
| `spacing256` | 256px |
| `spacing320` | 320px |
| `spacing360` | 360px |
| `spacing384` | 384px |
| `spacing480` | 480px |
| `spacing560` | 560px |
| `spacing640` | 640px |
| `spacing720` | 720px |
| `spacing768` | 768px |
| `spacing1024` | 1024px |
| `spacing1280` | 1280px |
| `spacing1440` | 1440px |
| `spacing1600` | 1600px |
| `spacing1920` | 1920px |

---

## 5. Border Radius

Two new semantic tokens resolve values that were previously just hardcoded numbers in spec docs
rather than named tokens: `radiusWidget` (18px, the Global Widget Rules corner radius) and
`radiusReportCard` (38px, the report canvas card radius).

| Token | Value | Usage |
|---|---|---|
| `radiusNone` | 0px | No rounding |
| `radiusXs` | 4px | Small inline elements |
| `radiusSm` | 6px | Small components |
| `radiusTooltip` | 6px | Tooltips |
| `radiusMd` | 8px | Medium components |
| `radiusButton` | 8px | All button variants |
| `radiusInput` | 8px | All inputs and selects |
| `radiusLg` | 12px | Large components |
| `radiusXl` | 16px | Extra large components |
| `radiusCard` | 16px | Cards and panels |
| `radiusWidget` | 18px | *(new)* Widget tiles on the Report Canvas |
| `radius2xl` | 24px | Large containers |
| `radiusModal` | 24px | Modals and dialogs |
| `radius3xl` | 32px | Extra large containers |
| `radius4xl` | 36px | *(new)* — feeds report-card radius family |
| `radiusReportCard` | 38px | *(new)* The Report Canvas card container |
| `radiusFull` | 9999px | Pills, avatars, circular elements |
| `radiusBadge` | 9999px | Badges |

Prefer the component-specific tokens (`radiusButton`, `radiusCard`, `radiusWidget`, `radiusReportCard`, `radiusModal`, `radiusInput`, `radiusTooltip`, `radiusBadge`) over the scale tokens when building those components.

---

## 6. Border Width

Unchanged.

| Token | Value | Usage |
|---|---|---|
| `borderWidthNone` | 0px | No border |
| `borderWidthSm` | 1px | Default — inputs, cards, dividers |
| `borderWidthMd` | 2px | Emphasis — focus rings, selected states |
| `borderWidthLg` | 4px | Strong — active indicators |
| `borderWidthXl` | 8px | Heavy — structural dividers |

---

## 7. Opacity

Unchanged.

| Token | Value |
|---|---|
| `opacity0` | 0 |
| `opacity5` | 0.05 |
| `opacity10` | 0.10 |
| `opacity20` | 0.20 |
| `opacity25` | 0.25 |
| `opacity30` | 0.30 |
| `opacity40` | 0.40 |
| `opacity50` | 0.50 |
| `opacity60` | 0.60 |
| `opacity70` | 0.70 |
| `opacity75` | 0.75 |
| `opacity80` | 0.80 |
| `opacity90` | 0.90 |
| `opacity95` | 0.95 |
| `opacity100` | 1 |

For disabled component states, prefer dedicated color tokens (e.g. `colorButtonBrandPrimaryBgDisabled`) over opacity.

---

## 8. Breakpoints

Unchanged. Mobile-first. Styles are defined for the smallest viewport first, then extended upward using `min-width` queries.

| Token | Value | Tier |
|---|---|---|
| `breakpointXs` | 320px | Narrow mobile |
| `breakpointSm` | 640px | Mobile |
| `breakpointMd` | 768px | Tablet portrait |
| `breakpointLg` | 1024px | Tablet landscape / small desktop |
| `breakpointXl` | 1280px | Desktop |
| `breakpoint2xl` | 1440px | Wide desktop |
| `breakpoint3xl` | 1920px | Large / ultrawide display |

---

## 9. Components

Components are built in Figma. What follows is a reference of the component inventory — their variant properties, sizes, and which token groups they use. This section describes what exists, not implementation specs. Unchanged from the previous version of this document — re-verify against Figma if a component's variants are load-bearing for a build decision.

### Buttons
**Component:** `Buttons/Button`
**Variant properties:** `Theme` (Accent, Brand, Destructive) · `Size` (xs 28px, sm 36px, md 48px, lg 60px) · `Type` (round, square) · `Variation` (primary, secondary, link) · `State` (default, hover, active, focused, disabled, loading) · `Text` (true, false)
**Token groups used:** `colorButtonBrand*`, `colorButtonAccent*`, `colorButtonDestructive*`

### Input Fields
**Component:** `Input Field`
**Variant properties:** `State` (Default, Hover, Focused, Filled, Disabled, Error, Success, Loading) · `Background` (Surface, Inverted)
**Token groups used:** `colorInputs*`, `colorBorder*`, `colorStatus*`

### Input Select / Dropdown
**Component:** `Input select`
**Variant properties:** `State` (Default, Focused, Disabled, Destructive) · `Expanded` (True, False) · `Tags` (True, False)
**Token groups used:** `colorInputs*`, `colorFloat*`, `colorBorder*`

### Textarea
**Component:** `Textarea`
**Variant properties:** `State` (Default, Hover, Focused, Filled, Disabled, Error) · `Background` (Surface)

### Number Stepper
**Component:** `Number Stepper`
**Variant properties:** `State` (default, min, max)

### Date Changer
**Component:** `Date Changer`
**Variant properties:** `Navigation` (True, False) · `Expanded` (True, False)

### Floating Menu
**Component:** `Floating Menu`
**Variant properties:** `Navigation` (True, False)
**Token groups used:** `colorFloat*`

### Tooltips
**Page:** `↳ Tooltips` — uses `colorSurfaceGeneralTooltip` for background and `Shadow/shadow-md` for elevation. Border radius uses `radiusTooltip` (6px).

### Tags and Badges
**Page:** `↳ Tags & Badges` — uses `colorBg*` and `colorText*` tokens for fill and label color. `radiusBadge` (`9999px`) for pill-shaped badges.

### Selection Controls
**Page:** `↳ Selection Controls` — checkboxes and toggles. Uses `colorCheckboxes*` and `colorToggle*` token groups respectively.

### Feedback and Status
**Page:** `↳ Feedback & Status` — uses `colorStatus*` token groups for all error, warning, and success states.

### Navigation
**Page:** `↳ Navigation` — uses `colorSurfaceSidebar*` tokens for sidebar items and `colorText*` for nav labels.

### Data Display
**Page:** `↳ Data Display` — uses `colorsGraphColors*` for chart and graph elements, plus the new `utility/Heat Map/*` and `utility/Likert/*` scales for their respective visualisation types.

---

## 10. Quick Reference

| Situation | Token group |
|---|---|
| Page and surface backgrounds | `colorBg*` |
| Cards, modals, sidebars, popovers | `colorSurface*` |
| Body text, labels, captions | `colorText*` |
| Borders and dividers | `colorBorder*` |
| Icons | `colorIcon*` |
| Focus rings, links, selected states | Accent-based tokens within `colorBorder*`, `colorSurface*`, `colorText*` |
| Primary platform buttons | `colorButtonBrand*` |
| User-facing report / config actions | `colorButtonAccent*` |
| Destructive actions | `colorButtonDestructive*` |
| Form inputs | `colorInputs*` |
| Tooltips, dropdowns, floating menus | `colorFloat*` |
| Toggle switches | `colorToggle*` |
| Checkboxes | `colorCheckboxes*` |
| Feedback banners, status states | `colorStatus*` |
| Charts and data visualisation | `colorsGraphColors*` |
| Heat map views | `utility/Heat Map/*` *(new)* |
| Likert / agreement scales | `utility/Likert/*` *(new)* |
| Widget corner radius | `radiusWidget` *(new)* |
| Report canvas card radius | `radiusReportCard` *(new)* |
| Glass / frosted surfaces | `colorBgGlass*`, `Glass/*` effect styles *(new)* |
| Elevation / depth | `Shadow/*` effect styles |
| Focus indication | `Focus Ring/*` effect styles |
