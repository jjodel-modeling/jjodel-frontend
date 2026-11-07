# Prompt: merge multi-tab-l2 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-1210
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-1210 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `e31ec1d02`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-l2` into the trunk with one merge commit, `--no-ff`, of the explicit sha `dcd7ed29d`, in the shape of `354ba3cdd` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `319be0670`. The branch carries, on top of the base, 13 commits:

- `dcd7ed29d` merge: alfonso-frontend-jjtl into multi-tab-l2 before the L2 merge
- `9a42beef3` docs: align the multi-tab inbox with the trunk before the L2 merge
- `e225f7000` docs: multi-tab L2 focus write without undo entry, closure (P-2026-11-07-0935)
- `1acbbdf99` fix(multi-tab): a batch of only noUndo writes adds no undo entry (P-2026-11-07-0935)
- `d16f662ac` test(multi-tab): a batch of flagged writes adds no undo entry, red (P-2026-11-07-0935)
- `8ab8077be` feat(multi-tab): focus write adds no undo entry (P-2026-11-07-0935)
- `9b9e9b103` test(multi-tab): focus write adds no undo entry, red (P-2026-11-07-0935)
- `b03625106` docs: prompt P-2026-11-07-0935, L2 focus write without undo entry
- `e0a19596d` docs: multi-tab L2 app check, LIR addendum, closure (P-2026-11-07-0457)
- `cec8db8a6` docs: prompt P-2026-11-07-0457, L2 app check and closure
- `a99ea2482` feat(multi-tab): per-tab viewpoint plumbing, R-MT-18 restore (P-2026-11-07-0440)
- `2f1f166b8` test(multi-tab): tab layout key, tab init, saved abstract syntax, red (P-2026-11-07-0440)
- `029d1ea4e` docs: LIR of multi-tab L2, per-tab viewpoint plumbing (P-2026-11-07-0440)

The trunk carries, since the base, 46 commits:

- `e31ec1d02` docs: Status flip and log entry for the textual-d5-format merge (P-2026-11-07-1141)
- `3f7f6f7f4` docs: log entries of the two hand-closed merges in the canonical format
- `913c614f7` docs: Status flip and log entry, blocked jjtl-failed-run-no-target merge closed (P-2026-11-07-1152)
- `40b586823` test(jjtl): failed run in jjtlSourceValues has no target model (R-FA-14)
- `354ba3cdd` merge: jjtl-failed-run-no-target into alfonso-frontend-jjtl (P-2026-11-07-1152)
- `5e6c4d9bf` docs: add prompt P-2026-11-07-1152, merge jjtl-failed-run-no-target into alfonso-frontend-jjtl
- `a67d021a5` docs: Status flip and log entry for the dcn merge (P-2026-11-07-1123)
- `938b5fe1f` merge: textual-d5-format into alfonso-frontend-jjtl (P-2026-11-07-1141)
- `4693838c4` docs: log entry and Status flip for failed-run target (P-2026-11-07-1125)
- `970f5bbb4` docs: R-FA-14, a failed JjTL run returns no target model (P-2026-11-07-1125)
- `b29f10fd0` docs(jjtl): SPEC 11, a failed run returns no target model (P-2026-11-07-1125)
- `6c51a33ae` fix(jjtl): a failed run returns no target model (P-2026-11-07-1125)
- `10705750f` docs: add prompt P-2026-11-07-1141, merge textual-d5-format into alfonso-frontend-jjtl
- `376a2273e` merge: dcn into alfonso-frontend-jjtl (P-2026-11-07-1123)
- `896362e52` docs: ticket, Enter at the end of a comment accepts a completion (found by P-2026-11-07-0912)
- `9053a07b8` docs: Status flip and log entry for the textual-undo-agreement merge (P-2026-11-07-1103)
- `42d919af1` docs: add prompt P-2026-11-07-1123, merge dcn into alfonso-frontend-jjtl
- `177378f9d` merge: dcn-l23 into dcn (0a860e5c1)
- `0a860e5c1` docs(dcn): L2.3 closure, crops read by the chat (P-2026-11-07-1012)
- `e73016a49` docs: add prompt P-2026-11-07-1125, a failed run returns no target model
- `f6b918db1` feat(sim): the dcn role group and the profile Dynamic classification (P-2026-11-07-1012)
- `81c82350a` merge: dcn-l33 into dcn (2d1629bc8)
- `1ba2bf168` docs(dcn): L2.3 continuation prompt (P-2026-11-07-1012)
- `2d1629bc8` docs(dcn): L3.3 log entry and Status flip (P-2026-11-07-0940)
- `969aa0b3d` feat(jjel): classification accessor for x.in(V::D) (P-2026-11-07-0940)
- `b02f337d7` docs(dcn): l23 prompt (P-2026-11-07-0941)
- `db4d36437` docs(dcn): l33 prompt (P-2026-11-07-0940)
- `17d6829f4` docs(dcn): rebuild the log inbox after the integration merges
- `e53710005` merge: dcn-l41 into dcn (f4db1b7a2)
- `22a701530` merge: dcn-l32 into dcn (23ad687c6)
- `cadabbf44` merge: dcn-l22 into dcn (2b1084b6b)
- `b6bbe612e` docs: Status flips and log entry for D5 (P-2026-11-07-0747, P-2026-11-07-0841)
- `f4db1b7a2` docs(dcn): L4.1 closure, visual check by browser parity (P-2026-11-07-0701)
- `a60af4492` docs: add prompt P-2026-11-07-0841, D5 continuation
- `afb9d681b` feat(codegen): D5, Format Document and Format Selection providers (P-2026-11-07-0747)
- `65eda512f` feat(codegen): D5, format keeps comments by owner (P-2026-11-07-0747)
- `c7fb7e355` docs(dcn): L4.1 browser parity continuation prompt (P-2026-11-07-0750)
- `01a3faa07` docs: add prompt P-2026-11-07-0747, D5 format
- `23ad687c6` docs(dcn): L3.2 log entry and Status flip (P-2026-11-07-0700)
- `0125bae93` feat(jjel): parse self.in(V::D) into ClassificationTest (P-2026-11-07-0700)
- and 6 more: `git log --oneline 319be0670..e31ec1d02`

Measured by `lane-run merge` at 2026-11-07 12:10, trunk at `e31ec1d02`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl dcd7ed29d`: zero conflicts.
- Files changed since the base: 17 on the branch side, 59 on the trunk side; on both sides: none.
- `git diff --name-only 319be0670 dcd7ed29d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_0457_prompt_multi_tab_l2_check.md` (eseguito 2026-11-07 · lane full · app check 3 runs per tree, V1 V2 R-MT-18 3/3, V3 +1 undo per focus, one tab = base · LIR addendum · non fuso: hard-stop, visual check due), `claude_2026-11-07_0935_prompt_multi_tab_l2_focus_no_undo.md` (eseguito 2026-11-07 · lane full · 9b9e9b103 8ab8077be d16f662ac 1acbbdf99 · app check 3 runs, V3 +0 undo per focus, V1 V2 R-MT-18 one tab = 0457 · scope expansion approved (reducer, action, lastViewpoint) · non fuso: hard-stop, visual check due).
- `git worktree list`: `multi-tab-l2` in `/Users/alfonso/jjodel-w-mtl2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `dcd7ed29d` is the tip of `multi-tab-l2`; the prompt files of the branch read `Status: eseguito` at `dcd7ed29d`; `git worktree list` shows `multi-tab-l2` only in `/Users/alfonso/jjodel-w-mtl2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl dcd7ed29d` (measured above: zero conflicts). `git diff --name-only 319be0670 dcd7ed29d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 319be0670 alfonso-frontend-jjtl` with `git diff --name-only 319be0670 dcd7ed29d` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-FA-14` (trunk); control: `- **R-FA-15**` none.
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: per-tab viewpoint plumbing, saved abstract syntax restored (multi-tab L2)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: the viewpoint write on tab focus adds no undo entry (multi-tab L2)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-undo-agreement into alfonso-frontend-jjtl (P-2026-11-07-1103)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — ticket: Text tab: Enter at the end of a comment accepts a completion (// end stateState)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D5, Format Document and Format Selection (P-2026-11-07-0747, P-2026-11-07-0841)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d5-format into alfonso-frontend-jjtl (P-2026-11-07-1141)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-06 — chore: DCN drone fixture, the DCN metamodel and the drone class level on the UML fixture` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: parse `::` and `self.in(V::D)` into a ClassificationTest node` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — refactor: a nucleus field on the simulator run, Petri as its default` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the classification accessor on the JjEL evaluation context` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the dcn role group and the system profile Dynamic classification` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn into alfonso-frontend-jjtl (P-2026-11-07-1123)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — fix(jjtl): a failed run returns no target model (P-2026-11-07-1125)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — docs: closure of the blocked jjtl-failed-run-no-target merge` once (trunk).
4. `git merge --no-ff --no-commit dcd7ed29d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-l2 into alfonso-frontend-jjtl (P-2026-11-07-1210)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `dcd7ed29d` in `/Users/alfonso/jjodel-w-mtl2`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtl2`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard e31ec1d02` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only e31ec1d02 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-l2 merge (P-2026-11-07-1210)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtl2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
