# Prompt: merge health-disc into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-19-0907
Chat: C-2026-10-18-2220
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-19 · lane merge · 19e64f188 · verifica visiva passata 2026-10-19 (visual check not needed: docs and discovery data only, nothing under frontend/src)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-19-0907 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `0042621cd`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `health-disc` into the trunk with one merge commit, `--no-ff`, of the explicit sha `df5a9eb0a`, in the shape of `590063d13` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `e49ec777e`. The branch carries, on top of the base, 3 commits:

- `df5a9eb0a` docs: harness health retrospective report, catalogue, closure (P-2026-10-18-2220)
- `e1bc1ace7` docs: harness health retrospective script and its data (P-2026-10-18-2220)
- `10ac68007` docs: harness incidents frozen before the health backtest (P-2026-10-18-2220)

The trunk carries, since the base, 24 commits:

- `0042621cd` docs: R-LIB-10 (3.2 freeze date dropped, example viewpoints) and prompt P-2026-10-19-0300
- `590063d13` merge: menubar-disc into alfonso-frontend-jjtl (P-2026-10-19-0150)
- `14845438b` docs: add prompt P-2026-10-19-0150, merge menubar-disc into alfonso-frontend-jjtl
- `45a226b7e` docs: close lane monitor S5, login item and restart (P-2026-10-19-0129)
- `c3775d3b3` feat(lane-monitor-app): start at login and restart the board (P-2026-10-19-0129)
- `a02fe4b74` docs: add prompt P-2026-10-19-0129 (lane monitor S5, login item and restart)
- `75a092150` docs: close lane monitor S4, links and shortcut (P-2026-10-19-0054)
- `e76383e8d` feat(lane-monitor-app): jjodel-lanes:// links and the global shortcut (P-2026-10-19-0054)
- `6b5b39996` docs: add prompt P-2026-10-19-0054 (lane monitor S4, deep links and shortcut)
- `fcf0838df` docs: close lane monitor S3, notifications (P-2026-10-19-0033)
- `fc08fe4ea` feat(lane-monitor-app): notify when a lane starts waiting (P-2026-10-19-0033)
- `5682e04ae` docs: add prompt P-2026-10-19-0033 (lane monitor S3, notifications)
- `ebd576377` docs: close lane monitor S2, Tauri app shell (P-2026-10-19-0000)
- `c5eadb816` feat(lane-monitor-app): Tauri 2 menu bar shell, tray count and popover (P-2026-10-19-0000)
- `e8f98305a` docs: add prompt P-2026-10-19-0000 (lane monitor S2, Tauri app shell)
- `ce0b5a37a` docs: close lane monitor S1, board attention routes (P-2026-10-18-2320)
- `4e81cf36e` feat(lane-board): /api/attention and /l/<id> for the menu bar app (P-2026-10-18-2320)
- `5ad105d44` docs: add prompt P-2026-10-18-2320 (lane monitor S1, board attention routes)
- `f2c178b4f` docs: lane monitor menu bar app discovery, Phase 1 (P-2026-10-18-2255)
- `ad517212d` docs: session checkpoint of C-2026-10-18-0110, S6 step 1 closed
- `1c2f8efa4` docs: add prompt P-2026-10-18-2255 (lane monitor menu bar app, discovery)
- `9e5686feb` docs: add prompt P-2026-10-18-2300 (gallery templates and examples, R-LIB-9)
- `648462bfc` docs: R-LIB-9 (templates and examples) and session checkpoint of C-2026-10-18-0110
- `2a8ef02f3` docs: Status flip and log entry for the context-rules merge (P-2026-10-18-2207)

Measured by `lane-run merge` at 2026-10-19 09:07, trunk at `0042621cd`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl df5a9eb0a`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 15 on the branch side, 39 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only e49ec777e df5a9eb0a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `health-disc` in `/Users/alfonso/jjodel-w-health`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-19-0907/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `df5a9eb0a` is the tip of `health-disc`; the prompt files of the branch read `Status: eseguito` at `df5a9eb0a`; `git worktree list` shows `health-disc` only in `/Users/alfonso/jjodel-w-health`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl df5a9eb0a` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only e49ec777e df5a9eb0a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only e49ec777e alfonso-frontend-jjtl` with `git diff --name-only e49ec777e df5a9eb0a` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-LIB-9` (trunk), `R-LIB-10` (trunk); control: `- **R-LIB-11**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — docs(harness): health signals catalogue and retrospective backtest, Phase 1 (P-2026-10-18-2220)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: context-rules into alfonso-frontend-jjtl (P-2026-10-18-2207)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: the merge template names the wrong pre-merge tip for the check:addonly reset` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — discovery: lane monitor as a menu bar app, Phase 1 (P-2026-10-18-2255)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(lane-board): /api/attention and /l/<id> for the menu bar app (P-2026-10-18-2320)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: the #lane= scroll runs once and may be undone by a later render` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): Tauri 2 menu bar shell, tray count and popover (P-2026-10-19-0000)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): notify when a lane starts waiting (P-2026-10-19-0033)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): jjodel-lanes:// links and the global shortcut (P-2026-10-19-0054)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): start at login and restart the board (P-2026-10-19-0129)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — ticket: the app reads a pre-S1 board as bad JSON, not «too old»` once (trunk).
4. `git merge --no-ff --no-commit df5a9eb0a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: health-disc into alfonso-frontend-jjtl (P-2026-10-19-0907)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `df5a9eb0a` in `/Users/alfonso/jjodel-w-health`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-health`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 0042621cd` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 0042621cd HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the health-disc merge (P-2026-10-19-0907)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-health`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
