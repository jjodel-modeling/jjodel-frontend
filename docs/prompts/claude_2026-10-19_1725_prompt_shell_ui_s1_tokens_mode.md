# Shell S1: shell token layer and data-mode

Prompt-ID: P-2026-10-19-1725
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: fast (three files, additive, no visible change)
Status: da eseguire
Depends: P-2026-10-19-1710
Request: Alfonso, 2026-10-19 17:05: «si, procedi in automatico con /lane auto anche per l'implementazione».

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 replaced: no visible change is expected, so the lane closes in the same session; the chat runs the DOM check on the dev server this lane leaves running, before the merge.

Worktree: `~/jjodel-w-shellui-s1`, branch `shell-ui-s1`, from `595857304` (the discovery commit). Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-1725 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`.

## Context (do not redo the analysis)
Read §3.2, §3.3 and §6 of `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md` and nothing else of it. They fix the token set, where it lives and how the mode reaches the DOM. `--shell-` is unused in the repo (checked there).

## COSA
1. New `frontend/src/styles/tokens/_shell.scss`: the `--shell-*` set of §3.2, declared once on the selector list `nav.nav-container, .editor-v2-toolbar, aside.editor-v2-palette, .properties-tree-overlay, .app-statusbar, .context-menu`, as aliases of the existing tokens named there; the only literals are `--shell-hit: 24px`, the two density heights and the menu shadow. Mode-dependent values (`--shell-row-height` 26 to 24, `--shell-menu-item-height` 36 to 28) under `html[data-mode="advanced"] :is(<same list>)`. A header comment says the canvas must never read `--shell-*`.
2. Import it from `frontend/src/styles/tokens/index.scss`, after the files it aliases.
3. `frontend/src/pages/components/Navbar.tsx`: one `useEffect` next to the restore effect near :919-925, keyed on `props.advanced`, setting `document.documentElement.dataset.mode = props.advanced ? 'advanced' : 'basic'`. Read Redux only (R-RAIL-13); no new consumer of `useInterfaceMode`.
4. No rule consumes `--shell-*` yet: computed styles must not change anywhere.

## Gates
typecheck at baseline (CLAUDE.md §17), `npx vitest run` on `lastSaved.test.ts` and any test touching Navbar, `npm run build` exit 0, `npm run smoke`. Then start a dev server on port 3011 from this worktree (`npm start -- --port 3011`, detached), check it answers 200, write its PID to `~/.jjodel-lanes/P-2026-10-19-1725/dev.pid` and leave it running.

## Closure
Code commit (pathspec, the three files). Then, in one docs commit: the log entry in `docs/log-inbox/shell-ui.md` (P9) and the `Status:` flip of this prompt (P13). `npm run check:docs` green. Exit with `Outcome: done`.

## NON FARE
No change to `:root` values or to any existing token; no rule that reads `--shell-*`; no file outside the three above (plus the log inbox and this prompt's Status); no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` (naming checks, §17 baseline), `docs/decisions.md` (R-RAIL-10, R-RAIL-13, D-UI-13, D-UI-15), the discovery report above.
