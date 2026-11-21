# Prompt: merge editor-chrome-parity into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-20-2257
Chat: C-2026-11-20-1610
Request: https://claude.ai/code/session_01DQt9R3rFJe5AMqrdonBxgx (merge of editor-chrome-parity launched by chat C-2026-11-20-1610)
Lane: full (merge; 2 conflicts: `docs/decisions.md`, `docs/log-inbox/multi-tab.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-20-2257 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4d062e265`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `editor-chrome-parity` into the trunk with one merge commit, `--no-ff`, of the explicit sha `0d3eba646`, in the shape of `e58a5d187` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d4ddede1d`. The branch carries, on top of the base, 15 commits:

- `0d3eba646` docs: close P-2026-11-20-1610, editor chrome parity
- `331035777` docs(editor-v2): EditorBar comment names the rail reserve (P-2026-11-20-1610)
- `84a042f64` docs: log entry, bar uniformity (P-2026-11-20-1610)
- `edf889c00` docs: amend R-MT-34 and report 8.4, bar uniformity (P-2026-11-20-1610)
- `e36a00f7a` fix(editor-v2): one control style for both bars, no identity cell (P-2026-11-20-1610)
- `be27b4d6c` docs: log entry, icon-only switch (P-2026-11-20-1610)
- `a4e38f8f3` docs: amend R-MT-34/35, icon-only switch (P-2026-11-20-1610)
- `4ec5f6196` fix(editor-v2): icon-only switch, Split Right never scrolls out (P-2026-11-20-1610)
- `4208b0c34` docs: log entry, editor chrome parity Phase 2 (P-2026-11-20-1610)
- `b3797f460` docs: R-MT-33..36 and report addendum, editor chrome parity (P-2026-11-20-1610)
- `4ec528ab8` fix(editor-v2): switch labels give way first in a narrow bar (P-2026-11-20-1610)
- `f8f03322b` feat(editor-v2): shared editor bar and Diagram|Text switch (P-2026-11-20-1610)
- `fc0d8987b` style(dock): one active-tab style for every group and kind (P-2026-11-20-1610)
- `b49985ed9` docs: log entry, editor chrome parity stopped at Phase 1 (P-2026-11-20-1610)
- `779ea395e` docs: discovery report, editor chrome parity (P-2026-11-20-1610)

The trunk carries, since the base, 26 commits:

- `4d062e265` docs: file right rail toggle prompt under multi-tab front (P-2026-11-20-2250)
- `23001c648` docs: add right rail toggle prompt (P-2026-11-20-2250)
- `96c2e612b` docs: Status flip and log entry for the multi-tab-dashboard merge (P-2026-11-20-2159)
- `e58a5d187` merge: multi-tab-dashboard into alfonso-frontend-jjtl (P-2026-11-20-2159)
- `53e02d3b0` docs: add prompt P-2026-11-20-2159, merge multi-tab-dashboard into alfonso-frontend-jjtl
- `27b2de300` docs: Status flip and log entry for the full-screen dashboard (P-2026-11-20-1632)
- `275f9ba1d` docs: R-MT-34 status bar in summary mode, log entry (P-2026-11-20-1632)
- `963973425` fix(multi-tab): status bar in project mode over the dashboard (P-2026-11-20-1632)
- `1d8542331` docs: R-MT-34 and log entry for the full-screen dashboard (P-2026-11-20-1632)
- `37a3dc87f` feat(multi-tab): project dashboard full screen over the groups (P-2026-11-20-1632)
- `26a879de5` docs: Status flip and log entry for the multi-tab-readers merge (P-2026-11-20-1630)
- `04f913cba` merge: multi-tab-readers into alfonso-frontend-jjtl (P-2026-11-20-1630)
- `d88324bd3` docs: add prompt P-2026-11-20-1632, project dashboard full screen
- `a2c6c79ab` docs: add prompt P-2026-11-20-1630, merge multi-tab-readers into alfonso-frontend-jjtl
- `d2628b041` docs: Status flip and log entry for the multi-tab-persistence merge (P-2026-11-20-1611)
- `4d390832f` merge: multi-tab-persistence into alfonso-frontend-jjtl (P-2026-11-20-1611)
- `5de522975` docs: add prompt P-2026-11-20-1611, merge multi-tab-persistence into alfonso-frontend-jjtl
- `7a10ea867` docs: close P-2026-11-19-2328, editor groups persist per project
- `b82fbe793` docs: Status flip of P-2026-11-19-2336 after the visual GO
- `7ea61dece` docs: close lane 6, remaining active-tab readers (P-2026-11-19-2336)
- `8f6d70f46` fix(multi-tab): last children[0] readers go through the active group (P-2026-11-19-2336)
- `93eebb0f5` docs: R-MT-33, editor groups persist per user and project (P-2026-11-19-2328)
- `5099d9d14` feat(multi-tab): editor groups persist per user and project (P-2026-11-19-2328)
- `b22eab871` docs: add prompt P-2026-11-19-2336, remaining active-tab readers
- `6ba59e56f` feat(multi-tab): editor groups record, pure (P-2026-11-19-2328)
- `101a0ad66` docs: add prompt P-2026-11-19-2328, editor groups persistence

Measured by `lane-run merge` at 2026-11-20 22:57, trunk at `4d062e265`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 0d3eba646`: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/multi-tab.md`.
- Files changed since the base: 12 on the branch side, 27 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/multi-tab.md`.
- `git diff --name-only d4ddede1d 0d3eba646 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `editor-chrome-parity` in `/Users/alfonso/jjodel-w-edchrome`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `0d3eba646` is the tip of `editor-chrome-parity`; the prompt files of the branch read `Status: eseguito` at `0d3eba646`; `git worktree list` shows `editor-chrome-parity` only in `/Users/alfonso/jjodel-w-edchrome`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 0d3eba646` (measured above: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/multi-tab.md`). `git diff --name-only d4ddede1d 0d3eba646 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d4ddede1d alfonso-frontend-jjtl` with `git diff --name-only d4ddede1d 0d3eba646` (measured above: `docs/decisions.md`, `docs/log-inbox/multi-tab.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-MT-33` (both sides), `R-MT-34` (both sides), `R-MT-35` (branch), `R-MT-36` (branch); control: `- **R-MT-37**` none.
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — discovery: editor chrome parity, stopped before Phase 2 (multi-tab lane edchrome)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — feat: editor chrome parity, narrowed Phase 2 (multi-tab lane edchrome)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — fix: icon-only Diagram | Text, Split Right never scrolls out (multi-tab lane edchrome)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — fix: one control style for both bars, identity cell removed (multi-tab lane edchrome)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — close: editor chrome parity, visual GO (multi-tab lane edchrome)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — feat: editor groups persist per user and project (multi-tab lane 3, G7)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — ticket: G7 residues for the width lane` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — merge: multi-tab-persistence into alfonso-frontend-jjtl (P-2026-11-20-1611)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — fix: the last children[0] readers go through the active group (multi-tab lane 6)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — merge: multi-tab-readers into alfonso-frontend-jjtl (P-2026-11-20-1630)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — feat: the project dashboard opens full screen over the editor groups` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — ticket: status bar shows the last model over the project dashboard` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — fix: status bar in project mode over the project dashboard` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — close: project dashboard full screen, visual GO` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — merge: multi-tab-dashboard into alfonso-frontend-jjtl (P-2026-11-20-2159)` once (trunk).
4. `git merge --no-ff --no-commit 0d3eba646`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: editor-chrome-parity into alfonso-frontend-jjtl (P-2026-11-20-2257)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `0d3eba646` in `/Users/alfonso/jjodel-w-edchrome`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-edchrome`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4d062e265` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 4d062e265 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the editor-chrome-parity merge (P-2026-11-20-2257)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-edchrome`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
