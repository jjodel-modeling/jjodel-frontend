# Code generation S3: a read-only accessor to the STC roles for templates

Prompt-ID: P-2026-10-10-0901
Chat: C-2026-10-10-0046
Lane: fast (two new files under a new folder, pure functions over the lookup, no existing source changed).
Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-stc`, branch `codegen-stc`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and
a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0901 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Templates of the code generator read the roles of the metamodel's simulation STC, never write (R-GEN-7). The
contract is `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` §7; the evidence is
`docs/discovery/discovery_2026-10-10_code_generation_pilot.md` §D (read all of it) and §B.2, §I.4 (row S3).

In short:
- The binding chain over raw `idlookup`: the metamodel's `_state` bag (`lookup[mmId]._state`, `mmId` the M1's
  `instanceof`), the profile (`storedProfile`, `components/editor-v2/sim/simRoleStatus.ts:240-246`, built on core
  `decodeProfile` and `inferCustomProfile` in `model/simulation/profileCodec.ts`), the run bag (`runBag`,
  `components/editor-v2/sim/simBridge.ts:182-188`, drops off roles and derives the event), the STC
  (`netStcFromRoles`, `model/simulation/netCompile.ts:85`).
- Instances of a role: `isKindOf` (`model/simulation/isKindOf.ts:26-30`); references by feature pointer:
  `objectReferences` (`model/simulation/objectSlots.ts:35-36`). The compiled net (`compileNet`,
  `netCompile.ts:515`) excludes fork, join and event nodes from places.
- `simBridge.ts` imports the run singleton and, through `simRunState.ts`, React. So the accessor rebuilds
  `runBag`, `storedProfile` and `collectModelObjectIds` (`simBridge.ts:139`) from core parts, about 15 lines,
  instead of importing anything under `components/`.
- The JjEL view of a model has one builder, `buildEvalContext` (`jjscript/executor/commands/eval.ts:122`), and
  `guardContext.ts:14-15` forbids a second copy. The accessor therefore does not build handles: it takes a
  function from element id to handle supplied by its caller (slice S2 wires it to `buildEvalContext`).

## WHAT

1. **Tests first.** `frontend/src/codegen/__tests__/stcAccess.test.ts`, on fixture idlookups reused from the
   simulator's tests (state machine, Petri net, flowchart; find them under `frontend/src/model/simulation/` tests
   and import or copy the smallest ones):
   - `stc.nodes`, `stc.transitions`, `stc.initial`, `stc.events` equal the ids selected by `isKindOf` over the
     M1's objects for the bound roles, in a stable order (document which);
   - `stc.trigger(t)`, `stc.source(t)`, `stc.target(t)` agree with `objectReferences`, including the
     `ownedTransitions` fallback of `netCompile.ts:285-287`;
   - `stc.guard(t)` and `stc.actions(t)` return the JjEL source text (absent guard: `null`; absent actions: `[]`);
   - `stc.net` equals `compileNet` on the same input (places and transitions with ids);
   - every returned object and array is frozen, and a write throws in strict mode;
   - a metamodel with no simulation roles yields `null` (no STC), not an exception;
   - an import-boundary test: the source of `stcAccess.ts` imports nothing from `components/`, `react`, `redux`
     or `joiner` (read the file text and match its import lines).
2. **Module.** `frontend/src/codegen/stcAccess.ts`, pure, exporting one function, for example
   `stcAccess(lookup, modelId, handleOf): StcView | null`, with the fields of discovery §D.4: `profile`, `nodes`,
   `transitions`, `initial`, `events`, `trigger`, `source`, `target`, `guard`, `actions`, `net`. Element results go
   through `handleOf(id)`; the tests pass a stub that returns `{id}`. Role ids come from `ROLE_CATALOG`
   (`roleCatalog.ts`), never from string literals typed in the module.
3. **Gates.** `npx tsc --noEmit`, the new test file, the `src/model/simulation` suite unchanged, `npm run build`.
4. **Mutation bench** (P11), listed in the commit body: `isKindOf` replaced by an exact-class match; trigger
   matched by name instead of pointer; the `ownedTransitions` fallback removed. Survivors are reported.
5. **Commits.** One `feat(codegen): …` commit with the module and the test; then the log entry, written with the
   `log-entry` skill into `docs/log-inbox/codegen-stc.md`, in a docs commit. Stop with `Outcome: done`. No merge.

## DOVE

`frontend/src/codegen/stcAccess.ts` (new), `frontend/src/codegen/__tests__/stcAccess.test.ts` (new),
`docs/log-inbox/codegen-stc.md` (new). Fixture files may be imported read-only from existing test folders.

## NON FARE

- No edit to any existing file under `frontend/src` (in particular `simBridge.ts`, `simRoleStatus.ts`,
  `netCompile.ts`, `eval.ts`): if a core helper you need is not exported, copy its few lines and say so in the log
  entry, do not export it.
- No JjEL context building, no template code, no Text: those are S2.
- Do not touch `frontend/src/jjel/` (lane P-2026-10-10-0900 owns it in parallel).
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- Spec §7 and R-GEN-7; discovery §D, §B.2, §I.1 (row S3), §I.4.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` (roles, places, transitions).
- `CLAUDE.md` §5, §21; `docs/PROTOCOL.md` P9, P11, P13, P14, P16.
