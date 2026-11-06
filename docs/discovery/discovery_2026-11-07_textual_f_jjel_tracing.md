# Discovery: textual syntax step F, embedded JjEL and tracing (P-2026-11-06-2357)

- Prompt-ID: P-2026-11-06-2357, prompt `docs/prompts/claude_2026-11-06_2357_prompt_textual_f_discovery.md`
- Chat: C-2026-11-03-1037; session `e90eed04-44e4-4de6-83fb-e6fd9286d519`
- Tree: `~/jjodel-w-textf`, branch `textual-f-jjel-tracing`, HEAD `6b38a1318` (the prompt's commit on `65852b291`), clean at start
- Executor: Opus 5.5 (`claude-opus-5-5`)
- Read only. One probe in `~/.jjodel-lanes/P-2026-11-06-2357/` (`probe_jjel.ts`, bundled to `probe_jjel.mjs` with the repo's
  esbuild, output `probe_jjel.out`), run with node on this HEAD. Three read-only explorer passes did part of the reading;
  every claim below that the report relies on was re-read or re-run in this session unless tagged otherwise.

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the real files.

## 1. Objective and hypotheses

Objective: find where JjEL lives in a model the Text tab prints, what the Text tab and the JjEL modules give for
highlighting, checking and completion inside such a string, what the codegen pipeline keeps for a trace from a generated
line back to the model, what T8 is, and cut step F into lanes of five files or fewer.

Hypotheses under test, with the verdict (evidence in the sections named):

- H1. The Text tab already knows which attributes hold JjEL. **Falsified** (§3): `TextAttribute.type` is a name string,
  and the only JjEL marker in the core is the primitive's id (`Pointer_EXPRESSION`, `Pointer_ACTION`), which the textual
  metamodel does not carry.
- H2. A JjEL value survives the print and re-parse of the textual notation, and its offsets can be mapped back to the
  document. **Holds, measured** (§4.2): nine values in three styles, quotes, backslashes and a newline included.
- H3. The JjEL parser gives errors with offsets and recovers. **Falsified** (§4.1): one error, line and column only, no
  end, no recovery; the AST nodes carry offsets.
- H4. A JjEL checker that resolves names against a metaclass exists. **Falsified** (§4.1): syntax checks only, plus
  run-time `undefined-identifier`; the nearest static name check is the template completion's class model.
- H5. The codegen pipeline keeps no origin per output line. **Falsified** (§5.1): origins per fragment, a line and
  column map per output, click-to-canvas and canvas-to-code already ship in the generator tab.
- H6. A click on a generated line can reveal the object in the Text tab with what exists. **Partly** (§5.3): the ids
  match on reading and step E's canvas-to-text listener would carry it through the canvas, but the Text tab has no entry
  point of its own.
- H7. T8 is defined in the docs. **Holds** (§6): `discovery_2026-11-01_textual_viewpoint.md:812`, re-import of an exported
  file; half of its cascade exists in `textMatch.ts`.

## 2. Files read

Windows read in this session (paths under `/Users/alfonso/jjodel-w-textf/`); the explorer passes read more of the same
files and their claims are re-read where the report uses them.

- `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md` (whole, 56 lines)
- `docs/decisions.md` 1955-1962 (R-SIM-44), 7000-7040 (R-TXT-17..22), the injected R-TXT-34, RC-51, RC-17
- `docs/discovery/discovery_2026-11-01_textual_viewpoint.md` 745-844 (the cascade, the plan table A.7, the questions A.9)
- `docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md` 1-30, 316-385 (format of the lane plan)
- `docs/discovery/discovery_2026-11-06_textual_e_sync.md`, read from branch `textual-e-sync` (`34035b3a0`), 189-256 and
  423-472: it is not on this branch
- `docs/log-inbox/codegen.md` 2289-2301 (D1 entry)
- `frontend/src/codegen/textual/parser.ts` 216-242 (tokens); `languageService.ts` 190-200, 540-585;
  `ui/textualMonaco.ts` 175-200; `ui/TextualTab.tsx` 150-194; `metamodel.ts` 9-22; `baseGrammar.ts` 45-50
- `frontend/src/codegen/ui/templateCompletion.ts` 1-30, 35-70, 339-382; `codeOrigins.ts` 40-52;
  `frontend/src/codegen/engine/text.ts` 36-44
- `frontend/src/model/conformance/ConformanceValidator.ts` 15-30, 236-262; `model/validation/validationTypes.ts` 186-191;
  `model/simulation/netTypes.ts` 56-58, 154-166; `common/Defaults.ts` 38-42, 84-88; `joiner/classes.ts` 1185-1188
- `frontend/src/jjel/lexer/index.ts`, `jjel/parser/index.ts` (export lines); `jjel/lexer/lexer.ts` 37-42
- Read by an explorer pass and cited as such, not re-read: `jjel/index.ts`, `jjel/parser/parser.ts` 1040-1143,
  `jjel/types/ast.ts`, `jjel/autocomplete/`, `codegen/engine/{generate,generateFiles,origin}.ts`,
  `codegen/ui/{GeneratorPane.tsx,canvasSelection.ts,codeLines.ts,templateLanguage.ts,templateMarkers.ts}`,
  `events/registry.ts`, `components/editor-v2/EditorV2.tsx` 1167-1188, `textual/textMatch.ts`, `textual/ui/TextConfirmPanel.tsx`,
  `docs/discovery/discovery_2026-10-31_codegen_origins_through_concat.md`

## 3. Where JjEL appears in a textual model

### 3.1 What the Text tab prints (read)

The Text tab prints an **M1 model** against its metamodel: `TextualTab.tsx:179` `for (const h of list(globals.instances))`
builds the objects, and `:156-161` builds the `TextMetamodel` from `globals.classes`, each attribute as
`{ name: nameOf(a), type: String(a.type ?? ''), ... }` (`:161`). `TextAttribute.type` is documented as «A primitive type
name (`EInt`, `EString`, ...) or the name of an enumeration» (`metamodel.ts:12`), and the base grammar maps every type it
does not know to a string: `baseGrammar.ts:45-49` `if (type === 'EBoolean') return 'BOOL'; return 'STRING';`. So a JjEL
value prints today as a plain quoted string, exactly like an `EString` (measured in §4.2).

M2 elements that hold JjEL are **not** printed by the Text tab: a validation rule's `body` (`validationTypes.ts:188-190`
«Il corpo, sorgente JjEL») and a view's `oclCondition` (`classes.ts:1187`, not traced to JjEL by this discovery) are
metamodel or viewpoint data, outside `globals.instances`. Step F concerns M1 attribute values only, unless a later step
gives the metamodel a textual notation of its own.

### 3.2 Which M1 values are JjEL (read)

- **Typed values, the core's mark.** R-SIM-44 (`decisions.md:1955-1957`): «Due DClass primitive con migrazione [...] Nomi
  `Expression` e `Action`, id `Pointer_EXPRESSION` e `Pointer_ACTION`.» (`Defaults.ts:86-87`). The one consumer that
  checks them keys on the id, not on the name: `ConformanceValidator.ts:237-241` «Keyed on the primitive's id, not on its
  name: a user enum, datatype or class called Action or Expression is not JjEL.» It parses an Expression with
  `parseExpressionStrict` and an Action with `parseAction` (`:250-256`), exempts blank and the literal `else`
  (`:248`), and reports `` `: ${errors[0].line}:${errors[0].column} ${errors[0].message}` `` (`:259`); a malformed value
  is saved and reported as `type_mismatch` at `warning` (R-SIM-44 `:1960`).
- **Untyped values, by convention.** R-SIM-44 `:1961-1962`: «`simGuard` continua ad accettare attributi di tipo EString
  accanto a quelli di tipo `Expression`». The simulation's records name JjEL fields too (`netTypes.ts:57` «A derived
  attribute's JjEL equation», `:155` `guard?`, `:165` `guards?`), but those are records the simulator builds, read by an
  explorer pass, not features the Text tab prints. An EString that holds JjEL has no mark the Text tab can read.

**What the Text tab misses** (read): the textual layer never sees the primitive's id. `command grep -r -l -E
'Pointer_EXPRESSION|Pointer_ACTION|isJjel' frontend/src/codegen/textual` returned 0 files; the same command on
`frontend/src/model/conformance` returned 2 (positive control). And `String(a.type)` gives a name, so a user class named
`Expression` and the primitive would print the same. The fix is an optional property on `TextAttribute` (Rule 11 allows
it), say `jjel?: 'expression' | 'action'`, set at `TextualTab.tsx:161` from `a.type?.id`, the one place that reads the
L-layer (decision F1). What `String(a.type)` yields for the primitive in the app was not measured here: the probe sets the
type name by hand.

## 4. Highlighting and checking inside the Text tab

### 4.1 What the JjEL modules give (read)

- **Lexer.** `jjel/lexer/index.ts:5` `export { JjelLexer, tokenize } from './lexer';`. A token is `{type, value, line,
  column, start, end}` with character offsets (explorer, `types/tokens.ts:132-139`; measured in §4.2: `["IDENTIFIER",
  "self",0,4]`). Options `actionMode`, `textBody`, `interpolation` (`lexer.ts:37-42`).
- **Parser.** `jjel/parser/index.ts:5` `export { JjelParser, parse, parseExpression, parseExpressionStrict, parseAction }`,
  not re-exported by the `jjel/index.ts` barrel (explorer). `parser.ts:1119` `export function parseExpression(source:
  string): JjelParserResult`, `:1143` `parseExpressionStrict`, `:1214` `parseAction`. A lexer error returns before the
  parse (`:1123-1131`, `if (lexerErrors.length > 0) { return { expression: null, errors: lexerErrors.map(... line: e.line,
  column: e.column ...`). Errors carry `message`, `line`, `column`, **no offset and no end**; one error, no recovery
  (explorer: `error()` throws at `:1040`, caught in `parse()`). AST nodes carry `location?: ASTLocation` with
  `start: { line: number; column: number; offset?: number }` (`types/ast.ts:11-17`).
- **Checking.** No static checker resolves names against a metaclass (explorer, searched `jjel/`, `model/validation/`,
  `model/conformance/`, `viewpoint/ir/`; not re-run here, so a claim of absence on the explorer's word). What exists:
  syntax (`ConformanceValidator.ts:241-261`), run-time `undefined-identifier` (explorer, `evaluator.ts:418-423`), the
  simulator's scope checks (`model/simulation/stcChecks.ts`, explorer) and the IR's path subset (`viewpoint/ir/pathExpr.ts`,
  a critical-zone directory, read only).
- **Completion.** Two candidates. `jjel/autocomplete` `getJjelSuggestions(input, cursorPosition?, options?)` is regex based
  and pulls the Jodie console's globals (explorer): not a fit. `codegen/ui/templateCompletion.ts:339`
  `completionsAt(ctx, body, offset, mode)` is pure («nothing here imports the joiner, so the bench imports this module»,
  `:24-25`) and offers, after `.`, «the features of a class, inherited ones included, when the receiver is a parameter of
  the edited template whose class is known» (`:15-16`) from a `TemplateCompletionContext { classes, templates, params,
  paramClasses }` (`:50-58`). A model value binds `self` to its owner (`netTypes.ts:57` «`self` its owner»), so a context
  `params: ['self']`, `paramClasses: self -> owner class` reuses it. It also always offers `stc` and `target`
  (`:357-358`, `:372-373`), which a model value does not have: the reuse needs an option to leave them out (decision F4).
- **Monaco.** No language id for JjEL alone: `command grep -r -n -m 4 -E "languages\.register\(" frontend/src` found six
  registrations (JjScript, the two template languages, the textual and EBNF languages, JjTL) and none for JjEL. The
  template languages hold a Monarch expression state (explorer, `templateLanguage.ts:32`, `sharedStates`) and a marker
  helper from line and column (`templateMarkers.ts:30-46`, explorer).

### 4.2 Probe: JjEL values through the notation (measured, HEAD 6b38a1318, `probe_jjel.ts`)

A two-class metamodel (`Net` contains `Transition`, whose attributes are `name: EString`, `guard: Expression`,
`effect: Action`), three objects, printed and re-parsed in the three styles. Values: a guard with a JjEL string literal
holding a backslash (`self.count > 0 and self.label = "go\now"`), an action with a newline and doubled single quotes,
and a broken guard (`self.count >`).

| style | printed guard / effect (verbatim from `probe_jjel.out`) | parse errors | value round trip | one raw index per value char |
|---|---|---|---|---|
| c-like | `guard "self.count > 0 and self.label = \"go\\now\""`, `effect "count := count + 1\nlabel := 'it''s'"` | 0 | 3/3 | 3/3 |
| pascal | `guard := 'self.count > 0 and self.label = "go\now"';`, `effect := 'count := count + 1'#10'label := ''it''''s''';` | 0 | 3/3 | 3/3 |
| indent | as c-like, without braces | 0 | 3/3 | 3/3 |

What the probe shows:
1. The `STR` token keeps both `raw` and the unescaped `v` (`parser.ts:224-227`) and its document offsets `start`, `end`
   (`:230-231`); a JjEL value is the `v` of the `STR` token inside the `ItemNode` of its feature. The parser needs no new
   field for F: the token already exposes the span and the raw content.
2. Value offsets map back to raw offsets by re-reading `raw` with the style's escape rule (the probe's `valueToRaw`, 30
   lines); every value had exactly one raw index per character, escapes and Pascal's `#10` join included.
3. A JjEL error position converts to a document offset: `Unexpected '='. Did you mean '==' or '=>'?` at 1:31 is value
   offset 30, raw 31, document 87 in c-like and 102 in Pascal; `Expected expression` at 1:13 on `self.count >` is document
   206 (c-like). Line and column of a multi-line value (the action) go through the value's own lines first.
4. Every `STR` token sat on one document line, the newline printed as `\n` or `#10`: a string ends at a newline
   (explorer, `parser.ts:384-385`, `unterminated string`). Monaco semantic tokens cannot span lines, so sub-tokens of a
   JjEL island never need splitting across lines.
5. Side result: `=` is not JjEL equality (the lexer refuses it); the probe's guard was malformed on purpose only in part.

Not measured: Monaco itself (no editor ran), and a sub-token whose raw slice crosses an escape (the probe's check of that
was too weak to count; the mapping by `map[start]` and `map[end - 1]` plus that character's raw width is the design).

### 4.3 What F needs (design)

- **Islands.** A pure `jjelIslands(parsed, mm)` in the textual layer: for each `STR` token under an `ItemNode` whose
  feature is an attribute with `jjel` set (F1), `{ owner, feature, mode, start, end, value, map }`. One module, no Monaco,
  no joiner, so the bench imports it (CLAUDE.md §5, the `nameLookup.ts` example).
- **Highlighting.** `analyzeText` today emits one `string` token per `STR` (`languageService.ts:197`). For an island it
  emits the JjEL lexer's tokens instead, mapped to raw offsets, with roles from the existing legend (`keyword`, `name`,
  `number`, `string`, `feature` for `self.<f>`) so no new legend entry and no theme change are needed; the quote
  characters keep the `string` role. Decision F2: semantic sub-tokens, not an embedded Monarch language (Monaco's
  embedded languages switch on Monarch states, and this language is coloured by semantic tokens, not Monarch).
- **Checking.** Per island, `parseExpressionStrict` or `parseAction` with the conformance exemptions (blank, `else` for an
  Expression), the error's line and column converted through the value's lines and `map`. Markers of their own owner,
  severity **warning**, source `jjel`, never blocking the apply (decision F3): the model accepts a malformed value and
  conformance already reports it (R-SIM-44), so a stricter Text tab would refuse what the canvas accepts. The marker's
  end is the end of the offending token, found by re-lexing at the error's offset, since the parser gives no end.
- **Names.** A light static check, after F3 lands: `self.<f>` where `<f>` is not a feature of the owner's class, from
  the same class model as completion. Warning, and only for `self` (anything else needs types JjEL does not have
  statically). Decision F5.
- **Completion.** In `completionsAt` (`languageService.ts:549`), before the parser's expected set: a cursor inside an island
  delegates to the template completion with `self` bound to the owner's class, `stc` and `target` left out (F4). The
  class model comes from the `TextMetamodel` (no lookup needed), so the textual layer stays free of the joiner. Today a
  cursor inside a string reaches the parser's expected set at a point inside a value token, which offers nothing
  useful (`:550` takes only `ID` tokens as words); not measured.
- **Rename (D4 risk R4).** A rename of a feature or an object does not rewrite JjEL text. F can count the islands that
  name the renamed feature after `self.` and say so in the rename's message; rewriting them is out of F.

## 5. Tracing from a generated line to the model line

### 5.1 What the codegen pipeline keeps (read)

Origins per fragment ship today. `engine/text.ts:46-51`: `export type Origin = LiteralOrigin | ModelOrigin | OpaqueOrigin
| ErrorOrigin;` with `ModelOrigin extends FeatureRead { readonly kind: 'model'; readonly transformation: Transformation;
readonly template?: string }` and `FeatureRead { elementId; feature; featureName }` (`:40-44`, «One feature read: the
element that owns it, the feature's id from idlookup [...], its name»). Rendering keeps a map, `text.ts:72` «One output
range: line 1-based, `start` and `end` 0-based columns, `end` excluded», `TextMapEntry { line, start, end, fragment,
origin }`, returned as `GenerateResult.map` (explorer, `generate.ts:52-58`). Origins survive `+` and `join` through host
hooks, by `discovery_2026-10-31_codegen_origins_through_concat.md` §3 (explorer). R-GEN-41 (explorer, `decisions.md:6200`):
«Provenance is navigable both ways in the generator tab, in every mode».

So **H5 is falsified**: a trace per output range exists, with the owning element **and the feature** of each model
fragment. No new recording is needed for F.

### 5.2 What the generator tab does with it (read)

- Code to canvas: `GeneratorPane.tsx:278-285` `const onSpanClick = (e, entry) => { if (e.altKey) { ... goToTemplate(entry.fragment);
  return; } if (entry.origin.kind === 'model') selectOnCanvas(entry.origin.elementId); };`. `selectOnCanvas` goes through
  `codegen/ui/canvasSelection.ts:154` `selectOnModelCanvas`, which opens the model's tab with `DockManager.open2`, waits for
  the nodes, resolves with `pickOnCanvas` and dispatches `JjodelEvents.SELECT_NODE` (`registry.ts:24`
  `SELECT_NODE: 'jjodel:selectNode'`), listened to by `EditorV2.tsx:1167-1188` only (explorer).
- Canvas to code: `GeneratorPane.tsx:288-300`, a `CANVAS_ELEMENT_SELECTED` listener sets `linked`, and `:302-306` reveals
  `.code-span--linked`.
- `codeOrigins.ts:48` `elementAt(map, line, column): ModelOrigin | null`, «the model fragment under the column, else the
  nearest model fragment on the line; `null` when the line holds none» (`:44-46`): the line-level lookup F needs, pure.
- Opaque fragments carry `reads[]` and do nothing on click (`:284` acts on `kind === 'model'` only).

### 5.3 From the generated line to the Text tab (design, with the gap read)

The Text tab has no window-level wiring today: `command grep -c -E 'JjodelEvents|addEventListener\(' TextualTab.tsx`
counts 4, all DOM listeners of its own widgets (`:1509` the editor's `cut`, `:1813-1830` an input); the same command on
`GeneratorPane.tsx` counts 3 (positive control). Step E's plan adds a `CANVAS_SELECTION_CHANGED` listener with a highlight
and a reveal that move neither caret nor focus (E report §5.1, §5.3, lane E2b, on branch `textual-e-sync`).

Two routes:
1. **Through the canvas, free after E2b.** A click selects on the canvas (today), the canvas publishes
   `CANVAS_SELECTION_CHANGED`, E2b highlights the span. It needs the canvas mounted and the element drawn as a node
   (E report decision E6: nodes only), and `selectOnModelCanvas` brings the canvas forward with `DockManager.open2`
   (E report §4.3), so a Text tab in the same panel goes behind it.
2. **Direct.** A registry event, say `JjodelEvents.TEXTUAL_REVEAL` `{ modelId, elementId, featureName? }` (CLAUDE.md
   §8.6, §8.7: a CustomEvent and a local listener; rule 25 forbids a bare string), dispatched by `onSpanClick` next to
   `selectOnCanvas`, and listened to by the Text tab of that model, which reveals and highlights with E2b's collection.
   With `featureName`, the tab reveals the **line of the feature**, not just the object: the carried span of
   `elementId` (`carriedSpans()`, E report §5.2) bounds the search, and inside it the `ItemNode` whose `feature` is the
   name (`parser.ts:112-115` `readonly feature: string;`) gives the line. That is «the model line» of the plan, at the
   granularity the origin already has. An object with no carried span (unprinted, stale tab) is silent, as E8.

Recommended: route 2 (decision F6), after E2b, reusing its highlight. Whether a click also opens a closed Text tab:
recommended **no** in F (F7), the generator tab already offers canvas and template; the reveal works when the tab is
open, and a later lane can add «Open in Text tab» to the span's hover.

Text to generated line (the reverse, E's canvas-to-code counterpart): the generator tab already follows
`CANVAS_ELEMENT_SELECTED`; after E2a the Text tab's caret selects on the canvas, which publishes that event
(`useJjomSelection.ts:72`, explorer), so the code side links with no change. To be checked in the app, not assumed.

**Ids** (read, not measured end to end): the Text tab's objects take `idOf(h)` of `globals.instances`
(`TextualTab.tsx:181`), and the origins' `elementId` is the idlookup id of the element read (`text.ts:40-44`). Both come
from the same `buildEvalContext` globals. F's first lane measures it on one model: a generated span's `elementId` found
among the tab's carried span ids.

## 6. T8

### 6.1 What it is (read, with sources)

`docs/discovery/discovery_2026-11-01_textual_viewpoint.md:812`, plan table A.7: «| T8 | T6 | re-import of an exported file:
ids in the text, the cascade with the confirmation dialog |». Its rules: R-TXT-17 (`decisions.md:7003-7006`) «On save,
Jjodel can also write the model's text file next to it (with ids, R-TXT-18), for git, review and LLM edits; an edited file
comes back by re-import»; R-TXT-18 (`:7007-7012`) «Outside (re-import), by a cascade: id in the text if present; class and
name in the same container; class and name in the model (moves); attribute similarity [...] Uncertain matches are always
confirmed by the user before applying. Ids in the text are an option of the style, on by default in the exported file; a
repeated id makes a new object, with a warning.»; R-TXT-21 (7) (`:7033`) «The cascade's thresholds start at 0.6 with a
margin of 0.2, calibrated in step T8». The dialog it asks for: report `:767-769` «one dialog, counts first [...] then one
row per uncertain match, old → new with its score, each with a checkbox, then the creates and deletes, the cross-model
deletes in red». Also named in `sessione_2026-11-01_default-textual-notation.md:106` and placed after F by R-TXT-34. A
second, unrelated «T8» in `decisions.md:5703` is a harness ticket of 2026-10-01, not this step.

### 6.2 What exists (read)

- The cascade runs inside the editor: `textMatch.ts:5-20`, evidence «1. The previous print's spans (R-TXT-22) [...] 2. Class
  and name in the same container [...] 3. Class and name elsewhere in the model, a single candidate: a move. Uncertain
  [...] 4. Attribute and reference similarity [...] at least 0.6 and 0.2 ahead of the second». Thresholds at `:53-54`
  `RENAME_THRESHOLD = 0.6`, `RENAME_MARGIN = 0.2`. Moves landed with T7 (`ec570ca11`, merge of `textual-t7`;
  `command grep -c "'move'"` counts 10 in `textDiff.ts`).
- The confirmation: `ui/TextConfirmPanel.tsx:2-5` «the uncertain matches [...] and the deletions of objects another model
  references, flagged. One row per object [...] one confirm action for all of them. Nothing is applied until then.» No
  counts, no per-row checkbox, no list of creates.
- **Ids in the text: none.** `command grep -c -E 'printIds|showIds|withIds|ids\?:'` on `style.ts` and `printer.ts` counts
  0 and 0; the only id syntax is the outer reference `@"id"` (R-TXT-32, explorer `printer.ts:309,324,535`; the role test
  `t.v !== '@'` at `printer.ts:167` is the positive control that the `@` form exists). My own control `grep -c '@"'` on
  `printer.ts` counted 0, so the quoted form is built from parts and that control had no signal; the explorer's lines
  are the evidence.
- **File export and import of the text: none in `codegen/`.** `command grep -r -l -E
  'FileReader|createObjectURL|showSaveFilePicker|showOpenFilePicker|type="file"' frontend/src/codegen` lists
  `codegen/ui/GeneratorImportDialog.tsx` (generators) and `codegen/runner/runner.worker.ts`, nothing under `textual/`; the
  same pattern over `frontend/src` finds `joiner/index.ts` and `InstanceManagerTab.tsx` (positive control).

### 6.3 What T8 still needs (design)

1. **Ids in the text** as a style option (R-TXT-18), on in the exported file. Two shapes: a token of the grammar, or a
   structured comment (`// @id 3f2a...` at the end of an object's head line). Recommended the comment (decision F9): the
   grammar, the LL(1) check and the EBNF stay untouched, a file without ids reads the same, and comments already survive
   and are owned by objects (R-TXT-20, D5's comments by owner). The reader is a pass over `commentsOf` (`parser.ts`,
   used by D1).
2. **Evidence 0, id in the text**, before span and name in `matchObjects`, with the repeated-id warning. Pure, in
   `textMatch.ts`; the re-import has no carried spans (`previous: []`), so the cascade starts at ids, then names.
3. **Export** (download a `.txt` of the print with ids) and **Import** (open a file, run the cascade against the current
   model, show the dialog), in the Text tab's toolbar. The import goes through the same `planTextEdit` and
   `applyTextEdit` (`textApply.ts:74`) as an edit, so one undo step and the R-TXT-21 (8) refusal of recovered objects
   hold with no new write path.
4. **The dialog of the report** (`:767-769`): counts, a checkbox per uncertain row with its score, creates and deletes,
   cross-model deletes in red. `TextConfirmPanel` grows or a modal of its own is added (decision F10); unticking a row
   turns that match into a create plus a delete.
5. **Calibration** of 0.6 and 0.2 on the 16 Briefs and the fixture: export, a scripted set of edits (renames, moves,
   attribute changes), re-import without ids, count right and wrong matches per threshold. A test bench, not UI.

T8 writes the model through the existing apply path only. Every file above is in `codegen/textual/`.

## 7. Critical zone

### 7.1 Every file each piece would touch, against CLAUDE.md §3.1 and §3.2

| piece | files | §3.1 table | §3.2 trigger |
|---|---|---|---|
| JjEL islands, highlighting, checking, completion | `codegen/textual/{metamodel.ts, jjelIslands.ts (new), languageService.ts}`, `codegen/textual/ui/{TextualTab.tsx, textualMonaco.ts}`, `codegen/ui/templateCompletion.ts`, tests | no | no: no sync file, no D-layer write; `TextualTab.tsx:161` reads `a.type?.id` from the L-layer, read only |
| JjEL imports | `jjel/lexer`, `jjel/parser` (read only, as `ConformanceValidator.ts:16` does) | no | no |
| Tracing | `events/registry.ts` (one constant), `codegen/ui/GeneratorPane.tsx`, `codegen/textual/ui/TextualTab.tsx`, `codegen/textual/selectionSync.ts` (E2a's module), tests | no | no: a CustomEvent and a reveal, no store write (E2's `_lastSelected` write stays E's) |
| T8 | `codegen/textual/{style.ts, printer.ts, textMatch.ts, textDiff.ts}`, `ui/{TextualTab.tsx, TextConfirmPanel.tsx}`, a pure `textFile.ts` (new), tests | no | no new write path: the import applies through `planTextEdit` and `applyTextEdit` (`textApply.ts:74`), JjScript lines in one undo step (R-TXT-19), which already ship |

Not touched and not to be imported: `viewpoint/ir/pathExpr.ts` (a §3.1 directory; its JjEL subset is the IR's, not a
model value's) and `editor-v2/problems/` (user validation rules are M2 data, outside F).

`events/registry.ts` is outside `codegen/`: not a layer of rule 20 (D, L, sync, view, JjOM), but a file outside the front,
so the lane prompt names it (rule 1).

### 7.2 Layer Impact Report, draft

No piece is inside the critical zone, so no report is owed. Draft content for the one piece that writes a model, T8's
import, so the lane can confirm it in one line:

```
Layers touched: JjOM and D-layer through the existing JjScript apply path only (applyTextEdit, one undo step).
What changes: none in the write path; a new caller (import) and a new evidence (ids) before the cascade.
What does NOT change: DVertex.new / DVoidEdge.new2/new3 are not called; no TRANSACTION is added; sync hooks untouched.
Cross-layer: the canvas follows the model through useJjomSync as after any text edit.
Smoke: export a model, re-import it unchanged -> zero ops; rename one object in the file -> one rename by id.
```

If a T8 lane finds it needs a creator or a TRANSACTION outside that path, it stops (rule 12, §3.2).
