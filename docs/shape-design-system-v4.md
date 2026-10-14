# SHAPE Design System Reference
> Source of truth: Figma file `SHAPE — Form` + Variables2JSON export
> Last updated: August 2026 (rev 2)
> Single reference document for developers and AI tooling

---

## Overview

SHAPE 3.0 is a creator and user platform for survey-based intelligence services. This design system covers all SHAPE 3.0 surfaces: Store, Creator Studio, Library, and the Report layer.

**Two things define the visual identity:**

**Gray** is the primary identity color. All surfaces, text, borders, icons, and the Brand button are built from this scale. Gray 950 (`#1D1A1B`) is the primary dark value throughout.

**Accent** is the interactive highlight color — used for focus rings, links, selected states, and the Accent button. This is the color users interact with when building and configuring reports. It is designed to be user-configurable in a future release.

All other tokens are utilities — they describe component states, not the platform's character.

**Figma is the source of truth.** Update this document whenever the Figma file is updated.

---

## How to Use Tokens

Always reference semantic tokens, not primitives.

| ✅ Correct | ❌ Incorrect |
|---|---|
| `color/text/primary` | `Colors/Gray/950` |
| `color/bg/primary` | `#f2f2f2` |
| `color/status/error/text` | `Colors/Red/500` |

Semantic tokens adapt between light and dark mode automatically. Raw primitive values do not.

**Token naming:** Tokens use slash-separated paths — e.g. `color/bg/primary`, `color/button/brand/primary/bg/default`. Reference them exactly as named.

---

## 1. Typography

**Typeface:** IBM Plex Sans
**Weights in use:** Regular (400), Medium (500), Semibold (600), Bold (700)

Each size has four weight variants. Use the full style name — e.g. `Display xl/Semibold`, `Text md/Regular`.

### Type Scale

| Style Name | Size | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|
| `Display 4xl` | 96px | 120px | -2% | |
| `Display 3xl` | 84px | 105px | -2% | |
| `Display 2xl` | 72px | 90px | -2% | |
| `Display 1.5xl-Trim` | 64px | Auto | -2% | Auto LH variant |
| `Display xl` | 60px | 72px | -2% | |
| `Display lg` | 48px | 60px | -2% | |
| `Display lg-Trim` | 48px | Auto | -2% | Auto LH variant |
| `Display md` | 36px | 44px | -2% | |
| `Display md-Trim` | 36px | Auto | -2% | Auto LH variant |
| `Display sm` | 30px | 38px | 0% | |
| `Display xs` | 24px | 32px | 0% | |
| `Text xl` | 20px | 30px | 0% | |
| `Text xl-Trim` | 20px | Auto | 0% | Auto LH variant |
| `Text lg` | 18px | 28px | 0% | |
| `Text md` | 16px | 24px | 0% | Default body copy |
| `Text md-Trim` | 16px | 24px | 0% | |
| `Text sm` | 14px | 20px | 0% | |
| `Text xs` | 13px | 18px | 0% | |
| `Text xs-Trim` | 13px | Auto | 0% | Auto LH variant |
| `Text xs-Header` | 13px | 18px | 0% | Header/eyebrow variant |
| `Text 2xs` | 12px | 16px | 0% | |
| `Text 2xs-Trim` | 12px | Auto | 0% | Auto LH variant |
| `Text 3xs` | 11px | 16px fixed | 0% | Fixed line height |
| `Text 3xs-Trim` | 11px | Auto | 0% | Auto LH variant |
| `Text 3xs-Header` | 11px | Auto | +1% | Column headers, eyebrow labels |
| `Label xs` | 10px | Auto | 0% | Micro labels |
| `Label 2xs` | 8px | Auto | 0% | Smallest label size |

**`-Trim` variants** use auto line height — use where the container controls vertical rhythm rather than the type itself.

`Text md/Regular` is the default body copy size. Do not set custom font sizes — always apply a named text style.

---

## 2. Color — Primitives

Raw scales. Never apply directly in components or code — they exist to feed semantic tokens only.

### Gray — Primary Identity Scale

| Token | Value |
|---|---|
| `Colors/Gray/25` | `#F9F8F7` |
| `Colors/Gray/50` | `#F2F2F2` |
| `Colors/Gray/75` | `#E5E4E3` |
| `Colors/Gray/100` | `#CECDCC` |
| `Colors/Gray/200` | `#B4B2B1` |
| `Colors/Gray/300` | `#A5A2A2` |
| `Colors/Gray/400` | `#908D8E` |
| `Colors/Gray/500` | `#7C7879` |
| `Colors/Gray/600` | `#666263` |
| `Colors/Gray/700` | `#504C4D` |
| `Colors/Gray/800` | `#3A3737` |
| `Colors/Gray/900` | `#231F20` |
| `Colors/Gray/950` | `#1D1A1B` |
| `Colors/Gray/1000` | `#171516` |

### Accent — User-Configurable Highlight Scale

| Token | Value |
|---|---|
| `Colors/Accent/25` | `#EBFBFF` |
| `Colors/Accent/50` | `#DCF5FF` |
| `Colors/Accent/100` | `#96E7FF` |
| `Colors/Accent/200` | `#6BDCFF` |
| `Colors/Accent/300` | `#41CFFF` |
| `Colors/Accent/400` | `#16C1FF` |
| `Colors/Accent/500` | `#00A9EB` |
| `Colors/Accent/600` | `#0094CD` |
| `Colors/Accent/700` | `#007EB0` |
| `Colors/Accent/800` | `#006992` |
| `Colors/Accent/900` | `#005474` |
| `Colors/Accent/950` | `#003E57` |
| `Colors/Accent/1000` | `#002939` |

### Red — Error Scale

| Token | Value |
|---|---|
| `Colors/Red/25` | `#FEEBEE` |
| `Colors/Red/50` | `#FCE3E7` |
| `Colors/Red/100` | `#FCD7DD` |
| `Colors/Red/200` | `#F0BFC7` |
| `Colors/Red/300` | `#E07F8F` |
| `Colors/Red/400` | `#D65469` |
| `Colors/Red/500` | `#CC2944` |
| `Colors/Red/600` | `#A32136` |
| `Colors/Red/700` | `#7A1929` |
| `Colors/Red/800` | `#5E121F` |
| `Colors/Red/900` | `#400C15` |
| `Colors/Red/950` | `#29080E` |
| `Colors/Red/1000` | `#140407` |

### Amber — Warning Scale

| Token | Value |
|---|---|
| `Colors/Amber/25` | `#FFFAF0` |
| `Colors/Amber/50` | `#FFF6E4` |
| `Colors/Amber/100` | `#FFF1CF` |
| `Colors/Amber/200` | `#F9D9A3` |
| `Colors/Amber/300` | `#F7C774` |
| `Colors/Amber/400` | `#F4B446` |
| `Colors/Amber/500` | `#F1A118` |
| `Colors/Amber/600` | `#D98D0B` |
| `Colors/Amber/700` | `#91610E` |
| `Colors/Amber/800` | `#6A470B` |
| `Colors/Amber/900` | `#452E07` |
| `Colors/Amber/950` | `#302005` |
| `Colors/Amber/1000` | `#1A1003` |

### Green — Success Scale

| Token | Value |
|---|---|
| `Colors/Green/25` | `#E9F8F0` |
| `Colors/Green/50` | `#E1F5EA` |
| `Colors/Green/100` | `#D3F2E3` |
| `Colors/Green/200` | `#B7DDCB` |
| `Colors/Green/300` | `#6EBA95` |
| `Colors/Green/400` | `#3EA372` |
| `Colors/Green/500` | `#0E8C4F` |
| `Colors/Green/600` | `#0B703F` |
| `Colors/Green/700` | `#08542F` |
| `Colors/Green/800` | `#074025` |
| `Colors/Green/900` | `#052E1A` |
| `Colors/Green/950` | `#031C10` |
| `Colors/Green/1000` | `#01130B` |

---

## 3. Color — Semantic Tokens

These adapt between light and dark mode. Always use these in components and code.

### Text

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/text/primary` | `#1D1A1B` | `#F9F8F7` | Primary body text |
| `color/text/secondary` | `#504C4D` | `#CECDCC` | Supporting / secondary text |
| `color/text/tertiary` | `#7C7879` | `#A5A2A2` | Muted text, labels |
| `color/text/quaternary` | `#A5A2A2` | `#7C7879` | Subtle text, captions |
| `color/text/quinary` | `#B4B2B1` | `#666263` | Near-invisible text |
| `color/text/disabled` | `#A5A2A2` | `#504C4D` | Disabled state text |
| `color/text/inverse` | `#F9F8F7` | `#1D1A1B` | Text on dark backgrounds |
| `color/text/placeholder` | `#908D8E` | `#A5A2A2` | Input placeholder text |
| `color/text/link` | `#0094CD` | `#16C1FF` | Hyperlinks |
| `color/text/link-hover` | `#007EB0` | `#41CFFF` | Hovered hyperlinks |
| `color/text/accent` | `#00A9EB` | `#16C1FF` | Accent-coloured text |
| `color/text/alwaysblack` | `#1D1A1B` | `#1D1A1B` | Always dark regardless of mode |
| `color/text/glass 2` | `rgba(255,255,255,0.25)` | `rgba(0,0,0,0.25)` | Text on glass/frosted surfaces |

### Background

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/bg/primary` | `#F2F2F2` | `#171516` | Primary page background |
| `color/bg/secondary` | `#E5E4E3` | `#1D1A1B` | Secondary / elevated background |
| `color/bg/white` | `#FFFFFF` | `#171516` | White surface background |
| `color/bg/quaternary` | `#CECDCC` | `#3A3737` | Subtle filled background |
| `color/bg/inverse` | `#1D1A1B` | `#FFFFFF` | Inverted background |
| `color/bg/overlay` | `#231F20` | `#1D1A1B` | Modal overlay / scrim |
| `color/bg/disabled` | `#CECDCC` | `#3A3737` | Disabled element background |
| `color/bg/disabled-subtle` | `#F2F2F2` | `#231F20` | Subtle disabled background |
| `color/bg/glass` | `rgba(255,255,255,0.25)` | `rgba(0,0,0,0.25)` | Frosted / glass surface |
| `color/bg/glass intense` | `rgba(255,255,255,0.50)` | `rgba(0,0,0,0.50)` | Stronger frosted surface |

### Border

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/border/primary` | `#B4B2B1` | `#504C4D` | Default border |
| `color/border/secondary` | `#CECDCC` | `#3A3737` | Subtle / secondary border |
| `color/border/tertiary` | `#E5E4E3` | `#231F20` | Very subtle border |
| `color/border/strong` | `#908D8E` | `#7C7879` | Emphasised border |
| `color/border/inverse` | `#FFFFFF` | `#1D1A1B` | Border on dark backgrounds |
| `color/border/disabled` | `#F2F2F2` | `#1D1A1B` | Disabled state border |
| `color/border/focus` | `#00A9EB` | `#16C1FF` | Focus ring — Accent |
| `color/border/error` | `#CC2944` | `#D65469` | Error state border |
| `color/border/warning` | `#F1A118` | `#F4B446` | Warning state border |
| `color/border/success` | `#0E8C4F` | `#3EA372` | Success state border |

### Surface

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/surface/General/card` | `#FFFFFF` | `#1D1A1B` | Card background |
| `color/surface/General/card-hover` | `#F9F8F7` | `#3A3737` | Card hover state |
| `color/surface/General/card-within-card` | `#F9F8F7` | `#231F20` | Nested card background |
| `color/surface/General/header` | `#FFFFFF` | `#1D1A1B` | App header background |
| `color/surface/General/header-brand` | `#00A9EB` | `#16C1FF` | Branded header — Accent |
| `color/surface/General/modal` | `#FFFFFF` | `#1D1A1B` | Modal background |
| `color/surface/General/tooltip` | `#F9F8F7` | `#3A3737` | Tooltip background |
| `color/surface/General/popover` | `#FFFFFF` | `#3A3737` | Popover / dropdown background |
| `color/surface/General/selected` | `#EBFBFF` | `#003E57` | Selected item background — Accent |
| `color/surface/General/selected-strong` | `#DCF5FF` | `#005474` | Strong selected state — Accent |
| `color/surface/Sidebar/sidebar` | `#FFFFFF` | `#231F20` | Sidebar background |
| `color/surface/Sidebar/item default` | `#FFFFFF` | `#231F20` | Sidebar item default |
| `color/surface/Sidebar/item hover` | `#F9F8F7` | `#3A3737` | Sidebar item hover |
| `color/surface/Sidebar/item pressed` | `#F2F2F2` | `#504C4D` | Sidebar item pressed |
| `color/surface/Sidebar/item active` | `#FFFFFF` | `#231F20` | Sidebar item active / selected |
| `color/surface/Sidebar/item disabled` | `#FFFFFF` | `#231F20` | Sidebar item disabled |

### Icon

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/icon/primary` | `#231F20` | `#B4B2B1` | Primary icon |
| `color/icon/secondary` | `#666263` | `#908D8E` | Secondary icon |
| `color/icon/tertiary` | `#A5A2A2` | `#666263` | Muted icon |
| `color/icon/inverse` | `#FFFFFF` | `#1D1A1B` | Icon on dark backgrounds |
| `color/icon/disabled` | `#B4B2B1` | `#666263` | Disabled icon |
| `color/icon/disabled-subtle` | `#CECDCC` | `#504C4D` | Very subtle disabled icon |
| `color/icon/accent` | `#00A9EB` | `#16C1FF` | Accent icon |
| `color/icon/error` | `#CC2944` | `#D65469` | Error icon |
| `color/icon/warning` | `#F1A118` | `#F4B446` | Warning icon |
| `color/icon/success` | `#0E8C4F` | `#3EA372` | Success icon |

### Interactive

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/interactive/primary` | `#00A9EB` | `#00A9EB` | Primary interactive highlight — Accent |
| `color/interactive/primary-hover` | `#0094CD` | `#16C1FF` | Accent hover |
| `color/interactive/primary-pressed` | `#007EB0` | `#41CFFF` | Accent pressed |
| `color/interactive/primary-disabled` | `#6BDCFF` | `#006992` | Accent disabled |
| `color/interactive/primary-text` | `#FFFFFF` | `#FFFFFF` | Text on Accent background |
| `color/interactive/secondary` | `#DCF5FF` | `#003E57` | Secondary interactive background |
| `color/interactive/secondary-hover` | `#96E7FF` | `#005474` | Secondary hover |
| `color/interactive/secondary-text` | `#007EB0` | `#41CFFF` | Text on secondary interactive |
| `color/interactive/ghost-hover` | `#E5E4E3` | `#3A3737` | Ghost element hover |
| `color/interactive/ghost-pressed` | `#CECDCC` | `#504C4D` | Ghost element pressed |
| `color/interactive/destructive` | `#A32136` | `#CC2944` | Destructive action |
| `color/interactive/destructive-hover` | `#7A1929` | `#D65469` | Destructive hover |
| `color/interactive/destructive-text` | `#FFFFFF` | `#FFFFFF` | Text on destructive background |

### Opacity

Fixed dark-mode overlay values. Used for scrims, frosted overlays, and translucent surfaces.

| Token | Value | Usage |
|---|---|---|
| `color/opacity/1% opacity dark` | `rgba(0,0,0,0.01)` | Near-invisible overlay |
| `color/opacity/5% opacity dark` | `rgba(0,0,0,0.05)` | Very subtle overlay |
| `color/opacity/10% opacity dark` | `rgba(0,0,0,0.10)` | Light overlay |
| `color/opacity/25% opacity dark` | `rgba(0,0,0,0.25)` | Medium overlay |
| `color/opacity/50% opacity dark` | `rgba(0,0,0,0.50)` | Strong overlay |

### Status

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/status/error/bg-subtle` | `#FEEBEE` | `#400C15` | Error subtle background |
| `color/status/error/bg` | `#FCE3E7` | `#5E121F` | Error background |
| `color/status/error/bg-strong` | `#CC2944` | `#D65469` | Error strong fill |
| `color/status/error/text` | `#CC2944` | `#D65469` | Error text |
| `color/status/error/text-indicator` | `#A32136` | `#E07F8F` | Error indicator text |
| `color/status/error/text-strong` | `#7A1929` | `#F0BFC7` | Strong error text |
| `color/status/error/border` | `#D65469` | `#A32136` | Error border |
| `color/status/error/icon` | `#CC2944` | `#D65469` | Error icon |
| `color/status/error/graph` | `#CC2944` | `#D65469` | Error in data visualisation |
| `color/status/warning/bg-subtle` | `#FFFAF0` | `#452E07` | Warning subtle background |
| `color/status/warning/bg` | `#FFF6E4` | `#6A470B` | Warning background |
| `color/status/warning/bg-strong` | `#F1A118` | `#F4B446` | Warning strong fill |
| `color/status/warning/text` | `#F1A118` | `#F4B446` | Warning text |
| `color/status/warning/text-indicator` | `#D98D0B` | `#F7C774` | Warning indicator text |
| `color/status/warning/text-strong` | `#91610E` | `#F9D9A3` | Strong warning text |
| `color/status/warning/border` | `#F4B446` | `#D98D0B` | Warning border |
| `color/status/warning/icon` | `#F1A118` | `#F4B446` | Warning icon |
| `color/status/warning/graph` | `#F1A118` | `#F4B446` | Warning in data visualisation |
| `color/status/success/bg-subtle` | `#E9F8F0` | `#052E1A` | Success subtle background |
| `color/status/success/bg` | `#E1F5EA` | `#074025` | Success background |
| `color/status/success/bg-strong` | `#0E8C4F` | `#3EA372` | Success strong fill |
| `color/status/success/text` | `#0E8C4F` | `#3EA372` | Success text |
| `color/status/success/text-indicator` | `#0B703F` | `#6EBA95` | Success indicator text |
| `color/status/success/text-strong` | `#08542F` | `#B7DDCB` | Strong success text |
| `color/status/success/border` | `#3EA372` | `#0B703F` | Success border |
| `color/status/success/icon` | `#0E8C4F` | `#3EA372` | Success icon |
| `color/status/success/graph` | `#0E8C4F` | `#3EA372` | Success in data visualisation |

### Inputs

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/inputs/bg/primary` | `#F2F2F2` | `#504C4D` | Default input background |
| `color/inputs/bg/white` | `#FFFFFF` | `#1D1A1B` | White variant input |
| `color/inputs/bg/hover` | `#E5E4E3` | `#3A3737` | Input hover |
| `color/inputs/bg/active` | `#CECDCC` | `#231F20` | Input active / focused |
| `color/inputs/bg/disabled` | `#CECDCC` | `#231F20` | Disabled input |
| `color/inputs/Icon/primary` | `#7C7879` | `#A5A2A2` | Icon inside input |
| `color/inputs/Icon/disabled` | `#A5A2A2` | `#504C4D` | Disabled icon inside input |

### Float (Tooltips, popovers, dropdowns)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/float/bg/primary` | `#F9F8F7` | `#504C4D` | Default floating element background |
| `color/float/bg/hover` | `#F2F2F2` | `#3A3737` | Hover state |
| `color/float/bg/active` | `#E5E4E3` | `#231F20` | Active / pressed state |
| `color/float/bg/disabled` | `#CECDCC` | `#231F20` | Disabled state |
| `color/float/bg/white` | `#FFFFFF` | `#1D1A1B` | White variant |

### Toggle

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/toggle/active/primary` | `#231F20` | `#F2F2F2` | Active toggle track |
| `color/toggle/active/hover` | `#1D1A1B` | `#E5E4E3` | Active toggle track hover |
| `color/toggle/active/focused` | `#231F20` | `#F2F2F2` | Active toggle track focused |
| `color/toggle/active/disabled` | `#A5A2A2` | `#504C4D` | Active toggle track disabled |
| `color/toggle/active/toggle` | `#FFFFFF` | `#231F20` | Active toggle thumb |
| `color/toggle/inactive/primary` | `#E5E4E3` | `#7C7879` | Inactive toggle track |
| `color/toggle/inactive/hover` | `#CECDCC` | `#666263` | Inactive toggle track hover |
| `color/toggle/inactive/focused` | `#E5E4E3` | `#7C7879` | Inactive toggle track focused |
| `color/toggle/inactive/disabled` | `#E5E4E3` | `#504C4D` | Inactive toggle track disabled |
| `color/toggle/inactive/toggle` | `#CECDCC` | `#3A3737` | Inactive toggle thumb |

### Checkboxes

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color/checkboxes/primary` | `rgba(0,0,0,0.01)` | `rgba(255,255,255,0.01)` | Default checkbox background |
| `color/checkboxes/hover` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.05)` | Hover state |
| `color/checkboxes/focused` | `rgba(0,0,0,0.01)` | `rgba(255,255,255,0.01)` | Focused state |
| `color/checkboxes/disabled` | `#F2F2F2` | `#231F20` | Disabled state |

---

## 4. Button Color Tokens

### Button — Brand
The primary button across all SHAPE 3.0 surfaces. Built from the Gray identity scale.

**Primary**

| Token | Light | Dark |
|---|---|---|
| `color/button/brand/primary/bg/default` | `#231F20` | `#F9F8F7` |
| `color/button/brand/primary/bg/hover` | `#3A3737` | `#E5E4E3` |
| `color/button/brand/primary/bg/active` | `#504C4D` | `#CECDCC` |
| `color/button/brand/primary/bg/focused` | `#231F20` | `#F9F8F7` |
| `color/button/brand/primary/bg/disabled` | `#A5A2A2` | `#3A3737` |
| `color/button/brand/primary/bg/loading` | `#231F20` | `#F9F8F7` |
| `color/button/brand/primary/items/default text` | `#E5E4E3` | `#3A3737` |
| `color/button/brand/primary/items/default icon` | `#F9F8F7` | `#231F20` |
| `color/button/brand/primary/items/disabled text` | `#E5E4E3` | `#908D8E` |
| `color/button/brand/primary/items/disabled icon` | `#E5E4E3` | `#666263` |

**Secondary**

| Token | Light | Dark |
|---|---|---|
| `color/button/brand/secondary/bg/default` | `transparent` | `transparent` |
| `color/button/brand/secondary/bg/hover` | `#E5E4E3` | `#3A3737` |
| `color/button/brand/secondary/bg/active` | `#CECDCC` | `#504C4D` |
| `color/button/brand/secondary/border/default` | `#231F20` | `#F9F8F7` |
| `color/button/brand/secondary/border/hover` | `#231F20` | `#F9F8F7` |
| `color/button/brand/secondary/border/active` | `#231F20` | `#F9F8F7` |
| `color/button/brand/secondary/border/focused` | `#231F20` | `#F9F8F7` |
| `color/button/brand/secondary/border/disabled` | `#908D8E` | `#666263` |
| `color/button/brand/secondary/items/default text` | `#3A3737` | `#E5E4E3` |
| `color/button/brand/secondary/items/default icon` | `#231F20` | `#F9F8F7` |
| `color/button/brand/secondary/items/disabled text` | `#B4B2B1` | `#504C4D` |
| `color/button/brand/secondary/items/disabled icon` | `#A5A2A2` | `#666263` |

**Ghost**

| Token | Light | Dark |
|---|---|---|
| `color/button/brand/ghost/bg/default` | `transparent` | `transparent` |
| `color/button/brand/ghost/bg/hover` | `#E5E4E3` | `#3A3737` |
| `color/button/brand/ghost/bg/active` | `#CECDCC` | `#504C4D` |
| `color/button/brand/ghost/items/default text` | `#3A3737` | `#E5E4E3` |
| `color/button/brand/ghost/items/default icon` | `#231F20` | `#F9F8F7` |
| `color/button/brand/ghost/items/disabled text` | `#B4B2B1` | `#504C4D` |
| `color/button/brand/ghost/items/disabled icon` | `#A5A2A2` | `#666263` |

### Button — Accent
For user-facing report building and configuration actions. Tied to the Accent scale.

**Primary**

| Token | Light | Dark |
|---|---|---|
| `color/button/accent/primary/bg/default` | `#00A9EB` | `#16C1FF` |
| `color/button/accent/primary/bg/hover` | `#0094CD` | `#41CFFF` |
| `color/button/accent/primary/bg/active` | `#007EB0` | `#6BDCFF` |
| `color/button/accent/primary/bg/focused` | `#00A9EB` | `#16C1FF` |
| `color/button/accent/primary/bg/disabled` | `#A5A2A2` | `#3A3737` |
| `color/button/accent/primary/bg/loading` | `#00A9EB` | `#16C1FF` |
| `color/button/accent/primary/items/default text` | `#FFFFFF` | `#1D1A1B` |
| `color/button/accent/primary/items/default icon` | `#F9F8F7` | `#1D1A1B` |
| `color/button/accent/primary/items/disabled text` | `#E5E4E3` | `#908D8E` |
| `color/button/accent/primary/items/disabled icon` | `#E5E4E3` | `#666263` |

**Secondary**

| Token | Light | Dark |
|---|---|---|
| `color/button/accent/secondary/bg/default` | `transparent` | `transparent` |
| `color/button/accent/secondary/bg/hover` | `#EBFBFF` | `#003E57` |
| `color/button/accent/secondary/bg/active` | `#DCF5FF` | `#005474` |
| `color/button/accent/secondary/border/default` | `#00A9EB` | `#16C1FF` |
| `color/button/accent/secondary/border/hover` | `#00A9EB` | `#16C1FF` |
| `color/button/accent/secondary/border/active` | `#00A9EB` | `#16C1FF` |
| `color/button/accent/secondary/border/focused` | `#00A9EB` | `#16C1FF` |
| `color/button/accent/secondary/border/disabled` | `#908D8E` | `#666263` |
| `color/button/accent/secondary/items/default text` | `#00A9EB` | `#41CFFF` |
| `color/button/accent/secondary/items/default icon` | `#00A9EB` | `#41CFFF` |
| `color/button/accent/secondary/items/disabled text` | `#B4B2B1` | `#504C4D` |
| `color/button/accent/secondary/items/disabled icon` | `#A5A2A2` | `#666263` |

**Ghost**

| Token | Light | Dark |
|---|---|---|
| `color/button/accent/ghost/bg/default` | `transparent` | `transparent` |
| `color/button/accent/ghost/bg/hover` | `#EBFBFF` | `#003E57` |
| `color/button/accent/ghost/bg/active` | `#DCF5FF` | `#005474` |
| `color/button/accent/ghost/items/default text` | `#00A9EB` | `#41CFFF` |
| `color/button/accent/ghost/items/default icon` | `#00A9EB` | `#41CFFF` |
| `color/button/accent/ghost/items/disabled text` | `#B4B2B1` | `#504C4D` |
| `color/button/accent/ghost/items/disabled icon` | `#A5A2A2` | `#3A3737` |

### Button — Destructive

**Primary**

| Token | Light | Dark |
|---|---|---|
| `color/button/destructive/primary/bg/default` | `#A32136` | `#D65469` |
| `color/button/destructive/primary/bg/hover` | `#7A1929` | `#E07F8F` |
| `color/button/destructive/primary/bg/active` | `#5E121F` | `#F0BFC7` |
| `color/button/destructive/primary/bg/focused` | `#A32136` | `#D65469` |
| `color/button/destructive/primary/bg/disabled` | `#A5A2A2` | `#3A3737` |
| `color/button/destructive/primary/bg/loading` | `#A32136` | `#D65469` |
| `color/button/destructive/primary/items/default text` | `#FFFFFF` | `#1D1A1B` |
| `color/button/destructive/primary/items/default icon` | `#F9F8F7` | `#1D1A1B` |
| `color/button/destructive/primary/items/disabled text` | `#E5E4E3` | `#908D8E` |
| `color/button/destructive/primary/items/disabled icon` | `#E5E4E3` | `#666263` |

**Secondary**

| Token | Light | Dark |
|---|---|---|
| `color/button/destructive/secondary/bg/default` | `transparent` | `transparent` |
| `color/button/destructive/secondary/bg/hover` | `#FEEBEE` | `#29080E` |
| `color/button/destructive/secondary/bg/active` | `#FCE3E7` | `#400C15` |
| `color/button/destructive/secondary/border/default` | `#CC2944` | `#D65469` |
| `color/button/destructive/secondary/border/hover` | `#CC2944` | `#D65469` |
| `color/button/destructive/secondary/border/active` | `#CC2944` | `#D65469` |
| `color/button/destructive/secondary/border/focused` | `#CC2944` | `#D65469` |
| `color/button/destructive/secondary/border/disabled` | `#908D8E` | `#666263` |
| `color/button/destructive/secondary/items/default text` | `#CC2944` | `#E07F8F` |
| `color/button/destructive/secondary/items/default icon` | `#CC2944` | `#D65469` |
| `color/button/destructive/secondary/items/disabled text` | `#B4B2B1` | `#504C4D` |
| `color/button/destructive/secondary/items/disabled icon` | `#A5A2A2` | `#666263` |

**Ghost**

| Token | Light | Dark |
|---|---|---|
| `color/button/destructive/ghost/bg/default` | `transparent` | `transparent` |
| `color/button/destructive/ghost/bg/hover` | `#FEEBEE` | `#29080E` |
| `color/button/destructive/ghost/bg/active` | `#FCE3E7` | `#400C15` |
| `color/button/destructive/ghost/items/default text` | `#CC2944` | `#E07F8F` |
| `color/button/destructive/ghost/items/default icon` | `#CC2944` | `#D65469` |
| `color/button/destructive/ghost/items/disabled text` | `#B4B2B1` | `#504C4D` |
| `color/button/destructive/ghost/items/disabled icon` | `#A5A2A2` | `#666263` |

---

## 5. Data Visualisation Colors

### Graph Colors — Primary Palette

Use the Main values by default. Full shade scales (25–1000) available as `utility/Graph Colors/[Name]/[shade]`.

| Name | Token | Value |
|---|---|---|
| Personal Blue | `utility/Graph Colors/Main/Personal Blue` | `#00A9EB` |
| Team Blue | `utility/Graph Colors/Main/Team Blue` | `#0074BC` |
| Org Blue | `utility/Graph Colors/Main/Org Blue` | `#20409A` |
| Lavender Violet | `utility/Graph Colors/Main/Lavender Violet` | `#A86CFF` |
| Amber Orange | `utility/Graph Colors/Main/Amber Orange` | `#FF9900` |
| Mint Green | `utility/Graph Colors/Main/Mint Green` | `#00D998` |
| Golden Yellow | `utility/Graph Colors/Main/Golden Yellow` | `#FFD700` |
| Coral Red | `utility/Graph Colors/Main/Coral Red` | `#FF6B6B` |
| Teal | `utility/Graph Colors/Main/Teal` | `#26A69A` |
| Purple | `utility/Graph Colors/Main/Purple` | `#8E24AA` |
| Turquoise | `utility/Graph Colors/Main/Turquoise` | `#00CED1` |
| Hot Pink | `utility/Graph Colors/Main/Hot Pink` | `#FF4081` |
| Orange Coral | `utility/Graph Colors/Main/Orange Coral` | `#FF7043` |
| Lime Green | `utility/Graph Colors/Main/Lime Green` | `#8BC34A` |
| Magenta | `utility/Graph Colors/Main/Magenta` | `#FF00FF` |
| Olive Green | `utility/Graph Colors/Main/Olive Green` | `#6B8E23` |
| Cyan Glow | `utility/Graph Colors/Main/Cyan Glow` | `#00E5FF` |
| Neon Lime | `utility/Graph Colors/Main/Neon Lime` | `#C6FF00` |
| Steel Blue | `utility/Graph Colors/Main/Steel Blue` | `#4682B4` |
| Slate Gray | `utility/Graph Colors/Main/Slate Gray` | `#37474F` |

### Heat Map Colors

For score-range visualisation. Not for general UI states.

| Token | Light | Dark | Score Range |
|---|---|---|---|
| `utility/Heat Map/0 - 20` | `#CC2944` | `#FF9696` | 0–20 |
| `utility/Heat Map/20 - 30` | `#FF6B6B` | `#FF8080` | 20–30 |
| `utility/Heat Map/30 - 40` | `#FF8080` | `#FF6B6B` | 30–40 |
| `utility/Heat Map/40 - 50` | `#FF9D80` | `#BD3806` | 40–50 |
| `utility/Heat Map/50 - 60` | `#FFB49F` | `#922E06` | 50–60 |
| `utility/Heat Map/60 - 70` | `#FFD088` | `#553400` | 60–70 |
| `utility/Heat Map/70 - 80` | `#FFDEAA` | `#331F00` | 70–80 |
| `utility/Heat Map/80 - 90` | `#C2FFEF` | `#002A1F` | 80–90 |
| `utility/Heat Map/90 - 95` | `#94FFDF` | `#007A55` | 90–95 |
| `utility/Heat Map/95 - 100` | `#3EA372` | `#6EBA95` | 95–100 |

### Likert Scale Colors

For sentiment and response scale visualisation.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `utility/Likert/Very Bad` | `#CC2944` | `#D65469` | Strongly negative |
| `utility/Likert/Very Bad Subtle` | `#FCD7DD` | `#400C15` | Subtle very bad |
| `utility/Likert/Bad` | `#FF6B6B` | `#FF8080` | Negative |
| `utility/Likert/Bad Subtle` | `#FFE3DC` | `#33160D` | Subtle bad |
| `utility/Likert/Neutral` | `#F1A118` | `#F4B446` | Neutral |
| `utility/Likert/Neutral Subtle` | `#FFF1CF` | `#302005` | Subtle neutral |
| `utility/Likert/Good` | `#00C389` | `#00D998` | Positive |
| `utility/Likert/Good Subtle` | `#C2FFEF` | `#002A1F` | Subtle good |
| `utility/Likert/V Good` | `#0E8C4F` | `#3EA372` | Strongly positive |
| `utility/Likert/V Good Subtle` | `#D3F2E3` | `#052E1A` | Subtle very good |

---

## 6. Shadows and Effects

Shadow colors are bound to variables from the `utility/Shadows/` collection — they resolve to different opacity values in light and dark mode. Never hardcode shadow color values. Always reference the variable name.

### Shadow Effect Styles

Each shadow is composed of 5 layered `DROP_SHADOW` effects, listed outermost to innermost.

#### `Shadow/shadow-xs`
Subtle lift. Chips, tags, small inline elements.

| Layer | Offset | Blur | Variable | Light | Dark |
|---|---|---|---|---|---|
| 1 | 0, 14px | 4px | `utility/Shadows/xs/25` | `#00000003` | `#00000005` |
| 2 | 0, 9px | 4px | `utility/Shadows/xs/50` | `#00000005` | `#0000000D` |
| 3 | 0, 5px | 3px | `utility/Shadows/xs/100` | `#0000000A` | `#0000001A` |
| 4 | 0, 2px | 2px | `utility/Shadows/xs/200` | `#0000000D` | `#00000026` |
| 5 | 0, 1px | 1px | `utility/Shadows/xs/300` | `#0000000F` | `#00000033` |

#### `Shadow/shadow-sm`
Low elevation. Cards, input fields, surface panels.

| Layer | Offset | Blur | Variable | Light | Dark |
|---|---|---|---|---|---|
| 1 | 0, 17px | 5px | `utility/Shadows/sm/25` | `#00000003` | `#00000005` |
| 2 | 0, 11px | 4px | `utility/Shadows/sm/50` | `#00000005` | `#0000000F` |
| 3 | 0, 6px | 4px | `utility/Shadows/sm/100` | `#0000000D` | `#0000001F` |
| 4 | 0, 3px | 3px | `utility/Shadows/sm/200` | `#00000012` | `#0000002E` |
| 5 | 0, 1px | 2px | `utility/Shadows/sm/300` | `#00000017` | `#00000040` |

#### `Shadow/shadow-md`
Medium elevation. Dropdowns, popovers, floating menus.

| Layer | Offset | Blur | Variable | Light | Dark |
|---|---|---|---|---|---|
| 1 | 0, 22px | 6px | `utility/Shadows/md/25` | `#00000003` | `#00000005` |
| 2 | 0, 14px | 6px | `utility/Shadows/md/50` | `#00000005` | `#0000000F` |
| 3 | 0, 8px | 5px | `utility/Shadows/md/100` | `#00000012` | `#0000002E` |
| 4 | 0, 3px | 3px | `utility/Shadows/md/200` | `#0000001F` | `#0000004D` |
| 5 | 0, 1px | 2px | `utility/Shadows/md/300` | `#00000024` | `#00000059` |

#### `Shadow/shadow-lg`
High elevation. Modals, dialogs, side drawers.

| Layer | Offset | Blur | Variable | Light | Dark |
|---|---|---|---|---|---|
| 1 | 0, 31px | 9px | `utility/Shadows/lg/25` | `#00000003` | `#00000005` |
| 2 | 0, 20px | 8px | `utility/Shadows/lg/50` | `#00000005` | `#0000000F` |
| 3 | 0, 11px | 7px | `utility/Shadows/lg/100` | `#00000017` | `#00000038` |
| 4 | 0, 5px | 5px | `utility/Shadows/lg/200` | `#00000024` | `#00000059` |
| 5 | 0, 1px | 3px | `utility/Shadows/lg/300` | `#00000026` | `#00000066` |

#### `Shadow/shadow-xl`
Very high elevation. Context panels, full overlays.

| Layer | Offset | Blur | Variable | Light | Dark |
|---|---|---|---|---|---|
| 1 | 0, 38px | 11px | `utility/Shadows/xl/25` | `#00000003` | `#00000005` |
| 2 | 0, 25px | 10px | `utility/Shadows/xl/50` | `#0000000A` | `#00000014` |
| 3 | 0, 13px | 8px | `utility/Shadows/xl/100` | `#0000001A` | `#00000040` |
| 4 | 0, 6px | 6px | `utility/Shadows/xl/200` | `#00000026` | `#0000005E` |
| 5 | 0, 1px | 3px | `utility/Shadows/xl/300` | `#0000002B` | `#00000073` |

#### `Shadow/shadow-2xl`
Maximum elevation. Highest-priority floating surfaces.

| Layer | Offset | Blur | Variable | Light | Dark |
|---|---|---|---|---|---|
| 1 | 0, 51px | 14px | `utility/Shadows/2xl/25` | `#00000003` | `#00000005` |
| 2 | 0, 33px | 13px | `utility/Shadows/2xl/50` | `#0000000A` | `#00000014` |
| 3 | 0, 18px | 11px | `utility/Shadows/2xl/100` | `#0000001C` | `#00000045` |
| 4 | 0, 8px | 8px | `utility/Shadows/2xl/200` | `#0000002B` | `#0000006B` |
| 5 | 0, 2px | 4px | `utility/Shadows/2xl/300` | `#00000033` | `#00000085` |

### Directional Shadows

| Style | Direction | Base variable set |
|---|---|---|
| `Shadow/shadow-left` | Offset x negative | `md` |
| `Shadow/shadow-right` | Offset x positive | `md` |
| `Shadow/shadow-right-subtle` | Offset x positive | `sm` |
| `Shadow/shadow-top` | Offset y negative | `md` |
| `Shadow/shadow-top-subtle` | Offset y negative | `xs` |
| `Shadow/shadow-bottom` | Offset y positive | `md` |

### Focus Ring Styles

| Style | Structure |
|---|---|
| `Focus Ring/focus-ring` | Outer: 4px spread, `utility/Accent/200`. Inner: 2px spread, `utility/Base/white` |
| `Focus Ring/focus-ring-error` | Outer: 4px spread, `utility/Error/400`. Inner: 2px spread, `utility/Base/white` |

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

## 7. Spacing

Base unit: **4px**. All spacing is a multiple of 4, with `spacing/2` and `spacing/6` as exceptions for tight component-level control.

| Token | Value | Token | Value |
|---|---|---|---|
| `spacing/0` | 0px | `spacing/160` | 160px |
| `spacing/2` | 2px | `spacing/192` | 192px |
| `spacing/4` | 4px | `spacing/224` | 224px |
| `spacing/6` | 6px | `spacing/256` | 256px |
| `spacing/8` | 8px | `spacing/320` | 320px |
| `spacing/12` | 12px | `spacing/360` | 360px |
| `spacing/16` | 16px | `spacing/384` | 384px |
| `spacing/20` | 20px | `spacing/480` | 480px |
| `spacing/24` | 24px | `spacing/560` | 560px |
| `spacing/32` | 32px | `spacing/640` | 640px |
| `spacing/40` | 40px | `spacing/720` | 720px |
| `spacing/48` | 48px | `spacing/768` | 768px |
| `spacing/64` | 64px | `spacing/1024` | 1024px |
| `spacing/80` | 80px | `spacing/1280` | 1280px |
| `spacing/96` | 96px | `spacing/1440` | 1440px |
| `spacing/128` | 128px | `spacing/1600` | 1600px |
| — | — | `spacing/1920` | 1920px |

---

## 8. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius/none` | 0px | No rounding |
| `radius/xs` | 4px | Small inline elements |
| `radius/sm` | 6px | Small components |
| `radius/tooltip` | 6px | Tooltip containers |
| `radius/md` | 8px | Medium components |
| `radius/button` | 8px | All button variants |
| `radius/input` | 8px | All inputs and selects |
| `radius/lg` | 12px | Large components |
| `radius/xl` | 16px | Extra large components |
| `radius/card` | 16px | Cards and panels |
| `radius/xl2` | 18px | Between xl and 2xl |
| `radius/widget` | 18px | Widget containers |
| `radius/2xl` | 24px | Large containers |
| `radius/modal` | 24px | Modals and dialogs |
| `radius/3xl` | 32px | Extra large containers |
| `radius/4xl` | 36px | Very large containers |
| `radius/5xl` | 38px | Maximum pre-full rounding |
| `radius/report-card` | 38px | Report card containers |
| `radius/full` | 9999px | Pills, avatars, circular elements |
| `radius/badge` | 9999px | Badge components |

---

## 9. Border Width

| Token | Value | Usage |
|---|---|---|
| `border-width/none` | 0px | No border |
| `border-width/sm` | 1px | Default — inputs, cards, dividers |
| `border-width/md` | 2px | Emphasis — focus rings, selected states |
| `border-width/lg` | 4px | Strong — active indicators |
| `border-width/xl` | 8px | Heavy — structural dividers |

---

## 10. Opacity

| Token | Value | Token | Value |
|---|---|---|---|
| `opacity/0` | 0 | `opacity/60` | 0.60 |
| `opacity/5` | 0.05 | `opacity/70` | 0.70 |
| `opacity/10` | 0.10 | `opacity/75` | 0.75 |
| `opacity/20` | 0.20 | `opacity/80` | 0.80 |
| `opacity/25` | 0.25 | `opacity/90` | 0.90 |
| `opacity/30` | 0.30 | `opacity/95` | 0.95 |
| `opacity/40` | 0.40 | `opacity/100` | 1 |
| `opacity/50` | 0.50 | — | — |

For disabled states, prefer dedicated color tokens over opacity.

---

## 11. Breakpoints

Mobile-first. Use `min-width` queries.

| Token | Value | Tier |
|---|---|---|
| `breakpoint/xs` | 320px | Narrow mobile |
| `breakpoint/sm` | 640px | Mobile |
| `breakpoint/md` | 768px | Tablet portrait |
| `breakpoint/lg` | 1024px | Tablet landscape / small desktop |
| `breakpoint/xl` | 1280px | Desktop |
| `breakpoint/2xl` | 1440px | Wide desktop |
| `breakpoint/3xl` | 1920px | Large / ultrawide |

---

## 12. Components

Components live in Figma. This describes what exists — variant properties and token groups used.

### Buttons — `Buttons/Button`
- `Theme` — `Accent`, `Brand`, `Destructive`
- `Size` — `xs` (28px), `sm` (36px), `md` (48px), `lg` (60px)
- `Type` — `round` (pill), `square` (8px radius)
- `Variation` — `primary`, `secondary`, `link`
- `State` — `default`, `hover`, `active`, `focused`, `disabled`, `loading`
- `Text` — `true` (label), `false` (icon only)

Tokens: `color/button/brand/*`, `color/button/accent/*`, `color/button/destructive/*`

### Input Field
- `State` — `Default`, `Hover`, `Focused`, `Filled`, `Disabled`, `Error`, `Success`, `Loading`
- `Background` — `Surface`, `Inverted`

Tokens: `color/inputs/*`, `color/border/*`, `color/status/*`

### Input Select / Dropdown
- `State` — `Default`, `Focused`, `Disabled`, `Destructive`
- `Expanded` — `True`, `False`
- `Tags` — `True`, `False`

Tokens: `color/inputs/*`, `color/float/*`, `color/border/*`

### Textarea
- `State` — `Default`, `Hover`, `Focused`, `Filled`, `Disabled`, `Error`

### Number Stepper
- `State` — `default`, `min`, `max`

### Date Changer
- `Navigation` — `True`, `False`
- `Expanded` — `True`, `False`

### Floating Menu
- `Navigation` — `True`, `False`

Tokens: `color/float/*`

### Tooltips
Background: `color/surface/General/tooltip`. Elevation: `Shadow/shadow-md`. Radius: `radius/tooltip` (6px).

### Tags and Badges
Tokens: `color/bg/*`, `color/text/*`. Radius: `radius/badge` (9999px).

### Selection Controls
Checkboxes: `color/checkboxes/*`. Toggles: `color/toggle/*`.

### Feedback and Status
Tokens: `color/status/*`

### Navigation
Sidebar: `color/surface/Sidebar/*`. Labels: `color/text/*`.

### Data Display
Charts/graphs: `utility/Graph Colors/*`. Score ranges: `utility/Heat Map/*`. Sentiment: `utility/Likert/*`.

---

## 13. Quick Reference

| Situation | Token group |
|---|---|
| Page and surface backgrounds | `color/bg/*` |
| Cards, modals, sidebars, popovers | `color/surface/*` |
| Body text, labels, captions | `color/text/*` |
| Borders and dividers | `color/border/*` |
| Icons | `color/icon/*` |
| Focus rings, links, selected states | Accent values in `color/border/*`, `color/surface/*`, `color/text/*` |
| Primary platform buttons | `color/button/brand/*` |
| User-facing report / config actions | `color/button/accent/*` |
| Destructive actions | `color/button/destructive/*` |
| Form inputs | `color/inputs/*` |
| Tooltips, dropdowns, floating menus | `color/float/*` |
| Toggle switches | `color/toggle/*` |
| Checkboxes | `color/checkboxes/*` |
| Feedback banners, status states | `color/status/*` |
| Overlay / scrim opacity | `color/opacity/*` |
| Charts and data visualisation | `utility/Graph Colors/*` |
| Score range heatmaps | `utility/Heat Map/*` |
| Sentiment / Likert scale | `utility/Likert/*` |
| Elevation / depth | `Shadow/*` effect styles |
| Focus indication | `Focus Ring/*` effect styles |
