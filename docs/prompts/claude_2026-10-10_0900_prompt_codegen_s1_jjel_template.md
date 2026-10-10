# Code generation S1: JjEL template interpolation, opt-in and inert when unused

Prompt-ID: P-2026-10-10-0900
Chat: C-2026-10-10-0046
Lane: full (core JjEL: lexer, parser, evaluator and context, with consumers across the app; Phase 2 of the
discovery P-2026-10-10-0815, no new discovery). Model: the default of `.claude/settings.json`, no deviation.
No critical-zone go-ahead (none needed, discovery §I.3).
Depends: none
Status: eseguito 2026-10-10 · lane codegen-jjel-template · code 4eda9c793 · docs de640d661 · tsc 14 = base, vitest src/jjel 279 (245+34), consumer suites 1843 (1809+34, same 8 import-time reds as base), build exit 0, mutation bench 7/7 killed · JjelTextHost adds optional evaluateHole; literal spans recovered by S2 from tokenize · no visual check (textual slice)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-jjel`, branch `codegen-jjel-template`, cut from the trunk tip that carries the docs
commit adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch,
`git log -1` and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0900 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Jjodel gets model-to-text generation. The contract is `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`
and R-GEN-1..R-GEN-15 in `docs/decisions.md`; this slice implements **R-GEN-10**, ratified by Alfonso today. The
evidence is `docs/discovery/discovery_2026-10-10_code_generation_pilot.md`: read §A (all of it), §B.1, §B.3, §B.4
and §I.4 before writing code. Line numbers there were measured on 2026-10-10; re-read before editing.

What the discovery measured, in short:
- Interpolation is half-built. The lexer's `string()` (`jjel/lexer/lexer.ts:242-337`) detects `${` but emits a
  placeholder; `parts` is never filled. The token types `STRING_PART` and friends exist (`types/tokens.ts:93-95`).
  The parser imports `InterpolatedStringExpr` and never builds it (`parser/parser.ts:43-44`, `:492`). The evaluator
  already handles the node (`evaluator.ts:182-183`, `:1027-1040`). Today every expression containing `"…${…}…"`
  fails, so nothing that works now can change meaning.
- Every evaluator method is `private`: a Text-aware evaluator is a hook the class consults, not a subclass.
- Origin dies at `+` (`evaluator.ts:287-288`), `join` (`builtins/collections.ts:388-389`), interpolation through
  `stringify` (`evaluator.ts:1097-1105`), so the host must see those four sites.
- Member reads that matter for origin are `evaluator.ts:522-523` and the method dual form at `:776`.
- `stateAccess` is the precedent for an optional context field inherited by children (`context.ts:274-278`,
  copied at `:356`). `actionMode` is the precedent for an opt-in lexer option (`lexer.ts:27-31`) and
  `parseAction` for a dedicated entry point (`parser.ts:951-952`).

## WHAT

1. **Tests first.** New `frontend/src/jjel/__tests__/templateInterpolation.test.ts`, run on the base commit to
   record that the new cases fail (negative control). Cases, from discovery §I.4:
   - lexing and parsing with correct source offsets: one hole, several holes, a hole holding a lambda that itself
     contains an interpolated string (the normal case in templates, for example
     `"${xs.map(x => "<${x.name}>").join(", ")}"`), a multi-line string, and the escape `\$` (a literal `${`);
   - **off-by-default identity**: through `parseExpression`, `parseExpressionStrict` and `parseAction`,
     `"a ${b}"` fails exactly as on the base commit, same error message (snapshot the base message);
   - with no `textHost`, `parseTemplate` plus `evaluate` returns plain strings with today's `stringify` rules;
   - with a fake `textHost` that records calls and builds a tagged value: interpolation, `+` with a Text operand
     on either side, `join` over an array holding a Text, and `stringify` of a Text all go through the host;
   - with a `readObserver`, a hole `o.name` and a hole `o.name()` each report `(o, 'name', value)` once;
     a missing property reports nothing extra and still returns null as today.
2. **Lexer.** Option `interpolation?: boolean` on `JjelLexerOptions`, off by default, documented like
   `actionMode`. With it on, double-quoted strings emit the parts with each hole's source and absolute offset.
   Single-quoted strings stay literal (`lexer.ts:340-341`).
3. **Parser.** `parseTemplate(source)`, the twin of `parseAction`, with strict end of input as in
   `parseExpressionStrict`. `primary()` builds `InterpolatedStringExpr`, sub-parsing each hole with the same
   options and shifting locations by the hole's offset.
4. **Context.** Two optional fields on the evaluation context, inherited by children exactly like `stateAccess`:
   `textHost?: JjelTextHost` and `readObserver?: (target: JjelObject, property: string, value: JjelValue) => void`.
   Export the `JjelTextHost` interface from `frontend/src/jjel/index.ts` with a doc comment: slice S2
   (`frontend/src/codegen/engine/`) implements it, so its shape is an exported interface (RC-26 applies to later
   breaking changes, not to this addition). Minimum it must allow: building a Text from literal parts and
   evaluated holes (each hole with its value, its expression node and its source location), concatenation with a
   Text on either side, join with a separator, stringify, and a predicate that recognises a Text. Choose the exact
   signatures and record them in the log entry.
5. **Evaluator.** Consult the host at the four sites (interpolation, `+`, `join` dispatch, `stringify`) and in
   `builtins/collections.ts` `join`, only when a Text is involved or, for interpolation, when the host is set.
   Call the observer at the two member-read sites. With both fields absent every path must be the current one.
6. **Gates.** `npx tsc --noEmit`; the new file; the whole `src/jjel` suite; the consumer suites that import the
   parser or evaluator (discovery §A.6: `src/jjtl`, `src/jjscript`, `src/model/simulation`,
   `src/model/validation`, `src/model/conformance`, `src/components/editor-v2/viewpoint/ir` tests that touch
   `pathExpr`), all green and with the same test counts as on the base commit; `npm run build`. Run gates in the
   foreground; if the load average is above 20, wait and rerun before calling a red real.
7. **Mutation bench** (CLAUDE.md §5, P11). Apply each mutation, run the new file, revert, and list the result in
   the commit body: interpolation on by default; drop the offset shift in sub-parsing; `textHost` ignored in
   `join`; observer not called at the method dual form. Surviving mutations are reported, not repaired silently.
8. **Commits.** One `feat(jjel): …` commit with the source and the test. Then one docs commit:
   `frontend/src/jjel/SPEC.md`, the interpolation section around `:658-662` updated from «Deferred» to the opt-in
   form, and `:37` and `:660` corrected so they no longer name Handlebars as the M2T engine (R-GEN-13: the legacy
   `DState.languages` subsystem exists and coexists; the new generator lives in `frontend/src/codegen/`). The log
   entry, written with the `log-entry` skill, goes into `docs/log-inbox/codegen-jjel.md` in the same docs commit.
   Then stop with `Outcome: done`. No merge.

## DOVE

`frontend/src/jjel/lexer/lexer.ts`, `frontend/src/jjel/parser/parser.ts`, `frontend/src/jjel/evaluator/evaluator.ts`,
`frontend/src/jjel/evaluator/context.ts`, `frontend/src/jjel/evaluator/builtins/collections.ts`,
`frontend/src/jjel/index.ts`, `frontend/src/jjel/__tests__/templateInterpolation.test.ts` (new),
`frontend/src/jjel/SPEC.md`, `docs/log-inbox/codegen-jjel.md` (new). Seven files under `src/jjel` exceed rule 19's
threshold; this list is the confirmation.

## NON FARE

- No change to `isJjelObject`, `TypeRegistry`, the builtin catalog `jjel/metadata/builtins.ts`, or any consumer
  outside `src/jjel`. No consumer sets the option or the fields in this slice.
- No Text implementation, no indentation, no origin table: those are S2 in `frontend/src/codegen/`.
- No change to error messages other than those of the new paths.
- No touch to `src/model/simulation/subsetChecker.ts`, even though it names `InterpolatedString`.
- Do not touch `frontend/src/codegen/` (lane P-2026-10-10-0901 creates it in parallel).
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- Spec and R-GEN-10, R-GEN-12, R-GEN-13 as above; discovery §A, §B, §I.1 (row S1), §I.4, §I.6.
- `docs/spec/concern_languages.md` (JjEL known bugs, `parse()` dropping trailing tokens at `:102`).
- `CLAUDE.md` §5 (mutation bench), §12.6 (reserved names), §21 (log entry); `docs/PROTOCOL.md` P9, P11, P13, P14, P16.
