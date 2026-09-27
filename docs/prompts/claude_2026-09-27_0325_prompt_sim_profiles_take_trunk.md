# Prompt: sim-profiles takes the trunk (C2 derived attributes) before its own merge

Prompt-ID: P-2026-09-27-0325
Chat: C-2026-09-26-1702
Lane: full (merge of the trunk into the branch; one docs conflict to resolve by union; gates on the result)
Status: eseguito 2026-09-27 · lane sim-profiles · 93e62abbb · verifica visiva passata 2026-09-27 (chat, unattended: M3 on 3006 and C2 on 3005 re-run on the merge; Alfonso in the morning digest)

Worktree: `~/jjodel-gate`, branch `sim-profiles`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `sim-profiles`, `git log -1` is the commit that adds this file (its parent `481768fcc`, the closure of `P-2026-09-27-0225`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0325 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `cdb46a7ee` (the Status flip of the C2 merge `fe4e3030b`) into `sim-profiles` with one merge commit, `--no-ff`, in the shape of `3b7770708` (this branch's earlier trunk merge; read its body). Merge base `64a910c8e`. The trunk brings, since the base: the enum edge guard lane (`5dc09a4ce` and its merge `1b40eacd0`) and lane C2, the derived state attributes (`5060657c5`, `53c24b1fc`, closure `2ce6e4dae`, merge `fe4e3030b`). This branch brings M3 (`48ab676df`, `d1d1bba2b`, closure `481768fcc`).

Both sides touched `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` and `simulation-panel.scss` (C2: the stored | derived select and the equation cell in the declarations table; M3: the Profile row, Apply, Configure…, the `max-height` on the body). Measured from chat at 03:25 with `git merge-tree --write-tree --name-only sim-profiles cdb46a7ee`: both auto-merge; the only conflict is `docs/decisions.md` (R-SIM-73..76 on the trunk and R-SIM-77..79 on the branch appended at the same place). `docs/log-inbox/simulation.md` may conflict once the closure entry is on the branch (the trunk side holds the C2 entry `P-2026-09-27-0200`).

## COME

1. Preconditions above, plus: `cdb46a7ee` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `cdb46a7ee` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `~/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only sim-profiles cdb46a7ee`. Expected conflicts: `docs/decisions.md`, possibly `docs/log-inbox/simulation.md`. A conflict in any code file: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit cdb46a7ee`.
4. Resolve `docs/decisions.md` by union: both blocks kept whole and verbatim, R-SIM-73..76 (trunk) first, then R-SIM-77..79 (branch), no conflict markers, no edit inside any decision block; `grep -c '^- \*\*R-SIM-7[3-9]\*\*' docs/decisions.md` gives 7 and each of the two section headings («Decisioni 2026-09-27: …») appears once. Resolve `docs/log-inbox/simulation.md`, if it conflicts, by union: preamble, the trunk's entries, then the branch's entry, all verbatim, each heading once.
5. On the resolved tree, before committing, read the auto-merged `SimulationPanel.tsx` once from top to bottom (Rule: an auto-merge is a textual result, not a semantic one): the declarations table must still carry the stored | derived select and the equation cell, and the Profile row, the summary line, Apply and Configure… must still be there; the JSX must have one root per component and no duplicated hook. Same reading for `simulation-panel.scss`: the `.sim-panel--open` flex rule with `max-height` and the equation cell rule both present, no duplicated selector.
6. Commit the merge. Subject within 72 characters, counted: `Merge branch 'alfonso-frontend-jjtl' into sim-profiles (C2 derived attributes)`; if that exceeds 72, use `merge: sim-profiles takes the trunk with lane C2 (P-2026-09-27-0325)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `~/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the 39 tests M3 added, 0 failed, the same 9 files red at import; hook tests 255; build exit 0; `check:docs` 4/4; `check:scripts` PASS.
8. `Outcome: hard-stop`: the chat re-runs the two visual probes on this tree (M3 checklist on 3006, the C2 checklist on 3005) and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito 2026-09-27 · lane sim-profiles · <merge sha> · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip, sim-profiles took the trunk (P-2026-09-27-0325)`. No log entry. `Outcome: done`. The merge of `sim-profiles` into the trunk gets its own prompt.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `~/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Precedents `3b7770708` (this branch's earlier trunk merge), `ca9880700` (sim-derived's), `24d8537fd` and `1b40eacd0` (merge bodies with union resolutions).
