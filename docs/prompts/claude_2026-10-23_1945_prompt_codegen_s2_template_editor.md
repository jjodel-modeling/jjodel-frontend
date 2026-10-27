# Code generation authoring, slice S2: the Template Editor tab

Prompt-ID: P-2026-10-23-1945
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (implementation; new modules under frontend/src/codegen/ui/, one button in CodePanel.tsx, no critical-zone file)
Depends: P-2026-10-23-1910
Status: eseguito 2026-10-23 · lane codegen · 12f7bf5db, 540fa488a, 5fdbe37e9 · templateDrafts.ts added outside DOVE (unattended) · lazy gate on green, off not run (ticket)
Corregge: none
Request: Alfonso, 2026-10-23 18:19 and 18:37, in the project chat: «scrivere le template in quella finestra è un po' scomodo»; «mettiamo il template editor in 3.2»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_authoring.md`). P8 replaced: the chat runs the visual check after the merge (RC-23).

Worktree: `~/jjodel-w-tpleditor`, branch `tpl-editor`. Before anything else: `git merge --ff-only alfonso-frontend-jjtl` is not needed (the branch was merged into the trunk at `a7f34edc4`; keep working on it as is), then `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-1945 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as the gates are green, in more than one commit if the work splits (language, markers, tab, button). One probe run per tool call. Dev server for your own checks: `npm start -- --port 3121 --strictPort`, stopped before you exit. If the context gets heavy, write a handoff in the lane folder and stop with `Outcome: hard-stop` rather than run out.

## Read first, and only this
The discovery report: §0, §3 (Template Editor), the S2 row of §4, §5 (risks) and the provisional rows R-GEN-20, R-GEN-22, R-GEN-23 and R-GEN-24 of §6. They are the specification of this slice. Read the Transformation Editor files the report names only where you reuse them.

## COSA
1. A dock tab `codegen_tpl_<metamodelId>` (R-GEN-20), one per metamodel, opened through `ui/openTemplateEditor.ts` from the lazy chunk; refused in consumer mode (R-GEN-23).
2. Layout: on the left the list of the metamodel's templates (add, rename, delete; the same rules the in-panel editor applies today); in the centre Monaco with the language `jjel-template` (`ui/templateLanguage.ts`: Monarch tokens for JjEL with `${…}` holes, R-GEN-24); parse errors as Monaco markers at the right line and column (`ui/templateMarkers.ts`, from `parseTemplate`, the positions §3 names).
3. Save only on the button or Ctrl/Cmd+S, through `templatesPatch` and the `state` setter, one undo step; drafts live in the tab with a dirty mark per template; a clean draft follows outside writes (R-GEN-22). Closing a tab with unsaved drafts asks before discarding.
4. «Open editor» in the Templates tab of the Code panel (M1 and M2) opens the tab on the selected template.
5. Tests: `templateMarkers` rows with the mutations §4 lists (line off by one; column of the hole instead of the body); a unit test of the draft and dirty rules if they are a pure function. Gates: typecheck, build, `npx vitest run src/codegen`, `npm run check:codegen-lazy` in the «on» mode (the «off» mode is known red since `.env.production` sets the flag, ticket in `docs/log-inbox/codegen.md`); every new module is reached only from the CodePanel chunk.
6. One docs commit: the log entry in `docs/log-inbox/codegen.md`, this prompt's `Status:` line.

## DOVE
New `frontend/src/codegen/ui/TemplateEditorTab.tsx`, `TemplateEditorTab.scss`, `openTemplateEditor.ts`, `templateLanguage.ts`, `templateMarkers.ts` and their tests; `frontend/src/codegen/ui/CodePanel.tsx` (the button only); `docs/log-inbox/codegen.md`; this prompt file. Reuse, do not edit, the Transformation Editor and `DockManager` (R-GEN-20: no change to `DockManager`).

## NON FARE
No live preview (S3) and no completion (S4); no change to the generator, the oracle or template persistence beyond calling the existing write path; nothing in the critical zone; no new dependency. No push, no merge.
