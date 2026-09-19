# Discovery: merge gate for `validation-skeleton` into `alfonso-frontend-jjtl`

Prompt-ID: P-2026-09-19-1622 · Phase 1, read-only · session 3e819570 · measured 2026-09-19 17:19 +0200
Prompt: `docs/prompts/claude_2026-09-19_1622_prompt_merge_gate_validation_skeleton.md` (tracked on the trunk at `2da08a722`, absent from `~/jjodel`).
Tree: `~/jjodel-release`, worktree of `alfonso-frontend-jjtl`, clean and on the trunk before starting (asserted).
Model: Anthropic Claude Sonnet 5, as the session banner reports it (`CLAUDE.md` §0 declares Opus 5; per P6 the banner wins).
Refs measured: trunk `2da08a722`, branch `92d180708`, merge-base `4275c5850`.

Nothing was merged, cherry-picked, checked out, stashed, pushed or resolved. The only writes to the object store besides the
two commits of this lane are the unreferenced trees and blobs that `git merge-tree --write-tree` creates by design.

## Objective

Produce the gate report that must exist before `validation-skeleton` can reach the trunk: the three facts of the 2026-09-09
backlog (item 4) re-measured, the edge-view question of 2026-09-19 answered, and the mechanism decision framed as options with
numbers. This report replaces the figures of the prompt and of the backlog; where they differ it says so.

## Verdict up front

The gate is not clear, and the reason is not the count of conflicts but the overlaps that git cannot see (items 2 to 4).

1. **The prompt's figures are stale.** At 16:29 the trunk merged `origin/staging` (`d4d9c4323`, 28 commits, PRs #148 to #154).
   The trunk is now 105 commits ahead of the merge-base (was 75 in the prompt, 76 at the prompt's own refs), and the merge
   has **10 conflicting files, not 7**: `SymbolEditorModal.tsx`, `SymbolEditorModal.scss` and `lastViewpoint.ts` are new.
2. **Corner radius exists twice, with incompatible contracts, and the textual merge hides it** (section 5). The trunk ratified
   `ShapeSpec.cornerRadius?: Conditional<number>` (R-IRN-31); the branch ratified `cornerRadius?: number` (D5). In the auto-merged
   `irTypes.ts` both declarations sit in `ShapeSpec` (lines 184 and 221): one property, two types (TypeScript rejects that; not run here). Beyond the three conflicting
   IR files, the trunk's separator-colour rule reads `compiled.border`, a field the branch removes. This is a decision, not a resolution.
3. **The same two defects were fixed twice** (#139 on the trunk, `bc42b259c` and `1731cbc66` on the branch): the Symbol Editor modal
   portal and the tree view born with IR. The branch side is a superset in every hunk, but the combined result was verified by neither lane.
4. **`docs/claude-code-log.md` is not an additive conflict.** Both sides rotated the log at different cut points: keeping both sides
   leaves 36 entries in the active log and in the auto-merged archive, which itself already holds 7 duplicate headings.
5. **The 41 duplicates are not docs-only**: 29 are docs, 12 are code (JjScript, `DModel`, Jjodie), all 12 cherry-picked with `-x` as P14
   prescribes. `CLAUDE.md` is byte-identical on both refs (717 lines), so the backlog's 54-line divergence is gone.
6. **The trunk gets edge views from the menu by the merge, not by a partial pick.** By pick it needs an ordered chain of four to five commits,
   two to three of which conflict on their own, because the chain runs through the branch's own predecessors (`868ba9a3c`, R-VAL-19) and not through any trunk lane.

## Files read

Paths in the trunk worktree unless stated; blobs read with `git show <ref>:<path>` where the file is not in the tree of that worktree.

- `/Users/alfonso/jjodel-release/docs/PROTOCOL.md` (trunk): P5, P6, P9, P13, P14, P15.
- `/Users/alfonso/jjodel-release/docs/claude-code-log.md` (trunk): the first entries; `/Users/alfonso/jjodel-release/docs/log-inbox/default-view-parity.md` for the inbox format.
- `CLAUDE.md`: not opened as a file in the trunk tree; it reached the session through the harness (the `~/jjodel` copy), and the trunk's blob
  is byte-identical to it (`git diff alfonso-frontend-jjtl validation-skeleton -- CLAUDE.md` is empty, section 7).
- `docs/decisions.md` (trunk lines 1110 to 1160, R-IRN-29..34; the branch tail R-VAL to R-MCID through the conflict hunk).
- `docs/handoff/decisions-symbol-editor-1b.md` (branch: D1, D5), `docs/sessioni/sessione_2026-09-19.md` (branch, by grep only, not read in full),
  `docs/archivio/claude_backlog_2026-09-09_manutenzione_harness.md` (branch only, item 4; it does not exist on the trunk, `69d0d07b0`).
- Source blobs (both refs): `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `irDefaults.ts`,
  `shapeRegistry.ts`, `irCreationSeed.ts`; `.../viewpoint/authoring/SymbolEditorModal.tsx`, `SymbolEditorModal.scss`;
  `frontend/src/utils/lastViewpoint.ts`; `frontend/src/components/editor-v2/EditorV2.tsx` (grep of the menu entries); `frontend/src/types/jodie.ts`; `frontend/package.json`.

## 1. Measurement header

Measured 2026-09-19 17:19 +0200 from `~/jjodel-release` with `GIT_OPTIONAL_LOCKS=0`. Prompt figures reproduce at the prompt's own refs
(`20ddf067e` and `941a94da9`): ahead 256, cherry 41/215, 7 conflicts, **behind 76** (the prompt said 75: off by one, measured).

| Item | Prompt (16:10) | Measured now | Difference |
|---|---|---|---|
| trunk HEAD | `20ddf067e` | `2da08a722` | +2: the staging merge `d4d9c4323` (28 commits incl. the merge, 15 non-merge: issues #147, #128, #139, #142) and the commit of this prompt `2da08a722` |
| branch HEAD | `941a94da9` | `92d180708` | +5: lane P-2026-09-19-1610 closed (`f98e67cb5`, `70ac9055f`, `366300c03`, `603546085`, `92d180708`) |
| merge-base | `4275c5850` | `4275c5850d73521c43aaae223f314d8130ebf993` (2026-09-06) | none |
| trunk-only commits | 75 | **105** (13 merges, 92 non-merge) | +30 (76 at the prompt's refs, so +29 real) |
| branch-only commits | 256 | **261** (no merges) | +5 |
| `git cherry` | 41 `-` / 215 `+` | **41 `-` / 220 `+`** | +5 `+`, the same five |
| `merge-tree --write-tree` | exit 1, 7 files | **exit 1, 10 files, 17 hunks** | +3 files, section 5 |
| `origin/validation-skeleton` | `3e48caed8`, 66 not pushed | `3e48caed8`, **71 not pushed** | +5; 54 of the 71 touch no `.ts/.tsx/.scss` under `frontend/src` |
| `origin/alfonso-frontend-jjtl` | `6e9a31fe7` | `d4d9c4323` (the staging merge, pushed) | trunk is 1 ahead of it: the prompt commit |
| `~/jjodel` tree | 3 paper files, 3 IR files modified, `.lsp.json`, `.tracer/`, prompt 2219 untracked | 3 paper files modified; `.lsp.json`, `.tracer/`, prompt 2219 untracked; nothing staged | the 3 IR files are now committed (lane 1610 closed) |

The conflict list, from `merge-tree` (tree `6a8bc1d27`): `docs/archivio/claude_milestone_validazione_scheletro.md`, `docs/claude-code-log.md`, `docs/decisions.md`, `docs/spec/spec_attive.md`, `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss`, `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `frontend/src/utils/lastViewpoint.ts`.
Hunks by `git merge-file -p` against the merge-base (2-way, zealous): milestone doc 2 (add/add, empty base), `claude-code-log.md` 2,
`decisions.md` 1, `spec_attive.md` 2, `SymbolEditorModal.scss` 1, `SymbolEditorModal.tsx` 3, `IRNodeContent.tsx` 1, `irCompile.ts` 2,
`irTypes.ts` 1, `lastViewpoint.ts` 2: **17 hunks**. Scanning the merge-tree result for conflict markers finds them only in these ten files
(positive control: all ten appear in the scan).

The three facts of the 2026-09-09 backlog (item 4), replaced by measurement:

| 2026-09-09 | now |
|---|---|
| 16 of 50 branch commits already have an equivalent patch on the trunk | **41 of 261** (section 2): 29 docs, 12 code by `cherry-pick -x` |
| `CLAUDE.md` diverges by 54 lines, §9.3 branch-only | **0 lines**, byte-identical, 717 lines both (section 7) |
| `ValidationRulesModal.tsx` and `.scss` modified in `~/jjodel` block the checkout | **not the case**: clean in that tree; the three modified files there (paper) differ on neither ref (section 8) |

## 2. The 41 duplicates

Each `-` line of `git cherry` was matched to its trunk twin by `git patch-id --stable` over the 92 non-merge trunk-only commits: 41 of 41
matched, no trunk commit matched twice. Of the 41: **29 are docs-only, 12 are code** (`fix`/`refactor` in JjScript, `DModel`,
`nameLookup`, Jjodie), and the 12 code twins are all real `cherry-pick -x` copies (their bodies carry `(cherry picked from commit <branch sha>)`).
So the backlog's prediction ("the duplicates are the architect's documentation, committed twice, once per lane") holds for 29 and does not hold
for 12: those are P14 working as written, code going by explicit shas. 30 of the 41 carry the `-x` trailer naming the branch sha; the 11 that
do not are all docs (matched by patch-id only). 40 of the 41 branch shas are already on `origin/validation-skeleton`.
A code duplicate is therefore not a finding of accidental double commit; it is a finding about the mechanism (section 9): the merge sees
identical patches on both sides and produces no conflict from them.

| branch sha | trunk twin | kind | subject |
|---|---|---|---|
| `fdf087259` | `869ce15f8` | docs | docs: discovery of user-defined validation (phase 1 + addendum) |
| `96f718450` | `f2bd8d2a4` | docs | docs: correct the JjEL forall claim in CLAUDE.md 12.6 and the jjtl notes |
| `3e4dec57b` | `4cee938cc` | docs | docs: micro-discovery on the keyword-after-dot defect in the JjEL lexer |
| `81051865e` | `27fe69dd2` | docs | docs: spec for user-defined validation (R-VAL series) |
| `dc1ca51f7` | `b8179edf3` | docs | docs: close the two lifecycle questions of the validation spec (R-VAL-9, R-VAL-1 |
| `ee02b1bf9` | `7cf937878` | docs | docs: close the last two questions of the validation spec (R-VAL-6-bis, R-VAL-11 |
| `8dd7b6da5` | `2e8d26f41` | docs | docs: rules accumulate along the hierarchy, no override (R-VAL-12) |
| `7d145f110` | `f3bf030c3` | docs | docs: phase 2 prompt for the validation skeleton |
| `c505976f2` | `2826de119` | docs | docs: Step 0, il verdetto booleano delle regole di validazione |
| `bf54bdb9b` | `3a4a56a7d` | docs | docs: the verdict requires a boolean, the evaluator converts nothing (R-VAL-13) |
| `4dbdb242a` | `4bb175388` | docs | docs: P12, a positive control must discriminate |
| `a5b083350` | `ad2faeb15` | docs | docs: scope and the three numbers of the validation surface (R-VAL-14) |
| `51e7da5c0` | `efa1f602b` | docs | docs: the extent matches the validated perimeter (R-VAL-15) |
| `b3d24e346` | `78238ade9` | docs | docs: the extent restriction belongs inside buildEvalContext (R-VAL-16) |
| `1d4e08c05` | `96fa77515` | docs | docs: P11 gains the UI case, the pixel is the measurement |
| `548c8387e` | `4f1b48957` | docs | docs: milestone plan for the validation skeleton and section 5.5 of the book |
| `5f71ad1ce` | `4de1d3b6f` | docs | docs: a rule that matches no instance is the fourth silent mode (R-VAL-17) |
| `4ff6767de` | `c56a7e7c6` | docs | docs: a validation dot on the canvas is never stale (R-VAL-18) |
| `fd83f9a19` | `036dd8497` | docs | docs: prompt for section 5.5 of the book, now that the canvas dot is in |
| `bc4edf1cf` | `92f213add` | docs | docs: the tri-state judges the result, not the intermediate steps |
| `6f9088752` | `5eb0c2804` | docs | docs: prompt for figure 5.8 and section 5.3, the conformance indicator |
| `293f27819` | `53e255036` | docs | docs: the clean withdrawal is emergent, not guaranteed (R-VAL-18) |
| `874199048` | `95839f26b` | docs | docs: three concerns under VIEWPOINTS in the megamodel tree (R-VAL-19) |
| `a13e0c7a4` | `5ab517d65` | docs | docs: the reconnaissance falsified three premises of R-VAL-19 (19-bis) |
| `7bacbd63c` | `2a6f626da` | code | fix: restrict JjScript target lookup to admissible element kinds, prefer exact-c |
| `12a318b3a` | `a847acb3a` | code | fix: member backtracking stops at a container that could have held the member |
| `39c5bf4ab` | `038564a55` | code | fix: resolve enum types in JjScript create attribute instead of silent EString f |
| `2a60e3264` | `aaa01514c` | code | fix: make getByName case-insensitive fallback side-effect free |
| `b434a3950` | `37b33b4da` | code | fix: auto-suffix duplicate metamodel names in DModel.new |
| `6a211f5c3` | `962a95d2e` | code | fix: apply the model-name guard to DModel.new2 and new3 as well |
| `a52dfe5f3` | `aeaa0efe2` | code | fix: report ambiguity on exact-case homonyms in JjScript target resolution |
| `dc5f8d3aa` | `22db124a1` | code | refactor: extract the pure name lookups so the bench can execute them |
| `284576f94` | `d7938c035` | code | refactor: generateUniqueModelName delegates to uniqueModelName |
| `686a13712` | `8f6122427` | docs | docs: worktree and cherry-pick rule in CLAUDE.md |
| `3e3ab691a` | `9f8488ecd` | code | fix: resolve types through admissible kinds in set, create parameter and createR |
| `2a1619653` | `042517f7e` | code | fix: qualified type names parse in create and returnType |
| `de77f22af` | `4ed122114` | code | fix: Jjodie writes into the scope shown to the model |
| `74d0f81db` | `cccabe385` | docs | docs: static-test and scope-file rules in CLAUDE.md |
| `43e598404` | `4db186124` | docs | docs: judge a test by the mutations it kills, not by its subject |
| `e786d9d8a` | `00b32f5e7` | docs | docs: CLAUDE.md has one home, and a rule binds only where it is written |
| `43e7bf3c1` | `7bc6c7365` | docs | docs: every prompt has an ID and every message on it carries the ID |

## 3. The 220 non-duplicates, classified

By kind (a commit is "code" when it touches a non-markdown file under `frontend/`): **174 docs-only, 28 code with tests,
16 code without tests, 2 tests only.** No commit mixes docs and code (RC-13 held on this branch).
By top-level path (a commit counts once per group it touches; sha lists in Appendix A):

| group | commits |
|---|---|
| `docs/(root files)` | 79 |
| `docs/discovery` | 43 |
| `docs/prompts` | 38 |
| `docs/log-inbox` | 31 |
| `frontend/src/components/editor-v2/viewpoint/authoring` | 11 |
| `docs/sessioni` | 9 |
| `frontend/src/components/editor-v2/(root files)` | 9 |
| `frontend/src/components/editor-v2/viewpoint/ir` | 9 |
| `frontend/src/jjscript` | 9 |
| `frontend/src/model` | 8 |
| `(repo root) AGENTS.md` | 5 |
| `frontend/src/components/TreeViewSidebar` | 5 |
| `frontend/src/components/editor-v2/problems` | 5 |
| `(repo root) CLAUDE.md` | 4 |
| `frontend/src/components/project` | 4 |
| `docs/spec` | 3 |
| `frontend/src/utils` | 3 |
| `frontend/src/(root files)` | 2 |
| `frontend/src/components/Jodie` | 2 |
| `frontend/src/components/contextMenu` | 2 |
| `frontend/src/components/editors` | 2 |
| `frontend/src/components/validation` | 2 |
| `frontend/src/events` | 2 |
| `docs/archivio` | 1 |
| `docs/handoff` | 1 |
| `frontend/(package.json)` | 1 |
| `frontend/(vitest.config.ts)` | 1 |
| `frontend/scripts` | 1 |
| `frontend/src/components/alert` | 1 |
| `frontend/src/components/editor-v2/components` | 1 |
| `frontend/src/components/editor-v2/nodes` | 1 |
| `frontend/src/components/ui` | 1 |
| `frontend/src/jjel` | 1 |
| `frontend/src/jjtl` | 1 |
| `frontend/src/joiner` | 1 |
| `frontend/src/redux` | 1 |
| `frontend/src/services` | 1 |
| `frontend/src/styles` | 1 |

The 46 code and test commits, by front (my grouping by subject, not a front list declared by a prompt; the fronts are the unit of option (b)):

| front | commits | shas |
|---|---|---|
| R-VAL validation skeleton (model, evaluator, Validate command, authoring, canvas dot, tree concerns) | 12 | `9f16e7703` `a02459f59` `7915ea2ad` `c246550c1` `efee0dbd9` `a5ed5406d` `c87f5a917` `b6a0e7bd6` `c940a05e8` `11b74a611` `868ba9a3c` `11bd784b6` |
| New Viewpoint gating (R-NV-1, R-NV-2) | 3 | `d039fc7e7` `9335f4417` `98e6fd6cb` |
| Symbol Editor 1b (corner radius, conditional border, Goal family, shell, multi-instance preview, empty-list draft) | 11 | `8da572191` `aeb0c9134` `b1abdc6f1` `bc42b259c` `27f80d1ac` `3e4f7536f` `7801d7a58` `b53d2f5dd` `e343242bd` `5c4db90b1` `3f5fe347b` |
| Create View, tree and v2 menu, edge and row route (R-NV-3) | 5 | `1731cbc66` `70bcbc5f8` `86f822d50` `ca3fdaa99` `f554aa5fb` |
| JjScript executor fixes and Jjodie level | 7 | `ccd867bda` `2b357af17` `fad85bae5` `09ce4b60c` `4898aa60f` `9345a4046` `139350eea` |
| Metaclass identity (R-MCID) | 3 | `f98e67cb5` `70ac9055f` `366300c03` |
| Small UI fixes | 4 | `1f3caab09` `0214f29d4` `faa893a77` `6001add8b` |
| Log gates (fold and rotate by script, Check D) | 1 | `920b84895` |

Note: `11bd784b6` has the subject `reminder`, is a code commit (touches `ValidationRulesModal.tsx` and `.scss`), and was pushed on 2026-09-15.

### Commits that touch `CLAUDE.md`, `docs/PROTOCOL.md` or `docs/decisions.md`

31 branch-only commits (path-limited log on those three paths at the repository root; the nested `CLAUDE.md` files are covered in section 7).
`files`: C = `CLAUDE.md`, P = `docs/PROTOCOL.md`, D = `docs/decisions.md`. By §6.6 they are owed to the trunk whatever the mechanism. `-` = `git cherry` says an equivalent patch is already on the trunk.

| mark | branch sha | date | files | subject | on the trunk? |
|---|---|---|---|---|---|
| - | `96f718450` | 2026-09-08 | C | docs: correct the JjEL forall claim in CLAUDE.md 12.6 and the jjtl notes | yes, twin `f2bd8d2a4` |
| - | `81051865e` | 2026-09-08 | D | docs: spec for user-defined validation (R-VAL series) | yes, twin `27fe69dd2` |
| - | `dc1ca51f7` | 2026-09-08 | D | docs: close the two lifecycle questions of the validation spec (R-VAL-9, R-VAL | yes, twin `b8179edf3` |
| - | `ee02b1bf9` | 2026-09-08 | D | docs: close the last two questions of the validation spec (R-VAL-6-bis, R-VAL- | yes, twin `7cf937878` |
| - | `8dd7b6da5` | 2026-09-08 | D | docs: rules accumulate along the hierarchy, no override (R-VAL-12) | yes, twin `2e8d26f41` |
| - | `bf54bdb9b` | 2026-09-08 | D | docs: the verdict requires a boolean, the evaluator converts nothing (R-VAL-13 | yes, twin `3a4a56a7d` |
| - | `4dbdb242a` | 2026-09-08 | P | docs: P12, a positive control must discriminate | yes, twin `4bb175388` |
| - | `a5b083350` | 2026-09-08 | D | docs: scope and the three numbers of the validation surface (R-VAL-14) | yes, twin `ad2faeb15` |
| - | `51e7da5c0` | 2026-09-09 | D | docs: the extent matches the validated perimeter (R-VAL-15) | yes, twin `efa1f602b` |
| - | `b3d24e346` | 2026-09-09 | D | docs: the extent restriction belongs inside buildEvalContext (R-VAL-16) | yes, twin `78238ade9` |
| - | `1d4e08c05` | 2026-09-09 | P | docs: P11 gains the UI case, the pixel is the measurement | yes, twin `96fa77515` |
| + | `848d182a2` | 2026-09-09 | C | docs: §9.3, gli slot di reference si scrivono in un altro modo | yes, moved and reworded: `32dbe1ef8` carried §9.3 into `frontend/src/model/CLAUDE.md` (step 2 of P-2026-09-18-2110); 18 of 23 added lines verbatim, the rest reworded; `CLAUDE.md` is byte-identical. `git cherry` missed it because the patch differs. |
| - | `5f71ad1ce` | 2026-09-09 | D | docs: a rule that matches no instance is the fourth silent mode (R-VAL-17) | yes, twin `4de1d3b6f` |
| - | `4ff6767de` | 2026-09-09 | D | docs: a validation dot on the canvas is never stale (R-VAL-18) | yes, twin `c56a7e7c6` |
| + | `c83aa268a` | 2026-09-09 | C | docs: §9.3, svuotare una reference non svuota, e leggerla conta uno di troppo | yes, same route as `848d182a2` (20 of 20 added lines present). |
| - | `874199048` | 2026-09-09 | D | docs: three concerns under VIEWPOINTS in the megamodel tree (R-VAL-19) | yes, twin `95839f26b` |
| - | `a13e0c7a4` | 2026-09-09 | D | docs: the reconnaissance falsified three premises of R-VAL-19 (19-bis) | yes, twin `5ab517d65` |
| + | `16b1e3d20` | 2026-09-10 | CP | docs: the P clause range is aligned across its four call sites (P1..P12) | superseded: the trunk has P1..P15 (`717b29a64`), the branch commit wrote P1..P12. Nothing owed for `CLAUDE.md`/`PROTOCOL.md`. `HARNESS-DOCS.md` 1.2 (P1..P12) exists on the branch only and is stale against P15 on both sides (ticket `2b1cc6d05`). |
| + | `5185a2b77` | 2026-09-14 | D | docs: ratify R-SIM-7..R-SIM-15 and update the computational model spec | **missing** (0 of 48 added lines). R-SIM-7..15 and the computational-model spec belong to the simulator front; the `simulation-engine` branch does not contain them either. |
| - | `686a13712` | 2026-09-14 | C | docs: worktree and cherry-pick rule in CLAUDE.md | yes, twin `8f6122427` |
| - | `74d0f81db` | 2026-09-15 | C | docs: static-test and scope-file rules in CLAUDE.md | yes, twin `cccabe385` |
| - | `43e598404` | 2026-09-16 | C | docs: judge a test by the mutations it kills, not by its subject | yes, twin `4db186124` |
| - | `e786d9d8a` | 2026-09-16 | C | docs: CLAUDE.md has one home, and a rule binds only where it is written | yes, twin `00b32f5e7` |
| - | `43e7bf3c1` | 2026-09-17 | C | docs: every prompt has an ID and every message on it carries the ID | yes, twin `7bc6c7365` |
| + | `97a41475e` | 2026-09-18 | P | chore(protocol): P6 requires a Model trailer on every commit body | yes, reworded: P6 `Model:` trailer carried by `32dbe1ef8` (version 1.1 to 1.2). |
| + | `3de7bef90` | 2026-09-18 | P | docs(protocol): P9 names the log rotation command | **missing on purpose**: the trunk did not carry the `npm run log:rotate` sentence because the script does not exist there (RC-10). It can travel only with `920b84895` (`log-tools.ts`, `rotate-log.ts`, Check D, `package.json`). |
| + | `05e27b483` | 2026-09-18 | D | docs: inscribe R-NV-1..4 and R-JS-1 in decisions.md | **missing** (0 of 49 added lines): R-NV-1..4, R-JS-1. Owed. |
| + | `9b3d74857` | 2026-09-19 | CP | docs(claude-md): bring the trunk's CLAUDE.md split into the branch (P-2026-09- | yes, it is the trunk's split adopted by the branch (135 of 135 lines present). |
| + | `7f5d8edbc` | 2026-09-19 | D | docs: carry two discovery accounts cited by CLAUDE.md §5, RC-13 cites P13 (P-2 | net zero: the one added `decisions.md` line was rewritten by `9899f5d23`; the two discovery files it carries exist on both sides. |
| + | `9899f5d23` | 2026-09-19 | D | docs: RC-13 in decisions.md takes the trunk's exact wording (P-2026-09-18-2110 | yes (2 of 2): RC-13 takes the trunk wording. |
| + | `603546085` | 2026-09-19 | D | docs: R-MCID-1 and R-MCID-2 in decisions.md (P-2026-09-19-1610) | **missing** (0 of 4 lines): R-MCID-1, R-MCID-2. Owed. |

Reading: 20 of the 31 have a twin (`-`). Of the 11 `+`, five are already on the trunk in another shape (`848d182a2`, `c83aa268a`,
`97a41475e`, `9b3d74857`, `9899f5d23`), two are superseded or net zero (`16b1e3d20`, `7f5d8edbc`), and **four are still missing**:
`5185a2b77` (R-SIM), `05e27b483` (R-NV, R-JS), `603546085` (R-MCID), and `3de7bef90` (the P9 sentence, held back on purpose). Outside these three paths,
`HARNESS-DOCS.md` 1.2 is also branch-only (section 7).
`git cherry` missed the reworded ones because the trunk carried them by a lane that rewrote them (`32dbe1ef8`), so the patch-id differs.

## 4. The 105 commits the branch lacks

| lane | commits | files touched | of which the branch also touched since the merge-base |
|---|---|---|---|
| (copies of the 41 duplicates) | 41 | 48 | 48 |
| CLAUDE.md split, P-2026-09-18-2110 | 17 | 28 | 24 |
| release 3.0 and trunk-to-staging merges | 12 | 7 | 2 |
| default view parity, P-2026-09-18-2219 | 7 | 10 | 5 |
| staging #147 (Custom provider model) | 6 | 6 | 2 |
| staging #142 (inherited customization, rail reference editor) | 6 | 6 | 1 |
| R-VAL docs written on the trunk (checkpoints, milestone plan, transport entry) | 5 | 4 | 2 |
| staging #128 (JSON export, external objects) | 5 | 6 | 2 |
| staging #139 (tree view born with IR, modal to foreground) | 4 | 5 | 5 |
| merge of origin/staging (16:29) | 1 | 0 | 0 |
| this gate prompt, P-2026-09-19-1622 | 1 | 1 | 0 |

The 41 copies are the 41 duplicates of section 2. Prompt-IDs appear in the subjects of the CLAUDE.md split, parity and gate lanes only; the staging
lanes (#128, #139, #142, #147) come from `origin/staging` PRs and carry none. Both sides changed **283 (branch) and 104 (trunk)**
files since the merge-base; 74 files were changed by both, ten conflict, 64 merge textually clean.
Of those clean ones, the non-docs code files are: `frontend/package.json`, `frontend/src/components/Jodie/ChatMessages.tsx`, `frontend/src/components/Jodie/Jodie.tsx`, `.../viewpoint/ir/__tests__/ir.test.ts`, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/jjscript/__tests__/parser.test.ts`, `frontend/src/jjscript/executor/__tests__/resolvers.test.ts`, `frontend/src/jjscript/executor/__tests__/scopeGuard.test.ts`, `frontend/src/jjscript/executor/commands/create.ts`, `frontend/src/jjscript/executor/commands/delete.ts`, `frontend/src/jjscript/executor/commands/list.ts`, `frontend/src/jjscript/executor/commands/rename.ts`, `frontend/src/jjscript/executor/commands/set.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/resolvers.ts`, `frontend/src/jjscript/executor/scopeGuard.ts`, `frontend/src/jjscript/executor/utils.ts`, `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/services/JjScriptService.ts`, `frontend/src/jjscript/types.ts`, `frontend/src/joiner/__tests__/uniqueModelName.test.ts`, `frontend/src/joiner/classes.ts`, `frontend/src/model/__tests__/getByNameKey.test.ts`, `frontend/src/model/__tests__/nameLookup.test.ts`, `frontend/src/model/logicWrapper/LModelElement.tsx`, `frontend/src/model/nameLookup.ts`, `frontend/src/services/JjodieContext.ts`, `frontend/src/services/JjodieRagService.ts`, `frontend/src/services/__tests__/JjodieRagService.test.ts`, `frontend/src/types/jodie.ts`. Checked: `frontend/package.json`
(trunk `3.0.0-beta` to `3.0.0`; branch adds the `log:rotate` script: disjoint), `frontend/src/types/jodie.ts` (Gemini entry versus the Jjodie
scope field: no duplicate export in the merged tree, 46 exports), `ir.test.ts` (trunk parity snapshot tests versus three branch commits: textually
clean, **not executed**). The rest are nested `CLAUDE.md`/`AGENTS.md` pairs (identical) and docs.

### Every conflicting file mapped to the pair of lanes that produced it

| file | trunk-side lane | branch-side lane |
|---|---|---|
| `docs/archivio/claude_milestone_validazione_scheletro.md` | R-VAL docs written on the trunk (`f271ed833`, `019332198`) | R-VAL, same file added by the copied commit `548c8387e` (twin `4f1b48957`) |
| `docs/claude-code-log.md` | staging #147/#128/#139/#142 entries and their P9 rotations, the split lane (`32dbe1ef8` entry), release 3.0, the validation transport entries | log gates lane P-2026-09-18-2015 (fold and rotate, `095f27cd1`, `9378e405e`, `eab6eb23f`) and every branch entry |
| `docs/decisions.md` | the R-VAL series copied by the twins (`869ce15f8` ... `96fa77515`) | R-NV/R-JS (`05e27b483`), R-MCID (`603546085`) |
| `docs/spec/spec_attive.md` | the R-VAL spec copies (`27fe69dd2`, `b8179edf3`, `7cf937878`, `2e8d26f41`, `3a4a56a7d`) | simulator spec index (`5dcca3f6d`, `c9c522e67`) |
| `.../authoring/SymbolEditorModal.scss` and `.tsx` | staging #139 (`7b5f4fd3a`, PR #151) | Symbol Editor lane (`8da572191`, `bc42b259c`, `3e4f7536f`, `b53d2f5dd`, `5c4db90b1`) |
| `frontend/src/utils/lastViewpoint.ts` | staging #139 (`7b5f4fd3a`) | Create View lane (`1731cbc66`, `70bcbc5f8`, `f554aa5fb`) |
| `.../ir/irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx` | parity P-2026-09-18-2219 (`400095370`, `6ee6efcd5`) | Symbol Editor 1b slices 2 and 3 (`3e4f7536f` border axes, `8da572191` corner radius) and `27f80d1ac`, `5c4db90b1`, `f98e67cb5` on the files as noted |

`irTypes.ts` third writer: `f98e67cb5` (R-MCID-1, `AuthoringMetaclassPins` widening) is now on the branch. Re-measured at `92d180708` the file has
**one** conflict hunk, the same border/corner-radius hunk; the widening added no hunk. The re-measure the prompt asked for after lane 1610 closes is this report.

## 5. The ten conflicts, one by one

Resolutions are proposals in one of three shapes: **keep both**, **take trunk**, **take branch**. None was applied.

### 5.1 `docs/archivio/claude_milestone_validazione_scheletro.md`: add/add, 2 hunks, empty base. **Take trunk.**
Both sides added the file with the same commit (`4f1b48957` on the trunk, `548c8387e` on the branch). The branch tip is byte-identical to the file at
`4f1b48957` (diff: 0 bytes). The trunk then edited it twice (`f271ed833`, `019332198`: +36/-8, 108 lines against 80). The branch side is the
shared original, so the trunk side loses nothing.

### 5.2 `docs/claude-code-log.md`: 2 hunks. **Not additive: regenerate by tool, as a lane of its own.**
Hunk sizes with the base shown (`--diff3`): hunk 1 trunk 238 lines, base 28, branch 10; hunk 2 trunk 116, base 321, branch 66. The base is larger than
either side because each side rotated entries out in a different place. Effect measured on the merge-tree result: the branch's archive holds 36
entries that the trunk still keeps in its active log; the auto-merged archive has 1153 headings with 7 duplicates; active headings are 44 (trunk),
42 (branch), 86 in the union, so Check D (over 40) is red after any keep-both. Proposal: union by heading, newest first, then
`npm run log:rotate -- --fold --rotate --write` (branch-only tool) and a de-duplication of the archive, as the exclusive rotation lane P13 requires,
in its own commit and never mixed with the code. The trunk has no `log:rotate` (RC-10) until the tool arrives with the merge or the picks.

### 5.3 `docs/decisions.md`: 1 hunk. **Keep both (take the branch side, which contains the trunk side).**
With the base shown the two sides both insert at the same point before `## Superate`: trunk 188 lines (the R-VAL series, from the twins), branch the same series plus
R-NV, R-JS, R-MCID. The 2-way hunk shows the trunk side as empty after prefix trimming, i.e. the trunk side is a strict prefix of the branch side.
Test on the resolved file: 131 unique `**R-...**` ids, none lost from either side, no duplicate id, no duplicate `##` heading, no marker left. The branch-only ids are
R-NV-1..4, R-JS-1, R-MCID-1, R-MCID-2 (R-SIM-7..15 arrive by a clean hunk elsewhere); the trunk's R-IRN-29..34 arrive by a clean hunk elsewhere. This is the resolution
`docs/sessioni/sessione_2026-09-19.md` (`c66e253fc`) recorded. Textual overlap only.

### 5.4 `docs/spec/spec_attive.md`: 2 hunks. **Take branch.**
Hunk 1 is the "Aggiornato" date (trunk 2026-09-08, branch 2026-09-14), the rest of the line identical. Hunk 2: all 11 trunk lines are contained in the
branch's 16; the extra five are the "Modello computazionale del simulatore" section (`5dcca3f6d`, `c9c522e67`). Textual overlap only.

### 5.5 `SymbolEditorModal.scss` (1 hunk), `SymbolEditorModal.tsx` (3 hunks), `lastViewpoint.ts` (2 hunks): **take branch in all six; visual check owed.**
These are new since the prompt. Trunk `7b5f4fd3a` (issue #139, PR #151, 2026-09-18) fixed two defects: the tree "+" view was born without IR, and the Symbol Editor
modal was painted under the Properties rail. The branch had already fixed both on 2026-09-16 (`1731cbc66`, `bc42b259c`): **the same fix twice**, by two lanes that did not see each other.
The mechanism is the same (`createPortal(..., document.body)`, a vertex IR seed written inside the `new2` callback). The branch side is a superset in every hunk:
it imports `useMemo` alongside `createPortal`, documents the stacking measurement, and in `lastViewpoint.ts` also sets `d.appliableTo = 'Vertex'` (ratifica 2026-08-16),
which the trunk seed does not. In the scss the z-index line is not in the hunk and merges to the branch value `var(--z-alert, 10000)`; the trunk had left `var(--z-modal, 9999)`.
Nothing here is a semantic conflict, but the result (branch CSS, one portal, the branch seed) is a combination neither lane verified on screen: P8 applies in Phase 2.

### 5.6 `irTypes.ts` (1 hunk), `irCompile.ts` (2), `IRNodeContent.tsx` (1): **semantic overlap. Blocks the merge until a decision.**
Trunk side: parity batch `400095370`/`6ee6efcd5` (R-IRN-29..34): `ShapeSpec.cornerRadius?: Conditional<number>` "sibling of `border`", compiled to
`CompiledView.cornerRadius: CompiledConditional<number | undefined> | null` with a non-emitted fallback, applied as an inline `borderRadius` only on box shapes and
explicitly **ignored** on ellipse/circle/stadium and on SVG-painted shapes; the object seed writes `cornerRadius: 8`. Branch side: Symbol Editor 1b, D1 and D5 of
`docs/handoff/decisions-symbol-editor-1b.md`: `border` becomes three per-axis conditionals (`borderColor`, `borderWidth`, `borderStyle`, the `border` field disappears from
`CompiledView`), and `ShapeSpec.cornerRadius?: number` is a **scalar** (not Conditional), absent is not zero, honoured also by diamond, hexagon and parallelogram through
`roundedPolygonPath`, clamped at render, read from the source IR (`authoredCornerRadius`), not from a compiled field.

Two notions of the same thing, and one dependency git cannot see:

- **Corner radius, the same thing modelled twice.** Auto-merged `irTypes.ts` declares `cornerRadius` twice inside `ShapeSpec` (merged lines 184 `Conditional<number>` and 221 `number`): a duplicate
  property with two different types, which TypeScript is expected to reject (not run, no `node_modules` here). The types disagree, the polygon behaviour disagrees (trunk: ignored; branch: rounded path), and the branch's `authoredCornerRadius`
  answers `undefined` for a non-number, so a `Conditional` radius written by trunk features would render as unauthored on the branch's paint path. Both sides ratified their contract
  (R-IRN-31 on the trunk; D5 on the branch). The seed value `8` (number) is compatible with both.
- **Border, different things on the same lines.** The trunk keeps a single compiled `border`; the branch splits it. The trunk consumers of `compiled.border` sit **outside** the hunks:
  parity S2 defines `separatorColorStyle` from `b.color` inside the trunk side of the `IRNodeContent.tsx` hunk and uses it at two places outside the hunk (merged lines 600, 615).
  Take the branch side and `separatorColorStyle` is an undefined identifier; take the trunk side and `borderColorV`, `cornerPaint`, `roundedD`, `svgViewBox` (used at lines 447, 466 outside the hunk)
  are undefined. A keep-both must rebuild the separator colour from `borderColorV` and settle the corner radius first.
- The prompt names "edge terminators" on the trunk side. None found: the parity lane's own log entry says item 4 (arc termination) needed no change, and the five files of its code commits
  are `IRNodeContent.tsx`, `irCompile.ts`, `irDefaults.ts`, `irTypes.ts`, `ir.test.ts`. `TextStyle.underline` (`irTypes.ts` line 95) does not overlap anything on the branch.
- `irDefaults.ts` (trunk only) and its `isMigratedDefaultView` snapshot (R-IRN-33) merge clean; not executed.

Proposed shape: none until the decision (question 1 and 2 of section 10). A blocking finding.

## 6. Edge views from the canvas v2 menu

Read on both refs (`git show <ref>:<path>`). **Trunk**: `createViewInWorkbench` has branches for classes and enumerators only (seed calls at `lastViewpoint.ts` lines 278 and 294,
`unhandled className` at 311), and no occurrence of `'DReference'` or `'DAttribute'` in the file; `hasCreatableViewpoint` does not exist (0 occurrences in `frontend/src`).
**Branch**: `'DReference'` and `'DAttribute'` branches exist (edge seed lines 357 to 358, row seed line 372), and the menu entries "Create edge view" (`EditorV2.tsx` 3393 to 3398) and
"Create row view" (3031 to 3035). Pickaxe on the branch: both branches were introduced by `f554aa5fb` alone. `irCreationSeed.ts` has the edge and row seeds on both refs and does not differ.

| commit | what it carries | in the 220? | touches a conflicting file? | alone onto the trunk (merge-tree) |
|---|---|---|---|---|
| `1731cbc66` | "+" asks what the view applies to and seeds a vertex IR | yes | yes: `lastViewpoint.ts` | conflicts: `TreeViewContent.tsx`, `lastViewpoint.ts` |
| `70bcbc5f8` | gate on the active viewpoint, introduces `hasCreatableViewpoint` | yes | yes: `lastViewpoint.ts` | conflicts: `TreeViewContent.tsx` |
| `86f822d50` | v2 Create View resolves its viewpoint once | yes | no | clean |
| `ca3fdaa99` | tree Create View resolves its viewpoint once | yes | no | conflicts: `TreeViewContent.tsx` |
| `f554aa5fb` | **edge and row route: the `DReference`/`DAttribute` branches and the two menu entries** | yes | yes: `lastViewpoint.ts` | clean textually, **semantically depends on `70bcbc5f8`** (uses `hasCreatableViewpoint`, absent on the trunk) |
| `b0b70bd54` | discovery report and probe (docs only, not a code commit; the prompt lists it in the route) | yes | no | n/a |

Answer. By the **merge**, the trunk gets edge and row views from the v2 menu with no extra step: all five code commits are in the 220, and in the full merge `TreeViewContent.tsx`, `EditorV2.tsx` and `ContextMenu.tsx` auto-merge
(only `lastViewpoint.ts` conflicts, section 5.5, resolved by the branch side). If the mechanism is **not a merge**, the route needs its own ordered chain: `70bcbc5f8` (gate) first, then `86f822d50`, `ca3fdaa99`, `f554aa5fb`
(and `1731cbc66` if the tree "+" must match). The three conflicts of the simulation in `TreeViewContent.tsx` do **not** come from a trunk lane: no trunk commit touches that file since the merge-base;
they come from the branch's own predecessors on it (`868ba9a3c`, the R-VAL-19 tree concerns, then `1731cbc66`), so the edge route by pick crosses into the R-VAL front or needs hand resolution. The conflict of `1731cbc66` in `lastViewpoint.ts` is the one with #139.
`f554aa5fb` picked alone applies clean and would break the build. The simulation is per commit against the current trunk, not chained, and nothing was built: the semantic dependency is read from the diff, not from a typecheck.

## 7. `CLAUDE.md` and the normative docs

| file | trunk | branch | merge-base | difference trunk to branch |
|---|---|---|---|---|
| `CLAUDE.md` | 717 lines | 717 lines | 1018 lines | **none: byte-identical** |
| `AGENTS.md` | 706 | 706 | 1007 | none |
| nested `CLAUDE.md` and `AGENTS.md` (editor-v2, jjel, jjscript, jjtl, model, redux, services/export, styles; 16 files) | present | present | absent | none (diff over `*CLAUDE.md`, `*AGENTS.md` is empty; positive control: `docs/PROTOCOL.md` differs) |
| `docs/CODEBASE-MAP.md` | 87 | 87 | absent | none |
| `docs/PROTOCOL.md` | 303 | 303 | 175 | **one line**: P9 on the branch adds the sentence naming `npm run log:rotate -- --fold --rotate --write` |
| `docs/HARNESS-DOCS.md` | 553 | 553 | 553 | **four lines**: branch is 1.2 (2026-09-09) with clause range P1..P12, trunk is 1.1 with P1..P10; both are stale against P15 |

Sections present on one side only in `CLAUDE.md`: none. The §9.3 the backlog called branch-only lives in `frontend/src/model/CLAUDE.md` on both refs, and `9b3d74857` did bring the trunk's split into the branch.
**The merge leaves `CLAUDE.md` with one house** (§6.6): the auto-merge of the file is clean because both sides carry the same final content, and the result equals the trunk's blob. Two conditional residues:
(1) P9 on the branch cites `npm run log:rotate`, so the P9 line and `920b84895` must travel together or the trunk cites a script it lacks (RC-10);
(2) `HARNESS-DOCS.md` 1.2 lands stale. The 54-line divergence of the backlog is now 0.

## 8. The working trees

`~/jjodel` (branch `validation-skeleton`, `92d180708`): modified `docs/mde-intelligence-2026/metrics-snapshot.md`, `paper/main.pdf`, `paper/main.tex` (Alfonso's lane, never committed by a Claude Code lane);
untracked `.lsp.json`, `.tracer/`, `docs/prompts/claude_2026-09-18_2219_prompt_default_view_parity.md`; nothing staged. **None of the six would make git refuse a merge or a checkout** of the trunk into that tree:
the three paper files do not differ between the two refs (0 files under `docs/mde-intelligence-2026/` differ; positive control: `docs/PROTOCOL.md` appears in the same list of 258 differing files), and none of the three untracked paths exists on either ref.
The 2026-09-09 case does not recur: `ValidationRulesModal.tsx` and `.scss` are clean in that tree (they differ between the refs, so a checkout there would have needed them clean, and they are).
Side finding: the prompt file 2219 is untracked in `~/jjodel` and **absent from the trunk**, while the trunk's log and `decisions.md` cite it (3 lines).
`~/jjodel-release`: `git status --short` empty before and after this report's writes; **no `node_modules`** in either `~/jjodel-release/` or `~/jjodel-release/frontend/`, so any gate run in Phase 2 needs the temporary symlink to `~/jjodel/frontend/node_modules` of P14, removed afterwards.
`~/jjodel-sim` (`simulation-engine`): clean, information only.

## 9. Mechanism: the decision for Alfonso

P14 says code reaches the trunk by `git cherry-pick -x` of explicit shas, never by range, and names no merge commit. Per-sha over 220 commits is not a working option; what remains are three shapes. The numbers next to each. I do not choose.

| | (a) one merge commit | (b) cherry-pick by front | (c) squash per front |
|---|---|---|---|
| P14 | needs a declared derogation, ratified in `decisions.md` before the merge (RC-11) | literal | a squash commit is not a `cherry-pick -x` of the branch's shas: it names none of them |
| conflicts | 10 files, 17 hunks (section 5): 11 hunks take-a-side (milestone 2, `decisions.md` 1, `spec_attive.md` 2, modal 4, `lastViewpoint.ts` 2), 2 need a tool lane (log), **4 semantic (IR trio)** | measured alone against the current trunk, code commits only: **24 of 46 conflict**, 22 clean. Indicative only: many conflict for a missing predecessor, not for a true overlap. Docs commits not simulated. | the same true overlaps once per front, plus every front rewritten by hand |
| the 41 duplicates | 3-way sees identical patches: zero conflicts from them; both copies stay in history (30 of 41 carry `-x`) | skipped by construction (already there); `git cherry` keeps saying `-` for them, as today | skipped, same |
| the 71 unpushed commits | become reachable from the trunk: pushing the trunk publishes them (54 with no `.ts/.tsx/.scss`, 17 with) | untouched; only the picked ones reach `origin` under new shas | untouched; nothing of them reaches `origin` except through the squash |
| cited shas | resolve on the trunk: the 5 branch-only shas cited by `decisions.md` and 82 of the 87 shas cited by the branch log become ancestors | they stay branch-only; `-x` trailers are the only bridge (the log cites 82 shas, `decisions.md` 5, that are not on the trunk) | they stay branch-only and would never appear in trunk history |
| per-commit history | kept (`Co-Authored-By` on 209 of 220, `Model:` on 17 of 220, 42 log entries with `Corregge`) | kept, under new shas | lost: the per-commit `Model:` trailer (17 of 220) and `Co-Authored-By` (209 of 220); the 42 `Corregge` fields name prompt documents, not shas, but the 82 shas the log cites lose their targets on the trunk (RC-7) |
| what it costs | one pass, a semantic decision first (questions 1 to 3), the log lane, one visual check | one pass per front (8 code fronts plus docs), each with its own conflicts; the R-IRN/D5 decision recurs when the Symbol Editor front is picked | eight hand-written squash commits; the decision recurs |
| edge views | included (section 6) | need the ordered chain of section 6 | included if the Create View front is squashed whole |

Independent of the mechanism: the trunk moves (it merged staging at 16:29 and the branch gained five commits at about the same time), so **every number above is valid for (`2da08a722`, `92d180708`) only** and must be re-measured on the day, after both sides are frozen.

## 10. Open questions for Alfonso

1. Corner radius: R-IRN-31 (`Conditional<number>`, ignored on SVG-painted shapes, absent is `undefined`) or D5 (`number`, honoured on polygons, absent is not zero), or a stated superset?
2. Border: does the parity S2 rule (separator colour reuses the box border colour) move onto the per-axis `borderColor` of D1, and is that ratified in `decisions.md`?
3. #139 and the branch fixed the same two defects: take the branch side in all six hunks and accept a visual check (P8) of the combined result?
4. Which mechanism, (a), (b) or (c)?
5. If (a): what is the wording of the P14 derogation, and who ratifies it before the merge?
6. Who runs the log lane (union, fold, rotate, archive de-duplication), before or after the merge, and does it use the branch-only `log:rotate` tool?
7. The branch carries eight simulator-front commits (`5185a2b77`, `c9c522e67`, `c33f92e99`, `2d420c64f`, `46f4f584d`, `5dcca3f6d`, `c46fc4fab`, `69577d13e`: R-SIM-7..15, computational-model spec, prompts, discoveries), and `git branch --contains` finds none of them on `simulation-engine`: do they go to the trunk now?
8. `11bd784b6` has the subject `reminder` and is a code commit: accept it as it is (no history rewrite), or note it in the derogation?
9. `claude_2026-09-18_2219_prompt_default_view_parity.md` is untracked in `~/jjodel` and absent from the trunk although the trunk cites it: where is it committed?
10. Pushing the trunk after (a) publishes 71 unpushed branch commits: acceptable, or push the branch first?
11. `HARNESS-DOCS.md` 1.2 (branch) is stale against P15: land it and close ticket `2b1cc6d05`, or fix before the merge?
12. Who freezes the trunk and the branch between this report and Phase 2, given both moved today?

## Dependencies and risks

- **Nothing was built.** No `node_modules` in the trunk tree and Phase 1 is read-only: "merges clean" means textually clean. `typecheck` (baseline 33), `build`, `vitest` and the visual check are Phase 2.
  The two semantic findings (5.6) were found by reading the auto-merged text, not by a compiler; the compiler will find more than the two I named.
- The per-commit "alone onto the trunk" figures are simulations of one commit against the current trunk, not chains; they overstate true overlap and understate order dependence.
- The 11-of-17 "take a side" count assumes the proposals of section 5 hold; six of them (log 2, IR trio 4) do not resolve by choosing a side.
- The trunk merges `origin/staging` periodically; the next merge changes the conflict set again (it just did, 7 to 10).
- Docs commits and log entries of this lane are on the trunk while the log rotation lane (P13) is exclusive: the lane's entry is in `docs/log-inbox/merge-gate.md` and is not folded here.

## Appendix A. The 220 non-duplicates by group

Sha lists, oldest first within a group; a commit appears in every group it touches.

- `docs/(root files)` (79): `45436a1c1` `b975f2d16` `8de5732c4` `ce68245e1` `f41d520e9` `ca48c1d8a` `1d347e6b5` `819e67cf0` `e19524eab` `6f43a8ab3` `46593c8b4` `848d182a2` `75a7e2893` `cf021ca28` `df5589526` `ad8a1c390` `bbf5583e2` `4653cdca6` `c83aa268a` `d34a99ad2` `4a63f645a` `16b1e3d20` `471b1bfba` `98f8aa4da` `802dcddfc` `a25d0646c` `f0e0ac83d` `b6e39877b` `02480fe06` `3cdb51462` `ee5c9b6fc` `d87273a1d` `46f4f584d` `b4016983f` `7e6f741c7` `5185a2b77` `57b03d06a` `12ab0fb43` `26d04febc` `27af5e3a7` `29e8ac921` `2602c261a` `d79f994c9` `53d902de5` `716fa6381` `75234a77b` `cf9d3fa9e` `8cc39ddc2` `1541f799b` `5343e142b` `cebd8aaa7` `bbaf91a71` `5eadc9541` `9f0843325` `119803916` `56f803a8a` `cf3566fc1` `f475fc1cb` `175d33fd7` `cd7794ae1` `6ff6c6a82` `4a3f3c87d` `e36eec58b` `be95cfe24` `80cb3a8aa` `df8a30941` `7e38f7859` `97a41475e` `3de7bef90` `095f27cd1` `9378e405e` `eab6eb23f` `7774ce48c` `05e27b483` `9b3d74857` `7f5d8edbc` `9899f5d23` `603546085` `92d180708`
- `docs/discovery` (43): `8de5732c4` `f41d520e9` `1d347e6b5` `819e67cf0` `e19524eab` `6f43a8ab3` `e321cb14b` `75a7e2893` `cf021ca28` `df5589526` `ad8a1c390` `bbf5583e2` `4653cdca6` `d34a99ad2` `4a63f645a` `471b1bfba` `802dcddfc` `f0e0ac83d` `46f4f584d` `2d420c64f` `767220122` `5f00baf71` `ad32a8ea8` `240f5af1f` `b9ff7f36a` `b87ace74c` `b0b70bd54` `0db11db35` `566e814ff` `37151aee4` `a4ec9313d` `dbfeb67ac` `73bf25fc6` `6ae3e15eb` `be95cfe24` `4f07114f5` `df8a30941` `1f80cb048` `5c9e88d16` `7774ce48c` `fbcbcb820` `7f5d8edbc` `941a94da9`
- `docs/prompts` (38): `046809a9b` `5bafa776a` `69577d13e` `c46fc4fab` `c33f92e99` `18d615cc2` `afecbb8f0` `35b196a78` `fe7a33073` `1ed86ab0e` `d0e920323` `a4e6b58c5` `531e09644` `1f93c6a7e` `2eae64bec` `e37976856` `ef9372ba2` `fcf8eaabd` `ba6769cf1` `6c58e9ecc` `9114cae96` `2544ab50f` `803fada8d` `4079fff34` `3e48caed8` `af95e5191` `4494f46fa` `f88026423` `3a3506a26` `4f07114f5` `33c84fca2` `1f80cb048` `9a9f7952b` `5642a7d80` `7774ce48c` `5fffe7d61` `0c7f6b781` `9e8ed93a1`
- `docs/log-inbox` (31): `4ec77cc53` `290594bbd` `5eadc9541` `2a7992cb4` `4247e0eb3` `e436eae1d` `2bd474c43` `69ec29216` `11ff7cf4f` `b804bb331` `0e028f13a` `46076c0bf` `c1b93875e` `018273f6b` `60dad5977` `3a502ed13` `0c1abc17f` `0869f23b0` `53fd46f40` `1231edda4` `e9d6ee83f` `4f07114f5` `a39a9aa05` `31f60d2cd` `b3c6b6976` `1f80cb048` `9a9f7952b` `095f27cd1` `fbcbcb820` `aafa5648b` `8aa303ff1`
- `frontend/src/components/editor-v2/viewpoint/authoring` (11): `8da572191` `aeb0c9134` `b1abdc6f1` `bc42b259c` `27f80d1ac` `3e4f7536f` `b53d2f5dd` `e343242bd` `5c4db90b1` `3f5fe347b` `70ac9055f`
- `docs/sessioni` (9): `26d04febc` `c1ae719c6` `1f7341ba4` `c64322605` `149477e58` `bd56aeace` `da7a2ff12` `eac9d8f9b` `c66e253fc`
- `frontend/src/components/editor-v2/(root files)` (9): `c246550c1` `a5ed5406d` `c940a05e8` `11b74a611` `86f822d50` `f554aa5fb` `45558b815` `d20d8e42c` `9b3d74857`
- `frontend/src/components/editor-v2/viewpoint/ir` (9): `8da572191` `27f80d1ac` `3e4f7536f` `7801d7a58` `b53d2f5dd` `e343242bd` `5c4db90b1` `f98e67cb5` `366300c03`
- `frontend/src/jjscript` (9): `efee0dbd9` `ccd867bda` `2b357af17` `fad85bae5` `09ce4b60c` `4898aa60f` `9345a4046` `139350eea` `9b3d74857`
- `frontend/src/model` (8): `9f16e7703` `a02459f59` `7915ea2ad` `c246550c1` `efee0dbd9` `a5ed5406d` `c87f5a917` `9b3d74857`
- `(repo root) AGENTS.md` (5): `848d182a2` `c83aa268a` `16b1e3d20` `ff68bc862` `9b3d74857`
- `frontend/src/components/TreeViewSidebar` (5): `868ba9a3c` `1731cbc66` `70bcbc5f8` `ca3fdaa99` `faa893a77`
- `frontend/src/components/editor-v2/problems` (5): `c246550c1` `c87f5a917` `b6a0e7bd6` `c940a05e8` `11b74a611`
- `(repo root) CLAUDE.md` (4): `848d182a2` `c83aa268a` `16b1e3d20` `9b3d74857`
- `frontend/src/components/project` (4): `d039fc7e7` `9335f4417` `98e6fd6cb` `1731cbc66`
- `docs/spec` (3): `5dcca3f6d` `5185a2b77` `c9c522e67`
- `frontend/src/utils` (3): `1731cbc66` `70bcbc5f8` `f554aa5fb`
- `frontend/src/(root files)` (2): `c246550c1` `a5ed5406d`
- `frontend/src/components/Jodie` (2): `ccd867bda` `fad85bae5`
- `frontend/src/components/contextMenu` (2): `70bcbc5f8` `1f3caab09`
- `frontend/src/components/editors` (2): `d039fc7e7` `9335f4417`
- `frontend/src/components/validation` (2): `a5ed5406d` `11bd784b6`
- `frontend/src/events` (2): `c246550c1` `a5ed5406d`
- `docs/archivio` (1): `69d0d07b0`
- `docs/handoff` (1): `1f93c6a7e`
- `frontend/(package.json)` (1): `920b84895`
- `frontend/(vitest.config.ts)` (1): `920b84895`
- `frontend/scripts` (1): `920b84895`
- `frontend/src/components/alert` (1): `0214f29d4`
- `frontend/src/components/editor-v2/components` (1): `8da572191`
- `frontend/src/components/editor-v2/nodes` (1): `6001add8b`
- `frontend/src/components/ui` (1): `aeb0c9134`
- `frontend/src/jjel` (1): `9b3d74857`
- `frontend/src/jjtl` (1): `9b3d74857`
- `frontend/src/joiner` (1): `9f16e7703`
- `frontend/src/redux` (1): `9b3d74857`
- `frontend/src/services` (1): `9b3d74857`
- `frontend/src/styles` (1): `9b3d74857`

## Appendix B. Trunk-only commits by lane (non-duplicates)

- release 3.0 and trunk-to-staging merges (12): `cc44ab251` `469112b46` `fd07e9c47` `67be59e05` `5ed1d9853` `27a0a436e` `5782d025d` `b6ec8c63a` `7e37a1b3d` `6e9a31fe7` `96acb6ae9` `cb699ad58`
- R-VAL docs written on the trunk (checkpoints, milestone plan, transport entry) (5): `ba34ee198` `f271ed833` `019332198` `1b2d587e4` `48acb79a1`
- staging #147 (Custom provider model) (6): `c6e735b01` `fb8c8866d` `4e9192349` `9be7da9a9` `3c983d8fa` `d6b275cb9`
- staging #128 (JSON export, external objects) (5): `7c4e763bf` `d0a51de50` `720fdbb8c` `0e4ce9f17` `658eb69ab`
- staging #139 (tree view born with IR, modal to foreground) (4): `7b5f4fd3a` `f00d9e525` `6e0fb09e4` `859fe3225`
- staging #142 (inherited customization, rail reference editor) (6): `93021f62d` `5bcfb4a2a` `9625d1372` `574a106ba` `c8fbab27c` `d5060a057`
- CLAUDE.md split, P-2026-09-18-2110 (17): `32dbe1ef8` `084d99b3b` `4355a148c` `da07e3169` `091577e98` `62d139fa1` `e22ccfe5e` `c8cdc8efe` `f8ede528a` `34ddaf0c7` `19112458f` `717b29a64` `068d59367` `71f7ae0dc` `2f8e4de93` `aae7401c1` `2b1cc6d05`
- default view parity, P-2026-09-18-2219 (7): `400095370` `12ae8c41c` `6ee6efcd5` `971234d94` `516afd310` `c591cf351` `20ddf067e`
- merge of origin/staging (16:29) (1): `d4d9c4323`
- this gate prompt, P-2026-09-19-1622 (1): `2da08a722`
