# Prompt: merge sim-random-l1 into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1933
Chat: C-2026-09-28-1936
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-09-29 · lane merge · 2d5a702b2 · verifica visiva passata 2026-09-29 (R-SIM-100 Random button, seeded draw, minimal trace; list 123.1, Step 854.5 unchanged)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1933 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `b256abc36`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-random-l1` into the trunk with one merge commit, `--no-ff`, of the explicit sha `69b370973`, in the shape of `f7c5fd910` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `70b580af4`. The branch carries, on top of the base, 6 commits:

- `69b370973` docs: R-SIM-100, the demo's list lines, log entry and Status (P-2026-09-29-1840)
- `3cbfbc15b` feat(sim): the Random button right of Cancel on an ε list (P-2026-09-29-1840)
- `25acfefe6` feat(sim): Random on an ε list, the run's seed at Reset (P-2026-09-29-1840)
- `7a00d5af7` feat(sim): the run's seed, draw count and trace in the store (P-2026-09-29-1840)
- `f10af6812` feat(sim): simRandom, the seeded draw among candidates (P-2026-09-29-1840)
- `d1b5d013d` docs(prompts): P-2026-09-29-1840 random choice Part 1, R-SIM-100

The trunk carries, since the base, 10 commits:

- `b256abc36` docs: Status flip and log entry for the symbol-tab-modal merge (P-2026-09-29-1925)
- `f7c5fd910` merge: symbol-tab-modal into alfonso-frontend-jjtl (P-2026-09-29-1925)
- `179dbe973` docs: add prompt P-2026-09-29-1925, merge symbol-tab-modal into alfonso-frontend-jjtl
- `a4d9c7ab3` docs: closure of the symbol tab lane, entry, ticket and Status (P-2026-09-29-1826)
- `6e606fa3d` fix(editors): rail tab padding 10px -> 8px so the vertex bar fits (P-2026-09-29-1826)
- `25d350167` fix(authoring): Symbol tab icon takes the label colour (P-2026-09-29-1826)
- `90e41df6a` feat(authoring): relabel Form tab as Layout (P-2026-09-29-1826)
- `f8bd58ae0` feat(authoring): open Symbol Editor directly from the Symbol tab (P-2026-09-29-1826)
- `8ca549c5d` docs: discovery for the Symbol tab opening the modal (P-2026-09-29-1826)
- `d1e435da4` docs: add prompt P-2026-09-29-1826, symbol tab opens modal

Measured by `lane-run merge` at 2026-09-29 19:33, trunk at `b256abc36`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 69b370973`: zero conflicts.
- Files changed since the base: 12 on the branch side, 8 on the trunk side; on both sides: none.
- `git diff --name-only 70b580af4 69b370973 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1840_prompt_sim_random_l1.md` (eseguito 2026-09-29 · lane sim-random-l1 · f10af6812, 7a00d5af7, 25acfefe6, 3cbfbc15b · non fuso: hard-stop, lane probe on 3057 (light), Petri step 1 list 123.1 px and Step 854.5 open and closed, Random right of Cancel, «Last step: ε (random): …» with the seed in its title, t2's line unclamped, sm/esm/flowB run readings identical to 09-29c, crop in docs/discovery/harness/_tmp_randl1_*.png (gitignored), R-SIM-100 nel commit docs, verifica visiva alla chat).
- `git worktree list`: `sim-random-l1` in `/Users/alfonso/jjodel-w-randl1`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1933/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `69b370973` is the tip of `sim-random-l1`; the prompt files of the branch read `Status: eseguito` at `69b370973`; `git worktree list` shows `sim-random-l1` only in `/Users/alfonso/jjodel-w-randl1`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 69b370973` (measured above: zero conflicts). `git diff --name-only 70b580af4 69b370973 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 70b580af4 alfonso-frontend-jjtl` with `git diff --name-only 70b580af4 69b370973` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-100` (branch); control: `- **R-SIM-101**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: Random on an ε choice, a seeded draw, the minimal trace, R-SIM-100 (P-2026-09-29-1840)` once (branch).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: Symbol Editor Border swatch paints black for a CSS-variable colour` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — feat(authoring): the Symbol tab opens the Symbol Editor, Form becomes Layout (P-2026-09-29-1826)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: symbol-tab-modal into alfonso-frontend-jjtl (P-2026-09-29-1925)` once (trunk).
4. `git merge --no-ff --no-commit 69b370973`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-random-l1 into alfonso-frontend-jjtl (P-2026-09-29-1933)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `69b370973` in `/Users/alfonso/jjodel-w-randl1`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard b256abc36` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-random-l1 merge (P-2026-09-29-1933)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-randl1`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
