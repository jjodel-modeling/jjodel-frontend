# Views lane: four minor defects left by the 15-16 September round

Prompt-ID: P-2026-09-18-1650
Chat: C-2026-09-18-1650
Status: eseguito 2026-09-18 · lane views · faa893a77
Date: 2026-09-18 16:50 (Europe/Rome)
Type: fix (four independent items, one code commit each)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: high (item D at xhigh: it has a discovery phase)
Lane: views. Log entries go in `docs/log-inbox/views.md`, never in the active log.

## Contesto

The view-creation round of 15-16 September (`docs/sessioni/sessione_2026-09-16.md`, section
"Bug nuovi e todo") left four defects measured but not fixed, none of them on the creation path
itself. They are independent of one another and of the two lanes running in the same tree today:
`ScriptBlock.tsx` (JjScript lane L3, session on `P-2026-09-17-1024`) and
`docs/mde-intelligence-2026/` (paper). Neither is yours. The Symbol Editor 1b round is closed
(`4f07114f5`), so `VertexAuthoringPanel.tsx` is no longer under exclusive ownership.

Every path and line below was re-read on 2026-09-18 at `5c4db90b1`. Rule 15 still applies:
grep before editing, and a cited line that has moved is not a reason to stop, a cited
identifier that does not exist is.

Order of execution: A, B, C, D. A and B are one-line fixes and go first; C is a small
behavioural change; D is two-phase with its own discovery report. HARD STOP after each code
commit for Alfonso's visual check on http://localhost:3000/, stated as what to look at, not as
its result. After his ACK, the docs commit for that item (inbox entry, and for D the report),
then the next item.

## Item A: `closefunc is not a function` at the tail of the classic creators

**COSA.** `key_bindings.close = new KeyBind(()=>closefunc(), [Keystrokes.escape])`
(`ContextMenu.tsx:669`) calls a module-level `closefunc` that is `null as any` until the
classic popup renders (`:239`, assigned only at `:300`). `addViewSelf` (`:621`),
`addViewInstances` (`:631`) and `addViewToWorkbench` (`:642`) end with
`key_bindings.close.function()`, so any caller outside the popup creates the view and then
throws. Measured in `docs/discovery/discovery_2026-09-16_rotta_archi_righe.md` §3.

**DOVE.** `frontend/src/components/contextMenu/ContextMenu.tsx`, line 669 only.

**COME.** Guard the call: `()=>closefunc?.()`. No other change. Do not touch `key_bindings`,
the three creators, or the `let closefunc` declaration (the tracker census for a deliberate
removal is a separate decision, not this lane's).

**Test.** None executable: the module imports through `joiner` and does not load under vitest
(`window is not defined`). State it in the entry. No source-text test (§5 sub-rule).

**Visual check for Alfonso.** Escape on an open v2 canvas with no popup: no error in the console.
Then the classic path if reachable: none is today (the popup does not open, same report §1), so
the check is the console alone.

## Item B: `.dialog-header { display: none }` hides the header of every dialog

**COSA.** `frontend/src/components/alert/style.scss:112-114`:
```scss
// Legacy header support - hide the large icon
.alert-header, .dialog-header {
  display: none; // Remove the large icon with halo
}
```
The selector is global. `.alert-header` has zero consumers in `frontend/src` (measured
2026-09-18: `grep -rn 'alert-header' --include=*.tsx` returns nothing). `.dialog-header` has
five: `NewViewDialog.tsx:96`, `NewViewpointDialog.tsx:88`, `NewTransformationDialog.tsx:233`,
`ExecuteTransformationDialog.tsx:197`, `CreateProjectDialog.tsx:99`, each rendering an icon
block that this rule removes. `CreateProjectDialog` has its own `.dialog-header` rules at
`create-project-dialog.scss:85` and `:554`, which this global rule overrides by source order
or specificity depending on the build.

**DOVE.** `frontend/src/components/alert/style.scss`, the one selector.

**COME.** Remove `.dialog-header` from the selector, leaving `.alert-header { display: none; }`
and the comment as they are. Nothing else in that file. Do not add rules to the five dialogs:
if one of them looks wrong with its header back, that is a finding for its own scss, reported at
the hard stop and not fixed here.

**Test.** None (style only).

**Visual check for Alfonso.** Open each of the five dialogs (New View from the `+` on a
viewpoint, New Viewpoint, New Transformation, Execute Transformation, Create Project): the header
with its icon is visible, once, and the title is not duplicated. The alert toasts (success and
error) are unchanged.

## Item C: switching the wildcard off commits `metaclasses: []` and blanks the viewpoint

**COSA.** In `MatchingSection.tsx:111-112`, `setWildcard(false)` writes `metaclasses: []`. That
shape passes `validateIR` (probe G1 of
`docs/discovery/discovery_2026-09-15_plus_view_ir_seed.md` §5), so the debounced commit of the
host panel writes it after 300 ms (`VertexAuthoringPanel.tsx`, `COMMIT_DEBOUNCE_MS = 300`;
`EdgeAuthoringPanel.tsx:53,188-193` and `RowAuthoringPanel.tsx:46,90-93` have the same shape).
With `[]` the view enters `viewIds` (`irResolveCore.ts:249`) and matches nothing; on a viewpoint
whose only IR view is this one every object becomes a neutral node until a metaclass is picked
(probe G2). Since the `+` seeds every blank view as a wildcard, this is now the first thing an
author does.

**Decision (taken in chat, do not reopen).** An empty metaclass list is not a matching, it is an
unfinished edit. It stays in the draft and is never committed: the stored ir keeps its previous
`metaclasses` until the list has at least one name. The section says so.

**DOVE.** `MatchingSection.tsx` (a hint line), and the commit gate of the three host panels:
`VertexAuthoringPanel.tsx`, `EdgeAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`. Plus one pure
helper and its test, see COME. That is up to six files: rule 19 applies, list them with the
change in each at the hard stop before writing, even though the list is already here.

**COME.**
1. One pure predicate, `isCommittableMatching(ir): boolean`, false exactly when
   `Array.isArray(ir.metaclasses) && ir.metaclasses.length === 0`, true otherwise (wildcard
   string, non-empty list, or a kind that has no `metaclasses`). Put it next to the debounce
   code's existing helpers; grep the name first (rule "verify names before creating").
2. In each of the three panels, the debounced commit skips when the predicate is false. The draft
   keeps the `[]`, the error line stays empty (this is not a validation error), `dirtyRef` stays
   as the panel already handles an uncommitted draft. Nothing else in the commit path changes. If
   a panel's unmount flush would write the draft, it also consults the predicate.
3. In `MatchingSection`, when `!isWildcard && list.length === 0`, render one `HelpText`:
   "Pick at least one metaclass. Until then the view keeps its previous matching." Use the
   existing `HelpText` component and no new class name.
4. Test the predicate (five cases: `'*'`, `[]`, `['A']`, `undefined`, an edge ir without the
   field). Mutation bench: invert the empty-array branch, at least one test red, counts in the
   commit message.

**Visual check for Alfonso.** Blank view from the `+`, Applies to tab, switch "All metaclasses
(*)" off: the canvas does NOT go neutral, the hint appears; pick a metaclass: the hint goes,
the canvas narrows to that class within the debounce. Switch the wildcard back on with an empty
list: still nothing neutral. Same on an edge view's Matching section.

## Item D: the inline rename input never receives focus (two-phase)

**COSA.** After creating a view from the tree (`TreeViewContent.tsx:1963` via
`createViewInWorkbench`, `:1975` via `createBlankViewInViewpoint`), `startRenameView(...)` sets
`renamingViewId` and the `useEffect` at `:2265-2270` calls `renameInputRef.current.focus()` on
`[renamingViewId]`. Measured on screen on 2026-09-16: the input renders but is not focused, so
the user has to click into it, and a blur-to-submit gesture designed around an auto-focused
field is half a gesture. The comment at `:1971-1974` claims React 18 batching makes the
`<SubViewItem>` mount in the same commit; the screen says the ref is still null when the effect
runs, or that something steals the focus afterwards. Which one is Fase 1's question.

**Fase 1, read-only.** Measure, with an instrumented run on localhost (temporary `console.log`,
removed before any commit):
1. Is `renameInputRef.current` null when the effect fires? Log it inside the effect.
2. Does the input mount in a later render (Redux propagation of the new view's D element
   arriving after the setState)? Log mount in the `SubViewItem` that renders the input.
3. If the focus IS applied, who takes it afterwards? `document.activeElement` 0, 50 and 300 ms
   after the effect, and the tree's own click handlers (`:1758-1766` guard on `isRenaming`).
4. Is the behaviour the same on both creation paths (`:1963` and `:1975`)?

Report in `docs/discovery/discovery_2026-09-18_rename_input_focus.md`: objective, files read
with paths, the four measurements with numbers, the fix you propose and what it costs, open
questions. HARD STOP. The fix is chosen in chat.

**Fase 2 (after GO).** Expected shape, to be confirmed by Fase 1: focus from the input's own
mount (a callback ref, or an effect inside `SubViewItem` keyed on `isRenaming`) instead of the
parent effect keyed on `renamingViewId`. `TreeViewContent.tsx` only. No test executable under
vitest for this file; say so in the entry.

**Visual check for Alfonso.** `+` on a viewpoint: the new view's name is selected in the input,
typing replaces it, Enter commits, Esc on the first rename deletes the view (existing behaviour,
`cancelRenameView`). Same from the class context menu path.

## Item E (docs only, may ride with D's docs commit)

`ObjectNode.tsx:108-110` says that with "a wildcard" viewpoint the object keeps rendering in full.
Since `computeCreationSeed` seeds `'*'` and `irResolveCore.ts:72` documents the wildcard as the
minimal-specificity default view, a wildcard IR view DOES render the object, through the IR
default object. Rewrite the three comment lines to say what the resolver does; no code change.
State the exact new text at the hard stop before D's docs commit.

## Discipline

- Assert the branch (`git rev-parse --abbrev-ref HEAD` = `validation-skeleton`) before writing.
- Stage your own files one by one; commit with the pathspec; check `git diff --cached
  --name-only` against each item's DOVE before every commit. `ScriptBlock.tsx`, the jjscript
  tests and `docs/mde-intelligence-2026/` are other lanes' and stay out even if they are modified.
- Code and docs in separate commits. One inbox entry per item in `docs/log-inbox/views.md`,
  strict §21.2 format, `Corregge: —` (these defects were found, not caused, by the previous
  prompts; say so in Notes), `Regressions: unknown` until Alfonso's ACK flips it.
- Gates per code commit: `npm run typecheck` at baseline 33 with 0 in touched files (positive
  control named), `npx vitest run` with new tests counted separately from other lanes, `npm run
  build` exit 0. Every reply on this prompt opens with `[P-2026-09-18-1650 · session <id>]`.
- Commit messages, one line each:
  A `fix(context-menu): guard the Escape close binding when no popup is open`
  B `fix(alert): stop hiding every dialog header from the alert stylesheet`
  C `fix(ir-authoring): an empty metaclass list is a draft, never a commit`
  D `fix(tree-view): focus the inline rename input when it mounts`
  docs `docs: log entry for <item>` (and `docs: discovery on the rename input focus` for D).
- In the last docs commit, replace the `Status: da eseguire` line of this prompt with
  `Status: eseguito 2026-09-18 · lane views · <sha of D>`.

## RIFERIMENTI

- `docs/sessioni/sessione_2026-09-16.md`, "Bug nuovi e todo".
- `docs/discovery/discovery_2026-09-15_plus_view_ir_seed.md` §5 (probes G1-G5), §6 R4-R5.
- `docs/discovery/discovery_2026-09-16_rotta_archi_righe.md` §3 (`key_bindings`, `closefunc`).
- `docs/decisions.md` R-IRN-4 (a blank view may stay wildcard and narrow later).
- `CLAUDE.md` rules 1, 2, 15, 17, 19; §5 sub-rules on source-text tests and positive controls;
  §6.4 (lanes on a shared tree); §21.2 entry format.
