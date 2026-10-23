# Code generation authoring, slice S1: the Code panel on M2

Prompt-ID: P-2026-10-23-1910
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (implementation; EditorV2.tsx and CodePanel.tsx, no critical-zone file)
Depends: P-2026-10-23-1840
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23 18:19, in the project chat: «code appare su M1 e non su M2 anche se le template sono definite sul metamodello, quindi si deve poter aprire anche su M2»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_authoring.md`). P8 replaced: the chat runs the visual check after the merge (RC-23).

Worktree: `~/jjodel-w-tpleditor`, branch `tpl-editor`, at the discovery commit `02aeec206` plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-1910 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. Dev server for your own checks: `npm start -- --port 3120 --strictPort`, stopped before you exit.

## Read first, and only this
The discovery report: §0, §2 (Code on M2) and the S1 row of §4; the provisional rows R-GEN-19, R-GEN-21 and R-GEN-23 of §6. They are the specification of this slice.

## COSA
1. `codePillVisible` (`codegen/setting.ts`) shows the pill on an M2 canvas under the same rule as on M1, read on that metamodel (R-GEN-19); the test that pins «M1 only» (`setting.test.ts:171`) changes with it, with rows for M2.
2. `CodePanel` receives either a model or a metamodel. On M2 it opens on Templates; Output, Run and Check act on a model chosen among the project's models conforming to the metamodel (new `ui/conformingModels.ts`, project-scoped, first preselected, choice local to the panel and not persisted); with none, Output, Run and Check show an explained empty state. On M1 nothing changes.
3. No pill in consumer mode (R-GEN-23), decided in `EditorV2.tsx`.
4. R-GEN-21 (metaclass navigation on M2) only if the rest is green with time left; otherwise say it is cut.
5. Tests: the `codePillVisible` rows for M2 with the mutations the report lists; `conformingModels` rows. Gates: typecheck, build, `npx vitest run src/codegen`, `npm run check:codegen-lazy` with `VITE_CODEGEN` unset and with `VITE_CODEGEN=true`.
6. Crops for the chat: the pill on the metamodel canvas of the cloned Producer-consumer gallery project, the panel open on Templates, Output with the model selector after Generate, and the empty state on a metamodel with no model.
7. One `feat(codegen)` commit (or two), one docs commit with the log entry in `docs/log-inbox/codegen.md` and this prompt's `Status:` line.

## DOVE
`frontend/src/codegen/setting.ts`, `frontend/src/codegen/__tests__/setting.test.ts`, `frontend/src/components/editor-v2/EditorV2.tsx` (the `CodegenSlot` and the pill site only), `frontend/src/codegen/ui/CodePanel.tsx`, `frontend/src/codegen/ui/CodePanel.scss`, new `frontend/src/codegen/ui/conformingModels.ts` and its test, `docs/log-inbox/codegen.md`, this prompt file.

## NON FARE
No change to the generator, the oracle or template persistence; no Template Editor (slice S2); nothing in the critical zone; no new dependency. No push, no merge.
