# Code generation authoring for 3.2: the Code panel on M2 and a Template Editor (discovery)

Prompt-ID: P-2026-10-23-1840
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (discovery, Phase 1 read-only, then hard stop; the plan feeds the implementation slices)
Depends: none
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23 18:19 and 18:37, in the project chat: the Code panel shows on M1 and not on M2 although the templates are defined on the metamodel, so it must open on M2 too; writing templates in that window is awkward; «mettiamo il template editor in 3.2»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-tpleditor`, branch `tpl-editor`, created by the chat from `alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-1840 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. No subagents, no background tasks. Read-only: no code change in this lane. The discovery report goes to `docs/discovery/discovery_2026-10-23_codegen_authoring.md` (P16: it opens with «## 0. Answer in brief», at most 40 lines), committed with this prompt's `Status:` line and a log entry in `docs/log-inbox/codegen.md`.

## Context
The 3.2 build ships the generator (R-GEN-18, `VITE_CODEGEN=true`; the Experimental setting off by default). Templates live on the metamodel (R-GEN-12, key `genTemplates` in the metamodel's `_state`), are JjEL functions with interpolation (R-GEN-4, R-GEN-10), and are written against the concrete metamodel with read-only access to the STC roles (R-GEN-7). The panel is `frontend/src/codegen/ui/CodePanel.tsx` with an in-panel `TemplateEditor.tsx`; EditorV2 mounts it lazily (`EditorV2.tsx` near 416-460) and shows the «Code» pill only when `modelid` is set (`codePillVisible`, near 622 and 5052), so it never appears on a metamodel canvas. The release is tagged on Thursday 2026-10-29 with a freeze on Tuesday 2026-10-27: the implementation slices must fit Saturday to Monday.

## COSA (read and plan, no code)
1. **Code on M2.** How the panel resolves its model today, what Generate, Run and Check need, and what changes to open it from a metamodel canvas: the Templates tab first, a selector of the models conforming to that metamodel (first one preselected) for Output, Run and Check, and an explained empty state when there is none. Name every file and function the change touches and whether anything in the critical zone (CLAUDE.md §3.2) is involved.
2. **Template Editor.** A full editor for templates, modelled on the existing Transformation Editor for JjTL (find it and describe what it reuses: dock tab or modal, Monaco setup, language registration). Target: the list of templates of the metamodel on the left (add, rename, delete); Monaco in the centre with the template syntax (JjEL with `${…}` interpolation), completion of the metamodel's classes, features and STC roles, and parse errors marked at the right line (the positions R-GEN-5 records); on the right a live preview of the output on a chosen model, refreshed on edit with a debounce; Save writes through the same path as today. Opened from the panel's Templates tab («Open editor») and from the metamodel. Measure what Monaco language support exists for JjEL today.
3. **Slices.** A plan of two to four implementation slices that fit Saturday to Monday, each with its DOVE, gates, probe and visual check, the first one being Code on M2. Say what is cut if time runs short (recommended order of cuts) and what stays for 3.2.x.
4. **Risks.** Bundle (the generator must stay out of the eager closure: `check:codegen-lazy` on and off), template persistence and undo, the Experimental gate, interaction with the Configurator role profiles.
5. **Decisions.** Write the choices you recommend as provisional rows (R-GEN-19 onwards) in the report, not in `docs/decisions.md`; list what needs Alfonso.

## DOVE
Read anything under `frontend/src/codegen/`, `frontend/src/components/editor-v2/`, the Transformation Editor and the JjEL Monaco setup; write only `docs/discovery/discovery_2026-10-23_codegen_authoring.md`, `docs/log-inbox/codegen.md` and this prompt file.

## HARD STOP
After the report is committed: `Outcome: hard-stop`.
