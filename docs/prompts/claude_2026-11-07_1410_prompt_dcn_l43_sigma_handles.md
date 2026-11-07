# DCN L4.3: σ-backed handles for DCN instances, the classification accessor bound

Prompt-ID: P-2026-11-07-1410
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-07 · lane full · dfcd795c3 · verifica visiva non applicabile (no UI path, the prompt owes none; chat C-2026-11-06-2159, lane auto)
Lane: full (new nucleus module; one additive change to the guard context builder)
Depends: R-DCN-2, R-DCN-3, R-DCN-7, R-DCN-12, R-DCN-17; L3.3 (classification accessor), L3.4 (slot writes), L4.2 (`compileDcn`); discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.4 and §6 (lane L4.3)
Worktree: ~/jjodel-w-dcn-l43, branch dcn-l43, from the trunk at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 14:06 «procedi in lane auto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is done; this prompt carries the GO for Phase 2. No subagents, no background tasks. Commit the code as soon as the targeted suites are green, before the full run, so a context stop loses nothing. Every reply opens with [P-2026-11-07-1410 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log.

## Contesto (non rifare l'analisi)

Read the discovery §3.4 only, then `model/simulation/guardContext.ts` (`freezeSnapshot`, `buildGuardContext`, `SimStateReader`), `model/simulation/dcn/dcnCompile.ts` (`DcnCompiled`, `DcnSlot`, `DcnEntry`), `jjel/evaluator/context.ts` (`JjelClassificationAccess`) and `model/simulation/boardOutputs.ts` (`evaluateOutput`). On the R-OI level an instance is an `InstanceSpecification`: `self.battery` does not resolve on the frozen pool handle, so the DCN nucleus binds `self` and every instance to a handle built from σ at each evaluation.

## COSA

(1) A pure module `model/simulation/dcn/dcnHandles.ts`: given the compiled DCN (`DcnCompiled`), the current σ and the frozen snapshot, build a handle per instance whose members are the features of its closure read from σ (own, inherited, dormant), whose associations navigate to the handles of the linked instances, and whose `name` and classifier are readable. Reading a dormant slot through a handle is allowed (W1 is static, R-DCN-3).
(2) The classification accessor for the DCN run: `isIn(object, V, D)` evaluates the invariant of D on the handle of `object` with the same context, memoized per (instance, dynamic class) for one evaluation of σ; a viewpoint or class name that does not exist on the instance's static class (or its generalization, R-DCN-17) throws, so the tri-state reports `exception`. A cycle of classification reads (W2 violated) throws with a message naming the cycle instead of recursing.
(3) `buildGuardContext` gains an optional DCN binding (handles plus accessor) used for `self` and named instances; without it nothing changes. `evaluateOutput` (watches and board outputs) reads the same handles when the binding is given.
(4) Tests first, one new test file, on the drone fixture data already used by `dcnCompile.test.ts`: `self.battery`, a dormant slot, navigation `self.wau.ownedSensors`, `self.in(Mode::Charging)` true for DJI at distance 0, speed 0, battery 80, `Ready` false; overlapping `Empty` and `Charging` at battery 0; an unknown viewpoint gives `exception`; a cycle gives the named error; a watch over `self.battery` through `evaluateOutput`; and parity: without the binding every existing guard and watch test is unchanged. Mutation bench (P5).
(5) Gates: typecheck at the baseline of CLAUDE.md §17, the simulation, JjEL and sim suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. One code commit; the log entry appended to `docs/log-inbox/dcn.md` and the Status flip in one docs commit. No visual check is owed.

## HARD STOP

A need to touch `netStep.ts`, `netCompile.ts`, `simBridge.ts`, `simRunState.ts`, or more than five files: stop with Outcome: question.

## NON FARE

No step, no Interleave or Sync, no halts, no wiring into `startRun`, no push, no merge. Public repo: name no partner company.

## RIFERIMENTI

docs/decisions.md R-DCN-2, R-DCN-3, R-DCN-7, R-DCN-12, R-DCN-17; docs/spec/concern_languages.md «Dynamic classification in JjEL»; docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §5, §6.
