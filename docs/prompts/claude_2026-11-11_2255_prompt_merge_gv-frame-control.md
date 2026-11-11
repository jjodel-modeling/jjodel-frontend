# Prompt: merge gv-frame-control into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-11-2255
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-11-2255 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `8b796480f`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `gv-frame-control` into the trunk with one merge commit, `--no-ff`, of the explicit sha `ac4fb1dbb`, in the shape of `7397be79f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `1f6829e18`. The branch carries, on top of the base, 3 commits:

- `ac4fb1dbb` docs: close containment frame control, log entry and Status (P-2026-11-11-1110)
- `688331972` feat: expose containment frame (hull/self) in the Structure tab (P-2026-11-11-1110)
- `a9b88ee4d` docs: discovery for the containment frame control (P-2026-11-11-1110)

The trunk carries, since the base, 49 commits:

- `8b796480f` docs(sessioni): checkpoint of the IR view panel coverage front
- `a96dbebe4` docs: Status flip and log entry for the ir-panel-s3 merge (P-2026-11-11-2148)
- `7397be79f` merge: ir-panel-s3 into alfonso-frontend-jjtl (P-2026-11-11-2148)
- `ac160382c` docs: add prompt P-2026-11-11-2148, merge ir-panel-s3 into alfonso-frontend-jjtl
- `e21bb3d52` docs: Status flip and log entry for IR view panel S3 (P-2026-11-11-2140)
- `16639fa43` feat(ir-panel): S3 edge label, placement, waypoints, caption (P-2026-11-11-2140)
- `4f7af17dd` docs(prompts): add IR view panel S3 prompt (P-2026-11-11-2140)
- `99f62d9c8` docs: Status flip and log entry for the ir-panel-s2 merge (P-2026-11-11-2128)
- `7c51baec4` merge: ir-panel-s2 into alfonso-frontend-jjtl (P-2026-11-11-2128)
- `b73664064` docs: add prompt P-2026-11-11-2128, merge ir-panel-s2 into alfonso-frontend-jjtl
- `8c1b5bb48` docs: Status flip and log entry for IR view panel S2 (P-2026-11-11-2120)
- `941649249` feat(ir-panel): rules table on the remaining Conditionals (P-2026-11-11-2120)
- `b54cd4191` docs(prompts): add IR view panel S2 prompt (P-2026-11-11-2120)
- `c5a07acc9` docs: Status flip and log entry for the ir-panel-s1c merge (P-2026-11-11-2109)
- `d520c2923` merge: ir-panel-s1c into alfonso-frontend-jjtl (P-2026-11-11-2109)
- `6eb36b982` docs: add prompt P-2026-11-11-2109, merge ir-panel-s1c into alfonso-frontend-jjtl
- `33c98dcc4` docs: Status flip and log entry for the ir-panel-s1b merge (P-2026-11-11-2101)
- `f33239a6d` merge: ir-panel-s1b into alfonso-frontend-jjtl (P-2026-11-11-2101)
- `e1d233f04` docs: add prompt P-2026-11-11-2101, merge ir-panel-s1b into alfonso-frontend-jjtl
- `c50d9e689` docs: Status flip and log entry for the ir-panel-s1a merge (P-2026-11-11-2054)
- `6ab5d35bb` merge: ir-panel-s1a into alfonso-frontend-jjtl (P-2026-11-11-2054)
- `c91824d7a` docs: add prompt P-2026-11-11-2054, merge ir-panel-s1a into alfonso-frontend-jjtl
- `3c406f850` docs: Status flip and log entry for IR view panel S1a (P-2026-11-11-2035)
- `043b9cc02` feat(ir-panel): S1a vertex visible, entry, bar, exclude, literal style (P-2026-11-11-2035)
- `18397b4d0` docs: Status flip and log entry for IR view panel S1b (P-2026-11-11-2036)
- `2516db6ac` docs(log): close IR view panel S1c text style controls (P-2026-11-11-2037)
- `5d9cc9ea6` feat(ir-panel): edge curve, label template, label style (P-2026-11-11-2036)
- `f4c06dcc2` feat(ir-panel): letter spacing and case rows in TextStyleEditor (P-2026-11-11-2037)
- `6b02047e1` docs(prompts): add IR view panel S1c prompt (P-2026-11-11-2037)
- `6d2872085` docs(prompts): add IR view panel S1b prompt (P-2026-11-11-2036)
- `46cd9eb33` docs(prompts): add IR view panel S1a prompt (P-2026-11-11-2035)
- `dc2126f5d` docs: Status flip and log entry for the ir-panel-s0 merge (P-2026-11-11-2028)
- `919c9e2e0` merge: ir-panel-s0 into alfonso-frontend-jjtl (P-2026-11-11-2028)
- `f62fdce2c` docs: add prompt P-2026-11-11-2028, merge ir-panel-s0 into alfonso-frontend-jjtl
- `8de50544e` docs(log): close IR view panel S0 data-loss fix (P-2026-11-11-2025)
- `999ea5d5a` fix(authoring): keep persisted literal style and conditional radius (P-2026-11-11-2025)
- `191a97892` docs(harness): ticket #856, handoff seal refuses suffixed headings
- `3767555cd` docs(prompts): add IR view panel S0 data-loss prompt (P-2026-11-11-2025)
- `6c77a7bce` docs(decisions): register R-IPC-1..11, IR view panel coverage (P-2026-11-11-1925)
- `45560ed15` docs(log): close IR view panel coverage discovery (P-2026-11-11-1925)
- and 9 more: `git log --oneline 1f6829e18..8b796480f`

Measured by `lane-run merge` at 2026-11-11 22:55, trunk at `8b796480f`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ac4fb1dbb`: zero conflicts.
- Files changed since the base: 7 on the branch side, 50 on the trunk side; on both sides: none.
- `git diff --name-only 1f6829e18 ac4fb1dbb -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `gv-frame-control` in `/Users/alfonso/jjodel-w-gvframe`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-11-2255/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `ac4fb1dbb` is the tip of `gv-frame-control`; the prompt files of the branch read `Status: eseguito` at `ac4fb1dbb`; `git worktree list` shows `gv-frame-control` only in `/Users/alfonso/jjodel-w-gvframe`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ac4fb1dbb` (measured above: zero conflicts). `git diff --name-only 1f6829e18 ac4fb1dbb -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 1f6829e18 alfonso-frontend-jjtl` with `git diff --name-only 1f6829e18 ac4fb1dbb` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-IPC-1` (trunk), `R-IPC-2` (trunk), `R-IPC-3` (trunk), `R-IPC-4` (trunk), `R-IPC-5` (trunk), `R-IPC-6` (trunk), `R-IPC-7` (trunk), `R-IPC-8` (trunk), `R-IPC-9` (trunk), `R-IPC-10` (trunk), `R-IPC-11` (trunk); control: `- **R-IPC-12**` none.
   - `docs/log-inbox/graphvertex.md`: the heading `## 2026-11-11 — feat(editor-v2): a «Frame» control for containment.layout.frame, hull or self (P-2026-11-11-1110)` once (branch).
   - `docs/decisions.md`: the heading `## R-IPC: IR coverage of the view properties panel (decisions 2026-11-11)` once (trunk).
   - `docs/log-inbox/harness-objectives-continuation.md`: the heading `## 2026-11-11 — docs: scope objective tracking and fresh-session continuation` once (trunk).
   - `docs/log-inbox/harness-objectives-continuation.md`: the heading `## 2026-11-11 — feat(harness): explicit objectives and bounded fresh continuation` once (trunk).
   - `docs/log-inbox/harness-objectives-continuation.md`: the heading `## 2026-11-11 — merge: integrate harness objectives and reload the local board` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-11 — ticket: handoff seal refuses section headings with a suffix` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — discovery: IR coverage of the view properties panel (P-2026-11-11-1925)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — fix: IR view panel S0, literal style and gV corner radius data loss (P-2026-11-11-2025)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s0 into alfonso-frontend-jjtl (P-2026-11-11-2028)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S1a, vertex visible, entry, bar thickness, exclude, literal style (P-2026-11-11-2035)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s1a into alfonso-frontend-jjtl (P-2026-11-11-2054)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S1b, edge curve, label template, label style (P-2026-11-11-2036)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s1b into alfonso-frontend-jjtl (P-2026-11-11-2101)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S1c, letter spacing and case in TextStyleEditor (P-2026-11-11-2037)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s1c into alfonso-frontend-jjtl (P-2026-11-11-2109)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S2, rules table on the remaining Conditional controls (P-2026-11-11-2120)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s2 into alfonso-frontend-jjtl (P-2026-11-11-2128)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — feat: IR view panel S3, edge label, placement, waypoints, caption (P-2026-11-11-2140)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-11 — merge: ir-panel-s3 into alfonso-frontend-jjtl (P-2026-11-11-2148)` once (trunk).
4. `git merge --no-ff --no-commit ac4fb1dbb`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: gv-frame-control into alfonso-frontend-jjtl (P-2026-11-11-2255)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `ac4fb1dbb` in `/Users/alfonso/jjodel-w-gvframe`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-gvframe`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8b796480f` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 8b796480f HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/graphvertex.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the gv-frame-control merge (P-2026-11-11-2255)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-gvframe`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
