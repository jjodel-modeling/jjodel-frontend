# Prompt: merge jjtl-spec-12-review into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-1420
Chat: C-2026-11-03-1020
Request: https://claude.ai/code/session_01DQt9R3BFXF4UseWLm7Xnzy (merge of jjtl-spec-12-review launched by chat C-2026-11-03-1020)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-03 · lane merge · 89841fc92 · gate vitest red on a false positive (13346 tests, 0 failed; four test files unchanged by the branch went from red at import to passing, the gate expected them red); closure written by hand, no visual check

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1420 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `03df7951a`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-spec-12-review` into the trunk with one merge commit, `--no-ff`, of the explicit sha `ace0592df`, in the shape of `ba649974e` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `414eedc0b`. The branch carries, on top of the base, 4 commits:

- `ace0592df` docs: log entry and [*] ticket for the SPEC 12.2 review (P-2026-11-03-1402)
- `207cd0252` docs(jjtl): SPEC 12.2 rows reviewed, #445 warning in §10 (P-2026-11-03-1402)
- `e784e325d` fix(jjtl): warn undeclared bindings, SPEC 12.2 local fixes (P-2026-11-03-1402)
- `e0eeab06d` docs: add prompt P-2026-11-03-1402, JjTL SPEC 12.2 review and undeclared bindings

The trunk carries, since the base, 1 commit:

- `03df7951a` docs: add EBNF syntax highlighting to step B of the textual plan

Measured by `lane-run merge` at 2026-11-03 14:20, trunk at `03df7951a`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ace0592df`: zero conflicts.
- Files changed since the base: 9 on the branch side, 1 on the trunk side; on both sides: none.
- `git diff --name-only 414eedc0b ace0592df -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_1402_prompt_jjtl_spec12_review.md` (eseguito 2026-11-03 · lane full · e784e325d · rows reproduced by tests on both parser paths, double-execution row read only, no app probe (unattended)).
- `git worktree list`: `jjtl-spec-12-review` in `/Users/alfonso/jjodel-w-jjtlspec12`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-03-1420/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `ace0592df` is the tip of `jjtl-spec-12-review`; the prompt files of the branch read `Status: eseguito` at `ace0592df`; `git worktree list` shows `jjtl-spec-12-review` only in `/Users/alfonso/jjodel-w-jjtlspec12`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ace0592df` (measured above: zero conflicts). `git diff --name-only 414eedc0b ace0592df -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 414eedc0b alfonso-frontend-jjtl` with `git diff --name-only 414eedc0b ace0592df` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL multiplicity [*] creates one target per source, silently` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — fix(jjtl): SPEC 12.2 rows reviewed, undeclared bindings warned (#445) (P-2026-11-03-1402)` once (branch).
4. `git merge --no-ff --no-commit ace0592df`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-spec-12-review into alfonso-frontend-jjtl (P-2026-11-03-1420)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `ace0592df` in `/Users/alfonso/jjodel-w-jjtlspec12`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-jjtlspec12`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 03df7951a` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 03df7951a HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-spec-12-review merge (P-2026-11-03-1420)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjtlspec12`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
