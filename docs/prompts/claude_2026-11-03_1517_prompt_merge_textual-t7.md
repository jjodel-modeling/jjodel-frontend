# Prompt: merge textual-t7 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-1517
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-t7 launched by chat C-2026-11-03-1037)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-03 · lane merge · ec570ca11 · verifica visiva passata 2026-11-03 (merge of textual-t7, gates green on the merge; crops of P-2026-11-03-1321 and P-2026-11-03-1451 checked by the chat before the merge (RC-23); the as-typed path after an application goes to P-2026-11-03-1530)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1517 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ed6367578`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-t7` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d1aea42a1`, in the shape of `89841fc92` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `faa85e8ac`. The branch carries, on top of the base, 21 commits:

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

The trunk carries, since the base, 30 commits:

- `ed6367578` docs: ticket, merge --direct reads a fixed test file as a red gate (P-2026-11-03-1420)
- `19be41872` docs: close the jjtl-spec-12-review merge by hand (P-2026-11-03-1420)
- `89841fc92` merge: jjtl-spec-12-review into alfonso-frontend-jjtl (P-2026-11-03-1420)
- `3997a368f` docs: R-TXT-35 ratified, R-TXT-33 ratified
- `adde47e1d` docs: add prompt P-2026-11-03-1420, merge jjtl-spec-12-review into alfonso-frontend-jjtl
- `ace0592df` docs: log entry and [*] ticket for the SPEC 12.2 review (P-2026-11-03-1402)
- `207cd0252` docs(jjtl): SPEC 12.2 rows reviewed, #445 warning in §10 (P-2026-11-03-1402)
- `e784e325d` fix(jjtl): warn undeclared bindings, SPEC 12.2 local fixes (P-2026-11-03-1402)
- `03df7951a` docs: add EBNF syntax highlighting to step B of the textual plan
- `e0eeab06d` docs: add prompt P-2026-11-03-1402, JjTL SPEC 12.2 review and undeclared bindings
- `414eedc0b` docs: Status flip and log entry for the jjtl-rerun-stale-ast merge (P-2026-11-03-1350)
- `42f06c6b2` docs: mark R-TXT-33 provisional in its header
- `881d76722` docs: R-TXT-34, IDE-level editor plan, reserve prompt P-2026-11-03-1415
- `ba649974e` merge: jjtl-rerun-stale-ast into alfonso-frontend-jjtl (P-2026-11-03-1350)
- `f7b9db092` docs: add prompt P-2026-11-03-1350, merge jjtl-rerun-stale-ast into alfonso-frontend-jjtl
- `27a37b79d` docs: Status flip and log entry for the #446 stale AST fix (P-2026-11-03-1315)
- `0d0b00228` fix(jjtl): a repeated parse no longer drops the pending one (P-2026-11-03-1315)
- `2872b4b51` docs: add prompt P-2026-11-03-1315, JjTL re-run with a stale AST
- `8469b98b2` docs: R-TXT-33 provisional, ordered default and cut and paste identity
- `7ec213241` docs: Status flip and log entry for the jjtl-writeback-flush merge (P-2026-11-03-1219)
- `f4232f784` merge: jjtl-writeback-flush into alfonso-frontend-jjtl (P-2026-11-03-1219)
- `a3317694b` docs: close the JjTL walk cap fix, before/after, #486 high (P-2026-11-03-1137)
- `8ef8b27ae` fix(jjtl): the nested walk gives up on no progress, not on time (P-2026-11-03-1137)
- `78711617d` docs: add prompt P-2026-11-03-1137, the JjTL walk and its per-level cap
- `208731e0e` docs: close the JjTL write-back fix, before/after, ticket #486 (P-2026-11-03-1057)
- `7146fda53` fix(jjtl): nested attributes wait for their slots, loss in the panel (P-2026-11-03-1057)
- `16ea42e8c` docs: add prompt P-2026-11-03-1057, close the JjTL write-back fix
- `347f3996d` wip: JjTL nested attributes wait for their slots, report what was not written (P-2026-11-03-1033)
- `d8a736474` docs: Layer Impact Report, JjTL write-back flush (P-2026-11-03-1033)
- `5c998f059` docs: add prompt P-2026-11-03-1033, JjTL write-back without silent loss

Measured by `lane-run merge` at 2026-11-03 15:17, trunk at `ed6367578`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d1aea42a1`: zero conflicts.
- Files changed since the base: 21 on the branch side, 26 on the trunk side; on both sides: none.
- `git diff --name-only faa85e8ac d1aea42a1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_1225_prompt_textual_t7.md` (eseguito 2026-11-03 · lane full · ee2f4ccc6 (discovery cbec3d1bf) · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1321)), `claude_2026-11-03_1251_prompt_textual_t7_continuation.md` (eseguito 2026-11-03 · lane full · b2e9bae4d · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1321)), `claude_2026-11-03_1321_prompt_textual_t7_acceptance.md` (eseguito 2026-11-03 · lane fast · d2125a90f · stopped at the context ceiling (RC-51), closed by P-2026-11-03-1356 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1321)), `claude_2026-11-03_1356_prompt_textual_t7_paths.md` (eseguito 2026-11-03 · lane fast · d23d39e7f, report 8277287b8 (measurement, no fix) · verifica visiva non applicabile, chiude con il commit del GO di 1321 (RC-17)), `claude_2026-11-03_1425_prompt_textual_t7_keep_refs.md` (eseguito 2026-11-03 · lane fast · 74b0703d5 · stopped at the context ceiling (RC-51), closed by P-2026-11-03-1451 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1451; the as-typed path after an application goes to the next lane)), `claude_2026-11-03_1451_prompt_textual_t7_keep_acceptance.md` (eseguito 2026-11-03 · lane fast · 4b34517b0 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1451; the as-typed path after an application goes to the next lane)).
- `git worktree list`: `textual-t7` in `/Users/alfonso/jjodel-w-textt7`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-03-1517/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d1aea42a1` is the tip of `textual-t7`; the prompt files of the branch read `Status: eseguito` at `d1aea42a1`; `git worktree list` shows `textual-t7` only in `/Users/alfonso/jjodel-w-textt7`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d1aea42a1` (measured above: zero conflicts). `git diff --name-only faa85e8ac d1aea42a1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only faa85e8ac alfonso-frontend-jjtl` with `git diff --name-only faa85e8ac d1aea42a1` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-33` (trunk), `R-TXT-34` (trunk), `R-TXT-35` (trunk); control: `- **R-TXT-36**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): text edits move objects and reorder ordered features (P-2026-11-03-1225, P-2026-11-03-1251, P-2026-11-03-1321)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — test(codegen): positional paths after a move or reorder (P-2026-11-03-1356)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): an untouched reference token keeps its target (P-2026-11-03-1425, P-2026-11-03-1451)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL nested walk drops subtrees when a long task outlasts its 3 s per-level cap` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — fix(jjtl): nested attributes wait for their slots, loss in the panel (P-2026-11-03-1057)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL nested walk cap raised to high, it breaks #482's acceptance at ordinary load (#486)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — fix(jjtl): the nested walk gives up on no progress, not on time (P-2026-11-03-1137)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — merge: jjtl-writeback-flush into alfonso-frontend-jjtl (P-2026-11-03-1219)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — fix(jjtl): a re-run in the same tab no longer executes a stale AST (P-2026-11-03-1315)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — merge: jjtl-rerun-stale-ast into alfonso-frontend-jjtl (P-2026-11-03-1350)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL multiplicity [*] creates one target per source, silently` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — fix(jjtl): SPEC 12.2 rows reviewed, undeclared bindings warned (#445) (P-2026-11-03-1402)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — merge: jjtl-spec-12-review into the trunk, closure by hand (P-2026-11-03-1420)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: merge --direct reads a test file fixed from red at import as a red gate` once (trunk).
4. `git merge --no-ff --no-commit d1aea42a1`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-t7 into alfonso-frontend-jjtl (P-2026-11-03-1517)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d1aea42a1` in `/Users/alfonso/jjodel-w-textt7`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textt7`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ed6367578` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only ed6367578 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-t7 merge (P-2026-11-03-1517)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textt7`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
