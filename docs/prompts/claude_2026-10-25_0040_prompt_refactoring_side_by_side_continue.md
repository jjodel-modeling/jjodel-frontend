# Refactoring side by side, continuation after the context ceiling

Prompt-ID: P-2026-10-25-0040
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (continuation of P-2026-10-25-0020)
Depends: P-2026-10-25-0020
Status: da eseguire
Corregge: 2026-10-25 00:20
Request: Alfonso, 2026-10-25 ~00:12 («vai con l'affiancamento in /lane auto»)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is the handoff of P-2026-10-25-0020; its five unattended decisions stand. The chat authorises the file outside 0020's DOVE that the handoff asks for: `frontend/src/components/abstract/style.scss`, only the blocks around lines 1091..1214 that hide the dock's last panel and force the first to `flex: 1 !important` for the `transformation`/`summary` editor types, scoped so they do not apply when the script tab is beside (`.dock-hbox:not(:has(.script-tab--beside))` or an equivalent narrower selector). No other behaviour of those rules may change: measure a transformation tab before and after. No core change, no critical-zone file.

Worktree: `~/jjodel-w-jjp-sbs`, branch `jjp-sbs`. 0020's work is committed: `f27fe1a3d` and `27eeafa03` (wip, probe 20/23). Before anything else: `pwd`, branch, `git log -3 --oneline`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-25-0040 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as each step is green. One probe run per tool call. Context discipline is why this lane exists (0020 hit the ceiling at 14 minutes): never read a file over 200 lines whole; `style.scss` only by the cited range; never print probe, test, build or typecheck output beyond `tail -20` or a `grep`; read the handoff once. If the context passes about 140k, commit what is green, update the handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-sbs.md` covering 0020 and 0040. Nothing merges anywhere: the chat merges.

## Read first, and only this

`~/.jjodel-lanes/P-2026-10-25-0020/handoff.md`. The last 30 lines of `~/.jjodel-lanes/P-2026-10-25-0020/probe-refactoring-side-by-side.log`. The COSA of `docs/prompts/claude_2026-10-25_0020_prompt_refactoring_side_by_side.md`.

## COSA

1. The `style.scss` scoping above; then check whether a `data-layout-mode` cap applies to the right panel by default and remove its effect for the beside layout only.
2. The three failing checks of `refactoring-side-by-side.ts`: the two panels side by side with disjoint x ranges, the 40/60 share (± 3 %), the ghost edges on the real canvas. Explain the `rsbOrg` model showing in the beside panel noted in the handoff, and fix it if it is a bug of this lane (for an M2 target the beside tab is the metamodel's).
3. Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` (re-run once on the same server on the known first-load timeout), the probes `refactoring-split-preview.ts` (at 1080 px), `jjodie-m2-preview.ts`, `jjodie-s4c-apply-undo.ts`. Crops `sbs_idle.png` and `sbs_previewing.png` into `~/.jjodel-lanes/P-2026-10-25-0040/`.
4. Docs commit: log entry (short discovery of 0020, the decisions, every source file with its reason, the transformation-tab measure before and after), Status of 0020 and of this prompt.

## HARD STOP

None unless a stop condition fires: close with `Outcome: done` and the probe results.

## NON FARE

No critical-zone file, no `reducer.ts`, no planner change, no second canvas instance. No merge, no push.
