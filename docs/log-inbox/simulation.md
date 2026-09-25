# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---


## 2026-09-25 — feat: .[x] state access and strict parse, wave B1 (P-2026-09-25-1445)
**Prompt**: `claude_2026-09-25_1445_fase2_state_operator_b1.md`, Phase 2 wave B1 of `P-2026-09-25-1445` on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `ec68ddb9b` (`docs/discovery/discovery_2026-09-25_state_operator_core_types.md`); its eighteen answers ratified as recommended, R-SIM-38..45 (`86f36a205`), B1 bound by R-SIM-38..42. Pure code: grammar, AST, strict parse, evaluator hook, single reserved list, checker case; nothing wired, persisted or typed.
**Files touched**: code `1c7a9be76`: `frontend/src/jjel/types/tokens.ts`, `jjel/lexer/lexer.ts`, `jjel/types/ast.ts`, `jjel/parser/parser.ts`, `jjel/parser/index.ts`, `jjel/evaluator/context.ts`, `jjel/evaluator/evaluator.ts`, `jjel/stateReserved.ts` (new), `jjel/autocomplete/providers/identifier.ts`, `jjel/SPEC.md`, `model/simulation/subsetChecker.ts`, tests `jjel/__tests__/parser.test.ts`, `jjel/__tests__/evaluator.test.ts`, `model/simulation/__tests__/subsetChecker.test.ts`. Docs, this commit: this entry, the Status lines of the two `P-2026-09-25-1445` prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `1c7a9be76`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the baseline empty); `npx vitest run` 4654 passed (4620 + 34, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` 1 finding, the known `_tmp_sim1_verify.ts:186`. Red first: 2 test files failing at collection and 11 evaluator tests before the code. Mutation bench 15/15 killed.
**Out-of-scope changes**: no — 14 files, above the Rule 19 five, every one named by the prompt's DOVE list, which authorized them; no file outside it changed.
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Deviations: the reserved list was written before the parser, which reads it; one closure commit carries this entry and both Status flips, as the prompt and P13 ask, not the inbox alone as the log-entry skill says. The B1 draft of report §8 holds, one correction: `.[x]` parses everywhere and throws only at evaluation without the hook; `?.[` and `:=` stay lexer errors with new messages. Mutant table in the body of `1c7a9be76`.
**Prompt document name**: 2026-09-25 14:45
**Ticket** (R-SIM-45 tickets, in `docs/decisions.md`; cited, not duplicated): the global trailing-token fix of `parseExpression`; `Pointer_EOBJECT` missing from older saved projects.
**Ticket** (opened here, docs only). The trunk has its own R-SIM-38 (`79175e94c`, the event class derived from the trigger, chat `C-2026-09-25-1500`), while this branch carries R-SIM-38..45 (`86f36a205`): merging `simulation-engine` into the trunk would put two R-SIM-38 in `docs/decisions.md`. One series needs renumbering before that merge.
