# Discovery — a default textual notation for every model, derived from its metamodel

- Prompt-ID: P-2026-11-01-1709 (chat C-2026-11-01-1713)
- Prompt file: `docs/prompts/claude_2026-11-01_1709_prompt_default_textual_notation_discovery.md`
- Session: 0af2b98b-ed78-44ea-9097-30760bdb9a0b (unattended)
- Tree: `~/jjodel-w-defaulttext`, branch `default-textual-notation`, HEAD `deebcb805` (trunk `06bbed9a0` plus the two
  docs commits that added this prompt)
- Executor model: Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the files.
Every claim is tagged **measured** (a generator run in the dock tab of the app, this session, HEAD `deebcb805`) or
**read** (the file at that HEAD).

## Goal

Say whether the rules D1 to D7 of the prompt can be implemented once, by reflection, for every metamodel, from what a
generator receives today; what the platform lacks; and which rules need changing before a parser is derived from them.

## Hypotheses under test

| # | Hypothesis (prompt §1) | Verdict |
|---|---|---|
| 1.1 | The class shell behind `o.instanceOf` carries attributes and references with name, type, containment, bounds, the target class; inherited features through `superTypes`, in an order | **Partly.** References have everything but the target as a shell (a class *name*); attributes have no bounds, only `multiValued`; inherited features are reachable; the interleaved declaration order does not exist in Jjodel (§1.1). |
| 1.2 | `o[featureName]` reads every feature on such an object | **Holds**, on every extent surface. The 2026-06-11 finding is obsolete. Index reads carry no model origin (§1.2). |
| 1.3 | Enum literal, integer, boolean and string are told apart at run time; the attribute's type is readable | **Partly.** Integer, boolean, string: yes (`is`). An enumeration literal is a plain string at run time; only the attribute's type tells it (§1.3). |
| 1.4 | Jjodel distinguishes unset from default (`eIsSet`) | **Partly.** The D-layer does; the JjEL handle does only for optional attributes with no declared default (§1.4). |
| 1.5 | `f(x) == ""` over a Text is by design; a documented emptiness test exists | **First by design, second falsified**: no documented test; every attempt is silently false or null (§1.5). |
| 1.6 | Object names are unique | **Falsified**: not in a model, not in a class; a class with no `name` attribute still has a `name` on its handle (§1.6). |

## Files read

- `frontend/src/jjscript/executor/commands/eval.ts` 128-414 (`buildEvalContext`), 425-524 (class, attribute, reference
  shells), 561-594 (`shallowObjectToJjelValue`), 596-713 (`fillInstanceSlots`), 715-796 (`emptyAttributeDefault`),
  798-824
- `frontend/src/codegen/engine/generate.ts` (whole), `dispatch.ts` (whole), `templates.ts` (whole)
- `frontend/src/jjel/evaluator/evaluator.ts` 640-684 (member read), 1041-1044 (`is`), 1163-1177 (index access),
  1340-1360; `frontend/src/jjel/evaluator/context.ts` 100-150 (type registry), 275-330 (`JjelTextHost`)
- `frontend/src/jjel/SPEC.md` 314-395, 480-520, 700-705
- `frontend/src/model/logicWrapper/LModelElement.tsx` 2705-2813 (DClass/LClass fields), 3162-3164, 3398-3460
- `frontend/src/codegen/ui/GeneratorPane.tsx` 95-115, 420-440, 540-610; `codegen/ui/openTemplateEditor.ts` 55-90;
  `codegen/engine/templateCodec.ts` 1-60
- `docs/discovery/discovery_2026-10-31_codegen_metaclass_dispatch.md`, `discovery_2026-10-31_codegen_origins_through_concat.md`
  (whole), `2026-06-11_jjel_m1_navigation_discovery.md` 10-50 and 350-390, `discovery_2026-09-19_metaclass_identity_homonyms.md` 1-40
- `docs/decisions.md` 6060-6066 (R-GEN-10)
- `~/Downloads/micron-proto/metamodels/ArbiterSpec.ecore`, `models/arbiter3.xmi` (a real D7 case, §3)

## Method (measured)

Fixture, outside the repo in `~/.jjodel-lanes/P-2026-11-01-1709/`: `TextProbe.ecore` (abstract `Named {name}`;
`Sys extends Named` with `width`, `depth: EInt`, `enabled`, `ready: EBoolean`, `label`, `note: EString`, `mode: Mode`,
`tags: EString[0..*]`, `level: EInt` with `defaultValueLiteral="7"`, containments `parts: Part[*]`, `links: Link[*]`,
`main: Part[0..1]`; `Part extends Named` with `size`, `kind: Mode`, `peers: Part[*]`; `Link` with no `name`, `weight`,
`from: Part`, `to: Link`; enum `Mode = FAST | Fast | slow`) and `sample-TextProbe.xmi` (`width="0"`, `depth` unset,
`enabled="false"`, `ready` unset, two Parts named `dup`, Parts named `size`, `FAST` and `has space`, two Links).

Probe `frontend/scripts/smoke/_tmp_default_text.ts` (gitignored, not committed), run twice with
`~/.local/bin/node frontend/scripts/lane-run.mjs probe ~/jjodel-w-defaulttext frontend/scripts/smoke/_tmp_default_text.ts --port 3171 --id P-2026-11-01-1709`
(exit 0 both; log `~/.jjodel-lanes/P-2026-11-01-1709/probe-_tmp_default_text.log`). It creates a project through the
UI, imports the two files through the project page's file inputs, stores seven templates in the metamodel's
`genTemplates` (decoded back: 7 templates, 0 defects), opens the default generator's tab with
`openTemplateEditor(mm, name, 'main', undefined, model)` (model chosen: the imported one) and reads the Preview's
lines and spans. `main` is text mode and puts each question in its own hole, so an error stays in its hole. The first
run had three holes in error (`distinct` is a method, `distinct()`); the second run, quoted below, has no generation
error and no page error. The template sources and the full Preview are in the appendix.

## 1. Findings

### 1.1 The class shell (prompt 1.1)

**Read.** `eval.ts:495-505`, the attribute shell:

> `type: attr.type?.name ?? attr.typeName ?? 'String',` … `multiValued: attr.upperBound === -1 || attr.upperBound === '*',`
> `defaultValue: attr.defaultValue ?? null,`

no lower or upper bound. `eval.ts:511-523`, the reference shell:

> `type: ref.type?.name ?? ref.typeName ?? '',` / `containment: ref.containment ?? false,` / `upperBound: upper,` / `lowerBound: ref.lowerBound ?? ref.lower ?? 0,`

**Measured** (Preview lines 2-4 and 11-13):

```
Sys abstract=false supers=[Named] all=[Named]
  A: width:EInt mv=false def=null lb=null ub=null; … tags:EString mv=true def=null lb=null ub=null; level:EInt mv=false def=null lb=null ub=null
  R: parts:Part cont=true lb=I:0 ub=I:-1 mult=* typeIsString=true; … main:Part cont=false lb=I:0 ub=I:1 mult=1 typeIsString=true
P1 same shell: true superShared: true
```

- Attributes: name, type name, `multiValued`, `defaultValue`; `lowerBound`/`upperBound` read `null` (the reference
  bounds on the same run, `I:0`/`I:-1`, are the positive control). D2 needs only `multiValued`; a parser's optionality
  would need the lower bound.
- References: name, containment, bounds; the target is a **string** (`typeIsString=true`): the shell is reached by
  `classes.filter(c => c.name == r.type).first`, or the top-level variable of the class (`eval.ts:321-326`, skipped
  when the name collides with a global).
- `o.instanceOf` is the shared shell (`Sys.instances.first.instanceOf == Sys` true), `superTypes` too
  (`Sys.superTypes.first == Named` true). Own features only: `Sys`'s `A:` list has no `name`; `Named`'s has it. The
  inherited ones are a walk over `superTypes`, which JjEL can write; there is no `allAttributes` on the shell.
- **Order.** The shell keeps two lists (`eval.ts:428-433`), and so does the D-layer: `LModelElement.tsx:2732-2734`
  `features`, `references`, `attributes` pointer lists, of which `features` is **empty** for every class after the
  import (**measured**, `D classes` line of the log: `"name":"Sys","features":[],"attributes":["width",…,"level"],"references":["parts","links","main"]`).
  So the interleaved Ecore order of `eStructuralFeatures` is not kept by Jjodel at all; D6 can only mean attributes in
  their order, then references in theirs. `get_allFeatures` (`LModelElement.tsx:3162-3164`) is
  `arrayMergeInPlace(get_allAttributes, get_allReferences)`; the M1 object's slots come in that order too, own
  attributes before inherited ones (**measured**, `D object Sys/Sys_0`: `width … level, name, parts, links, main`).

### 1.2 `o[featureName]` (prompt 1.2)

**Read.** `evaluator.ts:1163-1176`: an object and a string or number index return `(obj as any)[key]`, a blocked
name or a function `null`. `eval.ts:621-713` `fillInstanceSlots`, run over the whole pool at `eval.ts:210-218`,
writes every feature of every M1 object onto its handle: attributes through the L getter, references as the shared
pool handles, multi-valued as arrays, then `parent`.

**Measured**, all on the second run:

| Read | Value |
|---|---|
| `Sys.instances.first["width"]`, and `["wid" + "th"]` | `I:0`, `I:0` |
| `["tags"]` (multi-valued attribute) | `A[S'a',S'b-c']` |
| `["parts"]` (containment) | `A[O:Part/dup,O:Part/dup,O:Part/size,O:Part/FAST,O:Part/has space]` |
| `Sys.instances.first.parts.first["size"]` (target of a reference) | `I:1` |
| `Named.allInstances.map(o => o["name"])`, `instances.map(o => o["name"])` | every name, inherited `name` included |
| `o[r.name]` for single references | `main=O:Part/dup`, `to=O:Link/Link_1`, unset `to=null` |
| `["nosuch"]` | `null`, no error |
| `["id"]`, `["instanceOf"]`, `["parent"]` | the id string, the class shell, the container |

Every row of `slotsOf(o)` (appendix) printed every feature of every object. The 2026-06-11 surface map (attribute and
reference slots absent on extent handles) is obsolete since Stage 1 (`eval.ts:193-218`); it now holds on every extent
surface: `instances`, `C.instances`, `C.allInstances`, reference targets, `parent`, bare names. `data`/`self` were not
measured (a generation has no selection).

Two consequences for a reflective default:

- **No origin on an index read.** `evaluator.ts:673-677` calls `ctx.readObserver?.(obj, property, value)` on a member
  read; `evaluateIndexAccess` (`evaluator.ts:1163-1176`) calls nothing. **Measured** on the line
  `ORIG dot=${…first.label} idx=${…first["label"]}`: the three spans of the dot read carry
  `data-origin-id="Pointer…_USER_34"` (the object `s1`), the three of the index read `null`. A default written with
  `o[f.name]` produces text that Alt+click and the canvas link cannot trace.
- **Reserved keys answer the index.** `o["id"]`, `o["instanceOf"]`, `o["parent"]` return the structural values; a user
  feature named `id`, `__type`, `instanceOf` or `instanceof` is never written to the handle (`eval.ts:659`), one named
  `parent` shadows the built-in (`eval.ts:710`). A missing feature and an unset one both read `null`.

### 1.3 Telling values apart (prompt 1.3)

**Read.** `context.ts:124-139`: `is String`, `is Integer` (`Number.isInteger`), `is Number`, `is Boolean`.
`eval.ts:634-647`: an enum literal is collapsed to its name string before it reaches the handle.

**Measured**: `width` `I:0`, `enabled` `B:false`, `label` `S'hello world'`; `mode` `S'Fast'`, `mode is String` true,
`mode is Mode` false. The attribute's type is a name: `P3 types: width:EInt … mode:Mode tags:EString`, and
`enumerations.map(e => e.name).contains(a.type)` is true for `mode`, false for `label`. So D3 chooses the spelling
from the **attribute's type**, not from the value: integer and boolean by `is`, enumeration by membership of `a.type`
in `enumerations`, string otherwise. `enumerations[*].literals` lists `FAST, Fast, slow` with `value` `-1` each
(the D-layer literals hold `value: null` after the import: a side finding, §4).

### 1.4 Unset against default (prompt 1.4)

**Measured, D-layer** (log, `D object Sys/Sys_0`): `width` `["0"]`, `depth` `[]`, `enabled` `["false"]`, `ready`
`[]`, `note` `[]`. The D-layer knows what was set.

**Measured, JjEL**: `width(set 0)=I:0 depth(unset)=null enabled(set false)=B:false ready(unset)=null note(unset)=null`.

**Read.** `eval.ts:703` `handle[fname] = collapsed === null ? emptyAttributeDefault(meta) : collapsed;` and
`emptyAttributeDefault` (`eval.ts:732-796`): a declared default is returned (`:758-781`); else, for `lowerBound >= 1`,
the type's canonical default (`:786-791`: `false`, `0`, `""`, first literal); else `null` (`:794-795`).

So on a handle:

- optional attribute, no declared default: unset reads `null`, set reads its value: `eIsSet` holds as `o.a != null`;
- mandatory attribute: unset reads `false`/`0`/`""`/first literal, the same as a value set to it;
- declared default: unset reads the default, the same as a value set to it. **Not measured**: the import left
  `defaultValueLiteral: ""` on `level` (log, `D level attribute`) and the shell's `defaultValue` is `null`, so
  `level` read `null`;
- multi-valued: an empty list; Ecore's `eIsSet` on a list is non-emptiness too.

What D2 can say today: *a single-valued attribute is printed when it does not read `null`; a multi-valued one when
its list is not empty.* Exact for optional attributes with no default, which every attribute of the fixture and of
ArbiterSpec is; for the other two cases it prints the default. True `eIsSet` needs a new read of the slot's raw
`values` length (an `isSet(o, "a")` builtin or a sibling key), not available in JjEL today.

### 1.5 Text and emptiness (prompt 1.5)

**Read.** `templates.ts:216`: every call returns `host.evaluateBody(…)`, a Text, in expression mode as in text mode.
`context.ts:298-304`: «A Text is whatever `isText` recognises; JjEL never looks inside one.» The origins discovery
(§3) rejected making `+` return a Text for the same reason. By design.

**Measured**, `emptyT(x)` = text `${if x then "y" else ""}`, `emptyE(x)` = expression `if x then "y" else ""`:

```
P5 emptyT(false) == "": false        P5 emptyE(false) == "": false
P5 filter != "": 2                   P5 is String: false
P5 .isEmpty: null                    P5 .length: null
P5 String(): false                   P5 interp == "": false
P5 concat == "": false               P5 == null: false
P5 model test: 1
```

All silent: no generation error, no page error. **No documented way**: `command grep -rn -i -e 'empty text' -e 'text is empty' -e 'isEmptyText' -e 'emptiness'`
over `frontend/src/codegen`, `jjel/SPEC.md` and the codegen pilot spec returned one unrelated line (`templateCodec.ts:20`,
«non-empty text»), exit 0; positive control on the same command shape, `-e isText`, matched four files. A template must
test the model (`P5 model test: 1`), and a default generator decides «is there something to print» with a predicate on
the model, never on the Text it built.

### 1.6 Names (prompt 1.6)

**Measured**: `P6 count: 8 distinct names: 7` (two Parts `dup`, accepted by the import). Bare `dup` and `Part.dup` read
`null` (`eval.ts:265-266`, `:376-378`: a name shared within a class or the pool is not bound). `Part.size` and
`Part.FAST` resolve to the Parts of those names (`eval.ts:267`, a name is bound on the class shell unless it is a
structural key; `size` is not one). The 2026-09-19 homonym work is about classes of two metamodels; for objects
nothing enforces uniqueness at any scope.

A class with no `name` attribute: `Link has name attr: false`, yet `link name: S'Link_0'` (`eval.ts:580`
`result.name = obj.name`, the DObject's generated name). D1's «only if C has a `name` attribute» must test the
metaclass, never `o.name`.

D5 as written prints `main dup` for `Sys.main` (measured target `O:Part/dup`, the second `dup`): ambiguous on reading
back, and for a `Link` target it would print `Link_1`, a name no user gave. `buildContainmentPath` (`eval.ts:879`)
already names an object by its containment path for the ambiguity warning.

## 2. Proposal (to discuss)

### 2.1 What exists, what is missing

Everything a reflective default needs is readable today (§1.1-1.3): `slotsOf(o)` in the appendix already walks
`o.instanceOf`, its `superTypes` and every value by name. Missing or weak:

| Need | Today | Gap |
|---|---|---|
| all features of a class, in order | own lists + `superTypes` | a JjEL walk; or an `allAttributes`/`allReferences` on the shell (additive, `eval.ts:425`) |
| attribute bounds | `multiValued` only | `lowerBound` on the attribute shell (additive) if the grammar is to show optionality |
| target class of a reference | its name | lookup in `classes` by name; a shell field would avoid it |
| enum vs string | attribute type ∈ `enumerations` | none |
| unset | `null` for optional, no default | `isSet(o, f)` for the other cases |
| origin of a reflective read | none (§1.2) | `evaluateIndexAccess` calling `readObserver` for a string key, as the member read does: a JjEL change under R-GEN-10 |
| a reference's printed name | `name`, ambiguous | a naming rule (§3, D5) |

### 2.2 `defaultText(o)` — built-in or library

Recommended first: **a shipped generator written in JjEL**, untyped templates `obj(o)`, `feature(o, f)`, `value(a, v)`,
`ref(t)` and an EBNF set, imported like any generator (`GeneratorImportDialog`). No engine change; it fixes the rules
on real metamodels (CoreSpec, ArbiterSpec) before anything is frozen in TypeScript. A built-in in the engine is worth it
only for what JjEL cannot do: origins (fixable in the evaluator for every template, §2.1) and speed (O(objects ×
features) reads per generation under the 2000 ms budget, R-GEN-28; not measured at scale).

### 2.3 Overrides: the dispatch of P-2026-10-31-1235/1410 is the mechanism, for metaclasses

`templates.ts:183-197`: the typed template whose type is the most specific supertype of the first argument's class
wins, else the untyped one. An untyped `obj(o)` is the default; a typed `obj:Requester(o)` printing
`requester cpu priority 0` is the override; no name-based lookup is needed. Two limits:

- **Per feature** there is no dispatch: a feature shell has no `instanceOf`, so `metaclassOf` returns `null`
  (`dispatch.ts:83-86`) and only the untyped template runs; JjEL cannot call a template by a computed name. Today's
  way out (read, not measured): keep the object first in every hook, `kw(o, f)` and `feature(o, f)`, so a typed
  `kw:Core(o, f) = if f == "nregs" then "registers" else kw0(f)` overrides one keyword of one class through the same
  dispatch. Per-feature overrides become per-class overrides that branch on the feature name.
- A grouped list (`reg_reg add sub …`) or a shorthand is a typed override of the container's `obj`, which calls the
  default for the features it does not change. That requires the default to expose its per-feature template, not only
  `obj`.

### 2.4 The grammar

The class shells give every class, its supertypes, attribute types, multiplicity and containment (§1.1), so a second
template set over `classes` can print the EBNF the default produces, override-free part first. Sketch for the fixture
under the rules as amended in §3:

```
Sys      ::= "Sys" Name "{" ("width" INT)? ("depth" INT)? ("enabled" BOOL)? ("ready" BOOL)?
             ("label" STRING)? ("note" STRING)? ("mode" Mode)? ("tags" "[" STRING ("," STRING)* "]")? ("level" INT)?
             ("parts" "{" Part* "}")? ("links" "{" Link* "}")? ("main" Ref)? "}"
Part     ::= "Part" Name "{" ("size" INT)? ("kind" Mode)? ("peers" "[" Ref ("," Ref)* "]")? "}"
Link     ::= "Link" "{" ("weight" INT)? ("from" Ref)? ("to" Ref)? "}"
Mode     ::= "FAST" | "Fast" | "slow"
Name     ::= ID | STRING            -- an ID may be a keyword: the position after a class keyword is unambiguous
Ref      ::= Name | Path            -- §3, D5
```

An override's grammar cannot be derived from its JjEL body; an override has to declare its production, or the EBNF
covers the default only. Not asked now; noted because it bounds what «derived» can mean.

## 3. Review of the rules

| Rule | Verdict | What it needs |
|---|---|---|
| D1 | lossy | Lower-casing class names collides (`Sys`/`SYS`), and `graphOfLookup` already keeps the first of two equal names (`dispatch.ts:19`). Print the class name as declared, or lower-case only the first letter and fall back to the declared name on a collision. «`<name>` only if C has a `name` attribute» tests the metaclass (§1.6). A name that is not an identifier (`has space`, measured) is quoted. |
| D2 | incomplete | Multi-valued: `a [v1, v2]`, brackets so that zero, one and many parse alike; empty list not printed. «Unset»: as §1.4 says, exact only for optional attributes with no default. |
| D3 | unsound as written | An unquoted string clashes with D7 keywords and with literals (`kind FAST` against a string `FAST`, a Part named `FAST` measured). The type of the attribute disambiguates for a typed parser, a keyword does not. Recommended: strings always quoted; `name` and references as `Name` (ID or quoted). Literals printed as declared: lower-casing merges `FAST` and `Fast` (measured: both exist in `Mode`). |
| D4 | sound | Empty containment not printed (test the model, §1.5). The class keyword of each child stays, since the reference type may have subclasses. |
| D5 | unsound as written | Names are not unique and some objects have none (§1.6). Print the name when it is unique among the instances of the reference's type in the model; otherwise a containment path from the root (`parts[1]`, the `buildContainmentPath` idea); multi-valued `r [a, b]`. Needs Alfonso's choice of scope. |
| D6 | needs restating | Jjodel keeps no interleaved order (§1.1). Choose: supertypes' features first, then own (the reading order of a class), attributes before references within each; or the DObject order (own attributes, inherited attributes, references). The first is recommended. |
| D7 | too strong | Reserving every feature name forces quoting of ordinary names: in `arbiter3.xmi:12` a Requirement is named `priority` while `Requester.priority` is a feature. Keywords are only needed where a feature name starts a line; a `Name` position (after a class keyword or a reference keyword) can accept an ID equal to a keyword. Contextual keywords, quoting only non-identifiers. |

## 4. Risks and side findings

- Origins lost on `o[f]` (§1.2): a default would print text that is not clickable, contrary to what generated code
  offers today. Fix belongs to JjEL (R-GEN-10 surface), additive, in a lane of its own.
- `eIsSet` for mandatory or defaulted attributes (§1.4): the default prints values the user never set.
- Text emptiness is silent: `.isEmpty` on a Text is `null`, not an error (§1.5). A diagnostic on a member read of a
  Text would save the next author the measurement the prototype had to make.
- `Part.size` binds an instance named `size` on the class shell (§1.6): a template that reflects over a shell by
  name (`c[x]`) can get an instance instead of nothing. Not a problem for the default, which reads `attributes`.
- **Side finding (measured)**: the Ecore import kept no `defaultValueLiteral="7"` (`defaultValueLiteral: ""`) and no
  literal `value="1"`/`"2"` (`value: null`; the enumeration shell shows `-1`). The export side has the default
  commented out (`EcoreService.ts:316-317`). Not investigated further; a ticket candidate.
- Performance of a reflective walk on a large model: not measured.

## 5. Questions for Alfonso

1. D6: features of the supertypes first, then the class's own (recommended), or the DObject order?
2. D3: strings always quoted (recommended), or unquoted when an identifier and not a keyword?
3. D1/D3: class names and literals as declared (recommended), or lower-cased with a fallback on collision?
4. D5: a non-unique or nameless target as a containment path (recommended), or as `name#k`?
5. D2: accept «reads null / empty list» as «unset», or open a lane for an `isSet(o, f)` read?
6. Origins: make `o["f"]` notify `readObserver` like `o.f` (recommended, JjEL lane), so reflective output stays traceable?
7. First deliverable: a shipped JjEL generator (recommended) or a built-in `defaultText`?
8. Per-feature overrides through per-class dispatched hooks taking the object first (works today), or a new lookup?
9. D7: contextual keywords (recommended) or every feature name reserved?
10. Ticket the Ecore import's lost `defaultValueLiteral` and literal values?

## Appendix A — the templates run (JjEL, as stored; `T(name, params, body, mode)`)

```ts
const TEMPLATES = [
    T('tg', ['v'], String.raw`if v == null then "null" else if v is Boolean then "B:" + v else if v is Integer then "I:" + v else if v is Number then "N:" + v else if v is String then "S'" + v + "'" else if v is Array then "A[" + v.map(x => tg(x)).join(",") + "]" else "O:" + (v.instanceOf?.name ?? "?") + "/" + (v.name ?? "noname")`),
    T('shellOf', ['c'], String.raw`c.name + " abstract=" + c.isAbstract + " supers=[" + c.superTypes.map(s => s.name).join(",") + "] all=[" + c.allSuperclasses.map(s => s.name).join(",") + "]\n  A: " + c.attributes.map(a => a.name + ":" + a.type + " mv=" + a.multiValued + " def=" + tg(a.defaultValue) + " lb=" + tg(a.lowerBound) + " ub=" + tg(a.upperBound)).join("; ") + "\n  R: " + c.references.map(r => r.name + ":" + r.type + " cont=" + r.containment + " lb=" + tg(r.lowerBound) + " ub=" + tg(r.upperBound) + " mult=" + r.multiplicity + " typeIsString=" + (r.type is String)).join("; ")`),
    T('slotsOf', ['o'], String.raw`o.instanceOf.name + "/" + tg(o.name) + " own: " + o.instanceOf.attributes.map(a => a.name + "=" + tg(o[a.name])).join(" ") + " | inh: " + o.instanceOf.superTypes.map(s => s.attributes.map(a => a.name + "=" + tg(o[a.name])).join(" ")).join(" ") + " | refs: " + o.instanceOf.references.map(r => r.name + "=" + tg(o[r.name])).join(" ") + " | parent=" + tg(o.parent)`),
    T('emptyT', ['x'], String.raw`${if x then "y" else ""}`, 'text'),
    T('emptyE', ['x'], String.raw`if x then "y" else ""`),
    T('p5interp', [], String.raw`"${emptyT(false)}" == ""`),
    T('main', [], String.raw`P1 classes via o.instanceOf
${instances.map(o => o.instanceOf).map(c => c.name).distinct().map(n => shellOf(classes.filter(c => c.name == n).first)).join("\n")}
P1 Named: ${shellOf(Named)}
P1 chain: ${instances.map(o => o.instanceOf.name + "->" + o.instanceOf.superTypes.map(s => s.name).join(",")).distinct().join("; ")}
P1 same shell: ${Sys.instances.first.instanceOf == Sys} superShared: ${Sys.superTypes.first == Named}
P2 slots
${instances.map(o => slotsOf(o)).join("\n")}
P2 dot width: ${tg(Sys.instances.first.width)}
P2 idx width: ${tg(Sys.instances.first["width"])}
P2 computed idx: ${tg(Sys.instances.first["wid" + "th"])}
P2 idx multi attr: ${tg(Sys.instances.first["tags"])}
P2 idx containment: ${tg(Sys.instances.first["parts"])}
P2 idx via ref target: ${tg(Sys.instances.first.parts.first["size"])}
P2 allInstances idx: ${tg(Named.allInstances.map(o => o["name"]))}
P2 global instances idx: ${tg(instances.map(o => o["name"]))}
P2 idx missing: ${tg(Sys.instances.first["nosuch"])}
P2 idx id: ${tg(Sys.instances.first["id"])}
P2 idx instanceOf: ${tg(Sys.instances.first["instanceOf"])}
P2 idx parent: ${tg(Sys.instances.first.parts.first["parent"])}
P2 bare s1: ${tg(s1)}
P2 Part.size: ${tg(Part.size)}
P2 Part.FAST: ${tg(Part.FAST)}
P2 bare dup: ${tg(dup)}
P2 Part.dup: ${tg(Part.dup)}
ORIG dot=${Sys.instances.first.label} idx=${Sys.instances.first["label"]}
P3 enums: ${enumerations.map(e => e.name + "=" + e.literals.map(l => l.name + "/" + l.value).join(",")).join(" ")}
P3 types: ${Sys.attributes.map(a => a.name + ":" + a.type).join(" ")}
P3 modeIsEnum: ${enumerations.map(e => e.name).contains(Sys.attributes.filter(a => a.name == "mode").first.type)} labelIsEnum: ${enumerations.map(e => e.name).contains(Sys.attributes.filter(a => a.name == "label").first.type)}
P3 mode value: ${tg(Sys.instances.first.mode)} isString: ${Sys.instances.first.mode is String} is Mode: ${Sys.instances.first.mode is Mode}
P3 kinds: ${tg(Part.allInstances.map(p => p.kind))}
P4 width(set 0)=${tg(Sys.instances.first.width)} depth(unset)=${tg(Sys.instances.first.depth)} enabled(set false)=${tg(Sys.instances.first.enabled)} ready(unset)=${tg(Sys.instances.first.ready)} note(unset)=${tg(Sys.instances.first.note)} level(unset, default 7)=${tg(Sys.instances.first.level)} mode(set)=${tg(Sys.instances.first.mode)}
P4 parts size/kind: ${Part.allInstances.map(p => tg(p.name) + ":" + tg(p.size) + ":" + tg(p.kind)).join(" ")}
P4 links weight: ${Link.allInstances.map(l => tg(l.weight)).join(" ")}
P5 emptyT(false) == "": ${emptyT(false) == ""}
P5 emptyE(false) == "": ${emptyE(false) == ""}
P5 filter != "": ${[emptyT(false), emptyT(true)].filter(s => s != "").size}
P5 is String: ${emptyT(false) is String}
P5 .isEmpty: ${tg(emptyT(false).isEmpty)}
P5 tg(Text): ${tg(emptyT(false))}
P5 concat == "": ${"" + emptyT(false) == ""}
P5 .length: ${tg(emptyT(false).length)}
P5 String(): ${String(emptyT(false)) == ""}
P5 interp == "": ${p5interp()}
P5 == null: ${emptyT(false) == null}
P5 model test: ${[false, true].filter(x => x).size}
P6 names: ${instances.map(o => tg(o.name)).join(" ")}
P6 count: ${instances.size} distinct names: ${instances.map(o => o.name).distinct().size}
P6 D5 main: ${tg(Sys.instances.first.main)} peers: ${tg(Part.instances.first.peers)}
P6 link.to: ${tg(Link.instances.first.to)} link name: ${tg(Link.instances.first.name)} Link has name attr: ${Link.attributes.map(a => a.name).contains("name")}
P4 level default via shell: ${tg(Sys.attributes.filter(a => a.name == "level").first.defaultValue)}
END`, 'text'),
];
```

## Appendix B — the Preview of the second run (verbatim, 68 lines)

```
P1 classes via o.instanceOf
Sys abstract=false supers=[Named] all=[Named]
  A: width:EInt mv=false def=null lb=null ub=null; depth:EInt mv=false def=null lb=null ub=null; enabled:EBoolean mv=false def=null lb=null ub=null; ready:EBoolean mv=false def=null lb=null ub=null; label:EString mv=false def=null lb=null ub=null; note:EString mv=false def=null lb=null ub=null; mode:Mode mv=false def=null lb=null ub=null; tags:EString mv=true def=null lb=null ub=null; level:EInt mv=false def=null lb=null ub=null
  R: parts:Part cont=true lb=I:0 ub=I:-1 mult=* typeIsString=true; links:Link cont=true lb=I:0 ub=I:-1 mult=* typeIsString=true; main:Part cont=false lb=I:0 ub=I:1 mult=1 typeIsString=true
Part abstract=false supers=[Named] all=[Named]
  A: size:EInt mv=false def=null lb=null ub=null; kind:Mode mv=false def=null lb=null ub=null
  R: peers:Part cont=false lb=I:0 ub=I:-1 mult=* typeIsString=true
Link abstract=false supers=[] all=[]
  A: weight:EInt mv=false def=null lb=null ub=null
  R: from:Part cont=false lb=I:0 ub=I:1 mult=1 typeIsString=true; to:Link cont=false lb=I:0 ub=I:1 mult=1 typeIsString=true
P1 Named: Named abstract=true supers=[] all=[]
  A: name:EString mv=false def=null lb=null ub=null
  R: 
P1 chain: Sys->Named; Part->Named; Link->
P1 same shell: true superShared: true
P2 slots
Sys/S's1' own: width=I:0 depth=null enabled=B:false ready=null label=S'hello world' note=null mode=S'Fast' tags=A[S'a',S'b-c'] level=null | inh: name=S's1' | refs: parts=A[O:Part/dup,O:Part/dup,O:Part/size,O:Part/FAST,O:Part/has space] links=A[O:Link/Link_0,O:Link/Link_1] main=O:Part/dup | parent=null
Part/S'dup' own: size=I:1 kind=S'FAST' | inh: name=S'dup' | refs: peers=A[O:Part/size,O:Part/dup] | parent=O:Sys/s1
Part/S'dup' own: size=I:2 kind=S'slow' | inh: name=S'dup' | refs: peers=A[] | parent=O:Sys/s1
Part/S'size' own: size=I:3 kind=null | inh: name=S'size' | refs: peers=A[] | parent=O:Sys/s1
Part/S'FAST' own: size=null kind=S'Fast' | inh: name=S'FAST' | refs: peers=A[] | parent=O:Sys/s1
Part/S'has space' own: size=null kind=null | inh: name=S'has space' | refs: peers=A[] | parent=O:Sys/s1
Link/S'Link_0' own: weight=I:5 | inh:  | refs: from=O:Part/dup to=O:Link/Link_1 | parent=O:Sys/s1
Link/S'Link_1' own: weight=null | inh:  | refs: from=O:Part/dup to=null | parent=O:Sys/s1
P2 dot width: I:0
P2 idx width: I:0
P2 computed idx: I:0
P2 idx multi attr: A[S'a',S'b-c']
P2 idx containment: A[O:Part/dup,O:Part/dup,O:Part/size,O:Part/FAST,O:Part/has space]
P2 idx via ref target: I:1
P2 allInstances idx: A[S's1',S'dup',S'dup',S'size',S'FAST',S'has space']
P2 global instances idx: A[S's1',S'dup',S'dup',S'size',S'FAST',S'has space',S'Link_0',S'Link_1']
P2 idx missing: null
P2 idx id: S'Pointer1793550503533_USER_34'
P2 idx instanceOf: O:?/Sys
P2 idx parent: O:Sys/s1
P2 bare s1: O:Sys/s1
P2 Part.size: O:Part/size
P2 Part.FAST: O:Part/FAST
P2 bare dup: null
P2 Part.dup: null
ORIG dot=hello world idx=hello world
P3 enums: Mode=FAST/-1,Fast/-1,slow/-1
P3 types: width:EInt depth:EInt enabled:EBoolean ready:EBoolean label:EString note:EString mode:Mode tags:EString level:EInt
P3 modeIsEnum: true labelIsEnum: false
P3 mode value: S'Fast' isString: true is Mode: false
P3 kinds: A[S'FAST',S'slow',null,S'Fast',null]
P4 width(set 0)=I:0 depth(unset)=null enabled(set false)=B:false ready(unset)=null note(unset)=null level(unset, default 7)=null mode(set)=S'Fast'
P4 parts size/kind: S'dup':I:1:S'FAST' S'dup':I:2:S'slow' S'size':I:3:null S'FAST':null:S'Fast' S'has space':null:null
P4 links weight: I:5 null
P5 emptyT(false) == "": false
P5 emptyE(false) == "": false
P5 filter != "": 2
P5 is String: false
P5 .isEmpty: null
P5 tg(Text): O:?/noname
P5 concat == "": false
P5 .length: null
P5 String(): false
P5 interp == "": false
P5 == null: false
P5 model test: 1
P6 names: S's1' S'dup' S'dup' S'size' S'FAST' S'has space' S'Link_0' S'Link_1'
P6 count: 8 distinct names: 7
P6 D5 main: O:Part/dup peers: A[O:Part/size,O:Part/dup]
P6 link.to: O:Link/Link_1 link name: S'Link_0' Link has name attr: false
P4 level default via shell: null
END
```
