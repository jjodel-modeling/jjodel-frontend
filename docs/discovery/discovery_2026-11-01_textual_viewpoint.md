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
  interpreter of the notation (§2.4); the JjEL generator of P-2026-11-01-1946 stays as its oracle;
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
| R-TXT-7 a JjEL generator first | superseded as the mechanism by R-TXT-14 | the generator stays as the oracle |
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
the JjEL generator does today.

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
in GENERATORS. Against the alternative, a fixed JjEL generator reading the notation: the record would have to reach
JjEL through a new builtin; JjEL cannot call a template by a computed name (1709 report `:248-252`), evaluates both
sides of `and`/`or` (log of P-2026-11-01-1946); and an interpreter of a rule language written in JjEL would be the
largest JjEL program in the repo, under the 2000 ms budget of R-GEN-28. The JjEL generator keeps a role: **it is the
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
| S2 | The TypeScript printer on the empty notation, tested against the JjEL generator (differential, byte for byte) | S1; read access to the prototype for the acceptance (read-only) |
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
3. Printer: an interpreter in TypeScript with the JjEL generator kept as its oracle (recommended), or a JjEL generator that reads the notation?
4. No JjEL in notation v1 (recommended); expressions later, in redundant positions only?
5. May a grouping declare the children's model order not significant (recommended, per feature), or must the text keep it?
6. Parser: an interpreter of our own over the derived grammar (recommended), or `ohm-js`, already a dependency?
7. The legacy `DState.languages` and the orphaned Languages tab: leave them (recommended for now), or retire them in a lane of their own?
8. Parser scope: «new model from text» first (recommended), with the identity-preserving edit as a later lane?
9. A class printed differently in two containers: out of v1 (recommended), or a `within` key on the class rule?
10. Conditions in the IR's `Predicate` / `Conditional` shape (recommended), or a shape of their own?
