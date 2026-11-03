# Prompt: merge jjtl-claudemd-initdash into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-2329
Chat: C-2026-11-03-2317
Request: none (rendered by lane-run, no chat URL known for C-2026-11-03-2317)
Lane: full (merge; 1 conflict: `docs/log-inbox/hw-notation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-2329 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `43b5b71d4`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-claudemd-initdash` into the trunk with one merge commit, `--no-ff`, of the explicit sha `34e8e7bc6`, in the shape of `4d053624f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `bd82f5f72`. The branch carries, on top of the base, 5 commits:

- `34e8e7bc6` docs: closure, tickets #529 #530 and inbox entry (P-2026-11-03-2112)
- `14d7f5c18` docs(jjtl): SPEC 7.4, data search for all instances (P-2026-11-03-2112)
- `f0b6a8d8b` chore(redux): drop init_dash console.error and its smoke baseline entry (P-2026-11-03-2112)
- `e5aa9b30f` docs: CLAUDE.md known failures measured, 3 import failures (P-2026-11-03-2112)
- `4cc27018c` docs: add prompt P-2026-11-03-2112, JjTL housekeeping

The trunk carries, since the base, 37 commits:

- `43b5b71d4` docs: Status flip and log entry for the jjtl-output-tab-late merge (P-2026-11-03-2318)
- `7890ef17c` docs: R-TXT-38 provisional, step B design
- `4d053624f` merge: jjtl-output-tab-late into alfonso-frontend-jjtl (P-2026-11-03-2318)
- `c7218212f` docs: add prompt P-2026-11-03-2318, merge jjtl-output-tab-late into alfonso-frontend-jjtl
- `751c900af` docs: Status flip and log entry for the textual-a-tolerant-parser merge (P-2026-11-03-2245)
- `607ec2ead` docs: shorten the Notes of the printer-half entry under the 500-char cap; close merge P-2026-11-03-2245
- `2daef6982` merge: textual-a-tolerant-parser into alfonso-frontend-jjtl (P-2026-11-03-2245)
- `015f728f3` docs: add prompt P-2026-11-03-2245, merge textual-a-tolerant-parser into alfonso-frontend-jjtl
- `deb4416f9` docs: log entry and Status for the printer half of step A (P-2026-11-03-2220)
- `00e4bcea4` docs: R-TXT-37, commenting an object out asks first; plan line in step D
- `5dd458ddb` test(codegen): mutation bench of the printer's tree and its equality (P-2026-11-03-2220)
- `c79d05b4c` perf(codegen): the printer resolves names in linear time (P-2026-11-03-2220)
- `8c6734ffe` feat(codegen): the printer builds the tree its parse builds (P-2026-11-03-2220)
- `98898d626` docs: close the parser half, log entry and Status of 1415, 2120, 2152 (P-2026-11-03-2220)
- `920e17804` docs(harness): tolerant recovery probe of the parser half (P-2026-11-03-2220)
- `a81e598f3` docs: add prompt P-2026-11-03-2220, step A printer half
- `3622a1dda` docs: close the JjTL output tab with the undo group, figures (P-2026-11-03-2110)
- `b35e18146` test(codegen): mutation bench of recovery and the never-applied rule (P-2026-11-03-2152)
- `bfa1a18ee` feat(codegen): the match of a broken parse, for display only (P-2026-11-03-2152)
- `beb512f58` perf(codegen): the parser resolves names in linear time (P-2026-11-03-2152)
- `231113e79` feat(codegen): reference errors after a syntax error are warnings (P-2026-11-03-2152)
- `ce29856c2` feat(codegen): the parser recovers by insertion, deletion and descent (P-2026-11-03-2152)
- `f6c253f23` docs: add prompt P-2026-11-03-2152, step A parser half continuation
- `93ec1bd92` feat(codegen): the parser builds a lossless tree (P-2026-11-03-2120)
- `9f5b0f1f8` fix(jjtl): a long task restarts the run undo group's quiet (P-2026-11-03-2110)
- `722eb3cee` feat(codegen): parser tokens keep their trivia, losslessly (P-2026-11-03-2120)
- `98f81e521` docs: fix the header of R-TXT-36 so that parseRows reads it
- `1a21fd9bc` docs: add prompt P-2026-11-03-2120, step A parser half
- `52627e236` docs: R-TXT-36, answers on the tolerant parser
- `5336934a4` merge: alfonso-frontend-jjtl into jjtl-output-tab-late (P-2026-11-03-2110)
- `2f89bfbb0` docs: add prompt P-2026-11-03-2110, tab after the write with the undo group
- `bda84222f` docs: log entry for the tolerant parser discovery (P-2026-11-03-1415)
- `ecb912167` docs(codegen): discovery of the tolerant parser, step A phase 1 (P-2026-11-03-1415)
- `7acdaa301` docs: close the JjTL output tab late, before/after, two tickets (P-2026-11-03-1232)
- `3b8c3b51b` fix(jjtl): open the output tab after the write-back, count nested ones (P-2026-11-03-1232)
- `ce6c7334a` docs: Layer Impact Report for the JjTL output tab opened late (P-2026-11-03-1232)
- `6571f548a` docs: add prompt P-2026-11-03-1232, open the JjTL output tab after the write

Measured by `lane-run merge` at 2026-11-03 23:29, trunk at `43b5b71d4`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 34e8e7bc6`: 1 conflict: `docs/log-inbox/hw-notation.md`.
- Files changed since the base: 9 on the branch side, 25 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`.
- `git diff --name-only bd82f5f72 34e8e7bc6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: `AGENTS.md`, `CLAUDE.md`.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_2112_prompt_jjtl_claudemd_initdash.md` (eseguito 2026-11-03 · lane hw-notation · 14d7f5c18).
- `git worktree list`: `jjtl-claudemd-initdash` in `/Users/alfonso/jjodel-w-jjtldocs`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- governance files changed on the branch: `AGENTS.md`, `CLAUDE.md`

**Direct.** `lane-run merge --direct` fell back:

- governance files changed on the branch: `AGENTS.md`, `CLAUDE.md`

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `34e8e7bc6` is the tip of `jjtl-claudemd-initdash`; the prompt files of the branch read `Status: eseguito` at `34e8e7bc6`; `git worktree list` shows `jjtl-claudemd-initdash` only in `/Users/alfonso/jjodel-w-jjtldocs`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 34e8e7bc6` (measured above: 1 conflict: `docs/log-inbox/hw-notation.md`). `git diff --name-only bd82f5f72 34e8e7bc6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only bd82f5f72 alfonso-frontend-jjtl` with `git diff --name-only bd82f5f72 34e8e7bc6` (measured above: `docs/log-inbox/hw-notation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-36` (trunk), `R-TXT-37` (trunk), `R-TXT-38` (trunk); control: `- **R-TXT-39**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: Re-opening an already open transformation leaves its tab unfindable and pane hidden` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: Same reference drawn twice on a non-unique feature adds a second value, one edge shown` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — docs: JjTL housekeeping, CLAUDE.md known failures, init_dash, data idiom (P-2026-11-03-2112)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — discovery(codegen): tolerant parser, textual step A phase 1 (P-2026-11-03-1415)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): tolerant parser, lossless tree and recovery, textual step A parser half (P-2026-11-03-2120, P-2026-11-03-2152)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): the printer builds the parser's tree, textual step A printer half (P-2026-11-03-2220)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — merge: textual-a-tolerant-parser into alfonso-frontend-jjtl (P-2026-11-03-2245)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — fix(jjtl): open the output tab after the write-back (P-2026-11-03-1232)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL output canvas freezes the page once the tab opens on a large tree` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: nothing tells the user a JjTL run is still writing its output` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — fix(jjtl): output tab after the write, onto the trunk, undo group kept (P-2026-11-03-2110)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — merge: jjtl-output-tab-late into alfonso-frontend-jjtl (P-2026-11-03-2318)` once (trunk).
4. `git merge --no-ff --no-commit 34e8e7bc6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-claudemd-initdash into alfonso-frontend-jjtl (P-2026-11-03-2329)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `34e8e7bc6` in `/Users/alfonso/jjodel-w-jjtldocs`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-jjtldocs`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 43b5b71d4` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 43b5b71d4 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-claudemd-initdash merge (P-2026-11-03-2329)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjtldocs`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
