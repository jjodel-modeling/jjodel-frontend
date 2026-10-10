# Prompt: lane-board-model-insights takes the trunk before its own merge

Prompt-ID: P-2026-10-10-1635
Chat: —
Lane: full (merge of the trunk into the branch; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-modelinsights`, branch `lane-board-model-insights`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-modelinsights`, branch `lane-board-model-insights`, `git log -1` is the commit that adds this file (its parent `285356563`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1635 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `f13f6f489` into `lane-board-model-insights` with one merge commit, `--no-ff`, in the shape of `339959aed` (the last merge commit on `lane-board-model-insights`; read its body first). Merge base `3bc597b32`. The trunk brings, since the base, 5 commits:

- `f13f6f489` docs(prompts): event attributes in guards and actions, discovery (P-2026-10-10-1630)
- `0b8128f32` fix(harness): lane board shows hard-stop as a planned pause, with outcome tooltips
- `99bd030d9` docs(ratifiche): memo proposal, event attributes readable from guards and actions
- `d1449992a` docs(decisions): RC-45, randomised tier draw for eligible lanes and Corregge on rework prompts
- `7a271476c` docs(prompts): stale M1 reference edge, discovery (P-2026-10-10-1600)

This branch brings, 4 commits:

- `285356563` fix(harness): Insights marker labels laid out in rows (P-2026-10-10-1520)
- `479fbab01` docs: log entry for the lane board Insights lane (P-2026-10-10-1520)
- `e3590d682` feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)
- `da062a727` docs(discovery): lane board model and code-area insights (P-2026-10-10-1520)

Measured by `lane-run merge --trunk-into` at 2026-10-10 16:35, trunk at `f13f6f489`:

- `git merge-tree --write-tree --name-only lane-board-model-insights f13f6f489`: zero conflicts.
- Files changed since the base: 5 on the branch side, 7 on the trunk side; on both sides: `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/lane-board.mjs`.
- `git diff --name-only 3bc597b32 285356563 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `lane-board-model-insights` in `/Users/alfonso/jjodel-w-modelinsights`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** `lane-run merge --direct` fell back:

- code files changed on both sides since the base; step 5 of the template is a reading no script does: `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/lane-board.mjs`

## COME

1. Preconditions above, plus: `f13f6f489` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `f13f6f489` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only lane-board-model-insights f13f6f489` (measured above: zero conflicts). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit f13f6f489`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-45` (trunk); control: `- **RC-46**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)` once (branch).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/lane-board.mjs`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-board-model-insights takes alfonso-frontend-jjtl (P-2026-10-10-1635)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 285356563` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane lane-board-model-insights · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, lane-board-model-insights took the trunk (P-2026-10-10-1635)` (P16, RC-17). `Outcome: done`. The merge of `lane-board-model-insights` into the trunk gets its own prompt (`lane-run merge lane-board-model-insights --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
