# Discovery — textual lane D6: the pinned hover card of R-TXT-42

- Prompt: P-2026-11-08-2330, `docs/prompts/claude_2026-11-08_2330_prompt_textual_d6_pinned_hover.md`, Phase 1
- Session: `a3b194db-77fb-46c3-99df-e0ce76f74b59`
- Tree: `~/jjodel-w-textd6`, branch `textual-d6-pinned-hover`, HEAD `e081cd584`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- Monaco: `monaco-editor` 0.52.2 (`frontend/node_modules/monaco-editor/package.json`)

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

No app run in this phase. **read** = a file read on `e081cd584`. **measured-B2** = measured by P-2026-11-04-0005 on `1f5e99097` and reported in `docs/discovery/discovery_2026-11-04_textual_b2_outline_hover.md`, not measured again here; it is a hypothesis about today's code until Phase 2's app check.

## Objective

Design the card that stays open (R-TXT-42): the content it carries, the explicit action that opens it, the widget, its five close rules, its accessibility, and the Phase 2 plan.

## Hypotheses under test

1. H1 — The card can carry the hover's content without changing the hover. **Holds** (read): `linksOf` is a string builder over the analysis and the model; its data can be split from its Markdown (§1).
2. H2 — Monaco gives a public way to render the hover's Markdown in a widget. **Falsified** (read, §1.3): no such member in the public API.
3. H3 — A one-stroke shortcut exists that collides with nothing. **Holds for Alt+H** (read, §2); the real key dispatch on a Mac is for Phase 2 to confirm.
4. H4 — The card needs `allowEditorOverflow`, as B2's A4 used it. **Falsified** (read, §3.2): without it Monaco itself clamps the card inside the viewport, which is what scene 6 asks.
5. H5 — Every close rule is reachable through public API. **Holds** (read, §4).
6. H6 — Reprint, style switch and tab switch need no logic of their own. **Partly** (read, §4.2): a reprint and a style switch that changes the text fall under the edit rule; a notation change that leaves the text alone needs one line, and a zero-size editor needs a guard.
7. H7 — Card events can be handled with React props, as in the rest of the tab. **Falsified for keydown and wheel** (reasoned from the DOM order, §5.2): the portal's native event reaches Monaco's listener before React's root listener.

## Files read

Whole: `frontend/src/constants/shortcuts.ts`, `frontend/src/utils/keyboardShortcuts.ts`.

Windows only (nothing below is a count over a whole file unless it says so):

- `frontend/src/codegen/textual/ui/textualMonaco.ts`: 1-60, 120-408
- `frontend/src/codegen/textual/ui/TextualTab.tsx`: 884-913, 1048-1074, 1505-1536, 1935-2004
- `frontend/src/codegen/textual/ui/TextualTab.scss`: 308-322; grep over the whole file for tokens and for card, popover, shadow, z-index
- `frontend/src/codegen/textual/languageService.ts`: 148-161, 283-318, 379-404, 405-496
- `frontend/src/components/GlobalSearch/GlobalSearch.tsx`: 12-33
- `frontend/src/components/common/MarkdownRenderer.tsx`: imports only
- `docs/discovery/discovery_2026-11-04_textual_b2_outline_hover.md`: 1-10, 151-178, grep for hover
- Monaco, under `frontend/node_modules/monaco-editor/esm/vs/`: `editor/browser/viewParts/contentWidgets/contentWidgets.js` 16, 205-274, 316-375; `editor/browser/controller/mouseHandler.js` 80-108; `editor/editor.api.d.ts` 5346-5353 and greps; `editor/contrib/find/browser/findModel.js` 38-41; `editor/contrib/find/browser/findController.js` 793-798, 972-980
- `~/.jjodel-lanes/P-2026-11-07-1622/common.mjs`: 1-30

## Findings

### 1. What the hover shows, and what the card must carry

#### 1.1 Where it is built (read)

`textualMonaco.ts:282-291`, the only `registerHoverProvider` in `frontend/src` (`grep -rln`, one file; the file is its own control):

```ts
const links = linksOf(model, r.analysis, offset).map(value => ({ value, isTrusted: trusted }));
return { range: rangeOf(model, h), contents: [...h.contents.map(value => ({ value })), ...links] };
```

The paragraphs come from `languageService.ts:445` `hoverAt`, the links from `textualMonaco.ts:263-281` `linksOf`.

#### 1.2 Content per kind (read, `languageService.ts:445-475`)

| Hovered token | Branch | Paragraphs | Links (`linksOf`) |
|---|---|---|---|
| Object, its type or name | `case 'type': case 'name'` → `objectHover` (:437-443) | `**name** : `cls``, class line with supers, doc, `in `feature` of `parent``, recovered state | «Used on N lines» when its token role is `name` or `class` (`targetAt`, :401). No «Go to definition»: `definitionAt` reads `i?.ref?.ref?.to` (:486) |
| Reference | `if (i.ref)` (:450-463) | `names **X** : `cls`, line N` (or the outside, or nothing, variants), then `featureHover` | «Go to definition · line N», then «Used on N lines» |
| Literal | `case 'literal'` → `literalHover` (:151-155) | `lit : enumeration E`, `literals …`, its doc, the enumeration's doc | none |
| Keyword | `default` (:473) | `featureHover` of its item; **no hover** when the token is in no item | none |
| JjEL island | `default` (:473) | `featureHover` of the attribute holding the expression: the island's own tokens go to `tokens` only (:300-318), `infos` holds the one string token (:288) | none |

The card carries the same `contents` and the same links. Its uses cap at the hover's `HOVER_USE_LINES` (12), with the same «and N more lines» (`textualMonaco.ts:37, 278`).

#### 1.3 Rendering the Markdown (read)

The paragraphs are Markdown (`code()` :148, `**…**`) and free doc text.

- No public renderer: `grep -c -i` for `renderMarkdown` and for `MarkdownRenderer` over `editor/editor.api.d.ts` print 0, exit 1; control `IMarkdownString` prints 11, exit 0. Importing Monaco's `markdownRenderer.js` by path would be an internal, which R-TXT-42 rules out.
- `components/common/MarkdownRenderer.tsx:11-16` imports `jjscript` and `Jodie` cards: too heavy, and not meant for this.
- `react-markdown` is already a dependency (`frontend/package.json:60`) and used by `components/ExplainModal.tsx`, `components/HelpDrawer.tsx`. It renders no raw HTML by default, as the hover does without `supportHtml`.

**Design**: one `<ReactMarkdown>` per paragraph, and links as `<button>`s from structured data, not from Markdown: `react-markdown`'s default URL filter would need bypassing for `command:`, and a button is reachable by Tab, which the hover's links are not (measured-B2, A3: «Tab keeps focus on the div (the links are not reached)»).

#### 1.4 A pure part (read)

`linksOf` mixes data and Markdown. Split it into a pure module, `frontend/src/codegen/textual/hoverCard.ts`: the data (`definition`, `uses`, `more`) from the analysis and a line reader, the Markdown rebuilt from that data. A characterization test written first pins today's strings, truncation at 40 (`text.slice(0, 39)` + `…`) and backtick replacement included. That is what keeps «no change to the hover's existing content» checkable.

### 2. The explicit action

**The link.** `[Pin](command:jjodel.textual.pin?…)`, last paragraph of the hover, same trusted mechanism: `enabledCommands` gains the one id (`textualMonaco.ts:260`). The command finds the editor by URI as the reveal does (:252) and calls the handler registered for that editor. Measured-B2 A1: a click on a trusted link closes the hover, which suits it.

**The shortcut: Alt+H, ⌥H on the Mac**, pinning at the caret; no hover at the caret, no card and no message. Registered with `editor.addAction` (`keybindingContext: 'editorTextFocus'`), so F1 lists it. The label comes from the existing `formatShortcut` (`utils/keyboardShortcuts.ts:91`).

Collision search (read):

| Where | Search | Result | Control |
|---|---|---|---|
| Monaco defaults | `/\* KeyCode\.KeyH \*/` over `editor`, `platform` compiled sources | Ctrl+H, replace, Windows and Linux (`findController.js:795`); a Mac delete-left secondary (`coreCommands.js:1620`). **No Alt+H** | same form for `KeyP` finds `Alt+P`, `findModel.js:39` |
| Text tab's bindings | grep `addCommand`, `addAction`, `addKeybinding` in `textualMonaco.ts`, `TextualTab.tsx` (`-m 20`) | Cmd+Z only (`TextualTab.tsx:1963, 2374`). Format, rename and quick fix are Monaco's defaults, covered above | the same grep found `registerCommand` |
| App registries | read whole: `constants/shortcuts.ts`, `utils/keyboardShortcuts.ts` | no H entry | — |
| App listeners | `.key === 'h'/'H'`, `.code === 'KeyH'`, `key: 'H'` over `frontend/src`; `keyCode === 72`, `KeyCode.KeyH`, `altKey…H` | no line, the second exit 1 | same form for `k`: 3 lines; `KeyCode.Key[A-Z]`: 4 lines, exit 0 |

Rejected: Alt+P (preserve case, `findModel.js:39`); Cmd+Alt+P (the same, Mac, :40); Alt+Enter (select all matches while find is open, `findController.js:977`); Cmd+P (the browser's print). Cmd+K Cmd+P is free in Monaco's chords, and the `document` listener for Cmd+K in `GlobalSearch.tsx:18` is not mounted (`grep -rln GlobalSearch` lists only its own files): valid, but two strokes (question 2).

### 3. The widget

#### 3.1 Shape

An `IContentWidget`, one per editor. A second pin replaces its content and position (same id, one `layoutContentWidget`). Anchored at the start of the hovered token (`h.start`, the same anchor for any pointer offset in the token), preference `[ABOVE, BELOW]`, where Monaco's own hover goes, so a pin does not jump. **No layout shift**: the node is absolute (`contentWidgets.js:16`, `this.domNode.setPosition('absolute')`), no view zone, no editor option changes.

#### 3.2 Near the edges (read)

**No `allowEditorOverflow`.** Without it Monaco calls `_layoutBoxInViewport` (`contentWidgets.js:346-351`), which clamps `left`:

```js
if (left + width > ctx.scrollLeft + ctx.viewportWidth) {
    left = ctx.scrollLeft + ctx.viewportWidth - width;
}
```

With it, `_layoutBoxInPage` allows the card past the editor's box, where the dock's ancestors can clip it. The clamp does not cover a card larger than the viewport, so the card's size is limited by a pure function on the layout:

- `maxWidth = min(480, contentWidth)`;
- `maxHeight = min(320, max(96, floor((height - lineHeight) / 2)))`: for any anchor line in the viewport, above or below offers at least `(height - lineHeight) / 2`, so `fitsAbove` or `fitsBelow` is true (:214, :216) at that height. The 96 floor gives that up on an editor under about 210 px, where the card scrolls and may clip.

Overflow scrolls inside the card. Recomputed on `onDidLayoutChange`.

**Trap, read at `contentWidgets.js:328-343`**: Monaco caches the node's size on the first render. A React portal fills the node after `addContentWidget`, so the cache would hold the empty box and the clamp would use width 0. `layoutContentWidget` goes in a `useLayoutEffect` after every content or limit change.

#### 3.3 Styling (read)

All existing tokens, under `.textual-tab` as the new `&__pinned` block: `--color-bg-primary`, `--color-border-primary`, `--color-text-primary/secondary/tertiary`, `--font-mono`, `--radius-button`, `--shadow-md` (`styles/tokens/_shadows.scss:16`), and `2px solid var(--color-canvas-accent)` for focus, as at `TextualTab.scss:131`. No new colour, no dark block (D-UI-15). Identifiers are free: `PinnedHoverCard`, `TEXTUAL_PIN_COMMAND`, `textual-tab__pinned`, `&__pinned`, `hoverCard.ts`, `cardLineInView` over `frontend/src`, exit 1; control `TEXTUAL_REVEAL_COMMAND` exit 0.

### 4. Close rules

#### 4.1 The five of R-TXT-42

All public (`editor.api.d.ts:5840-5860, 6032`).

| Rule | Detection | Note |
|---|---|---|
| × | the button's click | focus to the editor |
| Escape, focus in the text | `editor.onKeyDown`, `KeyCode.Escape` | closes without consuming: not a keybinding, so an open suggest list or rename box gets its own Escape on the same key |
| Escape, focus in the card | native `keydown` on the card, `stopPropagation` | focus to the editor (measured-B2, A4) |
| A click on the text | `editor.onMouseDown`, `target.type` `CONTENT_TEXT` or `CONTENT_EMPTY` | gutter, scrollbar and widgets do not close it; a click inside the card is not on the text |
| An edit | `editor.onDidChangeModelContent`, any | typing, format, rename, undo, reprint |
| Its line out of view | `onDidScrollChange`, `onDidLayoutChange`, `onDidChangeHiddenAreas`, then `getVisibleRanges` | a fold counts. Pure `cardLineInView(line, ranges, height)`. Measured-B2, A4: Monaco does not hide it itself, «`top` -879 … off screen but **not hidden**» |

#### 4.2 The cases around them (read)

- **Reprint (E1)**: `editor.setValue` at `TextualTab.tsx:1530`, a content change, so the edit rule closes it. When the text is equal there is no `setValue`, the card stays and is still true of the text.
- **Style switch**: `onStyle` (:1982) writes the syntax, the text changes, the effect at :1935 reprints: edit rule. With `action === 'keep'` (:1936) the text stays and the card with it.
- **Notation change with the same text**: `useEffect` at :1944 parses again. A card would speak for the old notation, so the card takes `view.ebnf` as a prop and closes when it changes.
- **Text/EBNF/Syntax toggle, dock tab switch**: both hide by `visibility` (`TextualTab.scss:315-317`; comment at `TextualTab.tsx:1732`, «rc-dock's inactive tab, kept mounted but hidden (measured)»). The card hides with them and is back on return.
- **A zero-size editor** (a hidden dock panel): `@monaco-editor/react` creates the editor with `automaticLayout:!0` (`dist/index.mjs`), so a layout event fires with height 0. `cardLineInView` gives no verdict at height 0, or a hidden panel would close the card.
- **Dispose**: the listeners die with the editor; the component's unmount removes the widget.

**A command link in the card** (scene 3): **the card stays**, the caret moves by the existing reveal, focus to the editor (`textualMonaco.ts:256-258`), so the list of uses can be walked. If the reveal scrolls the card's line out, rule 5 closes it, with no special case (question 3).

The links call a shared `reveal` function, the command's body extracted, so the Monaco command and the card run one path.

### 5. Accessibility and events

#### 5.1 Focus (design; B2's A4 measured Enter and Escape on a focused button)

- Root `role="dialog"`, `aria-label`, `tabindex="-1"`, not modal. On open, focus to the root: the content is read, and Enter cannot fire a link by accident.
- Tab and Shift+Tab walk the links and the × and **wrap inside the card**: past the card, Tab reaches the editor's textarea and would insert an indent, which is an edit.
- Any close while focus is inside the card returns it to the editor.
- No blur handling to mind: `onDidBlurEditor` has 0 lines in `TextualTab.tsx` (exit 1; control `onDidFocusEditorText` 2, exit 0).

#### 5.2 Native listeners (reasoned)

The portal's node sits inside Monaco's DOM. A native event bubbles through Monaco's listeners on its way to React's root listener, so `e.stopPropagation()` in a React prop comes too late. Escape, Tab and wheel use native listeners on the card's root, in an effect. `mouseHandler.js:80-108` only shows the zoom wheel; the scroll path was not read, so the wheel inside a scrolling card is a Phase 2 check.

### 6. Phase 2 plan

Six files, so CLAUDE.md rule 19 applies: the GO is the confirmation.

| File | Change |
|---|---|
| `frontend/src/codegen/textual/hoverCard.ts` (new) | pure: card data, its Markdown, `cardLineInView`, `cardLimits`; `import type` only |
| `frontend/src/codegen/textual/__tests__/hoverCard.test.ts` (new) | tests first |
| `ui/textualMonaco.ts` | `linksOf` over the pure module, Pin link, `TEXTUAL_PIN_COMMAND`, shared `reveal`, card data and pin-handler exports |
| `ui/PinnedHoverCard.tsx` (new) | widget, portal, close rules, shortcut |
| `ui/TextualTab.tsx` | mounts it beside `TextNavigator`, from `nav.editor` |
| `ui/TextualTab.scss` | `&__pinned` |

Docs after the check, uncommitted (RC-17): `docs/log-inbox/codegen.md`, the prompt's Status.

**Tests (red first, node)**: the hover's links byte-equal to today's on one reference with more than 12 use lines, with a long and a backticked line; no links on a literal; `cardLineInView` in, out, in a second range around a fold, height 0; `cardLimits` on large, narrow and very short layouts. Mutation bench on those (drop the height-0 guard, the 12 cap, the fold range, the half-height).

**App check**, free port, crops in `~/.jjodel-lanes/P-2026-11-08-2330/`, from `~/.jjodel-lanes/P-2026-11-07-1622/{common,probe}.mjs` (its Playwright import and fixture paths point at `~/jjodel-w-textf1d`: repoint them): the six scenes of the prompt, plus Alt+H pinning at the caret, Tab wrapping, the wheel inside a scrolling card, and `visibility` return from the EBNF toggle.

## Dependencies and risks

1. The bench imports `TextualTab.tsx`'s pure functions. A static import of `react-markdown` through the card must not break it. If it does, the card loads with the same dynamic import as `textualMonaco.ts`.
2. Alt+H on a Mac is read, not run. If the dispatch types a character instead, scene 2 shows it and the chord is the fallback.
3. Monaco's own hover can draw over or beside the card (measured-B2, A4, both visible): accepted.
4. A reprint from the canvas closes a card the user did not touch: what R-TXT-42 says, noted so it is not reported as a bug.
5. `react-markdown` and Monaco's renderer can differ on unusual Markdown in a doc text. Paragraphs of inline Markdown render alike.

## Open questions

1. Render the paragraphs with `react-markdown` in a portal, links as buttons?
   Recommended: yes, an existing dependency with the hover's fidelity on doc text.
2. Alt+H as the shortcut?
   Recommended: yes, one stroke and free; Cmd+K Cmd+P only if the app check fails it.
3. After a command link, keep the card, closing only if its line leaves the view?
   Recommended: yes, the list of uses can be walked and R-TXT-42's fifth rule covers the rest.
4. Add a context-menu entry for Pin?
   Recommended: no, R-TXT-42 asks for a link or a shortcut and the prompt for both.
