# Prompt: merge ir-panel-s4b into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-11-2327
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; 1 conflict: `docs/log-inbox/maintenance.md` measured)
Status: eseguito 2026-11-11 · lane merge · f10ba58b9 · one load-dependent harness test red at load 203, green alone (resolve 23:48); closed by the project chat · verifica visiva in attesa (Alfonso, localhost:3000)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-11-2327 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `9a0242c75`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ir-panel-s4b` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f077251d1`, in the shape of `52a92fca1` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `2d05fdcee`. The branch carries, on top of the base, 3 commits:

- `f077251d1` docs: Status flip and log entry for IR view panel S4b (P-2026-11-11-2316)
- `ad99a39c0` feat(editor-v2): a «Separator» control for layout.separator (P-2026-11-11-2316)
- `001224116` docs(prompts): add IR view panel S4b prompt (P-2026-11-11-2316)

The trunk carries, since the base, 6 commits:

- `9a0242c75` docs: Status flip and log entry for the ir-panel-s4a merge (P-2026-11-11-2321)
- `52a92fca1` merge: ir-panel-s4a into alfonso-frontend-jjtl (P-2026-11-11-2321)
- `6c33ce663` docs: add prompt P-2026-11-11-2321, merge ir-panel-s4a into alfonso-frontend-jjtl
- `a0567c6fc` docs: Status flip and log entry for IR view panel S4a (P-2026-11-11-2315)
- `719be490a` feat: IR view panel S4a, graphVertex shape keys, badges, compartments (P-2026-11-11-2315)
- `7476b5029` docs(prompts): add IR view panel S4a prompt (P-2026-11-11-2315)

Measured by `lane-run merge` at 2026-11-11 23:27, trunk at `9a0242c75`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f077251d1`: 1 conflict: `docs/log-inbox/maintenance.md`.
- Files changed since the base: 6 on the branch side, 6 on the trunk side; on both sides: `docs/log-inbox/maintenance.md`.
- `git diff --name-only 2d05fdcee f077251d1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-11_2316_prompt_ir_panel_s4b.md` (eseguito 2026-11-11 · lane fast · ad99a39c0 · gates green (typecheck 0, build, unit 16200 passed, 3 known import failures) · visual check skipped (no smoke scene with a graphVertex view) · log entry in docs/log-inbox/maintenance.md).
- `git worktree list`: `ir-panel-s4b` in `/Users/alfonso/jjodel-w-ips4b`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-11-2327/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f077251d1` is the tip of `ir-panel-s4b`; the prompt files of the branch read `Status: eseguito` at `f077251d1`; `git worktree list` shows `ir-panel-s4b` only in `/Users/alfonso/jjodel-w-ips4b`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f077251d1` (measured above: 1 conflict: `docs/log-inbox/maintenance.md`). `git diff --name-only 2d05fdcee f077251d1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 2d05fdcee alfonso-frontend-jjtl` with `git diff --name-only 2d05fdcee f077251d1` (measured above: `docs/log-inbox/maintenance.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S4b, graphVertex partition separator (P-2026-11-11-2316)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S4a, graphVertex shape keys, badges, compartments (P-2026-11-11-2315)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s4a into alfonso-frontend-jjtl (P-2026-11-11-2321)` once (trunk).
4. `git merge --no-ff --no-commit f077251d1`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-panel-s4b into alfonso-frontend-jjtl (P-2026-11-11-2327)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f077251d1` in `/Users/alfonso/jjodel-w-ips4b`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-ips4b`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 9a0242c75` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 9a0242c75 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ir-panel-s4b merge (P-2026-11-11-2327)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ips4b`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
