# Prompt: merge board-kindof-merges into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-1913
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-10 · lane merge · 2ad7460d0 · verifica visiva passata 2026-10-10 (chat, unattended: scripts-only (lane board kindOf), classification verified by lane P-2026-10-10-1803 on the prompt corpus)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1913 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `e1eb53d43`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `board-kindof-merges` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f8d8c333d`, in the shape of `74b52cd99` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `c315460b0`. The branch carries, on top of the base, 7 commits:

- `f8d8c333d` docs: Status flip and log entry, board-kindof-merges took the trunk (P-2026-10-10-1851)
- `43231854c` merge: board-kindof-merges takes alfonso-frontend-jjtl (P-2026-10-10-1851)
- `cc25ca8cd` docs: add prompt P-2026-10-10-1851, merge alfonso-frontend-jjtl into board-kindof-merges
- `f4965b72f` docs: Status flip for the kindOf two-merge lane (P-2026-10-10-1803)
- `e5b980bf4` docs(harness): close lane board kindOf two-merge lanes (P-2026-10-10-1803)
- `a77675e5e` fix(harness): lane board counts a two-merge lane as a merge
- `885ada6f8` docs(prompts): lane board kindOf two-merge lanes (P-2026-10-10-1803)

The trunk carries, since the base, 9 commits:

- `e1eb53d43` docs: Status flip and log entry for the board-req-port-disc merge (P-2026-10-10-1852)
- `e388a90ee` docs: merge prompt P-2026-10-10-1754 superseded by P-2026-10-10-1802
- `74b52cd99` merge: board-req-port-disc into alfonso-frontend-jjtl (P-2026-10-10-1852)
- `02b752d65` docs: add prompt P-2026-10-10-1852, merge board-req-port-disc into alfonso-frontend-jjtl
- `345b14db7` docs: Status flip for the req-tab port discovery (P-2026-10-10-1806)
- `0d8180ebc` docs(discovery): what harness-req-tab still adds to the trunk board (P-2026-10-10-1806)
- `33f167305` docs(prompts): renumber the req-tab port discovery content to P-2026-10-10-1806
- `60059ceac` docs(prompts): renumber the req-tab port discovery to P-2026-10-10-1806 (1802 was taken by a merge)
- `3cded089e` docs(prompts): lane board req-tab port discovery (P-2026-10-10-1802)

Measured by `lane-run merge` at 2026-10-10 19:13, trunk at `e1eb53d43`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f8d8c333d`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 4 on the branch side, 5 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only c315460b0 f8d8c333d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_1803_prompt_board_kindof_merges.md` (eseguito 2026-10-10, lane P-2026-10-10-1803 (board-kindof-merges, a77675e5e); no visual check (classification only)), `claude_2026-10-10_1851_prompt_board-kindof-merges_take_trunk.md` (eseguito 2026-10-10 · lane board-kindof-merges · 43231854c · verifica visiva passata 2026-10-10 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `board-kindof-merges` in `/Users/alfonso/jjodel-w-kindof`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-1913/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f8d8c333d` is the tip of `board-kindof-merges`; the prompt files of the branch read `Status: eseguito` at `f8d8c333d`; `git worktree list` shows `board-kindof-merges` only in `/Users/alfonso/jjodel-w-kindof`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f8d8c333d` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only c315460b0 f8d8c333d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only c315460b0 alfonso-frontend-jjtl` with `git diff --name-only c315460b0 f8d8c333d` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): lane board counts a two-merge lane as a merge (P-2026-10-10-1803)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-kindof-merges takes alfonso-frontend-jjtl (P-2026-10-10-1851)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-req-port-disc into alfonso-frontend-jjtl (P-2026-10-10-1852)` once (trunk).
4. `git merge --no-ff --no-commit f8d8c333d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: board-kindof-merges into alfonso-frontend-jjtl (P-2026-10-10-1913)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f8d8c333d` in `/Users/alfonso/jjodel-w-kindof`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard e1eb53d43` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the board-kindof-merges merge (P-2026-10-10-1913)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-kindof`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
