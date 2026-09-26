# Prompt: the Properties rail shows the metamodel, not its package, when nothing is selected

Prompt-ID: P-2026-09-27-0110
Chat: C-2026-09-27-0110
Lane: fast (one code file, one docs closure; visual check by the chat on 3001)
Status: eseguito 2026-09-27 · lane properties-rail · cc2550779 · verifica visiva passata 2026-09-27 (chat, localhost:3001, quattro controlli dal DOM)

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, launched by the chat with `lane-run start`
(a new session, so `/clear` is implicit). Before anything else: `pwd` is `/Users/alfonso/jjodel-release`,
branch `alfonso-frontend-jjtl`, `git log -1` is the commit that adds this file (subject
`docs: add prompt P-2026-09-27-0110, properties rail shows model`), `git status` empty. Otherwise stop
with `Outcome: blocked`. The dev server of this worktree is already up on `localhost:3001` (Vite HMR):
do not start another one.

Read `CLAUDE.md`, then `docs/PROTOCOL.md` P9, P13 and P16. Every reply of this session opens with
`[P-2026-09-27-0110 · session <id>]` and ends with one line `Outcome: done | hard-stop | question | blocked`.

## Context (measured by the chat on `39e3c151b`)

When a metamodel is created, or its tab is opened, or the canvas pane is clicked with nothing
selected, the Properties rail on the right shows the properties of the root package instead of the
metamodel. Alfonso wants the metamodel there.

Root cause, read in the code: `findModelElement(modelid)` in
`frontend/src/components/editor-v2/hooks/useJjomSelection.ts:37-58` is the only function that decides
what `_lastSelected.modelElement` points to when the editor has no selection. It walks
`rawModel.packages`, returns the first class it finds, else the package itself, and only as a last
resort the model id. On a fresh metamodel (one empty package) it returns the package; on a metamodel
with classes it returns the first class, so the rail opens on a class the user never clicked. The
three call sites are all in the same file: the mount effect keyed on `modelid` (`:207`), `deselectAll`
(`:157`) and `onPaneClick` when no graph exists yet (`:245`).

The function's own comment (`:54-57`) says why the model id is a valid value: `DModel` extends
`DModelElement`, and `LModelElement.get_until_parent` (`frontend/src/model/logicWrapper/LModelElement.tsx:617-626`)
tests the class name on the starting element first, so for a `DModel` the `.model` getter resolves to
itself and `Selectors.getActiveModel()` (`frontend/src/redux/selectors/selectors.ts:64`) and
`getLastSelectedModel()` (`:75`) keep working. M1 models already take this path today
(`rawModel.packages` is empty for them, so the function returns the model id), and
`PropertiesWithTreeView.tsx:527-529` describes "the state the rail opens in, where the selection is the
model itself" as the intended design. `PalettePanel.tsx:67-69` and `:100-102` already tolerate a
`DModel` in `_lastSelected`.

Decision (unattended, RC-25): `findModelElement` returns the model id in every case. No renaming, no
new identifier; the function stays, its walk goes.

## COSA

`_lastSelected.modelElement` points to the model itself whenever the editor v2 has no selection: on
tab open, after a pane click, after `deselectAll`. The Properties rail then shows the metamodel (name,
description, its `Info` identity block) and not the package or the first class.

## DOVE

- `frontend/src/components/editor-v2/hooks/useJjomSelection.ts`: `findModelElement` only. The three
  callers do not change (they already handle the returned id).
- `docs/log-inbox/views.md`: this lane's entry (closure).
- This prompt file: the Status line (closure).

Nothing else. No file of §3.2 is touched.

## COME

1. Read `useJjomSelection.ts` whole. Rewrite the body of `findModelElement` so that it returns
   `modelid` and nothing else, and rewrite its doc comment (`:30-36`) to say what it now guarantees:
   the no-selection channel points to the model, which is a `DModelElement`, so `getActiveModel()`
   resolves it to itself. Keep the signature `function findModelElement(modelid: string): string`.
   Delete the `try/catch` and the package walk; do not leave dead branches behind a flag.
2. Before committing, grep the consumers of `_lastSelected.modelElement` that read it as a classifier
   and confirm from their bodies, not from their names, that a model id is accepted:
   `redux/selectors/selectors.ts` (`getActiveModel`, `getLastSelectedModel`),
   `components/editor-v2/panels/PalettePanel.tsx`, `components/Jodie/*.tsx`,
   `jjscript/executor/activeArtifact.ts`, `components/topbar/SaveManager.ts`,
   `components/editors/PropertiesWithTreeView.tsx` (`selectedIsLeaf`, `selectedOwnerName`: a model has
   no `father`, the breadcrumb must not throw), `components/editors/Info.tsx` (the branch that renders a
   `DModel`). Report each in one line: file, line, verdict. If one of them cannot take a model id,
   stop with `Outcome: question` and a `Recommended:` line; do not patch the consumer.
3. Gates from `frontend/`: `npx tsc --noEmit` stays at the baseline of `CLAUDE.md` §17 (14 errors, none
   new), `npx vitest run src/components/editor-v2` green, `npm run build` clean of new warnings.
4. One code commit, pathspec after `--`, file `frontend/src/components/editor-v2/hooks/useJjomSelection.ts`,
   subject `fix(editor-v2): no-selection channel points to the model (P-2026-09-27-0110)`, body with
   the root cause in two lines and the three gate results, `Model:` trailer.
5. Closure, one docs commit: entry at the head of `docs/log-inbox/views.md` (the inbox is empty today) in
   the shape the `log-entry` skill and the last entries of `docs/claude-code-log.md` prescribe (type `fix`, `Corregge: —`, prompt name and this file, files touched, `Smoke visivo:
   chat, localhost:3001` since the chat runs the check), and the Status line of this file flipped to
   `eseguito 2026-09-27 · lane properties-rail · <sha of the code commit>`. `npm run check:docs` from
   `frontend/` must stay 4/4. Files `docs/log-inbox/views.md` and
   `docs/prompts/claude_2026-09-27_0110_prompt_properties_rail_shows_model.md`, subject
   `docs: close the properties rail lane (P-2026-09-27-0110)`, `Model:` trailer.
6. Closing report: the two shas, the gate lines, the consumer table of step 2, then
   `Decisions taken (unattended)` and `Decisions awaiting Alfonso` (P16), then `Outcome: done`.

The visual check is the chat's: on `localhost:3001`, new metamodel from the dashboard, the rail shows
the model; add a class, click the pane, the rail shows the model again; click the class, the rail
shows the class; open an existing metamodel with classes, the rail opens on the model. The chat flips
the Status a second time with the outcome.

Never: `git add .`, `-A`, `-u`, `--no-verify`, push, a file outside DOVE, docs and code in the same
commit, a second dev server, a rename of any identifier.
