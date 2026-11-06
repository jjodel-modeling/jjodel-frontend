# Prompt: merge perf-round3 into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-21-1232
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-21 · lane merge · 74b80d710 · verifica visiva passata 2026-10-21 (Built-in browser (dev, other lanes running), Jjodel harness after merge 74b80d710: BPMN 48 nodes 42 edges; selection click 1.0 s of long tasks; viewpoint switch to Authority 1.3 s, back to BPMN 2.4 s (viewpoint of 48 nodes with containers); no regression visible, inset read gone from the render per the lane probe)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-1232 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `0ff5e64c9`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `perf-round3` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c06a8cd6d`, in the shape of `9115d32d7` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `cce5ce378`. The branch carries, on top of the base, 8 commits:

- `c06a8cd6d` docs: close the inset fix, the batch measured and dropped (P-2026-10-21-1115)
- `1f9d718fd` chore(probe): CLICK_LAYOUTS counts the layouts of the intrinsic measure (P-2026-10-21-1115)
- `365f9ca9a` fix(editor-v2): fitViewOptions without a body style read per render (P-2026-10-21-1115)
- `d74143a33` Merge branch 'alfonso-frontend-jjtl' into perf-round3
- `2c4331c68` docs(lir): intrinsic measure batched, inset out of the render (P-2026-10-21-1010)
- `7c18c2fab` Merge branch 'alfonso-frontend-jjtl' into perf-round3
- `79868633b` docs: large-model round 3 discovery report, residual delay (P-2026-10-21-0905)
- `966a07bd5` chore(probe): save tracking, idle, lat and session steps, minimap ablation (P-2026-10-21-0905)

The trunk carries, since the base, 17 commits:

- `0ff5e64c9` docs: prompt P-2026-10-21-1219 (S2u settle), Status of P-2026-10-21-1121
- `be844ba6d` docs: prompt for Tack S1, adapter boundary (P-2026-10-21-1210)
- `e42ef81b6` docs: Status flip and log entry for the tack-s9 merge (P-2026-10-21-1141)
- `9115d32d7` merge: tack-s9 into alfonso-frontend-jjtl (P-2026-10-21-1141)
- `10861c2d6` docs: ticket, flaky vitest under load blocks direct merges (found in P-2026-10-21-1114)
- `31144ff68` docs: add prompt P-2026-10-21-1141, merge tack-s9 into alfonso-frontend-jjtl
- `1df2d6037` docs: Status of P-2026-10-21-1117 as on tack-s9 (pre-merge alignment)
- `7ab74c299` docs: Status flip for the lanemon-tray merge, resolved after a rerun of load flakes (P-2026-10-21-1114)
- `24334c432` docs: log entry and Status for Tack slice 9, P-2026-10-21-1025 (P-2026-10-21-1117)
- `5b7c02c12` feat(tack): waiting cards and /api/attention, P-2026-10-21-1025 (P-2026-10-21-1117)
- `a1c90aa40` merge: lanemon-tray into alfonso-frontend-jjtl (P-2026-10-21-1114)
- `531cd2c71` docs: prompt P-2026-10-21-1121 (S2u Member entry), Status of P-2026-10-21-1041
- `7c086fe2a` docs: add prompt P-2026-10-21-1114, merge lanemon-tray into alfonso-frontend-jjtl
- `32d45172d` docs(prompts): renumber the slice 9 continuation to P-2026-10-21-1117 (1115 taken by another chat)
- `c70eefd83` docs(prompts): Tack slice 9 continuation (P-2026-10-21-1115)
- `88cdf30c4` docs: log entry and Status for the tray counts (P-2026-10-21-1020)
- `c42a2abd5` feat(lane-monitor-app): tray title shows waiting and running counts (P-2026-10-21-1020)

Measured by `lane-run merge` at 2026-10-21 12:32, trunk at `0ff5e64c9`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c06a8cd6d`: zero conflicts.
- Files changed since the base: 10 on the branch side, 29 on the trunk side; on both sides: none.
- `git diff --name-only cce5ce378 c06a8cd6d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `perf-round3` in `/Users/alfonso/jjodel-w-perfround3`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-21-1232/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c06a8cd6d` is the tip of `perf-round3`; the prompt files of the branch read `Status: eseguito` at `c06a8cd6d`; `git worktree list` shows `perf-round3` only in `/Users/alfonso/jjodel-w-perfround3`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c06a8cd6d` (measured above: zero conflicts). `git diff --name-only cce5ce378 c06a8cd6d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only cce5ce378 alfonso-frontend-jjtl` with `git diff --name-only cce5ce378 c06a8cd6d` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(editor-v2): fitViewOptions without a body style read per render (P-2026-10-21-1115)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — feat(lane-monitor-app): the tray title shows waiting and running counts (P-2026-10-21-1020)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — ticket: Flaky vitest under load blocks direct merges (traceMonitor port-in-use and others)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack slice 9, waiting cards, /api/attention, distinct stop events` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-s9 into alfonso-frontend-jjtl (P-2026-10-21-1141)` once (trunk).
4. `git merge --no-ff --no-commit c06a8cd6d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1232)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c06a8cd6d` in `/Users/alfonso/jjodel-w-perfround3`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-perfround3`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 0ff5e64c9` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 0ff5e64c9 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the perf-round3 merge (P-2026-10-21-1232)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-perfround3`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
