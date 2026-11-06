# Discovery 2026-11-03 — JjScript console: four defects

- Prompt-ID: P-2026-11-03-0000 (`docs/prompts/claude_2026-11-03_0000_prompt_jjscript_console_defects.md`)
- Session: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D (chat C-2026-11-02-1319)
- Tree: `~/jjodel-w-jjsconsole`, branch `jjscript-console-defects`, HEAD `c258151f9`
- Executor: Claude Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Read the real files downstream.

## Objective

Reproduce the four defects the chat saw on 3001 on 2026-11-02 with executing tests, find the root cause of
each, and decide whether each one is a local fix inside `frontend/src/jjscript/`.

## Hypotheses under test

1. H1, `create package` crashes inside the model layer because JjScript calls it wrong, not because the model
   layer is broken. **Holds** (F1).
2. H2, `create class Foo in P1` with no P1 creates an orphan class and reports success. **Holds** (F2).
3. H3, `eval` rebuilds the text from tokens. **Holds** (F3).
4. H4, a `let` value stops at the first top-level `in` because the quantifier is not counted. **Holds, and the
   reason is narrower than the prompt says**: `forall` lexes as a COMMAND token, which the count does not look
   at; `exists` is an IDENTIFIER and is counted (F4).
5. H5, `$x` does not read in `eval`. **Falsified as a separate defect**: JjEL reads `$x` (DOLLAR_IDENT), and
   `eval` sees the variables of `let`. The failure is F3: `$x.size` reaches JjEL as `$ x.size` (F5).

## Bench

`frontend/src/jjscript/executor/__tests__/consoleDefects.test.ts`, on the harness of `forallById.test.ts`:
real parser, `executeCreate`, `resolvers.ts`, `executeEval`, `buildEvalContext`, `executeLet`, JjEL; stubbed
joiner barrel (Proxy), `../utils`, `nameUniqueness`, executor dispatch. The `DPackage.new` stub reads
`fatherType.cname` when it has a father, as `Constructors.DPackage` does. Measured on `c258151f9`: 20 tests,
12 red, 8 green. The 8 green are positive controls (a class in an existing package, in the metamodel, with no
`in`; `eval` in a block and at end of line; `exists` followed by a second binding; `f(forall a in S, y)`; a
broken value is an error). `node_modules` reached through a temporary symlink to `~/jjodel/frontend/node_modules`
(P14), removed at the end of the lane.

## Files read

- `frontend/src/jjscript/parser/parser.ts` (lines 625-660, 960-1400)
- `frontend/src/jjscript/parser/lexer.ts` (lines 25-145, 178-417)
- `frontend/src/jjscript/reservedIdentifiers.ts` (lines 15-25)
- `frontend/src/jjscript/executor/commands/create.ts` (lines 1-60, 120-160, 215-545, 1050-1094)
- `frontend/src/jjscript/executor/commands/let.ts` (whole)
- `frontend/src/jjscript/executor/commands/eval.ts` (lines 20-127)
- `frontend/src/jjscript/executor/utils.ts` (lines 225-294)
- `frontend/src/jjscript/executor/__tests__/forallById.test.ts` (lines 1-170)
- `frontend/src/jjscript/executor/__tests__/m2CreateGuard.test.ts` (lines 1-110)
- `frontend/src/jjel/lexer/lexer.ts` (lines 210-234)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (lines 1825-1840)
- `frontend/src/joiner/classes.ts` (lines 992-1004, plus a grep for `fatherType`)

## Findings

**F1, defect 1 (read and measured).** `create.ts:1066-1072` calls `DPackage.new(name, options?.nsUri,
options?.nsPrefix, parentId, true)`, five arguments: `fatherType` is not passed. `Constructors.DPackage` reads it
whenever there is a father, `joiner/classes.ts:996-997`: «`if (thiss.father) { if (this.fatherType!.cname ===
"DModel") {`». The default parent is the first package or the metamodel (`utils.ts:271-275`), so a father is
always there and the read always throws. Every other caller passes it: `LModelElement.tsx:1954` «`DPackage.new(name,
uri, prefix, context.data.id, true, DPackage)`», `:5224` the same with `DModel`, `canvasToJjom.ts:1352` with
`DModel`. Measured: the three defect-1 tests fail with «Failed to create package: Cannot read properties of
undefined (reading 'cname')». Local fix: pass `DModel` when the parent's `className` is `DModel`, else `DPackage`.
Not in scope and not changed: `components/editors/Info.tsx:384` makes the same five-argument call (ticket).

**F2, defect 2 (read and measured).** For a class, an enum or a package, a named parent that resolves nowhere
falls through to the creator with `parentElement` null, `create.ts:301-306`: «`if (!parentElement && !parentAmbiguity
&& !resolution.memberMissingOn && !needsParent(elementType)) {`» … «`if (!parentElement) parentElement =
resolveElement(parent, project);`», and the refusal at `:340` fires only for `needsParent` types. `createClass`
then calls `DClass.new(..., parentId /* undefined */, true)` (`create.ts:506-519`): a class with no father,
which no collection lists. Measured: `create class Foo in P9` with no P9 returns «Created class 'Foo'». So the
console sequence of the chat is F1 then F2: `create package P1` failed, then `create class Foo in P1` made an
orphan. Local fix: when a parent was named and nothing resolved it, refuse with `PARENT_NOT_FOUND` naming it,
for every type.

**F3, defect 3 (read and measured).** `parser.ts:1348-1353` joins token values: «`parts.push(this.advance().value);`»
… «`const expression = parts.join(' ').trim();`». The lexer has no `=>` (`lexer.ts:285`, two-character operators
end in `=` only), so `c => c.name` becomes `c = > c.name`; a STRING token holds the unquoted value
(`lexer.ts:212-213`), so `" "` becomes a space. Measured: the expression is `classes.map ( c = > c.name )`; JjEL
answers «Unexpected '='» and «Expected expression». The raw-text helper is already there:
`collectCommandExprRaw` (`parser.ts:637-653`) bounds the text by token ends, because «a STRING token's `position`
is off by its quotes and a NEWLINE's by one» (`parser.ts:634-635`). Local fix: same bounds in `parseEvalCommand`,
same stop condition as today.

**F4, defect 4 (read and measured).** `collectValueExprRaw` (`parser.ts:1061`) counts a quantifier only for
«`(token.type === 'KEYWORD' || token.type === 'IDENTIFIER') && (token.value === 'forall' || ...`», but `forall`
is in `JJSCRIPT_COMMAND_WORDS` (`reservedIdentifiers.ts:23`) and lexes as COMMAND. So the `in` of its binding
ends the value (measured: `['forall a']`), and with `a, b in` the comma ends it (measured: «Expected '$' before
variable name in let binding»). `exists` is not a command word (grep `-c exists` on that file: 0; control: the
same file holds `forall` at line 23), so it is counted and the `exists` test is green. A second gap: after the
quantifier's `in` the depth is back to 0, so the R-FA-5 comma of `a in S, b in T` would end the value too. Local
fix: count COMMAND `forall` as well, and at a top-level comma keep going when `bindingContinues()`
(`parser.ts:1299-1308`, the R-FA-5 rule the `forall` command already uses) says a binding follows, counting its
`in`. No `let` binding can start that way, since a binding starts with `$`.

**F5, `$x` in eval (read and measured).** JjEL lexes `$name` as DOLLAR_IDENT (`jjel/lexer/lexer.ts:220-225`) and
fails on a lone `$` with «Unexpected '$'» (`:227`). `executeEval` overlays `context.variables` (`eval.ts:34-37`)
and `executeLet` stores `$x` under that key (`let.ts:47`). The token join of F3 makes `$x.size` into `$ x.size`
(the lexer reads `$` as punctuation and `x.size` as one QUALIFIED_NAME). Fixed by F3; the defect-4 tests on
`$x` cover it.

**F6, truncation (measured).** Once the value is collected, `let` already errors on a value JjEL cannot parse:
`evaluateJjel` (`let.ts:123-133`) throws and `executeLet` returns «Let binding error: …». The silent truncation
was the collector's alone (F4), and the run then failed on JjEL's error, not silently. The test `let $x = forall
a in in eval $x` is green before and must stay green after.

## Dependencies and risks

- F1 touches only the call; `Constructors` is not changed. Risk: a parent that is neither `DModel` nor
  `DPackage` (the fallback at `create.ts:302-305` is unrestricted). F2's refusal does not change that, and
  `DPackage` is what the code assumed before the crash.
- F2 turns a success into a refusal. Anything that relied on `create class X in Missing` succeeding was making an
  orphan. The project-wide fallbacks stay as they are.
- F3 changes the text every `eval` hands JjEL. An expression ending in a token the lexer makes before advancing
  (`->`, `::`, an UNKNOWN character) would lose it with the token-end bound; none is JjEL syntax at an end.
- F4 changes `let` values with `forall`. A value that today ends at a `forall`'s `in` was always broken.
- Out of scope and untouched: JjEL, JjTL, the critical zone, the model layer.

## Decisions taken (unattended)

1. All four are local fixes in `frontend/src/jjscript/`; none needs the model layer or an exported type.
2. The lexer is not changed: the raw-text bounds use token ends, as `collectCommandExprRaw` does.
3. F2 refuses for every type with a named, unresolved parent, not only for classes: package and enum went the
   same way.
4. `Info.tsx:384` gets a ticket, not a fix.

## Decisions awaiting Alfonso

None (no RC-26 item).

## Open questions

1. Should `Info.tsx:384` (`DPackage.new` with no `fatherType`) be fixed in its own lane?
