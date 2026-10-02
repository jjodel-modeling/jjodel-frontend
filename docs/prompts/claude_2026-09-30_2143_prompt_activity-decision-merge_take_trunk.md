# Prompt: activity-decision-merge takes the trunk before its own merge

Prompt-ID: P-2026-09-30-2143
Chat: —
Lane: full (merge of the trunk into the branch; 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md` measured)
Status: eseguito 2026-09-30 · lane activity-decision-merge · 91333202f · verifica visiva passata 2026-09-30 (chat: the branch probe re-run on 91333202f, port 3094, _tmp_actdec_probe.ts 31/31, no page errors; visual GO by Alfonso; 8 gates green on 91333202f)

Worktree: `/Users/alfonso/jjodel-w-actdec`, branch `activity-decision-merge`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-actdec`, branch `activity-decision-merge`, `git log -1` is the commit that adds this file (its parent `df33e5da8`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-30-2143 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `120d97c01` into `activity-decision-merge` with one merge commit, `--no-ff`, in the shape of `e42e5d7f5` (the last merge commit on `activity-decision-merge`; read its body first). Merge base `62f4ac3fc`. The trunk brings, since the base, 72 commits:

- `120d97c01` docs: Status flip and log entry for the loader-over-rail merge (P-2026-09-30-2120)
- `f5f9f4f23` merge: loader-over-rail into alfonso-frontend-jjtl (P-2026-09-30-2120)
- `4462168cb` docs: add prompt P-2026-09-30-2120, merge loader-over-rail into alfonso-frontend-jjtl
- `6fddac6b7` docs: Status flip and log entry for the edge-click-properties merge (P-2026-09-30-2105)
- `fb6826c1a` docs: loader-over-rail report, inbox entry, ticket and Status (P-2026-09-30-2025)
- `35d8c8e89` merge: edge-click-properties into alfonso-frontend-jjtl (P-2026-09-30-2105)
- `b46af6f27` fix(loader): portal the loading overlay onto body, above the rail (P-2026-09-30-2025)
- `a552dfccd` docs: add prompt P-2026-09-30-2105, merge edge-click-properties into alfonso-frontend-jjtl
- `1079a9740` docs: R-ESEL rows, log entry, report addendum and Status (P-2026-09-30-1940)
- `bb0fd90c9` fix(editor-v2): an edge click shows the element the edge represents (P-2026-09-30-1940)
- `371804cf0` docs: discovery, edge click and the Properties panel (P-2026-09-30-1940)
- `a766c0a90` docs: add prompt P-2026-09-30-2025, loader overlay must cover the Properties rail
- `31999a630` docs: Status flip and log entry for the viewpoint-metaclass-colors merge (P-2026-09-30-2000)
- `524bdd3f1` merge: viewpoint-metaclass-colors into alfonso-frontend-jjtl (P-2026-09-30-2000)
- `232c4eb89` docs: add prompt P-2026-09-30-2000, merge viewpoint-metaclass-colors into alfonso-frontend-jjtl
- `728291b21` docs: color by metaclass rework, R-VP-27..31, addendum, log, Status (P-2026-09-30-1815)
- `ce5e70027` docs: renumber this lane's R-VP rows in its log entry (P-2026-09-30-1815)
- `25b44b2ce` docs: add prompt P-2026-09-30-1940, edge click shows reference or object-as-edge in Properties
- `390bcaddd` feat: analogous metaclass palette, coloured selected header (P-2026-09-30-1815)
- `c76656bbc` merge: alfonso-frontend-jjtl (45ff6c290) into viewpoint-metaclass-colors (P-2026-09-30-1815)
- `55b4a33ef` docs: color by metaclass, R-VP-19..23, log entry, Status (P-2026-09-30-1815)
- `45ff6c290` docs: Status flip and log entry for the selection-outline merge (P-2026-09-30-1846)
- `7614e7e10` merge: selection-outline into alfonso-frontend-jjtl (P-2026-09-30-1846)
- `7f26b925a` docs: add prompt P-2026-09-30-1846, merge selection-outline into alfonso-frontend-jjtl
- `a5c9d905f` style(editor-v2): no em dash in the selection ring comment (P-2026-09-30-1808)
- `fa0b20de1` feat: viewpoint option color by metaclass (P-2026-09-30-1815)
- `54dce7d74` docs: log entry, report addendum and Status for the selection ring (P-2026-09-30-1808)
- `27a6b2d69` fix(editor-v2): the selection ring of an IR node is no longer clipped (P-2026-09-30-1808)
- `c29280962` docs: discovery, viewpoint color by metaclass (P-2026-09-30-1815)
- `ca2cfb8a8` docs: discovery, the selection outline on IR-rendered nodes (P-2026-09-30-1808)
- `0c2348f39` docs: prompt viewpoint metaclass colors (P-2026-09-30-1815)
- `c4846df0e` docs: prompt for the selection outline on IR-rendered nodes (P-2026-09-30-1808)
- `c1e0376dc` docs: session checkpoint 2026-09-30_2 (release 3.1.0 readiness)
- `0669fa4f5` docs: Status flip and log entry for the reference-delete merge (P-2026-09-30-1736)
- `6ecf05100` merge: reference-delete into alfonso-frontend-jjtl (P-2026-09-30-1736)
- `463655404` docs: add prompt P-2026-09-30-1736, merge reference-delete into alfonso-frontend-jjtl
- `e6c1f452a` docs: reference delete closure, addendum, inbox entry, Status (P-2026-09-30-1542)
- `c820dbb51` fix(editor-v2): an M1 edge delete removes the link, not the reference (P-2026-09-30-1542)
- `c6243eed9` docs: Status flip and log entry for the derived-size-leak merge (P-2026-09-30-1658)
- `f031d4948` merge: derived-size-leak into alfonso-frontend-jjtl (P-2026-09-30-1658)
- and 32 more: `git log --oneline 62f4ac3fc..120d97c01`

This branch brings, 36 commits:

- `df33e5da8` docs: Activity decision/merge report §6, R-VP-32..35, entry, Status (P-2026-09-30-1935)
- `d2e4e7959` feat(views): Activity decision/merge, guard patch, token inside (P-2026-09-30-1935)
- `d34cded42` docs: Activity decision/merge Phase 1 report (P-2026-09-30-1935)
- `17a70f2ad` docs: add prompt P-2026-09-30-1935, Activity decision/merge
- `30f3d8a81` docs: Activity sizes report §7, resume entry, Status (P-2026-09-30-1720)
- `ea4a7ae19` fix(views): the Activity final draws the dot-large disc (P-2026-09-30-1720)
- `862d62dbe` docs: Activity sizes report §6, log entry, Status (P-2026-09-30-1720)
- `3805796be` fix(views): declared sizes unfloored, radius clamp at half, dot-large (P-2026-09-30-1720)
- `b65be5594` docs: Activity (UML) sizes and markers, Phase 1 report (P-2026-09-30-1720)
- `ea1e64c53` docs: add prompt P-2026-09-30-1720, Activity (UML) sizes and markers
- `21345bbba` docs: R-VP-26, Activity (UML) report §6, log entry, Status (P-2026-09-30-1552)
- `ca3e41a92` feat(views): the Activity (UML) notation, R-VP-26 (P-2026-09-30-1552)
- `e63ea6d73` docs: Activity (UML) notation, Phase 1 report (P-2026-09-30-1552)
- `d4daecaf7` docs: add prompt P-2026-09-30-1552, Activity (UML) notation
- `9ed06f9cd` docs: R-VP-24, R-VP-25, slice A2 report, log entry and Status (P-2026-09-30-1521)
- `f603f28e8` feat(views): Petri net (classic) and open arrowheads, slice A2 (P-2026-09-30-1521)
- `618e4e958` docs: A2 Petri classic and open arrowheads, Phase 1 report (P-2026-09-30-1521)
- `2cde09984` docs: add prompt P-2026-09-30-1521, A2 Petri classic and open arrowheads
- `43473dd89` docs: session checkpoint 2026-09-30 (viewpoint notations night)
- `144acf0c8` docs: R-VP-23, slice A4 report, log entry and Status (P-2026-09-30-0440)
- `7c2593c85` feat(views): the ER (Chen) notation, edge end labels (P-2026-09-30-0440)
- `47a7cceb1` docs: add prompt P-2026-09-30-0440, slice A4 ER Chen
- `6daba2e7f` docs: R-VP-22, slices A1 and A3 report, log entry and Status (P-2026-09-30-0355)
- `74995f429` feat(views): Statechart (UML) and Flowchart (ISO 5807) notations (P-2026-09-30-0355)
- `c676fc6f6` docs: add prompt P-2026-09-30-0355, slices A1 and A3 notations
- `4c6b4f315` docs: R-VP-21, slice D report, log entry and Status (P-2026-09-30-0255)
- `64ea9f216` feat(views): the Derive viewpoint dialog, notation binding, provenance (P-2026-09-30-0255)
- `c6913fbb9` docs: add prompt P-2026-09-30-0255, slice D derive dialog
- `97f91a7ac` docs: R-VP-20, C2 report, log entry and Status (P-2026-09-30-0150)
- `2360515f4` feat(ir): text and edge-label IR keys for the generic notation (P-2026-09-30-0150)
- `3ec98d486` docs: add prompt P-2026-09-30-0150, slice C2 IR keys
- `ddfb24dc1` docs: R-VP-19, log entry and Status flip for slice C1 (P-2026-09-29-2350)
- `3ed86119f` feat(views): derive the generic notation (variant C) with no role bound (P-2026-09-29-2350)
- `58aa78ba9` docs: add prompt P-2026-09-29-2350, slice C1 generic notation
- `ee7206d0c` docs: discovery, notation catalogue for derived viewpoints (P-2026-09-29-2320)
- `fd77ae619` docs: add prompt P-2026-09-29-2320 and the fifteen derived viewpoint mockups

Measured by `lane-run merge --trunk-into` at 2026-09-30 21:43, trunk at `120d97c01`:

- `git merge-tree --write-tree --name-only activity-decision-merge 120d97c01`: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`.
- Files changed since the base: 83 on the branch side, 63 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`.
- `git diff --name-only 62f4ac3fc df33e5da8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_2320_prompt_discovery_derived_viewpoint_notations.md` (eseguito 2026-09-29 · lane discovery viewpoint-notations · report docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md · hard-stop, four decisions and five questions for Alfonso in §0), `claude_2026-09-29_2350_prompt_c1_generic_notation.md` (eseguito 2026-09-30 · lane viewpoint-notations · 3ed86119f · non fuso: hard-stop, lane probe on 3071 (light) 50/50, crops in frontend/scripts/smoke/_tmp_c1_crops/ (gitignored), mutation bench 42/43 (one equivalent mutant), R-VP-19 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_0150_prompt_c2_ir_keys.md` (eseguito 2026-09-30 · lane viewpoint-notations · 2360515f4 · non fuso: hard-stop, lane probe on 3072 (light) 46/46, crops in frontend/scripts/smoke/_tmp_c2_crops/ (gitignored), mutation bench 43/43, R-VP-20 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_0255_prompt_d_derive_dialog.md` (eseguito 2026-09-30 · lane viewpoint-notations · 64ea9f216 · non fuso: hard-stop, lane probe on 3074 (light) 58/58, crops in frontend/scripts/smoke/_tmp_d_crops/ (gitignored), mutation bench 44/45 (the survivor equivalent), R-VP-21 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_0355_prompt_a1_a3_notations.md` (eseguito 2026-09-30 · lane viewpoint-notations · 74995f429 · non fuso: hard-stop, lane probe on 3076 (light) 15/23 (8 read in the report §2: rail content, the bag, a 0.01 px tip), crops in frontend/scripts/smoke/_tmp_a1a3_crops/ (gitignored), mutation bench 46/46, R-VP-22 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_0440_prompt_a4_er_chen.md` (eseguito 2026-09-30 · lane viewpoint-notations · 7c2593c85 · non fuso: hard-stop, lane probe on 3078 (light) 27/27, crops in frontend/scripts/smoke/_tmp_a4_crops/ (gitignored), mutation bench 56/57 (the survivor equivalent), R-VP-23 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_1521_prompt_a2_petri_classic_open_arrows.md` (eseguito 2026-09-30 · lane viewpoint-notations · 618e4e958, f603f28e8 · non fuso: hard-stop, lane probe on 3081 (light) 29/31 (2 read in the report §6: a size that outlives a derived viewpoint, ticket), crops in frontend/scripts/smoke/_tmp_a2_crops/ (gitignored), mutation bench 36/36, R-VP-24 e R-VP-25 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_1552_prompt_activity_uml_notation.md` (eseguito 2026-09-30 · lane viewpoint-notations · e63ea6d73, ca3e41a92 · non fuso: hard-stop, lane probe on 3084 (light) 22/22, crops in frontend/scripts/smoke/_tmp_actuml_crops/ (gitignored), mutation bench 44/45 (the survivor equivalent), R-VP-26 nel commit docs, three sizes held by render floors (ticket), verifica visiva alla chat), `claude_2026-09-30_1720_prompt_activity_sizes.md` (eseguito 2026-09-30 · lane viewpoint-notations · b65be5594, 3805796be, ea4a7ae19 · non fuso: hard-stop, lane probe on 3087 (light) 19/19 twice, crops in frontend/scripts/smoke/_tmp_actsize_crops/ (gitignored), mutation bench 19/19, the Activity final on dot-large (scope extended by the chat, RC-21), the bar painted 3 px at the declared 5 to Alfonso, verifica visiva alla chat), `claude_2026-09-30_1935_prompt_activity_decision_merge.md` (eseguito 2026-09-30 · lane activity-decision-merge · d34cded42, d2e4e7959 · non fuso: hard-stop, lane probe on 3093 (light) 31/31, crops in frontend/scripts/smoke/_tmp_actdec_crops/ (gitignored), mutation bench 48/50 (the two ObjectNode mutants probe-only), R-VP-32..35 provisional, verifica visiva alla chat).
- `git worktree list`: `activity-decision-merge` in `/Users/alfonso/jjodel-w-actdec`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `120d97c01` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `120d97c01` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only activity-decision-merge 120d97c01` (measured above: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 120d97c01`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-19` (branch), `R-VP-20` (branch), `R-VP-21` (branch), `R-VP-22` (branch), `R-VP-23` (branch), `R-VP-24` (branch), `R-VP-25` (branch), `R-VP-26` (branch), `R-VP-32` (branch), `R-VP-33` (branch), `R-VP-34` (branch), `R-VP-35` (branch), `R-ESEL-1` (trunk), `R-ESEL-2` (trunk), `R-ESEL-3` (trunk), `R-ESEL-4` (trunk), `R-ESEL-5` (trunk), `R-VP-27` (trunk), `R-VP-28` (trunk), `R-VP-29` (trunk), `R-VP-30` (trunk), `R-VP-31` (trunk); control: `- **R-VP-36**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, notation catalogue for derived viewpoints, C, A and B (P-2026-09-29-2320)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): the generic structural notation (variant C) derived with no role bound, slice C1 (P-2026-09-29-2350)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(ir): text and edge-label IR keys for the generic notation, slice C2 (P-2026-09-30-0150)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): the Derive viewpoint dialog, notation binding and provenance, slice D (P-2026-09-30-0255)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): Statechart (UML) and Flowchart (ISO 5807) notations, slices A1 and A3 (P-2026-09-30-0355)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): the ER (Chen) notation and the edge end labels, slice A4 (P-2026-09-30-0440)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): Petri net (classic) and open arrowheads in the derived notations, slice A2 (P-2026-09-30-1521)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: a derived viewpoint's node size outlives it on the default canvas` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: the classic Petri bar draws 24 px wide, the defaultSize floor` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): the Activity (UML) notation, DemoFlowB and DemoPEST preselection (P-2026-09-30-1552)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: Activity (UML) sizes held by render floors outside the notation` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: DemoFlowB's two guard labels overlap in Activity (UML)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(views): declared sizes unfloored, radius clamp at half, dot-large (P-2026-09-30-1720)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(views): the Activity final draws the dot-large disc (P-2026-09-30-1720, resume)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): Activity decision/merge, guard patch, token inside (P-2026-09-30-1935)` once (branch).
   - `docs/decisions.md`: the heading `## Serie R-ESEL — the edge click and the Properties panel (decisions 2026-09-30)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — discovery: Entry, Exit, Action and Guard multi-valued, R-SIM-90 (P-2026-09-28-2306)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-30 — merge: sim-multi-roles into alfonso-frontend-jjtl (P-2026-09-30-1518)` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — fix(persistence): never store an empty state, open it as an error (P-2026-09-30-1540)` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — ticket: Online favorite and tags PUT the editor's empty state` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — ticket: the editor's Download exports an empty state` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — ticket: LProject.get_metamodels keeps absent targets` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — merge: empty-state-guard into alfonso-frontend-jjtl (P-2026-09-30-1633)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, IR authoring freezes, collapsed graphVertex, StructureSpec (P-2026-09-29-1935)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: ir-freeze-disc into alfonso-frontend-jjtl (P-2026-09-30-1104)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — docs(views): slice C3, IR edge ports, closed without code (P-2026-09-29-2351)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: freeHandleIndex returns a count, not the first free index, and has no per-side cap` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: ir-edge-ports into alfonso-frontend-jjtl (P-2026-09-30-1509)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(ir): the derived size goes back when its node leaves the IR view (P-2026-09-30-1625)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: derived-size-leak into alfonso-frontend-jjtl (P-2026-09-30-1658)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(editor-v2): an M1 edge delete removes the link, not the reference (P-2026-09-30-1542)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: an M2 edge delete is not undoable in one step, and the undo leaves a partial DEdge` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: a deleted edge stays in graph.subElements on a loaded project, ghost edges on M1 canvases` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: reference-delete into alfonso-frontend-jjtl (P-2026-09-30-1736)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): viewpoint option «Color by metaclass», palette, text contrast, border on/off (P-2026-09-30-1815)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(editor-v2): the selection ring of an IR node is no longer clipped (P-2026-09-30-1808)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: selection-outline into alfonso-frontend-jjtl (P-2026-09-30-1846)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): «Color by metaclass» rework, analogous palette, coloured selected header (P-2026-09-30-1815)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: viewpoint-metaclass-colors into alfonso-frontend-jjtl (P-2026-09-30-2000)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(editor-v2): an edge click shows the element the edge represents (P-2026-09-30-1940)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: an inheritance edge click shows the empty panel, a lifted edge click shows nothing` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: edge-click-properties into alfonso-frontend-jjtl (P-2026-09-30-2105)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(loader): the save overlay covers the Properties rail (P-2026-09-30-2025)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: user menu Dashboard throws on Collaborative.client.off when no collaborative session was opened` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: loader-over-rail into alfonso-frontend-jjtl (P-2026-09-30-2120)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: activity-decision-merge takes alfonso-frontend-jjtl (P-2026-09-30-2143)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard df33e5da8` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane activity-decision-merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, activity-decision-merge took the trunk (P-2026-09-30-2143)` (P16, RC-17). `Outcome: done`. The merge of `activity-decision-merge` into the trunk gets its own prompt (`lane-run merge activity-decision-merge --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
