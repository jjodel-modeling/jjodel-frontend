# Prompt: merge sim-state-face into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-0345
Chat: C-2026-10-02-2340
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-0345 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `f564a83d6`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-state-face` into the trunk with one merge commit, `--no-ff`, of the explicit sha `fabcef855`, in the shape of `cd348df03` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `04dd1c7e5`. The branch carries, on top of the base, 12 commits:

- `fabcef855` docs: Status flip and log entry, sim-state-face took the trunk (P-2026-10-03-0304)
- `6edc4b34c` docs: the demo script's §4 reads the State… route (P-2026-10-03-0304)
- `9b5386835` test(ir): the overlay test reads R-SIM-107's σ tags (P-2026-10-03-0304)
- `536e27cf1` merge: sim-state-face takes alfonso-frontend-jjtl (P-2026-10-03-0304)
- `f69751eeb` docs: add prompt P-2026-10-03-0304, sim-state-face takes alfonso-frontend-jjtl
- `820249d0e` docs: Lane C sim-state-face, log entry and Status (P-2026-10-03-0120)
- `d9e344274` docs: the demo script reads the seed in the title only (P-2026-10-03-0120)
- `16539631f` fix(sim): seed in the title only, Watch globals by default (P-2026-10-03-0120)
- `d7ff4f821` fix(sim): the face's kind chips in the dialogs' colours (P-2026-10-03-0120)
- `eb7d54c6b` docs: the demo script reads the state face (P-2026-10-03-0120)
- `6eedc4bf3` feat(sim): the M1 face, run inspector and canvas tags (P-2026-10-03-0120)
- `da8d1b2b3` docs: add prompt P-2026-10-03-0120, Lane C sim-state-face

The trunk carries, since the base, 21 commits:

- `f564a83d6` docs: session checkpoint 2026-10-03 (hidden-tab-loop merge)
- `da2246604` docs: Status flip and log entry for the hidden-tab-loop merge (P-2026-10-03-0308)
- `cd348df03` merge: hidden-tab-loop into alfonso-frontend-jjtl (P-2026-10-03-0308)
- `69265f7fb` docs: add prompt P-2026-10-03-0308, merge hidden-tab-loop into alfonso-frontend-jjtl
- `08f442052` docs(editor-v2): T9 closure, log entry, two tickets, Status (P-2026-10-02-1450)
- `1b40b2a03` merge: alfonso-frontend-jjtl into hidden-tab-loop, second (P-2026-10-02-1450)
- `efccfd70c` docs(editor-v2): T9 smoke addendum, figures from the final runs (P-2026-10-02-1450)
- `5d8379a85` docs(editor-v2): T9 addendum, the scripted interaction smoke (P-2026-10-02-1450)
- `4afbb321a` chore(probe): scripted interaction smoke and before/after compare (P-2026-10-02-1450)
- `69cea0d03` docs(editor-v2): T9 addendum, useTreeLayout effect at :170-194 (P-2026-10-02-1450)
- `fb70f03f2` docs(editor-v2): T9 addendum, the line-jump extension measured (P-2026-10-02-1450)
- `334a7e444` fix(editor-v2): line jumps follow the path registry (P-2026-10-02-1450)
- `91f700102` docs(editor-v2): T9 addendum, the vertex test is at useJjomSync.ts:1391 (P-2026-10-02-1450)
- `010254a66` docs(editor-v2): T9 Phase 2 addendum, results and the line-jump stop (P-2026-10-02-1450)
- `5921a6c06` chore(probe): edge-selection phases and fix B mutations (P-2026-10-02-1450)
- `c7380822c` fix(editor-v2): a sync patch that changes nothing keeps identity (P-2026-10-02-1450)
- `c99cb758b` feat(editor-v2): structural equality and identity-keeping edge merge (P-2026-10-02-1450)
- `ec57a268d` merge: alfonso-frontend-jjtl into hidden-tab-loop (P-2026-10-02-1450)
- `0a2ad8c7a` docs(editor-v2): discovery of the idle render loop, T9 (P-2026-10-02-1450)
- `a114b7bf9` chore(probe): idle render-loop probe for editor tabs (P-2026-10-02-1450)
- `788d3659d` docs: add prompt P-2026-10-02-1450, hidden tab render loop (T9)

Measured by `lane-run merge` at 2026-10-03 03:45, trunk at `f564a83d6`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fabcef855`: zero conflicts.
- Files changed since the base: 12 on the branch side, 13 on the trunk side; on both sides: none.
- `git diff --name-only 04dd1c7e5 fabcef855 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_0120_prompt_sim_state_face.md` (eseguito 2026-10-03 · lane sim-state-face · 6eedc4bf3, eb7d54c6b, d7ff4f821, 16539631f, d9e344274 · the M1 face (Watch, Marking chips, Events above the buttons, one status line under them, «State…»), SimInspector (left 584, bottom 16, 400 wide, clamped 16 px clear of the 202 px MiniMap and under the toolbar; σ, node, trace, a step viewed, Back to live), SimCanvasLayer (Inspect node.[x] switch, globals card, both off) and the node tags; after the chat's visual check (RC-23) two fixes in 16539631f: the seed in the status line's title only, amending R-SIM-104 on the seed (R-SIM-100's place), and Watch the globals by default, an instance's attribute only when pinned, four rows at most; the lane's four choices adopted by the chat as recommended; typecheck 14 (the §17 set), sim suites 978/978, build exit 0, lane probe on 3068 (light, 1600×1000, the four demo exports) 138/138: Step's top 873 from Not started to the last step in all four scenes, the script's readings line for line; crops docs/discovery/harness/_tmp_simface_*.png (gitignored) · GO visivo della chat 2026-10-03 (RC-23) sulle crop fresche, dopo due correzioni chieste sulle prime: status line with step and last step, seed in the title only; Watch at most four rows; panel, Marking chips, Events, inspector with the viewed step, trace, canvas tags and Inspect switch as checked at 02:31 · non fuso), `claude_2026-10-03_0304_prompt_sim-state-face_take_trunk.md` (eseguito 2026-10-03 · lane sim-state-face · 536e27cf1 · verifica visiva passata 2026-10-03 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `sim-state-face` in `/Users/alfonso/jjodel-w-simface`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-0345/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `fabcef855` is the tip of `sim-state-face`; the prompt files of the branch read `Status: eseguito` at `fabcef855`; `git worktree list` shows `sim-state-face` only in `/Users/alfonso/jjodel-w-simface`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fabcef855` (measured above: zero conflicts). `git diff --name-only 04dd1c7e5 fabcef855 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 04dd1c7e5 alfonso-frontend-jjtl` with `git diff --name-only 04dd1c7e5 fabcef855` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — feat: the M1 face, run inspector and canvas tags of the state UI, Lane C (P-2026-10-03-0120)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — merge: sim-state-face takes alfonso-frontend-jjtl (P-2026-10-03-0304)` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-03 — fix(editor-v2): T9, the idle render loop of every editor holding an edge (P-2026-10-02-1450)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-03 — ticket: a selected edge keeps half of T9's loop running until a pane click` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-03 — ticket: adding then deleting a reference leaves a handle slot on its target class` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-03 — merge: hidden-tab-loop into alfonso-frontend-jjtl (P-2026-10-03-0308)` once (trunk).
4. `git merge --no-ff --no-commit fabcef855`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-state-face into alfonso-frontend-jjtl (P-2026-10-03-0345)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `fabcef855` in `/Users/alfonso/jjodel-w-simface`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard f564a83d6` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-state-face merge (P-2026-10-03-0345)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simface`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
