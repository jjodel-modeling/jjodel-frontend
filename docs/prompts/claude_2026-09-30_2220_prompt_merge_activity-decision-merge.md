# Prompt: merge activity-decision-merge into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-30-2220
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-30-2220 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `34c4df57a`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `activity-decision-merge` into the trunk with one merge commit, `--no-ff`, of the explicit sha `ea7702a83`, in the shape of `088e4c385` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `120d97c01`. The branch carries, on top of the base, 39 commits:

- `ea7702a83` docs: Status flip and log entry, activity-decision-merge took the trunk (P-2026-09-30-2143)
- `91333202f` merge: activity-decision-merge takes alfonso-frontend-jjtl (P-2026-09-30-2143)
- `865f53378` docs: add prompt P-2026-09-30-2143, merge alfonso-frontend-jjtl into activity-decision-merge
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

The trunk carries, since the base, 8 commits:

- `34c4df57a` docs: Status flip and log entry for the canvas-export-fix merge (P-2026-09-30-2205)
- `088e4c385` merge: canvas-export-fix into alfonso-frontend-jjtl (P-2026-09-30-2205)
- `210034908` docs: add prompt P-2026-09-30-2205, merge canvas-export-fix into alfonso-frontend-jjtl
- `3c9a078ce` docs: canvas export Phase 2 addendum, log entry, tickets, Status (P-2026-09-30-2035)
- `078cfb5f8` fix: pin the zoom division in the canvas export bounds test (P-2026-09-30-2035)
- `0d6987661` fix: canvas export works for PNG, JPEG, SVG and clipboard (P-2026-09-30-2035)
- `f3ed74cea` docs: discovery, canvas export broken in all four options (P-2026-09-30-2035)
- `db5bd645b` docs: add prompt P-2026-09-30-2035, canvas export fix

Measured by `lane-run merge` at 2026-09-30 22:20, trunk at `34c4df57a`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ea7702a83`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 84 on the branch side, 7 on the trunk side; on both sides: `docs/log-inbox/views.md`.
- `git diff --name-only 120d97c01 ea7702a83 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_2320_prompt_discovery_derived_viewpoint_notations.md` (eseguito 2026-09-29 · lane discovery viewpoint-notations · report docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md · hard-stop, four decisions and five questions for Alfonso in §0), `claude_2026-09-29_2350_prompt_c1_generic_notation.md` (eseguito 2026-09-30 · lane viewpoint-notations · 3ed86119f · non fuso: hard-stop, lane probe on 3071 (light) 50/50, crops in frontend/scripts/smoke/_tmp_c1_crops/ (gitignored), mutation bench 42/43 (one equivalent mutant), R-VP-19 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_0150_prompt_c2_ir_keys.md` (eseguito 2026-09-30 · lane viewpoint-notations · 2360515f4 · non fuso: hard-stop, lane probe on 3072 (light) 46/46, crops in frontend/scripts/smoke/_tmp_c2_crops/ (gitignored), mutation bench 43/43, R-VP-20 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_0255_prompt_d_derive_dialog.md` (eseguito 2026-09-30 · lane viewpoint-notations · 64ea9f216 · non fuso: hard-stop, lane probe on 3074 (light) 58/58, crops in frontend/scripts/smoke/_tmp_d_crops/ (gitignored), mutation bench 44/45 (the survivor equivalent), R-VP-21 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_0355_prompt_a1_a3_notations.md` (eseguito 2026-09-30 · lane viewpoint-notations · 74995f429 · non fuso: hard-stop, lane probe on 3076 (light) 15/23 (8 read in the report §2: rail content, the bag, a 0.01 px tip), crops in frontend/scripts/smoke/_tmp_a1a3_crops/ (gitignored), mutation bench 46/46, R-VP-22 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_0440_prompt_a4_er_chen.md` (eseguito 2026-09-30 · lane viewpoint-notations · 7c2593c85 · non fuso: hard-stop, lane probe on 3078 (light) 27/27, crops in frontend/scripts/smoke/_tmp_a4_crops/ (gitignored), mutation bench 56/57 (the survivor equivalent), R-VP-23 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_1521_prompt_a2_petri_classic_open_arrows.md` (eseguito 2026-09-30 · lane viewpoint-notations · 618e4e958, f603f28e8 · non fuso: hard-stop, lane probe on 3081 (light) 29/31 (2 read in the report §6: a size that outlives a derived viewpoint, ticket), crops in frontend/scripts/smoke/_tmp_a2_crops/ (gitignored), mutation bench 36/36, R-VP-24 e R-VP-25 nel commit docs, verifica visiva alla chat), `claude_2026-09-30_1552_prompt_activity_uml_notation.md` (eseguito 2026-09-30 · lane viewpoint-notations · e63ea6d73, ca3e41a92 · non fuso: hard-stop, lane probe on 3084 (light) 22/22, crops in frontend/scripts/smoke/_tmp_actuml_crops/ (gitignored), mutation bench 44/45 (the survivor equivalent), R-VP-26 nel commit docs, three sizes held by render floors (ticket), verifica visiva alla chat), `claude_2026-09-30_1720_prompt_activity_sizes.md` (eseguito 2026-09-30 · lane viewpoint-notations · b65be5594, 3805796be, ea4a7ae19 · non fuso: hard-stop, lane probe on 3087 (light) 19/19 twice, crops in frontend/scripts/smoke/_tmp_actsize_crops/ (gitignored), mutation bench 19/19, the Activity final on dot-large (scope extended by the chat, RC-21), the bar painted 3 px at the declared 5 to Alfonso, verifica visiva alla chat), `claude_2026-09-30_1935_prompt_activity_decision_merge.md` (eseguito 2026-09-30 · lane activity-decision-merge · d34cded42, d2e4e7959 · non fuso: hard-stop, lane probe on 3093 (light) 31/31, crops in frontend/scripts/smoke/_tmp_actdec_crops/ (gitignored), mutation bench 48/50 (the two ObjectNode mutants probe-only), R-VP-32..35 provisional, verifica visiva passata 2026-09-30 (chat: probe re-run on the take-trunk merge 91333202f, port 3094, 31/31, no page errors; visual GO by Alfonso, P-2026-09-30-2143)), `claude_2026-09-30_2143_prompt_activity-decision-merge_take_trunk.md` (eseguito 2026-09-30 · lane activity-decision-merge · 91333202f · verifica visiva passata 2026-09-30 (chat: the branch probe re-run on 91333202f, port 3094, _tmp_actdec_probe.ts 31/31, no page errors; visual GO by Alfonso; 8 gates green on 91333202f)).
- `git worktree list`: `activity-decision-merge` in `/Users/alfonso/jjodel-w-actdec`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `ea7702a83` is the tip of `activity-decision-merge`; the prompt files of the branch read `Status: eseguito` at `ea7702a83`; `git worktree list` shows `activity-decision-merge` only in `/Users/alfonso/jjodel-w-actdec`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ea7702a83` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 120d97c01 ea7702a83 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 120d97c01 alfonso-frontend-jjtl` with `git diff --name-only 120d97c01 ea7702a83` (measured above: `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-19` (branch), `R-VP-20` (branch), `R-VP-21` (branch), `R-VP-22` (branch), `R-VP-23` (branch), `R-VP-24` (branch), `R-VP-25` (branch), `R-VP-26` (branch), `R-VP-32` (branch), `R-VP-33` (branch), `R-VP-34` (branch), `R-VP-35` (branch); control: `- **R-VP-36**` none.
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
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: activity-decision-merge takes alfonso-frontend-jjtl (P-2026-09-30-2143)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(export): canvas export works in all four options, M2 and M1 (P-2026-09-30-2035)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: Copy to clipboard likely refused by Safari after the canvas render` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: each canvas export logs two console errors and embeds every font in the SVG` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: canvas-export-fix into alfonso-frontend-jjtl (P-2026-09-30-2205)` once (trunk).
4. `git merge --no-ff --no-commit ea7702a83`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: activity-decision-merge into alfonso-frontend-jjtl (P-2026-09-30-2220)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `ea7702a83` in `/Users/alfonso/jjodel-w-actdec`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 34c4df57a` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the activity-decision-merge merge (P-2026-09-30-2220)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-actdec`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
