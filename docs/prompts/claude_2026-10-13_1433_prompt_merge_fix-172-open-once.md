# Prompt: merge fix/172-open-once into staging

Prompt-ID: P-2026-10-13-1433
Chat: C-2026-10-13-1256
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-13 · lane merge · 0780366c3 · verifica visiva passata 2026-10-13 (passato: chat, unattended: the chat's independent probe (172b_independent.mts) rerun on the merged tree 0780366c3 on port 3190, 12/12, no page error: glyph + menu button = 1 on all 8 rows of the subject in the Data Manager, on the 2 of the inline child and on the 8 of the Configurator, no icon in a card whose row has a menu, the read-only row keeps one painted arrow, a click and Enter on the card and the menu's Open open the target; Juri's visual GO of 2026-10-13 was given on the lane tree)

Worktree: `/Users/juridirocco/development/jjodel`, branch `staging`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel` on `staging`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-13-1433 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7e774497c`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `fix/172-open-once` into the trunk with one merge commit, `--no-ff`, of the explicit sha `abb74f276`, in the shape of `e4421dc62` (the last merge commit on `staging`; read its body first). Merge base `7e774497c`. The branch carries, on top of the base, 4 commits:

- `abb74f276` docs(#172): lane closure, entry and Status (P-2026-10-13-1300)
- `4288e509c` fix(#172): a reference row shows Open once (P-2026-10-13-1300)
- `6036179cf` docs(#172): R-REF-7, a reference row shows Open once (P-2026-10-13-1300)
- `fbe0a4bad` docs: add prompt P-2026-10-13-1300, #172 a reference row shows Open once

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-13 14:33, trunk at `7e774497c`:

- `git merge-tree --write-tree --name-only staging abb74f276`: zero conflicts.
- Files changed since the base: 4 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 7e774497c abb74f276 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-13_1300_prompt_172_open_once.md` (eseguito 2026-10-13 · lane fix/172-open-once · 4288e509c · verifica visiva passata 2026-10-13).
- `git worktree list`: `fix/172-open-once` in `/Users/juridirocco/development/jjodel-172`; `staging` in `/Users/juridirocco/development/jjodel`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/juridirocco/.jjodel-lanes/P-2026-10-13-1433/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `abb74f276` is the tip of `fix/172-open-once`; the prompt files of the branch read `Status: eseguito` at `abb74f276`; `git worktree list` shows `fix/172-open-once` only in `/Users/juridirocco/development/jjodel-172`.
2. Measure again. `git merge-tree --write-tree --name-only staging abb74f276` (measured above: zero conflicts). `git diff --name-only 7e774497c abb74f276 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7e774497c staging` with `git diff --name-only 7e774497c abb74f276` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/data-manager-ux.md`: the heading `## 2026-10-13 — fix(#172): a reference row shows Open once` once (branch).
4. `git merge --no-ff --no-commit abb74f276`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: fix/172-open-once into staging (P-2026-10-13-1433)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `abb74f276` in `/Users/juridirocco/development/jjodel-172`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7e774497c` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/data-manager-ux.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the fix/172-open-once merge (P-2026-10-13-1433)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-172`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
