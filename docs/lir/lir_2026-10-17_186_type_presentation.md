# Layer Impact Report: the optional `typePresentation` field on `DProfile` (#186 «Customize element»)

- Prompt-ID: `P-2026-10-17-1053` (chat `C-2026-10-14-1020`), decision R-CFG-3, step A of the lane
- Tree: `/Users/juridirocco/development/jjodel-186c`, branch `feat/186-customize-element`, HEAD `492546b1c` (the pure
  helpers and their types, `joiner/environmentConfig.ts`) at the start of this step
- Go-ahead: R-CFG-3, ratified by Juri on 2026-10-14 («the per-role presentation is an optional field of `DProfile`
  [...] Touches `joiner/classes.ts` (D-layer): Layer Impact Report before the diff»). Confirmed in the step-A GO of
  2026-10-20: `classes.ts` takes «the optional field on `DProfile` / `LProfile` and a type-only import, nothing else».
  `joiner/classes.ts` is not a row of CLAUDE.md §3.1. The report is owed by rule 20 and by the prompt.
- Evidence: `docs/discovery/discovery_2026-10-17_186_customize_element.md` §4.1 (arms P0-P8, measured on
  `2c1e694e4`) and §5.1 (the draft of this report)

Committed before the edit of `classes.ts`.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/joiner/classes.ts` | `typePresentation?: Dictionary<Pointer<DClass>, TypePresentation>;` on `DProfile`, the same type on `LProfile`, and `import type {TypePresentation} from "./environmentConfig";` |

Nothing else in `classes.ts`: not the `Constructors.DProfile` step (`classes.ts:1341-1346`), not `typePermissions`, not
`DEnvironmentConfig`, not `DProfile.new`. No other file of `joiner/`: the barrel `joiner/index.ts` names its exports
one by one and does not gain the new ones; consumers import them from `joiner/environmentConfig`, as
`ConfiguratorTab.tsx:32` already does. No migration, no reducer, no core file.

## 2. The rule

- `DProfile.typePresentation` is optional and **has no initialiser**. A profile created by `DProfile.new` has no such
  key (measured P0: the raw keys of a fresh profile do not include it). The key appears with the first «Done» of the
  «Customize element» popup (step C), written by one `SetFieldAction.new(profileId, 'typePresentation', next, '',
  false)` with the whole dictionary (`nextTypePresentations`).
- Absent reads as empty: `typePresentationOf(profile, classId)` returns null on a profile without the key, a key that
  is not an object, or no entry for the class. It never throws (tested, M6 and M36 of the bench of `492546b1c`).
- `tsconfig.json` has `target: ES2020`, so a field without an initialiser emits no own property: the class's runtime
  shape is unchanged, as for `DProject.activeLayout?: string;` (`classes.ts:3097`). The import is `import type`,
  erased under `isolatedModules`. The production bundle is compared before and after the edit (§4).

## 3. Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data): one optional field declared on DProfile
  [x] L-layer (computed proxies): the same field typed on LProfile
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

D-layer
  - What changes: the declaration of an optional key `typePresentation` on `DProfile`, keyed by
    metaclass pointer, a `TypePresentation` per key. In this step, the type only: no code writes it
    yet. Step C writes it at «Done» of the popup, with one SetFieldAction on the profile.
  - What does NOT change: the constructor step `Constructors.DProfile` (no initialiser added),
    `typePermissions`, `name`, `father`, `DEnvironmentConfig` and its `profiles`, every model element.
    A project saved before this lane loads with profiles without the key and reads as empty.
  - Cross-layer interaction: the reducer takes an object value's keys and values as pointer
    candidates (`redux/reducer/reducer.ts:399` `else newpointerdestinations =
    U.ArrayMerge(Object.keys(newVal), Object.values(newVal));`, then `PointedBy.add` / `remove` on the
    difference, `:408-410`). A write of `typePresentation` therefore adds a `pointedBy` entry on each
    class named as a key (measured P4: Scenario 0 -> 1) and removes the entries of the keys a later
    write drops. `typePermissions` is keyed by the same class pointers and does the same today. The
    scan is shallow: the nested `fields` objects are not taken as pointers.
  - Side-effect safety: a SetFieldAction on a DProfile, outside the model graph: no creator, no
    TRANSACTION, no sync path (rule 12 does not apply). One undo entry per write (measured P2), as a
    `typePermissions` write. A replace, not a merge (measured P5): the writer always sends the whole
    dictionary (`nextTypePresentations`).

L-layer
  - What changes: `LProfile.typePresentation` is typed.
  - What does NOT change: the proxy's behaviour. It already returns the raw object for this key, as for
    `typePermissions` (measured P3: typeof object, JSON equal to the raw, `__raw` equal).
  - Cross-layer interaction: none. No getter or setter is added.

JjOM, canvas (v2-flow and classic), sync layer: untouched. A profile is not a model element, has no
vertex, and no hook of the sync layer reads it.

Persistence
  - The key is saved and reloaded as it is written (measured P7: equal after save and reload; P8:
    equal on the stand-alone load with `?profile=`). Absent reads as empty, so no VersionFixer step
    (R-CFG-3: «no migration»).

Smoke-test scenarios potentially affected:
  - open a project saved before this lane: roles, Endpoints window, stand-alone link as before
    (no key on any profile);
  - after step C: «Done» in the popup, save, reload: the key equal; the other role without it;
  - Ctrl+Z after «Done» with undo recording on: the previous dictionary back (one entry).
```

## 4. Verification of this step

- Gates on the tree after the edit, in the foreground, each read on its complete output: `npm run typecheck`
  (exit 0, RC-48), `npm run test` (the nine files red at import of CLAUDE.md §17, nothing else), `npm run build`
  (exit 0), `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`.
- The production bundle (`frontend/dist`, every file hashed) after `492546b1c` and after the edit: equal. Any
  difference is reported, not explained away.
- Runtime: nothing reads or writes the key in this step. Its write, persistence, proxy read, undo and `pointedBy`
  were measured on the untouched code (report §4.1). The panel that reads it and the popup that writes it are
  steps B and C, with their own probe.

## Addendum 2026-10-21: two claims of §2 and §4 corrected by measure (after `f2867dc3d`)

- **§2, third bullet, is wrong.** It reasoned from `tsconfig.json`'s `target: ES2020` that a field without an
  initialiser emits no own property. The production and dev pipeline is not tsc's: `@vitejs/plugin-react` runs
  `@babel/plugin-transform-class-properties` (`loose: true`) on the TypeScript source (`vite.config.ts:35-40`), and
  the built `DProfile` and `LProfile` constructors read `…,this.typePermissions={},this.typePresentation=void 0}` and
  `…,this.typePermissions=void 0,this.typePresentation=void 0}`. That is the form every declared field of the D and L
  classes already takes (`this.father=void 0`, `E.activeLayout=void 0` on `DProject`). The precedent cited there,
  `DProject.activeLayout?`, behaves the same way.
- **What changes at runtime** (probe `_tmp_186c_probe.ts` rerun on the edited tree, port 3188, 0 failures, no page
  error): a profile created after this change holds the key `typePresentation` with the value `undefined` (arm P0,
  raw keys: `…, typePermissions, typePresentation, zoom`); before it, the key was absent. The value reads as absent
  (`typePresentationOf` → null, tested), and JSON drops it at save: after a reload a profile never written has no key,
  as before. The write, the undo entry, the replace, the proxy read (P3), `pointedBy` (P4: 0 → 1), save, reload and
  the stand-alone load (P7, P8) measure as on `2c1e694e4`. No reader of the D-layer distinguishes an `undefined` key
  from an absent one for this field: nothing reads it yet, and step B reads it through `typePresentationOf`.
- **§4, second bullet, is wrong too.** `frontend/dist` after `f2867dc3d` differs from the build of `492546b1c` by 71
  diff lines (35 files, the chunk holding the two constructors and the chunks whose names follow its hash). A rebuild
  of the same tree is identical (0 lines), so the build is deterministic and the difference is this edit's.
- **The «D-layer» row of §3** stands, with one more line under «What changes»: a profile created in the session holds
  `typePresentation: undefined` until it is written.
