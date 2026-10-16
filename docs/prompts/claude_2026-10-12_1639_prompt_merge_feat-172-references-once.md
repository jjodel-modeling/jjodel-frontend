# Prompt: merge feat/172-references-once into staging

Prompt-ID: P-2026-10-12-1639
Chat: C-2026-10-10-1540
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-12 · lane merge · 26c795f80 · verifica visiva passata 2026-10-12 (the chat's independent probe (172_independent.mts) rerun on the merged tree on port 3173, 18/18, no page error: 0 form fields and 1 section per reference, the row menu by kind of slot, Remove leaves a hole, Link existing, the upper bound, the inline child; Juri's visual GO of 2026-10-12 was given on the lane tree, 9/9)

Worktree: `/Users/juridirocco/development/jjodel`, branch `staging`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel` on `staging`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-12-1639 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `094c82bab`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `feat/172-references-once` into the trunk with one merge commit, `--no-ff`, of the explicit sha `6bad24e94`, in the shape of `7cb73d3e2` (the last merge commit on `staging`; read its body first). Merge base `094c82bab`. The branch carries, on top of the base, 8 commits:

- `6bad24e94` docs(#172): lane closure, entry and Status (P-2026-10-10-1545)
- `6cc99ca73` feat(#172): reference fields leave the detail's form (P-2026-10-10-1545)
- `eddc5b2ad` docs(#172): Layer Impact Report for the IRForm.tsx step (P-2026-10-10-1545)
- `7fb4c2fb5` feat(#172): the reference section links, changes and removes (P-2026-10-10-1545)
- `3a7543c1e` feat(#172): the rule of a reference slot's controls (P-2026-10-10-1545)
- `32c3f1dc4` docs(#172): decision rows R-REF-1..6 and the memo (P-2026-10-10-1545)
- `372da459a` docs(#172): addendum on the row's menu (P-2026-10-10-1545)
- `b9a9be322` docs(#172): Phase 1 report on showing a reference once (P-2026-10-10-1545)

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-12 16:39, trunk at `094c82bab`:

- `git merge-tree --write-tree --name-only staging 6bad24e94`: zero conflicts.
- Files changed since the base: 14 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 094c82bab 6bad24e94 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `feat/172-references-once` in `/Users/juridirocco/development/jjodel-172`; `staging` in `/Users/juridirocco/development/jjodel`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/juridirocco/.jjodel-lanes/P-2026-10-12-1639/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `6bad24e94` is the tip of `feat/172-references-once`; the prompt files of the branch read `Status: eseguito` at `6bad24e94`; `git worktree list` shows `feat/172-references-once` only in `/Users/juridirocco/development/jjodel-172`.
2. Measure again. `git merge-tree --write-tree --name-only staging 6bad24e94` (measured above: zero conflicts). `git diff --name-only 094c82bab 6bad24e94 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 094c82bab staging` with `git diff --name-only 094c82bab 6bad24e94` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`: the heading `## R-REF — a reference appears once in the instance detail (#172, decision 2026-10-12)` once (branch).
   - `docs/log-inbox/data-manager-ux.md`: the heading `## 2026-10-12 — feat(#172): a reference appears once in the instance detail, as its section` once (branch).
   - `docs/log-inbox/data-manager-ux.md`: the heading `## 2026-10-12 — ticket: form field, a 0..1 reference ends with two targets after an unset and a «New … & link»` once (branch).
   - `docs/log-inbox/data-manager-ux.md`: the heading `## 2026-10-12 — ticket: the chip picker of a multi-valued reference offers a target the slot already holds` once (branch).
   - `docs/log-inbox/data-manager-ux.md`: the heading `## 2026-10-12 — ticket: under a profile, «Link existing <Type>» opens an empty picker when the profile filters every candidate` once (branch).
4. `git merge --no-ff --no-commit 6bad24e94`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: feat/172-references-once into staging (P-2026-10-12-1639)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `6bad24e94` in `/Users/juridirocco/development/jjodel-172`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 094c82bab` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/data-manager-ux.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the feat/172-references-once merge (P-2026-10-12-1639)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-172`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
