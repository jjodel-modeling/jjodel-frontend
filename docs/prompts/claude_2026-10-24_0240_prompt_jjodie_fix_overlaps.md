# Jjodie fix: notification widget over the dock, context chip at 460

Prompt-ID: P-2026-10-24-0240
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (fix after the S1a and S1b probes)
Depends: P-2026-10-24-0210, P-2026-10-24-0211
Status: eseguito 2026-10-24 · lane jjp-fx1 · 12906d19a · probes green (dock 35/35, S1b 33/33), tip under the open rail noted in the log
Corregge: 2026-10-24 01:35
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-fx1`, branch `jjp-fx1`, cut from `jjodie-panel` at `4179671bc` (S1a, S1a probe, S1b merged)
plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only
the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0240 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 50 minutes. No subagents, no
background tasks. One probe run per tool call. Context discipline: never `cat` a whole large file or log. Dev server
only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Light theme only.
Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in
`docs/log-inbox/jjodie-ui-fx1.md`. Nothing merges anywhere: the chat merges `jjp-fx1`.

## Read first, and only this

The log entries `docs/log-inbox/jjodie-ui-s1p.md` and `docs/log-inbox/jjodie-ui-s1b.md`.

## COSA

1. The Quick tip card (`.notification-widget`, `frontend/src/components/NotificationWidget/notification-widget.scss`,
   about line 9) is `position: fixed` at the right edge and covers the docked Jjodie's input (S1a probe: x 1256, w 320,
   z 1000). Move it left by the dock width: `right: calc(<its current right> + var(--jj-jodie-dock-width, 0px))`. The
   S1a lane's recommendation, adopted unattended (RC-21).
2. The context chip in the Jjodie header shrinks to its icon at the default width 460 (S1a probe). With the S1b
   header now in place, measure it again at 460; if it still collapses, let it keep at least the level and a truncated
   model name (ellipsis) at 460 by giving it flex priority over the spacer, without changing the header order.
3. Re-run `frontend/scripts/probe/jjodie-dock.ts` and `frontend/scripts/probe/jjodie-s1b-header-composer.ts`; both must
   pass, including no fixed element over the dock. Save one crop of Jjodie open with the Quick tip visible under
   `~/.jjodel-lanes/P-2026-10-24-0240/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`fix(jjodie): keep the quick tip and the context chip clear of the dock`).

## HARD STOP

None: close with the docs commit (log entry, Status of this prompt) and `Outcome: done`, with the measures.

## NON FARE

No edit beyond the two stylesheets and, if strictly needed, `JodieHeader.tsx` markup classes. No merge, no push.
