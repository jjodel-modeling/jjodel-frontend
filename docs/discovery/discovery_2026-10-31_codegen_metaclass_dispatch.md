# Discovery — codegen: templates dispatched on the metaclass of their first parameter

- Prompt-ID: P-2026-10-31-1410
- Prompt file: `docs/prompts/claude_2026-10-31_1410_prompt_codegen_metaclass_dispatch.md`
- Session: 704b559b-6af7-47ee-8b44-633de67f4373 (unattended)
- Tree: `~/jjodel-w-cgdispatch`, branch `cg-dispatch`, HEAD `1e08c12e8`
- Executor model: Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the
real files. Every claim below is **read** on HEAD `1e08c12e8` unless tagged **measured**.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | Template calls are bound in one place, so dispatch is a change of one function. | **Holds.** `registerTemplates` registers one builtin per name and `call(name, args)` is the only entry (§2.1). |
| H2 | The argument's metaclass and its supertypes are readable from the JjEL value the template receives. | **Holds.** `instanceOf` is the shared class shell, whose `superTypes` are shared shells (§2.2). |
| H3 | Name uniqueness is checked in one place. | **Falsified.** Three: the engine (`registerTemplates`), the template codec (`decodeTemplates`) and the tab's drafts (`draftProblem`), plus every UI key is the name (§2.3). |
| H4 | The generator file format can carry the type without a version bump. | **Partly.** An untyped file is unchanged; a 1.0 reader misreads a typed one (§2.4). |
| H5 | Origins need no change. | **Holds**, with the template label in positions to decide (§2.5). |
| H6 | No R-GEN row conflicts with the prompt's rules. | **Holds** (§3). |

## 2. Findings

### 2.1 Where calls are bound

`frontend/src/codegen/engine/templates.ts:113-116`, the duplicate check keyed by name:

```ts
        if (compiled.has(name)) {
            problems.push({ ...start, message: `Template '${name}' is defined twice: the first definition is used` });
            continue;
        }
```

`templates.ts:168-170`, one builtin per name, bound to `call(name, args)`:

```ts
    for (const [name, { record }] of compiled) {
        root.registerBuiltin(name, createFunction([...record.params], args => call(name, args) as unknown as JjelValue));
    }
```

`templates.ts:146-166`: `call` looks up `compiled.get(name)`, checks the budget and depth, binds `params` to `args`
and evaluates through `host.evaluateBody`. `generate.ts:103` is the only production caller of `registerTemplates` for
a generation; `generatorFile.ts:205` calls it for validation, over an empty `EvaluationContext` (no classes).

Consequence: dispatch is `compiled: Map<name, entry>` becoming `Map<name, entry[]>` and `call` choosing an entry by the
first argument. The builtin stays one per name.

### 2.2 How the argument's metaclass is read

`frontend/src/jjscript/executor/commands/eval.ts:586-588`, a model object handle's `instanceOf` is the shared class shell:

```ts
    try { instType = obj.instanceof?.name ?? null; } catch { /* skip */ }
    const classObj: JjelValue | null = (classByName && instType) ? (classByName.get(instType) ?? null) : null;
    result.instanceOf = classObj;
```

`eval.ts:176-187`, the linking pass: `superTypes` holds the shared shells of the direct supertypes (`(shell as any).superTypes = supers;`
at :186). `eval.ts:460` `isAbstract: cls.isAbstract ?? cls.abstract ?? false`, `:461` `isInterface`. `generate.ts:96`
spreads `globals` into the context, so `globals.classes` (eval.ts:163 `variables['classes'] = classJjelValues;`) is the
class graph available at registration time.

On the D-layer side (the tab, which has no JjEL context): `frontend/src/model/logicWrapper/LModelElement.tsx:2728-2729`
`abstract: boolean = false;` / `interface: boolean = false;`, `:2736` `extends: Pointer<DClass, 0, 'N', LClass> = [];`.
`frontend/src/codegen/ui/templateCompletion.ts:104-119` (`classIdsOf`, not exported) already walks a metamodel's
packages to its DClass ids; `:149` follows `extends` breadth first.

Consequence: run-time dispatch reads `arg.instanceOf.name` and the `superTypes` chain by name; validation reads the same
graph from `globals.classes` in `generate`, and from the D-layer in the tab. A pure graph type `{name, supers, concrete}`
serves both.

### 2.3 Where names are unique, and where the name is a key

1. Engine: `templates.ts:113` (above).
2. Codec: `frontend/src/codegen/engine/templateCodec.ts:87`
   `if (names.has(name)) return defect(\`${name}: the name is taken by an earlier one.\`);`. Every stored list goes through
   it: `genTemplates` directly, other generators through `generatorCodec.ts:188` `decodeTemplates(JSON.stringify({ v: 1, templates: r.templates ?? [] }))`,
   files through `generatorFile.ts:263`.
3. Drafts: `frontend/src/codegen/ui/templateDrafts.ts:96`
   `if (taken.includes(name)) return \`The name ${name} is taken by another template.\`;`, and drafts keyed by name:
   `:61` `return drafts[record.name] ?? draftOf(record);`, `:76`, `:88`, `:109`, `:112`.
4. Tab: `frontend/src/codegen/ui/TemplateEditorTab.tsx:380` `...templates.map(t => ({ key: t.name, record: t, stored: true })),`,
   `:446` `templateToSelect(templates.map(t => t.name), target)`, `:490` `write(templates.filter(t => t.name !== key))`,
   `:611` `current?.key !== target.template`.

Consequence: two templates named `expr` cannot coexist in the tab while the key is the name. A key
`templateKey(r) = r.paramType ? name + ':' + paramType : name` is the name for every untyped template (template names
are JjEL identifiers, `templates.ts:78-81`, so `:` cannot occur in one), which keeps today's keys and drafts unchanged.

### 2.4 The generator file format

`frontend/src/codegen/engine/generatorFile.ts:41-47`:

```ts
export const GENERATOR_FILE_VERSION = '1.0';

/** A `formatVersion` this reader accepts: major version 1, any minor. */
const ACCEPTED_VERSION = /^1(\.\d+)?$/;
...
const TEMPLATE_FIELDS = ['name', 'params', 'mode', 'body', 'target'];
```

`:272`: an unknown template field is only a note. A 1.0 reader given a typed file therefore (a) drops `paramType` with
a note, so a lone typed template is imported untyped, a silent change of meaning, and (b) refuses two templates of one
name through the codec's duplicate defect. That is a misread, so the prompt's condition for 1.1 holds. But the 1.0
reader accepts any `1.x` (`ACCEPTED_VERSION`), so 1.1 marks the file, it does not stop an old reader. To keep the
P-2026-10-30-1430 round trip byte-identical for untyped generators, a document is written `1.1` only when one of its
templates is typed.

### 2.5 Origins

`frontend/src/codegen/engine/origin.ts:75-103`: `TemplateSources` keys its maps by AST node (`WeakMap<object, …>`); the
template string is a label stored in `SourceInfo`. Two templates of one name register distinct ASTs, so positions stay
distinct; only the label is shared. A dispatched call goes through the same `call` and `host.evaluateBody`, so origins of
member reads are unchanged (P-2026-10-31-1341). The label is consumed by the UI's «go to template»
(`generatorTabs.ts:135`, `TemplateEditorTab.tsx:611`) and by error rows (`GeneratorPane.tsx:436`); labelling a typed
template with its key (`expr:Ref`) makes both resolve to the right overload.

### 2.6 New identifiers

`command grep`-free search through the Bash wrapper, from `frontend/src/codegen` and `frontend/src/jjel`:
`grep -n "templateKey\|paramType\|dispatch" -r . ../jjel` returned only `dispatchEvent` and test names in
`printer.bitvector.test.ts` (**measured**, HEAD `1e08c12e8`). The `dispatch` alternative is the positive control of
the same command: it matched, so the search ran; `templateKey` and `paramType` occur nowhere in either tree. A new file
`engine/dispatch.ts` collides with nothing under `engine/` (same search).

## 3. R-GEN rows

R-GEN-12 (record `{name, params, body}`) and R-GEN-25 (`mode` written after `body` only when present) are extended in
their own pattern: `paramType` optional, written after `params` only when present. R-GEN-33 (`root`, `files` name an
entry template): an entry names a template name, which may now be a dispatched name; a call with no argument then
reaches the untyped template or errors. No row requires name uniqueness by itself. No conflict found.

## 4. Dependencies and risks

- Ambiguity and the uncovered-class warning need the metamodel's class graph. `generate` has it (`globals.classes`);
  `validateGenerator` (file import) does not, so it checks duplicates and arity only.
- A type that names no class of the metamodel can never be chosen: an error at registration when the graph is known.
- `TemplateEditor.tsx` (the 3.2 floating panel's editor) writes records with spread; not touched.
- `templateCompletion.ts` infers parameter classes on its own; using `paramType` there is out of scope.

## 5. Open questions

1. Is `name:Type` acceptable as the label shown in error rows and the list (`expr:Ref`), or should the display be `expr(Ref)`?
2. Should the file reader refuse (major 2) rather than mark (1.1) a typed file, so a 1.0 reader cannot import it untyped?
