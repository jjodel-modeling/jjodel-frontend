# Discovery — Avatar settings redesign (read-only)

**Date**: 2026-06-02
**Branch**: `alfonso-frontend-jjtl`
**Type**: discovery / read-only — no files modified.
**Upcoming change (NOT in this prompt)**: remove the avatar STYLE icon row; redesign the
COLOR picker to match the "highlight color" pattern (small dimmed swatches for unselected,
larger full-opacity swatch for selected).

---

## 1. The avatar settings component

### File paths & component name
- **Component**: `ProfileSectionComponent` (default export `ProfileSection`, redux-connected).
  - `frontend/src/components/Settings/UnifiedSettingsModal/sections/ProfileSection.tsx`
- **SCSS**: `frontend/src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.scss`,
  block `.avatar-customizer` at **lines 880–1011**.
- **Config constants**: `frontend/src/constants/avatarConfig.ts`
- **State hook**: `frontend/src/hooks/useAvatar.ts`

This is the "Personal Information" section ("Update your personal details and preferences",
`ProfileSection.tsx:171–174`). The avatar customizer block is `ProfileSection.tsx:184–248`.

### Style / icon set definition
`AVATAR_ICONS` — an **array of `(string | null)`** in `avatarConfig.ts:18–32`. Index `0` is
`null` = **initials (default)**; the rest are Bootstrap Icons class names:

| index | value | meaning |
|---|---|---|
| 0 | `null` | initials (DEFAULT) |
| 1 | `bi-person-fill` | |
| 2 | `bi-star-fill` | |
| 3 | `bi-lightning-fill` | |
| 4 | `bi-heart-fill` | |
| 5 | `bi-gem` | |
| 6 | `bi-rocket-takeoff-fill` | |
| 7 | `bi-code-slash` | |
| 8 | `bi-mortarboard-fill` | |
| 9 | `bi-palette-fill` | |
| 10 | `bi-controller` | |
| 11 | `bi-music-note-beamed` | |
| 12 | `bi-cup-hot-fill` | |

The STYLE row maps over `AVATAR_ICONS` (`ProfileSection.tsx:211–231`); index `0` renders the
user's initials in the button, the rest render `<i className={\`bi ${icon}\`} />`.

### Color set definition
`AVATAR_COLORS` — an **array of `{ name, hex }`** (`AvatarColor` interface) in
`avatarConfig.ts:1–15`. Hard-coded hex literals, **not** design tokens:

| index | name | hex |
|---|---|---|
| 0 | slate | `#475569` |
| 1 | cyan | `#0ea5e9` (DEFAULT) |
| 2 | violet | `#7c3aed` |
| 3 | rose | `#e11d48` |
| 4 | amber | `#d97706` |
| 5 | emerald | `#059669` |
| 6 | indigo | `#4f46e5` |
| 7 | teal | `#0d9488` |

The COLOR row maps over `AVATAR_COLORS` (`ProfileSection.tsx:237–246`), each swatch styled
inline with `style={{ backgroundColor: color.hex }}`.

### Selection management
- Local-to-hook state via **`useAvatar()`** (`ProfileSection.tsx:51`):
  `const [avatarConfig, setAvatarConfig] = useAvatar();`
- `avatarConfig` shape: `AvatarConfig = { colorIndex: number; iconIndex: number }`
  (`avatarConfig.ts:36–39`). Defaults: `colorIndex: 1` (cyan), `iconIndex: 0` (initials)
  (`DEFAULT_AVATAR_CONFIG`, `avatarConfig.ts:41–44`).
- **Read**: `currentColor = AVATAR_COLORS[avatarConfig.colorIndex]`,
  `currentIcon = AVATAR_ICONS[avatarConfig.iconIndex]` (`ProfileSection.tsx:52–53`).
- **Write style**: `setAvatarConfig({ ...avatarConfig, iconIndex: index })`
  (`ProfileSection.tsx:221`).
- **Write color**: `setAvatarConfig({ ...avatarConfig, colorIndex: index })`
  (`ProfileSection.tsx:242`).
- `useAvatar` persists to localStorage + broadcasts a CustomEvent on every write (see §4).
- **Not** in Redux, **not** in `DUser`/backend. The form's `handleSave` (`ProfileSection.tsx:126`)
  writes name/surname/email/etc. to the backend (`UpdateUserRequest`) but **never** the avatar
  config — avatar is purely client-side localStorage.

### How the large preview derives its appearance
`ProfileSection.tsx:188–201`:
- The preview circle `.avatar-customizer__preview` gets `style={{ backgroundColor: currentColor.hex }}`.
- Inside: if `currentIcon === null` → render initials (first letters of name+surname,
  uppercased, fallback `?`); else render `<i className={\`bi ${currentIcon}\`} />`.
- So the preview = `currentColor.hex` background + (initials | icon) from `currentIcon`.
- Preview size 56×56px, white foreground (`UnifiedSettingsModal.scss:888–916`).

### SCSS / class names — current treatment

**Style buttons** (`.avatar-customizer__style-grid` / `__style-option`,
`UnifiedSettingsModal.scss:942–981`):
- Grid: `display:flex; gap:6px; flex-wrap:wrap`.
- Option: 40×40px, `border-radius:8px`, `1.5px solid var(--border-color,#e2e8f0)`,
  bg `var(--bg-primary,#fff)`, color `var(--text-secondary,#64748b)`, `transition: all .15s`.
- `.selected`: border-color/background/color set **inline** (= `currentColor.hex`, white text);
  plus `box-shadow: 0 0 0 1px rgba(0,0,0,0.05)` and `i { color:#fff }`.
- `:focus-visible` ring `0 0 0 2px #334155, 0 0 0 4px rgba(51,65,85,.3)`.

**Color swatches** (`.avatar-customizer__color-row` / `__color-swatch`,
`UnifiedSettingsModal.scss:983–1009`):
- Row: `display:flex; gap:8px; flex-wrap:wrap`.
- Swatch: **28×28px**, `border-radius:50%`, `2px solid transparent`, `transition: all .15s`.
- `:hover { transform: scale(1.15) }`.
- **Selected-state treatment** = the cyan/slate double-ring:
  `&.selected { border-color:#334155; box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #334155; }`
  (slate `#334155` outer ring with a white gap — `UnifiedSettingsModal.scss:1005–1008`).
  > Note: the active ring is **slate `#334155`**, not cyan. (The "cyan double-ring" described in
  > the prompt is not what the code does today — flagged per CLAUDE.md §5.1.)
- `:focus-visible` ring `0 0 0 2px #334155, 0 0 0 4px rgba(51,65,85,.3)`.
- All swatches are **full opacity, uniform size** today; selection conveyed only by the ring.

---

## 2. The "highlight color" picker (pattern to reuse)

### File paths & component name
- **Component**: `HighlightPalette` (default export) —
  `frontend/src/components/editor-v2/components/HighlightPalette.tsx` (43 lines, pure presentation).
- **SCSS**: `frontend/src/components/editor-v2/EditorV2.scss`, `.hl-palette*` block at
  **lines 3637–3671** (no dedicated SCSS file).
- **Mount**: `Toolbar.tsx:366` (`editor-v2/Toolbar.tsx`); state lives in `EditorV2.tsx`
  (`activeHighlightColor` `useState(1)`, `EditorV2.tsx:457`).
- This is the picker created in commit `bf6c08b01` (2026-05-30) "borderless circular highlight
  swatches with size+opacity selection".

### Desaturation mechanism — IMPORTANT precision (§5.1)
The pattern does **NOT** use CSS `filter: saturate()`, nor opacity-vs-token color values.
It uses plain **`opacity`** on a colored `<span>` dot:

`EditorV2.scss:3655–3671`:
```scss
.hl-palette__dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    aspect-ratio: 1 / 1;
    box-sizing: border-box;
    flex-shrink: 0;
    opacity: 0.55;                       // ← unselected "dimming"
    transition: width 0.14s ease, height 0.14s ease, opacity 0.14s ease;

    .hl-palette__swatch.active & {
        width: 22px;
        height: 22px;
        opacity: 1;                      // ← selected = full opacity
    }
}
```
- **Unselected** = `opacity: 0.55`, 16×16px.
- **Selected** (`.active`) = `opacity: 1`, 22×22px.
- "Desaturated" in the prompt = **opacity 0.55**, not a saturation filter. (A grep for
  `saturate` across the codebase finds only token names — `--color-entity-*-saturated` — and
  comments; no picker uses `filter: saturate()`.)

### Size difference
- Dot: **16×16px unselected → 22×22px selected** (+6px each axis).
- The dot lives inside a **fixed 26×26px slot** (`.hl-palette__swatch`, `EditorV2.scss:3642–3654`:
  `width/height:26px`, flex-centered, `background:transparent`, `border:none`, `flex-shrink:0`).
  The fixed slot is the **anti-reflow trick**: the dot grows/shrinks but neighbours never move
  and the click target stays stable.

### Classes & tokens
- `.hl-palette` (container, `display:flex; align-items:center; gap:0`), `.hl-palette__swatch`
  (the fixed 26px slot button), `.hl-palette__dot` (the colored circle), `.hl-palette__clear`
  (the eraser button). These classes are used **only** by this picker (no sharing).
- **Color source**: theme-adaptive CSS variables `--hl-1`..`--hl-5`, defined in
  `EditorV2.scss:3579+` (base) with per-theme overrides (High Contrast `:3589`, Print `:3592`).
  Applied inline: `style={{ background: \`var(--hl-${n})\` }}` (`HighlightPalette.tsx:27`).
- The swatches map over numeric indices `COLOR_INDICES = [1,2,3,4,5]`
  (`HighlightPalette.tsx:7,18`), dispatching `onSelect(n)` with the **index**, not a hex.

### Reusable component or inline?
**Not a generic reusable color picker** — it is a single-purpose toolbar component bound to the
highlight feature (props `activeColor: number`, `onSelect`, `onClear`). The reusable part for the
avatar redesign is the **CSS technique** (fixed-size slot + inner circle scaled by
size + opacity), not the component itself. The avatar redesign should replicate that SCSS pattern
on `.avatar-customizer__color-swatch` rather than import `HighlightPalette`.

> Transfer note: the highlight dots get their color from a single `var(--hl-N)`; avatar swatches
> get theirs from `AVATAR_COLORS[i].hex` applied inline. The opacity+size technique is independent
> of the color source, so it transfers directly: unselected swatch = inline `backgroundColor` +
> `opacity:0.55` at the smaller size, selected = `opacity:1` at the larger size, inside a
> fixed-size slot to prevent reflow.

---

## 3. Backward-dependency check on the avatar style (icons)

`avatarConfig.iconIndex` → `AVATAR_ICONS[iconIndex]` is read in **three** places. Two are
outside the settings panel:

| # | Consumer | File:line | How it resolves the style | Breaks if `style` gone / always initials? |
|---|---|---|---|---|
| A | Settings panel (self) | `ProfileSection.tsx:53,212,221` | `currentIcon = AVATAR_ICONS[iconIndex]`; STYLE row sets it | n/a — this is the row being removed |
| B | **Jodie chat** `MessageBubble` | `ChatMessages.tsx:57–59, 68–75` | `avatarIcon = AVATAR_ICONS[iconIndex]`; user-message avatar renders `avatarIcon ? <i bi …> : initials` | **No** — null-checks `avatarIcon`; with `iconIndex=0` (`AVATAR_ICONS[0]===null`) it renders initials |
| C | **Navbar `UserBadge`** | `Navbar.tsx:592, 1937` + def `411–421` | passes `icon={AVATAR_ICONS[iconIndex]}`; badge renders `props.icon ? <i bi …> : initials.toUpperCase()` | **No** — null-checks `props.icon`; with `iconIndex=0` renders initials |

**Verdict**: both external consumers (B, C) **null-guard** the icon and fall back to initials.
- If the redesign just **removes the STYLE row** and leaves `iconIndex` in the config (always `0`),
  **nothing breaks** — both consumers keep rendering initials. This is purely presentational.
- If the redesign **removes `iconIndex` from `AvatarConfig` and the `AVATAR_ICONS` array entirely**,
  then B (`ChatMessages.tsx:15,59`) and C (`Navbar.tsx:63,1937`) must be edited (they import
  `AVATAR_ICONS` and index it with `avatarConfig.iconIndex`), plus the `loadConfig` validation in
  `useAvatar.ts:18` (`parsed.iconIndex < AVATAR_ICONS.length`). These would be in-scope file edits,
  not silent breakage — but they are **out of the avatar-settings component** and must be named in
  the implementation prompt.

**Recommendation for the implementer**: the lowest-risk path is to keep `iconIndex` in the schema
(pinned to `0`) and only remove the STYLE row UI + its handler. No consumer touch, no migration.

---

## 4. Persistence

### Where & shape
- **localStorage only.** Key `AVATAR_STORAGE_KEY = 'jjodel-avatar-config'` (`avatarConfig.ts:34`).
- Stored JSON shape: `{ "colorIndex": number, "iconIndex": number }` (`AvatarConfig`).
- **No Redux slice, no backend `DUser` field, no offline-user object** stores the avatar config.
  (The form's backend save in `ProfileSection.handleSave` deliberately omits avatar.)

### Read / write paths (`hooks/useAvatar.ts`)
- **Read**: `loadConfig()` (`useAvatar.ts:11–42`) — `localStorage.getItem('jjodel-avatar-config')`,
  validates `colorIndex`/`iconIndex` are in range, **strips a legacy `patternIndex`** if present
  (`:21`). Also a one-time migration from the older `'jjodel-avatar-color'` key (`:27–39`), then
  defaults to `DEFAULT_AVATAR_CONFIG`.
- **Write**: `setConfig` (`useAvatar.ts:47–51`) — `localStorage.setItem('jjodel-avatar-config', …)`
  + `window.dispatchEvent(new CustomEvent(AvatarEvents.CONFIG_CHANGE, { detail }))`.
- **Cross-component sync**: every `useAvatar` instance listens for `AvatarEvents.CONFIG_CHANGE`
  (`useAvatar.ts:53–59`) and updates its state — so changing color in Settings live-updates the
  Navbar badge and Jodie avatars without reload. Event constant:
  `AvatarEvents.CONFIG_CHANGE = 'avatar-config-change'` (`events/registry.ts:99–100`).
- `getStoredAvatarConfig()` (`useAvatar.ts:64–66`) is a non-hook read of the same `loadConfig()`.

### Migration impact of removing `style`/`iconIndex`
- **Removing only the STYLE row (keep `iconIndex` in schema)**: **no migration needed**. Existing
  localStorage values stay valid; `iconIndex` is read but never changed (stays `0` → initials).
- **Removing `iconIndex` from the schema**: not a persisted-Redux/`jsxString` migration (so **no
  `VersionFixer` involvement** — that's for project state, §3.9), but `loadConfig`'s validation
  (`useAvatar.ts:16–22`) would need adjusting so old `{colorIndex, iconIndex}` blobs still parse
  (it currently *requires* `iconIndex` to be in range; an old value would still pass, but the field
  should be dropped on read like `patternIndex` is). This is localStorage-shape housekeeping, not a
  framework migration.
- Conclusion: **removing `style` is purely presentational**; no `VersionFixer` migration, no backend
  change. Only localStorage-shape tidy-up if `iconIndex` is fully deleted.

---

## Summary of key facts

- **Avatar settings component**: `ProfileSection.tsx` (SCSS `UnifiedSettingsModal.scss:880–1011`),
  driven by `useAvatar()` + `avatarConfig.ts` constants.
- **Highlight picker pattern**: `HighlightPalette.tsx` + `EditorV2.scss:3637–3671`. Desaturation =
  **`opacity: 0.55` → `1`** (NOT `filter: saturate()`); size **16px → 22px** inside a fixed **26px**
  slot; classes `.hl-palette__swatch` / `.hl-palette__dot`; color via `--hl-N` vars.
- **External style consumers**: Jodie `ChatMessages.tsx:59` and Navbar `UserBadge` (`Navbar.tsx:1937`,
  def `:411`). Both null-guard the icon → safe under "always initials".
- **Persistence**: localStorage key `jjodel-avatar-config`, shape `{colorIndex, iconIndex}`; no Redux,
  no backend, no `VersionFixer`. Live sync via `AvatarEvents.CONFIG_CHANGE`.

### Caveats (§5.1)
- The current selected-color treatment is a **slate `#334155`** double-ring, not cyan (prompt said
  "cyan double-ring"). Confirm the intended target state before implementing.
- The highlight "desaturation" is **opacity**, not a saturation filter — do not go looking for
  `filter: saturate()`; replicate the opacity+size technique.
- Static analysis only (read-only). The "live render via initials" claim for consumers B/C is
  derived from the null-guards in source; not exercised at runtime in this session.
