# Prompt: merge sim-bridge-off-else into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-0209
Chat: C-2026-09-27-1437
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-0209 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `3720df681`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-bridge-off-else` into the trunk with one merge commit, `--no-ff`, of the explicit sha `6045ebc82`, in the shape of `43113104b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `2e4a09c78`. The branch carries, on top of the base, 3 commits:

- `6045ebc82` docs: R-SIM-86, log entry, Status for roles off and else (P-2026-09-28-0100)
- `22cc00ffd` fix(sim): roles that are off are skipped by the run (P-2026-09-28-0100)
- `72dc4dca2` docs: add prompt P-2026-09-28-0100, roles off skipped and else with no sibling

The trunk carries, since the base, 27 commits:

- `3720df681` docs: Status flip for the small-cleanups merge (P-2026-09-28-0149)
- `43113104b` merge: small-cleanups into alfonso-frontend-jjtl (P-2026-09-28-0149)
- `ffd284bc0` docs: add prompt P-2026-09-28-0149, merge small-cleanups into alfonso-frontend-jjtl
- `2511c3fff` docs: Status flip for the demo-polish merge (P-2026-09-28-0130)
- `d861cc922` merge: demo-polish into alfonso-frontend-jjtl (P-2026-09-28-0130)
- `308a37638` docs: add prompt P-2026-09-28-0130, merge demo-polish into alfonso-frontend-jjtl
- `1f5e505b1` docs: Status flip for the sim-canvas-state merge (P-2026-09-28-0059)
- `5249f01be` docs: small cleanups log entry and Status (P-2026-09-28-0055)
- `dbcc9f2e9` fix: bordr typo in properties-with-tree-view (P-2026-09-28-0055)
- `7ece192d9` merge: sim-canvas-state into alfonso-frontend-jjtl (P-2026-09-28-0059)
- `935d054f0` chore: smoke helper switches the theme the app way (P-2026-09-28-0055)
- `a658a00b4` docs: add prompt P-2026-09-28-0059, merge sim-canvas-state into alfonso-frontend-jjtl
- `ce3531f99` docs: R-SIM-85 header on one line for docs:digest (P-2026-09-28-0055)
- `ba74632df` docs: add prompt P-2026-09-28-0055, small cleanups
- `d01f03e5c` docs: demo script save check, log entry and Status (P-2026-09-28-0014)
- `813a73ff5` fix: the theme switch reaches the open editor (P-2026-09-28-0014)
- `5af828d8d` docs(sim): Status flip, canvas run state A2 visual check passed (P-2026-09-27-2324)
- `606d9e761` docs(sim): canvas run state slice A2, entry and Status (P-2026-09-27-2324)
- `e49b10497` feat(sim): the pending choice on the canvas, slice A2 (P-2026-09-27-2324)
- `c708bb55a` docs: add prompt P-2026-09-28-0014, demo polish F2 F3 F1
- `f5b70578d` docs: add prompt P-2026-09-27-2324, canvas run state slice A2
- `cc75e3aeb` docs: Status flip, sim-canvas-state took the trunk (P-2026-09-27-2304)
- `cadbf254e` merge: sim-canvas-state takes alfonso-frontend-jjtl (P-2026-09-27-2304)
- `92ee825f3` docs: add prompt P-2026-09-27-2304, merge alfonso-frontend-jjtl into sim-canvas-state
- `b0d75d190` docs(sim): Status flip, canvas run state A1 visual check passed (P-2026-09-27-1647)
- `6bfec18ef` docs(sim): canvas run state slice A1, entry, ticket and Status (P-2026-09-27-1647)
- `4538d824f` feat(sim): run state on the canvas nodes, slice A1 (P-2026-09-27-1647)

Measured by `lane-run merge` at 2026-09-28 02:09, trunk at `3720df681`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 6045ebc82`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 5 on the branch side, 25 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/simulation.md`.
- `git diff --name-only 2e4a09c78 6045ebc82 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_0100_prompt_sim_bridge_off_else.md` (eseguito in parte 2026-09-28 · lane sim-bridge-off-else · 22cc00ffd (ticket 1) · ticket 2 fermo: domanda per Alfonso (RC-26, report §12 decisione 1), Recommended nella voce di log · quattro scene su 3033 on script (sonda della corsia)).
- `git worktree list`: `sim-bridge-off-else` in `/Users/alfonso/jjodel-w-bridge`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `6045ebc82` is the tip of `sim-bridge-off-else`; the prompt files of the branch read `Status: eseguito` at `6045ebc82`; `git worktree list` shows `sim-bridge-off-else` only in `/Users/alfonso/jjodel-w-bridge`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 6045ebc82` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 2e4a09c78 6045ebc82 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 2e4a09c78 alfonso-frontend-jjtl` with `git diff --name-only 2e4a09c78 6045ebc82` (measured above: `docs/decisions.md`, `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-86` (branch), `R-SIM-85` (trunk); control: `- **R-SIM-87**` none.
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-28: il run salta i ruoli off (R-SIM-86)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: roles that are off are skipped by the run; else with no sibling waits for Alfonso (P-2026-09-28-0100)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — fix: bordr line, probe theme helper, R-SIM-85 header (P-2026-09-28-0055)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the run state on the canvas nodes, slice A1 of S15 (P-2026-09-27-1647)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — ticket: every Reset serializes the selected model to ecore, and logs a loop on cyclic models` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — feat: the pending choice on the canvas, slice A2 of S15 (P-2026-09-27-2324)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — ticket: the pending ring does not reach IR object-as-edge edges` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: demo polish, the theme switch reaches the open editor; toolbar labels accepted for MODELS (P-2026-09-28-0014)` once (trunk).
4. `git merge --no-ff --no-commit 6045ebc82`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-bridge-off-else into alfonso-frontend-jjtl (P-2026-09-28-0209)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `6045ebc82` in `/Users/alfonso/jjodel-w-bridge`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the sim-bridge-off-else merge (P-2026-09-28-0209)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-bridge`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
