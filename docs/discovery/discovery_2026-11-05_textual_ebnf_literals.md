# Discovery: editable literals in the EBNF mode (R-TXT-48)

- Prompt-ID: P-2026-11-05-0746 (`docs/prompts/claude_2026-11-05_0746_prompt_textual_ebnf_literals_discovery.md`)
- Session: `003c547c-d7f9-464b-99c6-40111afbbdf0`
- Tree: `~/jjodel-w-ebnflit`, branch `textual-ebnf-literals`, HEAD `dddab23b9` (the prompt's commit on `c4e446a9e`), clean at start
- Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
- Read only. Probe in the lane folder: `~/.jjodel-lanes/P-2026-11-05-0746/probe_literals.ts`, its output `probe_literals.out.md` (bundled with the worktree's esbuild, run with node).

This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the real files.

## 0. Objective and hypotheses

R-TXT-48: in the EBNF mode only the text between quotes is editable; each literal carries the record field it comes from; an
edit goes into the Syntax form's draft with its checks and its Save. Step 1 the literals of single elements, step 2 the
style tokens as overrides on `style.base`.

Hypotheses under test, each answered in the section named.

- **H1** Every quoted literal of `concreteGrammarEbnf` comes from exactly one place: an annotation field (or its default), a
  style token, a fixed token of the grammar, or a metamodel name. **Holds** (§1.3, measured on 6 grammars, 191 literals).
- **H2** The grammar nodes already carry enough to know a literal's origin. **Falsified** for `kw`/`p` nodes: they hold only
  `text` (and `tight`); the origin is recoverable only by position (§1.2, §1.4). Holds for the expression's operators
  (`ExprOperator.cls`) and for the block, list and expression tokens, whose role is their slot in the node.
- **H3** A read-only Monaco model can host editable islands without fighting Monaco's undo. **Holds** with an overlay input
  (content widget) and no edit of the model; **falsified** for a writable model reverted outside the islands (§2).
- **H4** An EBNF edit can reuse the Syntax form's draft, checks and Save as they are. **Partly**: `setField`, `readDraft`,
  `saveGate`, `recordToSave` are reusable unchanged; the draft itself lives inside `SyntaxForm` and must be lifted so that
  the EBNF and the form share it (§3).
- **H5** Step 2 needs no change to the printer and the parser. **Holds** if the overrides are folded into the `NotationStyle`
  before the derivation, with `reservedNames` and `emptyBlock` recomputed (§4). It needs the record, the resolution, the
  style check and the picker.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/concreteGrammar.ts` (whole, 740 lines)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/style.ts` (whole)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/annotations.ts` (lines 1-150, 195-326)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/syntaxRecord.ts` (whole)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/syntaxForm.ts` (lines 1-110, 218-652; the outline of 110-218)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/styleCheck.ts` (lines 1-290)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/parser.ts` (lines 239-373, the tokenizer; grep of the rest)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/printer.ts` (grep of its style and node reads only)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/ui/TextualTab.tsx` (lines 836-970, 1296-1465; grep of the rest)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/ui/SyntaxForm.tsx` (lines 1-103; grep of the rest)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/ui/textualMonaco.ts` (grep: EBNF language, theme rules)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/ui/openTextualTab.tsx` (lines 15-88, `writeTextualSyntax`)
- `/Users/alfonso/jjodel-w-ebnflit/frontend/src/codegen/textual/__tests__/portCorpus.ts` (lines 13-60), `boolCorpus.ts` (lines 16-85)

Not read: `printer.ts` and `parser.ts` beyond the windows above, `languageService.ts`, `textMatch.ts`, `textDiff.ts`. The
claims on the printer and the parser in §4 rest on those windows and greps, and say so.

## 1. Origins

### 1.1 How the EBNF is printed

`concreteGrammarEbnf` prints each rule with `nodeText`, and every quoted literal goes through one helper
(`concreteGrammar.ts:667`, `const quoted = (s: string): string => \`"${s}"\`;`), called from five node kinds:

- `kw` and `p`: `case 'kw': case 'p': return quoted(n.text);` (`:689`)
- `list`: `${quoted(n.open)} [${item} {${quoted(n.separator)} ${item}}] ${quoted(n.close)}` (`:697`)
- `block`: `[...n.open.map(quoted), ...items, ...n.close.map(quoted)]` (`:700`); `n.empty` is **not** printed
- `expr`, through `exprAlternatives`: the operator symbol `quoted(o.symbol)` (`:716`), the call word `quoted(o.call)`, the
  expression's `open`, `separator`, `close` (`:726`, `:728`)

Comments `(* ... *)` hold no editable text: the operator's class and precedence (`:721`), the call form (`:726`) and the
name pattern `(* else name = ${n.derive.source} *)` (`:682`).

### 1.2 Where each literal is created (read, `concreteGrammar.ts`)

| Origin | Record field (syntaxForm `FieldId`) | Created at | Node |
|---|---|---|---|
| class keyword | `classes[id].keyword`, default `applyCase(cls, classCase)` | `:302`, emitted `:560` `const head ... [{ t: 'kw', text: sh.keyword }]` (also the call head, `:572`) | `kw` |
| feature keyword (word or punctuation) | `features[id].keyword`, default the feature name | `:407-411` `keywordOf`, emitted `:505` `[/^\w/.test(kwText) ? { t: 'kw', text: kwText } : { t: 'p', text: kwText }]` | `kw` or `p` |
| per-item keyword | `features[id].itemKeyword` | `:534` `{ t: 'kw', text: itemKw }` | `kw` |
| name keyword | `classes[id].name.keyword` | `:578` `{ t: 'kw', text: sh.nameKeyword }` | `kw` |
| enum group name | `enums[id].subsets[i].name` | `:488` `{ t: 'kw', text: s.name }` | `kw` |
| operator symbol | `classes[id].operator.symbol` | `:386` `operators.set(cls, { cls, symbol: op.symbol, ... })` | `ExprOperator` |
| call word | `classes[id].operator.call`, default the class keyword | `:384` `call = op.call ?? (shapes.get(cls)?.keyword \|\| applyCase(cls, classCase))` | `ExprOperator` |
| enum literal | none: the metamodel's literal name, cased | `:476`, `:642` `{ t: 'kw', text: applyCase(l, literalCase) }` | `kw` |
| `style.assign`, `style.terminator` | style | `:115` `tokens(ts)`, called `:525`, `:545`, `:551` | `kw`/`p` |
| `style.blockOpen`, `style.blockClose` | style | `:395` `block(items)` | `block.open`/`.close` |
| `style.list.*` | style | `:548` list node; the call's separator `:569` `{ t: 'p', text: style.list.separator, tight: 'before' }`; the expression's `:621` `separator: style.list.separator` | `list`, `p`, `expr` |
| fixed `(` `)` of a call, of an expression | none | `:572` `{ t: 'p', text: '(', tight: 'around' }`, `:621` `open: '(', close: ')'` | `p`, `expr` |

What a node keeps (`:48-50`): `{ readonly t: 'kw'; readonly text: string }` and `{ readonly t: 'p'; readonly text: string;
readonly tight?: 'before' | 'around' }`. A `kw` does not say whether it is a class keyword, a feature keyword, an item
keyword, a name keyword, a group name, a literal or a style word: H2 is falsified for these two nodes. The call word
default makes one dependency visible: with no `operator.call`, the call word follows the class keyword, so an edit of the
class keyword moves the call word too, and an edit of the call word writes `operator.call` (an n-ary operator's own rule
is dropped from the EBNF, `:637-640`, so its class keyword is not printed elsewhere).

### 1.3 The probe (measured, HEAD `dddab23b9`)

`probe_literals.ts` derives six grammars through the corpus helper `boolGrammar` (the same path as `textualNotation`),
walks each one in `nodeText`'s order and names the origin of every quoted literal by its position, then checks (a) that
the walk yields the quoted strings of `concreteGrammarEbnf` (comments stripped), same count, same order; (b) that a style
token's text equals the style parameter it names. The four corpus grammars cover no enumeration, grouping, name keyword
or list; the two synthetic Library grammars (`Library` with `tags: EString[*]`, `books` grouped by `Book.genre` over the
subsets `prose`/`verse`, name keyword `called`, `Book` one-line, `pages` keyword `pp`) cover them.

```
Library C-like (synthetic): ebnf 28, walked 28, same true, wrong 0, unknown 0, origins 20
Library Pascal (synthetic): ebnf 44, walked 44, same true, wrong 0, unknown 0, origins 23
port C-like: ebnf 21, walked 21, same true, wrong 0, unknown 0, origins 16
port Pascal: ebnf 23, walked 23, same true, wrong 0, unknown 0, origins 17
BOOL C-like: ebnf 34, walked 34, same true, wrong 0, unknown 0, origins 17
BOOL Pascal: ebnf 41, walked 41, same true, wrong 0, unknown 0, origins 19
PROBE: all cases agree
```

| Grammar | Literals | Element (step 1) | Style token (step 2) | Fixed | Enum literal (metamodel) |
|---|---|---|---|---|---|
| port C-like | 21 | 10 | 5 | 6 | 0 |
| port Pascal | 23 | 10 | 7 | 6 | 0 |
| BOOL C-like | 34 | 14 | 14 | 6 | 0 |
| BOOL Pascal | 41 | 14 | 21 | 6 | 0 |
| Library C-like | 28 | 15 | 7 | 0 | 6 |
| Library Pascal | 44 | 15 | 23 | 0 | 6 |
| **Total** | **191** | **78** | **77** | **24** | **12** |

The first run reported one unknown origin, BOOL Pascal's `;` after `when=Expr_`: the terminator that closes an
expression is spread into the block's items (`:524-525`, `[el, ...tokens(style.terminator)]`, then `:537`), not inside a
sequence; and it read `"atoms"` as a terminator, a containment keyword having a `block` after it and no `assign` in its
sequence. Both were rules of the probe, fixed in it and rerun. The fix is the evidence for §1.4: inferring the origin by
position takes rules that restate the derivation's shapes, and the first version of those rules was wrong twice.

Occurrences per origin (from `probe_literals.out.md`): an element literal can appear several times, `Book`, `genre` and
`pp` three times each in Library (the rule `Book` and the two group rules `Book_prose`, `Book_verse` derived from it,
`:477`); an n-ary operator's symbol twice per alternative (`:719`); `{`/`}` 6 times in BOOL, `begin` 6, `end` 6, `;` 7 in
BOOL Pascal (6 closing a block, 1 closing the expression). A literal is not the unit of an edit: its origin is.

The port grammar in C-like, as the probe printed it:

```
Module ::= "Module" [name=NAME] "{" {"input" inputs+=Port} {"output" outputs+=Port} "}" ;
Port   ::= [name=NAME] ":" type=Type_ ["=" driver=Expr_] ;
Word   ::= "Word" "(" width=INT ")" ;
Expr_  ::= ops+=Expr_ "&" ops+=Expr_ {"&" ops+=Expr_} (* Conj, n-ary, precedence 1 *)
         | "and" "(" [ops+=Expr_ {"," ops+=Expr_}] ")" (* Conj, call form *)
```

`"input"` is `features[F_Module_inputs].itemKeyword`, `":"` is `features[F_Port_type].keyword` (a punctuation keyword),
`"&"` is `classes[C_Conj].operator.symbol`, `"and"` is `classes[C_Conj].operator.call`, `"Word" "(" ... ")"` is the class
keyword then the two fixed tokens of the call layout, `","` is `style.list.separator`.

### 1.4 What is missing to carry the origin

Two ways, both shown feasible by the probe:

- **(A) an optional `src` on `kw` and `p`**, set where the node is created (the rows of §1.2), and a printer
  `concreteGrammarEbnfSpans(g): { text, literals: { start, end, text, src }[] }` that `concreteGrammarEbnf` wraps, its
  text byte for byte unchanged. Blocks, lists and expressions need no new field: the printer knows which slot it is
  printing (`open[i]`, `separator`, `operators[k].symbol`). Names, not ids: the grammar is id-free today, and
  `syntaxForm.ts`'s `contextOf` (`:122`) already maps a class name and an `Owner.f` to their ids. A sketch:
  `src?: { k: 'class' | 'nameKeyword'; cls } | { k: 'feature' | 'itemKeyword'; feature: 'Owner.f' } | { k: 'subset';
  enumName; index } | { k: 'literal'; enumName } | { k: 'style'; param: 'assign' | 'terminator'; index } | { k: 'fixed' }`.
  Adding an optional property to the exported `GrammarNode` is allowed (NON-NEGOTIABLE 11). Risk measured: one test
  compares grammar rules deep, `annotations.test.ts:293` `expect(empty.rules).toEqual(plain.rules);`, between an empty
  record and none; the `src` is the same in both (an origin is a role, not the presence of an annotation), so it stays
  equal. `tokens(ts)` (`:115`) gains the parameter name. The printer's identity set `classKeywords.has(n)`
  (`printer.ts:504`) is unaffected.
- **(B) a side table from a second walk**, as the probe does: no change to the nodes, but a second copy of `nodeText`'s
  order and of the derivation's shapes (the two probe bugs above), which drifts the day a shape changes.

Recommendation: (A). The derivation is the one place that knows the origin, at the line that creates the node.
