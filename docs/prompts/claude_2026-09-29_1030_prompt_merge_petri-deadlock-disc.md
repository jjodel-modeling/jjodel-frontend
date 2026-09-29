# Prompt: merge petri-deadlock-disc into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1030
Chat: C-2026-09-28-1936
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-09-29 · lane merge · 2cffb33a4 · verifica visiva passata 2026-09-29 (docs only, the false-deadlock discovery: not a bug, the guard; its prompt file is named _0948_ and carries ID P-2026-09-29-0955)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1030 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `694049a1e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `petri-deadlock-disc` into the trunk with one merge commit, `--no-ff`, of the explicit sha `315ed2377`, in the shape of `0fbb550ea` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `385807485`. The branch carries, on top of the base, 2 commits:

- `315ed2377` docs: petri false deadlock is the guard, discovery (P-2026-09-29-0955)
- `a6afeb72e` docs(prompts): P-2026-09-29-0955 discovery petri false deadlock

The trunk carries, since the base, 9 commits:

- `694049a1e` docs: Status flip and log entry for the petri-notation-l1 merge (P-2026-09-29-1006)
- `0fbb550ea` merge: petri-notation-l1 into alfonso-frontend-jjtl (P-2026-09-29-1006)
- `ecd875dc3` docs: add prompt P-2026-09-29-1006, merge petri-notation-l1 into alfonso-frontend-jjtl
- `a6372cdf7` docs(views): R-VP-15, log entry and Status of Petri notation lane 1 (P-2026-09-29-0939)
- `3a1753b73` feat(views): the Petri notation in the derived viewpoint, lane 1 (P-2026-09-29-0939)
- `1cee1e7e4` feat(ir): token markers dots-2, dots-3, dots-4 (P-2026-09-29-0939)
- `e5010856c` docs(prompts): P-2026-09-29-0939 petri notation lane 1
- `f9c1b8d52` docs(views): Petri notation discovery, log entry, Status (P-2026-09-29-0925)
- `103ada238` docs(prompts): P-2026-09-29-0925 discovery petri notation

Measured by `lane-run merge` at 2026-09-29 10:30, trunk at `694049a1e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 315ed2377`: zero conflicts.
- Files changed since the base: 3 on the branch side, 10 on the trunk side; on both sides: none.
- `git diff --name-only 385807485 315ed2377 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_0948_prompt_discovery_petri_false_deadlock.md` (eseguito 2026-09-29 · lane discovery petri-deadlock-disc · measured on a6afeb72e; the report is in the commit that carries this line (a commit cannot name its own sha) · Outcome: hard-stop).
- `git worktree list`: `petri-deadlock-disc` in `/Users/alfonso/jjodel-w-petridl`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1030/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `315ed2377` is the tip of `petri-deadlock-disc`; the prompt files of the branch read `Status: eseguito` at `315ed2377`; `git worktree list` shows `petri-deadlock-disc` only in `/Users/alfonso/jjodel-w-petridl`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 315ed2377` (measured above: zero conflicts). `git diff --name-only 385807485 315ed2377 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 385807485 alfonso-frontend-jjtl` with `git diff --name-only 385807485 315ed2377` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-15` (trunk); control: `- **R-VP-16**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — discovery: a reported false deadlock on a DemoPetri-like net is the guard (P-2026-09-29-0955)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, the classic Petri net notation in the derived viewpoint (P-2026-09-29-0925)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): the Petri notation in the derived viewpoint, lane 1 (P-2026-09-29-0939)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: petri-notation-l1 into alfonso-frontend-jjtl (P-2026-09-29-1006)` once (trunk).
4. `git merge --no-ff --no-commit 315ed2377`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: petri-deadlock-disc into alfonso-frontend-jjtl (P-2026-09-29-1030)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `315ed2377` in `/Users/alfonso/jjodel-w-petridl`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 694049a1e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the petri-deadlock-disc merge (P-2026-09-29-1030)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-petridl`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
