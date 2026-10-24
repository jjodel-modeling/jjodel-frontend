# Jjodie: keep the Quick tip clear of the Properties panel

Prompt-ID: P-2026-10-24-0656
Lane: full (small, R-JJD-11)
Depends: P-2026-10-24-0240
Chat: C-2026-10-24-0020
Front: jjodie-ui
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 06:51, in the project chat («ok alle raccomandazioni» on the night digest)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-qt2`, branch `jjp-qt2`, cut from `jjodie-panel` at `eb80f99d5` plus the commit that adds this
prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short`. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0656 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files (CLAUDE.md §3.2) are not authorised: if one is needed, stop.
Time limit: 60 minutes. No subagents, no background tasks. One probe run per tool call. Context discipline: never `cat`
a whole large file or log; read by grep-found ranges; test, build and probe output through `tail` or `grep`. Dev server
only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Light theme only.
Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Nothing merges anywhere: the chat merges.
Log entry in `docs/log-inbox/jjodie-ui-qt2.md`.

## Read first, and only this

Rows R-JJD-7 and R-JJD-11. `docs/log-inbox/jjodie-ui-fx1.md` (why the tip falls behind the panel: fixed wrapper without
z-index, panel at z 900).

## COSA

The Quick tip (`.notification-widget`) moves left of the Properties rail when the rail is shown, using the rail width
the code already publishes (`--jj-rail-width` or `--jj-canvas-right-inset`; grep and reuse, do not invent a second
variable), on top of the dock offset of P-2026-10-24-0240. If the wrapper's stacking is the real cause, give the fixed
wrapper the z-index the tip needs instead. Re-run `frontend/scripts/probe/jjodie-dock.ts` and add one measure: with the
rail open and Jjodie docked, the tip's box intersects neither the rail nor the dock. One crop under
`~/.jjodel-lanes/P-2026-10-24-0656/`. Gates: typecheck at baseline, vitest (summary), build. Commit
(`fix(ui): keep the quick tip clear of the properties panel`), then the docs commit.

## HARD STOP

None: `Outcome: done` with the measures.

## NON FARE

No edit beyond the notification widget stylesheet (and its wrapper markup class if strictly needed) and the probe. No
merge, no push.
