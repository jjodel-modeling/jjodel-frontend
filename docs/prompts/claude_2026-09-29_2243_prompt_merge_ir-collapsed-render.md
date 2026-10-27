# Prompt: merge ir-collapsed-render into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-2243
Chat: C-2026-09-29-1826
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: eseguito 2026-09-29 · lane merge · 889906e43 · verifica visiva passata 2026-09-29 (Visual evidence from the lane itself (P-2026-09-29-2122): 7 crops expanded/collapsed/re-expanded/control in light and dark with DOM measures, tests irCollapsedRender and useContentSizeDrop; merge gates green. Dark-mode contrast of the fixture fill is an authoring colour, not a renderer defect. Merge taken over by chat C-2026-09-29-1826 on Alfonso request.)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-2243 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cf8c031f6`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ir-collapsed-render` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f601f70ff`, in the shape of `3573b0029` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `5626b3364`. The branch carries, on top of the base, 7 commits:

- `f601f70ff` docs: closure of the collapsed render lane, entry and Status (P-2026-09-29-2122)
- `61a45540e` fix(ir): corner badges on SVG forms, derived size dropped on expand (P-2026-09-29-2122)
- `4784837e3` docs: LIR addendum, badge inline and derived size drop (P-2026-09-29-2122)
- `d6e9b8486` docs: probe results for the collapsed render, two defects (P-2026-09-29-2122)
- `04acac227` feat(ir): render the declared collapsed form, fill and badge (P-2026-09-29-2122)
- `d6dff9e78` docs: Layer Impact Report, collapsed graphVertex render (P-2026-09-29-2122)
- `8dbb031d1` docs: add prompt P-2026-09-29-2122, F3, render the collapsed graphVertex

The trunk carries, since the base, 13 commits:

- `cf8c031f6` docs: Status flip and log entry for the no-proxy-ir merge (P-2026-09-29-2158)
- `3573b0029` merge: no-proxy-ir into alfonso-frontend-jjtl (P-2026-09-29-2158)
- `e06e7aa1f` docs: add prompt P-2026-09-29-2158, merge no-proxy-ir into alfonso-frontend-jjtl
- `18ec08e9b` docs: log entry, ticket and Status for F1 no-proxy IR (P-2026-09-29-2121)
- `719703ef6` fix(ir): never store an L-proxy inside a view IR (P-2026-09-29-2121)
- `591504f57` docs: Status flip and log entry for the live-save merge (P-2026-09-29-2140)
- `e2e2195c6` docs: Layer Impact Report for F1, no L-proxy inside a view IR (P-2026-09-29-2121)
- `9ef223452` merge: live-save into alfonso-frontend-jjtl (P-2026-09-29-2140)
- `62badb2b2` docs: add prompt P-2026-09-29-2140, merge live-save into alfonso-frontend-jjtl
- `d15c657c7` docs: log entry, counters ticket and Status for live save (P-2026-09-29-2120)
- `041373870` fix(persistence): save the live project on Cmd+S (P-2026-09-29-2120)
- `361eadedd` docs: add prompt P-2026-09-29-2121, F1, no L-proxy inside a view IR
- `1625e8c28` docs: add prompt P-2026-09-29-2120, F2, save the live project on Cmd+S

Measured by `lane-run merge` at 2026-09-29 22:43, trunk at `cf8c031f6`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f601f70ff`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 8 on the branch side, 14 on the trunk side; on both sides: `docs/log-inbox/views.md`.
- `git diff --name-only 5626b3364 f601f70ff -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_2122_prompt_ir_collapsed_render.md` (eseguito 2026-09-29 · lane ir-collapsed-render · 61a45540e · non fuso).
- `git worktree list`: `ir-collapsed-render` in `/Users/alfonso/jjodel-w-collapsed`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-2243/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f601f70ff` is the tip of `ir-collapsed-render`; the prompt files of the branch read `Status: eseguito` at `f601f70ff`; `git worktree list` shows `ir-collapsed-render` only in `/Users/alfonso/jjodel-w-collapsed`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f601f70ff` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 5626b3364 f601f70ff -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 5626b3364 alfonso-frontend-jjtl` with `git diff --name-only 5626b3364 f601f70ff` (measured above: `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(ir): render the declared collapsed form, fill and badge (P-2026-09-29-2122)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a critical-zone lane's go-ahead variable reaches the criticalZone hook tests` once (branch).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — fix(persistence): save the live project on Cmd+S (P-2026-09-29-2120)` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — ticket: save counters still read the caller's stale LProject` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — merge: live-save into alfonso-frontend-jjtl (P-2026-09-29-2140)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — fix(ir): never store an L-proxy inside a view IR (P-2026-09-29-2121)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a critical-zone lane sees four red hook tests in its own vitest run` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: no-proxy-ir into alfonso-frontend-jjtl (P-2026-09-29-2158)` once (trunk).
4. `git merge --no-ff --no-commit f601f70ff`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-collapsed-render into alfonso-frontend-jjtl (P-2026-09-29-2243)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f601f70ff` in `/Users/alfonso/jjodel-w-collapsed`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard cf8c031f6` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ir-collapsed-render merge (P-2026-09-29-2243)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-collapsed`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
