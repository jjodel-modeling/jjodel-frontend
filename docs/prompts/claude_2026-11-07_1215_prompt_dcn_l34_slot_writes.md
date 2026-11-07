# DCN L3.4: slot writes `self.battery := e` in a DCN action mode

Prompt-ID: P-2026-11-07-1215
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (changes the JjEL action grammar and an exported AST union)
Depends: R-DCN-12, R-SIM-17, R-SIM-40; the languages concern section «Dynamic classification in JjEL»; discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.4
Worktree: ~/jjodel-w-dcn-l34, branch dcn-l34, from the trunk at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 12:11 «via, procedi in lane auto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is done; this prompt carries the GO for Phase 2. No subagents, no background tasks. Commit as soon as gates are green. Every reply opens with [P-2026-11-07-1215 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log. Rule 11: this prompt authorizes widening the action node's target to a member access, and one new option of the lexer/parser entry for the DCN action mode.

## Contesto (non rifare l'analisi)

Read the discovery §3.4 and the concern section «Dynamic classification in JjEL» in `docs/spec/concern_languages.md` (its paragraph on slot syntax), nothing else of either. Today an action is `<target> := <expression>` with `target: StateAccessExpr` (`jjel/types/ast.ts:395-403`); the lexer refuses `:=` outside action mode (`jjel/lexer/lexer.ts:117`); `model/simulation/actionEvaluator.ts` turns a parsed action into `SimAssignment { element; attr; value }`.

## COSA

(1) A DCN action mode, selected by the caller (an option of the action parse entry point, never by the text): in it the action target may be a member access `<expr>.<feature>` (`self.battery`, `self.wau.speed`) as well as the existing `.[x]`. Outside the DCN mode `self.x := e` stays refused with today's message; a guard or invariant never accepts `:=`.
(2) AST: the action's target becomes a union of the state access and a member target node (or the existing member node, if it carries what the evaluator needs: say which). Every exhaustive switch the widening touches gets its case; if one lies outside `jjel/` and `model/simulation/actionEvaluator.ts`, stop with Outcome: question.
(3) `actionEvaluator.ts`: a member target evaluates its receiver to an element and returns `SimAssignment { element, attr: <feature name>, value }` with a marker that it is a slot write (an optional field, Rule 11 additive), so the core can tell it from a state attribute. The core does not apply slot writes in this lane: a slot assignment reaching `netStep.ts` today is an `undeclared` halt, and that stays until lane L4.4.
(4) Tests first, one new test file: parse in DCN mode and refusal outside it, both target forms in one body (parallel assignment, R-SIM-17), chained receiver, the assignment with the slot marker, the unchanged behaviour of every existing action test. Mutation bench (P5).
(5) Gates: typecheck at the baseline of CLAUDE.md §17, the JjEL and simulation suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. One code commit; the log entry appended to `docs/log-inbox/dcn.md` and the Status flip in one docs commit. No visual check is owed.

## NON FARE

No change to `netStep.ts`, `netTypes.ts` or the run, no handles, no push, no merge. Public repo: name no partner company.

## RIFERIMENTI

docs/decisions.md R-DCN-11, R-DCN-12, R-SIM-17, R-SIM-40; docs/spec/concern_languages.md; docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.4.
