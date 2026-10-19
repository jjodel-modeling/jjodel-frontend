# Main menu cleanup: debug entries, empty Tools items, Polymetric View guard, Help links

Prompt-ID: P-2026-10-19-1745
Chat: C-2026-10-19-1722
Front: maintenance
Lane: fast (two to three files, menu entries plus one guard modal)
Status: eseguito 2026-10-19 · lane menu-cleanup · 2794a2537 · verifica visiva da eseguire (chat, dev server 3112)
Depends: none
Request: Alfonso, 2026-10-19 17:41, project chat (kept locally in `~/.jjodel-lanes/P-2026-10-19-1745/request.md`).

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 replaced: the lane closes in the same session after its code commit; the chat runs the visual checklist (RC-23) on the dev server this lane leaves running, before the merge.

Worktree: `~/jjodel-w-menuclean`, branch `menu-cleanup`, from the trunk commit that carries this prompt. Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`. `frontend/node_modules` is a symlink (P14), leave it.

## Lane discipline
Every reply opens with `[P-2026-10-19-1745 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list; decisions you take go in a «Decisions taken (unattended)» list in the log entry Notes or a short report section. Time limit: 60 minutes. Node: `~/.local/bin/node`. `Navbar.tsx` is 2152 lines: read it with `offset`/`limit` or `rg`, never whole. Before introducing any new identifier, `rg` it under `frontend/src`.

## Context (do not redo the analysis)
The chat read the menus from the DOM on localhost:3000 (dashboard and an open project, Advanced and Basic) and checked every Help URL with curl. Results, as of trunk `c82bfedde`:
- `Navbar.tsx:1520` View › Debug Mode (Advanced only). Debug Mode stays reachable from `pages/settings/AdvancedSettings.tsx`.
- `Navbar.tsx:1577` Analyze › Debug loops / Hide debugger (Advanced, project only).
- `Navbar.tsx:1537` and `:1544` Tools › Metamodel Tools and Tools › Custom Tools, always `disabled: true`.
- `Navbar.tsx:1556-1557` Tools › Polymetric View with a `(beta)` span; it dispatches `JjodelEvents.OPEN_POLYMETRIC`, rendered by `components/polymetric/PolymetricView.tsx`.
- Help (`Navbar.tsx:1599-1618`): every URL answers 200 except `https://docs.jjodel.io/video-pills/` (404). GitHub issues are enabled on the repo; `jjodel.io` has MX records. Keyboard Shortcuts opens its modal. What's New opens the GitHub releases page.

## COSA
1. Remove from the menu: View › Debug Mode and the divisor that only separates it; Analyze › Debug loops / Hide debugger. Remove only the menu entries: the `debug` prop, `debuggerr` state and the comment at `:2122` stay (no deletion of behaviour, RC-26).
2. Remove Tools › Metamodel Tools and Tools › Custom Tools. If the divisor after them becomes leading, remove it too: the Tools menu must not open with a divisor.
3. Polymetric View: drop the `(beta)` span (plain `name`, no `jsx`). Add a guard before the view opens: when the metamodel the view renders has fewer than `POLYMETRIC_MIN_METACLASSES = 10` metaclasses, show a modal saying the metamodel is small and the polymetric rendering is not informative at this size, with two actions, `Open anyway` (opens the view) and `Cancel`. Find in `PolymetricView.tsx` which metamodel and which count the view uses, and apply the threshold to that same count, so guard and view never disagree. Put the guard where the event is handled, not in the menu, so every entry point gets it. The modal must reuse an existing modal or confirm-dialog component of the codebase (search for one already used for a confirmation, for example in the dashboard or project deletion); no new modal component, no new styles beyond what that component already takes.
4. Help: remove `Video Tutorials` (404). Before closing, re-run `curl -s -o /dev/null -w '%{http_code}' -L` on every remaining `https://` URL of `helpItems`; any non-200 (GitHub may answer 403 to an anonymous client: treat 403 on `github.com` as reachable) is removed too and listed in the log entry. Leave `mailto:` as is.
5. No other menu change. Basic mode must look as before except for the Polymetric View label (it is already hidden there) and the Help item removed.

## Gates
typecheck at baseline (CLAUDE.md §17), `npx vitest run` on any test touching `Navbar` or `polymetric`, `npm run build` exit 0, `npm run smoke`. Then start a dev server on port 3112 from this worktree (`npm start -- --port 3112 --strictPort`, detached), check it answers 200, write its PID to `~/.jjodel-lanes/P-2026-10-19-1745/dev.pid` and leave it running.

## Closure
Code commit (pathspec, only the files touched). Then, in one docs commit: the log entry in `docs/log-inbox/maintenance.md` (P9) and the `Status:` flip of this prompt (P13). `npm run check:docs` green. Exit with `Outcome: done`.

## HARD STOP
If the guard needs a change in a critical-zone file (CLAUDE.md §3.2), or if no reusable modal component exists, stop with `Outcome: question` and a `Recommended:` line.

## NON FARE
No change to the File and Edit menus (another lane, P-2026-10-19-1650, is changing File on branch `tpl-e`); no restyle of the menu (front shell-ui); no change to `AdvancedSettings.tsx`; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` (naming checks, §17 baseline), `docs/decisions.md` (D-UI-15: light theme only for checks), `frontend/src/pages/components/Navbar.tsx`, `frontend/src/components/polymetric/PolymetricView.tsx`.
