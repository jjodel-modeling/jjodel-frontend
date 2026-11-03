# Prompt: merge jjtl-class2relational into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-1532
Chat: C-2026-11-03-1020
Request: https://claude.ai/code/session_01DQt9R3BFXF4UseWLm7Xnzy (merge of jjtl-class2relational launched by chat C-2026-11-03-1020)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1532 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `968e7a44e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-class2relational` into the trunk with one merge commit, `--no-ff`, of the explicit sha `7f5d686d6`, in the shape of `ec570ca11` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ed6367578`. The branch carries, on top of the base, 7 commits:

- `7f5d686d6` docs: close the Class2Relational acceptance, log entry and Status (P-2026-11-03-1505)
- `6226edf31` docs: Class2Relational discovery report (P-2026-11-03-1505)
- `7ec6305ae` docs: two app-probe tickets from Class2Relational (P-2026-11-03-1505)
- `e2332b61c` docs: five tickets from the Class2Relational acceptance (P-2026-11-03-1505)
- `516763cdd` docs: add prompt P-2026-11-03-1505, close the Class2Relational acceptance
- `8a064bbbd` test(jjtl): Class2Relational acceptance, resolve finds the matched rule (P-2026-11-03-1434)
- `c97513d28` docs: add prompt P-2026-11-03-1434, Class2Relational acceptance

The trunk carries, since the base, 24 commits:

- `968e7a44e` docs: Status flip and log entry for the textual-t7 merge (P-2026-11-03-1517)
- `ec570ca11` merge: textual-t7 into alfonso-frontend-jjtl (P-2026-11-03-1517)
- `4b2237ae3` docs: add prompt P-2026-11-03-1517, merge textual-t7 into alfonso-frontend-jjtl
- `d1aea42a1` docs: Status flips and log entry of the keep rule, crops checked (P-2026-11-03-1451)
- `4b34517b0` test(codegen): Text tab carries reference tokens; keep-rule bench (P-2026-11-03-1451)
- `4e9ddb451` docs: add prompt P-2026-11-03-1451, keep rule acceptance
- `74b0703d5` feat(codegen): an untouched reference token keeps its target (P-2026-11-03-1425)
- `c51ac0289` docs: add prompt P-2026-11-03-1425, unretyped reference keeps its target
- `e9eedc5c8` docs: Status flips and log entries of the T7 series, crops checked (P-2026-11-03-1321, P-2026-11-03-1356)
- `8277287b8` docs(discovery): positional paths after a move or reorder (P-2026-11-03-1356)
- `d23d39e7f` test(codegen): an untouched positional path is retargeted (P-2026-11-03-1356)
- `abec5f035` docs: add prompt P-2026-11-03-1356, T7 closure and positional paths
- `d2125a90f` fix(codegen): take a moved object out of its old slot first (P-2026-11-03-1321)
- `0395e708b` test(codegen): an outer marker skips the token of a contained object (P-2026-11-03-1321)
- `1b4064899` fix(codegen): empty a single-valued slot before a move into it (P-2026-11-03-1321)
- `b24727ad9` docs: add prompt P-2026-11-03-1321, textual T7 acceptance
- `b2e9bae4d` feat(codegen): carry a cut to its paste, mark a misplaced outer id (P-2026-11-03-1251)
- `ff2c371fd` feat(codegen): read `ordered` off the lookup in the Text tab (P-2026-11-03-1251)
- `2f16d3f39` feat(codegen): apply moves and reorders of a text edit (P-2026-11-03-1251)
- `44060e73a` docs: add prompt P-2026-11-03-1251, textual T7 continuation
- `22c3d1b41` docs: fix the prompt file name in the T7 discovery (P-2026-11-03-1225)
- `ee2f4ccc6` feat(jjscript): plan an M1 move between containment slots (P-2026-11-03-1225)
- `cbec3d1bf` docs: discovery for textual T7 moves and reorder (P-2026-11-03-1225)
- `0f2126a8b` docs: add prompt P-2026-11-03-1225, textual T7 moves and order

Measured by `lane-run merge` at 2026-11-03 15:32, trunk at `968e7a44e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7f5d686d6`: zero conflicts.
- Files changed since the base: 7 on the branch side, 22 on the trunk side; on both sides: none.
- `git diff --name-only ed6367578 7f5d686d6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_1434_prompt_jjtl_class2relational.md` (eseguito 2026-11-03 · lane full · 8a064bbbd · fixture and test committed; app probe, tickets and report completed by P-2026-11-03-1505 after the context ceiling (unattended)), `claude_2026-11-03_1505_prompt_jjtl_class2relational_close.md` (eseguito 2026-11-03 · lane full · 6226edf31 · app probe through the Execute dialog, output equals the expected schema, same tree after reopen; #445 not in the panel (#520); no visual check by hand (unattended)).
- `git worktree list`: `jjtl-class2relational` in `/Users/alfonso/jjodel-w-jjtlc2r`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-03-1532/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `7f5d686d6` is the tip of `jjtl-class2relational`; the prompt files of the branch read `Status: eseguito` at `7f5d686d6`; `git worktree list` shows `jjtl-class2relational` only in `/Users/alfonso/jjodel-w-jjtlc2r`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7f5d686d6` (measured above: zero conflicts). `git diff --name-only ed6367578 7f5d686d6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ed6367578 alfonso-frontend-jjtl` with `git diff --name-only ed6367578 7f5d686d6` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL let bound to a called rule runs the rule at each use, silently` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL x.parent is null for any element but the rule's own source` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL resolve(x, T) with a bare type name works only as a whole right-hand side` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL binding cut at the newline, continuation gives a misleading parse error` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL has no allInstances, the idiom is a search of data` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL warnings, #445 included, never reach the output panel` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL floating Execute button partly under the editor scrollbar` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — test(jjtl): Class2Relational acceptance, app probe and report (P-2026-11-03-1505)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): text edits move objects and reorder ordered features (P-2026-11-03-1225, P-2026-11-03-1251, P-2026-11-03-1321)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — test(codegen): positional paths after a move or reorder (P-2026-11-03-1356)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): an untouched reference token keeps its target (P-2026-11-03-1425, P-2026-11-03-1451)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — merge: textual-t7 into alfonso-frontend-jjtl (P-2026-11-03-1517)` once (trunk).
4. `git merge --no-ff --no-commit 7f5d686d6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-class2relational into alfonso-frontend-jjtl (P-2026-11-03-1532)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `7f5d686d6` in `/Users/alfonso/jjodel-w-jjtlc2r`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-jjtlc2r`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 968e7a44e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 968e7a44e HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-class2relational merge (P-2026-11-03-1532)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjtlc2r`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
