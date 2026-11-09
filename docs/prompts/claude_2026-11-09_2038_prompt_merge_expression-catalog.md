# Prompt: merge expression-catalog into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-09-2038
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-09-2038 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `198153915`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `expression-catalog` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e17701f44`, in the shape of `cbd3d6115` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `198153915`. The branch carries, on top of the base, 21 commits:

- `e17701f44` docs: Status flips for P-2026-11-08-2310 and P-2026-11-09-1946
- `c212f41fd` merge: expression-catalog takes alfonso-frontend-jjtl (P-2026-11-09-1946)
- `29ad0fc83` docs: close expression catalog S1, log entry and Status flips
- `15239dc8a` docs: add prompt P-2026-11-09-1946, merge alfonso-frontend-jjtl into expression-catalog
- `bccb80208` perf(expression): Auto layout packs the folded model without freezing the page (P-2026-11-09-0952)
- `36984d7a7` docs: add prompt P-2026-11-09-0952, Auto layout without freezing the page
- `5e2a265b3` docs: add prompt P-2026-11-09-0925, Auto layout on the folded model
- `1123ced34` perf(expression): fold views no longer force every node to mount (P-2026-11-09-0900)
- `353ff5a1c` docs: add prompt P-2026-11-09-0900, fold open without mounting every node
- `1ba03bb01` docs: add prompt P-2026-11-09-0806, expression catalog S1c (open time and layout)
- `b42ddc837` feat(expression): fold views and the expression text source (P-2026-11-09-0035)
- `874626956` docs: add prompt P-2026-11-09-0108, expression catalog S1b finish
- `8cb4201db` docs: add prompt P-2026-11-09-0035, expression catalog S1b (wiring)
- `985c27b54` feat(expression): catalog codec, printer, batch, golden test (P-2026-11-09-0010)
- `bdb1f1d0f` docs: add prompt P-2026-11-09-0010, expression catalog S1a (model)
- `c3ffb710a` docs, test: LIR and golden fixtures of expression catalog S1 (P-2026-11-08-2345)
- `60dfcad3c` docs: R-EXP row headers in the register grammar
- `4cf25af28` docs: add prompt P-2026-11-08-2345, expression catalog S1
- `326eff46d` docs: R-EXP-1..14, the expression role catalog; amend R-PLG-11
- `e137e6a8f` docs: discovery of the expression role catalog as the first plugin (P-2026-11-08-2310)
- `2b7ba21b7` docs: add prompt P-2026-11-08-2310, expression role catalog discovery

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-09 20:38, trunk at `198153915`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e17701f44`: zero conflicts.
- Files changed since the base: 43 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 198153915 e17701f44 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_2310_prompt_expression_catalog_discovery.md` (eseguito ✅ e137e6a8f), `claude_2026-11-08_2345_prompt_expression_catalog_s1.md` (eseguito 2026-11-09 · lane full · b42ddc837 · verifica visiva dovuta · log entry in docs/log-inbox/plugins.md), `claude_2026-11-09_0010_prompt_expression_s1a_model.md` (eseguito 2026-11-09 · lane full · 985c27b54 · verifica visiva dovuta · log entry in docs/log-inbox/plugins.md), `claude_2026-11-09_0035_prompt_expression_s1b_wiring.md` (eseguito 2026-11-09 · lane full · b42ddc837 · verifica visiva dovuta · log entry in docs/log-inbox/plugins.md), `claude_2026-11-09_0108_prompt_expression_s1b_finish.md` (eseguito 2026-11-09 · lane full · b42ddc837 · verifica visiva dovuta · log entry in docs/log-inbox/plugins.md), `claude_2026-11-09_0806_prompt_expression_s1c_perf.md` (eseguito ⚠️ hard-stop (measure only; fixes in P-2026-11-09-0900 and P-2026-11-09-0952)), `claude_2026-11-09_0900_prompt_expression_open.md` (eseguito ✅ 1123ced34), `claude_2026-11-09_0925_prompt_expression_layout.md` (eseguito ⚠️ hard-stop, superseded by P-2026-11-09-0952), `claude_2026-11-09_0952_prompt_expression_layout_worker.md` (eseguito ✅ bccb80208), `claude_2026-11-09_1946_prompt_expression-catalog_take_trunk.md` (eseguito ✅ c212f41fd (committed by the chat after the session ceiling; typecheck, check:scripts, check:docs, build green; vitest 16055 passed, only the 3 known import failures)).
- `git worktree list`: `expression-catalog` in `/Users/alfonso/jjodel-w-exprcat`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e17701f44` is the tip of `expression-catalog`; the prompt files of the branch read `Status: eseguito` at `e17701f44`; `git worktree list` shows `expression-catalog` only in `/Users/alfonso/jjodel-w-exprcat`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e17701f44` (measured above: zero conflicts). `git diff --name-only 198153915 e17701f44 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 198153915 alfonso-frontend-jjtl` with `git diff --name-only 198153915 e17701f44` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-EXP-1` (branch), `R-EXP-2` (branch), `R-EXP-3` (branch), `R-EXP-4` (branch), `R-EXP-5` (branch), `R-EXP-6` (branch), `R-EXP-7` (branch), `R-EXP-8` (branch), `R-EXP-9` (branch), `R-EXP-10` (branch), `R-EXP-11` (branch), `R-EXP-12` (branch), `R-EXP-13` (branch), `R-EXP-14` (branch); control: `- **R-EXP-15**` none.
   - `docs/decisions.md`: the heading `## R-EXP: the expression role catalog, textual projection of expression subtrees (decisions 2026-11-08)` once (branch).
   - `docs/log-inbox/plugins.md`: the heading `## 2026-11-09 — feat: expression catalog S1 closed, visual check due (P-2026-11-09-0108)` once (branch).
4. `git merge --no-ff --no-commit e17701f44`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: expression-catalog into alfonso-frontend-jjtl (P-2026-11-09-2038)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e17701f44` in `/Users/alfonso/jjodel-w-exprcat`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-exprcat`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 198153915` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 198153915 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/plugins.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the expression-catalog merge (P-2026-11-09-2038)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-exprcat`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
