# Prompt: merge jjtl-called-rules into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-0121
Chat: C-2026-11-02-1541
Request: https://claude.ai/code/session_01DQt9R6PwbdyvU1szY334kM (merge of jjtl-called-rules launched by chat C-2026-11-02-1541)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-0121 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `b200ccbc8`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-called-rules` into the trunk with one merge commit, `--no-ff`, of the explicit sha `4acda9332`, in the shape of `5b186217f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `b200ccbc8`. The branch carries, on top of the base, 25 commits:

- `4acda9332` docs: Status flip and log entry, jjtl-called-rules took the trunk (P-2026-11-03-0045)
- `a4aa879ec` merge: jjtl-called-rules takes alfonso-frontend-jjtl (P-2026-11-03-0045)
- `232687880` docs: add prompt P-2026-11-03-0045, merge alfonso-frontend-jjtl into jjtl-called-rules
- `3ace5cb34` docs: Status lines of P-2026-11-02-2338 and P-2026-11-03-0009
- `00335dd54` docs: log entry and three tickets, JjTL B2 closed (P-2026-11-03-0009)
- `b1d1c45fd` docs(jjtl): SPEC 5.3.3, B2 list closed but item 4 (P-2026-11-03-0009)
- `bbaf4f1fc` docs: add prompt P-2026-11-03-0009, close JjTL B2
- `7e96a4e1c` feat(jjtl): B2 write-back by target identity (P-2026-11-02-2338)
- `e02dbbe10` docs: add prompt P-2026-11-02-2338, JjTL B2 write-back
- `ed7a4614f` docs: Status line of P-2026-11-02-2321
- `7cee663cc` docs: log entry, JjTL B1 steps 4 and 5 (P-2026-11-02-2321)
- `b0ad73715` docs(jjtl): SPEC 5.3.3 lazy rules and containment under B, 12, B2 list (P-2026-11-02-2321)
- `6bf6e6578` feat(jjtl): B1 step 5, containment under B (P-2026-11-02-2321)
- `105140d39` feat(jjtl): B1 step 4, lazy rules (P-2026-11-02-2321)
- `d95f2e215` docs: add prompt P-2026-11-02-2321, JjTL B1 steps 4 and 5
- `0dfcc89eb` docs: Status lines of P-2026-11-02-2224 and P-2026-11-02-2247
- `d50f048ad` docs: log entry, JjTL B1 steps 2 and 3 (P-2026-11-02-2247)
- `0c2e9d071` docs(jjtl): SPEC 5.3.3, called rules and the environment (P-2026-11-02-2247)
- `8ddcc744f` feat(jjtl): B1 step 3, the environment (P-2026-11-02-2247)
- `4e2891bc3` test(jjtl): B1 step 2, called rules tested (P-2026-11-02-2247)
- `97bf1e8fb` docs: add prompt P-2026-11-02-2247, JjTL B1 steps 2 and 3
- `bacc6839d` wip(jjtl): B1 step 2 from the handoff, untested (P-2026-11-02-2224)
- `8c8da7b10` docs(jjtl): SPEC 2.1 and 3.4b, grammar of called and lazy rules (P-2026-11-02-2224)
- `89b7c86e5` feat(jjtl): B1 step 1, grammar of called, lazy and delegating rules (P-2026-11-02-2224)
- `bb01c8060` docs: add prompt P-2026-11-02-2224, JjTL B1 called and lazy rules

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-03 01:21, trunk at `b200ccbc8`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 4acda9332`: zero conflicts.
- Files changed since the base: 20 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only b200ccbc8 4acda9332 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_2224_prompt_jjtl_b1_called_lazy_rules.md` (eseguito in parte 2026-11-02 · lane hw-notation · steps 1-3 (89b7c86e5, 4e2891bc3, 8ddcc744f) · steps 4-5 to a next lane), `claude_2026-11-02_2247_prompt_jjtl_b1_steps_2_3.md` (eseguito 2026-11-02 · lane hw-notation · 4e2891bc3, 8ddcc744f), `claude_2026-11-02_2321_prompt_jjtl_b1_steps_4_5.md` (eseguito 2026-11-02 · lane hw-notation · 105140d39, 6bf6e6578, b0ad73715), `claude_2026-11-02_2338_prompt_jjtl_b2_writeback.md` (eseguito 2026-11-03 · lane hw-notation · 7e96a4e1c, closed by P-2026-11-03-0009), `claude_2026-11-03_0009_prompt_jjtl_b2_close.md` (eseguito 2026-11-03 · lane hw-notation · b1d1c45fd, 00335dd54), `claude_2026-11-03_0045_prompt_jjtl-called-rules_take_trunk.md` (eseguito 2026-11-03 · lane jjtl-called-rules · a4aa879ec · verifica visiva non eseguita sul branch fuso 2026-11-03 (chat, unattended: GO on the gates of a4aa879ec read from the lane; no app run on the merged branch; the app probes of P-2026-11-03-0009 predate this trunk-into; Alfonso in the morning digest)).
- `git worktree list`: `jjtl-called-rules` in `/Users/alfonso/jjodel-w-jjtlcalled`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `4acda9332` is the tip of `jjtl-called-rules`; the prompt files of the branch read `Status: eseguito` at `4acda9332`; `git worktree list` shows `jjtl-called-rules` only in `/Users/alfonso/jjodel-w-jjtlcalled`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 4acda9332` (measured above: zero conflicts). `git diff --name-only b200ccbc8 4acda9332 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only b200ccbc8 alfonso-frontend-jjtl` with `git diff --name-only b200ccbc8 4acda9332` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — feat(jjtl): B1 steps 2 and 3, called rules tested, the environment (P-2026-11-02-2247)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — feat(jjtl): B1 steps 4 and 5, lazy rules and containment under B (P-2026-11-02-2321)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL source serializer unwraps a one-element many-valued reference` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL source serializer drops a repeated pointer of a many-valued reference` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL write-back of a 2,559-object tree takes 17 s against 603 ms in the executor` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — feat(jjtl): B2 closed, probes rerun, SPEC 5.3.3 (P-2026-11-03-0009)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — merge: jjtl-called-rules takes alfonso-frontend-jjtl (P-2026-11-03-0045)` once (branch).
4. `git merge --no-ff --no-commit 4acda9332`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-called-rules into alfonso-frontend-jjtl (P-2026-11-03-0121)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `4acda9332` in `/Users/alfonso/jjodel-w-jjtlcalled`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-jjtlcalled`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard b200ccbc8` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only b200ccbc8 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-called-rules merge (P-2026-11-03-0121)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjtlcalled`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
