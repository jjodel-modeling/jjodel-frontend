# Prompt: metaclass identity across metamodels (homonymous classes in one view)

Prompt-ID: P-2026-09-19-1610
Repo: `~/jjodel` (frontend in `frontend/`, scripts run from there). Branch: the current working branch (`validation-skeleton` unless Alfonso says otherwise).
Effort: xhigh. Read `CLAUDE.md` and `docs/claude-code-log.md` first.

## COSA

Decision by Alfonso (2026-09-19): **two metaclasses declared by different metamodels are different metaclasses, even when they share a name.** A view must be able to list `metamodel_1.State` and `metamodel_2.State` together, or only one of them, and the resolver must honour exactly that choice.

Today this is impossible by construction. `ir.metaclasses` is a list of names and `authoringMetaclassPins` maps one name to one class id, so a view can hold at most one identity per name. The picker in `MatchingSection.metaclassGroups` therefore excludes homonyms by NAME: once `metamodel_1.State` is listed, `metamodel_2.State` disappears from the "Add metaclass…" dropdown (screenshot in chat, 2026-09-19). The picker is coherent with the representation; the representation is what changes.

## Design (settled in chat, do not reopen)

### Representation (additive, no `irVersion` bump, no migration)

```ts
// irTypes.ts
export type AuthoringMetaclassPins = { [metaclassName: string]: string | string[] };
```

A string is the existing single pin and keeps its meaning. An array is the set of class ids pinned under that name. Normalization rule: an array of length 1 is written as the plain string, and an empty array is never written (the key is dropped). An IR written before this change is therefore byte-identical after any edit that does not touch its metaclasses, and an IR with one identity per name is still written exactly as before.

`metaclasses` stays a deduplicated list of names; the resolver index stays keyed by name.

### Resolution

`irResolveCore.pinAccepts(entry, name, classId)`: no pin → accept by name (unchanged); string pin → `pinned === classId` (unchanged); array pin → `pinned.includes(classId)`. Nothing else in the resolver moves: specificity, ordering, inheritance through ancestors are untouched.

### Authoring model: one entry per identity

The list under "Metaclasses" shows one row per identity, not per name. Derive the rows from `metaclasses` plus pins with a pure helper in `MatchingSection.tsx` (exported, tested):

```ts
export interface MetaclassEntry { name: string; id?: string }
export function metaclassEntries(list: string[], pins: AuthoringMetaclassPins | undefined): MetaclassEntry[]
```

For each name in list order: array pin → one entry per id, in array order; string pin → one entry; no pin → one entry without id (legacy view, "any class with that name").

Row label (`metaclassChipLabel`, now taking an entry): `metamodel.Name` when the entry has an id and more than one project metamodel declares that name; bare name otherwise. Unchanged for the single-pin case.

Remove a row: entry with id → drop that id from the pin (array shrinks; length 1 collapses to string; length 0 drops the key AND removes the name from `metaclasses`). Entry without id → remove the name and any pin under it (unchanged behaviour).

Add from the picker (`addMetaclass(classId)`): the class must not already be pinned (by id). If the name is not in the list, append the name and pin the id. If the name is already in the list with a pin, append the id to it (string becomes a two-element array). If the name is in the list WITHOUT a pin, do nothing: an unpinned name already means "every class with that name" and the picker must not silently narrow it (see picker rule below).

Picker (`metaclassGroups(choices, taken)`): `taken` becomes the set of pinned ids plus the set of unpinned listed names. A choice is excluded when its id is pinned, or when its name is listed without a pin. Homonyms of a pinned class stay available. Signature change is fine: the three callers are in this repo (see DOVE).

Features for PathBuilder keep the doctrine "resolved from the first metaclass in the list": `resolveMetaclassId` returns, for an array pin, its first id (still filtered by `declared`). Update the help text in the three panels to "PathBuilder features are resolved from the first metaclass in the list (its first pinned class when several are pinned)."

### `withMetaclassPins` (metaclassPin.ts)

Same contract, extended to arrays: rebuild the map for the new list; for each name, a declared pin on `next` wins over `prev`; a string is validated with `declared`; an array is filtered by `declared`, then normalized (1 → string, 0 → fall through to the chain as if unpinned). `samePins` becomes a structural comparison (string vs string, array vs array, same order). The no-backfill rule is untouched: when `metaclasses` did not change, `next` returns as it came.

Note the removal case: removing one identity of a name that keeps other identities does NOT change `metaclasses`, so `withMetaclassPins` would return `next` unchanged and skip reconciliation. That is correct here, because `removeMetaclass` writes the reconciled pin itself in the same patch. Add a test that proves it.

`irCreationSeed`, `irPrune`, `irKindConvert` need no change (they write a string pin or copy the field as a whole). Verify with a read, do not touch them unless the typecheck says otherwise.

## DOVE

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (type + doc comment of `AuthoringMetaclassPins`: add the array case and the 2026-09-19 decision)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (`pinAccepts`)
- `frontend/src/components/editor-v2/viewpoint/ir/metaclassPin.ts` (`resolveMetaclassId`, `samePins`, `withMetaclassPins`, module comment)
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` (`metaclassGroups`, `metaclassChipLabel`, new `metaclassEntries`, handlers, list rendering with `key` per entry id/name, help text)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` and `RowAuthoringPanel.tsx` (same picker/list/handlers; keep their local handlers aligned with MatchingSection; if the three copies are identical after the change, extracting a shared `useMetaclassListHandlers` is allowed ONLY if it is a pure move with no behaviour change; otherwise leave three copies)
- Tests: `ir/__tests__/` for `pinAccepts` and `withMetaclassPins`; the existing tests of `metaclassGroups` / `metaclassChipLabel` (find them with `ugrep`); one resolver-level test with two synthetic metamodels both declaring `State`, three cases: pinned to both matches instances of both; pinned to one matches only that one; unpinned matches both (legacy).
- `docs/decisions.md`: append the ratification (text below).
- `docs/claude-code-log.md`: entry at the end.

Do not touch: `useJjomSync.ts`, `portDistribution.ts`, `EnableIRPanel.tsx`, `irCreationSeed.ts`, `irPrune.ts`, `irKindConvert.ts`, the `ui` barrel, any SCSS.

## COME

### Fase 1, discovery (read-only, report OBBLIGATORIO)

Read the files in DOVE and every consumer of `authoringMetaclassPins` and `pins?.[` (grep the whole `src`). Confirm: (a) no other reader assumes the pin is a string; (b) where the tests of `metaclassGroups`/`metaclassChipLabel` live; (c) how `metaclassChoices` is built in the three panels (is `metamodelName` unique per metamodel, or can two metamodels share a name, in which case the label needs the metamodel id as tiebreak: report it, do not solve it); (d) whether `Select` renders `SelectOptionGroup` labels for groups with one option (cosmetic, report only).

Write `docs/discovery/discovery_2026-09-19_metaclass_identity_homonyms.md` with: objective, files read (full paths), findings on (a)..(d), risks, open questions. HARD STOP after the report. Reply in chat with `[P-2026-09-19-1610 · session <id>]` and the findings; wait for GO.

### Fase 2, implementation (after GO)

1. `irTypes.ts`, `irResolveCore.ts`, `metaclassPin.ts` with their tests. Run `npm run typecheck` and `npx vitest run src/components/editor-v2/viewpoint/ir` from `frontend/`.
2. `MatchingSection.tsx`, then the two panels, with tests. Typecheck, vitest on `authoring`.
3. Resolver-level test (two metamodels, three cases).
4. `docs/decisions.md` and `docs/claude-code-log.md`.

Commit per step, `git add -- <files>` never `git add .`, conventional messages in English, one line. After step 2 stop for visual verification by Alfonso on `http://localhost:3000`: project with two metamodels each declaring `State`, one vertex view; expected: after adding `metamodel_1.State`, the dropdown still offers `metamodel_2.State`; after adding it the list shows two rows `metamodel_1.State` and `metamodel_2.State`; removing one leaves the other and the dropdown offers the removed one again; the ir shows `authoringMetaclassPins: { State: [id1, id2] }` with both, and `{ State: "id1" }` with one.

Zero refactoring outside the listed functions, no renames of existing identifiers, no new dependencies.

### Ratification text for `docs/decisions.md`

Append under a new series header `## R-MCID` (metaclass identity), or under R-IRN if Alfonso prefers when he gives the GO:

**R-MCID-1** (2026-09-19) — **Due metaclassi dichiarate da metamodelli diversi sono metaclassi diverse anche quando hanno lo stesso nome.** Una view può elencarle entrambe o una sola, e il resolver onora esattamente la scelta. `ir.metaclasses` resta una lista di nomi e l'indice del resolver resta per nome; l'identità sta in `authoringMetaclassPins`, che da oggi ammette per nome un id o un array di id (`string | string[]`, additivo, nessun bump di `irVersion`, array di lunghezza 1 scritto come stringa). Un nome senza pin continua a significare «ogni classe con quel nome» (view autorate prima del pin). Il picker esclude per id, non per nome. Le feature del PathBuilder si risolvono dalla prima metaclasse in lista e, se ha più pin, dal primo. Chiude il difetto del 2026-09-19 (dropdown "Add metaclass…" che nascondeva `metamodel_2.State` dopo l'aggiunta di `metamodel_1.State`).

## RIFERIMENTI

- `irTypes.ts` comment on `AuthoringMetaclassPins` (2026-08-13: pins read at resolution, `pinAccepts`).
- `metaclassPin.ts` module comment: three-step chain pin → appliableToClasses → first by name; no-backfill rule.
- `MatchingSection.tsx` comment on `metaclassGroups` (the exclusion by name being replaced).
- Discovery 2026-07-23 §9 (two metamodels each with its own `State`).
- `CLAUDE.md` §5 (a test is judged by the mutations it kills), §6.4 (Prompt-ID on every message).
