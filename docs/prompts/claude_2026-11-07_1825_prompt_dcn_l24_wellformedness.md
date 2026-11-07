# DCN L2.4: well-formedness W1..W4 and W6 in the problems registry

Prompt-ID: P-2026-11-07-1825
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-07 · lane full · LIR 12019b986, code eb96cbb10 (continued by P-2026-11-07-1900 after the context ceiling) · verifica visiva passata 2026-11-07 (chat C-2026-11-06-2159) · log entry in docs/log-inbox/dcn.md
Lane: full (touches `editor-v2/problems/`, CLAUDE.md §3.1: Layer Impact Report owed; launched with the critical-zone go-ahead of Alfonso, 2026-11-07 18:21 «via» on L2.4)
Depends: R-DCN-3, R-DCN-10, R-DCN-13, R-DCN-16, R-DCN-17, R-DCN-21, R-DCN-23; L2.3 (`dcnStcFromRoles`), L3.2 (`ClassificationTest`), L4.2 (`compileDcn`); spec §5; discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §6 (lane L2.4)
Worktree: ~/jjodel-w-dcn-l24, branch dcn-l24, from the trunk at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 18:21 «via»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is the discovery above; write the Layer Impact Report first, in docs/lir/ with the repo's naming, and commit it before any code. No subagents, no background tasks. Commit the code as soon as the targeted suites are green, before the full run. Every reply opens with [P-2026-11-07-1825 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log. Before a browser probe check uptime: wait while the 1-minute load is above 20. Rule 11: this prompt authorizes one new member of `NodeProblemKind`.

## Contesto (non rifare l'analisi)

Read spec §5 (W1..W6), the rows R-DCN-13, R-DCN-16, R-DCN-23 in `docs/decisions.md`, then only: `model/simulation/dcn/dcnRoles.ts`, `dcnCompile.ts` (how bodies and invariants are read), the JjEL parser entry for actions in DCN mode and for expressions, `components/editor-v2/problems/registry.ts` and the nearest existing producer pair to copy (`simCheckToProblems.ts` with `SimCheckProblemSync.tsx`, or `containmentToProblems.ts`), and where those syncs are mounted. W5 is lane L6.1, not this one.

## COSA

(1) A pure module `model/dcn/dcnWellFormedness.ts` (new folder; name checked free): from the resolved DCN roles and a read view of the class-level model, the diagnostics of
- **W1**: an invariant, precondition, operation body or monitor of dynamic class D reads only features of its static class (and generalization), features of D, or features of another class D' under a guard `self.in(V::D')` in the same expression;
- **W2**: an expression of viewpoint V that tests a class of viewpoint V' makes an edge V → V'; a cycle is an error on each viewpoint of the cycle;
- **W3**: an operation redefines at most one operation of its static class, with the same name and parameter count;
- **W4**: bodies and monitors assign only features visible in their class;
- **W6** (R-DCN-23): two viewpoints never write the same property; a static operation writes only properties no viewpoint writes. Deduced from the write targets of every body;
- plus R-DCN-13 (a range bound on a non-Integer property, or rangeMin > rangeMax) and R-DCN-16 (a blank invariant; a second instance of an `isSingleton` class is an object-level check, skip it here and say so).
Each diagnostic names the rule, the element, a message in English, and its severity (error).
(2) `components/editor-v2/problems/dcnToProblems.ts` and a `DcnProblemSync.tsx` mounted where the other syncs are, under one new `NodeProblemKind` member (`dcn`), so the diagnostics appear as node problems on the class-level elements; nothing runs when the metamodel binds no DCN roles.
(3) Tests first, one new test file for the pure module on the drone data of `dcnStep.test.ts` (the clean drone gives zero diagnostics) plus one mutated model per rule, including a W6 case where two viewpoints write `power` and one where the static `land()` writes a property Flying writes; one test for the problems mapping. Mutation bench on the pure module (P5).
(4) Gates: typecheck at the baseline of CLAUDE.md §17, the problems, simulation and sim suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. Then a throwaway browser probe (gitignored `_tmp_` name, deleted after) that imports `~/jjodel-demo-exports/dcn/dcn-drone.jjodel` on a free port 3080..3099, binds the dcn roles as the L2.3 dialog does, and crops (light theme) one class with a W6 problem introduced by the probe and the clean model, into ~/.jjodel-lanes/P-2026-11-07-1825/crops/.
(5) One code commit (LIR committed before). Then hard stop with the log entry in `docs/log-inbox/dcn.md` and the Status flip left uncommitted (RC-17): the chat reads the crops and gives the GO.

## HARD STOP

More than seven files of code and tests, any edit to the six files of CLAUDE.md §3.2, or a change in what an existing problem kind reports: stop with Outcome: question.

## NON FARE

No W5, no run-time checks, no object-level checks, no push, no merge. Public repo: name no partner company.

## RIFERIMENTI

docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §5; docs/decisions.md R-DCN-3, R-DCN-10, R-DCN-13, R-DCN-16, R-DCN-17, R-DCN-23; docs/discovery/discovery_2026-11-06_dcn_foundations.md §6.
