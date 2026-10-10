# Prompt: board-kindof-merges takes the trunk before its own merge

Prompt-ID: P-2026-10-10-1851
Chat: —
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-kindof`, branch `board-kindof-merges`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-kindof`, branch `board-kindof-merges`, `git log -1` is the commit that adds this file (its parent `f4965b72f`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1851 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `c315460b0` into `board-kindof-merges` with one merge commit, `--no-ff`, in the shape of `45ad56bd6` (the last merge commit on `board-kindof-merges`; read its body first). Merge base `45ad56bd6`. The trunk brings, since the base, 45 commits:

- `c315460b0` docs: Status flip and log entry for the timeline-newest-first merge (P-2026-10-10-1843)
- `31706d940` merge: timeline-newest-first into alfonso-frontend-jjtl (P-2026-10-10-1843)
- `06bd25bea` docs: Status flip and log entry for the stale-m1-edge merge (P-2026-10-10-1809)
- `0613c8c2b` docs: add prompt P-2026-10-10-1843, merge timeline-newest-first into alfonso-frontend-jjtl
- `5e218863b` docs: Status flip and log entry for the board-chat-links merge (P-2026-10-10-1836)
- `6abb5ea11` docs(decisions): RC-45 part 2 uses the check:docs sentinel for Corregge (P-2026-10-10-1757)
- `d77cd0c4e` merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)
- `0a6081439` docs: add prompt P-2026-10-10-1836, merge board-chat-links into alfonso-frontend-jjtl
- `ffd37e8af` docs: Status flip and log entry for the lane-board-columns merge (P-2026-10-10-1823)
- `fd59eefaa` merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)
- `21d8dc2e7` docs: Status flip for the JjEL lexer own-key lane (P-2026-10-10-1756)
- `bda3f8820` docs: Status flip and log entry for the jjel-lexer-own-keys merge (P-2026-10-10-1817)
- `fe34f0936` docs: add prompt P-2026-10-10-1823, merge lane-board-columns into alfonso-frontend-jjtl
- `6ae97ac36` docs: Status flip for the lane board chat links lane (P-2026-10-10-1816)
- `f08ffade3` docs: log entry for the lane board chat links (P-2026-10-10-1816)
- `226fce084` feat(harness): lane board links each lane to its chat
- `0d2ad8f11` merge: jjel-lexer-own-keys into alfonso-frontend-jjtl (P-2026-10-10-1817)
- `e1b6ba715` docs: Status flip and log entry for the codegen-runner merge (P-2026-10-10-1802)
- `83e055d7e` docs: add prompt P-2026-10-10-1817, merge jjel-lexer-own-keys into alfonso-frontend-jjtl
- `963d9290a` docs(prompts): lane board chat links (P-2026-10-10-1816)
- `834152b68` merge: stale-m1-edge into alfonso-frontend-jjtl (P-2026-10-10-1809)
- `18b072088` docs: add prompt P-2026-10-10-1809, merge stale-m1-edge into alfonso-frontend-jjtl
- `bf21aa74f` docs(prompts): Status flip, P-2026-10-10-1600
- `c28297230` docs: ticket, lane-run resume cannot carry the critical-zone go-ahead
- `f02a57d59` merge: codegen-runner into alfonso-frontend-jjtl (P-2026-10-10-1802)
- `e84cf1d16` docs: Status flip and log entry for the sim-event-attrs merge (P-2026-10-10-1753)
- `857c72139` docs: add prompt P-2026-10-10-1802, merge codegen-runner into alfonso-frontend-jjtl
- `b1b1599ba` docs: log-inbox entry and JjScript ticket for the lexer own-key lane (P-2026-10-10-1756)
- `455792c69` fix(jjel): lexer looks up OCL messages and keywords by own key (P-2026-10-10-1756)
- `d6448ef04` docs: stale M1 edge F1 measurements, addendum, LIR 4, inbox (P-2026-10-10-1600)
- `694e5dbb5` docs: Status flip for the timeline newest-first lane (P-2026-10-10-1744)
- `3339c11ee` docs: Status flip for the lane board fixed columns lane (P-2026-10-10-1742)
- `82b4b71c6` chore(probe): stale M1 edge acceptance checks for F1 (P-2026-10-10-1600)
- `ba224bbfb` docs: log entry for the lane board fixed column widths (P-2026-10-10-1742)
- `c04ddd39b` docs: log entry for the lane board timeline newest-first lane
- `0ce6f57bb` feat(harness): lane board timeline lists the newest lanes first
- `034811a1f` feat(harness): lane board tables with fixed column widths
- `ad08a8519` fix(sync): a stale M1 reference edge leaves graph.subElements (P-2026-10-10-1600)
- `a6f6ea654` docs(prompts): lane board timeline newest first (P-2026-10-10-1744)
- `74f57e051` docs(prompts): lane board fixed column widths (P-2026-10-10-1742)
- and 5 more: `git log --oneline 45ad56bd6..c315460b0`

This branch brings, 4 commits:

- `f4965b72f` docs: Status flip for the kindOf two-merge lane (P-2026-10-10-1803)
- `e5b980bf4` docs(harness): close lane board kindOf two-merge lanes (P-2026-10-10-1803)
- `a77675e5e` fix(harness): lane board counts a two-merge lane as a merge
- `885ada6f8` docs(prompts): lane board kindOf two-merge lanes (P-2026-10-10-1803)

Measured by `lane-run merge --trunk-into` at 2026-10-10 18:51, trunk at `c315460b0`:

- `git merge-tree --write-tree --name-only board-kindof-merges c315460b0`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 3 on the branch side, 56 on the trunk side; on both sides: `docs/log-inbox/harness.md`, `frontend/scripts/lane-board/lane-board.mjs`.
- `git diff --name-only 45ad56bd6 f4965b72f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_1803_prompt_board_kindof_merges.md` (eseguito 2026-10-10, lane P-2026-10-10-1803 (board-kindof-merges, a77675e5e); no visual check (classification only)).
- `git worktree list`: `board-kindof-merges` in `/Users/alfonso/jjodel-w-kindof`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `c315460b0` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `c315460b0` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only board-kindof-merges c315460b0` (measured above: 1 conflict: `docs/log-inbox/harness.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit c315460b0`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-45` (trunk); control: `- **RC-46**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): lane board counts a two-merge lane as a merge (P-2026-10-10-1803)` once (branch).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — feat(codegen): JavaScript target profile and sandboxed runner (P-2026-10-10-0950)` once (trunk).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — merge: codegen-runner into alfonso-frontend-jjtl (P-2026-10-10-1802)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: `lane-run resume` cannot carry the critical-zone go-ahead` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board tables with fixed column widths (P-2026-10-10-1742)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board links each lane to its chat (P-2026-10-10-1816)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board timeline lists the newest lanes first (P-2026-10-10-1744)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: timeline-newest-first into alfonso-frontend-jjtl (P-2026-10-10-1843)` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — fix: JjEL lexer looks up OCL messages and keywords by own key` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — ticket: JjScript looks up tables and variable maps keyed by source text on plain objects` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — merge: jjel-lexer-own-keys into alfonso-frontend-jjtl (P-2026-10-10-1817)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1753)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — docs(discovery): stale M1 reference edge, root cause and fix plan (P-2026-10-10-1600)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — ticket: a bare DeleteElementAction leaves the edge id in its vertices' edgesOut and edgesIn` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — fix(sync): a stale M1 reference edge leaves graph.subElements, F1 (P-2026-10-10-1600)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — merge: stale-m1-edge into alfonso-frontend-jjtl (P-2026-10-10-1809)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/harness.md`, `frontend/scripts/lane-board/lane-board.mjs`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: board-kindof-merges takes alfonso-frontend-jjtl (P-2026-10-10-1851)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard f4965b72f` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane board-kindof-merges · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, board-kindof-merges took the trunk (P-2026-10-10-1851)` (P16, RC-17). `Outcome: done`. The merge of `board-kindof-merges` into the trunk gets its own prompt (`lane-run merge board-kindof-merges --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
