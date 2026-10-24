# Refactoring page, continuation after the context ceiling

Prompt-ID: P-2026-10-24-2340
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (continuation of P-2026-10-24-2320)
Depends: P-2026-10-24-2320
Status: da eseguire
Corregge: 2026-10-24 23:20
Request: Alfonso, 2026-10-24 ~23:15 («proceedi con una /lane auto»)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is the handoff of P-2026-10-24-2320. The unattended decisions listed in that handoff stand (class-box renderer instead of an embedded canvas, tab-local preview state, `applyAsOneStep` exported from `PreviewBar.tsx`, launcher on the right edge of the Refactoring tab). No core change, no critical-zone file, no `reducer.ts`.

Worktree: `~/jjodel-w-jjp-rfa`, branch `jjp-rfa`. The work of 2320 is committed: `97ae687f2` (planner warning), `c822cf9b7` (diagnostics and view model), `383a3f2b0` (wip: layout, preview pane and bar, untested, probe red). Before anything else: `pwd`, branch, `git log -4 --oneline`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-2340 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as each step is green. One probe run per tool call. Context discipline is why this lane exists: the previous one hit the ceiling in 16 minutes. Never read a file whole if it is over 200 lines; never print a probe, test, build or typecheck output beyond `tail -20` or a `grep`; read the handoff once and do not re-read the 2320 prompt beyond its COSA. If the context passes about 140k, commit what is green, update the handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-rfa.md` covering 2320 and 2340. Nothing merges anywhere: the chat merges.

## Read first, and only this

`~/.jjodel-lanes/P-2026-10-24-2320/handoff.md`. The last 30 lines of `~/.jjodel-lanes/P-2026-10-24-2320/probe-refactoring-split-preview.log` (it fails at `refactoring-split-preview.ts:141`). The COSA of `docs/prompts/claude_2026-10-24_2320_prompt_refactoring_page_split_preview.md`.

## COSA

The «Still to do» of the handoff, in order:

1. Fix the probe or the UI until `refactoring-split-preview.ts` is green (gutter dots, underline, list, counter, Preview with ghost classes, struck features and edges, Apply, metamodel changed, one Cmd+Z restores it). Crops into `~/.jjodel-lanes/P-2026-10-24-2340/`.
2. The launcher rule in `JodieWindow.css` applies only when the Refactoring tab is active (measure on another tab).
3. Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` (re-run once on the same server on the known first-load timeout), the probes of 2200, 2215 and 2255 still green.
4. Turn the wip commit into clean history only if trivial (a fixup on top is fine); then the docs commit: log entry with the short discovery of 2320 and the list of the 10 source files with reasons, Status of 2320 and of this prompt.

## HARD STOP

None unless a stop condition fires: close with `Outcome: done` and the probe results.

## NON FARE

No critical-zone file, no `reducer.ts`, no JjScript grammar change, no refactoring operations (P-2026-10-24-2321). No merge, no push.
