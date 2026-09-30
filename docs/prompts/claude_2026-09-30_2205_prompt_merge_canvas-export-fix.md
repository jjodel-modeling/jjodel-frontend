# Prompt: merge canvas-export-fix into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-30-2205
Chat: C-2026-09-30-2035
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-30-2205 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `120d97c01`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `canvas-export-fix` into the trunk with one merge commit, `--no-ff`, of the explicit sha `3c9a078ce`, in the shape of `f5f9f4f23` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `31999a630`. The branch carries, on top of the base, 5 commits:

- `3c9a078ce` docs: canvas export Phase 2 addendum, log entry, tickets, Status (P-2026-09-30-2035)
- `078cfb5f8` fix: pin the zoom division in the canvas export bounds test (P-2026-09-30-2035)
- `0d6987661` fix: canvas export works for PNG, JPEG, SVG and clipboard (P-2026-09-30-2035)
- `f3ed74cea` docs: discovery, canvas export broken in all four options (P-2026-09-30-2035)
- `db5bd645b` docs: add prompt P-2026-09-30-2035, canvas export fix

The trunk carries, since the base, 13 commits:

- `120d97c01` docs: Status flip and log entry for the loader-over-rail merge (P-2026-09-30-2120)
- `f5f9f4f23` merge: loader-over-rail into alfonso-frontend-jjtl (P-2026-09-30-2120)
- `4462168cb` docs: add prompt P-2026-09-30-2120, merge loader-over-rail into alfonso-frontend-jjtl
- `6fddac6b7` docs: Status flip and log entry for the edge-click-properties merge (P-2026-09-30-2105)
- `fb6826c1a` docs: loader-over-rail report, inbox entry, ticket and Status (P-2026-09-30-2025)
- `35d8c8e89` merge: edge-click-properties into alfonso-frontend-jjtl (P-2026-09-30-2105)
- `b46af6f27` fix(loader): portal the loading overlay onto body, above the rail (P-2026-09-30-2025)
- `a552dfccd` docs: add prompt P-2026-09-30-2105, merge edge-click-properties into alfonso-frontend-jjtl
- `1079a9740` docs: R-ESEL rows, log entry, report addendum and Status (P-2026-09-30-1940)
- `bb0fd90c9` fix(editor-v2): an edge click shows the element the edge represents (P-2026-09-30-1940)
- `371804cf0` docs: discovery, edge click and the Properties panel (P-2026-09-30-1940)
- `a766c0a90` docs: add prompt P-2026-09-30-2025, loader overlay must cover the Properties rail
- `25b44b2ce` docs: add prompt P-2026-09-30-1940, edge click shows reference or object-as-edge in Properties

Measured by `lane-run merge` at 2026-09-30 22:05, trunk at `120d97c01`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3c9a078ce`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 6 on the branch side, 13 on the trunk side; on both sides: `docs/log-inbox/views.md`.
- `git diff --name-only 31999a630 3c9a078ce -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-30_2035_prompt_canvas_export_fix.md` (eseguito 2026-09-30 · lane canvas-export-fix · f3ed74cea, 0d6987661, 078cfb5f8 · non fuso: hard-stop, lane probe on 3142 (light) 154/154 on three canvases (M2, M1, M1 under a derived IR viewpoint), mutation bench 26/26 (21/22 on 0d6987661), files in frontend/scripts/smoke/_tmp_canvas_export/phase2/ (gitignored), verifica visiva alla chat).
- `git worktree list`: `canvas-export-fix` in `/Users/alfonso/jjodel-w-canvasexport`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-30-2205/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `3c9a078ce` is the tip of `canvas-export-fix`; the prompt files of the branch read `Status: eseguito` at `3c9a078ce`; `git worktree list` shows `canvas-export-fix` only in `/Users/alfonso/jjodel-w-canvasexport`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3c9a078ce` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 31999a630 3c9a078ce -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 31999a630 alfonso-frontend-jjtl` with `git diff --name-only 31999a630 3c9a078ce` (measured above: `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-ESEL-1` (trunk), `R-ESEL-2` (trunk), `R-ESEL-3` (trunk), `R-ESEL-4` (trunk), `R-ESEL-5` (trunk); control: `- **R-ESEL-6**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(export): canvas export works in all four options, M2 and M1 (P-2026-09-30-2035)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: Copy to clipboard likely refused by Safari after the canvas render` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: each canvas export logs two console errors and embeds every font in the SVG` once (branch).
   - `docs/decisions.md`: the heading `## Serie R-ESEL — the edge click and the Properties panel (decisions 2026-09-30)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(editor-v2): an edge click shows the element the edge represents (P-2026-09-30-1940)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: an inheritance edge click shows the empty panel, a lifted edge click shows nothing` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: edge-click-properties into alfonso-frontend-jjtl (P-2026-09-30-2105)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(loader): the save overlay covers the Properties rail (P-2026-09-30-2025)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: user menu Dashboard throws on Collaborative.client.off when no collaborative session was opened` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: loader-over-rail into alfonso-frontend-jjtl (P-2026-09-30-2120)` once (trunk).
4. `git merge --no-ff --no-commit 3c9a078ce`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: canvas-export-fix into alfonso-frontend-jjtl (P-2026-09-30-2205)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `3c9a078ce` in `/Users/alfonso/jjodel-w-canvasexport`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 120d97c01` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the canvas-export-fix merge (P-2026-09-30-2205)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-canvasexport`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
