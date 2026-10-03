# Prompt: sim-state-face takes the trunk before its own merge

Prompt-ID: P-2026-10-03-0304
Chat: C-2026-10-02-2340
Lane: full (merge of the trunk into the branch; 2 conflicts: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md` measured)
Status: eseguito 2026-10-03 · lane sim-state-face · 536e27cf1 · verifica visiva passata 2026-10-03 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-w-simface`, branch `sim-state-face`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-simface`, branch `sim-state-face`, `git log -1` is the commit that adds this file (its parent `820249d0e`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-0304 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `04dd1c7e5` into `sim-state-face` with one merge commit, `--no-ff`, in the shape of `2a60dbd3d` (the last merge commit on `sim-state-face`; read its body first). Merge base `f7131a405`. The trunk brings, since the base, 34 commits:

- `04dd1c7e5` docs: add prompt P-2026-10-03-0250, merge sim-state-face into alfonso-frontend-jjtl
- `ff93dc482` docs: Status flip and log entry for the sim-node-read merge (P-2026-10-03-0208)
- `b5427d7a5` merge: sim-node-read into alfonso-frontend-jjtl (P-2026-10-03-0208)
- `b8f66690a` docs: add prompt P-2026-10-03-0208, merge sim-node-read into alfonso-frontend-jjtl
- `f74c7a198` docs: Status flip and log entry for the sim-state-dialog merge (P-2026-10-03-0157)
- `995a7b057` merge: sim-state-dialog into alfonso-frontend-jjtl (P-2026-10-03-0157)
- `08a6e5130` docs: add prompt P-2026-10-03-0157, merge sim-state-dialog into alfonso-frontend-jjtl
- `6eb66ddb1` docs: sim-node-read addendum, R-SIM-108 row, log entry, Status (P-2026-10-03-0121)
- `f580d8f78` docs: closure of Lane B sim-state-dialog, Status and entry (P-2026-10-03-0041)
- `bf81fc979` feat(ir): node.[x] read by IR views, R-SIM-108 interpreter side (P-2026-10-03-0121)
- `b4b32bd72` docs: the model dialog's rows have no Globals heading of their own (P-2026-10-03-0041)
- `a57092326` fix(sim): kind chips in entity colours, Globals once in the model dialog (P-2026-10-03-0041)
- `7aba76bfa` docs: Status flip and log entry for the elk-layout-disc merge (P-2026-10-03-0126)
- `b60775776` docs: Layer Impact Report for sim-node-read (P-2026-10-03-0121)
- `788570c06` merge: elk-layout-disc into alfonso-frontend-jjtl (P-2026-10-03-0126)
- `a1b8aa196` docs: add prompt P-2026-10-03-0126, merge elk-layout-disc into alfonso-frontend-jjtl
- `15a17ba08` docs: Status flip of P-2026-10-03-0050 (elk-layout-disc took the trunk)
- `98c0ec37c` docs: add prompt P-2026-10-03-0121, sim-node-read (R-SIM-108, interpreter side)
- `0889e83be` docs: the demo script reads the State dialog (P-2026-10-03-0041)
- `b8ac89fcd` feat(sim): State page in two columns, Written by and Read by (P-2026-10-03-0041)
- `6a1cea69b` merge: elk-layout-disc takes alfonso-frontend-jjtl (P-2026-10-03-0050)
- `39fc1cb7d` docs: add prompt P-2026-10-03-0050, merge alfonso-frontend-jjtl into elk-layout-disc
- `1c63fca7c` docs: Status flip of P-2026-10-02-1718 (elk-layout-disc took the trunk)
- `9980db732` docs: add prompt P-2026-10-03-0041, Lane B sim-state-dialog
- `693f10008` merge: elk-layout-disc takes alfonso-frontend-jjtl (P-2026-10-02-1718)
- `99c2a43ac` docs: add prompt P-2026-10-02-1718, merge alfonso-frontend-jjtl into elk-layout-disc
- `a7d2a3f91` docs: R-VP-37..47, Phase 2 results, log entry, Status (P-2026-10-01-2215)
- `803b84e3a` feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)
- `ccba4b030` docs: Phase 2 plan addendum, ELK routes drawn by UnifiedEdge (P-2026-10-01-2215)
- `5c9aadb1c` merge: alfonso-frontend-jjtl (c3a9c9ffd) into elk-layout-disc (P-2026-10-01-2215)
- `57c150a2a` docs: add Phase 2 prompt for P-2026-10-01-2215, ELK auto-layout used in full
- `a2b4e8168` docs: Status flip, log entry and ticket, ELK layout discovery (P-2026-10-01-2215)
- `e83a16d41` docs: ELK layout quality discovery, measured per notation (P-2026-10-01-2215)
- `bc29ef585` docs: add prompt P-2026-10-01-2215, ELK layout quality discovery

This branch brings, 7 commits:

- `820249d0e` docs: Lane C sim-state-face, log entry and Status (P-2026-10-03-0120)
- `d9e344274` docs: the demo script reads the seed in the title only (P-2026-10-03-0120)
- `16539631f` fix(sim): seed in the title only, Watch globals by default (P-2026-10-03-0120)
- `d7ff4f821` fix(sim): the face's kind chips in the dialogs' colours (P-2026-10-03-0120)
- `eb7d54c6b` docs: the demo script reads the state face (P-2026-10-03-0120)
- `6eedc4bf3` feat(sim): the M1 face, run inspector and canvas tags (P-2026-10-03-0120)
- `da8d1b2b3` docs: add prompt P-2026-10-03-0120, Lane C sim-state-face

Measured by `lane-run merge --trunk-into` at 2026-10-03 03:04, trunk at `04dd1c7e5`:

- `git merge-tree --write-tree --name-only sim-state-face 04dd1c7e5`: 2 conflicts: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`.
- Files changed since the base: 10 on the branch side, 39 on the trunk side; on both sides: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`.
- `git diff --name-only f7131a405 820249d0e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_0120_prompt_sim_state_face.md` (eseguito 2026-10-03 · lane sim-state-face · 6eedc4bf3, eb7d54c6b, d7ff4f821, 16539631f, d9e344274 · the M1 face (Watch, Marking chips, Events above the buttons, one status line under them, «State…»), SimInspector (left 584, bottom 16, 400 wide, clamped 16 px clear of the 202 px MiniMap and under the toolbar; σ, node, trace, a step viewed, Back to live), SimCanvasLayer (Inspect node.[x] switch, globals card, both off) and the node tags; after the chat's visual check (RC-23) two fixes in 16539631f: the seed in the status line's title only, amending R-SIM-104 on the seed (R-SIM-100's place), and Watch the globals by default, an instance's attribute only when pinned, four rows at most; the lane's four choices adopted by the chat as recommended; typecheck 14 (the §17 set), sim suites 978/978, build exit 0, lane probe on 3068 (light, 1600×1000, the four demo exports) 138/138: Step's top 873 from Not started to the last step in all four scenes, the script's readings line for line; crops docs/discovery/harness/_tmp_simface_*.png (gitignored) · GO visivo della chat 2026-10-03 (RC-23) sulle crop fresche, dopo due correzioni chieste sulle prime: status line with step and last step, seed in the title only; Watch at most four rows; panel, Marking chips, Events, inspector with the viewed step, trace, canvas tags and Inspect switch as checked at 02:31 · non fuso).
- `git worktree list`: `sim-state-face` in `/Users/alfonso/jjodel-w-simface`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `docs/demo/models_2026_simulator_demo.md`

## COME

1. Preconditions above, plus: `04dd1c7e5` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `04dd1c7e5` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only sim-state-face 04dd1c7e5` (measured above: 2 conflicts: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 04dd1c7e5`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-48` (trunk), `R-VP-49` (trunk), `R-VP-52` (trunk), `R-VP-40` (trunk), `R-VP-41` (trunk), `R-VP-42` (trunk), `R-VP-43` (trunk), `R-VP-44` (trunk), `R-VP-45` (trunk), `R-VP-46` (trunk), `R-VP-47` (trunk); control: `- **R-VP-53**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — feat: the M1 face, run inspector and canvas tags of the state UI, Lane C (P-2026-10-03-0120)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — feat: the State page of the roles dialog and the model's State dialog (P-2026-10-03-0041)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — merge: sim-state-dialog into alfonso-frontend-jjtl (P-2026-10-03-0157)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — feat: node.[x] read by IR views, R-SIM-108 interpreter side (P-2026-10-03-0121)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — merge: sim-node-read into alfonso-frontend-jjtl (P-2026-10-03-0208)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — docs: ELK auto-layout quality, measured per notation (P-2026-10-01-2215)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — ticket: hidden object-as-edge vertices reach ELK as 180x120 boxes` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: Petri net (classic) transition names are crossed by their outgoing arc after the toolbar layout` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — merge: elk-layout-disc into alfonso-frontend-jjtl (P-2026-10-03-0126)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-state-face takes alfonso-frontend-jjtl (P-2026-10-03-0304)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 820249d0e` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane sim-state-face · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, sim-state-face took the trunk (P-2026-10-03-0304)` (P16, RC-17). `Outcome: done`. The merge of `sim-state-face` into the trunk gets its own prompt (`lane-run merge sim-state-face --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.

## Resolution of the demo-script conflict (chat C-2026-10-02-2340, RC-21: the recommended answer of P-2026-10-03-0250, adopted)

`docs/demo/models_2026_simulator_demo.md` has three hunks that neither side gets fully right: the branch is right on the M1 face labels (`State…`, `Declare in State…`, `SimulationPanel.tsx:849`, `:954`), the trunk is right on the dialog title (`State of <model>`, `SimDataModal.tsx:108`) and on its measured lines (the 1120 × 600 two-column dialog, the abstract column, `VAR model.[count]`). Resolve each hunk with this text, keeping the trunk's measured lines that follow it unchanged:

1. `` A model declares its own globals in the `State…` entry (`Data…` until P-2026-10-03-0120) [M, P-2026-10-03-0120], the first line of the M1 face, which opens the dialog `State of <model>` [M, P-2026-10-03-0041]; one Apply… `` (the rest of the trunk's sentence as it is).
2. `` 1. Click `State…`, the first line of the M1 face [M, P-2026-10-03-0120]; no Reset is needed first. The dialog `State of demoESM` opens, its `Add attribute` focused… `` followed by the trunk's 1120 × 600 / two-columns lines unchanged.
3. `` 1. Click `Declare in State…` [M, P-2026-10-03-0120]. The dialog `State of demoFlowB` opens with row 1 already there, … `` followed by the trunk's abstract-column / `VAR model.[count]` line unchanged.

Also fix, in the same commit, the two stale lines outside the conflict that still say "Use it if the `Data…` route misbehaves" (about lines 312 and 444 of the merged file): `Data…` becomes `State…`. `docs/log-inbox/simulation.md` is a plain union. No code file changes. After the merge commit, run the template's gates and stop as the template says.
