# Discovery — JjScript `rename ... to <expression>`

- Prompt-ID: P-2026-11-02-2030 (prompt `JjScript: rename ... to <expression>`)
- Session: 7b0fffd8-0f52-483d-b803-8132c19492a0
- Tree: `~/jjodel-w-jjsrenameexpr`, branch `jjscript-rename-expression`, HEAD `e5e60dca4`
- Executor model: Opus 5.5 (claude-opus-5-5)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## Objective

Let `rename` take a JjEL expression after `to`/`as` (rule R-FA-9, provisional), keeping the
single-identifier form literal. Phase 1 measures how the parser reads what follows `to` today,
how a `forall` variable reaches a rename target, and every reader of `RenameArgs.newName`.

## Hypotheses under test

1. H1 — the parser rejects anything after `to` that is not one identifier or one string. **Falsified** (measured, F1): a trailing expression after a string parses and is silently dropped.
2. H2 — inside a `forall`, the rename target is the iterated element itself. **Partly** (read F4, measured F5): the target is replaced by the element's *name*, then resolved by name again.
3. H3 — `RenameArgs.newName` is read outside `frontend/src/jjscript/`. **Falsified** (measured F7): the stop condition does not apply.
4. H4 — the effects preview can state a computed name. **Falsified for now** (read F9): `forall` is `unsupported`, and the planner has no JjEL context.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/parser/parser.ts` (lines 60-265, 480-610, 920-1350)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/commands/rename.ts` (whole, 190 lines)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/commands/forall.ts` (whole, 182 lines)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/commands/let.ts` (whole, 263 lines)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/executor.ts` (lines 130-410)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/effectsPlanner.ts` (lines 30-70, 540-570, 880-1079)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/scriptValidator.ts` (lines 270-340)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/__tests__/forallMultivar.test.ts` (whole)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/__tests__/resolvers.test.ts` (lines 1-63)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/commands/eval.ts` (lines 1-20, 128-168)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/jjscript/executor/commands/help.ts` (grep for `rename`)
- `/Users/alfonso/jjodel-w-jjsrenameexpr/frontend/src/constants/defaultPrompts.ts` (lines 140-150)

## Probe

A temporary vitest file (`executor/__tests__/_tmp_probe_rename.test.ts`, deleted after the run) parsed
eight inputs with the real parser and resolved a target against a two-class fixture with the real
`resolveTargetInProject`. Run on HEAD `e5e60dca4`, exit 0. The worktree had no `node_modules`; a
temporary symlink to `~/jjodel/frontend/node_modules` was created for the gates (P14), and is removed at the end of the lane.

## Findings

**F1 (measured) — a trailing expression after a string is dropped without an error.**
`rename Foo to "A_" + c.name` parses with success and `"newName":"A_"`. The parser reads one token
(`parser.ts:596`: `const newName = this.check('STRING') ? this.advance().value : this.expectIdentifier('new name');`)
and a top-level non-strict parse does not check for trailing input (`parser.ts:97`: `if (opts?.strict) {`).
The example in the header of `forall.ts:7` (`forall c in classes such that c.isAbstract do rename c to "Abstract_" + c.name`)
therefore renames every class to `Abstract_` today: the second one onwards hits a name conflict.

**F2 (measured) — a dotted name and a `$` variable do not parse after `to`.**
`rename Foo to b.name` → `Expected new name, found 'b.name'` (one `QUALIFIED_NAME` token).
`rename Foo to $x` → `Expected new name, found '$'` (`$` is a separate `PUNCTUATION` token, `parser.ts:972`).
So the `$` substitution of `let.ts:172` (`if (renameArgs.newName.startsWith('$') && variables.has(renameArgs.newName)) {`)
is unreachable for `rename` today.

**F3 (measured) — commands in a one-line block follow each other with no separator.**
`do rename Foo to "x" set A.b = 1 end` parses into a block of two commands. `parseBlockBody`
(`parser.ts:1063-1100`) separates on newlines and `;`, and otherwise relies on each command parser
stopping by itself. An expression collector must therefore stop at a command word as well, or the
one-line form `do rename Foo to x set A.b = 1 end` changes AST. `do\nrename Foo to "x" + c.name\nset A.b = 1\nend`
fails today with `Unexpected '+' in do block`.

**F4 (read) — the `forall` variable reaches the rename as a name, not as an element.**
`forall.ts:79-82`: `const elementName = typeof element === 'string' ? element : ((element as any)?.name ?? String(element));`
`const resolvedBody = resolveVariableInBody(args.body, args.variable, elementName);`. `replaceVariableRefs`
(`forall.ts:157-181`) rewrites only QualifiedName-shaped objects (`'raw' in val && 'segments' in val`):
a string field such as `newName` (or a new `newNameExpr`) is never rewritten. The element itself is
put in `childContext.variables` (`forall.ts:89`: `childContext.variables.set(args.variable, element);`),
so an expression evaluated over `buildEvalContext(context)` plus `context.variables` sees it, exactly as
`let.ts:123-133` does.

**F5 (measured) — two classes with the same name make the rename target ambiguous.**
With two classes named `A` in one metamodel, `resolveTargetInProject(parseQualifiedName('A'), prj, ['class'])`
returns `element=undefined ambiguousWith=["A","A"]`. `rename.ts:86-96` turns that into
`AMBIGUOUS_TARGET`. Consequence: the prompt's second example
(`forall a, b in classes such that a != b and a.name == b.name do rename b to b.name + "_dup"`) fails
at M2 on every pair whose names collide in the same namespace, whatever the new name, because the
target is re-resolved by the name it shares. Fixing that means substituting by id in `forall.ts`,
outside the scope of this lane (question 1).

**F6 (read) — the name rule applied today.** `rename.ts:35-36`: `const instanceRename = args.elementType === 'instance' || context.level === 'M1';`
`if (!instanceRename && !isValidIdentifier(newName)) {` → `INVALID_NAME`. At M1 the only check is
non-empty, in `executeRenameInstance` (`instance.ts`, per the comment at `rename.ts:33-34`).

**F7 (measured) — readers of `newName`.** Search `command grep -rl 'RenameArgs' --include='*.ts' --include='*.tsx' .`
from `frontend/src`: 9 files under `jjscript/` (positive control), 0 outside. `newName` counts in
`permissionGuard.ts`, `runPasses.ts`, `executor.ts`: 0 each; `effectsPlanner.ts`: 10 (positive control,
same command). Readers inside `jjscript/` that matter:
- `scriptValidator.ts:315` `return [...allNames(args.target), args.newName];` — names whose existence is unknowable; any string is harmless.
- `let.ts:172` — the `$` substitution (unreachable, F2).
- `effectsPlanner.ts:554-568` (`planRename`, M1) and `:886-895` (`planM2Rename`) — plan the rename to `args.newName`.
- `rename.ts:30` and `executeRenameInstance(args, …)` (`rename.ts:62`).
`executor.ts:375` (`describeForGuard`) reads `args.target` only, never `newName`.

**F8 (read) — `defaultPrompts.ts:147` teaches a form the parser does not support.**
`rename attribute oldAttr to newAttr in ClassName`: the `in` clause is parsed only before `to`
(`parser.ts:579`). Today the trailing `in ClassName` is ignored at top level (F1 mechanism) and the
attribute is resolved project-wide. Under R-FA-9 as written, `newAttr in ClassName` would become an
expression and fail. To keep that behaviour, a single identifier or string followed by `in` stays the
literal form (deviation from R-FA-9, question 2).

**F9 (read) — the effects preview.** `effectsPlanner.ts:45`: `Declared limits: \`let\`, \`forall\`, blocks, \`move\`, \`copy\` and an M2 \`remove\` are \`unsupported\``,
and `UNSUPPORTED` is a warning code (`effectsPlanner.ts:246`). Inside a `forall` the rename is never
planned. Outside one, the planner reads `PlanWorld`, not the JjEL eval context the executor builds
(`buildEvalContext`), so a computed name is not known statically in general. The plan: a
`rename ... to <expression>` line is `UNSUPPORTED` with a message naming the expression.

## Dependencies and risks

- Executor modules (`rename.ts`, `eval.ts`, `instance.ts`) do not import under `environment: 'node'`
  (`joiner` → monaco); tests mock them the way `forallMultivar.test.ts` does.
- The expression collector's stop set (newline, `;`, EOF, `end` inside a block, a command word at depth 0)
  is wider than `collectExprRawUntil`'s; a JjEL word that lexes as a command word at depth 0 would cut the
  expression. Parenthesise it.
- A single identifier followed by junk (`rename Foo to Bar please`) used to rename to `Bar`; it becomes an
  expression and fails. Same for F1: `"A_" + c.name` now evaluates instead of being dropped.

## Open questions

1. F5: should the `forall` target be substituted by element id, so same-named elements can be renamed? (out of scope here)
2. F8: keep a literal single name followed by `in` as today (trailing clause ignored), or make the postfix `in` a real container clause?
3. F2: `rename Foo to $x` now parses as an expression and reads the `let` binding; is that the intended way to use a `let` value?
