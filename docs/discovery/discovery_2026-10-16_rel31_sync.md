# Report 2026-10-16: release 3.1, sync with origin trunk and staging, D-A1 closed (P-2026-10-16-1000)

- Prompt-ID `P-2026-10-16-1000`, chat `C-2026-10-11-1812`, front `release-3-2`, lane full (critical zone, RC-30
  go-ahead `P-2026-10-16-1000`). Session `687966e7-7bc4-4073-ac68-146a268849c1`, unattended; resumed once after an
  API rate limit (11:04), with no step redone.
- Tree `~/jjodel-w-rel31-sync`, branch `rel31-sync`, start `e0fa0c0c2`, `frontend/node_modules` symlinked by the chat.
  Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`). No subagent.
- Tags: **M** measured by a command in this lane, **R** read in a file. Artefacts outside every tree:
  `~/.jjodel-lanes/P-2026-10-16-1000/`: `gates/` (gate outputs), `probe/` (D-A1 and load probes), `crops/` (22 crops),
  `crop-scripts/` (the Playwright scripts and their `.out`), `gv-save/` (the regenerated demo export).
- LIR: `docs/discovery/discovery_2026-10-16_rel31_sync_lir.md` (`bd0dfe614`, before any merge).
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

## 0. Answer in brief

**`rel31-sync` carries the origin trunk, D-A1's report and fix, and staging. Typecheck is at 0, and every other gate is
at its known baseline. The 2.228, 2.229 and 2.230 saves open. Two findings for Alfonso come from the new crop items.**

1. Merged (M): origin trunk **`38f0add16`** (merge `38c60c0e1`), `da1-disc` **`e45998ecd`** (merge `7900e46e6`), staging
   **`e8fd99c58`** (merge `f8da990c7`). `38f0add16` is an ancestor of `e8fd99c58`. Conflicts: 5 in step 2 and 2 in
   step 4, all text and none semantic (§2). `VersionFixer.tsx` is untouched (blob `ff89660e5`) and the chain ends
   `2.229 -> 2.230`. PR #184 is not in.
2. D-A1 fixed in demo data (`0c5a0de42`, one line). Probe (M): with the new file, Sales keeps its three flow nodes after
   «Add LaneSet», `unclaimed` is `[]`, there is no «In no container», and Auto layout keeps them in Sales. The old file
   on the same build reproduces the defect (§3).
3. Gates (M, §5): typecheck exit 0 with **0 errors**; vitest 9130/9134, 10 red files = the 9 import reds plus
   `criticalZone.test.ts` (go-ahead env leak, 70/70 unset); build exit 0; smoke GREEN 12/12 on the second run;
   `check:docs` 5/5; `check:codegen-lazy` ALL GREEN (off, on); `versionfixer_3_0_0_save` 10/10; `check:agents` PASS.
4. **CLAUDE.md §17 on this branch now says baseline 0.** Staging's RC-48 edit came in by merge, unedited. The trunk's
   `CLAUDE.md` still says 14 until this branch is merged.
5. `check:addonly` flags the step 2 merge (324 entries). Measured: all 324 sit verbatim in the archive. The flag comes
   from origin's fold followed by its rotation, seen through one merge; it is not a rewrite (§5.1).

**Decisions awaiting Alfonso** (detail at the end): DA-1 the governance merge (`CLAUDE.md`/`AGENTS.md` ride on this
branch); DA-2 the `check:addonly` flag at the trunk merge; DA-3 JjScript-nested children drawn outside a free-layout
container until Auto layout (crop 11); DA-4 «Pool with lanes» has D-A1's flaw one level up (measured); DA-5 Petri p1
draws 2 static dots while the Marking has none; DA-6 the visual GO on the 22 crops.

**Questions**: none blocking. `Recommended:` lines are with each DA.

## 1. Shas merged

| step | ref | sha merged | merge commit | parents |
|---|---|---|---|---|
| 2 | `origin/alfonso-frontend-jjtl` (after `git fetch origin`, 10:0x) | `38f0add16000a4cb55672401bdd7c24665b62a92` | `38c60c0e1` | `bd0dfe614`, `38f0add16` |
| 3 | `da1-disc` | `e45998ecd` (report `71c07b6fd`, inbox `e45998ecd`) | `7900e46e6` | `38c60c0e1`, `e45998ecd` |
| 4 | `origin/staging` | `e8fd99c58d2c57df20b006987dbffccf90faad83` | `f8da990c7` | `0c5a0de42`, `e8fd99c58` |

Other lane commits: LIR `bd0dfe614`; D-A1 fix `0c5a0de42`; Check E `eccd63cb0` (the prompt's file) and `f8594bfc4`
(the ACK, outside the list, §4). PR #184: `staging-dam-merged` at `d10396ff5`, OPEN, not an ancestor of the merged
staging (M, `git merge-base --is-ancestor`, exit 1).

## 2. Conflicts and resolutions

### 2.1 Step 2, origin trunk (two merge bases `ec62c080e`, `cb5952876`)

Juri's `c2cf77016` («merge: alfonso-frontend-jjtl into staging») resolved the same staging × trunk conflicts as L1's
`c36e49d87`, each on its own. Both lines meet here.

| file | the two sides | resolution |
|---|---|---|
| `frontend/src/components/Jodie/Jodie.tsx` | the same two imports in opposite order | origin's order. Both behaviours read after the merge (M, `command grep`): the gate at `:734`, `:779`; consumer mode at `:221`, `:536`, `:729`, `:776` |
| `.../Jodie/__tests__/reservedIdentifierGate.test.ts` | origin adds one comment line; both pin `toBe(7)` | origin's line kept |
| `frontend/src/constants/defaultPrompts.ts` | both at chat prompt v7 with identical prompt text; changelog notes differ (L1: separate v6 and v7 notes; Juri: «Two parallel v6 lines» plus a joining v7) | origin's notes, ratified by Juri (`83a7368b4`). Version 7 in both |
| `docs/decisions.md` | R-NEST placed differently, with identical text (diff exit 0); origin adds R-REF-1..6, this side RC-49 and R-REL-1 | one R-NEST, where origin has it; R-REF from origin; RC-49 and R-REL from this side. Result = origin + 9 lines of this side (M) |
| `docs/log-inbox/harness.md` | origin folded the inbox's 86 entries into the log; this side added one entry (2026-10-16) | the inbox keeps this side's entry only |

Checks (M): every non-blank line of both sides of `decisions.md` is present in the result (0 missing each), with no
duplicated `**R…-n**` id. For the inboxes: every line that any inbox lost in the merge sits in the merged log or archive
(0 missing over 41 inboxes). No inbox heading also appears in the log. Index after resolution = the `git merge-tree`
set (61 files). Merged areas tested before the commit: `reservedIdentifierGate`, `refSlot`, `instanceManager10c`,
`instanceManagerOutline`, 119/119.

### 2.2 Step 4, staging (merge base `38f0add16`)

The four conflicts the prompt listed (`decisions.md`, `Jodie.tsx`, the test, `defaultPrompts.ts`) were taken up by
step 2. Two remain:

| file | resolution |
|---|---|
| `docs/decisions.md` | union in order: RC-48 (staging) then RC-49 (this side) |
| `docs/log-inbox/harness.md` | union in order: staging's 2026-10-13 entry, then this side's 2026-10-16 entry |

Every other file of the staging delta carries staging's hunks verbatim (M, per file, the `-U0` hunk set of
`38f0add16..e8fd99c58` = the staged hunk set, 16 files). This includes `CLAUDE.md` and `AGENTS.md` (RC-48);
`check:agents` PASS after the merge. `VersionFixer.tsx` (R): last step `private ['2.229 -> 2.230']` at `:1366`, 34
steps, no `2.2291`.

## 3. D-A1 (step 3)

- Fix: `frontend/scripts/probe/bpmn-lanes-fixture.ts:80`, from `predicate: { op: 'exists', path: '$childLaneSet.value' },`
  to `predicate: { op: 'not', arg: { op: 'empty', path: '$childLaneSet.value.$lanes.values' } },`.
- Regenerated on this tree's dev server (3161): `GV_ONLY=bpmn GV_SAVE=<lane>/gv-save`, 12 PASS, exit 0.
  - The old file `gv-bpmn.jjodel` (sha1 `c936a771…`, format 2.229, predicate `exists`) is now
    `~/jjodel-demo-exports/graphvertex/gv-bpmn.jjodel.bak-2026-10-16`.
  - The new file (sha1 `44f12a8f…`, format **2.230**, predicate read back decompressed: `not empty`) took its place.
- Probe (M), the D-A1 scripts copied to `<lane>/probe/da1/` with this tree's paths:

| run | after «Add LaneSet» | after Auto layout |
|---|---|---|
| new file, Add | `childrenOf[Sales]` = the 3 flow nodes; `unclaimed` `[]`; 5 visible edges; only dot «Conformance» on In stock? (pre-existing) | Order received (124,600), Check order (460,584), In stock? (876,592), inside Sales (78,568, 1602×180) |
| new file, control (no Add) | — | the same three positions |
| old file, Add (positive control) | `childrenOf[Sales]` `[]`; `unclaimed` 3; 8 visible edges; «In no container» ×2 and «2» on In stock? | (1120,672) (1072,1048) (1112,1368), outside Shop |

The release build gave the same result (crops 10a-10c, §7): after the Add, no «In no container» and 5 edges; after Auto
layout, all three nodes are inside Sales' box.

## 4. Check E (step 5)

- `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md`: `Front: harness` after `Chat:` (`eccd63cb0`).
  - Why harness: its content is the Claude Code harness (output-budget hook, quiet runner, effort default, explorer
    agent).
  - `harness` is the permanent front of `docs/harness/fronts.json` for that work, and the front of its follow-up
    P-2026-10-15-1725.
- A second Check E red that the prompt did not name: `claude_2026-10-16_0937_ack_ratifica_P-2026-10-15-1725.md`
  (committed `3797b4555`, 09:38) has no header block. `Front: harness` was added before its `Request:` line, in a commit
  of its own (`f8594bfc4`), so it can be reverted alone.
- `check:docs`: 5/5 after both (M).

## 5. Gates (foreground, tip `f8594bfc4`, tree clean)

| gate | result |
|---|---|
| `npm run typecheck` | exit 0, **0** `error TS` lines |
| `npm run typecheck:scripts` (not asked) | exit 0 |
| `npx vitest run` | exit 1; files 363 passed, 10 failed (373); tests 9130 passed, 4 failed (9134); 130 s |
| the 10 red files | the 9 import reds of §17, plus `scripts/hooks/__tests__/criticalZone.test.ts` (4): `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-10-16-1000` is set in this session (ticket 2026-10-01); `env -u … vitest run` on it gives 70/70 |
| `versionfixer_3_0_0_save.test.ts` | 10/10 |
| `npm run build` (0 `VITE_` vars; no `.env*` sets `VITE_CODEGEN`) | exit 0, 1 min 29 s, chunk-size warning only (plus Sass deprecations) |
| `npm run smoke` (`SMOKE_URL=http://localhost:3161`, dev server of this tree) | run 1 RED: `empty-project` NOT REACHED, `page.goto` timeout 30 s, load average about 10; run 2 **GREEN**, 12 passed, 0 failed, 3 skipped |
| `npm run check:docs` | exit 0, 5/5, 10 warnings (inboxes waiting to be folded) |
| `npm run check:codegen-lazy` | ALL GREEN: off (87 chunks, only `setting.ts`, the worker named by no chunk); on (89 chunks, `CodePanel` dynamic entry, 19 generator modules outside the eager closure) |
| `npm run check:agents` | PASS |
| `npm run check:addonly -- <sha>` (not asked, RC-34) | 6 of 7 lane commits clean; `38c60c0e1` flagged (§5.1) |

- Vitest against L4's 9026: +108 tests, from #172 and the typecheck lanes.
- **Typecheck baseline here:** 0, and `CLAUDE.md` §17 on this branch says 0 (RC-48, by merge). The trunk's text says 14
  until `rel31-sync` lands; `CLAUDE.md` was not edited.

### 5.1 The `check:addonly` flag on `38c60c0e1`

- The gate compares a commit with its first parent. An entry missing from an inbox is legitimate only when it reappears
  in the active log.
- Origin folded the inboxes into the log (`23df2d099`) and then rotated the log (`fd2494809`). Through one merge, those
  entries go from inbox to archive.
- Measured on the 367 entries of the first parent's inboxes: 9 still in their inbox, 34 in the active log, 324 verbatim
  (whole entry) in the archive, 0 missing.
- So it is not a rewrite. The trunk merge of this branch will meet the same flag (DA-2).

## 6. Probes (step 7, M, dev server 3161)

`<lane>/probe/load/load3.ts` is L1's `staging-load` probe with a 2.228 part. The model is opened through the app's
global `DockManager`: the module import of `DockManager.tsx` opened no tab on this server (measured, no error).
Result: **23/23**.

| save | file version | store after load | load error | M1 canvas | VersionFixer lines |
|---|---|---|---|---|---|
| `scripts/probe/fixtures/scene_2_DemoPetri.jjodel` | 2.229 | `{"n":2.23,"conversionList":[2.229]}` | null | 13 nodes, 12 edges | none |
| `src/redux/__tests__/fixtures/save_3_0_0.jjodel` | 2.228 | `{"n":2.23,"conversionList":[2.228,2.229]}` | null | 2 nodes, 1 edge | `[VersionFixer 2.228 -> 2.229] 2 tipo/i primitivo/i aggiunto/i (Expression, Action).` |
| DemoPetri exported by this build (File → «Download Project») | 2.230 (`{"n":2.23,"conversionList":[2.229]}`) | the same | null | 13 nodes, 12 edges | none |

- No page error. Console errors: `init_dash` only, which is in the smoke baseline.
- The 2.229 and 2.230 crops are not byte-identical: 1379 pixels differ, all inside (215,852)–(262,899), the floating
  Jodie button. The canvas is pixel-identical.
- The old D-A1 demo file (2.229) also loaded on this build (§3).

## 7. RC-23 crops (step 8): release build, `vite preview` on 3161, no `VITE_CODEGEN`

- Playwright Chromium 1600×1000, light theme, offline user seeded as the smoke does.
- Jodie talks to a Custom provider answered by a Playwright route (L4's method).
- Files are in `<lane>/crops/`. They are described, not judged.

| file | what it shows (DOM readings in `crop-scripts/*.out`) |
|---|---|
| `01a_new_project_default_class_view.png` | New project, Basic, «New metamodel», Class and Attribute dragged: one node `NewClass` with `attr_0 : EString` |
| `01b_new_project_default_object_view.png` | «New model», `NewClass` dragged from Instances: one node with `attr_0 —` |
| `02_symbol_editor_open.png` | DemoPetri, viewpoint derived as Petri net (classic), «View for Place», Symbol tab: `symbol-editor-modal-backdrop` open |
| `03_sim_petri_classic_steps_and_drag.png` | Simulation on, profile «Petri net (P/T)» applied; Reset, two Steps (choice t1). Status «Running · step 2 · ε: t1 (p1 → p2 ×2) fired», Marking `lock`, `p2 ×4`. p3 dragged (1073,176)→(1190,262); 0 canvas-error elements, 0 «Maximum update depth» |
| `04_jjscript_run_m1_container_summary.png` | ESM fixture, new `model_1`, Jodie (mocked) six M1 lines including `create instance of Transition "go" in idle.transitions`, Run: «Script executed», instances 0 → 4 (+4), 6 commands |
| `05_jodie_refuses_reserved_name.png` | two model calls (roles `system,user` then `system,user,assistant,user`); «Run and Step are refused: … copy (line 3)»; Run: «Script not executed: 1 error», «'copy' is a JjScript reserved word.»; classes unchanged |
| `06_settings_advanced_no_experimental.png` | Settings → Advanced, codegen key `'true'`: no «Experimental», no «Code generation» |
| `07_m1_editor_advanced_no_code_pill.png` | `[title="Code generation"]` 0 in Basic and Advanced; no request for `CodePanel-*` or `runner.worker-*` |
| `08_settings_appearance_no_dark.png` | `theme='dark'` seeded (at boot `data-theme` null): Appearance shows «Coming Soon» only, 0 theme radios, no «Dark» |
| `09_about_v3.1.0.png` | About Jjodel: `v3.1.0`; footer `v3.1.0 (6048)` |
| `10a_da1_fixed_before_add.png` | new `gv-bpmn.jjodel`, BPMN viewpoint, Shop with Sales and Warehouse, Customer, Supplier |
| `10b_da1_fixed_after_add_before_auto_layout.png` | after «Add LaneSet (childLaneSet)» on Sales: no new node, no box changed, 5 edges, dots: «Conformance» on In stock? only |
| `10c_da1_fixed_after_auto_layout.png` | Auto layout: Order received, Check order and In stock? inside Sales' box (`insideSales` true ×3) |
| `11a_jjscript_create_in_gv_container_before_save.png` | Jodie Run of `create instance of Task "Pack"/"Label" in CustomerProcess.flowElements` (+2). Store: both in `CustomerProcess.flowElements`, in `model.objects`, one v2-flow `DVertex` each at (50,2150) and (470,2150). Containment: `parentOf` Customer for both, `unclaimed` `[]`. Drawn **below and outside** the Customer pool (zoomed out to 30 % to show them); pool box unchanged |
| `11b_jjscript_create_in_gv_container_after_reopen.png` | save, dashboard, reload, reopen: version 2.23, same store records and vertex positions, same containment, still outside the pool |
| `11c_jjscript_create_in_gv_container_after_reopen_auto_layout.png` | beyond the list: Auto layout puts Place order, Receive goods, Pack and Label inside the Customer pool |
| `12a_data_manager_add_lane_in_manager.png` | Data Manager (viewpoint picker «Data manager»), `Shop lanes` selected, «Add Lane» → «New Lane» dialog («not created until Create»), name `Returns`, Create |
| `12b_data_manager_add_lane_canvas_before_save.png` | canvas: `Returns` in `Shop lanes.lanes`, `DVertex` at (1580,620), `parentOf` Shop. Drawn as a third band at the bottom of Shop (826×23 px at 90 %, label «R…»); Shop's height grows from 342 to 364 px; Returns' bottom edge is 1 px below Shop's (551 vs 550) |
| `12c_data_manager_add_lane_after_reopen.png` | save («Unsaved» → none), reopen: the same records, positions and boxes |
| `x_pool_customer_after_add_laneset.png` | beyond the list (DA-4): «Add LaneSet» on `Customer process` from the Data Manager: `childrenOf[Customer]` goes from 2 to `[]`, `unclaimed` `[]`; nodes not yet moved |
| `x_pool_customer_after_add_laneset_auto_layout.png` | then Auto layout: Place order and Receive goods outside the Customer pool's box |

**Petri crop, Marking against the tokens drawn (M, DOM of each place node after the two steps and after the drag):**

| place | Marking | drawn |
|---|---|---|
| p1 | none | `svg.ir-marker-svg` with **two** `path` dots from the model's `tokens = 2`; empty `div.sim-node-run`; no `sim-active` class |
| p2 | `×4` | no marker; `sim-node-run__dot` and `sim-node-run__count` «4»; `sim-active--derived` |
| lock | marked | one marker dot (`tokens = 1`) and a `sim-node-run__dot` |

**They disagree on p1:** the run has no token there, and the canvas draws the two static dots. They agree on p2 and
`lock`. After Reset the panel read «Marking lock, p1 ×2», which matches the dots. This is L4's DA-3, now measured from
the DOM.

Crops for D-A1 on the dev server (`crops/da1/`): `fixed_add_1..3`, `fixed_control_1,3`, `oldfile_add_1..3`.

## 8. Files

Changed by the lane:
- `frontend/scripts/probe/bpmn-lanes-fixture.ts` (1 line, `0c5a0de42`).
- `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md` (1 line, `eccd63cb0`).
- `docs/prompts/claude_2026-10-16_0937_ack_ratifica_P-2026-10-15-1725.md` (1 line, `f8594bfc4`, outside the list).
- The LIR, this report, `docs/log-inbox/release-3-1-sync.md` (new).
- The merge resolutions of §2: `Jodie.tsx`, `reservedIdentifierGate.test.ts`, `defaultPrompts.ts`, `docs/decisions.md`,
  `docs/log-inbox/harness.md`.

Outside the tree: `~/jjodel-demo-exports/graphvertex/gv-bpmn.jjodel` (rewritten) and `gv-bpmn.jjodel.bak-2026-10-16`
(new). `/tmp/rel31sync/` holds the fixture copies and work shots, left in place.

The dev server and both `vite preview` runs on 3161 were started and stopped by this session. `dist/` and
`.vite-cache/` are gitignored.

Read (under `~/jjodel-w-rel31-sync/`): `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md` (Processo, RC-30, RC-31,
R-REL), `docs/claude-code-log.md` (head), `docs/log-inbox/release-3-1.md`; the reports
`discovery_2026-10-12_rel31_staging_merge.md`, `..._rel31_version.md` (§0, §1, §5-§7) and
`da1-disc:..._2026-10-15_da1_graphvertex_add.md`; the prompt `claude_2026-10-12_0115_…` (§5).

Also read:
- origin's `docs/lir/lir_2026-10-10_172_fields_leave_form.md` (§1-§3);
- `frontend/scripts/probe/bpmn-lanes-fixture.ts` (20-100, 175-215, 425-440);
- `frontend/src/redux/VersionFixer.tsx` (step list);
- `frontend/src/jjscript/parser/parser.ts` (295-330, 560-600, 1263-1272);
- `frontend/src/components/editor-v2/Toolbar.tsx` (325-350, 1180-1190);
- `frontend/src/components/abstract/DockManager.tsx` (165-180);
- `frontend/src/components/abstract/tabs/InstanceDetail.tsx` (1255-1285);
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (2690-2715);
- `frontend/src/common/U.tsx` (420-430);
- `frontend/scripts/lane-tracking.mjs` (55-125);
- `frontend/scripts/gates/check-addonly.ts` (header);
- `frontend/scripts/gates/check-codegen-lazy.ts` (header).

## Decisions taken (unattended)

1. Step 2 code conflicts resolved to origin's text (import order, one test comment, the v6/v7 changelog notes ratified by
   Juri). Version 7 and the prompt text are the same on both sides. Alternative not taken: keep L1's notes.
2. `decisions.md`, step 2: one copy of R-NEST, at origin's place (the two copies are identical).
3. The fold of the inboxes: entries origin folded stay in the log and archive, not in the inboxes.
4. `CLAUDE.md`/`AGENTS.md` taken by the staging merge as staging wrote them, not edited (prompt NON FARE).
5. The ACK's missing `Front:` line added, outside the prompt's list, in a separate commit, so that `check:docs` reaches
   the 5/5 the prompt requires.
6. Smoke re-run once after the cold first-navigation timeout; both runs kept.
7. The load probe opens the model through the app's global `DockManager`, the path the D-A1 and crop scripts use.
8. Crop 11 setup: «Customer process» renamed `CustomerProcess` through the L-proxy before the script. JjScript addresses
   a container by a bare name, and `rename` takes a bare target too. A two-line script, because a one-line reply renders
   as a snippet without Run (measured).
9. Crop 12 path: «Add Lane» on `Shop lanes`, because `Customer process.flowElements` has no Add (FlowElement is
   abstract).
10. Beyond the list: crop 11c (Auto layout after reopen), the two `x_pool_*` crops (DA-4) and the dev-server D-A1
    crops in `crops/da1/`.
11. The generator wrote its scene output into the lane folder (`GV_OUT`), not into the tree's `docs/discovery/assets/`.
12. The Status line of the prompt is not flipped: critical-zone lane, so the flip follows the visual GO (P13).

## Decisions awaiting Alfonso

- **DA-1 (governance, for the merge into the trunk).** `rel31-sync` carries staging's RC-48 edit of `CLAUDE.md` and
  `AGENTS.md` (§2, §5).
  - The trunk tree holds uncommitted `CLAUDE.md` edits from another chat.
  - `lane-run merge --launch` refuses a branch that changes a governance file unless it gets `--governance-goahead`
    (P16, RC-26).
  - Recommended: give the governance go-ahead for this merge, once the other chat has committed its `CLAUDE.md` edit
    on the trunk; the merge then resolves §2 and §17 by union.
- **DA-2 (gate).** `check:addonly` will flag the trunk merge of this branch, as it flagged `38c60c0e1`.
  - The cause is an inbox → archive move, made of a fold and a rotation, seen through one merge (§5.1).
  - Recommended: the trunk merge carries `Log-Repair: 23df2d099` with the §5.1 measure in its body, plus a ticket so the
    gate accepts an inbox entry that reappears in the archive.
- **DA-3 (what ships; L1's LIR R2 A1, in its measured form).** A child created by JjScript `create … in` under a
  free-layout graphVertex container is claimed by the container (no problem dot).
  - Its vertex is born on a grid row (y 2150), outside the frame, and is drawn there. The frame does not stretch.
  - It stays there after save and reopen; Auto layout puts it inside.
  - A Data Manager create under a partition container is drawn inside (crop 12).
  - Recommended: ship 3.1; a maintenance lane to place the vertex of a claimed child inside its container at birth.
- **DA-4 (demo data, measured).** «Pool with lanes» (`bpmn-lanes-fixture.ts:60`, the form the D-A1 fix copied) tests
  `not empty $processRef.value.$laneSets.values`.
  - An empty LaneSet that the Data Manager adds to `Customer process` switches the Customer pool to it and empties its
    children. Auto layout then throws Place order and Receive goods out (`x_pool_*`).
  - Recommended: a fast lane, the same kind of one-line fix
    (`not empty $processRef.value.$laneSets.values[0].$lanes.values`) and a re-export, not blocking 3.1.
- **DA-5 (perceptual, L4's DA-3).** p1 keeps two static token dots while the run's Marking has none on p1 (§7).
  - Recommended: a maintenance ticket, so the place's marker yields to the run's marking when a run knows the element.
- **DA-6 (visual GO).** The 22 crops of §7 on the RC-23 checklist.
  - The demo export `gv-bpmn.jjodel` is now format 2.230, so app (2.229) cannot open it.
  - Recommended: GO on 01-10 and 12; judge 11a-11c with DA-3.
