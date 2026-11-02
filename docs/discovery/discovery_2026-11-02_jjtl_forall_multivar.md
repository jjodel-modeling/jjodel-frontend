# Discovery: JjTL `forall` over several variables

- Prompt-ID: P-2026-11-02-1331 (executes P-2026-10-31-1741, superseded, with R-FA-1 and R-FA-7)
- Prompt file: `docs/prompts/claude_2026-10-31_1741_prompt_jjtl_forall_multivar.md` (specification), this lane's launch prompt
- Session: id not exposed in the environment
- Tree: `~/jjodel-w-jjtlforallmv`, branch `jjtl-forall-multivar`, HEAD `17beac16c`
- Executor model: Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence, not a definitive reference. Read the real files downstream.

## Objective

Find where the JjTL `forall` is parsed, typed and iterated. Plan a multi-variable `forall` (both spellings of R-FA-1,
mixable, a later collection reading an earlier variable as R-FA-2 requires) that stays inside `frontend/src/jjtl/` and
changes no exported type read outside it. Check the JjEL route (a list of object literals as the collection).

## Hypotheses under test

1. **The `forall` is parsed in one place only, and `useJjtlParser` has no path of its own.** Holds (read):
   `useJjtlParser.ts:61` `const parserResult = parse(lexerResult.tokens, source);` goes through the shared parser. The
   only `forall` statement rule is `parser.ts:489` `private forAllMapping(): ForAllMappingAST {`.
2. **`ForAllMappingAST` is read only inside `frontend/src/jjtl/`.** Holds (read). `command grep -rn "ForAllMapping"` over
   `frontend/src` (`*.ts`, `*.tsx`, tests excluded) hits only `jjtl/types/ast.ts`, `jjtl/parser/parser.ts` and
   `jjtl/executor/executor.ts`. Positive control: the same command lists those three files, so the search reached the tree.
   The other `.variable` readers it finds (`codegen/`, `model/simulation/`) read the JjEL `ForAll`/`Exists` node, not this one.
3. **All iteration happens in one function, so the product can be added there.** Holds (read). `runForAll`
   (`executor.ts:2009`) is called by the three placements: `executor.ts:1980` (`-> feature { forall ... }`),
   `executor.ts:2218` (`executeForAllMapping`, rule body) and `executor.ts:2260` (`executeForAllMappingOnObject`,
   inside a created object).
4. **Today a two-variable `forall` does not parse.** Holds (measured, probe below): `Expected '->' for object creation in forall` on both parser paths.
5. **The JjEL route (`forall pr in requesters.flatMap(q => ... .map(r => { hi: q, lo: r }))`) already works.** Falsified
   (measured): `Expected expression` on both parser paths, at parse time, not in the executor. See F5.

## Files read

- `/Users/alfonso/jjodel-w-jjtlforallmv/frontend/src/jjtl/parser/parser.ts` (lines 200-545, 660-750, 1274-1342)
- `/Users/alfonso/jjodel-w-jjtlforallmv/frontend/src/jjtl/types/ast.ts` (lines 105-124)
- `/Users/alfonso/jjodel-w-jjtlforallmv/frontend/src/jjtl/executor/executor.ts` (lines 720-735, 795-802, 1960-2300)
- `/Users/alfonso/jjodel-w-jjtlforallmv/frontend/src/jjtl/hooks/useJjtlParser.ts` (line 61)
- `/Users/alfonso/jjodel-w-jjtlforallmv/frontend/src/jjtl/executor/__tests__/let-in-nested-bodies.test.ts` (whole)
- `/Users/alfonso/jjodel-w-jjtlforallmv/frontend/src/jjtl/SPEC.md` (grep of `forall`, lines 179-184)
- `/Users/alfonso/jjodel-w-jjtlforallmv/frontend/src/jjtl/CLAUDE.md`, `docs/decisions.md` R-FA (lines 7100-7122)

## Probe (measured, HEAD `17beac16c` plus the untracked probe file)

`frontend/src/jjtl/executor/__tests__/forall-multivar.test.ts`, the seed of the Phase 2 test: arbiter `a` with
requesters cpu (priority 1), dma (2), io (3) as `{ __ref }`; target classes Property, Conj, Neg, Ref, Pair. Run three
times: the first two printed nothing because vitest does not let `console.log` reach the quiet runner's log, the third
wrote to `/tmp/jjtl-forall-probe.txt`. Same results on both parser paths (with and without `source`):

- Nested single-variable foralls (today's form): no errors, no warnings, rendered
  `!(grant_cpu_r & grant_dma_r) & !(grant_cpu_r & grant_io_r) & !(grant_dma_r & grant_io_r) & ` — the trailing `& ` is
  the empty inner `Conj` of io, the renderer flattens the per-requester `Conj` nesting, so the tree shape of the prompt is confirmed.
- `forall q in requesters, r in requesters such that ... -> Neg { }`: `["Expected '->' for object creation in forall"]`.
- JjEL route: `["Expected expression"]`.

## Findings

- **F1 grammar** (read) `parser.ts:492-497`: `const variable = this.consume(TokenType.IDENTIFIER, "Expected iteration variable name").value;`
  then `this.consume(TokenType.IN, ...)` then `const collection = this.expression();`. The collection always goes through the
  legacy expression parser, on both paths. The filter delegates to JjEL when `source` is present, `parser.ts:506-508`:
  `this.parseJjELExpression([TokenType.ARROW, TokenType.NEWLINE])`.
- **F2 the comma ends a collection** (read): the legacy chain `expression()` (`parser.ts:901`) through `primary()`
  (`parser.ts:1274`) has no comma operator; commas are consumed only inside `argumentList()` (`parser.ts:1206`) and
  array literals. So after the collection, a COMMA is the next token, which is what the probe's error shows (the parser
  expected `->` where it found `,`). A binding list can be parsed after the collection without touching `expression()`.
- **F3 AST** (read) `ast.ts:111-117`: `variable: string; collection: ExpressionAST; filter?: ExpressionAST; objectCreation: ObjectCreationAST;`.
- **F4 readers of `variable`/`collection`** (read), all in `executor.ts`: `2017` `this.evaluateExpression(forall.collection, baseCtx)`;
  `2039` `[forall.variable]: this.bindSourceValue(item),`; `2050` `const childCtx = baseCtx.child({ [forall.variable]: this.bindSourceValue(item) });`;
  `2065` the unresolved-refs warning `` `forall ${forall.variable}: ...` ``. `executor.ts:729` and `:799` read only `type` and `objectCreation`.
- **F5 the JjEL route fails in the parser** (measured + read): the collection goes through `expression()` (F1), whose
  `primary()` has no object-literal production and ends with `parser.ts:1341` `throw this.error(this.peek(), "Expected expression");`
  at the `{` of `{ hi: q, lo: r }`. Lambdas are accepted (`parser.ts:1199`, the `IDENTIFIER FAT_ARROW` check in
  `argumentList()`). The fix is in the parser (delegate the collection to `parseJjELExpression` when `source` is
  present), not in the executor, so by the prompt it is not made in this lane. The executor half of the route (iterating
  a list of object literals, `pr.hi.name`) can still be tested by binding the list with `let`, whose value is parsed by
  JjEL (`parser.ts:468`) on the source path.
- **F6 bindings after P-2026-10-31-1710** (read): the enclosing variables and the `let` variables arrive in
  `extraBindings`. `runForAll` builds `baseCtx` from them (`executor.ts:2014-2016`); the filter sees `baseCtx` plus the
  variable (`2050`); the body gets `itemBindings` = `extraBindings`, the variable, then every non-`__` property of the
  element unqualified (`2037-2049`), so a nested `forall` sees the outer variable through `extraBindings`.
- **F7 grammar docs** (read): `SPEC.md:181` `forAllMapping    = "forall" IDENTIFIER "in" expression`. `docs/jjtl/` holds only
  `JJTL-DEVELOPMENT-PLAN.md`, no grammar. `components/GrammarDiagram/` has no `forall` rule: `command grep -rn -i forall`
  over `analyzer editor components services utils views hooks` hits only `editor/jjtlLanguage.ts` (keywords), the
  positive control of that same search. Tokens and lexer: `IDENTIFIER`, `COMMA`, `IN` already exist, no new keyword.

## Plan

- **AST**: add one optional property to `ForAllMappingAST`, `bindings?: Array<{ variable: string; collection: ExpressionAST }>`,
  set by the parser only when there is more than one variable, every variable in order. `variable`/`collection` keep the
  first binding, so the existing readers and the existing parser tests are unchanged. Inline type, like `LetStatementAST.bindings`; no new exported name.
- **Parser** (`forAllMapping`): groups `IDENT ("," IDENT)* "in" expression`, separated by `,`. After a collection a comma
  continues only when followed by an identifier list ending in `in` (R-FA-5); otherwise an error. A repeated name is
  a parse error.
- **Executor** (`runForAll`): iterate `bindings ?? [{ variable, collection }]` as the cartesian product, first variable
  outermost, each collection evaluated in `baseCtx` plus the variables already bound (R-FA-2). Filter and body see all
  variables. Element dereferencing, the non-array warning and the unresolved-refs warning stay per collection. The
  unqualified element properties are added only for a one-variable `forall` (two elements would collide; a decision, below).
- **Docs**: `SPEC.md` grammar line and one example per spelling.

## Risks

- A one-variable `forall` must take exactly the old path: the fallback `[{ variable, collection }]` and the single-variable
  property flattening keep it byte for byte, covered by the existing tests (`let-in-nested-bodies`, `nested-creation-into-features`, `range-forall`, ...).
- A product grows multiplicatively; no cap is added (none exists for one variable).

## Questions

1. Should the forall collection delegate to JjEL on the source path, so the JjEL route of the prompt parses (F5)? A parser change outside this lane's remit.
2. Should a multi-variable `forall` also bind the elements' properties unqualified, and if so with which precedence? This lane does not.
