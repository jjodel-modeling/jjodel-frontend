# DCN slice 5, lane 7: roles for coherence constraints

Prompt-ID: P-2026-11-09-0124
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-09 · lane full · d6e051d6c · verifica visiva non applicabile 2026-11-09 (no UI path)
Lane: full (role catalog, DCN roles, profile; no UI, no evaluation)
Depends: R-DCN-28, R-DCN-31; discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §C (H4: no CoherenceConstraint role yet) and §D lane 7; spec docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §3 (CoherenceConstraint, BoundedPersistence, BoundedResponse)
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file. No subagents, no background tasks. Every reply opens with [P-2026-11-09-0124 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: read §C of the report and the spec §3 block only; grep first, about 60 lines around; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log.

## COSA

(1) **Roles.** Add to the «Dynamic classification» profile the optional roles that let a metamodel bind coherence constraints, following how the existing dcn roles are declared (`roleCatalog.ts`, `dcnRoles.ts`, `simProfiles.ts`; grep `simMonitor` for the pattern): the constraint class (`simCoherence`), its context reference to the static class (`simCoherenceContext`), the pointwise expression φ (`simCoherencePointwise`), the pattern reference (`simCoherencePattern`), BoundedPersistence's condition and k (`simPersistenceCondition`, `simPersistenceBound`), BoundedResponse's trigger, response and k (`simResponseTrigger`, `simResponseResponse`, `simResponseBound`). Grep each name first; adjust names to the catalog's convention and report them. All optional: a binding without them stays complete.

(2) **Reader.** `dcnStcFromRoles` (or a sibling `dcnCoherenceFromRoles` in `dcnRoles.ts`) returns, for a bound metamodel, the constraints as plain data: id, name, context class id, φ text or null, pattern kind (`persistence` | `response` | null) with its texts and k. Unbound roles give an empty list. A pattern with a missing k or a non-positive k is reported as a compile defect in the same channel the other dcn compile defects use (say which).

(3) **Tests**, red first, in the existing test files of the three modules: catalog lists the new roles as optional; a bag without them is still complete; the reader returns one φ-only constraint, one persistence and one response from a hand-built bag; a bad k gives a defect.

(4) **Gates**: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench (at least 6 mutants).

(5) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: non applicabile, no UI path). Status flip. `git add` only named files. No push, no merge. Final message: role names, reader output type, files and commits, gate table, mutants, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/roleCatalog.ts, sim/simProfiles.ts, frontend/src/model/simulation/dcn/dcnRoles.ts, their tests; docs/log-inbox/dcn.md; this prompt. The roles dialog shows catalog roles by itself: no change to SimRolesModal.tsx unless a test proves the new roles do not appear (then stop with Outcome: question). Nothing else; ask first.

## RIFERIMENTI

docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §3, §7; docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §C, §D; docs/decisions.md R-DCN-28, R-DCN-31, R-DCN-10.
