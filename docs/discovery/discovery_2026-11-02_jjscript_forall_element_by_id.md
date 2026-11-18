# Discovery — JjScript: a `forall` body acts on the element, not on its name

- Prompt-ID: P-2026-11-02-2105 (`docs/prompts/claude_2026-11-02_2105_prompt_jjscript_forall_element_by_id.md`)
- Session: bb196272-4ffd-487e-adc9-fef57ed1f136
- Tree: `~/jjodel-w-jjsforallid`, branch `jjscript-forall-by-id`, HEAD `0178acb86`
- Executor: Opus 5.5 (claude-opus-5-5)
- Phase 1, read-only. This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## Objective

Find out how a `forall` body reaches its target, which identity a JjEL element carries, and the narrowest
channel through which the commands' resolver can act on THAT element when several share its name
(ticket «forall rename of same-named elements fails as ambiguous», `docs/log-inbox/maintenance.md:554`).

## Hypotheses under test, with verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The body gets the element's NAME and the command looks it up again, so homonyms give «ambiguous» | **holds** (measured, P3) |
| H2 | Elements reached from JjEL carry an identity the resolver could take | **partly**: M1 instances carry `id`; M2 elements carry none (measured, P1) |
| H3 | The duplicates example reaches the `rename` at M2 | **partly**: only if the two classes differ in shape; identical twins match 0 pairs (measured, P2) |
| H4 | A body naming a member through the variable (`c.attr`) works today | **falsified**: never substituted, `ELEMENT_NOT_FOUND` (measured, P4/P5) |
| H5 | One shared target resolution sits behind every command | **partly**: one for M2 (`resolvers.ts`), a separate string-keyed one for M1 (`instance.ts`) |
| H6 | In the two-order case the filter is evaluated before the loop | **partly**: the filter is on the inner `forall`, re-run per outer element; the outer variable is a snapshot |

## Files read (full paths)

- `frontend/src/jjscript/executor/commands/forall.ts` (whole)
- `frontend/src/jjscript/types.ts` (95-374, 490-549)
- `frontend/src/jjscript/parser/parser.ts` (1196-1305)
- `frontend/src/jjscript/executor/resolvers.ts` (1-760, 876-918)
- `frontend/src/jjscript/executor/executor.ts` (1-450)
- `frontend/src/jjscript/executor/dependencies.ts` (whole), `elementWaiter.ts` (whole)
- `frontend/src/jjscript/executor/commands/rename.ts` (whole), `delete.ts` (25-80), `set.ts` (20-99, 400-421)
- `frontend/src/jjscript/executor/commands/instance.ts` (120-319; call sites at 755, 891, 990 by grep)
- `frontend/src/jjscript/executor/commands/eval.ts` (128-168, 255-594)
- `frontend/src/jjel/evaluator/evaluator.ts` (460-480, 1280-1319)
- `frontend/src/components/editor-v2/preview/PreviewBar.tsx` (40-98), `frontend/src/redux/action/action.ts` (60-179), `frontend/src/redux/reducer/reducer.ts` (1495-1513)
- Tests: `executor/__tests__/forallMultivar.test.ts`, `renameExpression.test.ts` (1-130), `resolvers.test.ts` (1-60), `unsetDefaultLiteral.test.ts` (16-45)

## Probe (measured on `0178acb86`)

Untracked vitest file `frontend/src/jjscript/executor/__tests__/_tmp_forallById.probe.test.ts`, deleted after
the run. Real: parser, `executeForAll`, `executeRename`, `executeDelete`, `resolvers.ts`, `buildEvalContext`,
JjEL. Stubbed: the `joiner` barrel (Proxy stub of `unsetDefaultLiteral.test.ts`), `utils.getProject/getTargetMetamodel`
(a plain-object project: metamodel `MM`, package `p`, classes `Foo`#c1 and `Foo`#c2), `nameUniqueness` (always ok),
the executor (dispatch only). Exit 0, 5 tests; output written to a file because vitest kept console output.

```
[probe P1] shell keys: name,className,isAbstract,isInterface,allowCrossExtend,isFinal,isSingleton,isRootable,isPartial,attributes,references,operations,superTypes,subTypes,instances,allInstances,attributeCount,referenceCount,operationCount,instanceCount,__type
[probe P1] has id: false
[probe P2] result: forall: 2/2 executed successfully ["forall: 0 elements matched — nothing to do","forall: 0 elements matched — nothing to do"]
[probe P2] renames: 0
[probe P3] result: forall: 0 succeeded, 2 failed (2 total) [["AMBIGUOUS_TARGET: Ambiguous 'Foo': MM::Foo, MM::Foo. Qualify as Metamodel::Name."],["AMBIGUOUS_TARGET: Ambiguous 'Foo': MM::Foo, MM::Foo. Qualify as Metamodel::Name."]]
[probe P4] body target: {"segments":["c"],"member":"x","raw":"c.x"}
[probe P4b] body target: {"segments":["Foo","x"],"raw":"Foo::x"}
[probe P5] delete c.x: ["ELEMENT_NOT_FOUND: Element not found: c.x"]
```

P2 = two empty classes `Foo`; P3 = the same with an attribute `x` on c1; P4/P5 = one class `Foo` with attribute `x`.

## Findings

### F1. The substitution is by name (H1, read + measured)

`forall.ts:79-82`:
```ts
const elementName = typeof element === 'string'
    ? element
    : ((element as any)?.name ?? String(element));
const resolvedBody = resolveVariableInBody(args.body, args.variable, elementName);
```
`forall.ts:140` deep-clones the body with `JSON.parse(JSON.stringify(body))`. In a two-variable `forall` the
body of the outer level is the inner `forall` (`parser.ts:1287-1293`), so whatever the outer level writes into
the AST goes through this JSON clone again. **An L proxy written into the AST would not survive it; a string id does.**

### F2. M2 JjEL elements carry no identity; M1 instances carry `id` (H2, read + measured)

`eval.ts:455-489` (`shallowClassToJjelValue`) returns a plain object with `name`, `className`, flags and
collections, no `id` key; the attribute (`eval.ts:496-505`), reference (`514-523`), package (`536-542`) and
enumeration (`554-558`) shells have none either. Measured: P1, `has id: false`, all keys listed (the
listing is the positive control: the same call does read the shell). The M1 instance shell does:
`eval.ts:577-579`:
```ts
const result: any = {
    id: obj.id ?? '',
    __type: 'Object'
};
```
So the identity the prompt asks to confirm is the `id` pointer, **at M1 only**. At M2 nothing in the value a
`forall` iterates identifies the element.

### F3. JjEL `==` is structural, so identical M2 twins are equal (H3, read + measured)

`evaluator.ts:1303-1307`:
```ts
if (isJjelObject(a) && isJjelObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => this.isEqual(a[key], b[key]));
```
Two classes `Foo` with the same shape give equal shells, so `a != b` is false for both orders and the
example matches nothing while reporting success (P2). It reaches the `rename` only when the twins differ in
some shell field (P3), and then refuses both pairs with `AMBIGUOUS_TARGET`. The `forallMultivar.test.ts:31-35`
fixture uses two `A` classes of different shape, which is why it sees two pairs.

### F4. `c.attr` is never substituted (H4, read + measured)

`forall.ts:168-176` handles `raw === variable` and `segments[0] === variable && segments.length > 1`. The
parser gives `delete c.x` as `{"segments":["c"],"member":"x","raw":"c.x"}` (P4): neither branch fires, and the
command resolves the literal name `c` (P5, `ELEMENT_NOT_FOUND: Element not found: c.x`). `c::x` is substituted
(P4b). The prompt's «still works» does not describe today's behaviour.

### F5. Two target resolutions, one per level (H5, read)

- **M2.** `resolveTargetInProject` (`resolvers.ts:540-565`) and `resolveTargetInMetamodel` (`resolvers.ts:355-374`)
  are the entry points; `resolveElement`/`resolveElementInMetamodel` (`:530-534`, `:345-349`) and
  `resolveTypeTarget` (`:905-918`) delegate to them. Callers by grep: `delete.ts:56`, `rename.ts:80`,
  `list.ts:46`, `create.ts:292/305/498`, `set.ts:54/419`, `move.ts:44/57`, `copy.ts:53/66`, `remove.ts:56/69/150`,
  `extends.ts:49/83`, `show.ts:48`, `abstract.ts:49`, `validate.ts:47`, `elementWaiter.ts:137/149`. All candidate
  choices end in `selectTarget(candidates, segmentName, member, kinds)` (`resolvers.ts:237-301`), which already
  applies member resolution, the kind restriction and `memberMissingOn` to a candidate list. A channel at the two
  entry points covers every M2 command.
- **M1.** `resolveInstanceHandle(model: LModel, handle: string)` (`instance.ts:246-261`) takes a STRING; the
  handlers build it as `args.target.segments.join('::') || args.target.raw` at `instance.ts:755` (delete),
  `:891` (rename), `:990` (set), and the permission guard does the same at `executor.ts:384-385`. A name shared
  by two instances is refused there (`instance.ts:259-260`, `describeAmbiguity`). An identity cannot reach this
  resolver without changing those four call sites (or the function's signature).

### F6. Who else reads the target (read)

- `permissionGuard.ts` reads only the `GuardCommand` (`subject` at `:177-179`), built by `describeForGuard`
  (`executor.ts:349-418`); at M2 it resolves nothing (`executor.ts:352`). The M1 subject is the `resolveInstanceHandle`
  of F5, so «allow/deny applies to the element» needs the guard to use the same identity as the handler.
- `effectsPlanner.ts:983` returns `unsupported: forall` (also `:45`); it never sees a substituted body. No change.
- `elementWaiter.ts:137` waits on `resolveElementInMetamodel(dep.name, ...)`; at M2 an ambiguous name is null,
  so today each pair also burns `MAX_WAIT_MS = 500` (`elementWaiter.ts:19`) before the handler refuses. The
  dependency carries the same `QualifiedName` object (`dependencies.ts:69`, `:75`, `:81`), so an identity read at
  the resolver entry ends that wait too.
- `scopeGuard.ts` (bound Jjodie runs) is name-based over the same dependencies; nothing to change for this task.

### F7. What the second order does (H6, read; the store part not measurable here)

The parser puts the filter on the INNER `forall` (`parser.ts:1285-1294`); the outer level has none and
evaluates its collection once (`forall.ts:38`), so `a` is the shell built before the loop. For each `a` the inner
level calls `buildEvalContext` again (`forall.ts:32`) and re-runs the filter over fresh shells, after the bodies
of the earlier `a` have run. For two twins `Foo`#1, `Foo`#2 with identities in the shells:

1. `a`=#1: `b`=#2 passes, `rename` #2 to `Foo_dup`.
2. `a`=#2, still the pre-loop shell named `Foo`: `b`=#1 (fresh, `Foo`) passes again, `rename` #1 to `Foo_dup`.
   This second rename is then decided by `checkM2NameUniqueness` (`rename.ts:139-153`): `NAME_CONFLICT` if the
   first write is visible to it, otherwise both classes end up as `Foo_dup`.

Whether the first write is visible inside one `forall` is not measurable under node: the app keeps a transaction
open and commits on an interval (`reducer.ts:1513`, `setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer)`;
`action.ts:137`, `BEGIN()` after every commit). To be measured in the app on 3001. Per the prompt, no check is added.

## Proposed Phase 2 (not started)

1. `types.ts`: `QualifiedName.elementId?: string` (optional field only).
2. `forall.ts`: when the element is an object with a string `id`, the substituted name also carries `elementId`;
   the `c.attr` form (F4) is substituted too. Strings, numbers and id-less objects keep today's path.
3. `resolvers.ts`: at `resolveTargetInProject` and `resolveTargetInMetamodel`, an `elementId` is looked up by id over
   the same collections the name walk uses, then passed through `selectTarget([found], found.name, member, kinds)`.
   An id that is not found is a miss, never a fallback to the name (that is how a homonym would get acted on).
4. `instance.ts`: one helper that tries `elementId` among `allModelInstances(model)` and falls back to
   `resolveInstanceHandle(model, name)`; used at `:755`, `:891`, `:990`.
5. `executor.ts:384-385`: the guard uses the same helper, so allow/deny is checked on the element the handler writes.
6. **`commands/eval.ts`: the M2 shells need an identity** (F2). Without it steps 1-5 fix M1 and leave M2 as it is.
7. Tests: one new file in `executor/__tests__/`.

That is 7 files including the test file, two of them (`instance.ts`, `eval.ts`) outside the prompt's DOVE list.

## Risks

- An enumerable `id` on the M2 shells changes JjEL-visible values: `c.id` reads a pointer, `eval` output shows it,
  and `==` between two different elements of the same shape turns false (F3), which is what makes the twins
  example work. `buildEvalContext` is also read outside `jjscript/` (`codegen/oracle/oracle.ts:329-340`,
  `codegen/target/js/access.ts`, `codegen/textual/ui/TextualTab.tsx`, `codegen/ui/GeneratorPane.tsx`,
  `codegen/ui/TemplateEditorTab.tsx`, by grep `-l`), so the new key would reach their templates and records too.
- A hidden identity (a `WeakMap` from shell to id, exported by `eval.ts`) leaves JjEL untouched, but identical twins
  still compare equal, so the example would keep matching 0 pairs (F3).
- An element deleted by an earlier body command keeps its id in later iterations; with step 3 that is
  «not found», not a homonym.

## Open questions

1. M2 shells: add an enumerable `id` in `commands/eval.ts` (JjEL- and codegen-visible, fixes the twins case), or a hidden identity (invisible, twins still match nothing)?
2. Approve touching `commands/instance.ts` and `commands/eval.ts`, outside the DOVE list, 7 files in all (Rule 19)?
3. Fix `c.attr` (F4) in this lane, as the prompt's «still works» assumes?
4. Values too (`set p.ref = o` with `o` a forall variable, `set.ts:419`, `instance.ts:1184`), or targets only as written?
