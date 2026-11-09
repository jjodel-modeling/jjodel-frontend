# DCN slice 5, lane 9: evaluating coherence constraints over a trajectory

Prompt-ID: P-2026-11-09-0259
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (one pure module and its test; no wiring, no UI)
Depends: lane 7 (`dcnCoherenceFromRoles`, d6e051d6c), lane 8 (drone constraints) on dcn-s5; R-DCN-28, R-DCN-31
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file. No subagents, no background tasks. Every reply opens with [P-2026-11-09-0259 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: grep first, about 60 lines around; never read a whole file over 400 lines; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log.

## Semantics (fixed by the chat from the SoSyM paper, do not redesign)

From Bucchiarone, Pierantonio, Vangheluwe, *Synergic modeling of coherent systems*, SoSyM 2026, §3.1 (Examples 1 and 2, k = 2) and §4.2 (Definition 5): a trajectory τ = σ0, σ1, … is admissible under C = (φ, ψ) iff φ holds at every σi and ψ holds on τ. Steps are committed steps of the run (R-DCN-31), so σ0 is the state at Reset and σi the state after the i-th committed step.
- **φ (pointwise)**: violated at step i when φ(σi) is false.
- **BoundedPersistence(condition, k)**: the condition may hold for at most k consecutive steps. Violated at step i when it has held at σ(i−k), …, σi (k+1 consecutive states). Example 1 of the paper: HighLoad for two consecutive steps with k = 2 is admissible; Example 2: three consecutive steps is not.
- **BoundedResponse(trigger, response, k)**: whenever the trigger holds at σi, the response must hold at some σj with i ≤ j ≤ i+k. Violated at step i+k when the trigger held at σi and the response held at none of σi … σ(i+k). A trigger still open at the end of the trace is pending, not violated.
- Each constraint is evaluated per instance whose classifier's generalization closure includes the constraint's context class; `self` is that instance.
- After a violation the monitor keeps going: a later violation is reported again (one hit per step per instance per constraint).

## COSA

(1) New pure module `frontend/src/model/simulation/dcn/dcnCoherence.ts` (grep the name first) exporting a compile step (constraint texts → evaluators in the DCN guard context, the same expression context the invariants use, with defects reported like other DCN compile defects) and `coherenceHits(compiled, configurations)` returning, for a trajectory given as the list of configurations σ0..σn, the hits `{ step, instanceId, constraintId, kind: 'pointwise' | 'persistence' | 'response' }` and the pending responses at the end. Counters are a pure fold over the configurations (not stored in σ, R-DCN-31); cache per configuration object (WeakMap), so step back and replay recompute nothing already seen.

(2) Test `dcn/__tests__/dcnCoherence.test.ts`, red first, on a hand-built drone-like model: φ violated at one step; persistence with k = 2 admissible at two consecutive steps and violated at the third (the paper's Examples 1 and 2 transposed); response met at i+k, violated at i+k+1 boundary (one off-by-one test on each side); a pending trigger at the end; two instances with independent counters; a constraint whose context does not match an instance's classifier is not evaluated; a defect for an unparsable expression.

(3) Gates: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench (at least 10 mutants, the boundaries above among them).

(4) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: non applicabile, no UI path); the Notes cite the SoSyM sections the semantics come from. Status flip. `git add` only named files. No push, no merge. Final message: API, files and commits, gate table, mutants, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/model/simulation/dcn/dcnCoherence.ts (new) and its test; docs/log-inbox/dcn.md; this prompt. Read-only elsewhere (`dcnRoles.ts`, `dcnHandles.ts`, `dcnStep.ts`, `guardContext.ts`). Nothing else; ask first.

## RIFERIMENTI

docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §3, §6, §7; docs/decisions.md R-DCN-28, R-DCN-31; lane 7's entry in docs/log-inbox/dcn.md (reader output, defect channel).
