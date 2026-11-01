# Discovery — a declarative model of the textual notation, a textual viewpoint (R-TXT-14)

- Prompt-ID: P-2026-11-01-2017 (chat C-2026-11-01-1713)
- Prompt file: `docs/prompts/claude_2026-11-01_2017_prompt_textual_viewpoint_discovery.md`
- Session: e1203295-a99f-45f4-9fdc-8209040a63c8 (unattended)
- Tree: `~/jjodel-w-textviewpoint`, branch `textual-viewpoint-discovery`, HEAD `c9fc15f84`
- Executor model: Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the files.
Every claim is **read** (the file at HEAD `c9fc15f84`, or a document) unless tagged **measured** (a search run in this
session, with the command and a positive control). Nothing was run in the app: the question is one of design, and
the behaviour of the reference generator was measured by P-2026-11-01-1946.

## Goal

Say what the declarative description of a textual notation should be in Jjodel (R-TXT-14): where it lives, what it
has to express, what in it is data and what would need JjEL, and how a printer, an EBNF and later a parser are derived
from it. A proposal to discuss, no code.

## Hypotheses under test

| # | Hypothesis (from the prompt) | Verdict |
|---|---|---|
| H1 | A viewpoint is the natural home of a textual notation | **Partly.** Conceptually yes: a textual notation is a concrete syntax, which is what a viewpoint is (R-DMV-2). As a stored object, no: a `DViewPoint` is project-scoped and bound to no metamodel, and is a `DViewElement` that the canvas dispatch reads (§1.1). The metamodel's `_state` holds it with no new kind of object, as it holds the generators (§1.2). |
| H2 | A textual viewpoint is a generator, a viewpoint, or both | **Both, in this sense:** a notation record on the metamodel (data), interpreted by a built-in printer exposed as one more generator, and later by a parser. Not a `GeneratorRecord`: a parser reads it too (§1.2). |
| H3 | The defaults R-TXT-1..12 and the prototype's overrides can be expressed as data | **Holds for all four overrides the prompt names**, including the RISC-V grouping, because the classifier is a finite function of an enumeration literal, so a table (§1.3). JjEL is needed only where the classifier or a default is not finite; its cost depends on whether the expression's output is redundant in the text or the only place a value appears. |
| H4 | A parser can be derived with no new dependency | **Holds.** The three language parsers of the repo are hand-written recursive descent; a generic interpreter of the derived grammar fits that practice. Side finding: `nearley` and `ohm-js` are **already** dependencies, used by a legacy text-to-model feature whose tab is no longer mounted (§1.4). |

## Files read

- `frontend/src/view/viewPoint/viewpoint.ts` 1-153 (`ViewpointType` `:14`, `DViewPoint` `:114-137`)
- `frontend/src/view/viewElement/view.tsx` 194-395 (`DViewElement` fields)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` 1-170, 326-385, 538-593, 856-881 (types listed through `grep -n '^export (interface|type) '`, all lines)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` 1-80, 310-333 (by grep)
- `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` 1-60; `derive/notations.ts` 40-129
- `frontend/src/codegen/engine/generatorCodec.ts` 1-66 (and its export list); `codegen/engine/templates.ts` 160-232;
  `codegen/engine/dispatch.ts` (export lines `:55`, `:83`); `codegen/setting.ts` (export lines); `codegen/ui/generatorTabs.ts` 1-10;
  `codegen/ui/GeneratorsSection.tsx` (header, `:47-65`); `components/project/ProjectEditor.tsx:70`, `:2907`
- `frontend/public/examples/codegen/default-text.generator.json` (template names and modes, `grep`)
- `frontend/src/jjel/parser/parser.ts` 1-25, export lines `:79`, `:1021-1077`; `frontend/src/jjtl/parser/parser.ts` 1-30, `:54`, `:1632`;
  `frontend/src/jjscript/parser/` (file list, the four headers); line counts of the three lexers and parsers
- `frontend/package.json:48-49`; `frontend/src/DSL/DSL.ts` (whole); `DSL/ohm.ts` 1-60; `DSL/nearley/nearley.tsx` 1-40
- `frontend/src/components/forEndUser/MTM.tsx` 1-175; `frontend/src/common/DV.tsx` 36-120 and the `new Language` lines;
  `frontend/src/joiner/classes.ts` 700-707, 4225-4262, 4405-4422; `frontend/src/components/abstract/Dock.tsx` 300-359
- `frontend/src/components/editor-v2/preview/PreviewBar.tsx` 40-79
- `docs/discovery/discovery_2026-11-01_default_textual_notation.md` 1-66, 217-316 (P-2026-11-01-1709)
- `docs/discovery/discovery_2026-10-23_codegen_generator_viewpoint.md` 8-29, 120-211
- `docs/decisions.md` 6060-6066, 6160-6181, 6200-6229, 6370-6524, 6930-6985 (R-GEN-10, R-GEN-31..43, R-LIB, R-TXT-1..14)
- `docs/library/catalog.json` (the `$comment`, the tier counts)
- `~/Downloads/micron-proto/` (read-only, nothing copied): `README.md` (not read past the listing), `metamodels/CoreSpec.ecore`
  and `ArbiterSpec.ecore` (whole), `docs/brief-text.md` (whole)

## 1. Findings

### 1.1 What a viewpoint is today, what «Derive viewpoint» derives, what the library stores (prompt 1.1)

**A viewpoint is a view element with no data of its own.** `viewpoint.ts:115` `export class DViewPoint extends
DViewElement`, and the class body redeclares only `id` and `name` (`:119-120`). Every viewpoint-level field lives on
`DViewElement`, with the reason given in place, `view.tsx:236-241`: «`DViewPoint` carries no own data field at all
(it redeclares `id` and `name` and nothing else), and every viewpoint-only field in this graph lives on
`DViewElement`». Its kind is `viewpointType`, `viewpoint.ts:14` `export type ViewpointType = 'syntax' | 'decoration'
| 'validation' | 'semantics' | 'editor_behavior' | 'dataManager';`.

**A view applies to a metaclass in two layers.** The classic layer: `view.tsx:324` `appliableToClasses!: string[];
// class names`, `:327-328` `oclCondition`, `jsCondition`, `:333` `explicitApplicationPriority`. The IR layer (EditorV2):
`view.tsx:303` `ir?: GObject;`, whose kinds are `irTypes.ts:880-881` `export type NodeViewIR = VertexViewIR |
GraphVertexViewIR; export type AnyViewIR = NodeViewIR | EdgeViewIR | RowViewIR;`, each with `metaclasses: string[] |
'*'` (`:549`), `predicate?: Predicate`, `priority?: number`. The resolver ranks the candidates
`irResolveCore.ts:68-69` `(b.entry.compiled.priority - a.entry.compiled.priority) || (b.specificity -
a.specificity)`, specificity 2 for an exact match, 1 inherited, 0 wildcard (`:326-333`). This is the same «most
specific class wins» rule the generator dispatch applies (`templates.ts:192` `mostSpecific(meta.graph, meta.name,
...)`), on a different code path.

**The IR already has a one-line text template.** `irTypes.ts:858-869` `export interface RowViewIR { ... kind: 'row';
metaclasses: string[] | '*'; ... template: TextSource[];`, with `:96-99` `TextSource = { from: 'path'; expr } | {
from: 'literal'; text } | { from: 'intrinsic'; prop: 'name' | 'metaclassName' | 'qualifiedName' }`. It is the
closest existing analogue of a textual rule (literal keywords and value holes, per metaclass), but it renders a row
inside a node on the canvas; it has no notion of nesting, of a containment block or of a list. And the IR's
`Predicate` / `Conditional<T>` (`irTypes.ts:24-62`) are plain data: `{ op: 'eq', left, right }`, `{ when, then, else
}`, `{ rules: [{ when, then }], default }`. They are the shape §2 reuses for conditions.

**Viewpoints are bound to no metamodel.** Read in the 2026-10-23 report, `discovery_2026-10-23_codegen_generator_viewpoint.md:133-139`:
«Viewpoints belong to the project ... No field or resolver ties a viewpoint to a metamodel», with the search it ran.
Not re-measured here.

**«Derive viewpoint» derives IR documents, one per concrete metaclass, from the structure.**
`viewpointDerivation.ts:1-9` «a viewpoint derived from a metamodel, as IR documents ... One document per concrete
metaclass, filled deterministically from the structure and, when a simulation role binding is given, from the
roles». The notations it knows are a closed list, `notations.ts:47` `export type DerivedNotationId = 'generic' |
'stateMachine' | 'statechart' | 'petri' | 'petriClassic' | 'flowchart' | 'flowchartIso' | 'activityUml' | 'erChen';`.
The derived viewpoint records its origin in the viewpoint's `_state` (`notations.ts:117-123`, `derivedFrom`,
`derivedNotation`, `derivedRole_<classId>`) and on each view `ir.generated` (`irTypes.ts:538-543`, `by`, `notation`,
`role`, `hash`). The point for this report: «derive» already means *a total default computed from the metamodel,
written as data that the user may then edit*, which is what R-TXT-14 asks of the textual default.

**The notation library stores projects, not notations.** `docs/library/catalog.json` `$comment`: «kind:
sealedNotation (case 1 ...) or galleryProject (case 2 ...)», each entry pointing to a `.jjodel` file under
`frontend/public`; today 5 `template` and 2 `example` entries (measured: `grep -o '"tier": *"[a-z]*"' | sort | uniq
-c`). A sealed notation (R-LIB-2, `decisions.md:6381-6385`) is «a sealed copy whose components are present but
hidden»: whatever a metamodel carries travels inside it. So the library needs no new place for a textual notation,
provided the notation travels with the metamodel.

**Which of these could hold a textual notation without a new kind of object.**

| Container | New kind of object? | Cost |
|---|---|---|
| The metamodel's `_state` (as generators, R-GEN-31) | **no** | none in the core; bound to the metamodel for free; travels in the project file and in a sealed copy; lost by the `.ecore` export, which drops `_state` (2026-10-23 report `:185`, citing `templateCodec.ts:23`) |
| A `DViewPoint` with `viewpointType: 'text'` and one `DViewElement` per class with a new `ir.kind` | no new class, but a new value of an exported union and a new IR kind | IR schema literals are permanent (R-B9, `irTypes.ts:359`); `viewpoint/ir/` is critical zone (CLAUDE.md §3.1); bound to no metamodel; a viewpoint with views enters the canvas dispatch and must be excluded by hand at six or more listing sites (2026-10-23 report `:143-149`, `:179-185`) |
| The library catalog | n/a | stores packaging only |
| A `GeneratorRecord` | no | conflates two things: a parser reads the notation too, and a generator is code (templates) |

### 1.2 Where generators live, and what a textual viewpoint would be (prompt 1.2)

**Generators are records of the metamodel's `_state`.** `generatorCodec.ts:5-9` «A generator is a record of the
metamodel's `_state`, not a viewpoint nor a D-type (R-GEN-31). The template list of the default generator is
`genTemplates`, unmoved ... Every other generator, and the default's metadata, live in one key `genGenerators`, a
JSON string `{"v":1,"generators":[generator...]}`». The decoded shape, `:56-64`, is `id`, `name`, `root?`, `files`,
`target` (`'js' | 'none'`, `:47`) and `templates`. Decoding is tolerant, one defect per bad record (`:20-25`); a Save
writes one `set_state`, one undo step (`:27`).

**One dock tab per generator, and a GENERATORS section.** `generatorTabs.ts:5-6` «`codegen_tpl_<metamodelId>` for
the default ... `codegen_tpl_<metamodelId>_<generatorId>` for the others». The section is
`GeneratorsSection.tsx:2` «the GENERATORS section of the project dashboard», loaded lazily by
`ProjectEditor.tsx:70` `const GeneratorsSection = React.lazy(() => import('../../codegen/ui/GeneratorsSection'));`
(R-GEN-42, R-GEN-2: the eager code reads only `codegen/setting.ts`).

**The reference implementation is 16 templates over the dispatch.** `default-text.generator.json`: `main`, `obj`,
`objDefault`, `block`, `head`, `feature`, `kw`, `attribute`, `contained`, `reference`, `value`, `ref`, `path`,
`segment`, `nm`, `str` (measured: `grep -n '"name"'`). Overrides go through the metaclass dispatch of
`templates.ts:183-197`: a typed template `obj:Requester(o)` beats the untyped one. The 1709 report states why an
override's grammar cannot be derived (`discovery_2026-11-01_default_textual_notation.md:274-275`): «An override's
grammar cannot be derived from its JjEL body; an override has to declare its production, or the EBNF covers the
default only».

**What a textual viewpoint would be.** Neither a viewpoint object nor a generator record, but both roles over one
piece of data:

- **the notation**: a record in the metamodel's `_state`, beside `genTemplates` and `genGenerators`, with the same
  codec discipline (§2.1). In the product it is called a textual viewpoint (it is concrete syntax), and it appears in
  the left bar under its metamodel;
- **the printer**: a built-in generator, listed in GENERATORS like the others, whose body is not templates but the
  interpreter of the notation (§2.4); the JjGen generator of P-2026-11-01-1946 stays as its oracle;
- **the grammar and, later, the parser**: two more interpreters of the same record (§2.5, §2.6).

### 1.3 What a notation model must express (prompt 1.3)

The defaults of R-TXT-1..12 (`decisions.md:6941-6984`) split in two: those that are **semantics of the engine**,
the same for every notation, and those that are **parameters**, which a notation may change.

| Rule | Engine or parameter | In the notation model |
|---|---|---|
| R-TXT-1, R-TXT-12 feature order | engine (the default order) | a class rule may list features to reorder them |
| R-TXT-2 strings quoted, ints decimal, booleans, literals | engine, with a value converter per feature | `string: quoted \| name` (the arbiter's `for cpu` prints an `EString` as a name, §2.3) |
| R-TXT-3 names and literals as declared | parameter | `style.classKeyword`, `style.literalCase`: `asDeclared \| lower` |
| R-TXT-4, R-TXT-11 references by unique name or path | engine | nothing (no scoping language) |
| R-TXT-5 unset not printed | parameter, per feature | `omit: unset \| never \| default \| { equals: literal }` |
| R-TXT-6, R-TXT-13 origins of index reads | JjEL, irrelevant to a printer in TypeScript, which knows each value's origin | nothing |
| R-TXT-7 a JjGen generator first | superseded as the mechanism by R-TXT-14 | the generator stays as the oracle |
| R-TXT-8 overrides by metaclass dispatch | engine: the most specific class rule wins | `rules[].class` |
| R-TXT-9 contextual keywords | grammar and parser semantics | nothing |
| R-TXT-10 Ecore import loses defaults | a ticket | the reason `omit` has an `equals` form |

The overrides of the prototype (`~/Downloads/micron-proto/docs/brief-text.md:44-77`, rules C1-C4 and A1-A2), one by
one:

| Override (prompt's words) | Prototype rule | Pure data? | How |
|---|---|---|---|
| a keyword renamed, `registers` for `nregs` | C1 | **yes** | `features[].keyword` |
| a containment printed one line per object, `requester cpu priority 0` | A1 | **yes** | `rules[].form: line` on the child's class, `features[].wrapper: false` on the container's feature |
| a list grouped by a classification computed from the data, instructions by RISC-V section | C3 | **yes**, because the classifier is a function of one enumeration literal (`Instruction.mnemonic : Mnemonic`, 32 literals, `CoreSpec.ecore`), so it is a finite table, literal → group, whose order is the table's | `features[].group: { by, element: value, groups: [{ label, members }] }` |
| a value omitted when it equals a default | (C2 says the opposite for `xlen`, `nregs`: always printed) | **yes** | `omit: default` reads the declared default; `omit: { equals: 32 }` when the import has lost it (R-TXT-10) |
| beyond the prompt: a name printed only when it is not the default name, `as ⟨name⟩` | C4, A2 | **yes**, with a pattern string over feature holes, `{kind\|lower}` or `{kind\|lower}_{requester}` | `rules[].name: { show: unlessPattern, pattern, keyword: as }` |
| beyond the prompt: a different sequence for one kind, `require bounded_wait for cpu within 3` | A2 | **yes**, with a condition in the IR's `Predicate` shape (data, not JjEL) | `rules[].syntax` as a `Conditional` of item lists |
| beyond the prompt: `// listed twice: add` | C3 | **yes**, as a closed option | `group.duplicates: comment` |

**Where JjEL would be needed, and its cost.** An expression inside the notation is needed only when the thing to
compute is not finite or not a pattern: a group computed from an integer range or a string prefix, a default name
that is not a concatenation of feature values, a derived comment that is not a closed option (a count, a summary).
What it costs for the grammar depends on the **position** of its output in the text:

- **Redundant position**: the output is determined by other content the text also carries. The group label of C3
  (the mnemonic determines the group), the omitted default name of C4, a comment. The grammar shows a token class
  (`ID`) where the expression prints; the parser accepts it, builds the model from the carrying content, re-evaluates
  the expression on the result and refuses the text if the two disagree. Cost: a check after the parse, no change to
  the grammar. This is exactly what the prototype does by hand for the groups, `brief-text.md:105-107` «the grammar
  admits any mnemonic in any group, the printer never writes it elsewhere, and a parser would refuse it (a check,
  not a production, to keep the grammar short)». With the table form of §2.3 the check even becomes a production.
- **Carrying position**: the expression's output is the only place a model value appears. The grammar can show only
  a token class, and the parser cannot recover the value without an inverse. Cost: the notation is printable but not
  parsable, unless it declares the inverse as a second expression, which then needs a round-trip test of its own.

Recommended: notation v1 holds **no JjEL at all**; every override above is data. A later `derived` item may carry an
expression in a redundant position only, refused in a carrying one by the notation check (§2.5).

### 1.4 Parsing: what exists, what a derived parser needs (prompt 1.4)

**The three language parsers are hand-written.** `jjel/parser/parser.ts:1-3` «JjEL Parser / Recursive descent
parser for Jjodel Expression Language», `JjelParser` at `:79`, entry points `:1021-1077` (`parse`,
`parseExpression`, `parseExpressionStrict`, `parseTemplate`), over a hand-written lexer (`jjel/lexer/lexer.ts`, 740
lines). `jjtl/parser/parser.ts:1-6` «JjTL Parser / Converts tokens into AST / JjTL uses JjEL for expressions. This
parser implements the full JjEL expression grammar with proper operator precedence», `JjtlParser` at `:54`, 1635
lines, lexer 394 lines. JjScript has its own `parser/lexer.ts`, `parser.ts`, `grammar.ts` («Helper functions for
parsing qualified names, multiplicities, types») and a `recovery/` module. No generated parser among them.

**Two parser generators are already dependencies.** `frontend/package.json:48-49` `"nearley": "^2.20.1",` `"ohm-js":
"^17.5.0",`. Consumers (measured: `command grep -rln -E "from ['\"](nearley|ohm-js)['\"]|require\(['\"](nearley|ohm-js)" src scripts`,
four files; positive control: the same search lists `src/joiner/classes.ts`, which `classes.ts:141` confirms):
`joiner/classes.ts` (types), `DSL/ohm.ts`, `DSL/flexmiohmtest.ts`, `DSL/nearley/nearley.tsx`. They serve a **legacy
text-to-model feature**: `DState.languages` (`classes.ts:705` `thiss.languages = windoww.DV.defaultLanguages();`), a
dictionary of `Language` objects each with an `m2t` and a `t2m` per engine (`classes.ts:4236-4243`), defaults in
`DV.tsx:51-421` (`JSON`, `Emfatic`, `flexmi/YAML`, `flexmi/XMI` parsed with ohm at `DV.tsx:398`, `eCore/JSON`,
`eCore/XMI`, `testLanguage`). `parseT2M` (`forEndUser/MTM.tsx:35`) dispatches on the engine: ohm (`:91-116`, the
semantics as a string through `eval`, `:98`), nearley (`:117-135`, a grammar compiled at run time through
`nearley/lib/compile`, imported under `@ts-ignore`, `nearley.tsx:6-11`), JavaScript (`:137-175`). These are
project-global, not per metamodel, and code, not data: the approach R-TXT-14 sets aside. Their editor tab is no
longer mounted: `Dock.tsx:309` builds `const mtm = {... <MTM/> ...}`, and `Dock.tsx:347-354` «the right dock child
(editors group — Properties, Node, Console, MTM, Logger) is no longer built ... the editors tabs consts above are
still left in place (orphaned)»; `grep -n '\bmtm\b' Dock.tsx` returns only line 309 (measured; the hit itself is the
control). Not investigated further: whether any other path still calls `parseT2M`.

**A model write path exists for a parse result.** `PreviewBar.tsx:60` `export async function applyAsOneStep(preview:
Pick<ScriptPreview, 'script' | 'modelId' | 'world'>)`: JjScript lines run as one undo step (`:61-69`, `beginUndoGroup`,
settle, `endUndoGroup`), the route R-PLG-11 also names (`decisions.md:6929-6930`). Whether JjScript covers every M1
write a parsed text needs (create an object of a class, set a reference by target) was not checked.

**What a derived parser needs, with no new dependency.**

1. A tokenizer fixed for every notation: `ID`, `STRING`, `INT`, `true`/`false`, the punctuation of the style
   (`{ } [ ] ,`), the path tokens of R-TXT-11 (`[k]`, `.`), line comments. Keywords are not tokens: under R-TXT-9 a
   keyword is an `ID` matched by its text where the grammar expects it, which a grammar interpreter does naturally
   and a lexer-first generator does not.
2. A grammar interpreter, recursive descent over the derived productions (§2.5), choosing an alternative on its first
   token; the notation check guarantees the choice is deterministic (LL(1)), so no backtracking.
3. Reference resolution in a second pass, inverse of R-TXT-4: a name among the instances of the reference's type, or
   a containment path.
4. A model builder: the tree to JjScript lines, shown in a preview, applied through `applyAsOneStep`.
5. Identity: re-parsing a whole text creates new objects, so ids, layout and references from other models would be
   lost on every edit. A text that edits an existing model needs a matching step (parsed object ↔ existing object, by
   containment path and name) that turns the parse into a diff. This is the hardest part and is not needed for «new
   model from text».

The repo's practice (three hand-written parsers) and the contextual keywords both point to an interpreter of our
own. `ohm-js` is a possible alternative (PEG, readable errors, already in the main bundle through `DV.tsx:30`), but
it would mean generating an ohm grammar string and binding semantics, on top of a module that today evaluates code
strings.

## 2. Proposal (to discuss, not to implement)

### 2.1 Where it lives

A key `txtNotation` on the metamodel's `_state` (provisional name), a JSON string `{"v":1, ...}`, with the codec
discipline of `generatorCodec.ts`: pure module, tolerant decoding with one defect per bad rule, one `set_state` per
Save, nothing written until the user changes something. **An absent key is the R-TXT default**: every metamodel has a
textual viewpoint from the start, with no data stored. Whether a metamodel may hold several notations (a list, as
generators) is question 2.

### 2.2 The notation metamodel

Described as a Jjodel metamodel; stored as JSON, keys as the feature names below.

| Class | Feature | Type | Meaning |
|---|---|---|---|
| **TextNotation** | `v` | EInt = 1 | format version |
| | `style` | Style [0..1] | absent = the R-TXT style |
| | `rules` | ClassRule [*] | absent = no override |
| **Style** | `classKeyword` | Case = `asDeclared` | R-TXT-3 |
| | `literalCase` | Case = `asDeclared` | R-TXT-3 |
| | `indent` | EInt = 2 | |
| | `lineComment` | EString = `//` | |
| **Case** (enum) | | `asDeclared`, `lower` | a bijection, checked on the metamodel (§2.5) |
| **ClassRule** | `class` | EString | the metaclass name (plus its id, as `authoringMetaclassPins` do, for homonyms) |
| | `keyword` | EString [0..1] | absent = the class name in `style.classKeyword` |
| | `form` | Form = `block` | `block`: `kw name { features }`; `line`: `kw name features` on one line |
| | `name` | NameRule [0..1] | absent = the name after the keyword, if the object has one |
| | `features` | FeatureRule [*] | per-feature overrides; a listed order reorders, the others follow R-TXT-1 |
| | `syntax` | Conditional\<Item[]\> [0..1] | replaces the feature part wholesale (the escape level) |
| **NameRule** | `show` | `always` \| `unlessPattern` | |
| | `pattern` | Conditional\<EString\> [0..1] | holes `{f}`, `{f\|lower}` |
| | `keyword` | EString [0..1] | `as` |
| | `at` | `head` \| `end` | where the name goes |
| **FeatureRule** | `feature` | EString | the feature name |
| | `keyword` | EString [0..1] | the rename; absent = the feature name |
| | `omit` | `unset` \| `never` \| `default` \| `{equals: Literal}` | R-TXT-5 by default |
| | `string` | `quoted` \| `name` | value converter for an `EString` |
| | `case` | Case [0..1] | for an enumeration-typed feature, over `style.literalCase` |
| | `wrapper` | EBoolean = true | containment: `r { ... }`, or the children directly |
| | `group` | Grouping [0..1] | containment only |
| **Grouping** | `by` | EString | an enumeration attribute of the child |
| | `element` | `value` \| `object` | print the child as its `by` value only, or whole |
| | `groups` | Group [*] | `label`, `members` (literals, in print order) |
| | `duplicates` | `comment` \| `silent` | |
| **Item** (one of) | `{keyword: s}` \| `{slot: f}` \| `{optional: Item[], when: Predicate}` | | `Predicate` and `Conditional` are the IR's shapes (`irTypes.ts:24-62`), over feature names |

What is deliberately not in it: scoping (R-TXT-4 is fixed), expressions (§1.3), arbitrary punctuation, a rule that
depends on the container (the same class printed differently in two features; question 9).

### 2.3 The default and the two prototype notations, expressed in it

**The R-TXT default**: `{"v":1}`, or no key at all. Style `asDeclared`, no rules: the printer applies R-TXT-1..12 as
the JjGen generator does today.

**CoreSpec** (C1-C4 of `brief-text.md:44-67`):

```json
{ "v": 1,
  "style": { "classKeyword": "lower", "literalCase": "lower" },
  "rules": [
    { "class": "Core", "features": [
        { "feature": "xlen", "omit": "never" },
        { "feature": "nregs", "keyword": "registers", "omit": "never" },
        { "feature": "instructions", "group": { "by": "mnemonic", "element": "value", "duplicates": "comment",
            "groups": [
              { "label": "reg_reg",    "members": ["ADD","SUB","AND","OR","XOR","SLT","SLTU","SLL","SRL","SRA"] },
              { "label": "reg_imm",    "members": ["ADDI","ANDI","ORI","XORI","SLTI","SLTIU","SLLI","SRLI","SRAI","LUI","AUIPC"] },
              { "label": "control",    "members": ["JAL","JALR","BEQ","BNE","BLT","BGE","BLTU","BGEU"] },
              { "label": "load_store", "members": ["LW","SW"] },
              { "label": "ordering",   "members": ["FENCE"] } ] } },
        { "feature": "requirements", "wrapper": false } ] },
    { "class": "Requirement", "keyword": "require", "form": "line",
      "syntax": [ { "slot": "kind" } ],
      "name": { "show": "unlessPattern", "pattern": "{kind|lower}", "keyword": "as", "at": "end" } } ] }
```

It prints `core core_mc4 {`, `xlen 4`, `registers 4`, `microarch multicycle`, `instructions {` with one line per
non-empty group (`reg_reg add sub and or xor`), `}`, then `require isa_conformance` lines, `}`: the shape of
`brief-text.md:84-93`. Not printed and compared: that is step S3 of §2.7.

**ArbiterSpec** (A1-A2 of `brief-text.md:69-77`):

```json
{ "v": 1,
  "style": { "classKeyword": "lower", "literalCase": "lower" },
  "rules": [
    { "class": "Arbiter", "features": [
        { "feature": "requesters", "wrapper": false },
        { "feature": "requirements", "wrapper": false } ] },
    { "class": "Requester", "form": "line" },
    { "class": "Requirement", "keyword": "require", "form": "line",
      "syntax": { "rules": [
          { "when": { "op": "eq", "left": "kind", "right": { "kind": "string", "value": "BOUNDED_WAIT" } },
            "then": [ { "slot": "kind" }, { "keyword": "for" }, { "slot": "requester" },
                      { "keyword": "within" }, { "slot": "bound" } ] } ],
        "default": [ { "slot": "kind" } ] },
      "features": [ { "feature": "requester", "string": "name" } ],
      "name": { "show": "unlessPattern", "keyword": "as", "at": "end",
        "pattern": { "rules": [ { "when": { "op": "eq", "left": "kind", "right": { "kind": "string", "value": "BOUNDED_WAIT" } },
                                  "then": "{kind|lower}_{requester}" } ],
                     "default": "{kind|lower}" } } } ] }
```

`requester cpu priority 0` follows from `form: line` alone: keyword, name, then the features without braces.
`"string": "name"` is the one place the prototype departs from R-TXT-2: `Requirement.requester` is an `EString`
(`ArbiterSpec.ecore`, «the requester the bound applies to, by name»), printed unquoted.

### 2.4 The printer

Recommended: **an interpreter in the engine, in TypeScript**, a pure module under `src/codegen/` (lazy, R-GEN-2),
producing the engine's traced text so that both directions of R-GEN-41 provenance hold, exposed as one built-in entry
in GENERATORS. Against the alternative, a fixed JjGen generator reading the notation: the record would have to reach
JjEL through a new builtin; JjEL cannot call a template by a computed name (1709 report `:248-252`), evaluates both
sides of `and`/`or` (log of P-2026-11-01-1946); and an interpreter of a rule language written in JjEL would be the
largest JjEL program in the repo, under the 2000 ms budget of R-GEN-28. The JjGen generator keeps a role: **it is the
oracle**. With the empty notation, the TypeScript printer must print byte for byte what `default-text.generator.json`
prints, on the fixture of `defaultText.test.ts` and on the two prototype models.

### 2.5 The EBNF, and the notation check

One production per concrete class that some reference can hold; an abstract type becomes the alternatives of its
concrete subclasses. The default production of a class is the 1709 sketch (`:263-271`); each override rewrites its
part: `keyword` changes a terminal, `form: line` drops the braces, `wrapper: false` replaces `"r" "{" C* "}"` by
`C*` in the container, a group becomes `("reg_reg" M_reg_reg+ | ...)*` where `M_reg_reg` lists that group's members
(so the prototype's «check, not a production» becomes a production), `unlessPattern` becomes `("as" Name)?`, a
conditional syntax becomes alternatives. The same derivation yields the **notation check**, run on Save and shown in
the tab, refusing a notation that would print text the grammar cannot read back:

- alternatives whose first tokens are not disjoint (two wrapper-less containments whose children start with the same
  keyword; two `syntax` branches starting with the same slot of the same type when the predicate is not on that slot);
- a `Case` that is not a bijection on the metamodel (`lower` on `Mode = FAST | Fast | slow`, measured in the 1709
  fixture);
- a group whose members are not literals of `by`, or a literal in two groups;
- `omit: default` on a feature whose declared default is empty (R-TXT-10);
- `element: value` on a child class with more than the `by` feature.

### 2.6 The parser, later

It reads the same derived grammar (§1.4, points 1-5): a fixed tokenizer, a recursive-descent interpreter, a second
pass for references, an omitted value restored from `omit`, an omitted name from its `pattern`, the tree to JjScript
lines previewed and applied as one step. Acceptance as the prototype's own check does it (`brief-text.md:118-125`):
every model's text parses back to the same model, and mutated texts are refused, each for its reason.

### 2.7 Steps in order

| Step | What | Needs |
|---|---|---|
| S1 | The codec of `txtNotation` and its types, pure, with tests | nothing |
| S2 | The TypeScript printer on the empty notation, tested against the JjGen generator (differential, byte for byte) | S1; read access to the prototype for the acceptance (read-only) |
| S3 | The overrides in the printer, in three slices: keyword, omit, line form, wrapper, case, string-as-name; then grouping; then syntax and name patterns. Acceptance: CoreSpec and ArbiterSpec printed as `brief-text.md` gives them | S2; Alfonso's choice on order (question 5) |
| S4 | The EBNF and the notation check, shown in the tab | S3 |
| S5 | The UI: the textual viewpoint under its metamodel, a tab with the rules (Basic: rename, omit, one line; Advanced: groups, syntax), the text, the grammar | S1-S4; the setting of R-GEN-42 |
| S6 | The parser, for «new model from text» first | S4; question 8 |
| S7 | The text as an editing surface (identity-preserving apply), Monaco tokens and completion from the grammar (`jjtl/editor/jjtlLanguage.ts` the precedent) | S6 |

### 2.8 Where this departs from Xtext, and why

1. **The metamodel is primary, the notation a delta.** In Xtext the grammar is the source and the metamodel is
   imported or inferred from it; here every metamodel already has a notation (the R-TXT default, in the spirit of HUTN,
   as `brief-text.md:9-12` puts it), and a DSL stores only what it changes.
2. **A closed vocabulary of shapes, not an arbitrary grammar.** Block, line, wrapper, group, keyword sequences with
   data conditions. A smaller space, in which every notation can be printed, has a grammar derived by construction,
   and is checked for determinism on Save.
3. **The printer is not a search over the grammar.** Xtext's serializer finds a path through the grammar for a given
   model; here printer and grammar are two interpretations of one rule set, so the printer cannot reach a dead end.
4. **References follow one fixed rule** (R-TXT-4, R-TXT-11), with no scoping or linking language.
5. **No expressions, in v1.** Xtext's value converters, scoping and formatting are Java code; here they are closed
   options, and JjEL is admitted later only where its output is redundant (§1.3).
6. **Data in the model, interpreted live.** No build step and no generated code: the notation is part of the
   metamodel, edited in a form, and travels with the project and with a sealed copy.
7. **Layout is part of the rule.** Xtext's formatter is separate; here `form`, `wrapper` and `indent` are syntax.

## 3. Risks

- **Identity on re-parse** (§1.4, point 5): without a matching step, editing through the text destroys ids, layout and
  cross-model references. It decides whether the text can be an editing surface at all.
- **Order not kept by a grouping**: a grouping prints the children in its table's order and drops their model order
  (`brief-text.md:64-66` says it is not significant for CoreSpec). Text→model is lossy on order exactly where the notation declares it.
- **The `.ecore` export drops `_state`**: a notation, like a generator, does not survive an Ecore round trip.
- **Defaults lost on import** (R-TXT-10): `omit: default` is unusable on imported metamodels until the ticket is
  fixed; `omit: {equals}` is the workaround.
- **Homonymous classes**: a rule keyed by class name alone inherits the problem of `discovery_2026-09-19_metaclass_identity_homonyms.md`; the rule should carry the class id too.
- **Two predicate implementations**: reusing the IR's `Predicate` shape does not mean reusing `irCompile` (critical
  zone, tied to `ReadCtx`); the notation needs its own small evaluator over feature names, and the two may drift.
- **The legacy `DState.languages`** stays in every saved state, with `nearley` and `ohm-js` in the bundle, and a
  second, unrelated meaning of «language» in the code.
- **Coverage of JjScript for M1 writes** a parse needs: not checked (§1.4).

## 4. Questions for Alfonso

1. Storage: a `txtNotation` record on the metamodel's `_state` (recommended), or a `DViewPoint` of a new type `text`?
2. One textual notation per metamodel (recommended for v1), or several, as generators?
3. Printer: an interpreter in TypeScript with the JjGen generator kept as its oracle (recommended), or a JjGen generator that reads the notation?
4. No JjEL in notation v1 (recommended); expressions later, in redundant positions only?
5. May a grouping declare the children's model order not significant (recommended, per feature), or must the text keep it?
6. Parser: an interpreter of our own over the derived grammar (recommended), or `ohm-js`, already a dependency?
7. The legacy `DState.languages` and the orphaned Languages tab: leave them (recommended for now), or retire them in a lane of their own?
8. Parser scope: «new model from text» first (recommended), with the identity-preserving edit as a later lane?
9. A class printed differently in two containers: out of v1 (recommended), or a `within` key on the class rule?
10. Conditions in the IR's `Predicate` / `Conditional` shape (recommended), or a shape of their own?

## Addendum: textual syntax from the metamodel (P-2026-11-01-2210, P-2026-11-01-2232)

Answers questions 1 to 7 of `docs/prompts/claude_2026-11-01_2210_prompt_textual_syntax_design_discovery.md` under
R-TXT-16..20. Two sessions: P-2026-11-01-2210 measured and stopped at the context ceiling (RC-51, its `handoff.md`);
P-2026-11-01-2232 re-ran its measurements, measured the rest and wrote this. Probes are scratch code outside the repo
(`~/.jjodel-lanes/P-2026-11-01-2232/probe/`, not committed): the grammar as data (`lib.mjs`), printer, hand-written
parser, nearley and ohm-js generators, models, `run1.mjs`..`run7.mjs`. Versions: nearley 2.20.1, ohm-js 17.5.0,
monaco-editor 0.52.2, all already dependencies. The prototype (`~/Downloads/micron-proto/`) was read, not copied.

**Re-run by 2232 (one command each, same results as 2210):**

```
run1  fixture C-like == shipped EXPECTED: true
      briefs identical (header and duplicate comment excluded): 16 of 16
run2  clike / pascal / indent fixture round trip: true, unresolved 0 (each)
      briefs: the .brief text parses and reprints as the model prints: 16 of 16
run3  nearley parses=1 on all 19 samples (3 fixture styles + 16 Briefs)
```

### A.1 Base grammar (question 1)

**Form.** One rule per concrete metaclass, over a closed vocabulary of nodes, all data: `seq`, `opt{feat}`,
`star{feat}`, `alt`, `kw` (contextual keyword: an identifier matched by its text, R-TXT-9), `p` (punctuation),
`tok{NAME|REF|INT|BOOL|STRING}`, `lit{enum literals}`, `rule`, `assign{feat, many}` (Xtext's `f=` / `f+=`),
`nl`, `block{open, close}`. The base level uses only abstract shapes (`HEAD`, `BODY`, `FEAT`, `LIST`, `BLOCK`); a
style gives them their tokens.

**Derivation**, for a metamodel, against R-TXT-1..12:
1. `Model ::= (Obj_C1 | ... | Obj_Cn)*` over the concrete classes.
2. Per concrete class C: `Obj_C ::= HEAD("C") NAME? BODY(FEAT(f, V)? ...)`, the features in R-TXT-1 order with the
   R-TXT-12 tie-break; a `name` attribute moves to the head (the R-TXT-3 identity slot); every feature is optional
   because an unset one is omitted (R-TXT-5).
3. V by feature type: EInt `INT`, EBoolean `BOOL`, EString `STRING` (R-TXT-2), enumeration `Enum ::= lit | ...`
   (literals as declared, R-TXT-3), many-valued attribute `LIST(V)`; reference `REF` (name when unique, else path,
   R-TXT-4/11), many `LIST(REF)`; containment many `BLOCK(T*)`, single `T`.
4. An abstract T becomes the alternatives of its concrete subclasses (`Named_ ::= Obj_Sys | Obj_Part`).

Base grammar of the 1709 fixture metamodel (`out-base.txt`, generated):

```
Model ::= (Obj_Sys | Obj_Part | Obj_Link)*
Named_ ::= Obj_Sys | Obj_Part
Obj_Sys ::= HEAD("Sys") NAME? BODY(FEAT("doc", STRING)? FEAT("width", INT)? FEAT("depth", INT)? FEAT("enabled", BOOL)? FEAT("ready", BOOL)? FEAT("label", STRING)? FEAT("note", STRING)? FEAT("mode", Mode)? FEAT("tags", LIST(STRING))? FEAT("empty", LIST(STRING))? FEAT("level", INT)? FEAT("count", INT)? FEAT("parts", BLOCK(Obj_Part*))? FEAT("links", BLOCK(Obj_Link*))? FEAT("main", REF)?)
Obj_Part ::= HEAD("Part") NAME? BODY(FEAT("doc", STRING)? FEAT("size", INT)? FEAT("kind", Mode)? FEAT("peers", LIST(REF))?)
Obj_Link ::= HEAD("Link") BODY(FEAT("weight", INT)? FEAT("from", REF)? FEAT("to", REF)?)
Mode ::= "FAST" | "Fast" | "slow"
```

What changes from the 2017 report: the closed vocabulary of §2.8 point 2 stays, but it is now a grammar, not a
notation record; the JSON notation model of §2.2 is replaced (R-TXT-16).

### A.2 Styles (question 2)

**A style is a function from base to concrete grammar**, a parameter record applied to the abstract shapes:

| Parameter | C-like | Pascal/Ada | Indentation |
|---|---|---|---|
| block open / close | `{` `}` | `begin` `end ;` | INDENT DEDENT |
| assignment | none (`f v`) | `f := v` | none |
| item terminator | none | `;` | NEWLINE |
| list | `[a, b]` | `(a, b)` | `[a, b]` |
| string quoting | `"..."`, backslash escape | `'...'`, quote doubled | as C-like |
| comments | `//`, `/* */` | `--`, `(* *)` | `#` |
| words reserved in name positions | none | `begin`, `end` (printed quoted) | none |

Plus `classCase`, `literalCase` (declared or lower) and two format options that are not syntax: `indent`,
`blankBeforeContainment`. A style is unambiguous for every base grammar under two conditions that belong to the
metamodel, not to the style: (i) feature names distinct within a class, inherited ones included; (ii) the concrete
classes that can occupy one position have distinct keywords (homonymous classes break it, report §3). Given these:

- **C-like.** Every body item starts with a contextual keyword or a class keyword, `}` cannot start an item, the
  value kind is decided by its first token (INT, STRING, `[`, identifier), and an optional NAME after the class
  keyword is followed by `{`, punctuation. LL(1) on token kind, except REF, which decides name vs path at its second
  token (`[` or `.`): LL(2) local to REF.
- **Pascal/Ada.** As C-like with word delimiters: a name `begin` after the class keyword would be ambiguous, so the
  style reserves `begin`/`end` in name positions and prints such names quoted. A feature named `begin` or `end` needs
  LL(2) (`end :=` vs `end ;`) or the same quoting. The terminator `;` adds a synchronisation point for recovery.
- **Indentation.** C-like with INDENT/DEDENT for braces; an empty body is no INDENT. The tokenizer emits the layout
  tokens; the grammar stays context-free over them.
- **Lisp (sketch).** `(Sys s1 (doc "top") (parts (Part dup (size 1))))`: fully bracketed, unambiguous by construction;
  the name, if any, is the second element and is never a list.
- **YAML-like (sketch).** `Sys: s1`, indented `doc: "top"`, `parts:` then `- Part: dup`: the indentation style with
  `:` and `-` markers; strings stay quoted (R-TXT-2), YAML's implicit typing is not adopted.
- **HUTN (sketch).** `Sys "s1" { doc: "top" parts: Part "dup" { size: 1 } }`: C-like with `:` assignment and names as
  strings.

Empirical check: nearley, an Earley parser that returns every parse, finds exactly one on all 19 samples (§A.4).

**Case-folding condition** (found by the fixture): `literalCase: lower` must be injective over each enumeration's
literals and over the class keywords. The fixture's `Mode` has `FAST` and `Fast`; lower case merges them. The style
check refuses that combination for that metamodel (or keeps the declared case).

The 1709 fixture in **C-like** is byte for byte the shipped JjGen generator's expected text (`defaultText.test.ts`,
measured, `run1`). Its EBNF (`out-ebnf-fixture-clike.txt`):

```
Model ::= {Sys | Part | Link} ;
Sys   ::= "Sys" [name=NAME] "{" ["doc" doc=STRING] ["width" width=INT] ["depth" depth=INT] ["enabled" enabled=BOOL] ["ready" ready=BOOL] ["label" label=STRING] ["note" note=STRING] ["mode" mode=Mode] ["tags" ("[" [tags+=STRING {"," tags+=STRING}] "]")] ["empty" ("[" [empty+=STRING {"," empty+=STRING}] "]")] ["level" level=INT] ["count" count=INT] ["parts" "{" {parts+=Part} "}"] ["links" "{" {links+=Link} "}"] ["main" main=REF] "}" ;
Part  ::= "Part" [name=NAME] "{" ["doc" doc=STRING] ["size" size=INT] ["kind" kind=Mode] ["peers" ("[" [peers+=REF {"," peers+=REF}] "]")] "}" ;
Link  ::= "Link" "{" ["weight" weight=INT] ["from" from=REF] ["to" to=REF] "}" ;
Mode  ::= "FAST" | "Fast" | "slow" ;
```

The fixture in **Pascal/Ada** (`out-fixture-pascal.txt`), with its EBNF rule for `Part`:

```
Part ::= "Part" [name=NAME] "begin" ["doc" ":=" doc=STRING ";"] ["size" ":=" size=INT ";"] ["kind" ":=" kind=Mode ";"] ["peers" ":=" ("(" [peers+=REF {"," peers+=REF}] ")") ";"] "end" ";" ;
```

```
Sys s1 begin
  doc := 'top';
  width := 0;
  enabled := false;
  label := 'say "hi" \ bye';
  mode := Fast;
  tags := ('a', 'b-c');
  level := 7;
  count := 0;
  parts begin
    Part dup begin
      size := 1;
      kind := FAST;
      peers := (size, parts[1]);
    end;
    Part dup begin
      size := 2;
      kind := slow;
    end;
    Part size begin
      size := 3;
    end;
    Part FAST begin
      kind := Fast;
      peers := ('has space');
    end;
    Part 'has space' begin end;
  end;
  links begin
    Link begin
      weight := 5;
      from := size;
      to := links[1];
    end;
    Link begin
      from := parts[0];
    end;
  end;
  main := parts[1];
end;
```

The names `size` and `FAST` are also a feature keyword and a literal: contextual keywords (R-TXT-9) keep them legal.

### A.3 Annotations (question 3)

The minimal set that makes the C-like style print the 16 prototype Briefs as written (measured: 16 of 16, the header
comment and the derived `// listed twice: add` comment excluded, `run1`), all on metamodel elements:

| # | Annotation | On | Used by | Grammar change | Why it stays unambiguous |
|---|---|---|---|---|---|
| 1 | `keyword: 'w'` | class | `Requirement: require` | class keyword replaced | condition (ii) of §A.2 rechecked on the new word |
| 2 | `keyword: ''` (positional) | class, feature | `Instruction`, `Instruction.mnemonic`, `Requirement.kind` | keyword dropped, the value starts the item | the value's FIRST set must be non-nullable and disjoint from the FIRST sets of the items that may follow |
| 3 | `keyword: 'w'` | feature | `Core.nregs: registers`, `Requirement.requester: for`, `Requirement.bound: within` | feature keyword renamed | condition (i) of §A.2 rechecked on the new word |
| 4 | `layout: line` | class | `Requirement`, `Requester` | no block: the features follow on the head's line | FIRST(features) ∩ FOLLOW(object) = ∅ (Requester: `{priority}` vs `{requester, require, }}`) |
| 5 | `name: {keyword, default}` | class | `Requirement: as`, default `{kind}` (Core), `{kind}(_{requester})?` (Arbiter) | `["as" name=NAME] (* else name = pattern *)`; omitted on print iff the name equals the pattern | the segment `(...)?` is present iff its holes are set, so no condition language is needed; holes outside a segment must be set, else the name stays unset (a probe bug in 2232 showed the case) |
| 6 | `inline` | containment feature | `Core.requirements`, `Arbiter.requesters`, `Arbiter.requirements` | children directly in the body, no `f { }` wrapper | the children's class keywords disjoint from the owner's feature keywords and from other inline features' classes |
| 7 | `groupBy: attr` + enum `subsets` | containment feature + enumeration | `Core.instructions` by `mnemonic` | `{subset lit+}`: one production `Mnemonic_<subset>` per subset | the subsets partition the literals; subset names disjoint from the literals; `attr` mandatory (an object with it unset cannot be printed, so it is lost) |
| 8 | `value: name` | EString feature | `Requirement.requester` (`for cpu`) | STRING printed as an identifier | the printer falls back to the quoted string when the value is not an identifier; the parser accepts both |
| 9 | `roots` | metamodel | `Core`, `Arbiter` | `Model ::= {Core}` | recommended derived instead: concrete classes that are never the type of a containment; the annotation only overrides |

Lower case for class keywords and literals (`core`, `multicycle`) is a style parameter, not an annotation (§A.2,
with its injectivity check). **Binary operator** is used by neither metamodel (no class contains its own supertype
twice). Design for when it is: a class annotated `operator: {symbol, precedence, assoc}` over two containment
features of the same type yields precedence climbing, `E_p ::= E_{p+1} (op_p E_{p+1})*` per level plus
`"(" E ")"`, unambiguous when (symbol, precedence) pairs are distinct and associativity is declared.

**Deliberate difference from the prototype.** ArbiterSpec `require K ["for" NAME] ["within" INT] ["as" NAME]` admits
`for`/`within` on any kind; the prototype binds them to `bounded_wait`. That is a constraint (a validation marker),
not syntax. The prototype's «check, not a production» for grouped mnemonics becomes five productions.

**Where annotations live.** A record on the metamodel's `_state`, as the 2017 report proposed for `txtNotation`
(§4 question 1), keyed by element id, not by name (homonyms, report §3): `{ style, classes: {<id>: ...}, features:
{<id>: ...}, enums: {<id>: ...} }`. The `.ecore` export drops `_state` (report §3), so annotations, like generators,
do not survive an Ecore round trip.

**Concrete grammar of CoreSpec**, C-like with lower case (`out-ebnf-core.txt`, in full):

```
Model         ::= {Core} ;
Core          ::= "core" [name=NAME] "{" ["xlen" xlen=INT] ["registers" nregs=INT] ["microarch" microarch=Microarch] ["instructions" "{" { "reg_reg" instructions+=Mnemonic_reg_reg {instructions+=Mnemonic_reg_reg} | "reg_imm" instructions+=Mnemonic_reg_imm {instructions+=Mnemonic_reg_imm} | "control" instructions+=Mnemonic_control {instructions+=Mnemonic_control} | "load_store" instructions+=Mnemonic_load_store {instructions+=Mnemonic_load_store} | "ordering" instructions+=Mnemonic_ordering {instructions+=Mnemonic_ordering} } "}"] {requirements+=Requirement} "}" ;
Instruction   ::= [mnemonic=Mnemonic] ;
Requirement   ::= "require" [kind=RequirementKind] ["as" name=NAME]  (* else name = {kind} *) ;
Microarch     ::= "multicycle" | "pipe3_stall" | "pipe3_forward" ;
Mnemonic      ::= "add" | "sub" | "and" | "or" | "xor" | "addi" | "lw" | "sw" | "beq" | "bne" | "andi" | "ori" | "xori" | "slti" | "sltiu" | "slt" | "sltu" | "sll" | "srl" | "sra" | "slli" | "srli" | "srai" | "lui" | "auipc" | "jal" | "jalr" | "blt" | "bge" | "bltu" | "bgeu" | "fence" ;
RequirementKind ::= "isa_conformance" | "no_hazard" | "in_order_retire" ;
Mnemonic_reg_reg ::= "add" | "sub" | "and" | "or" | "xor" | "slt" | "sltu" | "sll" | "srl" | "sra" ;
Mnemonic_reg_imm ::= "addi" | "andi" | "ori" | "xori" | "slti" | "sltiu" | "slli" | "srli" | "srai" | "lui" | "auipc" ;
Mnemonic_control ::= "jal" | "jalr" | "beq" | "bne" | "blt" | "bge" | "bltu" | "bgeu" ;
Mnemonic_load_store ::= "lw" | "sw" ;
Mnemonic_ordering ::= "fence" ;
```

**Concrete grammar of ArbiterSpec** (`out-ebnf-arb.txt`, in full):

```
Model         ::= {Arbiter} ;
Arbiter       ::= "arbiter" [name=NAME] "{" ["policy" policy=Policy] {requesters+=Requester} {requirements+=Requirement} "}" ;
Requester     ::= "requester" [name=NAME] ["priority" priority=INT] ;
Requirement   ::= "require" [kind=RequirementKind] ["for" requester=NAME] ["within" bound=INT] ["as" name=NAME]  (* else name = {kind}(_{requester})? *) ;
Policy        ::= "fixed" | "round_robin" ;
RequirementKind ::= "mutex" | "no_spurious_grant" | "priority" | "bounded_wait" ;
```

`priority` is both Requester's feature keyword and a RequirementKind literal; the two positions never meet (after
`require` vs after a requester's name), so it stays LL(1). `Requirement.kind` is optional because every feature is
(R-TXT-5): `require` alone parses, with `kind` unset (§A.4 shows the consequence).

### A.4 Printer and parser (question 4)

**Serialization rule.** The printer walks the concrete grammar with the object: `seq` in order; `opt{feat}` printed
iff the feature is set (R-TXT-5); `alt` chosen by the object's class, never by search; `star` over the children (or
over the subset table for `groupBy`); `kw`/`p` emitted; `tok` formatted and quoted by the style; `derive` omits the
name iff it equals the pattern. A choice is always decided by the data, so the printer cannot reach a dead end
(report §2.8 point 3 holds).

**ohm-js, cause found and fixed (2232).** Every sample failed at the first feature because ohm's `#( ... )`
(lexification) also disables the space skipping *before* the expression: `#("w" kend)` cannot match after a space.
Minimal case: `S = "{" #("w") int "}"` on `{ w 0 }` fails with «expected "w"» at column 2; `S = "{" "w" int "}"`
matches. Fix: a parametrised lexical rule `kw<k> = k kend`, applied from syntactic rules, which skip spaces before an
application. After the fix ohm matches **19 of 19** samples (`run3`).

| | hand-written interpreter | nearley (Earley) | ohm-js (PEG) |
|---|---|---|---|
| grammar as data at run time | interprets the grammar object | `.ne` text generated, compiled at run time (`nearley/lib/compile` + `generate`), 0.9-6.7 ms | `ohm.grammar(source)` at run time, 5.9-21.9 ms |
| indentation style | tokenizer emits INDENT/DEDENT | the same tokenizer as custom lexer | a pre-pass to sentinel characters (PEG has no layout) |
| 19 samples | 1 root each, round trip identical | exactly 1 parse each | 19 matched (after the fix) |
| error message | yes, own wording | yes, with the expected tokens | yes, with the expected terminals |
| recovery | panic mode at body items | none (stops at the first error) | none |
| 1,001 objects, C-like | 15.4 ms (parse + build + resolve) | 11.4 ms (recognition + default tree) | 107.2 ms (match only); 1.6 ms incremental re-match after a 3-character edit |

**Errors on a broken input** (`run4.mjs`; `core_mc4.brief` with `registers 4` → `registers four`):

```
nearley: line 4 col 13: unexpected ID "four" | Unexpected ID token: "four". Instead, I was expecting to see one of the following: ...
ohm:     Line 4, col 13: expected a digit
hand:    4:13: expected an integer; found name "four"
```

and the fixture with `size 1` → `sise 1`:

```
nearley: line 12 col 7: unexpected ID "sise" | ...
ohm:     Line 12, col 7: expected "}", "peers", "kind", "size", or "doc"
hand:    12:7: expected "doc", "size", "kind", "peers", "}"; found name "sise"
```

On `require no_hazzard` the hand-written parser says `expected "require", "}"`, less than ohm's `expected "}",
"require", "as", "in_order_retire", "no_hazard", or "isa_conformance"`: an optional that fails silently drops its
FIRST set from the message. Fix for the implementation: collect the expected sets of the optionals skipped at the
failing position (ohm does it by construction).

**What is recovered from a partly broken text** (hand-written, `{recover: true}`):

| Broken input | errors | roots | source lines not reprinted |
|---|---|---|---|
| `registers four` | 1 | 1 | 1 (that line) |
| `reg_imm addq` | 1 | 1 | 1 |
| `require no_hazzard` | 1 | 1 | 1, and a `require` with `kind` unset recovered in its place |
| the three together | 3, all reported in one pass | 1 | 3 |
| fixture `sise 1` | 1 | 1 | 1 |
| fixture, one `}` missing | 3 | 0 | 39, the whole root |

Two consequences. A recovered tree is not a model to apply: it holds partial objects (the bare `require`). It serves
the outline and the markers only, and R-TXT-19's «a text that does not parse leaves the model at its last valid
state» is the rule that must hold. And item-level recovery cannot rebuild a block whose close is missing: the
implementation keeps partially built objects on error, and in the indentation-carrying styles may use indentation as
the hint for the missing close.

**Recommendation:** the hand-written interpreter (report §4 question 6 confirmed by measurement): it is the only one
with recovery, its time is in the range of nearley's, and it shares the grammar object with the printer. nearley
stays as a test oracle for unambiguity (it counts parses) in the style check; ohm's incremental matching is the one
feature worth remembering if a 10,000-object text ever needs per-keystroke parsing.

### A.5 Identity and application (question 5)

**Monaco decorations, measured** (`run7.mjs`: monaco-editor 0.52.2 in headless Chromium through playwright, both
already installed; four decorations with `NeverGrowsWhenTypingAtEdges` on `Part a {\n  size 1\n}\nPart b {...}`;
cut and paste as `executeEdits` with undo stops, not the clipboard):

| Step | Object a (lines 1-3) | Value `1` of `a.size` |
|---|---|---|
| type `0` after the value | kept | not grown: covers `1` of `10` |
| type `9` before the value | kept | shifted: covers `1` of `910` |
| replace the name `a` with `alpha` | kept | the name span stays one character wide |
| undo the rename | kept | kept |
| cut object a | collapsed to the empty range 1:1 | collapsed |
| paste it after object b | still empty: the pasted text carries no decoration | empty |
| undo the paste, then undo the cut | text restored, **decorations not**: empty range at 4:1 | empty |

So decorations survive typing inside a span, and a pasted copy is correctly a new object (R-TXT-18), but undo does
not bring them back and an edge edit leaves the new characters outside. Decorations alone cannot carry identity.
What follows: after every successful parse the spans are re-derived from the parse (each object's span from its
first to its last token) and matched to the previous parse's objects by the R-TXT-18 cascade below, with the
surviving decorations as its first and strongest evidence; Monaco's undo is mirrored by the model's undo (one
undo step per applied diff, R-TXT-19), so after an undo the text is reprinted with fresh decorations rather than
trusting Monaco's.

**The cascade on re-import**, step by step (proposal; thresholds to be calibrated on the 16 Briefs and the fixture):
1. Id in the text: exact match. A repeated id makes a new object with a warning (R-TXT-18).
2. Class and name in the same container: automatic. Homonyms in one container (the fixture's two `dup` Parts) match
   by their order among the homonyms, marked uncertain.
3. Class and name elsewhere in the model: a move, proposed.
4. Unmatched objects of one class: similarity = equal set features / union of set features (attributes and
   references by target); proposed as a rename when the best score is at least 0.6 and leads the second by at least
   0.2; otherwise create + delete.
5. Everything else: create or delete; a delete of an object referenced from another model is flagged.

The confirmation the user sees: one dialog, counts first (matched by id N, by name N: automatic; moved K, renamed K,
homonyms by order K: to confirm), then one row per uncertain match, old → new with its score, each with a checkbox,
then the creates and deletes, the cross-model deletes in red; nothing is applied until confirmed.

**The diff as JjScript.** Covered at M1 (`jjscript/executor/commands/instance.ts:1-26`): `create instance C ["n"] [in
P.ref]`, set attribute and reference, `+=` / `-=`, delete, rename. A containment `set p.f += x` moves `x` through the
core (`referenceWrite.ts:14`). Gaps:
- **Addressing by id**: instances are addressed by name or by a run-local handle; homonyms are refused as ambiguous
  (`resolveInstanceHandle`, `instance.ts:246-262`). But the handle registry already maps a handle to a DObject id
  and is consulted first (`executor/handleRegistry.ts:1-40`): the applier can register one handle per touched object
  before the diff runs (after `EXECUTION_START`, which clears it). That gives id addressing with no syntax change.
- **Move**: `move` is M2-only and the planner declares `move` and `copy` unsupported (`effectsPlanner.ts:45`). M1
  moves can be written as containment `+=` (the core moves), but the planner, and with it the preview, must learn it.
- **Reorder**: no insert-at-index for ordered features. Needed only for features declared ordered (R-TXT-19).

### A.6 Comments and formatting (question 6)

The concrete syntax tree stores, per object, its span (first and last token), per feature item its span, and the
hidden tokens (whitespace, comments) attached to the nearest item: a comment on its own lines belongs to the next
item (leading), a comment after code on the same line to that item (trailing), a comment before a block's close to
the block. The probe tokenizer collects comments with their line; their association was not measured.

An incremental print rewrites only the spans of changed objects: for each changed object, reprint its rule with the
current style and indentation, keep its leading and trailing comments, and replace the span; comments inside a
reprinted span stay with their items when the items survive, and are dropped with deleted items. A rename also
changes the referrers' text (a reference printed by name), so «changed objects» includes the objects whose REF
tokens print the renamed name, and those whose path changes on a move.

From Xtext we copy: the node model (composite and leaf nodes with hidden tokens, the semantic element ↔ node link),
comment association, and the change serializer's idea, regions of changed objects re-serialized and spliced. We do
not copy: the EMF change recorder (the diff of R-TXT-19 and Redux actions say what changed), Java formatters and
value converters (closed style options), scoping and the linking language (R-TXT-4/11), and the text as the
persisted artifact (R-TXT-17).

### A.7 Plan (question 7)

| Step | Needs | Delivers |
|---|---|---|
| T1 | R-TXT-16 accepted; the probe's `lib.mjs` as reference | the base grammar and the C-like style as TypeScript over the metamodel; read-only EBNF shown; differential test against the JjGen generator byte for byte (the fixture and a corpus) |
| T2 | T1 | the hand-written parser with recovery; «new model from text» in C-like (create only, through JjScript `create`/`set`, one undo step); errors as Monaco markers |
| T3 | T1 | the style check: conditions (i), (ii), case injectivity; nearley parse count as the unambiguity test on generated samples |
| T4 | T1, `_state` storage decided | annotations 1-9 as data on `_state`, edited in a form; acceptance: the 16 Briefs from the C-like style |
| T5 | T2 | Pascal/Ada and indentation styles |
| T6 | T2, handle registration (§A.5) | apply an edited text to an existing model: diff, cascade inside the editor (decorations + re-derived spans), JjScript lines through guard, planner, preview, `applyAsOneStep` |
| T7 | T6; planner support for M1 move; reorder | moves and order for ordered features |
| T8 | T6 | re-import of an exported file: ids in the text, the cascade with the confirmation dialog |
| T9 | T2 | concrete syntax tree with comment association |
| T10 | T9, T6 | scenario 2: an edit in a diagram reprints only the changed spans, comments kept |

### A.8 Which of the report's §4 questions R-TXT-16..20 settle

| §4 | Status |
|---|---|
| 1 storage | open in form: annotations still need a home (`_state`, recommended in §A.3) |
| 2 one notation per metamodel | settled in substance by R-TXT-16: one base grammar, one style, one annotation set |
| 3 printer | settled: printer derived from the concrete grammar; the JjGen generator stays the reference (R-TXT-14, R-TXT-16) |
| 4 no JjEL in v1 | settled: annotations are closed data (R-TXT-16) |
| 5 order of a grouping | settled by R-TXT-19 (order matters only for ordered features) |
| 6 parser | settled in substance (R-TXT-16: derived); the tool is answered by §A.4 |
| 7 `DState.languages` | not settled |
| 8 parser scope | not settled by a row; §A.7 puts «new model from text» first |
| 9 a class printed differently in two containers | not settled (annotations are per class) |
| 10 condition shape | made moot: the default-name pattern's optional segment needs no conditions (§A.3) |

### A.9 Questions for Alfonso

1. Parser: the hand-written interpreter, with nearley kept as the test oracle for unambiguity? Recommended: yes.
2. Annotations on `_state` keyed by element id? Recommended: yes, one record next to the generators.
3. `roots`: derived (classes never contained) with the annotation as override, or always declared? Recommended:
   derived.
4. `groupBy` on a feature whose attribute is optional: refuse the annotation, or print the unset ones apart?
   Recommended: refuse (the attribute must be mandatory).
5. A text that is identical except for model order in an unordered feature: no diff? Recommended: no diff (R-TXT-19).
6. Id addressing for the diff by registering handles before the run, rather than a new JjScript id syntax?
   Recommended: handles.
7. The cascade's thresholds (0.6, margin 0.2): accept as starting values, calibrated in T8? Recommended: yes.
8. Partial objects from recovery: never applied, shown only as outline and markers? Recommended: yes, as R-TXT-19
   already implies.
9. The derived prototype comment `// listed twice: add`: a validation marker instead of a printed comment?
   Recommended: a marker.
10. Case folding that merges literals (`FAST`/`Fast`): refuse the style for that metamodel, or fall back to the
    declared case? Recommended: fall back, with a notice.
