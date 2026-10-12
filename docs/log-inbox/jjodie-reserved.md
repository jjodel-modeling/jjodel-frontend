# log-inbox — lane «jjodie-reserved»

Entries written by the Jjodie reserved-identifier lane while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — feat(jodie): one list of reserved identifiers and a gate on Jjodie's scripts (P-2026-10-10-0045)
**Prompt**: `claude_2026-10-10_0045_prompt_jjodie_reserved_identifiers.md`, full lane on `~/jjodel-w-jjodiereserved`, branch `jjodie-reserved`. A Jjodie script named a reference `copy` and failed. Phase 1 traced it and committed the report; the chat's GO adopted three decisions (RC-25) and approved nine files. The lane then built the single list, generated rule 8 from it, and gated Jjodie's replies with one repair turn.
**Files touched**:
- Report: `1153700ce`, `docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md`; addendum in `67b17ce5a`.
- `377070258`: `frontend/src/jjscript/reservedIdentifiers.ts` (new), `jjscript/types.ts`, `jjscript/parser/lexer.ts`, `jjscript/__tests__/reservedIdentifiers.test.ts` (new).
- `b5e9ed415`: `frontend/src/constants/defaultPrompts.ts`.
- `07bf5c3ee`: `frontend/src/components/Jodie/reservedIdentifierGate.ts` (new), `Jodie/__tests__/reservedIdentifierGate.test.ts` (new), `Jodie/Jodie.tsx`, `jjscript/components/ScriptBlock.tsx`.
- This commit: this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no.
- typecheck: 14, the §17 set.
- vitest on `src/jjscript` plus the gate test: 571 passed; `context-binding.test.ts` red at import (known). The full suite was not run.
- build: exit 0.
- Tests first: red on the base (module absent).
- Mutation bench: 12/12 killed.
**Out-of-scope changes**: no. The nine code and test files of report §4.5 go above rule 19's five; the GO approved them (RC-11). The docs are this lane's report and this inbox.
**Layer Impact Report**: not-required (no file in §3.1)
**Smoke visivo**: passato (lane probe, unattended, port 3047, mocked model: (a) `copy` twice 12/12, (b) `copy` then `bookCopy` 11/11; `npm run smoke` not run; Alfonso's GO pending)
**Notes**: Chat decisions adopted (RC-25): exact lowercase match; primitive type names checked on class and enum names only; only the repaired reply is shown, one round at most. Step now re-checks on every press: before, a press after a refusal started at line 1. The gate reads `create` and `rename`, not `add` or `copy … as`. The probe's negative controls: 4 checks fail without the gate call, 5 without the ScriptBlock check. Report addendum.
**Prompt document name**: 2026-10-10 00:45

**Ticket** (high, freeze): a Jjodie chat message starting with `do` (for example "do not use copy") hangs the tab and then crashes the renderer. `parseBlockBody` never advances on an `eval` body (`parser.ts:182-186`, `:1041`). Lane P-2026-10-10-0810 (branch `do-freeze`), which owns `parser.ts`, is fixing it in parallel. Evidence: report §4.4.

## 2026-10-11 — merge: jjodie-reserved into alfonso-frontend-jjtl (P-2026-10-11-0023)
**Prompt**: `claude_2026-10-11_0023_prompt_merge_jjodie-reserved.md`, a merge in a lane-run session: `jjodie-reserved` at `e5d95a99c` into `alfonso-frontend-jjtl`, `--no-ff`, merge base `571392718`, 6 commits on the branch side.
**Files touched**: merge `72762297b`: 11 files from the branch side (`docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md`, `docs/log-inbox/jjodie-reserved.md`, `frontend/src/components/Jodie/Jodie.tsx`, `Jodie/__tests__/reservedIdentifierGate.test.ts`, `Jodie/reservedIdentifierGate.ts`, `frontend/src/constants/defaultPrompts.ts`, `frontend/src/jjscript/__tests__/reservedIdentifiers.test.ts`, `jjscript/components/ScriptBlock.tsx`, `jjscript/parser/lexer.ts`, `jjscript/reservedIdentifiers.ts`, `jjscript/types.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `72762297b` in the session: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 8210 tests in 336 files (trunk tip 8180 in 334, plus the branch's 30 in 2 new files measured on `e5d95a99c`), the same 9 red at import; hooks 603 in 10 files; build exit 0; check:docs 5/5; check:agents green; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, smoke on 3001, 2026-10-11
**Notes**: merge-tree zero conflicts, tree `a4074da24` equal to the merge's index tree. Union: none. Probes: 21 decision rows once, control R-GEN-17 absent at the merge; 79 headings once. check:docs counted 5/5, not the prompt's 4/4 (Check E). No rollback tag (not asked). The lane's prompt P-2026-10-10-0045 still reads `Status: da eseguire`; not flipped here.
**Prompt document name**: 2026-10-11 00:23

**Ticket** (low, lane-run template): step 6 of `frontend/scripts/lane-templates/merge-into-trunk.md` renders the `check:addonly` fallback as `git reset --hard {{trunkTip}}`, «the pre-merge tip»; `{{trunkTip}}` is the parent of the prompt's own commit, so the reset would also drop the prompt. Here `dfdef69f1` against a real pre-merge tip `7b670fc45`. Not exercised: check:addonly passed.
