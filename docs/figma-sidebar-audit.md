# Sidebar ("Menu") Audit — Figma `984qJvMt7fCHASYHRwgrab`, section `11923:46254`

Research only — no app code changed. Goal: fully specify every interactive state of the real
`Menu` component so a stateful, animated `NavRail` can be built without re-deriving anything
from Figma. All 9 in-scope states were pulled via `get_design_context` (code + tokens +
screenshot), with 3 targeted `get_screenshot` zooms where code alone left genuine ambiguity
(Logo Interaction vs Logo Hover, and the mystery `Ellipse`). The 4 Pending-Surveys states
(`11923:41706`, `11923:42114`, `11923:43610`, `11923:43338`) were explicitly skipped per
instruction.

**Current implementation for reference:** `src/components/shell/NavRail.jsx` (static, 68px,
5 icons: `MessageSquare`/`Building2`/`Wand2` top, `Bell`/`Settings` bottom, `User` avatar in a
gray100 circle) and `src/lib/tokens.js` (`T` colors, `radius` scale). Every color/radius value
below is mapped to an existing `T.*`/`radius.*` token — **no new tokens are needed**, everything
in the sidebar reuses the existing palette exactly.

---

## 0. Overview — what actually changes between collapsed and expanded

This is the single biggest structural finding, so it's stated up front before the per-state
detail:

| | **Collapsed** (`Sidebar / Default`, 69px measured) | **Expanded** (`Sidebar / Expand`, 300px) |
|---|---|---|
| Top nav items | **3**: message-square-01, building-02, magic-wand-02 (icon-only) | **5**: message-square-01, search-lg, building-02, magic-wand-02, book-open-01 (icon + label) |
| Figma's own text labels | *(none rendered)* | **Home, Search, Store, Create, Library** |
| Bottom icon row | **2**: Bell, Admin (icon-only, stacked vertically, part of the same flex column as the top items) | **3**: Bell, Admin, dots-horizontal ("more") — in a **separate bordered `Frame`** row, horizontal, icons only |
| "Your Reports" section | **absent entirely** | present: header + "+" button + full scrollable report list |
| Avatar row | avatar only, centered | avatar + name ("Olivia Rhye") + email ("olivia@meta.com") + chevron-selector-vertical trigger |
| Logo row | just the logo mark, centered | logo (left) + a collapse-toggle ghost button (`layout-left` icon, right) — `justify-between` |

**Search and Library do not exist in collapsed mode at all** — collapsing isn't just "hide the
labels," two whole nav items disappear. Any interactive rebuild must branch on `expanded` for
the *item list itself*, not just conditionally render a `<span>` label next to a fixed icon set.

Also: Figma's own labels are **Home / Store / Create**, not our current semantic names
**Chat / Org / Generate** (icons are identical — message-square-01→Chat, building-02→Org,
magic-wand-02→Generate — only the *label text* differs). Decide deliberately whether the
rebuilt sidebar keeps the app's existing semantic prop names or adopts Figma's literal copy;
this doc doesn't decide that for you.

---

## 1. `Sidebar / Default` — `11923:38700` (collapsed rail)

- **Measured width: 69px** (confirmed via `get_screenshot` returning `{"width":69,"height":842}`
  for the `Menu` instance node) — matches our current `NavRail.jsx`'s hardcoded `68` almost
  exactly (1px rounding). Height 842px, but this looks like an artboard-height artifact, not a
  deliberate spec — see §10.
- **Rail chrome**: `bg: T.white`. Border: `border-top/right/bottom` only, 1px, `T.gray100`
  (`#cecdcc`) — **no left border**, confirming the "flush against screen edge" note already in
  our code. Corner radius: **top-right + bottom-right only**, `radius.widget` (18px,
  `--radius-xl,18px` in Figma).
- **Content padding**: `pt-24 px-12 pb-12`, children gap `10px`, `flex-direction: column`.
- **Logo**: centered row, logo mark rendered at **23.4×36px** (two overlapping SVG groups —
  this is the same asset already committed as `src/assets/shape-logo.svg`, sized `24×36` in
  code — matches within rounding). Logo row itself is `h-36`, `px-6.3`.
- **Top nav items — REAL, per-item icons, not a generic placeholder** (this directly supersedes
  the note in our current `NavRail.jsx` header comment claiming "the real component's 7+2 icons
  are all the same generic placeholder circle"). That claim was true of an *older* component
  version (`22562:4385`); **this newer `11923:38700` instance has 3 distinguishable icons**, in
  order:
  1. `message-square-01` (Figma usage tag: "message, chat, notification") → lucide `MessageSquare` (already used)
  2. `building-02` ("building, business, house") → lucide `Building2` (already used)
  3. `magic-wand-02` ("magic wand, ai, design, editor") → lucide `Wand2` (already used)
  - Each item: **44px tall hit box** (`h-44`, `py-4`, `overflow-clip`), wrapping a **44×36px**
    pill (`px-12 py-8`, `radius.sm` = 6px) — **not a 36×36 square** as our current code assumes
    (`NavIcon`'s `36×36` `span`). The pill's width comes from `12px pad + 20px icon + 12px pad
    = 44px`; height from `8+20+8=36px`. Icon itself is 20×20 (matches our `size={20}`).
  - Default pill background = `T.white` (transparent-looking, matches rail bg). No visible
    "active" treatment is shown in this specific frame (Default = all-inactive resting state);
    our existing active-via-icon-color-only convention (`T.accent` vs `T.gray400`) isn't
    contradicted by anything here, just not evidenced in this particular frame.
- **Bottom icon group** (2 items, same 44×36 pill treatment, same list, directly above Avatar,
  pushed down by the top group's `flex:1`):
  4. `bell-02` → lucide `Bell` (already used)
  5. `Admin` (Figma usage tag: "settings, preferences, cog") → lucide `Settings` (already used)
- **Avatar row**: `px-12 py-16`, single centered child — a **40×40px real photo placeholder**
  (`Avatar` sub-component, `size="md"`, `placeholder="Demo - F"`), i.e. Figma's canonical avatar
  is a **photo image**, not an icon-in-a-circle. Our current `NavRail.jsx` approximates this with
  a `User` lucide icon on a `T.gray100` circle — reasonable prototype fallback (no real per-user
  photo exists in this app), but worth noting as a deliberate simplification, not a missed detail.
- **The mystery `Ellipse` node** (`11923:38702`, 8×8px, `bottom:158px, left:41px`, `z-index:3`):
  **it is not actually visible in the rendered design.** The sidebar `Menu` panel itself is
  `z-index:4` with an opaque white background, and this ellipse sits *underneath* it at
  `z-index:3`, fully inside the sidebar's own footprint (0–69px wide). An opaque panel at a
  higher z-index always paints over a lower-z sibling occupying the same screen area, so this
  dot cannot render in any of the 8 frames it appears in (all 8 sampled non-Pending-Surveys
  states carry the identical node at the identical coordinates and z-order). Geometrically it
  lines up with the **top edge of the Bell icon** in collapsed mode, which is consistent with it
  once being intended as an unread-notification badge — but as currently layered in Figma it is
  dead/invisible artwork. **Recommendation: do not implement it.** If a notification-badge dot
  on Bell is actually wanted, it needs a fresh z-order decision (above the panel), not a port of
  this node.

## 2. `Sidebar / Expand` — `11923:39167` (expanded rail)

- **Width: exactly 300px** (`w-[300px]`, `absolute, left:0, top:0`), height 832px (see §10 on
  the 842-vs-832 discrepancy). `position: absolute` here (vs `Default`'s normal flow) because
  Figma is demonstrating it as an overlay-in-transition; in the real app this is presumably just
  the rail's normal box at a different width.
- **New drop shadow** appears only in the expanded state: `shadow-right-subtle`, a 5-layer soft
  shadow bleeding right off the panel edge (offsets `1,0` → `31,0`, opacity `0.06`→`0.01`) — this
  reads as "the rail is now floating/overlaying the canvas" rather than sitting flush. Collapsed
  mode has no such shadow. Recommend animating this shadow in alongside the width expansion.
- **Content padding differs from collapsed**: `pt-24 px-16 pb-0` (no bottom padding — the bottom
  padding job is done by the Frame/Avatar sections below instead), gap `10px` between the three
  top-level blocks (Logo row / Menu Items / Frame / Avatar).
- **Logo row**: `justify-between` — logo mark on the left (same 23.4×36 asset), and on the right
  a **collapse-toggle button**: ghost, round (`radius.full`), transparent bg by default, 8px
  padding, `layout-left` icon (20px) — closest lucide equivalent: **`PanelLeft`** (no exact
  "layout-left" icon in lucide; `PanelLeft`/`PanelLeftClose` are the closest semantic matches).
  This is the one control that should toggle `expanded` back to `false`.
- **Top nav items — now 5, each 44×36 pill but full width (`w-268`) and NOT icon-only**:
  `gap-12` between icon and label, `pl-12 pr-8 py-8`, label text `14px/20px Medium`,
  `T.gray700` (`#504c4d`). In order:
  1. `message-square-01` — label **"Home"**
  2. `search-lg` — label **"Search"** *(new item, no collapsed equivalent)* → lucide `Search`
  3. `building-02` — label **"Store"**
  4. `magic-wand-02` — label **"Create"**
  5. `book-open-01` — label **"Library"** *(new item, no collapsed equivalent)* → lucide `BookOpen`
- **"YOUR REPORTS" row** (new section, doesn't exist collapsed): `h-40`, `px-8 py-6`,
  `radius.sm`. Contents: uppercase label **"YOUR REPORTS"** (13px/18px Medium, `T.gray500`
  `#7c7879`) + a `chevron-right` icon (20px, closed/collapsed-section state) + a circular
  **black "+" button** (`bg: T.gray800` `#231f20` exact match, `radius.full`, 4px padding, 20px
  `plus` icon → lucide `Plus`). Clicking the chevron/row presumably expands the report list (see
  §6, where the chevron flips to `chevron-down` and the list is populated).
- **Bottom `Frame`** (new, doesn't exist collapsed): a **separate bordered row** —
  `border-top: 1px T.gray75 (#e5e4e3)`, `h-36`, `px-16` — horizontal `justify-between` layout:
  - left group (`gap-12`): Bell ghost icon button, Admin ghost icon button (both 4px padding,
    `radius.full`, transparent default bg, 20px icon)
  - right: a third ghost icon button, `dots-horizontal` (20px) → lucide `MoreHorizontal`. This
    is the "Extra Links" / "more options" trigger — see §8.
  Note: the border/hover color token used here (`--color-border-secondary` → `#e5e4e3` =
  `T.gray75`) resolves to a **different hex** than the *same-named* token used for the rail's
  outer border (`#cecdcc` = `T.gray100`) elsewhere in the very same frame. This is a real Figma
  variable-binding inconsistency (see §10), not something to silently "fix" by guessing — both
  values already exist as real tokens, just pick deliberately.
- **Avatar row**: now `border-top: 1px T.gray75`, `gap-10 p-16`, and unlike collapsed mode has
  three children: 40px avatar photo, a text stack (name **"Olivia Rhye"**, 14px Semibold,
  `T.gray900`; email **"olivia@meta.com"**, 14px Regular, `T.gray700`, `text-ellipsis`), and a
  **"Floating Menu"** wrapper containing the profile-menu trigger: ghost round button, 8px
  padding, `chevron-selector-vertical` icon (20px) → lucide **`ChevronsUpDown`**. This is the
  trigger for §5's Profile menu.

## 3–4. Logo hover/interaction states

### `Sidebar / Logo Interaction` — `11923:39307` and `Sidebar / Logo Hover` — `11923:39813`

Both are **collapsed-rail** frames (842px tall, not the 300px expanded panel). Screenshotted
both at native-ish resolution (`get_screenshot`, `maxDimension:900`, cropped to just the `Menu`
node) to resolve what code alone left ambiguous. Findings:

- **Both frames swap the logo mark for the `layout-left` icon** (same expand/collapse glyph used
  in the Expand state's header button) — i.e. hovering the collapsed logo previews "this is the
  expand control," replacing the brand mark rather than showing it alongside a tooltip.
- **They differ only in the button chrome around that icon:**
  - *Logo Interaction*: a **round ghost button** — `radius.full` (36×36, `8px` padding),
    `bg: transparent` (`rgba(255,255,255,0)`, the ghost-button "default" token, not "hover").
  - *Logo Hover*: the icon sits in the **same 44×36 pill shape used by ordinary nav items**
    (`radius.sm` 6px, `px-12 py-8`), with a **visible `T.gray25` (`#f9f8f7`) tint fill** — the
    same hover-tint color used everywhere else in the sidebar for a hovered nav-item pill (see
    §4 below and the Menu Hover tooltip's own bg).
  - Screenshots confirm this: Logo Interaction's icon sits in a neutral/untinted rounded-square
    box; Logo Hover's sits in a visibly gray-tinted wider pill — genuinely two different visual
    states, not a rendering artifact.
- **Best-guess sequencing** (not proven by any tooltip/order evidence, since neither frame
  encodes a timeline): most likely *Logo Interaction* represents "button focus/press chrome"
  (round ghost, no tint) and *Logo Hover* represents the actual mouse-hover tint (pill shape,
  gray25 fill) matching how every other nav item hovers. **Flag this as an open question for
  design** — the two frames could equally be an inconsistent WIP pair rather than a deliberate
  two-step sequence. Recommend implementing hover as the Logo Hover treatment (pill + gray25,
  consistent with every other hover in the file) since it matches the system's own pattern
  everywhere else, and treat the round-ghost "Interaction" version as unconfirmed/optional.
- **No tooltip text exists in either frame's node tree.** Both `get_design_context` calls
  returned every node in the frame (verified — no absolutely-positioned sibling `Tooltip`
  component appears, unlike Menu Hover below which explicitly has one). This **contradicts the
  assumption that a "logo hover tooltip" exists to sample** — it doesn't, in either sampled
  frame. If a tooltip (e.g. "Expand sidebar") is wanted for parity with the other nav icons'
  tooltip treatment (§4), it needs to be newly authored using that same `Tooltip` pattern/style,
  not ported from these two frames.
- **No custom cursor asset.** Neither frame contains a `Cursor` SVG node (the Menu Hover and
  other states do, see below) — nothing to reproduce here. Use standard `cursor: pointer`.

## 5. `Sidebar / Menu Hover` — `11923:40775` (collapsed, non-logo icon hover)

This is the frame that *does* carry a real tooltip + cursor-annotation pair, hovering the third
top icon (`magic-wand-02` / "Create").

- **Hover visual on the icon itself**: same treatment as "Logo Hover" — the 44×36 pill gets a
  `T.gray25` (`#f9f8f7`) background fill, `radius.sm`. Icon color itself is unchanged (still
  whatever its resting color is); only the pill background tints. **This confirms `T.gray25` is
  the canonical hover-tint for a collapsed nav-item pill**, consistently used across Logo Hover
  and Menu Hover alike.
- **Tooltip** (a reusable `Tooltip` sub-component defined in the Figma export, worth treating as
  a real shared primitive):
  - Content: **exact label text**, e.g. `"Create"` for this icon.
  - Style: `bg: T.gray25` (`#f9f8f7`), `radius.md` (8px), padding `12px/8px` (`px-lg py-md` in
    Figma spacing scale), text `12px/16px Regular`, `T.gray700` (`#504c4d`).
  - Shadow: `shadow-md`, a 5-layer drop shadow (offsets `0,1`→`0,22`, opacity `0.14`→`0.01`) —
    same shadow family reused for every floating menu in this file (Profile menu, Report-row
    "Share" menu, Extra Links panel — see below). **No arrow/pointer nub** (`arrow="None"` on the
    component instance).
  - Position: **to the right of the hovered icon**, roughly vertically centered on it
    (`left:62px, top:164px` in this 1440-wide frame, vs. the icon column starting ~`left:24px`).
- **Cursor annotation**: a `Cursor` SVG glyph positioned at `left:24,top:193`, directly over the
  hovered icon. This is **Figma's own design-annotation convention for showing where the pointer
  is in a static mockup** — it is not a custom CSS cursor asset to implement. Use ordinary
  `cursor: pointer`; do not treat this as an asset requirement.

## 6. `Sidebar / Profile Chevron` — `11923:41269` (profile dropdown)

- **Base state**: expanded rail (300×832, same shadow/border treatment as §2).
- **Trigger**: the `chevron-selector-vertical` ghost button in the Avatar row's "Floating Menu."
  In this frame it renders with `bg: T.gray75 (#e5e4e3)` — the ghost button's **`hover`** token,
  not `default` — confirming this is how the trigger looks while its menu is open (a persistent
  "active" tint, not just a transient hover flash).
- **Menu position**: `position:absolute`, `bottom:66px`, `right:1067px` (in the 1440×842 frame →
  left edge ≈159px, width 214px, right edge ≈373px). It floats **directly above the Avatar row**,
  anchored toward the sidebar's left/middle rather than pinned under the trigger on the right —
  and its right edge (373px) actually **overhangs the 300px-wide expanded sidebar by ~73px**,
  spilling slightly into the main canvas area. This looks deliberate (floating menus in this file
  consistently ignore the sidebar's own right edge — see §7's Share menu and §8's Extra Links
  panel, both of which also overflow rightward), not a mockup mistake.
- **Menu chrome**: `radius.lg` (12px, Figma's own `--radius-xl` token — see §10 on this name
  colliding with the 18px sidebar-corner token of the same name), `shadow-md` (same 5-layer
  shadow as the tooltip above), rows `bg: T.gray25 (#f9f8f7)`.
- **Items, in order** (as sampled in *this* frame — see §9 for a fuller 4-item version):
  1. **Settings** — `settings-01` icon (20px) → lucide `Settings`. Row: `px-12 py-8`, text
     14px Regular, `T.gray900` (`#1d1a1b`).
  2. **Rate Us** — `star-01` icon → lucide `Star`. Same row style.
  3. *(divider: `border-top 1px T.gray100 #cecdcc`)*
  4. **Sign out** — `log-out-01` icon → lucide `LogOut`. Rendered as a full-width destructive
     ghost button (`px-16 py-8`, not the `px-12 py-8` dropdown-item padding used above), text
     color **`T.red`** (`#cc2944`, exact match) — the only item styled differently.
- **Important delta vs §9**: this frame's menu has only 3 items (no "Switch Accounts"). The
  `Sidebar / Switch Accounts` frame (§9) shows a 4-item version with "Switch Accounts" inserted
  between "Rate Us" and "Sign out." Treat the **4-item version as authoritative** — it's a
  strict superset — and this 3-item frame as either an earlier/simplified sample or a
  deliberately reduced demo state; there's no evidence in-file for why they differ.

## 7. `Sidebar / Your Report Expand` — `11923:43821` (populated report list)

- **Header row**: label **"YOUR REPORTS"** (13px Medium, uppercase, `T.gray500`) + a
  `chevron-down` icon (20px) — **flipped from `chevron-right` in the collapsed/closed §2 sample**,
  confirming the chevron rotates to indicate open/closed section state — + the same black "+"
  circular button as §2.
- **Report list contents, in order** (7 real sample rows, each `44px` tall unless noted, `12px`
  gap, `radius.sm` pill on hover):
  1. **"SHAPE Performance Report"** — has its own `chevron-up` icon (this row is itself
     expandable/expanded, showing nested sub-items). A `border-bottom: 1px T.gray50 (#f2f2f2)`
     sits directly under this row, visually separating it from its own sub-items below.
     - Sub-items (indented, `pl-24` vs the parent's `pl-12` — a 12px child-indent convention),
       each `36px` tall, no icon, 14px Regular `T.gray700`:
       - **"Personal"** — on hover, gains a trailing `dots-horizontal` "more" icon button
         (ghost, 20px) — this is the trigger sampled in §8's Share menu.
       - **"Team"**
       - **"Org"**
       (This Personal/Team/Org triple is a real, if narrow, precedent for a per-report
       personal/team/org scope concept — worth noting for future data-model discussions, but
       out of scope for this sidebar spec.)
  2. **"Workplace Experience Report"** — plain row, no chevron, not expandable.
  3. **"Total Employee Brand Report"** — has a `chevron-down` (collapsed/closed group — i.e. it
     *is* expandable, just not currently open, unlike item 1).
  4. **"Brain Health Report"** — plain.
  5. **"DAS Report"** — plain.
  6. **"WFI Report"** — plain.
  7. **"Diversity and Inclusion Report"** — plain, and only partially visible in the 832px-tall
     screenshot's visible area.
- **Scrolling confirmed by real evidence, not guesswork**: the bottom `Frame` (Bell/Admin/More)
  in this frame carries a **`shadow-top-subtle`** drop-shadow (5 layers, all with *negative*
  y-offsets, i.e. casting upward) that doesn't appear in §2's unpopulated version. A shadow cast
  upward onto the content above it is the standard "sticky footer elevated over scrolling
  content" pattern — confirming the nav items + Your Reports list scroll internally while the
  Frame (icon row) and Avatar row stay fixed at the bottom. Implement the reports list (and the
  main nav list above it) inside a `flex:1, overflow-y:auto` region, with Frame + Avatar outside
  that scroll container.
- A `Cursor` annotation sits over "Personal," confirming it as the hovered row in this sample.

## 8. `Sidebar / Report Hover Share` — `11923:44806` (per-report "more" menu)

- Hovering a report sub-item (here, "Personal" again) shows a trailing `dots-horizontal` button;
  in *this* frame it's rendered with `bg: T.gray100 (#cecdcc)` — the ghost button's **`active`**
  token — confirming that's the pressed/menu-open look (vs. the plain hover tint elsewhere).
- Clicking it opens a **single-item** floating menu (matches the frame's own name literally):
  - **"Share Report"** — `share-07` icon (20px) → lucide `Share2`. That's the entire menu; no
    Rename/Duplicate/Delete items exist in this sample.
  - Position: `left: calc(50% - 386.5px), top: calc(50% + 44px)` relative to the 1440×832 frame
    — i.e. floating just to the right of the hovered row, roughly at its vertical position.
    Width **171px**. Same `radius.lg`/`shadow-md`/`T.gray25` chrome as every other floating menu
    in this file.

## 9. `Sidebar / Switch Accounts` — `12242:36152`

- **Trigger chain**: same profile chevron trigger as §6, but this sample shows the **fuller,
  4-item profile menu**:
  1. **Settings** (`settings-01` → `Settings`)
  2. **Rate Us** (`star-01` → `Star`)
  3. **Switch Accounts** — `switch-horizontal-02` icon (→ lucide `ArrowLeftRight`, closest
     match) + a trailing `chevron-right` (20px) indicating it opens a nested submenu. In this
     sample it's rendered with `bg: T.gray75 (#e5e4e3)` (ghost-hover token) since it's the item
     currently driving the cascade below.
  4. *(divider, `T.gray100`)*
  5. **Sign out** (`log-out-01` → `LogOut`, `T.red` text) — same destructive-ghost treatment as §6.
- **Cascading submenu**: hovering/clicking "Switch Accounts" opens a **second flyout to the
  right** of the first (classic nested-menu pattern — not a replacement of the first menu, both
  stay visible side by side per the screenshot). Contents:
  1. **Current account** — "Olivia Rhye" / "olivia@meta.com", 32px avatar (real photo
     placeholder), plus a trailing `check` icon (20px → lucide `Check`) marking it as active.
  2. **Second account** — "Olivia Personal" / "olivia.rhye@gmail.com" (rendered as two font
     sizes/weights spliced together: 12px normal + 11px normal — likely just a Figma text-styling
     quirk, treat as one 12px secondary-text line), avatar shown as **initials "OP" on a
     `T.gray100` (`#cecdcc`) circle** — this is Figma's real fallback-avatar pattern for an
     account without a photo (uppercase 2-letter initials, 14px Semibold, `T.gray500` text).
     Worth reusing this convention anywhere else in the app that needs an avatar fallback.
  3. *(divider, `T.gray75`)*
  4. **"Add account"** — `user-plus-01` icon → lucide `UserPlus`.
  - Chrome: same `T.gray25` rows / `radius.lg` / `shadow-md` as every other floating menu.
- **Noise to ignore**: this same Figma page also contains a duplicate-looking "Date Changer"
  component instance (`12242:36381`) positioned separately in the main canvas area
  (`top:526px`, unrelated to the sidebar's own coordinate space and not visible in the rendered
  screenshot). It's almost certainly an orphaned/duplicate copy left on the canvas, not a second
  real state to implement — ignore it.

## Extra Links panel (bonus — covers the `Frame`'s 3rd "more" button)

Not one of the 9 numbered states in the brief, but directly answers what the Frame's
`dots-horizontal` button (§2, right side) does, sampled via `Sidebar / Extra Links` —
`11923:45052` and `Sidebar / Extra Links Hover` — `11923:45938`:

- Triggered from the Frame's third icon button (rendered `bg: T.gray100` "active" tint while
  open, same convention as §8's trigger).
- Panel: `bg: T.gray25`, `radius.xl` (16px, hardcoded not a variable this time), `shadow-md`,
  `12px` padding/gap, positioned `left:284,top:631` (again overflowing the sidebar's right edge,
  consistent with every other floating menu in this file).
- **Three columns, each a header + item list** (header: 13px Semibold uppercase `T.gray500`;
  items: 14px Regular `T.gray900`, rows `radius.sm`):
  - **SHAPE**: About Us, Science
  - **RESOURCES**: White Papers
  - **LEGAL**: Privacy Policy, Terms of Use
- **Footer row** (`border-top T.gray100`, `justify-end`, `gap-24`): two ghost icon buttons —
  `globe-02` (→ lucide `Globe`, "Website") and a **LinkedIn brand mark** (Figma layer name
  `social-icons-2`; the hover-state screenshot clearly shows the recognizable LinkedIn "in"
  glyph). **This one needs a real exported asset, not a lucide approximation** — it's a
  third-party brand logo, and per the icon-fidelity rule, brand marks must be pixel-exact
  (download-and-commit the actual SVG, don't hand-draw a "close enough" LinkedIn-style icon).
- Hover state confirms a **third distinct hover-tint token** in this system: the "About Us" row
  hovers to `T.gray50 (#f2f2f2)` — different from the `T.gray25` nav-item hover and the
  `T.gray75` ghost-button hover used elsewhere. All three already exist in `tokens.js`; just be
  aware the system genuinely uses three different hover tints for three different row/button
  archetypes, it's not one inconsistent value to normalize away.

---

## 10. Ambiguities / inconsistencies to flag, not silently resolve

1. **Collapsed vs. expanded frame height**: Default = 842px, every expanded-state frame = 832px.
   A 10px difference with no visible cause — most likely just an artboard-sizing accident in
   Figma, not a deliberate spec. **Recommendation**: build the real rail at `height: 100%` of its
   flex parent in both states rather than porting either literal pixel height.
2. **`--color-border-secondary` resolves to two different hex values within the same file**:
   `#cecdcc` (`T.gray100`, used for the rail's own outer border and dropdown-menu dividers) vs.
   `#e5e4e3` (`T.gray75`, used for the Frame/Avatar row's internal top-borders). Both are real,
   already-defined tokens — this isn't a typo to fix, it's Figma's own variable resolving
   differently per binding. Pick deliberately: outer rail border → `T.gray100`; internal
   Frame/Avatar dividers → `T.gray75`.
3. **Figma's `--radius-xl` variable also resolves inconsistently**: 18px on the sidebar's own
   corner rounding, but 12px on every floating dropdown/menu (Profile menu, Share menu, Switch
   Accounts menu). Don't reuse Figma's variable name — use our own `radius.widget` (18) for the
   rail corners and `radius.lg` (12) for floating menus, which is what this doc's per-state
   sections already do.
4. **Logo Interaction vs. Logo Hover** (§3–4): two visually distinct treatments with no
   in-file evidence for which is "real" hover vs. an alternate/focus state, and neither carries
   a tooltip despite every *other* icon (§5) getting one. Flagged as a design question, not
   resolved here — see §3–4's recommendation to default to the Logo Hover (pill+gray25)
   treatment for consistency with the rest of the system.
5. **Profile menu item count differs between samples**: 3 items in `Profile Chevron` (§6) vs.
   4 items (adds "Switch Accounts") in `Switch Accounts` (§9). Treat the 4-item version as
   authoritative (superset); §6's frame is likely just an earlier/simplified sample.
6. **The `Ellipse` badge-dot exists in the node tree of every sampled frame but is genuinely
   invisible** due to z-order (§1) — don't port it as-is; it would need a real z-order decision
   if a notification badge on Bell is actually wanted.

---

## 11. Implementation notes — suggested state machine

A stateful `NavRail` needs roughly these pieces of state (naming is a suggestion, not a
requirement):

```
expanded: boolean               // collapsed (69px, 3 nav items) vs expanded (300px, 5 nav items)
hoveredItem: string | null      // which collapsed-mode icon is hovered → drives tooltip + pill tint
logoHovered: boolean            // collapsed-mode logo swap (icon-swap to layout-left) + tint
reportsOpen: boolean            // "Your Reports" section expand/collapse (chevron-right ↔ down)
profileMenuOpen: boolean        // Settings/Rate Us/Switch Accounts/Sign out flyout
switchAccountsOpen: boolean     // nested cascade from profileMenuOpen, only reachable when it's open
reportMenuOpenFor: string|null  // which report sub-item's "..." Share menu is open
extraLinksOpen: boolean         // the Frame's 3rd "more" button → SHAPE/Resources/Legal panel
```

Behavioral notes carried over from the audit above, not otherwise obvious from a static spec:

- Expanding/collapsing isn't a label-visibility toggle — the nav item *list itself* changes
  (3 items ↔ 5 items), and the bottom icon row grows from 2 to 3 icons (adds "more").
- All floating menus (profile, switch-accounts, share, extra-links) share one visual language:
  `T.gray25` rows, `radius.lg` (12px), `shadow-md` (the 5-layer drop shadow), and all of them are
  allowed to overflow past the sidebar's own right edge into the canvas — don't clip them to the
  rail's width.
- Nav-item hover tint is `T.gray25`; ghost-icon-button hover is `T.gross75` — sorry, `T.gray75`;
  ghost-icon-button *active/pressed* is `T.gray100`; the Extra-Links list-row hover is `T.gray50`.
  Four different tokens for four different row archetypes — keep them distinct, don't collapse
  to one "hover gray."
- The "Your Reports" list + main nav list should live inside one scrollable region; the bottom
  `Frame` (Bell/Admin/More) and Avatar row are a fixed footer below it (evidenced by the
  upward-cast `shadow-top-subtle` in the populated-reports frame).
- Chevron rotation is meaningful and already modeled by Figma: `chevron-right` = closed/collapsed
  section, `chevron-down` = open, `chevron-up` = an individual report row's own sub-items are
  expanded.

### Icons needing a new lucide import (not already in `NavRail.jsx`)

`Search`, `BookOpen`, `PanelLeft` (or `PanelLeftClose`/`PanelLeftOpen` — closest match for
`layout-left`), `ChevronRight`, `ChevronDown`, `ChevronUp`, `Plus`, `MoreHorizontal`,
`ChevronsUpDown`, `Star`, `LogOut`, `ArrowLeftRight`, `Share2`, `Globe`, `Check`, `UserPlus`.
(`MessageSquare`, `Building2`, `Wand2`, `Bell`, `Settings` are already imported and match.)

### Assets needing a real export, not a lucide approximation

- **LinkedIn brand mark** (Extra Links footer) — third-party logo, must be pixel-exact per the
  icon-fidelity rule. Download-and-commit, same pattern already used for `shape-logo.svg`.
- Everything else sampled in this audit is a generic icon with a close-enough lucide equivalent
  listed above.
