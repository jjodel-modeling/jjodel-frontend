# Prompt: merge sim-mixin-owner into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-2250
Chat: C-2026-09-28-1936
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-09-28 · lane merge · 2d73c73d5 · probe della chat passate (quattro scene in chiaro identiche al trunk); giro di Alfonso su 3001 da fare; closed by hand: the worker stopped on the 6 vitest reds already on the receiving tip

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-2250 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `95ff2ae75`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-mixin-owner` into the trunk with one merge commit, `--no-ff`, of the explicit sha `27b2090db`, in the shape of `d3dbacb36` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d3dbacb36`. The branch carries, on top of the base, 5 commits:

- `27b2090db` docs: R-SIM-90, Entry, Exit, Action and Guard multi-valued (ratified, deferred after MODELS)
- `5c8270c97` docs: log entry and Status flip, R-SIM-89 mixin owner fix (P-2026-09-28-2230)
- `68dbbc1fb` fix(sim): a mixin owner's feature warns, not incompatible (R-SIM-89) (P-2026-09-28-2230)
- `18e63e184` docs: discovery report, R-SIM-89 mixin verdict table before/after (P-2026-09-28-2230)
- `8296abeb1` docs: R-SIM-89 (mixin owners, ratified) and prompt P-2026-09-28-2230

The trunk carries, since the base, 2 commits:

- `95ff2ae75` docs: RC-33 (the Chat: line) and RC-34 (add-only gate) in decisions and P16
- `8082dbd55` docs: Status flip and log entry for the log-addonly-gate merge (P-2026-09-28-2211)

Measured by `lane-run merge` at 2026-09-28 22:50, trunk at `95ff2ae75`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 27b2090db`: zero conflicts.
- Files changed since the base: 7 on the branch side, 4 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only d3dbacb36 27b2090db -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_2230_prompt_sim_mixin_owner.md` (eseguito 2026-09-28 · lane sim-mixin-owner · 68dbbc1fb (fix), 18e63e184 (discovery) · verifica visiva non eseguita da questa sessione (il prompt vieta dev server/probe qui: le quattro scene demo restano da verificare alla chat prima del merge)).
- `git worktree list`: `sim-mixin-owner` in `/Users/alfonso/jjodel-w-mixin`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-28-2250/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `27b2090db` is the tip of `sim-mixin-owner`; the prompt files of the branch read `Status: eseguito` at `27b2090db`; `git worktree list` shows `sim-mixin-owner` only in `/Users/alfonso/jjodel-w-mixin`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 27b2090db` (measured above: zero conflicts). `git diff --name-only d3dbacb36 27b2090db -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d3dbacb36 alfonso-frontend-jjtl` with `git diff --name-only d3dbacb36 27b2090db` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-89` (branch), `R-SIM-90` (branch), `RC-33` (trunk), `RC-34` (trunk); control: `- **RC-35**` none.
   - `docs/decisions.md`: the heading `### Decisions 2026-09-28 (evening): mixin owners in the roles dialog (R-SIM-89)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: mixin owner is a warning, not incompatible (R-SIM-89) (P-2026-09-28-2230)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — merge: log-addonly-gate into alfonso-frontend-jjtl (P-2026-09-28-2211)` once (trunk).
4. `git merge --no-ff --no-commit 27b2090db`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-mixin-owner into alfonso-frontend-jjtl (P-2026-09-28-2250)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `27b2090db` in `/Users/alfonso/jjodel-w-mixin`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 95ff2ae75` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-mixin-owner merge (P-2026-09-28-2250)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mixin`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
