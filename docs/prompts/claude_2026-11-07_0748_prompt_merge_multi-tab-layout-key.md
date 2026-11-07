# Prompt: merge multi-tab-layout-key into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-0748
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-07 · lane merge · da2af3bf7 · verifica visiva passata 2026-11-07 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0748 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `db79d40ff`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-layout-key` into the trunk with one merge commit, `--no-ff`, of the explicit sha `9353e859e`, in the shape of `da63da457` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `753122b0b`. The branch carries, on top of the base, 9 commits:

- `9353e859e` docs(editor-v2): layout-key switch cost and probes, closure (P-2026-11-07-0628)
- `6659d4dc6` docs: prompt P-2026-11-07-0628, layout-key cost measure and closure
- `8328662df` perf(editor-v2): a key-only layout switch skips the transformer (P-2026-11-07-0555)
- `e6aa6c026` test(editor-v2): a key-only switch skips the transformer, red (P-2026-11-07-0555)
- `e6241d590` docs(editor-v2): LIR addendum, re-transform work a key change skips (P-2026-11-07-0555)
- `91be78d3b` docs: prompt P-2026-11-07-0555, cheaper re-transform on a layout switch
- `03a093081` fix(editor-v2): layout key enters the incremental sync snapshot (P-2026-11-07-0430)
- `b1c6dd226` test(editor-v2): layout switch re-transforms every vertex, red (P-2026-11-07-0430)
- `f17528bb1` docs(editor-v2): layout-key resync, Layer Impact Report (P-2026-11-07-0430)

The trunk carries, since the base, 40 commits:

- `db79d40ff` docs: close the textual-d4-rename merge by hand (P-2026-11-07-0717)
- `da63da457` merge: textual-d4-rename into alfonso-frontend-jjtl (P-2026-11-07-0717)
- `e373cbcda` docs: add prompt P-2026-11-07-0717, merge textual-d4-rename into alfonso-frontend-jjtl
- `cfbe326c0` docs: close the textual-e1-reprint merge by hand (P-2026-11-07-0645)
- `511a3de3c` merge: textual-e1-reprint into alfonso-frontend-jjtl (P-2026-11-07-0645)
- `76d1b4295` docs: Status flips and log entry for D4 (P-2026-11-07-0515, P-2026-11-07-0609)
- `826e850dd` docs: add prompt P-2026-11-07-0645, merge textual-e1-reprint into alfonso-frontend-jjtl
- `e42169108` fix(codegen): D4 (3), show the rename refusal after typing (P-2026-11-07-0609)
- `c55cc1a3a` docs: Status flip and log entry, textual-e1-reprint took the trunk (P-2026-11-07-0607)
- `c8a3be5f3` merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0607)
- `840d19da7` docs: add prompt P-2026-11-07-0609, D4 continuation
- `438229732` docs: add prompt P-2026-11-07-0607, merge alfonso-frontend-jjtl into textual-e1-reprint
- `a75356f55` docs: Status flips and log entry for E1b (P-2026-11-07-0346, P-2026-11-07-0510)
- `63c4fffc6` feat(codegen): D4 (2), the rename provider of the Text tab (P-2026-11-07-0515)
- `ec89f027f` feat(codegen): D4 (1), renameEdits with the reparse check (P-2026-11-07-0515)
- `40b7be107` feat(codegen): E1b, a comment-only edit is the agreement (P-2026-11-07-0510)
- `c238fa96b` docs: add prompt P-2026-11-07-0515, D4 safe rename
- `cf2b29a1d` docs: add prompt P-2026-11-07-0510, E1b continuation
- `4ad2bf5fc` docs: Status flip and log entry for the textual-name-slot merge (P-2026-11-07-0443)
- `1d4ca6039` merge: textual-name-slot into alfonso-frontend-jjtl (P-2026-11-07-0443)
- `497e172d3` docs: add prompt P-2026-11-07-0443, merge textual-name-slot into alfonso-frontend-jjtl
- `5b9953e38` docs: Status flip and log entry for the name-slot fix (P-2026-11-07-0344)
- `69c191631` docs: prompt P-2026-11-07-0440, multi-tab lane L2
- `0be037a6f` feat(codegen): E1b, T10 wired into the Text tab (P-2026-11-07-0346)
- `fe6f81bc7` fix(codegen): «New model from text» writes every name slot (P-2026-11-07-0344)
- `acebac08a` fix(codegen): a text edit writes the name slot of a created object (P-2026-11-07-0344)
- `63faf9fb9` docs: add prompt P-2026-11-07-0346, E1b, T10 wired into the Text tab
- `e67a878ae` docs: add prompt P-2026-11-07-0344, write the name slot of an object created from text
- `443612826` docs: close the trunk-into of textual-e1-reprint by hand (P-2026-11-07-0251)
- `5099fcf83` docs: Status flip and log entry for the name-slot discovery (P-2026-11-07-0253)
- `55d88a441` docs(discovery): textual name slot, lane plan, N1..N5, risks (P-2026-11-07-0253)
- `3fbfc3141` docs(discovery): textual name slot, the trace and the cause (P-2026-11-07-0253)
- `db49b0bb6` docs(discovery): textual name slot, the reproduction (P-2026-11-07-0253)
- `dac574b7c` docs(discovery): textual name slot, objective and hypotheses (P-2026-11-07-0253)
- `7807c9c78` merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0251)
- `e47437874` docs: add prompt P-2026-11-07-0253, the empty name slot of a model created from text, discovery
- `8bf3b95ed` docs: add prompt P-2026-11-07-0251, merge alfonso-frontend-jjtl into textual-e1-reprint
- `c4a9d442d` docs: Status flip and log entry for E1a (P-2026-11-07-0048)
- `d795d9533` feat(codegen): E1a, T10's splice keeps typed text (P-2026-11-07-0048)
- `334b1985b` docs: add prompt P-2026-11-07-0048, E1a, the T10 splice

Measured by `lane-run merge` at 2026-11-07 07:48, trunk at `db79d40ff`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 9353e859e`: zero conflicts.
- Files changed since the base: 9 on the branch side, 25 on the trunk side; on both sides: none.
- `git diff --name-only 753122b0b 9353e859e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_0555_prompt_multi_tab_layout_key_cost.md` (eseguito 2026-11-07 · lane full · e6241d590, e6aa6c026, 8328662df · soft context ceiling, items 3-5 continued by P-2026-11-07-0628), `claude_2026-11-07_0628_prompt_multi_tab_layout_key_cost_cont.md` (eseguito 2026-11-07 · lane full · closing docs commit · switch +474 ms over parent (300 ms target not met, the cost is a question for Alfonso); verifica visiva in attesa del GO (crops in ~/.jjodel-lanes/P-2026-11-07-0555/crops-0628/)).
- `git worktree list`: `multi-tab-layout-key` in `/Users/alfonso/jjodel-w-mtlk`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `9353e859e` is the tip of `multi-tab-layout-key`; the prompt files of the branch read `Status: eseguito` at `9353e859e`; `git worktree list` shows `multi-tab-layout-key` only in `/Users/alfonso/jjodel-w-mtlk`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 9353e859e` (measured above: zero conflicts). `git diff --name-only 753122b0b 9353e859e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 753122b0b alfonso-frontend-jjtl` with `git diff --name-only 753122b0b 9353e859e` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a viewpoint switch re-transforms every vertex once (R-MT-19)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — perf: a key-only layout switch skips the transformer (R-MT-19)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — discovery: the empty raw name slot of an object created from text (P-2026-11-07-0253)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): the textual layer writes the name slot of an object it creates (P-2026-11-07-0344)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-name-slot into alfonso-frontend-jjtl (P-2026-11-07-0443)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E1a, T10's splice keeps typed text (P-2026-11-07-0048)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0251)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E1b, T10 wired into the Text tab (P-2026-11-07-0510)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0607)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint into alfonso-frontend-jjtl (P-2026-11-07-0645)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D4, safe rename through the text (P-2026-11-07-0609)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d4-rename into alfonso-frontend-jjtl (P-2026-11-07-0717)` once (trunk).
4. `git merge --no-ff --no-commit 9353e859e`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-layout-key into alfonso-frontend-jjtl (P-2026-11-07-0748)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `9353e859e` in `/Users/alfonso/jjodel-w-mtlk`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtlk`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard db79d40ff` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only db79d40ff HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-layout-key merge (P-2026-11-07-0748)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtlk`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
