# Prompt: path-label-edit takes the trunk before its own merge

Prompt-ID: P-2026-10-02-2132
Chat: C-2026-10-01-2349
Lane: full (merge of the trunk into the branch; 2 conflicts: `docs/decisions.md`, `docs/log-inbox/symbol-editor.md` measured)
Status: eseguito 2026-10-02 · lane path-label-edit · 1dff977e4 · verifica visiva passata 2026-10-02 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-w-pathlabel`, branch `path-label-edit`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-pathlabel`, branch `path-label-edit`, `git log -1` is the commit that adds this file (its parent `c0dfec656`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-2132 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `936a1b947` into `path-label-edit` with one merge commit, `--no-ff`, in the shape of `a8870fa63` (the last merge commit on `path-label-edit`; read its body first). Merge base `adb5d9731`. The trunk brings, since the base, 46 commits:

- `936a1b947` docs: Status flip and log entry for the ir-label-name-refresh merge (P-2026-10-02-2109)
- `fc11b841a` merge: ir-label-name-refresh into alfonso-frontend-jjtl (P-2026-10-02-2109)
- `8705c9fdc` docs: add prompt P-2026-10-02-2109, merge ir-label-name-refresh into alfonso-frontend-jjtl
- `79b29a7da` docs: Status flip and log entry for the segment-editable-toggle merge (P-2026-10-02-1810)
- `fb567d6a2` docs: Status flip for P-2026-10-02-1645, chat check on the probe measures
- `bc8989cdb` merge: segment-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1810)
- `6b62b6df5` docs: log entry and ticket, IR name label refresh (P-2026-10-02-1645)
- `8f5102d29` docs: addendum and R-IRN-39, IR name label refresh (P-2026-10-02-1645)
- `1ff8ab314` docs: add prompt P-2026-10-02-1810, merge segment-editable-toggle into alfonso-frontend-jjtl
- `013a4dc9c` docs: Status flip for P-2026-10-02-1646, chat check on the probe measures
- `85095bb87` docs: closure of the value segment editable toggle (P-2026-10-02-1646)
- `d8f2e61c3` fix(editor-v2): value segment toggle reads the effective default (P-2026-10-02-1646)
- `9e6adf714` docs: Status flip and log entry for the edge-ends merge (P-2026-10-02-1704)
- `7c92ffc2c` fix: IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)
- `0bcdac22a` merge: edge-ends into alfonso-frontend-jjtl (P-2026-10-02-1704)
- `4587049de` docs: add prompt P-2026-10-02-1704, merge edge-ends into alfonso-frontend-jjtl
- `acf5a9fc3` docs: discovery, IR name label stale after a rename (P-2026-10-02-1645)
- `76d2d72cc` docs: discovery of the value segment editable toggle (P-2026-10-02-1646)
- `5cc0522f0` docs: Status flip and log entry, edge-ends took the trunk (P-2026-10-02-1641)
- `cdec5e44d` docs: Status flip and log entry for the viewpoint-colors-pastel merge (P-2026-10-02-1642)
- `6519d3094` docs: add prompt P-2026-10-02-1646, value segment editable toggle reads the wrong default
- `19d48ee0b` docs: add prompt P-2026-10-02-1645, IR name label keeps the old name after a rename
- `abb05cb9f` merge: viewpoint-colors-pastel into alfonso-frontend-jjtl (P-2026-10-02-1642)
- `0c221f237` merge: edge-ends takes alfonso-frontend-jjtl (P-2026-10-02-1641)
- `bb4246523` docs: add prompt P-2026-10-02-1642, merge viewpoint-colors-pastel into alfonso-frontend-jjtl
- `a6f169ad2` docs: add prompt P-2026-10-02-1641, merge alfonso-frontend-jjtl into edge-ends
- `c80aed8bb` docs: edge-ends trunk sync, report §7, log entry, ticket, Status (P-2026-10-02-1505)
- `8b5bd6de5` docs: addendum, log entry, ticket, Status, pastel trunk sync (P-2026-10-02-1506)
- `119046cb2` fix(editor-v2): a junction trunk's marker, the bench survivor closed (P-2026-10-02-1505)
- `9e1f9fae5` fix(editor-v2): a junction trunk takes its own new-end marker (P-2026-10-02-1505)
- `25ed824fb` fix: cite the pastel rows by their trunk ids R-VP-37..39 (P-2026-10-02-1506)
- `68c3f8251` merge: alfonso-frontend-jjtl into viewpoint-colors-pastel (P-2026-10-02-1506)
- `48abe2b94` docs: discovery report for the pastel trunk sync (P-2026-10-02-1506)
- `1e1ce1334` merge: alfonso-frontend-jjtl into edge-ends (P-2026-10-02-1505)
- `b7d0885e9` docs: edge-ends trunk sync, Phase 1 report (P-2026-10-02-1505)
- `77a3596fe` docs: add prompt P-2026-10-02-1506, sync the trunk into viewpoint-colors-pastel
- `dc013e8ba` docs: add prompt P-2026-10-02-1505, sync the trunk into edge-ends
- `7d1882c5f` docs: R-VP-32..34, log entry, tickets, report addendum, Status (P-2026-09-30-2022)
- `feefa9214` feat: pastel metaclass colours, per-class overrides, reference-aware (P-2026-09-30-2022)
- `f61fc0265` docs: discovery report for pastel metaclass colours (P-2026-09-30-2022)
- and 6 more: `git log --oneline adb5d9731..936a1b947`

This branch brings, 5 commits:

- `c0dfec656` docs: Status flip for P-2026-10-02-1647, chat check on the probe measures
- `52271ce80` docs: R-IRN-41, log entry, undo ticket and Status for path label edit (P-2026-10-02-1647)
- `aa04b92fb` feat(editor-v2): a path label on one attribute edits on the canvas (P-2026-10-02-1647)
- `ddb7a8c16` docs: discovery report, path label editable on the canvas (P-2026-10-02-1647)
- `7bb901a12` docs: add prompt P-2026-10-02-1647, path label editable on the canvas

Measured by `lane-run merge --trunk-into` at 2026-10-02 21:32, trunk at `936a1b947`:

- `git merge-tree --write-tree --name-only path-label-edit 936a1b947`: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/symbol-editor.md`.
- Files changed since the base: 11 on the branch side, 43 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/symbol-editor.md`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`.
- `git diff --name-only adb5d9731 c0dfec656 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-02_1647_prompt_path_label_edit.md` (eseguito 2026-10-02 · lane path-label-edit · aa04b92fb, 52271ce80 · six Phase 1 recommendations adopted (unattended), R-IRN-41 provisional · verifica della chat sulle misure della probe (35/36; the one failure is undo of an inline write, pre-existing on the trunk for row value edits too, ticket filed, fix in the critical zone), scene and DemoFlowB derived 0 px, no label newly editable, crop non ispezionati a vista · merge senza GO visivo di Alfonso: non cambia la demo (RC-26), su suo «ok» del 2026-10-02).
- `git worktree list`: `path-label-edit` in `/Users/alfonso/jjodel-w-pathlabel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `936a1b947` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `936a1b947` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only path-label-edit 936a1b947` (measured above: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/symbol-editor.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 936a1b947`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-IRN-41` (branch), `R-IRN-40` (trunk), `R-IRN-39` (trunk), `R-VP-37` (trunk), `R-VP-38` (trunk), `R-VP-39` (trunk), `R-EE-1` (trunk), `R-EE-2` (trunk), `R-EE-3` (trunk), `R-EE-4` (trunk); control: `- **R-EE-5**` none.
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — feat(editor-v2): a path label on one attribute edits on the canvas (P-2026-10-02-1647)` once (branch).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: one undo does not restore a slot value written by syncUpdateFeatureValue` once (branch).
   - `docs/decisions.md`: the heading `## Serie R-EE — edge ends, slice E (decisioni 2026-09-30)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — fix(editor-v2): «editable inline» toggle of a value segment reads the effective value (P-2026-10-02-1646)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: segment-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1810)` once (trunk).
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
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(editor-v2): IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: IR edge labels and the form-hook comment after a rename` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: ir-label-name-refresh into alfonso-frontend-jjtl (P-2026-10-02-2109)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `docs/log-inbox/symbol-editor.md`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: path-label-edit takes alfonso-frontend-jjtl (P-2026-10-02-2132)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c0dfec656` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane path-label-edit · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/symbol-editor.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, path-label-edit took the trunk (P-2026-10-02-2132)` (P16, RC-17). `Outcome: done`. The merge of `path-label-edit` into the trunk gets its own prompt (`lane-run merge path-label-edit --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
