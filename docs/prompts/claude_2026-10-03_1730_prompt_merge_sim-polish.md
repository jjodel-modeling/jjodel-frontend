# Prompt: merge sim-polish into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-1730
Chat: C-2026-10-03-1610
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-1730 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `49957d340`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-polish` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c482d7785`, in the shape of `ac601d867` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d2a1866b6`. The branch carries, on top of the base, 3 commits:

- `c482d7785` docs: Status flip and log entry for the simulation UI polish (P-2026-10-03-1630)
- `26e05dba3` fix(sim): role tags, roles counter, state heading, initial on switches (P-2026-10-03-1630)
- `1bfb24d88` docs: add prompt P-2026-10-03-1630

The trunk carries, since the base, 7 commits:

- `49957d340` docs: add RC-35..RC-39 and prompt P-2026-10-03-1705 (issue-driven auto lanes)
- `b554989d6` docs: Status flip and log entry for the lane-run-hygiene merge (P-2026-10-03-1650)
- `ac601d867` merge: lane-run-hygiene into alfonso-frontend-jjtl (P-2026-10-03-1650)
- `879b0ef53` docs: add prompt P-2026-10-03-1650, merge lane-run-hygiene into alfonso-frontend-jjtl
- `ec5d412cb` docs: Status flip and log entry, lane-run hygiene (P-2026-10-03-1631)
- `d414c934d` fix(harness): direct merge links node_modules, status warns on Status (P-2026-10-03-1631)
- `51acd808e` docs: add prompt P-2026-10-03-1631

Measured by `lane-run merge` at 2026-10-03 17:30, trunk at `49957d340`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c482d7785`: zero conflicts.
- Files changed since the base: 10 on the branch side, 9 on the trunk side; on both sides: none.
- `git diff --name-only d2a1866b6 c482d7785 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1630_prompt_sim_polish.md` (eseguito 2026-10-03 · lane sim-polish · 26e05dba3 · (1) the cut tags are the R-SIM-90 attribute tags (120 px cap), now as wide as their name inside the strip, title on the name; role labels measured, none cut (widest Owned transitions 111 of 160 px) · (2) `assignedRoles`, line `N of M roles assigned` · (3) `stateHeading` in the new `simLabels.ts`: Marking for Petri, Configuration for control flow, panel, chips title, inspector and its σ-alone line · (4) `formPatch` derived or input to stored takes `defaultInitialOf` · (5) `spacePatch` presentation to semantic follows `initialFollowingDomain`; typecheck 14 (the §17 set), sim and simulation suites 1039/1039, build exit 0, mutation bench 22/22 killed; lane probe on 3076, four demo scenes, 1600×1000: dark 106 PASS 0 FAIL, light 105 PASS 1 FAIL (a reducer error at DemoPEST open, the same on HEAD); crops `~/.jjodel-lanes/P-2026-10-03-1630/` · verifica visiva della chat in attesa (RC-23) · non fuso).
- `git worktree list`: `sim-polish` in `/Users/alfonso/jjodel-w-simpolish`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-1730/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c482d7785` is the tip of `sim-polish`; the prompt files of the branch read `Status: eseguito` at `c482d7785`; `git worktree list` shows `sim-polish` only in `/Users/alfonso/jjodel-w-simpolish`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c482d7785` (measured above: zero conflicts). `git diff --name-only d2a1866b6 c482d7785 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d2a1866b6 alfonso-frontend-jjtl` with `git diff --name-only d2a1866b6 c482d7785` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-35` (trunk), `RC-36` (trunk), `RC-37` (trunk), `RC-38` (trunk), `RC-39` (trunk); control: `- **RC-40**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — fix: simulation UI polish, tags, roles line, state heading, initials (P-2026-10-03-1630)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — ticket: two console errors on the demo scenes predate the simulation UI` once (branch).
   - `docs/decisions.md`: the heading `### Decisione 2026-10-03: issue-driven unattended lanes (RC-35..RC-39)` once (trunk).
   - `docs/log-inbox/merge-gate.md`: the heading `## 2026-10-03 — fix: lane-run links node_modules for direct gates, warns on unflipped Status (P-2026-10-03-1631)` once (trunk).
   - `docs/log-inbox/merge-gate.md`: the heading `## 2026-10-03 — merge: lane-run-hygiene into alfonso-frontend-jjtl (P-2026-10-03-1650)` once (trunk).
4. `git merge --no-ff --no-commit c482d7785`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-polish into alfonso-frontend-jjtl (P-2026-10-03-1730)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c482d7785` in `/Users/alfonso/jjodel-w-simpolish`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 49957d340` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-polish merge (P-2026-10-03-1730)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simpolish`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
