# log-inbox — lane «plugins»

Entries written by the plugins lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-31 — discovery: plugin mechanism census and sandbox probe
**Prompt**: P-2026-10-31-1800, read-only discovery of the plugin front: census of the extension points, role-catalog comparison, write paths (H3), evaluation budgets, sandbox probe of iframe + CSP + worker (H2), report, no product code.
**Files touched**: frontend/scripts/probe/plugin-sandbox-probe.ts (a298231e0); docs/discovery/harness/plugin-sandbox/{server.mjs,host.html,plugin-boot.js,worker.js} (6980be947); docs/discovery/discovery_2026-10-31_plugin_mechanism.md (1ea149576); docs/log-inbox/plugins.md and the prompt Status line (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Out-of-scope is yes only by the >5-files count (RC-11): every file is new and in the prompt's DOVE. The session hit the 200k soft ceiling before committing; the closure ran on GO. Probe: Chromium only, run 2 exit 0. H1 partly, H2 holds in the worker but not on the iframe main thread, H3 partly. Main finding (read): project open runs stored view code via new Function (reducer.ts:542 -> 862). R-RFB-12 does not exist.
**Prompt document name**: 2026-10-31 18:00

## 2026-10-31 — merge: plugin-discovery into alfonso-frontend-jjtl (P-2026-10-31-2254)
**Prompt**: Bring `plugin-discovery` at `c97fccffc` into the trunk `alfonso-frontend-jjtl` with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, union resolution of decisions and log inboxes if they conflict, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 4ac40a8ef (8 files from the branch: the discovery report, the plugin-sandbox harness, `frontend/scripts/probe/plugin-sandbox-probe.ts`, the branch prompt Status line and inbox); `docs/prompts/claude_2026-10-31_2254_prompt_merge_plugin-discovery.md` Status line; `docs/log-inbox/plugins.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat on 3001, unattended: no user-facing change, docs, harness and probe only)
**Notes**: Tip did not move. Re-measured at 0ff38d4c5: zero conflicts, tree 8ca9c9e2f = index. No file on both sides, no union, 27 probes as expected. Branch prompt is modified, not added (in the base). Gates on 4ac40a8ef: typecheck 0, typecheck:scripts 0; vitest 12583, 471 files, same 9 red at import; hooks 967; build 0; check:docs 5/5 (prompt said 4/4); agents, scripts, addonly PASS. irCollapsedRender red once on the tip baseline (Chromium hook timeout), 13/13 alone. Lane board untouched; 3001 up.
**Prompt document name**: 2026-10-31 22:54

## 2026-11-09 — feat: expression catalog S1 closed, visual check due (P-2026-11-09-0108)
**Prompt**: Finish of P-2026-11-09-0035: move the expression label rules out of the pinned part of `irStyle.ts`, rename the false test, mutation bench, every gate and both probes, code commit. Closes expression catalog S1 (P-2026-11-08-2345, P-2026-11-09-0010, P-2026-11-09-0035).
**Files touched**: b42ddc837, 15 files: `viewpoint/ir/{irTypes,irValidate,irCompile,irReadCtx,irReadCtxLproxy,irResolveCore,useIRContainment,irStyle}.ts`, `viewpoint/ir/IRNodeContent.tsx`, `viewpoint/authoring/TextSourceEditor.tsx`, `sim/DeriveViewpointDialog.tsx`, `utils/deriveViewpoint.ts`, new `model/expression/exprFoldViews.ts`, new tests `exprFoldViews.test.ts` and `irExpressionSource.test.ts`. S1a: 985c27b54. S1 fixtures: c3ffb710a. Status lines of the four prompts. Gitignored, not committed: `frontend/scripts/smoke/_tmp_expr_s1b.ts`.
**Outcome**: ✅ completed
**Corregge**: 2026-11-09 00:35 (P-2026-11-09-0035)
**Causa**: (c)
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: produced
**Smoke visivo**: non eseguito, visual check due: `dialog_brief_binding.png`, `fold_open.png`, `fold_laid_out.png`, `fold_after_edit.png` in ~/.jjodel-lanes/P-2026-11-09-0035/ for the chat (RC-23)
**Merge GO**: Alfonso 2026-11-09 19:46. The chat did not run the RC-23 browser check; Alfonso checks on the merged trunk.
**Notes**: Out-of-scope is yes only by the >5-files count (RC-11): the 15 paths are the handoff's Scope. LIR in P-2026-11-08-2345. Second cause (g): four sessions stopped at AM-8. Regressions unknown until the visual GO. Gates: typecheck, build, vitest 15648 passed with only the 3 §17 failures, smoke 12/0/3, bpmn-lanes 12/12. S1b probe: 249 nodes, 248 edges, 246/246 labels, edit in 1.2 s. Five-seam bench in the commit message. Probe evidence: probe_s1b.json in the lane folder.
**Prompt document name**: 2026-11-09 01:08

Open after P-2026-11-09-0900 (fold views without `defaultSize`), one run at load 7.7: blocked 11.1 s (before 31.8, trunk 12.7), longest task 3.2 s (before 18.0, trunk 3.4), mounted nodes at open 2 (before 249, trunk 15), first node 10.4 s.
Labels after zoom out: 213/213 matching on the 109 of 128 owners in the DOM, 227 of 249 nodes mounted; the 246/246 of S1b is no longer observable by the probe, which reads only mounted nodes. Widest node 464 px with the CSS cap of 460. Screenshot: p0900_fold_open.png in ~/.jjodel-lanes/P-2026-11-09-0806/.
Auto layout after P-2026-11-09-0952, branch step 3 (ELK in a worker, stress kept): rectpacking met the numbers (ELK 161 ms, 3.36 x 2.89 screens, 0 overlaps) but ignores edges, layered wrapping stayed 3.69 x 25.90 screens.
Three runs started at load <= 16 (the first ended at 147): longest main-thread task 4.4 / 2.2 / 1.4 s, median 2.2 (was 11.9), 4.35 x 6.52 screens, 0 overlaps, total 22.7 / 20.4 / 11.9 s, median 20.4 against a target of 10; evidence in ~/.jjodel-lanes/P-2026-11-09-0952/.

**Ticket** (open time, P-2026-11-09-0108): with the fold active the DDR4 model opens with the main thread blocked 32.1 to 32.9 s over four runs (one gap of 21.6 to 22.2 s), against 18.2 to 21.5 s on the trunk in §4 of `docs/discovery/discovery_2026-11-08_expression_catalog.md`. Last DOM change 10.8 to 30.7 s, bimodal, against 16.1 to 19.1 s. Starting load 2.2 to 13.3. The long task was not traced.

**Ticket** (roles, P-2026-11-09-0035): 20 classes without a role print `<Class>`. Reported by the handoff of P-2026-11-09-0035, not remeasured here.

**Ticket** (bar shape, P-2026-11-09-0108): `.ir-label.ir-label--expr` now follows `.ir-node-content.ir-shape--bar > .ir-label` at equal specificity, so an expression label authored on a bar shape takes 2px vertical padding instead of 0. Fold views always use `rect`. The `@shared` label on the sharing host is covered by a unit test only: the probe does not measure it.
