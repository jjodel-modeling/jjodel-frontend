# Prompt: merge textual-syntax-discovery into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-01-2311
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-01 · merge ddf1088d9 (direct, union of docs/log-inbox/codegen.md) · docs-only, verifica visiva non applicabile

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2311 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `eaaeb624a`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-syntax-discovery` into the trunk with one merge commit, `--no-ff`, of the explicit sha `4a90cc085`, in the shape of `29a790243` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d0fe0d472`. The branch carries, on top of the base, 2 commits:

- `4a90cc085` docs(codegen): textual syntax addendum of P-2026-11-01-2210 (P-2026-11-01-2232)
- `36d92a00a` docs: add prompt P-2026-11-01-2232, textual syntax discovery second session (RC-51)

The trunk carries, since the base, 1 commit:

- `eaaeb624a` docs: ticket #403 (XMI import, P-2026-11-01-2016) and prompt P-2026-11-01-2300 (Ecore import losses, #395)

Measured by `lane-run merge` at 2026-11-01 23:11, trunk at `eaaeb624a`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 4a90cc085`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 4 on the branch side, 2 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only d0fe0d472 4a90cc085 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-01_2232_prompt_textual_syntax_discovery_part2.md` (eseguito 2026-11-01 · lane textual-syntax-discovery · addendum in docs/discovery/discovery_2026-11-01_textual_viewpoint.md · verifica visiva non applicabile).
- `git worktree list`: `textual-syntax-discovery` in `/Users/alfonso/jjodel-w-textsyntax`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-01-2311/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `4a90cc085` is the tip of `textual-syntax-discovery`; the prompt files of the branch read `Status: eseguito` at `4a90cc085`; `git worktree list` shows `textual-syntax-discovery` only in `/Users/alfonso/jjodel-w-textsyntax`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 4a90cc085` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only d0fe0d472 4a90cc085 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d0fe0d472 alfonso-frontend-jjtl` with `git diff --name-only d0fe0d472 4a90cc085` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-01 — docs(codegen): textual syntax addendum (P-2026-11-01-2210, P-2026-11-01-2232)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-01 — ticket: XMI import stores ["false"] in an unset mandatory boolean; lowerBound reads null on feature shells` once (trunk).
4. `git merge --no-ff --no-commit 4a90cc085`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-syntax-discovery into alfonso-frontend-jjtl (P-2026-11-01-2311)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `4a90cc085` in `/Users/alfonso/jjodel-w-textsyntax`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textsyntax`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard eaaeb624a` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only eaaeb624a HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-syntax-discovery merge (P-2026-11-01-2311)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textsyntax`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
