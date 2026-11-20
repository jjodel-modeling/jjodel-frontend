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

## 8. Addendum, 2026-11-20 17:00: Phase 2 as narrowed

The project chat adopted the `Recommended:` line (RC-21, 16:35). Built: S1 D1 (`fc0d8987b`), S2+S3 D2 and D3 narrowed (`f8f03322b`), a fix from the mouse probe (`4ec528ab8`). Registered as R-MT-33 (D1), R-MT-34 (D2 as built), R-MT-35 (D3 narrowed: a switch between two tabs), R-MT-36 (D7).

Deferred, not registered as rows: D4 (EBNF and Syntax stay in the textual bar's right zone; no syntax surface outside the model tab, §4.5), D5's move of «Up to date» to the status bar (the status and its Delete, Discard, Save actions stay in the bar's left zone), D6 (tree and filter still mounted; breadcrumb not shared, §4.8).

### 8.1 Mouse probe

`~/.jjodel-lanes/P-2026-11-20-1610/probe-ecp.mjs`, real clicks, fixture `frontend/public/library/gallery/families-persons/1.jjodel` (Families, sample-Families). Families opened from the dashboard, Split Right, sample-Families opened in group 2, Text pressed in group 2, then Diagram, then Text. Dev server 3120 with `VITE_CODEGEN=true`; baseline at `fc0d8987b` (old toolbar) on a temporary worktree, port 3122, since removed. JSON `probe-ecp-{before,after}-{1600,1280}.json`, crops `crop-{before,after}-*`.

After, at 1600 and 1280, 12/12 checks: both active tabs `rgb(15,23,42)`, transparent, `inset 0 -2px 0 rgb(14,165,233)` on `.dock-tab-btn`; both bars top 35, height 40, padding 0 12px 0 8px, separator 1px `rgb(226,232,240)`; the switch ends 12px from the bar's right end in the Text tab (the canvas's rail cell trails its right zone, so the panel offset differs by that cell); Text tab lands in group 2 and shows Text pressed; no close button in the textual bar; Text on the metamodel `aria-disabled` with the title «A metamodel has no textual view: open one of its models as text»; bar geometry identical across Diagram, Text, Diagram, Text; EBNF and Syntax present, the old Text entry gone; no console errors.

### 8.2 Regression found and partly fixed

Split Right's distance from the panel's right edge (positive: in view; negative: scrolled out, R-MT-26):

| bar | before | after S2+S3 | after fix |
|---|---|---|---|
| metamodel alone, 1600 (bar 395px) | 34 | −119 | −32 |
| model, right group of the split, 1600 | 35 | 34 | 35 |
| metamodel alone, 1280 (bar 255px) | −106 | −259 | −172 |
| model, right group of the split, 1280 | 35 | −103 | −17 |

The 145px switch had no floor below its labels. The fix puts it on step 1 of the canvas bar's ladder: its labels shrink first, with the group labels' factor, down to two icon-only entries (59px, titles kept). Residual: in a bar already at its floor before this lane (395px bar, overflowing 25px), any added control scrolls something out; Split Right does, by 32px at 1600 and 17px in the 1280 split.

Also seen, not changed: at 1280 the textual bar clips the existing EBNF | Syntax labels («Synt»); the disabled Text entry reads only slightly lighter than an inactive one.

### Decisions taken (unattended), Phase 2

1. Active strip tab per R-MT-33; `data-jj-kind` still written by `Navbar.tsx` (the menu reads it), only the overrides went.
2. EditorBar zones `display: contents`; root and fieldset keep `editor-v2-toolbar` and `editor-v2-toolbar__commands` (Rule 2).
3. Canvas zones and textual zones as in R-MT-34; no Split Right on the Text tab (`txt_<id>` is unique).
4. Text hidden when the textual view is off, so Basic mode and the MODELS demo show nothing new.
5. Diagram from the Text tab without importing `TabDataMaker` (it broke 12 textual test files at import through the joiner mock).
6. Switch labels shrink first, floor 59px (`4ec528ab8`).
7. `scripts/hooks/__tests__/contextCeiling.test.ts` fails in the full suite run from a lane (it reads `JJODEL_LANE_LOG*`) and passes 32/32 with those unset: environmental, not this lane's.

### Decisions awaiting Alfonso

1. Visual check of the two groups (dev server on 3120).
2. The Split Right residual of §8.2: accept the scroll (R-MT-26), or order Split Right before the switch so the switch is what scrolls, or hide the switch's labels always.
3. D4, D5 (status bar move), D6: a lane that first gives a metamodel's syntax a home, then removes EBNF and Syntax from the model tab.

### 8.3 Split Right residual, decided (2026-11-20 17:10)

The project chat decided (RC-25): the switch is icon-only in both bars at every width, and Split Right never scrolls out. Built in `4ec5f6196`: the left and middle zones are wrapped in `.editor-bar__scroll`, the one box that scrolls; the right zone (switch, Split Right, rail collapse) and the trailing rail cell sit outside it. The disabled Text takes `--color-text-disabled` at the 0.3 opacity of `.toolbar-btn:disabled`. It was `--color-text-placeholder`, slate-500, darker than the disabled token.

Correction to the §8.2 table: its rows «metamodel alone» were measured after the split, with the metamodel in the left group. Both cases are measured below.

Split Right's distance from the panel's right edge, probe 17/17 at each width:

| bar | 1600 | 1280 |
|---|---|---|
| metamodel alone, before the split | 443 | 403 |
| metamodel, left group of the split | 59 | 59 |
| model, right group of the split | 35 | 35 |

What scrolls now is the editing and view controls: at 1600 the left group's scroller holds 320px in 244, at 1280 320 in 104. Bar top 35 and height 40, padding 0 12px 0 8px in the split and 0 12px 0 20px alone, unchanged. Active-tab parity unchanged. The EBNF | Syntax cut at 1280 is gone as a side effect (the switch went from 145 to 58px); it was left alone otherwise, as decided.

### 8.4 Visual-check round (Alfonso 2026-11-20 21:59-22:07)

Three asks, built in `e36a00f7a`: the canvas's identity cell removed, the Text tab's filter and breadcrumb rows aligned, one control style in both bars. Measured with `probe-uni.mjs` (split: Families canvas left, sample-Families text right) and `probe-ecp.mjs` (17/17 at 1600 and 1280), no console errors.

| measure (split, 1600 and 1280 alike) | before | after |
|---|---|---|
| canvas icon buttons | 22x28, 1px slate-200 border, white or slate-50 surface | 28x28, no border, transparent |
| Text icon buttons | 22x22 flat | 28x28 flat |
| zoom, Split Right + rail collapse | bordered boxes 86x32 and 50x32, radius 8 | flat, no box |
| dividers | none (canvas separators hidden by the split query) | one 1px x 20px `--color-panel-border` divider before the middle zone and before the right zone, both bars |
| dropdowns and segmented | canvas 26px slate-200; Text select 22px and EBNF/Syntax 24px slate-300 | all 26px, slate-200 |
| secondary text | name slate-900, language and status slate-600, 11px | all 11px slate-700 (`--color-text-secondary`), name 600 |
| bar bottom y, first-control x | 125, 8 | 125, 8 |
| filter row / crumb row | 125-157 / 125-149 | 125-157 / 125-157, crumb text centred (131-151) |
| first node / first text line | 157 / 149 | 157 / 157 |
| canvas identity cell | badge «M» (name hidden in the left group) | none |

Found on the way: the cell was also the bar's room over the rail. The rail overlay starts at y 91 (`properties-with-tree-view.scss`, appbar + 1 + toolbar height, the tab strip not counted), inside the 85-125 bar band, so without the cell Split Right and the rail collapse sat under `.tree-scope-bar` and took no click (hit test at 1600). `trailing` now carries an empty `editor-bar__rail-reserve` as wide as the rail, hidden in a pane with no rail under it. Hit test after: switch, Split Right and rail collapse of the right group all reachable at 1600 and 1280.

Also fixed: «Families» and «Up to date» read as one word in a split (2px gap): the status takes the `·` the language takes. At 1280 the wider buttons squeezed the model's name to nothing; it now keeps a 48px floor and the language shrinks first.

Remaining differences: the active toggle states stay as each sheet has them (canvas snap-to-grid on the accent-muted surface, Text outline toggle on `--color-bg-active`); icon glyph colours in advanced mode follow the canvas's own `html[data-mode="advanced"]` rule, not unified; the canvas's in-zone separators stay hidden in the split, as the split query decided (R-MT-24), so a split shows only the zone dividers. The rail's `top` not counting the tab strip is a separate finding, not touched.
