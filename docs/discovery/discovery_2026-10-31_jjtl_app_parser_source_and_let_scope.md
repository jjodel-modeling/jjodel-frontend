# Discovery — JjTL: the app parser with `source`, and `let` variables in nested bodies

- Prompt-ID: P-2026-10-31-1710
- Prompt file: `docs/prompts/claude_2026-10-31_1710_prompt_jjtl_app_parser_source_and_let_scope.md`
- Session: 78f69a37-7fac-4bed-b9b4-ae1264cc393f
- Tree: `~/jjodel-w-jjtlapp`, branch `jjtl-app-source`, HEAD `aedd3c3c8`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a definitive reference. Re-read the real files before acting on it.

## Objective

1. Measure what changes when the app parses JjTL with `source` (every expression goes through JjEL): parse result
   and executed result of every transformation fixture of the repo, on both paths.
2. Locate how `let` variables are bound today and why nested bodies do not see them.

## Hypotheses under test

1. H1: passing `source` in `useJjtlParser` changes no parse and no result of an existing fixture, only adds forms.
   **Falsified** (F3, F4): one form stops parsing, and `prompt(...)` / `confirm(...)` stop opening their dialog.
2. H2: `useJjtlParser` is the only place where the app parses JjTL. **Falsified** (F1): `JjtlEditor.tsx` parses too,
   for the Monaco markers, also without `source`.
3. H3: `let` variables are lost below the let body for the same reason the alias was (F4 of P-2026-10-31-1340): the
   nested calls receive only `aliasBindings`. **Holds** (F5, F6).
4. H4: a `-> feature { }` inside a `let` body is placed like at rule level. **Falsified** (F7): it still takes the
   pre-P-2026-10-30-1315 wrapper path.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/hooks/useJjtlParser.ts` (whole)
- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/editor/JjtlEditor.tsx` (window 40-80)
- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx` (grep hits for the parser hook and `JjtlEditor`)
- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/parser/parser.ts` (windows 55-110, 200-500, 655-790, 1530-1540)
- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/lexer/lexer.ts` (windows 21-46, 170-190)
- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/executor/executor.ts` (windows 1500-1620, 1796-1815, 1935-2455, 2610-2700, 3482-3492)
- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/executor/astBridge.ts` (window 50-80)
- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/types/transformation.ts` (window 40-94)
- `/Users/alfonso/jjodel-w-jjtlapp/frontend/src/jjtl/__tests__/helper-multiline.test.ts` (whole), `let-prompt-bug.test.ts` (window 57-74)
- `/Users/alfonso/jjodel-w-jjtlapp/docs/discovery/discovery_2026-10-31_jjtl_expression_source_collections.md` (whole)

## Fixture inventory (measured, HEAD `aedd3c3c8`)

- **Tests**: every source string the `src/jjtl` suite lexes, captured at runtime by a temporary hook in
  `JjtlLexer.tokenize` (175 captures, 129 distinct, run with `joiner` stubbed so the import-failing files collect).
- **Docs**: code fences starting with `transformation` in `frontend/src/jjtl/SPEC.md` (5), `frontend/src/jjtl/README.md`
  (1), `docs/help/reference/jjtl.md` (1; `frontend/public/docs/help/reference/jjtl.md` is byte-identical, `cmp`),
  `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md` (1).
- **App templates**: `DEFAULT_CODE` of `JjtlDevelopmentEnv.tsx`, `generateDefaultCode` of `types/transformation.ts`.
- **Gallery**: `frontend/public/library/gallery/*/1.jjodel`, 7 projects, `transformations` array length `0 0 0 0 0 0 0`
  (positive control: the key is present in all seven and is read as an array). No JjTL there. No `examples/` tree with
  JjTL exists (search for `transformation <name> from` over `frontend/src`, `frontend/public`, `docs/help`, `scripts`,
  `tools`; positive control: the same search found the test files and `SPEC.md`).

Total after dedup: 139 fixtures, 134 complete transformations, 207 expression sites.

## Probes

Temporary, none committed: a switch in the `JjtlParser` constructor forcing every parse to the legacy path or to the
JjEL path (the source taken from the tokens' lexer), a capture hook in the lexer, a probe vitest file and a probe
config that stubs `joiner` with `asNumber` verbatim. All reverted (`git checkout` of `lexer.ts` and `parser.ts`).

**P1, whole `src/jjtl` suite, three runs (joiner stubbed).**

| Run | tests | passed | failed |
|-----|-------|--------|--------|
| native (as committed) | 238 | 236 | 2 (`executor-bridge` Test 5, `executor-llayer` forall filter; the 2 pre-existing of P-2026-10-31-1340) |
| every parse forced to legacy | 238 | 212 | 26 (the 2 + 24 tests that assert the JjEL path) |
| every parse forced to JjEL | 238 | 212 | 26 (the 2 + 24 below) |

`ai-prompt-sanitization.test.ts` fails at import in all three (`RuntimeAccessible is not a function`, the stub does not
cover it). The 24 JjEL-forced failures: 22 assert the legacy AST shape (`expected 'JjelExpression' to be
'BinaryExpression'`, `.value` / `.arguments[0]` of legacy nodes) in `parser-fixes` (17), `forall-mapping` (1),
`helper-multiline` (1), `jjel-delegation` (1, the legacy-path test), `let-prompt-bug` (2). One is a parse error
(`helper-multiline` "a := conditional may continue with else on the next line"). No executing test changed outcome.

**P2, every fixture parsed both ways, expression by expression.** Each JjEL-path expression is compared with
`toJjelAst(legacy expression)`, locations stripped. 201 of 207 sites are identical after the bridge, so they evaluate
the same. The 6 others are all `prompt(...)` in a `let` binding: legacy `PromptExpression` (not convertible by the
bridge, handled by `evaluateExpressionAsync`), JjEL `{"type":"FunctionCall","name":"prompt",...}`. Error lists differ
in 15 fixtures: 13 are JjEL forms that fail on legacy and parse on JjEL (`implies`, `exists`, `with ... do`,
`forall ... : ...`, `exists` in a forall `such that`), plus the two below.

**P3, executed both ways** (`NoopUIBridge` with `showPrompt` / `showConfirm` recorded):

| Case | legacy | JjEL path |
|------|--------|-----------|
| `let $p = prompt('Name', EString) in { name := $p }` | dialog shown, `name: "typed"` | no dialog, `name: null`, warning `Function 'prompt' is not defined` |
| `name := prompt("Category?", EString)` | dialog, `"typed"` | no dialog, `null`, same warning |
| `ok := confirm("Sure?")` | dialog, `true` | no dialog, `null`, `Function 'confirm' is not defined` |
| `a := if flag then 1⏎ else 2` then `b := 3` | `a: 2, b: 3` | parse error `7:10 Expected source attribute name` |
| SPEC.md §13 example 5, `prompt("Category for " + name + "?", source.category)` | parse error `Expected ')' after prompt arguments` | parses, then would hit `prompt` not defined |

**P4, `let` in nested bodies on HEAD** (fixture: one `Entity` with two contained `Attribute`s, one `Part`; same result
on both parse paths):

| Case | result |
|------|--------|
| `let $x = "T" in { tag := $x }` | `tag: "T"` |
| `let` then `forall a in ownedAttributes -> Column { tag := $x }` | `tag: null` on both columns |
| `let` then `-> columns { forall a ... -> Column { -> parts { forall p ... -> Part { tag := $x + p.name } } } }` | `columns` is an object `{ columns: [...] }` plus a pluralization warning; `tag: "p"` (`$x` null) |
| `let` then `-> columns { -> Column { tag := $x } }` | `columns: { tag: null }` (wrapper object, `$x` null) |
| `forall ... -> Column { let $y = a.name in { name := $y; -> parts { -> Part { tag := $y } } } }` | `name` right; `parts: { tag: null }` |

## Findings

**F1 (read): the app parses JjTL in two places, both without `source`.** `frontend/src/jjtl/hooks/useJjtlParser.ts:61`
`const parserResult = parse(lexerResult.tokens);` (AST, Problems panel, execution via `parseNow`) and
`frontend/src/jjtl/editor/JjtlEditor.tsx:57` `const parserResult = parse(lexerResult.tokens);` (Monaco markers,
`monaco.editor.setModelMarkers(model, 'jjtl', markers)`). Both mounted by `JjtlDevelopmentEnv.tsx:141` and `:731`.
P-2026-10-31-1340 F6 called the hook "the only non-test parse call site"; its grep (`JjtlParser(`, `parse(tokens`)
could not match either line. If only the hook passes `source`, a JjEL-only form runs but keeps its red Monaco marker.

**F2 (read): what `source` switches.** `parser.ts:141-145` (`where`), `:309-318` (`:=`), `:466-468` (let bindings),
`:500-505` (forall `such that`), `:566`, `:639` (conversions, helper bodies): each `this.source !== undefined ?
this.parseJjELExpression(...) : this.expression()`. `parseJjELExpression` (`:668-766`) collects tokens up to a
boundary and parses the substring with JjEL.

**F3 (measured): one form stops parsing.** For `:=` the boundary is `[TokenType.NEWLINE, TokenType.RBRACE]`
(`parser.ts:317`), so `if flag then 1⏎ else 2` ends at the newline; the `else` line falls to the legacy attribute
form and fails. The legacy `expression()` lets a conditional continue across the newline
(`helper-multiline.test.ts:100` "a := conditional may continue with else on the next line").

**F4 (measured): `prompt`, `confirm`, `input` lose their dialog.** The legacy parser builds `PromptExpression`
(`parser.ts:1370` `promptExpression = "prompt" "(" expression "," IDENTIFIER ("," expression)? ")"`), and
`executor.ts:2626` `if (expr.type === 'PromptExpression') {` opens the dialog. On the JjEL path the call is a JjEL
`FunctionCall` named `prompt`, which falls through to `evaluateExpression` (`executor.ts:2664`) and JjEL has no such
function. `confirm` measured the same way; `input` read only (`executor.ts:2648`, same pattern).

**F5 (read): how `let` is bound.** Rule level: `executor.ts:1523-1529` `let letCtx = this.createInstanceContext(sourceInstance, alias);`
then `letCtx = letCtx.child({ [binding.name]: value });`, then `executeLetBody(letItem.body, ..., letCtx, alias)`.
The variables live only in `letCtx`. Inside `executeLetBody`, nested bodies get the alias alone:
`executor.ts:2279` `value = await this.executeObjectCreation(mapping.objectCreation, sourceInstance, this.aliasBindings(sourceInstance, alias));`
and `:2302` `await this.executeForAllMapping(item as ForAllMappingAST, sourceInstance, targetInstance, alias);`.
Same in `executeLetBodyWithTrace` (`:2342`, `:2387`).

**F6 (read): inside a created object, the let body passes the outer bindings only.** `executor.ts:2164-2169` builds
`letCtx` from `extraBindings`, then `:2177` `value = await this.executeObjectCreation(attrMapping.objectCreation, sourceInstance, extraBindings);`
and `:2198` `await this.executeForAllMappingOnObject(bodyItem as ForAllMappingAST, sourceInstance, newObject, extraBindings);`.
`:2200` `// Nested let, alert, notify inside object creation let body are handled recursively` is not true: the loop
handles `AttributeMapping` and `ForAllMapping` only, the other items are skipped.

**F7 (read + measured): `-> feature { }` in a let body takes the wrapper path.** At rule level
`executor.ts:1806-1810` routes `mapping.objectCreation` to `executeCreationMapping` (P-2026-10-30-1315). In let bodies
`:2279`, `:2342`, `:2177` call `executeObjectCreation` directly and assign the result to the feature, so
`-> columns { -> Column { ... } }` produces an object typed `columns` (P4 rows 3-5).

## Minimal change, per point

**Point 1.** Passing `source` in the hook is one line, and should go with `JjtlEditor.tsx:57` too (F1), out of the
declared scope. It changes two existing behaviours (F3, F4). Per the prompt, stop with the list; no fixture adapted.
What would make it safe, for Alfonso to choose: (a) keep `prompt` / `confirm` / `input` on the JjTL path by
recognising them before delegation, or bind them as async JjEL functions; (b) let a `:=` conditional continue across a
newline before `else` on the JjEL path (boundary lookahead in `parseJjELExpression`).

**Point 2.** All in `executor.ts`, the P-2026-10-31-1340 way: carry the let variables as a record alongside `letCtx`,
merge them with the alias into the extra bindings of every nested call (`executeForAllMapping`, creations), and in a
created object run the let body through the same loop as the object body with the merged bindings, so nested
`let`, `alert`, `notify` and `-> feature { }` work at any depth. Route `-> feature { }` in let bodies through
`executeCreationMapping`, as at rule level (F7): without it the test "`$x` read inside a `-> feature { }` body" has
nothing correct to assert. Let names carry `$` (`lexer.ts:178-184`, `DOLLAR_IDENT`), so they cannot collide with the
alias or with the forall's item properties.

## Consumers and risks

- Point 2 touches only `JjtlExecutor` private methods; no exported type changes. Behaviour changes only inside let
  bodies: variables become visible below them; `-> feature { }` placement there becomes the rule-level one; skipped
  items in a created object's let body start running. No existing test executes a let body: `grep -rl 'let \$'` over
  `frontend/src/jjtl` returns `let-prompt-bug.test.ts` (parse-only) and a comment in `types/ast.ts`, plus the probe
  file itself, which is the positive control.
- The 7 JjTL test files that fail at import (`window is not defined`) still do not collect under the committed
  config; the stubbed config shows them green before the change.

## Open questions

1. Point 1: keep the hook on the legacy path until (a) and (b) are fixed, or switch now accepting the two regressions?
2. If the switch goes ahead, should `JjtlEditor.tsx:57` switch in the same lane (outside the declared files)?
3. SPEC.md §13 example 5 (`prompt(msg, source.category)`) does not parse on the legacy path today: fix the example or the parser?
