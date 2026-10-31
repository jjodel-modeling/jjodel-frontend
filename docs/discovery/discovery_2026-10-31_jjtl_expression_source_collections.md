# Discovery — JjTL: source collections reached by an expression are unresolved

- Prompt-ID: P-2026-10-31-1340
- Prompt file: `docs/prompts/claude_2026-10-31_1340_prompt_jjtl_expression_source_collections.md`
- Session: c693e9a9-6380-42fe-9872-b5e86cb8edda
- Tree: `~/jjodel-w-jjtlexpr`, branch `jjtl-expr-resolve`, HEAD `1c315f54f`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a definitive reference. Re-read the real files before acting on it.

## Objective

Reproduce the four symptoms of the prompt on an in-memory source, locate the cause of each one with `file:line`,
and choose the smallest fix that stays inside the JjTL executor (and the JjTL parser for point 4, only if `exists`
belongs to the language).

## Hypotheses under test

1. H1: the JjTL forall and a JjEL expression read the same feature through different paths, and only the forall
   dereferences `{ __ref: id }`. **Holds** (F1, F2).
2. H2: the JjEL evaluator, or its value bridge, is what loses the reference. **Falsified**: JjEL reads exactly what
   the executor binds. The binding is the raw wrapper array, and JjEL returns `null` for a missing member when no
   diagnostics channel is open (F3). No change to JjEL is needed.
3. H3: the alias is bound only at rule level, and nested bodies build their context without it. **Holds** (F4).
4. H4: `exists` is not part of the language. **Falsified**: `exists x in S such that P` is a JjEL construct
   (F5). JjTL delegates expressions to JjEL, but only when the parser receives `source`. The forall `such that`
   filter never delegates, and the app never passes `source` (F6).

## Files read (full paths)

- `/Users/alfonso/jjodel-w-jjtlexpr/frontend/src/jjtl/executor/executor.ts` (windows 140-380, 800-900, 1035-1115, 1236-1272, 1370-1510, 1810-2270, 2270-2500, 2525-2755)
- `/Users/alfonso/jjodel-w-jjtlexpr/frontend/src/jjtl/executor/__tests__/contained-sources.test.ts` (whole)
- `/Users/alfonso/jjodel-w-jjtlexpr/frontend/src/jjtl/parser/parser.ts` (windows 130-160, 480-575, 655-735, 785-845)
- `/Users/alfonso/jjodel-w-jjtlexpr/frontend/src/jjtl/hooks/useJjtlParser.ts` (window 50-75)
- `/Users/alfonso/jjodel-w-jjtlexpr/frontend/src/jjel/evaluator/evaluator.ts` (windows 100-140, 440-640, 1225-1250)
- `/Users/alfonso/jjodel-w-jjtlexpr/frontend/src/jjel/evaluator/context.ts` (windows 60-80, 530-585)
- `/Users/alfonso/jjodel-w-jjtlexpr/frontend/src/jjel/parser/parser.ts`, `jjel/types/ast.ts`, `jjel/types/tokens.ts`: grep hits for `exists` only
- `/Users/alfonso/jjodel-w-jjtlexpr/frontend/src/jjtl/SPEC.md`, `/Users/alfonso/jjodel-w-jjtlexpr/docs/jjtl/JJTL-DEVELOPMENT-PLAN.md`: grep hits for `exists` only

## Probe (measured, HEAD 1c315f54f)

`frontend/src/jjtl/executor/__tests__/source-collections-in-expressions.test.ts`, uncommitted seed of the Phase 2
test. The fixture is one `Arbiter` (`requirements: [{__ref:'R1'},{__ref:'R2'},{__ref:'R3'}]`) and three
contained `Requirement`s (`kind` X, Y, X), in the flat shape ProjectEditor produces. Each case runs with the
parser given `source` (JjEL delegation) and without it (the app path). The vitest config swallows `console`, so the
probe appends to `/tmp/probe-1340.txt`.

| Case | without `source` | with `source` |
|------|------------------|---------------|
| P1 `forall p in requirements such that p.kind == "X" -> Reg` | `["r1","r3"]`, no warning | same |
| P2 `size()`, `first().kind`, `map(p => p.kind)`, `filter(...).isNotEmpty()` | `[3, null, [null,null,null], false]`, **no warning** | same |
| P3 `name := a.name + p.name` in a forall body | `[null,null,null]`, 3 × "Cannot access property 'name' of null" | same |
| P4 `forall p in requirements such that exists q in ... -> Reg` | parse error "Expected '->' for object creation in forall" | same |
| P5 `where exists q in ...` / `b := exists q in ...` | parse error "Expected '->'" | parses; the guard evaluates false (point 2), so no `M` is created |

All four points of the prompt reproduce on both parse paths.

## Findings

**F1 (read): the forall dereferences each element.** `executor.ts:1886`
`const collectionValue = this.evaluateExpression(forall.collection, baseCtx);`, then `executor.ts:1900`
`const item = this.derefSourceRef(rawItem);`. `derefSourceRef` (`executor.ts:823-831`) looks the id up in the
source array.

**F2 (read): an expression gets the raw wrapper array.** `createInstanceContext`, `executor.ts:2291`
`bindings[key] = shallowToJjelValue(`, with `key === 'parent' ? this.derefSourceRef(value) : value`: only
`parent` is dereferenced. `requirements` is bound to `[{__ref}, ...]`, so `size()` is right and every member read
on an element misses.

**F3 (read): JjEL returns null in silence for a missing member.** `jjel/evaluator/evaluator.ts:624`
`if (!isBlockedMember(obj, property) && property in obj) {`, else `:638` "When no channel is active, stay silent".
`{__ref:'R1'}` has no `kind`, so `p.kind` is `null` and nothing is reported. Behaviour of JjEL, correct for its
contract. Opening the diagnostics channel for every executor expression would warn on every missing member of every
existing transformation, so it is not the fix.

**F4 (read): the alias is lost below rule level.** It is bound only in `createInstanceContext(sourceInstance, alias)`
(`executor.ts:2305` `bindings[alias] = shallowToJjelValue(sourceInstance);`). `executeForAllMapping`
(`:2090-2095`, `this.runForAll(forall, sourceInstance)`), `runForAll` (`:1883-1885`), `executeObjectCreation`
(`:1991-1993`) and `executeCreationMapping` (call sites `:1480`, `:1686`) build their context without it. The call
sites in `executeAttributeMappings` (`:1389`) and `...WithTrace` (`:1437`) have `alias` in scope and do not pass it.
The let bodies (`executeLetBody`, `executeLetBodyWithTrace`, `:2145`, `:2168`, `:2207`, `:2252`) do not receive it.
Multi-source rules are not affected: their aliases are properties of the synthetic source
(`executor.ts:1171` `syntheticSource[mapping.sources[i].alias!] = combo[i];`), which every nested context rebinds.

**F5 (read): `exists` is JjEL syntax.** `jjel/parser/parser.ts:787`
`exists = EXISTS IDENT IN nullCoalesce ('such that' | '|') expression`; `jjel/types/tokens.ts:120`
`'exists': JjelTokenType.EXISTS`. The JjTL token table has no `EXISTS` (`jjtl/types/tokens.ts`, grep `exist`:
no hit; positive control `FORALL` and `SUCH` found at lines 19 and 21 in the same run). `docs/jjtl/` mentions only an
OCL-style `->exists(s | ...)` in the development plan (`JJTL-DEVELOPMENT-PLAN.md:164`, `:367`), which is not
implemented and is not the JjEL form.

**F6 (read + measured): where JjEL delegation happens.** `where` (`jjtl/parser/parser.ts:141-145`) and `:=`
(`:557-562`) call `parseJjELExpression` only when `this.source !== undefined`. The forall filter never does:
`jjtl/parser/parser.ts:500-502` `if (this.match(TokenType.SUCH)) { ... filter = this.expression(); }`. That is
the legacy parser, which has no `exists`. The app does not pass `source` at all: `jjtl/hooks/useJjtlParser.ts:61`
`const parserResult = parse(lexerResult.tokens);`. It is the only non-test parse call site (grep of `JjtlParser(`
and `parse(tokens` over `frontend/src`, test files excluded). In the app, then, `exists` does not parse **anywhere**
in JjTL (probe P5 without `source`), not only in `such that`.

**F7 (read): `{__ref}` and a plain source object resolve differently, and that matters for the fix.**
`resolveValue` (`executor.ts:2635-2637`) sends a `{__ref}` to `resolveRefById`, which fails open (`null`, `:2707`)
when nothing was traced. A plain object with `className` goes the other way (`:2640-2683`): it passes through when
there is no rule, and it throws "Unresolved reference ..." when a guard filtered it. `runForAll` and the trace
`sourceValue` also go through `fromJjelValue` (`jjel/evaluator/context.ts:555-572`), which copies objects through
`Object.entries`.

## Minimal change, per point

**Point 2.** Dereferencing in place, i.e. binding `requirements` to the source objects, would move
`refs := requirements` from the id path to the className path (F7). That changes fail-open into throw or
pass-through, and makes `fromJjelValue` deep-copy cyclic source graphs. Rejected.

Chosen instead: bind each `{__ref}` to a **resolved handle**, one per id per run, cached. Its only enumerable own
key is `__ref`. Every feature of the source object sits on it as a non-enumerable lazy getter, which lifts nested
`{__ref}` values the same way.
- JjEL's `property in obj` / `obj[property]` see the getters, so `p.kind` resolves.
- `Object.keys`/`entries`, `fromJjelValue`, `JSON` and `'__ref' in v` see exactly the `{__ref: id}` they see
  today. `resolveValue`, `runForAll`'s dereference and the trace therefore stay identical.
- The source instance, `parent`, the alias and the forall variable are bound to a plain-data view: same keys,
  reference values lifted. This happens only when the object holds at least one `{__ref}`, so an L-layer source is
  untouched.
- An id absent from the source model gets a handle that records any member read made during a JjEL evaluation and
  answers `undefined` (so `null`). `evaluateExpression` then pushes one warning naming the rule and the expression.

Everything lives in `executor.ts`.

**Point 3.** Thread the alias as an extra binding from the rule-level call sites into `executeForAllMapping`,
`executeCreationMapping` and the let bodies. `extraBindings` already flows through `runForAll` →
`executeObjectCreation` → nested creations to any depth. Everything lives in `executor.ts`.

**Point 4.** Specified (F5). On the `source` path, make the forall filter delegate to JjEL like `where` and `:=`,
with `->` as boundary. This is not new syntax, so the six-file checklist does not apply. The app path stays
legacy-only until `useJjtlParser` passes `source`, which would switch every app expression to JjEL: a decision for
Alfonso (Q1). The collection form that works on both paths after point 2 is `requirements.any(q => q.kind == "Y")`
(and `.all`, `.none`, `.filter(...).isNotEmpty()`).

## Consumers and risks

- Consumers of the binding change: only JjTL expressions evaluated by `JjtlExecutor` (guards, `:=`, conversions,
  let, forall collection and filter, alert/notify). JjEL, codegen, JjScript and Jjodie do not call
  `createInstanceContext`. No exported type changes.
- Equality: JjEL `isEqual` compares `Object.keys` (`evaluator.ts:1240-1245`). Two handles of the same id are equal,
  as two wrappers were before. A handle compared with a view of the same object is unequal, as a wrapper and the raw
  object were before. No change.
- A passthrough of `self` into a target feature (no rule for the class) now writes the view, not the raw object.
  Same enumerable content. Noted, not expected to be observable.
- The parser change for point 4 alters filter parsing only when `source` is given, which today happens only in
  tests.
- Seven or more JjTL test files do not load in node ("window is not defined"). The suites that would cover the
  executor broadly do not run (known, CLAUDE.md §17).

## Open questions

1. Should `useJjtlParser` pass `source`, so that every JjTL expression in the app (and `exists`) goes through JjEL? It is outside this lane and changes how all app expressions are parsed.
2. Let-bound variables are also invisible inside nested forall/creation bodies (same cause as F4). Fix them in a follow-up lane, or leave them as is?
