# Shell S3: status bar

Prompt-ID: P-2026-10-19-1740
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: fast (two style sheets, status bar only)
Status: eseguito 2026-10-19 · lane shell-ui · code b9d279e96, docs commit carrying this line · verifica visiva OK (chat, 3013 at 1600x1000)
Depends: P-2026-10-19-1725
Request: Alfonso, 2026-10-19 17:05: «si, procedi in automatico con /lane auto anche per l'implementazione».

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-shellui-s3`, branch `shell-ui-s3`, from the trunk commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-1740 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`.

## Context (do not redo the analysis)
Read §3.1 (Status bar), §3.6 (rows `.sb-rz__jjodie`, `.sb-rz__bell`), §3.7 (Status bar row) and §4 (S3) of `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md`. The `--shell-*` tokens exist since S1 (`frontend/src/styles/tokens/_shell.scss`), declared on `.app-statusbar` among others.

## COSA
1. Font: the status bar uses `var(--font-sans)` (Inter) instead of the `-apple-system` stack at SB:19; children inherit.
2. Values from the shell tokens: text colours to `--shell-text-1/2/3` (the `#94a3b8` literals become `--shell-text-3`, which paints `#64748b`), no text under 11 px (`.sb-rz__version` 10 to 11), neutral borders 1 px `--shell-border` (`.sb-rz__dot` 1.5 px to 1 px; keep its colour role if it is a ring on a coloured dot, and say so).
3. Hit targets: `.sb-rz__jjodie` and `.sb-rz__bell` 24 x 24 with negative margins, bar height 32 px unchanged, the NotificationCenter anchor rect unchanged.
4. The dark variant (`StatusBarRightZone variant="dark"`, `jjtl/components/JjtlStatusBar.tsx:7`) must not change: scope your rules so it keeps its current computed values, and verify it.

## DOVE
`frontend/src/components/StatusBar.scss`, `frontend/src/components/StatusBarRightZone.scss`. Nothing else under `frontend/src`.

## Gates
typecheck at baseline (CLAUDE.md §17), vitest on tests touching the status bar, `npm run build` exit 0, `npm run smoke` (A3 status-bar intersection must hold). DOM measures on a dev server at 1600x1000: `.app-statusbar` rect `0,968,1600,32` unchanged; 5/5 texts in Inter; no text under 11 px; the two buttons 24 x 24; console errors no more than before (`init_dash` only). Report before/after numbers in the entry.

## Closure
Code commit (pathspec). Write the log entry in `docs/log-inbox/shell-ui.md` and the `Status:` flip, uncommitted (RC-17). Start a dev server on port 3013 from this worktree (`npm start -- --port 3013`, detached), write its PID to `~/.jjodel-lanes/P-2026-10-19-1740/dev.pid`, leave it running, and exit with `Outcome: hard-stop` (visual check due). On the GO: commit entry and Status in one docs commit, stop the dev server, `check:docs`, `Outcome: done`.

## NON FARE
No change to `:root` or to any token file; no change to the dark variant; no file outside DOVE; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` §5 (consumers first), §17; `docs/decisions.md` D-UI-13, D-UI-15; the discovery report.
