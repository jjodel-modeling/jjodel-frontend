# Discovery: one language service for the Text tab (step B, phase 1)

Prompt-ID: P-2026-11-03-2300 · prompt `docs/prompts/claude_2026-11-03_2300_prompt_textual_b_discovery.md` · session
b4809b2f-5d4c-49a5-8d57-da469b48cb9f · tree `~/jjodel-w-textb`, branch `textual-b-navigation`, HEAD `914becadd` (contains
`2daef6982`, step A merged) · executor model: Opus 5.5 (`claude-opus-5-5`).

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the real files.

## Objective

Read how the Text tab wires Monaco today and what step A's tree and `displayMatch` give; recommend one language
service derived from grammar and metamodel, wired to the Monaco providers (semantic tokens, document symbols, folding
ranges, definition, references, hover), with the outline, breadcrumb and EBNF highlighting; measure its cost against
the 50 ms budget at 1,000 objects (R-TXT-36); measure the paste-back finding of P-2026-11-03-2152.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The tree of step A carries every fact the six providers need, with no new parser work | **holds** for highlighting, symbols, folding, definition, references (read, F2; measured, F4); **partly** for hover: the metamodel input has no documentation and no lower bound (read, F3) |
| H2 | One parse plus one walk of the tree fits the 50 ms budget at 1,000 objects | **holds**: 7.6 ms + 1.0 ms at 1,201 objects (measured, F4) |
| H3 | `displayMatch` can run on every parse, for the outline's identity | **falsified** beyond 1,000 objects: 15.7 ms at 1,201, 444 ms at 6,001 (measured, F4) |
| H4 | Monaco's standalone build gives the outline and the breadcrumb as widgets | **falsified**: both are workbench parts; standalone Monaco gives the providers only (read, F5) |
| H5 | The Text tab is checked in a light and a dark theme | **falsified**: Jjodel has no dark theme (D-UI-15); `data-theme="dark"` changes nothing in the tab (read and measured, F6) |
| H6 | After a delete and a paste back, the pasted region loses its span evidence | **holds** (measured in the app, F7) |

## Files read

- `frontend/src/codegen/textual/ui/TextualTab.tsx` (lines 1-31, 100-200, 289-330, 405-470, 525-1195)
- `frontend/src/codegen/textual/parser.ts` (lines 1-260, 473-552, 940-1000)
- `frontend/src/codegen/textual/textMatch.ts` (lines 1-60 by grep, 144-274)
- `frontend/src/codegen/textual/concreteGrammar.ts` (lines 400-454)
- `frontend/src/codegen/textual/metamodel.ts` (field declarations, by grep over the whole file)
- `frontend/src/codegen/textual/printer.ts` (exports, by grep)
- `frontend/src/codegen/textual/__tests__/tolerantCorpus.ts` (lines 1-106)
- `frontend/src/codegen/ui/templateLanguage.ts` (lines 1-31, 150-167)
- `frontend/src/jjtl/editor/jjtlTheme.ts` (rules, by grep), `frontend/src/jjscript/editor/jjscriptMonaco.ts:25-35`
- `frontend/src/index.tsx:18-30` (Monaco setup), `frontend/package.json` (monaco-editor ^0.52.2, @monaco-editor/react ^4.7.0)
- `frontend/src/styles/CLAUDE.md:27,41`, `frontend/src/styles/tokens/index.scss:20-40`
- `frontend/src/model/logicWrapper/LModelElement.tsx:166,1028-1041` (annotations)
- `frontend/scripts/gates/check-codegen-lazy.ts:1-13`
- `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md`, `docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md` (lines 1-60 by grep, 163-280)
- `~/.jjodel-lanes/P-2026-11-03-2152/` (`probe.mjs`, `common.mjs`, `handoff.md:55-61`, `probe-run2.log`)

## Method (measured)

Three probes, committed as evidence in `docs/discovery/harness/`:

- `probe_2026-11-03_textual_language_service.test.ts`, run from `frontend/src/codegen/textual/__tests__/` with vitest
  (exit 0, 23:04), then moved: library corpus plain (books : members = 5 : 1), a prototype of the service's
  derivations over the tree (semantic tokens encoded as Monaco wants them, symbol tree, folding ranges, reference index,
  path at an offset), and `displayMatch`; median of 5 after a warm-up. Output: `probe_langservice.json`.
- `probe_2026-11-03_textual_language_service_app/`: the harness of P-2026-11-03-2152 (`common.mjs`, paths moved to
  this worktree, vite on port 3460, Chromium, device scale 1, demoESM imported through `ProjectsApi.importFromText`,
  tab opened through `openTextualTab`). `probe-paste.mjs` (runs 1 and 2, 23:00 and 23:01), `probe-dark.mjs` (run 3,
  23:06), `probe-monaco.mjs` (run 4, 23:08). Every log's mtime follows its run.

All on HEAD `914becadd`, code identical to `2daef6982` (the commits between are docs).

## Findings

### F1. How the tab wires Monaco today (read)

- Both editors are plain text: `<Editor width="100%" height="100%" language="plaintext" defaultValue={view.text}`
  (`TextualTab.tsx:997`) and `<Editor ... language="plaintext" value={view.ebnf}` (`TextualTab.tsx:1003`); the «new
  model» tab too (`TextualTab.tsx:1173`). No provider, no Monarch tokenizer, no theme prop.
- Folding is off: `folding: false` with `lineNumbers: 'off'`, `lineDecorationsWidth: EDITOR_DECORATIONS_WIDTH` = 10,
  «The glyph margin plus the decorations fill the 30 px the global Monaco rules give the margin» (`TextualTab.tsx:536-550`).
- Identity rides on two decoration sets with `stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges`
  (`TextualTab.tsx:616-648`), read back by `carriedSpans` / `carriedRefs` (`TextualTab.tsx:651-672`).
- Markers: one owner, `EDIT_MARKER_OWNER = 'textual-edit'`, a secondary error as a warning (`TextualTab.tsx:675-691`).
- The parse runs once per pause, inside `planEdit`: `const parsed = parseText(text, base.grammar, { keep: refs });`
  (`TextualTab.tsx:294`), on `APPLY_DELAY_MS = 800` (`TextualTab.tsx:221`). The parse depends on the carried reference
  tokens (`keep`), which live in the tab.
- Spans are re-derived only from a parse that reached a diff: «// Spans are re-derived from every parse that matched
  (R-TXT-22); a broken one keeps the carried ones.» / `if (plan.diff) setDecorations(certainSpans(parsed, plan.diff.match));`
  (`TextualTab.tsx:812-813`).
- The EBNF view is a separate, read-only editor mounted only in EBNF mode (`TextualTab.tsx:1001-1006`); the text editor
  stays mounted under it (`TextualTab.tsx:994`).
- The precedent for a language of this front: `ensureTemplateLanguage()` registers once, Monarch plus a theme that reuses
  the JjTL rules: `monaco.editor.defineTheme(TEMPLATE_THEME_ID, templateTheme);` (`templateLanguage.ts:155-166`, header
  line 14 «The theme is the JjTL editor's ..., reused»).

### F2. What step A's tree gives (read)

- Roles on every token read: `export type TokenRole = 'class' | 'keyword' | 'name' | 'value' | 'literal' | 'reference' | 'punctuation';`
  (`parser.ts:189`); «a skipped token has none» (`parser.ts:188`). Trivia on tokens (`parser.ts:204-207`), comments
  derived by `commentsOf` (`parser.ts:130`).
- Nodes: `ObjectNode` with `id`, `cls`, `rule`, `state: 'complete' | 'partial' | 'unclosed'` and `orphan?: true` «its
  container is unknown» (`parser.ts:73-86`); `ItemNode.feature` (`parser.ts:88-91`); `BlockNode.closed`
  (`parser.ts:92-96`); `ListNode` (`parser.ts:97-100`); `RefNode.ref?: ParsedRef` (`parser.ts:101-106`) whose `to` is
  «The parsed object it names, or the outer reference; absent when it names nothing» (`parser.ts:168-169`); `ErrorNode`
  (`parser.ts:108-111`). So: highlighting (role + parent kind), symbols (object nodes), folding (block and list nodes),
  definition (`ref.to` to the object node of that id), references (the inverse of `ref.to`), all derive from one walk.
- The result keeps its old lists and adds `tree` and `unclosed` (`parser.ts:978-982`).
- The keyword role covers both feature keywords and style keywords (a name keyword, `titled`): the parent kind (`item`
  or not) tells them apart. Inferred from the node types, not run per case.

### F3. What hover lacks (read)

`TextMetamodel` fields: `name`, `type`, `many?`, `ordered?` on attributes; plus `containment?` on references;
`name`, `isAbstract?`, `supers?`, `attributes?`, `references?` on classes (`metamodel.ts:11-45`, the whole file by grep
of `readonly <name>`; control: the same grep lists `ordered`, which is there). No documentation, no lower or upper
bound. `textInputOf` reads `many: r.multiplicity === '*' || Number(r.upperBound) > 1` (`TextualTab.tsx:138`) and
nothing else of the bounds. The lower bound exists in `ElementIds.features[...].lower` (`tolerantCorpus.ts:27`), read
from the D-layer. Documentation, where Jjodel has it, is an `annotations: Pointer<DAnnotation, ...>` on every element
(`LModelElement.tsx:166`), with `details!: DAnnotationDetail[]` (`LModelElement.tsx:1041`): the Ecore convention is the
GenModel annotation's `documentation` detail. Whether the Ecore import keeps it was not checked.

### F4. Cost (measured, `probe_langservice.json`)

| Objects | Chars | Tokens | Semantic tokens | Folds | parse | derive (all providers) | path at offset | displayMatch, valid | displayMatch, one `{` deleted | same, no spans |
|---|---|---|---|---|---|---|---|---|---|---|
| 1,201 | 66 k | 8,277 | 6,070 | 1,003 | 7.6 ms | 1.0 ms | 0.02 ms | 15.7 ms | 14.8 ms | 47 ms |
| 6,001 | 336 k | 41,345 | 30,338 | 5,003 | 28.2 ms | 4.8 ms | 0.06 ms | 444 ms | 455 ms | 1,804 ms |

Parse and derivation are linear. `displayMatch` is quadratic: its span step compares every parsed object with every
previous span, `for (const ms of input.previous!) {` inside `parsed.objects.forEach` (`textMatch.ts:160-171`), and the
container step filters all objects per object, `const siblings = parsed.objects.filter(...)` (`textMatch.ts:189`). The
same `matchObjects` already runs on every pause through `planEdit` (F1), so the existing pause pays it too at 6,001.
`displayMatch` has no UI consumer: `grep -rn displayMatch` over `frontend/src` hits only `textMatch.ts` and the tests
(`tolerant.test.ts:269,279`, the same search is its own positive control).

Monaco's side (measured, `probe-monaco.mjs`, a detached 900x600 editor in the app's Monaco 0.52.2, synthetic text of 5
lines and 8 tokens per object):

| Objects | Tokens | edit → provider asked | provider result → 2 frames | decorations set → 2 frames | decorations replace, sync |
|---|---|---|---|---|---|
| 1,000 | 8,000 | 456 ms | 42.7 ms | 33.3 ms | 3.4 ms |
| 6,000 | 48,000 | 454 ms | 33.8 ms | 43.0 ms | 26.0 ms |

Two frames at 60 Hz are 33 ms, so paint is within a frame either way. Monaco itself debounces the semantic-token
request about 0.45 s after an edit, and shifts the old tokens meanwhile: a freshly typed word is uncoloured for that
long. The figures are of a synthetic text, not of a print.

### F5. What standalone Monaco offers (read)

`index.tsx:19` imports the whole `monaco-editor`, so the contributions behind the providers are present (hover,
go to definition with F12 and Cmd+click, the references peek with Shift+F12, folding, the quick outline from document
symbols). The outline view and the breadcrumb bar are VS Code workbench parts, not in the standalone editor: in the Text
tab they are React components over the service. Inferred from the API, not run.

Themes are global in Monaco: `defineTheme` / `setTheme` apply to every editor of the page, so a theme prop on the Text
tab recolours a JjTL or JjScript editor open beside it (read; not measured here). `templateLanguage.ts` already meets
this by reusing the JjTL rules; JjScript adds its own, `rules: jjscriptThemeRules(jjtlTheme.rules)`
(`jjscriptMonaco.ts:35`).

### F6. No dark theme (read and measured)

`frontend/src/styles/CLAUDE.md:27`: «Jjodel has no dark theme (D-UI-15, 2026-10-04, final); its code was removed on
2026-10-10». Measured (`probe-dark.mjs`): with `html[data-theme="dark"]` the tab bar stays `rgb(241, 245, 249)` and the
Monaco background `rgb(255, 255, 254)`, the editor class `... vs`. Crops: `~/.jjodel-lanes/P-2026-11-03-2300/phase1-light-today.png`,
`phase1-dark-today.png` (identical). The prompt's phase 2 asks for light and dark: see Decisions awaiting, 2.

### F7. The paste-back finding of P-2026-11-03-2152 (measured)

Run 1 (`probe-paste.mjs`): the demoESM print, the selection from `guard "model.[paid]"` (offset 168) to the end, Meta+c,
Backspace, then Meta+v at 168, then a comment typed on its own line before `Terminal {}`.

- Before: 20 decorations, the 2nd Transition of Initial `[149,272]`, the 3rd `[277,340]`.
- After the Backspace: 14 decorations collapsed to `[168,168]`; the 2nd Transition truncated to `[149,168]`.
- After the paste: status «Up to date», text equal to the print; the 14 stay empty, moved to `[497,497]` (the end of
  the paste); `[149,168]` does not grow back. Decorations equal to the start: false.
- The comment-only edit: «Not applied · confirm below», panel rows «Transition (unnamed) | Transition (unnamed) | same
  name, paired by order» twice.

Run 2, control (`CONTROL=1`, same tab state as opened, the same comment): «No change», empty panel.

So the pasted region loses its span evidence: every span wholly inside the deleted range collapses, the one crossing its
start is cut (IoU 19/123 = 0.15, under `SPAN_OVERLAP = 0.5`, `textMatch.ts:52`), and nothing restores them, because the
text equal to the agreement takes the early return that touches no decoration: `if (text === sync.text) { setMarkers(null); setConfirm(null); ...; return; }`
(`TextualTab.tsx:803-807`) and the same in the content handler (`TextualTab.tsx:861-866`). The next clean parse then
falls to the container step, where two nameless Transitions in one slot are homonyms paired by order (`textMatch.ts:195-198`).
Meta+c is a copy: the D-5 clip is armed only by the `cut` event (`TextualTab.tsx:914-917`), so it does not apply here.

**What fixes it** (not done here): keep the agreement's spans and reference tokens with the agreement (`syncRef`, set
by `reprint`, `apply` and `rewritePaths`), and re-set both decoration sets whenever the editor's text equals the
agreement's again, in both branches above. That covers a paste back, Monaco's own undo back to the agreement, and a
retyped text. It does not cover a paste back followed by other edits before the pause; a prefix/suffix alignment of the
text with the agreement's, mapping the agreement's spans over the unchanged regions, would, at the cost of a second
source of span evidence (Decisions awaiting, 5).

## Risks

1. The global Monaco theme (F5): the Text tab's theme recolours other editors open beside it, and theirs recolour it.
2. `matchObjects` is quadratic (F4): 0.44 s per pause at 6,001 objects already today, on the diff path.
3. Folding needs margin room the tab has given away (`lineDecorationsWidth` 10, F1); the chevrons may overlap the glyph margin.
4. A 0.45 s lag before a new word is coloured (F4), Monaco's own debounce.
5. An outline of 1,000 rows rendered in full, and 6,000 at the figure's size, if not windowed.
6. Two parses per pause (the providers' and `planEdit`'s) unless they share one, and with different `keep` sets they
   would disagree on which references are unresolved.
7. The lazy gate (`check-codegen-lazy.ts:5-7`): a provider registered from an eager module would pull `src/codegen/` into the entry chunk.

## Recommended design (one choice)

**A pure analysis module beside the parser, a thin Monaco adapter that registers one language once, and the outline and
breadcrumb as React components of the Text tab, all fed by one analysis per text version.**

1. **`codegen/textual/languageService.ts`, no Monaco import.** `analyzeText(text, parsed, grammar, mm)` walks the tree
   once and returns a `TextAnalysis`: a flat node table with parent indices and a token-to-node index; semantic tokens
   already encoded (`Uint32Array`, line and column deltas) with a fixed legend; the symbol tree; folding ranges; the
   reference index (target id to reference token ranges); and queries `pathAt(offset)`, `definitionAt`, `referencesAt`,
   `hoverAt`. Nothing names a metamodel: classes, features, keywords and literals come from the grammar and `mm`.
   Testable in vitest without `window` (the `nameLookup.ts` pattern of `CLAUDE.md` §5).
2. **Legend.** Types `type` (class keyword), `variable` (a name, modifier `declaration`; a reference), `property`
   (a feature keyword: a `keyword` token whose parent is an item), `keyword` (other style keywords), `enumMember`
   (literal), `string`, `number`, `comment` (scanned from trivia with the style's comment syntax). Modifiers
   `declaration`, `unresolved` (a reference with no `to` and not kept), `outer` (`@"id"`). Partial objects add no token
   modifier: the outline greys them. Skipped tokens get no token.
3. **`codegen/textual/ui/textualMonaco.ts`, the adapter.** `ensureTextualLanguage(monaco)` registers, once, the language
   `jjodel-textual` and its six providers, the Monarch language `jjodel-ebnf` (fixed syntax: rule names, `::=`, quoted
   terminals, the upper-case terminals and `REF`, `feat=` / `feat+=`, `[ ] { } ( ) | ;`, `(* ... *)`, read off
   `concreteGrammar.ts:413-453`), and one light theme `jjodel-textual-theme` = the JjTL rules plus the legend's rules in
   the slate and cyan tokens (`templateLanguage.ts`'s pattern). Called from `TextualTab.tsx` on mount: the lazy chunk.
4. **Sessions and invalidation.** The providers are global per language, so they find their tab by model:
   `Map<ITextModel, Session>`, the tab attaching on mount and detaching on unmount. A session holds `grammar`, `mm`, a
   `keep()` callback (the tab's `carriedRefs`) and a cache `{ versionId, parsed, analysis }`. `analysisOf(model)` parses
   only when `model.getVersionId()` moved; the tab's `readEdit` takes the same parse (`planEdit` gains an optional
   `parsed`), so a pause parses once. `invalidate()` on a new base (grammar) and on every `setRefDecorations` (the
   `keep` set changed with no text change), and fires the providers' `onDidChange` events so Monaco asks again.
5. **Outline**, inside the text layer, left of the editor: 224 px wide, rows of 24 px, 16 px indent, 11 px secondary
   text, Bootstrap Icons, collapsible by a tab-bar toggle; a filter field on top (substring of name or class keyword,
   ancestors of a match kept); windowed by hand (fixed row height, the visible slice of the flattened open rows, no
   dependency). It follows the cursor (`onDidChangeCursorPosition` → `pathAt`, ancestors opened, row scrolled into
   view) and a row click selects the object's name in the editor. Row keys are structural (class and name, or index
   among siblings), so open rows survive a reparse; no `displayMatch` per keystroke (F4). Partial objects greyed,
   unclosed ones as they are (R-TXT-36 (3)); orphans under an `unknown container` node placed where the skipped block
   was, under the innermost enclosing object read, at the top when none (R-TXT-36).
6. **Breadcrumb**: a 24 px strip between the bar and the editor, text mode only: the object path at the cursor and the
   feature of the item under it, `city › books › book3 › borrowedBy`, each segment revealing its node.
7. **Folding**: block and list nodes over more than one line, from the open token's line to the line before the close;
   an unclosed block to its last token's line; runs of own-line comments as `comment` ranges. `folding: true`,
   `showFoldingControls: 'mouseover'`, the margin measured in phase 2 (risk 3).
8. **Hover**: an object's class (abstract, supers), its containing feature; a feature's kind, type, multiplicity
   `[lower..upper]`, ordered; a reference's target and its line; a literal's enumeration; documentation when the
   metamodel carries it. Needs optional `lower?`, `upper?`, `doc?` on the `TextMetamodel` interfaces (Rule 11: optional
   properties only), read in `textInputOf` (Decisions awaiting, 3).

Cost per text version at 1,201 objects: 7.6 ms parse + 1.0 ms derivation, measured; Monaco paints within a frame; the
outline renders its window only. At 6,001: 28.2 + 4.8 ms.

### Rejected alternatives

- **Inline-class decorations for the colours**: no theme, so no global side effect, but 8,000 decorations per parse at
  1,000 objects and 48,000 at 6,000 (26 ms to replace, F4), not shifted by Monaco between parses as semantic tokens are,
  and mixed with the identity decorations the tab reads back (F1). With no dark theme (F6) the CSS route gains nothing.
- **A Monarch tokenizer generated per grammar**: one language per metamodel that Monaco never unregisters, blind to
  resolved versus unresolved and to name versus reference, a second copy of the parser's knowledge. Kept for the EBNF,
  whose syntax is fixed.
- **The service inside `TextualTab.tsx`**: the component is 1,195 lines and imports Monaco; the analysis would not be
  testable in the bench.
- **A web worker or an LSP client** (`monaco-languageclient`): a new dependency or a process for 9 ms of work.
- **`displayMatch` on every parse for the outline**: quadratic (F4); it belongs to step E, where synced selection needs
  model ids, after `matchObjects` is made linear.
- **Monaco's own outline and breadcrumb**: not in the standalone editor (F5).
- **Incremental re-analysis**: not needed at the measured costs (R-TXT-36: no incremental parsing).

## Decisions taken (unattended)

1. Tests on step A's corpus: library (three forms), turnstile (two), garage (two styles). Provisional.
2. The legend of the design, item 2. Provisional, changes only the adapter and the theme.
3. The `unknown container` sits where the skipped block was, under the innermost object read, at the top when none.
4. Outline open by default, its state in the tab's own state, not persisted.
5. The «New model» tab stays as it is in B (plain text); it could attach a session later at no cost.
6. The probes are committed in `docs/discovery/harness/`; the vitest probe's working copy was moved, not kept in `__tests__`.

## Decisions awaiting Alfonso

1. The design above: one pure analysis module, a Monaco adapter with semantic tokens and a light theme carrying the JjTL rules, outline and breadcrumb in React.
2. Phase 2 checks the light theme only, as D-UI-15 says there is no dark one; the prompt's dark check is dropped.
3. Hover reads documentation from the GenModel `documentation` detail of an element's annotations, and the bounds, through new optional fields of `TextMetamodel`.
4. No `displayMatch` per keystroke in B; a ticket for a linear `matchObjects` (0.44 s per pause at 6,001 objects today).
5. The paste-back fix: restore the agreement's decorations when the text equals it again, in a fast lane of its own; the prefix/suffix alignment only if Alfonso wants the wider case.
6. `planEdit` gains an optional `parsed`, so the providers and the pause share one parse.

## Open questions

1. Does the Ecore import keep the GenModel `documentation` annotations, so that hover has documentation on imported metamodels?
2. Should the theme also carry the JjScript rules (`jjscriptMonaco.ts:35`), so a JjScript editor beside the Text tab keeps its colours?
