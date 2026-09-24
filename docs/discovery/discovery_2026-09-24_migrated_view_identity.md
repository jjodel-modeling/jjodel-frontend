# Discovery — identity of the migrated default object view (Phase 1)

Prompt-ID: P-2026-09-24-1455 · prompt `docs/prompts/claude_2026-09-24_1455_prompt_migrated_view_identity.md`
Session: 2c375611-3fb5-4351-aa6a-c70a4371fe4d (read from the harness scratchpad path)
Tree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, HEAD `6c4aee51d` for the whole phase. `~/jjodel`
and `~/jjodel-sim` not touched: the session was opened in `~/jjodel-sim`, every read and the commit
ran on `~/jjodel-release` by absolute path and `git -C`, nothing was written in the `~/jjodel-sim` tree.
Executor: Anthropic Claude Opus 5.5 (as the session banner shows it).

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream
re-reads the real files. "Measured" means a run in this phase on HEAD `6c4aee51d`; "read" means read
from a file or a doc.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The only product path that produces a delegated default object view is the VersionFixer 2.225→2.226 migration. | **Holds** (measured + read, §1, §2). `IR_DEFAULT_OBJECT_VIEW_ID` also delegates, but no product code creates a view with that id. |
| H2 | The frozen list plus the live factory recognizes every factory shape a migrated view can have persisted. | **Falsified** (measured, §2): the factory of `400095370` alone (S1, 11 minutes on the trunk) is recognized by neither. |
| H3 | A birth hash stamped at migration keeps an untouched view delegating across any future factory change and needs no hook on the edit paths. | **Holds** on a scratchpad prototype against the real `irHash`, `validateIR`, `convertIRKind` (measured, §4.1). |
| H4 | The stamp can live next to `ir` (a sibling field, like `irStash`, D6). | **Falsified** (read, §4.2): `updateDefaultView` replaces the view wholesale and carries `ir` only, on the same load that runs the migration. The stamp has to live inside `ir`, like `migratedFrom`. |
| H5 | Unstamped views can keep "today's recognition (live shape plus the frozen list)". | **Partly** (measured, §4.1 check 6): they can keep the frozen list, but the live shape must be frozen as a literal and the live call removed. Left live, the first factory change after Phase 2 breaks every unstamped view persisted with today's shape, the R-IRN-33 regression again. |

## Objective

Map every creation and write path of a default object view `ir` (item 1), measure which default
views delegate today (item 2), test the chat's birth-hash lean against that map (item 3), compare
two alternatives (item 4), and prepare the Phase 2 diff and tests (items 6-8), leaving the decisions
to Alfonso (item 5).

## Files read (full paths)

Under `/Users/alfonso/jjodel-release/frontend/src/`:
- `components/editor-v2/viewpoint/ir/irDefaults.ts` (whole, 250 lines)
- `components/editor-v2/viewpoint/ir/irCompile.ts` (imports, `irHash` 319-324, `compileView` 328-340)
- `components/editor-v2/viewpoint/ir/irKindConvert.ts` (whole, 130 lines)
- `components/editor-v2/viewpoint/ir/irCreationSeed.ts` (whole)
- `components/editor-v2/viewpoint/ir/irResolveCore.ts` (215-245, the compile site)
- `components/editor-v2/viewpoint/ir/irTypes.ts` (440-470, `VertexViewIR` head)
- `components/editor-v2/viewpoint/ir/irPrune.ts` (45-58), `widgetRenderer.ts` (130-150)
- `components/editor-v2/viewpoint/ir/irDemoFixture.ts` (100-140)
- `components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (1300-1485, the delegation tests)
- `components/editor-v2/nodes/ObjectNode.tsx` (80-140, 750-800, grep of `irDelegated`/`irResolution`)
- `components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (40-115)
- `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (136-250)
- `components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (370-400)
- `components/editor-v2/viewpoint/authoring/irTabs.tsx` (160-185, grep of Source)
- `components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` (160-182, 325-342)
- `view/viewElement/view.tsx` (280-300, 430-520, 640-670, 1880-1925, 1970-2010)
- `utils/lastViewpoint.ts` (213-255, 385-420)
- `redux/VersionFixer.tsx` (120-160, 980-1056; read-only)
- `redux/reducer/reducer.ts` (98-108, 1095-1115)
- `common/Defaults.ts` (80-100), `common/U.tsx` (427-441), `components/topbar/SaveManager.ts` (44-57)
- `components/collaborative/Collaborative.ts` (74-88), `redux/action/action.ts` (583-586)

In `/Users/alfonso/jjodel-release/docs/`: `decisions.md` R-IRN-1..6, R-IRN-15, R-IRN-29..35, R-STR-6,
R-STR-7; `discovery/discovery_2026-09-22_ir_default_fill.md` (whole); `log-inbox/default-view-parity.md`
(whole); `PROTOCOL.md` (whole); `claude-code-log.md` (head, last entries);
`discovery/discovery_2026-08-04_legacy_viewpoint_census.md` (grep for the corpus).

Sweep delegated to one read-only sub-agent (paths 1a-6 of the table in §1: duplicate, save/load,
viewpoint export, `.ecore`, collaborative, wholesale replacement). Its load-bearing claims were
re-read here: `reducer.ts:104`, `view.tsx:1882-1925`, `U.tsx:427-441`, `SaveManager.ts:44-57`,
`Collaborative.ts:74-88`, `action.ts:585`.

## §1 Map of creation and write paths (item 1)

Delegation rule today, `irDefaults.ts:228-250` (read):

```ts
if (compiled.viewId === IR_DEFAULT_OBJECT_VIEW_ID) return true;
...
if (ir.migratedFrom === 'classic-default') {
    ...
    delegated = factoryHashes.has(irHash(canonicalize(structural) as VertexViewIR));
```

So a view delegates only if its `ir` carries `migratedFrom: 'classic-default'` and its structure
(minus `migratedFrom` and `authoringMetaclassPins`) hashes to one of three shapes, or if its id is
`Pointer_IRDefaultObjectView`. Consumer: `ObjectNode.tsx:118`, `const irDelegated = irResolution !== null && isMigratedDefaultView(irResolution.compiled);`
and `ObjectNode.tsx:891`, `if (irResolution && !irDelegated) {` (the IR branch).

### 1.1 Creators (a view gets an `ir` it did not have)

| Path | file:line | What is written | Delegated today | Intended |
|---|---|---|---|---|
| Migration 2.225→2.226 (classic object/singleton marker) | `redux/VersionFixer.tsx:1039` | `e.ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' };` — the LIVE factory at load time, by direct assignment on the D-object | yes, while the persisted shape is recognized (§2) | yes (spec v1.2 §11) |
| New view for a class (`newDefault`, A1) | `view/viewElement/view.tsx:512` via `computeCreationSeed` (`irCreationSeed.ts:112-118`) | `{ ...defaultObjectViewIR(), metaclasses: [name], authoringMetaclassPins, label }` | no (measured, §2) | yes: R-IRN-1, "`ir` significa notazione autorata" |
| Blank view from the «+» (`createBlankViewInViewpoint`, A3) | `utils/lastViewpoint.ts:236`, `:246` | `computeCreationSeed({ kind: 'vertex', label: candidate })`: wildcard `'*'`, label `New view` | no (measured) | yes (R-IRN-4) |
| View from the workbench (`createViewInWorkbench`, A2) | `utils/lastViewpoint.ts:311`/`:327`/`:357`, write `:414` | same seed as A1 | no | yes |
| Enable IR gate | `authoring/EnableIRPanel.tsx:89-92`, write `:107` | `{ ...defaultObjectViewIR(), metaclasses: names or '*', label: view.name }`; comment `:53`: "No `migratedFrom`: the view is authored custom, not migrated" | no (measured) | yes: help text `:113`, "switches to the IR interpreter right away"; the fill lane's check 4 verified it |
| Kind conversion to vertex, empty slot | `ir/irKindConvert.ts:66` | `defaultObjectViewIR()` with the current shared fields overlaid (`:121`) | no (no marker) | yes |
| Authoring panel fallback seed | `authoring/VertexAuthoringPanel.tsx:146` | `clone((view as any).ir ?? defaultObjectViewIR())` — only when a vertex panel opens on a view with no `ir` | no | yes |
| Data-manager per-class view | `editors/viewpoint/properties/DataManagerViewpointPanel.tsx:161-178` | own literal (`shape: { form: 'rect' }`), not the factory | no | outside this family |
| Demo fixture | `ir/irDemoFixture.ts:134`, `:140` | own literals | no | dev only |
| Built-in id `Pointer_IRDefaultObjectView` | `ir/irDefaults.ts:23`, `:229` | never created in product | would delegate | see F5 |

### 1.2 Editors (an existing `ir` is replaced)

Every one of them writes a whole new `ir` object through the L proxy (`set_ir`, `view.tsx:646-658`)
built by spreading or cloning the current one, so every top-level key they do not touch —
`migratedFrom`, and a stamp if one existed — is carried over (read):

| Path | file:line | How |
|---|---|---|
| Vertex authoring commit and unmount flush | `authoring/VertexAuthoringPanel.tsx:215`, `:244` | whole cloned draft (`:146`, `clone(...)`) |
| Symbol preset | `authoring/SymbolEditorModal.tsx:385-390` | `{ ...current, shape: applyPresetToShape(...) }` |
| Canvas Reset of a view widget | `nodes/ObjectNode.tsx:769-781` | `withoutViewWidget` → `widgetRenderer.ts:143`, `const next = { ...ir }` |
| Kind selector | `authoring/irTabs.tsx:175-176` | `convertIRKind`: non-shared keys go to the stash slot and come back verbatim (`irKindConvert.ts:107-113`, `:117-121`) |
| Data-manager Form | `DataManagerViewpointPanel.tsx:339` | `withViewForm` → `irPrune.ts:54`, `const out: any = { ...ir }` |

### 1.3 Carriers (the `ir` travels unchanged)

| Path | file:line | Carries `ir`? | Carries a new sibling field? |
|---|---|---|---|
| Save / `.jjodel` download / project copy | `common/U.tsx:439`, `let str = JSON.stringify(state);` | yes, generic | yes |
| Load | `SaveManager.ts:56-57`, `save = VersionFixer.update(save); LoadAction.new(save);` | yes | yes, unless the tail loop below replaces the view |
| **Tail loop after the migrations, on every load** | `VersionFixer.tsx:141-150` → `view.tsx:1978-1997` | **yes, by explicit carry-over** `view.tsx:1989`, `if ((v as any).ir !== undefined) (newView as any).ir = (v as any).ir;` | **no**: `newView` is the registry default plus `pointedBy`, `subViews`, `ir`. `irStash` and `irLegacyClassic` are dropped (sub-agent, re-read) |
| Duplicate one view | `view.tsx:1882-1925` | yes: `for (let key in c.data)`, objects one-level copied, `ir` through `set_ir` | yes |
| Duplicate a viewpoint | `ProjectEditor.tsx:1196`, `Dashboard.tsx:495` (sub-agent) | child views are not copied at all (`deep` defaults to `false`, `view.tsx:1883`) | n/a |
| Viewpoint export/import alone | — | no such feature (sub-agent: `megamodelPersistence.ts:126`, "name only") | n/a |
| `.ecore` / XMI round-trip | `services/export/` (sub-agent) | views never travel (search exit 1; positive control `EAnnotation` in `EcoreService.ts`, exit 0) | n/a |
| Collaborative sync | `Collaborative.ts:74`, `const parsedAction: GObject<Action> = {...action} as any;`; `action.ts:585`, path `'idlookup.' + id + '.' + field` | yes, the whole value keyed by field | yes |

The tail loop runs only on views with `!v.clonedCounter` (`VersionFixer.tsx:148`), and any
`SetFieldAction` on a view increments it (`reducer.ts:104`, `current[key].clonedCounter = 1 + (current[key].clonedCounter || 0);`).
The migration writes `e.ir` by direct assignment, which does not increment it, so a migrated view is
exactly the kind of view the tail loop replaces on the same load. `VersionFixer.tsx:1003-1005` says
so: "without that carry-over this migration would be wiped by the same load that applies it".

## §2 Measurement (item 2)

**Fixtures.** None in the repo. `command grep -rln 'classic-default'` over the tree (exit 0) finds
only source, tests, docs and a build bundle under the gitignored `frontend/dist`; `command find ... -name '*.jjodel'`
returns nothing (exit 0; positive control, the same `find` with `-name '*.ecore'`, returns
`bench.ecore` and two xmi-m1 fixtures). The only corpus, `frontend/src/examples/`, is 2023 blobs with
no `version` (census 2026-08-04, line 27): they re-run the migration at every load with the live
factory. Saved projects live in browser storage per origin (TEST 2105 on 3001, per the fill lane),
not in the repo. So the measurement is at unit level.

**Method.** Each historical `irDefaults.ts` extracted with `git show <sha>:<path>` into the session
scratchpad, bundled with esbuild together with the LIVE `irDefaults.ts` of HEAD, run with node. Each
historical factory output, tagged `migratedFrom: 'classic-default'` and round-tripped through JSON
(persistence), is passed to the live `isMigratedDefaultView`. Probe not committed.

**The factory has had four bodies, not three** (measured: md5 of the function body at every commit
touching the file, `git log --follow`):

| Shape | Commits | Window on the trunk |
|---|---|---|
| S0 | `c4b3b7c03` … `3e46ee608` | 2026-07-18 → 2026-09-19 00:51 |
| S1 | `400095370` only | 2026-09-19 00:51:52 → 01:02:37 |
| S2 | `6ee6efcd5` … `516afd310` | 2026-09-19 01:02 → 2026-09-23 16:26 |
| S3 | `fb876efaa` … HEAD | 2026-09-23 16:26 → now |

S1 differs from S2 by one key (measured, `diff`): `style: { fontSize: 14, underline: true }` against
`style: { fontSize: 14, color: 'var(--color-inode-name)', underline: true }`. Branch heads:
`validation-skeleton` still has S0, `simulation-engine` has S3, `master` has no `irDefaults.ts`.

**Output, verbatim:**

```
migrated+saved with S0 factory c4b3b7c03..3e46ee608 (2026-07-18 -> 2026-09-19 00:51) | hash -668086040 | delegated = true
migrated+saved with S1 factory 400095370 only (2026-09-19 00:51 -> 01:02) | hash -1348605789 | delegated = false
migrated+saved with S2 factory 6ee6efcd5..516afd310 (2026-09-19 01:02 -> 2026-09-23 16:26) | hash -1492891571 | delegated = true
migrated+saved with S3 factory fb876efaa..HEAD (2026-09-23 16:26 -> now) | hash -314148633 | delegated = true
live factory hash -314148633
re-migrated at load (live factory) delegated = true
plus-view seed (createBlankViewInViewpoint) migratedFrom in seed = false | delegated = false
for-class seed (newDefault/createViewInWorkbench) delegated = false
EnableIRPanel seed, wildcard, no view name delegated = false
IR_DEFAULT_OBJECT_VIEW_ID, any ir, delegated = true
```

Read against the three projects the prompt names:

- **Saved before `400095370`.** Two cases. Saved at a version below 2.226 (never migrated, like the
  examples corpus): re-migrated at every load with the live factory, delegates (row "re-migrated").
  Migrated and saved between 2026-07-18 and `400095370`: carries S0, delegates through
  `LEGACY_OBJECT_VIEW_SNAPSHOT`.
- **Saved between `516afd310` and `fb876efaa`:** carries S2, delegates through
  `LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_18`.
- **New project:** has no default object view with an `ir` at all. Default views of init are
  withdrawn (R-IRN-15) and those that exist carry no `ir` by R-IRN-1, so objects render natively
  without any delegation. Any vertex view the user creates carries an `ir` without the marker and
  renders through the interpreter (the three seed rows above).
- **Not delegating today:** a view migrated and saved while the trunk sat on `400095370` (S1).

## §3 Findings

**F1 — The frozen list already has a hole (measured).** S1 is recognized by neither snapshot nor the
live factory. Exposure is tiny (an 11-minute commit window, only for someone who loaded a pre-2.226
project and saved it then), but it is the same mechanism the debt names, and the comment of
`LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_18` (`irDefaults.ts:160-165`, "from `400095370` ... through
immediately before P-2026-09-22-2105") describes a window that in fact holds two shapes. The same
hole opens for any working-tree state a dev server served through HMR and a local project saved.
These are not in git and cannot be enumerated.

**F2 — Delegation is gated on the marker, and only the migration writes it (read + measured).** The
three creation seeds and `EnableIRPanel` never write `migratedFrom` (the `irCreationSeed.test.ts:74`
test pins it: "non scrive mai migratedFrom (R-IRN-1: è della sola migration)"). So "factory-created
default views" in the product are exactly the migrated ones. A birth stamp matters only on the
migration path unless Q2 changes that.

**F3 — `updateDefaultView` rules out a sibling stamp (read).** §1.3: the migration writes by direct
assignment, `clonedCounter` stays unset, the tail loop at `VersionFixer.tsx:141-150` rebuilds the view
from the registry and carries `ir` alone (`view.tsx:1989`). A stamp in a sibling field would be wiped
on the very load that writes it, unless `view.tsx:1989` gains a second carry-over line. It would also
be invisible to `isMigratedDefaultView`, whose input is `Pick<CompiledView, 'viewId' | 'ir'>`
(`irDefaults.ts:228`): reading it would need plumbing through `irResolveCore.ts:237` or a new
selector in `ObjectNode`. The same replacement would drop `irStash` too, but no live path writes
`irStash` without incrementing `clonedCounter` (the kind selector goes through `set_irStash`,
`irTabs.tsx:175`), so today that is a latent trap, not a live bug.

**F4 — Inside `ir`, a stamp survives every path of §1 (measured, §4.1, and read, §1.3).** The
precedent is `migratedFrom` itself, also inside `ir` and excluded from the comparison. The warning of
`irKindConvert.ts:18-21` ("a foreign key inside `ir` would break both silently") is about a key that
changes (the stash). A stamp is written once at birth, `isMigratedDefaultView` excludes it explicitly,
and its presence in the compile-cache key (`irCompile.ts:329`, `${viewId}:${irHash(ir)}`) is constant
per view, so harmless. Visible side effect: the Source tab dumps the persisted `ir`
(`irTabs.tsx:233-241`), so the stamp shows there next to `migratedFrom`.

**F5 — The id branch is dead in product (measured absence).** `command grep -rIn 'Pointer_IRDefaultObjectView' frontend/src`
returns only the declaration `irDefaults.ts:23` (exit 0, and that declaration is the positive
control). The constant name appears only in `irDefaults.ts:229` and `ir.test.ts`. R-STR-6 already
recorded that `fromPointer('Pointer_IRDefaultObjectView')` returns nothing. Phase 2 leaves the branch
alone (out of scope, and a test pins it).

**F6 — `irHash` is a 32-bit djb2 over `JSON.stringify` (read, `irCompile.ts:319-324`).** Under a
birth hash, a false "untouched" needs an edit whose canonical JSON collides with one specific value:
about 2^-32 per edit. This is the same exposure as today's comparison, not a new one.

## §4 The birth-hash design against the map (item 3)

### 4.1 Prototype (scratchpad, not committed; measured on HEAD)

The lean written as a function, run against the real `irHash`, `validateIR` and `convertIRKind`
and the historical shapes:

```ts
const EXCL = ['migratedFrom', 'authoringMetaclassPins', 'birthHash'];
const structuralHash = (ir) => { const s = { ...ir }; for (const k of EXCL) delete s[k]; return irHash(canon(s)); };
const stamp = (ir) => ({ ...ir, birthHash: structuralHash(ir) });
const delegates = (ir, legacy) => {
  if (ir.migratedFrom !== 'classic-default') return false;
  if (typeof ir.birthHash === 'string') return structuralHash(ir) === ir.birthHash;
  return legacy.includes(structuralHash(ir));
};
```

Output, verbatim:

```
1 stamped+untouched delegates: true
2 stamped+edited (border) delegates: false
3 stamped+edited+reverted-by-hand delegates: true
4 stamp excluded from hash: structuralHash(born) === structuralHash(born minus stamp): true | birthHash value 213162375
5 after factory change: stamped S3-born still delegates: true
6 after factory change: UNSTAMPED S3 view, today-style open list (S0,S2,live): false | closed list (S0,S2,S3 literal): true
7 validateIR accepts stamped ir: {"ok":true}
8 kind round-trip vertex->row->vertex keeps stamp: true | delegates: true | row ir carries stamp: false
9 duplicate-style one-level copy delegates: true
10 pin written after birth still delegates: true
```

Check 4 is weak as written (the exclusion makes it true by construction). The real guard on "the
stamp does not enter the hash" is check 1: with `birthHash` removed from the exclusion list, check 1
turns false. §7 pins it that way.

### 4.2 Answers to item 3

- **Where the stamp lives:** inside `ir`, as an optional top-level key next to `migratedFrom` (F3,
  F4). Proposed name `birthHash` (§6).
- **Survival:** save/load, duplicate, collaborative and the tail-loop carry-over all move `ir` whole
  (§1.3). Kind conversion stashes it and restores it (check 8). Every editor spreads or clones
  (§1.2). `.ecore` and viewpoint export do not carry views at all. **Does not enter the hash:** it is
  excluded in the one function that computes the structural hash (checks 1 and 4).
- **Who writes it:** only the migration, `VersionFixer.tsx:1039`, through a helper in `irDefaults.ts`
  so the stamp and the exclusion list live in one module. That is the only product path that produces
  a delegable view (F2). No edit path writes it: an edit carries the old stamp, and the mismatch is
  what marks it (check 2). A writer that someday dropped the stamp would fall back to the closed
  legacy list, and an edited view matches none of those shapes, so the failure mode is "interpreter",
  never "edits invisible".
- **Revert by hand:** it delegates again (check 3). My reading: that is right. It is today's
  semantics (today's comparison is structural too), it is what undo produces (undo restores the old
  `ir` object), and a view the author has put back to its birth shape is asking for the default,
  which native paints. The visible cost is the switch of renderer: native and the IR default match on
  chrome (R-IRN-29) but not on geometry (padding 4/8 against 10/14 px, compartment height, left against
  centred text, R-IRN-29's own list), so the box shifts by a few pixels when the revert lands.
  Practically, most reverts that get there go through the Reset or prune helpers
  (`irPrune.ts:54-56`, R-B9 "round-trip identical"). A colour picked back by hand as a hex never
  equals the `var(--…)` string, so it stays on the interpreter.
- **Unstamped views (H5):** the legacy recognition must be closed as frozen literals S0, S2, S3
  (optionally S1, Q3), and the live `defaultObjectViewIR()` call removed from it. Check 6 is the
  proof. With the live call left in place, the first factory change after Phase 2 breaks every
  unstamped view that was migrated and saved between `fb876efaa` and the Phase 2 commit. Freezing S3
  is the act that closes the list, not a new entry of the old kind: after it, no factory change
  touches the recognition.

## §5 Alternatives (item 4), for comparison

| | Birth hash (lean) | (a) explicit `untouched` flag | (b) frozen list + guard test |
|---|---|---|---|
| Robust to factory change | yes, by construction | yes | no. One literal in `irDefaults.ts` and one in the test per change, forever (the fb876efaa pattern) |
| Edit-path hook | none | a clear on every writer, or centralized in `set_ir` (`view.tsx:646`). Then `set_ir` becomes an `ir` transformer, must compare content to spare no-op writes, and also clears on duplicate (`view.tsx` duplicate goes through `set_ir`), a change against today | none |
| Failure mode of a missed writer | interpreter (safe) | the view keeps delegating while the user edits it: **edits invisible on canvas** | a silent flip to the interpreter (R-IRN-33) |
| Revert by hand / undo | delegates again (content-defined) | stays on the interpreter unless undo also restores the flag (it does, if the clear is in the same TRANSACTION) | delegates again |
| Covers shapes never committed (S1, HMR states) | yes for views born after Phase 2 | yes, same | no (a guard fires on commits only) |
| VersionFixer | one line at `:1039` | one line at `:1039` | none |
| Closed legacy list for existing views | needed (S0, S2, S3) | needed (same) | is the mechanism |
| Cost now | helper plus exclusion plus 4 literals in `irDefaults.ts`, 1 VersionFixer line, ~6 tests | the same, plus the `set_ir` hook and its tests | 1 test |

**Recommendation (not a decision):** the birth hash, stamp inside `ir`, written only by the
migration, legacy recognition closed as literals. (a) costs more than the birth hash and fails in the
dangerous direction. (b) is a guard against forgetting, not a fix, and would not have caught an HMR
state.

## §6 Identifier search (item 6)

`command grep -rIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist -- "<id>" frontend/src frontend/scripts docs CLAUDE.md`,
line counts:

```
birthHash: 0            irBirthHash: 0       birthStamp: 0      bornHash: 0      bornAs: 0      irBorn: 0
untouched: 375          irUntouched: 0       isUntouched: 0     stampBirth: 0    stampIRBirth: 0
withBirthHash: 0        birthHashOf: 0       structuralHash: 0  structuralIdentity: 0   identityHash: 0   defaultIdentity: 0
```

Positive control through the same command: `isMigratedDefaultView` over `frontend/src`, 28 lines.
`untouched` is prose only: `command grep -rIn -E '\buntouched\s*[:?]|\.untouched\b' frontend/src`
finds 11 lines (full output, counted with `wc -l`), all inside comments, the one without a comment
prefix being line 2677 of `TreeViewContent.tsx`, inside a `{/* ... */}` block. No key uses the word.
It must not become a key name, because a search for it would be drowned in prose. A
case-insensitive `birth` over `frontend/src` finds only unrelated hits (`birthDate`, prose). Proposed:
`birthHash` (key inside `ir`), `withBirthHash` (exported helper, or folded into a
`migratedDefaultObjectViewIR()`, name to confirm at the GO, 0 hits), `structuralHash` (module-private).
`LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_23` for S3 and, if Q3 says yes, `..._2026_09_19_S1`: names to
confirm at the GO. Nothing existing is renamed.

## §7 Test plan (item 7), one mutation per rule

All in `ir.test.ts`, new `describe('isMigratedDefaultView — birth hash (P-2026-09-24-1455)')`, input
built through the same helper VersionFixer calls (P11: execute the subject, not a hand-copied stamp).

| # | Test | Mutation that must kill it |
|---|---|---|
| T1 | stamped and untouched → `true` | drop `birthHash` from the exclusion list (the stamp enters the hash) |
| T2 | stamped, border colour edited → `false` | make the stamped branch return `true` unconditionally |
| T3 | unstamped S0, S2, S3 literals (hardcoded in the test, not imported) → `true` each | delete one frozen literal from the set (one mutation per literal) |
| T4 | factory change does not break a stamped view: stamp a view, then compare with `defaultObjectViewIR` mocked (`vi.spyOn` on the module export or an injected factory) to a changed shape → still `true` | stamped branch compares with the live factory instead of `ir.birthHash` |
| T5 | factory change does not break an unstamped S3 view: same mock → still `true` | put the live `defaultObjectViewIR()` call back into the legacy set in place of the S3 literal |
| T6 | stamp without marker → `false` | drop the `migratedFrom` gate |
| T7 | stamped view with a pin written after birth → `true`; stamped view with a pin and a real edit → `false` | drop `authoringMetaclassPins` from the exclusion list |
| T8 | the migration writes the stamp: run `VersionFixer` 2.225→2.226 on a minimal `idlookup` with one classic object view, assert `ir.birthHash` equals the structural hash and the view delegates | drop the helper call at `VersionFixer.tsx:1039` |

T8 needs `VersionFixer` importable in the bench. If it does not import (`window is not defined`
through `joiner`, CLAUDE.md §5), the gap is declared in the log entry and not covered with a
source-text test (§5 sub-rule). T4 needs the factory to be mockable. If `vi.spyOn` on an ESM export
does not intercept the internal call, the fallback is a module-private indirection, to be decided in
Phase 2. The existing 12 delegation tests stay (8 + 4, `ir.test.ts:1306-1482`), and the tautological "freshly migrated view (current
factory shape)" test (`ir.test.ts:1468-1472`, flagged by the fill report, Finding 6) is left as it is
(rule 9).

## §8 Baseline gates (item 8), measured on HEAD `6c4aee51d`

Run through a temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules` (P14).
`git status --short` was empty before the link, after the link and after its removal (exit 0 each
time). The dev server on 3001 (pid 58802, cwd `~/jjodel-release/frontend`) was left running,
untouched.

- `npm run typecheck`: exit 2, **14** errors, the declared set: `api/data.ts` ×3, `common/Dummy.ts`,
  `EditorV2.tsx`, `Measurable.tsx` ×6, `ChatMessages.tsx`, `ProjectEditor.tsx`, `Dashboard.tsx` (full
  output read, 31 lines).
- `npx vitest run`: exit 1. `Test Files 9 failed | 174 passed (183)`, `Tests 4228 passed (4228)`.
  The 9 are red at import (monaco `window` / `PerformanceMetrics.ts:220`): `jjscript/context-binding`,
  seven `jjtl/*`, `utils/UDComparator`.
- `npm run build`: exit 0, only the chunk-size warning.

## Risks

- **R1 — VersionFixer is critical zone (§3.2).** The stamp needs one line at `VersionFixer.tsx:1039`.
  It changes the output of an existing step, so it reaches only states still below 2.226 (every load
  of such a project until it is saved). No version bump. Phase 2 cannot start there without a Layer
  Impact Report and an explicit go-ahead.
- **R2 — Stamping existing views means a bump (Q1).** A new step 2.228→2.229 would also re-arm the
  tail loop (`VersionFixer.tsx:141-150`) for every view whose `version` differs and `clonedCounter` is
  unset, a wholesale regeneration beyond this view family. Which views carry a `version`, and how the
  registries are filled at that moment (`reducer.ts:1103-1111`, from the first state reduced in the
  session), was not measured here. It would have to be measured before any bump.
- **R3 — The closed list is permanent either way.** A save below the stamping point can arrive at any
  time, so S0/S2/S3 never leave the code. Stamping once only moves where they are consulted.
- **R4 — Visual behaviour is unchanged by construction** for every class in §2 (all that delegate
  today still delegate, and the stamped ones delegate while untouched). The one change is S1, if Q3
  says yes: those views go back to native.
- **R5 — Tests T4/T5 depend on mocking the factory**, see §7.

## Open questions for Alfonso

1. Existing unstamped views: stamp them once at load (new VersionFixer step, a bump, R2) or leave them on the closed legacy recognition forever? Recommended: leave them. The list is permanent anyway (R3), and a bump has an unmeasured blast radius.
2. A new default view created from the UI (the «+» wildcard, for-class, Enable IR): delegate, or always the interpreter? Recommended: always the interpreter. That is today's behaviour, R-IRN-1, and the Enable IR help text. Delegating would flip native→IR on the first edit, with the R-IRN-29 geometry shift.
3. Freeze S1 (the `400095370` shape, 11 minutes on the trunk) into the closed list, so a project saved in that window delegates again?
4. Stamp inside `ir` as `birthHash` (F3/F4), knowing it shows in the Source tab next to `migratedFrom`: confirm the placement and the name.
5. Go-ahead to touch `VersionFixer.tsx:1039` (one line, one import), with the Layer Impact Report in chat before the diff?
6. Reverting by hand to the birth shape delegates again (§4.2): confirm this is wanted.

## Proposed Phase 2 diff (prose)

1. `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts`
   - a module-private `structuralHash(ir)`: shallow copy, delete `migratedFrom`,
     `authoringMetaclassPins`, `birthHash`, `irHash(canonicalize(...))`. It replaces the inline
     projection at `:236-238` and `:246`.
   - an exported helper that returns `{ ...defaultObjectViewIR(), migratedFrom: 'classic-default' }`
     with `birthHash` set to its structural hash (name at the GO).
   - `LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_23` (S3 verbatim), plus S1 if Q3 says yes. `factoryHashes`
     built from the literals only, and the live `defaultObjectViewIR()` call leaves it. The comment on
     `LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_18` gets its window corrected (F1): an additive comment
     edit, no rename.
   - `isMigratedDefaultView`: after the marker gate, a string `birthHash` decides alone
     (`structuralHash(ir) === ir.birthHash`), otherwise the closed list. Id branch, marker gate and
     WeakMap memo unchanged. The doc comment states that the list is closed.
2. `frontend/src/redux/VersionFixer.tsx` (critical zone, LIR, explicit go-ahead): `:1039` calls the
   helper instead of spreading the factory, and the import at `:23` changes accordingly. Nothing else.
3. `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts`: T1-T7 (T8 wherever
   VersionFixer imports in the bench, otherwise declared as a gap).
4. Nothing else: no `ObjectNode.tsx`, `view.tsx`, `irTypes.ts` (the key stays untyped like
   `migratedFrom`, unless the GO wants it typed as an optional field, which would add `irTypes.ts`),
   `irCompile.ts`, seeds or `EnableIRPanel.tsx`, if Q2 goes as recommended.

Three files, under the P6 five. The LIR for item 2 goes in chat before the diff: Persistence
(`VersionFixer`) touched, JjOM/D-layer write shape of one migration step changed, L-layer, canvas and
sync untouched.
