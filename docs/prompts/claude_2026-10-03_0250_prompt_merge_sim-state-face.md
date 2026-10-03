# Prompt: merge sim-state-face into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-0250
Chat: C-2026-10-02-2340
Lane: full (merge; 2 conflicts: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-0250 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ff93dc482`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-state-face` into the trunk with one merge commit, `--no-ff`, of the explicit sha `820249d0e`, in the shape of `b5427d7a5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f7131a405`. The branch carries, on top of the base, 7 commits:

- `820249d0e` docs: Lane C sim-state-face, log entry and Status (P-2026-10-03-0120)
- `d9e344274` docs: the demo script reads the seed in the title only (P-2026-10-03-0120)
- `16539631f` fix(sim): seed in the title only, Watch globals by default (P-2026-10-03-0120)
- `d7ff4f821` fix(sim): the face's kind chips in the dialogs' colours (P-2026-10-03-0120)
- `eb7d54c6b` docs: the demo script reads the state face (P-2026-10-03-0120)
- `6eedc4bf3` feat(sim): the M1 face, run inspector and canvas tags (P-2026-10-03-0120)
- `da8d1b2b3` docs: add prompt P-2026-10-03-0120, Lane C sim-state-face

The trunk carries, since the base, 33 commits:

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

Measured by `lane-run merge` at 2026-10-03 02:50, trunk at `ff93dc482`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 820249d0e`: 2 conflicts: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`.
- Files changed since the base: 10 on the branch side, 38 on the trunk side; on both sides: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`.
- `git diff --name-only f7131a405 820249d0e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_0120_prompt_sim_state_face.md` (eseguito 2026-10-03 · lane sim-state-face · 6eedc4bf3, eb7d54c6b, d7ff4f821, 16539631f, d9e344274 · the M1 face (Watch, Marking chips, Events above the buttons, one status line under them, «State…»), SimInspector (left 584, bottom 16, 400 wide, clamped 16 px clear of the 202 px MiniMap and under the toolbar; σ, node, trace, a step viewed, Back to live), SimCanvasLayer (Inspect node.[x] switch, globals card, both off) and the node tags; after the chat's visual check (RC-23) two fixes in 16539631f: the seed in the status line's title only, amending R-SIM-104 on the seed (R-SIM-100's place), and Watch the globals by default, an instance's attribute only when pinned, four rows at most; the lane's four choices adopted by the chat as recommended; typecheck 14 (the §17 set), sim suites 978/978, build exit 0, lane probe on 3068 (light, 1600×1000, the four demo exports) 138/138: Step's top 873 from Not started to the last step in all four scenes, the script's readings line for line; crops docs/discovery/harness/_tmp_simface_*.png (gitignored) · GO visivo della chat 2026-10-03 (RC-23) sulle crop fresche, dopo due correzioni chieste sulle prime: status line with step and last step, seed in the title only; Watch at most four rows; panel, Marking chips, Events, inspector with the viewed step, trace, canvas tags and Inspect switch as checked at 02:31 · non fuso).
- `git worktree list`: `sim-state-face` in `/Users/alfonso/jjodel-w-simface`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `docs/demo/models_2026_simulator_demo.md`

**Direct.** `lane-run merge --direct` fell back:

- a conflict the union rule does not cover: `docs/demo/models_2026_simulator_demo.md`

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `820249d0e` is the tip of `sim-state-face`; the prompt files of the branch read `Status: eseguito` at `820249d0e`; `git worktree list` shows `sim-state-face` only in `/Users/alfonso/jjodel-w-simface`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 820249d0e` (measured above: 2 conflicts: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`). `git diff --name-only f7131a405 820249d0e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f7131a405 alfonso-frontend-jjtl` with `git diff --name-only f7131a405 820249d0e` (measured above: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
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
4. `git merge --no-ff --no-commit 820249d0e`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-state-face into alfonso-frontend-jjtl (P-2026-10-03-0250)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `820249d0e` in `/Users/alfonso/jjodel-w-simface`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ff93dc482` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-state-face merge (P-2026-10-03-0250)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simface`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
