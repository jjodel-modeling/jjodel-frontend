# Prompt: edge-ends takes the trunk before its own merge

Prompt-ID: P-2026-10-02-1641
Chat: C-2026-10-01-2220
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-edgeends`, branch `edge-ends`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-edgeends`, branch `edge-ends`, `git log -1` is the commit that adds this file (its parent `c80aed8bb`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-1641 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `adb5d9731` into `edge-ends` with one merge commit, `--no-ff`, in the shape of `1e1ce1334` (the last merge commit on `edge-ends`; read its body first). Merge base `eaead2d71`. The trunk brings, since the base, 16 commits:

- `adb5d9731` docs: Status flip and log entry for the label-editable-toggle merge (P-2026-10-02-1548)
- `a8870fa63` merge: label-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1548)
- `c10f0fd90` docs: add prompt P-2026-10-02-1548, merge label-editable-toggle into alfonso-frontend-jjtl
- `7de984795` docs: Status flip and log entry for the ir-corner-clip merge (P-2026-10-02-1501)
- `0be127357` docs: Status flip and log entry for the jjscript-run-perf merge (P-2026-10-02-1445)
- `aa0396dd5` docs: Status flip for P-2026-10-01-2349, chat check on the probe measures
- `3db161e62` merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)
- `50d87c3ba` docs: Status flip for P-2026-10-01-2336, visual check OK
- `12800ede4` docs: IR corner clip, Phase 2 addendum and log entry (P-2026-10-01-2336)
- `0070222d8` fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)
- `6652bcb9d` docs: Editable toggle, R-IRN-38, addendum, log entry, Status (P-2026-10-01-2349)
- `8cd4adb69` docs: IR rect corner clip, Phase 1 discovery report (P-2026-10-01-2336)
- `20c843f14` fix(editor-v2): Editable toggle reads the effective value (P-2026-10-01-2349)
- `450eb13c8` docs: discovery, Symbol label Editable toggle (P-2026-10-01-2349)
- `abb0fa9a8` docs: add prompt P-2026-10-01-2349, Symbol label Editable toggle has no effect
- `acd377629` docs: add prompt P-2026-10-01-2336, IR rect corners clipped at rest

This branch brings, 11 commits:

- `c80aed8bb` docs: edge-ends trunk sync, report §7, log entry, ticket, Status (P-2026-10-02-1505)
- `119046cb2` fix(editor-v2): a junction trunk's marker, the bench survivor closed (P-2026-10-02-1505)
- `9e1f9fae5` fix(editor-v2): a junction trunk takes its own new-end marker (P-2026-10-02-1505)
- `1e1ce1334` merge: alfonso-frontend-jjtl into edge-ends (P-2026-10-02-1505)
- `b7d0885e9` docs: edge-ends trunk sync, Phase 1 report (P-2026-10-02-1505)
- `dc013e8ba` docs: add prompt P-2026-10-02-1505, sync the trunk into edge-ends
- `633c22a8c` docs: slice E report §9, R-EE rows, log entry, Status (P-2026-09-30-1810)
- `462fba92d` feat(views): edge ends, the two gaps of the mutation bench closed (P-2026-09-30-1810)
- `8f3e7c307` feat(views): edge ends, seven glyphs, Conditional ends, end roles (P-2026-09-30-1810)
- `77c2f946b` docs: slice E edge ends discovery, Phase 1 report (P-2026-09-30-1810)
- `60d223baa` docs: add prompt P-2026-09-30-1810, slice E edge ends

Measured by `lane-run merge --trunk-into` at 2026-10-02 16:41, trunk at `adb5d9731`:

- `git merge-tree --write-tree --name-only edge-ends adb5d9731`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 19 on the branch side, 18 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`.
- `git diff --name-only eaead2d71 c80aed8bb -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-30_1810_prompt_edge_ends.md` (eseguito 2026-09-30 · lane edge-ends · 77c2f946b, 8f3e7c307, 462fba92d · non fuso: hard-stop, lane probe on 3093 (light and dark, widths 1 and 2) 16/16, crops in frontend/scripts/smoke/_tmp_edgeends_crops/ (gitignored), mutation bench 22/23 (the survivor equivalent), R-EE-1..4 nel commit docs, verifica visiva alla chat), `claude_2026-10-02_1505_prompt_edge_ends_trunk_sync.md` (eseguito 2026-10-02 · lane edge-ends · 1e1ce1334, 9e1f9fae5, 119046cb2 · non fuso: hard-stop, probe on 3095 (light) base 5/5 on the c3a9c9ffd code and after 20/20, mutation benches 9/9 (the fix) and 22/23 (slice E, the survivor equivalent), check:addonly red on the merge only (inherited from d2eb5fb83, report §7), verifica visiva alla chat).
- `git worktree list`: `edge-ends` in `/Users/alfonso/jjodel-w-edgeends`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `adb5d9731` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `adb5d9731` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only edge-ends adb5d9731` (measured above: 1 conflict: `docs/log-inbox/views.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit adb5d9731`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-EE-1` (branch), `R-EE-2` (branch), `R-EE-3` (branch), `R-EE-4` (branch), `R-IRN-38` (trunk); control: `- **R-IRN-39**` none.
   - `docs/decisions.md`: the heading `## Serie R-EE — edge ends, slice E (decisioni 2026-09-30)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): edge ends, seven glyphs, Conditional ends, end roles, slice E (P-2026-09-30-1810)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: alfonso-frontend-jjtl into edge-ends, slice E synced with the trunk (P-2026-10-02-1505)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: check:addonly refuses a fold and a rotation in one commit, and every trunk merge across it` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-02 — merge: jjscript-run-perf into alfonso-frontend-jjtl (P-2026-10-02-1445)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — fix(editor-v2): Editable toggle of a Symbol label reads the effective value (P-2026-10-01-2349)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: IR name label stays stale after an inline rename when the class has no name attribute` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: FieldSegmentEditor toggle has the same inverted default as the label one` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: a single-attribute path label cannot be edited on the canvas` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: label-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1548)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: edge-ends takes alfonso-frontend-jjtl (P-2026-10-02-1641)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c80aed8bb` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane edge-ends · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, edge-ends took the trunk (P-2026-10-02-1641)` (P16, RC-17). `Outcome: done`. The merge of `edge-ends` into the trunk gets its own prompt (`lane-run merge edge-ends --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
