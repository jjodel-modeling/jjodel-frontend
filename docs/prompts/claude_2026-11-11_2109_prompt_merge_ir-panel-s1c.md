# Prompt: merge ir-panel-s1c into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-11-2109
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; 1 conflict: `docs/log-inbox/maintenance.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-11-2109 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `33c98dcc4`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ir-panel-s1c` into the trunk with one merge commit, `--no-ff`, of the explicit sha `2516db6ac`, in the shape of `f33239a6d` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `dc2126f5d`. The branch carries, on top of the base, 3 commits:

- `2516db6ac` docs(log): close IR view panel S1c text style controls (P-2026-11-11-2037)
- `f4c06dcc2` feat(ir-panel): letter spacing and case rows in TextStyleEditor (P-2026-11-11-2037)
- `6b02047e1` docs(prompts): add IR view panel S1c prompt (P-2026-11-11-2037)

The trunk carries, since the base, 12 commits:

- `33c98dcc4` docs: Status flip and log entry for the ir-panel-s1b merge (P-2026-11-11-2101)
- `f33239a6d` merge: ir-panel-s1b into alfonso-frontend-jjtl (P-2026-11-11-2101)
- `e1d233f04` docs: add prompt P-2026-11-11-2101, merge ir-panel-s1b into alfonso-frontend-jjtl
- `c50d9e689` docs: Status flip and log entry for the ir-panel-s1a merge (P-2026-11-11-2054)
- `6ab5d35bb` merge: ir-panel-s1a into alfonso-frontend-jjtl (P-2026-11-11-2054)
- `c91824d7a` docs: add prompt P-2026-11-11-2054, merge ir-panel-s1a into alfonso-frontend-jjtl
- `3c406f850` docs: Status flip and log entry for IR view panel S1a (P-2026-11-11-2035)
- `043b9cc02` feat(ir-panel): S1a vertex visible, entry, bar, exclude, literal style (P-2026-11-11-2035)
- `18397b4d0` docs: Status flip and log entry for IR view panel S1b (P-2026-11-11-2036)
- `5d9cc9ea6` feat(ir-panel): edge curve, label template, label style (P-2026-11-11-2036)
- `6d2872085` docs(prompts): add IR view panel S1b prompt (P-2026-11-11-2036)
- `46cd9eb33` docs(prompts): add IR view panel S1a prompt (P-2026-11-11-2035)

Measured by `lane-run merge` at 2026-11-11 21:09, trunk at `33c98dcc4`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2516db6ac`: 1 conflict: `docs/log-inbox/maintenance.md`.
- Files changed since the base: 4 on the branch side, 12 on the trunk side; on both sides: `docs/log-inbox/maintenance.md`.
- `git diff --name-only dc2126f5d 2516db6ac -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-11_2037_prompt_ir_panel_s1c.md` (eseguito 2026-11-11 · lane fast · f4c06dcc2 · gates green (typecheck 0, build, authoring 376/376, unit 16099 passed, 3 known import failures) · visual check skipped (no smoke scene opens a TextStyle popover) · log entry in docs/log-inbox/maintenance.md).
- `git worktree list`: `ir-panel-s1c` in `/Users/alfonso/jjodel-w-ips1c`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-11-2109/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `2516db6ac` is the tip of `ir-panel-s1c`; the prompt files of the branch read `Status: eseguito` at `2516db6ac`; `git worktree list` shows `ir-panel-s1c` only in `/Users/alfonso/jjodel-w-ips1c`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2516db6ac` (measured above: 1 conflict: `docs/log-inbox/maintenance.md`). `git diff --name-only dc2126f5d 2516db6ac -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only dc2126f5d alfonso-frontend-jjtl` with `git diff --name-only dc2126f5d 2516db6ac` (measured above: `docs/log-inbox/maintenance.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S1c, letter spacing and case in TextStyleEditor (P-2026-11-11-2037)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S1a, vertex visible, entry, bar thickness, exclude, literal style (P-2026-11-11-2035)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s1a into alfonso-frontend-jjtl (P-2026-11-11-2054)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S1b, edge curve, label template, label style (P-2026-11-11-2036)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s1b into alfonso-frontend-jjtl (P-2026-11-11-2101)` once (trunk).
4. `git merge --no-ff --no-commit 2516db6ac`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-panel-s1c into alfonso-frontend-jjtl (P-2026-11-11-2109)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `2516db6ac` in `/Users/alfonso/jjodel-w-ips1c`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-ips1c`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 33c98dcc4` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 33c98dcc4 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ir-panel-s1c merge (P-2026-11-11-2109)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ips1c`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
