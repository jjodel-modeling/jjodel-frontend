# Prompt: merge textual-e2a-select into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-0927
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-07 · direct merge 57280dd8f · vitest reds by load (hook tests laneRun, laneRunDirect, laneTracking; textual completion, languageService, tolerant; irCollapsedRender, irSelectionRing), green alone, resolved · closed by hand: lane-run go refuses a blocked merge

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0927 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4ace931c5`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-e2a-select` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e08c85271`, in the shape of `ee9d7dbba` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `db79d40ff`. The branch carries, on top of the base, 5 commits:

- `e08c85271` docs: Status flips and log entry for E2a (P-2026-11-07-0746, P-2026-11-07-0840)
- `5ca6ac98a` feat(codegen): E2a, a caret move selects its object on the canvas (P-2026-11-07-0840)
- `bf8759ac3` docs: add prompt P-2026-11-07-0840, E2a continuation
- `ef8c76e3c` feat(codegen): E2a, selectionSync's span, guard and caret filter (P-2026-11-07-0746)
- `b1172ab73` docs: add prompt P-2026-11-07-0746, E2a text to canvas selection

The trunk carries, since the base, 20 commits:

- `4ace931c5` docs(sessioni): multi-tab /lane auto, layout-key fix and L4b merged (C-2026-11-07-0425)
- `bdd976d3e` docs: Status flip and log entry for the multi-tab-l4b merge (P-2026-11-07-0853)
- `ee9d7dbba` merge: multi-tab-l4b into alfonso-frontend-jjtl (P-2026-11-07-0853)
- `dde3e348c` docs: add prompt P-2026-11-07-0853, merge multi-tab-l4b into alfonso-frontend-jjtl
- `a9d626afe` docs: Status flip and log entry for multi-tab L4b (P-2026-11-07-0833)
- `65e74534d` fix(problems): clear a model's problems on its last editor unmount (P-2026-11-07-0833)
- `fd90572de` test(problems): a producer clears only on its model's last unmount (P-2026-11-07-0833)
- `d7c05723f` docs: prompt P-2026-11-07-0833, multi-tab lane L4b
- `306baa1a5` docs: Status flip and log entry for the multi-tab-layout-key merge (P-2026-11-07-0748)
- `da2af3bf7` merge: multi-tab-layout-key into alfonso-frontend-jjtl (P-2026-11-07-0748)
- `39afe9b65` docs: add prompt P-2026-11-07-0748, merge multi-tab-layout-key into alfonso-frontend-jjtl
- `9353e859e` docs(editor-v2): layout-key switch cost and probes, closure (P-2026-11-07-0628)
- `6659d4dc6` docs: prompt P-2026-11-07-0628, layout-key cost measure and closure
- `8328662df` perf(editor-v2): a key-only layout switch skips the transformer (P-2026-11-07-0555)
- `e6aa6c026` test(editor-v2): a key-only switch skips the transformer, red (P-2026-11-07-0555)
- `e6241d590` docs(editor-v2): LIR addendum, re-transform work a key change skips (P-2026-11-07-0555)
- `91be78d3b` docs: prompt P-2026-11-07-0555, cheaper re-transform on a layout switch
- `03a093081` fix(editor-v2): layout key enters the incremental sync snapshot (P-2026-11-07-0430)
- `b1c6dd226` test(editor-v2): layout switch re-transforms every vertex, red (P-2026-11-07-0430)
- `f17528bb1` docs(editor-v2): layout-key resync, Layer Impact Report (P-2026-11-07-0430)

Measured by `lane-run merge` at 2026-11-07 09:27, trunk at `4ace931c5`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e08c85271`: zero conflicts.
- Files changed since the base: 6 on the branch side, 18 on the trunk side; on both sides: none.
- `git diff --name-only db79d40ff e08c85271 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_0746_prompt_textual_e2a_select.md` (eseguito 2026-11-07 · lane full · ef8c76e3c · soft ceiling, continued by P-2026-11-07-0840 (item 2 committed there, 5ca6ac98a)), `claude_2026-11-07_0840_prompt_textual_e2a_continuation.md` (eseguito 2026-11-07 · lane full · 5ca6ac98a · gates green · app check 27/27 (run7) and crop 2 retake 3/3; verifica visiva in attesa del GO (crops 1-6, 2-after-two-arrowdown in ~/.jjodel-lanes/P-2026-11-07-0746/)).
- `git worktree list`: `textual-e2a-select` in `/Users/alfonso/jjodel-w-texte2a`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-0927/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e08c85271` is the tip of `textual-e2a-select`; the prompt files of the branch read `Status: eseguito` at `e08c85271`; `git worktree list` shows `textual-e2a-select` only in `/Users/alfonso/jjodel-w-texte2a`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e08c85271` (measured above: zero conflicts). `git diff --name-only db79d40ff e08c85271 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only db79d40ff alfonso-frontend-jjtl` with `git diff --name-only db79d40ff e08c85271` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E2a, text to canvas selection (P-2026-11-07-0746, P-2026-11-07-0840)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a viewpoint switch re-transforms every vertex once (R-MT-19)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — perf: a key-only layout switch skips the transformer (R-MT-19)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-layout-key into alfonso-frontend-jjtl (P-2026-11-07-0748)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: problem producers clear only on the last unmount of a model` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l4b into alfonso-frontend-jjtl (P-2026-11-07-0853)` once (trunk).
4. `git merge --no-ff --no-commit e08c85271`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-e2a-select into alfonso-frontend-jjtl (P-2026-11-07-0927)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e08c85271` in `/Users/alfonso/jjodel-w-texte2a`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-texte2a`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4ace931c5` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 4ace931c5 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-e2a-select merge (P-2026-11-07-0927)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-texte2a`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
