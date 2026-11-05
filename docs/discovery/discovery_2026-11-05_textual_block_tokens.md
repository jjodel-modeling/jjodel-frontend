# Discovery: block tokens per element (R-TXT-51)

Prompt: P-2026-11-05-1525 (`docs/prompts/claude_2026-11-05_1525_prompt_textual_block_tokens_discovery.md`), chat
C-2026-11-03-1037, front codegen. Branch `textual-block-tokens` at `09748cf30` (the prompt's commit on `2c15d1761`, the
L2a tip). Read only: no source file changed. Probes in the lane folder `~/.jjodel-lanes/P-2026-11-05-1525/`
(`probe_block_tokens.ts` and its output `probe_block_tokens.out.txt`; `probe_form_field.ts` and `probe_form_field.out.txt`),
bundled with the worktree's esbuild and run with node, not committed.

## 0. Objective and hypotheses

R-TXT-51 asks for block tokens per element on top of the language-wide tokens of L2a (R-TXT-48 (2)), to reach

```
begin program
   declaration is
      ...
   end
end program
```

Hypotheses this discovery tries to falsify:

- **H1.** The printer and the parser already read a block's tokens off its grammar node, not off the style, so a
  per-node token needs no change in either, except the tokenizer's punctuation and the reserved names.
- **H2.** The checks that guard block tokens (`block-delimiters`, `reserved-words`, `style-tokens`, the `taken` check of
  a punctuation keyword) read only the style, so a per-block token passes them unchecked.
- **H3.** The EBNF gives every block token the origin `style.blockOpen`/`style.blockClose` by index, so an EBNF edit of a
  per-block token today would change the language-wide token.
- **H4.** The target text needs no head prefix: a positional, nameless `Program` whose block opens with `begin program`
  derives it; the prefix is needed only for a named class (`begin program P`).
- **H5.** A prefix shared by two classes at one position is already refused by the LL(1) check, as R-TXT-51 (3) wants.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/style.ts` (whole)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/annotations.ts` (whole)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/concreteGrammar.ts` (whole)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/styleCheck.ts` (whole)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/parser.ts` (:224-283, :505-524, :574-577, :581-780,
  :895-1194, and greps over the whole file)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/printer.ts` (:84-100, :284-323, :545-576, greps)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/syntaxRecord.ts` (:40-105, :195-243)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/syntaxForm.ts` (:31-122, :237-341, :420-481,
  :640-750, greps)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/ui/SyntaxForm.tsx` (:296-353, greps)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/ui/TextualTab.tsx` (greps only: the picker, :931, :935, :1467)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/metamodel.ts` (:1-60)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/__tests__/styleTokens.test.ts` (:1-70, greps),
  `__tests__/spec.ts` (:1-96)
- `/Users/alfonso/jjodel-w-blocktok/docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md` (§4, :286-404)
- `/Users/alfonso/jjodel-w-blocktok/docs/decisions.md` (R-TXT-51, through the lane's injected rows)
- `/Users/alfonso/jjodel-w-blocktok/docs/PROTOCOL.md` (P4)

Not read: `languageService.ts`, `textDiff.ts`, `textMatch.ts`, `modelLines.ts`, `textApply.ts` (outside the prompt's
list); a grep for `items[0]` over the textual sources found no reader of the class keyword by position in them.

## 1. Per-block tokens

### 1.1 Where a block is built today (read)

One closure builds every block, from the style in force (`concreteGrammar.ts:429-431`):

```
const block = (items: readonly GrammarNode[]): GrammarNode => (style.layout === 'indent'
    ? { t: 'block', open: [INDENT_MARK], close: [DEDENT_MARK], empty: [], items }
    : { t: 'block', open: style.blockOpen, close: style.blockClose, empty: style.emptyBlock, items });
```

It has three callers, and they are the three places a per-block token would apply:

| Caller | Line | Whose block | Annotation that would carry the tokens |
|---|---|---|---|
| `objectBody` | `concreteGrammar.ts:617` `[...head, block(items)]` | an object's body | the class annotation |
| `feature` (containment) | `:576` `[...blank, ...kw, block(content), { t: 'nl' }]` | a containment's block | the containment feature's annotation |
| `groups` | `:520` `block([{ t: 'star', ... }])` | one group of a grouped containment | the same feature (D4) |

Also `:600` builds `block([])` as the empty alternative of a positional one-line object, a class block.

The node type already holds whole arrays (`concreteGrammar.ts:82`, `open: readonly string[]; close: readonly string[];
empty: readonly string[]`), and a close of several tokens already exists in the catalog: Pascal's
`blockClose: ['end', ';']` (`style.ts:67`). A close `end program` is the same shape.

### 1.2 The annotation types and their resolution (read)

`ClassAnnotation` (`annotations.ts:27-37`) and `FeatureAnnotation` (`:39-51`) have no block field. Adding
`blockOpen?: readonly string[]; blockClose?: readonly string[]` to both is an optional-property addition (Rule 11 allows
it). The resolution validates a class entry field by field (`:311-343`) and a feature entry likewise (`:345-360`); the
per-token validator already exists and is exported: `styleTokenFault` (`:159-165`), used by the language-wide overrides
(`:277-298`). The resolved types `ResolvedClass` (`:117-122`) and `ResolvedFeature` (`:124-130`) gain the same two fields.

**Finding F1 (measured, probe P2).** An unknown key in a class or feature entry is dropped silently: a hand-made record
with `classes.cP.blockOpen`, `blockClose`, `prefix` and `features.fDecls.blockOpen`, `blockClose` resolves with no issue
(`P2 ... issues (unknown keys)` → `[]`) and prints the same text as the record without them (`P2 text equal to P1` →
`true`). The resolution reads named keys only (`annotations.ts:316-341`, `:350-358`). A record written by a later build
and read by this one loses the per-block tokens without a notice. Not a defect of today's code, but the per-block lane
should decide whether an unknown key is a notice (D6).

### 1.3 The empty block

`withStyleOptions` derives the language-wide empty block as open followed by close when either differs from the base
(`annotations.ts:393-394`):

```
const blockChanged = !sameTokens(out.blockOpen, style.blockOpen) || !sameTokens(out.blockClose, style.blockClose);
const effective: NotationStyle = blockChanged ? { ...out, emptyBlock: [...out.blockOpen, ...out.blockClose] } : out;
```

The per-block rule follows the same shape: a block with an open or a close of its own has `empty = [...open, ...close]`,
where a side not given is the effective style's. Measured (probe P4, `an empty Program`): `begin program end program`
prints and parses back with 0 errors. A block with no token of its own keeps the style's `emptyBlock` (C-like `{}` stays one
token).

### 1.4 The printer and the parser read the node (H1, confirmed with one exception)

- **Printer** (`printer.ts:563-573`): `for (const s of n.empty) token(...)`, `for (const s of n.open) token(...)`,
  `for (const s of n.close) token(...)`: the node's arrays. Glue (`:313-314`) reads only the list tokens and the
  terminator, not the block tokens.
- **Parser** (`parser.ts:1024-1116`): the empty block `n.empty.every((s, k) => hit(peek(k), word(s)))` (`:1027`), the
  open `n.open.every(...)` (`:1032`), the close `isClose = (): boolean => n.close.every((s, k) => hit(peek(k), word(s)))`
  (`:1059`), the frame `{ can: ..., close: n.close, open: n.open }` (`:1060`). `closesBody` reads the innermost frame's
  `close[0]` (`:687-690`). FIRST of a block is `word(n.open[0])` and `word(n.empty[0])` (`:518`).
- **Recovery** (`parser.ts:958-960`): `sync` reads `frame.open ?? (indent ? [INDENT_MARK] : g.style.blockOpen)` and
  `frame.close ?? ...`; only the top-level frame has neither (`:1197`), so inside any block the frame's own tokens are
  used. The line the prompt and R-TXT-51 (2) cite, `parser.ts:906`, is `expect('P:]', 'punctuation');` inside the reading
  of a reference path (`:901-910`); it reads no block token. The recovery that reads the style is `:959-960`, at the top
  level only. Measured (P10a-c): a broken value inside an `is ... end` block, a stray line at the top level before two
  programs, and a stray line in the program body after an `is ... end` block recover with one error each and every object
  read.
- **The exception: the tokenizer.** The punctuation set is the style's tokens, the reference and expression tokens, and
  `grammarPuncts(g)` (`parser.ts:261-264`); `grammarPuncts` visits `'p'` nodes and a block's `items`, never its `open`,
  `close` or `empty` (`:240-254`). **Finding F2 (measured, P6).** A per-block punctuation token the style does not hold
  (`<<` ... `>>` on the declarations block) prints, and does not read back: `6 errors (2:15 unexpected character "<" | 2:16
  unexpected character "<" | 3:5 expected "<<"; found name "Declaration" | ...)`, recovered 3. `checkStyle` reports
  nothing on that grammar (`P6 ... check errors` → `[]`).

**Measured, P4** (reading A of §3, the grammar patched by hand per node): the target text prints and reads back.

```
begin program
  declaration is
    Declaration x type := 'int';
    Declaration y
  end
  statement begin
    Statement s value := 3;
  end;
end program
  -- parse: 0 errors, recovered 0, objects Program:-,Declaration:x,Declaration:y,Statement:s
```

with the EBNF

```
Program     ::= "begin" "program" ["declaration" "is" {declarations+=Declaration} "end"] ["statement" "begin" {statements+=Statement} "end" ";"] "end" "program" ;
```

### 1.5 The origin of a block token in the EBNF (H3, confirmed)

The block node carries no `src`; `nodeText` gives every block token a style origin by its index
(`concreteGrammar.ts:740-744`):

```
case 'block': return joined([
    ...n.open.map((t, i) => [quoted(t, styleSrc('blockOpen', i))]),
    ...n.items.map(x => nodeText(x)).filter(cs => !isBlank(cs)),
    ...n.close.map((t, i) => [quoted(t, styleSrc('blockClose', i))]),
], ' ');
```

**Finding F3 (measured, P4).** On the patched grammar `is` has the origin `{"k":"style","param":"blockOpen","index":0}`
and the `program` of `begin program` `{"k":"style","param":"blockOpen","index":1}`. Through `literalField`
(`syntaxForm.ts:675`, `case 'style': return { element: 'language', field: tokenField(src.param) }`) and `setLiteral`
(`:746-750`, which rewrites `effective[src.index]` of the language-wide array), an edit of `is` would write the
language-wide `blockOpen`, and an edit of `program` (index 1) would fail with `the token is not in the style`, since
Pascal's `blockOpen` has one token. A per-node `src` is needed, distinct from the style's: one new `LiteralSrc` kind per
side, e.g. `{ k: 'classBlock', cls, side: 'open' | 'close', index }` and `{ k: 'featureBlock', feature, side, index }`,
carried by the block node (an optional `src` per side, or the owner, from which `nodeText` builds the per-token origin),
and given only where the block has tokens of its own: a block that inherits keeps the style origin, so an edit there stays
language-wide (R-TXT-48 (2)), and an edit of a token of its own changes that block only (R-TXT-51 (4)).

## 2. Reserved names and tokens

### 2.1 Who reads the reserved names (read)

Three readers, each the same union:

- parser `const reserved = new Set([...g.style.reservedNames, ...expressionWords(g), ...(g.headWords ?? [])]);`
  (`parser.ts:596`);
- printer `const words = new Set([...style.reservedNames, ...expressionWords(g), ...(g.headWords ?? [])]);`
  (`printer.ts:290`), a name in it printed quoted (`:291`);
- style check `reservedWords(g)` (`styleCheck.ts:314-317`), the same union, used by the LL(1) overlap (`:320-322`).

`withStyleOptions` makes the language-wide word tokens reserved by construction (`annotations.ts:395-396`). A per-block
word token joins none of them today (H2). Two ways in: (a) `deriveConcreteGrammar` returns `grammar.style` with
`reservedNames` extended by the word tokens of the blocks it built; all three readers follow with no change, and
`reserved-words` (`styleCheck.ts:170-174`) stays satisfied for the style's own tokens. (b) A new grammar field
`blockWords`, as `headWords` (`concreteGrammar.ts:123`), added to the three unions. (a) touches one file; (b) four. D2.

**Finding F4 (measured, P4 and P9).** In the target's positions a name equal to a per-block word reads back today: a
Declaration named `is`, `program` or `declaration`, and a Statement named `program`, round-trip with 0 errors (P4). Where a
name can stand next to a close, it does not: with a positional `Declaration` and the declarations block `is ... done`, a
Declaration named `done` prints bare and reads as the close (`P9 a Declaration named "done"`: `1 errors (3:10 expected
"statement" or "end" "program"; found name "type")`, the declaration lost). The LL(1) check reports that grammar
(`annotations @ Program.declarations: not LL(1): ID can both start the repeated part and follow it`), because `done` is
not reserved and `overlap` lets `ID` meet `ID:done` (`styleCheck.ts:320-321`). With `done` reserved the overlap vanishes
and the printer quotes the name: reserving the per-block words, as R-TXT-51 (2) says, turns this refusal into a working
grammar. (P9's second case, a Declaration named `is`, is confounded by a separate conflict of that grammar,
`Declaration.type`, a positional one-line class followed by another; not a block token finding.)

### 2.2 Punctuation: the tokenizer and `taken` (read)

- Tokenizer: F2 above; the fix is for `grammarPuncts` to visit a free-layout block's `open`, `close` and `empty`
  (`parser.ts:245`), excluding the indentation marks, which are punctuation characters (`concreteGrammar.ts:133-134`) and
  must not be read from the text.
- `taken` (`concreteGrammar.ts:433-441`) holds the punctuation a punctuation feature keyword may not be:
  `take('a block token', [...style.blockOpen, ...style.blockClose, ...style.emptyBlock]);`. A per-block punctuation token
  must be taken too, by the same message, before `keywordOf` (`:443-448`) runs on the features; since `taken` is filled
  before the features are walked, the per-block tokens of every class and containment are collected first (a pass over
  `A.classes` and `A.features`), not as each block is built.

### 2.3 The style check (read)

What reads only the style today, and what a per-block token needs from it:

| Rule | Reads | Per-block need |
|---|---|---|
| `block-delimiters` | `s.blockOpen.length === 0` (`styleCheck.ts:177-178`); `blockTokens` from the style (`:187`) against class and feature keywords (`:188-193`) | an empty per-block open or close is refused (`[]` would make `word(n.open[0])` read `word(undefined)`, `parser.ts:518`, `'ID:undefined'`); a class or feature keyword equal to a per-block token of a block it stands in |
| `style-tokens` | the style's editable tokens (`:280-302`): shape, comment opener, open = close | the same three on each per-block token, the `where` naming the element (`class Program`, `Program.declarations`) |
| `reserved-words` | style tokens vs `reservedNames` (`:170-174`) | none if F4 is fixed as D2 (a) |
| `outer-reference` | style tokens (`:209-217`) | a per-block token starting with `@` is already refused by `styleTokenFault` (`annotations.ts:163`) |
| `terminator` | terminator vs assignment and list tokens (`:203-207`) | a per-block token equal to the terminator: the recovery resynchronises on it; refuse, or leave to LL(1) (D5) |
| `annotations` (LL(1)) | `firstSetsOf` and the FOLLOW fixpoint over the nodes (`:334-474`); a block's FOLLOW of its items is `n.close[0]` (`:429`) | none: it reads the node. Measured: P4 has no finding; P9's conflict is found |

The LL(1) walk runs only on an annotated grammar (`styleCheck.ts:221`), and a per-block token comes from an annotation,
so it always runs where it matters.

### 2.4 Under Indentation

`block()` under `layout: 'indent'` returns INDENT/DEDENT with no token (`concreteGrammar.ts:429-430`), and R-TXT-50's
line-aware LL(1) reads `n.close` only through the block case (`styleCheck.ts:429`, `indent || atStart`). R-TXT-51 (4):
per-block tokens are ignored there with a notice. The derivation's `remark` (`concreteGrammar.ts:266`) gives a
`notice`-level issue, which the style check shows as an `annotations` notice (`styleCheck.ts:222`), and which neither the
picker's refusal (R-TXT-50, an error only) nor Save blocks. Measured (P8): the same record under Indentation prints the
blocks as indentation, 0 check errors.
