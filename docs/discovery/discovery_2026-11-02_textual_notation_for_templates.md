# Discovery: how far the default textual notation goes for template and library models

Prompt-ID: P-2026-11-02-1942 · Chat: C-2026-11-02-1541 · Front: hw-notation · Date: 2026-11-02
Read-only. Probes in `~/.jjodel-lanes/P-2026-11-02-1942/` (outside the repo); no product code touched.

## 0. Answer in brief

The default notation (R-TXT, `frontend/src/codegen/textual/`, T1 to T4a-1) **round-trips** a library, a template
fragment and a Brief with expression trees, and it is **fast enough** at 2,500 objects. It is **not a way to write
expressions by hand**, it has **no infix form** for a class, and a model **cannot refer to an element of another model**
in it.

1. **Deep trees.** A 41-object fragment (library with three instructions, a template `for each` with a substitution, a
   Brief) goes text to model to text with 0 errors and an identical second print. At 2,152 to 2,448 objects, balanced
   trees (depth 11 to 15): print 8.8 to 16.2 ms, parse 15.0 to 22.4 ms, text 417 to 461 KB (about 190 bytes and 4.3 lines
   per object). Time is superlinear above that: 11,408 objects 225 / 240 ms, 32,616 objects 4.5 s / 5.3 s. **Depth is
   the limit, not size:** a left-deep chain (`a + b + c + ...`) fails with a stack overflow beyond **500 nested levels in
   print and 375 in parse** (node 22 default stack); a chain of 2,500 objects (about 1,200 levels) does not print. The
   text of a deep chain also grows with the square of the depth (852 objects: 2.6 MB).
2. **Writing by hand.** Unusable for expressions. `rs1 + rs2` (9 characters) is 64 characters on 8 lines; the
   conditional of `SLT` (47 characters) is 533 characters on 38 lines (11.3 times), 221 characters even with all
   whitespace folded to single spaces (4.7 times). The shortest form the existing annotations allow and the style check
   accepts is still 481 characters on 34 lines (10.2 times). It is fine for everything that is not an expression.
3. **Custom concrete syntax for a class.** **Not applied.** R-TXT-16 (3) lists "a class as a binary operator" among the
   level-3 annotations and `annotations.ts:21,28` stores `operator {symbol, precedence, assoc}`, validated, with the
   notice "stored, not applied yet" (probe: printing is unchanged). It is not in the nine annotations of step T4
   (discovery of 2026-11-01 §A.7) and §A.3 designs only the binary case. The least that is needed is an **expression
   sub-language derived from a small closed set of class annotations** (binary, prefix, ternary, call, postfix, atom),
   not a parser hook per class and not a second hand-written grammar (§5).
4. **References to another model.** **No.** The parser resolves only against the objects of the same text; the printer
   skips a target that is not among the objects, and what it then prints does not parse (a defect, §4, ticket opened).
5. **Recommendation: extend it, narrowly; owner: the front `codegen`.** Use the default notation as it is for the
   Library, Brief and Pattern skeletons; keep the prototype's own notation for expressions until the sub-language of
   point 3 exists; do the cross-model reference first, because the Brief to Library link needs it with or without
   expressions. The hypothesis on `codegen` held (§6).

What was not measured: the Monaco editor with a 400 KB text, the browser's stack depth, and applying a parse to a model
(step T6 is not on the trunk). The metamodel of the probe is a stand-in (§1).

## 1. What was run, and how

Source: the excerpts of the prototype's `brief-kernel-example.md` (an instruction with an expression semantics, a
template fragment with a `for each` and a substitution, a Brief). The probes import the real modules
(`baseGrammar`, `concreteGrammar`, `annotations`, `styleCheck`, `parser`, `printer`) and are bundled with the repo's
`esbuild` and run with node 22.23.3 (`probe1` to `probe5`, `.ts` and `.out` in the lane directory). Timings: median of 5
runs of print then parse in one process, wall clock `performance.now()`, no UI.

The metamodel (`probe1.ts`) has: `Expr` with `Ref(name)`, `Const(value)`, `Add`, `Sub`, `Le`, `Eq` (two single
containments `left`, `right`), `Not`, `Cond(test, then, else)`, `Call(fn, args*)`, `Subst(source, bindings*)`; `Instruction`
(name, group enum, writes, `result`, `next`), `Library`; `Wire`, `ForEach(var, over, where, arms*)`, `Arm`, `Binding`;
`Brief(name, xlen, library -> Library, operations -> Instruction*)`. It is a stand-in to measure the notation: the
`for each` variable, its `where`, the arm's guard `is_<op>` and the substitution's source `op.result` are strings, not
modelled expressions. How the prototype models those is a design question of the prototype, not answered here.

## 2. Q1: deep containment trees

Round trip of the fragment (`probe1.out`): `Library rv32i` with `ADD`, `SLT` (the conditional with `bitxor`) and `BEQ`
(`next`), the `Wire wdata` with its `ForEach` and a four-binding `Subst`, and `Brief rv_pf32`. 41 objects printed, 41
parsed, `errors 0`, `recovered 0`, `isApplicableParse` true, second print identical to the first.

Scale (`probe2.out`, `probe2-near2500.out`; shape = how the Add nodes nest; the "uses" are real references to `Decl`
objects by name, as in the Brief):

| Shape | Objects | Text | Print | Parse | Result |
|---|---|---|---|---|---|
| balanced, 100 decls | 2,152 | 417 KB, 9,334 lines | 16.2 ms | 22.4 ms | stable |
| balanced, 400 decls | 2,448 | 421 KB, 9,616 lines | 12.1 ms | 15.9 ms | stable |
| balanced, 1 decl | 2,251 | 461 KB, 10,126 lines | 8.8 ms | 15.0 ms | stable |
| balanced, 100 decls | 2,852 | 583 KB, 12,484 lines | 20.3 ms | 35.1 ms | stable |
| balanced, 400 decls | 11,408 | 2.7 MB, 49,936 lines | 225 ms | 240 ms | stable |
| balanced, 1,000 decls | 32,616 | 8.7 MB, 143,272 lines | 4.46 s | 5.30 s | stable |
| left-deep chain | 2,500 | n/a | stack overflow in print | n/a | fails |

The object count is the size of the whole tree; the authored size of the prototype's example is far smaller (the
conditional of `SLT` is 11 objects, so 32 instructions are in the hundreds). About 2,500 objects is the scale of an
expanded template, not of what a person writes. Going from 2,852 to 11,408 objects (4.0 times) costs 11 times in print;
from 11,408 to 32,616 (2.9 times) costs 20 times. The cause was not profiled; the printer looks the name up with a scan of
all objects per reference (`printer.ts:88`) and the resolver does the same (`parser.ts:583`), which is quadratic in the
number of references. Read, not confirmed.

Depth (`probe2-limits.out`, binary search, left-deep chain): print succeeds up to **500** nested `Add` levels (1,102
objects, 4.55 MB of text), parse up to **375** levels (852 objects, 2.57 MB). Both recurse once per nesting level through
`emit`, `value` and `object` (`printer.ts:125-207`; the parser mirrors it), so the limit is the engine's stack; a browser's
is not the same as node's and was not measured. The text size is quadratic in depth because each level indents by 4
spaces (`Add {` and `left {`): at 200 levels, 741 KB for 502 objects. Real expressions are shallow (the conditional of
`SLT` nests 6 levels); a long left-associated chain such as `a + b + c + ...` of 400 terms is the case that breaks.

## 3. Q2: usable by hand for expressions?

The form the notation prints is not the one in the prompt (`Add { left Ref { name a } right Const { value 1 } }`). Every
single containment is a block of its own, and the name moves into the head (R-TXT-3):

```
result {
  Add {
    left {
      Ref rs1 {}
    }
    right {
      Ref rs2 {}
    }
  }
}
```

Characters of the expression alone, from the span of its root object (`probe4.out`). "Infix" is the example's own form.
"One line" folds all whitespace to single spaces, a lower bound for any block layout.

| Expression | Infix | Default, as printed | Default, one line | Best valid annotated, as printed | Best valid, one line |
|---|---|---|---|---|---|
| `ADD` result `rs1 + rs2` | 9 | 64 (8 lines, 7.1x) | 48 (5.3x) | 58 (8 lines, 6.4x) | 42 (4.7x) |
| `SLT` result, 11 objects | 47 | 533 (38 lines, 11.3x) | 221 (4.7x) | 481 (34 lines, 10.2x) | 189 (4.0x) |
| `BEQ` next, 10 objects | 30 | 360 (34 lines, 12.0x) | 186 (6.2x) | 317 (32 lines, 10.6x) | 161 (5.4x) |

"Best valid annotated" is what the annotations that exist today allow: `Ref` and `Const` on one line
(`layout: line`), `Const.value` positional (`keyword: ''`), `roots: uncontained`. The style check returns no error on it
and the text round-trips. Two shorter forms were tried and refused (`probe3b.out`), correctly:

- `Ref` and `Const` both with keyword `''`: `styleCheck` error `distinct-classes` ("the keyword "" starts 2 classes") and
  "not LL(1)"; the printed text does not parse.
- `left` and `right` both `inline`: `styleCheck` error "not LL(1)". Worse, an `Add` with only `right` set prints as one child
  and reads back as `left` (`{"left":"t3"}`); the check is what keeps this out.

Verdict: the SLT conditional takes 34 to 38 lines in any layout the notation can produce, against one line of infix.
Reading it back is as hard as writing it. For the other parts of the example (Library properties, Brief, the Pattern and
Template skeletons, ontological instances) the default form is a block per object, close to what the example shows with
`ADD : Instruction { group reg_reg ... }` (the default prints `Instruction ADD {` and one feature per line; the example's
one-line form is `layout: line`, which the notation refuses on a class that has a containment, such as `Instruction`
with `result`; `annotations.ts:23`).

## 4. Q4 first, since the Brief depends on it: references to another model

Read: the parser resolves a name among the objects of the same text (`parser.ts:574-591`, "no object of type X is named
Y") and a path from the top-level objects of the same text (`:593-610`). The printer's `resolve` returns nothing for an id
that is not among the objects and the value is skipped (`printer.ts:91,161,188`). The textual tab builds its view from one
model (`TextualTab.tsx:113-115`, `extentModelId: modelId`). The discovery of 2026-11-01 names cross-model references only
as a risk for deletion and identity (§1.4 point 5, §3, §A.5; R-TXT-26 refuses to apply a deletion of an object other models
reference).

Run (`probe5.out`):

- A hand-written `Brief rv_pf32 { xlen 32  library rv32i  operations [ADD, SLT] }` with the library absent from the text:
  3 errors ("no object of type Library is named "rv32i"", and one per instruction), nothing applicable, the references
  dropped from the recovered object.
- A Brief whose `library` and `operations` hold ids of objects in another model prints
  `library` (a bare keyword) and `operations []`. That text does not parse: `4:15 expected an integer; found "]"`. So the
  printer is not total over a model with a cross-model reference. Ticket in the lane inbox.

What a text needs to name an element of another model: a way to say which model (an import or a qualified name), a
resolver that is given the project's models, and a decision on how R-TXT-4 uniqueness ("a name unique among the instances of
the reference's type") extends across models. None exists. It is independent of expressions and is the first thing the
Brief to Library link needs.

## 5. Q3: custom concrete syntax for a class

Rows and code:

- **R-TXT-16 (3)** (`docs/decisions.md:6993-7002`): the level-3 annotations "adjust the result locally: a feature's keyword,
  a class printed on one line or positionally, a list of enumeration values grouped by subsets, a class as a binary operator
  with symbol and precedence". Level 1 and 2 cannot be edited and "no hand-written grammar in v1".
- No other R-TXT row mentions operators (a search of `docs/decisions.md` finds R-TXT-16 only); the 2026-11-01 discovery says
  "no expressions, in v1" (lines 414 and 441).
- **Discovery §A.3** (lines 621-624): "Binary operator is used by neither metamodel. Design for when it is: a class
  annotated `operator: {symbol, precedence, assoc}` over two containment features of the same type yields precedence
  climbing, `E_p ::= E_{p+1} (op_p E_{p+1})*` per level plus `"(" E ")"`, unambiguous when (symbol, precedence) pairs are
  distinct and associativity is declared." Designed, not scheduled: the plan of §A.7 (T1 to T10, lines 805-814) does not
  list it and T4's acceptance is "annotations 1-9".
- **Code**: `annotations.ts:21-30` `OperatorAnnotation`, "Stored and validated, not applied yet"; `:249-257` validates it
  and emits the notice. The derivation (`concreteGrammar.ts`) does not read it (no match for `operator` in the module
  other than `annotations.ts`). Probe: with `Add` annotated `+`, precedence 6, left, the printed text is the same as with
  the same annotations and no operator (compared by eye, `probe3.out` lines 25-43 against 82-100).

What the example's expressions need, against what the stored annotation would cover (`syncrtl-text.md` of the prototype,
lines 42-55, is the grammar the example says it uses):

| Needed | Covered by the stored `operator` |
|---|---|
| binary `+ - == <=`, left or right associative | yes, once applied (and `->`, `|`, `&` if n-ary is added) |
| prefix `!x` | no |
| ternary `c ? a : b` (right associative, loosest) | no |
| call `bitxor(a, b)`, `sext(x, 8)` | no |
| postfix `x[i]`, `x[hi:lo]` | no |
| atoms: name, int, `true`, sized literal `1'd0`, concat `{a, b}` | no |
| the template's `op.result [rs1 := a, ...]` | no (a model class, not syntax of the language) |

The least that would be needed, as three candidates:

- **A parser hook per class**: a function in TypeScript per annotated class. Cheapest to start, but it leaves the data
  model (R-TXT-14, R-TXT-16: the notation is data, derived, and its unambiguity checked mechanically by `styleCheck`),
  and the printer and the parser would have to agree by hand on each.
- **A second grammar**: a separate hand-written grammar for expressions. Excluded by R-TXT-16 for v1, duplicates the
  language that JjEL and the prototype already have, and needs a bridge for the objects it builds.
- **An expression sub-language derived from annotations (recommended)**: a closed set of class annotations (`binary` with
  symbol, precedence and associativity, which is the stored `operator`; `prefix`; `ternary`; `call` with a name and an
  ordered containment; `postfix` for index and slice; `atom` for a token feature) and one feature-level annotation that
  prints a containment as an expression in line (`result rs1 + rs2`) instead of a `result { ... }` block. The grammar for
  the expression position is derived by precedence climbing, printing parenthesizes by precedence, and `styleCheck`
  extends its LL(1) test to it. It stays data, keeps the round trip testable, and costs a derivation and a printer path,
  not a language. Cost was not estimated by running anything.

## 6. Q5: recommendation and owner

**Extend it, narrowly, and keep the prototype's own notation for expressions meanwhile.**

1. Use as is: Library, Brief, Pattern and Template skeletons, ontological instances, as the default prints them (verified
   round trip, §2). They are readable and diffable; they are not yet a pleasant authoring surface for a person, which is
   what annotations `layout`, `inline`, `groupBy` already improve for the example's non-expression parts.
2. Extend first: **a reference to an element of another model** (§4), with the printer made total over dangling
   references. It is the precondition of the Brief naming a library, independent of everything below.
3. Extend second: **the expression sub-language** of §5, in three increments that each ship alone: apply `operator`
   (binary), then `prefix` and `ternary`, then `call` and `postfix`. Add an iterative or depth-guarded print and parse (or
   a documented depth limit) at the same time: 500 and 375 levels are enough for authored expressions and not for
   generated ones.
4. Until then the prototype keeps its own notation for expressions; nothing here replaces it.

**Owner: the front `codegen`.** The hypothesis was tested against the repository: `frontend/src/codegen/textual/` is
that front's (T1 to T4a-1 are its entries, `docs/log-inbox/codegen.md` lines 1147 and 1160, merged by `5467088b7` and
`c41033a9a`), and all three pieces touch only files there (`annotations.ts`, `concreteGrammar.ts`, `parser.ts`,
`printer.ts`, `styleCheck.ts`) plus the model view in `ui/TextualTab.tsx` for the cross-model resolver. The only part
that reaches another front is the resolver's source of "the project's other models", which is a read of the store the
tab already uses. `hw-notation` stays the consumer: it owns what the template and library models must say, not the
notation's engine.

## 7. Layer Impact Report

Not required: read-only, no file under the critical zone read for change, no code written.

## 8. Decisions awaiting Alfonso

- Whether the template's `for each`, `where`, guard and substitution source are modelled expressions or strings in the
  prototype's metamodel. The size of the sub-language depends on it (§1).
- Whether the cross-model reference (§4) opens as a codegen lane now, ahead of the expression work.
