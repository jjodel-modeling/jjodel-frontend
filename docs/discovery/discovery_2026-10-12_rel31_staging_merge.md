# Merge report 2026-10-12: `origin/staging` into the release 3.1 line (P-2026-10-12-0010, L1)

- Prompt-ID `P-2026-10-12-0010`, chat `C-2026-10-11-1812`, front `release-3-2`, lane full (critical zone), session
  `dc741383-567a-4c92-bbbd-6388a68129c5`
- Tree `~/jjodel-w-rel31-staging`, branch `rel31-staging`; start `5f25112c4`, LIR `53b398970`, merge `c36e49d87`
- **Staging sha merged: `cb595287622bed042ef3297930c6851a4ca62a88`** (after `git fetch origin` on 2026-10-12; the tip
  the 1812 report saw). Merge base `799e9f50a`; 110 commits on the staging side, 547 on this side.
- Layer Impact Report: `docs/discovery/discovery_2026-10-12_rel31_staging_lir.md` (`53b398970`, before the merge)
- Artefacts outside every tree: `~/.jjodel-lanes/P-2026-10-12-0010/` (probe output, crops, bench, smoke runs)

## 0. Answer in brief

**The 3.1 line now opens 2.229 and 2.230 saves; every gate is at its baseline; no new red.**

1. Merge `c36e49d87` (`--no-ff`, parents `53b398970` and `cb5952876`). Three text conflicts resolved, both sides kept:
   `Jodie.tsx` (one import each), `defaultPrompts.ts` (both bumped the chat prompt to 6; union is v7), `docs/decisions.md`
   (union, 119 staging lines all present, 0 trunk lines dropped). One merge artefact: the trunk test that pinned 6 now
   pins 7. Clean but both-sided `parser.ts`, `registry.ts`, `AISettingsContent.scss`: both behaviours survive (§2).
2. Probe on this tree's dev server (3141), 16/16: `scene_2_DemoPetri.jjodel` (file 2.229) loads with no load error,
   store version 2.23 via `conversionList [2.229]`, 13 nodes and 12 edges; exported by File → «Download Project» as
   format 2.230, reloaded: no load error, same counts, crop byte-identical to the 2.229 one (§4).
3. Gates (§3): typecheck 14, the same set; vitest 9022 tests, 9018 passed, 4 failed (`criticalZone.test.ts`, the
   known env-leak ticket, 70/70 with the variable unset), 10 failed files = those plus the 9 known import reds, exactly
   as before the merge; build exit 0; smoke GREEN 12/12 on the second run (first run: the first state's `page.goto`
   timed out on the cold server); `check:codegen-lazy` 3/3; `check:docs` exit 0.
4. Load purge and 2.230 step on every tracked save (8 `.jjodel`, the real functions): 0 records purged, 0 instances
   listed by the step (13 nested instances, all already listed); a positive control shows the bench sees both (§5).
5. **Ticket:** the reservation at `VersionFixer.tsx:1193` («the first free number after 2.229», R-IRN-19) is now
   **2.231**. No code edited; ticket in `docs/log-inbox/release-3-1.md`.

**Decisions awaiting Alfonso**
- **D-A1** (visual risk, LIR §3 R2 A1): after the 2.230 step, a nested instance made by «Add» gets a Step 2bis vertex
  at a top-level grid cell; under a graphVertex container (this side's R-GV) the hull or `self` frame stretches to
  reach it until Auto layout. 0 such instances in the tracked saves; not reproduced in a browser. Recommended: ship,
  add one RC-23 item on a project with «Add» children under a graphVertex container, and open a maintenance lane if it shows.
- **D-A2** (chat prompt version): v7 with staging's v5/v6 notes and the trunk's reserved-words note as v7.
  Recommended: keep v7 (the file's own bump rule).
- **D-A3** (outward, informative): saves written by 3.1 are format 2.230; app (2.229) cannot open them until 3.1
  reaches production, as with beta today. Recommended: ship 3.1 to production without a long gap after beta.

**Questions**: none blocking. Status line of the prompt not flipped (NON FARE; the chat flips it after the visual GO).

## 1. Hypotheses this lane falsifies, and the verdicts

| hypothesis | verdict |
|---|---|
| H1 the merge resolves with text edits only in the three conflicted files | true, plus one test pinned to the old prompt version (merge artefact, §2.2) |
| H2 staging's load purge removes records this side's graph code keeps | false on the code (LIR §3 R1, read) and on every tracked save (§5, run: 0 removed) |
| H3 `objects` listing nested instances breaks a trunk-only consumer | false for data; one visual risk under graphVertex containers (LIR §3 R2 A1), not measured in a browser |
| H4 the merged build opens a 2.229 save and a 2.230 save | true (§4, 16/16) |
| H5 the merge adds a typecheck error or a vitest red | false (§3) |

## 2. Conflicts and how each was resolved

### 2.1 `frontend/src/components/Jodie/Jodie.tsx`
Conflict at the imports only (`git merge-tree`, lines 40-44): this side `import { gateReply } from './reservedIdentifierGate';`,
staging `import { consumerHelpText } from './consumerVoice';`. Both kept, in that order. Everything else merged by git.
Both behaviours on the merged file (`command grep -n`): the reserved-names gate on both reply paths,
`Jodie.tsx:734` and `:779` `const gated = await gateReservedIdentifiers(entries, ...)`; #168 consumer mode, `:221`
`if (isConsumerMode()) return consumerContextBundle(project as LProject);`, `:451`, `:536` `consumerHelpText()`, `:583`,
`:640`, `:729` and `:776` `ragInitialized: ragInitialized && !isConsumerMode()`. In the consumer the gate still runs
on the reply (its repair turn sees the consumer's filtered context and no RAG): both sides' rules apply together.

### 2.2 `frontend/src/constants/defaultPrompts.ts`
Both sides changed the chat prompt text and bumped `DEFAULT_PROMPT_VERSIONS.chat` from 5 to 6, with different
changelogs: this side `{ version: 6, note: 'List every JjScript reserved word ...' }`; staging rewrote the v5 note
(«Two parallel v5 lines») and added `{ version: 6, note: 'Join the two v5 lines ...' }`. The prompt text merged
clean and holds both: rule 8 from the lexer list (`:165` `- commands: ${RESERVED_WORD_GROUPS.commands}`), staging's
single-valued `set` (`:260` «a new \`set\` on it REPLACES the previous target») and `## END-USER MODE` (`:318`).
Resolution: staging's v5 and v6 entries kept as written (beta shipped them), this side's note appended as
`version: 7`, and `version: 7`. The file's bump rule (`:21-27`) asks for a new version when the text changes, and the
merged text is neither side's v6. Merge artefact: `frontend/src/components/Jodie/__tests__/reservedIdentifierGate.test.ts:177-181`
pinned `toBe(6)`; now `toBe(7)` and the title says 7. Alternative not taken: keep 6 with two v6 entries, no test edit.

### 2.3 `docs/decisions.md`
One conflict block: this side's `## R-GEN` and `## R-GV` sections against staging's `## R-NEST`. Union: this side's
block, a blank line, staging's block, markers removed. Checks: `git diff HEAD -- docs/decisions.md` +119 −0 before the
commit; each of the 119 non-empty lines staging added since the merge base is present verbatim (`command grep -qxF`,
0 missing). No id collision: staging adds R-JS-12..15 and R-NEST-1..9, none present on this side (this side's last is
R-JS-11; control R-GEN-1 found).

### 2.4 Clean merges re-read, both behaviours survive
- `frontend/src/jjscript/parser/parser.ts`: this side's do-block fixes (`blockDepth`, `strict`, `parseBlockBody(opener,
  requireEnd)`, `:1089` «Unexpected '...' in ${opener} block») and #175 (`:311`, `:388`, `:594`, `:643`) are in
  different methods. Run: `parser.test.ts` 118, `parserTermination.test.ts` 44, `reservedIdentifiers.test.ts` 10, all
  green; a combined probe (`parser_combo.txt` in the lane folder): a bare instance name and a quoted rename inside a
  `do ... end` block parse; a strict `do` without `end` gives «Expected 'end' to close do block»; a stray token after
  an instance, inside a block or not, gives #175's «Unexpected 'Bob' after the instance».
- `frontend/src/events/registry.ts`: this side removed `THEME_CHANGED` and added `EXPERIMENTAL_CODEGEN_CHANGED` in
  `JjodelEvents`; staging added `CONFIGURATOR_SELECTION_CHANGED` and `CONFIGURATOR_SELECT_INSTANCE` in `EnvGenEvents`.
  All three present, `THEME_CHANGED` absent and referenced nowhere in `src` (`git grep`, empty; control: the three new keys, 3).
- `frontend/src/components/settings/AISettingsContent.scss`: this side removed the dark block (−244), staging added
  `.provider-notice` (`:302`, used at `AISettingsContent.tsx:387`). Both hold; staging's comment above it still
  mentions «dark block at the end of file», which no longer exists (stale comment, left as written).

No other edit rides on the merge commit: the index held staging's 112 files plus the one test, and the merged text
differs from staging's only in the seven files above (`git diff --quiet origin/staging -- <f>` per staged file).

## 3. Gate table (foreground, this tree)

| gate | before the merge (`5f25112c4`, src = `c7575bcf7`) | after (`c36e49d87`) |
|---|---|---|
| `npm run typecheck` | exit 2, 14 errors, the §17 set | exit 2, 14 errors, identical set modulo line numbers (`diff`, empty) |
| `npx vitest run` | 359 files, 8711 tests: 8707 passed, 4 failed; 10 failed files | 369 files, 9022 tests: 9018 passed, 4 failed; 10 failed files |
| the 10 failed files | the 9 known import reds (§17) + `scripts/hooks/__tests__/criticalZone.test.ts` (4) | the same 10 |
| `npm run build` | 1812 report: exit 0 | exit 0, only the chunk-size warning (plus Sass `@import` deprecations) |
| `npm run smoke` (`SMOKE_URL=http://localhost:3141`) | 1812 report: GREEN 12/12 on 3131 | run 1 RED: `empty-project` NOT REACHED, «page.goto: Timeout 30000ms exceeded» on the cold server, the other two states PASS; run 2 GREEN, 12 passed, 0 failed, 3 skipped |
| `npm run check:codegen-lazy` | 1812 report: 3/3 | ALL GREEN 3/3 (only `src/codegen/setting.ts` eager; 19 generator modules in the lazy `CodePanel` chunk) |
| `npm run check:docs` | — | exit 0, 5/5 (after this report and the inbox entry; no warning on the new entries) |
| `npm run check:addonly -- c36e49d87` (not asked, RC-34) | — | exit 0, 1 commit clean |

- Against the prompt's 8692: the 1812 report counted 8692 on `c7575bcf7`; the 39 commits since touch no `src` file
  and add 21 `it(` lines to `scripts/hooks/__tests__/laneBoardRequirements.test.ts` and `reqTrace.test.ts`, hence
  8711 before the merge. Staging adds 311 tests in 10 files. New reds from staging: **none**.
- The 4 `criticalZone.test.ts` reds are the ticket of 2026-10-01 («reads the ambient go-ahead variable»): this session
  runs with `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-10-12-0010`; `env -u JJODEL_CRITICAL_ZONE_GOAHEAD npx vitest run
  scripts/hooks/__tests__/criticalZone.test.ts` gives 70/70 before the merge.
- Staging's and this side's test files for the touched areas, by name, after the merge: `versionfixer_2230_migration`
  14, `versionfixer_load_purge` 21, `versionfixer_2229_migration` 18, `versionfixer_old_states` 25, `consumerProposal`
  49, `consumerVoice` 19, `permissionGuard` 69, `m1Operators` 25, `instanceDelete` 8, `referenceWrite` 29,
  `m1Containment` 28, `formPermissions` 14, `consumerJodieContext` 26, `deleteDraw` 19, `reservedIdentifierGate` 20,
  `AIProviderService` 16: all green.
- Smoke run 1 is environmental (cold Vite server, first navigation over 30 s); run 2 changed nothing in the tree.
  Both outputs kept: `smoke_run1.txt`, `smoke_run2.txt`.

## 4. Probe: a 2.229 save and a 2.230 save in the browser

`staging-load.ts` (kept as `staging-load.ts.txt` in the lane folder; run from `/tmp/rel31stg`, outside the tree),
Playwright, offline user seeded as the smoke does, dev server of this tree on 3141, one fresh context per save.
Import by `ProjectsApi.importFromText`, open by `/?open=<id>#/project?id=<id>`, the M1 model by `DockManager.open2`.

| | 2.229 | 2.230 |
|---|---|---|
| file | `frontend/scripts/probe/fixtures/scene_2_DemoPetri.jjodel` (tracked) | its export by this build, File → «Download Project» (`scene_2_DemoPetri_2230.jjodel` in the lane folder) |
| version read in the file (`state.version`, decompressed) | `{"n":2.229,"conversionList":[]}` | `{"n":2.23,"conversionList":[2.229]}` |
| version in the store after load | `{"n":2.23,"conversionList":[2.229]}`: the 2.230 step ran | `{"n":2.23,"conversionList":[2.229]}`: no step, already highest |
| `ProjectsApi.loadError` | `null` | `null` |
| idlookup | DObject 13 (nested 0), DVertex 18, DEdge 17, DGraph 4 | the same |
| canvas of `demoNet` | 13 nodes, 12 edges | 13 nodes, 12 edges |
| page errors | none | none |
| console errors | `init_dash` (in `scripts/smoke/console-baseline.json:36`, printed by `redux/store.tsx:240`) | the same |
| crop | `probe/crop_2229.png` | `probe/crop_2230.png`, byte-identical (`cmp`, md5 `eb6a1f45…`) |

No `[VersionFixer` console line in either load: the step prints only when it lists or deduplicates something, the
purge only when it removes something, and the bench (§5) measures 0 for both on this file.

Limit: the 2.230 save is written by this build, not by beta. This build's `VersionFixer.tsx` is staging's text
verbatim (one-sided file), so the writer of the format is the same; a save carrying beta-only data shapes would come
from code that is now also in this build. No 2.230 fixture exists on staging (`git diff --diff-filter=A` of
`*.jjodel`/`*.json` on the staging side: empty).

## 5. Bench: the real step and purge on every tracked save

A temporary test (`frontend/scripts/smoke/_tmp_rel31_purge.test.ts`, gitignored, removed after the run; copy as
`bench_purge.test.ts.txt` in the lane folder) imports the real `VersionFixer` with the joiner barrel mocked as in
staging's `versionfixer_load_purge.test.ts`, decompresses each file's state, runs the version chain from the file's
version, then `purgeDeadGraphElements`. Output in `bench_purge.txt`.

| save | version | DObject (nested) | listed by 2.230 | purge removed |
|---|---|---|---|---|
| `scripts/probe/fixtures/jjscript-m1-esm.jjodel` | 2.229 → 2.23 | 0 (0) | 0 | 0 |
| `scripts/probe/fixtures/scene_1_DemoPEST.jjodel` | 2.229 → 2.23 | 11 (5) | 0 | 0 |
| `scripts/probe/fixtures/scene_2_DemoPetri.jjodel` | 2.229 → 2.23 | 13 (0) | 0 | 0 |
| `scripts/probe/fixtures/scene_3_DemoESM.jjodel` | 2.229 → 2.23 | 10 (4) | 0 | 0 |
| `scripts/probe/fixtures/scene_4_DemoFlowB.jjodel` | 2.229 → 2.23 | 17 (0) | 0 | 0 |
| `scripts/probe/fixtures/tree-crossing.jjodel` | 2.229 → 2.23 | 0 (0) | 0 | 0 |
| `public/examples/codegen/petri-producer-consumer.jjodel` | 2.229 → 2.23 | 32 (0) | 0 | 0 |
| `public/examples/codegen/turnstile.jjodel` | 2.229 → 2.23 | 10 (4) | 0 | 0 |

Positive control (P12), same bench: DemoPetri with one instance removed from its model's `objects` and one `DVertex`
removed from every `subElements` → «unlisted after mutation 1; relisted by 2.230 true; vertex ... gone true; purge
removed 5» (the vertex and what only it lists). The zeros above are a measurement, not a blind bench.

## 6. Files read (full paths under `/Users/alfonso/jjodel-w-rel31-staging/`)
`CLAUDE.md`, `frontend/src/redux/CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md`,
`docs/claude-code-log.md` (head), `docs/log-inbox/release-3-1.md`, `docs/discovery/discovery_2026-10-11_release_3_1_scope.md`
(§0, §3, §8, §10, decisions); staging's `docs/lir/lir_2026-10-10_174_load_purge.md`; both sides' diffs of
`frontend/src/redux/VersionFixer.tsx`, `frontend/src/model/logicWrapper/LModelElement.tsx`,
`frontend/src/model/conformance/ConformanceValidator.ts`, `frontend/src/components/editor-v2/hooks/deleteDraw.ts`,
`frontend/src/components/editor-v2/viewpoint/ir/{IRForm.tsx,IRFormField.tsx,formWrite.ts,formPermissions.ts,widgets/ListWidget.tsx}`,
`frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/constants/defaultPrompts.ts`, `frontend/src/jjscript/parser/parser.ts`,
`frontend/src/events/registry.ts`, `frontend/src/components/settings/AISettingsContent.scss`;
`frontend/src/components/Jodie/reservedIdentifierGate.ts` (header), `frontend/src/components/Jodie/__tests__/reservedIdentifierGate.test.ts`,
`frontend/src/redux/store.tsx:95-112`, `frontend/src/redux/VersionFixer.tsx:100-140`, `:1193-1194`,
`frontend/src/joiner/classes.ts:1153`, `frontend/src/components/editor-v2/hooks/useJjomSync.ts:743-757`,
`frontend/scripts/smoke/states.ts:179-191`, `frontend/scripts/examples/build-codegen-examples.ts` (download flow),
`frontend/src/codegen/examples/__tests__/importable.test.ts:1-45`. The LIR §3 citations are two subagents' reads.

## 7. Dependencies and risks
- PR #184 (`staging-dam-merged`) is still open (`gh pr view 184`: `OPEN`, `mergedAt: null`). If it lands on staging
  before the cut, the chain `2.229 -> 2.2291 .. -> 2.230` it writes conflicts with the step merged here, and the
  reservation moves again. D2 of the 1812 report stands.
- LIR §3 R2 U1-U3 are output changes, not defects: more `containment:unclaimed:*` problems where «Add» siblings gain
  vertices; a nested object-as-edge with unresolved ends drawn as a node; a container-to-child reference edge under
  a plain vertex. None measured in a browser; none present in the tracked saves (0 instances listed by the step).
- The merge commit carries docs and code together, the RC-14 exception, declared in its body.
- Temporary material outside the tree: `/tmp/rel31stg/` (probe copy, `node_modules` symlink to
  `/Users/alfonso/jjodel/frontend/node_modules`, typecheck and vitest outputs), left in place. The 3141 dev server was
  started and stopped by this session. `git status` of the tree empty before the report.

## Decisions taken (unattended)
1. Chat prompt `version: 7` and the test pinned to 7 (§2.2), the alternative named.
2. The merge commit includes the test edit as a merge artefact; the prompt's «no other edit» read as «nothing beyond
   the resolution».
3. The intersection asked for («`git diff --stat HEAD origin/staging` ∩ CLAUDE.md §3») reported both ways: 42 files
   literally, 7 on the side the merge brings (LIR §1), since the literal diff also lists this side's own changes.
4. Smoke re-run once after the cold-server timeout, both runs reported; no threshold or code touched.
5. The 2.230 save produced by this build's export (no staging fixture exists).
6. The `release-3-1` inbox, not the active log (P9); the prompt's Status line not flipped (NON FARE; critical-zone
   lane, the flip follows the visual GO).
7. Two subagents read the LIR risks (R1, R2), and the bench and probe were added to measure them, beyond the prompt's
   probe list.

## Decisions awaiting Alfonso
- **D-A1** (what ships): the visual risk of LIR §3 R2 A1. Recommended: ship; one RC-23 item on a project with «Add»
  children under a graphVertex container opened after the 2.230 step; a maintenance lane only if it shows.
- **D-A2** (what ships): chat prompt v7 as resolved. Recommended: keep.
- **D-A3** (outward, informative): 3.1 writes 2.230, which app (2.229) cannot open. Recommended: no long gap between
  beta and production for 3.1.
- **Ticket** (no decision due now): the R-IRN-19 reservation at `VersionFixer.tsx:1193` reads «the first free number
  after 2.229»; on this line that number is 2.231.
