# Prompt: merge cg-origin-concat into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-31-1539
Chat: C-2026-10-31-1328
Request: none (rendered by lane-run, no chat URL known for C-2026-10-31-1328)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-31-1539 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `03dc6cb5e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `cg-origin-concat` into the trunk with one merge commit, `--no-ff`, of the explicit sha `fe8bb988e`, in the shape of `7227828c4` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `5b19ebfc8`. The branch carries, on top of the base, 4 commits:

- `fe8bb988e` docs: Status flip and log entry for codegen origins through + and join (P-2026-10-31-1341)
- `eccd6ca1d` feat(codegen): model origins for member reads inside + and join (P-2026-10-31-1341)
- `4b6bc1f81` docs(discovery): codegen origins through + and join (P-2026-10-31-1341)
- `7aa7df082` docs(prompts): add P-2026-10-31-1341, codegen origins through + and join

The trunk carries, since the base, 9 commits:

- `03dc6cb5e` docs: Status flip and log entry for the jjtl-expr-resolve merge (P-2026-10-31-1508)
- `7227828c4` merge: jjtl-expr-resolve into alfonso-frontend-jjtl (P-2026-10-31-1508)
- `f23a1ce6b` docs: add prompt P-2026-10-31-1508, merge jjtl-expr-resolve into alfonso-frontend-jjtl
- `bc3960ae1` docs(sessioni): checkpoint of chat C-2026-10-31-1328, hardware prototype bundle lanes
- `2d85e6ed0` docs: Status flip and log entry for JjTL source refs (P-2026-10-31-1340)
- `636d465c0` fix(jjtl): resolve source refs in expressions, alias in nested bodies (P-2026-10-31-1340)
- `2a0373896` docs(discovery): JjTL source collections unresolved in expressions (P-2026-10-31-1340)
- `1c315f54f` docs(prompts): P-2026-10-31-1340 on front release-3-2
- `458b993ea` docs(prompts): add P-2026-10-31-1340, JjTL source collections in expressions

Measured by `lane-run merge` at 2026-10-31 15:39, trunk at `03dc6cb5e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fe8bb988e`: zero conflicts.
- Files changed since the base: 9 on the branch side, 8 on the trunk side; on both sides: none.
- `git diff --name-only 5b19ebfc8 fe8bb988e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-31_1341_prompt_codegen_origins_through_concat.md` (eseguito 2026-10-31, lane full, branch cg-origin-concat, eccd6ca1d).
- `git worktree list`: `cg-origin-concat` in `/Users/alfonso/jjodel-w-cgorigin`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `fe8bb988e` is the tip of `cg-origin-concat`; the prompt files of the branch read `Status: eseguito` at `fe8bb988e`; `git worktree list` shows `cg-origin-concat` only in `/Users/alfonso/jjodel-w-cgorigin`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fe8bb988e` (measured above: zero conflicts). `git diff --name-only 5b19ebfc8 fe8bb988e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 5b19ebfc8 alfonso-frontend-jjtl` with `git diff --name-only 5b19ebfc8 fe8bb988e` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — feat(codegen): model origins for member reads inside + and join (P-2026-10-31-1341)` once (branch).
   - `docs/log-inbox/jjtl-expr-resolve.md`: the heading `## 2026-10-31 — fix(jjtl): source references resolve in expressions, alias in nested bodies (P-2026-10-31-1340)` once (trunk).
   - `docs/log-inbox/jjtl-expr-resolve.md`: the heading `## 2026-10-31 — merge: jjtl-expr-resolve into alfonso-frontend-jjtl (P-2026-10-31-1508)` once (trunk).
4. `git merge --no-ff --no-commit fe8bb988e`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: cg-origin-concat into alfonso-frontend-jjtl (P-2026-10-31-1539)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `fe8bb988e` in `/Users/alfonso/jjodel-w-cgorigin`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-cgorigin`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 03dc6cb5e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 03dc6cb5e HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the cg-origin-concat merge (P-2026-10-31-1539)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-cgorigin`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
