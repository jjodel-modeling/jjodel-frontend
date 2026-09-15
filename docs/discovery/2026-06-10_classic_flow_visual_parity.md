# Discovery — Classic/Flow visual parity for M1 Default views

**Date**: 2026-06-10
**Type**: discovery (READ-ONLY — no source modified, no commit)
**Branch**: `alfonso-frontend-jjtl`
**Goal**: gather the facts needed to design a redesign of the Default-viewpoint M1 views (Object, Value, …) so a model rendered in the **classic** editor is visually consistent with the same model rendered in the **flow** editor (editor-v2) under a custom palette (e.g. "Pistacchio").

> Scope note: this document answers the four question groups (A–D) with file paths, line numbers and verbatim excerpts. Where a claim was independently re-verified by hand (not just by a sub-agent) it is marked **[verified]**. A consolidated verification log is at the end.

---

## 0. Executive summary — the decisive findings

1. **A new runtime palette-injection mechanism now exists** and supersedes the conclusion of the prior discovery `docs/discovery/2026-06-06_canvas_color_schemes.md` ("purely static, zero runtime CSS-var injection"). Custom palettes are seed-derived (`derivePalette.ts`) and injected at runtime via a single `<style id="jjodel-custom-palettes">` element appended to `<head>` (`useCustomPaletteStyleSheet.ts`). **The 2026-06-06 doc must be read as superseded on the static-vs-runtime question.** **[verified]**

2. **The injected variables are scoped to `.editor-v2.scheme-<id>.theme-<t>`, NOT to `:root`.** **[verified]** (`useCustomPaletteStyleSheet.ts:31-36`).

3. **In classic and split editor modes, the classic canvas (`.GraphContainer`) is a DOM descendant of the `.editor-v2.scheme-<id>` root** (`EditorV2.tsx:3299` root → `:3356`/`:3367` classicSlot). **[verified]** Therefore a classic-editor element **would inherit** the custom-palette CSS variables by normal CSS custom-property inheritance — *if* it references their names. The classic editor's current CSS does **not** reference any of the `--object-header-bg` / `--field-type-color` / `--node-header-text` family, so today there is **no** visual effect. **This is the lever for parity: the classic Object/Value templates can consume the exact same variable names and they will resolve to the active palette.**

4. The flow Object node **already hides reference rows** from the body — it filters to `featureKind === 'attribute'` (`ObjectNode.tsx:288,337`). The classic Object template does **not**: it maps `data.features`, which includes both attribute and reference slots **and** empty (mirage) slots. The cheapest parity fix is in the template (see B3/B4).

5. Persistence: the Object/Value templates are persisted as `jsxString` in Redux project state. Any source change to `DV.tsx` requires a **VersionFixer migration** (§3.9). Current `highestVersion = 2.222`; next free slot = **`2.222 -> 2.223`** **[verified]**. The current Object/Value templates contain stable detectable substrings but **no formally-designated marker constant exists yet** — one would need to be added to `defaultViewTemplate.ts` (see D4).

6. The red dashed/dotted "error" overlay on "Università dell'Aquila" is a **name-validation** decorator, **not** a length check. The trigger is the regex `/^[A-Za-z_$]+[A-Za-z0-9$_\s]*$/` failing on the accented `à` and the apostrophe. Message: *"Object names can only contain an alphanumeric chars or or $_ symbols"* (the double "or or" is a real typo in source). **[verified]** (`store.tsx:426-429`).

---

## A. Flow editor M1 node anatomy and palette injection

### A1. Flow M1 object-node component and class names

**Component**: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (registered as ReactFlow node type `'objectNode'`, `ObjectNode.tsx:32`). **[verified — full file read]**

**DOM structure & root class names** (`ObjectNode.tsx:341-543`):

- Root node `<div>`: `mm-node mm-object` (+ `selected`, `mm-object--orphan`, `mm-object--problem-highlighted`, highlight class) — `:342`
- Header band `<div>`: `mm-node__header mm-object__header` — `:362-363`
  - Name span: `mm-node__name mm-object__name` containing `mm-object__instance-name` + `mm-object__separator` (literal `" : "`) + `mm-object__class-name` — `:378-382`
- Body `<div>`: `mm-node__body` > `mm-node__fields` — `:388-389`
  - Each attribute row `<div>`: `mm-field mm-object__feature` — `:394`
    - name span: `mm-field__name mm-object__feature-name` — `:395`
    - separator span: `mm-field__separator` (literal `=`) — `:398`
    - value span: `mm-field__type mm-object__feature-value` (+ italic) — `:454`
  - Lazy-coevolution placeholder rows add `mm-object__feature--placeholder` — `:470`

**SCSS file**: `frontend/src/components/editor-v2/EditorV2.scss` (header `:1600`, feature-name `:1626`, feature-value `:1630`, selection `:1660-1676`, field-name color `:1720`, field-type color `:1742`). Notation overrides also in `frontend/src/components/editor-v2/_notations.scss`.

**Key behavioral fact for parity**: the body renders **attributes only**. `existingAttrs = data.features?.filter(f => f.featureKind === 'attribute')` (`:337`, also `:288`). References are not in the body at all — they are drawn as edges. The flow node additionally shows "lazy co-evolution" placeholders for *optional* metaclass attributes not yet valorized (muted style, `missingAttributes`, `:122-150,465-534`); required-but-missing attributes (`lowerBound > 0`) are skipped (`:129`).

### A2. Palette injection — THE CRUX

**Seed → variables**: `frontend/src/components/editor-v2/utils/derivePalette.ts` **[verified — full file read]**. `derivePaletteVars(seed)` (`:66-116`) derives the same ~12 CSS custom properties per theme that the curated palettes hardcode, from a single seed hex via HSL formulas. It returns `{ light, dark, lightAbstract, lightEnum, lightPackage }`. The light/dark variable sets (`:73-102`):

```
--class-header-bg, --class-abstract-header-bg, --enum-header-bg, --package-header-bg,
--object-header-bg, --orphan-border-color, --orphan-header-bg, --node-header-text,
--stereotype-color, --field-type-color, --enum-accent, --package-accent
```
plus light-only descendant re-overrides: `lightAbstract` (`.mm-class.abstract`), `lightEnum` (`.mm-enum`), `lightPackage` (`.mm-package`).

**Injection site**: `frontend/src/components/editor-v2/hooks/useCustomPaletteStyleSheet.ts` **[verified — full file read]**. It builds a flat CSS string and writes it into a single `<style id="jjodel-custom-palettes">` element in `document.head`:

```typescript
// useCustomPaletteStyleSheet.ts:26-39  (buildCss)
const base = `.editor-v2.scheme-${p.id}`;
blocks.push(block(`${base}.theme-dark`, dark));
blocks.push(block(`${base}.theme-light`, light));
blocks.push(block(`${base}.theme-light .mm-class.abstract`, lightAbstract));
blocks.push(block(`${base}.theme-light .mm-enum`, lightEnum));
blocks.push(block(`${base}.theme-light .mm-package`, lightPackage));
```
```typescript
// useCustomPaletteStyleSheet.ts:48-54
let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
if (!style) { style = document.createElement('style'); style.id = STYLE_ID; document.head.appendChild(style); }
style.textContent = buildCss(customPalettes);   // STYLE_ID = 'jjodel-custom-palettes'
```

**Wiring**: `EditorV2.tsx:740-753` loads `customPalettes` from `localStorage['jjodel.customPalettes']`, persists on change (`:748-750`), and calls `useCustomPaletteStyleSheet(customPalettes)` (`:753`). The active scheme id is held in `colorScheme` (`:757-763`, accepts a custom id when `customPalettes.some(p => p.id === saved)`), and applied as a class on the root: `EditorV2.tsx:3299`:

```tsx
<div className={`editor-v2 theme-${theme} notation-${notation}${colorScheme !== 'default' ? ` scheme-${colorScheme}` : ''}…`} …>
```

So: variables are set as CSS custom properties **on the `.editor-v2.scheme-<id>.theme-<t>` element** (3-class specificity, mirroring the curated `_color-schemes.scss` blocks). They are **not** set on `:root`/`documentElement`, and nothing uses `element.style.setProperty` for palettes.

**DECISIVE scoping answer**: In classic and split modes the classic canvas is rendered *inside* the `.editor-v2` root:

```tsx
// EditorV2.tsx:3299  → root div carries `scheme-<id>` + `theme-<t>`
// EditorV2.tsx:3349-3357  classic-only:  <div className="editor-classic-only …">{classicSlot}</div>
// EditorV2.tsx:3358-3368  split:         <div className="editor-split-classic …">{classicSlot}</div>
```
`classicSlot` is the host of the classic `.GraphContainer` (from `ModelTab.tsx`). Because CSS custom properties **inherit**, any element under `.GraphContainer` **will resolve** `var(--object-header-bg)` etc. to the active custom palette's value **without any extra plumbing** — provided the classic template/SCSS *references those names*. It does not today. (In a hypothetical "flow-only" editor mode with no viewpoint, `.GraphContainer` is simply not mounted.) **[verified: injection target + DOM nesting]**

> Caveat worth flagging for the design phase: the inherited values are computed for the **flow** node sizes/notation. Reusing them in classic is purely a *color* inheritance; it carries no geometry. That is exactly what parity needs (colors from palette, structure from the template).

### A3. Palette-driven vs hardcoded (flow object node)

Variable names below were confirmed present in `EditorV2.scss` **[verified — grep]**; line numbers for the SCSS rules are as reported by exploration.

| Visual property | CSS variable | Palette-controlled? | Hardcoded fallback | Ref |
|---|---|---|---|---|
| Header band background | `--object-header-bg` | **Yes** (curated + custom) | `rgba(180,130,50,0.35)` | `EditorV2.scss:1601` |
| Header text color | `--node-header-text` | **Yes** | none (theme defines) | `:1228` |
| Attribute **name** color | `--field-name-color` | theme only (not in derive set) | none | `:1720` |
| Attribute **value** color (the italic) | `--field-type-color` | **Yes** | none (theme defines) | `:1742` |
| Node border | `--border-default` | **No** (theme only) | none | `:1181` |
| Selection border/glow | `--object-accent` | **No** — never defined anywhere → always falls back | `#f59e0b` (amber) | `:1671,1676` |
| Value italic | — | No (hardcoded `font-style: italic`) | — | `:1630-1633` |

Notes:
- The "green italic" appearance is the value span colored by `--field-type-color`. In the default light theme this is blue-ish (`#0369a1`); a green-seed custom palette ("Pistacchio") makes `--field-type-color = hsl(h, sC, 45)` green (`derivePalette.ts:83`). So the green is **palette-derived**, not hardcoded.
- `--object-accent` is referenced with a fallback but is **never assigned** in `_themes.scss`, `_color-schemes.scss`, or `derivePalette.ts` → selection highlight is **always amber `#f59e0b`** regardless of palette. (Relevant if parity wants selection to match too.)
- `--field-name-color` is **not** in the derived set — attribute *names* are theme-fixed, only the *value* text follows the palette. Mirror this asymmetry in classic for true parity.
- "Pistacchio" is **not** a hardcoded name anywhere (grep: zero hits); it is a user-created `CustomColorScheme {id, name, seed}` in `localStorage['jjodel.customPalettes']`.

---

## B. Current classic M1 templates (Default viewpoint)

Templates are defined as static methods on `DefaultView` in `frontend/src/common/DV.tsx`, surfaced via `DV.objectView()` / `DV.valueView()` (`DV.tsx:568-570`), and registered with appliesTo metadata in `frontend/src/redux/defaults/views.ts`. **CRITICAL ZONE — read only.**

### B1. Verbatim templates

**Object view — `DefaultView.object()` (`DV.tsx:1678-1701`)** **[verified — read]**:

```jsx
/* -- Jjodel Abstract Syntax Specification v2.0 -- */


<View className={'root object'}>
    <div className={'header'}>
        <div style={{textDecoration: 'underline'}}>
            <span style={{fontWeight: 500, textDecoration: 'underline'}}>
                {data.$name ?
                    <Input data={data.$name} field={'value'} hidden={true} autosize={true} placeholder={'name'} /> :
                    <Input data={data} field={'name'} hidden={true} autosize={true} placeholder={'name'} />
                }:&nbsp;
                {data.instanceof ? data.instanceof.name : 'Object'}
            </span>
        </div>
    </div>
    <hr/>
    <div className={'object-children'}>
        {level >= 2 && data.features.map(f => <DefaultNode key={f.id} data={f} />)}
    </div>
    {decorators}
</View>
```

**Value view — `DefaultView.value()` (`DV.tsx:1705-1718`)** **[verified — read]**:

```jsx
/* -- Jjodel Abstract Syntax Specification v2.0 -- */


<View className={'root value d-flex'}>
    {instanceofname && <label className={'d-block ms-1 name'}>{instanceofname}</label>}
    {!instanceofname && <Input className='name' data={data} field={'name'} hidden={true} autosize={true} />}
    <label className={'d-block ms-1 values_str'} style={{color: constants[typeString] || 'gray', fontStyle: 'italic'}}>
        = {valuesString}
    </label>
    {decorators}
</View>
```

The Value view's `instanceofname`, `valuesString`, `typeString` come from its usageDeclarations (`redux/defaults/views.ts` ~`:701-712`): `ret.instanceofname = data.instanceof?.name`, `ret.valuesString = data.valuesString()`, `ret.typeString = data.typeString`. (The `?.` there runs in the pre-render declarations string, **not** inside the jsxString — so it does not violate the template engine constraint.)

Value-view registration (`views.ts` ~`:686-714`): `appliableToClasses = [DValue.cname]` (`'DValue'`), `appliableTo = 'Field'`, `oclCondition = 'context DValue inv: true'` → **one** view matches **all** DValue instances (attribute-valued and reference-valued alike). There is **no** per-feature-type split today.

> Related but distinct: `DEFAULT_VIEW_JSX_STRING` in `frontend/src/utils/defaultViewTemplate.ts:93-133` is the *new-object workbench* template (renders only a header pill, no `name = value` rows). It is **not** the classic Default-viewpoint Object view. Do not conflate the two.

### B2. Feature-slot iteration

The Object template iterates exactly once (`DV.tsx:1697`):
```jsx
{level >= 2 && data.features.map(f => <DefaultNode key={f.id} data={f} />)}
```
`data.features` resolves via `LObject.get_features` → `get_children` in `frontend/src/model/logicWrapper/LModelElement.tsx` (`get_features` at `:3207` and the LObject override at `:6274`; `get_children` ~`:5829-5852`). This collection contains **both attribute-valued and reference-valued slots** — they come from the **same** path. Each `f` is an `LValue` whose `f.instanceof` is either an `LAttribute` or `LReference`. Each is then rendered by `<DefaultNode>`, which selects the single Value view for it.

**Parity gap**: flow shows attributes only; classic shows attributes **and** references (and empty slots — see B4). To match flow, reference-valued rows must be removed from the classic body.

### B3. Distinguishing attribute slots from reference slots inside a jsxString

**[verified — `LModelElement.tsx:6120-6124`]**:
```typescript
protected get_referenceFeatures(context, includeshapeless=false) {
    return context.proxyObject.features.filter((f) => (!f.instanceof ? includeshapeless : f.instanceof.className === DReference.cname));
}
protected get_attributeFeatures(context, includeshapeless=false) {
    return context.proxyObject.features.filter((f) => (!f.instanceof ? includeshapeless : f.instanceof.className === DAttribute.cname));
}
```
`DReference.cname === 'DReference'`, `DAttribute.cname === 'DAttribute'`.

So on the L-proxy, the discriminator is `f.instanceof.className` (`'DReference'` vs `'DAttribute'`). Candidate evaluation:
- `value.instanceof.className` — **REAL**, the canonical discriminator (used internally as above).
- `value.feature` — **NOT real**; there is no `.feature` shortcut; the property is `instanceof`.
- engine-emitted className differing per type — **No**; the Value view emits `className={'root value d-flex'}` identically for both (`DV.tsx:1710`).
- separate views via `oclCondition`/`jsCondition` — **Not used today**; one unconditional DValue view (`views.ts:689`).

**Two viable parity mechanisms, both legal under the template engine** (no `?.`, no `??`, `var` only, IIFE returns strings):

1. **Cheapest / cleanest — iterate the typed sub-collection.** The L-proxy already exposes `attributeFeatures` (getter `get_attributeFeatures`). Swap the iteration source in the Object template:
   ```jsx
   {level >= 2 && data.attributeFeatures.map(f => <DefaultNode key={f.id} data={f} />)}
   ```
   This natively excludes reference slots (references → edges) with no per-row predicate. **Recommended for evaluation** — verify at design time that `attributeFeatures` is reachable on the template `data` proxy and preserves slot order.
2. **In-template filter** (if `attributeFeatures` is not desirable for some reason):
   ```jsx
   {level >= 2 && data.features.map(f =>
       (f.instanceof && f.instanceof.className === 'DReference') ? null :
       <DefaultNode key={f.id} data={f} />)}
   ```
   AND-chain + ternary only — no optional chaining.

### B4. Empty (mirage) slots

When an object's metaclass is assigned, `_forceConformity` creates a `DValue` for every attribute **and** reference with `isMirage = true, values = []` (`LModelElement.tsx` ~`:6235-6254`). `data.features` (via `get_children`) is **mirage-inclusive** — it does **not** filter `isMirage`. (Contrast `get_truechildren` ~`:5788-5792`, which filters `!c.isMirage` — but the Object template does not use it.)

Consequence: empty attribute slots (`labs =`) **and** empty reference slots (`director =`) both flow through the single `data.features.map` at `DV.tsx:1697`. Hence:
- Switching to `data.attributeFeatures` (B3 option 1) hides empty **reference** rows automatically, while keeping empty **attribute** rows visible (matching flow's "show optional attributes" intent — though note flow shows them as muted *placeholders* and skips required-missing ones; classic currently shows all attribute slots uniformly).
- If empty attribute rows should also be hidden/muted to match flow, add an `isMirage` check too: `(f.isMirage) ? null : …` — but that diverges from flow's lazy-coevolution placeholder UX. Decide at design time.

The single edit locus for any "hide reference / hide empty" rule is `DV.tsx:1697`.

---

## C. Red validation overlay on classic nodes

### C1. Overlay source and trigger

A dedicated **validation viewpoint** (`validationVP`, `isValidation = true`, `isExclusiveView = false`) attaches three decorator `DViewElement`s in `frontend/src/redux/store.tsx` (`makeDefaultGraphViews`, ~`:366-449`):
- **Naming error view** `Pointer_ViewCheckName` (~`:414-430`) — invisible; computes `node.state.error_naming` via `onDataUpdate`.
- **Lowerbound error view** `Pointer_ViewLowerbound` (~`:432-449`) — computes `node.state.error_lowerbound`.
- **Generic error overlay** `Pointer_ViewOverlay` (~`:367-412`) — renders `DV.semanticErrorOverlay()` whenever any `error_*` key in `node.state` is truthy. `jsCondition` (`:368`):
  ```js
  let nstate = node?.state || {};
  Object.keys(nstate).filter(k => k.indexOf("error_")===0 && nstate[k]).length>0
  ```

Class injection: `frontend/src/graph/graphElement/graphElement.tsx` (~`:1489`) tags the exclusive view `mainView` and each non-exclusive decorator `decorativeView` + its id (e.g. `Pointer_ViewOverlay`).

CSS (inline `v.css` on the overlay view, `store.tsx` ~`:379-411`):
```scss
&.mainView { text-decoration-line: spelling-error; }
&.decorativeView {
    text-decoration-line: spelling-error;          /* red wavy/dotted underline on rows */
    .overlap{ outline: 1px dotted var(--failure); display: flex; }   /* dotted red border around node */
    .error-message{ color: var(--color-accent); background: var(--bg-2-5); border-radius: var(--radius);
                    position:absolute; top:50%; right:0; transform: translate(calc(100% + 20px), -50%); }
    .error-message::before { font-family: bootstrap-icons; content: '\F333'; /* warning triangle */ }
}
```
- `text-decoration-line: spelling-error` → the red dotted underlines on rows.
- `outline: 1px dotted var(--failure)` on `.overlap` → the red border (note: **dotted** in current source, not "dashed" as the screenshot description said — possibly a stale screenshot or visual approximation). `--failure = var(--color-error, #ed474a)` (`styles/variables.scss:33`).
- The `.error-message` div is absolutely positioned to the right of the node (looks like a tooltip; it has **no** HTML `title` attribute). Rendered by `DV.semanticErrorOverlay()` (`DV.tsx:1087-1100`).

> Side note: this overlay uses legacy tokens (`--bg-2-5`, `--radius`) flagged as deprecated in CLAUDE.md §7 — out of scope here, just noted.

### C2. Exact text and exact predicate

`store.tsx:426-429` **[verified — read]**:
```js
if (name.length === 0) err = type + " must be named.";
else if (!name[0].match(/[A-Za-z_$]/)) err = type + " names must begin with an alphabet letter or $_ symbols.";
else if (!name.match(/^[A-Za-z_$]+[A-Za-z0-9$_\s]*$/)) err = type + " names can only contain an alphanumeric chars or or $_ symbols";
if (node.state.error_naming !== err) node.state = {error_naming: err};
```
(`type = data.className.substring(1)` → `"Object"` for a `DObject`. The source literal is `\\s` inside the template string, i.e. runtime regex `\s`.)

**Full message**: `"Object names can only contain an alphanumeric chars or or $_ symbols"` (the double "or or" is a genuine typo in source).

**Predicate verdict**:
- Hypothesis (a) **string length** — **WRONG**. No length threshold anywhere in this pipeline (the only `.length` check is `=== 0`, i.e. "must be named").
- Hypothesis (b) **non-ASCII / accented / apostrophe** — **CORRECT**. The regex `/^[A-Za-z_$]+[A-Za-z0-9$_\s]*$/` permits only ASCII letters, digits, `$`, `_`, whitespace. "Università dell'Aquila" contains `à` (U+00E0) and `'` — either fails the match, firing the third branch.

(The truncated screenshot text "Object conta… chars" is the start of this message rendered/clipped in the floating `.error-message` box — "Object … contain … chars".)

---

## D. Propagation chain and migration

### D1. Default-viewpoint views relevant to M1 instances

Defined in `frontend/src/redux/defaults/views.ts` (registration) + `frontend/src/common/DV.tsx` (templates). Views that contribute visible chrome to an M1 model render:

| View | Pointer id | appliableTo / classes | Contribution to M1 render |
|---|---|---|---|
| **Object** | `Pointer_ViewObject` | `Vertex` / `[DObject]` | **PRIMARY M1 node**: header (name `: Type`), `<hr/>`, `object-children` body. The node card chrome. (`DV.tsx:1678-1701`) |
| **Value** | `Pointer_ViewValue` | `Field` / `[DValue]` | **Inline row** inside the Object body: `name = value`. (`DV.tsx:1705-1718`) |
| **Singleton** | `Pointer_ViewSingleton` | `Vertex` / `[DObject]` | Alternative minimal M1 card when `data.instanceof.isSingleton` (`DV.tsx:1722-1732`); no body. |
| **Model** | `Pointer_ViewModel` | `Graph` / `[DModel]` | The canvas root that *contains* the M1 nodes (`m1Objects.map(...)`, `DV.tsx:1283`); does not wrap individual nodes with chrome. |

So for parity the views to touch are **Object** (primary) and **Value** (the rows), plus **Singleton** if singleton instances must match too. The Model view contributes canvas-level chrome only (likely out of scope for node parity). The M2 metamodel views (Class/Enum/Attribute/Reference/Operation/Parameter/Literal) and the Edge views are not M1-instance views.

### D2. VersionFixer state **[verified]**

- `highestVersion` is **auto-derived** from method names (`VersionFixer.tsx:80-103`): `setup()` enumerates `Object.getOwnPropertyNames(VersionFixer.prototype)`, splits each `'X -> Y'` on `' -> '`, and `VersionFixer.highestVersion = Math.max(highestVersion, to)` (`:99`). Initialized to `0` (`:28`). No separate constant.
- Last migration methods (verbatim names): `'2.218 -> 2.219'` (`:834`), `'2.219 -> 2.220'` (`:839`), `'2.220 -> 2.221'` (`:849`), `'2.221 -> 2.222'` (`:878`, last method before class close at `:908`).
- **Current `highestVersion = 2.222`. Next free slot = `2.222 -> 2.223`.**
- Context: the prompt mentioned `2.221 -> 2.222` being "informally reserved for edge-marker work" — confirmed: `2.221 -> 2.222` is the composition/aggregation arrow migration (`:867-906`), already present. So an Object/Value parity migration would be `2.222 -> 2.223` (or bundled if edge-marker work lands first; just reporting the current head).

### D3. Stale-view detection pattern (`2.211 -> 2.212`)

Body (`VersionFixer.tsx:616-635`):
```typescript
private ['2.211 -> 2.212'](s: DState): DState {
    let migrated = 0;
    for (let k in s.idlookup) {
        let e = s.idlookup[k] as any;
        if (!e || typeof e !== 'object') continue;
        if (e.className !== 'DViewElement') continue;
        if (typeof e.jsxString !== 'string') continue;
        if (!e.jsxString.includes(LEGACY_PLACEHOLDER_MARKER)) continue;
        e.jsxString = DEFAULT_VIEW_JSX_STRING;
        e.css = '';
        e.palette = {};
        e.css_MUST_RECOMPILE = true;
        migrated++;
    }
    if (migrated > 0) console.log(`[VersionFixer 2.211 -> 2.212] Migrated ${migrated} default view(s)...`);
    return s;
}
```
Marker constant: `LEGACY_PLACEHOLDER_MARKER = 'To add information here,'` (`defaultViewTemplate.ts:143`). A later migration `2.213 -> 2.214` uses a second marker `V2_2_TO_V2_3_DETECT_MARKER = 'Customize this view'` (`defaultViewTemplate.ts:155`) plus an absence check.

Pattern is directly applicable to Object/Value: iterate `idlookup`, filter `DViewElement` with string `jsxString`, match a marker, rewrite `jsxString` (+ clear `css`/`palette`, set `css_MUST_RECOMPILE`). Note: the touched-defaults caveat seen in `2.220->2.221`/`2.221->2.222` comments — untouched defaults are *also* regenerated wholesale by `updateDefaultView` via the version bump; the migration method additionally covers *touched (clonedCounter)* defaults that `updateDefaultView` skips. A parity migration should follow the same dual approach.

### D4. Detectable substrings in current Object/Value templates

No formally-designated marker constant exists for these templates yet (a future migration must add one to `defaultViewTemplate.ts`, mirroring `LEGACY_PLACEHOLDER_MARKER`). Stable candidate substrings present today:

- **Object** (`DV.tsx:1683-1697`): `'root object'` (root className), `'object-children'` (body className, unique), `'data.$name ?'` (unique `$name` access), `data.instanceof ? data.instanceof.name : 'Object'` (unique conditional). Best single discriminator: **`'object-children'`** or **`'data.$name ?'`**.
- **Value** (`DV.tsx:1710-1714`): `'root value d-flex'` (root className, unique), `'values_str'` (semantic class, unique), `'= {valuesString}'`. Best single discriminator: **`'values_str'`** or **`'root value d-flex'`**.
- ⚠️ `'Jjodel Abstract Syntax Specification v2.0'` appears in MANY templates (object, value, singleton, package, parameter) → **not** a safe discriminator on its own.

---

## Open items for the design phase (facts only — not decisions)

1. **Parity variable reuse**: the classic Object/Value templates can consume `--object-header-bg`, `--node-header-text`, `--field-name-color`, `--field-type-color` directly (they inherit from `.editor-v2.scheme-<id>`). Confirm classic SCSS scoping does not shadow them. Selection highlight `--object-accent` is unused (always amber) — decide whether classic selection should match.
2. **Hide reference rows**: prefer `data.attributeFeatures` over `data.features` in the Object template (B3 option 1); verify the proxy getter is reachable in the template scope and preserves order.
3. **Empty/mirage rows**: flow shows optional missing attributes as muted placeholders and hides required-missing; classic shows all attribute slots uniformly via mirage values. Decide the target behavior.
4. **Migration**: a `2.222 -> 2.223` (or bundled) VersionFixer method is mandatory; add an explicit marker constant for Object and Value to `defaultViewTemplate.ts`, then rewrite matching `jsxString`s (+ `css`, `palette`, `css_MUST_RECOMPILE`), and handle the touched-defaults caveat.
5. **Name-validation overlay**: orthogonal to palette parity but visually loud on accented names. Out of scope for color parity; flag separately if "Università dell'Aquila" should not show a red overlay (would require relaxing the regex at `store.tsx:428`).
6. **Prior-doc correction**: `docs/discovery/2026-06-06_canvas_color_schemes.md` Q6 conclusion ("purely static, no runtime CSS-var injection") is **superseded** by `derivePalette.ts` + `useCustomPaletteStyleSheet.ts`. Built-ins remain static SCSS; **custom** palettes are runtime-injected.

---

## Verification log (claims re-checked by hand, not only via sub-agents)

- `derivePalette.ts` full read — variable set, HSL formulas, exports. **[ok]**
- `useCustomPaletteStyleSheet.ts` full read — `<style id="jjodel-custom-palettes">`, selector `.editor-v2.scheme-<id>.theme-<t>`, injected into `document.head`. **[ok]**
- `EditorV2.tsx:738-767` (palette/scheme state + localStorage) and `:3299` (root class) and `:3349-3368` (classicSlot nested inside `.editor-v2`). **[ok]**
- `DV.tsx:1678-1732` — Object/Value/Singleton templates verbatim. **[ok]**
- `LModelElement.tsx:6120-6124` — `get_referenceFeatures`/`get_attributeFeatures` discriminator `instanceof.className === DReference.cname / DAttribute.cname`. **[ok]** (Sub-agent cited path `LModelElement.tsx`; real path is `model/logicWrapper/LModelElement.tsx` — line numbers match.)
- `ObjectNode.tsx` full read — body filters `featureKind === 'attribute'` (`:288,337`); class names. **[ok]**
- `VersionFixer.tsx:80-103` (auto-derived highestVersion) and `:830-908` (last migrations; head = `2.221 -> 2.222`). **[ok]**
- `store.tsx:426-429` — name-validation regex + message (not length). **[ok]**
- `EditorV2.scss` grep — palette variable names (`--object-header-bg`, `--node-header-text`, `--field-name-color`, `--field-type-color`, `--object-accent`, `--border-default`) confirmed present on `.mm-object`. **[ok]**

Not independently re-verified (reported as sub-agent findings, low risk): exact SCSS rule line numbers in `EditorV2.scss` for individual properties; the precise line spans inside `store.tsx` for the three validation views (the predicate/message at `:426-429` was verified directly); `redux/defaults/views.ts` line numbers for Value-view registration.
