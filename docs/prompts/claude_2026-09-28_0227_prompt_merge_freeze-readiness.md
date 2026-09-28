# Prompt: merge freeze-readiness into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-0227
Chat: C-2026-09-27-1437
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-0227 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6f81de7b9`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `freeze-readiness` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c6933dded`, in the shape of `56134751e` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d88e70e0e`. The branch carries, on top of the base, 2 commits:

- `c6933dded` docs: freeze readiness discovery (P-2026-09-27-2236)
- `a42fb1ed4` docs: add prompt P-2026-09-27-2236

The trunk carries, since the base, 75 commits:

- `6f81de7b9` docs: Status flip for the sim-bridge-off-else merge (P-2026-09-28-0209)
- `56134751e` merge: sim-bridge-off-else into alfonso-frontend-jjtl (P-2026-09-28-0209)
- `1faba92b8` docs: add prompt P-2026-09-28-0209, merge sim-bridge-off-else into alfonso-frontend-jjtl
- `3720df681` docs: Status flip for the small-cleanups merge (P-2026-09-28-0149)
- `43113104b` merge: small-cleanups into alfonso-frontend-jjtl (P-2026-09-28-0149)
- `ffd284bc0` docs: add prompt P-2026-09-28-0149, merge small-cleanups into alfonso-frontend-jjtl
- `2511c3fff` docs: Status flip for the demo-polish merge (P-2026-09-28-0130)
- `d861cc922` merge: demo-polish into alfonso-frontend-jjtl (P-2026-09-28-0130)
- `308a37638` docs: add prompt P-2026-09-28-0130, merge demo-polish into alfonso-frontend-jjtl
- `6045ebc82` docs: R-SIM-86, log entry, Status for roles off and else (P-2026-09-28-0100)
- `1f5e505b1` docs: Status flip for the sim-canvas-state merge (P-2026-09-28-0059)
- `22cc00ffd` fix(sim): roles that are off are skipped by the run (P-2026-09-28-0100)
- `5249f01be` docs: small cleanups log entry and Status (P-2026-09-28-0055)
- `dbcc9f2e9` fix: bordr typo in properties-with-tree-view (P-2026-09-28-0055)
- `7ece192d9` merge: sim-canvas-state into alfonso-frontend-jjtl (P-2026-09-28-0059)
- `935d054f0` chore: smoke helper switches the theme the app way (P-2026-09-28-0055)
- `72dc4dca2` docs: add prompt P-2026-09-28-0100, roles off skipped and else with no sibling
- `a658a00b4` docs: add prompt P-2026-09-28-0059, merge sim-canvas-state into alfonso-frontend-jjtl
- `2e4a09c78` docs: Status flip, demo script, log entry for the sim-checker-rules merge (P-2026-09-28-0023)
- `ce3531f99` docs: R-SIM-85 header on one line for docs:digest (P-2026-09-28-0055)
- `ba74632df` docs: add prompt P-2026-09-28-0055, small cleanups
- `d01f03e5c` docs: demo script save check, log entry and Status (P-2026-09-28-0014)
- `813a73ff5` fix: the theme switch reaches the open editor (P-2026-09-28-0014)
- `b452d9e5c` merge: sim-checker-rules into alfonso-frontend-jjtl (P-2026-09-28-0023)
- `5af828d8d` docs(sim): Status flip, canvas run state A2 visual check passed (P-2026-09-27-2324)
- `bd750a74f` docs: add prompt P-2026-09-28-0023, merge sim-checker-rules into alfonso-frontend-jjtl
- `7a03daa1c` docs: Status flip, sim-checker-rules took the trunk (P-2026-09-28-0005)
- `606d9e761` docs(sim): canvas run state slice A2, entry and Status (P-2026-09-27-2324)
- `5dd16be7e` merge: sim-checker-rules takes alfonso-frontend-jjtl (P-2026-09-28-0005)
- `e49b10497` feat(sim): the pending choice on the canvas, slice A2 (P-2026-09-27-2324)
- `c708bb55a` docs: add prompt P-2026-09-28-0014, demo polish F2 F3 F1
- `00c5c547f` docs: add prompt P-2026-09-28-0005, merge alfonso-frontend-jjtl into sim-checker-rules
- `e87df1ff6` docs: Status flip, RC-31 and log entry for the enum-step-b merge (P-2026-09-27-2327)
- `c030871ff` merge: enum-step-b into alfonso-frontend-jjtl (P-2026-09-27-2327)
- `4273433d9` docs: add prompt P-2026-09-27-2327, merge enum-step-b into alfonso-frontend-jjtl
- `f5b70578d` docs: add prompt P-2026-09-27-2324, canvas run state slice A2
- `cc75e3aeb` docs: Status flip, sim-canvas-state took the trunk (P-2026-09-27-2304)
- `cadbf254e` merge: sim-canvas-state takes alfonso-frontend-jjtl (P-2026-09-27-2304)
- `92ee825f3` docs: add prompt P-2026-09-27-2304, merge alfonso-frontend-jjtl into sim-canvas-state
- `2b815a87b` docs(sim): P2b closure, R-SIM-70 extended, log entry, Status (P-2026-09-27-2235)
- and 35 more: `git log --oneline d88e70e0e..6f81de7b9`

Measured by `lane-run merge` at 2026-09-28 02:27, trunk at `6f81de7b9`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c6933dded`: zero conflicts.
- Files changed since the base: 2 on the branch side, 63 on the trunk side; on both sides: none.
- `git diff --name-only d88e70e0e c6933dded -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_2236_prompt_freeze_readiness.md` (eseguito 2026-09-28 · lane freeze-readiness · the commit that carries this line (docs-only discovery; its sha is in the hard stop)).
- `git worktree list`: `freeze-readiness` in `/Users/alfonso/jjodel-w-freeze`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c6933dded` is the tip of `freeze-readiness`; the prompt files of the branch read `Status: eseguito` at `c6933dded`; `git worktree list` shows `freeze-readiness` only in `/Users/alfonso/jjodel-w-freeze`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c6933dded` (measured above: zero conflicts). `git diff --name-only d88e70e0e c6933dded -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d88e70e0e alfonso-frontend-jjtl` with `git diff --name-only d88e70e0e c6933dded` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-31` (trunk), `R-SIM-85` (trunk), `R-SIM-86` (trunk); control: `- **R-SIM-87**` none.
   - `docs/decisions.md`: the heading `### Decisione 2026-09-27: merges before the freeze (RC-31)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-28: il run salta i ruoli off (R-SIM-86)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — fix: bordr line, probe theme helper, R-SIM-85 header (P-2026-09-28-0055)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — fix: the halt line reads whole in the halted state (P-2026-09-27-2225)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: guard and action checks in the problems list, S16 (P-2026-09-27-1726)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: guard and action checks in the problems registry, P2a (P-2026-09-27-1805)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: well-founded recursion in derived attributes, S3 (P-2026-09-27-1727)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: derived attributes ordered per element over frozen M, S3 (P-2026-09-27-1727)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the checker rules R1-R5 at Reset, P2b (P-2026-09-27-2235)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-checker-rules into alfonso-frontend-jjtl (P-2026-09-28-0023)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the run state on the canvas nodes, slice A1 of S15 (P-2026-09-27-1647)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — ticket: every Reset serializes the selected model to ecore, and logs a loop on cyclic models` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — feat: the pending choice on the canvas, slice A2 of S15 (P-2026-09-27-2324)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — ticket: the pending ring does not reach IR object-as-edge edges` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: demo polish, the theme switch reaches the open editor; toolbar labels accepted for MODELS (P-2026-09-28-0014)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: roles that are off are skipped by the run; else with no sibling waits for Alfonso (P-2026-09-28-0100)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-27 — feat(model): enum step B Phase 2, model guards, B5 and the classifier-kind producer (P-2026-09-27-1806)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-27 — merge: enum-step-b into alfonso-frontend-jjtl (P-2026-09-27-2327)` once (trunk).
4. `git merge --no-ff --no-commit c6933dded`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: freeze-readiness into alfonso-frontend-jjtl (P-2026-09-28-0227)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c6933dded` in `/Users/alfonso/jjodel-w-freeze`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the freeze-readiness merge (P-2026-09-28-0227)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-freeze`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
