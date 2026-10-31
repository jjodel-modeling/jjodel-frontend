# Discovery — JjTL on the JjEL path: prompt, confirm, input, multi-line if/else, the app parser switch

- Prompt-ID: P-2026-10-31-1910
- Prompt file: `docs/prompts/claude_2026-10-31_1910_prompt_jjtl_jjel_path_parity.md`
- Session: d529a4e4-305d-4097-a437-90d5c63dddd5
- Tree: `~/jjodel-w-jjtlparity`, branch `jjtl-jjel-parity`, HEAD `f839d2458`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- Input: `docs/discovery/discovery_2026-10-31_jjtl_app_parser_source_and_let_scope.md` (P-2026-10-31-1710), F3, F4, P2, P3
- This report is a set of hypotheses with evidence, not a definitive reference. Re-read the real files before acting on it.

## Objective

1. Locate where `prompt`, `confirm`, `input` are handled on the legacy path and why the JjEL path misses them.
2. Locate the grammar point that stops a multi-line `if/else` after `:=` on the JjEL path.
3. Plan both fixes, list the consumers each can affect, and compare every fixture on both paths before and after.

## Hypotheses under test

1. H1: the three builtins can be restored on the JjEL path without touching the shared JjEL parser or evaluator.
   **Holds** (F1, F2, F5): the fix lives in the JjTL parser; JjEL has no reference to the three names.
2. H2: the multi-line `if/else` stops only because `parseJjELExpression` treats NEWLINE as a boundary
   unconditionally. **Holds** (F3), measured by the mutation bench (P4).
3. H3: after the two fixes no fixture that parses on the legacy path parses or runs differently on the JjEL path.
   **Holds, with one cosmetic difference** (P2, P3): the node-type label inside an evaluation-failure warning.
4. H4: SPEC.md §13 example 5 can parse without rewriting it. **Holds** (F4): the documented grammar already says
   `prompt(expression [, expression])`; the parser implemented only the typed form.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/parser/parser.ts` (windows 1-70, 660-775, 815-870, 1150-1450, 1462-1485, 1528-1539)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/executor/executor.ts` (windows 2573-2600, 2630-2720, 2940-3029, 3513-3521)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/executor/UIBridge.ts` (window 36-169)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/hooks/useJjtlParser.ts` (whole)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/editor/JjtlEditor.tsx` (window 1-80)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/types/ast.ts` (windows 14-48, 137-165, 244-312)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjel/types/ast.ts` (windows 15-33, 56-73, 170-180, 336-343)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjel/lexer/lexer.ts` (window 228-242)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/SPEC.md` (windows 276-311, 575-614, 899-917)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/components/GrammarDiagram/types.ts` (grep hits 22-25, 151-174)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/types/transformation.ts` (window 40-100), `components/JjtlDevelopmentEnv.tsx` (58-70)
- `/Users/alfonso/jjodel-w-jjtlparity/frontend/src/jjtl/__tests__/helper-multiline.test.ts` (90-130), `let-prompt-bug.test.ts` (40-80), `executor/__tests__/let-in-nested-bodies.test.ts` (1-110)

## Fixture inventory (measured, HEAD `f839d2458`)

- **Tests**: every source the `src/jjtl` suite lexes, captured at runtime by a temporary wrapper on
  `JjtlLexer.prototype.tokenize` in a setup file, under a probe config that aliases `joiner` to a stub
  (`asNumber` verbatim, `RuntimeAccessible` as identity), so the 7 import-failing files collect. 191 captures,
  137 distinct, 132 complete transformations (the other 5 are lexer fragments such as `x := y`). The 132 are committed
  as `frontend/src/jjtl/__tests__/fixtures/parity-sources.json`.
- **Docs**: code fences starting with `transformation` in `frontend/src/jjtl/SPEC.md` (6: the five §13 examples and the
  §3.1 EBNF fence), `frontend/src/jjtl/README.md` (2: one EBNF, one example), `docs/help/reference/jjtl.md` (1),
  `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md` (1).
- **App templates**: `DEFAULT_CODE` of `JjtlDevelopmentEnv.tsx`, `createTransformation().code` of `types/transformation.ts`.
- Total 144. The gallery holds no JjTL (P-2026-10-31-1710 inventory, not re-measured).

Probe baseline under the stubbed config, HEAD: 254 tests, 252 passed, 2 failed (`executor-bridge` Test 5,
`executor-llayer` forall `such that` filter, the two pre-existing of P-2026-10-31-1340), `ai-prompt-sanitization`
fails at import (`localStorage is not defined`).

## Probes

All temporary files (`frontend/_tmp_joiner_stub.ts`, `_tmp_probe_setup.ts`, `_tmp_vitest.probe.config.ts`, a
`PARITY_REPORT` dump inside the parity test) are deleted; none is committed.

**P1, the comparison.** For each fixture: lex once, parse without and with `source`. When the legacy parse is clean:
the JjEL parse must be clean; both ASTs normalized (legacy expression nodes through `toJjelAst`, `JjelExpression`
wrappers unwrapped, `location` dropped) must be equal; both executed against a synthetic source model (two instances of
every source class the rules name, with `name`, `value`, `active`) under a recording `UIBridge` (prompt answers
`typed:<msg>`, confirm `true`, input `entered:<msg>`) must give the same `success`, `errors`, `warnings`, `roots` and
dialog calls.

**P2, before and after, 144 fixtures.**

| Category | HEAD | after the fixes |
|----------|------|-----------------|
| identical parse and run | 103 | 111 |
| run differs only in the warning label (P3) | 16 | 16 |
| AST differs (`prompt` as JjEL `FunctionCall`) | 6 (`tests#117 #121 #123 #125 #127 #128`) | 0 |
| legacy clean, JjEL parse error | 1 (`tests#132`, `7:10 Expected source attribute name`) | 0 |
| legacy fails, JjEL parses (JjEL-only forms) | 14 (13 + `SPEC.md#6`) | 13 |
| both fail | 4 (`tests#036`, `tests#043`: error fixtures; `SPEC.md#1`, `README.md#1`: EBNF) | 4 |

`SPEC.md#6` is §13 example 5: on HEAD it fails on legacy (`9:60 Expected ')' after prompt arguments`) and parses on
JjEL as a plain `prompt` call that would evaluate to null; after the fixes it parses on both and runs the same. The 13
JjEL-only forms are the ones P-2026-10-31-1710 P2 listed (`implies`, `exists`, `with ... do`, `forall ... : ...`).

**P3, the 16 run differences.** Every one is in the warning text only, and vanishes once
`Expression evaluation failed (<type>)` is normalized (measured: 0 left). The label comes from
`frontend/src/jjtl/executor/executor.ts:2613` `` this.warnings.push(`Expression evaluation failed (${expr.type}): ${errorMessage}`); ``:
on the JjEL path `expr.type` is `JjelExpression`, on legacy the legacy node type (`FunctionCall`, `MemberAccess`,
`BinaryExpression`). The message after the label (`Cannot call method 'size' on null`) is JjEL's on both paths.

**P4, mutation bench on the parity test.** Disabling the interactive conversion: 7 fixtures fail (the 6 `prompt` ones
and `SPEC.md#6`). Disabling the newline continuation: 1 fails (`tests#132`). Dropping the `else` lookahead from the
continuation: the guard test "a newline still ends a := conditional with no else" fails.

## Findings

**F1 (read): legacy builds dedicated nodes, the executor awaits them by type.** `parser.ts` (HEAD) `primary()`
`if (this.check(TokenType.PROMPT)) { return this.promptExpression(); }`, same for INPUT and CONFIRM; the executor
`executor.ts:2657` `if (expr.type === 'PromptExpression') {` ... `await getUIBridge().showPrompt(`, `:2673`
`if (expr.type === 'ConfirmExpression') {`, `:2679` `if (expr.type === 'InputExpression') {`, else
`:2695` `return this.evaluateExpression(expr, ctx);`. On the JjEL path `parseJjELExpression` returns
(HEAD `parser.ts:761-765`) `return { type: 'JjelExpression', expression: jjelResult.expression, ... }`, a JjEL
`FunctionCall` named `prompt`; it falls through to the synchronous evaluator, where JjEL has no such function.

**F2 (read): JjEL does not know the three names.** `command grep -rlw "prompt"` over `frontend/src/jjel` returns no file (pipe
exit 0); positive control, the same command over `jjtl/parser` and `jjtl/SPEC.md` lists `parser.ts` and `SPEC.md`. JjEL's `FunctionCallExpr` is
`frontend/src/jjel/types/ast.ts:173-176` `type: 'FunctionCall'; name: string; args: JjelExpression[];`.

**F3 (read + measured): the multi-line stop.** The `:=` boundaries are `parser.ts:310`
`this.parseJjELExpression([TokenType.NEWLINE, TokenType.RBRACE, TokenType.COLON])` and `:317`
`[TokenType.NEWLINE, TokenType.RBRACE]`; the collector breaks at any depth-0 boundary. Legacy continues in
`ifThenElse` (HEAD `parser.ts:831`) `if (this.isElseAfterNewlines()) { this.skipNewlines(); }`. JjEL treats `\n` as
whitespace (`jjel/lexer/lexer.ts:237` `case '\n':`), so the delegated substring may span the newline.

**F4 (read): example 5 is the documented grammar.** SPEC.md §3.5 `promptExpr = "prompt" "(" expression ( "," expression )? ")" ;`
and `GrammarDiagram/types.ts:154` `ebnf: '"prompt" "(" expression ("," expression)? ")"'`, example
`prefix := prompt("Table prefix:", "tbl_")`. The parser required a type identifier (HEAD `parser.ts:1371`
`this.consume(TokenType.IDENTIFIER, "Expected type reference (e.g. EString, EInt, EBoolean)")`). The docs grammar does
not mention the typed form; the code does not implement the documented one.

**F5 (read): consumers.** No module outside `frontend/src/jjtl/` imports the JjTL parser: `grep -rn "from '[./]*jjtl[/']"`
over `frontend/src`, minus `jjtl/` itself, lists only `App.tsx` (dialogs), `jjscript` (UIBridge, theme), `codegen`
(theme), `DockManager.tsx` (components, types). Positive control: the same tool finds `from '../parser'` in
`useJjtlParser.ts` and `JjtlEditor.tsx`. Inside `jjtl/`, the parser is called by `useJjtlParser.ts:61` and
`JjtlEditor.tsx:57`, both without `source` on HEAD.

## Plan (implemented in the next commit)

1. `parser.ts` `parseJjELExpression`: when the delegated expression starts with the PROMPT, CONFIRM or INPUT token and
   JjEL returns a `FunctionCall`, build the legacy `PromptExpression` / `ConfirmExpression` / `InputExpression` with the
   arguments as `JjelExpression` wrappers. The executor needs no change: it already awaits these nodes and evaluates
   wrapped arguments. Malformed calls become parse errors, as on legacy.
2. `parser.ts` `parseJjELExpression`: at a depth-0 NEWLINE boundary, skip the newlines and continue when an ELSE follows
   them and an `if` collected at depth 0 still waits for its `else`. Applies to every NEWLINE-bounded site, as legacy
   `ifThenElse` applies to every `expression()`.
3. Prompt forms, both paths: `prompt(message, Type [, default])` when the second argument is a bare identifier followed
   by `,` or `)`, else `prompt(message, default)` with type `EString` (SPEC §3.5, §13 example 5).
4. Then `useJjtlParser.ts:61` and `JjtlEditor.tsx:57` pass the source, in one commit.

Consumers each change can affect: only the JjTL parser output on the JjEL path, which today is reached by the tests
that pass `source` and, after step 4, by the app. JjEL, JjScript, codegen and Jjodie are not touched (F2, F5). One
existing test pins the old JjEL-path shape: `let-prompt-bug.test.ts:53`
`expect(letStmt.bindings[0].value.type).toBe('JjelExpression');`, the very behaviour being fixed.

## Dependencies and risks

- `JjtlEditor.tsx` imports monaco through `joiner`, so its one-line change has no test in the node bench; the hook test
  covers the same `parse(tokens, source)` call.
- No hook renderer or DOM environment exists in the repo; the hook test replaces `react` with four primitives.
- The run comparison uses a synthetic source model: it shows equal results on that model, not on every possible model.
  The expression-level equality (P2, 0 AST differences) is the stronger evidence: the executor evaluates both forms
  through the same JjEL evaluator.
- `prompt("x", name)`: a bare identifier second argument stays the type, as on legacy, though SPEC §3.5 would read it
  as a default.

## Open questions

1. Accept the warning label difference (`(JjelExpression)` vs the legacy node type), or report the inner JjEL node type?
2. Should `prompt(msg, identifier)` keep meaning a type (legacy, kept) or a default (SPEC §3.5 reading)?
3. Should SPEC §3.5 and `GRAMMAR_RULES` document the typed form `prompt(message, Type [, default])`?
