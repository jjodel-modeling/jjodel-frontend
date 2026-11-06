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

(pending)

## 5. Safe rename

(pending)

## 6. Formatting

(pending)

## 7. R-TXT-37, commenting an object out

(pending)

## 8. Lane plan and decisions

(pending)

## 9. Risks and open questions

(pending)
