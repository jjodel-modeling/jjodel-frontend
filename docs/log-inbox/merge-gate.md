# Log inbox — merge gate (P-2026-09-19-1622)

Entries for the merge-gate lane, kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

## 2026-09-19 — merge: reintegrate validation-skeleton into alfonso-frontend-jjtl, steps A to C (P-2026-09-19-1740)
**Prompt**: `P-2026-09-19-1740` with its addendum (items 1-6), GO given in chat with the preconditions verified there. Steps A (re-measure), B (merge, resolve, gates, commit) and C (rotate the log) done; D (visual check), E (push) and F (simulator slice 0) not started. The prompt asks for Opus 5 in the banner; the GO overrode it ("procedi comunque con il trailer veritiero"), so every trailer says Sonnet 5.
**Files touched**: merge `4d397ac02` (parents `1b36576fb` and `30707bfd9`, 228 files: 149 added, 79 modified, 11 conflicting: `docs/PROTOCOL.md`, `docs/archivio/claude_milestone_validazione_scheletro.md`, `docs/claude-code-log.md`, `docs/decisions.md`, `docs/spec/spec_attive.md`, `SymbolEditorModal.scss`, `SymbolEditorModal.tsx`, `IRNodeContent.tsx`, `irCompile.ts`, `irTypes.ts`, `lastViewpoint.ts`); rotation `491fc1c4b` (the two log files, the archive, and the six inbox files the fold emptied); this entry. None of the six §3.2 files differs from the trunk parent.
**Outcome**: ⚠️ partial — steps A to C complete, but `check:docs` Check B is red after the rotation (below), and D to F are still to run.
**Corregge**: —
**Causa**: (a)
**Regressions**: no. Step A: `merge-tree` reports exactly the 11 expected files, none outside; `merge-file` hunks per file PROTOCOL 2, log 2, decisions 1, spec_attive 2, `SymbolEditorModal.scss` 1, `.tsx` 3, `IRNodeContent` 1, `irCompile` 2, `irTypes` 1, `lastViewpoint` 2 (the IR trio 1/2/1, all take-branch). Trunk baseline measured: typecheck **14** errors, vitest **3493** passed with 9 files red at import, build exit 0; branch baseline 33 typecheck in its own tree, 3911 passed. Merged tree: typecheck **14**, the same set as the trunk line-stripped; vitest **3935 passed, 0 failed**, the same 9 files red as the trunk; build exit 0; `check:agents` exit 0; `check:docs` 3/4 with only D red at 86 entries, as declared. After the rotation: D green (40), **B red**: 10 field errors in 7 entries folded verbatim from the trunk inboxes (Causa with an annotation, Corregge or Causa absent). The fold moved 15 entries, not the "seven" written in the body of `491fc1c4b`.
**Out-of-scope changes**: yes — merge-caused, declared in the merge body: `irValidate.test.ts`, the "NO cornerRadius key" test read the key from `defaultObjectViewIR()`, which the trunk seeds with `cornerRadius: 8` (R-IRN-35), and now drops it from the seed (two lines, test only). Also the six emptied inbox files in the rotation commit, where the prompt named the two log files.
**Layer Impact Report**: not-required — no §3.2 file in a conflict hunk, and none differs from the trunk parent.
**Smoke visivo**: non applicabile — Step D is the visual check and comes after this entry.
**Notes**: Resolution table, the removed cornerRadius duplicate (one declaration in ShapeSpec, one in CompiledView, diffed identical to the trunk) and the separatorColorStyle rebuild are in the body of `4d397ac02`. 43 duplicate archive headings dropped, first copy kept; one group (2026-08-13, dark-mode menus) differs in its Files touched line.
**Prompt document name**: 2026-09-19 17:40

## 2026-09-21 — merge: visual check and push of the reintegration, steps D and E (P-2026-09-19-1740)
**Prompt**: `P-2026-09-19-1740`, steps D and E. Alfonso's visual check on the merged tree, hard refresh on `localhost:3002` (3000 and 3001 held by other servers): seven items, seven ok (modal above the rail, tree "+" view with IR, native object chrome per R-IRN-29, diamond rounded and ellipse ignoring the radius per R-IRN-35, "Create edge view" and "Create row view", a project saved before `400095370`, homonymous metaclasses distinct per R-MCID-1). Server stopped, symlink removed, trunk pushed.
**Files touched**: this entry only. Merge `4d397ac02`, rotation `491fc1c4b` and the entry of steps A to C `8211a9d8a` are in the entry above.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no. Deviation 1 of the entry above (`irValidate.test.ts` reading the seeded key) accepted by Alfonso on 2026-09-21: the old test embodied D5, R-IRN-35 keeps the seed 8.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, ACK of 2026-09-21, seven of seven on `localhost:3002`; which sub-checks of each item were exercised is not itemized in the ACK.
**Notes**: RC-11 derogation, declared: `npm run check:docs` Check B is red on the trunk after the rotation (10 field errors in 7 entries folded verbatim from the trunk inboxes: Causa with an annotation, Corregge or Causa absent). Accepted by Alfonso on 2026-09-21; the entries stay verbatim and the repair is a docs lane of its own after the push.
**Prompt document name**: 2026-09-19 17:40

## 2026-09-21 — chore: simulation-engine slice 0 onto the trunk, the archive tag and the pushes, step F (P-2026-09-19-1740)
**Prompt**: `P-2026-09-19-1740` addendum item 2, step F, P14 literal. Of the 38 commits of `simulation-engine` six were not on the trunk (`git cherry`, re-measured 2026-09-21: the same six). Tag `archive/simulation-engine-2026-09-14` on `baf7b2b8a`; the three code commits picked with `-x` one at a time, `merge-tree` before each against the moving HEAD; the three log commits not picked, their entries moved verbatim into `docs/log-inbox/simulation.md`; `~/jjodel-sim` reset to the trunk. Hard stop before the pushes, then Alfonso's GO.
**Files touched**: code `135ab7a24` (from `2f53c876a`), `25cd6149a` (from `c70c9f7b5`), `857cb9335` (from `c09cf4353`); docs `577cc52b5` (`docs/log-inbox/simulation.md`, three entries verified verbatim by substring). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. After the third pick, from `frontend/` through the temporary symlink: vitest **3962 passed, 0 failed** (3935 + 27 from `step.test.ts`, which ran alone as 27 of 27), the same 9 files red at import as the trunk; typecheck **14**, the same set as the trunk. Build not re-run (the picks add no new dependency and the build was measured at the merge).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Pushed on Alfonso's GO of 2026-09-21: `alfonso-frontend-jjtl` 67290d8f5..577cc52b5 (the trunk was at 1b36576fb before the merge) and the tag. `simulation-engine` does not exist on origin (`ls-remote --heads` empty), so nothing was left alone there: the branch was only ever local. `~/jjodel` holds `4d8a93124` (tracer) on the branch, after the merge, outside this lane.
**Prompt document name**: 2026-09-19 17:40
