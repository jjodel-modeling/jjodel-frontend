# Prompt: merge visual-v2 into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1450
Chat: C-2026-09-28-1936
Lane: full (merge; 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1450 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `96360e0b7`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `visual-v2` into the trunk with one merge commit, `--no-ff`, of the explicit sha `ee0b05bdf`, in the shape of `5ecdaaa89` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `afa951c64`. The branch carries, on top of the base, 4 commits:

- `ee0b05bdf` docs: R-VP-18, log entry and Status for lane V2 (P-2026-09-29-1332)
- `8d63170e3` fix(editor-v2): generalization triangle rises into the parent (P-2026-09-29-1332)
- `c3b328dc3` style(editor-v2): legible default notation, light theme (P-2026-09-29-1332)
- `c0be7921e` docs(prompts): P-2026-09-29-1332 visual lane V2

The trunk carries, since the base, 17 commits:

- `96360e0b7` docs: Status flip and log entry for the visual-v1 merge (P-2026-09-29-1417)
- `5ecdaaa89` merge: visual-v1 into alfonso-frontend-jjtl (P-2026-09-29-1417)
- `41c001927` docs: add prompt P-2026-09-29-1417, merge visual-v1 into alfonso-frontend-jjtl
- `d0d7b7463` docs: Status flip and log entry for the visual-syntax-disc merge (P-2026-09-29-1359)
- `b4d817c22` merge: visual-syntax-disc into alfonso-frontend-jjtl (P-2026-09-29-1359)
- `5eed460a2` docs(views): R-VP-17, V1 log entry and Status (P-2026-09-29-1331)
- `d60f4c9c2` docs: add prompt P-2026-09-29-1359, merge visual-syntax-disc into alfonso-frontend-jjtl
- `b2f3548a0` feat(views): control-flow notation in the derived viewpoint, V1 (P-2026-09-29-1331)
- `1d940e825` docs: Status flip and log entry for the vitest-timeout merge (P-2026-09-29-1322)
- `8cd75c62b` merge: vitest-timeout into alfonso-frontend-jjtl (P-2026-09-29-1322)
- `d049dbaf8` docs: add prompt P-2026-09-29-1322, merge vitest-timeout into alfonso-frontend-jjtl
- `f8e041498` docs(prompts): P-2026-09-29-1331 visual lane V1
- `57843a290` docs: Status flip and inbox entry for the vitest timeout (P-2026-09-29-1306)
- `f8051b5e2` fix: raise vitest testTimeout to 15000ms (P-2026-09-29-1306)
- `b612fae6b` docs(views): visual concrete syntax discovery, log entry, Status (P-2026-09-29-1227)
- `7faa9eac9` docs: add prompt P-2026-09-29-1306, raise vitest testTimeout
- `69e9bc245` docs(prompts): P-2026-09-29-1227 discovery visual concrete syntax

Measured by `lane-run merge` at 2026-09-29 14:50, trunk at `96360e0b7`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ee0b05bdf`: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`.
- Files changed since the base: 10 on the branch side, 13 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`.
- `git diff --name-only afa951c64 ee0b05bdf -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1332_prompt_visual_v2.md` (eseguito 2026-09-29 · lane visual-v2 · c3b328dc3, 8d63170e3 · non fuso: hard-stop, lane probe on 3055 (light), four scenes M2/M1 before and after (header 6.22 and 7.02:1, edges 16.3:1, quiet 4.76:1, underline painted, triangle rising 0% hidden), crops in docs/discovery/harness/_tmp_v2_*.png (gitignored), R-VP-18 nel commit docs, verifica visiva alla chat).
- `git worktree list`: `visual-v2` in `/Users/alfonso/jjodel-w-v2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1450/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `ee0b05bdf` is the tip of `visual-v2`; the prompt files of the branch read `Status: eseguito` at `ee0b05bdf`; `git worktree list` shows `visual-v2` only in `/Users/alfonso/jjodel-w-v2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ee0b05bdf` (measured above: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`). `git diff --name-only afa951c64 ee0b05bdf -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only afa951c64 alfonso-frontend-jjtl` with `git diff --name-only afa951c64 ee0b05bdf` (measured above: `docs/decisions.md`, `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-18` (branch), `R-VP-17` (trunk); control: `- **R-VP-19**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — fix(editor-v2): the default notation legible, lane V2 (P-2026-09-29-1332)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — fix: raise the vitest testTimeout to 15000ms (P-2026-09-29-1306)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — merge: vitest-timeout into alfonso-frontend-jjtl (P-2026-09-29-1322)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, how far the concrete syntax can improve visually (P-2026-09-29-1227)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: visual-syntax-disc into alfonso-frontend-jjtl (P-2026-09-29-1359)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): control-flow notation in the derived viewpoint, lane V1 (P-2026-09-29-1331)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: visual-v1 into alfonso-frontend-jjtl (P-2026-09-29-1417)` once (trunk).
4. `git merge --no-ff --no-commit ee0b05bdf`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: visual-v2 into alfonso-frontend-jjtl (P-2026-09-29-1450)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `ee0b05bdf` in `/Users/alfonso/jjodel-w-v2`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 96360e0b7` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the visual-v2 merge (P-2026-09-29-1450)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-v2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
