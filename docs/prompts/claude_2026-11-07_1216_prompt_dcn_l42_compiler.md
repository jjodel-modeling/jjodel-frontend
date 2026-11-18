# DCN L4.2: the DCN compiler, resolved roles and the model to a placeless CompiledNet

Prompt-ID: P-2026-11-07-1216
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-07 · lane full · a5bef0684, 839affc1a · bench 25/26 and 3/3 · no visual check owed (closure written by the chat C-2026-11-06-2159 from the handoff after the context ceiling)
Lane: full (new nucleus module; one additive change to an exported type)
Depends: R-DCN-2, R-DCN-3, R-DCN-6, R-DCN-10, R-DCN-11, R-DCN-13, R-DCN-14, R-DCN-15, R-DCN-17; L2.1 (featureSources), L2.3 (`dcnStcFromRoles`), L4.1 (`SimNucleus`); discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.2, §3.3, §6 (lane L4.2)
Worktree: ~/jjodel-w-dcn-l42, branch dcn-l42, from the trunk at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 12:11 «via, procedi in lane auto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is done; this prompt carries the GO for Phase 2. No subagents, no background tasks. Commit as soon as gates are green; commit the code before the full run so a context stop loses nothing. Every reply opens with [P-2026-11-07-1216 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log. Rule 11: this prompt authorizes one optional property on `StateAttributeDecl`.

## Contesto (non rifare l'analisi)

Read the discovery §3.2 and §3.3 only, then `model/simulation/netTypes.ts` (`CompiledNet`, `SimState`, `StateAttributeDecl`), `model/simulation/dcn/dcnRoles.ts` (`dcnStcFromRoles`), `model/ontological/bindingReader.ts` (`featureClosure`, `dormantOwner`) and `components/editor-v2/sim/simNucleus.ts`. R-DCN-11: a guarded command is a Petri transition with empty preset and postset, run by the existing `step`; the DCN-only parts (classification, completeness, exclusivity, Interleave, Sync, redefinition expansion) are lane L4.4, not this one.

## COSA

(1) A pure module `model/simulation/dcn/dcnCompile.ts`: from the resolved DCN roles, a read view of the model and the R-OI binding, compile a `CompiledNet` with no places and one transition per (instance, operation) invocation and per (instance, viewpoint, monitor) tick contribution, each with nucleus-owned opaque ids (R-DCN-14) recorded in a side table the module returns (id to instance, operation or monitor, viewpoint, owning dynamic class). Guards: the operation's precondition and, for a dynamic-class operation or monitor, the classification of its class as a separate field the step lane will read (the classification itself is not evaluated here). Actions: the bodies, parsed later by the evaluator; keep them as text.
(2) σ seeded from the model: `attrs` per instance, one entry per feature of the closure (own, inherited, and dormant through `featureSources`, R-DCN-3), value from the slot or the feature's default; `marking` empty. Domains: Boolean, the enumeration's literals, `Integer` with the two range bounds when both are set (R-DCN-13); an unbounded `Integer` is simulated with no domain and flagged for the exporter (R-DCN-6). The optional property on `StateAttributeDecl` is the instance key (an M1 id) so a declaration can be per instance rather than per metaclass.
(3) Arguments of operations are R-SIM-88 inputs (R-DCN-15): declare them as inputs of the transition, not as events.
(4) Tests first, one new test file, on a synthetic read view of the drone class and object level (the fixture of `frontend/scripts/probe/dcn-drone-fixture.ts` reproduced as data, plus one DJI instance with `distance 0, speed 0, battery 80` and its slots): transitions and ids, the side table, σ with dormant slots and their owners, domains (battery 0..100), an unbounded Integer flagged, a missing slot seeded from the default, and stability of the ids across two compilations of the same model. Mutation bench (P5).
(5) Not wired: `startRun` does not call the compiler in this lane.
(6) Ticket from L2.3, in this lane because it touches the DCN roles: under the `dcn` shape the roles dialog still offers as «not used» the roles of the general, events, data and output groups. Under `dcn` show only the `dcn` group (the shared list of hidden groups per shape in `simProfiles.ts`), the two other shapes unchanged; extend the existing `simRolesDraft` test with the count under `dcn` and the case the L2.3 bench left alive (M16: control-flow and Petri groups shown under `dcn`). No visual check is owed for this item: the test is the check.
(7) Gates: typecheck at the baseline of CLAUDE.md §17, the simulation and sim suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. Code commits (the compiler, then the ticket); the log entry appended to `docs/log-inbox/dcn.md` and the Status flip in one docs commit.

## HARD STOP

A need to touch `netStep.ts`, `netCompile.ts`, `simBridge.ts`, `simRunState.ts`, or more than seven files in total: stop with Outcome: question.

## NON FARE

No step, no classification evaluation, no wiring into the run, no panel text, no push, no merge. Public repo: name no partner company.

## RIFERIMENTI

docs/decisions.md R-DCN-1..21; docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §3, §6, §8; docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.
