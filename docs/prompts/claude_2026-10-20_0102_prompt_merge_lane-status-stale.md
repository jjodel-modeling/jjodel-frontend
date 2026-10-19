# Prompt: merge lane-status-stale into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-20-0102
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-20-0102 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `8c2616a4a`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lane-status-stale` into the trunk with one merge commit, `--no-ff`, of the explicit sha `1a96ce5fd`, in the shape of `56c66ea52` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `b91d9bb1a`. The branch carries, on top of the base, 3 commits:

- `1a96ce5fd` docs: Status flip and log entry (P-2026-10-20-0030)
- `966f16913` fix(harness): lane-run status reads the Outcome of the latest run only (P-2026-10-20-0030)
- `4fcd5caa2` docs(prompts): lane-run status stale Outcome, issue #181 (P-2026-10-20-0030)

The trunk carries, since the base, 35 commits:

- `8c2616a4a` docs: Status flip and log entry for the tack-s8 merge (P-2026-10-20-0052)
- `56c66ea52` merge: tack-s8 into alfonso-frontend-jjtl (P-2026-10-20-0052)
- `dad6b1194` docs: Status flip and log entry for the jjscript-timing-logs merge (P-2026-10-20-0046)
- `777c7ca5b` docs: add prompt P-2026-10-20-0052, merge tack-s8 into alfonso-frontend-jjtl
- `87eba6097` docs: Status lines of P-2026-10-20-0018 and 0040 as on tack-s8 (pre-merge alignment)
- `e68c140bb` docs: Corregge and Causa of the P-2026-10-20-0018 entry in the prescribed form
- `a5622549a` merge: jjscript-timing-logs into alfonso-frontend-jjtl (P-2026-10-20-0046)
- `19973b084` docs: add prompt P-2026-10-20-0046, merge jjscript-timing-logs into alfonso-frontend-jjtl
- `84221a8fc` docs: Status flip and log entry for the shell-ui-s5 merge (P-2026-10-20-0039)
- `be73e2b2d` merge: shell-ui-s5 into alfonso-frontend-jjtl (P-2026-10-20-0039)
- `1e83f76c7` docs: add prompt P-2026-10-20-0039, merge shell-ui-s5 into alfonso-frontend-jjtl
- `86aa11510` docs: log entry and Status for Tack lane closure fix (P-2026-10-20-0040)
- `af237fdf9` fix(tack): lane closure by any mention and Status, whole ids (P-2026-10-20-0040)
- `eaf3a9fcc` docs: Status flip and log entry for the sim-trigger-position merge (P-2026-10-20-0026)
- `1d5975fbb` docs: Status flip and log entry (P-2026-10-20-0032)
- `ee21998fd` chore(jjscript): remove TEMP-DISCOVERY timing logs (P-2026-10-20-0032)
- `068b862d9` merge: sim-trigger-position into alfonso-frontend-jjtl (P-2026-10-20-0026)
- `5c31bb4fd` docs(prompts): Lanes page fixes on tack-s8, closure sources and IDs (P-2026-10-20-0040)
- `658f8d7fc` docs: add prompt P-2026-10-20-0026, merge sim-trigger-position into alfonso-frontend-jjtl
- `f9917a3ee` docs: Status and log entry for shell S5 menus (P-2026-10-19-2350)
- `84d476f0e` docs: R-SIM row, Status flip and log entry (P-2026-10-20-0031)
- `c341ffbd3` feat(sim): compile defect trigger-position, fork and join fusion (P-2026-10-20-0031)
- `024dfb142` test(sim): trigger-position defect (P-2026-10-20-0031)
- `0806585e8` docs: log entry and Status for Tack lanes view fix (P-2026-10-20-0018)
- `03d22d7c7` fix(tack): lanes view registers and polls in a browser (P-2026-10-20-0018)
- `3373be616` docs(prompts): remove JjScript timing logs (P-2026-10-20-0032)
- `e02976c38` docs(prompts): sim trigger-position defect (P-2026-10-20-0031)
- `40a3626a0` feat(shell): menus on shell tokens, 8px panels, 36/28px items (P-2026-10-19-2350)
- `f51a231e8` docs: log entry for Tack slice 8 (P-2026-10-19-2330)
- `5f1c0254f` docs: Status of P-2026-10-19-2320
- `a5831da8c` docs(tack): roadmap, phase ladder per project (P-2026-10-19-2330)
- `5d2146df9` feat(tack): Lanes page (P-2026-10-19-2330)
- `736e04b88` feat(tack): /api/lanes (P-2026-10-19-2330)
- `923f7d4bf` feat(tack): lane-run collector, schema 6 (P-2026-10-19-2330)
- `fdc30f61b` docs(discovery): Tack slice 8, Lanes page Phase 1 (P-2026-10-19-2320)

Measured by `lane-run merge` at 2026-10-20 01:02, trunk at `8c2616a4a`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1a96ce5fd`: zero conflicts.
- Files changed since the base: 5 on the branch side, 44 on the trunk side; on both sides: none.
- `git diff --name-only b91d9bb1a 1a96ce5fd -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-20_0030_prompt_lane_status_stale_outcome.md` (eseguito 2026-10-20 · lane status-stale · 966f16913 · status reads the latest run's Outcome; `limit` and `died` added; no UI change (P8 replaced by the gates)).
- `git worktree list`: `lane-status-stale` in `/Users/alfonso/jjodel-w-statusstale`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-20-0102/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `1a96ce5fd` is the tip of `lane-status-stale`; the prompt files of the branch read `Status: eseguito` at `1a96ce5fd`; `git worktree list` shows `lane-status-stale` only in `/Users/alfonso/jjodel-w-statusstale`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1a96ce5fd` (measured above: zero conflicts). `git diff --name-only b91d9bb1a 1a96ce5fd -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only b91d9bb1a alfonso-frontend-jjtl` with `git diff --name-only b91d9bb1a 1a96ce5fd` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-147` (trunk); control: `- **R-SIM-148**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-20 — fix(harness): lane-run status reads the Outcome of the latest run only (P-2026-10-20-0030)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-20: a trigger that fork or join fusion drops (R-SIM-147)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — chore(jjscript): remove TEMP-DISCOVERY timing logs (P-2026-10-20-0032)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — merge: jjscript-timing-logs into alfonso-frontend-jjtl (P-2026-10-20-0046)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-20 — feat: menus on shell tokens, 8px panels, 36/28px items (S5)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-20 — merge: shell-ui-s5 into alfonso-frontend-jjtl (P-2026-10-20-0039)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — feat(sim): compile defect trigger-position for triggers dropped by fork or join fusion (P-2026-10-20-0031)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — merge: sim-trigger-position into alfonso-frontend-jjtl (P-2026-10-20-0026)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 8, the Lanes page (Phase 2)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — fix: Tack slice 8, the Lanes view registers and polls in a browser` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — fix: Tack slice 8, lane closure by any commit mention and prompt Status, whole ids in the table` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — merge: tack-s8 into alfonso-frontend-jjtl (P-2026-10-20-0052)` once (trunk).
4. `git merge --no-ff --no-commit 1a96ce5fd`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-status-stale into alfonso-frontend-jjtl (P-2026-10-20-0102)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `1a96ce5fd` in `/Users/alfonso/jjodel-w-statusstale`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-statusstale`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8c2616a4a` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 8c2616a4a HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lane-status-stale merge (P-2026-10-20-0102)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-statusstale`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
