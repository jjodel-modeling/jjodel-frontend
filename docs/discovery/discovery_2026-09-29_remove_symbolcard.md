# Discovery — remove the dead SymbolCard component and its styles

- Prompt-ID: P-2026-09-29-1929 (`docs/prompts/claude_2026-09-29_1929_prompt_remove_symbolcard.md`)
- Chat: C-2026-09-29-1826
- Tree: `~/jjodel-w-symcard`, branch `symbolcard-cleanup`, HEAD `2f9ca408c`
- Executor: claude-opus-5-5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

## 1. Goal

Before deleting `SymbolCard.tsx`, `SymbolCard.scss` and the SymbolCard block of `railSystem.scss`, prove that nothing outside those files uses the component or any of its CSS classes (prompt step 1: a user outside the files → STOP).

## 2. Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | `SymbolCard` has no importer after P-2026-09-29-1826 | **Holds** (§4.1) |
| H2 | No class defined in `SymbolCard.scss` is used outside the files to delete | **Holds** (§4.2) |
| H3 | No class of the `railSystem.scss` block is used outside the files to delete | **Holds** (§4.2) |
| H4 | The only SymbolCard rules in `railSystem.scss` are the block at 326-354 cited by the prompt | **Partly.** The block is 326-348 on this HEAD; a second selector sits at `:52`, and the header comment at `:26` names the card (§4.3) |
| H5 | The dependencies of `SymbolCard.tsx` keep other users once it goes | **Holds** (§4.4) |

## 3. Files read

- `/Users/alfonso/jjodel-w-symcard/frontend/src/components/editor-v2/viewpoint/authoring/SymbolCard.tsx` (whole, 80 lines)
- `/Users/alfonso/jjodel-w-symcard/frontend/src/components/editor-v2/viewpoint/authoring/SymbolCard.scss` (whole, 88 lines)
- `/Users/alfonso/jjodel-w-symcard/frontend/src/components/editors/railSystem.scss` (lines 1-60 and 300-359 of 359)
- `/Users/alfonso/jjodel-w-symcard/frontend/src/components/editors/views/ViewData.tsx` (lines 100-115)
- `/Users/alfonso/jjodel-w-symcard/docs/discovery/discovery_2026-09-29_symbol_tab_opens_modal.md` (grep hits, §4.2 and §7 R3)

## 4. Findings

All searches **measured** on HEAD `2f9ca408c` with `command grep` (BSD grep, bypassing the `ugrep --ignore-files` shell function; `type grep` confirms the wrapper), exit status 0 where hits were returned.

### 4.1 Importers of `SymbolCard`

Search: `command grep -rn "SymbolCard" --include='*.ts' --include='*.tsx' --include='*.scss' --include='*.css' frontend/src frontend/scripts`. Hits, all in the files to delete except two in `railSystem.scss`:

- `SymbolCard.tsx:18` — `import './SymbolCard.scss';` (its own stylesheet; positive control)
- `SymbolCard.tsx:20,27,80` — the props interface, the component, the default export
- `SymbolCard.scss:1` — header comment
- `railSystem.scss:26` — comment: `` `ir-tab-body` dei tre pannelli di authoring, la `SymbolCard` (che tab body non è, ``
- `railSystem.scss:326` — comment: `/* ── SymbolCard ─────…`

No `import` of `SymbolCard` outside its own file. `ViewData.tsx`, its only importer before P-2026-09-29-1826 (report of that lane, §4.2, `ViewData.tsx:30`), now opens the modal directly, `ViewData.tsx:108-110`:

```
    const openSymbolEditor = () => window.dispatchEvent(
        new CustomEvent(JjodelEvents.SYMBOL_EDITOR_OPEN, { detail: { viewId: view.id } })
    );
```

Repo-wide (`command grep -rln "SymbolCard\|symbol-card" --exclude-dir=node_modules --exclude-dir=.git .`): beyond the three code files, only documents under `docs/` (handoff specs, discovery reports, session notes, prompts, log archive and inbox). Historical text, not users.

### 4.2 Users of the CSS classes

Classes defined in `SymbolCard.scss`: `symbol-card`, `__row`, `__thumb`, `__meta`, `__name`, `__sub`, `__axis`, `__axis-value`, `__swatch`, `__hex`, `__launch`. Classes of the `railSystem.scss` block: `symbol-card__axis`, `symbol-card__swatch`.

Search, one per class: `command grep -rn -- "<class>" frontend/src frontend/scripts`. Every hit is in `SymbolCard.tsx:42-69` (the JSX that sets them) or in `railSystem.scss` (`:52`, `:332`, `:343`). Positive control: `symbol-card__axis` returns 3 hits (`SymbolCard.tsx:59`, `:61`, `railSystem.scss:332`). The BEM-suffix sweep (`__row`, `__thumb`, `__axis-value`, `__launch`) returns only other blocks' `&__…` nestings (`instanceManagerTab.scss`, `StructureGroups.scss`, `account.scss`, …), none under `.symbol-card`. No test pins any of these classes (the same searches cover `__tests__/`).

### 4.3 The SymbolCard rules in `railSystem.scss`

On this HEAD the block cited as 326-354 runs **326-348**: the comment (`:326-331`), `.symbol-card__axis` with its `> .jj-field-label` (`:332-341`) and `.symbol-card__swatch` (`:343-348`). `:349` is the `}` closing the rail scope; `:351-355` is the comment of the dark-theme block, which is not SymbolCard's.

Outside that range, two more mentions:

- `railSystem.scss:51-54`, a two-selector list of which the second names the card:
  ```
      > section.properties-tab.properties-panel,
      > section.properties-tab.properties-panel.symbol-card {
          background-color: var(--color-form-surface) !important;
      }
  ```
  A style for the card, not a user of it: once the card is gone the second selector matches nothing, and the first selector already covers the same elements with the same declaration.
- `railSystem.scss:26`, the file's header comment listing the card among what the system reaches.

Both are outside the range the prompt authorises (`remove only those rules`; `no refactor of neighbouring rules`). Left untouched; see Q1.

### 4.4 Dependencies of `SymbolCard.tsx`

Each keeps users after the deletion (**measured**, `command grep -rln`):

- `recognizeSymbol` / `SymbolPreview` — `SymbolEditorModal.tsx`, `SymbolCatalogPicker.tsx`, `SymbolBoxPreview.tsx`, `VertexAuthoringPanel.tsx`, `symbolRecognition.test.ts`, `viewpointDerivation.test.ts`.
- `JjodelEvents.SYMBOL_EDITOR_OPEN` — `ViewData.tsx:109` (dispatcher), `SymbolEditorModal.tsx:219-220` (listener), `registry.ts:92`.

Nothing becomes dead in turn.

## 5. Dependencies and risks

- No behaviour change expected: the component is not mounted, so its styles paint nothing today. The visual smoke checks the Symbol tab and the rail tab bars against the P-2026-09-29-1826 measures anyway.
- `railSystem.scss` is imported in `properties-with-tree-view`; removing a block inside the rail scope leaves the scope and the dark block intact.

## 6. Open questions

1. Remove the dead selector `> section.properties-tab.properties-panel.symbol-card` (`railSystem.scss:52`) and the SymbolCard mention in the header comment (`:26`), outside the authorised range, in a follow-up?
