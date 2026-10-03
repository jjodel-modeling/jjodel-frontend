# Prompt: merge derived-notations-polish into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-1405
Chat: —
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-1405 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c56f4fc63`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `derived-notations-polish` into the trunk with one merge commit, `--no-ff`, of the explicit sha `839b8fbf3`, in the shape of `c927f4be1` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `c56f4fc63`. The branch carries, on top of the base, 10 commits:

- `839b8fbf3` docs: Status flip, log entry and report addendum, notations polish a (P-2026-10-03-1300)
- `a3a94f230` test(derive): derived notations polish a, one block per item (P-2026-10-03-1300)
- `79e4caf6d` feat(derive): flowchart fork and join are Activity's solid ink bar (P-2026-10-03-1300)
- `26fca4b5e` feat(derive): guards in mono, and role-keyed attribute rows too (P-2026-10-03-1300)
- `84e9dbdb4` feat(derive): flowchart Initial and Terminal are 20 and 24 px (P-2026-10-03-1300)
- `94849c6b3` feat(derive): Petri bars are 56 by 12 and the name sits outside (P-2026-10-03-1300)
- `c5e879925` feat(derive): State machine draws as Statechart and is hidden (P-2026-10-03-1300)
- `d55e87af8` fix(derive): leave the name row out when the title shows it (P-2026-10-03-1300)
- `5e536da10` docs: discovery report for derived notations polish a (P-2026-10-03-1300)
- `2e75c44ca` docs: prompt for derived_notations_polish_a (P-2026-10-03-1300)

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-03 14:05, trunk at `c56f4fc63`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 839b8fbf3`: zero conflicts.
- Files changed since the base: 15 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only c56f4fc63 839b8fbf3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1300_prompt_derived_notations_polish_a.md` (eseguito 2026-10-03 · lane derived-notations-polish · a3a94f230 · non fuso: hard-stop, the six items measured on 3021 (light and dark), 53 new tests, mutation bench 32/33, visual GO pending; dev server left on 3021).
- `git worktree list`: `derived-notations-polish` in `/Users/alfonso/jjodel-w-dnotA`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `839b8fbf3` is the tip of `derived-notations-polish`; the prompt files of the branch read `Status: eseguito` at `839b8fbf3`; `git worktree list` shows `derived-notations-polish` only in `/Users/alfonso/jjodel-w-dnotA`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 839b8fbf3` (measured above: zero conflicts). `git diff --name-only c56f4fc63 839b8fbf3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only c56f4fc63 alfonso-frontend-jjtl` with `git diff --name-only c56f4fc63 839b8fbf3` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — feat(derive): derived notations polish, pass 1 (P-2026-10-03-1300)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — ticket: npm run build leaves the dev server of the same tree stale` once (branch).
4. `git merge --no-ff --no-commit 839b8fbf3`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: derived-notations-polish into alfonso-frontend-jjtl (P-2026-10-03-1405)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `839b8fbf3` in `/Users/alfonso/jjodel-w-dnotA`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c56f4fc63` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the derived-notations-polish merge (P-2026-10-03-1405)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-dnotA`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
