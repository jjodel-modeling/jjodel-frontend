# Discovery 2026-10-12: release 3.1, L5, a 3.0.0 save pinned through the migration chain

- Start sha: **`4df0ef121e0f4109a7433f0071b0b1743714aebd`** (`docs: add prompts P-2026-10-12-0115/0116`).
- Prompt-ID: P-2026-10-12-0116 (`docs/prompts/claude_2026-10-12_0116_prompt_release_3_1_fixture.md`). Chat
  C-2026-10-11-1812. Session `d8879287-d85b-4744-a90e-ff5381cee192`.
- Tree: `~/jjodel-w-rel31-fixture`, branch `rel31-fixture`, `frontend/node_modules` symlinked to `~/jjodel/frontend/node_modules`.
- Executor: Claude Opus 5.5 (`claude-opus-5-5`), unattended.
- Tags: **M** measured by a command run in this lane, **R** read in a file.

## 0. Answer in brief

**A project saved by 3.0.0 opens on this tree, and the path is now measured.** The fixture was exported by a real 3.0.0
build (`git archive 3.0.0`, which is `cb699ad58`, dev server on 3145) with File → «Download Project». It reads `2.228`.
It is committed as `frontend/src/redux/__tests__/fixtures/save_3_0_0.jjodel` (`adfb2241b`) (M).

**The test (M):** `frontend/src/redux/__tests__/versionfixer_3_0_0_save.test.ts`, 10 of 10. The real `VersionFixer` takes
the fixture from 2.228 to `get_highestversion()` (2.230 today, read, not written) through `[2.228, 2.229]`. The ten
primitives of 3.0.0 keep their ids, records and order, and Expression and Action follow EDouble. `aDouble` still points
at EDouble and holds 3.25. Every saved record is unchanged. Instances and references keep their counts: 2 objects,
12 values, 1 reference, `alice.home = home1`, and both edges. A chain without the 2.229 → 2.230 adapter throws
`missing version adapter from "2.23"` on a 2.230 save and still opens the 3.0.0 save to 2.229 (the control). **Mutation
bench: 8 of 8 killed**, including three mutants of the 2.228 → 2.229 step (§3).

**Browser (M), this tree on 3146:** Import Project, then open. No load error (`ProjectsApi.loadError` null), no page
error, store at 2.23 with conversion list `[2.228, 2.229]`, model_1 drawn with 2 nodes and the `home` edge, every value
shown. Crop: `~/.jjodel-lanes/P-2026-10-12-0116/fixture_3_0_0_on_3146.png`. 9 of 9 checks.

**One premise of the prompt does not hold:** a 3.0.0 save stores **no** `DViewElement`. A project born on 2.226 or
later keeps its default views built in, not in the save. This holds for this fixture and for the six 2.229 saves of
`scripts/probe/fixtures` (M). So there is no stored migrated default view to keep, and `isMigratedDefaultView` has
nothing to answer for here. The test pins what rule 14 can mean on this save: no view is stored or written, no
`jsxString` is rewritten, and the tail hands `updateDefaultView` the default viewpoint alone (§2.3).

**Gates (M):** typecheck 14 errors, the §17 set; vitest 9036 of 9036 tests, with the 9 known import reds; build exit 0;
check:scripts PASS; check:docs in §5.

**Decisions awaiting Alfonso:** D1, whether to also pin a save that does carry a migrated default view (§7).

**Questions**
1. Add a second fixture: an older project (pre-2.226, classic views) opened in 3.0.0 and saved there, so that rule 14's
   kept-view case is pinned on a real 3.0 save? Recommended: yes, as its own small lane after the 3.1 cut. The 3.0 → 3.1
   path is shown without it, and this lane's scope names one fixture.

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|------------|---------|----------|
| H1 | A 3.0.0 export reads 2.228 | holds (M) | the decompressed `state.version.n` is 2.228, `conversionList` [] (§2.1) |
| H2 | The chain takes it to the highest version through every step after 2.228 | holds (M) | conversion list `[2.228, 2.229]`, n = highest; mutant M5 kills it |
| H3 | Primitives keep their identity after EDouble | holds (M) | `primitiveTypes` = the ten saved ids + Expression, Action; every attribute keeps its type id; M1, M3, M4 kill it |
| H4 | The migrated default view is kept | **premise false (M)**: no stored view exists in a 3.0.0 save | §2.3 |
| H5 | Instance and reference counts are unchanged | holds (M) | DObject 2, DValue 12, DReference 1, DAttribute 11, DVertex 4, DEdge 2, DModel 2 before and after; M6 kills it |
| H6 | A build without the 2.229 → 2.230 step refuses a 2.230 save | holds (M) | trimmed chain throws; the same chain opens the 2.228 save to 2.229; M8 kills it |
| H7 | The save opens on this tree's dev server without a load error | holds (M) | §4 |

## 2. The fixture

### 2.1 How it was produced (M)
- `git archive 3.0.0 frontend | tar -x -C /tmp/jjodel-300-fixture`. The tag `3.0.0` resolves to `cb699ad58`. The
  `frontend/package.json` dependencies match this tree's, so `node_modules` is a symlink to `~/jjodel/frontend/node_modules`.
- 3.0.0's `vite.config.ts` sets no `cacheDir`, so it would write `node_modules/.vite`, the shared cache. A wrapper
  `vite.fixture.config.ts` in the `/tmp` copy sets `cacheDir` to the copy's own `.vite-cache` and the port to 3145
  (P14). The repo is not touched.
- Driver: `frontend/scripts/smoke/_tmp_rel31_fixture_300.ts` (gitignored), Playwright, seed of `scripts/smoke/states.ts`
  (offline user, Advanced mode). Through the UI: New Project on the dashboard (`Fixture300`), the «New metamodel» button,
  and File → «Download Project», a real menu click whose browser download was saved. Through the 3.0.0 runtime, the
  probes' way (`bpmn-lanes-fixture.ts`): `addClass`, `addAttribute(name, primitiveId)`, `addReference`, `createM1`,
  `syncCreateObject`, `syncSetReferenceValue`, and `$attr.value` writes.
- Content: metamodel_1 with **Person** (`aChar` EChar, `aString` EString, `aDate` EDate, `aBoolean` EBoolean, `aByte`
  EByte, `aShort` EShort, `aInt` EInt, `aLong` ELong, `aFloat` EFloat, `aDouble` EDouble, reference `home` → Address)
  and **Address** (`street` EString). model_1 holds `alice : Person` (aString hello, aBoolean true, aInt 42, aLong 7,
  aFloat 1.5, aDouble 3.25, home = home1) and `home1 : Address` (street «Via Vetoio»). The default views are untouched.
  EVoid is not among 3.0.0's `primitiveTypes`, so it has no attribute.
- The file: 52562 bytes, sha256 `2b41c9198d044b101b3b9fbff3b3f53bddb46c9c7aff9ff660a772d9962d721e`, byte-identical to
  the download. It is the raw `DProject` with the store in `state`, compressed by `async-lz-string`
  (`U.compressedState`, `common/U.tsx:427` at 3.0.0), plus `megamodel` 1.0. Decompressed: `version.n` 2.228. The
  records: DUser 1 (`Pointer_OfflineUser`, every field «Unknown»), DProject 1, DClass 13 (10 primitives, EObject,
  Person, Address), DViewPoint 1, DModel 2, DGraph 4, DPackage 1, DVertex 4, DAttribute 11, DReference 1, DEdge 2,
  DObject 2, DValue 12. **DViewElement 0**, `viewelements: []`.
- Page errors during the build: none. Console errors: two «504 Outdated Optimize Dep» (the cold vite cache), «wrong
  project setup in navbar» on the dashboard and three 403s (offline). None comes from the project.

### 2.2 Fixtures convention (R)
Per-area `__tests__/fixtures/` folders already exist: `src/__tests__/fixtures/xmi-m1/` and
`src/components/editor-v2/sim/__tests__/fixtures/`. The prompt's path follows that convention. The `.jjodel` saves
under `scripts/probe/fixtures/` serve the browser probes, not vitest.

### 2.3 Default views in a 3.0.0 save (M, R)
- No `DViewElement` in this save, and none in the six 2.229 saves of `scripts/probe/fixtures` (M, decompressed). The
  save is a straight copy of the store (`U.compressedState`), so the 3.0.0 store held none either.
- The one view record is `Pointer_ViewPointDefault`, `version` 2.228, no `clonedCounter`. `update()`'s tail
  (`VersionFixer.tsx:145-154`) hands it to `LViewElement.updateDefaultView`. That function returns at once
  (`view/viewElement/view.tsx:2007-2008`), because `Defaults.defaultViewPointsMap` maps ids to `true`
  (`common/Defaults.ts:93`), the R-IRN-15 case. So the record stays at 2.228 after the load (M on 3146:
  `viewpointVersion` 2.228), and the tail visits it again, as a no-op, at every load. This is known behaviour, not a
  finding of this lane.
- The 2.225 → 2.226 inverse migration (`VersionFixer.tsx:1098-1145`) is what writes `ir.migratedFrom: 'classic-default'`
  and `migratedHash`. Only a project born before 2.226, with stored classic views, carries one. A fresh 3.0.0 project
  never does.

## 3. The test (`frontend/src/redux/__tests__/versionfixer_3_0_0_save.test.ts`, new, 200 lines)
- The real class. The joiner barrel is mocked as in `versionfixer_old_states.test.ts` (copied, not imported: a `vi.mock`
  factory is per file). One difference: `LViewElement.updateDefaultView` records the ids it receives (`vi.hoisted`).
- The fixture is read as the open reads it: `JSON.parse` of the file, then `async-lz-string`'s `decompressFromUTF16` of
  `state`, the same as `codegen/examples/__tests__/importable.test.ts:41`. Each test takes a fresh copy, because
  `update()` writes in place.
- Nothing is hard-coded about the chain. `HIGHEST = VersionFixer.get_highestversion()`; the expected path is walked from
  the registered adapters. The second case removes the adapter whose target is `HIGHEST`, so it names itself
  «2.229 -> 2.230» today. Like the existing tests, it reaches the private statics `versionAdapters` and
  `highestVersion` through `any`. It swaps them and restores them in a `finally`. A subclass would not work: `update()`
  reads `VersionFixer.versionAdapters` by class name, not through `this`.
- What pins the 2.228 save to a version: `the file is a 3.0.0 export` (n = 2.228). The test of whole records is exact:
  every saved record is deep-equal before and after, and the key set grows by `Pointer_EXPRESSION` and
  `Pointer_ACTION` only. A future step that writes the 3.0 state turns it red on purpose.

### 3.1 Mutation bench (M)
Each mutant was one string replacement in `frontend/src/redux/VersionFixer.tsx`, written by a node script
(`/tmp/jjodel-l5-bench/bench.mjs`). The test file ran after each, then `git checkout HEAD -- frontend/src/redux/VersionFixer.tsx`
restored it. After the bench, `git diff HEAD --stat` on the file was empty. The bench ran twice, the second time
after the test names were aligned with its result; both runs gave the same verdicts.

| mutant | where | red / 10 | tests that died |
|---|---|---|---|
| M1 ids prepended (`[id, ...list]`) | 2.228 → 2.229 | 1 | primitives order |
| M2 body dropped (`return s` first) | 2.228 → 2.229 | 3 | records, primitives order, Expression/Action |
| M3 records copied from EDouble | 2.228 → 2.229 | 1 | Expression/Action (their `pointedBy` names `idlookup.<aDouble>.type`) |
| M4 `classs` not written | 2.228 → 2.229 | 1 | primitives order |
| M5 loop stops below 2.229 | `update()` | 2 | path to highest, trimmed chain (control) |
| M6 a live edge end read as dead | load purge | 2 | records, instances and references |
| M7 the 2.229 step writes the default viewpoint's `jsxString` | 2.229 → 2.230 | 2 | records, views (rule 14) |
| M8 a missing adapter tolerated (`break`) | `update()` | 1 | trimmed chain |

Two tests are declared, not killed alone, and their names say so. «every attribute keeps its own primitive»: no mutant
of the bench retypes an attribute, and an overwrite of a primitive record is caught first by the records test. «a second
update changes nothing»: no mutant reaches it. The fixture's own precondition test is not a bench subject.

## 4. Browser check, this tree on 3146 (M)
`~/.local/bin/node frontend/scripts/lane-run.mjs probe ~/jjodel-w-rel31-fixture frontend/scripts/smoke/_tmp_rel31_fixture_open.ts --port 3146 --id P-2026-10-12-0116`.
Log: `~/.jjodel-lanes/P-2026-10-12-0116/probe-_tmp_rel31_fixture_open.log`, `EXIT=0`. JSON:
`~/.jjodel-lanes/P-2026-10-12-0116/fixture_open_3146.json`. Fresh context, Advanced mode, light theme.

| check | result |
|---|---|
| File → «Import Project» with the fixture | one project more, «Fixture300 copy» |
| version read | file 2.228; store after open `{n: 2.23, conversionList: [2.228, 2.229]}` |
| load errors | `ProjectsApi.loadError` null; page errors none; console errors `init_dash` only (dashboard, before the import) |
| counts | DObject 2, DValue 12, DReference 1, DAttribute 11, DVertex 4, DEdge 2, DModel 2, DViewElement 0, DViewPoint 1 |
| primitives | EChar … EDouble, Expression, Action; `aDouble:EDouble`, value [3.25]; `home` = home1's id |
| canvas of model_1 | 2 nodes («alice : Person» with every value, «home1 : Address»), 1 edge |

Crop: `~/.jjodel-lanes/P-2026-10-12-0116/fixture_3_0_0_on_3146.png` (canvas and right rail, 1238×776). The vite of 3146
was started and stopped by `lane-run probe`. Its config is `frontend/scripts/smoke/_tmp_lane_vite_3146.config.ts`,
gitignored and left on disk.

## 5. Gates (M, foreground, this tree)

| gate | result |
|---|---|
| `npm run typecheck` | exit 2, 14 errors, the §17 set (by file and code: data.ts TS2304×2 + TS2322, Dummy.ts TS2307, EditorV2.tsx TS2339, Measurable.tsx TS2552 + TS7053×4 + TS2345, ChatMessages.tsx TS2322, ProjectEditor.tsx TS2769, Dashboard.tsx TS2339) |
| `npx vitest run` | 371 files: 362 passed, 9 failed = the §17 import reds; **9036/9036 tests**; load 7.3 |
| `npx vitest run src/redux/__tests__/versionfixer_3_0_0_save.test.ts` | 10/10 |
| `npm run build` | exit 0; only the chunk-size notice |
| `npm run check:scripts` | PASS, 89 files (the three `_tmp_` files of this lane included) |
| `npm run check:docs` | run after this report and the inbox entry; result in the log entry |

## 6. Files read
`CLAUDE.md`; `frontend/src/redux/CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`; `docs/PROTOCOL.md` (whole);
`docs/claude-code-log.md` (head); `docs/log-inbox/release-3-1-drag.md`; `docs/discovery/discovery_2026-10-12_rel31_drag_hardening.md`;
`docs/discovery/discovery_2026-10-11_release_3_1_scope.md` (§0, §3.1-§3.6, §8 rows); `frontend/src/redux/VersionFixer.tsx`
(1-240, 1085-1403); `frontend/src/redux/__tests__/versionfixer_old_states.test.ts` (whole), `versionfixer_2229_migration.test.ts`
(1-140), `versionfixer_2230_migration.test.ts` and `versionfixer_load_purge.test.ts` (test names);
`frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (1-40, 280-365); `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`
(95-130); `frontend/src/view/viewElement/view.tsx` (2005-2035); `frontend/src/common/Defaults.ts` (91-109);
`frontend/src/components/topbar/SaveManager.ts` (28-60); `frontend/src/redux/reducer/reducer.ts` (1570-1640);
`frontend/src/codegen/examples/__tests__/importable.test.ts` (1-80); `frontend/scripts/probe/bpmn-lanes-fixture.ts` (1-40, 180-335);
`frontend/scripts/probe/statechart-fixture.ts` (1-200); `frontend/scripts/probe/codegen-examples.ts` (1-175, 290-340);
`frontend/scripts/smoke/states.ts` (170-222, 526-540); `frontend/scripts/lane-run.mjs` (1254-1340); `frontend/vitest.config.ts`.
At 3.0.0 (`/tmp/jjodel-300-fixture/frontend`): `vite.config.ts`, `package.json`, `src/pages/components/Navbar.tsx`
(97-120, 1347-1381), `src/common/U.tsx` (420-445, 3322-3347), `src/model/logicWrapper/LModelElement.tsx` (3255-3285),
`src/components/editor-v2/sync/canvasToJjom.ts` (1371-1385, 1525-1545).

## 7. Dependencies and risks
- The records test is exact on purpose. The R-IRN-19 purge of the default records takes the first free number when
  it is scheduled (R-SIM-46, `docs/decisions.md:1961`; `VersionFixer.tsx:1283-1284`), 2.231 today since 2.230 is
  taken. When it lands, it will turn this test red, and the expected key set will need its removals: the pin working,
  not a defect.
- The second case reaches two private statics through `any`, as the existing VersionFixer tests do. If `update()` ever
  reads them through `this`, or `setup()` re-runs inside `update()`, the swap stops holding. The control assertion
  (the trimmed chain still opens the 2.228 save to 2.229) fails loudly then; it does not go silently green.
- The fixture was built through the 3.0.0 runtime's L-API, with the UI used for New Project, New metamodel and the
  export. A save produced by hand gestures could differ in fields the L-API does not write (sizes, layout). The open on
  3146 shows that the shape the chain receives is the shape a 3.0.0 user saves.
- Rule 14's kept-view case is not covered by this fixture (§2.3, D1).
- The bench wrote `VersionFixer.tsx` through a node script, not through the Edit tool, so the critical-zone hook did not
  see the writes. Each write was restored at once, and the empty diff is in §3.1.
- Leftovers outside the index: `/tmp/jjodel-300-fixture` (the 3.0.0 copy, its `node_modules` symlink, the raw download
  and the build screenshots), `/tmp/jjodel-l5-bench` (bench script and gate outputs), and the three gitignored `_tmp_`
  files under `frontend/scripts/smoke/`. Servers 3145 and 3146 are stopped.

## Decisions taken (unattended)
1. **Fixture built through the 3.0.0 runtime plus three real UI gestures.** New Project, New metamodel and «Download
   Project» are clicks. Classes, features, the model and its values go through the 3.0.0 L-API, as the trunk's fixture
   probes do. Clicking every class and attribute in 3.0.0's canvas would have cost far more and pinned nothing more for
   the chain.
2. **Own Vite cache for the 3.0.0 copy**, through a wrapper config in `/tmp`, because 3.0.0 writes the shared
   `node_modules/.vite` (P14).
3. **«The migrated default view is kept» read as «no view is stored or written, the tail visits the viewpoint
   alone»**, because a 3.0.0 save stores none (§2.3). The finding goes in §0 and D1. It is not a migration failure: the
   save migrates cleanly, so the prompt's stop-with-question condition does not apply.
4. **The chain's last step derived from `get_highestversion()`**, not written as 2.229. The test keeps its meaning («a
   build one step behind refuses the newer save») when 2.231 lands.
5. **Private statics swapped and restored** for the trimmed chain. The existing tests read them the same way, and a
   subclass cannot work (§3).
6. **Bench by transient source mutation**, restored and verified, even though the prompt forbids editing `VersionFixer.tsx`.
   The rule against editing is about the lane's deliverable; the bench is the way §5 and P11 prove that a test fails
   on a mutation, and nothing of it is committed.
7. **Commit types** `test(redux):` for the test and fixture, `docs:` for this report and the entry. The prompt names
   none (P6).
8. **Status line of the prompt not flipped.** Sibling lanes L1-L3 left it to the chat after the merge (`b33f36487`), and
   the prompt's scope lists the test, the fixture, the report and the inbox only.

## Decisions awaiting Alfonso
- **D1** — Pin a second 3.0 save that carries a migrated default view (an old project opened and saved in 3.0.0)?
  Recommended: yes, as a small lane after the 3.1 cut (§0, question 1).
