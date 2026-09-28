# Prompt: Phase 2, wave B1 of the `.[x]` operator: grammar, AST, evaluator hook, checker

Prompt-ID: P-2026-09-25-1445
Chat: C-2026-09-25-1353
Lane: full (changed exported interface)
Status: eseguito 2026-09-25 · lane simulation · 1c7a9be76

Worktree: `~/jjodel-sim`, branch `simulation-engine`, the same session that wrote the Phase 1 report `ec68ddb9b`. Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file and R-SIM-38..45 (subject `docs: ratify R-SIM-38..45 and add the wave B1 prompt (P-2026-09-25-1445)`), `git status` empty. Otherwise stop.

**Parallel lane.** `P-2026-09-25-1440` (hash change) runs in `~/jjodel-open` on port 3003. Disjoint perimeters; do not touch any other tree or any server you did not start.

## COSA

Wave B1 of report §7.1, as ratified in `docs/decisions.md` R-SIM-38..42 (read them whole first; R-SIM-43..45 are for wave A and are **not** in scope here). Pure code: the JjEL grammar for `.[x]` and for actions, the AST, a strict parse entry, the optional state hook of the evaluator, one exported list of reserved names, the `StateAccess` case of the subset checker. Nothing is wired to the simulator panel, nothing is persisted, no primitive type is added.

## DOVE

Code (Rule 19, more than five files, authorized by this list):

- `frontend/src/jjel/types/tokens.ts`: `DOT_LBRACKET`, `ASSIGN`.
- `frontend/src/jjel/lexer/lexer.ts`: `.[` contiguous; `?.[` error; `:=` only in action mode (a lexer option), the expression-mode error message naming actions.
- `frontend/src/jjel/types/ast.ts`: `StateAccessExpr` in the `JjelExpression` union; the exported `JjelAction` type (not an expression).
- `frontend/src/jjel/parser/parser.ts` and `parser/index.ts`: the `postfix()` branch; a strict entry that requires EOF; `parseAction`. `parseExpression` unchanged on every input it accepts today (R-SIM-40).
- `frontend/src/jjel/evaluator/context.ts`: the optional hook, propagated by `child()`.
- `frontend/src/jjel/evaluator/evaluator.ts`: `StateAccess` evaluation; `node.[x]` recognized by syntax; no hook → a `JjelEvaluationError`, never `null`.
- `frontend/src/jjel/stateReserved.ts` (new): the single list of R-SIM-41. Name check first (`command grep -rn stateReserved frontend/src`: nothing).
- `frontend/src/model/simulation/subsetChecker.ts`: the `StateAccess` case in both exhaustive switches; `GUARD_ROOTS` read from the list; a guard containing `node` is `E-NODE`.
- `frontend/src/jjel/autocomplete/providers/identifier.ts`: the `node` description (R-SIM-41).
- `frontend/src/jjel/SPEC.md`: grammar and operators.

Tests: `frontend/src/jjel/__tests__/parser.test.ts`, `evaluator.test.ts`, `frontend/src/model/simulation/__tests__/subsetChecker.test.ts`. A new test file only if one of these would mix concerns; say so.

Out of scope: the primitive types, `VersionFixer.tsx`, Ecore, the conformance check (wave A); `simBridge.ts`, `guardContext.ts`, `netStep.ts`, the action evaluator, the panel (wave B2); the global `parseExpression` fix (ticket); every critical-zone file.

## COME

1. Baseline: `npm run typecheck` (14, the §17 set), `npx vitest run` (state the expected total first: 4620 on this tree after the fast-forward, re-measure), `npm run build`, `check:docs`, `check:scripts`. Record.
2. Write the tests first for the twelve mutants of report §7.1 and show them red where the feature is missing.
3. Implement in the order lexer → AST → parser → context → evaluator → reserved list → checker → autocomplete → SPEC. Minimal diffs; no refactor of adjacent code; no rename.
4. Mutation bench: the twelve mutants of report §7.1, each applied, run, reverted; table in the code commit body with the killing test. A survivor is a stop: report it, do not weaken the mutant.
5. Gates on the code commit: typecheck 14 (same set), vitest the expected total plus the new tests, 0 failed, the same 9 files red at import; build exit 0; `check:docs` 4/4; `check:scripts` as the baseline. Diff of every file outside DOVE empty.
6. Code commit, pathspec after `--`, subject `feat(jjel): .[x] state access and strict parse (P-2026-09-25-1445)` (66 characters, within §6.2), body with the baseline, the gates, the mutant table, `Model:` trailer.
7. No visual check for B1 (R-SIM-38). Closure commit right after (P13, RC-17): the entry in `docs/log-inbox/simulation.md` (CLAUDE.md §21.2; Layer Impact Report: `produced`, the B1 draft of report §8 confirmed or corrected; `Smoke visivo: non applicabile`), the Status of this file flipped to `eseguito 2026-09-25 · lane simulation · <code sha>`, and the Status of the Phase 1 prompt `docs/prompts/claude_2026-09-25_1445_prompt_state_operator_discovery.md` flipped to `eseguito 2026-09-25 · lane simulation · ec68ddb9b`. The Phase 1 file lives on the trunk too: flip it here only, the merge carries it. Two tickets in the entry: the global trailing-token fix and `Pointer_EOBJECT` (R-SIM-45 tickets, already in decisions.md: cite, do not duplicate the text).
8. Closing report opening with `[P-2026-09-25-1445 · session <id>]`: two shas, gates, mutant table summary, any deviation. Then stop: wave A gets its own Phase 2 file from chat.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `rm` of the `node_modules` symlink, a critical-zone edit, push.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-25_state_operator_core_types.md` §4, §5, §6, §7.1, §8.
- `docs/decisions.md` R-SIM-17, R-SIM-18, R-SIM-30, R-SIM-38..42; RC-3, RC-13, RC-17.
- `docs/PROTOCOL.md` P13, P14.
