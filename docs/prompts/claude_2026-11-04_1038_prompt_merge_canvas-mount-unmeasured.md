# Prompt: merge canvas-mount-unmeasured into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-04-1038
Chat: C-2026-11-03-2317
Request: https://claude.ai/code/session_01DQt9R6hbytx4vz5aAdzQ8i (merge of canvas-mount-unmeasured launched by chat C-2026-11-03-2317)
Lane: full (merge; 1 conflict: `docs/log-inbox/hw-notation.md` measured)
Status: eseguito 2026-11-04 · lane merge · 9abc989ff · verifica visiva passata 2026-11-04 (gates green on 9abc989ff; probes on the branch, no hand run. Known visible difference on models above 150 nodes: parallel edges look stacked in one band; fix lane P-2026-11-04-1050 open, #475 stays open until it closes)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-1038 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ad34b896f`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `canvas-mount-unmeasured` into the trunk with one merge commit, `--no-ff`, of the explicit sha `58bcb36f8`, in the shape of `3161cc583` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `32b9c87d3`. The branch carries, on top of the base, 10 commits:

- `58bcb36f8` docs: log entry, ELK ticket and Status of P-2026-11-04-1012
- `6f08e076f` docs: add prompt P-2026-11-04-1012, off-screen edge check
- `c4ecbb6a4` docs: log entry and Status, ceiling stop of P-2026-11-04-0925
- `5eb1942b3` docs: LIR figures, ceiling stop of P-2026-11-04-0925
- `0740d511f` feat(editor-v2): skip React Flow's forced first mount on large canvases (P-2026-11-04-0925)
- `be8e2eed2` feat(editor-v2): unmeasured-node decoration helpers and test (P-2026-11-04-0925)
- `4e709eb59` docs: add prompt P-2026-11-04-0925, canvas mount continued
- `ca888071f` wip: canvas mount helpers, ceiling stop of P-2026-11-04-0901
- `b5cfa4a85` docs: LIR, skip the forced first mount of never-measured nodes (P-2026-11-04-0901)
- `9a8c9ecbd` docs: add prompt P-2026-11-04-0901, skip the forced first mount

The trunk carries, since the base, 9 commits:

- `ad34b896f` docs: Status flip and log entry for the jjtl-let-multiplicity merge (P-2026-11-04-0936)
- `3161cc583` merge: jjtl-let-multiplicity into alfonso-frontend-jjtl (P-2026-11-04-0936)
- `c25d3160d` docs: add prompt P-2026-11-04-0936, merge jjtl-let-multiplicity into alfonso-frontend-jjtl
- `46da7fabe` docs(jjtl): R-JTG-22 amended, abstract class in a let body (P-2026-11-04-0900)
- `06ce85232` feat(jjtl): an abstract class created in a let body is an error (P-2026-11-04-0900)
- `0216e8a71` docs: Status flip and log entry, let body class and [*] (P-2026-11-04-0900)
- `5eaae6544` docs(jjtl): R-JTG-21 [*] settled, R-JTG-22 let bodies; SPEC 4.4, 10, 12 (P-2026-11-04-0900)
- `96b79cec3` feat(jjtl): missing class in a let body is an error; [n..*] creates n (P-2026-11-04-0900)
- `c79411ef2` docs: add prompt P-2026-11-04-0900, let body class and [*]

Measured by `lane-run merge` at 2026-11-04 10:38, trunk at `ad34b896f`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 58bcb36f8`: 1 conflict: `docs/log-inbox/hw-notation.md`.
- Files changed since the base: 8 on the branch side, 7 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`.
- `git diff --name-only 32b9c87d3 58bcb36f8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_0901_prompt_canvas_mount_unmeasured.md` (eseguito 2026-11-04 · lane full · be8e2eed2 0740d511f · stopped at the context ceiling, closed by P-2026-11-04-0925 · verifica visiva non applicabile (unattended: probe crops, no hand run)), `claude_2026-11-04_0925_prompt_canvas_mount_cont.md` (eseguito 2026-11-04 · lane full · be8e2eed2 0740d511f · verifica visiva non applicabile (unattended: probe crops, no hand run)), `claude_2026-11-04_1012_prompt_canvas_mount_edge_check.md` (eseguito 2026-11-04 · lane full · no code change · verifica visiva non applicabile (unattended: probe crops, no hand run)).
- `git worktree list`: `canvas-mount-unmeasured` in `/Users/alfonso/jjodel-w-canvasmount`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-04-1038/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `58bcb36f8` is the tip of `canvas-mount-unmeasured`; the prompt files of the branch read `Status: eseguito` at `58bcb36f8`; `git worktree list` shows `canvas-mount-unmeasured` only in `/Users/alfonso/jjodel-w-canvasmount`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 58bcb36f8` (measured above: 1 conflict: `docs/log-inbox/hw-notation.md`). `git diff --name-only 32b9c87d3 58bcb36f8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 32b9c87d3 alfonso-frontend-jjtl` with `git diff --name-only 32b9c87d3 58bcb36f8` (measured above: `docs/log-inbox/hw-notation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-21` (trunk), `R-JTG-22` (trunk); control: `- **R-JTG-23**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — feat(editor-v2): skip React Flow's forced first mount on large canvases (P-2026-11-04-0901, P-2026-11-04-0925)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — ticket: Auto layout throws an ELK RangeError on a 200-class metamodel, on trunk too` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — test(editor-v2): off-screen edges of route A on 200 flat classes (P-2026-11-04-1012)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — feat(jjtl): missing class in a let body is an error; [*] settled (P-2026-11-04-0900)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — feat(jjtl): abstract class in a let body is an error (P-2026-11-04-0900, follow-up)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — merge: jjtl-let-multiplicity into alfonso-frontend-jjtl (P-2026-11-04-0936)` once (trunk).
4. `git merge --no-ff --no-commit 58bcb36f8`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: canvas-mount-unmeasured into alfonso-frontend-jjtl (P-2026-11-04-1038)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `58bcb36f8` in `/Users/alfonso/jjodel-w-canvasmount`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-canvasmount`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ad34b896f` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only ad34b896f HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the canvas-mount-unmeasured merge (P-2026-11-04-1038)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-canvasmount`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
