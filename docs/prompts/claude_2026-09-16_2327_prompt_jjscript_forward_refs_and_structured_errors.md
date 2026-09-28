# JjScript: refuse forward references before command 1, and show the executor's own error

Date: 2026-09-16 23:27 (Europe/Rome)
Type: fix
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: YES. Phase 1 read-only discovery with report, then HARD STOP for review in chat.
Two lanes (A, B), two separate code commits. Lanes touch `ScriptBlock.tsx` in disjoint places:
do A first, commit, then B.

## Observation (Alfonso, 2026-09-16, after ccd867bda)

A Jjodie script on `Micro MM v1` ran 16 commands and stopped at command 17:

```
create class Pipeline
create attribute name in Pipeline type String
create containment stages in Pipeline type PipelineStage [1..*]   <- command 17
create class PipelineStage                                         <- two lines later
```

Two defects:

1. **Forward reference found mid-run.** The script cannot complete, yet 16 commands were applied
   and the metamodel was left half-built. `elementWaiter.ts` only waits up to 500ms for Redux to
   propagate an element already created; nothing detects an element created later in the script.
   `scriptValidator.ts` exists exactly to refuse, before command 1, scripts that cannot complete
   (the 218-of-230 incident) and is the right home.
2. **The dialog shows a false message.** `create.ts:665` returns
   `Unknown type 'PipelineStage' for reference 'stages'. Expected a class.` with
   `errors[0].code = 'UNKNOWN_REFERENCE_TYPE'` and a suggestion. `ChatMessages.tsx` maps the result
   to `ScriptLineResult` (`ScriptBlock.tsx:59-64`), which has no `errors`, and
   `ScriptBlock.tsx:411` (also `:459`, `:846`, `:872`) feeds the string to `parseError`
   (`errors.ts:361`), whose keyword match ("unknown" + "type") produces
   `UNKNOWN_ELEMENT_TYPE`: "'PipelineStage' is not a supported element type. Supported: class, ...".

## Decisions already taken (do not reopen)

- JjScript stays order-sensitive. No hoisting, no reordering, no two-pass executor: whether the
  language should be order-independent is a separate design question.
- The Jjodie system prompt is NOT changed in this task.

## Phase 1: discovery (read-only)

Read `CLAUDE.md` and the recent `docs/claude-code-log.md`. Then read `scriptValidator.ts` and its
test, `dependencies.ts` (`extractDependencies`, roles, `required`), the parser's AST for `create`,
`extends` statements (`ALU extends FunctionalUnit`), `rename`, `delete`, qualified names
(`Metamodel::Name`); `ScriptBlock.tsx` around `:300-330` (the integrity refusal, whose text is
hard-coded as "truncated or malformed"), `:395-470`, `:830-880`, `:1461`; `ChatMessages.tsx:397-440`;
`errors.ts` (`JjScriptErrorCode`, `createError`, `getErrorDetails`, `parseError`); every other caller
of `parseError` and of `ScriptLineResult` (`grep -rn`).

Answer in the report:

- A1. Can `extractDependencies` be imported by the validator under vitest `environment: 'node'`
  (check its imports transitively)? If not, what minimal pure extraction is needed.
- A2. The exact set of statements that DECLARE a name (create class / abstract class / interface /
  enum / enumeration / package, and anything else) and that REFERENCE one (parent, type,
  superclass, `extends`, opposite, others), with file:line.
- A3. Every way a later declaration could NOT make an earlier reference fail (see the soundness rule
  below) that exists in the grammar: `delete`, `rename`, qualified names, `target` directives,
  M1 commands, anything else.
- B1. The full path from `ExecutionResult.errors` to the dialog in both execution paths of
  `ScriptBlock` and in any other host of `ScriptBlock`; where `errors` is lost.
- B2. Whether `UNKNOWN_REFERENCE_TYPE`, `UNKNOWN_ATTRIBUTE_TYPE`, `UNKNOWN_PARAMETER_TYPE`,
  `UNKNOWN_OPERATION_TYPE`, `AMBIGUOUS_TYPE`, `WRONG_LEVEL` and the other codes the handlers emit are
  in `JjScriptErrorCode`; the list of codes emitted by handlers but unknown to `errors.ts`.

Save the report as `docs/discovery/discovery_2026-09-16_jjscript_forward_refs_structured_errors.md`
(objective, files read with full paths, findings A1-A3 and B1-B2, risks, open questions).
Phase 1 is not complete until the file exists. HARD STOP.

## Phase 2, lane A: forward references in `validateScriptIntegrity`

COSA. After the existing per-line checks pass for the whole script, a second pass refuses the script
when an executable line references a simple name `X` (parent, type, superclass, extends, and the
other reference roles from A2) and a declaration of `X` appears on a LATER line, with no declaration
of `X` on an earlier line. The issue names both lines:
`line 17 references 'PipelineStage', which is created at line 19. Move the reference after it.`

Soundness rule, to be written in the module header next to the existing "no false positives"
guarantee: if `X` does not exist before the run, the reference fails; if it does, the later
declaration fails as a duplicate. Either way the script cannot complete, so refusing it early never
rejects a script that would have run cleanly. The rule holds only when nothing in between can
change whether `X` exists, therefore:

- skip every name that appears in any `delete` or `rename` (as source or as new name) anywhere in
  the script;
- skip qualified names `Metamodel::Name` (they may point at another metamodel);
- skip M1 commands (`create instance`, instance `set`, and the like);
- add any further exclusion A3 finds, and test each exclusion.

`ScriptBlock.tsx:308-330`: the refusal text must not call a forward reference "truncated or
malformed". Add a discriminant to `ScriptValidationIssue` (optional field, existing fields unchanged)
and choose the wording from it. Zero commands executed, exactly as today.

DOVE. `frontend/src/jjscript/executor/scriptValidator.ts`, its test, `ScriptBlock.tsx` (integrity
refusal block only), plus a pure helper module only if A1 requires it (grep the name first).

TESTS. The Pipeline script above verbatim (refused, lines 17 and 19); the same script reordered
(accepted); each exclusion (delete, rename, qualified name, M1); a reference to a name declared both
before and after (accepted by this check); `extends` before `create class`. Mutation bench: remove
the exclusion for `rename` and for `delete`, each must turn at least one test red.

## Phase 2, lane B: the dialog shows the executor's error

COSA. Carry the structured error to the dialog. Add `errors?: ExecutionError[]` (optional) to
`ScriptLineResult`; pass it through wherever `ExecutionResult` becomes `ScriptLineResult`
(`ChatMessages.tsx` and any other place B1 finds). In `ScriptBlock`, at the four sites, build the
`JjScriptError` from the result when `errors[0]` is present: `message` is `result.message` (the
executor's sentence), `suggestion` is `errors[0].suggestion`, `code` from `errors[0].code`. Fall back
to `parseError` only when `errors` is absent (thrown exceptions, legacy hosts). For codes unknown to
`JjScriptErrorCode` (B2), do not widen the union with every handler code: use a single generic code
if one exists, otherwise propose in the report the minimal change and wait. `skippable` must keep
its current value for each case (state how you preserved it).

DOVE. `ScriptBlock.tsx` (the four error sites and the type), `ChatMessages.tsx` (the mapping),
`errors.ts` only if B2 makes it strictly necessary. `ExecutionErrorDialog.tsx` only if the suggestion
is not already rendered. No other file. Do not touch `parseError`'s heuristics.

TESTS. If `ScriptBlock` cannot be imported under node, extract the "result to JjScriptError" choice
into a pure function and test it: the Pipeline case must yield the "Unknown type ... for reference"
message and its suggestion, never "not a supported element type"; absent `errors` falls back to
`parseError`.

## Gates and hand-off (both lanes)

Minimal diffs, no renames, no opportunistic refactoring, no em dashes in anything you add. Leave the
`TEMP-DISCOVERY` logs in `ScriptBlock.tsx` alone. `npm run typecheck` at baseline, `npx vitest run`,
`npm run build`, `check:docs`. HARD STOP before each commit for Alfonso's visual check on
http://localhost:3001/ (lane A: run the Pipeline script, expect zero commands and the two-line
message; lane B: run a script with `type NoSuchClass` on a reference,
expect the executor's sentence and suggestion). Commit with explicit paths; code and docs in
separate commits; one log entry per lane. Do not touch `docs/mde-intelligence-2026/`.

## RIFERIMENTI

- ccd867bda, 73bf25fc6 (level stamp fix and its report, §7 on the lost `errors`)
- `docs/prompts/claude_2026-09-16_2249_prompt_fix_jjodie_scope_level_m1_on_metamodel.md`
