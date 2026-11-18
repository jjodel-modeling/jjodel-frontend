# Discovery — textual step B2: outline structure, unnamed objects, the hover card in Monaco

- Prompt: P-2026-11-04-0005, `docs/prompts/claude_2026-11-04_0005_prompt_textual_b2_discovery.md` (measurements, session `c7e33fcf`, stopped at the context soft ceiling, handoff `~/.jjodel-lanes/P-2026-11-04-0005/handoff.md`)
- Written by: P-2026-11-04-0021, `docs/prompts/claude_2026-11-04_0021_prompt_textual_b2_report.md` (session `554af6ad`), from that handoff and the committed probe outputs; no new measurement
- Tree: `~/jjodel-w-textb2`, branch `textual-b2-discovery`; measured on `1f5e99097`, written on `7b3b48d3d` (docs only on top)
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- Monaco: `monaco-editor` 0.52.2 (`frontend/node_modules/monaco-editor/package.json`)

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## Objective

R-TXT-39 asks for three things in step B: (1) the outline shows the grouping of a containment feature as a node, (2) an unnamed object is told apart by a distinguishing value, with one rule for every metamodel, (3) a hover card that stays open until closed or until a click on the text, carrying «Go to definition» and the lines that use the reference, measured "how far Monaco allows this without forcing it". This discovery measures all three and recommends one design per point.

## Hypotheses under test

1. H1 — The parser's lossless tree already holds a node per containment feature, so the outline can take its group nodes from the tree with no grammar change. **Holds**, with one qualification: the group node exists only where the text prints a keyword (finding 1).
2. H2 — One metamodel-independent rule gives `Transition coin` on demoESM and stable labels across a reprint. **Holds** for candidate C4 (finding 2); C1, C2 and C3 fail on demoESM.
3. H3 — Monaco 0.52.2 lets its own hover stay open until closed through public API. **Falsified**: the sticky switch is a module constant (finding 3.1).
4. H4 — An equivalent "stays open" card is reachable through public API without forcing Monaco. **Holds** as a content widget with our own close rules (finding 3.3).
5. H5 — F12, Shift+F12 and the context menu work with providers registered per language the B1 way. **Partly**: all work, except that Shift+F12 on a reference used once shows nothing (finding 3.5).

## Files read

- Decisions: R-TXT-36, R-TXT-38, R-TXT-39 are **not** in this tree's `docs/decisions.md` (`grep -c "R-TXT-39" docs/decisions.md` → 0); they are on trunk, `alfonso-frontend-jjtl:docs/decisions.md` (commit `721927b41`): R-TXT-36 at :7158, R-TXT-38 at :7171, R-TXT-39 at :7182-7191 (read through `git show alfonso-frontend-jjtl:docs/decisions.md`).
- `docs/discovery/discovery_2026-11-03_textual_language_service.md` (step B design; outline and breadcrumb are React components inside the Text tab, items 5-6).
- B1 tree `~/jjodel-w-textb` (uncommitted, read-only): `languageService.ts:47-66` (`TextSymbol`), `:94` (`UNKNOWN_CONTAINER`).
- `frontend/src/codegen/textual/concreteGrammar.ts:280-305, 317-325`; `frontend/src/codegen/textual/parser.ts:857-861, 874, 880, 900, 907-919`.
- `frontend/src/codegen/textual/__tests__/tolerantCorpus.ts` (the corpus).
- Monaco 0.52.2, under `frontend/node_modules/monaco-editor/esm/vs/`: `editor/contrib/hover/browser/contentHoverController2.js`, `editor/common/config/editorOptions.js:802-846`, `editor/browser/widget/markdownRenderer/browser/markdownRenderer.js:105-123`, `base/browser/markdownRenderer.js:257-261`, `editor/contrib/gotoSymbol/browser/goToCommands.js:116-121, 564`; `monaco.d.ts:1144, 5400-5418`.

## Probes (committed with this report)

Under `docs/discovery/harness/`:

- `probe_2026-11-04_textual_b2_outline.test.ts` — outline chains and label candidates over the corpus, printer tree vs parser tree, reprint with every containment and the top level reversed, broken mutants. Its `HARNESS` URL is relative to `frontend/src/codegen/textual/__tests__/`, so it runs only when copied there (runs 2 and 3, exit 0). Outputs: `probe_2026-11-04_textual_b2_app/probe_b2_outline.json`, `probe_b2_broken.json`.
- `probe_2026-11-04_textual_b2_app/` — app probes on a vite server on port 3470 (stopped): `probe-export.mjs` (demoESM read through the tab's reader, `demoesm.json`, `probe-run1.log`), `probe-hover.mjs` (`probe-run4.log`), `probe-refs.mjs` (`probe-run5.log`), shared `common.mjs`.
- Crops (outside the repo): `~/.jjodel-lanes/P-2026-11-04-0005/` `hover-monaco-links.png`, `hover-content-widget.png`, `tab-references-peek.png`, `tab-references-peek-push.png`, `tab-context-menu.png`, `tab-hover.png`.

## Findings

### 1. Outline structure (read + measured)

Read. A non-inline containment prints as an optional item holding the keyword and a block, and inside the block one item per element:

`concreteGrammar.ts:324-325`
```
if (a.inline) return { t: 'opt', feat: f.name, item: { t: 'seq', items: [...blank, ...content] } };
return { t: 'opt', feat: f.name, item: { t: 'seq', items: [...blank, ...kw, block(content), { t: 'nl' }] } };
```
`inline` drops the keyword and the block (:324, and the remark at :319 `'inline: the keyword is not printed'`); `groupBy` adds one optional item per subset, holding the subset keyword and its members (:280-305).

The parser opens an `item` node per `opt` and per element of a `star` carrying a feature, and an `assign` reuses the current item:

`parser.ts:874` `if (can(n.item)) within('item', { feature: n.feat }, () => run(n.item, o));`
`parser.ts:880` `if (n.feat !== undefined) within('item', { feature: n.feat }, () => run(n.item, o));`
`parser.ts:857-861`
```
const itemFor = <T>(feat: string, fn: () => T): T => {
    const c = cur();
    if ((c.kind === 'item' || c.kind === 'list') && c.feature === feat) return fn();
    return within('item', { feature: feat }, fn);
};
```
Lists become a `ListNode` (:907-919).

Measured (`probe_b2_outline.json`, field `shapes`): every corpus case parses with 0 errors and the printer's tree has the same chains as the parser's (`sameAsParse: true` on all 10 cases). Chains from container to contained object:

| Case | Chain | Count |
|---|---|---|
| demoESM, turnstile plain | `Initial > block > item(transitions, kw transitions) > block > item(transitions) > Transition` | 3 (and 1 from `State`) |
| turnstile annotated (inline) | `Initial > block > item(transitions) > item(transitions) > Transition` | no keyword token, no block |
| library annotated (groupBy) | `Library > block > item(books, kw books) > block > item(books, kw prose\|verse\|nonfiction) > block > item(books) > Book` | also `item(members, kw patrons)` |
| garage (single-valued containment) | `Car > block > item(engine, kw engine) > block > item(engine) > Engine` | |

Single values are not outline nodes; whether their keyword is printed varies: library annotated/lines `Book.genre` no keyword (a literal), turnstile annotated `Transition.event` no keyword (name reference), `nextState` keyword `to`, lines `borrowedBy` keyword `by`.

Rule derived: **a group node is an `item` node that directly holds a `keyword`-role token and contains objects; its label is that keyword as printed** (`transitions`, `patrons`, the subset `prose`). An inline containment prints no keyword, so it has no group node: its objects sit directly under the object, which is what the text shows (R-TXT-39 (1), "follow the structure of the text"). A grouped containment gives two group levels (`books › prose`). The breadcrumb's last segment on a positional single value is the feature name, since the text holds no keyword for it.

Broken text (measured, `probe_b2_broken.json`, demoESM, four mutants): the `{` after `transitions` deleted → the parser repairs it, chain unchanged, `Initial` partial; the closing `}` deleted → same chain, objects `unclosed`; text truncated inside the second Transition → it is `unclosed` and its label falls to the guard value (finding 2). No orphans in these four mutants; the orphan path through error nodes is B1's `unknown container` (`languageService.ts:94`, R-TXT-39 (4)).

### 2. Unnamed objects (measured)

B1's `TextSymbol` covers objects only, with `name` = "the object's name, its class when it has none" (`languageService.ts:47-66`), so today every unnamed Transition would read `Transition`.

Candidates measured over the corpus (`unnamedLabels` in `probe_b2_outline.json`):

- **C1** — class + first printed single-valued attribute or reference with a value.
- **C2** — class + first mandatory feature (lower ≥ 1) with a value.
- **C3** — class + first single-valued reference target.
- **C4** (proposed) — class + first single value that is a *name* (a reference written as a name, or an enum literal); else the first attribute value (strings quoted, cut at 24 characters); else a reference written as a path; else `Class[k]`, with `k` the index the object's path segment prints (within its feature, or among the roots of its class). The feature that gave the value is the secondary text.

#### Label table, every corpus case

Named objects take their name under every candidate; only unnamed objects are listed.

| Case | Objects / unnamed | Class | C1 | C2 | C3 | C4 | C4 feature |
|---|---|---|---|---|---|---|---|
| demoESM | 10 / 7 | Initial | `Initial[0]` | `Initial[0]` | `Initial[0]` | `Initial[0]` | |
| | | Transition | `Transition Initial[0]` | `Transition[0]` | `Transition Initial[0]` | **`Transition coin`** | event |
| | | Transition | `Transition "model.[paid]"` | `Transition[1]` | `Transition State[0]` | **`Transition push`** | event |
| | | Transition | `Transition Terminal[0]` | `Transition[2]` | `Transition Terminal[0]` | **`Transition stop`** | event |
| | | State | `State[0]` | `State[0]` | `State[0]` | `State[0]` | |
| | | Transition | `Transition Initial[0]` | `Transition[0]` | `Transition Initial[0]` | **`Transition push`** | event |
| | | Terminal | `Terminal[0]` | `Terminal[0]` | `Terminal[0]` | `Terminal[0]` | |
| turnstile, plain | 10 / 7 | (as demoESM) | as demoESM | as demoESM | as demoESM | as demoESM | event |
| turnstile, annotated | 10 / 7 | (as demoESM) | as demoESM | as demoESM | as demoESM | as demoESM | `(event)`, positional |
| library, plain | 10 / 0 | — | names | names | names | names | |
| library, annotated | 10 / 0 | — | names | names | names | names | |
| library, lines | 10 / 0 | — | names | names | names | names | |
| garage, c-like | 13 / 2 | Engine | `Engine 90` | `Engine[0]` | `Engine[0]` | `Engine 90` | power |
| | | Engine | `Engine 0` | `Engine[0]` | `Engine[0]` | `Engine 0` | power |
| garage, lower | 13 / 2 | Engine | `engine 90` | `engine[0]` | `engine[0]` | `engine 90` | power |
| | | Engine | `engine 0` | `engine[0]` | `engine[0]` | `engine 0` | power |

Only C4 gives `Transition coin` on demoESM. C1 picks `nextState`, printed first (a path reference); C2 finds no mandatory feature in demoESM (all lower bounds 0), so it falls to `Class[k]`; C3 picks the `nextState` target.

Variants added to exercise the rule (not corpus; every name cleared):

- library: C4 `Book FICTION`, `Book SCIENCE`, `Book POETRY`, `Book HISTORY`, `Book FICTION`, `Book SCIENCE` (feature `genre`), `Member[0..2]`, `Library[0]`; four sibling duplicates (FICTION ×2, SCIENCE ×2).
- garage: C4 reaches the path tier: `Car Car[0]` (tow), `Car Car[0].wheels[1]` (best), `Wheel Car[0].wheels[0].bolts[…` (pair), `Gear Car[1].wheels[0]` (wheel). Readable as a path, poor as a label. **C4'** drops the path tier (names, then attribute values, then `Class[k]`). C4 and C4' coincide on every corpus case, since no corpus object reaches the path tier. The C4' labels of these four objects were not computed in this phase.

Stability (measured):

| Measure | Cases | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|
| Labels changed by model id after a reprint with every containment and the top level reversed | demoESM | 0 | 2 | 0 | **0** |
| | turnstile plain / annotated | 0 | 2 | 0 | **0** |
| | library ×3, garage ×2 | 0 | 0 | 0 | 0 |
| | library names cleared | 2 | 2 | 6 | 2 |
| | garage names cleared | 6 | 8 | 10 | 6 |
| Duplicate labels among siblings | all corpus cases | 0 | 0 | 0 | 0 |
| | library names cleared | 4 | 4 | 2 | 4 |
| | garage names cleared | 0 | 2 | 2 | 0 |

The changes left under C4 on the cleared variants are the `Class[k]` fallbacks, whose `k` is positional by construction. Labels on the printer's tree equal the labels on the parser's tree on all 10 cases. While typing, a label follows the text: in the truncated mutant the second Transition shows its guard until `event` is typed.

### 3. Hover card (read + measured)

#### 3.1 Monaco's own hover cannot stay open through public API

Read, `contentHoverController2.js:25-26`:
```
// sticky hover widget which doesn't disappear on focus out and such
const _sticky = false;
```
A module constant, not an option. The controller hides the hover on scroll (:86-90, `if (e.scrollTopChanged || e.scrollLeftChanged) { this._hideWidgets(); }`), on a mousedown off the widget (:91-98), on the editor's mouse-leave unless the pointer is over the widget (:112-125), and on any non-modifier key (:207-229; Ctrl, Alt, Meta, Shift exempt). `this.shouldKeepOpenOnEditorMouseMoveOrLeave = false;` (:36, read at :113, :148) is a field with no public setter, reachable only through `getContribution`, which is a forcing.

The public options are `hover.sticky` (default `true`, "Controls whether the hover should remain visible when mouse is moved over it.") and `hover.hidingDelay` (default 300, clamped 0..600000), `editorOptions.js:802-846`.

#### 3.2 What works inside Monaco's hover: trusted command links

Read. `markdownRenderer.js:118-123` (editor): `if (isTrusted === true) { return true; // Allow all commands }`, and `isTrusted: { enabledCommands: [...] }` allows a subset. `base/browser/markdownRenderer.js:259`: `|| (/^command:/i.test(href) && !markdown.isTrusted)` → `// drop the link`. `monaco.editor.registerCommand` is public (`monaco.d.ts:1144`).

Measured on a detached 900×300 editor (A) with real mouse and keys (`probe-run4.log`):

- A1 default options: hover on `coin` shows; the trusted link renders as `<a data-href="command:probe.goto?%5B29%5D">`; the untrusted one renders as plain `<p>` text and a click calls nothing. With the pointer inside the hover it stays (checked at 500 and 1500 ms). Click on «Go to definition» → `cmd-goto:29`, cursor to line 29, hover closes. Pointer onto empty text: visible at 150 ms, gone at 600. Click on text: gone. Shift alone: stays. ArrowDown: gone. Scroll one line: gone. Pointer out of the editor: gone. Pointer onto another reference: the `push` hover replaces it at 800 ms.
- A2 `hidingDelay: 600000`: pointer onto empty text → stays at 600, 2000, 4000 ms. Then onto another reference → still `coin` at 800 and 2000 ms: every other hover is blocked, a marker's hover included (`marker:false`). Click on text, pointer out of the editor, ArrowDown, scroll → gone.
- A3 keyboard `editor.action.showHover {focus: true}`: shows with focus on the hover's div; pointer moves do not close it; Tab keeps focus on the div (the links are not reached); Enter runs no command; pointer out of the editor → gone; Escape → gone.

#### 3.3 What works for "stays open": a pinned card as a content widget

Measured (A4, `hover-content-widget.png`): `addContentWidget` with `allowEditorOverflow`, preference BELOW/ABOVE.

- It stays across pointer moves, and Monaco's hover on `push` shows beside it (both visible).
- A click on its button runs the handler: cursor line 6 → 29, and the card follows its line: `top` -879 after the reveal, off screen but **not hidden**. We must hide it ourselves when its line leaves the view, or it can draw outside the editor.
- Scroll two lines: `top` 241 → 203 (follows the text).
- Click on text, typing: the card stays. Closing on those needs our own `onMouseDown` / `onDidChangeModelContent` listeners.
- Enter on its focused button works; Escape, handled by our own keydown, removes it and refocuses the editor.
- Public API only, no forcing.

#### 3.4 Rejected placements, measured

- A5 overlay widget at coordinates (`monaco.d.ts:5400-5418`): does not follow scroll (`top` 241 → 241) unless relaid by hand.
- A6 card outside the editor, where a React card would sit, placed from `getScrolledVisiblePosition` and re-placed on `onDidScrollChange`: follows (241 → 203); a click on it runs the handler, cursor unchanged, and the editor loses focus.

#### 3.5 F12, Shift+F12, context menu on the Text tab's editor

Measured on the Text tab's own editor (B; model language switched to `probe-b2`, providers registered per language, `probe-run5.log`, `tab-*.png`):

- F12 → definition, cursor line 29. Alt+F12 → peek "Definitions (1)". Cmd+click → definition, line 29.
- Context menu: Go to Definition, Go to References, Peek, Change All Occurrences, Cut, Copy, Paste, Command Palette; «Go to Definition» from the menu → line 29.
- Hover with a command link on the tab → `cmd-goto:29`; tab status «Up to date», text unchanged.
- Shift+F12 on `push` (2 uses) → peek "References (3)", 3 rows. **Shift+F12 on `coin` (1 use) → nothing**: the provider is asked with and without the declaration (2, then 1 results), no peek opens, the cursor does not move. Read, `goToCommands.js:116-117`:
  ```
  else if (referenceCount === 1 && altAction) {
      // already at the only result, run alternative
  ```
  The references query is `goToCommands.js:564` (`compact`).
- `getSupportedActions()` right after `setModelLanguage` listed only `showDefinitionPreviewHover`: context keys not yet updated. A timing effect, not a defect.

## Risks

1. Shift+F12 on a reference used once shows nothing, and the user may read it as broken. B1's `referencesAt` must include the declaration; Monaco then peeks only when more than the current spot remains.
2. The pinned card does not hide itself when its line scrolls out of view (measured `top` -879): without our own visibility check it draws outside the editor.
3. A card on a content widget is laid out by Monaco: its own close rules (× , Escape, click on text, edit, line out of view) are ours to write and test; none comes free.
4. Command links need `isTrusted`; `true` allows every command. A subset (`{ enabledCommands: [...] }`) limits the exposure.
5. `Class[k]` labels move on reorder (cleared variants, 2 and 6 changes) and can collide among siblings (library cleared, 4 duplicates).
6. Decisions R-TXT-36..39 live on trunk, not in this branch: a downstream lane reading this tree's `docs/decisions.md` will not find them.
7. Four broken mutants only; orphans through error nodes were not reproduced here.

## Recommended design, one per point

1. **Outline groups.** A group node for every `item` node that holds a `keyword` token directly and contains objects, labelled with the keyword as printed; inline containment shows no group; groupBy shows two levels. Rejected: a group node for every containment feature regardless of the text (the outline would show nodes the text has no line for, against R-TXT-39 (1)); taking groups from the metamodel instead of the tree (a second source of structure, which drifts from the text while typing).
2. **Unnamed labels.** Rule C4': the first single value that is a name (reference by name, enum literal), else the first attribute value (quoted, 24 characters), else `Class[k]`; the feature as secondary text. Rejected: C1 (picks `nextState` on demoESM), C2 (no mandatory feature in demoESM, all `Class[k]`, unstable on reorder), C3 (path targets, the least stable: 6 and 10 changes on cleared variants), C4 with its path tier (unreadable labels on garage cleared).
3. **Hover card.** Monaco's own hover cannot stay open through public API: the sticky switch is a constant in the source (`_sticky = false`). What works is (a) Monaco's hover with trusted command links («Go to definition», one link per line using the reference), transient by Monaco's rules, and (b) a pinned card as a content widget, opened from the hover (a `Pin` command link, or a click on a reference) and closed by our own rules: ×, Escape, click on the text, an edit, its line leaving the view. Public API, follows the text, coexists with Monaco's hover. Rejected: `hidingDelay: 600000` (blocks every other hover, markers included, and still closes on keys, scroll, pointer out); setting `shouldKeepOpenOnEditorMouseMoveOrLeave` (private field, a forcing); an overlay widget (does not follow the text); a page-level React card (manual placement and clipping, takes focus from the editor; viable only if the card must leave the editor's bounds).
4. **Navigation.** Keep B1's providers registered per language; F12, Alt+F12, Cmd+click and the context menu work as measured. Shift+F12 with a single use shows nothing (Monaco's rule); the pinned card's list of lines covers that case.

## Decisions taken (unattended)

1. demoESM was read through the tab's own reader in the app (`probe-export.mjs`, direct calls), since the fixture is compressed.
2. Names-cleared variants of library and garage were added to exercise the label rule; they are labelled as not corpus.
3. The probes on the tab's editor switched its model language for the run and restored it (direct call, no change to the text).
4. The report was written by a continuation lane (P-2026-11-04-0021) from the handoff of P-2026-11-04-0005 (RC-51), with no new measurement; quotes from Monaco and the grammar were re-read for the verbatim citations.

## Decisions awaiting Alfonso

1. Group nodes only where the text prints a keyword (inline containment shows none), two levels for a grouped containment: accept?
2. Label rule C4' (name value, then attribute value, then `Class[k]`), feature as secondary text: accept? And on a sibling collision, a ` [k]` suffix on the colliding labels only?
3. Hover: Monaco's hover with trusted command links, plus a pinned content-widget card for "stays open until closed" — R-TXT-39 (3) reported as not reachable in Monaco's own hover, not forced: accept?
4. Shift+F12 with a single use shows nothing (Monaco's rule): accept it and let the card's list of lines cover the case, or something else?
