# Prompt: elk-layout-disc takes the trunk before its own merge

Prompt-ID: P-2026-10-02-1718
Chat: C-2026-10-01-2215
Lane: full (merge of the trunk into the branch; 3 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-elklayout`, branch `elk-layout-disc`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-elklayout`, branch `elk-layout-disc`, `git log -1` is the commit that adds this file (its parent `a7d2a3f91`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-1718 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `9e6adf714` into `elk-layout-disc` with one merge commit, `--no-ff`, in the shape of `5c9aadb1c` (the last merge commit on `elk-layout-disc`; read its body first). Merge base `c3a9c9ffd`. The trunk brings, since the base, 46 commits:

- `9e6adf714` docs: Status flip and log entry for the edge-ends merge (P-2026-10-02-1704)
- `0bcdac22a` merge: edge-ends into alfonso-frontend-jjtl (P-2026-10-02-1704)
- `4587049de` docs: add prompt P-2026-10-02-1704, merge edge-ends into alfonso-frontend-jjtl
- `5cc0522f0` docs: Status flip and log entry, edge-ends took the trunk (P-2026-10-02-1641)
- `cdec5e44d` docs: Status flip and log entry for the viewpoint-colors-pastel merge (P-2026-10-02-1642)
- `abb05cb9f` merge: viewpoint-colors-pastel into alfonso-frontend-jjtl (P-2026-10-02-1642)
- `0c221f237` merge: edge-ends takes alfonso-frontend-jjtl (P-2026-10-02-1641)
- `bb4246523` docs: add prompt P-2026-10-02-1642, merge viewpoint-colors-pastel into alfonso-frontend-jjtl
- `a6f169ad2` docs: add prompt P-2026-10-02-1641, merge alfonso-frontend-jjtl into edge-ends
- `adb5d9731` docs: Status flip and log entry for the label-editable-toggle merge (P-2026-10-02-1548)
- `a8870fa63` merge: label-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1548)
- `c10f0fd90` docs: add prompt P-2026-10-02-1548, merge label-editable-toggle into alfonso-frontend-jjtl
- `c80aed8bb` docs: edge-ends trunk sync, report §7, log entry, ticket, Status (P-2026-10-02-1505)
- `8b5bd6de5` docs: addendum, log entry, ticket, Status, pastel trunk sync (P-2026-10-02-1506)
- `7de984795` docs: Status flip and log entry for the ir-corner-clip merge (P-2026-10-02-1501)
- `119046cb2` fix(editor-v2): a junction trunk's marker, the bench survivor closed (P-2026-10-02-1505)
- `9e1f9fae5` fix(editor-v2): a junction trunk takes its own new-end marker (P-2026-10-02-1505)
- `0be127357` docs: Status flip and log entry for the jjscript-run-perf merge (P-2026-10-02-1445)
- `25ed824fb` fix: cite the pastel rows by their trunk ids R-VP-37..39 (P-2026-10-02-1506)
- `68c3f8251` merge: alfonso-frontend-jjtl into viewpoint-colors-pastel (P-2026-10-02-1506)
- `48abe2b94` docs: discovery report for the pastel trunk sync (P-2026-10-02-1506)
- `aa0396dd5` docs: Status flip for P-2026-10-01-2349, chat check on the probe measures
- `1e1ce1334` merge: alfonso-frontend-jjtl into edge-ends (P-2026-10-02-1505)
- `b7d0885e9` docs: edge-ends trunk sync, Phase 1 report (P-2026-10-02-1505)
- `3db161e62` merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)
- `77a3596fe` docs: add prompt P-2026-10-02-1506, sync the trunk into viewpoint-colors-pastel
- `dc013e8ba` docs: add prompt P-2026-10-02-1505, sync the trunk into edge-ends
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
- `7d1882c5f` docs: R-VP-32..34, log entry, tickets, report addendum, Status (P-2026-09-30-2022)
- `feefa9214` feat: pastel metaclass colours, per-class overrides, reference-aware (P-2026-09-30-2022)
- `f61fc0265` docs: discovery report for pastel metaclass colours (P-2026-09-30-2022)
- and 6 more: `git log --oneline c3a9c9ffd..9e6adf714`

This branch brings, 8 commits:

- `a7d2a3f91` docs: R-VP-37..47, Phase 2 results, log entry, Status (P-2026-10-01-2215)
- `803b84e3a` feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)
- `ccba4b030` docs: Phase 2 plan addendum, ELK routes drawn by UnifiedEdge (P-2026-10-01-2215)
- `5c9aadb1c` merge: alfonso-frontend-jjtl (c3a9c9ffd) into elk-layout-disc (P-2026-10-01-2215)
- `57c150a2a` docs: add Phase 2 prompt for P-2026-10-01-2215, ELK auto-layout used in full
- `a2b4e8168` docs: Status flip, log entry and ticket, ELK layout discovery (P-2026-10-01-2215)
- `e83a16d41` docs: ELK layout quality discovery, measured per notation (P-2026-10-01-2215)
- `bc29ef585` docs: add prompt P-2026-10-01-2215, ELK layout quality discovery

Measured by `lane-run merge --trunk-into` at 2026-10-02 17:18, trunk at `9e6adf714`:

- `git merge-tree --write-tree --name-only elk-layout-disc 9e6adf714`: 3 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`.
- Files changed since the base: 14 on the branch side, 46 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`.
- `git diff --name-only c3a9c9ffd a7d2a3f91 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-01_2215_fase2_elk_layout.md` (eseguito 2026-10-02 · lane elk-layout-disc · 5c9aadb1c (trunk merge), 803b84e3a · hard-stop: 6 of 7 scenes at 0 collisions after a toolbar auto-layout, Petri 2 (transition names, question 1), rest 0 px; visual GO pending (RC-23)), `claude_2026-10-01_2215_prompt_elk_layout_discovery.md` (eseguito 2026-10-01 · lane elk-layout-disc · e83a16d41 · Phase 1 hard-stop: report docs/discovery/discovery_2026-10-01_elk_layout_quality.md, seven questions with Recommended lines, decisions D-A..D-C await Alfonso (RC-26)).
- `git worktree list`: `elk-layout-disc` in `/Users/alfonso/jjodel-w-elklayout`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`

## COME

1. Preconditions above, plus: `9e6adf714` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `9e6adf714` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only elk-layout-disc 9e6adf714` (measured above: 3 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 9e6adf714`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-37` (both sides), `R-VP-38` (both sides), `R-VP-39` (both sides), `R-VP-40` (branch), `R-VP-41` (branch), `R-VP-42` (branch), `R-VP-43` (branch), `R-VP-44` (branch), `R-VP-45` (branch), `R-VP-46` (branch), `R-VP-47` (branch), `R-IRN-38` (trunk), `R-EE-1` (trunk), `R-EE-2` (trunk), `R-EE-3` (trunk), `R-EE-4` (trunk); control: `- **R-EE-5**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — docs: ELK auto-layout quality, measured per notation (P-2026-10-01-2215)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — ticket: hidden object-as-edge vertices reach ELK as 180x120 boxes` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: Petri net (classic) transition names are crossed by their outgoing arc after the toolbar layout` once (branch).
   - `docs/decisions.md`: the heading `## Serie R-EE — edge ends, slice E (decisioni 2026-09-30)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-02 — merge: jjscript-run-perf into alfonso-frontend-jjtl (P-2026-10-02-1445)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — fix(editor-v2): Editable toggle of a Symbol label reads the effective value (P-2026-10-01-2349)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: IR name label stays stale after an inline rename when the class has no name attribute` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: FieldSegmentEditor toggle has the same inverted default as the label one` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: a single-attribute path label cannot be edited on the canvas` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: label-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1548)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): «Color by metaclass» v2, pastel swatches, per-metaclass overrides, reference-aware (P-2026-09-30-2022)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: colour the edges of a coloured viewpoint by source or target` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: criticalZone.test.ts goes red inside a go-ahead lane` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: the trunk into viewpoint-colors-pastel, pastel rows renumbered R-VP-37..39 (P-2026-10-02-1506)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: check:addonly reads a fold-and-rotate as a rewrite through a trunk-into-branch merge` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: viewpoint-colors-pastel into alfonso-frontend-jjtl (P-2026-10-02-1642)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): edge ends, seven glyphs, Conditional ends, end roles, slice E (P-2026-09-30-1810)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: alfonso-frontend-jjtl into edge-ends, slice E synced with the trunk (P-2026-10-02-1505)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: check:addonly refuses a fold and a rotation in one commit, and every trunk merge across it` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: edge-ends takes alfonso-frontend-jjtl, slice E on the trunk before its own merge (P-2026-10-02-1641)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: edge-ends into alfonso-frontend-jjtl (P-2026-10-02-1704)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `docs/log-inbox/views.md`, `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: elk-layout-disc takes alfonso-frontend-jjtl (P-2026-10-02-1718)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard a7d2a3f91` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane elk-layout-disc · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, elk-layout-disc took the trunk (P-2026-10-02-1718)` (P16, RC-17). `Outcome: done`. The merge of `elk-layout-disc` into the trunk gets its own prompt (`lane-run merge elk-layout-disc --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
