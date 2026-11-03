# Prompt: merge jjtl-language-open into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-04-0048
Chat: C-2026-11-03-2317
Request: https://claude.ai/code/session_01DQt9R6hbytx4vz5aAdzQ8i (merge of jjtl-language-open launched by chat C-2026-11-03-2317)
Lane: full (merge; 1 conflict: `docs/log-inbox/hw-notation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-0048 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `10fadd8ab`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-language-open` into the trunk with one merge commit, `--no-ff`, of the explicit sha `83a944575`, in the shape of `d37e726aa` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d37e726aa`. The branch carries, on top of the base, 7 commits:

- `83a944575` docs: log P-2026-11-04-0015, two tickets closed, Status lines (P-2026-11-04-0043)
- `e11159e0b` docs(jjtl): SPEC marks the lazy/matched reach rule provisional, R-JTG-20 (P-2026-11-04-0043)
- `1729e329a` docs: R-JTG-20 provisional reach rule, R-JTG-17..19 to Alfonso's words (P-2026-11-04-0043)
- `d096556da` docs: add prompt P-2026-11-04-0043, close the language open points
- `1e0786024` docs: R-JTG-17, 18, 19 and SPEC, wip from the ceiling stop of P-2026-11-04-0015
- `90ee317b5` feat(jjtl): missing target class, [*] warning, lazy, such that (P-2026-11-04-0015)
- `962f209d1` docs: add prompt P-2026-11-04-0015, JjTL language open points

The trunk carries, since the base, 1 commit:

- `10fadd8ab` docs: Status flip and log entry for the jjtl-let-unique-called merge (P-2026-11-04-0007)

Measured by `lane-run merge` at 2026-11-04 00:48, trunk at `10fadd8ab`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 83a944575`: 1 conflict: `docs/log-inbox/hw-notation.md`.
- Files changed since the base: 9 on the branch side, 2 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`.
- `git diff --name-only d37e726aa 83a944575 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_0015_prompt_jjtl_language_open.md` (eseguito 2026-11-04 · lane full · 90ee317b5 · stopped at the context ceiling (AM-8), closed by P-2026-11-04-0043 · app probe on a missing target class, nothing written; no visual check by hand (unattended)), `claude_2026-11-04_0043_prompt_jjtl_language_open_close.md` (eseguito 2026-11-04 · lane fast · 1729e329a, e11159e0b · R-JTG-20 provisional split from R-JTG-18, log and tickets closed, docs only (unattended)).
- `git worktree list`: `jjtl-language-open` in `/Users/alfonso/jjodel-w-jjtlopen`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-04-0048/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `83a944575` is the tip of `jjtl-language-open`; the prompt files of the branch read `Status: eseguito` at `83a944575`; `git worktree list` shows `jjtl-language-open` only in `/Users/alfonso/jjodel-w-jjtlopen`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 83a944575` (measured above: 1 conflict: `docs/log-inbox/hw-notation.md`). `git diff --name-only d37e726aa 83a944575 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d37e726aa alfonso-frontend-jjtl` with `git diff --name-only d37e726aa 83a944575` (measured above: `docs/log-inbox/hw-notation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-17` (branch), `R-JTG-18` (branch), `R-JTG-19` (branch), `R-JTG-20` (branch); control: `- **R-JTG-21**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — feat(jjtl): missing target class, [*] warning, lazy beside matched, such that (P-2026-11-04-0015, P-2026-11-04-0043)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — merge: jjtl-let-unique-called into alfonso-frontend-jjtl (P-2026-11-04-0007)` once (trunk).
4. `git merge --no-ff --no-commit 83a944575`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-language-open into alfonso-frontend-jjtl (P-2026-11-04-0048)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `83a944575` in `/Users/alfonso/jjodel-w-jjtlopen`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-jjtlopen`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 10fadd8ab` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 10fadd8ab HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-language-open merge (P-2026-11-04-0048)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjtlopen`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
