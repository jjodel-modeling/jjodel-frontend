# Jjodie M2 scripts, continuation after the context ceiling

Prompt-ID: P-2026-10-24-1600
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (continuation of P-2026-10-24-1520)
Depends: P-2026-10-24-1520
Status: da eseguire
Corregge: 2026-10-24 15:20
Request: Alfonso, 2026-10-24 15:15 («chiudiamo tutto senza aspettare la 3.2», «Dentro la 3.2»)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is the handoff of P-2026-10-24-1520. The two files outside 1520's DOVE are authorised by the chat (RC-25, the recommended answer of 1520): `frontend/src/components/editor-v2/preview/PreviewBar.tsx` (M2 scope in `applyScript`, plus the one line for effects on the other level) and `frontend/src/components/Jodie/ChatMessages.tsx` around lines 60..64 (the card for an M2 reply). No core change and no critical-zone file.

Worktree: `~/jjodel-w-jjp-m2`, branch `jjp-m2`. The planner work of 1520 is committed as `4ad31c758` (wip, untested), and `jjodie-panel` (with jjp-low, which touched `PreviewBar.tsx`) is merged in `c054ac674`. Before anything else: `pwd`, branch, `git log -3 --oneline`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-1600 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as each step is green. One probe run per tool call. Context discipline is the reason this lane exists: the previous one hit 200k. Never read `effectsPlanner.ts` whole (about 1050 lines now): use grep-found ranges; never print a test, build, typecheck or probe output beyond `tail -20` or a `grep`; read the handoff once. If the context passes about 140k, commit what is green, update the handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-m2.md` covering 1520 and 1600. Nothing merges anywhere: the chat merges.

## Read first, and only this

`~/.jjodel-lanes/P-2026-10-24-1520/handoff.md` (not `handoff.diff`: the diff is already committed). The COSA, DOVE and NON FARE of `docs/prompts/claude_2026-10-24_1520_prompt_jjodie_m2_scripts.md`.

## COSA

In this order, committing after each step:

1. Run `effectsPlannerM2.test.ts` and the existing planner tests; fix the planner until green. Then the mutation bench on the new M2 branches (at least six mutants, all killed), named in the commit message.
2. `ChatMessages.tsx`: an M2 reply gets the script card. `PreviewBar.tsx`: `applyScript` runs with the scope of the open editor level, M2 included; for a mixed script the bar shows the effects on the other level in one line.
3. `previewElements.ts`: M2 ghost nodes (class, enumeration, package) with their planned rows, ghost edges for references and generalizations, in the existing ghost style. `previewApplyCheck.ts`: the planned/real comparison per metaclass covers M2.
4. The probe `frontend/scripts/probe/jjodie-m2-preview.ts` as specified in 1520, crops into `~/.jjodel-lanes/P-2026-10-24-1600/`.
5. Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` (re-run once on the same server on the known first-load timeout), the probes `jjodie-s4c-apply-undo.ts` and `jjodie-udo-after-apply.ts` still green. Then the docs commit: log entry, Status of 1520 and of this prompt.

## HARD STOP

None unless a stop condition fires: close with `Outcome: done` and the probe results.

## NON FARE

No critical-zone file, no `reducer.ts`, no grammar change (R-JJD-4, R-JJD-10). No merge, no push.
