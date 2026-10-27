# Layer Impact Report 2026-10-16: release 3.1 sync with origin trunk and staging (P-2026-10-16-1000)

- Prompt-ID `P-2026-10-16-1000`, chat `C-2026-10-11-1812`, front `release-3-2`, lane full (critical zone), session
  `687966e7-7bc4-4073-ac68-146a268849c1`. Executor: Anthropic Claude Opus 5.5.
- Tree `~/jjodel-w-rel31-sync`, branch `rel31-sync`, start `e0fa0c0c2`. Critical-zone go-ahead: RC-30,
  `--critical-zone-goahead P-2026-10-16-1000` (prompt header).
- Written before any merge or edit (step 1). Tags: **M** measured by a command in this lane, **R** read in a file.
- This report is a set of hypotheses with evidence; whoever uses it re-reads the real files.

## 0. Answer in brief

1. **Shape of the incoming sides (M).** After `git fetch origin`: `origin/alfonso-frontend-jjtl` = `38f0add16`,
   `origin/staging` = `e8fd99c58`, as the prompt measured. `38f0add16` **is an ancestor of** `e8fd99c58`
   (`git merge-base --is-ancestor`, exit 0): Juri's trunk is staging at `c2cf77016` («merge: alfonso-frontend-jjtl into
   staging», parents `2b61eeeb3` and our `ec62c080e`) plus four docs commits. Staging then adds 21 commits on top
   (typecheck baseline zero, #172 open-once, R-REF-7, RC-48).
2. **Step 2 (origin trunk) touches one §3.1 file: `viewpoint/ir/IRForm.tsx`** (#172, an optional prop, view layer only;
   Juri's own LIR `docs/lir/lir_2026-10-10_172_fields_leave_form.md` comes with it). It has two merge bases
   (`ec62c080e`, `cb5952876`); `git merge-tree` reports **5 text conflicts**, all in files that L1 and Juri's
   `c2cf77016` each resolved on their own: `docs/decisions.md`, `docs/log-inbox/harness.md`, `Jodie.tsx`,
   `reservedIdentifierGate.test.ts`, `defaultPrompts.ts`. The code ones differ only in import order, one test comment
   and changelog note text; both sides are at chat prompt v7 (§2).
3. **Step 4 (staging) touches no §3.1 file.** Its code is 11 one-line typecheck fixes and the #172 R-REF-7 glyph line in
   `InstanceDetail.tsx`. It also brings **`CLAUDE.md` and `AGENTS.md`** (RC-48, `8a8575ec0`: §2 and §17 say the
   typecheck baseline is zero), cleanly. They come by merge, not by edit. That makes `rel31-sync` a branch that changes
   a governance file, which matters to the chat's merge into the trunk (§4, R4).
4. **`VersionFixer.tsx` is not touched by either merge (M).** Its blob is `ff89660e5` on HEAD, on `38f0add16`, on
   `e8fd99c58` and on L1's `cb5952876`. PR #184 (`staging-dam-merged`, `d10396ff5`, blob `9bb73f620`) is OPEN and not
   an ancestor of `e8fd99c58`. So it does not come in.
5. **Step 3 (D-A1) touches no §3.1 file.** It changes one line of a probe script (`frontend/scripts/probe/`) and a demo
   file outside every tree.

## 1. The intersection asked for (M)

`git diff` of each incoming side, intersected with the CLAUDE.md §3.1 table (`useJjomSync.ts`,
`useM1ReferenceEdges.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `VersionFixer.tsx`,
`defaultViewTemplate.ts`, `common/DV.tsx`, `viewpoint/authoring/`, `viewpoint/ir/`, `editor-v2/problems/`), plus the
cross-references `handlePosition.ts` and `DynamicHandles.tsx`.

| step | how measured | files changed on this side | §3.1 hits |
|---|---|---|---|
| 2, origin trunk | `git merge-tree --write-tree HEAD origin/alfonso-frontend-jjtl` → tree `0bc6ce1ab`, `git diff --name-status HEAD 0bc6ce1ab` | 61: 50 docs, 11 frontend | `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` |
| 4, staging | `git diff --name-status origin/alfonso-frontend-jjtl origin/staging` (after step 2 the merge base is `38f0add16`) | 24: 13 docs and governance, 11 frontend | none |
| 3, D-A1 | `git diff --stat HEAD...da1-disc` (2 docs files) + the fixture line | 3 | none |

The three-dot `git diff --stat HEAD...origin/alfonso-frontend-jjtl` lists 153 files, because it picks one of the two
merge bases (`ec62c080e`). Most of those are already on this side through L1's `cb5952876`. The `merge-tree` figure is
what the merge changes here.

Frontend files of step 2: `Jodie.tsx` (+5, conflict), `reservedIdentifierGate.test.ts` (+4, conflict),
`defaultPrompts.ts` (+5, conflict), `abstract/tabs/InstanceDetail.tsx` (+592 −37, #172 reference sections),
`instanceManagerTab.scss` (+136), `instanceManager10c.test.ts`, `instanceManagerOutline.test.ts` (one literal each),
`viewpoint/ir/IRForm.tsx` (+20 −4), `jjform/refSlot.ts` (new, 119), its test (new, 131), `jjform/index.ts` (+3).

Frontend files of step 4: `api/data.ts` (import `DDataType`, one cast), `common/Dummy.ts` (drops a stray vite import),
`Jodie/ChatMessages.tsx`, `forEndUser/Measurable.tsx`, `project/ProjectEditor.tsx`, `pages/components/Dashboard.tsx`,
`editor-v2/EditorV2.tsx:3350` (one `as any` cast in «Add reference»), each one line; `InstanceDetail.tsx` (+3 −1,
R-REF-7); `scripts/tsconfig.json`, two `scripts/lane-templates/*.md` (one line each).

## 2. Layer Impact Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] View: the IR form of an M1 object (IRForm.tsx, step 2), the instance detail (InstanceDetail.tsx, steps 2 and 4)
  [x] Demo viewpoint data (step 3: a predicate in a probe generator, and the exported demo file)
  [x] Governance text (step 4: CLAUDE.md, AGENTS.md, by merge)

View — IRForm.tsx (step 2, #172, R-REF-1/2)
  - What changes: the optional prop `hostReferences`. With it, no field for a plain reference or an
    aggregation; a summary chip that finds no field of its severity calls the host's focusFirst; the
    «No fields to show» placeholder is skipped when references went to the host.
  - What does NOT change: with the prop absent, the form renders as before. That covers the rail host,
    the canvas form and every IR view. describeSlots, the fields memo, formWrite, the widgets and
    IRFormField are not edited. Compositions (CHILDREN) stay fields.
  - Cross-layer interaction: none new. Reference writes moved to InstanceDetail. They go through the
    same formWrite.setValue / clearValue / appendValue the field used (LValue.setValueAtPosition,
    SetFieldAction). No creator, no TRANSACTION wrapping DVertex.new / DVoidEdge.new2.
  - Side-effect safety: the canvas and the sync layer never pass `hostReferences`. Only the two
    `<IRForm>` mounts of InstanceDetail pass it (Juri's LIR §1).

View — InstanceDetail.tsx (steps 2 and 4)
  - What changes: reference sections that link, change and remove (R-REF-3..6). From step 4, a row
    with a menu draws no Open glyph (R-REF-7).
  - What does NOT change: the Data Manager's tree, the canvas, persistence.
  - Cross-layer interaction: D-layer writes through formWrite only (above). jjform/refSlot.ts is pure:
    rows and controls, no write.

Demo viewpoint data (step 3)
  - What changes: the predicate of «Lane with sub-lanes» in the BPMN generator becomes
    `not empty $childLaneSet.value.$lanes.values`. The demo file is regenerated with it.
  - What does NOT change: app source, irCompile/irResolveCore semantics, any shipped viewpoint, any
    saved project other than the demo export.
  - Cross-layer interaction: none in code. The predicate is data read by resolveIRView. A saved project
    built from the old generator keeps the old predicate.

Governance text (step 4)
  - What changes: CLAUDE.md §2 and §17 and the regenerated AGENTS.md say the typecheck baseline is zero
    (RC-48). Merged as staging wrote it; no hand edit (prompt NON FARE).
  - What does NOT change: every other rule. This side changed neither file since ec62c080e (M), so
    the merge is clean.

Smoke-test scenarios potentially affected:
  - open a 2.229 save (scene_2_DemoPetri.jjodel) → no load error, version read, 13 nodes, 12 edges
  - open the 2.228 fixture (save_3_0_0.jjodel) → no load error
  - export a 2.230 save from this build and reopen it → identical counts
  - Data Manager: an instance with references → references listed once, beside the form (#172)
  - gv-bpmn: «Add LaneSet» under Sales → Sales keeps its 3 flow nodes; Auto layout keeps them in Sales
  - npm run smoke → 3 states green

Uncertain about propagation? No: no creator, no sync hook, no persistence code moves. The two §3.1 items
(IRForm.tsx, and the VersionFixer chain checked after step 4) are verified below.
```

## 3. Risks, and how each is verified

| id | risk | verification |
|---|---|---|
| R1 | Step 2's conflict resolutions drop one side's behaviour in Jodie (reserved-names gate, consumer mode) | after the merge, `command grep` both behaviours in `Jodie.tsx` (L1 §2.1 lines); vitest `reservedIdentifierGate`, `consumerVoice`, `consumerJodieContext` |
| R2 | Chat prompt version diverges: L1's v7 and Juri's v7 have different changelog notes (§0.2) | after the merge, `DEFAULT_PROMPT_VERSIONS.chat.version` is 7 and the test pins 7; the note text taken is declared in the report |
| R3 | `decisions.md` union loses or duplicates a row (RC-48 vs this side's RC-49; R-REF-1..7) | after each merge: every `+` line of the incoming side is present (`command grep -qxF`), no duplicate `**RC-` / `**R-REF-` id |
| R4 | The staging merge brings `CLAUDE.md`/`AGENTS.md`, a governance file on the branch; the trunk tree has uncommitted `CLAUDE.md` edits from another chat (prompt NON FARE), so the chat's merge into the trunk will meet them, and `lane-run merge --launch` refuses a branch that changes a governance file without `--governance-goahead` (P16) | not resolvable in this lane; `check:agents` green after step 4; listed under «Decisions awaiting Alfonso» |
| R5 | The log fold on origin (`23df2d099`, `fd2494809`) emptied inboxes that this side still writes: an entry folded there and still in an inbox here would be counted twice | after step 2, compare each merged inbox with the entries of the merged `claude-code-log.md`; `check:docs` (Check D counts entries) |
| R6 | `VersionFixer.tsx` changes through a merge, or PR #184's chain arrives | blob compared after step 4 (must stay `ff89660e5`); chain tail read; `git merge-base --is-ancestor origin/staging-dam-merged HEAD` must fail |
| R7 | Typecheck changes count: staging's 14 fixes land on a tree whose 14 errors may sit on lines this side moved | `npm run typecheck` after step 4; each of the 14 files read if the count is not 0 |
| R8 | IRForm's `hostReferences` path is live only in the Data Manager | vitest `instanceManager10c`, `instanceManagerOutline`, `refSlot`; the RC-23 Data Manager crop |

## 4. Files read for this report

`CLAUDE.md` (session), `docs/PROTOCOL.md` (P1-P16), `docs/decisions.md` (Processo, RC-30, RC-31, R-REL),
`docs/claude-code-log.md` (head), `docs/log-inbox/release-3-1.md`,
`docs/discovery/discovery_2026-10-12_rel31_staging_merge.md`, `docs/discovery/discovery_2026-10-12_rel31_version.md`
(§0, §1, §5-§7), `da1-disc:docs/discovery/discovery_2026-10-15_da1_graphvertex_add.md`,
`docs/prompts/claude_2026-10-12_0115_prompt_release_3_1_version.md` (§5),
`origin/alfonso-frontend-jjtl:docs/lir/lir_2026-10-10_172_fields_leave_form.md` (§1-§3),
the diffs of `IRForm.tsx` (HEAD → merge-tree), `EditorV2.tsx`, `InstanceDetail.tsx`, `api/data.ts`, `common/Dummy.ts`,
`CLAUDE.md`, `AGENTS.md` (origin trunk → staging), and of `Jodie.tsx`, `reservedIdentifierGate.test.ts`,
`defaultPrompts.ts` (HEAD → origin trunk), `git show 83a7368b4` (Juri's v7 ratification).
