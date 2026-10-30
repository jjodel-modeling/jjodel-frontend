# Prompt: merge feat/186-customize-element into staging

Prompt-ID: P-2026-10-29-1720
Chat: C-2026-10-14-1020
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-29 · lane merge · b5e914168 · verifica visiva passata 2026-10-29 (passato: sonde della chat sul tree unito (vite 3190, staging b5e914168): chat_186c_independent 13/13 (lettori in schede nuove), chat_187d_independent 10/10, chat_187_independent 12/12, chat_186b_independent 9/9 ALL GREEN, nessun errore di pagina)

Worktree: `/Users/juridirocco/development/jjodel`, branch `staging`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel` on `staging`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-29-1720 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `a334addac`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `feat/186-customize-element` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b1d105144`, in the shape of `1beb964eb` (the last merge commit on `staging`; read its body first). Merge base `a334addac`. The branch carries, on top of the base, 12 commits:

- `b1d105144` docs(#186): lane closure, entry and Status (P-2026-10-17-1053)
- `57c5e8e27` feat(#186): Customize element in Roles, the popup (P-2026-10-17-1053)
- `008991364` feat(#186): the Configurator panel reads the role's presentation (P-2026-10-17-1053)
- `c34713aac` docs: Status flip and log entry, feat/186-customize-element took trunk (P-2026-10-27-1449)
- `87b540ece` merge: feat/186-customize-element takes staging (P-2026-10-27-1449)
- `385480445` docs: add prompt P-2026-10-27-1449, merge staging into feat/186-customize-element
- `23be59136` docs(#186): LIR addendum, the emitted field measured (P-2026-10-17-1053)
- `f2867dc3d` feat(#186): optional typePresentation on DProfile (P-2026-10-17-1053)
- `20c8b4a54` docs(#186): Layer Impact Report, typePresentation on DProfile (P-2026-10-17-1053)
- `492546b1c` feat(#186): typePresentation helpers and CSS sanitiser (P-2026-10-17-1053)
- `28467e73f` docs(#186): Phase 1 report on Customize element (P-2026-10-17-1053)
- `2c1e694e4` docs: add prompt P-2026-10-17-1053, #186 Customize element

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-29 17:20, trunk at `a334addac`:

- `git merge-tree --write-tree --name-only staging b1d105144`: zero conflicts.
- Files changed since the base: 19 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only a334addac b1d105144 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-17_1053_prompt_186_customize_element.md` (eseguito 2026-10-29 · lane customize-element · 57c5e8e27 · verifica visiva passata 2026-10-29), `claude_2026-10-27_1449_prompt_feat-186-customize-element_take_trunk.md` (eseguito 2026-10-28 · lane feat/186-customize-element · 87b540ece · verifica visiva passata 2026-10-28 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `feat/186-customize-element` in `/Users/juridirocco/development/jjodel-186c`; `staging` in `/Users/juridirocco/development/jjodel`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/juridirocco/.jjodel-lanes/P-2026-10-29-1720/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b1d105144` is the tip of `feat/186-customize-element`; the prompt files of the branch read `Status: eseguito` at `b1d105144`; `git worktree list` shows `feat/186-customize-element` only in `/Users/juridirocco/development/jjodel-186c`.
2. Measure again. `git merge-tree --write-tree --name-only staging b1d105144` (measured above: zero conflicts). `git diff --name-only a334addac b1d105144 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only a334addac staging` with `git diff --name-only a334addac b1d105144` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/customize-element.md`: the heading `## 2026-10-28 — merge: feat/186-customize-element takes staging (P-2026-10-27-1449)` once (branch).
   - `docs/log-inbox/customize-element.md`: the heading `## 2026-10-29 — feat(#186): Customize element, the per-role presentation of a type` once (branch).
4. `git merge --no-ff --no-commit b1d105144`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: feat/186-customize-element into staging (P-2026-10-29-1720)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b1d105144` in `/Users/juridirocco/development/jjodel-186c`, read-only, `node /Users/juridirocco/development/jjodel/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/juridirocco/development/jjodel-186c`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard a334addac` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/customize-element.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the feat/186-customize-element merge (P-2026-10-29-1720)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-186c`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
