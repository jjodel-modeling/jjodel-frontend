# Discovery — textual step C lane C2: the Syntax mode of the Text tab (T4b), and three follow-ups

Prompt: P-2026-11-04-2342 · Chat: C-2026-11-03-1037 · Front: codegen · Branch `textual-c2-syntax-form` from `c09e8f22f`
Read only: no source file changed. The probe of §1.2 lives in the lane folder, outside the repository.

## 0. Objective

(1) Design the third mode «Syntax» of the Text tab (R-TXT-40 D6): the fields the syntax record supports after C1 and
C1d, their current values, which `checkStyle` finding maps to which field, the component tree and its state, the live
preview, Save as one undo step, Basic and Advanced. (2) The `{"v":1}` left by a switch back to C-like. (3) The false
«the app named» after a name is removed. (4) A v2-flow reference to a nameless target drawn as `—`. (5) The lanes and
the decisions D1..Dn.

## 1. Inputs

### 1.1 Files read (full paths under `/Users/alfonso/jjodel-w-textc2/`)

| File | What was read |
|------|---------------|
| `docs/discovery/discovery_2026-11-04_textual_step_c.md` | §3 (F11-F14, §3.2), §4.2, §5, §8 D6 |
| `docs/decisions.md` | R-TXT-16, R-TXT-23, R-TXT-27, R-TXT-40, R-TXT-41, R-TXT-44, R-TXT-45, R-TXT-46, R-SIM-99 |
| `docs/log-inbox/codegen.md` | :1610-1620 (C3a, the `{"v":1}` open point), :1793-1805 (P-2026-11-04-2321) |
| `frontend/src/codegen/textual/annotations.ts` | whole file (326 lines) |
| `frontend/src/codegen/textual/syntaxRecord.ts` | whole file (220 lines) |
| `frontend/src/codegen/textual/style.ts` | whole file (89 lines) |
| `frontend/src/codegen/textual/styleCheck.ts` | :1-262, the `where` of every finding; `ll1Conflicts` :294-307 |
| `frontend/src/codegen/textual/concreteGrammar.ts` | every `refuse`/`remark` site (:232-601), `annotationIssues` :647-653 |
| `frontend/src/codegen/textual/textDiff.ts` | :420-636 (`diffLines`, `planTextEdit`) |
| `frontend/src/codegen/textual/ui/TextualTab.tsx` | :200-335, :545-596, :810-930, :1080-1160, :1285-1413 |
| `frontend/src/codegen/textual/ui/openTextualTab.tsx` | whole file (218 lines) |
| `frontend/src/codegen/textual/ui/TextualTab.scss` | the tokens it uses |
| `frontend/src/codegen/textual/__tests__/textualEdit.test.ts` | :730-784 (the `named` tests) |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | :298-457 (the reference branch of `objectVertexToRFNode`) |
| `frontend/src/components/editor-v2/nodes/valueRenderer.ts` | :381-387 (`isEmptySlot`) |
| `frontend/src/components/editor-v2/nodes/RowValue.tsx` | :232-341 |
| `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` | :540-560, :637-670, :860-880, :1088-1100, :1310-1331 |
| `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx` | :147-161 (`displayValue`) |
| `frontend/src/components/editor-v2/utils/__tests__/namelessRefTarget.test.ts` | the assertions |
| `frontend/src/styles/tokens/_colors-light.scss`, `_spacing.scss` | accent and slate tokens, the spacing scale |
| `frontend/src/hooks/useInterfaceMode.ts` | exports (`useInterfaceMode`, `isAdvancedMode`) |
| `~/.jjodel-lanes/P-2026-11-04-2255/sD4-v2flow-peer-to-nameless.png` | the crop of item (4) |

### 1.2 Probe

`~/.jjodel-lanes/P-2026-11-04-2342/probe/c2.test.ts`, run with its own `vitest.config.mjs` (root `frontend/`) through
`run-quiet` (log `.agent-logs/c2probe-20261104-234416.log`, exit 0, 1 test passed); output
`~/.jjodel-lanes/P-2026-11-04-2342/probe/c2.out.txt` (24 lines). It measures (a) F13 again on the current code, on the
step C probe's library record at 1,000 objects and on the BOOL and PORT corpora; (b) F12 again, the findings of
`checkStyle` for the seven ambiguous records, and how many `textualNotation` issues (what the tab shows today) each
yields; (c) the record `{"v":1}` against no record on the three corpora, and the record a switch back from Pascal writes.

## 2. Item (1) — the Syntax mode

### 2.1 Findings

**F1. The fields the record supports today** (annotations.ts:16-75, resolution :210-320). A field the record leaves
absent prints its default; the form shows the default as the placeholder, never as a stored value.

| Kind | Field | Record path | Accepted values (annotations.ts) | Default shown | Applies only where (concreteGrammar.ts refusal) |
|------|-------|-------------|----------------------------------|---------------|------------------------------------------------|
| Language | name | `language` | non-empty string (:231-234) | the metamodel's name | — |
| Language | style | `style.base` | `clike`, `pascal` (style.ts:81-86) | C-like | — |
| Language | class case, literal case | `style.classCase`, `style.literalCase` | `declared`, `lower` (:241-242) | declared | — |
| Language | blank line before a containment | `style.blankBeforeContainment` | boolean (:243-246) | off | — |
| Language | top level | `roots` | `uncontained` or class ids (:248-257) | every concrete class | concrete classes, at least one left (:597, :601) |
| Class | keyword | `classes[id].keyword` | identifier, or `''` = positional (:264) | the class name | concrete class (:271); `''` needs a mandatory name (:339) |
| Class | layout | `classes[id].layout` | `block`, `line`, `call` (:265) | block | `line`: no containment that is not inline (:290), mandatory name (:331); `call`: no containment, every argument single-valued and mandatory (:297-299), mandatory name (:335) |
| Class | name keyword | `classes[id].name.keyword` | identifier (:268-271) | none (name in the head) | a class with a name attribute (:310) |
| Class | name pattern | `classes[id].name.default` | pattern `{attr}`, `( ... )?` (:146-186) | none | holes are single-valued attributes of the class (:320) |
| Class | operator symbol, precedence, assoc, call word | `classes[id].operator.{symbol,precedence,assoc,call}` | symbol: identifier or a run of symbol characters; precedence integer; assoc `left`/`right`; call identifier (:279-289) | not an operator | the class has an operator's shape, `operatorFixity` (:139-144, refusal :375, :380); call word only n-ary (:385) |
| Feature | keyword | `features[id].keyword` | identifier, `''` = positional, or one punctuation token such as `:` (:298, :133) | the feature name | not `name` (:277), not a style word (:410) |
| Feature | per-item keyword | `features[id].itemKeyword` | identifier (:299) | none | a many-valued containment (:511), not with groupBy (:515) |
| Feature | inline | `features[id].inline` | boolean (:300) | off | a containment (:541) |
| Feature | grouped by | `features[id].groupBy` | the id of an enumeration attribute of the contained class (:302-306) | none | a containment (:542), checks of :439 |
| Feature | printed as a name | `features[id].value` | `name` (:301) | quoted string | a string attribute (:418, :519) |
| Enumeration | groups of literals | `enums[id].subsets[]` | `{name: identifier, literals: string[]}` (:310-317) | none | — |

**F2. The current values** are `decoded.record` of `storedNotation(lookup, metamodelId)` (TextualTab.tsx:113, :914),
keyed by D-layer element ids (`elementIdsOf`, syntaxRecord.ts:144-173): a renamed element keeps its annotation. The
form needs no new reader.

**F3. The tab does not run `checkStyle` today.** `textualNotation` returns the record's decoding issues, the case
notices and the derivation's refusals (syntaxRecord.ts:187-200); the bar shows those (`NotationIssues`,
TextualTab.tsx:551-569, :1374). The grammar conditions of `checkStyle` (distinct keywords, LL(1), operator tokens) are
evaluated only in the tests (`checkStyle` has no caller in `frontend/src` outside `styleCheck.ts` and four test files;
the search found its own definition, so it ran). Probe (b): «two classes, one keyword» gives 4 `checkStyle` errors and
0 notation issues; «two operators, one symbol» and «an operator symbol that is a block token» give 1 error each and 0
notation issues. The record is only written by the style picker today, which cannot make a grammar ambiguous; a form
can, so Save has to gate on `checkStyle`, not on `view.issues`.

**F4. F12 on the current code** (probe (b), out :4-20). C1a turned the two notices into errors:

| Case | `checkStyle` findings now | Field it belongs to |
|------|---------------------------|---------------------|
| two classes, one keyword | 4 errors: `distinct-classes` at `Model` and at `Expr_`, `annotations` «not LL(1)» at `rule Model` and `rule Expr_` | the keyword of And and of Or: **one fault** |
| two positional containments | 1: `annotations` at `Imp.left`, «"{", "{}" can both start the optional part and follow it» | the keyword of Imp.left and Imp.right; the message names tokens |
| a class keyword that is a block token | 1: `annotations` at `class Rule` | the keyword of Rule |
| an operator symbol that is a block token | 1: `operator-tokens` at `class And` | the symbol of And |
| two operators, one symbol | 1: `operator-symbols` at `class Or` | the symbol of Or (and of And) |
| a one-line class with an optional name | 1: `annotations` at `class Sheet`, the containment rule | the layout of Sheet |
| an unknown class id | 1: `annotations` at `classes` | an entry whose element is gone |

**F5. The `where` vocabulary**, every site (styleCheck.ts, concreteGrammar.ts, annotations.ts), and the field it maps to:

| Rule (`StyleRule`) | `where` | Field |
|--------------------|---------|-------|
| `distinct-features` (:104, :117) | `class C`; the message lists `Owner.f` | the keyword (or item keyword) of each listed feature |
| `distinct-classes` (:143) | `Model` or a choice rule (`Expr_`) | the keyword of each class the message lists |
| `case-injective` (:148, :153, :163) | `style <id>`, `enumeration E`, `class C` | Language: class case or literal case |
| `reserved-words`, `list-tokens`, `terminator`, `outer-reference` (:168-204); `block-delimiters` at `style.*` (:173-174) | `style.<param>` | the style picker; a catalog style passes them all (they guard the style, not the record) |
| `block-delimiters` (:177, :179) | `class C`, `C.f` | the class keyword, the feature keyword |
| `annotations`, resolution (annotations.ts:226-317) | `class C`, `C.f`, `enumeration E`, `language`, `style`, `roots`; `classes`/`features`/`enums` for an unknown id; `annotations record` for decoding (syntaxRecord.ts:49) | the field the message names; an unknown id is a stale entry |
| `annotations`, derivation (concreteGrammar.ts:271-601) | `class C`, `C.f`, `roots` | the field the refusal names (layout, keyword, name, operator, itemKeyword, inline, groupBy, value) |
| `annotations`, LL(1) (styleCheck.ts:218, :307) | `rule R` or `R.f` | `R.f`: the keyword, inline and item keyword of that feature; `rule R`: the keywords of the classes at that position |
| `operator-fixity`, `operator-symbols`, `operator-tokens`, `operator-follow` (:238-253) | `class C` | the operator symbol of C |
| `call-words` (:259-262) | `class C` | the call word of C |

The duplicates come from one fault seen at every position that contains the class (F12's note): `distinct-classes` and
the LL(1) conflict on the same keyword, once per position. Deduplication key: the field, the offending token, and the
set of classes or features named; the LL(1) finding is dropped when a `distinct-classes` finding at the same position
names the same token. On the probe this turns 4 lines into 1, shown at the keyword of And with «also the keyword of
Or», and at Or the other way round.

**F6. Preview cost, re-measured** (probe (a), out :1-3; median of 15):

| Case | Objects | derive | check | EBNF | print | total |
|------|--------:|-------:|------:|-----:|------:|------:|
| library (F13's record) | 1,000 | 0.13 | 0.10 | 0.02 | 4.85 | **5.03 ms** |
| bool | 48 | 0.11 | 0.12 | 0.02 | 0.25 | 0.51 ms |
| port | 12 | 0.08 | 0.07 | 0.02 | 0.05 | 0.22 ms |

F13 gave 3.64 ms at 1,000 objects; the print grew by 1.4 ms with C1. One preview per change fits one frame at 1,000
objects; at ten times that (not measured) it would not.

**F7. Design tokens.** The Text tab already uses the project tokens for every colour it shows
(`--color-text-primary/-secondary/-tertiary`, `--color-border-secondary`, `--color-canvas-accent`, ...). Slate #334155
is `$slate-700` (_colors-light.scss:32). The tab's active accent is `--color-canvas-accent`, `#06b6d4` (cyan-500,
:205); `#0ea5e9`, the prompt's cyan, is sky-500 and is the token of the toolbar's active button
(`--color-toolbar-btn-active-text`, :281) and of the required marker (:415). The spacing scale has 8 px at `--space-2`.
`useInterfaceMode()` (hooks/useInterfaceMode.ts:57) gives Basic or Advanced.

### 2.2 Recommended design

**Where.** `TextualMode` becomes `'text' | 'ebnf' | 'syntax'` (TextualTab.tsx:816), a third entry in `MODES` (:818-821):
«Syntax», `bi-sliders`, title «The syntax annotations of the notation». The Text layer stays mounted under it, as it
does under EBNF (:1389), so a pending edit survives. The mode exists only when `writeSyntax` is given (the bar's style
picker has the same condition, :1337); the new-model tab gets none.

**Component tree.**

```
TextualTab                       mode 'syntax' → <SyntaxForm .../>
└─ SyntaxForm                    ui/SyntaxForm.tsx (new); props: mm, ids, decoded, storedRaw, objects, canSave, onSave
   ├─ form bar                   «Unsaved changes» | «Saved» · Discard · Save (bi-check2) · finding count
   ├─ element list (240 px)      Language · Classes · Enumerations; filter; a cyan dot when annotated, a red mark when a finding maps there
   ├─ element editor             LanguageFields | ClassFields (+ one FeatureRow per own feature) | EnumFields
   │   └─ each field             label 11 px, input, a fixed 16 px finding line under it
   └─ preview (right, resizable) Text | EBNF, read-only Monaco, from the draft
```

**State.** `draft: SyntaxAnnotations` (`useState`, from `decoded.record ?? { v: 1 }`); `selected` (an element key);
derived with `useMemo`: `notation = textualNotation(mm, { record: draft, issues: [] }, ids)`,
`findings = dedupe(checkStyle(notation.grammar))` plus the stored record's decoding issues, `byField` (F5's map), the
preview `{ ebnf: concreteGrammarEbnf(grammar), text: printTextModel(grammar, objects).text }` computed from
`useDeferredValue(draft)` so typing never waits on the print (F6). `dirty = encodeSyntax(draft) !== storedRaw`, with
`{"v":1}` equal to no key (§3.1). The pure parts (the field setter that drops an emptied entry, so clearing a field
leaves no `{}`; the field list of an element with its applicability; `dedupe`; `byField`) go in a pure module
`syntaxForm.ts`, importable by the bench, so the mutation benches of CLAUDE.md §5 can run on them.

**Save.** `onSave(draft)` is `writeTextualSyntax` (openTextualTab.tsx:55): one `set_state`, one undo step, nothing when
the record is the stored one (F11). Save is disabled while (a) a finding of level `error` exists, with the count and the
first message in its title; (b) the draft is the stored record; (c) the Text tab holds a pending edit, the gate of the
style picker (`canSwitchStyle`, TextualTab.tsx:871), title «Apply or discard the edit in Text first». After Save the
Text layer reprints through `onModelPrint` as it does after a style switch. A change of the stored record under a clean
draft (an undo, another tab) resets the draft; under a dirty one the draft is kept and the bar says «The stored syntax
changed» with Reload, the Text tab's stale pattern (:1327-1336).

**Basic and Advanced** (the R-TXT-44 goal: the first-time author sees what changes the look of the text, nothing else).

| Basic | Advanced only |
|-------|---------------|
| Language: name, style | class case, literal case, blank line before containment, top level (`roots`) |
| Class: keyword, layout block / one line | positional (no keyword), layout call, name keyword, name pattern, operator (symbol, precedence, assoc, call word) |
| Feature: keyword, per-item keyword (many-valued containments only) | positional (no keyword), inline, grouped by, printed as a name |
| — | Enumeration: groups of literals |

A field is offered only where F1's last column says it can apply (an abstract class has no class fields; the operator
group shows only on a class with an operator's shape; per-item keyword only on a many-valued containment), so the
refusals of the derivation are not reachable from the form, and what `checkStyle` still refuses is shown at the field.
In Basic, an element that carries Advanced fields in the stored record says so in one line («2 advanced settings»),
so nothing in effect is hidden. Messages that name tokens (F4 row 2) are rewritten at the field: «the two features
have no keyword, so the parser cannot tell which one a value is for».

**Design system.** Colours from the tab's existing tokens only, no CSS variable in the component's stylesheet (rule
28): the active mode and the annotated dot in `--color-canvas-accent` like the Text and EBNF buttons, labels in
`--color-text-tertiary` at 11 px, errors in `--color-error-text`, the 8 px grid of `--space-*`. Bootstrap Icons only
(`bi-sliders`, `bi-type`, `bi-box`, `bi-list-ul`, `bi-file-earmark-code`, `bi-exclamation-triangle`, `bi-info-circle`).
No layout shift: every field has its finding line reserved, the preview pane has a fixed width until resized, Save
changes state, not size.

**Rejected.** Saving on every change (each keystroke an undo step, and an ambiguous record would reach the parser);
the bar's `NotationIssues` as the gate (F3); a JSON editor (F11's reason); a Basic/Advanced toggle of the form's own
(the global mode is the one control the author already knows).
