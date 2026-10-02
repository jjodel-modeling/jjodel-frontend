# Prompt: merge viewpoint-colors-pastel into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-02-1642
Chat: C-2026-10-01-2220
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: eseguito 2026-10-02 · lane merge · abb05cb9f · verifica visiva passata 2026-10-02 (lane probe 60/60 on the branch (P-2026-10-02-1506), four default scenes 0 px, pastel tests 68/68; worker gates green)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-1642 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `adb5d9731`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `viewpoint-colors-pastel` into the trunk with one merge commit, `--no-ff`, of the explicit sha `8b5bd6de5`, in the shape of `a8870fa63` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `c3a9c9ffd`. The branch carries, on top of the base, 9 commits:

- `8b5bd6de5` docs: addendum, log entry, ticket, Status, pastel trunk sync (P-2026-10-02-1506)
- `25ed824fb` fix: cite the pastel rows by their trunk ids R-VP-37..39 (P-2026-10-02-1506)
- `68c3f8251` merge: alfonso-frontend-jjtl into viewpoint-colors-pastel (P-2026-10-02-1506)
- `48abe2b94` docs: discovery report for the pastel trunk sync (P-2026-10-02-1506)
- `77a3596fe` docs: add prompt P-2026-10-02-1506, sync the trunk into viewpoint-colors-pastel
- `7d1882c5f` docs: R-VP-32..34, log entry, tickets, report addendum, Status (P-2026-09-30-2022)
- `feefa9214` feat: pastel metaclass colours, per-class overrides, reference-aware (P-2026-09-30-2022)
- `f61fc0265` docs: discovery report for pastel metaclass colours (P-2026-09-30-2022)
- `f8aea9a8f` docs: prompt viewpoint colors pastel (P-2026-09-30-2022)

The trunk carries, since the base, 17 commits:

- `adb5d9731` docs: Status flip and log entry for the label-editable-toggle merge (P-2026-10-02-1548)
- `a8870fa63` merge: label-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1548)
- `c10f0fd90` docs: add prompt P-2026-10-02-1548, merge label-editable-toggle into alfonso-frontend-jjtl
- `7de984795` docs: Status flip and log entry for the ir-corner-clip merge (P-2026-10-02-1501)
- `0be127357` docs: Status flip and log entry for the jjscript-run-perf merge (P-2026-10-02-1445)
- `aa0396dd5` docs: Status flip for P-2026-10-01-2349, chat check on the probe measures
- `3db161e62` merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)
- `eaead2d71` docs: add prompt P-2026-10-02-1501, merge ir-corner-clip into alfonso-frontend-jjtl
- `50d87c3ba` docs: Status flip for P-2026-10-01-2336, visual check OK
- `12800ede4` docs: IR corner clip, Phase 2 addendum and log entry (P-2026-10-01-2336)
- `0070222d8` fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)
- `6652bcb9d` docs: Editable toggle, R-IRN-38, addendum, log entry, Status (P-2026-10-01-2349)
- `8cd4adb69` docs: IR rect corner clip, Phase 1 discovery report (P-2026-10-01-2336)
- `20c843f14` fix(editor-v2): Editable toggle reads the effective value (P-2026-10-01-2349)
- `450eb13c8` docs: discovery, Symbol label Editable toggle (P-2026-10-01-2349)
- `abb0fa9a8` docs: add prompt P-2026-10-01-2349, Symbol label Editable toggle has no effect
- `acd377629` docs: add prompt P-2026-10-01-2336, IR rect corners clipped at rest

Measured by `lane-run merge` at 2026-10-02 16:42, trunk at `adb5d9731`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8b5bd6de5`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 11 on the branch side, 18 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`.
- `git diff --name-only c3a9c9ffd 8b5bd6de5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-30_2022_prompt_viewpoint_colors_pastel.md` (eseguito 2026-09-30 · lane viewpoint-colors-pastel · f61fc0265, feefa9214 · non fuso: hard-stop, lane probe on 3137 (light) 60/60, toggle off and the four demo scenes byte-identical to 31999a630, mutation bench 55/59, crops in frontend/scripts/smoke/_tmp_vppastel_crops/vpp_after3_* (gitignored), verifica visiva alla chat), `claude_2026-10-02_1506_prompt_pastel_trunk_sync.md` (eseguito 2026-10-02 · lane viewpoint-colors-pastel · 48abe2b94, 68c3f8251, 25ed824fb · non fuso: hard-stop, rows R-VP-37..39, lane probe on 3151 (light) 60/60, the four demo scenes 0 px from c3a9c9ffd, mutation bench 55/59, check:addonly red on the merge only (194, structural), crops in frontend/scripts/smoke/_tmp_vp_sync_crops/ (gitignored), verifica visiva alla chat).
- `git worktree list`: `viewpoint-colors-pastel` in `/Users/alfonso/jjodel-w-vppastel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-02-1642/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `8b5bd6de5` is the tip of `viewpoint-colors-pastel`; the prompt files of the branch read `Status: eseguito` at `8b5bd6de5`; `git worktree list` shows `viewpoint-colors-pastel` only in `/Users/alfonso/jjodel-w-vppastel`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8b5bd6de5` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only c3a9c9ffd 8b5bd6de5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only c3a9c9ffd alfonso-frontend-jjtl` with `git diff --name-only c3a9c9ffd 8b5bd6de5` (measured above: `docs/decisions.md`, `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-37` (branch), `R-VP-38` (branch), `R-VP-39` (branch), `R-IRN-38` (trunk); control: `- **R-IRN-39**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): «Color by metaclass» v2, pastel swatches, per-metaclass overrides, reference-aware (P-2026-09-30-2022)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: colour the edges of a coloured viewpoint by source or target` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: criticalZone.test.ts goes red inside a go-ahead lane` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: the trunk into viewpoint-colors-pastel, pastel rows renumbered R-VP-37..39 (P-2026-10-02-1506)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: check:addonly reads a fold-and-rotate as a rewrite through a trunk-into-branch merge` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-02 — merge: jjscript-run-perf into alfonso-frontend-jjtl (P-2026-10-02-1445)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — fix(editor-v2): Editable toggle of a Symbol label reads the effective value (P-2026-10-01-2349)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: IR name label stays stale after an inline rename when the class has no name attribute` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: FieldSegmentEditor toggle has the same inverted default as the label one` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: a single-attribute path label cannot be edited on the canvas` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: label-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1548)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)` once (trunk).
4. `git merge --no-ff --no-commit 8b5bd6de5`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: viewpoint-colors-pastel into alfonso-frontend-jjtl (P-2026-10-02-1642)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `8b5bd6de5` in `/Users/alfonso/jjodel-w-vppastel`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard adb5d9731` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the viewpoint-colors-pastel merge (P-2026-10-02-1642)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-vppastel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
