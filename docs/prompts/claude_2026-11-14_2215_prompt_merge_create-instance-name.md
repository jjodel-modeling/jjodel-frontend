# Prompt: merge create-instance-name into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-14-2215
Chat: C-2026-11-12-1346
Request: https://claude.ai/code/session_01DQt9R4bYnjEzX4r18SudeG (merge of create-instance-name launched by chat C-2026-11-12-1346)
Lane: full (merge; 1 conflict: `docs/log-inbox/maintenance.md` measured)
Status: eseguito 2026-11-14 · lane merge · aea148e92 · verifica visiva passata 2026-11-14 (passato, chat unattended: gates green on aea148e92. Alfonso check owed on localhost:3000: create instance of State "idle" in the Console of a model that has idle is refused with An instance named idle already exists.)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-14-2215 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `0e5f64b04`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `create-instance-name` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a5220748e`, in the shape of `b153c8027` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `22cf59a25`. The branch carries, on top of the base, 4 commits:

- `a5220748e` docs: closure, create instance name check, log entry and Status (P-2026-11-14-2146)
- `c4c9095f3` docs: ticket, set x.name writes an instance name unchecked (P-2026-11-14-2146)
- `b240b96b3` fix(jjscript): create instance refuses a name the model holds (P-2026-11-14-2146)
- `e1e4aa3f9` docs: discovery, create instance name check (P-2026-11-14-2146)

The trunk carries, since the base, 7 commits:

- `0e5f64b04` docs: Status flip and log entry for the spec-do-literal merge (P-2026-11-14-2159)
- `b153c8027` merge: spec-do-literal into alfonso-frontend-jjtl (P-2026-11-14-2159)
- `5f1bbb41e` docs: add prompt P-2026-11-14-2159, merge spec-do-literal into alfonso-frontend-jjtl
- `065f14bd5` docs: three tickets from the SPEC lane (JjTL forall do, invertibility of +, wording)
- `d89d35529` docs: Status flip of the SPEC forall do and literal wording (P-2026-11-14-2145)
- `758dfb2cc` docs: log entry for the SPEC forall do and literal wording (P-2026-11-14-2145)
- `7fa09dfe3` docs: forall do is JjScript's; a literal binding is invertible (SPEC) (P-2026-11-14-2145)

Measured by `lane-run merge` at 2026-11-14 22:15, trunk at `0e5f64b04`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a5220748e`: 1 conflict: `docs/log-inbox/maintenance.md`.
- Files changed since the base: 10 on the branch side, 5 on the trunk side; on both sides: `docs/log-inbox/maintenance.md`.
- `git diff --name-only 22cf59a25 a5220748e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `create-instance-name` in `/Users/alfonso/jjodel-w-create-instance-name`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-14-2215/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a5220748e` is the tip of `create-instance-name`; the prompt files of the branch read `Status: eseguito` at `a5220748e`; `git worktree list` shows `create-instance-name` only in `/Users/alfonso/jjodel-w-create-instance-name`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a5220748e` (measured above: 1 conflict: `docs/log-inbox/maintenance.md`). `git diff --name-only 22cf59a25 a5220748e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 22cf59a25 alfonso-frontend-jjtl` with `git diff --name-only 22cf59a25 a5220748e` (measured above: `docs/log-inbox/maintenance.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-14 — ticket: JjScript: set x.name writes an instance name with no name check, a script can still create unaddressable twins` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-14 — fix(jjscript): create instance refuses a name the model holds (P-2026-11-14-2146)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-14 — ticket: JjTL: forall ... do at rule level is dropped silently, no error and nothing created` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-14 — ticket: JjTL invertibility: any + with a literal is invertible, no inverse for numbers, other operand unchecked` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-14 — ticket: Wording: CLAUDE.md 12.6 on do, JjTL SPEC line 11 on running in either direction` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-14 — docs: forall do is JjScript's; a literal binding is invertible (SPEC)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-14 — merge: spec-do-literal into alfonso-frontend-jjtl (P-2026-11-14-2159)` once (trunk).
4. `git merge --no-ff --no-commit a5220748e`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: create-instance-name into alfonso-frontend-jjtl (P-2026-11-14-2215)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a5220748e` in `/Users/alfonso/jjodel-w-create-instance-name`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-create-instance-name`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 0e5f64b04` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 0e5f64b04 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the create-instance-name merge (P-2026-11-14-2215)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-create-instance-name`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
