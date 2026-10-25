# Jjodie front: four small tickets

Prompt-ID: P-2026-10-25-1020
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (small fixes, code, gates and probes)
Depends: none
Status: da eseguire
Corregge: 2026-10-24 06:55, 2026-10-24 04:30, 2026-10-24 02:55, 2026-10-24 22:55
Request: Alfonso, 2026-10-25 10:15, in the project chat («va bene» on the cleanup lane of the four small tickets)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-tix`, branch `jjp-tix`, cut from `alfonso-frontend-jjtl` at `59437aac5` plus the commit that
adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-25-1020 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 70 minutes. No subagents, no
background tasks. One commit per ticket as soon as its gates are green. One probe run per tool call. Context
discipline: never `cat` a whole large file or log; read by grep-found ranges; test, build and probe output through `tail`
or `grep`. Dev server only on a free port in 3010..3019 (check with `lsof`; other lanes are running), never 3000, 3001 or
3003; stop it at the end. Light theme only. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:`
trailer. Log entry in `docs/log-inbox/jjodie-ui-tix.md`. Nothing merges anywhere: the chat merges. Another session's
lanes are working on the refactoring planner and the JjScript grammar (`jjscript/executor/refactorPlanner.ts`,
`jjscript/refactor/`, the parser): do not touch those files.

## COSA

1. **Error red in the Jjodie conversation** (`docs/log-inbox/jjodie-ui-jto.md`, ticket): `.jodie-messages code { color:
   #334155 !important }` (JodieWindow.css, about line 1815) beats the JjEL error colour. Make the error colour win for
   error output only, without raising specificity elsewhere; DOM measure: an error entry renders rgb(185, 28, 28), a
   normal entry keeps its colour.
2. **NaN paths in the megamodel** (`docs/log-inbox/jjodie-ui-fx2.md`, ticket): skip zero-length segments in
   `buildRoundedPath` (`components/megamodel/MegamodelEdge.ts`), with a unit test in its existing test file that fails
   before the fix; re-run `jjodie-s6b-scripts-listing.ts` and check no console error about invalid SVG paths.
3. **Discard not clickable in Playwright** (`docs/log-inbox/jjodie-ui-s2.md`, ticket): find why the preview bar's Discard
   is never «stable» for Playwright (an animation, a transform, a re-render each frame) and fix the cause in the preview
   bar's code or styles; the S2 and S4b probes click Discard with a normal Playwright click and pass.
4. **Colours in Jjodie's script blocks** (the S6 and S2 blocks in messages, `ScriptBlock`, the card's «Show script»):
   use the `jjscript` Monarch tokenizer of P-2026-10-24-2255 (`jjscript/editor/`) through Monaco's `colorize` (or the
   existing highlighter of the message renderer if it is simpler and reuses the same tokens), so keywords, strings and
   comments have the editor colours; DOM measure on a keyword, a string and a comment.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Then the docs commit.

## HARD STOP

None: `Outcome: done` with one line of measures per ticket. A ticket that cannot be fixed inside its files becomes a
`Recommended:` line, not a stop for the others.

## NON FARE

No change to the refactoring planner, grammar or parser, no critical-zone file, no `reducer.ts`. No merge, no push.
