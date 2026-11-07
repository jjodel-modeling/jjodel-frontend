# DCN L4.4: the DCN step, a SimNucleus over the placeless net and the σ handles

Prompt-ID: P-2026-11-07-1432
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (new nucleus module; additive members of an exported union)
Depends: R-DCN-2, R-DCN-3, R-DCN-4, R-DCN-11, R-DCN-12, R-DCN-14, R-SIM-17, R-SIM-122; L4.1 (`SimNucleus`), L4.2 (`compileDcn`), L3.4 (slot writes), L4.3 (`dcnHandles`); spec docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §6
Worktree: ~/jjodel-w-dcn-l44, branch dcn-l44, from dcn-l43 at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 14:06 «procedi in lane auto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is done; this prompt carries the GO for Phase 2. No subagents, no background tasks. Commit the code as soon as the targeted suites are green, before the full run, so a context stop loses nothing. Every reply opens with [P-2026-11-07-1432 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log. Rule 11: this prompt authorizes two new `HaltReason` members, `unclassified` and `ambiguous`, and one optional mode parameter of the subset checker.

## Contesto (non rifare l'analisi)

Read spec §6 and, in code, only `components/editor-v2/sim/simNucleus.ts`, `model/simulation/dcn/dcnCompile.ts`, `model/simulation/dcn/dcnHandles.ts`, `model/simulation/netTypes.ts` (`HaltReason`, `SimState`, outcomes), the `step` signature in `netStep.ts`, `actionEvaluator.ts` (the slot marker of L3.4) and `subsetChecker.ts` around its `ClassificationTest` case. Two tickets come with this lane: L3.4 found that `netStep.ts` looks up an assignment by element and attribute name only, so a slot named like a declared state attribute of the same element would be applied as that attribute; L4.3 found that the subset checker refuses `.in(V::D)` with E-CALL, so `compileGuard` and `compileOutput` refuse every DCN guard or watch that tests a class.

## COSA

(1) A pure module `model/simulation/dcn/dcnStep.ts` exporting `dcnNucleus(compiled, snapshot, policy)`, a `SimNucleus` for DCN. It runs on the shared step for guards and state attributes (R-DCN-11), with these DCN parts around it:
- An invocation `op(o, Op, args)` is enabled when the owner class of Op is active for o (always for a static operation) and its precondition holds. It expands into Op plus every redefinition of Op in an active dynamic class of o (R-DCN-2).
- A tick (the `dcn-tick` event of L4.2) runs the monitors of every active dynamic class.
- Interleave (default, R-DCN-4): each contribution of a viewpoint is a labelled transition, chosen through the existing selector and «Choices: Ask | Random». Sync: all contributions in one parallel assignment read on the previous state; two writes of one slot are the double-assignment defect of R-SIM-17.
- Slot writes go to `σ.attrs` of the instance. The slot marker is read BEFORE any lookup by attribute name, so a slot never lands on a state attribute of the same name (L3.4 ticket).
- After every step the classification is recomputed through the L4.3 accessor, then checked in this order: ranges (the existing `domain` halt), completeness of every complete viewpoint (new halt `unclassified`, naming instance and viewpoint), exclusivity of every non-overlapping viewpoint (new halt `ambiguous`, naming the classes). Coherence watches are lane L5.3, not here.
(2) The subset checker gains an optional DCN mode in which `ClassificationTest` is accepted (it exports as a DEFINE later, spec §9); outside that mode the E-CALL refusal stays as it is (L4.3 ticket). The DCN guard and output compilation use that mode.
(3) Not wired into `startRun` (that is L4.5); no panel text.
(4) Tests first, one new test file, on the drone data used by `dcnHandles.test.ts`. They cover the whole operational cycle of the chapter:
- Charging with its monitor raising `battery` tick by tick until 100, then the classification moves to Ready.
- `takeOff()` enabled only in Ready, leading to Flying.
- The Flying monitor draining `battery` to 0, then Empty.
- An Alert state that falls in no class, halting `unclassified`.
- A non-overlapping viewpoint with two active classes, halting `ambiguous`.
- Interleave and Sync traces of the same tick with two viewpoints contributing.
- A Sync double write, halting as R-SIM-17 says.
- The slot and state-attribute name clash.
- A run of the existing Petri fixture through `petriNucleus` unchanged.
Mutation bench (P5).
(5) Gates: typecheck at the baseline of CLAUDE.md §17, the simulation, JjEL and sim suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. One code commit; the log entry appended to `docs/log-inbox/dcn.md` and the Status flip in one docs commit. No visual check is owed. Add as a ticket in the log entry: `generalizationClosure` now has copies in `dcnCompile.ts` and `dcnHandles.ts`, to be exported once from `bindingReader.ts`.

## HARD STOP

Any edit to `netStep.ts`, `netCompile.ts`, `simBridge.ts` or `simRunState.ts`, or more than six files: stop with Outcome: question.

## NON FARE

No wiring into the run, no panel, no exporter, no push, no merge. Public repo: name no partner company.

## RIFERIMENTI

docs/decisions.md R-DCN-1..21, R-SIM-17, R-SIM-122; docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §5, §6; docs/log-inbox/dcn.md (the L3.4 and L4.3 entries).
