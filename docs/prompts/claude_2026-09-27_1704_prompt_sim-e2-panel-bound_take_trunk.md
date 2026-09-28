# Prompt: sim-e2-panel-bound takes the trunk before its own merge

Prompt-ID: P-2026-09-27-1704
Chat: C-2026-09-27-1437
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: eseguito 2026-09-27 · lane sim-e2-panel-bound · 99d7bfff8 · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-open`, branch `sim-e2-panel-bound`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-open`, branch `sim-e2-panel-bound`, `git log -1` is the commit that adds this file (its parent `799ee13d5`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1704 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `7a4976853` into `sim-e2-panel-bound` with one merge commit, `--no-ff`, in the shape of `11fd69ca4` (the last merge commit on `sim-e2-panel-bound`; read its body first). Merge base `f60a0f0b2`. The trunk brings, since the base, 22 commits:

- `7a4976853` docs: Status flip for the sim-e1-engine merge (P-2026-09-27-1632)
- `bbd9b7142` merge: sim-e1-engine into alfonso-frontend-jjtl (P-2026-09-27-1632)
- `bc5c07692` docs: add prompt P-2026-09-27-1632, merge sim-e1-engine into alfonso-frontend-jjtl
- `5c996267e` docs: Status flip for the harness-p16-merge-rules merge (P-2026-09-27-1621)
- `0898a4f99` docs(sim): E1 closure, R-SIM-83 and R-SIM-84, log entry, Status (P-2026-09-27-1610)
- `c4c54a999` merge: harness-p16-merge-rules into alfonso-frontend-jjtl (P-2026-09-27-1621)
- `df5d742cd` docs: add prompt P-2026-09-27-1621, merge harness-p16-merge-rules into alfonso-frontend-jjtl
- `bce34aee1` feat(sim): else over fused transitions, else-position defect (G7) (P-2026-09-27-1610)
- `45a796050` feat(sim): the engine reads the activity final (G6) (P-2026-09-27-1610)
- `c197c0ce6` docs(harness): P16 describes the pending render and --governance-goahead (P-2026-09-27-1620)
- `03c2ebb3b` docs: add prompt P-2026-09-27-1620, P16 describes the pending render and --governance-goahead
- `5260df11f` docs: add prompt P-2026-09-27-1610, E1 engine G6 and G7
- `2b1b346da` docs: Status flip for the sim-demo-script-hint merge (P-2026-09-27-1546)
- `7c9956b40` merge: sim-demo-script-hint into alfonso-frontend-jjtl (P-2026-09-27-1546)
- `696ec45b9` docs: add prompt P-2026-09-27-1546, merge sim-demo-script-hint into alfonso-frontend-jjtl
- `4d8d9ea4c` docs: Status flip for the sim-hint-path-probe merge (P-2026-09-27-1536)
- `2eeae9825` merge: sim-hint-path-probe into alfonso-frontend-jjtl (P-2026-09-27-1536)
- `261886ad4` docs(sim): demo script names the ESM hint path gestures (P-2026-09-27-1540)
- `7994d347b` docs: add prompt P-2026-09-27-1536, merge sim-hint-path-probe into alfonso-frontend-jjtl
- `8598bf7c1` docs: add prompt P-2026-09-27-1540, demo script names the ESM hint path gestures
- `6acdb7080` docs(sim): hint path of the demo script measured on the trunk (P-2026-09-27-1500)
- `49b195a02` docs: add prompt P-2026-09-27-1500, demo hint path measured on the trunk

This branch brings, 5 commits:

- `799ee13d5` docs(sim): E2 Status, visual check passed (P-2026-09-27-1611)
- `dccd3206a` docs(sim): E2 closure, R-SIM-81(1) amended, log entry, Status (P-2026-09-27-1611)
- `babbc161c` feat(sim): activity-final row in Configure General (G6) (P-2026-09-27-1611)
- `917b1546b` feat(sim): Bound proposed by a bounded exploration (G12) (P-2026-09-27-1611)
- `d685b5738` docs: add prompt P-2026-09-27-1611, E2 panel row and Bound by exploration

Measured by `lane-run merge --trunk-into` at 2026-09-27 17:04, trunk at `7a4976853`:

- `git merge-tree --write-tree --name-only sim-e2-panel-bound 7a4976853`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 13 on the branch side, 22 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/simulation.md`, `frontend/src/model/simulation/__tests__/roleCatalog.test.ts`.
- `git diff --name-only f60a0f0b2 799ee13d5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1611_prompt_sim_e2_panel_row_bound.md` (eseguito 2026-09-27 · lane sim-e2-panel-bound · babbc161c · verifica visiva passata 2026-09-27 (GO chat 2026-09-27 16:58, crops shots_e2)).
- `git worktree list`: `sim-e2-panel-bound` in `/Users/alfonso/jjodel-open`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `7a4976853` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `7a4976853` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only sim-e2-panel-bound 7a4976853` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 7a4976853`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-83` (trunk), `R-SIM-84` (trunk); control: `- **R-SIM-85**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: E2, Bound from a bounded exploration and the activity-final row (P-2026-09-27-1611)` once (branch).
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-27: corsia E1, il motore dopo MODELS (R-SIM-83..84)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-27 — docs: P16 describes the pending render and --governance-goahead (P-2026-09-27-1620)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — probe: the demo script's Add attribute hint path on the trunk (P-2026-09-27-1500)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — docs: demo script names the ESM hint path gestures (P-2026-09-27-1540)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the engine reads the activity final and resolves else over fused transitions, lane E1 (P-2026-09-27-1610)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `docs/log-inbox/simulation.md`, `frontend/src/model/simulation/__tests__/roleCatalog.test.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-e2-panel-bound takes alfonso-frontend-jjtl (P-2026-09-27-1704)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane sim-e2-panel-bound · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip, sim-e2-panel-bound took the trunk (P-2026-09-27-1704)`. No log entry. `Outcome: done`. The merge of `sim-e2-panel-bound` into the trunk gets its own prompt (`lane-run merge sim-e2-panel-bound --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
