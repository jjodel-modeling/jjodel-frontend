# Prompt: merge sim-trace-scroll into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-1031
Chat: C-2026-10-02-2340
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-1031 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `39ae40a83`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-trace-scroll` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c44875905`, in the shape of `4d190162f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `4d190162f`. The branch carries, on top of the base, 3 commits:

- `c44875905` docs: log entry and Status flip for the trace scroll (P-2026-10-03-1015)
- `f507a382f` fix(sim): the inspector's trace scrolls in six rows (P-2026-10-03-1015)
- `2d99a131f` docs: add prompt P-2026-10-03-1015, the run inspector trace scrolls

The trunk carries, since the base, 1 commit:

- `39ae40a83` docs: Status flip and log entry for the smoke-baseurl merge (P-2026-10-03-1007)

Measured by `lane-run merge` at 2026-10-03 10:31, trunk at `39ae40a83`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c44875905`: zero conflicts.
- Files changed since the base: 4 on the branch side, 2 on the trunk side; on both sides: none.
- `git diff --name-only 4d190162f c44875905 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1015_prompt_sim_inspector_trace_scroll.md` (eseguito 2026-10-03 · lane sim-trace-scroll · f507a382f · the trace a scroll area 6 × 22 px at every step, the card 442 px from step 0 to 12 (before 332..596), the newest step in view on a commit, the rows kept where the reader scrolled down, a chosen step and Back to live scrolled into view; typecheck 14 (the §17 set), sim suites and irActivityRender 1019/1019, build exit 0, lane probe on 3072 (light, 1600×1000, DemoESM) 20/20; crops docs/discovery/harness/_tmp_simtrace_*.png (gitignored) · verifica visiva passata 2026-10-03 (chat, unattended, RC-23: crops at step 12 and at step 12 viewing step 1, trace area six rows, newest first, scrollable, viewed row in view; card 442 px at steps 2, 6, 12 per the probe) · non fuso).
- `git worktree list`: `sim-trace-scroll` in `/Users/alfonso/jjodel-w-simtrace`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-1031/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c44875905` is the tip of `sim-trace-scroll`; the prompt files of the branch read `Status: eseguito` at `c44875905`; `git worktree list` shows `sim-trace-scroll` only in `/Users/alfonso/jjodel-w-simtrace`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c44875905` (measured above: zero conflicts). `git diff --name-only 4d190162f c44875905 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4d190162f alfonso-frontend-jjtl` with `git diff --name-only 4d190162f c44875905` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — fix: the run inspector's trace scrolls in six rows (P-2026-10-03-1015)` once (branch).
   - `docs/log-inbox/smoke-baseurl.md`: the heading `## 2026-10-03 — merge: smoke-baseurl into alfonso-frontend-jjtl (P-2026-10-03-1007)` once (trunk).
4. `git merge --no-ff --no-commit c44875905`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-trace-scroll into alfonso-frontend-jjtl (P-2026-10-03-1031)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c44875905` in `/Users/alfonso/jjodel-w-simtrace`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 39ae40a83` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-trace-scroll merge (P-2026-10-03-1031)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simtrace`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
