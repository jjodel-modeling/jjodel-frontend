# Prompt: merge new-model-instantiate into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1750
Chat: —
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1750 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `44395bf59`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `new-model-instantiate` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c6b060ef1`, in the shape of `9cc9c7c83` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `dfea753d4`. The branch carries, on top of the base, 10 commits:

- `c6b060ef1` docs: flip status of P-2026-10-11-1716
- `f1b0e485b` merge: new-model-instantiate takes alfonso-frontend-jjtl (P-2026-10-11-1716)
- `adebf2f32` docs: add prompt P-2026-10-11-1716, merge alfonso-frontend-jjtl into new-model-instantiate
- `91a5f2e31` docs: flip status of P-2026-10-11-1135
- `1df16a7a4` docs: inbox entry for new-model-instantiate F1, Phase 2 (P-2026-10-11-1135)
- `c2666b3b2` docs(discovery): new model instantiate, F1 measured addendum (P-2026-10-11-1135)
- `b08c92322` fix(editor-v2): the canvas memo sees containment, F1 (P-2026-10-11-1135)
- `d53d319dc` docs: inbox entry and a ticket for the new-model-instantiate Phase 1 (P-2026-10-11-1135)
- `60e51a4a3` docs(discovery): new model instantiate, not reproduced; stale memo (P-2026-10-11-1135)
- `309245922` chore(probe): every instantiation path on a fresh project (P-2026-10-11-1135)

The trunk carries, since the base, 24 commits:

- `44395bf59` docs: add prompt P-2026-10-11-1745, Claude Code mods discovery
- `9cc9c7c83` merge: gv-drag-frame into alfonso-frontend-jjtl (P-2026-10-11-1728)
- `87c7bb4ad` docs: add prompt P-2026-10-11-1728, merge gv-drag-frame into alfonso-frontend-jjtl
- `0c74c7b96` docs: prompt for softgoal balance view (P-2026-10-11-1735)
- `6093cfbd3` docs: close P-2026-10-11-1630, add prompt P-2026-10-11-1725 (CAIN RQ tables)
- `e262e68bc` docs: Status flip and log entry for the cain-data merge (P-2026-10-11-1719)
- `2dc0982bc` merge: cain-data into alfonso-frontend-jjtl (P-2026-10-11-1719)
- `af236ac12` docs: flip status of P-2026-10-11-1156
- `8cdafc89c` docs: flip status of P-2026-10-11-1156
- `e4cea10c4` docs: add prompt P-2026-10-11-1719, merge cain-data into alfonso-frontend-jjtl
- `e34fccc1f` docs(research): governance drift dataset for CAIN 2027 (P-2026-10-11-1630)
- `dd1e66f57` docs(log): inbox entry of the pointer-band correction (P-2026-10-11-1156)
- `23f78e4c8` docs(spec): R-GV-17 and §12 follow the pointer within a band (P-2026-10-11-1156)
- `76f741e2a` chore(probe): drag4 band and leave drags (P-2026-10-11-1156)
- `dda304dbb` test(ir): the bottom band case leaves the centre past the border (P-2026-10-11-1156)
- `efb97f948` fix(ir): a frame follows its child while the pointer is in a band (P-2026-10-11-1156)
- `6966e468c` docs(log): inbox entry and two tickets of the four-side frame (P-2026-10-11-1156)
- `879276a2a` docs(spec): graphVertex frame on four sides, R-GV-17 (P-2026-10-11-1156)
- `7b23cfa74` test(editor-v2): a sized update sets the hand-set flag (P-2026-10-11-1156)
- `d7b6914a4` fix(editor-v2): Auto layout writes a grown box with its position (P-2026-10-11-1156)
- `74ce6c94f` docs(lir): position and size of a container as one record (P-2026-10-11-1156)
- `6fdf5be0d` chore(probe): drag4, relayout and carry scenes (P-2026-10-11-1156)
- `18569bcc3` fix(editor-v2): a dragged container lands at its record plus the delta (P-2026-10-11-1156)
- `2d2f75846` fix(ir): graphVertex frame follows a dragged child on four sides (P-2026-10-11-1156)

Measured by `lane-run merge` at 2026-10-11 17:50, trunk at `44395bf59`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c6b060ef1`: zero conflicts.
- Files changed since the base: 15 on the branch side, 114 on the trunk side; on both sides: none.
- `git diff --name-only dfea753d4 c6b060ef1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-11_1716_prompt_new-model-instantiate_take_trunk.md` (eseguito 2026-10-11 · merge alfonso-frontend-jjtl into new-model-instantiate · f1b0e485b · flip 2026-10-11 dalla chat).
- `git worktree list`: `new-model-instantiate` in `/Users/alfonso/jjodel-w-newinst`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1750/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c6b060ef1` is the tip of `new-model-instantiate`; the prompt files of the branch read `Status: eseguito` at `c6b060ef1`; `git worktree list` shows `new-model-instantiate` only in `/Users/alfonso/jjodel-w-newinst`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c6b060ef1` (measured above: zero conflicts). `git diff --name-only dfea753d4 c6b060ef1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only dfea753d4 alfonso-frontend-jjtl` with `git diff --name-only dfea753d4 c6b060ef1` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-GV-17` (trunk); control: `- **R-GV-18**` none.
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — docs(discovery): new model instantiate, not reproduced; stale canvas memo (P-2026-10-11-1135)` once (branch).
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — ticket: after a page load every user view and viewpoint reads as a system default` once (branch).
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — fix(editor-v2): the canvas memo sees containment, F1 (P-2026-10-11-1135)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: cain-data into alfonso-frontend-jjtl (P-2026-10-11-1719)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — docs(research): governance drift dataset for CAIN 2027 (P-2026-10-11-1630)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — fix(ir): graphVertex frame follows a dragged child on four sides (P-2026-10-11-1156)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — ticket: regions packed edge to edge cannot grow across their shared border` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — ticket: a child dragged out of a none container is framed again after the drop` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — fix(ir): a frame follows its child while the pointer is in a band (P-2026-10-11-1156)` once (trunk).
4. `git merge --no-ff --no-commit c6b060ef1`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: new-model-instantiate into alfonso-frontend-jjtl (P-2026-10-11-1750)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c6b060ef1` in `/Users/alfonso/jjodel-w-newinst`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 44395bf59` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/new-model-instantiate.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the new-model-instantiate merge (P-2026-10-11-1750)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-newinst`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
