# Prompt: merge ir-freeze-disc into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-30-1104
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: ✅ completed (closed by hand by the chat, red gate load-induced)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-30-1104 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `62f4ac3fc`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ir-freeze-disc` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a50fa6607`, in the shape of `e42e5d7f5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f7c5fd910`. The branch carries, on top of the base, 2 commits:

- `a50fa6607` docs: discovery of IR authoring freezes and two IR rendering gaps (P-2026-09-29-1935)
- `9b08350d0` docs: add prompt P-2026-09-29-1935, discovery of IR authoring freezes and two IR rendering gaps

The trunk carries, since the base, 55 commits:

- `62f4ac3fc` docs: Status flip and log entry for the railsystem-leftovers merge (P-2026-09-29-2302)
- `e42e5d7f5` merge: railsystem-leftovers into alfonso-frontend-jjtl (P-2026-09-29-2302)
- `6342f87e3` docs: add prompt P-2026-09-29-2302, merge railsystem-leftovers into alfonso-frontend-jjtl
- `5555a3619` docs: closure of the railSystem SymbolCard leftovers, entry and Status (P-2026-09-29-2253)
- `26b29ae57` style(editors): drop SymbolCard leftovers in railSystem.scss (P-2026-09-29-2253)
- `c82b6c476` docs: add prompt P-2026-09-29-2253, railSystem SymbolCard leftovers
- `313a84663` docs: ratify flat collapsed fields, R-IRN-37 and IR spec v1.2 §8
- `8911a7ae8` docs: Status flip and log entry for the ir-collapsed-render merge (P-2026-09-29-2243)
- `889906e43` merge: ir-collapsed-render into alfonso-frontend-jjtl (P-2026-09-29-2243)
- `a4ad1dac8` docs: add prompt P-2026-09-29-2243, merge ir-collapsed-render into alfonso-frontend-jjtl
- `cf8c031f6` docs: Status flip and log entry for the no-proxy-ir merge (P-2026-09-29-2158)
- `f601f70ff` docs: closure of the collapsed render lane, entry and Status (P-2026-09-29-2122)
- `3573b0029` merge: no-proxy-ir into alfonso-frontend-jjtl (P-2026-09-29-2158)
- `e06e7aa1f` docs: add prompt P-2026-09-29-2158, merge no-proxy-ir into alfonso-frontend-jjtl
- `61a45540e` fix(ir): corner badges on SVG forms, derived size dropped on expand (P-2026-09-29-2122)
- `18ec08e9b` docs: log entry, ticket and Status for F1 no-proxy IR (P-2026-09-29-2121)
- `4784837e3` docs: LIR addendum, badge inline and derived size drop (P-2026-09-29-2122)
- `719703ef6` fix(ir): never store an L-proxy inside a view IR (P-2026-09-29-2121)
- `591504f57` docs: Status flip and log entry for the live-save merge (P-2026-09-29-2140)
- `e2e2195c6` docs: Layer Impact Report for F1, no L-proxy inside a view IR (P-2026-09-29-2121)
- `9ef223452` merge: live-save into alfonso-frontend-jjtl (P-2026-09-29-2140)
- `d6e9b8486` docs: probe results for the collapsed render, two defects (P-2026-09-29-2122)
- `62badb2b2` docs: add prompt P-2026-09-29-2140, merge live-save into alfonso-frontend-jjtl
- `d15c657c7` docs: log entry, counters ticket and Status for live save (P-2026-09-29-2120)
- `041373870` fix(persistence): save the live project on Cmd+S (P-2026-09-29-2120)
- `04acac227` feat(ir): render the declared collapsed form, fill and badge (P-2026-09-29-2122)
- `d6dff9e78` docs: Layer Impact Report, collapsed graphVertex render (P-2026-09-29-2122)
- `8dbb031d1` docs: add prompt P-2026-09-29-2122, F3, render the collapsed graphVertex
- `361eadedd` docs: add prompt P-2026-09-29-2121, F1, no L-proxy inside a view IR
- `1625e8c28` docs: add prompt P-2026-09-29-2120, F2, save the live project on Cmd+S
- `5626b3364` docs: Status flip and log entry for the sim-random-l2 merge (P-2026-09-29-2034)
- `6bf2c7a3d` merge: sim-random-l2 into alfonso-frontend-jjtl (P-2026-09-29-2034)
- `90fbe076b` docs: add prompt P-2026-09-29-2034, merge sim-random-l2 into alfonso-frontend-jjtl
- `8628bad4f` docs: R-SIM-101, the demo's Play lines, log entry and Status (P-2026-09-29-1943)
- `6f1bcea1d` feat(sim): the Choices row and Play in the panel (P-2026-09-29-1943)
- `15fdc7363` feat(sim): Step under the policy and the pure tick of Play (P-2026-09-29-1943)
- `6c460f998` docs: Status flip and log entry for the symbolcard-cleanup merge (P-2026-09-29-1947)
- `0d1e8ed94` feat(sim): the run policy per model, Ask | Random and k (P-2026-09-29-1943)
- `6ada3b757` merge: symbolcard-cleanup into alfonso-frontend-jjtl (P-2026-09-29-1947)
- `bda149cbe` docs: add prompt P-2026-09-29-1947, merge symbolcard-cleanup into alfonso-frontend-jjtl
- and 15 more: `git log --oneline f7c5fd910..62f4ac3fc`

Measured by `lane-run merge` at 2026-09-30 11:04, trunk at `62f4ac3fc`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a50fa6607`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 3 on the branch side, 48 on the trunk side; on both sides: `docs/log-inbox/views.md`.
- `git diff --name-only f7c5fd910 a50fa6607 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1935_prompt_discovery_ir_authoring_freeze.md` (eseguito 2026-09-29 · lane discovery ir-freeze-disc · measured on 9b08350d0; the report is in the commit that carries this line (a commit cannot name its own sha) · Outcome: hard-stop).
- `git worktree list`: `ir-freeze-disc` in `/Users/alfonso/jjodel-w-irfreeze`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-30-1104/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a50fa6607` is the tip of `ir-freeze-disc`; the prompt files of the branch read `Status: eseguito` at `a50fa6607`; `git worktree list` shows `ir-freeze-disc` only in `/Users/alfonso/jjodel-w-irfreeze`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a50fa6607` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only f7c5fd910 a50fa6607 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f7c5fd910 alfonso-frontend-jjtl` with `git diff --name-only f7c5fd910 a50fa6607` (measured above: `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-IRN-37` (trunk), `R-SIM-100` (trunk), `R-SIM-101` (trunk); control: `- **R-SIM-102**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, IR authoring freezes, collapsed graphVertex, StructureSpec (P-2026-09-29-1935)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: Random on an ε choice, a seeded draw, the minimal trace, R-SIM-100 (P-2026-09-29-1840)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-random-l1 into alfonso-frontend-jjtl (P-2026-09-29-1933)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the Ask | Random run policy and Play, R-SIM-101 (P-2026-09-29-1943)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-random-l2 into alfonso-frontend-jjtl (P-2026-09-29-2034)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: symbol-tab-modal into alfonso-frontend-jjtl (P-2026-09-29-1925)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — refactor(authoring): remove the dead SymbolCard and its styles (P-2026-09-29-1929)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: symbolcard-cleanup into alfonso-frontend-jjtl (P-2026-09-29-1947)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — style(editors): drop SymbolCard leftovers in railSystem.scss (P-2026-09-29-2253)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: railsystem-leftovers into alfonso-frontend-jjtl (P-2026-09-29-2302)` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — fix(persistence): save the live project on Cmd+S (P-2026-09-29-2120)` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — ticket: save counters still read the caller's stale LProject` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — merge: live-save into alfonso-frontend-jjtl (P-2026-09-29-2140)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — fix(ir): never store an L-proxy inside a view IR (P-2026-09-29-2121)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a critical-zone lane sees four red hook tests in its own vitest run` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: no-proxy-ir into alfonso-frontend-jjtl (P-2026-09-29-2158)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(ir): render the declared collapsed form, fill and badge (P-2026-09-29-2122)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a critical-zone lane's go-ahead variable reaches the criticalZone hook tests` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: ir-collapsed-render into alfonso-frontend-jjtl (P-2026-09-29-2243)` once (trunk).
4. `git merge --no-ff --no-commit a50fa6607`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-freeze-disc into alfonso-frontend-jjtl (P-2026-09-30-1104)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a50fa6607` in `/Users/alfonso/jjodel-w-irfreeze`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 62f4ac3fc` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ir-freeze-disc merge (P-2026-09-30-1104)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-irfreeze`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
