# Prompt: merge jjodie-reserved into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-0023
Chat: C-2026-10-10-0039
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-11 · lane merge · 72762297b · verifica visiva passata 2026-10-11 (Alfonso, smoke on 3001)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-0023 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `dfdef69f1`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjodie-reserved` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e5d95a99c`, in the shape of `0edb5f06b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `571392718`. The branch carries, on top of the base, 6 commits:

- `e5d95a99c` docs: log entry and freeze ticket pointer, reserved identifiers (P-2026-10-10-0045)
- `67b17ce5a` docs(discovery): Phase 2 addendum, reserved identifiers (P-2026-10-10-0045)
- `07bf5c3ee` feat(jodie): gate reserved identifiers in Jjodie's scripts (P-2026-10-10-0045)
- `b5e9ed415` fix(jodie): rule 8 lists every reserved word, from the lexer list (P-2026-10-10-0045)
- `377070258` refactor(jjscript): one list of reserved identifiers, read by the lexer (P-2026-10-10-0045)
- `1153700ce` docs(discovery): Jjodie reserved identifiers, Phase 1 report (P-2026-10-10-0045)

The trunk carries, since the base, 274 commits:

- `dfdef69f1` docs: prompt for the Requirements tab, port slice S5 (P-2026-10-11-0008)
- `f731577da` docs: Status flip and log entry for the board-strip merge (P-2026-10-10-2119)
- `0edb5f06b` merge: board-strip into alfonso-frontend-jjtl (P-2026-10-10-2119)
- `cdc7d6896` docs: add prompt P-2026-10-10-2119, merge board-strip into alfonso-frontend-jjtl
- `c9044649e` docs: Status flip and log entry for the board status strip (P-2026-10-10-2103)
- `ff1620ca0` feat(harness): board status strip, resolved colour (P-2026-10-10-2103)
- `3f4ad5d00` docs: prompt for the board status strip, port slice S4 (P-2026-10-10-2103)
- `6c4b52131` docs: Status flip and log entry for the board-progress-core merge (P-2026-10-10-2053)
- `4cf36a239` merge: board-progress-core into alfonso-frontend-jjtl (P-2026-10-10-2053)
- `b03fc1b44` docs: add prompt P-2026-10-10-2053, merge board-progress-core into alfonso-frontend-jjtl
- `c0727487e` docs: Status flip and log entry for the lane-run-resolve merge (P-2026-10-10-2042)
- `dc8ea2a05` docs: R-GEN-16, templates reach the target profile through `target`
- `6a8065809` merge: lane-run-resolve into alfonso-frontend-jjtl (P-2026-10-10-2042)
- `ea2c78cb5` docs: add prompt P-2026-10-10-2042, merge lane-run-resolve into alfonso-frontend-jjtl
- `2cc5af89a` docs: Status flip and log entry for the req-trace-port merge (P-2026-10-10-2034)
- `567909061` docs: Status flip and log entry for the board progress core (P-2026-10-10-2021)
- `16e70f5e8` merge: req-trace-port into alfonso-frontend-jjtl (P-2026-10-10-2034)
- `712220764` docs: add prompt P-2026-10-10-2034, merge req-trace-port into alfonso-frontend-jjtl
- `0933ebe92` docs: Status flip and log entry for lane-run resolve (P-2026-10-10-2020)
- `c60ff807b` docs: Status flip and log entry for the req-trace port (P-2026-10-10-2022)
- `40b64be63` feat(harness): lane board shows progress in Phase and resolved outcome (P-2026-10-10-2021)
- `5dc52f23f` docs(harness): lane-run resolve beside lane-run track (P-2026-10-10-2020)
- `a335abd21` feat(harness): lane-run resolve marks a blocked lane, re-projects card (P-2026-10-10-2020)
- `f4c91bd71` docs: Status flip and log entry for the codegen-panel merge (P-2026-10-10-2018)
- `14461b2bd` feat(harness): req-trace builds the requirements index (P-2026-10-10-2022)
- `601ec1379` merge: codegen-panel into alfonso-frontend-jjtl (P-2026-10-10-2018)
- `05035419a` docs(ratifiche): memo proposing the guard core of JjEL and guard error policy (input to R-SIM-145)
- `c22fc0ec5` docs: prompts for the board port wave 1, S1 S2 S3 (P-2026-10-10-2020, 2021, 2022)
- `c2089e7a5` docs(sessioni): session of the simulator front, 2026-10-10 (C-2026-10-10-1620)
- `57336bdba` docs: add prompt P-2026-10-10-2018, merge codegen-panel into alfonso-frontend-jjtl
- `715e7bee6` docs: Status flip for the codegen S5 panel lane (P-2026-10-10-1825)
- `f753bf0d9` docs: Status flip for the RC-45 tier draw lane (P-2026-10-10-1757)
- `b6fce902a` docs: Status flip and log entry for the lane-run-rc45-draw merge (P-2026-10-10-1937)
- `e93cc0d0b` merge: lane-run-rc45-draw into alfonso-frontend-jjtl (P-2026-10-10-1937)
- `cf8b1b1ca` docs: add prompt P-2026-10-10-1937, merge lane-run-rc45-draw into alfonso-frontend-jjtl
- `d63a4e8e6` docs: Status flip and log entry, lane-run-rc45-draw took the trunk (P-2026-10-10-1923)
- `2913eced0` merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1923)
- `fc06723e8` docs: add prompt P-2026-10-10-1923, merge alfonso-frontend-jjtl into lane-run-rc45-draw
- `7b83066e0` docs: log entry and ticket for the codegen panel slice (P-2026-10-10-1825)
- `f95d0a44f` feat(codegen): setting, lazy Code panel, navigable origin, lazy gate (P-2026-10-10-1825)
- and 234 more: `git log --oneline 571392718..dfdef69f1`

Measured by `lane-run merge` at 2026-10-11 00:23, trunk at `dfdef69f1`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e5d95a99c`: zero conflicts.
- Files changed since the base: 11 on the branch side, 344 on the trunk side; on both sides: none.
- `git diff --name-only 571392718 e5d95a99c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `jjodie-reserved` in `/Users/alfonso/jjodel-w-jjodiereserved`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e5d95a99c` is the tip of `jjodie-reserved`; the prompt files of the branch read `Status: eseguito` at `e5d95a99c`; `git worktree list` shows `jjodie-reserved` only in `/Users/alfonso/jjodel-w-jjodiereserved`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e5d95a99c` (measured above: zero conflicts). `git diff --name-only 571392718 e5d95a99c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 571392718 alfonso-frontend-jjtl` with `git diff --name-only 571392718 e5d95a99c` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-43` (trunk), `RC-44` (trunk), `RC-45` (trunk), `R-SIM-144` (trunk), `R-SIM-146` (trunk), `R-GEN-1` (trunk), `R-GEN-2` (trunk), `R-GEN-3` (trunk), `R-GEN-4` (trunk), `R-GEN-5` (trunk), `R-GEN-6` (trunk), `R-GEN-7` (trunk), `R-GEN-8` (trunk), `R-GEN-9` (trunk), `R-GEN-10` (trunk), `R-GEN-11` (trunk), `R-GEN-12` (trunk), `R-GEN-13` (trunk), `R-GEN-14` (trunk), `R-GEN-15` (trunk), `R-GEN-16` (trunk); control: `- **R-GEN-17**` none.
   - `docs/log-inbox/jjodie-reserved.md`: the heading `## 2026-10-10 — feat(jodie): one list of reserved identifiers and a gate on Jjodie's scripts (P-2026-10-10-0045)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-10: the attributes of the event that fired the step (R-SIM-144)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-10: the RC-26 points of 2026-10-06 (R-SIM-146)` once (trunk).
   - `docs/decisions.md`: the heading `## R-GEN: model-to-text code generation, the pilot (ratifications 2026-10-10)` once (trunk).
   - `docs/log-inbox/codegen-engine.md`: the heading `## 2026-10-10 — feat(codegen): template engine, Text with origin, block indentation, codec (P-2026-10-10-0945)` once (trunk).
   - `docs/log-inbox/codegen-engine.md`: the heading `## 2026-10-10 — merge: codegen-engine into alfonso-frontend-jjtl (P-2026-10-10-1747)` once (trunk).
   - `docs/log-inbox/codegen-jjel.md`: the heading `## 2026-10-10 — feat: JjEL template interpolation, opt-in, Text host and read observer (P-2026-10-10-0900)` once (trunk).
   - `docs/log-inbox/codegen-jjel.md`: the heading `## 2026-10-10 — merge: codegen-jjel-template into alfonso-frontend-jjtl (P-2026-10-10-0936)` once (trunk).
   - `docs/log-inbox/codegen-panel.md`: the heading `## 2026-10-10 — feat(codegen): experimental setting, lazy Code panel, navigable origin (P-2026-10-10-1825)` once (trunk).
   - `docs/log-inbox/codegen-panel.md`: the heading `## 2026-10-10 — ticket: EditorV2's onKeyDown deletes the selection on Backspace typed in a TEXTAREA` once (trunk).
   - `docs/log-inbox/codegen-panel.md`: the heading `## 2026-10-10 — merge: codegen-panel into alfonso-frontend-jjtl (P-2026-10-10-2018)` once (trunk).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — feat(codegen): JavaScript target profile and sandboxed runner (P-2026-10-10-0950)` once (trunk).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — merge: codegen-runner into alfonso-frontend-jjtl (P-2026-10-10-1802)` once (trunk).
   - `docs/log-inbox/codegen-stc.md`: the heading `## 2026-10-10 — feat(codegen): read-only accessor to the STC roles (P-2026-10-10-0901)` once (trunk).
   - `docs/log-inbox/codegen-stc.md`: the heading `## 2026-10-10 — merge: codegen-stc into alfonso-frontend-jjtl (P-2026-10-10-0927)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-10 — discovery: code generation pilot, R-GEN-1..9 (P-2026-10-10-0815)` once (trunk).
   - `docs/log-inbox/dark-theme.md`: the heading `## 2026-10-10 — discovery: dark theme removal, Phase 1 (P-2026-10-10-0910)` once (trunk).
   - `docs/log-inbox/dark-theme.md`: the heading `## 2026-10-10 — refactor(theme): dark theme removed, light states A and B kept (P-2026-10-10-0910)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): lane board lists earlier lanes newest first (P-2026-10-10-0840)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-order into alfonso-frontend-jjtl (P-2026-10-10-0843)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): prompts name the request they answer (P-2026-10-10-1150)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: prompt-request into alfonso-frontend-jjtl (P-2026-10-10-1204)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): chain forwards --request to its lanes (P-2026-10-10-1243)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: chain-request into alfonso-frontend-jjtl (P-2026-10-10-1250)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board shows when each lane started and ended (P-2026-10-10-1253)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-times into alfonso-frontend-jjtl (P-2026-10-10-1312)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): every prompt names its front, Check E (P-2026-10-10-1500)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane-run projects each lane onto its GitHub card (P-2026-10-10-1532)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: trunk prompts after FRONT_FROM lack Front:, Check E fails them at the merge` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: issue-discovery.md renders no Front:, start --auto will refuse auto-intake lanes` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): front cut-off to P-2026-10-11-0000, auto-intake renders Front (P-2026-10-10-1612)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: the moved cut-off leaves this lane's GitHub card open, In progress` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: issue-discovery.md renders no Depends: line (RC-42)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-model-insights takes alfonso-frontend-jjtl (P-2026-10-10-1635)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-model-insights into alfonso-frontend-jjtl (P-2026-10-10-1708)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board shows the span beside the working time (P-2026-10-10-1717)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-tracking into alfonso-frontend-jjtl (P-2026-10-10-1648)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: merge-into-trunk.md misreads a governance go-ahead and counts check:docs as 4/4` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-span into alfonso-frontend-jjtl (P-2026-10-10-1731)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: `lane-run resume` cannot carry the critical-zone go-ahead` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board tables with fixed column widths (P-2026-10-10-1742)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board links each lane to its chat (P-2026-10-10-1816)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board timeline lists the newest lanes first (P-2026-10-10-1744)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: timeline-newest-first into alfonso-frontend-jjtl (P-2026-10-10-1843)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-req-port-disc into alfonso-frontend-jjtl (P-2026-10-10-1852)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): lane board counts a two-merge lane as a merge (P-2026-10-10-1803)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-kindof-merges takes alfonso-frontend-jjtl (P-2026-10-10-1851)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-kindof-merges into alfonso-frontend-jjtl (P-2026-10-10-1913)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane-run draws the tier of eligible lanes, RC-45 (P-2026-10-10-1757)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1848)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1923)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw into alfonso-frontend-jjtl (P-2026-10-10-1937)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): req-trace on the trunk, verbatim from harness-req-tab (P-2026-10-10-2022)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: req-trace-port into alfonso-frontend-jjtl (P-2026-10-10-2034)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat: lane-run resolve and the resolved outcome, with card projection (P-2026-10-10-2020)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-resolve into alfonso-frontend-jjtl (P-2026-10-10-2042)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat: lane board progress in the Phase cell and the resolved outcome (P-2026-10-10-2021)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-progress-core into alfonso-frontend-jjtl (P-2026-10-10-2053)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): board status strip, resolved colour in Timeline and Insights (P-2026-10-10-2103)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-strip into alfonso-frontend-jjtl (P-2026-10-10-2119)` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — fix: JjEL lexer looks up OCL messages and keywords by own key` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — ticket: JjScript looks up tables and variable maps keyed by source text on plain objects` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — merge: jjel-lexer-own-keys into alfonso-frontend-jjtl (P-2026-10-10-1817)` once (trunk).
   - `docs/log-inbox/relayout-on-open.md`: the heading `## 2026-10-10 — fix(editor-v2): no whole-graph re-layout on an open that creates (P-2026-10-10-1155)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — discovery: event attributes read by guards and actions (P-2026-10-10-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1718)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: board editor arrows move, Shift and an arrow select, old CSS removed (P-2026-10-10-1645)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-board-keys into alfonso-frontend-jjtl (P-2026-10-10-1726)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: fixed-width Coverage switch, Clear sees the live marking (P-2026-10-10-1646)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-coverage-polish into alfonso-frontend-jjtl (P-2026-10-10-1737)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: event reads checked at Reset, the unset warning, R-SIM-144 (P-2026-10-10-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1753)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — docs(discovery): stale M1 reference edge, root cause and fix plan (P-2026-10-10-1600)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — ticket: a bare DeleteElementAction leaves the edge id in its vertices' edgesOut and edgesIn` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — fix(sync): a stale M1 reference edge leaves graph.subElements, F1 (P-2026-10-10-1600)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — merge: stale-m1-edge into alfonso-frontend-jjtl (P-2026-10-10-1809)` once (trunk).
4. `git merge --no-ff --no-commit e5d95a99c`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjodie-reserved into alfonso-frontend-jjtl (P-2026-10-11-0023)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e5d95a99c` in `/Users/alfonso/jjodel-w-jjodiereserved`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard dfdef69f1` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/jjodie-reserved.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjodie-reserved merge (P-2026-10-11-0023)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjodiereserved`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
