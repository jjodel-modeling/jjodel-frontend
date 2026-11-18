# Discovery — textual step C: expression notation, the annotations form (T4b), other styles (T5)

Prompt: P-2026-11-04-0303 (discovery and probe, stopped at the context soft ceiling after the probe's single run),
continued by P-2026-11-04-0330 (this report). Chat C-2026-11-03-1037. Branch `textual-c-notation`, worktree
`~/jjodel-w-textc`. Read-only on the code; the probe is committed at `d5e38cb8b`.

## 0. Objective

Step C of `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md` has three open points:

1. **Expression notation.** An `operator` annotation (R-TXT-16 (3)) turns a class into an operator, so that a `driver`
   reads `st & (is_sw)` instead of a pyramid of `Conj { ops { ... } }` blocks, with a round trip to the model and edits
   applied as a diff. Test case for the port notation: `input instr : Word(32)`.
2. **T4b, the annotations form.** Keywords, one-line classes, grouping and operators edited without touching the record
   by hand; validation in place; live EBNF and text; one undo step; an ambiguous annotation refused with its rule.
3. **T5, other styles.** Pascal/Ada and indentation from the viewpoint report §A.2, a style picker, the model unchanged
   by a style switch, byte-identical round trip per style.

For each: findings with `file:line` and figures, one recommended design with the rejected alternatives, the lanes in
order with their file sets.

## 1. Inputs and files read

**Probe.** `docs/discovery/harness/probe_2026-11-04_textual_c_notation.test.ts`, one run, output in
`docs/discovery/harness/probe_2026-11-04_textual_c_notation.out.txt` (193 lines, probe time 3555 ms). It measures:

- a small boolean-expression metamodel added in the probe (`BOOL`: Sheet, Atom, Rule, Use, Lit, Not, And, Or, Imp;
  And/Or hold an `ops` list, Imp holds `left`/`right`, Not holds `op`);
- the tolerant corpus (`library`, `turnstile`, `garage` in two cases) for the styles;
- the SyncRTL models of the RISC-V Briefs prototype, read-only from the prototype's local output folder outside the
  repository (`arb3`, `arb3_rr`, `arb3_fixed`, `mc_w4_r4`, `pf_w4_r4`, `mc_w32_r32`), with the metamodel parsed from its
  Ecore (38 classes, 1 enumeration).

The probe carries its own precedence-climbing parser and printer for the notation (section 1c), a Pascal/Ada style
record (`PASCAL`, probe :375-380) and an indentation stand-in (`fromIndent`, probe :393-411: a pre-pass that writes back
the braces an INDENT/DEDENT lexer would emit). None of these is production code.

**Code read** (all under `frontend/src/codegen/textual/`):

| File | Lines | What |
|------|-------|------|
| `annotations.ts` | :15-19, :28, :117, :256 | `OperatorAnnotation {symbol, precedence, assoc?}`; "stored and validated, not applied yet"; `isKeyword` accepts `''` or an identifier only; the notice emitted per operator |
| `concreteGrammar.ts` | :27-49, :109, :186-202 | GrammarNode vocabulary (seq, opt, star, alt, kw, p, tok, xref, lit, rule, assign, list, block, nl); `layout !== 'free'` throws; R-TXT-27 refusals of an optional name in a one-line or positional head |
| `styleCheck.ts` | :16-37, :191, :216-295 | the `StyleRule` names; `ll1Conflicts` |
| `parser.ts` | :62-113, :215, :225-228, :270-295, :298, :600-618 | tree node kinds; `NUMBER = /-?\d+.../y`; punctuation built only from style tokens; string lexing (stops at a newline); `objectRule` predicts the object from its first token and `object` creates it before reading its body |
| `printer.ts` | :194-458, :268-275 | the printer and its tree half; `quote` (escape `double` doubles the quote and leaves a newline raw) |
| `style.ts` | :25-26, :39 | the escape modes; `CLIKE_STYLE`, the only style |
| `syntaxRecord.ts` | :31, :189, :193 | `CLIKE_STYLE` hard-wired in both derivations; the record has no style id |
| `textDiff.ts`, `textMatch.ts` | textMatch :1-17 | the evidence cascade: nameless objects in one slot are homonyms, so their match is uncertain |
| `ui/openTextualTab.tsx` | :15, :55 | `writeTextualSyntax`, one `set_state`, one undo step; no caller in `frontend/src` besides its definition |
| `ui/TextualTab.tsx` | :789-793, :854 | `TextualMode = 'text' \| 'ebnf'`; the EBNF view is read-only |
| `__tests__/corpus.ts` | :49, :72 | `GARAGE`; `Engine.note = 'line1\nline2 "q"'` |

Also: `docs/discovery/discovery_2026-11-01_textual_viewpoint.md` §A.2 (:500-601) for the Pascal/Ada and indentation
styles and question 9 (Port shared by `inputs` and `outputs`).

## 2. Part 1 — expression notation

### 2.1 Findings

**F1. The Briefs print expressions as pyramids, and most of the text is expressions.** Today's C-like print, no
annotations (out :3-9):

| Model | objects | expression objects | text lines | lines of expressions |
|-------|--------:|-------------------:|-----------:|---------------------:|
| arb3 | 108 | 77 | 348 | 221 |
| arb3_rr | 240 | 170 | 867 | 671 |
| arb3_fixed | 168 | 116 | 597 | 413 |
| mc_w4_r4 | 714 | 492 | 2,622 | 1,900 |
| pf_w4_r4 | 789 | 545 | 2,870 | 2,058 |
| mc_w32_r32 | 714 | 492 | 2,622 | 1,900 |

7,163 lines of expressions over the six models. In the probe's notation the same 312 expression roots print as 312
one-line expressions, 14,218 characters in all, about 46 per expression (out :110). `mc_w4_r4`'s `dmem_we.driver` is 12
lines today (out :10-28) and `st & or(is_sw)` in the notation (out :112).

**F2. Conj/Disj are n-ary, and arity 0, 1 and same-class nesting occur in the data.** Arity histogram (out :4-9):
arb3 `Conj/0` 2, `Conj/1` 3, `Conj/2` 9, `Conj/3+` 4, with a same-class child 2; mc_w4_r4 `Disj/1` 2, `Conj/2` 22,
`Conj/3+` 7, `Disj/3+` 4, same-class child 0. R-TXT-16 (3) says "a class as a **binary** operator": the Briefs' operator
classes hold an `ops` list, so binary alone does not cover them.

**F3. A single-operand Disj under a Conj: what a naive parse deletes.** `dmem_we.driver` is
`Conj(Ref st, Disj(Ref is_sw))` (out :10-28). Printed as `st & (is_sw)`, the parentheses are the only trace of the Disj;
parsed as ordinary grouping they give `And(st, is_sw)` (out :104, typed `"st & (is_sw)"` gives
`And(ops=[Use st, Use is_sw])`), and the diff against the model would **delete the Disj**. The probe prints arity 0 and
1 in call form, `or(is_sw)` and `and()`, and both round-trip (out :88, :94, :105). The prototype's own `arb3.rtl` already
writes the same form (`and(req_cpu)`, `and()`).

**F4. Flat with one symbol keeps the model; left-fold changes it.** Probe 1c, eight BOOL cases (out :88-103):

- flat: 8 of 8 keep the model and reprint identically, including `st -> ld -> rdy` (right-assoc) and
  `(st -> ld) -> rdy`;
- left-fold: `st & ld & rdy` reprints identically but parses as `And(And(st, ld), rdy)` (out :98): the model changes.

On SyncRTL (out :110-111): flat keeps 312 of 312 expression roots, 0 parse errors; left-fold keeps 269 of 312, 43
changed, first failure `arb3 sel_io.expr: req_io & !req_cpu & !req_dma`. Every n-ary node with 3 or more operands is
rewritten by a fold.

**F5. Redundant parentheses need a tree node, not trivia.** Probe 1c, typed text (out :104-109):

| typed | model | minimal print | with the tree's parentheses | raw count of parentheses |
|-------|-------|---------------|-----------------------------|--------------------------|
| `((st)) \| ld` | Or(st, ld) | `st \| ld` | `((st)) \| ld` | `((st)) \| ld` |
| `(st & ld) & rdy` | And(And(st, ld), rdy) | `(st & ld) & rdy` | `(st & ld) & rdy` | `((st & ld)) & rdy` |
| `st & (ld & rdy)` | And(st, And(ld, rdy)) | `st & (ld & rdy)` | `st & (ld & rdy)` | `st & ((ld & rdy))` |
| `!(st)` | Not(st) | `!st` | `!(st)` | `!(st)` |

Counting parentheses as trivia on the operand's tokens doubles the pair that the printer must emit anyway around a
same-class child (`((st & ld))`). A `paren` node around the operand, owning its two tokens, keeps the user's
parentheses distinct from the required ones; reprinting from the model alone gives the minimal parentheses.

**F6. Today an operator annotation is stored and not applied; the BOOL record fails the check.** Each operator gets the
notice "the operator ... is stored, not applied yet" (annotations.ts:256; out :40-43). `checkStyle` on BOOL with
positional Use/Lit and the operators returns 20 findings, among them `distinct-classes`: "the keyword "" starts 2
classes: Use, Lit" and 14 LL(1) errors (out :44-64); the record's print reparses with 18 errors and does not reprint
identically (out :80). The EBNF shows why (out :81-84): `Expr_ ::= Use | Lit | Not | And | Or | Imp`, each an object
rule in block form.

**F7. The parser cannot read an infix class as it stands.** `objectRule` (parser.ts:600-610) chooses the object rule
from the first token and `object` (:612-618) creates the object before reading its body; an infix object starts with
its first operand, so the rule cannot be predicted and the object would exist before its class is known.

**F8. The tokenizer knows no operator.** Punctuation is built only from the style's tokens (parser.ts:225-228, :298):
on `a & b` the real tokenizer yields `ID:a ID:b` and the error `unexpected character "&"` (out :85). The number pattern
`-?\d+` (parser.ts:215) folds the sign: `a -1` gives `ID:a INT:-1` (out :85), which a binary `-` must read as
`a - 1`.

**F9. Nested expression objects are nameless.** textMatch.ts:1-17: nameless objects in one slot are homonyms, so their
match is uncertain. The probe's section 1d (five edits inside a BOOL expression through `planTextEdit`) measured
nothing: the five needles were not found in the print (out :116-121, "the text to edit was not found"; the needles
assumed an indentation the print does not have, probe :578-589). What the diff needs for nested expressions is
therefore **not measured** here; it is the first measurement of lane C1c.

**F10. The non-operator classes of an expression.** In the probe's notation the remaining SyncRTL expression classes
print in call form: `mem_addr.expr` is `Case([Arm(is_sw, a + imm_s)], a + imm_i)` and the longest wire expression of
mc_w4_r4 is 220 characters (out :113-114). A call layout for a positional class is the same need as `Word(32)` in
§2.4.

### 2.2 Recommended design

- **Annotation data.** `OperatorAnnotation` keeps `symbol`, `precedence`, `assoc` (annotations.ts:15-19) and gains
  optional properties only (rule 11): `call?` (the word of the call form, default the class keyword in the style's
  case). The fixity is derived from the class's containments, not declared: one many-valued containment = n-ary infix;
  two single containments = binary infix (left, right in declaration order); one single containment = prefix. A class
  of another shape with an operator annotation is refused (an error, not a notice).
- **N-ary: flat with one symbol.** `a & b & c` is one And with three operands. A same-class child at equal precedence
  prints in parentheses, so the structure survives (F4, F5). Arity 0 and 1 print in call form `and()`, `or(is_sw)`
  (F3). Binary classes use `assoc` as usual.
- **Grammar.** A new GrammarNode `expr` holds a precedence table built from the annotations and the primaries (the
  non-operator classes of the expression type and its references). The parser reads it by precedence climbing and
  creates the operator object after it has read the operator token (F7). The tree gets a `paren` node kind around an
  operand (F5); the printer's tree half emits the same nodes, so the printer's tree and the parser's tree stay equal.
- **LL(1) check.** `ll1Conflicts` (styleCheck.ts:216) treats `expr` as one node with FIRST = FIRST of the primaries,
  the prefix symbols, `(` and the call words. New conditions, each an error with its `StyleRule` name: the infix and
  postfix symbols are disjoint from FOLLOW(expr); a symbol has one fixity; two classes do not share a symbol (today only
  a notice, out :135-137); no symbol is a block token or a prefix of a comment opener or a style token (today only a
  notice for `{`, out :133-134); a call word is not a class keyword.
- **Tokenizer.** Operator symbols join the punctuation (longest match first, as style tokens do today). The sign is
  folded into a number only when the previous significant token cannot end an operand (not an identifier, number,
  string or `)`), and only when the grammar has an operator symbol starting with `-`; otherwise the lexer is unchanged.
- **Round trip and diff.** Parse `st & (is_sw)` into `And(st, is_sw)` with a `paren` node; the print from the tree is
  identical, the print from the model is `st & is_sw`. Typing `st & or(is_sw)` keeps the Disj. Nested operands match by
  slot position and class, not by name (F9); measured in C1c before the design is fixed.

**Rejected.** Left-fold: changes the model for every node with 3 or more operands (43 of 312 roots, F4). Refuse n-ary:
Conj, Disj and Concat are n-ary in the Briefs (F2). A layered grammar (one rule per precedence level): the levels come
from annotations the author edits live, the check would see a different grammar after each edit, and every level
repeats the primaries; one `expr` node keeps the check local. Parentheses as trivia: doubles the required pair (F5).

### 2.3 Risks

- The tree's two halves (printer and parser) must stay equal, as step A requires; `paren` and `expr` are new kinds on
  both sides.
- An expression typed with a same-class child without parentheses (`st & ld & rdy` meant as `(st & ld) & rdy`) is read
  flat: the diff replaces the inner And by its operands. Visible in the diff, not silent.
- F9 unmeasured: an operand swap may read as two retargets (harmless for `Ref`, not for subtrees).

### 2.4 The port test case `input instr : Word(32)`

Today `instr` prints as an 8-line `Port instr { origin ...; type { Word { width 32 } } }` (out :29-37). The one-line
form needs five things:

| Need | Why | Today |
|------|-----|-------|
| a per-item feature keyword for `inputs` and `outputs` | Port is shared by both, a class keyword cannot say input/output (viewpoint report question 9) | a feature keyword is printed once around the block |
| a punctuation feature keyword `:` for `type` | `isKeyword` accepts `''` or an identifier only (annotations.ts:117) | refused |
| an inline single containment for `type` | `Word(32)` sits in the line, no block | containment always in a block; out :138-139 "Sheet has a containment: layout line not applied" |
| a call layout for a positional class, `Word(32)` | same as the call form of F10 | not in the vocabulary (concreteGrammar.ts:27-49) |
| an optional name in a one-line head | `Named.name` is `[0..1]` in SyncRTL; R-TXT-27 (2) refuses the one-line Port (concreteGrammar.ts:190-198) | refused |

After `input`, the next token is an identifier only when the name is present and `:` otherwise, so the LL(1) check can
decide this head. R-TXT-27 (2) refuses it regardless.

## 3. Part 2 — T4b, the annotations form

### 3.1 Findings

**F11. The record is never written by the app.** `writeTextualSyntax` (ui/openTextualTab.tsx:55) is the one write,
one `set_state`, one undo step, and has no caller in `frontend/src` besides its definition (search over `frontend/src`;
its definition file was found, so the search ran).

**F12. The messages of today, for six ambiguous records** (out :123-141):

| Case | Message today | Verdict |
|------|---------------|---------|
| two classes, one keyword `all` | `distinct-classes` error, twice (Model and Expr_), plus two LL(1) errors | refused, but four lines for one fault |
| two positional containments | `annotations` Imp.left: not LL(1): "{", "{}" can both start the optional part and follow it | refused, message names tokens, not the annotation |
| a keyword that is a block token | class Rule: the keyword "{" is not an identifier or "" | refused, clear |
| an operator symbol that is a block token | notice: stored, not applied yet | **not refused** |
| two operators, one symbol | two notices | **not refused** |
| a one-line class with an optional name | class Sheet: Sheet has a containment: layout line not applied | refused, but by the containment rule: the probe's case hit it first, so R-TXT-27's message was not observed |
| an unknown class id | error classes: no class has the id "C_X" | refused |

**F13. Live preview is cheap.** At 1,000 objects, median of 15 (out :140): derive 0.08 ms, check 0.10, EBNF 0.02,
print 3.43, total 3.64 ms. Preview on every field change needs no debounce beyond one frame.

**F14. The Properties panel is the wrong host.** `M1PropertiesPanel.tsx` is bound to the canvas and writes through
`canvasToJjom` (critical zone); the record belongs to the metamodel and is read by the Text tab.

### 3.2 Recommended design

- **Where.** A third mode «Syntax» in the Text tab next to Text and EBNF (`TextualMode`, ui/TextualTab.tsx:789-793),
  for the metamodel of the open model. R-TXT-23's textual entry stays the one entry.
- **Fields per element kind.** Class: keyword, layout (block, one line, positional, call), operator (symbol,
  precedence, assoc, call word). Feature: keyword (identifier or punctuation), per-item keyword, inline (single
  containment). Enumeration: groups of literals. Language: style (§4).
- **Validation in place.** `checkStyle` findings carry a `StyleRule` name (styleCheck.ts:16-37) and a `where`; each is
  shown next to the field whose `where` matches, deduplicated (F12: the same fault comes back once per rule that
  contains the class). Messages that name tokens (F12, row 2) get a sentence naming the annotation.
- **Live preview.** The EBNF and the printed text of the open model, recomputed on every change of the draft (F13).
- **Write and undo.** Save writes the draft with `writeTextualSyntax`: one `set_state`, one undo step (F11). Save is
  disabled while an `error` finding exists; the refusal shows the rule name. The two notices of F12 become errors in C1.

**Rejected.** The Properties panel (F14). A JSON editor of the record: the author edits records by hand, which T4b
exists to avoid. Saving with errors and showing them later: an ambiguous record would reach the parser.

## 4. Part 3 — T5, other styles

### 4.1 Findings

**F15. One style, hard-wired.** `CLIKE_STYLE` (style.ts:39) is the only style; `syntaxRecord.ts:189,193` derive with
it; the record has no style id; `layout: 'indent'` throws (concreteGrammar.ts:109).

**F16. Pascal/Ada passes the check and round-trips, except one string.** With `PASCAL` (probe :375-380: `begin`,
`end ;`, `:=`, `;`, `'` with doubling, `--` and `(* *)`) the check finds 0 errors on all five cases; library,
turnstile, bool and arb3 parse with 0 errors, keep the model and reprint byte-identically (out :144-182).
Garage fails in both cases: 6 parse errors, first "unterminated string at 8:15" (out :163, :168). Cause:
`Engine.note = 'line1\nline2 "q"'` (corpus.ts:72); with escape `double` the printer leaves the newline raw
(printer.ts:270-272) and the lexer stops a string at a newline (parser.ts:276). Any model with a newline in a string
fails in a doubling style.

**F17. Mutants: Pascal is as strict as C-like on most cases.** Applicable and changed, out of the mutants:

| Case | Pascal | C-like |
|------|-------:|-------:|
| library | 0 / 226 | 9 / 130 |
| turnstile | 27 / 304 | 2 / 146 |
| bool | 0 / 832 | 9 / 554 |
| arb3 | 48 / 1,950 | 49 / 1,214 |

Turnstile is the exception (8.9% against 1.4%); the cause is not measured.

**F18. Indentation round-trips, and a truncated text applies deletions.** The indentation text is 26 to 43% shorter
(library 23 lines against 32, arb3 210 against 348, out :156, :181). Round trip byte-identical on every case except
garage in lower case (braces restored not identical, 1 parse error, out :171): the stand-in decides an empty block from
a set of class keywords, and in lower case a class keyword can equal a feature keyword; the stand-in's guess, not a
measured cause. The mutants (refused, unchanged, changed) by kind:

| Case | trunc | delete | dedent | indent |
|------|-------|--------|--------|--------|
| library | 32, 1, 11 | 35, 0, 9 | 22, 0, 0 | 16, 7, 0 |
| turnstile | 48, 1, 4 | 51, 0, 2 | 17, 0, 0 | 19, 4, 0 |
| garage c-like | 77, 1, 36 | 107, 0, 7 | 33, 0, 0 | 27, 10, 0 |
| bool | 48, 1, 79 | 119, 0, 9 | 95, 0, 0 | 75, 21, 0 |
| arb3 | 102, 1, 178 | 229, 0, 52 | 209, 0, 0 | 149, 61, 0 |

A truncation is applicable and changes the model in 178 of 281 arb3 cases. The example (out :183-191): library cut
after 6 lines is refused in C-like (3 errors, "expected "}" to close the "{" at 6:16") and in indentation parses with 0
errors and is applicable, keeping 3 objects of 10. A truncated indentation text has no unclosed block: the end of text
closes them all.

### 4.2 Recommended design

- **Style picker.** An optional `style?: { base: 'clike' | 'pascal' | 'indent' }` in `SyntaxAnnotations` (rule 11,
  optional property); `syntaxRecord.ts` derives with the chosen style; absent means C-like, so every stored record
  keeps its print. A switch changes the record only, never the model (measured: model unchanged on every passing case).
- **Pascal/Ada first.** `PASCAL` moves from the probe to `style.ts`. The newline of F16 needs a decision (D4).
- **Indentation last.** An INDENT/DEDENT pass in the tokenizer, `layout: 'indent'` in concreteGrammar.ts, and a
  **deletion guard**: in the Text tab, an edit whose plan deletes objects past the last edited line, or more than one
  object at once, asks for confirmation before it applies (D2). Without the guard the indentation style is not shipped.

**Rejected.** Indentation by a brace-restoring pre-pass as in the probe: it guesses empty blocks from keywords (F18,
garage lower). Shipping indentation without a guard: F18. A style per class: R-TXT-16 (2) says a style maps the whole
base grammar.

## 5. Lanes, in order, with their file sets

Each lane stays at five files or fewer (rule 19); paths under `frontend/src/codegen/textual/`.

| Lane | What | Files |
|------|------|-------|
| C1a | operator annotation applied to the grammar: fixity derived, `expr` node, check conditions, notices of F12 become errors | `annotations.ts`, `concreteGrammar.ts`, `styleCheck.ts`, `__tests__/` (BOOL in the corpus, check tests) |
| C1b | parser and printer: precedence climbing, `paren` node, operator tokens, sign rule, call form | `parser.ts`, `printer.ts`, `__tests__/` |
| C1c | diff of nested expression objects: measure F9 first, then match by slot position and class | `textMatch.ts`, `textDiff.ts`, `__tests__/` |
| C1d | the port line: per-item keyword, punctuation keyword, inline containment, call layout, optional name (after D3) | `annotations.ts`, `concreteGrammar.ts`, `parser.ts`, `printer.ts`, `__tests__/` |
| C3a | Pascal/Ada and the style picker | `style.ts`, `annotations.ts`, `syntaxRecord.ts`, `printer.ts`/`parser.ts` (newline, D4), `__tests__/` |
| C2 | T4b form | `ui/TextualTab.tsx`, `ui/SyntaxForm.tsx` (new), `ui/openTextualTab.tsx`, its stylesheet |
| C3b | indentation: INDENT/DEDENT lexer, `layout: 'indent'`, the deletion guard | `parser.ts`, `concreteGrammar.ts`, `printer.ts`, `ui/TextualTab.tsx`, `__tests__/` |

Order C1a, C1b, C1c, C1d, C3a, C2, C3b: the form (C2) is worth building when operators and the style field exist to be
edited; indentation waits for the guard.

## 6. Ratified rows: amendments and additions

**Amend a ratified row:**

- **R-TXT-16 (3)**: "a class as a binary operator with symbol and precedence" becomes an operator of derived fixity
  (n-ary flat, binary, prefix), with associativity and a call form for arity 0 and 1 (F2, F3, F4). Also the call layout
  of a positional class (F10, §2.4) extends the list "one line or positionally".
- **R-TXT-27 (2)**: refusing every optional name in a one-line or positional head blocks `input instr : Word(32)`
  (§2.4); the proposal replaces the blanket refusal with the LL(1) condition (the name is accepted when the token after
  it cannot start the rest of the head) — only if D3 picks it.

**Additions (no row changes):** the `expr` GrammarNode and the `paren` tree node; operator tokens in the tokenizer and
the sign rule; the new check conditions; the per-item keyword, punctuation keyword and inline containment; the
optional `style.base` in the record; the Syntax mode of the Text tab; the deletion guard; the newline rule for
doubling styles.

## 7. Decisions taken (unattended)

1. Parentheses as a `paren` tree node, not trivia (F5).
2. One `expr` node with precedence climbing, not a layered grammar (§2.2).
3. Fixity derived from the class's containments; the annotation gains optional properties only (rule 11).
4. The style id as an optional `style.base` in the record, absent = C-like.
5. The probe's section 1d was not re-run in this lane (report only): the diff on nested expressions is left
   unmeasured and moved to the head of C1c (F9).
6. The prototype's local folder is named in this report without its path.

## 8. Decisions awaiting Alfonso

- **D1. N-ary operators** (amends R-TXT-16 (3)): flat with one symbol, a same-class child in parentheses, arity 0 and 1
  in call form. Recommended: yes.
- **D2. Indentation and truncation** (F18): ship indentation only with the deletion guard, last (C3b). Recommended: yes.
- **D3. Optional name in a one-line head** (R-TXT-27 (2)): (a) amend R-TXT-27 (2) to the LL(1) condition, general for
  every metamodel whose `name` is `[0..1]`, Ecore's own included; or (b) keep R-TXT-27 and make `Named.name` `[1..1]` in
  the prototype's metamodel, as R-TXT-27 (1) did for the mnemonic. Recommended: (a).
- **D4. A newline in a string under a doubling style** (F16): (a) print it as a joined character code, Pascal's
  `'line1'#10'line2'`, read back by the lexer; (b) allow a doubling-style string to span lines (an unclosed quote then
  swallows the rest of a broken text); (c) refuse such a model in that style. Recommended: (a).
- **D5. The lane order** of §5. Recommended: C1a, C1b, C1c, C1d, C3a, C2, C3b.
- **D6. T4b in the Text tab** as a third mode «Syntax» (§3.2). Recommended: yes.
