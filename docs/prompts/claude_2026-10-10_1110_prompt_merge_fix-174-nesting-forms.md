# Prompt: merge fix/174-nesting-forms into staging

Prompt-ID: P-2026-10-10-1110
Chat: C-2026-10-07-0948
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/juridirocco/development/jjodel`, branch `staging`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel` on `staging`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1110 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `e635f8723`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `fix/174-nesting-forms` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a54e771d6`, in the shape of `c9b20cd05` (the last merge commit on `staging`; read its body first). Merge base `e635f8723`. The branch carries, on top of the base, 15 commits:

- `a54e771d6` docs(#174): R-JS-12 amended, WOULD_ORPHAN unreachable (P-2026-10-07-0950)
- `bcee745ed` docs(#174): lane closure, entry, tickets and Status (P-2026-10-07-0950)
- `948ea2884` fix(#174): every load purges dead graph elements (P-2026-10-07-0950)
- `9cbd94af9` docs(#174): Layer Impact Report for the load purge (P-2026-10-07-0950)
- `bff8ce497` fix(#174): a deleted element takes its canvas vertices (P-2026-10-07-0950)
- `20c520c98` docs(#174): R-NEST-7 and R-NEST-8, ghost vertices (P-2026-10-07-0950)
- `4e6c32675` docs(#174): ghost vertices addendum, the history merge (P-2026-10-07-0950)
- `57522986b` docs(#174): ghost vertices addendum to the Phase 1 report (P-2026-10-07-0950)
- `352758aa2` fix(#174): migration 2.229 -> 2.230 lists every instance (P-2026-10-07-0950)
- `f0ce63451` docs(#174): Layer Impact Report for the migration (P-2026-10-07-0950)
- `0aff0d6df` fix(#174): a container's delete takes what its slots own (P-2026-10-07-0950)
- `5995167ba` fix(#174): every instance is listed by its model (P-2026-10-07-0950)
- `b9291259f` fix(#174): roots are a filter on father (P-2026-10-07-0950)
- `6133786cd` docs(#174): R-NEST-1..6 and the memo of Juri's decisions (P-2026-10-07-0950)
- `5bdb45e89` docs(#174): Phase 1 report on the two nesting forms (P-2026-10-07-0950)

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-10 11:10, trunk at `e635f8723`:

- `git merge-tree --write-tree --name-only staging a54e771d6`: zero conflicts.
- Files changed since the base: 18 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only e635f8723 a54e771d6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `fix/174-nesting-forms` in `/Users/juridirocco/development/jjodel-174`; `staging` in `/Users/juridirocco/development/jjodel`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/juridirocco/.jjodel-lanes/P-2026-10-10-1110/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a54e771d6` is the tip of `fix/174-nesting-forms`; the prompt files of the branch read `Status: eseguito` at `a54e771d6`; `git worktree list` shows `fix/174-nesting-forms` only in `/Users/juridirocco/development/jjodel-174`.
2. Measure again. `git merge-tree --write-tree --name-only staging a54e771d6` (measured above: zero conflicts). `git diff --name-only e635f8723 a54e771d6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only e635f8723 staging` with `git diff --name-only e635f8723 a54e771d6` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`: the heading `## R-NEST — one nesting form in the core (#174, decision 2026-10-07)` once (branch).
   - `docs/log-inbox/core-nesting-forms.md`: the heading `## 2026-10-10 — fix(#174): una sola forma di annidamento, espulsione senza orfani, cascata (b) di #171, migrazione 2.230, vertici fantasma` once (branch).
   - `docs/log-inbox/core-nesting-forms.md`: the heading `## 2026-10-10 — ticket: la fusione della cronologia nel reducer perde i record di ciò che fonde` once (branch).
   - `docs/log-inbox/core-nesting-forms.md`: the heading `## 2026-10-08 — ticket: lane-run status riporta l'Outcome di una run precedente quando la run ripresa muore sul limite d'uso` once (branch).
   - `docs/log-inbox/core-nesting-forms.md`: the heading `## 2026-10-08 — ticket: una Ctrl+Z dopo il connect del canvas lascia il figlio padrato da uno slot che non lo elenca` once (branch).
   - `docs/log-inbox/core-nesting-forms.md`: the heading `## 2026-10-08 — ticket: errore di pagina in reducer.ts:1115 quando una Ctrl+Z annulla la cancellazione di un riferimento M2` once (branch).
   - `docs/log-inbox/core-nesting-forms.md`: the heading `## 2026-10-08 — ticket: «New … & link» su una composizione lascia una radice che lo slot elenca` once (branch).
4. `git merge --no-ff --no-commit a54e771d6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: fix/174-nesting-forms into staging (P-2026-10-10-1110)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a54e771d6` in `/Users/juridirocco/development/jjodel-174`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard e635f8723` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/core-nesting-forms.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the fix/174-nesting-forms merge (P-2026-10-10-1110)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-174`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
