# Prompt: merge textual-c2h-index into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-1926
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-c2h-index launched by chat C-2026-11-03-1037)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-08 · lane merge · 936f8ac85 · verifica visiva passata 2026-11-08 (C2h crops 1-chips, 2-default-view in ~/.jjodel-lanes/P-2026-11-08-1626/ checked by the chat; app check 29/29)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1926 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `3c5c56bf4`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-c2h-index` into the trunk with one merge commit, `--no-ff`, of the explicit sha `21c46e67a`, in the shape of `5239ad052` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f081ad4f2`. The branch carries, on top of the base, 8 commits:

- `21c46e67a` docs: C2h log entry and Status flip (P-2026-11-08-1626)
- `09e60421f` fix(editor-v2): C2h, number unnamed homonyms on the IR chips (P-2026-11-08-1626)
- `d54e1f51d` test(editor-v2): C2h, chips of one field number homonyms, red (P-2026-11-08-1626)
- `4577595f1` docs: LIR of C2h, the chips under the widened scope (P-2026-11-08-1626)
- `0f72e3ad3` fix(editor-v2): C2h, the stale comments name `<Class> (unnamed)` (P-2026-11-08-1626)
- `71bf799ef` fix(editor-v2): C2h, number unnamed homonyms of one default-view slot (P-2026-11-08-1626)
- `fce48f889` docs: LIR of C2h, index on unnamed homonym labels (P-2026-11-08-1626)
- `279a76a6a` docs: prompt for C2h, index on unnamed homonym chips and default view (P-2026-11-08-1626)

The trunk carries, since the base, 52 commits:

- `3c5c56bf4` docs: Status flip and log entry for the jjscript-settle-inflight merge (P-2026-11-08-1912)
- `89ad4e5fb` docs: add prompt P-2026-11-08-1845, dashboard drop import discovery
- `5239ad052` merge: jjscript-settle-inflight into alfonso-frontend-jjtl (P-2026-11-08-1912)
- `9feb26641` docs: add prompt P-2026-11-08-1912, merge jjscript-settle-inflight into alfonso-frontend-jjtl
- `ae12b41c5` docs: Status flip and log entry for the undo-tab-graphs-b merge (P-2026-11-08-1858)
- `93f7485a8` merge: undo-tab-graphs-b into alfonso-frontend-jjtl (P-2026-11-08-1858)
- `1da6899fe` docs: JjScript settle in-flight log entry and Status flip (P-2026-11-08-1759)
- `51ccb0fb6` docs: add prompt P-2026-11-08-1858, merge undo-tab-graphs-b into alfonso-frontend-jjtl
- `9440e9fdd` docs: Status flip and log entry for the jjtl-megamodel-included merge (P-2026-11-08-1842)
- `ea9bacb81` merge: jjtl-megamodel-included into alfonso-frontend-jjtl (P-2026-11-08-1842)
- `f0d8d31a3` docs: option B log entry, tickets #789-#792 and Status flips (P-2026-11-08-1800)
- `f73293704` docs: add prompt P-2026-11-08-1842, merge jjtl-megamodel-included into alfonso-frontend-jjtl
- `fac890de5` fix(jjscript): settle waits for in-flight dispatches (P-2026-11-08-1759)
- `34677007c` docs: Status flip and log entry for the dcn-l47 merge (P-2026-11-08-1757)
- `515caad54` docs: LIR of the JjScript settle in-flight wait (P-2026-11-08-1759)
- `eeb5f10c4` fix(undo): a graph-only delta writes no undo entry (P-2026-11-08-1800)
- `0cc6165c5` docs: Layer Impact Report for option B, undo below a tab open (P-2026-11-08-1800)
- `4a75388f7` merge: dcn-l47 into alfonso-frontend-jjtl (P-2026-11-08-1757)
- `00757bfb8` docs: prompt for option B, undo below a tab open (P-2026-11-08-1800)
- `75e7d642b` docs: prompt for the JjScript settle in-flight fix (P-2026-11-08-1759)
- `9cfe2bcc4` docs: add prompt P-2026-11-08-1757, merge dcn-l47 into alfonso-frontend-jjtl
- `2274a79e7` docs: ticket blocks from the multi-tab chat (P-2026-11-08-1247, P-2026-11-08-1003)
- `266ebb690` docs: checkpoint update, afternoon round of the codegen front (C-2026-11-03-1037)
- `b41af1105` docs(undo): discovery, duplicate graphs after Undo below a tab open (P-2026-11-08-1719)
- `8d695c689` docs: Status flip of the megamodel included edges lane (P-2026-11-08-1720)
- `b22c6e5da` docs: log entry and conformsTo pills ticket (P-2026-11-08-1720)
- `f9ca9cd8c` docs(jjtl): report addendum, tracks and short pill (P-2026-11-08-1720)
- `f28299521` docs: R-JTG-35, input edges of included models, tracks (P-2026-11-08-1720)
- `17abe0030` docs(jjtl): SPEC, the megamodel reads the included models (P-2026-11-08-1720)
- `a6e01bcf2` docs: prompt for the undo below a tab open discovery (P-2026-11-08-1719)
- `7c172384a` feat(megamodel): vertical tracks in a gap, short included pill (P-2026-11-08-1612)
- `295c5429b` feat(megamodel): one input edge per included model of a run (P-2026-11-08-1612)
- `c66b4972c` docs: add prompt P-2026-11-08-1720, close the megamodel included edges lane
- `04d739dd4` docs(dcn): L4.7 closure, visual check passed (P-2026-11-08-1652)
- `722a38972` docs(dcn): L4.7 log entry and Status (P-2026-11-08-1652)
- `11f6f1c0b` test(dcn): run probe checks no defects line, initial state (P-2026-11-08-1652)
- `de1ff2fb8` test(dcn): drone fixture fills every empty slot (P-2026-11-08-1652)
- `149b2cdcf` docs(dcn): prompt P-2026-11-08-1652
- `956990177` docs(dcn): L4.6 closure, visual check passed (P-2026-11-08-1606)
- `2df3c9a32` docs(dcn): R-DCN-25..28, slice 5 rendering, snapshot and coherence watches
- and 12 more: `git log --oneline f081ad4f2..3c5c56bf4`

Measured by `lane-run merge` at 2026-11-08 19:26, trunk at `3c5c56bf4`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 21c46e67a`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 6 on the branch side, 49 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only f081ad4f2 21c46e67a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_1626_prompt_textual_c2h_index.md` (eseguito 2026-11-08 · lane full · 09e60421f · gates green (typecheck 0, build, check:docs, vitest 15441 passed with the 3 baseline import reds, smoke GREEN) · probe 29/29 on 3549, crops in ~/.jjodel-lanes/P-2026-11-08-1626/ · verifica visiva: GO di Alfonso in attesa).
- `git worktree list`: `textual-c2h-index` in `/Users/alfonso/jjodel-w-textc2h`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-1926/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `21c46e67a` is the tip of `textual-c2h-index`; the prompt files of the branch read `Status: eseguito` at `21c46e67a`; `git worktree list` shows `textual-c2h-index` only in `/Users/alfonso/jjodel-w-textc2h`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 21c46e67a` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only f081ad4f2 21c46e67a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f081ad4f2 alfonso-frontend-jjtl` with `git diff --name-only f081ad4f2 21c46e67a` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-35` (trunk), `R-DCN-25` (trunk), `R-DCN-26` (trunk), `R-DCN-27` (trunk), `R-DCN-28` (trunk); control: `- **R-DCN-29**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2h, index on unnamed homonyms of IR chips and default view (P-2026-11-08-1626)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: undo: an M2 tab open writes a layout entry of its own` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: undo: a vertex-only populate merges into the entry below` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: tabs: the graph rebuild guard of ModelTab is dead` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: sync: the v2-flow graph id is written twice in root graphs` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(undo): a graph-only delta writes no undo entry (P-2026-11-08-1800)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: undo-tab-graphs-b into alfonso-frontend-jjtl (P-2026-11-08-1858)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(jjscript): settle waits for in-flight dispatches (P-2026-11-08-1759)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: jjscript-settle-inflight into alfonso-frontend-jjtl (P-2026-11-08-1912)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: DCN Simulation panel polish, findings of the L4.5 visual check (P-2026-11-08-1606)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone fixture fills the empty slots, exports regenerated (P-2026-11-08-1652)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-l47 into alfonso-frontend-jjtl (P-2026-11-08-1757)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-08 — ticket: lane-run merge template: rollback reset names the commit before the prompt commit` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — ticket: two conformsTo pills touch model nodes in the megamodel` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(megamodel): an input edge per included model, tracks in a gap (P-2026-11-08-1720)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-megamodel-included into alfonso-frontend-jjtl (P-2026-11-08-1842)` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-11-08 — ticket: Refactoring finds no M1 target on the multi-tab demo project` once (trunk).
4. `git merge --no-ff --no-commit 21c46e67a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-c2h-index into alfonso-frontend-jjtl (P-2026-11-08-1926)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `21c46e67a` in `/Users/alfonso/jjodel-w-textc2h`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textc2h`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 3c5c56bf4` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 3c5c56bf4 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-c2h-index merge (P-2026-11-08-1926)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textc2h`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
