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

## 3. The head prefix (a separate slice)

### 3.1 Two readings of `begin program` (H4, confirmed)

- **Reading A, no prefix.** `Program` positional (class keyword `''`) and nameless, its block open `begin program` and
  close `end program`. Every piece exists but the per-block tokens: positional is `keyword: ''` (`annotations.ts:28`), and
  a nameless positional class takes no head-name check (`concreteGrammar.ts:359`, `headName = r.named && ...`). Measured
  (P4): prints and reads back the target, check clean. The body of `Program` is then `seq [block]`; the Model's FIRST is
  `begin`.
- **Reading B, prefix.** `begin` before the class keyword `program`, the block with no open. Measured (P5, prefix
  patched in as a `kw` node before the head): the text prints and reads back with 0 errors, and the check reports a false
  error, `case-injective @ class Program: case declared folds the keyword of Program onto the style word "begin"`: the
  check takes the first item of the body for the class keyword (§3.2). The block with no open is the shape §2.3 says to
  refuse under free layout.

Reading A reaches the target with the slice of §1-§2 alone. The prefix is needed when the class is named, or keeps its
keyword: `begin program P ... end program` is a prefix `begin`, the keyword `program`, the name `P`; reading A would print
`P begin program ...` (a positional named class prints its name first). The prefix slice is therefore separate, as R-TXT-51
(3) says, and not on the path to the target text.

### 3.2 Where the prefix sits, and who reads the head by position (read)

The head is built at `concreteGrammar.ts:597` (`const head: GrammarNode[] = sh.keyword === '' ? [] : [{ t: 'kw', text:
sh.keyword, src: { k: 'class', cls: r.cls } }];`); a prefix goes before it, as `kw` or `p` nodes with an origin of their
own (e.g. `{ k: 'classPrefix', cls, index }`), and before the name opt of a positional class. Six readers find the class
keyword as the first item of the body, by position:

| Reader | Line | Use |
|---|---|---|
| parser `classKeywords` | `parser.ts:705` | a class keyword is never inferred by the repair (step A, decision 2) |
| printer `pathKeyword` | `printer.ts:87-91` | the first segment of a path (R-TXT-28) |
| printer `classKeywords` | `printer.ts:355` | the role `class` of the token |
| style check `headKeyword` | `styleCheck.ts:66-69` | `distinct-classes`, `case-injective` (`foldedOntoWord`, `:165`), `block-delimiters` (`:189`), `call-words` (`:269`) |
| syntax form | `syntaxForm.ts:382` | the class keyword a finding is located at |

With a prefix each would read the prefix. The fix is to find the head keyword by its origin (`src.k === 'class'`) rather
than by position; `concreteGrammar.ts` itself finds the name by its `opt` (`afterName`, `:191-197`), not by position, and
needs nothing there.

### 3.3 LL(1) and a shared prefix (H5, confirmed)

Measured (P7, `begin` before both `Program` and `Statement`, both roots): the check reports
`annotations @ rule Model: not LL(1): "begin" can start two alternatives` and `distinct-classes @ Model: the keyword
"begin" starts 2 classes: Program, Statement` (plus the two false `case-injective` errors of §3.1). The refusal R-TXT-51 (3)
asks for comes from `ll1Conflicts`'s alternatives (`styleCheck.ts:402-409`) with no new rule; `distinct-classes` would
then compare the prefix's first token, which states the same conflict a second time, by the class keyword field. With the
head keyword read by origin (§3.2), `distinct-classes` compares keywords only, and the shared prefix is the LL(1) finding
alone. A prefix shared by classes at different positions (one at the top level, one in a containment) is no conflict, and
the LL(1) check does not report it.

Word tokens of a prefix join the reserved names as per-block words do (§2.1); punctuation joins the tokenizer and `taken`.
The parser needs nothing beyond `:705`: a prefix is a `kw`/`p` node of the sequence, read by `run` (`parser.ts:1127-1133`),
and the object rule is predicted by FIRST (`objectRule`, `:719-729`; `descentRule`, `:1002-1004`). The printer prints a
`kw` node as any other.

## 4. Interplay with R-TXT-51 (4)

### 4.1 A base switch

`withStyleBase` (`syntaxRecord.ts:233-241`) drops only `STYLE_TOKEN_KEYS` from `style` on a switch (R-TXT-49 D10):
`const options = switched ? Object.fromEntries(Object.entries(kept).filter(([k]) => !(STYLE_TOKEN_KEYS as readonly
string[]).includes(k))) : kept;`. Per-block tokens live in `classes` and `features`, which a switch never touches: they
survive a switch among the free-layout styles by construction, and under Indentation they stay in the record, ignored
with a notice (§2.4), and apply again on a switch back. No change to `syntaxRecord.ts`. Whether R-TXT-51 (4) also means the
language-wide overrides survive a switch (amending D10) is D3.

### 4.2 An EBNF edit of a per-block token

With the per-node origin of §1.5, `literalField` (`syntaxForm.ts:652-678`) maps the new kinds to the class or feature
element and a new field (`class.blockOpen`, `class.blockClose`, `feature.blockOpen`, `feature.blockClose`), and `setLiteral`
rewrites that element's own array at `src.index`, as it rewrites the style's (`:746-750`). The edit changes that block only.
A block that inherits shows style origins and an edit there is language-wide, as today. `literalDefault` (`:687-692`)
derives again with the field cleared: for a per-block token that is the inherited style token at that index, or none when
the inherited array is shorter (the `end program` close over Pascal's `end ;` has an index 1 in both, but over C-like's `}`
none): undefined, as for a per-item keyword.

### 4.3 The Syntax form, Advanced

The fields are specs in `CLASS` and `FEATURE` (`syntaxForm.ts:88-104`), tier `advanced`, read by `fieldValue` (`:237-269`)
and written by `setField` (`:306-341`); findings land through `locate` (`:420-481`), where a `class C` or `C.f` `where`
already maps to the element. The feature fields apply to containments only (as `inline`, `itemKeyword`), the class fields
to block-layout classes.

**Finding F5 (measured, `probe_form_field`; L2a, not R-TXT-51).** The language-wide token fields of L2a are text inputs
over array values. `fieldValue` returns the override array (`fieldValue of an override ["end","."] typeof object`), and the
form's default input shows a value only when it is a string (`ui/SyntaxForm.tsx:350-351`, `value={typeof value === 'string'
? value : ''}`), so an override shows empty; typing passes the input's string to `setField`, which stores it as is
(`setField with the input string {"base":"pascal","blockClose":"end program"}`), and the resolution refuses it
(`faults ["blockClose is not a list of tokens"]`). The list fields (`list.open` ...) are strings and work. The EBNF edit
path (`setLiteral`) builds arrays and is not affected. L2a's log records the form fields as not verified in the app. The
per-block fields need the same array input, so the fix (a `tokens` input kind: the array shown joined by spaces, the text
split on blanks) serves both; D7.

### 4.4 The probe

The metamodel of the probe (`probe_block_tokens.ts`): `Program` with containments `declarations: Declaration[*]` and
`statements: Statement[*]`, no name; `Declaration` and `Statement` with a mandatory `name` and one optional attribute,
one-line. Base record: Pascal, roots `uncontained`, `Program` keyword `program`, feature keywords `declaration` and
`statement`.

| Case | What | Result |
|---|---|---|
| P1 | the record today | `program begin` / `declaration begin` ... `end;` / `end;`, round trip 0 errors |
| P2 | per-block keys added by hand | no issue, same text (F1) |
| P3 | language-wide `is` / `end` | every block `is ... end`, the target's program line unreachable |
| P4 | reading A, grammar patched per node | the target text, 0 errors; check clean; names `is`, `program`, `declaration` round trip; EBNF origins wrong (F3) |
| P5 | reading B, prefix patched | text and round trip fine; a false `case-injective` error (§3.1) |
| P6 | per-block `<<` `>>` | printed, not read back, check clean (F2) |
| P7 | shared prefix | LL(1) and `distinct-classes` report it (H5) |
| P8 | Indentation | blocks as indentation, check clean |
| P9 | positional Declaration, close `done` | LL(1) conflict reported; a Declaration named `done` lost (F4) |
| P10 | recovery in and around `is ... end` | one error each, every object read |
