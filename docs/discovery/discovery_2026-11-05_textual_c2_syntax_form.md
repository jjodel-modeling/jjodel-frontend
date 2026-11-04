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

## 3. The three follow-ups

### 3.1 Item (2) — the leftover `{"v":1}`

**Root cause.** By design, not by slip. `withStyleBase` drops a style left empty and returns the rest of the record,
`{ v: 1 }` when nothing else is set (syntaxRecord.ts:212-217); `syntaxPatch` writes whenever the encoded record differs
from the stored string (:121-124), and the module's contract says an emptied record is written `{"v":1}`, never
removed, because the undo of a removed bag key does not restore it (:8-9; the same measurement as R-SIM-99, «off
writes `false` and does not remove the key»). Probe (c), out :24: from Pascal, the switch back writes
`{"textSyntax":"{\"v\":1}"}`; and `syntaxPatch(undefined, { v: 1 })` also writes `{"v":1}`, so a first save of an
empty draft from the form would create the key on a metamodel that had none.

**Effect.** None on the notation: on library, bool and port, `{"v":1}` and no record give the same EBNF, the same print
and no issue (out :21-23). The visible differences are only the key in the bag (a saved project carries it) and that a
clike, pascal, clike round trip does not return the bag byte for byte.

**Minimal fix.** Keep the contract (removing the key would bring back the undo defect R-SIM-99 measured) and make the
empty record equal to no key in the one comparison that decides a write: in `syntaxPatch`, `encoded === raw ||
(raw == null && encoded === EMPTY)` returns `null`, with `EMPTY = encodeSyntax({ v: 1 })`. A switch with no record
before it then writes nothing; a switch back from Pascal still writes `{"v":1}`, which is the record's empty form and
reads as no record. The form's `dirty` uses the same equality (§2.2). One file (`syntaxRecord.ts`) and its test.
Removing the key instead would need a measured undo of a removed `_state` key first, a reducer question outside this
front (D3).

### 3.2 Item (3) — the false «the app named»

**Root cause.** textDiff.ts:559: removing a name writes `set h.name = ""` and pushes the handle into `named`, the list of
objects «the app may name although the text gives them none» (:428-433). That held under R-TXT-44, when the core read
an empty slot as the initial name. Under R-TXT-45 and R-TXT-46 D1 (variant B, merged in `c7cd7e479`) a slot written
`""` reads nameless, so the object is not named. The create path was already corrected for the same reason
(:544-549, its comment), the attribute path was not. Then `apply` (TextualTab.tsx:1132-1135): `namedReprint` returns the
print whenever `plan.named` is non-empty and the print differs from the typed text (:301-303). A typed text that
differs from the print only in layout makes the two differ, the tab reprints, and the status says «the app named 1
object the text leaves nameless» (:590-591), for an object the core left nameless. The tests pin the old list:
textualEdit.test.ts:775 (`['result']`) and :782.

**Fix.** Measure instead of predicting. Keep `named` as the candidates (rename the doc to «may name»), and in `apply`
keep only those the model actually names after the run: for each handle in `plan.named`, its id from `plan.handles`,
its object in `after.base.objects`, kept when `identityOf(after.base.grammar, o) !== null` (textMatch.ts:115). Reprint
and the status sentence only for that list; when it is empty the typed text stays the agreement, as for any applied
edit. This also keeps R-TXT-44 (1)'s reprint for the case R-TXT-45 left to it, «only where the core still assigns a
name». Simpler but blind: drop `named.push(h)` at :559, as the create path did; if the core ever names a cleared
object again, the tab would keep a text that differs from the model. Recommended: the measured filter (D4). Files:
`ui/TextualTab.tsx` (`apply`, `namedReprint` takes the measured list), `__tests__/textualEdit.test.ts`; `textDiff.ts`
only for the comment.

### 3.3 Item (4) — a reference to a nameless target drawn as `—`

**What the crop shows** (sD4): the node `cpu : Module` has `inputs [3] —`: three nameless Ports, rendered as an empty
slot, while each Port's own header reads `: Port`. This is the default object node (ObjectNode, `RowValue`), not the IR
form.

**Where the label is computed.** `objectVertexToRFNode`, the reference branch, in
`frontend/src/components/editor-v2/utils/jjomTransformers.ts`: a resolved nameless target gets `rv.name ?? ''` (:369),
pushed into `names` and `targets` as `''` (:378-381); `value = names.join(', ') || '—'` (:397). The row's decision is
then `dash`: `isEmptySlot` reads `values` `['', '', '']` as blank (nodes/valueRenderer.ts:384), and `RowValue` paints
`—` (nodes/RowValue.tsx:246-247), the same as an unset slot. A row with a pill would paint `t.name`, `''`
(RowValue.tsx:335).

**Critical zone.** `jjomTransformers.ts` is not in the CLAUDE.md §3.1 table, and it has no §3.2 trigger (it reads; it
writes no D-layer field). It is imported by two files that are in §3.1, `useJjomSync.ts` (:33, `jjomVertexToRFNode` at
:1257) and `portDistribution.ts`, as a pure transformer of node data; the change is confined to the `features` rows of an
object node, which neither of them reads for edges or handles (to be confirmed by the lane, §5 R4). The IR form's chip,
`displayValue` in `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx:147-161`, labels a nameless target
`''` too; that file **is** in the critical zone (§3.1, `viewpoint/ir/`), so for it this report stops at the proposal.

**Proposal.** A resolved target whose name is empty is labelled `: <Class>`, the target's metaclass name, as its header
shows (ObjectNode.tsx:1324-1330). In jjomTransformers.ts, next to :369, keep `name: ''` in `refTargets` (the test
namelessRefTarget.test.ts:80 pins it, and `rememberRefTargetName` should not remember a label as a name) and add an
optional `label` to the target (types.ts:246, an optional property, rule 11), `: ${rv.instanceof?.name ?? 'Object'}`;
`names` takes the label, so `value` and `values` are not blank and the decision is `refPill`; `RowValue` paints
`t.label ?? t.name` (:322, :331, :335). Three chips `: Port` in sD4's `inputs` row. A deleted nameless target keeps the
broken path (`lastSeenRefTargetName`, :391), unchanged. For the IR chip the same label at IRFormField.tsx:154
(`l.name || ': ' + l.instanceof?.name`), in a lane of its own with the critical-zone rules (D6). Files of the
default-view lane: `jjomTransformers.ts`, `types.ts`, `nodes/RowValue.tsx`, `utils/__tests__/namelessRefTarget.test.ts`.

## 4. Item (5) — lanes, in order

Each lane at five files or fewer (rule 19); paths under `frontend/src/codegen/textual/` unless written in full.

| Order | Lane | What | Files | Visual |
|------:|------|------|-------|--------|
| 1 | C2c | item (3): the measured `named` list, the status sentence only for objects the model names | `ui/TextualTab.tsx`, `textDiff.ts` (comment), `__tests__/textualEdit.test.ts` | yes: the status line after removing a name with a layout-only difference (the s8b scene) |
| 2 | C2a | the pure module of the form and item (2): field list and applicability (F1), the setter that drops emptied entries, `dedupe`, `byField` (F5), `{"v":1}` equal to no key in `syntaxPatch` | `syntaxForm.ts` (new), `__tests__/syntaxForm.test.ts` (new), `syntaxRecord.ts`, `__tests__/syntaxRecord.test.ts` | no |
| 3 | C2b | the Syntax mode: the form, the preview, Save, Basic and Advanced; the bar's issues also carry the deduplicated `checkStyle` errors (D9) | `ui/SyntaxForm.tsx` (new), `ui/SyntaxForm.scss` (new), `ui/TextualTab.tsx`, `ui/openTextualTab.tsx` (comment of `writeTextualSyntax`) | yes: Basic and Advanced on the port model, a finding at a field and Save disabled, Save then the Text reprinted, one Undo restoring both |
| 4 | C2d | item (4) on the default view: the `: <Class>` label of a nameless target | `frontend/src/components/editor-v2/utils/jjomTransformers.ts`, `.../editor-v2/types.ts`, `.../editor-v2/nodes/RowValue.tsx`, `.../editor-v2/utils/__tests__/namelessRefTarget.test.ts` | yes: the sD4 scene, `inputs [3]` with three `: Port` chips; a named and a broken target unchanged |
| 5 | C2e | item (4) on the IR form chip, critical zone (§3.1 `viewpoint/ir/`), effort xhigh | `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx`, `.../editor-v2/utils/__tests__/namelessRefTarget.test.ts` | yes: an IR view with a reference to a nameless target |

C2c and C2b both touch `ui/TextualTab.tsx`, so they run in sequence, C2c first (small, independent of the form). C2a
precedes C2b, which imports it. C2d and C2e share no file with the textual lanes and can run in parallel with them;
C2d names the view layer (rule 20) in its prompt. C3b (indentation and the deletion guard) stays last, after C2b, as
R-TXT-40 D5 orders.

## 5. Risks

- **R1.** `ui/TextualTab.tsx` is 1,593 lines and hot (CLAUDE.md §2.5): the form goes in its own file, and the tab gains
  only the mode, the props, and the gate it already computes (`canSwitchStyle`).
- **R2.** Preview cost beyond 1,000 objects is not measured (F6: 5.03 ms at 1,000, print dominant). `useDeferredValue`
  keeps the inputs responsive; C2b measures one model of 10,000 objects before choosing anything more.
- **R3.** A Save while the Text tab holds a pending edit would turn that edit stale under a new grammar: gated (§2.2 (c)).
- **R4.** `jjomTransformers.ts` feeds `useJjomSync.ts` and `portDistribution.ts` (critical zone). C2d must confirm by a
  search that neither reads `refTargets` or the reference row's `value` for an edge key, a handle or a guard; if one
  does, C2d stops and reports (rule 20). ObjectNode.tsx:554 passes `t.name` to `readSingletonInstanceInfo`: with
  `name` kept `''` that call is unchanged.
- **R5.** Deduplication by message text is brittle: `dedupe` keys on the field and the token, and its test runs the
  probe's seven records (F4) as cases, each with a mutation that breaks one key component.
- **R6.** A stored record with an entry whose element was deleted resolves with an error that the author cannot fix in
  the form (F4 last row): D7.

## 6. Open questions

- **Q1.** Should the preview highlight the printed objects of the selected class (the print's spans hold them)? Not in
  C2b; worth asking after the first crops.
- **Q2.** The new-model tab has no record writer; whether it should show the Syntax mode of its metamodel is left out of
  C2 (R-TXT-23 keeps one textual entry per model).

## 7. Decisions recommended

- **D1. The Syntax mode as designed in §2.2**: a draft, a live preview from the deferred draft, Save through
  `writeTextualSyntax` as one undo step, Save disabled on any `checkStyle` error, on an unchanged draft and on a pending
  Text edit. Recommended: yes.
- **D2. Basic and Advanced** as the table of §2.2, fields offered only where they can apply, Advanced fields in effect
  announced in Basic. Recommended: yes.
- **D3. `{"v":1}`**: keep the never-remove contract (R-SIM-99's undo measurement), make the empty record equal to no key
  in `syntaxPatch` and in the form's `dirty`. Recommended: yes; removing the key only after a measured undo of a removed
  `_state` key.
- **D4. The false «the app named»**: filter `plan.named` by the model after the run (measured), not drop the list.
  Recommended: the measured filter.
- **D5. A nameless reference target on the default view** reads `: <Class>`, through an optional `label` on the target
  (`name` stays `''`). Recommended: yes, lane C2d.
- **D6. The IR chip** gets the same label in a lane of its own under the critical-zone rules, after D5's crop is
  accepted. Recommended: yes, low priority.
- **D7. Stale entries** (an annotation of a deleted element): the form shows «N annotations of deleted elements» once,
  they do not block Save, and Save writes the record without them. Recommended: yes (blocking Save on something the
  form cannot edit would leave the author stuck).
- **D8. The accent**: the form uses `--color-canvas-accent` (#06b6d4), the token of the Text and EBNF mode buttons it
  sits next to, not #0ea5e9 (the toolbar's active token). Recommended: yes; a different accent is a design-system
  decision for its own lane.
- **D9. The Text tab's bar shows the deduplicated `checkStyle` errors too** (F3), so a record that reaches the tab by
  another path (an imported project) does not print a text that would not read back without saying so. Recommended:
  yes, in C2b.
- **D10. Lane order** C2c, C2a, C2b, then C3b; C2d and C2e in parallel with them. Recommended: yes.
