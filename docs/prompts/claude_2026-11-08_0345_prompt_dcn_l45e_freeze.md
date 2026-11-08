# DCN L4.5e: a DCN run cannot freeze its model (L proxy at superTypes[n].isAbstract)

Prompt-ID: P-2026-11-08-0345
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (fix; root cause first; `editor-v2/sim/` DCN branch and `model/simulation/dcn/`)
Corregge: 2026-11-08 03:40 (P-2026-11-08-0329: Reset of the drone refuses the run, «The model cannot be frozen: an L proxy at globals.InstanceValue_3 ... .association.instanceof.superTypes.0.isAbstract»)
Worktree: ~/jjodel-w-dcn-l45, branch dcn-l45, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the only uncommitted change is the untracked `frontend/scripts/probe/dcn-drone-run.ts` (the acceptance probe of P-2026-11-08-0329); otherwise stop with Outcome: blocked. No CLAUDE.md §3.1/§3.2 critical-zone file (if one is needed, stop with Outcome: question). No subagents, no background tasks. Every reply opens with [P-2026-11-08-0345 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: never read a whole large file (`simBridge.ts`, `guardContext.ts`, `dcnToProblems.ts`): grep for the symbol, then read about 60 lines around it. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; grep only MEAS, FAIL, DONE and failing test names; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. Commit as soon as an item is green.

## COSA

(0) Commit the probe unchanged: `test(dcn): drone run probe, acceptance for the freeze fix (P-2026-11-08-0329)`.

(1) **Root cause, short discovery report first.** The message comes from `startDcnRun` (`simBridge.ts` about 744 and its `freezeSnapshot` about 871) through the freeze walk of `guardContext.ts` (about 108). Find which value of the DCN evaluation context holds a live L proxy: the global `InstanceValue_3` (the fourth InstanceValue of `wau1.ownedSensors`) is reached as a global, and from it `parent`, `classifier`, `instanceof` lead into the metamodel. Establish (a) why model elements such as InstanceValue nodes are globals of the DCN context, (b) which reader puts L proxies (not plain snapshots) into it (`dcnReadView`, `dcnInputOf`, the handles, or `startDcnRun` itself), and (c) how the Petri path builds its globals so that it freezes. Save `docs/discovery/discovery_2026-11-08_dcn_freeze_proxy.md` (objective, files and lines read, the path, the cause, the fix chosen, risks) and commit it.

(2) **Fix inside the DCN branch.** The freeze rule of `guardContext.ts` is not weakened and not bypassed: the DCN context must hand it plain values, like the Petri one. Fix where the cause is (the DCN reader or `startDcnRun`), with a red test first that reproduces it with a context holding a proxy-like value along the same kind of path. If the cause is in a file outside DOVE, or the fix would change `guardContext.ts` or the Petri path, stop with Outcome: question.

(3) **Acceptance.** Run `frontend/scripts/probe/dcn-drone-run.ts` once (free port, temporary node_modules symlink removed at the end): L45d-1 still passes and Reset no longer reports «cannot be frozen». Report the MEAS lines. If Reset now halts for another reason (unclassified at σ0 is expected only after the first step; empty slots `dji.power`, `dji.vmax`, sensor slots), report which and stop with Outcome: done (the visual lane is re-run by the chat), not question.

(4) Gates: typecheck, typecheck:scripts, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench on the fix (at least 4 mutants).

(5) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters measured with `wc -m`; Corregge: the 0329 report; Causa: one line; Layer Impact Report not-required unless the hook asks; Smoke visivo: «probe acceptance, crops by the re-run of P-2026-11-08-0329»). Status flip of this prompt. `git add` only named files. No push, no merge. Final message: cause, fix, files and commits, gate table, mutants, probe MEAS, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simBridge.ts (the DCN branch only) and its tests; frontend/src/model/simulation/dcn/*.ts and their tests (`dcnCompile.ts`, `dcnHandles.ts`, `dcnStep.ts`, `dcnRoles.ts`, `dcnPanelText.ts`); frontend/src/components/editor-v2/problems/dcnToProblems.ts only if the reader `dcnInputOf` is the cause (one function, its tests); frontend/scripts/probe/dcn-drone-run.ts (commit only); docs/discovery/, docs/log-inbox/dcn.md, this prompt. Not `guardContext.ts`, not the Petri path. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-0329/ (its final message, the probe output); docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md; docs/decisions.md R-DCN-2, R-DCN-8, R-SIM (the run never writes the model; frozen snapshot).
