# Jjodie fix after the integration check: S2 probe, megamodel NaN paths

Prompt-ID: P-2026-10-24-0505
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (small fix lane)
Depends: P-2026-10-24-0431, P-2026-10-24-0430
Status: da eseguire
Corregge: 2026-10-24 03:10
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-fx2`, branch `jjp-fx2`, cut from `jjodie-panel` at `ee0ed80ef` (every slice, S6c and the
integration report merged) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0505 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 50 minutes. No subagents, no
background tasks. One probe run per tool call. Context discipline: never `cat` a whole large file or log. Dev server
only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Subject lines
without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-fx2.md`.
Nothing merges anywhere: the chat merges.

## Read first, and only this

`docs/discovery/discovery_2026-10-24_jjodie_panel_integration_check.md`, `docs/log-inbox/jjodie-ui-fin.md`,
`docs/log-inbox/jjodie-ui-s6c.md` (its ticket on NaN SVG paths), `docs/log-inbox/jjodie-ui-s6b.md`.

## COSA

1. `frontend/scripts/probe/jjodie-s2-script-card.ts:235` still expects Edit script and Open as file disabled; S5 enabled
   them on purpose. Update that check to the S5 state (enabled, with their current titles) and re-run the probe: 26/26.
2. Opening the megamodel view with a script linked to a model logs two console errors about invalid SVG paths with
   `NaN` coordinates (S6c ticket). Find the cause by grep and short reads in the megamodel files that S6b changed
   (`MegamodelView.tsx`, `megamodelScripts.ts`, the layout); if it lies in the S6b script nodes or their links (for
   example a script node or edge without a position, or a link to a model id not laid out), fix it there with a unit
   test, and re-run `jjodie-s6b-scripts-listing.ts` and `jjodie-s6c-*.ts` checking no console errors. If the cause lies
   outside the S6b and S6c changes, write it in the log as a ticket and do not fix it.
3. Delete nothing; leave the gitignored `_tmp_lane_vite_3010.config.ts` alone.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commits as needed
(`test(probe): ...`, `fix(megamodel): ...`).

## HARD STOP

None: close with the docs commit (log entry, Status of this prompt and of P-2026-10-24-0431) and `Outcome: done`.

## NON FARE

No edit outside the probes named and the S6b and S6c megamodel changes. No critical-zone file. No merge, no push.
