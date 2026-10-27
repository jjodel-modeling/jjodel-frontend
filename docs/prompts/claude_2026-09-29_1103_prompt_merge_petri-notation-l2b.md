# Prompt: merge petri-notation-l2b into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1103
Chat: C-2026-09-28-1936
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: eseguito 2026-09-29 · lane merge · faa3cd66f · verifica visiva passata 2026-09-29 (four demo scenes re-run on faa3cd66f port 3045: 73 readings identical to 09-29c; derived DemoPetri: no token marks, centred names, 48x12 bar, orthogonal arcs)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1103 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cd2b5fec9`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `petri-notation-l2b` into the trunk with one merge commit, `--no-ff`, of the explicit sha `59b4245c0`, in the shape of `7fec9c966` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `0fbb550ea`. The branch carries, on top of the base, 4 commits:

- `59b4245c0` docs(views): R-VP-16, log entry and Status of the revised Petri lane (P-2026-09-29-1021)
- `7a254a52f` feat(views): Petri notation revised, centred names, bar, Manhattan (P-2026-09-29-1021)
- `449c583b6` feat(ir): the bar form, a thin fixed box for the Petri transition (P-2026-09-29-1021)
- `22efe0670` docs(prompts): P-2026-09-29-1021 petri notation lane 2 revised

The trunk carries, since the base, 12 commits:

- `cd2b5fec9` docs: Status flip and log entry for the sim-guard-word merge (P-2026-09-29-1045)
- `7fec9c966` merge: sim-guard-word into alfonso-frontend-jjtl (P-2026-09-29-1045)
- `204a36112` docs: add prompt P-2026-09-29-1045, merge sim-guard-word into alfonso-frontend-jjtl
- `b5680b43f` docs: Status flip and log entry for the petri-deadlock-disc merge (P-2026-09-29-1030)
- `423e3a021` docs(sim): R-SIM-96, demo script lines, log entry, Status (P-2026-09-29-1022)
- `6964c1511` fix(sim): the deadlock reason names the guard, t2 guard false (P-2026-09-29-1022)
- `2cffb33a4` merge: petri-deadlock-disc into alfonso-frontend-jjtl (P-2026-09-29-1030)
- `c2a79830d` docs: add prompt P-2026-09-29-1030, merge petri-deadlock-disc into alfonso-frontend-jjtl
- `694049a1e` docs: Status flip and log entry for the petri-notation-l1 merge (P-2026-09-29-1006)
- `1419bb26a` docs(prompts): P-2026-09-29-1022 guard word in the deadlock reason
- `315ed2377` docs: petri false deadlock is the guard, discovery (P-2026-09-29-0955)
- `a6afeb72e` docs(prompts): P-2026-09-29-0955 discovery petri false deadlock

Measured by `lane-run merge` at 2026-09-29 11:03, trunk at `cd2b5fec9`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 59b4245c0`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 11 on the branch side, 12 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`.
- `git diff --name-only 0fbb550ea 59b4245c0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1021_prompt_petri_notation_l2b.md` (eseguito 2026-09-29 · lane petri-notation-l2b · 449c583b6, 7a254a52f · non fuso: hard-stop, lane probe 21/21 on 3048 (light), bar 48×12 against a place 64×64, names centred within 0.45 px, arcs orthogonal 6/6, run readings equal to the trunk's, crops in docs/discovery/harness/_tmp_petri2b_*.png (gitignored), verifica visiva alla chat).
- `git worktree list`: `petri-notation-l2b` in `/Users/alfonso/jjodel-w-petri2b`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1103/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `59b4245c0` is the tip of `petri-notation-l2b`; the prompt files of the branch read `Status: eseguito` at `59b4245c0`; `git worktree list` shows `petri-notation-l2b` only in `/Users/alfonso/jjodel-w-petri2b`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 59b4245c0` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 0fbb550ea 59b4245c0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 0fbb550ea alfonso-frontend-jjtl` with `git diff --name-only 0fbb550ea 59b4245c0` (measured above: `docs/decisions.md`, `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-16` (branch), `R-SIM-96` (trunk); control: `- **R-SIM-97**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): the Petri notation revised, no token marks, centred names, bar, Manhattan (P-2026-09-29-1021)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a `bar` view in the Symbol Editor reads «Custom» and has no Shape option` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — discovery: a reported false deadlock on a DemoPetri-like net is the guard (P-2026-09-29-0955)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: petri-deadlock-disc into alfonso-frontend-jjtl (P-2026-09-29-1030)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — fix: the deadlock reason names the guard, R-SIM-96 (P-2026-09-29-1022)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-guard-word into alfonso-frontend-jjtl (P-2026-09-29-1045)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: petri-notation-l1 into alfonso-frontend-jjtl (P-2026-09-29-1006)` once (trunk).
4. `git merge --no-ff --no-commit 59b4245c0`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: petri-notation-l2b into alfonso-frontend-jjtl (P-2026-09-29-1103)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `59b4245c0` in `/Users/alfonso/jjodel-w-petri2b`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard cd2b5fec9` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the petri-notation-l2b merge (P-2026-09-29-1103)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-petri2b`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
