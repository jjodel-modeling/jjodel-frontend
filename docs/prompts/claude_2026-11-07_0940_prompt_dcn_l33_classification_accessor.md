# DCN L3.3: the `classification` accessor on the JjEL evaluation context

Prompt-ID: P-2026-11-07-0940
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (changes an exported interface of the evaluator context)
Depends: R-DCN-7, R-DCN-21, L3.2 (0125bae93), the languages concern section «Dynamic classification in JjEL»; discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §4
Worktree: ~/jjodel-w-dcn-l33, branch dcn-l33, from dcn at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 09:29 «Si»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is done; this prompt carries the GO for Phase 2. No subagents, no background tasks. Commit as soon as gates are green. Every reply opens with [P-2026-11-07-0940 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log. Rule 11: this prompt authorizes one new optional property on the exported evaluation context and one new exported interface.

## Contesto (non rifare l'analisi)

L3.2 parses `<expr>.in(V::D)` into `ClassificationTest { object, viewpoint, dynamicClass }` and the evaluator throws «classification is not bound here». The precedent is `.[x]`: `JjelStateAccess` (`jjel/evaluator/context.ts:270`), `stateAccess?` on the context (`:378`), inherited by child scopes (`:475`), dispatched in `evaluator.ts` (`case 'StateAccess'`). Read only those spots, the `ClassificationTest` case, and `model/simulation/guardContext.ts` (`buildGuardContext`).

## COSA

(1) An exported interface `JjelClassificationAccess { isIn(object: unknown, viewpoint: string, dynamicClass: string): boolean }` beside `JjelStateAccess`; an optional `classification?` on the evaluation context, inherited by child scopes exactly as `stateAccess`.
(2) Evaluator: `ClassificationTest` evaluates its `object`, then calls `classification.isIn`; without an accessor it throws the existing message (the tri-state then reports `exception`, unchanged). A non-boolean answer from the accessor is an evaluation error, never coerced.
(3) `buildGuardContext` accepts an optional accessor and puts it on the context; every existing caller is unchanged (no argument means no accessor). No binder is written here: σ-backed binding is lane L4.3, model-backed binding a later lane.
(4) Tests first, one new test file: bound accessor true and false, receiver navigation (`self.wau.in(Alert::Safe)` with a stub), child scope inheritance (inside `forall` and a lambda), absent accessor gives the throw and the tri-state `exception`, a non-boolean answer is an error, and `buildGuardContext` with and without the accessor. Mutation bench on the dispatch and the inheritance (P5).
(5) Gates: typecheck at the baseline of CLAUDE.md §17, the JjEL and simulation suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. One code commit; the log entry appended to `docs/log-inbox/dcn.md` and the Status flip in one docs commit. No visual check is owed.

## HARD STOP

A need to touch more than `jjel/evaluator/context.ts`, `jjel/evaluator/evaluator.ts`, `model/simulation/guardContext.ts` and the new test: stop with Outcome: question.

## NON FARE

No parser change, no binder, no change to the simulator run, no push, no merge. Public repo: name no partner company.

## RIFERIMENTI

docs/decisions.md R-DCN-2, R-DCN-7, R-DCN-12; docs/spec/concern_languages.md; docs/discovery/discovery_2026-11-06_dcn_foundations.md §4.
