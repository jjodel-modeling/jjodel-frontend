# Discovery — VersionFixer, old saved states and the examples that do not load (Phase 1)

Prompt-ID: P-2026-09-24-1610 · prompt `docs/prompts/claude_2026-09-24_1610_prompt_versionfixer_old_states.md`
Session: d630f0a1-97c7-4e20-882a-399f988b943b (read from the harness scratchpad path)
Tree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, HEAD `b297b5e11` for the whole phase (docs-only
Status flip on top of the merge `94a72edba`, which satisfies the precondition). `~/jjodel-sim` not touched.
Executor: Anthropic Claude Opus 5.5 (as the session banner shows it).

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads
the real files. "Measured" means a run in this phase on HEAD `b297b5e11` (dev server on 3001, which
serves this tree: `lsof` cwd `/Users/alfonso/jjodel-release/frontend`, and the served
`VersionFixer.tsx` contains `withMigratedHash`, the 1455 change); "read" means read from a file, a doc
or git history.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `'2.1 -> 2.2'` returns `void`, and a state with no `version` goes through `'0 -> 2.1'` and then crashes `VersionFixer.update` with a TypeError. | **Holds, with a correction** (measured + read, F1). A state with no `version` does **not** go through `'0 -> 2.1'`: `update` sets `n: 2.1` itself (`:121`) and enters at `'2.1 -> 2.2'`. `'0 -> 2.1'` is reached only by a `version` object with a falsy `n`, which then crashes on the same step. |
| H2 | Past that step the 2023 blobs fail at `'2.2 -> 2.201'`, which iterates `s.classs`. | **Partly** (measured, F3, F4). 5 of the 7 distinct blobs fail in `'2.2 -> 2.201'`, but **not on `classs`**: `classs` is a live `DState` field present in all 7. They fail on `s.projects` absent (4 blobs) and on a dangling view pointer (1 blob). The other 2 pass the step. |
| H3 | None of `frontend/src/examples/` loads today. | **Holds** (measured, F5, table in §2): 7/7 distinct blobs fail on the real load path. In addition, **none is reachable from the UI**: no module imports them. |
| H4 | Fixing the two defects makes the examples load. | **Falsified** (measured by in-memory simulation, F7). With both bypassed the chain completes for 7/7, then `LoadAction` dies in the reducer on root fields that no step backfills (`ClassNameChanged`, then `NODES_RECOMPILE_labels`); with every missing root field backfilled, it dies on element-level shapes (view `events`, `constants`, `labels`). |
| H5 | `'2.1 -> 2.2'` is the only step with an empty body or a `void` return. | **Holds** (read, static scan of the 31 steps, F8). |
| H6 | `'2.2 -> 2.201'` is the only step that reads a root field that may be absent without a guard. | **Holds** (read, F8). |

## Objective

Items 1-7 of the prompt: how `update` chains the steps and where `void` breaks it; for each file of
`frontend/src/examples/`, reachability, load path, version, and whether it loads on 3001; the root
cause of the `'2.2 -> 2.201'` failure; a minimal fix proposal per defect with the LIR draft; the
open questions for Alfonso; a test plan with one mutation per rule; the baseline gates.

## Files read (full paths)

- `/Users/alfonso/jjodel-release/frontend/src/redux/VersionFixer.tsx` (1-470 whole; every step signature
  and body scanned by script; `:1006-1064`, `:1064-1070`, `:1196-1202` read)
- `/Users/alfonso/jjodel-release/frontend/src/components/topbar/SaveManager.ts` (`:28-58`)
- `/Users/alfonso/jjodel-release/frontend/src/pages/Project.tsx` (`:25-75`)
- `/Users/alfonso/jjodel-release/frontend/src/redux/reducer/reducer.ts` (`:704-709`, `:733-742`, `:776-778`,
  `:852`, `:920-931`, `:1505-1580`)
- `/Users/alfonso/jjodel-release/frontend/src/redux/store.tsx` (`:137`, `:208`)
- `/Users/alfonso/jjodel-release/frontend/src/api/persistance/projects.ts` (`:89-92`, `:225-290`, `:332-344`)
- `/Users/alfonso/jjodel-release/frontend/src/common/U.tsx` (`:388-440`), `.../common/Log.ts` (`:146-152`, `:181`)
- `/Users/alfonso/jjodel-release/frontend/src/common/Defaults.ts` (`:108-135`),
  `.../components/editor-v2/Toolbar.tsx` (`:292-302`), `.../joiner/classes.ts` (`:453-470`, `:3465-3480`),
  `.../components/devtools/SmokeBoot.tsx` (`:30-70`)
- `/Users/alfonso/jjodel-release/frontend/src/examples/` — every file: `index.ts`, `first.ts`, `second.ts`,
  `sequence.ts`, `statechartplus.ts`, `statechartplus_old.ts`, `shapes.ts`, `conflictsimulation.ts`,
  `examples/{index,first,second,sequence,statechartplus}.ts`, `StateMachine/**` (imports only),
  `RowViewSmoke/index.ts` (imports only); blobs parsed whole by script
- `/Users/alfonso/jjodel-release/frontend/src/components/Toast/toastDispatch.ts` (`:60-95`), `.../App.tsx` (`:121`)
- `/Users/alfonso/jjodel-release/frontend/src/redux/__tests__/versionfixer_2228_migration.test.ts` (header)
- `/Users/alfonso/jjodel-release/frontend/scripts/smoke/README-probes.md`, `.../states.ts` (`:90-260`)
- `/Users/alfonso/jjodel-release/docs/log-inbox/default-view-parity.md` (the 1455 entry and tickets),
  `/Users/alfonso/jjodel-release/docs/discovery/discovery_2026-09-24_migrated_view_identity.md` (§2),
  `.../discovery_2026-08-18_3_corpus_persistito_e_due_migrazioni.md` (F1), `docs/decisions.md` (R-IRN-17, R-IRN-20),
  `docs/PROTOCOL.md` P14.

## §1 How `update` chains the steps (item 1)

Read, `VersionFixer.tsx:119-154`:

```
119    public static update(s: DState): DState{
121        if (!s.version) s.version = {n: 2.1, date:"_reconverted", conversionList:[0]};
122        let prevVer = s.version.n || 0;
127        while (currVer !== VersionFixer.highestVersion) {
131            let {n, f} = VersionFixer.versionAdapters[currVer];
132            s.version.conversionList = [...s.version.conversionList, currVer];
133            s = f.call(singleton, s);
134            currVer = s.version.n = n || 0;
137            Log.exDev(currVer <= prevVer, "version updater found loop at version \""+currVer+"\", ...");
```

- The next step is picked by the **from-version**: `setup()` registers each method name `'a -> b'` as
  `versionAdapters[a] = {n: b, f}`; the loop reads `versionAdapters[currVer]` (`:131`).
- The step's return value **replaces** the state (`:133`), and the driver writes the target version on
  it (`:134`). A `void` step makes `s` `undefined` at `:133`; `:134` then throws
  `TypeError: Cannot read properties of undefined (reading 'version')`.
- `Log.exDev` (`Log.ts:146-152`) logs and does **not** throw: a missing adapter surfaces as the
  destructuring TypeError at `:131`, not as the message at `:128`.
- After the chain, the tail loop (`:141-150`) runs `LViewElement.updateDefaultView` on every
  non-cloned view whose `version` differs from `highestVersion`.

`'2.1 -> 2.2'` (`:408-410`), verbatim:

```
408    private ['2.1 -> 2.2'](s: DState): void {
409
410    }
```

**History (read).** `fecf34c8b` (2024-11-18, "fix multiselect and version updater") did three things
at once: it moved the whole body of `'2.1 -> 2.2'` (which until then ended in `return s` and began
with the `s.classs` loop) into a new `'2.2 -> 2.201'`, left `'2.1 -> 2.2'` empty with a `void`
signature, and changed the driver from `let prevVer = s.version?.n || 0; ... s = f(s)` to the
`if (!s.version) s.version = {n: 2.1 ...}` entry plus `s = f.call(singleton, s)`. From that commit on,
every state without `version` (every save before versioning was set up, `e4dc5430b`, 2024-06-28)
crashes at `:134`. `02e6aaeba` (2026-01-28) only moved the block (`git log -G`, diff read).

## §2 The examples (item 2)

**Reachability (read + measured search).** No module outside `frontend/src/examples/` imports a blob,
`index.ts` (`stateExamples`), `examples/examples/*` or `StateMachine/`. Search:
`command grep -rnE "examples['\"/]|examples\"|import\.meta\.glob" --include=... src scripts index.html`,
exit 0; **positive control on the same command**: it returns
`src/components/devtools/SmokeBoot.tsx:48: import('../../examples/RowViewSmoke')`. The "four importers"
named in the prompt are not importers of the blobs: `Defaults.ts:113,118,132`, `Toolbar.tsx:297` and
`classes.ts:3472` cite `examples/` in comments only; `SmokeBoot.tsx:48` imports `RowViewSmoke`, a
programmatic fixture. The Jodie `/examples` command parses (`JjodieCommandParser.ts:152,828-840`) to a
command type `'EXAMPLES'` that no executor handles (`command grep -rn "'EXAMPLES'"`: two hits, both in
the parser); the console `/examples` (`Console.tsx:438`) prints syntax help. Same conclusion as
`discovery_2026-08-18_3_corpus_persistito_e_due_migrazioni.md` F1, re-verified today.

**Load path (read).** One live path: `stateInitializer` → `SaveManager.load(state, project)`
(`reducer.ts:1570`) → `VersionFixer.update(save)` (`SaveManager.ts:56`) → `LoadAction.new(save)`
(`:57`). The other call site, `Project.tsx:53`, sits inside a `/* ... */` block (`:38-57`). The
`.jjodel` import (`ProjectsApi.importFromText`, `projects.ts:225`) stores a project; opening it takes
the same path.

**Duplicates (measured, md5).** `examples/examples/{first,second,sequence}.ts` are byte-identical to
the top-level files; `examples/examples/statechartplus.ts` equals `statechartplus_old.ts` modulo
trailing newlines. 7 distinct blobs.

**Method (measured).** Two throwaway Playwright probes in the session scratchpad, not committed:
`probe_1610_chain.mjs` runs the app's own `window.VersionFixer.update` (the instance the app loaded,
`highestVersion: 2.228 | adapters: 30`) on a fresh JSON copy of each blob; each throwing step is then
bypassed in memory to reach the next. `probe_1610_load.mjs` takes the real load path: a project
created from the UI, its `state` replaced by the blob compressed with the app's own `async-lz-string`,
then `/#/project?id=...` and a reload, so that `stateInitializer` calls `SaveManager.load`. Declared
adaptation: the offline user is added to the blob's `idlookup`/`users`, as a save made by that user
would carry it; without it `checkLoaded` (`reducer.ts:1529`) would loop on any foreign state
regardless of `VersionFixer`. **Positive control**: a project created from the UI, saved with
`SaveManager.save()`, reloaded through the same path, unpatched:

```
[probe-1610-load] mode=control (control: fresh project, saved at HEAD) pid=Pointer1790260791507_USER_2
   {"patched":false,"versionN":2.228,"conv":0,"blobModelsInStore":"0/0","loadingScreen":false,...}
```

| File | Reachable from UI | Load path | `version` | Chain today (first throw) | Chain, (1) bypassed | Full load on 3001 today |
|---|---|---|---|---|---|---|
| `first.ts` (2023-09-29) | no | none (would be `SaveManager.load`) | absent | `2.1 -> 2.2` | `2.2 -> 2.201`, `s.projects` | no — "Loading Project..." forever |
| `second.ts` (2023-09-29) | no | none | absent | `2.1 -> 2.2` | `2.2 -> 2.201`, `s.projects` | no — same |
| `sequence.ts` (2023-09-30) | no | none | absent | `2.1 -> 2.2` | `2.2 -> 2.201`, `s.projects` | no — same |
| `statechartplus_old.ts` (2023-10-01) | no | none | absent | `2.1 -> 2.2` | `2.2 -> 2.201`, `s.projects` | no — same |
| `conflictsimulation.ts` (2023-11-12) | no | none | absent | `2.1 -> 2.2` | `2.2 -> 2.201`, dangling view | no — same |
| `statechartplus.ts` (2024-01-08) | no | none | absent | `2.1 -> 2.2` | passes; dies in reducer `:708` | no — same |
| `shapes.ts` (2024-01-16) | no | none | absent | `2.1 -> 2.2` | passes; dies in reducer `:708` | no — same |
| `examples/examples/*` (4) | no | none | absent | duplicates, same results measured | same | not re-run (duplicates) |
| `examples/index.ts` | no | exports `stateExamples`, no importer | — | — | — | — |
| `StateMachine/**` | no | builds a project through constructors + `ProjectsApi.save`, no importer | — | does not go through `VersionFixer` | — | — |
| `RowViewSmoke/index.ts` | dev only, `#smoke=rowviews` (`SmokeBoot.tsx:40-48`) | builds through actions | — | does not go through `VersionFixer` | — | not run |

Dates are the ms timestamps inside the blob ids. Verbatim, today (as-is), one of seven identical shapes:

```
[probe-1610] first.ts
  #1 2.1 -> 2.2: Cannot read properties of undefined (reading 'version')
       TypeError: Cannot read properties of undefined (reading 'version') | at VersionFixer2.update (http://localhost:3001/src/redux/VersionFixer.tsx?t=1790256093282:110:19)
  #2 2.2 -> 2.201: Cannot read properties of undefined (reading 'map')
       TypeError: Cannot read properties of undefined (reading 'map') | at 2.2 -> 2.201 (http://localhost:3001/src/redux/VersionFixer.tsx?t=1790256093282:365:30)
[probe-1610] conflictsimulation.ts
  #2 2.2 -> 2.201: Cannot read properties of undefined (reading 'viewpoint')
       TypeError: ... at 2.2 -> 2.201 (http://localhost:3001/src/redux/VersionFixer.tsx?t=1790256093282:360:20)
[probe-1610-load] mode=asis statechartplus.ts pid=Pointer1790260904472_USER_2
   {"patched":false,...,"blobModelsInStore":"0/4","loadingScreen":true,"rfNodes":0,"bodyHead":"Loading Project... | This should only take a moment | ..."}
   log:     at stateInitializer (http://localhost:3001/src/redux/reducer/reducer.ts?t=1790256093282:1274:9) Failed to fetch projects {error: TypeError: Cannot read properties of undefined (reading 'version')
```

Served line → source line (curl of the served module): `:110` → `VersionFixer.tsx:134`
(`currVer = s.version.n = n || 0`), `:365` → `:426` (`s.projects`), `:360` → `:424`
(`c.father = c.viewpoint`).

## §3 Root cause of the `'2.2 -> 2.201'` failure (item 3)

**`classs` is not a typo and not the failure (read + measured).** It is the live root collection of
`DClass` pointers, `store.tsx:137`: `classs: Pointer<DClass, 0, "N"> = [];` — the pluralization rule
is stated at `LModelElement.tsx:592` (`// name -> redux (es. DClass -> classs)`). It was already read at
`c535831ad` (2024-07-14), when the body still belonged to `'2.1 -> 2.2'`. Every blob carries it
(14, 12, 13, 33, 22, 17, 14 entries), all pointers resolve.

**What fails (measured, blob census by script):**

| Blob | `projects` | unresolved in `viewelements` | throws at |
|---|---|---|---|
| `first.ts`, `second.ts`, `sequence.ts`, `statechartplus_old.ts` | **absent** | 0 | `:426` `for (let c of (s.projects).map(...))` |
| `conflictsimulation.ts` | 1 | **2** (`1699933271457_Pointer1699933043994_136578`, `1699933976784_Pointer1699933964374_132`) | `:424` `{ c.father = c.viewpoint; }` with `c` undefined |
| `statechartplus.ts`, `shapes.ts` | 1 | 0 | does not throw |

So the blob does not match the shape the step assumes, in two ways: the step assumes every root
collection exists (`projects` entered `DState` between October and November 2023, after four of the
blobs were saved: inferred from the blob dates, not from history), and every pointer in it resolves (`this.d(p, s)` returns `undefined` on a dangling
one, and each loop dereferences `c`). Seven loops share the pattern: `:414` `classs`, `:424`
`viewelements`, `:425` `viewpoints`, `:426` `projects`, `:427` `references`, `:428` `models`, `:429`
`attributes`. Only `projects` and `viewelements` fail on the corpus.

`'2.208 -> 2.209'` overwrites `s.projects = [pid]` unconditionally (`:577-579`), so a state that
reaches it without `projects` gets one there: a guard at `:426` need not create the field.

## §4 Past the two defects: the load still fails (H4, measured)

Simulated in memory in the page (init-script wrappers on `versionAdapters[2.1].f` and
`versionAdapters[2.2].f`; no source change), full load path, 7 blobs each:

- **(1) bypassed**: `statechartplus`, `shapes` complete the chain (`[VersionFixer 2.225 -> 2.226] IR inverse migration: ...`), the other five die in `'2.2 -> 2.201'` as in §3.
- **(1) + (2) bypassed**: 7/7 complete the chain, 7/7 then die in the reducer, same stack each:

```
    pageerror: Cannot set properties of undefined (setting '1696192324184_Pointer1696192260965_307')
      STACK TypeError: Cannot set properties of undefined (setting '1696192324184_Pointer1696192260965_307')
          at unsafereducer (http://localhost:3001/src/redux/reducer/reducer.ts?t=1790256093282:551:63)
          at reducer (http://localhost:3001/src/redux/reducer/reducer.ts?t=1790256093282:461:15)
          at Object.dispatch (http://localhost:3001/node_modules/.vite/deps/redux.js?v=9b653722:164:22)
```

  Served `:551` → `reducer.ts:708`: `if (oldname !== newname) ret.ClassNameChanged[d.id as Pointer<DClass>] = oldname;`.
  `ClassNameChanged` is a `DState` root field (`store.tsx:208`, since `d2ad9093b`, 2024-02-23); no blob has it, no step adds it.
- **+ `ClassNameChanged = {}` backfilled**: 7/7 die at served `:620` → `reducer.ts:776-777`
  (`arr = ret.NODES_RECOMPILE_labels; if (arr.length)`), `Cannot read properties of undefined (reading 'length')`.
  `NODES_RECOMPILE_labels` entered `DState` in `4e767942d` (2024-08-27).
- **+ every missing root field backfilled** (16-19 per blob, from the live state's shape): still 0/7
  load. Failures move to element level: page error `Cannot convert undefined or null to object` at
  `Object.keys(dv.events)` (served `:752` → `reducer.ts:930`) on `shapes`; page error
  `Cannot read properties of undefined (reading 'labels')` in `parseLabel` (served `:581` →
  `reducer.ts:740`) on `conflictsimulation`. On the other five the probe's six-line error window
  filled with `error constants parse {vid: Pointer_ViewModel, e: TypeError: {} is not a function`
  (`reducer.ts:852`, one per view) and the fatal error, if any, was cut: reported as a window, not as
  the cause.

Root-key census after the chain (measured, `probe_1610_rootdiff.mjs`, on `VersionFixer.update`
alone): each blob lacks 43-46 of the 92 root keys of the live store state, among them
`ClassNameChanged`, `ELEMENT_CREATED`, `ELEMENT_DELETED`, `NODES_RECOMPILE_labels`,
`NODES_RECOMPILE_longestLabel`, 19 `VIEWS_RECOMPILE_*` arrays, `ecoreClasses` (4 blobs), `topics`
(`shapes`). On the real path `SaveManager.load` creates the `VIEWS_RECOMPILE_*` keys before the chain
(`SaveManager.ts:45-53`), so the gap there is the 16-19 keys the backfill run filled (its log:
`backfilled 19 root keys` ×4, 18, 17, 16).

**Conclusion.** The two named defects are real and each is the first failure on its path, but the
2023 blobs sit several layers of unmigrated shape away from loading. Versioning began in 2024-06; no
step ever described the pre-versioning shape, and the step that most resembles such a description
(`'2.2 -> 2.201'`) covers a handful of fields.

## §5 Other steps (item 4, read)

Static scan of the 31 registered steps (script over `VersionFixer.tsx`, brace-matched bodies):

- Empty body or `void` return: **only `'2.1 -> 2.2'`** (`:408`). `'2.218 -> 2.219'` (`:837`),
  `'2.219 -> 2.220'` (`:842`), `'2.224 -> 2.225'` (`:993`) are one-line `{ return s; }` no-ops by design.
  Early `return;` in `'2.215 -> 2.216'` (`:718-770`) sits inside the nested `visitPackage` callback,
  not in the step; `'2.226 -> 2.227'` and `'2.227 -> 2.228'` early-return `s`.
- Root fields read without a guard: **only `'2.2 -> 2.201'`** (the seven loops above).
  `'2.203 -> 2.204'` guards `languages` (`:471` `if (!s.languages) s.languages = newLanguages;`),
  which makes `'2.207 -> 2.208'` `Object.values(s.languages)` (`:548`) safe;
  `'2.205 -> 2.206'` guards `RECOMPILE_LANGUAGE` (`:507`); `'2.206 -> 2.207'` reads `(s.edgepoints||[])`
  (`:531`); `'2.208 -> 2.209'` guards the four `*_RECOMPILE_grid/snap` (`:573-576`) and overwrites `projects`.
- Outside `VersionFixer` and outside the root cause, listed and not proposed for fixing: the
  reducer's unguarded root reads (`reducer.ts:708`, `:776`, and the element-level sites in §4).

## §6 Risks

1. **The fix moves the failure, it does not remove it, for the 2023 blobs** (§4). For a user with a
   pre-2024-02 save, the screen stays "Loading Project..." with or without the fix; only the console
   error changes, unless Q1 adds a message.
2. **Unmeasured population.** How many real saved projects lack `version` is not known: the version
   distribution of the corpus was never extracted (`discovery_2026-08-05_legacy_view_census_real_projects.md:87-88`).
   A save from between `d2ad9093b` (2024-02) and versioning (2024-06-28) would carry `ClassNameChanged`
   and might load fully once (1) and (2) are fixed: hypothesis, no fixture of that age exists.
3. **A separate gap, found here, not in scope.** `NODES_RECOMPILE_labels` entered `DState` on
   2024-08-27, **after** versioning began, and no step backfills it. A project saved between
   2024-06-28 and 2024-08-27 carries a `version` but not the field, and would die at `reducer.ts:776`
   on load. Hypothesis from history plus the §4 measurement of the unguarded read; no fixture.
4. `update` mutates its argument in place, and `SaveManager.load` keeps it in `SaveManager.tmpsave`
   (`SaveManager.ts:44`): a failure mid-chain leaves `tmpsave` half-migrated. Unchanged by the proposal.
5. Tests cannot import `VersionFixer.tsx` in vitest node (R-IRN-20): the Phase 2 tests are mirror
   copies of the step bodies, which can drift. R-IRN-20 accepts this with a header naming the source.
6. **Environment.** 3001 could not boot at phase start: `frontend/node_modules`, the P14 symlink, had
   been removed at the end of 1455, and Vite answered 500 on the changed `EditorV2.tsx`
   (`Cannot find package '@babel/plugin-proposal-decorators' imported from .../babel-virtual-resolve-base.js`).
   The symlink was recreated per P14 (`git status` empty before and after) and is removed at phase end.
   Fonts still return 403 (ticket 3 of 1455). Phase 2 needs the symlink again for gates and the visual check.

## §7 Open questions for Alfonso

1. **A state that cannot be migrated: user-visible message?** Today the user sees "Loading Project..."
   forever and the console says `Failed to fetch projects` (`reducer.ts:1578`), a misleading label.
   Options: (a) `toast.error` from `SaveManager.load` around `VersionFixer.update` (`SaveManager.ts:56`),
   one more file, catches chain failures only; (b) the same in the `stateInitializer` catch
   (`reducer.ts:1577-1578`), catches the same set and relabels the log; (c) no message in this lane.
   Neither (a) nor (b) catches the reducer failures of §4: they are uncaught page errors raised inside
   `dispatch`. `ToastProvider` is mounted at the app root (`App.tsx:121`), so a toast would render over
   the loading screen.
2. **The examples: remove, keep as fixtures, or regenerate?** None is reachable from the UI, none
   loads, and fixing (1) and (2) does not change that (§4). Fixing them at the source by migration is
   unbounded (element-level gaps remain with every root field backfilled). Options: delete the 11 blob
   files (2 786 754 bytes of dead code); keep them as fixtures of the Phase 2 chain test only (they are
   data-only modules); regenerate the teaching examples as current projects (a content task, not this lane).
3. Scope of fix (2): guard all seven loops of `'2.2 -> 2.201'` (same pattern, same risk; recommended),
   or only the two that fail on the corpus (`:424`, `:426`)?
4. Fix (1) at the step only (`return s`, recommended), or also a driver guard at `:133`
   (`s = f.call(singleton, s) ?? s`) against a future `void` step? The driver guard would also hide one.
5. Risk 3 (`NODES_RECOMPILE_labels`, saves of 2024-06-28..2024-08-27) and the other post-chain root
   gaps: separate ticket, or nothing?
6. Inbox for the Phase 2 entry: `docs/log-inbox/default-view-parity.md`, or a new
   `docs/log-inbox/versionfixer.md` with the standard header (recommended: this lane is not about parity)?
7. Optional measurement before Phase 2: a console snippet in your browser on 3001 that counts saved
   projects by `version.n` (absent included), so the population of Q1 and risk 2 is known.

## §8 Proposed Phase 2 diff (prose)

**Files.** Code: `frontend/src/redux/VersionFixer.tsx`; new `frontend/src/redux/__tests__/versionfixer_22_old_states.test.ts`;
`frontend/src/components/topbar/SaveManager.ts` **only if Q1 = (a)** (or `reducer.ts` if Q1 = (b)).
Docs (separate commit): the log entry in the inbox of Q6, the Status line of the prompt file. Two or
three code files: under the Rule 19 threshold.

**Fix (1), `VersionFixer.tsx:408-410`.** Signature `(s: DState): DState`, body `return s;`. The step
carries no content since `fecf34c8b` moved it to `'2.2 -> 2.201'`; returning the state restores the
contract the driver has assumed since the same commit. No state change for any input.

**Fix (2), `VersionFixer.tsx:414`, `:424-429`.** Each of the seven loops reads its root collection as
`(s.X || [])` and skips an unresolved pointer (`if (!c) continue;`), the one-line loops rewritten with
a block body to hold the skip. On a state where every collection exists and every pointer resolves,
the output is identical to today's (test T5). `projects` is not created here: `'2.208 -> 2.209'` sets it.

**Not in the diff.** The driver, the registry, `highestVersion` (no new adapter, no bump), every step
from `'2.201 -> 2.202'` on, the tail loop, `'2.225 -> 2.226'`, the reducer's unguarded reads (§4, Q5),
the example files (Q2).

**Expected effect, stated in advance.** On 3001, for the seven blobs: the TypeErrors in `VersionFixer`
disappear, the chain completes, and the load fails in the reducer at `reducer.ts:708` (§4). No example
loads. A current project is unaffected (no step runs at 2.228).

### Layer Impact Report — draft (the definitive one goes in chat before the edit)

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)       — the migrated state that LoadAction installs
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString) — two step bodies

Persistence:
  - What changes: '2.1 -> 2.2' returns its argument; '2.2 -> 2.201' tolerates absent root
    collections and unresolved pointers in its seven loops.
  - What does NOT change: the driver, the registry, highestVersion 2.228, steps >= 2.201,
    the tail loop, jsxString, DV / defaultViewTemplate (Rule 14 not triggered).
  - Cross-layer interaction: SaveManager.load -> VersionFixer.update -> LoadAction.new.
  - Side-effect safety: only states entering the chain at 0, 2.1 or 2.2 run these steps.
D-layer:
  - What changes: states entering at <= 2.2 now reach LoadAction instead of throwing in
    VersionFixer; the 2023 blobs then fail in the reducer (reducer.ts:708), measured.
  - What does NOT change: any state saved at >= 2.201 (the two steps do not run on it).
  - Cross-layer interaction: reducer post-load recompile passes (reducer.ts:704-940).
  - Side-effect safety vs other layers: no L/JjOM/canvas/sync file touched.

Smoke-test scenarios potentially affected:
  - open an existing current project -> identical (control run: conv 0, no loading screen)
  - save -> reopen -> identical state
  - a state without version -> no TypeError in VersionFixer; reducer failure expected (§4)
```

## §9 Test plan, one mutation per rule (item 6)

Vitest, mirror copies per R-IRN-20 (header naming `VersionFixer.tsx` and the three steps): the driver
loop of `update` (`:121-134`, without autocorrect and the tail loop), `'0 -> 2.1'`, `'2.1 -> 2.2'`,
`'2.2 -> 2.201'` fixed, and the **pre-fix** `'2.2 -> 2.201'` kept as a second copy for T5. The chain
is driven to 2.201 only. Fixtures: minimal synthetic states, plus the blobs imported from
`frontend/src/examples/` (data-only modules; that they import under vitest node is to be verified in
Phase 2, not assumed).

| Test | Rule | Mutant that must kill it |
|---|---|---|
| T1 | a state with no `version` runs `2.1 -> 2.2 -> 2.201` without throwing, ends at `n = 2.201` | M1: `'2.1 -> 2.2'` back to an empty `void` body |
| T2 | a state with `version.n = 0` enters at `'0 -> 2.1'` and ends at 2.201 | M1 (second entry path) |
| T3 | a state without `projects` passes `'2.2 -> 2.201'`, and the other loops still apply (`sealed = []`, `final = false` on classes) | M3: drop `|| []` on `projects` |
| T4 | a dangling pointer in `viewelements` is skipped, resolvable views still get `father = viewpoint` | M4: drop `if (!c) continue` on `viewelements` |
| T5 | on a well-formed 2.2 state the fixed step's output deep-equals the pre-fix copy's | M5: an over-eager guard (e.g. skip every `c`, or `[]` instead of `s.X`) |
| T6 | each of the 7 distinct blobs passes the mirror chain to 2.201 (a chain claim, not a load claim) | M1 kills 7/7, M3 the 4 without `projects`, M4 `conflictsimulation` |

Runtime, not vitest: the two probes re-run on 3001 after the fix (chain: no throw in `VersionFixer` for
7/7; load: failure at `reducer.ts:708`, as §8 states in advance), and the control project loading
unchanged. "The steps before and after the fix produce the same state on an already-current project"
is trivially true at 2.228 (no step runs; control `conv 0`); the non-trivial equivalence is T5.

The Phase 2 visual check as written ("each reachable example loads from the UI and renders") has no
subject: no example is reachable, and none loads after the two fixes. Proposed instead: one current
project still loads unchanged; and, if Q1 answers (a) or (b), the message appears on an unversioned
state (via the probe path, since no UI path exists).

## §10 Baseline gates (item 7, measured on `b297b5e11`, full output, exit status recorded)

- `npm run typecheck`: exit 2, **14** `error TS` lines — `Measurable.tsx` ×6, `api/data.ts` ×3,
  `Dashboard.tsx`, `ProjectEditor.tsx`, `ChatMessages.tsx`, `EditorV2.tsx`, `Dummy.ts`: the set the 1455
  entry records.
- `npx vitest run`: exit 1; `Test Files 9 failed | 175 passed (184)`, `Tests 4248 passed (4248)`. The 9
  red files fail at import with `ReferenceError: window is not defined` (8 through monaco:
  `context-binding` and 7 under `jjtl/__tests__/`; `UDComparator` through `PerformanceMetrics.ts:220`).
- `npm run build`: exit 0, only the chunk-size warning.

## Addendum 2026-09-24 (Phase 2) — `Log.exDev` throws

§1, third bullet, is wrong. It says `Log.exDev` "logs and does **not** throw" and that a missing
adapter surfaces as the destructuring TypeError at `:131`. Read in Phase 2, `Log.ts:146-152`:

```
    public static exDev(b: boolean, ...restArgs: any[]): null | never | any {
        if (!b) return null;
        ...
        Log.log('Dev Error','eDev', console.error, b, true, ...restArgs);
```

The fifth argument is `canthrow`; `Log.log` builds the error at `:113`
(`let exception: Error | undefined = (canthrow ? new MyError(prefixedstr, ...restArgs) : undefined);`)
and throws it at `:119` (`if (exception) throw exception;`). So a missing adapter throws its own
message at `VersionFixer.tsx:128` before `:131` runs, and the loop check at `:137` throws too. The
Phase 1 read had stopped at `:146-152` without following `Log.log`. The two defects and every
measurement of this report are unaffected: both failures were TypeErrors thrown before any
`Log.exDev` condition held. The Phase 2 test mocks `Log.exDev` as throwing, like the real one.
