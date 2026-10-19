# Shell S4: editor toolbar and left palette

Prompt-ID: P-2026-10-19-1741
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: full (one large shared sheet, EditorV2.scss lines 219-1579 only)
Status: da eseguire
Depends: P-2026-10-19-1725
Request: Alfonso, 2026-10-19 17:05: «si, procedi in automatico con /lane auto anche per l'implementazione».

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-shellui-s4`, branch `shell-ui-s4`, from the trunk commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-1741 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

## Context (do not redo the analysis)
Read §3.1 (Left palette, Editor toolbar, Files shared), §3.7 (Toolbar, Palette rows), §3.8 (`.toolbar-btn` collisions, source-text tests on E) and §4 (S4) of `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md`. The `--shell-*` tokens exist since S1, declared on `.editor-v2-toolbar` and `aside.editor-v2-palette` among others.

## COSA
1. Toolbar (`.editor-v2-toolbar`, scoped, never the unscoped `.toolbar-btn`): radii to `--shell-radius-control` (4 px) for buttons, triggers, dropdowns, badges, command buttons; `.toolbar-commands` group to `--shell-radius-menu` (8 px); neutral borders 1 px `--shell-border` (the 0.5 px dropdown borders and the `#f8fafc` bottom border included); `.toolbar-group__label` 9.5 to 11 px; weights 700 to 600 and 600 under 12 px to 500 (`.validation-freshness`); `#94a3b8`-like text (`--text-dim`) to `--shell-text-3`, except inside a disabled control (D-UI-13 Em. 6).
2. Palette (`aside.editor-v2-palette`): background `--shell-surface-rail` (#f8fafc); items stay readable, their own background white if they have one; inner hairlines 1 px `--shell-border`; radii 4/8 as above; `.palette-instances__title` 11 px and `--shell-text-2`, uppercase kept (it is the category label); `.palette-hint__key` 11 px, radius 4. The palette's **outer** right border stays exactly as it is (`--border-subtle`, D-UI-11): its change waits for Alfonso (A3).
3. Muted action icons in Advanced only: toolbar icon buttons `--shell-text-3`, `--shell-text-1` on hover and focus-visible, under `html[data-mode="advanced"]`; Basic unchanged.

## DOVE
`frontend/src/components/editor-v2/EditorV2.scss`, lines 219-1579 only (toolbar and palette blocks). Nothing else. Do not touch the canvas, vertex, rail-in-editor or menu blocks of the same file.

## Gates
typecheck at baseline (CLAUDE.md §17), vitest on `dataManagerPicker.test.ts`, `irSelectionRing.test.ts`, `inheritanceStyle.test.ts` and any test reading E, `npm run build` exit 0, `npm run smoke`. DOM measures at 1600x1000 with a metamodel open in the editor, Basic and Advanced: toolbar rect `201,51,1398,40` and palette rect `1,51,200,916` unchanged; canvas rect unchanged; text under 11 px 0 in both regions; border widths only 1 px; radii only 4, 8, pills and circles; weights at most 600; `.toolbar-btn` outside the editor (Catalog, Console) unchanged computed values; console errors no more than `init_dash`. Report before/after numbers in the entry.

## Closure
Code commit (pathspec). Write the log entry in `docs/log-inbox/shell-ui.md` and the `Status:` flip, uncommitted (RC-17). Start a dev server on port 3014 from this worktree (`npm start -- --port 3014`, detached), write its PID to `~/.jjodel-lanes/P-2026-10-19-1741/dev.pid`, leave it running, and exit with `Outcome: hard-stop` (visual check due). On the GO: commit entry and Status in one docs commit, stop the dev server, `check:docs`, `Outcome: done`.

## NON FARE
No change to `:root` or token files; no change to the palette's outer border; no unscoped `.toolbar-btn` rule; no file outside DOVE; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` §3.2 (critical zone: not involved), §5, §17; `docs/decisions.md` D-UI-11, D-UI-13, R-RAIL-10; the discovery report.
