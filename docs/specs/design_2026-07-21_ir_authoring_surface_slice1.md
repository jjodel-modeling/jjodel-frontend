# Design — IR Authoring Surface, Slice 1 (vertex editor + PathBuilder)

**Type**: Fase 1.5 design doc (read-only deliverable). Builds on the Fase 1 authoring
discovery (run in cloud on a clone of `alfonso-frontend-jjtl`, **never committed as a
file** — it existed only in chat). Every anchor below was re-verified against the local
working tree on 2026-07-21; where the discovery was wrong it is corrected here (see §1.9).
This document therefore also serves as the committed record of the verified Fase 1 surface.

**Companion spec**: `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (the IR schema this
editor authors). All `sez. N` references point there.

**Base path**: `frontend/src/`.

---

## 0. Scope

**In scope (slice 1)**: an authoring panel for a *single already-selected vertex view*
(`VertexViewIR`), and the `PathBuilder` control that feeds it. Scalar field editing with
live preview; grammar-constrained path authoring; validate-before-write; inline error
surface.

**Out of scope (deferred slices, seams reserved)**:
- Edge view (`EdgeViewIR`) and `graphVertex`/containment authoring.
- `Conditional<T>` authoring (the `when`/`rules` wrapper) — requires a Predicate builder,
  a strictly larger surface. Slice 1 edits **scalar** values and **round-trip-preserves**
  any existing conditionals untouched (§5, §9-Q3).
- Multi-hop path authoring in the PathBuilder (single-hop this slice; §4).
- Theming / token layer for IR views (`irStyle.ts` — hardcoded slate/cyan today) — this is
  the explicitly-next slice per the discovery.
- M2 (metamodel) view authoring.
- Creating a brand-new IR view from nothing (seed flow) — slice 1 assumes a selected view
  already carrying an `ir` (or seeds it from `defaultObjectViewIR()` on first edit; §9-Q6).

**Critical-zone status**: NONE of the §3.1 files (`useJjomSync`, `canvasToJjom`,
`portDistribution`, `syncState`, `VersionFixer`, `DV.tsx`, `defaultViewTemplate`) are
touched by this slice. `ir` is already a persisted `DViewElement` field, so **no
VersionFixer migration** is owed (§3.9 obligation does not fire — we change no default-view
source). See §8.

---

## 1. Verified current surface (Fase 1 findings, re-anchored to local tree)

| Seam | Anchor (verified) | Fact |
|------|-------------------|------|
| **Write path** | `view/viewElement/view.tsx:483-484` | `get_ir(c){ return c.data.ir }`; `set_ir(val,c){ return SetFieldAction.new(c.data,'ir',val,'',false) }`. Canonical write = `lview.ir = <VertexViewIR>` — **whole-object replace**, same shape as attribute writes. Zero UI consumers today (only raw D-writes: `irDemoFixture.ts`, `VersionFixer.tsx` migration, AI probe). |
| **Preview invalidation** | `irResolveCore.ts:40-66` | `computeIRSignature` tags each view's `ir` with a WeakMap identity token (`refToken`, `:42-46`). A `SetFieldAction` on `'ir'` **replaces the reference** → new token → new signature → `getIRIndex` rebuilds → `compileView` recompiles → `useIRView` re-resolves → canvas re-renders. **Hard constraint: replace, never mutate in place.** `d.ir.shape.fill = x` keeps the ref → token unchanged → **no** invalidation. |
| **Malformed-IR safety** | `irResolveCore.ts:122-129` (also edge `:93-98`) | `compileView` wrapped in try/catch → `console.warn` → `continue`. A malformed view is **silently skipped per-view**; the canvas never crashes. Failure is invisible to the user — the authoring surface must therefore validate *before* writing. |
| **Structural validator** | `irCompile.ts:251 compileView` | Throws via `parsePathExpr` (`:41`) on bad paths. Grammar: `FORBIDDEN_PATH = /\?\.|\?\?|[?:()]/` (`:31`), `STEP_RE = /^(\$feature\|value\|values(\[\d+\])?)$/` (`:33`). Cached by `(viewId, irHash)` (`:249-253`) — validating a candidate pre-warms the cache, so the later real compile is a hit (zero double cost). Validates **structure only**, not feature existence. |
| **Schema** | `irTypes.ts` | `VertexViewIR` (`:92-103`): `irVersion, kind, metaclasses, predicate?, priority?, exclusive?, label?, shape, fieldCompartments?`. `ShapeSpec` (`:84`): `form, fill?, border?, labels?, badges?`. `PathExpr = string` (`:17`). Widget union `{'text'\|'textarea'\|'select'\|'checkbox'\|'color'}` already typed (`:60`, `:73`) but nothing renders it. **No `kind:'raw'` free-text hole.** |
| **Metaclass metadata** | `hooks/useEditorMode.ts:43-71`, `resolveM1Info:211` | `MetaclassInfo{ id, name, isAbstract, attributes[], references[], concreteSubclasses[] }`. `resolveM1Info(modelId, knownMetamodelId?)` is a **pure function over `store.getState()` + LProxy**, **module-private** (only the `useEditorMode` hook is exported). |
| **Selection** | `components/editors/Info.tsx:1401-1405`, `:1185` | Selected view resolved from `state._lastSelected.view` → `LViewElement.fromPointer(viewID)`, surfaced to the panel body as `props.view` (`:1185 const selectedView = props.view`). A dedicated panel can key on the identical selection without touching Info's 1400-line reflective body. |
| **Seed IR** | `ir/irDefaults.ts:25-48 defaultObjectViewIR()` | A complete `VertexViewIR`: wildcard `metaclasses:'*'`, one intrinsic `qualifiedName` top label, one `attributes` compartment (`name = value`). The natural template for a new view (swap `'*'` → `['ClassName']`). |
| **UI primitives** | `components/ui/index.ts` | Barrel with `Button, Input, Select, JjSelect, Textarea, Toggle, Label, HelpText, ErrorText, Field, NumberInput, FormSection, EmptyState`. Pattern: `export { X } from './X'; export type { XProps } from './X'`. **Missing: `Checkbox`, `ColorPicker`, `PathBuilder`** (not even in the commented placeholder list). |

### 1.9 Correction to the Fase 1 discovery

The discovery listed the inheritance asymmetry as "attributes own-only, references folded"
and implied the fix mirrors references. **`allAttributes` does not exist** — a grep over
`joiner/` and `view/` returns nothing. References fold inheritance because the LClass proxy
exposes `allReferences` (`useEditorMode.ts:358` `cls.allReferences ?? cls.references`), but
there is **no `allAttributes` counterpart** (`:344` reads `cls.attributes ?? []` only).
Consequence: the "flatten inherited attributes" enabling fix is **not** a one-token swap —
it must union own-attributes up the `extends` chain. `resolveM1Info` already builds the
`extendsMap` (`:335`, reversed to `childrenMap` at `:399`), so the fix reuses that graph.
See §6-F2.

---

## 2. Decisions to ratify (present each with recommendation + rationale)

These are the "ratify before code" calls. Recommended option first.

| # | Decision | Recommendation | Why | Rejected alternative |
|---|----------|----------------|-----|----------------------|
| **D1** | Panel host | **Dedicated panel**, keyed on `_lastSelected.view` | `Info.tsx` is a 1400-line reflective component (§2 preservation risk); the selection is already available identically. A dedicated component isolates the greenfield surface. | Surgery inside `Info.tsx` — high blast radius, couples authoring to the reflective field renderer. |
| **D2** | MetaclassInfo access | **Add `allAttributes` field** to `MetaclassInfo` + **export a non-hook accessor** | Additive: `attributes` (own) stays byte-identical for every existing consumer of `useEditorMode`; PathBuilder reads the new `allAttributes`. Lowest blast radius. | Mutating `attributes` to fold inheritance — silently changes semantics for the M1 object-creation forms and canvas palette (a §20 cross-layer propagation). |
| **D3** | Write-back granularity | **Whole-object immutable replace per commit** (`lview.ir = clone+patch`) | The only shape the invalidation model accepts (§1, `refToken`). In-place mutation renders no preview. | Field-level D-writes (`SetFieldAction` on `ir.shape.fill`) — does not exist as a path and would not flip the token. |
| **D4** | Validation strategy | **Three tiers**: (a) PathBuilder prevents *semantic* errors by construction; (b) `validateIR` = `compileView`-in-try/catch as *structural* gate before every write; (c) inline `ErrorText`, and **the write is suppressed on failure** | A persisted malformed `ir` is silently skipped by the canvas (`irResolveCore.ts:127`) — invisible breakage. Gating the write is the only way to keep that from happening. | Write-then-observe (let the canvas skip it) — the user sees the node vanish with no explanation. |
| **D5** | Draft cadence | **Local React draft + debounced validated commit** (live preview) | Every commit flips `refToken` → full index rebuild + recompile. A redux write per keystroke would thrash the index. A short debounce (≈250–400 ms) keeps preview live without per-keystroke rebuilds. | Redux write per keystroke (index thrash); or explicit "Apply" button (kills the live-preview value prop). |
| **D6** | PathBuilder reach (slice 1) | **Single-hop** over own+inherited features of the view's metaclass(es); reserve the multi-hop seam | Single-hop `$feature.value` covers every field in `defaultObjectViewIR` and is fully reactive today. Multi-hop authoring pairs with the (just-landed) cross-object reactivity but is a distinct UX. | Ship multi-hop now — larger control, and the cross-object render fix only landed today (`navigateRefHop`); let it settle. |

---

## 3. The write-back contract (`lview.ir`)

The canonical edit cycle for any field:

```
1. READ      draft ← structuredClone(lview.ir ?? defaultObjectViewIR-for(metaclass))
2. EDIT      mutate the DRAFT only (local React state) — never lview.ir in place
3. VALIDATE  const r = validateIR(view.id, draft)        // compileView-in-try/catch
4a. on ok    lview.ir = draft        // set_ir → SetFieldAction, whole-object replace
             → refToken flips → getIRIndex rebuild → compileView (cache hit) → re-render
4b. on error render <ErrorText>{r.error}</ErrorText>; DO NOT write lview.ir
```

- **Immutability is load-bearing** (§1 `refToken`). The draft must be a deep clone; commit
  assigns the whole new object. Reuse of any sub-object reference from the previous `ir` is
  fine (only the *top-level* `ir` ref must change), but a full clone is the safe default.
- **Cache pre-warm**: `validateIR` calls `compileView(viewId, draft)`, which caches by
  `(viewId, irHash(draft))`. The subsequent render-time compile with the same object hashes
  identically → cache hit. No wasted compile.
- **Undo/redo**: `set_ir` is a `SetFieldAction` → participates in the redux undo stack
  natively. One field edit = one whole-`ir` replace = **one undo step**. Confirm this
  granularity is acceptable (it means undo reverts the whole last commit, not a sub-field).
- **Persistence**: `ir` is a `DViewElement` D-layer field already round-tripped through
  redux persistence. Authored IR survives save/reopen with no new migration.

---

## 4. PathBuilder — the spine

`PathExpr` appears in ~7 places across the schema; PathBuilder is the single control that
emits it, so it is built once and reused everywhere:

| Consumer | Field | irTypes ref |
|----------|-------|-------------|
| Label (path source) | `LabelSpec.source = {from:'path', expr}` | `:51` |
| Compartment value | `FieldSegment{kind:'value'}` reads the compartment `source` feature | `:73` |
| Predicate operands | `eq/neq/lt/... {left,right: PathExpr\|Literal}`, `exists`, `empty`, `isKind.path?` | `:27-30` |
| Badge visibility | `BadgeSpec.visible: Conditional<boolean>` (predicate operands) | `:66` |
| Edge endpoints | `EdgeViewIR.edge.source/target` (object-as-edge) | `:165-166` |
| Containment filter | `GraphVertexViewIR.containment.childFilter` (predicate) | `:124` |

**Contract**
- **Input**: `MetaclassInfo` for the view's target metaclass(es) — `allAttributes` (own +
  inherited, after §6-F2) and `references` (already folded).
- **Output**: a grammar-valid `PathExpr` string. The grammar (from `irCompile.ts`):
  `$feature` then optional `.value` | `.values` | `.values[N]`, dot-chained across hops.
- **UX (slice 1, single-hop)**:
  1. Select a feature from a dropdown fed by `MetaclassInfo` (attributes and references,
     labelled with type/target). No free typing.
  2. Select the `take`: `value` (default) | `values` | `values[N]` (N via `NumberInput`,
     enabled only for `upperBound !== 1`).
  3. Emit `"$" + feature + (take==='value' ? '.value' : take==='values' ? '.values' : '.values['+N+']')`.
  4. Show the emitted `PathExpr` as read-only text for transparency.
- **Multi-hop seam (deferred)**: when the selected feature is a reference, a "+ navigate"
  affordance would append `.value` and recurse into the target metaclass's `MetaclassInfo`.
  Reserve the recursion point; do not build it in slice 1.
- **Why no free text**: the grammar is closed (no `raw` kind). An emitter fed by
  `MetaclassInfo` can only produce paths whose `$feature` exists on the metaclass → the
  *semantic* validation tier (§2-D4a) is satisfied by construction. `parsePathExpr` still
  runs inside `validateIR` as defense-in-depth for the *structural* tier.

---

## 5. Panel composition — VertexViewIR field → control map

| IR field | Control | Slice-1 treatment |
|----------|---------|-------------------|
| `metaclasses` | `Select` (from `allClasses` names) or `'*'` | Read/display; editing the target metaclass may be fixed for slice 1 (a view is authored *for* its metaclass). |
| `label` (view display name) | `Input` | Scalar. |
| `shape.form` | `Select` rect/rounded/ellipse | **Scalar only**; if the existing value is a `Conditional`, show read-only "conditional (edit in next slice)" and preserve it. |
| `shape.fill` | `ColorPicker` (new) | Scalar; preserve conditional if present. |
| `shape.border` | `{ color: ColorPicker, width: NumberInput, style: Select(solid/dashed/dotted) }` | Scalar (border is not a `Conditional` in the schema). |
| `shape.labels[]` | list editor; per label: `position` (`Select`), `source` (`TextSource` editor: intrinsic-`prop` `Select` \| literal `Input` \| path→**PathBuilder**), `editable?` (`Checkbox` + widget `Select`) | `visible?` conditional preserved, not edited. |
| `fieldCompartments[]` | list editor; per compartment: `source` (`Select` attributes/references), `rowFormat.segments[]` (segment editor: name/type/value/literal), `separator` (`Toggle`) | `visible?` conditional preserved, not edited. |

**Round-trip safety rule**: any `Conditional<T>` (`{when,then,else}` / `{rules,default}`)
present in the read `ir` that slice 1 does not edit must be written back **unchanged** in
the committed draft. The panel reads the whole `ir`, edits the scalar leaves, and clones the
rest verbatim. This guarantees that opening a view authored by a future (conditional-capable)
slice and re-saving it in slice 1 does not destroy conditionals.

---

## 6. Enabling fixes (net-new, additive, non-critical-zone)

| # | Fix | Location | Size / note |
|---|-----|----------|-------------|
| **F1** | Export a non-hook metaclass accessor | `hooks/useEditorMode.ts` | Add `export function getMetaclassInfo(modelId, metamodelId?): EditorModeInfo` delegating to `resolveM1Info` (or `export` `resolveM1Info` directly). Pure, no React. Additive. |
| **F2** | Inherited-attribute union | `hooks/useEditorMode.ts:resolveM1Info` | Add a **new** `allAttributes: MetaclassAttribute[]` field to `MetaclassInfo` (do **not** touch `attributes`). Compute by walking the `extends` chain (reuse the `extendsMap` at `:335`) and unioning own attributes, child-overriding-parent by name. ~15–25 lines. Additive to the interface (§Non-Negotiable-11: adding optional/new properties is OK). |
| **F3** | `Checkbox` primitive | `components/ui/Checkbox/` (+ barrel) | New, token-based (§7 design system). |
| **F4** | `ColorPicker` primitive | `components/ui/ColorPicker/` (+ barrel) | New, token-based. Slate/cyan discipline (§7): never cyan as a fill default. |
| **F5** | `PathBuilder` control | `components/ui/PathBuilder/` (+ barrel) | The spine (§4). Consumes `MetaclassInfo`, emits `PathExpr`. |
| **F6** | `validateIR` wrapper | `editor-v2/viewpoint/ir/irValidate.ts` (new) | `(viewId, ir) → { ok:true } \| { ok:false, error }` via `compileView`-in-try/catch. Colocated with `compileView`. Small. |
| **F7** | Inline error surface | (reuse `ErrorText`) | No new primitive. |

**F2 propagation flag (§20)**: `MetaclassInfo` is consumed by the canvas M1 palette /
object-creation flows via `useEditorMode`. Adding `allAttributes` (rather than changing
`attributes`) keeps every existing consumer byte-identical — this is the whole reason for
the additive choice in D2. If, during implementation, a shared change to `attributes` is
found necessary, **stop and report** (it crosses into canvas territory not named here).

---

## 7. Data flow (end to end)

```
_lastSelected.view (SetRootFieldAction)
   └─> panel resolves LViewElement.fromPointer(viewID)          [Info.tsx:1405 pattern]
        └─> draft ← clone(lview.ir ?? seed)                     [§3 step 1]
             └─> user edits via controls (PathBuilder / ColorPicker / Select / ...)
                  └─> debounced (D5): validateIR(view.id, draft) [F6 → compileView try/catch]
                       ├─ ok  → lview.ir = draft                 [set_ir → SetFieldAction, replace]
                       │         └─> refToken flips              [irResolveCore.ts:42]
                       │              └─> getIRIndex rebuild → compileView (cache hit)
                       │                   └─> useIRView re-resolve → canvas live re-render
                       └─ err → <ErrorText/>, no write           [§2-D4b]
```

---

## 8. Files the eventual slice-1 implementation will touch (preview)

- **NEW** `components/ui/Checkbox/`, `components/ui/ColorPicker/`, `components/ui/PathBuilder/`
  (+ three lines in `components/ui/index.ts`).
- **NEW** the authoring panel component — proposed home
  `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (UI-placement is
  §9-Q5, open).
- **NEW** `components/editor-v2/viewpoint/ir/irValidate.ts`.
- **MODIFY (additive only)** `hooks/useEditorMode.ts` — F1 export + F2 `allAttributes`. This
  is the *only* touch to existing code, and it is purely additive.
- **NONE** in the §3.1 critical zone. **No** VersionFixer migration (§3.9 does not fire —
  no default-view source changes; `ir` already persisted).

This slice is comfortably under the 5-file §19 threshold *of existing files* (one existing
file modified: `useEditorMode.ts`; the rest are new). Confirm before implementation.

---

## 9. Open questions for Alfonso to rule on

| # | Question | Recommendation |
|---|----------|----------------|
| **Q1** | Panel host: dedicated vs inside `Info.tsx`? | Dedicated (D1). |
| **Q2** | MetaclassInfo: add `allAttributes` field vs mutate `attributes`? | Add `allAttributes` (D2/F2). |
| **Q3** | `Conditional<T>` editing this slice? | No — scalar only, preserve existing conditionals verbatim (§5). |
| **Q4** | Commit cadence: debounced auto-commit vs explicit Apply? | Debounced validated commit (D5) — live preview is the value prop. |
| **Q5** | **Where does the panel surface in the UI?** A tab in the Properties/Info region? A new dock panel? An inspector section shown when a view is selected? | *Genuinely open* — needs a UI-placement call. Least-surprising: a section/tab in the existing Properties region that appears when `_lastSelected.view` is set. |
| **Q6** | Does slice 1 include a "create IR view from scratch" entry point, or assume a selected view already carries `ir`? | Assume selected; seed from `defaultObjectViewIR()` on first edit if `ir` is absent. A standalone "create IR view" action is a separate small flow. |

---

## 10. Acceptance criteria for the eventual slice-1 implementation (§5.1 discipline)

Mechanically checkable, to be validated end-to-end (not by reading code):

1. Select a vertex view with an existing `ir` → the panel populates every scalar field from
   `lview.ir` (form, fill, border, label sources, compartment segments).
2. Change `shape.form` rect → ellipse → the canvas node re-renders as an ellipse within one
   tick, **no reload** (proves the `refToken` replace path).
3. Build a label path `$name.value` via PathBuilder **without typing** → the label renders
   the attribute value; editing that attribute updates the label (existing self reactivity).
4. Drive the panel into a state that would yield malformed IR → it is either impossible by
   construction (PathBuilder) or blocked by `validateIR` with an inline `ErrorText`, and
   `lview.ir` is **not** written (verify via `windoww.store.getState().idlookup[viewId].ir`
   unchanged).
5. Reopen the project → the authored IR persists and renders identically (proves D-layer
   persistence with no migration).
6. A view carrying a `Conditional` in a field slice 1 does not edit, when re-saved through
   the panel, retains that conditional byte-identically (round-trip safety, §5).

---

## 11. Summary

The authoring surface is **greenfield with a clean seam**: the write path
(`lview.ir = <obj>`, immutable replace) exists and is consumer-free; live preview is free on
that write; the schema is a closed grammar with no free-text hole; malformed IR is
self-quarantining but silent, which mandates validate-before-write. The **PathBuilder is the
spine** (7 reuse sites) and, by being fed from `MetaclassInfo`, discharges the semantic
validation tier by construction. The enabling fixes are small, additive, and outside the
critical zone. The one correction to Fase 1: `allAttributes` does not exist, so inherited
attributes must be unioned manually (reusing `resolveM1Info`'s `extendsMap`), and the fix is
best done as a **new** field to keep every existing `useEditorMode` consumer intact.
