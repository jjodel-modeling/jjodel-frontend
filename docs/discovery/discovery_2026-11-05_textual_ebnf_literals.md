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

## 2. Editor

### 2.1 The EBNF mode today (read, `ui/TextualTab.tsx`)

- Three modes, `type TextualMode = 'text' | 'ebnf' | 'syntax';` (`:836`). The EBNF is its own `<Editor>` mounted only
  in that mode (`:1443-1449`): `language={ui.EBNF_LANGUAGE_ID} value={view.ebnf}` with
  `options={{ ...EDITOR_OPTIONS, readOnly: true, domReadOnly: true }}`, no `onMount`, so no ref, no decorations, no
  markers, no commands.
- `view.ebnf` is the **stored** notation's EBNF (`readModel`, `:224`, `const ebnf = concreteGrammarEbnf(grammar);`), not a
  draft's. The bar shows a lock while in the mode (`:1354-1358`): `title="The grammar is derived from the metamodel"`,
  `Read-only`. The Syntax form's preview has a second read-only EBNF editor (`syntaxPreview`, `:1340-1344`) fed by
  `draftPreview(...).ebnf` (`syntaxForm.ts:575-587`).
- The Text editor shows the mechanisms an island editor would reuse: decorations with
  `TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges` (`:995-996`), `monaco.editor.setModelMarkers(m, EDIT_MARKER_OWNER,
  ...)` (`:1064`), and Cmd/Ctrl+Z sent to the app's undo under a context key (`:1316-1320`,
  `editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => { ... UndoAction.new(1, DUser.current, false).commit(); }, APP_UNDO_KEY);`).
- The EBNF tokenizer colours a quoted string `string.jjodel-ebnf` in `CYAN` (`textualMonaco.ts:61`, Monarch rule `:78`
  `[/"(?:[^"\\]|\\.)*"/, 'string']`), the tab's accent (R-TXT-47 D8, `#06b6d4`).
- The wrapper (`@monaco-editor/react` 4.7.0, measured in `node_modules/@monaco-editor/react/dist/index.mjs`) updates a
  read-only editor by `setValue`, a writable one by a whole-range `executeEdits` plus `pushUndoStop`:
  `readOnly)?i.setValue(r||""):r!==i.getValue()&&(i.executeEdits("",[{range:i.getModel().getFullModelRange(),...}]),i.pushUndoStop())`.

### 2.2 The options

Monaco has no editable-range API in the version bundled here (read, not measured: no such option in `EDITOR_OPTIONS` or in
the wrapper's props; the "editable regions" requests in Monaco's tracker are open feature requests). Four ways:

| | Option | Layout shift | Undo | Verdict |
|---|---|---|---|---|
| (a) | Read-only model; islands as decorations; a **content widget** with an `<input>` laid over the literal on click, Enter or F2; Enter or blur commits to the draft, Escape cancels | none: a content widget is an overlay, the lines do not move | Monaco holds no edit; on commit the draft changes, the EBNF re-derives and the wrapper `setValue`s it (no Monaco undo stack); the only undo step is the Save, one `set_state` | **recommended** |
| (b) | Writable model; `onDidChangeModelContent` undoes any change outside an island | none | two stacks: Monaco's keystrokes and the wrapper's whole-range replace (`executeEdits` + `pushUndoStop`) on every re-derivation; Cmd+Z brings back an EBNF that no longer matches the draft; paste across islands, multi-cursor, IME composition, find-and-replace each need a guard | rejected |
| (c) | Writable only while the selection is inside an island (`readOnly` toggled on `onDidChangeCursorSelection`) | none | as (b) inside an island; a selection that starts in an island and ends outside it still edits outside | rejected |
| (d) | Decorations only; a click jumps to the field in the Syntax form | none | none | a fallback, not R-TXT-48: the literal is not edited where it is read |

A view zone (an input in a zone under the line) is ruled out: a zone pushes the following lines down, a layout shift.

### 2.3 The recommended editor in detail

- **Islands**: a decoration per editable literal span, the text between the quotes only, `inlineClassName` with a
  background tint or an underline and a pointer cursor, never padding, margin or border, which change the glyph positions
  Monaco measures. A hover message names the field: «Keyword of class Module». A literal of origin `fixed` or `literal`
  (enum literal) gets no island; in step 1 neither does a `style` one, which keeps a muted, read-only look.
- **Input**: an `IContentWidget` positioned `EXACT` at the literal's first character, the editor's font and line height,
  width `max(literal, value)` in `ch`; the input's background hides the literal under it, and a longer value covers the
  following text rather than moving it. Enter or blur commits, Escape restores, Tab and Shift+Tab move to the next and the
  previous island (the islands are in document order).
- **Linked occurrences**: while an island is open, every span of the same origin gets a second decoration
  (`--linked`), so that `Book` three times, or `begin` six times, show what the edit will change. The other occurrences
  change at the commit, when the EBNF re-derives; they are not rewritten keystroke by keystroke, which would re-derive
  and re-`setValue` on every character.
- **Live check in the widget**: each keystroke reads the candidate draft through `readDraft` (as the form does on every
  change, `SyntaxForm.tsx:78`) and shows the first fault of that field under the input; a value that is not well formed
  for its field (§3.3) disables Enter there.
- **Tokens and styles**: the widget and the decorations get a class in `ui/TextualTab.scss` reading existing tokens
  (`--color-canvas-accent` is already used there for the focus outline, `TextualTab.scss:131`), no new CSS variable
  in a component file (NON-NEGOTIABLE 28); the accent stays `#06b6d4`.
- **Undo**: with no pending draft, Cmd/Ctrl+Z in the EBNF editor goes to the app's undo by the same `addCommand` as the
  Text editor; with a dirty draft it does nothing (the draft has no undo of its own, as in the form today, §5 D6).

## 3. Back into the draft

### 3.1 One edit, one field change (read, `syntaxForm.ts`)

`setField(draft, ref, value)` (`:271-304`) already covers every element origin of §1.2, keyed by the form's `FieldRef`:

| Literal origin (`src`) | `FieldRef` | Note |
|---|---|---|
| class keyword of `C` | `class:<id of C>`, `class.keyword` | `case 'class.keyword': return cls(c => put(c, 'keyword', value));` (`:286`) |
| feature keyword of `O.f` | `feature:<id of O.f>`, `feature.keyword` | the declaring class's feature: an inherited keyword printed in several subclasses is one field (as `locate`'s `featureKey`, `:385-394`) |
| per-item keyword | `feature.itemKeyword` | `:296` |
| name keyword | `class.nameKeyword` | `:289` |
| operator symbol | `class.operatorSymbol` | `:291` |
| call word | `class.operatorCall` | `:294` |
| group name `i` of `E` | `enum:<id of E>`, `enum.subsets` | the whole list with entry `i` renamed (`:301`) |

Names to ids through `contextOf` (`:122`). A literal shown several times has one origin, so one `setField` changes every
occurrence when the grammar re-derives. The unannotated call word follows the class keyword (§1.2).

Two semantics to fix:

- **An empty value clears the field** (`isCleared`, `:254`). For a class keyword, a feature keyword and a call word that is
  «back to the default», same structure; for an item keyword, a name keyword, an operator symbol or a group name it
  removes a structure (`concreteGrammar.ts:534` vs `:539`; `annotations.ts:281` `'the operator has no symbol'`). The EBNF
  refuses an empty value for those four (§5 D4); positional stays a form toggle.
- **A value equal to the default is written as given.** The form never stores a default (`syntaxForm.ts:55`, «shown as
  the placeholder, never stored (F1)»); the EBNF should store it as cleared. The placeholder is not the printed default
  under a case: `{ placeholder: c.name }` (`:185`) ignores `classCase` (`concreteGrammar.ts:302` prints
  `applyCase(r.cls, classCase)`), and the call word's placeholder is `c.name` (`:197`) where the default is the class
  keyword (`concreteGrammar.ts:384`). The exact default: the text of the same origin in the grammar derived with the
  field cleared, one more derivation per commit.

### 3.2 Where the draft lives

The draft is the form's local state: `const [draft, setDraft] = useState<SyntaxAnnotations>(() => decoded.record ??
EMPTY_DRAFT);` (`SyntaxForm.tsx:63`), with `base` (`:65`), the `storedChange` effect (`:71-75`), `reading` (`:78`), the gate
(`:85`) and `save` (`:91-95`). The EBNF mode renders the stored `view.ebnf` (§2.1). So an EBNF edit has no draft to go to
today, and H4 holds only partly.

What it takes: lift draft, base, the `storedChange` effect, reading, gate and save into one hook (new `ui/useSyntaxDraft.ts`)
owned by `TextualTab` and passed to the form and the EBNF view. `SyntaxFormProps` (`SyntaxForm.tsx:27`) gains one
optional prop; without it the form keeps its own state (NON-NEGOTIABLE 11). Then the EBNF mode shows
`draftPreview(...).ebnf` (`syntaxForm.ts:575`), equal to `view.ebnf` while clean; form and EBNF are in step by
construction, and a store change under them goes through `storedChange` (`:623-627`).

### 3.3 Checks, findings, Save

- **Well-formedness before the draft**, per field, the resolution's rules: class keyword `isKeyword` (`annotations.ts:264`),
  feature keyword identifier or one punctuation token (`:133`), item and name keyword `IDENTIFIER` (`:299`, `:269`), symbol
  `isSymbol` (`:136`), call word (`:283`), group name (`:314`). A failing value is refused in the widget, never written
  (written, the resolution drops it and the EBNF shows the default). Gap: `isSymbol` admits `"` and `quoted`
  (`concreteGrammar.ts:667`) does not escape; the widget refuses `"`.
- **Faults at the literal**: `readDraft` (`syntaxForm.ts:487-511`) gives de-duplicated faults with `at: FieldRef[]` (D9);
  each field maps to the spans of the same origin, one marker each, the same message (`byField`, `:514-524`). Faults at
  fields with no literal (layout, positional, inline, groupBy, `language.*`, precedence, associativity, pattern) go to the
  bar's list.
- **Save**: the same `saveGate` (`:557-567`, R-TXT-47 D1's three blocks), `recordToSave` (`:570`), `writeSyntax`
  (`openTextualTab.tsx:56-62`, one `set_state`, one undo step). The EBNF bar's lock becomes the draft's state with Save
  and Discard: a visual change.
