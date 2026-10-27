# Prompt: merge sim-io-board-skins into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-2327
Chat: C-2026-10-03-1610
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-03 · lane merge · 18926660a · verifica visiva passata 2026-10-03 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-2327 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `48eec06d5`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-io-board-skins` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c0cb7551d`, in the shape of `843b2fa6b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7a249ef87`. The branch carries, on top of the base, 13 commits:

- `c0cb7551d` docs: I/O board Lane 2 closure, Status and inbox entry (P-2026-10-03-2000)
- `734294d19` test(sim): the board's faces, its press and the skin prefs (P-2026-10-03-2000)
- `8c3a0e561` feat(sim): the I/O board, its two skins and the panel wiring (P-2026-10-03-2000)
- `ef0d9df9a` docs: add prompt P-2026-10-03-2000
- `11b4df6ce` docs: I/O board Lane 1 closure, R-SIM-116..121 (P-2026-10-03-1845)
- `2b3ea44e9` fix(sim): name what checkGuard's fold lacks at the model (P-2026-10-03-1845)
- `6b2a1f53c` probe: I/O board Lane 1, the demo scenes and the editor harness (P-2026-10-03-1845)
- `f03462c33` test(sim): the I/O board's codec, outputs, resolution and seams (P-2026-10-03-1845)
- `879b591ef` feat(sim): the I/O board's model and editor, Lane 1 (P-2026-10-03-1845)
- `b48a82929` docs: Status flip and log entry for the I/O board discovery (P-2026-10-03-1845)
- `bf8ed5b78` docs: discovery of the simulator's I/O board (P-2026-10-03-1845)
- `ba0668d80` probe: I/O board outputs, record key and round trip (P-2026-10-03-1845)
- `bb20f1a12` docs: add prompt P-2026-10-03-1845

The trunk carries, since the base, 52 commits:

- `48eec06d5` docs: checkpoint section of the derived notations chat (2026-10-03)
- `106aae181` docs: Status flip and log entry for the derived-notations-edges merge (P-2026-10-03-1901)
- `843b2fa6b` merge: derived-notations-edges into alfonso-frontend-jjtl (P-2026-10-03-1901)
- `67fa607de` docs: add prompt P-2026-10-03-1901, merge derived-notations-edges into alfonso-frontend-jjtl
- `4abc9bf24` chore(harness): add jdirocco to the auto-intake allowlist (RC-41)
- `925dd79c4` docs: add prompt P-2026-10-03-1853, merge derived-notations-edges into alfonso-frontend-jjtl
- `30b4acc4c` docs: Status flip, log entry and R-VP-54..57 (P-2026-10-03-1304)
- `e2aa28207` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `6ea0b0b48` docs: RC-40, the shadow pipeline of the issue-driven lanes is switched on
- `fe5044904` docs: Status flip and log entry for the auto-intake merge (P-2026-10-03-1840)
- `ef5cb6a6f` merge: auto-intake into alfonso-frontend-jjtl (P-2026-10-03-1840)
- `49ea74e6f` docs: add prompt P-2026-10-03-1840, merge auto-intake into alfonso-frontend-jjtl
- `c5b8279d8` docs: Status flip, log entry and report addendum, auto-intake (P-2026-10-03-1705)
- `44f67b10d` docs: fork and join out of the turn, measured; router open item (P-2026-10-03-1304)
- `f9829587f` probe: a Flowchart pane on DemoFlowB (P-2026-10-03-1304)
- `5ac537e8e` fix(derive): fork and join stay out of the bar turn (P-2026-10-03-1304)
- `630d82e19` feat(harness): auto-intake core for issue-driven lanes (P-2026-10-03-1705)
- `d0fe030cc` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `c5bb487a8` docs: discovery on auto-intake (P-2026-10-03-1705)
- `8d2ff7f1f` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `b3453a89d` docs: Q3 implemented, measured, and the cost at rest (P-2026-10-03-1304)
- `c8285f5cf` probe: the turned bar, its ink, hit, ring and drag (P-2026-10-03-1304)
- `f4d768817` feat(derive): the bars in a square box with a thickness (P-2026-10-03-1304)
- `7d7d8e23d` feat(elk): Auto layout lays a turned bar out as drawn (P-2026-10-03-1304)
- `2d967f267` feat(ir): a bar with a thickness turns by its neighbours (P-2026-10-03-1304)
- `4bd9aa66f` docs: LIR addendum, the bar orientation implementation (P-2026-10-03-1304)
- `e3f5ba9d2` probe: bar orientation prototype, offline (P-2026-10-03-1304)
- `3c2645020` docs: Q3 bar orientation design and its Layer Impact Report (P-2026-10-03-1304)
- `534698e2f` probe: labels an edge crosses, and the transition labels (P-2026-10-03-1304)
- `3d4eefe06` feat(derive): Statechart transitions read event [guard] (P-2026-10-03-1304)
- `567423cd6` fix(derive): classic Petri arcs on the orthogonal router (P-2026-10-03-1304)
- `55643d7c7` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `1127b2903` feat(editor-v2): VertexViewIR.visible; Statechart draws no event boxes (P-2026-10-03-1304)
- `c6e735672` probe: drawn nodes, event boxes and canvas height in the acceptance line (P-2026-10-03-1304)
- `1de7c1fcc` docs: Layer Impact Report, VertexViewIR.visible (P-2026-10-03-1304)
- `dde52ed6d` probe: bar handle sides and diamond ends in the acceptance line (P-2026-10-03-1304)
- `d914d540c` fix(editor-v2): bars take long sides, diamonds one end per vertex (P-2026-10-03-1304)
- `1f60fd7d8` docs: Layer Impact Report, the per-form side rule of an edge end (P-2026-10-03-1304)
- `d43083244` docs: LIR addendum, the name centred when no row is left (P-2026-10-03-1304)
- `e7c0761cc` fix(editor-v2): Statechart hides compartment rows with no value (P-2026-10-03-1304)
- and 12 more: `git log --oneline 7a249ef87..48eec06d5`

Measured by `lane-run merge` at 2026-10-03 23:27, trunk at `48eec06d5`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c0cb7551d`: zero conflicts.
- Files changed since the base: 29 on the branch side, 60 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 7a249ef87 c0cb7551d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1845_prompt_sim_io_board_discovery.md` (eseguito 2026-10-03 · lane sim-io-board · discovery, then Phase 2 Lane 1 · probe ba0668d80 (frontend/scripts/probe/io-board-outputs.ts, DemoESM on 3079, ALL GREEN) · report bf8ed5b78 docs/discovery/discovery_2026-10-03_sim_io_board.md, measured on bb20f1a12 · hard-stop, ten decisions taken unattended and one awaiting Alfonso (the MODELS demo) in §0, one question with Recommended, two sequential Phase 2 lanes in §8 · Phase 2 Lane 1 sim-io-board-model on the chat's GO (decisions 1-6 and question 1 adopted): feat 879b591ef, test f03462c33, fix 2b3ea44e9, probe 6b2a1f53c; rows R-SIM-116..121 (116 and 118 verified by an RC-27 agent); typecheck 14, the §17 set; vitest 7077/7077 in 273 files, the 9 known suites red at import; build exit 0, chunk-size warning only; mutation bench 58/58; demo scenes byte-identical to the base (34 rows); editor harness probe on 3079 12/12, crops light and dark in ~/.jjodel-lanes/P-2026-10-03-1845/ · Lane 2 sim-io-board-skins not started · non fuso: merging the board, Lane 1 included, waits for Alfonso), `claude_2026-10-03_2000_prompt_sim_io_board_skins.md` (eseguito 2026-10-03 · lane sim-io-board-skins · feat 8c3a0e561, test 734294d19 · the card `SimBoard` lives in simBoardDevices.tsx, not SimBoard.tsx (beside Lane 1's simBoard.ts the name differs only in case; on this disk ./SimBoard resolves to simBoard.ts, tsc TS1149) · typecheck 14, the §17 set; vitest 7106/7106 in 283 files, the 9 known suites red at import; build exit 0, chunk-size warning only; mutation bench simBoardFace.ts 36/36, simViewerPrefs.ts 2/2 · lane probe on 3081 (frontend/scripts/smoke/_tmp_ioskins_probe.ts, gitignored): board 50/50, ten presses from the board equal to the hand run, Variants A and B, «Show bindings» on and off, a viewed step, the two cards never together; the four demo scenes equal to the base but for the header icon (0 differing paths, Step's top 873, inspector 372/400 × 442); crops light and dark in ~/.jjodel-lanes/P-2026-10-03-2000/ · hard-stop for the chat's visual check (RC-23) · non fuso: the merge waits for Alfonso).
- `git worktree list`: `sim-io-board-skins` in `/Users/alfonso/jjodel-w-ioskins`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** `lane-run merge --direct` fell back:

- the tree is not clean (`git status --porcelain`)

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c0cb7551d` is the tip of `sim-io-board-skins`; the prompt files of the branch read `Status: eseguito` at `c0cb7551d`; `git worktree list` shows `sim-io-board-skins` only in `/Users/alfonso/jjodel-w-ioskins`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c0cb7551d` (measured above: zero conflicts). `git diff --name-only 7a249ef87 c0cb7551d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7a249ef87 alfonso-frontend-jjtl` with `git diff --name-only 7a249ef87 c0cb7551d` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-116` (branch), `R-SIM-117` (branch), `R-SIM-118` (branch), `R-SIM-119` (branch), `R-SIM-120` (branch), `R-SIM-121` (branch), `RC-40` (trunk), `RC-41` (trunk), `R-VP-54` (trunk), `R-VP-55` (trunk), `R-VP-56` (trunk), `R-VP-57` (trunk); control: `- **R-VP-58**` none.
   - `docs/decisions.md`: the heading `### Decisions 2026-10-03 (evening): the I/O board, Lane 1 (R-SIM-116..121)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — discovery: the simulator's I/O board, R-SIM-110..115 (P-2026-10-03-1845)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — feat: the I/O board's model and editor, Lane 1 (P-2026-10-03-1845)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — feat: the I/O board's two skins and the panel wiring, Lane 2 (P-2026-10-03-2000)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-03 — feat: auto-intake core for issue-driven unattended lanes (P-2026-10-03-1705)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-03 — merge: auto-intake into alfonso-frontend-jjtl (P-2026-10-03-1840)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — feat(derive, editor-v2, elk): derived notations' edges, bars and layout (P-2026-10-03-1304)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — merge: derived-notations-edges into alfonso-frontend-jjtl (P-2026-10-03-1901)` once (trunk).
4. `git merge --no-ff --no-commit c0cb7551d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-io-board-skins into alfonso-frontend-jjtl (P-2026-10-03-2327)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c0cb7551d` in `/Users/alfonso/jjodel-w-ioskins`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 48eec06d5` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-io-board-skins merge (P-2026-10-03-2327)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ioskins`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
