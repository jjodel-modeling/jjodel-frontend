# Prompt: merge sim-initial-default into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-1535
Chat: C-2026-10-03-1520
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-03 · lane merge · f614230e8 · verifica visiva passata 2026-10-03 (chat smoke on 3001: HTTP 200, the served stateAttributesCodec carries defaultInitialOf; all eight gates green; Alfonso look pending)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-1535 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cceec3f05`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-initial-default` into the trunk with one merge commit, `--no-ff`, of the explicit sha `095840d88`, in the shape of `aefaddcf5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `cceec3f05`. The branch carries, on top of the base, 3 commits:

- `095840d88` docs: Status flip and log entry for the initial default (P-2026-10-03-1520)
- `777a5da2f` fix(sim): a state attribute's initial value follows its domain (P-2026-10-03-1520)
- `4fd388c80` docs: add prompt P-2026-10-03-1520, initial value follows the domain

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-03 15:35, trunk at `cceec3f05`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 095840d88`: zero conflicts.
- Files changed since the base: 5 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only cceec3f05 095840d88 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1520_prompt_sim_initial_default.md` (eseguito 2026-10-03 · lane sim-initial-default · 777a5da2f · `defaultInitialOf` and `initialFollowingDomain` in `stateAttributesCodec.ts` (pure, tested), `patchOf` in `SimRolesModal.tsx` uses them (the model's State dialog shares it through `Declarations`; `simBridge.ts` untouched, new rows stay boolean `false`); typecheck 14 (the §17 set), sim and simulation suites 1022/1022, build exit 0, mutation bench 12/12 killed, lane probe on 3075 (light, 1600×1000, DemoESM) 17 PASS 0 FAIL: range 0..100 shows 0, min 5 shows 5, typed 7 kept at min 2, enum A, B shows A, boolean shows false, the model's State dialog follows too; crops `~/.jjodel-lanes/P-2026-10-03-1520/` · verifica visiva della chat in attesa (RC-23) · non fuso).
- `git worktree list`: `sim-initial-default` in `/Users/alfonso/jjodel-w-siminit`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-1535/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `095840d88` is the tip of `sim-initial-default`; the prompt files of the branch read `Status: eseguito` at `095840d88`; `git worktree list` shows `sim-initial-default` only in `/Users/alfonso/jjodel-w-siminit`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 095840d88` (measured above: zero conflicts). `git diff --name-only cceec3f05 095840d88 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only cceec3f05 alfonso-frontend-jjtl` with `git diff --name-only cceec3f05 095840d88` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — fix: a state attribute's initial value follows its domain (P-2026-10-03-1520)` once (branch).
4. `git merge --no-ff --no-commit 095840d88`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-initial-default into alfonso-frontend-jjtl (P-2026-10-03-1535)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `095840d88` in `/Users/alfonso/jjodel-w-siminit`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard cceec3f05` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-initial-default merge (P-2026-10-03-1535)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-siminit`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
