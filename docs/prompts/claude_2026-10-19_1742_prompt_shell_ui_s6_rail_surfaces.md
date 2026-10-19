# Shell S6: properties rail surfaces

Prompt-ID: P-2026-10-19-1742
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: full (rail sheets plus an additive prop on JjSelect)
Status: eseguito 2026-10-19, lane P-2026-10-19-1742 (shell-ui-s6, 89f524305); visual check passed (chat, 3016, 1600x1000)
Depends: P-2026-10-19-1725
Request: Alfonso, 2026-10-19 17:05: «si, procedi in automatico con /lane auto anche per l'implementazione».

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-shellui-s6`, branch `shell-ui-s6`, from the trunk commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-1742 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

## Context (do not redo the analysis)
Read §3.1 (Properties rail, Files shared), §3.5, §3.7 (Properties rail row), §3.8 and §4 (S6) of `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md`. The `--shell-*` tokens exist since S1, declared on `.properties-tree-overlay` among others. D-UI-11: rail-only changes go in PWT under `.properties-with-tree-view--floating`, never in the sidebar sheet (TVS).

## COSA
1. Surface: the rail background `--shell-surface-rail` (#f8fafc), tree panel and scope bar transparent or rail-coloured, fields and inputs stay white (`--shell-surface-field`). The rail's **outer** left border stays exactly as it is (`--border-subtle`, D-UI-11): its change waits for Alfonso (A3).
2. Inner neutral borders 1 px `--shell-border` (0.5 px and 1.5 px and `$pc-slate-300`, `#eef2f7` included); radii to `--shell-radius-control` (4 px) for inputs, chips, icons, segments, actions, and `--shell-radius-menu` (8 px) for groups such as `.jj-flags__group`; pills and circles unchanged.
3. Text: no text under 11 px in the rail (`.tree-counter`, `.tree-row__not-rendered-hint`, `.resize-handle__hint`, `.jj-flags__summary`, `.jj-field-required`, `.jj-info-icon` rail-scoped, tree node icons); weights 700 to 600, 600 under 12 px to 500; neutral `#94a3b8`-like text to `--shell-text-3`, except disabled controls (D-UI-13 Em. 6).
4. react-select: add `classNamePrefix="jj-select"` to `JjSelect` (additive: the hashed classes stay) and style `.jj-select__control` under the rail scope (radius 4, 1 px border). Do not edit `buildStyles`: it also renders forms on the canvas.
5. `b.me-2` in the rail: leave the markup (S7 replaces it); style it through a rail-scoped selector that does not depend on `me-2` only if needed, otherwise leave it.
6. Section titles, tree row height, small targets and muted icons are **not** in this lane (S7, S8).

## DOVE
`frontend/src/components/editors/properties-with-tree-view.scss`, `frontend/src/components/editors/info-improvements.scss`, `frontend/src/components/ui/JjSelect/JjSelect.tsx` (one prop), and `frontend/src/components/ui/InfoTooltip/InfoTooltip.scss` only if a rail-scoped rule cannot live in PWT (prefer PWT). Nothing else.

## Gates
typecheck at baseline (CLAUDE.md §17), vitest on tests touching JjSelect, the rail and `dataManagerSection.test.ts`, `npm run build` exit 0, `npm run smoke`. DOM measures at 1600x1000 on three rail states (model, attribute, class selected), Basic and Advanced: rail rect `1200,91,400,877` and canvas rect unchanged; text under 11 px 0; border widths only 1 px (outer border excepted, unchanged); radii only 4, 8, pills and circles; weights at most 600; no selector on `css-*-control`; an authoring panel in the rail unchanged in geometry; a canvas form using JjSelect unchanged computed values; console errors no more than `init_dash`. Report before/after numbers in the entry.

## Closure
Code commit (pathspec). Write the log entry in `docs/log-inbox/shell-ui.md` and the `Status:` flip, uncommitted (RC-17). Start a dev server on port 3016 from this worktree (`npm start -- --port 3016`, detached), write its PID to `~/.jjodel-lanes/P-2026-10-19-1742/dev.pid`, leave it running, and exit with `Outcome: hard-stop` (visual check due). On the GO: commit entry and Status in one docs commit, stop the dev server, `check:docs`, `Outcome: done`.

## NON FARE
No change to `:root` or token files; no rule in `tree-view-sidebar.scss`; no change to `buildStyles`; no change to the rail's outer border; no file outside DOVE; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` §5, §17; `docs/decisions.md` D-UI-11, D-UI-13, R-RAIL-6, R-RAIL-10; the discovery report.
