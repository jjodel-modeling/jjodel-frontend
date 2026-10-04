# Prompt: merge sim-io-panel into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-04-1540
Chat: —
Lane: full (merge; 2 conflicts: `docs/decisions.md`, `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-04-1540 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `da3a18d72`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-io-panel` into the trunk with one merge commit, `--no-ff`, of the explicit sha `5525c3e7c`, in the shape of `6704563a8` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `452efc6f1`. The branch carries, on top of the base, 9 commits:

- `5525c3e7c` docs: visual check of the front panel faces lane passed, two tickets (P-2026-10-04-1131)
- `c4c5c4b11` docs: closure of the front panel faces lane, R-SIM-130..133 (P-2026-10-04-1131)
- `372273fd8` test: styles of the I/O board's front panel, what is drawn (P-2026-10-04-1131)
- `c79cf7774` feat: styles of the I/O board's front panel, what is drawn (P-2026-10-04-1131)
- `ab7907ad9` docs: closure of the front panel model lane, D-UI-16, R-SIM-123..129 (P-2026-10-04-1130)
- `c18397a5c` test: styles of the I/O board's front panel, the model (P-2026-10-04-1130)
- `906cb0f2e` feat: styles of the I/O board's front panel, the model (P-2026-10-04-1130)
- `d03957dd1` docs: discovery for the I/O board's front panel styles (P-2026-10-04-1130)
- `b27138436` docs: add prompts P-2026-10-04-1130 and 1131, styles of the I/O board front panel

The trunk carries, since the base, 26 commits:

- `da3a18d72` docs: session checkpoint of chat C-2026-10-04-0935 (sim-hide-events)
- `56366e0aa` docs: Status flip and log entry for the sim-io-clock merge (P-2026-10-04-1504)
- `6704563a8` merge: sim-io-clock into alfonso-frontend-jjtl (P-2026-10-04-1504)
- `64d327112` docs: add prompt P-2026-10-04-1504, merge sim-io-clock into alfonso-frontend-jjtl
- `c25c758f4` docs: R-RAIL-44 under Superate no longer reads as a second row
- `ec99e8e5b` docs: Status flip and log entry for the sim-hide-events merge (P-2026-10-04-1456)
- `b3fe55c5d` merge: sim-hide-events into alfonso-frontend-jjtl (P-2026-10-04-1456)
- `4dbe84539` docs: add prompt P-2026-10-04-1456, merge sim-hide-events into alfonso-frontend-jjtl
- `452b810ac` docs: Status flip and log entry, sim-hide-events took the trunk (P-2026-10-04-1213)
- `c53a5a8d1` merge: sim-hide-events takes alfonso-frontend-jjtl (P-2026-10-04-1213)
- `25db14eb0` docs: add prompt P-2026-10-04-1213, merge alfonso-frontend-jjtl into sim-hide-events
- `94722697c` docs: Status flip and log entry for hiding events during a run (P-2026-10-04-0935)
- `8d0021987` feat(sim): hide event nodes and their edges during a run (P-2026-10-04-0935)
- `5b4d6c887` docs: R-B17 ratified by Alfonso
- `18a861da7` docs: retire the dark theme for good (D-UI-15)
- `d6bd5c5f6` docs: Status flip and log entry for the object-edge-delete merge (P-2026-10-04-0939)
- `1bd0b33c0` merge: object-edge-delete into alfonso-frontend-jjtl (P-2026-10-04-0939)
- `4316c8f9e` docs: add prompt P-2026-10-04-0939, merge object-edge-delete into alfonso-frontend-jjtl
- `5e9d4771b` docs: prompt for hiding events on the canvas during a run
- `cd387ab59` docs: closure of object-edge-delete, R-B17 provisional (P-2026-10-04-0130)
- `dc489a6b3` probe: crop the open context menu, not an empty one at the origin (P-2026-10-04-0130)
- `04acc1815` probe: object-as-edge delete on DemoESM, menu, Delete key, undo (P-2026-10-04-0130)
- `5d4e8b0b6` test(editor-v2): object-as-edge resolve and delete (P-2026-10-04-0130)
- `5557a714b` fix(editor-v2): an object-as-edge deletes its object (P-2026-10-04-0130)
- `86d15831b` docs: discovery, an object-as-edge cannot be deleted (P-2026-10-04-0130)
- `ae4ea38e6` docs: add prompt P-2026-10-04-0130, object-as-edge delete

Measured by `lane-run merge` at 2026-10-04 15:40, trunk at `da3a18d72`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5525c3e7c`: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/simulation.md`.
- Files changed since the base: 26 on the branch side, 24 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/simulation.md`.
- `git diff --name-only 452efc6f1 5525c3e7c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-04_1130_prompt_sim_io_panel_model.md` (eseguito 2026-10-04 · lane sim-io-panel · report d03957dd1, feat 906cb0f2e, test c18397a5c · D-UI-16, R-SIM-123..129 · questions 1 and 2 answered by the chat as recommended (RC-21, unattended): two map entries per new kind in SimBoardEditor.tsx and simBoardDevices.tsx, keys on Button, Switch and Clock · typecheck 14, the §17 set; vitest 7360/7360 in 296 files, the 9 known suites red at import; build exit 0, chunk-size warning only; mutation bench 63/63 (boardCodec.ts 20, simBoard.ts 23, simBoardFace.ts 2, simBoardIcons.ts 18) · no visual check (no rendering change beyond two placeholder map entries) · non fuso), `claude_2026-10-04_1131_prompt_sim_io_panel_faces.md` (eseguito 2026-10-04 · lane sim-io-panel · feat c79cf7774, test 372273fd8 · R-SIM-130..133 · typecheck 14, the §17 set; vitest 7405/7405 in 299 files, the 9 known suites red at import; build exit 0, chunk-size warning only; mutation bench 58/58 (simBoardLook.ts 29, simBoardSound.ts 10, simViewerPrefs.ts 6, boardCodec.ts 1, simBoardDevices.tsx 12) · lane probe on 3084 (frontend/scripts/smoke/_tmp_iopanel_probe.ts, gitignored): panel 32/32 (four themes measured, display box 316×46 for locked and unlocked, a key press step 0→1 with the focus in the board and none outside, 6 columns floating and clamped, Dock refused, pop out and dock), the four demo scenes 50/50 base and after, 0 differing paths, header and board card included; crops in ~/.jjodel-lanes/P-2026-10-04-1131/ · boardCodec.ts for a bug found here (Pulse LED amber) · SimulationPanel.tsx untouched · verifica visiva passata 2026-10-04 (chat C-2026-10-04-1126, RC-23, 9 crops at 600 px; decisions 1..7 accepted; two low tickets in docs/log-inbox/simulation.md) · non fuso).
- `git worktree list`: `sim-io-panel` in `/Users/alfonso/jjodel-w-iopanel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-04-1540/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `5525c3e7c` is the tip of `sim-io-panel`; the prompt files of the branch read `Status: eseguito` at `5525c3e7c`; `git worktree list` shows `sim-io-panel` only in `/Users/alfonso/jjodel-w-iopanel`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5525c3e7c` (measured above: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/simulation.md`). `git diff --name-only 452efc6f1 5525c3e7c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 452efc6f1 alfonso-frontend-jjtl` with `git diff --name-only 452efc6f1 5525c3e7c` (measured above: `docs/decisions.md`, `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-123` (branch), `R-SIM-124` (branch), `R-SIM-125` (branch), `R-SIM-126` (branch), `R-SIM-127` (branch), `R-SIM-128` (branch), `R-SIM-129` (branch), `R-SIM-130` (branch), `R-SIM-131` (branch), `R-SIM-132` (branch), `R-SIM-133` (branch), `R-RAIL-44` (trunk); control: `- **R-RAIL-46**` none.
   - `docs/decisions.md`: the heading `### Decisions 2026-10-04: the styles of the I/O board's front panel, the model (R-SIM-123..129)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-04: the styles of the I/O board's front panel, what is drawn (R-SIM-130..133)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: styles of the I/O board's front panel, the model (P-2026-10-04-1130)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: styles of the I/O board's front panel, what is drawn (P-2026-10-04-1131)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — ticket: a front panel press with an icon truncates its label in one cell` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — ticket: a wide floating board can open under the canvas layer's Globals control` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: event nodes and their edges hidden on the canvas during a run (P-2026-10-04-0935)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-hide-events takes alfonso-frontend-jjtl (P-2026-10-04-1213)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-hide-events into alfonso-frontend-jjtl (P-2026-10-04-1456)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-io-clock into alfonso-frontend-jjtl (P-2026-10-04-1504)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — fix(editor-v2): an object-as-edge deletes its object from its own menu and the Delete key (P-2026-10-04-0130)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — ticket: «Reset routing» of a persisted object-as-edge route comes back at reload` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — ticket: an object node delete leaves its vertex and link edges as ghosts under an IR viewpoint` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — merge: object-edge-delete into alfonso-frontend-jjtl (P-2026-10-04-0939)` once (trunk).
4. `git merge --no-ff --no-commit 5525c3e7c`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-io-panel into alfonso-frontend-jjtl (P-2026-10-04-1540)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `5525c3e7c` in `/Users/alfonso/jjodel-w-iopanel`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard da3a18d72` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-io-panel merge (P-2026-10-04-1540)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-iopanel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
