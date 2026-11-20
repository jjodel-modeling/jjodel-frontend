# Discovery 2026-11-20 — editor chrome parity (diagram canvas and text editor)

- Prompt-ID: P-2026-11-20-1610, prompt file `docs/prompts/claude_2026-11-20_1610_prompt_editor-chrome-parity.md`
- Session: session_01DQt9R3rFJe5AMqrdonBxgx (chat C-2026-11-20-1610)
- Tree: `~/jjodel-w-edchrome`, branch `editor-chrome-parity`, HEAD `d4ddede1d` (clean at start)
- Executor model: claude-opus-5-5 (Opus 5.5)
- Phase 1, read-only. This report is a set of hypotheses with evidence, not a definitive reference: whoever uses it downstream re-reads the real files.
- Claims are **read** (source on HEAD `d4ddede1d`) unless marked measured (a grep run in this phase); nothing was measured in a running app.

## 1. Objective

Answer the Phase 1 questions of the prompt for decisions D1..D7 (one chrome for the canvas and the text editor), list the files Phase 2 would touch, and check the three stop conditions before any code is written.

## 2. Hypotheses under test

| # | Hypothesis (from the prompt) | Verdict |
|---|---|---|
| H1 | The active-tab style is decided by artifact kind in one place, and neutral tokens exist to reuse (D1). | **Holds** (§4.1) |
| H2 | The floating «Code» button on the canvas and the Text entry of the textual segmented are the same representation switch, in the same tab (D3). | **Falsified** (§4.4): three distinct behaviours, none of which switches the representation inside one tab. Stop condition 2. |
| H3 | A surface outside the model's textual tab can host EBNF and Syntax today (D4). | **Falsified** (§4.5): the only editors of the syntax record are the EBNF and Syntax modes of `TextualTab`. Stop condition 1. |
| H4 | «Up to date» can move to the status bar for the active group (D5). | **Partly** (§4.6): the status is local state of `TextualTab`; the status bar has no channel for it, and one state carries an inline action. |
| H5 | The textual tree can be unmounted and the text follow the shared Instances panel (D6). | **Partly** (§4.7): selection is shared through `_lastSelected`; the outline's text-order, collapse, filter and keyboard navigation are lost. |
| H6 | The breadcrumb is one component reusable on the canvas (D6). | **Falsified as stated** (§4.8): its path comes from the text session's caret, not from a selection. |

## 3. Files read (full paths, by region)

- `/Users/alfonso/jjodel-w-edchrome/frontend/src/codegen/textual/ui/TextualTab.tsx` (2587 lines; regions 1-120, 780-800, 884-1060, 1200-1210, 1715-1820, 2010-2210, 2520-2550 via grep)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/codegen/textual/ui/openTextualTab.tsx` (1-135)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/components/editor-v2/EditorV2.tsx` (455-515)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/components/editor-v2/Toolbar.tsx` (70-90, 129-140, 348-410, 1220-1358)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/codegen/ui/CodePanel.tsx` (1-30)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/components/dock/DockManagerStyles.scss` (555-590, 675-770)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/components/abstract/tabs/tab-title.scss` (1-100)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/pages/components/navbar.scss` (1690-1730)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/pages/components/Navbar.tsx` (148-160 via grep)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/styles/tokens/_colors-light.scss` (1-90 via grep)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/components/StatusBar.tsx` (1-30, 225-264, 319-360 via grep)
- `/Users/alfonso/jjodel-w-edchrome/frontend/src/jjtl/views/GrammarTab.tsx` (1-25)
- `/Users/alfonso/jjodel-w-edchrome/docs/decisions.md` (R-MT rows only, 8000-8103)

## 4. Findings

### 4.1 Tab style by artifact kind (D1) — holds

The strip's active tab is styled per kind in one rule block:

`frontend/src/components/dock/DockManagerStyles.scss:743-750`
> `&.dock-tab-active > .dock-tab-btn {`
> `background: rgba(14, 165, 233, 0.08) !important;`
> `color: #0ea5e9 !important;`
> `&[data-jj-kind="metamodel"] { background: #ede9fe !important; color: #6d28d9 !important; }`
> `&[data-jj-kind="viewpoint"] { background: rgba(13, 148, 136, 0.08) !important; color: #0D9488 !important; }`

`data-jj-kind` is written by `frontend/src/pages/components/Navbar.tsx:158` (`setOrDrop(btn, 'data-jj-kind', t.type);`). The model tab's amber icon is the `::before` of `frontend/src/components/abstract/tabs/tab-title.scss:34-37` (`&[data-type="model"]::before { … background-color: #FEF3C7; color: #D97706;`); the textual tab is `data-type="textual"` (`openTextualTab.tsx:109`). The app bar mirrors the same rules (`navbar.scss:1690-1728`, `&--metamodel.appbar-tab--active { background: #ede9fe;`).

Neutral tokens: `styles/tokens/_colors-light.scss:19-34` (`$slate-…`), `--color-bg-secondary` used by the strip hover (`DockManagerStyles.scss:738`). No `--jj-tab-*` token exists (measured: `command grep -rc -- '--jj-tab' styles/tokens/`, 0 in all 13 files; control `command grep -c slate _colors-light.scss`, 107 lines). D1 is a CSS-only change in `DockManagerStyles.scss` (and, for consistency, `navbar.scss`); no stop condition.

### 4.2 The two bars, and no shared bar component (D2)

- Canvas: `frontend/src/components/editor-v2/Toolbar.tsx` (1360 lines), rendered by `EditorV2.tsx`; Split Right at `Toolbar.tsx:1287-1293` (`{onSplitRight && (` … `title="Split Right"`).
- Text: the inline `<div className="textual-tab__bar">` of `TextualTab.tsx:2025-2131`, and a second one for a new model at `TextualTab.tsx:2522-2546`. Its contents: title + language (2026-2030), draft state / Read-only / edit status (2031-2062), stale and style-refused alerts (2064-2079), notation select (2080-2089), export/import (2090-2104), outline toggle (2105-2111), modes Text | EBNF | Syntax (2112-2126), close X (2127-2130).
- No shared bar component exists: the two bars share no class or component (measured: `command grep -rln textual-tab__bar frontend/src` returns `TextualTab.tsx` alone, the SCSS nesting it as `&__bar`). A new one would be needed.

### 4.3 The trailing `M` badge

`Toolbar.tsx:1341-1353`: the identity cell of the open artifact, shown only with the right rail (`{editorTitle && isRailVisible && (`), letter `{isMetamodel ? 'M' : 'm'}`, followed by the artifact name and an inert chevron (comment at 1325-1327: «The chevron is an affordance for switching model and is inert for now»). It is the header of the right rail column, not a kind marker of the bar.

### 4.4 «Code» and the Text segmented are not one switch (D3) — falsified, stop condition 2

Three distinct behaviours exist today; none switches the representation of the artifact inside the same tab:

1. **«Code» pill** — `EditorV2.tsx:459` `const CodePanel = CODEGEN_BUILD ? React.lazy(() => import('../../codegen/ui/CodePanel')) : null;` and `EditorV2.tsx:500-503`, `title="Code generation"`. `codegen/ui/CodePanel.tsx:2` «the «Code» pill's launcher of a model editor»; `CodePanel.tsx:9-10` «Pressing the pill opens the tab of the generator last used on the metamodel in this session». It launches the **code generator** tab (templates, Run, Check). It never shows the model as text.
2. **Text from the canvas** — the viewpoint picker's synthetic textual entry, `Toolbar.tsx:395-402`: «it opens the read-only Text tab, a sibling of the canvas tab as the manager is» → `openTextualTab(modelId, label)`. `openTextualTab.tsx:46` `textualTabId = (modelId) => \`${TEXTUAL_TAB_PREFIX}${modelId}\`` — a **separate dock tab** `txt_<modelId>`, placed beside the canvas (`openTextualTab.tsx:112-115`, `open-beside` / `move-beside` / `activate` / `open`). Gated on the codegen setting, the build flag and Advanced mode (`Toolbar.tsx:353-356`). Only offered on models; on a metamodel the picker shows '' (`Toolbar.tsx:352`).
3. **Text | EBNF | Syntax** — `TextualTab.tsx:1037-1043`, `setMode(m.mode)` at 2120: switches the **content** of the textual tab between the model's text, the notation's grammar and the syntax form. «Text» there is the default mode of the textual tab, not a way back from the diagram.

A `Diagram | Text` control «in the same tab, keeping today's behaviour of each path» cannot be built: (a) replacing the «Code» pill removes the only launcher of the code generator from the editor (a degradation, Rule 3), unless the pill stays; (b) today's Text path opens another tab, so «Diagram» on the textual tab would have to activate the canvas tab and «Text» on the canvas would open/activate `txt_<id>` — a tab-switching control, not a representation switch, and on a split layout the two tabs may sit in different groups (`open-beside`), so the control would move focus across groups; (c) making it a real in-tab switch means mounting `TextualTab` inside the canvas tab, which changes behaviour 2 (tab ids, placement, persisted layout, the `txt_` tests in `codegen/textual/__tests__/openTextualTab.test.ts`).

### 4.5 No surface outside the model tab for EBNF and Syntax (D4) — falsified, stop condition 1

- The syntax record lives on the **metamodel** (`_state[TEXTUAL_SYNTAX_KEY]`, `openTextualTab.tsx:55`), not on a viewpoint. Consumers of `TEXTUAL_SYNTAX_KEY`: `openTextualTab.tsx`, `TextualTab.tsx`, `syntaxRecord.ts`, `dataManagerOption.ts`, two tests (grep `-rln TEXTUAL_SYNTAX_KEY` over `frontend/src`, 7 files; the search found the defining module, which is its positive control).
- `SyntaxForm` is mounted only by `TextualTab.tsx:2173` (grep `-rln SyntaxForm`, 3 files: its own file, `TextualTab.tsx`, a comment in `openTextualTab.tsx:60`). The EBNF editor with editable literals (`EbnfLiterals`, `TextualTab.tsx:2162`) is defined and mounted in `TextualTab.tsx` only.
- `jjtl/views/GrammarTab.tsx:1-3`: «Compact accordion view of JjTL grammar rules / Used inside SuggestedMappingsPanel as a third tab» — the grammar of the JjTL language itself (`GRAMMAR_RULES`), not a metamodel's notation. Not a host.
- Viewpoint authoring (`editor-v2/viewpoint/authoring/`) has no textual-syntax surface (grep `-i textual|txt_`: two hits, both the word «contextual»).

«Edit syntax…» would have nothing to open. Per the prompt, EBNF and Syntax are not removed.

### 4.6 «Up to date» and the status bar (D5) — partly

- Computed in `TextualTab.tsx:788-800` `export function editStatusText(s: EditStatus)` (`case 'synced': return { text: 'Up to date', error: false };`, plus Editing…, N problems, Not applied, Cut, guard …) from the tab's local `status` state.
- The `cut` state carries an inline **Delete** button (`TextualTab.tsx:2055-2059`); EBNF mode replaces the status with draft state + Discard/Save (2031-2045) or «Read-only» (2046-2050). Moving «the status» to the status bar would move or drop those actions.
- `components/StatusBar.tsx:243-264` derives the active model from the active tab id (`useActiveModel(activeTabId)`) and reads stats from Redux; it has no channel for a per-tab edit status. Phase 2 would add one (an event in `events/registry.ts` or a small store), i.e. one more file and a new registry entry.

### 4.7 Textual outline vs the shared Instances panel (D6) — partly

- Selection is already shared: the text writes `_lastSelected` (`TextualTab.tsx:1740` `SetRootFieldAction.new('_lastSelected' …, { node: '', view: '', modelElement: id } …)`) and follows the canvas's selection (`TextualTab.tsx:1787-1790`, `lastSelectedOf(elementIds)`).
- Lost by unmounting `TextNavigator`'s outline (`TextualTab.tsx:884-1033`): rows in **text order** (`outlineRows`, 822-830), group nodes (`n.kind !== 'object'`), collapse state, the Filter input with Escape to clear (973-977), the `role="tree"` list with its keyboard navigation (979), and the per-tab persisted open/closed toggle (`storeOutlineOpen(tabId, next)`, 2108).

### 4.8 The breadcrumb (D6) — not reusable as is

`TextualTab.tsx:919` (`const path = useMemo(() => outline?.pathAt(caret) ?? [], [outline, caret]);`) and the `<nav className="textual-tab__crumbs">` at 1019-1030. The path is computed from the text session's outline at the caret offset; a click moves the caret (`pick(n)`). The canvas has no caret and no outline: a canvas breadcrumb needs a second path source (containment chain of the selected element) and a component extracted from `TextNavigator`.

## 5. Files Phase 2 would touch (as decided, before the stop)

`DockManagerStyles.scss`, `navbar.scss` (S1); new shared bar component + its SCSS, `Toolbar.tsx`, `EditorV2.tsx`, `EditorV2.scss`, `TextualTab.tsx`, `TextualTab.scss`, `StatusBar.tsx`, `events/registry.ts` (S2, S3); extracted breadcrumb component + SCSS (S5); tests; `docs/decisions.md`; log. That is 12+ source files, above the ten of the third stop condition, independently of §4.4 and §4.5.

## 6. Risks

1. D3 as written removes the code-generator launcher (Rule 3) or turns a representation switch into a cross-group tab switch.
2. D4 as written removes the only editors of the syntax record.
3. Moving the status drops the inline Delete / Discard / Save actions unless they move with it.
4. D6 drops text-order navigation and the outline filter, which the Instances panel (model containment order) does not replace.

## 7. Open questions

1. D3: keep the «Code» pill as the code-generator launcher and make `Diagram | Text` a tab switch between the canvas tab and `txt_<id>` (focusing the existing tab, opening it beside if absent), or mount the text inside the canvas tab?
2. D4: keep EBNF and Syntax in the textual tab (moved to the right zone of the shared bar) until a syntax surface exists on the metamodel, or open that surface first as its own lane?
3. D5: does the status bar take the plain status text only, the inline actions (Delete, Discard, Save) staying in the bar?
4. D6: is losing text-order navigation and the outline filter accepted?
5. Scope: S1 (D1, tab style) and D7 are independent of the stops; may they proceed as a lane of their own?

## Decisions taken (unattended)

- Stopped before Phase 2 under stop conditions 1 and 2 of the prompt (and the file count of stop condition 3); no code written, no R-MT rows registered, since the rows would ratify D3 and D4 as written, which the evidence contradicts.
- `Recommended:` answer proposed in chat: run S1 (D1) + D2 (shared bar, «Code» pill kept, EBNF/Syntax kept in the textual tab's right zone, close X removed, status kept in the bar) as a narrowed lane; D3 as a tab switch; D4 and D6 deferred to a lane that first gives the metamodel's syntax a home.

## Decisions awaiting Alfonso

- None from the RC-26 list: no critical-zone edit, no deletion, no exported-interface break, no MODELS-demo change was reached. The open questions above go to the project chat, which decided D1..D7 by delegation.
