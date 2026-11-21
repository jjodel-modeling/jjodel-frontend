# Prompt: merge ui-vsplit into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-21-0235
Chat: C-2026-11-19-2200
Request: https://claude.ai/code/session_01DQt9R6xGnqUtiRzRQbr61k (merge of ui-vsplit launched by chat C-2026-11-19-2200)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-21-0235 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `a8ecb9ef6`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ui-vsplit` into the trunk with one merge commit, `--no-ff`, of the explicit sha `1234fa65e`, in the shape of `1ca31c62c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `bacae8815`. The branch carries, on top of the base, 15 commits:

- `1234fa65e` docs: Status and log entry for the splitter probe after the trunk (P-2026-11-21-0155)
- `eca23597e` fix(dock): split dividers shown when every group holds one tab (P-2026-11-21-0155)
- `5fe23fba6` test(probe): vsplit probe follows the dashboard and the syntax chip (P-2026-11-21-0155)
- `e21898763` docs: D-UI-17 header in the register format (P-2026-11-19-2200)
- `a1e825214` docs: add prompt P-2026-11-21-0155, splitter probe after the trunk merge
- `99b18d7df` merge: alfonso-frontend-jjtl into ui-vsplit (P-2026-11-19-2200)
- `4142a660f` docs: Status and log entry for the splitter knob rework (P-2026-11-19-2200)
- `8ed6dd3ac` docs: P-2026-11-19-2200 rework 2 report addendum and D-UI-17 amended (P-2026-11-19-2200)
- `21644454a` style(ui): splitter knob centred on every seam (P-2026-11-19-2200)
- `e40a4e405` merge: alfonso-frontend-jjtl into ui-vsplit (P-2026-11-19-2200)
- `cbd4e837e` docs: Status flip and log entry for the vertical splitter contract (P-2026-11-19-2200)
- `c0b5c9bdd` docs: P-2026-11-19-2200 Phase 2 report addendum and D-UI-17 (P-2026-11-19-2200)
- `4d9d27a22` style(ui): bespoke vertical splitters adopt the contract (P-2026-11-19-2200)
- `5d81fd6c6` style(ui): one slim vertical splitter contract (P-2026-11-19-2200)
- `cd279111b` docs(discovery): vertical splitters inventory, Phase 1 (P-2026-11-19-2200)

The trunk carries, since the base, 8 commits:

- `a8ecb9ef6` docs: session checkpoint 2026-11-21, per-tab notation and colors merged
- `542f8a436` docs: Status flip and log entry for the per-tab-view-prefs merge (P-2026-11-21-0127)
- `1ca31c62c` merge: per-tab-view-prefs into alfonso-frontend-jjtl (P-2026-11-21-0127)
- `7444d9673` docs: add prompt P-2026-11-21-0127, merge per-tab-view-prefs into alfonso-frontend-jjtl
- `7d8077241` docs: log entry, R-MT-40, Status of per-tab notation and colors (P-2026-11-21-0100)
- `0c342c802` fix(editor-v2): persist notation and colors per tab (P-2026-11-21-0100)
- `bb0ebf6d9` docs: discovery, notation and colors per tab (P-2026-11-21-0100)
- `621d54d61` docs: add per-tab notation and colors prompt (P-2026-11-21-0100)

Measured by `lane-run merge` at 2026-11-21 02:35, trunk at `a8ecb9ef6`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1234fa65e`: zero conflicts.
- Files changed since the base: 18 on the branch side, 10 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only bacae8815 1234fa65e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-21_0155_prompt_vsplit_probe_after_trunk.md` (eseguito 2026-11-21 · lane fast · 5fe23fba6, eca23597e · regression found and fixed in DockManagerStyles.scss (DOVE widened by the chat, RC-25)).
- `git worktree list`: `ui-vsplit` in `/Users/alfonso/jjodel-w-vsplit`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-21-0235/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `1234fa65e` is the tip of `ui-vsplit`; the prompt files of the branch read `Status: eseguito` at `1234fa65e`; `git worktree list` shows `ui-vsplit` only in `/Users/alfonso/jjodel-w-vsplit`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1234fa65e` (measured above: zero conflicts). `git diff --name-only bacae8815 1234fa65e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only bacae8815 alfonso-frontend-jjtl` with `git diff --name-only bacae8815 1234fa65e` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-MT-40` (trunk); control: `- **R-MT-41**` none.
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-20 — style(ui): one slim vertical splitter contract across the platform (P-2026-11-19-2200)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-20 — ticket: contextCeiling hook test reads the lane's JJODEL_LANE_LOG_FROM` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-21 — style(ui): splitter knob centred on every seam, rework 2 (P-2026-11-19-2200)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-21 — ticket: rail tree context menus portalled to body, so Jjodie's dock knob shows whole` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-21 — test(probe): vsplit probe after the trunk merge, dock divider fix (P-2026-11-21-0155)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-21 — fix: notation and colors persisted per tab (P-2026-11-21-0100)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-21 — merge: per-tab-view-prefs into alfonso-frontend-jjtl (P-2026-11-21-0127)` once (trunk).
4. `git merge --no-ff --no-commit 1234fa65e`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ui-vsplit into alfonso-frontend-jjtl (P-2026-11-21-0235)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `1234fa65e` in `/Users/alfonso/jjodel-w-vsplit`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-vsplit`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard a8ecb9ef6` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only a8ecb9ef6 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ui-vsplit merge (P-2026-11-21-0235)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-vsplit`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
