# Discovery: textual syntax step D, writing aids (P-2026-11-06-2040)

- Prompt-ID: P-2026-11-06-2040, prompt `docs/prompts/claude_2026-11-06_2040_prompt_textual_d_discovery.md`
- Chat: C-2026-11-03-1037; session `36c899e9-55a4-4c7a-98eb-812d329e707a`
- Tree: `~/jjodel-w-textd`, branch `textual-d-writing-aids`, HEAD `95c2ec038` (the prompt's commit on `fc79098ad`), clean at start
- Executor: Opus 5.5 (`claude-opus-5-5`)
- Read only. Probes in `~/.jjodel-lanes/P-2026-11-06-2040/` (`probe_expected.ts`, `probe_comment.ts`, their `.out`), bundled with
  the repo's esbuild and run with node on this HEAD.

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the real files.

## 1. Objective and hypotheses

Objective: measure what the language service, the parser and the Text tab give step D today (completion, line errors with
quick fixes, safe rename, formatting, R-TXT-37), and cut D into lanes of five files or fewer.

Hypotheses under test, with the verdict (evidence in the sections named):

- H1. The parser exposes an expected set at a cursor that completion can use as is. **Falsified** (§3): it gives only an
  error message string, and the set it names drops the optional parts skipped before the error point.
- H2. Some Monaco provider for completion, code actions, rename or formatting is already wired. **Falsified** (§2): six
  providers, none of those four.
- H3. Conformance and validation results are reachable from the Text tab as line markers. **Partly** (§4): reachable by
  object id through the problems registry or by calling `validateConformance`; nothing in `codegen/` reads them today.
- H4. A rename can go through the text alone and keep identity. **Holds on reading** (§5): spans carried by the editor
  keep the match certain, model references are by id; not measured end to end.
- H5. The printer can serve as the formatter without loss. **Falsified** (§6): the printer prints no comments and no
  parentheses of the text.
- H6. Commenting out one object asks before applying. **Falsified, measured** (§7): one commented port gives one delete,
  no refusal, and the guard returns null, so the pause applies it.

## 2. Files read

Full paths, under `/Users/alfonso/jjodel-w-textd/`:

- `frontend/src/codegen/textual/languageService.ts` (whole, 624 lines)
- `frontend/src/codegen/textual/parser.ts` (windows 1-190, 440-740, 1020-1395 of 1395)
- `frontend/src/codegen/textual/ui/textualMonaco.ts` (whole, 260 lines)
- `frontend/src/codegen/textual/ui/TextualTab.tsx` (windows 255-404, 530-709, 1160-1359 of 2047; greps for providers,
  markers, pause, comments)
- `frontend/src/codegen/textual/printer.ts` (windows 20-78, 275-312; greps)
- `frontend/src/codegen/textual/textDiff.ts` (window 360-420; export grep)
- `frontend/src/codegen/textual/__tests__/portCorpus.ts` (whole), `__tests__/blockTokens.test.ts` (600-616, imports)
- `frontend/src/components/editor-v2/problems/registry.ts` (1-130), `ConformanceProblemSync.tsx` (imports)
- `frontend/src/model/conformance/ConformanceTypes.ts` (36-80), `useConformance.ts` (1-40), `ConformanceValidator.ts` (imports, signature)
- `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md` («Status after step C»), `docs/decisions.md` R-TXT-46..52,
  `docs/log-inbox/codegen.md` (latest entry)

Not read: `concreteGrammar.ts`, `styleCheck.ts`, `annotations.ts`, `textMatch.ts`, `useSyntaxDraft.ts` beyond export
greps; the prompt lists them, and nothing in D's findings below depends on their bodies. Said here so the gap is visible.

## 3. Completion

### 3.1 What exists (read)

- **No completion provider.** `ui/textualMonaco.ts:3` declares «six providers on the language service (semantic
  tokens, document symbols, folding ranges, definition, references, hover)»; the registrations are at :167, :186, :191,
  :197, :204, :243. A grep of `ui/*.ts ui/*.tsx` for `register[A-Z]*Provider|Completion|CodeAction|Rename|Formatting`
  returned only those six and the two `setModelMarkers` calls (positive control: the same grep found the six).
- **The language service has no cursor query for completion.** `TextAnalysis` (`languageService.ts:81-92`) offers
  `encodedTokens`, `definitionAt`, `referencesAt`, `hoverAt`; nothing returns what may stand at an offset.
- **The parser's expected set lives only in message strings.** `TextParseError` (`parser.ts:31-40`) carries `line`,
  `col`, `start`, `end`, `message`, `secondary`, `severity`: no matcher set. The sets are turned into words at the throw:
  `parser.ts:615-616` «`const fail = (expected: readonly string[], t: Token = peek()): never => { throw new
  ParseFailure(errorAt(t, \`expected ${either(expected)}; found ${describeToken(t)}\`));`», with `either` cutting at ten
  items (`parser.ts:480` «`ys.length > 10 ? [...ys.slice(0, 10), '...'] : ys`»).
- **FIRST sets are exported and structured.** `parser.ts:485` «`export function firstSetsOf(g: ConcreteGrammar): (n:
  GrammarNode) => First`», matchers `ID`, `ID:x`, `P:x`, `STR`, `INT`, `FLOAT` (`parser.ts:442`). Enum literals enter
  FIRST already cased: `parser.ts:518` «`case 'lit': r = { set: new Set(literalsOf(n.rule).map(l =>
  \`ID:${applyCase(l, g.literalCase)}\`))`». A block's FIRST is its open word, and its empty form (`:523`). The per-block
  open and close of step C reach the parser through the block node (`n.open`, `n.close`, `parser.ts:1037`, `:1064`).
- **The scope of a reference is in the grammar and the parse.** An `xref` node carries `targets` (classes) and `type`
  (`parser.ts:1287-1297`: «`const found = candidates.filter(x => targets.includes(x.cls)); if (found.length === 1)
  return found[0];`»). The printer writes a reference as the name when unique among the targets, else the path
  (`printer.ts:303-309` «`if (typeof nm === 'string' && candidates.filter(x => n.targets.includes(x.cls)).length === 1)
  return name(nm); return path(t);`»), but `ref`, `path`, `name` and `quote` are closures inside `printTextModel`
  (`printer.ts:275-309`), not exported. A path's head is `pathKeyword` (exported, `printer.ts:87`), its later segments
  `featureKeyword` (`printer.ts:107`), R-TXT-28.
- **An insertion point for a recovery exists.** `repair` (`parser.ts:667-682`) records an empty `error` node where a
  keyword or punctuation was taken as read: «`within('error', { message }, () => undefined);`». The missing matcher `m`
  is in scope there and not kept.

### 3.2 Probe: the expected set at seven cursors (measured, HEAD 95c2ec038)

Method (`probe_expected.ts`): parse the text cut at the cursor and read the error at its end, the only expected set the
parser gives today; also parse the full text with the hole. Corpus: `__tests__/portCorpus.ts` C-like (`PORT_CLIKE`), then
the same with `C_Module: { blockOpen: ['is'], blockClose: ['end', 'module'], prefix: ['begin'] }`, which prints
`begin Module cpu is ... end module`.

| # | cursor | message at the cut (verbatim) | what completion should offer |
|---|---|---|---|
| 1 | `Module ⎸` | `expected "{"; found end of text` | a name, or `{` |
| 2 | new line inside `Module cpu {` | `expected "}" to close the "{" at 1:12; found end of text` | `input`, `output`, `}` |
| 3 | `input instr : ⎸` | `expected "Bool" or "Word"; found end of text` | the same |
| 4 | `output r : Bool = ⎸` | `expected a name, "{", "{}", "(" or "and"; found end of text` | the same (a name is a new `Ref`) |
| 5 | `= instr & ⎸` | `expected a name, "{", "{}", "(" or "and"; found end of text` | the same |
| 6 | empty text | no error (an empty text is complete) | `Module` (`begin` with the prefix) |
| 7 | `input ⎸` | `expected ":"; found end of text` | a name, or `:` |
| 1c | `begin ⎸` | `expected "Module"; found end of text` | the same |
| 2b | new line inside `is` | `expected "end" "module" to close the "is" at 1:18; found end of text` | `input`, `output`, `end module` |
| 2c | `end ⎸` (close begun) | `expected "end" "module" to close the "is" at 1:18; found end of text` | `module` |

Findings from the probe:

- F1. Where the error is a single required token (3, 4, 5, 1c) the message is the right set.
- F2. **The optionals skipped before the error point are lost** (1, 7): the optional head name of `Module` and of the
  nameless `Port` is not offered. The message is FIRST of the failing node only.
- F3. **Inside a body at end of text the parser reports the close only** (2, 2b): the block loop takes the
  EOF branch first, `parser.ts:1099-1102` «`if (t.k === 'EOF' || (t.first && enclosing.some(f => f.can(t)))) { ...
  record(errorAt(t, \`expected ${n.close.map(shownToken).join(' ')} to close the ${opened} ...`», before the item set
  of `parser.ts:1107` is ever computed.
- F4. **A multi-word close begun is not seen as begun** (2c): the cut text says `end module` again, not `module`.
- F5. **No error, no set** (6): an empty text or a complete prefix gives nothing; FIRST of the top (`parser.ts:1202`) is
  what completion needs there.
- F6. `a name` covers three cases the parser does not tell apart in the message: a new object's name (1, 7), a nameless
  positional object whose `name` attribute is first (4: a `Ref` is `keyword: ''`, `portCorpus.ts:45`), and a reference.
  Only the last has candidates. **The port corpus has no reference** (`PORT_MM`, `portCorpus.ts:13-25`, has none), so
  the reference case was not probed; corpus B (`__tests__/corpus.ts`) is the one to use in the lane.

### 3.3 What completion needs (design reading)

One structured answer per cursor, computed by the parser, not by reparsing messages:

- C1. A parse option `cursor?: number` (optional, CLAUDE.md Rule 11) under which the parser records, at the first token whose
  start is at or after the cursor, every grammar node it tested there with `canAt`/`hit`, nullable ones included, and
  returns them as `expected?: readonly ExpectedItem[]` on the result (optional field). An item is a matcher plus the
  node kind it came from: `kw`/`p` (a keyword or a style token, the block's own tokens included), `lit` (the enum rule),
  `xref` (targets, type, feature), `tok` (`NAME` of a head or a value of a type), `block` (open, or the rest of a
  multi-word close). This answers F2-F5 at the point the parser already decides; F3 needs the item set computed before
  the EOF branch returns.
- C2. The language service turns it into candidates, with no metamodel-specific code: keywords and style tokens as
  written; enum literals with their cased form and the hover doc already built in `hoverAt` (`languageService.ts:393-402`);
  reference targets from the parse of the full text (the objects whose class is in `targets`), each written as the
  printer would write it, name when unique else path (R-TXT-4, R-TXT-28), and `@"id"` never offered; no candidate for a
  new name.
- C3. The printer's `ref`/`path`/`name` closures extracted into an exported pure function the printer itself calls, so
  completion and print cannot drift (a refactor of `printer.ts`, guarded by the existing print tests).
- C4. A `CompletionItemProvider` in `textualMonaco.ts` on the session's reading (one parse per version is shared already,
  `textualMonaco.ts:119-145`); trigger characters from the style's punctuation; a cursor parse is one more parse of the
  full text per request, at the cost of the parse the providers already make (not measured here).

## 4. Diagnostics and quick fixes

### 4.1 Where markers come from today (read)

- **Text mode, one owner.** `ui/TextualTab.tsx:1168-1183` `setMarkers` writes `EDIT_MARKER_OWNER` from «`[...(parsed?.errors
  ?? []), ...marks]`», severity Warning for a `secondary` reference error, else Error. Its callers: `readEdit`
  (`TextualTab.tsx:1322` «`setMarkers(parsed, plan.diff ? [...outerMarks(text, parsed, plan.diff), ...(plan.diff.unresolved
  ?? [])] : []);`»), and the clears in `reprint` and on a text equal to the agreement (`:1206`, `:1313`).
  So the sources are three: the parse's syntax and reference errors, the misplaced `@"id"` of R-TXT-32 (`outerMarks`,
  `TextualTab.tsx:575-596`), and the diff's unresolved kept tokens of R-TXT-35.
- **Not markers: the refusals.** `plan.refusals` (`textDiff.ts:367` codes «`'parse' | 'uncertain' | 'referenced' |
  'unprinted' | 'outer' | 'unsupported' | 'unwritable'`») go to the bar only, `editStatusText` (`TextualTab.tsx:634`).
  `unwritable` is a JjScript value the run cannot write (`textDiff.ts:635`); it has no position today.
- **Not markers: the style check.** `checkStyle` findings show as `NotationIssues` under the bar
  (`TextualTab.tsx:599-617`) and as EBNF-mode markers (`TextualTab.tsx:1816`); they are about the notation, not a line
  of the model text. The new-model mode has its own owner (`TextualTab.tsx:1940`).
- **Conformance and validation are not read by the textual layer.** `command grep -rlE
  "ConformanceValidator|problems/|validateModel|nameUniqueness" src/codegen/` returned nothing; the positive control,
  `command grep -rlE "parseText" src/codegen/` through the same tool, listed five files (exit 0).

### 4.2 What is reachable (read)

- `useConformance(modelId)` (`model/conformance/useConformance.ts:18`) is a hook, debounced 500 ms (`:8`), returning
  `ConformanceResult` with `violations` (`ConformanceTypes.ts:69-74`); a violation has «`objectId: string;`»,
  `violationType`, `severity`, `message` and «`metamodelElementName?: string;`» (`ConformanceTypes.ts:38-65`), the
  feature name for the per-feature checks and a class name for `orphan_object` and `abstract_instantiation`
  (`problems/registry.ts:69-80`). The Text tab is a component with a `modelId`: one hook call reaches it, with no
  dependence on a canvas being open. Today the canvas reads the same hook through `ConformanceProblemSync`
  (`components/editor-v2/EditorV2.tsx:5122`), mounted only with a canvas.
- User validation rules publish into the problems registry (`problems/validationToProblems.ts:91`
  `publishValidationProblems`), «**non e' reattivo**: scrive solo quando l'utente lancia il comando» (`registry.ts:35-36`),
  keyed by `nodeId` with `ownerModelId` (`registry.ts:88-128`); `subscribe` (`registry.ts:267`) and
  `getNodeProblemsSnapshot` (`:272`) are the read side.
- Mapping to lines: the tab carries one span per model object (`carriedSpans()`, decorations tracked through edits,
  `TextualTab.tsx:1105`, `:1122`), so an `objectId` maps to its object span; a feature name maps to the item node of that
  feature inside the object node (`ItemNode.feature`, `parser.ts:88-91`), else to the object's name token. That the
  violation's `objectId` is the id the spans carry (the D-layer object id) is a reading, not measured: the lane checks it.
- Both live in `components/editor-v2/problems/` and `model/conformance/`, critical-zone directories by CLAUDE.md §3.1.
  Reading them from the Text tab touches no file there; a lane that only imports them stays outside the zone.

### 4.3 Which diagnostics have a fixable shape

| source | example message (verbatim from the code) | fix | data today |
|---|---|---|---|
| parse, `repair` | `expected ":"; found "}"` (`parser.ts:669`) | insert the token at the error node | the matcher is in scope at `parser.ts:667`, not kept: needs an optional `fix` on `TextParseError` |
| parse, missing close | `expected "}" to close the "{" at 1:12` (`parser.ts:1102`) | insert the close at the end of the object's last line | `n.close` in scope, not kept |
| reference by name | `no object of type ${r.node.type} is named "${s.name}"` (`parser.ts:1297`) | replace with a near name of the same targets (edit distance) | candidates from the parse (`byName`, `parser.ts:1272`), targets on the node |
| reference ambiguous | `"${s.name}" is ambiguous: ... write a path` (`parser.ts:1295`) | replace with each candidate's path | the printer's path, once exported (C3) |
| path keyword | `a path starts with a class keyword: ${renamed} is written "..."` (`parser.ts:1327`), same for a feature (`:1344`) | replace the segment with the printed keyword | the message holds it; a structured field is cleaner |
| conformance `missing_required_attr`, `multiplicity_below_min` | (ConformanceValidator) | insert `keyword value` in the object's block, from the grammar | object span + grammar item of that feature |
| conformance `invalid_enum_literal` | (ConformanceValidator) | replace with a literal of the enumeration | the enum in the metamodel; the text already refuses an unknown literal at parse |
| `outer` misplaced | `outerMarks` (`TextualTab.tsx:591`) | none: only keep, delete, replace (R-TXT-32) | — |
| validation rules | user text | none generic | — |

Every fix is a text edit the user applies, never a model write: the edit then goes the usual pause-apply way, so
R-TXT-21 (8) holds by construction. A `CodeActionProvider` in `textualMonaco.ts` reads the markers' data through the
session; Monaco passes the markers at the range in `context.markers`.

## 5. Safe rename

### 5.1 What a rename must rewrite (read)

- **In the text**: the object's name token and every reference token that names it by name. `referencesAt(offset,
  true)` already returns exactly that list, the declaration first (`languageService.ts:421-426`), from the inverse index
  built over resolved references (`languageService.ts:215-222`). Paths (R-TXT-25 (5, 6), R-TXT-28) are made of class and
  feature keywords and indices, never names (`parser.ts:7-10`), so they need no rewrite; `@"id"` names an object outside
  the text by id (`parser.ts:11-12`) and needs none either.
- **In the model**: only the name slot. Model references are ids, so other models and the canvas follow by
  themselves; the textual apply writes the name through the JjScript plan as for any typed rename. The core's identity
  slot rules (model/CLAUDE.md §3.12, R-TXT-45, R-TXT-46) are already exercised by that path since C1e.

### 5.2 Text route or model route

- **Text route (recommended).** Monaco's `RenameProvider.provideRenameEdits` returns the edits of 5.1; the editor
  applies them as one undo stop; the pause reads the text and the diff applies the name change. Identity is kept by the
  carried span of the object, which a change inside it does not move (decorations `NeverGrowsWhenTypingAtEdges`,
  `TextualTab.tsx:1105`), so the match is a span match, not the uncertain `rename` evidence (`textMatch.ts:29`,
  `RENAME_THRESHOLD = 0.6` `:53`) that would send it to the panel. The rewritten reference tokens are retyped, so
  R-TXT-35's keep does not apply to them and they resolve by the new name. Reading only: not measured end to end.
- **Model route.** A model write then a reprint: loses the user's comments and layout on reprint (§6.1), and a pending
  edit blocks the reprint (`onModelPrint` returns `keep`, `TextualTab.tsx:300-303`). Not recommended.

### 5.3 Conflicts and refusals

- A new name that another object of overlapping targets carries makes the references ambiguous
  (`parser.ts:1293-1295`), or a reference to the other object resolve to this one. The generic check: build the edited
  text, parse it with the same keep tokens, and refuse when it has an error the original did not, or when some
  reference resolves to a different target than before (compare `refs[].to` token by token, shifted). No metamodel code.
- A name that is not an identifier, or is a reserved word, prints quoted (`printer.ts:290-293` «`const name = (s:
  string): string => (IDENTIFIER.test(s) && !words.has(s) ? s : quote(s));`»): the rename writes the same form, which
  needs `name`/`quote` exported (same extraction as C3).
- **Nameless objects (R-TXT-45).** `resolveRenameLocation` on an object with no name has no token to replace; adding a
  name means inserting at the optional head-name place, which only the grammar knows. Refuse with «this object has no
  name: type one in the text» in D; insertion is a later slice (D-decision D4).
- **A broken text.** Rename only on an applicable parse (`isApplicableParse`, `parser.ts:188`): recovered objects are
  never applied (R-TXT-21 (8)), and their references may be wrong.
- **Names used outside the text.** JjEL strings and validation rules that name objects by name are not rewritten
  (embedded JjEL is step F). Risk, §9.

## 6. Formatting

### 6.1 The printer as formatter (read)

- `printTextModel(g, objects)` (`printer.ts:206`) prints objects, not a tree: a grep of `printer.ts` and `textDiff.ts`
  for `comment` counts 0 in each (measured, `command grep -c`; positive control through the same command: 10 lines in
  `parser.ts`, e.g. `commentsOf` at `parser.ts:134`). So a reprint **drops every comment**.
- Parentheses: a `ParenNode` «has no trace in the model» (`parser.ts:112-115`), so a reprint **drops redundant
  parentheses**.
- R-TXT-20 («model-to-text updates ... rewrite only the spans of the objects that changed») is **not implemented** in
  the tab: `reprint` sets the whole value (`TextualTab.tsx:1200-1201` «`syncRef.current = { text: r.view.text, model:
  r.view.text }; if (editor.getValue() !== r.view.text) editor.setValue(r.view.text);`»). A grep of `TextualTab.tsx` for
  `comment` (case-insensitive) counts 0 (measured, `command grep -ci`); positive control through the same command: `reprint`
  counts 14 in the same file. Comments survive today only because the typed text stays the agreement after an apply (`TextualTab.tsx:1276`).
- The comments are attributed: `commentsOf` (`parser.ts:134-161`) gives each comment its owner node and `trailing` flag,
  and the print's lossless tree carries model ids (`printer.ts:69-76`). That is the material of a comment-keeping print.

### 6.2 What a formatter in D can be

- Full format = print the parsed objects of an applicable text, then put each comment back by its owner: leading
  comments before the owner's first token, trailing ones at the end of the owner's line. Parse ids `t1..` are the
  printed ids when the parsed objects are printed, so owners map one to one.
- Range format = the full print, then splice only the top-level objects whose spans meet the range (spans are in the
  print result, `printer.ts:43-50`). Printing a subset alone is wrong: reference text depends on name uniqueness over
  the whole text (`printer.ts:295-309`).
- A format is an editor edit, never a model write: the model is unchanged unless the text's meaning is (a formatter
  that changes meaning is a bug the pause would then apply, so the lane tests print-parse equality of the objects).
- Monaco: `registerDocumentFormattingEditProvider` and `registerDocumentRangeFormattingEditProvider` in
  `textualMonaco.ts`; one minimal edit (common prefix and suffix trimmed) keeps the caret and the decorations of the
  untouched objects.
- Parentheses: keep them (D-decision D5) by passing the paren set to the printer as hints, or drop them; dropping is the
  smaller lane and is reversible by the editor's undo.

## 7. R-TXT-37, commenting an object out

### 7.1 Where the pause applies (read)

`readEdit` (`TextualTab.tsx:1303-1344`) parses, plans, and decides; the only deletion guard is C3b's:
`TextualTab.tsx:1337` «`const guard = d.kind === 'apply' && !deletions ? deletionGuard(r.base, plan) : null;`», and
`deletionGuard` asks only from three deleted subtrees or when every object goes (`TextualTab.tsx:542` «`export const
GUARD_ROOTS = 3;`», `:559` «`return all || roots >= GUARD_ROOTS ? { ... } : null;`»). Its doc already cites R-TXT-37
(`TextualTab.tsx:538`), but nothing tests a comment.

### 7.2 Probe (measured, HEAD 95c2ec038, `probe_comment.ts`)

Typing `// ` before `input : Bool` in the PORT print, spans shifted as the editor carries them:

```
errors 0 recovered 0
ops [{"op":"delete","model":"p2"}]
refusals [] lines 1
deletionGuard null
comments [[40,55,"// input : Bool"]]
deleted p2 carried span {"id":"p2","start":49,"end":55} covered by a comment true
```

The guard is a copy of `deletionGuard` (the tab module does not bundle outside Vite: its `.scss` imports), same
`GUARD_ROOTS = 3`. So **today one commented object is applied as a deletion on the pause**: R-TXT-37's defect stands. The
detection works on the data the tab has: the deleted root's carried span lies inside a comment of the new parse.

### 7.3 Detection and confirmation shape

- Detection, pure and bench-testable: for each deleted root of the plan (the ops whose model is a top of
  `deletedObjects`, as `deletionGuard` counts), its carried span is covered by a comment of `commentsOf(parsed.tree)`
  (whitespace between comments allowed, for a run of `//` lines). Nothing names a metamodel.
- Scope: R-TXT-37 says «when the only change ... is the disappearance of whole objects covered by a comment». A text
  that comments one object out and edits another would still apply the deletion. Recommendation D7: ask whenever any
  deleted root is covered by a comment, whatever else changed.
- Shape: the C3b guard's own path (`status: 'guard'`, the bar's Confirm and Cancel, `onGuardConfirm` and
  `onGuardCancel`, `TextualTab.tsx:1346-1358`), with a field `commented` and a bar text such as `Not applied · comments
  out 1 object, confirm below`. Confirm applies the text it asked about (`readEdit(asked.confirmed, true)`), Cancel keeps
  both. Removing the comment returns the text to the agreement and clears the guard (`TextualTab.tsx:1311-1316`).
- Typing `/` alone is an `unexpected character "/"` error under C-like (measured, `probe_slash.ts`: 1 error; the message
  comes from `parser.ts:365`), so the guard first fires at `//`, the case P-2026-11-03-2152 measured.

## 8. Lane plan and decisions

Paths under `frontend/src/codegen/textual/`. None of these files is in the CLAUDE.md §3.1 table, and none is a §3.2
trigger (no sync file, no D-layer creator): every lane is outside the critical zone unless stated.

| lane | what | files (≤ 5) | visual | critical zone |
|---|---|---|---|---|
| D1 | R-TXT-37: a deletion whose root is covered by a comment asks first (§7.3) | `ui/TextualTab.tsx`, `__tests__/deletionGuard.test.ts` | yes (bar text) | no |
| D2a | expected set at a cursor: `ParseOptions.cursor`, `TextParseResult.expected` (§3.3 C1) | `parser.ts`, `__tests__/completion.test.ts` (new) | no | no |
| D2b | completion candidates: `completionsAt` in the service; the printer's reference and name writers exported (C2, C3) | `languageService.ts`, `printer.ts`, `__tests__/completion.test.ts` | no | no |
| D2c | Monaco completion provider, trigger characters (C4) | `ui/textualMonaco.ts`, `__tests__/languageService.test.ts` | yes (suggest widget) | no |
| D3a | structured fixes on parse errors: optional `fix` on `TextParseError` (insert token, near names, paths, keywords; §4.3) | `parser.ts`, `__tests__/tolerant.test.ts` | no | no |
| D3b | code action provider; conformance violations as markers on the object and feature spans, with their fixes | `ui/textualMonaco.ts`, `ui/TextualTab.tsx`, `conformanceMarks.ts` (new, pure), `__tests__/conformanceMarks.test.ts` (new) | yes | no files changed in the zone; imports `model/conformance/useConformance` (read only, L-layer) |
| D4 | safe rename: `renameEdits` with the reparse check, `RenameProvider` (§5) | `languageService.ts`, `ui/textualMonaco.ts`, `__tests__/languageService.test.ts` | yes (rename box) | no |
| D5 | formatting: print plus comments put back by owner; range format by top-level splice (§6.2) | `format.ts` (new), `ui/textualMonaco.ts`, `__tests__/format.test.ts` (new) | yes | no |
| D3c | user validation-rule problems as markers, after a run | `ui/TextualTab.tsx`, `conformanceMarks.ts`, `__tests__/conformanceMarks.test.ts` | yes | imports `components/editor-v2/problems/registry.ts`, a §3.1 directory, read only: the lane prompt names it (Rule 20) |

Every lane ends with typecheck 0, build, the textual tests green; D2a and D3a also with the mutation note of CLAUDE.md
§5: without `cursor`, the parse result is identical on the whole textual corpus (a test that compares).

Decisions, one recommendation each:

- **D1 Order.** D1 first (a measured defect, two files), then D2a, D2b, D2c, D3a, D3b, D4, D5, D3c last.
  Recommended: as listed; D2a and D3a are both in `parser.ts` and never run in parallel.
- **D2 Where the expected set is computed.** In the parser, under a cursor option, recording the nodes tested at the
  cursor's token, nullable ones included (F2-F5). Recommended: this, not message parsing and not a second grammar walker.
- **D3 How a reference candidate is written.** As the printer writes it: the name when unique among the targets, else
  the path (R-TXT-4, R-TXT-28), through one exported function the printer also calls; `@"id"` is never offered.
  Recommended: yes.
- **D4 Rename route.** The text route: Monaco edits from `referencesAt`, refused when the reparsed text has a new error or
  a reference changes target; on an applicable parse only; a nameless object is refused in D, insertion of a name is a
  later slice. Recommended: yes.
- **D5 What Format keeps.** Comments always (R-TXT-20); redundant parentheses dropped in D, documented, undoable with
  the editor's undo; keeping them by printer hints is a later slice. Format only on an applicable parse. Recommended:
  yes.
- **D6 What a quick fix is.** A text edit only, applied by the pause like typing, never a model write. Recommended: yes.
- **D7 R-TXT-37 scope.** Ask whenever any deleted root is covered by a comment, even with other changes in the same
  pause, a superset of the row's «only change». Recommended: yes; it needs Alfonso's ratification as it reads the row
  wider.
- **D8 Conformance markers.** Warning severity, source `conformance`, never blocking the apply (they speak of the model,
  not of the text), placed on the carried spans so they follow typing. Recommended: yes.
- **D9 Validation-rule markers.** Only after the user runs validation (the producer is not reactive,
  `registry.ts:35-36`), lane D3c, low priority. Recommended: yes.
- **D10 Step C tokens in completion.** Per-block tokens and the head prefix are offered as keywords; a multi-word close
  is offered whole, and its remainder once begun (F4). Recommended: yes.

## 9. Risks and open questions

Risks:

- R1. `parser.ts` (1395 lines) is on the hot path of every provider; a cursor collection inside `canAt`/`hit` must leave
  the result unchanged without a cursor. Guarded by the comparison test of §8.
- R2. Extracting the printer's `ref`/`path`/`name` closures can change a print. Guarded by the existing print round-trip
  tests; the lane runs them before and after.
- R3. That a conformance `objectId` is the id the tab's spans carry is read, not measured (§4.2); D3b measures it first.
- R4. Rename does not rewrite names inside JjEL strings or validation rules (step F); a rename can break a rule that
  names the object. D4 says so in the rename's message, or the lane counts such rules first.
- R5. The R-TXT-37 detection relies on the carried span staying on the object while `//` is typed at its start;
  `NeverGrowsWhenTypingAtEdges` (`TextualTab.tsx:1105`) suggests it does; the probe shifted the spans by hand, so the
  app check of D1 measures it in Monaco.
- R6. `ui/TextualTab.tsx` (2047 lines) is touched by D1, D3b, D3c and by C2e if it opens: lanes serialize on it.
- R7. Formatting under the Indentation style moves comments across INDENT and DEDENT; D5 tests both layouts.

Open questions:

1. D7: ratify asking on any comment-covered deletion, beyond R-TXT-37's «only change»?
2. D5: drop redundant parentheses on Format in D, or keep them from the start?
3. D8: conformance markers as non-blocking warnings, or errors?
4. D4: refuse the rename of a nameless object in D, with name insertion later?
5. D1: is the lane order right, with R-TXT-37 before completion?
