# Prompt: merge sim-clock-auto into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-04-1832
Chat: —
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-04 · lane merge · 32c70ea86 · verifica visiva passata 2026-10-04 (3001 HTTP 200 at 18:44; eight gates green on 32c70ea86 (typecheck 14, vitest 7458, build 0, checks 0); keycap and implicit Clock already checked visually by the chat on the lane crops)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-04-1832 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `0022fe5c3`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-clock-auto` into the trunk with one merge commit, `--no-ff`, of the explicit sha `18f65f917`, in the shape of `19b29dc2b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `0022fe5c3`. The branch carries, on top of the base, 8 commits:

- `18f65f917` docs: restore the Clock lane entry, add its keycap fix entry (P-2026-10-04-1625)
- `a43bf38f2` docs: keycap fix sha and gates in the Clock lane closure (P-2026-10-04-1625)
- `836d36936` fix(sim): Clock keycap above its corner on the front panel (P-2026-10-04-1625)
- `7a2da15cb` docs: closure of the implicit Clock lane, R-SIM-134..136 (P-2026-10-04-1625)
- `7aa9e4889` test(sim): auto-start, idle ticks, the panel's clocks (P-2026-10-04-1625)
- `3a71b2a21` feat(sim): implicit Clock, auto-start with the run, idle ticks (P-2026-10-04-1625)
- `c106cb329` docs: discovery report, implicit Clock on the I/O board (P-2026-10-04-1625)
- `aa17dc715` docs: add prompt P-2026-10-04-1625, implicit Clock on the I/O board

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-04 18:32, trunk at `0022fe5c3`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 18f65f917`: zero conflicts.
- Files changed since the base: 16 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 0022fe5c3 18f65f917 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-04_1625_prompt_sim_clock_auto.md` (eseguito 2026-10-04 · lane sim-clock-auto · report c106cb329, feat 3a71b2a21, test 7aa9e4889 · R-SIM-134..136 · typecheck 14, the §17 set; vitest 7458/7458 in 301 files, the 9 known suites red at import; build exit 0, chunk-size warning only; tests first, 27 red at the base; mutation bench 33/35 (simBoardClock.ts 18, simBoardFace.ts 6, boardCodec.ts 8, simBoard.ts 3), two equivalent survivors (arming a run not Running, arm after dispose); check:scripts exit 0 · lane probe on 3085 (frontend/scripts/smoke/_tmp_clockauto_probe.ts, gitignored): microwave 20/20 (Reset arms the auto clock; 5.2 s idle, step 0 and 5 idle in the title; plus ×3, start, 5 s: 01:25, step 9 = 4 presses + 5 ticks; board closed 3 s, 3 steps more; hand pause holds 2 s; Reset re-arms, Idle, step 0; collapse switches it off, said so; the editor's Auto-start on, on for a new clock; no page error), the four demo scenes 50/50 base and after, 0 differing paths, header and board card included, positive control told apart; crops light in ~/.jjodel-lanes/P-2026-10-04-1625/ · RC-23 by the chat C-2026-10-04-1126 on the six crops: pass with one fix, the Clock's keycap over its counter on Variant B; fix 836d36936 (SimBoard.scss: on Variant B the Clock's keycap 9 px above its corner; the probe on the four themes and Variant A: no keycap over a counter, period, name, switch or another device, every cell, face, counter and switch box as before), accepted by the chat on the after crops; gates after the fix: typecheck 14, the §17 set; vitest 7458/7458 in 301 files, the 9 known suites red at import; build exit 0, chunk-size warning only).
- `git worktree list`: `sim-clock-auto` in `/Users/alfonso/jjodel-w-clockauto`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-04-1832/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `18f65f917` is the tip of `sim-clock-auto`; the prompt files of the branch read `Status: eseguito` at `18f65f917`; `git worktree list` shows `sim-clock-auto` only in `/Users/alfonso/jjodel-w-clockauto`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 18f65f917` (measured above: zero conflicts). `git diff --name-only 0022fe5c3 18f65f917 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 0022fe5c3 alfonso-frontend-jjtl` with `git diff --name-only 0022fe5c3 18f65f917` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-134` (branch), `R-SIM-135` (branch), `R-SIM-136` (branch); control: `- **R-SIM-137**` none.
   - `docs/decisions.md`: the heading `### Decisions 2026-10-04: an implicit Clock on the I/O board (R-SIM-134..136)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: an implicit Clock on the I/O board, auto-start and idle ticks (P-2026-10-04-1625)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — fix: the Clock's keycap above its corner on the front panel (P-2026-10-04-1625)` once (branch).
4. `git merge --no-ff --no-commit 18f65f917`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-clock-auto into alfonso-frontend-jjtl (P-2026-10-04-1832)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `18f65f917` in `/Users/alfonso/jjodel-w-clockauto`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 0022fe5c3` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-clock-auto merge (P-2026-10-04-1832)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-clockauto`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
