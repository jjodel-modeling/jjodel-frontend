# Prompt: merge ratify-provisional into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1559
Chat: C-2026-10-10-1145
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-11 · lane merge · c6804f3d3 · verifica visiva passata 2026-10-11 (docs-only merge (ratifications), no visual change)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1559 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `88627f711`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ratify-provisional` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d7a251297`, in the shape of `87d05057c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `88627f711`. The branch carries, on top of the base, 1 commit:

- `d7a251297` docs(decisions): ratify 76 rows, amend R-SIM-120, R-VP-29, fix headers (P-2026-10-11-1540)

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-11 15:59, trunk at `88627f711`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d7a251297`: zero conflicts.
- Files changed since the base: 2 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 88627f711 d7a251297 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `ratify-provisional` in `/Users/alfonso/jjodel-w-ratify`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1559/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d7a251297` is the tip of `ratify-provisional`; the prompt files of the branch read `Status: eseguito` at `d7a251297`; `git worktree list` shows `ratify-provisional` only in `/Users/alfonso/jjodel-w-ratify`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d7a251297` (measured above: zero conflicts). `git diff --name-only 88627f711 d7a251297 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 88627f711 alfonso-frontend-jjtl` with `git diff --name-only 88627f711 d7a251297` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-ESEL-1` (branch), `R-ESEL-2` (branch), `R-ESEL-3` (branch), `R-ESEL-4` (branch), `R-ESEL-5` (branch), `R-IRN-38` (branch), `R-IRN-40` (branch), `R-IRN-39` (branch), `R-IRN-41` (branch), `R-SIM-67` (branch), `R-SIM-111` (branch), `R-SIM-112` (branch), `R-SIM-113` (branch), `R-SIM-115` (branch), `R-SIM-116` (branch), `R-SIM-117` (branch), `R-SIM-118` (branch), `R-SIM-119` (branch), `R-SIM-120` (branch), `R-SIM-121` (branch), `R-SIM-122` (branch), `R-SIM-123` (branch), `R-SIM-124` (branch), `R-SIM-125` (branch), `R-SIM-126` (branch), `R-SIM-127` (branch), `R-SIM-128` (branch), `R-SIM-129` (branch), `R-SIM-130` (branch), `R-SIM-131` (branch), `R-SIM-132` (branch), `R-SIM-133` (branch), `R-SIM-134` (branch), `R-SIM-135` (branch), `R-SIM-136` (branch), `R-SIM-137` (branch), `R-SIM-138` (branch), `R-SIM-139` (branch), `R-SIM-140` (branch), `R-UNDO-8` (branch), `R-VP-27` (branch), `R-VP-28` (branch), `R-VP-29` (branch), `R-VP-30` (branch), `R-VP-31` (branch), `R-VP-19` (branch), `R-VP-20` (branch), `R-VP-21` (branch), `R-VP-22` (branch), `R-VP-23` (branch), `R-VP-32` (branch), `R-VP-33` (branch), `R-VP-34` (branch), `R-VP-35` (branch), `R-VP-37` (branch), `R-VP-38` (branch), `R-VP-39` (branch), `R-VP-40` (branch), `R-VP-41` (branch), `R-VP-42` (branch), `R-VP-43` (branch), `R-VP-44` (branch), `R-VP-45` (branch), `R-VP-46` (branch), `R-VP-47` (branch), `R-VP-54` (branch), `R-VP-55` (branch), `R-VP-56` (branch), `R-VP-57` (branch), `R-EE-1` (branch), `R-EE-2` (branch), `R-EE-3` (branch), `R-EE-4` (branch), `R-JS-2` (branch), `R-JS-3` (branch), `R-JS-4` (branch), `R-JS-5` (branch), `R-JS-6` (branch), `R-JS-7` (branch), `R-JS-8` (branch), `R-JS-9` (branch), `R-JS-10` (branch), `R-JS-11` (branch), `R-GOAL-1` (branch), `R-GEN-1` (branch), `R-GEN-2` (branch), `R-GEN-3` (branch), `R-GEN-4` (branch), `R-GEN-5` (branch), `R-GEN-6` (branch), `R-GEN-7` (branch), `R-GEN-8` (branch), `R-GEN-9` (branch), `R-GEN-10` (branch), `R-GEN-11` (branch), `R-GEN-12` (branch), `R-GEN-13` (branch), `R-GEN-14` (branch), `R-GEN-15` (branch), `R-GEN-16` (branch), `R-GEN-17` (branch), `R-GV-15` (branch), `R-GV-16` (branch); control: `- **R-GV-17**` none.
4. `git merge --no-ff --no-commit d7a251297`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ratify-provisional into alfonso-frontend-jjtl (P-2026-10-11-1559)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d7a251297` in `/Users/alfonso/jjodel-w-ratify`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 88627f711` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to none), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ratify-provisional merge (P-2026-10-11-1559)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ratify`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
